/**
 * EL BUNKER - Logistics and admin actions.
 * Everything a non-technical coordinator needs, with no SQL and no code edits.
 */

/** Fields the logistics table shows. Personal data stays out of the direction view. */
function registryRowView(r) {
  return {
    fila: r._fila, submission_id: r.submission_id, code: r.code,
    created_at: r.created_at, full_name: r.full_name, id_number: r.id_number,
    age: r.age, neighborhood_sector: r.neighborhood_sector, email: r.email,
    whatsapp: r.whatsapp, artistic_name: r.artistic_name,
    participation_mode: r.participation_mode || (r.discipline ? 'SOLISTA' : ''),
    genre_primary: projectGenre(r), members_declared: r.members_declared,
    group_code: r.group_code, group_match_status: r.group_match_status, group_match_ref: r.group_match_ref,
    video_url: r.video_url, video_check_status: r.video_check_status, video_check_detail: r.video_check_detail,
    track_status: r.track_status, eligibility_status: r.eligibility_status,
    eligibility_override: r.eligibility_override,
    duplicate_flag: r.duplicate_flag, duplicate_reason: r.duplicate_reason,
    validation_notes: r.validation_notes,
    original_block: r.original_block, original_time: clockText(r.original_time),
    final_block: r.final_block, final_time: clockText(r.final_time),
    change_status: r.change_status, attendance_status: r.attendance_status,
    consent_whatsapp: r.consent_whatsapp, consent_image: r.consent_image,
    terms_version: r.terms_version, legacy: !r.participation_mode
  };
}

/** Main genre, falling back to the iteration-1 "discipline" for older rows. */
function projectGenre(r) {
  return normalizarTexto(r.genre_primary) || normalizarTexto(r.discipline);
}

function filterRegistry(filas, datos) {
  var filtro = normalizarComparable(datos.filtro || '');
  var busqueda = normalizarComparable(datos.q || '');
  return filas.filter(function (r) {
    if (filtro && filtro !== 'TODOS') {
      if (filtro === 'AGRUPACIONES') { if (!r.group_code) return false; }
      else if (filtro === 'CON_CODIGO') { if (!normalizarTexto(r.code)) return false; }
      else if (normalizarComparable(r.eligibility_status) !== filtro) return false;
    }
    if (!busqueda) return true;
    return normalizarComparable(r.full_name).indexOf(busqueda) !== -1 ||
           normalizarComparable(r.code).indexOf(busqueda) !== -1 ||
           normalizarComparable(r.group_code).indexOf(busqueda) !== -1 ||
           (normalizarCedula(datos.q) && normalizarCedula(r.id_number).indexOf(normalizarCedula(datos.q)) !== -1) ||
           normalizarComparable(r.artistic_name).indexOf(busqueda) !== -1;
  });
}

function accionListarRegistro(datos) {
  var filas = leerHoja(HOJA.REGISTRO);
  var vista = filterRegistry(filas, datos);
  return {
    total: filas.length,
    mostrados: vista.length,
    resumen: resumenElegibilidad(filas),
    filas: vista.map(registryRowView)
  };
}

/** Same list for the direction role, with ID numbers, e-mails and phones masked. */
function accionListarRegistroEnmascarado(datos) {
  var filas = leerHoja(HOJA.REGISTRO);
  var vista = filterRegistry(filas, { filtro: datos.filtro, q: normalizarCedula(datos.q) ? '' : datos.q });
  return {
    total: filas.length,
    mostrados: vista.length,
    resumen: resumenElegibilidad(filas),
    filas: vista.map(function (r) {
      var v = registryRowView(r);
      v.id_number = maskIdNumber(r.id_number);
      v.email = maskEmail(r.email);
      v.whatsapp = maskPhone(r.whatsapp);
      delete v.validation_notes;
      delete v.video_url;
      return v;
    })
  };
}

