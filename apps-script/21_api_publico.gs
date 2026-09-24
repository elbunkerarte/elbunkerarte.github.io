/**
 * EL BUNKER - Public actions: registration (Form 1), group members, "Mi
 * inscripción" (status + backing-track upload), schedule change (Form 2),
 * live video-link check and the public configuration.
 *
 * Every write follows the same order: replay a repeated request -> anti-abuse
 * guard -> slow work outside the lock (Drive, network) -> lock -> idempotency
 * ledger -> write. The ledger is checked INSIDE the lock: two identical
 * requests arriving together (a real double tap) wait for each other and the
 * second one gets the first one's answer instead of a second row.
 */

// ---------------------------------------------------------------------------
// Shared guards
// ---------------------------------------------------------------------------

/** How fast a person could possibly fill each form, as a share of the configured minimum. */
var MIN_FILL_FACTOR = { inscripcion: 1, integrante: 0.5, pista: 0.3, cambio: 0.5, consulta: 0 };

/**
 * Anti-abuse checks that run before anything is stored. Returns null when the
 * request may continue, or an error payload. Apps Script does not expose the
 * visitor's IP, so limits are global per minute and per ID number per hour.
 */
function guardSubmission(datos, kind) {
  if (normalizarTexto(datos.hp_field)) {
    registrar('anonimo', '', 'BLOQUEO_CAMPO_TRAMPA', kind, '');
    return { ok: false, motivo: 'TRAMPA',
             error: 'No pudimos procesar el envio. Si eres una persona, recarga la pagina e intentalo de nuevo.' };
  }
  var testData = isTestData(datos);
  if (testData && !esPruebas()) {
    registrar('anonimo', '', 'BLOQUEO_DATO_DE_PRUEBA', kind, '');
    return { ok: false, motivo: 'DATO_DE_PRUEBA', error: 'Produccion no admite datos de prueba.' };
  }
  if (testData) return null;                       // the rehearsal loads 130 rows in a burst on purpose

  var minMs = cfgNumero('tiempo_minimo_formulario_seg', 10) * 1000 * (MIN_FILL_FACTOR[kind] || 0);
  if (minMs > 0 && normalizarComparable(datos.source || 'WEB') === 'WEB') {
    var elapsed = Number(datos.form_elapsed_ms);
    if (!isFinite(elapsed) || elapsed < minMs) {
      registrar('anonimo', '', 'BLOQUEO_VELOCIDAD', kind, String(elapsed));
      return { ok: false, motivo: 'VELOCIDAD',
               error: 'El envio fue demasiado rapido. Revisa tus datos y vuelve a enviarlo.' };
    }
  }

  var cache = CacheService.getScriptCache();
  var minuteKey = 'rl:' + kind + ':' + Math.floor(Date.now() / 60000);
  var perMinute = Number(cache.get(minuteKey) || 0) + 1;
  cache.put(minuteKey, String(perMinute), 120);
  if (perMinute > cfgNumero('limite_envios_minuto', 30)) {
    registrar('anonimo', '', 'BLOQUEO_LIMITE_GLOBAL', kind, String(perMinute));
    return { ok: false, motivo: 'LIMITE_GLOBAL',
             error: 'Estamos recibiendo muchos envios en este momento. Espera un minuto y vuelve a intentarlo.' };
  }
  var doc = normalizarCedula(datos.id_number);
  if (doc) {
    var docKey = 'rl:doc:' + kind + ':' + doc + ':' + Math.floor(Date.now() / 3600000);
    var perDoc = Number(cache.get(docKey) || 0) + 1;
    cache.put(docKey, String(perDoc), 3700);
    var limit = cfgNumero('limite_envios_documento_hora', 5) * (kind === 'consulta' ? 4 : 1);
    if (perDoc > limit) {
      registrar('anonimo', '', 'BLOQUEO_LIMITE_DOCUMENTO', kind, '');
      return { ok: false, motivo: 'LIMITE_DOCUMENTO',
               error: 'Hubo demasiados envios con este documento en la ultima hora. Si necesitas corregir algo, escribenos.' };
    }
  }
  return null;
}

/** The stored answer of an already-processed request, or null. Cheap: no lock. */
function replayIfRepeated(key) {
  if (!key) return null;
  var previous = buscarIdempotencia(key);
  if (!previous) return null;
  try { return Object.assign({ repetido: true }, JSON.parse(previous)); }
  catch (e) { return { repetido: true, ok: true }; }
}

/** Lock first, ledger second: see the header of this file. */
function exactlyOnce(key, fn) {
  return conBloqueo(function () { return unaSolaVez(key, fn); });
}

function webAppUrl() {
  try { return ScriptApp.getService().getUrl() || ''; } catch (e) { return ''; }
}

function membersLink(groupCode) {
  return webAppUrl() + '?p=integrantes&g=' + encodeURIComponent(groupCode) + '&k=' + groupAccessKey(groupCode);
}

