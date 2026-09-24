/**
 * EL BUNKER - Core: attendance / audition state machine and day-of rules.
 * PURE FUNCTIONS ONLY.
 */

var ESTADO = {
  CONFIRMADO: 'CONFIRMADO',       // has code + slot, not arrived yet
  CHECK_IN: 'CHECK-IN',           // arrived and verified with physical ID
  PRECOLA: 'PRECOLA',             // waiting next to the stage
  EN_AUDICION: 'EN AUDICION',     // on stage right now
  NO_SHOW: 'NO SHOW',             // did not arrive / did not audition in slot
  CONTINGENCIA: 'CONTINGENCIA',   // lost the slot, waiting for a free window
  REALIZADA: 'REALIZADA',         // audition actually happened -> can be scored
  NO_AUDICIONADO: 'NO AUDICIONADO', // window closed without auditioning
  INCIDENTE: 'INCIDENTE'          // anything requiring a minuted decision
};

/**
 * Allowed transitions. Anything not listed is rejected by aplicarTransicion,
 * which is what stops the check-in desk from silently corrupting the record
 * (e.g. scoring someone who never checked in).
 */
var TRANSICIONES = {
  'CONFIRMADO':      ['CHECK-IN', 'NO SHOW', 'CONTINGENCIA', 'INCIDENTE'],
  'CHECK-IN':        ['PRECOLA', 'EN AUDICION', 'REALIZADA', 'CONTINGENCIA', 'NO SHOW', 'INCIDENTE'],
  'PRECOLA':         ['EN AUDICION', 'REALIZADA', 'CONTINGENCIA', 'NO SHOW', 'INCIDENTE'],
  'EN AUDICION':     ['REALIZADA', 'INCIDENTE'],
  'CONTINGENCIA':    ['CHECK-IN', 'PRECOLA', 'EN AUDICION', 'REALIZADA', 'NO AUDICIONADO', 'INCIDENTE'],
  'NO SHOW':         ['CONTINGENCIA', 'NO AUDICIONADO', 'INCIDENTE'],
  'REALIZADA':       ['INCIDENTE'],
  'NO AUDICIONADO':  ['INCIDENTE'],
  'INCIDENTE':       ['CHECK-IN', 'PRECOLA', 'EN AUDICION', 'CONTINGENCIA', 'REALIZADA', 'NO AUDICIONADO', 'NO SHOW']
};

/** States that mean "this person can still be selected". */
var ESTADOS_FINALES_SIN_AUDICION = ['NO SHOW', 'NO AUDICIONADO'];

function estadoValido(estado) {
  return TRANSICIONES.hasOwnProperty(normalizarEstado(estado));
}

/** Tolerates "check-in", "CHECK_IN", "no-show" etc. from operators and imports. */
function normalizarEstado(estado) {
  var e = normalizarComparable(estado).replace(/[_]+/g, '-').replace(/\s+/g, ' ').trim();
  if (e === 'CHECK IN') e = 'CHECK-IN';
  if (e === 'NO-SHOW') e = 'NO SHOW';
  if (e === 'NO-AUDICIONADO') e = 'NO AUDICIONADO';
  if (e === 'EN-AUDICION' || e === 'AUDICION') e = 'EN AUDICION';
  if (e === 'PRE-COLA' || e === 'PRE COLA') e = 'PRECOLA';
  return e;
}

/**
 * Validates and applies a state change.
 * @returns {{ok:boolean, desde:string, hacia:string, mensaje:string}}
 */
function aplicarTransicion(estadoActual, estadoNuevo, opciones) {
  opciones = opciones || {};
  var desde = normalizarEstado(estadoActual || ESTADO.CONFIRMADO) || ESTADO.CONFIRMADO;
  var hacia = normalizarEstado(estadoNuevo);

  if (!estadoValido(desde)) {
    return { ok: false, desde: desde, hacia: hacia, mensaje: 'Estado actual desconocido: ' + estadoActual };
  }
  if (!estadoValido(hacia)) {
    return { ok: false, desde: desde, hacia: hacia, mensaje: 'Estado destino desconocido: ' + estadoNuevo };
  }
  if (desde === hacia) {
    return { ok: true, desde: desde, hacia: hacia, sin_cambio: true, mensaje: 'El participante ya estaba en ' + hacia + '.' };
  }
  if (TRANSICIONES[desde].indexOf(hacia) === -1) {
    // A supervisor can force it, but it is recorded as an incident, never silent.
    if (opciones.forzar) {
      return { ok: true, desde: desde, hacia: hacia, forzado: true,
               mensaje: 'Transicion forzada por supervisor: ' + desde + ' -> ' + hacia + '. Queda en INCIDENTES.' };
    }
    return { ok: false, desde: desde, hacia: hacia,
             mensaje: 'Transicion no permitida: ' + desde + ' -> ' + hacia + '.' };
  }
  return { ok: true, desde: desde, hacia: hacia, mensaje: '' };
}

