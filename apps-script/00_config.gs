/**
 * EL BUNKER - Configuration, sheet schema and shared constants.
 *
 * Nothing legal or identifying is hardcoded here: every such value lives in the
 * CONFIG sheet so a non-technical operator can change it without touching code.
 */

var VERSION_SISTEMA = '3.0.0';

/** Script Properties keys (the Apps Script equivalent of environment vars). */
var PROP = {
  SPREADSHEET_ID: 'SPREADSHEET_ID',
  SECRETO_HMAC: 'SECRETO_HMAC',
  CARPETA_BACKUPS: 'CARPETA_BACKUPS',
  SITIO_PUBLICO: 'SITIO_PUBLICO',
  ENVIRONMENT: 'ENVIRONMENT',
  AUDIO_FOLDER: 'AUDIO_FOLDER',
  SIGNATURES_FOLDER: 'SIGNATURES_FOLDER',
  REGISTRATION_SIGNATURES_FOLDER: 'REGISTRATION_SIGNATURES_FOLDER',
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
  IDEMPOTENCIA: '_IDEMPOTENCIA',
  // ---- iteration 3 ----
  PARAMETROS_RUBRICA: 'PARAMETROS_RUBRICA',   // the official rubric as editable parameters
  BOLSA: 'BOLSA',                             // view: principal + substitute pool in priority order
  SEGURO: 'SEGURO_MAYORCA',                   // view: people for the venue insurance policy (private)
  OFERTAS: '_OFERTAS',                        // substitute offers per freed slot
  SLOTS_HISTORIAL: '_SLOTS_HISTORIAL',        // append-only history of every slot hand-over
  EMAIL_LOG: '_EMAIL_LOG',                    // one row per e-mail attempt, idempotent by key
  DESCALIFICACIONES: '_DESCALIFICACIONES'     // disqualification reports and their validation
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
  'eligibility_override', 'override_by', 'override_at',
  // ---- iteration 3 ----
  'eligibility_auto', 'eligibility_decided_at', 'eligibility_decided_by', 'aptitude_notified_at',
  'team_code', 'document_type', 'person_id', 'signature_file_id', 'signature_sha256', 'signature_at',
  'priority_rank', 'pool_status',
  'withdrawal_status', 'withdrawn_at', 'withdrawn_by', 'withdrawal_reason', 'previous_code',
  'final_confirmation', 'final_confirmation_at',
  'participation_status', 'evaluation_status', 'ranking_status', 'dq_status'
];

