/**
 * EL BUNKER - Materialised views.
 *
 * REGISTRO is the single source of truth. AGENDA, CHECK-IN, RESULTADOS and
 * DASHBOARD are rebuilt from it, which is precisely why a participant can never
 * show one schedule on one tab and a different one on another.
 */

function refrescarVistas() {
  var filas = leerHoja(HOJA.REGISTRO);
  return {
    agenda: reconstruirAgenda(filas),
    check_in: reconstruirCheckIn(filas),
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
  var conCodigo = filas.filter(function (r) { return normalizarTexto(r.code); });

  conCodigo.sort(function (a, b) {
    var ba = Number(a.final_block || a.original_block || 99);
    var bb = Number(b.final_block || b.original_block || 99);
    if (ba !== bb) return ba - bb;
    return String(a.code) < String(b.code) ? -1 : 1;
  });

  var datos = conCodigo.map(function (r) {
    return {
      code: r.code, full_name: r.full_name, artistic_name: r.artistic_name,
      discipline: r.discipline,
      final_block: r.final_block || r.original_block,
      arrival_time: r.arrival_time,
      final_time: r.final_time || r.original_time,
      check_in_time: r.check_in_time || '',
      attendance_status: r.attendance_status || ESTADO.CONFIRMADO,
      audition_status: r.audition_status || '',
      operador_check_in: r.operador_check_in || '',
      notes: r.notes || ''
    };
  });
  agregarFilas(HOJA.CHECK_IN, datos);
  return datos.length;
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
      discipline: r.discipline,
      audition_status: r.audition_status || r.attendance_status,
      tarjetas: tarjetasPorCodigo[normalizarComparable(r.code)] || []
    };
  });

  var seleccion = seleccionarTop(artistas, {
    top: cfgNumero('top_seleccionados', 7),
    minimo_jurados: cfgNumero('minimo_jurados', 2)
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
      observacion: ''
    };
  });

  seleccion.excluidos.forEach(function (e) {
    datos.push({
      posicion: '', code: e.code, artistic_name: '', full_name: '', discipline: '',
      jurado_1: '', jurado_2: '', jurado_3: '', jurados_validos: e.jurados_validos || 0,
      artist_final: '', seleccionado: 'NO', requiere_comite: '', observacion: e.motivo
    });
  });

  agregarFilas(HOJA.RESULTADOS, datos);
  return datos.length;
}

/** Every indicator the brief asks for, written as label/value rows plus charts data. */
function reconstruirDashboard(filas) {
  var m = calcularMetricas(filas);
  var h = limpiarDatos(HOJA.DASHBOARD);

  var bloque = [
    ['INDICADOR', 'VALOR'],
    ['Inscritos (total de filas)', m.inscritos],
    ['Participantes unicos (por documento)', m.unicos],
    ['Duplicados marcados', m.duplicados],
    ['Aptos', m.aptos],
    ['Incompletos', m.incompletos],
    ['No cumplen requisitos', m.no_cumplen],
    ['En revision', m.revision],
    ['Con codigo definitivo', m.con_codigo],
    ['Cupos libres', m.cupos_libres],
    ['', ''],
    ['Confirmados (con turno, sin llegar)', m.confirmados],
    ['Reasignados (cambio aprobado)', m.reasignados],
    ['Cambios pendientes', m.cambios_pendientes],
    ['Check-ins realizados', m.check_ins],
    ['Audiciones realizadas', m.realizadas],
    ['No show', m.no_show],
    ['En contingencia', m.contingencia],
    ['No audicionados', m.no_audicionados],
    ['', ''],
    ['Avance de audiciones', m.avance_texto],
    ['Promedio global (audiciones validas)', m.promedio_global === null ? 'sin datos' : m.promedio_global],
    ['Requiere deliberacion del comite', m.requiere_comite ? 'SI' : 'NO'],
    ['Actualizado', ahoraISO()]
  ];

  h.getRange(1, 1, bloque.length, 2).setValues(bloque);

  // Chart 1: score distribution by range.
  var filaDist = bloque.length + 2;
  h.getRange(filaDist, 1).setValue('DISTRIBUCION DE PUNTAJES');
  var dist = [['Rango', 'Artistas']].concat(m.distribucion.map(function (d) { return [d.etiqueta, d.conteo]; }));
  h.getRange(filaDist + 1, 1, dist.length, 2).setValues(dist);

  // Chart 2: Top 7.
  var filaTop = filaDist + dist.length + 2;
  h.getRange(filaTop, 1).setValue('TOP ' + cfgNumero('top_seleccionados', 7));
  var top = [['Artista', 'Puntaje']].concat(m.top.map(function (t) {
    return [(t.artistic_name || t.code), t.artist_final];
  }));
  if (top.length === 1) top.push(['(sin resultados aun)', 0]);
  h.getRange(filaTop + 1, 1, top.length, 2).setValues(top);

  // Chart 3: participant states.
  var filaEstados = filaTop + top.length + 2;
  h.getRange(filaEstados, 1).setValue('ESTADO DE PARTICIPANTES');
  var estados = [['Estado', 'Cantidad'],
    ['Confirmados', m.confirmados], ['Check-in', m.check_ins],
    ['Realizadas', m.realizadas], ['No show', m.no_show],
    ['Contingencia', m.contingencia], ['No audicionados', m.no_audicionados]];
  h.getRange(filaEstados + 1, 1, estados.length, 2).setValues(estados);

  // Chart 4: progress per block.
  var filaBloques = filaEstados + estados.length + 2;
  h.getRange(filaBloques, 1).setValue('AVANCE POR BLOQUE');
  var bloques = [['Bloque', 'Realizadas', 'Asignados']].concat(m.por_bloque.map(function (b) {
    return ['Bloque ' + b.block_id + ' (' + b.ventana + ')', b.realizadas, b.asignados];
  }));
  h.getRange(filaBloques + 1, 1, bloques.length, 3).setValues(bloques);

  h.getRange(1, 1, 1, 2).setFontWeight('bold');
  return bloque.length;
}

