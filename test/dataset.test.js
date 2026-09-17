/**
 * Integration test over the fictitious dataset.
 *
 * Runs the real pipeline (validate -> detect duplicates -> issue codes) over the
 * 130 generated submissions and asserts the outcome the brief demands:
 * exactly 100 definitive codes, everything else in a correct state.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { cargarCore } = require('./loader');
const { describe, it, expect, ejecutar } = require('./runner');

const C = cargarCore();
// The seed generator is pure; load it into the same context.
vm.runInContext(
  fs.readFileSync(path.join(__dirname, '..', 'apps-script', '41_seed.gs'), 'utf8')
    .replace(/function cargarDatosDePrueba[\s\S]*$/, ''),   // drop Apps-Script-only parts
  C, { filename: '41_seed.gs' }
);

const OPC = { fecha_evento: '2026-10-02', edad_minima: 18, edad_maxima: 28, exigir_video: false };

/** Replays what accionInscribir does, without Google Sheets. */
function procesarDataset() {
  const crudas = C.construirDatasetPrueba(130);
  const almacenadas = [];
  const vistosIdem = new Set();
  let repetidos = 0;

  crudas.forEach((f, i) => {
    if (vistosIdem.has(f.client_submission_id)) { repetidos++; return; }   // idempotency
    vistosIdem.add(f.client_submission_id);

    const veredicto = C.validarInscripcion(f, OPC);
    const candidato = {
      submission_id: 'S-' + String(i).padStart(4, '0'),
      normalized_id_number: C.normalizarCedula(f.id_number),
      normalized_email: C.normalizarEmail(f.email),
      normalized_phone: C.normalizarTelefono(f.whatsapp)
    };
    const dup = C.detectarDuplicado(candidato, almacenadas);

    let estado = veredicto.eligibility_status;
    if (dup.duplicate_flag) estado = 'DUPLICADO';
    else if (dup.alerta && estado === 'APTO') estado = 'REVISION';

    almacenadas.push(Object.assign({}, candidato, {
      eligibility_status: estado,
      duplicate_flag: dup.duplicate_flag,
      duplicate_reason: dup.duplicate_reason,
      code: '',
      created_at: '2026-09-20T10:00:' + String(i % 60).padStart(2, '0') + '.000Z',
      _origen: f
    }));
  });

  return { almacenadas, repetidos, crudas };
}

const R = procesarDataset();

describe('Dataset de prueba: generacion', () => {
  it('genera 131 envios (130 + 1 reintento identico)', () => {
    expect(R.crudas).toHaveLength(131);
  });
  it('es determinista: dos corridas producen lo mismo', () => {
    const a = JSON.stringify(C.construirDatasetPrueba(130));
    const b = JSON.stringify(C.construirDatasetPrueba(130));
    expect(a === b).toBe(true);
  });
  it('QA: el reintento identico NO crea una segunda fila (idempotencia)', () => {
    expect(R.repetidos).toBe(1);
    expect(R.almacenadas).toHaveLength(130);
  });
});

describe('Dataset de prueba: estados de validacion', () => {
  const porEstado = {};
  R.almacenadas.forEach(r => { porEstado[r.eligibility_status] = (porEstado[r.eligibility_status] || 0) + 1; });

  it('detecta los 2 duplicados por documento', () => {
    expect(porEstado.DUPLICADO).toBe(2);
  });
  it('detecta al menos un NO_CUMPLE por edad y uno por residencia', () => {
    expect(porEstado.NO_CUMPLE >= 3).toBe(true);
  });
  it('detecta los INCOMPLETO sembrados', () => {
    expect(porEstado.INCOMPLETO >= 4).toBe(true);
  });
  it('marca en REVISION el video dudoso y las alertas de correo/telefono', () => {
    expect(porEstado.REVISION >= 3).toBe(true);
  });
  it('quedan mas de 100 APTO, que es lo que hace significativa la prueba de cupo', () => {
    expect(porEstado.APTO > 100).toBe(true);
  });
  it('cada fila tiene exactamente un estado conocido', () => {
    const conocidos = ['APTO', 'INCOMPLETO', 'NO_CUMPLE', 'REVISION', 'DUPLICADO'];
    const desconocidos = R.almacenadas.filter(r => conocidos.indexOf(r.eligibility_status) === -1);
    expect(desconocidos).toHaveLength(0);
  });
});

