/**
 * EL BUNKER - Logistics and admin actions.
 * Everything a non-technical coordinator needs, with no SQL and no code edits.
 */

function accionListarRegistro(datos, sesion) {
  var filas = leerHoja(HOJA.REGISTRO);
  var filtro = normalizarComparable(datos.filtro || '');
  var busqueda = normalizarComparable(datos.q || '');

  var vista = filas.filter(function (r) {
    if (filtro && filtro !== 'TODOS' && normalizarComparable(r.eligibility_status) !== filtro) return false;
    if (!busqueda) return true;
    return normalizarComparable(r.full_name).indexOf(busqueda) !== -1 ||
           normalizarComparable(r.code).indexOf(busqueda) !== -1 ||
           normalizarCedula(r.id_number).indexOf(normalizarCedula(datos.q)) !== -1 ||
           normalizarComparable(r.artistic_name).indexOf(busqueda) !== -1;
  });

  return {
    total: filas.length,
    mostrados: vista.length,
    resumen: resumenElegibilidad(filas),
    filas: vista.map(function (r) {
      return {
        fila: r._fila, submission_id: r.submission_id, code: r.code,
        created_at: r.created_at, full_name: r.full_name, id_number: r.id_number,
        age: r.age, neighborhood_sector: r.neighborhood_sector, email: r.email,
        whatsapp: r.whatsapp, artistic_name: r.artistic_name, discipline: r.discipline,
        video_url: r.video_url, eligibility_status: r.eligibility_status,
        duplicate_flag: r.duplicate_flag, duplicate_reason: r.duplicate_reason,
        validation_notes: r.validation_notes,
        original_block: r.original_block, original_time: r.original_time,
        final_block: r.final_block, final_time: r.final_time,
        change_status: r.change_status, attendance_status: r.attendance_status
      };
    })
  };
}

function resumenElegibilidad(filas) {
  var r = { total: filas.length, apto: 0, incompleto: 0, no_cumple: 0, revision: 0,
            duplicado: 0, con_codigo: 0, unicos: 0 };
  var cedulas = {};
  filas.forEach(function (f) {
    var e = normalizarComparable(f.eligibility_status);
    if (e === 'APTO') r.apto++;
    else if (e === 'INCOMPLETO') r.incompleto++;
    else if (e === 'NO_CUMPLE') r.no_cumple++;
    else if (e === 'REVISION') r.revision++;
    else if (e === 'DUPLICADO') r.duplicado++;
    if (normalizarTexto(f.code)) r.con_codigo++;
    var c = normalizarCedula(f.id_number);
    if (c) cedulas[c] = true;
  });
  r.unicos = Object.keys(cedulas).length;
  return r;
}

/** Re-runs validation over every row, e.g. after changing the age range in CONFIG. */
function accionRevalidarTodo(datos, sesion) {
  return conBloqueo(function () {
    invalidarCacheConfig();
    var opciones = opcionesValidacion();
    var filas = leerHoja(HOJA.REGISTRO);
    var vistos = [];
    var actualizaciones = [];

    filas.forEach(function (r) {
      var veredicto = validarInscripcion({
        full_name: r.full_name, id_number: r.id_number, birth_date: r.birth_date,
        neighborhood_sector: r.neighborhood_sector,
        resides_in_sabaneta: normalizarComparable(r.residence) !== 'FUERA' && normalizarTexto(r.residence) !== '',
        email: r.email, whatsapp: r.whatsapp, discipline: r.discipline,
        audition_description: r.audition_description, video_url: r.video_url,
        availability_statement: r.availability_statement,
        accept_terms: r.consent_terms, accept_data_processing: r.consent_data
      }, opciones);

      var candidato = {
        submission_id: r.submission_id,
        normalized_id_number: normalizarCedula(r.id_number),
        normalized_email: normalizarEmail(r.email),
        normalized_phone: normalizarTelefono(r.whatsapp)
      };
      var dup = detectarDuplicado(candidato, vistos);
      vistos.push(candidato);

      var estado = veredicto.eligibility_status;
      if (dup.duplicate_flag) estado = ESTADO_ELEGIBILIDAD.DUPLICADO;
      else if (dup.alerta && estado === ESTADO_ELEGIBILIDAD.APTO) estado = ESTADO_ELEGIBILIDAD.REVISION;

      // A row that already holds a code keeps its seat: re-validation informs,
      // it does not retroactively strip an issued code.
      if (normalizarTexto(r.code) && estado === ESTADO_ELEGIBILIDAD.DUPLICADO) {
        estado = ESTADO_ELEGIBILIDAD.REVISION;
      }

      actualizaciones.push({
        fila: r._fila,
        cambios: {
          age: veredicto.edad === null ? '' : veredicto.edad,
          eligibility_status: estado,
          duplicate_flag: dup.duplicate_flag,
          duplicate_reason: dup.duplicate_reason,
          registro_principal: dup.registro_principal,
          normalized_id_number: candidato.normalized_id_number,
          normalized_email: candidato.normalized_email,
          normalized_phone: candidato.normalized_phone,
          validation_notes: veredicto.errores.map(function (x) { return x.campo + ':' + x.codigo; }).join(' | ')
        }
      });
    });

    actualizarFilasEnLote(HOJA.REGISTRO, actualizaciones);
    registrar(sesion.alias, sesion.rol, 'REVALIDAR_TODO', '', filas.length + ' filas');
    return { revalidados: filas.length, resumen: resumenElegibilidad(leerHoja(HOJA.REGISTRO)) };
  });
}

/** Manual override by logistics, always logged with who and why. */
function accionMarcarElegibilidad(datos, sesion) {
  return conBloqueo(function () {
    var registro = datos.submission_id
      ? leerHoja(HOJA.REGISTRO).filter(function (r) { return r.submission_id === datos.submission_id; })[0]
      : buscarPorCodigo(datos.code);
    if (!registro) return { ok: false, error: 'Registro no encontrado.' };

    var nuevo = normalizarComparable(datos.eligibility_status);
    if (!ESTADO_ELEGIBILIDAD[nuevo]) return { ok: false, error: 'Estado de elegibilidad invalido: ' + datos.eligibility_status };

    actualizarFila(HOJA.REGISTRO, registro._fila, {
      eligibility_status: nuevo,
      notes: [registro.notes, datos.motivo ? '[' + ahoraISO() + ' ' + sesion.alias + '] ' + datos.motivo : '']
        .filter(Boolean).join(' || ')
    });
    registrar(sesion.alias, sesion.rol, 'MARCAR_ELEGIBILIDAD', registro.submission_id,
              registro.eligibility_status + '->' + nuevo + ' motivo=' + (datos.motivo || ''));
    return { submission_id: registro.submission_id, eligibility_status: nuevo };
  });
}

/**
 * "Cerrar los 100": issues B-001..B-100 and writes each participant's block,
 * arrival time and audition time in one pass.
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
      return { ok: false, error: 'El bloque ' + destino.block_id + ' ya esta lleno (' + destino.ocupados + '/' + destino.cupo + ').' };
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
      mensaje: 'Cambio aprobado. El codigo ' + solicitud.code + ' NO cambia; solo su horario.'
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
