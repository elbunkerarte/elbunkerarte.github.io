/**
 * EL BUNKER - Core: definitive code assignment (B-001 .. B-100).
 * PURE FUNCTIONS ONLY.
 */

var PREFIJO_CODIGO = 'B-';
var CUPO_MAXIMO = 100;

/** B-1 -> "B-001". Padding is fixed at 3 so codes sort lexicographically. */
function formatearCodigo(numero, prefijo) {
  var p = prefijo || PREFIJO_CODIGO;
  var n = String(numero);
  while (n.length < 3) n = '0' + n;
  return p + n;
}

function numeroDeCodigo(codigo) {
  var m = String(codigo || '').match(/(\d+)\s*$/);
  return m ? parseInt(m[1], 10) : null;
}

function esCodigoValido(codigo, cupo) {
  var n = numeroDeCodigo(codigo);
  var max = cupo || CUPO_MAXIMO;
  if (n === null) return false;
  if (!new RegExp('^' + PREFIJO_CODIGO + '\\d{3}$').test(String(codigo).toUpperCase())) return false;
  return n >= 1 && n <= max;
}

/**
 * Assigns definitive codes over the whole registry.
 *
 * Invariants enforced here (each one is covered by a test):
 *  1. Only APTO + non-duplicate rows receive a code.
 *  2. Order is submission order (created_at, tie-broken by submission_id) so the
 *     assignment is deterministic and reproducible from a backup.
 *  3. A row that ALREADY has a code keeps it - codes are never renumbered.
 *     A number that was ever issued (and later freed by a withdrawal) is NOT handed out
 *     here: a freed slot only changes hands through a substitute offer, with history.
 *  4. At most `cupo` codes exist. Overflow rows become substitutes (computePool), never get a code here.
 *  5. The function is idempotent: running it twice changes nothing.
 *
 * @returns {{asignados:Array, sin_cupo:Array, ya_tenian:number, siguiente:number}}
 */
function asignarCodigos(registros, opciones) {
  opciones = opciones || {};
  var cupo = opciones.cupo || CUPO_MAXIMO;
  var ahora = opciones.ahora || new Date().toISOString();
  var responsable = opciones.responsable || 'sistema';

  // --- 1. Collect codes already issued; they are immovable. ------------------
  var ocupados = {};
  var maximoUsado = 0;
  var yaTenian = 0;

  for (var i = 0; i < registros.length; i++) {
    var code = normalizarTexto(registros[i].code);
    if (!code) continue;
    var n = numeroDeCodigo(code);
    if (n === null) continue;
    ocupados[n] = true;
    yaTenian++;
    if (n > maximoUsado) maximoUsado = n;
  }
  var everIssued = issuedSlotNumbers(registros);
  Object.keys(everIssued).forEach(function (k) { ocupados[k] = true; });

  // --- 2. Candidates, in submission order. ----------------------------------
  var candidatos = registros.filter(function (r) {
    if (normalizarTexto(r.code)) return false;                       // already has one
    if (r.duplicate_flag === true || normalizarComparable(r.duplicate_flag) === 'TRUE') return false;
    if (isWithdrawn(r) || normalizarComparable(r.pool_status) === POOL_STATUS.DECLINO) return false;
    return normalizarComparable(r.eligibility_status) === ESTADO_ELEGIBILIDAD.APTO;
  });

  candidatos.sort(function (a, b) {
    var ta = String(a.created_at || '');
    var tb = String(b.created_at || '');
    if (ta < tb) return -1;
    if (ta > tb) return 1;
    return String(a.submission_id || '') < String(b.submission_id || '') ? -1 : 1;
  });

  // --- 3. Hand out the next free number. ------------------------------------
  var asignados = [];
  var sinCupo = [];
  var siguiente = 1;

  for (var c = 0; c < candidatos.length; c++) {
    while (siguiente <= cupo && ocupados[siguiente]) siguiente++;

    if (siguiente > cupo) {
      sinCupo.push({ submission_id: candidatos[c].submission_id, motivo: 'CUPO_LLENO' });
      continue;
    }

    var codigo = formatearCodigo(siguiente);
    ocupados[siguiente] = true;
    asignados.push({
      submission_id: candidatos[c].submission_id,
      code: codigo,
      numero: siguiente,
      issued_at: ahora,
      issued_by: responsable
    });
    siguiente++;
  }

  return {
    asignados: asignados,
    sin_cupo: sinCupo,
    ya_tenian: yaTenian,
    siguiente: Math.min(siguiente, cupo + 1),
    cupo: cupo,
    total_con_codigo: yaTenian + asignados.length
  };
}