function resumenElegibilidad(filas) {
  var r = { total: filas.length, apto: 0, incompleto: 0, no_cumple: 0, revision: 0,
            duplicado: 0, con_codigo: 0, unicos: 0, agrupaciones: 0, duos: 0, solistas: 0 };
  var cedulas = {};
  filas.forEach(function (f) {
    var e = normalizarComparable(f.eligibility_status);
    if (e === 'APTO') r.apto++;
    else if (e === 'INCOMPLETO') r.incompleto++;
    else if (e === 'NO_CUMPLE') r.no_cumple++;
    else if (e === 'REVISION') r.revision++;
    else if (e === 'DUPLICADO') r.duplicado++;
    if (normalizarTexto(f.code)) r.con_codigo++;
    var mode = normalizeParticipationMode(f.participation_mode) || 'SOLISTA';
    if (mode === 'AGRUPACION') r.agrupaciones++; else if (mode === 'DUO') r.duos++; else r.solistas++;
    var c = normalizarCedula(f.id_number);
    if (c) cedulas[c] = true;
  });
  r.unicos = Object.keys(cedulas).length;
  r.validos = r.apto + r.revision;
  return r;
}

/** A stored REGISTRO row, shaped back into what validarInscripcion reads. */
function rowAsSubmission(r) {
  return {
    full_name: r.full_name, id_number: r.id_number, birth_date: r.birth_date,
    neighborhood_sector: r.neighborhood_sector,
    resides_in_sabaneta: normalizarTexto(r.residence) === '' ? '' : (normalizarComparable(r.residence) === 'FUERA' ? 'NO' : 'SI'),
    email: r.email, whatsapp: r.whatsapp, participation_mode: r.participation_mode,
    artistic_name: r.artistic_name, members_declared: r.members_declared,
    genre_primary: r.genre_primary, audition_description: r.audition_description,
    presentation_format: r.presentation_format, presentation_other: r.presentation_other,
    own_equipment: r.own_equipment, own_equipment_detail: r.own_equipment_detail,
    track_uses: r.track_uses, track_method: r.track_method, track_method_other: r.track_method_other,
    video_url: r.video_url, adult_confirmation: r.adult_confirmation,
    availability_statement: r.availability_statement,
    accept_terms: r.consent_terms, accept_data_processing: r.consent_data
  };
}

/**
 * Re-runs validation, duplicate and group detection over every row, e.g. after
 * changing the age range in CONFIG. A decision the operator took by hand
 * (eligibility_override) is kept; an issued code is never stripped.
 */
function accionRevalidarTodo(datos, sesion) {
  return conBloqueo(function () {
    invalidarCacheConfig();
    var opciones = opcionesValidacion();
    var filas = leerHoja(HOJA.REGISTRO);
    var seen = [];
    var updates = [];

    filas.forEach(function (r) {
      var verdict = validarInscripcion(rowAsSubmission(r), opciones);
      var candidate = {
        submission_id: r.submission_id,
        normalized_id_number: normalizarCedula(r.id_number),
        normalized_email: normalizarEmail(r.email),
        normalized_phone: normalizarTelefono(r.whatsapp),
        participation_mode: r.participation_mode,
        group_match_key: r.group_match_key || (isGroupMode(r.participation_mode) ? groupMatchKey(r.artistic_name) : ''),
        group_display_name: r.group_display_name
      };
      var dup = detectarDuplicado(candidate, seen);
      var matchStatus = normalizarComparable(r.group_match_status);
      var gm = (candidate.group_match_key && matchStatus !== 'CONFIRMADA_DISTINTA')
        ? detectGroupMatch(candidate, seen) : { match: false };
      seen.push(candidate);

      var status = verdict.eligibility_status;
      if (matchStatus === 'CONFIRMADA_MISMA' || dup.duplicate_flag) status = ESTADO_ELEGIBILIDAD.DUPLICADO;
      else if ((dup.alerta || gm.match) && status === ESTADO_ELEGIBILIDAD.APTO) status = ESTADO_ELEGIBILIDAD.REVISION;

      var notes = verdict.errores.map(function (x) { return x.campo + ':' + x.codigo; });
      var override = normalizarComparable(r.eligibility_override);
      if (override && ESTADO_ELEGIBILIDAD[override]) {
        if (override !== status) notes.push('DECISION_MANUAL(' + override + ') sobre regla(' + status + ')');
        status = override;
      }
      // A row that already holds a code keeps its seat: re-validation informs, it does not strip.
      if (normalizarTexto(r.code) && status === ESTADO_ELEGIBILIDAD.DUPLICADO) status = ESTADO_ELEGIBILIDAD.REVISION;

      updates.push({
        fila: r._fila,
        cambios: {
          age: verdict.edad === null ? '' : verdict.edad,
          eligibility_status: status,
          duplicate_flag: dup.duplicate_flag || matchStatus === 'CONFIRMADA_MISMA',
          duplicate_reason: matchStatus === 'CONFIRMADA_MISMA' ? 'GRUPO_REPETIDO' : dup.duplicate_reason,
          registro_principal: matchStatus === 'CONFIRMADA_MISMA' ? r.group_match_ref : dup.registro_principal,
          normalized_id_number: candidate.normalized_id_number,
          normalized_email: candidate.normalized_email,
          normalized_phone: candidate.normalized_phone,
          group_match_key: candidate.group_match_key,
          group_match_status: matchStatus || (gm.match ? 'POSIBLE_REPETIDA' : ''),
          group_match_ref: r.group_match_ref || (gm.match ? gm.ref : ''),
          validation_notes: notes.join(' | ')
        }
      });
    });

    actualizarFilasEnLote(HOJA.REGISTRO, updates);
    registrar(sesion.alias, sesion.rol, 'REVALIDAR_TODO', '', filas.length + ' filas');
    return { revalidados: filas.length, resumen: resumenElegibilidad(leerHoja(HOJA.REGISTRO)) };
  });
}

