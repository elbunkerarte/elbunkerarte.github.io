'use strict';
/**
 * SpreadsheetApp emulator.
 *
 * Storage is account-wide (one registry of spreadsheets per Google account);
 * facades are built per execution so every value they hand out belongs to the
 * calling project's realm (Dates pass `instanceof Date`, arrays pass
 * `instanceof Array`).
 *
 * Behaviours reproduced on purpose because they cause real bugs:
 *  - string coercion on write (see coerce.js): '16:00' -> 1899-12-30 time value,
 *    '2026-10-02' -> Date, '0012' -> 12, 'TRUE' -> true, '=...' -> formula,
 *    '+57 301 ...' -> #ERROR!, unless the cell format is plain text '@';
 *  - numbers in a date-formatted cell read back as Dates, and clearContent()
 *    keeps formats (so the next write inherits the date format);
 *  - setValues() dimension checks, getRange() "at least 1 row" checks, the
 *    50,000 characters-per-cell limit, "cannot delete all non-frozen rows";
 *  - developer metadata visibility (PROJECT metadata is only visible to the
 *    project that created it).
 */
const { SPREADSHEET_MIME } = require('./drive');
const C = require('./coerce');
const tz = require('./tz');
const { isDateLike } = require('./realm');
const { Blob } = require('./blob');

const MAX_CELL_CHARS = 50000;
const MAX_CELLS = 10000000;
const MAX_GROUP_DEPTH = 8;
const DEFAULT_ROWS = 1000;
const DEFAULT_COLS = 26;

const DM_VISIBILITY = { DOCUMENT: 'DOCUMENT', PROJECT: 'PROJECT' };
const DM_LOCATION = { SPREADSHEET: 'SPREADSHEET', SHEET: 'SHEET', ROW: 'ROW', COLUMN: 'COLUMN' };

function hasContent(cell) {
  return !!cell && (!!cell.f || (cell.v !== '' && cell.v !== null && cell.v !== undefined));
}

