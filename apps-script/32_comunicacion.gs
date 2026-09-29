/**
 * EL BUNKER - E-mail (queue, templates, log) and WhatsApp message texts.
 *
 * Every e-mail goes through ONE queue, the _EMAIL_LOG sheet:
 *   enqueueEmail()  - adds a row, idempotent by key (a retried action never mails twice)
 *   processEmailQueue() - sends pending rows within the daily Gmail quota, retries errors
 * Every message is sent as HTML + plain text, states the status and the next step, and
 * carries the visible "revisa Spam y Promociones" notice.
 *
 * WhatsApp is never automated: the panel produces the exact text plus a click-to-chat link
 * and a person presses send from the official number. WhatsApp is a channel, never a database.
 */

var EMAIL_TEMPLATE_VERSION = 'T3-2026-09-29';

var EMAIL_STATUS = {
  PENDIENTE: 'PENDIENTE', ENVIANDO: 'ENVIANDO', ENVIADO: 'ENVIADO', ERROR: 'ERROR', FALLIDO: 'FALLIDO', OMITIDO: 'OMITIDO'
};
var EMAIL_MAX_RETRIES = 3;
var EMAIL_QUOTA_RESERVE = 0;

/** Lower number = sent first when the daily quota is short. */
var EMAIL_PRIORITY = {
  RECEPCION: 1, OFERTA_SUPLENTE: 1, ASIGNACION: 2, CAMBIO_APROBADO: 2, CAMBIO_RECHAZADO: 2, CAMBIO_SOLICITADO: 3,
  RETIRO_CONFIRMADO: 3, CONFIRMACION_FINAL: 3, APTITUD: 4, SIN_CUPO: 5, FIRMAS_PENDIENTES: 6, PISTA_PENDIENTE: 6,
  RECORDATORIO_24H: 4, RECORDATORIO_DIA: 3, RESULTADO_FINAL: 5, CONTINGENCIA: 2, GRUPO_WHATSAPP: 7
};