/** Manual decision by logistics, always logged with who and why, and kept by later re-validations. */
function accionMarcarElegibilidad(datos, sesion) {
  return conBloqueo(function () {
    var registro = datos.submission_id
      ? leerHoja(HOJA.REGISTRO).filter(function (r) { return r.submission_id === datos.submission_id; })[0]
      : buscarPorCodigo(datos.code);
    if (!registro) return { ok: false, error: 'Registro no encontrado.' };
    if (!normalizarTexto(datos.motivo)) return { ok: false, error: 'Escribe el motivo: queda en la bitacora.' };

    var nuevo = normalizarComparable(datos.eligibility_status);
    if (!ESTADO_ELEGIBILIDAD[nuevo]) return { ok: false, error: 'Estado de elegibilidad invalido: ' + datos.eligibility_status };

    actualizarFila(HOJA.REGISTRO, registro._fila, {
      eligibility_status: nuevo,
      eligibility_override: nuevo,
      override_by: sesion.alias,
      override_at: ahoraISO(),
      notes: [registro.notes, '[' + ahoraISO() + ' ' + sesion.alias + '] ' + nuevo + ': ' + datos.motivo]
        .filter(Boolean).join(' || ')
    });
    registrar(sesion.alias, sesion.rol, 'MARCAR_ELEGIBILIDAD', registro.submission_id,
              registro.eligibility_status + '->' + nuevo + ' motivo=' + datos.motivo);
    return { submission_id: registro.submission_id, eligibility_status: nuevo };
  });
}

/**
 * "Cerrar los 100": issues B-001..B-100 and writes each project's block,
 * arrival time and audition time in one pass. A group is one project, so it
 * takes exactly one code however many members it has.
 */
function accionAsignarCodigos(datos, sesion) {
  return conBloqueo(function () {
    var cfgAgenda = agendaConfigurada();
    var filas = leerHoja(HOJA.REGISTRO);
    var resultado = asignarCodigos(filas, {
      cupo: cfgNumero('cupo_total', 100),
      ahora: ahoraISO(),
      responsable: sesion.alias || 'logistica'
    });

    var porId = {};
    filas.forEach(function (r) { porId[r.submission_id] = r; });

    var actualizaciones = resultado.asignados.map(function (a) {
      var h = horarioDeCodigo(a.code, cfgAgenda);
      return {
        fila: porId[a.submission_id]._fila,
        cambios: {
          code: a.code,
          issued_at: a.issued_at,
          issued_by: a.issued_by,
          original_block: h.block_id,
          original_time: h.audition_time,
          final_block: h.block_id,
          final_time: h.audition_time,
          arrival_time: h.arrival_time,
          attendance_status: ESTADO.CONFIRMADO,
          change_status: ESTADO_CAMBIO.SIN_SOLICITUD
        }
      };
    });

    actualizarFilasEnLote(HOJA.REGISTRO, actualizaciones);
    refrescarVistas();

    registrar(sesion.alias, sesion.rol, 'ASIGNAR_CODIGOS', '',
              'nuevos=' + resultado.asignados.length + ' sin_cupo=' + resultado.sin_cupo.length);

    return {
      asignados: resultado.asignados.length,
      ya_tenian: resultado.ya_tenian,
      total_con_codigo: resultado.total_con_codigo,
      sin_cupo: resultado.sin_cupo.length,
      cupo: resultado.cupo,
      detalle: resultado.asignados.slice(0, 200)
    };
  });
}

