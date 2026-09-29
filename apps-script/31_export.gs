/**
 * EL BUNKER - XLSX export, labelled backups, audio backup and restore.
 *
 * A backup is a real .xlsx snapshot plus a JSON dump of every source sheet.
 * The XLSX is for people (it keeps the collapsible group outline); the JSON is
 * what makes a restore possible. Both go to the backups folder in Drive.
 */

/**
 * Sheets that hold original data (everything else is rebuilt from these).
 * Iteration 3 adds the rubric parameters, the substitute offers, the slot hand-over history,
 * the disqualification reports and the e-mail log: none of them can be rebuilt from REGISTRO.
 */
var SOURCE_SHEETS = ['REGISTRO', '_INTEGRANTES', 'JURADO_1', 'JURADO_2', 'JURADO_3', 'INCIDENTES',
                     '_CAMBIOS', '_DELIBERACIONES',
                     'PARAMETROS_RUBRICA', '_OFERTAS', '_SLOTS_HISTORIAL', '_DESCALIFICACIONES', '_EMAIL_LOG'];

/** Every sheet that goes into a JSON backup. */
var BACKUP_SHEETS = SOURCE_SHEETS.concat(['AGENDA', 'CHECK-IN', 'AGRUPACIONES', 'PISTAS', 'RESULTADOS',
                                          'BOLSA', 'SEGURO_MAYORCA', 'CONFIG', '_USUARIOS', '_LOG']);

/** Source sheets a restore never empties: without rows the jury would score with no rubric. */
var RESTORE_ONLY_WITH_ROWS = ['PARAMETROS_RUBRICA'];

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
  var nombre = (nombreArchivo || 'EL-BUNKER-' + Utilities.formatDate(new Date(), zonaHoraria(), 'yyyyMMdd-HHmm')) + '.xlsx';
  return exportSpreadsheetAsXlsx(id, nombre);
}

/**
 * Downloads any spreadsheet of this account as .xlsx and stores it in the backups folder.
 * An expired or missing token makes Google answer with its login page as HTTP 200 HTML,
 * so the content type is checked too: an HTML page must never be saved as a backup.
 */
function exportSpreadsheetAsXlsx(spreadsheetId, fileName) {
  var url = 'https://docs.google.com/spreadsheets/d/' + spreadsheetId + '/export?format=xlsx';
  var respuesta = UrlFetchApp.fetch(url, {
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true
  });
  if (respuesta.getResponseCode() !== 200) {
    throw new Error('No se pudo exportar el XLSX (HTTP ' + respuesta.getResponseCode() + ').');
  }
  var blob = respuesta.getBlob();
  if (/html/i.test(String(blob.getContentType() || ''))) {
    throw new Error('No se pudo exportar el XLSX: Google devolvió una página web en lugar del archivo (sesión o permiso vencido).');
  }
  var archivo = carpetaBackups().createFile(blob.setName(fileName));
  return { nombre: fileName, id: archivo.getId(), url: archivo.getUrl(), bytes: archivo.getSize() };
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
      if (!respaldo.datos[nombre]) return;                          // older backups do not carry the newer sheets
      if (!libro().getSheetByName(nombre)) { restored[nombre] = 'OMITIDA: la hoja no existe (corre MIGRAR)'; return; }
      if (RESTORE_ONLY_WITH_ROWS.indexOf(nombre) !== -1 && !respaldo.datos[nombre].length) return;
      limpiarDatos(nombre);
      var limpias = respaldo.datos[nombre].map(function (f) {
        var copia = {};
        for (var k in f) if (f.hasOwnProperty(k) && k !== '_fila') copia[k] = f[k];
        return copia;
      });
      agregarFilas(nombre, limpias);
      restored[nombre] = limpias.length;
    });
    if (typeof invalidateRubricCache === 'function') invalidateRubricCache();
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

// ===========================================================================
// Iteration 3: corporate Excel (15 sheets) and the venue insurance export
// ===========================================================================
//
// Both workbooks are a PHOTO of the master spreadsheet: every value is read from the
// master sheets (never recomputed into a second truth), written into a temporary
// spreadsheet, exported as .xlsx into the backups folder, and the temporary spreadsheet
// is trashed. Editing the .xlsx never flows back into the system.

/** Sheet names of the corporate workbook, in tab order (release QA, section 5). */
var CORPORATE_SHEETS = [
  'README_OPERACION', 'MASTER_PROYECTOS', 'PERSONAS', 'INTERPRETES', 'EQUIPO_TRABAJO', 'AGENDA', 'CAMBIOS_TURNO',
  'JURADOS', 'CALIFICACIONES', 'RESULTADOS', 'DASHBOARD', 'EMAIL_LOG', 'SEGURO_MAYORCA', 'PARAMETROS_RUBRICA', 'LISTAS'
];

/** Brand header + accessible state tones (dark text on light fills, text always states the value too). */
var XLS_COLOR = {
  HEADER_BG: '#1D1D1B', HEADER_FG: '#FFFFFF',
  OK: '#D9F2E3', WARN: '#FFF2CC', BAD: '#F8D7DA', BAND: '#F5F5F3'
};

/** Tone of a state value, whatever column it lives in (normalized: upper case, no accents, "_" for spaces). */
var XLS_TONE_BY_VALUE = (function () {
  var map = {};
  function put(tone, values) { values.forEach(function (v) { map[v] = tone; }); }
  put('OK', ['APTO', 'ENVIADA', 'ENVIADO', 'SENT', 'TOP10_SELECCIONADO', 'AUTORIZADO', 'CONFIRMADO', 'AUDICIONADO',
             'REALIZADA', 'ASIGNADO', 'ACEPTADA', 'COMPLETA', 'BLOQUEADA', 'PRINCIPAL', 'APROBADO', 'CAMBIO_APROBADO']);
  put('WARN', ['RECIBIDO', 'EN_REVISION', 'REVISION', 'PENDIENTE', 'BORRADOR', 'PARCIAL', 'INCOMPLETO', 'INCOMPLETA',
               'CAMBIO_PENDIENTE', 'INVITADO', 'OFRECIDO', 'LIBERADO', 'SUPLENTE', 'TIE_REVIEW_REQUIRED', 'DQ_PENDIENTE',
               'CONTINGENCIA', 'REINTENTO', 'RETRY', 'EN_COLA', 'QUEUED']);
  put('BAD', ['NO_APTO', 'NO_CUMPLE', 'DUPLICADO', 'DUPLICADA', 'DESCALIFICADO', 'RETIRADO', 'RETIRO_FINAL', 'NO_SHOW',
              'NO_AUDICIONADO', 'NO_CONFIRMADO', 'RECHAZADO', 'RECHAZADA', 'VENCIDA', 'VACANTE_SIN_REEMPLAZO', 'ERROR',
              'FALLIDO', 'FAILED', 'REBOTADO', 'BOUNCED']);
  return map;
})();

/** Columns whose meaning changes the tone of a value (a VALIDADA disqualification is bad news, not good). */
var XLS_TONE_BY_KEY = {
  dq_status: { PENDIENTE: 'WARN', VALIDADA: 'BAD' },
  final_confirmation: { SI: 'OK', NO: 'BAD' },
  firma: { SI: 'OK', NO: 'WARN' },
  firma_completa: { SI: 'OK', NO: 'WARN' },
  seleccionado: { SI: 'OK' },
  requiere_comite: { SI: 'WARN' },
  dq: { SI: 'BAD', TRUE: 'BAD' },
  dq_flag: { SI: 'BAD' },
  activo: { NO: 'BAD', FALSE: 'BAD' }
};

/** Status columns coloured with XLS_TONE_BY_VALUE. */
var XLS_STATE_KEYS = [
  'eligibility_status', 'eligibility_auto', 'pool_status', 'participation_status', 'evaluation_status', 'ranking_status',
  'withdrawal_status', 'change_status', 'attendance_status', 'audition_status', 'member_status', 'authorization_status',
  'estado', 'status', 'slot_status', 'notificacion_estado'
];