// ---------------------------------------------------------------------------
// Form 1 - registration of a project (soloist, duo or group)
// ---------------------------------------------------------------------------

/**
 * Validates server-side, stores ALWAYS (never silently rejects) and returns a
 * verdict the participant can understand. Codes are NOT issued here: they are
 * issued in an operator-run batch after review, so a wave of submissions can
 * not burn the 100 seats on rows that later turn out to be duplicates.
 */
function accionInscribir(datos) {
  datos = datos || {};
  if (!cfgBool('inscripciones_abiertas', true)) {
    return { ok: false, error: 'Las inscripciones estan cerradas.', cerrado: true };
  }
  var key = 'inscripcion:' + (datos.client_submission_id || Utilities.getUuid());
  var replay = replayIfRepeated(key);
  if (replay) return replay;
  var blocked = guardSubmission(datos, 'inscripcion');
  if (blocked) return blocked;

  var videoUrl = normalizarTexto(datos.video_url);
  var video = videoUrl ? cachedVideoCheck(videoUrl) : videoStatusWithoutProbe('');

  var result = exactlyOnce(key, function () { return registerProject(datos, video); });
  if (result && result.ok !== false && !result.repetido) notifyReception(result.submission_id);
  return result;
}

function registerProject(datos, video) {
  var options = opcionesValidacion();
  var verdict = validarInscripcion(datos, options);
  var mode = normalizeParticipationMode(datos.participation_mode);
  var group = isGroupMode(mode);
  var existing = leerHoja(HOJA.REGISTRO);
  var submissionId = nuevoId('S');

  var candidate = {
    submission_id: submissionId,
    normalized_id_number: normalizarCedula(datos.id_number),
    normalized_email: normalizarEmail(datos.email),
    normalized_phone: normalizarTelefono(datos.whatsapp)
  };
  var dup = detectarDuplicado(candidate, existing);

  var displayName = normalizarTexto(datos.artistic_name);
  var matchKey = group ? groupMatchKey(displayName) : '';
  var groupMatch = matchKey
    ? detectGroupMatch({ submission_id: submissionId, group_match_key: matchKey }, existing)
    : { match: false, ref: '' };

  var status = verdict.eligibility_status;
  if (dup.duplicate_flag) status = ESTADO_ELEGIBILIDAD.DUPLICADO;
  else if ((dup.alerta || groupMatch.match) && status === ESTADO_ELEGIBILIDAD.APTO) status = ESTADO_ELEGIBILIDAD.REVISION;

  var groupCode = group ? formatGroupCode(nextGroupNumber(existing)) : '';
  var notes = []
    .concat(verdict.errores.map(function (x) { return x.campo + ':' + x.codigo; }))
    .concat(verdict.avisos.map(function (x) { return x.campo + ':' + x.codigo; }));
  if (dup.duplicate_reason) notes.push(dup.duplicate_reason);
  if (groupMatch.match) notes.push('GRUPO_POSIBLE_REPETIDO:' + groupMatch.ref);

  var now = ahoraISO();
  var termsVersion = cfg('terms_version', '');
  var policyVersion = cfg('policy_version', 'v2');
  var controller = dataControllerStamp();
  var usesTrack = esVerdadero(datos.track_uses);
  var genre = normalizarTexto(datos.genre_primary);
  var source = normalizarTexto(datos.source) || 'web';

  agregarFila(HOJA.REGISTRO, {
    submission_id: submissionId,
    code: '',
    created_at: now,
    source: source,
    full_name: normalizarTexto(datos.full_name),
    id_number: normalizarTexto(datos.id_number),
    birth_date: normalizarTexto(datos.birth_date),
    age: verdict.edad === null ? '' : verdict.edad,
    neighborhood_sector: normalizarTexto(datos.neighborhood_sector),
    residence: esVerdadero(datos.resides_in_sabaneta) ? cfg('municipio', 'Sabaneta') : 'FUERA',
    email: normalizarTexto(datos.email),
    whatsapp: normalizarTexto(datos.whatsapp),
    artistic_name: displayName,
    discipline: genre,                                   // legacy column, mirrors the main genre
    genre_or_proposal: genre,
    artist_description: normalizarTexto(datos.artist_description),
    audition_description: normalizarTexto(datos.audition_description),
    video_url: normalizarTexto(datos.video_url),
    technical_needs: [normalizarTexto(datos.needs), normalizarTexto(datos.needs_other)].filter(Boolean).join(' | '),
    normalized_id_number: candidate.normalized_id_number,
    normalized_email: candidate.normalized_email,
    normalized_phone: candidate.normalized_phone,
    eligibility_status: status,
    duplicate_flag: dup.duplicate_flag,
    duplicate_reason: dup.duplicate_reason,
    registro_principal: dup.registro_principal,
    validation_notes: notes.join(' | '),
    consent_terms: esVerdadero(datos.accept_terms),
    consent_data: esVerdadero(datos.accept_data_processing),
    consent_whatsapp: esVerdadero(datos.accept_whatsapp_operational),
    consent_image: esVerdadero(datos.accept_image_voice),
    consent_version: cfg('consent_version', 'v2'),
    availability_statement: esVerdadero(datos.availability_statement),
    attendance_status: '',
    audition_status: '',
    change_status: ESTADO_CAMBIO.SIN_SOLICITUD,
    notes: '',
    participation_mode: mode,
    group_code: groupCode,
    group_display_name: group ? displayName : '',
    group_match_key: matchKey,
    group_match_status: groupMatch.match ? 'POSIBLE_REPETIDA' : '',
    group_match_ref: groupMatch.ref || '',
    members_declared: group ? normalizarTexto(datos.members_declared) : '1',
    adult_confirmation: esVerdadero(datos.adult_confirmation),
    genre_primary: genre,
    genre_secondary: normalizarTexto(datos.genre_secondary),
    presentation_format: normalizarComparable(datos.presentation_format).replace(/[\s-]+/g, '_'),
    presentation_other: normalizarTexto(datos.presentation_other),
    needs: normalizarTexto(datos.needs),
    needs_other: normalizarTexto(datos.needs_other),
    own_equipment: esVerdadero(datos.own_equipment),
    own_equipment_detail: normalizarTexto(datos.own_equipment_detail),
    song_name: normalizarTexto(datos.song_name),
    track_uses: usesTrack,
    track_method: usesTrack ? normalizarComparable(datos.track_method) : '',
    track_method_other: normalizarTexto(datos.track_method_other),
    track_status: usesTrack ? TRACK_STATUS.PENDIENTE : TRACK_STATUS.NO_APLICA,
    video_check_status: video ? video.status : VIDEO_STATUS.PENDIENTE,
    video_check_detail: video ? video.detail : '',
    video_checked_at: video && video.status !== VIDEO_STATUS.SIN_VIDEO ? now : '',
    consent_at: now,
    terms_version: termsVersion,
    policy_version: policyVersion,
    data_controller: controller,
    capture_source: 'web:formulario-1:' + cfg('consent_version', 'v2')
  });

  if (group) {
    var leaderStatus = MEMBER_STATUS.AUTORIZADO;
    if (verdict.errores.some(function (e) { return e.codigo === 'EDAD'; })) leaderStatus = MEMBER_STATUS.NO_CUMPLE;
    else if (!esVerdadero(datos.accept_terms) || !esVerdadero(datos.accept_data_processing) ||
             !esVerdadero(datos.adult_confirmation)) leaderStatus = MEMBER_STATUS.INCOMPLETO;
    agregarFila(HOJA.INTEGRANTES, {
      member_id: nuevoId('M'), group_code: groupCode, project_submission_id: submissionId,
      created_at: now, updated_at: now, source: source, is_leader: true,
      full_name: normalizarTexto(datos.full_name), id_number: normalizarTexto(datos.id_number),
      normalized_id_number: candidate.normalized_id_number, birth_date: normalizarTexto(datos.birth_date),
      age: verdict.edad === null ? '' : verdict.edad, adult_confirmation: esVerdadero(datos.adult_confirmation),
      artistic_role: normalizarTexto(datos.leader_role) || 'Lider / vocero',
      consent_terms: esVerdadero(datos.accept_terms), consent_data: esVerdadero(datos.accept_data_processing),
      consent_image: esVerdadero(datos.accept_image_voice), consent_at: now,
      terms_version: termsVersion, policy_version: policyVersion, data_controller: controller,
      capture_source: 'web:formulario-1', member_status: leaderStatus, member_alert: '',
      notes: 'Aceptacion digital en el Formulario 1'
    });
  }

  registrar('participante', '', 'INSCRIPCION', submissionId, 'estado=' + status + (groupCode ? ' grupo=' + groupCode : ''));

  return {
    submission_id: submissionId,
    eligibility_status: status,
    edad: verdict.edad,
    errores: verdict.errores,
    avisos: verdict.avisos,
    duplicado: dup.duplicate_flag,
    participation_mode: mode,
    group_code: groupCode,
    group_key: group ? groupAccessKey(groupCode) : '',
    members_link: group ? membersLink(groupCode) : '',
    group_repeated: !!groupMatch.match,
    whatsapp_oficial: cfg('whatsapp_oficial', ''),
    whatsapp_nombre: cfg('whatsapp_oficial_nombre', 'EL BÚNKER — Arte es la Solución'),
    mi_inscripcion_link: webAppUrl() + '?p=mi-inscripcion',
    mensaje: mensajeVeredicto(status, verdict, dup, groupMatch)
  };
}

