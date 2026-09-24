'use strict';
/**
 * Per-execution facades for the smaller Apps Script services.
 * State lives on the project (properties, cache, triggers, lock) or on the
 * account (mail outbox + quota, UrlFetch stubs, clock); facades only read it.
 */
const crypto = require('crypto');
const { Blob, bufferFrom } = require('./blob');
const tz = require('./tz');
const { isDateLike, toSignedArray, isByteArray, bytesToBuffer, encodingFor } = require('./realm');

// ---------------------------------------------------------------------------
// PropertiesService
// ---------------------------------------------------------------------------

const PROPERTY_VALUE_LIMIT = 9 * 1024;
const PROPERTY_TOTAL_LIMIT = 500 * 1024;

function makePropertyStore(env, map) {
  const R = env.realm;
  function totalSize() {
    let n = 0;
    for (const [k, v] of map) n += k.length + v.length;
    return n;
  }
  function put(k, v) {
    const key = String(k);
    const value = String(v);
    if (value.length > PROPERTY_VALUE_LIMIT) throw R.error('Argument too large: value');
    const before = map.get(key);
    map.set(key, value);
    if (totalSize() > PROPERTY_TOTAL_LIMIT) {
      if (before === undefined) map.delete(key); else map.set(key, before);
      throw R.error('You have exceeded the property storage quota. Please remove some properties and try again.');
    }
  }
  const store = {
    getProperty(k) { env.count('Properties.getProperty'); const v = map.get(String(k)); return v === undefined ? null : v; },
    setProperty(k, v) { env.count('Properties.setProperty'); put(k, v); return store; },
    deleteProperty(k) { map.delete(String(k)); return store; },
    getProperties() {
      const o = new R.Object();
      for (const [k, v] of map) o[k] = v;
      return o;
    },
    setProperties(obj, deleteAllOthers) {
      if (deleteAllOthers) map.clear();
      for (const k of Object.keys(obj || {})) put(k, obj[k]);
      return store;
    },
    deleteAllProperties() { map.clear(); return store; },
    getKeys() { return R.array(Array.from(map.keys())); }
  };
  return store;
}

function makePropertiesService(env) {
  const p = env.project;
  return {
    getScriptProperties() { return makePropertyStore(env, p.scriptProperties); },
    getUserProperties() { return makePropertyStore(env, p.userProperties); },
    getDocumentProperties() {
      return p.options.containerSpreadsheetId ? makePropertyStore(env, p.documentProperties) : null;
    }
  };
}

// ---------------------------------------------------------------------------
// LockService
// ---------------------------------------------------------------------------

/**
 * Single-threaded model of the script lock. Counters let a test assert that no
 * code path takes the lock while already holding it: on Google a nested
 * tryLock in the same execution succeeds, but the INNER releaseLock frees the
 * lock for everybody while the outer critical section is still running.
 */
function makeLock(env, state) {
  const R = env.realm;
  const lock = {
    tryLock(timeoutMs) {
      env.count('Lock.tryLock');
      if (state.contention) { state.refused++; return false; }
      if (state.held && state.holder === env.exec.id) {
        state.nestedAttempts++;
        state.depth++;
        state.maxDepth = Math.max(state.maxDepth, state.depth);
        return true;
      }
      state.held = true;
      state.holder = env.exec.id;
      state.depth = 1;
      state.maxDepth = Math.max(state.maxDepth, 1);
      state.acquisitions++;
      state.lastTimeoutMs = timeoutMs;
      return true;
    },
    waitLock(timeoutMs) {
      if (!lock.tryLock(timeoutMs)) throw R.error('Lock timeout: another process was holding the lock for too long.');
    },
    releaseLock() {
      env.count('Lock.releaseLock');
      if (state.held && state.holder === env.exec.id) {
        state.held = false;
        state.holder = null;
        state.depth = 0;
        state.releases++;
      }
    },
    hasLock() { return state.held && state.holder === env.exec.id; }
  };
  return lock;
}

function makeLockService(env) {
  const p = env.project;
  return {
    getScriptLock() { return makeLock(env, p.lockState.script); },
    getUserLock() { return makeLock(env, p.lockState.user); },
    getDocumentLock() { return p.options.containerSpreadsheetId ? makeLock(env, p.lockState.document) : null; }
  };
}

// ---------------------------------------------------------------------------
// CacheService
// ---------------------------------------------------------------------------

