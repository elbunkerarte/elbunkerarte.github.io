'use strict';
/**
 * Time-zone arithmetic and Java SimpleDateFormat-style formatting.
 *
 * Apps Script runs on Java, whose time-zone data is the IANA database. Node's
 * ICU ships the same database, so historic offsets match too: 1899-12-30 in
 * America/Bogota uses Local Mean Time (-4:56:16) on both sides. That detail is
 * what makes Sheets "time-only" values (1899-12-30 HH:mm) round-trip exactly.
 */

const HOUR = 3600000;
const FIXED_OFFSET = /^(?:GMT|UTC)?([+-])(\d{1,2})(?::?(\d{2}))?$/i;

const zoneCache = new Map();

/**
 * Resolves a zone id the way Java's TimeZone.getTimeZone does: unknown ids
 * silently become GMT. Returns { id, fixedOffsetMs|null, valid }.
 */
function resolveZone(tz) {
  const key = String(tz);
  if (zoneCache.has(key)) return zoneCache.get(key);

  let zone;
  const trimmed = key.trim();
  if (/^(GMT|UTC|Z|Etc\/UTC|Etc\/GMT)$/i.test(trimmed)) {
    zone = { id: trimmed.toUpperCase() === 'Z' ? 'UTC' : trimmed, fixedOffsetMs: 0, valid: true };
  } else {
    const m = trimmed.match(FIXED_OFFSET);
    if (m && /^(GMT|UTC)/i.test(trimmed)) {
      const sign = m[1] === '-' ? -1 : 1;
      const offset = sign * (Number(m[2]) * HOUR + Number(m[3] || 0) * 60000);
      zone = { id: trimmed, fixedOffsetMs: offset, valid: true };
    } else {
      try {
        new Intl.DateTimeFormat('en-US', { timeZone: trimmed });
        zone = { id: trimmed, fixedOffsetMs: null, valid: true };
      } catch (e) {
        zone = { id: 'GMT', fixedOffsetMs: 0, valid: false };
      }
    }
  }
  zoneCache.set(key, zone);
  return zone;
}

const formatterCache = new Map();
function partsFormatter(zoneId) {
  let f = formatterCache.get(zoneId);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: zoneId, hourCycle: 'h23', era: 'short',
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric'
    });
    formatterCache.set(zoneId, f);
  }
  return f;
}

function rawOffset(zoneId, utcMs) {
  const whole = Math.floor(utcMs / 1000) * 1000;
  const parts = partsFormatter(zoneId).formatToParts(new Date(whole));
  const get = (type) => parts.find((p) => p.type === type).value;
  let year = Number(get('year'));
  if (get('era') === 'BC') year = 1 - year;
  const wall = Date.UTC(year, Number(get('month')) - 1, Number(get('day')),
    Number(get('hour')), Number(get('minute')), Number(get('second')));
  // Date.UTC maps years 0..99 to 1900..1999; correct for that edge.
  const fixed = new Date(wall);
  if (year >= 0 && year < 100) fixed.setUTCFullYear(year);
  return fixed.getTime() - whole;
}

const offsetMemo = new Map();

/** Offset (ms, added to UTC to get wall clock) of `tz` at the instant `utcMs`. */
function offsetAt(tz, utcMs) {
  const zone = resolveZone(tz);
  if (zone.fixedOffsetMs !== null) return zone.fixedOffsetMs;
  const bucket = Math.floor(utcMs / HOUR);
  const key = zone.id + '|' + bucket;
  const memo = offsetMemo.get(key);
  if (memo !== undefined) return memo;
  const start = rawOffset(zone.id, bucket * HOUR);
  const end = rawOffset(zone.id, bucket * HOUR + HOUR - 1000);
  if (start === end) {
    if (offsetMemo.size > 200000) offsetMemo.clear();
    offsetMemo.set(key, start);
    return start;
  }
  return rawOffset(zone.id, utcMs);                       // transition inside this hour
}

/** Wall-clock milliseconds (fields read as if UTC) for an instant in `tz`. */
function utcToWall(tz, utcMs) {
  return utcMs + offsetAt(tz, utcMs);
}

/** Instant for a wall-clock reading in `tz` (earliest instant on overlaps). */
function wallToUtc(tz, wallMs) {
  const first = offsetAt(tz, wallMs);
  let utc = wallMs - first;
  const second = offsetAt(tz, utc);
  if (second !== first) utc = wallMs - second;
  return utc;
}

// ---------------------------------------------------------------------------
// Java SimpleDateFormat subset
// ---------------------------------------------------------------------------

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_ZONE_NAMES = { 'America/Bogota': 'COT', UTC: 'UTC', GMT: 'GMT', 'Etc/UTC': 'UTC' };
const LONG_ZONE_NAMES = { 'America/Bogota': 'Colombia Time', UTC: 'Coordinated Universal Time', GMT: 'Greenwich Mean Time' };

function pad(n, width) {
  let s = String(Math.abs(n));
  while (s.length < width) s = '0' + s;
  return (n < 0 ? '-' : '') + s;
}

