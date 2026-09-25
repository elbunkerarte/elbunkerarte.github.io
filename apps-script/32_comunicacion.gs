/**
 * EL BUNKER - Message templates for e-mail and WhatsApp.
 *
 * WhatsApp is never automated from here: sending through WhatsApp needs the
 * paid Business API (or a provider such as Twilio), so the system produces the
 * exact text plus a click-to-chat link and a human presses send from the
 * official number. Only the reception e-mail is automatic (Gmail quota).
 */

function commsContext() {
  var fecha = cfgFecha('evento_fecha', '2026-10-23');
  return {
    evento: cfg('evento_nombre', 'EL BÚNKER by Arte es la Solución'),
    fecha_texto: humanDate(fecha),
    sede: cfg('evento_sede', ''),
    municipio_sede: cfg('evento_municipio_sede', 'Sabaneta, Antioquia'),
    punto: cfg('evento_direccion', ''),
    duracion: cfgNumero('duracion_audicion_min', 3),
    tolerancia: cfgNumero('tolerancia_min', 5),
    antelacion: cfgNumero('antelacion_llegada_min', 15),
    contingencia: humanTime(cfgHora('contingencia_inicio', '20:30')) + ' a ' + humanTime(cfgHora('cierre_audiciones', '21:00')),
    cierre: humanTime(cfgHora('cierre_audiciones', '21:00')),
    cupo: cfgNumero('cupo_total', 100),
    numero: cfg('whatsapp_oficial', ''),
    nombre_contacto: cfg('whatsapp_oficial_nombre', 'EL BÚNKER — Arte es la Solución'),
    correo_datos: cfg('data_protection_email', '')
  };
}

function lugarTexto(c) {
  var p = normalizarTexto(c.punto);
  var place = [normalizarTexto(c.sede), normalizarTexto(c.municipio_sede)].filter(Boolean).join(', ');
  return place + (p && p.indexOf('PENDIENTE') !== 0 ? ' (' + p + ')' : '');
}

/** The WhatsApp group invite, or '' while the organization has not created it. */
function groupInviteLink() {
  var link = normalizarTexto(cfg('whatsapp_grupo_enlace', ''));
  return /^https:\/\//i.test(link) ? link : '';
}

/** The line every message repeats: WhatsApp broadcast lists only reach people who saved the number. */
function saveNumberLine(c) {
  return c.numero
    ? 'Importante: guarda el número ' + c.numero + ' en tus contactos como "' + c.nombre_contacto +
      '". Desde ese número recibirás tu código, horario, recordatorios y novedades de la convocatoria.'
    : '';
}

