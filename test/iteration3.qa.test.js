/**
 * Release QA battery (QA-01 .. QA-13 of the release prompt, 2026-09-29) on the Apps Script
 * emulator. Every scenario goes through the real server entry points; each test states the
 * acceptance criterion it proves. QA-14 (mobile/desktop/clean session) is verified live.
 */
const { describe, it, expect, ejecutar } = require('./runner');
const F = require('./gas/fixtures');

function once(build) {
  let value;
  let built = false;
  return () => {
    if (!built) { value = build(); built = true; }
    return value;
  };
}

const ADMIN = F.ADMIN_SESSION;
const HUMAN = { form_elapsed_ms: 90000 };
const juror = (n) => ({ ok: true, rol: 'jurado', alias: 'jurado-' + n });
const all = (v) => ({ afinacion: v, presencia: v, interpretacion: v, originalidad: v, ritmo: v, repertorio: v, arena: v });
const code = (i) => 'B-' + String(i).padStart(3, '0');

/** Registers `count` participants one second apart (submission order is objective) and applies the review. */
function registerMany(project, account, count, from) {
  F.setConfig(project, 'limite_envios_minuto', '100000');
  const out = [];
  for (let i = from || 1; i < (from || 1) + count; i++) {
    account.advance(1000);
    out.push(project.run('accionInscribir', F.uniqueSubmission(i)));
  }
  project.run('accionAplicarVerificacion', {}, ADMIN);
  return out;
}

function row(project, predicate) {
  return project.records('REGISTRO').find(predicate);
}

function identity(r) {
  return { id_number: String(r.id_number), submission_id: r.submission_id, source: 'web', form_elapsed_ms: 60000 };
}

// ===========================================================================
describe('QA-01: registrations beyond 100 feed a pool of 200 (100 slots + 100 substitutes)', () => {
  const env = once(() => {
    const account = F.newAccount();
    const test = F.installTest(account, 'pruebas');
    registerMany(test.project, account, 215);
    const emission = test.project.run('accionAsignarCodigos', {}, ADMIN);
    return { account, test, emission };
  });

  it('issues exactly 100 slot codes; the registration form stays open past 100', () => {
    const { test, emission } = env();
    expect([emission.asignados, emission.total_con_codigo]).toEqual([100, 100]);
    const extra = test.project.post(Object.assign({ accion: 'inscribir' }, F.uniqueSubmission(999, HUMAN))).json();
    expect([extra.ok, extra.eligibility_status]).toEqual([true, 'RECIBIDO']);
  });
  it('positions 1-100 are PRINCIPAL, 101-200 SUPLENTE, the rest FUERA_DE_BOLSA, by submission order', () => {
    const rows = env().test.project.records('REGISTRO').filter((r) => r.priority_rank !== '' && r.priority_rank !== undefined)
      .sort((a, b) => a.priority_rank - b.priority_rank);
    const count = (s) => rows.filter((r) => r.pool_status === s).length;
    expect([count('PRINCIPAL'), count('SUPLENTE'), count('FUERA_DE_BOLSA')]).toEqual([100, 100, 15]);
    expect(rows.slice(0, 100).every((r) => /^B-\d{3}$/.test(r.code))).toBe(true);
    expect(rows.slice(100).every((r) => !r.code)).toBe(true);
    for (let i = 1; i < rows.length; i++) expect(String(rows[i - 1].created_at) <= String(rows[i].created_at)).toBe(true);
  });
  it('a substitute is never a finalist: participation SIN_TURNO, no score is used before the audition', () => {
    const sub = row(env().test.project, (r) => r.pool_status === 'SUPLENTE');
    expect([sub.participation_status, sub.ranking_status || '', sub.code]).toEqual(['SIN_TURNO', '', '']);
  });
  it('the substitutes and the ones outside the pool are told so by e-mail (queued, idempotent)', () => {
    const log = env().test.project.records('_EMAIL_LOG');
    expect(log.filter((e) => e.template_key === 'SIN_CUPO').length).toBe(115);
    expect(log.filter((e) => e.template_key === 'ASIGNACION').length).toBe(100);
  });
});

