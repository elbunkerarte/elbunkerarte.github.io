/**
 * EL BUNKER - Jury actions and the official rubric as a parameter.
 *
 * A juror sees only what they need to score: code, artistic name, format and song.
 * No document number, no contact details, no other juror's marks and no ranking - jurors
 * score independently. A card is a draft (BORRADOR) until the juror submits it
 * ("ENVIAR Y BLOQUEAR EVALUACIÓN"); after that only direction/admin can reopen it, with a
 * reason that goes to the log.
 */

var JURY_SHEETS = ['JURADO_1', 'JURADO_2', 'JURADO_3'];

// ---------------------------------------------------------------------------
// The rubric in the PARAMETROS_RUBRICA sheet
// ---------------------------------------------------------------------------

var _rubricCache = null;

/**
 * The rubric in force: the PARAMETROS_RUBRICA sheet when it has rows, the official default
 * otherwise. Returns the validation result too; callers that score refuse an invalid rubric.
 */
function activeRubric() {
  if (_rubricCache) return _rubricCache;
  var rows = [];
  try {
    if (libro().getSheetByName(HOJA.PARAMETROS_RUBRICA)) rows = leerHoja(HOJA.PARAMETROS_RUBRICA);
  } catch (e) { rows = []; }
  var built = rows.length ? rubricFromRows(rows) : { version: RUBRIC_VERSION_DEFAULT, categorias: RUBRIC_DEFAULT };
  var check = validateRubric(built.categorias);
  _rubricCache = {
    version: built.version || RUBRIC_VERSION_DEFAULT,
    categorias: built.categorias,
    fingerprint: rubricFingerprint(built.categorias),
    origen: rows.length ? 'PARAMETROS_RUBRICA' : 'DEFECTO',
    valida: check.ok,
    errores: check.errores
  };
  return _rubricCache;
}

function invalidateRubricCache() { _rubricCache = null; }

/** Categories used to lay out the jury sheets; an invalid sheet never reshapes them. */
function activeRubricCategories() {
  var r = activeRubric();
  return r.valida ? r.categorias : RUBRIC_DEFAULT;
}

/** Everything the private "Cómo calificar" panel shows. */
function rubricGuide(rubric) {
  var r = rubric || activeRubric();
  var cats = r.categorias;
  return {
    version: r.version,
    escala: RUBRIC_SCALE,
    minimo: rubricMinTotal(cats),
    maximo: rubricMaxTotal(cats),
    categorias: cats.map(function (c) {
      return {
        id: c.id, orden: c.orden, categoria: c.categoria, corta: c.corta, categoria_no_vocal: c.categoria_no_vocal,
        descripcion: c.descripcion, factor: c.factor, puntos_max: c.factor * RATING_MAX,
        niveles: c.niveles.map(function (texto, i) { return { nota: i + 1, etiqueta: RUBRIC_SCALE[i].etiqueta, texto: texto }; }),
        desempate: c.desempate
      };
    }),
    desempate: cats.filter(function (c) { return c.desempate; }).map(function (c) { return c.corta; }),
    metodos_desempate: TIE_METHODS,
    causales_dq: DQ_CAUSES
  };
}

// ---------------------------------------------------------------------------
// Jury sheets
// ---------------------------------------------------------------------------

function hojaDeJurado(alias) {
  var usuarios = leerHoja(HOJA.USUARIOS);
  for (var i = 0; i < usuarios.length; i++) {
    if (normalizarComparable(usuarios[i].email_o_alias) === normalizarComparable(alias)) {
      var m = String(usuarios[i].nota || '').match(/jurado\s*([123])/i);
      if (m) return 'JURADO_' + m[1];
    }
  }
  var n = String(alias || '').match(/([123])\s*$/);
  if (n) return 'JURADO_' + n[1];
  throw new Error('No se pudo determinar la hoja de este jurado. En _USUARIOS, la nota debe decir "jurado 1", "jurado 2" o "jurado 3".');
}