/** Spanish column titles (what staff read). Unknown keys keep their own name. */
var XLS_LABELS = {
  submission_id: 'ID PROYECTO', code: 'CÓDIGO', created_at: 'FECHA DE INSCRIPCIÓN', artistic_name: 'NOMBRE ARTÍSTICO',
  participation_mode: 'MODALIDAD', full_name: 'NOMBRE COMPLETO', document_type: 'TIPO DE DOCUMENTO',
  id_number: 'NÚMERO DE DOCUMENTO', email: 'CORREO', whatsapp: 'WHATSAPP', members_declared: 'INTEGRANTES DECLARADOS',
  genre: 'GÉNERO', presentation_format: 'FORMATO', eligibility_status: 'APTITUD', eligibility_auto: 'APTITUD AUTOMÁTICA',
  priority_rank: 'PRIORIDAD', pool_status: 'BOLSA', participation_status: 'PARTICIPACIÓN', final_block: 'BLOQUE',
  arrival_time: 'HORA DE LLEGADA', final_time: 'HORA DE AUDICIÓN', final_confirmation: 'CONFIRMACIÓN FINAL',
  withdrawal_status: 'RETIRO', previous_code: 'CÓDIGO ANTERIOR', evaluation_status: 'EVALUACIÓN', ranking_status: 'RANKING',
  dq_status: 'DESCALIFICACIÓN', team_code: 'CÓDIGO DE EQUIPO', group_code: 'CÓDIGO DE AGRUPACIÓN',
  terms_version: 'VERSIÓN DE TÉRMINOS', consent_terms: 'ACEPTA TÉRMINOS', consent_data: 'AUTORIZA DATOS',
  consent_whatsapp: 'AUTORIZA WHATSAPP', consent_image: 'AUTORIZA IMAGEN Y VOZ', firma: 'FIRMA', signature_at: 'FECHA DE FIRMA',
  interpretes: 'INTÉRPRETES REGISTRADOS', equipo: 'EQUIPO REGISTRADO', attendance_status: 'ASISTENCIA',
  check_in_time: 'HORA DE CHECK-IN', person_id: 'ID PERSONA', person_type: 'TIPO DE PERSONA', role_detail: 'ROL',
  on_stage: 'EN TARIMA', authorization_status: 'AUTORIZACIÓN', member_status: 'AUTORIZACIÓN', alerta: 'ALERTA',
  is_leader: 'RESPONSABLE DEL PROYECTO', origen: 'ORIGEN DEL DATO', proyectos: 'PROYECTOS', codigos: 'CÓDIGOS',
  relaciones: 'RELACIONES (PROYECTO · TIPO · ROL)', tipos: 'TIPO DE PERSONA', firma_completa: 'FIRMÓ EN TODOS',
  slot_code: 'CUPO', slot_status: 'ESTADO DEL CUPO', ventana: 'VENTANA', audition_time: 'HORA DE AUDICIÓN',
  offered_to: 'OFRECIDO A', solicitud_id: 'ID SOLICITUD', original_block: 'BLOQUE ORIGINAL', original_time: 'HORA ORIGINAL',
  at: 'FECHA', can_attend_original: 'PUEDE EN SU HORARIO', reason_short: 'MOTIVO', estado: 'ESTADO',
  nuevo_bloque: 'BLOQUE NUEVO', nueva_hora: 'HORA NUEVA', resuelto_at: 'DECIDIDO EL', resuelto_by: 'DECIDIDO POR',
  observacion: 'OBSERVACIÓN', notificacion_estado: 'NOTIFICACIÓN', email_o_alias: 'JURADO (ALIAS)', hoja: 'HOJA ASIGNADA',
  activo: 'ACTIVO', creado_at: 'CREADO EL', nota: 'NOTA', borradores: 'TARJETAS EN BORRADOR', enviadas: 'TARJETAS ENVIADAS',
  tarjetas: 'TARJETAS TOTALES', jurado: 'JURADO', rubric_version: 'VERSIÓN DE RÚBRICA', total: 'TOTAL (20-100)',
  desempate: 'DESEMPATE (PRESENCIA + ARENA)', dq_flag: 'DQ REPORTADA', dq_causa: 'CAUSAL DQ', observaciones: 'OBSERVACIONES',
  evaluado_by: 'EVALUADO POR', enviado_at: 'ENVIADA EL',
  // copies of master sheets
  posicion: 'POSICIÓN', discipline: 'GÉNERO', jurado_1: 'JURADO 1', jurado_2: 'JURADO 2', jurado_3: 'JURADO 3',
  jurados_validos: 'JURADOS VÁLIDOS', artist_final: 'PUNTAJE FINAL', tie_break: 'DESEMPATE', seleccionado: 'SELECCIONADO',
  requiere_comite: 'REQUIERE COMITÉ', dq: 'DQ', email_id: 'ID CORREO', template_key: 'PLANTILLA',
  template_version: 'VERSIÓN DE PLANTILLA', trigger: 'DISPARADOR', idempotency_key: 'CLAVE DE IDEMPOTENCIA',
  recipient: 'DESTINATARIO', status: 'ESTADO', provider_message_id: 'ID DEL PROVEEDOR', retry_count: 'REINTENTOS',
  last_attempt_at: 'ÚLTIMO INTENTO', error: 'ERROR', subject: 'ASUNTO', version: 'VERSIÓN', orden: 'ORDEN', id: 'ID',
  categoria: 'CATEGORÍA', categoria_corta: 'CATEGORÍA (CORTA)', categoria_no_vocal: 'CATEGORÍA (FORMATO NO VOCAL)',
  descripcion: 'DESCRIPCIÓN', factor: 'FACTOR', puntos_max: 'PUNTOS MÁXIMOS', nivel_1: 'NIVEL 1', nivel_2: 'NIVEL 2',
  nivel_3: 'NIVEL 3', nivel_4: 'NIVEL 4', nivel_5: 'NIVEL 5',
  seccion: 'SECCIÓN', concepto: 'CONCEPTO', detalle: 'DETALLE', lista: 'LISTA', valor: 'VALOR', etiqueta: 'SIGNIFICADO'
};

/** One line per sheet for README_OPERACION. */
var XLS_SHEET_LEGEND = {
  README_OPERACION: 'Esta hoja: uso, versión, fecha, leyendas y resumen de la póliza.',
  MASTER_PROYECTOS: '1 fila por proyecto artístico (solista, dúo o agrupación) con todos sus estados.',
  PERSONAS: '1 fila por persona física. Si está en dos proyectos o con dos roles, es UNA fila con todas sus relaciones.',
  INTERPRETES: 'Relación proyecto-persona de quienes suben a tarima.',
  EQUIPO_TRABAJO: 'Relación proyecto-persona del equipo de trabajo (no ocupa cupo ni entra al ranking).',
  AGENDA: 'Cupos B-001 a B-100: estado del cupo, bloque, horarios, titular, confirmación y check-in.',
  CAMBIOS_TURNO: 'Solicitudes de cambio de horario: pedido, decisión, quién decidió, cuándo y notificación.',
  JURADOS: 'Jurados habilitados, hoja asignada y tarjetas en borrador o enviadas. Nunca incluye enlaces de acceso.',
  CALIFICACIONES: '1 fila por jurado y proyecto: las 7 notas, total, desempate, estado y DQ reportada.',
  RESULTADOS: 'Copia de RESULTADOS de la base: promedios, ranking, Top 20, Top 10 y desempates.',
  DASHBOARD: 'Copia del DASHBOARD de la base (métricas operativas y de evaluación).',
  EMAIL_LOG: 'Registro de correos: plantilla, destinatario, disparador, estado, reintentos y error.',
  SEGURO_MAYORCA: 'Personas de proyectos con código vigente, para la póliza del C.C. Mayorca. Privado.',
  PARAMETROS_RUBRICA: 'Rúbrica oficial vigente: categorías, factores, niveles y versión.',
  LISTAS: 'Catálogos de estados y valores válidos, con su significado.'
};

