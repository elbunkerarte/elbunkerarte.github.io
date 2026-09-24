'use strict';
/**
 * One Apps Script project: its own Script Properties, caches, triggers and
 * locks, plus the deployed source (apps-script/*.gs in filename order and the
 * PLANTILLAS registry built from apps-script/*.html exactly like
 * tools/empaquetar.js does).
 *
 * EVERY run() is a new execution with a brand-new global scope, as on Google:
 * module-level variables (e.g. a per-execution CONFIG cache) never survive from
 * one request to the next. Persistent state is only what Google persists:
 * properties, cache, triggers, spreadsheets, Drive.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const { createRealm, isDateLike, isPlainObject } = require('./realm');
const { makeSpreadsheetApp } = require('./sheets');
const { makeDrive } = require('./drive');
const { makeHtmlService } = require('./html');
const S = require('./services');

const DEFAULT_SOURCE_DIR = path.join(__dirname, '..', '..', 'apps-script');
const MAX_EXECUTION_LOG = 500;

function newLockState() {
  return { held: false, holder: null, depth: 0, maxDepth: 0, acquisitions: 0, releases: 0,
    nestedAttempts: 0, refused: 0, leakedAtEnd: 0, contention: false, lastTimeoutMs: null };
}

function parseQuery(query) {
  const parameter = {};
  const parameters = {};
  let queryString = '';
  if (typeof query === 'string') {
    queryString = query.replace(/^\?/, '');
    for (const [k, v] of new URLSearchParams(queryString)) {
      if (!(k in parameter)) parameter[k] = v;
      (parameters[k] = parameters[k] || []).push(v);
    }
  } else if (query) {
    const parts = [];
    for (const k of Object.keys(query)) {
      const values = Array.isArray(query[k]) ? query[k].map(String) : [String(query[k])];
      parameter[k] = values[0];
      parameters[k] = values;
      values.forEach((v) => parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(v)));
    }
    queryString = parts.join('&');
  }
  return { parameter, parameters, queryString };
}

/** Values google.script.run refuses to carry (on the way in) or turns into null (on the way out). */
function findIllegalClientValue(v, pathLabel, seen) {
  if (v === null || v === undefined) return null;
  const t = typeof v;
  if (t === 'string' || t === 'number' || t === 'boolean') return null;
  if (t === 'function') return pathLabel + ' is a function';
  if (isDateLike(v)) return pathLabel + ' is a Date';
  if (seen.has(v)) return pathLabel + ' is a circular reference';
  seen.add(v);
  if (Array.isArray(v)) {
    for (let i = 0; i < v.length; i++) {
      const bad = findIllegalClientValue(v[i], pathLabel + '[' + i + ']', seen);
      if (bad) return bad;
    }
    return null;
  }
  if (!isPlainObject(v)) return pathLabel + ' is not a plain object';
  for (const k of Object.keys(v)) {
    const bad = findIllegalClientValue(v[k], pathLabel + '.' + k, seen);
    if (bad) return bad;
  }
  return null;
}

class Project {
  constructor(account, name, options) {
    this.account = account;
    this.name = name;
    this.options = Object.assign({
      sourceDir: DEFAULT_SOURCE_DIR,
      mode: 'files',                 // 'files' (one script per .gs) or 'bundle' (single Codigo.gs, like the deploy)
      templates: true,               // inject the PLANTILLAS registry like tools/empaquetar.js
      deployed: true,                // ScriptApp.getService().getUrl() returns a URL
      containerSpreadsheetId: null,  // null = standalone script (getActiveSpreadsheet() === null)
      freshContextPerRun: true
    }, options || {});
    this.scriptId = '1' + crypto.randomBytes(24).toString('base64url').slice(0, 56);
    this.oauthToken = 'ya29.emulated.' + name + '.' + crypto.randomBytes(8).toString('hex');

    this.scriptProperties = new Map();
    this.userProperties = new Map();
    this.documentProperties = new Map();
    this.scriptCache = new Map();
    this.userCache = new Map();
    this.documentCache = new Map();
    this.triggers = [];
    this.lockState = { script: newLockState(), user: newLockState(), document: newLockState() };

    this.logs = [];
    this.warnings = [];
    this.openedSpreadsheets = new Set();
    this.coercions = {};
    this.executions = [];
    this._templateScripts = new Map();
    this._last = null;

    this.loadSources();
  }

