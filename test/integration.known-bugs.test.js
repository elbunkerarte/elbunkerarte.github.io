/**
 * KNOWN BUGS - each test states the CORRECT behaviour and currently FAILS.
 *
 * Not part of `npm test` (run with `npm run test:known-bugs`). When a fix
 * lands, its test turns green and should move into integration.test.js.
 *
 * Every scenario runs the real server code on the emulator (test/gas/). The
 * root cause of most of them is Google Sheets typing the strings the code
 * writes: '16:00' becomes a 1899-12-30 time value, '2026-10-02' a Date and
 * '1036448960' a Number. Confidence notes are given where the emulator models
 * Sheets behaviour that has not been re-verified on a live spreadsheet.
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

// ===========================================================================
describe('Known bug: CONFIG values typed into the sheet are coerced and then ignored', () => {
  const env = once(() => {
    const account = F.newAccount();
    const project = account.createProject('prod');
    project.run('setupInicial');
    return { account, project };
  });

  it("CONFIG evento_hora_inicio = '15:00' moves the first block to 15:00 (agendaConfigurada().inicio_minutos === 900)", () => {
    const { project } = env();
    const stored = F.setConfig(project, 'evento_hora_inicio', '15:00');
    // Sheets stored a 1899-12-30 time value; leerHoja turns it into '1899-12-30T15:00:00',
    // horaAMinutos() does not match that and agendaConfigurada() falls back to 16:00.
    expect(Object.prototype.toString.call(stored)).toBe('[object Date]');
    expect('inicio_minutos=' + project.run('agendaConfigurada').inicio_minutos).toBe('inicio_minutos=900');
  });
  it('config_publica returns the event date and start hour as typed (2026-10-02 / 16:00)', () => {
    const { project } = env();
    F.setConfig(project, 'evento_hora_inicio', '16:00');
    const evento = project.post({ accion: 'config_publica' }).json().evento;
    expect([evento.fecha, evento.hora_inicio]).toEqual(['2026-10-02', '16:00']);
  });
});

// ===========================================================================
describe('Known bug: duplicate detection at submission time', () => {
  const env = once(() => {
    const account = F.newAccount();
    const project = account.createProject('prod');
    project.run('setupInicial');
    project.run('accionInscribir', F.validSubmission({ client_submission_id: 'first' }));
    return { account, project };
  });

  it('a second submission with the same document number is labelled DUPLICADO', () => {
    // normalized_id_number reads back as a Number; detectarDuplicado compares it to a String with ===.
    const r = env().project.run('accionInscribir', F.validSubmission({
      client_submission_id: 'same-document', email: 'other@example.com', whatsapp: '3019998877' }));
    expect([r.eligibility_status, r.duplicado]).toEqual(['DUPLICADO', true]);
  });
  it('a submission that only shares the WhatsApp number raises the REVISION alert', () => {
    const r = env().project.run('accionInscribir', F.validSubmission({
      client_submission_id: 'same-phone', id_number: '55667788', email: 'third@example.com' }));
    expect(r.eligibility_status).toBe('REVISION');
  });
});

// ===========================================================================
describe('Known bug: schedule times shown to people read "1899-12-30T..."', () => {
  const env = once(() => {
    const account = F.newAccount();
    const test = F.installTest(account, 'pruebas');
    const rows = F.registerAndIssueCodes(test.project, 12);
    return { account, test, rows };
  });

  it('the participant status lookup returns arrival and audition times as HH:mm', () => {
    const { test, rows } = env();
    const who = rows.find((r) => r.code === 'B-001');
    const st = test.project.run('accionConsultarEstado', { code: 'B-001', id_number: String(who.id_number) });
    expect([st.hora_llegada, st.hora_audicion]).toEqual(['15:45', '16:00']);
  });
  it('the ASIGNACION message tells the participant HH:mm times', () => {
    const { test } = env();
    const m = test.project.run('accionMensajes', { plantilla: 'ASIGNACION', code: 'B-001' }, F.ADMIN_SESSION).mensajes[0];
    expect(m.cuerpo).toContain('HORA DE LLEGADA: 15:45');
    expect(m.cuerpo).toContain('HORA DE AUDICION: 16:00');
  });
  it('the check-in desk can evaluate punctuality (5-minute rule) for a participant with a code', () => {
    const r = env().test.project.run('accionBuscarParticipante', { code: 'B-001', hora_llegada: '16:07' });
    expect(r.puntualidad && r.puntualidad.recomendacion).toBe('CONTINGENCIA');
  });
});

// ===========================================================================
describe('Known bug: destructive helpers are only guarded in their wrappers (audit C11)', () => {
  const env = once(() => {
    const account = F.newAccount();
    const { project } = F.installProduction(account, 'prod');
    project.run('accionInscribir', F.validSubmission());
    return { account, project };
  });

  it('borrarDatosDePrueba("SI-BORRAR") run directly in production is BLOQUEADO and deletes nothing', () => {
    const { project } = env();
    expect(() => project.run('borrarDatosDePrueba', 'SI-BORRAR')).toThrow('BLOQUEADO');
    expect(project.records('REGISTRO')).toHaveLength(1);
  });
  it('cargarDatosDePrueba() run directly in production is BLOQUEADO and loads no seed rows', () => {
    const { project } = env();
    let error = null;
    try { project.run('cargarDatosDePrueba'); } catch (e) { error = e; }
    const seeds = project.records('REGISTRO').filter((r) => r.source === 'seed').length;
    expect('error=' + !!error + ' seedRows=' + seeds).toBe('error=true seedRows=0');
  });
});

// ===========================================================================
describe('Known bug: participant free text is re-interpreted by Sheets', () => {
  const env = once(() => {
    const account = F.newAccount();
    const test = F.installTest(account, 'pruebas');
    test.project.run('accionInscribir', F.uniqueSubmission(1, { full_name: '=HYPERLINK("https://evil.test","Ana Gomez")' }));
    test.project.run('accionInscribir', F.uniqueSubmission(2, { whatsapp: '+57 311 000 0002' }));
    test.project.run('accionInscribir', F.uniqueSubmission(3, { audition_description: '- Sings a cappella and dances' }));
    test.project.run('accionAsignarCodigos', {}, F.ADMIN_SESSION);
    return { account, test };
  });

  it('a name starting with "=" is stored as text, not as a live formula (formula injection)', () => {
    const { test } = env();
    const injected = test.project.warningsOf('formula-from-string')
      .filter((w) => w.detail && w.detail.sheet === 'REGISTRO' && w.message.indexOf('became a formula: "=') !== -1);
    expect(injected.map((w) => w.message)).toEqual([]);
  });
  it('a WhatsApp number typed as "+57 311 000 0002" survives and still gets a WhatsApp link [confidence ~70%: verify on a live sheet]', () => {
    const { test } = env();
    const row = test.project.records('REGISTRO').find((r) => r.email === 'participant0002@example.com');
    expect(row.whatsapp).toBe('+57 311 000 0002');
    const m = test.project.run('accionMensajes', { plantilla: 'ASIGNACION', code: row.code }, F.ADMIN_SESSION).mensajes[0];
    expect(m.whatsapp_url).toMatch(/^https:\/\/wa\.me\/573110000002/);
  });
  it('a description starting with "- " survives in REGISTRO [confidence ~70%: verify on a live sheet]', () => {
    const row = env().test.project.records('REGISTRO').find((r) => r.email === 'participant0003@example.com');
    expect(row.audition_description).toBe('- Sings a cappella and dances');
  });
});

// ===========================================================================
describe('Known bug: service calls grow with the number of rows (Apps Script time limits)', () => {
  it('one submission does not open the spreadsheet once per existing row', () => {
    const account = F.newAccount();
    const test = F.installTest(account, 'pruebas').project;
    test.run('accionInscribir', F.uniqueSubmission(1));
    const withOne = test.lastExecution.calls['SpreadsheetApp.openById'];
    for (let i = 2; i <= 100; i++) test.run('accionInscribir', F.uniqueSubmission(i));
    const withHundred = test.lastExecution.calls['SpreadsheetApp.openById'];
    // zonaHoraria() -> libro() -> getProperty + openById for EVERY Date cell leerHoja reads.
    expect('extra openById calls with 99 more rows: ' + (withHundred - withOne)).toBe('extra openById calls with 99 more rows: 0');
  });
  it('a check-in lookup with 100 coded participants makes fewer than 20 openById calls', () => {
    const account = F.newAccount();
    const test = F.installTest(account, 'pruebas').project;
    F.registerAndIssueCodes(test, 100);
    test.run('accionBuscarParticipante', { code: 'B-050' });
    expect(test.lastExecution.calls['SpreadsheetApp.openById']).toBeLessThan(20);
  });
});

// ===========================================================================
describe('Known bug: a trashed backup folder keeps receiving backups', () => {
  it('after the backup folder is moved to the trash, the next backup is not stored in the trash [confidence ~80%]', () => {
    const account = F.newAccount();
    const test = F.installTest(account, 'pruebas').project;
    test.run('accionRespaldar', {}, F.ADMIN_SESSION);
    const folderId = test.scriptProperty('CARPETA_BACKUPS');
    test.execute('trash folder', (g) => g.DriveApp.getFolderById(folderId).setTrashed(true));
    account.advance(60 * 1000);
    const second = test.run('accionRespaldar', {}, F.ADMIN_SESSION);
    const file = account.drive.get(second.xlsx.id);
    const parentTrashed = Array.from(file.parents).every((id) => account.drive.get(id).trashed);
    expect('backup parent trashed: ' + parentTrashed).toBe('backup parent trashed: false');
  });
});

process.exit(ejecutar());
