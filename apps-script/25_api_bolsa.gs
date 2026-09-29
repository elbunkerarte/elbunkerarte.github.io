/**
 * EL BUNKER - Pool of eligible projects, withdrawals, substitute offers, final confirmation
 * and the official list of the event.
 *
 * Rules (release QA, section 9):
 *  - 100 operative slots (B-001..B-100); eligible projects beyond them wait as substitutes
 *    (positions 101-200 of the pool), ordered only by submission time.
 *  - A withdrawal frees exactly that slot. It is offered to ONE substitute at a time; if they
 *    turn it down or do not answer in time, it goes to the next one. Nobody else moves.
 *  - The substitute inherits the slot (code + current schedule), never the previous holder's data.
 *    The previous holder keeps the number in `previous_code`; submission_id never changes.
 *  - Once the official list is consolidated, ordinary changes stop.
 *
 * Functions whose name ends in `Locked` expect the caller to hold the script lock.
 */

// ---------------------------------------------------------------------------
// Ledger helpers
// ---------------------------------------------------------------------------

function slotHistoryLocked(slotCode, event, submissionId, actor, detail) {
  agregarFila(HOJA.SLOTS_HISTORIAL, {
    at: isoWithOffset(), slot_code: slotCode, evento: event, submission_id: submissionId || '',
    actor: actor || 'sistema', detalle: String(detail || '').slice(0, 500)
  });
}

function pendingOffersBySubmission(offers) {
  var out = {};
  (offers || []).forEach(function (o) {
    if (normalizarComparable(o.estado) === OFFER_STATUS.PENDIENTE) out[o.submission_id] = o;
  });
  return out;
}

function offerExpired(offer, nowMs) {
  var t = new Date(offer.expires_at).getTime();
  return !isNaN(t) && t <= (nowMs || Date.now());
}

function currentWindows() {
  return operationWindows(new Date().toISOString(), operationCalendar());
}

/**
 * Writes priority_rank, pool_status and the derived participation_status of every project.
 * One batched write; only rows whose values changed are touched.
 */
function refreshPoolLocked(rows, offers) {
  rows = rows || leerHoja(HOJA.REGISTRO);
  offers = offers || leerHoja(HOJA.OFERTAS);
  var pool = computePool(rows, poolOptions());
  var bySubmission = {};
  pool.filas.forEach(function (p) { bySubmission[p.submission_id] = p; });
  var pending = pendingOffersBySubmission(offers);
  var updates = [];
  rows.forEach(function (r) {
    var p = bySubmission[r.submission_id];
    var rank = p ? p.priority_rank : '';
    var status = p ? p.pool_status : '';
    var participation = participationStatus(r, !!pending[r.submission_id]);
    if (String(r.priority_rank) !== String(rank) || normalizarComparable(r.pool_status) !== status ||
        normalizarComparable(r.participation_status) !== participation) {
      updates.push({ fila: r._fila, cambios: { priority_rank: rank, pool_status: status, participation_status: participation } });
    }
  });
  actualizarFilasEnLote(HOJA.REGISTRO, updates);
  return { principales: pool.principales, suplentes: pool.suplentes, fuera_de_bolsa: pool.fuera, actualizadas: updates.length };
}

// ---------------------------------------------------------------------------
// Releasing a slot and offering it
// ---------------------------------------------------------------------------

/**
 * Frees the slot held by `row`. `final` marks a withdrawal given at the final confirmation
 * (RETIRO_FINAL). Returns what happened to the slot: offered to a substitute or left vacant.
 */