function accionListarCambios(datos) {
  var cambios = leerHoja(HOJA.CAMBIOS);
  var estado = normalizarComparable(datos.estado || '');
  return {
    cambios: cambios.filter(function (c) {
      return !estado || estado === 'TODOS' || normalizarComparable(c.estado) === estado;
    }),
    pendientes: cambios.filter(function (c) { return normalizarComparable(c.estado) === 'PENDIENTE'; }).length
  };
}

function accionBloquesDisponibles() {
  return { bloques: bloquesConCupo(leerHoja(HOJA.REGISTRO), agendaConfigurada()) };
}

/** Production approves (with a destination block) or rejects. */
function accionResolverCambio(datos, sesion) {
  return conBloqueo(function () {
    var solicitudes = leerHoja(HOJA.CAMBIOS);
    var solicitud = solicitudes.filter(function (c) { return c.solicitud_id === datos.solicitud_id; })[0];
    if (!solicitud) return { ok: false, error: 'Solicitud no encontrada.' };
    if (normalizarComparable(solicitud.estado) !== 'PENDIENTE') {
      return { ok: false, error: 'Esta solicitud ya fue resuelta (' + solicitud.estado + ').' };
    }

    var registro = buscarPorCodigo(solicitud.code);
    if (!registro) return { ok: false, error: 'El participante ya no existe en REGISTRO.' };

    var aprobar = esVerdadero(datos.aprobar);

    if (!aprobar) {
      actualizarFila(HOJA.CAMBIOS, solicitud._fila, {
        estado: ESTADO_CAMBIO.RECHAZADO, resuelto_at: ahoraISO(),
        resuelto_by: sesion.alias, observacion: datos.observacion || ''
      });
      actualizarFila(HOJA.REGISTRO, registro._fila, {
        change_status: ESTADO_CAMBIO.RECHAZADO,
        changed_at: ahoraISO(), changed_by: sesion.alias
      });
      registrar(sesion.alias, sesion.rol, 'CAMBIO_RECHAZADO', solicitud.code, datos.observacion || '');
      refrescarVistas();
      return { estado: ESTADO_CAMBIO.RECHAZADO, code: solicitud.code,
               mensaje: 'Solicitud rechazada. El participante mantiene su horario original.' };
    }

    // Capacity is verified at approval time, not at request time.
    var libres = bloquesConCupo(leerHoja(HOJA.REGISTRO), agendaConfigurada());
    var destino = libres.filter(function (b) { return String(b.block_id) === String(datos.nuevo_bloque); })[0];
    if (!destino) return { ok: false, error: 'Bloque destino invalido.' };
    if (destino.disponibles <= 0) {
      return { ok: false, error: 'El bloque ' + destino.block_id + ' ya está lleno (' + destino.ocupados + '/' + destino.cupo + ').' };
    }

    var aplicado = aplicarCambio(registro, datos.nuevo_bloque, {
      agenda: agendaConfigurada(), ahora: ahoraISO(), responsable: sesion.alias
    });
    if (!aplicado.ok) return { ok: false, error: aplicado.mensaje };

    actualizarFila(HOJA.REGISTRO, registro._fila, aplicado.cambios);
    actualizarFila(HOJA.CAMBIOS, solicitud._fila, {
      estado: ESTADO_CAMBIO.APROBADO, nuevo_bloque: aplicado.horario.block_id,
      nueva_hora: aplicado.horario.audition_time, resuelto_at: ahoraISO(),
      resuelto_by: sesion.alias, observacion: datos.observacion || ''
    });
    registrar(sesion.alias, sesion.rol, 'CAMBIO_APROBADO', solicitud.code,
              'bloque=' + aplicado.horario.block_id);
    refrescarVistas();

    return {
      estado: ESTADO_CAMBIO.APROBADO, code: solicitud.code,
      nuevo_bloque: aplicado.horario.block_id,
      nueva_hora: aplicado.horario.audition_time,
      hora_llegada: aplicado.horario.arrival_time,
      mensaje: 'Cambio aprobado. El código ' + solicitud.code + ' NO cambia; solo su horario.'
    };
  });
}

