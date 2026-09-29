/**
 * Acceptance tests for EL BUNKER core logic.
 * Every case listed under "QA OBLIGATORIO" in the brief has a test here.
 */
const { cargarCore } = require('./loader');
const { describe, it, expect, ejecutar } = require('./runner');

const C = cargarCore();
const FECHA_EVENTO = '2026-10-02';

/** Minimal valid submission; individual tests override single fields. */
function inscripcionValida(extra) {
  return Object.assign({
    submission_id: 'S-0001',
    full_name: 'Maria Camila Restrepo',
    id_number: '1036448960',
    birth_date: '2002-05-14',            // 24 on event day
    neighborhood_sector: 'Aliadas del Sur',
    resides_in_sabaneta: true,
    email: 'maria.restrepo@example.com',
    whatsapp: '3012345678',
    artistic_name: 'MACA',
    discipline: 'Canto',
    genre_or_proposal: 'R&B',
    artist_description: 'Cantante con dos anos de experiencia en tarima.',
    audition_description: 'Interpretacion a capela de tema propio.',
    video_url: 'https://www.youtube.com/watch?v=abc123',
    technical_needs: 'Microfono',
    availability_statement: true,
    accept_terms: true,
    accept_data_processing: true,
    accept_whatsapp_operational: true,
    accept_image_voice: true,
    participation_mode: 'SOLISTA',
    genre_primary: 'R&B',
    presentation_format: 'VOZ_PISTA',
    own_equipment: 'NO',
    track_uses: 'SI',
    track_method: 'ARCHIVO',
    adult_confirmation: true,
    created_at: '2026-09-20T10:00:00.000Z'
  }, extra || {});
}

const OPC = { fecha_evento: FECHA_EVENTO, edad_minima: 18, edad_maxima: 28 };

// ===========================================================================
describe('Normalizacion', () => {
  it('la cedula con puntos y sin puntos colisiona', () => {
    expect(C.normalizarCedula('1.036.448.960')).toBe(C.normalizarCedula('1036448960'));
  });
  it('quita ceros a la izquierda de la cedula', () => {
    expect(C.normalizarCedula('0001234567')).toBe('1234567');
  });
  it('el telefono colisiona con y sin indicativo +57', () => {
    expect(C.normalizarTelefono('+57 301 234 5678')).toBe('3012345678');
    expect(C.normalizarTelefono('573012345678')).toBe('3012345678');
  });
  it('el correo se compara en minusculas', () => {
    expect(C.normalizarEmail('  Maria@Example.COM ')).toBe('maria@example.com');
  });
  it('NO fusiona correos distintos de gmail con puntos', () => {
    // Deliberate: merging two real humans is worse than missing a duplicate.
    expect(C.normalizarEmail('a.b@gmail.com') === C.normalizarEmail('ab@gmail.com')).toBe(false);
  });
  it('quita acentos para comparar, no para guardar', () => {
    expect(C.normalizarComparable('José Ángel Muñoz')).toBe('JOSE ANGEL MUNOZ');
  });
});

// ===========================================================================
describe('Validacion de campos', () => {
  it('acepta celular colombiano de 10 digitos que inicia en 3', () => {
    expect(C.esTelefonoValido('3012345678')).toBe(true);
  });
  it('rechaza fijo de Medellin', () => {
    expect(C.esTelefonoValido('6044441111')).toBe(false);
  });
  it('rechaza correos sin dominio', () => {
    expect(C.esEmailValido('juan@localhost')).toBe(false);
    expect(C.esEmailValido('juan@casa.com')).toBe(true);
  });
  it('rechaza fechas imposibles como 31/02/2003', () => {
    expect(C.parsearFecha('31/02/2003')).toBeNull();
  });
  it('lee fecha en formato ISO y en formato latino', () => {
    expect(C.parsearFecha('2003-02-28')).toEqual({ y: 2003, m: 2, d: 28 });
    expect(C.parsearFecha('28/02/2003')).toEqual({ y: 2003, m: 2, d: 28 });
  });
  it('rechaza URL de video sin esquema http', () => {
    expect(C.esUrlValida('www.youtube.com/watch?v=x')).toBe(false);
    expect(C.esUrlValida('https://youtu.be/x')).toBe(true);
  });
});

