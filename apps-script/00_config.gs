/**
 * EL BUNKER - Configuration, sheet schema and shared constants.
 *
 * Nothing legal or identifying is hardcoded here: every such value lives in the
 * CONFIG sheet so a non-technical operator can change it without touching code.
 */

var VERSION_SISTEMA = '2.0.0';

/** Script Properties keys (the Apps Script equivalent of environment vars). */
var PROP = {
  SPREADSHEET_ID: 'SPREADSHEET_ID',
  SECRETO_HMAC: 'SECRETO_HMAC',
  CARPETA_BACKUPS: 'CARPETA_BACKUPS',
  SITIO_PUBLICO: 'SITIO_PUBLICO',
  ENVIRONMENT: 'ENVIRONMENT',
  AUDIO_FOLDER: 'AUDIO_FOLDER',
  SIGNATURES_FOLDER: 'SIGNATURES_FOLDER',
  // Iteration-1 key, still honoured so an already-installed test project stays a test project.
  ENTORNO: 'ENTORNO'
};

// ---------------------------------------------------------------------------
// Environments
// ---------------------------------------------------------------------------

/**
 * "production" or "test", read from the ENVIRONMENT Script Property.
 *
 * Each environment is a separate Apps Script project with its own spreadsheet,
 * so they never share a row. Anything that is not an explicit "test" is
 * production: forgetting to set the property can never turn production into a
 * place where data may be wiped.
 */
function environmentName() {
  var props = PropertiesService.getScriptProperties();
  var declared = String(props.getProperty(PROP.ENVIRONMENT) || '').trim().toLowerCase();
  if (declared === 'test') return 'test';
  if (declared) return 'production';
  if (normalizarComparable(props.getProperty(PROP.ENTORNO)) === 'PRUEBAS') return 'test';
  return 'production';
}

/** Spanish label used by the screens: PRUEBAS / PRODUCCION. */
function entorno() {
  return environmentName() === 'test' ? 'PRUEBAS' : 'PRODUCCION';
}

function esPruebas() {
  return environmentName() === 'test';
}

/**
 * Second key of the environment lock: a marker stored inside the spreadsheet
 * itself (developer metadata, invisible to operators). A project property can
 * be edited by mistake; the marker travels with the data it protects.
 */
var ENV_METADATA_KEY = 'bunker_environment';

function spreadsheetEnvironment(ss) {
  var book = ss || libro();
  var found = book.createDeveloperMetadataFinder().withKey(ENV_METADATA_KEY).find();
  return found.length ? String(found[0].getValue()) : '';
}

/**
 * Stamps the spreadsheet with its environment once. A marked spreadsheet is
 * never re-labelled: a production base can not become a test base by running
 * the wrong installer, and vice versa.
 */
function markSpreadsheetEnvironment(ss, env) {
  var current = spreadsheetEnvironment(ss);
  if (current === env) return env;
  if (current) {
    throw new Error('BLOQUEADO: esta hoja de calculo esta marcada como "' + current +
      '" y este proyecto se declara "' + env + '". No se mezclan entornos: revisa ENVIRONMENT ' +
      'en Configuracion del proyecto > Propiedades del script.');
  }
  ss.addDeveloperMetadata(ENV_METADATA_KEY, env);
  return env;
}

/**
 * Stops any destructive or fake-data operation outside the test environment.
 * BOTH keys must say "test": the project property and the spreadsheet marker.
 * It is an executable gate, not a warning in a manual.
 */
function exigirEntornoPruebas(operacion) {
  var declared = environmentName();
  var marker = '';
  try { marker = spreadsheetEnvironment(); } catch (e) { marker = ''; }
  if (declared === 'test' && marker === 'test') return true;
  throw new Error(
    'BLOQUEADO: "' + operacion + '" solo puede correr en el entorno de PRUEBAS.\n' +
    'Proyecto: ENVIRONMENT=' + declared + ' · hoja de calculo: ' + (marker || 'sin marca (se trata como produccion)') + '.\n' +
    'Produccion contiene (o contendra) inscripciones reales y nunca recibe datos de prueba.');
}

