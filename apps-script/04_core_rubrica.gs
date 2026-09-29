/**
 * EL BUNKER - Core: official jury rubric, per-juror scoring, consolidation and ranking.
 * PURE FUNCTIONS ONLY.
 *
 * Source of the rubric: "rubrica-jurado-daviarena.pdf" (the organization's official jury
 * rubric, adopted for this call on 2026-09-29). The venue named in that PDF is NOT this
 * event's venue; only the categories, factors, scale and level anchors are used, verbatim.
 *
 * The rubric is a parameter, not code: the PARAMETROS_RUBRICA sheet holds it (see
 * rubricFromRows) and RUBRIC_DEFAULT only seeds that sheet and backs the tests.
 */

var RUBRIC_VERSION_DEFAULT = 'R1-2026-09-29 (rubrica-jurado-daviarena.pdf)';
var RATING_MIN = 1;
var RATING_MAX = 5;
var RUBRIC_TOTAL_MAX = 100;

/** Level names of the 1-5 scale, as printed in the PDF. */
var RUBRIC_SCALE = [
  { nota: 1, etiqueta: 'Insuficiente' },
  { nota: 2, etiqueta: 'Regular' },
  { nota: 3, etiqueta: 'Bueno' },
  { nota: 4, etiqueta: 'Muy bueno' },
  { nota: 5, etiqueta: 'Nivel arena' }
];

/**
 * Seven categories, factors 4-4-3-3-2-2-2: rating (1-5) x factor = points, so a juror's total
 * runs from 20 (all 1) to 100 (all 5). `desempate` marks the two categories whose combined
 * points break ties (PDF: "Mayor puntaje en Presencia escénica y Factor arena combinados").
 */