function accionNuevoIncidente(datos, sesion) {
  var id = registrarIncidente(datos.code, datos.tipo || 'GENERAL', datos.descripcion,
                              datos.accion, sesion.alias || 'operador');
  return { incidente_id: id };
}

function accionCrearUsuario(datos, sesion) {
  if (!datos.alias || !datos.rol) return { ok: false, error: 'Faltan alias y rol.' };
  return provisionarUsuario(datos.alias, datos.rol, datos.nota);
}

function accionRefrescarVistas(datos, sesion) {
  var r = refrescarVistas();
  registrar(sesion.alias, sesion.rol, 'REFRESCAR_VISTAS', '', JSON.stringify(r));
  return r;
}

// ---------------------------------------------------------------------------
// Groups
// ---------------------------------------------------------------------------

/** Every group project with its members (logistics sees full data: it operates with it). */
function accionListarAgrupaciones(datos) {
  var projects = leerHoja(HOJA.REGISTRO).filter(function (r) { return normalizarTexto(r.group_code); });
  var members = leerHoja(HOJA.INTEGRANTES);
  return {
    total: projects.length,
    agrupaciones: projects.map(function (p) {
      var summary = groupSummary(p.group_code, members);
      return {
        submission_id: p.submission_id, code: p.code, group_code: p.group_code,
        group_display_name: p.group_display_name || p.artistic_name,
        group_match_status: p.group_match_status, group_match_ref: p.group_match_ref,
        participation_mode: p.participation_mode, eligibility_status: p.eligibility_status,
        leader_name: p.full_name, leader_whatsapp: p.whatsapp,
        members_declared: Number(p.members_declared) || '', members_registered: summary.registered,
        members_authorized: summary.authorized,
        members_link: membersLink(p.group_code),
        members: summary.list.map(function (m) {
          return {
            member_id: m.member_id, full_name: m.full_name, id_number: m.id_number, age: m.age,
            artistic_role: m.artistic_role, is_leader: esVerdadero(m.is_leader),
            consent_terms: esVerdadero(m.consent_terms), consent_data: esVerdadero(m.consent_data),
            consent_image: esVerdadero(m.consent_image), signature: !!normalizarTexto(m.signature_file_id),
            member_status: m.member_status, member_alert: m.member_alert
          };
        })
      };
    })
  };
}

/**
 * The operator decides whether two groups with the same match key are the
 * same project. MISMO keeps one seat (the later one becomes DUPLICADO);
 * DISTINTO keeps both and records the decision. Nothing is merged or renamed.
 */
function accionResolverCoincidenciaGrupo(datos, sesion) {
  return conBloqueo(function () {
    var rows = leerHoja(HOJA.REGISTRO);
    var row = rows.filter(function (r) { return r.submission_id === datos.submission_id; })[0];
    if (!row) return { ok: false, error: 'Registro no encontrado.' };
    if (normalizarComparable(row.group_match_status) !== 'POSIBLE_REPETIDA') {
      return { ok: false, error: 'Esta inscripción no tiene una coincidencia pendiente.' };
    }
    var decision = normalizarComparable(datos.decision);
    if (decision !== 'MISMO' && decision !== 'DISTINTO') return { ok: false, error: 'Decision invalida (MISMO o DISTINTO).' };
    var stamp = '[' + ahoraISO() + ' ' + sesion.alias + '] coincidencia de agrupacion: ' + decision +
                (datos.motivo ? ' - ' + datos.motivo : '');
    var changes = { notes: [row.notes, stamp].filter(Boolean).join(' || ') };

    if (decision === 'MISMO') {
      changes.group_match_status = 'CONFIRMADA_MISMA';
      changes.duplicate_flag = true;
      changes.duplicate_reason = 'GRUPO_REPETIDO';
      changes.registro_principal = row.group_match_ref;
      changes.eligibility_status = normalizarTexto(row.code) ? ESTADO_ELEGIBILIDAD.REVISION : ESTADO_ELEGIBILIDAD.DUPLICADO;
    } else {
      changes.group_match_status = 'CONFIRMADA_DISTINTA';
      var others = rows.filter(function (r) { return r.submission_id !== row.submission_id; });
      var verdict = validarInscripcion(rowAsSubmission(row), opcionesValidacion());
      var dup = detectarDuplicado({
        submission_id: row.submission_id, normalized_id_number: normalizarCedula(row.id_number),
        normalized_email: normalizarEmail(row.email), normalized_phone: normalizarTelefono(row.whatsapp)
      }, others);
      var status = verdict.eligibility_status;
      if (dup.duplicate_flag) status = ESTADO_ELEGIBILIDAD.DUPLICADO;
      else if (dup.alerta && status === ESTADO_ELEGIBILIDAD.APTO) status = ESTADO_ELEGIBILIDAD.REVISION;
      changes.eligibility_status = status;
    }
    actualizarFila(HOJA.REGISTRO, row._fila, changes);
    registrar(sesion.alias, sesion.rol, 'GRUPO_COINCIDENCIA_' + decision, row.submission_id, row.group_match_ref);
    return { submission_id: row.submission_id, decision: decision, eligibility_status: changes.eligibility_status };
  });
}