function mensajeVeredicto(estado, veredicto, dup, groupMatch) {
  var numero = cfg('whatsapp_oficial', '');
  if (estado === ESTADO_ELEGIBILIDAD.APTO) {
    return 'Recibimos tu inscripcion. La organizacion revisa cada inscripcion y asigna los ' +
      cfgNumero('cupo_total', 100) + ' cupos en orden de inscripcion entre quienes cumplen los requisitos. ' +
      'Si quedas dentro, recibiras tu codigo y tu horario por WhatsApp' + (numero ? ' desde el ' + numero : '') + '.';
  }
  if (estado === ESTADO_ELEGIBILIDAD.DUPLICADO) {
    return 'Ya tenemos una inscripcion registrada con este documento. Conservamos la primera; no necesitas volver a inscribirte.';
  }
  if (estado === ESTADO_ELEGIBILIDAD.NO_CUMPLE) {
    var reglas = veredicto.errores.filter(function (e) { return e.codigo === 'EDAD' || e.codigo === 'RESIDENCIA'; });
    return reglas.length ? reglas[0].mensaje : 'Tu inscripcion no cumple los requisitos de la convocatoria.';
  }
  if (estado === ESTADO_ELEGIBILIDAD.INCOMPLETO) {
    return 'Faltan datos obligatorios. Revisa los campos marcados y vuelve a enviar.';
  }
  if (groupMatch && groupMatch.match) {
    return 'Recibimos tu inscripcion. Ya existe una agrupacion con un nombre muy parecido: la organizacion ' +
      'verificara si es el mismo proyecto y te contactara.';
  }
  return 'Recibimos tu inscripcion y quedo en revision. Te contactaremos si necesitamos verificar algo.';
}