/** Meaning of each state, shown in LISTAS. Values come from the constants; this only explains them. */
var XLS_STATE_MEANING = {
  RECIBIDO: 'Inscripción recibida, sin revisar', EN_REVISION: 'En revisión por logística', APTO: 'Cumple los requisitos',
  NO_APTO: 'No cumple los requisitos', INCOMPLETO: 'Faltan datos o autorizaciones', DUPLICADO: 'Inscripción repetida',
  SIN_TURNO: 'Sin código B-XXX', INVITADO: 'Tiene turno u oferta de cupo; falta confirmar',
  CONFIRMADO: 'Confirmó asistencia', CAMBIO_PENDIENTE: 'Pidió cambio de horario; aún no se decide',
  CAMBIO_APROBADO: 'Cambio de horario aprobado', NO_CONFIRMADO: 'Respondió que no podrá asistir',
  NO_SHOW: 'No se presentó', CONTINGENCIA: 'Pasó a la ventana de contingencia', AUDICIONADO: 'Audición realizada',
  NO_AUDICIONADO: 'No alcanzó a audicionar', RETIRADO: 'Se retiró; su cupo quedó libre', RETIRO_FINAL: 'Retiro definitivo',
  SIN_CALIFICAR: 'Ningún jurado ha calificado', PARCIAL: 'Faltan tarjetas por enviar', COMPLETA: 'Los 3 jurados enviaron',
  BLOQUEADA: 'Completa y con resultados cerrados', DQ_PENDIENTE: 'Descalificación reportada, por validar',
  DESCALIFICADO: 'Descalificación validada: sale del ranking',
  SIN_RANKING: 'Fuera del ranking (sin audición, sin los jurados mínimos o descalificado)',
  RANKED: 'En el ranking, fuera del Top 20', TOP20: 'Puestos 11 a 20 (privado)', TOP10_SELECCIONADO: 'Seleccionado (Top 10 público)',
  TIE_REVIEW_REQUIRED: 'Empate en el corte: decide el comité con acta', NO_SELECCIONADO: 'No seleccionado (resultados cerrados)',
  PRINCIPAL: 'Tiene cupo B-001 a B-100', SUPLENTE: 'Apto en la bolsa de suplentes (puestos 101 a 200)',
  FUERA_DE_BOLSA: 'Apto después del puesto 200', DECLINO: 'Suplente que rechazó o dejó vencer una oferta',
  PENDIENTE: 'Abierto, esperando respuesta o decisión', ACEPTADA: 'Oferta aceptada', RECHAZADA: 'Oferta rechazada',
  VENCIDA: 'Oferta vencida sin respuesta', CANCELADA: 'Oferta cancelada',
  VACANTE_SIN_REEMPLAZO: 'Cupo cerrado sin suplente (después del límite de reemplazos)',
  ASIGNADO: 'Cupo con titular', OFRECIDO: 'Cupo ofrecido a un suplente', LIBERADO: 'Cupo liberado por un retiro',
  SIN_EMITIR: 'Código aún no emitido', BORRADOR: 'Tarjeta guardada; el jurado aún puede editarla',
  ENVIADA: 'Tarjeta enviada y bloqueada', AUTORIZADO: 'Firmó y aceptó sus autorizaciones', 'NO CUMPLE': 'No cumple (edad)',
  VALIDADA: 'Descalificación confirmada por dirección', DESCARTADA: 'Reporte de descalificación descartado',
  INTERPRETE: 'Sube a tarima como parte del proyecto',
  EQUIPO_TRABAJO: 'Manager, productor, técnico, asistente, fotógrafo u otro. No ocupa cupo ni entra al ranking',
  SOLISTA: 'Una persona', DUO: 'Dos personas', AGRUPACION: 'Tres o más personas'
};

// ---------------------------------------------------------------------------
// People per project (pure: arrays in, arrays out)
// ---------------------------------------------------------------------------

/** Stored person id, or the one derived from the document number (same function the core uses). */
function xlsPersonId(stored, idNumber) {
  var s = normalizarTexto(stored);
  if (s) return s;
  return personIdFor(normalizarCedula(idNumber)) || '';
}

function xlsYesNo(value) {
  return esVerdadero(value) ? 'SI' : 'NO';
}

/**
 * Every project-person relation of the registry, one per person per project.
 *
 * Members are linked by `_INTEGRANTES.group_code` against the project's team_code
 * (iteration 3, every project) or group_code (iteration 2, groups); when neither matches,
 * by `project_submission_id`. The person who registered the project is part of it too:
 * when no linked row is the leader or carries their document, that person is taken from
 * the REGISTRO row itself (legacy soloists had no member row).
 */
function projectPeople(projects, members) {
  var byKey = {};
  var bySubmission = {};
  (projects || []).forEach(function (p) {
    [p.team_code, p.group_code].forEach(function (k) {
      var key = normalizarComparable(k);
      if (key && !byKey[key]) byKey[key] = p;
    });
    if (normalizarTexto(p.submission_id)) bySubmission[normalizarTexto(p.submission_id)] = p;
  });

  var linked = {};
  (members || []).forEach(function (m) {
    var p = byKey[normalizarComparable(m.group_code)] || bySubmission[normalizarTexto(m.project_submission_id)];
    if (!p) return;
    (linked[p.submission_id] = linked[p.submission_id] || []).push(m);
  });

  var out = [];
  (projects || []).forEach(function (p) {
    var list = linked[p.submission_id] || [];
    var responsibleDoc = normalizarCedula(p.normalized_id_number || p.id_number);
    var hasResponsible = list.some(function (m) {
      return esVerdadero(m.is_leader) ||
             (responsibleDoc && normalizarCedula(m.normalized_id_number || m.id_number) === responsibleDoc);
    });
    var people = [];
    if (!hasResponsible) people.push(xlsResponsibleRelation(p));
    list.forEach(function (m) { people.push(xlsMemberRelation(p, m)); });
    xlsMergeSamePerson(people).forEach(function (r) { out.push(r); });
  });
  return out;
}

function xlsProjectFields(p) {
  return {
    submission_id: normalizarTexto(p.submission_id), code: normalizarTexto(p.code), artistic_name: normalizarTexto(p.artistic_name),
    participation_mode: normalizarTexto(p.participation_mode) || 'SOLISTA',
    eligibility_status: normalizarTexto(p.eligibility_status), withdrawn: isWithdrawn(p)
  };
}

/** The registrant, read from REGISTRO when the project has no member row for them. */
function xlsResponsibleRelation(p) {
  var r = xlsProjectFields(p);
  var solo = normalizarComparable(r.participation_mode) === 'SOLISTA';
  r.full_name = normalizarTexto(p.full_name);
  r.id_number = normalizarTexto(p.id_number);
  r.document_type = normalizeDocumentType(p.document_type);
  r.person_id = xlsPersonId(p.person_id, p.normalized_id_number || p.id_number);
  r.person_type = PERSON_ROLE.INTERPRETE;
  r.role_detail = solo ? 'Solista' : 'Responsable del proyecto';
  r.on_stage = 'SI';
  r.authorization_status = esVerdadero(p.consent_terms) && esVerdadero(p.consent_data)
    ? MEMBER_STATUS.AUTORIZADO : MEMBER_STATUS.INCOMPLETO;
  r.signature_at = normalizarTexto(p.signature_at);
  r.signed = !!(normalizarTexto(p.signature_at) || normalizarTexto(p.signature_file_id));
  r.consent_terms = xlsYesNo(p.consent_terms);
  r.consent_data = xlsYesNo(p.consent_data);
  r.consent_image = xlsYesNo(p.consent_image);
  r.is_leader = 'SI';
  r.synthesized = true;
  r.origen = 'FORMULARIO 1 (sin fila de integrante)';
  return r;
}

