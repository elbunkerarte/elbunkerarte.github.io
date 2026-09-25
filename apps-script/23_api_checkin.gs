/**
 * EL BUNKER - Check-in desk actions (event day).
 *
 * Flow on the day: access -> CHECK-IN -> PRECOLA -> EN AUDICION -> REALIZADA
 * (exit). This is the only module that has to keep working on a bad
 * connection, so it exposes a full roster download and a batch sync of queued
 * operations.
 */

/** Members of each group, keyed by group code, trimmed to what the desk needs to verify identity. */
function membersByGroup() {
  var byGroup = {};
  leerHoja(HOJA.INTEGRANTES).forEach(function (m) {
    var code = normalizarComparable(m.group_code);
    if (!code) return;
    if (!byGroup[code]) byGroup[code] = [];
    byGroup[code].push({
      full_name: m.full_name,
      id_number: String(m.id_number || ''),
      artistic_role: m.artistic_role,
      is_leader: esVerdadero(m.is_leader),
      member_status: m.member_status,
      signature: !!normalizarTexto(m.signature_file_id),
      consent_image: esVerdadero(m.consent_image)
    });
  });
  return byGroup;
}

/** One participant as the desk sees it. */
function deskView(r, members) {
  var list = r.group_code ? (members[normalizarComparable(r.group_code)] || []) : [];
  return {
    code: r.code,
    full_name: r.full_name,
    id_number: String(r.id_number || ''),
    artistic_name: r.artistic_name,
    discipline: projectGenre(r),
    participation_mode: r.participation_mode || 'SOLISTA',
    group_code: r.group_code || '',
    members_declared: Number(r.members_declared) || (r.group_code ? '' : 1),
    members: list,
    members_authorized: list.filter(function (m) { return normalizarComparable(m.member_status) === 'AUTORIZADO'; }).length,
    final_block: r.final_block || r.original_block,
    arrival_time: clockText(r.arrival_time),
    final_time: clockText(r.final_time || r.original_time),
    final_time_texto: humanTime(r.final_time || r.original_time),
    attendance_status: r.attendance_status || ESTADO.CONFIRMADO,
    audition_status: r.audition_status || '',
    check_in_time: r.check_in_time || '',
    precola_at: r.precola_at || '', stage_at: r.stage_at || '', done_at: r.done_at || '',
    technical_needs: r.technical_needs || '',
    own_equipment_detail: r.own_equipment_detail || '',
    presentation_format: r.presentation_format || '',
    presentation_format_texto: presentationFormatText(r.presentation_format, r.presentation_other),
    song_name: r.song_name || '',
    track_status: r.track_status || '',
    consent_image: esVerdadero(r.consent_image),
    change_status: r.change_status || ''
  };
}

/** The whole roster, trimmed to what the desk legitimately needs to see. */
function accionRosterCheckin() {
  var members = membersByGroup();
  var filas = leerHoja(HOJA.REGISTRO).filter(function (r) { return normalizarTexto(r.code); });
  return {
    generado_at: ahoraISO(),
    total: filas.length,
    roster: filas.map(function (r) { return deskView(r, members); })
  };
}

/** Finds a project by code, the leader's ID number or ANY member's ID number. */
function findForDesk(datos) {
  var rows = leerHoja(HOJA.REGISTRO);
  var code = normalizarComparable(datos.code);
  if (code) {
    var byCode = rows.filter(function (r) { return normalizarComparable(r.code) === code; })[0];
    if (byCode) return { row: byCode, via: 'CODIGO' };
  }
  var doc = normalizarCedula(datos.id_number || datos.code);
  if (!doc) return null;
  var byLeader = rows.filter(function (r) {
    return normalizarTexto(r.code) && normalizarCedula(r.normalized_id_number || r.id_number) === doc;
  })[0];
  if (byLeader) return { row: byLeader, via: 'DOCUMENTO' };
  var member = leerHoja(HOJA.INTEGRANTES).filter(function (m) { return normalizarCedula(m.normalized_id_number) === doc; })[0];
  if (member) {
    var project = rows.filter(function (r) {
      return normalizarComparable(r.group_code) === normalizarComparable(member.group_code);
    })[0];
    if (project) return { row: project, via: 'INTEGRANTE' };
  }
  return null;
}

