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
             error: 'No pudimos procesar el envío. Si eres una persona, recarga la página e inténtalo de nuevo.' };
  }
  var testData = isTestData(datos);
  if (testData && !esPruebas()) {
    registrar('anonimo', '', 'BLOQUEO_DATO_DE_PRUEBA', kind, '');
    return { ok: false, motivo: 'DATO_DE_PRUEBA', error: 'Producción no admite datos de prueba.' };
  }
  if (testData) return null;                       // the rehearsal loads 130 rows in a burst on purpose

  var minMs = cfgNumero('tiempo_minimo_formulario_seg', 10) * 1000 * (MIN_FILL_FACTOR[kind] || 0);
  if (minMs > 0 && normalizarComparable(datos.source || 'WEB') === 'WEB') {
    var elapsed = Number(datos.form_elapsed_ms);
    if (!isFinite(elapsed) || elapsed < minMs) {
      registrar('anonimo', '', 'BLOQUEO_VELOCIDAD', kind, String(elapsed));
      return { ok: false, motivo: 'VELOCIDAD',
               error: 'El envío fue demasiado rápido. Revisa tus datos y vuelve a enviarlo.' };
    }
  }

  var cache = CacheService.getScriptCache();
  var minuteKey = 'rl:' + kind + ':' + Math.floor(Date.now() / 60000);
  var perMinute = Number(cache.get(minuteKey) || 0) + 1;
  cache.put(minuteKey, String(perMinute), 120);
  if (perMinute > cfgNumero('limite_envios_minuto', 30)) {
    registrar('anonimo', '', 'BLOQUEO_LIMITE_GLOBAL', kind, String(perMinute));
    return { ok: false, motivo: 'LIMITE_GLOBAL',
             error: 'Estamos recibiendo muchos envíos en este momento. Espera un minuto y vuelve a intentarlo.' };
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
               error: 'Hubo demasiados envíos con este documento en la última hora. Si necesitas corregir algo, escríbenos.' };
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

/**
 * The public /exec URL every link is built from. Run from the editor,
 * ScriptApp.getService().getUrl() answers the owner-only /dev URL, so the
 * deployed URL is kept in CONFIG (web_app_url) and Google's answer is only a
 * fallback.
 */
function webAppUrl() {
  var configured = normalizarTexto(cfg('web_app_url', ''));
  if (/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(configured)) return configured;
  try { return ScriptApp.getService().getUrl() || ''; } catch (e) { return ''; }
}

function membersLink(teamCode) {
  return webAppUrl() + '?p=integrantes&g=' + encodeURIComponent(teamCode) + '&k=' + groupAccessKey(teamCode);
}

/** True while the "equipo y firmas" links are valid (CONFIG enlaces_equipo_vencen, inclusive). */
function teamLinksOpen() {
  var until = cfgFecha('enlaces_equipo_vencen', '');
  if (!until) return true;
  return Utilities.formatDate(new Date(), zonaHoraria(), 'yyyy-MM-dd') <= until;
}

/** Brute-force guard on team keys: 10 wrong keys for one team code in 15 minutes lock it for a while. */
function teamKeyAttemptAllowed(code) {
  return Number(CacheService.getScriptCache().get('tk:' + code) || 0) < 10;
}
function teamKeyFailed(code) {
  var cache = CacheService.getScriptCache();
  cache.put('tk:' + code, String(Number(cache.get('tk:' + code) || 0) + 1), 900);
}

