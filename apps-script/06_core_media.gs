/**
 * EL BUNKER - Core: video-link checks, backing-track files and signatures.
 * PURE FUNCTIONS ONLY (loaded by the Node test runner). The network and Drive
 * calls that use them live in 33_media.gs.
 */

// ---------------------------------------------------------------------------
// Video links
// ---------------------------------------------------------------------------

/**
 * Which provider a video link belongs to, and the id when it matters.
 * The brief accepts unlisted YouTube, Drive with access, Vimeo or any URL.
 */
function classifyVideoUrl(url) {
  var u = normalizarTexto(url);
  if (!esUrlValida(u)) return { provider: 'invalid', id: '' };
  var m;
  if ((m = u.match(/^https?:\/\/(?:www\.|m\.)?youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|live\/|embed\/)([A-Za-z0-9_-]{6,})/i)) ||
      (m = u.match(/^https?:\/\/youtu\.be\/([A-Za-z0-9_-]{6,})/i))) {
    return { provider: 'youtube', id: m[1] };
  }
  if ((m = u.match(/^https?:\/\/(?:www\.|player\.)?vimeo\.com\/(?:video\/)?(\d+)/i))) return { provider: 'vimeo', id: m[1] };
  if ((m = u.match(/^https?:\/\/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]{10,})/i)) ||
      (m = u.match(/^https?:\/\/drive\.google\.com\/(?:open|uc)\?(?:.*&)?id=([A-Za-z0-9_-]{10,})/i))) {
    return { provider: 'drive', id: m[1] };
  }
  if ((m = u.match(/^https?:\/\/drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\/([A-Za-z0-9_-]{10,})/i))) {
    return { provider: 'drive_folder', id: m[1] };
  }
  if (/^https?:\/\/(?:www\.)?instagram\.com\//i.test(u)) return { provider: 'instagram', id: '' };
  if (/^https?:\/\/(?:www\.|vm\.|m\.)?tiktok\.com\//i.test(u)) return { provider: 'tiktok', id: '' };
  if (/^https?:\/\/(?:www\.|m\.|web\.)?(?:facebook\.com|fb\.watch)\//i.test(u)) return { provider: 'facebook', id: '' };
  return { provider: 'other', id: '' };
}

/**
 * The anonymous request that proves (or disproves) that an evaluator without
 * the owner's login can open the link. null = cannot be checked automatically
 * (social networks block robots; a person must look).
 */
function videoProbeRequest(url) {
  var c = classifyVideoUrl(url);
  var base = { muteHttpExceptions: true, followRedirects: false, method: 'get' };
  if (c.provider === 'youtube') {
    return Object.assign({ url: 'https://www.youtube.com/oembed?format=json&url=' +
      encodeURIComponent('https://www.youtube.com/watch?v=' + c.id), provider: c.provider }, base);
  }
  if (c.provider === 'vimeo') {
    return Object.assign({ url: 'https://vimeo.com/api/oembed.json?url=' +
      encodeURIComponent('https://vimeo.com/' + c.id), provider: c.provider }, base);
  }
  if (c.provider === 'drive') {
    return Object.assign({ url: 'https://drive.google.com/file/d/' + c.id + '/view', provider: c.provider }, base);
  }
  if (c.provider === 'drive_folder') {
    return Object.assign({ url: 'https://drive.google.com/drive/folders/' + c.id, provider: c.provider }, base);
  }
  if (c.provider === 'other') {
    // HEAD, not GET: a direct link to a video file must not be downloaded just to see if it opens.
    return Object.assign({ url: normalizarTexto(url), provider: c.provider }, base, { followRedirects: true, method: 'head' });
  }
  return null;
}

/** Turns the probe's HTTP answer into a status the operator understands. */
function interpretVideoProbe(provider, code, location, body) {
  var loc = String(location || '');
  var text = String(body || '').slice(0, 4000);
  var loginWall = /accounts\.google\.com|ServiceLogin|signin\/v2|v3\/signin/i;

  if (provider === 'youtube') {
    if (code === 200) return { status: VIDEO_STATUS.ACCESIBLE, detail: 'YouTube: publico o no listado.' };
    if (code === 401 || code === 403) return { status: VIDEO_STATUS.NO_ACCESIBLE, detail: 'YouTube: video privado o con restricciones.' };
    if (code === 400 || code === 404) return { status: VIDEO_STATUS.NO_ACCESIBLE, detail: 'YouTube: el video no existe o fue eliminado.' };
    return { status: VIDEO_STATUS.NO_VERIFICABLE, detail: 'YouTube respondio ' + code + '.' };
  }
  if (provider === 'vimeo') {
    if (code === 200) return { status: VIDEO_STATUS.ACCESIBLE, detail: 'Vimeo: accesible.' };
    if (code === 404) return { status: VIDEO_STATUS.NO_ACCESIBLE, detail: 'Vimeo: el video no existe o es privado.' };
    return { status: VIDEO_STATUS.NO_VERIFICABLE, detail: 'Vimeo respondio ' + code + ' (puede tener restricciones de privacidad).' };
  }
  if (provider === 'drive' || provider === 'drive_folder') {
    if ((code === 301 || code === 302 || code === 303) && loginWall.test(loc)) {
      return { status: VIDEO_STATUS.NO_ACCESIBLE, detail: 'Drive: pide iniciar sesión. Comparte como "Cualquier persona con el enlace".' };
    }
    if (code === 200 && loginWall.test(text) && !/drive-viewer|docs-title|og:title/i.test(text)) {
      return { status: VIDEO_STATUS.NO_ACCESIBLE, detail: 'Drive: pide iniciar sesión. Comparte como "Cualquier persona con el enlace".' };
    }
    if (code === 200) return { status: VIDEO_STATUS.ACCESIBLE, detail: 'Drive: abierto a cualquier persona con el enlace.' };
    if (code === 404) return { status: VIDEO_STATUS.NO_ACCESIBLE, detail: 'Drive: el archivo no existe.' };
    return { status: VIDEO_STATUS.NO_VERIFICABLE, detail: 'Drive respondio ' + code + '.' };
  }
  if (provider === 'other') {
    if (code >= 200 && code < 300) return { status: VIDEO_STATUS.ACCESIBLE, detail: 'El enlace abre (HTTP ' + code + ').' };
    if (code === 401 || code === 403 || code === 404 || code === 410) {
      return { status: VIDEO_STATUS.NO_ACCESIBLE, detail: 'El enlace no abre sin permisos (HTTP ' + code + ').' };
    }
    return { status: VIDEO_STATUS.NO_VERIFICABLE, detail: 'El sitio respondio ' + code + '.' };
  }
  return { status: VIDEO_STATUS.NO_VERIFICABLE, detail: 'Esta red no permite verificar automaticamente: se revisa a mano.' };
}

/** Status for a link without making any request (empty, malformed, social network). */
function videoStatusWithoutProbe(url) {
  var u = normalizarTexto(url);
  if (!u) return { status: VIDEO_STATUS.SIN_VIDEO, detail: '' };
  var c = classifyVideoUrl(u);
  if (c.provider === 'invalid') return { status: VIDEO_STATUS.NO_ACCESIBLE, detail: 'No es un enlace válido (debe empezar por https://).' };
  if (!videoProbeRequest(u)) return interpretVideoProbe(c.provider, 0, '', '');
  return null;
}

// ---------------------------------------------------------------------------
// Backing tracks
// ---------------------------------------------------------------------------

/** "Canción de Día!" -> "CANCION_DE_DIA". Used only for file names, never for data. */
function sanitizeForFileName(text, maxLength) {
  var s = normalizarTexto(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return s.slice(0, maxLength || 40).replace(/_+$/, '');
}

function fileExtension(name) {
  var m = String(name || '').toLowerCase().match(/\.([a-z0-9]{2,5})$/);
  return m ? m[1] : '';
}

/** B-XXX_NOMBREARTISTICO_NOMBRECANCION.ext, as the brief prescribes. */
function trackFileName(code, artisticName, songName, extension) {
  return [
    String(code || '').toUpperCase(),
    sanitizeForFileName(artisticName) || 'SIN_NOMBRE',
    sanitizeForFileName(songName) || 'SIN_CANCION'
  ].join('_') + '.' + String(extension || 'mp3').toLowerCase();
}

/**
 * Audio type from the first bytes, so a renamed .exe is not stored as a song.
 * Bytes may be signed (Apps Script) or unsigned.
 */
function detectAudioType(bytes) {
  if (!bytes || bytes.length < 12) return '';
  var b = [];
  for (var i = 0; i < 12; i++) b.push(bytes[i] & 0xff);
  var ascii = function (from, len) {
    return String.fromCharCode.apply(null, b.slice(from, from + len));
  };
  if (ascii(0, 3) === 'ID3') return 'mp3';
  if (ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WAVE') return 'wav';
  if (ascii(4, 4) === 'ftyp') return 'm4a';
  if (ascii(0, 4) === 'OggS') return 'ogg';
  if (ascii(0, 4) === 'fLaC') return 'flac';
  if (b[0] === 0xff && (b[1] & 0xf6) === 0xf0) return 'aac';          // ADTS
  if (b[0] === 0xff && (b[1] & 0xe0) === 0xe0) return 'mp3';          // MPEG frame sync
  return '';
}

/** Extensions that may legitimately contain each detected type. */
function audioTypeMatchesExtension(type, ext) {
  var ok = {
    mp3: ['mp3'], wav: ['wav'], m4a: ['m4a', 'mp4', 'aac'], ogg: ['ogg', 'oga', 'opus'],
    flac: ['flac'], aac: ['aac', 'm4a']
  };
  return !!type && (ok[type] || []).indexOf(ext) !== -1;
}

/** Validates an upload before anything touches Drive. */
function validateTrackUpload(fileName, byteLength, headBytes, options) {
  options = options || {};
  var maxMb = options.max_mb || 15;
  var allowed = String(options.formats || 'mp3,wav,m4a,aac,ogg,flac').toLowerCase().split(/[\s,]+/).filter(Boolean);
  var ext = fileExtension(fileName);
  if (!ext || allowed.indexOf(ext) === -1) {
    return { ok: false, error: 'Formato no permitido. Usa: ' + allowed.join(', ') + '.' };
  }
  if (!byteLength) return { ok: false, error: 'El archivo está vacío.' };
  if (byteLength > maxMb * 1024 * 1024) {
    return { ok: false, error: 'El archivo supera ' + maxMb + ' MB. Comprimelo (MP3 a 192 kbps) o entregalo en USB.' };
  }
  var type = detectAudioType(headBytes);
  if (!audioTypeMatchesExtension(type, ext)) {
    return { ok: false, error: 'El archivo no parece un audio ' + ext.toUpperCase() + ' válido.' };
  }
  return { ok: true, extension: ext, type: type };
}

// ---------------------------------------------------------------------------
// Drawn signatures
// ---------------------------------------------------------------------------

/** Splits "data:image/png;base64,...." and checks it really is a PNG. */
function parsePngDataUrl(dataUrl) {
  var m = String(dataUrl || '').match(/^data:image\/png;base64,([A-Za-z0-9+/=]+)$/);
  if (!m) return { ok: false, error: 'La firma no llegó en formato PNG.' };
  return { ok: true, base64: m[1] };
}

function isPngBytes(bytes) {
  var sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (!bytes || bytes.length < 8) return false;
  for (var i = 0; i < 8; i++) if ((bytes[i] & 0xff) !== sig[i]) return false;
  return true;
}

/** Hex string of a (possibly signed) byte array, e.g. a SHA-256 digest. */
function bytesToHex(bytes) {
  var out = '';
  for (var i = 0; i < bytes.length; i++) {
    var v = bytes[i] & 0xff;
    out += (v < 16 ? '0' : '') + v.toString(16);
  }
  return out;
}
