/**
 * EL BUNKER - Installation, migration of an existing base, accounts and the
 * health check. Everything here is idempotent: it creates what is missing and
 * leaves existing data alone.
 */

function setupInicial() {
  var props = PropertiesService.getScriptProperties();
  var env = environmentName();
  var id = props.getProperty(PROP.SPREADSHEET_ID);
  var book = null;

  if (id) {
    try { book = SpreadsheetApp.openById(id); } catch (e) { book = null; }
  }
  if (!book) {
    book = SpreadsheetApp.create(env === 'test' ? '[PRUEBAS] EL BUNKER - BASE MAESTRA' : 'EL BUNKER - BASE MAESTRA');
    props.setProperty(PROP.SPREADSHEET_ID, book.getId());
    book.setSpreadsheetTimeZone('America/Bogota');
  }

  markSpreadsheetEnvironment(book, env);          // refuses to mix environments
  var schema = ensureSchema(book);

  // Drop the default first sheet only once every real sheet exists.
  ['Sheet1', 'Hoja 1', 'Hoja1'].forEach(function (n) {
    var s = book.getSheetByName(n);
    if (s && book.getSheets().length > 1) book.deleteSheet(s);
  });

  var config = ensureConfig(book, false);
  invalidarCacheConfig();
  secretoHmac();                                   // generate the signing key now
  instalarDisparadores();
  refrescarVistas();

  // An existing admin keeps its link: issuing a new one would revoke the one in use.
  var currentAdmin = leerHoja(HOJA.USUARIOS).filter(function (u) { return normalizarComparable(u.email_o_alias) === 'ADMIN'; })[0];
  var admin = currentAdmin && normalizarTexto(currentAdmin.token)
    ? { url: urlPanel(currentAdmin.rol, currentAdmin.token) }
    : provisionarUsuario('admin', ROL.ADMIN, 'Cuenta principal de administracion');
  registrar('sistema', 'admin', 'SETUP_INICIAL', book.getId(), VERSION_SISTEMA + ' ' + env);

  var resumen = {
    entorno: env,
    spreadsheet_id: book.getId(),
    spreadsheet_url: book.getUrl(),
    web_app_url: urlSegura(),
    enlace_admin: admin.url,
    version: VERSION_SISTEMA,
    esquema: schema,
    config: config
  };
  console.log(JSON.stringify(resumen, null, 2));
  return resumen;
}

function urlSegura() {
  return webAppUrl() || '(despliega la app como Web App para obtener la URL)';
}

/** "1899-12-30T16:00:00"/Date -> "16:00"; "2026-10-02T00:00:00" -> "2026-10-02". */
function configValueAsText(value) {
  if (value instanceof Date) {
    var tz = zonaHoraria();
    if (value.getFullYear() < 1901) return Utilities.formatDate(value, tz, 'HH:mm');
    var time = Utilities.formatDate(value, tz, 'HH:mm');
    return Utilities.formatDate(value, tz, 'yyyy-MM-dd') + (time !== '00:00' ? ' ' + time : '');
  }
  var s = String(value === null || value === undefined ? '' : value);
  var t = s.match(/^1899-12-3\d[T ](\d{2}:\d{2})/);
  if (t) return t[1];
  var d = s.match(/^(\d{4}-\d{2}-\d{2})T00:00:00$/);
  if (d) return d[1];
  return s;
}

/**
 * Makes CONFIG plain text (Sheets otherwise turns "15:00" into a date), adds
 * missing keys and, when migrating, updates values that still hold an
 * iteration-1 default. Anything an operator typed on purpose is kept and
 * reported as a conflict.
 */
function ensureConfig(book, migrate) {
  var sheet = book.getSheetByName(HOJA.CONFIG);
  var defaults = configuracionPorDefecto().slice(1);
  var defaultByKey = {};
  defaults.forEach(function (d) { defaultByKey[d[0]] = d; });

  var last = sheet.getLastRow();
  var rows = last > 1 ? sheet.getRange(2, 1, last - 1, 3).getValues() : [];
  sheet.getRange(2, 2, Math.max(1, sheet.getMaxRows() - 1), 1).setNumberFormat('@');

  var report = { agregadas: [], actualizadas: [], conflictos: [], convertidas: 0 };
  var present = {};
  rows.forEach(function (row, i) {
    var key = String(row[0]).trim();
    if (!key) return;
    present[key] = true;
    var text = configValueAsText(row[1]);
    var rowNumber = i + 2;
    if (text !== row[1]) { sheet.getRange(rowNumber, 2).setValue(text); report.convertidas++; }

    var def = defaultByKey[key];
    if (!def) return;
    if (migrate && text !== def[1]) {
      var olds = (CONFIG_ITERATION1_VALUES[key] || []).map(configValueAsText);
      var replaceable = text === '' || text.indexOf('PENDIENTE') === 0 || olds.indexOf(text) !== -1;
      if (replaceable) {
        sheet.getRange(rowNumber, 2).setValue(def[1]);
        report.actualizadas.push(key + ': "' + text + '" -> "' + def[1] + '"');
      } else {
        report.conflictos.push(key + ': se conserva "' + text + '" (valor nuevo sugerido: "' + def[1] + '")');
      }
    }
    if (migrate && String(row[2]) !== def[2]) sheet.getRange(rowNumber, 3).setValue(def[2]);
  });

  var missing = defaults.filter(function (d) { return !present[d[0]]; });
  if (missing.length) {
    sheet.getRange(sheet.getLastRow() + 1, 1, missing.length, 3).setValues(missing);
    report.agregadas = missing.map(function (d) { return d[0]; });
  }
  sheet.setColumnWidth(1, 240).setColumnWidth(2, 360).setColumnWidth(3, 520);
  invalidarCacheConfig();
  return report;
}