function releaseSlotLocked(row, opts) {
  opts = opts || {};
  var code = normalizarComparable(row.code);
  if (!code) return { ok: false, error: 'Este proyecto no tiene un cupo asignado.' };
  if (isWithdrawn(row)) return { ok: false, error: 'Este proyecto ya se retiró.' };
  var now = isoWithOffset();
  var slot = {
    code: code,
    block: row.final_block || row.original_block || '',
    arrival: clockText(row.arrival_time) || '',
    time: clockText(row.final_time || row.original_time) || ''
  };
  actualizarFila(HOJA.REGISTRO, row._fila, {
    code: '',
    previous_code: [normalizarTexto(row.previous_code), code].filter(Boolean).join(','),
    withdrawal_status: opts.final ? WITHDRAWAL.RETIRO_FINAL : WITHDRAWAL.RETIRADO,
    withdrawn_at: now,
    withdrawn_by: opts.actor || 'participante',
    withdrawal_reason: String(opts.reason || '').slice(0, 400),
    final_confirmation: opts.final ? 'NO' : row.final_confirmation,
    final_confirmation_at: opts.final ? now : row.final_confirmation_at,
    pool_status: POOL_STATUS.RETIRADO,
    participation_status: opts.final ? PARTICIPATION.RETIRO_FINAL : PARTICIPATION.RETIRADO
  });
  slotHistoryLocked(code, opts.final ? 'RETIRO_FINAL' : 'LIBERADO', row.submission_id, opts.actor, opts.reason);
  registrar(opts.actor || 'participante', opts.rol || '', opts.final ? 'RETIRO_FINAL' : 'RETIRO', code, row.submission_id);
  enqueueEmail('RETIRO_CONFIRMADO', Object.assign({}, row, { code: '', previous_code: code }), 'retiro',
               { slot_code: code }, 'RETIRO_CONFIRMADO:' + row.submission_id + ':' + code);

  var outcome = currentWindows().reemplazo_viable
    ? offerSlotLocked(slot, opts.actor || 'sistema')
    : closeSlotVacantLocked(slot, opts.actor || 'sistema', 'Liberado después del límite para reemplazos.');
  return { ok: true, slot_code: code, reemplazo: outcome };
}

/** Offers a free slot to the next substitute in priority order, or leaves it vacant if none is left. */
function offerSlotLocked(slot, actor) {
  var rows = leerHoja(HOJA.REGISTRO);
  var offers = leerHoja(HOJA.OFERTAS);
  var state = slotStatuses(rows, offers, poolOptions()).filter(function (s) { return s.slot_code === slot.code; })[0];
  if (state && (state.status === SLOT_STATUS.ASIGNADO || state.status === SLOT_STATUS.OFRECIDO)) {
    return { estado: state.status, mensaje: 'El cupo ' + slot.code + ' ya está ' + state.status.toLowerCase() + '.' };
  }
  var nowIso = isoWithOffset();
  var expires = offerExpiry(new Date().toISOString(), cfgNumero('suplente_horas_respuesta', 24), cfg('reemplazo_limite', ''));
  if (new Date(expires).getTime() - Date.now() < 3600000) {
    return closeSlotVacantLocked(slot, actor, 'No queda tiempo suficiente para que un suplente responda.');
  }
  var next = nextSubstitute(rows, offers, poolOptions());
  if (!next) return closeSlotVacantLocked(slot, actor, 'No hay suplentes disponibles en la bolsa.');

  var id = nuevoId('OF');
  var expiresLocal = isoWithOffset(new Date(expires));
  agregarFila(HOJA.OFERTAS, {
    oferta_id: id, slot_code: slot.code, slot_block: slot.block, slot_arrival: slot.arrival, slot_time: slot.time,
    submission_id: next.submission_id, priority_rank: next.priority_rank, estado: OFFER_STATUS.PENDIENTE,
    created_at: nowIso, expires_at: expiresLocal, responded_at: '', actor: '', released_by: actor || 'sistema', notas: ''
  });
  slotHistoryLocked(slot.code, 'OFRECIDO', next.submission_id, actor, 'oferta ' + id + ' vence ' + expiresLocal);
  enqueueEmail('OFERTA_SUPLENTE', next, 'oferta',
               { slot_code: slot.code, slot_block: slot.block, slot_arrival: slot.arrival, slot_time: slot.time,
                 vence_texto: humanDateTime(expiresLocal) },
               'OFERTA_SUPLENTE:' + id);
  refreshPoolLocked();
  return { estado: SLOT_STATUS.OFRECIDO, oferta_id: id, submission_id: next.submission_id,
           priority_rank: next.priority_rank, vence: expiresLocal };
}

function closeSlotVacantLocked(slot, actor, reason) {
  agregarFila(HOJA.OFERTAS, {
    oferta_id: nuevoId('OF'), slot_code: slot.code, slot_block: slot.block, slot_arrival: slot.arrival, slot_time: slot.time,
    submission_id: '', priority_rank: '', estado: OFFER_STATUS.VACANTE, created_at: isoWithOffset(), expires_at: '',
    responded_at: '', actor: actor || 'sistema', released_by: actor || 'sistema', notas: String(reason || '').slice(0, 400)
  });
  slotHistoryLocked(slot.code, 'VACANTE_SIN_REEMPLAZO', '', actor, reason);
  refreshPoolLocked();
  return { estado: SLOT_STATUS.VACANTE_SIN_REEMPLAZO, mensaje: reason };
}

