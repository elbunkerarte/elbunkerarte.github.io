'use strict';
/**
 * Google Apps Script emulator - entry point.
 *
 *   const { createAccount } = require('./gas');
 *   const account = createAccount();
 *   const prod = account.createProject('prod');
 *   prod.run('setupInicial');
 *
 * An ACCOUNT is one Google user: one Drive, one spreadsheet registry, one mail
 * outbox and daily quota, one UrlFetch stub table, one clock. Every PROJECT of
 * the account shares those, like the production and test Apps Script projects
 * of a real deployment that live in the same Google account.
 */
const { DriveStore, SPREADSHEET_MIME, driveId } = require('./drive');
const { SheetStore, SpreadsheetStore, DEFAULT_ROWS, DEFAULT_COLS } = require('./sheets');
const { Project } = require('./project');
const { headerLookup } = require('./services');
const C = require('./coerce');

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const PROCESS_ZONE = 'America/Bogota';

/**
 * Apps Script evaluates local-time Date methods in the script zone. Node can
 * only have ONE zone per process, so the emulator pins the process to the
 * project zone and fails loudly if the platform cannot honour it.
 */
function ensureProcessZone() {
  if (process.env.TZ !== PROCESS_ZONE) process.env.TZ = PROCESS_ZONE;
  const offset = new Date(2026, 0, 1).getTimezoneOffset();
  if (offset !== 300) {
    throw new Error('The emulator needs Node to run in ' + PROCESS_ZONE + ' (UTC-5); got offset ' + offset + ' minutes.');
  }
}

function toBuffer(body) {
  if (body === undefined || body === null) return Buffer.alloc(0);
  if (Buffer.isBuffer(body)) return body;
  if (typeof body === 'string') return Buffer.from(body, 'utf8');
  if (Array.isArray(body)) return Buffer.from(body.map((b) => b & 0xff));
  return Buffer.from(JSON.stringify(body), 'utf8');
}

function normalizeStubResult(result) {
  if (result === undefined || result === null) return { code: 404, headers: {}, bytes: Buffer.from('Not Found') };
  if (typeof result === 'number') return { code: result, headers: {}, bytes: Buffer.alloc(0) };
  if (typeof result === 'string') return { code: 200, headers: { 'Content-Type': 'text/plain' }, bytes: toBuffer(result) };
  const headers = Object.assign({}, result.headers || {});
  const body = result.body !== undefined ? result.body : result.content;
  if (body && typeof body === 'object' && !Buffer.isBuffer(body) && !Array.isArray(body) && !headerLookup(headers, 'Content-Type')) {
    headers['Content-Type'] = 'application/json';
  }
  return { code: result.code === undefined ? 200 : result.code, headers, bytes: toBuffer(body) };
}

function matches(matcher, url) {
  if (typeof matcher === 'string') return url === matcher || url.startsWith(matcher);
  if (matcher instanceof RegExp) { matcher.lastIndex = 0; return matcher.test(url); }
  if (typeof matcher === 'function') return !!matcher(url);
  return false;
}

