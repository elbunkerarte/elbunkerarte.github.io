/**
 * EL BUNKER - One-time setup.
 *
 * Run setupInicial() once from the Apps Script editor. It is idempotent: it
 * creates what is missing and leaves existing data alone.
 */

function setupInicial() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty(PROP.SPREADSHEET_ID);
  var libroNuevo;

  if (id) {
    try { libroNuevo = SpreadsheetApp.openById(id); }
    catch (e) { id = null; }
  }
  if (!id) {
    libroNuevo = SpreadsheetApp.create('EL BUNKER - BASE MAESTRA');
    props.setProperty(PROP.SPREADSHEET_ID, libroNuevo.getId());
    libroNuevo.setSpreadsheetTimeZone('America/Bogota');
  }

  var definiciones = [
    [HOJA.REGISTRO, COLUMNAS_REGISTRO],
    [HOJA.AGENDA, COLUMNAS_AGENDA],
    [HOJA.CHECK_IN, COLUMNAS_CHECK_IN],
    [HOJA.JURADO_1, COLUMNAS_JURADO],
    [HOJA.JURADO_2, COLUMNAS_JURADO],
    [HOJA.JURADO_3, COLUMNAS_JURADO],
    [HOJA.RESULTADOS, COLUMNAS_RESULTADOS],
    [HOJA.DASHBOARD, ['INDICADOR', 'VALOR']],
    [HOJA.INCIDENTES, COLUMNAS_INCIDENTES],
    [HOJA.CONFIG, ['clave', 'valor', 'descripcion']],
    [HOJA.CAMBIOS, COLUMNAS_CAMBIOS],
    [HOJA.USUARIOS, COLUMNAS_USUARIOS],
    [HOJA.LOG, COLUMNAS_LOG],
    [HOJA.IDEMPOTENCIA, COLUMNAS_IDEMPOTENCIA]
  ];

  definiciones.forEach(function (d) {
    var h = libroNuevo.getSheetByName(d[0]);
    if (!h) h = libroNuevo.insertSheet(d[0]);
    if (h.getLastRow() === 0 || String(h.getRange(1, 1).getValue()).trim() === '') {
      h.getRange(1, 1, 1, d[1].length).setValues([d[1]]);
    }
    h.getRange(1, 1, 1, Math.max(1, h.getLastColumn())).setFontWeight('bold').setBackground('#1f2937').setFontColor('#ffffff');
    h.setFrozenRows(1);
  });

  // Drop the default "Hoja 1" only once every real sheet exists.
  ['Sheet1', 'Hoja 1', 'Hoja1'].forEach(function (n) {
    var s = libroNuevo.getSheetByName(n);
    if (s && libroNuevo.getSheets().length > 1) libroNuevo.deleteSheet(s);
  });

  // CONFIG defaults, only for keys that do not exist yet.
  var hojaConfig = libroNuevo.getSheetByName(HOJA.CONFIG);
  var existentes = {};
  if (hojaConfig.getLastRow() > 1) {
    hojaConfig.getRange(2, 1, hojaConfig.getLastRow() - 1, 1).getValues()
      .forEach(function (f) { existentes[String(f[0]).trim()] = true; });
  }
  var porDefecto = configuracionPorDefecto().slice(1);
  var faltantes = porDefecto.filter(function (f) { return !existentes[f[0]]; });
  if (faltantes.length) {
    hojaConfig.getRange(hojaConfig.getLastRow() + 1, 1, faltantes.length, 3).setValues(faltantes);
  }
  hojaConfig.setColumnWidth(1, 220).setColumnWidth(2, 320).setColumnWidth(3, 460);

  invalidarCacheConfig();
  secretoHmac();                                   // generate the signing key now
  instalarDisparadores();
  refrescarVistas();

  var admin = provisionarUsuario('admin', ROL.ADMIN, 'Cuenta principal de administracion');

  registrar('sistema', 'admin', 'SETUP_INICIAL', libroNuevo.getId(), VERSION_SISTEMA);

  var resumen = {
    spreadsheet_id: libroNuevo.getId(),
    spreadsheet_url: libroNuevo.getUrl(),
    web_app_url: urlSegura(),
    enlace_admin: admin.url,
    version: VERSION_SISTEMA
  };
  console.log(JSON.stringify(resumen, null, 2));
  return resumen;
}

function urlSegura() {
  try { return ScriptApp.getService().getUrl(); }
  catch (e) { return '(despliega la app como Web App para obtener la URL)'; }
}

function instalarDisparadores() {
  var existentes = ScriptApp.getProjectTriggers().map(function (t) { return t.getHandlerFunction(); });
  if (existentes.indexOf('respaldoAutomatico') === -1) {
    ScriptApp.newTrigger('respaldoAutomatico').timeBased().everyDays(1).atHour(23).create();
  }
  if (existentes.indexOf('refrescarVistas') === -1) {
    ScriptApp.newTrigger('refrescarVistas').timeBased().everyHours(6).create();
  }
}

/**
 * Creates the five operating accounts and prints their access links.
 * Run once, hand each link to its person, never share links between roles.
 */
function crearAccesosOperativos() {
  var cuentas = [
    ['admin', ROL.ADMIN, 'Cuenta principal de administracion'],
    ['coordinacion', ROL.LOGISTICA, 'Coordinador logistico'],
    ['direccion', ROL.DIRECCION, 'Direccion / gerencia'],
    ['checkin-1', ROL.CHECKIN, 'Mesa de check-in 1'],
    ['checkin-2', ROL.CHECKIN, 'Mesa de check-in 2'],
    ['jurado-1', ROL.JURADO, 'jurado 1'],
    ['jurado-2', ROL.JURADO, 'jurado 2'],
    ['jurado-3', ROL.JURADO, 'jurado 3']
  ];
  var salida = cuentas.map(function (c) { return provisionarUsuario(c[0], c[1], c[2]); });
  console.log(salida.map(function (s) { return s.alias + ' (' + s.rol + '):\n  ' + s.url; }).join('\n\n'));
  return salida;
}

/** Prints the live access links again without re-issuing tokens. */
function verAccesos() {
  var usuarios = leerHoja(HOJA.USUARIOS).filter(function (u) {
    return normalizarComparable(u.activo) !== 'NO';
  });
  var salida = usuarios.map(function (u) {
    return { alias: u.email_o_alias, rol: u.rol, url: urlPanel(u.rol, u.token) };
  });
  console.log(salida.map(function (s) { return s.alias + ' (' + s.rol + '):\n  ' + s.url; }).join('\n\n'));
  return salida;
}

/** Full reset of operational data. Keeps CONFIG and users. Asks for confirmation. */
function borrarDatosDePrueba(confirmacion) {
  if (confirmacion !== 'SI-BORRAR') {
    throw new Error('Para evitar un borrado accidental, llama borrarDatosDePrueba("SI-BORRAR").');
  }
  return conBloqueo(function () {
    [HOJA.REGISTRO, HOJA.JURADO_1, HOJA.JURADO_2, HOJA.JURADO_3,
     HOJA.INCIDENTES, HOJA.CAMBIOS, HOJA.LOG, HOJA.IDEMPOTENCIA].forEach(limpiarDatos);
    refrescarVistas();
    registrar('sistema', 'admin', 'BORRAR_DATOS_PRUEBA', '', 'confirmado');
    return { ok: true, mensaje: 'Datos operativos borrados. CONFIG y usuarios intactos.' };
  });
}