// ---------------------------------------------------------------------------
// Pool of eligible projects: 100 principal slots + substitutes up to 200
// ---------------------------------------------------------------------------

var POOL_SIZE = 200;

var POOL_STATUS = {
  PRINCIPAL: 'PRINCIPAL',           // holds a slot code B-001..B-100
  SUPLENTE: 'SUPLENTE',             // eligible, inside the pool, no slot yet
  FUERA_DE_BOLSA: 'FUERA_DE_BOLSA', // eligible but past position 200
  DECLINO: 'DECLINO',               // a substitute who turned down (or let expire) an offer
  RETIRADO: 'RETIRADO'              // withdrew; keeps its history, never offered again
};

var WITHDRAWAL = { RETIRADO: 'RETIRADO', RETIRO_FINAL: 'RETIRO_FINAL' };

var OFFER_STATUS = {
  PENDIENTE: 'PENDIENTE',
  ACEPTADA: 'ACEPTADA',
  RECHAZADA: 'RECHAZADA',
  VENCIDA: 'VENCIDA',
  CANCELADA: 'CANCELADA',
  VACANTE: 'VACANTE_SIN_REEMPLAZO'   // the slot was closed without a substitute
};

var SLOT_STATUS = {
  ASIGNADO: 'ASIGNADO',
  OFRECIDO: 'OFRECIDO',
  LIBERADO: 'LIBERADO',
  VACANTE_SIN_REEMPLAZO: 'VACANTE_SIN_REEMPLAZO',
  SIN_EMITIR: 'SIN_EMITIR'
};

function byCreatedAt(a, b) {
  var ta = String(a.created_at || '');
  var tb = String(b.created_at || '');
  if (ta < tb) return -1;
  if (ta > tb) return 1;
  return String(a.submission_id || '') < String(b.submission_id || '') ? -1 : 1;
}

function isWithdrawn(r) {
  return !!normalizarComparable(r.withdrawal_status);
}

/** Eligible for the pool: APTO, not a duplicate, not withdrawn. The order is objective: submission time. */
function poolCandidates(registros) {
  return (registros || []).filter(function (r) {
    if (r.duplicate_flag === true || normalizarComparable(r.duplicate_flag) === 'TRUE') return false;
    if (isWithdrawn(r)) return false;
    return normalizarComparable(r.eligibility_status) === ESTADO_ELEGIBILIDAD.APTO;
  }).sort(byCreatedAt);
}

/**
 * Objective pool order (no score is ever used before the audition).
 * priority_rank = position by submission time among every eligible project, INCLUDING the ones
 * that later withdrew: a rank never changes, so "101-200 = substitutes" keeps meaning the same
 * people. Slot holders are PRINCIPAL; the next (poolSize - cupo) non-holders are SUPLENTE in
 * priority order (the pool refills from outside when a substitute takes a slot); the rest are
 * FUERA_DE_BOLSA. Withdrawn projects keep their rank as RETIRADO; substitutes who declined keep DECLINO.
 * @returns {{filas:Array<{submission_id,priority_rank,pool_status}>, principales:number, suplentes:number, fuera:number}}
 */