/**
 * Reception e-mail, sent after the lock is released and never allowed to fail
 * the registration. Test addresses are never mailed, and a small part of the
 * daily Gmail quota is kept for the operators.
 */
function notifyReception(submissionId) {
  try {
    if (!cfgBool('correo_confirmacion_automatico', true)) return;
    var row = leerHoja(HOJA.REGISTRO).filter(function (r) { return r.submission_id === submissionId; })[0];
    if (!row) return;
    var status = normalizarComparable(row.eligibility_status);
    if (status !== 'APTO' && status !== 'REVISION') return;
    if (!esEmailValido(row.email) || /\.test$/i.test(normalizarEmail(row.email))) return;
    if (MailApp.getRemainingDailyQuota() <= 10) {
      registrar('sistema', '', 'CORREO_OMITIDO_CUOTA', submissionId, '');
      return;
    }
    var extras = messageExtras(row, webAppUrl(), leerHoja(HOJA.INTEGRANTES));
    var msg = renderizarPlantilla(plantillas().RECEPCION, row, extras);
    MailApp.sendEmail({ to: row.email, subject: msg.asunto, body: msg.cuerpo, name: cfg('evento_nombre', 'EL BUNKER') });
    registrar('sistema', '', 'CORREO_RECEPCION', submissionId, '');
  } catch (e) {
    registrar('sistema', '', 'CORREO_RECEPCION_FALLO', submissionId, e.message);
  }
}

// ---------------------------------------------------------------------------
// Group members
// ---------------------------------------------------------------------------

function findGroupProject(groupCode, rows) {
  var code = normalizarComparable(groupCode);
  return (rows || leerHoja(HOJA.REGISTRO)).filter(function (r) {
    return normalizarComparable(r.group_code) === code;
  })[0] || null;
}

/** Declared / registered / authorized counts. No personal data. */
function groupSummary(groupCode, members) {
  var code = normalizarComparable(groupCode);
  var list = (members || leerHoja(HOJA.INTEGRANTES)).filter(function (m) {
    return normalizarComparable(m.group_code) === code;
  });
  return {
    registered: list.length,
    authorized: list.filter(function (m) { return normalizarComparable(m.member_status) === 'AUTORIZADO'; }).length,
    list: list
  };
}

/** Public lookup behind the members form: confirms the group without revealing anyone's data. */
function accionConsultarAgrupacion(datos) {
  var code = normalizarComparable(datos.group_code);
  if (!code || !groupKeyMatches(code, datos.group_key)) {
    return { ok: false, motivo: 'CLAVE', error: 'El codigo o la clave de la agrupacion no coinciden. Pidele el enlace completo a tu lider.' };
  }
  var project = findGroupProject(code);
  if (!project) return { ok: false, error: 'No encontramos esa agrupacion.' };
  var summary = groupSummary(code);
  return {
    group_code: code,
    group_display_name: project.group_display_name || project.artistic_name,
    members_declared: Number(project.members_declared) || '',
    members_registered: summary.registered,
    members_authorized: summary.authorized,
    abierto: cfgBool('integrantes_abierto', true),
    firma_obligatoria: cfgBool('firma_integrantes', true)
  };
}

/**
 * One member's own authorization. The same person sending again (same ID
 * number in the same group) updates their row instead of adding a new one.
 */