function instalarDisparadores() {
  var existentes = ScriptApp.getProjectTriggers().map(function (t) { return t.getHandlerFunction(); });
  if (existentes.indexOf('respaldoAutomatico') === -1) {
    ScriptApp.newTrigger('respaldoAutomatico').timeBased().everyDays(1).atHour(23).create();
  }
  if (existentes.indexOf('refrescarVistas') === -1) {
    ScriptApp.newTrigger('refrescarVistas').timeBased().everyHours(6).create();
  }
  if (existentes.indexOf('verificarVideosPendientes') === -1) {
    ScriptApp.newTrigger('verificarVideosPendientes').timeBased().everyHours(1).create();
  }
}

/** Operating accounts: one link per person, never shared between roles. */
var OPERATIONAL_ACCOUNTS = [
  ['admin', ROL.ADMIN, 'Cuenta principal de administracion'],
  ['coordinacion', ROL.LOGISTICA, 'Coordinador logistico'],
  ['direccion', ROL.DIRECCION, 'Direccion / gerencia'],
  ['checkin-1', ROL.CHECKIN, 'Mesa de check-in 1'],
  ['checkin-2', ROL.CHECKIN, 'Mesa de check-in 2'],
  ['stage-manager', ROL.CHECKIN, 'Stage manager y cronometro (precola / audicion / salida)'],
  ['tecnico-audio', ROL.CHECKIN, 'Tecnico de audio (pistas)'],
  ['jurado-1', ROL.JURADO, 'jurado 1'],
  ['jurado-2', ROL.JURADO, 'jurado 2'],
  ['jurado-3', ROL.JURADO, 'jurado 3']
];

/** Creates (or refreshes) every operating account and prints its link. */
function crearAccesosOperativos() {
  var salida = OPERATIONAL_ACCOUNTS.map(function (c) { return provisionarUsuario(c[0], c[1], c[2]); });
  console.log(salida.map(function (s) { return s.alias + ' (' + s.rol + '):\n  ' + s.url; }).join('\n\n'));
  return salida;
}

/** Only the accounts that do not exist yet; existing links keep working untouched. */
function ensureOperationalAccounts() {
  var existing = {};
  leerHoja(HOJA.USUARIOS).forEach(function (u) { existing[normalizarComparable(u.email_o_alias)] = true; });
  return OPERATIONAL_ACCOUNTS.filter(function (c) { return !existing[normalizarComparable(c[0])]; })
    .map(function (c) { return provisionarUsuario(c[0], c[1], c[2]); });
}

/** Prints the live access links again without re-issuing tokens. */
function verAccesos() {
  var usuarios = leerHoja(HOJA.USUARIOS).filter(function (u) {
    return normalizarComparable(u.activo) !== 'NO';
  });
  var salida = usuarios.map(function (u) {
    return { alias: u.email_o_alias, rol: u.rol, url: urlPanel(u.rol, u.token), expira: tokenExpiry(u.token) };
  });
  console.log(salida.map(function (s) { return s.alias + ' (' + s.rol + ', vence ' + s.expira + '):\n  ' + s.url; }).join('\n\n'));
  return salida;
}

function tokenExpiry(token) {
  try {
    var payload = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(String(token).split('.')[0])).getDataAsString());
    return Utilities.formatDate(new Date(payload.e), zonaHoraria(), 'yyyy-MM-dd');
  } catch (e) { return '?'; }
}

/**
 * Upgrades an EXISTING base (production) to this version. Only adds: sheets,
 * columns at the end, CONFIG keys; updates CONFIG values that still hold an
 * iteration-1 default. A raw backup is taken first and row counts are compared
 * before and after.
 */