/** Validates code + key of a team link. Returns null when valid, or the error payload. */
function checkTeamAccess(code, key) {
  if (!code) return { ok: false, motivo: 'CLAVE', error: 'Falta el código del proyecto. Pide el enlace completo a quien inscribió el proyecto.' };
  if (!teamKeyAttemptAllowed(code)) {
    return { ok: false, motivo: 'BLOQUEO', error: 'Demasiados intentos con una clave incorrecta. Espera 15 minutos o pide el enlace completo.' };
  }
  if (!groupKeyMatches(code, key)) {
    teamKeyFailed(code);
    registrar('anonimo', '', 'EQUIPO_CLAVE_INVALIDA', code, '');
    return { ok: false, motivo: 'CLAVE', error: 'El código o la clave del proyecto no coinciden. Pide el enlace completo a quien inscribió el proyecto.' };
  }
  if (!teamLinksOpen()) {
    return { ok: false, motivo: 'VENCIDO', cerrado: true, error: 'Este enlace de equipo y firmas ya venció.' };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Form 1 - registration of a project (soloist, duo or group)
// ---------------------------------------------------------------------------

/**
 * Validates server-side, stores ALWAYS (never silently rejects) and answers with the receipt.
 * A complete submission is RECIBIDO: the automatic verdict is kept in eligibility_auto and
 * becomes the official aptitude only when staff apply it (RECIBIDO is never presented as APTO).
 * Codes are NOT issued here: they are issued in an operator-run batch after review.
 */
function accionInscribir(datos) {
  datos = datos || {};
  if (!cfgBool('inscripciones_abiertas', true)) {
    return { ok: false, error: 'Las inscripciones están cerradas.', cerrado: true };
  }
  var key = 'inscripcion:' + (datos.client_submission_id || Utilities.getUuid());
  var replay = replayIfRepeated(key);
  if (replay) return replay;
  var blocked = guardSubmission(datos, 'inscripcion');
  if (blocked) return blocked;

  var videoUrl = normalizarTexto(datos.video_url);
  var video = videoUrl ? cachedVideoCheck(videoUrl) : videoStatusWithoutProbe('');

  // Slow work outside the lock: the receipt id is random, so it can be chosen before the lock.
  // Header reads are one round trip each; cached here, the locked section only writes (measured
  // live 2026-09-29: 6.8 s under the lock and 12 s in total per submission before this change).
  [HOJA.REGISTRO, HOJA.INTEGRANTES, HOJA.LOG, HOJA.EMAIL_LOG, HOJA.IDEMPOTENCIA].forEach(function (n) { encabezados(n); });
  var submissionId = nuevoId('S');
  var signature = null;
  if (normalizarTexto(datos.signature_png)) {
    signature = storeSignature(submissionId, 'INSCRITO', datos.signature_png, registrationSignaturesFolder());
    if (!signature.ok) return { ok: false, error: signature.error };
  }

  var internal = {};
  var result = exactlyOnceWithFile(key, signature, function () {
    return registerProject(datos, video, submissionId, signature, internal);
  });
  if (internal.email) deliverClaimedEmail(internal.email, internal.row, [internal.member]);
  return result;
}

/**
 * exactlyOnce() for a request that saved a signature file before the lock. When the request does
 * not keep it (busy lock, a concurrent twin registered first, or a refusal) the file goes to the
 * trash: the browser retries with a new one and Drive keeps no signature that belongs to nothing.
 */
function exactlyOnceWithFile(key, signature, fn) {
  var result;
  try {
    result = exactlyOnce(key, fn);
  } catch (e) {
    if (signature) trashFileQuietly(signature.file_id);
    throw e;
  }
  if (signature && result && (result.repetido || result.ok === false)) trashFileQuietly(signature.file_id);
  return result;
}

/**
 * Writes the project, its registrant as a member and the queued receipt. `internal` (optional)
 * receives the written row, member and claimed e-mail so the caller can send the receipt after the lock.
 */
function registerProject(datos, video, submissionId, signature, internal) {
  var options = opcionesValidacion();
  var verdict = validarInscripcion(datos, options);
  if (cfgBool('firma_inscripcion', true) && !signature) {
    verdict.errores.push({ campo: 'signature_png', codigo: 'FALTANTE', mensaje: 'Falta tu firma al final del formulario.' });
    if (verdict.eligibility_status === ESTADO_ELEGIBILIDAD.APTO || verdict.eligibility_status === ESTADO_ELEGIBILIDAD.EN_REVISION) {
      verdict.eligibility_status = ESTADO_ELEGIBILIDAD.INCOMPLETO;
    }
  }
  var mode = normalizeParticipationMode(datos.participation_mode);
  var group = isGroupMode(mode);
  var existing = leerHoja(HOJA.REGISTRO);
  submissionId = submissionId || nuevoId('S');

  var candidate = {
    submission_id: submissionId,
    normalized_id_number: normalizarCedula(datos.id_number),
    normalized_email: normalizarEmail(datos.email),
    normalized_phone: normalizarTelefono(datos.whatsapp)
  };
  // An INCOMPLETO registration is corrected by sending again: it never makes the new one a duplicate.
  var comparable = existing.filter(function (r) {
    return normalizeEligibility(r.eligibility_status) !== ESTADO_ELEGIBILIDAD.INCOMPLETO;
  });
  var dup = detectarDuplicado(candidate, comparable);

  var displayName = normalizarTexto(datos.artistic_name);
  var matchKey = group ? groupMatchKey(displayName) : '';
  var groupMatch = matchKey
    ? detectGroupMatch({ submission_id: submissionId, group_match_key: matchKey }, comparable)
    : { match: false, ref: '' };

  var auto = verdict.eligibility_status;
  if (auto !== ESTADO_ELEGIBILIDAD.INCOMPLETO) {
    if (dup.duplicate_flag) auto = ESTADO_ELEGIBILIDAD.DUPLICADO;
    else if ((dup.alerta || groupMatch.match) && auto === ESTADO_ELEGIBILIDAD.APTO) auto = ESTADO_ELEGIBILIDAD.EN_REVISION;
  }
  var status = auto === ESTADO_ELEGIBILIDAD.INCOMPLETO ? ESTADO_ELEGIBILIDAD.INCOMPLETO : ESTADO_ELEGIBILIDAD.RECIBIDO;

  var groupCode = group ? formatGroupCode(nextGroupNumber(existing)) : '';
  var teamCode = group ? groupCode : formatTeamCode(nextTeamNumber(existing));
  var notes = []
    .concat(verdict.errores.map(function (x) { return x.campo + ':' + x.codigo; }))
    .concat(verdict.avisos.map(function (x) { return x.campo + ':' + x.codigo; }));
  if (dup.duplicate_reason) notes.push(dup.duplicate_reason);
  if (groupMatch.match) notes.push('GRUPO_POSIBLE_REPETIDO:' + groupMatch.ref);

  var now = ahoraISO();
  var termsVersion = cfg('terms_version', '');
  var policyVersion = cfg('policy_version', '');
  var controller = dataControllerStamp();
  var usesTrack = esVerdadero(datos.track_uses);
  var genre = normalizarTexto(datos.genre_primary);
  var source = normalizarTexto(datos.source) || 'web';
  var docType = normalizeDocumentType(datos.document_type);
  var personId = personIdFor(candidate.normalized_id_number);

  var row = {
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
    eligibility_auto: auto,
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
    capture_source: 'web:formulario-1:' + cfg('consent_version', 'v2'),
    team_code: teamCode,
    document_type: docType,
    person_id: personId,
    signature_file_id: signature ? signature.file_id : '',
    signature_sha256: signature ? signature.sha256 : '',
    signature_at: signature ? now : '',
    participation_status: PARTICIPATION.SIN_TURNO
  };
  agregarFila(HOJA.REGISTRO, row);

  // The registrant is a person of the project too: their own authorization and signature.
  var registrantStatus = MEMBER_STATUS.AUTORIZADO;
  if (verdict.errores.some(function (e) { return e.codigo === 'EDAD' && verdict.edad !== null && verdict.edad < 18; })) {
    registrantStatus = MEMBER_STATUS.NO_CUMPLE;
  } else if (!esVerdadero(datos.accept_terms) || !esVerdadero(datos.accept_data_processing) ||
             !esVerdadero(datos.adult_confirmation) || (cfgBool('firma_inscripcion', true) && !signature)) {
    registrantStatus = MEMBER_STATUS.INCOMPLETO;
  }
  var member = {
    member_id: nuevoId('M'), group_code: teamCode, project_submission_id: submissionId,
    created_at: now, updated_at: now, source: source, is_leader: true,
    full_name: row.full_name, id_number: row.id_number, normalized_id_number: candidate.normalized_id_number,
    birth_date: row.birth_date, age: row.age, adult_confirmation: row.adult_confirmation,
    artistic_role: normalizarTexto(datos.leader_role) || (group ? 'Líder / vocero' : 'Solista'),
    consent_terms: row.consent_terms, consent_data: row.consent_data, consent_image: row.consent_image, consent_at: now,
    terms_version: termsVersion, policy_version: policyVersion, data_controller: controller,
    capture_source: 'web:formulario-1', member_status: registrantStatus, member_alert: '',
    signature_file_id: row.signature_file_id, signature_sha256: row.signature_sha256, signature_at: row.signature_at,
    person_role: PERSON_ROLE.INTERPRETE, crew_role: '', on_stage: true, document_type: docType, person_id: personId,
    notes: 'Aceptación y firma en el Formulario 1'
  };
  agregarFila(HOJA.INTEGRANTES, member);

  registrar('participante', '', 'INSCRIPCION', submissionId, 'estado=' + status + ' auto=' + auto + ' equipo=' + teamCode);
  if (status === ESTADO_ELEGIBILIDAD.RECIBIDO) {
    // The key holds the id created for this request, so the log needs no scan (fresh).
    var queued = enqueueEmail('RECEPCION', row, 'inscripcion', {}, 'RECEPCION:' + submissionId,
                              { fresh: true, claim: !!internal });
    if (internal && queued.entry) { internal.email = queued.entry; internal.row = row; internal.member = member; }
  }

  var complete = status === ESTADO_ELEGIBILIDAD.RECIBIDO;
  return {
    submission_id: submissionId,
    eligibility_status: status,
    estado_texto: ELIGIBILITY_LABELS[status],
    edad: verdict.edad,
    errores: complete ? [] : verdict.errores,
    avisos: [],
    participation_mode: mode,
    group_code: groupCode,
    team_code: teamCode,
    team_key: groupAccessKey(teamCode),
    group_key: group ? groupAccessKey(teamCode) : '',
    members_link: membersLink(teamCode),
    whatsapp_oficial: cfg('whatsapp_oficial', ''),
    whatsapp_nombre: cfg('whatsapp_oficial_nombre', 'EL BÚNKER — Arte es la Solución'),
    mi_inscripcion_link: webAppUrl() + '?p=mi-inscripcion',
    evento: { fecha_texto: humanDate(cfgFecha('evento_fecha', '2026-10-23')), sede: cfg('evento_sede', ''),
              horario: humanTime(cfgHora('evento_hora_inicio', '15:00')) + ' – ' + humanTime(cfgHora('evento_hora_fin', '21:00')) },
    mensaje: receptionMessage(status)
  };
}

/** What the person reads right after sending. RECIBIDO is never presented as APTO. */
function receptionMessage(status) {
  if (status === ESTADO_ELEGIBILIDAD.INCOMPLETO) {
    return 'Faltan datos obligatorios. Corrige lo marcado y envía de nuevo: la nueva inscripción no quedará como duplicada.';
  }
  var numero = phoneText(cfg('whatsapp_oficial', ''));
  return 'Recibimos tu inscripción. Recibirla no significa que ya seas apto: la organización revisa cada inscripción y te ' +
    'enviará el resultado por correo. Si resultas apto, los ' + cfgNumero('cupo_total', 100) + ' turnos se asignan en orden ' +
    'de inscripción; después de ellos queda una bolsa de suplentes.' +
    (numero ? ' Guarda el número ' + numero + ': desde ahí también te escribiremos.' : '');
}

// ---------------------------------------------------------------------------
// Team and signatures (every project: performers + crew)
// ---------------------------------------------------------------------------

/** The project a team code belongs to (team_code, or group_code for rows created before iteration 3). */
function findGroupProject(teamCode, rows) {
  var code = normalizarComparable(teamCode);
  return (rows || leerHoja(HOJA.REGISTRO)).filter(function (r) {
    return normalizarComparable(r.team_code) === code || (!normalizarTexto(r.team_code) && normalizarComparable(r.group_code) === code);
  })[0] || null;
}

function isCrew(m) {
  return normalizePersonRole(m.person_role) === PERSON_ROLE.EQUIPO_TRABAJO;
}

/** Performer and crew counts of a team. Crew never counts toward the declared members. No personal data. */
function groupSummary(teamCode, members) {
  var code = normalizarComparable(teamCode);
  var list = (members || leerHoja(HOJA.INTEGRANTES)).filter(function (m) {
    return normalizarComparable(m.group_code) === code;
  });
  var performers = list.filter(function (m) { return !isCrew(m); });
  var crew = list.filter(isCrew);
  var authorized = function (xs) { return xs.filter(function (m) { return normalizarComparable(m.member_status) === 'AUTORIZADO'; }).length; };
  return {
    registered: performers.length,
    authorized: authorized(performers),
    crew_registered: crew.length,
    crew_authorized: authorized(crew),
    list: list
  };
}

/** Public lookup behind the team form: confirms the project without revealing anyone's data. */
function accionConsultarAgrupacion(datos) {
  var code = normalizarComparable(datos.group_code);
  var denied = checkTeamAccess(code, datos.group_key);
  if (denied) return denied;
  var project = findGroupProject(code);
  if (!project) return { ok: false, error: 'No encontramos ese proyecto.' };
  var summary = groupSummary(code);
  return {
    group_code: code,
    group_display_name: project.group_display_name || project.artistic_name || '',
    participation_mode: project.participation_mode || 'SOLISTA',
    project_code: project.code || '',
    members_declared: Number(project.members_declared) || 1,
    members_registered: summary.registered,
    members_authorized: summary.authorized,
    crew_registered: summary.crew_registered,
    crew_authorized: summary.crew_authorized,
    crew_roles: CREW_ROLES.map(function (r) { return { id: r, etiqueta: CREW_ROLE_LABELS[r] }; }),
    document_types: DOCUMENT_TYPES.map(function (d) { return { id: d, etiqueta: DOCUMENT_TYPE_LABELS[d] }; }),
    abierto: cfgBool('integrantes_abierto', true),
    firma_obligatoria: cfgBool('firma_integrantes', true)
  };
}

/**
 * One person's own authorization for a project: a performer (on stage, part of the project) or a
 * crew member (manager, producer, technician... never takes a seat, never ranked). The same person
 * sending again with the same role updates their row; the same person in a second role gets a
 * second relation with the same person_id.
 */
function accionRegistrarIntegrante(datos) {
  datos = datos || {};
  if (!cfgBool('integrantes_abierto', true)) {
    return { ok: false, cerrado: true, error: 'El registro de equipo y firmas está cerrado.' };
  }
  var code = normalizarComparable(datos.group_code);
  var denied = checkTeamAccess(code, datos.group_key);
  if (denied) return denied;
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
  var role = validation.person_role;
  var crew = role === PERSON_ROLE.EQUIPO_TRABAJO;
  var norm = normalizarCedula(datos.id_number);
  var sameRelation = function (m) { return normalizarCedula(m.normalized_id_number) === norm && normalizePersonRole(m.person_role) === role; };
  var before = groupSummary(code).list.filter(sameRelation)[0];
  var memberId = before ? before.member_id : nuevoId('M');

  var signature = null;
  if (normalizarTexto(datos.signature_png)) {
    signature = storeSignature(code, memberId, datos.signature_png);            // Drive, outside the lock
    if (!signature.ok) return { ok: false, error: signature.error };
  }

  return exactlyOnceWithFile(key, signature, function () {
    var projects = leerHoja(HOJA.REGISTRO);
    var project = findGroupProject(code, projects);
    if (!project) return { ok: false, error: 'No encontramos ese proyecto.' };
    var allMembers = leerHoja(HOJA.INTEGRANTES);
    var summary = groupSummary(code, allMembers);
    var existing = summary.list.filter(sameRelation)[0];

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
    var declared = Number(project.members_declared) || 1;
    if (!crew) {
      var registeredAfter = summary.registered + (existing ? 0 : 1);
      if (registeredAfter > declared) alerts.push('SUPERA_INTEGRANTES_DECLARADOS');
    }

    var now = ahoraISO();
    var row = {
      group_code: code, project_submission_id: project.submission_id, updated_at: now,
      source: normalizarTexto(datos.source) || 'web', is_leader: existing ? esVerdadero(existing.is_leader) : false,
      full_name: normalizarTexto(datos.full_name), id_number: normalizarTexto(datos.id_number),
      normalized_id_number: norm, birth_date: normalizarTexto(datos.birth_date),
      age: validation.age === null ? '' : validation.age,
      adult_confirmation: esVerdadero(datos.adult_confirmation),
      artistic_role: crew ? '' : normalizarTexto(datos.artistic_role),
      person_role: role,
      crew_role: crew ? normalizarComparable(datos.crew_role).replace(/[^A-Z]/g, '') : '',
      on_stage: crew ? esVerdadero(datos.on_stage) : true,
      document_type: normalizeDocumentType(datos.document_type),
      person_id: personIdFor(norm),
      consent_terms: esVerdadero(datos.accept_terms), consent_data: esVerdadero(datos.accept_data_processing),
      consent_image: esVerdadero(datos.accept_image_voice), consent_at: now,
      terms_version: cfg('terms_version', ''), policy_version: cfg('policy_version', ''),
      data_controller: dataControllerStamp(), capture_source: 'web:formulario-equipo',
      member_status: validation.status, member_alert: alerts.join(' | ')
    };
    if (signature) {
      row.signature_file_id = signature.file_id;
      row.signature_sha256 = signature.sha256;
      row.signature_at = now;
    }

    if (existing) {
      actualizarFila(HOJA.INTEGRANTES, existing._fila, row);
      registrar('integrante', '', 'INTEGRANTE_ACTUALIZADO', code, existing.member_id + ' rol=' + role + ' estado=' + validation.status);
    } else {
      row.member_id = memberId;
      row.created_at = now;
      agregarFila(HOJA.INTEGRANTES, row);
      registrar('integrante', '', 'INTEGRANTE', code, memberId + ' rol=' + role + ' estado=' + validation.status);
    }

    var after = groupSummary(code);
    var okText = crew
      ? 'Quedaste registrado(a) como equipo de trabajo del proyecto. No ocupas cupo ni participas en la calificación.'
      : 'Tu autorización quedó registrada. Ya van ' + after.authorized + ' de ' + declared + ' intérpretes autorizados.';
    return {
      member_id: existing ? existing.member_id : memberId,
      member_status: validation.status,
      person_role: role,
      actualizado: !!existing,
      errores: validation.errors,
      group: {
        code: code,
        name: project.group_display_name || project.artistic_name,
        declared: declared,
        registered: after.registered,
        authorized: after.authorized,
        crew_registered: after.crew_registered
      },
      mensaje: validation.status === MEMBER_STATUS.AUTORIZADO
        ? okText
        : (validation.status === MEMBER_STATUS.NO_CUMPLE
            ? 'Cada persona del proyecto debe ser mayor de edad el día del evento. Tu registro quedó guardado y la organización lo revisará.'
            : 'Faltan datos o autorizaciones. Corrige lo marcado y envía de nuevo.')
    };
  });
}

// ---------------------------------------------------------------------------
// "Mi inscripción": status, group link recovery and backing-track upload
// ---------------------------------------------------------------------------

/**
 * Finds a project by code (also a code it held before withdrawing) or receipt, and proves
 * identity with the ID number.
 */
function findOwnProject(datos) {
  var doc = normalizarCedula(datos.id_number);
  if (!doc) return null;
  var code = normalizarComparable(datos.code);
  var receipt = normalizarComparable(datos.submission_id);
  var rows = leerHoja(HOJA.REGISTRO);
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    var previous = String(r.previous_code || '').toUpperCase().split(/[,\s]+/);
    var byCode = code && (normalizarComparable(r.code) === code || previous.indexOf(code) !== -1);
    var byReceipt = receipt && normalizarComparable(r.submission_id) === receipt;
    if ((byCode || byReceipt) && normalizarCedula(r.normalized_id_number || r.id_number) === doc) return r;
  }
  return null;
}

/** One sentence for the person, from the official states (never from the automatic verdict). */
function friendlyStatus(r, offer) {
  var e = normalizeEligibility(r.eligibility_status);
  var w = normalizarComparable(r.withdrawal_status);
  if (w) return 'Liberaste tu cupo' + (r.previous_code ? ' (' + r.previous_code + ')' : '') + '. Gracias por avisar.';
  if (offer) return 'Se liberó un cupo para ti: responde la oferta antes de que venza.';
  if (normalizarTexto(r.code)) return 'Tienes turno. Este es tu código y tu horario.';
  if (e === 'RECIBIDO') return 'Recibimos tu inscripción. La organización la está revisando: te escribiremos con el resultado.';
  if (e === 'EN_REVISION') return 'Tu inscripción está en revisión por la organización.';
  if (e === 'APTO') {
    var pool = normalizarComparable(r.pool_status);
    if (pool === 'SUPLENTE') return 'Eres apto y estás en la bolsa de suplentes: si se libera un cupo para ti, te avisaremos.';
    if (pool === 'FUERA_DE_BOLSA') return 'Eres apto. Los turnos y la bolsa de suplentes están completos.';
    if (pool === 'DECLINO') return 'Eres apto. No aceptaste el cupo ofrecido, así que ya no recibirás nuevas ofertas.';
    return 'Eres apto y estás en espera de la asignación de turnos (en orden de inscripción).';
  }
  if (e === 'INCOMPLETO') return 'A tu inscripción le faltan datos obligatorios: envía el formulario de nuevo con los datos completos.';
  if (e === 'NO_APTO') return 'Tu inscripción no cumple los requisitos de la convocatoria.';
  if (e === 'DUPLICADO') return 'Esta inscripción está duplicada: vale la primera que enviaste.';
  return 'Inscripción recibida.';
}

function accionMiInscripcion(datos) {
  var blocked = guardSubmission(datos, 'consulta');
  if (blocked) return blocked;
  var r = findOwnProject(datos);
  if (!r) return { ok: false, error: 'No encontramos una inscripción con esos datos. Revisa tu documento y tu código o comprobante.' };

  var team = null;
  var teamCode = teamCodeOf(r);
  if (teamCode) {
    var summary = groupSummary(teamCode);
    team = {
      code: teamCode,
      key: groupAccessKey(teamCode),
      link: membersLink(teamCode),
      open: teamLinksOpen() && cfgBool('integrantes_abierto', true),
      declared: Number(r.members_declared) || 1,
      registered: summary.registered,
      authorized: summary.authorized,
      crew_registered: summary.crew_registered,
      members: summary.list.map(function (m) {
        var parts = normalizarTexto(m.full_name).split(' ');
        return {
          name: parts[0] + (parts.length > 1 ? ' ' + parts[parts.length - 1].charAt(0) + '.' : ''),
          role: isCrew(m) ? (CREW_ROLE_LABELS[m.crew_role] || 'Equipo') : m.artistic_role,
          crew: isCrew(m), status: m.member_status, leader: esVerdadero(m.is_leader),
          signed: !!normalizarTexto(m.signature_file_id)
        };
      })
    };
  }

  var offer = leerHoja(HOJA.OFERTAS).filter(function (o) {
    return o.submission_id === r.submission_id && normalizarComparable(o.estado) === OFFER_STATUS.PENDIENTE && !offerExpired(o);
  })[0];
  var w = currentWindows();
  var hasSlot = !!normalizarTexto(r.code);
  var eligibility = normalizeEligibility(r.eligibility_status);

  return {
    submission_id: r.submission_id,
    eligibility_status: eligibility,
    estado_label: ELIGIBILITY_LABELS[eligibility] || eligibility,
    estado_texto: friendlyStatus(r, offer),
    participation_status: r.participation_status || participationStatus(r, !!offer),
    pool_status: normalizarComparable(r.pool_status),
    artistic_name: r.artistic_name,
    participation_mode: r.participation_mode || 'SOLISTA',
    code: r.code || '',
    previous_code: r.previous_code || '',
    withdrawal_status: r.withdrawal_status || '',
    bloque: hasSlot ? (r.final_block || r.original_block || '') : '',
    hora_llegada: hasSlot && r.arrival_time ? humanTime(r.arrival_time) : '',
    hora_audicion: hasSlot && (r.final_time || r.original_time) ? humanTime(r.final_time || r.original_time) : '',
    fecha_texto: humanDate(cfgFecha('evento_fecha', '2026-10-23')),
    lugar: cfg('evento_sede', ''),
    change_status: r.change_status || ESTADO_CAMBIO.SIN_SOLICITUD,
    final_confirmation: normalizarComparable(r.final_confirmation),
    acciones: {
      retiro: hasSlot && w.retiro_abierto,
      confirmacion_final: hasSlot && w.confirmacion_abierta,
      lista_bloqueada: w.lista_bloqueada,
      retiro_desde_texto: deadlineText(cfg('reemplazos_desde', '')),
      confirmacion_desde_texto: deadlineText(cfg('confirmacion_final_desde', '')),
      confirmacion_hasta_texto: deadlineText(cfg('confirmacion_final_hasta', '')),
      palabra_confirmacion: WITHDRAW_CONFIRMATION
    },
    oferta: offer ? {
      oferta_id: offer.oferta_id, slot_code: offer.slot_code,
      hora_llegada: humanTime(clockText(offer.slot_arrival) || offer.slot_arrival),
      hora_audicion: humanTime(clockText(offer.slot_time) || offer.slot_time),
      vence_texto: humanDateTime(offer.expires_at)
    } : null,
    song_name: r.song_name || '',
    track: {
      uses: esVerdadero(r.track_uses),
      method: r.track_method || '',
      status: r.track_status || (esVerdadero(r.track_uses) ? TRACK_STATUS.PENDIENTE : TRACK_STATUS.NO_APLICA),
      file_name: r.track_file_name || '',
      updated_at: r.track_updated_at || '',
      can_upload: hasSlot && cfgBool('pistas_abiertas', true),
      max_mb: cfgNumero('pista_max_mb', 15),
      formats: cfg('pista_formatos', 'mp3,wav,m4a,aac,ogg,flac')
    },
    video: { status: r.video_check_status || '', detail: r.video_check_detail || '' },
    group: team,
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
  if (!cfgBool('pistas_abiertas', true)) return { ok: false, cerrado: true, error: 'La recepción de pistas está cerrada.' };
  var key = 'pista:' + (datos.client_submission_id || Utilities.getUuid());
  var replay = replayIfRepeated(key);
  if (replay) return replay;
  var blocked = guardSubmission(datos, 'pista');
  if (blocked) return blocked;

  var row = findOwnProject({ id_number: datos.id_number, code: datos.code });
  if (!row) return { ok: false, error: 'El código y el documento no coinciden con una inscripción.' };
  if (!normalizarTexto(row.code)) {
    return { ok: false, error: 'La pista se envía después de recibir tu código B-XXX.' };
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
           mensaje: 'Recibimos tu pista como ' + stored.file_name + '. El día del evento lleva también una copia en USB.' };
}

// ---------------------------------------------------------------------------
// Live video-link check (called while the person fills Form 1)
// ---------------------------------------------------------------------------

function accionVerificarVideo(datos) {
  var url = normalizarTexto(datos.video_url);
  if (!url) return { status: VIDEO_STATUS.SIN_VIDEO, detail: '' };
  if (!cfgBool('verificar_videos', true)) return { status: VIDEO_STATUS.PENDIENTE, detail: 'Se revisará después.' };
  var cache = CacheService.getScriptCache();
  var minuteKey = 'rl:video:' + Math.floor(Date.now() / 60000);
  var n = Number(cache.get(minuteKey) || 0) + 1;
  cache.put(minuteKey, String(n), 120);
  if (n > 60) return { status: VIDEO_STATUS.PENDIENTE, detail: 'Lo revisaremos después de tu envío.' };
  return checkVideoUrl(url);
}

// ---------------------------------------------------------------------------
// Form 2 - schedule change
// ---------------------------------------------------------------------------

/** Records the request only; the new slot is decided by production, never chosen by the participant. */
function accionSolicitarCambio(datos) {
  if (!cfgBool('cambios_abiertos', true) || cfgBool('lista_oficial_bloqueada', false)) {
    return { ok: false, error: 'El plazo para solicitar cambios de horario ya cerró.', cerrado: true };
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
      return { ok: false, error: 'El nombre no coincide con el registrado para ese código.', motivo: 'NOMBRE_NO_COINCIDE' };
    }

    var solicitudId = nuevoId('CB');
    var horario = horarioDeCodigo(registro.code, agendaConfigurada());
    agregarFila(HOJA.CAMBIOS, {
      solicitud_id: solicitudId, at: ahoraISO(), code: registro.code, full_name: registro.full_name,
      original_block: registro.original_block || (horario ? horario.block_id : ''),
      original_time: clockText(registro.original_time) || (horario ? horario.audition_time : ''),
      can_attend_original: 'FALSE', reason_short: String(datos.reason_short || '').slice(0, 400),
      contact: normalizarTexto(datos.contact), acceptance: esVerdadero(datos.acceptance) ? 'TRUE' : 'FALSE',
      estado: ESTADO_CAMBIO.PENDIENTE, nuevo_bloque: '', nueva_hora: '', resuelto_at: '', resuelto_by: '', observacion: '',
      notificacion_estado: 'CORREO EN COLA'
    });
    actualizarFila(HOJA.REGISTRO, registro._fila, { change_requested: 'TRUE', change_status: ESTADO_CAMBIO.PENDIENTE,
                                                    participation_status: PARTICIPATION.CAMBIO_PENDIENTE });
    registrar('participante', '', 'SOLICITUD_CAMBIO', registro.code, solicitudId);
    enqueueEmail('CAMBIO_SOLICITADO', Object.assign({}, registro, { change_status: ESTADO_CAMBIO.PENDIENTE }), 'cambio',
                 { solicitud_id: solicitudId }, 'CAMBIO_SOLICITADO:' + solicitudId);
    return {
      solicitud_id: solicitudId, estado: ESTADO_CAMBIO.PENDIENTE,
      mensaje: 'Registramos tu solicitud. Producción te confirmará por WhatsApp o correo si es APROBADA o NO APROBADA. ' +
               'Mientras tanto tu horario original sigue vigente.'
    };
  });
}