  // ---------------------------------------------------------------------------
  // Source loading
  // ---------------------------------------------------------------------------

  loadSources() {
    const dir = this.options.sourceDir;
    const all = fs.readdirSync(dir);
    const gs = all.filter((f) => f.endsWith('.gs')).sort();
    const html = all.filter((f) => f.endsWith('.html')).sort();
    if (!gs.length) throw new Error('No .gs files in ' + dir);

    this.htmlFiles = new Map(html.map((f) => [f.replace(/\.html$/, ''), fs.readFileSync(path.join(dir, f), 'utf8')]));
    this.sourceFiles = gs;

    let manifest = {};
    const manifestPath = path.join(dir, 'appsscript.json');
    if (fs.existsSync(manifestPath)) manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    this.manifest = manifest;
    this.timeZone = this.options.timeZone || manifest.timeZone || 'America/Bogota';
    if (this.timeZone !== process.env.TZ) {
      this.warnings.push({ type: 'timezone-mismatch', message: 'Project zone ' + this.timeZone +
        ' differs from the emulator process zone ' + process.env.TZ + '; local-time Date methods use the process zone.' });
    }

    const registry = this.options.templates
      ? 'var PLANTILLAS = {\n' + html.map((f) => '  ' + JSON.stringify(f.replace(/\.html$/, '')) + ': ' +
          JSON.stringify(this.htmlFiles.get(f.replace(/\.html$/, '')))).join(',\n') + '\n};\n'
      : null;

    const compile = (code, filename) => {
      try {
        return new vm.Script(code, { filename });
      } catch (e) {
        throw new Error('Syntax error in ' + filename + ': ' + e.message);
      }
    };

    this._scripts = [];
    if (this.options.mode === 'bundle') {
      const parts = [];
      if (registry) parts.push(registry);
      for (const f of gs) parts.push('// ' + f + '\n' + fs.readFileSync(path.join(dir, f), 'utf8').trimEnd());
      this._scripts.push({ file: 'Codigo.gs', script: compile(parts.join('\n') + '\n', 'Codigo.gs') });
    } else {
      if (registry) this._scripts.push({ file: 'PLANTILLAS', script: compile(registry, 'PLANTILLAS.gs') });
      for (const f of gs) {
        this._scripts.push({ file: f, script: compile(fs.readFileSync(path.join(dir, f), 'utf8'), f) });
      }
    }
    this._templateScripts.clear();
  }

  templateNameFor(source) {
    for (const [name, content] of this.htmlFiles) if (content === source) return name;
    return null;
  }

  compileTemplate(source, name, generate) {
    let script = this._templateScripts.get(source);
    if (!script) {
      script = new vm.Script(generate(), { filename: 'template:' + name });
      this._templateScripts.set(source, script);
    }
    return script;
  }

  // ---------------------------------------------------------------------------
  // Executions
  // ---------------------------------------------------------------------------

