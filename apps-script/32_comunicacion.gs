/**
 * EL BUNKER - Message templates for email and WhatsApp.
 *
 * WhatsApp is never automated from here: the spec forbids acting outside an
 * authorised API, so the system produces the exact text plus a click-to-chat
 * link, and a human presses send.
 */

function plantillas() {
  var evento = cfg('evento_nombre', 'EL BUNKER');
  var fecha = cfg('evento_fecha', '2026-10-02');
  var sede = cfg('evento_sede', 'PENDIENTE DE COMPLETAR');
  var duracion = cfgNumero('duracion_audicion_min', 3);
  var tolerancia = cfgNumero('tolerancia_min', 5);
  var correoDatos = cfg('data_protection_email', 'PENDIENTE DE COMPLETAR');

  return {
    RECEPCION: {
      id: 'RECEPCION',
      nombre: '1. Recepcion de inscripcion',
      asunto: evento + ' - recibimos tu inscripcion',
      cuerpo:
        'Hola {{full_name}},\n\n' +
        'Recibimos tu inscripcion a ' + evento + '.\n\n' +
        'Estamos validando los datos de todas las personas inscritas. Si quedas dentro de los ' +
        cfgNumero('cupo_total', 100) + ' cupos, te enviaremos tu CODIGO y tu HORARIO.\n\n' +
        'Ten presente que inscribirte no garantiza seleccion, contratacion ni presentacion.\n\n' +
        'Si tienes dudas sobre tus datos personales escribe a ' + correoDatos + '.\n\n' +
        '- Equipo ' + evento
    },

    ASIGNACION: {
      id: 'ASIGNACION',
      nombre: '2. Asignacion de codigo y horario',
      asunto: evento + ' - tu codigo {{code}} y tu horario',
      cuerpo:
        'Hola {{full_name}},\n\n' +
        'Quedaste dentro de los participantes de ' + evento + '.\n\n' +
        'CODIGO: {{code}}\n' +
        'FECHA: ' + fecha + '\n' +
        'HORA DE LLEGADA: {{arrival_time}}\n' +
        'HORA DE AUDICION: {{final_time}}\n' +
        'BLOQUE: {{final_block}}\n' +
        'LUGAR: ' + sede + '\n\n' +
        'IMPORTANTE:\n' +
        '- Llega a la hora de llegada indicada, no a la hora de audicion.\n' +
        '- Trae tu documento de identidad fisico: sin el no hay check-in.\n' +
        '- Tu audicion dura maximo ' + duracion + ' minutos.\n' +
        '- Tolerancia de ' + tolerancia + ' minutos. Si llegas mas tarde pierdes tu turno y pasas a contingencia ' +
        '(audicionas solo si queda tiempo disponible).\n\n' +
        'Tu codigo NO cambia nunca. Si tienes un impedimento real para asistir en tu horario, ' +
        'tienes UNA sola solicitud de cambio aqui: {{url_cambio}}\n' +
        'No respondas este mensaje para cambiar el horario: solo cuentan las solicitudes por ese enlace.\n\n' +
        '- Equipo ' + evento
    },

    CAMBIO_APROBADO: {
      id: 'CAMBIO_APROBADO',
      nombre: '3. Cambio aprobado',
      asunto: evento + ' - cambio APROBADO, tu nuevo horario',
      cuerpo:
        'Hola {{full_name}},\n\n' +
        'Tu solicitud de cambio fue APROBADA.\n\n' +
        'CODIGO: {{code}} (no cambia)\n' +
        'NUEVA HORA DE LLEGADA: {{arrival_time}}\n' +
        'NUEVA HORA DE AUDICION: {{final_time}}\n' +
        'NUEVO BLOQUE: {{final_block}}\n\n' +
        'Este es tu horario definitivo. El dia del evento no hay mas cambios.\n\n' +
        '- Equipo ' + evento
    },

    CAMBIO_RECHAZADO: {
      id: 'CAMBIO_RECHAZADO',
      nombre: '4. Cambio no aprobado',
      asunto: evento + ' - tu solicitud de cambio no fue aprobada',
      cuerpo:
        'Hola {{full_name}},\n\n' +
        'Revisamos tu solicitud de cambio y NO fue aprobada por disponibilidad de la agenda.\n\n' +
        'Tu horario sigue siendo:\n' +
        'CODIGO: {{code}}\n' +
        'HORA DE LLEGADA: {{arrival_time}}\n' +
        'HORA DE AUDICION: {{final_time}}\n\n' +
        'Si no puedes asistir, tu cupo quedara como no audicionado. Gracias por avisarnos.\n\n' +
        '- Equipo ' + evento
    },

    RECORDATORIO_24H: {
      id: 'RECORDATORIO_24H',
      nombre: '5. Recordatorio 24 h antes',
      asunto: evento + ' - manana es tu audicion ({{code}})',
      cuerpo:
        'Hola {{full_name}},\n\n' +
        'Manana ' + fecha + ' es tu audicion en ' + evento + '.\n\n' +
        'CODIGO: {{code}}\n' +
        'LLEGADA: {{arrival_time}} | AUDICION: {{final_time}}\n' +
        'LUGAR: ' + sede + '\n\n' +
        'Lleva tu documento fisico. Prepara ' + duracion + ' minutos exactos.\n' +
        'Recuerda la tolerancia de ' + tolerancia + ' minutos.\n\n' +
        '- Equipo ' + evento
    },

    RECORDATORIO_DIA: {
      id: 'RECORDATORIO_DIA',
      nombre: '6. Recordatorio del dia',
      asunto: evento + ' - hoy es tu audicion ({{code}})',
      cuerpo:
        '{{full_name}}, hoy es tu audicion.\n\n' +
        'CODIGO {{code}} | LLEGADA {{arrival_time}} | AUDICION {{final_time}}\n' +
        'LUGAR: ' + sede + '\n\n' +
        'Documento fisico obligatorio. Tolerancia ' + tolerancia + ' min.\n\n' +
        '- Equipo ' + evento
    },

    CONTINGENCIA: {
      id: 'CONTINGENCIA',
      nombre: '7. Contingencia / no show',
      asunto: evento + ' - tu turno paso a contingencia',
      cuerpo:
        'Hola {{full_name}},\n\n' +
        'Tu turno ({{code}}, {{final_time}}) paso a CONTINGENCIA.\n\n' +
        'La contingencia funciona entre ' + cfg('contingencia_inicio', '21:00') + ' y ' +
        cfg('cierre_audiciones', '21:30') + ', y solo alcanza para quienes quepan en el tiempo disponible, ' +
        'en orden de llegada a la lista.\n\n' +
        'Acercate al punto de check-in y espera el llamado. A las ' + cfg('cierre_audiciones', '21:30') +
        ' se cierran definitivamente las audiciones.\n\n' +
        '- Equipo ' + evento
    }
  };
}