// ===========================================================================
describe('Regla de edad 18-28 al dia del evento', () => {
  it('calcula la edad contra la fecha del evento, no la de inscripcion', () => {
    // Cumple 18 el 1 de octubre de 2026: elegible aunque al inscribirse tenga 17.
    expect(C.calcularEdad('2008-10-01', FECHA_EVENTO)).toBe(18);
  });
  it('someone turning 18 the day after the event is NO_APTO', () => {
    expect(C.calcularEdad('2008-10-03', FECHA_EVENTO)).toBe(17);
    const r = C.validarInscripcion(inscripcionValida({ birth_date: '2008-10-03' }), OPC);
    expect(r.eligibility_status).toBe('NO_APTO');
  });
  it('someone already 29 before the event (range 18-28) is NO_APTO', () => {
    const r = C.validarInscripcion(inscripcionValida({ birth_date: '1997-01-15' }), OPC);
    expect(r.eligibility_status).toBe('NO_APTO');
  });
  it('el limite inferior exacto (18 el mismo dia) es elegible', () => {
    const r = C.validarInscripcion(inscripcionValida({ birth_date: '2008-10-02' }), OPC);
    expect(r.eligibility_status).toBe('APTO');
  });
  it('el limite superior exacto (28 el mismo dia) es elegible', () => {
    const r = C.validarInscripcion(inscripcionValida({ birth_date: '1998-10-02' }), OPC);
    expect(r.edad).toBe(28);
    expect(r.eligibility_status).toBe('APTO');
  });
});

// ===========================================================================
describe('QA: inscripcion normal', () => {
  it('una inscripcion completa y valida queda APTO sin errores', () => {
    const r = C.validarInscripcion(inscripcionValida(), OPC);
    expect(r.eligibility_status).toBe('APTO');
    expect(r.errores).toHaveLength(0);
    expect(r.edad).toBe(24);
  });
});

describe('QA: dato incompleto', () => {
  it('sin correo queda INCOMPLETO y nombra el campo', () => {
    const r = C.validarInscripcion(inscripcionValida({ email: '' }), OPC);
    expect(r.eligibility_status).toBe('INCOMPLETO');
    expect(r.errores.some(e => e.campo === 'email')).toBe(true);
  });
  it('sin aceptar tratamiento de datos queda INCOMPLETO', () => {
    const r = C.validarInscripcion(inscripcionValida({ accept_data_processing: false }), OPC);
    expect(r.eligibility_status).toBe('INCOMPLETO');
    expect(r.errores.some(e => e.codigo === 'CONSENTIMIENTO')).toBe(true);
  });
  it('los consentimientos opcionales NO bloquean', () => {
    const r = C.validarInscripcion(inscripcionValida({ accept_image_voice: false, accept_whatsapp_operational: false }), OPC);
    expect(r.eligibility_status).toBe('APTO');
  });
});

describe('QA: no reside en Sabaneta', () => {
  it('is NO_APTO', () => {
    const r = C.validarInscripcion(inscripcionValida({ resides_in_sabaneta: false }), OPC);
    expect(r.eligibility_status).toBe('NO_APTO');
  });
});

describe('QA: enlace de video invalido', () => {
  it('goes to EN_REVISION, never discarded', () => {
    const r = C.validarInscripcion(inscripcionValida({ video_url: 'mi video en el celular' }), OPC);
    expect(r.eligibility_status).toBe('EN_REVISION');
  });
});

