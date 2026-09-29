/**
 * EL BUNKER - Materialised views.
 *
 * REGISTRO (+ _INTEGRANTES for group members) is the single source of truth.
 * AGENDA, CHECK-IN, AGRUPACIONES, PISTAS, RESULTADOS and DASHBOARD are rebuilt
 * from it, which is precisely why a participant can never show one schedule on
 * one tab and a different one on another.
 */

/**
 * Rebuilds every view sheet. Views are derived data, so they have their own lock (the user lock: the
 * web app always runs as the deploying user, so it is one lock for every execution) and are never
 * rebuilt while holding the data lock: measured live 2026-09-29, a rebuild took 40-63 s with 135
 * projects, and inside the data lock it kept every public registration waiting. A rebuild that finds
 * another one running skips (the running one, or the next action or trigger, brings the views up to date).
 */
function refrescarVistas() {
  var lock = LockService.getUserLock();
  if (!lock.tryLock(1000)) return { omitido: 'OTRA_ACTUALIZACION_EN_CURSO' };
  try {
    return rebuildViews();
  } finally {
    lock.releaseLock();
  }
}

/** Runs a data mutation under the data lock, then refreshes the views outside it (unless it was refused). */
function lockedThenRefresh(fn) {
  var out = conBloqueo(fn);
  if (!(out && out.ok === false)) out.vistas = refrescarVistas();
  return out;
}

function rebuildViews() {
  var filas = leerHoja(HOJA.REGISTRO);
  var out = {
    agenda: reconstruirAgenda(filas),
    check_in: reconstruirCheckIn(filas),
    agrupaciones: reconstruirAgrupaciones(filas),
    pistas: reconstruirPistas(filas),
    resultados: reconstruirResultados(filas),
    bolsa: reconstruirBolsa(filas),
    seguro: reconstruirSeguro(filas)
  };
  out.dashboard = reconstruirDashboard(leerHoja(HOJA.REGISTRO));
  return out;
}

function limpiarDatos(nombreHoja) {
  var h = hoja(nombreHoja);
  if (h.getLastRow() > 1) {
    h.getRange(2, 1, h.getLastRow() - 1, Math.max(1, h.getLastColumn())).clearContent();
  }
  return h;
}

function byBlockThenCode(a, b) {
  var ba = Number(a.final_block || a.original_block || 99);
  var bb = Number(b.final_block || b.original_block || 99);
  if (ba !== bb) return ba - bb;
  return String(a.code) < String(b.code) ? -1 : 1;
}

function reconstruirAgenda(filas) {
  limpiarDatos(HOJA.AGENDA);
  var cfgAgenda = agendaConfigurada();
  var ocupacion = bloquesConCupo(rowsWithOpenOffers(filas), cfgAgenda);
  var porBloque = {};
  ocupacion.forEach(function (o) { porBloque[o.block_id] = o; });

  var datos = construirAgenda(cfgAgenda).map(function (b) {
    var o = porBloque[b.block_id];
    return {
      block_id: b.block_id, ventana: b.ventana, arrival_time: b.arrival_time,
      audition_time: b.audition_time, limite_tolerancia: b.limite_tolerancia,
      codigo_desde: b.codigo_desde, codigo_hasta: b.codigo_hasta,
      asignados: o ? o.ocupados : '', cupo: o ? o.cupo : '',
      disponibles: o ? o.disponibles : ''
    };
  });
  agregarFilas(HOJA.AGENDA, datos);
  return datos.length;
}

function reconstruirCheckIn(filas) {
  limpiarDatos(HOJA.CHECK_IN);
  var members = membersByGroup();
  var conCodigo = filas.filter(function (r) { return normalizarTexto(r.code); }).sort(byBlockThenCode);

  var datos = conCodigo.map(function (r) {
    var v = deskView(r, members);
    return {
      code: r.code, full_name: r.full_name, artistic_name: r.artistic_name,
      discipline: projectGenre(r),
      final_block: v.final_block, arrival_time: v.arrival_time, final_time: v.final_time,
      check_in_time: r.check_in_time || '',
      attendance_status: r.attendance_status || ESTADO.CONFIRMADO,
      audition_status: r.audition_status || '',
      operador_check_in: r.operador_check_in || '',
      notes: r.notes || '',
      participation_mode: v.participation_mode,
      members_declared: v.members_declared,
      members_authorized: r.group_code ? v.members_authorized : '',
      track_status: r.track_status || '',
      precola_at: r.precola_at || '', stage_at: r.stage_at || '', done_at: r.done_at || ''
    };
  });
  agregarFilas(HOJA.CHECK_IN, datos);
  return datos.length;
}