/** Clause 8 of the source terms: members may be updated. Only the declared size is editable here. */
function accionActualizarIntegrantesDeclarados(datos, sesion) {
  return conBloqueo(function () {
    var row = leerHoja(HOJA.REGISTRO).filter(function (r) { return r.submission_id === datos.submission_id; })[0];
    if (!row || !row.group_code) return { ok: false, error: 'Agrupacion no encontrada.' };
    var n = parseInt(datos.members_declared, 10);
    var mode = normalizeParticipationMode(row.participation_mode);
    var max = cfgNumero('integrantes_max', 15);
    if (mode === 'DUO' && n !== 2) return { ok: false, error: 'Un duo tiene exactamente 2 integrantes.' };
    if (mode === 'AGRUPACION' && !(n >= 3 && n <= max)) return { ok: false, error: 'Una agrupación tiene entre 3 y ' + max + ' integrantes.' };
    actualizarFila(HOJA.REGISTRO, row._fila, {
      members_declared: n,
      notes: [row.notes, '[' + ahoraISO() + ' ' + sesion.alias + '] integrantes declarados ' + row.members_declared + ' -> ' + n +
              (datos.motivo ? ' - ' + datos.motivo : '')].filter(Boolean).join(' || ')
    });
    registrar(sesion.alias, sesion.rol, 'INTEGRANTES_DECLARADOS', row.group_code, row.members_declared + '->' + n);
    return { group_code: row.group_code, members_declared: n };
  });
}

// ---------------------------------------------------------------------------
// Backing tracks and videos
// ---------------------------------------------------------------------------

function driveFileUrl(id) {
  return id ? 'https://drive.google.com/file/d/' + id + '/view' : '';
}

/** Tracks in agenda order: what the audio technician works from. */
function accionListarPistas(datos) {
  var rows = leerHoja(HOJA.REGISTRO).filter(function (r) {
    return normalizarTexto(r.code) || esVerdadero(r.track_uses);
  });
  rows.sort(function (a, b) {
    var ba = Number(a.final_block || a.original_block || 99), bb = Number(b.final_block || b.original_block || 99);
    if (ba !== bb) return ba - bb;
    return String(a.code) < String(b.code) ? -1 : 1;
  });
  var counts = {};
  var list = rows.map(function (r) {
    var status = r.track_status || (esVerdadero(r.track_uses) ? TRACK_STATUS.PENDIENTE : TRACK_STATUS.NO_APLICA);
    counts[status] = (counts[status] || 0) + 1;
    return {
      code: r.code, artistic_name: r.artistic_name || r.full_name, participation_mode: r.participation_mode,
      song_name: r.song_name, presentation_format: r.presentation_format, needs: r.technical_needs,
      own_equipment_detail: r.own_equipment_detail, track_uses: esVerdadero(r.track_uses),
      track_method: r.track_method, track_status: status, track_file_name: r.track_file_name,
      track_file_url: driveFileUrl(r.track_file_id), track_updated_at: r.track_updated_at,
      track_notes: r.track_notes, final_block: r.final_block || r.original_block,
      final_time: clockText(r.final_time || r.original_time), attendance_status: r.attendance_status
    };
  });
  var folderId = PropertiesService.getScriptProperties().getProperty(PROP.AUDIO_FOLDER);
  return { total: list.length, por_estado: counts, pistas: list,
           carpeta_audio: folderId ? 'https://drive.google.com/drive/folders/' + folderId : '' };
}