  _newExecution(label) {
    const project = this;
    const account = this.account;
    const exec = { id: ++account.execCounter, fn: label, calls: {}, sleptMs: 0, startedAt: Date.now() };
    const realm = createRealm(() => account.nowMs());
    const env = {
      account, project, realm, exec,
      count(name) { exec.calls[name] = (exec.calls[name] || 0) + 1; },
      warn(type, message, detail) {
        project.warnings.push({ type, message, fn: exec.fn, detail: detail || null });
      },
      note(type, detail) {
        if (type !== 'coerced') return;
        const bySheet = project.coercions[detail.sheet] = project.coercions[detail.sheet] || {};
        const entry = bySheet[detail.header] = bySheet[detail.header] || { count: 0, from: detail.from, to: detail.to };
        entry.count++;
      }
    };

    const g = realm.ctx;
    const consoleFacade = S.makeConsole(env);
    g.console = consoleFacade;
    g.Logger = S.makeLogger(env, consoleFacade);
    g.SpreadsheetApp = makeSpreadsheetApp(env);
    g.DriveApp = makeDrive(env);
    g.PropertiesService = S.makePropertiesService(env);
    g.LockService = S.makeLockService(env);
    g.CacheService = S.makeCacheService(env);
    g.MailApp = S.makeMailApp(env);
    g.UrlFetchApp = S.makeUrlFetchApp(env);
    g.ScriptApp = S.makeScriptApp(env);
    g.Session = S.makeSession(env);
    g.HtmlService = makeHtmlService(env);
    g.ContentService = S.makeContentService(env);
    g.Utilities = S.makeUtilities(env);

    for (const { file, script } of this._scripts) {
      try {
        script.runInContext(g);
      } catch (e) {
        throw new Error('Error loading ' + file + ' in project "' + this.name + '": ' + (e && e.message));
      }
    }
    this._last = { exec, realm, env };
    return this._last;
  }

  _endExecution(exec) {
    for (const kind of Object.keys(this.lockState)) {
      const st = this.lockState[kind];
      if (st.held && st.holder === exec.id) {
        st.held = false;
        st.holder = null;
        st.depth = 0;
        st.leakedAtEnd++;
        this.warnings.push({ type: 'lock-held-at-end', message: kind + ' lock still held when ' + exec.fn +
          ' finished (Google releases it automatically)', fn: exec.fn });
      }
    }
    exec.durationMs = Date.now() - exec.startedAt;
    this.executions.push(exec);
    if (this.executions.length > MAX_EXECUTION_LOG) this.executions.shift();
  }

  _execution(label) {
    if (!this.options.freshContextPerRun && this._persistent) return this._persistent;
    const e = this._newExecution(label);
    if (!this.options.freshContextPerRun) this._persistent = e;
    return e;
  }

  /** Calls a global function of the project in a new execution. Host arguments are copied into the realm. */
  run(fnName, ...args) {
    const { realm, exec } = this._execution(fnName);
    const fn = realm.ctx[fnName];
    if (typeof fn !== 'function') {
      this._endExecution(exec);
      throw new Error('Project "' + this.name + '" has no global function named ' + fnName);
    }
    try {
      return fn.apply(undefined, args.map((a) => realm.import(a)));
    } finally {
      this._endExecution(exec);
    }
  }

  /** Runs an arbitrary callback inside one execution: (globals, realm) => result. */
  execute(label, callback) {
    const { realm, exec } = this._execution(label);
    try {
      return callback(realm.ctx, realm);
    } finally {
      this._endExecution(exec);
    }
  }

  /** The global scope of the most recent execution (a fresh one is created if none ran yet). */
  get ctx() {
    return (this._last || this._newExecution('(inspect)')).realm.ctx;
  }

  get lastExecution() {
    return this.executions[this.executions.length - 1] || null;
  }

  // ---------------------------------------------------------------------------
  // Web app entry points
  // ---------------------------------------------------------------------------

  request(method, opts) {
    const o = opts || {};
    const q = parseQuery(o.query);
    const e = { parameter: q.parameter, parameters: q.parameters, queryString: q.queryString,
      contextPath: '', contentLength: -1 };
    if (method === 'POST') {
      const contentType = o.contentType || 'text/plain';
      const contents = typeof o.body === 'string' ? o.body : JSON.stringify(o.body === undefined ? {} : o.body);
      e.postData = { contents, length: Buffer.byteLength(contents), type: contentType, name: 'postData' };
      e.contentLength = e.postData.length;
      if (/^application\/x-www-form-urlencoded/.test(contentType)) {
        const form = parseQuery(contents);
        for (const k of Object.keys(form.parameter)) {
          if (!(k in e.parameter)) e.parameter[k] = form.parameter[k];
          e.parameters[k] = (e.parameters[k] || []).concat(form.parameters[k]);
        }
      }
    }
    const out = this.run(method === 'POST' ? 'doPost' : 'doGet', e);
    return toResponse(out);
  }

