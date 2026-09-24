/**
 * EL BUNKER - Access tokens and role-based access control.
 *
 * The web app is deployed "anyone can access" so the public forms work without
 * a Google account. That means Session.getActiveUser() is empty, so internal
 * panels are gated by HMAC-signed tokens instead: the signature proves the role
 * was issued by this script and cannot be forged by editing the URL.
 */

function secretoHmac() {
  var props = PropertiesService.getScriptProperties();
  var s = props.getProperty(PROP.SECRETO_HMAC);
  if (!s) {
    s = Utilities.getUuid() + Utilities.getUuid();
    props.setProperty(PROP.SECRETO_HMAC, s);
  }
  return s;
}

function firmar(texto) {
  var bytes = Utilities.computeHmacSha256Signature(texto, secretoHmac());
  return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/, '');
}

/**
 * Token format: <payloadBase64>.<firma>
 * The payload carries rol, alias and expiry; the signature covers all of it.
 */
function emitirToken(alias, rol, diasValidez) {
  if (!PERMISOS[rol]) throw new Error('Rol desconocido: ' + rol);
  var expira = new Date();
  expira.setDate(expira.getDate() + (diasValidez || 45));

  var payload = Utilities.base64EncodeWebSafe(JSON.stringify({
    a: alias, r: rol, e: expira.getTime()
  })).replace(/=+$/, '');

  return payload + '.' + firmar(payload);
}

/** Returns {ok, rol, alias} - never throws, so the router can answer 403 cleanly. */
function verificarToken(token) {
  if (!token) return { ok: false, motivo: 'SIN_TOKEN' };
  var partes = String(token).split('.');
  if (partes.length !== 2) return { ok: false, motivo: 'FORMATO' };

  if (firmar(partes[0]) !== partes[1]) return { ok: false, motivo: 'FIRMA_INVALIDA' };

  var datos;
  try {
    datos = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(partes[0])).getDataAsString());
  } catch (e) {
    return { ok: false, motivo: 'PAYLOAD_ILEGIBLE' };
  }
  if (!datos.e || Date.now() > datos.e) return { ok: false, motivo: 'EXPIRADO' };
  if (!PERMISOS[datos.r]) return { ok: false, motivo: 'ROL_DESCONOCIDO' };

  // A revoked or re-issued link keeps a valid signature, so the sheet is the final word.
  var estado = estadoUsuario(datos.a, token);
  if (estado) return { ok: false, motivo: estado };

  return { ok: true, rol: datos.r, alias: datos.a, expira: datos.e };
}

/**
 * '' when the user may enter with this token; otherwise the reason.
 * Only the token stored in _USUARIOS is valid: issuing a new link for an
 * alias revokes the previous one.
 */
function estadoUsuario(alias, token) {
  var usuarios = leerHoja(HOJA.USUARIOS);
  if (!usuarios.length) return '';                         // not provisioned yet
  for (var i = 0; i < usuarios.length; i++) {
    var u = usuarios[i];
    if (normalizarComparable(u.email_o_alias) !== normalizarComparable(alias)) continue;
    var activo = normalizarComparable(u.activo);
    if (activo === 'NO' || activo === 'FALSE') return 'USUARIO_INACTIVO';
    if (token !== undefined && normalizarTexto(u.token) && normalizarTexto(u.token) !== String(token)) return 'TOKEN_REEMPLAZADO';
    return '';
  }
  return 'USUARIO_INACTIVO';
}

function usuarioActivo(alias) {
  return estadoUsuario(alias) === '';
}

function puede(rol, capacidad) {
  var lista = PERMISOS[rol];
  if (!lista) return false;
  return lista.indexOf('*') !== -1 || lista.indexOf(capacidad) !== -1;
}

/** Throws a clean error the router turns into a 403 payload. */
function exigir(sesion, capacidad) {
  if (!sesion || !sesion.ok) {
    throw new ErrorAcceso('Necesitas un enlace de acceso valido para esta seccion.');
  }
  if (!puede(sesion.rol, capacidad)) {
    throw new ErrorAcceso('Tu rol (' + sesion.rol + ') no tiene permiso para: ' + capacidad + '.');
  }
  return true;
}

function ErrorAcceso(mensaje) {
  var e = new Error(mensaje);
  e.name = 'ErrorAcceso';
  return e;
}

/**
 * Creates or refreshes a user and returns their access link.
 * Jurors get a token each; nobody shares credentials.
 */
function provisionarUsuario(alias, rol, nota) {
  return conBloqueo(function () {
    var token = emitirToken(alias, rol, 45);
    var usuarios = leerHoja(HOJA.USUARIOS);
    var existente = null;
    for (var i = 0; i < usuarios.length; i++) {
      if (normalizarComparable(usuarios[i].email_o_alias) === normalizarComparable(alias)) {
        existente = usuarios[i]; break;
      }
    }
    if (existente) {
      actualizarFila(HOJA.USUARIOS, existente._fila, { rol: rol, token: token, activo: 'SI' });
    } else {
      agregarFila(HOJA.USUARIOS, {
        email_o_alias: alias, rol: rol, token: token,
        activo: 'SI', creado_at: ahoraISO(), nota: nota || ''
      });
    }
    registrar('sistema', 'admin', 'PROVISIONAR_USUARIO', alias, 'rol=' + rol);
    return { alias: alias, rol: rol, url: urlPanel(rol, token) };
  });
}

function urlPanel(rol, token) {
  var base = ScriptApp.getService().getUrl();
  var pagina = { admin: 'admin', direccion: 'dashboard', logistica: 'admin',
                 checkin: 'checkin', jurado: 'jurado' }[rol] || 'admin';
  return base + '?p=' + pagina + '&t=' + encodeURIComponent(token);
}

/**
 * Six-character key that travels with a group code in the members link.
 * GRP numbers are sequential and easy to guess; the key (an HMAC of the code)
 * is what stops a stranger from adding people to someone else's group.
 */
function groupAccessKey(groupCode) {
  var code = String(groupCode || '').trim().toUpperCase();
  if (!code) return '';
  return firmar('grp:' + code).replace(/[^A-Za-z0-9]/g, '').slice(0, 6).toUpperCase();
}

function groupKeyMatches(groupCode, key) {
  var expected = groupAccessKey(groupCode);
  return !!expected && expected === String(key || '').trim().toUpperCase();
}
