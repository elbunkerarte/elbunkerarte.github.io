/**
 * Iteration-2 scenarios on the Apps Script emulator: groups and members,
 * backing tracks, video links, migration from the iteration-1 base, removal of
 * pre-launch test rows, access-link revocation, every page rendering with
 * parseable client scripts, and nothing dummy on public pages.
 *
 * Everything runs the real server code through the same entry points the web
 * app uses (run / doGet / doPost / google.script.run).
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');
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

const HUMAN = { form_elapsed_ms: 90000 };

/** A group or duo registration led by the i-th unique participant. */
function groupSubmission(i, mode, name, declared, extra) {
  return F.uniqueSubmission(i, Object.assign({
    participation_mode: mode, artistic_name: name, members_declared: declared
  }, HUMAN, extra || {}));
}

/** A member's own authorization for a group. */
function memberSubmission(groupCode, key, i, extra) {
  return Object.assign({
    group_code: groupCode, group_key: key, client_submission_id: 'member-' + groupCode + '-' + i,
    full_name: 'Member Number ' + i, id_number: String(40000000 + i), birth_date: '2000-01-15',
    artistic_role: 'Guitarra', adult_confirmation: true, accept_terms: true, accept_data_processing: true,
    accept_image_voice: true, source: 'web'
  }, HUMAN, extra || {});
}

/** Visible text of an HTML page: no <script>, no <style>, no tags. */
function visibleText(html) {
  return String(html).replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
}

function inlineScripts(html) {
  const out = [];
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) out.push(m[1]);
  return out;
}

// ===========================================================================
describe('Groups: seats, keys, repeated names and the leader row', () => {
  const env = once(() => {
    const account = F.newAccount();
    const test = F.installTest(account, 'pruebas');
    const duo = test.project.run('accionInscribir', groupSubmission(1, 'DUO', 'Dúo Sol y Luna', 2));
    const band = test.project.run('accionInscribir', groupSubmission(2, 'AGRUPACION', 'Los Del Barrio', 4));
    const repeated = test.project.run('accionInscribir', groupSubmission(3, 'AGRUPACION', '  LOS DEL  BARRIO ', 3));
    const other = test.project.run('accionInscribir', groupSubmission(4, 'AGRUPACION', 'Los del barrio!', 3));
    return { account, test, duo, band, repeated, other };
  });

  it('a duo and a group each get their own GRP code and a 6-character key', () => {
    const { duo, band } = env();
    expect([duo.eligibility_status, duo.group_code, band.eligibility_status, band.group_code])
      .toEqual(['APTO', 'GRP-001', 'APTO', 'GRP-002']);
    expect(duo.group_key).toMatch(/^[A-Z0-9]{6}$/);
    expect(duo.members_link).toContain('g=GRP-001');
    expect(duo.members_link).toContain('k=' + duo.group_key);
  });
  it('the leader is stored as member #1 of the group with their own acceptance', () => {
    const members = env().test.project.records('_INTEGRANTES').filter((m) => m.group_code === 'GRP-002');
    expect(members).toHaveLength(1);
    expect([members[0].is_leader, members[0].member_status, members[0].consent_terms]).toEqual([true, 'AUTORIZADO', true]);
  });
  it('a group whose name only differs in case, spaces or punctuation is flagged, never merged', () => {
    const { repeated, test } = env();
    expect([repeated.group_repeated, repeated.eligibility_status]).toEqual([true, 'REVISION']);
    const row = test.project.records('REGISTRO').find((r) => r.submission_id === repeated.submission_id);
    expect([row.group_code, row.group_match_status, row.group_display_name]).toEqual(['GRP-003', 'POSIBLE_REPETIDA', 'LOS DEL BARRIO']);
  });
  it('the operator decides: MISMO leaves one seat, DISTINTO keeps both', () => {
    const { test, repeated, other } = env();
    const same = test.project.run('accionResolverCoincidenciaGrupo',
      { submission_id: repeated.submission_id, decision: 'MISMO', motivo: 'Same leader phone' }, F.ADMIN_SESSION);
    const diff = test.project.run('accionResolverCoincidenciaGrupo',
      { submission_id: other.submission_id, decision: 'DISTINTO', motivo: 'Different city band' }, F.ADMIN_SESSION);
    expect([same.eligibility_status, diff.eligibility_status]).toEqual(['DUPLICADO', 'APTO']);
    const rows = test.project.records('REGISTRO');
    expect(rows.find((r) => r.submission_id === repeated.submission_id).group_match_status).toBe('CONFIRMADA_MISMA');
    expect(rows.find((r) => r.submission_id === other.submission_id).group_match_status).toBe('CONFIRMADA_DISTINTA');
  });
  it('re-validation keeps the operator decision', () => {
    const { test, repeated, other } = env();
    test.project.run('accionRevalidarTodo', {}, F.ADMIN_SESSION);
    const rows = test.project.records('REGISTRO');
    expect([rows.find((r) => r.submission_id === repeated.submission_id).eligibility_status,
            rows.find((r) => r.submission_id === other.submission_id).eligibility_status]).toEqual(['DUPLICADO', 'APTO']);
  });
  it('a group takes exactly one code however many members it has', () => {
    const { test } = env();
    test.project.run('accionAsignarCodigos', {}, F.ADMIN_SESSION);
    const coded = test.project.records('REGISTRO').filter((r) => r.code);
    expect(coded.map((r) => r.group_code).sort()).toEqual(['GRP-001', 'GRP-002', 'GRP-004']);
  });
});