describe('Dataset de prueba: asignacion de los 100 codigos', () => {
  const asignacion = C.asignarCodigos(R.almacenadas, { cupo: 100, responsable: 'qa' });

  it('QA CENTRAL: se emiten EXACTAMENTE 100 codigos definitivos', () => {
    expect(asignacion.asignados).toHaveLength(100);
    expect(asignacion.total_con_codigo).toBe(100);
  });
  it('el primero es B-001 y el ultimo B-100', () => {
    expect(asignacion.asignados[0].code).toBe('B-001');
    expect(asignacion.asignados[99].code).toBe('B-100');
  });
  it('no hay codigos repetidos', () => {
    const codigos = asignacion.asignados.map(a => a.code);
    expect(new Set(codigos).size).toBe(100);
  });
  it('los que sobran quedan explicitamente sin cupo, no perdidos', () => {
    expect(asignacion.sin_cupo.length > 0).toBe(true);
    asignacion.sin_cupo.forEach(s => expect(s.motivo).toBe('CUPO_LLENO'));
  });
  it('ningun DUPLICADO / INCOMPLETO / NO_CUMPLE recibio codigo', () => {
    const conCodigo = new Set(asignacion.asignados.map(a => a.submission_id));
    const indebidos = R.almacenadas.filter(r =>
      conCodigo.has(r.submission_id) && r.eligibility_status !== 'APTO');
    expect(indebidos).toHaveLength(0);
  });
  it('cada codigo cae en un bloque valido de 1 a 10', () => {
    const fuera = asignacion.asignados.filter(a => {
      const b = C.bloqueDeNumero(C.numeroDeCodigo(a.code));
      return !b || b < 1 || b > 10;
    });
    expect(fuera).toHaveLength(0);
  });
  it('los 10 bloques quedan con exactamente 10 participantes', () => {
    const conteo = {};
    asignacion.asignados.forEach(a => {
      const b = C.bloqueDeNumero(C.numeroDeCodigo(a.code));
      conteo[b] = (conteo[b] || 0) + 1;
    });
    for (let b = 1; b <= 10; b++) expect(conteo[b]).toBe(10);
  });
});

describe('Dataset de prueba: jornada completa y Top 7', () => {
  const asignacion = C.asignarCodigos(R.almacenadas, { cupo: 100 });
  const conCodigo = asignacion.asignados.map(a => a.code);

  // Simulate the day: most audition, some no-show, some contingency.
  const artistas = conCodigo.map((code, idx) => {
    let estado = 'REALIZADA';
    if (idx % 17 === 0) estado = 'NO SHOW';
    else if (idx % 23 === 0) estado = 'CONTINGENCIA';

    const semilla = (idx * 7919) % 100;
    const nota = 4 + (semilla % 7);
    const puntajes = {};
    ['talento','performance','identidad','repertorio','profesionalismo','presencia','digital','proyecto']
      .forEach((k, j) => { puntajes[k] = Math.max(1, Math.min(10, nota + ((idx + j) % 3) - 1)); });

    return {
      code, artistic_name: 'PRUEBA-' + code, audition_status: estado,
      tarjetas: [1, 2, 3].map(j => ({
        jurado: j,
        puntajes: Object.keys(puntajes).reduce((acc, k) => {
          acc[k] = Math.max(1, Math.min(10, puntajes[k] + ((j + idx) % 3) - 1));
          return acc;
        }, {})
      }))
    };
  });

  const seleccion = C.seleccionarTop(artistas, { top: 7, minimo_jurados: 2 });

  it('selecciona exactamente 7 artistas', () => {
    expect(seleccion.top).toHaveLength(7);
  });
  it('los 7 salen SOLO de audiciones REALIZADA', () => {
    const realizadas = new Set(artistas.filter(a => a.audition_status === 'REALIZADA').map(a => a.code));
    seleccion.top.forEach(t => expect(realizadas.has(t.code)).toBe(true));
  });
  it('el ranking esta ordenado de mayor a menor', () => {
    for (let i = 1; i < seleccion.ranking.length; i++) {
      expect(seleccion.ranking[i - 1].artist_final >= seleccion.ranking[i].artist_final).toBe(true);
    }
  });
  it('los excluidos declaran su motivo', () => {
    expect(seleccion.excluidos.length > 0).toBe(true);
    seleccion.excluidos.forEach(e => expect(!!e.motivo).toBe(true));
  });
  it('todo puntaje final esta en la escala 0-100', () => {
    seleccion.ranking.forEach(a => {
      expect(a.artist_final >= 0 && a.artist_final <= 100).toBe(true);
    });
  });
  it('nadie audicionado queda sin posicion en el ranking', () => {
    const realizadas = artistas.filter(a => a.audition_status === 'REALIZADA').length;
    expect(seleccion.ranking).toHaveLength(realizadas);
  });
});

describe('Cierre de jornada sobre el dataset', () => {
  it('QA: tras el cierre nadie queda en un estado intermedio', () => {
    const registros = [];
    for (let i = 1; i <= 100; i++) {
      const estados = ['REALIZADA', 'CHECK-IN', 'CONTINGENCIA', 'NO SHOW', 'CONFIRMADO'];
      registros.push({ code: C.formatearCodigo(i), attendance_status: estados[i % estados.length] });
    }
    const cierre = C.cerrarJornada(registros, { responsable: 'qa' });
    const aplicados = {};
    cierre.cambios.forEach(c => { aplicados[c.code] = c.hacia; });

    registros.forEach(r => {
      const final = aplicados[r.code] || r.attendance_status;
      expect(final === 'REALIZADA' || final === 'NO AUDICIONADO').toBe(true);
    });
  });
});

process.exit(ejecutar());
