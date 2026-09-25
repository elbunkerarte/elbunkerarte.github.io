/**
 * Integration tests: the WHOLE server (every apps-script/*.gs file plus the
 * HTML templates) running on the in-memory Apps Script emulator in test/gas/.
 *
 * The guarantees under test are the ones that matter on event day:
 * production/test isolation, idempotent registration, the production guard,
 * every page rendering, backups that restore, and the schedule-change rules.
 *
 * Tests that document CURRENT BUGS (expected to fail until fixed) live in
 * test/integration.known-bugs.test.js, which is not part of `npm test`.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { describe, it, expect, ejecutar } = require('./runner');
const F = require('./gas/fixtures');
const { XLSX_MIME } = require('./gas');

/** Memoises a fixture so each scenario is built once and shared by its tests. */
function once(build) {
  let value;
  let built = false;
  return () => {
    if (!built) { value = build(); built = true; }
    return value;
  };
}

function snapshotOf(project) {
  return project.spreadsheet().snapshot();
}

// ===========================================================================
describe('Emulator contract: Google Sheets value coercion', () => {
  const scratch = once(() => {
    const account = F.newAccount();
    const project = account.createProject('scratch');
    return { account, project };
  });

  /** Writes `value` into a fresh cell (optionally pre-formatted) and returns what reading it gives, formatted. */
  function roundTrip(value, format) {
    return scratch().project.execute('roundTrip', (g) => {
      const ss = g.SpreadsheetApp.create('coercion');
      ss.setSpreadsheetTimeZone('America/Bogota');
      const cell = ss.getSheets()[0].getRange('B2');
      if (format) cell.setNumberFormat(format);
      cell.setValue(value);
      const v = cell.getValue();
      const isDate = v instanceof g.Date;
      return {
        type: isDate ? 'Date' : typeof v,
        value: isDate ? g.Utilities.formatDate(v, 'America/Bogota', "yyyy-MM-dd'T'HH:mm:ss") : v,
        formula: cell.getFormula()
      };
    });
  }

  it("turns '2026-10-02' into a Date at local midnight", () => {
    expect(roundTrip('2026-10-02')).toEqual({ type: 'Date', value: '2026-10-02T00:00:00', formula: '' });
  });
  it("turns '2026-10-02 18:00' into a Date with that local time", () => {
    expect(roundTrip('2026-10-02 18:00').value).toBe('2026-10-02T18:00:00');
  });
  it("turns '16:00' into the 1899-12-30 16:00 time value", () => {
    expect(roundTrip('16:00')).toEqual({ type: 'Date', value: '1899-12-30T16:00:00', formula: '' });
    expect(roundTrip('16:00:00').value).toBe('1899-12-30T16:00:00');
  });
  it('turns numeric strings into numbers and drops leading zeros', () => {
    expect(roundTrip('1036448960')).toEqual({ type: 'number', value: 1036448960, formula: '' });
    expect(roundTrip('3001234567').value).toBe(3001234567);
    expect(roundTrip('0012').value).toBe(12);
    expect(roundTrip('3.5').value).toBe(3.5);
  });
  it("turns 'TRUE'/'false' into booleans", () => {
    expect(roundTrip('TRUE').value).toBe(true);
    expect(roundTrip('false').value).toBe(false);
  });
  it('keeps a leading apostrophe as a text marker', () => {
    expect(roundTrip("'0012")).toEqual({ type: 'string', value: '0012', formula: '' });
  });
  it('leaves ISO strings with an explicit offset as text', () => {
    expect(roundTrip('2026-10-01T18:00:00-05:00')).toEqual({ type: 'string', value: '2026-10-01T18:00:00-05:00', formula: '' });
  });
  it('leaves plain words, empty strings and impossible dates as text', () => {
    expect(roundTrip('Sabaneta').value).toBe('Sabaneta');
    expect(roundTrip('').value).toBe('');
    expect(roundTrip('2026-02-31').value).toBe('2026-02-31');
  });
  it("stores strings verbatim when the cell format is plain text '@'", () => {
    expect(roundTrip('16:00', '@')).toEqual({ type: 'string', value: '16:00', formula: '' });
    expect(roundTrip('0012', '@').value).toBe('0012');
    expect(roundTrip('2026-10-02', '@').value).toBe('2026-10-02');
  });
  it("turns a string starting with '=' into a formula", () => {
    expect(roundTrip('=1+1').formula).toBe('=1+1');
  });
  it('keeps numbers, booleans and Dates written as such', () => {
    expect(roundTrip(42).value).toBe(42);
    expect(roundTrip(false).value).toBe(false);
    const d = scratch().project.execute('date', (g) => {
      const cell = g.SpreadsheetApp.create('d').getSheets()[0].getRange(1, 1);
      cell.setValue(new g.Date(2026, 9, 2, 15, 30));
      return g.Utilities.formatDate(cell.getValue(), 'America/Bogota', 'yyyy-MM-dd HH:mm');
    });
    expect(d).toBe('2026-10-02 15:30');
  });
  it('keeps the date format after clearContent, so a later number reads back as a Date', () => {
    const r = scratch().project.execute('format', (g) => {
      const cell = g.SpreadsheetApp.create('f').getSheets()[0].getRange(1, 1);
      cell.setValue('2026-10-02');
      cell.clearContent();
      cell.setValue(5);
      return cell.getValue() instanceof g.Date;
    });
    expect(r).toBe(true);
  });
  it('rejects setValues with the wrong dimensions like Apps Script', () => {
    expect(() => scratch().project.execute('dims', (g) => {
      g.SpreadsheetApp.create('x').getSheets()[0].getRange(1, 1, 2, 2).setValues([[1, 2], [3]]);
    })).toThrow('The number of columns in the data does not match the number of columns in the range. The data has 1 but the range has 2.');
  });
  it('rejects a range of zero rows', () => {
    expect(() => scratch().project.execute('zero', (g) => {
      g.SpreadsheetApp.create('x').getSheets()[0].getRange(2, 1, 0, 3);
    })).toThrow('The number of rows in the range must be at least 1.');
  });
  it('getLastRow ignores cleared rows', () => {
    const last = scratch().project.execute('last', (g) => {
      const sh = g.SpreadsheetApp.create('x').getSheets()[0];
      sh.appendRow(['a']); sh.appendRow(['b']); sh.appendRow(['c']);
      sh.getRange(3, 1).clearContent();
      return sh.getLastRow();
    });
    expect(last).toBe(2);
  });
});