/**
 * One master row per group and its members right below it, grouped so the
 * operator can collapse or expand each group (the XLSX export keeps the
 * outline). A group counts as one project: only master rows are projects.
 */
function reconstruirAgrupaciones(filas) {
  var sheet = limpiarDatos(HOJA.AGRUPACIONES);
  if (sheet.getMaxRows() > 1) {
    try { sheet.getRange(2, 1, sheet.getMaxRows() - 1, 1).shiftRowGroupDepth(-8); } catch (e) { /* no groups yet */ }
  }
  var members = leerHoja(HOJA.INTEGRANTES);
  var groups = filas.filter(function (r) { return normalizarTexto(r.group_code); });
  groups.sort(function (a, b) { return String(a.group_code) < String(b.group_code) ? -1 : 1; });

  var out = [];
  var spans = [];
  groups.forEach(function (g) {
    var summary = groupSummary(g.group_code, members);
    out.push({
      row_type: 'PROYECTO', group_code: g.group_code, project_code: g.code || '',
      submission_id: g.submission_id, group_display_name: g.group_display_name || g.artistic_name,
      group_match_key: g.group_match_key, match_status: g.group_match_status || '',
      leader_name: g.full_name, leader_id_number: g.id_number, leader_whatsapp: g.whatsapp, leader_email: g.email,
      members_declared: g.members_declared, members_registered: summary.registered,
      members_authorized: summary.authorized, genre: projectGenre(g), eligibility_status: g.eligibility_status
    });
    var first = out.length;
    summary.list.forEach(function (m) {
      out.push({
        row_type: 'INTEGRANTE', group_code: g.group_code, project_code: g.code || '',
        submission_id: g.submission_id, group_display_name: g.group_display_name || g.artistic_name,
        member_id: m.member_id, member_name: m.full_name, member_id_number: m.id_number, member_age: m.age,
        member_role: (isCrew(m) ? 'EQUIPO DE TRABAJO: ' + (CREW_ROLE_LABELS[m.crew_role] || m.crew_role) : m.artistic_role) +
                     (esVerdadero(m.is_leader) ? ' (lider)' : ''),
        member_consents: ['T:' + (esVerdadero(m.consent_terms) ? 'SI' : 'NO'), 'D:' + (esVerdadero(m.consent_data) ? 'SI' : 'NO'),
                          'I:' + (esVerdadero(m.consent_image) ? 'SI' : 'NO')].join(' '),
        member_signature: normalizarTexto(m.signature_file_id) ? 'SI' : 'NO',
        member_status: m.member_status, member_alert: m.member_alert
      });
    });
    if (summary.list.length) spans.push({ start: first + 2, count: summary.list.length, master: first + 1 });
  });

  agregarFilas(HOJA.AGRUPACIONES, out);
  spans.forEach(function (s) { sheet.getRange(s.start, 1, s.count, 1).shiftRowGroupDepth(1); });
  // One call for every project row (one call per group cost ~0.25 s each, live 2026-09-29).
  if (spans.length) {
    try {
      var lastCol = sheet.getLastColumn();
      sheet.getRange(2, 1, Math.max(1, out.length), lastCol).setFontWeight('normal');
      sheet.getRangeList(spans.map(function (s) { return sheet.getRange(s.master, 1, 1, lastCol).getA1Notation(); }))
        .setFontWeight('bold');
    } catch (e) { /* cosmetic */ }
  }
  try {
    sheet.setRowGroupControlPosition(SpreadsheetApp.GroupControlTogglePosition.BEFORE);
    sheet.collapseAllRowGroups();
  } catch (e) { /* cosmetic: grouping still works without it */ }
  return groups.length;
}

/** What the audio technician works from, in agenda order. */
function reconstruirPistas(filas) {
  limpiarDatos(HOJA.PISTAS);
  // Only people with a seat: a track can only be sent with a code (same rule as the panel lists).
  var rows = filas.filter(function (r) { return normalizarTexto(r.code); }).sort(byBlockThenCode);
  var datos = rows.map(function (r) {
    return {
      code: r.code, artistic_name: r.artistic_name || r.full_name, participation_mode: r.participation_mode,
      song_name: r.song_name, track_uses: esVerdadero(r.track_uses) ? 'SI' : 'NO', track_method: r.track_method,
      track_status: r.track_status || (esVerdadero(r.track_uses) ? TRACK_STATUS.PENDIENTE : TRACK_STATUS.NO_APLICA),
      track_file_name: r.track_file_name, track_file_url: driveFileUrl(r.track_file_id),
      track_updated_at: r.track_updated_at, track_notes: r.track_notes,
      final_block: r.final_block || r.original_block, final_time: clockText(r.final_time || r.original_time)
    };
  });
  agregarFilas(HOJA.PISTAS, datos);
  return datos.length;
}

