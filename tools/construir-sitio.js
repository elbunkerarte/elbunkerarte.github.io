#!/usr/bin/env node
/**
 * Builds the public site: site/ -> _site/ with every placeholder resolved.
 *
 *   node tools/construir-sitio.js
 *
 * Why a build step: the pages must be complete WITHOUT JavaScript (search
 * engines, link previews, slow phones), and every public value (dates, legal
 * data, links, the public URL) must live in ONE place: site/config.json.
 *
 * Template syntax (only in .html and .webmanifest files):
 *   {{evento.fecha_texto}}   value from site/config.json
 *   {{calc.bloques_tabla}}   value computed from the config (see computedValues)
 *   {{pagina.url}}           absolute URL of the page being built
 *   {{> header}}             include site/_partials/header.html
 *
 * Rules:
 *   - unknown placeholder or missing key -> the build fails (exit 1) naming it;
 *   - values are escaped for the context they land in (text, attribute,
 *     <title>, <script>, JSON);
 *   - a value starting with "PENDIENTE" renders as a visible
 *     <span class="pendiente">PENDIENTE DE COMPLETAR</span> where HTML is
 *     allowed, and as plain "PENDIENTE DE COMPLETAR" everywhere else;
 *   - if sitio.dominio_propio is set, _site/CNAME is written with it.
 *
 * Zero dependencies on purpose: it runs as-is in GitHub Actions (Node 20).
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'site');
const OUT = path.join(ROOT, '_site');
const CONFIG_FILE = path.join(SRC, 'config.json');
const PARTIALS_DIR = path.join(SRC, '_partials');

const RENDERED_EXTENSIONS = new Set(['.html', '.webmanifest']);
// config.json is the source of truth and is baked into the pages; _partials are
// template fragments. Neither is part of the published site.
const EXCLUDED_NAMES = new Set(['config.json', '_partials', '.DS_Store']);

const PENDING_TEXT = 'PENDIENTE DE COMPLETAR';
const PENDING_HTML = '<span class="pendiente">' + PENDING_TEXT + '</span>';
const PLACEHOLDER = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;
const PARTIAL = /\{\{>\s*([a-zA-Z0-9_-]+)\s*\}\}/g;

class BuildError extends Error {}

// Human names of the escaping contexts, for error messages.
const CONTEXT_NAMES = { text: 'texto', attribute: 'un atributo', rcdata: '<title>', script: '<script>', json: 'JSON' };

// ---------------------------------------------------------------------------
// Config access and computed values
// ---------------------------------------------------------------------------

function readPath(object, dotted) {
  return dotted.split('.').reduce(function (node, key) {
    if (node === null || typeof node !== 'object' || !Object.prototype.hasOwnProperty.call(node, key)) {
      return undefined;
    }
    return node[key];
  }, object);
}

function isPending(value) {
  return typeof value === 'string' && value.trim().toUpperCase().indexOf('PENDIENTE') === 0;
}

/** "15:00" -> 900 */
function parseClock(text, key) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(text).trim());
  if (!match) throw new BuildError('Hora inválida en ' + key + ': "' + text + '" (formato HH:MM, 24 h)');
  return Number(match[1]) * 60 + Number(match[2]);
}

/** 900 -> { clock: "3:00", suffix: "p. m." } (Colombian 12-hour style) */
function clockParts(minutes) {
  const h24 = Math.floor(minutes / 60) % 24;
  const mm = String(minutes % 60).padStart(2, '0');
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return { clock: h12 + ':' + mm, suffix: h24 < 12 ? 'a. m.' : 'p. m.' };
}

function formatClock(minutes) {
  const p = clockParts(minutes);
  return p.clock + ' ' + p.suffix;
}

/** 900, 930 -> "3:00–3:30 p. m." (the suffix is written once when shared) */
function formatRange(start, end) {
  const a = clockParts(start);
  const b = clockParts(end);
  if (a.suffix === b.suffix) return a.clock + '–' + b.clock + ' ' + b.suffix;
  return a.clock + ' ' + a.suffix + ' – ' + b.clock + ' ' + b.suffix;
}

function projectCode(n) {
  return 'B-' + String(n).padStart(3, '0');
}

