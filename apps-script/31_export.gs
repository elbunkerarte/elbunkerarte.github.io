/**
 * EL BUNKER - XLSX export and backups.
 *
 * The backup is a real .xlsx snapshot in Drive, not a copy of the live
 * spreadsheet: a copy keeps editing with the original, a snapshot does not.
 */

function carpetaBackups() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty(PROP.CARPETA_BACKUPS);
  if (id) {
    try { return DriveApp.getFolderById(id); } catch (e) { /* recreate below */ }
  }
  var carpeta = DriveApp.createFolder('EL BUNKER - Respaldos');
  props.setProperty(PROP.CARPETA_BACKUPS, carpeta.getId());
  return carpeta;
}

/** Exports the whole spreadsheet as XLSX and returns a download link. */
function exportarXlsx(nombreArchivo) {
  var id = PropertiesService.getScriptProperties().getProperty(PROP.SPREADSHEET_ID);
  var url = 'https://docs.google.com/spreadsheets/d/' + id + '/export?format=xlsx';

  var respuesta = UrlFetchApp.fetch(url, {
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true
  });
  if (respuesta.getResponseCode() !== 200) {
    throw new Error('No se pudo exportar el XLSX (HTTP ' + respuesta.getResponseCode() + ').');
  }

  var nombre = (nombreArchivo || 'EL-BUNKER-' + Utilities.formatDate(new Date(), zonaHoraria(), 'yyyyMMdd-HHmm')) + '.xlsx';
  var archivo = carpetaBackups().createFile(respuesta.getBlob().setName(nombre));
  return { nombre: nombre, id: archivo.getId(), url: archivo.getUrl(), bytes: archivo.getSize() };
}

function accionExportar(datos, sesion) {
  refrescarVistas();
  var r = exportarXlsx(datos.nombre);
  registrar(sesion.alias, sesion.rol, 'EXPORTAR_XLSX', r.nombre, r.bytes + ' bytes');
  return r;
}

/**
 * Backup = XLSX snapshot + a JSON dump of every sheet.
 * The JSON is what makes a restore possible without Google Sheets.
 */
function accionRespaldar(datos, sesion) {
  var marca = Utilities.formatDate(new Date(), zonaHoraria(), 'yyyyMMdd-HHmmss');
  var xlsx = exportarXlsx('RESPALDO-' + marca);

  var volcado = {};
  [HOJA.REGISTRO, HOJA.AGENDA, HOJA.CHECK_IN, HOJA.JURADO_1, HOJA.JURADO_2,
   HOJA.JURADO_3, HOJA.RESULTADOS, HOJA.INCIDENTES, HOJA.CONFIG,
   HOJA.CAMBIOS, HOJA.USUARIOS, HOJA.LOG].forEach(function (nombre) {
    volcado[nombre] = leerHoja(nombre);
  });

  var json = carpetaBackups().createFile(
    Utilities.newBlob(JSON.stringify({ generado_at: ahoraISO(), version: VERSION_SISTEMA, datos: volcado },
      null, 2), 'application/json', 'RESPALDO-' + marca + '.json'));

  registrar(sesion.alias, sesion.rol, 'RESPALDO', marca, xlsx.bytes + ' bytes xlsx');
  return { xlsx: xlsx, json: { nombre: json.getName(), url: json.getUrl(), id: json.getId() },
           carpeta: carpetaBackups().getUrl() };
}

/** Restores REGISTRO from a JSON backup. Destructive: asks for the file id explicitly. */
function restaurarDesdeJson(idArchivo) {
  var contenido = DriveApp.getFileById(idArchivo).getBlob().getDataAsString();
  var respaldo = JSON.parse(contenido);
  if (!respaldo.datos || !respaldo.datos[HOJA.REGISTRO]) {
    throw new Error('El archivo no parece un respaldo valido de EL BUNKER.');
  }

  return conBloqueo(function () {
    [HOJA.REGISTRO, HOJA.JURADO_1, HOJA.JURADO_2, HOJA.JURADO_3,
     HOJA.INCIDENTES, HOJA.CAMBIOS].forEach(function (nombre) {
      if (!respaldo.datos[nombre]) return;
      limpiarDatos(nombre);
      var limpias = respaldo.datos[nombre].map(function (f) {
        var copia = {};
        for (var k in f) if (f.hasOwnProperty(k) && k !== '_fila') copia[k] = f[k];
        return copia;
      });
      agregarFilas(nombre, limpias);
    });
    refrescarVistas();
    registrar('sistema', 'admin', 'RESTAURAR', idArchivo, respaldo.generado_at);
    return { restaurado_de: respaldo.generado_at, hojas: Object.keys(respaldo.datos).length };
  });
}

/** Daily backup. Installed by setupInicial as a time-based trigger. */
function respaldoAutomatico() {
  try {
    refrescarVistas();
    var r = exportarXlsx('AUTO-' + Utilities.formatDate(new Date(), zonaHoraria(), 'yyyyMMdd-HHmm'));
    registrar('sistema', 'admin', 'RESPALDO_AUTOMATICO', r.nombre, '');
  } catch (e) {
    console.error('Respaldo automatico fallo: ' + e.message);
  }
}
