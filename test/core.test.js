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
  it('quien cumple 18 el dia siguiente al evento NO es elegible', () => {
    expect(C.calcularEdad('2008-10-03', FECHA_EVENTO)).toBe(17);
    const r = C.validarInscripcion(inscripcionValida({ birth_date: '2008-10-03' }), OPC);
    expect(r.eligibility_status).toBe('NO_CUMPLE');
  });
  it('quien cumple 29 antes del evento NO es elegible', () => {
    const r = C.validarInscripcion(inscripcionValida({ birth_date: '1997-01-15' }), OPC);
    expect(r.eligibility_status).toBe('NO_CUMPLE');
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
  it('queda NO_CUMPLE', () => {
    const r = C.validarInscripcion(inscripcionValida({ resides_in_sabaneta: false }), OPC);
    expect(r.eligibility_status).toBe('NO_CUMPLE');
  });
});

describe('QA: enlace de video invalido', () => {
  it('pasa a REVISION, no se descarta', () => {
    const r = C.validarInscripcion(inscripcionValida({ video_url: 'mi video en el celular' }), OPC);
    expect(r.eligibility_status).toBe('REVISION');
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
  it('B-001 va al bloque 1, 16:00, llegada 15:45', () => {
    const h = C.horarioDeCodigo('B-001');
    expect(h.block_id).toBe(1);
    expect(h.audition_time).toBe('16:00');
    expect(h.arrival_time).toBe('15:45');
  });
  it('B-010 sigue en el bloque 1 (frontera)', () => {
    expect(C.horarioDeCodigo('B-010').block_id).toBe(1);
  });
  it('B-011 abre el bloque 2 a las 16:30', () => {
    const h = C.horarioDeCodigo('B-011');
    expect(h.block_id).toBe(2);
    expect(h.audition_time).toBe('16:30');
  });
  it('B-100 cierra el bloque 10 a las 20:30', () => {
    const h = C.horarioDeCodigo('B-100');
    expect(h.block_id).toBe(10);
    expect(h.audition_time).toBe('20:30');
    expect(h.fin).toBe('21:00');
  });
  it('la agenda completa son 10 bloques + contingencia 21:00-21:30', () => {
    const a = C.construirAgenda();
    expect(a).toHaveLength(11);
    expect(a[10].block_id).toBe('CONTINGENCIA');
    expect(a[10].ventana).toBe('21:00-21:30');
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
    expect(r.cambios.final_time).toBe('19:00');
    expect(r.cambios.arrival_time).toBe('18:45');
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
describe('Rubrica y consolidacion', () => {
  const perfecto = { talento: 10, performance: 10, identidad: 10, repertorio: 10,
                     profesionalismo: 10, presencia: 10, digital: 10, proyecto: 10 };

  it('los pesos suman 100', () => {
    expect(C.pesoTotalRubrica()).toBe(100);
  });
  it('todo en 10 da 100 puntos', () => {
    expect(C.calcularPuntajeJurado(perfecto).total).toBe(100);
  });
  it('todo en 5 da 50 puntos', () => {
    const medio = {}; Object.keys(perfecto).forEach(k => medio[k] = 5);
    expect(C.calcularPuntajeJurado(medio).total).toBe(50);
  });
  it('aplica la formula (nota/10)*peso factor por factor', () => {
    const p = Object.assign({}, perfecto, { talento: 5 });   // 20 -> 10
    expect(C.calcularPuntajeJurado(p).total).toBe(90);
  });
  it('una tarjeta incompleta es INVALIDA, no un puntaje bajo', () => {
    const p = Object.assign({}, perfecto); delete p.digital;
    const r = C.calcularPuntajeJurado(p);
    expect(r.valido).toBe(false);
    expect(r.total).toBeNull();
    expect(r.faltantes).toContain('digital');
  });
  it('rechaza notas fuera de la escala 1-10', () => {
    expect(C.calcularPuntajeJurado(Object.assign({}, perfecto, { talento: 0 })).valido).toBe(false);
    expect(C.calcularPuntajeJurado(Object.assign({}, perfecto, { talento: 11 })).valido).toBe(false);
  });

  it('QA: tres jurados -> el final es el promedio de los tres', () => {
    const t = [
      { jurado: 1, puntajes: perfecto },
      { jurado: 2, puntajes: Object.assign({}, perfecto, { talento: 5 }) },   // 90
      { jurado: 3, puntajes: Object.assign({}, perfecto, { performance: 5 }) } // 90
    ];
    const c = C.consolidarArtista(t);
    expect(c.jurados_validos).toBe(3);
    expect(c.artist_final).toBeCloseTo((100 + 90 + 90) / 3, 2);
  });

  it('un jurado ausente NO cuenta como cero', () => {
    const t = [
      { jurado: 1, puntajes: perfecto },
      { jurado: 2, puntajes: perfecto },
      { jurado: 3, puntajes: {} }
    ];
    const c = C.consolidarArtista(t);
    expect(c.jurados_validos).toBe(2);
    expect(c.artist_final).toBe(100);
  });
});

// ===========================================================================
describe('Seleccion del Top 7', () => {
  function artista(code, nota, extra) {
    const p = {}; ['talento','performance','identidad','repertorio','profesionalismo','presencia','digital','proyecto']
      .forEach(k => p[k] = nota);
    return Object.assign({
      code, artistic_name: code, audition_status: 'REALIZADA',
      tarjetas: [{ jurado: 1, puntajes: p }, { jurado: 2, puntajes: p }, { jurado: 3, puntajes: p }]
    }, extra || {});
  }

  it('devuelve exactamente 7 y ordenados de mayor a menor', () => {
    const lista = [];
    for (let i = 0; i < 12; i++) lista.push(artista('B-' + String(i + 1).padStart(3, '0'), 10 - i * 0.5));
    const r = C.seleccionarTop(lista);
    expect(r.top).toHaveLength(7);
    expect(r.top[0].code).toBe('B-001');
    expect(r.top[0].artist_final > r.top[6].artist_final).toBe(true);
  });

  it('QA: quien NO audiciono queda fuera de la seleccion', () => {
    const lista = [artista('B-001', 10, { audition_status: 'NO AUDICIONADO' }), artista('B-002', 5)];
    const r = C.seleccionarTop(lista, { top: 7 });
    expect(r.top).toHaveLength(1);
    expect(r.top[0].code).toBe('B-002');
    expect(r.excluidos[0].motivo).toBe('AUDICION_NO_REALIZADA');
  });

  it('QA: empate se resuelve por Performance (primer criterio)', () => {
    const base = { talento: 8, performance: 8, identidad: 8, repertorio: 8,
                   profesionalismo: 8, presencia: 8, digital: 8, proyecto: 8 };
    // Mismo total 80, pero A tiene mas Performance y menos Talento.
    const a = { talento: 6, performance: 10, identidad: 8, repertorio: 8, profesionalismo: 8, presencia: 8, digital: 8, proyecto: 8 };
    const b = { talento: 10, performance: 6, identidad: 8, repertorio: 8, profesionalismo: 8, presencia: 8, digital: 8, proyecto: 8 };
    const mk = (code, p) => ({ code, artistic_name: code, audition_status: 'REALIZADA',
      tarjetas: [{ jurado: 1, puntajes: p }, { jurado: 2, puntajes: p }, { jurado: 3, puntajes: p }] });

    const totalA = C.calcularPuntajeJurado(a).total;
    const totalB = C.calcularPuntajeJurado(b).total;
    expect(totalA).toBe(totalB);                       // empate real

    const r = C.seleccionarTop([mk('B-002', b), mk('B-001', a)], { top: 1 });
    expect(r.top[0].code).toBe('B-001');               // gana el de mas Performance
  });

  it('QA: empate irresoluble en el corte se marca para el comite', () => {
    const lista = [];
    for (let i = 1; i <= 9; i++) lista.push(artista('B-' + String(i).padStart(3, '0'), 8));
    const r = C.seleccionarTop(lista, { top: 7 });
    expect(r.requiere_comite).toBe(true);
    expect(r.empates_sin_resolver.length > 0).toBe(true);
  });

  it('sin empate en el corte NO se convoca al comite', () => {
    const lista = [];
    for (let i = 0; i < 9; i++) lista.push(artista('B-' + String(i + 1).padStart(3, '0'), 10 - i));
    const r = C.seleccionarTop(lista, { top: 7 });
    expect(r.requiere_comite).toBe(false);
  });

  it('excluye a quien tiene menos de 2 tarjetas validas', () => {
    const solo = artista('B-001', 9);
    solo.tarjetas = [solo.tarjetas[0]];
    const r = C.seleccionarTop([solo, artista('B-002', 5)], { minimo_jurados: 2 });
    expect(r.excluidos.some(e => e.motivo === 'JURADOS_INSUFICIENTES')).toBe(true);
  });
});

process.exit(ejecutar());
