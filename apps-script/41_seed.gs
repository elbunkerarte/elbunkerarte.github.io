/**
 * EL BUNKER - Fictitious test dataset.
 *
 * Generates 130 submissions on purpose: more than the 100 seats, and salted
 * with every failure mode from the QA list, so running the real pipeline over
 * it proves that exactly 100 definitive codes are issued and everything else
 * lands in a correct, traceable state.
 *
 * Names and documents are invented. No real person's data is used.
 */

var NOMBRES_PRUEBA = ['Ana', 'Carlos', 'Daniela', 'Esteban', 'Farid', 'Gabriela', 'Hector',
  'Isabela', 'Julian', 'Karen', 'Luis', 'Manuela', 'Nicolas', 'Orlando', 'Paula',
  'Quintero', 'Rocio', 'Samuel', 'Tatiana', 'Uriel', 'Valeria', 'William', 'Ximena', 'Yeison', 'Zulma'];
var APELLIDOS_PRUEBA = ['Restrepo', 'Gomez', 'Arango', 'Zapata', 'Ospina', 'Cardona', 'Velez',
  'Mesa', 'Quintero', 'Betancur', 'Jaramillo', 'Munoz', 'Ramirez', 'Agudelo', 'Salazar'];
var SECTORES_PRUEBA = ['Aliadas del Sur', 'Betania', 'Calle del Banco', 'Holanda', 'La Doctora',
  'Los Alcazares', 'Maria Auxiliadora', 'Playa Rica', 'Restrepo Naranjo', 'San Joaquin', 'Vegas de la Doctora'];
var DISCIPLINAS_PRUEBA = ['Canto', 'Rap / Hip hop', 'Danza urbana', 'Danza contemporanea',
  'Musica instrumental', 'Teatro', 'Poesia / spoken word', 'DJ / produccion', 'Circo'];