function xlsMemberRelation(p, m) {
  var r = xlsProjectFields(p);
  var leader = esVerdadero(m.is_leader);
  var role = normalizePersonRole(m.person_role);
  var crew = role === PERSON_ROLE.EQUIPO_TRABAJO;
  var crewRole = normalizarComparable(m.crew_role).replace(/[^A-Z]/g, '');
  var signatureAt = normalizarTexto(m.signature_at) || (leader ? normalizarTexto(p.signature_at) : '');
  r.full_name = normalizarTexto(m.full_name);
  r.id_number = normalizarTexto(m.id_number);
  r.document_type = normalizeDocumentType(m.document_type || (leader ? p.document_type : ''));
  r.person_id = xlsPersonId(m.person_id, m.normalized_id_number || m.id_number);
  r.person_type = role;
  r.role_detail = crew ? (CREW_ROLE_LABELS[crewRole] || normalizarTexto(m.crew_role) || 'Equipo de trabajo')
                       : (normalizarTexto(m.artistic_role) || 'Intérprete');
  r.on_stage = normalizarTexto(m.on_stage) ? xlsYesNo(m.on_stage) : (crew ? 'NO' : 'SI');
  r.authorization_status = normalizarTexto(m.member_status);
  r.signature_at = signatureAt;
  r.signed = !!(signatureAt || normalizarTexto(m.signature_file_id) || (leader && normalizarTexto(p.signature_file_id)));
  r.consent_terms = xlsYesNo(m.consent_terms);
  r.consent_data = xlsYesNo(m.consent_data);
  r.consent_image = xlsYesNo(m.consent_image);
  r.is_leader = leader ? 'SI' : 'NO';
  r.synthesized = false;
  r.origen = leader ? 'FORMULARIO 1' : 'ENLACE DE EQUIPO Y FIRMAS';
  return r;
}

/** One person listed twice in the same project becomes one relation: on stage wins, roles are joined. */
function xlsMergeSamePerson(people) {
  var out = [];
  var index = {};
  people.forEach(function (r) {
    var key = r.person_id;
    if (!key || index[key] === undefined) {
      if (key) index[key] = out.length;
      out.push(r);
      return;
    }
    var kept = out[index[key]];
    if (kept.role_detail.indexOf(r.role_detail) === -1) kept.role_detail += ' / ' + r.role_detail;
    if (r.person_type === PERSON_ROLE.INTERPRETE) kept.person_type = PERSON_ROLE.INTERPRETE;
    if (r.on_stage === 'SI') kept.on_stage = 'SI';
    if (r.authorization_status === MEMBER_STATUS.AUTORIZADO) kept.authorization_status = MEMBER_STATUS.AUTORIZADO;
    if (!kept.signature_at && r.signature_at) kept.signature_at = r.signature_at;
    kept.signed = kept.signed || r.signed;
    if (r.is_leader === 'SI') kept.is_leader = 'SI';
  });
  return out;
}

/**
 * Alerts per relation, never a removal: missing signature, and a person who appears in more
 * than one project of `relations` (the codes, or the project ids when there is no code yet).
 */
function xlsRelationAlerts(relations) {
  var projectsByPerson = {};
  relations.forEach(function (r) {
    if (!r.person_id) return;
    var label = r.code || r.submission_id;
    var list = projectsByPerson[r.person_id] = projectsByPerson[r.person_id] || [];
    if (list.indexOf(label) === -1) list.push(label);
  });
  relations.forEach(function (r) {
    var alerts = [];
    if (!r.signed) alerts.push(r.synthesized ? 'SIN_FIRMA_INDIVIDUAL' : 'SIN_FIRMA');
    var list = r.person_id ? projectsByPerson[r.person_id] : [];
    if (list && list.length > 1) alerts.push('PERSONA_EN_VARIOS_PROYECTOS: ' + list.slice().sort().join(','));
    r.alerta = alerts.join(' | ');
  });
  return relations;
}

function xlsByProjectThenPerson(a, b) {
  var ka = [a.code || '~' + a.submission_id, a.is_leader === 'SI' ? 0 : 1, a.person_type === PERSON_ROLE.INTERPRETE ? 0 : 1,
            normalizarComparable(a.full_name)];
  var kb = [b.code || '~' + b.submission_id, b.is_leader === 'SI' ? 0 : 1, b.person_type === PERSON_ROLE.INTERPRETE ? 0 : 1,
            normalizarComparable(b.full_name)];
  for (var i = 0; i < ka.length; i++) {
    if (ka[i] < kb[i]) return -1;
    if (ka[i] > kb[i]) return 1;
  }
  return 0;
}

/**
 * SEGURO_MAYORCA: one row per person linked to a project that holds a code (B-XXX) and has
 * not withdrawn. Keys are exactly COLUMNAS_SEGURO. A person in two projects stays in both
 * (they are two relations) and is flagged, never removed.
 * @param {Array<Object>} projects REGISTRO rows
 * @param {Array<Object>} members _INTEGRANTES rows
 */
function insuranceRows(projects, members) {
  var relations = projectPeople(projects, members).filter(function (r) { return r.code && !r.withdrawn; });
  xlsRelationAlerts(relations);
  relations.sort(xlsByProjectThenPerson);
  return relations.map(function (r) {
    var row = {};
    COLUMNAS_SEGURO.forEach(function (k) { row[k] = r[k] === undefined || r[k] === null ? '' : r[k]; });
    return row;
  });
}

/** Reconciliation counts of insuranceRows(). */
function insuranceSummary(rows) {
  var codes = {}, people = {}, repeated = {};
  var s = { proyectos: 0, personas: 0, interpretes: 0, equipo: 0, sin_firma: 0, repetidas: 0 };
  (rows || []).forEach(function (r, i) {
    codes[normalizarComparable(r.code)] = true;
    var person = r.person_id || 'FILA-' + i;
    people[person] = true;
    if (r.person_type === PERSON_ROLE.EQUIPO_TRABAJO) s.equipo++;
    else s.interpretes++;
    if (/SIN_FIRMA/.test(String(r.alerta || ''))) s.sin_firma++;
    if (/PERSONA_EN_VARIOS_PROYECTOS/.test(String(r.alerta || ''))) repeated[person] = true;
  });
  s.proyectos = Object.keys(codes).length;
  s.personas = Object.keys(people).length;
  s.repetidas = Object.keys(repeated).length;
  return s;
}

// ---------------------------------------------------------------------------
// Workbook writer (Sheets calls live here and only here)
// ---------------------------------------------------------------------------

function xlsLabel(key) {
  return XLS_LABELS[key] || String(key);
}

/** Column spec: { key, label, num }. Non-numeric columns are written as plain text. */
function xlsCol(key, label, num) {
  return { key: key, label: label || xlsLabel(key), num: !!num };
}

/**
 * Display value of one cell. Dates become text, ISO stamps lose the "T", booleans read SI/NO,
 * and text starting with = + - @ gets the apostrophe that keeps it from becoming a formula.
 */
function xlsCell(value) {
  if (value === undefined || value === null) return '';
  if (value instanceof Date) return configValueAsText(value);
  if (typeof value === 'boolean') return value ? 'SI' : 'NO';
  if (typeof value === 'number') return value;
  var s = String(value);
  var time = s.match(/^1899-12-3\d[T ](\d{2}:\d{2})/);
  if (time) return time[1];
  var stamp = s.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(:\d{2}(\.\d+)?)?$/);
  if (stamp) return stamp[1] + ' ' + stamp[2];
  return cellValue(s);
}

function xlsTone(key, value) {
  var v = normalizarComparable(value).replace(/[\s-]+/g, '_');
  if (!v) return '';
  if (key === 'alerta' || key === 'member_alert') return 'WARN';
  if (XLS_TONE_BY_KEY.hasOwnProperty(key)) return XLS_TONE_BY_KEY[key][v] || '';
  if (XLS_STATE_KEYS.indexOf(key) === -1) return '';
  return XLS_TONE_BY_VALUE[v] || '';
}

/** Masks document numbers, e-mails and phones for roles that only see the registry masked. */
function xlsMask(key, value) {
  if (!normalizarTexto(value)) return value;
  if (key === 'id_number') return maskIdNumber(value);
  if (key === 'email') return maskEmail(value);
  if (key === 'whatsapp') return maskPhone(value);
  if (key === 'recipient' || key === 'contact') return String(value).indexOf('@') !== -1 ? maskEmail(value) : maskPhone(value);
  return value;
}

var XLS_MASKED_KEYS = ['id_number', 'email', 'whatsapp', 'recipient', 'contact'];

function xlsEnsureSize(sheet, rows, cols) {
  if (sheet.getMaxColumns() < cols) sheet.insertColumnsAfter(sheet.getMaxColumns(), cols - sheet.getMaxColumns());
  if (sheet.getMaxRows() < rows) sheet.insertRowsAfter(sheet.getMaxRows(), rows - sheet.getMaxRows());
}