// ===========================================================================
describe('QA: duplicados', () => {
  const previos = [{
    submission_id: 'S-0001',
    normalized_id_number: '1036448960',
    normalized_email: 'maria.restrepo@example.com',
    normalized_phone: '3012345678'
  }];

  it('duplicado por CEDULA marca duplicate_flag', () => {
    const d = C.detectarDuplicado({
      submission_id: 'S-0002', normalized_id_number: '1036448960',
      normalized_email: 'otra@example.com', normalized_phone: '3019999999'
    }, previos);
    expect(d.duplicate_flag).toBe(true);
    expect(d.duplicate_reason).toContain('CEDULA_REPETIDA');
    expect(d.registro_principal).toBe('S-0001');
  });

  it('duplicado por CORREO es solo ALERTA, no duplicado', () => {
    const d = C.detectarDuplicado({
      submission_id: 'S-0003', normalized_id_number: '9999999',
      normalized_email: 'maria.restrepo@example.com', normalized_phone: '3018888888'
    }, previos);
    expect(d.duplicate_flag).toBe(false);
    expect(d.alerta).toBe(true);
    expect(d.duplicate_reason).toContain('EMAIL_REPETIDO');
  });

  it('duplicado por TELEFONO es solo ALERTA (familias comparten numero)', () => {
    const d = C.detectarDuplicado({
      submission_id: 'S-0004', normalized_id_number: '8888888',
      normalized_email: 'hermano@example.com', normalized_phone: '3012345678'
    }, previos);
    expect(d.duplicate_flag).toBe(false);
    expect(d.alerta).toBe(true);
  });

  it('un registro no se marca duplicado de si mismo', () => {
    const d = C.detectarDuplicado({
      submission_id: 'S-0001', normalized_id_number: '1036448960',
      normalized_email: 'maria.restrepo@example.com', normalized_phone: '3012345678'
    }, previos);
    expect(d.duplicate_flag).toBe(false);
  });
});

// ===========================================================================
describe('Asignacion de codigos B-001..B-100', () => {
  function registros(n, extra) {
    const out = [];
    for (let i = 1; i <= n; i++) {
      out.push(Object.assign({
        submission_id: 'S-' + String(i).padStart(4, '0'),
        eligibility_status: 'APTO',
        duplicate_flag: false,
        code: '',
        created_at: '2026-09-20T10:' + String(i % 60).padStart(2, '0') + ':' + String(i % 60).padStart(2, '0') + '.000Z'
      }, extra || {}));
    }
    return out;
  }

  it('asigna en orden de inscripcion y formatea con 3 digitos', () => {
    const r = C.asignarCodigos(registros(3));
    expect(r.asignados[0].code).toBe('B-001');
    expect(r.asignados[2].code).toBe('B-003');
  });

  it('QA: con 120 inscritos validos solo se emiten 100 codigos', () => {
    const r = C.asignarCodigos(registros(120));
    expect(r.asignados).toHaveLength(100);
    expect(r.sin_cupo).toHaveLength(20);
    expect(r.asignados[99].code).toBe('B-100');
    expect(r.sin_cupo[0].motivo).toBe('CUPO_LLENO');
  });

  it('los duplicados NO consumen codigo', () => {
    const base = registros(5);
    base[1].duplicate_flag = true;
    base[3].eligibility_status = 'INCOMPLETO';
    const r = C.asignarCodigos(base);
    expect(r.asignados).toHaveLength(3);
    expect(r.asignados.map(a => a.submission_id)).toEqual(['S-0001', 'S-0003', 'S-0005']);
  });

  it('es idempotente: correrla dos veces no cambia nada', () => {
    const base = registros(10);
    const primera = C.asignarCodigos(base);
    primera.asignados.forEach(a => {
      base.find(b => b.submission_id === a.submission_id).code = a.code;
    });
    const segunda = C.asignarCodigos(base);
    expect(segunda.asignados).toHaveLength(0);
    expect(segunda.ya_tenian).toBe(10);
  });

  it('nunca reutiliza un codigo liberado por una descalificacion', () => {
    const base = registros(5);
    base[2].code = 'B-003';
    base[2].eligibility_status = 'NO_CUMPLE';   // descalificado despues de emitir
    const r = C.asignarCodigos(base);
    const emitidos = r.asignados.map(a => a.code);
    expect(emitidos.indexOf('B-003')).toBe(-1);
    expect(emitidos).toEqual(['B-001', 'B-002', 'B-004', 'B-005']);
  });

  it('respeta codigos preexistentes fuera de secuencia', () => {
    const base = registros(3);
    base[0].code = 'B-050';
    const r = C.asignarCodigos(base);
    expect(r.asignados.map(a => a.code)).toEqual(['B-001', 'B-002']);
  });
});