var RUBRIC_DEFAULT = [
  {
    id: 'afinacion', orden: 1, factor: 4, desempate: false,
    categoria: 'Afinación y técnica vocal',
    corta: 'Afinación y técnica vocal',
    categoria_no_vocal: 'Dominio técnico de la voz/instrumento principal',
    descripcion: 'Control de tono, respiración, registro y estabilidad de la voz en vivo — sin autotune ni “salvavidas” de pista.',
    niveles: [
      'Desafinaciones frecuentes, se queda sin aire, pierde el control en notas sostenidas.',
      'Afina la mayor parte, pero se nota inseguridad técnica en los pasajes difíciles.',
      'Técnica sólida y consistente, maneja bien su registro natural.',
      'Control técnico notable, domina matices, dinámica y respiración con soltura.',
      'Técnica impecable incluso bajo la exigencia física de un show en vivo largo.'
    ]
  },
  {
    id: 'presencia', orden: 2, factor: 4, desempate: true,
    categoria: 'Presencia escénica y dominio del escenario',
    corta: 'Presencia escénica',
    categoria_no_vocal: '',
    descripcion: 'Uso del espacio, lenguaje corporal, seguridad frente al público y capacidad de “llenar” un escenario grande.',
    niveles: [
      'Rígido, de espaldas al público, no sabe qué hacer con las manos o el cuerpo.',
      'Presencia tímida, se mueve poco, le cuesta ocupar el espacio disponible.',
      'Se desenvuelve con naturalidad, mantiene contacto visual y buena postura.',
      'Carisma claro, se mueve con intención, transmite seguridad sostenida.',
      'Magnetismo escénico real: podría sostener solo un escenario grande sin apoyo visual extra.'
    ]
  },
  {
    id: 'interpretacion', orden: 3, factor: 3, desempate: false,
    categoria: 'Interpretación y conexión emocional',
    corta: 'Interpretación y conexión',
    categoria_no_vocal: '',
    descripcion: 'Qué tan creíble es lo que canta: fraseo, intención, matices actorales, si “cuenta algo” o solo ejecuta notas.',
    niveles: [
      'Interpretación plana, sin matices ni conexión con la letra.',
      'Hay algo de intención, pero se siente mecánico o forzado.',
      'Transmite la emoción de la canción de forma creíble.',
      'Fraseo personal, matices claros, genera una reacción real en quien escucha.',
      'Interpretación que eriza la piel; el jurado olvida que está calificando.'
    ]
  },
  {
    id: 'originalidad', orden: 4, factor: 3, desempate: false,
    categoria: 'Originalidad y propuesta artística',
    corta: 'Originalidad y propuesta',
    categoria_no_vocal: '',
    descripcion: 'Identidad propia: arreglos, versión personal de un cover, imagen coherente con su sonido.',
    niveles: [
      'Copia genérica de referentes, cero sello propio.',
      'Algún intento de diferenciarse, pero poco definido.',
      'Propuesta identificable, se nota una dirección artística clara.',
      'Sonido o puesta en escena distintivos, se recuerda después del show.',
      'Propuesta tan propia que podría ser su marca personal como artista.'
    ]
  },
  {
    id: 'ritmo', orden: 5, factor: 2, desempate: false,
    categoria: 'Ritmo, sincronía y trabajo con banda/pista',
    corta: 'Ritmo y sincronía',
    categoria_no_vocal: '',
    descripcion: 'Precisión rítmica, sincronía con músicos o pista, entradas y cortes limpios.',
    niveles: [
      'Se descuadra con la música, entradas y cortes desordenados.',
      'Mantiene el tiempo casi siempre, con algunos desfases.',
      'Sincronía sólida con banda o pista durante toda la presentación.',
      'Groove natural, ajusta y responde a la banda en tiempo real.',
      'Precisión de sesión profesional, cero margen de error visible.'
    ]
  },
  {
    id: 'repertorio', orden: 6, factor: 2, desempate: false,
    categoria: 'Repertorio: elección y dificultad',
    corta: 'Repertorio',
    categoria_no_vocal: '',
    descripcion: 'Si la canción elegida exige y muestra el rango real del artista, y si encaja con el público del evento.',
    niveles: [
      'Canción muy fácil o inadecuada para el formato del evento.',
      'Elección correcta pero segura, no reta al artista.',
      'Repertorio bien elegido, exige y a la vez encaja con el público.',
      'Canción exigente que el artista domina y usa a su favor.',
      'Elección estratégica: reta, encaja y “calienta” perfecto para lo que viene después.'
    ]
  },
  {
    id: 'arena', orden: 7, factor: 2, desempate: true,
    categoria: 'Factor arena: capacidad de calentar al público',
    corta: 'Factor arena',
    categoria_no_vocal: '',
    descripcion: 'Lo específico de ser telonero: ¿logra activar a un público que en realidad vino a ver a otro artista?',
    niveles: [
      'No genera reacción, el público queda indiferente.',
      'Genera algo de energía, pero se pierde o no la sostiene.',
      'Logra enganchar a buena parte del público en pocos minutos.',
      'Sube la energía de la sala de forma clara y sostenida.',
      'Deja al público listo y con hambre de más — exactamente el trabajo de un telonero.'
    ]
  }
];

/** Disqualification causes, verbatim from the PDF ("Descalifica automáticamente"). */
var DQ_CAUSES = [
  { id: 'PLAYBACK', etiqueta: 'Uso de playback sin avisarlo, en formato que exige voz en vivo.' },
  { id: 'SOUNDCHECK', etiqueta: 'Incumplimiento grave de tiempos de soundcheck o ensayo sin justificación.' },
  { id: 'CONTENIDO', etiqueta: 'Contenido discriminatorio u ofensivo en repertorio o comportamiento en tarima.' }
];

/** Tie-break methods after the automatic criterion (PDF "Criterios de desempate"). */
var TIE_METHODS = [
  { id: 'REPETIR_CANCION', etiqueta: 'Se repite una canción corta a criterio del jurado' },
  { id: 'VOTO_CALIDAD', etiqueta: 'Voto de calidad del jurado musical' }
];