/**
 * The 5-minute rule. Given the scheduled audition time and the real arrival
 * time, decides whether the participant keeps the slot or drops to contingency.
 *
 * Spec: "Hasta 5 min tarde: se intenta conservar el turno solo si no altera el
 * flujo. Mas de 5 min tarde: pierde su turno y pasa a CONTINGENCIA."
 * The "no altera el flujo" judgement stays with the coordinator, so this
 * function returns a recommendation plus the minutes, never a silent mutation.
 */
function evaluarPuntualidad(horaAudicion, horaLlegada, cfg) {
  var c = cfg || AGENDA_DEFECTO;
  var programada = horaAMinutos(horaAudicion);
  var real = horaAMinutos(horaLlegada);

  if (programada === null || real === null) {
    return { ok: false, mensaje: 'Hora invalida.', recomendacion: null, retraso: null };
  }

  var retraso = real - programada;

  if (retraso <= 0) {
    return { ok: true, retraso: retraso, puntual: true, recomendacion: ESTADO.CHECK_IN,
             mensaje: 'A tiempo.' };
  }
  if (retraso <= c.tolerancia_minutos) {
    return { ok: true, retraso: retraso, puntual: false, dentro_tolerancia: true,
             recomendacion: ESTADO.CHECK_IN,
             mensaje: 'Llego ' + retraso + ' min tarde (dentro de la tolerancia de ' +
                      c.tolerancia_minutos + ' min). Conserva el turno SOLO si no altera el flujo; ' +
                      'la decision es del coordinador.' };
  }
  return { ok: true, retraso: retraso, puntual: false, dentro_tolerancia: false,
           recomendacion: ESTADO.CONTINGENCIA,
           mensaje: 'Llego ' + retraso + ' min tarde (mas de ' + c.tolerancia_minutos +
                    '). Pierde el turno y pasa a CONTINGENCIA. Nunca se desplaza al puntual.' };
}

/**
 * Contingency is NOT an extra group: it is people from the 100 who lost their
 * slot. Capacity is whatever time is left, so this ranks the queue and marks
 * who realistically gets in.
 *
 * Order: first come, first served by the time they entered contingency, because
 * any other criterion would be arbitrary and unpublished.
 */
function planificarContingencia(cola, opciones) {
  opciones = opciones || {};
  var cfg = opciones.agenda || AGENDA_DEFECTO;
  var ahora = opciones.ahora_minutos !== undefined
    ? opciones.ahora_minutos
    : cfg.contingencia_inicio;
  var cierre = opciones.cierre_minutos !== undefined ? opciones.cierre_minutos : cfg.contingencia_fin;
  var minutosPorAudicion = opciones.minutos_por_audicion || 3;
  var margen = opciones.margen_minutos === undefined ? 1 : margenSeguro(opciones.margen_minutos);

  var disponibles = Math.max(0, cierre - ahora);
  var cupos = Math.floor(disponibles / (minutosPorAudicion + margen));

  var ordenada = cola.slice().sort(function (a, b) {
    var ta = String(a.contingencia_desde || a.check_in_time || '');
    var tb = String(b.contingencia_desde || b.check_in_time || '');
    if (ta === tb) return String(a.code) < String(b.code) ? -1 : 1;
    return ta < tb ? -1 : 1;
  });

  var entran = [];
  var fuera = [];
  for (var i = 0; i < ordenada.length; i++) {
    if (i < cupos) {
      var inicio = ahora + i * (minutosPorAudicion + margen);
      entran.push({
        code: ordenada[i].code,
        orden: i + 1,
        hora_estimada: minutosAHora(inicio),
        estado_sugerido: ESTADO.CHECK_IN
      });
    } else {
      fuera.push({
        code: ordenada[i].code,
        orden: i + 1,
        estado_sugerido: ESTADO.NO_AUDICIONADO,
        motivo: 'SIN_TIEMPO_DISPONIBLE'
      });
    }
  }

  return {
    cupos_disponibles: cupos,
    minutos_disponibles: disponibles,
    cierre: minutosAHora(cierre),
    entran: entran,
    fuera: fuera
  };
}

function margenSeguro(v) {
  var n = Number(v);
  return isFinite(n) && n >= 0 ? n : 1;
}

/**
 * Hard close (21:00 by default): nobody starts a new audition after this.
 * Everyone still pending becomes NO AUDICIONADO, which excludes them from the
 * selection - exactly as the spec requires. Someone already ON STAGE is left
 * alone to finish; the stage manager then marks the audition as done.
 */
function cerrarJornada(registros, opciones) {
  opciones = opciones || {};
  var ahora = opciones.ahora || new Date().toISOString();
  var responsable = opciones.responsable || 'sistema';
  var cambios = [];

  for (var i = 0; i < registros.length; i++) {
    var r = registros[i];
    if (!normalizarTexto(r.code)) continue;
    var estado = normalizarEstado(r.attendance_status || ESTADO.CONFIRMADO);
    if (estado === ESTADO.REALIZADA || estado === ESTADO.NO_AUDICIONADO || estado === ESTADO.EN_AUDICION) continue;

    cambios.push({
      code: r.code,
      desde: estado,
      hacia: ESTADO.NO_AUDICIONADO,
      motivo: 'CIERRE_JORNADA',
      at: ahora,
      by: responsable
    });
  }
  return { cambios: cambios, total: cambios.length };
}