function requirePositiveInteger(config, key) {
  const value = readPath(config, key);
  if (!Number.isInteger(value) || value <= 0) {
    throw new BuildError('Falta o no es un entero positivo: ' + key);
  }
  return value;
}

/**
 * Values derived from the config so that no time or code range is typed twice.
 * Entries of the form { html } are trusted HTML fragments (only allowed where
 * HTML is allowed); plain strings are escaped like any config value.
 */
function computedValues(config) {
  const start = parseClock(readPath(config, 'evento.bloques_inicio'), 'evento.bloques_inicio');
  const blocks = requirePositiveInteger(config, 'evento.bloques');
  const blockMinutes = requirePositiveInteger(config, 'evento.bloque_min');
  const seats = requirePositiveInteger(config, 'evento.cupos');
  const perBlock = Math.ceil(seats / blocks);

  const rows = [];
  for (let i = 0; i < blocks; i++) {
    const from = start + i * blockMinutes;
    const first = i * perBlock + 1;
    const last = Math.min((i + 1) * perBlock, seats);
    if (first > seats) break;
    rows.push(
      '<tr><td>' + (i + 1) + '</td><td>' + keepTimesTogether(escapeText(formatRange(from, from + blockMinutes))) +
      '</td><td>' + projectCode(first) + ' a ' + projectCode(last) + '</td></tr>'
    );
  }
  const end = start + blocks * blockMinutes;

  const day = String(readPath(config, 'evento.fecha_dia') || '');
  const dateText = String(readPath(config, 'evento.fecha_texto') || '');

  return {
    // "viernes 23 de octubre": weekdays are lower-case inside a Spanish sentence.
    fecha_larga: (day.toLowerCase() + ' ' + dateText).trim(),
    bloques_tabla: { html: rows.join('\n') },
    bloques_hora_inicio: formatClock(start),
    bloques_hora_fin: formatClock(end),
    bloques_por_bloque: String(perBlock),
    codigo_primero: projectCode(1),
    codigo_ultimo: projectCode(seats)
  };
}

// ---------------------------------------------------------------------------
// Escaping per context
// ---------------------------------------------------------------------------