// ===========================================================================
describe('Emulator contract: other services', () => {
  const env = once(() => {
    const account = F.newAccount();
    return { account, project: account.createProject('services') };
  });

  it('starts every execution with fresh globals, like Google', () => {
    const { project } = env();
    project.execute('first', (g) => { g._cacheConfig = { stale: true }; });
    expect(project.execute('second', (g) => g._cacheConfig)).toBeNull();
  });
  it('freezes new Date() and Date.now() on the account clock', () => {
    const { account, project } = env();
    account.setNow('2026-10-02T15:00:00-05:00');
    const r = project.execute('clock', (g) => [new g.Date().toISOString(), g.Date.now(), new g.Date(2020, 0, 1).getFullYear()]);
    expect(r).toEqual(['2026-10-02T20:00:00.000Z', Date.parse('2026-10-02T20:00:00Z'), 2020]);
    account.setNow(F.DEFAULT_NOW);
  });
  it('formats dates like Java: unquoted letters throw, zones are honoured', () => {
    const { project } = env();
    const r = project.execute('fmt', (g) => {
      const d = new g.Date(Date.UTC(2026, 9, 2, 20, 0, 0));
      return [g.Utilities.formatDate(d, 'America/Bogota', "yyyy-MM-dd'T'HH:mm:ss"),
        g.Utilities.formatDate(d, 'UTC', 'HH:mm'), g.Utilities.formatDate(d, 'GMT', 'HH:mm Z')];
    });
    expect(r).toEqual(['2026-10-02T15:00:00', '20:00', '20:00 +0000']);
    expect(() => project.execute('bad', (g) => g.Utilities.formatDate(new g.Date(), 'UTC', 'yyyy-MM-ddTHH'))).toThrow("Illegal pattern character 'T'");
  });
  it('returns HMAC-SHA256 and digests as signed byte arrays', () => {
    const bytes = env().project.execute('hmac', (g) =>
      g.Utilities.computeHmacSha256Signature('The quick brown fox jumps over the lazy dog', 'key'));
    const hex = Buffer.from(bytes.map((b) => b & 0xff)).toString('hex');
    expect(hex).toBe('f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8');
    expect(bytes[0]).toBe(-9);
  });
  it('expires cache entries on the account clock', () => {
    const { account, project } = env();
    project.execute('put', (g) => g.CacheService.getScriptCache().put('k', 'v', 60));
    account.advance(59 * 1000);
    expect(project.execute('get', (g) => g.CacheService.getScriptCache().get('k'))).toBe('v');
    account.advance(2 * 1000);
    expect(project.execute('get', (g) => g.CacheService.getScriptCache().get('k'))).toBeNull();
    account.setNow(F.DEFAULT_NOW);
  });
  it('answers unmatched URLs with 404 when muted and throws when not', () => {
    const { project } = env();
    expect(project.execute('404', (g) => g.UrlFetchApp.fetch('https://example.test/x', { muteHttpExceptions: true }).getResponseCode())).toBe(404);
    expect(() => project.execute('throw', (g) => g.UrlFetchApp.fetch('https://example.test/x'))).toThrow('returned code 404');
  });
  it('honours followRedirects:false and routes stubs', () => {
    const { account, project } = env();
    account.stubUrl('https://video.test/private', { code: 302, headers: { Location: 'https://accounts.google.com/login' } });
    account.stubUrl(/^https:\/\/video\.test\/public/, (req) => ({ code: 200, body: { method: req.method } }));
    const r = project.execute('redirects', (g) => [
      g.UrlFetchApp.fetch('https://video.test/private', { followRedirects: false, muteHttpExceptions: true }).getResponseCode(),
      g.UrlFetchApp.fetch('https://video.test/private').getContentText().indexOf('Sign in') !== -1,
      JSON.parse(g.UrlFetchApp.fetch('https://video.test/public/1').getContentText()).method
    ]);
    expect(r).toEqual([302, true, 'GET']);
  });
  it('enforces the account-wide daily mail quota', () => {
    const { account, project } = env();
    account.setMailQuota(1);
    project.execute('mail', (g) => g.MailApp.sendEmail('a@example.com', 'subject', 'body'));
    expect(() => project.execute('mail', (g) => g.MailApp.sendEmail('b@example.com', 's', 'b'))).toThrow('Service invoked too many times for one day: email.');
    expect(account.outbox).toHaveLength(1);
    account.setMailQuota(100);
  });
  it('returns null document lock/properties for a standalone script (as Google does)', () => {
    expect(env().project.execute('doc', (g) => [g.LockService.getDocumentLock(), g.PropertiesService.getDocumentProperties()]))
      .toEqual([null, null]);
  });
});