function ratingsOf(row, rubric) {
  var out = {};
  (rubric || activeRubricCategories()).forEach(function (c) {
    var v = row[c.id];
    out[c.id] = esPuntajeValido(v) ? Number(v) : null;
  });
  return out;
}

/**
 * Every juror card by project code: { 'B-001': [{ jurado: 1, estado, puntajes, total, row }] }.
 * Used by results, dashboard and exports; the ranking counts only ENVIADA cards.
 */
function evaluationCards() {
  var rubric = activeRubricCategories();
  var byCode = {};
  JURY_SHEETS.forEach(function (sheetName, i) {
    leerHoja(sheetName).forEach(function (row) {
      var code = normalizarComparable(row.code);
      if (!code) return;
      (byCode[code] = byCode[code] || []).push({
        jurado: i + 1,
        estado: normalizarComparable(row.estado) || EVALUATION_STATE.BORRADOR,
        puntajes: ratingsOf(row, rubric),
        total: row.total,
        observaciones: row.observaciones || '',
        dq_flag: esVerdadero(row.dq_flag),
        row: row
      });
    });
  });
  return byCode;
}

function sentCards(cards) {
  return (cards || []).filter(function (c) { return c.estado === EVALUATION_STATE.ENVIADA; });
}

// ---------------------------------------------------------------------------
// Juror screen
// ---------------------------------------------------------------------------

/** The juror screen belongs to the three jurors; anyone else gets a plain answer instead of a sheet error. */
function notAJuror(sesion) {
  if (sesion && sesion.rol === ROL.JURADO) return null;
  return { ok: false, error: 'Esta pantalla es de los jurados: cada jurado entra con su propio enlace. ' +
           'Las correcciones se hacen desde Dirección (reabrir evaluación).' };
}

function accionListaEvaluacion(datos, sesion) {
  var refused = notAJuror(sesion);
  if (refused) return refused;
  var rubric = activeRubric();
  var mySheet = hojaDeJurado(sesion.alias);
  var mine = {};
  leerHoja(mySheet).forEach(function (f) { if (f.code) mine[normalizarComparable(f.code)] = f; });

  // Everyone who reached the venue is listed so the juror can follow the day; only REALIZADA can be scored.
  var rows = leerHoja(HOJA.REGISTRO).filter(function (r) {
    return normalizarTexto(r.code) && normalizarTexto(r.attendance_status) &&
           normalizarEstado(r.attendance_status) !== ESTADO.CONFIRMADO;
  });

  return {
    hoja: mySheet,
    rubrica: rubricGuide(rubric),
    rubrica_valida: rubric.valida,
    rubrica_errores: rubric.errores,
    resultados_cerrados: cfgBool('resultados_cerrados', false),
    participantes: rows.map(function (r) {
      var card = mine[normalizarComparable(r.code)];
      var state = card ? (normalizarComparable(card.estado) || EVALUATION_STATE.BORRADOR) : '';
      return {
        code: r.code,
        artistic_name: r.artistic_name || '(sin nombre artístico)',
        discipline: projectGenre(r),
        participation_mode: r.participation_mode || 'SOLISTA',
        members_declared: Number(r.members_declared) || 1,
        presentation_format: r.presentation_format || '',
        presentation_format_texto: presentationFormatText(r.presentation_format, r.presentation_other),
        categoria_1: categoryLabelFor(rubric.categorias[0], r.presentation_format),
        song_name: r.song_name || '',
        attendance_status: r.attendance_status,
        audition_status: r.audition_status || '',
        calificable: normalizarEstado(r.audition_status) === ESTADO.REALIZADA ||
                     normalizarEstado(r.attendance_status) === ESTADO.REALIZADA,
        estado_tarjeta: state,
        bloqueada: state === EVALUATION_STATE.ENVIADA,
        total: card && normalizarTexto(card.total) ? Number(card.total) : null,
        puntajes: card ? ratingsOf(card, rubric.categorias) : null,
        observaciones: card ? card.observaciones : '',
        dq_flag: card ? esVerdadero(card.dq_flag) : false,
        dq_causa: card ? card.dq_causa || '' : '',
        dq_nota: card ? card.dq_nota || '' : ''     // sent back so saving the draft again keeps it
      };
    })
  };
}