/** Presentation formats where category 1 is read as voice OR main instrument. */
var NON_VOCAL_FORMATS = ['INSTRUMENTAL', 'DJ_SET', 'OTRA'];

var EVALUATION_STATE = {
  BORRADOR: 'BORRADOR',       // per card: saved, still editable by the juror
  ENVIADA: 'ENVIADA'          // per card: submitted and locked
};

/** Per-project evaluation status (prompt section 3). */
var EVALUATION_STATUS = {
  SIN_CALIFICAR: 'SIN_CALIFICAR',
  PARCIAL: 'PARCIAL',
  COMPLETA: 'COMPLETA',
  BLOQUEADA: 'BLOQUEADA',
  DQ_PENDIENTE: 'DQ_PENDIENTE',
  DESCALIFICADO: 'DESCALIFICADO'
};

var RANKING_STATUS = {
  SIN_RANKING: 'SIN_RANKING',
  RANKED: 'RANKED',
  TOP20: 'TOP20',
  TOP10_SELECCIONADO: 'TOP10_SELECCIONADO',
  TIE_REVIEW_REQUIRED: 'TIE_REVIEW_REQUIRED',
  NO_SELECCIONADO: 'NO_SELECCIONADO'
};

var DQ_STATUS = { PENDIENTE: 'PENDIENTE', VALIDADA: 'VALIDADA', DESCARTADA: 'DESCARTADA' };

// ---------------------------------------------------------------------------
// The rubric as a parameter
// ---------------------------------------------------------------------------

/** Header of the PARAMETROS_RUBRICA sheet: one row per category. */
var RUBRIC_PARAM_COLUMNS = [
  'version', 'orden', 'id', 'categoria', 'categoria_corta', 'categoria_no_vocal', 'descripcion',
  'factor', 'puntos_max', 'nivel_1', 'nivel_2', 'nivel_3', 'nivel_4', 'nivel_5', 'desempate'
];

function rubricToRows(rubric, version) {
  return (rubric || RUBRIC_DEFAULT).map(function (c) {
    return {
      version: version || RUBRIC_VERSION_DEFAULT, orden: c.orden, id: c.id, categoria: c.categoria,
      categoria_corta: c.corta, categoria_no_vocal: c.categoria_no_vocal || '', descripcion: c.descripcion,
      factor: c.factor, puntos_max: c.factor * RATING_MAX,
      nivel_1: c.niveles[0], nivel_2: c.niveles[1], nivel_3: c.niveles[2], nivel_4: c.niveles[3], nivel_5: c.niveles[4],
      desempate: c.desempate ? 'SI' : 'NO'
    };
  });
}

/** Builds the rubric from sheet rows (already read as objects), ordered by `orden`. */
function rubricFromRows(rows) {
  var list = (rows || []).filter(function (r) { return normalizarTexto(r.id); }).map(function (r) {
    return {
      id: normalizarTexto(r.id).toLowerCase(),
      orden: Number(r.orden) || 0,
      factor: Number(r.factor),
      desempate: normalizarComparable(r.desempate) === 'SI',
      categoria: normalizarTexto(r.categoria),
      corta: normalizarTexto(r.categoria_corta) || normalizarTexto(r.categoria),
      categoria_no_vocal: normalizarTexto(r.categoria_no_vocal),
      descripcion: normalizarTexto(r.descripcion),
      niveles: [r.nivel_1, r.nivel_2, r.nivel_3, r.nivel_4, r.nivel_5].map(function (n) { return normalizarTexto(n); })
    };
  });
  list.sort(function (a, b) { return a.orden - b.orden; });
  var version = rows && rows.length ? normalizarTexto(rows[0].version) : '';
  return { version: version, categorias: list };
}

/**
 * Structural checks. A rubric that fails any of them must not be used to score:
 * the caller surfaces the errors instead of silently falling back to defaults.
 */
