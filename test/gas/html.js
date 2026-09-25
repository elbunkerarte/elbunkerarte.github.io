'use strict';
/**
 * HtmlService emulator: HtmlOutput plus the scriptlet template engine.
 *
 *   <?  code  ?>   statements (may open a block in one scriptlet and close it in another)
 *   <?= expr  ?>   printed with CONTEXTUAL escaping
 *   <?!= expr ?>   printed raw
 *
 * Contextual escaping mirrors what Google does: HTML-escaped in markup,
 * JS-string-escaped inside a quoted string in a <script>, emitted as a JSON
 * literal in bare script code, and a URL attribute value (src, href...) that is
 * not http(s)/mailto/ftp/relative becomes '#ZautoescZ'. The context is decided at compile time from the
 * template's static text, like Google's compiler does.
 *
 * Templates are compiled into the project's realm, so project globals (such as
 * `incluir`) resolve from scriptlets. Compile and runtime errors name the
 * template - on Google they surface only when a user opens the page.
 */
const vm = require('vm');
const { Blob } = require('./blob');

const ALLOWED_META = ['apple-mobile-web-app-capable', 'apple-mobile-web-app-status-bar-style',
  'apple-mobile-web-app-title', 'google-site-verification', 'mobile-web-app-capable', 'viewport'];
const XFRAME = { ALLOWALL: 'ALLOWALL', DEFAULT: 'DEFAULT' };
const SANDBOX = { EMULATED: 'EMULATED', IFRAME: 'IFRAME', NATIVE: 'NATIVE' };

// ---------------------------------------------------------------------------
// Escapers
// ---------------------------------------------------------------------------

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&#34;').replace(/'/g, '&#39;');
}

function escapeJsString(s) {
  return s.replace(/[\\'"<>&=\n\r\u2028\u2029\t]/g, (ch) => {
    switch (ch) {
      case '\n': return '\\n';
      case '\r': return '\\r';
      case '\t': return '\\t';
      case '\\': return '\\\\';
      default: return '\\x' + ch.charCodeAt(0).toString(16).padStart(2, '0');
    }
  }).replace(/[\u2028\u2029]/g, (ch) => '\\u' + ch.charCodeAt(0).toString(16));
}

function jsLiteral(v) {
  const json = JSON.stringify(v === undefined ? null : v);
  return (json === undefined ? 'null' : json).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}

// ---------------------------------------------------------------------------
// Compile-time context tracking over the template's static text
// ---------------------------------------------------------------------------

const REGEX_PRECEDERS = '(,=:[!&|?{};+-*%~^<>';