/** Marks a pending offer as turned down / expired, and passes the slot to the next substitute. */
function closeOfferLocked(offer, status, actor) {
  actualizarFila(HOJA.OFERTAS, offer._fila, { estado: status, responded_at: isoWithOffset(), actor: actor || 'sistema' });
  var holder = leerHoja(HOJA.REGISTRO).filter(function (r) { return r.submission_id === offer.submission_id; })[0];
  if (holder && !normalizarTexto(holder.code)) {
    actualizarFila(HOJA.REGISTRO, holder._fila, { pool_status: POOL_STATUS.DECLINO });
  }
  slotHistoryLocked(offer.slot_code, status === OFFER_STATUS.VENCIDA ? 'OFERTA_VENCIDA' : 'OFERTA_RECHAZADA',
                    offer.submission_id, actor, offer.oferta_id);
  var slot = { code: offer.slot_code, block: offer.slot_block, arrival: clockText(offer.slot_arrival) || offer.slot_arrival,
               time: clockText(offer.slot_time) || offer.slot_time };
  return currentWindows().reemplazo_viable
    ? offerSlotLocked(slot, 'sistema')
    : closeSlotVacantLocked(slot, 'sistema', 'Oferta cerrada después del límite para reemplazos.');
}

/** Expires every pending offer whose time ran out. Safe to call anywhere; used by the trigger. */
function expireOffersLocked() {
  var now = Date.now();
  var expired = leerHoja(HOJA.OFERTAS).filter(function (o) {
    return normalizarComparable(o.estado) === OFFER_STATUS.PENDIENTE && offerExpired(o, now);
  });
  var results = expired.map(function (o) {
    return { oferta_id: o.oferta_id, slot_code: o.slot_code, siguiente: closeOfferLocked(o, OFFER_STATUS.VENCIDA, 'sistema') };
  });
  return { vencidas: results.length, detalle: results };
}

/** Hourly trigger. */
function vencerOfertas() {
  try {
    var r = conBloqueo(function () { return expireOffersLocked(); });
    if (r.vencidas) registrar('sistema', '', 'OFERTAS_VENCIDAS', '', JSON.stringify(r.detalle).slice(0, 900));
    return r;
  } catch (e) {
    registrar('sistema', '', 'OFERTAS_VENCIDAS_FALLO', '', e.message);
    return { error: e.message };
  }
}

// ---------------------------------------------------------------------------
// Participant side (identity: ID number + code or receipt, like "Mi inscripción")
// ---------------------------------------------------------------------------

var WITHDRAW_CONFIRMATION = 'LIBERAR MI CUPO';

/** "NO PUEDO ASISTIR — SOLICITAR REEMPLAZO". Needs the second confirmation typed by the person. */
function accionRetirarme(datos) {
  datos = datos || {};
  var blocked = guardSubmission(datos, 'cambio');
  if (blocked) return blocked;
  var row = findOwnProject(datos);
  if (!row) return { ok: false, error: 'No encontramos una inscripción con esos datos.' };
  var w = currentWindows();
  if (w.lista_bloqueada) return { ok: false, error: 'La lista oficial del evento ya está cerrada. Escríbenos por WhatsApp.' };
  if (!w.retiro_abierto) return { ok: false, error: 'Esta opción se habilita el ' + deadlineText(cfg('reemplazos_desde', '')) + '.' };
  if (!normalizarTexto(row.code)) return { ok: false, error: 'Tu inscripción no tiene un cupo asignado que liberar.' };
  if (normalizarComparable(datos.confirmacion) !== WITHDRAW_CONFIRMATION) {
    return { ok: false, motivo: 'CONFIRMACION', error: 'Para liberar tu cupo confirma escribiendo: ' + WITHDRAW_CONFIRMATION };
  }
  var final = w.confirmacion_abierta;
  var key = 'retiro:' + row.submission_id;
  return exactlyOnce(key, function () {
    var fresh = leerHoja(HOJA.REGISTRO).filter(function (r) { return r.submission_id === row.submission_id; })[0];
    var released = releaseSlotLocked(fresh, { actor: 'participante', reason: datos.motivo || 'No puede asistir', final: final });
    if (!released.ok) return released;
    return {
      retirado: true, slot_code: released.slot_code,
      mensaje: 'Liberaste el cupo ' + released.slot_code + '. Gracias por avisar: lo recibirá la siguiente persona de la lista de suplentes. ' +
               'Esta decisión no se puede deshacer.'
    };
  });
}