/** Committee decisions in force: at most one per cut (10 and 20). */
function currentDeliberations() {
  var byCut = {};
  leerHoja(HOJA.DELIBERACIONES).forEach(function (x) {
    if (normalizarComparable(x.status) !== 'VIGENTE') return;
    byCut[String(x.cut_position)] = {
      deliberation_id: x.deliberation_id, cut_position: Number(x.cut_position),
      codes_in_order: String(x.codes_in_order || '').split(',').filter(Boolean),
      method: x.method || '', participants: x.participants || '', result: x.result || '', at: x.at, by: x.by
    };
  });
  return Object.keys(byCut).map(function (k) { return byCut[k]; });
}

/** Legacy single-decision accessor (last one in force), kept for older callers. */
function currentDeliberation() {
  var all = currentDeliberations();
  return all.length ? all[all.length - 1] : null;
}

/** The whole ranking computation from the source sheets: one function, used by views, panel and exports. */
function computeResults(filas) {
  var rubric = activeRubricCategories();
  var cards = evaluationCards();
  var artists = filas.filter(function (r) { return normalizarTexto(r.code); }).map(function (r) {
    return {
      code: r.code, artistic_name: r.artistic_name, full_name: r.full_name, discipline: projectGenre(r),
      audition_status: r.audition_status || r.attendance_status,
      dq_status: normalizarComparable(r.dq_status),
      tarjetas: sentCards(cards[normalizarComparable(r.code)])
    };
  });
  return seleccionarTop(artists, {
    top_publico: cfgNumero('top_seleccionados', 10),
    top_privado: cfgNumero('top_privado', 20),
    minimo_jurados: cfgNumero('minimo_jurados', 3),
    rubrica: rubric,
    deliberaciones: currentDeliberations(),
    resultados_cerrados: cfgBool('resultados_cerrados', false)
  });
}

/**
 * Writes RESULTADOS (private: Top 20, Top 10, ties, disqualifications) and persists
 * evaluation_status / ranking_status into REGISTRO so every screen and export reads the same.
 */
function reconstruirResultados(filas) {
  limpiarDatos(HOJA.RESULTADOS);
  var sel = computeResults(filas);
  var cards = evaluationCards();
  var applied = {};
  sel.deliberaciones_aplicadas.forEach(function (d) { applied[d.cut] = d.deliberation_id; });

  var datos = sel.ranking.map(function (a) {
    var byJuror = { 1: '', 2: '', 3: '' };
    a.totales_jurado.forEach(function (t) { byJuror[t.jurado] = t.total; });
    var notes = [];
    if (a.ranking_status === RANKING_STATUS.TIE_REVIEW_REQUIRED) notes.push('Empate en el corte: requiere revisión humana (acta).');
    Object.keys(applied).forEach(function (cut) { if (a.posicion <= Number(cut) + 5) notes.push('Acta ' + applied[cut] + ' (corte ' + cut + ')'); });
    if (a.dq_pendiente) notes.push('Reporte de descalificación PENDIENTE de validar.');
    return {
      posicion: a.posicion, code: a.code, artistic_name: a.artistic_name, full_name: a.full_name, discipline: a.discipline,
      jurado_1: byJuror[1], jurado_2: byJuror[2], jurado_3: byJuror[3], jurados_validos: a.jurados_validos,
      artist_final: a.artist_final, tie_break: a.tie_break, ranking_status: a.ranking_status,
      seleccionado: a.ranking_status === RANKING_STATUS.TOP10_SELECCIONADO ? 'SI' : 'NO',
      requiere_comite: a.ranking_status === RANKING_STATUS.TIE_REVIEW_REQUIRED ? 'SI' : '',
      dq: a.dq_pendiente ? DQ_STATUS.PENDIENTE : '', observacion: notes.join(' ')
    };
  });
  sel.excluidos.forEach(function (e) {
    datos.push({
      posicion: '', code: e.code, artistic_name: e.artistic_name || '', full_name: '', discipline: '',
      jurado_1: '', jurado_2: '', jurado_3: '', jurados_validos: e.jurados_validos || 0, artist_final: '', tie_break: '',
      ranking_status: RANKING_STATUS.SIN_RANKING, seleccionado: 'NO', requiere_comite: '',
      dq: e.motivo === 'DESCALIFICADO' ? DQ_STATUS.VALIDADA : '', observacion: e.motivo
    });
  });
  sel.deliberaciones_descartadas.forEach(function (d) {
    registrar('sistema', '', 'DELIBERACION_NO_APLICA', d.deliberation_id, 'corte ' + d.cut + ': ' + d.motivo);
  });
  agregarFilas(HOJA.RESULTADOS, datos);

  // Persist the per-project statuses (only rows that changed).
  var ranking = {};
  sel.ranking.forEach(function (a) { ranking[normalizarComparable(a.code)] = a.ranking_status; });
  var jurors = cfgNumero('jurados', 3);
  var closed = cfgBool('resultados_cerrados', false);
  var updates = [];
  filas.forEach(function (r) {
    var code = normalizarComparable(r.code);
    var evaluation = code ? evaluationStatusOf(cards[code] || [], { jurados: jurors, dq_status: normalizarComparable(r.dq_status),
                                                                     resultados_cerrados: closed }) : '';
    var rank = code ? (ranking[code] || RANKING_STATUS.SIN_RANKING) : '';
    if (normalizarComparable(r.evaluation_status) !== evaluation || normalizarComparable(r.ranking_status) !== rank) {
      updates.push({ fila: r._fila, cambios: { evaluation_status: evaluation, ranking_status: rank } });
    }
  });
  actualizarFilasEnLote(HOJA.REGISTRO, updates);
  return datos.length;
}