function accionRegistrarIntegrante(datos) {
  datos = datos || {};
  if (!cfgBool('integrantes_abierto', true)) {
    return { ok: false, cerrado: true, error: 'El registro de integrantes esta cerrado.' };
  }
  var code = normalizarComparable(datos.group_code);
  if (!code || !groupKeyMatches(code, datos.group_key)) {
    registrar('anonimo', '', 'INTEGRANTE_CLAVE_INVALIDA', code, '');
    return { ok: false, motivo: 'CLAVE', error: 'El codigo o la clave de la agrupacion no coinciden. Pidele el enlace completo a tu lider.' };
  }
  var key = 'integrante:' + (datos.client_submission_id || Utilities.getUuid());
  var replay = replayIfRepeated(key);
  if (replay) return replay;
  var blocked = guardSubmission(datos, 'integrante');
  if (blocked) return blocked;

  var validation = validateMember(datos, {
    edad_minima: cfgNumero('integrantes_edad_minima', 18),
    fecha_evento: cfgFecha('evento_fecha', '2026-10-23'),
    firma_obligatoria: cfgBool('firma_integrantes', true)
  });

  var norm = normalizarCedula(datos.id_number);
  var before = groupSummary(code).list.filter(function (m) { return normalizarCedula(m.normalized_id_number) === norm; })[0];
  var memberId = before ? before.member_id : nuevoId('M');

  var signature = null;
  if (normalizarTexto(datos.signature_png)) {
    signature = storeSignature(code, memberId, datos.signature_png);            // Drive, outside the lock
    if (!signature.ok) return { ok: false, error: signature.error };
  }

  return exactlyOnce(key, function () {
    var projects = leerHoja(HOJA.REGISTRO);
    var project = findGroupProject(code, projects);
    if (!project) return { ok: false, error: 'No encontramos esa agrupacion.' };
    var allMembers = leerHoja(HOJA.INTEGRANTES);
    var summary = groupSummary(code, allMembers);
    var existing = summary.list.filter(function (m) { return normalizarCedula(m.normalized_id_number) === norm; })[0];

    var alerts = [];
    allMembers.forEach(function (m) {
      if (normalizarCedula(m.normalized_id_number) === norm && normalizarComparable(m.group_code) !== code) {
        alerts.push('TAMBIEN_EN_' + m.group_code);
      }
    });
    projects.forEach(function (r) {
      if (r.submission_id !== project.submission_id && normalizarCedula(r.normalized_id_number || r.id_number) === norm) {
        alerts.push('TAMBIEN_INSCRITO_' + (r.code || r.submission_id));
      }
    });
    var registeredAfter = summary.registered + (existing ? 0 : 1);
    var declared = Number(project.members_declared) || 0;
    if (declared && registeredAfter > declared) alerts.push('SUPERA_INTEGRANTES_DECLARADOS');

    var now = ahoraISO();
    var row = {
      group_code: code, project_submission_id: project.submission_id, updated_at: now,
      source: normalizarTexto(datos.source) || 'web', is_leader: existing ? esVerdadero(existing.is_leader) : false,
      full_name: normalizarTexto(datos.full_name), id_number: normalizarTexto(datos.id_number),
      normalized_id_number: norm, birth_date: normalizarTexto(datos.birth_date),
      age: validation.age === null ? '' : validation.age,
      adult_confirmation: esVerdadero(datos.adult_confirmation), artistic_role: normalizarTexto(datos.artistic_role),
      consent_terms: esVerdadero(datos.accept_terms), consent_data: esVerdadero(datos.accept_data_processing),
      consent_image: esVerdadero(datos.accept_image_voice), consent_at: now,
      terms_version: cfg('terms_version', ''), policy_version: cfg('policy_version', 'v2'),
      data_controller: dataControllerStamp(), capture_source: 'web:formulario-integrantes',
      member_status: validation.status, member_alert: alerts.join(' | ')
    };
    if (signature) {
      row.signature_file_id = signature.file_id;
      row.signature_sha256 = signature.sha256;
      row.signature_at = now;
    }

    if (existing) {
      actualizarFila(HOJA.INTEGRANTES, existing._fila, row);
      registrar('integrante', '', 'INTEGRANTE_ACTUALIZADO', code, existing.member_id + ' estado=' + validation.status);
    } else {
      row.member_id = memberId;
      row.created_at = now;
      agregarFila(HOJA.INTEGRANTES, row);
      registrar('integrante', '', 'INTEGRANTE', code, memberId + ' estado=' + validation.status);
    }

    var after = groupSummary(code);
    return {
      member_id: existing ? existing.member_id : memberId,
      member_status: validation.status,
      actualizado: !!existing,
      errores: validation.errors,
      group: {
        code: code,
        name: project.group_display_name || project.artistic_name,
        declared: declared,
        registered: after.registered,
        authorized: after.authorized
      },
      mensaje: validation.status === MEMBER_STATUS.AUTORIZADO
        ? 'Tu autorizacion quedo registrada. Ya van ' + after.authorized + ' de ' + (declared || after.registered) + ' integrantes autorizados.'
        : (validation.status === MEMBER_STATUS.NO_CUMPLE
            ? 'Cada integrante debe ser mayor de edad el dia del evento. Tu registro quedo guardado y la organizacion lo revisara.'
            : 'Faltan datos o autorizaciones. Corrige lo marcado y envia de nuevo.')
    };
  });
}