/** CONFIRMACIÓN FINAL DE ASISTENCIA: SI keeps everything as is; NO frees the slot (RETIRO_FINAL). */
function accionConfirmacionFinal(datos) {
  datos = datos || {};
  var blocked = guardSubmission(datos, 'cambio');
  if (blocked) return blocked;
  var row = findOwnProject(datos);
  if (!row) return { ok: false, error: 'No encontramos una inscripción con esos datos.' };
  var w = currentWindows();
  if (w.lista_bloqueada) return { ok: false, error: 'La lista oficial del evento ya está cerrada.' };
  if (!w.confirmacion_abierta) {
    return { ok: false, error: 'La confirmación final está abierta del ' + deadlineText(cfg('confirmacion_final_desde', '')) +
                               ' al ' + deadlineText(cfg('confirmacion_final_hasta', '')) + '.' };
  }
  if (!normalizarTexto(row.code)) return { ok: false, error: 'Tu inscripción no tiene un cupo asignado.' };
  var answer = normalizarComparable(datos.respuesta);
  if (answer !== 'SI' && answer !== 'NO') return { ok: false, error: 'Respuesta inválida.' };
  if (answer === 'NO' && normalizarComparable(datos.confirmacion) !== WITHDRAW_CONFIRMATION) {
    return { ok: false, motivo: 'CONFIRMACION', error: 'Para liberar tu cupo confirma escribiendo: ' + WITHDRAW_CONFIRMATION };
  }
  return exactlyOnce('confirmacion-final:' + row.submission_id + ':' + answer, function () {
    var fresh = leerHoja(HOJA.REGISTRO).filter(function (r) { return r.submission_id === row.submission_id; })[0];
    if (!normalizarTexto(fresh.code)) return { ok: false, error: 'Tu inscripción ya no tiene un cupo asignado.' };
    if (answer === 'SI') {
      actualizarFila(HOJA.REGISTRO, fresh._fila, { final_confirmation: 'SI', final_confirmation_at: isoWithOffset() });
      registrar('participante', '', 'CONFIRMACION_FINAL_SI', fresh.code, '');
      refreshPoolLocked();
      return { confirmado: true, mensaje: '¡Confirmado! Te esperamos. Tu código y tu horario no cambian.' };
    }
    var released = releaseSlotLocked(fresh, { actor: 'participante', reason: 'Confirmación final: no podrá asistir', final: true });
    if (!released.ok) return released;
    return { confirmado: false, slot_code: released.slot_code,
             mensaje: 'Registramos que no podrás asistir y liberamos el cupo ' + released.slot_code + '. Gracias por avisar.' };
  });
}

/** A substitute accepts or turns down the slot offered to them. */
function accionResponderOferta(datos) {
  datos = datos || {};
  var blocked = guardSubmission(datos, 'cambio');
  if (blocked) return blocked;
  var row = findOwnProject(datos);
  if (!row) return { ok: false, error: 'No encontramos una inscripción con esos datos.' };
  var answer = normalizarComparable(datos.respuesta);
  if (answer !== 'ACEPTAR' && answer !== 'RECHAZAR') return { ok: false, error: 'Respuesta inválida.' };
  return exactlyOnce('oferta:' + datos.oferta_id + ':' + answer, function () {
    var offer = leerHoja(HOJA.OFERTAS).filter(function (o) { return o.oferta_id === datos.oferta_id; })[0];
    if (!offer || offer.submission_id !== row.submission_id) return { ok: false, error: 'No encontramos esa oferta para tu inscripción.' };
    if (normalizarComparable(offer.estado) !== OFFER_STATUS.PENDIENTE) return { ok: false, error: 'Esta oferta ya no está vigente (' + offer.estado + ').' };
    if (offerExpired(offer)) {
      closeOfferLocked(offer, OFFER_STATUS.VENCIDA, 'sistema');
      return { ok: false, error: 'El plazo para responder esta oferta ya venció.' };
    }
    if (answer === 'RECHAZAR') {
      closeOfferLocked(offer, OFFER_STATUS.RECHAZADA, 'participante');
      registrar('participante', '', 'OFERTA_RECHAZADA', offer.slot_code, row.submission_id);
      return { aceptada: false, mensaje: 'Registramos tu respuesta. El cupo pasa a la siguiente persona de la lista.' };
    }
    return acceptOfferLocked(offer, row.submission_id, 'participante');
  });
}

