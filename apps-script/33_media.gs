/**
 * EL BUNKER - Drive folders for backing tracks and signatures, and the
 * video-link checks. The decisions (names, formats, statuses) are pure and
 * live in 06_core_media.gs; this file only talks to Drive and the network.
 */

/** Test-environment folders are prefixed so nobody mixes them up in Drive. */
function envFolderName(base) {
  return esPruebas() ? '[PRUEBAS] ' + base : base;
}

function rootFolderFromProperty(propKey, baseName) {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty(propKey);
  if (id) {
    try {
      var existing = DriveApp.getFolderById(id);
      if (!existing.isTrashed()) return existing;
    } catch (e) { /* recreated below */ }
  }
  var folder = DriveApp.createFolder(envFolderName(baseName));
  props.setProperty(propKey, folder.getId());
  return folder;
}

function audioRootFolder() { return rootFolderFromProperty(PROP.AUDIO_FOLDER, 'EL BUNKER - Audio'); }
function signaturesRootFolder() { return rootFolderFromProperty(PROP.SIGNATURES_FOLDER, 'EL BUNKER - Firmas'); }

function childFolder(parent, name) {
  var it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

/** Audio/B-001/ ... one folder per issued code. Idempotent. */
function prepareAudioFolders() {
  var root = audioRootFolder();
  var created = 0, existing = 0;
  leerHoja(HOJA.REGISTRO).forEach(function (r) {
    if (!normalizarTexto(r.code)) return;
    if (root.getFoldersByName(r.code).hasNext()) { existing++; return; }
    root.createFolder(r.code);
    created++;
  });
  return { creadas: created, existentes: existing, carpeta: root.getUrl() };
}

function audioMimeType(ext) {
  return { mp3: 'audio/mpeg', wav: 'audio/wav', m4a: 'audio/mp4', mp4: 'audio/mp4', aac: 'audio/aac',
           ogg: 'audio/ogg', oga: 'audio/ogg', opus: 'audio/ogg', flac: 'audio/flac' }[ext] || 'application/octet-stream';
}

function timestampForNames() {
  return Utilities.formatDate(new Date(), zonaHoraria(), 'yyyyMMdd-HHmmss');
}

/**
 * Stores a backing track as Audio/B-XXX/B-XXX_ARTISTA_CANCION.ext.
 * A previous file is never deleted: it is renamed ..._REEMPLAZADA_<fecha>, so
 * the technician can always go back to what was sent before.
 */
function storeTrack(row, originalName, base64, songName) {
  var bytes;
  try { bytes = Utilities.base64Decode(String(base64 || '')); }
  catch (e) { return { ok: false, error: 'El archivo llegó dañado. Intenta de nuevo.' }; }

  var check = validateTrackUpload(originalName, bytes.length, bytes.slice(0, 12), {
    max_mb: cfgNumero('pista_max_mb', 15),
    formats: cfg('pista_formatos', 'mp3,wav,m4a,aac,ogg,flac')
  });
  if (!check.ok) return check;

  var folder = childFolder(audioRootFolder(), row.code);
  var name = trackFileName(row.code, row.artistic_name || row.full_name, songName || row.song_name, check.extension);
  var stamp = timestampForNames();
  var previous = folder.getFiles();
  while (previous.hasNext()) {
    var f = previous.next();
    if (f.getName().indexOf('_REEMPLAZADA_') === -1) {
      f.setName(f.getName().replace(/(\.[A-Za-z0-9]+)?$/, '_REEMPLAZADA_' + stamp + '$1'));
    }
  }
  var file = folder.createFile(Utilities.newBlob(bytes, audioMimeType(check.extension), name));
  return { ok: true, file_id: file.getId(), file_name: name, url: file.getUrl(), bytes: bytes.length };
}

/** Saves a drawn signature and returns its Drive id and SHA-256 (evidence of what was stored). */
function storeSignature(groupCode, memberId, dataUrl) {
  var parsed = parsePngDataUrl(dataUrl);
  if (!parsed.ok) return parsed;
  var bytes = Utilities.base64Decode(parsed.base64);
  if (!isPngBytes(bytes)) return { ok: false, error: 'La firma no es una imagen PNG valida.' };
  if (bytes.length > 300 * 1024) return { ok: false, error: 'La imagen de la firma es demasiado grande.' };
  var folder = childFolder(signaturesRootFolder(), groupCode);
  var file = folder.createFile(Utilities.newBlob(bytes, 'image/png', groupCode + '_' + memberId + '_' + timestampForNames() + '.png'));
  var hash = bytesToHex(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bytes));
  return { ok: true, file_id: file.getId(), sha256: hash };
}

/** data:image/png;base64,... of a stored signature, for the printable record. */
function signatureDataUrl(fileId) {
  if (!fileId) return '';
  try {
    return 'data:image/png;base64,' + Utilities.base64Encode(DriveApp.getFileById(fileId).getBlob().getBytes());
  } catch (e) { return ''; }
}