function validateRubric(rubric) {
  var r = rubric || RUBRIC_DEFAULT;
  var errors = [];
  if (!r.length) errors.push('La rúbrica no tiene categorías.');
  var seen = {};
  var hasTieBreak = false;
  r.forEach(function (c, i) {
    var where = 'Categoría ' + (i + 1) + (c.id ? ' (' + c.id + ')' : '');
    if (!/^[a-z][a-z0-9_]*$/.test(c.id || '')) errors.push(where + ': id inválido (minúsculas, sin espacios).');
    if (seen[c.id]) errors.push(where + ': id repetido.');
    seen[c.id] = true;
    if (!(c.factor > 0) || Math.floor(c.factor) !== c.factor) errors.push(where + ': el factor debe ser un entero mayor que 0.');
    if (!c.categoria) errors.push(where + ': falta el nombre.');
    if (!c.niveles || c.niveles.length !== RATING_MAX || c.niveles.some(function (n) { return !n; })) {
      errors.push(where + ': faltan los textos de los ' + RATING_MAX + ' niveles.');
    }
    if (c.desempate) hasTieBreak = true;
  });
  var max = rubricMaxTotal(r);
  if (r.length && max !== RUBRIC_TOTAL_MAX) {
    errors.push('Los factores suman un máximo de ' + max + ' puntos; deben sumar ' + RUBRIC_TOTAL_MAX + '.');
  }
  if (r.length && !hasTieBreak) errors.push('Ninguna categoría está marcada como criterio de desempate.');
  return { ok: errors.length === 0, errores: errors };
}

function rubricMaxTotal(rubric) {
  return (rubric || RUBRIC_DEFAULT).reduce(function (s, c) { return s + c.factor * RATING_MAX; }, 0);
}

function rubricMinTotal(rubric) {
  return (rubric || RUBRIC_DEFAULT).reduce(function (s, c) { return s + c.factor * RATING_MIN; }, 0);
}

/** Short fingerprint of what changes a score (ids + factors), stamped on every card. */
function rubricFingerprint(rubric) {
  return (rubric || RUBRIC_DEFAULT).map(function (c) { return c.id + 'x' + c.factor; }).join('|');
}

/** Category name the juror reads for this participant (category 1 adapts to non-vocal formats). */
function categoryLabelFor(category, presentationFormat) {
  var format = normalizarComparable(presentationFormat).replace(/[\s-]+/g, '_');
  if (category.categoria_no_vocal && NON_VOCAL_FORMATS.indexOf(format) !== -1) return category.categoria_no_vocal;
  return category.categoria;
}

// ---------------------------------------------------------------------------
// One juror's card
// ---------------------------------------------------------------------------

function esPuntajeValido(valor) {
  if (valor === '' || valor === null || valor === undefined) return false;
  var n = Number(valor);
  return isFinite(n) && Math.floor(n) === n && n >= RATING_MIN && n <= RATING_MAX;
}

/**
 * points = rating x factor; total = sum of the categories (20-100 with the official rubric).
 * An incomplete card is INVALID (total null), never a low score.
 */
function calcularPuntajeJurado(puntajes, rubrica) {
  var r = rubrica || RUBRIC_DEFAULT;
  var detalle = [];
  var faltantes = [];
  var total = 0;
  var tieBreak = 0;

  for (var i = 0; i < r.length; i++) {
    var c = r[i];
    var raw = puntajes ? puntajes[c.id] : undefined;
    if (!esPuntajeValido(raw)) {
      faltantes.push(c.id);
      detalle.push({ id: c.id, rating: null, factor: c.factor, puntos: 0 });
      continue;
    }
    var points = Number(raw) * c.factor;
    total += points;
    if (c.desempate) tieBreak += points;
    detalle.push({ id: c.id, rating: Number(raw), factor: c.factor, puntos: points });
  }

  var valid = faltantes.length === 0;
  return {
    valido: valid,
    total: valid ? total : null,
    desempate: valid ? tieBreak : null,
    detalle: detalle,
    faltantes: faltantes
  };
}

// ---------------------------------------------------------------------------
// Consolidation (one project, several jurors)
// ---------------------------------------------------------------------------