// ===========================================================================
describe('Emulator contract: Drive, developer metadata, row groups, templates, triggers', () => {
  const env = once(() => {
    const account = F.newAccount();
    return { account, a: account.createProject('project-a'), b: account.createProject('project-b') };
  });

  it('shares one Drive between projects and lists spreadsheets as Drive files', () => {
    const { account, a, b } = env();
    const id = a.execute('create', (g) => g.SpreadsheetApp.create('Shared name').getId());
    const seenByB = b.execute('find', (g) => {
      const file = g.DriveApp.getFileById(id);
      return [file.getName(), file.getMimeType(), g.DriveApp.getFilesByName('Shared name').hasNext()];
    });
    expect(seenByB).toEqual(['Shared name', 'application/vnd.google-apps.spreadsheet', true]);
    expect(account.drive.list((i) => i.id === id)[0].createdBy).toBe('project-a');
  });
  it('creates, copies, moves and trashes files with Apps Script semantics', () => {
    const r = env().a.execute('drive', (g) => {
      const folder = g.DriveApp.createFolder('Audio');
      const sub = folder.createFolder('B-001');
      const file = folder.createFile('track.txt', 'hello', 'text/plain');
      const copy = file.makeCopy('track-copy.txt', sub);
      file.moveTo(sub);
      file.setTrashed(true);
      const names = [];
      const it = sub.getFiles();
      while (it.hasNext()) names.push(it.next().getName());
      return [copy.getBlob().getDataAsString(), file.getSize(), names.sort(),
        g.DriveApp.getFileById(file.getId()).isTrashed(), file.getParents().next().getName()];
    });
    expect(r).toEqual(['hello', 5, ['track-copy.txt', 'track.txt'], true, 'B-001']);
  });
  it('keeps PROJECT-visible developer metadata private to its project', () => {
    const { a, b } = env();
    const id = a.execute('md', (g) => {
      const ss = g.SpreadsheetApp.create('md');
      ss.addDeveloperMetadata('bunker_environment', 'test');
      ss.addDeveloperMetadata('secret', 'x', g.SpreadsheetApp.DeveloperMetadataVisibility.PROJECT);
      return ss.getId();
    });
    const fromA = a.execute('a', (g) => g.SpreadsheetApp.openById(id).createDeveloperMetadataFinder().withKey('secret').find().length);
    const fromB = b.execute('b', (g) => {
      const ss = g.SpreadsheetApp.openById(id);
      const env0 = ss.createDeveloperMetadataFinder().withKey('bunker_environment').find()[0];
      env0.setValue('production');
      return [env0.getValue(), ss.getDeveloperMetadata().length, ss.createDeveloperMetadataFinder().withKey('secret').find().length];
    });
    expect([fromA, fromB]).toEqual([1, ['production', 1, 0]]);
  });
  it('stores row group depth per row and collapses groups', () => {
    const r = env().a.execute('groups', (g) => {
      const sheet = g.SpreadsheetApp.create('groups').getSheets()[0];
      sheet.getRange(3, 1, 4, 1).shiftRowGroupDepth(1);
      sheet.getRange(4, 1, 2, 1).shiftRowGroupDepth(1);
      sheet.getRange(3, 1, 4, 1).collapseGroups();
      const group = sheet.getRowGroup(3, 1);
      return [sheet.getRowGroupDepth(2), sheet.getRowGroupDepth(3), sheet.getRowGroupDepth(4), group.getRange().getNumRows(),
        group.isCollapsed(), sheet.getRowGroup(4, 2).isCollapsed()];
    });
    expect(r).toEqual([0, 1, 2, 4, true, true]);
  });
  it('escapes printing scriptlets by context and runs block scriptlets across chunks', () => {
    const html = env().a.execute('template', (g) => {
      const t = g.HtmlService.createTemplate(
        "<p><?= name ?></p><script>var s = '<?= name ?>'; var v = <?= name ?>;</script>" +
        '<ul><? for (var i = 0; i < 2; i++) { ?><li><?= i ?></li><? } ?></ul><?!= raw ?>');
      t.name = "a'b<c";
      t.raw = '<b>ok</b>';
      return t.evaluate().getContent();
    });
    expect(html).toBe('<p>a&#39;b&lt;c</p><script>var s = \'a\\x27b\\x3cc\'; var v = "a\'b\\u003cc";</script>' +
      '<ul><li>0</li><li>1</li></ul><b>ok</b>');
  });
  it('validates trigger builders like Apps Script', () => {
    const { a } = env();
    expect(() => a.execute('t', (g) => g.ScriptApp.newTrigger('x').timeBased().everyMinutes(7).create())).toThrow('everyMinutes');
    expect(() => a.execute('t', (g) => g.ScriptApp.newTrigger('x').timeBased().everyHours(6).atHour(3).create())).toThrow('atHour');
    a.execute('t', (g) => g.ScriptApp.newTrigger('doesNotExist').timeBased().everyMinutes(5).create());
    expect(a.missingTriggerHandlers()).toEqual(['doesNotExist']);
  });
  it('shifts values and group depth on insertRowsAfter/deleteRows and enforces sheet limits', () => {
    const r = env().a.execute('structure', (g) => {
      const ss = g.SpreadsheetApp.create('structure');
      const sheet = ss.getSheets()[0].setName('DATA');
      sheet.setFrozenRows(1).setColumnWidths(1, 3, 120).setTabColor('#F7A705');
      sheet.getRange('A1:B3').setValues([['h1', 'h2'], ['a', 1], ['b', 2]]);
      sheet.getRange(3, 1).shiftRowGroupDepth(1);
      sheet.insertRowsAfter(1, 2);
      const afterInsert = [sheet.getRange('A4').getValue(), sheet.getRange('A5').getValue(), sheet.getRowGroupDepth(5), sheet.getMaxRows()];
      sheet.deleteRows(2, 2);
      const afterDelete = [sheet.getRange('A2').getValue(), sheet.getRowGroupDepth(3), sheet.getLastRow()];
      let hideError = '';
      try { sheet.hideSheet(); } catch (e) { hideError = e.message; }
      let deleteAllError = '';
      try { sheet.deleteRows(2, sheet.getMaxRows() - 1); } catch (e) { deleteAllError = e.message; }
      ss.insertSheet('OTHER');
      sheet.hideSheet();
      ss.rename('Renamed');
      return [afterInsert, afterDelete, hideError, deleteAllError, sheet.isSheetHidden(), ss.getName(),
        g.Session.getActiveUser().getEmail(), g.Session.getEffectiveUser().getEmail(), g.Session.getScriptTimeZone()];
    });
    expect(r).toEqual([['a', 'b', 1, 1002], ['a', 1, 3], "You can't hide all the sheets in a document.",
      'Sorry, it is not possible to delete all non-frozen rows.', true, 'Renamed', '', 'owner@example.test', 'America/Bogota']);
  });
  it('loads the source as one bundled script (the deploy layout) as well as file by file', () => {
    const account = F.newAccount();
    const bundled = account.createProject('bundled', { mode: 'bundle' });
    bundled.run('setupInicial');
    expect(bundled.get({ p: 'inscripcion' }).body).toContain('Inscripción a la convocatoria');
  });
});

// ===========================================================================
describe('Setup: production project', () => {
  const setup = once(() => {
    const account = F.newAccount();
    const project = account.createProject('prod');
    const first = project.run('setupInicial');
    const afterFirst = {
      config: project.records('CONFIG').length,
      users: project.records('_USUARIOS').length,
      triggers: project.triggers.length,
      sheets: project.spreadsheet().sheets.map((s) => s.name)
    };
    const second = project.run('setupInicial');
    return { account, project, first, second, afterFirst };
  });

  it('creates every sheet declared in HOJA, each with its header row', () => {
    const { project } = setup();
    const g = project.ctx;
    const expected = Object.keys(g.HOJA).map((k) => g.HOJA[k]);
    expect(project.spreadsheet().sheets.map((s) => s.name).sort()).toEqual(expected.slice().sort());
    expect(project.spreadsheet().values('REGISTRO')[0]).toEqual(Array.from(g.COLUMNAS_REGISTRO));
    expect(project.spreadsheet().values('_USUARIOS')[0]).toEqual(Array.from(g.COLUMNAS_USUARIOS));
  });
  it('removes the default Sheet1', () => {
    expect(setup().project.spreadsheet().findSheet('Sheet1')).toBeNull();
  });
  it('writes every default CONFIG row', () => {
    const { project } = setup();
    const defaults = project.ctx.configuracionPorDefecto().slice(1).map((r) => r[0]);
    expect(project.records('CONFIG').map((r) => r.clave)).toEqual(Array.from(defaults));
  });
  it('provisions an active admin user', () => {
    const users = setup().project.records('_USUARIOS');
    expect(users.map((u) => [u.email_o_alias, u.rol, u.activo])).toEqual([['admin', 'admin', 'SI']]);
  });
  it('installs the daily backup and the view-refresh triggers', () => {
    const { project } = setup();
    expect(project.triggers.map((t) => t.handler).sort()).toEqual(['refrescarVistas', 'respaldoAutomatico', 'verificarVideosPendientes']);
    expect(project.triggers.find((t) => t.handler === 'respaldoAutomatico').spec).toEqual({ everyDays: 1, atHour: 23 });
    expect(project.triggers.find((t) => t.handler === 'verificarVideosPendientes').spec).toEqual({ everyHours: 1 });
    expect(project.missingTriggerHandlers()).toEqual([]);
  });
  it('is idempotent: same spreadsheet, no duplicate CONFIG rows, users or triggers', () => {
    const { account, project, first, second, afterFirst } = setup();
    expect(second.spreadsheet_id).toBe(first.spreadsheet_id);
    expect(account.spreadsheets.size).toBe(1);
    expect(project.records('CONFIG').length).toBe(afterFirst.config);
    expect(project.records('_USUARIOS').length).toBe(afterFirst.users);
    expect(project.triggers.length).toBe(afterFirst.triggers);
    expect(project.spreadsheet().sheets.map((s) => s.name)).toEqual(afterFirst.sheets);
  });
  it('produces no emulator warnings (formulas from strings, undefined prints, held locks)', () => {
    expect(setup().project.warnings).toEqual([]);
  });
});