/** Fills {{placeholders}} from a participant row. */
function renderizarPlantilla(plantilla, registro, extras) {
  var datos = Object.assign({}, registro, extras || {});
  function sustituir(texto) {
    return String(texto).replace(/\{\{(\w+)\}\}/g, function (_, clave) {
      var v = datos[clave];
      return (v === undefined || v === null || v === '') ? '{{' + clave + '}}' : String(v);
    });
  }
  return { asunto: sustituir(plantilla.asunto), cuerpo: sustituir(plantilla.cuerpo) };
}

/**
 * Builds every message for a given template without sending anything.
 * Returns WhatsApp click-to-chat links so a human sends them one by one.
 */
function accionMensajes(datos, sesion) {
  var todas = plantillas();
  var plantilla = todas[String(datos.plantilla || '').toUpperCase()];
  if (!plantilla) {
    return { ok: false, error: 'Plantilla desconocida.', disponibles: Object.keys(todas) };
  }

  var base = ScriptApp.getService().getUrl();
  var filas = leerHoja(HOJA.REGISTRO).filter(function (r) {
    if (datos.solo_con_codigo !== 'NO' && !normalizarTexto(r.code)) return false;
    if (datos.code) return normalizarComparable(r.code) === normalizarComparable(datos.code);
    if (datos.bloque) return String(r.final_block || r.original_block) === String(datos.bloque);
    return true;
  });

  var mensajes = filas.map(function (r) {
    var render = renderizarPlantilla(plantilla, r, {
      url_cambio: base + '?p=cambio-horario&code=' + encodeURIComponent(r.code || '')
    });
    var tel = normalizarTelefono(r.whatsapp);
    return {
      code: r.code, full_name: r.full_name, email: r.email, whatsapp: r.whatsapp,
      consent_whatsapp: r.consent_whatsapp, asunto: render.asunto, cuerpo: render.cuerpo,
      whatsapp_url: tel ? 'https://wa.me/57' + tel + '?text=' + encodeURIComponent(render.cuerpo) : ''
    };
  });

  registrar(sesion.alias, sesion.rol, 'GENERAR_MENSAJES', plantilla.id, mensajes.length + ' destinatarios');
  return { plantilla: plantilla.id, nombre: plantilla.nombre, total: mensajes.length, mensajes: mensajes };
}

/**
 * Sends the emails for a template.
 *
 * A consumer Gmail account can send ~100 emails per day, so this reports the
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

    try {
      MailApp.sendEmail({ to: m.email, subject: m.asunto, body: m.cuerpo,
                          name: cfg('evento_nombre', 'EL BUNKER') });
      enviados.push(m.code);
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
      ? 'Quedaron mensajes sin enviar. Reintenta manana o envialos por WhatsApp con los enlaces generados.'
      : ''
  };
}