/**
 * Saves a draft, or submits and locks the card when `enviar` is true.
 * A draft may be partial; a submission must be complete (every category 1-5).
 * Observations never change the score. A disqualification report is recorded apart and
 * waits for validation by an authorized role.
 */
function accionGuardarEvaluacion(datos, sesion) {
  var refused = notAJuror(sesion);
  if (refused) return refused;
  var rubric = activeRubric();
  if (!rubric.valida) {
    return { ok: false, error: 'La rúbrica configurada no es válida (' + rubric.errores.join(' ') + '). Avisa a dirección.' };
  }
  if (cfgBool('resultados_cerrados', false)) {
    return { ok: false, error: 'Los resultados ya están cerrados: no se reciben más evaluaciones.' };
  }
  return conBloqueo(function () {
    var mySheet = hojaDeJurado(sesion.alias);
    var registro = buscarPorCodigo(datos.code);
    if (!registro) return { ok: false, error: 'Código no encontrado.' };

    var forced = esVerdadero(datos.forzar) && sesion.rol === ROL.ADMIN;
    if (normalizarEstado(registro.audition_status) !== ESTADO.REALIZADA &&
        normalizarEstado(registro.attendance_status) !== ESTADO.REALIZADA && !forced) {
      return { ok: false, error: 'Este participante aún no tiene la audición marcada como REALIZADA.' };
    }

    var existing = leerHoja(mySheet).filter(function (f) {
      return normalizarComparable(f.code) === normalizarComparable(registro.code);
    })[0];
    if (existing && normalizarComparable(existing.estado) === EVALUATION_STATE.ENVIADA) {
      return { ok: false, error: 'Esta evaluación ya fue enviada y está bloqueada. Solo dirección puede reabrirla.', bloqueada: true };
    }

    var ratings = {};
    var badValues = [];
    rubric.categorias.forEach(function (c) {
      var v = datos[c.id];
      if (v === undefined || v === null || v === '') { ratings[c.id] = ''; return; }
      if (!esPuntajeValido(v)) { badValues.push(c.corta); ratings[c.id] = ''; return; }
      ratings[c.id] = Number(v);
    });
    if (badValues.length) {
      return { ok: false, error: 'Cada categoría se califica de ' + RATING_MIN + ' a ' + RATING_MAX + ' (revisa: ' + badValues.join(', ') + ').' };
    }

    var calc = calcularPuntajeJurado(ratings, rubric.categorias);
    var submit = esVerdadero(datos.enviar);
    if (submit && !calc.valido) {
      var names = rubric.categorias.filter(function (c) { return calc.faltantes.indexOf(c.id) !== -1; }).map(function (c) { return c.corta; });
      return { ok: false, error: 'Para enviar faltan: ' + names.join(', ') + '.', faltantes: calc.faltantes };
    }

    var dqCause = normalizarComparable(datos.dq_causa);
    var dqFlag = esVerdadero(datos.dq_flag) && DQ_CAUSES.some(function (c) { return c.id === dqCause; });
    if (esVerdadero(datos.dq_flag) && !dqFlag) return { ok: false, error: 'Elige la causal de descalificación.' };

    var now = ahoraISO();
    var row = {
      code: registro.code,
      artistic_name: registro.artistic_name,
      discipline: projectGenre(registro),
      presentation_format: registro.presentation_format || '',
      rubric_version: rubric.version,
      rubric_fingerprint: rubric.fingerprint,
      total: calc.valido ? calc.total : '',
      desempate: calc.valido ? calc.desempate : '',
      estado: submit ? EVALUATION_STATE.ENVIADA : EVALUATION_STATE.BORRADOR,
      observaciones: String(datos.observaciones || '').slice(0, 900),
      dq_flag: dqFlag ? 'TRUE' : 'FALSE',
      dq_causa: dqFlag ? dqCause : '',
      dq_nota: dqFlag ? String(datos.dq_nota || '').slice(0, 500) : '',
      evaluado_at: now,
      enviado_at: submit ? now : '',
      evaluado_by: sesion.alias
    };
    rubric.categorias.forEach(function (c) { row[c.id] = ratings[c.id]; });

    if (existing) actualizarFila(mySheet, existing._fila, row);
    else agregarFila(mySheet, row);

    registrar(sesion.alias, sesion.rol, submit ? 'EVALUACION_ENVIADA' : 'EVALUACION_BORRADOR', registro.code,
              calc.valido ? 'total=' + calc.total : 'parcial');

    if (dqFlag) reportDisqualification(registro, dqCause, row.dq_nota, sesion);

    return {
      code: registro.code, hoja: mySheet, estado: row.estado, total: calc.valido ? calc.total : null,
      detalle: calc.detalle, bloqueada: submit,
      mensaje: submit ? 'Evaluación enviada y bloqueada: ' + calc.total + ' / ' + rubricMaxTotal(rubric.categorias) + ' puntos.'
                      : 'Borrador guardado.'
    };
  });
}