// ===========================================================================
describe('QA-02: soloist + duo + group, performers and crew', () => {
  const env = once(() => {
    const account = F.newAccount();
    const test = F.installTest(account, 'pruebas');
    const p = test.project;
    const solo = p.run('accionInscribir', F.uniqueSubmission(1, HUMAN));
    const duo = p.run('accionInscribir', F.uniqueSubmission(2, Object.assign({ participation_mode: 'DUO', artistic_name: 'Duo Norte', members_declared: '2' }, HUMAN)));
    const band = p.run('accionInscribir', F.uniqueSubmission(3, Object.assign({ participation_mode: 'AGRUPACION', artistic_name: 'Banda Sur', members_declared: '3' }, HUMAN)));
    const person = (teamCode, key, i, extra) => p.run('accionRegistrarIntegrante', Object.assign({
      group_code: teamCode, group_key: key, client_submission_id: 'qa02-' + teamCode + '-' + i, full_name: 'Person ' + i,
      id_number: String(70000000 + i), birth_date: '1995-03-10', document_type: 'CC', artistic_role: 'Guitarra',
      adult_confirmation: true, accept_terms: true, accept_data_processing: true, accept_image_voice: true,
      signature_png: F.SIGNATURE_PNG, source: 'web'
    }, HUMAN, extra || {}));
    const duoPartner = person(duo.team_code, duo.team_key, 1);
    const bandCrew = person(band.team_code, band.team_key, 2, { person_role: 'EQUIPO_TRABAJO', crew_role: 'MANAGER', artistic_role: '' });
    const soloCrew = person(solo.team_code, solo.team_key, 3, { person_role: 'EQUIPO_TRABAJO', crew_role: 'TECNICO', artistic_role: '' });
    // The duo partner also works as crew for the band: one person, two relations.
    const twoRoles = person(band.team_code, band.team_key, 1, { client_submission_id: 'qa02-two-roles', person_role: 'EQUIPO_TRABAJO', crew_role: 'FOTOGRAFO', artistic_role: '' });
    p.run('accionAplicarVerificacion', {}, ADMIN);
    const emission = p.run('accionAsignarCodigos', {}, ADMIN);
    return { account, test, solo, duo, band, duoPartner, bandCrew, soloCrew, twoRoles, emission };
  });

  it('each project is one row and takes one slot, whatever its size', () => {
    const { test, emission } = env();
    expect([test.project.records('REGISTRO').length, emission.asignados]).toEqual([3, 3]);
  });
  it('every project gets a team link: soloists EQ-xxx, groups GRP-xxx, 10-character key', () => {
    const { solo, duo, band } = env();
    expect([solo.team_code, duo.team_code, band.team_code]).toEqual(['EQ-001', 'GRP-001', 'GRP-002']);
    [solo, duo, band].forEach((r) => expect(r.team_key).toMatch(/^[A-Z0-9]{10}$/));
    expect(solo.members_link).toContain('g=EQ-001');
    expect(solo.members_link).not.toMatch(/1036|@|3012345678/);
  });
  it('the registrant is a person of the project with their own signature, also for a soloist', () => {
    const lead = env().test.project.records('_INTEGRANTES').find((m) => m.group_code === 'EQ-001' && m.is_leader === true);
    expect([lead.person_role, lead.member_status, /^[0-9a-f]{64}$/.test(lead.signature_sha256)]).toEqual(['INTERPRETE', 'AUTORIZADO', true]);
  });
  it('crew never counts toward the declared performers and never raises the over-size alert', () => {
    const { bandCrew, soloCrew } = env();
    expect([bandCrew.person_role, bandCrew.group.registered, bandCrew.group.crew_registered]).toEqual(['EQUIPO_TRABAJO', 1, 1]);
    expect(soloCrew.group.registered).toBe(1);
    const alerts = env().test.project.records('_INTEGRANTES').filter((m) => /SUPERA_INTEGRANTES/.test(m.member_alert || ''));
    expect(alerts).toHaveLength(0);
  });
  it('one person in two roles keeps ONE person_id and two separate relations', () => {
    const members = env().test.project.records('_INTEGRANTES').filter((m) => String(m.id_number) === '70000001');
    expect(members.map((m) => m.person_role).sort()).toEqual(['EQUIPO_TRABAJO', 'INTERPRETE']);
    expect(new Set(members.map((m) => m.person_id)).size).toBe(1);
    expect(members[0].member_alert + members[1].member_alert).toMatch(/TAMBIEN_EN_/);
  });
  it('the insurance view lists performers and crew of every coded project', () => {
    const { test } = env();
    test.project.run('refrescarVistas');
    const seguro = test.project.records('SEGURO_MAYORCA');
    expect(seguro.filter((s) => s.person_type === 'EQUIPO_TRABAJO').length).toBe(3);
    expect(seguro.filter((s) => s.person_type === 'INTERPRETE').length).toBe(4);
  });
});

