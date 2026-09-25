/**
 * EL BUNKER - Core: normalization, eligibility and duplicate detection.
 *
 * PURE FUNCTIONS ONLY. No SpreadsheetApp / no Session / no side effects.
 * This file is loaded verbatim by the Node test runner (test/loader.js), so it
 * must stay free of Apps Script globals.
 */

/** Eligibility / duplicate vocabulary. Kept as constants so typos fail loudly. */
var ESTADO_ELEGIBILIDAD = {
  APTO: 'APTO',
  INCOMPLETO: 'INCOMPLETO',
  NO_CUMPLE: 'NO_CUMPLE',
  REVISION: 'REVISION',
  DUPLICADO: 'DUPLICADO'
};

var MOTIVO_DUPLICADO = {
  NINGUNO: '',
  CEDULA: 'CEDULA_REPETIDA',
  EMAIL: 'EMAIL_REPETIDO',
  TELEFONO: 'TELEFONO_REPETIDO'
};

/**
 * Fields that must be present and non-empty for a submission to be complete.
 * Iteration 2 replaced the generic "discipline" with participation mode and
 * main genre, and added the performance, equipment and backing-track answers.
 * Yes/No answers count as present when answered either way.
 */
var CAMPOS_OBLIGATORIOS = [
  'full_name', 'id_number', 'birth_date', 'neighborhood_sector',
  'resides_in_sabaneta', 'email', 'whatsapp',
  'participation_mode', 'genre_primary', 'audition_description',
  'presentation_format', 'own_equipment', 'track_uses',
  'adult_confirmation', 'availability_statement',
  'accept_terms', 'accept_data_processing'
];

/**
 * Statements that must be explicitly true. Silence is never an authorization:
 * an unticked box and a missing field are the same thing here.
 * WhatsApp and image/voice are independent, optional authorizations.
 */
var CONSENTIMIENTOS_OBLIGATORIOS = ['accept_terms', 'accept_data_processing', 'adult_confirmation', 'availability_statement'];

/** Participation modes. A duo or a group is ONE project and takes ONE seat. */
var PARTICIPATION_MODE = { SOLISTA: 'SOLISTA', DUO: 'DUO', AGRUPACION: 'AGRUPACION' };

var PRESENTATION_FORMATS = ['VOZ_PISTA', 'VOZ_INSTRUMENTO', 'INSTRUMENTAL', 'DJ_SET', 'FREESTYLE_PERFORMANCE', 'OTRA'];

var TRACK_METHODS = ['ARCHIVO', 'USB', 'WHATSAPP', 'OTRO'];

var TRACK_STATUS = {
  NO_APLICA: 'NO APLICA',
  PENDIENTE: 'PISTA PENDIENTE',
  RECIBIDA: 'PISTA RECIBIDA',
  VALIDADA: 'PISTA VALIDADA',
  PROBLEMA: 'PISTA CON PROBLEMA'
};

var VIDEO_STATUS = {
  SIN_VIDEO: 'SIN VIDEO',
  PENDIENTE: 'PENDIENTE',
  ACCESIBLE: 'ACCESIBLE',
  NO_ACCESIBLE: 'NO ACCESIBLE',
  NO_VERIFICABLE: 'NO VERIFICABLE'
};

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

function normalizarTexto(valor) {
  if (valor === null || valor === undefined) return '';
  return String(valor).replace(/\s+/g, ' ').trim();
}