/** Column widths from content, bucketed so contiguous columns share one call. */
function xlsColumnWidths(sheet, matrix, width) {
  if (typeof sheet.setColumnWidths !== 'function') {
    if (typeof sheet.autoResizeColumns === 'function') sheet.autoResizeColumns(1, width);
    return;
  }
  var widths = [];
  for (var j = 0; j < width; j++) {
    var longest = 0;
    for (var i = 0; i < matrix.length && i < 300; i++) longest = Math.max(longest, String(matrix[i][j]).length);
    widths.push(Math.ceil(Math.max(80, Math.min(360, 7 * longest + 24)) / 40) * 40);
  }
  var start = 0;
  for (var k = 1; k <= width; k++) {
    if (k === width || widths[k] !== widths[start]) {
      sheet.setColumnWidths(start + 1, k - start, widths[start]);
      start = k;
    }
  }
}

/**
 * Writes one table: header + rows in ONE setValues, text format on non-numeric columns first
 * (so "0012345", "15:00" and B-001 survive), branded header, frozen header row, a filter over
 * the table, widths, alternating band + state tones in ONE setBackgrounds, and a warning-only
 * protection. Rows may carry `_background` to tint the whole row (legend rows).
 * Banding is painted in the same background matrix instead of applyRowBanding: Sheets draws
 * alternating colours over plain fills, which would hide the state tones.
 * @returns {number} data rows written
 */
function xlsWriteTable(sheet, columns, rows, options) {
  options = options || {};
  var cols = columns.length ? columns : [xlsCol('aviso', 'AVISO')];
  var width = cols.length;
  var height = rows.length + 1;
  xlsEnsureSize(sheet, height + 1, width);

  var textKeys = cols.filter(function (c) { return !c.num; }).map(function (c) { return c.key; });
  plainTextRuns(cols.map(function (c) { return c.key; }), textKeys).forEach(function (run) {
    sheet.getRange(1, run[0] + 1, height, run[1]).setNumberFormat('@');
  });

  var masked = !!options.masked;
  var matrix = [cols.map(function (c) { return c.label; })];
  var backgrounds = [cols.map(function () { return XLS_COLOR.HEADER_BG; })];
  rows.forEach(function (r, i) {
    var band = r._background || (i % 2 === 1 ? XLS_COLOR.BAND : null);
    matrix.push(cols.map(function (c) {
      var v = r[c.key];
      if (masked && XLS_MASKED_KEYS.indexOf(c.key) !== -1) v = xlsMask(c.key, v);
      return xlsCell(v);
    }));
    backgrounds.push(cols.map(function (c) {
      var tone = xlsTone(c.key, r[c.key]);
      return tone ? XLS_COLOR[tone] : band;
    }));
  });

  var table = sheet.getRange(1, 1, height, width);
  table.setValues(matrix);
  table.setBackgrounds(backgrounds);
  sheet.getRange(1, 1, 1, width).setFontWeight('bold').setFontColor(XLS_COLOR.HEADER_FG);
  if (typeof sheet.setFrozenRows === 'function') sheet.setFrozenRows(1);
  if (typeof table.createFilter === 'function') {
    try { table.createFilter(); } catch (e) { console.warn('Filtro no creado en ' + sheet.getName() + ': ' + e.message); }
  }
  xlsColumnWidths(sheet, matrix, width);
  if (typeof sheet.protect === 'function') {
    sheet.protect().setDescription('Foto de la base EL BÚNKER. Editar aquí no cambia el sistema.').setWarningOnly(true);
  }
  return rows.length;
}

/**
 * Columns + rows of a master sheet copied as they are (every column, every row). Header
 * titles are translated for staff; a column is numeric only when every value in it is a number.
 */
function xlsMasterCopy(sheetName) {
  var sheet = libro().getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 1 || sheet.getLastColumn() < 1) {
    return { columns: [xlsCol('aviso', 'AVISO')], rows: [{ aviso: 'La hoja ' + sheetName + ' no existe o está vacía en la base.' }] };
  }
  var values = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).getValues();
  var used = {};
  var columns = values[0].map(function (h, j) {
    var key = String(h).trim() || 'col_' + (j + 1);
    while (used[key]) key += '_';
    used[key] = true;
    var numeric = values.length > 1 && values.slice(1).every(function (row) {
      return row[j] === '' || row[j] === null || typeof row[j] === 'number';
    }) && values.slice(1).some(function (row) { return typeof row[j] === 'number'; });
    return xlsCol(key, String(h).trim() ? xlsLabel(key) : '', numeric);
  });
  var rows = values.slice(1).map(function (line) {
    var o = {};
    columns.forEach(function (c, j) { o[c.key] = line[j]; });
    return o;
  });
  return { columns: columns, rows: rows };
}

/** yyyyMMdd-HHmm stamped file name; test files say so in the name. */
function xlsFileName(name, kind) {
  var base = normalizarTexto(name) || 'EL-BUNKER-' + kind + '-' + Utilities.formatDate(new Date(), zonaHoraria(), 'yyyyMMdd-HHmm');
  if (esPruebas() && !/PRUEBAS/i.test(base)) base = 'PRUEBAS-' + base;
  return base.replace(/\.xlsx$/i, '') + '.xlsx';
}

/**
 * Builds a temporary spreadsheet with `tables` ([{ name, columns, rows }], in tab order),
 * exports it as .xlsx into the backups folder and trashes the temporary spreadsheet,
 * also when anything fails half way (it holds personal data).
 */
function xlsBuildWorkbook(fileName, tables, options) {
  var temp = SpreadsheetApp.create('TEMP-EXPORT ' + fileName.replace(/\.xlsx$/i, ''));
  var tempId = temp.getId();
  var result = null;
  var trashed = false;
  try {
    try { temp.setSpreadsheetTimeZone(zonaHoraria()); } catch (e) { /* keeps the account zone */ }
    var names = tables.map(function (t) { return t.name; });
    var hojas = {};
    tables.forEach(function (t) {
      hojas[t.name] = xlsWriteTable(temp.insertSheet(t.name), t.columns, t.rows, options);
    });
    temp.getSheets().forEach(function (s) {
      if (names.indexOf(s.getName()) === -1) temp.deleteSheet(s);
    });
    SpreadsheetApp.flush();                                   // the export URL reads what is committed, not what is pending
    result = exportSpreadsheetAsXlsx(tempId, fileName);
    result.hojas = hojas;
  } finally {
    try { DriveApp.getFileById(tempId).setTrashed(true); trashed = true; }
    catch (e) { console.error('No se pudo enviar a la papelera la hoja temporal ' + tempId + ': ' + e.message); }
  }
  result.temporal_id = tempId;
  result.temporal_en_papelera = trashed;
  return result;
}

// ---------------------------------------------------------------------------
// The 15 sheets
// ---------------------------------------------------------------------------

/** Everything the workbooks read, in one pass over the master spreadsheet. */
function xlsReadSources() {
  return {
    projects: leerHoja(HOJA.REGISTRO),
    members: leerHoja(HOJA.INTEGRANTES),
    offers: leerHoja(HOJA.OFERTAS),
    changes: leerHoja(HOJA.CAMBIOS),
    users: leerHoja(HOJA.USUARIOS),
    jury: [HOJA.JURADO_1, HOJA.JURADO_2, HOJA.JURADO_3].map(function (n) { return leerHoja(n); })
  };
}

function xlsGenre(r) {
  return typeof projectGenre === 'function' ? projectGenre(r) : (normalizarTexto(r.genre_primary) || normalizarTexto(r.discipline));
}

function xlsPendingOffers(offers) {
  var pending = {};
  (offers || []).forEach(function (o) {
    if (normalizarComparable(o.estado) === OFFER_STATUS.PENDIENTE) pending[normalizarTexto(o.submission_id)] = true;
  });
  return pending;
}

