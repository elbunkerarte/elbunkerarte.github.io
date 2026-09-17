/**
 * EL BUNKER - punto de entrada de instalacion.
 *
 * Deliberadamente es la PRIMERA funcion del archivo: el editor de Apps Script
 * preselecciona la primera funcion del proyecto, asi que quien instala solo
 * tiene que pulsar "Ejecutar" sin buscar nada en el desplegable.
 *
 * Es idempotente: se puede correr las veces que haga falta.
 */
function INSTALAR() {
  var resumen = setupInicial();
  var accesos = crearAccesosOperativos();

  var lineas = [
    '',
    '========================================================',
    '  EL BUNKER - INSTALACION COMPLETA',
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
  lineas.push('DESPUES: abre la hoja CONFIG y reemplaza cada');
  lineas.push('PENDIENTE DE COMPLETAR con el dato real aprobado.');
  lineas.push('========================================================');

  console.log(lineas.join('\n'));
  return { base: resumen.spreadsheet_url, accesos: accesos };
}

/**
 * Ensayo completo con datos ficticios: carga 130 inscripciones, emite los 100
 * codigos, simula la jornada, califica con tres jurados y produce el Top 7.
 * Para el "ensayo integral" del cronograma. Limpiar despues con
 * borrarDatosDePrueba("SI-BORRAR").
 */
function ENSAYO() {
  return ensayoIntegral();
}