// ===========================================================================
describe('QA-03: receipt for everyone, then aptitude (never RECIBIDO shown as APTO)', () => {
  const env = once(() => {
    const account = F.newAccount();
    const test = F.installTest(account, 'pruebas');
    const ok = test.project.run('accionInscribir', F.uniqueSubmission(1, HUMAN));
    const young = test.project.run('accionInscribir', F.uniqueSubmission(2, Object.assign({ birth_date: '2010-01-01' }, HUMAN)));
    const unsigned = test.project.run('accionInscribir', F.uniqueSubmission(3, Object.assign({ signature_png: '' }, HUMAN)));
    const receiptMails = account.outbox.slice();
    const applied = test.project.run('accionAplicarVerificacion', {}, ADMIN);
    return { account, test, ok, young, unsigned, receiptMails, applied };
  });

  it('a complete submission answers RECIBIDO with a receipt, a next step and the event facts', () => {
    const { ok, young } = env();
    expect([ok.eligibility_status, young.eligibility_status]).toEqual(['RECIBIDO', 'RECIBIDO']);
    expect(ok.submission_id).toMatch(/^S-[0-9A-F]{8}$/);
    expect(ok.mensaje).toContain('no significa que ya seas apto');
    expect(ok.evento.sede).toBe('Centro Comercial Mayorca · Etapa 1');
  });
  it('a submission without the registrant signature is INCOMPLETO and gets no receipt e-mail', () => {
    const { unsigned, receiptMails } = env();
    expect(unsigned.eligibility_status).toBe('INCOMPLETO');
    expect(unsigned.errores.some((e) => e.campo === 'signature_png')).toBe(true);
    expect(receiptMails.length).toBe(2);
  });
  it('every receipt e-mail says RECIBIDA, carries the spam notice in text and HTML, and absolute links', () => {
    env().receiptMails.forEach((m) => {
      expect(m.body).toContain('ESTADO: RECIBIDA');
      expect(m.body).toContain('Spam y Promociones');
      expect(m.htmlBody).toContain('Spam y Promociones');
      expect(/http:\/\/|localhost/.test(m.body + m.htmlBody)).toBe(false);
    });
  });
  it('applying the review turns RECIBIDO into APTO / NO_APTO and mails the result to everyone decided', () => {
    const { test, applied, ok, young, account } = env();
    expect(applied.por_estado).toEqual({ APTO: 1, NO_APTO: 1 });
    const status = (s) => row(test.project, (r) => r.submission_id === s.submission_id).eligibility_status;
    expect([status(ok), status(young)]).toEqual(['APTO', 'NO_APTO']);
    const subjects = account.outbox.filter((m) => /resultado de tu inscripción/.test(m.subject)).map((m) => m.subject.split(': ').pop()).sort();
    expect(subjects).toEqual(['APTO', 'NO APTO']);
  });
  it('the log records the submission and the review with who applied it', () => {
    const log = env().test.project.records('_LOG').map((l) => l.accion);
    expect(log.filter((a) => a === 'INSCRIPCION').length).toBe(3);
    expect(log).toContain('APLICAR_VERIFICACION');
  });
});

// ===========================================================================
describe('QA-04: a schedule change request never moves the slot until logistics approves it', () => {
  const env = once(() => {
    const account = F.newAccount();
    const test = F.installTest(account, 'pruebas');
    F.registerAndIssueCodes(test.project, 3);
    const who = row(test.project, (r) => r.code === 'B-002');
    const req = test.project.run('accionSolicitarCambio', { participant_code: 'B-002', full_name: who.full_name, reason_short: 'Trabajo',
      contact: '3001112233', acceptance: true, client_submission_id: 'qa04', form_elapsed_ms: 60000 });
    const pending = row(test.project, (r) => r.code === 'B-002');
    const resolved = test.project.run('accionResolverCambio', { solicitud_id: req.solicitud_id, aprobar: true, nuevo_bloque: 5 }, ADMIN);
    test.project.run('processEmailQueue', { limit: 40 });
    return { account, test, who, req, pending, resolved };
  });

  it('the request is PENDIENTE and the participant keeps the original time meanwhile', () => {
    const { who, req, pending } = env();
    expect(req.estado).toBe('PENDIENTE');
    expect([pending.final_time, pending.final_block, pending.participation_status]).toEqual([who.final_time, who.final_block, 'CAMBIO_PENDIENTE']);
  });
  it('approval moves only the time, the code stays, and the decision is traced and notified', () => {
    const { test, resolved } = env();
    expect([resolved.code, resolved.nuevo_bloque]).toEqual(['B-002', 5]);
    const c = test.project.records('_CAMBIOS')[0];
    expect([c.estado, c.resuelto_by, /^CORREO ENVIADO/.test(c.notificacion_estado)]).toEqual(['APROBADO', 'integration-test', true]);
    const mails = test.project.records('_EMAIL_LOG').filter((e) => /^CAMBIO_/.test(e.template_key)).map((e) => [e.template_key, e.status]);
    expect(mails).toEqual([['CAMBIO_SOLICITADO', 'ENVIADO'], ['CAMBIO_APROBADO', 'ENVIADO']]);
  });
});