var HOJA = {
  REGISTRO: 'REGISTRO',
  AGENDA: 'AGENDA',
  CHECK_IN: 'CHECK-IN',
  JURADO_1: 'JURADO_1',
  JURADO_2: 'JURADO_2',
  JURADO_3: 'JURADO_3',
  RESULTADOS: 'RESULTADOS',
  DASHBOARD: 'DASHBOARD',
  INCIDENTES: 'INCIDENTES',
  AGRUPACIONES: 'AGRUPACIONES',
  PISTAS: 'PISTAS',
  CONFIG: 'CONFIG',
  // Internal sheets (prefixed so the operator knows not to edit them by hand)
  INTEGRANTES: '_INTEGRANTES',
  DELIBERACIONES: '_DELIBERACIONES',
  CAMBIOS: '_CAMBIOS',
  USUARIOS: '_USUARIOS',
  LOG: '_LOG',
  IDEMPOTENCIA: '_IDEMPOTENCIA'
};

/**
 * REGISTRO is the single source of truth: one row per project (a soloist, a duo
 * or a whole group). AGENDA, CHECK-IN, AGRUPACIONES, PISTAS, RESULTADOS and
 * DASHBOARD are rebuilt from it, which is why a participant can never appear
 * with two different schedules in two different tabs.
 *
 * Columns are addressed by header name, so new columns are appended at the end
 * and existing data never moves (see ensureSchema).
 */
var COLUMNAS_REGISTRO = [
  'submission_id', 'code', 'created_at', 'source',
  'full_name', 'id_number', 'birth_date', 'age',
  'neighborhood_sector', 'residence', 'email', 'whatsapp',
  'artistic_name', 'discipline', 'genre_or_proposal', 'artist_description',
  'audition_description', 'video_url', 'technical_needs',
  'normalized_id_number', 'normalized_email', 'normalized_phone',
  'eligibility_status', 'duplicate_flag', 'duplicate_reason', 'registro_principal',
  'validation_notes',
  'consent_terms', 'consent_data', 'consent_whatsapp', 'consent_image',
  'consent_version', 'availability_statement',
  'original_block', 'original_time', 'arrival_time',
  'final_block', 'final_time',
  'change_requested', 'change_status', 'changed_at', 'changed_by',
  'issued_at', 'issued_by',
  'check_in_time', 'attendance_status', 'audition_status',
  'contingencia_desde', 'operador_check_in',
  'notes',
  // ---- iteration 2 ----
  'participation_mode', 'group_code', 'group_display_name', 'group_match_key',
  'group_match_status', 'group_match_ref', 'members_declared', 'adult_confirmation',
  'genre_primary', 'genre_secondary', 'presentation_format', 'presentation_other',
  'needs', 'needs_other', 'own_equipment', 'own_equipment_detail', 'song_name',
  'track_uses', 'track_method', 'track_method_other', 'track_status',
  'track_file_id', 'track_file_name', 'track_updated_at', 'track_notes',
  'video_check_status', 'video_checked_at', 'video_check_detail',
  'consent_at', 'terms_version', 'policy_version', 'data_controller', 'capture_source',
  'precola_at', 'stage_at', 'done_at',
  'eligibility_override', 'override_by', 'override_at'
];

/** Group members. One row per person; the project row lives in REGISTRO. */
var COLUMNAS_INTEGRANTES = [
  'member_id', 'group_code', 'project_submission_id', 'created_at', 'updated_at', 'source',
  'is_leader', 'full_name', 'id_number', 'normalized_id_number', 'birth_date', 'age',
  'adult_confirmation', 'artistic_role',
  'consent_terms', 'consent_data', 'consent_image', 'consent_at',
  'terms_version', 'policy_version', 'data_controller', 'capture_source',
  'signature_file_id', 'signature_sha256', 'signature_at',
  'member_status', 'member_alert', 'notes'
];

/** Operator view: one master row per group, its members nested (collapsible) below. */
var COLUMNAS_AGRUPACIONES = [
  'row_type', 'group_code', 'project_code', 'submission_id', 'group_display_name',
  'group_match_key', 'match_status', 'leader_name', 'leader_id_number', 'leader_whatsapp',
  'leader_email', 'members_declared', 'members_registered', 'members_authorized',
  'genre', 'eligibility_status', 'member_id', 'member_name', 'member_id_number',
  'member_age', 'member_role', 'member_consents', 'member_signature', 'member_status', 'member_alert'
];

