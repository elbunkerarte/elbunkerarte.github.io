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
  exigirEntornoPruebas('ENSAYO');
  return ensayoIntegral();
}

/**
 * Convierte ESTE proyecto en el entorno de PRUEBAS y lo instala.
 *
 * Se ejecuta una sola vez, en un proyecto de Apps Script NUEVO y vacio: crea su
 * propia hoja de calculo, separada de la de produccion. A partir de ahi ENSAYO y
 * LIMPIAR funcionan aqui y siguen bloqueados en produccion.
 */
function INSTALAR_PRUEBAS() {
  PropertiesService.getScriptProperties().setProperty(PROP.ENTORNO, 'PRUEBAS');
  var r = INSTALAR();
  console.log('\n*** ESTE PROYECTO ES EL ENTORNO DE PRUEBAS ***');
  console.log('Sus datos son ficticios y desechables. Produccion no se ve afectada.');
  return r;
}

/**
 * Borra los datos operativos (inscripciones, evaluaciones, incidentes, cambios,
 * bitacora) y deja CONFIG y los usuarios intactos.
 *
 * Existe como funcion sin argumentos porque el boton "Ejecutar" del editor no
 * permite pasar parametros, y es justo lo que hace falta despues del ensayo
 * integral y antes de abrir inscripciones reales.
 */
function LIMPIAR() {
  exigirEntornoPruebas('LIMPIAR');
  var r = borrarDatosDePrueba('SI-BORRAR');
  console.log('Datos operativos borrados. CONFIG y usuarios intactos.');
  return r;
}