/** The technician validates or flags a track. */
function accionMarcarPista(datos, sesion) {
  var valid = [TRACK_STATUS.PENDIENTE, TRACK_STATUS.RECIBIDA, TRACK_STATUS.VALIDADA, TRACK_STATUS.PROBLEMA, TRACK_STATUS.NO_APLICA];
  var status = normalizarTexto(datos.track_status).toUpperCase();
  if (valid.indexOf(status) === -1) return { ok: false, error: 'Estado de pista invalido.' };
  return conBloqueo(function () {
    var row = buscarPorCodigo(datos.code);
    if (!row) return { ok: false, error: 'Codigo no encontrado.' };
    actualizarFila(HOJA.REGISTRO, row._fila, {
      track_status: status,
      track_notes: [row.track_notes, '[' + ahoraISO() + ' ' + sesion.alias + '] ' + status +
                    (datos.nota ? ': ' + datos.nota : '')].filter(Boolean).join(' || ')
    });
    registrar(sesion.alias, sesion.rol, 'PISTA_ESTADO', row.code, status);
    return { code: row.code, track_status: status };
  });
}

/** Upload on behalf of a participant (e.g. a file received on the official WhatsApp). */
function accionSubirPistaAdmin(datos, sesion) {
  var row = buscarPorCodigo(datos.code);
  if (!row || !normalizarTexto(row.code)) return { ok: false, error: 'Codigo no encontrado.' };
  var stored = storeTrack(row, datos.file_name, datos.file_base64, datos.song_name);
  if (!stored.ok) return stored;
  var method = normalizarComparable(datos.method) || 'WHATSAPP';
  return conBloqueo(function () { return recordTrack(row.code, stored, datos.song_name, method, sesion.alias); });
}

function accionPrepararCarpetasAudio(datos, sesion) {
  var r = prepareAudioFolders();
  registrar(sesion.alias, sesion.rol, 'CARPETAS_AUDIO', '', 'creadas=' + r.creadas);
  return r;
}

function accionVerificarVideos(datos, sesion) {
  var r = verifyPendingVideos({ all: esVerdadero(datos.todos), limit: Number(datos.limite) || 200 });
  registrar(sesion.alias, sesion.rol, 'VERIFICAR_VIDEOS', '', JSON.stringify(r.por_estado));
  return r;
}

// ---------------------------------------------------------------------------
// Contacts for the official WhatsApp broadcast list
// ---------------------------------------------------------------------------

/**
 * vCard file with everyone who authorized operational WhatsApp messages, to
 * import into the phone that owns the official number. WhatsApp broadcast
 * lists only reach people who saved that number too, which is why the
 * confirmation screen asks participants to save it.
 */
function accionExportarContactos(datos, sesion) {
  var scope = normalizarComparable(datos.alcance || 'CON_CODIGO');
  var rows = leerHoja(HOJA.REGISTRO).filter(function (r) {
    if (!esVerdadero(r.consent_whatsapp) || !esTelefonoValido(r.whatsapp)) return false;
    if (scope === 'CON_CODIGO') return !!normalizarTexto(r.code);
    if (scope === 'APTOS') return normalizarComparable(r.eligibility_status) === 'APTO' || !!normalizarTexto(r.code);
    return true;
  });
  var lines = [];
  rows.forEach(function (r) {
    var label = (r.code ? r.code + ' ' : '') + normalizarTexto(r.full_name) +
                (r.artistic_name ? ' (' + normalizarTexto(r.artistic_name) + ')' : '');
    lines.push('BEGIN:VCARD', 'VERSION:3.0',
      'FN:' + label.replace(/[\r\n;]/g, ' '),
      'N:' + normalizarTexto(r.full_name).replace(/[\r\n;]/g, ' ') + ';;;;',
      'TEL;TYPE=CELL:+57' + normalizarTelefono(r.whatsapp),
      'NOTE:EL BUNKER ' + (r.code || r.submission_id),
      'END:VCARD');
  });
  var vcf = lines.join('\r\n') + '\r\n';
  var name = 'CONTACTOS-' + scope + '-' + timestampForNames() + '.vcf';
  var file = carpetaBackups().createFile(Utilities.newBlob(vcf, 'text/vcard', name));
  registrar(sesion.alias, sesion.rol, 'EXPORTAR_CONTACTOS', scope, rows.length + ' contactos');
  return { total: rows.length, archivo: name, url: file.getUrl(), vcf: vcf };
}