var COLUMNAS_PISTAS = [
  'code', 'artistic_name', 'participation_mode', 'song_name', 'track_uses', 'track_method',
  'track_status', 'track_file_name', 'track_file_url', 'track_updated_at', 'track_notes',
  'final_block', 'final_time'
];

var COLUMNAS_DELIBERACIONES = [
  'deliberation_id', 'at', 'by', 'codes_in_order', 'cut_position', 'minutes', 'status'
];

var COLUMNAS_AGENDA = [
  'block_id', 'ventana', 'arrival_time', 'audition_time', 'limite_tolerancia',
  'codigo_desde', 'codigo_hasta', 'asignados', 'cupo', 'disponibles'
];

var COLUMNAS_CHECK_IN = [
  'code', 'full_name', 'artistic_name', 'discipline',
  'final_block', 'arrival_time', 'final_time',
  'check_in_time', 'attendance_status', 'audition_status', 'operador_check_in', 'notes',
  'participation_mode', 'members_declared', 'members_authorized', 'track_status',
  'precola_at', 'stage_at', 'done_at'
];

var COLUMNAS_JURADO = [
  'code', 'artistic_name', 'discipline',
  'talento', 'performance', 'identidad', 'repertorio',
  'profesionalismo', 'presencia', 'digital', 'proyecto',
  'total', 'valido', 'observaciones', 'evaluado_at', 'evaluado_by'
];

var COLUMNAS_RESULTADOS = [
  'posicion', 'code', 'artistic_name', 'full_name', 'discipline',
  'jurado_1', 'jurado_2', 'jurado_3', 'jurados_validos',
  'artist_final', 'seleccionado', 'requiere_comite', 'observacion'
];

var COLUMNAS_INCIDENTES = [
  'incidente_id', 'at', 'code', 'tipo', 'descripcion', 'accion', 'responsable', 'estado'
];

var COLUMNAS_CAMBIOS = [
  'solicitud_id', 'at', 'code', 'full_name', 'original_block', 'original_time',
  'can_attend_original', 'reason_short', 'contact', 'acceptance',
  'estado', 'nuevo_bloque', 'nueva_hora', 'resuelto_at', 'resuelto_by', 'observacion'
];

var COLUMNAS_USUARIOS = ['email_o_alias', 'rol', 'token', 'activo', 'creado_at', 'nota'];

var COLUMNAS_LOG = ['at', 'actor', 'rol', 'accion', 'entidad', 'detalle', 'origen'];

var COLUMNAS_IDEMPOTENCIA = ['clave', 'at', 'resultado'];

/** Every sheet the system owns, in tab order, with its header. */
function sheetDefinitions() {
  return [
    [HOJA.REGISTRO, COLUMNAS_REGISTRO],
    [HOJA.AGRUPACIONES, COLUMNAS_AGRUPACIONES],
    [HOJA.AGENDA, COLUMNAS_AGENDA],
    [HOJA.CHECK_IN, COLUMNAS_CHECK_IN],
    [HOJA.PISTAS, COLUMNAS_PISTAS],
    [HOJA.JURADO_1, COLUMNAS_JURADO],
    [HOJA.JURADO_2, COLUMNAS_JURADO],
    [HOJA.JURADO_3, COLUMNAS_JURADO],
    [HOJA.RESULTADOS, COLUMNAS_RESULTADOS],
    [HOJA.DASHBOARD, ['INDICADOR', 'VALOR']],
    [HOJA.INCIDENTES, COLUMNAS_INCIDENTES],
    [HOJA.CONFIG, ['clave', 'valor', 'descripcion']],
    [HOJA.INTEGRANTES, COLUMNAS_INTEGRANTES],
    [HOJA.DELIBERACIONES, COLUMNAS_DELIBERACIONES],
    [HOJA.CAMBIOS, COLUMNAS_CAMBIOS],
    [HOJA.USUARIOS, COLUMNAS_USUARIOS],
    [HOJA.LOG, COLUMNAS_LOG],
    [HOJA.IDEMPOTENCIA, COLUMNAS_IDEMPOTENCIA]
  ];
}

/** Roles, from most to least privileged. */
var ROL = {
  ADMIN: 'admin',
  DIRECCION: 'direccion',
  LOGISTICA: 'logistica',
  CHECKIN: 'checkin',
  JURADO: 'jurado'
};