function colToNum(letters) {
  let n = 0;
  for (const ch of letters.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n;
}

function numToCol(n) {
  let s = '';
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

// ---------------------------------------------------------------------------
// Stores (account-wide, host realm)
// ---------------------------------------------------------------------------

class SheetStore {
  constructor(id, name, rows, cols) {
    this.id = id;
    this.name = name;
    this.maxRows = rows;
    this.maxCols = cols;
    this.grid = [];
    this.frozenRows = 0;
    this.frozenCols = 0;
    this.hidden = false;
    this.deleted = false;
    this.tabColor = null;
    this.rowDepth = [];
    this.colDepth = [];
    this.collapsedGroups = [];
    this.rowHidden = [];
    this.columnWidths = {};
    this.rowHeights = {};
    this.protections = [];
    this.charts = [];
    this.conditionalRules = [];
    this.groupControlAfter = true;
  }

  cell(r, c) {
    const row = this.grid[r - 1];
    return row ? row[c - 1] : undefined;
  }

  ensureCell(r, c) {
    if (!this.grid[r - 1]) this.grid[r - 1] = [];
    const row = this.grid[r - 1];
    if (!row[c - 1]) row[c - 1] = { v: '', f: null, fmt: null, style: null };
    return row[c - 1];
  }

  lastRow() {
    for (let r = this.grid.length; r >= 1; r--) {
      const row = this.grid[r - 1];
      if (row && row.some(hasContent)) return r;
    }
    return 0;
  }

  lastColumn() {
    let max = 0;
    for (const row of this.grid) {
      if (!row) continue;
      for (let c = row.length; c > max; c--) {
        if (hasContent(row[c - 1])) { max = c; break; }
      }
    }
    return max;
  }

  clone(newId) {
    const s = new SheetStore(newId, this.name, this.maxRows, this.maxCols);
    s.grid = this.grid.map((row) => row && row.map((cell) => cell && {
      v: cell.v, f: cell.f, fmt: cell.fmt, style: cell.style ? Object.assign({}, cell.style) : null
    }));
    s.frozenRows = this.frozenRows;
    s.frozenCols = this.frozenCols;
    s.hidden = this.hidden;
    s.tabColor = this.tabColor;
    s.rowDepth = this.rowDepth.slice();
    s.colDepth = this.colDepth.slice();
    s.collapsedGroups = this.collapsedGroups.map((g) => Object.assign({}, g));
    s.rowHidden = this.rowHidden.slice();
    return s;
  }
}

class SpreadsheetStore {
  constructor(account, id, opts) {
    this.account = account;
    this.id = id;
    this.timeZone = opts.timeZone;
    this.locale = opts.locale;
    this.createdBy = opts.createdBy;
    this.sheets = [];
    this.metadata = [];
    this.namedRanges = {};
    this.nextSheetId = 0;
  }

  get name() { return this.account.drive.get(this.id).name; }
  set name(v) { this.account.drive.get(this.id).name = String(v); }

  findSheet(name) {
    const target = String(name).toLowerCase();
    return this.sheets.find((s) => s.name.toLowerCase() === target) || null;
  }

  newSheetId() {
    const id = this.nextSheetId === 0 ? 0 : 100000000 + Math.floor(Math.random() * 1900000000);
    this.nextSheetId++;
    return id;
  }

  totalCells() {
    return this.sheets.reduce((s, sh) => s + sh.maxRows * sh.maxCols, 0);
  }

  /** Host-side typed read for tests: Dates come back as host Dates. */
  values(sheetName) {
    const sheet = this.findSheet(sheetName);
    if (!sheet) return null;
    const rows = sheet.lastRow();
    const cols = sheet.lastColumn();
    const out = [];
    for (let r = 1; r <= rows; r++) {
      const line = [];
      for (let c = 1; c <= cols; c++) line.push(readCellHost(this, sheet.cell(r, c)));
      out.push(line);
    }
    return out;
  }

  /** Rows as objects keyed by the header row (row 1). */
  records(sheetName) {
    const v = this.values(sheetName);
    if (!v || v.length < 1) return [];
    const headers = v[0].map((h) => String(h).trim());
    return v.slice(1).map((row, i) => {
      const o = { _row: i + 2 };
      headers.forEach((h, j) => { if (h) o[h] = row[j]; });
      return o;
    }).filter((o) => Object.keys(o).some((k) => k !== '_row' && o[k] !== ''));
  }

  /** Deep JSON snapshot of every sheet's values, for "unchanged" assertions. */
  snapshot() {
    const out = {};
    for (const s of this.sheets) {
      out[s.name] = JSON.stringify(this.values(s.name));
    }
    return out;
  }
}

function readCellHost(store, cell) {
  if (!cell) return '';
  if (typeof cell.v === 'number' && C.isDateTimeFormat(cell.fmt)) {
    return new Date(tz.wallToUtc(store.timeZone, C.wallFromSerial(cell.v)));
  }
  return cell.v;
}

// ---------------------------------------------------------------------------
// Cell read/write with Sheets semantics
// ---------------------------------------------------------------------------

function headerOf(sheet, r, c) {
  if (r === 1) return '(row 1)';
  const h = sheet.cell(1, c);
  return h && h.v !== '' ? String(h.v) : numToCol(c);
}

function writeCell(env, store, sheet, r, c, raw, where) {
  const R = env.realm;
  const cell = sheet.ensureCell(r, c);
  cell.f = null;

  if (raw === null || raw === undefined) { cell.v = ''; return; }

  if (typeof raw === 'string') {
    if (raw.length > MAX_CELL_CHARS) {
      throw R.error('Your input contains more than the maximum of 50000 characters in a single cell.');
    }
    if (C.isPlainTextFormat(cell.fmt)) {
      // Measured on a live sheet (2026-09-24): plain text still drops a leading
      // apostrophe and still turns "=..." into a formula when written by the API.
      if (raw[0] === "'") { cell.v = raw.slice(1); return; }
      if (raw[0] !== '=' || raw.length < 2) { cell.v = raw; return; }
    }
    const p = C.parseUserEntry(raw, store.locale);
    switch (p.kind) {
      case 'date':
        cell.v = C.serialFromWall(p.wall);
        if (!C.isDateTimeFormat(cell.fmt)) cell.fmt = p.format;
        env.note('coerced', { sheet: sheet.name, header: headerOf(sheet, r, c), from: raw, to: 'Date', where });
        return;
      case 'number':
        cell.v = p.value;
        if (p.format && C.isGeneralFormat(cell.fmt)) cell.fmt = p.format;
        env.note('coerced', { sheet: sheet.name, header: headerOf(sheet, r, c), from: raw, to: p.value, where });
        return;
      case 'boolean':
        cell.v = p.value;
        env.note('coerced', { sheet: sheet.name, header: headerOf(sheet, r, c), from: raw, to: p.value, where });
        return;
      case 'formula':
        cell.f = p.formula;
        cell.v = p.value === '#ERROR!' ? '#ERROR!' : '#FORMULA!';
        env.warn('formula-from-string', 'A string written to ' + sheet.name + '!' + numToCol(c) + r +
          ' became a formula: ' + JSON.stringify(raw.slice(0, 80)), { sheet: sheet.name, row: r, col: c, where });
        return;
      default:
        cell.v = p.value;
        return;
    }
  }

  if (typeof raw === 'number') {
    if (!isFinite(raw)) {
      env.warn('non-finite-number', 'Wrote ' + raw + ' to ' + sheet.name + '!' + numToCol(c) + r, { where });
      cell.v = '#NUM!';
      return;
    }
    cell.v = raw;
    return;
  }
  if (typeof raw === 'boolean') { cell.v = raw; return; }
  if (isDateLike(raw)) {
    const ms = raw.getTime();
    if (isNaN(ms)) {
      env.warn('invalid-date', 'Wrote an Invalid Date to ' + sheet.name + '!' + numToCol(c) + r, { where });
      cell.v = '';
      return;
    }
    cell.v = C.serialFromWall(tz.utcToWall(store.timeZone, ms));
    if (!C.isDateTimeFormat(cell.fmt)) cell.fmt = C.AUTO_FORMAT.dateObject;
    return;
  }
  env.warn('non-primitive-value', 'Wrote a ' + (Array.isArray(raw) ? 'array' : typeof raw) + ' to ' + sheet.name + '!' +
    numToCol(c) + r + ' (stored as its string form)', { where });
  cell.v = String(raw);
}

function readCell(env, store, cell) {
  if (!cell) return '';
  const v = cell.v;
  if (typeof v === 'number' && C.isDateTimeFormat(cell.fmt)) {
    return env.realm.date(tz.wallToUtc(store.timeZone, C.wallFromSerial(v)));
  }
  return v;
}

// ---------------------------------------------------------------------------
// Generic builders (data validation, conditional formats, charts...): stored only
// ---------------------------------------------------------------------------

function genericBuilder(kind) {
  const calls = [];
  const target = {};
  const proxy = new Proxy(target, {
    get(t, prop) {
      if (typeof prop === 'symbol') return undefined;
      if (prop === 'build') return () => ({ kind, calls: calls.slice(), toString: () => kind });
      if (prop === 'getCalls') return () => calls.slice();
      return (...args) => { calls.push([prop, args]); return proxy; };
    }
  });
  return proxy;
}

// ---------------------------------------------------------------------------
// Facades
// ---------------------------------------------------------------------------

const STYLE_PROPS = [
  ['Background', 'Backgrounds', '#ffffff'], ['FontColor', 'FontColors', '#000000'],
  ['FontFamily', 'FontFamilies', 'Arial'], ['FontLine', 'FontLines', 'none'],
  ['FontSize', 'FontSizes', 10], ['FontStyle', 'FontStyles', 'normal'],
  ['FontWeight', 'FontWeights', 'normal'], ['HorizontalAlignment', 'HorizontalAlignments', 'general'],
  ['VerticalAlignment', 'VerticalAlignments', 'bottom'], ['Wrap', 'Wraps', false],
  ['WrapStrategy', 'WrapStrategies', 'OVERFLOW'], ['Note', 'Notes', ''],
  ['TextRotation', 'TextRotations', null], ['TextDirection', 'TextDirections', null],
  ['TextStyle', 'TextStyles', null], ['DataValidation', 'DataValidations', null],
  ['ShowHyperlink', null, null], ['VerticalText', null, null],
  ['FontColorObject', 'FontColorObjects', null], ['BackgroundObject', 'BackgroundObjects', null]
];

function makeSpreadsheetApp(env) {
  const R = env.realm;
  const account = env.account;

  function ssOrThrow(id) {
    const store = account.spreadsheets.get(String(id));
    if (!store) throw R.error('Unexpected error while getting the method or property openById on object SpreadsheetApp.');
    env.project.openedSpreadsheets.add(store.id);
    return store;
  }

  function checkAlive(sheet) {
    if (sheet.deleted) throw R.error('Sheet ' + sheet.name + ' has been deleted.');
  }

  function expandGrid(store, sheet, lastRowNeeded, lastColNeeded) {
    const newRows = Math.max(sheet.maxRows, lastRowNeeded);
    const newCols = Math.max(sheet.maxCols, lastColNeeded);
    if (newRows === sheet.maxRows && newCols === sheet.maxCols) return;
    const delta = newRows * newCols - sheet.maxRows * sheet.maxCols;
    if (store.totalCells() + delta > MAX_CELLS) {
      throw R.error('This action would increase the number of cells in the workbook above the limit of 10000000 cells.');
    }
    sheet.maxRows = newRows;
    sheet.maxCols = newCols;
  }

  // ---- developer metadata ------------------------------------------------
  function visibleTo(md) {
    return md.visibility === DM_VISIBILITY.DOCUMENT || md.project === env.project.name;
  }

  function addMetadata(store, location, args) {
    const key = args[0];
    let value = null;
    let visibility = DM_VISIBILITY.DOCUMENT;
    if (args.length === 2) {
      if (args[1] === DM_VISIBILITY.DOCUMENT || args[1] === DM_VISIBILITY.PROJECT) visibility = args[1];
      else value = args[1];
    } else if (args.length >= 3) {
      value = args[1];
      visibility = args[2];
    }
    if (typeof key !== 'string' || !key) throw R.error('Invalid argument: key');
    store.metadata.push({
      id: account.nextMetadataId++, key, value: value === null || value === undefined ? null : String(value),
      visibility, project: env.project.name, location
    });
  }

  function wrapMetadata(store, md) {
    const facade = {
      getId() { return md.id; },
      getKey() { return md.key; },
      getValue() { return md.value; },
      getVisibility() { return md.visibility; },
      setKey(k) { md.key = String(k); return facade; },
      setValue(v) { md.value = v === null || v === undefined ? null : String(v); return facade; },
      setVisibility(v) { md.visibility = v; return facade; },
      remove() { store.metadata = store.metadata.filter((x) => x !== md); },
      getLocation() {
        const loc = md.location;
        return {
          getLocationType() { return loc.type; },
          getSpreadsheet() { return loc.type === DM_LOCATION.SPREADSHEET ? wrapSpreadsheet(store) : null; },
          getSheet() {
            const sh = store.sheets.find((s) => s.id === loc.sheetId);
            return loc.type === DM_LOCATION.SHEET && sh ? wrapSheet(store, sh) : null;
          },
          getRow() {
            const sh = store.sheets.find((s) => s.id === loc.sheetId);
            return loc.type === DM_LOCATION.ROW && sh ? makeRange(store, sh, loc.index, 1, 1, sh.maxCols) : null;
          },
          getColumn() {
            const sh = store.sheets.find((s) => s.id === loc.sheetId);
            return loc.type === DM_LOCATION.COLUMN && sh ? makeRange(store, sh, 1, loc.index, sh.maxRows, 1) : null;
          }
        };
      }
    };
    return facade;
  }

  function makeFinder(store, scopeFilter) {
    const filters = [];
    const finder = {
      withKey(k) { filters.push((md) => md.key === k); return finder; },
      withValue(v) { filters.push((md) => md.value === (v === null ? null : String(v))); return finder; },
      withId(id) { filters.push((md) => md.id === id); return finder; },
      withVisibility(v) { filters.push((md) => md.visibility === v); return finder; },
      withLocationType(t) { filters.push((md) => md.location.type === t); return finder; },
      onIntersectingLocations() { return finder; },
      find() {
        env.count('DeveloperMetadataFinder.find');
        return R.array(store.metadata.filter((md) => visibleTo(md) && scopeFilter(md) && filters.every((f) => f(md)))
          .map((md) => wrapMetadata(store, md)));
      }
    };
    return finder;
  }

  // ---- ranges ------------------------------------------------------------
  function makeRange(store, sheet, row, col, numRows, numCols) {
    const lastR = row + numRows - 1;
    const lastC = col + numCols - 1;

    function forEachCell(fn) {
      for (let r = row; r <= lastR; r++) for (let c = col; c <= lastC; c++) fn(r, c);
    }

    function matrix(fn) {
      const out = new R.Array();
      for (let r = row; r <= lastR; r++) {
        const line = new R.Array();
        for (let c = col; c <= lastC; c++) line.push(fn(r, c));
        out.push(line);
      }
      return out;
    }

    function checkMatrix(values, method) {
      if (!Array.isArray(values)) {
        throw R.error("The parameters (" + (values === null ? 'null' : typeof values) +
          ") don't match the method signature for SpreadsheetApp.Range." + method + '.');
      }
      if (values.length !== numRows) {
        throw R.error('The number of rows in the data does not match the number of rows in the range. The data has ' +
          values.length + ' but the range has ' + numRows + '.');
      }
      for (const line of values) {
        if (!Array.isArray(line)) {
          throw R.error("The parameters (number[]) don't match the method signature for SpreadsheetApp.Range." + method + '.');
        }
        if (line.length !== numCols) {
          throw R.error('The number of columns in the data does not match the number of columns in the range. The data has ' +
            line.length + ' but the range has ' + numCols + '.');
        }
      }
    }

    function styleOf(r, c) {
      const cell = sheet.cell(r, c);
      return cell && cell.style ? cell.style : null;
    }

    function setStyle(r, c, prop, value) {
      const cell = sheet.ensureCell(r, c);
      if (!cell.style) cell.style = {};
      cell.style[prop] = value;
    }

    function collectGroups() {
      const groups = [];
      for (let d = 1; d <= MAX_GROUP_DEPTH; d++) {
        let start = null;
        for (let r = 1; r <= sheet.maxRows + 1; r++) {
          const inGroup = r <= sheet.maxRows && (sheet.rowDepth[r - 1] || 0) >= d;
          if (inGroup && start === null) start = r;
          if (!inGroup && start !== null) { groups.push({ a: start, b: r - 1, d }); start = null; }
        }
      }
      return groups;
    }

    const range = {
      // ---- geometry --------------------------------------------------------
      getRow() { return row; },
      getRowIndex() { return row; },
      getColumn() { return col; },
      getColumnIndex() { return col; },
      getNumRows() { return numRows; },
      getNumColumns() { return numCols; },
      getHeight() { return numRows; },
      getWidth() { return numCols; },
      getLastRow() { return lastR; },
      getLastColumn() { return lastC; },
      getA1Notation() {
        const a = numToCol(col) + row;
        return numRows === 1 && numCols === 1 ? a : a + ':' + numToCol(lastC) + lastR;
      },
      getSheet() { return wrapSheet(store, sheet); },
      getGridId() { return sheet.id; },
      getCell(r, c) {
        if (r < 1 || c < 1 || r > numRows || c > numCols) throw R.error('Cell reference out of range');
        return makeRange(store, sheet, row + r - 1, col + c - 1, 1, 1);
      },
      offset(dr, dc, nr, nc) {
        return checkedRange(store, sheet, row + dr, col + dc, nr === undefined ? numRows : nr, nc === undefined ? numCols : nc);
      },
      activate() { return range; },
      activateAsCurrentCell() { return range; },
      isBlank() {
        let blank = true;
        forEachCell((r, c) => { if (hasContent(sheet.cell(r, c))) blank = false; });
        return blank;
      },

      // ---- values ----------------------------------------------------------
      getValues() {
        checkAlive(sheet);
        env.count('Range.getValues');
        return matrix((r, c) => readCell(env, store, sheet.cell(r, c)));
      },
      getValue() {
        checkAlive(sheet);
        env.count('Range.getValue');
        return readCell(env, store, sheet.cell(row, col));
      },
      getDisplayValues() {
        env.count('Range.getDisplayValues');
        return matrix((r, c) => C.displayValue(sheet.cell(r, c)));
      },
      getDisplayValue() {
        env.count('Range.getDisplayValue');
        return C.displayValue(sheet.cell(row, col));
      },
      setValues(values) {
        checkAlive(sheet);
        env.count('Range.setValues');
        checkMatrix(values, 'setValues');
        expandGrid(store, sheet, lastR, lastC);
        for (let i = 0; i < numRows; i++) {
          for (let j = 0; j < numCols; j++) writeCell(env, store, sheet, row + i, col + j, values[i][j], 'setValues');
        }
        return range;
      },
      setValue(value) {
        checkAlive(sheet);
        env.count('Range.setValue');
        expandGrid(store, sheet, lastR, lastC);
        forEachCell((r, c) => writeCell(env, store, sheet, r, c, value, 'setValue'));
        return range;
      },
      getFormulas() { return matrix((r, c) => { const x = sheet.cell(r, c); return x && x.f ? x.f : ''; }); },
      getFormula() { const x = sheet.cell(row, col); return x && x.f ? x.f : ''; },
      setFormula(f) {
        expandGrid(store, sheet, lastR, lastC);
        forEachCell((r, c) => {
          const cell = sheet.ensureCell(r, c);
          cell.f = String(f);
          cell.v = '#FORMULA!';
        });
        env.warn('formula-not-evaluated', 'setFormula(' + String(f).slice(0, 60) + ') is stored but never evaluated by the emulator');
        return range;
      },
      setFormulas(m) {
        checkMatrix(m, 'setFormulas');
        expandGrid(store, sheet, lastR, lastC);
        for (let i = 0; i < numRows; i++) for (let j = 0; j < numCols; j++) {
          const cell = sheet.ensureCell(row + i, col + j);
          cell.f = String(m[i][j]);
          cell.v = '#FORMULA!';
        }
        env.warn('formula-not-evaluated', 'setFormulas() stored formulas that are never evaluated by the emulator');
        return range;
      },

      // ---- number formats ------------------------------------------------
      getNumberFormat() { const x = sheet.cell(row, col); return x && x.fmt ? x.fmt : 'General'; },
      getNumberFormats() { return matrix((r, c) => { const x = sheet.cell(r, c); return x && x.fmt ? x.fmt : 'General'; }); },
      setNumberFormat(fmt) {
        env.count('Range.setNumberFormat');
        expandGrid(store, sheet, lastR, lastC);
        forEachCell((r, c) => { sheet.ensureCell(r, c).fmt = String(fmt); });
        return range;
      },
      setNumberFormats(m) {
        checkMatrix(m, 'setNumberFormats');
        expandGrid(store, sheet, lastR, lastC);
        for (let i = 0; i < numRows; i++) for (let j = 0; j < numCols; j++) sheet.ensureCell(row + i, col + j).fmt = String(m[i][j]);
        return range;
      },

      // ---- clearing ------------------------------------------------------
      clearContent() {
        env.count('Range.clearContent');
        forEachCell((r, c) => { const x = sheet.cell(r, c); if (x) { x.v = ''; x.f = null; } });
        return range;
      },
      clearFormat() {
        forEachCell((r, c) => { const x = sheet.cell(r, c); if (x) { x.fmt = null; x.style = null; } });
        return range;
      },
      clear(options) {
        env.count('Range.clear');
        const o = options || {};
        if (o.contentsOnly) return range.clearContent();
        if (o.formatOnly) return range.clearFormat();
        forEachCell((r, c) => { const x = sheet.cell(r, c); if (x) { x.v = ''; x.f = null; x.fmt = null; x.style = null; } });
        return range;
      },
      clearNote() { forEachCell((r, c) => { const s = styleOf(r, c); if (s) delete s.Note; }); return range; },
      clearDataValidations() { forEachCell((r, c) => { const s = styleOf(r, c); if (s) delete s.DataValidation; }); return range; },
      trimWhitespace() {
        forEachCell((r, c) => {
          const x = sheet.cell(r, c);
          if (x && typeof x.v === 'string') x.v = x.v.replace(/\s+/g, ' ').trim();
        });
        return range;
      },

      // ---- formatting no-ops that still chain ----------------------------
      setBorder() { forEachCell((r, c) => setStyle(r, c, 'Border', Array.from(arguments))); return range; },
      setBackgroundRGB(red, green, blue) {
        const hex = '#' + [red, green, blue].map((n) => Number(n).toString(16).padStart(2, '0')).join('');
        forEachCell((r, c) => setStyle(r, c, 'Background', hex));
        return range;
      },
      merge() { return range; },
      mergeAcross() { return range; },
      mergeVertically() { return range; },
      breakApart() { return range; },
      isPartOfMerge() { return false; },
      getMergedRanges() { return R.array([]); },
      applyRowBanding() { return { remove() {}, getRange: () => range, setHeaderRowColor() { return this; } }; },
      applyColumnBanding() { return { remove() {}, getRange: () => range }; },
      getBandings() { return R.array([]); },
      createFilter() { return { remove() {}, getRange: () => range, sort() { return this; } }; },
      getFilter() { return null; },
      autoResizeColumns() { return range; },
      insertCheckboxes() {
        forEachCell((r, c) => {
          const x = sheet.ensureCell(r, c);
          if (!hasContent(x)) x.v = false;
          if (!x.style) x.style = {};
          x.style.DataValidation = { kind: 'checkbox' };
        });
        return range;
      },
      removeCheckboxes() { forEachCell((r, c) => { const s = styleOf(r, c); if (s) delete s.DataValidation; }); return range; },
      check() { forEachCell((r, c) => { sheet.ensureCell(r, c).v = true; }); return range; },
      uncheck() { forEachCell((r, c) => { sheet.ensureCell(r, c).v = false; }); return range; },
      isChecked() { const x = sheet.cell(row, col); return x ? x.v === true : false; },
      setRichTextValue(rt) {
        forEachCell((r, c) => writeCell(env, store, sheet, r, c, rt && rt.getText ? rt.getText() : '', 'setRichTextValue'));
        return range;
      },
      getRichTextValue() {
        const text = C.displayValue(sheet.cell(row, col));
        return { getText: () => text, getLinkUrl: () => null, getRuns: () => R.array([]) };
      },

      // ---- copy / sort -----------------------------------------------------
      copyTo(dest, options) {
        const target = dest;
        const tSheet = target._sheet;
        const tStore = target._store;
        const contentsOnly = options && (options.contentsOnly || options === 'PASTE_VALUES');
        for (let i = 0; i < numRows; i++) for (let j = 0; j < numCols; j++) {
          const src = sheet.cell(row + i, col + j);
          const dst = tSheet.ensureCell(target.getRow() + i, target.getColumn() + j);
          dst.v = src ? src.v : '';
          dst.f = src ? src.f : null;
          if (!contentsOnly) { dst.fmt = src ? src.fmt : null; dst.style = src && src.style ? Object.assign({}, src.style) : null; }
        }
        expandGrid(tStore, tSheet, target.getRow() + numRows - 1, target.getColumn() + numCols - 1);
        return range;
      },
      sort(spec) {
        const specs = (Array.isArray(spec) ? spec : [spec]).map((s) => (typeof s === 'number'
          ? { column: s, ascending: true } : { column: s.column, ascending: s.ascending !== false }));
        const rows = [];
        for (let r = row; r <= lastR; r++) {
          const line = [];
          for (let c = col; c <= lastC; c++) line.push(sheet.cell(r, c) || null);
          rows.push(line);
        }
        const cmp = (a, b) => {
          for (const s of specs) {
            const ia = s.column - col;
            const va = a[ia] ? a[ia].v : '';
            const vb = b[ia] ? b[ia].v : '';
            if (va === vb) continue;
            if (va === '') return 1;
            if (vb === '') return -1;
            const res = va < vb ? -1 : 1;
            return s.ascending ? res : -res;
          }
          return 0;
        };
        rows.sort(cmp);
        rows.forEach((line, i) => {
          if (!sheet.grid[row + i - 1]) sheet.grid[row + i - 1] = [];
          line.forEach((cell, j) => { sheet.grid[row + i - 1][col + j - 1] = cell || undefined; });
        });
        return range;
      },

      // ---- protection ----------------------------------------------------
      protect() { return makeProtection(store, sheet, range); },

      // ---- row / column groups -------------------------------------------
      shiftRowGroupDepth(delta) {
        env.count('Range.shiftRowGroupDepth');
        for (let r = row; r <= lastR; r++) {
          const next = Math.max(0, (sheet.rowDepth[r - 1] || 0) + Number(delta));
          if (next > MAX_GROUP_DEPTH) throw R.error('Group depth cannot exceed ' + MAX_GROUP_DEPTH + '.');
          sheet.rowDepth[r - 1] = next;
        }
        return range;
      },
      shiftColumnGroupDepth(delta) {
        for (let c = col; c <= lastC; c++) {
          const next = Math.max(0, (sheet.colDepth[c - 1] || 0) + Number(delta));
          if (next > MAX_GROUP_DEPTH) throw R.error('Group depth cannot exceed ' + MAX_GROUP_DEPTH + '.');
          sheet.colDepth[c - 1] = next;
        }
        return range;
      },
      collapseGroups() {
        const groups = collectGroups();
        const inside = groups.filter((g) => g.a >= row && g.b <= lastR);
        const chosen = inside.length ? inside
          : groups.filter((g) => g.b >= row && g.a <= lastR && !isCollapsed(sheet, g)).sort((x, y) => y.d - x.d).slice(0, 1);
        chosen.forEach((g) => { if (!isCollapsed(sheet, g)) sheet.collapsedGroups.push({ a: g.a, b: g.b, d: g.d }); });
        return range;
      },
      expandGroups() {
        const groups = collectGroups().filter((g) => g.b + 1 >= row && g.a <= lastR);
        sheet.collapsedGroups = sheet.collapsedGroups.filter((cg) =>
          !groups.some((g) => g.a === cg.a && g.b === cg.b && g.d === cg.d));
        return range;
      },

      // ---- developer metadata --------------------------------------------
      addDeveloperMetadata() {
        const wholeRow = col === 1 && numCols === sheet.maxCols && numRows === 1;
        const wholeCol = row === 1 && numRows === sheet.maxRows && numCols === 1;
        if (!wholeRow && !wholeCol) {
          throw R.error('Developer metadata can only be added to an entire row or column (e.g. sheet.getRange("3:3")).');
        }
        addMetadata(store, wholeRow ? { type: DM_LOCATION.ROW, sheetId: sheet.id, index: row }
          : { type: DM_LOCATION.COLUMN, sheetId: sheet.id, index: col }, Array.from(arguments));
        return range;
      },
      getDeveloperMetadata() {
        return R.array(store.metadata.filter((md) => visibleTo(md) && md.location.sheetId === sheet.id &&
          ((md.location.type === DM_LOCATION.ROW && md.location.index >= row && md.location.index <= lastR) ||
           (md.location.type === DM_LOCATION.COLUMN && md.location.index >= col && md.location.index <= lastC)))
          .map((md) => wrapMetadata(store, md)));
      },
      createDeveloperMetadataFinder() {
        return makeFinder(store, (md) => md.location.sheetId === sheet.id &&
          ((md.location.type === DM_LOCATION.ROW && md.location.index >= row && md.location.index <= lastR) ||
           (md.location.type === DM_LOCATION.COLUMN && md.location.index >= col && md.location.index <= lastC)));
      },
      toString() { return 'Range'; }
    };

    for (const [prop, plural, dflt] of STYLE_PROPS) {
      range['set' + prop] = function (value) {
        forEachCell((r, c) => setStyle(r, c, prop, value));
        return range;
      };
      range['get' + prop] = function () {
        const s = styleOf(row, col);
        return s && s[prop] !== undefined ? s[prop] : dflt;
      };
      if (plural) {
        range['set' + plural] = function (m) {
          checkMatrix(m, 'set' + plural);
          for (let i = 0; i < numRows; i++) for (let j = 0; j < numCols; j++) setStyle(row + i, col + j, prop, m[i][j]);
          return range;
        };
        range['get' + plural] = function () {
          return matrix((r, c) => { const s = styleOf(r, c); return s && s[prop] !== undefined ? s[prop] : dflt; });
        };
      }
    }
    range.setBackgroundColor = range.setBackground;

    Object.defineProperty(range, '_sheet', { value: sheet });
    Object.defineProperty(range, '_store', { value: store });
    return range;
  }

  function isCollapsed(sheet, g) {
    return sheet.collapsedGroups.some((cg) => cg.a === g.a && cg.b === g.b && cg.d === g.d);
  }

  function checkedRange(store, sheet, row, col, numRows, numCols) {
    checkAlive(sheet);
    env.count('Sheet.getRange');
    for (const [v, label] of [[row, 'row'], [col, 'column']]) {
      if (typeof v !== 'number' || !isFinite(v)) throw R.error('Cannot convert ' + v + ' to int (' + label + ').');
    }
    if (numRows !== undefined && (typeof numRows !== 'number' || !isFinite(numRows))) {
      throw R.error('Cannot convert ' + numRows + ' to int.');
    }
    if (numCols !== undefined && (typeof numCols !== 'number' || !isFinite(numCols))) {
      throw R.error('Cannot convert ' + numCols + ' to int.');
    }
    if (row < 1 || col < 1) throw R.error('The starting row and column of the range must be at least 1.');
    const nr = numRows === undefined ? 1 : Math.floor(numRows);
    const nc = numCols === undefined ? 1 : Math.floor(numCols);
    if (nr < 1) throw R.error('The number of rows in the range must be at least 1.');
    if (nc < 1) throw R.error('The number of columns in the range must be at least 1.');
    return makeRange(store, sheet, Math.floor(row), Math.floor(col), nr, nc);
  }

  function rangeFromA1(store, sheet, a1) {
    const m = String(a1).trim().match(/^\$?([A-Za-z]*)\$?(\d*)(?::\$?([A-Za-z]*)\$?(\d*))?$/);
    if (!m || (!m[1] && !m[2])) throw R.error('Range not found');
    const hasC1 = !!m[1];
    const hasR1 = !!m[2];
    if (m[3] === undefined && m[4] === undefined) {
      if (!hasC1 || !hasR1) throw R.error('Range not found');
      return checkedRange(store, sheet, Number(m[2]), colToNum(m[1]), 1, 1);
    }
    const c1 = hasC1 ? colToNum(m[1]) : 1;
    const c2 = m[3] ? colToNum(m[3]) : (hasC1 ? c1 : sheet.maxCols);      // '2:5' spans every column
    const r1 = hasR1 ? Number(m[2]) : 1;
    const r2 = m[4] ? Number(m[4]) : sheet.maxRows;                        // 'A:C' / 'A2:C' run to the last row
    return checkedRange(store, sheet, Math.min(r1, r2), Math.min(c1, c2), Math.abs(r2 - r1) + 1, Math.abs(c2 - c1) + 1);
  }

  function makeProtection(store, sheet, range) {
    const p = {
      description: '', warningOnly: false, editors: [], range,
      setDescription(d) { p.description = String(d); return p; },
      getDescription() { return p.description; },
      setWarningOnly(v) { p.warningOnly = !!v; return p; },
      isWarningOnly() { return p.warningOnly; },
      addEditor(e) { p.editors.push(String(e && e.getEmail ? e.getEmail() : e)); return p; },
      addEditors(list) { list.forEach((e) => p.addEditor(e)); return p; },
      removeEditor(e) { p.editors = p.editors.filter((x) => x !== String(e)); return p; },
      removeEditors(list) { list.forEach((e) => p.removeEditor(e)); return p; },
      getEditors() { return R.array(p.editors.map((e) => ({ getEmail: () => e }))); },
      setDomainEdit() { return p; },
      canDomainEdit() { return false; },
      canEdit() { return true; },
      getRange() { return range; },
      getProtectionType() { return range ? 'RANGE' : 'SHEET'; },
      setUnprotectedRanges() { return p; },
      remove() { sheet.protections = sheet.protections.filter((x) => x !== p); }
    };
    sheet.protections.push(p);
    return p;
  }

  // ---- sheets ------------------------------------------------------------
  function shiftRowState(sheet, start, count, inserting) {
    const shiftArray = (arr) => {
      if (inserting) arr.splice(start - 1, 0, ...new Array(count).fill(undefined));
      else arr.splice(start - 1, count);
    };
    shiftArray(sheet.grid);
    shiftArray(sheet.rowHidden);
    if (inserting) {
      const inherited = Math.min(sheet.rowDepth[start - 2] || 0, sheet.rowDepth[start - 1] || 0);
      sheet.rowDepth.splice(start - 1, 0, ...new Array(count).fill(inherited));
    } else {
      sheet.rowDepth.splice(start - 1, count);
    }
    sheet.collapsedGroups = [];
  }

  function shiftRowMetadata(store, sheet, start, count, inserting) {
    store.metadata = store.metadata.filter((md) => {
      if (md.location.sheetId !== sheet.id || md.location.type !== DM_LOCATION.ROW) return true;
      if (inserting) { if (md.location.index >= start) md.location.index += count; return true; }
      if (md.location.index >= start && md.location.index < start + count) return false;
      if (md.location.index >= start + count) md.location.index -= count;
      return true;
    });
  }

  function wrapSheet(store, sheet) {
    const facade = {
      getName() { return sheet.name; },
      setName(name) {
        const other = store.findSheet(name);
        if (other && other !== sheet) throw R.error('A sheet with the name "' + name + '" already exists. Please enter another name.');
        sheet.name = String(name);
        return facade;
      },
      getSheetId() { return sheet.id; },
      getSheetName() { return sheet.name; },
      getIndex() { return store.sheets.indexOf(sheet) + 1; },
      getParent() { return wrapSpreadsheet(store); },
      getType() { return 'GRID'; },
      getLastRow() { checkAlive(sheet); env.count('Sheet.getLastRow'); return sheet.lastRow(); },
      getLastColumn() { checkAlive(sheet); env.count('Sheet.getLastColumn'); return sheet.lastColumn(); },
      getMaxRows() { return sheet.maxRows; },
      getMaxColumns() { return sheet.maxCols; },
      getRange(a, b, c, d) {
        if (typeof a === 'string' && b === undefined) return rangeFromA1(store, sheet, a);
        return checkedRange(store, sheet, a, b, c, d);
      },
      getDataRange() {
        const rows = Math.max(1, sheet.lastRow());
        const cols = Math.max(1, sheet.lastColumn());
        return makeRange(store, sheet, 1, 1, rows, cols);
      },
      getSheetValues(r, c, nr, nc) {
        return checkedRange(store, sheet, r, c, nr === -1 ? sheet.lastRow() - r + 1 : nr,
          nc === -1 ? sheet.lastColumn() - c + 1 : nc).getValues();
      },
      appendRow(values) {
        checkAlive(sheet);
        env.count('Sheet.appendRow');
        if (!Array.isArray(values)) throw R.error("The parameters don't match the method signature for SpreadsheetApp.Sheet.appendRow.");
        const r = sheet.lastRow() + 1;
        expandGrid(store, sheet, r, values.length);
        values.forEach((v, i) => writeCell(env, store, sheet, r, i + 1, v, 'appendRow'));
        return facade;
      },
      clear(options) {
        env.count('Sheet.clear');
        const o = options || {};
        if (o.contentsOnly) return facade.clearContents();
        if (o.formatOnly) return facade.clearFormats();
        sheet.grid = [];
        return facade;
      },
      clearContents() {
        for (const line of sheet.grid) if (line) for (const cell of line) if (cell) { cell.v = ''; cell.f = null; }
        return facade;
      },
      clearFormats() {
        for (const line of sheet.grid) if (line) for (const cell of line) if (cell) { cell.fmt = null; cell.style = null; }
        return facade;
      },
      clearNotes() { return facade; },
      clearConditionalFormatRules() { sheet.conditionalRules = []; },

      deleteRows(start, howMany) {
        env.count('Sheet.deleteRows');
        const n = howMany === undefined ? 1 : howMany;
        if (start < 1 || n < 1 || start + n - 1 > sheet.maxRows) throw R.error('Those rows are out of bounds.');
        if (sheet.maxRows - n <= sheet.frozenRows) throw R.error('Sorry, it is not possible to delete all non-frozen rows.');
        shiftRowState(sheet, start, n, false);
        shiftRowMetadata(store, sheet, start, n, false);
        sheet.maxRows -= n;
      },
      deleteRow(r) { facade.deleteRows(r, 1); return facade; },
      insertRowsAfter(after, howMany) {
        env.count('Sheet.insertRows');
        if (after < 1 || after > sheet.maxRows) throw R.error('Those rows are out of bounds.');
        expandGrid(store, sheet, sheet.maxRows + howMany, sheet.maxCols);
        shiftRowState(sheet, after + 1, howMany, true);
        shiftRowMetadata(store, sheet, after + 1, howMany, true);
        const src = sheet.grid[after - 1];
        if (src) {
          for (let i = 0; i < howMany; i++) {
            sheet.grid[after + i] = src.map((cell) => cell && (cell.fmt || cell.style)
              ? { v: '', f: null, fmt: cell.fmt, style: cell.style ? Object.assign({}, cell.style) : null } : undefined);
          }
        }
        return facade;
      },
      insertRowAfter(after) { return facade.insertRowsAfter(after, 1); },
      insertRowsBefore(before, howMany) {
        if (before < 1 || before > sheet.maxRows) throw R.error('Those rows are out of bounds.');
        expandGrid(store, sheet, sheet.maxRows + howMany, sheet.maxCols);
        shiftRowState(sheet, before, howMany, true);
        shiftRowMetadata(store, sheet, before, howMany, true);
        return facade;
      },
      insertRowBefore(before) { return facade.insertRowsBefore(before, 1); },
      insertRows(before, howMany) { facade.insertRowsBefore(before, howMany === undefined ? 1 : howMany); },
      deleteColumns(start, howMany) {
        const n = howMany === undefined ? 1 : howMany;
        if (start < 1 || n < 1 || start + n - 1 > sheet.maxCols) throw R.error('Those columns are out of bounds.');
        if (sheet.maxCols - n <= sheet.frozenCols) throw R.error('Sorry, it is not possible to delete all non-frozen columns.');
        for (const line of sheet.grid) if (line) line.splice(start - 1, n);
        sheet.colDepth.splice(start - 1, n);
        sheet.maxCols -= n;
      },
      deleteColumn(c) { facade.deleteColumns(c, 1); return facade; },
      insertColumnsAfter(after, howMany) {
        expandGrid(store, sheet, sheet.maxRows, sheet.maxCols + howMany);
        for (const line of sheet.grid) if (line && line.length > after) line.splice(after, 0, ...new Array(howMany).fill(undefined));
        return facade;
      },
      insertColumnAfter(after) { return facade.insertColumnsAfter(after, 1); },
      insertColumnsBefore(before, howMany) { return facade.insertColumnsAfter(before - 1, howMany); },
      insertColumnBefore(before) { return facade.insertColumnsAfter(before - 1, 1); },

      setFrozenRows(n) { sheet.frozenRows = Number(n); return facade; },
      setFrozenColumns(n) { sheet.frozenCols = Number(n); return facade; },
      getFrozenRows() { return sheet.frozenRows; },
      getFrozenColumns() { return sheet.frozenCols; },
      setColumnWidth(c, w) { sheet.columnWidths[c] = w; return facade; },
      setColumnWidths(start, n, w) { for (let i = 0; i < n; i++) sheet.columnWidths[start + i] = w; return facade; },
      getColumnWidth(c) { return sheet.columnWidths[c] || 100; },
      setRowHeight(r, h) { sheet.rowHeights[r] = h; return facade; },
      setRowHeights(start, n, h) { for (let i = 0; i < n; i++) sheet.rowHeights[start + i] = h; return facade; },
      setRowHeightsForced(start, n, h) { return facade.setRowHeights(start, n, h); },
      getRowHeight(r) { return sheet.rowHeights[r] || 21; },
      autoResizeColumn() { return facade; },
      autoResizeColumns() { return facade; },
      autoResizeRows() { return facade; },
      hideRows(start, n) { for (let i = 0; i < (n || 1); i++) sheet.rowHidden[start - 1 + i] = true; },
      showRows(start, n) { for (let i = 0; i < (n || 1); i++) sheet.rowHidden[start - 1 + i] = false; },
      hideRow(range) { facade.hideRows(range.getRow(), range.getNumRows()); },
      unhideRow(range) { facade.showRows(range.getRow(), range.getNumRows()); },
      isRowHiddenByUser(r) { return !!sheet.rowHidden[r - 1]; },
      hideColumns() {},
      showColumns() {},
      hideSheet() {
        const visible = store.sheets.filter((s) => !s.hidden && !s.deleted);
        if (visible.length === 1 && visible[0] === sheet) throw R.error("You can't hide all the sheets in a document.");
        sheet.hidden = true;
        return facade;
      },
      showSheet() { sheet.hidden = false; return facade; },
      isSheetHidden() { return sheet.hidden; },
      setTabColor(c) { sheet.tabColor = c; return facade; },
      getTabColor() { return sheet.tabColor; },
      activate() { return facade; },
      showSheetOnly() { return facade; },
      copyTo(target) {
        const tStore = target._store;
        const copy = sheet.clone(tStore.newSheetId());
        let n = 'Copy of ' + sheet.name;
        while (tStore.findSheet(n)) n = n + ' ';
        copy.name = n;
        tStore.sheets.push(copy);
        return wrapSheet(tStore, copy);
      },
      protect() { return makeProtection(store, sheet, null); },
      getProtections() { return R.array(sheet.protections.slice()); },
      sort(column, ascending) {
        const first = sheet.frozenRows + 1;
        const last = sheet.lastRow();
        if (last >= first) {
          makeRange(store, sheet, first, 1, last - first + 1, Math.max(1, sheet.lastColumn()))
            .sort({ column, ascending: ascending !== false });
        }
        return facade;
      },
      getRowGroupDepth(r) { return sheet.rowDepth[r - 1] || 0; },
      getColumnGroupDepth(c) { return sheet.colDepth[c - 1] || 0; },
      getRowGroup(rowIndex, depth) {
        if ((sheet.rowDepth[rowIndex - 1] || 0) < depth) return null;
        let a = rowIndex;
        let b = rowIndex;
        while (a > 1 && (sheet.rowDepth[a - 2] || 0) >= depth) a--;
        while (b < sheet.maxRows && (sheet.rowDepth[b] || 0) >= depth) b++;
        const g = { a, b, d: depth };
        const group = {
          getDepth() { return depth; },
          getRange() { return makeRange(store, sheet, a, 1, b - a + 1, sheet.maxCols); },
          isCollapsed() { return isCollapsed(sheet, g); },
          collapse() { if (!isCollapsed(sheet, g)) sheet.collapsedGroups.push(g); return group; },
          expand() { sheet.collapsedGroups = sheet.collapsedGroups.filter((x) => !(x.a === a && x.b === b && x.d === depth)); return group; },
          remove() { for (let r = a; r <= b; r++) sheet.rowDepth[r - 1] = Math.max(0, (sheet.rowDepth[r - 1] || 0) - 1); },
          getControlIndex() { return sheet.groupControlAfter ? b + 1 : a - 1; }
        };
        return group;
      },
      collapseAllRowGroups() {
        return facade.getRange(1, 1, sheet.maxRows, 1).collapseGroups() && facade;
      },
      expandAllRowGroups() { sheet.collapsedGroups = []; return facade; },
      collapseAllColumnGroups() { return facade; },
      expandAllColumnGroups() { return facade; },
      setRowGroupControlPosition(pos) { sheet.groupControlAfter = String(pos) !== 'BEFORE'; return facade; },
      getRowGroupControlPosition() { return sheet.groupControlAfter ? 'AFTER' : 'BEFORE'; },
      setColumnGroupControlPosition() { return facade; },

      addDeveloperMetadata() {
        addMetadata(store, { type: DM_LOCATION.SHEET, sheetId: sheet.id }, Array.from(arguments));
        return facade;
      },
      getDeveloperMetadata() {
        return R.array(store.metadata.filter((md) => visibleTo(md) && md.location.type === DM_LOCATION.SHEET &&
          md.location.sheetId === sheet.id).map((md) => wrapMetadata(store, md)));
      },
      createDeveloperMetadataFinder() { return makeFinder(store, (md) => md.location.sheetId === sheet.id); },

      setConditionalFormatRules(rules) { sheet.conditionalRules = Array.from(rules || []); },
      getConditionalFormatRules() { return R.array(sheet.conditionalRules.slice()); },
      newChart() { return genericBuilder('EmbeddedChartBuilder'); },
      insertChart(chart) { sheet.charts.push(chart); },
      getCharts() { return R.array(sheet.charts.slice()); },
      removeChart(chart) { sheet.charts = sheet.charts.filter((c) => c !== chart); },
      updateChart() {},
      getFilter() { return null; },
      toString() { return 'Sheet'; }
    };
    Object.defineProperty(facade, '_sheet', { value: sheet });
    Object.defineProperty(facade, '_store', { value: store });
    return facade;
  }

  // ---- spreadsheets --------------------------------------------------------
  function wrapSpreadsheet(store) {
    const facade = {
      getId() { return store.id; },
      getUrl() { return 'https://docs.google.com/spreadsheets/d/' + store.id + '/edit'; },
      getName() { return store.name; },
      rename(name) { store.name = String(name); },
      getSheetByName(name) {
        env.count('Spreadsheet.getSheetByName');
        const s = store.findSheet(name);
        return s ? wrapSheet(store, s) : null;
      },
      getSheetById(id) {
        const s = store.sheets.find((x) => x.id === id);
        return s ? wrapSheet(store, s) : null;
      },
      getSheets() { return R.array(store.sheets.map((s) => wrapSheet(store, s))); },
      getNumSheets() { return store.sheets.length; },
      getActiveSheet() { return wrapSheet(store, store.sheets[0]); },
      setActiveSheet(sheet) { return sheet; },
      getActiveRange() { return null; },
      insertSheet() {
        env.count('Spreadsheet.insertSheet');
        const args = Array.from(arguments);
        let name = null;
        let index = null;
        for (const a of args) {
          if (typeof a === 'string') name = a;
          else if (typeof a === 'number') index = a;
        }
        if (name === null) {
          let n = store.sheets.length + 1;
          while (store.findSheet('Sheet' + n)) n++;
          name = 'Sheet' + n;
        }
        if (store.findSheet(name)) {
          throw R.error('A sheet with the name "' + name + '" already exists. Please enter another name.');
        }
        const sheet = new SheetStore(store.newSheetId(), name, DEFAULT_ROWS, DEFAULT_COLS);
        if (store.totalCells() + DEFAULT_ROWS * DEFAULT_COLS > MAX_CELLS) {
          throw R.error('This action would increase the number of cells in the workbook above the limit of 10000000 cells.');
        }
        if (index === null || index > store.sheets.length) store.sheets.push(sheet);
        else store.sheets.splice(Math.max(0, index), 0, sheet);
        return wrapSheet(store, sheet);
      },
      deleteSheet(sheetFacade) {
        const sheet = sheetFacade._sheet;
        if (store.sheets.length <= 1) throw R.error("You can't remove all the sheets in a document.");
        store.sheets = store.sheets.filter((s) => s !== sheet);
        store.metadata = store.metadata.filter((md) => md.location.sheetId !== sheet.id);
        sheet.deleted = true;
      },
      duplicateActiveSheet() { return wrapSheet(store, store.sheets[0]).copyTo(facade); },
      getSpreadsheetTimeZone() { return store.timeZone; },
      setSpreadsheetTimeZone(zone) {
        if (!tz.resolveZone(zone).valid) throw R.error('Invalid argument: timeZone');
        store.timeZone = String(zone);
      },
      getSpreadsheetLocale() { return store.locale; },
      setSpreadsheetLocale(locale) { store.locale = String(locale); },
      getRange(a1) {
        const m = String(a1).match(/^(?:'((?:[^']|'')+)'|([^!]+))!(.+)$/);
        if (!m) return rangeFromA1(store, store.sheets[0], a1);
        const sheet = store.findSheet((m[1] || m[2]).replace(/''/g, "'"));
        if (!sheet) throw R.error('Range not found');
        return rangeFromA1(store, sheet, m[3]);
      },
      setNamedRange(name, range) { store.namedRanges[name] = { sheetId: range._sheet.id, a1: range.getA1Notation() }; },
      getRangeByName(name) {
        const nr = store.namedRanges[name];
        if (!nr) return null;
        const sheet = store.sheets.find((s) => s.id === nr.sheetId);
        return sheet ? rangeFromA1(store, sheet, nr.a1) : null;
      },
      removeNamedRange(name) { delete store.namedRanges[name]; },
      getNamedRanges() { return R.array([]); },
      addDeveloperMetadata() {
        addMetadata(store, { type: DM_LOCATION.SPREADSHEET }, Array.from(arguments));
        return facade;
      },
      getDeveloperMetadata() {
        return R.array(store.metadata.filter((md) => visibleTo(md) && md.location.type === DM_LOCATION.SPREADSHEET)
          .map((md) => wrapMetadata(store, md)));
      },
      createDeveloperMetadataFinder() { return makeFinder(store, () => true); },
      copy(name) {
        const id = account.copySpreadsheet(store.id, name, env.project.name);
        return wrapSpreadsheet(account.spreadsheets.get(id));
      },
      getOwner() { return { getEmail: () => account.ownerEmail }; },
      getEditors() { return R.array([]); },
      getViewers() { return R.array([]); },
      addEditor() { return facade; },
      addEditors() { return facade; },
      addViewer() { return facade; },
      addViewers() { return facade; },
      removeEditor() { return facade; },
      removeViewer() { return facade; },
      toast() {},
      getFormUrl() { return null; },
      getLastRow() { return store.sheets[0].lastRow(); },
      getLastColumn() { return store.sheets[0].lastColumn(); },
      getBlob() {
        return new Blob(env, Buffer.from('%PDF-1.4 emulated'), 'application/pdf', store.name + '.pdf');
      },
      toString() { return 'Spreadsheet'; }
    };
    Object.defineProperty(facade, '_store', { value: store });
    return facade;
  }

  const container = env.project.options.containerSpreadsheetId;

  return {
    create(name, rows, cols) {
      env.count('SpreadsheetApp.create');
      const id = account.createSpreadsheet(name, env.project.name, rows, cols);
      env.project.openedSpreadsheets.add(id);
      return wrapSpreadsheet(account.spreadsheets.get(id));
    },
    openById(id) {
      env.count('SpreadsheetApp.openById');
      return wrapSpreadsheet(ssOrThrow(id));
    },
    openByUrl(url) {
      const m = String(url).match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (!m) throw R.error('Invalid argument: url');
      return wrapSpreadsheet(ssOrThrow(m[1]));
    },
    open(file) { return wrapSpreadsheet(ssOrThrow(file.getId())); },
    getActiveSpreadsheet() { return container ? wrapSpreadsheet(ssOrThrow(container)) : null; },
    getActive() { return container ? wrapSpreadsheet(ssOrThrow(container)) : null; },
    getActiveSheet() { return container ? wrapSpreadsheet(ssOrThrow(container)).getActiveSheet() : null; },
    getActiveRange() { return null; },
    getUi() { throw R.error('Cannot call SpreadsheetApp.getUi() from this context.'); },
    flush() { env.count('SpreadsheetApp.flush'); },
    newDataValidation() { return genericBuilder('DataValidationBuilder'); },
    newConditionalFormatRule() { return genericBuilder('ConditionalFormatRuleBuilder'); },
    newTextStyle() { return genericBuilder('TextStyleBuilder'); },
    newFilterCriteria() { return genericBuilder('FilterCriteriaBuilder'); },
    newColor() { return genericBuilder('ColorBuilder'); },
    newRichTextValue() {
      let text = '';
      const b = {
        setText(t) { text = String(t); return b; },
        setLinkUrl() { return b; },
        setTextStyle() { return b; },
        build() { return { getText: () => text, getLinkUrl: () => null }; }
      };
      return b;
    },
    DeveloperMetadataVisibility: DM_VISIBILITY,
    DeveloperMetadataLocationType: DM_LOCATION,
    BorderStyle: { DOTTED: 'DOTTED', DASHED: 'DASHED', SOLID: 'SOLID', SOLID_MEDIUM: 'SOLID_MEDIUM', SOLID_THICK: 'SOLID_THICK', DOUBLE: 'DOUBLE' },
    WrapStrategy: { WRAP: 'WRAP', OVERFLOW: 'OVERFLOW', CLIP: 'CLIP' },
    ProtectionType: { RANGE: 'RANGE', SHEET: 'SHEET' },
    Dimension: { COLUMNS: 'COLUMNS', ROWS: 'ROWS' },
    GroupControlTogglePosition: { BEFORE: 'BEFORE', AFTER: 'AFTER' },
    CopyPasteType: { PASTE_NORMAL: 'PASTE_NORMAL', PASTE_VALUES: 'PASTE_VALUES', PASTE_FORMAT: 'PASTE_FORMAT' },
    BandingTheme: { LIGHT_GREY: 'LIGHT_GREY', CYAN: 'CYAN', GREEN: 'GREEN', YELLOW: 'YELLOW', ORANGE: 'ORANGE', BLUE: 'BLUE', TEAL: 'TEAL', GREY: 'GREY' },
    TextDirection: { LEFT_TO_RIGHT: 'LEFT_TO_RIGHT', RIGHT_TO_LEFT: 'RIGHT_TO_LEFT' },
    ChartType: { BAR: 'BAR', COLUMN: 'COLUMN', PIE: 'PIE', LINE: 'LINE', AREA: 'AREA', TABLE: 'TABLE' }
  };
}

module.exports = { SheetStore, SpreadsheetStore, makeSpreadsheetApp, SPREADSHEET_MIME, DEFAULT_ROWS, DEFAULT_COLS,
  colToNum, numToCol, DM_VISIBILITY };