// ---------------------------------------------------------------------------
// Corrections and disqualifications (authorized roles only)
// ---------------------------------------------------------------------------

/** Reopens a submitted card so its juror can correct it. Direction/admin, with a reason. */
function accionReabrirEvaluacion(datos, sesion) {
  var reason = normalizarTexto(datos.motivo);
  if (reason.length < 5) return { ok: false, error: 'Escribe el motivo de la corrección.' };
  if (cfgBool('resultados_cerrados', false)) return { ok: false, error: 'Los resultados están cerrados. Primero hay que reabrirlos.' };
  var juror = parseInt(datos.jurado, 10);
  if (!(juror >= 1 && juror <= 3)) return { ok: false, error: 'Jurado inválido.' };
  return conBloqueo(function () {
    var sheetName = 'JURADO_' + juror;
    var card = leerHoja(sheetName).filter(function (f) { return normalizarComparable(f.code) === normalizarComparable(datos.code); })[0];
    if (!card) return { ok: false, error: 'Ese jurado no tiene evaluación para ' + datos.code + '.' };
    if (normalizarComparable(card.estado) !== EVALUATION_STATE.ENVIADA) return { ok: false, error: 'La evaluación no está enviada: el jurado ya puede editarla.' };
    actualizarFila(sheetName, card._fila, {
      estado: EVALUATION_STATE.BORRADOR, reabierta_at: ahoraISO(), reabierta_by: sesion.alias, reabierta_motivo: reason.slice(0, 400)
    });
    registrar(sesion.alias, sesion.rol, 'EVALUACION_REABIERTA', card.code, 'jurado=' + juror + ' total_previo=' + card.total + ' motivo=' + reason);
    return { ok: true, code: card.code, jurado: juror, mensaje: 'Evaluación reabierta. El jurado ' + juror + ' puede corregirla y volver a enviarla.' };
  });
}