function acceptOfferLocked(offer, submissionId, actor) {
  if (currentWindows().lista_bloqueada) return { ok: false, error: 'La lista oficial del evento ya está cerrada.' };
  var rows = leerHoja(HOJA.REGISTRO);
  var holder = rows.filter(function (r) { return normalizarComparable(r.code) === normalizarComparable(offer.slot_code); })[0];
  if (holder) return { ok: false, error: 'Ese cupo ya tiene titular.' };
  var fresh = rows.filter(function (r) { return r.submission_id === submissionId; })[0];
  if (!fresh || normalizarTexto(fresh.code) || isWithdrawn(fresh)) return { ok: false, error: 'Tu inscripción no puede recibir este cupo.' };
  var now = isoWithOffset();
  var time = clockText(offer.slot_time) || offer.slot_time;
  actualizarFila(HOJA.REGISTRO, fresh._fila, {
    code: offer.slot_code, issued_at: now, issued_by: 'reemplazo:' + offer.oferta_id,
    original_block: offer.slot_block, original_time: time, final_block: offer.slot_block, final_time: time,
    arrival_time: clockText(offer.slot_arrival) || offer.slot_arrival,
    attendance_status: ESTADO.CONFIRMADO, change_status: ESTADO_CAMBIO.SIN_SOLICITUD, change_requested: '',
    final_confirmation: '', final_confirmation_at: '', pool_status: POOL_STATUS.PRINCIPAL
  });
  actualizarFila(HOJA.OFERTAS, offer._fila, { estado: OFFER_STATUS.ACEPTADA, responded_at: now, actor: actor });
  slotHistoryLocked(offer.slot_code, 'ASIGNADO', submissionId, actor, 'oferta ' + offer.oferta_id + ' aceptada');
  registrar(actor, '', 'OFERTA_ACEPTADA', offer.slot_code, submissionId);
  refreshPoolLocked();
  var updated = leerHoja(HOJA.REGISTRO).filter(function (r) { return r.submission_id === submissionId; })[0];
  enqueueEmail('ASIGNACION', updated, 'reemplazo', {}, 'ASIGNACION:' + submissionId + ':' + offer.slot_code);
  return { aceptada: true, code: offer.slot_code,
           mensaje: '¡Listo! El cupo ' + offer.slot_code + ' es tuyo. Te enviamos tu código y horario por correo.' };
}

// ---------------------------------------------------------------------------
// Staff side
// ---------------------------------------------------------------------------

/** Pool, slots and offers in one view for the logistics panel. */
function accionBolsa(datos) {
  var rows = leerHoja(HOJA.REGISTRO);
  var offers = leerHoja(HOJA.OFERTAS);
  var options = poolOptions();
  var pool = computePool(rows, options);
  var bySubmission = {};
  rows.forEach(function (r) { bySubmission[r.submission_id] = r; });
  var pending = pendingOffersBySubmission(offers);
  var list = pool.filas.filter(function (p) { return p.pool_status !== POOL_STATUS.RETIRADO; })
    .sort(function (a, b) { return (Number(a.priority_rank) || 9999) - (Number(b.priority_rank) || 9999); })
    .map(function (p) {
      var r = bySubmission[p.submission_id] || {};
      return {
        priority_rank: p.priority_rank, pool_status: p.pool_status, submission_id: p.submission_id, code: r.code || '',
        artistic_name: r.artistic_name || '', participation_mode: r.participation_mode || 'SOLISTA',
        created_at: String(r.created_at || '').replace('T', ' ').slice(0, 16),
        oferta: pending[p.submission_id] ? pending[p.submission_id].slot_code : ''
      };
    });
  var slots = slotStatuses(rows, offers, options).map(function (s) {
    var r = s.holder_submission_id ? bySubmission[s.holder_submission_id] : null;
    var o = s.offered_to ? bySubmission[s.offered_to] : null;
    return Object.assign({}, s, { holder: r ? r.artistic_name : '', offered_name: o ? o.artistic_name : '' });
  });
  var counts = {};
  slots.forEach(function (s) { counts[s.status] = (counts[s.status] || 0) + 1; });
  return {
    ventanas: currentWindows(),
    resumen: { principales: pool.principales, suplentes: pool.suplentes, fuera_de_bolsa: pool.fuera, cupos: counts },
    bolsa: list,
    cupos: slots,
    ofertas: offers.slice(-300).reverse().map(function (o) {
      var r = bySubmission[o.submission_id] || {};
      return Object.assign({}, o, { artistic_name: r.artistic_name || '', vence: humanDateTime(o.expires_at),
                                    creada: humanDateTime(o.created_at) });
    }),
    lista_oficial: { bloqueada: cfgBool('lista_oficial_bloqueada', false), version: cfg('lista_oficial_version', ''),
                     at: cfg('lista_oficial_at', ''), by: cfg('lista_oficial_by', '') }
  };
}