// ===========================================================================
describe('Group members: individual authorization with a drawn signature', () => {
  const env = once(() => {
    const account = F.newAccount();
    const test = F.installTest(account, 'pruebas');
    const band = test.project.run('accionInscribir', groupSubmission(1, 'AGRUPACION', 'La Banda', 4));
    const png = test.project.execute('png', (g) => g.TEST_SIGNATURE_PNG);
    return { account, test, band, png };
  });

  it('a wrong key is refused and reveals nothing', () => {
    const { test } = env();
    const r = test.project.run('accionConsultarAgrupacion', { group_code: 'GRP-001', group_key: 'ZZZZZZ' });
    expect([r.ok, r.motivo, r.group_display_name]).toEqual([false, 'CLAVE', undefined]);
  });
  it('the right key shows the group name and the counts only', () => {
    const { test, band } = env();
    const r = test.project.run('accionConsultarAgrupacion', { group_code: 'GRP-001', group_key: band.group_key });
    expect([r.group_display_name, r.members_declared, r.members_registered, r.members_authorized]).toEqual(['La Banda', 4, 1, 1]);
    expect(JSON.stringify(r).indexOf('1036')).toBe(-1);
  });
  it('an adult member with a signature is AUTORIZADO; the PNG is stored with its SHA-256', () => {
    const { account, test, band, png } = env();
    const r = test.project.run('accionRegistrarIntegrante', memberSubmission('GRP-001', band.group_key, 1, { signature_png: png }));
    expect([r.member_status, r.actualizado, r.group.authorized]).toEqual(['AUTORIZADO', false, 2]);
    const row = test.project.records('_INTEGRANTES').find((m) => m.member_id === r.member_id);
    expect(row.signature_sha256).toMatch(/^[0-9a-f]{64}$/);
    const file = account.drive.get(row.signature_file_id);
    expect(file.mimeType).toBe('image/png');
    const folder = account.drive.get(Array.from(file.parents)[0]);
    expect(folder.name).toBe('GRP-001');
  });
  it('a member without a signature is not authorized while signatures are required', () => {
    const { test, band } = env();
    const r = test.project.run('accionRegistrarIntegrante', memberSubmission('GRP-001', band.group_key, 2));
    expect(r.member_status === 'AUTORIZADO').toBe(false);
  });
  it('a minor is refused (only adults take part)', () => {
    const { test, band, png } = env();
    const r = test.project.run('accionRegistrarIntegrante',
      memberSubmission('GRP-001', band.group_key, 3, { birth_date: '2010-03-01', signature_png: png }));
    expect(r.member_status).toBe('NO CUMPLE');
  });
  it('the same person sending again updates their row instead of adding one', () => {
    const { test, band, png } = env();
    const before = test.project.records('_INTEGRANTES').length;
    const r = test.project.run('accionRegistrarIntegrante',
      memberSubmission('GRP-001', band.group_key, 1, { client_submission_id: 'member-again', artistic_role: 'Voz', signature_png: png }));
    expect([r.actualizado, test.project.records('_INTEGRANTES').length]).toEqual([true, before]);
  });
  it('the printable record lists every member with a blank line for whoever is missing', () => {
    const { test } = env();
    const d = test.project.run('constanciaData', 'GRP-001');
    expect(d.members.length + d.blank_lines).toBe(4);
    expect(d.terms_version).toBe('v1-2026-09-24');
  });
});