// ===========================================================================
describe('QA-05 / QA-06: withdrawal the week before, substitutes, refusal and no answer', () => {
  const env = once(() => {
    const account = F.newAccount();
    const test = F.installTest(account, 'pruebas');
    registerMany(test.project, account, 106);
    test.project.run('accionAsignarCodigos', {}, ADMIN);
    const before = test.project.records('REGISTRO');
    return { account, test, before };
  });
  const offersOf = (p, slot) => p.records('_OFERTAS').filter((o) => o.slot_code === slot);
  const substitutes = (p) => p.records('REGISTRO').filter((r) => r.pool_status === 'SUPLENTE').sort((a, b) => a.priority_rank - b.priority_rank);

  it('before 16 October the participant button is closed', () => {
    const { test, before } = env();
    const holder = before.find((r) => r.code === 'B-037');
    const r = test.project.run('accionRetirarme', Object.assign(identity(holder), { confirmacion: 'LIBERAR MI CUPO' }));
    expect(r.ok).toBe(false);
    expect(r.error).toContain('se habilita');
  });
  it('from 16 October it needs the typed double confirmation, then frees exactly that slot', () => {
    const { account, test, before } = env();
    account.setNow('2026-10-16T09:00:00-05:00');
    const holder = before.find((r) => r.code === 'B-037');
    const noConfirm = test.project.run('accionRetirarme', identity(holder));
    expect(noConfirm.motivo).toBe('CONFIRMACION');
    const done = test.project.run('accionRetirarme', Object.assign(identity(holder), { confirmacion: 'LIBERAR MI CUPO' }));
    expect([done.retirado, done.slot_code]).toEqual([true, 'B-037']);
    const old = row(test.project, (r) => r.submission_id === holder.submission_id);
    expect([old.code, old.previous_code, old.withdrawal_status, old.pool_status]).toEqual(['', 'B-037', 'RETIRADO', 'RETIRADO']);
  });
  it('the slot is offered to ONE substitute, the first by priority, with a 24 h deadline', () => {
    const { test } = env();
    const offers = offersOf(test.project, 'B-037');
    expect(offers.map((o) => o.estado)).toEqual(['PENDIENTE']);
    expect(offers[0].priority_rank).toBe(101);
    expect(String(offers[0].expires_at)).toBe('2026-10-17T09:00:00-05:00');
  });
  it('QA-06: a refusal passes the slot to the next substitute; never two open offers', () => {
    const { test } = env();
    const offer = offersOf(test.project, 'B-037')[0];
    const first = row(test.project, (r) => r.submission_id === offer.submission_id);
    const r = test.project.run('accionResponderOferta', Object.assign(identity(first), { oferta_id: offer.oferta_id, respuesta: 'RECHAZAR' }));
    expect(r.aceptada).toBe(false);
    const offers = offersOf(test.project, 'B-037');
    expect(offers.map((o) => [o.estado, o.priority_rank])).toEqual([['RECHAZADA', 101], ['PENDIENTE', 102]]);
    expect(row(test.project, (x) => x.submission_id === first.submission_id).pool_status).toBe('DECLINO');
  });
  it('QA-06: no answer in 24 h expires the offer (hourly trigger) and the chain moves on', () => {
    const { account, test } = env();
    account.setNow('2026-10-17T10:00:00-05:00');
    test.project.fireTrigger('vencerOfertas');
    const offers = offersOf(test.project, 'B-037');
    expect(offers.map((o) => [o.estado, o.priority_rank])).toEqual([['RECHAZADA', 101], ['VENCIDA', 102], ['PENDIENTE', 103]]);
    expect(test.project.records('_OFERTAS').filter((o) => o.estado === 'PENDIENTE').length).toBe(1);
  });
  it('QA-05: the substitute who accepts inherits only B-037 and its schedule; B-036 and B-038 do not move', () => {
    const { test, before } = env();
    const offer = offersOf(test.project, 'B-037').find((o) => o.estado === 'PENDIENTE');
    const sub = row(test.project, (r) => r.submission_id === offer.submission_id);
    const r = test.project.run('accionResponderOferta', Object.assign(identity(sub), { oferta_id: offer.oferta_id, respuesta: 'ACEPTAR' }));
    expect([r.aceptada, r.code]).toEqual([true, 'B-037']);
    const oldHolder = before.find((x) => x.code === 'B-037');
    const now = row(test.project, (x) => x.code === 'B-037');
    expect([now.submission_id !== oldHolder.submission_id, now.final_time, now.arrival_time, now.full_name !== oldHolder.full_name])
      .toEqual([true, oldHolder.final_time, oldHolder.arrival_time, true]);
    ['B-036', 'B-038'].forEach((c) => {
      const a = before.find((x) => x.code === c);
      const b = row(test.project, (x) => x.code === c);
      expect([b.submission_id, b.final_time]).toEqual([a.submission_id, a.final_time]);
    });
    const history = test.project.records('_SLOTS_HISTORIAL').filter((h) => h.slot_code === 'B-037').map((h) => h.evento);
    expect(history).toEqual(['LIBERADO', 'OFRECIDO', 'OFERTA_RECHAZADA', 'OFRECIDO', 'OFERTA_VENCIDA', 'OFRECIDO', 'ASIGNADO']);
    expect(test.project.records('_EMAIL_LOG').filter((e) => e.template_key === 'OFERTA_SUPLENTE').length).toBe(3);
  });
  it('a withdrawn person keeps their history: submission_id never changes, nothing is deleted', () => {
    const { test, before } = env();
    expect(test.project.records('REGISTRO').length).toBe(before.length);
    expect(substitutes(test.project).length).toBe(3);
  });
});

