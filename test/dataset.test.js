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

const OPC = { fecha_evento: '2026-10-23', edad_minima: 18, edad_maxima: 30, exigir_video: false, integrantes_max: 15 };

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
    const mode = C.normalizeParticipationMode(f.participation_mode);
    const groupKey = C.isGroupMode(mode) ? C.groupMatchKey(f.artistic_name) : '';
    const groupMatch = groupKey
      ? C.detectGroupMatch({ submission_id: candidato.submission_id, group_match_key: groupKey }, almacenadas)
      : { match: false };

    let estado = veredicto.eligibility_status;
    if (dup.duplicate_flag) estado = 'DUPLICADO';
    else if ((dup.alerta || groupMatch.match) && estado === 'APTO') estado = 'REVISION';

    almacenadas.push(Object.assign({}, candidato, {
      participation_mode: mode,
      group_code: C.isGroupMode(mode) ? C.formatGroupCode(C.nextGroupNumber(almacenadas)) : '',
      group_display_name: C.isGroupMode(mode) ? f.artistic_name : '',
      group_match_key: groupKey,
      group_match_status: groupMatch.match ? 'POSIBLE_REPETIDA' : '',
      members_declared: f.members_declared,
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
  it('flags exactly the 4 seeded NO_CUMPLE (too young, too old, outside Sabaneta, 31 on the day)', () => {
    expect(porEstado.NO_CUMPLE).toBe(4);
  });
  it('flags exactly the 7 seeded INCOMPLETO (including a group without size and a duo of three)', () => {
    expect(porEstado.INCOMPLETO).toBe(7);
  });
  it('sends to REVISION the dubious video, the e-mail/phone alerts and the repeated group name', () => {
    expect(porEstado.REVISION).toBe(4);
  });
  it('leaves 113 APTO, more than the 100 seats, which is what makes the seat test meaningful', () => {
    expect(porEstado.APTO).toBe(113);
  });
  it('the person who turns exactly 30 on the event day is eligible', () => {
    expect(R.almacenadas[128].eligibility_status).toBe('APTO');
  });
  it('the repeated group keeps its original spelling and is flagged, not merged', () => {
    const repeated = R.almacenadas[125];
    expect(repeated._origen.artistic_name).toBe('EL ARTE ES LA SOLUCIÓN');
    expect(repeated.group_display_name).toBe('EL ARTE ES LA SOLUCIÓN');
    expect(repeated.group_match_status).toBe('POSIBLE_REPETIDA');
    expect(repeated.group_match_key).toBe(R.almacenadas[124].group_match_key);
  });
  it('issues group codes GRP-001.. in order and never reuses a number', () => {
    const codes = R.almacenadas.filter(r => r.group_code).map(r => r.group_code);
    expect(new Set(codes).size).toBe(codes.length);
    expect(codes[0]).toBe('GRP-001');
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

describe('Dataset de prueba: jornada completa y Top 8', () => {
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

  const seleccion = C.seleccionarTop(artistas, { top: 8, minimo_jurados: 2 });

  it('selects exactly 8 projects', () => {
    expect(seleccion.top).toHaveLength(8);
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

describe('Groups: one group is one seat, members never consume seats', () => {
  const asignacion = C.asignarCodigos(R.almacenadas, { cupo: 100 });
  const coded = new Set(asignacion.asignados.map(a => a.submission_id));
  const groupProjects = R.almacenadas.filter(r => r.group_code);
  const members = C.buildTestMembers(groupProjects.map(g => ({ group_code: g.group_code, members_declared: g.members_declared })));

  it('still issues exactly 100 codes although the dataset contains groups with several members', () => {
    expect(asignacion.asignados).toHaveLength(100);
    const people = R.almacenadas.length + members.length;
    expect(people > 130).toBe(true);
  });
  it('each coded group project holds exactly one code', () => {
    const perProject = {};
    asignacion.asignados.forEach(a => { perProject[a.submission_id] = (perProject[a.submission_id] || 0) + 1; });
    groupProjects.filter(g => coded.has(g.submission_id)).forEach(g => expect(perProject[g.submission_id]).toBe(1));
  });
  it('the repeated group waiting for review does not take a seat', () => {
    expect(coded.has(R.almacenadas[125].submission_id)).toBe(false);
  });
  it('the seeded member anomalies are caught by the member validation', () => {
    const opts = { fecha_evento: '2026-10-23', edad_minima: 18, firma_obligatoria: true };
    const statuses = members.map(m => C.validateMember(m, opts).status);
    expect(statuses.filter(s => s === 'NO CUMPLE')).toHaveLength(1);    // the 16-year-old
    expect(statuses.filter(s => s === 'INCOMPLETO')).toHaveLength(1);   // the missing signature
  });
});

describe('Test data never looks like real data', () => {
  it('every seed project carries a test-data marker that production refuses', () => {
    const raw = C.construirDatasetPrueba(130);
    expect(raw.filter(f => !C.isTestData(f))).toHaveLength(0);
  });
  it('a normal web submission is not mistaken for test data', () => {
    expect(C.isTestData({ source: 'web', email: 'ana@gmail.com', client_submission_id: 'Cabc123' })).toBe(false);
  });
});

process.exit(ejecutar());