// ---------------------------------------------------------------------------
// "Mi inscripción": status, group link recovery and backing-track upload
// ---------------------------------------------------------------------------

/** Finds a project by code or receipt and proves identity with the ID number. */
function findOwnProject(datos) {
  var doc = normalizarCedula(datos.id_number);
  if (!doc) return null;
  var code = normalizarComparable(datos.code);
  var receipt = normalizarComparable(datos.submission_id);
  var rows = leerHoja(HOJA.REGISTRO);
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    var byCode = code && normalizarComparable(r.code) === code;
    var byReceipt = receipt && normalizarComparable(r.submission_id) === receipt;
    if ((byCode || byReceipt) && normalizarCedula(r.normalized_id_number || r.id_number) === doc) return r;
  }
  return null;
}

function friendlyStatus(r) {
  var e = normalizarComparable(r.eligibility_status);
  if (normalizarTexto(r.code)) return 'Tienes cupo. Este es tu codigo y tu horario.';
  if (e === 'APTO') return 'Tu inscripcion cumple los requisitos y esta en espera de la asignacion de cupos.';
  if (e === 'REVISION') return 'Tu inscripcion esta en revision por la organizacion.';
  if (e === 'INCOMPLETO') return 'A tu inscripcion le faltan datos obligatorios: inscribete de nuevo con los datos completos.';
  if (e === 'NO_CUMPLE') return 'Tu inscripcion no cumple los requisitos de la convocatoria.';
  if (e === 'DUPLICADO') return 'Esta inscripcion esta duplicada: vale la primera que enviaste.';
  return 'Inscripcion recibida.';
}

function accionMiInscripcion(datos) {
  var blocked = guardSubmission(datos, 'consulta');
  if (blocked) return blocked;
  var r = findOwnProject(datos);
  if (!r) return { ok: false, error: 'No encontramos una inscripcion con esos datos. Revisa tu documento y tu codigo o comprobante.' };

  var group = null;
  if (r.group_code) {
    var summary = groupSummary(r.group_code);
    group = {
      code: r.group_code,
      key: groupAccessKey(r.group_code),
      link: membersLink(r.group_code),
      declared: Number(r.members_declared) || '',
      registered: summary.registered,
      authorized: summary.authorized,
      members: summary.list.map(function (m) {
        var parts = normalizarTexto(m.full_name).split(' ');
        return {
          name: parts[0] + (parts.length > 1 ? ' ' + parts[parts.length - 1].charAt(0) + '.' : ''),
          role: m.artistic_role, status: m.member_status, leader: esVerdadero(m.is_leader)
        };
      })
    };
  }

  return {
    submission_id: r.submission_id,
    eligibility_status: r.eligibility_status,
    estado_texto: friendlyStatus(r),
    artistic_name: r.artistic_name,
    participation_mode: r.participation_mode || 'SOLISTA',
    code: r.code || '',
    bloque: r.final_block || r.original_block || '',
    hora_llegada: r.arrival_time ? humanTime(r.arrival_time) : '',
    hora_audicion: (r.final_time || r.original_time) ? humanTime(r.final_time || r.original_time) : '',
    fecha_texto: humanDate(cfgFecha('evento_fecha', '2026-10-23')),
    lugar: cfg('evento_sede', ''),
    change_status: r.change_status || ESTADO_CAMBIO.SIN_SOLICITUD,
    song_name: r.song_name || '',
    track: {
      uses: esVerdadero(r.track_uses),
      method: r.track_method || '',
      status: r.track_status || (esVerdadero(r.track_uses) ? TRACK_STATUS.PENDIENTE : TRACK_STATUS.NO_APLICA),
      file_name: r.track_file_name || '',
      updated_at: r.track_updated_at || '',
      can_upload: !!normalizarTexto(r.code) && cfgBool('pistas_abiertas', true),
      max_mb: cfgNumero('pista_max_mb', 15),
      formats: cfg('pista_formatos', 'mp3,wav,m4a,aac,ogg,flac')
    },
    video: { status: r.video_check_status || '', detail: r.video_check_detail || '' },
    group: group,
    whatsapp_oficial: cfg('whatsapp_oficial', ''),
    whatsapp_nombre: cfg('whatsapp_oficial_nombre', '')
  };
}

/**
 * Backing-track upload (method 1 of the brief: file received before the day).
 * Only after a B-XXX code exists, and only by whoever holds the code AND the
 * ID number of the registration.
 */
