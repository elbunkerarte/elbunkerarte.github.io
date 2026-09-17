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

/** Fields that must be present and non-empty for a submission to be complete. */
var CAMPOS_OBLIGATORIOS = [
  'full_name', 'id_number', 'birth_date', 'neighborhood_sector',
  'resides_in_sabaneta', 'email', 'whatsapp', 'discipline',
  'audition_description', 'availability_statement',
  'accept_terms', 'accept_data_processing'
];

/** Consents that must be explicitly true. image/voice + whatsapp are optional. */
var CONSENTIMIENTOS_OBLIGATORIOS = ['accept_terms', 'accept_data_processing'];

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
  var fechaEvento = opciones.fecha_evento || '2026-10-02';
  var edadMinima = opciones.edad_minima === undefined ? 18 : opciones.edad_minima;
  var edadMaxima = opciones.edad_maxima === undefined ? 28 : opciones.edad_maxima;
  var exigirVideo = !!opciones.exigir_video;

  var errores = [];
  var avisos = [];

  // 1. Completeness ---------------------------------------------------------
  for (var i = 0; i < CAMPOS_OBLIGATORIOS.length; i++) {
    var campo = CAMPOS_OBLIGATORIOS[i];
    var valor = datos[campo];
    var vacio = valor === null || valor === undefined || normalizarTexto(valor) === '';
    if (vacio) errores.push({ campo: campo, codigo: 'FALTANTE', mensaje: 'Campo obligatorio sin diligenciar.' });
  }

  // 2. Mandatory consents ---------------------------------------------------
  for (var c = 0; c < CONSENTIMIENTOS_OBLIGATORIOS.length; c++) {
    var consent = CONSENTIMIENTOS_OBLIGATORIOS[c];
    if (!esVerdadero(datos[consent])) {
      errores.push({ campo: consent, codigo: 'CONSENTIMIENTO', mensaje: 'Autorizacion obligatoria no otorgada.' });
    }
  }

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

    if (cedula && fila.normalized_id_number === cedula) {
      duplicado = true;
      if (!principal) principal = fila.submission_id || '';
      if (razones.indexOf(MOTIVO_DUPLICADO.CEDULA) === -1) razones.push(MOTIVO_DUPLICADO.CEDULA);
    }
    if (email && fila.normalized_email === email && razones.indexOf(MOTIVO_DUPLICADO.EMAIL) === -1) {
      razones.push(MOTIVO_DUPLICADO.EMAIL);
      if (!principal) principal = fila.submission_id || '';
    }
    if (telefono && fila.normalized_phone === telefono && razones.indexOf(MOTIVO_DUPLICADO.TELEFONO) === -1) {
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