/**
 * `tarjetas` are the SUBMITTED cards of one project: [{ jurado, puntajes }].
 * artist_final = mean of the valid juror totals, kept at full precision (round only to show).
 * desempate    = mean of the jurors' tie-break points (presence + arena).
 */
function consolidarArtista(tarjetas, rubrica) {
  var r = rubrica || RUBRIC_DEFAULT;
  var valid = [];
  var ratings = {};
  r.forEach(function (c) { ratings[c.id] = []; });

  (tarjetas || []).forEach(function (t) {
    var calc = calcularPuntajeJurado(t.puntajes, r);
    if (!calc.valido) return;
    valid.push({ jurado: t.jurado, total: calc.total, desempate: calc.desempate });
    calc.detalle.forEach(function (d) { ratings[d.id].push(d.rating); });
  });

  var meanRatings = {};
  Object.keys(ratings).forEach(function (id) {
    var list = ratings[id];
    meanRatings[id] = list.length ? list.reduce(function (s, v) { return s + v; }, 0) / list.length : null;
  });

  var n = valid.length;
  return {
    jurados_validos: n,
    totales_jurado: valid,
    artist_final: n ? valid.reduce(function (s, v) { return s + v.total; }, 0) / n : null,
    tie_break: n ? valid.reduce(function (s, v) { return s + v.desempate; }, 0) / n : null,
    promedio_por_factor: meanRatings
  };
}

/** Per-project evaluation status from its cards and disqualification state. */
function evaluationStatusOf(cards, opciones) {
  opciones = opciones || {};
  var jurors = opciones.jurados || 3;
  if (opciones.dq_status === DQ_STATUS.VALIDADA) return EVALUATION_STATUS.DESCALIFICADO;
  if (opciones.dq_status === DQ_STATUS.PENDIENTE) return EVALUATION_STATUS.DQ_PENDIENTE;
  var sent = (cards || []).filter(function (c) { return normalizarComparable(c.estado) === EVALUATION_STATE.ENVIADA; }).length;
  var drafts = (cards || []).length - sent;
  if (sent >= jurors) return opciones.resultados_cerrados ? EVALUATION_STATUS.BLOQUEADA : EVALUATION_STATUS.COMPLETA;
  if (sent === 0 && drafts === 0) return EVALUATION_STATUS.SIN_CALIFICAR;
  return EVALUATION_STATUS.PARCIAL;
}

// ---------------------------------------------------------------------------
// Ranking, cuts, ties
// ---------------------------------------------------------------------------

var SCORE_EPSILON = 1e-9;

function sameScore(a, b) {
  return Math.abs(a - b) < SCORE_EPSILON;
}

/** Final score DESC, then tie-break points DESC. 0 = genuinely tied -> human review. */
function compararArtistas(a, b) {
  if (!sameScore(a.artist_final, b.artist_final)) return b.artist_final - a.artist_final;
  if (!sameScore(a.tie_break, b.tie_break)) return b.tie_break - a.tie_break;
  return 0;
}

/** Artists tied with the one at position `cut` AND with the one right after it (the only ties that matter). */
function detectarEmpateEnCorte(ranking, cut) {
  if (ranking.length <= cut) return [];
  var inside = ranking[cut - 1];
  var outside = ranking[cut];
  if (compararArtistas(inside, outside) !== 0) return [];
  return ranking.filter(function (a) { return compararArtistas(a, inside) === 0; }).map(function (a) {
    return { code: a.code, artistic_name: a.artistic_name, artist_final: a.artist_final,
             tie_break: a.tie_break, posicion: a.posicion };
  });
}

/**
 * Ranks the auditioned projects.
 * Enter the ranking: audition REALIZADA, at least `minimo_jurados` submitted cards, not disqualified.
 * Output statuses: TOP10_SELECCIONADO (1-10), TOP20 (11-20, private), RANKED (21+),
 * TIE_REVIEW_REQUIRED (a persistent tie across position 10 or 20), SIN_RANKING (excluded).
 * The software never decides a persistent tie: a minuted deliberation for that exact cut and
 * that exact set of tied projects is required (see applyDeliberation).
 */