/** All dashboard numbers in one place, reused by the web dashboard. */
function calcularMetricas(filas) {
  filas = filas || leerHoja(HOJA.REGISTRO);
  var resumen = resumenElegibilidad(filas);
  var cupo = cfgNumero('cupo_total', 100);

  var conteo = { confirmados: 0, check_ins: 0, realizadas: 0, no_show: 0,
                 contingencia: 0, no_audicionados: 0, incidentes: 0, reasignados: 0 };

  var cfgAgenda = agendaConfigurada();
  var porBloque = {};
  for (var b = 1; b <= cfgAgenda.bloques; b++) {
    porBloque[b] = { block_id: b, ventana: horarioDeBloque(b, cfgAgenda).ventana, asignados: 0, realizadas: 0 };
  }

  filas.forEach(function (r) {
    if (!normalizarTexto(r.code)) return;
    var e = normalizarEstado(r.attendance_status || ESTADO.CONFIRMADO);
    if (e === ESTADO.CONFIRMADO) conteo.confirmados++;
    else if (e === ESTADO.CHECK_IN) conteo.check_ins++;
    else if (e === ESTADO.REALIZADA) conteo.realizadas++;
    else if (e === ESTADO.NO_SHOW) conteo.no_show++;
    else if (e === ESTADO.CONTINGENCIA) conteo.contingencia++;
    else if (e === ESTADO.NO_AUDICIONADO) conteo.no_audicionados++;
    else if (e === ESTADO.INCIDENTE) conteo.incidentes++;

    if (normalizarComparable(r.change_status) === 'APROBADO') conteo.reasignados++;

    var bloque = Number(r.final_block || r.original_block || 0);
    if (porBloque[bloque]) {
      porBloque[bloque].asignados++;
      if (e === ESTADO.REALIZADA) porBloque[bloque].realizadas++;
    }
  });

  var cambios = leerHoja(HOJA.CAMBIOS);
  var pendientes = cambios.filter(function (c) { return normalizarComparable(c.estado) === 'PENDIENTE'; }).length;

  var resultados = leerHoja(HOJA.RESULTADOS).filter(function (r) { return r.artist_final !== '' && r.artist_final !== undefined; });
  var notas = resultados.map(function (r) { return Number(r.artist_final); }).filter(isFinite);
  var promedio = notas.length ? redondear(notas.reduce(function (s, v) { return s + v; }, 0) / notas.length, 2) : null;

  var ranking = resultados
    .filter(function (r) { return r.posicion !== '' && r.posicion !== undefined; })
    .map(function (r) { return { code: r.code, artistic_name: r.artistic_name, artist_final: Number(r.artist_final) }; })
    .sort(function (a, b) { return b.artist_final - a.artist_final; });

  var objetivo = resumen.con_codigo || cupo;

  return {
    inscritos: resumen.total, unicos: resumen.unicos, duplicados: resumen.duplicado,
    aptos: resumen.apto, incompletos: resumen.incompleto, no_cumplen: resumen.no_cumple,
    revision: resumen.revision, con_codigo: resumen.con_codigo,
    cupos_libres: Math.max(0, cupo - resumen.con_codigo),
    confirmados: conteo.confirmados, check_ins: conteo.check_ins,
    realizadas: conteo.realizadas, no_show: conteo.no_show,
    contingencia: conteo.contingencia, no_audicionados: conteo.no_audicionados,
    reasignados: conteo.reasignados, cambios_pendientes: pendientes,
    avance: objetivo ? redondear((conteo.realizadas / objetivo) * 100, 1) : 0,
    avance_texto: conteo.realizadas + ' de ' + objetivo + ' (' +
                  (objetivo ? redondear((conteo.realizadas / objetivo) * 100, 1) : 0) + '%)',
    promedio_global: promedio,
    distribucion: distribucionPuntajes(ranking),
    top: ranking.slice(0, cfgNumero('top_seleccionados', 7)),
    por_bloque: Object.keys(porBloque).map(function (k) { return porBloque[k]; }),
    requiere_comite: leerHoja(HOJA.RESULTADOS).some(function (r) { return normalizarComparable(r.requiere_comite) === 'SI'; })
  };
}

function accionDashboard() {
  return { metricas: calcularMetricas() };
}

function accionResultados(datos, sesion) {
  refrescarVistas();
  var filas = leerHoja(HOJA.RESULTADOS);
  return {
    top: filas.filter(function (r) { return normalizarComparable(r.seleccionado) === 'SI'; }),
    ranking: filas.filter(function (r) { return r.posicion !== '' && r.posicion !== undefined; }),
    excluidos: filas.filter(function (r) { return r.observacion; }),
    requiere_comite: filas.some(function (r) { return normalizarComparable(r.requiere_comite) === 'SI'; })
  };
}
