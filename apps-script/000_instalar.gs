/**
 * EL BUNKER - editor entry points.
 *
 * INSTALAR is deliberately the FIRST function of the project: the Apps Script
 * editor preselects the first function, so whoever installs only has to press
 * "Ejecutar". The others are picked from the function dropdown:
 *
 *   INSTALAR          new production installation (idempotent)
 *   INSTALAR_PRUEBAS  turns THIS project into the test environment and installs it
 *   MIGRAR            upgrades an existing base to this version (only adds; backs up first)
 *   VERIFICAR         health report: environment keys, schema, legal flags, test data
 *   ENSAYO            full rehearsal with fictitious data (test environment only)
 *   LIMPIAR           wipes operational data (test environment only)
 *   RESTAURAR         restores a JSON backup (see docs/MANUAL-RECUPERACION.md)
 */
function INSTALAR() {
  var resumen = setupInicial();
  var accesos = crearAccesosOperativos();

  var lineas = [
    '',
    '========================================================',
    '  EL BUNKER - INSTALACION COMPLETA (' + (resumen.entorno === 'test' ? 'PRUEBAS' : 'PRODUCCION') + ')',
    '========================================================',
    '',
    'BASE MAESTRA (tu "Excel"):',
    '  ' + resumen.spreadsheet_url,
    '',
    'ENLACES DE ACCESO (entrega a cada persona SOLO el suyo):'
  ];
  accesos.forEach(function (a) {
    lineas.push('  ' + a.alias + ' [' + a.rol + ']');
    lineas.push('    ' + a.url);
  });
  lineas.push('');
  lineas.push('SIGUIENTE PASO OBLIGATORIO:');
  lineas.push('  Implementar > Nueva implementacion > Aplicacion web');
  lineas.push('    Ejecutar como:    Yo');
  lineas.push('    Quien tiene acceso: Cualquier usuario');
  lineas.push('  Sin esto los enlaces de arriba no abren.');
  lineas.push('');
  lineas.push('DESPUES: revisa la hoja CONFIG. Los datos legales vienen marcados');
  lineas.push('datos_legales_verificados = NO hasta que alguien los verifique.');
  lineas.push('========================================================');
  console.log(lineas.join('\n'));
  return { base: resumen.spreadsheet_url, accesos: accesos };
}

/**
 * Makes THIS project the test environment and installs it.
 * Run it once, in a NEW and empty Apps Script project: it creates its own
 * spreadsheet (named [PRUEBAS] ...), separate from production. From then on
 * ENSAYO and LIMPIAR work here and stay blocked in production.
 */
function INSTALAR_PRUEBAS() {
  PropertiesService.getScriptProperties().setProperty(PROP.ENVIRONMENT, 'test');
  var r = INSTALAR();
  console.log('\n*** ESTE PROYECTO ES EL ENTORNO DE PRUEBAS ***');
  console.log('Sus datos son ficticios y desechables. Produccion no se ve afectada.');
  return r;
}

/** Upgrades an existing base (production) to this version. Only adds; backs up first. */
function MIGRAR() {
  var r = migrarBase();
  var lineas = [
    '', '==================== MIGRACION ====================',
    'Entorno: ' + r.entorno + ' · marca de la hoja: ' + r.marca_hoja + ' · version ' + r.version,
    'Datos intactos (filas antes = despues): ' + (r.datos_intactos ? 'SI' : 'NO'),
    'Filas: ' + JSON.stringify(r.filas_despues),
    'Respaldo previo: ' + r.respaldo_previo.xlsx + ' + ' + r.respaldo_previo.json,
    'Hojas creadas: ' + (r.esquema.hojas_creadas.join(', ') || 'ninguna'),
    'Columnas agregadas: ' + JSON.stringify(r.esquema.columnas_agregadas),
    'CONFIG actualizada: ' + (r.config.actualizadas.join(' | ') || 'nada'),
    'CONFIG agregada: ' + (r.config.agregadas.join(', ') || 'nada'),
    'CONFIG en conflicto (se conserva lo que habia): ' + (r.config.conflictos.join(' | ') || 'ninguno'),
    'Cuentas nuevas: ' + (r.cuentas_nuevas.join(', ') || 'ninguna'),
    'SIGUIENTE PASO: Gestionar implementaciones > lapiz > Version nueva > Implementar.',
    '===================================================='
  ];
  console.log(lineas.join('\n'));
  return r;
}

/** Health report used before every release. */
function VERIFICAR() {
  var h = systemHealth();
  console.log(JSON.stringify(h, null, 2));
  return h;
}

/**
 * Full rehearsal with fictitious data: 130 registrations, group members,
 * codes, audio folders, schedule changes, the event day, three jurors, results
 * and a backup. Resumable (runs again by itself if it hits the time limit).
 */
function ENSAYO() {
  exigirEntornoPruebas('ENSAYO');
  return ensayoIntegral();
}

/**
 * Wipes operational data (registrations, members, evaluations, incidents,
 * changes, log) and the test audio/signature files; keeps CONFIG and users.
 * No arguments because the editor's Run button can not pass any.
 */
function LIMPIAR() {
  exigirEntornoPruebas('LIMPIAR');
  var r = borrarDatosDePrueba('SI-BORRAR');
  console.log(r.mensaje);
  return r;
}
