/**
 * EL BUNKER - archivo unico de despliegue (GENERADO, no editar a mano).
 *
 * Fuente: apps-script/ en el repositorio. Regenerar con:
 *     node tools/empaquetar.js
 *
 * Generado: 2026-09-29T13:28:09.909Z
 * Modulos: 23 .gs + 14 .html
 */

/** Pantallas HTML. Las lee hayRegistroPlantillas() en 20_web.gs. */
var PLANTILLAS = {
  "ui_403": "<!DOCTYPE html>\n<html lang=\"es\">\n<head><base target=\"_top\"><meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n<?!= incluir('ui_estilos') ?></head>\n<body>\n<?\n  var RAZONES = {\n    SIN_TOKEN: 'Abriste una sección interna sin tu enlace personal.',\n    FORMATO: 'El enlace está incompleto. Ábrelo completo, sin recortarlo.',\n    FIRMA_INVALIDA: 'El enlace no es válido para este sistema.',\n    PAYLOAD_ILEGIBLE: 'El enlace está dañado.',\n    EXPIRADO: 'Tu enlace caducó.',\n    USUARIO_INACTIVO: 'Tu acceso fue desactivado.',\n    TOKEN_REEMPLAZADO: 'Coordinación te generó un enlace nuevo; este ya no sirve.',\n    ROL_SIN_ACCESO_A_ESTA_PAGINA: 'Tu rol no tiene acceso a esta página.',\n    PAGINA_DESCONOCIDA: 'Esa página no existe.'\n  };\n  var razon = RAZONES[motivo] || '';\n?>\n<div class=\"envoltura\">\n  <?!= incluir('ui_cabecera') ?>\n  <div class=\"aviso error\">\n    <b>No tienes acceso a esta sección</b>\n    <?= razon || 'Esta área es interna. Usa el enlace personal que te entregó la coordinación.' ?>\n  </div>\n  <div class=\"tarjeta\">\n    <h2>¿Qué hago?</h2>\n    <p class=\"pista\" style=\"margin:0\">\n      • Si eres <b>participante</b>, esta no es tu página: usa\n      <a href=\"<?= BASE_URL ?>?p=inscripcion\">la inscripción</a> o <a href=\"<?= BASE_URL ?>?p=mi-inscripcion\">Mi inscripción</a>.<br>\n      • Si eres del <b>equipo</b>, pide a coordinación tu enlace vigente. Los enlaces son personales, caducan y\n      dejan de servir cuando se genera uno nuevo.<br><br>\n      <span style=\"opacity:.7\">Motivo técnico: <code><?= motivo ?></code></span>\n    </p>\n  </div>\n</div>\n<?!= incluir('ui_scripts') ?>\n<script>window.ENTORNO = '<?= ENTORNO ?>';</script>\n</body>\n</html>\n",
  "ui_admin": "<!DOCTYPE html>\n<html lang=\"es\">\n<head><base target=\"_top\"><meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n<?!= incluir('ui_estilos') ?></head>\n<body>\n<div class=\"envoltura ancho\">\n  <header class=\"cabecera\">\n    <div class=\"marca\"><h1>PANEL <span>BÚNKER</span></h1>\n      <div class=\"sub\"><?= alias ?> · <?= rol ?></div></div>\n    <div class=\"datos-evento\" id=\"resumenCabecera\"></div>\n  </header>\n\n  <div id=\"avisoGlobal\"></div>\n\n  <div class=\"pestanas\" role=\"tablist\">\n    <button class=\"pestana activa\" data-panel=\"registro\">Inscritos</button>\n    <button class=\"pestana\" data-panel=\"grupos\">Agrupaciones</button>\n    <button class=\"pestana\" data-panel=\"codigos\">Cerrar los 100</button>\n    <button class=\"pestana\" data-panel=\"cambios\">Cambios de horario</button>\n    <button class=\"pestana\" data-panel=\"pistas\">Pistas</button>\n    <button class=\"pestana\" data-panel=\"mensajes\">Comunicación</button>\n    <button class=\"pestana\" data-panel=\"herramientas\">Respaldo y sistema</button>\n  </div>\n\n  <!-- ============================ INSCRITOS ============================ -->\n  <div class=\"panel activo\" id=\"panel-registro\">\n    <div class=\"rejilla metricas\" id=\"metricas\" style=\"margin-bottom:16px\"></div>\n    <div class=\"tarjeta\">\n      <div class=\"rejilla dos\" style=\"margin-bottom:12px\">\n        <div class=\"campo\" style=\"margin:0\"><input type=\"text\" id=\"buscar\" placeholder=\"Buscar por nombre, código, GRP o documento\"></div>\n        <div class=\"campo\" style=\"margin:0\">\n          <select id=\"filtro\">\n            <option value=\"TODOS\">Todos</option><option value=\"APTO\">APTO</option><option value=\"REVISION\">REVISIÓN</option>\n            <option value=\"INCOMPLETO\">INCOMPLETO</option><option value=\"NO_CUMPLE\">NO CUMPLE</option>\n            <option value=\"DUPLICADO\">DUPLICADO</option><option value=\"AGRUPACIONES\">Solo dúos y agrupaciones</option>\n            <option value=\"CON_CODIGO\">Con código</option>\n          </select>\n        </div>\n      </div>\n      <div class=\"tabla-envoltura\" style=\"max-height:560px;overflow-y:auto\"><table>\n        <thead><tr><th>Código</th><th>Nombre</th><th>Modalidad</th><th>Doc.</th><th>Edad</th><th>Género</th>\n          <th>Estado</th><th>Video</th><th>Pista</th><th>Motivo</th><th>Bloque</th><th>Decisión</th></tr></thead>\n        <tbody id=\"cuerpoRegistro\"></tbody>\n      </table></div>\n      <p class=\"pista\" id=\"conteoTabla\" style=\"margin:12px 0 0\"></p>\n    </div>\n  </div>\n\n  <!-- ========================== AGRUPACIONES =========================== -->\n  <div class=\"panel\" id=\"panel-grupos\">\n    <div class=\"tarjeta\">\n      <h2>Agrupaciones y dúos</h2>\n      <p class=\"pista\">Una agrupación = un proyecto = un cupo. Cada integrante autoriza por sí mismo con el enlace de su grupo.\n        Cuando dos agrupaciones tienen un nombre equivalente, <b>tú decides</b> si son el mismo proyecto: el sistema no fusiona nada.</p>\n      <button class=\"boton fantasma chico\" id=\"btnCargarGrupos\" style=\"margin-bottom:12px\">Actualizar</button>\n      <div id=\"salidaGrupos\"></div>\n    </div>\n  </div>\n\n  <!-- ============================= CÓDIGOS ============================= -->\n  <div class=\"panel\" id=\"panel-codigos\">\n    <div class=\"tarjeta\">\n      <h2>Paso 1 · Revalidar todo</h2>\n      <p class=\"pista\">Vuelve a aplicar edad, residencia, formato, duplicados y agrupaciones repetidas. Respeta tus decisiones\n        manuales y nunca quita códigos ya emitidos.</p>\n      <button class=\"boton fantasma\" id=\"btnRevalidar\">Revalidar inscripciones</button>\n      <div id=\"salidaRevalidar\" style=\"margin-top:12px\"></div>\n    </div>\n    <div class=\"tarjeta\">\n      <h2>Paso 2 · Emitir B-001 … B-100</h2>\n      <p class=\"pista\">Asigna código, bloque y horario a los APTO, en orden de inscripción. Una agrupación recibe un solo código.\n        Es <b>idempotente</b>: nunca reasigna ni reutiliza un código. Los REVISIÓN no reciben código hasta que decidas.</p>\n      <div class=\"aviso alerta\" style=\"font-size:14px\"><b>Revisa antes de emitir</b>\n        Resuelve primero las agrupaciones repetidas y las inscripciones en revisión.</div>\n      <button class=\"boton\" id=\"btnCodigos\">Emitir códigos y asignar bloques</button>\n      <div id=\"salidaCodigos\" style=\"margin-top:12px\"></div>\n    </div>\n    <div class=\"tarjeta\">\n      <h2>Ocupación por bloque</h2>\n      <button class=\"boton fantasma chico\" id=\"btnBloques\" style=\"margin-bottom:12px\">Ver ocupación</button>\n      <div id=\"salidaBloques\"></div>\n    </div>\n  </div>\n\n  <!-- ============================= CAMBIOS ============================= -->\n  <div class=\"panel\" id=\"panel-cambios\">\n    <div class=\"tarjeta\">\n      <h2>Solicitudes de cambio</h2>\n      <p class=\"pista\">El participante nunca elige la hora: la decides tú, y solo en un bloque con cupo libre.</p>\n      <button class=\"boton fantasma chico\" id=\"btnCargarCambios\" style=\"margin-bottom:12px\">Actualizar</button>\n      <div id=\"salidaCambios\"></div>\n    </div>\n  </div>\n\n  <!-- ============================== PISTAS ============================= -->\n  <div class=\"panel\" id=\"panel-pistas\">\n    <div class=\"tarjeta\">\n      <h2>Pistas</h2>\n      <p class=\"pista\">Estados: PISTA PENDIENTE → RECIBIDA → VALIDADA (o CON PROBLEMA). Los archivos quedan en\n        <b>Audio/B-XXX/</b> con el nombre B-XXX_ARTISTA_CANCION. Descarga la carpeta completa antes del evento para el técnico\n        (copia offline) y pide a cada participante su USB de respaldo.</p>\n      <div class=\"rejilla dos\" style=\"margin-bottom:12px\">\n        <button class=\"boton fantasma\" id=\"btnCargarPistas\">Actualizar lista</button>\n        <button class=\"boton fantasma\" id=\"btnCarpetas\">Crear carpetas Audio/B-XXX</button>\n      </div>\n      <div id=\"salidaCarpetas\"></div>\n      <div id=\"salidaPistas\"></div>\n    </div>\n    <div class=\"tarjeta\">\n      <h2>Subir una pista recibida por WhatsApp</h2>\n      <div class=\"rejilla dos\">\n        <div class=\"campo\"><label for=\"pistaCodigo\">Código</label><input type=\"text\" id=\"pistaCodigo\" placeholder=\"B-012\"></div>\n        <div class=\"campo\"><label for=\"pistaCancion\">Canción</label><input type=\"text\" id=\"pistaCancion\"></div>\n      </div>\n      <div class=\"campo\"><label for=\"pistaArchivo\">Archivo</label><input type=\"file\" id=\"pistaArchivo\" accept=\"audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac\"></div>\n      <button class=\"boton\" id=\"btnSubirPistaAdmin\">Subir y renombrar</button>\n      <div id=\"salidaSubida\" style=\"margin-top:12px\"></div>\n    </div>\n  </div>\n\n  <!-- =========================== COMUNICACIÓN ========================== -->\n  <div class=\"panel\" id=\"panel-mensajes\">\n    <div class=\"tarjeta\">\n      <h2>Generar mensajes</h2>\n      <p class=\"pista\">El sistema prepara el texto exacto. El envío por WhatsApp lo hace una persona desde el número oficial con el\n        enlace generado (enviar automáticamente exige la API paga de WhatsApp Business). Solo se genera enlace de WhatsApp para\n        quien autorizó ese canal.</p>\n      <div class=\"rejilla dos\">\n        <div class=\"campo\"><label for=\"plantilla\">Plantilla</label>\n          <select id=\"plantilla\">\n            <? plantillasDisponibles().forEach(function (t) { ?><option value=\"<?= t.id ?>\"><?= t.nombre ?></option><? }); ?>\n          </select></div>\n        <div class=\"campo\"><label for=\"filtroBloqueMsg\">Filtrar por bloque (opcional)</label>\n          <input type=\"number\" id=\"filtroBloqueMsg\" min=\"1\" max=\"10\" placeholder=\"Todos\"></div>\n      </div>\n      <div class=\"rejilla dos\">\n        <button class=\"boton fantasma\" id=\"btnGenerar\">Generar textos</button>\n        <button class=\"boton\" id=\"btnCorreos\">Enviar por correo</button>\n      </div>\n      <div class=\"aviso alerta\" style=\"font-size:14px;margin-top:12px\"><b>Cuota de correo</b>\n        Una cuenta Gmail envía ~100 correos al día. WhatsApp es el canal principal.</div>\n      <div id=\"salidaMensajes\" style=\"margin-top:12px\"></div>\n    </div>\n    <div class=\"tarjeta\">\n      <h2>Contactos para la lista de difusión</h2>\n      <p class=\"pista\">Descarga un archivo de contactos (.vcf) con quienes autorizaron WhatsApp, para importarlo en el teléfono del\n        número oficial y crear la lista de difusión o el grupo. La difusión solo llega a quien también guardó el número oficial.</p>\n      <div class=\"rejilla dos\">\n        <button class=\"boton fantasma\" data-contactos=\"CON_CODIGO\">Con código</button>\n        <button class=\"boton fantasma\" data-contactos=\"APTOS\">Aptos y con código</button>\n      </div>\n      <div id=\"salidaContactos\" style=\"margin-top:12px\"></div>\n    </div>\n    <div class=\"tarjeta\">\n      <h2>Videos</h2>\n      <p class=\"pista\">Comprueba que los enlaces se puedan abrir sin iniciar sesión (corre solo cada hora; aquí lo fuerzas).\n        Instagram y TikTok no se pueden verificar automáticamente: quedan como NO VERIFICABLE para revisión manual.</p>\n      <div class=\"rejilla dos\">\n        <button class=\"boton fantasma\" id=\"btnVideosPendientes\">Verificar pendientes</button>\n        <button class=\"boton fantasma\" id=\"btnVideosTodos\">Verificar todos otra vez</button>\n      </div>\n      <div id=\"salidaVideos\" style=\"margin-top:12px\"></div>\n    </div>\n  </div>\n\n  <!-- =========================== HERRAMIENTAS ========================== -->\n  <div class=\"panel\" id=\"panel-herramientas\">\n    <div class=\"tarjeta\">\n      <h2>Respaldos</h2>\n      <p class=\"pista\">Cada respaldo crea un XLSX (con las agrupaciones colapsables) y un JSON restaurable en Drive. Hay uno\n        automático cada noche. Haz uno con etiqueta en cada hito.</p>\n      <div class=\"rejilla dos\">\n        <div class=\"campo\" style=\"margin:0\"><select id=\"etiquetaRespaldo\">\n          <option value=\"MANUAL\">Manual</option><option value=\"PRE-EVENTO\">Pre-evento</option><option value=\"AGENDA\">Agenda</option>\n          <option value=\"POST-EVENTO\">Post-evento</option><option value=\"RESULTADOS\">Resultados</option></select></div>\n        <button class=\"boton\" id=\"btnRespaldar\">Respaldo completo</button>\n        <button class=\"boton fantasma\" id=\"btnExportar\">Solo exportar XLSX</button>\n        <button class=\"boton fantasma\" id=\"btnRespaldoAudios\">Respaldar audios</button>\n      </div>\n      <div id=\"salidaRespaldo\" style=\"margin-top:12px\"></div>\n    </div>\n    <div class=\"tarjeta\">\n      <h2>Vistas y cierre</h2>\n      <p class=\"pista\">AGENDA, CHECK-IN, AGRUPACIONES, PISTAS, RESULTADOS y DASHBOARD se reconstruyen desde REGISTRO.</p>\n      <div class=\"rejilla dos\">\n        <button class=\"boton fantasma\" id=\"btnVistas\">Refrescar vistas</button>\n        <button class=\"boton peligro\" id=\"btnCerrar\">Cerrar jornada</button>\n      </div>\n      <div id=\"salidaVistas\" style=\"margin-top:12px\"></div>\n    </div>\n    <div class=\"tarjeta\" id=\"tarjetaSistema\">\n      <h2>Estado del sistema</h2>\n      <p class=\"pista\">Entorno, marca de la hoja, esquema, formularios, datos legales y ausencia de datos de prueba.</p>\n      <button class=\"boton fantasma\" id=\"btnSistema\">Revisar</button>\n      <div id=\"salidaSistema\" style=\"margin-top:12px\"></div>\n    </div>\n    <div class=\"tarjeta\" id=\"tarjetaUsuarios\">\n      <h2>Accesos del equipo</h2>\n      <p class=\"pista\">Cada persona recibe su propio enlace. No se comparten entre roles.</p>\n      <div class=\"rejilla dos\">\n        <div class=\"campo\"><label for=\"nuevoAlias\">Alias</label><input type=\"text\" id=\"nuevoAlias\" placeholder=\"checkin-3\"></div>\n        <div class=\"campo\"><label for=\"nuevoRol\">Rol</label>\n          <select id=\"nuevoRol\"><option value=\"logistica\">logistica</option><option value=\"checkin\">checkin</option>\n            <option value=\"jurado\">jurado</option><option value=\"direccion\">direccion</option><option value=\"admin\">admin</option></select></div>\n      </div>\n      <div class=\"campo\"><label for=\"nuevaNota\">Nota (para jurados escribe \"jurado 1\", \"jurado 2\" o \"jurado 3\")</label>\n        <input type=\"text\" id=\"nuevaNota\" placeholder=\"jurado 1\"></div>\n      <button class=\"boton fantasma\" id=\"btnUsuario\">Crear acceso</button>\n      <div id=\"salidaUsuario\" style=\"margin-top:12px\"></div>\n    </div>\n  </div>\n</div>\n\n<?!= incluir('ui_scripts') ?>\n<script>\nwindow.ENTORNO = '<?= ENTORNO ?>';\nwindow.TOKEN = '<?= token ?>';\nvar ROL = '<?= rol ?>';\nvar BASE_URL = '<?= BASE_URL ?>';\n\ndocument.addEventListener('DOMContentLoaded', function () {\n  if (ROL !== 'admin') { $('#tarjetaUsuarios').classList.add('oculto'); $('#tarjetaSistema').classList.add('oculto'); }\n  $$('.pestana').forEach(function (p) {\n    p.addEventListener('click', function () {\n      $$('.pestana').forEach(function (x) { x.classList.remove('activa'); });\n      $$('.panel').forEach(function (x) { x.classList.remove('activo'); });\n      p.classList.add('activa');\n      $('#panel-' + p.dataset.panel).classList.add('activo');\n      if (p.dataset.panel === 'cambios') cargarCambios();\n      if (p.dataset.panel === 'grupos') loadGroups();\n      if (p.dataset.panel === 'pistas') loadTracks();\n    });\n  });\n  cargarRegistro();\n  $('#buscar').addEventListener('input', debounce(cargarRegistro, 350));\n  $('#filtro').addEventListener('change', cargarRegistro);\n  $('#btnRevalidar').addEventListener('click', revalidar);\n  $('#btnCodigos').addEventListener('click', emitirCodigos);\n  $('#btnBloques').addEventListener('click', verBloques);\n  $('#btnCargarCambios').addEventListener('click', cargarCambios);\n  $('#btnCargarGrupos').addEventListener('click', loadGroups);\n  $('#btnCargarPistas').addEventListener('click', loadTracks);\n  $('#btnCarpetas').addEventListener('click', prepareAudioFolders);\n  $('#btnSubirPistaAdmin').addEventListener('click', uploadTrackAsAdmin);\n  $('#btnGenerar').addEventListener('click', generarMensajes);\n  $('#btnCorreos').addEventListener('click', enviarCorreos);\n  $$('[data-contactos]').forEach(function (b) { b.addEventListener('click', function () { exportContacts(b); }); });\n  $('#btnVideosPendientes').addEventListener('click', function () { checkVideos(false); });\n  $('#btnVideosTodos').addEventListener('click', function () { checkVideos(true); });\n  $('#btnRespaldar').addEventListener('click', function () { respaldo('respaldar', $('#btnRespaldar')); });\n  $('#btnExportar').addEventListener('click', function () { respaldo('exportar', $('#btnExportar')); });\n  $('#btnRespaldoAudios').addEventListener('click', backupAudio);\n  $('#btnVistas').addEventListener('click', refrescarVistas);\n  $('#btnCerrar').addEventListener('click', cerrarJornada);\n  $('#btnSistema').addEventListener('click', loadSystemHealth);\n  $('#btnUsuario').addEventListener('click', crearUsuario);\n});\n\nfunction debounce(fn, ms) { var t; return function () { clearTimeout(t); t = setTimeout(fn, ms); }; }\nfunction muted(t) { return '<span style=\"color:var(--tenue)\">' + escaparHtml(t) + '</span>'; }\nvar MODE_LABELS = { SOLISTA: 'Solista', DUO: 'Dúo', AGRUPACION: 'Agrupación' };\n\n// ------------------------------- registro ----------------------------------\nfunction cargarRegistro() {\n  llamar('listar_registro', { q: $('#buscar').value, filtro: $('#filtro').value })\n    .then(function (r) {\n      pintarMetricas(r.resumen);\n      $('#conteoTabla').textContent = 'Mostrando ' + r.mostrados + ' de ' + r.total + ' inscripciones.';\n      $('#cuerpoRegistro').innerHTML = r.filas.map(function (f) {\n        return '<tr>' +\n          '<td>' + (f.code ? '<b>' + escaparHtml(f.code) + '</b>' : muted('—')) + '</td>' +\n          '<td>' + escaparHtml(f.full_name) + (f.artistic_name ? '<br>' + muted(f.artistic_name) : '') + '</td>' +\n          '<td>' + escaparHtml(MODE_LABELS[f.participation_mode] || (f.legacy ? 'Formulario v1' : '')) +\n            (f.group_code ? '<br>' + muted(f.group_code + ' · ' + f.members_declared + ' int.') : '') + '</td>' +\n          '<td>' + escaparHtml(f.id_number) + '</td><td>' + escaparHtml(f.age) + '</td>' +\n          '<td>' + escaparHtml(f.genre_primary) + '</td>' +\n          '<td>' + etiquetaEstado(f.eligibility_status) + (f.eligibility_override ? '<br>' + muted('decisión manual') : '') + '</td>' +\n          '<td>' + etiquetaEstado(f.video_check_status) + '</td>' +\n          '<td>' + etiquetaEstado(f.track_status) + '</td>' +\n          '<td style=\"white-space:normal;max-width:220px;font-size:12px;color:var(--tenue)\">' +\n            escaparHtml(f.duplicate_reason || f.validation_notes || '') +\n            (f.group_match_status === 'POSIBLE_REPETIDA' ? '<br><b style=\"color:var(--amarillo)\">Posible agrupación repetida. Verifica en Agrupaciones.</b>' : '') + '</td>' +\n          '<td>' + escaparHtml(f.final_block || f.original_block || '') + '</td>' +\n          '<td><select class=\"cambiarEstado\" data-id=\"' + escaparHtml(f.submission_id) + '\" style=\"padding:5px;font-size:12px\">' +\n            ['', 'APTO', 'REVISION', 'INCOMPLETO', 'NO_CUMPLE', 'DUPLICADO'].map(function (e) {\n              return '<option value=\"' + e + '\">' + (e || 'Decidir…') + '</option>';\n            }).join('') + '</select></td></tr>';\n      }).join('') || '<tr><td colspan=\"12\" style=\"color:var(--tenue)\">Sin resultados.</td></tr>';\n\n      $$('.cambiarEstado').forEach(function (s) {\n        s.addEventListener('change', function () {\n          if (!s.value) return;\n          var motivo = prompt('Motivo de la decisión ' + s.value + ' (queda registrado y la revalidación lo respeta):');\n          if (!motivo) { s.value = ''; return; }\n          llamar('marcar_elegibilidad', { submission_id: s.dataset.id, eligibility_status: s.value, motivo: motivo })\n            .then(function () { cargarRegistro(); })\n            .catch(function (e) { mostrarAviso('#avisoGlobal', 'error', 'No se pudo cambiar', e.message); });\n        });\n      });\n    })\n    .catch(function (e) { mostrarAviso('#avisoGlobal', 'error', 'No se pudo cargar', e.message); });\n}\n\nfunction pintarMetricas(r) {\n  var m = [['Recibidas', r.total, ''], ['Válidas', r.validos, ''], ['Aptos', r.apto, 'destacada'], ['Con código', r.con_codigo, 'destacada'],\n           ['Revisión', r.revision, ''], ['Duplicados', r.duplicado, ''], ['Incompletos', r.incompleto, ''], ['No cumplen', r.no_cumple, ''],\n           ['Solistas', r.solistas, ''], ['Dúos', r.duos, ''], ['Agrupaciones', r.agrupaciones, '']];\n  $('#metricas').innerHTML = m.map(function (x) {\n    return '<div class=\"metrica ' + x[2] + '\"><div class=\"n\">' + x[1] + '</div><div class=\"t\">' + x[0] + '</div></div>';\n  }).join('');\n  $('#resumenCabecera').innerHTML = '<span class=\"chip\">Aptos <b>' + r.apto + '</b></span>' +\n    '<span class=\"chip\">Con código <b>' + r.con_codigo + '</b></span><span class=\"chip\">En revisión <b>' + r.revision + '</b></span>';\n}\n\n// ----------------------------- agrupaciones --------------------------------\nfunction loadGroups() {\n  $('#salidaGrupos').innerHTML = muted('Cargando…');\n  llamar('listar_agrupaciones').then(function (r) {\n    if (!r.agrupaciones.length) { $('#salidaGrupos').innerHTML = '<div class=\"aviso info\"><b>Sin agrupaciones</b>Aún no hay dúos ni agrupaciones inscritos.</div>'; return; }\n    $('#salidaGrupos').innerHTML = r.agrupaciones.map(function (g) {\n      var isRepeated = g.group_match_status === 'POSIBLE_REPETIDA';\n      return '<details class=\"tarjeta\" style=\"margin-bottom:10px;' + (isRepeated ? 'border-color:var(--amarillo)' : '') + '\"' + (isRepeated ? ' open' : '') + '>' +\n        '<summary style=\"cursor:pointer;list-style:none\"><b style=\"font-size:17px\">' + escaparHtml(g.group_code) + ' · ' + escaparHtml(g.group_display_name) + '</b> ' +\n        (g.code ? '<span class=\"chip\">' + escaparHtml(g.code) + '</span> ' : '') + etiquetaEstado(g.eligibility_status) + ' ' +\n        muted(MODE_LABELS[g.participation_mode] + ' · autorizados ' + g.members_authorized + '/' + g.members_declared) + '</summary>' +\n        (isRepeated ? '<div class=\"aviso alerta\" style=\"margin-top:12px\"><b>Posible agrupación repetida</b>Verifique si corresponde al mismo proyecto que ' +\n          escaparHtml(g.group_match_ref) + '. Si es el mismo, se mantiene un solo cupo; si no, ambas siguen y queda registrada tu decisión.' +\n          '<div class=\"rejilla dos\" style=\"margin-top:10px\"><button class=\"boton chico\" data-coincide=\"MISMO\" data-id=\"' + escaparHtml(g.submission_id) + '\">Es el mismo proyecto</button>' +\n          '<button class=\"boton chico fantasma\" data-coincide=\"DISTINTO\" data-id=\"' + escaparHtml(g.submission_id) + '\">Son proyectos distintos</button></div></div>' : '') +\n        '<p class=\"pista\" style=\"margin:12px 0 8px\">Líder: ' + escaparHtml(g.leader_name) + ' · ' + escaparHtml(g.leader_whatsapp) + '</p>' +\n        '<div class=\"tabla-envoltura\"><table><thead><tr><th>Integrante</th><th>Documento</th><th>Edad</th><th>Rol</th><th>Términos/Datos/Imagen</th><th>Firma</th><th>Estado</th><th>Alerta</th></tr></thead><tbody>' +\n        g.members.map(function (m) {\n          return '<tr><td>' + escaparHtml(m.full_name) + (m.is_leader ? ' (líder)' : '') + '</td><td>' + escaparHtml(m.id_number) + '</td><td>' + escaparHtml(m.age) + '</td>' +\n            '<td>' + escaparHtml(m.artistic_role) + '</td><td>' + [m.consent_terms, m.consent_data, m.consent_image].map(function (v) { return v ? 'SI' : 'NO'; }).join(' / ') + '</td>' +\n            '<td>' + (m.signature ? 'SI' : (m.is_leader ? 'Formulario 1' : muted('NO'))) + '</td><td>' + etiquetaEstado(m.member_status) + '</td>' +\n            '<td style=\"white-space:normal;font-size:12px;color:var(--amarillo)\">' + escaparHtml(m.member_alert || '') + '</td></tr>';\n        }).join('') + '</tbody></table></div>' +\n        '<div class=\"rejilla dos\" style=\"margin-top:12px\">' +\n        '<button class=\"boton chico fantasma\" data-copiar=\"' + escaparHtml(g.members_link) + '\">Copiar enlace de integrantes</button>' +\n        '<a class=\"boton chico fantasma\" target=\"_blank\" rel=\"noopener\" href=\"' + BASE_URL + '?p=constancia&g=' + encodeURIComponent(g.group_code) + '&t=' + encodeURIComponent(window.TOKEN) + '\">Constancia imprimible</a>' +\n        '<button class=\"boton chico fantasma\" data-declarados=\"' + escaparHtml(g.submission_id) + '\" data-actual=\"' + g.members_declared + '\">Cambiar integrantes declarados</button></div>' +\n        '</details>';\n    }).join('');\n    $$('[data-coincide]').forEach(function (b) {\n      b.addEventListener('click', function () {\n        var motivo = prompt('Motivo de la decisión (queda en el registro):');\n        if (motivo === null) return;\n        llamar('resolver_coincidencia_grupo', { submission_id: b.dataset.id, decision: b.dataset.coincide, motivo: motivo })\n          .then(function (res) { mostrarAviso('#avisoGlobal', 'ok', 'Decisión registrada', res.decision + ' → ' + res.eligibility_status); loadGroups(); })\n          .catch(function (e) { mostrarAviso('#avisoGlobal', 'error', 'No se pudo registrar', e.message); });\n      });\n    });\n    $$('[data-copiar]').forEach(function (b) { b.addEventListener('click', function () { copyText(b.dataset.copiar, b); }); });\n    $$('[data-declarados]').forEach(function (b) {\n      b.addEventListener('click', function () {\n        var n = prompt('Nuevo número de integrantes en escena (actual ' + b.dataset.actual + '):');\n        if (!n) return;\n        var motivo = prompt('Motivo:') || '';\n        llamar('actualizar_integrantes', { submission_id: b.dataset.declarados, members_declared: n, motivo: motivo })\n          .then(function () { loadGroups(); })\n          .catch(function (e) { mostrarAviso('#avisoGlobal', 'error', 'No se pudo cambiar', e.message); });\n      });\n    });\n  }).catch(function (e) { mostrarAviso('#salidaGrupos', 'error', 'Error', e.message); });\n}\n\n// -------------------------------- códigos ----------------------------------\nfunction revalidar() {\n  var b = $('#btnRevalidar'); ocupado(b, true, 'Revalidando...');\n  llamar('revalidar_todo').then(function (r) {\n    ocupado(b, false);\n    mostrarAviso('#salidaRevalidar', 'ok', r.revalidados + ' inscripciones revalidadas',\n      'Aptos: ' + r.resumen.apto + ' · Duplicados: ' + r.resumen.duplicado + ' · Revisión: ' + r.resumen.revision +\n      ' · Incompletos: ' + r.resumen.incompleto + ' · No cumplen: ' + r.resumen.no_cumple);\n    cargarRegistro();\n  }).catch(function (e) { ocupado(b, false); mostrarAviso('#salidaRevalidar', 'error', 'Error', e.message); });\n}\n\nfunction emitirCodigos() {\n  if (!confirm('Se emitirán códigos definitivos a todos los APTO sin código.\\n\\nUn código emitido NO se reasigna nunca. ¿Continuar?')) return;\n  var b = $('#btnCodigos'); ocupado(b, true, 'Emitiendo...');\n  llamar('asignar_codigos').then(function (r) {\n    ocupado(b, false);\n    mostrarAviso('#salidaCodigos', 'ok', r.asignados + ' códigos nuevos emitidos',\n      'Total con código: ' + r.total_con_codigo + ' de ' + r.cupo + '. ' +\n      (r.sin_cupo ? r.sin_cupo + ' quedaron fuera por cupo lleno.' : 'No quedó nadie fuera por cupo.'));\n    cargarRegistro();\n  }).catch(function (e) { ocupado(b, false); mostrarAviso('#salidaCodigos', 'error', 'Error', e.message); });\n}\n\nfunction verBloques() {\n  var b = $('#btnBloques'); ocupado(b, true, 'Consultando...');\n  llamar('bloques_disponibles').then(function (r) {\n    ocupado(b, false);\n    $('#salidaBloques').innerHTML = '<div class=\"tabla-envoltura\"><table><thead><tr><th>Bloque</th><th>Ventana</th><th>Ocupados</th><th>Cupo</th><th>Disponibles</th></tr></thead><tbody>' +\n      r.bloques.map(function (x) {\n        return '<tr><td><b>' + escaparHtml(x.etiqueta || x.block_id) + '</b></td><td>' + escaparHtml(x.ventana) + '</td><td>' + x.ocupados + '</td><td>' + x.cupo + '</td>' +\n          '<td style=\"color:' + (x.disponibles ? 'var(--ok)' : 'var(--error)') + '\"><b>' + x.disponibles + '</b></td></tr>';\n      }).join('') + '</tbody></table></div>';\n  }).catch(function (e) { ocupado(b, false); mostrarAviso('#salidaBloques', 'error', 'Error', e.message); });\n}\n\n// -------------------------------- cambios ----------------------------------\nfunction cargarCambios() {\n  Promise.all([llamar('listar_cambios', { estado: 'TODOS' }), llamar('bloques_disponibles')])\n    .then(function (res) {\n      var cambios = res[0].cambios, bloques = res[1].bloques;\n      if (!cambios.length) { $('#salidaCambios').innerHTML = '<div class=\"aviso info\"><b>Sin solicitudes</b>Nadie ha pedido cambio de horario.</div>'; return; }\n      var opciones = bloques.map(function (x) {\n        return '<option value=\"' + x.block_id + '\"' + (x.disponibles ? '' : ' disabled') + '>' + escaparHtml(x.etiqueta || ('Bloque ' + x.block_id)) + ' (' + x.ventana + ') · ' + x.disponibles + ' libres</option>';\n      }).join('');\n      $('#salidaCambios').innerHTML = cambios.map(function (c) {\n        var pendiente = String(c.estado).toUpperCase() === 'PENDIENTE';\n        return '<div class=\"tarjeta\" style=\"margin-bottom:12px;' + (pendiente ? 'border-color:var(--amarillo)' : '') + '\">' +\n          '<div style=\"display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap\"><div><b style=\"font-size:17px\">' + escaparHtml(c.code) + '</b> · ' + escaparHtml(c.full_name) +\n          '<div style=\"color:var(--tenue);font-size:12.5px\">Horario actual: bloque ' + escaparHtml(c.original_block) + ' · ' + escaparHtml(c.original_time) +\n          ' · Solicitud ' + escaparHtml(c.solicitud_id) + '</div></div><div>' + etiquetaEstado(c.estado) + '</div></div>' +\n          '<p class=\"pista\" style=\"margin:10px 0\"><b>Motivo:</b> ' + escaparHtml(c.reason_short) + '<br><b>Contacto:</b> ' + escaparHtml(c.contact) + '</p>' +\n          (pendiente\n            ? '<div class=\"rejilla dos\" style=\"align-items:end\"><div class=\"campo\" style=\"margin:0\"><label>Nuevo bloque</label><select data-destino=\"' + escaparHtml(c.solicitud_id) + '\">' + opciones + '</select></div>' +\n              '<div class=\"rejilla dos\" style=\"gap:8px\"><button class=\"boton chico\" data-aprobar=\"' + escaparHtml(c.solicitud_id) + '\">Aprobar</button>' +\n              '<button class=\"boton chico fantasma\" data-rechazar=\"' + escaparHtml(c.solicitud_id) + '\">Rechazar</button></div></div>'\n            : '<p class=\"pista\" style=\"margin:0\">Resuelto ' + escaparHtml(c.resuelto_at) + ' por ' + escaparHtml(c.resuelto_by) + (c.nueva_hora ? ' · nueva hora ' + escaparHtml(c.nueva_hora) : '') + '</p>') +\n          '</div>';\n      }).join('');\n      $$('[data-aprobar]').forEach(function (b) { b.addEventListener('click', function () { resolver(b.dataset.aprobar, true, $('[data-destino=\"' + b.dataset.aprobar + '\"]').value); }); });\n      $$('[data-rechazar]').forEach(function (b) { b.addEventListener('click', function () { resolver(b.dataset.rechazar, false, ''); }); });\n    })\n    .catch(function (e) { mostrarAviso('#salidaCambios', 'error', 'Error', e.message); });\n}\n\nfunction resolver(id, aprobar, bloque) {\n  var obs = prompt(aprobar ? 'Observación (opcional):' : 'Motivo del rechazo (se comunica al participante):');\n  if (obs === null) return;\n  llamar('resolver_cambio', { solicitud_id: id, aprobar: aprobar, nuevo_bloque: bloque, observacion: obs })\n    .then(function (r) { mostrarAviso('#avisoGlobal', 'ok', r.estado, r.mensaje); cargarCambios(); cargarRegistro(); })\n    .catch(function (e) { mostrarAviso('#avisoGlobal', 'error', 'No se pudo resolver', e.message); });\n}\n\n// --------------------------------- pistas ----------------------------------\nvar TRACK_STATES = ['PISTA PENDIENTE', 'PISTA RECIBIDA', 'PISTA VALIDADA', 'PISTA CON PROBLEMA', 'NO APLICA'];\nfunction loadTracks() {\n  $('#salidaPistas').innerHTML = muted('Cargando…');\n  llamar('listar_pistas').then(function (r) {\n    var resumen = Object.keys(r.por_estado).map(function (k) { return '<span class=\"chip\">' + escaparHtml(k) + ' <b>' + r.por_estado[k] + '</b></span>'; }).join(' ');\n    $('#salidaPistas').innerHTML = '<div class=\"datos-evento\" style=\"margin-bottom:12px\">' + resumen +\n      (r.carpeta_audio ? ' <a class=\"chip\" target=\"_blank\" rel=\"noopener\" href=\"' + escaparHtml(r.carpeta_audio) + '\">Abrir carpeta Audio</a>' : '') + '</div>' +\n      '<div class=\"tabla-envoltura\" style=\"max-height:520px;overflow-y:auto\"><table><thead><tr><th>Código</th><th>Bloque</th><th>Artista</th><th>Canción</th><th>Método</th><th>Estado</th><th>Archivo</th><th>Marcar</th></tr></thead><tbody>' +\n      r.pistas.map(function (p) {\n        return '<tr><td><b>' + escaparHtml(p.code || '—') + '</b></td><td>' + escaparHtml(p.final_block || '') + ' ' + muted(p.final_time || '') + '</td>' +\n          '<td>' + escaparHtml(p.artistic_name) + '</td><td>' + escaparHtml(p.song_name || '') + '</td><td>' + escaparHtml(p.track_method || '') + '</td>' +\n          '<td>' + etiquetaEstado(p.track_status) + '</td>' +\n          '<td>' + (p.track_file_url ? '<a target=\"_blank\" rel=\"noopener\" href=\"' + escaparHtml(p.track_file_url) + '\">' + escaparHtml(p.track_file_name) + '</a>' : muted('—')) + '</td>' +\n          '<td>' + (p.code ? '<select data-pista=\"' + escaparHtml(p.code) + '\" style=\"padding:5px;font-size:12px\"><option value=\"\">Cambiar…</option>' +\n            TRACK_STATES.map(function (s) { return '<option>' + s + '</option>'; }).join('') + '</select>' : '') + '</td></tr>';\n      }).join('') + '</tbody></table></div>';\n    $$('[data-pista]').forEach(function (s) {\n      s.addEventListener('change', function () {\n        if (!s.value) return;\n        var nota = prompt('Nota (opcional):') || '';\n        llamar('marcar_pista', { code: s.dataset.pista, track_status: s.value, nota: nota })\n          .then(function () { loadTracks(); })\n          .catch(function (e) { mostrarAviso('#avisoGlobal', 'error', 'No se pudo marcar', e.message); });\n      });\n    });\n  }).catch(function (e) { mostrarAviso('#salidaPistas', 'error', 'Error', e.message); });\n}\n\nfunction prepareAudioFolders() {\n  var b = $('#btnCarpetas'); ocupado(b, true, 'Creando…');\n  llamar('preparar_carpetas_audio').then(function (r) {\n    ocupado(b, false);\n    $('#salidaCarpetas').innerHTML = '<div class=\"aviso ok\"><b>Carpetas listas</b>' + r.creadas + ' nuevas, ' + r.existentes +\n      ' ya existían. <a target=\"_blank\" rel=\"noopener\" href=\"' + escaparHtml(r.carpeta) + '\">Abrir carpeta Audio</a></div>';\n  }).catch(function (e) { ocupado(b, false); mostrarAviso('#salidaCarpetas', 'error', 'Error', e.message); });\n}\n\nfunction uploadTrackAsAdmin() {\n  var f = $('#pistaArchivo').files[0];\n  var code = $('#pistaCodigo').value.trim().toUpperCase();\n  if (!f || !code) { mostrarAviso('#salidaSubida', 'error', 'Faltan datos', 'Escribe el código y elige el archivo.'); return; }\n  var b = $('#btnSubirPistaAdmin'); ocupado(b, true, 'Subiendo…');\n  fileToBase64(f).then(function (b64) {\n    return llamar('subir_pista_admin', { code: code, song_name: $('#pistaCancion').value.trim(), file_name: f.name, file_base64: b64, method: 'WHATSAPP' });\n  }).then(function (r) {\n    ocupado(b, false);\n    mostrarAviso('#salidaSubida', 'ok', 'Pista guardada', r.track_file_name + ' (' + Math.round(r.bytes / 1024) + ' KB)');\n  }).catch(function (e) { ocupado(b, false); mostrarAviso('#salidaSubida', 'error', 'No se pudo subir', e.message); });\n}\n\n// ------------------------------ comunicación -------------------------------\nfunction generarMensajes() {\n  var b = $('#btnGenerar'); ocupado(b, true, 'Generando...');\n  llamar('mensajes', { plantilla: $('#plantilla').value, bloque: $('#filtroBloqueMsg').value })\n    .then(function (r) {\n      ocupado(b, false);\n      $('#salidaMensajes').innerHTML = '<div class=\"aviso ok\"><b>' + r.total + (r.total === 1 ? ' mensaje generado' : ' mensajes generados') + '</b>' + escaparHtml(r.nombre) + '</div>' +\n        '<div class=\"tabla-envoltura\" style=\"max-height:440px;overflow-y:auto\"><table><thead><tr><th>Código</th><th>Nombre</th><th>WhatsApp</th><th>Mensaje</th></tr></thead><tbody>' +\n        r.mensajes.map(function (m) {\n          return '<tr><td><b>' + escaparHtml(m.code || m.submission_id) + '</b></td><td>' + escaparHtml(m.full_name) + '</td>' +\n            '<td>' + (m.whatsapp_url ? '<a class=\"boton chico\" style=\"text-decoration:none\" href=\"' + escaparHtml(m.whatsapp_url) + '\" target=\"_blank\" rel=\"noopener\">Abrir chat</a>'\n                                      : muted(m.sin_whatsapp || 'sin número')) + '</td>' +\n            '<td style=\"white-space:pre-wrap;max-width:480px;font-size:12px\">' + escaparHtml(m.cuerpo) + '</td></tr>';\n        }).join('') + '</tbody></table></div>';\n    })\n    .catch(function (e) { ocupado(b, false); mostrarAviso('#salidaMensajes', 'error', 'Error', e.message); });\n}\n\nfunction enviarCorreos() {\n  if (!confirm('Se enviarán correos reales a las personas del filtro actual. ¿Continuar?')) return;\n  var b = $('#btnCorreos'); ocupado(b, true, 'Enviando...');\n  llamar('enviar_correos', { plantilla: $('#plantilla').value, bloque: $('#filtroBloqueMsg').value })\n    .then(function (r) {\n      ocupado(b, false);\n      mostrarAviso('#salidaMensajes', r.omitidos.length ? 'alerta' : 'ok', r.enviados + ' correos enviados',\n        (r.omitidos.length ? r.omitidos.length + ' omitidos. ' : '') + 'Cuota restante hoy: ' + r.cuota_restante + '. ' + (r.nota || ''));\n    })\n    .catch(function (e) { ocupado(b, false); mostrarAviso('#salidaMensajes', 'error', 'Error', e.message); });\n}\n\nfunction exportContacts(b) {\n  ocupado(b, true, 'Generando…');\n  llamar('exportar_contactos', { alcance: b.dataset.contactos }).then(function (r) {\n    ocupado(b, false);\n    var url = URL.createObjectURL(new Blob([r.vcf], { type: 'text/vcard' }));\n    $('#salidaContactos').innerHTML = '<div class=\"aviso ok\"><b>' + r.total + ' contactos</b>' +\n      '<a download=\"' + escaparHtml(r.archivo) + '\" href=\"' + url + '\">Descargar ' + escaparHtml(r.archivo) + '</a> · ' +\n      '<a target=\"_blank\" rel=\"noopener\" href=\"' + escaparHtml(r.url) + '\">Copia en Drive</a></div>';\n  }).catch(function (e) { ocupado(b, false); mostrarAviso('#salidaContactos', 'error', 'Error', e.message); });\n}\n\nfunction checkVideos(todos) {\n  var b = todos ? $('#btnVideosTodos') : $('#btnVideosPendientes');\n  ocupado(b, true, 'Verificando…');\n  llamar('verificar_videos', { todos: todos }).then(function (r) {\n    ocupado(b, false);\n    mostrarAviso('#salidaVideos', 'ok', r.revisados + ' enlaces revisados',\n      Object.keys(r.por_estado).map(function (k) { return k + ': ' + r.por_estado[k]; }).join(' · ') || 'Nada pendiente.');\n  }).catch(function (e) { ocupado(b, false); mostrarAviso('#salidaVideos', 'error', 'Error', e.message); });\n}\n\n// ------------------------------ herramientas -------------------------------\nfunction respaldo(accion, b) {\n  ocupado(b, true, 'Generando...');\n  llamar(accion, { etiqueta: $('#etiquetaRespaldo').value }).then(function (r) {\n    ocupado(b, false);\n    var x = r.xlsx || r;\n    $('#salidaRespaldo').innerHTML = '<div class=\"aviso ok\"><b>' + (r.etiqueta ? 'Respaldo ' + escaparHtml(r.etiqueta) : 'XLSX generado') + '</b>' +\n      '<a href=\"' + escaparHtml(x.url) + '\" target=\"_blank\" rel=\"noopener\">' + escaparHtml(x.nombre) + '</a>' +\n      (r.json ? ' · <a href=\"' + escaparHtml(r.json.url) + '\" target=\"_blank\" rel=\"noopener\">' + escaparHtml(r.json.nombre) + '</a>' : '') +\n      (r.carpeta ? '<br><a href=\"' + escaparHtml(r.carpeta) + '\" target=\"_blank\" rel=\"noopener\">Abrir carpeta de respaldos</a>' : '') + '</div>';\n  }).catch(function (e) { ocupado(b, false); mostrarAviso('#salidaRespaldo', 'error', 'Error', e.message); });\n}\n\nfunction backupAudio() {\n  var b = $('#btnRespaldoAudios'); ocupado(b, true, 'Copiando…');\n  llamar('respaldar_audios').then(function (r) {\n    ocupado(b, false);\n    mostrarAviso('#salidaRespaldo', r.completo ? 'ok' : 'alerta', r.completo ? 'Audios respaldados' : 'Respaldo parcial',\n      r.copiados + ' copiados, ' + r.ya_estaban + ' ya estaban.' + (r.completo ? '' : ' Pulsa de nuevo para continuar.'));\n  }).catch(function (e) { ocupado(b, false); mostrarAviso('#salidaRespaldo', 'error', 'Error', e.message); });\n}\n\nfunction refrescarVistas() {\n  var b = $('#btnVistas'); ocupado(b, true, 'Refrescando...');\n  llamar('refrescar_vistas').then(function (r) {\n    ocupado(b, false);\n    mostrarAviso('#salidaVistas', 'ok', 'Vistas actualizadas', 'AGENDA ' + r.agenda + ' · CHECK-IN ' + r.check_in +\n      ' · AGRUPACIONES ' + r.agrupaciones + ' · PISTAS ' + r.pistas + ' · RESULTADOS ' + r.resultados);\n  }).catch(function (e) { ocupado(b, false); mostrarAviso('#salidaVistas', 'error', 'Error', e.message); });\n}\n\nfunction cerrarJornada() {\n  if (!confirm('CIERRE DEFINITIVO.\\n\\nTodo participante que no haya audicionado quedará NO AUDICIONADO y no entrará a la selección ' +\n               '(quien esté en escena termina).\\n\\n¿Confirmas que ya es la hora de cierre y no hay más audiciones?')) return;\n  var b = $('#btnCerrar'); ocupado(b, true, 'Cerrando...');\n  llamar('cerrar_jornada').then(function (r) {\n    ocupado(b, false);\n    mostrarAviso('#salidaVistas', 'ok', 'Jornada cerrada', r.cerrados + ' participantes quedaron NO AUDICIONADOS.');\n  }).catch(function (e) { ocupado(b, false); mostrarAviso('#salidaVistas', 'error', 'Error', e.message); });\n}\n\nfunction loadSystemHealth() {\n  var b = $('#btnSistema'); ocupado(b, true, 'Revisando…');\n  llamar('estado_sistema').then(function (r) {\n    ocupado(b, false);\n    var s = r.salud;\n    var ok = s.llaves_coinciden && s.esquema_completo && s.produccion_limpia && s.web_app_url_ok;\n    $('#salidaSistema').innerHTML = '<div class=\"aviso ' + (ok ? 'ok' : 'error') + '\"><b>' + (ok ? 'Sistema consistente' : 'Revisar') + '</b>' +\n      'Entorno ' + escaparHtml(s.entorno) + ' · hoja marcada ' + escaparHtml(s.marca_hoja) + ' · esquema ' + (s.esquema_completo ? 'completo' : 'INCOMPLETO') +\n      ' · datos de prueba: ' + s.datos_de_prueba.proyectos_de_prueba +\n      (s.web_app_url_ok ? '' : '<br><b>Falta web_app_url en CONFIG</b> (la URL /exec de la implementación): sin ella los enlaces no abren.') +\n      '<br>Legal verificado: ' + (s.legal.datos_verificados ? 'SI' : 'NO') +\n      ' · pendientes: ' + escaparHtml(s.legal.pendientes.join(', ') || 'ninguno') + ' · términos ' + escaparHtml(s.legal.terms_version) + '</div>' +\n      '<pre style=\"white-space:pre-wrap;font-size:12px;color:var(--tenue)\">' + escaparHtml(JSON.stringify(s, null, 2)) + '</pre>';\n  }).catch(function (e) { ocupado(b, false); mostrarAviso('#salidaSistema', 'error', 'Error', e.message); });\n}\n\nfunction crearUsuario() {\n  var b = $('#btnUsuario'); ocupado(b, true, 'Creando...');\n  llamar('crear_usuario', { alias: $('#nuevoAlias').value, rol: $('#nuevoRol').value, nota: $('#nuevaNota').value })\n    .then(function (r) {\n      ocupado(b, false);\n      $('#salidaUsuario').innerHTML = '<div class=\"aviso ok\"><b>' + escaparHtml(r.alias) + ' (' + escaparHtml(r.rol) + ')</b>Entrégale SOLO este enlace:<br>' +\n        '<input type=\"text\" readonly value=\"' + escaparHtml(r.url) + '\" style=\"margin-top:8px;font-size:12px\"></div>';\n    })\n    .catch(function (e) { ocupado(b, false); mostrarAviso('#salidaUsuario', 'error', 'Error', e.message); });\n}\n</script>\n</body>\n</html>\n",
  "ui_cabecera": "<!-- Shared brand header. Logo and wordmark are the organization's own files (assets/brand/), embedded so the forms never depend on another host. -->\n<header class=\"marca-cabecera\">\n  <img class=\"marca-logo\" alt=\"Corporación El Arte es la Solución\" width=\"88\" height=\"88\"\n       src=\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALAAAACwCAMAAACYaRRsAAAAYFBMVEV/gIHg396gn6D9/f0DBAYAAADo6Og3NzhGR0fX19fHx8cmJyi3t7hWV1inp6hnaGgWFhiWlpZ2dneIiIkeHiA+PkB+foAfICGen6A/QEFeXmC/v8BfYGG/wMDAv77f3+B1fpo/AAAAIHRSTlP//////wD//////////////////////////////////78BYu0AAA8vSURBVHja1V1tg6OqDvZcPbyDCvO2u2fP/v9/eUErBIkWbe29w4fd6YxtH8KTEEIIzd/PbW3RnvwFzXVIr8HdvADrU1E3r0P7HMzNK8E+A3TzcrQPYm6eD5dwIYRS/h9Ong+5eR5crsZeM0oZ07r3TWsWXul+VPx5kJunoOWmZ5QFZKSUt+9H+KPhT8HcPAyXG02Z3RAiEL9lVCOgLwa8/jrhmAdL6hSNeNDMiccgNw/g5Y6yEZcsCX3A+sFHRh1/AHFzGq5hKFpFqXwbOuuxDTKonEMwM3MacnMOLnG0F6hsTTc17aHPP3U/29bSXOdETx05B7k5g5fD7yOex0CKYphQuvmn6QVpafhPsg+R9ZifQdycghtHlPN2DFjAn+0EM/SHdQPnshvadrgJ27bjGHtqTkFujuIlNsE1uqOtCIDB+OpOesxf/icasErfGzH9ahg65aEPOr2fWnIUcXMQr6Nj5OFnEBr3CIOKxUY7yruubwPWTnoyUE9n5QH7oZh656H36vbwSN1BxM0huCqKRNA4ymQImOIIeBmyiSTkRgQzd2Pgtp86MTWRBkwdgtwcwEt6FknHJ0GN3WAnMGlkRUTkHxnoMOlf7JT/K1M6Iz1nPTmAuKnHayIbZqoGhk6TXN91Cpq1wbO1G9uJGGrmi5pJEh414RHIIc8LU4+4qcbb69xy+u+2H1TMGK13KWa2+F874ulKhQ0gTYDuqT+rYTAX0hpHcxtOdF+NuKmEKzLxprHXMz3YIubJZniD5vsQKCzk/AgL2rnMJa6cbkbYhfOA4QeWs/Ckdj0xvwKJHZ2BTN2YAOuJyd1kJXxvBjHzyLMacz84FMhZwICwPfIdfpgZIW+d5jdzENSKe9+9adVojDDOWk7loGfb4LszDl76xOC+XK+rEDcVeAl1qIsbIPr5d5gHWupx03HTnzez4W00pxb38BwlFYib+3iFVLhMwgAHqB9M9l/3HHhDwpD49oaSeLLyUtxH3NzFq+QWFjYzgWUOvF8SmdE51zg3GiWyP43zO4Yth58D0RwFDKzv5noiiBd440T4xZtc/JylSdq71CMelJPlTACfT4BFPgYYmIcVI4HJN0Pyib2PuYYK2kDTOkrYnGEuYxwwFqcAj2xNM4x/qpfd3ea9NHyshITzHhvPAN7C62S5zBC2Au0N8z+4+mpWj7jZw2vozgcvK7vuUKMjJmYLFSXxuBZwciZz+lJbzKiyO9wGh0AeoSlKDmcd4MQtktuc8QlwZ8iIGryB9V4i3hHAJLe/Qpr1er473WQ5KYpPBWRDDgAuB2b6vLe1R9g91JjYmzUSGe8DjgqWjduvFd5x6B5tdg+x01uImy2Dpnfk+6h4bwZjLWT++SsZpC3jtgFY0B28auie04o1wVtSm9idfcDL45nC8c/fKz/4We2fwl9LXofERdygeHvYd5LbB909sa09K5OW02OPIkYBm2xGy1ZzhHZPbcOKyC59dQxxbgOOIoX9zpZHXHbPbiv3Qtu2gHEPsDZ4l0PIt3t+W01IMHR3B/DCfJapwdV414h5UnimSsQNMsXxFpvWL8O7ZkXyETky4ZWAHe5OB/DdVS3XvD4isG4HcIS1RWB6GV4f2cwQp2Et9a4AbMcW8ZrSGvmalnuyIgpttJuAo51FFXbaCbiysQ1S0LWI14B7gBE6QKa7uDU5KRaOmH4fMIexdDBOZLgacG4q0ly72Kw1YETA0CNml+NdxYPivLwWcQ4YMhh6mK57Qcs9cLpmcQ54AQZMBFMwTlkpJbSdIkX04MfcFueAgbcHPTZW75GTosVtmvu2LY9wr+0WBLzmC/T4j1gIsxFHPrPMi7vqfeZmZoDBUhYKWD4GWNTTmGMiFmwLMLRpP36f0bhHAWuUxZlla3CVAy7mERP8ICVyL0i8Y2rX4CoHfHh3aBlMikis/XnWtC0MzdQOAOas5M/BOc7bsNX+gjpojOHbo2vAOAoYMMImfR0Pul1rQsgHFv7LkC+cWACXjACLDvlgAKo/KGLIqSXaADnRYNMyUDn10NrhxAfAkF7EAabnBNjYFomj3AubyLwtit3+FceIrh45wqkFqDUQ8AJNFM95sR9lwP0mhnqPYpGcSAv+BDgx4jerVbkTeO9OJDBuEyMTtAQMjJp1lW7PKbz3EL9lgbHCsDUIhZNLQaplcaipak4sUBKJI+CY6ATNhbkE7x3EcNyWwVZ9ArwSOiDOvhEFeP8VU/s3qa3wCdrpxe3vYBN9DzFFSBwJmwBTjMKyZtbntPgqnnlCFIk+mLq5IwKla8BA57Sq8LMk2CIvjf6YDYHD4iW6zuf7QVZatwBWiTnvpEIMEnPmeIZGIv1OiHUdiRfpLSoWAY9jMQq70R6JGD668vAEEpWjFYBhFGiJnC34IuBkJJSuscIYYLtSKYd0vAYwtMRLcC2aiQVwMhKjrdE5DLBYGZd3ZKbQNU4KcIrVykz8vYS0GCmNBOkOAZZFR0nZcy1ujdVNHcsKlCw8aQqrlqJV4hjgvnifOekUwyj62q6VgPWvGluJAFaF4dAnnWJoJn7ggAnYHuM1rposHkrBvNiHIX7oseAnnPQXri7/N4UtS4BtlZ+97DxrZNkqzm2fZilAPP+/WXnIUP36uoUBYTnx/oOI6lg8/B0BvKwv9gD/rN1yVaGBY0exifyRqVUsw2kF4EQbVrmeU2d9S3MoVrB4xH0OWB0H3JnLEEtEwstUvAeYHczPqG7j44AhJUi1atuLEKOAK5ROHzKYT0QsETu8YyX4gQmV6lvjyVvJ2pgSmzRM4XaVViLOaCvAcOIQJzY/hy3i5x5RX7dvAiaOP6xFJw6CrZDcicm0iM7m3a/jmy69tfXUDL21rxORVrNpsmx57uMu4L70h3e8tQ933McatqfzlZfMagCDCGbMrVoDTmOVVhz8RKT/bTsA21cDBlPSIr7kwBdLJKVrdguGfm6WZlOI2jHWqhow8FOW5URaIhWLUGAwaIWptNkizO4Z1aEWMCldiWIRmpb57XuNMyHhM++7y9bMKWZHPhsESYplPgikJHa4ig/toZKI3QncQAOgq6xaHO4ikAKIkFahqkYKFjDC7c5bXieqXEFgJOLudxGqAnYt5YHtaJ3Eskc2AhmRE++yKudUlIGfMhgIiCCqtA711JTxbfTNH0byh9OsnepMpKASr9npGBD3HYZbCzMBI69X+Jb35iSGbBnAgPbeloG4KAJvKtcFcU5AtgzwTZnPSxCb2u3miATZlAFEACTed4l/XuG9Y0tmbNsL31hUB7IFapur3rvlS5wq31gsSQyyJe7stGp/WDW3EWhLqfjG2PoEhGhg863bcnMc7CPZ+t1sXvGMOhamEnub43CHmR7If/mrgpq0PptB3ckEwxM8ACd0dVipKqbeHwhJfNgWT/AoDRvgxO9aRuzM42+DqeUEDM7ENJONFJosJYVUJWb3HMz7gtutQQAOrhB9ZcZoTO/YSlLKkn5c1Sxqqwzs6qCmrcxHibws08DKRDuYc0dfBxgKOEEoE+2QVEZQOki8DjBksP24m8oIk0Xh6RP9KsAyy+0gO8miiNq9iwpbbLP0261Jl+ZP2aoY+Ue/l46LqB1Mb3W1Gc5VT1V5JikBH094RlLK4QnIC8+cbCTBW7ufUo4k7UMRi1cANqiAt5L2kRRikAT/iqz9PHfY3TsWgYg4O8h6+bmI7HBP+up7B08yFv907etOnmRJm+kQ+PbRHuTwVHbU8mIaZztS7mfF4SnseFpWXmK8Eq/Nzyy2NcfTsAOA8Pxf+/EihQOE2D0AiB2xzCsg9N1rzqb1lUcssUOseQ0PfQ1eunEk9N4hVvSYcN9fjpiu6m6Q6mPC6EHsvArYBax4z+RLUs2GioPY2FF3khd+stfqG5RPxVF3tJgAf+PtddZtFZ9j9lgxAbRcg8qPxKrhqvnC4+3bY+Ua8IIYZlWO5mnO5qA28dYWxMBLjqwQP0v1GNnGW11yBC/qYlYlzMzwfDpkdY/qi7pslM1Rn/nokYeFzFanrAis/XOkbM5GYSKxLqulHmLy51cRNubtycJEG6WfyPIi7aK/nVY2u1vE+mjpp63iWsunRf0l7hyVlyq+XGxUyjtYXGu7fNmyukuJPE6el+444MUDj5cv2y4Qd5ubx9MF10K5tVv5Mr2R+XamQNwOYl5WH+O1Je3klHsm5VQlmgsc8LkSfNtFDr1tmBOilcvK8N21GfJW21CE5WYYJqPekIKSZ4scbpWRdNFdkauiab46Lh22ajL2qQA7F6pXk1/tTBFNPF9GcqNQJ48RxmnZL1fV9Iiv1+rvLZC3+NnwKZm2ZlWsM4yFm4hPZX7K9qFCnWgp1GDGVLYbLzbKtRLOCSnG2/9uuMVVGbKce6wUKlJsVk3+tloqZQ8Hd0J9IdTehfJ7nsHijx8AmYdYHy02W5bzDYW+Bz15Ae9ew2U3F7/mmt67f8FfuzCSiUPT6fKQmRLKlvdZLs7D5XyRgsnutunmv4maRTpsTgvDL1sIU/qsjda/6YfXVW92/gmf4WsRq48o4qcUTEZKUgchmxjLJIAdnTGDfNe+trA/BkPmC1Ac98Vne7eEf7VPNnEBoZhq7gcVULdtlSeVpMaKflsd5ijJYjzBM9uQUOB71qcg+clasaUiNQuF6q0PT/onFZmI/+6hm6Ryzyv6jZZV5xPzohG1Qea+uLeXGGNej+wNcLC13KN2LswPhE9jMfX2T5Du6F/d3IqnllXHCtcr5hHJhX12rnzLx0BMN4Gc1tnCV9cOg69EDK4HTvhXvf0MW4i3QxPPLlyPXg2gCPCBZpPaToLsPaT+xhXmR9yL0bVxQvsKnaRZ/PqCqwHwyxe8lOdZw9APEUpNqz5YKObB6htgHX7hbV+4jmEqqUxIqPs1cddcefnCxvUWN+9HB2Px4aUbBOrx6QjYBpHTqab9QBZyhJnHiquvt9i+QGS6eUFqOVnYPjDATlK+xYj49MLL1I06FLkPTlv7igtEdq5oiec/AyARiB0kPPoqPSaQJhCFxH2tUb3qipadS3D4qN9CPfpu9g6Ur9QnzXzPSUfpdFsLW9e1f8UlOHvXDBGRYsfExA3m5I+N8EKiV10zdPciJ/VlNfvVRsDeXaTauv/hRU6VV2Xx0AT/v7gq6/tdRvYNr3v7hhfqfccrC7/hpZDf8NrN73ix6be8OvY7Xs770uuP/wsGpTU+qVPFMAAAAABJRU5ErkJggg==\">\n  <div class=\"marca-titulo\">\n    <h1 class=\"marca-h1\"><span class=\"sr\">EL BÚNKER</span><img class=\"marca-wordmark\" alt=\"\" width=\"260\" height=\"104\"\n        src=\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAggAAADQCAMAAABV0Gk6AAAAYFBMVEUAAAD///////////////////////////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAw2ciRAAAAIHRSTlMA/QTPsC+PUG8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEfly/AAACimSURBVHja7Z2JduQqjEBdQiz//8Vts4pdYFeSTsrnzMybascbF6EN6Tg+x+egB5zH5yt8DgeDI+LzIf60PFBCnyQAfEj427LAvF4veckE8JLhc/xNEMQJgj4OiQLlh4S/y4E8OXgZ939e+kPCnwVBXwAou0CENeJz/FUVIYHwIeHPgoA5COLjVfijhwUBD+VBOP/zQ8JfFAggChBO6fAB4S+C8CpB+E7T4SOMfhII36cwwify0XT+fx0IwoIgAgm7g3FzDE+nhv7Cl/9PZupX+pMcCELfVBhv+qgBzodBreHHkQDfExO+5iPE//oiEC7jQaqbCqO8tagAoFdSftzq8FUPBPEIX1SYGsY3YOEdiycINuIAdxRGC9UNRTNA+XV2C+eD2lPgq8Y/+0lKeXl3lD7/Q0Iun+KpD0GRQEAbcTA3FEawesb+g0G8u/kSEBhDDG61M0I9uFxBeRTLo9ZGIQrxyg5Bp5gET8BjmIaP70AQUTjveBgdCGr7wQDEgji6PRHOv9dKD2cUWPXVPtd7hRT48VdYDD89dEgfugZJSU+AlRXwMAjXvcS2whjCFvLuyvCaTD8g/3NHO7Jq0VjnuYwqA+5rPDfql6jX52HOQ12z/8U5Agje0lfaCNTnOwjzgLg605MoCIKMxrKADsvMpmQHiOGO4d87kXhoc4uE8KJKi94ieJ0i0IMgHlIUrGW0dYSv6qND9MDbJMARrurXBIyjua4mRIgE3Ah/sUCyt8I7imlYh3T/dmHqaeneCZ5JE1bckReC6AlCVvPt9ZwL8Hy58FhBOTiX+KQwrqkJwTm191jpr4cqwrVCIvhVaP/1gzJ0GcwdqQ+BTPkYCPay03VAGC0vQwHIJ8lpjWa+wEfCAvRGkKZjImFNTYD4knoLBE1VhN6NLQKn+1F5M3PTA+rfMUj94etYEB5wu59vqIxi6APiNBjdHEzjQ4fiUnPDaFENAu7ajhkIFwlqT02IYg+3QFDpnUd/j/axgkqzp46ERcwJxPbtEgj6ERCo+sVaGfDEhgr/TFjphg5x3DfcKQhxvi3O7WsBNDy1v32I5E66Jk+PcGfLif37pIVBwGsIwusJEKDxtbeURfKYQDRGcV9lpIoLASEjYe3igfl1HzGZL9qq1qIDgrfl4hipHReoDqvxQKWJT3QPhPgB74KQvWmac1SGyM3lIQNBELhkNCZOzHjXvvROA7DtIy5UBNNdXtyq7m90mdHL8wCS50rwQdjUxs73EujC6+cXEv64D0LLdLBTGG4ZbOfntNJHJbVfrI2p/WwqXnB9dJKKAHZ1NhwQjNiYqtXU1BMQblgo9l6Y3JfOo7zlSsgkf0/h2HOFwyFyiWDC8ItcUrNNBmk2rZlkcVgCBtGr2yDU35AFgt77wmkbGQQcAIDpR0Aipg1P89xSFGqJEC8vClHNpAr1a89uIJasdNKhe1f7SP458bUDAn4VCI4D4/w1MuRfkaWpNfhKmdORIC001xN4bUBmS7R7ONFRFB6QCJEEzGQ1cL/vppKZqwiXdOjEvDwwAQRxw//5mvjS74PgXuqaE/Jc6uj7WIfRGW8wNuJw/T/Wc1C8shMdoBu0+ocDKZoxiW1xfL6t8F9EJ91ArHgTLnAEsUFhcXiIF+F69Y5q8gQI7iHV20Fw31I4o5+tPpPotBsgD4JpgSCbjkpzrH78EgRru5tIgl7xZF9/KDJP2H6gAbvfvQBhXYsLpKN8Nwj+TtJ6aguvCPSOxgD5d22D0A5dLKYCwHHUIJC5aeLgcHIT7HsDsUcP2FQR7H/DEAS5C0Jcn+kV1DtA8H+uLQe4la7jFXA3SqojEdR9lbEpEXzegxfvCymMFgTyefVamCLlIliZJMYggN4FwQs8pCbkOySC1QvspdUuB95/KN3MxCyFJoLQCWYukUBjTgkE6m+Rmm9DeptPbKW/pgUJ3cqguqFhyB9sDYSYDSDhtSgRVsMu4D8o7kcuwS+SKq61UEsE7JgfC5+lAwL9Pd1myrR9NJM8n0upbnQ9smOl+SDoJfa9ppiZkMgBQW0IW4Q7HBxBWzL+IaUmgYtMWWzZkXwSMkOKgED+QUi28mffHckl9RKSxLttBhrGPRCiTRSWFqE4IKhVieCXV2Fl641MBnChVu09O+pFAheSphaKo2FHss3ILgjkX5C/OFxeCUG8NWplgCSRI2KAXZgJWyDERc8EkYeGAYJeBQG8wJaWA3knwb8AQdcgBP9fIwrFNSP7IBB3AiquqLFPDdnasO5OUm5lMBMQ9B4IMVNXZZyL8edZBeExDjIQXhcIqgfC9XstFJgkDEAg2ltMqUGA+TqvyTVXFinMI+DyHSAkTTEtePJ5EMI6p0HczWexn1QREKIxUJS+Ej66uReDGoFAXX3MdCU7rU0KYOdOVWZcWIag0vEGEGpNEYEBglkCwduNLuX1Zl5TBoKkEZgIgn5Rk0KLHTNyDEKapYI3xX0gOpn4YkNFcNl4fYRugJA0RfN6GwgxiczIR5KLMxDMGAQrFHDDjMySGywImOXAVG7ssUVony3bGMH9DEmxUE6gyDdIhFpTtPdjgKDUQsAlZMU+kvBqQUAKgixBMNmcg6NOg5o/xBiE3PHIMAS8Z/wAXE19pSrCeGWIH8Csg3BkW3nCC4nuPowIAiL3ZeLLK/1I5Rmf1hLCjzpd0j+cii+VJFKlM07NyAwEXYHQCtjqMQkYfOtLgSfqwLJ/rN4AQuEeykBoey3Sfh0mCGkQHuIggCATCCYHAT3VorlXhWs8zECga7dgyBm/ohF8uCktKZ1lsjJsg9BcGJZAmLpFUo75UxzkIBgazY4SoQKhtTxMjIcpCI0UyZGaYM9GuqIwJyuQ7fDTe2yCEBbTuHD5af6YRIAY/1HmqYpkLv4WQZAsEFrLw9h4mIPQSMGeim0gATHFlAgY5Y2e/FWoGLwIQnIh6MyV5CPtExAE412SbqTMYyUe7NtmIGAJgmjtNq2thyEJHBDqxAc90OgvWaDTfiyemz2pCN5BrR8HIdrCKmkjHgQ1B4Gj8KRJ+CAHwRDz+7YbIGCI9kK5qJeKghiut1MQsi010zikDyCToCYvtYlkvM40i00QogtB5OlXLInAAIEEZ9SDJV+8jCUghKkVQICONtbYFDeyyecgNNwJOLigSyk5lgxIUjEH9PyL6zwCwkqVCPnjmhScfhAEKEMzT5X+yUDAFRBaioLu++0ZIDTcCXocCJDUgGR5mZOKoGZfcQ8EfwckezUOr9k/sDTQPM9HOShBICl8JQiN6V4rCv0kjxIEwcv/7i0OjhmzZkBSFWEepvHPLFZAiO8pafzsMRCIHqXubdbfAEEO5D5RFLz533EtMUGojUjVFwmu7sSKAUlD0POKFDEJmQ9CWhiyiPpTIJDPbR7mIAfBbe+SOQh6pADUikLbtcQFoSahX3XILBuQSa5qMNO/iOUA2SBAKj71yvbdPwMCEcD6aQ4KEKAGQYzbrdSKQjPRPRtfMwChcifgoPzUNaDUgASmZXcNB07HtbELWB88/6mmS9tTIBAN6nkOKhAEAQEyXWmQ44lTh8ICCKU7ob/9xOaZLRiQmYow1yqWQUhVs7JyQx7tuyAkDoTExzkI2jeEiVKDgHMFvpjEjSIKfBAqd0LPC+yLr5KdM2Ya+ZKZaT8p29SoNjETIYrocbEaUazGpebRxz4ISfJ6DvDZKsluuAMIdqeLzkAQ8xKltaJQFVFYAKFyJ5ieSNCvtQgkVREUJw3KLEZE5avI95auTqMHAQc6MkxAeDcHLRBMBgKrJmatKBS1ylZAKOdHNzAETiPR3BJ9VEVg5PgtgpCCjsUniyCMjKWM/YbXNXEAb+HAD7e+CUKtKBTLwxIIJQldkeB3dLAld/jaDP/yBghhh5soCH4ABLr74z0c+OEOkXNNtoAtgUBJ8LnIWQm2NRBKPa1nsOi8BtMph4CFlzn00krCASEEHcl2fZkVNL4BAuVAvIeDQiIUIAh27hiNkQtfrJNaDzUIr4kzx0wXBwhrg+GlsKZrSo6KsApCFTFL8XwPwmsThK/gILhqgexOxzYI0+8WP5wAl+pMwpEZCIoBQm5E9raO4koK66KKsAbCIK/mLggVB2/pm+oeIcTO1QAETv6UiS+i8g+3CkJpRDb9lbF8lOCt4ZCFoAWsVkQbmdB10SpdFD2UsAcC4cDPr7f0oeKDgAuxeAy6fEqAXASB1k7oDYH7RIrpZU6P4ELQc7BXQKiSalIwNEiEPRC+iIMCBPQgQMMQQFZ2jk5+Zsw6QKyCUH6c1soUdgCz0pTSWDnXjn4QhEYSNl0WMZXgWQWBXFm93sjBAIRS/RErm28sCSo99wYIDBLi2sBREiAVduTtFGzUDOq5u+sNOoaO5T4IhAN8KwfBZQ+vtHf3BghkGp0kHCpKyB0Qys+jW26WWCpkptFmfd1YG6gXQKhkB9XrAwij3dDQrqZRSZq3cRBjN4L05jyOJgiwRgJKiWRpkOsglCTIOkfKVwlRzNw2dgh6CYSGpiizVX4XhMph+z4OmiBAEwTuFpJsetTlMKLvbXnvbMNsCmuDnj8k3QWtmGksXBAONSqrGUAw/aFsg/CVHPh+Ah0Q1AYImQuA2NI7IJRxTdV2vSqGkpAVShHMlYkHQq0plsQKsjGaD0KVwflWDhyvKWf9CRDSH8aFeAeExs5rebTKRNIWkmaY0JSy1JBTzZELwqzgskgdXPggfDEHj4NwvYIRdd84uexHOOrEkIZIUGEX96w1VAqnK172LxOE2qdYPeUOCIUf5e0cDEEwyzXUrlmsGwpeLhFw7g6+6vQ0yvpBMxxjYJbLnK0MzDrrPBAapmOlyghSPpAJwpdzEBz2IpV32wfBzmK/4QszB1sWynRLwyjRBUibueFIQChyIGb6XKqyye2oxwShMh3rk3ZAKG7+dg4CCDgHYZ7LHWbx1Tg2T3VsgNBV6+DoYdCyIP3aMPMyp/LvPP8yF4TadCwXp7DWD3uE1UvDV3PgQTjugxBnsdAxJG1CMwQuCE6qSmS0GqIrtJlU2ssKcSN3WzMLhOokCdC89woI5af/Ag6GIOiFFKVQhtFi4AWMjrmwrKXBU2BEvwsdQHOIcRKKTh+Wlb/cswbqZ65NR1OfAqlvTb+7Vy4R9Jdz4B8B7oEAsdyasVZDmL/Rc5PZQi4ftryci3QZ7Hevhb7xRhrEtDV7lecv8/vEZNXeKvO1VOmaTi8gfR+7Ogy9jpJfz0EBglbVLlhGQkJUDpSd0iEz0P6Gfmk4ShCyL+Io0AMK5HF0/LsmpiX3U4Bh2XjMBwd7fgzNWDyAlprmSATxaFfuNRDUPghxVUCZre+C5KuNJYLXD0W/fzEcR3d7g8yFaUNJyFo0sGuU0sFRza6NrH38BQgcifAdHPhHCFq6GYCAvT1vblUQutb2hT4aWS55oSAnMbpLglASAiuDEDCMvMxERfC9j1ZBMG0QKtNRQhcEPe7cgd/MQQDBtECAAoSWO4WuCqXRZ9LuBtrl7ZVKh8HQWJxSkNZ/PdrwRFUEtVFv6bwmNgYFQDJ6uN0E4RkOOp2cGiDotOu+B4Jolcrwg3itCqU0MHkbEKxB8MJATCjglHBUAyWBSHCXrq2XQdBNEA5k1IELIJg5COJtHHRafeWkUImACyDYUVRhBShsf4cBNPs+uqQrHGoGTjs8WJ2+IMr8nh+6qGsFy907ZQMEZptXJggqr8TwMAdgez/WFg1Bwm8Q12n5JiCIvqMfkp1oomM5TkpdCvRaIoiumSBQA5MCItNg4IeO5adc51Bu4+EhCA1NEQZhjlB4RQ1AUO/iIIR/zuavV/dX2/wVivFxEoEWCuKAQGT6qRwU46lkva5nHjh3ujEdUQCxw/VCnW3V7+dC8peP1Q7UrxSMqxKPDGvYFkBA8R4OZLMh8AkFKrSHwrM3dCWaw0pHS5blz0UwQFms8X5NGLpiu65DNCy1oPWigmx4gm7+sl6Jpw9BqIMM3Yaykm6FU8wkp+fsBTjUa+uIUZNSGdKhA3nEQOhCQ0QNR6d2zvRpOCbCyIDsepnTe9j/4NfvHoJQvdDQ0REVAGSDIB8rnIe3QVAV8pBUxHPyayYGDBCcXrDZxVTlJbDLlrZxFzQstAulIIgKhFreqkmSnOgb4c3P85j/4LRy8RYI56A0Y6FeCAhlZhrieLdI7UHe3NIXOqVj275JY6b1SsodBeEoEw6rIMOgEKCeeWNaIOjjwTpZx9UtHlFsSoQqV+z0FkRFXxSXvTwJw1LnfRDEwIN88JswkLY5HTNPLqwMTRBkcy/nOCRXvHknjbkEQcDxYOm8E4PrwB0QrgCCqv6yB5WSk6FsVKbKQbjz2t4Elr108rhLe6WRdA5CvjTUpmN/h3Lx5r18dtX+pE8aj1tLQyMV7zUKEC+1cOnbjDd6DaTEy6KAQFSW1MrKMAaBzHI93WLFkgimpTY9gEKjS9IaCAdwT9ccKTYGgYQYb1jKZFblnh9B/MS40FORfJIsBZmajk5fFqM68maaDN6bdnhfKtQpE8tLA+fvRct5xPdqNFTGHV3BU0+a95rWfmK92lyTWAQqd7WZFOGaJu0wdgX0bar7KLg1XohtEEAKluG/0RN4cO9e/gnHgFTQ8vamog1mySrrg0AEAh5m3nVoKhHqva6lrvCIESm1NupigklFKpSBHMN/288pupdd9yn5NAPRLE8QMueQXcy/C0Kx88dnQE5KD6qZfyBK36L2UB3N345BVz/IiwtrTKjruBzNog1Cq5nbvvunAYLp+DnEuo7kB424OU1Zp8KHdJb6b5Orqdgfm6YhyLlACCCIIQgi7/oiZNaQXejbQqETfc4OTTIvit35XYVT7wUECsv76CQpri+MbrSNJtUcons0+hVXu4lXIITNqaQqsWCUoGSAgEVreRvDWe7AvUVFOnQs0F/X6+hnky5O24YVYsjGqLtGtJP/AmoJnBqoLRR56IDgkqpIUJshEMJHFONtc+4cOviYeYaFfP9OJ00Wu1wiAEz0upWlodX09/rzIQqwJnDIpzPQKOO10vkmL+ma+qlFc0wEo28iEOYghP3/ArJWISbT1/Xb9z72JALMLEgFx4qgbXZ/HqQsci1TsqdNG7o2NHQ1eWxpNfowqei+TssjSyCUMdxBjQWvfWgPgNBURLx9N7RsgwAA08gxX5+FXmXSwY5Xpq+KCGClG2Mu9raK5CCo0KcISEFnECsVoIcgOASSERLrD5FcTDgAvh4EnkeKrc9Cv0TtMUhh5Xiv6QoA5QfPdRN1wHFDIkhaGEhCFAhLotCMJALEmtJhlVNpfRDPeBRmIIhcZHPTGbicDkA4GMoCc9g0VvVn9GZsNy/tqwII4TspnkAodnT0QXD2b1Q64h7CK0qmn/IorEkEv3YbrifSsDgdgjDeDM9SS50t7taGsO+4UhFgG4Roe5qYfsDREAqRNAXhiNpn3D9mVQW172O5JxGYHuGUprCROYeNXbCdHU+MOJw3IHWx7z5b4HBFsjZAuIbntSYQin3gAxBEDgLZUXq9lk59JN+0PkAoP1mAYLI+Pm0AqEkEt0EYigWcrY9hbRAxY9jOq0xFMGsg6AIEQZoLBg1h6rJeAkEfdDcgXR8wzZA3rQ918ZkoEdCAGcUHMJUyMAcsVzZutrBye+NF21gdmmkOZd8gNZakylQEeROEg1ZvBd4l8+pR/R0ugAkEqkanVeGOD35BIhyiWLvtrUyZh2MK81FxfaA8EIa7IfUkGU7FfqWxblueRb/oFG9IBEwCQfEWmwwEMdnz5huJZ0W5j0YUGN9gP4SEv3J/iEsj1OV+xSIQJWSshgDM5pjNesU1C61dUCiH6bE6Jh2ooORntps67oGQ9t6fIyW5BcYICAKXQaBK464zb8nlV4Hg0pR0Y79iLrnj7tMJCa36pMewBEuriA7KQcI8xOiZiB5huZ0Y3AJBJIGATLToZYYgqBTuLju4tISCMA+vD10QisHzHbn8bM2qpmuO224NhCAW6j2yopuo4V7Bbd7T4UW2VYTsb93CialEn/831h7dAgQ9BMG0ejq1hQLK49mewB4E1Qrly7xCgB27CgXl/5/hyK6CEDXHmgXsVSbTMblDo9cJ1KbxmCs1RUqhZOSjtC4zBMGk3MhGu7+WUHgWBTYIpLMx2Qnt1VhkNFCB13LvAWiz0I7JhrXBsmn8026rCAUIBYj44pfkMnnJ2REIoqeCpqJ1S6bUIgiYl6ykIJTZuimxP2fUqJn03QKhy0KzIoXf2I2xYpHMpJB8CgRZbndh+E8EEwRDI6cNoSCwrkPxDAo+TErqWndAKFI/Ic9kUzMSGnFo9g6Duuaa7m8OcNuOpYiNPjfDuBkIslEF0TA3VatodA1B0Knch+iU6bUfHGvx+NBGmD4IB61xbMoByLsphAoL/f5X2yDE/Esznt1ZvFCR7Qg7KkIOQqZzwmuhC2dYRnggQB8E+8GdEmzEO7wKMAKB1LHUreKI+lXUSuu7m+uoE6w5+g7D6hZNdjXRtOY1/3IJAiX+wKX2Fd7QnIIgab+fbiFDG30QukDhkfUhlLXWExBk42tCS5ntuJtrEFbShYAWacIua6lYhowLxOY2c2px0EXQQ6HZe6oxqrB3QUjTAXW+ofEJr3MoTzcDAdpVaRrpK4pZKoO/1yRv4tF3SdKePqKoTgU3QCBAKb0kX8KKmGJ4QxCkHIOQZoSSWjy9JaoPApnFDoSGhdtIaFMwLIy9CkLR02dgbdDnVZzIBhME2uF8zRQNbJpppSVggeC2sPl9ITkKd73OAQQ5AeHoWrimmbb0GAhFi6+xZ9p0ClsvqwgZCIobJukqsPoxEJK9JkwVA7xXXMCwQIDOI0Jro3NjtOrTmHZ4XsKR674UcLMSzaDYz0IObCilxZQImgECcTSWNaxuqQoQ6pU3QVBJIohOJBdaKqOQ89YGvO4ZYBbGgJAr1b6J8lx55AACQyIINggkZUXohqpwRyKwQeg4d+dFQxk9Lvroc+ciCZxreL22/ctDiWDWMx+RCYLhgUCb6WFB/LbX2TfD6YBgEgg46kTTUBR0aWrC4geFShMVwM8QVNlAmg0QcLhbfCmGiXrahs4lWAETBI+Ce7dTKKCMjtfdLbO+qDVpf9UBQQ2kYlNR0J0qd8xZWofckNO+FYst69sqQi3lkBt7rlRkBgguiM4HIauF7XzwIgqFvSqFIxA0D4S2b6kobrYEQi0OOBzQJ5aw3OF87BJ3+aOr6S0kGvosCLRJgi9TYO7skwxVCnkg6FF4EYfadSVrcaj/V2AhryMX5L7QfRWhfB03mHvBbKNmWqtTScQSCDRnRVjnjZ87myC4Xjh0138TBDO5RcO3lO9hOdg+noY44HFAcSOzcOPL1BJBri8MKZNSzdScPRCczabIDHbt2faWBigydFuFqLKd4czm7sVbt0AArjhg+3AIuyL9b3kfBKV2iAoxBHwXCNTTon322F4tBTYImtP8cdAhEGpMAJjioBO/YCTAoHhtTZF2uZgNR7XrTc8AwcSohlhcfsA3QPFb5TY9CTGfXbWWBgKCZGn6dD7ms7gyLHpOiYbaqRYKJeSqCO6pCB0Q1o2PK92R7hrBYyQRfKxs/S5XEpfvLLZf0hpeWa5apixCAQJODfkwimftdijsRzlPSGiKA8ZGqh5vQm0qT00QzNZ1NL1WHwQTt+ztcAtP7XBJmSk5CKlzpl++2B9QyJlHqdWYr1U5eIWD4jaImyXvWyDg9mQDRjV/HUHYU/rhbo3WAQgHLINA7a7KozTv/d6q0qJXLTZyDSOW97r1QdgrXnMNUOrdMQMBv7DVY7v8UBuEQxSl5DjOvbRnuDhZjJ3QzYSnDUWdrA16U0VolYHT++EcGaPZExDMd4JwiCwzJQeBzG5kzopkPEw8SmWnlWZxjh2xLnIn0M6HJXWyXTam2C9rRvt7mXGjF41f1RR8H4SJj7mpMpqhR0nlmz1blVjF1vJu8jZ9sOdoC1U7XLbIjdHxE0OIYZa3LFvxfjcIqukECiCwe+WphmvRdK3yXBwIseZO7GU+uDRm3P6uwVDaXF7axVeG+ZY/AQTZBMEUVQXZ2buX+i8kDD1KtCAEEQfqFge0/PJxZ233yQ22FgICPAMCTEAwPweEbHc+LS+51O/AurtKR0LHowRZuxmRwqm7PrKwM0lavHa/a0zZca6AW8WP0VuyONgJFpSabwIhlu9pgyALENRCut5R7YJoKoLF5jkp+JWZJtuLLBFmW9m/xs/ECq43m2e4tXcknYTPucXvEQjRjwBNECCBIBe97VWbgMoi0845npUcJjXw9/MwQcaSKfcmMxxw3GpBl3uVxKj0D/q8Kv0TQUgNkbx7DG/fqXIZZntX5CPlyC+4hD7uytjn6tNYv59Uw7oB5sZq+G4Qkt4lvXPp3gLWyFGiy4JJ6xPcFsaplsM9FB780qxMse8iIUYfOyCQ/e54E4TKoySyZUEkExZvfw74vqnFXivLfxVLYda31dfrgKATCOo2CGW/U7osqGRVqAcW5fIKcOP4ooE4zSXzffj6GrwQ5XbhBJIJBH0bBNPMC87MkrXsg+NrBhO+5Lg02286YjFFkcryu64EZV8nGZNt4GaTkG7hbb0Tdf6SsTz+xmF8eDm646hqE9Z16WsU6eMdICjY4+CEMzSs8z3ruoe4ceCTh+IdZnDo2SHnR37S1f/PSQKd2uDgdQoU4txa9bt5kZMuoNbQ28rJB2B3E/gcm0cowHrIomva4yAg7HLgCwW7fpYJddfYMh2DeceTFn+ZAxFBIAkpcLtNca8xlNotcKPdOA8Xgqm0/oDQO7QsdkSLZ+p2NRJCNUluE6tVcuVHcr/3QFpQEcTrIfsWjmY53cABLpdC9AIBd2btk6rgvh7641HIVgEpn/JZVDlKJAF+150ISjDH/CXu6PFTVWMNlv9DJNCMEnjM517KchtolhtupNw7YJrNzj/HA4ep8oufEgkmX3/gMTfSL7AjeQ6MobehL6f2xJB+lzeNkOBqgOnbWSjegNQ8e3HLgbPj0+E4dYrjvS7N3M52RraytAk8X4gQ5l/QPtK7Yh9x6K04SK3c5QPRxl94PBtO+GHvdmUguOrysR09PgAe/MbjeGQciyv9FHx8VyZIRoT5rRP6c8w3cSdHo9APd6n62VHDh/Iff0dING7kF88sCz0D58d9LutbxY/8q90KSj+6LLg2gfoyG061F36cEmmFoLivGEtU8NtwenLShhoyKaAOx48SChaEuxIhSFL4ZebRk0i5BifK2vGuQaH+UULhGRBCX/fPCjMq6mYkiVELRtfq/w4EF7XXH01jVKlFATEbXC1S/EFT5xkQjmpb6ecouj6GfgVAWwCp4/eB8PG8DDlw2yW9H80nY+uqNx0AT1uBTpvRqXOgfQv7SFwQ6kvkv4z/dfy47Vf9NQuD8QMeXwliFjbZeuqbiULzuxajmX8gn/xffDXvvSUzFBrXovdNIEB59fJkKAcq7TJonF+7UOrrNM9tnfb/CoSw/91akGfMVfmca/svMaQV37iKskMaaJIWm4tgaP14HOXfVdei9wVOrcpq9IYGFlDQ2r+Pfmud9h8LBOXsKVrSTdlPfqXHpSIHcEJy2pcnGVqTxGzrfRCYbM3LEr0SmkxQys7zr71YV1gf4057cJeRVzQXQgKPtrFdJbNvfdZjEvYGEYTzDuERwF+dnnzeRoVkgOvfbT7B9TjhTyE9qvtXpLe0F/TXIaGc+CCKzI34bP8/CVbiukrE1nS4xvmqAezqL6gwB8kGm6tnTsjTTjnU0cJIaRMuQG5dwwKwLPViNRCZauLQEkBIhkqmnhoJBBMSgLy/8ah2AemAjMjKTtlgnY4wpn9VQFLPEURZKJSea+Lb4916oj9MQ3ACwX6i8DltpYzz34T/oK64mU1qUwEE/yXObAwVd/S5PInzJ+FH2IGAtls7qfJtz7ssVIV+XXJFtZV1b4YkCx9t9/cVYxA8gu4+2l/UF5FF755OClF6KX/L8FzX416izyhR7lG5fsRXuvdVvsu9vDrgF6wMbhmQPvfRF8MGAoLzzAq7z5SUfLNfVchQn9EPKHqe0M0Tn4hve+bYzVUUmJfOfL/upMuXFYcFXdKX35clBiD4ncbSVtlGJ9HsrY19A6MgB8FB5s7X5Lni37j6E5A+gLKDrX1eqrs1uApy5n8Hwb63XRmCquB+Uu71VRCoJvX0MQEE56+VXv1/BXjQSphr+T3i0nB9z1jiRabJqqMqfrjieK6SWKJK2vOPMAADEMAm/CMQd4gTETJqdUcOwvWk4Xz5ikIk1FoA95/+abVrkgGua6uiUweuVHX4DSqC9saZSt9Wh9mt4jQ33u94/beKeJhwJRWWE3Q/JtvQSwv3yTEb47QCwyv5MuyYg6cz3VeNQXAXpPZJ2FYSzcHMVs7Ot6SnnUQyyaP4JV7RAe+YT5T+xMoiWyBInxqvIeoDbkw9Ee7jRDNaRxAubUHbZFSjMSiYOnTMAii/rPtXjOOASSfUqS2NG0A3yZD8qRwqi3GmkrIvQHeZQAkCOd8tE0mlCbWDomYJtjegy7s1Inwfqx3I38ABAUGnkn3KfQn7GwQhmNR9+SJyotr8G1UwHZOpRIz3uSu5Ik2SjFs+ikEQHEk2Zy7mDgjXH0FZqQRLB0ECgZ4fJ38GQjAx2tXxg9UgDPwmiRBAsPNRBVVLxdnbAYHuHwhj4ytDIyTz8WCAkEYFjF9MIBX9LEFQLRB0VbsIjxEIOhWwnYNAtzr4VwvVTs0v0hG0F8LOrguLclAf6YBkIOjcz5bluAhIfgTyx8iSCO7CfYkQQJBfJREEVFErqxLjryDBijfldQSvV4WPT/TrcplX1ackgUvfMO1FFYy2jkCGXqZ8kaQjuOFp6Ag6uTIk1RGQlKgudASodASdxS5aOkICkrwDId+fpu5VoP85DiURjIHLqpfejSLxRfzLGEyqzGrQTs67A6PT1/n2/TpP7bHSakgg2LHX4STzSo6MYLVlVoPHBqAgyxuzFChzQFbYKkXYgJ6v4mVaIOTmi1bEUe6nzi8AQfrPIb0LT1wo5A0SgrMx9yMc/kM72wzDJJbCBBswgRA8R7kfgSr5Jt1BvjIb09R+BEhXjD4H55LyF5T6CMVkdAghQPhJE8cgcVJoGIAQbM3kMrmcXMKRgL8ABDvb0blF0DvdnbOX6MLRRXfiknkWdXTCITWutfcKyQTCZWY5tyRZ3BUVs+jvQNyPwUIrPIv+58vhKJEUKNfuse3JKnkW7Z1Pra4Ewf1rdJcqauRUS4NVjC01l35ogk/e/qR/RRpkCEOTgHIrBCtTb1hDPPDKOetjPVFvUgmFr0zWqthThMYaMhAcL+4kzKS7/9XEfQ1hw587OS1gJv2qaKxBxBJGeazBxZFcVQBFYw01CO5Bzt2u6M6NF0f7y29IgwwOwpR3AXU+Fwm+aSCOmLRDG6FsHIBAZK0pAotQZsLR0tKGxLRjhM8caV9DIxZYRB8LUzY8DgWhuCUkn3sNQuvxyEOY41ekplgPIeSbYa+uyXmLKtBX1YBrwSBbvm1I/qo8IA+aonD9lDuU3I/0NCh2jtugFPpbQLbfwv3ltS+dZhKocHL1kGhk+TRKArltcXGkDQkgVkjMTo7npscLt1Py+C276IyP/KVMHamq/mJHK/UTqlTAPOUoehaPaeZo+5wif64+BYZpqcDcIgQL24lg8k3+ZxKspWB8rAXk5U7Hsh0trT3c+rn9U5S15XmdnNfq58l92ydD/Qs0b9t+/F7aa3nurys0DC4LwJWgiRWe4bFAt4BPDvl/s9fprM3sNz9eKX+P7az8gPDf+ZqjrHu4CNifBQH+bxYeTtT/JR5Y1r7BsrLbf2xVPq/62Dx49SdA6FVn/xx/bCWQVZnADwi/dHvg5/gcW2UKP9/kczx9/AO00S4zdOVjNwAAAABJRU5ErkJggg==\"></h1>\n    <div class=\"marca-by\">by Arte es la Solución</div>\n  </div>\n</header>\n",
  "ui_cambio": "<!DOCTYPE html>\n<html lang=\"es\">\n<head>\n<base target=\"_top\"><meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n<?!= incluir('ui_estilos') ?>\n</head>\n<body>\n<div class=\"envoltura\">\n  <?!= incluir('ui_cabecera') ?>\n  <h2 class=\"titulo-pagina\">Solicitud de cambio de horario</h2>\n\n  <div id=\"avisoGlobal\"></div>\n\n  <div class=\"aviso alerta\">\n    <b>Antes de continuar, lee esto</b>\n    Este formulario es <b>solo</b> para quien tiene un impedimento real y <b>no puede asistir</b> en su horario.\n    Tienes <b>una sola</b> solicitud. <b>No eliges la nueva hora</b>: la asigna producción según disponibilidad.\n    Mientras no te confirmen, tu horario original sigue vigente.\n    <br>Plazo para solicitar: hasta el <b id=\"plazoCambios\">día anterior al evento</b>.\n  </div>\n\n  <div id=\"formulario\">\n    <div class=\"tarjeta\">\n      <h2>Tus datos</h2>\n      <div class=\"campo\">\n        <label for=\"participant_code\">Tu código <span class=\"req\">*</span></label>\n        <input type=\"text\" id=\"participant_code\" placeholder=\"B-001\" autocapitalize=\"characters\">\n        <p class=\"ayuda\">Es el código que recibiste por WhatsApp o correo. Nunca cambia.</p>\n        <div class=\"error\"></div>\n      </div>\n      <div class=\"campo\">\n        <label for=\"full_name\">Nombre completo <span class=\"req\">*</span></label>\n        <input type=\"text\" id=\"full_name\" placeholder=\"Igual que en tu inscripción\">\n        <p class=\"ayuda\">Debe coincidir exactamente con el nombre registrado para ese código.</p>\n        <div class=\"error\"></div>\n      </div>\n      <div class=\"campo\">\n        <label for=\"contact\">WhatsApp de contacto <span class=\"req\">*</span></label>\n        <input type=\"tel\" id=\"contact\" inputmode=\"numeric\" placeholder=\"3001234567\">\n        <div class=\"error\"></div>\n      </div>\n    </div>\n\n    <div class=\"tarjeta\">\n      <h2>Tu impedimento</h2>\n      <label class=\"check\" id=\"campoNoPuede\">\n        <input type=\"checkbox\" id=\"can_attend_original_no\">\n        <span>Confirmo que <b>NO puedo asistir</b> en el horario que me fue asignado.\n          <span class=\"req\">*</span></span>\n      </label>\n      <div class=\"campo\">\n        <label for=\"reason_short\">Motivo (breve) <span class=\"req\">*</span></label>\n        <textarea id=\"reason_short\" maxlength=\"400\" placeholder=\"Ej.: trabajo hasta las 8:00 p. m., cita médica, clase...\"></textarea>\n        <div class=\"error\"></div>\n      </div>\n      <label class=\"check\" id=\"campoAceptacion\">\n        <input type=\"checkbox\" id=\"acceptance\">\n        <span>Entiendo que producción asigna la nueva hora <b>según disponibilidad</b>, que la solicitud\n          puede ser <b>no aprobada</b>, y que el día del evento <b>no hay cambios</b>.\n          <span class=\"req\">*</span></span>\n      </label>\n      <div class=\"trampa\" aria-hidden=\"true\"><label for=\"hp_field\">No completar</label><input type=\"text\" id=\"hp_field\" tabindex=\"-1\" autocomplete=\"off\"></div>\n      <button class=\"boton\" id=\"btnEnviar\" style=\"margin-top:6px\">Enviar solicitud</button>\n    </div>\n  </div>\n\n  <div id=\"resultado\" class=\"oculto\"></div>\n  <div class=\"pie\">Si ya enviaste tu solicitud, espera la respuesta. Enviar de nuevo no la acelera.</div>\n</div>\n\n<?!= incluir('ui_scripts') ?>\n<script>window.ENTORNO = '<?= ENTORNO ?>';</script>\n<script>\ndocument.addEventListener('DOMContentLoaded', function () {\n  var precargado = '<?= codigo ?>';\n  if (precargado) $('#participant_code').value = precargado;\n\n  llamar('config_publica').then(function (c) {\n    if (c.cierre_cambios_texto) $('#plazoCambios').textContent = c.cierre_cambios_texto;\n    if (!c.cambios_abiertos) {\n      $('#formulario').classList.add('oculto');\n      mostrarAviso('#avisoGlobal', 'alerta', 'El plazo de cambios ya cerró',\n        'El día del evento no se hacen cambios ordinarios. Si pierdes tu turno pasas a contingencia.');\n    }\n  }).catch(function () { /* the form still works; the server re-checks */ });\n\n  $('#btnEnviar').addEventListener('click', enviar);\n});\n\nfunction enviar() {\n  $$('.campo,.check').forEach(function (c) { c.classList.remove('malo'); });\n\n  var datos = {\n    participant_code: ($('#participant_code').value || '').trim().toUpperCase(),\n    full_name: ($('#full_name').value || '').trim(),\n    contact: ($('#contact').value || '').trim(),\n    reason_short: ($('#reason_short').value || '').trim(),\n    can_attend_original: false,\n    acceptance: $('#acceptance').checked,\n    hp_field: ($('#hp_field').value || ''),\n    form_elapsed_ms: formElapsedMs(),\n    source: 'web',\n    client_submission_id: idEnvio('cambio')\n  };\n\n  var faltan = [];\n  if (!datos.participant_code) faltan.push('participant_code');\n  if (!datos.full_name) faltan.push('full_name');\n  if (!datos.contact) faltan.push('contact');\n  if (!datos.reason_short) faltan.push('reason_short');\n  if (!$('#can_attend_original_no').checked) faltan.push('campoNoPuede');\n  if (!datos.acceptance) faltan.push('campoAceptacion');\n\n  if (faltan.length) {\n    faltan.forEach(function (id) {\n      var el = $('#' + id);\n      var c = el ? (el.closest('.campo') || el.closest('.check')) : $('#' + id);\n      if (c) c.classList.add('malo');\n    });\n    mostrarAviso('#avisoGlobal', 'error', 'Faltan datos', 'Completa los campos marcados.');\n    return;\n  }\n\n  var boton = $('#btnEnviar');\n  ocupado(boton, true, 'Enviando...');\n  $('#avisoGlobal').innerHTML = '';\n\n  llamar('solicitar_cambio', datos)\n    .then(function (r) {\n      $('#formulario').classList.add('oculto');\n      $('#resultado').classList.remove('oculto');\n      $('#resultado').innerHTML =\n        '<div class=\"aviso ok\"><b>Solicitud registrada</b>' + escaparHtml(r.mensaje) + '</div>' +\n        '<div class=\"tarjeta\"><h2>Número de solicitud</h2>' +\n        '<p class=\"pista\" style=\"margin:0\"><b style=\"font-size:19px\">' + escaparHtml(r.solicitud_id) +\n        '</b><br>Estado: ' + etiquetaEstado(r.estado) + '</p></div>';\n      window.scrollTo({ top: 0, behavior: 'smooth' });\n    })\n    .catch(function (e) {\n      ocupado(boton, false);\n      nuevoIdEnvio('cambio');\n      mostrarAviso('#avisoGlobal', 'error', 'No se pudo registrar', e.message);\n    });\n}\n</script>\n</body>\n</html>\n",
  "ui_checkin": "<!DOCTYPE html>\n<html lang=\"es\">\n<head><base target=\"_top\"><meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n<?!= incluir('ui_estilos') ?></head>\n<body>\n<div class=\"envoltura ancho\">\n  <header class=\"cabecera\">\n    <div class=\"marca\">\n      <h1>CHECK-<span>IN</span></h1>\n      <div class=\"sub\">EL BÚNKER · <?= alias ?></div>\n    </div>\n    <div class=\"datos-evento\" id=\"estadoSync\"></div>\n  </header>\n\n  <div id=\"avisoGlobal\"></div>\n\n  <div class=\"tarjeta\">\n    <h2>Buscar participante</h2>\n    <p class=\"pista\">Por código (B-001), por la cédula del líder o por la cédula de cualquier integrante de una agrupación.\n      Siempre valida con el documento físico.</p>\n    <div class=\"campo\" style=\"margin-bottom:10px\">\n      <input type=\"text\" id=\"busqueda\" placeholder=\"B-001 o 1036448960\" autocomplete=\"off\"\n             autocapitalize=\"characters\" style=\"font-size:20px;padding:15px;text-align:center;letter-spacing:.05em\">\n    </div>\n    <div class=\"rejilla dos\">\n      <button class=\"boton fantasma\" id=\"btnLimpiar\">Limpiar</button>\n      <button class=\"boton\" id=\"btnBuscar\">Buscar</button>\n    </div>\n  </div>\n\n  <div id=\"ficha\"></div>\n\n  <div class=\"tarjeta\">\n    <div class=\"pestanas\">\n      <button class=\"pestana activa\" data-panel=\"lista\">Lista por bloque</button>\n      <button class=\"pestana\" data-panel=\"escena\">Escena</button>\n      <button class=\"pestana\" data-panel=\"pistas\">Pistas</button>\n      <button class=\"pestana\" data-panel=\"contingencia\">Contingencia</button>\n      <button class=\"pestana\" data-panel=\"cola\">Pendientes de sincronizar (<span id=\"nCola\">0</span>)</button>\n    </div>\n\n    <div class=\"panel activo\" id=\"panel-lista\">\n      <div class=\"campo\" style=\"margin-bottom:12px\">\n        <select id=\"filtroBloque\"><option value=\"\">Todos los bloques</option></select>\n      </div>\n      <div class=\"tabla-envoltura\"><table>\n        <thead><tr><th>Código</th><th>Artista</th><th>Modalidad</th><th>Bloque</th><th>Llegada</th><th>Audición</th><th>Estado</th><th></th></tr></thead>\n        <tbody id=\"cuerpoLista\"></tbody>\n      </table></div>\n    </div>\n\n    <div class=\"panel\" id=\"panel-escena\">\n      <p class=\"pista\">Flujo de escena: CHECK-IN → PRECOLA → EN AUDICIÓN → REALIZADA (salida). Aquí ves quién está en precola\n        y quién está en escena ahora.</p>\n      <div id=\"salidaEscena\"></div>\n    </div>\n\n    <div class=\"panel\" id=\"panel-pistas\">\n      <p class=\"pista\">Pistas en orden de agenda para el técnico de audio. Si la pista no llegó o tiene problema, pide la USB de respaldo.</p>\n      <button class=\"boton fantasma chico\" id=\"btnPistas\" style=\"margin-bottom:12px\">Cargar pistas</button>\n      <div id=\"salidaPistas\"></div>\n    </div>\n\n    <div class=\"panel\" id=\"panel-contingencia\">\n      <p class=\"pista\">Orden de llegada a la lista. Solo alcanzan quienes quepan en el tiempo que queda antes del cierre.</p>\n      <button class=\"boton fantasma chico\" id=\"btnPlan\" style=\"margin-bottom:12px\">Calcular plan ahora</button>\n      <div id=\"salidaContingencia\"></div>\n    </div>\n\n    <div class=\"panel\" id=\"panel-cola\">\n      <p class=\"pista\">Operaciones guardadas en este dispositivo que aún no llegaron al servidor.</p>\n      <button class=\"boton chico\" id=\"btnSincronizar\" style=\"margin-bottom:12px\">Sincronizar ahora</button>\n      <div id=\"salidaCola\"></div>\n    </div>\n  </div>\n\n  <div class=\"pie\">Datos en caché de este dispositivo. Tolerancia de llegada: <b><?= cfgNumero('tolerancia_min', 5) ?> min</b> ·\n    Cierre definitivo de audiciones: <b><?= clockText(cfg('cierre_audiciones', '21:00')) ?></b>.</div>\n</div>\n\n<?!= incluir('ui_scripts') ?>\n<script>\nwindow.ENTORNO = '<?= ENTORNO ?>';\nwindow.TOKEN = '<?= token ?>';\nvar BASE_URL = '<?= BASE_URL ?>';\nvar TRANSITIONS = <?!= jsonForScript(TRANSICIONES) ?>;\nvar TOLERANCE_MIN = <?= cfgNumero('tolerancia_min', 5) ?>;\n\nvar CLAVE_ROSTER = 'bunker_roster_v2';\nvar CLAVE_COLA   = 'bunker_cola_v1';\nvar ROSTER = [];\nvar COLA = [];\nvar MODE_LABELS = { SOLISTA: 'Solista', DUO: 'Dúo', AGRUPACION: 'Agrupación' };\nvar STATE_BUTTONS = [\n  ['CHECK-IN', 'Confirmar CHECK-IN'], ['PRECOLA', 'Pasar a PRECOLA'], ['EN AUDICION', 'Sube a escena (EN AUDICIÓN)'],\n  ['REALIZADA', 'Audición REALIZADA (salida)'], ['CONTINGENCIA', 'Pasar a CONTINGENCIA'], ['NO SHOW', 'Marcar NO SHOW']\n];\n\ndocument.addEventListener('DOMContentLoaded', function () {\n  try { localStorage.removeItem('bunker_roster_v1'); } catch (e) { /* old cache shape */ }\n  COLA = leerLocal(CLAVE_COLA, []);\n  ROSTER = leerLocal(CLAVE_ROSTER, []);\n  pintarCola();\n  if (ROSTER.length) { pintarLista(); renderStage(); marcarSync('cache', ROSTER.length + ' en caché local'); }\n\n  vigilarConexion(function () { sincronizar(true); });\n\n  descargarRoster();\n  setInterval(function () { if (navigator.onLine) sincronizar(true); }, 30000);\n\n  $('#btnBuscar').addEventListener('click', buscar);\n  $('#btnLimpiar').addEventListener('click', function () {\n    $('#busqueda').value = ''; $('#ficha').innerHTML = ''; $('#busqueda').focus();\n  });\n  $('#busqueda').addEventListener('keydown', function (ev) { if (ev.key === 'Enter') buscar(); });\n  $('#btnSincronizar').addEventListener('click', function () { sincronizar(false); });\n  $('#btnPlan').addEventListener('click', calcularContingencia);\n  $('#btnPistas').addEventListener('click', loadTracks);\n  $('#filtroBloque').addEventListener('change', pintarLista);\n\n  $$('.pestana').forEach(function (p) {\n    p.addEventListener('click', function () {\n      $$('.pestana').forEach(function (x) { x.classList.remove('activa'); });\n      $$('.panel').forEach(function (x) { x.classList.remove('activo'); });\n      p.classList.add('activa');\n      $('#panel-' + p.dataset.panel).classList.add('activo');\n      if (p.dataset.panel === 'escena') renderStage();\n    });\n  });\n  $('#busqueda').focus();\n});\n\n// --- local storage -----------------------------------------------------------\nfunction leerLocal(k, pd) { try { return JSON.parse(localStorage.getItem(k)) || pd; } catch (e) { return pd; } }\nfunction guardarLocal(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* full */ } }\n\nfunction marcarSync(tipo, texto) {\n  var color = { ok: 'var(--ok)', cache: 'var(--alerta)', error: 'var(--error)' }[tipo] || 'var(--tenue)';\n  $('#estadoSync').innerHTML = '<span class=\"chip\" style=\"border-color:' + color + '\">' + escaparHtml(texto) + '</span>';\n}\n\n// --- roster ------------------------------------------------------------------\nfunction descargarRoster() {\n  if (!navigator.onLine) { marcarSync('cache', 'Sin conexión · usando caché'); return; }\n  llamar('roster_checkin').then(function (r) {\n    ROSTER = r.roster;\n    aplicarColaSobreRoster();\n    guardarLocal(CLAVE_ROSTER, ROSTER);\n    pintarLista();\n    renderStage();\n    llenarBloques();\n    marcarSync('ok', ROSTER.length + ' participantes · ' + r.generado_at.slice(11, 16));\n  }).catch(function (e) {\n    marcarSync('error', 'No se pudo actualizar · usando caché');\n    if (!ROSTER.length) mostrarAviso('#avisoGlobal', 'error', 'Sin datos locales', e.message);\n  });\n}\n\n/** Queued operations win over the server copy until they are confirmed. */\nfunction aplicarColaSobreRoster() {\n  COLA.forEach(function (op) {\n    var p = byCode(op.code);\n    if (p) p.attendance_status = op.estado;\n  });\n}\n\nfunction byCode(code) { return ROSTER.filter(function (x) { return x.code === code; })[0]; }\n\nfunction llenarBloques() {\n  var sel = $('#filtroBloque');\n  var previo = sel.value;\n  var bloques = {};\n  ROSTER.forEach(function (p) { if (p.final_block) bloques[p.final_block] = p.block_label || ('Bloque ' + p.final_block); });\n  sel.innerHTML = '<option value=\"\">Todos los bloques</option>' +\n    Object.keys(bloques).sort(function (a, b) { return a - b; })\n      .map(function (b) { return '<option value=\"' + b + '\">' + escaparHtml(bloques[b]) + '</option>'; }).join('');\n  sel.value = previo;\n}\n\n// --- search ------------------------------------------------------------------\nfunction soloDigitos(v) { return String(v || '').replace(/\\D/g, '').replace(/^0+/, ''); }\n\nfunction buscar() {\n  var q = ($('#busqueda').value || '').trim().toUpperCase();\n  if (!q) return;\n  var wantedCode = /^B-?\\d+$/.test(q) ? 'B-' + ('00' + q.replace(/\\D/g, '')).slice(-3) : '';\n  var doc = soloDigitos(q);\n  var via = '';\n  var p = wantedCode ? byCode(wantedCode) : null;\n  if (p) via = 'código';\n  if (!p && doc) {\n    p = ROSTER.filter(function (x) { return soloDigitos(x.id_number) === doc; })[0];\n    if (p) via = 'cédula del líder';\n  }\n  var matchedMember = null;\n  if (!p && doc) {\n    ROSTER.some(function (x) {\n      var m = (x.members || []).filter(function (m) { return soloDigitos(m.id_number) === doc; })[0];\n      if (m) { p = x; matchedMember = m; via = 'cédula de integrante'; }\n      return !!m;\n    });\n  }\n  if (!p) {\n    $('#ficha').innerHTML = '<div class=\"aviso error\"><b>No encontrado</b>' +\n      'Nadie con cupo tiene el código o documento \"' + escaparHtml(q) + '\". Verifica el dato o consulta con coordinación.</div>';\n    return;\n  }\n  pintarFicha(p, via, matchedMember);\n}\n\nfunction warningsFor(p) {\n  var a = [];\n  var declaredCount = Number(p.members_declared) || 0;\n  if (p.group_code && p.members_authorized < declaredCount) {\n    a.push('Autorizaciones: ' + p.members_authorized + ' de ' + declaredCount + '. Quien no haya autorizado firma la constancia física antes de subir.');\n  }\n  if (!p.consent_image) a.push('NO autoriza uso de imagen/voz: no grabar ni publicar su presentación.');\n  if (p.track_status === 'PISTA PENDIENTE') a.push('La pista no ha llegado: pedir la USB de respaldo.');\n  if (p.track_status === 'PISTA CON PROBLEMA') a.push('La pista tiene un problema reportado: avisar al técnico de audio.');\n  if (p.change_status === 'PENDIENTE') a.push('Tiene una solicitud de cambio de horario sin resolver.');\n  return a;\n}\n\nfunction pintarFicha(p, via, matchedMember) {\n  var ahora = new Date();\n  var hhmm = ('0' + ahora.getHours()).slice(-2) + ':' + ('0' + ahora.getMinutes()).slice(-2);\n  var retraso = minutos(hhmm) - minutos(p.final_time);\n  var avisoHora = '';\n  if (isFinite(retraso) && p.attendance_status === 'CONFIRMADO') {\n    if (retraso > TOLERANCE_MIN) {\n      avisoHora = '<div class=\"aviso error\"><b>' + retraso + ' minutos tarde</b>Supera la tolerancia de ' + TOLERANCE_MIN +\n        ' minutos: pierde el turno y pasa a CONTINGENCIA. Nunca se desplaza a quien llegó puntual.</div>';\n    } else if (retraso > 0) {\n      avisoHora = '<div class=\"aviso alerta\"><b>' + retraso + ' minutos tarde</b>' +\n        'Dentro de la tolerancia. Conserva el turno SOLO si no altera el flujo; lo decide el coordinador.</div>';\n    }\n  }\n  var warnings = warningsFor(p);\n  var allowedStates = TRANSITIONS[p.attendance_status] || [];\n  var memberList = p.members || [];\n\n  $('#ficha').innerHTML =\n    '<div class=\"tarjeta\" style=\"border-color:var(--amarillo)\">' +\n      '<div style=\"display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap\">' +\n        '<div><div style=\"font-size:31px;font-weight:900;letter-spacing:.04em\">' + escaparHtml(p.code) + '</div>' +\n        '<div style=\"font-size:17px;font-weight:700;margin-top:3px\">' + escaparHtml(p.artistic_name || p.full_name) + '</div>' +\n        '<div style=\"color:var(--tenue);font-size:13.5px\">' + escaparHtml(MODE_LABELS[p.participation_mode] || p.participation_mode) +\n          (p.group_code ? ' ' + escaparHtml(p.group_code) + ' · ' + escaparHtml(p.members_declared) + ' en escena' : '') +\n          ' · ' + escaparHtml(p.discipline) + (via ? ' · encontrado por ' + via : '') + '</div></div>' +\n        '<div style=\"text-align:right\">' + etiquetaEstado(p.attendance_status) +\n        '<div style=\"color:var(--tenue);font-size:12.5px;margin-top:6px\">' + escaparHtml(p.block_label || ('Bloque ' + p.final_block)) +\n        '<br>Llegada ' + escaparHtml(p.arrival_time) + ' · Audición <b>' + escaparHtml(p.final_time) + '</b></div></div>' +\n      '</div>' +\n      '<div class=\"aviso info\" style=\"margin-top:14px;font-size:13px\"><b>Valida con el documento físico' + (p.group_code ? ' de cada integrante' : '') + '</b>' +\n        'Líder / titular: ' + escaparHtml(p.full_name) + ' · <b>' + escaparHtml(p.id_number) + '</b>' +\n        (matchedMember ? '<br>Buscaste a: <b>' + escaparHtml(matchedMember.full_name) + '</b> (' + escaparHtml(matchedMember.artistic_role || 'integrante') + ')' : '') +\n        (p.presentation_format ? '<br>Formato: ' + escaparHtml(p.presentation_format_texto || p.presentation_format) : '') +\n        (p.technical_needs ? '<br>Necesidades técnicas: ' + escaparHtml(p.technical_needs) : '') +\n        (p.own_equipment_detail ? '<br>Equipo propio: ' + escaparHtml(p.own_equipment_detail) : '') +\n        (p.song_name ? '<br>Canción: ' + escaparHtml(p.song_name) + ' · ' + escaparHtml(p.track_status || '') : '') +\n      '</div>' +\n      (warnings.length ? '<div class=\"aviso alerta\"><b>Atención</b>' + warnings.map(escaparHtml).join('<br>') + '</div>' : '') +\n      avisoHora +\n      (memberList.length ? '<div class=\"tabla-envoltura\" style=\"margin-bottom:12px\"><table><thead><tr><th>Integrante</th><th>Documento</th><th>Rol</th><th>Autorización</th><th>Firma</th><th>Imagen</th></tr></thead><tbody>' +\n        memberList.map(function (m) {\n          return '<tr' + (matchedMember && m.id_number === matchedMember.id_number ? ' style=\"outline:2px solid var(--amarillo)\"' : '') + '><td>' +\n            escaparHtml(m.full_name) + (m.is_leader ? ' (líder)' : '') + '</td><td>' + escaparHtml(m.id_number) + '</td><td>' +\n            escaparHtml(m.artistic_role) + '</td><td>' + etiquetaEstado(m.member_status) + '</td><td>' + (m.signature ? 'SI' : (m.is_leader ? 'Form. 1' : 'NO')) +\n            '</td><td>' + (m.consent_image ? 'SI' : '<b style=\"color:var(--error)\">NO</b>') + '</td></tr>';\n        }).join('') + '</tbody></table></div>' : '') +\n      (p.group_code ? '<p style=\"margin:0 0 12px\"><a target=\"_blank\" rel=\"noopener\" href=\"' + BASE_URL + '?p=constancia&g=' +\n        encodeURIComponent(p.group_code) + '&t=' + encodeURIComponent(window.TOKEN) + '\">Abrir constancia imprimible (firmas en papel)</a></p>' : '') +\n      '<div class=\"rejilla dos\" style=\"margin-top:8px\">' +\n        STATE_BUTTONS.filter(function (b) { return allowedStates.indexOf(b[0]) !== -1; }).map(function (b, i) {\n          return '<button class=\"' + (i === 0 ? 'boton' : 'boton fantasma') + '\" data-code=\"' + escaparHtml(p.code) +\n                 '\" data-estado=\"' + escaparHtml(b[0]) + '\">' + b[1] + '</button>';\n        }).join('') +\n      '</div>' +\n      (allowedStates.length ? '' : '<p class=\"pista\" style=\"margin:0\">Estado final: no hay más cambios desde esta pantalla.</p>') +\n    '</div>';\n\n  $$('#ficha [data-estado]').forEach(function (b) {\n    b.addEventListener('click', function () { registrarEstado(b.dataset.code, b.dataset.estado); });\n  });\n}\n\nfunction minutos(hhmm) {\n  var m = String(hhmm || '').match(/^(\\d{1,2}):(\\d{2})/);\n  return m ? (+m[1]) * 60 + (+m[2]) : NaN;\n}\n\n// --- state changes (offline-first) -------------------------------------------\nfunction registrarEstado(code, estado) {\n  var op = {\n    accion: 'registrar_estado', code: code, estado: estado,\n    client_op_id: 'OP' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),\n    check_in_time: new Date().toISOString()\n  };\n\n  // Optimistic local update: the desk must never wait for the network.\n  var p = byCode(code);\n  if (p) { p.attendance_status = estado; guardarLocal(CLAVE_ROSTER, ROSTER); pintarFicha(p); }\n\n  COLA.push(op);\n  guardarLocal(CLAVE_COLA, COLA);\n  pintarCola();\n  pintarLista();\n  renderStage();\n\n  if (navigator.onLine) sincronizar(true);\n}\n\nfunction sincronizar(silencioso) {\n  if (!COLA.length) { if (!silencioso) mostrarAviso('#salidaCola', 'ok', 'Nada pendiente', ''); return; }\n  if (!navigator.onLine) { if (!silencioso) mostrarAviso('#salidaCola', 'error', 'Sin conexión', 'Se reintenta solo.'); return; }\n\n  var enviando = COLA.slice();\n  llamar('sincronizar_cola', { cola: JSON.stringify(enviando) })\n    .then(function (r) {\n      var resolvedOps = {};\n      (r.resultados || []).forEach(function (x) { resolvedOps[x.client_op_id] = true; });\n      COLA = COLA.filter(function (op) { return !resolvedOps[op.client_op_id]; });\n      guardarLocal(CLAVE_COLA, COLA);\n      pintarCola();\n\n      var fallidas = (r.resultados || []).filter(function (x) { return x.ok === false; });\n      if (fallidas.length) {\n        $('#salidaCola').innerHTML = '<div class=\"aviso alerta\"><b>' + fallidas.length +\n          ' operaciones rechazadas por el servidor</b>' +\n          fallidas.map(function (f) { return escaparHtml(f.error); }).join('<br>') +\n          '<br>Si el cambio es correcto, pide a coordinación que lo haga con el motivo.</div>';\n      } else if (!silencioso) {\n        mostrarAviso('#salidaCola', 'ok', 'Sincronizado', r.procesadas + ' operaciones aplicadas.');\n      }\n      descargarRoster();\n    })\n    .catch(function (e) {\n      if (!silencioso) mostrarAviso('#salidaCola', 'error', 'No se pudo sincronizar', e.message);\n    });\n}\n\nfunction pintarCola() {\n  $('#nCola').textContent = COLA.length;\n  var barra = $('.conexion');\n  if (barra && COLA.length && navigator.onLine) {\n    barra.className = 'conexion pendiente';\n    barra.textContent = COLA.length + ' operaciones pendientes de sincronizar';\n  } else if (barra && navigator.onLine) {\n    barra.className = 'conexion';\n  }\n  $('#salidaCola').innerHTML = COLA.length\n    ? '<div class=\"tabla-envoltura\"><table><thead><tr><th>Código</th><th>Estado</th><th>Hora</th></tr></thead><tbody>' +\n      COLA.map(function (o) {\n        return '<tr><td><b>' + escaparHtml(o.code) + '</b></td><td>' + etiquetaEstado(o.estado) +\n               '</td><td>' + escaparHtml(String(o.check_in_time).slice(11, 19)) + '</td></tr>';\n      }).join('') + '</tbody></table></div>'\n    : '<div class=\"aviso ok\"><b>Todo sincronizado</b>No hay operaciones pendientes.</div>';\n}\n\nfunction pintarLista() {\n  var filtro = $('#filtroBloque').value;\n  var filas = ROSTER.filter(function (p) { return !filtro || String(p.final_block) === filtro; });\n\n  $('#cuerpoLista').innerHTML = filas.map(function (p) {\n    return '<tr><td><b>' + escaparHtml(p.code) + '</b></td>' +\n      '<td>' + escaparHtml(p.artistic_name || p.full_name) + '</td>' +\n      '<td>' + escaparHtml(MODE_LABELS[p.participation_mode] || '') + (p.group_code ? ' · ' + escaparHtml(p.members_authorized + '/' + p.members_declared) : '') + '</td>' +\n      '<td>' + escaparHtml(p.final_block) + '</td>' +\n      '<td>' + escaparHtml(p.arrival_time) + '</td>' +\n      '<td>' + escaparHtml(p.final_time) + '</td>' +\n      '<td>' + etiquetaEstado(p.attendance_status) + '</td>' +\n      '<td><button class=\"boton chico fantasma\" data-ver=\"' + escaparHtml(p.code) + '\">Abrir</button></td></tr>';\n  }).join('') || '<tr><td colspan=\"8\" style=\"color:var(--tenue)\">Sin participantes en este filtro.</td></tr>';\n  bindOpenButtons('#cuerpoLista');\n}\n\nfunction bindOpenButtons(contenedor) {\n  $$(contenedor + ' [data-ver]').forEach(function (b) {\n    b.addEventListener('click', function () {\n      var p = byCode(b.dataset.ver);\n      if (p) { pintarFicha(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }\n    });\n  });\n}\n\nfunction renderStage() {\n  var stageList = function (estado, title) {\n    var filas = ROSTER.filter(function (p) { return p.attendance_status === estado; });\n    return '<h3 style=\"margin:14px 0 8px\">' + title + ' (' + filas.length + ')</h3>' + (filas.length\n      ? '<div class=\"tabla-envoltura\"><table><tbody>' + filas.map(function (p) {\n          return '<tr><td><b>' + escaparHtml(p.code) + '</b></td><td>' + escaparHtml(p.artistic_name || p.full_name) + '</td><td>' +\n            escaparHtml(p.final_time) + '</td><td>' + escaparHtml(p.song_name || '') + '</td><td><button class=\"boton chico fantasma\" data-ver=\"' +\n            escaparHtml(p.code) + '\">Abrir</button></td></tr>';\n        }).join('') + '</tbody></table></div>'\n      : '<p class=\"pista\" style=\"margin:0\">Nadie.</p>');\n  };\n  $('#salidaEscena').innerHTML = stageList('EN AUDICION', 'En escena') + stageList('PRECOLA', 'En precola') + stageList('CHECK-IN', 'Con check-in, esperando');\n  bindOpenButtons('#salidaEscena');\n}\n\nfunction loadTracks() {\n  var b = $('#btnPistas'); ocupado(b, true, 'Cargando…');\n  llamar('pistas_evento').then(function (r) {\n    ocupado(b, false);\n    $('#salidaPistas').innerHTML = '<div class=\"datos-evento\" style=\"margin-bottom:12px\">' +\n      Object.keys(r.por_estado).map(function (k) { return '<span class=\"chip\">' + escaparHtml(k) + ' <b>' + r.por_estado[k] + '</b></span>'; }).join(' ') +\n      (r.carpeta_audio ? ' <a class=\"chip\" target=\"_blank\" rel=\"noopener\" href=\"' + escaparHtml(r.carpeta_audio) + '\">Carpeta Audio</a>' : '') + '</div>' +\n      '<div class=\"tabla-envoltura\"><table><thead><tr><th>Código</th><th>Hora</th><th>Artista</th><th>Canción</th><th>Estado</th><th>Archivo</th><th>Notas</th></tr></thead><tbody>' +\n      r.pistas.map(function (p) {\n        return '<tr><td><b>' + escaparHtml(p.code || '') + '</b></td><td>' + escaparHtml(p.final_time || '') + '</td><td>' + escaparHtml(p.artistic_name) + '</td>' +\n          '<td>' + escaparHtml(p.song_name || '') + '</td><td>' + etiquetaEstado(p.track_status) + '</td>' +\n          '<td>' + (p.track_file_url ? '<a target=\"_blank\" rel=\"noopener\" href=\"' + escaparHtml(p.track_file_url) + '\">' + escaparHtml(p.track_file_name) + '</a>' : '—') + '</td>' +\n          '<td style=\"white-space:normal;font-size:12px;color:var(--tenue)\">' + escaparHtml(p.needs || '') + '</td></tr>';\n      }).join('') + '</tbody></table></div>';\n  }).catch(function (e) { ocupado(b, false); mostrarAviso('#salidaPistas', 'error', 'Error', e.message); });\n}\n\nfunction calcularContingencia() {\n  var b = $('#btnPlan'); ocupado(b, true, 'Calculando...');\n  llamar('plan_contingencia', {}).then(function (r) {\n    ocupado(b, false);\n    $('#salidaContingencia').innerHTML =\n      '<div class=\"aviso ' + (r.cupos_disponibles ? 'info' : 'alerta') + '\">' +\n      '<b>' + r.cupos_disponibles + ' cupos hasta el cierre (' + escaparHtml(r.cierre) + ')</b>' +\n      r.minutos_disponibles + ' minutos disponibles · ' + r.entran.length + ' alcanzan · ' +\n      r.fuera.length + ' quedarían NO AUDICIONADOS.</div>' +\n      (r.entran.length ? '<div class=\"tabla-envoltura\"><table><thead><tr><th>#</th><th>Código</th><th>Artista</th><th>Hora estimada</th></tr></thead><tbody>' +\n        r.entran.map(function (x) {\n          return '<tr><td>' + x.orden + '</td><td><b>' + escaparHtml(x.code) + '</b></td><td>' +\n            escaparHtml(x.nombre) + '</td><td>' + escaparHtml(x.hora_estimada) + '</td></tr>';\n        }).join('') + '</tbody></table></div>' : '') +\n      (r.fuera.length ? '<p class=\"pista\" style=\"margin-top:12px\">Sin tiempo: ' +\n        r.fuera.map(function (x) { return escaparHtml(x.code); }).join(', ') + '</p>' : '');\n  }).catch(function (e) { ocupado(b, false); mostrarAviso('#salidaContingencia', 'error', 'Error', e.message); });\n}\n</script>\n</body>\n</html>\n",
  "ui_constancia": "<!DOCTYPE html>\n<html lang=\"es\">\n<head><base target=\"_top\"><meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n<style>\n  body{font-family:'Jost','Futura',Arial,sans-serif;color:#1D1D1B;background:#fff;margin:0}\n  .hoja{max-width:820px;margin:0 auto;padding:28px 24px}\n  h1{font-family:'Bebas Neue',Impact,sans-serif;font-weight:400;font-size:34px;letter-spacing:.03em;margin:0}\n  h2{font-family:'Bebas Neue',Impact,sans-serif;font-weight:400;font-size:22px;letter-spacing:.04em;margin:22px 0 8px;border-bottom:2px solid #F7A705}\n  table{width:100%;border-collapse:collapse;font-size:13px}\n  th,td{border:1px solid #9A9A94;padding:7px 8px;text-align:left;vertical-align:middle}\n  th{background:#F2F2EE}\n  td.firma{height:64px;width:210px}\n  td.firma img{max-height:58px;max-width:200px}\n  .meta{font-size:12.5px;color:#4F4F4D}\n  .nota{font-size:12px;color:#4F4F4D;border-left:3px solid #F7A705;padding:6px 10px;margin-top:14px}\n  .acciones{margin:18px 0}\n  button{background:#F7A705;border:0;padding:10px 18px;font-size:15px;cursor:pointer}\n  @media print{.acciones{display:none} .hoja{padding:0}}\n</style>\n<link href=\"https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Jost:wght@400;600&display=swap\" rel=\"stylesheet\">\n</head>\n<body>\n<? var D = constanciaData(grupo); ?>\n<div class=\"hoja\">\n<? if (!D) { ?>\n  <h1>Agrupación no encontrada</h1>\n<? } else { ?>\n  <div class=\"acciones\"><button onclick=\"window.print()\">Imprimir</button></div>\n  <h1>Constancia de aceptación · EL BÚNKER</h1>\n  <p class=\"meta\">Agrupación <b><?= D.group_display_name ?></b> · <?= D.group_code ?> · Código de proyecto <?= D.project_code ?> ·\n    <?= D.participation_mode ?> · <?= D.genre ?><br>\n    Líder / vocero: <?= D.leader_name ?> (documento <?= D.leader_id_number ?>) · Integrantes declarados: <?= D.members_declared ?><br>\n    Términos versión <?= D.terms_version ?> · Política de datos versión <?= D.policy_version ?> · Responsable: <?= D.legal_name ?><br>\n    Generada: <?= D.generated_at ?></p>\n\n  <h2>Integrantes</h2>\n  <table>\n    <thead><tr><th>#</th><th>Nombre completo</th><th>Documento</th><th>Rol</th><th>Estado</th><th>Firma</th></tr></thead>\n    <tbody>\n    <? for (var i = 0; i < D.members.length; i++) { var m = D.members[i]; ?>\n      <tr><td><?= i + 1 ?></td><td><?= m.full_name ?><?= m.is_leader ? ' (líder)' : '' ?></td><td><?= m.id_number ?></td>\n        <td><?= m.artistic_role ?></td><td><?= m.status ?><?= m.consent_image ? '' : ' · sin imagen' ?></td>\n        <td class=\"firma\"><? if (safeSignatureSrc(m.signature)) { ?><img alt=\"Firma\" src=\"<?!= safeSignatureSrc(m.signature) ?>\"><? } else if (m.is_leader) { ?>Aceptación digital (Formulario 1)<? } ?></td></tr>\n    <? } ?>\n    <? for (var j = 0; j < D.blank_lines; j++) { ?>\n      <tr><td><?= D.members.length + j + 1 ?></td><td></td><td></td><td></td><td></td><td class=\"firma\"></td></tr>\n    <? } ?>\n    </tbody>\n  </table>\n  <p class=\"nota\">Las firmas digitales son firma manuscrita digitalizada guardada como evidencia de aceptación; no equivalen a una\n    firma electrónica certificada. Quien no haya autorizado en línea firma en esta hoja, en presencia del equipo de check-in, tras\n    verificar su documento original. Corresponde a los Términos y Condiciones publicados en el sitio de la convocatoria (versión indicada arriba).</p>\n<? } ?>\n</div>\n</body>\n</html>\n",
  "ui_dashboard": "<!DOCTYPE html>\n<html lang=\"es\">\n<head><base target=\"_top\"><meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n<?!= incluir('ui_estilos') ?>\n<style>\n/* Charts: ONE hue for every data mark. Identity comes from the row label, never\n   from colour, so there is no categorical pair that can be confused - which is\n   what the palette validator flagged when states were colour-coded.\n   Mark colour #ffd400 measures 12.4:1 against the chart surface. */\n.viz{--marca:#ffd400;--pista:#232935;--tinta:#eef1f5;--tinta2:#98a2b3}\n.grafico{margin-bottom:8px}\n.grafico h3{font-size:13px;font-weight:800;margin:0 0 3px;letter-spacing:-.01em}\n.grafico .sub{color:var(--tinta2);font-size:12px;margin:0 0 14px}\n\n/* Horizontal bars: label | track+fill | value */\n.fila-barra{display:grid;grid-template-columns:minmax(96px,29%) 1fr auto;gap:11px;\n  align-items:center;padding:4px 0;border-radius:7px}\n.fila-barra:hover{background:rgba(255,255,255,.035)}\n.fila-barra .et{font-size:12.5px;color:var(--tinta);overflow:hidden;\n  text-overflow:ellipsis;white-space:nowrap}\n.fila-barra .pista{background:var(--pista);border-radius:4px;height:16px;position:relative;overflow:hidden}\n.fila-barra .relleno{background:var(--marca);height:100%;border-radius:0 4px 4px 0;\n  min-width:2px;transition:width .45s ease}\n.fila-barra .val{font-size:12.5px;font-weight:800;color:var(--tinta);\n  min-width:34px;text-align:right;font-variant-numeric:tabular-nums}\n.fila-barra .meta{font-size:11px;color:var(--tinta2);min-width:44px;text-align:right}\n\n/* Vertical histogram */\n.histo{display:flex;align-items:flex-end;gap:2px;height:150px;\n  border-bottom:1px solid var(--linea);padding-bottom:0}\n.histo .col{flex:1;display:flex;flex-direction:column;justify-content:flex-end;\n  align-items:center;height:100%;border-radius:6px 6px 0 0;padding:0 1px}\n.histo .col:hover{background:rgba(255,255,255,.04)}\n.histo .col .n{font-size:11.5px;font-weight:800;margin-bottom:5px;font-variant-numeric:tabular-nums}\n.histo .col .b{width:100%;background:var(--marca);border-radius:4px 4px 0 0;min-height:2px;\n  transition:height .45s ease}\n.histo-ejes{display:flex;gap:2px;margin-top:7px}\n.histo-ejes span{flex:1;text-align:center;font-size:10.5px;color:var(--tinta2)}\n\n.vacio{color:var(--tinta2);font-size:12.5px;padding:18px 0;text-align:center;\n  border:1px dashed var(--linea);border-radius:9px}\n.tabla-alterna{margin-top:12px;display:none}\n.tabla-alterna.visible{display:block}\n.enlace-tabla{background:none;border:none;color:var(--tinta2);font-size:11.5px;\n  cursor:pointer;text-decoration:underline;padding:6px 0;font-family:inherit}\n</style></head>\n<body>\n<div class=\"envoltura ancho viz\">\n  <header class=\"cabecera\">\n    <div class=\"marca\"><h1>DASH<span>BOARD</span></h1>\n      <div class=\"sub\">EL BÚNKER · <?= alias ?></div></div>\n    <div class=\"datos-evento\" id=\"cabeceraChips\"></div>\n  </header>\n\n  <div id=\"avisoGlobal\"></div>\n\n  <div class=\"tarjeta\" style=\"border-color:var(--amarillo)\">\n    <div style=\"display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:flex-end\">\n      <div><div style=\"color:var(--tenue);font-size:12px;letter-spacing:.1em\">INDICADOR OPERATIVO · <span id=\"opHora\">—</span></div>\n        <div style=\"font-size:26px;font-weight:900\" id=\"opEtiqueta\">—</div></div>\n      <div style=\"display:flex;gap:8px;align-items:flex-end\">\n        <div class=\"campo\" style=\"margin:0\"><label for=\"horaSimulada\" style=\"font-size:12px\">Simular hora (ensayo)</label>\n          <input type=\"time\" id=\"horaSimulada\" style=\"padding:8px\"></div>\n        <button class=\"boton chico fantasma\" id=\"btnSimular\">Ver</button>\n        <button class=\"boton chico fantasma\" id=\"btnAhora\">Ahora</button>\n      </div>\n    </div>\n    <div class=\"rejilla metricas\" id=\"operativo\" style=\"margin-top:12px\"></div>\n  </div>\n\n  <div class=\"rejilla metricas\" id=\"metricas\" style=\"margin-bottom:18px\"></div>\n\n  <div class=\"tarjeta\">\n    <h2>Avance de la jornada</h2>\n    <div id=\"avanceGlobal\"></div>\n  </div>\n\n  <div class=\"rejilla dos\" style=\"align-items:start\">\n    <div class=\"tarjeta grafico\">\n      <h3>Estado de participantes</h3>\n      <p class=\"sub\">Cada fila lleva su etiqueta: el color no distingue categorías.</p>\n      <div id=\"gEstados\"></div>\n      <button class=\"enlace-tabla\" data-tabla=\"tEstados\">Ver como tabla</button>\n      <div class=\"tabla-alterna\" id=\"tEstados\"></div>\n    </div>\n\n    <div class=\"tarjeta grafico\">\n      <h3>Avance por bloque</h3>\n      <p class=\"sub\">Barra = audiciones realizadas. Cifra gris = participantes asignados al bloque.</p>\n      <div id=\"gBloques\"></div>\n      <button class=\"enlace-tabla\" data-tabla=\"tBloques\">Ver como tabla</button>\n      <div class=\"tabla-alterna\" id=\"tBloques\"></div>\n    </div>\n  </div>\n\n  <div class=\"rejilla dos\" style=\"align-items:start\">\n    <div class=\"tarjeta grafico\">\n      <h3>Distribución de puntajes</h3>\n      <p class=\"sub\">Artistas por rango de puntaje final (0-100).</p>\n      <div id=\"gDistribucion\"></div>\n      <button class=\"enlace-tabla\" data-tabla=\"tDistribucion\">Ver como tabla</button>\n      <div class=\"tabla-alterna\" id=\"tDistribucion\"></div>\n    </div>\n\n    <div class=\"tarjeta grafico\">\n      <h3>Top <span id=\"nTop\">7</span></h3>\n      <p class=\"sub\">Promedio de los jurados válidos, sobre 100.</p>\n      <div id=\"gTop\"></div>\n      <button class=\"enlace-tabla\" data-tabla=\"tTop\">Ver como tabla</button>\n      <div class=\"tabla-alterna\" id=\"tTop\"></div>\n    </div>\n  </div>\n\n  <div class=\"rejilla dos\" style=\"align-items:start\">\n    <div class=\"tarjeta\"><h2>Agrupaciones</h2><div id=\"resGrupos\"></div></div>\n    <div class=\"tarjeta\"><h2>Pistas y videos</h2><div id=\"resPistas\"></div></div>\n  </div>\n\n  <? if (puede(rol, 'resultados')) { ?>\n  <div class=\"tarjeta\">\n    <h2>Resultado consolidado</h2>\n    <p class=\"pista\">El ranking completo no se publica. Esta vista es interna.</p>\n    <button class=\"boton fantasma chico\" id=\"btnResultados\" style=\"margin-bottom:12px\">Calcular resultados</button>\n    <div id=\"salidaResultados\"></div>\n    <? if (puede(rol, 'deliberar')) { ?>\n    <div id=\"formComite\" class=\"oculto\" style=\"margin-top:16px\">\n      <h3 style=\"margin:0 0 8px\">Acta del comité (empate en el corte)</h3>\n      <p class=\"pista\">Solo cuando el desempate automático no resolvió. Escribe el orden decidido de los empatados, de mejor a peor,\n        y el acta: quiénes deliberaron y por qué. Si el empate cambia después, el acta deja de aplicarse sola.</p>\n      <div class=\"campo\"><label for=\"ordenComite\">Orden decidido (códigos separados por coma)</label>\n        <input type=\"text\" id=\"ordenComite\" placeholder=\"B-014, B-052\"></div>\n      <div class=\"campo\"><label for=\"actaComite\">Acta</label><textarea id=\"actaComite\" rows=\"4\" maxlength=\"2000\"></textarea></div>\n      <button class=\"boton\" id=\"btnComite\">Registrar decisión del comité</button>\n      <div id=\"salidaComite\" style=\"margin-top:12px\"></div>\n    </div>\n    <? } ?>\n  </div>\n  <? } ?>\n\n  <? if (puede(rol, 'registro_enmascarado')) { ?>\n  <div class=\"tarjeta\">\n    <h2>Inscritos (datos protegidos)</h2>\n    <p class=\"pista\">Cédula, correo y teléfono enmascarados. Para operar con datos completos se usa el panel de logística.</p>\n    <div class=\"rejilla dos\" style=\"margin-bottom:12px\">\n      <input type=\"text\" id=\"buscarEnm\" placeholder=\"Nombre, código o GRP\">\n      <select id=\"filtroEnm\"><option value=\"TODOS\">Todos</option><option value=\"APTO\">APTO</option><option value=\"REVISION\">REVISIÓN</option>\n        <option value=\"CON_CODIGO\">Con código</option><option value=\"AGRUPACIONES\">Dúos y agrupaciones</option></select>\n    </div>\n    <button class=\"boton fantasma chico\" id=\"btnEnm\" style=\"margin-bottom:12px\">Consultar</button>\n    <div id=\"salidaEnm\"></div>\n  </div>\n  <? } ?>\n\n  <div class=\"pie\">Actualizado <span id=\"sello\">—</span> · se refresca solo cada 60 s</div>\n</div>\n\n<?!= incluir('ui_scripts') ?>\n<script>\nwindow.ENTORNO = '<?= ENTORNO ?>';\nwindow.TOKEN = '<?= token ?>';\nvar SIMULATED_TIME = '';\n\ndocument.addEventListener('DOMContentLoaded', function () {\n  cargar();\n  setInterval(cargar, 60000);\n  if ($('#btnResultados')) $('#btnResultados').addEventListener('click', calcularResultados);\n  if ($('#btnComite')) $('#btnComite').addEventListener('click', recordCommitteeDecision);\n  if ($('#btnEnm')) $('#btnEnm').addEventListener('click', loadMaskedRegistry);\n  $('#btnSimular').addEventListener('click', function () { SIMULATED_TIME = $('#horaSimulada').value; cargar(); });\n  $('#btnAhora').addEventListener('click', function () { SIMULATED_TIME = ''; $('#horaSimulada').value = ''; cargar(); });\n  $$('.enlace-tabla').forEach(function (b) {\n    b.addEventListener('click', function () {\n      var t = $('#' + b.dataset.tabla);\n      t.classList.toggle('visible');\n      b.textContent = t.classList.contains('visible') ? 'Ocultar tabla' : 'Ver como tabla';\n    });\n  });\n});\n\nfunction cargar() {\n  llamar('dashboard', SIMULATED_TIME ? { hora: SIMULATED_TIME } : {}).then(function (r) { pintar(r.metricas); })\n    .catch(function (e) { mostrarAviso('#avisoGlobal', 'error', 'No se pudo cargar', e.message); });\n}\n\nfunction pintar(m) {\n  $('#sello').textContent = new Date().toLocaleTimeString('es-CO');\n\n  $('#cabeceraChips').innerHTML =\n    '<span class=\"chip\">Inscritos <b>' + m.inscritos + '</b></span>' +\n    '<span class=\"chip\">Con código <b>' + m.con_codigo + '</b></span>' +\n    '<span class=\"chip\">Realizadas <b>' + m.realizadas + '</b></span>' +\n    (m.requiere_comite ? '<span class=\"chip\" style=\"border-color:var(--alerta)\">Requiere comité</span>' : '');\n\n  var op = m.operativo;\n  $('#opHora').textContent = op.hora + (SIMULATED_TIME ? ' (simulada)' : '');\n  $('#opEtiqueta').textContent = op.etiqueta;\n  $('#operativo').innerHTML = (op.bloque\n    ? [['Esperados en el bloque', op.esperados, ''], ['Con check-in', op.check_in, ''], ['Realizadas', op.realizadas, 'destacada'],\n       ['No show', op.no_show, op.no_show ? 'destacada' : ''], ['Contingencia (total)', op.contingencia, '']]\n    : [['Fase', op.etiqueta, ''], ['Contingencia (total)', op.contingencia, '']]).map(metricTile).join('');\n\n  $('#metricas').innerHTML = [\n    ['Inscritos', m.inscritos, ''], ['Válidos', m.validos, ''], ['Únicos', m.unicos, ''], ['Duplicados', m.duplicados, ''],\n    ['Aptos', m.aptos, ''], ['En revisión', m.revision, m.revision ? 'destacada' : ''], ['Con código', m.con_codigo, 'destacada'],\n    ['Cupos libres', m.cupos_libres, ''], ['Incompletos', m.incompletos, ''], ['No cumplen', m.no_cumplen, ''],\n    ['Solistas', m.solistas, ''], ['Dúos', m.duos, ''], ['Agrupaciones', m.agrupaciones, ''],\n    ['Horarios asignados', m.horarios, ''], ['Reasignados', m.reasignados, ''],\n    ['Cambios pendientes', m.cambios_pendientes, m.cambios_pendientes ? 'destacada' : ''],\n    ['Check-ins', m.check_ins, ''], ['Precola', m.precola, ''], ['En audición', m.en_audicion, ''],\n    ['Realizadas', m.realizadas, 'destacada'], ['No show', m.no_show, ''], ['Contingencia', m.contingencia, ''],\n    ['No audicionados', m.no_audicionados, ''],\n    ['Promedio global', m.promedio_global === null ? '—' : m.promedio_global, '']\n  ].map(metricTile).join('');\n\n  var g = m.integrantes;\n  $('#resGrupos').innerHTML = '<div class=\"rejilla metricas\">' + [\n    ['Grupos con código', g.grupos_con_codigo, ''], ['Integrantes declarados', g.declarados, ''],\n    ['Autorizados', g.autorizados, 'destacada'], ['Grupos completos', g.grupos_completos, '']].map(metricTile).join('') + '</div>';\n  var chips = function (obj) {\n    var k = Object.keys(obj || {});\n    return k.length ? k.map(function (x) { return '<span class=\"chip\">' + escaparHtml(x) + ' <b>' + obj[x] + '</b></span>'; }).join(' ') : '<span class=\"pista\">Sin datos.</span>';\n  };\n  $('#resPistas').innerHTML = '<p style=\"margin:0 0 6px\"><b>Pistas</b></p><div class=\"datos-evento\">' + chips(m.pistas) + '</div>' +\n    '<p style=\"margin:12px 0 6px\"><b>Videos</b></p><div class=\"datos-evento\">' + chips(m.videos) + '</div>' +\n    '<p style=\"margin:12px 0 6px\"><b>Cambios de horario</b></p><div class=\"datos-evento\">' +\n    chips({ solicitados: m.cambios.solicitados, pendientes: m.cambios.pendientes, aprobados: m.cambios.aprobados, rechazados: m.cambios.rechazados }) + '</div>';\n\n  $('#avanceGlobal').innerHTML =\n    '<div style=\"display:flex;justify-content:space-between;align-items:baseline;gap:12px\">' +\n    '<span style=\"font-size:28px;font-weight:900;color:var(--amarillo)\">' + m.avance + '%</span>' +\n    '<span style=\"color:var(--tenue);font-size:13px\">' + escaparHtml(m.avance_texto) + '</span></div>' +\n    '<div class=\"barra\"><i style=\"width:' + Math.min(100, m.avance) + '%\"></i></div>';\n\n  // --- Chart: participant states (horizontal bars, one hue, row labels) -----\n  var estados = [\n    ['Confirmados', m.confirmados], ['Check-in', m.check_ins], ['Precola', m.precola], ['En audición', m.en_audicion],\n    ['Realizadas', m.realizadas],\n    ['Contingencia', m.contingencia], ['No show', m.no_show], ['No audicionados', m.no_audicionados]\n  ];\n  barras('#gEstados', estados.map(function (e) { return { etiqueta: e[0], valor: e[1] }; }),\n         { sufijo: ' participantes' });\n  tabla('#tEstados', ['Estado', 'Cantidad'], estados);\n\n  // --- Chart: progress per block (bar = done, grey figure = assigned) -------\n  barras('#gBloques', m.por_bloque.map(function (b) {\n    return { etiqueta: b.etiqueta || ('Bloque ' + b.block_id), valor: b.realizadas, meta: b.asignados,\n             titulo: b.ventana + ' · ' + b.realizadas + ' de ' + b.asignados + ' realizadas' };\n  }), { conMeta: true });\n  tabla('#tBloques', ['Bloque', 'Ventana', 'Realizadas', 'Asignados'],\n        m.por_bloque.map(function (b) { return [b.block_id, b.ventana, b.realizadas, b.asignados]; }));\n\n  // --- Chart: score distribution (histogram) -------------------------------\n  histograma('#gDistribucion', m.distribucion);\n  tabla('#tDistribucion', ['Rango', 'Artistas'],\n        m.distribucion.map(function (d) { return [d.etiqueta, d.conteo]; }));\n\n  // --- Chart: Top N --------------------------------------------------------\n  $('#nTop').textContent = m.top_n;\n  if (!m.top.length) {\n    $('#gTop').innerHTML = '<div class=\"vacio\">Aún no hay resultados. Aparecerán cuando el jurado califique.</div>';\n    $('#tTop').innerHTML = '';\n  } else {\n    barras('#gTop', m.top.map(function (t, i) {\n      return { etiqueta: (i + 1) + '. ' + (t.artistic_name || t.code), valor: t.artist_final,\n               titulo: t.code + ' · ' + t.artist_final + '/100' };\n    }), { max: 100, decimales: true, sufijo: '/100' });\n    tabla('#tTop', ['#', 'Código', 'Artista', 'Puntaje'],\n          m.top.map(function (t, i) { return [i + 1, t.code, t.artistic_name, t.artist_final]; }));\n  }\n}\n\nfunction metricTile(x) {\n  return '<div class=\"metrica ' + x[2] + '\"><div class=\"n\">' + escaparHtml(x[1]) + '</div><div class=\"t\">' + escaparHtml(x[0]) + '</div></div>';\n}\n\n/**\n * Horizontal bars. One hue; the row label carries identity, so no legend and no\n * categorical palette is needed. Every bar is directly labelled with its value.\n */\nfunction barras(sel, filas, opciones) {\n  opciones = opciones || {};\n  var valores = filas.map(function (f) { return Number(f.valor) || 0; });\n  var metas = filas.map(function (f) { return Number(f.meta) || 0; });\n  var max = opciones.max || Math.max(1, Math.max.apply(null, valores.concat(metas)));\n\n  $(sel).innerHTML = filas.map(function (f) {\n    var v = Number(f.valor) || 0;\n    var ancho = Math.max(v > 0 ? 1.5 : 0, (v / max) * 100);\n    return '<div class=\"fila-barra\" title=\"' +\n        escaparHtml(f.titulo || (f.etiqueta + ': ' + v + (opciones.sufijo || ''))) + '\">' +\n      '<span class=\"et\">' + escaparHtml(f.etiqueta) + '</span>' +\n      '<span class=\"pista\"><span class=\"relleno\" style=\"width:' + ancho + '%\"></span></span>' +\n      '<span class=\"val\">' + (opciones.decimales ? v : Math.round(v)) + '</span>' +\n      (opciones.conMeta ? '<span class=\"meta\">de ' + (f.meta || 0) + '</span>' : '') +\n    '</div>';\n  }).join('');\n}\n\n/** Vertical histogram for the ordered score bins. */\nfunction histograma(sel, datos) {\n  var max = Math.max(1, Math.max.apply(null, datos.map(function (d) { return d.conteo; })));\n  if (!datos.some(function (d) { return d.conteo > 0; })) {\n    $(sel).innerHTML = '<div class=\"vacio\">Sin puntajes todavía.</div>';\n    return;\n  }\n  $(sel).innerHTML =\n    '<div class=\"histo\">' + datos.map(function (d) {\n      return '<div class=\"col\" title=\"' + escaparHtml(d.etiqueta + ': ' + d.conteo + ' artistas') + '\">' +\n        '<span class=\"n\">' + d.conteo + '</span>' +\n        '<span class=\"b\" style=\"height:' + Math.max(d.conteo ? 3 : 0, (d.conteo / max) * 100) + '%\"></span></div>';\n    }).join('') + '</div>' +\n    '<div class=\"histo-ejes\">' + datos.map(function (d) {\n      return '<span>' + escaparHtml(d.etiqueta) + '</span>';\n    }).join('') + '</div>';\n}\n\n/** Table view of the same numbers - required so identity is never colour-only. */\nfunction tabla(sel, cabeceras, filas) {\n  $(sel).innerHTML = '<div class=\"tabla-envoltura\"><table><thead><tr>' +\n    cabeceras.map(function (c) { return '<th>' + escaparHtml(c) + '</th>'; }).join('') +\n    '</tr></thead><tbody>' + filas.map(function (f) {\n      return '<tr>' + f.map(function (c) { return '<td>' + escaparHtml(c) + '</td>'; }).join('') + '</tr>';\n    }).join('') + '</tbody></table></div>';\n}\n\n/** Performed but not ranked yet (too few juror cards) by name; the ones still to perform only as a count. */\nfunction unrankedNote(r) {\n  var excluded = r.excluidos || [];\n  var missingCards = excluded.filter(function (x) { return x.observacion === 'JURADOS_INSUFICIENTES'; });\n  var toPerform = excluded.filter(function (x) { return x.observacion === 'AUDICION_NO_REALIZADA'; }).length;\n  var lines = missingCards.map(function (x) {\n    return escaparHtml(x.code + ' ' + (x.artistic_name || '')) + ': faltan calificaciones de jurado para entrar al ranking.';\n  });\n  if (toPerform) lines.push(toPerform + (toPerform === 1 ? ' audición todavía no realizada.' : ' audiciones todavía no realizadas.'));\n  if (!lines.length) return r.ranking.length ? '' : '<div class=\"aviso info\" style=\"margin-top:12px\"><b>Sin resultados todavía</b>Aún no hay audiciones calificadas.</div>';\n  return '<div class=\"aviso info\" style=\"margin-top:12px\"><b>Todavía fuera del ranking</b>' + lines.join('<br>') + '</div>';\n}\n\nfunction calcularResultados() {\n  var b = $('#btnResultados'); ocupado(b, true, 'Calculando...');\n  llamar('resultados').then(function (r) {\n    ocupado(b, false);\n    $('#salidaResultados').innerHTML =\n      (r.requiere_comite\n        ? '<div class=\"aviso alerta\"><b>Empate en el corte</b>El desempate automático ' +\n          '(Performance → Talento → Identidad) no resolvió entre: ' +\n          r.empatados.map(function (x) { return escaparHtml(x.code + ' ' + (x.artistic_name || '') + ' (' + x.artist_final + ')'); }).join(', ') +\n          '. Requiere deliberación documentada del comité.</div>'\n        : '') +\n      (r.deliberacion ? '<div class=\"aviso info\"><b>Acta vigente ' + escaparHtml(r.deliberacion.deliberation_id) + '</b>Orden: ' +\n        escaparHtml(r.deliberacion.codes_in_order.join(', ')) + '</div>' : '') +\n      '<div class=\"tabla-envoltura\"><table><thead><tr><th>#</th><th>Código</th><th>Artista</th>' +\n      '<th>Disciplina</th><th>J1</th><th>J2</th><th>J3</th><th>Final</th><th>Sel.</th></tr></thead><tbody>' +\n      r.ranking.map(function (x) {\n        return '<tr' + (String(x.seleccionado).toUpperCase() === 'SI' ? ' style=\"background:rgba(255,212,0,.07)\"' : '') +\n          '><td>' + escaparHtml(x.posicion) + '</td><td><b>' + escaparHtml(x.code) + '</b></td>' +\n          '<td>' + escaparHtml(x.artistic_name) + '</td><td>' + escaparHtml(x.discipline) + '</td>' +\n          '<td>' + escaparHtml(x.jurado_1) + '</td><td>' + escaparHtml(x.jurado_2) + '</td>' +\n          '<td>' + escaparHtml(x.jurado_3) + '</td><td><b>' + escaparHtml(x.artist_final) + '</b></td>' +\n          '<td>' + (String(x.seleccionado).toUpperCase() === 'SI' ? '★' : '') + '</td></tr>';\n      }).join('') + '</tbody></table></div>' +\n      // who is not ranked yet, and why (e.g. fewer juror cards than the minimum)\n      unrankedNote(r);\n    if ($('#formComite')) {\n      $('#formComite').classList.toggle('oculto', !r.requiere_comite);\n      if (r.requiere_comite && !$('#ordenComite').value) $('#ordenComite').value = r.empatados.map(function (x) { return x.code; }).join(', ');\n    }\n  }).catch(function (e) { ocupado(b, false); mostrarAviso('#salidaResultados', 'error', 'Error', e.message); });\n}\n\nfunction recordCommitteeDecision() {\n  if (!confirm('Se registrará el acta y el orden decidido. Reemplaza cualquier acta anterior. ¿Continuar?')) return;\n  var b = $('#btnComite'); ocupado(b, true, 'Registrando…');\n  llamar('registrar_deliberacion', { codes_in_order: $('#ordenComite').value, acta: $('#actaComite').value })\n    .then(function (r) {\n      ocupado(b, false);\n      mostrarAviso('#salidaComite', 'ok', 'Acta ' + r.deliberation_id + ' registrada', 'Orden: ' + r.codes_in_order.join(', '));\n      calcularResultados();\n    }).catch(function (e) { ocupado(b, false); mostrarAviso('#salidaComite', 'error', 'No se pudo registrar', e.message); });\n}\n\nfunction loadMaskedRegistry() {\n  var b = $('#btnEnm'); ocupado(b, true, 'Consultando…');\n  llamar('listar_registro_enmascarado', { q: $('#buscarEnm').value, filtro: $('#filtroEnm').value }).then(function (r) {\n    ocupado(b, false);\n    $('#salidaEnm').innerHTML = '<p class=\"pista\">' + r.mostrados + ' de ' + r.total + '</p>' +\n      '<div class=\"tabla-envoltura\" style=\"max-height:480px;overflow-y:auto\"><table><thead><tr><th>Código</th><th>Nombre</th><th>Modalidad</th>' +\n      '<th>Cédula</th><th>Correo</th><th>WhatsApp</th><th>Género</th><th>Estado</th><th>Bloque</th></tr></thead><tbody>' +\n      r.filas.map(function (f) {\n        return '<tr><td><b>' + escaparHtml(f.code || '—') + '</b></td><td>' + escaparHtml(f.artistic_name || f.full_name) + '</td><td>' +\n          escaparHtml(f.participation_mode) + (f.group_code ? ' ' + escaparHtml(f.group_code) : '') + '</td><td>' + escaparHtml(f.id_number) + '</td><td>' +\n          escaparHtml(f.email) + '</td><td>' + escaparHtml(f.whatsapp) + '</td><td>' + escaparHtml(f.genre_primary) + '</td><td>' +\n          etiquetaEstado(f.eligibility_status) + '</td><td>' + escaparHtml(f.final_block || '') + '</td></tr>';\n      }).join('') + '</tbody></table></div>';\n  }).catch(function (e) { ocupado(b, false); mostrarAviso('#salidaEnm', 'error', 'Error', e.message); });\n}\n</script>\n</body>\n</html>\n",
  "ui_estilos": "<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n<link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\n<link href=\"https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Jost:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Kaushan+Script&display=swap\" rel=\"stylesheet\">\n<style>\n/*\n * EL BUNKER - shared styles. Mobile-first: most participants arrive on a phone.\n * Palette from the organization's identity sheet: black #1D1D1B, white #FFFFFF,\n * amber #F7A705. Type: Bebas Neue (subtitles, stands in for Bebas Kai), Jost\n * (text, Futura-like), Kaushan Script (sparing accent, stands in for Dopestyle).\n * Status colours below are functional (error/ok) and only appear in messages\n * and internal panels, never as brand colours.\n */\n:root{\n  --negro:#1D1D1B; --carbon:#262624; --acero:#31312E; --linea:#484843;\n  --texto:#FFFFFF; --tenue:#C9C9C2; --amarillo:#F7A705; --amarillo-oscuro:#DB9300;\n  --ok:#6FD39A; --alerta:#F7A705; --error:#FF7A6B; --info:#9CC8FF;\n  --radio:4px; --titulo:'Bebas Neue','Arial Narrow',Impact,sans-serif;\n  --cuerpo:'Jost','Futura','Century Gothic',-apple-system,'Segoe UI',Roboto,sans-serif;\n  --acento:'Kaushan Script','Brush Script MT',cursive;\n}\n*{box-sizing:border-box}\nhtml,body{margin:0;padding:0}\nbody{\n  background:var(--negro); color:var(--texto);\n  font-family:var(--cuerpo); font-size:16.5px; line-height:1.55; -webkit-font-smoothing:antialiased;\n}\n.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}\na{color:var(--amarillo)}\n:focus-visible{outline:3px solid var(--amarillo);outline-offset:2px}\n.envoltura{max-width:760px;margin:0 auto;padding:18px 16px 64px}\n.ancho{max-width:1180px}\n\n/* ---- brand header ---- */\n.marca-cabecera{display:flex;align-items:center;gap:16px;padding:10px 0 20px;border-bottom:2px solid var(--amarillo);margin-bottom:24px}\n.marca-logo{width:72px;height:72px;flex-shrink:0}\n.marca-titulo{min-width:0}\n.marca-h1{margin:0;line-height:0}\n.marca-wordmark{width:min(240px,52vw);height:auto;display:block}\n.marca-by{font-family:var(--titulo);letter-spacing:.14em;font-size:15px;color:var(--tenue);margin-top:4px}\n.lema{font-family:var(--acento);color:var(--amarillo);font-size:clamp(26px,7vw,36px);line-height:1.1;margin:0 0 6px}\n.titulo-pagina{font-family:var(--titulo);font-size:clamp(30px,8vw,44px);letter-spacing:.02em;line-height:1;margin:0 0 8px;font-weight:400}\n\n/* legacy header of the internal panels */\n.cabecera{border-bottom:2px solid var(--amarillo);padding-bottom:16px;margin-bottom:24px}\n.marca{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}\n.marca h1{margin:0;font-family:var(--titulo);font-weight:400;font-size:clamp(30px,7vw,44px);letter-spacing:.03em;line-height:1}\n.marca h1 span{color:var(--amarillo)}\n.marca .sub{color:var(--tenue);font-size:13px;text-transform:uppercase;letter-spacing:.14em}\n.datos-evento{margin-top:12px;display:flex;gap:8px;flex-wrap:wrap}\n.chip{background:var(--acero);border:1px solid var(--linea);border-radius:999px;\n  padding:5px 12px;font-size:13px;color:var(--tenue);white-space:nowrap}\n.chip b{color:var(--texto);font-weight:600}\n\n/* ---- event facts as cards, never as a technical string ---- */\n.hechos{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:0 0 22px}\n.hecho{background:var(--carbon);border-left:4px solid var(--amarillo);padding:12px 14px}\n.hecho .k{font-family:var(--titulo);letter-spacing:.12em;color:var(--tenue);font-size:14px}\n.hecho .v{font-family:var(--titulo);font-size:24px;line-height:1.05;letter-spacing:.02em}\n.nowrap{white-space:nowrap}\n\n/* ---- cards & fields ---- */\n.tarjeta{background:var(--carbon);border:1px solid var(--linea);border-radius:var(--radio);\n  padding:22px;margin-bottom:18px}\n.tarjeta h2{margin:0 0 6px;font-family:var(--titulo);font-weight:400;font-size:28px;letter-spacing:.03em;line-height:1.05}\n.tarjeta h2 .n{color:var(--amarillo);margin-right:8px}\n.tarjeta .pista{color:var(--tenue);font-size:14.5px;margin:0 0 16px}\n\n.campo{margin-bottom:18px}\n.campo label,.campo .etiqueta-campo{display:block;font-size:15px;font-weight:600;margin-bottom:7px}\n.campo .ayuda{color:var(--tenue);font-size:13.5px;margin:6px 0 0}\n.req{color:var(--amarillo);margin-left:3px}\ninput[type=text],input[type=email],input[type=tel],input[type=date],input[type=url],\ninput[type=number],input[type=password],select,textarea{\n  width:100%;background:var(--negro);border:1px solid var(--linea);border-radius:var(--radio);\n  color:var(--texto);padding:13px 14px;font-size:16.5px;font-family:inherit;transition:border-color .15s}\ninput::placeholder,textarea::placeholder{color:#8E8E88}\ninput:focus,select:focus,textarea:focus{outline:none;border-color:var(--amarillo);\n  box-shadow:0 0 0 3px rgba(247,167,5,.22)}\ntextarea{min-height:96px;resize:vertical}\nselect{appearance:none;background-image:url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8'><path d='M1 1l5 5 5-5' stroke='%23C9C9C2' stroke-width='2' fill='none'/></svg>\");\n  background-repeat:no-repeat;background-position:right 14px center;padding-right:38px}\n.campo.malo input,.campo.malo select,.campo.malo textarea{border-color:var(--error)}\n.campo .error,.grupo-opciones .error{color:var(--error);font-size:13.5px;margin-top:6px;display:none}\n.campo.malo .error{display:block}\n\n/* radio/checkbox options as big touch targets */\n.opciones{display:grid;gap:8px}\n.opciones.dos{grid-template-columns:1fr 1fr}\n.opciones.tres{grid-template-columns:repeat(3,1fr)}\n.opcion{position:relative;display:flex;align-items:center;gap:10px;background:var(--negro);border:1px solid var(--linea);\n  border-radius:var(--radio);padding:12px 14px;cursor:pointer;min-height:48px;font-size:15.5px}\n.opcion input{accent-color:var(--amarillo);width:19px;height:19px;margin:0;flex-shrink:0}\n.opcion:has(input:checked){border-color:var(--amarillo);background:rgba(247,167,5,.10)}\n.campo.malo .opcion{border-color:var(--error)}\n@media(max-width:420px){.opciones.tres{grid-template-columns:1fr}}\n\n.check{display:flex;gap:12px;align-items:flex-start;background:var(--negro);\n  border:1px solid var(--linea);border-radius:var(--radio);padding:14px;margin-bottom:10px;cursor:pointer}\n.check input{margin:2px 0 0;width:20px;height:20px;accent-color:var(--amarillo);flex-shrink:0;cursor:pointer}\n.check span{font-size:14.5px;line-height:1.5}\n.check a{color:var(--amarillo)}\n.check.malo{border-color:var(--error)}\n.check .error{display:none;color:var(--error);font-size:13px}\n.check.malo .error{display:block}\n\n.condicional{border-left:3px solid var(--amarillo);padding-left:14px;margin:-4px 0 18px}\n\n.boton{display:inline-flex;align-items:center;justify-content:center;gap:8px;\n  background:var(--amarillo);color:var(--negro);border:none;border-radius:var(--radio);padding:15px 22px;\n  font-family:var(--titulo);font-size:22px;letter-spacing:.06em;cursor:pointer;width:100%;\n  transition:transform .08s,background .15s;text-decoration:none}\n.boton:hover:not(:disabled){background:var(--amarillo-oscuro)}\n.boton:active:not(:disabled){transform:translateY(1px)}\n.boton:disabled{opacity:.5;cursor:not-allowed}\n.boton.fantasma{background:transparent;color:var(--texto);border:1px solid var(--linea)}\n.boton.fantasma:hover:not(:disabled){background:var(--acero)}\n.boton.peligro{background:var(--error);color:var(--negro)}\n.boton.chico{width:auto;padding:8px 14px;font-size:16px;border-radius:var(--radio)}\n\n.aviso{border-radius:var(--radio);padding:14px 16px;margin-bottom:16px;font-size:15px;border:1px solid;border-left-width:5px}\n.aviso.ok{background:rgba(111,211,154,.08);border-color:var(--ok)}\n.aviso.error{background:rgba(255,122,107,.08);border-color:var(--error)}\n.aviso.alerta{background:rgba(247,167,5,.08);border-color:var(--amarillo)}\n.aviso.info{background:rgba(255,255,255,.04);border-color:var(--linea)}\n.aviso b{display:block;margin-bottom:4px;font-family:var(--titulo);font-weight:400;font-size:21px;letter-spacing:.04em}\n\n.codigo-grande{font-family:var(--titulo);font-size:52px;letter-spacing:.06em;color:var(--amarillo);line-height:1}\n.copiable{display:flex;gap:8px;align-items:center;background:var(--negro);border:1px dashed var(--linea);padding:10px 12px;\n  border-radius:var(--radio);font-size:14px;word-break:break-all}\n\n/* ---- signature pad ---- */\n.firma{position:relative;background:#FFFFFF;border-radius:var(--radio);touch-action:none}\n.firma canvas{display:block;width:100%;height:180px;border-radius:var(--radio);cursor:crosshair}\n.firma .guia{position:absolute;left:16px;right:16px;bottom:38px;border-bottom:1px solid #9A9A94;pointer-events:none}\n.firma .texto-guia{position:absolute;left:16px;bottom:14px;color:#6B6B66;font-size:12.5px;pointer-events:none}\n\n/* ---- tables & internal panels ---- */\n.tabla-envoltura{overflow-x:auto;-webkit-overflow-scrolling:touch;border:1px solid var(--linea);border-radius:var(--radio)}\ntable{width:100%;border-collapse:collapse;font-size:13.5px;white-space:nowrap}\nth{background:var(--acero);text-align:left;padding:10px 12px;font-weight:600;\n  font-size:12px;text-transform:uppercase;letter-spacing:.07em;color:var(--tenue);\n  position:sticky;top:0;z-index:1}\ntd{padding:9px 12px;border-top:1px solid var(--linea)}\ntr:hover td{background:rgba(255,255,255,.03)}\n\n.etiqueta{display:inline-block;padding:2.5px 9px;border-radius:999px;font-size:11.5px;\n  font-weight:700;letter-spacing:.03em;border:1px solid transparent}\n.e-APTO,.e-REALIZADA,.e-APROBADO,.e-AUTORIZADO,.e-PISTAVALIDADA,.e-ACCESIBLE{background:rgba(111,211,154,.14);color:#8FE3B2}\n.e-INCOMPLETO,.e-REVISION,.e-PENDIENTE,.e-CONTINGENCIA,.e-PISTAPENDIENTE,.e-PISTARECIBIDA,.e-NOVERIFICABLE,.e-PRECOLA{background:rgba(247,167,5,.16);color:#FFC34D}\n.e-NO_CUMPLE,.e-NOCUMPLE,.e-DUPLICADO,.e-RECHAZADO,.e-NOSHOW,.e-NOAUDICIONADO,.e-PISTACONPROBLEMA,.e-NOACCESIBLE{background:rgba(255,122,107,.14);color:#FF9D91}\n.e-CONFIRMADO,.e-SIN_SOLICITUD,.e-NOAPLICA,.e-SINVIDEO{background:rgba(201,201,194,.12);color:var(--tenue)}\n.e-CHECKIN,.e-ENAUDICION{background:rgba(156,200,255,.14);color:#B7D6FF}\n\n.rejilla{display:grid;gap:12px}\n.rejilla.dos{grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}\n.rejilla.metricas{grid-template-columns:repeat(auto-fit,minmax(142px,1fr))}\n.metrica{background:var(--carbon);border:1px solid var(--linea);border-radius:var(--radio);padding:15px}\n.metrica .n{font-family:var(--titulo);font-size:40px;line-height:1;letter-spacing:.02em}\n.metrica .t{color:var(--tenue);font-size:12px;text-transform:uppercase;letter-spacing:.07em;margin-top:7px}\n.metrica.destacada{border-color:var(--amarillo)}\n.metrica.destacada .n{color:var(--amarillo)}\n\n.barra{height:8px;background:var(--acero);border-radius:999px;overflow:hidden;margin-top:9px}\n.barra i{display:block;height:100%;background:var(--amarillo);border-radius:999px;transition:width .4s}\n\n.pestanas{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:18px;border-bottom:1px solid var(--linea);padding-bottom:12px}\n.pestana{background:transparent;border:1px solid var(--linea);color:var(--tenue);\n  border-radius:var(--radio);padding:8px 14px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit}\n.pestana.activa{background:var(--amarillo);border-color:var(--amarillo);color:var(--negro)}\n\n.panel{display:none}\n.panel.activo{display:block}\n\n.cargando{display:inline-block;width:15px;height:15px;border:2px solid rgba(0,0,0,.25);\n  border-top-color:#000;border-radius:50%;animation:girar .7s linear infinite}\n@keyframes girar{to{transform:rotate(360deg)}}\n\n.conexion{position:fixed;bottom:0;left:0;right:0;padding:9px 16px;text-align:center;\n  font-size:13px;font-weight:700;z-index:50;display:none}\n.conexion.sin{display:block;background:var(--error);color:var(--negro)}\n.conexion.pendiente{display:block;background:var(--amarillo);color:var(--negro)}\n\n.pie{margin-top:34px;padding-top:18px;border-top:1px solid var(--linea);\n  color:var(--tenue);font-size:13px;text-align:center;line-height:1.7}\n.pie a{color:var(--tenue)}\n\n.pendiente-dato{color:var(--amarillo);font-weight:700}\n.oculto{display:none !important}\n.trampa{position:absolute !important;left:-9999px !important;width:1px;height:1px;overflow:hidden}\n\n/* Test-environment banner: high contrast and sticky, so a rehearsal screen can\n   never be mistaken for the real call. */\n.banner-pruebas{position:sticky;top:0;z-index:100;background:repeating-linear-gradient(\n  45deg,#F7A705,#F7A705 14px,#1D1D1B 14px,#1D1D1B 28px);\n  color:#fff;padding:0;margin:0 0 14px;overflow:hidden}\n.banner-pruebas span{display:block;background:rgba(29,29,27,.9);margin:5px;\n  padding:9px 14px;font-size:14px;font-weight:700;letter-spacing:.05em;text-align:center}\n.banner-pruebas b{color:var(--amarillo)}\n\n@media(max-width:640px){ .envoltura{padding:14px 13px 72px} .tarjeta{padding:18px} .marca-logo{width:60px;height:60px} }\n@media (prefers-reduced-motion: reduce){ *{transition:none !important;animation:none !important} }\n</style>\n",
  "ui_gracias": "<!DOCTYPE html>\n<html lang=\"es\">\n<head><base target=\"_top\"><meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n<?!= incluir('ui_estilos') ?></head>\n<body>\n<div class=\"envoltura\">\n  <?!= incluir('ui_cabecera') ?>\n  <div class=\"aviso ok\"><b>Listo</b>Recibimos tu información.</div>\n  <div class=\"tarjeta\"><h2>Consulta tu estado</h2>\n    <p class=\"pista\">Para ver tu horario, tu agrupación y enviar tu pista entra a\n      <a href=\"<?= BASE_URL ?>?p=mi-inscripcion\">Mi inscripción</a>. Aquí puedes consultar rápido con tu código.</p>\n    <div class=\"rejilla dos\">\n      <div class=\"campo\"><label for=\"code\">Código</label><input type=\"text\" id=\"code\" placeholder=\"B-001\"></div>\n      <div class=\"campo\"><label for=\"id_number\">Documento</label><input type=\"text\" id=\"id_number\" inputmode=\"numeric\"></div>\n    </div>\n    <button class=\"boton\" id=\"btn\">Consultar</button>\n    <div id=\"salida\" style=\"margin-top:16px\"></div>\n  </div>\n</div>\n<?!= incluir('ui_scripts') ?>\n<script>window.ENTORNO = '<?= ENTORNO ?>';</script>\n<script>\n$('#btn').addEventListener('click', function () {\n  var b = $('#btn'); ocupado(b, true, 'Consultando...');\n  llamar('consultar_estado', { code: $('#code').value.trim(), id_number: $('#id_number').value.trim() })\n    .then(function (r) {\n      ocupado(b, false);\n      $('#salida').innerHTML = '<div class=\"aviso info\"><b>' + escaparHtml(r.code || 'Sin código aún') + '</b>' +\n        'Estado: ' + etiquetaEstado(r.eligibility_status) +\n        (r.hora_audicion ? '<br>Llegada: <b>' + escaparHtml(r.hora_llegada) + '</b> · Audición: <b>' +\n          escaparHtml(r.hora_audicion) + '</b> (bloque ' + escaparHtml(r.bloque) + ')' : '') + '</div>';\n    })\n    .catch(function (e) { ocupado(b, false); mostrarAviso('#salida', 'error', 'No encontrado', e.message); });\n});\n</script>\n</body>\n</html>\n",
  "ui_inscripcion": "<!DOCTYPE html>\n<html lang=\"es\">\n<head>\n<base target=\"_top\">\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n<?!= incluir('ui_estilos') ?>\n</head>\n<body>\n<? var C = accionConfigPublica(); var E = C.evento; ?>\n<div class=\"envoltura\">\n  <?!= incluir('ui_cabecera') ?>\n\n  <p class=\"lema\">Creemos en tu talento.</p>\n  <h2 class=\"titulo-pagina\">Inscripción a la convocatoria</h2>\n  <div class=\"hechos\" aria-label=\"Datos del evento\">\n    <div class=\"hecho\"><div class=\"k\">Fecha</div><div class=\"v\"><?= E.fecha_texto.replace(/ de \\d{4}$/, '') ?></div></div>\n    <div class=\"hecho\"><div class=\"k\">Horario</div><div class=\"v\"><span class=\"nowrap\"><?= E.hora_inicio_texto ?></span> — <span class=\"nowrap\"><?= E.hora_fin_texto ?></span></div></div>\n    <div class=\"hecho\"><div class=\"k\">Lugar</div><div class=\"v\"><?= E.sede ?></div></div>\n    <div class=\"hecho\"><div class=\"k\">Audición</div><div class=\"v\"><?= E.duracion_audicion ?> minutos máximo</div></div>\n  </div>\n\n  <div id=\"avisoGlobal\" role=\"alert\" aria-live=\"polite\"></div>\n\n  <form id=\"formulario\" novalidate>\n    <p class=\"pista\" style=\"color:var(--tenue)\">Los campos con <span class=\"req\">*</span> son obligatorios. Inscríbete\n      <b>una sola vez por proyecto</b>: si hay dos inscripciones con el mismo documento, vale la primera.</p>\n\n    <!-- ===== 1. PROYECTO ===== -->\n    <section class=\"tarjeta\">\n      <h2><span class=\"n\">1</span>Tu proyecto artístico</h2>\n      <p class=\"pista\">Una agrupación cuenta como <b>una sola inscripción</b>, aunque tenga varios integrantes.</p>\n\n      <div class=\"campo\" id=\"campoModalidad\">\n        <span class=\"etiqueta-campo\" id=\"lblModalidad\">Modalidad de participación <span class=\"req\">*</span></span>\n        <div class=\"opciones tres\" role=\"radiogroup\" aria-labelledby=\"lblModalidad\">\n          <label class=\"opcion\"><input type=\"radio\" name=\"participation_mode\" value=\"SOLISTA\"> Solista</label>\n          <label class=\"opcion\"><input type=\"radio\" name=\"participation_mode\" value=\"DUO\"> Dúo</label>\n          <label class=\"opcion\"><input type=\"radio\" name=\"participation_mode\" value=\"AGRUPACION\"> Agrupación</label>\n        </div>\n        <input type=\"hidden\" id=\"participation_mode\">\n        <div class=\"error\"></div>\n      </div>\n\n      <div class=\"campo\">\n        <label for=\"artistic_name\" id=\"lblNombreArtistico\">Nombre artístico</label>\n        <input type=\"text\" id=\"artistic_name\" maxlength=\"80\" autocomplete=\"off\" placeholder=\"Como quieres que te presenten\">\n        <p class=\"ayuda\" id=\"ayudaNombreArtistico\">Si no tienes, déjalo vacío.</p>\n        <div class=\"error\"></div>\n      </div>\n\n      <div class=\"campo oculto\" id=\"campoIntegrantes\">\n        <label for=\"members_declared\">Número de integrantes en escena <span class=\"req\">*</span></label>\n        <input type=\"number\" id=\"members_declared\" min=\"2\" max=\"<?= E.integrantes_max ?>\" inputmode=\"numeric\">\n        <p class=\"ayuda\">Tú cuentas como integrante. Después de inscribirte recibirás un enlace para que <b>cada integrante</b>\n          dé su propia autorización: tú no puedes autorizar por otra persona.</p>\n        <div class=\"error\"></div>\n      </div>\n\n      <div class=\"rejilla dos\">\n        <div class=\"campo\">\n          <label for=\"genre_primary\">Género / propuesta principal <span class=\"req\">*</span></label>\n          <input type=\"text\" id=\"genre_primary\" list=\"generos\" maxlength=\"60\" placeholder=\"Ej.: urbano, rock, salsa, rap\">\n          <div class=\"error\"></div>\n        </div>\n        <div class=\"campo\">\n          <label for=\"genre_secondary\">Género secundario <span style=\"color:var(--tenue);font-weight:400\">(opcional)</span></label>\n          <input type=\"text\" id=\"genre_secondary\" list=\"generos\" maxlength=\"60\">\n        </div>\n      </div>\n      <datalist id=\"generos\">\n        <option>Pop</option><option>Urbano</option><option>Reguetón</option><option>Rap / Hip hop</option>\n        <option>Trap</option><option>R&amp;B / Soul</option><option>Rock</option><option>Metal</option>\n        <option>Salsa</option><option>Tropical</option><option>Música popular</option><option>Regional mexicana</option>\n        <option>Vallenato</option><option>Balada</option><option>Folclor / Andina</option><option>Electrónica / DJ</option>\n        <option>Jazz / Blues</option><option>Fusión</option><option>Freestyle</option><option>Instrumental</option>\n        <option>Danza</option><option>Performance</option>\n      </datalist>\n\n      <div class=\"campo\">\n        <label for=\"audition_description\">Breve descripción de tu propuesta <span class=\"req\">*</span></label>\n        <textarea id=\"audition_description\" maxlength=\"600\" placeholder=\"Qué vas a presentar y qué te hace diferente (máximo 600 caracteres).\"></textarea>\n        <div class=\"error\"></div>\n      </div>\n    </section>\n\n    <!-- ===== 2. DATOS ===== -->\n    <section class=\"tarjeta\">\n      <h2><span class=\"n\">2</span><span id=\"tituloDatos\">Tus datos</span></h2>\n      <p class=\"pista\" id=\"pistaDatos\">Los verificamos con tu documento original el día de la audición.</p>\n\n      <div class=\"campo\">\n        <label for=\"full_name\">Nombre completo <span class=\"req\">*</span></label>\n        <input type=\"text\" id=\"full_name\" autocomplete=\"name\" maxlength=\"120\" placeholder=\"Como aparece en tu documento\">\n        <div class=\"error\"></div>\n      </div>\n      <div class=\"rejilla dos\">\n        <div class=\"campo\">\n          <label for=\"id_number\">Número de cédula <span class=\"req\">*</span></label>\n          <input type=\"text\" id=\"id_number\" inputmode=\"numeric\" autocomplete=\"off\" maxlength=\"15\" placeholder=\"Sin puntos ni comas\">\n          <div class=\"error\"></div>\n        </div>\n        <div class=\"campo\">\n          <label for=\"birth_date\">Fecha de nacimiento <span class=\"req\">*</span></label>\n          <input type=\"date\" id=\"birth_date\" max=\"<?= E.fecha ?>\">\n          <p class=\"ayuda\" id=\"ayudaEdad\">Debes tener entre <?= E.edad_minima ?> y <?= E.edad_maxima ?> años cumplidos el <?= E.fecha_texto ?>.</p>\n          <div class=\"error\"></div>\n        </div>\n      </div>\n      <label class=\"check\" id=\"campoMayoria\">\n        <input type=\"checkbox\" id=\"adult_confirmation\">\n        <span>Confirmo que soy <b>mayor de edad</b> y que los datos que entrego son verdaderos. <span class=\"req\">*</span>\n          <span class=\"error\"></span></span>\n      </label>\n\n      <div class=\"campo\">\n        <label for=\"neighborhood_sector\">Barrio, sector o vereda <span class=\"req\">*</span></label>\n        <input type=\"text\" id=\"neighborhood_sector\" maxlength=\"80\" placeholder=\"Ej.: La Doctora, Betania, San Joaquín\">\n        <div class=\"error\"></div>\n      </div>\n      <div class=\"campo\" id=\"campoResidencia\">\n        <span class=\"etiqueta-campo\" id=\"lblResidencia\">¿Resides actualmente en <?= E.municipio ?>? <span class=\"req\">*</span></span>\n        <div class=\"opciones dos\" role=\"radiogroup\" aria-labelledby=\"lblResidencia\">\n          <label class=\"opcion\"><input type=\"radio\" name=\"resides_in_sabaneta\" value=\"SI\"> Sí</label>\n          <label class=\"opcion\"><input type=\"radio\" name=\"resides_in_sabaneta\" value=\"NO\"> No</label>\n        </div>\n        <input type=\"hidden\" id=\"resides_in_sabaneta\">\n        <p class=\"ayuda oculto\" id=\"avisoResidencia\" style=\"color:var(--amarillo)\">La convocatoria es exclusiva para personas que residen en <?= E.municipio ?>.</p>\n        <div class=\"error\"></div>\n      </div>\n\n      <div class=\"rejilla dos\">\n        <div class=\"campo\">\n          <label for=\"email\">Correo electrónico <span class=\"req\">*</span></label>\n          <input type=\"email\" id=\"email\" autocomplete=\"email\" maxlength=\"120\" placeholder=\"tucorreo@ejemplo.com\">\n          <p class=\"ayuda oculto\" id=\"sugerenciaCorreo\"></p>\n          <div class=\"error\"></div>\n        </div>\n        <div class=\"campo\">\n          <label for=\"whatsapp\">WhatsApp <span class=\"req\">*</span></label>\n          <input type=\"tel\" id=\"whatsapp\" inputmode=\"numeric\" autocomplete=\"tel\" maxlength=\"16\" placeholder=\"3001234567\">\n          <p class=\"ayuda\">10 dígitos, empieza por 3. Por aquí te enviaremos tu código y tu horario.</p>\n          <div class=\"error\"></div>\n        </div>\n      </div>\n    </section>\n\n    <!-- ===== 3. PRESENTACIÓN ===== -->\n    <section class=\"tarjeta\">\n      <h2><span class=\"n\">3</span>Tu presentación</h2>\n      <p class=\"pista\">Para que el equipo técnico sepa qué verá y qué necesitarás.</p>\n\n      <div class=\"campo\" id=\"campoFormato\">\n        <span class=\"etiqueta-campo\" id=\"lblFormato\">¿Cómo realizarás tu presentación? <span class=\"req\">*</span></span>\n        <div class=\"opciones\" role=\"radiogroup\" aria-labelledby=\"lblFormato\">\n          <label class=\"opcion\"><input type=\"radio\" name=\"presentation_format\" value=\"VOZ_PISTA\"> Voz sobre pista / backing track</label>\n          <label class=\"opcion\"><input type=\"radio\" name=\"presentation_format\" value=\"VOZ_INSTRUMENTO\"> Voz + instrumento en vivo</label>\n          <label class=\"opcion\"><input type=\"radio\" name=\"presentation_format\" value=\"INSTRUMENTAL\"> Instrumento / instrumental</label>\n          <label class=\"opcion\"><input type=\"radio\" name=\"presentation_format\" value=\"DJ_SET\"> DJ / set</label>\n          <label class=\"opcion\"><input type=\"radio\" name=\"presentation_format\" value=\"FREESTYLE_PERFORMANCE\"> Freestyle / performance</label>\n          <label class=\"opcion\"><input type=\"radio\" name=\"presentation_format\" value=\"OTRA\"> Otra</label>\n        </div>\n        <input type=\"hidden\" id=\"presentation_format\">\n        <div class=\"error\"></div>\n      </div>\n      <div class=\"campo condicional oculto\" id=\"campoFormatoOtro\">\n        <label for=\"presentation_other\">¿Cuál? <span class=\"req\">*</span></label>\n        <input type=\"text\" id=\"presentation_other\" maxlength=\"120\">\n        <div class=\"error\"></div>\n      </div>\n\n      <div class=\"campo\">\n        <span class=\"etiqueta-campo\">¿Qué vas a necesitar para tu presentación?</span>\n        <div class=\"opciones dos\">\n          <label class=\"opcion\"><input type=\"checkbox\" name=\"needs\" value=\"MICROFONO\"> Micrófono</label>\n          <label class=\"opcion\"><input type=\"checkbox\" name=\"needs\" value=\"GUITARRA\"> Guitarra</label>\n          <label class=\"opcion\"><input type=\"checkbox\" name=\"needs\" value=\"INSTRUMENTO_PROPIO\"> Instrumento propio</label>\n          <label class=\"opcion\"><input type=\"checkbox\" name=\"needs\" value=\"PISTA\"> Reproducir una pista</label>\n          <label class=\"opcion\"><input type=\"checkbox\" name=\"needs\" value=\"ADAPTADOR_CABLE\"> Adaptador / cable</label>\n          <label class=\"opcion\"><input type=\"checkbox\" name=\"needs\" value=\"ATRIL\"> Atril</label>\n          <label class=\"opcion\"><input type=\"checkbox\" name=\"needs\" value=\"OTRO\" id=\"needsOtro\"> Otro</label>\n        </div>\n        <p class=\"ayuda\">La organización confirmará qué elementos habrá en el lugar; no des por hecho equipos que no estén confirmados.</p>\n      </div>\n      <div class=\"campo condicional oculto\" id=\"campoNecesidadOtra\">\n        <label for=\"needs_other\">¿Qué más necesitas?</label>\n        <input type=\"text\" id=\"needs_other\" maxlength=\"160\">\n      </div>\n\n      <div class=\"campo\" id=\"campoEquipo\">\n        <span class=\"etiqueta-campo\" id=\"lblEquipo\">¿Llevarás algún instrumento o equipo propio? <span class=\"req\">*</span></span>\n        <div class=\"opciones dos\" role=\"radiogroup\" aria-labelledby=\"lblEquipo\">\n          <label class=\"opcion\"><input type=\"radio\" name=\"own_equipment\" value=\"SI\"> Sí</label>\n          <label class=\"opcion\"><input type=\"radio\" name=\"own_equipment\" value=\"NO\"> No</label>\n        </div>\n        <input type=\"hidden\" id=\"own_equipment\">\n        <div class=\"error\"></div>\n      </div>\n      <div class=\"campo condicional oculto\" id=\"campoEquipoDetalle\">\n        <label for=\"own_equipment_detail\">¿Cuál? <span class=\"req\">*</span></label>\n        <input type=\"text\" id=\"own_equipment_detail\" maxlength=\"160\" placeholder=\"Ej.: guitarra acústica, controlador DJ\">\n        <div class=\"error\"></div>\n      </div>\n\n      <div class=\"campo\">\n        <label for=\"song_name\">Nombre de la canción o repertorio que presentarás <span style=\"color:var(--tenue);font-weight:400\">(si aplica)</span></label>\n        <input type=\"text\" id=\"song_name\" maxlength=\"120\">\n      </div>\n    </section>\n\n    <!-- ===== 4. PISTA ===== -->\n    <section class=\"tarjeta\">\n      <h2><span class=\"n\">4</span>Pista / backing track</h2>\n      <div class=\"campo\" id=\"campoPista\">\n        <span class=\"etiqueta-campo\" id=\"lblPista\">¿Utilizarás pista / backing track? <span class=\"req\">*</span></span>\n        <div class=\"opciones dos\" role=\"radiogroup\" aria-labelledby=\"lblPista\">\n          <label class=\"opcion\"><input type=\"radio\" name=\"track_uses\" value=\"SI\"> Sí</label>\n          <label class=\"opcion\"><input type=\"radio\" name=\"track_uses\" value=\"NO\"> No</label>\n        </div>\n        <input type=\"hidden\" id=\"track_uses\">\n        <div class=\"error\"></div>\n      </div>\n      <div class=\"campo condicional oculto\" id=\"campoMetodoPista\">\n        <span class=\"etiqueta-campo\" id=\"lblMetodo\">¿Cómo la entregarás? <span class=\"req\">*</span></span>\n        <div class=\"opciones\" role=\"radiogroup\" aria-labelledby=\"lblMetodo\">\n          <label class=\"opcion\"><input type=\"radio\" name=\"track_method\" value=\"ARCHIVO\"> Archivo digital antes del evento (recomendado)</label>\n          <label class=\"opcion\"><input type=\"radio\" name=\"track_method\" value=\"USB\"> USB el día del evento</label>\n          <label class=\"opcion\"><input type=\"radio\" name=\"track_method\" value=\"WHATSAPP\"> WhatsApp al canal oficial, después de recibir mi código</label>\n          <label class=\"opcion\"><input type=\"radio\" name=\"track_method\" value=\"OTRO\"> Otro</label>\n        </div>\n        <input type=\"hidden\" id=\"track_method\">\n        <div class=\"error\"></div>\n        <div class=\"campo oculto\" id=\"campoMetodoOtro\" style=\"margin-top:10px\">\n          <label for=\"track_method_other\">¿Cuál? <span class=\"req\">*</span></label>\n          <input type=\"text\" id=\"track_method_other\" maxlength=\"120\">\n          <div class=\"error\"></div>\n        </div>\n        <p class=\"ayuda\">No tienes que enviarla ahora: la pista se entrega <b>después de recibir tu código B-XXX</b>, desde\n          \"Mi inscripción\". El día del evento lleva también una copia en USB. Bluetooth no es el método principal.</p>\n      </div>\n    </section>\n\n    <!-- ===== 5. VIDEO ===== -->\n    <section class=\"tarjeta\">\n      <h2><span class=\"n\">5</span>Video o muestra artística</h2>\n      <div class=\"campo\">\n        <label for=\"video_url\">Enlace a video o muestra artística<?!= C.formularios.exigir_video ? ' <span class=\"req\">*</span>' : ' <span style=\"color:var(--tenue);font-weight:400\">(recomendado)</span>' ?></label>\n        <input type=\"url\" id=\"video_url\" maxlength=\"400\" placeholder=\"https://...\">\n        <p class=\"ayuda\">YouTube (puede ser no listado), Google Drive compartido como \"Cualquier persona con el enlace\", Vimeo u otra URL.\n          Comprobamos que el jurado pueda abrirlo.</p>\n        <p class=\"ayuda\" id=\"estadoVideo\" aria-live=\"polite\"></p>\n        <div class=\"error\"></div>\n      </div>\n    </section>\n\n    <!-- ===== 6. DISPONIBILIDAD Y AUTORIZACIONES ===== -->\n    <section class=\"tarjeta\">\n      <h2><span class=\"n\">6</span>Disponibilidad y autorizaciones</h2>\n      <label class=\"check\" id=\"campoDisponibilidad\">\n        <input type=\"checkbox\" id=\"availability_statement\">\n        <span>Declaro que tengo disponibilidad para participar durante la jornada general de EL BÚNKER y acepto el horario\n          asignado por la organización. <span class=\"req\">*</span><span class=\"error\"></span></span>\n      </label>\n\n      <div class=\"aviso info\" style=\"font-size:14px\">\n        Lee los documentos antes de marcar:\n        <a href=\"<?= C.legal.terms_url ?>\" target=\"_blank\" rel=\"noopener\">Términos y condiciones</a> ·\n        <a href=\"<?= C.legal.privacy_policy_url ?>\" target=\"_blank\" rel=\"noopener\">Política de tratamiento de datos</a>.\n        Cada casilla es independiente y guardamos la versión del texto que aceptas.\n      </div>\n\n      <label class=\"check\" id=\"campoTerminos\">\n        <input type=\"checkbox\" id=\"accept_terms\">\n        <span>Acepto los <b>Términos y Condiciones</b>. <span class=\"req\">*</span><span class=\"error\"></span></span>\n      </label>\n      <label class=\"check\" id=\"campoDatos\">\n        <input type=\"checkbox\" id=\"accept_data_processing\">\n        <span>Autorizo el <b>tratamiento de mis datos personales</b> según la política de tratamiento de datos. <span class=\"req\">*</span><span class=\"error\"></span></span>\n      </label>\n      <label class=\"check\">\n        <input type=\"checkbox\" id=\"accept_whatsapp_operational\">\n        <span>Autorizo <b>comunicaciones operativas por WhatsApp</b> (código, horario, recordatorios y novedades).</span>\n      </label>\n      <label class=\"check\">\n        <input type=\"checkbox\" id=\"accept_image_voice\">\n        <span>Autorizo el <b>uso de mi imagen, voz y registros audiovisuales</b> en los términos del documento.</span>\n      </label>\n      <p class=\"ayuda oculto\" id=\"notaGrupoAutorizaciones\" style=\"color:var(--tenue)\">Estas autorizaciones son solo tuyas. Cada integrante\n        de tu agrupación dará las suyas con el enlace que recibirás al terminar.</p>\n\n      <div class=\"trampa\" aria-hidden=\"true\">\n        <label for=\"hp_field\">No completar</label><input type=\"text\" id=\"hp_field\" tabindex=\"-1\" autocomplete=\"off\">\n      </div>\n\n      <div class=\"aviso alerta\" style=\"font-size:14px;margin-top:14px\">\n        Inscribirte no garantiza selección, contratación ni presentación.\n      </div>\n      <button type=\"submit\" class=\"boton\" id=\"btnEnviar\">Enviar mi inscripción</button>\n    </section>\n  </form>\n\n  <div id=\"resultado\" class=\"oculto\" aria-live=\"polite\"></div>\n\n  <footer class=\"pie\">\n    Responsable del tratamiento: <?= C.legal.legal_name ?> · NIT <?= C.legal.nit ?><br>\n    Datos personales y reclamos: <?= C.legal.data_protection_email ?> · <?= C.legal.institutional_phone ?><br>\n    <span style=\"opacity:.75\">Términos <?= C.legal.terms_version ?> · Política <?= C.legal.policy_version ?> · Formulario <?= C.legal.consent_version ?></span>\n  </footer>\n</div>\n\n<?!= incluir('ui_scripts') ?>\n<script><?!= sharedClientCode() ?></script>\n<script>\nwindow.ENTORNO = '<?= ENTORNO ?>';\nvar CONFIG = <?!= jsonForScript(C) ?>;\nvar BASE_URL = '<?= BASE_URL ?>';\n\ndocument.addEventListener('DOMContentLoaded', function () {\n  if (!CONFIG.abierto) {\n    $('#formulario').classList.add('oculto');\n    mostrarAviso('#avisoGlobal', 'alerta', 'Inscripciones cerradas', 'La convocatoria ya no está recibiendo inscripciones.');\n    return;\n  }\n  // Radio groups mirror their value into a hidden input so validation can treat them like any field.\n  ['participation_mode', 'resides_in_sabaneta', 'presentation_format', 'own_equipment', 'track_uses', 'track_method']\n    .forEach(function (name) {\n      $$('input[name=\"' + name + '\"]').forEach(function (r) {\n        r.addEventListener('change', function () { $('#' + name).value = radioValue(name); updateConditionalFields(); });\n      });\n    });\n  $('#needsOtro').addEventListener('change', updateConditionalFields);\n  $('#birth_date').addEventListener('change', showAgeHint);\n  $('#email').addEventListener('blur', suggestEmailFix);\n  $('#video_url').addEventListener('blur', checkVideoLink);\n  $('#formulario').addEventListener('submit', function (e) { e.preventDefault(); enviar(); });\n  updateConditionalFields();\n});\n\nfunction updateConditionalFields() {\n  var mode = radioValue('participation_mode');\n  var group = mode === 'DUO' || mode === 'AGRUPACION';\n  $('#campoIntegrantes').classList.toggle('oculto', !group);\n  if (mode === 'DUO') { $('#members_declared').value = 2; $('#members_declared').readOnly = true; }\n  else { $('#members_declared').readOnly = false; if (mode === 'AGRUPACION' && Number($('#members_declared').value) < 3) $('#members_declared').value = ''; }\n  $('#lblNombreArtistico').innerHTML = group ? 'Nombre artístico de la ' + (mode === 'DUO' ? 'dupla' : 'agrupación') + ' <span class=\"req\">*</span>' : 'Nombre artístico';\n  $('#ayudaNombreArtistico').textContent = group ? 'Escríbelo como quieren que aparezca. No lo corregimos.' : 'Si no tienes, déjalo vacío.';\n  $('#tituloDatos').textContent = group ? 'Tus datos (líder o vocero)' : 'Tus datos';\n  $('#pistaDatos').textContent = group\n    ? 'Eres la persona de contacto del proyecto. Los datos de los demás integrantes se registran aparte, con su propia autorización.'\n    : 'Los verificamos con tu documento original el día de la audición.';\n  $('#notaGrupoAutorizaciones').classList.toggle('oculto', !group);\n\n  $('#avisoResidencia').classList.toggle('oculto', radioValue('resides_in_sabaneta') !== 'NO');\n  $('#campoFormatoOtro').classList.toggle('oculto', radioValue('presentation_format') !== 'OTRA');\n  $('#campoNecesidadOtra').classList.toggle('oculto', !$('#needsOtro').checked);\n  $('#campoEquipoDetalle').classList.toggle('oculto', radioValue('own_equipment') !== 'SI');\n  $('#campoMetodoPista').classList.toggle('oculto', radioValue('track_uses') !== 'SI');\n  $('#campoMetodoOtro').classList.toggle('oculto', radioValue('track_method') !== 'OTRO');\n}\n\nfunction ageOn(fechaNac, fechaRef) {\n  var n = String(fechaNac).split('-').map(Number), r = String(fechaRef).split('-').map(Number);\n  if (n.length !== 3 || r.length !== 3 || !n[0]) return null;\n  var e = r[0] - n[0];\n  if (r[1] < n[1] || (r[1] === n[1] && r[2] < n[2])) e--;\n  return e;\n}\n\nfunction showAgeHint() {\n  var e = ageOn($('#birth_date').value, CONFIG.evento.fecha);\n  var hint = $('#ayudaEdad');\n  if (e === null) return;\n  var ok = e >= CONFIG.evento.edad_minima && e <= CONFIG.evento.edad_maxima;\n  hint.innerHTML = 'Tendrás <b>' + e + ' años</b> el ' + escaparHtml(CONFIG.evento.fecha_texto) + '. ' +\n    (ok ? 'Cumples el rango de edad.' : '<span style=\"color:var(--amarillo)\">La convocatoria es para personas de ' +\n     CONFIG.evento.edad_minima + ' a ' + CONFIG.evento.edad_maxima + ' años.</span>');\n}\n\nfunction suggestEmailFix() {\n  var s = suggestEmailDomain($('#email').value);\n  var p = $('#sugerenciaCorreo');\n  if (!s) { p.classList.add('oculto'); return; }\n  p.classList.remove('oculto');\n  p.innerHTML = '¿Quisiste decir <b>' + escaparHtml(s) + '</b>? <button type=\"button\" class=\"boton chico fantasma\" id=\"usarSugerencia\">Usar</button>';\n  $('#usarSugerencia').addEventListener('click', function () { $('#email').value = s; p.classList.add('oculto'); });\n}\n\nvar lastVideoUrl = '';\nfunction checkVideoLink() {\n  var url = $('#video_url').value.trim();\n  var state = $('#estadoVideo');\n  if (!url || url === lastVideoUrl) { if (!url) state.textContent = ''; return; }\n  lastVideoUrl = url;\n  state.innerHTML = '<span style=\"color:var(--tenue)\">Comprobando que el enlace se pueda abrir…</span>';\n  llamar('verificar_video', { video_url: url }).then(function (r) {\n    var color = r.status === 'ACCESIBLE' ? 'var(--ok)' : (r.status === 'NO ACCESIBLE' ? 'var(--error)' : 'var(--amarillo)');\n    var title = { 'ACCESIBLE': '✓ El jurado podrá abrir este enlace.', 'NO ACCESIBLE': '✗ No se puede abrir sin permisos.',\n                   'NO VERIFICABLE': 'No podemos comprobarlo automáticamente: lo revisará una persona.',\n                   'PENDIENTE': 'Lo revisaremos después de tu envío.' }[r.status] || '';\n    state.innerHTML = '<span style=\"color:' + color + '\">' + title + '</span> ' + escaparHtml(r.detail || '');\n  }).catch(function () { state.textContent = ''; });\n}\n\nvar REQUIRED_FIELDS = [\n  ['participation_mode', 'Elige la modalidad.'], ['genre_primary', 'Escribe tu género o propuesta principal.'],\n  ['audition_description', 'Cuéntanos brevemente tu propuesta.'], ['full_name', 'Escribe tu nombre completo.'],\n  ['id_number', 'Escribe tu número de cédula.'], ['birth_date', 'Indica tu fecha de nacimiento.'],\n  ['neighborhood_sector', 'Escribe tu barrio, sector o vereda.'], ['resides_in_sabaneta', 'Responde si resides en el municipio.'],\n  ['email', 'Escribe tu correo.'], ['whatsapp', 'Escribe tu WhatsApp.'],\n  ['presentation_format', 'Elige cómo será tu presentación.'], ['own_equipment', 'Responde si llevarás equipo propio.'],\n  ['track_uses', 'Responde si usarás pista.']\n];\nvar REQUIRED_CHECKBOXES = [\n  ['adult_confirmation', 'Debes confirmar que eres mayor de edad.'],\n  ['availability_statement', 'Debes aceptar la declaración de disponibilidad.'],\n  ['accept_terms', 'Debes aceptar los términos y condiciones.'],\n  ['accept_data_processing', 'Debes autorizar el tratamiento de datos.']\n];\n\nfunction recolectar() {\n  var d = {};\n  ['participation_mode', 'artistic_name', 'members_declared', 'genre_primary', 'genre_secondary', 'audition_description',\n   'full_name', 'id_number', 'birth_date', 'neighborhood_sector', 'resides_in_sabaneta', 'email', 'whatsapp',\n   'presentation_format', 'presentation_other', 'needs_other', 'own_equipment', 'own_equipment_detail', 'song_name',\n   'track_uses', 'track_method', 'track_method_other', 'video_url', 'hp_field']\n    .forEach(function (id) { d[id] = ($('#' + id).value || '').trim(); });\n  d.needs = checkedValues('needs');\n  ['adult_confirmation', 'availability_statement', 'accept_terms', 'accept_data_processing',\n   'accept_whatsapp_operational', 'accept_image_voice'].forEach(function (id) { d[id] = $('#' + id).checked; });\n  d.client_submission_id = idEnvio('inscripcion');\n  d.form_elapsed_ms = formElapsedMs();\n  d.source = 'web';\n  return d;\n}\n\n/** Client-side check only to fail fast; the server always validates again. */\nfunction validacionRapida(d) {\n  var errores = [];\n  REQUIRED_FIELDS.forEach(function (p) { if (!d[p[0]]) errores.push(p); });\n  REQUIRED_CHECKBOXES.forEach(function (p) { if (!d[p[0]]) errores.push(p); });\n  var group = d.participation_mode === 'DUO' || d.participation_mode === 'AGRUPACION';\n  if (group && !d.artistic_name) errores.push(['artistic_name', 'Escribe el nombre artístico de la agrupación.']);\n  if (group && !d.members_declared) errores.push(['members_declared', 'Indica cuántos integrantes estarán en escena.']);\n  if (d.presentation_format === 'OTRA' && !d.presentation_other) errores.push(['presentation_other', 'Describe tu presentación.']);\n  if (d.own_equipment === 'SI' && !d.own_equipment_detail) errores.push(['own_equipment_detail', 'Cuéntanos qué equipo llevarás.']);\n  if (d.track_uses === 'SI' && !d.track_method) errores.push(['track_method', 'Indica cómo entregarás la pista.']);\n  if (d.track_method === 'OTRO' && !d.track_method_other) errores.push(['track_method_other', 'Describe el método.']);\n  if (CONFIG.formularios.exigir_video && !d.video_url) errores.push(['video_url', 'El enlace de video es obligatorio.']);\n  if (d.whatsapp && !/^3\\d{9}$/.test(d.whatsapp.replace(/\\D/g, '').slice(-10))) errores.push(['whatsapp', 'Debe ser un celular de 10 dígitos que empiece por 3.']);\n  if (d.id_number && !/^\\d{6,10}$/.test(d.id_number.replace(/\\D/g, '').replace(/^0+/, ''))) errores.push(['id_number', 'La cédula debe tener entre 6 y 10 dígitos.']);\n  errores.forEach(function (p) { markError(p[0], p[1]); });\n  return errores;\n}\n\nfunction limpiarErrores() {\n  $$('.campo, .check').forEach(function (c) { c.classList.remove('malo'); });\n}\n\nfunction enviar() {\n  limpiarErrores();\n  var datos = recolectar();\n  var errores = validacionRapida(datos);\n  if (errores.length) {\n    mostrarAviso('#avisoGlobal', 'error', 'Revisa el formulario', 'Hay ' + errores.length + ' campo(s) por completar o corregir, marcados en rojo.');\n    return;\n  }\n  var boton = $('#btnEnviar');\n  ocupado(boton, true, 'Enviando…');\n  $('#avisoGlobal').innerHTML = '';\n  llamar('inscribir', datos)\n    .then(mostrarResultado)\n    .catch(function (e) {\n      ocupado(boton, false);\n      mostrarAviso('#avisoGlobal', 'error', 'No pudimos enviar tu inscripción',\n        e.message + ' — Si vuelves a intentarlo no se creará un registro duplicado.');\n    });\n}\n\nfunction officialNumberBlockHtml(r) {\n  if (!r.whatsapp_oficial) return '';\n  var n = r.whatsapp_oficial, nombre = r.whatsapp_nombre;\n  return '<section class=\"tarjeta\" style=\"border-color:var(--amarillo)\">' +\n    '<h2>Guarda nuestro número</h2>' +\n    '<p style=\"margin:0 0 12px\">Para recibir información de tu audición por WhatsApp, guarda este número como: <b>' + escaparHtml(nombre) + '</b>.</p>' +\n    '<div class=\"codigo-grande\" style=\"font-size:40px\">' + escaparHtml(n.replace(/(\\d{3})(\\d{3})(\\d{4})/, '$1 $2 $3')) + '</div>' +\n    '<p class=\"pista\" style=\"margin:10px 0 14px\">Desde este número recibirás tu código, horario, recordatorios y novedades de la convocatoria. ' +\n    'Si no lo guardas, puede que no te lleguen los mensajes de difusión.</p>' +\n    '<div class=\"rejilla dos\"><button type=\"button\" class=\"boton\" id=\"btnGuardarContacto\">Guardar contacto</button>' +\n    '<a class=\"boton fantasma\" href=\"https://wa.me/57' + encodeURIComponent(n) + '\" target=\"_blank\" rel=\"noopener\">Abrir WhatsApp</a></div></section>';\n}\n\nfunction groupBlockHtml(r) {\n  if (!r.group_code) return '';\n  var texto = 'Hola, soy parte de ' + ($('#artistic_name').value || 'la agrupación') + ' en EL BÚNKER. ' +\n    'Cada integrante debe dar su propia autorización aquí: ' + r.members_link;\n  return '<section class=\"tarjeta\" style=\"border-color:var(--amarillo)\">' +\n    '<h2>Tu agrupación: ' + escaparHtml(r.group_code) + '</h2>' +\n    '<p style=\"margin:0 0 10px\">Clave de la agrupación: <b style=\"letter-spacing:.12em\">' + escaparHtml(r.group_key) + '</b></p>' +\n    '<p class=\"pista\">Comparte este enlace con cada integrante. <b>Cada uno</b> debe completar su autorización individual y firmar: ' +\n    'tú no puedes autorizar por otra persona.</p>' +\n    '<div class=\"copiable\" id=\"enlaceGrupo\">' + escaparHtml(r.members_link) + '</div>' +\n    '<div class=\"rejilla dos\" style=\"margin-top:12px\">' +\n    '<button type=\"button\" class=\"boton fantasma\" id=\"btnCopiarGrupo\">Copiar enlace</button>' +\n    '<a class=\"boton\" href=\"https://wa.me/?text=' + encodeURIComponent(texto) + '\" target=\"_blank\" rel=\"noopener\">Enviar por WhatsApp</a></div></section>';\n}\n\nfunction mostrarResultado(r) {\n  var tipo = { APTO: 'ok', DUPLICADO: 'alerta', REVISION: 'alerta', INCOMPLETO: 'error', NO_CUMPLE: 'error' }[r.eligibility_status] || 'info';\n\n  if (r.eligibility_status === 'INCOMPLETO') {\n    ocupado($('#btnEnviar'), false);\n    nuevoIdEnvio('inscripcion');\n    var lista = (r.errores || []).map(function (e) { return '• ' + escaparHtml(e.mensaje); }).join('<br>');\n    $('#avisoGlobal').innerHTML = '<div class=\"aviso error\"><b>Faltan datos</b>' + lista + '</div>';\n    (r.errores || []).forEach(function (e) { markError(e.campo, e.mensaje); });\n    window.scrollTo({ top: 0, behavior: 'smooth' });\n    return;\n  }\n\n  $('#formulario').classList.add('oculto');\n  var caja = $('#resultado');\n  caja.classList.remove('oculto');\n  var titles = { APTO: 'Inscripción recibida', REVISION: 'Inscripción recibida (en revisión)', DUPLICADO: 'Ya estabas inscrito',\n                  NO_CUMPLE: 'No cumples los requisitos' };\n  var html = '<div class=\"aviso ' + tipo + '\"><b>' + escaparHtml(titles[r.eligibility_status] || r.eligibility_status) + '</b>' +\n    escaparHtml(r.mensaje) + '</div>';\n\n  if (r.eligibility_status === 'APTO' || r.eligibility_status === 'REVISION') {\n    html += officialNumberBlockHtml(r) + groupBlockHtml(r) +\n      '<section class=\"tarjeta\"><h2>Tu comprobante</h2>' +\n      '<div class=\"codigo-grande\" style=\"font-size:34px\">' + escaparHtml(r.submission_id) + '</div>' +\n      '<p class=\"pista\" style=\"margin:10px 0 0\">Guárdalo. Con tu cédula y este comprobante puedes consultar tu inscripción en ' +\n      '<a href=\"' + escaparHtml(r.mi_inscripcion_link) + '\">Mi inscripción</a>.</p></section>' +\n      '<section class=\"tarjeta\"><h2>¿Y ahora qué?</h2><p class=\"pista\" style=\"margin:0\">' +\n      '1. La organización revisa las inscripciones y asigna los ' + CONFIG.evento.cupo + ' cupos en orden de inscripción entre quienes cumplen.<br>' +\n      '2. Si quedas dentro recibes tu <b>código B-XXX</b> y tu <b>horario</b> por WhatsApp.<br>' +\n      '3. Los recordatorios y las indicaciones del día te llegan por WhatsApp desde el número oficial de la convocatoria.<br>' +\n      '4. Si usas pista, la envías desde \"Mi inscripción\" cuando tengas tu código.<br>' +\n      '5. El día del evento llega 15 minutos antes de tu bloque con tu <b>documento original</b>.</p></section>';\n  }\n  caja.innerHTML = html;\n  if ($('#btnGuardarContacto')) $('#btnGuardarContacto').addEventListener('click', function () { downloadContact(r.whatsapp_oficial, r.whatsapp_nombre); });\n  if ($('#btnCopiarGrupo')) $('#btnCopiarGrupo').addEventListener('click', function () { copyText(r.members_link, $('#btnCopiarGrupo')); });\n  window.scrollTo({ top: 0, behavior: 'smooth' });\n}\n</script>\n</body>\n</html>\n",
  "ui_integrantes": "<!DOCTYPE html>\n<html lang=\"es\">\n<head>\n<base target=\"_top\">\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n<?!= incluir('ui_estilos') ?>\n</head>\n<body>\n<? var C = accionConfigPublica(); var E = C.evento; ?>\n<div class=\"envoltura\">\n  <?!= incluir('ui_cabecera') ?>\n\n  <h2 class=\"titulo-pagina\">Integrantes de agrupación</h2>\n  <p style=\"color:var(--tenue);margin-top:0\">Cada integrante da <b>su propia autorización</b>. El líder de la agrupación no\n    puede autorizar por otras personas. Tus datos se usan para verificar tu identidad y registrar tu aceptación.</p>\n\n  <div id=\"avisoGlobal\" role=\"alert\" aria-live=\"polite\"></div>\n\n  <!-- Step 1: which group -->\n  <section class=\"tarjeta\" id=\"pasoGrupo\">\n    <h2><span class=\"n\">1</span>Tu agrupación</h2>\n    <div class=\"rejilla dos\">\n      <div class=\"campo\">\n        <label for=\"group_code\">Código de agrupación <span class=\"req\">*</span></label>\n        <input type=\"text\" id=\"group_code\" autocomplete=\"off\" placeholder=\"GRP-001\" value=\"<?= grupo ?>\">\n        <div class=\"error\"></div>\n      </div>\n      <div class=\"campo\">\n        <label for=\"group_key\">Clave de la agrupación <span class=\"req\">*</span></label>\n        <input type=\"text\" id=\"group_key\" autocomplete=\"off\" placeholder=\"6 caracteres\" value=\"<?= clave ?>\">\n        <p class=\"ayuda\">Viene en el enlace que te compartió tu líder.</p>\n        <div class=\"error\"></div>\n      </div>\n    </div>\n    <button type=\"button\" class=\"boton\" id=\"btnBuscarGrupo\">Continuar</button>\n  </section>\n\n  <div id=\"resumenGrupo\"></div>\n\n  <!-- Step 2: the member's own data and authorization -->\n  <form id=\"formulario\" class=\"oculto\" novalidate>\n    <section class=\"tarjeta\">\n      <h2><span class=\"n\">2</span>Tus datos</h2>\n      <div class=\"campo\">\n        <label for=\"full_name\">Nombre completo <span class=\"req\">*</span></label>\n        <input type=\"text\" id=\"full_name\" autocomplete=\"name\" maxlength=\"120\" placeholder=\"Como aparece en tu documento\">\n        <div class=\"error\"></div>\n      </div>\n      <div class=\"rejilla dos\">\n        <div class=\"campo\">\n          <label for=\"id_number\">Número de documento <span class=\"req\">*</span></label>\n          <input type=\"text\" id=\"id_number\" inputmode=\"numeric\" maxlength=\"15\" autocomplete=\"off\">\n          <div class=\"error\"></div>\n        </div>\n        <div class=\"campo\">\n          <label for=\"birth_date\">Fecha de nacimiento <span class=\"req\">*</span></label>\n          <input type=\"date\" id=\"birth_date\" max=\"<?= E.fecha ?>\">\n          <div class=\"error\"></div>\n        </div>\n      </div>\n      <div class=\"campo\">\n        <label for=\"artistic_role\">Rol artístico <span class=\"req\">*</span></label>\n        <input type=\"text\" id=\"artistic_role\" list=\"roles\" maxlength=\"60\" placeholder=\"Ej.: voz, guitarra, baile, DJ\">\n        <datalist id=\"roles\"><option>Voz</option><option>Coros</option><option>Guitarra</option><option>Bajo</option>\n          <option>Batería</option><option>Teclado</option><option>Percusión</option><option>DJ</option><option>Baile</option></datalist>\n        <div class=\"error\"></div>\n      </div>\n      <label class=\"check\" id=\"campoMayoria\">\n        <input type=\"checkbox\" id=\"adult_confirmation\">\n        <span>Confirmo que soy <b>mayor de edad</b> y que mis datos son verdaderos. <span class=\"req\">*</span><span class=\"error\"></span></span>\n      </label>\n    </section>\n\n    <section class=\"tarjeta\">\n      <h2><span class=\"n\">3</span>Tu autorización individual</h2>\n      <div class=\"aviso info\" style=\"font-size:14px\">\n        Lee antes de marcar:\n        <a href=\"<?= C.legal.terms_url ?>\" target=\"_blank\" rel=\"noopener\">Términos y condiciones</a> ·\n        <a href=\"<?= C.legal.privacy_policy_url ?>\" target=\"_blank\" rel=\"noopener\">Política de tratamiento de datos</a>.\n      </div>\n      <label class=\"check\" id=\"campoTerminos\">\n        <input type=\"checkbox\" id=\"accept_terms\">\n        <span>Acepto los <b>Términos y Condiciones</b>. <span class=\"req\">*</span><span class=\"error\"></span></span>\n      </label>\n      <label class=\"check\" id=\"campoDatos\">\n        <input type=\"checkbox\" id=\"accept_data_processing\">\n        <span>Autorizo el <b>tratamiento de mis datos personales</b>. <span class=\"req\">*</span><span class=\"error\"></span></span>\n      </label>\n      <label class=\"check\">\n        <input type=\"checkbox\" id=\"accept_image_voice\">\n        <span>Autorizo el <b>uso de mi imagen, voz y registros audiovisuales</b>.</span>\n      </label>\n\n      <div class=\"campo<?= C.formularios.firma_integrantes ? '' : ' oculto' ?>\" id=\"campoFirma\" style=\"margin-top:14px\">\n        <span class=\"etiqueta-campo\">Tu firma <span class=\"req\">*</span></span>\n        <div class=\"firma\"><canvas id=\"lienzoFirma\" aria-label=\"Espacio para firmar con el dedo o el mouse\"></canvas>\n          <div class=\"guia\"></div><div class=\"texto-guia\">Firma aquí con el dedo o el mouse</div></div>\n        <div style=\"display:flex;justify-content:space-between;gap:10px;margin-top:8px;align-items:center\">\n          <p class=\"ayuda\" style=\"margin:0\">Se guarda como evidencia de tu aceptación (firma manuscrita digitalizada). No es una\n            firma electrónica certificada.</p>\n          <button type=\"button\" class=\"boton chico fantasma\" id=\"btnLimpiarFirma\">Borrar</button>\n        </div>\n        <div class=\"error\"></div>\n      </div>\n\n      <div class=\"trampa\" aria-hidden=\"true\"><label for=\"hp_field\">No completar</label><input type=\"text\" id=\"hp_field\" tabindex=\"-1\" autocomplete=\"off\"></div>\n      <button type=\"submit\" class=\"boton\" id=\"btnEnviar\" style=\"margin-top:8px\">Registrar mi autorización</button>\n    </section>\n  </form>\n\n  <div id=\"resultado\" class=\"oculto\" aria-live=\"polite\"></div>\n\n  <footer class=\"pie\">\n    Responsable del tratamiento: <?= C.legal.legal_name ?> · NIT <?= C.legal.nit ?><br>\n    Datos personales y reclamos: <?= C.legal.data_protection_email ?> · <?= C.legal.institutional_phone ?><br>\n    <span style=\"opacity:.75\">Términos <?= C.legal.terms_version ?> · Política <?= C.legal.policy_version ?></span>\n  </footer>\n</div>\n\n<?!= incluir('ui_scripts') ?>\n<script>\nwindow.ENTORNO = '<?= ENTORNO ?>';\nvar CONFIG = <?!= jsonForScript(C) ?>;\nvar GROUP = null;\nvar SIGNATURE_PAD = null;\n\ndocument.addEventListener('DOMContentLoaded', function () {\n  if (!CONFIG.integrantes_abierto) {\n    $('#pasoGrupo').classList.add('oculto');\n    mostrarAviso('#avisoGlobal', 'alerta', 'Registro cerrado', 'El registro de integrantes ya está cerrado.');\n    return;\n  }\n  $('#btnBuscarGrupo').addEventListener('click', findGroup);\n  $('#formulario').addEventListener('submit', function (e) { e.preventDefault(); submitMember(); });\n  $('#btnLimpiarFirma').addEventListener('click', function () { if (SIGNATURE_PAD) SIGNATURE_PAD.clear(); });\n  if ($('#group_code').value && $('#group_key').value) findGroup();\n});\n\nfunction findGroup() {\n  $$('.campo').forEach(function (c) { c.classList.remove('malo'); });\n  var code = $('#group_code').value.trim().toUpperCase();\n  var key = $('#group_key').value.trim().toUpperCase();\n  if (!code) { markError('group_code', 'Escribe el código de agrupación.'); return; }\n  if (!key) { markError('group_key', 'Escribe la clave.'); return; }\n  var b = $('#btnBuscarGrupo');\n  ocupado(b, true, 'Buscando…');\n  llamar('consultar_agrupacion', { group_code: code, group_key: key }).then(function (g) {\n    ocupado(b, false);\n    GROUP = { code: code, key: key };\n    $('#pasoGrupo').classList.add('oculto');\n    $('#resumenGrupo').innerHTML = '<section class=\"tarjeta\" style=\"border-color:var(--amarillo)\">' +\n      '<div style=\"color:var(--tenue);font-size:13px;letter-spacing:.1em\">AGRUPACIÓN ' + escaparHtml(g.group_code) + '</div>' +\n      '<div class=\"codigo-grande\" style=\"font-size:36px;color:var(--texto)\">' + escaparHtml(g.group_display_name) + '</div>' +\n      '<p class=\"pista\" style=\"margin:8px 0 0\">' + g.members_authorized + ' de ' + (g.members_declared || g.members_registered) +\n      ' integrantes ya dieron su autorización.</p></section>';\n    $('#formulario').classList.remove('oculto');\n    if (!SIGNATURE_PAD && CONFIG.formularios.firma_integrantes) SIGNATURE_PAD = createSignaturePad($('#lienzoFirma'));\n  }).catch(function (e) {\n    ocupado(b, false);\n    mostrarAviso('#avisoGlobal', 'error', 'No encontramos la agrupación', e.message);\n  });\n}\n\nfunction submitMember() {\n  $$('.campo, .check').forEach(function (c) { c.classList.remove('malo'); });\n  var d = {};\n  ['full_name', 'id_number', 'birth_date', 'artistic_role', 'hp_field'].forEach(function (id) { d[id] = ($('#' + id).value || '').trim(); });\n  ['adult_confirmation', 'accept_terms', 'accept_data_processing', 'accept_image_voice'].forEach(function (id) { d[id] = $('#' + id).checked; });\n  var errorCount = 0;\n  [['full_name', 'Escribe tu nombre completo.'], ['id_number', 'Escribe tu documento.'], ['birth_date', 'Indica tu fecha de nacimiento.'],\n   ['artistic_role', 'Indica tu rol en la agrupación.']].forEach(function (p) { if (!d[p[0]]) { markError(p[0], p[1]); errorCount++; } });\n  [['adult_confirmation', 'Debes confirmar que eres mayor de edad.'], ['accept_terms', 'Debes aceptar los términos.'],\n   ['accept_data_processing', 'Debes autorizar el tratamiento de datos.']].forEach(function (p) { if (!d[p[0]]) { markError(p[0], p[1]); errorCount++; } });\n  if (CONFIG.formularios.firma_integrantes) {\n    if (!SIGNATURE_PAD || SIGNATURE_PAD.isEmpty()) { markError('lienzoFirma', 'Falta tu firma.'); errorCount++; }\n    else d.signature_png = SIGNATURE_PAD.png();\n  }\n  if (errorCount) { mostrarAviso('#avisoGlobal', 'error', 'Revisa el formulario', 'Hay ' + errorCount + ' campo(s) por completar.'); return; }\n\n  d.group_code = GROUP.code;\n  d.group_key = GROUP.key;\n  d.client_submission_id = idEnvio('integrante-' + GROUP.code);\n  d.form_elapsed_ms = formElapsedMs();\n  d.source = 'web';\n  var b = $('#btnEnviar');\n  ocupado(b, true, 'Registrando…');\n  llamar('registrar_integrante', d).then(function (r) {\n    ocupado(b, false);\n    if (r.member_status !== 'AUTORIZADO') {\n      nuevoIdEnvio('integrante-' + GROUP.code);\n      var errorList = (r.errores || []).map(function (e) { return '• ' + escaparHtml(e.mensaje); }).join('<br>');\n      (r.errores || []).forEach(function (e) { markError(e.campo === 'signature_png' ? 'lienzoFirma' : e.campo, e.mensaje); });\n      $('#avisoGlobal').innerHTML = '<div class=\"aviso ' + (r.member_status === 'NO CUMPLE' ? 'error' : 'alerta') + '\"><b>' +\n        escaparHtml(r.member_status) + '</b>' + escaparHtml(r.mensaje) + (errorList ? '<br>' + errorList : '') + '</div>';\n      window.scrollTo({ top: 0, behavior: 'smooth' });\n      return;\n    }\n    $('#formulario').classList.add('oculto');\n    $('#resultado').classList.remove('oculto');\n    $('#resultado').innerHTML = '<div class=\"aviso ok\"><b>' + (r.actualizado ? 'Autorización actualizada' : 'Autorización registrada') +\n      '</b>' + escaparHtml(r.mensaje) + '</div>' +\n      '<section class=\"tarjeta\"><h2>Listo</h2><p class=\"pista\" style=\"margin:0\">Presenta tu documento original el día de la audición: ' +\n      'en el check-in verificamos a cada integrante.</p></section>';\n    window.scrollTo({ top: 0, behavior: 'smooth' });\n  }).catch(function (e) {\n    ocupado(b, false);\n    mostrarAviso('#avisoGlobal', 'error', 'No pudimos registrar tu autorización', e.message + ' — puedes intentarlo de nuevo sin duplicar.');\n  });\n}\n</script>\n</body>\n</html>\n",
  "ui_jurado": "<!DOCTYPE html>\n<html lang=\"es\">\n<head><base target=\"_top\"><meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n<?!= incluir('ui_estilos') ?>\n<style>\n.factor{background:var(--acero);border:1px solid var(--linea);border-radius:11px;padding:13px;margin-bottom:10px}\n.factor .enc{display:flex;justify-content:space-between;align-items:baseline;gap:10px;margin-bottom:9px}\n.factor .nom{font-weight:700;font-size:14px}\n.factor .peso{color:var(--tenue);font-size:11.5px;text-transform:uppercase;letter-spacing:.07em}\n.notas{display:grid;grid-template-columns:repeat(10,1fr);gap:5px}\n.notas button{background:var(--negro);border:1px solid var(--linea);color:var(--texto);\n  border-radius:8px;padding:11px 0;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit}\n.notas button:hover{border-color:var(--amarillo)}\n.notas button.sel{background:var(--amarillo);border-color:var(--amarillo);color:#000}\n.total{position:sticky;bottom:0;background:var(--carbon);border-top:2px solid var(--amarillo);\n  padding:14px 16px;margin:0 -16px -16px;display:flex;justify-content:space-between;align-items:center;gap:12px}\n.total .n{font-size:27px;font-weight:900;color:var(--amarillo);line-height:1}\n</style></head>\n<body>\n<div class=\"envoltura\">\n  <header class=\"cabecera\">\n    <div class=\"marca\"><h1>JU<span>RADO</span></h1><div class=\"sub\">EL BÚNKER · <?= alias ?></div></div>\n    <div class=\"datos-evento\" id=\"cabeceraInfo\"></div>\n  </header>\n\n  <div id=\"avisoGlobal\"></div>\n\n  <div class=\"aviso info\" style=\"font-size:13px\">\n    <b>Califica de forma independiente</b>\n    Cada factor va de 1 a 10. No veas ni comentes las notas de los otros jurados antes de deliberar.\n    Puedes corregir una calificación: la corrección queda registrada.\n  </div>\n\n  <div class=\"tarjeta\">\n    <h2>Escala común</h2>\n    <div id=\"escala\" class=\"rejilla dos\" style=\"gap:8px\"></div>\n  </div>\n\n  <div class=\"tarjeta\">\n    <h2>Participantes</h2>\n    <p class=\"pista\">Solo aparecen quienes ya pasaron por check-in. Selecciona uno para calificarlo.</p>\n    <div class=\"campo\" style=\"margin-bottom:10px\">\n      <input type=\"text\" id=\"buscar\" placeholder=\"Filtrar por código o nombre artístico\">\n    </div>\n    <div class=\"tabla-envoltura\" style=\"max-height:340px;overflow-y:auto\"><table>\n      <thead><tr><th>Código</th><th>Artista</th><th>Modalidad</th><th>Género</th><th>Estado</th><th>Mi nota</th><th></th></tr></thead>\n      <tbody id=\"cuerpoLista\"></tbody>\n    </table></div>\n  </div>\n\n  <div id=\"tarjetaEvaluacion\"></div>\n</div>\n\n<?!= incluir('ui_scripts') ?>\n<script>\nwindow.ENTORNO = '<?= ENTORNO ?>';\nwindow.TOKEN = '<?= token ?>';\nvar DATOS = null, ACTUAL = null, PUNTAJES = {};\n\ndocument.addEventListener('DOMContentLoaded', function () {\n  cargar();\n  $('#buscar').addEventListener('input', pintarLista);\n});\n\nfunction cargar() {\n  llamar('lista_evaluacion').then(function (r) {\n    DATOS = r;\n    $('#cabeceraInfo').innerHTML = '<span class=\"chip\">Hoja <b>' + escaparHtml(r.hoja) + '</b></span>' +\n      '<span class=\"chip\">Evaluados <b id=\"nEval\">0</b></span>';\n    $('#escala').innerHTML = r.escala.map(function (e) {\n      return '<div class=\"chip\" style=\"white-space:normal\"><b>' + e.desde + '-' + e.hasta + '</b> ' +\n             escaparHtml(e.etiqueta) + '</div>';\n    }).join('');\n    pintarLista();\n  }).catch(function (e) { mostrarAviso('#avisoGlobal', 'error', 'No se pudo cargar', e.message); });\n}\n\nfunction pintarLista() {\n  if (!DATOS) return;\n  var q = ($('#buscar').value || '').toUpperCase();\n  var filas = DATOS.participantes.filter(function (p) {\n    return !q || p.code.toUpperCase().indexOf(q) !== -1 ||\n           String(p.artistic_name).toUpperCase().indexOf(q) !== -1;\n  });\n\n  var n = DATOS.participantes.filter(function (p) { return p.evaluado; }).length;\n  var cont = $('#nEval'); if (cont) cont.textContent = n + ' / ' + DATOS.participantes.length;\n\n  $('#cuerpoLista').innerHTML = filas.map(function (p) {\n    return '<tr><td><b>' + escaparHtml(p.code) + '</b></td>' +\n      '<td>' + escaparHtml(p.artistic_name) + '</td>' +\n      '<td>' + escaparHtml(modeLabel(p)) + '</td>' +\n      '<td>' + escaparHtml(p.discipline) + '</td>' +\n      '<td>' + etiquetaEstado(p.audition_status || p.attendance_status) + '</td>' +\n      '<td>' + (p.evaluado ? '<b style=\"color:var(--amarillo)\">' + p.total + '</b>' : '—') + '</td>' +\n      '<td><button class=\"boton chico ' + (p.evaluado ? 'fantasma' : '') + '\" data-code=\"' +\n        escaparHtml(p.code) + '\">' + (p.evaluado ? 'Corregir' : 'Calificar') + '</button></td></tr>';\n  }).join('') || '<tr><td colspan=\"7\" style=\"color:var(--tenue)\">Sin participantes todavía.</td></tr>';\n\n  $$('#cuerpoLista [data-code]').forEach(function (b) {\n    b.addEventListener('click', function () { abrir(b.dataset.code); });\n  });\n}\n\nfunction modeLabel(p) {\n  var m = { SOLISTA: 'Solista', DUO: 'Dúo', AGRUPACION: 'Agrupación' }[p.participation_mode] || p.participation_mode || '';\n  return p.participation_mode === 'AGRUPACION' ? m + ' (' + p.members_declared + ')' : m;\n}\n\nfunction abrir(code) {\n  ACTUAL = DATOS.participantes.filter(function (p) { return p.code === code; })[0];\n  if (!ACTUAL) return;\n\n  PUNTAJES = {};\n  if (ACTUAL.puntajes) {\n    DATOS.rubrica.forEach(function (f) {\n      var v = Number(ACTUAL.puntajes[f.id]);\n      if (isFinite(v) && v >= 1 && v <= 10) PUNTAJES[f.id] = v;\n    });\n  }\n\n  $('#tarjetaEvaluacion').innerHTML =\n    '<div class=\"tarjeta\" style=\"border-color:var(--amarillo)\">' +\n      '<h2>' + escaparHtml(ACTUAL.code) + ' · ' + escaparHtml(ACTUAL.artistic_name) + '</h2>' +\n      '<p class=\"pista\">' + escaparHtml(modeLabel(ACTUAL)) + ' · ' + escaparHtml(ACTUAL.discipline) +\n        (ACTUAL.presentation_format ? ' · ' + escaparHtml(ACTUAL.presentation_format_texto || ACTUAL.presentation_format) : '') +\n        (ACTUAL.song_name ? ' · Canción: ' + escaparHtml(ACTUAL.song_name) : '') +\n        (ACTUAL.evaluado ? ' · <b style=\"color:var(--alerta)\">Ya calificaste a este participante. Guardar sobrescribe y deja registro.</b>' : '') +\n      '</p>' +\n      DATOS.rubrica.map(function (f) {\n        return '<div class=\"factor\" data-factor=\"' + f.id + '\">' +\n          '<div class=\"enc\"><span class=\"nom\">' + escaparHtml(f.etiqueta) + '</span>' +\n          '<span class=\"peso\">peso ' + f.peso + '%</span></div>' +\n          '<div class=\"notas\">' + [1,2,3,4,5,6,7,8,9,10].map(function (n) {\n            return '<button data-f=\"' + f.id + '\" data-n=\"' + n + '\"' +\n                   (PUNTAJES[f.id] === n ? ' class=\"sel\"' : '') + '>' + n + '</button>';\n          }).join('') + '</div></div>';\n      }).join('') +\n      '<div class=\"campo\" style=\"margin-top:14px\"><label for=\"obs\">Observaciones</label>' +\n      '<textarea id=\"obs\" maxlength=\"900\" placeholder=\"Notas para la deliberación.\">' +\n        escaparHtml(ACTUAL.observaciones || '') + '</textarea></div>' +\n      '<div class=\"total\"><div><div class=\"peso\" style=\"color:var(--tenue);font-size:11.5px\">TOTAL SOBRE 100</div>' +\n      '<div class=\"n\" id=\"totalVivo\">—</div></div>' +\n      '<button class=\"boton\" id=\"btnGuardar\" style=\"width:auto\">Guardar calificación</button></div>' +\n    '</div>';\n\n  $$('#tarjetaEvaluacion .notas button').forEach(function (b) {\n    b.addEventListener('click', function () {\n      PUNTAJES[b.dataset.f] = Number(b.dataset.n);\n      $$('.notas button[data-f=\"' + b.dataset.f + '\"]').forEach(function (x) { x.classList.remove('sel'); });\n      b.classList.add('sel');\n      recalcular();\n    });\n  });\n  $('#btnGuardar').addEventListener('click', guardar);\n  recalcular();\n  $('#tarjetaEvaluacion').scrollIntoView({ behavior: 'smooth', block: 'start' });\n}\n\n/** Mirrors the server formula exactly: (nota / 10) * peso. */\nfunction recalcular() {\n  var faltan = DATOS.rubrica.filter(function (f) { return !PUNTAJES[f.id]; });\n  if (faltan.length) {\n    $('#totalVivo').textContent = '— (faltan ' + faltan.length + ')';\n    $('#btnGuardar').disabled = true;\n    return;\n  }\n  var total = DATOS.rubrica.reduce(function (s, f) { return s + (PUNTAJES[f.id] / 10) * f.peso; }, 0);\n  $('#totalVivo').textContent = Math.round(total * 100) / 100;\n  $('#btnGuardar').disabled = false;\n}\n\nfunction guardar() {\n  var b = $('#btnGuardar');\n  ocupado(b, true, 'Guardando...');\n  var datos = { code: ACTUAL.code, observaciones: $('#obs').value };\n  DATOS.rubrica.forEach(function (f) { datos[f.id] = PUNTAJES[f.id]; });\n\n  llamar('guardar_evaluacion', datos).then(function (r) {\n    ocupado(b, false);\n    mostrarAviso('#avisoGlobal', 'ok',\n      r.corregida ? 'Calificación corregida' : 'Calificación guardada',\n      ACTUAL.code + ' — total ' + r.total + '/100.');\n    $('#tarjetaEvaluacion').innerHTML = '';\n    cargar();\n  }).catch(function (e) {\n    ocupado(b, false);\n    mostrarAviso('#avisoGlobal', 'error', 'No se pudo guardar', e.message);\n  });\n}\n</script>\n</body>\n</html>\n",
  "ui_mi_inscripcion": "<!DOCTYPE html>\n<html lang=\"es\">\n<head>\n<base target=\"_top\">\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n<?!= incluir('ui_estilos') ?>\n</head>\n<body>\n<? var C = accionConfigPublica(); ?>\n<div class=\"envoltura\">\n  <?!= incluir('ui_cabecera') ?>\n  <h2 class=\"titulo-pagina\">Mi inscripción</h2>\n  <p style=\"color:var(--tenue);margin-top:0\">Consulta tu estado, tu código y horario, el enlace de tu agrupación y envía tu pista.</p>\n\n  <div id=\"avisoGlobal\" role=\"alert\" aria-live=\"polite\"></div>\n\n  <form class=\"tarjeta\" id=\"formConsulta\" novalidate>\n    <div class=\"rejilla dos\">\n      <div class=\"campo\">\n        <label for=\"id_number\">Tu número de cédula <span class=\"req\">*</span></label>\n        <input type=\"text\" id=\"id_number\" inputmode=\"numeric\" maxlength=\"15\" autocomplete=\"off\">\n        <p class=\"ayuda\">Si eres agrupación, la cédula del líder que hizo la inscripción.</p>\n        <div class=\"error\"></div>\n      </div>\n      <div class=\"campo\">\n        <label for=\"referencia\">Código B-XXX o comprobante S-XXXX <span class=\"req\">*</span></label>\n        <input type=\"text\" id=\"referencia\" autocomplete=\"off\" placeholder=\"B-012 o S-1A2B3C4D\" value=\"<?= codigo ?>\">\n        <p class=\"ayuda\">El comprobante aparece al terminar la inscripción y en el correo de recepción.</p>\n        <div class=\"error\"></div>\n      </div>\n    </div>\n    <button type=\"submit\" class=\"boton\" id=\"btnConsultar\">Consultar</button>\n  </form>\n\n  <div id=\"estado\"></div>\n\n  <footer class=\"pie\">\n    <?= C.legal.legal_name ?> · Datos personales y reclamos: <?= C.legal.data_protection_email ?>\n  </footer>\n</div>\n\n<?!= incluir('ui_scripts') ?>\n<script>\nwindow.ENTORNO = '<?= ENTORNO ?>';\nvar CONFIG = <?!= jsonForScript(C) ?>;\nvar BASE_URL = '<?= BASE_URL ?>';\nvar CURRENT = null;\n\ndocument.addEventListener('DOMContentLoaded', function () {\n  $('#formConsulta').addEventListener('submit', function (e) { e.preventDefault(); lookUp(); });\n});\n\nfunction lookupPayload() {\n  var ref = $('#referencia').value.trim().toUpperCase();\n  var d = { id_number: $('#id_number').value.trim(), source: 'web' };\n  if (/^B-?\\d+$/.test(ref)) d.code = ref.replace(/^B-?/, 'B-');\n  else d.submission_id = ref;\n  return d;\n}\n\nfunction lookUp() {\n  $$('.campo').forEach(function (c) { c.classList.remove('malo'); });\n  var d = lookupPayload();\n  if (!d.id_number) { markError('id_number', 'Escribe tu cédula.'); return; }\n  if (!d.code && !d.submission_id) { markError('referencia', 'Escribe tu código o comprobante.'); return; }\n  var b = $('#btnConsultar');\n  ocupado(b, true, 'Consultando…');\n  llamar('mi_inscripcion', d).then(function (r) {\n    ocupado(b, false);\n    CURRENT = { consulta: d, datos: r };\n    render(r);\n  }).catch(function (e) {\n    ocupado(b, false);\n    $('#estado').innerHTML = '';\n    mostrarAviso('#avisoGlobal', 'error', 'No encontramos tu inscripción', e.message);\n  });\n}\n\nfunction factHtml(k, v) {\n  // a clock time (\"9:00 p. m.\") must never break across lines inside a card\n  var value = escaparHtml(v).replace(/(\\d{1,2}:\\d{2}) ([ap])\\. m\\./g, '<span class=\"nowrap\">$1 $2. m.</span>');\n  return '<div class=\"hecho\"><div class=\"k\">' + k + '</div><div class=\"v\" style=\"font-size:22px\">' + value + '</div></div>';\n}\n\nfunction render(r) {\n  $('#avisoGlobal').innerHTML = '';\n  var html = '<section class=\"tarjeta\" style=\"border-color:var(--amarillo)\">' +\n    '<div style=\"color:var(--tenue);font-size:13px;letter-spacing:.1em\">' + escaparHtml(({ SOLISTA: 'Solista', DUO: 'Dúo', AGRUPACION: 'Agrupación' })[r.participation_mode] || r.participation_mode) + ' · ' + escaparHtml(r.submission_id) + '</div>' +\n    '<div class=\"codigo-grande\" style=\"font-size:34px;color:var(--texto)\">' + escaparHtml(r.artistic_name || '') + '</div>' +\n    '<p style=\"margin:8px 0 0\">' + etiquetaEstado(r.eligibility_status) + ' ' + escaparHtml(r.estado_texto) + '</p></section>';\n\n  if (r.code) {\n    html += '<section class=\"tarjeta\"><h2>Tu código y horario</h2><div class=\"codigo-grande\">' + escaparHtml(r.code) + '</div>' +\n      '<div class=\"hechos\" style=\"margin-top:14px\">' + factHtml('Fecha', r.fecha_texto) + factHtml('Llegada', r.hora_llegada) +\n      factHtml('Audición', r.hora_audicion) + factHtml('Lugar', r.lugar) + '</div>' +\n      '<p class=\"pista\" style=\"margin:0\">Tu código no cambia nunca. Si tienes un impedimento real: ' +\n      '<a href=\"' + BASE_URL + '?p=cambio-horario&code=' + encodeURIComponent(r.code) + '\">solicitar cambio de horario</a> (una sola vez).' +\n      (r.change_status && r.change_status !== 'SIN_SOLICITUD' ? ' Estado de tu solicitud: ' + etiquetaEstado(r.change_status) : '') + '</p></section>';\n  }\n\n  if (r.group) {\n    var g = r.group;\n    html += '<section class=\"tarjeta\"><h2>Tu agrupación ' + escaparHtml(g.code) + '</h2>' +\n      '<p style=\"margin:0 0 10px\"><b>' + g.authorized + '</b> de <b>' + (g.declared || g.registered) + '</b> integrantes autorizados · Clave <b style=\"letter-spacing:.12em\">' + escaparHtml(g.key) + '</b></p>' +\n      '<div class=\"tabla-envoltura\" style=\"margin-bottom:12px\"><table><thead><tr><th>Integrante</th><th>Rol</th><th>Estado</th></tr></thead><tbody>' +\n      g.members.map(function (m) { return '<tr><td>' + escaparHtml(m.name) + (m.leader ? ' (líder)' : '') + '</td><td>' + escaparHtml(m.role) + '</td><td>' + etiquetaEstado(m.status) + '</td></tr>'; }).join('') +\n      '</tbody></table></div>' +\n      '<div class=\"copiable\">' + escaparHtml(g.link) + '</div>' +\n      '<div class=\"rejilla dos\" style=\"margin-top:12px\"><button type=\"button\" class=\"boton fantasma\" id=\"btnCopiarGrupo\">Copiar enlace</button>' +\n      '<a class=\"boton\" target=\"_blank\" rel=\"noopener\" href=\"https://wa.me/?text=' +\n      encodeURIComponent('Cada integrante debe dar su propia autorización para EL BÚNKER aquí: ' + g.link) + '\">Enviar por WhatsApp</a></div></section>';\n  }\n\n  var t = r.track;\n  html += '<section class=\"tarjeta\"><h2>Tu pista</h2><p style=\"margin:0 0 10px\">Estado: ' + etiquetaEstado(t.status) +\n    (t.file_name ? ' · Archivo: <b>' + escaparHtml(t.file_name) + '</b>' : '') + '</p>';\n  if (t.can_upload) {\n    html += '<div class=\"campo\"><label for=\"song_name\">Nombre de la canción</label><input type=\"text\" id=\"song_name\" maxlength=\"120\" value=\"' + escaparHtml(r.song_name) + '\"></div>' +\n      '<div class=\"campo\"><label for=\"archivo\">Archivo de audio (' + escaparHtml(t.formats) + ', máximo ' + t.max_mb + ' MB)</label>' +\n      '<input type=\"file\" id=\"archivo\" accept=\".' + t.formats.split(',').join(',.') + ',audio/*\"><div class=\"error\"></div></div>' +\n      '<p class=\"ayuda\">Lo guardamos como ' + escaparHtml(r.code) + '_NOMBREARTISTICO_NOMBRECANCION. Si envías otro archivo, el anterior se conserva como respaldo. ' +\n      'El día del evento lleva también una copia en USB.</p>' +\n      '<button type=\"button\" class=\"boton\" id=\"btnSubir\">Enviar pista</button><div id=\"salidaPista\" style=\"margin-top:12px\"></div>';\n  } else if (t.uses) {\n    html += '<p class=\"pista\" style=\"margin:0\">Podrás enviar tu pista cuando tengas tu código B-XXX.</p>';\n  } else {\n    html += '<p class=\"pista\" style=\"margin:0\">Indicaste que no usarás pista.</p>';\n  }\n  html += '</section>';\n\n  if (r.video && r.video.status) {\n    html += '<section class=\"tarjeta\"><h2>Tu video</h2><p style=\"margin:0\">' + etiquetaEstado(r.video.status) + ' ' + escaparHtml(r.video.detail || '') + '</p></section>';\n  }\n\n  if (r.whatsapp_oficial) {\n    html += '<section class=\"tarjeta\"><h2>Guarda nuestro número</h2><p style=\"margin:0 0 12px\">Guarda el <b>' +\n      escaparHtml(String(r.whatsapp_oficial).replace(/^(\\d{3})(\\d{3})(\\d{4})$/, '$1 $2 $3')) + '</b> como <b>' + escaparHtml(r.whatsapp_nombre) + '</b>: desde ahí enviamos códigos, horarios y novedades.</p>' +\n      '<button type=\"button\" class=\"boton fantasma\" id=\"btnGuardarContacto\">Guardar contacto</button></section>';\n  }\n  $('#estado').innerHTML = html;\n  if ($('#btnCopiarGrupo')) $('#btnCopiarGrupo').addEventListener('click', function () { copyText(r.group.link, $('#btnCopiarGrupo')); });\n  if ($('#btnGuardarContacto')) $('#btnGuardarContacto').addEventListener('click', function () { downloadContact(r.whatsapp_oficial, r.whatsapp_nombre); });\n  if ($('#btnSubir')) $('#btnSubir').addEventListener('click', uploadTrack);\n}\n\nfunction uploadTrack() {\n  var r = CURRENT.datos;\n  var input = $('#archivo');\n  $$('.campo').forEach(function (c) { c.classList.remove('malo'); });\n  var f = input.files && input.files[0];\n  if (!f) { markError('archivo', 'Elige el archivo de tu pista.'); return; }\n  var ext = (f.name.split('.').pop() || '').toLowerCase();\n  if (r.track.formats.split(',').indexOf(ext) === -1) { markError('archivo', 'Formato no permitido. Usa: ' + r.track.formats + '.'); return; }\n  if (f.size > r.track.max_mb * 1024 * 1024) { markError('archivo', 'El archivo pesa más de ' + r.track.max_mb + ' MB. Comprímelo o entrégalo en USB.'); return; }\n  var b = $('#btnSubir');\n  ocupado(b, true, 'Enviando ' + Math.round(f.size / 1024 / 1024 * 10) / 10 + ' MB…');\n  fileToBase64(f).then(function (b64) {\n    return llamar('subir_pista', {\n      id_number: CURRENT.consulta.id_number, code: r.code, song_name: $('#song_name').value.trim(),\n      file_name: f.name, file_base64: b64, client_submission_id: 'P' + Date.now().toString(36),\n      form_elapsed_ms: formElapsedMs(), source: 'web'\n    });\n  }).then(function (res) {\n    ocupado(b, false);\n    mostrarAviso('#salidaPista', 'ok', 'Pista recibida', res.mensaje);\n  }).catch(function (e) {\n    ocupado(b, false);\n    mostrarAviso('#salidaPista', 'error', 'No pudimos recibir la pista', e.message);\n  });\n}\n</script>\n</body>\n</html>\n",
  "ui_scripts": "<script>\n/* EL BUNKER - shared client helpers. */\n\n/** Calls a server action. Same origin, so no CORS and no API key in the page. */\nfunction llamar(accion, datos) {\n  return new Promise(function (resolve, reject) {\n    var carga = Object.assign({ accion: accion, t: window.TOKEN || '' }, datos || {});\n    google.script.run\n      .withSuccessHandler(function (r) {\n        if (r && r.ok === false) reject(new Error(r.error || 'Error desconocido'));\n        else resolve(r);\n      })\n      .withFailureHandler(function (e) { reject(new Error(e.message || 'Fallo de conexion')); })\n      .api(carga);\n  });\n}\n\nfunction $(sel, raiz) { return (raiz || document).querySelector(sel); }\nfunction $$(sel, raiz) { return Array.prototype.slice.call((raiz || document).querySelectorAll(sel)); }\n\nfunction escaparHtml(v) {\n  return String(v === null || v === undefined ? '' : v)\n    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')\n    .replace(/\"/g, '&quot;').replace(/'/g, '&#39;');\n}\n\nfunction mostrarAviso(contenedor, tipo, titulo, texto) {\n  var el = typeof contenedor === 'string' ? $(contenedor) : contenedor;\n  if (!el) return;\n  el.innerHTML = '<div class=\"aviso ' + tipo + '\"><b>' + escaparHtml(titulo) + '</b>' +\n                 escaparHtml(texto || '') + '</div>';\n  el.scrollIntoView({ behavior: 'smooth', block: 'center' });\n}\n\nfunction ocupado(boton, activo, textoOcupado) {\n  if (!boton) return;\n  if (activo) {\n    boton.dataset.textoPrevio = boton.innerHTML;\n    boton.disabled = true;\n    boton.innerHTML = '<span class=\"cargando\"></span> ' + (textoOcupado || 'Procesando...');\n  } else {\n    boton.disabled = false;\n    if (boton.dataset.textoPrevio) boton.innerHTML = boton.dataset.textoPrevio;\n  }\n}\n\n/** Stable id per browser tab so a retry is recognised as the same submission. */\nfunction idEnvio(clave) {\n  var k = 'bunker_' + clave;\n  var v = null;\n  try { v = sessionStorage.getItem(k); } catch (e) { /* private mode */ }\n  if (!v) {\n    v = 'C' + Date.now().toString(36) + Math.random().toString(36).slice(2, 9);\n    try { sessionStorage.setItem(k, v); } catch (e) { /* ignore */ }\n  }\n  return v;\n}\n\nfunction nuevoIdEnvio(clave) {\n  try { sessionStorage.removeItem('bunker_' + clave); } catch (e) { /* ignore */ }\n  return idEnvio(clave);\n}\n\nfunction claseEstado(valor) {\n  return 'e-' + String(valor || '').toUpperCase().replace(/[\\s-]+/g, '');\n}\n\nfunction etiquetaEstado(valor) {\n  if (!valor) return '';\n  return '<span class=\"etiqueta ' + claseEstado(valor) + '\">' + escaparHtml(valor) + '</span>';\n}\n\n/**\n * Paints the test-environment banner.\n *\n * Production and staging are two different Apps Script projects with two\n * different spreadsheets, and their URLs look almost identical - so the only\n * reliable way to tell them apart at a glance is on screen.\n */\nfunction marcarEntorno() {\n  if (window.ENTORNO !== 'PRUEBAS') return;\n  var b = document.createElement('div');\n  b.className = 'banner-pruebas';\n  b.innerHTML = '<span>[PRUEBAS] · ENTORNO DE <b>PRUEBAS</b> — los datos son ficticios ' +\n                'y se pueden borrar. Esto NO es la convocatoria real.</span>';\n  document.body.insertBefore(b, document.body.firstChild);\n  document.title = '[PRUEBAS] ' + document.title;\n}\ndocument.addEventListener('DOMContentLoaded', marcarEntorno);\n\n/** Milliseconds since the page loaded: the server treats instant submissions as automated. */\nvar PAGE_LOADED_AT = Date.now();\nfunction formElapsedMs() { return Date.now() - PAGE_LOADED_AT; }\n\n/** Value of a radio group, '' when unanswered (silence is never an answer). */\nfunction radioValue(nombre) {\n  var el = document.querySelector('input[name=\"' + nombre + '\"]:checked');\n  return el ? el.value : '';\n}\n\n/** Values of a checkbox group joined with commas. */\nfunction checkedValues(nombre) {\n  return $$('input[name=\"' + nombre + '\"]:checked').map(function (x) { return x.value; }).join(',');\n}\n\n/** Marks a field (or a group of options) as wrong with a message. */\nfunction markError(id, mensaje) {\n  var el = document.getElementById(id);\n  if (!el) return;\n  var container = el.closest('.campo') || el.closest('.check') || el;\n  container.classList.add('malo');\n  var err = container.querySelector('.error');\n  if (err && mensaje) err.textContent = mensaje;\n}\n\n/** Reads a File as base64 (no data: prefix). */\nfunction fileToBase64(file) {\n  return new Promise(function (resolve, reject) {\n    var r = new FileReader();\n    r.onload = function () { resolve(String(r.result).split(',')[1] || ''); };\n    r.onerror = function () { reject(new Error('No se pudo leer el archivo.')); };\n    r.readAsDataURL(file);\n  });\n}\n\n/**\n * Signature pad on a canvas: pointer events (finger, pen or mouse), white\n * background so the stored PNG looks like ink on paper. `vacia()` is true\n * until at least a few points were drawn.\n */\nfunction createSignaturePad(canvas) {\n  var ctx = canvas.getContext('2d');\n  var strokes = 0, drawing = false, lastPoint = null;\n  function resetCanvas() {\n    var ratio = Math.max(window.devicePixelRatio || 1, 1);\n    var w = canvas.offsetWidth, h = canvas.offsetHeight;\n    canvas.width = w * ratio; canvas.height = h * ratio;\n    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);\n    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, w, h);\n    ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#1D1D1B';\n    strokes = 0;\n  }\n  function pointerPos(e) { var b = canvas.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; }\n  canvas.addEventListener('pointerdown', function (e) { drawing = true; lastPoint = pointerPos(e); canvas.setPointerCapture(e.pointerId); e.preventDefault(); });\n  canvas.addEventListener('pointermove', function (e) {\n    if (!drawing) return;\n    var p = pointerPos(e);\n    ctx.beginPath(); ctx.moveTo(lastPoint.x, lastPoint.y); ctx.lineTo(p.x, p.y); ctx.stroke();\n    lastPoint = p; strokes++; e.preventDefault();\n  });\n  ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (t) { canvas.addEventListener(t, function () { drawing = false; }); });\n  resetCanvas();\n  window.addEventListener('resize', function () { if (!strokes) resetCanvas(); });\n  return {\n    clear: resetCanvas,\n    isEmpty: function () { return strokes < 8; },\n    png: function () { return canvas.toDataURL('image/png'); }\n  };\n}\n\n/** Saves the official number as a contact (vCard): the step that makes WhatsApp broadcasts reach the person. */\nfunction downloadContact(numero, nombre) {\n  var vcf = ['BEGIN:VCARD', 'VERSION:3.0', 'FN:' + nombre, 'N:' + nombre + ';;;;', 'TEL;TYPE=CELL:+57' + numero, 'END:VCARD'].join('\\r\\n');\n  var url = URL.createObjectURL(new Blob([vcf], { type: 'text/vcard' }));\n  var a = document.createElement('a');\n  a.href = url; a.download = 'EL-BUNKER.vcf'; document.body.appendChild(a); a.click();\n  setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1000);\n}\n\nfunction copyText(texto, boton) {\n  function done() { if (boton) { var t = boton.textContent; boton.textContent = 'Copiado'; setTimeout(function () { boton.textContent = t; }, 1500); } }\n  if (navigator.clipboard) navigator.clipboard.writeText(texto).then(done).catch(function () {});\n  else { var ta = document.createElement('textarea'); ta.value = texto; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (e) {} ta.remove(); }\n}\n\n/** Online/offline banner, shared by every panel. */\nfunction vigilarConexion(alRecuperar) {\n  var barra = document.createElement('div');\n  barra.className = 'conexion';\n  document.body.appendChild(barra);\n\n  function pintar() {\n    if (navigator.onLine) {\n      barra.className = 'conexion';\n      if (alRecuperar) alRecuperar();\n    } else {\n      barra.className = 'conexion sin';\n      barra.textContent = 'SIN CONEXION - se guarda en este dispositivo y se sincroniza al volver';\n    }\n  }\n  window.addEventListener('online', pintar);\n  window.addEventListener('offline', pintar);\n  pintar();\n  return barra;\n}\n</script>\n"
};


// ========================================================================
// 000_instalar.gs
// ========================================================================

/**
 * EL BUNKER - editor entry points.
 *
 * INSTALAR is deliberately the FIRST function of the project: the Apps Script
 * editor preselects the first function, so whoever installs only has to press
 * "Ejecutar". The others are picked from the function dropdown:
 *
 *   INSTALAR          new production installation (idempotent)
 *   INSTALAR_PRUEBAS  turns THIS project into the test environment and installs it
 *   MIGRAR            upgrades an existing base to this version (only adds; backs up first)
 *   VERIFICAR         health report: environment keys, schema, legal flags, test data
 *   ENSAYO            full rehearsal with fictitious data (test environment only)
 *   LIMPIAR           wipes operational data (test environment only)
 *   RESTAURAR         restores a JSON backup (see docs/MANUAL-RECUPERACION.md)
 *   QUITAR_PRUEBAS_PRELANZAMIENTO  removes the two test registrations made in production before launch
 */
function INSTALAR() {
  var resumen = setupInicial();
  // Re-running must not re-issue links: a new link revokes the previous one.
  var accesos = leerHoja(HOJA.USUARIOS).length ? (ensureOperationalAccounts(), verAccesos()) : crearAccesosOperativos();

  var lineas = [
    '',
    '========================================================',
    '  EL BUNKER - INSTALACION COMPLETA (' + (resumen.entorno === 'test' ? 'PRUEBAS' : 'PRODUCCION') + ')',
    '========================================================',
    '',
    'BASE MAESTRA (tu "Excel"):',
    '  ' + resumen.spreadsheet_url,
    '',
    'ENLACES DE ACCESO (entrega a cada persona SOLO el suyo):'
  ];
  accesos.forEach(function (a) {
    lineas.push('  ' + a.alias + ' [' + a.rol + ']');
    lineas.push('    ' + a.url);
  });
  lineas.push('');
  lineas.push('SIGUIENTE PASO OBLIGATORIO:');
  lineas.push('  Implementar > Nueva implementacion > Aplicacion web');
  lineas.push('    Ejecutar como:    Yo');
  lineas.push('    Quien tiene acceso: Cualquier usuario');
  lineas.push('  Sin esto los enlaces de arriba no abren.');
  lineas.push('');
  lineas.push('DESPUES: revisa la hoja CONFIG (fecha, lugar, datos legales, enlaces).');
  lineas.push('========================================================');
  console.log(lineas.join('\n'));
  return { base: resumen.spreadsheet_url, accesos: accesos };
}

/**
 * Makes THIS project the test environment and installs it.
 * Run it once, in a NEW and empty Apps Script project: it creates its own
 * spreadsheet (named [PRUEBAS] ...), separate from production. From then on
 * ENSAYO and LIMPIAR work here and stay blocked in production.
 */
function INSTALAR_PRUEBAS() {
  PropertiesService.getScriptProperties().setProperty(PROP.ENVIRONMENT, 'test');
  var r = INSTALAR();
  console.log('\n*** ESTE PROYECTO ES EL ENTORNO DE PRUEBAS ***');
  console.log('Sus datos son ficticios y desechables. Produccion no se ve afectada.');
  return r;
}

/** Upgrades an existing base (production) to this version. Only adds; backs up first. */
function MIGRAR() {
  var r = migrarBase();
  var lineas = [
    '', '==================== MIGRACION ====================',
    'Entorno: ' + r.entorno + ' · marca de la hoja: ' + r.marca_hoja + ' · version ' + r.version,
    'Datos intactos (filas antes = despues): ' + (r.datos_intactos ? 'SI' : 'NO'),
    'Filas: ' + JSON.stringify(r.filas_despues),
    'Respaldo previo: ' + r.respaldo_previo.xlsx + ' + ' + r.respaldo_previo.json,
    'Hojas creadas: ' + (r.esquema.hojas_creadas.join(', ') || 'ninguna'),
    'Columnas agregadas: ' + JSON.stringify(r.esquema.columnas_agregadas),
    'CONFIG actualizada: ' + (r.config.actualizadas.join(' | ') || 'nada'),
    'CONFIG agregada: ' + (r.config.agregadas.join(', ') || 'nada'),
    'CONFIG en conflicto (se conserva lo que habia): ' + (r.config.conflictos.join(' | ') || 'ninguno'),
    'Filas migradas a v3: ' + JSON.stringify(r.filas_v3),
    'Rubrica: ' + JSON.stringify(r.rubrica),
    'Cuentas nuevas: ' + (r.cuentas_nuevas.join(', ') || 'ninguna'),
    'SIGUIENTE PASO: Gestionar implementaciones > lapiz > Version nueva > Implementar.',
    '===================================================='
  ];
  console.log(lineas.join('\n'));
  return r;
}

/** Health report used before every release. */
function VERIFICAR() {
  var h = systemHealth();
  console.log(JSON.stringify(h, null, 2));
  return h;
}

/**
 * Full rehearsal with fictitious data: 130 registrations, group members,
 * codes, audio folders, schedule changes, the event day, three jurors, results
 * and a backup. Resumable (runs again by itself if it hits the time limit).
 */
function ENSAYO() {
  exigirEntornoPruebas('ENSAYO');
  return ensayoIntegral();
}

/**
 * Wipes operational data (registrations, members, evaluations, incidents,
 * changes, log) and the test audio/signature files; keeps CONFIG and users.
 * No arguments because the editor's Run button can not pass any.
 */
function LIMPIAR() {
  exigirEntornoPruebas('LIMPIAR');
  var r = borrarDatosDePrueba('SI-BORRAR');
  console.log(r.mensaje);
  return r;
}

/**
 * Registrations made in production before the public launch were tests: two confirmed by the
 * organization on 2026-09-24 and five made by the organization between 2026-09-25 and 2026-09-27
 * (release QA reset, 2026-09-29). Removes exactly those rows (with their team members, change
 * requests, offers, e-mail log and cards), after a raw backup, and logs it. Any other row is
 * treated as real and kept. Running it again finds nothing and changes nothing.
 */
var PRELAUNCH_TEST_SUBMISSIONS = ['S-07BE9C53', 'S-E780AA04',
  'S-5F23127D', 'S-67ACAFA8', 'S-2B643606', 'S-494D927B', 'S-433834E6'];

function QUITAR_PRUEBAS_PRELANZAMIENTO() {
  var r = quitarInscripciones(PRELAUNCH_TEST_SUBMISSIONS, 'SI-QUITAR');
  console.log(JSON.stringify(r, null, 2));
  return r;
}

// ========================================================================
// 00_config.gs
// ========================================================================

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

// ========================================================================
// 01_core_validacion.gs
// ========================================================================

/**
 * EL BUNKER - Core: normalization, eligibility and duplicate detection.
 *
 * PURE FUNCTIONS ONLY. No SpreadsheetApp / no Session / no side effects.
 * This file is loaded verbatim by the Node test runner (test/loader.js), so it
 * must stay free of Apps Script globals.
 */

/**
 * Eligibility vocabulary (release QA, section 3). Kept as constants so typos fail loudly.
 * RECIBIDO is what every new submission gets: the automatic check is stored apart
 * (eligibility_auto) and only becomes APTO / NO_APTO / ... when staff confirm it, so a
 * receipt can never be mistaken for a pass.
 */
var ESTADO_ELEGIBILIDAD = {
  RECIBIDO: 'RECIBIDO',
  EN_REVISION: 'EN_REVISION',
  APTO: 'APTO',
  NO_APTO: 'NO_APTO',
  INCOMPLETO: 'INCOMPLETO',
  DUPLICADO: 'DUPLICADO'
};

/** Participant-facing wording of each eligibility state. */
var ELIGIBILITY_LABELS = {
  RECIBIDO: 'Recibida', EN_REVISION: 'En revisión', APTO: 'Apto', NO_APTO: 'No apto',
  INCOMPLETO: 'Incompleta', DUPLICADO: 'Duplicada'
};

/** Iteration-1/2 values still found in old rows and backups. */
function normalizeEligibility(value) {
  var v = normalizarComparable(value).replace(/\s+/g, '_');
  if (v === 'REVISION') return ESTADO_ELEGIBILIDAD.EN_REVISION;
  if (v === 'NO_CUMPLE' || v === 'NOCUMPLE') return ESTADO_ELEGIBILIDAD.NO_APTO;
  return v;
}

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
/** The wording of Form 1, so staff screens never show the stored enum. */
var PRESENTATION_FORMAT_LABELS = {
  VOZ_PISTA: 'Voz sobre pista / backing track', VOZ_INSTRUMENTO: 'Voz + instrumento en vivo',
  INSTRUMENTAL: 'Instrumento / instrumental', DJ_SET: 'DJ / set', FREESTYLE_PERFORMANCE: 'Freestyle / performance', OTRA: 'Otra'
};

function presentationFormatText(format, other) {
  var f = normalizarTexto(format);
  if (f === 'OTRA' && normalizarTexto(other)) return 'Otra: ' + normalizarTexto(other);
  return PRESENTATION_FORMAT_LABELS[f] || f;
}

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

/** "3239836182" -> "323 983 6182": how a person reads a Colombian mobile number. Anything else is returned trimmed. */
function phoneText(value) {
  var digits = normalizarTelefono(value);
  return digits.length === 10 ? digits.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3') : normalizarTexto(value);
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
      errores.push({ campo: consent, codigo: 'CONSENTIMIENTO', mensaje: 'Declaración o autorización obligatoria no otorgada.' });
    }
  }

  // 2b. Project shape (iteration 2) ------------------------------------------
  projectShapeErrors(datos, maxMembers).forEach(function (e) { errores.push(e); });

  var incompleto = errores.length > 0;

  // 3. Format ---------------------------------------------------------------
  if (normalizarTexto(datos.id_number) && !esCedulaValida(datos.id_number)) {
    errores.push({ campo: 'id_number', codigo: 'FORMATO', mensaje: 'El documento debe tener entre 6 y 10 dígitos.' });
  }
  if (normalizarTexto(datos.email) && !esEmailValido(datos.email)) {
    errores.push({ campo: 'email', codigo: 'FORMATO', mensaje: 'Correo electrónico inválido.' });
  }
  if (normalizarTexto(datos.whatsapp) && !esTelefonoValido(datos.whatsapp)) {
    errores.push({ campo: 'whatsapp', codigo: 'FORMATO', mensaje: 'Número celular colombiano inválido (10 dígitos, inicia en 3).' });
  }
  if (normalizarTexto(datos.full_name) && normalizarTexto(datos.full_name).length < 5) {
    errores.push({ campo: 'full_name', codigo: 'FORMATO', mensaje: 'Escribe tu nombre completo.' });
  }

  // 4. Video: optional by default, reviewable when malformed -----------------
  var video = normalizarTexto(datos.video_url);
  if (video && !esUrlValida(video)) {
    if (exigirVideo) {
      errores.push({ campo: 'video_url', codigo: 'FORMATO', mensaje: 'Enlace de video inválido.' });
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
    errores.push({ campo: 'birth_date', codigo: 'FORMATO', mensaje: 'Fecha de nacimiento inválida.' });
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
    estado = ESTADO_ELEGIBILIDAD.NO_APTO;
  } else if (errores.length > 0) {
    estado = ESTADO_ELEGIBILIDAD.INCOMPLETO;
  } else if (avisos.length > 0) {
    estado = ESTADO_ELEGIBILIDAD.EN_REVISION;
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
    errors.push({ campo: 'participation_mode', codigo: 'FORMATO', mensaje: 'Modalidad inválida: elige Solista, Dúo o Agrupación.' });
  }
  if (isGroupMode(mode)) {
    if (!normalizarTexto(datos.artistic_name)) {
      errors.push({ campo: 'artistic_name', codigo: 'FALTANTE', mensaje: 'Escribe el nombre artístico de la agrupación.' });
    }
    var declared = parseInt(datos.members_declared, 10);
    if (!normalizarTexto(datos.members_declared)) {
      errors.push({ campo: 'members_declared', codigo: 'FALTANTE', mensaje: 'Indica cuántos integrantes estarán en escena.' });
    } else if (mode === PARTICIPATION_MODE.DUO && declared !== 2) {
      errors.push({ campo: 'members_declared', codigo: 'FORMATO', mensaje: 'Un dúo tiene exactamente 2 integrantes.' });
    } else if (mode === PARTICIPATION_MODE.AGRUPACION && !(declared >= 3 && declared <= maxMembers)) {
      errors.push({ campo: 'members_declared', codigo: 'FORMATO', mensaje: 'Una agrupación tiene entre 3 y ' + maxMembers + ' integrantes en escena.' });
    }
  }

  var format = normalizarComparable(datos.presentation_format).replace(/[\s-]+/g, '_');
  if (format && PRESENTATION_FORMATS.indexOf(format) === -1) {
    errors.push({ campo: 'presentation_format', codigo: 'FORMATO', mensaje: 'Forma de presentación inválida.' });
  }
  if (format === 'OTRA' && !normalizarTexto(datos.presentation_other)) {
    errors.push({ campo: 'presentation_other', codigo: 'FALTANTE', mensaje: 'Describe brevemente cómo será tu presentación.' });
  }

  if (esVerdadero(datos.own_equipment) && !normalizarTexto(datos.own_equipment_detail)) {
    errors.push({ campo: 'own_equipment_detail', codigo: 'FALTANTE', mensaje: 'Cuéntanos qué instrumento o equipo llevarás.' });
  }

  if (esVerdadero(datos.track_uses)) {
    var method = normalizarComparable(datos.track_method);
    if (!method) {
      errors.push({ campo: 'track_method', codigo: 'FALTANTE', mensaje: 'Indica cómo entregarás la pista.' });
    } else if (TRACK_METHODS.indexOf(method) === -1) {
      errors.push({ campo: 'track_method', codigo: 'FORMATO', mensaje: 'Método de entrega de pista inválido.' });
    } else if (method === 'OTRO' && !normalizarTexto(datos.track_method_other)) {
      errors.push({ campo: 'track_method_other', codigo: 'FALTANTE', mensaje: 'Describe el método de entrega de la pista.' });
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

/** EQ-001 style team code of a soloist project (a group's team code is its GRP code). */
function formatTeamCode(n) {
  var s = String(n);
  while (s.length < 3) s = '0' + s;
  return 'EQ-' + s;
}

/** Next soloist team number: one above the highest ever issued, never reused. */
function nextTeamNumber(rows) {
  var max = 0;
  for (var i = 0; i < rows.length; i++) {
    var m = String(rows[i].team_code || '').match(/^EQ-(\d+)$/i);
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
  var crew = normalizePersonRole(datos.person_role) === PERSON_ROLE.EQUIPO_TRABAJO;

  // Performers describe what they do on stage; crew members pick their role from the list.
  ['full_name', 'id_number', 'birth_date'].concat(crew ? ['crew_role'] : ['artistic_role']).forEach(function (field) {
    if (!normalizarTexto(datos[field])) errors.push({ campo: field, codigo: 'FALTANTE', mensaje: 'Campo obligatorio.' });
  });
  if (crew && normalizarTexto(datos.crew_role) &&
      CREW_ROLES.indexOf(normalizarComparable(datos.crew_role).replace(/[^A-Z]/g, '')) === -1) {
    errors.push({ campo: 'crew_role', codigo: 'FORMATO', mensaje: 'Rol de equipo no válido.' });
  }
  ['adult_confirmation', 'accept_terms', 'accept_data_processing'].forEach(function (field) {
    if (!esVerdadero(datos[field])) errors.push({ campo: field, codigo: 'CONSENTIMIENTO', mensaje: 'Declaración o autorización obligatoria.' });
  });
  if (requireSignature && !normalizarTexto(datos.signature_png)) {
    errors.push({ campo: 'signature_png', codigo: 'FALTANTE', mensaje: 'Falta la firma.' });
  }
  if (normalizarTexto(datos.id_number) && !esCedulaValida(datos.id_number)) {
    errors.push({ campo: 'id_number', codigo: 'FORMATO', mensaje: 'El documento debe tener entre 6 y 10 dígitos.' });
  }

  var age = null;
  if (normalizarTexto(datos.birth_date)) {
    if (!parsearFecha(datos.birth_date)) {
      errors.push({ campo: 'birth_date', codigo: 'FORMATO', mensaje: 'Fecha de nacimiento inválida.' });
    } else {
      age = calcularEdad(datos.birth_date, eventDate);
      if (age < minAge) {
        errors.push({ campo: 'birth_date', codigo: 'EDAD', mensaje: 'Cada integrante debe ser mayor de ' + minAge + ' años el día del evento.' });
      }
    }
  }

  var status = MEMBER_STATUS.AUTORIZADO;
  if (errors.some(function (e) { return e.codigo === 'EDAD'; })) status = MEMBER_STATUS.NO_CUMPLE;
  else if (errors.length) status = MEMBER_STATUS.INCOMPLETO;
  return { status: status, age: age, errors: errors, person_role: crew ? PERSON_ROLE.EQUIPO_TRABAJO : PERSON_ROLE.INTERPRETE };
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

// ---------------------------------------------------------------------------
// People and roles (release QA, section 2)
// ---------------------------------------------------------------------------

/** A person on stage (counts toward the project) or a crew member (never takes a seat, never ranked). */
var PERSON_ROLE = { INTERPRETE: 'INTERPRETE', EQUIPO_TRABAJO: 'EQUIPO_TRABAJO' };

var CREW_ROLES = ['MANAGER', 'PRODUCTOR', 'TECNICO', 'ASISTENTE', 'FOTOGRAFO', 'OTRO'];
var CREW_ROLE_LABELS = {
  MANAGER: 'Manager', PRODUCTOR: 'Productor(a)', TECNICO: 'Técnico(a)', ASISTENTE: 'Asistente',
  FOTOGRAFO: 'Fotógrafo(a) / video', OTRO: 'Otro'
};

var DOCUMENT_TYPES = ['CC', 'CE', 'PPT', 'PASAPORTE'];
var DOCUMENT_TYPE_LABELS = { CC: 'Cédula de ciudadanía', CE: 'Cédula de extranjería', PPT: 'PPT', PASAPORTE: 'Pasaporte' };

function normalizePersonRole(value) {
  var v = normalizarComparable(value).replace(/[^A-Z]/g, '');
  if (v === 'EQUIPOTRABAJO' || v === 'EQUIPO' || v === 'CREW') return PERSON_ROLE.EQUIPO_TRABAJO;
  return PERSON_ROLE.INTERPRETE;
}

function normalizeDocumentType(value) {
  var v = normalizarComparable(value).replace(/[^A-Z]/g, '');
  return DOCUMENT_TYPES.indexOf(v) !== -1 ? v : 'CC';
}

/**
 * Stable person identifier derived from the ID number: the same person in two projects (or
 * in two roles) is ONE person. Not reversible to the document number.
 */
function personIdFor(normalizedIdNumber) {
  var doc = normalizarCedula(normalizedIdNumber);
  if (!doc) return '';
  var h = 5381;
  for (var i = 0; i < doc.length; i++) h = ((h * 33) ^ doc.charCodeAt(i)) >>> 0;
  var h2 = 52711;
  for (var j = doc.length - 1; j >= 0; j--) h2 = ((h2 * 31) ^ doc.charCodeAt(j)) >>> 0;
  return 'P-' + (h.toString(36) + h2.toString(36)).toUpperCase().slice(0, 10);
}

// ========================================================================
// 02_core_codigos.gs
// ========================================================================

/**
 * EL BUNKER - Core: definitive code assignment (B-001 .. B-100).
 * PURE FUNCTIONS ONLY.
 */

var PREFIJO_CODIGO = 'B-';
var CUPO_MAXIMO = 100;

/** B-1 -> "B-001". Padding is fixed at 3 so codes sort lexicographically. */
function formatearCodigo(numero, prefijo) {
  var p = prefijo || PREFIJO_CODIGO;
  var n = String(numero);
  while (n.length < 3) n = '0' + n;
  return p + n;
}

function numeroDeCodigo(codigo) {
  var m = String(codigo || '').match(/(\d+)\s*$/);
  return m ? parseInt(m[1], 10) : null;
}

function esCodigoValido(codigo, cupo) {
  var n = numeroDeCodigo(codigo);
  var max = cupo || CUPO_MAXIMO;
  if (n === null) return false;
  if (!new RegExp('^' + PREFIJO_CODIGO + '\\d{3}$').test(String(codigo).toUpperCase())) return false;
  return n >= 1 && n <= max;
}

/**
 * Assigns definitive codes over the whole registry.
 *
 * Invariants enforced here (each one is covered by a test):
 *  1. Only APTO + non-duplicate rows receive a code.
 *  2. Order is submission order (created_at, tie-broken by submission_id) so the
 *     assignment is deterministic and reproducible from a backup.
 *  3. A row that ALREADY has a code keeps it - codes are never renumbered.
 *     A number that was ever issued (and later freed by a withdrawal) is NOT handed out
 *     here: a freed slot only changes hands through a substitute offer, with history.
 *  4. At most `cupo` codes exist. Overflow rows become substitutes (computePool), never get a code here.
 *  5. The function is idempotent: running it twice changes nothing.
 *
 * @returns {{asignados:Array, sin_cupo:Array, ya_tenian:number, siguiente:number}}
 */
function asignarCodigos(registros, opciones) {
  opciones = opciones || {};
  var cupo = opciones.cupo || CUPO_MAXIMO;
  var ahora = opciones.ahora || new Date().toISOString();
  var responsable = opciones.responsable || 'sistema';

  // --- 1. Collect codes already issued; they are immovable. ------------------
  var ocupados = {};
  var maximoUsado = 0;
  var yaTenian = 0;

  for (var i = 0; i < registros.length; i++) {
    var code = normalizarTexto(registros[i].code);
    if (!code) continue;
    var n = numeroDeCodigo(code);
    if (n === null) continue;
    ocupados[n] = true;
    yaTenian++;
    if (n > maximoUsado) maximoUsado = n;
  }
  var everIssued = issuedSlotNumbers(registros);
  Object.keys(everIssued).forEach(function (k) { ocupados[k] = true; });

  // --- 2. Candidates, in submission order. ----------------------------------
  var candidatos = registros.filter(function (r) {
    if (normalizarTexto(r.code)) return false;                       // already has one
    if (r.duplicate_flag === true || normalizarComparable(r.duplicate_flag) === 'TRUE') return false;
    if (isWithdrawn(r) || normalizarComparable(r.pool_status) === POOL_STATUS.DECLINO) return false;
    return normalizarComparable(r.eligibility_status) === ESTADO_ELEGIBILIDAD.APTO;
  });

  candidatos.sort(function (a, b) {
    var ta = String(a.created_at || '');
    var tb = String(b.created_at || '');
    if (ta < tb) return -1;
    if (ta > tb) return 1;
    return String(a.submission_id || '') < String(b.submission_id || '') ? -1 : 1;
  });

  // --- 3. Hand out the next free number. ------------------------------------
  var asignados = [];
  var sinCupo = [];
  var siguiente = 1;

  for (var c = 0; c < candidatos.length; c++) {
    while (siguiente <= cupo && ocupados[siguiente]) siguiente++;

    if (siguiente > cupo) {
      sinCupo.push({ submission_id: candidatos[c].submission_id, motivo: 'CUPO_LLENO' });
      continue;
    }

    var codigo = formatearCodigo(siguiente);
    ocupados[siguiente] = true;
    asignados.push({
      submission_id: candidatos[c].submission_id,
      code: codigo,
      numero: siguiente,
      issued_at: ahora,
      issued_by: responsable
    });
    siguiente++;
  }

  return {
    asignados: asignados,
    sin_cupo: sinCupo,
    ya_tenian: yaTenian,
    siguiente: Math.min(siguiente, cupo + 1),
    cupo: cupo,
    total_con_codigo: yaTenian + asignados.length
  };
}

// ---------------------------------------------------------------------------
// Pool of eligible projects: 100 principal slots + substitutes up to 200
// ---------------------------------------------------------------------------

var POOL_SIZE = 200;

var POOL_STATUS = {
  PRINCIPAL: 'PRINCIPAL',           // holds a slot code B-001..B-100
  SUPLENTE: 'SUPLENTE',             // eligible, inside the pool, no slot yet
  FUERA_DE_BOLSA: 'FUERA_DE_BOLSA', // eligible but past position 200
  DECLINO: 'DECLINO',               // a substitute who turned down (or let expire) an offer
  RETIRADO: 'RETIRADO'              // withdrew; keeps its history, never offered again
};

var WITHDRAWAL = { RETIRADO: 'RETIRADO', RETIRO_FINAL: 'RETIRO_FINAL' };

var OFFER_STATUS = {
  PENDIENTE: 'PENDIENTE',
  ACEPTADA: 'ACEPTADA',
  RECHAZADA: 'RECHAZADA',
  VENCIDA: 'VENCIDA',
  CANCELADA: 'CANCELADA',
  VACANTE: 'VACANTE_SIN_REEMPLAZO'   // the slot was closed without a substitute
};

var SLOT_STATUS = {
  ASIGNADO: 'ASIGNADO',
  OFRECIDO: 'OFRECIDO',
  LIBERADO: 'LIBERADO',
  VACANTE_SIN_REEMPLAZO: 'VACANTE_SIN_REEMPLAZO',
  SIN_EMITIR: 'SIN_EMITIR'
};

function byCreatedAt(a, b) {
  var ta = String(a.created_at || '');
  var tb = String(b.created_at || '');
  if (ta < tb) return -1;
  if (ta > tb) return 1;
  return String(a.submission_id || '') < String(b.submission_id || '') ? -1 : 1;
}

function isWithdrawn(r) {
  return !!normalizarComparable(r.withdrawal_status);
}

/** Eligible for the pool: APTO, not a duplicate, not withdrawn. The order is objective: submission time. */
function poolCandidates(registros) {
  return (registros || []).filter(function (r) {
    if (r.duplicate_flag === true || normalizarComparable(r.duplicate_flag) === 'TRUE') return false;
    if (isWithdrawn(r)) return false;
    return normalizarComparable(r.eligibility_status) === ESTADO_ELEGIBILIDAD.APTO;
  }).sort(byCreatedAt);
}

/**
 * Objective pool order (no score is ever used before the audition).
 * priority_rank = position among eligible projects by submission time.
 * Slot holders are PRINCIPAL; the next (poolSize - cupo) non-holders are SUPLENTE in
 * priority order; the rest are FUERA_DE_BOLSA. Substitutes who declined keep DECLINO.
 * @returns {{filas:Array<{submission_id,priority_rank,pool_status}>, principales:number, suplentes:number, fuera:number}}
 */
function computePool(registros, opciones) {
  opciones = opciones || {};
  var cupo = opciones.cupo || CUPO_MAXIMO;
  var poolSize = Math.max(opciones.bolsa || POOL_SIZE, cupo);
  var candidates = poolCandidates(registros);
  var substituteSeats = poolSize - cupo;
  var rows = [];
  var principals = 0, substitutes = 0, outside = 0;

  candidates.forEach(function (r, i) {
    var status;
    if (normalizarTexto(r.code)) { status = POOL_STATUS.PRINCIPAL; principals++; }
    else if (normalizarComparable(r.pool_status) === POOL_STATUS.DECLINO) status = POOL_STATUS.DECLINO;
    else if (substitutes < substituteSeats) { status = POOL_STATUS.SUPLENTE; substitutes++; }
    else { status = POOL_STATUS.FUERA_DE_BOLSA; outside++; }
    rows.push({ submission_id: r.submission_id, priority_rank: i + 1, pool_status: status });
  });

  var ranked = {};
  rows.forEach(function (p) { ranked[p.submission_id] = true; });
  (registros || []).forEach(function (r) {
    if (isWithdrawn(r)) { rows.push({ submission_id: r.submission_id, priority_rank: '', pool_status: POOL_STATUS.RETIRADO }); return; }
    // A slot holder whose eligibility was reopened keeps its seat until staff decide: still PRINCIPAL.
    if (!ranked[r.submission_id] && normalizarTexto(r.code)) {
      rows.push({ submission_id: r.submission_id, priority_rank: '', pool_status: POOL_STATUS.PRINCIPAL });
      principals++;
    }
  });
  return { filas: rows, principales: principals, suplentes: substitutes, fuera: outside };
}

/** Numbers that were ever issued (current holders and previous holders): a released slot is only re-given through an offer. */
function issuedSlotNumbers(registros) {
  var issued = {};
  (registros || []).forEach(function (r) {
    [r.code, r.previous_code].forEach(function (c) {
      String(c || '').split(/[,\s]+/).forEach(function (one) {
        var n = numeroDeCodigo(one);
        if (n !== null && normalizarTexto(one)) issued[n] = true;
      });
    });
  });
  return issued;
}

/**
 * Slot status for B-001..B-cupo from the registry (holder = row whose `code` is the slot)
 * and the offer ledger (latest offer row of each slot).
 */
function slotStatuses(registros, ofertas, opciones) {
  opciones = opciones || {};
  var cupo = opciones.cupo || CUPO_MAXIMO;
  var holders = {};
  (registros || []).forEach(function (r) {
    if (normalizarTexto(r.code)) holders[normalizarComparable(r.code)] = r;
  });
  var latest = {};
  (ofertas || []).forEach(function (o) {
    var slot = normalizarComparable(o.slot_code);
    if (!slot) return;
    if (!latest[slot] || String(o.created_at || '') >= String(latest[slot].created_at || '')) latest[slot] = o;
  });
  var issued = issuedSlotNumbers(registros);
  var out = [];
  for (var n = 1; n <= cupo; n++) {
    var code = formatearCodigo(n);
    var holder = holders[code];
    var offer = latest[code];
    var status;
    if (holder) status = SLOT_STATUS.ASIGNADO;
    else if (offer && normalizarComparable(offer.estado) === OFFER_STATUS.PENDIENTE) status = SLOT_STATUS.OFRECIDO;
    else if (offer && normalizarComparable(offer.estado) === OFFER_STATUS.VACANTE) status = SLOT_STATUS.VACANTE_SIN_REEMPLAZO;
    else if (issued[n]) status = SLOT_STATUS.LIBERADO;
    else status = SLOT_STATUS.SIN_EMITIR;
    out.push({
      slot_code: code, status: status,
      holder_submission_id: holder ? holder.submission_id : '',
      offer_id: offer ? offer.oferta_id : '', offered_to: offer && status === SLOT_STATUS.OFRECIDO ? offer.submission_id : ''
    });
  }
  return out;
}

/**
 * Next substitute to offer a freed slot to: SUPLENTE by priority, without a pending offer,
 * never someone who already declined or withdrew. Never two open offers for one person.
 */
function nextSubstitute(registros, ofertas, opciones) {
  var pool = computePool(registros, opciones);
  var pending = {};
  (ofertas || []).forEach(function (o) {
    if (normalizarComparable(o.estado) === OFFER_STATUS.PENDIENTE) pending[normalizarComparable(o.submission_id)] = true;
  });
  var bySubmission = {};
  (registros || []).forEach(function (r) { bySubmission[r.submission_id] = r; });
  var candidates = pool.filas.filter(function (p) {
    return p.pool_status === POOL_STATUS.SUPLENTE && !pending[normalizarComparable(p.submission_id)];
  }).sort(function (a, b) { return a.priority_rank - b.priority_rank; });
  return candidates.length ? Object.assign({}, bySubmission[candidates[0].submission_id], candidates[0]) : null;
}

/** Offer expiry: `hours` after `from`, never later than the replacement deadline. */
function offerExpiry(fromIso, hours, deadlineIso) {
  var expires = new Date(new Date(fromIso).getTime() + (Number(hours) || 24) * 3600000);
  if (deadlineIso) {
    var deadline = new Date(deadlineIso);
    if (!isNaN(deadline.getTime()) && deadline.getTime() < expires.getTime()) expires = deadline;
  }
  return expires.toISOString();
}

// ---------------------------------------------------------------------------
// Calendar windows (all dates come from CONFIG)
// ---------------------------------------------------------------------------

/**
 * Which participant-side operations are open at `now`.
 * - withdrawal button ("NO PUEDO ASISTIR"): from reemplazos_desde until the list is consolidated
 * - automatic substitute offers: until reemplazo_limite (after it a freed slot stays vacant)
 * - final confirmation: from confirmacion_final_desde until confirmacion_final_hasta
 * - the consolidated official list freezes every ordinary change
 */
function operationWindows(nowIso, calendar) {
  var now = new Date(nowIso || new Date().toISOString()).getTime();
  var c = calendar || {};
  function at(v) { var d = v ? new Date(v) : null; return d && !isNaN(d.getTime()) ? d.getTime() : null; }
  var locked = !!c.lista_bloqueada;
  var from = at(c.reemplazos_desde);
  var limit = at(c.reemplazo_limite);
  var confFrom = at(c.confirmacion_final_desde);
  var confTo = at(c.confirmacion_final_hasta);
  return {
    lista_bloqueada: locked,
    retiro_abierto: !locked && from !== null && now >= from,
    reemplazo_viable: !locked && (limit === null || now < limit),
    confirmacion_abierta: !locked && confFrom !== null && now >= confFrom && (confTo === null || now <= confTo)
  };
}

// ---------------------------------------------------------------------------
// Participation status (derived, one function, used by every screen and export)
// ---------------------------------------------------------------------------

var PARTICIPATION = {
  SIN_TURNO: 'SIN_TURNO',
  INVITADO: 'INVITADO',
  CONFIRMADO: 'CONFIRMADO',
  CAMBIO_PENDIENTE: 'CAMBIO_PENDIENTE',
  CAMBIO_APROBADO: 'CAMBIO_APROBADO',
  NO_CONFIRMADO: 'NO_CONFIRMADO',
  NO_SHOW: 'NO_SHOW',
  CONTINGENCIA: 'CONTINGENCIA',
  AUDICIONADO: 'AUDICIONADO',
  NO_AUDICIONADO: 'NO_AUDICIONADO',
  RETIRADO: 'RETIRADO',
  RETIRO_FINAL: 'RETIRO_FINAL'
};

/** `offerPending` = this project holds an open substitute offer. */
function participationStatus(r, offerPending) {
  var attendance = normalizarComparable(r.attendance_status).replace(/[_-]+/g, ' ');
  if (attendance === 'REALIZADA') return PARTICIPATION.AUDICIONADO;
  if (attendance === 'NO AUDICIONADO') return PARTICIPATION.NO_AUDICIONADO;
  if (attendance === 'NO SHOW') return PARTICIPATION.NO_SHOW;
  if (attendance === 'CONTINGENCIA') return PARTICIPATION.CONTINGENCIA;
  var withdrawal = normalizarComparable(r.withdrawal_status);
  if (withdrawal === WITHDRAWAL.RETIRO_FINAL) return PARTICIPATION.RETIRO_FINAL;
  if (withdrawal === WITHDRAWAL.RETIRADO) return PARTICIPATION.RETIRADO;
  if (offerPending) return PARTICIPATION.INVITADO;
  if (!normalizarTexto(r.code)) return PARTICIPATION.SIN_TURNO;
  if (normalizarComparable(r.final_confirmation) === 'NO') return PARTICIPATION.NO_CONFIRMADO;
  var change = normalizarComparable(r.change_status);
  if (change === 'PENDIENTE') return PARTICIPATION.CAMBIO_PENDIENTE;
  if (normalizarComparable(r.final_confirmation) === 'SI') return PARTICIPATION.CONFIRMADO;
  if (change === 'APROBADO') return PARTICIPATION.CAMBIO_APROBADO;
  return PARTICIPATION.INVITADO;
}

// ========================================================================
// 03_core_agenda.gs
// ========================================================================

/**
 * EL BUNKER - Core: blocks, times and schedule-change rules.
 * PURE FUNCTIONS ONLY.
 */

/**
 * Auditions run 15:00-20:00 in ten 30-minute blocks of ten codes, then an
 * operational margin (20:00-20:30), then contingency (20:30-21:00), and the
 * day closes at 21:00. 100 x 3 minutes = 5 hours.
 */
var AGENDA_DEFECTO = {
  inicio_minutos: 15 * 60,        // 15:00
  duracion_bloque: 30,            // minutes
  bloques: 10,
  cupo_por_bloque: 10,
  antelacion_llegada: 15,         // minutes before the block starts
  margen_inicio: 20 * 60,         // 20:00 operational margin
  contingencia_inicio: 20 * 60 + 30, // 20:30
  contingencia_fin: 21 * 60,      // 21:00 - hard close
  tolerancia_minutos: 5,
  cupo_margen: 10                 // seats in the 20:00 margin for approved schedule changes (0 = none)
};

/**
 * With the 100 codes issued every block is full, so an approved schedule change
 * needs somewhere to go: the operational margin (20:00-20:30) works as an extra
 * block, numbered right after the last one. It only ever receives approved
 * changes; codes are never assigned to it.
 */
function marginBlockId(cfg) {
  var c = cfg || AGENDA_DEFECTO;
  return c.bloques + 1;
}

function marginAvailable(cfg) {
  var c = cfg || AGENDA_DEFECTO;
  return (Number(c.cupo_margen) || 0) > 0 && c.margen_inicio !== undefined && c.margen_inicio < c.contingencia_inicio;
}

/** "Bloque 4" or "Margen operativo": how staff and participants read a block number. */
function blockLabel(blockId, cfg) {
  var n = parseInt(blockId, 10);
  if (!n) return '';
  return n === marginBlockId(cfg) && marginAvailable(cfg) ? 'Margen operativo' : 'Bloque ' + n;
}

function minutosAHora(minutos) {
  var h = Math.floor(minutos / 60);
  var m = minutos % 60;
  return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
}

/**
 * "15:00" -> 900. Also reads the forms a spreadsheet produces when it turns a
 * typed time into a date: "1899-12-30T15:00:00" or "2026-10-23 15:00".
 */
function horaAMinutos(hora) {
  var texto = String(hora === null || hora === undefined ? '' : hora).trim();
  var m = texto.match(/^(\d{1,2}):(\d{2})/) || texto.match(/^\d{4}-\d{2}-\d{2}[T ](\d{1,2}):(\d{2})/);
  if (!m) return null;
  var h = parseInt(m[1], 10), min = parseInt(m[2], 10);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/** Block number (1..10) for a code number, or null when out of range. */
function bloqueDeNumero(numero, cfg) {
  var c = cfg || AGENDA_DEFECTO;
  if (!numero || numero < 1) return null;
  var bloque = Math.ceil(numero / c.cupo_por_bloque);
  return bloque > c.bloques ? null : bloque;
}

/** Full schedule for one block: id, window, arrival time and code range. */
function horarioDeBloque(bloque, cfg) {
  var c = cfg || AGENDA_DEFECTO;
  if (bloque === marginBlockId(c) && marginAvailable(c)) {
    return {
      block_id: bloque,
      inicio: minutosAHora(c.margen_inicio),
      fin: minutosAHora(c.contingencia_inicio),
      ventana: minutosAHora(c.margen_inicio) + '-' + minutosAHora(c.contingencia_inicio),
      arrival_time: minutosAHora(c.margen_inicio - c.antelacion_llegada),
      audition_time: minutosAHora(c.margen_inicio),
      limite_tolerancia: minutosAHora(c.margen_inicio + c.tolerancia_minutos),
      codigo_desde: '',
      codigo_hasta: '',
      margen: true
    };
  }
  if (!bloque || bloque < 1 || bloque > c.bloques) return null;

  var inicio = c.inicio_minutos + (bloque - 1) * c.duracion_bloque;
  var fin = inicio + c.duracion_bloque;
  var llegada = inicio - c.antelacion_llegada;
  var desde = (bloque - 1) * c.cupo_por_bloque + 1;
  var hasta = bloque * c.cupo_por_bloque;

  return {
    block_id: bloque,
    inicio: minutosAHora(inicio),
    fin: minutosAHora(fin),
    ventana: minutosAHora(inicio) + '-' + minutosAHora(fin),
    arrival_time: minutosAHora(llegada),
    audition_time: minutosAHora(inicio),
    limite_tolerancia: minutosAHora(inicio + c.tolerancia_minutos),
    codigo_desde: formatearCodigo(desde),
    codigo_hasta: formatearCodigo(hasta)
  };
}

/** The ten blocks plus margin and contingency, ready for the AGENDA sheet. */
function construirAgenda(cfg) {
  var c = cfg || AGENDA_DEFECTO;
  var filas = [];
  for (var b = 1; b <= c.bloques; b++) filas.push(horarioDeBloque(b, c));
  if (c.margen_inicio !== undefined && c.margen_inicio < c.contingencia_inicio) {
    var margin = marginAvailable(c) ? horarioDeBloque(marginBlockId(c), c) : null;
    filas.push({
      block_id: 'MARGEN',
      inicio: minutosAHora(c.margen_inicio),
      fin: minutosAHora(c.contingencia_inicio),
      ventana: minutosAHora(c.margen_inicio) + '-' + minutosAHora(c.contingencia_inicio),
      arrival_time: margin ? margin.arrival_time : '', audition_time: margin ? margin.audition_time : '',
      limite_tolerancia: margin ? margin.limite_tolerancia : '', codigo_desde: '', codigo_hasta: ''
    });
  }
  filas.push({
    block_id: 'CONTINGENCIA',
    inicio: minutosAHora(c.contingencia_inicio),
    fin: minutosAHora(c.contingencia_fin),
    ventana: minutosAHora(c.contingencia_inicio) + '-' + minutosAHora(c.contingencia_fin),
    arrival_time: '',
    audition_time: '',
    limite_tolerancia: '',
    codigo_desde: '',
    codigo_hasta: ''
  });
  return filas;
}

/** Schedule of the participant holding `codigo`, derived from the code itself. */
function horarioDeCodigo(codigo, cfg) {
  var n = numeroDeCodigo(codigo);
  var bloque = bloqueDeNumero(n, cfg);
  if (!bloque) return null;
  var h = horarioDeBloque(bloque, cfg);
  h.code = String(codigo).toUpperCase();
  return h;
}

// ---------------------------------------------------------------------------
// Schedule changes (Form 2)
// ---------------------------------------------------------------------------

var ESTADO_CAMBIO = {
  SIN_SOLICITUD: 'SIN_SOLICITUD',
  PENDIENTE: 'PENDIENTE',
  APROBADO: 'APROBADO',
  RECHAZADO: 'RECHAZADO'
};

/**
 * Decides whether a change request may even be recorded.
 * Rules from the spec: one request per participant, only before the cutoff,
 * only from someone who declared they cannot attend, code must exist.
 */
function puedeSolicitarCambio(registro, solicitud, opciones) {
  opciones = opciones || {};
  var ahora = opciones.ahora ? new Date(opciones.ahora) : new Date();
  var cierre = opciones.cierre_cambios ? new Date(opciones.cierre_cambios) : null;

  if (!registro) {
    return { permitido: false, motivo: 'CODIGO_NO_ENCONTRADO',
             mensaje: 'No encontramos ese código. Verifica el mensaje que recibiste.' };
  }
  if (!normalizarTexto(registro.code)) {
    return { permitido: false, motivo: 'SIN_CODIGO',
             mensaje: 'Este registro aún no tiene código asignado.' };
  }
  if (esVerdadero(solicitud.can_attend_original)) {
    return { permitido: false, motivo: 'SI_PUEDE_ASISTIR',
             mensaje: 'El formulario de cambio es solo para quien NO puede asistir en su horario.' };
  }
  var estadoActual = normalizarComparable(registro.change_status || ESTADO_CAMBIO.SIN_SOLICITUD);
  if (estadoActual !== ESTADO_CAMBIO.SIN_SOLICITUD && estadoActual !== '') {
    return { permitido: false, motivo: 'YA_SOLICITO',
             mensaje: 'Ya registramos una solicitud de cambio para este código. Solo se permite una.' };
  }
  if (cierre && ahora.getTime() > cierre.getTime()) {
    return { permitido: false, motivo: 'FUERA_DE_PLAZO',
             mensaje: 'El plazo para solicitar cambios ya cerró. El día del evento no hay cambios ordinarios.' };
  }
  return { permitido: true, motivo: '', mensaje: '' };
}

/**
 * Which blocks can absorb one more participant.
 * Capacity is per block; the participant never picks, production does.
 */
function bloquesConCupo(registros, cfg) {
  var c = cfg || AGENDA_DEFECTO;
  var conteo = {};
  var last = marginAvailable(c) ? marginBlockId(c) : c.bloques;
  for (var b = 1; b <= last; b++) conteo[b] = 0;

  for (var i = 0; i < registros.length; i++) {
    var r = registros[i];
    if (!normalizarTexto(r.code)) continue;
    var bloque = parseInt(r.final_block || r.original_block || bloqueDeNumero(numeroDeCodigo(r.code), c), 10);
    if (conteo[bloque] !== undefined) conteo[bloque]++;
  }

  var libres = [];
  for (var k = 1; k <= last; k++) {
    var h = horarioDeBloque(k, c);
    var cupo = h.margen ? Number(c.cupo_margen) : c.cupo_por_bloque;
    libres.push({
      block_id: k,
      etiqueta: blockLabel(k, c),
      ventana: h.ventana,
      ocupados: conteo[k],
      cupo: cupo,
      disponibles: Math.max(0, cupo - conteo[k]),
      margen: !!h.margen
    });
  }
  return libres;
}

/** Applies an approved change: the code never moves, only the block/time does. */
function aplicarCambio(registro, nuevoBloque, opciones) {
  opciones = opciones || {};
  var cfg = opciones.agenda || AGENDA_DEFECTO;
  var h = horarioDeBloque(parseInt(nuevoBloque, 10), cfg);
  if (!h) return { ok: false, mensaje: 'Bloque destino inválido.' };

  return {
    ok: true,
    cambios: {
      final_block: h.block_id,
      final_time: h.audition_time,
      arrival_time: h.arrival_time,
      change_status: ESTADO_CAMBIO.APROBADO,
      changed_at: opciones.ahora || new Date().toISOString(),
      changed_by: opciones.responsable || 'produccion',
      code: registro.code                                  // explicit: code is stable
    },
    horario: h
  };
}

/**
 * Where the day stands at a given minute: the running block number, or one of
 * ANTES / MARGEN / CONTINGENCIA / CERRADO. Feeds the operational indicator.
 */
function currentBlock(nowMinutes, cfg) {
  var c = cfg || AGENDA_DEFECTO;
  if (nowMinutes === null || nowMinutes === undefined) return { phase: 'DESCONOCIDO', block_id: null };
  if (nowMinutes < c.inicio_minutos) return { phase: 'ANTES', block_id: null };
  var endBlocks = c.inicio_minutos + c.bloques * c.duracion_bloque;
  if (nowMinutes < endBlocks) {
    var block = Math.floor((nowMinutes - c.inicio_minutos) / c.duracion_bloque) + 1;
    return { phase: 'BLOQUE', block_id: block };
  }
  if (nowMinutes < c.contingencia_inicio) return { phase: 'MARGEN', block_id: marginAvailable(c) ? marginBlockId(c) : null };
  if (nowMinutes < c.contingencia_fin) return { phase: 'CONTINGENCIA', block_id: null };
  return { phase: 'CERRADO', block_id: null };
}

// ---------------------------------------------------------------------------
// Human-readable dates and times for messages and screens (Spanish, Colombia)
// ---------------------------------------------------------------------------

var DAY_NAMES_ES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
var MONTH_NAMES_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
  'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** "2026-10-23" -> "viernes 23 de octubre de 2026". */
function humanDate(value) {
  var p = parsearFecha(value);
  if (!p) return String(value || '');
  var day = new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay();
  return DAY_NAMES_ES[day] + ' ' + p.d + ' de ' + MONTH_NAMES_ES[p.m - 1] + ' de ' + p.y;
}

/**
 * "HH:mm" for any stored time: "15:45", "15:45:00" or the
 * "1899-12-30T15:45:00" Sheets hands back when a cell was typed as a time.
 */
function clockText(value) {
  var m = horaAMinutos(value);
  if (m === null) return '';
  var h = Math.floor(m / 60), min = m % 60;
  return (h < 10 ? '0' : '') + h + ':' + (min < 10 ? '0' : '') + min;
}

/** "15:00" -> "3:00 p. m."; "09:30" -> "9:30 a. m.". Never shown as a raw 24 h string to participants. */
function humanTime(value) {
  var m = horaAMinutos(value);
  if (m === null) return String(value || '');
  var h = Math.floor(m / 60), min = m % 60;
  var suffix = h >= 12 ? 'p. m.' : 'a. m.';
  var h12 = h % 12 === 0 ? 12 : h % 12;
  return h12 + ':' + (min < 10 ? '0' : '') + min + ' ' + suffix;
}

/** "2026-10-22T18:00:00-05:00" -> "jueves 22 de octubre de 2026, 6:00 p. m." (the wall time as written). */
function deadlineText(value) {
  var m = String(value || '').match(/^(\d{4}-\d{2}-\d{2})[T ](\d{1,2}:\d{2})/);
  return m ? humanDate(m[1]) + ', ' + humanTime(m[2]) : '';
}

// ========================================================================
// 04_core_rubrica.gs
// ========================================================================

/**
 * EL BUNKER - Core: official jury rubric, per-juror scoring, consolidation and ranking.
 * PURE FUNCTIONS ONLY.
 *
 * Source of the rubric: "rubrica-jurado-daviarena.pdf" (the organization's official jury
 * rubric, adopted for this call on 2026-09-29). The venue named in that PDF is NOT this
 * event's venue; only the categories, factors, scale and level anchors are used, verbatim.
 *
 * The rubric is a parameter, not code: the PARAMETROS_RUBRICA sheet holds it (see
 * rubricFromRows) and RUBRIC_DEFAULT only seeds that sheet and backs the tests.
 */

var RUBRIC_VERSION_DEFAULT = 'R1-2026-09-29 (rubrica-jurado-daviarena.pdf)';
var RATING_MIN = 1;
var RATING_MAX = 5;
var RUBRIC_TOTAL_MAX = 100;

/** Level names of the 1-5 scale, as printed in the PDF. */
var RUBRIC_SCALE = [
  { nota: 1, etiqueta: 'Insuficiente' },
  { nota: 2, etiqueta: 'Regular' },
  { nota: 3, etiqueta: 'Bueno' },
  { nota: 4, etiqueta: 'Muy bueno' },
  { nota: 5, etiqueta: 'Nivel arena' }
];

/**
 * Seven categories, factors 4-4-3-3-2-2-2: rating (1-5) x factor = points, so a juror's total
 * runs from 20 (all 1) to 100 (all 5). `desempate` marks the two categories whose combined
 * points break ties (PDF: "Mayor puntaje en Presencia escénica y Factor arena combinados").
 */
var RUBRIC_DEFAULT = [
  {
    id: 'afinacion', orden: 1, factor: 4, desempate: false,
    categoria: 'Afinación y técnica vocal',
    corta: 'Afinación y técnica vocal',
    categoria_no_vocal: 'Dominio técnico de la voz/instrumento principal',
    descripcion: 'Control de tono, respiración, registro y estabilidad de la voz en vivo — sin autotune ni “salvavidas” de pista.',
    niveles: [
      'Desafinaciones frecuentes, se queda sin aire, pierde el control en notas sostenidas.',
      'Afina la mayor parte, pero se nota inseguridad técnica en los pasajes difíciles.',
      'Técnica sólida y consistente, maneja bien su registro natural.',
      'Control técnico notable, domina matices, dinámica y respiración con soltura.',
      'Técnica impecable incluso bajo la exigencia física de un show en vivo largo.'
    ]
  },
  {
    id: 'presencia', orden: 2, factor: 4, desempate: true,
    categoria: 'Presencia escénica y dominio del escenario',
    corta: 'Presencia escénica',
    categoria_no_vocal: '',
    descripcion: 'Uso del espacio, lenguaje corporal, seguridad frente al público y capacidad de “llenar” un escenario grande.',
    niveles: [
      'Rígido, de espaldas al público, no sabe qué hacer con las manos o el cuerpo.',
      'Presencia tímida, se mueve poco, le cuesta ocupar el espacio disponible.',
      'Se desenvuelve con naturalidad, mantiene contacto visual y buena postura.',
      'Carisma claro, se mueve con intención, transmite seguridad sostenida.',
      'Magnetismo escénico real: podría sostener solo un escenario grande sin apoyo visual extra.'
    ]
  },
  {
    id: 'interpretacion', orden: 3, factor: 3, desempate: false,
    categoria: 'Interpretación y conexión emocional',
    corta: 'Interpretación y conexión',
    categoria_no_vocal: '',
    descripcion: 'Qué tan creíble es lo que canta: fraseo, intención, matices actorales, si “cuenta algo” o solo ejecuta notas.',
    niveles: [
      'Interpretación plana, sin matices ni conexión con la letra.',
      'Hay algo de intención, pero se siente mecánico o forzado.',
      'Transmite la emoción de la canción de forma creíble.',
      'Fraseo personal, matices claros, genera una reacción real en quien escucha.',
      'Interpretación que eriza la piel; el jurado olvida que está calificando.'
    ]
  },
  {
    id: 'originalidad', orden: 4, factor: 3, desempate: false,
    categoria: 'Originalidad y propuesta artística',
    corta: 'Originalidad y propuesta',
    categoria_no_vocal: '',
    descripcion: 'Identidad propia: arreglos, versión personal de un cover, imagen coherente con su sonido.',
    niveles: [
      'Copia genérica de referentes, cero sello propio.',
      'Algún intento de diferenciarse, pero poco definido.',
      'Propuesta identificable, se nota una dirección artística clara.',
      'Sonido o puesta en escena distintivos, se recuerda después del show.',
      'Propuesta tan propia que podría ser su marca personal como artista.'
    ]
  },
  {
    id: 'ritmo', orden: 5, factor: 2, desempate: false,
    categoria: 'Ritmo, sincronía y trabajo con banda/pista',
    corta: 'Ritmo y sincronía',
    categoria_no_vocal: '',
    descripcion: 'Precisión rítmica, sincronía con músicos o pista, entradas y cortes limpios.',
    niveles: [
      'Se descuadra con la música, entradas y cortes desordenados.',
      'Mantiene el tiempo casi siempre, con algunos desfases.',
      'Sincronía sólida con banda o pista durante toda la presentación.',
      'Groove natural, ajusta y responde a la banda en tiempo real.',
      'Precisión de sesión profesional, cero margen de error visible.'
    ]
  },
  {
    id: 'repertorio', orden: 6, factor: 2, desempate: false,
    categoria: 'Repertorio: elección y dificultad',
    corta: 'Repertorio',
    categoria_no_vocal: '',
    descripcion: 'Si la canción elegida exige y muestra el rango real del artista, y si encaja con el público del evento.',
    niveles: [
      'Canción muy fácil o inadecuada para el formato del evento.',
      'Elección correcta pero segura, no reta al artista.',
      'Repertorio bien elegido, exige y a la vez encaja con el público.',
      'Canción exigente que el artista domina y usa a su favor.',
      'Elección estratégica: reta, encaja y “calienta” perfecto para lo que viene después.'
    ]
  },
  {
    id: 'arena', orden: 7, factor: 2, desempate: true,
    categoria: 'Factor arena: capacidad de calentar al público',
    corta: 'Factor arena',
    categoria_no_vocal: '',
    descripcion: 'Lo específico de ser telonero: ¿logra activar a un público que en realidad vino a ver a otro artista?',
    niveles: [
      'No genera reacción, el público queda indiferente.',
      'Genera algo de energía, pero se pierde o no la sostiene.',
      'Logra enganchar a buena parte del público en pocos minutos.',
      'Sube la energía de la sala de forma clara y sostenida.',
      'Deja al público listo y con hambre de más — exactamente el trabajo de un telonero.'
    ]
  }
];

/** Disqualification causes, verbatim from the PDF ("Descalifica automáticamente"). */
var DQ_CAUSES = [
  { id: 'PLAYBACK', etiqueta: 'Uso de playback sin avisarlo, en formato que exige voz en vivo.' },
  { id: 'SOUNDCHECK', etiqueta: 'Incumplimiento grave de tiempos de soundcheck o ensayo sin justificación.' },
  { id: 'CONTENIDO', etiqueta: 'Contenido discriminatorio u ofensivo en repertorio o comportamiento en tarima.' }
];

/** Tie-break methods after the automatic criterion (PDF "Criterios de desempate"). */
var TIE_METHODS = [
  { id: 'REPETIR_CANCION', etiqueta: 'Se repite una canción corta a criterio del jurado' },
  { id: 'VOTO_CALIDAD', etiqueta: 'Voto de calidad del jurado musical' }
];

/** Presentation formats where category 1 is read as voice OR main instrument. */
var NON_VOCAL_FORMATS = ['INSTRUMENTAL', 'DJ_SET', 'OTRA'];

var EVALUATION_STATE = {
  BORRADOR: 'BORRADOR',       // per card: saved, still editable by the juror
  ENVIADA: 'ENVIADA'          // per card: submitted and locked
};

/** Per-project evaluation status (prompt section 3). */
var EVALUATION_STATUS = {
  SIN_CALIFICAR: 'SIN_CALIFICAR',
  PARCIAL: 'PARCIAL',
  COMPLETA: 'COMPLETA',
  BLOQUEADA: 'BLOQUEADA',
  DQ_PENDIENTE: 'DQ_PENDIENTE',
  DESCALIFICADO: 'DESCALIFICADO'
};

var RANKING_STATUS = {
  SIN_RANKING: 'SIN_RANKING',
  RANKED: 'RANKED',
  TOP20: 'TOP20',
  TOP10_SELECCIONADO: 'TOP10_SELECCIONADO',
  TIE_REVIEW_REQUIRED: 'TIE_REVIEW_REQUIRED',
  NO_SELECCIONADO: 'NO_SELECCIONADO'
};

var DQ_STATUS = { PENDIENTE: 'PENDIENTE', VALIDADA: 'VALIDADA', DESCARTADA: 'DESCARTADA' };

// ---------------------------------------------------------------------------
// The rubric as a parameter
// ---------------------------------------------------------------------------

/** Header of the PARAMETROS_RUBRICA sheet: one row per category. */
var RUBRIC_PARAM_COLUMNS = [
  'version', 'orden', 'id', 'categoria', 'categoria_corta', 'categoria_no_vocal', 'descripcion',
  'factor', 'puntos_max', 'nivel_1', 'nivel_2', 'nivel_3', 'nivel_4', 'nivel_5', 'desempate'
];

function rubricToRows(rubric, version) {
  return (rubric || RUBRIC_DEFAULT).map(function (c) {
    return {
      version: version || RUBRIC_VERSION_DEFAULT, orden: c.orden, id: c.id, categoria: c.categoria,
      categoria_corta: c.corta, categoria_no_vocal: c.categoria_no_vocal || '', descripcion: c.descripcion,
      factor: c.factor, puntos_max: c.factor * RATING_MAX,
      nivel_1: c.niveles[0], nivel_2: c.niveles[1], nivel_3: c.niveles[2], nivel_4: c.niveles[3], nivel_5: c.niveles[4],
      desempate: c.desempate ? 'SI' : 'NO'
    };
  });
}

/** Builds the rubric from sheet rows (already read as objects), ordered by `orden`. */
function rubricFromRows(rows) {
  var list = (rows || []).filter(function (r) { return normalizarTexto(r.id); }).map(function (r) {
    return {
      id: normalizarTexto(r.id).toLowerCase(),
      orden: Number(r.orden) || 0,
      factor: Number(r.factor),
      desempate: normalizarComparable(r.desempate) === 'SI',
      categoria: normalizarTexto(r.categoria),
      corta: normalizarTexto(r.categoria_corta) || normalizarTexto(r.categoria),
      categoria_no_vocal: normalizarTexto(r.categoria_no_vocal),
      descripcion: normalizarTexto(r.descripcion),
      niveles: [r.nivel_1, r.nivel_2, r.nivel_3, r.nivel_4, r.nivel_5].map(function (n) { return normalizarTexto(n); })
    };
  });
  list.sort(function (a, b) { return a.orden - b.orden; });
  var version = rows && rows.length ? normalizarTexto(rows[0].version) : '';
  return { version: version, categorias: list };
}

/**
 * Structural checks. A rubric that fails any of them must not be used to score:
 * the caller surfaces the errors instead of silently falling back to defaults.
 */
function validateRubric(rubric) {
  var r = rubric || RUBRIC_DEFAULT;
  var errors = [];
  if (!r.length) errors.push('La rúbrica no tiene categorías.');
  var seen = {};
  var hasTieBreak = false;
  r.forEach(function (c, i) {
    var where = 'Categoría ' + (i + 1) + (c.id ? ' (' + c.id + ')' : '');
    if (!/^[a-z][a-z0-9_]*$/.test(c.id || '')) errors.push(where + ': id inválido (minúsculas, sin espacios).');
    if (seen[c.id]) errors.push(where + ': id repetido.');
    seen[c.id] = true;
    if (!(c.factor > 0) || Math.floor(c.factor) !== c.factor) errors.push(where + ': el factor debe ser un entero mayor que 0.');
    if (!c.categoria) errors.push(where + ': falta el nombre.');
    if (!c.niveles || c.niveles.length !== RATING_MAX || c.niveles.some(function (n) { return !n; })) {
      errors.push(where + ': faltan los textos de los ' + RATING_MAX + ' niveles.');
    }
    if (c.desempate) hasTieBreak = true;
  });
  var max = rubricMaxTotal(r);
  if (r.length && max !== RUBRIC_TOTAL_MAX) {
    errors.push('Los factores suman un máximo de ' + max + ' puntos; deben sumar ' + RUBRIC_TOTAL_MAX + '.');
  }
  if (r.length && !hasTieBreak) errors.push('Ninguna categoría está marcada como criterio de desempate.');
  return { ok: errors.length === 0, errores: errors };
}

function rubricMaxTotal(rubric) {
  return (rubric || RUBRIC_DEFAULT).reduce(function (s, c) { return s + c.factor * RATING_MAX; }, 0);
}

function rubricMinTotal(rubric) {
  return (rubric || RUBRIC_DEFAULT).reduce(function (s, c) { return s + c.factor * RATING_MIN; }, 0);
}

/** Short fingerprint of what changes a score (ids + factors), stamped on every card. */
function rubricFingerprint(rubric) {
  return (rubric || RUBRIC_DEFAULT).map(function (c) { return c.id + 'x' + c.factor; }).join('|');
}

/** Category name the juror reads for this participant (category 1 adapts to non-vocal formats). */
function categoryLabelFor(category, presentationFormat) {
  var format = normalizarComparable(presentationFormat).replace(/[\s-]+/g, '_');
  if (category.categoria_no_vocal && NON_VOCAL_FORMATS.indexOf(format) !== -1) return category.categoria_no_vocal;
  return category.categoria;
}

// ---------------------------------------------------------------------------
// One juror's card
// ---------------------------------------------------------------------------

function esPuntajeValido(valor) {
  if (valor === '' || valor === null || valor === undefined) return false;
  var n = Number(valor);
  return isFinite(n) && Math.floor(n) === n && n >= RATING_MIN && n <= RATING_MAX;
}

/**
 * points = rating x factor; total = sum of the categories (20-100 with the official rubric).
 * An incomplete card is INVALID (total null), never a low score.
 */
function calcularPuntajeJurado(puntajes, rubrica) {
  var r = rubrica || RUBRIC_DEFAULT;
  var detalle = [];
  var faltantes = [];
  var total = 0;
  var tieBreak = 0;

  for (var i = 0; i < r.length; i++) {
    var c = r[i];
    var raw = puntajes ? puntajes[c.id] : undefined;
    if (!esPuntajeValido(raw)) {
      faltantes.push(c.id);
      detalle.push({ id: c.id, rating: null, factor: c.factor, puntos: 0 });
      continue;
    }
    var points = Number(raw) * c.factor;
    total += points;
    if (c.desempate) tieBreak += points;
    detalle.push({ id: c.id, rating: Number(raw), factor: c.factor, puntos: points });
  }

  var valid = faltantes.length === 0;
  return {
    valido: valid,
    total: valid ? total : null,
    desempate: valid ? tieBreak : null,
    detalle: detalle,
    faltantes: faltantes
  };
}

// ---------------------------------------------------------------------------
// Consolidation (one project, several jurors)
// ---------------------------------------------------------------------------

/**
 * `tarjetas` are the SUBMITTED cards of one project: [{ jurado, puntajes }].
 * artist_final = mean of the valid juror totals, kept at full precision (round only to show).
 * desempate    = mean of the jurors' tie-break points (presence + arena).
 */
function consolidarArtista(tarjetas, rubrica) {
  var r = rubrica || RUBRIC_DEFAULT;
  var valid = [];
  var ratings = {};
  r.forEach(function (c) { ratings[c.id] = []; });

  (tarjetas || []).forEach(function (t) {
    var calc = calcularPuntajeJurado(t.puntajes, r);
    if (!calc.valido) return;
    valid.push({ jurado: t.jurado, total: calc.total, desempate: calc.desempate });
    calc.detalle.forEach(function (d) { ratings[d.id].push(d.rating); });
  });

  var meanRatings = {};
  Object.keys(ratings).forEach(function (id) {
    var list = ratings[id];
    meanRatings[id] = list.length ? list.reduce(function (s, v) { return s + v; }, 0) / list.length : null;
  });

  var n = valid.length;
  return {
    jurados_validos: n,
    totales_jurado: valid,
    artist_final: n ? valid.reduce(function (s, v) { return s + v.total; }, 0) / n : null,
    tie_break: n ? valid.reduce(function (s, v) { return s + v.desempate; }, 0) / n : null,
    promedio_por_factor: meanRatings
  };
}

/** Per-project evaluation status from its cards and disqualification state. */
function evaluationStatusOf(cards, opciones) {
  opciones = opciones || {};
  var jurors = opciones.jurados || 3;
  if (opciones.dq_status === DQ_STATUS.VALIDADA) return EVALUATION_STATUS.DESCALIFICADO;
  if (opciones.dq_status === DQ_STATUS.PENDIENTE) return EVALUATION_STATUS.DQ_PENDIENTE;
  var sent = (cards || []).filter(function (c) { return normalizarComparable(c.estado) === EVALUATION_STATE.ENVIADA; }).length;
  var drafts = (cards || []).length - sent;
  if (sent >= jurors) return opciones.resultados_cerrados ? EVALUATION_STATUS.BLOQUEADA : EVALUATION_STATUS.COMPLETA;
  if (sent === 0 && drafts === 0) return EVALUATION_STATUS.SIN_CALIFICAR;
  return EVALUATION_STATUS.PARCIAL;
}

// ---------------------------------------------------------------------------
// Ranking, cuts, ties
// ---------------------------------------------------------------------------

var SCORE_EPSILON = 1e-9;

function sameScore(a, b) {
  return Math.abs(a - b) < SCORE_EPSILON;
}

/** Final score DESC, then tie-break points DESC. 0 = genuinely tied -> human review. */
function compararArtistas(a, b) {
  if (!sameScore(a.artist_final, b.artist_final)) return b.artist_final - a.artist_final;
  if (!sameScore(a.tie_break, b.tie_break)) return b.tie_break - a.tie_break;
  return 0;
}

/** Artists tied with the one at position `cut` AND with the one right after it (the only ties that matter). */
function detectarEmpateEnCorte(ranking, cut) {
  if (ranking.length <= cut) return [];
  var inside = ranking[cut - 1];
  var outside = ranking[cut];
  if (compararArtistas(inside, outside) !== 0) return [];
  return ranking.filter(function (a) { return compararArtistas(a, inside) === 0; }).map(function (a) {
    return { code: a.code, artistic_name: a.artistic_name, artist_final: a.artist_final,
             tie_break: a.tie_break, posicion: a.posicion };
  });
}

/**
 * Ranks the auditioned projects.
 * Enter the ranking: audition REALIZADA, at least `minimo_jurados` submitted cards, not disqualified.
 * Output statuses: TOP10_SELECCIONADO (1-10), TOP20 (11-20, private), RANKED (21+),
 * TIE_REVIEW_REQUIRED (a persistent tie across position 10 or 20), SIN_RANKING (excluded).
 * The software never decides a persistent tie: a minuted deliberation for that exact cut and
 * that exact set of tied projects is required (see applyDeliberation).
 */
function seleccionarTop(artistas, opciones) {
  opciones = opciones || {};
  var topPublic = opciones.top_publico || opciones.top || 10;
  var topPrivate = Math.max(opciones.top_privado || 20, topPublic);
  var minJurors = opciones.minimo_jurados === undefined ? 3 : opciones.minimo_jurados;
  var rubric = opciones.rubrica || RUBRIC_DEFAULT;
  var deliberations = opciones.deliberaciones || (opciones.deliberacion ? [opciones.deliberacion] : []);

  var eligible = [];
  var excluded = [];

  (artistas || []).forEach(function (a) {
    var state = normalizarComparable(a.audition_status);
    if (state !== 'REALIZADA') {
      excluded.push({ code: a.code, artistic_name: a.artistic_name, motivo: 'AUDICION_NO_REALIZADA', estado: a.audition_status || '' });
      return;
    }
    if (a.dq_status === DQ_STATUS.VALIDADA) {
      excluded.push({ code: a.code, artistic_name: a.artistic_name, motivo: 'DESCALIFICADO' });
      return;
    }
    var c = consolidarArtista(a.tarjetas || [], rubric);
    if (c.jurados_validos < minJurors) {
      excluded.push({ code: a.code, artistic_name: a.artistic_name, motivo: 'JURADOS_INSUFICIENTES', jurados_validos: c.jurados_validos });
      return;
    }
    eligible.push({
      code: a.code,
      artistic_name: a.artistic_name || '',
      full_name: a.full_name || '',
      discipline: a.discipline || '',
      artist_final: c.artist_final,
      tie_break: c.tie_break,
      jurados_validos: c.jurados_validos,
      promedio_por_factor: c.promedio_por_factor,
      totales_jurado: c.totales_jurado,
      dq_pendiente: a.dq_status === DQ_STATUS.PENDIENTE
    });
  });

  eligible.sort(function (a, b) {
    var cmp = compararArtistas(a, b);
    return cmp !== 0 ? cmp : (String(a.code) < String(b.code) ? -1 : 1);   // stable display only
  });
  eligible.forEach(function (a, i) { a.posicion = i + 1; });

  var result = {
    ranking: eligible,
    excluidos: excluded,
    cortes: [],
    deliberaciones_aplicadas: [],
    deliberaciones_descartadas: []
  };

  [topPublic, topPrivate].forEach(function (cut) {
    var tied = detectarEmpateEnCorte(result.ranking, cut);
    if (!tied.length) return;
    var decision = deliberations.filter(function (d) { return Number(d.cut_position) === cut; }).pop();
    if (decision) {
      var applied = applyDeliberation(result.ranking, tied, decision);
      if (applied.ok) {
        result.ranking = applied.ranking;
        result.deliberaciones_aplicadas.push({ cut: cut, deliberation_id: decision.deliberation_id || 'ACTA' });
        return;
      }
      result.deliberaciones_descartadas.push({ cut: cut, deliberation_id: decision.deliberation_id || '', motivo: applied.motivo });
    }
    result.cortes.push({ cut: cut, empatados: tied });
  });

  var tiedCodes = {};
  result.cortes.forEach(function (c) { c.empatados.forEach(function (a) { tiedCodes[normalizarComparable(a.code)] = true; }); });

  result.ranking.forEach(function (a) {
    if (tiedCodes[normalizarComparable(a.code)]) a.ranking_status = RANKING_STATUS.TIE_REVIEW_REQUIRED;
    else if (a.posicion <= topPublic) a.ranking_status = RANKING_STATUS.TOP10_SELECCIONADO;
    else if (a.posicion <= topPrivate) a.ranking_status = RANKING_STATUS.TOP20;
    else a.ranking_status = opciones.resultados_cerrados ? RANKING_STATUS.NO_SELECCIONADO : RANKING_STATUS.RANKED;
  });
  excluded.forEach(function (e) { e.ranking_status = RANKING_STATUS.SIN_RANKING; });

  result.top10 = result.ranking.filter(function (a) { return a.ranking_status === RANKING_STATUS.TOP10_SELECCIONADO; });
  result.top20 = result.ranking.filter(function (a) { return a.posicion <= topPrivate && a.ranking_status !== RANKING_STATUS.TIE_REVIEW_REQUIRED; });
  result.top = result.top10;
  result.empates_sin_resolver = result.cortes.reduce(function (all, c) { return all.concat(c.empatados); }, []);
  result.requiere_comite = result.cortes.length > 0;
  result.dq_pendientes = result.ranking.filter(function (a) { return a.dq_pendiente; }).map(function (a) { return a.code; });
  result.top_publico = topPublic;
  result.top_privado = topPrivate;
  return result;
}

/**
 * Applies a minuted decision (repeated short song or the music juror's casting vote) to one
 * persistent tie. It only counts if it lists EXACTLY the projects tied now: if scores changed
 * after the committee met, the tie is a different one and must be decided again.
 */
function applyDeliberation(ranking, tied, decision) {
  var order = String(decision.codes_in_order || '').split(/[,\s]+/).filter(Boolean)
    .map(function (c) { return normalizarComparable(c); });
  if (Array.isArray(decision.codes_in_order)) order = decision.codes_in_order.map(function (c) { return normalizarComparable(c); });
  var tiedCodes = tied.map(function (a) { return normalizarComparable(a.code); });
  var sameSet = order.length === tiedCodes.length && tiedCodes.every(function (c) { return order.indexOf(c) !== -1; });
  if (!sameSet) return { ok: false, motivo: 'El acta no corresponde a los empatados actuales (' + tiedCodes.join(', ') + ').' };

  var tiedSet = {};
  tiedCodes.forEach(function (c) { tiedSet[c] = true; });
  var first = -1;
  for (var i = 0; i < ranking.length; i++) {
    if (tiedSet[normalizarComparable(ranking[i].code)]) { first = i; break; }
  }
  var byCode = {};
  ranking.forEach(function (a) { byCode[normalizarComparable(a.code)] = a; });
  var rest = ranking.filter(function (a) { return !tiedSet[normalizarComparable(a.code)]; });
  Array.prototype.splice.apply(rest, [first, 0].concat(order.map(function (c) { return byCode[c]; })));
  rest.forEach(function (a, idx) { a.posicion = idx + 1; });
  return { ok: true, ranking: rest };
}

/** Buckets for the dashboard chart (a juror total lives in 20-100). */
function distribucionPuntajes(ranking, rangos) {
  var bands = rangos || [
    { etiqueta: '20-39', desde: 20, hasta: 39.999 },
    { etiqueta: '40-59', desde: 40, hasta: 59.999 },
    { etiqueta: '60-69', desde: 60, hasta: 69.999 },
    { etiqueta: '70-79', desde: 70, hasta: 79.999 },
    { etiqueta: '80-89', desde: 80, hasta: 89.999 },
    { etiqueta: '90-100', desde: 90, hasta: 100 }
  ];
  return bands.map(function (b) {
    return {
      etiqueta: b.etiqueta,
      conteo: ranking.filter(function (a) { return a.artist_final >= b.desde && a.artist_final <= b.hasta; }).length
    };
  });
}

/** Rounds for DISPLAY only (dashboard averages, percentages). Never used inside the ranking. */
function redondear(value, decimals) {
  var f = Math.pow(10, decimals === undefined ? 2 : decimals);
  return Math.round(Number(value) * f) / f;
}

/** Two decimals for screens and exports; the ranking itself always uses full precision. */
function scoreText(value) {
  if (value === null || value === undefined || value === '') return '';
  return (Math.round(Number(value) * 100) / 100).toFixed(2);
}

// ========================================================================
// 05_core_estados.gs
// ========================================================================

/**
 * EL BUNKER - Core: attendance / audition state machine and day-of rules.
 * PURE FUNCTIONS ONLY.
 */

var ESTADO = {
  CONFIRMADO: 'CONFIRMADO',       // has code + slot, not arrived yet
  CHECK_IN: 'CHECK-IN',           // arrived and verified with physical ID
  PRECOLA: 'PRECOLA',             // waiting next to the stage
  EN_AUDICION: 'EN AUDICION',     // on stage right now
  NO_SHOW: 'NO SHOW',             // did not arrive / did not audition in slot
  CONTINGENCIA: 'CONTINGENCIA',   // lost the slot, waiting for a free window
  REALIZADA: 'REALIZADA',         // audition actually happened -> can be scored
  NO_AUDICIONADO: 'NO AUDICIONADO', // window closed without auditioning
  INCIDENTE: 'INCIDENTE'          // anything requiring a minuted decision
};

/**
 * Allowed transitions. Anything not listed is rejected by aplicarTransicion,
 * which is what stops the check-in desk from silently corrupting the record
 * (e.g. scoring someone who never checked in).
 */
var TRANSICIONES = {
  'CONFIRMADO':      ['CHECK-IN', 'NO SHOW', 'CONTINGENCIA', 'INCIDENTE'],
  'CHECK-IN':        ['PRECOLA', 'EN AUDICION', 'REALIZADA', 'CONTINGENCIA', 'NO SHOW', 'INCIDENTE'],
  'PRECOLA':         ['EN AUDICION', 'REALIZADA', 'CONTINGENCIA', 'NO SHOW', 'INCIDENTE'],
  'EN AUDICION':     ['REALIZADA', 'INCIDENTE'],
  'CONTINGENCIA':    ['CHECK-IN', 'PRECOLA', 'EN AUDICION', 'REALIZADA', 'NO AUDICIONADO', 'INCIDENTE'],
  'NO SHOW':         ['CONTINGENCIA', 'NO AUDICIONADO', 'INCIDENTE'],
  'REALIZADA':       ['INCIDENTE'],
  'NO AUDICIONADO':  ['INCIDENTE'],
  'INCIDENTE':       ['CHECK-IN', 'PRECOLA', 'EN AUDICION', 'CONTINGENCIA', 'REALIZADA', 'NO AUDICIONADO', 'NO SHOW']
};

/** States that mean "this person can still be selected". */
var ESTADOS_FINALES_SIN_AUDICION = ['NO SHOW', 'NO AUDICIONADO'];

function estadoValido(estado) {
  return TRANSICIONES.hasOwnProperty(normalizarEstado(estado));
}

/** Tolerates "check-in", "CHECK_IN", "no-show" etc. from operators and imports. */
function normalizarEstado(estado) {
  var e = normalizarComparable(estado).replace(/[_]+/g, '-').replace(/\s+/g, ' ').trim();
  if (e === 'CHECK IN') e = 'CHECK-IN';
  if (e === 'NO-SHOW') e = 'NO SHOW';
  if (e === 'NO-AUDICIONADO') e = 'NO AUDICIONADO';
  if (e === 'EN-AUDICION' || e === 'AUDICION') e = 'EN AUDICION';
  if (e === 'PRE-COLA' || e === 'PRE COLA') e = 'PRECOLA';
  return e;
}

/**
 * Validates and applies a state change.
 * @returns {{ok:boolean, desde:string, hacia:string, mensaje:string}}
 */
function aplicarTransicion(estadoActual, estadoNuevo, opciones) {
  opciones = opciones || {};
  var desde = normalizarEstado(estadoActual || ESTADO.CONFIRMADO) || ESTADO.CONFIRMADO;
  var hacia = normalizarEstado(estadoNuevo);

  if (!estadoValido(desde)) {
    return { ok: false, desde: desde, hacia: hacia, mensaje: 'Estado actual desconocido: ' + estadoActual };
  }
  if (!estadoValido(hacia)) {
    return { ok: false, desde: desde, hacia: hacia, mensaje: 'Estado destino desconocido: ' + estadoNuevo };
  }
  if (desde === hacia) {
    return { ok: true, desde: desde, hacia: hacia, sin_cambio: true, mensaje: 'El participante ya estaba en ' + hacia + '.' };
  }
  if (TRANSICIONES[desde].indexOf(hacia) === -1) {
    // A supervisor can force it, but it is recorded as an incident, never silent.
    if (opciones.forzar) {
      return { ok: true, desde: desde, hacia: hacia, forzado: true,
               mensaje: 'Transicion forzada por supervisor: ' + desde + ' -> ' + hacia + '. Queda en INCIDENTES.' };
    }
    return { ok: false, desde: desde, hacia: hacia,
             mensaje: 'Transicion no permitida: ' + desde + ' -> ' + hacia + '.' };
  }
  return { ok: true, desde: desde, hacia: hacia, mensaje: '' };
}

/**
 * The 5-minute rule. Given the scheduled audition time and the real arrival
 * time, decides whether the participant keeps the slot or drops to contingency.
 *
 * Spec: "Hasta 5 min tarde: se intenta conservar el turno solo si no altera el
 * flujo. Mas de 5 min tarde: pierde su turno y pasa a CONTINGENCIA."
 * The "no altera el flujo" judgement stays with the coordinator, so this
 * function returns a recommendation plus the minutes, never a silent mutation.
 */
function evaluarPuntualidad(horaAudicion, horaLlegada, cfg) {
  var c = cfg || AGENDA_DEFECTO;
  var programada = horaAMinutos(horaAudicion);
  var real = horaAMinutos(horaLlegada);

  if (programada === null || real === null) {
    return { ok: false, mensaje: 'Hora invalida.', recomendacion: null, retraso: null };
  }

  var retraso = real - programada;

  if (retraso <= 0) {
    return { ok: true, retraso: retraso, puntual: true, recomendacion: ESTADO.CHECK_IN,
             mensaje: 'A tiempo.' };
  }
  if (retraso <= c.tolerancia_minutos) {
    return { ok: true, retraso: retraso, puntual: false, dentro_tolerancia: true,
             recomendacion: ESTADO.CHECK_IN,
             mensaje: 'Llego ' + retraso + ' min tarde (dentro de la tolerancia de ' +
                      c.tolerancia_minutos + ' min). Conserva el turno SOLO si no altera el flujo; ' +
                      'la decision es del coordinador.' };
  }
  return { ok: true, retraso: retraso, puntual: false, dentro_tolerancia: false,
           recomendacion: ESTADO.CONTINGENCIA,
           mensaje: 'Llegó ' + retraso + ' min tarde (más de ' + c.tolerancia_minutos +
                    '). Pierde el turno y pasa a CONTINGENCIA. Nunca se desplaza al puntual.' };
}

/**
 * Contingency is NOT an extra group: it is people from the 100 who lost their
 * slot. Capacity is whatever time is left, so this ranks the queue and marks
 * who realistically gets in.
 *
 * Order: first come, first served by the time they entered contingency, because
 * any other criterion would be arbitrary and unpublished.
 */
function planificarContingencia(cola, opciones) {
  opciones = opciones || {};
  var cfg = opciones.agenda || AGENDA_DEFECTO;
  var ahora = opciones.ahora_minutos !== undefined
    ? opciones.ahora_minutos
    : cfg.contingencia_inicio;
  var cierre = opciones.cierre_minutos !== undefined ? opciones.cierre_minutos : cfg.contingencia_fin;
  var minutosPorAudicion = opciones.minutos_por_audicion || 3;
  var margen = opciones.margen_minutos === undefined ? 1 : margenSeguro(opciones.margen_minutos);

  var disponibles = Math.max(0, cierre - ahora);
  var cupos = Math.floor(disponibles / (minutosPorAudicion + margen));

  var ordenada = cola.slice().sort(function (a, b) {
    var ta = String(a.contingencia_desde || a.check_in_time || '');
    var tb = String(b.contingencia_desde || b.check_in_time || '');
    if (ta === tb) return String(a.code) < String(b.code) ? -1 : 1;
    return ta < tb ? -1 : 1;
  });

  var entran = [];
  var fuera = [];
  for (var i = 0; i < ordenada.length; i++) {
    if (i < cupos) {
      var inicio = ahora + i * (minutosPorAudicion + margen);
      entran.push({
        code: ordenada[i].code,
        orden: i + 1,
        hora_estimada: minutosAHora(inicio),
        estado_sugerido: ESTADO.CHECK_IN
      });
    } else {
      fuera.push({
        code: ordenada[i].code,
        orden: i + 1,
        estado_sugerido: ESTADO.NO_AUDICIONADO,
        motivo: 'SIN_TIEMPO_DISPONIBLE'
      });
    }
  }

  return {
    cupos_disponibles: cupos,
    minutos_disponibles: disponibles,
    cierre: minutosAHora(cierre),
    entran: entran,
    fuera: fuera
  };
}

function margenSeguro(v) {
  var n = Number(v);
  return isFinite(n) && n >= 0 ? n : 1;
}

/**
 * Hard close (21:00 by default): nobody starts a new audition after this.
 * Everyone still pending becomes NO AUDICIONADO, which excludes them from the
 * selection - exactly as the spec requires. Someone already ON STAGE is left
 * alone to finish; the stage manager then marks the audition as done.
 */
function cerrarJornada(registros, opciones) {
  opciones = opciones || {};
  var ahora = opciones.ahora || new Date().toISOString();
  var responsable = opciones.responsable || 'sistema';
  var cambios = [];

  for (var i = 0; i < registros.length; i++) {
    var r = registros[i];
    if (!normalizarTexto(r.code)) continue;
    var estado = normalizarEstado(r.attendance_status || ESTADO.CONFIRMADO);
    if (estado === ESTADO.REALIZADA || estado === ESTADO.NO_AUDICIONADO || estado === ESTADO.EN_AUDICION) continue;

    cambios.push({
      code: r.code,
      desde: estado,
      hacia: ESTADO.NO_AUDICIONADO,
      motivo: 'CIERRE_JORNADA',
      at: ahora,
      by: responsable
    });
  }
  return { cambios: cambios, total: cambios.length };
}

// ========================================================================
// 06_core_media.gs
// ========================================================================

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
    if (code === 200) return { status: VIDEO_STATUS.ACCESIBLE, detail: 'YouTube: público o no listado.' };
    if (code === 401 || code === 403) return { status: VIDEO_STATUS.NO_ACCESIBLE, detail: 'YouTube: video privado o con restricciones.' };
    if (code === 400 || code === 404) return { status: VIDEO_STATUS.NO_ACCESIBLE, detail: 'YouTube: el video no existe o fue eliminado.' };
    return { status: VIDEO_STATUS.NO_VERIFICABLE, detail: 'YouTube respondió ' + code + '.' };
  }
  if (provider === 'vimeo') {
    if (code === 200) return { status: VIDEO_STATUS.ACCESIBLE, detail: 'Vimeo: accesible.' };
    if (code === 404) return { status: VIDEO_STATUS.NO_ACCESIBLE, detail: 'Vimeo: el video no existe o es privado.' };
    return { status: VIDEO_STATUS.NO_VERIFICABLE, detail: 'Vimeo respondió ' + code + ' (puede tener restricciones de privacidad).' };
  }
  if (provider === 'drive' || provider === 'drive_folder') {
    if ((code === 301 || code === 302 || code === 303) && loginWall.test(loc)) {
      return { status: VIDEO_STATUS.NO_ACCESIBLE, detail: 'Drive: pide iniciar sesión. Comparte como "Cualquier persona con el enlace".' };
    }
    if (code === 200 && loginWall.test(text) && !/drive-viewer|docs-title|og:title/i.test(text)) {
      return { status: VIDEO_STATUS.NO_ACCESIBLE, detail: 'Drive: pide iniciar sesión. Comparte como "Cualquier persona con el enlace".' };
    }
    if (code === 200) return { status: VIDEO_STATUS.ACCESIBLE, detail: 'Drive: abierto a cualquier persona con el enlace.' };
    // A private file answers 401/403 to an anonymous request (measured live 2026-09-25), not only a login redirect.
    if (code === 401 || code === 403) {
      return { status: VIDEO_STATUS.NO_ACCESIBLE, detail: 'Drive: el archivo es privado. Comparte como "Cualquier persona con el enlace".' };
    }
    if (code === 404) return { status: VIDEO_STATUS.NO_ACCESIBLE, detail: 'Drive: el archivo no existe.' };
    return { status: VIDEO_STATUS.NO_VERIFICABLE, detail: 'Drive respondió ' + code + '.' };
  }
  if (provider === 'other') {
    if (code >= 200 && code < 300) return { status: VIDEO_STATUS.ACCESIBLE, detail: 'El enlace abre (HTTP ' + code + ').' };
    if (code === 401 || code === 403 || code === 404 || code === 410) {
      return { status: VIDEO_STATUS.NO_ACCESIBLE, detail: 'El enlace no abre sin permisos (HTTP ' + code + ').' };
    }
    return { status: VIDEO_STATUS.NO_VERIFICABLE, detail: 'El sitio respondió ' + code + '.' };
  }
  return { status: VIDEO_STATUS.NO_VERIFICABLE, detail: 'Esta red no permite verificar automáticamente: se revisa a mano.' };
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
    return { ok: false, error: 'El archivo supera ' + maxMb + ' MB. Comprímelo (MP3 a 192 kbps) o entrégalo en USB.' };
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

// ========================================================================
// 10_db.gs
// ========================================================================

/**
 * EL BUNKER - Data access layer over Google Sheets.
 *
 * Everything that writes goes through conBloqueo() so two simultaneous
 * submissions can never interleave an append and corrupt the code sequence.
 */

/**
 * The master spreadsheet, opened once per execution. Opening it on every read
 * cost one service call per cell of a date column (see zonaHoraria), which a
 * full rehearsal multiplied into ~100k calls.
 */
var _bookCache = { id: '', book: null };
function libro() {
  var id = PropertiesService.getScriptProperties().getProperty(PROP.SPREADSHEET_ID);
  if (!id) throw new Error('SPREADSHEET_ID no configurado. Corre setupInicial() una vez.');
  if (_bookCache.id !== id || !_bookCache.book) _bookCache = { id: id, book: SpreadsheetApp.openById(id) };
  return _bookCache.book;
}

function hoja(nombre) {
  var h = libro().getSheetByName(nombre);
  if (!h) throw new Error('Falta la hoja "' + nombre + '". Corre setupInicial().');
  return h;
}

/**
 * Serialises every mutation. 30s is generous: a submission writes one row.
 * Without this, two people hitting "Enviar" in the same second can both read
 * "last row = 40" and both write to row 41.
 */
function conBloqueo(fn, esperaMs) {
  var lock = LockService.getScriptLock();
  var ok = lock.tryLock(esperaMs === undefined ? 30000 : esperaMs);
  if (!ok) throw new Error('El sistema esta ocupado procesando otra solicitud. Intenta de nuevo en unos segundos.');
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

/**
 * Header row of a sheet, as an array of column names.
 * Cached per execution: headers only change during setup/migration, which
 * clears the cache, and re-reading them on every write doubled the calls.
 */
var _headerCache = {};
function encabezados(nombreHoja) {
  if (_headerCache[nombreHoja]) return _headerCache[nombreHoja];
  var h = hoja(nombreHoja);
  var ultima = h.getLastColumn();
  if (ultima === 0) return [];
  var cols = h.getRange(1, 1, 1, ultima).getValues()[0].map(function (c) { return String(c).trim(); });
  _headerCache[nombreHoja] = cols;
  return cols;
}

function invalidateHeaderCache() { _headerCache = {}; }

/**
 * Columns whose content must stay exactly as typed. Without plain-text format
 * Sheets turns "0012345" into 12345, "15:00" into a date and so on.
 */
var PLAIN_TEXT_COLUMNS = {
  'REGISTRO': ['id_number', 'normalized_id_number', 'whatsapp', 'normalized_phone', 'birth_date', 'group_code', 'code',
               'original_time', 'arrival_time', 'final_time', 'artistic_name', 'song_name',
               'team_code', 'person_id', 'signature_sha256', 'previous_code'],
  '_INTEGRANTES': ['id_number', 'normalized_id_number', 'birth_date', 'group_code', 'person_id', 'signature_sha256'],
  '_CAMBIOS': ['code', 'contact', 'original_time', 'nueva_hora'],
  'AGENDA': ['arrival_time', 'audition_time', 'limite_tolerancia'],
  'CHECK-IN': ['arrival_time', 'final_time', 'check_in_time'],
  'PISTAS': ['final_time'],
  'CONFIG': ['valor'],
  '_OFERTAS': ['slot_code', 'slot_arrival', 'slot_time'],
  '_SLOTS_HISTORIAL': ['slot_code'],
  '_EMAIL_LOG': ['code', 'recipient'],
  'BOLSA': ['code'],
  'SEGURO_MAYORCA': ['code', 'id_number'],
  'PARAMETROS_RUBRICA': ['version', 'id']
};

/**
 * Creates missing sheets and appends missing columns at the END of existing
 * ones. Existing data never moves, because every read and write addresses
 * columns by header name. Safe to run on a live base: it only adds.
 * Returns what it changed, for the migration report.
 */
function ensureSchema(book) {
  var report = { hojas_creadas: [], columnas_agregadas: {} };
  sheetDefinitions().forEach(function (def) {
    var name = def[0], columns = def[1];
    var sheet = book.getSheetByName(name);
    if (!sheet) {
      sheet = book.insertSheet(name);
      report.hojas_creadas.push(name);
    }
    var lastCol = sheet.getLastColumn();
    var current = lastCol ? sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function (c) { return String(c).trim(); }) : [];
    var hasHeader = current.some(function (c) { return c !== ''; });
    if (!hasHeader) {
      sheet.getRange(1, 1, 1, columns.length).setValues([columns]);
    } else {
      var missing = columns.filter(function (c) { return current.indexOf(c) === -1; });
      if (missing.length) {
        sheet.getRange(1, current.length + 1, 1, missing.length).setValues([missing]);
        report.columnas_agregadas[name] = missing;
      }
    }
    var width = Math.max(1, sheet.getLastColumn());
    sheet.getRange(1, 1, 1, width).setFontWeight('bold').setBackground('#1D1D1B').setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
    applyPlainTextColumns(sheet, name);
  });
  invalidateHeaderCache();
  var rubric = seedRubricParameters(book);
  if (rubric.sembrada) report.rubrica_sembrada = rubric.version;
  var juryHeaders = resetEmptyJuryHeaders(book);
  if (juryHeaders.length) report.encabezados_jurado_rehechos = juryHeaders;
  invalidateHeaderCache();
  return report;
}

/**
 * Writes the official rubric into PARAMETROS_RUBRICA when the sheet has no rows.
 * Existing rows are never touched: once staff edit the parameters, they are the rubric.
 * The sheet gets a warning-only protection so an accidental edit asks for confirmation.
 */
function seedRubricParameters(book) {
  var sheet = book.getSheetByName(HOJA.PARAMETROS_RUBRICA);
  if (!sheet) return { sembrada: false };
  if (!sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET).length) {
    sheet.protect().setDescription('Rúbrica oficial de jurados. Cambiarla durante el evento altera los puntajes.').setWarningOnly(true);
  }
  if (sheet.getLastRow() > 1) return { sembrada: false };
  var header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function (c) { return String(c).trim(); });
  var rows = rubricToRows(RUBRIC_DEFAULT, RUBRIC_VERSION_DEFAULT).map(function (o) {
    return header.map(function (c) { return cellValue(o[c]); });
  });
  sheet.getRange(2, 1, rows.length, header.length).setValues(rows);
  if (typeof invalidateRubricCache === 'function') invalidateRubricCache();
  return { sembrada: true, version: RUBRIC_VERSION_DEFAULT };
}

/**
 * A jury sheet with no cards is re-headed with exactly the columns of the rubric in force,
 * so the columns of an older rubric do not linger next to the new ones. A sheet that already
 * holds cards is never rewritten (ensureSchema only appends to it).
 */
function resetEmptyJuryHeaders(book) {
  var expected = juryColumns(activeRubricCategories());
  var rewritten = [];
  [HOJA.JURADO_1, HOJA.JURADO_2, HOJA.JURADO_3].forEach(function (name) {
    var sheet = book.getSheetByName(name);
    if (!sheet || sheet.getLastRow() > 1) return;
    var lastCol = sheet.getLastColumn();
    var current = lastCol ? sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function (c) { return String(c).trim(); }) : [];
    while (current.length && current[current.length - 1] === '') current.pop();
    if (current.join('|') === expected.join('|')) return;
    if (lastCol) sheet.getRange(1, 1, 1, lastCol).clearContent();
    sheet.getRange(1, 1, 1, expected.length).setValues([expected])
      .setFontWeight('bold').setBackground('#1D1D1B').setFontColor('#FFFFFF');
    rewritten.push(name);
  });
  return rewritten;
}

function applyPlainTextColumns(sheet, name) {
  var cols = PLAIN_TEXT_COLUMNS[name];
  if (!cols) return;
  var header = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0]
    .map(function (c) { return String(c).trim(); });
  var rows = Math.max(1, sheet.getMaxRows() - 1);
  var dataRows = Math.max(0, sheet.getLastRow() - 1);
  cols.forEach(function (c) {
    var idx = header.indexOf(c);
    if (idx === -1) return;
    // Read what is there BEFORE the format changes: a date in a cell that turns
    // into plain text would otherwise read back as its serial number (46297).
    var existing = dataRows ? sheet.getRange(2, idx + 1, dataRows, 1).getValues() : [];
    sheet.getRange(2, idx + 1, rows, 1).setNumberFormat('@');
    var changed = false;
    var asText = existing.map(function (r) {
      var v = r[0];
      if (v instanceof Date || typeof v === 'number' || typeof v === 'boolean') { changed = true; return [configValueAsText(v)]; }
      return [v];
    });
    if (changed) sheet.getRange(2, idx + 1, dataRows, 1).setValues(asText);
  });
}

/**
 * Reads a whole sheet as an array of objects keyed by header name.
 * Dates are returned as ISO strings so the pure core never sees Date objects.
 */
function leerHoja(nombreHoja) {
  var h = libro().getSheetByName(nombreHoja);
  if (!h) return [];
  var ultimaFila = h.getLastRow();
  var ultimaCol = h.getLastColumn();
  if (ultimaFila < 2 || ultimaCol === 0) return [];

  var valores = h.getRange(1, 1, ultimaFila, ultimaCol).getValues();
  var cols = valores[0].map(function (c) { return String(c).trim(); });
  var filas = [];

  for (var i = 1; i < valores.length; i++) {
    var obj = { _fila: i + 1 };
    var vacia = true;
    for (var j = 0; j < cols.length; j++) {
      if (!cols[j]) continue;
      var v = valores[i][j];
      if (v instanceof Date) v = Utilities.formatDate(v, zonaHoraria(), "yyyy-MM-dd'T'HH:mm:ss");
      obj[cols[j]] = v;
      if (v !== '' && v !== null) vacia = false;
    }
    if (!vacia) filas.push(obj);
  }
  return filas;
}

var _timeZoneCache = '';
function zonaHoraria() {
  if (_timeZoneCache) return _timeZoneCache;
  try { _timeZoneCache = libro().getSpreadsheetTimeZone() || 'America/Bogota'; }
  catch (e) { return 'America/Bogota'; }
  return _timeZoneCache;
}

/**
 * Value as it must be written to a cell. Text that starts with = + - @ is
 * forced to plain text with a leading apostrophe: otherwise a name typed as
 * "=HYPERLINK(...)" becomes a live formula and "+57 300..." becomes #ERROR!.
 */
function cellValue(v) {
  if (v === undefined || v === null) return '';
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  if (typeof v === 'string' && /^[=+\-@]/.test(v)) return "'" + v;
  return v;
}

/**
 * Appends one object as a row, respecting the sheet's header order.
 *
 * appendRow parses every string as if it were typed and ignores a plain-text
 * column format (measured on a live sheet 2026-09-25: '15:00' became a time,
 * '2001-04-12' a date, '3010000004' a number). A leading apostrophe is the only
 * thing it honours, so plain-text columns get one - unless cellValue already
 * added it, because a second apostrophe would stay visible. appendRow also
 * resets the format of the cells it fills, so the plain-text format is put back
 * for the next update of those cells.
 */
function agregarFila(nombreHoja, objeto) {
  var h = hoja(nombreHoja);
  var cols = encabezados(nombreHoja);
  var plain = PLAIN_TEXT_COLUMNS[nombreHoja] || [];
  var fila = cols.map(function (c) {
    var v = cellValue(objeto[c]);
    var alreadyQuoted = typeof objeto[c] === 'string' && v !== objeto[c];
    return plain.indexOf(c) !== -1 && typeof v === 'string' && v !== '' && !alreadyQuoted ? "'" + v : v;
  });
  h.appendRow(fila);
  var row = h.getLastRow();
  plainTextRuns(cols, plain).forEach(function (run) {
    h.getRange(row, run[0] + 1, 1, run[1]).setNumberFormat('@');
  });
  return row;
}

/** [[startIndex, length], ...] of the contiguous header positions that are plain text. */
function plainTextRuns(cols, plain) {
  var runs = [];
  cols.forEach(function (c, i) {
    if (plain.indexOf(c) === -1) return;
    var last = runs[runs.length - 1];
    if (last && last[0] + last[1] === i) last[1]++;
    else runs.push([i, 1]);
  });
  return runs;
}

/** Appends many rows in ONE write - the only way to stay inside the time limit. */
function agregarFilas(nombreHoja, objetos) {
  if (!objetos.length) return 0;
  var h = hoja(nombreHoja);
  var cols = encabezados(nombreHoja);
  var matriz = objetos.map(function (o) {
    return cols.map(function (c) { return cellValue(o[c]); });
  });
  h.getRange(h.getLastRow() + 1, 1, matriz.length, cols.length).setValues(matriz);
  return matriz.length;
}

/** Updates specific columns of one row, leaving every other column untouched. */
function actualizarFila(nombreHoja, numeroFila, cambios) {
  var h = hoja(nombreHoja);
  var cols = encabezados(nombreHoja);
  for (var clave in cambios) {
    if (!cambios.hasOwnProperty(clave)) continue;
    var idx = cols.indexOf(clave);
    if (idx === -1) continue;
    h.getRange(numeroFila, idx + 1).setValue(cellValue(cambios[clave]));
  }
  return numeroFila;
}

/**
 * Batched version for many rows (issuing 100 codes, re-validating, closing the
 * day). Per touched column it reads the span between the first and the last
 * row once, patches it in memory and writes it back once: 2 calls per column
 * instead of one call per cell. Callers hold the script lock, so nothing else
 * writes these cells in between.
 */
function actualizarFilasEnLote(nombreHoja, actualizaciones) {
  if (!actualizaciones.length) return 0;
  var h = hoja(nombreHoja);
  var cols = encabezados(nombreHoja);
  var porColumna = {};

  actualizaciones.forEach(function (u) {
    for (var clave in u.cambios) {
      if (!u.cambios.hasOwnProperty(clave)) continue;
      var idx = cols.indexOf(clave);
      if (idx === -1) continue;
      (porColumna[idx] = porColumna[idx] || {})[u.fila] = u.cambios[clave];
    }
  });

  var escrituras = 0;
  Object.keys(porColumna).forEach(function (idx) {
    var cambios = porColumna[idx];
    var filas = Object.keys(cambios).map(Number);
    var desde = Math.min.apply(null, filas), hasta = Math.max.apply(null, filas);
    var rango = h.getRange(desde, Number(idx) + 1, hasta - desde + 1, 1);
    var valores = rango.getValues().map(function (fila, i) {
      var n = desde + i;
      return [cellValue(cambios.hasOwnProperty(n) ? cambios[n] : fila[0])];
    });
    rango.setValues(valores);
    escrituras += filas.length;
  });
  return escrituras;
}

function buscarPorCodigo(codigo) {
  var objetivo = normalizarComparable(codigo);
  var filas = leerHoja(HOJA.REGISTRO);
  for (var i = 0; i < filas.length; i++) {
    if (normalizarComparable(filas[i].code) === objetivo) return filas[i];
  }
  return null;
}

function buscarPorCedula(cedula) {
  var objetivo = normalizarCedula(cedula);
  if (!objetivo) return null;
  var filas = leerHoja(HOJA.REGISTRO);
  for (var i = 0; i < filas.length; i++) {
    if (normalizarCedula(filas[i].id_number) === objetivo) return filas[i];
  }
  return null;
}

// ---------------------------------------------------------------------------
// Idempotency
// ---------------------------------------------------------------------------

/**
 * Guarantees an event is processed exactly once.
 *
 * A retried webhook, a double-tapped submit button or a browser that resends on
 * a flaky connection all arrive with the same key and must produce the same
 * answer without writing a second row.
 */
function unaSolaVez(clave, fn) {
  if (!clave) return fn();

  var previo = buscarIdempotencia(clave);
  if (previo) {
    try { return Object.assign({ repetido: true }, JSON.parse(previo)); }
    catch (e) { return { repetido: true, ok: true }; }
  }

  var resultado = fn();
  try {
    agregarFila(HOJA.IDEMPOTENCIA, {
      clave: clave,
      at: ahoraISO(),
      resultado: JSON.stringify(resultado).slice(0, 4000)
    });
  } catch (e) { /* never fail the operation because the ledger failed */ }
  return resultado;
}

function buscarIdempotencia(clave) {
  var h = libro().getSheetByName(HOJA.IDEMPOTENCIA);
  if (!h || h.getLastRow() < 2) return null;
  var valores = h.getRange(2, 1, h.getLastRow() - 1, 3).getValues();
  for (var i = valores.length - 1; i >= 0; i--) {          // newest first
    if (String(valores[i][0]) === String(clave)) return String(valores[i][2]);
  }
  return null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ahoraISO() {
  return Utilities.formatDate(new Date(), zonaHoraria(), "yyyy-MM-dd'T'HH:mm:ss");
}

function nuevoId(prefijo) {
  return prefijo + '-' + Utilities.getUuid().split('-')[0].toUpperCase();
}

/**
 * Writes one CONFIG value (the system's own stage flags: official list lock, results closed).
 * Adds the key when it is missing. Clears the per-execution config cache.
 */
function setConfigValue(key, value) {
  var sheet = hoja(HOJA.CONFIG);
  var last = sheet.getLastRow();
  var keys = last > 1 ? sheet.getRange(2, 1, last - 1, 1).getValues() : [];
  var text = value === undefined || value === null ? '' : String(value);
  for (var i = 0; i < keys.length; i++) {
    if (String(keys[i][0]).trim() === key) {
      sheet.getRange(i + 2, 2).setNumberFormat('@').setValue(text);
      invalidarCacheConfig();
      return;
    }
  }
  sheet.getRange(last + 1, 1, 1, 3).setValues([[key, text, '']]);
  invalidarCacheConfig();
}

/** Timestamp with the explicit -05:00 offset: Sheets keeps it as text and `new Date()` parses it exactly. */
function isoWithOffset(date) {
  return Utilities.formatDate(date || new Date(), zonaHoraria(), "yyyy-MM-dd'T'HH:mm:ssXXX");
}

// ========================================================================
// 11_auth.gs
// ========================================================================

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

  // n makes every issued link unique, so a re-issued link always differs from (and revokes) the old one.
  var payload = Utilities.base64EncodeWebSafe(JSON.stringify({
    a: alias, r: rol, e: expira.getTime(), n: Utilities.getUuid().split('-')[0]
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
  var base = webAppUrl();
  var pagina = { admin: 'admin', direccion: 'dashboard', logistica: 'admin',
                 checkin: 'checkin', jurado: 'jurado' }[rol] || 'admin';
  return base + '?p=' + pagina + '&t=' + encodeURIComponent(token);
}

/**
 * Ten-character key that travels with a team code (GRP-xxx / EQ-xxx) in the "equipo y firmas"
 * link. Team numbers are sequential and easy to guess; the key (an HMAC of the code, ~51 bits)
 * is what stops a stranger from adding people to someone else's project. Failed attempts are
 * rate limited per team code, and every link stops working after CONFIG enlaces_equipo_vencen.
 */
var TEAM_KEY_LENGTH = 10;

function groupAccessKey(groupCode) {
  var code = String(groupCode || '').trim().toUpperCase();
  if (!code) return '';
  return firmar('grp:' + code).replace(/[^A-Za-z0-9]/g, '').slice(0, TEAM_KEY_LENGTH).toUpperCase();
}

function groupKeyMatches(groupCode, key) {
  var expected = groupAccessKey(groupCode);
  return !!expected && expected === String(key || '').trim().toUpperCase();
}

// ========================================================================
// 12_log.gs
// ========================================================================

/**
 * EL BUNKER - Audit log and incidents.
 *
 * Personal data never goes into the log: only codes, ids and the shape of the
 * change. That keeps the audit trail useful without multiplying copies of
 * personal information, which the data-protection policy has to justify.
 */

function registrar(actor, rol, accion, entidad, detalle, origen) {
  try {
    agregarFila(HOJA.LOG, {
      at: ahoraISO(),
      actor: actor || 'anonimo',
      rol: rol || '',
      accion: accion,
      entidad: entidad || '',
      detalle: String(detalle === undefined ? '' : detalle).slice(0, 900),
      origen: origen || 'webapp'
    });
  } catch (e) {
    // Logging must never break the operation it is observing.
    console.error('No se pudo registrar en _LOG: ' + e.message);
  }
}

function registrarIncidente(codigo, tipo, descripcion, accion, responsable) {
  var id = nuevoId('INC');
  agregarFila(HOJA.INCIDENTES, {
    incidente_id: id,
    at: ahoraISO(),
    code: codigo || '',
    tipo: tipo,
    descripcion: String(descripcion || '').slice(0, 900),
    accion: String(accion || '').slice(0, 500),
    responsable: responsable || '',
    estado: 'ABIERTO'
  });
  registrar(responsable, '', 'INCIDENTE', codigo || '', tipo);
  return id;
}

// ========================================================================
// 20_web.gs
// ========================================================================

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
    'retirarme':          { capacidad: null, fn: accionRetirarme },
    'confirmacion_final': { capacidad: null, fn: accionConfirmacionFinal },
    'responder_oferta':   { capacidad: null, fn: accionResponderOferta },

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
    'aplicar_verificacion': { capacidad: 'registro_escritura', fn: accionAplicarVerificacion },
    'notificar_aptitud':  { capacidad: 'comunicacion',       fn: accionNotificarAptitud },
    'registro_correos':   { capacidad: 'comunicacion',       fn: accionRegistroCorreos },
    'reintentar_correos': { capacidad: 'comunicacion',       fn: accionReintentarCorreos },
    'exportar_excel':     { capacidad: 'exportar',           fn: function (d, s) { return accionExportarExcel(d, s); } },
    'exportar_seguro':    { capacidad: 'seguro',             fn: function (d, s) { return accionExportarSeguro(d, s); } },

    // ---- pool, substitutes and the official list -------------------------
    'bolsa':              { capacidad: 'reemplazos', fn: accionBolsa },
    'refrescar_bolsa':    { capacidad: 'reemplazos', fn: accionRefrescarBolsa },
    'retirar_participante': { capacidad: 'reemplazos', fn: accionRetirarParticipante },
    'ofrecer_cupo':       { capacidad: 'reemplazos', fn: accionOfrecerCupo },
    'cerrar_vacante':     { capacidad: 'reemplazos', fn: accionCerrarVacante },
    'vista_previa_lista': { capacidad: 'consolidar', fn: accionVistaPreviaLista },
    'consolidar_lista':   { capacidad: 'consolidar', fn: accionConsolidarLista },
    'desbloquear_lista':  { capacidad: '*',          fn: accionDesbloquearLista },

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
    'registrar_deliberacion': { capacidad: 'deliberar', fn: accionRegistrarDeliberacion },
    'reabrir_evaluacion': { capacidad: 'reabrir_evaluacion', fn: accionReabrirEvaluacion },
    'listar_descalificaciones': { capacidad: 'validar_dq', fn: accionListarDescalificaciones },
    'resolver_descalificacion': { capacidad: 'validar_dq', fn: accionResolverDescalificacion },
    'cerrar_resultados':  { capacidad: 'cerrar_resultados', fn: accionCerrarResultados },
    'reabrir_resultados': { capacidad: '*',           fn: accionReabrirResultados }
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

// ========================================================================
// 21_api_publico.gs
// ========================================================================

/**
 * EL BUNKER - Public actions: registration (Form 1), group members, "Mi
 * inscripción" (status + backing-track upload), schedule change (Form 2),
 * live video-link check and the public configuration.
 *
 * Every write follows the same order: replay a repeated request -> anti-abuse
 * guard -> slow work outside the lock (Drive, network) -> lock -> idempotency
 * ledger -> write. The ledger is checked INSIDE the lock: two identical
 * requests arriving together (a real double tap) wait for each other and the
 * second one gets the first one's answer instead of a second row.
 */

// ---------------------------------------------------------------------------
// Shared guards
// ---------------------------------------------------------------------------

/** How fast a person could possibly fill each form, as a share of the configured minimum. */
var MIN_FILL_FACTOR = { inscripcion: 1, integrante: 0.5, pista: 0.3, cambio: 0.5, consulta: 0 };

/**
 * Anti-abuse checks that run before anything is stored. Returns null when the
 * request may continue, or an error payload. Apps Script does not expose the
 * visitor's IP, so limits are global per minute and per ID number per hour.
 */
function guardSubmission(datos, kind) {
  if (normalizarTexto(datos.hp_field)) {
    registrar('anonimo', '', 'BLOQUEO_CAMPO_TRAMPA', kind, '');
    return { ok: false, motivo: 'TRAMPA',
             error: 'No pudimos procesar el envío. Si eres una persona, recarga la página e inténtalo de nuevo.' };
  }
  var testData = isTestData(datos);
  if (testData && !esPruebas()) {
    registrar('anonimo', '', 'BLOQUEO_DATO_DE_PRUEBA', kind, '');
    return { ok: false, motivo: 'DATO_DE_PRUEBA', error: 'Producción no admite datos de prueba.' };
  }
  if (testData) return null;                       // the rehearsal loads 130 rows in a burst on purpose

  var minMs = cfgNumero('tiempo_minimo_formulario_seg', 10) * 1000 * (MIN_FILL_FACTOR[kind] || 0);
  if (minMs > 0 && normalizarComparable(datos.source || 'WEB') === 'WEB') {
    var elapsed = Number(datos.form_elapsed_ms);
    if (!isFinite(elapsed) || elapsed < minMs) {
      registrar('anonimo', '', 'BLOQUEO_VELOCIDAD', kind, String(elapsed));
      return { ok: false, motivo: 'VELOCIDAD',
               error: 'El envío fue demasiado rápido. Revisa tus datos y vuelve a enviarlo.' };
    }
  }

  var cache = CacheService.getScriptCache();
  var minuteKey = 'rl:' + kind + ':' + Math.floor(Date.now() / 60000);
  var perMinute = Number(cache.get(minuteKey) || 0) + 1;
  cache.put(minuteKey, String(perMinute), 120);
  if (perMinute > cfgNumero('limite_envios_minuto', 30)) {
    registrar('anonimo', '', 'BLOQUEO_LIMITE_GLOBAL', kind, String(perMinute));
    return { ok: false, motivo: 'LIMITE_GLOBAL',
             error: 'Estamos recibiendo muchos envíos en este momento. Espera un minuto y vuelve a intentarlo.' };
  }
  var doc = normalizarCedula(datos.id_number);
  if (doc) {
    var docKey = 'rl:doc:' + kind + ':' + doc + ':' + Math.floor(Date.now() / 3600000);
    var perDoc = Number(cache.get(docKey) || 0) + 1;
    cache.put(docKey, String(perDoc), 3700);
    var limit = cfgNumero('limite_envios_documento_hora', 5) * (kind === 'consulta' ? 4 : 1);
    if (perDoc > limit) {
      registrar('anonimo', '', 'BLOQUEO_LIMITE_DOCUMENTO', kind, '');
      return { ok: false, motivo: 'LIMITE_DOCUMENTO',
               error: 'Hubo demasiados envíos con este documento en la última hora. Si necesitas corregir algo, escríbenos.' };
    }
  }
  return null;
}

/** The stored answer of an already-processed request, or null. Cheap: no lock. */
function replayIfRepeated(key) {
  if (!key) return null;
  var previous = buscarIdempotencia(key);
  if (!previous) return null;
  try { return Object.assign({ repetido: true }, JSON.parse(previous)); }
  catch (e) { return { repetido: true, ok: true }; }
}

/** Lock first, ledger second: see the header of this file. */
function exactlyOnce(key, fn) {
  return conBloqueo(function () { return unaSolaVez(key, fn); });
}

/**
 * The public /exec URL every link is built from. Run from the editor,
 * ScriptApp.getService().getUrl() answers the owner-only /dev URL, so the
 * deployed URL is kept in CONFIG (web_app_url) and Google's answer is only a
 * fallback.
 */
function webAppUrl() {
  var configured = normalizarTexto(cfg('web_app_url', ''));
  if (/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(configured)) return configured;
  try { return ScriptApp.getService().getUrl() || ''; } catch (e) { return ''; }
}

function membersLink(teamCode) {
  return webAppUrl() + '?p=integrantes&g=' + encodeURIComponent(teamCode) + '&k=' + groupAccessKey(teamCode);
}

/** True while the "equipo y firmas" links are valid (CONFIG enlaces_equipo_vencen, inclusive). */
function teamLinksOpen() {
  var until = cfgFecha('enlaces_equipo_vencen', '');
  if (!until) return true;
  return Utilities.formatDate(new Date(), zonaHoraria(), 'yyyy-MM-dd') <= until;
}

/** Brute-force guard on team keys: 10 wrong keys for one team code in 15 minutes lock it for a while. */
function teamKeyAttemptAllowed(code) {
  return Number(CacheService.getScriptCache().get('tk:' + code) || 0) < 10;
}
function teamKeyFailed(code) {
  var cache = CacheService.getScriptCache();
  cache.put('tk:' + code, String(Number(cache.get('tk:' + code) || 0) + 1), 900);
}

/** Validates code + key of a team link. Returns null when valid, or the error payload. */
function checkTeamAccess(code, key) {
  if (!code) return { ok: false, motivo: 'CLAVE', error: 'Falta el código del proyecto. Pide el enlace completo a quien inscribió el proyecto.' };
  if (!teamKeyAttemptAllowed(code)) {
    return { ok: false, motivo: 'BLOQUEO', error: 'Demasiados intentos con una clave incorrecta. Espera 15 minutos o pide el enlace completo.' };
  }
  if (!groupKeyMatches(code, key)) {
    teamKeyFailed(code);
    registrar('anonimo', '', 'EQUIPO_CLAVE_INVALIDA', code, '');
    return { ok: false, motivo: 'CLAVE', error: 'El código o la clave del proyecto no coinciden. Pide el enlace completo a quien inscribió el proyecto.' };
  }
  if (!teamLinksOpen()) {
    return { ok: false, motivo: 'VENCIDO', cerrado: true, error: 'Este enlace de equipo y firmas ya venció.' };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Form 1 - registration of a project (soloist, duo or group)
// ---------------------------------------------------------------------------

/**
 * Validates server-side, stores ALWAYS (never silently rejects) and answers with the receipt.
 * A complete submission is RECIBIDO: the automatic verdict is kept in eligibility_auto and
 * becomes the official aptitude only when staff apply it (RECIBIDO is never presented as APTO).
 * Codes are NOT issued here: they are issued in an operator-run batch after review.
 */
function accionInscribir(datos) {
  datos = datos || {};
  if (!cfgBool('inscripciones_abiertas', true)) {
    return { ok: false, error: 'Las inscripciones están cerradas.', cerrado: true };
  }
  var key = 'inscripcion:' + (datos.client_submission_id || Utilities.getUuid());
  var replay = replayIfRepeated(key);
  if (replay) return replay;
  var blocked = guardSubmission(datos, 'inscripcion');
  if (blocked) return blocked;

  var videoUrl = normalizarTexto(datos.video_url);
  var video = videoUrl ? cachedVideoCheck(videoUrl) : videoStatusWithoutProbe('');

  // Slow work outside the lock: the receipt id is random, so it can be chosen before the lock.
  var submissionId = nuevoId('S');
  var signature = null;
  if (normalizarTexto(datos.signature_png)) {
    signature = storeSignature(submissionId, 'INSCRITO', datos.signature_png);
    if (!signature.ok) return { ok: false, error: signature.error };
  }

  var result = exactlyOnce(key, function () { return registerProject(datos, video, submissionId, signature); });
  if (result && result.ok !== false && !result.repetido) sendNow('RECEPCION:' + result.submission_id);
  return result;
}

function registerProject(datos, video, submissionId, signature) {
  var options = opcionesValidacion();
  var verdict = validarInscripcion(datos, options);
  if (cfgBool('firma_inscripcion', true) && !signature) {
    verdict.errores.push({ campo: 'signature_png', codigo: 'FALTANTE', mensaje: 'Falta tu firma al final del formulario.' });
    if (verdict.eligibility_status === ESTADO_ELEGIBILIDAD.APTO || verdict.eligibility_status === ESTADO_ELEGIBILIDAD.EN_REVISION) {
      verdict.eligibility_status = ESTADO_ELEGIBILIDAD.INCOMPLETO;
    }
  }
  var mode = normalizeParticipationMode(datos.participation_mode);
  var group = isGroupMode(mode);
  var existing = leerHoja(HOJA.REGISTRO);
  submissionId = submissionId || nuevoId('S');

  var candidate = {
    submission_id: submissionId,
    normalized_id_number: normalizarCedula(datos.id_number),
    normalized_email: normalizarEmail(datos.email),
    normalized_phone: normalizarTelefono(datos.whatsapp)
  };
  // An INCOMPLETO registration is corrected by sending again: it never makes the new one a duplicate.
  var comparable = existing.filter(function (r) {
    return normalizeEligibility(r.eligibility_status) !== ESTADO_ELEGIBILIDAD.INCOMPLETO;
  });
  var dup = detectarDuplicado(candidate, comparable);

  var displayName = normalizarTexto(datos.artistic_name);
  var matchKey = group ? groupMatchKey(displayName) : '';
  var groupMatch = matchKey
    ? detectGroupMatch({ submission_id: submissionId, group_match_key: matchKey }, comparable)
    : { match: false, ref: '' };

  var auto = verdict.eligibility_status;
  if (auto !== ESTADO_ELEGIBILIDAD.INCOMPLETO) {
    if (dup.duplicate_flag) auto = ESTADO_ELEGIBILIDAD.DUPLICADO;
    else if ((dup.alerta || groupMatch.match) && auto === ESTADO_ELEGIBILIDAD.APTO) auto = ESTADO_ELEGIBILIDAD.EN_REVISION;
  }
  var status = auto === ESTADO_ELEGIBILIDAD.INCOMPLETO ? ESTADO_ELEGIBILIDAD.INCOMPLETO : ESTADO_ELEGIBILIDAD.RECIBIDO;

  var groupCode = group ? formatGroupCode(nextGroupNumber(existing)) : '';
  var teamCode = group ? groupCode : formatTeamCode(nextTeamNumber(existing));
  var notes = []
    .concat(verdict.errores.map(function (x) { return x.campo + ':' + x.codigo; }))
    .concat(verdict.avisos.map(function (x) { return x.campo + ':' + x.codigo; }));
  if (dup.duplicate_reason) notes.push(dup.duplicate_reason);
  if (groupMatch.match) notes.push('GRUPO_POSIBLE_REPETIDO:' + groupMatch.ref);

  var now = ahoraISO();
  var termsVersion = cfg('terms_version', '');
  var policyVersion = cfg('policy_version', '');
  var controller = dataControllerStamp();
  var usesTrack = esVerdadero(datos.track_uses);
  var genre = normalizarTexto(datos.genre_primary);
  var source = normalizarTexto(datos.source) || 'web';
  var docType = normalizeDocumentType(datos.document_type);
  var personId = personIdFor(candidate.normalized_id_number);

  var row = {
    submission_id: submissionId,
    code: '',
    created_at: now,
    source: source,
    full_name: normalizarTexto(datos.full_name),
    id_number: normalizarTexto(datos.id_number),
    birth_date: normalizarTexto(datos.birth_date),
    age: verdict.edad === null ? '' : verdict.edad,
    neighborhood_sector: normalizarTexto(datos.neighborhood_sector),
    residence: esVerdadero(datos.resides_in_sabaneta) ? cfg('municipio', 'Sabaneta') : 'FUERA',
    email: normalizarTexto(datos.email),
    whatsapp: normalizarTexto(datos.whatsapp),
    artistic_name: displayName,
    discipline: genre,                                   // legacy column, mirrors the main genre
    genre_or_proposal: genre,
    artist_description: normalizarTexto(datos.artist_description),
    audition_description: normalizarTexto(datos.audition_description),
    video_url: normalizarTexto(datos.video_url),
    technical_needs: [normalizarTexto(datos.needs), normalizarTexto(datos.needs_other)].filter(Boolean).join(' | '),
    normalized_id_number: candidate.normalized_id_number,
    normalized_email: candidate.normalized_email,
    normalized_phone: candidate.normalized_phone,
    eligibility_status: status,
    eligibility_auto: auto,
    duplicate_flag: dup.duplicate_flag,
    duplicate_reason: dup.duplicate_reason,
    registro_principal: dup.registro_principal,
    validation_notes: notes.join(' | '),
    consent_terms: esVerdadero(datos.accept_terms),
    consent_data: esVerdadero(datos.accept_data_processing),
    consent_whatsapp: esVerdadero(datos.accept_whatsapp_operational),
    consent_image: esVerdadero(datos.accept_image_voice),
    consent_version: cfg('consent_version', 'v2'),
    availability_statement: esVerdadero(datos.availability_statement),
    attendance_status: '',
    audition_status: '',
    change_status: ESTADO_CAMBIO.SIN_SOLICITUD,
    notes: '',
    participation_mode: mode,
    group_code: groupCode,
    group_display_name: group ? displayName : '',
    group_match_key: matchKey,
    group_match_status: groupMatch.match ? 'POSIBLE_REPETIDA' : '',
    group_match_ref: groupMatch.ref || '',
    members_declared: group ? normalizarTexto(datos.members_declared) : '1',
    adult_confirmation: esVerdadero(datos.adult_confirmation),
    genre_primary: genre,
    genre_secondary: normalizarTexto(datos.genre_secondary),
    presentation_format: normalizarComparable(datos.presentation_format).replace(/[\s-]+/g, '_'),
    presentation_other: normalizarTexto(datos.presentation_other),
    needs: normalizarTexto(datos.needs),
    needs_other: normalizarTexto(datos.needs_other),
    own_equipment: esVerdadero(datos.own_equipment),
    own_equipment_detail: normalizarTexto(datos.own_equipment_detail),
    song_name: normalizarTexto(datos.song_name),
    track_uses: usesTrack,
    track_method: usesTrack ? normalizarComparable(datos.track_method) : '',
    track_method_other: normalizarTexto(datos.track_method_other),
    track_status: usesTrack ? TRACK_STATUS.PENDIENTE : TRACK_STATUS.NO_APLICA,
    video_check_status: video ? video.status : VIDEO_STATUS.PENDIENTE,
    video_check_detail: video ? video.detail : '',
    video_checked_at: video && video.status !== VIDEO_STATUS.SIN_VIDEO ? now : '',
    consent_at: now,
    terms_version: termsVersion,
    policy_version: policyVersion,
    data_controller: controller,
    capture_source: 'web:formulario-1:' + cfg('consent_version', 'v2'),
    team_code: teamCode,
    document_type: docType,
    person_id: personId,
    signature_file_id: signature ? signature.file_id : '',
    signature_sha256: signature ? signature.sha256 : '',
    signature_at: signature ? now : '',
    participation_status: PARTICIPATION.SIN_TURNO
  };
  agregarFila(HOJA.REGISTRO, row);

  // The registrant is a person of the project too: their own authorization and signature.
  var registrantStatus = MEMBER_STATUS.AUTORIZADO;
  if (verdict.errores.some(function (e) { return e.codigo === 'EDAD' && verdict.edad !== null && verdict.edad < 18; })) {
    registrantStatus = MEMBER_STATUS.NO_CUMPLE;
  } else if (!esVerdadero(datos.accept_terms) || !esVerdadero(datos.accept_data_processing) ||
             !esVerdadero(datos.adult_confirmation) || (cfgBool('firma_inscripcion', true) && !signature)) {
    registrantStatus = MEMBER_STATUS.INCOMPLETO;
  }
  agregarFila(HOJA.INTEGRANTES, {
    member_id: nuevoId('M'), group_code: teamCode, project_submission_id: submissionId,
    created_at: now, updated_at: now, source: source, is_leader: true,
    full_name: row.full_name, id_number: row.id_number, normalized_id_number: candidate.normalized_id_number,
    birth_date: row.birth_date, age: row.age, adult_confirmation: row.adult_confirmation,
    artistic_role: normalizarTexto(datos.leader_role) || (group ? 'Líder / vocero' : 'Solista'),
    consent_terms: row.consent_terms, consent_data: row.consent_data, consent_image: row.consent_image, consent_at: now,
    terms_version: termsVersion, policy_version: policyVersion, data_controller: controller,
    capture_source: 'web:formulario-1', member_status: registrantStatus, member_alert: '',
    signature_file_id: row.signature_file_id, signature_sha256: row.signature_sha256, signature_at: row.signature_at,
    person_role: PERSON_ROLE.INTERPRETE, crew_role: '', on_stage: true, document_type: docType, person_id: personId,
    notes: 'Aceptación y firma en el Formulario 1'
  });

  registrar('participante', '', 'INSCRIPCION', submissionId, 'estado=' + status + ' auto=' + auto + ' equipo=' + teamCode);
  if (status === ESTADO_ELEGIBILIDAD.RECIBIDO) {
    enqueueEmail('RECEPCION', row, 'inscripcion', {}, 'RECEPCION:' + submissionId);
  }

  var complete = status === ESTADO_ELEGIBILIDAD.RECIBIDO;
  return {
    submission_id: submissionId,
    eligibility_status: status,
    estado_texto: ELIGIBILITY_LABELS[status],
    edad: verdict.edad,
    errores: complete ? [] : verdict.errores,
    avisos: [],
    participation_mode: mode,
    group_code: groupCode,
    team_code: teamCode,
    team_key: groupAccessKey(teamCode),
    members_link: membersLink(teamCode),
    whatsapp_oficial: cfg('whatsapp_oficial', ''),
    whatsapp_nombre: cfg('whatsapp_oficial_nombre', 'EL BÚNKER — Arte es la Solución'),
    mi_inscripcion_link: webAppUrl() + '?p=mi-inscripcion',
    evento: { fecha_texto: humanDate(cfgFecha('evento_fecha', '2026-10-23')), sede: cfg('evento_sede', ''),
              horario: humanTime(cfgHora('evento_hora_inicio', '15:00')) + ' – ' + humanTime(cfgHora('evento_hora_fin', '21:00')) },
    mensaje: receptionMessage(status)
  };
}

/** What the person reads right after sending. RECIBIDO is never presented as APTO. */
function receptionMessage(status) {
  if (status === ESTADO_ELEGIBILIDAD.INCOMPLETO) {
    return 'Faltan datos obligatorios. Corrige lo marcado y envía de nuevo: la nueva inscripción no quedará como duplicada.';
  }
  return 'Recibimos tu inscripción. Recibirla no significa que ya seas apto: la organización revisa cada inscripción y te ' +
    'enviará el resultado por correo. Si resultas apto, los ' + cfgNumero('cupo_total', 100) + ' turnos se asignan en orden ' +
    'de inscripción; después de ellos queda una bolsa de suplentes.';
}

// ---------------------------------------------------------------------------
// Team and signatures (every project: performers + crew)
// ---------------------------------------------------------------------------

/** The project a team code belongs to (team_code, or group_code for rows created before iteration 3). */
function findGroupProject(teamCode, rows) {
  var code = normalizarComparable(teamCode);
  return (rows || leerHoja(HOJA.REGISTRO)).filter(function (r) {
    return normalizarComparable(r.team_code) === code || (!normalizarTexto(r.team_code) && normalizarComparable(r.group_code) === code);
  })[0] || null;
}

function isCrew(m) {
  return normalizePersonRole(m.person_role) === PERSON_ROLE.EQUIPO_TRABAJO;
}

/** Performer and crew counts of a team. Crew never counts toward the declared members. No personal data. */
function groupSummary(teamCode, members) {
  var code = normalizarComparable(teamCode);
  var list = (members || leerHoja(HOJA.INTEGRANTES)).filter(function (m) {
    return normalizarComparable(m.group_code) === code;
  });
  var performers = list.filter(function (m) { return !isCrew(m); });
  var crew = list.filter(isCrew);
  var authorized = function (xs) { return xs.filter(function (m) { return normalizarComparable(m.member_status) === 'AUTORIZADO'; }).length; };
  return {
    registered: performers.length,
    authorized: authorized(performers),
    crew_registered: crew.length,
    crew_authorized: authorized(crew),
    list: list
  };
}

/** Public lookup behind the team form: confirms the project without revealing anyone's data. */
function accionConsultarAgrupacion(datos) {
  var code = normalizarComparable(datos.group_code);
  var denied = checkTeamAccess(code, datos.group_key);
  if (denied) return denied;
  var project = findGroupProject(code);
  if (!project) return { ok: false, error: 'No encontramos ese proyecto.' };
  var summary = groupSummary(code);
  return {
    group_code: code,
    group_display_name: project.group_display_name || project.artistic_name || '',
    participation_mode: project.participation_mode || 'SOLISTA',
    project_code: project.code || '',
    members_declared: Number(project.members_declared) || 1,
    members_registered: summary.registered,
    members_authorized: summary.authorized,
    crew_registered: summary.crew_registered,
    crew_authorized: summary.crew_authorized,
    crew_roles: CREW_ROLES.map(function (r) { return { id: r, etiqueta: CREW_ROLE_LABELS[r] }; }),
    document_types: DOCUMENT_TYPES.map(function (d) { return { id: d, etiqueta: DOCUMENT_TYPE_LABELS[d] }; }),
    abierto: cfgBool('integrantes_abierto', true),
    firma_obligatoria: cfgBool('firma_integrantes', true)
  };
}

/**
 * One person's own authorization for a project: a performer (on stage, part of the project) or a
 * crew member (manager, producer, technician... never takes a seat, never ranked). The same person
 * sending again with the same role updates their row; the same person in a second role gets a
 * second relation with the same person_id.
 */
function accionRegistrarIntegrante(datos) {
  datos = datos || {};
  if (!cfgBool('integrantes_abierto', true)) {
    return { ok: false, cerrado: true, error: 'El registro de equipo y firmas está cerrado.' };
  }
  var code = normalizarComparable(datos.group_code);
  var denied = checkTeamAccess(code, datos.group_key);
  if (denied) return denied;
  var key = 'integrante:' + (datos.client_submission_id || Utilities.getUuid());
  var replay = replayIfRepeated(key);
  if (replay) return replay;
  var blocked = guardSubmission(datos, 'integrante');
  if (blocked) return blocked;

  var validation = validateMember(datos, {
    edad_minima: cfgNumero('integrantes_edad_minima', 18),
    fecha_evento: cfgFecha('evento_fecha', '2026-10-23'),
    firma_obligatoria: cfgBool('firma_integrantes', true)
  });
  var role = validation.person_role;
  var crew = role === PERSON_ROLE.EQUIPO_TRABAJO;
  var norm = normalizarCedula(datos.id_number);
  var sameRelation = function (m) { return normalizarCedula(m.normalized_id_number) === norm && normalizePersonRole(m.person_role) === role; };
  var before = groupSummary(code).list.filter(sameRelation)[0];
  var memberId = before ? before.member_id : nuevoId('M');

  var signature = null;
  if (normalizarTexto(datos.signature_png)) {
    signature = storeSignature(code, memberId, datos.signature_png);            // Drive, outside the lock
    if (!signature.ok) return { ok: false, error: signature.error };
  }

  return exactlyOnce(key, function () {
    var projects = leerHoja(HOJA.REGISTRO);
    var project = findGroupProject(code, projects);
    if (!project) return { ok: false, error: 'No encontramos ese proyecto.' };
    var allMembers = leerHoja(HOJA.INTEGRANTES);
    var summary = groupSummary(code, allMembers);
    var existing = summary.list.filter(sameRelation)[0];

    var alerts = [];
    allMembers.forEach(function (m) {
      if (normalizarCedula(m.normalized_id_number) === norm && normalizarComparable(m.group_code) !== code) {
        alerts.push('TAMBIEN_EN_' + m.group_code);
      }
    });
    projects.forEach(function (r) {
      if (r.submission_id !== project.submission_id && normalizarCedula(r.normalized_id_number || r.id_number) === norm) {
        alerts.push('TAMBIEN_INSCRITO_' + (r.code || r.submission_id));
      }
    });
    var declared = Number(project.members_declared) || 1;
    if (!crew) {
      var registeredAfter = summary.registered + (existing ? 0 : 1);
      if (registeredAfter > declared) alerts.push('SUPERA_INTEGRANTES_DECLARADOS');
    }

    var now = ahoraISO();
    var row = {
      group_code: code, project_submission_id: project.submission_id, updated_at: now,
      source: normalizarTexto(datos.source) || 'web', is_leader: existing ? esVerdadero(existing.is_leader) : false,
      full_name: normalizarTexto(datos.full_name), id_number: normalizarTexto(datos.id_number),
      normalized_id_number: norm, birth_date: normalizarTexto(datos.birth_date),
      age: validation.age === null ? '' : validation.age,
      adult_confirmation: esVerdadero(datos.adult_confirmation),
      artistic_role: crew ? '' : normalizarTexto(datos.artistic_role),
      person_role: role,
      crew_role: crew ? normalizarComparable(datos.crew_role).replace(/[^A-Z]/g, '') : '',
      on_stage: crew ? esVerdadero(datos.on_stage) : true,
      document_type: normalizeDocumentType(datos.document_type),
      person_id: personIdFor(norm),
      consent_terms: esVerdadero(datos.accept_terms), consent_data: esVerdadero(datos.accept_data_processing),
      consent_image: esVerdadero(datos.accept_image_voice), consent_at: now,
      terms_version: cfg('terms_version', ''), policy_version: cfg('policy_version', ''),
      data_controller: dataControllerStamp(), capture_source: 'web:formulario-equipo',
      member_status: validation.status, member_alert: alerts.join(' | ')
    };
    if (signature) {
      row.signature_file_id = signature.file_id;
      row.signature_sha256 = signature.sha256;
      row.signature_at = now;
    }

    if (existing) {
      actualizarFila(HOJA.INTEGRANTES, existing._fila, row);
      registrar('integrante', '', 'INTEGRANTE_ACTUALIZADO', code, existing.member_id + ' rol=' + role + ' estado=' + validation.status);
    } else {
      row.member_id = memberId;
      row.created_at = now;
      agregarFila(HOJA.INTEGRANTES, row);
      registrar('integrante', '', 'INTEGRANTE', code, memberId + ' rol=' + role + ' estado=' + validation.status);
    }

    var after = groupSummary(code);
    var okText = crew
      ? 'Quedaste registrado(a) como equipo de trabajo del proyecto. No ocupas cupo ni participas en la calificación.'
      : 'Tu autorización quedó registrada. Ya van ' + after.authorized + ' de ' + declared + ' intérpretes autorizados.';
    return {
      member_id: existing ? existing.member_id : memberId,
      member_status: validation.status,
      person_role: role,
      actualizado: !!existing,
      errores: validation.errors,
      group: {
        code: code,
        name: project.group_display_name || project.artistic_name,
        declared: declared,
        registered: after.registered,
        authorized: after.authorized,
        crew_registered: after.crew_registered
      },
      mensaje: validation.status === MEMBER_STATUS.AUTORIZADO
        ? okText
        : (validation.status === MEMBER_STATUS.NO_CUMPLE
            ? 'Cada persona del proyecto debe ser mayor de edad el día del evento. Tu registro quedó guardado y la organización lo revisará.'
            : 'Faltan datos o autorizaciones. Corrige lo marcado y envía de nuevo.')
    };
  });
}

// ---------------------------------------------------------------------------
// "Mi inscripción": status, group link recovery and backing-track upload
// ---------------------------------------------------------------------------

/**
 * Finds a project by code (also a code it held before withdrawing) or receipt, and proves
 * identity with the ID number.
 */
function findOwnProject(datos) {
  var doc = normalizarCedula(datos.id_number);
  if (!doc) return null;
  var code = normalizarComparable(datos.code);
  var receipt = normalizarComparable(datos.submission_id);
  var rows = leerHoja(HOJA.REGISTRO);
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    var previous = String(r.previous_code || '').toUpperCase().split(/[,\s]+/);
    var byCode = code && (normalizarComparable(r.code) === code || previous.indexOf(code) !== -1);
    var byReceipt = receipt && normalizarComparable(r.submission_id) === receipt;
    if ((byCode || byReceipt) && normalizarCedula(r.normalized_id_number || r.id_number) === doc) return r;
  }
  return null;
}

/** One sentence for the person, from the official states (never from the automatic verdict). */
function friendlyStatus(r, offer) {
  var e = normalizeEligibility(r.eligibility_status);
  var w = normalizarComparable(r.withdrawal_status);
  if (w) return 'Liberaste tu cupo' + (r.previous_code ? ' (' + r.previous_code + ')' : '') + '. Gracias por avisar.';
  if (offer) return 'Se liberó un cupo para ti: responde la oferta antes de que venza.';
  if (normalizarTexto(r.code)) return 'Tienes turno. Este es tu código y tu horario.';
  if (e === 'RECIBIDO') return 'Recibimos tu inscripción. La organización la está revisando: te escribiremos con el resultado.';
  if (e === 'EN_REVISION') return 'Tu inscripción está en revisión por la organización.';
  if (e === 'APTO') {
    var pool = normalizarComparable(r.pool_status);
    if (pool === 'SUPLENTE') return 'Eres apto y estás en la bolsa de suplentes: si se libera un cupo para ti, te avisaremos.';
    if (pool === 'FUERA_DE_BOLSA') return 'Eres apto. Los turnos y la bolsa de suplentes están completos.';
    if (pool === 'DECLINO') return 'Eres apto. No aceptaste el cupo ofrecido, así que ya no recibirás nuevas ofertas.';
    return 'Eres apto y estás en espera de la asignación de turnos (en orden de inscripción).';
  }
  if (e === 'INCOMPLETO') return 'A tu inscripción le faltan datos obligatorios: envía el formulario de nuevo con los datos completos.';
  if (e === 'NO_APTO') return 'Tu inscripción no cumple los requisitos de la convocatoria.';
  if (e === 'DUPLICADO') return 'Esta inscripción está duplicada: vale la primera que enviaste.';
  return 'Inscripción recibida.';
}

function accionMiInscripcion(datos) {
  var blocked = guardSubmission(datos, 'consulta');
  if (blocked) return blocked;
  var r = findOwnProject(datos);
  if (!r) return { ok: false, error: 'No encontramos una inscripción con esos datos. Revisa tu documento y tu código o comprobante.' };

  var team = null;
  var teamCode = teamCodeOf(r);
  if (teamCode) {
    var summary = groupSummary(teamCode);
    team = {
      code: teamCode,
      key: groupAccessKey(teamCode),
      link: membersLink(teamCode),
      open: teamLinksOpen() && cfgBool('integrantes_abierto', true),
      declared: Number(r.members_declared) || 1,
      registered: summary.registered,
      authorized: summary.authorized,
      crew_registered: summary.crew_registered,
      members: summary.list.map(function (m) {
        var parts = normalizarTexto(m.full_name).split(' ');
        return {
          name: parts[0] + (parts.length > 1 ? ' ' + parts[parts.length - 1].charAt(0) + '.' : ''),
          role: isCrew(m) ? (CREW_ROLE_LABELS[m.crew_role] || 'Equipo') : m.artistic_role,
          crew: isCrew(m), status: m.member_status, leader: esVerdadero(m.is_leader),
          signed: !!normalizarTexto(m.signature_file_id)
        };
      })
    };
  }

  var offer = leerHoja(HOJA.OFERTAS).filter(function (o) {
    return o.submission_id === r.submission_id && normalizarComparable(o.estado) === OFFER_STATUS.PENDIENTE && !offerExpired(o);
  })[0];
  var w = currentWindows();
  var hasSlot = !!normalizarTexto(r.code);
  var eligibility = normalizeEligibility(r.eligibility_status);

  return {
    submission_id: r.submission_id,
    eligibility_status: eligibility,
    estado_label: ELIGIBILITY_LABELS[eligibility] || eligibility,
    estado_texto: friendlyStatus(r, offer),
    participation_status: r.participation_status || participationStatus(r, !!offer),
    pool_status: normalizarComparable(r.pool_status),
    artistic_name: r.artistic_name,
    participation_mode: r.participation_mode || 'SOLISTA',
    code: r.code || '',
    previous_code: r.previous_code || '',
    withdrawal_status: r.withdrawal_status || '',
    bloque: hasSlot ? (r.final_block || r.original_block || '') : '',
    hora_llegada: hasSlot && r.arrival_time ? humanTime(r.arrival_time) : '',
    hora_audicion: hasSlot && (r.final_time || r.original_time) ? humanTime(r.final_time || r.original_time) : '',
    fecha_texto: humanDate(cfgFecha('evento_fecha', '2026-10-23')),
    lugar: cfg('evento_sede', ''),
    change_status: r.change_status || ESTADO_CAMBIO.SIN_SOLICITUD,
    final_confirmation: normalizarComparable(r.final_confirmation),
    acciones: {
      retiro: hasSlot && w.retiro_abierto,
      confirmacion_final: hasSlot && w.confirmacion_abierta,
      lista_bloqueada: w.lista_bloqueada,
      retiro_desde_texto: deadlineText(cfg('reemplazos_desde', '')),
      confirmacion_desde_texto: deadlineText(cfg('confirmacion_final_desde', '')),
      confirmacion_hasta_texto: deadlineText(cfg('confirmacion_final_hasta', '')),
      palabra_confirmacion: WITHDRAW_CONFIRMATION
    },
    oferta: offer ? {
      oferta_id: offer.oferta_id, slot_code: offer.slot_code,
      hora_llegada: humanTime(clockText(offer.slot_arrival) || offer.slot_arrival),
      hora_audicion: humanTime(clockText(offer.slot_time) || offer.slot_time),
      vence_texto: humanDateTime(offer.expires_at)
    } : null,
    song_name: r.song_name || '',
    track: {
      uses: esVerdadero(r.track_uses),
      method: r.track_method || '',
      status: r.track_status || (esVerdadero(r.track_uses) ? TRACK_STATUS.PENDIENTE : TRACK_STATUS.NO_APLICA),
      file_name: r.track_file_name || '',
      updated_at: r.track_updated_at || '',
      can_upload: hasSlot && cfgBool('pistas_abiertas', true),
      max_mb: cfgNumero('pista_max_mb', 15),
      formats: cfg('pista_formatos', 'mp3,wav,m4a,aac,ogg,flac')
    },
    video: { status: r.video_check_status || '', detail: r.video_check_detail || '' },
    group: team,
    whatsapp_oficial: cfg('whatsapp_oficial', ''),
    whatsapp_nombre: cfg('whatsapp_oficial_nombre', '')
  };
}

/**
 * Backing-track upload (method 1 of the brief: file received before the day).
 * Only after a B-XXX code exists, and only by whoever holds the code AND the
 * ID number of the registration.
 */
function accionSubirPista(datos) {
  datos = datos || {};
  if (!cfgBool('pistas_abiertas', true)) return { ok: false, cerrado: true, error: 'La recepción de pistas está cerrada.' };
  var key = 'pista:' + (datos.client_submission_id || Utilities.getUuid());
  var replay = replayIfRepeated(key);
  if (replay) return replay;
  var blocked = guardSubmission(datos, 'pista');
  if (blocked) return blocked;

  var row = findOwnProject({ id_number: datos.id_number, code: datos.code });
  if (!row) return { ok: false, error: 'El código y el documento no coinciden con una inscripción.' };
  if (!normalizarTexto(row.code)) {
    return { ok: false, error: 'La pista se envía después de recibir tu código B-XXX.' };
  }
  var stored = storeTrack(row, datos.file_name, datos.file_base64, datos.song_name);   // Drive, outside the lock
  if (!stored.ok) {
    registrar('participante', '', 'PISTA_RECHAZADA', row.code, stored.error);
    return stored;
  }
  return exactlyOnce(key, function () { return recordTrack(row.code, stored, datos.song_name, 'ARCHIVO', 'participante'); });
}

/** Writes the stored file into REGISTRO. Shared by the participant and the admin upload. */
function recordTrack(code, stored, songName, method, actor) {
  var fresh = buscarPorCodigo(code);
  var now = ahoraISO();
  actualizarFila(HOJA.REGISTRO, fresh._fila, {
    track_uses: true,
    track_method: normalizarTexto(fresh.track_method) || method,
    track_status: TRACK_STATUS.RECIBIDA,
    track_file_id: stored.file_id,
    track_file_name: stored.file_name,
    track_updated_at: now,
    song_name: normalizarTexto(songName) || fresh.song_name || ''
  });
  registrar(actor, '', 'PISTA_RECIBIDA', code, stored.file_name + ' (' + stored.bytes + ' bytes)');
  return { code: code, track_status: TRACK_STATUS.RECIBIDA, track_file_name: stored.file_name, bytes: stored.bytes,
           mensaje: 'Recibimos tu pista como ' + stored.file_name + '. El día del evento lleva también una copia en USB.' };
}

// ---------------------------------------------------------------------------
// Live video-link check (called while the person fills Form 1)
// ---------------------------------------------------------------------------

function accionVerificarVideo(datos) {
  var url = normalizarTexto(datos.video_url);
  if (!url) return { status: VIDEO_STATUS.SIN_VIDEO, detail: '' };
  if (!cfgBool('verificar_videos', true)) return { status: VIDEO_STATUS.PENDIENTE, detail: 'Se revisará después.' };
  var cache = CacheService.getScriptCache();
  var minuteKey = 'rl:video:' + Math.floor(Date.now() / 60000);
  var n = Number(cache.get(minuteKey) || 0) + 1;
  cache.put(minuteKey, String(n), 120);
  if (n > 60) return { status: VIDEO_STATUS.PENDIENTE, detail: 'Lo revisaremos después de tu envío.' };
  return checkVideoUrl(url);
}

// ---------------------------------------------------------------------------
// Form 2 - schedule change
// ---------------------------------------------------------------------------

/** Records the request only; the new slot is decided by production, never chosen by the participant. */
function accionSolicitarCambio(datos) {
  if (!cfgBool('cambios_abiertos', true) || cfgBool('lista_oficial_bloqueada', false)) {
    return { ok: false, error: 'El plazo para solicitar cambios de horario ya cerró.', cerrado: true };
  }
  var key = 'cambio:' + normalizarComparable(datos.participant_code) + ':' + (datos.client_submission_id || '');
  var replay = replayIfRepeated(key);
  if (replay) return replay;
  var blocked = guardSubmission(datos, 'cambio');
  if (blocked) return blocked;

  return exactlyOnce(key, function () {
    var registro = buscarPorCodigo(datos.participant_code);
    var permiso = puedeSolicitarCambio(registro, datos, {
      ahora: new Date().toISOString(),
      cierre_cambios: cfg('cierre_cambios', '')
    });
    if (!permiso.permitido) return { ok: false, error: permiso.mensaje, motivo: permiso.motivo };

    // Guard against someone else guessing a code: the name must match.
    if (normalizarComparable(datos.full_name) !== normalizarComparable(registro.full_name)) {
      registrar('participante', '', 'CAMBIO_NOMBRE_NO_COINCIDE', datos.participant_code, '');
      return { ok: false, error: 'El nombre no coincide con el registrado para ese código.', motivo: 'NOMBRE_NO_COINCIDE' };
    }

    var solicitudId = nuevoId('CB');
    var horario = horarioDeCodigo(registro.code, agendaConfigurada());
    agregarFila(HOJA.CAMBIOS, {
      solicitud_id: solicitudId, at: ahoraISO(), code: registro.code, full_name: registro.full_name,
      original_block: registro.original_block || (horario ? horario.block_id : ''),
      original_time: clockText(registro.original_time) || (horario ? horario.audition_time : ''),
      can_attend_original: 'FALSE', reason_short: String(datos.reason_short || '').slice(0, 400),
      contact: normalizarTexto(datos.contact), acceptance: esVerdadero(datos.acceptance) ? 'TRUE' : 'FALSE',
      estado: ESTADO_CAMBIO.PENDIENTE, nuevo_bloque: '', nueva_hora: '', resuelto_at: '', resuelto_by: '', observacion: '',
      notificacion_estado: 'CORREO EN COLA'
    });
    actualizarFila(HOJA.REGISTRO, registro._fila, { change_requested: 'TRUE', change_status: ESTADO_CAMBIO.PENDIENTE,
                                                    participation_status: PARTICIPATION.CAMBIO_PENDIENTE });
    registrar('participante', '', 'SOLICITUD_CAMBIO', registro.code, solicitudId);
    enqueueEmail('CAMBIO_SOLICITADO', Object.assign({}, registro, { change_status: ESTADO_CAMBIO.PENDIENTE }), 'cambio',
                 { solicitud_id: solicitudId }, 'CAMBIO_SOLICITADO:' + solicitudId);
    return {
      solicitud_id: solicitudId, estado: ESTADO_CAMBIO.PENDIENTE,
      mensaje: 'Registramos tu solicitud. Producción te confirmará por WhatsApp o correo si es APROBADA o NO APROBADA. ' +
               'Mientras tanto tu horario original sigue vigente.'
    };
  });
}

/** Kept for compatibility with iteration-1 links: status by code or ID number. */
function accionConsultarEstado(datos) {
  var registro = null;
  if (datos.code) registro = buscarPorCodigo(datos.code);
  else if (datos.id_number) registro = buscarPorCedula(datos.id_number);
  if (!registro) return { ok: false, error: 'No encontramos un registro con esos datos.' };
  if (normalizarCedula(datos.id_number) !== normalizarCedula(registro.id_number)) {
    return { ok: false, error: 'Los datos no coinciden. Verifica tu documento y tu código.' };
  }
  return {
    code: registro.code || '',
    eligibility_status: registro.eligibility_status,
    bloque: registro.final_block || registro.original_block || '',
    hora_llegada: registro.arrival_time ? humanTime(registro.arrival_time) : '',
    hora_audicion: (registro.final_time || registro.original_time) ? humanTime(registro.final_time || registro.original_time) : '',
    change_status: registro.change_status || ESTADO_CAMBIO.SIN_SOLICITUD,
    attendance_status: registro.attendance_status || ''
  };
}

function accionAgendaPublica() {
  return { agenda: construirAgenda(agendaConfigurada()) };
}

/** Only the values meant to be public; the CONFIG sheet also holds internals. */
function accionConfigPublica() {
  var fecha = cfgFecha('evento_fecha', '2026-10-23');
  var inicio = cfgHora('evento_hora_inicio', '15:00');
  var fin = cfgHora('evento_hora_fin', '21:00');
  return {
    evento: {
      nombre: cfg('evento_nombre', 'EL BÚNKER'),
      fecha: fecha,
      fecha_texto: humanDate(fecha),
      hora_inicio: inicio,
      hora_fin: fin,
      hora_inicio_texto: humanTime(inicio),
      hora_fin_texto: humanTime(fin),
      sede: cfg('evento_sede', ''),
      municipio_sede: cfg('evento_municipio_sede', 'Sabaneta, Antioquia'),
      municipio: cfg('municipio', 'Sabaneta'),
      edad_minima: cfgNumero('edad_minima', 18),
      edad_maxima: cfgNumero('edad_maxima', 30),
      duracion_audicion: cfgNumero('duracion_audicion_min', 3),
      cupo: cfgNumero('cupo_total', 100),
      top: cfgNumero('top_seleccionados', 10),
      bolsa: cfgNumero('bolsa_aptos', 200),
      reemplazos_desde_texto: deadlineText(cfg('reemplazos_desde', '')),
      confirmacion_final_texto: deadlineText(cfg('confirmacion_final_desde', '')),
      jurados: cfgNumero('jurados', 3),
      integrantes_max: cfgNumero('integrantes_max', 15)
    },
    legal: {
      legal_name: cfg('legal_name', ''),
      nit: cfg('nit', ''),
      legal_address: cfg('legal_address', ''),
      data_protection_email: cfg('data_protection_email', ''),
      institutional_phone: cfg('institutional_phone', ''),
      terms_url: cfg('terms_url', ''),
      privacy_policy_url: cfg('privacy_policy_url', ''),
      terms_version: cfg('terms_version', ''),
      policy_version: cfg('policy_version', 'v2'),
      consent_version: cfg('consent_version', 'v2')
    },
    contacto: {
      whatsapp_oficial: cfg('whatsapp_oficial', ''),
      whatsapp_nombre: cfg('whatsapp_oficial_nombre', 'EL BÚNKER — Arte es la Solución'),
      sitio_url: cfg('sitio_url', '')
    },
    formularios: {
      pista_max_mb: cfgNumero('pista_max_mb', 15),
      pista_formatos: cfg('pista_formatos', 'mp3,wav,m4a,aac,ogg,flac'),
      verificar_videos: cfgBool('verificar_videos', true),
      firma_integrantes: cfgBool('firma_integrantes', true),
      firma_inscripcion: cfgBool('firma_inscripcion', true),
      document_types: DOCUMENT_TYPES.map(function (d) { return { id: d, etiqueta: DOCUMENT_TYPE_LABELS[d] }; }),
      exigir_video: cfgBool('exigir_video', false)
    },
    entorno: entorno(),
    abierto: cfgBool('inscripciones_abiertas', true),
    cambios_abiertos: cfgBool('cambios_abiertos', true),
    cierre_cambios_texto: deadlineText(cfg('cierre_cambios', '')),
    integrantes_abierto: cfgBool('integrantes_abierto', true),
    pistas_abiertas: cfgBool('pistas_abiertas', true)
  };
}

// ========================================================================
// 22_api_admin.gs
// ========================================================================

/**
 * EL BUNKER - Logistics and admin actions.
 * Everything a non-technical coordinator needs, with no SQL and no code edits.
 */

/** Fields the logistics table shows. Personal data stays out of the direction view. */
function registryRowView(r) {
  return {
    fila: r._fila, submission_id: r.submission_id, code: r.code,
    created_at: r.created_at, full_name: r.full_name, id_number: r.id_number,
    age: r.age, neighborhood_sector: r.neighborhood_sector, email: r.email,
    whatsapp: r.whatsapp, artistic_name: r.artistic_name,
    participation_mode: r.participation_mode || (r.discipline ? 'SOLISTA' : ''),
    genre_primary: projectGenre(r), members_declared: r.members_declared,
    group_code: r.group_code, group_match_status: r.group_match_status, group_match_ref: r.group_match_ref,
    video_url: r.video_url, video_check_status: r.video_check_status, video_check_detail: r.video_check_detail,
    track_status: r.track_status, eligibility_status: normalizeEligibility(r.eligibility_status),
    eligibility_auto: normalizeEligibility(r.eligibility_auto), eligibility_override: r.eligibility_override,
    team_code: teamCodeOf(r), document_type: r.document_type, priority_rank: r.priority_rank,
    pool_status: r.pool_status, participation_status: r.participation_status, withdrawal_status: r.withdrawal_status,
    previous_code: r.previous_code, final_confirmation: r.final_confirmation, evaluation_status: r.evaluation_status,
    ranking_status: r.ranking_status, dq_status: r.dq_status,
    duplicate_flag: r.duplicate_flag, duplicate_reason: r.duplicate_reason,
    validation_notes: r.validation_notes,
    original_block: r.original_block, original_time: clockText(r.original_time),
    final_block: r.final_block, final_time: clockText(r.final_time),
    change_status: r.change_status, attendance_status: r.attendance_status,
    consent_whatsapp: r.consent_whatsapp, consent_image: r.consent_image,
    terms_version: r.terms_version, legacy: !r.participation_mode
  };
}

/** Main genre, falling back to the iteration-1 "discipline" for older rows. */
function projectGenre(r) {
  return normalizarTexto(r.genre_primary) || normalizarTexto(r.discipline);
}

function filterRegistry(filas, datos) {
  var filtro = normalizarComparable(datos.filtro || '');
  var busqueda = normalizarComparable(datos.q || '');
  return filas.filter(function (r) {
    if (filtro && filtro !== 'TODOS') {
      var elig = normalizeEligibility(r.eligibility_status);
      if (filtro === 'AGRUPACIONES') { if (!r.group_code) return false; }
      else if (filtro === 'CON_CODIGO') { if (!normalizarTexto(r.code)) return false; }
      else if (filtro === 'POR_REVISAR') { if (elig !== 'RECIBIDO' && elig !== 'EN_REVISION') return false; }
      else if (filtro === 'SUPLENTES') { if (normalizarComparable(r.pool_status) !== POOL_STATUS.SUPLENTE) return false; }
      else if (filtro === 'RETIRADOS') { if (!isWithdrawn(r)) return false; }
      else if (elig !== normalizeEligibility(filtro)) return false;
    }
    if (!busqueda) return true;
    return normalizarComparable(r.full_name).indexOf(busqueda) !== -1 ||
           normalizarComparable(r.code).indexOf(busqueda) !== -1 ||
           normalizarComparable(r.group_code).indexOf(busqueda) !== -1 ||
           (normalizarCedula(datos.q) && normalizarCedula(r.id_number).indexOf(normalizarCedula(datos.q)) !== -1) ||
           normalizarComparable(r.artistic_name).indexOf(busqueda) !== -1;
  });
}

function accionListarRegistro(datos) {
  var filas = leerHoja(HOJA.REGISTRO);
  var vista = filterRegistry(filas, datos);
  return {
    total: filas.length,
    mostrados: vista.length,
    resumen: resumenElegibilidad(filas),
    filas: vista.map(registryRowView)
  };
}

/** Same list for the direction role, with ID numbers, e-mails and phones masked. */
function accionListarRegistroEnmascarado(datos) {
  var filas = leerHoja(HOJA.REGISTRO);
  var vista = filterRegistry(filas, { filtro: datos.filtro, q: normalizarCedula(datos.q) ? '' : datos.q });
  return {
    total: filas.length,
    mostrados: vista.length,
    resumen: resumenElegibilidad(filas),
    filas: vista.map(function (r) {
      var v = registryRowView(r);
      v.id_number = maskIdNumber(r.id_number);
      v.email = maskEmail(r.email);
      v.whatsapp = maskPhone(r.whatsapp);
      delete v.validation_notes;
      delete v.video_url;
      return v;
    })
  };
}

function resumenElegibilidad(filas) {
  var r = { total: filas.length, recibido: 0, en_revision: 0, apto: 0, no_apto: 0, incompleto: 0, duplicado: 0,
            con_codigo: 0, suplentes: 0, retirados: 0, unicos: 0, agrupaciones: 0, duos: 0, solistas: 0 };
  var cedulas = {};
  filas.forEach(function (f) {
    var e = normalizeEligibility(f.eligibility_status);
    if (e === 'RECIBIDO') r.recibido++;
    else if (e === 'EN_REVISION') r.en_revision++;
    else if (e === 'APTO') r.apto++;
    else if (e === 'NO_APTO') r.no_apto++;
    else if (e === 'INCOMPLETO') r.incompleto++;
    else if (e === 'DUPLICADO') r.duplicado++;
    if (normalizarTexto(f.code)) r.con_codigo++;
    if (normalizarComparable(f.pool_status) === POOL_STATUS.SUPLENTE) r.suplentes++;
    if (isWithdrawn(f)) r.retirados++;
    var mode = normalizeParticipationMode(f.participation_mode) || 'SOLISTA';
    if (mode === 'AGRUPACION') r.agrupaciones++; else if (mode === 'DUO') r.duos++; else r.solistas++;
    var c = normalizarCedula(f.id_number);
    if (c) cedulas[c] = true;
  });
  r.unicos = Object.keys(cedulas).length;
  r.por_revisar = r.recibido + r.en_revision;
  r.validos = r.apto + r.en_revision + r.recibido;
  // Aliases read by older screens.
  r.revision = r.en_revision;
  r.no_cumple = r.no_apto;
  return r;
}

/** A stored REGISTRO row, shaped back into what validarInscripcion reads. */
function rowAsSubmission(r) {
  return {
    full_name: r.full_name, id_number: r.id_number, birth_date: r.birth_date,
    neighborhood_sector: r.neighborhood_sector,
    resides_in_sabaneta: normalizarTexto(r.residence) === '' ? '' : (normalizarComparable(r.residence) === 'FUERA' ? 'NO' : 'SI'),
    email: r.email, whatsapp: r.whatsapp, participation_mode: r.participation_mode,
    artistic_name: r.artistic_name, members_declared: r.members_declared,
    genre_primary: r.genre_primary, audition_description: r.audition_description,
    presentation_format: r.presentation_format, presentation_other: r.presentation_other,
    own_equipment: r.own_equipment, own_equipment_detail: r.own_equipment_detail,
    track_uses: r.track_uses, track_method: r.track_method, track_method_other: r.track_method_other,
    video_url: r.video_url, adult_confirmation: r.adult_confirmation,
    availability_statement: r.availability_statement,
    accept_terms: r.consent_terms, accept_data_processing: r.consent_data
  };
}

/**
 * Re-runs validation, duplicate and group detection over every row, e.g. after
 * changing the age range in CONFIG. A decision the operator took by hand
 * (eligibility_override) is kept; an issued code is never stripped.
 */
function accionRevalidarTodo(datos, sesion) {
  return conBloqueo(function () {
    invalidarCacheConfig();
    var opciones = opcionesValidacion();
    var filas = leerHoja(HOJA.REGISTRO);
    var seen = [];
    var updates = [];

    filas.forEach(function (r) {
      var verdict = validarInscripcion(rowAsSubmission(r), opciones);
      if (normalizarTexto(r.signature_file_id) === '' && cfgBool('firma_inscripcion', true) && normalizarTexto(r.team_code) &&
          verdict.eligibility_status !== ESTADO_ELEGIBILIDAD.NO_APTO) {
        verdict.eligibility_status = ESTADO_ELEGIBILIDAD.INCOMPLETO;
        verdict.errores.push({ campo: 'signature_png', codigo: 'FALTANTE' });
      }
      var candidate = {
        submission_id: r.submission_id,
        normalized_id_number: normalizarCedula(r.id_number),
        normalized_email: normalizarEmail(r.email),
        normalized_phone: normalizarTelefono(r.whatsapp),
        participation_mode: r.participation_mode,
        group_match_key: r.group_match_key || (isGroupMode(r.participation_mode) ? groupMatchKey(r.artistic_name) : ''),
        group_display_name: r.group_display_name
      };
      var dup = detectarDuplicado(candidate, seen);
      var matchStatus = normalizarComparable(r.group_match_status);
      var gm = (candidate.group_match_key && matchStatus !== 'CONFIRMADA_DISTINTA')
        ? detectGroupMatch(candidate, seen) : { match: false };
      // An incomplete registration never makes a later, complete one a duplicate.
      if (verdict.eligibility_status !== ESTADO_ELEGIBILIDAD.INCOMPLETO) seen.push(candidate);

      var auto = verdict.eligibility_status;
      if (auto !== ESTADO_ELEGIBILIDAD.INCOMPLETO) {
        if (matchStatus === 'CONFIRMADA_MISMA' || dup.duplicate_flag) auto = ESTADO_ELEGIBILIDAD.DUPLICADO;
        else if ((dup.alerta || gm.match) && auto === ESTADO_ELEGIBILIDAD.APTO) auto = ESTADO_ELEGIBILIDAD.EN_REVISION;
      }

      var current = normalizeEligibility(r.eligibility_status);
      var status = current;
      var notes = verdict.errores.map(function (x) { return x.campo + ':' + x.codigo; });
      var override = normalizeEligibility(r.eligibility_override);
      if (override && ESTADO_ELEGIBILIDAD[override]) {
        if (override !== auto) notes.push('DECISION_MANUAL(' + override + ') sobre regla(' + auto + ')');
        status = override;
      } else if (current !== ESTADO_ELEGIBILIDAD.RECIBIDO) {
        // Decided rows follow the rule; RECIBIDO waits for staff to apply the verification.
        status = auto;
      }
      // A row that already holds a code keeps its seat: re-validation informs, it does not strip.
      if (normalizarTexto(r.code) && (status === ESTADO_ELEGIBILIDAD.DUPLICADO || status === ESTADO_ELEGIBILIDAD.NO_APTO)) {
        status = ESTADO_ELEGIBILIDAD.EN_REVISION;
      }

      updates.push({
        fila: r._fila,
        cambios: {
          age: verdict.edad === null ? '' : verdict.edad,
          eligibility_status: status,
          eligibility_auto: auto,
          duplicate_flag: dup.duplicate_flag || matchStatus === 'CONFIRMADA_MISMA',
          duplicate_reason: matchStatus === 'CONFIRMADA_MISMA' ? 'GRUPO_REPETIDO' : dup.duplicate_reason,
          registro_principal: matchStatus === 'CONFIRMADA_MISMA' ? r.group_match_ref : dup.registro_principal,
          normalized_id_number: candidate.normalized_id_number,
          normalized_email: candidate.normalized_email,
          normalized_phone: candidate.normalized_phone,
          person_id: r.person_id || personIdFor(candidate.normalized_id_number),
          group_match_key: candidate.group_match_key,
          group_match_status: matchStatus || (gm.match ? 'POSIBLE_REPETIDA' : ''),
          group_match_ref: r.group_match_ref || (gm.match ? gm.ref : ''),
          validation_notes: notes.join(' | ')
        }
      });
    });

    actualizarFilasEnLote(HOJA.REGISTRO, updates);
    refreshPoolLocked();
    registrar(sesion.alias, sesion.rol, 'REVALIDAR_TODO', '', filas.length + ' filas');
    return { revalidados: filas.length, resumen: resumenElegibilidad(leerHoja(HOJA.REGISTRO)) };
  });
}

/** Final aptitude states: the ones that are communicated to the person. */
var FINAL_ELIGIBILITY = ['APTO', 'NO_APTO', 'DUPLICADO', 'INCOMPLETO'];

/** Queues the aptitude result e-mail once per (registration, state). Caller holds the lock. */
function queueAptitudeEmailLocked(row, status) {
  if (FINAL_ELIGIBILITY.indexOf(status) === -1) return false;
  var r = enqueueEmail('APTITUD', Object.assign({}, row, { eligibility_status: status }), 'aptitud', {},
                       'APTITUD:' + row.submission_id + ':' + status);
  if (r.encolado) actualizarFila(HOJA.REGISTRO, row._fila, { aptitude_notified_at: isoWithOffset() });
  return r.encolado;
}

/**
 * "Aplicar verificación": every RECIBIDO registration takes its automatic verdict as the official
 * aptitude, except the ones the rules flagged for a person (EN_REVISION), which wait for a manual
 * decision. Everyone decided gets the aptitude e-mail. Nothing is ever deleted.
 */
function accionAplicarVerificacion(datos, sesion) {
  var result = conBloqueo(function () {
    var rows = leerHoja(HOJA.REGISTRO).filter(function (r) { return normalizeEligibility(r.eligibility_status) === ESTADO_ELEGIBILIDAD.RECIBIDO; });
    var now = isoWithOffset();
    var counts = {};
    var updates = rows.map(function (r) {
      var auto = normalizeEligibility(r.eligibility_auto) || ESTADO_ELEGIBILIDAD.EN_REVISION;
      counts[auto] = (counts[auto] || 0) + 1;
      return { fila: r._fila, row: r, status: auto,
               cambios: { eligibility_status: auto, eligibility_decided_at: now, eligibility_decided_by: sesion.alias } };
    });
    actualizarFilasEnLote(HOJA.REGISTRO, updates);
    var queued = 0;
    updates.forEach(function (u) { if (queueAptitudeEmailLocked(u.row, u.status)) queued++; });
    var pool = refreshPoolLocked();
    registrar(sesion.alias, sesion.rol, 'APLICAR_VERIFICACION', '', JSON.stringify(counts));
    return { aplicadas: updates.length, por_estado: counts, correos_en_cola: queued, bolsa: pool,
             en_revision_manual: counts.EN_REVISION || 0 };
  });
  result.envio = processEmailQueue({ limit: 15 });
  return result;
}

/** Queues the aptitude e-mail for every decided registration that has not been told its current state. */
function accionNotificarAptitud(datos, sesion) {
  var result = conBloqueo(function () {
    var queued = 0;
    leerHoja(HOJA.REGISTRO).forEach(function (r) {
      if (queueAptitudeEmailLocked(r, normalizeEligibility(r.eligibility_status))) queued++;
    });
    registrar(sesion.alias, sesion.rol, 'NOTIFICAR_APTITUD', '', queued + ' correos');
    return { correos_en_cola: queued };
  });
  result.envio = processEmailQueue({ limit: 15 });
  return result;
}

/**
 * Manual decision by logistics, always logged with who and why, and kept by later re-validations.
 * A slot holder can only be made NO_APTO / DUPLICADO by releasing the slot (liberar_cupo), so the
 * seat goes to the next substitute instead of silently disappearing.
 */
function accionMarcarElegibilidad(datos, sesion) {
  return conBloqueo(function () {
    var registro = datos.submission_id
      ? leerHoja(HOJA.REGISTRO).filter(function (r) { return r.submission_id === datos.submission_id; })[0]
      : buscarPorCodigo(datos.code);
    if (!registro) return { ok: false, error: 'Registro no encontrado.' };
    if (!normalizarTexto(datos.motivo)) return { ok: false, error: 'Escribe el motivo: queda en la bitácora.' };

    var nuevo = normalizeEligibility(datos.eligibility_status);
    if (!ESTADO_ELEGIBILIDAD[nuevo]) return { ok: false, error: 'Estado de elegibilidad inválido: ' + datos.eligibility_status };
    var holder = !!normalizarTexto(registro.code);
    if (holder && (nuevo === 'NO_APTO' || nuevo === 'DUPLICADO' || nuevo === 'INCOMPLETO')) {
      if (!esVerdadero(datos.liberar_cupo)) {
        return { ok: false, requiere_liberar: true,
                 error: 'Este proyecto tiene el cupo ' + registro.code + '. Para marcarlo ' + nuevo + ' hay que liberar el cupo (pasa al siguiente suplente).' };
      }
    }
    var now = isoWithOffset();
    actualizarFila(HOJA.REGISTRO, registro._fila, {
      eligibility_status: nuevo,
      eligibility_override: nuevo,
      override_by: sesion.alias,
      override_at: now,
      eligibility_decided_at: now,
      eligibility_decided_by: sesion.alias,
      notes: [registro.notes, '[' + now + ' ' + sesion.alias + '] ' + nuevo + ': ' + datos.motivo].filter(Boolean).join(' || ')
    });
    registrar(sesion.alias, sesion.rol, 'MARCAR_ELEGIBILIDAD', registro.submission_id,
              registro.eligibility_status + '->' + nuevo + ' motivo=' + datos.motivo);
    var released = null;
    var fresh = leerHoja(HOJA.REGISTRO).filter(function (r) { return r.submission_id === registro.submission_id; })[0];
    if (holder && esVerdadero(datos.liberar_cupo) && nuevo !== 'APTO' && nuevo !== 'EN_REVISION' && nuevo !== 'RECIBIDO') {
      released = releaseSlotLocked(fresh, { actor: sesion.alias, rol: sesion.rol, reason: 'Aptitud ' + nuevo + ': ' + datos.motivo });
      fresh = leerHoja(HOJA.REGISTRO).filter(function (r) { return r.submission_id === registro.submission_id; })[0];
    }
    queueAptitudeEmailLocked(fresh, nuevo);
    refreshPoolLocked();
    return { submission_id: registro.submission_id, eligibility_status: nuevo, cupo_liberado: released };
  });
}

/**
 * "Cerrar los 100": issues B-001..B-100 and writes each project's block,
 * arrival time and audition time in one pass. A group is one project, so it
 * takes exactly one code however many members it has.
 */
function accionAsignarCodigos(datos, sesion) {
  if (cfgBool('lista_oficial_bloqueada', false)) return { ok: false, error: 'La lista oficial ya está consolidada.' };
  var out = conBloqueo(function () {
    var cfgAgenda = agendaConfigurada();
    var filas = leerHoja(HOJA.REGISTRO);
    var resultado = asignarCodigos(filas, {
      cupo: cfgNumero('cupo_total', 100),
      ahora: ahoraISO(),
      responsable: sesion.alias || 'logistica'
    });

    var porId = {};
    filas.forEach(function (r) { porId[r.submission_id] = r; });

    var actualizaciones = resultado.asignados.map(function (a) {
      var h = horarioDeCodigo(a.code, cfgAgenda);
      return {
        fila: porId[a.submission_id]._fila,
        cambios: {
          code: a.code,
          issued_at: a.issued_at,
          issued_by: a.issued_by,
          original_block: h.block_id,
          original_time: h.audition_time,
          final_block: h.block_id,
          final_time: h.audition_time,
          arrival_time: h.arrival_time,
          attendance_status: ESTADO.CONFIRMADO,
          change_status: ESTADO_CAMBIO.SIN_SOLICITUD
        }
      };
    });

    actualizarFilasEnLote(HOJA.REGISTRO, actualizaciones);
    var pool = refreshPoolLocked();

    // Each newly assigned project gets its code and schedule; each eligible project without a
    // slot is told whether it is a substitute or outside the pool. Idempotent per state.
    var queued = { asignacion: 0, sin_cupo: 0 };
    leerHoja(HOJA.REGISTRO).forEach(function (r) {
      if (normalizarTexto(r.code)) {
        if (enqueueEmail('ASIGNACION', r, 'asignacion', {}, 'ASIGNACION:' + r.submission_id + ':' + normalizarComparable(r.code)).encolado) queued.asignacion++;
        return;
      }
      var p = normalizarComparable(r.pool_status);
      if (normalizeEligibility(r.eligibility_status) === 'APTO' && (p === POOL_STATUS.SUPLENTE || p === POOL_STATUS.FUERA_DE_BOLSA)) {
        if (enqueueEmail('SIN_CUPO', r, 'asignacion', {}, 'SIN_CUPO:' + r.submission_id + ':' + p).encolado) queued.sin_cupo++;
      }
    });
    refrescarVistas();

    registrar(sesion.alias, sesion.rol, 'ASIGNAR_CODIGOS', '',
              'nuevos=' + resultado.asignados.length + ' sin_cupo=' + resultado.sin_cupo.length);

    return {
      asignados: resultado.asignados.length,
      ya_tenian: resultado.ya_tenian,
      total_con_codigo: resultado.total_con_codigo,
      sin_cupo: resultado.sin_cupo.length,
      suplentes: pool.suplentes,
      fuera_de_bolsa: pool.fuera_de_bolsa,
      cupo: resultado.cupo,
      correos_en_cola: queued,
      detalle: resultado.asignados.slice(0, 200)
    };
  });
  out.envio = processEmailQueue({ limit: 15 });
  return out;
}

function accionListarCambios(datos) {
  var cambios = leerHoja(HOJA.CAMBIOS);
  var estado = normalizarComparable(datos.estado || '');
  return {
    cambios: cambios.filter(function (c) {
      return !estado || estado === 'TODOS' || normalizarComparable(c.estado) === estado;
    }).map(function (c) {
      // A cell that is not plain text reads back as a 1899-12-30 date: staff always see clock times.
      return Object.assign({}, c, {
        original_time: clockText(c.original_time) || c.original_time,
        nueva_hora: clockText(c.nueva_hora) || c.nueva_hora,
        resuelto_at: String(c.resuelto_at || '').replace('T', ' ').slice(0, 16)
      });
    }),
    pendientes: cambios.filter(function (c) { return normalizarComparable(c.estado) === 'PENDIENTE'; }).length
  };
}

function accionBloquesDisponibles() {
  return { bloques: bloquesConCupo(leerHoja(HOJA.REGISTRO), agendaConfigurada()) };
}

/** Production approves (with a destination block) or rejects. */
function accionResolverCambio(datos, sesion) {
  if (cfgBool('lista_oficial_bloqueada', false)) {
    return { ok: false, error: 'La lista oficial ya está consolidada: no hay cambios ordinarios. Si es una emergencia, admin debe desbloquearla.' };
  }
  return conBloqueo(function () {
    var solicitudes = leerHoja(HOJA.CAMBIOS);
    var solicitud = solicitudes.filter(function (c) { return c.solicitud_id === datos.solicitud_id; })[0];
    if (!solicitud) return { ok: false, error: 'Solicitud no encontrada.' };
    if (normalizarComparable(solicitud.estado) !== 'PENDIENTE') {
      return { ok: false, error: 'Esta solicitud ya fue resuelta (' + solicitud.estado + ').' };
    }

    var registro = buscarPorCodigo(solicitud.code);
    if (!registro) return { ok: false, error: 'El participante ya no existe en REGISTRO.' };

    var aprobar = esVerdadero(datos.aprobar);

    if (!aprobar) {
      actualizarFila(HOJA.CAMBIOS, solicitud._fila, {
        estado: ESTADO_CAMBIO.RECHAZADO, resuelto_at: ahoraISO(),
        resuelto_by: sesion.alias, observacion: datos.observacion || ''
      });
      actualizarFila(HOJA.REGISTRO, registro._fila, {
        change_status: ESTADO_CAMBIO.RECHAZADO,
        changed_at: ahoraISO(), changed_by: sesion.alias
      });
      registrar(sesion.alias, sesion.rol, 'CAMBIO_RECHAZADO', solicitud.code, datos.observacion || '');
      actualizarFila(HOJA.CAMBIOS, solicitud._fila, { notificacion_estado: 'CORREO EN COLA' });
      enqueueEmail('CAMBIO_RECHAZADO', buscarPorCodigo(solicitud.code), 'cambio', { solicitud_id: solicitud.solicitud_id },
                   'CAMBIO_RESUELTO:' + solicitud.solicitud_id);
      refreshPoolLocked();
      refrescarVistas();
      return { estado: ESTADO_CAMBIO.RECHAZADO, code: solicitud.code,
               mensaje: 'Solicitud rechazada. El participante mantiene su horario original.' };
    }

    // Capacity is verified at approval time, not at request time.
    var libres = bloquesConCupo(leerHoja(HOJA.REGISTRO), agendaConfigurada());
    var destino = libres.filter(function (b) { return String(b.block_id) === String(datos.nuevo_bloque); })[0];
    if (!destino) return { ok: false, error: 'Bloque destino inválido.' };
    if (destino.disponibles <= 0) {
      return { ok: false, error: (destino.margen ? 'El margen operativo' : 'El bloque ' + destino.block_id) +
                                 ' ya está lleno (' + destino.ocupados + '/' + destino.cupo + ').' };
    }

    var aplicado = aplicarCambio(registro, datos.nuevo_bloque, {
      agenda: agendaConfigurada(), ahora: ahoraISO(), responsable: sesion.alias
    });
    if (!aplicado.ok) return { ok: false, error: aplicado.mensaje };

    actualizarFila(HOJA.REGISTRO, registro._fila, aplicado.cambios);
    actualizarFila(HOJA.CAMBIOS, solicitud._fila, {
      estado: ESTADO_CAMBIO.APROBADO, nuevo_bloque: aplicado.horario.block_id,
      nueva_hora: aplicado.horario.audition_time, resuelto_at: ahoraISO(),
      resuelto_by: sesion.alias, observacion: datos.observacion || ''
    });
    registrar(sesion.alias, sesion.rol, 'CAMBIO_APROBADO', solicitud.code,
              'bloque=' + aplicado.horario.block_id);
    actualizarFila(HOJA.CAMBIOS, solicitud._fila, { notificacion_estado: 'CORREO EN COLA' });
    enqueueEmail('CAMBIO_APROBADO', buscarPorCodigo(solicitud.code), 'cambio', { solicitud_id: solicitud.solicitud_id },
                 'CAMBIO_RESUELTO:' + solicitud.solicitud_id);
    refreshPoolLocked();
    refrescarVistas();

    return {
      estado: ESTADO_CAMBIO.APROBADO, code: solicitud.code,
      nuevo_bloque: aplicado.horario.block_id,
      nueva_hora: aplicado.horario.audition_time,
      hora_llegada: aplicado.horario.arrival_time,
      mensaje: 'Cambio aprobado. El código ' + solicitud.code + ' NO cambia; solo su horario.'
    };
  });
}

function accionNuevoIncidente(datos, sesion) {
  var id = registrarIncidente(datos.code, datos.tipo || 'GENERAL', datos.descripcion,
                              datos.accion, sesion.alias || 'operador');
  return { incidente_id: id };
}

function accionCrearUsuario(datos, sesion) {
  if (!datos.alias || !datos.rol) return { ok: false, error: 'Faltan alias y rol.' };
  return provisionarUsuario(datos.alias, datos.rol, datos.nota);
}

function accionRefrescarVistas(datos, sesion) {
  var r = refrescarVistas();
  registrar(sesion.alias, sesion.rol, 'REFRESCAR_VISTAS', '', JSON.stringify(r));
  return r;
}

// ---------------------------------------------------------------------------
// Groups
// ---------------------------------------------------------------------------

/** Every group project with its members (logistics sees full data: it operates with it). */
function accionListarAgrupaciones(datos) {
  var members = leerHoja(HOJA.INTEGRANTES);
  var withCrew = {};
  members.forEach(function (m) { if (isCrew(m)) withCrew[normalizarComparable(m.group_code)] = true; });
  var projects = leerHoja(HOJA.REGISTRO).filter(function (r) {
    return normalizarTexto(r.group_code) || withCrew[normalizarComparable(teamCodeOf(r))];
  });
  return {
    total: projects.length,
    agrupaciones: projects.map(function (p) {
      var team = teamCodeOf(p);
      var summary = groupSummary(team, members);
      return {
        submission_id: p.submission_id, code: p.code, group_code: team,
        group_display_name: p.group_display_name || p.artistic_name,
        group_match_status: p.group_match_status, group_match_ref: p.group_match_ref,
        participation_mode: p.participation_mode, eligibility_status: p.eligibility_status,
        leader_name: p.full_name, leader_whatsapp: p.whatsapp,
        members_declared: Number(p.members_declared) || '', members_registered: summary.registered,
        members_authorized: summary.authorized, crew_registered: summary.crew_registered,
        members_link: membersLink(team),
        members: summary.list.map(function (m) {
          return {
            member_id: m.member_id, full_name: m.full_name, id_number: m.id_number, age: m.age,
            document_type: m.document_type || 'CC', person_role: normalizePersonRole(m.person_role),
            crew_role: m.crew_role ? (CREW_ROLE_LABELS[m.crew_role] || m.crew_role) : '', on_stage: esVerdadero(m.on_stage),
            artistic_role: m.artistic_role, is_leader: esVerdadero(m.is_leader),
            consent_terms: esVerdadero(m.consent_terms), consent_data: esVerdadero(m.consent_data),
            consent_image: esVerdadero(m.consent_image), signature: !!normalizarTexto(m.signature_file_id),
            member_status: m.member_status, member_alert: m.member_alert
          };
        })
      };
    })
  };
}

/**
 * The operator decides whether two groups with the same match key are the
 * same project. MISMO keeps one seat (the later one becomes DUPLICADO);
 * DISTINTO keeps both and records the decision. Nothing is merged or renamed.
 */
function accionResolverCoincidenciaGrupo(datos, sesion) {
  return conBloqueo(function () {
    var rows = leerHoja(HOJA.REGISTRO);
    var row = rows.filter(function (r) { return r.submission_id === datos.submission_id; })[0];
    if (!row) return { ok: false, error: 'Registro no encontrado.' };
    if (normalizarComparable(row.group_match_status) !== 'POSIBLE_REPETIDA') {
      return { ok: false, error: 'Esta inscripción no tiene una coincidencia pendiente.' };
    }
    var decision = normalizarComparable(datos.decision);
    if (decision !== 'MISMO' && decision !== 'DISTINTO') return { ok: false, error: 'Decision invalida (MISMO o DISTINTO).' };
    var stamp = '[' + ahoraISO() + ' ' + sesion.alias + '] coincidencia de agrupacion: ' + decision +
                (datos.motivo ? ' - ' + datos.motivo : '');
    var changes = { notes: [row.notes, stamp].filter(Boolean).join(' || ') };

    if (decision === 'MISMO') {
      changes.group_match_status = 'CONFIRMADA_MISMA';
      changes.duplicate_flag = true;
      changes.duplicate_reason = 'GRUPO_REPETIDO';
      changes.registro_principal = row.group_match_ref;
      changes.eligibility_status = normalizarTexto(row.code) ? ESTADO_ELEGIBILIDAD.REVISION : ESTADO_ELEGIBILIDAD.DUPLICADO;
    } else {
      changes.group_match_status = 'CONFIRMADA_DISTINTA';
      var others = rows.filter(function (r) { return r.submission_id !== row.submission_id; });
      var verdict = validarInscripcion(rowAsSubmission(row), opcionesValidacion());
      var dup = detectarDuplicado({
        submission_id: row.submission_id, normalized_id_number: normalizarCedula(row.id_number),
        normalized_email: normalizarEmail(row.email), normalized_phone: normalizarTelefono(row.whatsapp)
      }, others);
      var status = verdict.eligibility_status;
      if (dup.duplicate_flag) status = ESTADO_ELEGIBILIDAD.DUPLICADO;
      else if (dup.alerta && status === ESTADO_ELEGIBILIDAD.APTO) status = ESTADO_ELEGIBILIDAD.REVISION;
      changes.eligibility_status = status;
    }
    actualizarFila(HOJA.REGISTRO, row._fila, changes);
    registrar(sesion.alias, sesion.rol, 'GRUPO_COINCIDENCIA_' + decision, row.submission_id, row.group_match_ref);
    return { submission_id: row.submission_id, decision: decision, eligibility_status: changes.eligibility_status };
  });
}

/** Clause 8 of the source terms: members may be updated. Only the declared size is editable here. */
function accionActualizarIntegrantesDeclarados(datos, sesion) {
  return conBloqueo(function () {
    var row = leerHoja(HOJA.REGISTRO).filter(function (r) { return r.submission_id === datos.submission_id; })[0];
    if (!row || !row.group_code) return { ok: false, error: 'Agrupacion no encontrada.' };
    var n = parseInt(datos.members_declared, 10);
    var mode = normalizeParticipationMode(row.participation_mode);
    var max = cfgNumero('integrantes_max', 15);
    if (mode === 'DUO' && n !== 2) return { ok: false, error: 'Un duo tiene exactamente 2 integrantes.' };
    if (mode === 'AGRUPACION' && !(n >= 3 && n <= max)) return { ok: false, error: 'Una agrupación tiene entre 3 y ' + max + ' integrantes.' };
    actualizarFila(HOJA.REGISTRO, row._fila, {
      members_declared: n,
      notes: [row.notes, '[' + ahoraISO() + ' ' + sesion.alias + '] integrantes declarados ' + row.members_declared + ' -> ' + n +
              (datos.motivo ? ' - ' + datos.motivo : '')].filter(Boolean).join(' || ')
    });
    registrar(sesion.alias, sesion.rol, 'INTEGRANTES_DECLARADOS', row.group_code, row.members_declared + '->' + n);
    return { group_code: row.group_code, members_declared: n };
  });
}

// ---------------------------------------------------------------------------
// Backing tracks and videos
// ---------------------------------------------------------------------------

function driveFileUrl(id) {
  return id ? 'https://drive.google.com/file/d/' + id + '/view' : '';
}

/** Tracks in agenda order: what the audio technician works from. */
function accionListarPistas(datos) {
  // A track can only be sent with a code, so only people with a seat are listed and counted.
  var rows = leerHoja(HOJA.REGISTRO).filter(function (r) { return normalizarTexto(r.code); });
  rows.sort(function (a, b) {
    var ba = Number(a.final_block || a.original_block || 99), bb = Number(b.final_block || b.original_block || 99);
    if (ba !== bb) return ba - bb;
    return String(a.code) < String(b.code) ? -1 : 1;
  });
  var counts = {};
  var list = rows.map(function (r) {
    var status = r.track_status || (esVerdadero(r.track_uses) ? TRACK_STATUS.PENDIENTE : TRACK_STATUS.NO_APLICA);
    counts[status] = (counts[status] || 0) + 1;
    return {
      code: r.code, artistic_name: r.artistic_name || r.full_name, participation_mode: r.participation_mode,
      song_name: r.song_name, presentation_format: r.presentation_format, needs: r.technical_needs,
      own_equipment_detail: r.own_equipment_detail, track_uses: esVerdadero(r.track_uses),
      track_method: r.track_method, track_status: status, track_file_name: r.track_file_name,
      track_file_url: driveFileUrl(r.track_file_id), track_updated_at: r.track_updated_at,
      track_notes: r.track_notes, final_block: r.final_block || r.original_block,
      final_time: clockText(r.final_time || r.original_time), attendance_status: r.attendance_status
    };
  });
  var folderId = PropertiesService.getScriptProperties().getProperty(PROP.AUDIO_FOLDER);
  return { total: list.length, por_estado: counts, pistas: list,
           carpeta_audio: folderId ? 'https://drive.google.com/drive/folders/' + folderId : '' };
}

/** The technician validates or flags a track. */
function accionMarcarPista(datos, sesion) {
  var valid = [TRACK_STATUS.PENDIENTE, TRACK_STATUS.RECIBIDA, TRACK_STATUS.VALIDADA, TRACK_STATUS.PROBLEMA, TRACK_STATUS.NO_APLICA];
  var status = normalizarTexto(datos.track_status).toUpperCase();
  if (valid.indexOf(status) === -1) return { ok: false, error: 'Estado de pista inválido.' };
  return conBloqueo(function () {
    var row = buscarPorCodigo(datos.code);
    if (!row) return { ok: false, error: 'Código no encontrado.' };
    actualizarFila(HOJA.REGISTRO, row._fila, {
      track_status: status,
      track_notes: [row.track_notes, '[' + ahoraISO() + ' ' + sesion.alias + '] ' + status +
                    (datos.nota ? ': ' + datos.nota : '')].filter(Boolean).join(' || ')
    });
    registrar(sesion.alias, sesion.rol, 'PISTA_ESTADO', row.code, status);
    return { code: row.code, track_status: status };
  });
}

/** Upload on behalf of a participant (e.g. a file received on the official WhatsApp). */
function accionSubirPistaAdmin(datos, sesion) {
  var row = buscarPorCodigo(datos.code);
  if (!row || !normalizarTexto(row.code)) return { ok: false, error: 'Código no encontrado.' };
  var stored = storeTrack(row, datos.file_name, datos.file_base64, datos.song_name);
  if (!stored.ok) return stored;
  var method = normalizarComparable(datos.method) || 'WHATSAPP';
  return conBloqueo(function () { return recordTrack(row.code, stored, datos.song_name, method, sesion.alias); });
}

function accionPrepararCarpetasAudio(datos, sesion) {
  var r = prepareAudioFolders();
  registrar(sesion.alias, sesion.rol, 'CARPETAS_AUDIO', '', 'creadas=' + r.creadas);
  return r;
}

function accionVerificarVideos(datos, sesion) {
  var r = verifyPendingVideos({ all: esVerdadero(datos.todos), limit: Number(datos.limite) || 200 });
  registrar(sesion.alias, sesion.rol, 'VERIFICAR_VIDEOS', '', JSON.stringify(r.por_estado));
  return r;
}

// ---------------------------------------------------------------------------
// Contacts for the official WhatsApp broadcast list
// ---------------------------------------------------------------------------

/**
 * vCard file with everyone who authorized operational WhatsApp messages, to
 * import into the phone that owns the official number. WhatsApp broadcast
 * lists only reach people who saved that number too, which is why the
 * confirmation screen asks participants to save it.
 */
function accionExportarContactos(datos, sesion) {
  var scope = normalizarComparable(datos.alcance || 'CON_CODIGO');
  var rows = leerHoja(HOJA.REGISTRO).filter(function (r) {
    if (!esVerdadero(r.consent_whatsapp) || !esTelefonoValido(r.whatsapp)) return false;
    if (scope === 'CON_CODIGO') return !!normalizarTexto(r.code);
    if (scope === 'APTOS') return normalizarComparable(r.eligibility_status) === 'APTO' || !!normalizarTexto(r.code);
    return true;
  });
  var lines = [];
  rows.forEach(function (r) {
    var label = (r.code ? r.code + ' ' : '') + normalizarTexto(r.full_name) +
                (r.artistic_name ? ' (' + normalizarTexto(r.artistic_name) + ')' : '');
    lines.push('BEGIN:VCARD', 'VERSION:3.0',
      'FN:' + label.replace(/[\r\n;]/g, ' '),
      'N:' + normalizarTexto(r.full_name).replace(/[\r\n;]/g, ' ') + ';;;;',
      'TEL;TYPE=CELL:+57' + normalizarTelefono(r.whatsapp),
      'NOTE:EL BUNKER ' + (r.code || r.submission_id),
      'END:VCARD');
  });
  var vcf = lines.join('\r\n') + '\r\n';
  var name = 'CONTACTOS-' + scope + '-' + timestampForNames() + '.vcf';
  var file = carpetaBackups().createFile(Utilities.newBlob(vcf, 'text/vcard', name));
  registrar(sesion.alias, sesion.rol, 'EXPORTAR_CONTACTOS', scope, rows.length + ' contactos');
  return { total: rows.length, archivo: name, url: file.getUrl(), vcf: vcf };
}

// ---------------------------------------------------------------------------
// Committee decisions and production health
// ---------------------------------------------------------------------------

/**
 * Minutes of a tie at cut 10 or 20 that the automatic criterion (presence + arena) could not break:
 * method (repeat a short song / the music juror's casting vote), participants, result and the order
 * decided. One decision in force per cut; RESULTADOS applies it only while it matches the current tie.
 */
function accionRegistrarDeliberacion(datos, sesion) {
  var codes = (Array.isArray(datos.codes_in_order) ? datos.codes_in_order : String(datos.codes_in_order || '').split(/[\s,;]+/))
    .map(function (c) { return normalizarComparable(c); }).filter(Boolean);
  var cut = parseInt(datos.cut_position, 10) || cfgNumero('top_seleccionados', 10);
  var method = normalizarComparable(datos.method);
  if (codes.length < 2) return { ok: false, error: 'Indica el orden decidido con al menos dos códigos.' };
  if (cut !== cfgNumero('top_seleccionados', 10) && cut !== cfgNumero('top_privado', 20)) {
    return { ok: false, error: 'El corte debe ser ' + cfgNumero('top_seleccionados', 10) + ' o ' + cfgNumero('top_privado', 20) + '.' };
  }
  if (!TIE_METHODS.some(function (m) { return m.id === method; })) return { ok: false, error: 'Elige el método de desempate.' };
  if (normalizarTexto(datos.participants).length < 3) return { ok: false, error: 'Escribe quiénes participaron en la decisión.' };
  if (normalizarTexto(datos.result).length < 3) return { ok: false, error: 'Escribe el resultado (qué pasó y por qué).' };
  if (cfgBool('resultados_cerrados', false)) return { ok: false, error: 'Los resultados están cerrados.' };
  return conBloqueo(function () {
    var tie = tiedCuts().filter(function (t) { return t.cut === cut; })[0];
    if (!tie) return { ok: false, error: 'No hay un empate sin resolver en el corte ' + cut + '.' };
    var tiedCodes = tie.empatados.map(function (a) { return normalizarComparable(a.code); });
    var sameSet = codes.length === tiedCodes.length && tiedCodes.every(function (c) { return codes.indexOf(c) !== -1; });
    if (!sameSet) return { ok: false, error: 'El acta debe ordenar exactamente a los empatados: ' + tiedCodes.join(', ') + '.' };
    leerHoja(HOJA.DELIBERACIONES).forEach(function (d) {
      if (normalizarComparable(d.status) === 'VIGENTE' && Number(d.cut_position) === cut) {
        actualizarFila(HOJA.DELIBERACIONES, d._fila, { status: 'REEMPLAZADA' });
      }
    });
    var id = nuevoId('ACTA');
    agregarFila(HOJA.DELIBERACIONES, {
      deliberation_id: id, at: isoWithOffset(), by: sesion.alias, codes_in_order: codes.join(','), cut_position: cut,
      minutes: String(datos.acta || datos.result || '').slice(0, 2000), status: 'VIGENTE', method: method,
      participants: String(datos.participants).slice(0, 500), result: String(datos.result).slice(0, 1000)
    });
    registrar(sesion.alias, sesion.rol, 'DELIBERACION', id, 'corte=' + cut + ' metodo=' + method + ' orden=' + codes.join(','));
    reconstruirResultados(leerHoja(HOJA.REGISTRO));
    return { deliberation_id: id, cut_position: cut, codes_in_order: codes };
  });
}

/**
 * Closes the results: needs every audited project fully evaluated (3 submitted cards), no pending
 * disqualification and no unresolved tie at 10 or 20. Locks evaluations; the Top 10 is final.
 */
function accionCerrarResultados(datos, sesion) {
  if (normalizarComparable(datos.confirmacion) !== 'CERRAR') return { ok: false, error: 'Para cerrar escribe CERRAR.' };
  return conBloqueo(function () {
    if (cfgBool('resultados_cerrados', false)) return { ok: false, error: 'Los resultados ya están cerrados.' };
    var rows = leerHoja(HOJA.REGISTRO);
    var sel = computeResults(rows);
    var problems = [];
    if (sel.cortes.length) problems.push('Empates sin acta en el corte ' + sel.cortes.map(function (c) { return c.cut; }).join(' y ') + '.');
    if (sel.dq_pendientes.length) problems.push('Descalificaciones sin validar: ' + sel.dq_pendientes.join(', ') + '.');
    var missing = sel.excluidos.filter(function (e) { return e.motivo === 'JURADOS_INSUFICIENTES'; });
    if (missing.length && !esVerdadero(datos.forzar_incompletos)) {
      problems.push('Proyectos audicionados sin las 3 evaluaciones enviadas: ' + missing.map(function (e) { return e.code; }).join(', ') + '.');
    }
    if (problems.length) return { ok: false, error: problems.join(' '), pendientes: problems };
    setConfigValue('resultados_cerrados', 'SI');
    reconstruirResultados(leerHoja(HOJA.REGISTRO));
    registrar(sesion.alias, sesion.rol, 'CERRAR_RESULTADOS', '', 'top=' + sel.top10.map(function (a) { return a.code; }).join(','));
    return { cerrado: true, top10: sel.top10.map(function (a) { return { code: a.code, artistic_name: a.artistic_name }; }),
             mensaje: 'Resultados cerrados. Ya puedes enviar el correo RESULTADO_FINAL desde Comunicación.' };
  });
}

/** Admin only: reopens the results (e.g. a validated correction). Logged with the reason. */
function accionReabrirResultados(datos, sesion) {
  var reason = normalizarTexto(datos.motivo);
  if (reason.length < 10) return { ok: false, error: 'Escribe el motivo (queda en la bitácora).' };
  setConfigValue('resultados_cerrados', 'NO');
  registrar(sesion.alias, sesion.rol, 'REABRIR_RESULTADOS', '', reason);
  refrescarVistas();
  return { mensaje: 'Resultados reabiertos.' };
}

/** Counts rows that carry test-data markers. In production this must always be zero. */
function auditTestData() {
  var projects = leerHoja(HOJA.REGISTRO).filter(function (r) {
    return isTestData({ source: r.source, email: r.email, client_submission_id: '' }) ||
           /^PRUEBA-/.test(String(r.artistic_name || ''));
  });
  var members = leerHoja(HOJA.INTEGRANTES).filter(function (m) { return normalizarComparable(m.source) === 'SEED'; });
  return { entorno: environmentName(), marca_hoja: spreadsheetEnvironment(), proyectos_de_prueba: projects.length,
           integrantes_de_prueba: members.length, limpio: projects.length === 0 && members.length === 0 };
}

function accionAuditarDatosDePrueba() {
  return auditTestData();
}

/**
 * Data for the printable record of a group: project, members, their
 * authorizations and drawn signatures, plus blank lines for anyone who signs
 * on paper at the desk (the brief's alternative to the digital signature).
 */
function constanciaData(groupCode) {
  var code = normalizarComparable(groupCode);
  var project = findGroupProject(code);
  if (!project) return null;
  var summary = groupSummary(code);
  var declared = Number(project.members_declared) || summary.registered;
  return {
    group_code: code,
    project_code: project.code || '(sin código aún)',
    group_display_name: project.group_display_name || project.artistic_name,
    participation_mode: ({ SOLISTA: 'Solista', DUO: 'Dúo', AGRUPACION: 'Agrupación' })[project.participation_mode] || project.participation_mode,
    leader_name: project.full_name,
    leader_id_number: project.id_number,
    genre: projectGenre(project),
    members_declared: declared,
    terms_version: cfg('terms_version', ''),
    policy_version: cfg('policy_version', 'v2'),
    legal_name: cfg('legal_name', ''),
    generated_at: Utilities.formatDate(new Date(), zonaHoraria(), 'yyyy-MM-dd HH:mm'),
    members: summary.list.map(function (m) {
      return {
        full_name: m.full_name, id_number: m.id_number,
        artistic_role: isCrew(m) ? 'Equipo de trabajo: ' + (CREW_ROLE_LABELS[m.crew_role] || m.crew_role || '') : m.artistic_role,
        is_leader: esVerdadero(m.is_leader), status: m.member_status, consent_at: m.consent_at,
        consent_image: esVerdadero(m.consent_image), signature: signatureDataUrl(m.signature_file_id),
        signature_sha256: m.signature_sha256
      };
    }),
    blank_lines: Math.max(0, declared - summary.registered)
  };
}

// ========================================================================
// 23_api_checkin.gs
// ========================================================================

/**
 * EL BUNKER - Check-in desk actions (event day).
 *
 * Flow on the day: access -> CHECK-IN -> PRECOLA -> EN AUDICION -> REALIZADA
 * (exit). This is the only module that has to keep working on a bad
 * connection, so it exposes a full roster download and a batch sync of queued
 * operations.
 */

/** Members of each group, keyed by group code, trimmed to what the desk needs to verify identity. */
function membersByGroup() {
  var byGroup = {};
  leerHoja(HOJA.INTEGRANTES).forEach(function (m) {
    var code = normalizarComparable(m.group_code);
    if (!code) return;
    if (!byGroup[code]) byGroup[code] = [];
    byGroup[code].push({
      full_name: m.full_name,
      id_number: String(m.id_number || ''),
      artistic_role: isCrew(m) ? 'Equipo: ' + (CREW_ROLE_LABELS[m.crew_role] || m.crew_role || '') : m.artistic_role,
      crew: isCrew(m),
      is_leader: esVerdadero(m.is_leader),
      member_status: m.member_status,
      signature: !!normalizarTexto(m.signature_file_id),
      consent_image: esVerdadero(m.consent_image)
    });
  });
  return byGroup;
}

/** One participant as the desk sees it. */
function deskView(r, members) {
  var team = teamCodeOf(r);
  var list = team ? (members[normalizarComparable(team)] || []) : [];
  return {
    code: r.code,
    full_name: r.full_name,
    id_number: String(r.id_number || ''),
    artistic_name: r.artistic_name,
    discipline: projectGenre(r),
    participation_mode: r.participation_mode || 'SOLISTA',
    group_code: r.group_code || '',
    members_declared: Number(r.members_declared) || (r.group_code ? '' : 1),
    members: list,
    members_authorized: list.filter(function (m) { return !m.crew && normalizarComparable(m.member_status) === 'AUTORIZADO'; }).length,
    final_block: r.final_block || r.original_block,
    block_label: blockLabel(r.final_block || r.original_block, agendaConfigurada()),
    arrival_time: clockText(r.arrival_time),
    final_time: clockText(r.final_time || r.original_time),
    final_time_texto: humanTime(r.final_time || r.original_time),
    attendance_status: r.attendance_status || ESTADO.CONFIRMADO,
    audition_status: r.audition_status || '',
    check_in_time: r.check_in_time || '',
    precola_at: r.precola_at || '', stage_at: r.stage_at || '', done_at: r.done_at || '',
    technical_needs: r.technical_needs || '',
    own_equipment_detail: r.own_equipment_detail || '',
    presentation_format: r.presentation_format || '',
    presentation_format_texto: presentationFormatText(r.presentation_format, r.presentation_other),
    song_name: r.song_name || '',
    track_status: r.track_status || '',
    consent_image: esVerdadero(r.consent_image),
    change_status: r.change_status || ''
  };
}

/** The whole roster, trimmed to what the desk legitimately needs to see. */
function accionRosterCheckin() {
  var members = membersByGroup();
  var filas = leerHoja(HOJA.REGISTRO).filter(function (r) { return normalizarTexto(r.code); });
  return {
    generado_at: ahoraISO(),
    total: filas.length,
    roster: filas.map(function (r) { return deskView(r, members); })
  };
}

/** Finds a project by code, the leader's ID number or ANY member's ID number. */
function findForDesk(datos) {
  var rows = leerHoja(HOJA.REGISTRO);
  var code = normalizarComparable(datos.code);
  if (code) {
    var byCode = rows.filter(function (r) { return normalizarComparable(r.code) === code; })[0];
    if (byCode) return { row: byCode, via: 'CODIGO' };
  }
  var doc = normalizarCedula(datos.id_number || datos.code);
  if (!doc) return null;
  var byLeader = rows.filter(function (r) {
    return normalizarTexto(r.code) && normalizarCedula(r.normalized_id_number || r.id_number) === doc;
  })[0];
  if (byLeader) return { row: byLeader, via: 'DOCUMENTO' };
  var member = leerHoja(HOJA.INTEGRANTES).filter(function (m) { return normalizarCedula(m.normalized_id_number) === doc; })[0];
  if (member) {
    var project = rows.filter(function (r) {
      return normalizarComparable(r.group_code) === normalizarComparable(member.group_code);
    })[0];
    if (project) return { row: project, via: 'INTEGRANTE' };
  }
  return null;
}

function accionBuscarParticipante(datos) {
  var found = findForDesk(datos);
  if (!found || !normalizarTexto(found.row.code)) return { ok: false, error: 'No encontramos ese código ni ese documento entre quienes tienen cupo.' };
  var registro = found.row;

  var horaAudicion = registro.final_time || registro.original_time || '';
  var puntualidad = horaAudicion
    ? evaluarPuntualidad(horaAudicion, datos.hora_llegada || horaActual(), agendaConfigurada())
    : null;

  var view = deskView(registro, membersByGroup());
  var warnings = [];
  if (view.group_code && view.members_authorized < (Number(view.members_declared) || 0)) {
    warnings.push('Autorizaciones de integrantes: ' + view.members_authorized + ' de ' + view.members_declared +
                  '. Quien no haya autorizado debe firmar la constancia física antes de subir al escenario.');
  }
  if (!view.consent_image) warnings.push('NO autoriza uso de imagen/voz: no grabar ni publicar su presentación.');
  if (normalizarComparable(view.track_status) === 'PISTA PENDIENTE') warnings.push('La pista no ha llegado: pedir la USB de respaldo.');
  if (normalizarComparable(view.track_status) === 'PISTA CON PROBLEMA') warnings.push('La pista tiene un problema reportado: avisar al técnico de audio.');

  return {
    participante: view,
    encontrado_por: found.via,
    puntualidad: puntualidad,
    avisos: warnings,
    // The desk must always confirm against the physical document.
    recordatorio: 'Valida la identidad con el documento físico antes de confirmar' +
                  (view.group_code ? ' (de cada integrante).' : '.')
  };
}

function horaActual() {
  return Utilities.formatDate(new Date(), zonaHoraria(), 'HH:mm');
}

/**
 * Records one state change. The state machine decides whether it is legal;
 * an illegal one is refused unless a supervisor forces it, and a forced change
 * always lands in INCIDENTES.
 */
function accionRegistrarEstado(datos, sesion) {
  var clave = datos.client_op_id ? 'estado:' + datos.client_op_id : null;

  return conBloqueo(function () {
    return unaSolaVez(clave, function () {
      var registro = buscarPorCodigo(datos.code);
      if (!registro) return { ok: false, error: 'Codigo no encontrado: ' + datos.code };

      var transicion = aplicarTransicion(
        registro.attendance_status || ESTADO.CONFIRMADO,
        datos.estado,
        { forzar: esVerdadero(datos.forzar) }
      );
      if (!transicion.ok) return { ok: false, error: transicion.mensaje, transicion: transicion };

      var at = datos.at || ahoraISO();
      var cambios = {
        attendance_status: transicion.hacia,
        operador_check_in: sesion.alias || 'checkin'
      };
      if (transicion.hacia === ESTADO.CHECK_IN && !registro.check_in_time) cambios.check_in_time = datos.check_in_time || at;
      if (transicion.hacia === ESTADO.PRECOLA) cambios.precola_at = at;
      if (transicion.hacia === ESTADO.EN_AUDICION) cambios.stage_at = at;
      if (transicion.hacia === ESTADO.CONTINGENCIA && !registro.contingencia_desde) cambios.contingencia_desde = at;
      if (transicion.hacia === ESTADO.REALIZADA) {
        cambios.audition_status = ESTADO.REALIZADA;
        cambios.done_at = at;
      }
      if (transicion.hacia === ESTADO.NO_AUDICIONADO || transicion.hacia === ESTADO.NO_SHOW) {
        cambios.audition_status = transicion.hacia;
      }
      if (datos.notes) {
        cambios.notes = [registro.notes, '[' + at + '] ' + datos.notes].filter(Boolean).join(' || ');
      }

      actualizarFila(HOJA.REGISTRO, registro._fila, cambios);

      if (transicion.forzado) {
        registrarIncidente(datos.code, 'TRANSICION_FORZADA',
          'Cambio manual ' + transicion.desde + ' -> ' + transicion.hacia,
          datos.notes || '', sesion.alias || 'checkin');
      }
      registrar(sesion.alias, sesion.rol, 'ESTADO', datos.code, transicion.desde + '->' + transicion.hacia);

      return { code: registro.code, desde: transicion.desde, hacia: transicion.hacia,
               sin_cambio: !!transicion.sin_cambio, forzado: !!transicion.forzado };
    });
  });
}

/**
 * Drains the offline queue the check-in page accumulated while the connection
 * was down. Each operation carries its own id, so replaying the whole queue is
 * safe: already-applied operations are recognised and skipped.
 */
function accionSincronizarCola(datos, sesion) {
  var cola = [];
  try { cola = typeof datos.cola === 'string' ? JSON.parse(datos.cola) : (datos.cola || []); }
  catch (e) { return { ok: false, error: 'Cola ilegible.' }; }

  var resultados = [];
  for (var i = 0; i < cola.length; i++) {
    var op = cola[i];
    try {
      resultados.push(Object.assign({ client_op_id: op.client_op_id },
        accionRegistrarEstado(op, sesion)));
    } catch (err) {
      resultados.push({ client_op_id: op.client_op_id, ok: false, error: err.message });
    }
  }
  registrar(sesion.alias, sesion.rol, 'SINCRONIZAR_COLA', '', cola.length + ' operaciones');
  return { procesadas: resultados.length, resultados: resultados };
}

/** Ranks the contingency queue against the time actually left before the close. */
function accionPlanContingencia(datos) {
  var filas = leerHoja(HOJA.REGISTRO);
  var cola = filas.filter(function (r) {
    return normalizarEstado(r.attendance_status) === ESTADO.CONTINGENCIA ||
           normalizarEstado(r.attendance_status) === ESTADO.NO_SHOW;
  });

  var cfgAgenda = agendaConfigurada();
  var ahoraMin = datos.ahora ? horaAMinutos(datos.ahora) : horaAMinutos(horaActual());
  var inicio = Math.max(ahoraMin === null ? cfgAgenda.contingencia_inicio : ahoraMin, cfgAgenda.contingencia_inicio);

  var plan = planificarContingencia(cola, {
    agenda: cfgAgenda,
    ahora_minutos: inicio,
    cierre_minutos: cfgAgenda.contingencia_fin,
    minutos_por_audicion: cfgNumero('duracion_audicion_min', 3)
  });

  var nombres = {};
  filas.forEach(function (r) { nombres[r.code] = r.artistic_name || r.full_name; });
  plan.entran.forEach(function (x) { x.nombre = nombres[x.code] || ''; });
  plan.fuera.forEach(function (x) { x.nombre = nombres[x.code] || ''; });

  return plan;
}

/** Hard close (21:00 by default): everybody pending becomes NO AUDICIONADO. */
function accionCerrarJornada(datos, sesion) {
  return conBloqueo(function () {
    var filas = leerHoja(HOJA.REGISTRO);
    var cierre = cerrarJornada(filas, { ahora: ahoraISO(), responsable: sesion.alias });

    var porCodigo = {};
    filas.forEach(function (r) { porCodigo[r.code] = r; });

    actualizarFilasEnLote(HOJA.REGISTRO, cierre.cambios.map(function (c) {
      return {
        fila: porCodigo[c.code]._fila,
        cambios: { attendance_status: c.hacia, audition_status: c.hacia }
      };
    }));

    refrescarVistas();
    registrar(sesion.alias, sesion.rol, 'CERRAR_JORNADA', '', cierre.total + ' participantes');
    return { cerrados: cierre.total, detalle: cierre.cambios };
  });
}

/** Tracks for the stage and the audio technician, in agenda order (read-only). */
function accionPistasEvento(datos) {
  return accionListarPistas(datos);
}

// ========================================================================
// 24_api_jurado.gs
// ========================================================================

/**
 * EL BUNKER - Jury actions and the official rubric as a parameter.
 *
 * A juror sees only what they need to score: code, artistic name, format and song.
 * No document number, no contact details, no other juror's marks and no ranking - jurors
 * score independently. A card is a draft (BORRADOR) until the juror submits it
 * ("ENVIAR Y BLOQUEAR EVALUACIÓN"); after that only direction/admin can reopen it, with a
 * reason that goes to the log.
 */

var JURY_SHEETS = ['JURADO_1', 'JURADO_2', 'JURADO_3'];

// ---------------------------------------------------------------------------
// The rubric in the PARAMETROS_RUBRICA sheet
// ---------------------------------------------------------------------------

var _rubricCache = null;

/**
 * The rubric in force: the PARAMETROS_RUBRICA sheet when it has rows, the official default
 * otherwise. Returns the validation result too; callers that score refuse an invalid rubric.
 */
function activeRubric() {
  if (_rubricCache) return _rubricCache;
  var rows = [];
  try {
    if (libro().getSheetByName(HOJA.PARAMETROS_RUBRICA)) rows = leerHoja(HOJA.PARAMETROS_RUBRICA);
  } catch (e) { rows = []; }
  var built = rows.length ? rubricFromRows(rows) : { version: RUBRIC_VERSION_DEFAULT, categorias: RUBRIC_DEFAULT };
  var check = validateRubric(built.categorias);
  _rubricCache = {
    version: built.version || RUBRIC_VERSION_DEFAULT,
    categorias: built.categorias,
    fingerprint: rubricFingerprint(built.categorias),
    origen: rows.length ? 'PARAMETROS_RUBRICA' : 'DEFECTO',
    valida: check.ok,
    errores: check.errores
  };
  return _rubricCache;
}

function invalidateRubricCache() { _rubricCache = null; }

/** Categories used to lay out the jury sheets; an invalid sheet never reshapes them. */
function activeRubricCategories() {
  var r = activeRubric();
  return r.valida ? r.categorias : RUBRIC_DEFAULT;
}

/** Everything the private "Cómo calificar" panel shows. */
function rubricGuide(rubric) {
  var r = rubric || activeRubric();
  var cats = r.categorias;
  return {
    version: r.version,
    escala: RUBRIC_SCALE,
    minimo: rubricMinTotal(cats),
    maximo: rubricMaxTotal(cats),
    categorias: cats.map(function (c) {
      return {
        id: c.id, orden: c.orden, categoria: c.categoria, corta: c.corta, categoria_no_vocal: c.categoria_no_vocal,
        descripcion: c.descripcion, factor: c.factor, puntos_max: c.factor * RATING_MAX,
        niveles: c.niveles.map(function (texto, i) { return { nota: i + 1, etiqueta: RUBRIC_SCALE[i].etiqueta, texto: texto }; }),
        desempate: c.desempate
      };
    }),
    desempate: cats.filter(function (c) { return c.desempate; }).map(function (c) { return c.corta; }),
    metodos_desempate: TIE_METHODS,
    causales_dq: DQ_CAUSES
  };
}

// ---------------------------------------------------------------------------
// Jury sheets
// ---------------------------------------------------------------------------

function hojaDeJurado(alias) {
  var usuarios = leerHoja(HOJA.USUARIOS);
  for (var i = 0; i < usuarios.length; i++) {
    if (normalizarComparable(usuarios[i].email_o_alias) === normalizarComparable(alias)) {
      var m = String(usuarios[i].nota || '').match(/jurado\s*([123])/i);
      if (m) return 'JURADO_' + m[1];
    }
  }
  var n = String(alias || '').match(/([123])\s*$/);
  if (n) return 'JURADO_' + n[1];
  throw new Error('No se pudo determinar la hoja de este jurado. En _USUARIOS, la nota debe decir "jurado 1", "jurado 2" o "jurado 3".');
}

function ratingsOf(row, rubric) {
  var out = {};
  (rubric || activeRubricCategories()).forEach(function (c) {
    var v = row[c.id];
    out[c.id] = esPuntajeValido(v) ? Number(v) : null;
  });
  return out;
}

/**
 * Every juror card by project code: { 'B-001': [{ jurado: 1, estado, puntajes, total, row }] }.
 * Used by results, dashboard and exports; the ranking counts only ENVIADA cards.
 */
function evaluationCards() {
  var rubric = activeRubricCategories();
  var byCode = {};
  JURY_SHEETS.forEach(function (sheetName, i) {
    leerHoja(sheetName).forEach(function (row) {
      var code = normalizarComparable(row.code);
      if (!code) return;
      (byCode[code] = byCode[code] || []).push({
        jurado: i + 1,
        estado: normalizarComparable(row.estado) || EVALUATION_STATE.BORRADOR,
        puntajes: ratingsOf(row, rubric),
        total: row.total,
        observaciones: row.observaciones || '',
        dq_flag: esVerdadero(row.dq_flag),
        row: row
      });
    });
  });
  return byCode;
}

function sentCards(cards) {
  return (cards || []).filter(function (c) { return c.estado === EVALUATION_STATE.ENVIADA; });
}

// ---------------------------------------------------------------------------
// Juror screen
// ---------------------------------------------------------------------------

function accionListaEvaluacion(datos, sesion) {
  var rubric = activeRubric();
  var mySheet = hojaDeJurado(sesion.alias);
  var mine = {};
  leerHoja(mySheet).forEach(function (f) { if (f.code) mine[normalizarComparable(f.code)] = f; });

  // Everyone who reached the venue is listed so the juror can follow the day; only REALIZADA can be scored.
  var rows = leerHoja(HOJA.REGISTRO).filter(function (r) {
    return normalizarTexto(r.code) && normalizarTexto(r.attendance_status) &&
           normalizarEstado(r.attendance_status) !== ESTADO.CONFIRMADO;
  });

  return {
    hoja: mySheet,
    rubrica: rubricGuide(rubric),
    rubrica_valida: rubric.valida,
    rubrica_errores: rubric.errores,
    resultados_cerrados: cfgBool('resultados_cerrados', false),
    participantes: rows.map(function (r) {
      var card = mine[normalizarComparable(r.code)];
      var state = card ? (normalizarComparable(card.estado) || EVALUATION_STATE.BORRADOR) : '';
      return {
        code: r.code,
        artistic_name: r.artistic_name || '(sin nombre artístico)',
        discipline: projectGenre(r),
        participation_mode: r.participation_mode || 'SOLISTA',
        members_declared: Number(r.members_declared) || 1,
        presentation_format: r.presentation_format || '',
        presentation_format_texto: presentationFormatText(r.presentation_format, r.presentation_other),
        categoria_1: categoryLabelFor(rubric.categorias[0], r.presentation_format),
        song_name: r.song_name || '',
        attendance_status: r.attendance_status,
        audition_status: r.audition_status || '',
        calificable: normalizarEstado(r.audition_status) === ESTADO.REALIZADA ||
                     normalizarEstado(r.attendance_status) === ESTADO.REALIZADA,
        estado_tarjeta: state,
        bloqueada: state === EVALUATION_STATE.ENVIADA,
        total: card && normalizarTexto(card.total) ? Number(card.total) : null,
        puntajes: card ? ratingsOf(card, rubric.categorias) : null,
        observaciones: card ? card.observaciones : '',
        dq_flag: card ? esVerdadero(card.dq_flag) : false,
        dq_causa: card ? card.dq_causa || '' : ''
      };
    })
  };
}

/**
 * Saves a draft, or submits and locks the card when `enviar` is true.
 * A draft may be partial; a submission must be complete (every category 1-5).
 * Observations never change the score. A disqualification report is recorded apart and
 * waits for validation by an authorized role.
 */
function accionGuardarEvaluacion(datos, sesion) {
  var rubric = activeRubric();
  if (!rubric.valida) {
    return { ok: false, error: 'La rúbrica configurada no es válida (' + rubric.errores.join(' ') + '). Avisa a dirección.' };
  }
  if (cfgBool('resultados_cerrados', false)) {
    return { ok: false, error: 'Los resultados ya están cerrados: no se reciben más evaluaciones.' };
  }
  return conBloqueo(function () {
    var mySheet = hojaDeJurado(sesion.alias);
    var registro = buscarPorCodigo(datos.code);
    if (!registro) return { ok: false, error: 'Código no encontrado.' };

    var forced = esVerdadero(datos.forzar) && sesion.rol === ROL.ADMIN;
    if (normalizarEstado(registro.audition_status) !== ESTADO.REALIZADA &&
        normalizarEstado(registro.attendance_status) !== ESTADO.REALIZADA && !forced) {
      return { ok: false, error: 'Este participante aún no tiene la audición marcada como REALIZADA.' };
    }

    var existing = leerHoja(mySheet).filter(function (f) {
      return normalizarComparable(f.code) === normalizarComparable(registro.code);
    })[0];
    if (existing && normalizarComparable(existing.estado) === EVALUATION_STATE.ENVIADA) {
      return { ok: false, error: 'Esta evaluación ya fue enviada y está bloqueada. Solo dirección puede reabrirla.', bloqueada: true };
    }

    var ratings = {};
    var badValues = [];
    rubric.categorias.forEach(function (c) {
      var v = datos[c.id];
      if (v === undefined || v === null || v === '') { ratings[c.id] = ''; return; }
      if (!esPuntajeValido(v)) { badValues.push(c.corta); ratings[c.id] = ''; return; }
      ratings[c.id] = Number(v);
    });
    if (badValues.length) {
      return { ok: false, error: 'Cada categoría se califica de ' + RATING_MIN + ' a ' + RATING_MAX + ' (revisa: ' + badValues.join(', ') + ').' };
    }

    var calc = calcularPuntajeJurado(ratings, rubric.categorias);
    var submit = esVerdadero(datos.enviar);
    if (submit && !calc.valido) {
      var names = rubric.categorias.filter(function (c) { return calc.faltantes.indexOf(c.id) !== -1; }).map(function (c) { return c.corta; });
      return { ok: false, error: 'Para enviar faltan: ' + names.join(', ') + '.', faltantes: calc.faltantes };
    }

    var dqCause = normalizarComparable(datos.dq_causa);
    var dqFlag = esVerdadero(datos.dq_flag) && DQ_CAUSES.some(function (c) { return c.id === dqCause; });
    if (esVerdadero(datos.dq_flag) && !dqFlag) return { ok: false, error: 'Elige la causal de descalificación.' };

    var now = ahoraISO();
    var row = {
      code: registro.code,
      artistic_name: registro.artistic_name,
      discipline: projectGenre(registro),
      presentation_format: registro.presentation_format || '',
      rubric_version: rubric.version,
      rubric_fingerprint: rubric.fingerprint,
      total: calc.valido ? calc.total : '',
      desempate: calc.valido ? calc.desempate : '',
      estado: submit ? EVALUATION_STATE.ENVIADA : EVALUATION_STATE.BORRADOR,
      observaciones: String(datos.observaciones || '').slice(0, 900),
      dq_flag: dqFlag ? 'TRUE' : 'FALSE',
      dq_causa: dqFlag ? dqCause : '',
      dq_nota: dqFlag ? String(datos.dq_nota || '').slice(0, 500) : '',
      evaluado_at: now,
      enviado_at: submit ? now : '',
      evaluado_by: sesion.alias
    };
    rubric.categorias.forEach(function (c) { row[c.id] = ratings[c.id]; });

    if (existing) actualizarFila(mySheet, existing._fila, row);
    else agregarFila(mySheet, row);

    registrar(sesion.alias, sesion.rol, submit ? 'EVALUACION_ENVIADA' : 'EVALUACION_BORRADOR', registro.code,
              calc.valido ? 'total=' + calc.total : 'parcial');

    if (dqFlag) reportDisqualification(registro, dqCause, row.dq_nota, sesion);

    return {
      code: registro.code, hoja: mySheet, estado: row.estado, total: calc.valido ? calc.total : null,
      detalle: calc.detalle, bloqueada: submit,
      mensaje: submit ? 'Evaluación enviada y bloqueada: ' + calc.total + ' / ' + rubricMaxTotal(rubric.categorias) + ' puntos.'
                      : 'Borrador guardado.'
    };
  });
}

// ---------------------------------------------------------------------------
// Corrections and disqualifications (authorized roles only)
// ---------------------------------------------------------------------------

/** Reopens a submitted card so its juror can correct it. Direction/admin, with a reason. */
function accionReabrirEvaluacion(datos, sesion) {
  var reason = normalizarTexto(datos.motivo);
  if (reason.length < 5) return { ok: false, error: 'Escribe el motivo de la corrección.' };
  if (cfgBool('resultados_cerrados', false)) return { ok: false, error: 'Los resultados están cerrados. Primero hay que reabrirlos.' };
  var juror = parseInt(datos.jurado, 10);
  if (!(juror >= 1 && juror <= 3)) return { ok: false, error: 'Jurado inválido.' };
  return conBloqueo(function () {
    var sheetName = 'JURADO_' + juror;
    var card = leerHoja(sheetName).filter(function (f) { return normalizarComparable(f.code) === normalizarComparable(datos.code); })[0];
    if (!card) return { ok: false, error: 'Ese jurado no tiene evaluación para ' + datos.code + '.' };
    if (normalizarComparable(card.estado) !== EVALUATION_STATE.ENVIADA) return { ok: false, error: 'La evaluación no está enviada: el jurado ya puede editarla.' };
    actualizarFila(sheetName, card._fila, {
      estado: EVALUATION_STATE.BORRADOR, reabierta_at: ahoraISO(), reabierta_by: sesion.alias, reabierta_motivo: reason.slice(0, 400)
    });
    registrar(sesion.alias, sesion.rol, 'EVALUACION_REABIERTA', card.code, 'jurado=' + juror + ' total_previo=' + card.total + ' motivo=' + reason);
    return { ok: true, code: card.code, jurado: juror, mensaje: 'Evaluación reabierta. El jurado ' + juror + ' puede corregirla y volver a enviarla.' };
  });
}

/** A juror's report opens a PENDING disqualification; one open report per project and juror. */
function reportDisqualification(registro, cause, note, sesion) {
  var open = leerHoja(HOJA.DESCALIFICACIONES).filter(function (d) {
    return normalizarComparable(d.code) === normalizarComparable(registro.code) &&
           normalizarComparable(d.reportado_por) === normalizarComparable(sesion.alias) &&
           normalizarComparable(d.estado) === DQ_STATUS.PENDIENTE;
  })[0];
  if (open) return open.dq_id;
  var id = nuevoId('DQ');
  agregarFila(HOJA.DESCALIFICACIONES, {
    dq_id: id, code: registro.code, submission_id: registro.submission_id, causa: cause, nota: note || '',
    reportado_por: sesion.alias, reportado_at: ahoraISO(), estado: DQ_STATUS.PENDIENTE,
    resuelto_por: '', resuelto_at: '', motivo: ''
  });
  if (normalizarComparable(registro.dq_status) !== DQ_STATUS.VALIDADA) {
    actualizarFila(HOJA.REGISTRO, registro._fila, { dq_status: DQ_STATUS.PENDIENTE });
  }
  registrar(sesion.alias, sesion.rol, 'DQ_REPORTADA', registro.code, cause);
  return id;
}

function accionListarDescalificaciones() {
  var causes = {};
  DQ_CAUSES.forEach(function (c) { causes[c.id] = c.etiqueta; });
  return {
    causales: DQ_CAUSES,
    reportes: leerHoja(HOJA.DESCALIFICACIONES).map(function (d) {
      return {
        dq_id: d.dq_id, code: d.code, causa: d.causa, causa_texto: causes[normalizarComparable(d.causa)] || d.causa,
        nota: d.nota, reportado_por: d.reportado_por, reportado_at: humanDateTime(d.reportado_at),
        estado: d.estado, resuelto_por: d.resuelto_por, motivo: d.motivo
      };
    })
  };
}

/** Direction/admin validates (the project leaves the ranking) or dismisses a report. */
function accionResolverDescalificacion(datos, sesion) {
  var decision = normalizarComparable(datos.decision);
  if (decision !== DQ_STATUS.VALIDADA && decision !== DQ_STATUS.DESCARTADA) return { ok: false, error: 'Decisión inválida.' };
  var reason = normalizarTexto(datos.motivo);
  if (reason.length < 5) return { ok: false, error: 'Documenta el motivo de la decisión.' };
  return conBloqueo(function () {
    var report = leerHoja(HOJA.DESCALIFICACIONES).filter(function (d) { return d.dq_id === datos.dq_id; })[0];
    if (!report) return { ok: false, error: 'Reporte no encontrado.' };
    if (normalizarComparable(report.estado) !== DQ_STATUS.PENDIENTE) return { ok: false, error: 'Ese reporte ya fue resuelto.' };
    actualizarFila(HOJA.DESCALIFICACIONES, report._fila, {
      estado: decision, resuelto_por: sesion.alias, resuelto_at: ahoraISO(), motivo: reason.slice(0, 500)
    });
    var registro = buscarPorCodigo(report.code);
    if (registro) {
      var stillOpen = leerHoja(HOJA.DESCALIFICACIONES).some(function (d) {
        return d.dq_id !== report.dq_id && normalizarComparable(d.code) === normalizarComparable(report.code) &&
               normalizarComparable(d.estado) === DQ_STATUS.PENDIENTE;
      });
      var status = decision === DQ_STATUS.VALIDADA ? DQ_STATUS.VALIDADA
        : (normalizarComparable(registro.dq_status) === DQ_STATUS.VALIDADA ? DQ_STATUS.VALIDADA : (stillOpen ? DQ_STATUS.PENDIENTE : ''));
      actualizarFila(HOJA.REGISTRO, registro._fila, { dq_status: status });
    }
    registrar(sesion.alias, sesion.rol, decision === DQ_STATUS.VALIDADA ? 'DQ_VALIDADA' : 'DQ_DESCARTADA', report.code, reason);
    return { ok: true, dq_id: report.dq_id, estado: decision };
  });
}

/** "2026-10-23 20:41" from an ISO stamp, for staff screens. */
function humanDateTime(value) {
  if (!value) return '';
  var d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return Utilities.formatDate(d, zonaHoraria(), 'yyyy-MM-dd HH:mm');
}

// ========================================================================
// 25_api_bolsa.gs
// ========================================================================

/**
 * EL BUNKER - Pool of eligible projects, withdrawals, substitute offers, final confirmation
 * and the official list of the event.
 *
 * Rules (release QA, section 9):
 *  - 100 operative slots (B-001..B-100); eligible projects beyond them wait as substitutes
 *    (positions 101-200 of the pool), ordered only by submission time.
 *  - A withdrawal frees exactly that slot. It is offered to ONE substitute at a time; if they
 *    turn it down or do not answer in time, it goes to the next one. Nobody else moves.
 *  - The substitute inherits the slot (code + current schedule), never the previous holder's data.
 *    The previous holder keeps the number in `previous_code`; submission_id never changes.
 *  - Once the official list is consolidated, ordinary changes stop.
 *
 * Functions whose name ends in `Locked` expect the caller to hold the script lock.
 */

// ---------------------------------------------------------------------------
// Ledger helpers
// ---------------------------------------------------------------------------

function slotHistoryLocked(slotCode, event, submissionId, actor, detail) {
  agregarFila(HOJA.SLOTS_HISTORIAL, {
    at: isoWithOffset(), slot_code: slotCode, evento: event, submission_id: submissionId || '',
    actor: actor || 'sistema', detalle: String(detail || '').slice(0, 500)
  });
}

function pendingOffersBySubmission(offers) {
  var out = {};
  (offers || []).forEach(function (o) {
    if (normalizarComparable(o.estado) === OFFER_STATUS.PENDIENTE) out[o.submission_id] = o;
  });
  return out;
}

function offerExpired(offer, nowMs) {
  var t = new Date(offer.expires_at).getTime();
  return !isNaN(t) && t <= (nowMs || Date.now());
}

function currentWindows() {
  return operationWindows(new Date().toISOString(), operationCalendar());
}

/**
 * Writes priority_rank, pool_status and the derived participation_status of every project.
 * One batched write; only rows whose values changed are touched.
 */
function refreshPoolLocked(rows, offers) {
  rows = rows || leerHoja(HOJA.REGISTRO);
  offers = offers || leerHoja(HOJA.OFERTAS);
  var pool = computePool(rows, poolOptions());
  var bySubmission = {};
  pool.filas.forEach(function (p) { bySubmission[p.submission_id] = p; });
  var pending = pendingOffersBySubmission(offers);
  var updates = [];
  rows.forEach(function (r) {
    var p = bySubmission[r.submission_id];
    var rank = p ? p.priority_rank : '';
    var status = p ? p.pool_status : '';
    var participation = participationStatus(r, !!pending[r.submission_id]);
    if (String(r.priority_rank) !== String(rank) || normalizarComparable(r.pool_status) !== status ||
        normalizarComparable(r.participation_status) !== participation) {
      updates.push({ fila: r._fila, cambios: { priority_rank: rank, pool_status: status, participation_status: participation } });
    }
  });
  actualizarFilasEnLote(HOJA.REGISTRO, updates);
  return { principales: pool.principales, suplentes: pool.suplentes, fuera_de_bolsa: pool.fuera, actualizadas: updates.length };
}

// ---------------------------------------------------------------------------
// Releasing a slot and offering it
// ---------------------------------------------------------------------------

/**
 * Frees the slot held by `row`. `final` marks a withdrawal given at the final confirmation
 * (RETIRO_FINAL). Returns what happened to the slot: offered to a substitute or left vacant.
 */
function releaseSlotLocked(row, opts) {
  opts = opts || {};
  var code = normalizarComparable(row.code);
  if (!code) return { ok: false, error: 'Este proyecto no tiene un cupo asignado.' };
  if (isWithdrawn(row)) return { ok: false, error: 'Este proyecto ya se retiró.' };
  var now = isoWithOffset();
  var slot = {
    code: code,
    block: row.final_block || row.original_block || '',
    arrival: clockText(row.arrival_time) || '',
    time: clockText(row.final_time || row.original_time) || ''
  };
  actualizarFila(HOJA.REGISTRO, row._fila, {
    code: '',
    previous_code: [normalizarTexto(row.previous_code), code].filter(Boolean).join(','),
    withdrawal_status: opts.final ? WITHDRAWAL.RETIRO_FINAL : WITHDRAWAL.RETIRADO,
    withdrawn_at: now,
    withdrawn_by: opts.actor || 'participante',
    withdrawal_reason: String(opts.reason || '').slice(0, 400),
    final_confirmation: opts.final ? 'NO' : row.final_confirmation,
    final_confirmation_at: opts.final ? now : row.final_confirmation_at,
    pool_status: POOL_STATUS.RETIRADO,
    participation_status: opts.final ? PARTICIPATION.RETIRO_FINAL : PARTICIPATION.RETIRADO
  });
  slotHistoryLocked(code, opts.final ? 'RETIRO_FINAL' : 'LIBERADO', row.submission_id, opts.actor, opts.reason);
  registrar(opts.actor || 'participante', opts.rol || '', opts.final ? 'RETIRO_FINAL' : 'RETIRO', code, row.submission_id);
  enqueueEmail('RETIRO_CONFIRMADO', Object.assign({}, row, { code: '', previous_code: code }), 'retiro',
               { slot_code: code }, 'RETIRO_CONFIRMADO:' + row.submission_id + ':' + code);

  var outcome = currentWindows().reemplazo_viable
    ? offerSlotLocked(slot, opts.actor || 'sistema')
    : closeSlotVacantLocked(slot, opts.actor || 'sistema', 'Liberado después del límite para reemplazos.');
  return { ok: true, slot_code: code, reemplazo: outcome };
}

/** Offers a free slot to the next substitute in priority order, or leaves it vacant if none is left. */
function offerSlotLocked(slot, actor) {
  var rows = leerHoja(HOJA.REGISTRO);
  var offers = leerHoja(HOJA.OFERTAS);
  var state = slotStatuses(rows, offers, poolOptions()).filter(function (s) { return s.slot_code === slot.code; })[0];
  if (state && (state.status === SLOT_STATUS.ASIGNADO || state.status === SLOT_STATUS.OFRECIDO)) {
    return { estado: state.status, mensaje: 'El cupo ' + slot.code + ' ya está ' + state.status.toLowerCase() + '.' };
  }
  var nowIso = isoWithOffset();
  var expires = offerExpiry(new Date().toISOString(), cfgNumero('suplente_horas_respuesta', 24), cfg('reemplazo_limite', ''));
  if (new Date(expires).getTime() - Date.now() < 3600000) {
    return closeSlotVacantLocked(slot, actor, 'No queda tiempo suficiente para que un suplente responda.');
  }
  var next = nextSubstitute(rows, offers, poolOptions());
  if (!next) return closeSlotVacantLocked(slot, actor, 'No hay suplentes disponibles en la bolsa.');

  var id = nuevoId('OF');
  var expiresLocal = isoWithOffset(new Date(expires));
  agregarFila(HOJA.OFERTAS, {
    oferta_id: id, slot_code: slot.code, slot_block: slot.block, slot_arrival: slot.arrival, slot_time: slot.time,
    submission_id: next.submission_id, priority_rank: next.priority_rank, estado: OFFER_STATUS.PENDIENTE,
    created_at: nowIso, expires_at: expiresLocal, responded_at: '', actor: '', released_by: actor || 'sistema', notas: ''
  });
  slotHistoryLocked(slot.code, 'OFRECIDO', next.submission_id, actor, 'oferta ' + id + ' vence ' + expiresLocal);
  enqueueEmail('OFERTA_SUPLENTE', next, 'oferta',
               { slot_code: slot.code, slot_block: slot.block, slot_arrival: slot.arrival, slot_time: slot.time,
                 vence_texto: humanDateTime(expiresLocal) },
               'OFERTA_SUPLENTE:' + id);
  refreshPoolLocked();
  return { estado: SLOT_STATUS.OFRECIDO, oferta_id: id, submission_id: next.submission_id,
           priority_rank: next.priority_rank, vence: expiresLocal };
}

function closeSlotVacantLocked(slot, actor, reason) {
  agregarFila(HOJA.OFERTAS, {
    oferta_id: nuevoId('OF'), slot_code: slot.code, slot_block: slot.block, slot_arrival: slot.arrival, slot_time: slot.time,
    submission_id: '', priority_rank: '', estado: OFFER_STATUS.VACANTE, created_at: isoWithOffset(), expires_at: '',
    responded_at: '', actor: actor || 'sistema', released_by: actor || 'sistema', notas: String(reason || '').slice(0, 400)
  });
  slotHistoryLocked(slot.code, 'VACANTE_SIN_REEMPLAZO', '', actor, reason);
  refreshPoolLocked();
  return { estado: SLOT_STATUS.VACANTE_SIN_REEMPLAZO, mensaje: reason };
}

/** Marks a pending offer as turned down / expired, and passes the slot to the next substitute. */
function closeOfferLocked(offer, status, actor) {
  actualizarFila(HOJA.OFERTAS, offer._fila, { estado: status, responded_at: isoWithOffset(), actor: actor || 'sistema' });
  var holder = leerHoja(HOJA.REGISTRO).filter(function (r) { return r.submission_id === offer.submission_id; })[0];
  if (holder && !normalizarTexto(holder.code)) {
    actualizarFila(HOJA.REGISTRO, holder._fila, { pool_status: POOL_STATUS.DECLINO });
  }
  slotHistoryLocked(offer.slot_code, status === OFFER_STATUS.VENCIDA ? 'OFERTA_VENCIDA' : 'OFERTA_RECHAZADA',
                    offer.submission_id, actor, offer.oferta_id);
  var slot = { code: offer.slot_code, block: offer.slot_block, arrival: clockText(offer.slot_arrival) || offer.slot_arrival,
               time: clockText(offer.slot_time) || offer.slot_time };
  return currentWindows().reemplazo_viable
    ? offerSlotLocked(slot, 'sistema')
    : closeSlotVacantLocked(slot, 'sistema', 'Oferta cerrada después del límite para reemplazos.');
}

/** Expires every pending offer whose time ran out. Safe to call anywhere; used by the trigger. */
function expireOffersLocked() {
  var now = Date.now();
  var expired = leerHoja(HOJA.OFERTAS).filter(function (o) {
    return normalizarComparable(o.estado) === OFFER_STATUS.PENDIENTE && offerExpired(o, now);
  });
  var results = expired.map(function (o) {
    return { oferta_id: o.oferta_id, slot_code: o.slot_code, siguiente: closeOfferLocked(o, OFFER_STATUS.VENCIDA, 'sistema') };
  });
  return { vencidas: results.length, detalle: results };
}

/** Hourly trigger. */
function vencerOfertas() {
  try {
    var r = conBloqueo(function () { return expireOffersLocked(); });
    if (r.vencidas) registrar('sistema', '', 'OFERTAS_VENCIDAS', '', JSON.stringify(r.detalle).slice(0, 900));
    return r;
  } catch (e) {
    registrar('sistema', '', 'OFERTAS_VENCIDAS_FALLO', '', e.message);
    return { error: e.message };
  }
}

// ---------------------------------------------------------------------------
// Participant side (identity: ID number + code or receipt, like "Mi inscripción")
// ---------------------------------------------------------------------------

var WITHDRAW_CONFIRMATION = 'LIBERAR MI CUPO';

/** "NO PUEDO ASISTIR — SOLICITAR REEMPLAZO". Needs the second confirmation typed by the person. */
function accionRetirarme(datos) {
  datos = datos || {};
  var blocked = guardSubmission(datos, 'cambio');
  if (blocked) return blocked;
  var row = findOwnProject(datos);
  if (!row) return { ok: false, error: 'No encontramos una inscripción con esos datos.' };
  var w = currentWindows();
  if (w.lista_bloqueada) return { ok: false, error: 'La lista oficial del evento ya está cerrada. Escríbenos por WhatsApp.' };
  if (!w.retiro_abierto) return { ok: false, error: 'Esta opción se habilita el ' + deadlineText(cfg('reemplazos_desde', '')) + '.' };
  if (!normalizarTexto(row.code)) return { ok: false, error: 'Tu inscripción no tiene un cupo asignado que liberar.' };
  if (normalizarComparable(datos.confirmacion) !== WITHDRAW_CONFIRMATION) {
    return { ok: false, motivo: 'CONFIRMACION', error: 'Para liberar tu cupo confirma escribiendo: ' + WITHDRAW_CONFIRMATION };
  }
  var final = w.confirmacion_abierta;
  var key = 'retiro:' + row.submission_id;
  return exactlyOnce(key, function () {
    var fresh = leerHoja(HOJA.REGISTRO).filter(function (r) { return r.submission_id === row.submission_id; })[0];
    var released = releaseSlotLocked(fresh, { actor: 'participante', reason: datos.motivo || 'No puede asistir', final: final });
    if (!released.ok) return released;
    return {
      retirado: true, slot_code: released.slot_code,
      mensaje: 'Liberaste el cupo ' + released.slot_code + '. Gracias por avisar: lo recibirá la siguiente persona de la lista de suplentes. ' +
               'Esta decisión no se puede deshacer.'
    };
  });
}

/** CONFIRMACIÓN FINAL DE ASISTENCIA: SI keeps everything as is; NO frees the slot (RETIRO_FINAL). */
function accionConfirmacionFinal(datos) {
  datos = datos || {};
  var blocked = guardSubmission(datos, 'cambio');
  if (blocked) return blocked;
  var row = findOwnProject(datos);
  if (!row) return { ok: false, error: 'No encontramos una inscripción con esos datos.' };
  var w = currentWindows();
  if (w.lista_bloqueada) return { ok: false, error: 'La lista oficial del evento ya está cerrada.' };
  if (!w.confirmacion_abierta) {
    return { ok: false, error: 'La confirmación final está abierta del ' + deadlineText(cfg('confirmacion_final_desde', '')) +
                               ' al ' + deadlineText(cfg('confirmacion_final_hasta', '')) + '.' };
  }
  if (!normalizarTexto(row.code)) return { ok: false, error: 'Tu inscripción no tiene un cupo asignado.' };
  var answer = normalizarComparable(datos.respuesta);
  if (answer !== 'SI' && answer !== 'NO') return { ok: false, error: 'Respuesta inválida.' };
  if (answer === 'NO' && normalizarComparable(datos.confirmacion) !== WITHDRAW_CONFIRMATION) {
    return { ok: false, motivo: 'CONFIRMACION', error: 'Para liberar tu cupo confirma escribiendo: ' + WITHDRAW_CONFIRMATION };
  }
  return exactlyOnce('confirmacion-final:' + row.submission_id + ':' + answer, function () {
    var fresh = leerHoja(HOJA.REGISTRO).filter(function (r) { return r.submission_id === row.submission_id; })[0];
    if (!normalizarTexto(fresh.code)) return { ok: false, error: 'Tu inscripción ya no tiene un cupo asignado.' };
    if (answer === 'SI') {
      actualizarFila(HOJA.REGISTRO, fresh._fila, { final_confirmation: 'SI', final_confirmation_at: isoWithOffset() });
      registrar('participante', '', 'CONFIRMACION_FINAL_SI', fresh.code, '');
      refreshPoolLocked();
      return { confirmado: true, mensaje: '¡Confirmado! Te esperamos. Tu código y tu horario no cambian.' };
    }
    var released = releaseSlotLocked(fresh, { actor: 'participante', reason: 'Confirmación final: no podrá asistir', final: true });
    if (!released.ok) return released;
    return { confirmado: false, slot_code: released.slot_code,
             mensaje: 'Registramos que no podrás asistir y liberamos el cupo ' + released.slot_code + '. Gracias por avisar.' };
  });
}

/** A substitute accepts or turns down the slot offered to them. */
function accionResponderOferta(datos) {
  datos = datos || {};
  var blocked = guardSubmission(datos, 'cambio');
  if (blocked) return blocked;
  var row = findOwnProject(datos);
  if (!row) return { ok: false, error: 'No encontramos una inscripción con esos datos.' };
  var answer = normalizarComparable(datos.respuesta);
  if (answer !== 'ACEPTAR' && answer !== 'RECHAZAR') return { ok: false, error: 'Respuesta inválida.' };
  return exactlyOnce('oferta:' + datos.oferta_id + ':' + answer, function () {
    var offer = leerHoja(HOJA.OFERTAS).filter(function (o) { return o.oferta_id === datos.oferta_id; })[0];
    if (!offer || offer.submission_id !== row.submission_id) return { ok: false, error: 'No encontramos esa oferta para tu inscripción.' };
    if (normalizarComparable(offer.estado) !== OFFER_STATUS.PENDIENTE) return { ok: false, error: 'Esta oferta ya no está vigente (' + offer.estado + ').' };
    if (offerExpired(offer)) {
      closeOfferLocked(offer, OFFER_STATUS.VENCIDA, 'sistema');
      return { ok: false, error: 'El plazo para responder esta oferta ya venció.' };
    }
    if (answer === 'RECHAZAR') {
      closeOfferLocked(offer, OFFER_STATUS.RECHAZADA, 'participante');
      registrar('participante', '', 'OFERTA_RECHAZADA', offer.slot_code, row.submission_id);
      return { aceptada: false, mensaje: 'Registramos tu respuesta. El cupo pasa a la siguiente persona de la lista.' };
    }
    return acceptOfferLocked(offer, row.submission_id, 'participante');
  });
}

function acceptOfferLocked(offer, submissionId, actor) {
  if (currentWindows().lista_bloqueada) return { ok: false, error: 'La lista oficial del evento ya está cerrada.' };
  var rows = leerHoja(HOJA.REGISTRO);
  var holder = rows.filter(function (r) { return normalizarComparable(r.code) === normalizarComparable(offer.slot_code); })[0];
  if (holder) return { ok: false, error: 'Ese cupo ya tiene titular.' };
  var fresh = rows.filter(function (r) { return r.submission_id === submissionId; })[0];
  if (!fresh || normalizarTexto(fresh.code) || isWithdrawn(fresh)) return { ok: false, error: 'Tu inscripción no puede recibir este cupo.' };
  var now = isoWithOffset();
  var time = clockText(offer.slot_time) || offer.slot_time;
  actualizarFila(HOJA.REGISTRO, fresh._fila, {
    code: offer.slot_code, issued_at: now, issued_by: 'reemplazo:' + offer.oferta_id,
    original_block: offer.slot_block, original_time: time, final_block: offer.slot_block, final_time: time,
    arrival_time: clockText(offer.slot_arrival) || offer.slot_arrival,
    attendance_status: ESTADO.CONFIRMADO, change_status: ESTADO_CAMBIO.SIN_SOLICITUD, change_requested: '',
    final_confirmation: '', final_confirmation_at: '', pool_status: POOL_STATUS.PRINCIPAL
  });
  actualizarFila(HOJA.OFERTAS, offer._fila, { estado: OFFER_STATUS.ACEPTADA, responded_at: now, actor: actor });
  slotHistoryLocked(offer.slot_code, 'ASIGNADO', submissionId, actor, 'oferta ' + offer.oferta_id + ' aceptada');
  registrar(actor, '', 'OFERTA_ACEPTADA', offer.slot_code, submissionId);
  refreshPoolLocked();
  var updated = leerHoja(HOJA.REGISTRO).filter(function (r) { return r.submission_id === submissionId; })[0];
  enqueueEmail('ASIGNACION', updated, 'reemplazo', {}, 'ASIGNACION:' + submissionId + ':' + offer.slot_code);
  return { aceptada: true, code: offer.slot_code,
           mensaje: '¡Listo! El cupo ' + offer.slot_code + ' es tuyo. Te enviamos tu código y horario por correo.' };
}

// ---------------------------------------------------------------------------
// Staff side
// ---------------------------------------------------------------------------

/** Pool, slots and offers in one view for the logistics panel. */
function accionBolsa(datos) {
  var rows = leerHoja(HOJA.REGISTRO);
  var offers = leerHoja(HOJA.OFERTAS);
  var options = poolOptions();
  var pool = computePool(rows, options);
  var bySubmission = {};
  rows.forEach(function (r) { bySubmission[r.submission_id] = r; });
  var pending = pendingOffersBySubmission(offers);
  var list = pool.filas.filter(function (p) { return p.pool_status !== POOL_STATUS.RETIRADO; })
    .sort(function (a, b) { return (Number(a.priority_rank) || 9999) - (Number(b.priority_rank) || 9999); })
    .map(function (p) {
      var r = bySubmission[p.submission_id] || {};
      return {
        priority_rank: p.priority_rank, pool_status: p.pool_status, submission_id: p.submission_id, code: r.code || '',
        artistic_name: r.artistic_name || '', participation_mode: r.participation_mode || 'SOLISTA',
        created_at: String(r.created_at || '').replace('T', ' ').slice(0, 16),
        oferta: pending[p.submission_id] ? pending[p.submission_id].slot_code : ''
      };
    });
  var slots = slotStatuses(rows, offers, options).map(function (s) {
    var r = s.holder_submission_id ? bySubmission[s.holder_submission_id] : null;
    var o = s.offered_to ? bySubmission[s.offered_to] : null;
    return Object.assign({}, s, { holder: r ? r.artistic_name : '', offered_name: o ? o.artistic_name : '' });
  });
  var counts = {};
  slots.forEach(function (s) { counts[s.status] = (counts[s.status] || 0) + 1; });
  return {
    ventanas: currentWindows(),
    resumen: { principales: pool.principales, suplentes: pool.suplentes, fuera_de_bolsa: pool.fuera, cupos: counts },
    bolsa: list,
    cupos: slots,
    ofertas: offers.slice(-300).reverse().map(function (o) {
      var r = bySubmission[o.submission_id] || {};
      return Object.assign({}, o, { artistic_name: r.artistic_name || '', vence: humanDateTime(o.expires_at),
                                    creada: humanDateTime(o.created_at) });
    }),
    lista_oficial: { bloqueada: cfgBool('lista_oficial_bloqueada', false), version: cfg('lista_oficial_version', ''),
                     at: cfg('lista_oficial_at', ''), by: cfg('lista_oficial_by', '') }
  };
}

/** Logistics withdraws a project (e.g. the person called or wrote). Frees exactly that slot. */
function accionRetirarParticipante(datos, sesion) {
  var reason = normalizarTexto(datos.motivo);
  if (reason.length < 5) return { ok: false, error: 'Escribe el motivo del retiro: queda en la bitácora.' };
  if (currentWindows().lista_bloqueada) return { ok: false, error: 'La lista oficial ya está consolidada.' };
  return conBloqueo(function () {
    var row = buscarPorCodigo(datos.code);
    if (!row) return { ok: false, error: 'Código no encontrado.' };
    var released = releaseSlotLocked(row, { actor: sesion.alias, rol: sesion.rol, reason: reason, final: esVerdadero(datos.final) });
    if (!released.ok) return released;
    return { slot_code: released.slot_code, reemplazo: released.reemplazo,
             mensaje: 'Cupo ' + released.slot_code + ' liberado. ' + (released.reemplazo.estado === SLOT_STATUS.OFRECIDO
               ? 'Se ofreció al suplente con prioridad ' + released.reemplazo.priority_rank + '.'
               : 'Quedó como vacante: ' + (released.reemplazo.mensaje || '')) };
  });
}

/** Offers a freed (LIBERADO or VACANTE) slot again, e.g. when new substitutes became eligible. */
function accionOfrecerCupo(datos, sesion) {
  if (currentWindows().lista_bloqueada) return { ok: false, error: 'La lista oficial ya está consolidada.' };
  return conBloqueo(function () {
    expireOffersLocked();
    var code = normalizarComparable(datos.slot_code);
    var rows = leerHoja(HOJA.REGISTRO);
    var offers = leerHoja(HOJA.OFERTAS);
    var state = slotStatuses(rows, offers, poolOptions()).filter(function (s) { return s.slot_code === code; })[0];
    if (!state) return { ok: false, error: 'Cupo inválido.' };
    if (state.status !== SLOT_STATUS.LIBERADO && state.status !== SLOT_STATUS.VACANTE_SIN_REEMPLAZO) {
      return { ok: false, error: 'Solo se ofrece un cupo liberado o vacante (este está ' + state.status + ').' };
    }
    var last = offers.filter(function (o) { return normalizarComparable(o.slot_code) === code; }).pop();
    var prev = rows.filter(function (r) { return String(r.previous_code || '').split(',').indexOf(code) !== -1; })[0];
    var slot = last
      ? { code: code, block: last.slot_block, arrival: clockText(last.slot_arrival) || last.slot_arrival, time: clockText(last.slot_time) || last.slot_time }
      : { code: code, block: prev ? (prev.final_block || prev.original_block) : '', arrival: prev ? clockText(prev.arrival_time) : '',
          time: prev ? clockText(prev.final_time || prev.original_time) : '' };
    registrar(sesion.alias, sesion.rol, 'OFRECER_CUPO', code, '');
    return { resultado: offerSlotLocked(slot, sesion.alias) };
  });
}

/** Closes a slot without replacement (cancels its pending offer, if any). */
function accionCerrarVacante(datos, sesion) {
  var reason = normalizarTexto(datos.motivo);
  if (reason.length < 5) return { ok: false, error: 'Escribe el motivo.' };
  return conBloqueo(function () {
    var code = normalizarComparable(datos.slot_code);
    var offers = leerHoja(HOJA.OFERTAS);
    if (buscarPorCodigo(code)) return { ok: false, error: 'Ese cupo tiene titular: primero hay que retirarlo.' };
    var pending = offers.filter(function (o) {
      return normalizarComparable(o.slot_code) === code && normalizarComparable(o.estado) === OFFER_STATUS.PENDIENTE;
    })[0];
    if (pending) actualizarFila(HOJA.OFERTAS, pending._fila, { estado: OFFER_STATUS.CANCELADA, responded_at: isoWithOffset(), actor: sesion.alias });
    var last = offers.filter(function (o) { return normalizarComparable(o.slot_code) === code; }).pop() || {};
    registrar(sesion.alias, sesion.rol, 'CERRAR_VACANTE', code, reason);
    return closeSlotVacantLocked({ code: code, block: last.slot_block || '', arrival: last.slot_arrival || '', time: last.slot_time || '' },
                                 sesion.alias, reason);
  });
}

/** Recomputes the pool order (after eligibility decisions) and expires overdue offers. */
function accionRefrescarBolsa(datos, sesion) {
  return conBloqueo(function () {
    var expired = expireOffersLocked();
    var pool = refreshPoolLocked();
    registrar(sesion.alias, sesion.rol, 'REFRESCAR_BOLSA', '', JSON.stringify(pool));
    return { bolsa: pool, ofertas_vencidas: expired.vencidas };
  });
}

// ---------------------------------------------------------------------------
// CONSOLIDAR LISTA OFICIAL DEL EVENTO
// ---------------------------------------------------------------------------

var ROSTER_COLUMNS = ['slot_code', 'estado_cupo', 'final_block', 'arrival_time', 'final_time', 'submission_id', 'artistic_name',
                      'full_name', 'participation_mode', 'members_declared', 'final_confirmation', 'participation_status',
                      'reemplazo', 'track_status', 'observacion'];

/** Reconciliation of everything the official list depends on. Pure over the given rows. */
function rosterReconciliation(rows, offers, changes, cupo) {
  var slots = slotStatuses(rows, offers, { cupo: cupo });
  var bySubmission = {};
  rows.forEach(function (r) { bySubmission[r.submission_id] = r; });
  var holdersByCode = {};
  var duplicateCodes = [];
  rows.forEach(function (r) {
    var c = normalizarComparable(r.code);
    if (!c) return;
    if (holdersByCode[c]) duplicateCodes.push(c);
    holdersByCode[c] = true;
  });
  var roster = slots.map(function (s) {
    var r = s.holder_submission_id ? bySubmission[s.holder_submission_id] : null;
    var status = r ? participationStatus(r, false) : '';
    return {
      slot_code: s.slot_code, estado_cupo: s.status,
      final_block: r ? (r.final_block || r.original_block) : '', arrival_time: r ? clockText(r.arrival_time) : '',
      final_time: r ? clockText(r.final_time || r.original_time) : '', submission_id: r ? r.submission_id : '',
      artistic_name: r ? r.artistic_name : '', full_name: r ? r.full_name : '',
      participation_mode: r ? (r.participation_mode || 'SOLISTA') : '', members_declared: r ? r.members_declared : '',
      final_confirmation: r ? (normalizarComparable(r.final_confirmation) || 'SIN RESPUESTA') : '',
      participation_status: status,
      reemplazo: r && /^reemplazo:/.test(String(r.issued_by || '')) ? 'SI' : '',
      track_status: r ? r.track_status : '', observacion: ''
    };
  });
  var count = function (pred) { return roster.filter(pred).length; };
  return {
    roster: roster,
    conteos: {
      cupos: cupo,
      con_titular: count(function (x) { return x.estado_cupo === SLOT_STATUS.ASIGNADO; }),
      confirmados: count(function (x) { return x.final_confirmation === 'SI'; }),
      sin_respuesta: count(function (x) { return x.estado_cupo === SLOT_STATUS.ASIGNADO && x.final_confirmation === 'SIN RESPUESTA'; }),
      reemplazos: count(function (x) { return x.reemplazo === 'SI'; }),
      vacantes: count(function (x) { return x.estado_cupo === SLOT_STATUS.VACANTE_SIN_REEMPLAZO; }),
      liberados_sin_cerrar: count(function (x) { return x.estado_cupo === SLOT_STATUS.LIBERADO; }),
      ofertas_pendientes: count(function (x) { return x.estado_cupo === SLOT_STATUS.OFRECIDO; }),
      sin_emitir: count(function (x) { return x.estado_cupo === SLOT_STATUS.SIN_EMITIR; }),
      retirados: rows.filter(isWithdrawn).length,
      suplentes: rows.filter(function (r) { return normalizarComparable(r.pool_status) === POOL_STATUS.SUPLENTE; }).length,
      cambios_pendientes: (changes || []).filter(function (c) { return normalizarComparable(c.estado) === 'PENDIENTE'; }).length
    },
    codigos_duplicados: duplicateCodes
  };
}

/** Preview: what the official list would look like now. */
function accionVistaPreviaLista() {
  var r = rosterReconciliation(leerHoja(HOJA.REGISTRO), leerHoja(HOJA.OFERTAS), leerHoja(HOJA.CAMBIOS), cfgNumero('cupo_total', 100));
  return { conteos: r.conteos, codigos_duplicados: r.codigos_duplicados, bloqueada: cfgBool('lista_oficial_bloqueada', false),
           roster: r.roster.filter(function (x) { return x.estado_cupo !== SLOT_STATUS.SIN_EMITIR; }) };
}

/**
 * Consolidates the official list: reconciles, cancels open offers (their slots become vacant),
 * writes the ROSTER_FINAL snapshot sheet + a JSON copy, and locks ordinary changes.
 * Never deletes or resets anything.
 */
function accionConsolidarLista(datos, sesion) {
  if (normalizarComparable(datos.confirmacion) !== 'CONSOLIDAR') {
    return { ok: false, error: 'Para consolidar escribe CONSOLIDAR. Después no habrá cambios ordinarios.' };
  }
  return conBloqueo(function () {
    if (cfgBool('lista_oficial_bloqueada', false)) {
      return { ok: false, error: 'La lista ya está consolidada (' + cfg('lista_oficial_version', '') + ').' };
    }
    expireOffersLocked();
    leerHoja(HOJA.OFERTAS).filter(function (o) { return normalizarComparable(o.estado) === OFFER_STATUS.PENDIENTE; })
      .forEach(function (o) {
        actualizarFila(HOJA.OFERTAS, o._fila, { estado: OFFER_STATUS.CANCELADA, responded_at: isoWithOffset(), actor: sesion.alias });
        closeSlotVacantLocked({ code: o.slot_code, block: o.slot_block, arrival: o.slot_arrival, time: o.slot_time },
                              sesion.alias, 'Oferta abierta al consolidar la lista oficial.');
      });

    var rows = leerHoja(HOJA.REGISTRO);
    var rec = rosterReconciliation(rows, leerHoja(HOJA.OFERTAS), leerHoja(HOJA.CAMBIOS), cfgNumero('cupo_total', 100));
    if (rec.codigos_duplicados.length) {
      return { ok: false, error: 'Hay códigos con dos titulares: ' + rec.codigos_duplicados.join(', ') + '. Corrige antes de consolidar.' };
    }

    var book = libro();
    var base = cfg('lista_oficial_nombre', 'ROSTER_FINAL_2026-10-22');
    var name = base;
    for (var v = 2; book.getSheetByName(name); v++) name = base + ' v' + v;
    var sheet = book.insertSheet(name);
    var matrix = [ROSTER_COLUMNS].concat(rec.roster.map(function (x) {
      return ROSTER_COLUMNS.map(function (c) { return cellValue(x[c]); });
    }));
    sheet.getRange(1, 1, matrix.length, ROSTER_COLUMNS.length).setNumberFormat('@').setValues(matrix);
    sheet.getRange(1, 1, 1, ROSTER_COLUMNS.length).setFontWeight('bold').setBackground('#1D1D1B').setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
    sheet.protect().setDescription('Foto de la lista oficial consolidada. No se edita.').setWarningOnly(true);

    var at = isoWithOffset();
    var json = carpetaBackups().createFile(Utilities.newBlob(JSON.stringify({
      lista: name, consolidada_at: at, por: sesion.alias, version_sistema: VERSION_SISTEMA, entorno: environmentName(),
      conteos: rec.conteos, roster: rec.roster
    }, null, 1), 'application/json', name + '.json'));

    setConfigValue('lista_oficial_bloqueada', 'SI');
    setConfigValue('lista_oficial_version', name);
    setConfigValue('lista_oficial_at', at);
    setConfigValue('lista_oficial_by', sesion.alias);
    refreshPoolLocked();
    registrar(sesion.alias, sesion.rol, 'CONSOLIDAR_LISTA', name, JSON.stringify(rec.conteos));
    return { lista: name, conteos: rec.conteos, respaldo_json: json.getName(),
             mensaje: 'Lista oficial consolidada como ' + name + '. Desde ahora no hay cambios ordinarios.' };
  });
}

/** Admin only, for a real emergency: reopens ordinary changes. A later consolidation creates a new version. */
function accionDesbloquearLista(datos, sesion) {
  var reason = normalizarTexto(datos.motivo);
  if (reason.length < 10) return { ok: false, error: 'Escribe el motivo (queda en la bitácora).' };
  if (!cfgBool('lista_oficial_bloqueada', false)) return { ok: false, error: 'La lista no está bloqueada.' };
  setConfigValue('lista_oficial_bloqueada', 'NO');
  registrar(sesion.alias, sesion.rol, 'DESBLOQUEAR_LISTA', cfg('lista_oficial_version', ''), reason);
  return { mensaje: 'Lista desbloqueada. Al terminar la corrección, vuelve a consolidar (se creará una nueva versión).' };
}

// ========================================================================
// 30_vistas.gs
// ========================================================================

/**
 * EL BUNKER - Materialised views.
 *
 * REGISTRO (+ _INTEGRANTES for group members) is the single source of truth.
 * AGENDA, CHECK-IN, AGRUPACIONES, PISTAS, RESULTADOS and DASHBOARD are rebuilt
 * from it, which is precisely why a participant can never show one schedule on
 * one tab and a different one on another.
 */

function refrescarVistas() {
  var filas = leerHoja(HOJA.REGISTRO);
  var out = {
    agenda: reconstruirAgenda(filas),
    check_in: reconstruirCheckIn(filas),
    agrupaciones: reconstruirAgrupaciones(filas),
    pistas: reconstruirPistas(filas),
    resultados: reconstruirResultados(filas),
    bolsa: reconstruirBolsa(filas),
    seguro: reconstruirSeguro(filas)
  };
  out.dashboard = reconstruirDashboard(leerHoja(HOJA.REGISTRO));
  return out;
}

function limpiarDatos(nombreHoja) {
  var h = hoja(nombreHoja);
  if (h.getLastRow() > 1) {
    h.getRange(2, 1, h.getLastRow() - 1, Math.max(1, h.getLastColumn())).clearContent();
  }
  return h;
}

function byBlockThenCode(a, b) {
  var ba = Number(a.final_block || a.original_block || 99);
  var bb = Number(b.final_block || b.original_block || 99);
  if (ba !== bb) return ba - bb;
  return String(a.code) < String(b.code) ? -1 : 1;
}

function reconstruirAgenda(filas) {
  limpiarDatos(HOJA.AGENDA);
  var cfgAgenda = agendaConfigurada();
  var ocupacion = bloquesConCupo(filas, cfgAgenda);
  var porBloque = {};
  ocupacion.forEach(function (o) { porBloque[o.block_id] = o; });

  var datos = construirAgenda(cfgAgenda).map(function (b) {
    var o = porBloque[b.block_id];
    return {
      block_id: b.block_id, ventana: b.ventana, arrival_time: b.arrival_time,
      audition_time: b.audition_time, limite_tolerancia: b.limite_tolerancia,
      codigo_desde: b.codigo_desde, codigo_hasta: b.codigo_hasta,
      asignados: o ? o.ocupados : '', cupo: o ? o.cupo : '',
      disponibles: o ? o.disponibles : ''
    };
  });
  agregarFilas(HOJA.AGENDA, datos);
  return datos.length;
}

function reconstruirCheckIn(filas) {
  limpiarDatos(HOJA.CHECK_IN);
  var members = membersByGroup();
  var conCodigo = filas.filter(function (r) { return normalizarTexto(r.code); }).sort(byBlockThenCode);

  var datos = conCodigo.map(function (r) {
    var v = deskView(r, members);
    return {
      code: r.code, full_name: r.full_name, artistic_name: r.artistic_name,
      discipline: projectGenre(r),
      final_block: v.final_block, arrival_time: v.arrival_time, final_time: v.final_time,
      check_in_time: r.check_in_time || '',
      attendance_status: r.attendance_status || ESTADO.CONFIRMADO,
      audition_status: r.audition_status || '',
      operador_check_in: r.operador_check_in || '',
      notes: r.notes || '',
      participation_mode: v.participation_mode,
      members_declared: v.members_declared,
      members_authorized: r.group_code ? v.members_authorized : '',
      track_status: r.track_status || '',
      precola_at: r.precola_at || '', stage_at: r.stage_at || '', done_at: r.done_at || ''
    };
  });
  agregarFilas(HOJA.CHECK_IN, datos);
  return datos.length;
}

/**
 * One master row per group and its members right below it, grouped so the
 * operator can collapse or expand each group (the XLSX export keeps the
 * outline). A group counts as one project: only master rows are projects.
 */
function reconstruirAgrupaciones(filas) {
  var sheet = limpiarDatos(HOJA.AGRUPACIONES);
  if (sheet.getMaxRows() > 1) {
    try { sheet.getRange(2, 1, sheet.getMaxRows() - 1, 1).shiftRowGroupDepth(-8); } catch (e) { /* no groups yet */ }
  }
  var members = leerHoja(HOJA.INTEGRANTES);
  var groups = filas.filter(function (r) { return normalizarTexto(r.group_code); });
  groups.sort(function (a, b) { return String(a.group_code) < String(b.group_code) ? -1 : 1; });

  var out = [];
  var spans = [];
  groups.forEach(function (g) {
    var summary = groupSummary(g.group_code, members);
    out.push({
      row_type: 'PROYECTO', group_code: g.group_code, project_code: g.code || '',
      submission_id: g.submission_id, group_display_name: g.group_display_name || g.artistic_name,
      group_match_key: g.group_match_key, match_status: g.group_match_status || '',
      leader_name: g.full_name, leader_id_number: g.id_number, leader_whatsapp: g.whatsapp, leader_email: g.email,
      members_declared: g.members_declared, members_registered: summary.registered,
      members_authorized: summary.authorized, genre: projectGenre(g), eligibility_status: g.eligibility_status
    });
    var first = out.length;
    summary.list.forEach(function (m) {
      out.push({
        row_type: 'INTEGRANTE', group_code: g.group_code, project_code: g.code || '',
        submission_id: g.submission_id, group_display_name: g.group_display_name || g.artistic_name,
        member_id: m.member_id, member_name: m.full_name, member_id_number: m.id_number, member_age: m.age,
        member_role: (isCrew(m) ? 'EQUIPO DE TRABAJO: ' + (CREW_ROLE_LABELS[m.crew_role] || m.crew_role) : m.artistic_role) +
                     (esVerdadero(m.is_leader) ? ' (lider)' : ''),
        member_consents: ['T:' + (esVerdadero(m.consent_terms) ? 'SI' : 'NO'), 'D:' + (esVerdadero(m.consent_data) ? 'SI' : 'NO'),
                          'I:' + (esVerdadero(m.consent_image) ? 'SI' : 'NO')].join(' '),
        member_signature: normalizarTexto(m.signature_file_id) ? 'SI' : 'NO',
        member_status: m.member_status, member_alert: m.member_alert
      });
    });
    if (summary.list.length) spans.push({ start: first + 2, count: summary.list.length, master: first + 1 });
  });

  agregarFilas(HOJA.AGRUPACIONES, out);
  spans.forEach(function (s) {
    sheet.getRange(s.start, 1, s.count, 1).shiftRowGroupDepth(1);
    try { sheet.getRange(s.master, 1, 1, sheet.getLastColumn()).setFontWeight('bold'); } catch (e) { /* cosmetic */ }
  });
  try {
    sheet.setRowGroupControlPosition(SpreadsheetApp.GroupControlTogglePosition.BEFORE);
    sheet.collapseAllRowGroups();
  } catch (e) { /* cosmetic: grouping still works without it */ }
  return groups.length;
}

/** What the audio technician works from, in agenda order. */
function reconstruirPistas(filas) {
  limpiarDatos(HOJA.PISTAS);
  // Only people with a seat: a track can only be sent with a code (same rule as the panel lists).
  var rows = filas.filter(function (r) { return normalizarTexto(r.code); }).sort(byBlockThenCode);
  var datos = rows.map(function (r) {
    return {
      code: r.code, artistic_name: r.artistic_name || r.full_name, participation_mode: r.participation_mode,
      song_name: r.song_name, track_uses: esVerdadero(r.track_uses) ? 'SI' : 'NO', track_method: r.track_method,
      track_status: r.track_status || (esVerdadero(r.track_uses) ? TRACK_STATUS.PENDIENTE : TRACK_STATUS.NO_APLICA),
      track_file_name: r.track_file_name, track_file_url: driveFileUrl(r.track_file_id),
      track_updated_at: r.track_updated_at, track_notes: r.track_notes,
      final_block: r.final_block || r.original_block, final_time: clockText(r.final_time || r.original_time)
    };
  });
  agregarFilas(HOJA.PISTAS, datos);
  return datos.length;
}

/** Committee decisions in force: at most one per cut (10 and 20). */
function currentDeliberations() {
  var byCut = {};
  leerHoja(HOJA.DELIBERACIONES).forEach(function (x) {
    if (normalizarComparable(x.status) !== 'VIGENTE') return;
    byCut[String(x.cut_position)] = {
      deliberation_id: x.deliberation_id, cut_position: Number(x.cut_position),
      codes_in_order: String(x.codes_in_order || '').split(',').filter(Boolean),
      method: x.method || '', participants: x.participants || '', result: x.result || '', at: x.at, by: x.by
    };
  });
  return Object.keys(byCut).map(function (k) { return byCut[k]; });
}

/** Legacy single-decision accessor (last one in force), kept for older callers. */
function currentDeliberation() {
  var all = currentDeliberations();
  return all.length ? all[all.length - 1] : null;
}

/** The whole ranking computation from the source sheets: one function, used by views, panel and exports. */
function computeResults(filas) {
  var rubric = activeRubricCategories();
  var cards = evaluationCards();
  var artists = filas.filter(function (r) { return normalizarTexto(r.code); }).map(function (r) {
    return {
      code: r.code, artistic_name: r.artistic_name, full_name: r.full_name, discipline: projectGenre(r),
      audition_status: r.audition_status || r.attendance_status,
      dq_status: normalizarComparable(r.dq_status),
      tarjetas: sentCards(cards[normalizarComparable(r.code)])
    };
  });
  return seleccionarTop(artists, {
    top_publico: cfgNumero('top_seleccionados', 10),
    top_privado: cfgNumero('top_privado', 20),
    minimo_jurados: cfgNumero('minimo_jurados', 3),
    rubrica: rubric,
    deliberaciones: currentDeliberations(),
    resultados_cerrados: cfgBool('resultados_cerrados', false)
  });
}

/**
 * Writes RESULTADOS (private: Top 20, Top 10, ties, disqualifications) and persists
 * evaluation_status / ranking_status into REGISTRO so every screen and export reads the same.
 */
function reconstruirResultados(filas) {
  limpiarDatos(HOJA.RESULTADOS);
  var sel = computeResults(filas);
  var cards = evaluationCards();
  var applied = {};
  sel.deliberaciones_aplicadas.forEach(function (d) { applied[d.cut] = d.deliberation_id; });

  var datos = sel.ranking.map(function (a) {
    var byJuror = { 1: '', 2: '', 3: '' };
    a.totales_jurado.forEach(function (t) { byJuror[t.jurado] = t.total; });
    var notes = [];
    if (a.ranking_status === RANKING_STATUS.TIE_REVIEW_REQUIRED) notes.push('Empate en el corte: requiere revisión humana (acta).');
    Object.keys(applied).forEach(function (cut) { if (a.posicion <= Number(cut) + 5) notes.push('Acta ' + applied[cut] + ' (corte ' + cut + ')'); });
    if (a.dq_pendiente) notes.push('Reporte de descalificación PENDIENTE de validar.');
    return {
      posicion: a.posicion, code: a.code, artistic_name: a.artistic_name, full_name: a.full_name, discipline: a.discipline,
      jurado_1: byJuror[1], jurado_2: byJuror[2], jurado_3: byJuror[3], jurados_validos: a.jurados_validos,
      artist_final: a.artist_final, tie_break: a.tie_break, ranking_status: a.ranking_status,
      seleccionado: a.ranking_status === RANKING_STATUS.TOP10_SELECCIONADO ? 'SI' : 'NO',
      requiere_comite: a.ranking_status === RANKING_STATUS.TIE_REVIEW_REQUIRED ? 'SI' : '',
      dq: a.dq_pendiente ? DQ_STATUS.PENDIENTE : '', observacion: notes.join(' ')
    };
  });
  sel.excluidos.forEach(function (e) {
    datos.push({
      posicion: '', code: e.code, artistic_name: e.artistic_name || '', full_name: '', discipline: '',
      jurado_1: '', jurado_2: '', jurado_3: '', jurados_validos: e.jurados_validos || 0, artist_final: '', tie_break: '',
      ranking_status: RANKING_STATUS.SIN_RANKING, seleccionado: 'NO', requiere_comite: '',
      dq: e.motivo === 'DESCALIFICADO' ? DQ_STATUS.VALIDADA : '', observacion: e.motivo
    });
  });
  sel.deliberaciones_descartadas.forEach(function (d) {
    registrar('sistema', '', 'DELIBERACION_NO_APLICA', d.deliberation_id, 'corte ' + d.cut + ': ' + d.motivo);
  });
  agregarFilas(HOJA.RESULTADOS, datos);

  // Persist the per-project statuses (only rows that changed).
  var ranking = {};
  sel.ranking.forEach(function (a) { ranking[normalizarComparable(a.code)] = a.ranking_status; });
  var jurors = cfgNumero('jurados', 3);
  var closed = cfgBool('resultados_cerrados', false);
  var updates = [];
  filas.forEach(function (r) {
    var code = normalizarComparable(r.code);
    var evaluation = code ? evaluationStatusOf(cards[code] || [], { jurados: jurors, dq_status: normalizarComparable(r.dq_status),
                                                                     resultados_cerrados: closed }) : '';
    var rank = code ? (ranking[code] || RANKING_STATUS.SIN_RANKING) : '';
    if (normalizarComparable(r.evaluation_status) !== evaluation || normalizarComparable(r.ranking_status) !== rank) {
      updates.push({ fila: r._fila, cambios: { evaluation_status: evaluation, ranking_status: rank } });
    }
  });
  actualizarFilasEnLote(HOJA.REGISTRO, updates);
  return datos.length;
}

/** BOLSA: every eligible project in priority order, plus the open offer of each substitute. */
function reconstruirBolsa(filas) {
  limpiarDatos(HOJA.BOLSA);
  var offers = leerHoja(HOJA.OFERTAS);
  var pool = computePool(filas, poolOptions());
  var bySubmission = {};
  filas.forEach(function (r) { bySubmission[r.submission_id] = r; });
  var pending = {};
  offers.forEach(function (o) { if (normalizarComparable(o.estado) === OFFER_STATUS.PENDIENTE) pending[o.submission_id] = o; });
  var datos = pool.filas.slice().sort(function (a, b) {
    return (Number(a.priority_rank) || 99999) - (Number(b.priority_rank) || 99999);
  }).map(function (p) {
    var r = bySubmission[p.submission_id] || {};
    var o = pending[p.submission_id];
    return {
      priority_rank: p.priority_rank, pool_status: p.pool_status, code: r.code || '', submission_id: p.submission_id,
      artistic_name: r.artistic_name || '', participation_mode: r.participation_mode || 'SOLISTA',
      created_at: String(r.created_at || '').replace('T', ' ').slice(0, 19),
      eligibility_status: normalizeEligibility(r.eligibility_status),
      participation_status: participationStatus(r, !!o),
      oferta: o ? o.slot_code + ' (vence ' + humanDateTime(o.expires_at) + ')' : '',
      observacion: r.previous_code ? 'Tuvo el cupo ' + r.previous_code : ''
    };
  });
  agregarFilas(HOJA.BOLSA, datos);
  return datos.length;
}

/** SEGURO_MAYORCA: people of every project holding a slot, for the venue policy (private). */
function reconstruirSeguro(filas) {
  limpiarDatos(HOJA.SEGURO);
  if (typeof insuranceRows !== 'function') return 0;
  var datos = insuranceRows(filas, leerHoja(HOJA.INTEGRANTES));
  agregarFilas(HOJA.SEGURO, datos);
  return datos.length;
}

/** Every indicator the brief asks for, written as label/value rows. The dashboard is private. */
function reconstruirDashboard(filas) {
  var m = calcularMetricas(filas);
  var h = limpiarDatos(HOJA.DASHBOARD);
  if (h.getLastRow() > 0) h.getRange(1, 1, h.getMaxRows(), Math.max(3, h.getMaxColumns())).clearContent();

  var bloque = [
    ['INDICADOR', 'VALOR'],
    ['Inscripciones recibidas (filas)', m.inscritos],
    ['Por revisar (RECIBIDO) / en revisión', m.recibidos + ' / ' + m.revision],
    ['Aptos / no aptos / incompletos / duplicados', m.aptos + ' / ' + m.no_cumplen + ' / ' + m.incompletos + ' / ' + m.duplicados],
    ['Personas únicas (por documento)', m.unicos],
    ['Solistas / dúos / agrupaciones', m.solistas + ' / ' + m.duos + ' / ' + m.agrupaciones],
    ['', ''],
    ['Bolsa: principales con turno / suplentes / fuera de bolsa', m.bolsa.principales + ' / ' + m.bolsa.suplentes + ' / ' + m.bolsa.fuera],
    ['Retirados / reemplazos aceptados', m.bolsa.retirados + ' / ' + m.bolsa.reemplazos],
    ['Cupos: con titular / ofrecidos / liberados / vacantes / sin emitir',
      m.cupos.ASIGNADO + ' / ' + m.cupos.OFRECIDO + ' / ' + m.cupos.LIBERADO + ' / ' + m.cupos.VACANTE_SIN_REEMPLAZO + ' / ' + m.cupos.SIN_EMITIR],
    ['Confirmación final: sí / no / sin respuesta', m.confirmacion.si + ' / ' + m.confirmacion.no + ' / ' + m.confirmacion.sin_respuesta],
    ['Lista oficial', m.lista_oficial],
    ['', ''],
    ['Cambios solicitados / aprobados / rechazados / pendientes',
      m.cambios.solicitados + ' / ' + m.cambios.aprobados + ' / ' + m.cambios.rechazados + ' / ' + m.cambios.pendientes],
    ['Intérpretes autorizados / registrados / declarados (con código)',
      m.integrantes.autorizados + ' / ' + m.integrantes.registrados + ' / ' + m.integrantes.declarados],
    ['Proyectos con firmas completas', m.integrantes.grupos_completos + ' de ' + m.integrantes.grupos_con_codigo],
    ['Equipo de trabajo registrado (no ocupa cupo)', m.integrantes.equipo],
    ['Pistas pendientes / recibidas / validadas / con problema',
      (m.pistas['PISTA PENDIENTE'] || 0) + ' / ' + (m.pistas['PISTA RECIBIDA'] || 0) + ' / ' +
      (m.pistas['PISTA VALIDADA'] || 0) + ' / ' + (m.pistas['PISTA CON PROBLEMA'] || 0)],
    ['Correos enviados / en cola / con error', m.correos.ENVIADO + ' / ' + m.correos.PENDIENTE + ' / ' + (m.correos.FALLIDO + m.correos.ERROR)],
    ['', ''],
    ['Confirmados (con turno, sin llegar)', m.confirmados],
    ['Check-in / precola / en audición', m.check_ins + ' / ' + m.precola + ' / ' + m.en_audicion],
    ['Audiciones realizadas', m.realizadas],
    ['No show / contingencia / no audicionados', m.no_show + ' / ' + m.contingencia + ' / ' + m.no_audicionados],
    ['Avance de audiciones', m.avance_texto],
    ['Evaluaciones completas / parciales / sin calificar', m.evaluaciones.COMPLETA + m.evaluaciones.BLOQUEADA + ' / ' + m.evaluaciones.PARCIAL + ' / ' + m.evaluaciones.SIN_CALIFICAR],
    ['Descalificaciones pendientes / validadas', m.evaluaciones.DQ_PENDIENTE + ' / ' + m.evaluaciones.DESCALIFICADO],
    ['Promedio global (proyectos con 3 jurados)', m.promedio_global === null ? 'sin datos' : m.promedio_global],
    ['Empates que requieren acta', m.requiere_comite ? 'SI' : 'NO'],
    ['Resultados cerrados', m.resultados_cerrados ? 'SI' : 'NO'],
    ['Actualizado', ahoraISO()]
  ];
  h.getRange(1, 1, bloque.length, 2).setValues(bloque);

  var fila = bloque.length + 2;
  function seccion(titulo, tabla) {
    h.getRange(fila, 1).setValue(titulo);
    h.getRange(fila + 1, 1, tabla.length, tabla[0].length).setValues(tabla);
    fila += tabla.length + 2;
  }
  seccion('INDICADOR OPERATIVO (' + m.operativo.hora + ')', [
    ['Bloque actual', m.operativo.etiqueta], ['Esperados', m.operativo.esperados],
    ['Check-in', m.operativo.check_in], ['Realizadas', m.operativo.realizadas],
    ['No show', m.operativo.no_show], ['Contingencia', m.operativo.contingencia]
  ]);
  seccion('DISTRIBUCIÓN DE PUNTAJES (promedio por proyecto)', [['Rango', 'Proyectos']].concat(m.distribucion.map(function (d) { return [d.etiqueta, d.conteo]; })));
  var top = [['Posición', 'Proyecto', 'Puntaje final', 'Estado']].concat(m.top20.map(function (t) {
    return [t.posicion, (t.artistic_name || t.code) + ' (' + t.code + ')', scoreText(t.artist_final), t.ranking_status];
  }));
  if (top.length === 1) top.push(['', '(sin resultados aún)', '', '']);
  seccion('TOP ' + m.top_privado + ' PRIVADO (los primeros ' + m.top_n + ' son los seleccionados públicos)', top);
  seccion('AVANCE POR BLOQUE', [['Bloque', 'Realizadas', 'Asignados']].concat(m.por_bloque.map(function (b) {
    return ['Bloque ' + b.block_id + ' (' + b.ventana + ')', b.realizadas, b.asignados];
  })));

  h.getRange(1, 1, 1, 2).setFontWeight('bold');
  return bloque.length;
}

/**
 * The operational indicator: which block is running and how it is going.
 * `hora` (HH:MM) lets the rehearsal and the dashboard simulate a moment.
 */
function operationalIndicator(filas, hora) {
  var cfgAgenda = agendaConfigurada();
  var hhmm = hora || horaActual();
  var phase = currentBlock(horaAMinutos(hhmm), cfgAgenda);
  var out = { hora: hhmm, fase: phase.phase, bloque: phase.block_id, esperados: 0, check_in: 0,
              realizadas: 0, no_show: 0, contingencia: 0, etiqueta: '' };
  filas.forEach(function (r) {
    if (!normalizarTexto(r.code)) return;
    var e = normalizarEstado(r.attendance_status || ESTADO.CONFIRMADO);
    if (e === ESTADO.CONTINGENCIA) out.contingencia++;
    if (phase.block_id && Number(r.final_block || r.original_block) === phase.block_id) {
      out.esperados++;
      if ([ESTADO.CHECK_IN, ESTADO.PRECOLA, ESTADO.EN_AUDICION, ESTADO.REALIZADA].indexOf(e) !== -1) out.check_in++;
      if (e === ESTADO.REALIZADA) out.realizadas++;
      if (e === ESTADO.NO_SHOW) out.no_show++;
    }
  });
  var labels = { ANTES: 'Antes de iniciar', MARGEN: 'Margen operativo', CONTINGENCIA: 'Contingencia',
                 CERRADO: 'Audiciones cerradas', DESCONOCIDO: 'Hora desconocida' };
  out.etiqueta = phase.block_id
    ? blockLabel(phase.block_id, cfgAgenda) + ' (' + horarioDeBloque(phase.block_id, cfgAgenda).ventana + ')'
    : labels[phase.phase];
  return out;
}

/** All dashboard numbers in one place, reused by the web dashboard. */
function calcularMetricas(filas, hora) {
  filas = filas || leerHoja(HOJA.REGISTRO);
  var resumen = resumenElegibilidad(filas);
  var cupo = cfgNumero('cupo_total', 100);

  var conteo = { confirmados: 0, check_ins: 0, precola: 0, en_audicion: 0, realizadas: 0, no_show: 0,
                 contingencia: 0, no_audicionados: 0, incidentes: 0, reasignados: 0, horarios: 0 };
  var pistas = {}, videos = {};

  var cfgAgenda = agendaConfigurada();
  var porBloque = {};
  var lastBlock = marginAvailable(cfgAgenda) ? marginBlockId(cfgAgenda) : cfgAgenda.bloques;
  for (var b = 1; b <= lastBlock; b++) {
    porBloque[b] = { block_id: b, etiqueta: blockLabel(b, cfgAgenda), ventana: horarioDeBloque(b, cfgAgenda).ventana,
                     asignados: 0, realizadas: 0 };
  }

  var members = leerHoja(HOJA.INTEGRANTES);
  var integrantes = { declarados: 0, registrados: 0, autorizados: 0, grupos_con_codigo: 0, grupos_completos: 0 };

  filas.forEach(function (r) {
    if (normalizarTexto(r.video_url)) {
      var vs = r.video_check_status || VIDEO_STATUS.PENDIENTE;
      videos[vs] = (videos[vs] || 0) + 1;
    }
    if (!normalizarTexto(r.code)) return;
    var e = normalizarEstado(r.attendance_status || ESTADO.CONFIRMADO);
    if (e === ESTADO.CONFIRMADO) conteo.confirmados++;
    else if (e === ESTADO.CHECK_IN) conteo.check_ins++;
    else if (e === ESTADO.PRECOLA) conteo.precola++;
    else if (e === ESTADO.EN_AUDICION) conteo.en_audicion++;
    else if (e === ESTADO.REALIZADA) conteo.realizadas++;
    else if (e === ESTADO.NO_SHOW) conteo.no_show++;
    else if (e === ESTADO.CONTINGENCIA) conteo.contingencia++;
    else if (e === ESTADO.NO_AUDICIONADO) conteo.no_audicionados++;
    else if (e === ESTADO.INCIDENTE) conteo.incidentes++;
    if (normalizarTexto(r.final_time || r.original_time)) conteo.horarios++;
    if (normalizarComparable(r.change_status) === 'APROBADO') conteo.reasignados++;

    var ts = r.track_status || (esVerdadero(r.track_uses) ? TRACK_STATUS.PENDIENTE : TRACK_STATUS.NO_APLICA);
    pistas[ts] = (pistas[ts] || 0) + 1;

    var teamCode = teamCodeOf(r);
    if (teamCode) {
      var s = groupSummary(teamCode, members);
      var declared = Number(r.members_declared) || 1;
      integrantes.grupos_con_codigo++;
      integrantes.declarados += declared;
      integrantes.registrados += s.registered;
      integrantes.autorizados += s.authorized;
      if (declared && s.authorized >= declared) integrantes.grupos_completos++;
    }

    var bloque = Number(r.final_block || r.original_block || 0);
    if (porBloque[bloque]) {
      porBloque[bloque].asignados++;
      if (e === ESTADO.REALIZADA) porBloque[bloque].realizadas++;
    }
  });

  var cambios = leerHoja(HOJA.CAMBIOS);
  var cambiosResumen = { solicitados: cambios.length, pendientes: 0, aprobados: 0, rechazados: 0 };
  cambios.forEach(function (c) {
    var st = normalizarComparable(c.estado);
    if (st === 'PENDIENTE') cambiosResumen.pendientes++;
    else if (st === 'APROBADO') cambiosResumen.aprobados++;
    else if (st === 'RECHAZADO') cambiosResumen.rechazados++;
  });

  var resultados = leerHoja(HOJA.RESULTADOS).filter(function (r) { return r.artist_final !== '' && r.artist_final !== undefined; });
  var notas = resultados.map(function (r) { return Number(r.artist_final); }).filter(isFinite);
  var promedio = notas.length ? redondear(notas.reduce(function (s, v) { return s + v; }, 0) / notas.length, 2) : null;

  var ranking = resultados
    .filter(function (r) { return r.posicion !== '' && r.posicion !== undefined; })
    .map(function (r) { return { code: r.code, artistic_name: r.artistic_name, artist_final: Number(r.artist_final),
                                 posicion: Number(r.posicion), seleccionado: r.seleccionado,
                                 ranking_status: r.ranking_status }; })
    .sort(function (a, b) { return a.posicion - b.posicion; });

  var offers = leerHoja(HOJA.OFERTAS);
  var pool = computePool(filas, poolOptions());
  var slotCounts = { ASIGNADO: 0, OFRECIDO: 0, LIBERADO: 0, VACANTE_SIN_REEMPLAZO: 0, SIN_EMITIR: 0 };
  slotStatuses(filas, offers, poolOptions()).forEach(function (sl) { slotCounts[sl.status] = (slotCounts[sl.status] || 0) + 1; });
  var confirmation = { si: 0, no: 0, sin_respuesta: 0 };
  var evaluations = { SIN_CALIFICAR: 0, PARCIAL: 0, COMPLETA: 0, BLOQUEADA: 0, DQ_PENDIENTE: 0, DESCALIFICADO: 0 };
  filas.forEach(function (r) {
    if (normalizarTexto(r.code)) {
      var fc = normalizarComparable(r.final_confirmation);
      if (fc === 'SI') confirmation.si++; else confirmation.sin_respuesta++;
      var ev = normalizarComparable(r.evaluation_status);
      if (evaluations[ev] !== undefined && normalizarEstado(r.audition_status || r.attendance_status) === ESTADO.REALIZADA) evaluations[ev]++;
    } else if (normalizarComparable(r.final_confirmation) === 'NO') confirmation.no++;
  });
  var mailCounts = { ENVIADO: 0, PENDIENTE: 0, ERROR: 0, FALLIDO: 0, OMITIDO: 0, ENVIANDO: 0 };
  leerHoja(HOJA.EMAIL_LOG).forEach(function (e) { var st = normalizarComparable(e.status); mailCounts[st] = (mailCounts[st] || 0) + 1; });
  var crewCount = members.filter(function (mm) { return normalizePersonRole(mm.person_role) === PERSON_ROLE.EQUIPO_TRABAJO; }).length;

  var objetivo = resumen.con_codigo || cupo;

  return {
    inscritos: resumen.total, validos: resumen.validos, unicos: resumen.unicos, duplicados: resumen.duplicado,
    aptos: resumen.apto, incompletos: resumen.incompleto, no_cumplen: resumen.no_cumple, recibidos: resumen.recibido,
    revision: resumen.revision, con_codigo: resumen.con_codigo, horarios: conteo.horarios,
    bolsa: { principales: pool.principales, suplentes: pool.suplentes, fuera: pool.fuera,
             retirados: filas.filter(isWithdrawn).length,
             reemplazos: filas.filter(function (r) { return /^reemplazo:/.test(String(r.issued_by || '')); }).length },
    cupos: slotCounts, confirmacion: confirmation, evaluaciones: evaluations, correos: mailCounts,
    lista_oficial: cfgBool('lista_oficial_bloqueada', false) ? 'CONSOLIDADA (' + cfg('lista_oficial_version', '') + ')' : 'ABIERTA',
    resultados_cerrados: cfgBool('resultados_cerrados', false),
    top20: ranking.filter(function (r) { return r.posicion <= cfgNumero('top_privado', 20); }),
    top_privado: cfgNumero('top_privado', 20),
    solistas: resumen.solistas, duos: resumen.duos, agrupaciones: resumen.agrupaciones,
    cupos_libres: Math.max(0, cupo - resumen.con_codigo),
    confirmados: conteo.confirmados, check_ins: conteo.check_ins, precola: conteo.precola,
    en_audicion: conteo.en_audicion, realizadas: conteo.realizadas, no_show: conteo.no_show,
    contingencia: conteo.contingencia, no_audicionados: conteo.no_audicionados,
    reasignados: conteo.reasignados, cambios_pendientes: cambiosResumen.pendientes, cambios: cambiosResumen,
    integrantes: Object.assign(integrantes, { equipo: crewCount }), pistas: pistas, videos: videos,
    avance: objetivo ? redondear((conteo.realizadas / objetivo) * 100, 1) : 0,
    avance_texto: conteo.realizadas + ' de ' + objetivo + ' (' +
                  (objetivo ? redondear((conteo.realizadas / objetivo) * 100, 1) : 0) + '%)',
    promedio_global: promedio,
    distribucion: distribucionPuntajes(ranking),
    top: ranking.filter(function (r) { return normalizarComparable(r.seleccionado) === 'SI'; }),
    top_n: cfgNumero('top_seleccionados', 10),
    por_bloque: Object.keys(porBloque).map(function (k) { return porBloque[k]; }),
    operativo: operationalIndicator(filas, hora),
    requiere_comite: leerHoja(HOJA.RESULTADOS).some(function (r) { return normalizarComparable(r.requiere_comite) === 'SI'; }),
    entorno: entorno()
  };
}

function accionDashboard(datos) {
  return { metricas: calcularMetricas(null, datos && horaAMinutos(datos.hora) !== null ? datos.hora : null) };
}

function accionResultados(datos, sesion) {
  refrescarVistas();
  var filas = leerHoja(HOJA.RESULTADOS);
  var ranked = filas.filter(function (r) { return r.posicion !== '' && r.posicion !== undefined; });
  var dq = accionListarDescalificaciones();
  return {
    top_publico: cfgNumero('top_seleccionados', 10),
    top_privado: cfgNumero('top_privado', 20),
    top: ranked.filter(function (r) { return normalizarComparable(r.ranking_status) === RANKING_STATUS.TOP10_SELECCIONADO; }),
    top20: ranked.filter(function (r) { return Number(r.posicion) <= cfgNumero('top_privado', 20); }),
    ranking: ranked,
    excluidos: filas.filter(function (r) { return r.observacion && !r.posicion; }),
    requiere_comite: filas.some(function (r) { return normalizarComparable(r.requiere_comite) === 'SI'; }),
    empatados: filas.filter(function (r) { return normalizarComparable(r.requiere_comite) === 'SI'; })
      .map(function (r) { return { code: r.code, artistic_name: r.artistic_name, artist_final: r.artist_final,
                                   tie_break: r.tie_break, posicion: r.posicion }; }),
    cortes: tiedCuts(),
    deliberaciones: currentDeliberations(),
    metodos_desempate: TIE_METHODS,
    descalificaciones: dq.reportes,
    resultados_cerrados: cfgBool('resultados_cerrados', false),
    rubrica_version: activeRubric().version
  };
}

/** The cuts (10 / 20) that currently hold an unresolved tie, with the tied codes of each. */
function tiedCuts() {
  var sel = computeResults(leerHoja(HOJA.REGISTRO));
  return sel.cortes.map(function (c) {
    return { cut: c.cut, empatados: c.empatados.map(function (a) {
      return { code: a.code, artistic_name: a.artistic_name, artist_final: a.artist_final, tie_break: a.tie_break };
    }) };
  });
}

// ========================================================================
// 31_export.gs
// ========================================================================

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

// ========================================================================
// 32_comunicacion.gs
// ========================================================================

/**
 * EL BUNKER - E-mail (queue, templates, log) and WhatsApp message texts.
 *
 * Every e-mail goes through ONE queue, the _EMAIL_LOG sheet:
 *   enqueueEmail()  - adds a row, idempotent by key (a retried action never mails twice)
 *   processEmailQueue() - sends pending rows within the daily Gmail quota, retries errors
 * Every message is sent as HTML + plain text, states the status and the next step, and
 * carries the visible "revisa Spam y Promociones" notice.
 *
 * WhatsApp is never automated: the panel produces the exact text plus a click-to-chat link
 * and a person presses send from the official number. WhatsApp is a channel, never a database.
 */

var EMAIL_TEMPLATE_VERSION = 'T3-2026-09-29';

var EMAIL_STATUS = {
  PENDIENTE: 'PENDIENTE', ENVIANDO: 'ENVIANDO', ENVIADO: 'ENVIADO', ERROR: 'ERROR', FALLIDO: 'FALLIDO', OMITIDO: 'OMITIDO'
};
var EMAIL_MAX_RETRIES = 3;
var EMAIL_QUOTA_RESERVE = 3;

/** Lower number = sent first when the daily quota is short. */
var EMAIL_PRIORITY = {
  RECEPCION: 1, OFERTA_SUPLENTE: 1, ASIGNACION: 2, CAMBIO_APROBADO: 2, CAMBIO_RECHAZADO: 2, CAMBIO_SOLICITADO: 3,
  RETIRO_CONFIRMADO: 3, CONFIRMACION_FINAL: 3, APTITUD: 4, SIN_CUPO: 5, FIRMAS_PENDIENTES: 6, PISTA_PENDIENTE: 6,
  RECORDATORIO_24H: 4, RECORDATORIO_DIA: 3, RESULTADO_FINAL: 5, CONTINGENCIA: 2, GRUPO_WHATSAPP: 7
};

function commsContext() {
  var fecha = cfgFecha('evento_fecha', '2026-10-23');
  return {
    evento: cfg('evento_nombre', 'EL BÚNKER by Arte es la Solución'),
    fecha_texto: humanDate(fecha),
    hora_texto: humanTime(cfgHora('evento_hora_inicio', '15:00')) + ' a ' + humanTime(cfgHora('evento_hora_fin', '21:00')),
    sede: cfg('evento_sede', ''),
    municipio_sede: cfg('evento_municipio_sede', 'Sabaneta, Antioquia'),
    punto: cfg('evento_direccion', ''),
    duracion: cfgNumero('duracion_audicion_min', 3),
    tolerancia: cfgNumero('tolerancia_min', 5),
    antelacion: cfgNumero('antelacion_llegada_min', 15),
    contingencia: humanTime(cfgHora('contingencia_inicio', '20:30')) + ' a ' + humanTime(cfgHora('cierre_audiciones', '21:00')),
    cierre: humanTime(cfgHora('cierre_audiciones', '21:00')),
    cupo: cfgNumero('cupo_total', 100),
    top: cfgNumero('top_seleccionados', 10),
    numero: phoneText(cfg('whatsapp_oficial', '')),
    nombre_contacto: cfg('whatsapp_oficial_nombre', 'EL BÚNKER — Arte es la Solución'),
    correo_datos: cfg('data_protection_email', ''),
    sitio: cfg('sitio_url', ''),
    horas_suplente: cfgNumero('suplente_horas_respuesta', 24),
    reemplazos_desde: deadlineText(cfg('reemplazos_desde', '')),
    confirmacion_desde: deadlineText(cfg('confirmacion_final_desde', '')),
    confirmacion_hasta: deadlineText(cfg('confirmacion_final_hasta', ''))
  };
}

function lugarTexto(c) {
  var p = normalizarTexto(c.punto);
  var place = [normalizarTexto(c.sede), normalizarTexto(c.municipio_sede)].filter(Boolean).join(', ');
  return place + (p && p.indexOf('PENDIENTE') !== 0 ? ' (' + p + ')' : '');
}

/** The WhatsApp group invite, or '' while the organization has not created it. */
function groupInviteLink() {
  var link = normalizarTexto(cfg('whatsapp_grupo_enlace', ''));
  return /^https:\/\//i.test(link) ? link : '';
}

/** The line every message repeats: WhatsApp broadcast lists only reach people who saved the number. */
function saveNumberLine(c) {
  return c.numero
    ? 'Guarda el número ' + c.numero + ' en tus contactos como "' + c.nombre_contacto +
      '": desde ahí te escribiremos novedades de la convocatoria.'
    : '';
}

var SPAM_NOTICE = 'Revisa también las carpetas Spam y Promociones y marca nuestros correos como "No es spam" para no perderte los siguientes.';

/**
 * Templates. `cuerpo` is plain text; the HTML version is built from it (same words, so the two
 * versions can never disagree). {{placeholders}} come from the REGISTRO row or from extras.
 * `audiencia` is used by the manual bulk sending in the panel; automatic events enqueue directly.
 */
function plantillas() {
  var c = commsContext();
  var firma = '\n\n— Equipo ' + c.evento;
  var lugar = lugarTexto(c);
  var evento = 'EVENTO: ' + c.fecha_texto + ', ' + c.hora_texto + ' · ' + lugar;

  return {
    RECEPCION: {
      id: 'RECEPCION', nombre: 'Recepción de inscripción (automático)',
      audiencia: function (r) { return !!normalizarTexto(r.submission_id); },
      asunto: c.evento + ' — recibimos tu inscripción ({{submission_id}})',
      cuerpo:
        'Hola {{full_name}},\n\n' +
        'ESTADO: RECIBIDA. Tu comprobante es {{submission_id}}.\n\n' +
        'Recibir tu inscripción NO significa que ya seas apto: la organización revisa datos, requisitos y muestra artística. ' +
        'Te escribiremos con el resultado de esa revisión.\n\n' +
        'SIGUIENTE PASO: espera el correo con tu resultado (apto o no apto). Los ' + c.cupo + ' turnos se asignan en orden de ' +
        'inscripción entre quienes resulten aptos; si pasas de ' + c.cupo + ', quedas en la bolsa de suplentes.\n' +
        '{{bloque_equipo}}\n' + evento + '\n\n' +
        'Consulta tu inscripción cuando quieras: {{url_mi_inscripcion}}\n' +
        saveNumberLine(c) + '\n\n' +
        'Inscribirte no garantiza selección, contratación ni presentación.\n' +
        'Dudas sobre tus datos personales: ' + c.correo_datos + '.' + firma
    },

    APTITUD: {
      id: 'APTITUD', nombre: 'Resultado de la revisión de aptitud (automático)',
      audiencia: function (r) {
        var e = normalizeEligibility(r.eligibility_status);
        return e === 'APTO' || e === 'NO_APTO' || e === 'DUPLICADO' || e === 'INCOMPLETO';
      },
      asunto: c.evento + ' — resultado de tu inscripción: {{estado_aptitud}}',
      cuerpo:
        'Hola {{full_name}},\n\n' +
        'ESTADO: {{estado_aptitud}} (comprobante {{submission_id}}).\n\n' +
        '{{detalle_aptitud}}\n\n' +
        'SIGUIENTE PASO: {{siguiente_aptitud}}\n\n' +
        evento + '\n\n' +
        'Tu inscripción: {{url_mi_inscripcion}}' + firma
    },

    ASIGNACION: {
      id: 'ASIGNACION', nombre: 'Código y horario (automático al asignar)',
      audiencia: function (r) { return !!normalizarTexto(r.code); },
      asunto: c.evento + ' — tu código {{code}} y tu horario',
      cuerpo:
        'Hola {{full_name}},\n\n' +
        'ESTADO: TIENES TURNO. Estás dentro de los ' + c.cupo + ' turnos de audición.\n\n' +
        'CÓDIGO: {{code}}\n' +
        'FECHA: ' + c.fecha_texto + '\n' +
        'LLEGADA (check-in): {{hora_llegada_texto}}\n' +
        'AUDICIÓN: {{hora_audicion_texto}} ({{bloque_texto}})\n' +
        'LUGAR: ' + lugar + '\n\n' +
        'SIGUIENTE PASO:\n' +
        '- Llega a la hora de llegada, no a la de audición, con tu documento de identidad original.\n' +
        '- Tu audición dura máximo ' + c.duracion + ' minutos. Tolerancia de ' + c.tolerancia + ' minutos; después pasas a ' +
        'contingencia (' + c.contingencia + '), solo si queda tiempo.\n' +
        '{{bloque_pista}}{{bloque_equipo}}' +
        '- El ' + c.confirmacion_desde + ' confirma tu asistencia en "Mi inscripción": {{url_mi_inscripcion}}\n\n' +
        'Si tienes un impedimento real con tu horario, tienes UNA solicitud de cambio: {{url_cambio}} ' +
        '(tu horario no cambia hasta que producción la apruebe). Si no podrás asistir, desde el ' + c.reemplazos_desde +
        ' puedes liberar tu cupo en "Mi inscripción" para que lo reciba un suplente.\n\n' +
        saveNumberLine(c) + firma
    },

    SIN_CUPO: {
      id: 'SIN_CUPO', nombre: 'Apto sin turno: suplente o fuera de bolsa (automático al asignar)',
      audiencia: function (r) {
        var p = normalizarComparable(r.pool_status);
        return !normalizarTexto(r.code) && (p === 'SUPLENTE' || p === 'FUERA_DE_BOLSA');
      },
      asunto: c.evento + ' — tu inscripción es apta: {{estado_bolsa}}',
      cuerpo:
        'Hola {{full_name}},\n\n' +
        'ESTADO: APTO · {{estado_bolsa}}.\n\n' +
        '{{detalle_bolsa}}\n\n' +
        'SIGUIENTE PASO: {{siguiente_bolsa}}\n\n' +
        evento + '\n\n' +
        'Tu inscripción: {{url_mi_inscripcion}}' + firma
    },

    OFERTA_SUPLENTE: {
      id: 'OFERTA_SUPLENTE', nombre: 'Oferta de cupo a un suplente (automático)',
      audiencia: function () { return false; },
      asunto: c.evento + ' — se liberó un cupo para ti ({{slot_code}}): responde antes de {{vence_texto}}',
      cuerpo:
        'Hola {{full_name}},\n\n' +
        'ESTADO: SUPLENTE CON CUPO OFRECIDO. Se liberó el turno {{slot_code}} y eres la siguiente persona de la bolsa de suplentes.\n\n' +
        'TURNO OFRECIDO: {{slot_code}} · llegada {{slot_arrival}} · audición {{slot_time}}\n' +
        'FECHA Y LUGAR: ' + c.fecha_texto + ' · ' + lugar + '\n\n' +
        'SIGUIENTE PASO: entra a "Mi inscripción" y elige ACEPTAR o NO PUEDO antes de {{vence_texto}}: {{url_mi_inscripcion}}\n' +
        'Si no respondes a tiempo, el cupo pasa a la siguiente persona.' + firma
    },

    RETIRO_CONFIRMADO: {
      id: 'RETIRO_CONFIRMADO', nombre: 'Retiro confirmado (automático)',
      audiencia: function () { return false; },
      asunto: c.evento + ' — registramos que liberaste el cupo {{slot_code}}',
      cuerpo:
        'Hola {{full_name}},\n\n' +
        'ESTADO: RETIRADO. Liberaste el cupo {{slot_code}}; lo recibirá la siguiente persona de la bolsa de suplentes.\n\n' +
        'SIGUIENTE PASO: ninguno. Gracias por avisar a tiempo. Si fue un error, escríbenos por WhatsApp' +
        (c.numero ? ' al ' + c.numero : '') + '.' + firma
    },

    CAMBIO_SOLICITADO: {
      id: 'CAMBIO_SOLICITADO', nombre: 'Solicitud de cambio recibida (automático)',
      audiencia: function (r) { return normalizarComparable(r.change_status) === 'PENDIENTE'; },
      asunto: c.evento + ' — recibimos tu solicitud de cambio de horario ({{code}})',
      cuerpo:
        'Hola {{full_name}},\n\n' +
        'ESTADO: CAMBIO SOLICITADO (pendiente de revisión).\n\n' +
        'Tu horario NO cambia hasta que producción apruebe la solicitud. Mientras tanto sigue vigente:\n' +
        'CÓDIGO: {{code}} · LLEGADA: {{hora_llegada_texto}} · AUDICIÓN: {{hora_audicion_texto}}\n\n' +
        'SIGUIENTE PASO: espera nuestra respuesta (APROBADO o NO APROBADO) por correo o WhatsApp.' + firma
    },

    CAMBIO_APROBADO: {
      id: 'CAMBIO_APROBADO', nombre: 'Cambio aprobado (automático)',
      audiencia: function (r) { return normalizarComparable(r.change_status) === 'APROBADO'; },
      asunto: c.evento + ' — cambio APROBADO, tu nuevo horario',
      cuerpo:
        'Hola {{full_name}},\n\n' +
        'ESTADO: CAMBIO APROBADO.\n\n' +
        'CÓDIGO: {{code}} (no cambia)\n' +
        'NUEVA LLEGADA: {{hora_llegada_texto}}\n' +
        'NUEVA AUDICIÓN: {{hora_audicion_texto}} ({{bloque_texto}})\n' +
        'FECHA Y LUGAR: ' + c.fecha_texto + ' · ' + lugar + '\n\n' +
        'SIGUIENTE PASO: preséntate a tu nueva hora de llegada con tu documento original. Este es tu horario definitivo.' + firma
    },

    CAMBIO_RECHAZADO: {
      id: 'CAMBIO_RECHAZADO', nombre: 'Cambio no aprobado (automático)',
      audiencia: function (r) { return normalizarComparable(r.change_status) === 'RECHAZADO'; },
      asunto: c.evento + ' — tu solicitud de cambio no fue aprobada',
      cuerpo:
        'Hola {{full_name}},\n\n' +
        'ESTADO: CAMBIO NO APROBADO, por disponibilidad de la agenda.\n\n' +
        'Tu horario sigue siendo:\n' +
        'CÓDIGO: {{code}} · LLEGADA: {{hora_llegada_texto}} · AUDICIÓN: {{hora_audicion_texto}}\n' +
        'FECHA Y LUGAR: ' + c.fecha_texto + ' · ' + lugar + '\n\n' +
        'SIGUIENTE PASO: si no podrás asistir, libera tu cupo en "Mi inscripción" ({{url_mi_inscripcion}}) desde el ' +
        c.reemplazos_desde + ' para que lo reciba un suplente.' + firma
    },

    CONFIRMACION_FINAL: {
      id: 'CONFIRMACION_FINAL', nombre: 'Confirmación final de asistencia (22-oct)',
      audiencia: function (r) { return !!normalizarTexto(r.code) && !normalizarTexto(r.final_confirmation); },
      asunto: c.evento + ' — confirma tu asistencia ({{code}})',
      cuerpo:
        'Hola {{full_name}},\n\n' +
        'ESTADO: TIENES TURNO, falta tu confirmación final.\n\n' +
        'CÓDIGO: {{code}} · LLEGADA: {{hora_llegada_texto}} · AUDICIÓN: {{hora_audicion_texto}}\n' +
        'FECHA Y LUGAR: ' + c.fecha_texto + ' · ' + lugar + '\n\n' +
        'SIGUIENTE PASO: entra a "Mi inscripción" y marca SÍ CONFIRMO o NO PODRÉ ASISTIR antes de ' + c.confirmacion_hasta +
        ': {{url_mi_inscripcion}}\nConfirmar no cambia tu horario.' + firma
    },

    RECORDATORIO_24H: {
      id: 'RECORDATORIO_24H', nombre: 'Recordatorio 24 h antes',
      audiencia: function (r) { return !!normalizarTexto(r.code); },
      asunto: c.evento + ' — mañana es tu audición ({{code}})',
      cuerpo:
        'Hola {{full_name}},\n\n' +
        'ESTADO: TIENES TURNO. Mañana, ' + c.fecha_texto + ', es tu audición.\n\n' +
        'CÓDIGO: {{code}}\nLLEGADA: {{hora_llegada_texto}} · AUDICIÓN: {{hora_audicion_texto}}\nLUGAR: ' + lugar + '\n\n' +
        'SIGUIENTE PASO: lleva tu documento original y prepara máximo ' + c.duracion + ' minutos.\n' +
        '{{bloque_pista}}Tolerancia de ' + c.tolerancia + ' minutos.' + firma
    },

    RECORDATORIO_DIA: {
      id: 'RECORDATORIO_DIA', nombre: 'Recordatorio del día',
      audiencia: function (r) { return !!normalizarTexto(r.code); },
      asunto: c.evento + ' — hoy es tu audición ({{code}})',
      cuerpo:
        '{{full_name}}, hoy es tu audición.\n\n' +
        'ESTADO: TIENES TURNO. CÓDIGO {{code}} · LLEGADA {{hora_llegada_texto}} · AUDICIÓN {{hora_audicion_texto}}\n' +
        'LUGAR: ' + lugar + '\n\n' +
        'SIGUIENTE PASO: llega a tu hora de llegada con tu documento original. Tolerancia de ' + c.tolerancia + ' minutos.' + firma
    },

    CONTINGENCIA: {
      id: 'CONTINGENCIA', nombre: 'Contingencia / no show',
      audiencia: function (r) {
        var e = normalizarEstado(r.attendance_status);
        return e === 'CONTINGENCIA' || e === 'NO SHOW';
      },
      asunto: c.evento + ' — tu turno pasó a contingencia',
      cuerpo:
        'Hola {{full_name}},\n\n' +
        'ESTADO: CONTINGENCIA. Tu turno ({{code}}, {{hora_audicion_texto}}) pasó a contingencia.\n\n' +
        'La contingencia funciona de ' + c.contingencia + ' y solo alcanza para quienes quepan en el tiempo disponible.\n\n' +
        'SIGUIENTE PASO: acércate al punto de check-in y espera el llamado. A las ' + c.cierre +
        ' se cierran definitivamente las audiciones.' + firma
    },

    FIRMAS_PENDIENTES: {
      id: 'FIRMAS_PENDIENTES', nombre: 'Faltan firmas del equipo',
      audiencia: function (r, extra) {
        return !!normalizarTexto(r.code) && extra.integrantes_declarados > 0 && extra.integrantes_autorizados < extra.integrantes_declarados;
      },
      asunto: c.evento + ' — faltan firmas de tu proyecto ({{code}})',
      cuerpo:
        'Hola {{full_name}},\n\n' +
        'ESTADO: FIRMAS INCOMPLETAS. En {{artistic_name}} ({{code}}) van {{integrantes_autorizados}} de {{integrantes_declarados}} ' +
        'intérpretes con su autorización individual.\n\n' +
        'SIGUIENTE PASO: cada persona firma por sí misma en este enlace (tú no puedes firmar por otra persona). ' +
        'Si viene equipo de trabajo (manager, técnico, fotógrafo...), también se registra ahí para la póliza del lugar:\n' +
        '{{members_link}}\n\n' +
        'Quien no firme en línea deberá firmar la constancia física el día del evento.\n' + evento + firma
    },

    PISTA_PENDIENTE: {
      id: 'PISTA_PENDIENTE', nombre: 'Pista pendiente',
      audiencia: function (r) {
        return !!normalizarTexto(r.code) && esVerdadero(r.track_uses) &&
               normalizarComparable(r.track_status) === normalizarComparable(TRACK_STATUS.PENDIENTE);
      },
      asunto: c.evento + ' — envíanos tu pista ({{code}})',
      cuerpo:
        'Hola {{full_name}},\n\n' +
        'ESTADO: PISTA PENDIENTE. Aún no hemos recibido la pista de {{code}}.\n\n' +
        'SIGUIENTE PASO: envía el archivo indicando tu código {{code}}:\n' +
        '- Por la web (recomendado): {{url_mi_inscripcion}}\n' +
        (c.numero ? '- O por WhatsApp al ' + c.numero + ', escribiendo tu código {{code}} en el mensaje.\n' : '') +
        '\nEl día del evento lleva también una copia en USB.\n' + evento + firma
    },

    RESULTADO_FINAL: {
      id: 'RESULTADO_FINAL', nombre: 'Resultado final (tras cerrar resultados)',
      disponible: function () { return cfgBool('resultados_cerrados', false); },
      audiencia: function (r) { return normalizarComparable(r.participation_status) === 'AUDICIONADO' ||
                                       normalizarEstado(r.attendance_status) === 'REALIZADA'; },
      asunto: c.evento + ' — resultado de tu audición ({{code}})',
      cuerpo:
        'Hola {{full_name}},\n\n' +
        'ESTADO: {{estado_resultado}}.\n\n' +
        '{{detalle_resultado}}\n\n' +
        'SIGUIENTE PASO: {{siguiente_resultado}}\n\n' +
        'Gracias por subir al escenario de ' + c.evento + '.' + firma
    },

    GRUPO_WHATSAPP: {
      id: 'GRUPO_WHATSAPP', nombre: 'Invitación al grupo de WhatsApp',
      disponible: function () { return !!groupInviteLink(); },
      audiencia: function (r) {
        return esVerdadero(r.consent_whatsapp) &&
               (normalizeEligibility(r.eligibility_status) === 'APTO' || !!normalizarTexto(r.code));
      },
      asunto: c.evento + ' — grupo de WhatsApp de la convocatoria',
      cuerpo:
        'Hola {{full_name}},\n\n' +
        'ESTADO: APTO. Por aquí compartiremos las indicaciones operativas finales:\n' +
        '{{enlace_grupo_whatsapp}}\n\n' +
        'SIGUIENTE PASO: únete al grupo. El sistema sigue siendo la fuente oficial de tu estado: consúltalo en {{url_mi_inscripcion}}\n' +
        saveNumberLine(c) + firma
    }
  };
}

/** Templates that can be used right now: one that needs missing data is not offered at all. */
function plantillasDisponibles() {
  var all = plantillas();
  return Object.keys(all).filter(function (k) {
    return (!all[k].disponible || all[k].disponible()) && all[k].audiencia.length > 0;
  }).map(function (k) { return { id: k, nombre: all[k].nombre }; });
}

/**
 * Fills {{placeholders}} from a participant row plus explicit extras.
 * A placeholder whose value is missing from the row stays visible on purpose,
 * so a half-filled message is never sent unnoticed; extras may legitimately be empty.
 */
function renderizarPlantilla(plantilla, registro, extras) {
  extras = extras || {};
  function sustituir(texto) {
    return String(texto).replace(/\{\{(\w+)\}\}/g, function (_, clave) {
      if (extras.hasOwnProperty(clave)) return String(extras[clave] === null || extras[clave] === undefined ? '' : extras[clave]);
      var v = registro[clave];
      return (v === undefined || v === null || v === '') ? '{{' + clave + '}}' : String(v);
    });
  }
  return { asunto: sustituir(plantilla.asunto), cuerpo: sustituir(plantilla.cuerpo).replace(/\n{3,}/g, '\n\n') };
}

/** Plain text with the spam notice first, then the message. */
function emailPlainText(body) {
  return SPAM_NOTICE + '\n\n' + body;
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** HTML version of the same words: paragraphs, bullet lists, absolute links, spam notice box. */
function emailHtml(subject, body) {
  var linkify = function (text) {
    return escapeHtml(text).replace(/https:\/\/[^\s<]+/g, function (u) {
      var clean = u.replace(/[.,;)]+$/, '');
      return '<a href="' + clean + '" style="color:#B5121B">' + clean + '</a>' + u.slice(clean.length);
    });
  };
  var html = String(body).split(/\n{2,}/).map(function (block) {
    var lines = block.split('\n');
    if (lines.every(function (l) { return /^- /.test(l); })) {
      return '<ul style="padding-left:18px;margin:0 0 14px">' +
        lines.map(function (l) { return '<li style="margin:0 0 6px">' + linkify(l.slice(2)) + '</li>'; }).join('') + '</ul>';
    }
    return '<p style="margin:0 0 14px">' + lines.map(linkify).join('<br>') + '</p>';
  }).join('');
  return '<!doctype html><html><body style="margin:0;background:#F4F4F2">' +
    '<div style="max-width:600px;margin:0 auto;background:#FFFFFF;font-family:Arial,Helvetica,sans-serif;color:#1D1D1B;font-size:15px;line-height:1.5">' +
    '<div style="background:#1D1D1B;color:#FFFFFF;padding:16px 20px;font-weight:bold;letter-spacing:1px">EL BÚNKER · Arte es la Solución</div>' +
    '<div style="margin:16px 20px 0;padding:10px 12px;background:#FFF2CC;border-left:4px solid #E0A800;font-size:13px">' +
    escapeHtml(SPAM_NOTICE) + '</div>' +
    '<div style="padding:16px 20px 8px">' + html + '</div>' +
    '<div style="padding:12px 20px 18px;color:#6B6B6B;font-size:12px">' + escapeHtml(subject) + '</div>' +
    '</div></body></html>';
}

/**
 * Links a production e-mail must never carry (test/staging hosts, old repositories, dev URLs).
 * Returns the offending fragment, or ''.
 */
function forbiddenLink(text) {
  var m = String(text).match(/localhost|127\.0\.0\.1|\/dev\b|staging|juanma1725|github\.io\/el-bunker|\{\{\w+\}\}/i);
  return m ? m[0] : '';
}

/** The team code of a project: its members/crew/signatures live under it (groups: GRP-xxx, soloists: EQ-xxx). */
function teamCodeOf(r) {
  return normalizarTexto(r.team_code) || normalizarTexto(r.group_code);
}

/** Per-row values the templates need that are not columns of REGISTRO. */
function messageExtras(r, base, members) {
  var team = teamCodeOf(r);
  var summary = team ? groupSummary(team, members) : { authorized: 0, registered: 0 };
  var declared = Number(r.members_declared) || (team ? 1 : 0);
  var link = team ? membersLink(team) : '';
  var e = normalizeEligibility(r.eligibility_status);
  var c = commsContext();
  var aptitude = {
    APTO: ['APTO', 'Tu inscripción cumple los requisitos de la convocatoria.',
           'Los ' + c.cupo + ' turnos se asignan en orden de inscripción entre quienes son aptos. Te enviaremos tu código y horario, ' +
           'o te avisaremos si quedas en la bolsa de suplentes.'],
    NO_APTO: ['NO APTO', 'Tu inscripción no cumple los requisitos de la convocatoria' +
              (r.validation_notes && /EDAD/.test(r.validation_notes) ? ' (edad el día del evento)' : '') +
              (r.validation_notes && /RESIDENCIA/.test(r.validation_notes) ? ' (residencia)' : '') + '.',
              'Ninguno. Si crees que hay un error en tus datos, escríbenos' + (c.numero ? ' por WhatsApp al ' + c.numero : '') + '.'],
    DUPLICADO: ['DUPLICADA', 'Ya teníamos una inscripción con tu documento; conservamos la primera.',
                'Ninguno: no necesitas volver a inscribirte. Consulta la primera inscripción en "Mi inscripción".'],
    INCOMPLETO: ['INCOMPLETA', 'A tu inscripción le faltan datos obligatorios.',
                 'Envía el formulario de nuevo con todos los datos: la nueva inscripción no se marca como duplicada por esta.']
  }[e] || ['EN REVISIÓN', 'Tu inscripción sigue en revisión.', 'Espera nuestro correo.'];
  var pool = normalizarComparable(r.pool_status);
  var poolText = pool === 'FUERA_DE_BOLSA'
    ? ['FUERA DE LA BOLSA', 'Los ' + c.cupo + ' turnos y la bolsa de suplentes ya están completos, en orden de inscripción. ' +
       'Tu inscripción queda registrada como apta.', 'Ninguno por ahora. Si la bolsa se mueve, te escribiremos.']
    : ['SUPLENTE', 'Los ' + c.cupo + ' turnos ya se asignaron en orden de inscripción y quedaste en la bolsa de suplentes. ' +
       'Ser suplente NO es ser finalista ni seleccionado: significa que puedes recibir un turno si alguien libera el suyo.',
       'Si se libera un cupo para ti te escribiremos y tendrás ' + c.horas_suplente + ' horas para aceptarlo en "Mi inscripción".'];
  var ranking = normalizarComparable(r.ranking_status);
  var selected = ranking === 'TOP10_SELECCIONADO';
  var groupLink = groupInviteLink();
  return {
    url_cambio: base + '?p=cambio-horario&code=' + encodeURIComponent(r.code || ''),
    url_mi_inscripcion: base + '?p=mi-inscripcion',
    members_link: link,
    hora_llegada_texto: r.arrival_time ? humanTime(r.arrival_time) : '',
    hora_audicion_texto: (r.final_time || r.original_time) ? humanTime(r.final_time || r.original_time) : '',
    bloque_texto: blockLabel(r.final_block || r.original_block, agendaConfigurada()).toLowerCase(),
    integrantes_autorizados: summary.authorized,
    integrantes_declarados: declared,
    enlace_grupo_whatsapp: groupLink,
    estado_aptitud: aptitude[0], detalle_aptitud: aptitude[1], siguiente_aptitud: aptitude[2],
    estado_bolsa: poolText[0], detalle_bolsa: poolText[1], siguiente_bolsa: poolText[2],
    estado_resultado: selected ? 'SELECCIONADO' : 'NO SELECCIONADO',
    detalle_resultado: selected
      ? '¡Felicitaciones! Tu proyecto está entre los ' + c.top + ' seleccionados de la convocatoria.'
      : 'Tu proyecto no quedó entre los ' + c.top + ' seleccionados. El jurado calificó cada audición con la rúbrica oficial.',
    siguiente_resultado: selected
      ? 'La organización te contactará con los siguientes pasos. Mantén tu teléfono disponible.'
      : 'Ninguno. Sigue atento a nuestras redes para las próximas convocatorias.',
    bloque_equipo: link
      ? '\nEQUIPO Y FIRMAS: cada intérprete' + (isGroupMode(r.participation_mode) ? '' : ' y cada persona de tu equipo de trabajo') +
        ' firma por sí mismo en ' + link + (declared > 1 ? ' (van ' + summary.authorized + ' de ' + declared + ' intérpretes).' : '.') + '\n'
      : '',
    bloque_pista: esVerdadero(r.track_uses)
      ? '- PISTA: envíala antes del evento desde "Mi inscripción" (' + base + '?p=mi-inscripcion) indicando tu código ' +
        (r.code || '') + ', y lleva una copia en USB.\n'
      : ''
  };
}

// ---------------------------------------------------------------------------
// Queue
// ---------------------------------------------------------------------------

/**
 * Adds one e-mail to the queue unless the same idempotency key is already queued or sent.
 * Must run inside the script lock (it appends a row). Never throws: mail must not break the operation.
 */
function enqueueEmail(templateKey, row, trigger, extras, idempotencyKey) {
  try {
    if (!row || !row.submission_id) return { encolado: false, motivo: 'SIN_REGISTRO' };
    var key = idempotencyKey || (templateKey + ':' + row.submission_id);
    var existing = leerHoja(HOJA.EMAIL_LOG).filter(function (e) { return e.idempotency_key === key; })[0];
    if (existing && normalizarComparable(existing.status) !== EMAIL_STATUS.FALLIDO) {
      return { encolado: false, motivo: 'YA_EXISTE', email_id: existing.email_id };
    }
    var email = normalizarEmail(row.email);
    var skip = !esEmailValido(email) ? 'SIN_CORREO_VALIDO' : (/\.test$/i.test(email) ? 'DATO_DE_PRUEBA' : '');
    var id = nuevoId('EM');
    agregarFila(HOJA.EMAIL_LOG, {
      email_id: id, at: isoWithOffset(), template_key: templateKey, template_version: EMAIL_TEMPLATE_VERSION,
      trigger: trigger || 'manual', idempotency_key: key, recipient: email, submission_id: row.submission_id,
      person_id: row.person_id || '', code: row.code || row.previous_code || '',
      status: skip ? EMAIL_STATUS.OMITIDO : EMAIL_STATUS.PENDIENTE, provider_message_id: '', retry_count: 0,
      last_attempt_at: '', error: skip, subject: '', payload: JSON.stringify(extras || {}).slice(0, 2000)
    });
    return { encolado: !skip, email_id: id, motivo: skip };
  } catch (e) {
    try { registrar('sistema', '', 'CORREO_ENCOLAR_FALLO', templateKey, e.message); } catch (ignored) { /* nothing left to do */ }
    return { encolado: false, motivo: e.message };
  }
}

/**
 * Sends queued e-mails. Claims rows under the lock, sends outside it, records the results under
 * the lock again, so a concurrent run never sends the same row twice. Rows stuck in ENVIANDO
 * (a run that died) are retried after 15 minutes.
 * @param {{limit?:number, keys?:string[]}} options
 */
function processEmailQueue(options) {
  options = options || {};
  var limit = options.limit || 40;
  var now = Date.now();
  var quota = 0;
  try { quota = MailApp.getRemainingDailyQuota(); } catch (e) { quota = 0; }
  var budget = Math.max(0, Math.min(limit, quota - EMAIL_QUOTA_RESERVE));
  var result = { enviados: 0, errores: 0, pendientes_por_cuota: 0, cuota_restante: quota };

  var claimed = conBloqueo(function () {
    var rows = leerHoja(HOJA.EMAIL_LOG).filter(function (e) {
      if (options.keys && options.keys.indexOf(e.idempotency_key) === -1) return false;
      var st = normalizarComparable(e.status);
      if (st === EMAIL_STATUS.PENDIENTE) return true;
      if (st === EMAIL_STATUS.ERROR) return Number(e.retry_count || 0) < EMAIL_MAX_RETRIES;
      if (st === EMAIL_STATUS.ENVIANDO) return now - new Date(e.last_attempt_at).getTime() > 15 * 60000;
      return false;
    });
    rows.sort(function (a, b) {
      var pa = EMAIL_PRIORITY[a.template_key] || 9, pb = EMAIL_PRIORITY[b.template_key] || 9;
      if (pa !== pb) return pa - pb;
      return String(a.at) < String(b.at) ? -1 : 1;
    });
    result.pendientes_por_cuota = Math.max(0, rows.length - budget);
    var take = rows.slice(0, budget);
    var stamp = isoWithOffset();
    actualizarFilasEnLote(HOJA.EMAIL_LOG, take.map(function (e) {
      return { fila: e._fila, cambios: { status: EMAIL_STATUS.ENVIANDO, last_attempt_at: stamp } };
    }));
    return take;
  });
  if (!claimed.length) return result;

  var registry = {};
  leerHoja(HOJA.REGISTRO).forEach(function (r) { registry[r.submission_id] = r; });
  var members = leerHoja(HOJA.INTEGRANTES);
  var templates = plantillas();
  var base = webAppUrl();
  var production = environmentName() === 'production';
  var outcomes = claimed.map(function (e) {
    var out = { e: e, cambios: {} };
    try {
      var tpl = templates[e.template_key];
      var row = registry[e.submission_id];
      if (!tpl || !row) throw new Error(!tpl ? 'PLANTILLA_DESCONOCIDA' : 'REGISTRO_NO_ENCONTRADO');
      var payload = {};
      try { payload = JSON.parse(e.payload || '{}'); } catch (ignored) { payload = {}; }
      var msg = renderizarPlantilla(tpl, row, Object.assign(messageExtras(row, base, members), payload));
      var bad = forbiddenLink(msg.asunto + '\n' + msg.cuerpo);
      if (bad && (production || /\{\{/.test(bad))) throw new Error('CONTENIDO_NO_PERMITIDO: ' + bad);
      MailApp.sendEmail({
        to: e.recipient, subject: msg.asunto, body: emailPlainText(msg.cuerpo),
        htmlBody: emailHtml(msg.asunto, msg.cuerpo), name: cfg('whatsapp_oficial_nombre', 'EL BÚNKER — Arte es la Solución')
      });
      out.cambios = { status: EMAIL_STATUS.ENVIADO, subject: msg.asunto.slice(0, 250), error: '', last_attempt_at: isoWithOffset() };
      out.sent = true;
      out.payload = payload;
    } catch (err) {
      var retries = Number(e.retry_count || 0) + 1;
      var permanent = /^(PLANTILLA_DESCONOCIDA|REGISTRO_NO_ENCONTRADO|CONTENIDO_NO_PERMITIDO)/.test(err.message);
      out.cambios = { status: permanent || retries >= EMAIL_MAX_RETRIES ? EMAIL_STATUS.FALLIDO : EMAIL_STATUS.ERROR,
                      retry_count: retries, error: String(err.message).slice(0, 300), last_attempt_at: isoWithOffset() };
    }
    return out;
  });

  conBloqueo(function () {
    actualizarFilasEnLote(HOJA.EMAIL_LOG, outcomes.map(function (o) { return { fila: o.e._fila, cambios: o.cambios }; }));
    outcomes.forEach(function (o) {
      if (o.payload && o.payload.solicitud_id) markChangeNotification(o.payload.solicitud_id, o.sent ? 'CORREO ENVIADO ' + isoWithOffset() : 'CORREO FALLIDO');
      if (!o.sent && o.e && o.cambios.status === EMAIL_STATUS.FALLIDO) {
        registrar('sistema', '', 'CORREO_FALLIDO', o.e.template_key, o.e.submission_id + ' ' + o.cambios.error);
      }
    });
  });
  outcomes.forEach(function (o) { if (o.sent) result.enviados++; else result.errores++; });
  try { result.cuota_restante = MailApp.getRemainingDailyQuota(); } catch (e2) { /* keep the earlier value */ }
  return result;
}

function markChangeNotification(requestId, text) {
  var row = leerHoja(HOJA.CAMBIOS).filter(function (c) { return c.solicitud_id === requestId; })[0];
  if (row) actualizarFila(HOJA.CAMBIOS, row._fila, { notificacion_estado: text });
}

/** Time trigger (every 15 minutes). */
function procesarColaCorreos() {
  try { return processEmailQueue({ limit: 40 }); }
  catch (e) { registrar('sistema', '', 'COLA_CORREOS_FALLO', '', e.message); return { error: e.message }; }
}

/** Sends one queued e-mail right away (e.g. the reception receipt), outside any lock. Never throws. */
function sendNow(key) {
  try { return processEmailQueue({ keys: [key], limit: 1 }); }
  catch (e) { return { error: e.message }; }
}

// ---------------------------------------------------------------------------
// Panel: preview, bulk queueing, WhatsApp texts, the log
// ---------------------------------------------------------------------------

/**
 * Builds every message for a template without sending anything.
 * Returns WhatsApp click-to-chat links (only for people who authorized WhatsApp)
 * so a person sends them one by one from the official number.
 */
function accionMensajes(datos, sesion) {
  var todas = plantillas();
  var plantilla = todas[String(datos.plantilla || '').toUpperCase()];
  if (!plantilla) return { ok: false, error: 'Plantilla desconocida.', disponibles: Object.keys(todas) };
  if (plantilla.disponible && !plantilla.disponible()) {
    return { ok: false, error: plantilla.id === 'GRUPO_WHATSAPP'
      ? 'Esta plantilla aún no se puede usar: falta el enlace del grupo de WhatsApp en CONFIG (whatsapp_grupo_enlace).'
      : 'Esta plantilla aún no se puede usar: primero hay que cerrar los resultados.' };
  }
  var base = webAppUrl();
  var members = leerHoja(HOJA.INTEGRANTES);
  var mensajes = [];
  leerHoja(HOJA.REGISTRO).forEach(function (r) {
    if (datos.code && normalizarComparable(r.code) !== normalizarComparable(datos.code)) return;
    if (datos.bloque && String(r.final_block || r.original_block) !== String(datos.bloque)) return;
    if (isWithdrawn(r)) return;
    var extras = messageExtras(r, base, members);
    if (!plantilla.audiencia(r, extras)) return;
    var render = renderizarPlantilla(plantilla, r, extras);
    var tel = normalizarTelefono(r.whatsapp);
    var allowsWhatsapp = esVerdadero(r.consent_whatsapp);
    mensajes.push({
      code: r.code, submission_id: r.submission_id, full_name: r.full_name, email: r.email, whatsapp: r.whatsapp,
      consent_whatsapp: allowsWhatsapp, asunto: render.asunto, cuerpo: render.cuerpo,
      whatsapp_url: tel && allowsWhatsapp ? 'https://wa.me/57' + tel + '?text=' + encodeURIComponent(render.cuerpo) : '',
      sin_whatsapp: !allowsWhatsapp ? 'No autorizó WhatsApp: usar correo' : (!tel ? 'Sin número válido' : '')
    });
  });
  registrar(sesion.alias, sesion.rol, 'GENERAR_MENSAJES', plantilla.id, mensajes.length + ' destinatarios');
  return { plantilla: plantilla.id, nombre: plantilla.nombre, total: mensajes.length, mensajes: mensajes,
           plantillas: plantillasDisponibles() };
}

/**
 * Queues the e-mails of a template for everyone in its audience and starts sending.
 * Idempotent: a person already mailed with this template (same day for reminders of
 * signatures/tracks) is not mailed again. What the quota does not allow today goes out
 * with the next runs of the queue.
 */
function accionEnviarCorreos(datos, sesion) {
  var preparado = accionMensajes(datos, sesion);
  if (preparado.ok === false) return preparado;
  var day = Utilities.formatDate(new Date(), zonaHoraria(), 'yyyyMMdd');
  var repeatable = { FIRMAS_PENDIENTES: true, PISTA_PENDIENTE: true };
  var registry = {};
  leerHoja(HOJA.REGISTRO).forEach(function (r) { registry[r.submission_id] = r; });
  var queued = 0, repeated = 0, skipped = 0;
  conBloqueo(function () {
    preparado.mensajes.forEach(function (m) {
      var row = registry[m.submission_id];
      var key = preparado.plantilla + ':' + m.submission_id + ':' + (row.code || '') + (repeatable[preparado.plantilla] ? ':' + day : '');
      var r = enqueueEmail(preparado.plantilla, row, 'panel:' + sesion.alias, {}, key);
      if (r.encolado) queued++; else if (r.motivo === 'YA_EXISTE') repeated++; else skipped++;
    });
  });
  var sent = processEmailQueue({ limit: 40 });
  registrar(sesion.alias, sesion.rol, 'ENVIAR_CORREOS', preparado.plantilla,
            'encolados=' + queued + ' ya_enviados=' + repeated + ' omitidos=' + skipped + ' enviados_ahora=' + sent.enviados);
  return {
    plantilla: preparado.plantilla, encolados: queued, ya_enviados_antes: repeated, omitidos: skipped,
    enviados_ahora: sent.enviados, errores: sent.errores, pendientes_por_cuota: sent.pendientes_por_cuota,
    cuota_restante: sent.cuota_restante,
    nota: sent.pendientes_por_cuota
      ? 'El resto sale solo en las próximas horas (el sistema revisa la cola cada 15 minutos y respeta el límite diario de Gmail).'
      : ''
  };
}

/** The e-mail log for the panel, newest first, with counts per status. */
function accionRegistroCorreos(datos) {
  var rows = leerHoja(HOJA.EMAIL_LOG);
  var counts = {};
  rows.forEach(function (e) { var s = normalizarComparable(e.status); counts[s] = (counts[s] || 0) + 1; });
  var filter = normalizarComparable(datos.estado || '');
  var list = rows.filter(function (e) { return !filter || filter === 'TODOS' || normalizarComparable(e.status) === filter; })
    .slice(-300).reverse().map(function (e) {
      return { email_id: e.email_id, at: humanDateTime(e.at), plantilla: e.template_key, version: e.template_version,
               destinatario: maskEmail(e.recipient), code: e.code, submission_id: e.submission_id, estado: e.status,
               reintentos: e.retry_count, error: e.error, asunto: e.subject, trigger: e.trigger };
    });
  var quota = 0;
  try { quota = MailApp.getRemainingDailyQuota(); } catch (e) { quota = 0; }
  return { por_estado: counts, correos: list, cuota_restante: quota };
}

/** Puts FALLIDO e-mails back in the queue (after fixing the cause, e.g. a wrong address). */
function accionReintentarCorreos(datos, sesion) {
  return conBloqueo(function () {
    var failed = leerHoja(HOJA.EMAIL_LOG).filter(function (e) {
      return normalizarComparable(e.status) === EMAIL_STATUS.FALLIDO && (!datos.email_id || e.email_id === datos.email_id);
    });
    var registry = {};
    leerHoja(HOJA.REGISTRO).forEach(function (r) { registry[r.submission_id] = r; });
    actualizarFilasEnLote(HOJA.EMAIL_LOG, failed.map(function (e) {
      var row = registry[e.submission_id];
      return { fila: e._fila, cambios: { status: EMAIL_STATUS.PENDIENTE, retry_count: 0, error: '',
                                         recipient: row ? normalizarEmail(row.email) : e.recipient } };
    }));
    registrar(sesion.alias, sesion.rol, 'REINTENTAR_CORREOS', '', failed.length + ' correos');
    return { reencolados: failed.length };
  });
}

// ========================================================================
// 33_media.gs
// ========================================================================

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

// ========================================================================
// 40_setup.gs
// ========================================================================

/**
 * EL BUNKER - Installation, migration of an existing base, accounts and the
 * health check. Everything here is idempotent: it creates what is missing and
 * leaves existing data alone.
 */

function setupInicial() {
  var props = PropertiesService.getScriptProperties();
  var env = environmentName();
  var id = props.getProperty(PROP.SPREADSHEET_ID);
  var book = null;

  if (id) {
    try { book = SpreadsheetApp.openById(id); } catch (e) { book = null; }
  }
  if (!book) {
    book = SpreadsheetApp.create(env === 'test' ? '[PRUEBAS] EL BUNKER - BASE MAESTRA' : 'EL BUNKER - BASE MAESTRA');
    props.setProperty(PROP.SPREADSHEET_ID, book.getId());
    book.setSpreadsheetTimeZone('America/Bogota');
  }

  markSpreadsheetEnvironment(book, env);          // refuses to mix environments
  var schema = ensureSchema(book);

  // Drop the default first sheet only once every real sheet exists.
  ['Sheet1', 'Hoja 1', 'Hoja1'].forEach(function (n) {
    var s = book.getSheetByName(n);
    if (s && book.getSheets().length > 1) book.deleteSheet(s);
  });

  var config = ensureConfig(book, false);
  invalidarCacheConfig();
  secretoHmac();                                   // generate the signing key now
  instalarDisparadores();
  refrescarVistas();

  // An existing admin keeps its link: issuing a new one would revoke the one in use.
  var currentAdmin = leerHoja(HOJA.USUARIOS).filter(function (u) { return normalizarComparable(u.email_o_alias) === 'ADMIN'; })[0];
  var admin = currentAdmin && normalizarTexto(currentAdmin.token)
    ? { url: urlPanel(currentAdmin.rol, currentAdmin.token) }
    : provisionarUsuario('admin', ROL.ADMIN, 'Cuenta principal de administracion');
  registrar('sistema', 'admin', 'SETUP_INICIAL', book.getId(), VERSION_SISTEMA + ' ' + env);

  var resumen = {
    entorno: env,
    spreadsheet_id: book.getId(),
    spreadsheet_url: book.getUrl(),
    web_app_url: urlSegura(),
    enlace_admin: admin.url,
    version: VERSION_SISTEMA,
    esquema: schema,
    config: config
  };
  console.log(JSON.stringify(resumen, null, 2));
  return resumen;
}

function urlSegura() {
  return webAppUrl() || '(despliega la app como Web App para obtener la URL)';
}

/** "1899-12-30T16:00:00"/Date -> "16:00"; "2026-10-02T00:00:00" -> "2026-10-02". */
function configValueAsText(value) {
  if (value instanceof Date) {
    var tz = zonaHoraria();
    if (value.getFullYear() < 1901) return Utilities.formatDate(value, tz, 'HH:mm');
    var time = Utilities.formatDate(value, tz, 'HH:mm');
    return Utilities.formatDate(value, tz, 'yyyy-MM-dd') + (time !== '00:00' ? ' ' + time : '');
  }
  var s = String(value === null || value === undefined ? '' : value);
  var t = s.match(/^1899-12-3\d[T ](\d{2}:\d{2})/);
  if (t) return t[1];
  var d = s.match(/^(\d{4}-\d{2}-\d{2})T00:00:00$/);
  if (d) return d[1];
  return s;
}

/**
 * Makes CONFIG plain text (Sheets otherwise turns "15:00" into a date), adds
 * missing keys and, when migrating, updates values that still hold an
 * iteration-1 default. Anything an operator typed on purpose is kept and
 * reported as a conflict.
 */
function ensureConfig(book, migrate) {
  var sheet = book.getSheetByName(HOJA.CONFIG);
  var defaults = configuracionPorDefecto().slice(1);
  var defaultByKey = {};
  defaults.forEach(function (d) { defaultByKey[d[0]] = d; });

  var last = sheet.getLastRow();
  var rows = last > 1 ? sheet.getRange(2, 1, last - 1, 3).getValues() : [];
  sheet.getRange(2, 2, Math.max(1, sheet.getMaxRows() - 1), 1).setNumberFormat('@');

  var report = { agregadas: [], actualizadas: [], conflictos: [], convertidas: 0 };
  var present = {};
  rows.forEach(function (row, i) {
    var key = String(row[0]).trim();
    if (!key) return;
    present[key] = true;
    var text = configValueAsText(row[1]);
    var rowNumber = i + 2;
    if (text !== row[1]) { sheet.getRange(rowNumber, 2).setValue(text); report.convertidas++; }

    var def = defaultByKey[key];
    if (!def) return;
    if (migrate && text !== def[1]) {
      var olds = (CONFIG_ITERATION1_VALUES[key] || []).map(configValueAsText);
      var replaceable = text === '' || text.indexOf('PENDIENTE') === 0 || olds.indexOf(text) !== -1;
      if (replaceable) {
        sheet.getRange(rowNumber, 2).setValue(def[1]);
        report.actualizadas.push(key + ': "' + text + '" -> "' + def[1] + '"');
      } else {
        report.conflictos.push(key + ': se conserva "' + text + '" (valor nuevo sugerido: "' + def[1] + '")');
      }
    }
    if (migrate && String(row[2]) !== def[2]) sheet.getRange(rowNumber, 3).setValue(def[2]);
  });

  var missing = defaults.filter(function (d) { return !present[d[0]]; });
  if (missing.length) {
    sheet.getRange(sheet.getLastRow() + 1, 1, missing.length, 3).setValues(missing);
    report.agregadas = missing.map(function (d) { return d[0]; });
  }
  sheet.setColumnWidth(1, 240).setColumnWidth(2, 360).setColumnWidth(3, 520);
  invalidarCacheConfig();
  return report;
}

function instalarDisparadores() {
  var existentes = ScriptApp.getProjectTriggers().map(function (t) { return t.getHandlerFunction(); });
  if (existentes.indexOf('respaldoAutomatico') === -1) {
    ScriptApp.newTrigger('respaldoAutomatico').timeBased().everyDays(1).atHour(23).create();
  }
  if (existentes.indexOf('refrescarVistas') === -1) {
    ScriptApp.newTrigger('refrescarVistas').timeBased().everyHours(6).create();
  }
  if (existentes.indexOf('verificarVideosPendientes') === -1) {
    ScriptApp.newTrigger('verificarVideosPendientes').timeBased().everyHours(1).create();
  }
  if (existentes.indexOf('vencerOfertas') === -1) {
    ScriptApp.newTrigger('vencerOfertas').timeBased().everyHours(1).create();
  }
  if (existentes.indexOf('procesarColaCorreos') === -1) {
    ScriptApp.newTrigger('procesarColaCorreos').timeBased().everyMinutes(15).create();
  }
}

/** Time triggers the system needs; systemHealth reports any that is missing. */
var REQUIRED_TRIGGERS = ['respaldoAutomatico', 'refrescarVistas', 'verificarVideosPendientes', 'vencerOfertas', 'procesarColaCorreos'];

/**
 * Iteration-3 data migration of existing rows (idempotent): old eligibility words to the new
 * states, a team code for every project (soloists get EQ-xxx), person_id, and the pool order.
 * Never deletes, never changes a code.
 */
function migrateRowsToV3() {
  return conBloqueo(function () {
    var rows = leerHoja(HOJA.REGISTRO);
    var nextTeam = nextTeamNumber(rows);
    var updates = [];
    rows.forEach(function (r) {
      var changes = {};
      var e = normalizeEligibility(r.eligibility_status);
      if (e && e !== normalizarComparable(r.eligibility_status)) changes.eligibility_status = e;
      var o = normalizeEligibility(r.eligibility_override);
      if (o && o !== normalizarComparable(r.eligibility_override)) changes.eligibility_override = o;
      if (!normalizarTexto(r.eligibility_auto) && e) changes.eligibility_auto = e === ESTADO_ELEGIBILIDAD.RECIBIDO ? '' : e;
      if (!normalizarTexto(r.team_code)) {
        changes.team_code = normalizarTexto(r.group_code) || formatTeamCode(nextTeam++);
      }
      if (!normalizarTexto(r.person_id) && normalizarCedula(r.id_number)) changes.person_id = personIdFor(normalizarCedula(r.id_number));
      if (!normalizarTexto(r.document_type)) changes.document_type = 'CC';
      if (Object.keys(changes).length) updates.push({ fila: r._fila, cambios: changes });
    });
    actualizarFilasEnLote(HOJA.REGISTRO, updates);
    var members = leerHoja(HOJA.INTEGRANTES);
    var memberUpdates = [];
    members.forEach(function (m) {
      var changes = {};
      if (!normalizarTexto(m.person_role)) changes.person_role = PERSON_ROLE.INTERPRETE;
      if (!normalizarTexto(m.person_id) && normalizarCedula(m.normalized_id_number || m.id_number)) {
        changes.person_id = personIdFor(normalizarCedula(m.normalized_id_number || m.id_number));
      }
      if (!normalizarTexto(m.document_type)) changes.document_type = 'CC';
      if (m.on_stage === '' || m.on_stage === undefined) changes.on_stage = true;
      if (Object.keys(changes).length) memberUpdates.push({ fila: m._fila, cambios: changes });
    });
    actualizarFilasEnLote(HOJA.INTEGRANTES, memberUpdates);
    var pool = refreshPoolLocked();
    return { registros_actualizados: updates.length, integrantes_actualizados: memberUpdates.length, bolsa: pool };
  });
}

/** Operating accounts: one link per person, never shared between roles. */
var OPERATIONAL_ACCOUNTS = [
  ['admin', ROL.ADMIN, 'Cuenta principal de administracion'],
  ['coordinacion', ROL.LOGISTICA, 'Coordinador logistico'],
  ['direccion', ROL.DIRECCION, 'Direccion / gerencia'],
  ['checkin-1', ROL.CHECKIN, 'Mesa de check-in 1'],
  ['checkin-2', ROL.CHECKIN, 'Mesa de check-in 2'],
  ['stage-manager', ROL.CHECKIN, 'Stage manager y cronometro (precola / audicion / salida)'],
  ['tecnico-audio', ROL.CHECKIN, 'Tecnico de audio (pistas)'],
  ['jurado-1', ROL.JURADO, 'jurado 1'],
  ['jurado-2', ROL.JURADO, 'jurado 2'],
  ['jurado-3', ROL.JURADO, 'jurado 3']
];

/** Creates (or refreshes) every operating account and prints its link. */
function crearAccesosOperativos() {
  var salida = OPERATIONAL_ACCOUNTS.map(function (c) { return provisionarUsuario(c[0], c[1], c[2]); });
  console.log(salida.map(function (s) { return s.alias + ' (' + s.rol + '):\n  ' + s.url; }).join('\n\n'));
  return salida;
}

/** Only the accounts that do not exist yet; existing links keep working untouched. */
function ensureOperationalAccounts() {
  var existing = {};
  leerHoja(HOJA.USUARIOS).forEach(function (u) { existing[normalizarComparable(u.email_o_alias)] = true; });
  return OPERATIONAL_ACCOUNTS.filter(function (c) { return !existing[normalizarComparable(c[0])]; })
    .map(function (c) { return provisionarUsuario(c[0], c[1], c[2]); });
}

/** Prints the live access links again without re-issuing tokens. */
function verAccesos() {
  var usuarios = leerHoja(HOJA.USUARIOS).filter(function (u) {
    return normalizarComparable(u.activo) !== 'NO';
  });
  var salida = usuarios.map(function (u) {
    return { alias: u.email_o_alias, rol: u.rol, url: urlPanel(u.rol, u.token), expira: tokenExpiry(u.token) };
  });
  console.log(salida.map(function (s) { return s.alias + ' (' + s.rol + ', vence ' + s.expira + '):\n  ' + s.url; }).join('\n\n'));
  return salida;
}

function tokenExpiry(token) {
  try {
    var payload = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(String(token).split('.')[0])).getDataAsString());
    return Utilities.formatDate(new Date(payload.e), zonaHoraria(), 'yyyy-MM-dd');
  } catch (e) { return '?'; }
}

/**
 * Upgrades an EXISTING base (production) to this version. Only adds: sheets,
 * columns at the end, CONFIG keys; updates CONFIG values that still hold an
 * iteration-1 default. A raw backup is taken first and row counts are compared
 * before and after.
 */
function migrarBase() {
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty(PROP.SPREADSHEET_ID)) throw new Error('No hay base maestra: usa INSTALAR.');
  var book = libro();
  var env = environmentName();

  // Data the migration must never change. _USUARIOS is compared by the users
  // that existed before: the migration adds the new operating accounts on purpose.
  var snapshot = function () {
    var out = {};
    ['REGISTRO', '_CAMBIOS', 'INCIDENTES', 'JURADO_1', 'JURADO_2', 'JURADO_3'].forEach(function (n) {
      out[n] = leerHoja(n).length;
    });
    out.REGISTRO_IDS = leerHoja(HOJA.REGISTRO).map(function (r) { return r.submission_id; }).sort().join(',');
    out.USUARIOS = leerHoja(HOJA.USUARIOS).map(function (u) { return u.email_o_alias + '=' + u.token; }).sort().join(',');
    return out;
  };
  var before = snapshot();
  var safety = rawBackup('PRE-MIGRACION');

  var marker = markSpreadsheetEnvironment(book, env);
  var schema = ensureSchema(book);
  var config = ensureConfig(book, true);
  invalidarCacheConfig();
  invalidateRubricCache();
  var rowsV3 = migrateRowsToV3();
  instalarDisparadores();
  refrescarVistas();

  var after = snapshot();
  var intact = Object.keys(before).every(function (k) { return before[k] === after[k]; });
  var accounts = ensureOperationalAccounts();
  var report = {
    entorno: env, marca_hoja: marker, version: VERSION_SISTEMA,
    filas_antes: countsOnly(before), filas_despues: countsOnly(after),
    datos_intactos: intact, respaldo_previo: safety, esquema: schema, config: config, filas_v3: rowsV3,
    rubrica: { version: activeRubric().version, valida: activeRubric().valida, origen: activeRubric().origen },
    cuentas_nuevas: accounts.map(function (a) { return a.alias; })
  };
  registrar('sistema', 'admin', 'MIGRAR_V3', book.getId(), JSON.stringify({ intactos: intact, conflictos: config.conflictos.length }));
  if (!intact) throw new Error('ATENCION: cambio el numero de filas durante la migracion. Revisa el respaldo ' + safety.json);
  return report;
}

function countsOnly(snapshot) {
  var out = {};
  Object.keys(snapshot).forEach(function (k) { if (typeof snapshot[k] === 'number') out[k] = snapshot[k]; });
  return out;
}

/** Backup of the sheets exactly as they are, without rebuilding views first (used before a migration). */
function rawBackup(label) {
  var marca = Utilities.formatDate(new Date(), zonaHoraria(), 'yyyyMMdd-HHmmss');
  var xlsx = exportarXlsx('RESPALDO-' + label + '-' + marca);
  var dump = {};
  libro().getSheets().forEach(function (s) { dump[s.getName()] = leerHoja(s.getName()); });
  var json = carpetaBackups().createFile(Utilities.newBlob(
    JSON.stringify({ generado_at: ahoraISO(), version: 'previa', entorno: environmentName(), etiqueta: label, datos: dump }, null, 1),
    'application/json', 'RESPALDO-' + label + '-' + marca + '.json'));
  return { xlsx: xlsx.nombre, json: json.getName(), json_id: json.getId() };
}

/**
 * Health check for the release report: environment keys, schema, forms,
 * triggers, legal flags and - in production - that no test data is present.
 */
function systemHealth() {
  var book = libro();
  var missingColumns = {};
  sheetDefinitions().forEach(function (d) {
    var sheet = book.getSheetByName(d[0]);
    if (!sheet) { missingColumns[d[0]] = 'FALTA LA HOJA'; return; }
    var header = encabezados(d[0]);
    var miss = d[1].filter(function (c) { return header.indexOf(c) === -1; });
    if (miss.length) missingColumns[d[0]] = miss;
  });
  var triggers = ScriptApp.getProjectTriggers().map(function (t) { return t.getHandlerFunction(); });
  var audit = auditTestData();
  var rubric = activeRubric();
  var foreignCards = [];
  var cards = evaluationCards();
  Object.keys(cards).forEach(function (code) {
    cards[code].forEach(function (c) {
      if (c.row.rubric_fingerprint && String(c.row.rubric_fingerprint) !== String(rubric.fingerprint)) foreignCards.push(code + '/J' + c.jurado);
    });
  });
  var mail = {};
  leerHoja(HOJA.EMAIL_LOG).forEach(function (e) { var st = normalizarComparable(e.status); mail[st] = (mail[st] || 0) + 1; });
  var legalPending = ['legal_name', 'nit', 'legal_address', 'data_protection_email', 'institutional_phone', 'terms_version']
    .filter(function (k) { return String(cfg(k, 'PENDIENTE')).indexOf('PENDIENTE') === 0; });
  return {
    version: VERSION_SISTEMA,
    entorno: environmentName(),
    marca_hoja: spreadsheetEnvironment(book),
    llaves_coinciden: environmentName() === spreadsheetEnvironment(book),
    base: book.getName(),
    web_app: urlSegura(),
    web_app_url_ok: /\/exec$/.test(webAppUrl()),
    esquema_completo: Object.keys(missingColumns).length === 0,
    columnas_faltantes: missingColumns,
    disparadores: triggers,
    disparadores_faltantes: REQUIRED_TRIGGERS.filter(function (t) { return triggers.indexOf(t) === -1; }),
    rubrica: { version: rubric.version, origen: rubric.origen, valida: rubric.valida, errores: rubric.errores,
               maximo: rubricMaxTotal(rubric.categorias), minimo: rubricMinTotal(rubric.categorias),
               tarjetas_con_otra_rubrica: foreignCards },
    correos: mail,
    etapas: { lista_oficial_bloqueada: cfgBool('lista_oficial_bloqueada', false), resultados_cerrados: cfgBool('resultados_cerrados', false) },
    formularios: {
      inscripcion: cfgBool('inscripciones_abiertas', true), cambios: cfgBool('cambios_abiertos', true),
      integrantes: cfgBool('integrantes_abierto', true), pistas: cfgBool('pistas_abiertas', true)
    },
    evento: { fecha: cfgFecha('evento_fecha', ''), inicio: cfgHora('evento_hora_inicio', ''), sede: cfg('evento_sede', ''),
              edades: cfgNumero('edad_minima', 18) + '-' + cfgNumero('edad_maxima', 30), top: cfgNumero('top_seleccionados', 10),
              top_privado: cfgNumero('top_privado', 20), bolsa: cfgNumero('bolsa_aptos', 200) },
    legal: { datos_verificados: cfgBool('datos_legales_verificados', false), pendientes: legalPending,
             terms_version: cfg('terms_version', ''), policy_version: cfg('policy_version', '') },
    datos_de_prueba: audit,
    produccion_limpia: environmentName() !== 'production' || audit.limpio
  };
}

function accionEstadoSistema() {
  return { salud: systemHealth() };
}

/** Full reset of operational data in the TEST environment. Keeps CONFIG and users. */
function borrarDatosDePrueba(confirmacion) {
  exigirEntornoPruebas('LIMPIAR');
  if (confirmacion !== 'SI-BORRAR') {
    throw new Error('Para evitar un borrado accidental, llama borrarDatosDePrueba("SI-BORRAR").');
  }
  return conBloqueo(function () {
    [HOJA.REGISTRO, HOJA.INTEGRANTES, HOJA.DELIBERACIONES, HOJA.JURADO_1, HOJA.JURADO_2, HOJA.JURADO_3,
     HOJA.INCIDENTES, HOJA.CAMBIOS, HOJA.LOG, HOJA.IDEMPOTENCIA, HOJA.OFERTAS, HOJA.SLOTS_HISTORIAL,
     HOJA.EMAIL_LOG, HOJA.DESCALIFICACIONES, HOJA.BOLSA, HOJA.SEGURO].forEach(limpiarDatos);
    removeRosterSnapshots();
    ['lista_oficial_version', 'lista_oficial_at', 'lista_oficial_by'].forEach(function (k) { setConfigValue(k, ''); });
    setConfigValue('lista_oficial_bloqueada', 'NO');
    setConfigValue('resultados_cerrados', 'NO');
    var trashed = trashTestFiles();
    resetRehearsalState();
    refrescarVistas();
    registrar('sistema', 'admin', 'BORRAR_DATOS_PRUEBA', '', 'confirmado; archivos a la papelera=' + trashed);
    return { ok: true, archivos_a_papelera: trashed, mensaje: 'Datos operativos de PRUEBAS borrados. CONFIG y usuarios intactos.' };
  });
}

/** Deletes the ROSTER_FINAL snapshot sheets (test environment reset only). */
function removeRosterSnapshots() {
  exigirEntornoPruebas('LIMPIAR');
  var base = cfg('lista_oficial_nombre', 'ROSTER_FINAL_2026-10-22');
  var book = libro();
  book.getSheets().forEach(function (sh) {
    if (sh.getName().indexOf(base) === 0 && book.getSheets().length > 1) book.deleteSheet(sh);
  });
}

/** Sends the test environment's audio and signature files to the Drive trash. Test only. */
function trashTestFiles() {
  exigirEntornoPruebas('LIMPIAR ARCHIVOS');
  var count = 0;
  [PROP.AUDIO_FOLDER, PROP.SIGNATURES_FOLDER].forEach(function (key) {
    var id = PropertiesService.getScriptProperties().getProperty(key);
    if (!id) return;
    try {
      var folders = DriveApp.getFolderById(id).getFolders();
      while (folders.hasNext()) { folders.next().setTrashed(true); count++; }
    } catch (e) { /* folder already gone */ }
  });
  return count;
}

/**
 * Deletes specific registrations by submission_id (with their group members and
 * change requests). Meant for test rows that reached a live base; a raw backup
 * is taken first and every removed ID is logged.
 */
function quitarInscripciones(ids, confirmacion) {
  if (confirmacion !== 'SI-QUITAR') throw new Error('BLOQUEADO: confirma con SI-QUITAR.');
  var wanted = {};
  (ids || []).forEach(function (id) { wanted[normalizarComparable(id)] = true; });
  return conBloqueo(function () {
    var rows = leerHoja(HOJA.REGISTRO).filter(function (r) { return wanted[normalizarComparable(r.submission_id)]; });
    if (!rows.length) return { quitadas: [], mensaje: 'No hay filas con esos IDs: nada que quitar.' };
    var backup = rawBackup('ANTES-DE-QUITAR');
    var groups = {}, codes = {};
    rows.forEach(function (r) {
      if (r.group_code) groups[normalizarComparable(r.group_code)] = true;
      if (r.team_code) groups[normalizarComparable(r.team_code)] = true;
      if (r.code) codes[normalizarComparable(r.code)] = true;
      String(r.previous_code || '').split(',').forEach(function (c) { if (normalizarTexto(c)) codes[normalizarComparable(c)] = true; });
    });
    var removeWhere = function (sheetName, test) {
      var sheet = libro().getSheetByName(sheetName);
      if (!sheet) return 0;
      var doomed = leerHoja(sheetName).filter(test).map(function (r) { return r._fila; }).sort(function (a, b) { return b - a; });
      doomed.forEach(function (n) { sheet.deleteRow(n); });
      return doomed.length;
    };
    var removed = {
      registro: removeWhere(HOJA.REGISTRO, function (r) { return wanted[normalizarComparable(r.submission_id)]; }),
      integrantes: removeWhere(HOJA.INTEGRANTES, function (m) {
        return groups[normalizarComparable(m.group_code)] || wanted[normalizarComparable(m.project_submission_id)];
      }),
      cambios: removeWhere(HOJA.CAMBIOS, function (c) { return codes[normalizarComparable(c.code)]; }),
      ofertas: removeWhere(HOJA.OFERTAS, function (o) { return wanted[normalizarComparable(o.submission_id)]; }),
      correos: removeWhere(HOJA.EMAIL_LOG, function (e) { return wanted[normalizarComparable(e.submission_id)]; }),
      descalificaciones: removeWhere(HOJA.DESCALIFICACIONES, function (d) { return wanted[normalizarComparable(d.submission_id)]; }),
      tarjetas: [HOJA.JURADO_1, HOJA.JURADO_2, HOJA.JURADO_3].reduce(function (n, sheetName) {
        return n + removeWhere(sheetName, function (c) { return codes[normalizarComparable(c.code)]; });
      }, 0)
    };
    registrar('sistema', 'admin', 'QUITAR_INSCRIPCIONES', rows.map(function (r) { return r.submission_id; }).join(','),
              JSON.stringify(removed) + ' respaldo=' + backup.json);
    refrescarVistas();
    return { quitadas: rows.map(function (r) { return r.submission_id; }), filas: removed, respaldo: backup };
  });
}

// ========================================================================
// 41_seed.gs
// ========================================================================

/**
 * EL BUNKER - Fictitious test dataset and the end-to-end rehearsal (ENSAYO).
 *
 * Generates 130 project submissions on purpose: more than the 100 seats, and
 * salted with every failure mode from the QA list (duplicates, out-of-range
 * ages, residence, incomplete forms, repeated group names, malformed groups,
 * minor members, missing signatures...), so running the real pipeline over it
 * proves that exactly 100 definitive codes are issued and everything else lands
 * in a correct, traceable state.
 *
 * Names and documents are invented. No real person's data is used, and every
 * row carries seed markers (source "seed", SEED- ids, @ejemplo-bunker.test
 * e-mails) that production refuses.
 *
 * Everything above cargarDatosDePrueba() is pure (the Node tests load it).
 */

var NOMBRES_PRUEBA = ['Ana', 'Carlos', 'Daniela', 'Esteban', 'Farid', 'Gabriela', 'Hector',
  'Isabela', 'Julian', 'Karen', 'Luis', 'Manuela', 'Nicolas', 'Orlando', 'Paula',
  'Quintero', 'Rocio', 'Samuel', 'Tatiana', 'Uriel', 'Valeria', 'William', 'Ximena', 'Yeison', 'Zulma'];
var APELLIDOS_PRUEBA = ['Restrepo', 'Gomez', 'Arango', 'Zapata', 'Ospina', 'Cardona', 'Velez',
  'Mesa', 'Quintero', 'Betancur', 'Jaramillo', 'Munoz', 'Ramirez', 'Agudelo', 'Salazar'];
var SECTORES_PRUEBA = ['Aliadas del Sur', 'Betania', 'Calle del Banco', 'Holanda', 'La Doctora',
  'Los Alcazares', 'Maria Auxiliadora', 'Playa Rica', 'Restrepo Naranjo', 'San Joaquin', 'Vegas de la Doctora'];
var TEST_GENRES = ['Pop', 'Urbano', 'Rap / Hip hop', 'Trap', 'R&B / Soul', 'Rock', 'Salsa',
  'Musica popular', 'Electronica / DJ', 'Balada', 'Folclor', 'Freestyle'];
var TEST_ROLES = ['Voz', 'Guitarra', 'Bajo', 'Bateria', 'Teclado', 'Coros', 'DJ', 'Baile', 'Percusion'];

/** A tiny valid PNG (1x1), used as the drawn signature of seed members. */
var TEST_SIGNATURE_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

/** A public, long-lived video: exercises the ACCESIBLE path of the video check. */
var TEST_PUBLIC_VIDEO = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

function seudoAleatorio(semilla) {
  var s = semilla;
  return function () {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

function pad3(n) { var s = String(n); while (s.length < 3) s = '0' + s; return s; }

/**
 * Builds the project submissions in memory. Deterministic: the same seed
 * always produces the same rows, so a failing QA run can be reproduced exactly.
 */
function construirDatasetPrueba(total) {
  total = total || 130;
  var azar = seudoAleatorio(20261023);
  var filas = [];
  var base = 1000000000;

  for (var i = 0; i < total; i++) {
    var nombre = NOMBRES_PRUEBA[Math.floor(azar() * NOMBRES_PRUEBA.length)];
    var apellido = APELLIDOS_PRUEBA[Math.floor(azar() * APELLIDOS_PRUEBA.length)];
    var apellido2 = APELLIDOS_PRUEBA[Math.floor(azar() * APELLIDOS_PRUEBA.length)];
    // Ages stay strictly inside 19..29 so that ONLY the seeded rows below fall
    // outside the 18-30 rule. Months are capped at September so the birthday
    // has already passed on 23 October and the computed age is exact.
    var edad = 19 + Math.floor(azar() * 11);                   // 19..29
    var anio = 2026 - edad;
    var mes = 1 + Math.floor(azar() * 9);                      // 1..9
    var dia = 1 + Math.floor(azar() * 28);

    var mode = i % 10 === 3 ? 'AGRUPACION' : (i % 10 === 7 ? 'DUO' : 'SOLISTA');
    var format = PRESENTATION_FORMATS[i % PRESENTATION_FORMATS.length];
    var usesTrack = i % 3 === 0;

    var fila = {
      client_submission_id: 'SEED-' + i,
      form_elapsed_ms: 60000,
      full_name: nombre + ' ' + apellido + ' ' + apellido2,
      id_number: String(base + i * 137),
      birth_date: anio + '-' + (mes < 10 ? '0' : '') + mes + '-' + (dia < 10 ? '0' : '') + dia,
      adult_confirmation: true,
      neighborhood_sector: SECTORES_PRUEBA[Math.floor(azar() * SECTORES_PRUEBA.length)],
      resides_in_sabaneta: 'SI',
      email: 'prueba' + i + '@ejemplo-bunker.test',
      whatsapp: '3' + String(100000000 + i * 7919).slice(0, 9),
      participation_mode: mode,
      artistic_name: mode === 'AGRUPACION' ? 'COLECTIVO PRUEBA ' + i
        : (mode === 'DUO' ? 'DUO PRUEBA ' + i : 'PRUEBA-' + pad3(i)),
      members_declared: mode === 'AGRUPACION' ? String(3 + (i % 3)) : (mode === 'DUO' ? '2' : '1'),
      genre_primary: TEST_GENRES[i % TEST_GENRES.length],
      genre_secondary: i % 4 === 0 ? TEST_GENRES[(i + 5) % TEST_GENRES.length] : '',
      audition_description: 'Propuesta ficticia de 3 minutos para pruebas del sistema.',
      presentation_format: format,
      presentation_other: format === 'OTRA' ? 'Performance de prueba' : '',
      needs: i % 2 === 0 ? 'MICROFONO' : 'MICROFONO,PISTA',
      needs_other: '',
      own_equipment: i % 5 === 0 ? 'SI' : 'NO',
      own_equipment_detail: i % 5 === 0 ? 'Guitarra acustica (dato ficticio)' : '',
      song_name: 'Cancion de prueba ' + i,
      track_uses: usesTrack ? 'SI' : 'NO',
      track_method: usesTrack ? ['ARCHIVO', 'USB', 'WHATSAPP'][i % 3 === 0 ? (i / 3) % 3 : 0] : '',
      video_url: i % 20 === 0 ? TEST_PUBLIC_VIDEO : 'https://www.youtube.com/watch?v=PRUEBA' + i,
      availability_statement: true,
      accept_terms: true,
      accept_data_processing: true,
      accept_whatsapp_operational: true,
      accept_image_voice: i % 5 !== 0,
      document_type: 'CC',
      signature_png: TEST_SIGNATURE_PNG,
      source: 'seed'
    };

    // ---- Deliberate failure modes ----------------------------------------
    if (i === 110 || i === 111) {                  // duplicate by document
      fila.id_number = String(base);               // same as record 0
      fila.email = 'otro' + i + '@ejemplo-bunker.test';
    }
    if (i === 112) fila.email = 'prueba1@ejemplo-bunker.test';     // same e-mail -> alert only
    if (i === 113) fila.whatsapp = '3100000000';                   // same phone as record 0 -> alert
    if (i === 114) fila.birth_date = '2012-05-10';                 // too young
    if (i === 115) fila.birth_date = '1990-03-22';                 // too old
    if (i === 116) fila.resides_in_sabaneta = 'NO';                // outside Sabaneta
    if (i === 117) fila.email = '';                                // incomplete
    if (i === 118) fila.accept_data_processing = false;            // consent missing
    if (i === 119) fila.video_url = 'lo tengo en el celular';      // malformed link -> review
    if (i === 120) fila.whatsapp = '6044441111';                   // landline -> invalid
    if (i === 121) fila.birth_date = '31/02/2003';                 // impossible date
    if (i === 122) fila.full_name = '';                            // incomplete
    if (i === 123) fila.signature_png = '';                        // registrant did not sign -> incomplete
    if (i === 124 || i === 125) {                                  // same group, typed differently
      fila.participation_mode = 'AGRUPACION';
      fila.members_declared = '4';
      fila.artistic_name = i === 124 ? 'El Arte es La Solución' : 'EL ARTE ES LA SOLUCIÓN';
    }
    if (i === 126) { fila.participation_mode = 'AGRUPACION'; fila.members_declared = ''; }   // group size missing
    if (i === 127) { fila.participation_mode = 'DUO'; fila.members_declared = '3'; }         // a duo of three
    if (i === 128) fila.birth_date = '1996-10-23';                 // exactly 30 on the day -> eligible
    if (i === 129) fila.birth_date = '1995-10-22';                 // 31 on the day -> out

    filas.push(fila);
  }
  // Last: byte-identical retry of record 5 (same client_submission_id).
  filas.push(JSON.parse(JSON.stringify(filas[5])));
  return filas;
}

/**
 * Member submissions for the given group projects ({group_code, members_declared}).
 * The leader is registered automatically by Form 1, so each group gets
 * declared-1 members, with seeded anomalies on the first groups:
 *   group 0: one member is 16                -> NO CUMPLE
 *   group 1: one member did not sign         -> INCOMPLETO
 *   group 2: one member never shows up       -> group left incomplete
 *   group 3: one member also plays in group 0 -> cross-group alert
 *   group 4: one member is sent twice (retry) and once more re-signing
 */
function buildTestMembers(groups) {
  var out = [];
  var base = 2000000000;
  var counter = 0;
  var firstMemberOfGroup0 = null;

  groups.forEach(function (g, gi) {
    var declared = parseInt(g.members_declared, 10) || 2;
    var toCreate = declared - 1;
    if (gi === 2) toCreate = Math.max(0, toCreate - 1);
    for (var k = 0; k < toCreate; k++) {
      counter++;
      var member = {
        client_submission_id: 'SEED-M-' + g.group_code + '-' + k,
        form_elapsed_ms: 60000,
        source: 'seed',
        group_code: g.group_code,
        full_name: NOMBRES_PRUEBA[(counter * 7) % NOMBRES_PRUEBA.length] + ' ' +
                   APELLIDOS_PRUEBA[(counter * 3) % APELLIDOS_PRUEBA.length] + ' Integrante',
        id_number: String(base + counter * 101),
        birth_date: (2026 - 20 - (counter % 8)) + '-0' + (1 + (counter % 8)) + '-15',
        artistic_role: TEST_ROLES[counter % TEST_ROLES.length],
        adult_confirmation: true,
        accept_terms: true,
        accept_data_processing: true,
        accept_image_voice: counter % 4 !== 0,
        signature_png: TEST_SIGNATURE_PNG
      };
      if (gi === 0 && k === 0) { member.birth_date = '2010-06-01'; }
      if (gi === 0 && k === 1) { firstMemberOfGroup0 = member.id_number; }
      if (gi === 1 && k === 0) { member.signature_png = ''; }
      if (gi === 3 && k === 0 && firstMemberOfGroup0) { member.id_number = firstMemberOfGroup0; }
      out.push(member);
      if (k === 0 && gi % 3 === 0) {
        counter++;
        out.push({
          client_submission_id: 'SEED-C-' + g.group_code, form_elapsed_ms: 60000, source: 'seed', group_code: g.group_code,
          person_role: 'EQUIPO_TRABAJO', crew_role: gi % 2 ? 'TECNICO' : 'MANAGER', on_stage: false, document_type: 'CC',
          full_name: NOMBRES_PRUEBA[(counter * 5) % NOMBRES_PRUEBA.length] + ' Equipo', id_number: String(base + counter * 101),
          birth_date: '1990-02-15', adult_confirmation: true, accept_terms: true, accept_data_processing: true,
          accept_image_voice: true, signature_png: TEST_SIGNATURE_PNG
        });
      }
      if (gi === 4 && k === 0) {
        out.push(JSON.parse(JSON.stringify(member)));                       // identical retry
        var resign = JSON.parse(JSON.stringify(member));
        resign.client_submission_id += '-RESIGN';                            // same person, new submission
        resign.artistic_role = 'Voz principal';
        out.push(resign);
      }
    }
  });
  return out;
}

/** A few bytes that look like an MP3 (ID3 header), to exercise the upload path. */
function buildTestTrackBase64() {
  var bytes = [0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x0a];
  for (var i = 0; i < 2048; i++) bytes.push(i % 251);
  return Utilities.base64Encode(bytes);
}

// ===========================================================================
// Apps-Script-only below this line (the Node tests strip from here down).
// ===========================================================================

/**
 * Loads the dataset through the REAL public endpoint, so the test exercises
 * validation, duplicate detection, group detection and idempotency exactly as
 * production will. Only runs in the test environment.
 */
function cargarDatosDePrueba(deadline) {
  exigirEntornoPruebas('CARGAR DATOS DE PRUEBA');
  var filas = construirDatasetPrueba(130);
  var resultados = { total: filas.length, por_estado: {}, repetidos: 0 };
  var stored = storedIdempotencyKeys();
  var seen = {};

  for (var i = 0; i < filas.length; i++) {
    var f = filas[i];
    var key = 'inscripcion:' + f.client_submission_id;
    var isRetry = seen[key];
    seen[key] = true;
    // Resuming: rows already processed are skipped; the deliberate retry of an id still runs (it must replay).
    if (!isRetry && stored[key]) continue;
    if (deadline && Date.now() > deadline) return rehearsalPause(resultados, filas.length - i);
    var r = accionInscribir(f);
    if (r.repetido) resultados.repetidos++;
    var e = r.eligibility_status || ('ERROR: ' + (r.error || ''));
    resultados.por_estado[e] = (resultados.por_estado[e] || 0) + 1;
  }
  if (deadline) resultados = seedRegistrationSummary(resultados.repetidos);

  registrar('sistema', 'admin', 'CARGAR_DATOS_PRUEBA', '', JSON.stringify(resultados));
  console.log(JSON.stringify(resultados, null, 2));
  return resultados;
}

/** Keys already recorded in _IDEMPOTENCIA, read once (one lookup per row would cost ~0.3 s each). */
function storedIdempotencyKeys() {
  var keys = {};
  leerHoja(HOJA.IDEMPOTENCIA).forEach(function (r) { keys[String(r.clave)] = true; });
  return keys;
}

/** A phase that ran out of time: the rehearsal keeps it pending and continues in a new execution. */
function rehearsalPause(partial, pending) {
  return { pausa: true, pendientes: pending, parcial: partial };
}

/** Totals of the seed registrations as they stand in REGISTRO (a resumed phase only saw its last chunk). */
function seedRegistrationSummary(retries) {
  var out = { total: 0, por_estado: {}, repetidos: retries || 0 };
  leerHoja(HOJA.REGISTRO).forEach(function (r) {
    if (!isTestData(r)) return;
    out.total++;
    out.por_estado[r.eligibility_status] = (out.por_estado[r.eligibility_status] || 0) + 1;
  });
  return out;
}

/** Registers the seed members of every group project through the real action. */
function cargarIntegrantesDePrueba(deadline) {
  exigirEntornoPruebas('CARGAR INTEGRANTES DE PRUEBA');
  var rows = leerHoja(HOJA.REGISTRO).filter(function (r) { return normalizarComparable(r.eligibility_status) !== 'INCOMPLETO'; });
  var groups = rows.filter(function (r) { return r.group_code; });
  var payloads = buildTestMembers(groups);
  // A soloist with crew: the same "equipo y firmas" link serves every project.
  var soloist = rows.filter(function (r) { return !r.group_code && r.team_code; })[0];
  if (soloist) {
    payloads.push({
      client_submission_id: 'SEED-C-' + soloist.team_code, form_elapsed_ms: 60000, source: 'seed', group_code: soloist.team_code,
      person_role: 'EQUIPO_TRABAJO', crew_role: 'TECNICO', on_stage: false, document_type: 'CC',
      full_name: 'Tecnico Prueba Solista', id_number: '2099000001', birth_date: '1988-04-10', adult_confirmation: true,
      accept_terms: true, accept_data_processing: true, accept_image_voice: true, signature_png: TEST_SIGNATURE_PNG
    });
  }
  var summary = { total: payloads.length, por_estado: {}, repetidos: 0, errores: 0 };
  var stored = storedIdempotencyKeys();
  for (var i = 0; i < payloads.length; i++) {
    var p = payloads[i];
    if (stored['integrante:' + p.client_submission_id]) continue;       // already registered in an earlier run
    if (deadline && Date.now() > deadline) return rehearsalPause(summary, payloads.length - i);
    p.group_key = groupAccessKey(p.group_code);
    var r = accionRegistrarIntegrante(p);
    if (r.repetido) summary.repetidos++;
    if (r.ok === false) { summary.errores++; continue; }
    summary.por_estado[r.member_status] = (summary.por_estado[r.member_status] || 0) + 1;
  }
  if (deadline) summary = seedMemberSummary(payloads.length);
  registrar('sistema', 'admin', 'CARGAR_INTEGRANTES_PRUEBA', '', JSON.stringify(summary));
  return summary;
}

/** Totals of the non-leader members as they stand in _INTEGRANTES. */
function seedMemberSummary(total) {
  var out = { total: total, por_estado: {} };
  leerHoja(HOJA.INTEGRANTES).forEach(function (m) {
    if (esVerdadero(m.is_leader)) return;
    if (normalizePersonRole(m.person_role) === PERSON_ROLE.EQUIPO_TRABAJO) { out.equipo = (out.equipo || 0) + 1; return; }
    out.por_estado[m.member_status] = (out.por_estado[m.member_status] || 0) + 1;
  });
  return out;
}

/**
 * End-to-end rehearsal, resumable: Apps Script stops any execution at 6
 * minutes, and a full rehearsal (130 submissions, members, codes, a simulated
 * day, three jurors, backups) does not fit in one. Each phase is idempotent and
 * the progress lives in a Script Property, so running ENSAYO again continues
 * where it stopped; a one-off trigger does it automatically.
 */
var REHEARSAL_STATE_KEY = 'ENSAYO_ESTADO';
var REHEARSAL_BUDGET_MS = 4.5 * 60 * 1000;

function ensayoIntegral() {
  exigirEntornoPruebas('ENSAYO');
  var started = Date.now();
  var props = PropertiesService.getScriptProperties();
  var state = JSON.parse(props.getProperty(REHEARSAL_STATE_KEY) || '{"done":[],"report":[]}');
  var admin = { ok: true, rol: ROL.ADMIN, alias: 'ensayo' };

  // Apps Script kills an execution at 6 minutes; long phases stop at this deadline and resume.
  var deadline = started + REHEARSAL_BUDGET_MS;
  var phases = [
    ['1. Inscripciones (130 + reintento)', function () { return cargarDatosDePrueba(deadline); }],
    ['2. Integrantes de agrupaciones', function () { return cargarIntegrantesDePrueba(deadline); }],
    ['3. Aplicar verificacion de aptitud', function () {
      var a = accionAplicarVerificacion({}, admin);
      return { aplicadas: a.aplicadas, por_estado: a.por_estado };
    }],
    ['4. Agrupacion repetida: el operador decide', function () { return rehearsalResolveRepeatedGroup(admin); }],
    ['5. Revalidar', function () { return accionRevalidarTodo({}, admin).resumen; }],
    ['6. Emitir codigos', function () {
      var c = accionAsignarCodigos({}, admin);
      return { asignados: c.asignados, sin_cupo: c.sin_cupo, suplentes: c.suplentes, total: c.total_con_codigo };
    }],
    ['7. Carpetas de audio y pistas', function () { return rehearsalTracks(admin); }],
    ['8. Verificar videos (muestra)', function () { return verifyPendingVideos({ limit: 15 }); }],
    ['9. Cambios de horario', function () { return rehearsalScheduleChanges(admin); }],
    ['10. Retiro y suplentes', function () { return rehearsalSubstitutes(admin); }],
    ['11. Consolidar lista oficial', function () {
      var l = accionConsolidarLista({ confirmacion: 'CONSOLIDAR' }, admin);
      return l.lista ? { lista: l.lista, conteos: l.conteos } : l;
    }],
    ['12. Jornada simulada', function () { return rehearsalEventDay(admin); }],
    ['13. Tres jurados', function () { return rehearsalJury(); }],
    ['14. Descalificacion validada', function () { return rehearsalDisqualification(admin); }],
    ['15. Cerrar jornada', function () { return accionCerrarJornada({}, admin).cerrados; }],
    ['16. Resultados', function () {
      var r = accionResultados({}, admin);
      return { top10: r.top.map(function (t) { return t.code + ' ' + scoreText(t.artist_final); }),
               top20: r.top20.length, empates: r.cortes.map(function (c) { return c.cut; }) };
    }],
    ['17. Respaldo', function () { return accionRespaldar({ etiqueta: 'ENSAYO' }, admin).xlsx.nombre; }]
  ];

  for (var i = 0; i < phases.length; i++) {
    var name = phases[i][0];
    if (state.done.indexOf(name) !== -1) continue;
    if (Date.now() - started > REHEARSAL_BUDGET_MS) {
      scheduleRehearsalContinuation();
      console.log('ENSAYO en pausa por tiempo. Continua solo en 1 minuto (o ejecuta ENSAYO otra vez).');
      return { en_curso: true, hechas: state.done.length, total: phases.length };
    }
    var result = phases[i][1]();
    if (result && result.pausa) {
      scheduleRehearsalContinuation();
      console.log(name + ': en pausa por tiempo, faltan ' + result.pendientes + '. Continúa solo en 1 minuto.');
      return { en_curso: true, hechas: state.done.length, total: phases.length, fase: name, pendientes: result.pendientes };
    }
    state.done.push(name);
    state.report.push({ paso: name, resultado: result });
    props.setProperty(REHEARSAL_STATE_KEY, JSON.stringify(state).slice(0, 8500));
    console.log(name + ': ' + JSON.stringify(result));
  }

  props.deleteProperty(REHEARSAL_STATE_KEY);
  removeRehearsalTriggers();
  console.log('\n=== ENSAYO INTEGRAL COMPLETO ===');
  return { completo: true, informe: state.report };
}

function ENSAYO_CONTINUAR() {
  removeRehearsalTriggers();
  return ensayoIntegral();
}

function scheduleRehearsalContinuation() {
  removeRehearsalTriggers();
  ScriptApp.newTrigger('ENSAYO_CONTINUAR').timeBased().after(60 * 1000).create();
}

function removeRehearsalTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'ENSAYO_CONTINUAR') ScriptApp.deleteTrigger(t);
  });
}

/** Forgets rehearsal progress (used by LIMPIAR so the next ENSAYO starts over). */
function resetRehearsalState() {
  PropertiesService.getScriptProperties().deleteProperty(REHEARSAL_STATE_KEY);
  removeRehearsalTriggers();
}

/** The operator confirms the seeded repeated group IS the same project. */
function rehearsalResolveRepeatedGroup(admin) {
  var pending = leerHoja(HOJA.REGISTRO).filter(function (r) {
    return normalizarComparable(r.group_match_status) === 'POSIBLE_REPETIDA';
  });
  return pending.map(function (r) {
    var res = accionResolverCoincidenciaGrupo({ submission_id: r.submission_id, decision: 'MISMO',
      motivo: 'Ensayo: mismo proyecto inscrito dos veces con distinta escritura' }, admin);
    return r.submission_id + ' -> ' + (res.eligibility_status || res.error);
  });
}

/** Creates the audio folders and uploads a fake track for a few projects. */
function rehearsalTracks(admin) {
  var folders = accionPrepararCarpetasAudio({}, admin);
  var withTrack = leerHoja(HOJA.REGISTRO).filter(function (r) {
    return r.code && esVerdadero(r.track_uses);
  }).slice(0, 5);
  var uploads = withTrack.map(function (r) {
    var res = accionSubirPista({
      id_number: String(r.id_number), code: r.code, song_name: r.song_name,
      file_name: 'mi pista.mp3', file_base64: buildTestTrackBase64(),
      client_submission_id: 'SEED-TRACK-' + r.code, form_elapsed_ms: 60000, source: 'seed'
    });
    return r.code + ': ' + (res.track_file_name || res.error);
  });
  if (withTrack.length) {
    accionMarcarPista({ code: withTrack[0].code, track_status: TRACK_STATUS.VALIDADA, nota: 'Ensayo' }, admin);
  }
  if (withTrack.length > 1) {
    accionMarcarPista({ code: withTrack[1].code, track_status: TRACK_STATUS.PROBLEMA, nota: 'Ensayo: archivo cortado' }, admin);
  }
  return { carpetas: folders.creadas + folders.existentes, subidas: uploads };
}

/** One approved and one rejected Form-2 request, plus a refused second request. */
function rehearsalScheduleChanges(admin) {
  var coded = leerHoja(HOJA.REGISTRO).filter(function (r) { return r.code; });
  if (coded.length < 3) return 'sin codigos suficientes';
  var a = coded[1], b = coded[2];
  var r1 = accionSolicitarCambio({ participant_code: a.code, full_name: a.full_name, can_attend_original: false,
    reason_short: 'Ensayo: examen', contact: 'whatsapp', acceptance: true, client_submission_id: 'SEED-CB-1' });
  var r2 = accionSolicitarCambio({ participant_code: b.code, full_name: b.full_name, can_attend_original: false,
    reason_short: 'Ensayo: trabajo', contact: 'whatsapp', acceptance: true, client_submission_id: 'SEED-CB-2' });
  var again = accionSolicitarCambio({ participant_code: a.code, full_name: a.full_name, can_attend_original: false,
    reason_short: 'Ensayo: segunda vez', contact: 'whatsapp', acceptance: true, client_submission_id: 'SEED-CB-3' });
  // Free a seat in block 10 so the approval has somewhere to go.
  accionRegistrarEstado({ code: coded[coded.length - 1].code, estado: ESTADO.NO_SHOW }, admin);
  var ap = accionResolverCambio({ solicitud_id: r1.solicitud_id, aprobar: true, nuevo_bloque: 10 }, admin);
  var rj = accionResolverCambio({ solicitud_id: r2.solicitud_id, aprobar: false, observacion: 'Ensayo: sin cupo' }, admin);
  return { aprobado: ap.estado || ap.error, rechazado: rj.estado || rj.error, segunda_solicitud: again.motivo || again.error };
}

/**
 * The day: most projects go CHECK-IN -> PRECOLA -> EN AUDICION -> REALIZADA
 * through the real action; some are no-shows, some arrive late and drop to
 * contingency. The first dozen go through the real per-row action (so the
 * state machine and timestamps are exercised); the rest in one batch write.
 */
function rehearsalEventDay(admin) {
  var coded = leerHoja(HOJA.REGISTRO).filter(function (r) { return r.code; });
  var counts = { realizadas: 0, no_show: 0, contingencia: 0 };
  var batch = [];
  coded.forEach(function (r, idx) {
    var current = normalizarEstado(r.attendance_status || ESTADO.CONFIRMADO);
    if (current !== ESTADO.CONFIRMADO) return;
    var target = idx % 17 === 0 ? ESTADO.NO_SHOW : (idx % 23 === 0 ? ESTADO.CONTINGENCIA : ESTADO.REALIZADA);
    if (idx < 12) {
      if (target === ESTADO.REALIZADA) {
        [ESTADO.CHECK_IN, ESTADO.PRECOLA, ESTADO.EN_AUDICION, ESTADO.REALIZADA].forEach(function (s) {
          accionRegistrarEstado({ code: r.code, estado: s, client_op_id: 'SEED-' + r.code + '-' + s }, admin);
        });
      } else {
        accionRegistrarEstado({ code: r.code, estado: target }, admin);
      }
    } else {
      var changes = { attendance_status: target, operador_check_in: 'ensayo' };
      if (target === ESTADO.REALIZADA) {
        changes.audition_status = ESTADO.REALIZADA;
        changes.check_in_time = ahoraISO(); changes.done_at = ahoraISO();
      }
      if (target === ESTADO.NO_SHOW) changes.audition_status = ESTADO.NO_SHOW;
      if (target === ESTADO.CONTINGENCIA) changes.contingencia_desde = ahoraISO();
      batch.push({ fila: r._fila, cambios: changes });
    }
    if (target === ESTADO.REALIZADA) counts.realizadas++;
    else if (target === ESTADO.NO_SHOW) counts.no_show++;
    else counts.contingencia++;
  });
  actualizarFilasEnLote(HOJA.REGISTRO, batch);
  var plan = accionPlanContingencia({ ahora: '20:30' });
  counts.contingencia_entran = plan.entran.length;
  return counts;
}

/**
 * Three jurors score every performed audition with the official rubric (1-5 per category) and
 * submit. One card is left as an incomplete draft on purpose (that project lacks 3 jurors), and
 * one juror reports a disqualification.
 */
function rehearsalJury() {
  var azar = seudoAleatorio(777);
  var rubric = activeRubricCategories();
  var version = activeRubric().version;
  var fingerprint = activeRubric().fingerprint;
  var performed = leerHoja(HOJA.REGISTRO).filter(function (r) {
    return normalizarEstado(r.audition_status) === ESTADO.REALIZADA;
  });
  [1, 2, 3].forEach(function (n) {
    var rows = [];
    performed.forEach(function (r, idx) {
      var scores = {};
      rubric.forEach(function (c) { scores[c.id] = 1 + Math.floor(azar() * 5); });
      var draft = n === 3 && idx === 0;
      if (draft) scores[rubric[rubric.length - 1].id] = '';
      var calc = calcularPuntajeJurado(scores, rubric);
      var row = { code: r.code, artistic_name: r.artistic_name, discipline: projectGenre(r),
                  presentation_format: r.presentation_format || '', rubric_version: version, rubric_fingerprint: fingerprint,
                  total: calc.valido ? calc.total : '', desempate: calc.valido ? calc.desempate : '',
                  estado: draft ? EVALUATION_STATE.BORRADOR : EVALUATION_STATE.ENVIADA,
                  observaciones: 'Ensayo integral', dq_flag: n === 2 && idx === 1 ? 'TRUE' : 'FALSE',
                  dq_causa: n === 2 && idx === 1 ? 'PLAYBACK' : '', dq_nota: n === 2 && idx === 1 ? 'Ensayo: playback no avisado' : '',
                  evaluado_at: ahoraISO(), enviado_at: draft ? '' : ahoraISO(), evaluado_by: 'jurado-' + n };
      rubric.forEach(function (c) { row[c.id] = scores[c.id]; });
      rows.push(row);
    });
    limpiarDatos('JURADO_' + n);
    agregarFilas('JURADO_' + n, rows);
  });
  if (performed[1]) {
    conBloqueo(function () {
      reportDisqualification(performed[1], 'PLAYBACK', 'Ensayo: playback no avisado', { alias: 'jurado-2', rol: ROL.JURADO });
    });
  }
  return { jurados: 3, tarjetas_por_jurado: performed.length, borradores: performed.length ? 1 : 0 };
}

/** Direction validates the rehearsal's disqualification report: that project leaves the ranking. */
function rehearsalDisqualification(admin) {
  var pending = leerHoja(HOJA.DESCALIFICACIONES).filter(function (d) { return normalizarComparable(d.estado) === DQ_STATUS.PENDIENTE; });
  return pending.map(function (d) {
    var r = accionResolverDescalificacion({ dq_id: d.dq_id, decision: DQ_STATUS.VALIDADA, motivo: 'Ensayo: causal verificada por direccion' }, admin);
    return d.code + ' -> ' + (r.estado || r.error);
  });
}

/**
 * The week-before contingency: logistics withdraws B-037; the slot is offered to the first
 * substitute, who turns it down; the next one accepts and inherits B-037 with its schedule.
 * B-036 and B-038 must not move.
 */
function rehearsalSubstitutes(admin) {
  var before = leerHoja(HOJA.REGISTRO);
  var neighbours = function (rows) {
    return ['B-036', 'B-038'].map(function (c) {
      var r = rows.filter(function (x) { return x.code === c; })[0];
      return r ? c + '@' + clockText(r.final_time || r.original_time) + '=' + r.submission_id : c + ':-';
    }).join(' ');
  };
  var neighboursBefore = neighbours(before);
  var withdrawn = accionRetirarParticipante({ code: 'B-037', motivo: 'Ensayo: avisa que no puede asistir' }, admin);
  if (withdrawn.ok === false) return { error: withdrawn.error };
  var steps = [withdrawn.mensaje];
  for (var i = 0; i < 2; i++) {
    var offer = leerHoja(HOJA.OFERTAS).filter(function (o) { return normalizarComparable(o.estado) === OFFER_STATUS.PENDIENTE; })[0];
    if (!offer) break;
    var sub = leerHoja(HOJA.REGISTRO).filter(function (r) { return r.submission_id === offer.submission_id; })[0];
    var answer = accionResponderOferta({ id_number: sub.id_number, submission_id: sub.submission_id, oferta_id: offer.oferta_id,
                                         respuesta: i === 0 ? 'RECHAZAR' : 'ACEPTAR', source: 'seed', form_elapsed_ms: 60000 });
    steps.push(offer.slot_code + ' -> ' + sub.submission_id + ': ' + (answer.mensaje || answer.error));
  }
  var holder = buscarPorCodigo('B-037');
  return { pasos: steps, nuevo_titular: holder ? holder.submission_id : '(vacante)',
           vecinos_intactos: neighbours(leerHoja(HOJA.REGISTRO)) === neighboursBefore };
}