/** BOLSA: every eligible project in priority order, plus the open offer of each substitute. */
function reconstruirBolsa(filas) {
  limpiarDatos(HOJA.BOLSA);
  var offers = leerHoja(HOJA.OFERTAS);
  var pool = computePool(filas, poolOptions());
  var bySubmission = {};
  filas.forEach(function (r) { bySubmission[r.submission_id] = r; });
  var pending = {};
  offers.forEach(function (o) { if (normalizarComparable(o.estado) === OFFER_STATUS.PENDIENTE) pending[o.submission_id] = o; });
  var datos = pool.filas.slice().sort(function (a, b) {
    return (Number(a.priority_rank) || 99999) - (Number(b.priority_rank) || 99999);
  }).map(function (p) {
    var r = bySubmission[p.submission_id] || {};
    var o = pending[p.submission_id];
    return {
      priority_rank: p.priority_rank, pool_status: p.pool_status, code: r.code || '', submission_id: p.submission_id,
      artistic_name: r.artistic_name || '', participation_mode: r.participation_mode || 'SOLISTA',
      created_at: String(r.created_at || '').replace('T', ' ').slice(0, 19),
      eligibility_status: normalizeEligibility(r.eligibility_status),
      participation_status: participationStatus(r, !!o),
      oferta: o ? o.slot_code + ' (vence ' + humanDateTime(o.expires_at) + ')' : '',
      observacion: r.previous_code ? 'Tuvo el cupo ' + r.previous_code : ''
    };
  });
  agregarFilas(HOJA.BOLSA, datos);
  return datos.length;
}

/** SEGURO_MAYORCA: people of every project holding a slot, for the venue policy (private). */
function reconstruirSeguro(filas) {
  limpiarDatos(HOJA.SEGURO);
  if (typeof insuranceRows !== 'function') return 0;
  var datos = insuranceRows(filas, leerHoja(HOJA.INTEGRANTES));
  agregarFilas(HOJA.SEGURO, datos);
  return datos.length;
}