/** Strips accents and uppercases. Used for name/sector comparison, never for storage. */
function normalizarComparable(valor) {
  return normalizarTexto(valor)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

/**
 * Colombian ID: digits only, leading zeros stripped, dots/spaces/dashes removed.
 * "1.036.448.960" and "1036448960" must collide.
 */
function normalizarCedula(valor) {
  var soloDigitos = normalizarTexto(valor).replace(/\D/g, '');
  return soloDigitos.replace(/^0+/, '');
}

/**
 * Lowercase + trim only. Deliberately does NOT strip gmail dots or +tags:
 * merging distinct humans is a worse failure than missing a duplicate alert.
 */
function normalizarEmail(valor) {
  return normalizarTexto(valor).toLowerCase();
}

/**
 * Keeps the last 10 digits so +57 300..., 57300..., 300... all collide.
 * Shorter numbers are returned as-is so they can still be flagged invalid.
 */
function normalizarTelefono(valor) {
  var soloDigitos = normalizarTexto(valor).replace(/\D/g, '');
  if (soloDigitos.length > 10) return soloDigitos.slice(-10);
  return soloDigitos;
}

// ---------------------------------------------------------------------------
// Field-level validators
// ---------------------------------------------------------------------------

function esEmailValido(valor) {
  var email = normalizarEmail(valor);
  if (!email || email.length > 254) return false;
  return /^[^\s@,;]+@[^\s@.,;]+(\.[^\s@.,;]+)+$/.test(email);
}

/** Colombian mobile: 10 digits starting with 3. Landlines are rejected on purpose. */
function esTelefonoValido(valor) {
  var tel = normalizarTelefono(valor);
  return /^3\d{9}$/.test(tel);
}

function esCedulaValida(valor) {
  var cedula = normalizarCedula(valor);
  return /^\d{6,10}$/.test(cedula);
}

/** Accepts http(s) URLs only. Empty is handled by the caller (video is optional). */
function esUrlValida(valor) {
  var url = normalizarTexto(valor);
  if (!url) return false;
  if (!/^https?:\/\/[^\s]+\.[^\s]{2,}/i.test(url)) return false;
  return url.length <= 2000;
}

/** Parses YYYY-MM-DD, DD/MM/YYYY and Date objects into {y,m,d} or null. */
function parsearFecha(valor) {
  if (valor instanceof Date && !isNaN(valor.getTime())) {
    return { y: valor.getFullYear(), m: valor.getMonth() + 1, d: valor.getDate() };
  }
  var texto = normalizarTexto(valor);
  if (!texto) return null;

  var iso = texto.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return validarCalendario(+iso[1], +iso[2], +iso[3]);

  var latino = texto.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (latino) return validarCalendario(+latino[3], +latino[2], +latino[1]);

  return null;
}

/** Rejects impossible dates (31/02) instead of letting Date roll them over. */
function validarCalendario(y, m, d) {
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  var fecha = new Date(Date.UTC(y, m - 1, d));
  if (fecha.getUTCFullYear() !== y || fecha.getUTCMonth() !== m - 1 || fecha.getUTCDate() !== d) {
    return null;
  }
  return { y: y, m: m, d: d };
}

/**
 * Completed years at a reference date. The reference is the EVENT date, not the
 * submission date: someone who turns 18 the day before the auditions is eligible
 * and someone who turns 29 that week is not. Configurable via CONFIG.edad_ref.
 */
function calcularEdad(fechaNacimiento, fechaReferencia) {
  var nac = parsearFecha(fechaNacimiento);
  var ref = parsearFecha(fechaReferencia);
  if (!nac || !ref) return null;

  var edad = ref.y - nac.y;
  if (ref.m < nac.m || (ref.m === nac.m && ref.d < nac.d)) edad--;
  return edad;
}

function edadEnRango(edad, minima, maxima) {
  if (edad === null || edad === undefined) return false;
  return edad >= minima && edad <= maxima;
}

// ---------------------------------------------------------------------------
// Submission-level validation
// ---------------------------------------------------------------------------

function esVerdadero(valor) {
  if (valor === true) return true;
  var texto = normalizarComparable(valor);
  return texto === 'TRUE' || texto === 'SI' || texto === 'SÍ' || texto === 'YES' ||
         texto === '1' || texto === 'ON' || texto === 'ACEPTO';
}

/**
 * Validates one submission in isolation (no duplicate check here).
 * Returns { eligibility_status, edad, errores:[], avisos:[] }.
 *
 * Contract: a submission is NEVER rejected at the door. Everything is stored and
 * labelled, because the spec forbids silent deletion and demands traceability.
 */
function validarInscripcion(datos, opciones) {
  opciones = opciones || {};
  var fechaEvento = opciones.fecha_evento || '2026-10-23';
  var edadMinima = opciones.edad_minima === undefined ? 18 : opciones.edad_minima;
  var edadMaxima = opciones.edad_maxima === undefined ? 30 : opciones.edad_maxima;
  var exigirVideo = !!opciones.exigir_video;
  var maxMembers = opciones.integrantes_max || 15;

  var errores = [];
  var avisos = [];

  // 1. Completeness ---------------------------------------------------------
  for (var i = 0; i < CAMPOS_OBLIGATORIOS.length; i++) {
    var campo = CAMPOS_OBLIGATORIOS[i];
    var valor = datos[campo];
    var vacio = valor === null || valor === undefined || normalizarTexto(valor) === '';
    if (vacio) errores.push({ campo: campo, codigo: 'FALTANTE', mensaje: 'Campo obligatorio sin diligenciar.' });
  }

  // 2. Mandatory consents and statements -------------------------------------
  for (var c = 0; c < CONSENTIMIENTOS_OBLIGATORIOS.length; c++) {
    var consent = CONSENTIMIENTOS_OBLIGATORIOS[c];
    var yaFalta = errores.some(function (e) { return e.campo === consent; });
    if (!yaFalta && !esVerdadero(datos[consent])) {
      errores.push({ campo: consent, codigo: 'CONSENTIMIENTO', mensaje: 'Declaracion o autorizacion obligatoria no otorgada.' });
    }
  }

  // 2b. Project shape (iteration 2) ------------------------------------------
  projectShapeErrors(datos, maxMembers).forEach(function (e) { errores.push(e); });

  var incompleto = errores.length > 0;

  // 3. Format ---------------------------------------------------------------
  if (normalizarTexto(datos.id_number) && !esCedulaValida(datos.id_number)) {
    errores.push({ campo: 'id_number', codigo: 'FORMATO', mensaje: 'El documento debe tener entre 6 y 10 digitos.' });
  }
  if (normalizarTexto(datos.email) && !esEmailValido(datos.email)) {
    errores.push({ campo: 'email', codigo: 'FORMATO', mensaje: 'Correo electronico invalido.' });
  }
  if (normalizarTexto(datos.whatsapp) && !esTelefonoValido(datos.whatsapp)) {
    errores.push({ campo: 'whatsapp', codigo: 'FORMATO', mensaje: 'Numero celular colombiano invalido (10 digitos, inicia en 3).' });
  }
  if (normalizarTexto(datos.full_name) && normalizarTexto(datos.full_name).length < 5) {
    errores.push({ campo: 'full_name', codigo: 'FORMATO', mensaje: 'Escribe tu nombre completo.' });
  }

  // 4. Video: optional by default, reviewable when malformed -----------------
  var video = normalizarTexto(datos.video_url);
  if (video && !esUrlValida(video)) {
    if (exigirVideo) {
      errores.push({ campo: 'video_url', codigo: 'FORMATO', mensaje: 'Enlace de video invalido.' });
    } else {
      avisos.push({ campo: 'video_url', codigo: 'REVISION', mensaje: 'Enlace de video con formato dudoso: revisar manualmente.' });
    }
  } else if (!video && exigirVideo) {
    errores.push({ campo: 'video_url', codigo: 'FALTANTE', mensaje: 'Enlace de video obligatorio.' });
  }

  // 5. Age ------------------------------------------------------------------
  var edad = null;
  var fechaOk = !!parsearFecha(datos.birth_date);
  if (normalizarTexto(datos.birth_date) && !fechaOk) {
    errores.push({ campo: 'birth_date', codigo: 'FORMATO', mensaje: 'Fecha de nacimiento invalida.' });
  } else if (fechaOk) {
    edad = calcularEdad(datos.birth_date, fechaEvento);
    if (!edadEnRango(edad, edadMinima, edadMaxima)) {
      errores.push({
        campo: 'birth_date',
        codigo: 'EDAD',
        mensaje: 'La convocatoria es para personas de ' + edadMinima + ' a ' + edadMaxima +
                 ' anos cumplidos al ' + fechaEvento + '. Edad calculada: ' + edad + '.'
      });
    }
  }

  // 6. Residence ------------------------------------------------------------
  var resideDeclarado = esVerdadero(datos.resides_in_sabaneta);
  if (normalizarTexto(datos.resides_in_sabaneta) !== '' && !resideDeclarado) {
    errores.push({
      campo: 'resides_in_sabaneta',
      codigo: 'RESIDENCIA',
      mensaje: 'La convocatoria es exclusiva para residentes en Sabaneta, Antioquia.'
    });
  }

  // 7. Verdict --------------------------------------------------------------
  var estado;
  var tieneErrorDeRegla = errores.some(function (e) {
    return e.codigo === 'EDAD' || e.codigo === 'RESIDENCIA';
  });

  if (tieneErrorDeRegla) {
    estado = ESTADO_ELEGIBILIDAD.NO_CUMPLE;
  } else if (errores.length > 0) {
    estado = ESTADO_ELEGIBILIDAD.INCOMPLETO;
  } else if (avisos.length > 0) {
    estado = ESTADO_ELEGIBILIDAD.REVISION;
  } else {
    estado = ESTADO_ELEGIBILIDAD.APTO;
  }

  return {
    eligibility_status: estado,
    edad: edad,
    incompleto: incompleto,
    errores: errores,
    avisos: avisos
  };
}

// ---------------------------------------------------------------------------
// Duplicate detection
// ---------------------------------------------------------------------------

/**
 * Compares a candidate against already-stored registrations.
 *
 * Hard rule from the spec: an ID collision is a DUPLICATE (the first valid one
 * wins and keeps the seat); an email or phone collision is only an ALERT,
 * because families and friends legitimately share a phone or a mailbox.
 * Nothing is ever deleted here - the caller only labels.
 *
 * @param {Object} candidato  normalized_* fields already computed.
 * @param {Array}  existentes rows with normalized_id_number/email/phone + submission_id.
 */
function detectarDuplicado(candidato, existentes) {
  var cedula = candidato.normalized_id_number || '';
  var email = candidato.normalized_email || '';
  var telefono = candidato.normalized_phone || '';

  var razones = [];
  var principal = '';
  var duplicado = false;

  for (var i = 0; i < existentes.length; i++) {
    var fila = existentes[i];
    if (fila.submission_id && fila.submission_id === candidato.submission_id) continue;
    // A row already marked DUPLICATE must not itself absorb a seat, but it still
    // counts as evidence of a prior collision, so it is compared normally.

    // Stored values are normalized again: Sheets may hand back a numeric ID
    // (1036448960) where the candidate carries the text "1036448960".
    if (cedula && normalizarCedula(fila.normalized_id_number) === cedula) {
      duplicado = true;
      if (!principal) principal = fila.submission_id || '';
      if (razones.indexOf(MOTIVO_DUPLICADO.CEDULA) === -1) razones.push(MOTIVO_DUPLICADO.CEDULA);
    }
    if (email && normalizarEmail(fila.normalized_email) === email && razones.indexOf(MOTIVO_DUPLICADO.EMAIL) === -1) {
      razones.push(MOTIVO_DUPLICADO.EMAIL);
      if (!principal) principal = fila.submission_id || '';
    }
    if (telefono && normalizarTelefono(fila.normalized_phone) === telefono && razones.indexOf(MOTIVO_DUPLICADO.TELEFONO) === -1) {
      razones.push(MOTIVO_DUPLICADO.TELEFONO);
      if (!principal) principal = fila.submission_id || '';
    }
  }

  return {
    duplicate_flag: duplicado,                                  // true only on ID collision
    alerta: !duplicado && razones.length > 0,                   // email/phone collision only
    duplicate_reason: razones.join('|'),
    registro_principal: principal
  };
}

// ---------------------------------------------------------------------------
// Iteration 2: project shape, groups, members, test-data markers
// ---------------------------------------------------------------------------

/** "Solista", "Dúo", "duo", "Agrupación" ... -> SOLISTA / DUO / AGRUPACION, or ''. */
function normalizeParticipationMode(value) {
  var v = normalizarComparable(value).replace(/[^A-Z]/g, '');
  if (v === 'SOLISTA' || v === 'SOLO') return PARTICIPATION_MODE.SOLISTA;
  if (v === 'DUO') return PARTICIPATION_MODE.DUO;
  if (v === 'AGRUPACION' || v === 'GRUPO' || v === 'BANDA') return PARTICIPATION_MODE.AGRUPACION;
  return '';
}

function isGroupMode(mode) {
  var m = normalizeParticipationMode(mode);
  return m === PARTICIPATION_MODE.DUO || m === PARTICIPATION_MODE.AGRUPACION;
}

/** Answers that only exist for some shapes of project (groups, backing track, equipment). */
function projectShapeErrors(datos, maxMembers) {
  var errors = [];
  var modeRaw = normalizarTexto(datos.participation_mode);
  var mode = normalizeParticipationMode(modeRaw);

  if (modeRaw && !mode) {
    errors.push({ campo: 'participation_mode', codigo: 'FORMATO', mensaje: 'Modalidad invalida: elige Solista, Duo o Agrupacion.' });
  }
  if (isGroupMode(mode)) {
    if (!normalizarTexto(datos.artistic_name)) {
      errors.push({ campo: 'artistic_name', codigo: 'FALTANTE', mensaje: 'Escribe el nombre artistico de la agrupacion.' });
    }
    var declared = parseInt(datos.members_declared, 10);
    if (!normalizarTexto(datos.members_declared)) {
      errors.push({ campo: 'members_declared', codigo: 'FALTANTE', mensaje: 'Indica cuantos integrantes estaran en escena.' });
    } else if (mode === PARTICIPATION_MODE.DUO && declared !== 2) {
      errors.push({ campo: 'members_declared', codigo: 'FORMATO', mensaje: 'Un duo tiene exactamente 2 integrantes.' });
    } else if (mode === PARTICIPATION_MODE.AGRUPACION && !(declared >= 3 && declared <= maxMembers)) {
      errors.push({ campo: 'members_declared', codigo: 'FORMATO', mensaje: 'Una agrupacion tiene entre 3 y ' + maxMembers + ' integrantes en escena.' });
    }
  }

  var format = normalizarComparable(datos.presentation_format).replace(/[\s-]+/g, '_');
  if (format && PRESENTATION_FORMATS.indexOf(format) === -1) {
    errors.push({ campo: 'presentation_format', codigo: 'FORMATO', mensaje: 'Forma de presentacion invalida.' });
  }
  if (format === 'OTRA' && !normalizarTexto(datos.presentation_other)) {
    errors.push({ campo: 'presentation_other', codigo: 'FALTANTE', mensaje: 'Describe brevemente como sera tu presentacion.' });
  }

  if (esVerdadero(datos.own_equipment) && !normalizarTexto(datos.own_equipment_detail)) {
    errors.push({ campo: 'own_equipment_detail', codigo: 'FALTANTE', mensaje: 'Cuentanos que instrumento o equipo llevaras.' });
  }

  if (esVerdadero(datos.track_uses)) {
    var method = normalizarComparable(datos.track_method);
    if (!method) {
      errors.push({ campo: 'track_method', codigo: 'FALTANTE', mensaje: 'Indica como entregaras la pista.' });
    } else if (TRACK_METHODS.indexOf(method) === -1) {
      errors.push({ campo: 'track_method', codigo: 'FORMATO', mensaje: 'Metodo de entrega de pista invalido.' });
    } else if (method === 'OTRO' && !normalizarTexto(datos.track_method_other)) {
      errors.push({ campo: 'track_method_other', codigo: 'FALTANTE', mensaje: 'Describe el metodo de entrega de la pista.' });
    }
  }
  return errors;
}

/**
 * Comparison key for group names. It only feeds duplicate DETECTION: the name
 * the group typed is stored untouched, spelling is never "fixed" and nothing is
 * merged automatically - the operator decides.
 *   "El Arte es La Solución", "el arte es la solucion", "EL-ARTE, ES LA SOLUCIÓN!"
 *   all produce "el arte es la solucion".
 */
function groupMatchKey(name) {
  return normalizarTexto(name)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9ñ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Looks for an earlier group project with the same match key.
 * Returns { match: bool, ref: submission_id, name: display name } - never merges.
 */
function detectGroupMatch(candidate, existing) {
  var key = candidate.group_match_key || groupMatchKey(candidate.group_display_name || candidate.artistic_name);
  if (!key) return { match: false, ref: '', name: '' };
  for (var i = 0; i < existing.length; i++) {
    var row = existing[i];
    if (row.submission_id && row.submission_id === candidate.submission_id) continue;
    if (!isGroupMode(row.participation_mode)) continue;
    var rowKey = row.group_match_key || groupMatchKey(row.group_display_name || row.artistic_name);
    if (rowKey && rowKey === key) {
      return { match: true, ref: row.submission_id || '', name: row.group_display_name || row.artistic_name || '' };
    }
  }
  return { match: false, ref: '', name: '' };
}

/** GRP-001 style internal group code. */
function formatGroupCode(n) {
  var s = String(n);
  while (s.length < 3) s = '0' + s;
  return 'GRP-' + s;
}

/** Next group number: one above the highest ever issued, so numbers are never reused. */
function nextGroupNumber(rows) {
  var max = 0;
  for (var i = 0; i < rows.length; i++) {
    var m = String(rows[i].group_code || '').match(/^GRP-(\d+)$/i);
    if (m && parseInt(m[1], 10) > max) max = parseInt(m[1], 10);
  }
  return max + 1;
}

var MEMBER_STATUS = {
  AUTORIZADO: 'AUTORIZADO',
  INCOMPLETO: 'INCOMPLETO',
  NO_CUMPLE: 'NO CUMPLE'
};

/**
 * Validates one group member's individual authorization. The leader can not
 * authorize on behalf of the others, so each member answers for themself.
 */
function validateMember(datos, options) {
  options = options || {};
  var minAge = options.edad_minima === undefined ? 18 : options.edad_minima;
  var eventDate = options.fecha_evento || '2026-10-23';
  var requireSignature = options.firma_obligatoria !== false;
  var errors = [];

  ['full_name', 'id_number', 'birth_date', 'artistic_role'].forEach(function (field) {
    if (!normalizarTexto(datos[field])) errors.push({ campo: field, codigo: 'FALTANTE', mensaje: 'Campo obligatorio.' });
  });
  ['adult_confirmation', 'accept_terms', 'accept_data_processing'].forEach(function (field) {
    if (!esVerdadero(datos[field])) errors.push({ campo: field, codigo: 'CONSENTIMIENTO', mensaje: 'Declaracion o autorizacion obligatoria.' });
  });
  if (requireSignature && !normalizarTexto(datos.signature_png)) {
    errors.push({ campo: 'signature_png', codigo: 'FALTANTE', mensaje: 'Falta la firma.' });
  }
  if (normalizarTexto(datos.id_number) && !esCedulaValida(datos.id_number)) {
    errors.push({ campo: 'id_number', codigo: 'FORMATO', mensaje: 'El documento debe tener entre 6 y 10 digitos.' });
  }

  var age = null;
  if (normalizarTexto(datos.birth_date)) {
    if (!parsearFecha(datos.birth_date)) {
      errors.push({ campo: 'birth_date', codigo: 'FORMATO', mensaje: 'Fecha de nacimiento invalida.' });
    } else {
      age = calcularEdad(datos.birth_date, eventDate);
      if (age < minAge) {
        errors.push({ campo: 'birth_date', codigo: 'EDAD', mensaje: 'Cada integrante debe ser mayor de ' + minAge + ' anos el dia del evento.' });
      }
    }
  }

  var status = MEMBER_STATUS.AUTORIZADO;
  if (errors.some(function (e) { return e.codigo === 'EDAD'; })) status = MEMBER_STATUS.NO_CUMPLE;
  else if (errors.length) status = MEMBER_STATUS.INCOMPLETO;
  return { status: status, age: age, errors: errors };
}

/**
 * Rows created by the seed generator. Production refuses them: the brief
 * requires that production never receives test data.
 */
function isTestData(datos) {
  if (!datos) return false;
  if (normalizarComparable(datos.source) === 'SEED') return true;
  if (/^SEED-/i.test(String(datos.client_submission_id || ''))) return true;
  // .test is a reserved domain (RFC 2606): no real person has an address there.
  return /\.test$/i.test(normalizarEmail(datos.email));
}

// ---------------------------------------------------------------------------
// E-mail typo hint (shared verbatim with the browser via Function#toString)
// ---------------------------------------------------------------------------

/** Plain Levenshtein distance, small inputs only. */
function editDistance(a, b) {
  a = String(a || ''); b = String(b || '');
  var prev = [], cur = [], i, j;
  for (j = 0; j <= b.length; j++) prev[j] = j;
  for (i = 1; i <= a.length; i++) {
    cur = [i];
    for (j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

/**
 * Suggests the likely intended domain for a mistyped common provider
 * ("gmaik.com" -> "gmail.com"). It is only a hint shown to the person: the
 * address is never corrected automatically.
 */
function suggestEmailDomain(email) {
  var m = String(email || '').trim().toLowerCase().match(/^([^@\s]+)@([^@\s]+)$/);
  if (!m) return '';
  var domain = m[2];
  var known = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'live.com', 'hotmail.es', 'outlook.es', 'yahoo.es'];
  if (known.indexOf(domain) !== -1) return '';
  var best = '', bestDistance = 3;
  for (var k = 0; k < known.length; k++) {
    var d = editDistance(domain, known[k]);
    if (d > 0 && d < bestDistance) { bestDistance = d; best = known[k]; }
  }
  return best ? m[1] + '@' + best : '';
}

// ---------------------------------------------------------------------------
// Masking for roles that must not see personal data (direction)
// ---------------------------------------------------------------------------

/** "1036448960" -> "******8960". */
function maskIdNumber(value) {
  var digits = normalizarCedula(value);
  if (!digits) return '';
  return new Array(Math.max(0, digits.length - 4) + 1).join('*') + digits.slice(-4);
}

/** "maria.restrepo@gmail.com" -> "m***@gmail.com". */
function maskEmail(value) {
  var email = normalizarEmail(value);
  var at = email.indexOf('@');
  if (at < 1) return email ? '***' : '';
  return email.charAt(0) + '***' + email.slice(at);
}

/** "3012345678" -> "*** *** 5678". */
function maskPhone(value) {
  var phone = normalizarTelefono(value);
  if (!phone) return '';
  return '*** *** ' + phone.slice(-4);
}