// ===========================================================================
describe('Backing tracks: upload, validation and replacement', () => {
  const env = once(() => {
    const account = F.newAccount();
    const test = F.installTest(account, 'pruebas');
    test.project.run('accionInscribir', F.uniqueSubmission(1, Object.assign({ artistic_name: 'Maca Ríos', song_name: 'Mi Canción' }, HUMAN)));
    test.project.run('accionAsignarCodigos', {}, F.ADMIN_SESSION);
    const row = test.project.records('REGISTRO')[0];
    const mp3 = test.project.execute('mp3', (g) => g.buildTestTrackBase64());
    const upload = (extra) => test.project.run('accionSubirPista', Object.assign({
      id_number: String(row.id_number), code: row.code, file_name: 'pista final.mp3', file_base64: mp3,
      song_name: 'Mi Canción', client_submission_id: 'track-' + Math.random().toString(36).slice(2), source: 'web'
    }, HUMAN, extra || {}));
    return { account, test, row, mp3, upload };
  });

  it('stores the file as B-XXX_ARTISTA_CANCION.mp3 and marks it RECIBIDA', () => {
    const { test, upload } = env();
    const r = upload();
    expect([r.track_status, r.track_file_name]).toEqual(['PISTA RECIBIDA', 'B-001_MACA_RIOS_MI_CANCION.mp3']);
    expect(test.project.records('REGISTRO')[0].track_status).toBe('PISTA RECIBIDA');
  });
  it('a second upload keeps the first file, renamed _REEMPLAZADA_', () => {
    const { account, upload } = env();
    account.advance(60 * 1000);
    upload();
    const names = account.drive.list((i) => /^B-001_/.test(i.name)).map((i) => i.name).sort();
    expect(names).toHaveLength(2);
    expect(names.filter((n) => /_REEMPLAZADA_\d{8}-\d{6}\.mp3$/.test(n))).toHaveLength(1);
  });
  it('a file whose bytes are not audio is refused even with an .mp3 name', () => {
    const { test, upload } = env();
    const fake = test.project.execute('b64', (g) => g.Utilities.base64Encode('this is not audio at all, just text'));
    const r = upload({ file_base64: fake });
    expect(r.ok).toBe(false);
  });
  it('the wrong ID number can not upload to someone else\'s code', () => {
    const r = env().upload({ id_number: '99999999' });
    expect(r.ok).toBe(false);
  });
});