/** Every indicator the brief asks for, written as label/value rows. The dashboard is private. */
function reconstruirDashboard(filas) {
  var m = calcularMetricas(filas);
  var h = limpiarDatos(HOJA.DASHBOARD);
  if (h.getLastRow() > 0) h.getRange(1, 1, h.getMaxRows(), Math.max(3, h.getMaxColumns())).clearContent();

  var bloque = [
    ['INDICADOR', 'VALOR'],
    ['Inscripciones recibidas (filas)', m.inscritos],
    ['Por revisar (RECIBIDO) / en revisión', m.recibidos + ' / ' + m.revision],
    ['Aptos / no aptos / incompletos / duplicados', m.aptos + ' / ' + m.no_cumplen + ' / ' + m.incompletos + ' / ' + m.duplicados],
    ['Personas únicas (por documento)', m.unicos],
    ['Solistas / dúos / agrupaciones', m.solistas + ' / ' + m.duos + ' / ' + m.agrupaciones],
    ['', ''],
    ['Bolsa: principales con turno / suplentes / fuera de bolsa', m.bolsa.principales + ' / ' + m.bolsa.suplentes + ' / ' + m.bolsa.fuera],
    ['Retirados / reemplazos aceptados', m.bolsa.retirados + ' / ' + m.bolsa.reemplazos],
    ['Cupos: con titular / ofrecidos / liberados / vacantes / sin emitir',
      m.cupos.ASIGNADO + ' / ' + m.cupos.OFRECIDO + ' / ' + m.cupos.LIBERADO + ' / ' + m.cupos.VACANTE_SIN_REEMPLAZO + ' / ' + m.cupos.SIN_EMITIR],
    ['Confirmación final: sí / no / sin respuesta', m.confirmacion.si + ' / ' + m.confirmacion.no + ' / ' + m.confirmacion.sin_respuesta],
    ['Lista oficial', m.lista_oficial],
    ['', ''],
    ['Cambios solicitados / aprobados / rechazados / pendientes',
      m.cambios.solicitados + ' / ' + m.cambios.aprobados + ' / ' + m.cambios.rechazados + ' / ' + m.cambios.pendientes],
    ['Intérpretes autorizados / registrados / declarados (con código)',
      m.integrantes.autorizados + ' / ' + m.integrantes.registrados + ' / ' + m.integrantes.declarados],
    ['Proyectos con firmas completas', m.integrantes.grupos_completos + ' de ' + m.integrantes.grupos_con_codigo],
    ['Equipo de trabajo registrado (no ocupa cupo)', m.integrantes.equipo],
    ['Pistas pendientes / recibidas / validadas / con problema',
      (m.pistas['PISTA PENDIENTE'] || 0) + ' / ' + (m.pistas['PISTA RECIBIDA'] || 0) + ' / ' +
      (m.pistas['PISTA VALIDADA'] || 0) + ' / ' + (m.pistas['PISTA CON PROBLEMA'] || 0)],
    ['Correos enviados / en cola / con error', m.correos.ENVIADO + ' / ' + m.correos.PENDIENTE + ' / ' + (m.correos.FALLIDO + m.correos.ERROR)],
    ['', ''],
    ['Confirmados (con turno, sin llegar)', m.confirmados],
    ['Check-in / precola / en audición', m.check_ins + ' / ' + m.precola + ' / ' + m.en_audicion],
    ['Audiciones realizadas', m.realizadas],
    ['No show / contingencia / no audicionados', m.no_show + ' / ' + m.contingencia + ' / ' + m.no_audicionados],
    ['Avance de audiciones', m.avance_texto],
    ['Evaluaciones completas / parciales / sin calificar', m.evaluaciones.COMPLETA + m.evaluaciones.BLOQUEADA + ' / ' + m.evaluaciones.PARCIAL + ' / ' + m.evaluaciones.SIN_CALIFICAR],
    ['Descalificaciones pendientes / validadas', m.evaluaciones.DQ_PENDIENTE + ' / ' + m.evaluaciones.DESCALIFICADO],
    ['Promedio global (proyectos con 3 jurados)', m.promedio_global === null ? 'sin datos' : m.promedio_global],
    ['Empates que requieren acta', m.requiere_comite ? 'SI' : 'NO'],
    ['Resultados cerrados', m.resultados_cerrados ? 'SI' : 'NO'],
    ['Actualizado', ahoraISO()]
  ];
  h.getRange(1, 1, bloque.length, 2).setValues(bloque);

  var fila = bloque.length + 2;
  function seccion(titulo, tabla) {
    h.getRange(fila, 1).setValue(titulo);
    h.getRange(fila + 1, 1, tabla.length, tabla[0].length).setValues(tabla);
    fila += tabla.length + 2;
  }
  seccion('INDICADOR OPERATIVO (' + m.operativo.hora + ')', [
    ['Bloque actual', m.operativo.etiqueta], ['Esperados', m.operativo.esperados],
    ['Check-in', m.operativo.check_in], ['Realizadas', m.operativo.realizadas],
    ['No show', m.operativo.no_show], ['Contingencia', m.operativo.contingencia]
  ]);
  seccion('DISTRIBUCIÓN DE PUNTAJES (promedio por proyecto)', [['Rango', 'Proyectos']].concat(m.distribucion.map(function (d) { return [d.etiqueta, d.conteo]; })));
  var top = [['Posición', 'Proyecto', 'Puntaje final', 'Estado']].concat(m.top20.map(function (t) {
    return [t.posicion, (t.artistic_name || t.code) + ' (' + t.code + ')', scoreText(t.artist_final), t.ranking_status];
  }));
  if (top.length === 1) top.push(['', '(sin resultados aún)', '', '']);
  seccion('TOP ' + m.top_privado + ' PRIVADO (los primeros ' + m.top_n + ' son los seleccionados públicos)', top);
  seccion('AVANCE POR BLOQUE', [['Bloque', 'Realizadas', 'Asignados']].concat(m.por_bloque.map(function (b) {
    return ['Bloque ' + b.block_id + ' (' + b.ventana + ')', b.realizadas, b.asignados];
  })));

  h.getRange(1, 1, 1, 2).setFontWeight('bold');
  return bloque.length;
}