function commsContext() {
  var fecha = cfgFecha('evento_fecha', '2026-10-23');
  return {
    evento: cfg('evento_nombre', 'EL BÚNKER by Arte es la Solución'),
    fecha_texto: humanDate(fecha),
    hora_texto: humanTime(cfgHora('evento_hora_inicio', '15:00')) + ' a ' + humanTime(cfgHora('evento_hora_fin', '21:00')),
    sede: cfg('evento_sede', ''),
    municipio_sede: cfg('evento_municipio_sede', 'Sabaneta, Antioquia'),
    punto: cfg('evento_direccion', ''),
    duracion: cfgNumero('duracion_audicion_min', 3),
    tolerancia: cfgNumero('tolerancia_min', 5),
    antelacion: cfgNumero('antelacion_llegada_min', 15),
    contingencia: humanTime(cfgHora('contingencia_inicio', '20:30')) + ' a ' + humanTime(cfgHora('cierre_audiciones', '21:00')),
    cierre: humanTime(cfgHora('cierre_audiciones', '21:00')),
    cupo: cfgNumero('cupo_total', 100),
    top: cfgNumero('top_seleccionados', 10),
    numero: phoneText(cfg('whatsapp_oficial', '')),
    nombre_contacto: cfg('whatsapp_oficial_nombre', 'EL BÚNKER — Arte es la Solución'),
    correo_datos: cfg('data_protection_email', ''),
    sitio: cfg('sitio_url', ''),
    horas_suplente: cfgNumero('suplente_horas_respuesta', 24),
    reemplazos_desde: deadlineText(cfg('reemplazos_desde', '')),
    confirmacion_desde: deadlineText(cfg('confirmacion_final_desde', '')),
    confirmacion_hasta: deadlineText(cfg('confirmacion_final_hasta', ''))
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
    ? 'Guarda el número ' + c.numero + ' en tus contactos como "' + c.nombre_contacto +
      '": desde ahí te escribiremos novedades de la convocatoria.'
    : '';
}

var SPAM_NOTICE = 'Revisa también las carpetas Spam y Promociones y marca nuestros correos como "No es spam" para no perderte los siguientes.';

/**
 * Templates. `cuerpo` is plain text; the HTML version is built from it (same words, so the two
 * versions can never disagree). {{placeholders}} come from the REGISTRO row or from extras.
 * `audiencia` is used by the manual bulk sending in the panel; automatic events enqueue directly.
 */
function plantillas() {
  var c = commsContext();
  var firma = '\n\n— Equipo ' + c.evento;
  var lugar = lugarTexto(c);
  var evento = 'EVENTO: ' + c.fecha_texto + ', ' + c.hora_texto + ' · ' + lugar;

  return {
    RECEPCION: {
      id: 'RECEPCION', nombre: 'Recepción de inscripción (automático)',
      audiencia: function (r) { return !!normalizarTexto(r.submission_id); },
      asunto: c.evento + ' — recibimos tu inscripción ({{submission_id}})',
      cuerpo:
        'Hola {{full_name}},\n\n' +
        'ESTADO: RECIBIDA. Tu comprobante es {{submission_id}}.\n\n' +
        'Recibir tu inscripción NO significa que ya seas apto: la organización revisa datos, requisitos y muestra artística. ' +
        'Te escribiremos con el resultado de esa revisión.\n\n' +
        'SIGUIENTE PASO: espera el correo con tu resultado (apto o no apto). Los ' + c.cupo + ' turnos se asignan en orden de ' +
        'inscripción entre quienes resulten aptos; si pasas de ' + c.cupo + ', quedas en la bolsa de suplentes.\n' +
        '{{bloque_equipo}}\n' + evento + '\n\n' +
        'Consulta tu inscripción cuando quieras: {{url_mi_inscripcion}}\n' +
        saveNumberLine(c) + '\n\n' +
        'Inscribirte no garantiza selección, contratación ni presentación.\n' +
        'Dudas sobre tus datos personales: ' + c.correo_datos + '.' + firma
    },

    APTITUD: {
      id: 'APTITUD', nombre: 'Resultado de la revisión de aptitud (automático)',
      audiencia: function (r) {
        var e = normalizeEligibility(r.eligibility_status);
        return e === 'APTO' || e === 'NO_APTO' || e === 'DUPLICADO' || e === 'INCOMPLETO';
      },
      asunto: c.evento + ' — resultado de tu inscripción: {{estado_aptitud}}',
      cuerpo:
        'Hola {{full_name}},\n\n' +
        'ESTADO: {{estado_aptitud}} (comprobante {{submission_id}}).\n\n' +
        '{{detalle_aptitud}}\n\n' +
        'SIGUIENTE PASO: {{siguiente_aptitud}}\n\n' +
        evento + '\n\n' +
        'Tu inscripción: {{url_mi_inscripcion}}' + firma
    },

    ASIGNACION: {
      id: 'ASIGNACION', nombre: 'Código y horario (automático al asignar)',
      audiencia: function (r) { return !!normalizarTexto(r.code); },
      asunto: c.evento + ' — tu código {{code}} y tu horario',
      cuerpo:
        'Hola {{full_name}},\n\n' +
        'ESTADO: TIENES TURNO. Estás dentro de los ' + c.cupo + ' turnos de audición.\n\n' +
        'CÓDIGO: {{code}}\n' +
        'FECHA: ' + c.fecha_texto + '\n' +
        'LLEGADA (check-in): {{hora_llegada_texto}}\n' +
        'AUDICIÓN: {{hora_audicion_texto}} ({{bloque_texto}})\n' +
        'LUGAR: ' + lugar + '\n\n' +
        'SIGUIENTE PASO:\n' +
        '- Llega a la hora de llegada, no a la de audición, con tu documento de identidad original.\n' +
        '- Tu audición dura máximo ' + c.duracion + ' minutos. Tolerancia de ' + c.tolerancia + ' minutos; después pasas a ' +
        'contingencia (' + c.contingencia + '), solo si queda tiempo.\n' +
        '{{bloque_pista}}{{bloque_equipo}}' +
        '- El ' + c.confirmacion_desde + ' confirma tu asistencia en "Mi inscripción": {{url_mi_inscripcion}}\n\n' +
        'Si tienes un impedimento real con tu horario, tienes UNA solicitud de cambio: {{url_cambio}} ' +
        '(tu horario no cambia hasta que producción la apruebe). Si no podrás asistir, desde el ' + c.reemplazos_desde +
        ' puedes liberar tu cupo en "Mi inscripción" para que lo reciba un suplente.\n\n' +
        saveNumberLine(c) + firma
    },

    SIN_CUPO: {
      id: 'SIN_CUPO', nombre: 'Apto sin turno: suplente o fuera de bolsa (automático al asignar)',
      audiencia: function (r) {
        var p = normalizarComparable(r.pool_status);
        return !normalizarTexto(r.code) && (p === 'SUPLENTE' || p === 'FUERA_DE_BOLSA');
      },
      asunto: c.evento + ' — tu inscripción es apta: {{estado_bolsa}}',
      cuerpo:
        'Hola {{full_name}},\n\n' +
        'ESTADO: APTO · {{estado_bolsa}}.\n\n' +
        '{{detalle_bolsa}}\n\n' +
        'SIGUIENTE PASO: {{siguiente_bolsa}}\n\n' +
        evento + '\n\n' +
        'Tu inscripción: {{url_mi_inscripcion}}' + firma
    },

    OFERTA_SUPLENTE: {
      id: 'OFERTA_SUPLENTE', nombre: 'Oferta de cupo a un suplente (automático)',
      audiencia: function () { return false; },
      asunto: c.evento + ' — se liberó un cupo para ti ({{slot_code}}): responde antes de {{vence_texto}}',
      cuerpo:
        'Hola {{full_name}},\n\n' +
        'ESTADO: SUPLENTE CON CUPO OFRECIDO. Se liberó el turno {{slot_code}} y eres la siguiente persona de la bolsa de suplentes.\n\n' +
        'TURNO OFRECIDO: {{slot_code}} · llegada {{slot_arrival}} · audición {{slot_time}}\n' +
        'FECHA Y LUGAR: ' + c.fecha_texto + ' · ' + lugar + '\n\n' +
        'SIGUIENTE PASO: entra a "Mi inscripción" y elige ACEPTAR o NO PUEDO antes de {{vence_texto}}: {{url_mi_inscripcion}}\n' +
        'Si no respondes a tiempo, el cupo pasa a la siguiente persona.' + firma
    },

    RETIRO_CONFIRMADO: {
      id: 'RETIRO_CONFIRMADO', nombre: 'Retiro confirmado (automático)',
      audiencia: function () { return false; },
      asunto: c.evento + ' — registramos que liberaste el cupo {{slot_code}}',
      cuerpo:
        'Hola {{full_name}},\n\n' +
        'ESTADO: RETIRADO. Liberaste el cupo {{slot_code}}; lo recibirá la siguiente persona de la bolsa de suplentes.\n\n' +
        'SIGUIENTE PASO: ninguno. Gracias por avisar a tiempo. Si fue un error, escríbenos por WhatsApp' +
        (c.numero ? ' al ' + c.numero : '') + '.' + firma
    },

    CAMBIO_SOLICITADO: {
      id: 'CAMBIO_SOLICITADO', nombre: 'Solicitud de cambio recibida (automático)',
      audiencia: function (r) { return normalizarComparable(r.change_status) === 'PENDIENTE'; },
      asunto: c.evento + ' — recibimos tu solicitud de cambio de horario ({{code}})',
      cuerpo:
        'Hola {{full_name}},\n\n' +
        'ESTADO: CAMBIO SOLICITADO (pendiente de revisión).\n\n' +
        'Tu horario NO cambia hasta que producción apruebe la solicitud. Mientras tanto sigue vigente:\n' +
        'CÓDIGO: {{code}} · LLEGADA: {{hora_llegada_texto}} · AUDICIÓN: {{hora_audicion_texto}}\n\n' +
        'SIGUIENTE PASO: espera nuestra respuesta (APROBADO o NO APROBADO) por correo o WhatsApp.' + firma
    },

    CAMBIO_APROBADO: {
      id: 'CAMBIO_APROBADO', nombre: 'Cambio aprobado (automático)',
      audiencia: function (r) { return normalizarComparable(r.change_status) === 'APROBADO'; },
      asunto: c.evento + ' — cambio APROBADO, tu nuevo horario',
      cuerpo:
        'Hola {{full_name}},\n\n' +
        'ESTADO: CAMBIO APROBADO.\n\n' +
        'CÓDIGO: {{code}} (no cambia)\n' +
        'NUEVA LLEGADA: {{hora_llegada_texto}}\n' +
        'NUEVA AUDICIÓN: {{hora_audicion_texto}} ({{bloque_texto}})\n' +
        'FECHA Y LUGAR: ' + c.fecha_texto + ' · ' + lugar + '\n\n' +
        'SIGUIENTE PASO: preséntate a tu nueva hora de llegada con tu documento original. Este es tu horario definitivo.' + firma
    },

    CAMBIO_RECHAZADO: {
      id: 'CAMBIO_RECHAZADO', nombre: 'Cambio no aprobado (automático)',
      audiencia: function (r) { return normalizarComparable(r.change_status) === 'RECHAZADO'; },
      asunto: c.evento + ' — tu solicitud de cambio no fue aprobada',
      cuerpo:
        'Hola {{full_name}},\n\n' +
        'ESTADO: CAMBIO NO APROBADO, por disponibilidad de la agenda.\n\n' +
        'Tu horario sigue siendo:\n' +
        'CÓDIGO: {{code}} · LLEGADA: {{hora_llegada_texto}} · AUDICIÓN: {{hora_audicion_texto}}\n' +
        'FECHA Y LUGAR: ' + c.fecha_texto + ' · ' + lugar + '\n\n' +
        'SIGUIENTE PASO: si no podrás asistir, libera tu cupo en "Mi inscripción" ({{url_mi_inscripcion}}) desde el ' +
        c.reemplazos_desde + ' para que lo reciba un suplente.' + firma
    },

    CONFIRMACION_FINAL: {
      id: 'CONFIRMACION_FINAL', nombre: 'Confirmación final de asistencia (22-oct)',
      audiencia: function (r) { return !!normalizarTexto(r.code) && !normalizarTexto(r.final_confirmation); },
      asunto: c.evento + ' — confirma tu asistencia ({{code}})',
      cuerpo:
        'Hola {{full_name}},\n\n' +
        'ESTADO: TIENES TURNO, falta tu confirmación final.\n\n' +
        'CÓDIGO: {{code}} · LLEGADA: {{hora_llegada_texto}} · AUDICIÓN: {{hora_audicion_texto}}\n' +
        'FECHA Y LUGAR: ' + c.fecha_texto + ' · ' + lugar + '\n\n' +
        // Sent the day before when the daily mail quota is tight, so it names when the buttons open.
        'SIGUIENTE PASO: entre el ' + c.confirmacion_desde + ' y el ' + c.confirmacion_hasta +
        ' entra a "Mi inscripción" y marca SÍ CONFIRMO o NO PODRÉ ASISTIR' +
        ': {{url_mi_inscripcion}}\nConfirmar no cambia tu horario.' + firma
    },

    RECORDATORIO_24H: {
      id: 'RECORDATORIO_24H', nombre: 'Recordatorio 24 h antes',
      audiencia: function (r) { return !!normalizarTexto(r.code); },
      asunto: c.evento + ' — mañana es tu audición ({{code}})',
      cuerpo:
        'Hola {{full_name}},\n\n' +
        'ESTADO: TIENES TURNO. Mañana, ' + c.fecha_texto + ', es tu audición.\n\n' +
        'CÓDIGO: {{code}}\nLLEGADA: {{hora_llegada_texto}} · AUDICIÓN: {{hora_audicion_texto}}\nLUGAR: ' + lugar + '\n\n' +
        'SIGUIENTE PASO: lleva tu documento original y prepara máximo ' + c.duracion + ' minutos.\n' +
        '{{bloque_pista}}Tolerancia de ' + c.tolerancia + ' minutos.' + firma
    },

    RECORDATORIO_DIA: {
      id: 'RECORDATORIO_DIA', nombre: 'Recordatorio del día',
      audiencia: function (r) { return !!normalizarTexto(r.code); },
      asunto: c.evento + ' — hoy es tu audición ({{code}})',
      cuerpo:
        '{{full_name}}, hoy es tu audición.\n\n' +
        'ESTADO: TIENES TURNO. CÓDIGO {{code}} · LLEGADA {{hora_llegada_texto}} · AUDICIÓN {{hora_audicion_texto}}\n' +
        'LUGAR: ' + lugar + '\n\n' +
        'SIGUIENTE PASO: llega a tu hora de llegada con tu documento original. Tolerancia de ' + c.tolerancia + ' minutos.' + firma
    },

    CONTINGENCIA: {
      id: 'CONTINGENCIA', nombre: 'Contingencia / no show',
      audiencia: function (r) {
        var e = normalizarEstado(r.attendance_status);
        return e === 'CONTINGENCIA' || e === 'NO SHOW';
      },
      asunto: c.evento + ' — tu turno pasó a contingencia',
      cuerpo:
        'Hola {{full_name}},\n\n' +
        'ESTADO: CONTINGENCIA. Tu turno ({{code}}, {{hora_audicion_texto}}) pasó a contingencia.\n\n' +
        'La contingencia funciona de ' + c.contingencia + ' y solo alcanza para quienes quepan en el tiempo disponible.\n\n' +
        'SIGUIENTE PASO: acércate al punto de check-in y espera el llamado. A las ' + c.cierre +
        ' se cierran definitivamente las audiciones.' + firma
    },

    FIRMAS_PENDIENTES: {
      id: 'FIRMAS_PENDIENTES', nombre: 'Faltan firmas del equipo',
      audiencia: function (r, extra) {
        return !!normalizarTexto(r.code) && extra.integrantes_declarados > 0 && extra.integrantes_autorizados < extra.integrantes_declarados;
      },
      asunto: c.evento + ' — faltan firmas de tu proyecto ({{code}})',
      cuerpo:
        'Hola {{full_name}},\n\n' +
        'ESTADO: FIRMAS INCOMPLETAS. En {{artistic_name}} ({{code}}) van {{integrantes_autorizados}} de {{integrantes_declarados}} ' +
        'intérpretes con su autorización individual.\n\n' +
        'SIGUIENTE PASO: cada persona firma por sí misma en este enlace (tú no puedes firmar por otra persona). ' +
        'Si viene equipo de trabajo (manager, técnico, fotógrafo...), también se registra ahí para la póliza del lugar:\n' +
        '{{members_link}}\n\n' +
        'Quien no firme en línea deberá firmar la constancia física el día del evento.\n' + evento + firma
    },

    PISTA_PENDIENTE: {
      id: 'PISTA_PENDIENTE', nombre: 'Pista pendiente',
      audiencia: function (r) {
        return !!normalizarTexto(r.code) && esVerdadero(r.track_uses) &&
               normalizarComparable(r.track_status) === normalizarComparable(TRACK_STATUS.PENDIENTE);
      },
      asunto: c.evento + ' — envíanos tu pista ({{code}})',
      cuerpo:
        'Hola {{full_name}},\n\n' +
        'ESTADO: FALTA TU PISTA. Aún no hemos recibido la pista de {{code}}.\n\n' +
        'SIGUIENTE PASO: envía el archivo indicando tu código {{code}}:\n' +
        '- Por la web (recomendado): {{url_mi_inscripcion}}\n' +
        (c.numero ? '- O por WhatsApp al ' + c.numero + ', escribiendo tu código {{code}} en el mensaje.\n' : '') +
        '\nEl día del evento lleva también una copia en USB.\n' + evento + firma
    },

    RESULTADO_FINAL: {
      id: 'RESULTADO_FINAL', nombre: 'Resultado final (tras cerrar resultados)',
      disponible: function () { return cfgBool('resultados_cerrados', false); },
      audiencia: function (r) { return normalizarComparable(r.participation_status) === 'AUDICIONADO' ||
                                       normalizarEstado(r.attendance_status) === 'REALIZADA'; },
      asunto: c.evento + ' — resultado de tu audición ({{code}})',
      cuerpo:
        'Hola {{full_name}},\n\n' +
        'ESTADO: {{estado_resultado}}.\n\n' +
        '{{detalle_resultado}}\n\n' +
        'SIGUIENTE PASO: {{siguiente_resultado}}\n\n' +
        'Gracias por subir al escenario de ' + c.evento + '.' + firma
    },

    GRUPO_WHATSAPP: {
      id: 'GRUPO_WHATSAPP', nombre: 'Invitación al grupo de WhatsApp',
      disponible: function () { return !!groupInviteLink(); },
      audiencia: function (r) {
        return esVerdadero(r.consent_whatsapp) &&
               (normalizeEligibility(r.eligibility_status) === 'APTO' || !!normalizarTexto(r.code));
      },
      asunto: c.evento + ' — grupo de WhatsApp de la convocatoria',
      cuerpo:
        'Hola {{full_name}},\n\n' +
        'ESTADO: APTO. Por aquí compartiremos las indicaciones operativas finales:\n' +
        '{{enlace_grupo_whatsapp}}\n\n' +
        'SIGUIENTE PASO: únete al grupo. El sistema sigue siendo la fuente oficial de tu estado: consúltalo en {{url_mi_inscripcion}}\n' +
        saveNumberLine(c) + firma
    }
  };
}

/** Templates that can be used right now: one that needs missing data is not offered at all. */
function plantillasDisponibles() {
  var all = plantillas();
  return Object.keys(all).filter(function (k) {
    return (!all[k].disponible || all[k].disponible()) && all[k].audiencia.length > 0;
  }).map(function (k) { return { id: k, nombre: all[k].nombre }; });
}

/**
 * Fills {{placeholders}} from a participant row plus explicit extras.
 * A placeholder whose value is missing from the row stays visible on purpose,
 * so a half-filled message is never sent unnoticed; extras may legitimately be empty.
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

/** Plain text with the spam notice first, then the message. */
function emailPlainText(body) {
  return SPAM_NOTICE + '\n\n' + body;
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** HTML version of the same words: paragraphs, bullet lists, absolute links, spam notice box. */
function emailHtml(subject, body) {
  var linkify = function (text) {
    return escapeHtml(text).replace(/https:\/\/[^\s<]+/g, function (u) {
      var clean = u.replace(/[.,;)]+$/, '');
      return '<a href="' + clean + '" style="color:#B5121B">' + clean + '</a>' + u.slice(clean.length);
    });
  };
  var html = String(body).split(/\n{2,}/).map(function (block) {
    var lines = block.split('\n');
    if (lines.every(function (l) { return /^- /.test(l); })) {
      return '<ul style="padding-left:18px;margin:0 0 14px">' +
        lines.map(function (l) { return '<li style="margin:0 0 6px">' + linkify(l.slice(2)) + '</li>'; }).join('') + '</ul>';
    }
    return '<p style="margin:0 0 14px">' + lines.map(linkify).join('<br>') + '</p>';
  }).join('');
  return '<!doctype html><html><body style="margin:0;background:#F4F4F2">' +
    '<div style="max-width:600px;margin:0 auto;background:#FFFFFF;font-family:Arial,Helvetica,sans-serif;color:#1D1D1B;font-size:15px;line-height:1.5">' +
    '<div style="background:#1D1D1B;color:#FFFFFF;padding:16px 20px;font-weight:bold;letter-spacing:1px">EL BÚNKER · Arte es la Solución</div>' +
    '<div style="margin:16px 20px 0;padding:10px 12px;background:#FFF2CC;border-left:4px solid #E0A800;font-size:13px">' +
    escapeHtml(SPAM_NOTICE) + '</div>' +
    '<div style="padding:16px 20px 8px">' + html + '</div>' +
    '<div style="padding:12px 20px 18px;color:#6B6B6B;font-size:12px">' + escapeHtml(subject) + '</div>' +
    '</div></body></html>';
}

/**
 * Links a production e-mail must never carry (test/staging hosts, old repositories, dev URLs).
 * Returns the offending fragment, or ''.
 */
function forbiddenLink(text) {
  var m = String(text).match(/localhost|127\.0\.0\.1|\/dev\b|staging|juanma1725|github\.io\/el-bunker|\{\{\w+\}\}/i);
  return m ? m[0] : '';
}

/** The team code of a project: its members/crew/signatures live under it (groups: GRP-xxx, soloists: EQ-xxx). */
function teamCodeOf(r) {
  return normalizarTexto(r.team_code) || normalizarTexto(r.group_code);
}

/** Per-row values the templates need that are not columns of REGISTRO. */
function messageExtras(r, base, members) {
  var team = teamCodeOf(r);
  var summary = team ? groupSummary(team, members) : { authorized: 0, registered: 0 };
  var declared = Number(r.members_declared) || (team ? 1 : 0);
  var link = team ? membersLink(team) : '';
  var e = normalizeEligibility(r.eligibility_status);
  var c = commsContext();
  var aptitude = {
    APTO: ['APTO', 'Tu inscripción cumple los requisitos de la convocatoria.',
           'Los ' + c.cupo + ' turnos se asignan en orden de inscripción entre quienes son aptos. Te enviaremos tu código y horario, ' +
           'o te avisaremos si quedas en la bolsa de suplentes.'],
    NO_APTO: ['NO APTO', 'Tu inscripción no cumple los requisitos de la convocatoria' +
              (r.validation_notes && /EDAD/.test(r.validation_notes) ? ' (edad el día del evento)' : '') +
              (r.validation_notes && /RESIDENCIA/.test(r.validation_notes) ? ' (residencia)' : '') + '.',
              'Ninguno. Si crees que hay un error en tus datos, escríbenos' + (c.numero ? ' por WhatsApp al ' + c.numero : '') + '.'],
    DUPLICADO: ['DUPLICADA', 'Ya teníamos una inscripción con tu documento; conservamos la primera.',
                'Ninguno: no necesitas volver a inscribirte. Consulta la primera inscripción en "Mi inscripción".'],
    INCOMPLETO: ['INCOMPLETA', 'A tu inscripción le faltan datos obligatorios.',
                 'Envía el formulario de nuevo con todos los datos: la nueva inscripción no se marca como duplicada por esta.']
  }[e] || ['EN REVISIÓN', 'Tu inscripción sigue en revisión.', 'Espera nuestro correo.'];
  var pool = normalizarComparable(r.pool_status);
  var poolText = pool === 'FUERA_DE_BOLSA'
    ? ['FUERA DE LA BOLSA', 'Los ' + c.cupo + ' turnos y la bolsa de suplentes ya están completos, en orden de inscripción. ' +
       'Tu inscripción queda registrada como apta.', 'Ninguno por ahora. Si la bolsa se mueve, te escribiremos.']
    : ['SUPLENTE', 'Los ' + c.cupo + ' turnos ya se asignaron en orden de inscripción y quedaste en la bolsa de suplentes. ' +
       'Ser suplente NO es ser finalista ni seleccionado: significa que puedes recibir un turno si alguien libera el suyo.',
       'Si se libera un cupo para ti te escribiremos y tendrás ' + c.horas_suplente + ' horas para aceptarlo en "Mi inscripción".'];
  var ranking = normalizarComparable(r.ranking_status);
  var selected = ranking === 'TOP10_SELECCIONADO';
  var groupLink = groupInviteLink();
  return {
    url_cambio: base + '?p=cambio-horario&code=' + encodeURIComponent(r.code || ''),
    url_mi_inscripcion: base + '?p=mi-inscripcion',
    members_link: link,
    hora_llegada_texto: r.arrival_time ? humanTime(r.arrival_time) : '',
    hora_audicion_texto: (r.final_time || r.original_time) ? humanTime(r.final_time || r.original_time) : '',
    bloque_texto: blockLabel(r.final_block || r.original_block, agendaConfigurada()).toLowerCase(),
    integrantes_autorizados: summary.authorized,
    integrantes_declarados: declared,
    enlace_grupo_whatsapp: groupLink,
    estado_aptitud: aptitude[0], detalle_aptitud: aptitude[1], siguiente_aptitud: aptitude[2],
    estado_bolsa: poolText[0], detalle_bolsa: poolText[1], siguiente_bolsa: poolText[2],
    estado_resultado: selected ? 'SELECCIONADO' : 'NO SELECCIONADO',
    detalle_resultado: selected
      ? '¡Felicitaciones! Tu proyecto está entre los ' + c.top + ' seleccionados de la convocatoria.'
      : 'Tu proyecto no quedó entre los ' + c.top + ' seleccionados. El jurado calificó cada audición con la rúbrica oficial.',
    siguiente_resultado: selected
      ? 'La organización te contactará con los siguientes pasos. Mantén tu teléfono disponible.'
      : 'Ninguno. Sigue atento a nuestras redes para las próximas convocatorias.',
    bloque_equipo: link
      ? '\nEQUIPO Y FIRMAS: cada intérprete' + (isGroupMode(r.participation_mode) ? '' : ' y cada persona de tu equipo de trabajo') +
        ' firma por sí mismo en ' + link + (declared > 1 ? ' (van ' + summary.authorized + ' de ' + declared + ' intérpretes).' : '.') + '\n'
      : '',
    bloque_pista: esVerdadero(r.track_uses)
      ? '- PISTA: envíala antes del evento desde "Mi inscripción" (' + base + '?p=mi-inscripcion) indicando tu código ' +
        (r.code || '') + ', y lleva una copia en USB.\n'
      : ''
  };
}

// ---------------------------------------------------------------------------
// Queue
// ---------------------------------------------------------------------------

/**
 * Adds one e-mail to the queue unless the same idempotency key is already queued or sent.
 * Must run inside the script lock (it appends a row). Never throws: mail must not break the operation.
 * options.fresh: the key contains an id created in this same request, so it can not exist yet and the
 *   log is not scanned. options.claim: the row is written already claimed (ENVIANDO) and returned as
 *   `entry`, for deliverClaimedEmail() to send it right after the lock without reading the sheets again.
 */
function enqueueEmail(templateKey, row, trigger, extras, idempotencyKey, options) {
  options = options || {};
  try {
    if (!row || !row.submission_id) return { encolado: false, motivo: 'SIN_REGISTRO' };
    var key = idempotencyKey || (templateKey + ':' + row.submission_id);
    if (!options.fresh) {
      var existing = leerHoja(HOJA.EMAIL_LOG).filter(function (e) { return e.idempotency_key === key; })[0];
      if (existing && normalizarComparable(existing.status) !== EMAIL_STATUS.FALLIDO) {
        return { encolado: false, motivo: 'YA_EXISTE', email_id: existing.email_id };
      }
    }
    var email = normalizarEmail(row.email);
    var skip = !esEmailValido(email) ? 'SIN_CORREO_VALIDO' : (/\.test$/i.test(email) ? 'DATO_DE_PRUEBA' : '');
    var claim = !!options.claim && !skip;
    var id = nuevoId('EM');
    var entry = {
      email_id: id, at: isoWithOffset(), template_key: templateKey, template_version: EMAIL_TEMPLATE_VERSION,
      trigger: trigger || 'manual', idempotency_key: key, recipient: email, submission_id: row.submission_id,
      person_id: row.person_id || '', code: row.code || row.previous_code || '',
      status: skip ? EMAIL_STATUS.OMITIDO : (claim ? EMAIL_STATUS.ENVIANDO : EMAIL_STATUS.PENDIENTE),
      provider_message_id: '', retry_count: 0,
      last_attempt_at: claim ? isoWithOffset() : '', error: skip, subject: '', payload: JSON.stringify(extras || {}).slice(0, 2000)
    };
    entry._fila = agregarFila(HOJA.EMAIL_LOG, entry);
    return { encolado: !skip, email_id: id, motivo: skip, entry: claim ? entry : null };
  } catch (e) {
    try { registrar('sistema', '', 'CORREO_ENCOLAR_FALLO', templateKey, e.message); } catch (ignored) { /* nothing left to do */ }
    return { encolado: false, motivo: e.message };
  }
}

/**
 * Sends queued e-mails. Claims rows under the lock, sends outside it, records the results under
 * the lock again, so a concurrent run never sends the same row twice. Rows stuck in ENVIANDO
 * (a run that died) are retried after 15 minutes.
 * @param {{limit?:number, keys?:string[]}} options
 */
function processEmailQueue(options) {
  options = options || {};
  var limit = options.limit || 40;
  var now = Date.now();
  var quota = 0;
  try { quota = MailApp.getRemainingDailyQuota(); } catch (e) { quota = 0; }
  var budget = Math.max(0, Math.min(limit, quota - EMAIL_QUOTA_RESERVE));
  var result = { enviados: 0, errores: 0, pendientes_por_cuota: 0, cuota_restante: quota };

  var claimed = conBloqueo(function () {
    var rows = leerHoja(HOJA.EMAIL_LOG).filter(function (e) {
      if (options.keys && options.keys.indexOf(e.idempotency_key) === -1) return false;
      var st = normalizarComparable(e.status);
      if (st === EMAIL_STATUS.PENDIENTE) return true;
      if (st === EMAIL_STATUS.ERROR) return Number(e.retry_count || 0) < EMAIL_MAX_RETRIES;
      if (st === EMAIL_STATUS.ENVIANDO) return now - new Date(e.last_attempt_at).getTime() > 15 * 60000;
      return false;
    });
    rows.sort(function (a, b) {
      var pa = EMAIL_PRIORITY[a.template_key] || 9, pb = EMAIL_PRIORITY[b.template_key] || 9;
      if (pa !== pb) return pa - pb;
      return String(a.at) < String(b.at) ? -1 : 1;
    });
    result.pendientes_por_cuota = Math.max(0, rows.length - budget);
    var take = rows.slice(0, budget);
    var stamp = isoWithOffset();
    actualizarFilasEnLote(HOJA.EMAIL_LOG, take.map(function (e) {
      return { fila: e._fila, cambios: { status: EMAIL_STATUS.ENVIANDO, last_attempt_at: stamp } };
    }));
    return take;
  });
  if (!claimed.length) return result;

  var registry = {};
  leerHoja(HOJA.REGISTRO).forEach(function (r) { registry[r.submission_id] = r; });
  var members = leerHoja(HOJA.INTEGRANTES);
  var templates = plantillas();
  var base = webAppUrl();
  var production = environmentName() === 'production';
  var outcomes = claimed.map(function (e) {
    return deliverEmail(e, registry[e.submission_id], members, templates, base, production);
  });

  recordDeliveries(outcomes);
  outcomes.forEach(function (o) { if (o.sent) result.enviados++; else result.errores++; });
  try { result.cuota_restante = MailApp.getRemainingDailyQuota(); } catch (e2) { /* keep the earlier value */ }
  return result;
}

/** Renders and sends one claimed log entry. Never throws: returns the changes for its log row. */
function deliverEmail(e, row, members, templates, base, production) {
  var out = { e: e, cambios: {} };
  try {
    var tpl = templates[e.template_key];
    if (!tpl || !row) throw new Error(!tpl ? 'PLANTILLA_DESCONOCIDA' : 'REGISTRO_NO_ENCONTRADO');
    var payload = {};
    try { payload = JSON.parse(e.payload || '{}'); } catch (ignored) { payload = {}; }
    var msg = renderizarPlantilla(tpl, row, Object.assign(messageExtras(row, base, members), payload));
    var bad = forbiddenLink(msg.asunto + '\n' + msg.cuerpo);
    if (bad && (production || /\{\{/.test(bad))) throw new Error('CONTENIDO_NO_PERMITIDO: ' + bad);
    MailApp.sendEmail({
      to: e.recipient, subject: msg.asunto, body: emailPlainText(msg.cuerpo),
      htmlBody: emailHtml(msg.asunto, msg.cuerpo), name: cfg('whatsapp_oficial_nombre', 'EL BÚNKER — Arte es la Solución')
    });
    out.cambios = { status: EMAIL_STATUS.ENVIADO, subject: msg.asunto.slice(0, 250), error: '', last_attempt_at: isoWithOffset() };
    out.sent = true;
    out.payload = payload;
  } catch (err) {
    var retries = Number(e.retry_count || 0) + 1;
    var permanent = /^(PLANTILLA_DESCONOCIDA|REGISTRO_NO_ENCONTRADO|CONTENIDO_NO_PERMITIDO)/.test(err.message);
    out.cambios = { status: permanent || retries >= EMAIL_MAX_RETRIES ? EMAIL_STATUS.FALLIDO : EMAIL_STATUS.ERROR,
                    retry_count: retries, error: String(err.message).slice(0, 300), last_attempt_at: isoWithOffset() };
  }
  return out;
}

/** Writes the outcome of each delivery to its log row, under the lock. */
function recordDeliveries(outcomes) {
  conBloqueo(function () {
    actualizarFilasEnLote(HOJA.EMAIL_LOG, outcomes.map(function (o) { return { fila: o.e._fila, cambios: o.cambios }; }));
    outcomes.forEach(function (o) {
      if (o.payload && o.payload.solicitud_id) markChangeNotification(o.payload.solicitud_id, o.sent ? 'CORREO ENVIADO ' + isoWithOffset() : 'CORREO FALLIDO');
      if (!o.sent && o.e && o.cambios.status === EMAIL_STATUS.FALLIDO) {
        registrar('sistema', '', 'CORREO_FALLIDO', o.e.template_key, o.e.submission_id + ' ' + o.cambios.error);
      }
    });
  });
}

/**
 * Sends an entry enqueueEmail() wrote already claimed, with the row and members the caller holds:
 * the receipt of a registration no longer re-reads the registry, the members and the whole log
 * (~2.7 s per submission measured live, 2026-09-29). Without quota the row goes back to PENDIENTE
 * for the queue; if this execution dies first, the queue retries the ENVIANDO row after 15 minutes.
 */
function deliverClaimedEmail(entry, row, members) {
  if (!entry || !entry._fila) return null;
  try {
    var quota = 0;
    try { quota = MailApp.getRemainingDailyQuota(); } catch (e) { quota = 0; }
    if (quota - EMAIL_QUOTA_RESERVE <= 0) {
      recordDeliveries([{ e: entry, cambios: { status: EMAIL_STATUS.PENDIENTE, last_attempt_at: '' } }]);
      return { enviado: false, motivo: 'SIN_CUOTA' };
    }
    var outcome = deliverEmail(entry, row, members || [], plantillas(), webAppUrl(), environmentName() === 'production');
    recordDeliveries([outcome]);
    return { enviado: !!outcome.sent, error: outcome.sent ? '' : outcome.cambios.error };
  } catch (e) {
    return { enviado: false, error: e.message };
  }
}

function markChangeNotification(requestId, text) {
  var row = leerHoja(HOJA.CAMBIOS).filter(function (c) { return c.solicitud_id === requestId; })[0];
  if (row) actualizarFila(HOJA.CAMBIOS, row._fila, { notificacion_estado: text });
}

/** Time trigger (every 15 minutes). */
function procesarColaCorreos() {
  try { return processEmailQueue({ limit: 40 }); }
  catch (e) { registrar('sistema', '', 'COLA_CORREOS_FALLO', '', e.message); return { error: e.message }; }
}

// ---------------------------------------------------------------------------
// Panel: preview, bulk queueing, WhatsApp texts, the log
// ---------------------------------------------------------------------------

/**
 * Builds every message for a template without sending anything.
 * Returns WhatsApp click-to-chat links (only for people who authorized WhatsApp)
 * so a person sends them one by one from the official number.
 */
function accionMensajes(datos, sesion) {
  var todas = plantillas();
  var plantilla = todas[String(datos.plantilla || '').toUpperCase()];
  if (!plantilla) return { ok: false, error: 'Plantilla desconocida.', disponibles: Object.keys(todas) };
  if (plantilla.disponible && !plantilla.disponible()) {
    return { ok: false, error: plantilla.id === 'GRUPO_WHATSAPP'
      ? 'Esta plantilla aún no se puede usar: falta el enlace del grupo de WhatsApp en CONFIG (whatsapp_grupo_enlace).'
      : 'Esta plantilla aún no se puede usar: primero hay que cerrar los resultados.' };
  }
  var base = webAppUrl();
  var members = leerHoja(HOJA.INTEGRANTES);
  var mensajes = [];
  leerHoja(HOJA.REGISTRO).forEach(function (r) {
    if (datos.code && normalizarComparable(r.code) !== normalizarComparable(datos.code)) return;
    if (datos.bloque && String(r.final_block || r.original_block) !== String(datos.bloque)) return;
    if (isWithdrawn(r)) return;
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
 * Queues the e-mails of a template for everyone in its audience and starts sending.
 * Idempotent: a person already mailed with this template (same day for reminders of
 * signatures/tracks) is not mailed again. What the quota does not allow today goes out
 * with the next runs of the queue.
 */
function accionEnviarCorreos(datos, sesion) {
  var preparado = accionMensajes(datos, sesion);
  if (preparado.ok === false) return preparado;
  var day = Utilities.formatDate(new Date(), zonaHoraria(), 'yyyyMMdd');
  var repeatable = { FIRMAS_PENDIENTES: true, PISTA_PENDIENTE: true };
  var registry = {};
  leerHoja(HOJA.REGISTRO).forEach(function (r) { registry[r.submission_id] = r; });
  var queued = 0, repeated = 0, skipped = 0;
  conBloqueo(function () {
    preparado.mensajes.forEach(function (m) {
      var row = registry[m.submission_id];
      var key = preparado.plantilla + ':' + m.submission_id + ':' + (row.code || '') + (repeatable[preparado.plantilla] ? ':' + day : '');
      var r = enqueueEmail(preparado.plantilla, row, 'panel:' + sesion.alias, {}, key);
      if (r.encolado) queued++; else if (r.motivo === 'YA_EXISTE') repeated++; else skipped++;
    });
  });
  var sent = processEmailQueue({ limit: 40 });
  registrar(sesion.alias, sesion.rol, 'ENVIAR_CORREOS', preparado.plantilla,
            'encolados=' + queued + ' ya_enviados=' + repeated + ' omitidos=' + skipped + ' enviados_ahora=' + sent.enviados);
  return {
    plantilla: preparado.plantilla, encolados: queued, ya_enviados_antes: repeated, omitidos: skipped,
    enviados_ahora: sent.enviados, errores: sent.errores, pendientes_por_cuota: sent.pendientes_por_cuota,
    cuota_restante: sent.cuota_restante,
    nota: sent.pendientes_por_cuota
      ? 'El resto sale solo en las próximas horas (el sistema revisa la cola cada 15 minutos y respeta el límite diario de Gmail).'
      : ''
  };
}

/** The e-mail log for the panel, newest first, with counts per status. */
function accionRegistroCorreos(datos) {
  var rows = leerHoja(HOJA.EMAIL_LOG);
  var counts = {};
  rows.forEach(function (e) { var s = normalizarComparable(e.status); counts[s] = (counts[s] || 0) + 1; });
  var filter = normalizarComparable(datos.estado || '');
  var list = rows.filter(function (e) { return !filter || filter === 'TODOS' || normalizarComparable(e.status) === filter; })
    .slice(-300).reverse().map(function (e) {
      return { email_id: e.email_id, at: humanDateTime(e.at), plantilla: e.template_key, version: e.template_version,
               destinatario: maskEmail(e.recipient), code: e.code, submission_id: e.submission_id, estado: e.status,
               reintentos: e.retry_count, error: e.error, asunto: e.subject, trigger: e.trigger };
    });
  var quota = 0;
  try { quota = MailApp.getRemainingDailyQuota(); } catch (e) { quota = 0; }
  return { por_estado: counts, correos: list, cuota_restante: quota };
}

/** Puts FALLIDO e-mails back in the queue (after fixing the cause, e.g. a wrong address). */
function accionReintentarCorreos(datos, sesion) {
  return conBloqueo(function () {
    var failed = leerHoja(HOJA.EMAIL_LOG).filter(function (e) {
      return normalizarComparable(e.status) === EMAIL_STATUS.FALLIDO && (!datos.email_id || e.email_id === datos.email_id);
    });
    var registry = {};
    leerHoja(HOJA.REGISTRO).forEach(function (r) { registry[r.submission_id] = r; });
    actualizarFilasEnLote(HOJA.EMAIL_LOG, failed.map(function (e) {
      var row = registry[e.submission_id];
      return { fila: e._fila, cambios: { status: EMAIL_STATUS.PENDIENTE, retry_count: 0, error: '',
                                         recipient: row ? normalizarEmail(row.email) : e.recipient } };
    }));
    registrar(sesion.alias, sesion.rol, 'REINTENTAR_CORREOS', '', failed.length + ' correos');
    return { reencolados: failed.length };
  });
}
