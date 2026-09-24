'use strict';
/**
 * How Google Sheets turns a STRING written by setValue/setValues/appendRow into
 * a typed cell, plus number-format helpers.
 *
 * Sheets stores dates and times as serial numbers (days since 1899-12-30, the
 * fraction being the time of day) in the spreadsheet time zone, and decides
 * whether a number reads back as a Date purely from the cell's number format.
 * The emulator keeps exactly that representation, so side effects such as
 * "clearContent() keeps the date format and the next number reads back as a
 * Date" happen here for the same reason they happen on Google.
 */

const SERIAL_EPOCH = Date.UTC(1899, 11, 30);
const DAY = 86400000;

function serialFromWall(wallMs) { return (wallMs - SERIAL_EPOCH) / DAY; }
function wallFromSerial(serial) { return SERIAL_EPOCH + Math.round(serial * DAY); }

function validYmd(y, m, d) {
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

function validHms(h, mi, s, ampm) {
  if (mi > 59 || s > 59) return false;
  if (ampm) return h >= 1 && h <= 12;
  return h >= 0 && h <= 23;
}

function to24h(h, ampm) {
  if (!ampm) return h;
  const pm = /^p/i.test(ampm);
  if (h === 12) return pm ? 12 : 0;
  return pm ? h + 12 : h;
}

const NUMBER_RE = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/;
const THOUSANDS_RE = /^[+-]?\d{1,3}(,\d{3})+(\.\d+)?$/;
const PERCENT_RE = /^([+-]?(\d+\.?\d*|\.\d+))%$/;
const TIME_PART = '(\\d{1,2}):(\\d{2})(?::(\\d{2})(?:\\.(\\d{1,3}))?)?(?:\\s*([AaPp][Mm]))?';
const ISO_DATE_RE = new RegExp('^(\\d{4})([-/])(\\d{1,2})\\2(\\d{1,2})(?:\\s+' + TIME_PART + ')?$');
const LOCAL_DATE_RE = new RegExp('^(\\d{1,2})/(\\d{1,2})/(\\d{4})(?:\\s+' + TIME_PART + ')?$');
const TIME_RE = new RegExp('^' + TIME_PART + '$');

/** Default number formats Sheets applies when it recognises a date/time. */
const AUTO_FORMAT = {
  isoDate: 'yyyy-mm-dd',
  isoDateTime: 'yyyy-mm-dd h:mm:ss',
  localDate: 'm/d/yyyy',
  localDateTime: 'm/d/yyyy h:mm:ss',
  time: 'h:mm:ss',
  time12: 'h:mm:ss am/pm',
  dateObject: 'm/d/yyyy h:mm:ss'
};

function timeFraction(h, mi, s, ms) {
  return ((h * 60 + mi) * 60 + s) * 1000 + (ms || 0);
}

function msFromDigits(txt) {
  if (!txt) return 0;
  return Math.round(Number('0.' + txt) * 1000);
}

/**
 * Parses a string exactly where Sheets would (a cell whose format is not '@').
 * Returns { kind, value, format?, formula?, wall? }:
 *   kind 'text' | 'number' | 'boolean' | 'date' | 'formula'
 *   for 'date', `wall` is the wall-clock ms (fields read as UTC) in the sheet zone.
 */
function parseUserEntry(s, locale) {
  if (s === '') return { kind: 'text', value: '' };
  if (s[0] === "'") return { kind: 'text', value: s.slice(1) };
  if (s[0] === '=' && s.length > 1) return { kind: 'formula', formula: s, value: '#NAME?' };
  if (/^(true|false)$/i.test(s)) return { kind: 'boolean', value: s.toLowerCase() === 'true' };
  if (NUMBER_RE.test(s)) return { kind: 'number', value: Number(s) };
  if (THOUSANDS_RE.test(s)) {
    return { kind: 'number', value: Number(s.replace(/,/g, '')), format: s.indexOf('.') >= 0 ? '#,##0.00' : '#,##0' };
  }
  const pct = s.match(PERCENT_RE);
  if (pct) return { kind: 'number', value: Number(pct[1]) / 100, format: pct[1].indexOf('.') >= 0 ? '0.00%' : '0%' };

  let m = s.match(ISO_DATE_RE);
  if (m) {
    const y = +m[1], mo = +m[3], d = +m[4];
    if (validYmd(y, mo, d)) {
      if (m[5] === undefined) return { kind: 'date', wall: Date.UTC(y, mo - 1, d), format: AUTO_FORMAT.isoDate };
      const h = +m[5], mi = +m[6], sec = +(m[7] || 0), ap = m[9];
      if (validHms(h, mi, sec, ap)) {
        return { kind: 'date', wall: Date.UTC(y, mo - 1, d) + timeFraction(to24h(h, ap), mi, sec, msFromDigits(m[8])),
                 format: AUTO_FORMAT.isoDateTime };
      }
    }
    return { kind: 'text', value: s };
  }

  m = s.match(LOCAL_DATE_RE);
  if (m) {
    const dayFirst = /^es|^pt|^fr|^it|^de/i.test(locale || '');
    const mo = dayFirst ? +m[2] : +m[1];
    const d = dayFirst ? +m[1] : +m[2];
    const y = +m[3];
    if (validYmd(y, mo, d)) {
      if (m[4] === undefined) return { kind: 'date', wall: Date.UTC(y, mo - 1, d), format: AUTO_FORMAT.localDate };
      const h = +m[4], mi = +m[5], sec = +(m[6] || 0), ap = m[8];
      if (validHms(h, mi, sec, ap)) {
        return { kind: 'date', wall: Date.UTC(y, mo - 1, d) + timeFraction(to24h(h, ap), mi, sec, msFromDigits(m[7])),
                 format: AUTO_FORMAT.localDateTime };
      }
    }
    return { kind: 'text', value: s };
  }

  m = s.match(TIME_RE);
  if (m) {
    const h = +m[1], mi = +m[2], sec = +(m[3] || 0), ap = m[5];
    if (validHms(h, mi, sec, ap)) {
      return { kind: 'date', wall: SERIAL_EPOCH + timeFraction(to24h(h, ap), mi, sec, msFromDigits(m[4])),
               format: ap ? AUTO_FORMAT.time12 : AUTO_FORMAT.time };
    }
    return { kind: 'text', value: s };
  }

  // A leading + or - that is not a number is parsed as a formula and fails:
  // "+57 301 234 5678" shows #ERROR! (Formula parse error) on Google Sheets.
  if ((s[0] === '+' || s[0] === '-') && s.length > 1) {
    return { kind: 'formula', formula: '=' + s, value: '#ERROR!' };
  }
  return { kind: 'text', value: s };
}

// ---------------------------------------------------------------------------
// Number formats
// ---------------------------------------------------------------------------

function stripFormatNoise(fmt) {
  return String(fmt)
    .replace(/"[^"]*"/g, '')
    .replace(/\\./g, '')
    .replace(/\[(h+|m+|s+)\]/gi, 'h')
    .replace(/\[[^\]]*\]/g, '');
}