/**
 * The operational indicator: which block is running and how it is going.
 * `hora` (HH:MM) lets the rehearsal and the dashboard simulate a moment.
 */
function operationalIndicator(filas, hora) {
  var cfgAgenda = agendaConfigurada();
  var hhmm = hora || horaActual();
  var phase = currentBlock(horaAMinutos(hhmm), cfgAgenda);
  var out = { hora: hhmm, fase: phase.phase, bloque: phase.block_id, esperados: 0, check_in: 0,
              realizadas: 0, no_show: 0, contingencia: 0, etiqueta: '' };
  filas.forEach(function (r) {
    if (!normalizarTexto(r.code)) return;
    var e = normalizarEstado(r.attendance_status || ESTADO.CONFIRMADO);
    if (e === ESTADO.CONTINGENCIA) out.contingencia++;
    if (phase.block_id && Number(r.final_block || r.original_block) === phase.block_id) {
      out.esperados++;
      if ([ESTADO.CHECK_IN, ESTADO.PRECOLA, ESTADO.EN_AUDICION, ESTADO.REALIZADA].indexOf(e) !== -1) out.check_in++;
      if (e === ESTADO.REALIZADA) out.realizadas++;
      if (e === ESTADO.NO_SHOW) out.no_show++;
    }
  });
  var labels = { ANTES: 'Antes de iniciar', MARGEN: 'Margen operativo', CONTINGENCIA: 'Contingencia',
                 CERRADO: 'Audiciones cerradas', DESCONOCIDO: 'Hora desconocida' };
  out.etiqueta = phase.block_id
    ? blockLabel(phase.block_id, cfgAgenda) + ' (' + horarioDeBloque(phase.block_id, cfgAgenda).ventana + ')'
    : labels[phase.phase];
  return out;
}