function seudoAleatorio(semilla) {
  var s = semilla;
  return function () {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

/**
 * Builds the dataset in memory. Deterministic: the same seed always produces
 * the same 130 rows, so a failing QA run can be reproduced exactly.
 */
function construirDatasetPrueba(total) {
  total = total || 130;
  var azar = seudoAleatorio(20261002);
  var filas = [];
  var base = 1000000000;

  for (var i = 0; i < total; i++) {
    var nombre = NOMBRES_PRUEBA[Math.floor(azar() * NOMBRES_PRUEBA.length)];
    var apellido = APELLIDOS_PRUEBA[Math.floor(azar() * APELLIDOS_PRUEBA.length)];
    var apellido2 = APELLIDOS_PRUEBA[Math.floor(azar() * APELLIDOS_PRUEBA.length)];
    // Age is kept strictly inside 19..27 so that ONLY the deliberately seeded
    // rows below fall outside the 18-28 rule. Months are capped at September so
    // the birthday has already passed on 2 October and the age is exact.
    var edad = 19 + Math.floor(azar() * 9);                    // 19..27
    var anio = 2026 - edad;
    var mes = 1 + Math.floor(azar() * 9);                      // 1..9
    var dia = 1 + Math.floor(azar() * 28);

    var fila = {
      client_submission_id: 'SEED-' + i,
      full_name: nombre + ' ' + apellido + ' ' + apellido2,
      id_number: String(base + i * 137),
      birth_date: anio + '-' + (mes < 10 ? '0' : '') + mes + '-' + (dia < 10 ? '0' : '') + dia,
      neighborhood_sector: SECTORES_PRUEBA[Math.floor(azar() * SECTORES_PRUEBA.length)],
      resides_in_sabaneta: true,
      email: 'prueba' + i + '@ejemplo-bunker.test',
      whatsapp: '3' + String(100000000 + i * 7919).slice(0, 9),
      artistic_name: 'PRUEBA-' + String(i).padStart(3, '0'),
      discipline: DISCIPLINAS_PRUEBA[Math.floor(azar() * DISCIPLINAS_PRUEBA.length)],
      genre_or_proposal: 'Propuesta de prueba ' + i,
      artist_description: 'Descripcion ficticia para pruebas del sistema.',
      audition_description: 'Presenta una pieza de 3 minutos (dato ficticio).',
      video_url: 'https://www.youtube.com/watch?v=PRUEBA' + i,
      technical_needs: i % 4 === 0 ? 'Microfono' : 'Ninguna',
      availability_statement: true,
      accept_terms: true,
      accept_data_processing: true,
      accept_whatsapp_operational: true,
      accept_image_voice: i % 5 !== 0,
      source: 'seed'
    };

    // ---- Deliberate failure modes ----------------------------------------
    if (i === 110 || i === 111) {                  // duplicate by document
      fila.id_number = String(base);               // same as record 0
      fila.email = 'otro' + i + '@ejemplo-bunker.test';
    }
    if (i === 112) {                               // duplicate by email only -> alert
      fila.email = 'prueba1@ejemplo-bunker.test';
    }
    if (i === 113) {                               // duplicate by phone only -> alert
      fila.whatsapp = '3100000000';             // same number as record 0
    }
    if (i === 114) fila.birth_date = '2012-05-10';         // too young
    if (i === 115) fila.birth_date = '1990-03-22';         // too old
    if (i === 116) fila.resides_in_sabaneta = false;       // outside Sabaneta
    if (i === 117) fila.email = '';                        // incomplete
    if (i === 118) fila.accept_data_processing = false;    // consent missing
    if (i === 119) fila.video_url = 'lo tengo en el celular'; // review
    if (i === 120) fila.whatsapp = '6044441111';           // landline -> invalid
    if (i === 121) fila.birth_date = '31/02/2003';         // impossible date
    if (i === 122) fila.full_name = '';                    // incomplete

    filas.push(fila);
  }
  // Record 123: byte-identical retry of record 5 (same client_submission_id).
  var repetido = JSON.parse(JSON.stringify(filas[5]));
  filas.push(repetido);

  return filas;
}

/**
 * Loads the dataset through the REAL public endpoint, so the test exercises
 * validation, duplicate detection and idempotency exactly as production will.
 */
function cargarDatosDePrueba() {
  var filas = construirDatasetPrueba(130);
  var resultados = { total: filas.length, por_estado: {}, repetidos: 0 };

  filas.forEach(function (f) {
    var r = accionInscribir(f);
    if (r.repetido) resultados.repetidos++;
    var e = r.eligibility_status || 'ERROR';
    resultados.por_estado[e] = (resultados.por_estado[e] || 0) + 1;
  });

  registrar('sistema', 'admin', 'CARGAR_DATOS_PRUEBA', '', JSON.stringify(resultados));
  console.log(JSON.stringify(resultados, null, 2));
  return resultados;
}

/**
 * End-to-end rehearsal: loads the dataset, issues codes, simulates the event
 * day (check-ins, one late arrival, a no-show, contingency, the 21:30 close),
 * scores with three jurors and produces the Top 7.
 *
 * This is the "ensayo integral" of the 28-sep milestone, runnable on demand.
 */
function ensayoIntegral() {
  var informe = { pasos: [] };
  function paso(nombre, valor) {
    informe.pasos.push({ paso: nombre, resultado: valor });
    console.log(nombre + ': ' + JSON.stringify(valor));
  }

  var sesionAdmin = { ok: true, rol: ROL.ADMIN, alias: 'ensayo' };

  paso('1. Cargar dataset', cargarDatosDePrueba());
  paso('2. Revalidar', accionRevalidarTodo({}, sesionAdmin).resumen);

  var codigos = accionAsignarCodigos({}, sesionAdmin);
  paso('3. Asignar codigos', { asignados: codigos.asignados, sin_cupo: codigos.sin_cupo, total: codigos.total_con_codigo });

  // --- simulate the day -----------------------------------------------------
  var conCodigo = leerHoja(HOJA.REGISTRO).filter(function (r) { return normalizarTexto(r.code); });
  var realizadas = 0, noShow = 0, contingencia = 0;

  conCodigo.forEach(function (r, idx) {
    if (idx % 17 === 0) {                                   // no show
      accionRegistrarEstado({ code: r.code, estado: ESTADO.NO_SHOW }, sesionAdmin);
      noShow++;
    } else if (idx % 23 === 0) {                            // late -> contingency
      accionRegistrarEstado({ code: r.code, estado: ESTADO.CONTINGENCIA }, sesionAdmin);
      contingencia++;
    } else {
      accionRegistrarEstado({ code: r.code, estado: ESTADO.CHECK_IN }, sesionAdmin);
      accionRegistrarEstado({ code: r.code, estado: ESTADO.REALIZADA }, sesionAdmin);
      realizadas++;
    }
  });
  paso('4. Jornada simulada', { realizadas: realizadas, no_show: noShow, contingencia: contingencia });

  // --- three jurors ---------------------------------------------------------
  var azar = seudoAleatorio(777);
  [1, 2, 3].forEach(function (n) {
    var sesionJurado = { ok: true, rol: ROL.JURADO, alias: 'jurado-' + n };
    var hojaJ = 'JURADO_' + n;
    var filasJ = [];
    leerHoja(HOJA.REGISTRO).forEach(function (r) {
      if (normalizarEstado(r.audition_status) !== ESTADO.REALIZADA) return;
      var puntajes = {};
      RUBRICA.forEach(function (f) { puntajes[f.id] = 4 + Math.floor(azar() * 7); });   // 4..10
      var calculo = calcularPuntajeJurado(puntajes);
      var fila = { code: r.code, artistic_name: r.artistic_name, discipline: r.discipline,
                   total: calculo.total, valido: 'TRUE', observaciones: 'Ensayo integral',
                   evaluado_at: ahoraISO(), evaluado_by: 'jurado-' + n };
      RUBRICA.forEach(function (f) { fila[f.id] = puntajes[f.id]; });
      filasJ.push(fila);
    });
    limpiarDatos(hojaJ);
    agregarFilas(hojaJ, filasJ);
  });
  paso('5. Evaluaciones cargadas', { jurados: 3 });

  paso('6. Cerrar jornada', accionCerrarJornada({}, sesionAdmin));

  refrescarVistas();
  var resultados = accionResultados({}, sesionAdmin);
  paso('7. Top', resultados.top.map(function (t) {
    return { posicion: t.posicion, code: t.code, artista: t.artistic_name, puntaje: t.artist_final };
  }));
  paso('8. Requiere comite', resultados.requiere_comite);
  paso('9. Respaldo', accionRespaldar({}, sesionAdmin).xlsx.nombre);

  console.log('\n=== ENSAYO INTEGRAL COMPLETO ===');
  return informe;
}