/** A juror's report opens a PENDING disqualification; one open report per project and juror. */
function reportDisqualification(registro, cause, note, sesion) {
  var open = leerHoja(HOJA.DESCALIFICACIONES).filter(function (d) {
    return normalizarComparable(d.code) === normalizarComparable(registro.code) &&
           normalizarComparable(d.reportado_por) === normalizarComparable(sesion.alias) &&
           normalizarComparable(d.estado) === DQ_STATUS.PENDIENTE;
  })[0];
  if (open) return open.dq_id;
  var id = nuevoId('DQ');
  agregarFila(HOJA.DESCALIFICACIONES, {
    dq_id: id, code: registro.code, submission_id: registro.submission_id, causa: cause, nota: note || '',
    reportado_por: sesion.alias, reportado_at: ahoraISO(), estado: DQ_STATUS.PENDIENTE,
    resuelto_por: '', resuelto_at: '', motivo: ''
  });
  if (normalizarComparable(registro.dq_status) !== DQ_STATUS.VALIDADA) {
    actualizarFila(HOJA.REGISTRO, registro._fila, { dq_status: DQ_STATUS.PENDIENTE });
  }
  registrar(sesion.alias, sesion.rol, 'DQ_REPORTADA', registro.code, cause);
  return id;
}

function accionListarDescalificaciones() {
  var causes = {};
  DQ_CAUSES.forEach(function (c) { causes[c.id] = c.etiqueta; });
  return {
    causales: DQ_CAUSES,
    reportes: leerHoja(HOJA.DESCALIFICACIONES).map(function (d) {
      return {
        dq_id: d.dq_id, code: d.code, causa: d.causa, causa_texto: causes[normalizarComparable(d.causa)] || d.causa,
        nota: d.nota, reportado_por: d.reportado_por, reportado_at: humanDateTime(d.reportado_at),
        estado: d.estado, resuelto_por: d.resuelto_por, motivo: d.motivo
      };
    })
  };
}

/** Direction/admin validates (the project leaves the ranking) or dismisses a report. */
function accionResolverDescalificacion(datos, sesion) {
  var decision = normalizarComparable(datos.decision);
  if (decision !== DQ_STATUS.VALIDADA && decision !== DQ_STATUS.DESCARTADA) return { ok: false, error: 'Decisión inválida.' };
  var reason = normalizarTexto(datos.motivo);
  if (reason.length < 5) return { ok: false, error: 'Documenta el motivo de la decisión.' };
  return conBloqueo(function () {
    var report = leerHoja(HOJA.DESCALIFICACIONES).filter(function (d) { return d.dq_id === datos.dq_id; })[0];
    if (!report) return { ok: false, error: 'Reporte no encontrado.' };
    if (normalizarComparable(report.estado) !== DQ_STATUS.PENDIENTE) return { ok: false, error: 'Ese reporte ya fue resuelto.' };
    actualizarFila(HOJA.DESCALIFICACIONES, report._fila, {
      estado: decision, resuelto_por: sesion.alias, resuelto_at: ahoraISO(), motivo: reason.slice(0, 500)
    });
    var registro = buscarPorCodigo(report.code);
    if (registro) {
      var stillOpen = leerHoja(HOJA.DESCALIFICACIONES).some(function (d) {
        return d.dq_id !== report.dq_id && normalizarComparable(d.code) === normalizarComparable(report.code) &&
               normalizarComparable(d.estado) === DQ_STATUS.PENDIENTE;
      });
      var status = decision === DQ_STATUS.VALIDADA ? DQ_STATUS.VALIDADA
        : (normalizarComparable(registro.dq_status) === DQ_STATUS.VALIDADA ? DQ_STATUS.VALIDADA : (stillOpen ? DQ_STATUS.PENDIENTE : ''));
      actualizarFila(HOJA.REGISTRO, registro._fila, { dq_status: status });
    }
    registrar(sesion.alias, sesion.rol, decision === DQ_STATUS.VALIDADA ? 'DQ_VALIDADA' : 'DQ_DESCARTADA', report.code, reason);
    return { ok: true, dq_id: report.dq_id, estado: decision };
  });
}

/** "2026-10-23 20:41" from an ISO stamp, for staff screens. */
function humanDateTime(value) {
  if (!value) return '';
  var d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return Utilities.formatDate(d, zonaHoraria(), 'yyyy-MM-dd HH:mm');
}