/** Logistics withdraws a project (e.g. the person called or wrote). Frees exactly that slot. */
function accionRetirarParticipante(datos, sesion) {
  var reason = normalizarTexto(datos.motivo);
  if (reason.length < 5) return { ok: false, error: 'Escribe el motivo del retiro: queda en la bitácora.' };
  if (currentWindows().lista_bloqueada) return { ok: false, error: 'La lista oficial ya está consolidada.' };
  return conBloqueo(function () {
    var row = buscarPorCodigo(datos.code);
    if (!row) return { ok: false, error: 'Código no encontrado.' };
    var released = releaseSlotLocked(row, { actor: sesion.alias, rol: sesion.rol, reason: reason, final: esVerdadero(datos.final) });
    if (!released.ok) return released;
    return { slot_code: released.slot_code, reemplazo: released.reemplazo,
             mensaje: 'Cupo ' + released.slot_code + ' liberado. ' + (released.reemplazo.estado === SLOT_STATUS.OFRECIDO
               ? 'Se ofreció al suplente con prioridad ' + released.reemplazo.priority_rank + '.'
               : 'Quedó como vacante: ' + (released.reemplazo.mensaje || '')) };
  });
}

/** Offers a freed (LIBERADO or VACANTE) slot again, e.g. when new substitutes became eligible. */
function accionOfrecerCupo(datos, sesion) {
  if (currentWindows().lista_bloqueada) return { ok: false, error: 'La lista oficial ya está consolidada.' };
  return conBloqueo(function () {
    expireOffersLocked();
    var code = normalizarComparable(datos.slot_code);
    var rows = leerHoja(HOJA.REGISTRO);
    var offers = leerHoja(HOJA.OFERTAS);
    var state = slotStatuses(rows, offers, poolOptions()).filter(function (s) { return s.slot_code === code; })[0];
    if (!state) return { ok: false, error: 'Cupo inválido.' };
    if (state.status !== SLOT_STATUS.LIBERADO && state.status !== SLOT_STATUS.VACANTE_SIN_REEMPLAZO) {
      return { ok: false, error: 'Solo se ofrece un cupo liberado o vacante (este está ' + state.status + ').' };
    }
    var last = offers.filter(function (o) { return normalizarComparable(o.slot_code) === code; }).pop();
    var prev = rows.filter(function (r) { return String(r.previous_code || '').split(',').indexOf(code) !== -1; })[0];
    var slot = last
      ? { code: code, block: last.slot_block, arrival: clockText(last.slot_arrival) || last.slot_arrival, time: clockText(last.slot_time) || last.slot_time }
      : { code: code, block: prev ? (prev.final_block || prev.original_block) : '', arrival: prev ? clockText(prev.arrival_time) : '',
          time: prev ? clockText(prev.final_time || prev.original_time) : '' };
    registrar(sesion.alias, sesion.rol, 'OFRECER_CUPO', code, '');
    return { resultado: offerSlotLocked(slot, sesion.alias) };
  });
}

/** Closes a slot without replacement (cancels its pending offer, if any). */
function accionCerrarVacante(datos, sesion) {
  var reason = normalizarTexto(datos.motivo);
  if (reason.length < 5) return { ok: false, error: 'Escribe el motivo.' };
  return conBloqueo(function () {
    var code = normalizarComparable(datos.slot_code);
    var offers = leerHoja(HOJA.OFERTAS);
    if (buscarPorCodigo(code)) return { ok: false, error: 'Ese cupo tiene titular: primero hay que retirarlo.' };
    var pending = offers.filter(function (o) {
      return normalizarComparable(o.slot_code) === code && normalizarComparable(o.estado) === OFFER_STATUS.PENDIENTE;
    })[0];
    if (pending) actualizarFila(HOJA.OFERTAS, pending._fila, { estado: OFFER_STATUS.CANCELADA, responded_at: isoWithOffset(), actor: sesion.alias });
    var last = offers.filter(function (o) { return normalizarComparable(o.slot_code) === code; }).pop() || {};
    registrar(sesion.alias, sesion.rol, 'CERRAR_VACANTE', code, reason);
    return closeSlotVacantLocked({ code: code, block: last.slot_block || '', arrival: last.slot_arrival || '', time: last.slot_time || '' },
                                 sesion.alias, reason);
  });
}

/** Recomputes the pool order (after eligibility decisions) and expires overdue offers. */
function accionRefrescarBolsa(datos, sesion) {
  return conBloqueo(function () {
    var expired = expireOffersLocked();
    var pool = refreshPoolLocked();
    registrar(sesion.alias, sesion.rol, 'REFRESCAR_BOLSA', '', JSON.stringify(pool));
    return { bolsa: pool, ofertas_vencidas: expired.vencidas };
  });
}

// ---------------------------------------------------------------------------
// CONSOLIDAR LISTA OFICIAL DEL EVENTO
// ---------------------------------------------------------------------------