// ===========================================================================
describe('Video links: accessible, private, not verifiable', () => {
  const env = once(() => {
    const account = F.newAccount();
    const test = F.installTest(account, 'pruebas');
    // Predicates receive the request URL as a string.
    account.stubUrl((url) => /youtube\.com\/oembed/.test(url) && /v%3DOKOKOK/.test(url), { code: 200, body: { title: 'ok' } });
    account.stubUrl((url) => /youtube\.com\/oembed/.test(url) && /v%3DGONEGONE/.test(url), { code: 404, body: 'Not Found' });
    account.stubUrl((url) => /drive\.google\.com\/file\/d\/PRIVATEFILE123/.test(url),
      { code: 302, body: '', headers: { Location: 'https://accounts.google.com/ServiceLogin?continue=x' } });
    account.stubUrl((url) => /drive\.google\.com\/file\/d\/PUBLICFILE1234/.test(url),
      { code: 200, body: '<html><meta property="og:title" content="video.mp4"></html>' });
    const check = (url) => test.project.run('accionVerificarVideo', { video_url: url });
    return { check: (url) => check(url).status, detail: (url) => check(url).detail };
  });

  it('a public YouTube video is ACCESIBLE', () => {
    expect(env().check('https://www.youtube.com/watch?v=OKOKOK')).toBe('ACCESIBLE');
  });
  it('a removed YouTube video is NO ACCESIBLE', () => {
    expect(env().check('https://youtu.be/GONEGONE')).toBe('NO ACCESIBLE');
    expect(env().detail('https://youtu.be/GONEGONE')).toContain('no existe');
  });
  it('a Drive file that redirects to the login page is NO ACCESIBLE and says why', () => {
    const { check, detail } = env();
    expect(check('https://drive.google.com/file/d/PRIVATEFILE123/view?usp=sharing')).toBe('NO ACCESIBLE');
    expect(detail('https://drive.google.com/file/d/PRIVATEFILE123/view?usp=sharing')).toContain('iniciar sesion');
  });
  it('a Drive file shared with anyone who has the link is ACCESIBLE', () => {
    expect(env().check('https://drive.google.com/file/d/PUBLICFILE1234/view')).toBe('ACCESIBLE');
  });
  it('Instagram and TikTok are NO VERIFICABLE (left to a person)', () => {
    const { check } = env();
    expect([check('https://www.instagram.com/p/abc/'), check('https://www.tiktok.com/@x/video/1')]).toEqual(['NO VERIFICABLE', 'NO VERIFICABLE']);
  });
});