/**
 * What each role may call. The web router enforces this, not the UI.
 * Direction sees indicators and results, and the registry only MASKED: the
 * brief forbids exposing ID numbers, phones or e-mails to roles that do not
 * operate with them.
 */
var PERMISOS = {
  admin:     ['*'],
  direccion: ['dashboard', 'resultados', 'registro_enmascarado', 'exportar', 'incidentes', 'deliberar'],
  logistica: ['dashboard', 'registro_lectura', 'registro_escritura', 'codigos', 'agenda',
              'cambios', 'incidentes', 'exportar', 'comunicacion', 'agrupaciones', 'pistas', 'pistas_lectura', 'videos'],
  checkin:   ['checkin', 'registro_lectura_minimo', 'incidentes', 'pistas_lectura'],
  jurado:    ['evaluar', 'lista_audicion_minima']
};

/**
 * Default CONFIG rows. Written on setup, then owned by the operator.
 * Legal values are the ones INFORMED by the organization in the iteration-2
 * brief and confirmed by the organization on 2026-09-24. Nothing here is invented;
 * a value that does not exist yet stays empty and the pages leave it out.
 */
function configuracionPorDefecto() {
  return [
    ['clave', 'valor', 'descripcion'],
    ['evento_nombre', 'EL BÚNKER by Arte es la Solución', 'Nombre publico de la convocatoria.'],
    ['evento_fecha', '2026-10-23', 'Fecha de audiciones (AAAA-MM-DD). Base del calculo de edad.'],
    ['evento_hora_inicio', '15:00', 'Inicio de la jornada (HH:MM, 24 h). El primer bloque empieza a esta hora.'],
    ['evento_hora_fin', '21:00', 'Fin de la jornada (HH:MM, 24 h).'],
    ['evento_sede', 'Centro Comercial Mayorca', 'Lugar de las audiciones.'],
    ['evento_municipio_sede', 'Sabaneta, Antioquia', 'Municipio del lugar.'],
    ['evento_direccion', '', 'Punto exacto dentro del lugar (plazoleta, piso, entrada). Vacio = no se muestra.'],
    ['cupo_total', '100', 'Numero de codigos definitivos B-001..B-100. Una agrupacion = un cupo.'],
    ['edad_minima', '18', 'Edad minima cumplida el dia del evento.'],
    ['edad_maxima', '30', 'Edad maxima cumplida el dia del evento.'],
    ['municipio', 'Sabaneta', 'Municipio de residencia exigido.'],
    ['duracion_audicion_min', '3', 'Duracion maxima de cada audicion en minutos.'],
    ['tolerancia_min', '5', 'Minutos de tolerancia antes de perder el turno.'],
    ['antelacion_llegada_min', '15', 'Minutos de antelacion para el check-in.'],
    ['margen_inicio', '20:00', 'Inicio del margen operativo (HH:MM). Va despues del ultimo bloque.'],
    ['contingencia_inicio', '20:30', 'Inicio de la ventana de contingencia (HH:MM).'],
    ['cierre_audiciones', '21:00', 'Cierre definitivo de audiciones (HH:MM).'],
    ['cierre_cambios', '2026-10-22T18:00:00-05:00', 'Fecha y hora limite del Formulario 2 (cambio de horario).'],
    ['top_seleccionados', '7', 'Numero de artistas/proyectos seleccionados (confirmado por la organizacion: 7).'],
    ['jurados', '3', 'Numero de jurados.'],
    ['minimo_jurados', '2', 'Tarjetas validas minimas para entrar al ranking.'],
    ['inscripciones_abiertas', 'SI', 'SI / NO. Cierra el Formulario 1 sin tocar codigo.'],
    ['cambios_abiertos', 'SI', 'SI / NO. Cierra el Formulario 2 sin tocar codigo.'],
    ['integrantes_abierto', 'SI', 'SI / NO. Cierra el formulario de integrantes.'],
    ['pistas_abiertas', 'SI', 'SI / NO. Cierra la subida de pistas.'],
    ['exigir_video', 'NO', 'SI obliga enlace de video para quedar APTO.'],
    ['verificar_videos', 'SI', 'SI comprueba que el enlace de video se pueda abrir sin iniciar sesion.'],
    ['integrantes_max', '15', 'Maximo de integrantes en escena de una agrupacion.'],
    ['integrantes_edad_minima', '18', 'Edad minima de cada integrante (el documento legal exige mayoria de edad).'],
    ['firma_integrantes', 'SI', 'SI pide firma dibujada a cada integrante (evidencia, no firma electronica calificada).'],
    ['pista_max_mb', '15', 'Tamano maximo de una pista en MB.'],
    ['pista_formatos', 'mp3,wav,m4a,aac,ogg,flac', 'Extensiones de audio aceptadas.'],
    ['correo_confirmacion_automatico', 'SI', 'SI envia un correo al recibir cada inscripcion (cuota Gmail ~100/dia).'],
    ['limite_envios_minuto', '30', 'Maximo de envios de formularios por minuto en todo el sistema.'],
    ['limite_envios_documento_hora', '5', 'Maximo de envios por documento en una hora.'],
    ['tiempo_minimo_formulario_seg', '10', 'Un envio mas rapido que esto se trata como automatizado.'],
    // ---- Legal block: values given by the organization and confirmed on 2026-09-24 ----
    ['legal_name', 'Corporación Socio cultural El Arte es la Solución', 'Razon social del responsable del tratamiento.'],
    ['nit', '901292696', 'NIT informado (sin digito de verificacion: no se infiere).'],
    ['legal_representative', 'Jeison Duval Mazo Castañeda', 'Representante legal informado.'],
    ['legal_address', 'Corredor Juvenil, Casa de la Cultura La Barquereña, Calle 68 Sur #42-40, Sabaneta, Antioquia', 'Direccion informada para contacto.'],
    ['data_protection_email', 'El.arterslasolucion@gmail.com', 'Canal para datos y reclamos (tal como fue informado).'],
    ['institutional_phone', '3042328502', 'Telefono informado.'],
    ['canal_fisico_reclamos', 'Corredor Juvenil, Casa de la Cultura La Barquereña, Calle 68 Sur #42-40, Sabaneta, Antioquia', 'Canal fisico para derechos y reclamos (la direccion del responsable).'],
    ['datos_legales_verificados', 'SI', 'Datos legales confirmados por la organizacion (2026-09-24).'],
    ['terms_version', 'v1-2026-09-24', 'Version de los Terminos y Condiciones publicados (legal/TERMINOS_Y_CONDICIONES_v1.md).'],
    ['policy_version', 'v2-2026-09-24', 'Version de la politica de tratamiento de datos.'],
    ['consent_version', 'v2', 'Version del formulario de autorizaciones.'],
    ['domain', '', 'Dominio propio del sitio, cuando exista. Vacio = se usa sitio_url.'],
    ['sitio_url', 'https://miguelgamer77721-ui.github.io/el-bunker/', 'Direccion publica del sitio informativo.'],
    ['web_app_url', '', 'URL publica /exec de esta Web App (Implementar > Gestionar implementaciones). Todos los enlaces se construyen con ella.'],
    ['privacy_policy_url', 'https://miguelgamer77721-ui.github.io/el-bunker/politica-datos.html', 'URL de la politica de tratamiento de datos.'],
    ['terms_url', 'https://miguelgamer77721-ui.github.io/el-bunker/terminos.html', 'URL de los terminos y condiciones.'],
    ['whatsapp_grupo_enlace', '', 'Enlace de invitacion al grupo de WhatsApp de personas aptas (lo crea la organizacion). Vacio = la invitacion no se ofrece.'],
    ['restaurar_desde', '', 'Solo para recuperacion: ID del archivo JSON de respaldo (ver MANUAL-RECUPERACION).'],
    ['restaurar_confirmacion', '', 'Solo para recuperacion: escribir SI-RESTAURAR y ejecutar RESTAURAR.'],
    ['whatsapp_oficial', '3239836182', 'Numero oficial desde el que se envian codigos y horarios.'],
    ['whatsapp_oficial_nombre', 'EL BÚNKER — Arte es la Solución', 'Nombre con el que el participante debe guardar el numero.'],
    ['contacto_whatsapp', '3239836182', 'WhatsApp de dudas operativas.'],
    ['instagram', 'aesproducciones_', 'Instagram de la convocatoria.']
  ];
}

