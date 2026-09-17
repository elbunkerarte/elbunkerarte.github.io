/**
 * EL BUNKER - Core: blocks, times and schedule-change rules.
 * PURE FUNCTIONS ONLY.
 */

/** Auditions run 16:00-21:00 in ten 30-minute blocks of ten codes. */
var AGENDA_DEFECTO = {
  inicio_minutos: 16 * 60,        // 16:00
  duracion_bloque: 30,            // minutes
  bloques: 10,
  cupo_por_bloque: 10,
  antelacion_llegada: 15,         // minutes before the block starts
  contingencia_inicio: 21 * 60,   // 21:00
  contingencia_fin: 21 * 60 + 30, // 21:30 - hard close
  tolerancia_minutos: 5
};

function minutosAHora(minutos) {
  var h = Math.floor(minutos / 60);
  var m = minutos % 60;
  return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
}

function horaAMinutos(hora) {
  var m = String(hora || '').match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

/** Block number (1..10) for a code number, or null when out of range. */
function bloqueDeNumero(numero, cfg) {
  var c = cfg || AGENDA_DEFECTO;
  if (!numero || numero < 1) return null;
  var bloque = Math.ceil(numero / c.cupo_por_bloque);
  return bloque > c.bloques ? null : bloque;
}

/** Full schedule for one block: id, window, arrival time and code range. */
function horarioDeBloque(bloque, cfg) {
  var c = cfg || AGENDA_DEFECTO;
  if (!bloque || bloque < 1 || bloque > c.bloques) return null;

  var inicio = c.inicio_minutos + (bloque - 1) * c.duracion_bloque;
  var fin = inicio + c.duracion_bloque;
  var llegada = inicio - c.antelacion_llegada;
  var desde = (bloque - 1) * c.cupo_por_bloque + 1;
  var hasta = bloque * c.cupo_por_bloque;

  return {
    block_id: bloque,
    inicio: minutosAHora(inicio),
    fin: minutosAHora(fin),
    ventana: minutosAHora(inicio) + '-' + minutosAHora(fin),
    arrival_time: minutosAHora(llegada),
    audition_time: minutosAHora(inicio),
    limite_tolerancia: minutosAHora(inicio + c.tolerancia_minutos),
    codigo_desde: formatearCodigo(desde),
    codigo_hasta: formatearCodigo(hasta)
  };
}

/** The ten blocks, ready to render in the AGENDA sheet or the public page. */
function construirAgenda(cfg) {
  var c = cfg || AGENDA_DEFECTO;
  var filas = [];
  for (var b = 1; b <= c.bloques; b++) filas.push(horarioDeBloque(b, c));
  filas.push({
    block_id: 'CONTINGENCIA',
    inicio: minutosAHora(c.contingencia_inicio),
    fin: minutosAHora(c.contingencia_fin),
    ventana: minutosAHora(c.contingencia_inicio) + '-' + minutosAHora(c.contingencia_fin),
    arrival_time: '',
    audition_time: '',
    limite_tolerancia: '',
    codigo_desde: '',
    codigo_hasta: ''
  });
  return filas;
}

/** Schedule of the participant holding `codigo`, derived from the code itself. */
function horarioDeCodigo(codigo, cfg) {
  var n = numeroDeCodigo(codigo);
  var bloque = bloqueDeNumero(n, cfg);
  if (!bloque) return null;
  var h = horarioDeBloque(bloque, cfg);
  h.code = String(codigo).toUpperCase();
  return h;
}

// ---------------------------------------------------------------------------
// Schedule changes (Form 2)
// ---------------------------------------------------------------------------

var ESTADO_CAMBIO = {
  SIN_SOLICITUD: 'SIN_SOLICITUD',
  PENDIENTE: 'PENDIENTE',
  APROBADO: 'APROBADO',
  RECHAZADO: 'RECHAZADO'
};

/**
 * Decides whether a change request may even be recorded.
 * Rules from the spec: one request per participant, only before the cutoff,
 * only from someone who declared they cannot attend, code must exist.
 */
function puedeSolicitarCambio(registro, solicitud, opciones) {
  opciones = opciones || {};
  var ahora = opciones.ahora ? new Date(opciones.ahora) : new Date();
  var cierre = opciones.cierre_cambios ? new Date(opciones.cierre_cambios) : null;

  if (!registro) {
    return { permitido: false, motivo: 'CODIGO_NO_ENCONTRADO',
             mensaje: 'No encontramos ese codigo. Verifica el mensaje que recibiste.' };
  }
  if (!normalizarTexto(registro.code)) {
    return { permitido: false, motivo: 'SIN_CODIGO',
             mensaje: 'Este registro aun no tiene codigo asignado.' };
  }
  if (esVerdadero(solicitud.can_attend_original)) {
    return { permitido: false, motivo: 'SI_PUEDE_ASISTIR',
             mensaje: 'El formulario de cambio es solo para quien NO puede asistir en su horario.' };
  }
  var estadoActual = normalizarComparable(registro.change_status || ESTADO_CAMBIO.SIN_SOLICITUD);
  if (estadoActual !== ESTADO_CAMBIO.SIN_SOLICITUD && estadoActual !== '') {
    return { permitido: false, motivo: 'YA_SOLICITO',
             mensaje: 'Ya registramos una solicitud de cambio para este codigo. Solo se permite una.' };
  }
  if (cierre && ahora.getTime() > cierre.getTime()) {
    return { permitido: false, motivo: 'FUERA_DE_PLAZO',
             mensaje: 'El plazo para solicitar cambios ya cerro. El dia del evento no hay cambios ordinarios.' };
  }
  return { permitido: true, motivo: '', mensaje: '' };
}

/**
 * Which blocks can absorb one more participant.
 * Capacity is per block; the participant never picks, production does.
 */
function bloquesConCupo(registros, cfg) {
  var c = cfg || AGENDA_DEFECTO;
  var conteo = {};
  for (var b = 1; b <= c.bloques; b++) conteo[b] = 0;

  for (var i = 0; i < registros.length; i++) {
    var r = registros[i];
    if (!normalizarTexto(r.code)) continue;
    var bloque = parseInt(r.final_block || r.original_block || bloqueDeNumero(numeroDeCodigo(r.code), c), 10);
    if (conteo[bloque] !== undefined) conteo[bloque]++;
  }

  var libres = [];
  for (var k = 1; k <= c.bloques; k++) {
    var h = horarioDeBloque(k, c);
    libres.push({
      block_id: k,
      ventana: h.ventana,
      ocupados: conteo[k],
      cupo: c.cupo_por_bloque,
      disponibles: Math.max(0, c.cupo_por_bloque - conteo[k])
    });
  }
  return libres;
}

/** Applies an approved change: the code never moves, only the block/time does. */
function aplicarCambio(registro, nuevoBloque, opciones) {
  opciones = opciones || {};
  var cfg = opciones.agenda || AGENDA_DEFECTO;
  var h = horarioDeBloque(parseInt(nuevoBloque, 10), cfg);
  if (!h) return { ok: false, mensaje: 'Bloque destino invalido.' };

  return {
    ok: true,
    cambios: {
      final_block: h.block_id,
      final_time: h.audition_time,
      arrival_time: h.arrival_time,
      change_status: ESTADO_CAMBIO.APROBADO,
      changed_at: opciones.ahora || new Date().toISOString(),
      changed_by: opciones.responsable || 'produccion',
      code: registro.code                                  // explicit: code is stable
    },
    horario: h
  };
}
