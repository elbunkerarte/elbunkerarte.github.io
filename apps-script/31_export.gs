/**
 * EL BUNKER - XLSX export, labelled backups, audio backup and restore.
 *
 * A backup is a real .xlsx snapshot plus a JSON dump of every source sheet.
 * The XLSX is for people (it keeps the collapsible group outline); the JSON is
 * what makes a restore possible. Both go to the backups folder in Drive.
 */

/** Sheets that hold original data (everything else is rebuilt from these). */
var SOURCE_SHEETS = ['REGISTRO', '_INTEGRANTES', 'JURADO_1', 'JURADO_2', 'JURADO_3', 'INCIDENTES',
                     '_CAMBIOS', '_DELIBERACIONES'];

/** Every sheet that goes into a JSON backup. */
var BACKUP_SHEETS = SOURCE_SHEETS.concat(['AGENDA', 'CHECK-IN', 'AGRUPACIONES', 'PISTAS', 'RESULTADOS',
                                          'CONFIG', '_USUARIOS', '_LOG']);

/** Labels offered in the admin panel: the brief asks for one backup per milestone. */
var BACKUP_LABELS = ['MANUAL', 'DIARIO', 'PRE-EVENTO', 'AGENDA', 'POST-EVENTO', 'RESULTADOS', 'ENSAYO'];

function carpetaBackups() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty(PROP.CARPETA_BACKUPS);
  if (id) {
    try {
      var existing = DriveApp.getFolderById(id);
      if (!existing.isTrashed()) return existing;
    } catch (e) { /* recreate below */ }
  }
  var carpeta = DriveApp.createFolder(envFolderName('EL BUNKER - Respaldos'));
  props.setProperty(PROP.CARPETA_BACKUPS, carpeta.getId());
  return carpeta;
}

/** Exports the whole spreadsheet as XLSX into the backups folder. */
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

/** XLSX + JSON with a label, so each milestone backup is easy to find. */
function backupNow(label) {
  var tag = BACKUP_LABELS.indexOf(String(label || '').toUpperCase()) !== -1 ? String(label).toUpperCase() : 'MANUAL';
  var marca = Utilities.formatDate(new Date(), zonaHoraria(), 'yyyyMMdd-HHmmss');
  refrescarVistas();
  var xlsx = exportarXlsx('RESPALDO-' + tag + '-' + marca);

  var volcado = {};
  BACKUP_SHEETS.forEach(function (nombre) { volcado[nombre] = leerHoja(nombre); });

  var json = carpetaBackups().createFile(
    Utilities.newBlob(JSON.stringify({ generado_at: ahoraISO(), version: VERSION_SISTEMA, entorno: environmentName(),
                                       etiqueta: tag, datos: volcado }, null, 1),
      'application/json', 'RESPALDO-' + tag + '-' + marca + '.json'));
  return { etiqueta: tag, xlsx: xlsx, json: { nombre: json.getName(), url: json.getUrl(), id: json.getId() },
           carpeta: carpetaBackups().getUrl() };
}

function accionRespaldar(datos, sesion) {
  var r = backupNow(datos.etiqueta);
  registrar(sesion.alias, sesion.rol, 'RESPALDO', r.etiqueta, r.xlsx.bytes + ' bytes xlsx');
  return r;
}

/** Daily backup (XLSX + JSON, so it can be restored). Installed as a time trigger. */
function respaldoAutomatico() {
  try {
    var r = backupNow('DIARIO');
    registrar('sistema', 'admin', 'RESPALDO_AUTOMATICO', r.xlsx.nombre, '');
  } catch (e) {
    console.error('Respaldo automatico fallo: ' + e.message);
    registrar('sistema', 'admin', 'RESPALDO_AUTOMATICO_FALLO', '', e.message);
  }
}

/**
 * Copies the whole Audio/B-XXX tree into a dated backup folder. Resumable:
 * files already copied are skipped, and it stops cleanly before the 6-minute
 * limit, so running it again finishes the job.
 */
function backupAudio() {
  var started = Date.now();
  var root = audioRootFolder();
  var target = childFolder(carpetaBackups(), 'AUDIO-' + Utilities.formatDate(new Date(), zonaHoraria(), 'yyyyMMdd'));
  var copied = 0, skipped = 0, complete = true;
  var folders = root.getFolders();
  while (folders.hasNext()) {
    var src = folders.next();
    var dst = childFolder(target, src.getName());
    var files = src.getFiles();
    while (files.hasNext()) {
      if (Date.now() - started > 4.5 * 60 * 1000) { complete = false; break; }
      var f = files.next();
      if (dst.getFilesByName(f.getName()).hasNext()) { skipped++; continue; }
      f.makeCopy(f.getName(), dst);
      copied++;
    }
    if (!complete) break;
  }
  return { copiados: copied, ya_estaban: skipped, completo: complete, carpeta: target.getUrl() };
}

function accionRespaldarAudios(datos, sesion) {
  var r = backupAudio();
  registrar(sesion.alias, sesion.rol, 'RESPALDO_AUDIOS', '', JSON.stringify(r));
  return r;
}

/**
 * Restores the SOURCE sheets from a JSON backup and rebuilds every view.
 * Destructive, so it demands the file id and an explicit confirmation word.
 */
function restaurarDesdeJson(idArchivo, confirmacion) {
  if (confirmacion !== 'SI-RESTAURAR') {
    throw new Error('Para restaurar llama restaurarDesdeJson("<id del archivo>", "SI-RESTAURAR"). ' +
                    'Esto reemplaza las hojas de datos por el contenido del respaldo.');
  }
  var respaldo = JSON.parse(DriveApp.getFileById(idArchivo).getBlob().getDataAsString());
  if (!respaldo.datos || !respaldo.datos.REGISTRO) {
    throw new Error('El archivo no parece un respaldo valido de EL BUNKER.');
  }
  if (respaldo.entorno && respaldo.entorno !== environmentName()) {
    throw new Error('BLOQUEADO: el respaldo es del entorno "' + respaldo.entorno + '" y este proyecto es "' +
                    environmentName() + '". No se mezclan datos entre entornos.');
  }

  return conBloqueo(function () {
    var restored = {};
    SOURCE_SHEETS.forEach(function (nombre) {
      if (!respaldo.datos[nombre]) return;
      limpiarDatos(nombre);
      var limpias = respaldo.datos[nombre].map(function (f) {
        var copia = {};
        for (var k in f) if (f.hasOwnProperty(k) && k !== '_fila') copia[k] = f[k];
        return copia;
      });
      agregarFilas(nombre, limpias);
      restored[nombre] = limpias.length;
    });
    refrescarVistas();
    registrar('sistema', 'admin', 'RESTAURAR', idArchivo, respaldo.generado_at);
    return { restaurado_de: respaldo.generado_at, etiqueta: respaldo.etiqueta || '', filas: restored };
  });
}

/**
 * Editor entry point for the recovery manual: reads the file id from CONFIG
 * (restaurar_desde) and the confirmation word (restaurar_confirmacion), because
 * the editor's Run button can not pass arguments.
 */
function RESTAURAR() {
  invalidarCacheConfig();
  var id = cfg('restaurar_desde', '');
  var word = cfg('restaurar_confirmacion', '');
  if (!id) throw new Error('Escribe en CONFIG > restaurar_desde el ID del archivo JSON de respaldo.');
  var r = restaurarDesdeJson(String(id).trim(), String(word).trim());
  console.log('Restaurado: ' + JSON.stringify(r));
  return r;
}