function plantillas() {
  var c = commsContext();
  var firma = '\n\n— Equipo ' + c.evento;
  var lugar = lugarTexto(c);

  return {
    RECEPCION: {
      id: 'RECEPCION', nombre: '1. Recepción de inscripción',
      audiencia: function (r) { var e = normalizarComparable(r.eligibility_status); return e === 'APTO' || e === 'REVISION'; },
      asunto: c.evento + ' — recibimos tu inscripción',
      cuerpo:
        'Hola {{full_name}},\n\n' +
        'Recibimos tu inscripción a ' + c.evento + ' (comprobante {{submission_id}}).\n\n' +
        'La organización revisa cada inscripción —datos, requisitos y muestra artística— y asigna los ' + c.cupo +
        ' cupos en orden de inscripción entre quienes cumplen. Si quedas dentro, te enviaremos tu CÓDIGO y tu HORARIO.\n' +
        '{{bloque_grupo}}\n' +
        saveNumberLine(c) + '\n\n' +
        'Puedes consultar tu inscripción en: {{url_mi_inscripcion}}\n\n' +
        'Inscribirte no garantiza selección, contratación ni presentación.\n' +
        'Dudas sobre tus datos personales: ' + c.correo_datos + '.' + firma
    },

    ASIGNACION: {
      id: 'ASIGNACION', nombre: '2. Asignación de código y horario',
      audiencia: function (r) { return !!normalizarTexto(r.code); },
      asunto: c.evento + ' — tu código {{code}} y tu horario',
      cuerpo:
        'Hola {{full_name}},\n\n' +
        '¡Quedaste dentro de los ' + c.cupo + ' cupos de ' + c.evento + '!\n\n' +
        'CÓDIGO: {{code}}\n' +
        'FECHA: ' + c.fecha_texto + '\n' +
        'LLEGADA (check-in): {{hora_llegada_texto}}\n' +
        'AUDICIÓN: {{hora_audicion_texto}} (bloque {{final_block}})\n' +
        'LUGAR: ' + lugar + '\n\n' +
        'IMPORTANTE:\n' +
        '- Llega a la hora de llegada, no a la de audición.\n' +
        '- Trae tu documento de identidad original: sin él no hay check-in.\n' +
        '- Tu audición dura máximo ' + c.duracion + ' minutos.\n' +
        '- Tolerancia de ' + c.tolerancia + ' minutos. Si llegas más tarde pierdes tu turno y pasas a contingencia (' +
        c.contingencia + '), solo si queda tiempo.\n' +
        '{{bloque_pista}}{{bloque_grupo}}\n' +
        'Tu código NO cambia nunca. Si tienes un impedimento real para asistir en tu horario, tienes UNA sola ' +
        'solicitud de cambio aquí: {{url_cambio}}\n\n' +
        saveNumberLine(c) + firma
    },

    CAMBIO_APROBADO: {
      id: 'CAMBIO_APROBADO', nombre: '3. Cambio aprobado',
      audiencia: function (r) { return normalizarComparable(r.change_status) === 'APROBADO'; },
      asunto: c.evento + ' — cambio APROBADO, tu nuevo horario',
      cuerpo:
        'Hola {{full_name}},\n\n' +
        'Tu solicitud de cambio fue APROBADA.\n\n' +
        'CÓDIGO: {{code}} (no cambia)\n' +
        'NUEVA LLEGADA: {{hora_llegada_texto}}\n' +
        'NUEVA AUDICIÓN: {{hora_audicion_texto}} (bloque {{final_block}})\n\n' +
        'Este es tu horario definitivo. El día del evento no hay más cambios.' + firma
    },

    CAMBIO_RECHAZADO: {
      id: 'CAMBIO_RECHAZADO', nombre: '4. Cambio no aprobado',
      audiencia: function (r) { return normalizarComparable(r.change_status) === 'RECHAZADO'; },
      asunto: c.evento + ' — tu solicitud de cambio no fue aprobada',
      cuerpo:
        'Hola {{full_name}},\n\n' +
        'Revisamos tu solicitud de cambio y NO fue aprobada por disponibilidad de la agenda.\n\n' +
        'Tu horario sigue siendo:\n' +
        'CÓDIGO: {{code}}\nLLEGADA: {{hora_llegada_texto}}\nAUDICIÓN: {{hora_audicion_texto}}\n\n' +
        'Si no puedes asistir, tu cupo quedará como no audicionado. Gracias por avisarnos.' + firma
    },

    RECORDATORIO_24H: {
      id: 'RECORDATORIO_24H', nombre: '5. Recordatorio 24 h antes',
      audiencia: function (r) { return !!normalizarTexto(r.code); },
      asunto: c.evento + ' — mañana es tu audición ({{code}})',
      cuerpo:
        'Hola {{full_name}},\n\n' +
        'Mañana, ' + c.fecha_texto + ', es tu audición en ' + c.evento + '.\n\n' +
        'CÓDIGO: {{code}}\nLLEGADA: {{hora_llegada_texto}} · AUDICIÓN: {{hora_audicion_texto}}\nLUGAR: ' + lugar + '\n\n' +
        'Lleva tu documento original. Prepara máximo ' + c.duracion + ' minutos.\n' +
        '{{bloque_pista}}Recuerda la tolerancia de ' + c.tolerancia + ' minutos.' + firma
    },

    RECORDATORIO_DIA: {
      id: 'RECORDATORIO_DIA', nombre: '6. Recordatorio del día',
      audiencia: function (r) { return !!normalizarTexto(r.code); },
      asunto: c.evento + ' — hoy es tu audición ({{code}})',
      cuerpo:
        '{{full_name}}, hoy es tu audición.\n\n' +
        'CÓDIGO {{code}} · LLEGADA {{hora_llegada_texto}} · AUDICIÓN {{hora_audicion_texto}}\n' +
        'LUGAR: ' + lugar + '\n\n' +
        'Documento original obligatorio. Tolerancia de ' + c.tolerancia + ' minutos.' + firma
    },

    CONTINGENCIA: {
      id: 'CONTINGENCIA', nombre: '7. Contingencia / no show',
      audiencia: function (r) {
        var e = normalizarEstado(r.attendance_status);
        return e === 'CONTINGENCIA' || e === 'NO SHOW';
      },
      asunto: c.evento + ' — tu turno pasó a contingencia',
      cuerpo:
        'Hola {{full_name}},\n\n' +
        'Tu turno ({{code}}, {{hora_audicion_texto}}) pasó a CONTINGENCIA.\n\n' +
        'La contingencia funciona de ' + c.contingencia + ' y solo alcanza para quienes quepan en el tiempo ' +
        'disponible, en orden de llegada a la lista.\n\n' +
        'Acércate al punto de check-in y espera el llamado. A las ' + c.cierre +
        ' se cierran definitivamente las audiciones.' + firma
    },

    INTEGRANTES_PENDIENTES: {
      id: 'INTEGRANTES_PENDIENTES', nombre: '8. Agrupación: faltan autorizaciones',
      audiencia: function (r, extra) { return !!r.group_code && extra.integrantes_autorizados < extra.integrantes_declarados; },
      asunto: c.evento + ' — faltan autorizaciones de tu agrupación',
      cuerpo:
        'Hola {{full_name}},\n\n' +
        'En {{artistic_name}} ({{group_code}}) llevan {{integrantes_autorizados}} de {{integrantes_declarados}} ' +
        'integrantes con su autorización individual.\n\n' +
        'Cada integrante debe completar la suya en este enlace (tú no puedes autorizar por otra persona):\n' +
        '{{members_link}}\n\n' +
        'Sin la autorización de todos, quien falte deberá firmar la constancia física el día del evento.' + firma
    },

    PISTA_PENDIENTE: {
      id: 'PISTA_PENDIENTE', nombre: '9. Pista pendiente',
      audiencia: function (r) {
        return !!normalizarTexto(r.code) && esVerdadero(r.track_uses) &&
               normalizarComparable(r.track_status) === normalizarComparable(TRACK_STATUS.PENDIENTE);
      },
      asunto: c.evento + ' — envíanos tu pista ({{code}})',
      cuerpo:
        'Hola {{full_name}},\n\n' +
        'Aún no hemos recibido la pista de {{code}}.\n\n' +
        'Envía el archivo indicando tu código {{code}}:\n' +
        '- Por la web (recomendado): {{url_mi_inscripcion}}\n' +
        (c.numero ? '- O por WhatsApp al ' + c.numero + ', escribiendo tu código {{code}} en el mensaje.\n' : '') +
        '\nEl día del evento lleva también una copia en USB. Bluetooth no es el método principal.' + firma
    },

    GRUPO_WHATSAPP: {
      id: 'GRUPO_WHATSAPP', nombre: '10. Invitación al grupo de WhatsApp',
      disponible: function () { return !!groupInviteLink(); },
      audiencia: function (r) {
        return esVerdadero(r.consent_whatsapp) &&
               (normalizarComparable(r.eligibility_status) === 'APTO' || !!normalizarTexto(r.code));
      },
      asunto: c.evento + ' — grupo de WhatsApp de la convocatoria',
      cuerpo:
        'Hola {{full_name}},\n\n' +
        'Tu inscripción cumple los requisitos. Por aquí compartiremos las indicaciones operativas finales:\n' +
        '{{enlace_grupo_whatsapp}}\n\n' +
        saveNumberLine(c) + firma
    }
  };
}

