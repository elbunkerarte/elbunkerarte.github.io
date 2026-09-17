/**
 * EL BUNKER - Check-in desk actions (event day).
 *
 * This is the only module that has to keep working on a bad connection, so it
 * exposes a full roster download and a batch sync of queued operations.
 */

/** The whole roster, trimmed to what the desk legitimately needs to see. */
function accionRosterCheckin() {
  var filas = leerHoja(HOJA.REGISTRO).filter(function (r) { return normalizarTexto(r.code); });
  return {
    generado_at: ahoraISO(),
    total: filas.length,
    roster: filas.map(function (r) {
      return {
        code: r.code,
        full_name: r.full_name,
        id_number: String(r.id_number || ''),
        artistic_name: r.artistic_name,
        discipline: r.discipline,
        final_block: r.final_block || r.original_block,
        arrival_time: r.arrival_time,
        final_time: r.final_time || r.original_time,
        attendance_status: r.attendance_status || ESTADO.CONFIRMADO,
        audition_status: r.audition_status || '',
        check_in_time: r.check_in_time || '',
        technical_needs: r.technical_needs || ''
      };
    })
  };
}

function accionBuscarParticipante(datos) {
  var registro = null;
  if (datos.code) registro = buscarPorCodigo(datos.code);
  if (!registro && datos.id_number) registro = buscarPorCedula(datos.id_number);
  if (!registro) return { ok: false, error: 'No encontramos ese codigo ni ese documento.' };

  var horaAudicion = registro.final_time || registro.original_time || '';
  var puntualidad = horaAudicion
    ? evaluarPuntualidad(horaAudicion, datos.hora_llegada || horaActual(), agendaConfigurada())
    : null;

  return {
    participante: {
      code: registro.code, full_name: registro.full_name,
      id_number: String(registro.id_number || ''),
      artistic_name: registro.artistic_name, discipline: registro.discipline,
      final_block: registro.final_block || registro.original_block,
      arrival_time: registro.arrival_time, final_time: horaAudicion,
      attendance_status: registro.attendance_status || ESTADO.CONFIRMADO,
      audition_status: registro.audition_status || '',
      check_in_time: registro.check_in_time || '',
      technical_needs: registro.technical_needs || '',
      change_status: registro.change_status || ''
    },
    puntualidad: puntualidad,
    // The desk must always confirm against the physical document.
    recordatorio: 'Valida la identidad con el documento fisico antes de confirmar.'
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

  return unaSolaVez(clave, function () {
    return conBloqueo(function () {
      var registro = buscarPorCodigo(datos.code);
      if (!registro) return { ok: false, error: 'Codigo no encontrado: ' + datos.code };

      var transicion = aplicarTransicion(
        registro.attendance_status || ESTADO.CONFIRMADO,
        datos.estado,
        { forzar: esVerdadero(datos.forzar) }
      );
      if (!transicion.ok) return { ok: false, error: transicion.mensaje, transicion: transicion };

      var cambios = {
        attendance_status: transicion.hacia,
        operador_check_in: sesion.alias || 'checkin'
      };
      if (transicion.hacia === ESTADO.CHECK_IN && !registro.check_in_time) {
        cambios.check_in_time = datos.check_in_time || ahoraISO();
      }
      if (transicion.hacia === ESTADO.CONTINGENCIA && !registro.contingencia_desde) {
        cambios.contingencia_desde = ahoraISO();
      }
      if (transicion.hacia === ESTADO.REALIZADA) {
        cambios.audition_status = ESTADO.REALIZADA;
      }
      if (transicion.hacia === ESTADO.NO_AUDICIONADO || transicion.hacia === ESTADO.NO_SHOW) {
        cambios.audition_status = transicion.hacia;
      }
      if (datos.notes) {
        cambios.notes = [registro.notes, '[' + ahoraISO() + '] ' + datos.notes].filter(Boolean).join(' || ');
      }

      actualizarFila(HOJA.REGISTRO, registro._fila, cambios);

      if (transicion.forzado) {
        registrarIncidente(datos.code, 'TRANSICION_FORZADA',
          'Cambio manual ' + transicion.desde + ' -> ' + transicion.hacia,
          datos.notes || '', sesion.alias || 'checkin');
      }
      registrar(sesion.alias, sesion.rol, 'ESTADO', datos.code,
                transicion.desde + '->' + transicion.hacia);

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

/** Ranks the contingency queue against the time actually left before 21:30. */
function accionPlanContingencia(datos) {
  var filas = leerHoja(HOJA.REGISTRO);
  var cola = filas.filter(function (r) {
    return normalizarEstado(r.attendance_status) === ESTADO.CONTINGENCIA ||
           normalizarEstado(r.attendance_status) === ESTADO.NO_SHOW;
  });

  var cfgAgenda = agendaConfigurada();
  var ahoraMin = datos.ahora ? horaAMinutos(datos.ahora) : horaAMinutos(horaActual());

  var plan = planificarContingencia(cola, {
    agenda: cfgAgenda,
    ahora_minutos: ahoraMin === null ? cfgAgenda.contingencia_inicio : ahoraMin,
    cierre_minutos: cfgAgenda.contingencia_fin,
    minutos_por_audicion: cfgNumero('duracion_audicion_min', 3)
  });

  var nombres = {};
  filas.forEach(function (r) { nombres[r.code] = r.artistic_name || r.full_name; });
  plan.entran.forEach(function (x) { x.nombre = nombres[x.code] || ''; });
  plan.fuera.forEach(function (x) { x.nombre = nombres[x.code] || ''; });

  return plan;
}

/** 21:30 hard close: everybody pending becomes NO AUDICIONADO. */
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