function computePool(registros, opciones) {
  opciones = opciones || {};
  var cupo = opciones.cupo || CUPO_MAXIMO;
  var poolSize = Math.max(opciones.bolsa || POOL_SIZE, cupo);
  var ranked = (registros || []).filter(function (r) {
    if (r.duplicate_flag === true || normalizarComparable(r.duplicate_flag) === 'TRUE') return false;
    return normalizarComparable(r.eligibility_status) === ESTADO_ELEGIBILIDAD.APTO;
  }).sort(byCreatedAt);
  var substituteSeats = poolSize - cupo;
  var rows = [];
  var seen = {};
  var principals = 0, substitutes = 0, outside = 0;

  ranked.forEach(function (r, i) {
    var status;
    if (isWithdrawn(r)) status = POOL_STATUS.RETIRADO;
    else if (normalizarTexto(r.code)) { status = POOL_STATUS.PRINCIPAL; principals++; }
    else if (normalizarComparable(r.pool_status) === POOL_STATUS.DECLINO) status = POOL_STATUS.DECLINO;
    else if (substitutes < substituteSeats) { status = POOL_STATUS.SUPLENTE; substitutes++; }
    else { status = POOL_STATUS.FUERA_DE_BOLSA; outside++; }
    seen[r.submission_id] = true;
    rows.push({ submission_id: r.submission_id, priority_rank: i + 1, pool_status: status });
  });

  (registros || []).forEach(function (r) {
    if (seen[r.submission_id]) return;
    if (isWithdrawn(r)) { rows.push({ submission_id: r.submission_id, priority_rank: '', pool_status: POOL_STATUS.RETIRADO }); return; }
    // A slot holder whose eligibility was reopened keeps its seat until staff decide: still PRINCIPAL.
    if (normalizarTexto(r.code)) {
      rows.push({ submission_id: r.submission_id, priority_rank: '', pool_status: POOL_STATUS.PRINCIPAL });
      principals++;
    }
  });
  return { filas: rows, principales: principals, suplentes: substitutes, fuera: outside };
}

/** Numbers that were ever issued (current holders and previous holders): a released slot is only re-given through an offer. */
function issuedSlotNumbers(registros) {
  var issued = {};
  (registros || []).forEach(function (r) {
    [r.code, r.previous_code].forEach(function (c) {
      String(c || '').split(/[,\s]+/).forEach(function (one) {
        var n = numeroDeCodigo(one);
        if (n !== null && normalizarTexto(one)) issued[n] = true;
      });
    });
  });
  return issued;
}

/**
 * Slot status for B-001..B-cupo from the registry (holder = row whose `code` is the slot)
 * and the offer ledger (latest offer row of each slot).
 */
function slotStatuses(registros, ofertas, opciones) {
  opciones = opciones || {};
  var cupo = opciones.cupo || CUPO_MAXIMO;
  var holders = {};
  (registros || []).forEach(function (r) {
    if (normalizarTexto(r.code)) holders[normalizarComparable(r.code)] = r;
  });
  var latest = {};
  (ofertas || []).forEach(function (o) {
    var slot = normalizarComparable(o.slot_code);
    if (!slot) return;
    if (!latest[slot] || String(o.created_at || '') >= String(latest[slot].created_at || '')) latest[slot] = o;
  });
  var issued = issuedSlotNumbers(registros);
  var out = [];
  for (var n = 1; n <= cupo; n++) {
    var code = formatearCodigo(n);
    var holder = holders[code];
    var offer = latest[code];
    var status;
    if (holder) status = SLOT_STATUS.ASIGNADO;
    else if (offer && normalizarComparable(offer.estado) === OFFER_STATUS.PENDIENTE) status = SLOT_STATUS.OFRECIDO;
    else if (offer && normalizarComparable(offer.estado) === OFFER_STATUS.VACANTE) status = SLOT_STATUS.VACANTE_SIN_REEMPLAZO;
    else if (issued[n]) status = SLOT_STATUS.LIBERADO;
    else status = SLOT_STATUS.SIN_EMITIR;
    out.push({
      slot_code: code, status: status,
      holder_submission_id: holder ? holder.submission_id : '',
      offer_id: offer ? offer.oferta_id : '', offered_to: offer && status === SLOT_STATUS.OFRECIDO ? offer.submission_id : ''
    });
  }
  return out;
}

/**
 * Next substitute to offer a freed slot to: SUPLENTE by priority, without a pending offer,
 * never someone who already declined or withdrew. Never two open offers for one person.
 */
function nextSubstitute(registros, ofertas, opciones) {
  var pool = computePool(registros, opciones);
  var pending = {};
  (ofertas || []).forEach(function (o) {
    if (normalizarComparable(o.estado) === OFFER_STATUS.PENDIENTE) pending[normalizarComparable(o.submission_id)] = true;
  });
  var bySubmission = {};
  (registros || []).forEach(function (r) { bySubmission[r.submission_id] = r; });
  var candidates = pool.filas.filter(function (p) {
    return p.pool_status === POOL_STATUS.SUPLENTE && !pending[normalizarComparable(p.submission_id)];
  }).sort(function (a, b) { return a.priority_rank - b.priority_rank; });
  return candidates.length ? Object.assign({}, bySubmission[candidates[0].submission_id], candidates[0]) : null;
}

