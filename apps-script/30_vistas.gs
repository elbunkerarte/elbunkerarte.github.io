/**
 * EL BUNKER - Materialised views.
 *
 * REGISTRO (+ _INTEGRANTES for group members) is the single source of truth.
 * AGENDA, CHECK-IN, AGRUPACIONES, PISTAS, RESULTADOS and DASHBOARD are rebuilt
 * from it, which is precisely why a participant can never show one schedule on
 * one tab and a different one on another.
 */

function refrescarVistas() {
  var filas = leerHoja(HOJA.REGISTRO);
  return {
    agenda: reconstruirAgenda(filas),
    check_in: reconstruirCheckIn(filas),
    agrupaciones: reconstruirAgrupaciones(filas),
    pistas: reconstruirPistas(filas),
    resultados: reconstruirResultados(filas),
    dashboard: reconstruirDashboard(filas)
  };
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
  var ocupacion = bloquesConCupo(filas, cfgAgenda);
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
        member_role: m.artistic_role + (esVerdadero(m.is_leader) ? ' (lider)' : ''),
        member_consents: ['T:' + (esVerdadero(m.consent_terms) ? 'SI' : 'NO'), 'D:' + (esVerdadero(m.consent_data) ? 'SI' : 'NO'),
                          'I:' + (esVerdadero(m.consent_image) ? 'SI' : 'NO')].join(' '),
        member_signature: normalizarTexto(m.signature_file_id) ? 'SI' : (esVerdadero(m.is_leader) ? 'FORMULARIO 1' : 'NO'),
        member_status: m.member_status, member_alert: m.member_alert
      });
    });
    if (summary.list.length) spans.push({ start: first + 2, count: summary.list.length, master: first + 1 });
  });

  agregarFilas(HOJA.AGRUPACIONES, out);
  spans.forEach(function (s) {
    sheet.getRange(s.start, 1, s.count, 1).shiftRowGroupDepth(1);
    try { sheet.getRange(s.master, 1, 1, sheet.getLastColumn()).setFontWeight('bold'); } catch (e) { /* cosmetic */ }
  });
  try {
    sheet.setRowGroupControlPosition(SpreadsheetApp.GroupControlTogglePosition.BEFORE);
    sheet.collapseAllRowGroups();
  } catch (e) { /* cosmetic: grouping still works without it */ }
  return groups.length;
}

