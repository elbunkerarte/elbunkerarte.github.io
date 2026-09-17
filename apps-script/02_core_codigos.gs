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
 *  3. A row that ALREADY has a code keeps it forever - a code is never reused,
 *     never renumbered and never freed, even if the row is later disqualified.
 *  4. At most `cupo` codes exist. Overflow rows get LISTA_ESPERA, never a code.
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

  // --- 2. Candidates, in submission order. ----------------------------------
  var candidatos = registros.filter(function (r) {
    if (normalizarTexto(r.code)) return false;                       // already has one
    if (r.duplicate_flag === true || normalizarComparable(r.duplicate_flag) === 'TRUE') return false;
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
