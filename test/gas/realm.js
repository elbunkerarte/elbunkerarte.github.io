'use strict';
/**
 * A "realm" is one vm context plus helpers to build values that belong to it.
 *
 * Values handed to project code must be created with the context's own
 * constructors, otherwise `v instanceof Date` / `instanceof Array` silently
 * turn false inside the project - a behaviour Google never exhibits.
 */
const vm = require('vm');

/**
 * Replaces the context's Date with a subclass-compatible wrapper whose
 * zero-argument form (and Date.now) read the account clock. The prototype is
 * shared, so every Date of the realm - native or wrapped - passes instanceof.
 */
const DATE_PATCH = `(function (nowFn) {
  var NativeDate = globalThis.Date;
  var EmulatedDate = function Date() {
    if (!new.target) return new NativeDate(nowFn()).toString();
    if (arguments.length === 0) return Reflect.construct(NativeDate, [nowFn()], new.target);
    return Reflect.construct(NativeDate, Array.prototype.slice.call(arguments), new.target);
  };
  EmulatedDate.prototype = NativeDate.prototype;
  EmulatedDate.now = function now() { return nowFn(); };
  EmulatedDate.parse = NativeDate.parse;
  EmulatedDate.UTC = NativeDate.UTC;
  Object.defineProperty(NativeDate.prototype, 'constructor', { value: EmulatedDate, writable: true, configurable: true });
  Object.defineProperty(globalThis, 'Date', { value: EmulatedDate, writable: true, configurable: true, enumerable: false });
})`;

const INTRINSICS = '({ Date: Date, Array: Array, Object: Object, Error: Error, TypeError: TypeError, JSON: JSON })';

function isDateLike(v) {
  return Object.prototype.toString.call(v) === '[object Date]';
}

function isPlainObject(v) {
  if (v === null || typeof v !== 'object') return false;
  const proto = Object.getPrototypeOf(v);
  return proto === null || Object.getPrototypeOf(proto) === null;   // Object.prototype of ANY realm
}

function createRealm(nowFn) {
  const ctx = vm.createContext({});
  vm.runInContext(DATE_PATCH, ctx)(nowFn);
  const I = vm.runInContext(INTRINSICS, ctx);

  const realm = {
    ctx,
    Date: I.Date,
    Array: I.Array,
    Object: I.Object,
    JSON: I.JSON,

    date(ms) { return new I.Date(Number(ms)); },

    array(items) {
      const a = new I.Array();
      if (items) for (const x of items) a.push(x);
      return a;
    },

    object(props) {
      const o = new I.Object();
      if (props) for (const k of Object.keys(props)) o[k] = props[k];
      return o;
    },

    /** An Apps Script-style service exception ("Exception: ..."). */
    error(message, name) {
      const e = new I.Error(message);
      e.name = name || 'Exception';
      return e;
    },

    typeError(message) { return new I.TypeError(message); },

    /** Deep-copies host data into this realm (plain objects, arrays, Dates). */
    import(value) {
      if (value === null || typeof value !== 'object') return value;
      if (isDateLike(value)) return new I.Date(value.getTime());
      if (Array.isArray(value)) return realm.array(value.map((x) => realm.import(x)));
      if (isPlainObject(value)) {
        const o = new I.Object();
        for (const k of Object.keys(value)) o[k] = realm.import(value[k]);
        return o;
      }
      return value;                                       // service facades etc. pass through
    }
  };
  return realm;
}

// ---------------------------------------------------------------------------
// Byte arrays: Apps Script represents Java byte[] as arrays of SIGNED ints.
// ---------------------------------------------------------------------------

function toSignedArray(realm, buf) {
  const out = new realm.Array(buf.length);
  for (let i = 0; i < buf.length; i++) out[i] = buf[i] > 127 ? buf[i] - 256 : buf[i];
  return out;
}

function isByteArray(v) {
  return Array.isArray(v) && v.every((b) => typeof b === 'number' && Number.isInteger(b) && b >= -128 && b <= 255);
}

function bytesToBuffer(arr) {
  return Buffer.from(Array.from(arr, (b) => b & 0xff));
}

/** Apps Script "Charset" -> Node encoding. */
function encodingFor(charset) {
  if (!charset) return 'utf8';
  const c = String(charset).toUpperCase().replace(/-/g, '_');
  if (c === 'US_ASCII') return 'latin1';
  return 'utf8';
}

module.exports = { createRealm, isDateLike, isPlainObject, toSignedArray, isByteArray, bytesToBuffer, encodingFor };