var ROSTER_COLUMNS = ['slot_code', 'estado_cupo', 'final_block', 'arrival_time', 'final_time', 'submission_id', 'artistic_name',
                      'full_name', 'participation_mode', 'members_declared', 'final_confirmation', 'participation_status',
                      'reemplazo', 'track_status', 'observacion'];

/** Reconciliation of everything the official list depends on. Pure over the given rows. */
function rosterReconciliation(rows, offers, changes, cupo) {
  var slots = slotStatuses(rows, offers, { cupo: cupo });
  var bySubmission = {};
  rows.forEach(function (r) { bySubmission[r.submission_id] = r; });
  var holdersByCode = {};
  var duplicateCodes = [];
  rows.forEach(function (r) {
    var c = normalizarComparable(r.code);
    if (!c) return;
    if (holdersByCode[c]) duplicateCodes.push(c);
    holdersByCode[c] = true;
  });
  var roster = slots.map(function (s) {
    var r = s.holder_submission_id ? bySubmission[s.holder_submission_id] : null;
    var status = r ? participationStatus(r, false) : '';
    return {
      slot_code: s.slot_code, estado_cupo: s.status,
      final_block: r ? (r.final_block || r.original_block) : '', arrival_time: r ? clockText(r.arrival_time) : '',
      final_time: r ? clockText(r.final_time || r.original_time) : '', submission_id: r ? r.submission_id : '',
      artistic_name: r ? r.artistic_name : '', full_name: r ? r.full_name : '',
      participation_mode: r ? (r.participation_mode || 'SOLISTA') : '', members_declared: r ? r.members_declared : '',
      final_confirmation: r ? (normalizarComparable(r.final_confirmation) || 'SIN RESPUESTA') : '',
      participation_status: status,
      reemplazo: r && /^reemplazo:/.test(String(r.issued_by || '')) ? 'SI' : '',
      track_status: r ? r.track_status : '', observacion: ''
    };
  });
  var count = function (pred) { return roster.filter(pred).length; };
  return {
    roster: roster,
    conteos: {
      cupos: cupo,
      con_titular: count(function (x) { return x.estado_cupo === SLOT_STATUS.ASIGNADO; }),
      confirmados: count(function (x) { return x.final_confirmation === 'SI'; }),
      sin_respuesta: count(function (x) { return x.estado_cupo === SLOT_STATUS.ASIGNADO && x.final_confirmation === 'SIN RESPUESTA'; }),
      reemplazos: count(function (x) { return x.reemplazo === 'SI'; }),
      vacantes: count(function (x) { return x.estado_cupo === SLOT_STATUS.VACANTE_SIN_REEMPLAZO; }),
      liberados_sin_cerrar: count(function (x) { return x.estado_cupo === SLOT_STATUS.LIBERADO; }),
      ofertas_pendientes: count(function (x) { return x.estado_cupo === SLOT_STATUS.OFRECIDO; }),
      sin_emitir: count(function (x) { return x.estado_cupo === SLOT_STATUS.SIN_EMITIR; }),
      retirados: rows.filter(isWithdrawn).length,
      suplentes: rows.filter(function (r) { return normalizarComparable(r.pool_status) === POOL_STATUS.SUPLENTE; }).length,
      cambios_pendientes: (changes || []).filter(function (c) { return normalizarComparable(c.estado) === 'PENDIENTE'; }).length
    },
    codigos_duplicados: duplicateCodes
  };
}

/** Preview: what the official list would look like now. */
function accionVistaPreviaLista() {
  var r = rosterReconciliation(leerHoja(HOJA.REGISTRO), leerHoja(HOJA.OFERTAS), leerHoja(HOJA.CAMBIOS), cfgNumero('cupo_total', 100));
  return { conteos: r.conteos, codigos_duplicados: r.codigos_duplicados, bloqueada: cfgBool('lista_oficial_bloqueada', false),
           roster: r.roster.filter(function (x) { return x.estado_cupo !== SLOT_STATUS.SIN_EMITIR; }) };
}

/**
 * Consolidates the official list: reconciles, cancels open offers (their slots become vacant),
 * writes the ROSTER_FINAL snapshot sheet + a JSON copy, and locks ordinary changes.
 * Never deletes or resets anything.
 */