function seleccionarTop(artistas, opciones) {
  opciones = opciones || {};
  var topPublic = opciones.top_publico || opciones.top || 10;
  var topPrivate = Math.max(opciones.top_privado || 20, topPublic);
  var minJurors = opciones.minimo_jurados === undefined ? 3 : opciones.minimo_jurados;
  var rubric = opciones.rubrica || RUBRIC_DEFAULT;
  var deliberations = opciones.deliberaciones || (opciones.deliberacion ? [opciones.deliberacion] : []);

  var eligible = [];
  var excluded = [];

  (artistas || []).forEach(function (a) {
    var state = normalizarComparable(a.audition_status);
    if (state !== 'REALIZADA') {
      excluded.push({ code: a.code, artistic_name: a.artistic_name, motivo: 'AUDICION_NO_REALIZADA', estado: a.audition_status || '' });
      return;
    }
    if (a.dq_status === DQ_STATUS.VALIDADA) {
      excluded.push({ code: a.code, artistic_name: a.artistic_name, motivo: 'DESCALIFICADO' });
      return;
    }
    var c = consolidarArtista(a.tarjetas || [], rubric);
    if (c.jurados_validos < minJurors) {
      excluded.push({ code: a.code, artistic_name: a.artistic_name, motivo: 'JURADOS_INSUFICIENTES', jurados_validos: c.jurados_validos });
      return;
    }
    eligible.push({
      code: a.code,
      artistic_name: a.artistic_name || '',
      full_name: a.full_name || '',
      discipline: a.discipline || '',
      artist_final: c.artist_final,
      tie_break: c.tie_break,
      jurados_validos: c.jurados_validos,
      promedio_por_factor: c.promedio_por_factor,
      totales_jurado: c.totales_jurado,
      dq_pendiente: a.dq_status === DQ_STATUS.PENDIENTE
    });
  });

  eligible.sort(function (a, b) {
    var cmp = compararArtistas(a, b);
    return cmp !== 0 ? cmp : (String(a.code) < String(b.code) ? -1 : 1);   // stable display only
  });
  eligible.forEach(function (a, i) { a.posicion = i + 1; });

  var result = {
    ranking: eligible,
    excluidos: excluded,
    cortes: [],
    deliberaciones_aplicadas: [],
    deliberaciones_descartadas: []
  };

  [topPublic, topPrivate].forEach(function (cut) {
    var tied = detectarEmpateEnCorte(result.ranking, cut);
    if (!tied.length) return;
    var decision = deliberations.filter(function (d) { return Number(d.cut_position) === cut; }).pop();
    if (decision) {
      var applied = applyDeliberation(result.ranking, tied, decision);
      if (applied.ok) {
        result.ranking = applied.ranking;
        result.deliberaciones_aplicadas.push({ cut: cut, deliberation_id: decision.deliberation_id || 'ACTA' });
        return;
      }
      result.deliberaciones_descartadas.push({ cut: cut, deliberation_id: decision.deliberation_id || '', motivo: applied.motivo });
    }
    result.cortes.push({ cut: cut, empatados: tied });
  });

  var tiedCodes = {};
  result.cortes.forEach(function (c) { c.empatados.forEach(function (a) { tiedCodes[normalizarComparable(a.code)] = true; }); });

  result.ranking.forEach(function (a) {
    if (tiedCodes[normalizarComparable(a.code)]) a.ranking_status = RANKING_STATUS.TIE_REVIEW_REQUIRED;
    else if (a.posicion <= topPublic) a.ranking_status = RANKING_STATUS.TOP10_SELECCIONADO;
    else if (a.posicion <= topPrivate) a.ranking_status = RANKING_STATUS.TOP20;
    else a.ranking_status = opciones.resultados_cerrados ? RANKING_STATUS.NO_SELECCIONADO : RANKING_STATUS.RANKED;
  });
  excluded.forEach(function (e) { e.ranking_status = RANKING_STATUS.SIN_RANKING; });

  result.top10 = result.ranking.filter(function (a) { return a.ranking_status === RANKING_STATUS.TOP10_SELECCIONADO; });
  result.top20 = result.ranking.filter(function (a) { return a.posicion <= topPrivate && a.ranking_status !== RANKING_STATUS.TIE_REVIEW_REQUIRED; });
  result.top = result.top10;
  result.empates_sin_resolver = result.cortes.reduce(function (all, c) { return all.concat(c.empatados); }, []);
  result.requiere_comite = result.cortes.length > 0;
  result.dq_pendientes = result.ranking.filter(function (a) { return a.dq_pendiente; }).map(function (a) { return a.code; });
  result.top_publico = topPublic;
  result.top_privado = topPrivate;
  return result;
}