const CACHE_MAX_TTL = 21600;
const CACHE_KEY_LIMIT = 250;
const CACHE_VALUE_LIMIT = 100 * 1024;

function makeCache(env, map) {
  const R = env.realm;
  const now = () => env.account.nowMs();
  function live(key) {
    const e = map.get(key);
    if (!e) return null;
    if (e.expires <= now()) { map.delete(key); return null; }
    return e.value;
  }
  function put(key, value, ttl) {
    const k = String(key);
    const v = String(value);
    if (k.length > CACHE_KEY_LIMIT) throw R.error('Argument too large: key');
    if (Buffer.byteLength(v, 'utf8') > CACHE_VALUE_LIMIT) throw R.error('Argument too large: value');
    const seconds = Math.min(CACHE_MAX_TTL, ttl === undefined || ttl === null ? 600 : Math.max(1, Number(ttl)));
    map.set(k, { value: v, expires: now() + seconds * 1000 });
  }
  const cache = {
    get(key) { env.count('Cache.get'); return live(String(key)); },
    put(key, value, ttl) { env.count('Cache.put'); put(key, value, ttl); },
    remove(key) { map.delete(String(key)); },
    getAll(keys) {
      const o = new R.Object();
      for (const k of keys) { const v = live(String(k)); if (v !== null) o[k] = v; }
      return o;
    },
    putAll(values, ttl) { for (const k of Object.keys(values)) put(k, values[k], ttl); },
    removeAll(keys) { for (const k of keys) map.delete(String(k)); }
  };
  return cache;
}

function makeCacheService(env) {
  const p = env.project;
  return {
    getScriptCache() { return makeCache(env, p.scriptCache); },
    getUserCache() { return makeCache(env, p.userCache); },
    getDocumentCache() { return p.options.containerSpreadsheetId ? makeCache(env, p.documentCache) : null; }
  };
}

// ---------------------------------------------------------------------------
// MailApp (outbox and daily quota are ACCOUNT-wide, like on Google)
// ---------------------------------------------------------------------------

