/**
 * EL BUNKER - Core: scoring rubric, consolidation and final selection.
 * PURE FUNCTIONS ONLY.
 */

/** Weights sum to 100. Order matters: it is the tie-break order's source. */
var RUBRICA = [
  { id: 'talento',       etiqueta: 'Talento / ejecución',        peso: 20 },
  { id: 'performance',   etiqueta: 'Performance',                peso: 20 },
  { id: 'identidad',     etiqueta: 'Identidad artística',        peso: 15 },
  { id: 'repertorio',    etiqueta: 'Repertorio / originalidad',  peso: 10 },
  { id: 'profesionalismo', etiqueta: 'Profesionalismo',          peso: 10 },
  { id: 'presencia',     etiqueta: 'Presencia escénica',         peso: 10 },
  { id: 'digital',       etiqueta: 'Presencia digital / comunidad', peso: 5 },
  { id: 'proyecto',      etiqueta: 'Proyecto / compromiso',      peso: 10 }
];

/** Documented tie-break ladder: Performance > Talento > Identidad > committee. */
var ORDEN_DESEMPATE = ['performance', 'talento', 'identidad'];

var ESCALA = [
  { desde: 1, hasta: 3,  etiqueta: 'Deficiente / evidencia insuficiente' },
  { desde: 4, hasta: 6,  etiqueta: 'Base con limitaciones' },
  { desde: 7, hasta: 8,  etiqueta: 'Buen nivel consistente' },
  { desde: 9, hasta: 10, etiqueta: 'Sobresaliente / diferenciado' }
];

function pesoTotalRubrica(rubrica) {
  return (rubrica || RUBRICA).reduce(function (s, f) { return s + f.peso; }, 0);
}

function esPuntajeValido(valor) {
  var n = Number(valor);
  return isFinite(n) && n >= 1 && n <= 10;
}

/**
 * One juror's score for one artist.
 * factor_points = (score / 10) * weight  ->  juror_total is on a 0-100 scale.
 * Returns { valido, total, detalle, faltantes } - an incomplete card is INVALID
 * and must not silently count as a low score.
 */
function calcularPuntajeJurado(puntajes, rubrica) {
  var r = rubrica || RUBRICA;
  var detalle = [];
  var faltantes = [];
  var total = 0;

  for (var i = 0; i < r.length; i++) {
    var factor = r[i];
    var bruto = puntajes ? puntajes[factor.id] : undefined;

    if (!esPuntajeValido(bruto)) {
      faltantes.push(factor.id);
      detalle.push({ id: factor.id, score: null, peso: factor.peso, puntos: 0 });
      continue;
    }
    var puntos = (Number(bruto) / 10) * factor.peso;
    total += puntos;
    detalle.push({ id: factor.id, score: Number(bruto), peso: factor.peso, puntos: redondear(puntos, 4) });
  }

  return {
    valido: faltantes.length === 0,
    total: faltantes.length === 0 ? redondear(total, 4) : null,
    detalle: detalle,
    faltantes: faltantes
  };
}

function redondear(n, decimales) {
  var f = Math.pow(10, decimales === undefined ? 2 : decimales);
  return Math.round(n * f) / f;
}

/**
 * Consolidates the three jurors for one artist.
 * artist_final = mean of the VALID juror totals. Invalid/absent cards are
 * excluded from the denominator, never counted as zero.
 */
function consolidarArtista(tarjetas, rubrica) {
  var validas = [];
  var porFactor = {};
  var r = rubrica || RUBRICA;
  for (var f = 0; f < r.length; f++) porFactor[r[f].id] = [];

  for (var i = 0; i < tarjetas.length; i++) {
    var calculo = calcularPuntajeJurado(tarjetas[i].puntajes, r);
    if (!calculo.valido) continue;
    validas.push({ jurado: tarjetas[i].jurado, total: calculo.total });
    for (var d = 0; d < calculo.detalle.length; d++) {
      var det = calculo.detalle[d];
      porFactor[det.id].push(det.score);
    }
  }

  var promedioFactor = {};
  for (var key in porFactor) {
    if (!porFactor.hasOwnProperty(key)) continue;
    promedioFactor[key] = porFactor[key].length
      ? redondear(porFactor[key].reduce(function (s, v) { return s + v; }, 0) / porFactor[key].length, 4)
      : null;
  }

  var suma = validas.reduce(function (s, v) { return s + v.total; }, 0);

  return {
    jurados_validos: validas.length,
    totales_jurado: validas,
    artist_final: validas.length ? redondear(suma / validas.length, 2) : null,
    promedio_por_factor: promedioFactor
  };
}

/**
 * Ranks artists and returns the top N.
 *
 * Only auditions marked REALIZADA with at least `minimo_jurados` valid cards
 * enter the ranking - the spec is explicit that a participant who did not
 * audition cannot be selected.
 *
 * Ties are broken by the documented ladder; anything still tied afterwards is
 * surfaced in `empates_sin_resolver` for a minuted committee decision. The
 * function never invents a winner.
 */