// ===========================================================================
describe('QA-07 / QA-08: final confirmation on 22 October, vacancy, official list', () => {
  const env = once(() => {
    const account = F.newAccount();
    const test = F.installTest(account, 'pruebas');
    registerMany(test.project, account, 102);
    test.project.run('accionAsignarCodigos', {}, ADMIN);
    const before = test.project.records('REGISTRO');
    return { account, test, before };
  });

  it('before 22 October the final confirmation is closed', () => {
    const { test, before } = env();
    const r = test.project.run('accionConfirmacionFinal', Object.assign(identity(before.find((x) => x.code === 'B-010')), { respuesta: 'SI' }));
    expect(r.ok).toBe(false);
  });
  it('SÍ CONFIRMO records the answer and never changes the schedule', () => {
    const { account, test, before } = env();
    account.setNow('2026-10-22T13:00:00-05:00');
    const b10 = before.find((x) => x.code === 'B-010');
    const r = test.project.run('accionConfirmacionFinal', Object.assign(identity(b10), { respuesta: 'SI' }));
    expect(r.confirmado).toBe(true);
    const now = row(test.project, (x) => x.code === 'B-010');
    expect([now.final_confirmation, now.final_time, now.participation_status]).toEqual(['SI', b10.final_time, 'CONFIRMADO']);
  });
  it('NO PODRÉ ASISTIR after the replacement deadline leaves RETIRO_FINAL and VACANTE_SIN_REEMPLAZO', () => {
    const { test, before } = env();
    const b11 = before.find((x) => x.code === 'B-011');
    const r = test.project.run('accionConfirmacionFinal', Object.assign(identity(b11), { respuesta: 'NO', confirmacion: 'LIBERAR MI CUPO' }));
    expect(r.slot_code).toBe('B-011');
    const old = row(test.project, (x) => x.submission_id === b11.submission_id);
    expect([old.withdrawal_status, old.final_confirmation]).toEqual(['RETIRO_FINAL', 'NO']);
    const offers = test.project.records('_OFERTAS').filter((o) => o.slot_code === 'B-011');
    expect(offers.map((o) => o.estado)).toEqual(['VACANTE_SIN_REEMPLAZO']);
    const others = before.filter((x) => x.code && x.code !== 'B-011');
    expect(others.every((x) => row(test.project, (y) => y.submission_id === x.submission_id).final_time === x.final_time)).toBe(true);
  });
  it('QA-08: consolidation writes ROSTER_FINAL_2026-10-22, a JSON copy and locks ordinary changes', () => {
    const { account, test, before } = env();
    account.setNow('2026-10-22T21:00:00-05:00');
    expect(test.project.run('accionConsolidarLista', {}, ADMIN).ok).toBe(false);          // needs the typed word
    const r = test.project.run('accionConsolidarLista', { confirmacion: 'CONSOLIDAR' }, ADMIN);
    expect(r.lista).toBe('ROSTER_FINAL_2026-10-22');
    const roster = test.project.records('ROSTER_FINAL_2026-10-22');
    expect(roster.length).toBe(100);
    expect(roster.find((x) => x.slot_code === 'B-011').estado_cupo).toBe('VACANTE_SIN_REEMPLAZO');
    expect(roster.find((x) => x.slot_code === 'B-010').final_confirmation).toBe('SI');
    expect([r.conteos.con_titular, r.conteos.vacantes, r.conteos.confirmados]).toEqual([99, 1, 1]);
    expect(account.drive.list((i) => i.name === 'ROSTER_FINAL_2026-10-22.json')).toHaveLength(1);
    expect(test.project.records('REGISTRO').length).toBe(before.length);
  });
  it('QA-08: after consolidation withdrawals, change requests and approvals are refused', () => {
    const { test, before } = env();
    const b20 = before.find((x) => x.code === 'B-020');
    expect(test.project.run('accionRetirarParticipante', { code: 'B-020', motivo: 'Llamó para retirarse' }, ADMIN).ok).toBe(false);
    expect(test.project.run('accionSolicitarCambio', { participant_code: 'B-020', full_name: b20.full_name, acceptance: true,
      client_submission_id: 'qa08', form_elapsed_ms: 60000 }).cerrado).toBe(true);
    expect(test.project.run('accionConsolidarLista', { confirmacion: 'CONSOLIDAR' }, ADMIN).ok).toBe(false);
    expect(test.project.records('_LOG').filter((l) => l.accion === 'CONSOLIDAR_LISTA')).toHaveLength(1);
  });
});