function accionConsolidarLista(datos, sesion) {
  if (normalizarComparable(datos.confirmacion) !== 'CONSOLIDAR') {
    return { ok: false, error: 'Para consolidar escribe CONSOLIDAR. Después no habrá cambios ordinarios.' };
  }
  return conBloqueo(function () {
    if (cfgBool('lista_oficial_bloqueada', false)) {
      return { ok: false, error: 'La lista ya está consolidada (' + cfg('lista_oficial_version', '') + ').' };
    }
    // Every refusal happens before anything changes: a refused consolidation leaves offers and slots as they were.
    var changes = leerHoja(HOJA.CAMBIOS);
    var check = rosterReconciliation(leerHoja(HOJA.REGISTRO), leerHoja(HOJA.OFERTAS), changes, cfgNumero('cupo_total', 100));
    if (check.codigos_duplicados.length) {
      return { ok: false, error: 'Hay códigos con dos titulares: ' + check.codigos_duplicados.join(', ') + '. Corrige antes de consolidar.' };
    }
    var pendingChanges = changes.filter(function (c) { return normalizarComparable(c.estado) === 'PENDIENTE'; })
      .map(function (c) { return c.code; });
    if (pendingChanges.length) {
      // After the lock a change request can no longer be resolved, so it must be decided first.
      return { ok: false, error: 'Resuelve primero las solicitudes de cambio de horario pendientes (' + pendingChanges.join(', ') +
               '): después de consolidar ya no se pueden aprobar ni rechazar.' };
    }

    expireOffersLocked();
    leerHoja(HOJA.OFERTAS).filter(function (o) { return normalizarComparable(o.estado) === OFFER_STATUS.PENDIENTE; })
      .forEach(function (o) {
        actualizarFila(HOJA.OFERTAS, o._fila, { estado: OFFER_STATUS.CANCELADA, responded_at: isoWithOffset(), actor: sesion.alias });
        closeSlotVacantLocked({ code: o.slot_code, block: o.slot_block, arrival: o.slot_arrival, time: o.slot_time },
                              sesion.alias, 'Oferta abierta al consolidar la lista oficial.');
      });

    var rows = leerHoja(HOJA.REGISTRO);
    var rec = rosterReconciliation(rows, leerHoja(HOJA.OFERTAS), changes, cfgNumero('cupo_total', 100));

    var book = libro();
    var base = cfg('lista_oficial_nombre', 'ROSTER_FINAL_2026-10-22');
    var name = base;
    for (var v = 2; book.getSheetByName(name); v++) name = base + ' v' + v;
    var sheet = book.insertSheet(name);
    var matrix = [ROSTER_COLUMNS].concat(rec.roster.map(function (x) {
      return ROSTER_COLUMNS.map(function (c) { return cellValue(x[c]); });
    }));
    sheet.getRange(1, 1, matrix.length, ROSTER_COLUMNS.length).setNumberFormat('@').setValues(matrix);
    sheet.getRange(1, 1, 1, ROSTER_COLUMNS.length).setFontWeight('bold').setBackground('#1D1D1B').setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
    sheet.protect().setDescription('Foto de la lista oficial consolidada. No se edita.').setWarningOnly(true);

    var at = isoWithOffset();
    var json = carpetaBackups().createFile(Utilities.newBlob(JSON.stringify({
      lista: name, consolidada_at: at, por: sesion.alias, version_sistema: VERSION_SISTEMA, entorno: environmentName(),
      conteos: rec.conteos, roster: rec.roster
    }, null, 1), 'application/json', name + '.json'));

    setConfigValue('lista_oficial_bloqueada', 'SI');
    setConfigValue('lista_oficial_version', name);
    setConfigValue('lista_oficial_at', at);
    setConfigValue('lista_oficial_by', sesion.alias);
    refreshPoolLocked();
    registrar(sesion.alias, sesion.rol, 'CONSOLIDAR_LISTA', name, JSON.stringify(rec.conteos));
    return { lista: name, conteos: rec.conteos, respaldo_json: json.getName(),
             mensaje: 'Lista oficial consolidada como ' + name + '. Desde ahora no hay cambios ordinarios.' };
  });
}

/** Admin only, for a real emergency: reopens ordinary changes. A later consolidation creates a new version. */
function accionDesbloquearLista(datos, sesion) {
  var reason = normalizarTexto(datos.motivo);
  if (reason.length < 10) return { ok: false, error: 'Escribe el motivo (queda en la bitácora).' };
  if (!cfgBool('lista_oficial_bloqueada', false)) return { ok: false, error: 'La lista no está bloqueada.' };
  setConfigValue('lista_oficial_bloqueada', 'NO');
  registrar(sesion.alias, sesion.rol, 'DESBLOQUEAR_LISTA', cfg('lista_oficial_version', ''), reason);
  return { mensaje: 'Lista desbloqueada. Al terminar la corrección, vuelve a consolidar (se creará una nueva versión).' };
}