/**
 * The signature data URL, or '' when it is anything else. The printable record
 * prints it raw (<?!= ?>) because HtmlService's contextual escaping replaces
 * every data: URL in a src attribute with "#ZautoescZ" (measured live
 * 2026-09-25); this check is what makes printing it raw safe.
 */
function safeSignatureSrc(value) {
  var s = String(value || '');
  return /^data:image\/png;base64,[A-Za-z0-9+\/]+=*$/.test(s) ? s : '';
}

// ---------------------------------------------------------------------------
// Video links
// ---------------------------------------------------------------------------

function videoCacheKey(url) {
  return 'video:' + bytesToHex(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, normalizarTexto(url))).slice(0, 24);
}

function probeParams(req) {
  return { method: req.method || 'get', muteHttpExceptions: true, followRedirects: req.followRedirects };
}

function interpretResponse(req, response) {
  var headers = response.getHeaders() || {};
  var location = headers.Location || headers.location || '';
  var body = '';
  if (req.method !== 'head') {
    try { body = response.getContentText().slice(0, 4000); } catch (e) { body = ''; }
  }
  return interpretVideoProbe(req.provider, response.getResponseCode(), location, body);
}

/**
 * Checks one link as an anonymous visitor would (no cookies, no login).
 * Results are cached for 6 hours so the live check in the form and the
 * submission share one request.
 */
function checkVideoUrl(url, useCache) {
  var immediate = videoStatusWithoutProbe(url);
  if (immediate) return immediate;
  var cache = CacheService.getScriptCache();
  var key = videoCacheKey(url);
  if (useCache !== false) {
    var hit = cache.get(key);
    if (hit) return JSON.parse(hit);
  }
  var req = videoProbeRequest(url);
  var out;
  try {
    out = interpretResponse(req, UrlFetchApp.fetch(req.url, probeParams(req)));
  } catch (e) {
    out = { status: VIDEO_STATUS.NO_VERIFICABLE, detail: 'No se pudo consultar el enlace: ' + String(e.message).slice(0, 120) };
  }
  cache.put(key, JSON.stringify(out), 21600);
  return out;
}

/** Cached result only, never a network call (used inside the submission lock). */
function cachedVideoCheck(url) {
  var immediate = videoStatusWithoutProbe(url);
  if (immediate) return immediate;
  var hit = CacheService.getScriptCache().get(videoCacheKey(url));
  return hit ? JSON.parse(hit) : null;
}

/**
 * Re-checks every pending link (or all of them) in parallel batches and writes
 * the result into REGISTRO. Runs from the admin panel and from an hourly trigger.
 */
function verifyPendingVideos(options) {
  options = options || {};
  var limit = options.limit || 200;
  var rows = leerHoja(HOJA.REGISTRO).filter(function (r) {
    if (!normalizarTexto(r.video_url)) return false;
    if (options.all) return true;
    var st = normalizarComparable(r.video_check_status);
    return !st || st === 'PENDIENTE';
  }).slice(0, limit);

  var now = ahoraISO();
  var updates = [];
  var counts = {};
  var probes = [];
  rows.forEach(function (r) {
    var immediate = videoStatusWithoutProbe(r.video_url);
    if (immediate) {
      updates.push({ fila: r._fila, cambios: { video_check_status: immediate.status, video_check_detail: immediate.detail, video_checked_at: now } });
      counts[immediate.status] = (counts[immediate.status] || 0) + 1;
    } else {
      probes.push({ row: r, req: videoProbeRequest(r.video_url) });
    }
  });

  for (var i = 0; i < probes.length; i += 20) {
    var chunk = probes.slice(i, i + 20);
    var responses = null;
    try {
      responses = UrlFetchApp.fetchAll(chunk.map(function (p) {
        return Object.assign({ url: p.req.url }, probeParams(p.req));
      }));
    } catch (e) { responses = null; }
    chunk.forEach(function (p, j) {
      var out;
      try {
        var response = responses ? responses[j] : UrlFetchApp.fetch(p.req.url, probeParams(p.req));
        out = interpretResponse(p.req, response);
      } catch (err) {
        out = { status: VIDEO_STATUS.NO_VERIFICABLE, detail: 'No se pudo consultar el enlace.' };
      }
      CacheService.getScriptCache().put(videoCacheKey(p.row.video_url), JSON.stringify(out), 21600);
      updates.push({ fila: p.row._fila, cambios: { video_check_status: out.status, video_check_detail: out.detail, video_checked_at: now } });
      counts[out.status] = (counts[out.status] || 0) + 1;
    });
  }

  // The probes run outside the lock (they are slow); only the write takes it.
  conBloqueo(function () { actualizarFilasEnLote(HOJA.REGISTRO, updates); });
  return { revisados: updates.length, por_estado: counts };
}

/** Hourly trigger entry point. */
function verificarVideosPendientes() {
  try {
    var r = verifyPendingVideos({ limit: 150 });
    if (r.revisados) registrar('sistema', 'admin', 'VERIFICAR_VIDEOS', '', JSON.stringify(r.por_estado));
  } catch (e) {
    console.error('Verificacion de videos fallo: ' + e.message);
  }
}