// ===========================================================================
describe('QA-09 / QA-10: three jurors, rubric extremes, Top 10 / Top 20, tie and disqualification', () => {
  // Deficit below 100 per project (same card from the three jurors): B-001..B-009 strictly ordered,
  // B-010 and B-011 identical (tie across the cut at 10), B-012 lower.
  function cardFor(i) {
    const c = all(5);
    if (i <= 9) { const k = i - 1; c.ritmo = 5 - Math.min(k, 4); c.repertorio = 5 - Math.max(0, k - 4); }
    else if (i <= 11) { c.originalidad = 1; c.interpretacion = 3; c.ritmo = 4; }
    else { c.afinacion = 3; c.originalidad = 1; c.interpretacion = 2; }
    return c;
  }
  const env = once(() => {
    const account = F.newAccount();
    const test = F.installTest(account, 'pruebas');
    const p = test.project;
    F.registerAndIssueCodes(p, 12);
    for (let i = 1; i <= 12; i++) {
      p.run('accionRegistrarEstado', { code: code(i), estado: 'CHECK-IN' }, ADMIN);
      p.run('accionRegistrarEstado', { code: code(i), estado: 'REALIZADA' }, ADMIN);
      [1, 2, 3].forEach((j) => p.run('accionGuardarEvaluacion', Object.assign({ code: code(i), enviar: true }, cardFor(i)), juror(j)));
    }
    return { account, test };
  });
  const results = () => env().test.project.run('accionResultados', {}, ADMIN);

  it('QA-09: 5 everywhere is 100 and 1 everywhere is 20 through the juror API', () => {
    const { test } = env();
    test.project.run('accionInscribir', F.uniqueSubmission(500, HUMAN));
    const p = test.project;
    expect(p.run('calcularPuntajeJurado', all(5)).total).toBe(100);
    expect(p.run('calcularPuntajeJurado', all(1)).total).toBe(20);
    expect(results().ranking.find((r) => r.code === 'B-001').artist_final).toBe(100);
  });
  it('QA-09: a submitted card is locked; direction reopens it with a reason, the juror resubmits, all audited', () => {
    const { test } = env();
    const p = test.project;
    expect(p.run('accionGuardarEvaluacion', Object.assign({ code: 'B-012', enviar: true }, all(1)), juror(1)).bloqueada).toBe(true);
    expect(p.run('accionReabrirEvaluacion', { code: 'B-012', jurado: 1, motivo: '' }, ADMIN).ok).toBe(false);
    expect(p.run('accionReabrirEvaluacion', { code: 'B-012', jurado: 1, motivo: 'Nota digitada en la categoría equivocada' }, ADMIN).jurado).toBe(1);
    expect(p.run('accionGuardarEvaluacion', Object.assign({ code: 'B-012', enviar: true }, cardFor(12)), juror(1)).estado).toBe('ENVIADA');
    expect(p.records('_LOG').filter((l) => l.accion === 'EVALUACION_REABIERTA')).toHaveLength(1);
  });
  it('QA-09: the final score is the full-precision mean of the three jurors', () => {
    const b12 = results().ranking.find((r) => r.code === 'B-012');
    expect([b12.jurado_1, b12.jurado_2, b12.jurado_3, b12.artist_final]).toEqual([71, 71, 71, 71]);
  });
  it('QA-10: a tie across the cut at 10 is TIE_REVIEW_REQUIRED and results can not be closed', () => {
    const r = results();
    expect(r.cortes.map((c) => [c.cut, c.empatados.map((a) => [a.code, a.artist_final, a.tie_break])]))
      .toEqual([[10, [['B-010', 80, 30], ['B-011', 80, 30]]]]);
    expect(r.top.length).toBe(9);
    const close = env().test.project.run('accionCerrarResultados', { confirmacion: 'CERRAR' }, ADMIN);
    expect([close.ok, /Empates sin acta/.test(close.error)]).toEqual([false, true]);
  });
  it('QA-10: the minuted decision (method, participants, result) resolves the tie; a wrong set is refused', () => {
    const p = env().test.project;
    const base = { cut_position: 10, method: 'VOTO_CALIDAD', participants: 'Jurados 1, 2 y 3; dirección', result: 'Voto de calidad del jurado musical' };
    expect(p.run('accionRegistrarDeliberacion', Object.assign({ codes_in_order: 'B-011,B-012' }, base), ADMIN).ok).toBe(false);
    const ok = p.run('accionRegistrarDeliberacion', Object.assign({ codes_in_order: 'B-011,B-010' }, base), ADMIN);
    expect(ok.deliberation_id).toMatch(/^ACTA-/);
    const r = results();
    expect([r.cortes.length, r.top.map((t) => t.code).pop()]).toEqual([0, 'B-011']);
    const acta = p.records('_DELIBERACIONES')[0];
    expect([acta.method, acta.status, acta.cut_position]).toEqual(['VOTO_CALIDAD', 'VIGENTE', 10]);
  });
  it('QA-10: a juror flags a disqualification; it only excludes after an authorized validation', () => {
    const p = env().test.project;
    p.run('accionReabrirEvaluacion', { code: 'B-001', jurado: 2, motivo: 'Reportar causal observada en tarima' }, ADMIN);
    p.run('accionGuardarEvaluacion', Object.assign({ code: 'B-001', enviar: true, dq_flag: true, dq_causa: 'PLAYBACK', dq_nota: 'Voz grabada' }, all(5)), juror(2));
    expect(results().ranking.some((r) => r.code === 'B-001')).toBe(true);
    const close = p.run('accionCerrarResultados', { confirmacion: 'CERRAR' }, ADMIN);
    expect(/Descalificaciones sin validar/.test(close.error)).toBe(true);
    const report = p.records('_DESCALIFICACIONES')[0];
    const checkin = { ok: true, rol: 'checkin', alias: 'checkin-1' };
    expect(p.clientCall('api', { accion: 'resolver_descalificacion', t: env().test.tokens['checkin-1'], dq_id: report.dq_id }).codigo_http).toBe(403);
    expect(checkin.rol).toBe('checkin');
    const v = p.run('accionResolverDescalificacion', { dq_id: report.dq_id, decision: 'VALIDADA', motivo: 'Playback confirmado por el técnico' }, ADMIN);
    expect(v.estado).toBe('VALIDADA');
    const r = results();
    expect(r.ranking.some((x) => x.code === 'B-001')).toBe(false);
    expect(r.excluidos.find((x) => x.code === 'B-001').observacion).toBe('DESCALIFICADO');
  });
  it('QA-10: closing persists Top 10 / Top 20 into REGISTRO; the public side never sees the Top 20', () => {
    const p = env().test.project;
    const close = p.run('accionCerrarResultados', { confirmacion: 'CERRAR' }, ADMIN);
    expect(close.cerrado).toBe(true);
    const statuses = {};
    p.records('REGISTRO').filter((r) => r.code).forEach((r) => { statuses[r.code] = r.ranking_status; });
    expect([statuses['B-002'], statuses['B-011'], statuses['B-012'], statuses['B-001']])
      .toEqual(['TOP10_SELECCIONADO', 'TOP10_SELECCIONADO', 'TOP20', 'SIN_RANKING']);
    expect(Object.values(statuses).filter((s) => s === 'TOP10_SELECCIONADO').length).toBe(10);
    const pub = JSON.stringify(p.post({ accion: 'config_publica' }).json());
    expect(/TOP20|top_privado|Top 20/.test(pub)).toBe(false);
    expect(p.run('accionGuardarEvaluacion', Object.assign({ code: 'B-003', enviar: true }, all(5)), juror(1)).ok).toBe(false);
  });
});