function escapeText(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttribute(value) {
  return escapeText(value).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** Keeps "3:00 p. m." on one line: the clock and its suffix never split. */
function keepTimesTogether(html) {
  return html.replace(/(\d) ([ap])\. m\./g, '$1&nbsp;$2.&nbsp;m.');
}

function escapeScriptString(value) {
  return JSON.stringify(String(value)).slice(1, -1).replace(/</g, '\\u003c');
}

/**
 * Classifies every offset of an HTML template as text, attribute (inside a
 * tag), rcdata (<title>/<textarea>) or script (<script>/<style>). Placeholders
 * are resolved against the TEMPLATE, so config values can never change the
 * context of what follows them.
 */
function htmlContexts(template) {
  const spans = [];
  const token = /<!--[\s\S]*?-->|<\/?([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*>/g;
  let raw = null; // name of the raw-text element we are inside, if any
  let rawStart = 0;
  let match;
  while ((match = token.exec(template)) !== null) {
    const tagName = (match[1] || '').toLowerCase();
    const isClose = match[0].charAt(1) === '/';
    if (raw) {
      if (isClose && tagName === raw) {
        spans.push({ from: rawStart, to: match.index, kind: raw === 'title' || raw === 'textarea' ? 'rcdata' : 'script' });
        raw = null;
      } else {
        continue;
      }
    }
    spans.push({ from: match.index, to: match.index + match[0].length, kind: 'attribute' });
    if (!isClose && ['title', 'textarea', 'script', 'style'].indexOf(tagName) !== -1) {
      raw = tagName;
      rawStart = match.index + match[0].length;
    }
  }
  return function contextAt(offset) {
    for (const s of spans) {
      if (offset >= s.from && offset < s.to) return s.kind;
    }
    return 'text';
  };
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

function expandPartials(template, file, depth) {
  if (depth > 5) throw new BuildError('Inclusión de partials demasiado profunda en ' + file);
  return template.replace(PARTIAL, function (_, name) {
    const partialFile = path.join(PARTIALS_DIR, name + '.html');
    if (!fs.existsSync(partialFile)) {
      throw new BuildError('Partial desconocido "' + name + '" en ' + file);
    }
    return expandPartials(fs.readFileSync(partialFile, 'utf8'), partialFile, depth + 1);
  });
}

function lineOf(text, offset) {
  return text.slice(0, offset).split('\n').length;
}

function resolveValue(key, scope) {
  const root = key.split('.')[0];
  if (root === 'calc') {
    return readPath(scope.calc, key.slice(5));
  }
  if (root === 'pagina') {
    return readPath(scope.page, key.slice(7));
  }
  return readPath(scope.config, key);
}

function renderValue(key, value, context, where) {
  if (value === undefined || value === null) {
    throw new BuildError('Clave inexistente {{' + key + '}} en ' + where);
  }
  if (typeof value === 'object' && !Object.prototype.hasOwnProperty.call(value, 'html')) {
    throw new BuildError('{{' + key + '}} es un objeto, no un valor, en ' + where);
  }
  if (typeof value === 'boolean') {
    throw new BuildError('{{' + key + '}} es booleano y no se imprime en páginas (' + where + ')');
  }
  if (typeof value === 'object') {
    if (context !== 'text') {
      throw new BuildError('{{' + key + '}} produce HTML y sólo puede ir en texto, no en ' + CONTEXT_NAMES[context] + ' (' + where + ')');
    }
    return value.html;
  }

  const pending = isPending(value);
  switch (context) {
    case 'text':
      return pending ? PENDING_HTML : keepTimesTogether(escapeText(value));
    case 'attribute':
      return escapeAttribute(pending ? PENDING_TEXT : value);
    case 'rcdata':
      return escapeText(pending ? PENDING_TEXT : value);
    case 'script':
      return escapeScriptString(pending ? PENDING_TEXT : value);
    case 'json':
      return JSON.stringify(String(pending ? PENDING_TEXT : value)).slice(1, -1);
    default:
      throw new BuildError('Contexto desconocido ' + context);
  }
}

function renderTemplate(template, file, scope) {
  const isHtml = path.extname(file) === '.html';
  const expanded = isHtml ? expandPartials(template, file, 0) : template;
  // Line numbers refer to the page once its partials are inlined.
  const lineNote = expanded !== template ? ' (línea con partials incluidos)' : '';
  const contextAt = isHtml ? htmlContexts(expanded) : function () { return 'json'; };
  const errors = [];
  const rendered = expanded.replace(PLACEHOLDER, function (whole, key, offset) {
    const where = path.relative(ROOT, file) + ':' + lineOf(expanded, offset) + lineNote;
    try {
      return renderValue(key, resolveValue(key, scope), contextAt(offset), where);
    } catch (err) {
      if (!(err instanceof BuildError)) throw err;
      errors.push(err.message);
      return whole;
    }
  });
  if (errors.length) throw new BuildError(errors.join('\n'));
  return rendered;
}

// ---------------------------------------------------------------------------
// File system
// ---------------------------------------------------------------------------

function removeDir(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

function pageUrl(publicUrl, relativeFile) {
  const rel = relativeFile.split(path.sep).join('/');
  if (rel === 'index.html') return publicUrl;
  if (rel.endsWith('/index.html')) return publicUrl + rel.slice(0, -'index.html'.length);
  return publicUrl + rel;
}

function copyTree(fromDir, toDir, scope, stats) {
  fs.mkdirSync(toDir, { recursive: true });
  for (const entry of fs.readdirSync(fromDir, { withFileTypes: true })) {
    if (EXCLUDED_NAMES.has(entry.name) || entry.name.startsWith('.')) continue;
    const from = path.join(fromDir, entry.name);
    const to = path.join(toDir, entry.name);
    if (entry.isDirectory()) {
      copyTree(from, to, scope, stats);
    } else if (RENDERED_EXTENSIONS.has(path.extname(entry.name))) {
      const rel = path.relative(SRC, from);
      const pageScope = Object.assign({}, scope, { page: { url: pageUrl(scope.config.sitio.url_publica, rel) } });
      fs.writeFileSync(to, renderTemplate(fs.readFileSync(from, 'utf8'), from, pageScope));
      stats.rendered.push(rel);
    } else {
      fs.copyFileSync(from, to);
      stats.copied += 1;
    }
  }
}

function findLeftovers(dir) {
  const hits = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      hits.push.apply(hits, findLeftovers(full));
    } else if (RENDERED_EXTENSIONS.has(path.extname(entry.name)) && fs.readFileSync(full, 'utf8').indexOf('{{') !== -1) {
      hits.push(path.relative(ROOT, full));
    }
  }
  return hits;
}

// ---------------------------------------------------------------------------
// Validation of the single source of truth
// ---------------------------------------------------------------------------

function validateConfig(config) {
  const problems = [];
  const publicUrl = readPath(config, 'sitio.url_publica');
  if (typeof publicUrl !== 'string' || !/^https:\/\/[^\s]+\/$/.test(publicUrl)) {
    problems.push('sitio.url_publica debe ser una URL https que termine en "/" (valor: ' + JSON.stringify(publicUrl) + ')');
  }
  const domain = readPath(config, 'sitio.dominio_propio');
  if (typeof domain !== 'string') {
    problems.push('sitio.dominio_propio debe existir (cadena vacía si aún no hay dominio)');
  } else if (domain && !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) {
    problems.push('sitio.dominio_propio no parece un dominio (sin https:// ni rutas): ' + JSON.stringify(domain));
  } else if (domain && typeof publicUrl === 'string' && publicUrl.indexOf('https://' + domain + '/') !== 0) {
    problems.push('sitio.url_publica debe empezar por https://' + domain + '/ cuando hay dominio propio');
  }
  const links = readPath(config, 'enlaces') || {};
  ['inscripcion', 'mi_inscripcion', 'integrantes', 'cambio_horario'].forEach(function (k) {
    if (typeof links[k] !== 'string' || !/^https:\/\//.test(links[k])) {
      problems.push('enlaces.' + k + ' debe ser una URL https');
    }
  });
  if (problems.length) throw new BuildError(problems.join('\n'));
}

function consistencyWarnings(config, calc) {
  const warnings = [];
  const ev = config.evento;
  const endClock = calc.bloques_hora_fin.split(' ')[0];
  if (typeof ev.margen === 'string' && ev.margen.indexOf(endClock) !== 0) {
    warnings.push('evento.margen ("' + ev.margen + '") no empieza a la hora en que terminan los bloques (' + calc.bloques_hora_fin + ')');
  }
  if (ev.cierre !== ev.hora_fin) {
    warnings.push('evento.cierre ("' + ev.cierre + '") distinto de evento.hora_fin ("' + ev.hora_fin + '")');
  }
  if (config.legal && config.legal.datos_verificados !== true) {
    warnings.push('legal.datos_verificados = false: los datos legales se publican como "informados"; verificarlos contra el documento vigente antes del lanzamiento');
  }
  return warnings;
}

// ---------------------------------------------------------------------------

function main() {
  const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  validateConfig(config);
  const calc = computedValues(config);
  const scope = { config: config, calc: calc, page: {} };
  const stats = { rendered: [], copied: 0 };

  removeDir(OUT);
  copyTree(SRC, OUT, scope, stats);

  const domain = config.sitio.dominio_propio.trim();
  if (domain) fs.writeFileSync(path.join(OUT, 'CNAME'), domain + '\n');

  const leftovers = findLeftovers(OUT);
  if (leftovers.length) {
    throw new BuildError('Quedaron "{{" sin resolver en: ' + leftovers.join(', '));
  }

  console.log('Sitio construido en _site/ (' + stats.rendered.length + ' páginas renderizadas, ' + stats.copied + ' archivos copiados)');
  stats.rendered.forEach(function (f) { console.log('  · ' + f); });
  console.log('URL pública: ' + config.sitio.url_publica + (domain ? '  ·  CNAME: ' + domain : '  ·  sin dominio propio (no se escribe CNAME)'));
  consistencyWarnings(config, calc).forEach(function (w) { console.warn('AVISO: ' + w); });
  console.log('Recordatorio: _site/ es un artefacto de build; añádelo a .gitignore si aún no está.');
}

try {
  main();
} catch (err) {
  if (err instanceof BuildError || err instanceof SyntaxError) {
    console.error('ERROR de construcción del sitio:\n' + err.message);
    process.exit(1);
  }
  throw err;
}