function csvCell(v) {
  const s = String(v);
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

class Account {
  constructor(options) {
    ensureProcessZone();
    const o = options || {};
    this.quiet = o.quiet !== undefined ? !!o.quiet : true;
    this.ownerEmail = o.ownerEmail || 'owner@example.test';
    this.activeUserEmail = o.activeUserEmail !== undefined ? o.activeUserEmail : '';
    this.activeUserLocale = o.activeUserLocale || 'es';
    this.spreadsheetTimeZone = o.spreadsheetTimeZone || PROCESS_ZONE;
    this.spreadsheetLocale = o.spreadsheetLocale || 'en_US';
    this.clockMs = null;
    this.execCounter = 0;
    this.nextMetadataId = 1;

    this.drive = new DriveStore(this);
    this.spreadsheets = new Map();
    this.projects = new Map();

    this.outbox = [];
    this.mailDailyQuota = o.mailQuota !== undefined ? o.mailQuota : 100;
    this.mailQuotaRemaining = this.mailDailyQuota;

    this.stubs = [];
    this.fetchLog = [];
    this._installBuiltinStubs();
  }

  // ---- clock -----------------------------------------------------------------
  nowMs() { return this.clockMs === null ? Date.now() : this.clockMs; }

  /** Freezes `new Date()` / `Date.now()` in every project at this instant (ISO string, Date or ms). null = real time. */
  setNow(when) {
    if (when === null || when === undefined) { this.clockMs = null; return; }
    const ms = typeof when === 'number' ? when : new Date(when).getTime();
    if (!isFinite(ms)) throw new Error('setNow: invalid instant ' + when);
    this.clockMs = ms;
  }

  advance(ms) { this.clockMs = this.nowMs() + ms; }

  // ---- projects ----------------------------------------------------------------
  createProject(name, options) {
    if (this.projects.has(name)) throw new Error('A project named ' + name + ' already exists in this account');
    const p = new Project(this, name, options);
    this.projects.set(name, p);
    return p;
  }

  // ---- spreadsheets --------------------------------------------------------------
  createSpreadsheet(name, projectName, rows, cols) {
    const id = driveId(44);
    this.drive.addGoogleFile(id, name, SPREADSHEET_MIME, projectName);
    const store = new SpreadsheetStore(this, id, {
      timeZone: this.spreadsheetTimeZone, locale: this.spreadsheetLocale, createdBy: projectName
    });
    const firstName = /^es/i.test(this.spreadsheetLocale) ? 'Hoja 1' : 'Sheet1';
    store.sheets.push(new SheetStore(store.newSheetId(), firstName, rows || DEFAULT_ROWS, cols || DEFAULT_COLS));
    this.spreadsheets.set(id, store);
    return id;
  }

  copySpreadsheet(sourceId, newName, projectName) {
    const src = this.spreadsheets.get(sourceId);
    const id = driveId(44);
    this.drive.addGoogleFile(id, newName || 'Copy of ' + src.name, SPREADSHEET_MIME, projectName);
    const store = new SpreadsheetStore(this, id, { timeZone: src.timeZone, locale: src.locale, createdBy: projectName });
    const idMap = new Map();
    store.sheets = src.sheets.map((s) => {
      const copy = s.clone(store.newSheetId());
      idMap.set(s.id, copy.id);
      return copy;
    });
    store.metadata = src.metadata.map((md) => Object.assign({}, md, {
      id: this.nextMetadataId++,
      location: Object.assign({}, md.location, md.location.sheetId !== undefined ? { sheetId: idMap.get(md.location.sheetId) } : {})
    }));
    this.spreadsheets.set(id, store);
    return id;
  }

  spreadsheet(id) { return this.spreadsheets.get(id) || null; }

  findSpreadsheetsByName(name) {
    return Array.from(this.spreadsheets.values()).filter((s) => s.name === name);
  }

  // ---- mail ------------------------------------------------------------------------
  setMailQuota(n) { this.mailDailyQuota = n; this.mailQuotaRemaining = n; }

  // ---- UrlFetch ----------------------------------------------------------------------
  /**
   * Registers a fake HTTP endpoint. `matcher`: exact URL or URL prefix string,
   * RegExp, or predicate. `handler`: function(request) -> {code, body, headers}
   * (body may be string, Buffer, byte array or an object serialised as JSON),
   * or that response object directly. Newest stubs win. Returns an unregister function.
   */
  stubUrl(matcher, handler) {
    const entry = { matcher, handler };
    this.stubs.unshift(entry);
    return () => { this.stubs = this.stubs.filter((s) => s !== entry); };
  }

  routeFetch(req) {
    this.fetchLog.push({ project: req.project, url: req.url, method: req.method, headers: req.headers,
      payload: req.payload, at: new Date(this.nowMs()).toISOString() });
    for (const s of this.stubs) {
      if (!matches(s.matcher, req.url)) continue;
      const result = typeof s.handler === 'function' ? s.handler(req) : s.handler;
      return normalizeStubResult(result);
    }
    return { code: 404, headers: { 'Content-Type': 'text/html' },
      bytes: Buffer.from('<html>404 Not Found (emulator: no stub for ' + req.url + ')</html>') };
  }

  _installBuiltinStubs() {
    // Spreadsheet export, as used for backups. Without a valid OAuth token Google
    // answers with a redirect to the login page, which UrlFetch follows by
    // default and returns as HTTP 200 HTML - so the stub does the same.
    this.stubs.push({
      matcher: /^https:\/\/docs\.google\.com\/spreadsheets\/d\/([^/?#]+)\/export(\?[^#]*)?$/,
      handler: (req) => this._exportSpreadsheet(req)
    });
    this.stubs.push({
      matcher: /^https:\/\/accounts\.google\.com\//,
      handler: { code: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' },
        body: '<!DOCTYPE html><html><head><title>Sign in - Google Accounts</title></head><body>Sign in</body></html>' }
    });
  }

  _exportSpreadsheet(req) {
    const m = req.url.match(/^https:\/\/docs\.google\.com\/spreadsheets\/d\/([^/?#]+)\/export(\?[^#]*)?$/);
    const auth = headerLookup(req.headers, 'Authorization');
    const authorised = !!auth && Array.from(this.projects.values()).some((p) => auth === 'Bearer ' + p.oauthToken);
    if (!authorised) {
      return { code: 302, headers: { Location: 'https://accounts.google.com/ServiceLogin?continue=' + encodeURIComponent(req.url) } };
    }
    const store = this.spreadsheets.get(m[1]);
    if (!store) return { code: 404, headers: { 'Content-Type': 'text/html' }, body: '<html>Sorry, unable to open the file at this time.</html>' };
    const qs = new URLSearchParams(m[2] ? m[2].slice(1) : '');
    const format = qs.get('format') || qs.get('exportFormat') || 'pdf';
    if (format === 'xlsx') {
      const sheets = {};
      for (const s of store.sheets) sheets[s.name] = store.values(s.name);
      const payload = JSON.stringify({ emulatedXlsx: true, spreadsheetId: store.id, name: store.name, sheets });
      return {
        code: 200,
        headers: { 'Content-Type': XLSX_MIME, 'Content-Disposition': 'attachment; filename="' + store.name + '.xlsx"' },
        body: Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.from(payload, 'utf8')])
      };
    }
    if (format === 'csv') {
      const gid = qs.get('gid');
      const sheet = gid === null ? store.sheets[0] : store.sheets.find((s) => String(s.id) === String(gid));
      if (!sheet) return { code: 400, body: 'Bad gid' };
      const rows = [];
      for (let r = 1; r <= sheet.lastRow(); r++) {
        const line = [];
        for (let c = 1; c <= sheet.lastColumn(); c++) line.push(csvCell(C.displayValue(sheet.cell(r, c))));
        rows.push(line.join(','));
      }
      return { code: 200, headers: { 'Content-Type': 'text/csv' }, body: rows.join('\n') };
    }
    return { code: 200, headers: { 'Content-Type': 'application/pdf' }, body: '%PDF-1.4 emulated export of ' + store.name };
  }
}

function createAccount(options) {
  return new Account(options);
}

module.exports = { createAccount, Account, XLSX_MIME };