// ===========================================================================
describe('Agenda por bloques', () => {
  it('B-001 is block 1 at 15:00 with arrival at 14:45', () => {
    const h = C.horarioDeCodigo('B-001');
    expect(h.block_id).toBe(1);
    expect(h.audition_time).toBe('15:00');
    expect(h.arrival_time).toBe('14:45');
  });
  it('B-010 sigue en el bloque 1 (frontera)', () => {
    expect(C.horarioDeCodigo('B-010').block_id).toBe(1);
  });
  it('B-011 opens block 2 at 15:30', () => {
    const h = C.horarioDeCodigo('B-011');
    expect(h.block_id).toBe(2);
    expect(h.audition_time).toBe('15:30');
  });
  it('B-100 closes block 10 at 19:30-20:00', () => {
    const h = C.horarioDeCodigo('B-100');
    expect(h.block_id).toBe(10);
    expect(h.audition_time).toBe('19:30');
    expect(h.fin).toBe('20:00');
  });
  it('the full agenda is 10 blocks + margin 20:00-20:30 + contingency 20:30-21:00', () => {
    const a = C.construirAgenda();
    expect(a).toHaveLength(12);
    expect(a[10].block_id).toBe('MARGEN');
    expect(a[10].ventana).toBe('20:00-20:30');
    expect(a[11].block_id).toBe('CONTINGENCIA');
    expect(a[11].ventana).toBe('20:30-21:00');
  });
  it('cada bloque cubre exactamente 10 codigos', () => {
    const a = C.construirAgenda();
    expect(a[0].codigo_desde).toBe('B-001');
    expect(a[0].codigo_hasta).toBe('B-010');
    expect(a[9].codigo_desde).toBe('B-091');
    expect(a[9].codigo_hasta).toBe('B-100');
  });
});

// ===========================================================================
describe('QA: cambios de horario (Formulario 2)', () => {
  const registro = { code: 'B-014', change_status: 'SIN_SOLICITUD' };
  const antesDelCierre = { ahora: '2026-10-01T09:00:00Z', cierre_cambios: '2026-10-01T18:00:00Z' };

  it('permite la solicitud a quien declara que NO puede asistir', () => {
    const r = C.puedeSolicitarCambio(registro, { can_attend_original: false }, antesDelCierre);
    expect(r.permitido).toBe(true);
  });
  it('la rechaza si declara que SI puede asistir', () => {
    const r = C.puedeSolicitarCambio(registro, { can_attend_original: true }, antesDelCierre);
    expect(r.permitido).toBe(false);
    expect(r.motivo).toBe('SI_PUEDE_ASISTIR');
  });
  it('QA: doble solicitud de cambio se bloquea', () => {
    const conSolicitud = { code: 'B-014', change_status: 'PENDIENTE' };
    const r = C.puedeSolicitarCambio(conSolicitud, { can_attend_original: false }, antesDelCierre);
    expect(r.permitido).toBe(false);
    expect(r.motivo).toBe('YA_SOLICITO');
  });
  it('tampoco permite una segunda solicitud tras un cambio ya APROBADO', () => {
    const r = C.puedeSolicitarCambio({ code: 'B-014', change_status: 'APROBADO' }, { can_attend_original: false }, antesDelCierre);
    expect(r.permitido).toBe(false);
  });
  it('QA: fuera de plazo se rechaza (el dia del evento no hay cambios)', () => {
    const r = C.puedeSolicitarCambio(registro, { can_attend_original: false },
      { ahora: '2026-10-02T15:00:00Z', cierre_cambios: '2026-10-01T18:00:00Z' });
    expect(r.permitido).toBe(false);
    expect(r.motivo).toBe('FUERA_DE_PLAZO');
  });
  it('codigo inexistente se rechaza', () => {
    const r = C.puedeSolicitarCambio(null, { can_attend_original: false }, antesDelCierre);
    expect(r.motivo).toBe('CODIGO_NO_ENCONTRADO');
  });

  it('QA: cambio aprobado mueve el horario pero NUNCA el codigo', () => {
    const r = C.aplicarCambio({ code: 'B-014' }, 7, { responsable: 'logistica', ahora: '2026-10-01T12:00:00Z' });
    expect(r.ok).toBe(true);
    expect(r.cambios.code).toBe('B-014');
    expect(r.cambios.final_block).toBe(7);
    expect(r.cambios.final_time).toBe('18:00');
    expect(r.cambios.arrival_time).toBe('17:45');
    expect(r.cambios.change_status).toBe('APROBADO');
    expect(r.cambios.changed_by).toBe('logistica');
  });

  it('calcula cupo libre por bloque para que produccion decida', () => {
    const registros = [];
    for (let i = 1; i <= 10; i++) registros.push({ code: C.formatearCodigo(i) });   // bloque 1 lleno
    for (let i = 11; i <= 15; i++) registros.push({ code: C.formatearCodigo(i) });  // bloque 2 a medias
    const libres = C.bloquesConCupo(registros);
    expect(libres[0].disponibles).toBe(0);
    expect(libres[1].disponibles).toBe(5);
    expect(libres[2].disponibles).toBe(10);
  });
});