function isPlainTextFormat(fmt) { return fmt === '@'; }

function isGeneralFormat(fmt) {
  return fmt === null || fmt === undefined || fmt === '' || /^general$/i.test(String(fmt));
}

/** True when a numeric cell with this format reads back as a Date. */
function isDateTimeFormat(fmt) {
  if (isGeneralFormat(fmt) || isPlainTextFormat(fmt)) return false;
  const core = stripFormatNoise(fmt).split(';')[0];
  return /[dmyhs]/i.test(core);
}

// ---------------------------------------------------------------------------
// Display values (getDisplayValue/getDisplayValues), best effort
// ---------------------------------------------------------------------------

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function pad2(n) { return (n < 10 ? '0' : '') + n; }

function tokenizeSheetsDateFormat(fmt) {
  const tokens = [];
  const src = String(fmt);
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === '"') {
      const j = src.indexOf('"', i + 1);
      tokens.push({ lit: src.slice(i + 1, j < 0 ? src.length : j) });
      i = j < 0 ? src.length : j + 1;
      continue;
    }
    if (ch === '\\') { tokens.push({ lit: src[i + 1] || '' }); i += 2; continue; }
    const rest = src.slice(i);
    const ampm = rest.match(/^(am\/pm|a\/p)/i);
    if (ampm) { tokens.push({ ampm: ampm[1].length > 3 }); i += ampm[1].length; continue; }
    const run = rest.match(/^(y+|m+|d+|h+|s+)/i);
    if (run) { tokens.push({ t: run[1][0].toLowerCase(), n: run[1].length }); i += run[1].length; continue; }
    const frac = rest.match(/^\.(0+)/);
    if (frac) { tokens.push({ frac: frac[1].length }); i += frac[0].length; continue; }
    tokens.push({ lit: ch });
    i++;
  }
  // "m" means minutes right after an hour or right before seconds.
  for (let k = 0; k < tokens.length; k++) {
    if (tokens[k].t !== 'm') continue;
    const prev = tokens.slice(0, k).reverse().find((x) => x.t);
    const next = tokens.slice(k + 1).find((x) => x.t);
    if ((prev && prev.t === 'h') || (next && next.t === 's')) tokens[k].t = 'min';
  }
  return tokens;
}