function seleccionarTop(artistas, opciones) {
  opciones = opciones || {};
  var n = opciones.top || 7;
  var minimoJurados = opciones.minimo_jurados === undefined ? 2 : opciones.minimo_jurados;
  var rubrica = opciones.rubrica || RUBRICA;

  var elegibles = [];
  var excluidos = [];

  for (var i = 0; i < artistas.length; i++) {
    var a = artistas[i];
    var estado = normalizarComparable(a.audition_status);
    if (estado !== 'REALIZADA') {
      excluidos.push({ code: a.code, motivo: 'AUDICION_NO_REALIZADA', estado: a.audition_status || '' });
      continue;
    }
    var c = consolidarArtista(a.tarjetas || [], rubrica);
    if (c.jurados_validos < minimoJurados) {
      excluidos.push({ code: a.code, motivo: 'JURADOS_INSUFICIENTES', jurados_validos: c.jurados_validos });
      continue;
    }
    elegibles.push({
      code: a.code,
      artistic_name: a.artistic_name || '',
      full_name: a.full_name || '',
      discipline: a.discipline || '',
      artist_final: c.artist_final,
      jurados_validos: c.jurados_validos,
      promedio_por_factor: c.promedio_por_factor,
      totales_jurado: c.totales_jurado
    });
  }

  elegibles.sort(function (a, b) { return compararArtistas(a, b); });

  for (var p = 0; p < elegibles.length; p++) elegibles[p].posicion = p + 1;

  var top = elegibles.slice(0, n);
  var empatesSinResolver = detectarEmpateEnCorte(elegibles, n);

  var resultado = {
    top: top,
    ranking: elegibles,
    excluidos: excluidos,
    empates_sin_resolver: empatesSinResolver,
    requiere_comite: empatesSinResolver.length > 0,
    deliberacion_aplicada: '',
    deliberacion_descartada: ''
  };
  if (opciones.deliberacion && resultado.requiere_comite) {
    return applyDeliberation(resultado, opciones.deliberacion, n);
  }
  return resultado;
}

/**
 * Applies a minuted committee decision to an unresolved tie at the cut.
 *
 * The decision only counts if it covers EXACTLY the artists that are tied now:
 * if scores changed after the committee met, the tie is different and the old
 * minutes must not silently decide it. In that case the tie stays open and the
 * reason is reported.
 */
function applyDeliberation(selection, deliberation, n) {
  var order = (deliberation.codes_in_order || []).map(function (c) { return normalizarComparable(c); });
  var tied = selection.empates_sin_resolver.map(function (a) { return normalizarComparable(a.code); });
  var sameSet = order.length === tied.length && tied.every(function (c) { return order.indexOf(c) !== -1; });
  if (!sameSet) {
    return Object.assign({}, selection, {
      deliberacion_descartada: (deliberation.deliberation_id || '') + ' no corresponde al empate actual'
    });
  }

  var tiedSet = {};
  tied.forEach(function (c) { tiedSet[c] = true; });
  var firstTied = -1;
  for (var i = 0; i < selection.ranking.length; i++) {
    if (tiedSet[normalizarComparable(selection.ranking[i].code)]) { firstTied = i; break; }
  }
  var byCode = {};
  selection.ranking.forEach(function (a) { byCode[normalizarComparable(a.code)] = a; });
  var reordered = selection.ranking.filter(function (a) { return !tiedSet[normalizarComparable(a.code)]; });
  var decided = order.map(function (c) { return byCode[c]; });
  Array.prototype.splice.apply(reordered, [firstTied, 0].concat(decided));
  reordered.forEach(function (a, idx) { a.posicion = idx + 1; });

  return Object.assign({}, selection, {
    ranking: reordered,
    top: reordered.slice(0, n),
    empates_sin_resolver: [],
    requiere_comite: false,
    deliberacion_aplicada: deliberation.deliberation_id || 'ACTA'
  });
}

/** Descending by final score, then down the documented tie-break ladder. */
function compararArtistas(a, b) {
  if (b.artist_final !== a.artist_final) return b.artist_final - a.artist_final;

  for (var i = 0; i < ORDEN_DESEMPATE.length; i++) {
    var id = ORDEN_DESEMPATE[i];
    var va = a.promedio_por_factor[id];
    var vb = b.promedio_por_factor[id];
    if (va === null || vb === null || va === undefined || vb === undefined) continue;
    if (vb !== va) return vb - va;
  }
  return 0;                                   // genuinely tied -> committee
}

/**
 * Detects a tie straddling the cut line (position n / n+1) that the ladder
 * could not break. That is the only tie that actually changes the outcome.
 */
function detectarEmpateEnCorte(ranking, n) {
  if (ranking.length <= n) return [];
  var dentro = ranking[n - 1];
  var fuera = ranking[n];
  if (compararArtistas(dentro, fuera) !== 0) return [];

  var empatados = ranking.filter(function (a) { return compararArtistas(a, dentro) === 0; });
  return empatados.map(function (a) {
    return { code: a.code, artistic_name: a.artistic_name, artist_final: a.artist_final, posicion: a.posicion };
  });
}

/** Buckets for the distribution chart on the dashboard. */
function distribucionPuntajes(ranking, rangos) {
  var bandas = rangos || [
    { etiqueta: '0-39', desde: 0,  hasta: 39.999 },
    { etiqueta: '40-59', desde: 40, hasta: 59.999 },
    { etiqueta: '60-69', desde: 60, hasta: 69.999 },
    { etiqueta: '70-79', desde: 70, hasta: 79.999 },
    { etiqueta: '80-89', desde: 80, hasta: 89.999 },
    { etiqueta: '90-100', desde: 90, hasta: 100 }
  ];
  return bandas.map(function (b) {
    return {
      etiqueta: b.etiqueta,
      conteo: ranking.filter(function (a) {
        return a.artist_final >= b.desde && a.artist_final <= b.hasta;
      }).length
    };
  });
}