function accionBuscarParticipante(datos) {
  var found = findForDesk(datos);
  if (!found || !normalizarTexto(found.row.code)) return { ok: false, error: 'No encontramos ese código ni ese documento entre quienes tienen cupo.' };
  var registro = found.row;

  var horaAudicion = registro.final_time || registro.original_time || '';
  var puntualidad = horaAudicion
    ? evaluarPuntualidad(horaAudicion, datos.hora_llegada || horaActual(), agendaConfigurada())
    : null;

  var view = deskView(registro, membersByGroup());
  var warnings = [];
  if (view.group_code && view.members_authorized < (Number(view.members_declared) || 0)) {
    warnings.push('Autorizaciones de integrantes: ' + view.members_authorized + ' de ' + view.members_declared +
                  '. Quien no haya autorizado debe firmar la constancia física antes de subir al escenario.');
  }
  if (!view.consent_image) warnings.push('NO autoriza uso de imagen/voz: no grabar ni publicar su presentación.');
  if (normalizarComparable(view.track_status) === 'PISTA PENDIENTE') warnings.push('La pista no ha llegado: pedir la USB de respaldo.');
  if (normalizarComparable(view.track_status) === 'PISTA CON PROBLEMA') warnings.push('La pista tiene un problema reportado: avisar al técnico de audio.');

  return {
    participante: view,
    encontrado_por: found.via,
    puntualidad: puntualidad,
    avisos: warnings,
    // The desk must always confirm against the physical document.
    recordatorio: 'Valida la identidad con el documento físico antes de confirmar' +
                  (view.group_code ? ' (de cada integrante).' : '.')
  };
}

function horaActual() {
  return Utilities.formatDate(new Date(), zonaHoraria(), 'HH:mm');
}

/**
 * Records one state change. The state machine decides whether it is legal;
 * an illegal one is refused unless a supervisor forces it, and a forced change
 * always lands in INCIDENTES.
 */
function accionRegistrarEstado(datos, sesion) {
  var clave = datos.client_op_id ? 'estado:' + datos.client_op_id : null;

  return conBloqueo(function () {
    return unaSolaVez(clave, function () {
      var registro = buscarPorCodigo(datos.code);
      if (!registro) return { ok: false, error: 'Codigo no encontrado: ' + datos.code };

      var transicion = aplicarTransicion(
        registro.attendance_status || ESTADO.CONFIRMADO,
        datos.estado,
        { forzar: esVerdadero(datos.forzar) }
      );
      if (!transicion.ok) return { ok: false, error: transicion.mensaje, transicion: transicion };

      var at = datos.at || ahoraISO();
      var cambios = {
        attendance_status: transicion.hacia,
        operador_check_in: sesion.alias || 'checkin'
      };
      if (transicion.hacia === ESTADO.CHECK_IN && !registro.check_in_time) cambios.check_in_time = datos.check_in_time || at;
      if (transicion.hacia === ESTADO.PRECOLA) cambios.precola_at = at;
      if (transicion.hacia === ESTADO.EN_AUDICION) cambios.stage_at = at;
      if (transicion.hacia === ESTADO.CONTINGENCIA && !registro.contingencia_desde) cambios.contingencia_desde = at;
      if (transicion.hacia === ESTADO.REALIZADA) {
        cambios.audition_status = ESTADO.REALIZADA;
        cambios.done_at = at;
      }
      if (transicion.hacia === ESTADO.NO_AUDICIONADO || transicion.hacia === ESTADO.NO_SHOW) {
        cambios.audition_status = transicion.hacia;
      }
      if (datos.notes) {
        cambios.notes = [registro.notes, '[' + at + '] ' + datos.notes].filter(Boolean).join(' || ');
      }

      actualizarFila(HOJA.REGISTRO, registro._fila, cambios);

      if (transicion.forzado) {
        registrarIncidente(datos.code, 'TRANSICION_FORZADA',
          'Cambio manual ' + transicion.desde + ' -> ' + transicion.hacia,
          datos.notes || '', sesion.alias || 'checkin');
      }
      registrar(sesion.alias, sesion.rol, 'ESTADO', datos.code, transicion.desde + '->' + transicion.hacia);

      return { code: registro.code, desde: transicion.desde, hacia: transicion.hacia,
               sin_cambio: !!transicion.sin_cambio, forzado: !!transicion.forzado };
    });
  });
}

