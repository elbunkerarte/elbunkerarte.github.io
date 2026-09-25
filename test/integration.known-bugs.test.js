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

  it('a WhatsApp number typed as "+57 311 000 0002" survives and still gets a WhatsApp link [confidence ~70%: verify on a live sheet]', () => {
    const { test } = env();
    const row = test.project.records('REGISTRO').find((r) => r.email === 'participant0002@example.com');
    expect(row.whatsapp).toBe('+57 311 000 0002');
    const m = test.project.run('accionMensajes', { plantilla: 'ASIGNACION', code: row.code }, F.ADMIN_SESSION).mensajes[0];
    expect(m.whatsapp_url).toMatch(/^https:\/\/wa\.me\/573110000002/);
  });
});

process.exit(ejecutar());