function accionSubirPista(datos) {
  datos = datos || {};
  if (!cfgBool('pistas_abiertas', true)) return { ok: false, cerrado: true, error: 'La recepcion de pistas esta cerrada.' };
  var key = 'pista:' + (datos.client_submission_id || Utilities.getUuid());
  var replay = replayIfRepeated(key);
  if (replay) return replay;
  var blocked = guardSubmission(datos, 'pista');
  if (blocked) return blocked;

  var row = findOwnProject({ id_number: datos.id_number, code: datos.code });
  if (!row) return { ok: false, error: 'El codigo y el documento no coinciden con una inscripcion.' };
  if (!normalizarTexto(row.code)) {
    return { ok: false, error: 'La pista se envia despues de recibir tu codigo B-XXX.' };
  }
  var stored = storeTrack(row, datos.file_name, datos.file_base64, datos.song_name);   // Drive, outside the lock
  if (!stored.ok) {
    registrar('participante', '', 'PISTA_RECHAZADA', row.code, stored.error);
    return stored;
  }
  return exactlyOnce(key, function () { return recordTrack(row.code, stored, datos.song_name, 'ARCHIVO', 'participante'); });
}

/** Writes the stored file into REGISTRO. Shared by the participant and the admin upload. */
function recordTrack(code, stored, songName, method, actor) {
  var fresh = buscarPorCodigo(code);
  var now = ahoraISO();
  actualizarFila(HOJA.REGISTRO, fresh._fila, {
    track_uses: true,
    track_method: normalizarTexto(fresh.track_method) || method,
    track_status: TRACK_STATUS.RECIBIDA,
    track_file_id: stored.file_id,
    track_file_name: stored.file_name,
    track_updated_at: now,
    song_name: normalizarTexto(songName) || fresh.song_name || ''
  });
  registrar(actor, '', 'PISTA_RECIBIDA', code, stored.file_name + ' (' + stored.bytes + ' bytes)');
  return { code: code, track_status: TRACK_STATUS.RECIBIDA, track_file_name: stored.file_name, bytes: stored.bytes,
           mensaje: 'Recibimos tu pista como ' + stored.file_name + '. El dia del evento lleva tambien una copia en USB.' };
}

// ---------------------------------------------------------------------------
// Live video-link check (called while the person fills Form 1)
// ---------------------------------------------------------------------------

function accionVerificarVideo(datos) {
  var url = normalizarTexto(datos.video_url);
  if (!url) return { status: VIDEO_STATUS.SIN_VIDEO, detail: '' };
  if (!cfgBool('verificar_videos', true)) return { status: VIDEO_STATUS.PENDIENTE, detail: 'Se revisara despues.' };
  var cache = CacheService.getScriptCache();
  var minuteKey = 'rl:video:' + Math.floor(Date.now() / 60000);
  var n = Number(cache.get(minuteKey) || 0) + 1;
  cache.put(minuteKey, String(n), 120);
  if (n > 60) return { status: VIDEO_STATUS.PENDIENTE, detail: 'Lo revisaremos despues de tu envio.' };
  return checkVideoUrl(url);
}

// ---------------------------------------------------------------------------
// Form 2 - schedule change
// ---------------------------------------------------------------------------

/** Records the request only; the new slot is decided by production, never chosen by the participant. */
function accionSolicitarCambio(datos) {
  if (!cfgBool('cambios_abiertos', true)) {
    return { ok: false, error: 'El plazo para solicitar cambios de horario ya cerro.', cerrado: true };
  }
  var key = 'cambio:' + normalizarComparable(datos.participant_code) + ':' + (datos.client_submission_id || '');
  var replay = replayIfRepeated(key);
  if (replay) return replay;
  var blocked = guardSubmission(datos, 'cambio');
  if (blocked) return blocked;

  return exactlyOnce(key, function () {
    var registro = buscarPorCodigo(datos.participant_code);
    var permiso = puedeSolicitarCambio(registro, datos, {
      ahora: new Date().toISOString(),
      cierre_cambios: cfg('cierre_cambios', '')
    });
    if (!permiso.permitido) return { ok: false, error: permiso.mensaje, motivo: permiso.motivo };

    // Guard against someone else guessing a code: the name must match.
    if (normalizarComparable(datos.full_name) !== normalizarComparable(registro.full_name)) {
      registrar('participante', '', 'CAMBIO_NOMBRE_NO_COINCIDE', datos.participant_code, '');
      return { ok: false, error: 'El nombre no coincide con el registrado para ese codigo.', motivo: 'NOMBRE_NO_COINCIDE' };
    }

    var solicitudId = nuevoId('CB');
    var horario = horarioDeCodigo(registro.code, agendaConfigurada());
    agregarFila(HOJA.CAMBIOS, {
      solicitud_id: solicitudId, at: ahoraISO(), code: registro.code, full_name: registro.full_name,
      original_block: registro.original_block || (horario ? horario.block_id : ''),
      original_time: clockText(registro.original_time) || (horario ? horario.audition_time : ''),
      can_attend_original: 'FALSE', reason_short: String(datos.reason_short || '').slice(0, 400),
      contact: normalizarTexto(datos.contact), acceptance: esVerdadero(datos.acceptance) ? 'TRUE' : 'FALSE',
      estado: ESTADO_CAMBIO.PENDIENTE, nuevo_bloque: '', nueva_hora: '', resuelto_at: '', resuelto_by: '', observacion: ''
    });
    actualizarFila(HOJA.REGISTRO, registro._fila, { change_requested: 'TRUE', change_status: ESTADO_CAMBIO.PENDIENTE });
    registrar('participante', '', 'SOLICITUD_CAMBIO', registro.code, solicitudId);
    return {
      solicitud_id: solicitudId, estado: ESTADO_CAMBIO.PENDIENTE,
      mensaje: 'Registramos tu solicitud. Produccion te confirmara por WhatsApp o correo si es APROBADA o NO APROBADA. ' +
               'Mientras tanto tu horario original sigue vigente.'
    };
  });
}

