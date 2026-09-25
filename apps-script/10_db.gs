/**
 * EL BUNKER - Data access layer over Google Sheets.
 *
 * Everything that writes goes through conBloqueo() so two simultaneous
 * submissions can never interleave an append and corrupt the code sequence.
 */

/**
 * The master spreadsheet, opened once per execution. Opening it on every read
 * cost one service call per cell of a date column (see zonaHoraria), which a
 * full rehearsal multiplied into ~100k calls.
 */
var _bookCache = { id: '', book: null };
function libro() {
  var id = PropertiesService.getScriptProperties().getProperty(PROP.SPREADSHEET_ID);
  if (!id) throw new Error('SPREADSHEET_ID no configurado. Corre setupInicial() una vez.');
  if (_bookCache.id !== id || !_bookCache.book) _bookCache = { id: id, book: SpreadsheetApp.openById(id) };
  return _bookCache.book;
}

function hoja(nombre) {
  var h = libro().getSheetByName(nombre);
  if (!h) throw new Error('Falta la hoja "' + nombre + '". Corre setupInicial().');
  return h;
}

/**
 * Serialises every mutation. 30s is generous: a submission writes one row.
 * Without this, two people hitting "Enviar" in the same second can both read
 * "last row = 40" and both write to row 41.
 */
function conBloqueo(fn, esperaMs) {
  var lock = LockService.getScriptLock();
  var ok = lock.tryLock(esperaMs === undefined ? 30000 : esperaMs);
  if (!ok) throw new Error('El sistema esta ocupado procesando otra solicitud. Intenta de nuevo en unos segundos.');
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

/**
 * Header row of a sheet, as an array of column names.
 * Cached per execution: headers only change during setup/migration, which
 * clears the cache, and re-reading them on every write doubled the calls.
 */
var _headerCache = {};
function encabezados(nombreHoja) {
  if (_headerCache[nombreHoja]) return _headerCache[nombreHoja];
  var h = hoja(nombreHoja);
  var ultima = h.getLastColumn();
  if (ultima === 0) return [];
  var cols = h.getRange(1, 1, 1, ultima).getValues()[0].map(function (c) { return String(c).trim(); });
  _headerCache[nombreHoja] = cols;
  return cols;
}

function invalidateHeaderCache() { _headerCache = {}; }

/**
 * Columns whose content must stay exactly as typed. Without plain-text format
 * Sheets turns "0012345" into 12345, "15:00" into a date and so on.
 */
var PLAIN_TEXT_COLUMNS = {
  'REGISTRO': ['id_number', 'normalized_id_number', 'whatsapp', 'normalized_phone', 'birth_date', 'group_code', 'code',
               'original_time', 'arrival_time', 'final_time'],
  '_INTEGRANTES': ['id_number', 'normalized_id_number', 'birth_date', 'group_code'],
  '_CAMBIOS': ['original_time', 'nueva_hora'],
  'AGENDA': ['arrival_time', 'audition_time', 'limite_tolerancia'],
  'CHECK-IN': ['arrival_time', 'final_time', 'check_in_time'],
  'PISTAS': ['final_time'],
  'CONFIG': ['valor']
};

/**
 * Creates missing sheets and appends missing columns at the END of existing
 * ones. Existing data never moves, because every read and write addresses
 * columns by header name. Safe to run on a live base: it only adds.
 * Returns what it changed, for the migration report.
 */
function ensureSchema(book) {
  var report = { hojas_creadas: [], columnas_agregadas: {} };
  sheetDefinitions().forEach(function (def) {
    var name = def[0], columns = def[1];
    var sheet = book.getSheetByName(name);
    if (!sheet) {
      sheet = book.insertSheet(name);
      report.hojas_creadas.push(name);
    }
    var lastCol = sheet.getLastColumn();
    var current = lastCol ? sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function (c) { return String(c).trim(); }) : [];
    var hasHeader = current.some(function (c) { return c !== ''; });
    if (!hasHeader) {
      sheet.getRange(1, 1, 1, columns.length).setValues([columns]);
    } else {
      var missing = columns.filter(function (c) { return current.indexOf(c) === -1; });
      if (missing.length) {
        sheet.getRange(1, current.length + 1, 1, missing.length).setValues([missing]);
        report.columnas_agregadas[name] = missing;
      }
    }
    var width = Math.max(1, sheet.getLastColumn());
    sheet.getRange(1, 1, 1, width).setFontWeight('bold').setBackground('#1D1D1B').setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
    applyPlainTextColumns(sheet, name);
  });
  invalidateHeaderCache();
  return report;
}

