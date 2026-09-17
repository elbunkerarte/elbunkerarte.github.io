/**
 * EL BUNKER - Public actions: registration, schedule-change request, status.
 */

/**
 * Form 1. Validates server-side, stores ALWAYS (never silently rejects), and
 * returns a verdict the participant can understand.
 *
 * The code is NOT issued here: the spec assigns codes after validation, in a
 * deliberate operator-run batch, so a wave of submissions cannot burn the 100
 * seats on rows that later turn out to be duplicates.
 */
function accionInscribir(datos) {
  if (!cfgBool('inscripciones_abiertas', true)) {
    return { ok: false, error: 'Las inscripciones estan cerradas.', cerrado: true };
  }

  // The client sends a UUID it keeps across retries; a double tap is one row.
  var claveIdem = 'inscripcion:' + (datos.client_submission_id || Utilities.getUuid());

  return unaSolaVez(claveIdem, function () {
    return conBloqueo(function () {
      var opciones = opcionesValidacion();
      var veredicto = validarInscripcion(datos, opciones);

      var candidato = {
        submission_id: nuevoId('S'),
        normalized_id_number: normalizarCedula(datos.id_number),
        normalized_email: normalizarEmail(datos.email),
        normalized_phone: normalizarTelefono(datos.whatsapp)
      };

      var existentes = leerHoja(HOJA.REGISTRO);
      var dup = detectarDuplicado(candidato, existentes);

      var estado = veredicto.eligibility_status;
      if (dup.duplicate_flag) estado = ESTADO_ELEGIBILIDAD.DUPLICADO;
      else if (dup.alerta && estado === ESTADO_ELEGIBILIDAD.APTO) estado = ESTADO_ELEGIBILIDAD.REVISION;

      var notas = []
        .concat(veredicto.errores.map(function (x) { return x.campo + ':' + x.codigo; }))
        .concat(veredicto.avisos.map(function (x) { return x.campo + ':' + x.codigo; }));
      if (dup.duplicate_reason) notas.push(dup.duplicate_reason);

      agregarFila(HOJA.REGISTRO, {
        submission_id: candidato.submission_id,
        code: '',
        created_at: ahoraISO(),
        source: datos.source || 'web',
        full_name: normalizarTexto(datos.full_name),
        id_number: normalizarTexto(datos.id_number),
        birth_date: normalizarTexto(datos.birth_date),
        age: veredicto.edad === null ? '' : veredicto.edad,
        neighborhood_sector: normalizarTexto(datos.neighborhood_sector),
        residence: esVerdadero(datos.resides_in_sabaneta) ? cfg('municipio', 'Sabaneta') : 'FUERA',
        email: normalizarTexto(datos.email),
        whatsapp: normalizarTexto(datos.whatsapp),
        artistic_name: normalizarTexto(datos.artistic_name),
        discipline: normalizarTexto(datos.discipline),
        genre_or_proposal: normalizarTexto(datos.genre_or_proposal),
        artist_description: normalizarTexto(datos.artist_description),
        audition_description: normalizarTexto(datos.audition_description),
        video_url: normalizarTexto(datos.video_url),
        technical_needs: normalizarTexto(datos.technical_needs),
        normalized_id_number: candidato.normalized_id_number,
        normalized_email: candidato.normalized_email,
        normalized_phone: candidato.normalized_phone,
        eligibility_status: estado,
        duplicate_flag: dup.duplicate_flag,
        duplicate_reason: dup.duplicate_reason,
        registro_principal: dup.registro_principal,
        validation_notes: notas.join(' | '),
        consent_terms: esVerdadero(datos.accept_terms),
        consent_data: esVerdadero(datos.accept_data_processing),
        consent_whatsapp: esVerdadero(datos.accept_whatsapp_operational),
        consent_image: esVerdadero(datos.accept_image_voice),
        consent_version: cfg('consent_version', 'v1-PENDIENTE'),
        availability_statement: esVerdadero(datos.availability_statement),
        attendance_status: '',
        audition_status: '',
        change_status: ESTADO_CAMBIO.SIN_SOLICITUD,
        notes: ''
      });

      registrar('participante', '', 'INSCRIPCION', candidato.submission_id, 'estado=' + estado);

      return {
        submission_id: candidato.submission_id,
        eligibility_status: estado,
        edad: veredicto.edad,
        errores: veredicto.errores,
        avisos: veredicto.avisos,
        duplicado: dup.duplicate_flag,
        mensaje: mensajeVeredicto(estado, veredicto, dup)
      };
    });
  });
}