/**
 * Kept for compatibility with iteration-1 links. Like "Mi inscripción" it needs the document AND the
 * code or receipt: a document number alone must never reveal whether, when or with which code someone
 * registered.
 */
function accionConsultarEstado(datos) {
  var blocked = guardSubmission(datos, 'consulta');
  if (blocked) return blocked;
  var ref = normalizarComparable(datos.code || datos.submission_id);
  if (!normalizarCedula(datos.id_number) || !ref) {
    return { ok: false, error: 'Escribe tu documento y tu código (B-XXX) o tu comprobante (S-XXXXXXXX).' };
  }
  var registro = findOwnProject(/^S-/.test(ref) ? { id_number: datos.id_number, submission_id: ref }
                                                 : { id_number: datos.id_number, code: ref });
  if (!registro) return { ok: false, error: 'No encontramos un registro con esos datos. Verifica tu documento y tu código.' };
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
      top: cfgNumero('top_seleccionados', 10),
      bolsa: cfgNumero('bolsa_aptos', 200),
      reemplazos_desde_texto: deadlineText(cfg('reemplazos_desde', '')),
      confirmacion_final_texto: deadlineText(cfg('confirmacion_final_desde', '')),
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
      firma_inscripcion: cfgBool('firma_inscripcion', true),
      document_types: DOCUMENT_TYPES.map(function (d) { return { id: d, etiqueta: DOCUMENT_TYPE_LABELS[d] }; }),
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