// ===========================================================================
describe('QA-11: e-mails are idempotent, retried, logged, and carry production links only', () => {
  const env = once(() => {
    const account = F.newAccount();
    const test = F.installTest(account, 'pruebas');
    F.registerAndIssueCodes(test.project, 3);
    return { account, test };
  });

  it('running the emission and the bulk send again never mails anyone twice', () => {
    const { account, test } = env();
    const sent = account.outbox.length;
    test.project.run('accionAsignarCodigos', {}, ADMIN);
    const bulk = test.project.run('accionEnviarCorreos', { plantilla: 'ASIGNACION' }, ADMIN);
    expect([bulk.encolados, bulk.ya_enviados_antes, account.outbox.length]).toEqual([0, 3, sent]);
  });
  it('each log row keeps template, version, recipient, ids, trigger, status and retries', () => {
    const e = env().test.project.records('_EMAIL_LOG').find((x) => x.template_key === 'ASIGNACION' && x.code === 'B-001');
    expect([e.template_version, e.status, e.retry_count, /^S-/.test(e.submission_id), e.code, e.trigger, !!e.idempotency_key])
      .toEqual(['T3-2026-09-29', 'ENVIADO', 0, true, 'B-001', 'asignacion', true]);
  });
  it('a failing send is retried up to 3 times, then FALLIDO; staff can re-queue it after fixing the address', () => {
    const { test } = env();
    const p = test.project;
    p.run('accionEnviarCorreos', { plantilla: 'RECORDATORIO_24H', code: 'B-002' }, ADMIN);
    p.execute('break address', (g) => {
      const rows = g.leerHoja('_EMAIL_LOG');
      const r = rows.find((x) => x.template_key === 'RECORDATORIO_24H');
      g.actualizarFila('_EMAIL_LOG', r._fila, { status: 'PENDIENTE', recipient: 'not-an-address' });
    });
    [1, 2, 3].forEach(() => p.run('processEmailQueue', { limit: 5 }));
    const failed = p.records('_EMAIL_LOG').find((x) => x.template_key === 'RECORDATORIO_24H');
    expect([failed.status, failed.retry_count]).toEqual(['FALLIDO', 3]);
    expect(p.run('accionReintentarCorreos', {}, ADMIN).reencolados).toBe(1);
    p.run('processEmailQueue', { limit: 5 });
    expect(p.records('_EMAIL_LOG').find((x) => x.template_key === 'RECORDATORIO_24H').status).toBe('ENVIADO');
  });
  it('in production an e-mail with a test/local link is never sent', () => {
    const account = F.newAccount();
    const prod = F.installProduction(account, 'prod').project;
    F.setConfig(prod, 'evento_direccion', 'http://localhost:8080/mapa');
    prod.run('accionInscribir', F.validSubmission());
    const e = prod.records('_EMAIL_LOG')[0];
    expect([e.status, /CONTENIDO_NO_PERMITIDO/.test(e.error), account.outbox.length]).toEqual(['FALLIDO', true, 0]);
  });
});