function migrarBase() {
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty(PROP.SPREADSHEET_ID)) throw new Error('No hay base maestra: usa INSTALAR.');
  var book = libro();
  var env = environmentName();

  // Data the migration must never change. _USUARIOS is compared by the users
  // that existed before: the migration adds the new operating accounts on purpose.
  var snapshot = function () {
    var out = {};
    ['REGISTRO', '_CAMBIOS', 'INCIDENTES', 'JURADO_1', 'JURADO_2', 'JURADO_3'].forEach(function (n) {
      out[n] = leerHoja(n).length;
    });
    out.REGISTRO_IDS = leerHoja(HOJA.REGISTRO).map(function (r) { return r.submission_id; }).sort().join(',');
    out.USUARIOS = leerHoja(HOJA.USUARIOS).map(function (u) { return u.email_o_alias + '=' + u.token; }).sort().join(',');
    return out;
  };
  var before = snapshot();
  var safety = rawBackup('PRE-MIGRACION');

  var marker = markSpreadsheetEnvironment(book, env);
  var schema = ensureSchema(book);
  var config = ensureConfig(book, true);
  invalidarCacheConfig();
  instalarDisparadores();
  refrescarVistas();

  var after = snapshot();
  var intact = Object.keys(before).every(function (k) { return before[k] === after[k]; });
  var accounts = ensureOperationalAccounts();
  var report = {
    entorno: env, marca_hoja: marker, version: VERSION_SISTEMA,
    filas_antes: countsOnly(before), filas_despues: countsOnly(after),
    datos_intactos: intact, respaldo_previo: safety, esquema: schema, config: config,
    cuentas_nuevas: accounts.map(function (a) { return a.alias; })
  };
  registrar('sistema', 'admin', 'MIGRAR_V2', book.getId(), JSON.stringify({ intactos: intact, conflictos: config.conflictos.length }));
  if (!intact) throw new Error('ATENCION: cambio el numero de filas durante la migracion. Revisa el respaldo ' + safety.json);
  return report;
}

function countsOnly(snapshot) {
  var out = {};
  Object.keys(snapshot).forEach(function (k) { if (typeof snapshot[k] === 'number') out[k] = snapshot[k]; });
  return out;
}

/** Backup of the sheets exactly as they are, without rebuilding views first (used before a migration). */
function rawBackup(label) {
  var marca = Utilities.formatDate(new Date(), zonaHoraria(), 'yyyyMMdd-HHmmss');
  var xlsx = exportarXlsx('RESPALDO-' + label + '-' + marca);
  var dump = {};
  libro().getSheets().forEach(function (s) { dump[s.getName()] = leerHoja(s.getName()); });
  var json = carpetaBackups().createFile(Utilities.newBlob(
    JSON.stringify({ generado_at: ahoraISO(), version: 'previa', entorno: environmentName(), etiqueta: label, datos: dump }, null, 1),
    'application/json', 'RESPALDO-' + label + '-' + marca + '.json'));
  return { xlsx: xlsx.nombre, json: json.getName(), json_id: json.getId() };
}

/**
 * Health check for the release report: environment keys, schema, forms,
 * triggers, legal flags and - in production - that no test data is present.
 */
function systemHealth() {
  var book = libro();
  var missingColumns = {};
  sheetDefinitions().forEach(function (d) {
    var sheet = book.getSheetByName(d[0]);
    if (!sheet) { missingColumns[d[0]] = 'FALTA LA HOJA'; return; }
    var header = encabezados(d[0]);
    var miss = d[1].filter(function (c) { return header.indexOf(c) === -1; });
    if (miss.length) missingColumns[d[0]] = miss;
  });
  var triggers = ScriptApp.getProjectTriggers().map(function (t) { return t.getHandlerFunction(); });
  var audit = auditTestData();
  var legalPending = ['legal_name', 'nit', 'legal_address', 'data_protection_email', 'institutional_phone', 'terms_version']
    .filter(function (k) { return String(cfg(k, 'PENDIENTE')).indexOf('PENDIENTE') === 0; });
  return {
    version: VERSION_SISTEMA,
    entorno: environmentName(),
    marca_hoja: spreadsheetEnvironment(book),
    llaves_coinciden: environmentName() === spreadsheetEnvironment(book),
    base: book.getName(),
    web_app: urlSegura(),
    web_app_url_ok: /\/exec$/.test(webAppUrl()),
    esquema_completo: Object.keys(missingColumns).length === 0,
    columnas_faltantes: missingColumns,
    disparadores: triggers,
    formularios: {
      inscripcion: cfgBool('inscripciones_abiertas', true), cambios: cfgBool('cambios_abiertos', true),
      integrantes: cfgBool('integrantes_abierto', true), pistas: cfgBool('pistas_abiertas', true)
    },
    evento: { fecha: cfgFecha('evento_fecha', ''), inicio: cfgHora('evento_hora_inicio', ''), sede: cfg('evento_sede', ''),
              edades: cfgNumero('edad_minima', 18) + '-' + cfgNumero('edad_maxima', 30), top: cfgNumero('top_seleccionados', 7) },
    legal: { datos_verificados: cfgBool('datos_legales_verificados', false), pendientes: legalPending,
             terms_version: cfg('terms_version', ''), policy_version: cfg('policy_version', '') },
    datos_de_prueba: audit,
    produccion_limpia: environmentName() !== 'production' || audit.limpio
  };
}