function mensajeVeredicto(estado, veredicto, dup) {
  if (estado === ESTADO_ELEGIBILIDAD.APTO) {
    return 'Recibimos tu inscripcion. Si quedas dentro de los 100 cupos te enviaremos tu codigo y tu horario.';
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
  return 'Recibimos tu inscripcion y quedo en revision. Te contactaremos si necesitamos verificar algo.';
}

/**
 * Form 2. Records the request only; the new slot is decided by production,
 * never chosen by the participant.
 */
function accionSolicitarCambio(datos) {
  if (!cfgBool('cambios_abiertos', true)) {
    return { ok: false, error: 'El plazo para solicitar cambios de horario ya cerro.', cerrado: true };
  }

  var claveIdem = 'cambio:' + normalizarComparable(datos.participant_code) + ':' + (datos.client_submission_id || '');

  return unaSolaVez(claveIdem, function () {
    return conBloqueo(function () {
      var registro = buscarPorCodigo(datos.participant_code);
      var permiso = puedeSolicitarCambio(registro, datos, {
        ahora: ahoraISO(),
        cierre_cambios: cfg('cierre_cambios', '')
      });

      if (!permiso.permitido) {
        return { ok: false, error: permiso.mensaje, motivo: permiso.motivo };
      }

      // Guard against someone else guessing a code: the name must match.
      if (normalizarComparable(datos.full_name) !== normalizarComparable(registro.full_name)) {
        registrar('participante', '', 'CAMBIO_NOMBRE_NO_COINCIDE', datos.participant_code, '');
        return { ok: false, error: 'El nombre no coincide con el registrado para ese codigo.', motivo: 'NOMBRE_NO_COINCIDE' };
      }

      var solicitudId = nuevoId('CB');
      var horario = horarioDeCodigo(registro.code, agendaConfigurada());

      agregarFila(HOJA.CAMBIOS, {
        solicitud_id: solicitudId,
        at: ahoraISO(),
        code: registro.code,
        full_name: registro.full_name,
        original_block: registro.original_block || (horario ? horario.block_id : ''),
        original_time: registro.original_time || (horario ? horario.audition_time : ''),
        can_attend_original: 'FALSE',
        reason_short: String(datos.reason_short || '').slice(0, 400),
        contact: normalizarTexto(datos.contact),
        acceptance: esVerdadero(datos.acceptance) ? 'TRUE' : 'FALSE',
        estado: ESTADO_CAMBIO.PENDIENTE,
        nuevo_bloque: '', nueva_hora: '', resuelto_at: '', resuelto_by: '', observacion: ''
      });

      actualizarFila(HOJA.REGISTRO, registro._fila, {
        change_requested: 'TRUE',
        change_status: ESTADO_CAMBIO.PENDIENTE
      });

      registrar('participante', '', 'SOLICITUD_CAMBIO', registro.code, solicitudId);

      return {
        solicitud_id: solicitudId,
        estado: ESTADO_CAMBIO.PENDIENTE,
        mensaje: 'Registramos tu solicitud. Produccion te confirmara por WhatsApp o correo si es APROBADA o NO APROBADA. ' +
                 'Mientras tanto tu horario original sigue vigente.'
      };
    });
  });
}

/** Lets a participant check their own code/slot without exposing anybody else. */
function accionConsultarEstado(datos) {
  var registro = null;
  if (datos.code) registro = buscarPorCodigo(datos.code);
  else if (datos.id_number) registro = buscarPorCedula(datos.id_number);

  if (!registro) return { ok: false, error: 'No encontramos un registro con esos datos.' };

  // Identity check: knowing a code is not enough to read someone's data.
  if (normalizarCedula(datos.id_number) !== normalizarCedula(registro.id_number)) {
    return { ok: false, error: 'Los datos no coinciden. Verifica tu documento y tu codigo.' };
  }

  return {
    code: registro.code || '',
    eligibility_status: registro.eligibility_status,
    bloque: registro.final_block || registro.original_block || '',
    hora_llegada: registro.arrival_time || '',
    hora_audicion: registro.final_time || registro.original_time || '',
    change_status: registro.change_status || ESTADO_CAMBIO.SIN_SOLICITUD,
    attendance_status: registro.attendance_status || ''
  };
}

function accionAgendaPublica() {
  return { agenda: construirAgenda(agendaConfigurada()) };
}

/** Only the values meant to be public; the CONFIG sheet also holds internals. */
function accionConfigPublica() {
  return {
    evento: {
      nombre: cfg('evento_nombre', 'EL BUNKER'),
      fecha: cfg('evento_fecha', ''),
      hora_inicio: cfg('evento_hora_inicio', ''),
      hora_fin: cfg('evento_hora_fin', ''),
      sede: cfg('evento_sede', 'PENDIENTE DE COMPLETAR'),
      municipio: cfg('municipio', 'Sabaneta'),
      edad_minima: cfgNumero('edad_minima', 18),
      edad_maxima: cfgNumero('edad_maxima', 28),
      duracion_audicion: cfgNumero('duracion_audicion_min', 3),
      cupo: cfgNumero('cupo_total', 100),
      top: cfgNumero('top_seleccionados', 7)
    },
    legal: {
      legal_name: cfg('legal_name', 'PENDIENTE DE COMPLETAR'),
      data_protection_email: cfg('data_protection_email', 'PENDIENTE DE COMPLETAR'),
      institutional_phone: cfg('institutional_phone', 'PENDIENTE DE COMPLETAR'),
      terms_url: cfg('terms_url', ''),
      privacy_policy_url: cfg('privacy_policy_url', ''),
      consent_version: cfg('consent_version', 'v1-PENDIENTE')
    },
    abierto: cfgBool('inscripciones_abiertas', true),
    cambios_abiertos: cfgBool('cambios_abiertos', true)
  };
}