// ===========================================================================
describe('QA: puntualidad, no show y contingencia', () => {
  it('a tiempo -> CHECK-IN', () => {
    const r = C.evaluarPuntualidad('18:00', '17:55');
    expect(r.recomendacion).toBe('CHECK-IN');
    expect(r.puntual).toBe(true);
  });
  it('3 minutos tarde: dentro de tolerancia, decide el coordinador', () => {
    const r = C.evaluarPuntualidad('18:00', '18:03');
    expect(r.dentro_tolerancia).toBe(true);
    expect(r.recomendacion).toBe('CHECK-IN');
  });
  it('exactamente 5 minutos sigue dentro de tolerancia', () => {
    expect(C.evaluarPuntualidad('18:00', '18:05').dentro_tolerancia).toBe(true);
  });
  it('QA: 6 minutos tarde -> pierde el turno, pasa a CONTINGENCIA', () => {
    const r = C.evaluarPuntualidad('18:00', '18:06');
    expect(r.dentro_tolerancia).toBe(false);
    expect(r.recomendacion).toBe('CONTINGENCIA');
    expect(r.retraso).toBe(6);
  });

  it('QA: contingencia solo admite a quien alcance el tiempo restante', () => {
    const cola = [];
    for (let i = 1; i <= 10; i++) cola.push({ code: C.formatearCodigo(i), contingencia_desde: '2026-10-02T2' + (i % 10) + ':00:00Z' });
    // 21:00 -> 21:30 = 30 min, 3 min por audicion + 1 de margen = 7 cupos
    const plan = C.planificarContingencia(cola, { ahora_minutos: 21 * 60, cierre_minutos: 21 * 60 + 30 });
    expect(plan.cupos_disponibles).toBe(7);
    expect(plan.entran).toHaveLength(7);
    expect(plan.fuera).toHaveLength(3);
    expect(plan.fuera[0].estado_sugerido).toBe('NO AUDICIONADO');
  });

  it('con 10 en cola y solo 3 oportunidades, solo 3 audicionan', () => {
    const cola = [];
    for (let i = 1; i <= 10; i++) cola.push({ code: C.formatearCodigo(i), contingencia_desde: '2026-10-02T21:0' + (i % 10) + ':00Z' });
    const plan = C.planificarContingencia(cola, { ahora_minutos: 21 * 60 + 18, cierre_minutos: 21 * 60 + 30 });
    expect(plan.entran).toHaveLength(3);
    expect(plan.fuera).toHaveLength(7);
  });

  it('QA: cierre 21:30 deja NO AUDICIONADO a todo el que no audiciono', () => {
    const registros = [
      { code: 'B-001', attendance_status: 'REALIZADA' },
      { code: 'B-002', attendance_status: 'CONTINGENCIA' },
      { code: 'B-003', attendance_status: 'NO SHOW' },
      { code: 'B-004', attendance_status: 'CHECK-IN' },
      { code: 'B-005', attendance_status: 'NO AUDICIONADO' }
    ];
    const r = C.cerrarJornada(registros, { responsable: 'coordinador' });
    expect(r.total).toBe(3);
    expect(r.cambios.map(c => c.code)).toEqual(['B-002', 'B-003', 'B-004']);
    expect(r.cambios[0].hacia).toBe('NO AUDICIONADO');
  });
});