// ===========================================================================
describe('Migration of a live iteration-1 base (the production path)', () => {
  const ITERATION_1 = '2a6f706';
  const env = once(() => {
    // The iteration-1 code exactly as production runs it today.
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bunker-iter1-'));
    execSync('git archive ' + ITERATION_1 + ' apps-script | tar -x -C ' + JSON.stringify(dir), { cwd: path.join(__dirname, '..') });
    const account = F.newAccount();
    const old = account.createProject('prod-v1', { sourceDir: path.join(dir, 'apps-script') });
    const install = old.run('INSTALAR');
    const oldTokens = F.tokensByAlias(install.accesos);
    const legacy = {
      full_name: 'Prueba Uno', id_number: '1001001001', birth_date: '2001-02-03', neighborhood_sector: 'Centro',
      resides_in_sabaneta: true, email: 'prueba.uno@gmail.com', whatsapp: '3001001001', artistic_name: 'P1',
      discipline: 'Canto', genre_or_proposal: 'Pop', artist_description: 'x', audition_description: 'x',
      availability_statement: true, accept_terms: true, accept_data_processing: true, source: 'web'
    };
    const a = old.run('accionInscribir', Object.assign({ client_submission_id: 'legacy-1' }, legacy));
    const b = old.run('accionInscribir', Object.assign({}, legacy, { client_submission_id: 'legacy-2', full_name: 'Prueba Dos',
      id_number: '1002002002', email: 'prueba.dos@gmaik.com', whatsapp: '3002002002', artistic_name: 'P2' }));
    const before = old.spreadsheet().records('REGISTRO').map((r) => Object.assign({}, r));

    // Same Apps Script project, new code: same Script Properties, same spreadsheet.
    const next = account.createProject('prod-v2');
    for (const [k, v] of old.scriptProperties) next.scriptProperties.set(k, v);
    const migration = next.run('MIGRAR');
    return { account, old, next, oldTokens, a, b, before, migration };
  });

  it('keeps every row and every original value', () => {
    const { next, before, migration } = env();
    expect(migration.datos_intactos).toBe(true);
    const after = next.records('REGISTRO');
    expect(after).toHaveLength(2);
    for (const row of before) {
      const now = after.find((r) => r.submission_id === row.submission_id);
      for (const k of ['full_name', 'email', 'whatsapp', 'artistic_name', 'eligibility_status', 'created_at']) {
        expect(k + '=' + String(now[k])).toBe(k + '=' + String(row[k]));
      }
    }
  });
  it('appends the new columns at the end and creates the new sheets', () => {
    const { next, migration } = env();
    const header = next.spreadsheet().values('REGISTRO')[0];
    const v1 = env().before.length ? Object.keys(env().before[0]).length : 0;
    expect(header.indexOf('participation_mode')).toBeGreaterThan(40);
    for (const sheet of ['AGRUPACIONES', 'PISTAS', '_INTEGRANTES', '_DELIBERACIONES']) expect(next.spreadsheet().findSheet(sheet) ? sheet : null).toBe(sheet);
    expect(migration.esquema.hojas_creadas.length).toBeGreaterThan(0);
    expect(v1).toBeGreaterThan(0);
  });
  it('replaces the iteration-1 defaults in CONFIG with the confirmed event data', () => {
    const { next } = env();
    const cfg = {};
    next.records('CONFIG').forEach((r) => { cfg[r.clave] = r.valor; });
    expect([cfg.evento_fecha, cfg.evento_hora_inicio, cfg.edad_maxima, cfg.top_seleccionados, cfg.cierre_audiciones])
      .toEqual(['2026-10-23', '15:00', '30', '7', '21:00']);
    expect([cfg.legal_name, cfg.nit, cfg.datos_legales_verificados, cfg.terms_version])
      .toEqual(['Corporación Socio cultural El Arte es la Solución', '901292696', 'SI', 'v1-2026-09-24']);
    expect(Object.keys(cfg).filter((k) => /^PENDIENTE/.test(String(cfg[k])))).toEqual([]);
  });
  it('takes a raw backup before touching anything and marks the base as production', () => {
    const { account, next, migration } = env();
    expect(migration.respaldo_previo.json).toMatch(/^RESPALDO-PRE-MIGRACION|^RESPALDO-/);
    expect(account.drive.list((i) => i.name === migration.respaldo_previo.json)).toHaveLength(1);
    expect(next.run('spreadsheetEnvironment')).toBe('production');
  });
  it('existing access links keep working after the migration', () => {
    const { next, oldTokens } = env();
    const r = next.clientCall('api', { accion: 'dashboard', t: oldTokens.admin });
    expect(r.ok === false ? r.error : 'ok').toBe('ok');
  });
  it('QUITAR removes exactly the listed test rows after a backup, and a second run changes nothing', () => {
    const { account, next, a, b } = env();
    expect(() => next.run('quitarInscripciones', [a.submission_id], 'yes')).toThrow('BLOQUEADO');
    const r = next.run('quitarInscripciones', [a.submission_id, b.submission_id, 'S-NOPE'], 'SI-QUITAR');
    expect(r.quitadas.sort()).toEqual([a.submission_id, b.submission_id].sort());
    expect(next.records('REGISTRO')).toHaveLength(0);
    expect(account.drive.list((i) => i.name === r.respaldo.json)).toHaveLength(1);
    const again = next.run('quitarInscripciones', [a.submission_id], 'SI-QUITAR');
    expect(again.quitadas).toEqual([]);
    expect(next.records('_LOG').filter((l) => l.accion === 'QUITAR_INSCRIPCIONES')).toHaveLength(1);
  });
  it('after the migration production refuses test data and accepts a real iteration-2 registration', () => {
    const { next } = env();
    const test = next.run('accionInscribir', F.uniqueSubmission(90, Object.assign({ email: 'someone@bunker.test' }, HUMAN)));
    expect([test.ok, test.motivo]).toEqual([false, 'DATO_DE_PRUEBA']);
    const real = next.run('accionInscribir', F.uniqueSubmission(91, HUMAN));
    expect(real.eligibility_status).toBe('APTO');
  });
});