/**
 * Drains the offline queue the check-in page accumulated while the connection
 * was down. Each operation carries its own id, so replaying the whole queue is
 * safe: already-applied operations are recognised and skipped.
 */
function accionSincronizarCola(datos, sesion) {
  var cola = [];
  try { cola = typeof datos.cola === 'string' ? JSON.parse(datos.cola) : (datos.cola || []); }
  catch (e) { return { ok: false, error: 'Cola ilegible.' }; }

  var resultados = [];
  for (var i = 0; i < cola.length; i++) {
    var op = cola[i];
    try {
      resultados.push(Object.assign({ client_op_id: op.client_op_id },
        accionRegistrarEstado(op, sesion)));
    } catch (err) {
      resultados.push({ client_op_id: op.client_op_id, ok: false, error: err.message });
    }
  }
  registrar(sesion.alias, sesion.rol, 'SINCRONIZAR_COLA', '', cola.length + ' operaciones');
  return { procesadas: resultados.length, resultados: resultados };
}

/** Ranks the contingency queue against the time actually left before the close. */
function accionPlanContingencia(datos) {
  var filas = leerHoja(HOJA.REGISTRO);
  var cola = filas.filter(function (r) {
    return normalizarEstado(r.attendance_status) === ESTADO.CONTINGENCIA ||
           normalizarEstado(r.attendance_status) === ESTADO.NO_SHOW;
  });

  var cfgAgenda = agendaConfigurada();
  var ahoraMin = datos.ahora ? horaAMinutos(datos.ahora) : horaAMinutos(horaActual());
  var inicio = Math.max(ahoraMin === null ? cfgAgenda.contingencia_inicio : ahoraMin, cfgAgenda.contingencia_inicio);

  var plan = planificarContingencia(cola, {
    agenda: cfgAgenda,
    ahora_minutos: inicio,
    cierre_minutos: cfgAgenda.contingencia_fin,
    minutos_por_audicion: cfgNumero('duracion_audicion_min', 3)
  });

  var nombres = {};
  filas.forEach(function (r) { nombres[r.code] = r.artistic_name || r.full_name; });
  plan.entran.forEach(function (x) { x.nombre = nombres[x.code] || ''; });
  plan.fuera.forEach(function (x) { x.nombre = nombres[x.code] || ''; });

  return plan;
}

/** Hard close (21:00 by default): everybody pending becomes NO AUDICIONADO. */
function accionCerrarJornada(datos, sesion) {
  return conBloqueo(function () {
    var filas = leerHoja(HOJA.REGISTRO);
    var cierre = cerrarJornada(filas, { ahora: ahoraISO(), responsable: sesion.alias });

    var porCodigo = {};
    filas.forEach(function (r) { porCodigo[r.code] = r; });

    actualizarFilasEnLote(HOJA.REGISTRO, cierre.cambios.map(function (c) {
      return {
        fila: porCodigo[c.code]._fila,
        cambios: { attendance_status: c.hacia, audition_status: c.hacia }
      };
    }));

    refrescarVistas();
    registrar(sesion.alias, sesion.rol, 'CERRAR_JORNADA', '', cierre.total + ' participantes');
    return { cerrados: cierre.total, detalle: cierre.cambios };
  });
}

/** Tracks for the stage and the audio technician, in agenda order (read-only). */
function accionPistasEvento(datos) {
  return accionListarPistas(datos);
}