function formatSerialAsDate(serial, fmt) {
  const w = new Date(wallFromSerial(serial));
  const tokens = tokenizeSheetsDateFormat(fmt);
  const twelve = tokens.some((x) => x.ampm !== undefined);
  let out = '';
  for (const tk of tokens) {
    if (tk.lit !== undefined) { out += tk.lit; continue; }
    if (tk.ampm !== undefined) { out += w.getUTCHours() < 12 ? (tk.ampm ? 'AM' : 'A') : (tk.ampm ? 'PM' : 'P'); continue; }
    if (tk.frac !== undefined) {
      out += '.' + String(w.getUTCMilliseconds()).padStart(3, '0').slice(0, tk.frac);
      continue;
    }
    const n = tk.n;
    switch (tk.t) {
      case 'y': out += n <= 2 ? pad2(w.getUTCFullYear() % 100) : String(w.getUTCFullYear()); break;
      case 'm':
        if (n >= 4) out += MONTHS[w.getUTCMonth()];
        else if (n === 3) out += MONTHS[w.getUTCMonth()].slice(0, 3);
        else out += n === 2 ? pad2(w.getUTCMonth() + 1) : String(w.getUTCMonth() + 1);
        break;
      case 'd':
        if (n >= 4) out += DAYS[w.getUTCDay()];
        else if (n === 3) out += DAYS[w.getUTCDay()].slice(0, 3);
        else out += n === 2 ? pad2(w.getUTCDate()) : String(w.getUTCDate());
        break;
      case 'h': {
        let h = w.getUTCHours();
        if (twelve) h = h % 12 === 0 ? 12 : h % 12;
        out += n >= 2 ? pad2(h) : String(h);
        break;
      }
      case 'min': out += n >= 2 ? pad2(w.getUTCMinutes()) : String(w.getUTCMinutes()); break;
      case 's': out += n >= 2 ? pad2(w.getUTCSeconds()) : String(w.getUTCSeconds()); break;
      default: break;
    }
  }
  return out;
}

function formatGeneralNumber(n) {
  if (Number.isInteger(n) && Math.abs(n) < 1e15) return String(n);
  if (Math.abs(n) >= 1e15) return n.toExponential(5).replace('e', 'E').replace(/E\+?/, (m) => (m === 'E' ? 'E+' : m));
  return String(Number(n.toPrecision(10)));
}

function formatNumber(n, fmt) {
  const core = String(fmt).split(';')[0];
  const pct = /%/.test(core);
  const v = pct ? n * 100 : n;
  const decimals = (core.match(/\.(0+)/) || [null, ''])[1].length;
  const grouped = /#,##0|0,000/.test(core);
  let s = v.toFixed(decimals);
  if (grouped) {
    const parts = s.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    s = parts.join('.');
  }
  return s + (pct ? '%' : '');
}

/** What the cell shows on screen. */
function displayValue(cell) {
  if (!cell) return '';
  const v = cell.v;
  if (v === '' || v === null || v === undefined) return '';
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  if (typeof v === 'string') return v;
  if (typeof v === 'number') {
    if (isDateTimeFormat(cell.fmt)) return formatSerialAsDate(v, cell.fmt);
    if (isGeneralFormat(cell.fmt) || isPlainTextFormat(cell.fmt)) return formatGeneralNumber(v);
    if (/[0#]/.test(cell.fmt)) return formatNumber(v, cell.fmt);
    return formatGeneralNumber(v);
  }
  return String(v);
}

module.exports = {
  SERIAL_EPOCH, DAY, AUTO_FORMAT,
  serialFromWall, wallFromSerial, parseUserEntry,
  isDateTimeFormat, isGeneralFormat, isPlainTextFormat, displayValue, formatSerialAsDate
};