function applyPlainTextColumns(sheet, name) {
  var cols = PLAIN_TEXT_COLUMNS[name];
  if (!cols) return;
  var header = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0]
    .map(function (c) { return String(c).trim(); });
  var rows = Math.max(1, sheet.getMaxRows() - 1);
  var dataRows = Math.max(0, sheet.getLastRow() - 1);
  cols.forEach(function (c) {
    var idx = header.indexOf(c);
    if (idx === -1) return;
    // Read what is there BEFORE the format changes: a date in a cell that turns
    // into plain text would otherwise read back as its serial number (46297).
    var existing = dataRows ? sheet.getRange(2, idx + 1, dataRows, 1).getValues() : [];
    sheet.getRange(2, idx + 1, rows, 1).setNumberFormat('@');
    var changed = false;
    var asText = existing.map(function (r) {
      var v = r[0];
      if (v instanceof Date || typeof v === 'number' || typeof v === 'boolean') { changed = true; return [configValueAsText(v)]; }
      return [v];
    });
    if (changed) sheet.getRange(2, idx + 1, dataRows, 1).setValues(asText);
  });
}

/**
 * Reads a whole sheet as an array of objects keyed by header name.
 * Dates are returned as ISO strings so the pure core never sees Date objects.
 */
function leerHoja(nombreHoja) {
  var h = libro().getSheetByName(nombreHoja);
  if (!h) return [];
  var ultimaFila = h.getLastRow();
  var ultimaCol = h.getLastColumn();
  if (ultimaFila < 2 || ultimaCol === 0) return [];

  var valores = h.getRange(1, 1, ultimaFila, ultimaCol).getValues();
  var cols = valores[0].map(function (c) { return String(c).trim(); });
  var filas = [];

  for (var i = 1; i < valores.length; i++) {
    var obj = { _fila: i + 1 };
    var vacia = true;
    for (var j = 0; j < cols.length; j++) {
      if (!cols[j]) continue;
      var v = valores[i][j];
      if (v instanceof Date) v = Utilities.formatDate(v, zonaHoraria(), "yyyy-MM-dd'T'HH:mm:ss");
      obj[cols[j]] = v;
      if (v !== '' && v !== null) vacia = false;
    }
    if (!vacia) filas.push(obj);
  }
  return filas;
}

var _timeZoneCache = '';
function zonaHoraria() {
  if (_timeZoneCache) return _timeZoneCache;
  try { _timeZoneCache = libro().getSpreadsheetTimeZone() || 'America/Bogota'; }
  catch (e) { return 'America/Bogota'; }
  return _timeZoneCache;
}

/**
 * Value as it must be written to a cell. Text that starts with = + - @ is
 * forced to plain text with a leading apostrophe: otherwise a name typed as
 * "=HYPERLINK(...)" becomes a live formula and "+57 300..." becomes #ERROR!.
 */
function cellValue(v) {
  if (v === undefined || v === null) return '';
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  if (typeof v === 'string' && /^[=+\-@]/.test(v)) return "'" + v;
  return v;
}

/** Appends one object as a row, respecting the sheet's header order. */
function agregarFila(nombreHoja, objeto) {
  var h = hoja(nombreHoja);
  var cols = encabezados(nombreHoja);
  var fila = cols.map(function (c) { return cellValue(objeto[c]); });
  h.appendRow(fila);
  return h.getLastRow();
}

/** Appends many rows in ONE write - the only way to stay inside the time limit. */
function agregarFilas(nombreHoja, objetos) {
  if (!objetos.length) return 0;
  var h = hoja(nombreHoja);
  var cols = encabezados(nombreHoja);
  var matriz = objetos.map(function (o) {
    return cols.map(function (c) { return cellValue(o[c]); });
  });
  h.getRange(h.getLastRow() + 1, 1, matriz.length, cols.length).setValues(matriz);
  return matriz.length;
}