// Measured on a live web app (2026-09-25): <?= ?> inside src/href replaces any URL whose scheme is
// not http, https, mailto or ftp - a data: image included - with this marker. Relative URLs pass.
const SAFE_URL = /^(?:(?:https?|mailto|ftp):|[^&:\/?#]*(?:[\/?#]|$))/i;
const UNSAFE_URL_MARKER = '#ZautoescZ';

class ContextTracker {
  constructor() {
    this.mode = 'html';          // html | tag-script | tag-style | script | style
    this.js = 'code';            // code | sq | dq | tpl | line | block | regex | regex-class
    this.lastSignificant = '';
    this.htmlTail = '';          // recent markup, to tell a URL attribute value from plain markup
  }

  feed(text) {
    let i = 0;
    while (i < text.length) {
      const ch = text[i];
      if (this.mode === 'html') {
        this.htmlTail = (this.htmlTail + ch).slice(-40);
        const rest = text.slice(i, i + 7).toLowerCase();
        if (rest.startsWith('<script') && /[\s>]/.test(text[i + 7] || ' ')) { this.mode = 'tag-script'; i += 7; continue; }
        if (rest.startsWith('<style') && /[\s>]/.test(text[i + 6] || ' ')) { this.mode = 'tag-style'; i += 6; continue; }
        i++;
        continue;
      }
      if (this.mode === 'tag-script' || this.mode === 'tag-style') {
        if (ch === '>') {
          this.mode = this.mode === 'tag-script' ? 'script' : 'style';
          this.js = 'code';
          this.lastSignificant = '';
        }
        i++;
        continue;
      }
      if (this.mode === 'style') {
        if (text.slice(i, i + 7).toLowerCase() === '</style') { this.mode = 'html'; i += 7; continue; }
        i++;
        continue;
      }
      // script
      if (text.slice(i, i + 8).toLowerCase() === '</script') { this.mode = 'html'; this.js = 'code'; i += 8; continue; }
      switch (this.js) {
        case 'code':
          if (ch === "'") this.js = 'sq';
          else if (ch === '"') this.js = 'dq';
          else if (ch === '`') this.js = 'tpl';
          else if (ch === '/' && text[i + 1] === '/') { this.js = 'line'; i++; }
          else if (ch === '/' && text[i + 1] === '*') { this.js = 'block'; i++; }
          else if (ch === '/' && (this.lastSignificant === '' || REGEX_PRECEDERS.indexOf(this.lastSignificant) !== -1)) this.js = 'regex';
          if (!/\s/.test(ch)) this.lastSignificant = ch;
          break;
        case 'sq': case 'dq': case 'tpl': {
          const quote = this.js === 'sq' ? "'" : this.js === 'dq' ? '"' : '`';
          if (ch === '\\') { i++; break; }
          if (ch === quote) { this.js = 'code'; this.lastSignificant = ch; }
          else if (ch === '\n' && quote !== '`') this.js = 'code';
          break;
        }
        case 'line': if (ch === '\n') this.js = 'code'; break;
        case 'block': if (ch === '*' && text[i + 1] === '/') { this.js = 'code'; i++; } break;
        case 'regex':
          if (ch === '\\') { i++; break; }
          if (ch === '[') this.js = 'regex-class';
          else if (ch === '/') { this.js = 'code'; this.lastSignificant = 'a'; }
          else if (ch === '\n') this.js = 'code';
          break;
        case 'regex-class':
          if (ch === '\\') { i++; break; }
          if (ch === ']') this.js = 'regex';
          break;
        default: break;
      }
      i++;
    }
  }

  current() {
    if (this.mode === 'script') {
      if (this.js === 'sq' || this.js === 'dq' || this.js === 'tpl') return 'js-string';
      if (this.js === 'code') return 'js-code';
      return 'js-string';
    }
    if (/\b(?:src|href|action|formaction|poster)\s*=\s*["']?$/i.test(this.htmlTail)) return 'url';
    return 'html';
  }
}

/** Splits a template into text and scriptlet chunks, annotating each print with its context. */
function parseTemplate(source) {
  const chunks = [];
  const tracker = new ContextTracker();
  let i = 0;
  while (i < source.length) {
    const open = source.indexOf('<?', i);
    if (open === -1) { chunks.push({ type: 'text', text: source.slice(i) }); break; }
    if (open > i) {
      const text = source.slice(i, open);
      chunks.push({ type: 'text', text });
      tracker.feed(text);
    }
    const close = source.indexOf('?>', open + 2);
    if (close === -1) {
      const line = source.slice(0, open).split('\n').length;
      const err = new SyntaxError('Unterminated scriptlet "<?" starting at line ' + line);
      throw err;
    }
    let inner = source.slice(open + 2, close);
    let type = 'code';
    if (inner.startsWith('!=')) { type = 'raw'; inner = inner.slice(2); }
    else if (inner.startsWith('=')) { type = 'print'; inner = inner.slice(1); }
    const line = source.slice(0, open).split('\n').length;
    chunks.push({ type, code: inner, context: tracker.current(), line });
    i = close + 2;
  }
  return chunks;
}

function generateCode(chunks) {
  const body = chunks.map((c) => {
    if (c.type === 'text') return '__raw(' + JSON.stringify(c.text) + ');';
    const expr = c.code.trim().replace(/;+\s*$/, '');
    if (c.type === 'raw') return '__raw(' + expr + '\n);';
    if (c.type === 'print') return '__print(' + expr + '\n, ' + JSON.stringify(c.context) + ', ' + c.line + ');';
    return c.code + '\n';
  }).join('\n');
  return '(function (__scope, output, __raw, __print) {\nwith (__scope) {\n' + body + '\n}\n})';
}

// ---------------------------------------------------------------------------
// HtmlOutput
// ---------------------------------------------------------------------------

class HtmlOutput {
  constructor(env, content) {
    Object.defineProperty(this, '_env', { value: env });
    this._content = content === undefined || content === null ? '' : String(content);
    this._title = '';
    this._meta = [];
    this._xframe = XFRAME.DEFAULT;
    this._sandbox = SANDBOX.IFRAME;
    this._favicon = null;
    this._width = null;
    this._height = null;
    this._kind = 'HtmlOutput';
  }
  getContent() { return this._content; }
  setContent(c) { this._content = String(c); return this; }
  append(c) { this._content += String(c); return this; }
  appendUntrusted(c) { this._content += escapeHtml(String(c)); return this; }
  clear() { this._content = ''; return this; }
  setTitle(t) { this._title = String(t); return this; }
  getTitle() { return this._title; }
  addMetaTag(name, content) {
    if (ALLOWED_META.indexOf(String(name)) === -1) {
      throw this._env.realm.error('Meta tag "' + name + '" is not allowed. Allowed: ' + ALLOWED_META.join(', ') + '.');
    }
    this._meta.push({ name: String(name), content: String(content) });
    return this;
  }
  getMetaTags() {
    return this._env.realm.array(this._meta.map((m) => ({ getName: () => m.name, getContent: () => m.content })));
  }
  setXFrameOptionsMode(mode) { this._xframe = mode; return this; }
  setSandboxMode(mode) { this._sandbox = mode; return this; }
  setFaviconUrl(url) {
    if (!/^https:\/\//.test(String(url))) throw this._env.realm.error('Invalid argument: favicon URL must be https.');
    this._favicon = String(url);
    return this;
  }
  getFaviconUrl() { return this._favicon; }
  setWidth(w) { this._width = w; return this; }
  getWidth() { return this._width; }
  setHeight(h) { this._height = h; return this; }
  getHeight() { return this._height; }
  asTemplate() { return new HtmlTemplate(this._env, this._content, null); }
  getBlob() { return new Blob(this._env, Buffer.from(this._content, 'utf8'), 'text/html', null); }
  getAs(ct) { return this.getBlob().getAs(ct); }
  toString() { return 'HtmlOutput'; }
}

// ---------------------------------------------------------------------------
// HtmlTemplate
// ---------------------------------------------------------------------------

class HtmlTemplate {
  constructor(env, source, name) {
    Object.defineProperty(this, '_env', { value: env });
    Object.defineProperty(this, '_source', { value: String(source) });
    Object.defineProperty(this, '_name', { value: name || env.project.templateNameFor(String(source)) || '<inline template>' });
  }

  getRawContent() { return this._source; }

  getCode() {
    return generateCode(parseTemplate(this._source));
  }

  getCodeWithComments() { return this.getCode(); }

  evaluate() {
    const env = this._env;
    const R = env.realm;
    const name = this._name;
    env.count('HtmlTemplate.evaluate');

    let fn;
    try {
      const script = env.project.compileTemplate(this._source, name, () => generateCode(parseTemplate(this._source)));
      fn = script.runInContext(env.realm.ctx);
    } catch (e) {
      throw R.error('Template "' + name + '" failed to compile: ' + (e && e.name ? e.name + ': ' : '') + (e && e.message), 'SyntaxError');
    }

    const scope = R.Object.create(null);
    for (const k of Object.keys(this)) scope[k] = this[k];

    const out = new HtmlOutput(env, '');
    const outputApi = {
      append(s) { out.append(s); return outputApi; },
      appendUntrusted(s) { out.appendUntrusted(s); return outputApi; },
      clear() { out.clear(); return outputApi; },
      getContent() { return out.getContent(); }
    };
    const raw = (v) => { out.append(v === undefined || v === null ? '' : v); };
    const print = (v, context, line) => {
      if (v === undefined || v === null) {
        env.warn('template-printed-' + v, 'Template "' + name + '" printed ' + v + ' at line ' + line);
      }
      if (context === 'js-code') { out.append(jsLiteral(v)); return; }
      const s = String(v);
      if (context === 'url') { out.append(SAFE_URL.test(s) ? escapeHtml(s) : UNSAFE_URL_MARKER); return; }
      out.append(context === 'js-string' ? escapeJsString(s) : escapeHtml(s));
    };

    try {
      fn(scope, outputApi, raw, print);
    } catch (e) {
      throw R.error('Template "' + name + '" failed at runtime: ' + (e && e.name ? e.name + ': ' : '') + (e && e.message),
        e && e.name ? e.name : 'Error');
    }

    const content = out.getContent();
    if (/<\?(=|!=|\s)/.test(content)) {
      env.warn('unevaluated-scriptlet', 'Output of template "' + name + '" still contains a scriptlet ' +
        '(an included file is inserted raw and never evaluated)');
    }
    return out;
  }

  toString() { return 'HtmlTemplate'; }
}

function makeHtmlService(env) {
  const R = env.realm;
  function fileOrThrow(name) {
    const content = env.project.htmlFiles.get(String(name).replace(/\.html$/, ''));
    if (content === undefined) throw R.error('No HTML file named ' + name + ' was found.');
    return content;
  }
  return {
    XFrameOptionsMode: XFRAME,
    SandboxMode: SANDBOX,
    createTemplate(source) {
      const text = source && typeof source.getDataAsString === 'function' ? source.getDataAsString()
        : source && typeof source.getContent === 'function' ? source.getContent() : source;
      return new HtmlTemplate(env, text === undefined ? '' : text, null);
    },
    createTemplateFromFile(name) { return new HtmlTemplate(env, fileOrThrow(name), String(name)); },
    createHtmlOutput(source) {
      const text = source && typeof source.getDataAsString === 'function' ? source.getDataAsString() : source;
      return new HtmlOutput(env, text);
    },
    createHtmlOutputFromFile(name) { return new HtmlOutput(env, fileOrThrow(name)); },
    getUserAgent() { return 'Mozilla/5.0 (emulated)'; }
  };
}

module.exports = { makeHtmlService, HtmlOutput, HtmlTemplate, parseTemplate, generateCode, escapeHtml, escapeJsString };