/** Kept for compatibility with iteration-1 links: status by code or ID number. */
function accionConsultarEstado(datos) {
  var registro = null;
  if (datos.code) registro = buscarPorCodigo(datos.code);
  else if (datos.id_number) registro = buscarPorCedula(datos.id_number);
  if (!registro) return { ok: false, error: 'No encontramos un registro con esos datos.' };
  if (normalizarCedula(datos.id_number) !== normalizarCedula(registro.id_number)) {
    return { ok: false, error: 'Los datos no coinciden. Verifica tu documento y tu codigo.' };
  }
  return {
    code: registro.code || '',
    eligibility_status: registro.eligibility_status,
    bloque: registro.final_block || registro.original_block || '',
    hora_llegada: registro.arrival_time ? humanTime(registro.arrival_time) : '',
    hora_audicion: (registro.final_time || registro.original_time) ? humanTime(registro.final_time || registro.original_time) : '',
    change_status: registro.change_status || ESTADO_CAMBIO.SIN_SOLICITUD,
    attendance_status: registro.attendance_status || ''
  };
}

function accionAgendaPublica() {
  return { agenda: construirAgenda(agendaConfigurada()) };
}

/** Only the values meant to be public; the CONFIG sheet also holds internals. */
function accionConfigPublica() {
  var fecha = cfgFecha('evento_fecha', '2026-10-23');
  var inicio = cfgHora('evento_hora_inicio', '15:00');
  var fin = cfgHora('evento_hora_fin', '21:00');
  return {
    evento: {
      nombre: cfg('evento_nombre', 'EL BÚNKER'),
      fecha: fecha,
      fecha_texto: humanDate(fecha),
      hora_inicio: inicio,
      hora_fin: fin,
      hora_inicio_texto: humanTime(inicio),
      hora_fin_texto: humanTime(fin),
      sede: cfg('evento_sede', ''),
      municipio_sede: cfg('evento_municipio_sede', 'Sabaneta, Antioquia'),
      municipio: cfg('municipio', 'Sabaneta'),
      edad_minima: cfgNumero('edad_minima', 18),
      edad_maxima: cfgNumero('edad_maxima', 30),
      duracion_audicion: cfgNumero('duracion_audicion_min', 3),
      cupo: cfgNumero('cupo_total', 100),
      top: cfgNumero('top_seleccionados', 7),
      jurados: cfgNumero('jurados', 3),
      integrantes_max: cfgNumero('integrantes_max', 15)
    },
    legal: {
      legal_name: cfg('legal_name', ''),
      nit: cfg('nit', ''),
      legal_address: cfg('legal_address', ''),
      data_protection_email: cfg('data_protection_email', ''),
      institutional_phone: cfg('institutional_phone', ''),
      terms_url: cfg('terms_url', ''),
      privacy_policy_url: cfg('privacy_policy_url', ''),
      terms_version: cfg('terms_version', ''),
      policy_version: cfg('policy_version', 'v2'),
      consent_version: cfg('consent_version', 'v2')
    },
    contacto: {
      whatsapp_oficial: cfg('whatsapp_oficial', ''),
      whatsapp_nombre: cfg('whatsapp_oficial_nombre', 'EL BÚNKER — Arte es la Solución'),
      sitio_url: cfg('sitio_url', '')
    },
    formularios: {
      pista_max_mb: cfgNumero('pista_max_mb', 15),
      pista_formatos: cfg('pista_formatos', 'mp3,wav,m4a,aac,ogg,flac'),
      verificar_videos: cfgBool('verificar_videos', true),
      firma_integrantes: cfgBool('firma_integrantes', true),
      exigir_video: cfgBool('exigir_video', false)
    },
    entorno: entorno(),
    abierto: cfgBool('inscripciones_abiertas', true),
    cambios_abiertos: cfgBool('cambios_abiertos', true),
    cierre_cambios_texto: deadlineText(cfg('cierre_cambios', '')),
    integrantes_abierto: cfgBool('integrantes_abierto', true),
    pistas_abiertas: cfgBool('pistas_abiertas', true)
  };
}