// ===========================================================================
describe('Registration (Form 1)', () => {
  const env = once(() => {
    const account = F.newAccount();
    const project = account.createProject('prod');
    project.run('setupInicial');
    return { account, project };
  });

  it('stores exactly one row with eligibility APTO for a valid submission', () => {
    const { project } = env();
    const r = project.run('accionInscribir', F.validSubmission());
    expect(r.eligibility_status).toBe('APTO');
    const rows = project.records('REGISTRO');
    expect(rows).toHaveLength(1);
    expect([rows[0].submission_id, rows[0].eligibility_status, rows[0].code, rows[0].source])
      .toEqual([r.submission_id, 'APTO', '', 'web']);
  });
  it('stores one row for a repeated client_submission_id and marks the second answer repetido', () => {
    const { project } = env();
    const second = project.run('accionInscribir', F.validSubmission());
    expect(second.repetido).toBe(true);
    expect(second.submission_id).toBe(project.records('REGISTRO')[0].submission_id);
    expect(project.records('REGISTRO')).toHaveLength(1);
  });
  it('takes the script lock exactly once per submission and never nests it', () => {
    const { project } = env();
    const before = project.lockState.script.acquisitions;
    project.run('accionInscribir', F.uniqueSubmission(2));
    expect(project.lockState.script.acquisitions - before).toBe(1);
    expect(project.lockState.script.nestedAttempts).toBe(0);
    expect(project.lockState.script.leakedAtEnd).toBe(0);
  });
  it('answers "busy" when the lock is contended, writes nothing, and accepts the retry', () => {
    const { project } = env();
    const rows = project.records('REGISTRO').length;
    project.simulateLockContention(true);
    const busy = project.post({ accion: 'inscribir', ...F.uniqueSubmission(3) }).json();
    project.simulateLockContention(false);
    expect(busy.ok).toBe(false);
    expect(busy.error).toMatch('ocupado');
    expect(project.records('REGISTRO').length).toBe(rows);
    const retry = project.post({ accion: 'inscribir', ...F.uniqueSubmission(3) }).json();
    expect([retry.ok, retry.repetido]).toEqual([true, undefined]);
    expect(project.records('REGISTRO').length).toBe(rows + 1);
  });
  it('refuses new submissions when CONFIG inscripciones_abiertas is NO', () => {
    const { project } = env();
    const rows = project.records('REGISTRO').length;
    F.setConfig(project, 'inscripciones_abiertas', 'NO');
    const r = project.run('accionInscribir', F.uniqueSubmission(4));
    F.setConfig(project, 'inscripciones_abiertas', 'SI');
    expect(r.cerrado).toBe(true);
    expect(project.records('REGISTRO').length).toBe(rows);
  });
  it('labels an under-age submission NO_CUMPLE but still stores it', () => {
    const { project } = env();
    const r = project.run('accionInscribir', F.uniqueSubmission(5, { birth_date: '2012-05-10' }));
    expect(r.eligibility_status).toBe('NO_CUMPLE');
    expect(project.records('REGISTRO').some((x) => x.submission_id === r.submission_id)).toBe(true);
  });
});

// ===========================================================================
describe('Production guard', () => {
  const env = once(() => {
    const account = F.newAccount();
    const { project } = F.installProduction(account);
    project.run('accionInscribir', F.validSubmission());
    return { account, project };
  });

  it('ENSAYO() throws BLOQUEADO in production and leaves every sheet unchanged', () => {
    const { project } = env();
    const before = snapshotOf(project);
    expect(() => project.run('ENSAYO')).toThrow('BLOQUEADO');
    expect(snapshotOf(project)).toEqual(before);
    expect(project.records('REGISTRO')).toHaveLength(1);
  });
  it('LIMPIAR() throws BLOQUEADO in production and leaves every sheet unchanged', () => {
    const { project } = env();
    const before = snapshotOf(project);
    expect(() => project.run('LIMPIAR')).toThrow('BLOQUEADO');
    expect(snapshotOf(project)).toEqual(before);
    expect(project.records('REGISTRO')).toHaveLength(1);
  });
  it('treats a project without the ENTORNO property as PRODUCCION', () => {
    const { project } = env();
    expect(project.scriptProperty('ENTORNO')).toBeNull();
    expect(project.run('entorno')).toBe('PRODUCCION');
  });
});