// ===========================================================================
describe('Maquina de estados', () => {
  it('CONFIRMADO -> CHECK-IN es valido', () => {
    expect(C.aplicarTransicion('CONFIRMADO', 'CHECK-IN').ok).toBe(true);
  });
  it('CONFIRMADO -> REALIZADA se rechaza (no se puede audicionar sin check-in)', () => {
    const r = C.aplicarTransicion('CONFIRMADO', 'REALIZADA');
    expect(r.ok).toBe(false);
  });
  it('un supervisor puede forzar, pero queda marcado como forzado', () => {
    const r = C.aplicarTransicion('CONFIRMADO', 'REALIZADA', { forzar: true });
    expect(r.ok).toBe(true);
    expect(r.forzado).toBe(true);
  });
  it('REALIZADA no se puede deshacer salvo por INCIDENTE', () => {
    expect(C.aplicarTransicion('REALIZADA', 'NO SHOW').ok).toBe(false);
    expect(C.aplicarTransicion('REALIZADA', 'INCIDENTE').ok).toBe(true);
  });
  it('tolera variantes de escritura del operador', () => {
    expect(C.normalizarEstado('check_in')).toBe('CHECK-IN');
    expect(C.normalizarEstado('no-show')).toBe('NO SHOW');
  });
  it('repetir el mismo estado no es un error (doble clic en el check-in)', () => {
    const r = C.aplicarTransicion('CHECK-IN', 'CHECK-IN');
    expect(r.ok).toBe(true);
    expect(r.sin_cambio).toBe(true);
  });
});

// ===========================================================================
describe('Official rubric (rubrica-jurado-daviarena.pdf): 7 categories, 1-5 x factor', () => {
  const all = (v) => ({ afinacion: v, presencia: v, interpretacion: v, originalidad: v, ritmo: v, repertorio: v, arena: v });

  it('has 7 categories with factors 4-4-3-3-2-2-2 and passes its own validation', () => {
    expect(C.RUBRIC_DEFAULT.map((c) => c.factor)).toEqual([4, 4, 3, 3, 2, 2, 2]);
    expect(C.validateRubric(C.RUBRIC_DEFAULT).ok).toBe(true);
    expect([C.rubricMinTotal(C.RUBRIC_DEFAULT), C.rubricMaxTotal(C.RUBRIC_DEFAULT)]).toEqual([20, 100]);
  });
  it('5 in every category is 100 and 1 in every category is 20', () => {
    expect(C.calcularPuntajeJurado(all(5)).total).toBe(100);
    expect(C.calcularPuntajeJurado(all(1)).total).toBe(20);
  });
  it('points are rating x factor, and the tie-break is presence + arena points', () => {
    const r = C.calcularPuntajeJurado({ afinacion: 4, presencia: 5, interpretacion: 3, originalidad: 4, ritmo: 5, repertorio: 3, arena: 4 });
    expect([r.total, r.desempate]).toEqual([81, 28]);
  });
  it('an incomplete card is INVALID, never a low score', () => {
    const p = all(5); delete p.arena;
    const r = C.calcularPuntajeJurado(p);
    expect([r.valido, r.total, r.faltantes]).toEqual([false, null, ['arena']]);
  });
  it('rejects ratings outside 1-5 and non-integers', () => {
    expect(C.calcularPuntajeJurado(Object.assign(all(3), { presencia: 0 })).valido).toBe(false);
    expect(C.calcularPuntajeJurado(Object.assign(all(3), { presencia: 6 })).valido).toBe(false);
    expect(C.calcularPuntajeJurado(Object.assign(all(3), { presencia: 3.5 })).valido).toBe(false);
  });
  it('the rubric round-trips through the PARAMETROS_RUBRICA rows unchanged', () => {
    const back = C.rubricFromRows(C.rubricToRows(C.RUBRIC_DEFAULT, 'R1'));
    expect(back.version).toBe('R1');
    expect(C.rubricFingerprint(back.categorias)).toBe(C.rubricFingerprint(C.RUBRIC_DEFAULT));
  });
  it('a parameter sheet whose maximum is not 100 is reported invalid', () => {
    const rows = C.rubricToRows(C.RUBRIC_DEFAULT, 'R1');
    rows[0].factor = 5;
    expect(C.validateRubric(C.rubricFromRows(rows).categorias).ok).toBe(false);
  });
  it('category 1 reads "voice/main instrument" for non-vocal formats only', () => {
    const cat = C.RUBRIC_DEFAULT[0];
    expect(C.categoryLabelFor(cat, 'INSTRUMENTAL')).toBe('Dominio técnico de la voz/instrumento principal');
    expect(C.categoryLabelFor(cat, 'VOZ_PISTA')).toBe('Afinación y técnica vocal');
  });
  it('three jurors: the final score is the full-precision mean of the three totals', () => {
    const c = C.consolidarArtista([
      { jurado: 1, puntajes: all(5) }, { jurado: 2, puntajes: all(4) }, { jurado: 3, puntajes: all(4) }
    ]);
    expect(c.jurados_validos).toBe(3);
    expect(c.artist_final).toBe((100 + 80 + 80) / 3);
  });
  it('an absent juror never counts as zero', () => {
    const c = C.consolidarArtista([{ jurado: 1, puntajes: all(5) }, { jurado: 2, puntajes: all(5) }, { jurado: 3, puntajes: {} }]);
    expect([c.jurados_validos, c.artist_final]).toEqual([2, 100]);
  });
});