function xlsMasterProjects(src, relations) {
  var pending = xlsPendingOffers(src.offers);
  var counts = {};
  relations.forEach(function (r) {
    var c = counts[r.submission_id] = counts[r.submission_id] || { interpretes: 0, equipo: 0 };
    if (r.person_type === PERSON_ROLE.EQUIPO_TRABAJO) c.equipo++; else c.interpretes++;
  });
  var columns = [
    xlsCol('submission_id'), xlsCol('code'), xlsCol('created_at'), xlsCol('artistic_name'), xlsCol('participation_mode'),
    xlsCol('full_name', 'RESPONSABLE'), xlsCol('document_type'), xlsCol('id_number'), xlsCol('email'), xlsCol('whatsapp'),
    xlsCol('members_declared', null, true), xlsCol('interpretes', null, true), xlsCol('equipo', null, true),
    xlsCol('genre'), xlsCol('presentation_format'), xlsCol('eligibility_status'), xlsCol('eligibility_auto'),
    xlsCol('priority_rank', null, true), xlsCol('pool_status'), xlsCol('participation_status'),
    xlsCol('final_block', null, true), xlsCol('arrival_time'), xlsCol('final_time'), xlsCol('final_confirmation'),
    xlsCol('attendance_status'), xlsCol('withdrawal_status'), xlsCol('previous_code'), xlsCol('evaluation_status'),
    xlsCol('ranking_status'), xlsCol('dq_status'), xlsCol('team_code'), xlsCol('group_code'), xlsCol('terms_version'),
    xlsCol('consent_terms'), xlsCol('consent_data'), xlsCol('consent_whatsapp'), xlsCol('consent_image'),
    xlsCol('firma'), xlsCol('signature_at')
  ];
  var rows = src.projects.map(function (r) {
    var c = counts[r.submission_id] || { interpretes: 0, equipo: 0 };
    return {
      submission_id: r.submission_id, code: r.code, created_at: r.created_at, artistic_name: r.artistic_name,
      participation_mode: r.participation_mode || 'SOLISTA', full_name: r.full_name,
      document_type: normalizeDocumentType(r.document_type), id_number: r.id_number, email: r.email, whatsapp: r.whatsapp,
      members_declared: r.members_declared, interpretes: c.interpretes, equipo: c.equipo, genre: xlsGenre(r),
      presentation_format: r.presentation_format, eligibility_status: r.eligibility_status, eligibility_auto: r.eligibility_auto,
      priority_rank: r.priority_rank, pool_status: r.pool_status,
      participation_status: normalizarTexto(r.participation_status) ||
        participationStatus(r, !!pending[normalizarTexto(r.submission_id)]),
      final_block: r.final_block || r.original_block, arrival_time: clockText(r.arrival_time) || r.arrival_time,
      final_time: clockText(r.final_time || r.original_time), final_confirmation: r.final_confirmation,
      attendance_status: r.attendance_status, withdrawal_status: r.withdrawal_status, previous_code: r.previous_code,
      evaluation_status: r.evaluation_status, ranking_status: r.ranking_status, dq_status: r.dq_status,
      team_code: r.team_code, group_code: r.group_code, terms_version: r.terms_version,
      consent_terms: xlsYesNo(r.consent_terms), consent_data: xlsYesNo(r.consent_data),
      consent_whatsapp: xlsYesNo(r.consent_whatsapp), consent_image: xlsYesNo(r.consent_image),
      firma: normalizarTexto(r.signature_at) || normalizarTexto(r.signature_file_id) ? 'SI' : 'NO',
      signature_at: r.signature_at
    };
  });
  return { name: 'MASTER_PROYECTOS', columns: columns, rows: rows };
}

function xlsPeople(relations) {
  var byPerson = {};
  var order = [];
  relations.forEach(function (r, i) {
    var key = r.person_id || 'SIN-DOCUMENTO-' + i;
    if (!byPerson[key]) {
      byPerson[key] = { person_id: r.person_id, full_name: r.full_name, document_type: r.document_type, id_number: r.id_number,
                        list: [] };
      order.push(key);
    }
    byPerson[key].list.push(r);
  });
  var rows = order.map(function (key) {
    var p = byPerson[key];
    var projects = {};
    var types = {};
    p.list.forEach(function (r) { projects[r.code || r.submission_id] = true; types[r.person_type] = true; });
    var codes = Object.keys(projects).sort();
    return {
      person_id: p.person_id, full_name: p.full_name, document_type: p.document_type, id_number: p.id_number,
      proyectos: codes.length, codigos: codes.join(', '),
      tipos: Object.keys(types).sort().join(' + '),
      relaciones: p.list.map(function (r) {
        return (r.code || 'sin código ' + r.submission_id) + ' · ' + r.artistic_name + ' · ' + r.person_type + ' (' + r.role_detail + ')';
      }).join(' | '),
      firma_completa: p.list.every(function (r) { return r.signed; }) ? 'SI' : 'NO',
      alerta: codes.length > 1 ? 'PERSONA_EN_VARIOS_PROYECTOS: ' + codes.join(',') : ''
    };
  });
  rows.sort(function (a, b) { return normalizarComparable(a.full_name) < normalizarComparable(b.full_name) ? -1 : 1; });
  return {
    name: 'PERSONAS',
    columns: [xlsCol('person_id'), xlsCol('full_name'), xlsCol('document_type'), xlsCol('id_number'),
              xlsCol('proyectos', null, true), xlsCol('codigos'), xlsCol('tipos'), xlsCol('relaciones'),
              xlsCol('firma_completa'), xlsCol('alerta')],
    rows: rows
  };
}

function xlsRelationTable(name, relations, personType) {
  var rows = relations.filter(function (r) { return r.person_type === personType; }).map(function (r) {
    return Object.assign({}, r, { firma: r.signed ? 'SI' : 'NO' });
  });
  return {
    name: name,
    columns: [xlsCol('code'), xlsCol('artistic_name'), xlsCol('submission_id'), xlsCol('participation_mode'),
              xlsCol('eligibility_status'), xlsCol('person_id'), xlsCol('full_name'), xlsCol('document_type'),
              xlsCol('id_number'), xlsCol('role_detail'), xlsCol('on_stage'), xlsCol('is_leader'),
              xlsCol('authorization_status'), xlsCol('firma'), xlsCol('signature_at'), xlsCol('consent_terms'),
              xlsCol('consent_data'), xlsCol('consent_image'), xlsCol('origen'), xlsCol('alerta')],
    rows: rows
  };
}

function xlsAgenda(src) {
  var agendaCfg = agendaConfigurada();
  var bySubmission = {};
  src.projects.forEach(function (r) { bySubmission[normalizarTexto(r.submission_id)] = r; });
  var pending = xlsPendingOffers(src.offers);
  var rows = slotStatuses(src.projects, src.offers, { cupo: cfgNumero('cupo_total', 100) }).map(function (s) {
    var holder = bySubmission[normalizarTexto(s.holder_submission_id)] || null;
    var planned = horarioDeCodigo(s.slot_code, agendaCfg) || {};
    var block = holder ? Number(holder.final_block || holder.original_block) || planned.block_id : planned.block_id;
    var window = block ? horarioDeBloque(block, agendaCfg) : null;
    var offered = bySubmission[normalizarTexto(s.offered_to)];
    return {
      slot_code: s.slot_code, slot_status: s.status, final_block: block || '', ventana: window ? window.ventana : '',
      arrival_time: holder ? clockText(holder.arrival_time) || planned.arrival_time : planned.arrival_time,
      audition_time: holder ? clockText(holder.final_time || holder.original_time) || planned.audition_time : planned.audition_time,
      artistic_name: holder ? holder.artistic_name : '', submission_id: holder ? holder.submission_id : '',
      participation_mode: holder ? holder.participation_mode || 'SOLISTA' : '',
      participation_status: holder ? (normalizarTexto(holder.participation_status) ||
        participationStatus(holder, !!pending[normalizarTexto(holder.submission_id)])) : '',
      final_confirmation: holder ? holder.final_confirmation : '',
      attendance_status: holder ? holder.attendance_status : '', check_in_time: holder ? holder.check_in_time : '',
      offered_to: offered ? offered.artistic_name + ' (' + offered.submission_id + ')' : (s.offered_to || '')
    };
  });
  return {
    name: 'AGENDA',
    columns: [xlsCol('slot_code'), xlsCol('slot_status'), xlsCol('final_block', null, true), xlsCol('ventana'),
              xlsCol('arrival_time'), xlsCol('audition_time'), xlsCol('artistic_name'), xlsCol('submission_id'),
              xlsCol('participation_mode'), xlsCol('participation_status'), xlsCol('final_confirmation'),
              xlsCol('attendance_status'), xlsCol('check_in_time'), xlsCol('offered_to')],
    rows: rows
  };
}