/** What the audio technician works from, in agenda order. */
function reconstruirPistas(filas) {
  limpiarDatos(HOJA.PISTAS);
  var rows = filas.filter(function (r) { return normalizarTexto(r.code) || esVerdadero(r.track_uses); }).sort(byBlockThenCode);
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

/** The committee decision currently in force, if any. */
function currentDeliberation() {
  var d = leerHoja(HOJA.DELIBERACIONES).filter(function (x) { return normalizarComparable(x.status) === 'VIGENTE'; });
  if (!d.length) return null;
  var last = d[d.length - 1];
  return { deliberation_id: last.deliberation_id, codes_in_order: String(last.codes_in_order || '').split(',') };
}

/** Joins the three jury sheets onto REGISTRO and writes the ranking. */
function reconstruirResultados(filas) {
  limpiarDatos(HOJA.RESULTADOS);

  var tarjetasPorCodigo = {};
  [HOJA.JURADO_1, HOJA.JURADO_2, HOJA.JURADO_3].forEach(function (nombre, idx) {
    leerHoja(nombre).forEach(function (f) {
      var code = normalizarComparable(f.code);
      if (!code) return;
      if (!tarjetasPorCodigo[code]) tarjetasPorCodigo[code] = [];
      var puntajes = {};
      RUBRICA.forEach(function (factor) { puntajes[factor.id] = f[factor.id]; });
      tarjetasPorCodigo[code].push({ jurado: idx + 1, puntajes: puntajes });
    });
  });

  var artistas = filas.filter(function (r) { return normalizarTexto(r.code); }).map(function (r) {
    return {
      code: r.code, artistic_name: r.artistic_name, full_name: r.full_name,
      discipline: projectGenre(r),
      audition_status: r.audition_status || r.attendance_status,
      tarjetas: tarjetasPorCodigo[normalizarComparable(r.code)] || []
    };
  });

  var seleccion = seleccionarTop(artistas, {
    top: cfgNumero('top_seleccionados', 7),
    minimo_jurados: cfgNumero('minimo_jurados', 2),
    deliberacion: currentDeliberation()
  });

  var enTop = {};
  seleccion.top.forEach(function (a) { enTop[a.code] = true; });
  var enEmpate = {};
  seleccion.empates_sin_resolver.forEach(function (a) { enEmpate[a.code] = true; });

  var datos = seleccion.ranking.map(function (a) {
    var porJurado = { 1: '', 2: '', 3: '' };
    a.totales_jurado.forEach(function (t) { porJurado[t.jurado] = t.total; });
    return {
      posicion: a.posicion, code: a.code, artistic_name: a.artistic_name,
      full_name: a.full_name, discipline: a.discipline,
      jurado_1: porJurado[1], jurado_2: porJurado[2], jurado_3: porJurado[3],
      jurados_validos: a.jurados_validos, artist_final: a.artist_final,
      seleccionado: enTop[a.code] ? 'SI' : 'NO',
      requiere_comite: enEmpate[a.code] ? 'SI' : '',
      observacion: seleccion.deliberacion_aplicada ? 'Desempate por ' + seleccion.deliberacion_aplicada : ''
    };
  });

  seleccion.excluidos.forEach(function (e) {
    datos.push({
      posicion: '', code: e.code, artistic_name: '', full_name: '', discipline: '',
      jurado_1: '', jurado_2: '', jurado_3: '', jurados_validos: e.jurados_validos || 0,
      artist_final: '', seleccionado: 'NO', requiere_comite: '', observacion: e.motivo
    });
  });
  if (seleccion.deliberacion_descartada) {
    registrar('sistema', '', 'DELIBERACION_NO_APLICA', '', seleccion.deliberacion_descartada);
  }

  agregarFilas(HOJA.RESULTADOS, datos);
  return datos.length;
}

/** Every indicator the brief asks for, written as label/value rows plus charts data. */
function reconstruirDashboard(filas) {
  var m = calcularMetricas(filas);
  var h = limpiarDatos(HOJA.DASHBOARD);
  if (h.getLastRow() > 0) h.getRange(1, 1, h.getMaxRows(), Math.max(3, h.getMaxColumns())).clearContent();

  var bloque = [
    ['INDICADOR', 'VALOR'],
    ['Inscripciones recibidas (filas)', m.inscritos],
    ['Validas (aptas + en revision)', m.validos],
    ['Personas unicas (por documento)', m.unicos],
    ['Duplicados marcados', m.duplicados],
    ['Aptos', m.aptos],
    ['Incompletos', m.incompletos],
    ['No cumplen requisitos', m.no_cumplen],
    ['En revision', m.revision],
    ['Solistas / duos / agrupaciones', m.solistas + ' / ' + m.duos + ' / ' + m.agrupaciones],
    ['Con codigo definitivo', m.con_codigo],
    ['Con horario asignado', m.horarios],
    ['Cupos libres', m.cupos_libres],
    ['', ''],
    ['Cambios solicitados / aprobados / rechazados / pendientes',
      m.cambios.solicitados + ' / ' + m.cambios.aprobados + ' / ' + m.cambios.rechazados + ' / ' + m.cambios.pendientes],
    ['Integrantes autorizados / registrados / declarados (con codigo)',
      m.integrantes.autorizados + ' / ' + m.integrantes.registrados + ' / ' + m.integrantes.declarados],
    ['Agrupaciones con autorizaciones completas', m.integrantes.grupos_completos + ' de ' + m.integrantes.grupos_con_codigo],
    ['Pistas pendientes / recibidas / validadas / con problema',
      (m.pistas['PISTA PENDIENTE'] || 0) + ' / ' + (m.pistas['PISTA RECIBIDA'] || 0) + ' / ' +
      (m.pistas['PISTA VALIDADA'] || 0) + ' / ' + (m.pistas['PISTA CON PROBLEMA'] || 0)],
    ['Videos accesibles / no accesibles / por revisar',
      (m.videos['ACCESIBLE'] || 0) + ' / ' + (m.videos['NO ACCESIBLE'] || 0) + ' / ' +
      ((m.videos['NO VERIFICABLE'] || 0) + (m.videos['PENDIENTE'] || 0))],
    ['', ''],
    ['Confirmados (con turno, sin llegar)', m.confirmados],
    ['Check-in / precola / en audicion', m.check_ins + ' / ' + m.precola + ' / ' + m.en_audicion],
    ['Audiciones realizadas', m.realizadas],
    ['No show', m.no_show],
    ['En contingencia', m.contingencia],
    ['No audicionados', m.no_audicionados],
    ['Avance de audiciones', m.avance_texto],
    ['Promedio global (audiciones validas)', m.promedio_global === null ? 'sin datos' : m.promedio_global],
    ['Requiere deliberacion del comite', m.requiere_comite ? 'SI' : 'NO'],
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
  seccion('DISTRIBUCION DE PUNTAJES', [['Rango', 'Artistas']].concat(m.distribucion.map(function (d) { return [d.etiqueta, d.conteo]; })));
  var top = [['Artista', 'Puntaje']].concat(m.top.map(function (t) { return [(t.artistic_name || t.code), t.artist_final]; }));
  if (top.length === 1) top.push(['(sin resultados aun)', 0]);
  seccion('TOP ' + cfgNumero('top_seleccionados', 7), top);
  seccion('ESTADO DE PARTICIPANTES', [['Estado', 'Cantidad'],
    ['Confirmados', m.confirmados], ['Check-in', m.check_ins], ['Precola', m.precola], ['En audicion', m.en_audicion],
    ['Realizadas', m.realizadas], ['No show', m.no_show], ['Contingencia', m.contingencia], ['No audicionados', m.no_audicionados]]);
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
    ? 'Bloque ' + phase.block_id + ' (' + horarioDeBloque(phase.block_id, cfgAgenda).ventana + ')'
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
  for (var b = 1; b <= cfgAgenda.bloques; b++) {
    porBloque[b] = { block_id: b, ventana: horarioDeBloque(b, cfgAgenda).ventana, asignados: 0, realizadas: 0 };
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

    if (r.group_code) {
      var s = groupSummary(r.group_code, members);
      var declared = Number(r.members_declared) || 0;
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
                                 posicion: Number(r.posicion), seleccionado: r.seleccionado }; })
    .sort(function (a, b) { return a.posicion - b.posicion; });

  var objetivo = resumen.con_codigo || cupo;

  return {
    inscritos: resumen.total, validos: resumen.validos, unicos: resumen.unicos, duplicados: resumen.duplicado,
    aptos: resumen.apto, incompletos: resumen.incompleto, no_cumplen: resumen.no_cumple,
    revision: resumen.revision, con_codigo: resumen.con_codigo, horarios: conteo.horarios,
    solistas: resumen.solistas, duos: resumen.duos, agrupaciones: resumen.agrupaciones,
    cupos_libres: Math.max(0, cupo - resumen.con_codigo),
    confirmados: conteo.confirmados, check_ins: conteo.check_ins, precola: conteo.precola,
    en_audicion: conteo.en_audicion, realizadas: conteo.realizadas, no_show: conteo.no_show,
    contingencia: conteo.contingencia, no_audicionados: conteo.no_audicionados,
    reasignados: conteo.reasignados, cambios_pendientes: cambiosResumen.pendientes, cambios: cambiosResumen,
    integrantes: integrantes, pistas: pistas, videos: videos,
    avance: objetivo ? redondear((conteo.realizadas / objetivo) * 100, 1) : 0,
    avance_texto: conteo.realizadas + ' de ' + objetivo + ' (' +
                  (objetivo ? redondear((conteo.realizadas / objetivo) * 100, 1) : 0) + '%)',
    promedio_global: promedio,
    distribucion: distribucionPuntajes(ranking),
    top: ranking.filter(function (r) { return normalizarComparable(r.seleccionado) === 'SI'; }),
    top_n: cfgNumero('top_seleccionados', 7),
    por_bloque: Object.keys(porBloque).map(function (k) { return porBloque[k]; }),
    operativo: operationalIndicator(filas, hora),
    requiere_comite: leerHoja(HOJA.RESULTADOS).some(function (r) { return normalizarComparable(r.requiere_comite) === 'SI'; }),
    entorno: entorno()
  };
}

function accionDashboard(datos) {
  return { metricas: calcularMetricas(null, datos && horaAMinutos(datos.hora) !== null ? datos.hora : null) };
}

function accionResultados(datos, sesion) {
  refrescarVistas();
  var filas = leerHoja(HOJA.RESULTADOS);
  return {
    top: filas.filter(function (r) { return normalizarComparable(r.seleccionado) === 'SI'; }),
    ranking: filas.filter(function (r) { return r.posicion !== '' && r.posicion !== undefined; }),
    excluidos: filas.filter(function (r) { return r.observacion && !r.posicion; }),
    requiere_comite: filas.some(function (r) { return normalizarComparable(r.requiere_comite) === 'SI'; }),
    empatados: filas.filter(function (r) { return normalizarComparable(r.requiere_comite) === 'SI'; })
      .map(function (r) { return { code: r.code, artistic_name: r.artistic_name, artist_final: r.artist_final }; }),
    deliberacion: currentDeliberation()
  };
}
