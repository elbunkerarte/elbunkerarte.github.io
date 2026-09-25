'use strict';
/**
 * Scenario helpers shared by the integration suites. Everything goes through
 * the real server code: projects are installed with INSTALAR / INSTALAR_PRUEBAS,
 * tokens come from crearAccesosOperativos, submissions go through accionInscribir.
 */
const { createAccount } = require('./index');

const DEFAULT_NOW = '2026-09-20T10:00:00-05:00';
const ADMIN_SESSION = { ok: true, rol: 'admin', alias: 'integration-test' };

/**
 * A solo submission that is APTO under the default CONFIG (event 2026-10-23,
 * ages 18-30). It carries every iteration-2 required field plus a realistic
 * form_elapsed_ms so the anti-abuse guard treats it as a person.
 */
function validSubmission(overrides) {
  return Object.assign({
    client_submission_id: 'client-0001',
    full_name: 'Maria Camila Restrepo',
    id_number: '1036448960',
    birth_date: '2002-05-14',
    adult_confirmation: true,
    neighborhood_sector: 'Aliadas del Sur',
    resides_in_sabaneta: true,
    email: 'maria.restrepo@example.com',
    whatsapp: '3012345678',
    participation_mode: 'SOLISTA',
    artistic_name: 'MACA',
    genre_primary: 'R&B',
    audition_description: 'A cappella original song.',
    presentation_format: 'VOZ_PISTA',
    own_equipment: 'NO',
    track_uses: 'SI',
    track_method: 'ARCHIVO',
    song_name: 'Original song',
    video_url: 'https://www.youtube.com/watch?v=abc123',
    technical_needs: 'Microphone',
    availability_statement: true,
    accept_terms: true,
    accept_data_processing: true,
    accept_whatsapp_operational: true,
    accept_image_voice: true,
    form_elapsed_ms: 120000,
    source: 'web'
  }, overrides || {});
}

/** The i-th distinct valid submission (distinct document, email, phone, name and client id). */
function uniqueSubmission(i, overrides) {
  const n = String(i).padStart(4, '0');
  return validSubmission(Object.assign({
    client_submission_id: 'client-' + n,
    full_name: 'Participant Number ' + n,
    id_number: String(20000000 + i),
    email: 'participant' + n + '@example.com',
    whatsapp: '31' + String(10000000 + i),
    artistic_name: 'ARTIST-' + n
  }, overrides || {}));
}

function newAccount(now, options) {
  const account = createAccount(options);
  account.setNow(now || DEFAULT_NOW);
  return account;
}

function tokenFromUrl(url) {
  const m = String(url).match(/[?&]t=([^&]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

/** alias -> token, from the list returned by INSTALAR / crearAccesosOperativos. */
function tokensByAlias(accesses) {
  const out = {};
  for (const a of accesses) out[a.alias] = tokenFromUrl(a.url);
  return out;
}

/** Installs a production project (INSTALAR) and returns { project, tokens, install }. */
function installProduction(account, name) {
  const project = account.createProject(name || 'prod');
  const install = project.run('INSTALAR');
  return { project, install, tokens: tokensByAlias(install.accesos) };
}

/** Installs a PRUEBAS project (INSTALAR_PRUEBAS) and returns { project, tokens, install }. */
function installTest(account, name) {
  const project = account.createProject(name || 'pruebas');
  const install = project.run('INSTALAR_PRUEBAS');
  return { project, install, tokens: tokensByAlias(install.accesos) };
}

/** Opens the project's own master spreadsheet inside an execution. */
function masterSheet(g, name) {
  const id = g.PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  return g.SpreadsheetApp.openById(id).getSheetByName(name);
}

/**
 * Writes CONFIG `key` = `value` the way an operator does (typing into the
 * sheet), so Google Sheets coercion applies. Returns the value as stored.
 */
function setConfig(project, key, value) {
  return project.execute('setConfig(' + key + ')', (g) => {
    const sheet = masterSheet(g, 'CONFIG');
    const keys = sheet.getRange(1, 1, sheet.getLastRow(), 1).getValues();
    for (let r = 0; r < keys.length; r++) {
      if (String(keys[r][0]).trim() === key) {
        const cell = sheet.getRange(r + 1, 2);
        cell.setValue(value);
        return cell.getValue();
      }
    }
    sheet.appendRow([key, value, '']);
    return sheet.getRange(sheet.getLastRow(), 2).getValue();
  });
}

/** Registers `count` distinct participants and issues their codes. Returns the REGISTRO records. */
function registerAndIssueCodes(project, count) {
  // A bulk load arrives faster than the per-minute anti-abuse limit allows a real crowd to.
  setConfig(project, 'limite_envios_minuto', '100000');
  for (let i = 1; i <= count; i++) project.run('accionInscribir', uniqueSubmission(i));
  project.run('accionAsignarCodigos', {}, ADMIN_SESSION);
  return project.records('REGISTRO');
}

module.exports = {
  DEFAULT_NOW, ADMIN_SESSION, validSubmission, uniqueSubmission, newAccount, tokenFromUrl, tokensByAlias,
  installProduction, installTest, masterSheet, setConfig, registerAndIssueCodes
};