// ===========================================================================
describe('Isolation: PRUEBAS project in the same Google account', () => {
  const timeline = once(() => {
    const account = F.newAccount();
    const prod = F.installProduction(account, 'prod');
    for (let i = 1; i <= 3; i++) prod.project.post({ accion: 'inscribir', ...F.uniqueSubmission(i) });
    prod.project.run('accionRespaldar', {}, F.ADMIN_SESSION);

    const prodBefore = snapshotOf(prod.project);
    const prodRowsBefore = prod.project.records('REGISTRO').length;

    const test = F.installTest(account, 'pruebas');
    const report = test.project.run('ENSAYO');
    const afterEnsayo = {
      testRows: test.project.records('REGISTRO'),
      prodSnapshot: snapshotOf(prod.project),
      prodRows: prod.project.records('REGISTRO').length
    };
    const testConfigRows = test.project.records('CONFIG').length;
    const testUserRows = test.project.records('_USUARIOS').length;
    test.project.run('LIMPIAR');
    const afterLimpiar = {
      testRows: test.project.records('REGISTRO').length,
      testConfigRows: test.project.records('CONFIG').length,
      testUserRows: test.project.records('_USUARIOS').length,
      prodSnapshot: snapshotOf(prod.project),
      prodRows: prod.project.records('REGISTRO').length
    };
    return { account, prod, test, report, prodBefore, prodRowsBefore, afterEnsayo, afterLimpiar, testConfigRows, testUserRows };
  });

  it('INSTALAR_PRUEBAS creates its own spreadsheet and marks the project PRUEBAS', () => {
    const { prod, test } = timeline();
    expect(test.project.spreadsheetId).toBeDefined();
    expect(test.project.spreadsheetId).not.toBe(prod.project.spreadsheetId);
    expect(test.project.scriptProperty('ENVIRONMENT')).toBe('test');
    expect(prod.project.scriptProperty('ENVIRONMENT')).toBeNull();
  });
  it('ENSAYO() in PRUEBAS issues exactly the 100 codes B-001..B-100', () => {
    const codes = timeline().afterEnsayo.testRows.map((r) => r.code).filter(Boolean);
    const expected = [];
    for (let n = 1; n <= 100; n++) expected.push('B-' + String(n).padStart(3, '0'));
    expect(codes.slice().sort()).toEqual(expected);
  });
  it('ENSAYO() leaves every production sheet byte-for-byte unchanged', () => {
    const { prodBefore, prodRowsBefore, afterEnsayo } = timeline();
    expect(afterEnsayo.prodRows).toBe(prodRowsBefore);
    expect(afterEnsayo.prodSnapshot).toEqual(prodBefore);
  });
  it('LIMPIAR() empties the PRUEBAS REGISTRO, keeps its CONFIG and users, and does not touch production', () => {
    const { prodBefore, prodRowsBefore, afterLimpiar, testConfigRows, testUserRows } = timeline();
    expect(afterLimpiar.testRows).toBe(0);
    expect(afterLimpiar.testConfigRows).toBe(testConfigRows);
    expect(afterLimpiar.testUserRows).toBe(testUserRows);
    expect(afterLimpiar.prodRows).toBe(prodRowsBefore);
    expect(afterLimpiar.prodSnapshot).toEqual(prodBefore);
  });
  it('never writes a seed row into production', () => {
    const rows = timeline().prod.project.records('REGISTRO');
    expect(rows.length).toBe(3);
    expect(rows.filter((r) => r.source === 'seed')).toHaveLength(0);
  });
  it('the PRUEBAS project never opens the production spreadsheet (and vice versa)', () => {
    const { prod, test } = timeline();
    expect(test.project.openedSpreadsheets.has(prod.project.spreadsheetId)).toBe(false);
    expect(prod.project.openedSpreadsheets.has(test.project.spreadsheetId)).toBe(false);
  });
  it('each project signs with its own secret: a production token is rejected by PRUEBAS', () => {
    const { prod, test } = timeline();
    expect(test.project.scriptProperty('SECRETO_HMAC')).not.toBe(prod.project.scriptProperty('SECRETO_HMAC'));
    expect(test.project.run('verificarToken', prod.tokens.admin).motivo).toBe('FIRMA_INVALIDA');
    expect(prod.project.run('verificarToken', test.tokens.admin).motivo).toBe('FIRMA_INVALIDA');
  });
  it('keeps backups in separate Drive folders', () => {
    const { prod, test } = timeline();
    const prodFolder = prod.project.scriptProperty('CARPETA_BACKUPS');
    const testFolder = test.project.scriptProperty('CARPETA_BACKUPS');
    expect(prodFolder).toBeDefined();
    expect(testFolder).not.toBe(prodFolder);
  });
  it('names the PRUEBAS master spreadsheet apart from production in the shared Drive', () => {
    expect(timeline().account.findSpreadsheetsByName('EL BUNKER - BASE MAESTRA')).toHaveLength(1);
    expect(timeline().account.findSpreadsheetsByName('[PRUEBAS] EL BUNKER - BASE MAESTRA')).toHaveLength(1);
  });
});

// ===========================================================================
describe('Shared account resources: mail quota', () => {
  it('email sent from PRUEBAS consumes the same daily quota production uses', () => {
    const account = F.newAccount();
    const prod = F.installProduction(account, 'prod').project;
    const test = F.installTest(account, 'pruebas').project;
    F.registerAndIssueCodes(test, 3);
    account.setMailQuota(3);
    const sent = test.run('accionEnviarCorreos', { plantilla: 'ASIGNACION' }, F.ADMIN_SESSION);
    expect(sent.enviados).toBe(3);
    expect(prod.execute('quota', (g) => g.MailApp.getRemainingDailyQuota())).toBe(0);
    expect(account.outbox.every((m) => m.project === 'pruebas')).toBe(true);
  });
});