/** Offer expiry: `hours` after `from`, never later than the replacement deadline. */
function offerExpiry(fromIso, hours, deadlineIso) {
  var expires = new Date(new Date(fromIso).getTime() + (Number(hours) || 24) * 3600000);
  if (deadlineIso) {
    var deadline = new Date(deadlineIso);
    if (!isNaN(deadline.getTime()) && deadline.getTime() < expires.getTime()) expires = deadline;
  }
  return expires.toISOString();
}

// ---------------------------------------------------------------------------
// Calendar windows (all dates come from CONFIG)
// ---------------------------------------------------------------------------

/**
 * Which participant-side operations are open at `now`.
 * - withdrawal button ("NO PUEDO ASISTIR"): from reemplazos_desde until the list is consolidated
 * - automatic substitute offers: until reemplazo_limite (after it a freed slot stays vacant)
 * - final confirmation: from confirmacion_final_desde until confirmacion_final_hasta
 * - the consolidated official list freezes every ordinary change
 */
function operationWindows(nowIso, calendar) {
  var now = new Date(nowIso || new Date().toISOString()).getTime();
  var c = calendar || {};
  function at(v) { var d = v ? new Date(v) : null; return d && !isNaN(d.getTime()) ? d.getTime() : null; }
  var locked = !!c.lista_bloqueada;
  var from = at(c.reemplazos_desde);
  var limit = at(c.reemplazo_limite);
  var confFrom = at(c.confirmacion_final_desde);
  var confTo = at(c.confirmacion_final_hasta);
  return {
    lista_bloqueada: locked,
    retiro_abierto: !locked && from !== null && now >= from,
    reemplazo_viable: !locked && (limit === null || now < limit),
    confirmacion_abierta: !locked && confFrom !== null && now >= confFrom && (confTo === null || now <= confTo)
  };
}

// ---------------------------------------------------------------------------
// Participation status (derived, one function, used by every screen and export)
// ---------------------------------------------------------------------------

var PARTICIPATION = {
  SIN_TURNO: 'SIN_TURNO',
  INVITADO: 'INVITADO',
  CONFIRMADO: 'CONFIRMADO',
  CAMBIO_PENDIENTE: 'CAMBIO_PENDIENTE',
  CAMBIO_APROBADO: 'CAMBIO_APROBADO',
  NO_CONFIRMADO: 'NO_CONFIRMADO',
  NO_SHOW: 'NO_SHOW',
  CONTINGENCIA: 'CONTINGENCIA',
  AUDICIONADO: 'AUDICIONADO',
  NO_AUDICIONADO: 'NO_AUDICIONADO',
  RETIRADO: 'RETIRADO',
  RETIRO_FINAL: 'RETIRO_FINAL'
};

/** `offerPending` = this project holds an open substitute offer. */
function participationStatus(r, offerPending) {
  var attendance = normalizarComparable(r.attendance_status).replace(/[_-]+/g, ' ');
  if (attendance === 'REALIZADA') return PARTICIPATION.AUDICIONADO;
  if (attendance === 'NO AUDICIONADO') return PARTICIPATION.NO_AUDICIONADO;
  if (attendance === 'NO SHOW') return PARTICIPATION.NO_SHOW;
  if (attendance === 'CONTINGENCIA') return PARTICIPATION.CONTINGENCIA;
  var withdrawal = normalizarComparable(r.withdrawal_status);
  if (withdrawal === WITHDRAWAL.RETIRO_FINAL) return PARTICIPATION.RETIRO_FINAL;
  if (withdrawal === WITHDRAWAL.RETIRADO) return PARTICIPATION.RETIRADO;
  if (offerPending) return PARTICIPATION.INVITADO;
  if (!normalizarTexto(r.code)) return PARTICIPATION.SIN_TURNO;
  if (normalizarComparable(r.final_confirmation) === 'NO') return PARTICIPATION.NO_CONFIRMADO;
  var change = normalizarComparable(r.change_status);
  if (change === 'PENDIENTE') return PARTICIPATION.CAMBIO_PENDIENTE;
  if (normalizarComparable(r.final_confirmation) === 'SI') return PARTICIPATION.CONFIRMADO;
  if (change === 'APROBADO') return PARTICIPATION.CAMBIO_APROBADO;
  return PARTICIPATION.INVITADO;
}