const EMAIL_RE = /^[^\s@,;<>"]+@[^\s@,;<>"]+\.[^\s@,;<>"]+$/;

function splitRecipients(list) {
  if (!list) return [];
  return String(list).split(',').map((x) => x.trim()).filter(Boolean)
    .map((x) => { const m = x.match(/<([^>]+)>\s*$/); return m ? m[1].trim() : x; });
}

function makeMailApp(env) {
  const R = env.realm;
  const account = env.account;

  function send(message) {
    env.count('MailApp.sendEmail');
    const to = splitRecipients(message.to);
    const cc = splitRecipients(message.cc);
    const bcc = splitRecipients(message.bcc);
    const all = to.concat(cc, bcc);
    if (!all.length) throw R.error('Failed to send email: no recipient');
    for (const addr of all) if (!EMAIL_RE.test(addr)) throw R.error('Invalid email: ' + addr);
    if (account.mailQuotaRemaining < all.length) {
      throw R.error('Service invoked too many times for one day: email.');
    }
    account.mailQuotaRemaining -= all.length;
    account.outbox.push({
      project: env.project.name, at: new Date(account.nowMs()).toISOString(),
      to: to.join(','), cc: cc.join(','), bcc: bcc.join(','), subject: String(message.subject || ''),
      body: String(message.body || ''), htmlBody: message.htmlBody || null, name: message.name || null,
      replyTo: message.replyTo || null, noReply: !!message.noReply,
      attachments: (message.attachments || []).map((a) => (a && a.getName ? a.getName() : String(a)))
    });
  }

  return {
    sendEmail(a, b, c, d) {
      if (a && typeof a === 'object') return send(a);
      if (typeof d === 'string') return send({ to: a, replyTo: b, subject: c, body: d });
      return send(Object.assign({}, d || {}, { to: a, subject: b, body: c }));
    },
    getRemainingDailyQuota() { return account.mailQuotaRemaining; }
  };
}

// ---------------------------------------------------------------------------
// UrlFetchApp (routed through the account stub table)
// ---------------------------------------------------------------------------

function headerLookup(headers, name) {
  if (!headers) return undefined;
  const k = Object.keys(headers).find((h) => h.toLowerCase() === name.toLowerCase());
  return k === undefined ? undefined : headers[k];
}

function makeHttpResponse(env, res) {
  const R = env.realm;
  const bytes = res.bytes;
  const headers = res.headers || {};
  const contentType = headerLookup(headers, 'Content-Type') || null;
  const disposition = headerLookup(headers, 'Content-Disposition');
  const fileName = disposition && (String(disposition).match(/filename="?([^";]+)"?/) || [])[1];
  return {
    getResponseCode() { return res.code; },
    getContentText(charset) { return bytes.toString(encodingFor(charset)); },
    getContent() { return toSignedArray(R, bytes); },
    getBlob() { return new Blob(env, bytes, contentType ? String(contentType).split(';')[0] : null, fileName || null); },
    getAs(ct) { return this.getBlob().getAs(ct); },
    getHeaders() {
      const o = new R.Object();
      for (const k of Object.keys(headers)) o[k] = Array.isArray(headers[k]) ? headers[k].join(', ') : String(headers[k]);
      return o;
    },
    getAllHeaders() {
      const o = new R.Object();
      for (const k of Object.keys(headers)) o[k] = Array.isArray(headers[k]) ? R.array(headers[k]) : String(headers[k]);
      return o;
    },
    toString() { return 'HTTPResponse'; }
  };
}

function normalizeRequest(env, url, params) {
  const p = params || {};
  const headers = Object.assign({}, p.headers || {});
  let payload = p.payload;
  if (payload !== undefined && payload !== null && typeof payload === 'object' && !isByteArray(payload) &&
      !(payload instanceof Blob)) {
    payload = Object.keys(payload).map((k) => encodeURIComponent(k) + '=' + encodeURIComponent(payload[k])).join('&');
  }
  return {
    url: String(url),
    method: String(p.method || 'get').toUpperCase(),
    headers,
    contentType: p.contentType || (payload !== undefined ? 'application/x-www-form-urlencoded' : undefined),
    payload: payload instanceof Blob ? payload.getDataAsString() : payload,
    followRedirects: p.followRedirects !== false,
    muteHttpExceptions: p.muteHttpExceptions === true,
    validateHttpsCertificates: p.validateHttpsCertificates !== false,
    params: p,
    project: env.project.name
  };
}

function makeUrlFetchApp(env) {
  const R = env.realm;
  const account = env.account;

  function fetchOne(url, params) {
    env.count('UrlFetchApp.fetch');
    if (!/^https?:\/\//i.test(String(url))) throw R.error('Invalid argument: ' + url);
    const req = normalizeRequest(env, url, params);
    let res = account.routeFetch(req);
    let hops = 0;
    while (req.followRedirects && res.code >= 300 && res.code < 400) {
      const location = headerLookup(res.headers, 'Location');
      if (!location) break;
      if (++hops > 20) throw R.error('Too many redirects for ' + url);
      const next = Object.assign({}, req, { url: String(location), method: 'GET', payload: undefined });
      res = account.routeFetch(next);
    }
    if (res.code >= 400 && !req.muteHttpExceptions) {
      const host = String(url).replace(/^https?:\/\//i, '').split(/[/?#]/)[0];
      throw R.error('Request failed for https://' + host + ' returned code ' + res.code + '. Truncated server response: ' +
        res.bytes.toString('utf8').slice(0, 150) + ' (use muteHttpExceptions option to examine full response)');
    }
    return makeHttpResponse(env, res);
  }

  return {
    fetch(url, params) { return fetchOne(url, params); },
    fetchAll(requests) {
      return R.array(requests.map((r) => (typeof r === 'string' ? fetchOne(r, {}) : fetchOne(r.url, r))));
    },
    getRequest(url, params) {
      const req = normalizeRequest(env, url, params);
      return R.import({ url: req.url, method: req.method.toLowerCase(), headers: req.headers, payload: req.payload,
        contentType: req.contentType, followRedirects: req.followRedirects, muteHttpExceptions: req.muteHttpExceptions,
        validateHttpsCertificates: req.validateHttpsCertificates, useIntranet: false });
    }
  };
}

// ---------------------------------------------------------------------------
// ScriptApp
// ---------------------------------------------------------------------------

const EVENT_TYPE = { CLOCK: 'CLOCK', ON_OPEN: 'ON_OPEN', ON_EDIT: 'ON_EDIT', ON_FORM_SUBMIT: 'ON_FORM_SUBMIT',
  ON_CHANGE: 'ON_CHANGE', ON_EVENT_UPDATED: 'ON_EVENT_UPDATED' };
const TRIGGER_SOURCE = { SPREADSHEETS: 'SPREADSHEETS', CLOCK: 'CLOCK', FORMS: 'FORMS', DOCUMENTS: 'DOCUMENTS', CALENDAR: 'CALENDAR' };
const WEEKDAY = { MONDAY: 'MONDAY', TUESDAY: 'TUESDAY', WEDNESDAY: 'WEDNESDAY', THURSDAY: 'THURSDAY',
  FRIDAY: 'FRIDAY', SATURDAY: 'SATURDAY', SUNDAY: 'SUNDAY' };
const MAX_TRIGGERS = 20;

function wrapTrigger(t) {
  return {
    getHandlerFunction() { return t.handler; },
    getUniqueId() { return t.id; },
    getEventType() { return t.eventType; },
    getTriggerSource() { return t.source; },
    getTriggerSourceId() { return t.sourceId || null; },
    toString() { return 'Trigger'; },
    _trigger: t
  };
}

function makeScriptApp(env) {
  const R = env.realm;
  const project = env.project;

  function register(t) {
    if (project.triggers.length >= MAX_TRIGGERS) {
      throw R.error('This script has too many triggers. Triggers must be deleted from the script before more can be added.');
    }
    t.id = String(Date.now()) + String(project.triggers.length + Math.floor(Math.random() * 1e6));
    project.triggers.push(t);
    env.count('ScriptApp.newTrigger.create');
    return wrapTrigger(t);
  }

  function clockBuilder(handler) {
    const spec = {};
    const b = {
      everyMinutes(n) {
        if ([1, 5, 10, 15, 30].indexOf(n) === -1) throw R.error('The value you passed to everyMinutes() is invalid: ' + n + '. Valid values: 1, 5, 10, 15, 30.');
        spec.everyMinutes = n; return b;
      },
      everyHours(n) {
        if ([1, 2, 4, 6, 8, 12].indexOf(n) === -1) throw R.error('The value you passed to everyHours() is invalid: ' + n + '. Valid values: 1, 2, 4, 6, 8, 12.');
        spec.everyHours = n; return b;
      },
      everyDays(n) { spec.everyDays = n; return b; },
      everyWeeks(n) { spec.everyWeeks = n; return b; },
      onWeekDay(d) { spec.weekDay = d; return b; },
      onMonthDay(d) { spec.monthDay = d; return b; },
      atHour(h) {
        if (!(h >= 0 && h <= 23)) throw R.error('Invalid argument: hour');
        spec.atHour = h; return b;
      },
      nearMinute(m) { spec.nearMinute = m; return b; },
      inTimezone(zone) { spec.timeZone = zone; return b; },
      at(date) { spec.at = isDateLike(date) ? date.getTime() : date; return b; },
      atDate(y, m, d) { spec.atDate = [y, m, d]; return b; },
      after(ms) { spec.after = ms; return b; },
      create() {
        const kinds = ['everyMinutes', 'everyHours', 'everyDays', 'everyWeeks', 'at', 'after', 'atDate', 'monthDay'].filter((k) => spec[k] !== undefined);
        if (!kinds.length) throw R.error('Trigger frequency is not set. Call everyMinutes/everyHours/everyDays/at/after before create().');
        if (spec.atHour !== undefined && spec.everyDays === undefined && spec.everyWeeks === undefined && spec.monthDay === undefined) {
          throw R.error('atHour() can only be combined with everyDays(), everyWeeks() or onMonthDay().');
        }
        return register({ handler, eventType: EVENT_TYPE.CLOCK, source: TRIGGER_SOURCE.CLOCK, spec: Object.assign({}, spec) });
      }
    };
    return b;
  }

  function sourceBuilder(handler, source, sourceId) {
    const b = {};
    for (const [method, type] of [['onEdit', EVENT_TYPE.ON_EDIT], ['onChange', EVENT_TYPE.ON_CHANGE],
      ['onFormSubmit', EVENT_TYPE.ON_FORM_SUBMIT], ['onOpen', EVENT_TYPE.ON_OPEN]]) {
      b[method] = () => ({ create: () => register({ handler, eventType: type, source, sourceId, spec: {} }) });
    }
    return b;
  }

  return {
    EventType: EVENT_TYPE,
    TriggerSource: TRIGGER_SOURCE,
    WeekDay: WEEKDAY,
    AuthMode: { NONE: 'NONE', CUSTOM_FUNCTION: 'CUSTOM_FUNCTION', LIMITED: 'LIMITED', FULL: 'FULL' },
    AuthorizationStatus: { REQUIRED: 'REQUIRED', NOT_REQUIRED: 'NOT_REQUIRED' },
    getService() {
      return {
        getUrl() { return project.options.deployed ? 'https://script.google.com/macros/s/' + project.name + '/exec' : null; },
        isEnabled() { return !!project.options.deployed; },
        enable() {},
        disable() {}
      };
    },
    getOAuthToken() { return project.oauthToken; },
    getIdentityToken() { return 'eyJhbGciOiJSUzI1NiJ9.emulated.' + project.name; },
    getScriptId() { return project.scriptId; },
    getProjectTriggers() { return R.array(project.triggers.map(wrapTrigger)); },
    getUserTriggers() { return R.array(project.triggers.map(wrapTrigger)); },
    newTrigger(handler) {
      if (typeof handler !== 'string' || !handler) throw R.error('Invalid argument: functionName');
      return {
        timeBased() { return clockBuilder(handler); },
        forSpreadsheet(ss) { return sourceBuilder(handler, TRIGGER_SOURCE.SPREADSHEETS, ss && ss.getId ? ss.getId() : ss); },
        forForm(f) { return sourceBuilder(handler, TRIGGER_SOURCE.FORMS, f && f.getId ? f.getId() : f); },
        forDocument(d) { return sourceBuilder(handler, TRIGGER_SOURCE.DOCUMENTS, d && d.getId ? d.getId() : d); }
      };
    },
    deleteTrigger(trigger) {
      const id = trigger && trigger.getUniqueId ? trigger.getUniqueId() : null;
      project.triggers = project.triggers.filter((t) => t.id !== id);
    },
    getAuthorizationInfo() {
      return { getAuthorizationStatus: () => 'NOT_REQUIRED', getAuthorizationUrl: () => null, getAuthorizedScopes: () => R.array([]) };
    },
    requireScopes() {},
    requireAllScopes() {},
    invalidateAuth() { throw R.error('Authorization is required to perform that action.'); }
  };
}

// ---------------------------------------------------------------------------
// Session / ContentService / console / Logger
// ---------------------------------------------------------------------------

function makeSession(env) {
  const account = env.account;
  return {
    getActiveUser() { return { getEmail: () => account.activeUserEmail, toString: () => account.activeUserEmail }; },
    getEffectiveUser() { return { getEmail: () => account.ownerEmail, toString: () => account.ownerEmail }; },
    getScriptTimeZone() { return env.project.timeZone; },
    getTimeZone() { return env.project.timeZone; },
    getActiveUserLocale() { return account.activeUserLocale; },
    getTemporaryActiveUserKey() { return 'emulated-temp-key-' + env.project.name; }
  };
}

const CONTENT_MIME = { ATOM: 'ATOM', CSV: 'CSV', ICAL: 'ICAL', JAVASCRIPT: 'JAVASCRIPT', JSON: 'JSON',
  RSS: 'RSS', TEXT: 'TEXT', VCARD: 'VCARD', XML: 'XML' };
const CONTENT_MIME_HTTP = { ATOM: 'application/atom+xml', CSV: 'text/csv', ICAL: 'text/calendar',
  JAVASCRIPT: 'application/javascript', JSON: 'application/json', RSS: 'application/rss+xml',
  TEXT: 'text/plain', VCARD: 'text/vcard', XML: 'text/xml' };

function makeContentService(env) {
  return {
    MimeType: CONTENT_MIME,
    createTextOutput(content) {
      let text = content === undefined ? '' : String(content);
      let mime = CONTENT_MIME.TEXT;
      let fileName = null;
      const out = {
        getContent() { return text; },
        setContent(c) { text = String(c); return out; },
        append(c) { text += String(c); return out; },
        clear() { text = ''; return out; },
        getMimeType() { return mime; },
        setMimeType(m) {
          if (!CONTENT_MIME[m]) throw env.realm.error('Invalid argument: mimeType');
          mime = m; return out;
        },
        downloadAsFile(name) { fileName = String(name); return out; },
        getFileName() { return fileName; },
        toString() { return 'TextOutput'; },
        _kind: 'TextOutput'
      };
      return out;
    }
  };
}

function formatLogArgs(args) {
  return args.map((a) => {
    if (typeof a === 'string') return a;
    if (a instanceof Error || (a && typeof a === 'object' && typeof a.message === 'string' && typeof a.stack === 'string')) {
      return a.stack || String(a);
    }
    try { return JSON.stringify(a); } catch (e) { return String(a); }
  }).join(' ');
}

function makeConsole(env) {
  const project = env.project;
  function log(level) {
    return function () {
      const message = formatLogArgs(Array.from(arguments));
      project.logs.push({ level, message, fn: env.exec.fn, execution: env.exec.id });
      if (!env.account.quiet) {
        const out = level === 'error' || level === 'warn' ? console.error : console.log;
        out('[' + project.name + ':' + level + '] ' + message);
      }
    };
  }
  return {
    log: log('log'), info: log('info'), warn: log('warn'), error: log('error'), debug: log('debug'),
    time() {}, timeEnd() {}, assert(cond, ...rest) { if (!cond) log('error')('Assertion failed', ...rest); }
  };
}

function makeLogger(env, consoleFacade) {
  const lines = [];
  const logger = {
    log(fmt) {
      const args = Array.from(arguments).slice(1);
      let i = 0;
      const text = typeof fmt === 'string' && args.length
        ? fmt.replace(/%s|%d/g, () => String(args[i++]))
        : formatLogArgs([fmt]);
      lines.push(text);
      consoleFacade.info(text);
      return logger;
    },
    getLog() { return lines.join('\n'); },
    clear() { lines.length = 0; }
  };
  return logger;
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

const DIGEST = { MD2: 'MD2', MD5: 'MD5', SHA_1: 'SHA_1', SHA_256: 'SHA_256', SHA_384: 'SHA_384', SHA_512: 'SHA_512' };
const DIGEST_NODE = { MD5: 'md5', SHA_1: 'sha1', SHA_256: 'sha256', SHA_384: 'sha384', SHA_512: 'sha512' };
const MAC = { HMAC_MD5: 'HMAC_MD5', HMAC_SHA_1: 'HMAC_SHA_1', HMAC_SHA_256: 'HMAC_SHA_256',
  HMAC_SHA_384: 'HMAC_SHA_384', HMAC_SHA_512: 'HMAC_SHA_512' };
const MAC_NODE = { HMAC_MD5: 'md5', HMAC_SHA_1: 'sha1', HMAC_SHA_256: 'sha256', HMAC_SHA_384: 'sha384', HMAC_SHA_512: 'sha512' };
const CHARSET = { US_ASCII: 'US_ASCII', UTF_8: 'UTF_8' };

function typeLabel(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'number[]';
  if (isDateLike(v)) return 'Date';
  if (typeof v === 'string') return 'String';
  if (typeof v === 'number') return 'number';
  if (typeof v === 'boolean') return 'Boolean';
  return 'Object';
}

function parseCsv(text, delimiter) {
  const d = delimiter || ',';
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; } else if (ch === '"') quoted = false; else field += ch;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === d) { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += ch;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function makeUtilities(env) {
  const R = env.realm;

  function signature(method, args) {
    return R.error('The parameters (' + args.map(typeLabel).join(',') + ") don't match the method signature for Utilities." + method + '.');
  }

  function bytesOf(value, charset) {
    if (typeof value === 'string') return Buffer.from(value, encodingFor(charset));
    if (isByteArray(value)) return bytesToBuffer(value);
    return null;
  }

  function mac(alg, method, value, key, charset) {
    const bothStrings = typeof value === 'string' && typeof key === 'string';
    const bothBytes = isByteArray(value) && isByteArray(key);
    if (!bothStrings && !bothBytes) throw signature(method, [value, key]);
    const h = crypto.createHmac(alg, bytesOf(key, charset));
    h.update(bytesOf(value, charset));
    return toSignedArray(R, h.digest());
  }

  function decode(encoded, webSafe, method) {
    const s = String(encoded);
    const bad = webSafe ? /[^A-Za-z0-9\-_=\s]/ : /[^A-Za-z0-9+/=\s]/;
    if (bad.test(s)) throw R.error('Could not decode string.');
    return toSignedArray(R, Buffer.from(s.replace(/\s+/g, ''), webSafe ? 'base64url' : 'base64'));
  }

  function encodeInput(data, charset, method) {
    const b = bytesOf(data, charset);
    if (!b) throw signature(method, [data]);
    return b;
  }

  return {
    Charset: CHARSET,
    DigestAlgorithm: DIGEST,
    MacAlgorithm: MAC,
    RsaAlgorithm: { RSA_SHA_1: 'RSA_SHA_1', RSA_SHA_256: 'RSA_SHA_256' },

    formatDate(date, timeZone, format) {
      env.count('Utilities.formatDate');
      if (!isDateLike(date) || typeof timeZone !== 'string' || typeof format !== 'string') {
        throw signature('formatDate', [date, timeZone, format]);
      }
      if (isNaN(date.getTime())) throw R.error('Invalid argument: date');
      if (!tz.resolveZone(timeZone).valid) {
        env.warn('unknown-timezone', 'Utilities.formatDate got unknown zone "' + timeZone + '"; Java silently uses GMT');
      }
      try {
        return tz.formatDate(date.getTime(), timeZone, format);
      } catch (e) {
        throw R.error(e.message);
      }
    },
    formatString(template) {
      const args = Array.from(arguments).slice(1);
      let i = 0;
      return String(template).replace(/%(%|s|d|(\d*)\.?(\d*)f|0?\d*d)/g, (m) => {
        if (m === '%%') return '%';
        const v = args[i++];
        if (/f$/.test(m)) { const dec = (m.match(/\.(\d+)f/) || [null, '6'])[1]; return Number(v).toFixed(Number(dec)); }
        if (/d$/.test(m)) { const width = (m.match(/%0?(\d+)d/) || [null, '0'])[1]; return String(Math.trunc(Number(v))).padStart(Number(width), m.indexOf('%0') === 0 ? '0' : ' '); }
        return String(v);
      });
    },
    getUuid() { return crypto.randomUUID(); },
    sleep(ms) { env.exec.sleptMs += Number(ms) || 0; },

    computeDigest(algorithm, value, charset) {
      const alg = DIGEST_NODE[algorithm];
      if (!alg) throw R.error('Unsupported digest algorithm in emulator: ' + algorithm);
      const b = bytesOf(value, charset);
      if (!b) throw signature('computeDigest', [algorithm, value]);
      return toSignedArray(R, crypto.createHash(alg).update(b).digest());
    },
    computeHmacSha256Signature(value, key, charset) { return mac('sha256', 'computeHmacSha256Signature', value, key, charset); },
    computeHmacSha1Signature(value, key, charset) { return mac('sha1', 'computeHmacSha1Signature', value, key, charset); },
    computeHmacSignature(algorithm, value, key, charset) {
      const alg = MAC_NODE[algorithm];
      if (!alg) throw R.error('Unsupported MAC algorithm: ' + algorithm);
      return mac(alg, 'computeHmacSignature', value, key, charset);
    },
    computeRsaSha256Signature() { throw R.error('computeRsaSha256Signature is not supported by the emulator.'); },

    base64Encode(data, charset) { return encodeInput(data, charset, 'base64Encode').toString('base64'); },
    base64EncodeWebSafe(data, charset) {
      const b64 = encodeInput(data, charset, 'base64EncodeWebSafe').toString('base64');
      return b64.replace(/\+/g, '-').replace(/\//g, '_');                    // Java keeps the '=' padding
    },
    base64Decode(encoded) { return decode(encoded, false, 'base64Decode'); },
    base64DecodeWebSafe(encoded) { return decode(encoded, true, 'base64DecodeWebSafe'); },

    newBlob(data, contentType, name) {
      return new Blob(env, bufferFrom(env, data), contentType === undefined ? null : contentType,
        name === undefined ? null : name);
    },
    parseCsv(csv, delimiter) {
      return R.import(parseCsv(String(csv), delimiter));
    },
    jsonStringify(obj) { return JSON.stringify(obj); },
    jsonParse(text) { return R.JSON.parse(text); },
    zip() { throw R.error('Utilities.zip is not supported by the emulator.'); },
    unzip() { throw R.error('Utilities.unzip is not supported by the emulator.'); }
  };
}

module.exports = {
  makePropertiesService, makeLockService, makeCacheService, makeMailApp, makeUrlFetchApp, makeHttpResponse,
  makeScriptApp, makeSession, makeContentService, makeConsole, makeLogger, makeUtilities,
  CONTENT_MIME_HTTP, headerLookup, splitRecipients, EMAIL_RE
};