/**
 * Applies a minuted decision (repeated short song or the music juror's casting vote) to one
 * persistent tie. It only counts if it lists EXACTLY the projects tied now: if scores changed
 * after the committee met, the tie is a different one and must be decided again.
 */
function applyDeliberation(ranking, tied, decision) {
  var order = String(decision.codes_in_order || '').split(/[,\s]+/).filter(Boolean)
    .map(function (c) { return normalizarComparable(c); });
  if (Array.isArray(decision.codes_in_order)) order = decision.codes_in_order.map(function (c) { return normalizarComparable(c); });
  var tiedCodes = tied.map(function (a) { return normalizarComparable(a.code); });
  var sameSet = order.length === tiedCodes.length && tiedCodes.every(function (c) { return order.indexOf(c) !== -1; });
  if (!sameSet) return { ok: false, motivo: 'El acta no corresponde a los empatados actuales (' + tiedCodes.join(', ') + ').' };

  var tiedSet = {};
  tiedCodes.forEach(function (c) { tiedSet[c] = true; });
  var first = -1;
  for (var i = 0; i < ranking.length; i++) {
    if (tiedSet[normalizarComparable(ranking[i].code)]) { first = i; break; }
  }
  var byCode = {};
  ranking.forEach(function (a) { byCode[normalizarComparable(a.code)] = a; });
  var rest = ranking.filter(function (a) { return !tiedSet[normalizarComparable(a.code)]; });
  Array.prototype.splice.apply(rest, [first, 0].concat(order.map(function (c) { return byCode[c]; })));
  rest.forEach(function (a, idx) { a.posicion = idx + 1; });
  return { ok: true, ranking: rest };
}

/** Buckets for the dashboard chart (a juror total lives in 20-100). */
function distribucionPuntajes(ranking, rangos) {
  var bands = rangos || [
    { etiqueta: '20-39', desde: 20, hasta: 39.999 },
    { etiqueta: '40-59', desde: 40, hasta: 59.999 },
    { etiqueta: '60-69', desde: 60, hasta: 69.999 },
    { etiqueta: '70-79', desde: 70, hasta: 79.999 },
    { etiqueta: '80-89', desde: 80, hasta: 89.999 },
    { etiqueta: '90-100', desde: 90, hasta: 100 }
  ];
  return bands.map(function (b) {
    return {
      etiqueta: b.etiqueta,
      conteo: ranking.filter(function (a) { return a.artist_final >= b.desde && a.artist_final <= b.hasta; }).length
    };
  });
}

/** Rounds for DISPLAY only (dashboard averages, percentages). Never used inside the ranking. */
function redondear(value, decimals) {
  var f = Math.pow(10, decimals === undefined ? 2 : decimals);
  return Math.round(Number(value) * f) / f;
}

/** Two decimals for screens and exports; the ranking itself always uses full precision. */
function scoreText(value) {
  if (value === null || value === undefined || value === '') return '';
  return (Math.round(Number(value) * 100) / 100).toFixed(2);
}