/** Templates that can be used right now: one that needs missing data is not offered at all. */
function plantillasDisponibles() {
  var all = plantillas();
  return Object.keys(all).filter(function (k) { return !all[k].disponible || all[k].disponible(); })
    .map(function (k) { return { id: k, nombre: all[k].nombre }; });
}

/**
 * Fills {{placeholders}} from a participant row plus explicit extras.
 * A placeholder whose value is missing from the row stays visible on purpose,
 * so a half-filled message is never sent unnoticed; extras (optional blocks)
 * may legitimately be empty.
 */
function renderizarPlantilla(plantilla, registro, extras) {
  extras = extras || {};
  function sustituir(texto) {
    return String(texto).replace(/\{\{(\w+)\}\}/g, function (_, clave) {
      if (extras.hasOwnProperty(clave)) return String(extras[clave] === null || extras[clave] === undefined ? '' : extras[clave]);
      var v = registro[clave];
      return (v === undefined || v === null || v === '') ? '{{' + clave + '}}' : String(v);
    });
  }
  return { asunto: sustituir(plantilla.asunto), cuerpo: sustituir(plantilla.cuerpo).replace(/\n{3,}/g, '\n\n') };
}

/** Per-row values the templates need that are not columns of REGISTRO. */
function messageExtras(r, base, members) {
  var summary = r.group_code ? groupSummary(r.group_code, members) : { authorized: 0, registered: 0 };
  var declared = Number(r.members_declared) || 0;
  var link = r.group_code ? membersLink(r.group_code) : '';
  var groupLink = groupInviteLink();
  return {
    url_cambio: base + '?p=cambio-horario&code=' + encodeURIComponent(r.code || ''),
    url_mi_inscripcion: base + '?p=mi-inscripcion',
    members_link: link,
    hora_llegada_texto: r.arrival_time ? humanTime(r.arrival_time) : '',
    hora_audicion_texto: (r.final_time || r.original_time) ? humanTime(r.final_time || r.original_time) : '',
    integrantes_autorizados: summary.authorized,
    integrantes_declarados: declared,
    enlace_grupo_whatsapp: groupLink,
    bloque_grupo: r.group_code
      ? '\nAGRUPACIÓN ' + r.group_code + ': cada integrante debe dar su propia autorización en ' + link +
        ' (van ' + summary.authorized + ' de ' + (declared || summary.registered) + ').\n'
      : '',
    bloque_pista: esVerdadero(r.track_uses)
      ? '- PISTA: envíala antes del evento desde "Mi inscripción" (' + base + '?p=mi-inscripcion) indicando tu código ' +
        (r.code || '') + ', y lleva una copia en USB.\n'
      : ''
  };
}