  get(query) { return this.request('GET', { query }); }

  post(body, opts) { return this.request('POST', Object.assign({ body }, opts || {})); }

  /**
   * Emulates google.script.run: rejects arguments the client cannot send and
   * turns a return value containing Dates/functions into null, as Google does.
   */
  clientCall(fnName, ...args) {
    args.forEach((a, i) => {
      const bad = findIllegalClientValue(a, 'argument ' + i, new Set());
      if (bad) throw new Error('google.script.run failed due to illegal value: ' + bad);
    });
    const result = this.run(fnName, ...args);
    const bad = findIllegalClientValue(result, 'return value', new Set());
    if (bad) {
      this.warnings.push({ type: 'client-null-return', message: fnName + ' returned an illegal value (' + bad +
        '); the browser receives null', fn: fnName });
      return null;
    }
    return result === undefined ? undefined : JSON.parse(JSON.stringify(result));
  }

  // ---------------------------------------------------------------------------
  // Triggers
  // ---------------------------------------------------------------------------

  /** Runs every trigger whose handler is `handler` (or the given trigger), like Google firing it. */
  fireTrigger(handler) {
    const due = this.triggers.filter((t) => t.handler === handler);
    if (!due.length) throw new Error('Project "' + this.name + '" has no trigger for ' + handler);
    return due.map((t) => {
      const now = new Date(this.account.nowMs());
      return this.run(t.handler, {
        authMode: 'FULL', triggerUid: t.id, timezone: this.timeZone,
        year: now.getFullYear(), month: now.getMonth() + 1, 'day-of-month': now.getDate(),
        hour: now.getHours(), minute: now.getMinutes(), second: now.getSeconds()
      });
    });
  }

  /** Handlers referenced by triggers that do not exist as global functions. */
  missingTriggerHandlers() {
    return this.execute('(trigger check)', (g) => this.triggers
      .filter((t) => typeof g[t.handler] !== 'function').map((t) => t.handler));
  }

  // ---------------------------------------------------------------------------
  // Inspection helpers (host realm)
  // ---------------------------------------------------------------------------

  scriptProperty(key) { const v = this.scriptProperties.get(key); return v === undefined ? null : v; }

  get spreadsheetId() { return this.scriptProperty('SPREADSHEET_ID'); }

  spreadsheet() {
    const id = this.spreadsheetId;
    return id ? this.account.spreadsheets.get(id) || null : null;
  }

  records(sheetName) {
    const ss = this.spreadsheet();
    return ss ? ss.records(sheetName) : [];
  }

  warningsOf(type) { return this.warnings.filter((w) => w.type === type); }

  simulateLockContention(on) { this.lockState.script.contention = !!on; }

  evictCache() { this.scriptCache.clear(); this.userCache.clear(); }

  logText() { return this.logs.map((l) => '[' + l.level + '] ' + l.message).join('\n'); }
}

function toResponse(out) {
  if (out === undefined || out === null) throw new Error('The script completed but did not return anything.');
  if (out._kind === 'HtmlOutput') {
    return {
      status: 200, kind: 'html', mimeType: 'text/html', body: out.getContent(), title: out.getTitle(), output: out,
      json() { throw new Error('An HTML page is not JSON'); }
    };
  }
  if (out._kind === 'TextOutput') {
    const body = out.getContent();
    return {
      status: 200, kind: 'text', mimeType: S.CONTENT_MIME_HTTP[out.getMimeType()] || 'text/plain', body, output: out,
      json() { return JSON.parse(body); }
    };
  }
  throw new Error('The script completed but the returned value is not a supported return type.');
}

module.exports = { Project, DEFAULT_SOURCE_DIR, parseQuery, toResponse };
