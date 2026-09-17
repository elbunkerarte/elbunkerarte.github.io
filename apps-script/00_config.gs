/**
 * EL BUNKER - Configuration, sheet schema and shared constants.
 *
 * Nothing legal or identifying is hardcoded here: every such value lives in the
 * CONFIG sheet so a non-technical operator can change it without touching code.
 */

var VERSION_SISTEMA = '1.0.0';

/** Script Properties keys (the Apps Script equivalent of environment vars). */
var PROP = {
  SPREADSHEET_ID: 'SPREADSHEET_ID',
  SECRETO_HMAC: 'SECRETO_HMAC',
  CARPETA_BACKUPS: 'CARPETA_BACKUPS',
  SITIO_PUBLICO: 'SITIO_PUBLICO'
};

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
  CONFIG: 'CONFIG',
  // Internal sheets (prefixed so the operator knows not to edit them by hand)
  CAMBIOS: '_CAMBIOS',
  USUARIOS: '_USUARIOS',
  LOG: '_LOG',
  IDEMPOTENCIA: '_IDEMPOTENCIA'
};

/**
 * REGISTRO is the single source of truth. AGENDA, CHECK-IN, RESULTADOS and
 * DASHBOARD are rebuilt from it, which is why a participant can never appear
 * with two different schedules in two different tabs.
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
  'notes'
];

var COLUMNAS_AGENDA = [
  'block_id', 'ventana', 'arrival_time', 'audition_time', 'limite_tolerancia',
  'codigo_desde', 'codigo_hasta', 'asignados', 'cupo', 'disponibles'
];

var COLUMNAS_CHECK_IN = [
  'code', 'full_name', 'artistic_name', 'discipline',
  'final_block', 'arrival_time', 'final_time',
  'check_in_time', 'attendance_status', 'audition_status', 'operador_check_in', 'notes'
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

/** Roles, from most to least privileged. */
var ROL = {
  ADMIN: 'admin',
  DIRECCION: 'direccion',
  LOGISTICA: 'logistica',
  CHECKIN: 'checkin',
  JURADO: 'jurado'
};

/** What each role may call. The web router enforces this, not the UI. */
var PERMISOS = {
  admin:     ['*'],
  direccion: ['dashboard', 'resultados', 'registro_lectura', 'exportar', 'incidentes'],
  logistica: ['dashboard', 'registro_lectura', 'registro_escritura', 'codigos', 'agenda',
              'cambios', 'incidentes', 'exportar', 'comunicacion'],
  checkin:   ['checkin', 'registro_lectura_minimo', 'incidentes'],
  jurado:    ['evaluar', 'lista_audicion_minima']
};

/**
 * Default CONFIG rows. Written on setup, then owned by the operator.
 * PENDIENTE DE COMPLETAR marks every value the organisation must supply -
 * no legal name, NIT or address is invented anywhere in this codebase.
 */
function configuracionPorDefecto() {
  return [
    ['clave', 'valor', 'descripcion'],
    ['evento_nombre', 'EL BUNKER by Arte es la Solucion', 'Nombre publico de la convocatoria.'],
    ['evento_fecha', '2026-10-02', 'Fecha de audiciones (YYYY-MM-DD). Base del calculo de edad.'],
    ['evento_hora_inicio', '16:00', 'Inicio de la jornada.'],
    ['evento_hora_fin', '22:00', 'Fin de la jornada.'],
    ['evento_sede', 'PENDIENTE DE COMPLETAR', 'No publicar hasta confirmar con el venue.'],
    ['evento_direccion', 'PENDIENTE DE COMPLETAR', 'Direccion exacta de la sede.'],
    ['cupo_total', '100', 'Numero de codigos definitivos B-001..B-100.'],
    ['edad_minima', '18', 'Edad minima cumplida el dia del evento.'],
    ['edad_maxima', '28', 'Edad maxima cumplida el dia del evento.'],
    ['municipio', 'Sabaneta', 'Municipio de residencia exigido.'],
    ['duracion_audicion_min', '3', 'Duracion maxima de cada audicion en minutos.'],
    ['tolerancia_min', '5', 'Minutos de tolerancia antes de perder el turno.'],
    ['antelacion_llegada_min', '15', 'Minutos de antelacion para el check-in.'],
    ['cierre_cambios', '2026-10-01T18:00:00-05:00', 'Fecha/hora limite del Formulario 2.'],
    ['cierre_audiciones', '21:30', 'Cierre definitivo de nuevas audiciones.'],
    ['contingencia_inicio', '21:00', 'Inicio de la ventana de contingencia.'],
    ['top_seleccionados', '7', 'Numero de artistas a seleccionar.'],
    ['minimo_jurados', '2', 'Tarjetas validas minimas para entrar al ranking.'],
    ['inscripciones_abiertas', 'SI', 'SI / NO. Cierra el Formulario 1 sin tocar codigo.'],
    ['cambios_abiertos', 'SI', 'SI / NO. Cierra el Formulario 2 sin tocar codigo.'],
    ['exigir_video', 'NO', 'SI obliga enlace de video valido para quedar APTO.'],
    // ---- Legal block: NOTHING here is invented by the system ----
    ['legal_name', 'PENDIENTE DE COMPLETAR', 'Razon social del responsable del tratamiento.'],
    ['nit', 'PENDIENTE DE COMPLETAR', 'NIT del responsable.'],
    ['legal_address', 'PENDIENTE DE COMPLETAR', 'Domicilio del responsable.'],
    ['data_protection_email', 'PENDIENTE DE COMPLETAR', 'Correo para ejercer derechos del titular.'],
    ['institutional_phone', 'PENDIENTE DE COMPLETAR', 'Telefono institucional.'],
    ['domain', 'PENDIENTE DE COMPLETAR', 'Dominio publico del sitio.'],
    ['privacy_policy_url', 'PENDIENTE DE COMPLETAR', 'URL de la politica de tratamiento de datos.'],
    ['terms_url', 'PENDIENTE DE COMPLETAR', 'URL de los terminos y condiciones.'],
    ['consent_version', 'v1-PENDIENTE', 'Identificador del texto legal aceptado. Cambiar al publicar textos definitivos.'],
    ['contacto_whatsapp', 'PENDIENTE DE COMPLETAR', 'WhatsApp de contacto para participantes.'],
    ['instagram', 'PENDIENTE DE COMPLETAR', 'Instagram de la convocatoria.']
  ];
}

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
  if (v === undefined || v === '') return porDefecto;
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

function invalidarCacheConfig() { _cacheConfig = null; }

/** Builds the agenda config object from CONFIG, so times are operator-owned. */
function agendaConfigurada() {
  var inicio = horaAMinutos(cfg('evento_hora_inicio', '16:00'));
  return {
    inicio_minutos: inicio === null ? 16 * 60 : inicio,
    duracion_bloque: 30,
    bloques: 10,
    cupo_por_bloque: 10,
    antelacion_llegada: cfgNumero('antelacion_llegada_min', 15),
    contingencia_inicio: horaAMinutos(cfg('contingencia_inicio', '21:00')) || 21 * 60,
    contingencia_fin: horaAMinutos(cfg('cierre_audiciones', '21:30')) || 21 * 60 + 30,
    tolerancia_minutos: cfgNumero('tolerancia_min', 5)
  };
}

function opcionesValidacion() {
  return {
    fecha_evento: cfg('evento_fecha', '2026-10-02'),
    edad_minima: cfgNumero('edad_minima', 18),
    edad_maxima: cfgNumero('edad_maxima', 28),
    exigir_video: cfgBool('exigir_video', false)
  };
}