/**
 * Values that iteration 1 wrote as defaults (including the Date forms Sheets
 * turned them into). The migration only overwrites a key when its current value
 * is one of these, empty or PENDIENTE - anything an operator typed on purpose is
 * reported, never silently replaced.
 */
var CONFIG_ITERATION1_VALUES = {
  evento_nombre: ['EL BUNKER by Arte es la Solucion'],
  evento_fecha: ['2026-10-02', '2026-10-02T00:00:00'],
  evento_hora_inicio: ['16:00', '1899-12-30T16:00:00'],
  evento_hora_fin: ['22:00', '1899-12-30T22:00:00'],
  edad_maxima: ['28'],
  cierre_cambios: ['2026-10-01T18:00:00-05:00'],
  cierre_audiciones: ['21:30', '1899-12-30T21:30:00'],
  contingencia_inicio: ['21:00', '1899-12-30T21:00:00'],
  consent_version: ['v1-PENDIENTE'],
  datos_legales_verificados: ['NO']
};

/** Reads CONFIG into a plain object, cached per execution. */
var _cacheConfig = null;
function cfg(clave, porDefecto) {
  if (_cacheConfig === null) {
    _cacheConfig = {};
    var filas = leerHoja(HOJA.CONFIG);
    for (var i = 0; i < filas.length; i++) {
      if (filas[i].clave) _cacheConfig[String(filas[i].clave).trim()] = filas[i].valor;
    }
  }
  var v = _cacheConfig[clave];
  if (v === undefined || v === '' || v === null) return porDefecto;
  return v;
}