function offsetText(offsetMs, style, count) {
  const sign = offsetMs < 0 ? '-' : '+';
  const abs = Math.abs(Math.round(offsetMs / 60000));
  const hh = pad(Math.floor(abs / 60), 2);
  const mm = pad(abs % 60, 2);
  if (style === 'Z') return sign + hh + mm;
  // 'X' (ISO 8601)
  if (offsetMs === 0) return 'Z';
  if (count === 1) return sign + hh + (mm !== '00' ? mm : '');
  if (count === 2) return sign + hh + mm;
  return sign + hh + ':' + mm;
}

/** Splits a SimpleDateFormat pattern into [{letter,count}|{literal}] tokens. */
function tokenize(pattern) {
  const tokens = [];
  let i = 0;
  while (i < pattern.length) {
    const ch = pattern[i];
    if (ch === "'") {
      if (pattern[i + 1] === "'") { tokens.push({ literal: "'" }); i += 2; continue; }
      let j = i + 1;
      let text = '';
      while (j < pattern.length) {
        if (pattern[j] === "'") {
          if (pattern[j + 1] === "'") { text += "'"; j += 2; continue; }
          break;
        }
        text += pattern[j++];
      }
      if (j >= pattern.length) throw new Error('Unterminated quote in date pattern: ' + pattern);
      tokens.push({ literal: text });
      i = j + 1;
      continue;
    }
    if (/[A-Za-z]/.test(ch)) {
      let j = i;
      while (j < pattern.length && pattern[j] === ch) j++;
      tokens.push({ letter: ch, count: j - i });
      i = j;
      continue;
    }
    tokens.push({ literal: ch });
    i++;
  }
  return tokens;
}

const KNOWN_LETTERS = 'GyYMLwWDdFEuaHkKhmsSzZX';

/**
 * Formats an instant like java.text.SimpleDateFormat in the given zone.
 * Unknown pattern letters throw, exactly like Java ("Illegal pattern character").
 */
function formatDate(utcMs, tz, pattern) {
  const zone = resolveZone(tz);
  const offset = offsetAt(tz, utcMs);
  const wall = new Date(utcMs + offset);
  const f = {
    y: wall.getUTCFullYear(), M: wall.getUTCMonth(), d: wall.getUTCDate(),
    H: wall.getUTCHours(), m: wall.getUTCMinutes(), s: wall.getUTCSeconds(),
    S: wall.getUTCMilliseconds(), E: wall.getUTCDay()
  };
  let out = '';
  for (const t of tokenize(String(pattern))) {
    if (t.literal !== undefined) { out += t.literal; continue; }
    const c = t.count;
    if (KNOWN_LETTERS.indexOf(t.letter) === -1) {
      throw new Error("Illegal pattern character '" + t.letter + "'");
    }
    switch (t.letter) {
      case 'G': out += f.y > 0 ? 'AD' : 'BC'; break;
      case 'y': case 'Y': case 'u':
        if (t.letter === 'u') { out += pad(f.E === 0 ? 7 : f.E, c); break; }
        out += c === 2 ? pad(f.y % 100, 2) : pad(f.y, c); break;
      case 'M': case 'L':
        if (c >= 4) out += MONTHS[f.M];
        else if (c === 3) out += MONTHS[f.M].slice(0, 3);
        else out += pad(f.M + 1, c);
        break;
      case 'd': out += pad(f.d, c); break;
      case 'D': {
        const start = Date.UTC(f.y, 0, 1);
        out += pad(Math.floor((Date.UTC(f.y, f.M, f.d) - start) / 86400000) + 1, c);
        break;
      }
      case 'E': out += c >= 4 ? DAYS[f.E] : DAYS[f.E].slice(0, 3); break;
      case 'F': out += pad(Math.floor((f.d - 1) / 7) + 1, c); break;
      case 'w': case 'W': {
        const jan1 = new Date(Date.UTC(f.y, 0, 1)).getUTCDay();
        const dayOfYear = Math.floor((Date.UTC(f.y, f.M, f.d) - Date.UTC(f.y, 0, 1)) / 86400000);
        const week = t.letter === 'w'
          ? Math.floor((dayOfYear + jan1) / 7) + 1
          : Math.floor((f.d - 1 + new Date(Date.UTC(f.y, f.M, 1)).getUTCDay()) / 7) + 1;
        out += pad(week, c);
        break;
      }
      case 'a': out += f.H < 12 ? 'AM' : 'PM'; break;
      case 'H': out += pad(f.H, c); break;
      case 'k': out += pad(f.H === 0 ? 24 : f.H, c); break;
      case 'K': out += pad(f.H % 12, c); break;
      case 'h': out += pad(f.H % 12 === 0 ? 12 : f.H % 12, c); break;
      case 'm': out += pad(f.m, c); break;
      case 's': out += pad(f.s, c); break;
      case 'S': out += pad(f.S, c); break;               // Java: milliseconds, zero-padded to c
      case 'z':
        if (c >= 4) out += LONG_ZONE_NAMES[zone.id] || zone.id;
        else out += SHORT_ZONE_NAMES[zone.id] || ('GMT' + offsetText(offset, 'X', 3));
        break;
      case 'Z': out += offsetText(offset, 'Z', c); break;
      case 'X': out += offsetText(offset, 'X', c); break;
      default: throw new Error("Illegal pattern character '" + t.letter + "'");
    }
  }
  return out;
}

module.exports = { resolveZone, offsetAt, utcToWall, wallToUtc, formatDate, pad };