// ===========================================================================
describe('QA-12: private access', () => {
  const env = once(() => {
    const account = F.newAccount();
    const test = F.installTest(account, 'pruebas');
    F.registerAndIssueCodes(test.project, 2);
    test.project.run('accionRegistrarEstado', { code: 'B-001', estado: 'CHECK-IN' }, ADMIN);
    test.project.run('accionRegistrarEstado', { code: 'B-001', estado: 'REALIZADA' }, ADMIN);
    return { account, test };
  });
  const api = (payload) => env().test.project.clientCall('api', payload);

  it('juror A writes only in JURADO_1 and never sees juror B marks, contact data or the ranking', () => {
    const { test } = env();
    const t1 = test.tokens['jurado-1'];
    const t2 = test.tokens['jurado-2'];
    api(Object.assign({ accion: 'guardar_evaluacion', t: t2, code: 'B-001', enviar: true }, all(4)));
    const saved = api(Object.assign({ accion: 'guardar_evaluacion', t: t1, code: 'B-001' }, all(3)));
    expect(saved.hoja).toBe('JURADO_1');
    const list = JSON.stringify(api({ accion: 'lista_evaluacion', t: t1 }));
    const reg = test.project.records('REGISTRO')[0];
    expect([list.includes(String(reg.id_number)), list.includes(reg.email), list.includes('"total":80')]).toEqual([false, false, false]);
    ['resultados', 'dashboard', 'listar_registro', 'bolsa', 'exportar_excel'].forEach((a) => {
      expect(api({ accion: a, t: t1 }).codigo_http).toBe(403);
    });
  });
  it('direction sees masked data only; check-in can not validate disqualifications nor consolidate', () => {
    const { test } = env();
    const dir = test.tokens.direccion;
    expect(api({ accion: 'listar_registro', t: dir }).codigo_http).toBe(403);
    const masked = api({ accion: 'listar_registro_enmascarado', t: dir });
    expect(masked.filas[0].id_number).toMatch(/^\*+\d{4}$/);
    const ck = test.tokens['checkin-1'];
    expect(api({ accion: 'consolidar_lista', t: ck, confirmacion: 'CONSOLIDAR' }).codigo_http).toBe(403);
    expect(api({ accion: 'cerrar_resultados', t: ck, confirmacion: 'CERRAR' }).codigo_http).toBe(403);
    expect(api({ accion: 'desbloquear_lista', t: test.tokens.coordinacion, motivo: 'probando acceso' }).codigo_http).toBe(403);
  });
  it('a wrong team key reveals nothing and 10 wrong keys lock that team code for a while', () => {
    const p = env().test.project;
    for (let i = 0; i < 10; i++) p.run('accionConsultarAgrupacion', { group_code: 'EQ-001', group_key: 'WRONGKEY' + i });
    const reg = p.records('REGISTRO').find((r) => r.team_code === 'EQ-001');
    const locked = p.run('accionConsultarAgrupacion', { group_code: 'EQ-001', group_key: p.run('groupAccessKey', 'EQ-001') });
    expect([locked.ok, locked.motivo, JSON.stringify(locked).includes(String(reg.id_number))]).toEqual([false, 'BLOQUEO', false]);
  });
  it('team links stop working after CONFIG enlaces_equipo_vencen', () => {
    const { account, test } = env();
    account.setNow('2026-10-25T09:00:00-05:00');
    const r = test.project.run('accionConsultarAgrupacion', { group_code: 'EQ-002', group_key: test.project.run('groupAccessKey', 'EQ-002') });
    account.setNow(F.DEFAULT_NOW);
    expect([r.ok, r.motivo]).toEqual([false, 'VENCIDO']);
  });
  it('the public configuration carries no personal data and no internal stage flags', () => {
    const pub = JSON.stringify(env().test.project.post({ accion: 'config_publica' }).json());
    expect(/@example\.com|1036|lista_oficial|resultados_cerrados|token/.test(pub)).toBe(false);
  });
});

// ===========================================================================
describe('QA-13: the insurance export matches the source of truth', () => {
  it('SEGURO_MAYORCA counts the people of coded projects; only authorized roles can export it', () => {
    const account = F.newAccount();
    const test = F.installTest(account, 'pruebas');
    F.registerAndIssueCodes(test.project, 4);
    test.project.run('refrescarVistas');
    expect(test.project.records('SEGURO_MAYORCA').length).toBe(4);
    const call = (alias) => test.project.clientCall('api', { accion: 'exportar_seguro', t: test.tokens[alias] });
    expect(call('checkin-1').codigo_http).toBe(403);
    const ok = call('coordinacion');
    expect([ok.ok, ok.hojas.SEGURO_MAYORCA]).toEqual([true, 4]);
  });
});

process.exit(ejecutar());
