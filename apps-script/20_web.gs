/**
 * EL BUNKER - HTTP entry points and action router.
 *
 * doGet serves pages, doPost serves actions. Every action is dispatched through
 * one table so permissions are checked in a single place instead of being
 * re-implemented (and forgotten) in each handler.
 */

var PAGINAS_PUBLICAS = ['inscripcion', 'cambio-horario', 'gracias', 'integrantes', 'mi-inscripcion'];

/**
 * Which roles may OPEN each internal page.
 *
 * A valid token is not enough: without this table any signed token opened any
 * panel. The actions were still refused by exigir(), so no data leaked, but a
 * juror could load the admin shell - confusing, and one missing check away from
 * being a real hole.
 */
var ROLES_POR_PAGINA = {
  'admin':      [ROL.ADMIN, ROL.LOGISTICA],
  'checkin':    [ROL.ADMIN, ROL.LOGISTICA, ROL.CHECKIN],
  'jurado':     [ROL.ADMIN, ROL.JURADO],
  'dashboard':  [ROL.ADMIN, ROL.DIRECCION, ROL.LOGISTICA],
  'constancia': [ROL.ADMIN, ROL.LOGISTICA, ROL.CHECKIN]
};

function doGet(e) {
  var params = (e && e.parameter) || {};
  var pagina = params.p || 'inscripcion';

  try {
    if (params.api === '1') return responder(ejecutarAccion(params.accion, params, params.t));

    var sesion = verificarToken(params.t);

    if (PAGINAS_PUBLICAS.indexOf(pagina) === -1) {
      if (!sesion.ok) return renderizar('ui_403', { motivo: sesion.motivo });

      var permitidos = ROLES_POR_PAGINA[pagina];
      if (permitidos && permitidos.indexOf(sesion.rol) === -1) {
        registrar(sesion.alias, sesion.rol, 'ACCESO_DENEGADO', pagina, 'rol sin permiso sobre la pagina');
        return renderizar('ui_403', { motivo: 'ROL_SIN_ACCESO_A_ESTA_PAGINA' });
      }
    }

    var plantilla = {
      'inscripcion':    'ui_inscripcion',
      'cambio-horario': 'ui_cambio',
      'gracias':        'ui_gracias',
      'integrantes':    'ui_integrantes',
      'mi-inscripcion': 'ui_mi_inscripcion',
      'admin':          'ui_admin',
      'checkin':        'ui_checkin',
      'jurado':         'ui_jurado',
      'dashboard':      'ui_dashboard',
      'constancia':     'ui_constancia'
    }[pagina];

    if (!plantilla) return renderizar('ui_403', { motivo: 'PAGINA_DESCONOCIDA' });

    return renderizar(plantilla, {
      token: params.t || '',
      rol: sesion.ok ? sesion.rol : '',
      alias: sesion.ok ? sesion.alias : '',
      codigo: params.code || '',
      grupo: String(params.g || '').toUpperCase().replace(/[^A-Z0-9-]/g, ''),
      clave: String(params.k || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
    });
  } catch (err) {
    console.error(err);
    return renderizar('ui_403', { motivo: 'ERROR: ' + err.message });
  }
}

function doPost(e) {
  var params = (e && e.parameter) || {};
  var cuerpo = {};

  // Accepts both form posts and text/plain JSON (the CORS-simple request the
  // static site uses, which avoids a preflight the Apps Script host ignores).
  if (e && e.postData && e.postData.contents) {
    try { cuerpo = JSON.parse(e.postData.contents); }
    catch (err) { cuerpo = {}; }
  }
  var datos = Object.assign({}, params, cuerpo);
  return responder(ejecutarAccion(datos.accion, datos, datos.t || datos.token));
}


/** accion -> { capacidad, fn }. capacidad null means public. */
function tablaAcciones() {
  return {
    // ---- public -----------------------------------------------------------
    'inscribir':          { capacidad: null, fn: accionInscribir },
    'solicitar_cambio':   { capacidad: null, fn: accionSolicitarCambio },
    'consultar_estado':   { capacidad: null, fn: accionConsultarEstado },
    'agenda_publica':     { capacidad: null, fn: accionAgendaPublica },
    'config_publica':     { capacidad: null, fn: accionConfigPublica },
    'consultar_agrupacion': { capacidad: null, fn: accionConsultarAgrupacion },
    'registrar_integrante': { capacidad: null, fn: accionRegistrarIntegrante },
    'mi_inscripcion':     { capacidad: null, fn: accionMiInscripcion },
    'subir_pista':        { capacidad: null, fn: accionSubirPista },
    'verificar_video':    { capacidad: null, fn: accionVerificarVideo },

    // ---- logistics / admin ------------------------------------------------
    'listar_registro':    { capacidad: 'registro_lectura',   fn: accionListarRegistro },
    'listar_registro_enmascarado': { capacidad: 'registro_enmascarado', fn: accionListarRegistroEnmascarado },
    'listar_agrupaciones': { capacidad: 'agrupaciones',      fn: accionListarAgrupaciones },
    'resolver_coincidencia_grupo': { capacidad: 'agrupaciones', fn: accionResolverCoincidenciaGrupo },
    'actualizar_integrantes': { capacidad: 'agrupaciones',   fn: accionActualizarIntegrantesDeclarados },
    'listar_pistas':      { capacidad: 'pistas',             fn: accionListarPistas },
    'marcar_pista':       { capacidad: 'pistas',             fn: accionMarcarPista },
    'subir_pista_admin':  { capacidad: 'pistas',             fn: accionSubirPistaAdmin },
    'preparar_carpetas_audio': { capacidad: 'pistas',        fn: accionPrepararCarpetasAudio },
    'respaldar_audios':   { capacidad: 'pistas',             fn: accionRespaldarAudios },
    'verificar_videos':   { capacidad: 'videos',             fn: accionVerificarVideos },
    'exportar_contactos': { capacidad: 'comunicacion',       fn: accionExportarContactos },
    'estado_sistema':     { capacidad: '*',                  fn: accionEstadoSistema },
    'auditar_datos_prueba': { capacidad: '*',                fn: accionAuditarDatosDePrueba },
    'revalidar_todo':     { capacidad: 'registro_escritura', fn: accionRevalidarTodo },
    'marcar_elegibilidad':{ capacidad: 'registro_escritura', fn: accionMarcarElegibilidad },
    'asignar_codigos':    { capacidad: 'codigos',            fn: accionAsignarCodigos },
    'listar_cambios':     { capacidad: 'cambios',            fn: accionListarCambios },
    'resolver_cambio':    { capacidad: 'cambios',            fn: accionResolverCambio },
    'bloques_disponibles':{ capacidad: 'cambios',            fn: accionBloquesDisponibles },
    'refrescar_vistas':   { capacidad: 'registro_lectura',   fn: accionRefrescarVistas },
    'exportar':           { capacidad: 'exportar',           fn: accionExportar },
    'respaldar':          { capacidad: 'exportar',           fn: accionRespaldar },
    'mensajes':           { capacidad: 'comunicacion',       fn: accionMensajes },
    'enviar_correos':     { capacidad: 'comunicacion',       fn: accionEnviarCorreos },
    'crear_usuario':      { capacidad: '*',                  fn: accionCrearUsuario },

    // ---- check-in desk ----------------------------------------------------
    'buscar_participante':{ capacidad: 'checkin',   fn: accionBuscarParticipante },
    'registrar_estado':   { capacidad: 'checkin',   fn: accionRegistrarEstado },
    'roster_checkin':     { capacidad: 'checkin',   fn: accionRosterCheckin },
    'sincronizar_cola':   { capacidad: 'checkin',   fn: accionSincronizarCola },
    'plan_contingencia':  { capacidad: 'checkin',   fn: accionPlanContingencia },
    'cerrar_jornada':     { capacidad: 'registro_escritura', fn: accionCerrarJornada },
    'nuevo_incidente':    { capacidad: 'incidentes', fn: accionNuevoIncidente },
    'pistas_evento':      { capacidad: 'pistas_lectura', fn: accionPistasEvento },

    // ---- jury -------------------------------------------------------------
    'lista_evaluacion':   { capacidad: 'evaluar',   fn: accionListaEvaluacion },
    'guardar_evaluacion': { capacidad: 'evaluar',   fn: accionGuardarEvaluacion },

    // ---- results / dashboard ---------------------------------------------
    'dashboard':          { capacidad: 'dashboard', fn: accionDashboard },
    'resultados':         { capacidad: 'resultados', fn: accionResultados },
    'registrar_deliberacion': { capacidad: 'deliberar', fn: accionRegistrarDeliberacion }
  };
}

function ejecutarAccion(nombre, datos, token) {
  if (!nombre) return { ok: false, error: 'Falta el parametro "accion".' };

  var tabla = tablaAcciones();
  var entrada = tabla[nombre];
  if (!entrada) return { ok: false, error: 'Accion desconocida: ' + nombre };

  var sesion = { ok: false, rol: '', alias: 'anonimo' };

  if (entrada.capacidad !== null) {
    sesion = verificarToken(token);
    try {
      if (entrada.capacidad === '*') {
        if (!sesion.ok || sesion.rol !== ROL.ADMIN) throw ErrorAcceso('Solo el rol admin puede hacer esto.');
      } else {
        exigir(sesion, entrada.capacidad);
      }
    } catch (err) {
      return { ok: false, error: err.message, codigo_http: 403, motivo: sesion.motivo || '' };
    }
  }

  try {
    var resultado = entrada.fn(datos || {}, sesion);
    return Object.assign({ ok: true }, resultado);
  } catch (err) {
    console.error(nombre + ': ' + err.stack);
    registrar(sesion.alias, sesion.rol, 'ERROR_' + nombre, '', err.message);
    return { ok: false, error: err.message };
  }
}

function responder(objeto) {
  return ContentService
    .createTextOutput(JSON.stringify(objeto))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Loads an HTML template.
 *
 * The repository keeps one .html file per screen, which is the readable form.
 * The deploy step bundles everything into a single script file and injects a
 * PLANTILLAS registry; this helper makes both layouts work from the same source,
 * so the code that is tested is the code that runs.
 */
function hayRegistroPlantillas(nombre) {
  return typeof PLANTILLAS !== 'undefined' && PLANTILLAS && PLANTILLAS[nombre] !== undefined;
}

function renderizar(plantilla, datos) {
  var t = hayRegistroPlantillas(plantilla)
    ? HtmlService.createTemplate(PLANTILLAS[plantilla])
    : HtmlService.createTemplateFromFile(plantilla);
  for (var k in datos) if (datos.hasOwnProperty(k)) t[k] = datos[k];
  t.BASE_URL = webAppUrl();
  t.ENTORNO = entorno();
  return t.evaluate()
    .setTitle(cfg('evento_nombre', 'EL BUNKER'))
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** Lets an HTML file include another (shared styles, shared scripts). */
function incluir(nombre) {
  return hayRegistroPlantillas(nombre)
    ? PLANTILLAS[nombre]
    : HtmlService.createHtmlOutputFromFile(nombre).getContent();
}

/**
 * Same-origin entry point used by the HtmlService pages via google.script.run.
 * Goes through the exact same dispatcher (and therefore the same permission
 * checks) as the public HTTP endpoints - there is no privileged back door.
 */
function api(carga) {
  carga = carga || {};
  return ejecutarAccion(carga.accion, carga, carga.t || carga.token);
}

/**
 * Source of the pure helpers the browser also needs (e-mail typo hint), so
 * the page runs the exact code the tests cover instead of a copy.
 */
function sharedClientCode() {
  return [editDistance, suggestEmailDomain].map(function (f) { return f.toString(); }).join('\n');
}

/** JSON safe to embed inside a <script> element. */
function jsonForScript(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}