/**
 * Builds every message for a template without sending anything.
 * Returns WhatsApp click-to-chat links (only for people who authorized
 * WhatsApp) so a human sends them one by one from the official number.
 */
function accionMensajes(datos, sesion) {
  var todas = plantillas();
  var plantilla = todas[String(datos.plantilla || '').toUpperCase()];
  if (!plantilla) {
    return { ok: false, error: 'Plantilla desconocida.', disponibles: Object.keys(todas) };
  }
  if (plantilla.disponible && !plantilla.disponible()) {
    return { ok: false, error: 'Esta plantilla aún no se puede usar: falta el enlace del grupo de WhatsApp en CONFIG (whatsapp_grupo_enlace).' };
  }

  var base = webAppUrl();
  var members = leerHoja(HOJA.INTEGRANTES);
  var mensajes = [];
  leerHoja(HOJA.REGISTRO).forEach(function (r) {
    if (datos.code && normalizarComparable(r.code) !== normalizarComparable(datos.code)) return;
    if (datos.bloque && String(r.final_block || r.original_block) !== String(datos.bloque)) return;
    var extras = messageExtras(r, base, members);
    if (!plantilla.audiencia(r, extras)) return;
    var render = renderizarPlantilla(plantilla, r, extras);
    var tel = normalizarTelefono(r.whatsapp);
    var allowsWhatsapp = esVerdadero(r.consent_whatsapp);
    mensajes.push({
      code: r.code, submission_id: r.submission_id, full_name: r.full_name, email: r.email, whatsapp: r.whatsapp,
      consent_whatsapp: allowsWhatsapp, asunto: render.asunto, cuerpo: render.cuerpo,
      whatsapp_url: tel && allowsWhatsapp ? 'https://wa.me/57' + tel + '?text=' + encodeURIComponent(render.cuerpo) : '',
      sin_whatsapp: !allowsWhatsapp ? 'No autorizó WhatsApp: usar correo' : (!tel ? 'Sin número válido' : '')
    });
  });

  registrar(sesion.alias, sesion.rol, 'GENERAR_MENSAJES', plantilla.id, mensajes.length + ' destinatarios');
  return { plantilla: plantilla.id, nombre: plantilla.nombre, total: mensajes.length, mensajes: mensajes,
           plantillas: plantillasDisponibles() };
}

/**
 * Sends the e-mails for a template.
 * A consumer Gmail account can send ~100 e-mails per day, so this reports the
 * remaining quota and stops cleanly instead of failing halfway through.
 */
function accionEnviarCorreos(datos, sesion) {
  var preparado = accionMensajes(datos, sesion);
  if (preparado.ok === false) return preparado;

  var restantes = MailApp.getRemainingDailyQuota();
  var limite = Math.min(preparado.mensajes.length, restantes, Number(datos.max || 100));

  var enviados = [];
  var omitidos = [];

  for (var i = 0; i < preparado.mensajes.length; i++) {
    var m = preparado.mensajes[i];
    if (enviados.length >= limite) { omitidos.push({ code: m.code, motivo: 'CUOTA_O_LIMITE' }); continue; }
    if (!esEmailValido(m.email)) { omitidos.push({ code: m.code, motivo: 'SIN_CORREO_VALIDO' }); continue; }
    if (/\.test$/i.test(normalizarEmail(m.email))) { omitidos.push({ code: m.code, motivo: 'DATO_DE_PRUEBA' }); continue; }
    try {
      MailApp.sendEmail({ to: m.email, subject: m.asunto, body: m.cuerpo, name: cfg('evento_nombre', 'EL BUNKER') });
      enviados.push(m.code || m.submission_id);
    } catch (e) {
      omitidos.push({ code: m.code, motivo: e.message });
    }
  }

  registrar(sesion.alias, sesion.rol, 'ENVIAR_CORREOS', preparado.plantilla,
            'enviados=' + enviados.length + ' omitidos=' + omitidos.length);

  return {
    plantilla: preparado.plantilla, enviados: enviados.length, omitidos: omitidos,
    cuota_restante: MailApp.getRemainingDailyQuota(),
    nota: omitidos.length
      ? 'Quedaron mensajes sin enviar. Reintenta mañana o envíalos por WhatsApp con los enlaces generados.'
      : ''
  };
}