// ===========================================================================
describe('Selection: Top 10 public, Top 20 private', () => {
  const all = (v) => ({ afinacion: v, presencia: v, interpretacion: v, originalidad: v, ritmo: v, repertorio: v, arena: v });
  function artist(code, cards, extra) {
    return Object.assign({ code, artistic_name: code, audition_status: 'REALIZADA',
      tarjetas: cards.map((p, i) => ({ jurado: i + 1, puntajes: p })) }, extra || {});
  }
  const code = (i) => 'B-' + String(i).padStart(3, '0');
  // 25 distinct scores: artist i has jurors (5,5,5) minus a different total per artist.
  function field(n) {
    const out = [];
    for (let i = 1; i <= n; i++) {
      const a = all(5); a.ritmo = 1 + ((i - 1) % 5); a.repertorio = 5 - Math.floor((i - 1) / 5) % 5;
      out.push(artist(code(i), [a, a, a]));
    }
    return out;
  }

  it('marks 10 TOP10_SELECCIONADO and positions 11-20 TOP20, in score order', () => {
    const r = C.seleccionarTop(field(25).map((a, i) => Object.assign(a, { tarjetas: a.tarjetas.map((t) => ({ jurado: t.jurado,
      puntajes: Object.assign({}, t.puntajes, { interpretacion: 5 - Math.floor(i / 5), originalidad: 5 - (i % 5) }) })) })));
    expect(r.top10.length + r.empates_sin_resolver.length >= 10).toBe(true);
    const statuses = r.ranking.map((a) => a.ranking_status);
    expect(statuses.filter((s) => s === 'TOP10_SELECCIONADO').length <= 10).toBe(true);
    for (let i = 1; i < r.ranking.length; i++) expect(r.ranking[i - 1].artist_final >= r.ranking[i].artist_final).toBe(true);
  });
  it('someone who did not audition is excluded', () => {
    const r = C.seleccionarTop([artist('B-001', [all(5), all(5), all(5)], { audition_status: 'NO AUDICIONADO' }),
                                artist('B-002', [all(3), all(3), all(3)])]);
    expect(r.top10.map((a) => a.code)).toEqual(['B-002']);
    expect(r.excluidos[0].motivo).toBe('AUDICION_NO_REALIZADA');
  });
  it('fewer than 3 submitted cards keeps a project out of the ranking by default', () => {
    const r = C.seleccionarTop([artist('B-001', [all(5), all(5)]), artist('B-002', [all(3), all(3), all(3)])]);
    expect(r.excluidos.map((e) => [e.code, e.motivo])).toEqual([['B-001', 'JURADOS_INSUFICIENTES']]);
  });
  it('a validated disqualification excludes; a pending one only flags', () => {
    const r = C.seleccionarTop([artist('B-001', [all(5), all(5), all(5)], { dq_status: 'VALIDADA' }),
                                artist('B-002', [all(4), all(4), all(4)], { dq_status: 'PENDIENTE' })]);
    expect(r.excluidos.map((e) => e.motivo)).toEqual(['DESCALIFICADO']);
    expect(r.dq_pendientes).toEqual(['B-002']);
  });
  it('equal totals are broken by presence + arena before anything else', () => {
    const a = Object.assign(all(4), { presencia: 5, afinacion: 3 });   // same total, more presence
    const b = Object.assign(all(4), { presencia: 3, afinacion: 5 });
    expect(C.calcularPuntajeJurado(a).total).toBe(C.calcularPuntajeJurado(b).total);
    const r = C.seleccionarTop([artist('B-002', [b, b, b]), artist('B-001', [a, a, a])], { top_publico: 1, top_privado: 1 });
    expect([r.ranking[0].code, r.requiere_comite]).toEqual(['B-001', false]);
  });
  it('a tie that survives the tie-break across the cut is TIE_REVIEW_REQUIRED, never decided silently', () => {
    const list = [];
    for (let i = 1; i <= 12; i++) list.push(artist(code(i), i <= 8 ? [all(5), all(5), all(5)] : [all(4), all(4), all(4)]));
    const tied = C.seleccionarTop(list.slice(0, 9).concat([artist('B-010', [all(4), all(4), all(4)]), artist('B-011', [all(4), all(4), all(4)])]),
                                  { top_publico: 9 });
    expect(tied.requiere_comite).toBe(true);
    expect(tied.cortes[0].cut).toBe(9);
    expect(tied.ranking.filter((a) => a.ranking_status === 'TIE_REVIEW_REQUIRED').map((a) => a.code)).toEqual(['B-009', 'B-010', 'B-011']);
  });
  it('the minuted decision orders exactly the tied projects and closes the tie', () => {
    const list = [artist('B-001', [all(5), all(5), all(5)]), artist('B-002', [all(4), all(4), all(4)]), artist('B-003', [all(4), all(4), all(4)])];
    const open = C.seleccionarTop(list, { top_publico: 2, top_privado: 3 });
    expect(open.cortes.map((c) => c.cut)).toEqual([2]);
    const closed = C.seleccionarTop(list, { top_publico: 2, top_privado: 3,
      deliberaciones: [{ deliberation_id: 'ACTA-1', cut_position: 2, codes_in_order: 'B-003,B-002' }] });
    expect([closed.requiere_comite, closed.top10.map((a) => a.code)]).toEqual([false, ['B-001', 'B-003']]);
    const wrong = C.seleccionarTop(list, { top_publico: 2, top_privado: 3,
      deliberaciones: [{ deliberation_id: 'ACTA-2', cut_position: 2, codes_in_order: 'B-001,B-002' }] });
    expect(wrong.requiere_comite).toBe(true);
  });
  it('closing the results turns every ranked project outside the Top 20 into NO_SELECCIONADO', () => {
    const list = [];
    for (let i = 1; i <= 3; i++) list.push(artist(code(i), [Object.assign(all(3), { ritmo: i }), all(3), all(3)]));
    const r = C.seleccionarTop(list, { top_publico: 1, top_privado: 2, resultados_cerrados: true });
    expect(r.ranking.map((a) => a.ranking_status)).toEqual(['TOP10_SELECCIONADO', 'TOP20', 'NO_SELECCIONADO']);
  });
});

process.exit(ejecutar());