function xlsScheduleChanges(src) {
  var names = {};
  src.projects.forEach(function (r) { if (normalizarTexto(r.code)) names[normalizarComparable(r.code)] = r.artistic_name; });
  var rows = src.changes.map(function (c) {
    return {
      solicitud_id: c.solicitud_id, code: c.code, artistic_name: names[normalizarComparable(c.code)] || '',
      original_block: c.original_block, original_time: clockText(c.original_time) || c.original_time, at: c.at,
      can_attend_original: c.can_attend_original === '' ? '' : xlsYesNo(c.can_attend_original), reason_short: c.reason_short,
      estado: c.estado, nuevo_bloque: c.nuevo_bloque, nueva_hora: clockText(c.nueva_hora) || c.nueva_hora,
      resuelto_at: c.resuelto_at, resuelto_by: c.resuelto_by, observacion: c.observacion,
      notificacion_estado: c.notificacion_estado
    };
  });
  return {
    name: 'CAMBIOS_TURNO',
    columns: [xlsCol('solicitud_id'), xlsCol('code'), xlsCol('artistic_name'), xlsCol('original_block', null, true),
              xlsCol('original_time'), xlsCol('at', 'SOLICITADO EL'), xlsCol('can_attend_original'), xlsCol('reason_short'),
              xlsCol('estado'), xlsCol('nuevo_bloque', null, true), xlsCol('nueva_hora'), xlsCol('resuelto_at'),
              xlsCol('resuelto_by'), xlsCol('observacion'), xlsCol('notificacion_estado')],
    rows: rows
  };
}

/** JURADO_1..3 for a user: "jurado N" in the note, else a trailing digit in the alias (same rule as hojaDeJurado). */
function xlsJurySheetOf(user) {
  var m = String(user.nota || '').match(/jurado\s*([123])/i) || String(user.email_o_alias || '').match(/([123])\s*$/);
  return m ? 'JURADO_' + m[1] : '';
}

/** Jurors with their sheet and card counts. The token column is never read into the export. */
function xlsJurors(src) {
  var bySheet = {};
  src.jury.forEach(function (cards, i) {
    var c = { borradores: 0, enviadas: 0 };
    cards.forEach(function (card) {
      if (!normalizarTexto(card.code)) return;
      if (normalizarComparable(card.estado) === EVALUATION_STATE.ENVIADA) c.enviadas++; else c.borradores++;
    });
    bySheet['JURADO_' + (i + 1)] = c;
  });
  var rows = src.users.filter(function (u) { return normalizarComparable(u.rol) === 'JURADO'; }).map(function (u) {
    var sheet = xlsJurySheetOf(u);
    var c = bySheet[sheet] || { borradores: 0, enviadas: 0 };
    return {
      email_o_alias: u.email_o_alias, hoja: sheet || '(sin hoja: revisar la nota en _USUARIOS)',
      // Same rule as estadoUsuario(): only NO / FALSE disables an account.
      activo: ['NO', 'FALSE'].indexOf(normalizarComparable(u.activo)) !== -1 ? 'NO' : 'SI', creado_at: u.creado_at, nota: u.nota,
      borradores: c.borradores, enviadas: c.enviadas, tarjetas: c.borradores + c.enviadas
    };
  });
  return {
    name: 'JURADOS',
    columns: [xlsCol('email_o_alias'), xlsCol('hoja'), xlsCol('activo'), xlsCol('creado_at'), xlsCol('nota'),
              xlsCol('borradores', null, true), xlsCol('enviadas', null, true), xlsCol('tarjetas', null, true)],
    rows: rows
  };
}

function xlsScores(src) {
  var categories = activeRubricCategories();
  var rows = [];
  src.jury.forEach(function (cards, i) {
    cards.forEach(function (card) {
      if (!normalizarTexto(card.code)) return;
      var row = {
        jurado: i + 1, code: card.code, artistic_name: card.artistic_name, rubric_version: card.rubric_version,
        total: card.total, desempate: card.desempate, estado: normalizarTexto(card.estado) || EVALUATION_STATE.BORRADOR,
        dq_flag: xlsYesNo(card.dq_flag), dq_causa: card.dq_causa, observaciones: card.observaciones,
        evaluado_by: card.evaluado_by, enviado_at: card.enviado_at
      };
      categories.forEach(function (c) { row[c.id] = card[c.id]; });
      rows.push(row);
    });
  });
  rows.sort(function (a, b) { return String(a.code) < String(b.code) ? -1 : (String(a.code) > String(b.code) ? 1 : a.jurado - b.jurado); });
  var columns = [xlsCol('jurado', null, true), xlsCol('code'), xlsCol('artistic_name'), xlsCol('rubric_version')]
    .concat(categories.map(function (c) { return xlsCol(c.id, String(c.corta || c.categoria).toUpperCase() + ' (x' + c.factor + ')', true); }))
    .concat([xlsCol('total', null, true), xlsCol('desempate', null, true), xlsCol('estado'), xlsCol('dq_flag'),
             xlsCol('dq_causa'), xlsCol('observaciones'), xlsCol('evaluado_by'), xlsCol('enviado_at')]);
  return { name: 'CALIFICACIONES', columns: columns, rows: rows };
}

function xlsInsuranceTable(rows) {
  return { name: 'SEGURO_MAYORCA', columns: COLUMNAS_SEGURO.map(function (k) { return xlsCol(k); }), rows: rows };
}

function xlsCopyTable(name, masterSheet) {
  var copy = xlsMasterCopy(masterSheet);
  return { name: name, columns: copy.columns, rows: copy.rows };
}

/** Normalized catalogs. Values come from the constants in force, so a new state shows up by itself. */
function xlsLists() {
  var rows = [];
  function add(list, values, labels) {
    values.forEach(function (v) {
      rows.push({ lista: list, valor: v, etiqueta: (labels && labels[v]) || XLS_STATE_MEANING[v] || '' });
    });
  }
  function valuesOf(obj) { return Object.keys(obj || {}).map(function (k) { return obj[k]; }); }
  add('APTITUD', valuesOf(ESTADO_ELEGIBILIDAD).filter(function (v) { return v !== 'REVISION' && v !== 'NO_CUMPLE'; }));
  add('PARTICIPACIÓN', valuesOf(PARTICIPATION));
  add('EVALUACIÓN DEL PROYECTO', valuesOf(EVALUATION_STATUS));
  add('TARJETA DE JURADO', valuesOf(EVALUATION_STATE));
  add('RANKING', valuesOf(RANKING_STATUS));
  add('DESCALIFICACIÓN', valuesOf(DQ_STATUS));
  add('BOLSA', valuesOf(POOL_STATUS));
  add('OFERTA DE CUPO', valuesOf(OFFER_STATUS));
  add('ESTADO DEL CUPO', valuesOf(SLOT_STATUS));
  add('MODALIDAD', valuesOf(PARTICIPATION_MODE));
  add('TIPO DE PERSONA', valuesOf(PERSON_ROLE));
  add('AUTORIZACIÓN', valuesOf(MEMBER_STATUS));
  add('ROL DE EQUIPO', CREW_ROLES, CREW_ROLE_LABELS);
  add('TIPO DE DOCUMENTO', DOCUMENT_TYPES, DOCUMENT_TYPE_LABELS);
  DQ_CAUSES.forEach(function (c) { rows.push({ lista: 'CAUSAL DE DESCALIFICACIÓN', valor: c.id, etiqueta: c.etiqueta }); });
  RUBRIC_SCALE.forEach(function (s) { rows.push({ lista: 'ESCALA DE LA RÚBRICA', valor: s.nota, etiqueta: s.etiqueta }); });
  ['SIN_FIRMA', 'SIN_FIRMA_INDIVIDUAL', 'PERSONA_EN_VARIOS_PROYECTOS'].forEach(function (a, i) {
    rows.push({ lista: 'ALERTA', valor: a, etiqueta: [
      'La persona no tiene firma registrada.',
      'Proyecto sin fila de integrante: la persona sólo aceptó en el Formulario 1, sin firma individual.',
      'La misma persona (mismo documento) aparece en varios proyectos. Revisar; nunca se elimina sola.'][i] });
  });
  return { name: 'LISTAS', columns: [xlsCol('lista'), xlsCol('valor'), xlsCol('etiqueta')], rows: rows };
}