/** Group members. One row per person; the project row lives in REGISTRO. */
var COLUMNAS_INTEGRANTES = [
  'member_id', 'group_code', 'project_submission_id', 'created_at', 'updated_at', 'source',
  'is_leader', 'full_name', 'id_number', 'normalized_id_number', 'birth_date', 'age',
  'adult_confirmation', 'artistic_role',
  'consent_terms', 'consent_data', 'consent_image', 'consent_at',
  'terms_version', 'policy_version', 'data_controller', 'capture_source',
  'signature_file_id', 'signature_sha256', 'signature_at',
  'member_status', 'member_alert', 'notes',
  // ---- iteration 3: every project (also a soloist) lists its people here ----
  'person_role', 'crew_role', 'on_stage', 'document_type', 'person_id'
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
  'deliberation_id', 'at', 'by', 'codes_in_order', 'cut_position', 'minutes', 'status',
  'method', 'participants', 'result'
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

/**
 * One row per project per juror. The rating columns are the rubric category ids (1-5 each);
 * `total` is the weighted sum (20-100) and `estado` is BORRADOR until the juror submits and
 * locks it (ENVIADA). Only ENVIADA cards count.
 */
function juryColumns(rubric) {
  // Evaluated at call time: RUBRIC_DEFAULT lives in a file loaded after this one.
  return ['code', 'artistic_name', 'discipline', 'presentation_format', 'rubric_version', 'rubric_fingerprint']
    .concat((rubric || RUBRIC_DEFAULT).map(function (c) { return c.id; }))
    .concat(['total', 'desempate', 'estado', 'observaciones', 'dq_flag', 'dq_causa', 'dq_nota',
             'evaluado_at', 'enviado_at', 'evaluado_by', 'reabierta_at', 'reabierta_by', 'reabierta_motivo']);
}

var COLUMNAS_RESULTADOS = [
  'posicion', 'code', 'artistic_name', 'full_name', 'discipline',
  'jurado_1', 'jurado_2', 'jurado_3', 'jurados_validos',
  'artist_final', 'tie_break', 'ranking_status', 'seleccionado', 'requiere_comite', 'dq', 'observacion'
];

var COLUMNAS_INCIDENTES = [
  'incidente_id', 'at', 'code', 'tipo', 'descripcion', 'accion', 'responsable', 'estado'
];

var COLUMNAS_CAMBIOS = [
  'solicitud_id', 'at', 'code', 'full_name', 'original_block', 'original_time',
  'can_attend_original', 'reason_short', 'contact', 'acceptance',
  'estado', 'nuevo_bloque', 'nueva_hora', 'resuelto_at', 'resuelto_by', 'observacion',
  'notificacion_estado'
];

var COLUMNAS_OFERTAS = [
  'oferta_id', 'slot_code', 'slot_block', 'slot_arrival', 'slot_time', 'submission_id', 'priority_rank',
  'estado', 'created_at', 'expires_at', 'responded_at', 'actor', 'released_by', 'notas'
];

var COLUMNAS_SLOTS_HISTORIAL = ['at', 'slot_code', 'evento', 'submission_id', 'actor', 'detalle'];

var COLUMNAS_EMAIL_LOG = [
  'email_id', 'at', 'template_key', 'template_version', 'trigger', 'idempotency_key', 'recipient',
  'submission_id', 'person_id', 'code', 'status', 'provider_message_id', 'retry_count', 'last_attempt_at',
  'error', 'subject', 'payload'
];

var COLUMNAS_DESCALIFICACIONES = [
  'dq_id', 'code', 'submission_id', 'causa', 'nota', 'reportado_por', 'reportado_at',
  'estado', 'resuelto_por', 'resuelto_at', 'motivo'
];

var COLUMNAS_BOLSA = [
  'priority_rank', 'pool_status', 'code', 'submission_id', 'artistic_name', 'participation_mode',
  'created_at', 'eligibility_status', 'participation_status', 'oferta', 'observacion'
];

var COLUMNAS_SEGURO = [
  'code', 'artistic_name', 'participation_mode', 'person_type', 'full_name', 'document_type', 'id_number',
  'role_detail', 'on_stage', 'authorization_status', 'signature_at', 'person_id', 'alerta'
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
    [HOJA.JURADO_1, juryColumns(activeRubricCategories())],
    [HOJA.JURADO_2, juryColumns(activeRubricCategories())],
    [HOJA.JURADO_3, juryColumns(activeRubricCategories())],
    [HOJA.RESULTADOS, COLUMNAS_RESULTADOS],
    [HOJA.DASHBOARD, ['INDICADOR', 'VALOR']],
    [HOJA.INCIDENTES, COLUMNAS_INCIDENTES],
    [HOJA.CONFIG, ['clave', 'valor', 'descripcion']],
    [HOJA.INTEGRANTES, COLUMNAS_INTEGRANTES],
    [HOJA.DELIBERACIONES, COLUMNAS_DELIBERACIONES],
    [HOJA.CAMBIOS, COLUMNAS_CAMBIOS],
    [HOJA.USUARIOS, COLUMNAS_USUARIOS],
    [HOJA.LOG, COLUMNAS_LOG],
    [HOJA.IDEMPOTENCIA, COLUMNAS_IDEMPOTENCIA],
    [HOJA.PARAMETROS_RUBRICA, RUBRIC_PARAM_COLUMNS],
    [HOJA.BOLSA, COLUMNAS_BOLSA],
    [HOJA.SEGURO, COLUMNAS_SEGURO],
    [HOJA.OFERTAS, COLUMNAS_OFERTAS],
    [HOJA.SLOTS_HISTORIAL, COLUMNAS_SLOTS_HISTORIAL],
    [HOJA.EMAIL_LOG, COLUMNAS_EMAIL_LOG],
    [HOJA.DESCALIFICACIONES, COLUMNAS_DESCALIFICACIONES]
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
  direccion: ['dashboard', 'resultados', 'registro_enmascarado', 'exportar', 'incidentes', 'deliberar',
              'validar_dq', 'reabrir_evaluacion', 'cerrar_resultados', 'seguro'],
  logistica: ['dashboard', 'registro_lectura', 'registro_escritura', 'codigos', 'agenda',
              'cambios', 'incidentes', 'exportar', 'comunicacion', 'agrupaciones', 'pistas', 'pistas_lectura', 'videos',
              'reemplazos', 'consolidar', 'seguro'],
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
    ['evento_sede', 'Centro Comercial Mayorca · Etapa 1', 'Lugar de las audiciones.'],
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
    ['cupo_margen_cambios', '10', 'Cupos del margen operativo (8:00-8:30 p. m.) para cambios de horario aprobados. 0 = sin margen. Máximo 10 (lo que cabe antes de la contingencia).'],
    ['contingencia_inicio', '20:30', 'Inicio de la ventana de contingencia (HH:MM).'],
    ['cierre_audiciones', '21:00', 'Cierre definitivo de audiciones (HH:MM).'],
    ['cierre_cambios', '2026-10-22T18:00:00-05:00', 'Fecha y hora limite del Formulario 2 (cambio de horario).'],
    ['top_seleccionados', '10', 'Seleccionados PUBLICOS (Top 10). Release QA 2026-09-29.'],
    ['top_privado', '20', 'Ranking PRIVADO (Top 20): nunca se publica.'],
    ['jurados', '3', 'Numero de jurados.'],
    ['minimo_jurados', '3', 'Evaluaciones ENVIADAS necesarias para entrar al ranking (promedio de los 3 jurados).'],
    ['bolsa_aptos', '200', 'Tamano de la bolsa interna de aptos: 1-100 principales, 101-200 suplentes.'],
    ['reemplazos_desde', '2026-10-16T00:00:00-05:00', 'Desde aqui el participante ve "NO PUEDO ASISTIR - SOLICITAR REEMPLAZO".'],
    ['reemplazo_limite', '2026-10-22T12:00:00-05:00', 'Despues de esta hora un cupo liberado queda VACANTE_SIN_REEMPLAZO (no se ofrece).'],
    ['suplente_horas_respuesta', '24', 'Horas que tiene un suplente para aceptar un cupo ofrecido.'],
    ['confirmacion_final_desde', '2026-10-22T00:00:00-05:00', 'Inicio de la CONFIRMACION FINAL DE ASISTENCIA.'],
    ['confirmacion_final_hasta', '2026-10-22T20:00:00-05:00', 'Fin de la confirmacion final.'],
    ['lista_oficial_bloqueada', 'NO', 'SI = lista oficial consolidada: no hay cambios ordinarios. Lo pone el boton CONSOLIDAR.'],
    ['lista_oficial_version', '', 'Version de la lista oficial consolidada (la escribe el sistema).'],
    ['lista_oficial_at', '', 'Fecha y hora de la consolidacion (la escribe el sistema).'],
    ['lista_oficial_by', '', 'Quien consolido la lista (lo escribe el sistema).'],
    ['lista_oficial_nombre', 'ROSTER_FINAL_2026-10-22', 'Nombre de la hoja que guarda la foto de la lista oficial consolidada.'],
    ['resultados_cerrados', 'NO', 'SI = resultados cerrados: evaluaciones bloqueadas y Top 10 definitivo.'],
    ['enlaces_equipo_vencen', '2026-10-24', 'Ultimo dia en que abren los enlaces de equipo y firmas de cada proyecto.'],
    ['inscripciones_abiertas', 'SI', 'SI / NO. Cierra el Formulario 1 sin tocar codigo.'],
    ['cambios_abiertos', 'SI', 'SI / NO. Cierra el Formulario 2 sin tocar codigo.'],
    ['integrantes_abierto', 'SI', 'SI / NO. Cierra el formulario de integrantes.'],
    ['pistas_abiertas', 'SI', 'SI / NO. Cierra la subida de pistas.'],
    ['exigir_video', 'NO', 'SI obliga enlace de video para quedar APTO.'],
    ['verificar_videos', 'SI', 'SI comprueba que el enlace de video se pueda abrir sin iniciar sesion.'],
    ['integrantes_max', '15', 'Maximo de integrantes en escena de una agrupacion.'],
    ['integrantes_edad_minima', '18', 'Edad minima de cada integrante (el documento legal exige mayoria de edad).'],
    ['firma_integrantes', 'SI', 'SI pide firma dibujada a cada integrante (evidencia, no firma electronica calificada).'],
    ['firma_inscripcion', 'SI', 'SI pide la firma dibujada de quien inscribe el proyecto al final del Formulario 1 (solista, lider de duo o agrupacion).'],
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
    ['terms_version', 'v2-2026-09-29', 'Version de los Terminos y Condiciones publicados (legal/TERMINOS_Y_CONDICIONES_v2.md).'],
    ['policy_version', 'v3-2026-09-29', 'Version de la politica de tratamiento de datos (v3: equipo de trabajo y lista para la poliza del C.C. Mayorca).'],
    ['consent_version', 'v2', 'Version del formulario de autorizaciones.'],
    ['domain', '', 'Dominio propio del sitio, cuando exista. Vacio = se usa sitio_url.'],
    ['sitio_url', 'https://elbunkerarte.github.io/', 'Direccion publica del sitio informativo.'],
    ['web_app_url', '', 'URL publica /exec de esta Web App (Implementar > Gestionar implementaciones). Todos los enlaces se construyen con ella.'],
    ['privacy_policy_url', 'https://elbunkerarte.github.io/politica-datos.html', 'URL de la politica de tratamiento de datos.'],
    ['terms_url', 'https://elbunkerarte.github.io/terminos.html', 'URL de los terminos y condiciones.'],
    ['whatsapp_grupo_enlace', '', 'Enlace de invitacion al grupo de WhatsApp de personas aptas (lo crea la organizacion). Vacio = la invitacion no se ofrece.'],
    ['restaurar_desde', '', 'Solo para recuperacion: ID del archivo JSON de respaldo (ver MANUAL-RECUPERACION).'],
    ['restaurar_confirmacion', '', 'Solo para recuperacion: escribir SI-RESTAURAR y ejecutar RESTAURAR.'],
    ['whatsapp_oficial', '3239836182', 'Numero oficial desde el que se envian codigos y horarios.'],
    ['whatsapp_oficial_nombre', 'EL BÚNKER — Arte es la Solución', 'Nombre con el que el participante debe guardar el numero.'],
    ['contacto_whatsapp', '3239836182', 'WhatsApp de dudas operativas.'],
    ['instagram', 'elarteeslasolucion_', 'Instagram principal de la convocatoria.'],
    ['instagram_aes', 'aesproducciones_', 'Instagram de AES (secundario).']
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
  datos_legales_verificados: ['NO'],
  // Iteration-2 defaults superseded by the release QA (2026-09-29): replaced only if still untouched.
  top_seleccionados: ['7'],
  minimo_jurados: ['2'],
  evento_sede: ['Centro Comercial Mayorca'],
  terms_version: ['v1-2026-09-24'],
  policy_version: ['v2-2026-09-24'],
  instagram: ['aesproducciones_']
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
    tolerancia_minutos: cfgNumero('tolerancia_min', 5),
    // The margin holds as many 3-minute auditions as fit before contingency, never more.
    cupo_margen: Math.max(0, Math.min(cfgNumero('cupo_margen_cambios', 10),
      Math.floor(((contingencia === null ? 20 * 60 + 30 : contingencia) - (margen === null ? 20 * 60 : margen)) /
        Math.max(1, cfgNumero('duracion_audicion_min', 3)))))
  };
}

/** Calendar of the replacement and confirmation stages, read from CONFIG. */
function operationCalendar() {
  return {
    reemplazos_desde: cfg('reemplazos_desde', ''),
    reemplazo_limite: cfg('reemplazo_limite', ''),
    confirmacion_final_desde: cfg('confirmacion_final_desde', ''),
    confirmacion_final_hasta: cfg('confirmacion_final_hasta', ''),
    lista_bloqueada: cfgBool('lista_oficial_bloqueada', false)
  };
}

function poolOptions() {
  return { cupo: cfgNumero('cupo_total', 100), bolsa: cfgNumero('bolsa_aptos', 200) };
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