// ===========================================================================
describe('Access links', () => {
  const env = once(() => {
    const account = F.newAccount();
    const prod = F.installProduction(account, 'prod');
    return { account, prod };
  });

  it('issuing a new link for an alias revokes the previous one', () => {
    const { prod } = env();
    const oldToken = prod.tokens['checkin-2'];
    const fresh = F.tokenFromUrl(prod.project.run('provisionarUsuario', 'checkin-2', 'checkin', 'Mesa 2').url);
    expect(prod.project.run('verificarToken', oldToken).motivo).toBe('TOKEN_REEMPLAZADO');
    expect(prod.project.run('verificarToken', fresh).ok).toBe(true);
    expect(prod.project.get({ p: 'checkin', t: oldToken }).body).toContain('TOKEN_REEMPLAZADO');
  });
  it('links are built from CONFIG web_app_url (the editor only knows the owner-only /dev URL)', () => {
    const { prod } = env();
    const exec = 'https://script.google.com/macros/s/AKfycbTESTdeployment123/exec';
    F.setConfig(prod.project, 'web_app_url', exec);
    const link = prod.project.run('provisionarUsuario', 'checkin-9', 'checkin', 'Mesa 9').url;
    expect(link.indexOf(exec + '?p=checkin&t=')).toBe(0);
    expect(prod.project.run('systemHealth').web_app_url_ok).toBe(true);
    expect(prod.project.run('membersLink', 'GRP-001').indexOf(exec + '?p=integrantes&g=GRP-001&k=')).toBe(0);
  });
  it('running INSTALAR again does not re-issue anyone\'s link', () => {
    const { prod } = env();
    const before = prod.project.records('_USUARIOS').map((u) => u.token);
    prod.project.run('INSTALAR');
    expect(prod.project.records('_USUARIOS').map((u) => u.token)).toEqual(before);
    expect(prod.project.run('verificarToken', prod.tokens.admin).ok).toBe(true);
  });
});

// ===========================================================================
describe('Every page renders, its scripts parse, and public pages show nothing dummy', () => {
  const env = once(() => {
    const account = F.newAccount();
    const test = F.installTest(account, 'pruebas');
    const band = test.project.run('accionInscribir', groupSubmission(1, 'AGRUPACION', 'La Banda', 3));
    test.project.run('accionAsignarCodigos', {}, F.ADMIN_SESSION);
    const t = test.tokens;
    const pages = {
      inscripcion: { p: 'inscripcion' }, 'cambio-horario': { p: 'cambio-horario', code: 'B-001' }, gracias: { p: 'gracias' },
      integrantes: { p: 'integrantes', g: 'GRP-001', k: band.group_key }, 'mi-inscripcion': { p: 'mi-inscripcion' },
      admin: { p: 'admin', t: t.admin }, logistica: { p: 'admin', t: t.coordinacion }, checkin: { p: 'checkin', t: t['checkin-1'] },
      jurado: { p: 'jurado', t: t['jurado-1'] }, dashboard: { p: 'dashboard', t: t.direccion },
      'dashboard-admin': { p: 'dashboard', t: t.admin }, constancia: { p: 'constancia', g: 'GRP-001', t: t.admin },
      '403': { p: 'admin' }
    };
    const rendered = {};
    for (const [name, q] of Object.entries(pages)) rendered[name] = test.project.get(q);
    return { account, test, rendered };
  });

  it('renders all 13 page/role combinations without an error page', () => {
    const { rendered } = env();
    const broken = Object.entries(rendered).filter(([name, r]) => name !== '403' && /No tienes acceso a esta secci/.test(r.body))
      .map(([name]) => name);
    expect(broken).toEqual([]);
    expect(rendered['403'].body).toContain('SIN_TOKEN');
  });
  it('every inline script of every page parses as JavaScript', () => {
    const { rendered } = env();
    const failures = [];
    for (const [name, r] of Object.entries(rendered)) {
      inlineScripts(r.body).forEach((code, i) => {
        try { new Function(code); } catch (e) { failures.push(name + '#' + i + ': ' + e.message); }
      });
    }
    expect(failures).toEqual([]);
  });
  it('no template printed undefined or left a scriptlet unevaluated', () => {
    const { test } = env();
    expect(test.project.warningsOf('template-printed-undefined').map((w) => w.message)).toEqual([]);
    expect(test.project.warningsOf('unevaluated-scriptlet').map((w) => w.message)).toEqual([]);
  });
  it('public pages carry no placeholder text', () => {
    const { rendered } = env();
    const hits = [];
    for (const name of ['inscripcion', 'cambio-horario', 'gracias', 'integrantes', 'mi-inscripcion', '403']) {
      const text = visibleText(rendered[name].body);
      for (const bad of ['PENDIENTE', 'pendiente)', 'undefined', 'null', 'NaN', 'lorem']) {
        if (text.indexOf(bad) !== -1) hits.push(name + ': ' + bad);
      }
    }
    expect(hits).toEqual([]);
  });
  it('the registration page states the confirmed event facts', () => {
    const text = visibleText(env().rendered.inscripcion.body).replace(/\s+/g, ' ');
    for (const fact of ['viernes 23 de octubre de 2026', '3:00 p. m.', 'Centro Comercial Mayorca', '18', '30', '901292696']) {
      expect(text).toContain(fact);
    }
  });
});