// ---------------------------------------------------------------------------
// Committee decisions and production health
// ---------------------------------------------------------------------------

/**
 * Minutes of the committee for a tie at the cut that the ladder could not
 * break. The new decision replaces any previous one; RESULTADOS applies it
 * only if it still matches the current tie.
 */
function accionRegistrarDeliberacion(datos, sesion) {
  var codes = String(datos.codes_in_order || '').split(/[\s,;]+/).map(function (c) { return normalizarComparable(c); }).filter(Boolean);
  if (codes.length < 2) return { ok: false, error: 'Indica el orden decidido con al menos dos codigos.' };
  if (!normalizarTexto(datos.acta)) return { ok: false, error: 'Escribe el acta: quienes deliberaron y por que.' };
  return conBloqueo(function () {
    leerHoja(HOJA.DELIBERACIONES).forEach(function (d) {
      if (normalizarComparable(d.status) === 'VIGENTE') actualizarFila(HOJA.DELIBERACIONES, d._fila, { status: 'REEMPLAZADA' });
    });
    var id = nuevoId('ACTA');
    agregarFila(HOJA.DELIBERACIONES, {
      deliberation_id: id, at: ahoraISO(), by: sesion.alias, codes_in_order: codes.join(','),
      cut_position: cfgNumero('top_seleccionados', 7), minutes: String(datos.acta).slice(0, 2000), status: 'VIGENTE'
    });
    registrar(sesion.alias, sesion.rol, 'DELIBERACION', id, codes.join(','));
    reconstruirResultados(leerHoja(HOJA.REGISTRO));
    return { deliberation_id: id, codes_in_order: codes };
  });
}

/** Counts rows that carry test-data markers. In production this must always be zero. */
function auditTestData() {
  var projects = leerHoja(HOJA.REGISTRO).filter(function (r) {
    return isTestData({ source: r.source, email: r.email, client_submission_id: '' }) ||
           /^PRUEBA-/.test(String(r.artistic_name || ''));
  });
  var members = leerHoja(HOJA.INTEGRANTES).filter(function (m) { return normalizarComparable(m.source) === 'SEED'; });
  return { entorno: environmentName(), marca_hoja: spreadsheetEnvironment(), proyectos_de_prueba: projects.length,
           integrantes_de_prueba: members.length, limpio: projects.length === 0 && members.length === 0 };
}

function accionAuditarDatosDePrueba() {
  return auditTestData();
}

/**
 * Data for the printable record of a group: project, members, their
 * authorizations and drawn signatures, plus blank lines for anyone who signs
 * on paper at the desk (the brief's alternative to the digital signature).
 */
function constanciaData(groupCode) {
  var code = normalizarComparable(groupCode);
  var project = findGroupProject(code);
  if (!project) return null;
  var summary = groupSummary(code);
  var declared = Number(project.members_declared) || summary.registered;
  return {
    group_code: code,
    project_code: project.code || '(sin código aún)',
    group_display_name: project.group_display_name || project.artistic_name,
    participation_mode: project.participation_mode,
    leader_name: project.full_name,
    leader_id_number: project.id_number,
    genre: projectGenre(project),
    members_declared: declared,
    terms_version: cfg('terms_version', ''),
    policy_version: cfg('policy_version', 'v2'),
    legal_name: cfg('legal_name', ''),
    generated_at: ahoraISO(),
    members: summary.list.map(function (m) {
      return {
        full_name: m.full_name, id_number: m.id_number, artistic_role: m.artistic_role,
        is_leader: esVerdadero(m.is_leader), status: m.member_status, consent_at: m.consent_at,
        consent_image: esVerdadero(m.consent_image), signature: signatureDataUrl(m.signature_file_id),
        signature_sha256: m.signature_sha256
      };
    }),
    blank_lines: Math.max(0, declared - summary.list.length)
  };
}