function cfgNumero(clave, porDefecto) {
  var v = Number(cfg(clave, porDefecto));
  return isFinite(v) ? v : porDefecto;
}

function cfgBool(clave, porDefecto) {
  var v = cfg(clave, porDefecto ? 'SI' : 'NO');
  return normalizarComparable(v) === 'SI' || normalizarComparable(v) === 'TRUE';
}

/**
 * Time of day as HH:MM. Sheets turns a typed "15:00" into a 1899-12-30 date
 * unless the cell is plain text, so both forms must read the same.
 */
function cfgHora(clave, porDefecto) {
  var m = horaAMinutos(cfg(clave, porDefecto));
  return m === null ? porDefecto : minutosAHora(m);
}

/** Calendar date as YYYY-MM-DD, whether the cell holds text or a Sheets date. */
function cfgFecha(clave, porDefecto) {
  var p = parsearFecha(cfg(clave, porDefecto));
  if (!p) return porDefecto;
  return p.y + '-' + (p.m < 10 ? '0' : '') + p.m + '-' + (p.d < 10 ? '0' : '') + p.d;
}

function invalidarCacheConfig() { _cacheConfig = null; }

/** Builds the agenda config object from CONFIG, so times are operator-owned. */
function agendaConfigurada() {
  var inicio = horaAMinutos(cfg('evento_hora_inicio', '15:00'));
  var contingencia = horaAMinutos(cfg('contingencia_inicio', '20:30'));
  var cierre = horaAMinutos(cfg('cierre_audiciones', '21:00'));
  var margen = horaAMinutos(cfg('margen_inicio', '20:00'));
  return {
    inicio_minutos: inicio === null ? 15 * 60 : inicio,
    duracion_bloque: 30,
    bloques: 10,
    cupo_por_bloque: 10,
    antelacion_llegada: cfgNumero('antelacion_llegada_min', 15),
    margen_inicio: margen === null ? 20 * 60 : margen,
    contingencia_inicio: contingencia === null ? 20 * 60 + 30 : contingencia,
    contingencia_fin: cierre === null ? 21 * 60 : cierre,
    tolerancia_minutos: cfgNumero('tolerancia_min', 5)
  };
}

function opcionesValidacion() {
  return {
    fecha_evento: cfgFecha('evento_fecha', '2026-10-23'),
    edad_minima: cfgNumero('edad_minima', 18),
    edad_maxima: cfgNumero('edad_maxima', 30),
    exigir_video: cfgBool('exigir_video', false),
    integrantes_max: cfgNumero('integrantes_max', 15)
  };
}

/** The legal identity stamped on every consent, frozen at the moment it is given. */
function dataControllerStamp() {
  return cfg('legal_name', '') + ' · NIT ' + cfg('nit', '');
}