/** All dashboard numbers in one place, reused by the web dashboard. */
function calcularMetricas(filas, hora) {
  filas = filas || leerHoja(HOJA.REGISTRO);
  var resumen = resumenElegibilidad(filas);
  var cupo = cfgNumero('cupo_total', 100);

  var conteo = { confirmados: 0, check_ins: 0, precola: 0, en_audicion: 0, realizadas: 0, no_show: 0,
                 contingencia: 0, no_audicionados: 0, incidentes: 0, reasignados: 0, horarios: 0 };
  var pistas = {}, videos = {};

  var cfgAgenda = agendaConfigurada();
  var porBloque = {};
  var lastBlock = marginAvailable(cfgAgenda) ? marginBlockId(cfgAgenda) : cfgAgenda.bloques;
  for (var b = 1; b <= lastBlock; b++) {
    porBloque[b] = { block_id: b, etiqueta: blockLabel(b, cfgAgenda), ventana: horarioDeBloque(b, cfgAgenda).ventana,
                     asignados: 0, realizadas: 0 };
  }

  var members = leerHoja(HOJA.INTEGRANTES);
  var integrantes = { declarados: 0, registrados: 0, autorizados: 0, grupos_con_codigo: 0, grupos_completos: 0 };

  filas.forEach(function (r) {
    if (normalizarTexto(r.video_url)) {
      var vs = r.video_check_status || VIDEO_STATUS.PENDIENTE;
      videos[vs] = (videos[vs] || 0) + 1;
    }
    if (!normalizarTexto(r.code)) return;
    var e = normalizarEstado(r.attendance_status || ESTADO.CONFIRMADO);
    if (e === ESTADO.CONFIRMADO) conteo.confirmados++;
    else if (e === ESTADO.CHECK_IN) conteo.check_ins++;
    else if (e === ESTADO.PRECOLA) conteo.precola++;
    else if (e === ESTADO.EN_AUDICION) conteo.en_audicion++;
    else if (e === ESTADO.REALIZADA) conteo.realizadas++;
    else if (e === ESTADO.NO_SHOW) conteo.no_show++;
    else if (e === ESTADO.CONTINGENCIA) conteo.contingencia++;
    else if (e === ESTADO.NO_AUDICIONADO) conteo.no_audicionados++;
    else if (e === ESTADO.INCIDENTE) conteo.incidentes++;
    if (normalizarTexto(r.final_time || r.original_time)) conteo.horarios++;
    if (normalizarComparable(r.change_status) === 'APROBADO') conteo.reasignados++;

    var ts = r.track_status || (esVerdadero(r.track_uses) ? TRACK_STATUS.PENDIENTE : TRACK_STATUS.NO_APLICA);
    pistas[ts] = (pistas[ts] || 0) + 1;

    var teamCode = teamCodeOf(r);
    if (teamCode) {
      var s = groupSummary(teamCode, members);
      var declared = Number(r.members_declared) || 1;
      integrantes.grupos_con_codigo++;
      integrantes.declarados += declared;
      integrantes.registrados += s.registered;
      integrantes.autorizados += s.authorized;
      if (declared && s.authorized >= declared) integrantes.grupos_completos++;
    }

    var bloque = Number(r.final_block || r.original_block || 0);
    if (porBloque[bloque]) {
      porBloque[bloque].asignados++;
      if (e === ESTADO.REALIZADA) porBloque[bloque].realizadas++;
    }
  });

  var cambios = leerHoja(HOJA.CAMBIOS);
  var cambiosResumen = { solicitados: cambios.length, pendientes: 0, aprobados: 0, rechazados: 0 };
  cambios.forEach(function (c) {
    var st = normalizarComparable(c.estado);
    if (st === 'PENDIENTE') cambiosResumen.pendientes++;
    else if (st === 'APROBADO') cambiosResumen.aprobados++;
    else if (st === 'RECHAZADO') cambiosResumen.rechazados++;
  });

  var resultados = leerHoja(HOJA.RESULTADOS).filter(function (r) { return r.artist_final !== '' && r.artist_final !== undefined; });
  var notas = resultados.map(function (r) { return Number(r.artist_final); }).filter(isFinite);
  var promedio = notas.length ? redondear(notas.reduce(function (s, v) { return s + v; }, 0) / notas.length, 2) : null;

  var ranking = resultados
    .filter(function (r) { return r.posicion !== '' && r.posicion !== undefined; })
    .map(function (r) { return { code: r.code, artistic_name: r.artistic_name, artist_final: Number(r.artist_final),
                                 posicion: Number(r.posicion), seleccionado: r.seleccionado,
                                 ranking_status: r.ranking_status }; })
    .sort(function (a, b) { return a.posicion - b.posicion; });

  var offers = leerHoja(HOJA.OFERTAS);
  var pool = computePool(filas, poolOptions());
  var slotCounts = { ASIGNADO: 0, OFRECIDO: 0, LIBERADO: 0, VACANTE_SIN_REEMPLAZO: 0, SIN_EMITIR: 0 };
  slotStatuses(filas, offers, poolOptions()).forEach(function (sl) { slotCounts[sl.status] = (slotCounts[sl.status] || 0) + 1; });
  var confirmation = { si: 0, no: 0, sin_respuesta: 0 };
  var evaluations = { SIN_CALIFICAR: 0, PARCIAL: 0, COMPLETA: 0, BLOQUEADA: 0, DQ_PENDIENTE: 0, DESCALIFICADO: 0 };
  filas.forEach(function (r) {
    if (normalizarTexto(r.code)) {
      var fc = normalizarComparable(r.final_confirmation);
      if (fc === 'SI') confirmation.si++; else confirmation.sin_respuesta++;
      var ev = normalizarComparable(r.evaluation_status);
      if (evaluations[ev] !== undefined && normalizarEstado(r.audition_status || r.attendance_status) === ESTADO.REALIZADA) evaluations[ev]++;
    } else if (normalizarComparable(r.final_confirmation) === 'NO') confirmation.no++;
  });
  var mailCounts = { ENVIADO: 0, PENDIENTE: 0, ERROR: 0, FALLIDO: 0, OMITIDO: 0, ENVIANDO: 0 };
  leerHoja(HOJA.EMAIL_LOG).forEach(function (e) { var st = normalizarComparable(e.status); mailCounts[st] = (mailCounts[st] || 0) + 1; });
  var crewCount = members.filter(function (mm) { return normalizePersonRole(mm.person_role) === PERSON_ROLE.EQUIPO_TRABAJO; }).length;

  var objetivo = resumen.con_codigo || cupo;

  return {
    inscritos: resumen.total, validos: resumen.validos, unicos: resumen.unicos, duplicados: resumen.duplicado,
    aptos: resumen.apto, incompletos: resumen.incompleto, no_cumplen: resumen.no_cumple, recibidos: resumen.recibido,
    revision: resumen.revision, con_codigo: resumen.con_codigo, horarios: conteo.horarios,
    bolsa: { principales: pool.principales, suplentes: pool.suplentes, fuera: pool.fuera,
             retirados: filas.filter(isWithdrawn).length,
             reemplazos: filas.filter(function (r) { return /^reemplazo:/.test(String(r.issued_by || '')); }).length },
    cupos: slotCounts, confirmacion: confirmation, evaluaciones: evaluations, correos: mailCounts,
    lista_oficial: cfgBool('lista_oficial_bloqueada', false) ? 'CONSOLIDADA (' + cfg('lista_oficial_version', '') + ')' : 'ABIERTA',
    resultados_cerrados: cfgBool('resultados_cerrados', false),
    top20: ranking.filter(function (r) { return r.posicion <= cfgNumero('top_privado', 20); }),
    top_privado: cfgNumero('top_privado', 20),
    solistas: resumen.solistas, duos: resumen.duos, agrupaciones: resumen.agrupaciones,
    cupos_libres: Math.max(0, cupo - resumen.con_codigo),
    confirmados: conteo.confirmados, check_ins: conteo.check_ins, precola: conteo.precola,
    en_audicion: conteo.en_audicion, realizadas: conteo.realizadas, no_show: conteo.no_show,
    contingencia: conteo.contingencia, no_audicionados: conteo.no_audicionados,
    reasignados: conteo.reasignados, cambios_pendientes: cambiosResumen.pendientes, cambios: cambiosResumen,
    integrantes: Object.assign(integrantes, { equipo: crewCount }), pistas: pistas, videos: videos,
    avance: objetivo ? redondear((conteo.realizadas / objetivo) * 100, 1) : 0,
    avance_texto: conteo.realizadas + ' de ' + objetivo + ' (' +
                  (objetivo ? redondear((conteo.realizadas / objetivo) * 100, 1) : 0) + '%)',
    promedio_global: promedio,
    distribucion: distribucionPuntajes(ranking),
    top: ranking.filter(function (r) { return normalizarComparable(r.seleccionado) === 'SI'; }),
    top_n: cfgNumero('top_seleccionados', 10),
    por_bloque: Object.keys(porBloque).map(function (k) { return porBloque[k]; }),
    operativo: operationalIndicator(filas, hora),
    requiere_comite: leerHoja(HOJA.RESULTADOS).some(function (r) { return normalizarComparable(r.requiere_comite) === 'SI'; }),
    entorno: entorno()
  };
}