// ===========================================================================
describe('Messages: the WhatsApp group invite only exists once there is a link', () => {
  const env = once(() => {
    const account = F.newAccount();
    const test = F.installTest(account, 'pruebas');
    F.registerAndIssueCodes(test.project, 2);
    return { account, test };
  });

  it('without a link the template is neither offered nor usable', () => {
    const { test } = env();
    expect(test.project.run('plantillasDisponibles').map((t) => t.id).indexOf('GRUPO_WHATSAPP')).toBe(-1);
    expect(test.project.run('accionMensajes', { plantilla: 'GRUPO_WHATSAPP' }, F.ADMIN_SESSION).ok).toBe(false);
    const admin = test.project.get({ p: 'admin', t: test.tokens.admin }).body;
    expect(admin.indexOf('GRUPO_WHATSAPP')).toBe(-1);
  });
  it('with an https link it is offered and the message carries the link', () => {
    const { test } = env();
    F.setConfig(test.project, 'whatsapp_grupo_enlace', 'https://chat.whatsapp.com/AbCdEf123');
    expect(test.project.run('plantillasDisponibles').map((t) => t.id)).toContain('GRUPO_WHATSAPP');
    const r = test.project.run('accionMensajes', { plantilla: 'GRUPO_WHATSAPP' }, F.ADMIN_SESSION);
    expect(r.total).toBe(2);
    expect(r.mensajes[0].cuerpo).toContain('https://chat.whatsapp.com/AbCdEf123');
  });
  it('no message of any template shows a raw placeholder or a 1899 date', () => {
    const { test } = env();
    const bad = [];
    for (const t of test.project.run('plantillasDisponibles')) {
      const r = test.project.run('accionMensajes', { plantilla: t.id }, F.ADMIN_SESSION);
      (r.mensajes || []).forEach((m) => { if (/\{\{|1899|undefined|PENDIENTE/.test(m.cuerpo + m.asunto)) bad.push(t.id); });
    }
    expect(bad).toEqual([]);
  });
});

// ===========================================================================
describe('Selection size', () => {
  it('seven projects are selected (confirmed by the organization)', () => {
    const account = F.newAccount();
    const test = F.installTest(account, 'pruebas');
    expect(test.project.post({ accion: 'config_publica' }).json().evento.top).toBe(7);
    expect(test.project.clientCall('api', { accion: 'dashboard', t: test.tokens.direccion }).metricas.top_n).toBe(7);
  });
});

process.exit(ejecutar());