function accionEstadoSistema() {
  return { salud: systemHealth() };
}

/** Full reset of operational data in the TEST environment. Keeps CONFIG and users. */
function borrarDatosDePrueba(confirmacion) {
  exigirEntornoPruebas('LIMPIAR');
  if (confirmacion !== 'SI-BORRAR') {
    throw new Error('Para evitar un borrado accidental, llama borrarDatosDePrueba("SI-BORRAR").');
  }
  return conBloqueo(function () {
    [HOJA.REGISTRO, HOJA.INTEGRANTES, HOJA.DELIBERACIONES, HOJA.JURADO_1, HOJA.JURADO_2, HOJA.JURADO_3,
     HOJA.INCIDENTES, HOJA.CAMBIOS, HOJA.LOG, HOJA.IDEMPOTENCIA].forEach(limpiarDatos);
    var trashed = trashTestFiles();
    resetRehearsalState();
    refrescarVistas();
    registrar('sistema', 'admin', 'BORRAR_DATOS_PRUEBA', '', 'confirmado; archivos a la papelera=' + trashed);
    return { ok: true, archivos_a_papelera: trashed, mensaje: 'Datos operativos de PRUEBAS borrados. CONFIG y usuarios intactos.' };
  });
}

/** Sends the test environment's audio and signature files to the Drive trash. Test only. */
function trashTestFiles() {
  exigirEntornoPruebas('LIMPIAR ARCHIVOS');
  var count = 0;
  [PROP.AUDIO_FOLDER, PROP.SIGNATURES_FOLDER].forEach(function (key) {
    var id = PropertiesService.getScriptProperties().getProperty(key);
    if (!id) return;
    try {
      var folders = DriveApp.getFolderById(id).getFolders();
      while (folders.hasNext()) { folders.next().setTrashed(true); count++; }
    } catch (e) { /* folder already gone */ }
  });
  return count;
}

/**
 * Deletes specific registrations by submission_id (with their group members and
 * change requests). Meant for test rows that reached a live base; a raw backup
 * is taken first and every removed ID is logged.
 */
function quitarInscripciones(ids, confirmacion) {
  if (confirmacion !== 'SI-QUITAR') throw new Error('BLOQUEADO: confirma con SI-QUITAR.');
  var wanted = {};
  (ids || []).forEach(function (id) { wanted[normalizarComparable(id)] = true; });
  return conBloqueo(function () {
    var rows = leerHoja(HOJA.REGISTRO).filter(function (r) { return wanted[normalizarComparable(r.submission_id)]; });
    if (!rows.length) return { quitadas: [], mensaje: 'No hay filas con esos IDs: nada que quitar.' };
    var backup = rawBackup('ANTES-DE-QUITAR');
    var groups = {}, codes = {};
    rows.forEach(function (r) {
      if (r.group_code) groups[normalizarComparable(r.group_code)] = true;
      if (r.code) codes[normalizarComparable(r.code)] = true;
    });
    var removeWhere = function (sheetName, test) {
      var sheet = libro().getSheetByName(sheetName);
      if (!sheet) return 0;
      var doomed = leerHoja(sheetName).filter(test).map(function (r) { return r._fila; }).sort(function (a, b) { return b - a; });
      doomed.forEach(function (n) { sheet.deleteRow(n); });
      return doomed.length;
    };
    var removed = {
      registro: removeWhere(HOJA.REGISTRO, function (r) { return wanted[normalizarComparable(r.submission_id)]; }),
      integrantes: removeWhere(HOJA.INTEGRANTES, function (m) { return groups[normalizarComparable(m.group_code)]; }),
      cambios: removeWhere(HOJA.CAMBIOS, function (c) { return codes[normalizarComparable(c.code)]; })
    };
    registrar('sistema', 'admin', 'QUITAR_INSCRIPCIONES', rows.map(function (r) { return r.submission_id; }).join(','),
              JSON.stringify(removed) + ' respaldo=' + backup.json);
    refrescarVistas();
    return { quitadas: rows.map(function (r) { return r.submission_id; }), filas: removed, respaldo: backup };
  });
}