function accionDashboard(datos, sesion) {
  var m = calcularMetricas(null, datos && horaAMinutos(datos.hora) !== null ? datos.hora : null);
  // Scores and ranking are direction's ('resultados'); logistics shares this screen for operations only.
  if (!sesion || !puede(sesion.rol, 'resultados')) {
    m.top20 = []; m.top = []; m.distribucion = []; m.promedio_global = null; m.ranking_oculto = true;
  }
  return { metricas: m };
}

function accionResultados(datos, sesion) {
  refrescarVistas();
  var filas = leerHoja(HOJA.RESULTADOS);
  var ranked = filas.filter(function (r) { return r.posicion !== '' && r.posicion !== undefined; });
  var dq = accionListarDescalificaciones();
  return {
    top_publico: cfgNumero('top_seleccionados', 10),
    top_privado: cfgNumero('top_privado', 20),
    top: ranked.filter(function (r) { return normalizarComparable(r.ranking_status) === RANKING_STATUS.TOP10_SELECCIONADO; }),
    top20: ranked.filter(function (r) { return Number(r.posicion) <= cfgNumero('top_privado', 20); }),
    ranking: ranked,
    excluidos: filas.filter(function (r) { return r.observacion && !r.posicion; }),
    requiere_comite: filas.some(function (r) { return normalizarComparable(r.requiere_comite) === 'SI'; }),
    empatados: filas.filter(function (r) { return normalizarComparable(r.requiere_comite) === 'SI'; })
      .map(function (r) { return { code: r.code, artistic_name: r.artistic_name, artist_final: r.artist_final,
                                   tie_break: r.tie_break, posicion: r.posicion }; }),
    cortes: tiedCuts(),
    deliberaciones: currentDeliberations(),
    metodos_desempate: TIE_METHODS,
    descalificaciones: dq.reportes,
    resultados_cerrados: cfgBool('resultados_cerrados', false),
    rubrica_version: activeRubric().version
  };
}

/** The cuts (10 / 20) that currently hold an unresolved tie, with the tied codes of each. */
function tiedCuts() {
  var sel = computeResults(leerHoja(HOJA.REGISTRO));
  return sel.cortes.map(function (c) {
    return { cut: c.cut, empatados: c.empatados.map(function (a) {
      return { code: a.code, artistic_name: a.artistic_name, artist_final: a.artist_final, tie_break: a.tie_break };
    }) };
  });
}