/** Updates specific columns of one row, leaving every other column untouched. */
function actualizarFila(nombreHoja, numeroFila, cambios) {
  var h = hoja(nombreHoja);
  var cols = encabezados(nombreHoja);
  for (var clave in cambios) {
    if (!cambios.hasOwnProperty(clave)) continue;
    var idx = cols.indexOf(clave);
    if (idx === -1) continue;
    h.getRange(numeroFila, idx + 1).setValue(cellValue(cambios[clave]));
  }
  return numeroFila;
}

/**
 * Batched version for many rows (issuing 100 codes, re-validating, closing the
 * day). Per touched column it reads the span between the first and the last
 * row once, patches it in memory and writes it back once: 2 calls per column
 * instead of one call per cell. Callers hold the script lock, so nothing else
 * writes these cells in between.
 */
function actualizarFilasEnLote(nombreHoja, actualizaciones) {
  if (!actualizaciones.length) return 0;
  var h = hoja(nombreHoja);
  var cols = encabezados(nombreHoja);
  var porColumna = {};

  actualizaciones.forEach(function (u) {
    for (var clave in u.cambios) {
      if (!u.cambios.hasOwnProperty(clave)) continue;
      var idx = cols.indexOf(clave);
      if (idx === -1) continue;
      (porColumna[idx] = porColumna[idx] || {})[u.fila] = u.cambios[clave];
    }
  });

  var escrituras = 0;
  Object.keys(porColumna).forEach(function (idx) {
    var cambios = porColumna[idx];
    var filas = Object.keys(cambios).map(Number);
    var desde = Math.min.apply(null, filas), hasta = Math.max.apply(null, filas);
    var rango = h.getRange(desde, Number(idx) + 1, hasta - desde + 1, 1);
    var valores = rango.getValues().map(function (fila, i) {
      var n = desde + i;
      return [cellValue(cambios.hasOwnProperty(n) ? cambios[n] : fila[0])];
    });
    rango.setValues(valores);
    escrituras += filas.length;
  });
  return escrituras;
}

function buscarPorCodigo(codigo) {
  var objetivo = normalizarComparable(codigo);
  var filas = leerHoja(HOJA.REGISTRO);
  for (var i = 0; i < filas.length; i++) {
    if (normalizarComparable(filas[i].code) === objetivo) return filas[i];
  }
  return null;
}

function buscarPorCedula(cedula) {
  var objetivo = normalizarCedula(cedula);
  if (!objetivo) return null;
  var filas = leerHoja(HOJA.REGISTRO);
  for (var i = 0; i < filas.length; i++) {
    if (normalizarCedula(filas[i].id_number) === objetivo) return filas[i];
  }
  return null;
}

// ---------------------------------------------------------------------------
// Idempotency
// ---------------------------------------------------------------------------

/**
 * Guarantees an event is processed exactly once.
 *
 * A retried webhook, a double-tapped submit button or a browser that resends on
 * a flaky connection all arrive with the same key and must produce the same
 * answer without writing a second row.
 */
function unaSolaVez(clave, fn) {
  if (!clave) return fn();

  var previo = buscarIdempotencia(clave);
  if (previo) {
    try { return Object.assign({ repetido: true }, JSON.parse(previo)); }
    catch (e) { return { repetido: true, ok: true }; }
  }

  var resultado = fn();
  try {
    agregarFila(HOJA.IDEMPOTENCIA, {
      clave: clave,
      at: ahoraISO(),
      resultado: JSON.stringify(resultado).slice(0, 4000)
    });
  } catch (e) { /* never fail the operation because the ledger failed */ }
  return resultado;
}

function buscarIdempotencia(clave) {
  var h = libro().getSheetByName(HOJA.IDEMPOTENCIA);
  if (!h || h.getLastRow() < 2) return null;
  var valores = h.getRange(2, 1, h.getLastRow() - 1, 3).getValues();
  for (var i = valores.length - 1; i >= 0; i--) {          // newest first
    if (String(valores[i][0]) === String(clave)) return String(valores[i][2]);
  }
  return null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ahoraISO() {
  return Utilities.formatDate(new Date(), zonaHoraria(), "yyyy-MM-dd'T'HH:mm:ss");
}

function nuevoId(prefijo) {
  return prefijo + '-' + Utilities.getUuid().split('-')[0].toUpperCase();
}