// ===========================================================================
describe('Web app: doGet renders every page', () => {
  const web = once(() => {
    const account = F.newAccount();
    const prod = F.installProduction(account, 'prod');
    const test = F.installTest(account, 'pruebas');
    return { account, prod, test };
  });

  // Markers are quoted verbatim from the (Spanish) UI templates in apps-script/ui_*.html.
  const PAGES = [
    ['inscripcion', null, 'Inscripción a la convocatoria'],
    ['cambio-horario', null, 'Tu impedimento'],
    ['gracias', null, 'Consulta tu estado'],
    ['admin', 'admin', 'PANEL <span>BÚNKER</span>'],
    ['checkin', 'checkin-1', 'CHECK-<span>IN</span>'],
    ['jurado', 'jurado-1', 'JU<span>RADO</span>'],
    ['dashboard', 'direccion', 'DASH<span>BOARD</span>']
  ];
  const FORBIDDEN = 'No tienes acceso a esta sección';

  PAGES.forEach(([page, alias, marker]) => {
    it('renders ?p=' + page + (alias ? ' for ' + alias : '') + ' with its marker, shared styles and scripts', () => {
      const { prod } = web();
      const res = prod.project.get(alias ? { p: page, t: prod.tokens[alias] } : { p: page });
      expect(res.kind).toBe('html');
      expect(res.body).toContain(marker);
      expect(res.body).not.toContain(FORBIDDEN);
      expect(res.body).toContain('.banner-pruebas');          // ui_estilos was included
      expect(res.body).toContain('function llamar(');         // ui_scripts was included
      expect(res.body).toMatch(/window\.ENTORNO = 'PRODUCCION'/);
    });
  });

  it('prints the caller token into the page script unchanged', () => {
    const { prod } = web();
    const body = prod.project.get({ p: 'admin', t: prod.tokens.admin }).body;
    expect(body.match(/window\.TOKEN = '([^']*)'/)[1]).toBe(prod.tokens.admin);
  });
  it('sets the title from CONFIG and the allowed viewport meta tag', () => {
    const res = web().prod.project.get({ p: 'inscripcion' });
    expect(res.title).toBe('EL BÚNKER by Arte es la Solución');
    expect(res.output._meta).toEqual([{ name: 'viewport', content: 'width=device-width, initial-scale=1' }]);
    expect(res.output._xframe).toBe('ALLOWALL');
  });
  it('renders the 403 page for a jurado token on ?p=admin and logs ACCESO_DENEGADO', () => {
    const { prod } = web();
    const res = prod.project.get({ p: 'admin', t: prod.tokens['jurado-1'] });
    expect(res.body).toContain(FORBIDDEN);
    expect(res.body).toContain('ROL_SIN_ACCESO_A_ESTA_PAGINA');
    expect(res.body).not.toContain('PANEL <span>BÚNKER</span>');
    expect(prod.project.records('_LOG').some((l) => l.accion === 'ACCESO_DENEGADO' && l.entidad === 'admin')).toBe(true);
  });
  it('renders the 403 page without a token (SIN_TOKEN)', () => {
    expect(web().prod.project.get({ p: 'dashboard' }).body).toContain('SIN_TOKEN');
  });
  it('rejects a token signed by the other project (FIRMA_INVALIDA)', () => {
    const { test, prod } = web();
    expect(test.project.get({ p: 'admin', t: prod.tokens.admin }).body).toContain('FIRMA_INVALIDA');
  });
  it('rejects an expired token (EXPIRADO) once the clock passes 45 days', () => {
    const { account, prod } = web();
    account.setNow('2026-11-05T10:00:00-05:00');
    const body = prod.project.get({ p: 'admin', t: prod.tokens.admin }).body;
    account.setNow(F.DEFAULT_NOW);
    expect(body).toContain('EXPIRADO');
  });
  it('rejects the token of a deactivated user (USUARIO_INACTIVO)', () => {
    const { prod } = web();
    prod.project.execute('deactivate', (g) => {
      const sheet = F.masterSheet(g, '_USUARIOS');
      const values = sheet.getDataRange().getValues();
      const row = values.findIndex((r) => r[0] === 'checkin-2');
      sheet.getRange(row + 1, 4).setValue('NO');
    });
    expect(prod.project.get({ p: 'checkin', t: prod.tokens['checkin-2'] }).body).toContain('USUARIO_INACTIVO');
    expect(prod.project.get({ p: 'checkin', t: prod.tokens['checkin-1'] }).body).toContain('CHECK-<span>IN</span>');
  });
  it('PRUEBAS pages carry ENTORNO = PRUEBAS', () => {
    const { test } = web();
    for (const [page, alias] of PAGES) {
      const body = test.project.get(alias ? { p: page, t: test.tokens[alias] } : { p: page }).body;
      expect(body).toMatch(/window\.ENTORNO = 'PRUEBAS'/);
    }
  });
  it('renders without template warnings (undefined prints, unevaluated scriptlets)', () => {
    const { prod, test } = web();
    const warnings = prod.project.warnings.concat(test.project.warnings)
      .filter((w) => /^template|unevaluated/.test(w.type));
    expect(warnings).toEqual([]);
  });
  it('also renders through createTemplateFromFile when there is no PLANTILLAS registry', () => {
    const account = F.newAccount();
    const project = account.createProject('repo-layout', { templates: false });
    project.run('setupInicial');
    expect(project.ctx.PLANTILLAS).toBeUndefined();
    expect(project.get({ p: 'inscripcion' }).body).toContain('Inscripción a la convocatoria');
  });
  it('reports a template syntax error with the template name', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bunker-broken-template-'));
    const src = path.join(__dirname, '..', 'apps-script');
    for (const f of fs.readdirSync(src)) fs.copyFileSync(path.join(src, f), path.join(dir, f));
    const gracias = fs.readFileSync(path.join(dir, 'ui_gracias.html'), 'utf8');
    fs.writeFileSync(path.join(dir, 'ui_gracias.html'), gracias.replace("<?= ENTORNO ?>", '<?= ENTORNO ) ?>'));
    try {
      const account = F.newAccount();
      const project = account.createProject('broken', { sourceDir: dir });
      project.run('setupInicial');
      expect(() => project.run('renderizar', 'ui_gracias', {})).toThrow('Template "ui_gracias" failed to compile');
      expect(project.get({ p: 'gracias' }).body).toContain('ui_gracias');     // doGet falls back to the 403 page
      expect(project.get({ p: 'inscripcion' }).body).toContain('Inscripción a la convocatoria');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

// ===========================================================================
describe('Web app: doPost and google.script.run', () => {
  const env = once(() => {
    const account = F.newAccount();
    const prod = F.installProduction(account, 'prod');
    F.registerAndIssueCodes(prod.project, 3);
    return { account, prod };
  });

  it('answers a text/plain JSON body {accion:"config_publica"} with parseable JSON ok:true', () => {
    const res = env().prod.project.post({ accion: 'config_publica' }, { contentType: 'text/plain' });
    expect(res.mimeType).toBe('application/json');
    const body = res.json();
    expect(body.ok).toBe(true);
    expect(body.entorno).toBe('PRODUCCION');
    expect(body.evento.nombre).toBe('EL BÚNKER by Arte es la Solución');
  });
  it('accepts a form-urlencoded post too', () => {
    const res = env().prod.project.post('accion=config_publica', { contentType: 'application/x-www-form-urlencoded' });
    expect(res.json().ok).toBe(true);
  });
  it('rejects an unknown action and a protected action without token (403)', () => {
    const { prod } = env();
    expect(prod.project.post({ accion: 'nope' }).json().ok).toBe(false);
    const denied = prod.project.post({ accion: 'listar_registro' }).json();
    expect([denied.ok, denied.codigo_http, denied.motivo]).toEqual([false, 403, 'SIN_TOKEN']);
  });
  it('stores a registration posted the way the static site posts it', () => {
    const { prod } = env();
    const before = prod.project.records('REGISTRO').length;
    const r = prod.project.post({ accion: 'inscribir', ...F.uniqueSubmission(50) }).json();
    expect([r.ok, r.eligibility_status]).toEqual([true, 'APTO']);
    expect(prod.project.records('REGISTRO').length).toBe(before + 1);
  });
  it('every read action returns values google.script.run can deliver (no Dates reach the browser)', () => {
    const { prod } = env();
    const t = prod.tokens.admin;
    for (const accion of ['config_publica', 'agenda_publica', 'listar_registro', 'dashboard', 'resultados',
      'roster_checkin', 'listar_cambios', 'bloques_disponibles']) {
      const r = prod.project.clientCall('api', { accion, t });
      expect(r === null ? accion + ': null' : accion + ': ' + r.ok).toBe(accion + ': true');
    }
    expect(prod.project.warningsOf('client-null-return')).toEqual([]);
  });
});

// ===========================================================================
describe('Backup and restore (PRUEBAS project)', () => {
  const env = once(() => {
    const account = F.newAccount();
    const test = F.installTest(account, 'pruebas');
    F.registerAndIssueCodes(test.project, 5);
    const backup = test.project.run('accionRespaldar', {}, F.ADMIN_SESSION);
    return { account, test, backup };
  });

  it('writes an xlsx and a json into the project backup folder', () => {
    const { account, test, backup } = env();
    const folder = test.project.scriptProperty('CARPETA_BACKUPS');
    const files = account.drive.list((i) => i.parents.has(folder));
    const xlsx = files.find((f) => f.id === backup.xlsx.id);
    const json = files.find((f) => f.id === backup.json.id);
    expect(xlsx.mimeType).toBe(XLSX_MIME);
    expect(xlsx.name).toMatch(/^RESPALDO-MANUAL-\d{8}-\d{6}\.xlsx$/);
    expect(xlsx.size).toBe(backup.xlsx.bytes);
    expect(xlsx.text.slice(0, 2)).toBe('PK');
    expect(json.mimeType).toBe('application/json');
    expect(JSON.parse(json.text).datos.REGISTRO).toHaveLength(5);
  });
  it('exports with the project OAuth token and the project spreadsheet id', () => {
    const { account, test } = env();
    const call = account.fetchLog.find((c) => c.project === 'pruebas' && /\/export\?format=xlsx$/.test(c.url));
    expect(call.url).toContain(test.project.spreadsheetId);
    expect(call.headers.Authorization).toBe('Bearer ' + test.project.oauthToken);
  });
  it('restaurarDesdeJson brings back a REGISTRO row deleted by hand', () => {
    const { test, backup } = env();
    const ids = test.project.records('REGISTRO').map((r) => r.submission_id).sort();
    test.project.execute('delete a row', (g) => F.masterSheet(g, 'REGISTRO').deleteRow(3));
    expect(test.project.records('REGISTRO')).toHaveLength(ids.length - 1);
    test.project.run('restaurarDesdeJson', backup.json.id, 'SI-RESTAURAR');
    expect(test.project.records('REGISTRO').map((r) => r.submission_id).sort()).toEqual(ids);
  });
  it('the daily trigger handler (respaldoAutomatico) stores a DIARIO xlsx and json', () => {
    const { account, test } = env();
    account.advance(60 * 1000);
    test.project.fireTrigger('respaldoAutomatico');
    const folder = test.project.scriptProperty('CARPETA_BACKUPS');
    expect(account.drive.list((i) => i.parents.has(folder) && /^RESPALDO-DIARIO-.*\.xlsx$/.test(i.name))).toHaveLength(1);
    expect(account.drive.list((i) => i.parents.has(folder) && /^RESPALDO-DIARIO-.*\.json$/.test(i.name))).toHaveLength(1);
    account.setNow(F.DEFAULT_NOW);
  });
});

// ===========================================================================
describe('Schedule change (Form 2)', () => {
  const env = once(() => {
    const account = F.newAccount();
    const test = F.installTest(account, 'pruebas');
    const rows = F.registerAndIssueCodes(test.project, 25);
    const who = rows.find((r) => r.code === 'B-003');
    const request = test.project.run('accionSolicitarCambio', {
      participant_code: 'B-003', full_name: who.full_name, reason_short: 'Work shift',
      contact: '3001112233', acceptance: true, client_submission_id: 'change-1', form_elapsed_ms: 60000
    });
    const pendingRow = test.project.records('REGISTRO').find((r) => r.code === 'B-003');
    const approval = test.project.run('accionResolverCambio',
      { solicitud_id: request.solicitud_id, aprobar: true, nuevo_bloque: 4 }, F.ADMIN_SESSION);
    return { account, test, who, request, pendingRow, approval };
  });

  it('records the request as PENDIENTE without moving the participant', () => {
    const { request, pendingRow } = env();
    expect(request.estado).toBe('PENDIENTE');
    expect([pendingRow.change_status, pendingRow.change_requested, pendingRow.final_block]).toEqual(['PENDIENTE', true, 1]);
  });
  it('approves into a block with free seats and keeps the same code', () => {
    const { test, who, approval } = env();
    expect([approval.estado, approval.code, approval.nuevo_bloque, approval.nueva_hora]).toEqual(['APROBADO', 'B-003', 4, '16:30']);
    const row = test.project.records('REGISTRO').find((r) => r.submission_id === who.submission_id);
    expect([row.code, row.final_block, row.original_block, row.change_status]).toEqual(['B-003', 4, 1, 'APROBADO']);
    const change = test.project.records('_CAMBIOS')[0];
    expect([change.estado, change.nuevo_bloque, change.resuelto_by]).toEqual(['APROBADO', 4, F.ADMIN_SESSION.alias]);
  });
  it('refuses a second request for the same code', () => {
    const { test, who } = env();
    const again = test.project.run('accionSolicitarCambio', {
      participant_code: 'B-003', full_name: who.full_name, acceptance: true, client_submission_id: 'change-2', form_elapsed_ms: 60000 });
    expect([again.ok, again.motivo]).toEqual([false, 'YA_SOLICITO']);
  });
  it('refuses to approve into a full block and leaves the request pending', () => {
    const { test } = env();
    // Block 2 holds B-011..B-020: 10 of 10 seats taken.
    const other = test.project.records('REGISTRO').find((r) => r.code === 'B-021');
    const req = test.project.run('accionSolicitarCambio', {
      participant_code: 'B-021', full_name: other.full_name, acceptance: true, client_submission_id: 'change-3', form_elapsed_ms: 60000 });
    const res = test.project.run('accionResolverCambio', { solicitud_id: req.solicitud_id, aprobar: true, nuevo_bloque: 2 }, F.ADMIN_SESSION);
    expect(res.ok).toBe(false);
    expect(res.error).toMatch('ya está lleno');
    expect(test.project.records('_CAMBIOS').find((c) => c.solicitud_id === req.solicitud_id).estado).toBe('PENDIENTE');
  });
  it('refuses a request whose name does not match the code', () => {
    const r = env().test.project.run('accionSolicitarCambio', {
      participant_code: 'B-012', full_name: 'Somebody Else', acceptance: true, client_submission_id: 'change-4', form_elapsed_ms: 60000 });
    expect(r.motivo).toBe('NOMBRE_NO_COINCIDE');
  });
  it('refuses requests after cierre_cambios (2026-10-22 18:00 -05:00)', () => {
    const { account, test } = env();
    const other = test.project.records('REGISTRO').find((r) => r.code === 'B-013');
    account.setNow('2026-10-22T18:00:01-05:00');
    const late = test.project.run('accionSolicitarCambio', {
      participant_code: 'B-013', full_name: other.full_name, acceptance: true, client_submission_id: 'change-5', form_elapsed_ms: 60000 });
    account.setNow(F.DEFAULT_NOW);
    expect(late.motivo).toBe('FUERA_DE_PLAZO');
  });
});

// ===========================================================================
describe('Event day: check-in, jury and results through real tokens', () => {
  it('a performed audition scored by a juror reaches RESULTADOS', () => {
    const account = F.newAccount();
    const test = F.installTest(account, 'pruebas');
    F.registerAndIssueCodes(test.project, 3);
    const call = (payload) => test.project.clientCall('api', payload);
    expect(call({ accion: 'registrar_estado', t: test.tokens['checkin-1'], code: 'B-001', estado: 'CHECK-IN' }).hacia).toBe('CHECK-IN');
    expect(call({ accion: 'registrar_estado', t: test.tokens['checkin-1'], code: 'B-001', estado: 'REALIZADA' }).hacia).toBe('REALIZADA');
    // (score / 10) * weight: 16 + 18 + 10.5 + 8 + 9 + 8 + 3 + 7 = 79.5
    const scores = { talento: 8, performance: 9, identidad: 7, repertorio: 8, profesionalismo: 9, presencia: 8, digital: 6, proyecto: 7 };
    const saved = call(Object.assign({ accion: 'guardar_evaluacion', t: test.tokens['jurado-1'], code: 'B-001' }, scores));
    expect([saved.ok, saved.hoja, saved.total]).toEqual([true, 'JURADO_1', 79.5]);
    const perfect = { talento: 10, performance: 10, identidad: 10, repertorio: 10, profesionalismo: 10, presencia: 10, digital: 10, proyecto: 10 };
    expect(call(Object.assign({ accion: 'guardar_evaluacion', t: test.tokens['jurado-2'], code: 'B-001' }, perfect)).hoja).toBe('JURADO_2');
    const denied = call({ accion: 'guardar_evaluacion', t: test.tokens['checkin-1'], code: 'B-001' });
    expect(denied.codigo_http).toBe(403);
    test.project.run('refrescarVistas');
    const row = test.project.records('RESULTADOS').find((r) => r.code === 'B-001');
    expect([row.posicion, row.jurado_1, row.jurado_2, row.jurados_validos, row.artist_final]).toEqual([1, 79.5, 100, 2, 89.75]);
  });
});

// ===========================================================================
describe('Regression: CONFIG values typed into the sheet stay as typed', () => {
  const env = once(() => {
    const account = F.newAccount();
    const project = account.createProject('prod');
    project.run('setupInicial');
    return { account, project };
  });

  it("CONFIG evento_hora_inicio = '15:00' moves the first block to 15:00 (agendaConfigurada().inicio_minutos === 900)", () => {
    const { project } = env();
    const stored = F.setConfig(project, 'evento_hora_inicio', '15:00');
    // The CONFIG value column is plain text: the hour is never turned into a 1899-12-30 time.
    expect(Object.prototype.toString.call(stored)).toBe('[object String]');
    expect('inicio_minutos=' + project.run('agendaConfigurada').inicio_minutos).toBe('inicio_minutos=900');
  });
  it('config_publica returns the event date and start hour as typed (2026-10-02 / 16:00)', () => {
    const { project } = env();
    F.setConfig(project, 'evento_fecha', '2026-10-02');
    F.setConfig(project, 'evento_hora_inicio', '16:00');
    const evento = project.post({ accion: 'config_publica' }).json().evento;
    expect([evento.fecha, evento.hora_inicio]).toEqual(['2026-10-02', '16:00']);
  });
});

// ===========================================================================
describe('Regression: duplicate detection at submission time', () => {
  const env = once(() => {
    const account = F.newAccount();
    const project = account.createProject('prod');
    project.run('setupInicial');
    project.run('accionInscribir', F.validSubmission({ client_submission_id: 'first' }));
    return { account, project };
  });

  it('a second submission with the same document number is labelled DUPLICADO', () => {
    // normalized_id_number used to read back as a Number and was compared to a String with ===.
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
describe('Regression: schedule times shown to people never read "1899-12-30T..."', () => {
  const env = once(() => {
    const account = F.newAccount();
    const test = F.installTest(account, 'pruebas');
    const rows = F.registerAndIssueCodes(test.project, 12);
    return { account, test, rows };
  });

  it('the participant status lookup returns arrival and audition times as clock text', () => {
    const { test, rows } = env();
    const who = rows.find((r) => r.code === 'B-001');
    const st = test.project.run('accionConsultarEstado', { code: 'B-001', id_number: String(who.id_number) });
    expect([st.hora_llegada, st.hora_audicion]).toEqual(['2:45 p. m.', '3:00 p. m.']);
  });
  it('the ASIGNACION message tells the participant clock times', () => {
    const { test } = env();
    const m = test.project.run('accionMensajes', { plantilla: 'ASIGNACION', code: 'B-001' }, F.ADMIN_SESSION).mensajes[0];
    expect(m.cuerpo).toContain('2:45 p. m.');
    expect(m.cuerpo).toContain('3:00 p. m.');
    expect(m.cuerpo.indexOf('1899')).toBe(-1);
  });
  it('the check-in desk can evaluate punctuality (5-minute rule) for a participant with a code', () => {
    const r = env().test.project.run('accionBuscarParticipante', { code: 'B-001', hora_llegada: '15:07' });
    expect(r.puntualidad && r.puntualidad.recomendacion).toBe('CONTINGENCIA');
  });
});

// ===========================================================================
describe('Regression: destructive helpers are guarded inside themselves (audit C11)', () => {
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
describe('Regression: participant free text is not re-interpreted by Sheets', () => {
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
  it('a WhatsApp number typed as "+57 311 000 0002" survives and still gets a WhatsApp link (verified on a live sheet 2026-09-24)', () => {
    const { test } = env();
    const row = test.project.records('REGISTRO').find((r) => r.email === 'participant0002@example.com');
    expect(row.whatsapp).toBe('+57 311 000 0002');
    const m = test.project.run('accionMensajes', { plantilla: 'ASIGNACION', code: row.code }, F.ADMIN_SESSION).mensajes[0];
    expect(m.whatsapp_url).toMatch(/^https:\/\/wa\.me\/573110000002/);
  });
  it('a formula typed into a plain-text column is stored as text (plain text alone does not stop formulas)', () => {
    const { test } = env();
    test.project.run('accionInscribir', F.uniqueSubmission(4, { id_number: '=IMPORTXML("https://evil.test")', form_elapsed_ms: 90000 }));
    const row = test.project.records('REGISTRO').find((r) => r.email === 'participant0004@example.com');
    expect(row.id_number).toBe('=IMPORTXML("https://evil.test")');
    expect(test.project.warningsOf('formula-from-string').filter((w) => w.detail && w.detail.sheet === 'REGISTRO')).toEqual([]);
  });
  it('a description starting with "- " survives in REGISTRO (verified on a live sheet 2026-09-24)', () => {
    const row = env().test.project.records('REGISTRO').find((r) => r.email === 'participant0003@example.com');
    expect(row.audition_description).toBe('- Sings a cappella and dances');
  });
});

// ===========================================================================
describe('Regression: service calls do not grow with the number of rows', () => {
  it('one submission does not open the spreadsheet once per existing row', () => {
    const account = F.newAccount();
    const test = F.installTest(account, 'pruebas').project;
    test.run('accionInscribir', F.uniqueSubmission(1));
    const withOne = test.lastExecution.calls['SpreadsheetApp.openById'];
    for (let i = 2; i <= 100; i++) test.run('accionInscribir', F.uniqueSubmission(i));
    const withHundred = test.lastExecution.calls['SpreadsheetApp.openById'];
    // zonaHoraria() used to call getProperty + openById for EVERY Date cell leerHoja read.
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
describe('Regression: a trashed backup folder does not receive backups', () => {
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