function xlsReadme(kind, insurance, options) {
  var rows = [];
  function add(seccion, concepto, detalle, background) {
    rows.push({ seccion: seccion, concepto: concepto, detalle: detalle, _background: background || null });
  }
  var rubric = activeRubric();
  add('GENERAL', 'Documento', kind === 'SEGURO' ? 'EL BÚNKER — Personas para la póliza del C.C. Mayorca'
                                                : 'EL BÚNKER — Exportación corporativa de la convocatoria');
  add('GENERAL', 'Generado el', ahoraISO());
  add('GENERAL', 'Versión del sistema', VERSION_SISTEMA);
  add('GENERAL', 'Entorno', entorno() === 'PRUEBAS' ? 'PRUEBAS (datos ficticios)' : 'PRODUCCIÓN');
  add('GENERAL', 'Rúbrica vigente', rubric.version + (rubric.valida ? '' : ' (INVÁLIDA: ' + rubric.errores.join(' ') + ')'));
  add('GENERAL', 'Fuente de verdad', 'La base maestra del sistema. Este archivo es una foto de ese momento: ' +
      'lo que se edite aquí NO vuelve al sistema.');
  add('GENERAL', 'Datos personales', options && options.masked
    ? 'Enmascarados: el rol que generó el archivo no ve documentos, correos ni teléfonos completos.'
    : 'Completos. Documento privado: no se comparte fuera del equipo autorizado.');
  add('GENERAL', 'Cómo filtrar', 'Cada hoja tiene fila de títulos congelada y filtro: usa los botones de la fila 1 ' +
      '(código, nombre artístico, modalidad, tipo de persona, firma, estado).');
  (kind === 'SEGURO' ? ['README_OPERACION', 'SEGURO_MAYORCA'] : CORPORATE_SHEETS).forEach(function (name) {
    add('HOJAS', name, XLS_SHEET_LEGEND[name]);
  });
  add('COLORES', 'Verde', 'Cumplido: APTO, ENVIADA, AUTORIZADO, CONFIRMADO, TOP10_SELECCIONADO, ASIGNADO…', XLS_COLOR.OK);
  add('COLORES', 'Ámbar', 'Pendiente o por revisar: EN_REVISION, PENDIENTE, BORRADOR, SUPLENTE, alertas…', XLS_COLOR.WARN);
  add('COLORES', 'Rojo', 'Negativo o fuera: NO_APTO, DUPLICADO, DESCALIFICADO, RETIRADO, NO_SHOW, RECHAZADO…', XLS_COLOR.BAD);
  if (kind !== 'SEGURO') {
    add('ESTADOS', 'Aptitud', 'RECIBIDO → EN_REVISION → APTO / NO_APTO / INCOMPLETO / DUPLICADO');
    add('ESTADOS', 'Participación', 'SIN_TURNO, INVITADO, CONFIRMADO, CAMBIO_PENDIENTE, CAMBIO_APROBADO, NO_CONFIRMADO, ' +
        'NO_SHOW, CONTINGENCIA, AUDICIONADO, NO_AUDICIONADO, RETIRADO');
    add('ESTADOS', 'Evaluación', 'SIN_CALIFICAR, PARCIAL, COMPLETA, BLOQUEADA, DQ_PENDIENTE, DESCALIFICADO');
    add('ESTADOS', 'Ranking', 'SIN_RANKING, RANKED, TOP20 (privado), TOP10_SELECCIONADO, TIE_REVIEW_REQUIRED, NO_SELECCIONADO');
    add('ESTADOS', 'Detalle', 'El significado de cada valor está en la hoja LISTAS.');
  } else {
    add('ALERTAS', 'SIN_FIRMA', 'La persona no tiene firma registrada.');
    add('ALERTAS', 'SIN_FIRMA_INDIVIDUAL', 'Sólo aceptó en el Formulario 1, sin firma individual.');
    add('ALERTAS', 'PERSONA_EN_VARIOS_PROYECTOS', 'Mismo documento en varios proyectos: revisar, no se elimina sola.');
  }
  var s = insuranceSummary(insurance);
  add('SEGURO', 'Proyectos con código vigente', s.proyectos);
  add('SEGURO', 'Personas distintas', s.personas);
  add('SEGURO', 'Intérpretes (filas)', s.interpretes);
  add('SEGURO', 'Equipo de trabajo (filas)', s.equipo);
  add('SEGURO', 'Filas sin firma', s.sin_firma);
  add('SEGURO', 'Personas en varios proyectos', s.repetidas);
  return { name: 'README_OPERACION', columns: [xlsCol('seccion'), xlsCol('concepto'), xlsCol('detalle')], rows: rows };
}

/**
 * The corporate workbook: 15 sheets, read from the master spreadsheet only (RESULTADOS and
 * DASHBOARD are copied as materialized: run refrescarVistas() first). Returns
 * { nombre, id, url, bytes, hojas: { sheet: dataRows }, temporal_id, temporal_en_papelera }.
 * options.masked hides document numbers, e-mails and phones.
 */
function buildCorporateWorkbook(name, options) {
  options = options || {};
  var src = xlsReadSources();
  var relations = xlsRelationAlerts(projectPeople(src.projects, src.members));
  relations.sort(xlsByProjectThenPerson);
  var insurance = insuranceRows(src.projects, src.members);
  var tables = [
    xlsReadme('CORPORATIVO', insurance, options),
    xlsMasterProjects(src, relations),
    xlsPeople(relations),
    xlsRelationTable('INTERPRETES', relations, PERSON_ROLE.INTERPRETE),
    xlsRelationTable('EQUIPO_TRABAJO', relations, PERSON_ROLE.EQUIPO_TRABAJO),
    xlsAgenda(src),
    xlsScheduleChanges(src),
    xlsJurors(src),
    xlsScores(src),
    xlsCopyTable('RESULTADOS', HOJA.RESULTADOS),
    xlsCopyTable('DASHBOARD', HOJA.DASHBOARD),
    xlsCopyTable('EMAIL_LOG', HOJA.EMAIL_LOG),
    xlsInsuranceTable(insurance),
    xlsCopyTable('PARAMETROS_RUBRICA', HOJA.PARAMETROS_RUBRICA),
    xlsLists()
  ];
  return xlsBuildWorkbook(xlsFileName(name, 'EXCEL'), tables, options);
}

/** The venue insurance workbook: a short README_OPERACION and SEGURO_MAYORCA (full documents). */
function buildInsuranceWorkbook(name) {
  var insurance = insuranceRows(leerHoja(HOJA.REGISTRO), leerHoja(HOJA.INTEGRANTES));
  var tables = [xlsReadme('SEGURO', insurance, {}), xlsInsuranceTable(insurance)];
  var r = xlsBuildWorkbook(xlsFileName(name, 'SEGURO-MAYORCA'), tables, {});
  r.resumen = insuranceSummary(insurance);
  return r;
}

/** Panel action (capability 'exportar'): refreshes the views, then writes the corporate workbook. */
function accionExportarExcel(datos, sesion) {
  datos = datos || {};
  sesion = sesion || {};
  if (typeof refrescarVistas === 'function') refrescarVistas();
  var masked = !(typeof puede === 'function' && puede(sesion.rol, 'registro_lectura'));
  var r = buildCorporateWorkbook(datos.nombre, { masked: masked });
  registrar(sesion.alias, sesion.rol, 'EXPORTAR_EXCEL', r.nombre, r.bytes + ' bytes' + (masked ? ' (datos enmascarados)' : ''));
  return r;
}

/** Panel action (capability 'seguro'): the insurance workbook for the venue policy. */
function accionExportarSeguro(datos, sesion) {
  datos = datos || {};
  sesion = sesion || {};
  var r = buildInsuranceWorkbook(datos.nombre);
  registrar(sesion.alias, sesion.rol, 'EXPORTAR_SEGURO', r.nombre,
            r.bytes + ' bytes · ' + r.resumen.personas + ' personas en ' + r.resumen.proyectos + ' proyectos');
  return r;
}
