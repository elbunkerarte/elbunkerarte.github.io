/**
 * EL BUNKER - archivo unico de despliegue (GENERADO, no editar a mano).
 *
 * Fuente: apps-script/ en el repositorio. Regenerar con:
 *     node tools/empaquetar.js
 *
 * Generado: 2026-09-17T14:39:13.055Z
 * Modulos: 20 .gs + 10 .html
 */

/** Pantallas HTML. Las lee hayRegistroPlantillas() en 20_web.gs. */
var PLANTILLAS = {
  "ui_403": "<!DOCTYPE html>\n<html lang=\"es\">\n<head><base target=\"_top\"><meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n<?!= incluir('ui_estilos') ?></head>\n<body>\n<div class=\"envoltura\">\n  <header class=\"cabecera\">\n    <div class=\"marca\"><h1>EL <span>BÚNKER</span></h1><div class=\"sub\">Acceso restringido</div></div>\n  </header>\n  <div class=\"aviso error\">\n    <b>No tienes acceso a esta sección</b>\n    Esta área es interna. Usa el enlace personal que te entregó la coordinación.\n  </div>\n  <div class=\"tarjeta\">\n    <h2>¿Qué hago?</h2>\n    <p class=\"pista\" style=\"margin:0\">\n      Motivo técnico: <code><?= motivo ?></code><br><br>\n      • Si eres <b>participante</b>, esta no es tu página: usa el enlace público de la convocatoria.<br>\n      • Si eres del <b>equipo</b>, pide a coordinación que te reenvíe tu enlace de acceso: los enlaces\n      caducan y se revocan si tu usuario queda inactivo.\n    </p>\n  </div>\n</div>\n<script>window.ENTORNO = '<?= ENTORNO ?>';</script>\n</body>\n</html>\n",
  "ui_admin": "<!DOCTYPE html>\n<html lang=\"es\">\n<head><base target=\"_top\"><meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n<?!= incluir('ui_estilos') ?></head>\n<body>\n<div class=\"envoltura ancho\">\n  <header class=\"cabecera\">\n    <div class=\"marca\"><h1>PANEL <span>BÚNKER</span></h1>\n      <div class=\"sub\"><?= alias ?> · <?= rol ?></div></div>\n    <div class=\"datos-evento\" id=\"resumenCabecera\"></div>\n  </header>\n\n  <div id=\"avisoGlobal\"></div>\n\n  <div class=\"pestanas\">\n    <button class=\"pestana activa\" data-panel=\"registro\">Inscritos</button>\n    <button class=\"pestana\" data-panel=\"codigos\">Cerrar los 100</button>\n    <button class=\"pestana\" data-panel=\"cambios\">Cambios de horario</button>\n    <button class=\"pestana\" data-panel=\"mensajes\">Comunicación</button>\n    <button class=\"pestana\" data-panel=\"herramientas\">Respaldo y herramientas</button>\n  </div>\n\n  <!-- ============================ INSCRITOS ============================ -->\n  <div class=\"panel activo\" id=\"panel-registro\">\n    <div class=\"rejilla metricas\" id=\"metricas\" style=\"margin-bottom:16px\"></div>\n    <div class=\"tarjeta\">\n      <div class=\"rejilla dos\" style=\"margin-bottom:12px\">\n        <div class=\"campo\" style=\"margin:0\">\n          <input type=\"text\" id=\"buscar\" placeholder=\"Buscar por nombre, código o documento\">\n        </div>\n        <div class=\"campo\" style=\"margin:0\">\n          <select id=\"filtro\">\n            <option value=\"TODOS\">Todos los estados</option>\n            <option value=\"APTO\">APTO</option>\n            <option value=\"REVISION\">REVISIÓN</option>\n            <option value=\"INCOMPLETO\">INCOMPLETO</option>\n            <option value=\"NO_CUMPLE\">NO CUMPLE</option>\n            <option value=\"DUPLICADO\">DUPLICADO</option>\n          </select>\n        </div>\n      </div>\n      <div class=\"tabla-envoltura\" style=\"max-height:540px;overflow-y:auto\"><table>\n        <thead><tr><th>Código</th><th>Nombre</th><th>Doc.</th><th>Edad</th><th>Sector</th>\n          <th>Disciplina</th><th>Estado</th><th>Motivo</th><th>Bloque</th><th>Acción</th></tr></thead>\n        <tbody id=\"cuerpoRegistro\"></tbody>\n      </table></div>\n      <p class=\"pista\" id=\"conteoTabla\" style=\"margin:12px 0 0\"></p>\n    </div>\n  </div>\n\n  <!-- ============================= CÓDIGOS ============================= -->\n  <div class=\"panel\" id=\"panel-codigos\">\n    <div class=\"tarjeta\">\n      <h2>Paso 1 · Revalidar todo</h2>\n      <p class=\"pista\">Vuelve a aplicar edad, residencia, formato y duplicados sobre todas las filas.\n        Úsalo tras corregir datos a mano o cambiar la configuración. No quita códigos ya emitidos.</p>\n      <button class=\"boton fantasma\" id=\"btnRevalidar\">Revalidar inscripciones</button>\n      <div id=\"salidaRevalidar\" style=\"margin-top:12px\"></div>\n    </div>\n    <div class=\"tarjeta\">\n      <h2>Paso 2 · Emitir B-001 … B-100</h2>\n      <p class=\"pista\">Asigna código, bloque y horario a los APTO, en orden de inscripción.\n        Es <b>idempotente</b>: puedes correrlo varias veces y nunca reasigna ni reutiliza un código.\n        Los duplicados y los no aptos no consumen cupo.</p>\n      <div class=\"aviso alerta\" style=\"font-size:13px\">\n        <b>Revisa antes de emitir</b>\n        Una vez emitido, el código de una persona no cambia nunca — ni siquiera si cambia de horario.\n      </div>\n      <button class=\"boton\" id=\"btnCodigos\">Emitir códigos y asignar bloques</button>\n      <div id=\"salidaCodigos\" style=\"margin-top:12px\"></div>\n    </div>\n    <div class=\"tarjeta\">\n      <h2>Ocupación por bloque</h2>\n      <button class=\"boton fantasma chico\" id=\"btnBloques\" style=\"margin-bottom:12px\">Ver ocupación</button>\n      <div id=\"salidaBloques\"></div>\n    </div>\n  </div>\n\n  <!-- ============================= CAMBIOS ============================= -->\n  <div class=\"panel\" id=\"panel-cambios\">\n    <div class=\"tarjeta\">\n      <h2>Solicitudes de cambio</h2>\n      <p class=\"pista\">El participante nunca elige la hora: la decides tú, y solo en un bloque con cupo libre.</p>\n      <button class=\"boton fantasma chico\" id=\"btnCargarCambios\" style=\"margin-bottom:12px\">Actualizar</button>\n      <div id=\"salidaCambios\"></div>\n    </div>\n  </div>\n\n  <!-- =========================== COMUNICACIÓN ========================== -->\n  <div class=\"panel\" id=\"panel-mensajes\">\n    <div class=\"tarjeta\">\n      <h2>Generar mensajes</h2>\n      <p class=\"pista\">Genera el texto exacto para cada participante. El envío por WhatsApp lo hace una\n        persona con el enlace generado; el sistema nunca escribe por ti en WhatsApp.</p>\n      <div class=\"rejilla dos\">\n        <div class=\"campo\"><label for=\"plantilla\">Plantilla</label>\n          <select id=\"plantilla\">\n            <option value=\"RECEPCION\">1. Recepción de inscripción</option>\n            <option value=\"ASIGNACION\">2. Asignación de código y horario</option>\n            <option value=\"CAMBIO_APROBADO\">3. Cambio aprobado</option>\n            <option value=\"CAMBIO_RECHAZADO\">4. Cambio no aprobado</option>\n            <option value=\"RECORDATORIO_24H\">5. Recordatorio 24 h</option>\n            <option value=\"RECORDATORIO_DIA\">6. Recordatorio del día</option>\n            <option value=\"CONTINGENCIA\">7. Contingencia / no show</option>\n          </select></div>\n        <div class=\"campo\"><label for=\"filtroBloqueMsg\">Filtrar por bloque (opcional)</label>\n          <input type=\"number\" id=\"filtroBloqueMsg\" min=\"1\" max=\"10\" placeholder=\"Todos\"></div>\n      </div>\n      <div class=\"rejilla dos\">\n        <button class=\"boton fantasma\" id=\"btnGenerar\">Generar textos</button>\n        <button class=\"boton\" id=\"btnCorreos\">Enviar por correo</button>\n      </div>\n      <div class=\"aviso alerta\" style=\"font-size:13px;margin-top:12px\">\n        <b>Cuota de correo</b>\n        Una cuenta Gmail normal envía ~100 correos al día. Con 100 participantes, envía por bloques\n        o usa WhatsApp como canal principal (es lo que recomienda el plan).\n      </div>\n      <div id=\"salidaMensajes\" style=\"margin-top:12px\"></div>\n    </div>\n  </div>\n\n  <!-- =========================== HERRAMIENTAS ========================== -->\n  <div class=\"panel\" id=\"panel-herramientas\">\n    <div class=\"tarjeta\">\n      <h2>Respaldo</h2>\n      <p class=\"pista\">Genera un XLSX + un JSON en Drive. Hazlo antes del evento y al cerrar la jornada.</p>\n      <div class=\"rejilla dos\">\n        <button class=\"boton fantasma\" id=\"btnExportar\">Exportar XLSX</button>\n        <button class=\"boton\" id=\"btnRespaldar\">Respaldo completo</button>\n      </div>\n      <div id=\"salidaRespaldo\" style=\"margin-top:12px\"></div>\n    </div>\n    <div class=\"tarjeta\">\n      <h2>Vistas y cierre</h2>\n      <p class=\"pista\">AGENDA, CHECK-IN, RESULTADOS y DASHBOARD se reconstruyen desde REGISTRO.</p>\n      <div class=\"rejilla dos\">\n        <button class=\"boton fantasma\" id=\"btnVistas\">Refrescar vistas</button>\n        <button class=\"boton peligro\" id=\"btnCerrar\">Cerrar jornada (21:30)</button>\n      </div>\n      <div id=\"salidaVistas\" style=\"margin-top:12px\"></div>\n    </div>\n    <div class=\"tarjeta\" id=\"tarjetaUsuarios\">\n      <h2>Accesos del equipo</h2>\n      <p class=\"pista\">Cada persona recibe su propio enlace. No se comparten entre roles.</p>\n      <div class=\"rejilla dos\">\n        <div class=\"campo\"><label for=\"nuevoAlias\">Alias</label>\n          <input type=\"text\" id=\"nuevoAlias\" placeholder=\"checkin-3\"></div>\n        <div class=\"campo\"><label for=\"nuevoRol\">Rol</label>\n          <select id=\"nuevoRol\">\n            <option value=\"logistica\">logistica</option><option value=\"checkin\">checkin</option>\n            <option value=\"jurado\">jurado</option><option value=\"direccion\">direccion</option>\n            <option value=\"admin\">admin</option>\n          </select></div>\n      </div>\n      <div class=\"campo\"><label for=\"nuevaNota\">Nota (para jurados escribe \"jurado 1\", \"jurado 2\" o \"jurado 3\")</label>\n        <input type=\"text\" id=\"nuevaNota\" placeholder=\"jurado 1\"></div>\n      <button class=\"boton fantasma\" id=\"btnUsuario\">Crear acceso</button>\n      <div id=\"salidaUsuario\" style=\"margin-top:12px\"></div>\n    </div>\n  </div>\n</div>\n\n<?!= incluir('ui_scripts') ?>\n<script>\nwindow.ENTORNO = '<?= ENTORNO ?>';\nwindow.TOKEN = '<?= token ?>';\nvar ROL = '<?= rol ?>';\n\ndocument.addEventListener('DOMContentLoaded', function () {\n  if (ROL !== 'admin') $('#tarjetaUsuarios').classList.add('oculto');\n\n  $$('.pestana').forEach(function (p) {\n    p.addEventListener('click', function () {\n      $$('.pestana').forEach(function (x) { x.classList.remove('activa'); });\n      $$('.panel').forEach(function (x) { x.classList.remove('activo'); });\n      p.classList.add('activa');\n      $('#panel-' + p.dataset.panel).classList.add('activo');\n      if (p.dataset.panel === 'cambios') cargarCambios();\n    });\n  });\n\n  cargarRegistro();\n  $('#buscar').addEventListener('input', debounce(cargarRegistro, 350));\n  $('#filtro').addEventListener('change', cargarRegistro);\n  $('#btnRevalidar').addEventListener('click', revalidar);\n  $('#btnCodigos').addEventListener('click', emitirCodigos);\n  $('#btnBloques').addEventListener('click', verBloques);\n  $('#btnCargarCambios').addEventListener('click', cargarCambios);\n  $('#btnGenerar').addEventListener('click', generarMensajes);\n  $('#btnCorreos').addEventListener('click', enviarCorreos);\n  $('#btnExportar').addEventListener('click', function () { respaldo('exportar', 'XLSX generado'); });\n  $('#btnRespaldar').addEventListener('click', function () { respaldo('respaldar', 'Respaldo completo generado'); });\n  $('#btnVistas').addEventListener('click', refrescarVistas);\n  $('#btnCerrar').addEventListener('click', cerrarJornada);\n  $('#btnUsuario').addEventListener('click', crearUsuario);\n});\n\nfunction debounce(fn, ms) {\n  var t; return function () { clearTimeout(t); t = setTimeout(fn, ms); };\n}\n\n// ------------------------------- registro ----------------------------------\nfunction cargarRegistro() {\n  llamar('listar_registro', { q: $('#buscar').value, filtro: $('#filtro').value })\n    .then(function (r) {\n      pintarMetricas(r.resumen);\n      $('#conteoTabla').textContent = 'Mostrando ' + r.mostrados + ' de ' + r.total + ' inscripciones.';\n      $('#cuerpoRegistro').innerHTML = r.filas.map(function (f) {\n        return '<tr>' +\n          '<td>' + (f.code ? '<b>' + escaparHtml(f.code) + '</b>' : '<span style=\"color:var(--tenue)\">—</span>') + '</td>' +\n          '<td>' + escaparHtml(f.full_name) + (f.artistic_name ? '<br><span style=\"color:var(--tenue);font-size:11.5px\">' + escaparHtml(f.artistic_name) + '</span>' : '') + '</td>' +\n          '<td>' + escaparHtml(f.id_number) + '</td>' +\n          '<td>' + escaparHtml(f.age) + '</td>' +\n          '<td>' + escaparHtml(f.neighborhood_sector) + '</td>' +\n          '<td>' + escaparHtml(f.discipline) + '</td>' +\n          '<td>' + etiquetaEstado(f.eligibility_status) + '</td>' +\n          '<td style=\"white-space:normal;max-width:210px;font-size:11.5px;color:var(--tenue)\">' +\n            escaparHtml(f.duplicate_reason || f.validation_notes || '') + '</td>' +\n          '<td>' + escaparHtml(f.final_block || f.original_block || '') + '</td>' +\n          '<td><select class=\"cambiarEstado\" data-id=\"' + escaparHtml(f.submission_id) + '\" style=\"padding:5px;font-size:12px\">' +\n            ['', 'APTO', 'REVISION', 'INCOMPLETO', 'NO_CUMPLE', 'DUPLICADO'].map(function (e) {\n              return '<option value=\"' + e + '\">' + (e || 'Cambiar a…') + '</option>';\n            }).join('') + '</select></td>' +\n        '</tr>';\n      }).join('') || '<tr><td colspan=\"10\" style=\"color:var(--tenue)\">Sin resultados.</td></tr>';\n\n      $$('.cambiarEstado').forEach(function (s) {\n        s.addEventListener('change', function () {\n          if (!s.value) return;\n          var motivo = prompt('Motivo del cambio a ' + s.value + ' (queda registrado):');\n          if (motivo === null) { s.value = ''; return; }\n          llamar('marcar_elegibilidad', { submission_id: s.dataset.id, eligibility_status: s.value, motivo: motivo })\n            .then(function () { cargarRegistro(); })\n            .catch(function (e) { mostrarAviso('#avisoGlobal', 'error', 'No se pudo cambiar', e.message); });\n        });\n      });\n    })\n    .catch(function (e) { mostrarAviso('#avisoGlobal', 'error', 'No se pudo cargar', e.message); });\n}\n\nfunction pintarMetricas(r) {\n  var m = [\n    ['Inscritos', r.total, ''], ['Únicos', r.unicos, ''],\n    ['Aptos', r.apto, 'destacada'], ['Con código', r.con_codigo, 'destacada'],\n    ['Duplicados', r.duplicado, ''], ['Revisión', r.revision, ''],\n    ['Incompletos', r.incompleto, ''], ['No cumplen', r.no_cumple, '']\n  ];\n  $('#metricas').innerHTML = m.map(function (x) {\n    return '<div class=\"metrica ' + x[2] + '\"><div class=\"n\">' + x[1] + '</div><div class=\"t\">' + x[0] + '</div></div>';\n  }).join('');\n  $('#resumenCabecera').innerHTML =\n    '<span class=\"chip\">Aptos <b>' + r.apto + '</b></span>' +\n    '<span class=\"chip\">Con código <b>' + r.con_codigo + '</b></span>' +\n    '<span class=\"chip\">Duplicados <b>' + r.duplicado + '</b></span>';\n}\n\n// -------------------------------- códigos ----------------------------------\nfunction revalidar() {\n  var b = $('#btnRevalidar'); ocupado(b, true, 'Revalidando...');\n  llamar('revalidar_todo').then(function (r) {\n    ocupado(b, false);\n    mostrarAviso('#salidaRevalidar', 'ok', r.revalidados + ' inscripciones revalidadas',\n      'Aptos: ' + r.resumen.apto + ' · Duplicados: ' + r.resumen.duplicado +\n      ' · Revisión: ' + r.resumen.revision + ' · No cumplen: ' + r.resumen.no_cumple);\n    cargarRegistro();\n  }).catch(function (e) { ocupado(b, false); mostrarAviso('#salidaRevalidar', 'error', 'Error', e.message); });\n}\n\nfunction emitirCodigos() {\n  if (!confirm('Se emitirán códigos definitivos a todos los APTO sin código.\\n\\n' +\n               'Un código emitido NO se reasigna nunca. ¿Continuar?')) return;\n  var b = $('#btnCodigos'); ocupado(b, true, 'Emitiendo...');\n  llamar('asignar_codigos').then(function (r) {\n    ocupado(b, false);\n    mostrarAviso('#salidaCodigos', 'ok', r.asignados + ' códigos nuevos emitidos',\n      'Total con código: ' + r.total_con_codigo + ' de ' + r.cupo + '. ' +\n      (r.sin_cupo ? r.sin_cupo + ' quedaron fuera por cupo lleno.' : 'No quedó nadie fuera por cupo.'));\n    cargarRegistro();\n  }).catch(function (e) { ocupado(b, false); mostrarAviso('#salidaCodigos', 'error', 'Error', e.message); });\n}\n\nfunction verBloques() {\n  var b = $('#btnBloques'); ocupado(b, true, 'Consultando...');\n  llamar('bloques_disponibles').then(function (r) {\n    ocupado(b, false);\n    $('#salidaBloques').innerHTML = '<div class=\"tabla-envoltura\"><table>' +\n      '<thead><tr><th>Bloque</th><th>Ventana</th><th>Ocupados</th><th>Cupo</th><th>Disponibles</th></tr></thead><tbody>' +\n      r.bloques.map(function (x) {\n        return '<tr><td><b>' + x.block_id + '</b></td><td>' + escaparHtml(x.ventana) + '</td>' +\n          '<td>' + x.ocupados + '</td><td>' + x.cupo + '</td>' +\n          '<td style=\"color:' + (x.disponibles ? 'var(--ok)' : 'var(--error)') + '\"><b>' + x.disponibles + '</b></td></tr>';\n      }).join('') + '</tbody></table></div>';\n  }).catch(function (e) { ocupado(b, false); mostrarAviso('#salidaBloques', 'error', 'Error', e.message); });\n}\n\n// -------------------------------- cambios ----------------------------------\nfunction cargarCambios() {\n  Promise.all([llamar('listar_cambios', { estado: 'TODOS' }), llamar('bloques_disponibles')])\n    .then(function (res) {\n      var cambios = res[0].cambios, bloques = res[1].bloques;\n      if (!cambios.length) {\n        $('#salidaCambios').innerHTML = '<div class=\"aviso info\"><b>Sin solicitudes</b>Nadie ha pedido cambio de horario.</div>';\n        return;\n      }\n      var opciones = bloques.map(function (x) {\n        return '<option value=\"' + x.block_id + '\"' + (x.disponibles ? '' : ' disabled') + '>' +\n          'Bloque ' + x.block_id + ' (' + x.ventana + ') · ' + x.disponibles + ' libres</option>';\n      }).join('');\n\n      $('#salidaCambios').innerHTML = cambios.map(function (c) {\n        var pendiente = String(c.estado).toUpperCase() === 'PENDIENTE';\n        return '<div class=\"tarjeta\" style=\"margin-bottom:12px;' +\n          (pendiente ? 'border-color:var(--alerta)' : '') + '\">' +\n          '<div style=\"display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap\">' +\n            '<div><b style=\"font-size:17px\">' + escaparHtml(c.code) + '</b> · ' + escaparHtml(c.full_name) +\n            '<div style=\"color:var(--tenue);font-size:12.5px\">Horario actual: bloque ' +\n            escaparHtml(c.original_block) + ' · ' + escaparHtml(c.original_time) +\n            ' · Solicitud ' + escaparHtml(c.solicitud_id) + '</div></div>' +\n            '<div>' + etiquetaEstado(c.estado) + '</div></div>' +\n          '<p class=\"pista\" style=\"margin:10px 0\"><b>Motivo:</b> ' + escaparHtml(c.reason_short) +\n            '<br><b>Contacto:</b> ' + escaparHtml(c.contact) + '</p>' +\n          (pendiente\n            ? '<div class=\"rejilla dos\" style=\"align-items:end\">' +\n              '<div class=\"campo\" style=\"margin:0\"><label>Nuevo bloque</label>' +\n              '<select data-destino=\"' + escaparHtml(c.solicitud_id) + '\">' + opciones + '</select></div>' +\n              '<div class=\"rejilla dos\" style=\"gap:8px\">' +\n              '<button class=\"boton chico\" data-aprobar=\"' + escaparHtml(c.solicitud_id) + '\">Aprobar</button>' +\n              '<button class=\"boton chico fantasma\" data-rechazar=\"' + escaparHtml(c.solicitud_id) + '\">Rechazar</button>' +\n              '</div></div>'\n            : '<p class=\"pista\" style=\"margin:0\">Resuelto ' + escaparHtml(c.resuelto_at) + ' por ' +\n              escaparHtml(c.resuelto_by) + (c.nueva_hora ? ' · nueva hora ' + escaparHtml(c.nueva_hora) : '') + '</p>') +\n        '</div>';\n      }).join('');\n\n      $$('[data-aprobar]').forEach(function (b) {\n        b.addEventListener('click', function () {\n          var id = b.dataset.aprobar;\n          var destino = $('[data-destino=\"' + id + '\"]').value;\n          resolver(id, true, destino);\n        });\n      });\n      $$('[data-rechazar]').forEach(function (b) {\n        b.addEventListener('click', function () { resolver(b.dataset.rechazar, false, ''); });\n      });\n    })\n    .catch(function (e) { mostrarAviso('#salidaCambios', 'error', 'Error', e.message); });\n}\n\nfunction resolver(id, aprobar, bloque) {\n  var obs = prompt(aprobar ? 'Observación (opcional):' : 'Motivo del rechazo (se comunica al participante):');\n  if (obs === null) return;\n  llamar('resolver_cambio', { solicitud_id: id, aprobar: aprobar, nuevo_bloque: bloque, observacion: obs })\n    .then(function (r) {\n      mostrarAviso('#avisoGlobal', 'ok', r.estado, r.mensaje);\n      cargarCambios(); cargarRegistro();\n    })\n    .catch(function (e) { mostrarAviso('#avisoGlobal', 'error', 'No se pudo resolver', e.message); });\n}\n\n// ------------------------------ comunicación -------------------------------\nfunction generarMensajes() {\n  var b = $('#btnGenerar'); ocupado(b, true, 'Generando...');\n  llamar('mensajes', { plantilla: $('#plantilla').value, bloque: $('#filtroBloqueMsg').value })\n    .then(function (r) {\n      ocupado(b, false);\n      $('#salidaMensajes').innerHTML =\n        '<div class=\"aviso ok\"><b>' + r.total + ' mensajes generados</b>' + escaparHtml(r.nombre) + '</div>' +\n        '<div class=\"tabla-envoltura\" style=\"max-height:420px;overflow-y:auto\"><table>' +\n        '<thead><tr><th>Código</th><th>Nombre</th><th>WhatsApp</th><th>Mensaje</th></tr></thead><tbody>' +\n        r.mensajes.map(function (m) {\n          return '<tr><td><b>' + escaparHtml(m.code) + '</b></td><td>' + escaparHtml(m.full_name) + '</td>' +\n            '<td>' + (m.whatsapp_url\n              ? '<a class=\"boton chico\" style=\"text-decoration:none\" href=\"' + escaparHtml(m.whatsapp_url) +\n                '\" target=\"_blank\" rel=\"noopener\">Abrir chat</a>'\n              : '<span style=\"color:var(--tenue)\">sin número</span>') + '</td>' +\n            '<td style=\"white-space:pre-wrap;max-width:460px;font-size:11.5px\">' + escaparHtml(m.cuerpo) + '</td></tr>';\n        }).join('') + '</tbody></table></div>';\n    })\n    .catch(function (e) { ocupado(b, false); mostrarAviso('#salidaMensajes', 'error', 'Error', e.message); });\n}\n\nfunction enviarCorreos() {\n  if (!confirm('Se enviarán correos reales a los participantes del filtro actual. ¿Continuar?')) return;\n  var b = $('#btnCorreos'); ocupado(b, true, 'Enviando...');\n  llamar('enviar_correos', { plantilla: $('#plantilla').value, bloque: $('#filtroBloqueMsg').value })\n    .then(function (r) {\n      ocupado(b, false);\n      mostrarAviso('#salidaMensajes', r.omitidos.length ? 'alerta' : 'ok',\n        r.enviados + ' correos enviados',\n        (r.omitidos.length ? r.omitidos.length + ' omitidos. ' : '') +\n        'Cuota restante hoy: ' + r.cuota_restante + '. ' + (r.nota || ''));\n    })\n    .catch(function (e) { ocupado(b, false); mostrarAviso('#salidaMensajes', 'error', 'Error', e.message); });\n}\n\n// ------------------------------ herramientas -------------------------------\nfunction respaldo(accion, titulo) {\n  var b = accion === 'exportar' ? $('#btnExportar') : $('#btnRespaldar');\n  ocupado(b, true, 'Generando...');\n  llamar(accion).then(function (r) {\n    ocupado(b, false);\n    var x = r.xlsx || r;\n    $('#salidaRespaldo').innerHTML = '<div class=\"aviso ok\"><b>' + titulo + '</b>' +\n      '<a href=\"' + escaparHtml(x.url) + '\" target=\"_blank\" rel=\"noopener\">' + escaparHtml(x.nombre) + '</a>' +\n      (r.json ? ' · <a href=\"' + escaparHtml(r.json.url) + '\" target=\"_blank\" rel=\"noopener\">' +\n        escaparHtml(r.json.nombre) + '</a>' : '') +\n      (r.carpeta ? '<br><a href=\"' + escaparHtml(r.carpeta) + '\" target=\"_blank\" rel=\"noopener\">Abrir carpeta de respaldos</a>' : '') +\n      '</div>';\n  }).catch(function (e) { ocupado(b, false); mostrarAviso('#salidaRespaldo', 'error', 'Error', e.message); });\n}\n\nfunction refrescarVistas() {\n  var b = $('#btnVistas'); ocupado(b, true, 'Refrescando...');\n  llamar('refrescar_vistas').then(function (r) {\n    ocupado(b, false);\n    mostrarAviso('#salidaVistas', 'ok', 'Vistas actualizadas',\n      'AGENDA ' + r.agenda + ' · CHECK-IN ' + r.check_in + ' · RESULTADOS ' + r.resultados);\n  }).catch(function (e) { ocupado(b, false); mostrarAviso('#salidaVistas', 'error', 'Error', e.message); });\n}\n\nfunction cerrarJornada() {\n  if (!confirm('CIERRE DEFINITIVO.\\n\\nTodo participante que no haya audicionado quedará NO AUDICIONADO ' +\n               'y no entrará a la selección.\\n\\n¿Confirmas que ya son las 21:30 y no hay más audiciones?')) return;\n  var b = $('#btnCerrar'); ocupado(b, true, 'Cerrando...');\n  llamar('cerrar_jornada').then(function (r) {\n    ocupado(b, false);\n    mostrarAviso('#salidaVistas', 'ok', 'Jornada cerrada',\n      r.cerrados + ' participantes quedaron NO AUDICIONADOS.');\n  }).catch(function (e) { ocupado(b, false); mostrarAviso('#salidaVistas', 'error', 'Error', e.message); });\n}\n\nfunction crearUsuario() {\n  var b = $('#btnUsuario'); ocupado(b, true, 'Creando...');\n  llamar('crear_usuario', { alias: $('#nuevoAlias').value, rol: $('#nuevoRol').value, nota: $('#nuevaNota').value })\n    .then(function (r) {\n      ocupado(b, false);\n      $('#salidaUsuario').innerHTML = '<div class=\"aviso ok\"><b>' + escaparHtml(r.alias) + ' (' +\n        escaparHtml(r.rol) + ')</b>Entrégale SOLO este enlace:<br>' +\n        '<input type=\"text\" readonly value=\"' + escaparHtml(r.url) + '\" style=\"margin-top:8px;font-size:12px\"></div>';\n    })\n    .catch(function (e) { ocupado(b, false); mostrarAviso('#salidaUsuario', 'error', 'Error', e.message); });\n}\n</script>\n</body>\n</html>\n",
  "ui_cambio": "<!DOCTYPE html>\n<html lang=\"es\">\n<head>\n<base target=\"_top\"><meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n<?!= incluir('ui_estilos') ?>\n</head>\n<body>\n<div class=\"envoltura\">\n  <header class=\"cabecera\">\n    <div class=\"marca\">\n      <h1>EL <span>BÚNKER</span></h1>\n      <div class=\"sub\">Solicitud de cambio de horario</div>\n    </div>\n  </header>\n\n  <div id=\"avisoGlobal\"></div>\n\n  <div class=\"aviso alerta\">\n    <b>Antes de continuar, lee esto</b>\n    Este formulario es <b>solo</b> para quien tiene un impedimento real y <b>no puede asistir</b> en su horario.\n    Tienes <b>una sola</b> solicitud. <b>No eliges la nueva hora</b>: la asigna producción según disponibilidad.\n    Mientras no te confirmen, tu horario original sigue vigente.\n  </div>\n\n  <div id=\"formulario\">\n    <div class=\"tarjeta\">\n      <h2>Tus datos</h2>\n      <div class=\"campo\">\n        <label for=\"participant_code\">Tu código <span class=\"req\">*</span></label>\n        <input type=\"text\" id=\"participant_code\" placeholder=\"B-001\" autocapitalize=\"characters\">\n        <p class=\"ayuda\">Es el código que recibiste por WhatsApp o correo. Nunca cambia.</p>\n        <div class=\"error\"></div>\n      </div>\n      <div class=\"campo\">\n        <label for=\"full_name\">Nombre completo <span class=\"req\">*</span></label>\n        <input type=\"text\" id=\"full_name\" placeholder=\"Igual que en tu inscripción\">\n        <p class=\"ayuda\">Debe coincidir exactamente con el nombre registrado para ese código.</p>\n        <div class=\"error\"></div>\n      </div>\n      <div class=\"campo\">\n        <label for=\"contact\">WhatsApp de contacto <span class=\"req\">*</span></label>\n        <input type=\"tel\" id=\"contact\" inputmode=\"numeric\" placeholder=\"3001234567\">\n        <div class=\"error\"></div>\n      </div>\n    </div>\n\n    <div class=\"tarjeta\">\n      <h2>Tu impedimento</h2>\n      <label class=\"check\" id=\"campoNoPuede\">\n        <input type=\"checkbox\" id=\"can_attend_original_no\">\n        <span>Confirmo que <b>NO puedo asistir</b> en el horario que me fue asignado.\n          <span class=\"req\">*</span></span>\n      </label>\n      <div class=\"campo\">\n        <label for=\"reason_short\">Motivo (breve) <span class=\"req\">*</span></label>\n        <textarea id=\"reason_short\" maxlength=\"400\" placeholder=\"Ej.: trabajo hasta las 8:00 p. m., cita médica, clase...\"></textarea>\n        <div class=\"error\"></div>\n      </div>\n      <label class=\"check\" id=\"campoAceptacion\">\n        <input type=\"checkbox\" id=\"acceptance\">\n        <span>Entiendo que producción asigna la nueva hora <b>según disponibilidad</b>, que la solicitud\n          puede ser <b>no aprobada</b>, y que el día del evento <b>no hay cambios</b>.\n          <span class=\"req\">*</span></span>\n      </label>\n      <button class=\"boton\" id=\"btnEnviar\" style=\"margin-top:6px\">Enviar solicitud</button>\n    </div>\n  </div>\n\n  <div id=\"resultado\" class=\"oculto\"></div>\n  <div class=\"pie\">Si ya enviaste tu solicitud, espera la respuesta. Enviar de nuevo no la acelera.</div>\n</div>\n\n<?!= incluir('ui_scripts') ?>\n<script>window.ENTORNO = '<?= ENTORNO ?>';</script>\n<script>\ndocument.addEventListener('DOMContentLoaded', function () {\n  var precargado = '<?= codigo ?>';\n  if (precargado) $('#participant_code').value = precargado;\n\n  llamar('config_publica').then(function (c) {\n    if (!c.cambios_abiertos) {\n      $('#formulario').classList.add('oculto');\n      mostrarAviso('#avisoGlobal', 'alerta', 'El plazo de cambios ya cerró',\n        'El día del evento no se hacen cambios ordinarios. Si pierdes tu turno pasas a contingencia.');\n    }\n  }).catch(function () { /* the form still works; the server re-checks */ });\n\n  $('#btnEnviar').addEventListener('click', enviar);\n});\n\nfunction enviar() {\n  $$('.campo,.check').forEach(function (c) { c.classList.remove('malo'); });\n\n  var datos = {\n    participant_code: ($('#participant_code').value || '').trim().toUpperCase(),\n    full_name: ($('#full_name').value || '').trim(),\n    contact: ($('#contact').value || '').trim(),\n    reason_short: ($('#reason_short').value || '').trim(),\n    can_attend_original: false,\n    acceptance: $('#acceptance').checked,\n    client_submission_id: idEnvio('cambio')\n  };\n\n  var faltan = [];\n  if (!datos.participant_code) faltan.push('participant_code');\n  if (!datos.full_name) faltan.push('full_name');\n  if (!datos.contact) faltan.push('contact');\n  if (!datos.reason_short) faltan.push('reason_short');\n  if (!$('#can_attend_original_no').checked) faltan.push('campoNoPuede');\n  if (!datos.acceptance) faltan.push('campoAceptacion');\n\n  if (faltan.length) {\n    faltan.forEach(function (id) {\n      var el = $('#' + id);\n      var c = el ? (el.closest('.campo') || el.closest('.check')) : $('#' + id);\n      if (c) c.classList.add('malo');\n    });\n    mostrarAviso('#avisoGlobal', 'error', 'Faltan datos', 'Completa los campos marcados.');\n    return;\n  }\n\n  var boton = $('#btnEnviar');\n  ocupado(boton, true, 'Enviando...');\n  $('#avisoGlobal').innerHTML = '';\n\n  llamar('solicitar_cambio', datos)\n    .then(function (r) {\n      $('#formulario').classList.add('oculto');\n      $('#resultado').classList.remove('oculto');\n      $('#resultado').innerHTML =\n        '<div class=\"aviso ok\"><b>Solicitud registrada</b>' + escaparHtml(r.mensaje) + '</div>' +\n        '<div class=\"tarjeta\"><h2>Número de solicitud</h2>' +\n        '<p class=\"pista\" style=\"margin:0\"><b style=\"font-size:19px\">' + escaparHtml(r.solicitud_id) +\n        '</b><br>Estado: ' + etiquetaEstado(r.estado) + '</p></div>';\n      window.scrollTo({ top: 0, behavior: 'smooth' });\n    })\n    .catch(function (e) {\n      ocupado(boton, false);\n      nuevoIdEnvio('cambio');\n      mostrarAviso('#avisoGlobal', 'error', 'No se pudo registrar', e.message);\n    });\n}\n</script>\n</body>\n</html>\n",
  "ui_checkin": "<!DOCTYPE html>\n<html lang=\"es\">\n<head><base target=\"_top\"><meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n<?!= incluir('ui_estilos') ?></head>\n<body>\n<div class=\"envoltura ancho\">\n  <header class=\"cabecera\">\n    <div class=\"marca\">\n      <h1>CHECK-<span>IN</span></h1>\n      <div class=\"sub\">EL BÚNKER · <?= alias ?></div>\n    </div>\n    <div class=\"datos-evento\" id=\"estadoSync\"></div>\n  </header>\n\n  <div id=\"avisoGlobal\"></div>\n\n  <div class=\"tarjeta\">\n    <h2>Buscar participante</h2>\n    <p class=\"pista\">Por código (B-001) o por número de documento. Siempre valida con el documento físico.</p>\n    <div class=\"campo\" style=\"margin-bottom:10px\">\n      <input type=\"text\" id=\"busqueda\" placeholder=\"B-001 o 1036448960\" autocomplete=\"off\"\n             autocapitalize=\"characters\" style=\"font-size:20px;padding:15px;text-align:center;letter-spacing:.05em\">\n    </div>\n    <div class=\"rejilla dos\">\n      <button class=\"boton fantasma\" id=\"btnLimpiar\">Limpiar</button>\n      <button class=\"boton\" id=\"btnBuscar\">Buscar</button>\n    </div>\n  </div>\n\n  <div id=\"ficha\"></div>\n\n  <div class=\"tarjeta\">\n    <div class=\"pestanas\">\n      <button class=\"pestana activa\" data-panel=\"lista\">Lista por bloque</button>\n      <button class=\"pestana\" data-panel=\"contingencia\">Contingencia</button>\n      <button class=\"pestana\" data-panel=\"cola\">Pendientes de sincronizar (<span id=\"nCola\">0</span>)</button>\n    </div>\n\n    <div class=\"panel activo\" id=\"panel-lista\">\n      <div class=\"campo\" style=\"margin-bottom:12px\">\n        <select id=\"filtroBloque\"><option value=\"\">Todos los bloques</option></select>\n      </div>\n      <div class=\"tabla-envoltura\"><table>\n        <thead><tr><th>Código</th><th>Artista</th><th>Bloque</th><th>Llegada</th><th>Audición</th><th>Estado</th><th></th></tr></thead>\n        <tbody id=\"cuerpoLista\"></tbody>\n      </table></div>\n    </div>\n\n    <div class=\"panel\" id=\"panel-contingencia\">\n      <p class=\"pista\">Orden de llegada a la lista. Solo alcanzan quienes quepan en el tiempo que queda antes del cierre.</p>\n      <button class=\"boton fantasma chico\" id=\"btnPlan\" style=\"margin-bottom:12px\">Calcular plan ahora</button>\n      <div id=\"salidaContingencia\"></div>\n    </div>\n\n    <div class=\"panel\" id=\"panel-cola\">\n      <p class=\"pista\">Operaciones guardadas en este dispositivo que aún no llegaron al servidor.</p>\n      <button class=\"boton chico\" id=\"btnSincronizar\" style=\"margin-bottom:12px\">Sincronizar ahora</button>\n      <div id=\"salidaCola\"></div>\n    </div>\n  </div>\n\n  <div class=\"pie\">Datos en caché de este dispositivo. Cierre definitivo de audiciones: <b id=\"horaCierre\">21:30</b>.</div>\n</div>\n\n<?!= incluir('ui_scripts') ?>\n<script>\nwindow.ENTORNO = '<?= ENTORNO ?>';\nwindow.TOKEN = '<?= token ?>';\n\nvar CLAVE_ROSTER = 'bunker_roster_v1';\nvar CLAVE_COLA   = 'bunker_cola_v1';\nvar ROSTER = [];\nvar COLA = [];\n\ndocument.addEventListener('DOMContentLoaded', function () {\n  COLA = leerLocal(CLAVE_COLA, []);\n  ROSTER = leerLocal(CLAVE_ROSTER, []);\n  pintarCola();\n  if (ROSTER.length) { pintarLista(); marcarSync('cache', ROSTER.length + ' en caché local'); }\n\n  vigilarConexion(function () { sincronizar(true); });\n\n  descargarRoster();\n  setInterval(function () { if (navigator.onLine) sincronizar(true); }, 30000);\n\n  $('#btnBuscar').addEventListener('click', buscar);\n  $('#btnLimpiar').addEventListener('click', function () {\n    $('#busqueda').value = ''; $('#ficha').innerHTML = ''; $('#busqueda').focus();\n  });\n  $('#busqueda').addEventListener('keydown', function (ev) { if (ev.key === 'Enter') buscar(); });\n  $('#btnSincronizar').addEventListener('click', function () { sincronizar(false); });\n  $('#btnPlan').addEventListener('click', calcularContingencia);\n  $('#filtroBloque').addEventListener('change', pintarLista);\n\n  $$('.pestana').forEach(function (p) {\n    p.addEventListener('click', function () {\n      $$('.pestana').forEach(function (x) { x.classList.remove('activa'); });\n      $$('.panel').forEach(function (x) { x.classList.remove('activo'); });\n      p.classList.add('activa');\n      $('#panel-' + p.dataset.panel).classList.add('activo');\n    });\n  });\n  $('#busqueda').focus();\n});\n\n// --- local storage -----------------------------------------------------------\nfunction leerLocal(k, pd) { try { return JSON.parse(localStorage.getItem(k)) || pd; } catch (e) { return pd; } }\nfunction guardarLocal(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* full */ } }\n\nfunction marcarSync(tipo, texto) {\n  var color = { ok: 'var(--ok)', cache: 'var(--alerta)', error: 'var(--error)' }[tipo] || 'var(--tenue)';\n  $('#estadoSync').innerHTML = '<span class=\"chip\" style=\"border-color:' + color + '\">' +\n    escaparHtml(texto) + '</span>';\n}\n\n// --- roster ------------------------------------------------------------------\nfunction descargarRoster() {\n  if (!navigator.onLine) { marcarSync('cache', 'Sin conexión · usando caché'); return; }\n  llamar('roster_checkin').then(function (r) {\n    ROSTER = r.roster;\n    guardarLocal(CLAVE_ROSTER, ROSTER);\n    aplicarColaSobreRoster();\n    pintarLista();\n    llenarBloques();\n    marcarSync('ok', ROSTER.length + ' participantes · ' + r.generado_at.slice(11, 16));\n  }).catch(function (e) {\n    marcarSync('error', 'No se pudo actualizar · usando caché');\n    if (!ROSTER.length) mostrarAviso('#avisoGlobal', 'error', 'Sin datos locales', e.message);\n  });\n}\n\n/** Queued operations win over the server copy until they are confirmed. */\nfunction aplicarColaSobreRoster() {\n  COLA.forEach(function (op) {\n    var p = ROSTER.filter(function (x) { return x.code === op.code; })[0];\n    if (p) p.attendance_status = op.estado;\n  });\n}\n\nfunction llenarBloques() {\n  var sel = $('#filtroBloque');\n  var previo = sel.value;\n  var bloques = {};\n  ROSTER.forEach(function (p) { if (p.final_block) bloques[p.final_block] = true; });\n  sel.innerHTML = '<option value=\"\">Todos los bloques</option>' +\n    Object.keys(bloques).sort(function (a, b) { return a - b; })\n      .map(function (b) { return '<option value=\"' + b + '\">Bloque ' + b + '</option>'; }).join('');\n  sel.value = previo;\n}\n\n// --- search ------------------------------------------------------------------\nfunction buscar() {\n  var q = ($('#busqueda').value || '').trim().toUpperCase();\n  if (!q) return;\n\n  var soloDigitos = q.replace(/\\D/g, '');\n  var p = ROSTER.filter(function (x) {\n    return x.code.toUpperCase() === q ||\n           (soloDigitos && String(x.id_number).replace(/\\D/g, '') === soloDigitos);\n  })[0];\n\n  if (!p) {\n    $('#ficha').innerHTML = '<div class=\"aviso error\"><b>No encontrado</b>' +\n      'Ningún participante con código o documento \"' + escaparHtml(q) + '\". ' +\n      'Verifica el dato o consulta con coordinación.</div>';\n    return;\n  }\n  pintarFicha(p);\n}\n\nfunction pintarFicha(p) {\n  var ahora = new Date();\n  var hhmm = ('0' + ahora.getHours()).slice(-2) + ':' + ('0' + ahora.getMinutes()).slice(-2);\n  var retraso = minutos(hhmm) - minutos(p.final_time);\n  var avisoHora = '';\n\n  if (isFinite(retraso) && p.attendance_status === 'CONFIRMADO') {\n    if (retraso > 5) {\n      avisoHora = '<div class=\"aviso error\"><b>' + retraso + ' minutos tarde</b>' +\n        'Supera la tolerancia de 5 minutos: pierde el turno y pasa a CONTINGENCIA. ' +\n        'Nunca se desplaza a quien llegó puntual.</div>';\n    } else if (retraso > 0) {\n      avisoHora = '<div class=\"aviso alerta\"><b>' + retraso + ' minutos tarde</b>' +\n        'Dentro de la tolerancia. Conserva el turno SOLO si no altera el flujo — lo decide el coordinador.</div>';\n    }\n  }\n\n  $('#ficha').innerHTML =\n    '<div class=\"tarjeta\" style=\"border-color:var(--amarillo)\">' +\n      '<div style=\"display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap\">' +\n        '<div><div style=\"font-size:31px;font-weight:900;letter-spacing:.04em\">' + escaparHtml(p.code) + '</div>' +\n        '<div style=\"font-size:17px;font-weight:700;margin-top:3px\">' + escaparHtml(p.artistic_name || p.full_name) + '</div>' +\n        '<div style=\"color:var(--tenue);font-size:13.5px\">' + escaparHtml(p.full_name) + ' · ' + escaparHtml(p.discipline) + '</div></div>' +\n        '<div style=\"text-align:right\">' + etiquetaEstado(p.attendance_status) +\n        '<div style=\"color:var(--tenue);font-size:12.5px;margin-top:6px\">Bloque ' + escaparHtml(p.final_block) +\n        '<br>Llegada ' + escaparHtml(p.arrival_time) + ' · Audición <b>' + escaparHtml(p.final_time) + '</b></div></div>' +\n      '</div>' +\n      '<div class=\"aviso info\" style=\"margin-top:14px;font-size:13px\">' +\n        '<b>Valida con el documento físico</b>Documento registrado: <b>' + escaparHtml(p.id_number) + '</b>' +\n        (p.technical_needs && p.technical_needs !== 'Ninguna'\n          ? '<br>Necesidades técnicas: ' + escaparHtml(p.technical_needs) : '') +\n      '</div>' + avisoHora +\n      '<div class=\"rejilla dos\" style=\"margin-top:8px\">' +\n        boton(p.code, 'CHECK-IN', 'boton', 'Confirmar CHECK-IN') +\n        boton(p.code, 'REALIZADA', 'boton fantasma', 'Audición REALIZADA') +\n        boton(p.code, 'CONTINGENCIA', 'boton fantasma', 'Pasar a CONTINGENCIA') +\n        boton(p.code, 'NO SHOW', 'boton fantasma', 'Marcar NO SHOW') +\n      '</div>' +\n    '</div>';\n\n  $$('#ficha [data-estado]').forEach(function (b) {\n    b.addEventListener('click', function () { registrarEstado(b.dataset.code, b.dataset.estado); });\n  });\n}\n\nfunction boton(code, estado, clase, texto) {\n  return '<button class=\"' + clase + '\" data-code=\"' + escaparHtml(code) +\n         '\" data-estado=\"' + escaparHtml(estado) + '\">' + texto + '</button>';\n}\n\nfunction minutos(hhmm) {\n  var m = String(hhmm || '').match(/^(\\d{1,2}):(\\d{2})/);\n  return m ? (+m[1]) * 60 + (+m[2]) : NaN;\n}\n\n// --- state changes (offline-first) -------------------------------------------\nfunction registrarEstado(code, estado) {\n  var op = {\n    accion: 'registrar_estado', code: code, estado: estado,\n    client_op_id: 'OP' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),\n    check_in_time: new Date().toISOString()\n  };\n\n  // Optimistic local update: the desk must never wait for the network.\n  var p = ROSTER.filter(function (x) { return x.code === code; })[0];\n  if (p) { p.attendance_status = estado; guardarLocal(CLAVE_ROSTER, ROSTER); pintarFicha(p); }\n\n  COLA.push(op);\n  guardarLocal(CLAVE_COLA, COLA);\n  pintarCola();\n  pintarLista();\n\n  if (navigator.onLine) sincronizar(true);\n}\n\nfunction sincronizar(silencioso) {\n  if (!COLA.length) { if (!silencioso) mostrarAviso('#salidaCola', 'ok', 'Nada pendiente', ''); return; }\n  if (!navigator.onLine) { if (!silencioso) mostrarAviso('#salidaCola', 'error', 'Sin conexión', 'Se reintenta solo.'); return; }\n\n  var enviando = COLA.slice();\n  llamar('sincronizar_cola', { cola: JSON.stringify(enviando) })\n    .then(function (r) {\n      var aplicadas = {};\n      (r.resultados || []).forEach(function (x) { if (x.ok !== false) aplicadas[x.client_op_id] = true; });\n      COLA = COLA.filter(function (op) { return !aplicadas[op.client_op_id]; });\n      guardarLocal(CLAVE_COLA, COLA);\n      pintarCola();\n\n      var fallidas = (r.resultados || []).filter(function (x) { return x.ok === false; });\n      if (fallidas.length) {\n        $('#salidaCola').innerHTML = '<div class=\"aviso alerta\"><b>' + fallidas.length +\n          ' operaciones rechazadas por el servidor</b>' +\n          fallidas.map(function (f) { return escaparHtml(f.error); }).join('<br>') + '</div>';\n      } else if (!silencioso) {\n        mostrarAviso('#salidaCola', 'ok', 'Sincronizado', r.procesadas + ' operaciones aplicadas.');\n      }\n      descargarRoster();\n    })\n    .catch(function (e) {\n      if (!silencioso) mostrarAviso('#salidaCola', 'error', 'No se pudo sincronizar', e.message);\n    });\n}\n\nfunction pintarCola() {\n  $('#nCola').textContent = COLA.length;\n  var barra = $('.conexion');\n  if (barra && COLA.length && navigator.onLine) {\n    barra.className = 'conexion pendiente';\n    barra.textContent = COLA.length + ' operaciones pendientes de sincronizar';\n  } else if (barra && navigator.onLine) {\n    barra.className = 'conexion';\n  }\n  $('#salidaCola').innerHTML = COLA.length\n    ? '<div class=\"tabla-envoltura\"><table><thead><tr><th>Código</th><th>Estado</th><th>Hora</th></tr></thead><tbody>' +\n      COLA.map(function (o) {\n        return '<tr><td><b>' + escaparHtml(o.code) + '</b></td><td>' + etiquetaEstado(o.estado) +\n               '</td><td>' + escaparHtml(String(o.check_in_time).slice(11, 19)) + '</td></tr>';\n      }).join('') + '</tbody></table></div>'\n    : '<div class=\"aviso ok\"><b>Todo sincronizado</b>No hay operaciones pendientes.</div>';\n}\n\nfunction pintarLista() {\n  var filtro = $('#filtroBloque').value;\n  var filas = ROSTER.filter(function (p) { return !filtro || String(p.final_block) === filtro; });\n\n  $('#cuerpoLista').innerHTML = filas.map(function (p) {\n    return '<tr><td><b>' + escaparHtml(p.code) + '</b></td>' +\n      '<td>' + escaparHtml(p.artistic_name || p.full_name) + '</td>' +\n      '<td>' + escaparHtml(p.final_block) + '</td>' +\n      '<td>' + escaparHtml(p.arrival_time) + '</td>' +\n      '<td>' + escaparHtml(p.final_time) + '</td>' +\n      '<td>' + etiquetaEstado(p.attendance_status) + '</td>' +\n      '<td><button class=\"boton chico fantasma\" data-ver=\"' + escaparHtml(p.code) + '\">Abrir</button></td></tr>';\n  }).join('') || '<tr><td colspan=\"7\" style=\"color:var(--tenue)\">Sin participantes en este filtro.</td></tr>';\n\n  $$('#cuerpoLista [data-ver]').forEach(function (b) {\n    b.addEventListener('click', function () {\n      var p = ROSTER.filter(function (x) { return x.code === b.dataset.ver; })[0];\n      if (p) { pintarFicha(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }\n    });\n  });\n}\n\nfunction calcularContingencia() {\n  var b = $('#btnPlan'); ocupado(b, true, 'Calculando...');\n  llamar('plan_contingencia', {}).then(function (r) {\n    ocupado(b, false);\n    $('#salidaContingencia').innerHTML =\n      '<div class=\"aviso ' + (r.cupos_disponibles ? 'info' : 'alerta') + '\">' +\n      '<b>' + r.cupos_disponibles + ' cupos hasta el cierre (' + escaparHtml(r.cierre) + ')</b>' +\n      r.minutos_disponibles + ' minutos disponibles · ' + r.entran.length + ' alcanzan · ' +\n      r.fuera.length + ' quedarían NO AUDICIONADOS.</div>' +\n      (r.entran.length ? '<div class=\"tabla-envoltura\"><table><thead><tr><th>#</th><th>Código</th><th>Artista</th><th>Hora estimada</th></tr></thead><tbody>' +\n        r.entran.map(function (x) {\n          return '<tr><td>' + x.orden + '</td><td><b>' + escaparHtml(x.code) + '</b></td><td>' +\n            escaparHtml(x.nombre) + '</td><td>' + escaparHtml(x.hora_estimada) + '</td></tr>';\n        }).join('') + '</tbody></table></div>' : '') +\n      (r.fuera.length ? '<p class=\"pista\" style=\"margin-top:12px\">Sin tiempo: ' +\n        r.fuera.map(function (x) { return escaparHtml(x.code); }).join(', ') + '</p>' : '');\n  }).catch(function (e) { ocupado(b, false); mostrarAviso('#salidaContingencia', 'error', 'Error', e.message); });\n}\n</script>\n</body>\n</html>\n",
  "ui_dashboard": "<!DOCTYPE html>\n<html lang=\"es\">\n<head><base target=\"_top\"><meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n<?!= incluir('ui_estilos') ?>\n<style>\n/* Charts: ONE hue for every data mark. Identity comes from the row label, never\n   from colour, so there is no categorical pair that can be confused - which is\n   what the palette validator flagged when states were colour-coded.\n   Mark colour #ffd400 measures 12.4:1 against the chart surface. */\n.viz{--marca:#ffd400;--pista:#232935;--tinta:#eef1f5;--tinta2:#98a2b3}\n.grafico{margin-bottom:8px}\n.grafico h3{font-size:13px;font-weight:800;margin:0 0 3px;letter-spacing:-.01em}\n.grafico .sub{color:var(--tinta2);font-size:12px;margin:0 0 14px}\n\n/* Horizontal bars: label | track+fill | value */\n.fila-barra{display:grid;grid-template-columns:minmax(96px,29%) 1fr auto;gap:11px;\n  align-items:center;padding:4px 0;border-radius:7px}\n.fila-barra:hover{background:rgba(255,255,255,.035)}\n.fila-barra .et{font-size:12.5px;color:var(--tinta);overflow:hidden;\n  text-overflow:ellipsis;white-space:nowrap}\n.fila-barra .pista{background:var(--pista);border-radius:4px;height:16px;position:relative;overflow:hidden}\n.fila-barra .relleno{background:var(--marca);height:100%;border-radius:0 4px 4px 0;\n  min-width:2px;transition:width .45s ease}\n.fila-barra .val{font-size:12.5px;font-weight:800;color:var(--tinta);\n  min-width:34px;text-align:right;font-variant-numeric:tabular-nums}\n.fila-barra .meta{font-size:11px;color:var(--tinta2);min-width:44px;text-align:right}\n\n/* Vertical histogram */\n.histo{display:flex;align-items:flex-end;gap:2px;height:150px;\n  border-bottom:1px solid var(--linea);padding-bottom:0}\n.histo .col{flex:1;display:flex;flex-direction:column;justify-content:flex-end;\n  align-items:center;height:100%;border-radius:6px 6px 0 0;padding:0 1px}\n.histo .col:hover{background:rgba(255,255,255,.04)}\n.histo .col .n{font-size:11.5px;font-weight:800;margin-bottom:5px;font-variant-numeric:tabular-nums}\n.histo .col .b{width:100%;background:var(--marca);border-radius:4px 4px 0 0;min-height:2px;\n  transition:height .45s ease}\n.histo-ejes{display:flex;gap:2px;margin-top:7px}\n.histo-ejes span{flex:1;text-align:center;font-size:10.5px;color:var(--tinta2)}\n\n.vacio{color:var(--tinta2);font-size:12.5px;padding:18px 0;text-align:center;\n  border:1px dashed var(--linea);border-radius:9px}\n.tabla-alterna{margin-top:12px;display:none}\n.tabla-alterna.visible{display:block}\n.enlace-tabla{background:none;border:none;color:var(--tinta2);font-size:11.5px;\n  cursor:pointer;text-decoration:underline;padding:6px 0;font-family:inherit}\n</style></head>\n<body>\n<div class=\"envoltura ancho viz\">\n  <header class=\"cabecera\">\n    <div class=\"marca\"><h1>DASH<span>BOARD</span></h1>\n      <div class=\"sub\">EL BÚNKER · <?= alias ?></div></div>\n    <div class=\"datos-evento\" id=\"cabeceraChips\"></div>\n  </header>\n\n  <div id=\"avisoGlobal\"></div>\n\n  <div class=\"rejilla metricas\" id=\"metricas\" style=\"margin-bottom:18px\"></div>\n\n  <div class=\"tarjeta\">\n    <h2>Avance de la jornada</h2>\n    <div id=\"avanceGlobal\"></div>\n  </div>\n\n  <div class=\"rejilla dos\" style=\"align-items:start\">\n    <div class=\"tarjeta grafico\">\n      <h3>Estado de participantes</h3>\n      <p class=\"sub\">Cada fila lleva su etiqueta: el color no distingue categorías.</p>\n      <div id=\"gEstados\"></div>\n      <button class=\"enlace-tabla\" data-tabla=\"tEstados\">Ver como tabla</button>\n      <div class=\"tabla-alterna\" id=\"tEstados\"></div>\n    </div>\n\n    <div class=\"tarjeta grafico\">\n      <h3>Avance por bloque</h3>\n      <p class=\"sub\">Barra = audiciones realizadas. Cifra gris = participantes asignados al bloque.</p>\n      <div id=\"gBloques\"></div>\n      <button class=\"enlace-tabla\" data-tabla=\"tBloques\">Ver como tabla</button>\n      <div class=\"tabla-alterna\" id=\"tBloques\"></div>\n    </div>\n  </div>\n\n  <div class=\"rejilla dos\" style=\"align-items:start\">\n    <div class=\"tarjeta grafico\">\n      <h3>Distribución de puntajes</h3>\n      <p class=\"sub\">Artistas por rango de puntaje final (0-100).</p>\n      <div id=\"gDistribucion\"></div>\n      <button class=\"enlace-tabla\" data-tabla=\"tDistribucion\">Ver como tabla</button>\n      <div class=\"tabla-alterna\" id=\"tDistribucion\"></div>\n    </div>\n\n    <div class=\"tarjeta grafico\">\n      <h3>Top <span id=\"nTop\">7</span></h3>\n      <p class=\"sub\">Promedio de los jurados válidos, sobre 100.</p>\n      <div id=\"gTop\"></div>\n      <button class=\"enlace-tabla\" data-tabla=\"tTop\">Ver como tabla</button>\n      <div class=\"tabla-alterna\" id=\"tTop\"></div>\n    </div>\n  </div>\n\n  <div class=\"tarjeta\">\n    <h2>Resultado consolidado</h2>\n    <p class=\"pista\">El ranking completo no se publica. Esta vista es interna.</p>\n    <button class=\"boton fantasma chico\" id=\"btnResultados\" style=\"margin-bottom:12px\">Calcular resultados</button>\n    <div id=\"salidaResultados\"></div>\n  </div>\n\n  <div class=\"pie\">Actualizado <span id=\"sello\">—</span> · se refresca solo cada 60 s</div>\n</div>\n\n<?!= incluir('ui_scripts') ?>\n<script>\nwindow.ENTORNO = '<?= ENTORNO ?>';\nwindow.TOKEN = '<?= token ?>';\n\ndocument.addEventListener('DOMContentLoaded', function () {\n  cargar();\n  setInterval(cargar, 60000);\n  $('#btnResultados').addEventListener('click', calcularResultados);\n  $$('.enlace-tabla').forEach(function (b) {\n    b.addEventListener('click', function () {\n      var t = $('#' + b.dataset.tabla);\n      t.classList.toggle('visible');\n      b.textContent = t.classList.contains('visible') ? 'Ocultar tabla' : 'Ver como tabla';\n    });\n  });\n});\n\nfunction cargar() {\n  llamar('dashboard').then(function (r) { pintar(r.metricas); })\n    .catch(function (e) { mostrarAviso('#avisoGlobal', 'error', 'No se pudo cargar', e.message); });\n}\n\nfunction pintar(m) {\n  $('#sello').textContent = new Date().toLocaleTimeString('es-CO');\n\n  $('#cabeceraChips').innerHTML =\n    '<span class=\"chip\">Inscritos <b>' + m.inscritos + '</b></span>' +\n    '<span class=\"chip\">Con código <b>' + m.con_codigo + '</b></span>' +\n    '<span class=\"chip\">Realizadas <b>' + m.realizadas + '</b></span>' +\n    (m.requiere_comite ? '<span class=\"chip\" style=\"border-color:var(--alerta)\">Requiere comité</span>' : '');\n\n  $('#metricas').innerHTML = [\n    ['Inscritos', m.inscritos, ''], ['Únicos', m.unicos, ''], ['Duplicados', m.duplicados, ''],\n    ['Aptos', m.aptos, ''], ['Con código', m.con_codigo, 'destacada'],\n    ['Cupos libres', m.cupos_libres, ''], ['Incompletos', m.incompletos, ''],\n    ['No cumplen', m.no_cumplen, ''], ['Reasignados', m.reasignados, ''],\n    ['Cambios pendientes', m.cambios_pendientes, m.cambios_pendientes ? 'destacada' : ''],\n    ['Check-ins', m.check_ins, ''], ['Realizadas', m.realizadas, 'destacada'],\n    ['No show', m.no_show, ''], ['Contingencia', m.contingencia, ''],\n    ['No audicionados', m.no_audicionados, ''],\n    ['Promedio global', m.promedio_global === null ? '—' : m.promedio_global, '']\n  ].map(function (x) {\n    return '<div class=\"metrica ' + x[2] + '\"><div class=\"n\">' + x[1] + '</div><div class=\"t\">' + x[0] + '</div></div>';\n  }).join('');\n\n  $('#avanceGlobal').innerHTML =\n    '<div style=\"display:flex;justify-content:space-between;align-items:baseline;gap:12px\">' +\n    '<span style=\"font-size:28px;font-weight:900;color:var(--amarillo)\">' + m.avance + '%</span>' +\n    '<span style=\"color:var(--tenue);font-size:13px\">' + escaparHtml(m.avance_texto) + '</span></div>' +\n    '<div class=\"barra\"><i style=\"width:' + Math.min(100, m.avance) + '%\"></i></div>';\n\n  // --- Chart: participant states (horizontal bars, one hue, row labels) -----\n  var estados = [\n    ['Confirmados', m.confirmados], ['Check-in', m.check_ins], ['Realizadas', m.realizadas],\n    ['Contingencia', m.contingencia], ['No show', m.no_show], ['No audicionados', m.no_audicionados]\n  ];\n  barras('#gEstados', estados.map(function (e) { return { etiqueta: e[0], valor: e[1] }; }),\n         { sufijo: ' participantes' });\n  tabla('#tEstados', ['Estado', 'Cantidad'], estados);\n\n  // --- Chart: progress per block (bar = done, grey figure = assigned) -------\n  barras('#gBloques', m.por_bloque.map(function (b) {\n    return { etiqueta: 'Bloque ' + b.block_id, valor: b.realizadas, meta: b.asignados,\n             titulo: b.ventana + ' · ' + b.realizadas + ' de ' + b.asignados + ' realizadas' };\n  }), { conMeta: true });\n  tabla('#tBloques', ['Bloque', 'Ventana', 'Realizadas', 'Asignados'],\n        m.por_bloque.map(function (b) { return [b.block_id, b.ventana, b.realizadas, b.asignados]; }));\n\n  // --- Chart: score distribution (histogram) -------------------------------\n  histograma('#gDistribucion', m.distribucion);\n  tabla('#tDistribucion', ['Rango', 'Artistas'],\n        m.distribucion.map(function (d) { return [d.etiqueta, d.conteo]; }));\n\n  // --- Chart: Top N --------------------------------------------------------\n  $('#nTop').textContent = m.top.length || 7;\n  if (!m.top.length) {\n    $('#gTop').innerHTML = '<div class=\"vacio\">Aún no hay resultados. Aparecerán cuando el jurado califique.</div>';\n    $('#tTop').innerHTML = '';\n  } else {\n    barras('#gTop', m.top.map(function (t, i) {\n      return { etiqueta: (i + 1) + '. ' + (t.artistic_name || t.code), valor: t.artist_final,\n               titulo: t.code + ' · ' + t.artist_final + '/100' };\n    }), { max: 100, decimales: true, sufijo: '/100' });\n    tabla('#tTop', ['#', 'Código', 'Artista', 'Puntaje'],\n          m.top.map(function (t, i) { return [i + 1, t.code, t.artistic_name, t.artist_final]; }));\n  }\n}\n\n/**\n * Horizontal bars. One hue; the row label carries identity, so no legend and no\n * categorical palette is needed. Every bar is directly labelled with its value.\n */\nfunction barras(sel, filas, opciones) {\n  opciones = opciones || {};\n  var valores = filas.map(function (f) { return Number(f.valor) || 0; });\n  var metas = filas.map(function (f) { return Number(f.meta) || 0; });\n  var max = opciones.max || Math.max(1, Math.max.apply(null, valores.concat(metas)));\n\n  $(sel).innerHTML = filas.map(function (f) {\n    var v = Number(f.valor) || 0;\n    var ancho = Math.max(v > 0 ? 1.5 : 0, (v / max) * 100);\n    return '<div class=\"fila-barra\" title=\"' +\n        escaparHtml(f.titulo || (f.etiqueta + ': ' + v + (opciones.sufijo || ''))) + '\">' +\n      '<span class=\"et\">' + escaparHtml(f.etiqueta) + '</span>' +\n      '<span class=\"pista\"><span class=\"relleno\" style=\"width:' + ancho + '%\"></span></span>' +\n      '<span class=\"val\">' + (opciones.decimales ? v : Math.round(v)) + '</span>' +\n      (opciones.conMeta ? '<span class=\"meta\">de ' + (f.meta || 0) + '</span>' : '') +\n    '</div>';\n  }).join('');\n}\n\n/** Vertical histogram for the ordered score bins. */\nfunction histograma(sel, datos) {\n  var max = Math.max(1, Math.max.apply(null, datos.map(function (d) { return d.conteo; })));\n  if (!datos.some(function (d) { return d.conteo > 0; })) {\n    $(sel).innerHTML = '<div class=\"vacio\">Sin puntajes todavía.</div>';\n    return;\n  }\n  $(sel).innerHTML =\n    '<div class=\"histo\">' + datos.map(function (d) {\n      return '<div class=\"col\" title=\"' + escaparHtml(d.etiqueta + ': ' + d.conteo + ' artistas') + '\">' +\n        '<span class=\"n\">' + d.conteo + '</span>' +\n        '<span class=\"b\" style=\"height:' + Math.max(d.conteo ? 3 : 0, (d.conteo / max) * 100) + '%\"></span></div>';\n    }).join('') + '</div>' +\n    '<div class=\"histo-ejes\">' + datos.map(function (d) {\n      return '<span>' + escaparHtml(d.etiqueta) + '</span>';\n    }).join('') + '</div>';\n}\n\n/** Table view of the same numbers - required so identity is never colour-only. */\nfunction tabla(sel, cabeceras, filas) {\n  $(sel).innerHTML = '<div class=\"tabla-envoltura\"><table><thead><tr>' +\n    cabeceras.map(function (c) { return '<th>' + escaparHtml(c) + '</th>'; }).join('') +\n    '</tr></thead><tbody>' + filas.map(function (f) {\n      return '<tr>' + f.map(function (c) { return '<td>' + escaparHtml(c) + '</td>'; }).join('') + '</tr>';\n    }).join('') + '</tbody></table></div>';\n}\n\nfunction calcularResultados() {\n  var b = $('#btnResultados'); ocupado(b, true, 'Calculando...');\n  llamar('resultados').then(function (r) {\n    ocupado(b, false);\n    $('#salidaResultados').innerHTML =\n      (r.requiere_comite\n        ? '<div class=\"aviso alerta\"><b>Empate en el corte</b>El desempate automático ' +\n          '(Performance → Talento → Identidad) no resolvió. Requiere deliberación documentada del comité.</div>'\n        : '') +\n      '<div class=\"tabla-envoltura\"><table><thead><tr><th>#</th><th>Código</th><th>Artista</th>' +\n      '<th>Disciplina</th><th>J1</th><th>J2</th><th>J3</th><th>Final</th><th>Sel.</th></tr></thead><tbody>' +\n      r.ranking.map(function (x) {\n        return '<tr' + (String(x.seleccionado).toUpperCase() === 'SI' ? ' style=\"background:rgba(255,212,0,.07)\"' : '') +\n          '><td>' + escaparHtml(x.posicion) + '</td><td><b>' + escaparHtml(x.code) + '</b></td>' +\n          '<td>' + escaparHtml(x.artistic_name) + '</td><td>' + escaparHtml(x.discipline) + '</td>' +\n          '<td>' + escaparHtml(x.jurado_1) + '</td><td>' + escaparHtml(x.jurado_2) + '</td>' +\n          '<td>' + escaparHtml(x.jurado_3) + '</td><td><b>' + escaparHtml(x.artist_final) + '</b></td>' +\n          '<td>' + (String(x.seleccionado).toUpperCase() === 'SI' ? '★' : '') + '</td></tr>';\n      }).join('') + '</tbody></table></div>';\n  }).catch(function (e) { ocupado(b, false); mostrarAviso('#salidaResultados', 'error', 'Error', e.message); });\n}\n</script>\n</body>\n</html>\n",
  "ui_estilos": "<style>\n/* EL BUNKER - shared styles. Mobile-first: most participants arrive on a phone. */\n:root{\n  --negro:#0b0d10; --carbon:#15181d; --acero:#1e232b; --linea:#2b323d;\n  --texto:#eef1f5; --tenue:#98a2b3; --amarillo:#ffd400; --amarillo-oscuro:#d6b000;\n  --ok:#22c55e; --alerta:#f59e0b; --error:#ef4444; --info:#38bdf8;\n  --radio:14px; --sombra:0 10px 30px rgba(0,0,0,.45);\n}\n*{box-sizing:border-box}\nhtml,body{margin:0;padding:0}\nbody{\n  background:var(--negro); color:var(--texto);\n  font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;\n  font-size:16px; line-height:1.55; -webkit-font-smoothing:antialiased;\n}\n.envoltura{max-width:760px;margin:0 auto;padding:20px 16px 64px}\n.ancho{max-width:1180px}\n\n.cabecera{border-bottom:1px solid var(--linea);padding-bottom:18px;margin-bottom:26px}\n.marca{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}\n.marca h1{margin:0;font-size:clamp(26px,6vw,40px);font-weight:900;letter-spacing:-.02em;line-height:1}\n.marca h1 span{color:var(--amarillo)}\n.marca .sub{color:var(--tenue);font-size:13px;text-transform:uppercase;letter-spacing:.14em}\n.datos-evento{margin-top:12px;display:flex;gap:8px;flex-wrap:wrap}\n.chip{background:var(--acero);border:1px solid var(--linea);border-radius:999px;\n  padding:5px 12px;font-size:12.5px;color:var(--tenue);white-space:nowrap}\n.chip b{color:var(--texto);font-weight:600}\n\n.tarjeta{background:var(--carbon);border:1px solid var(--linea);border-radius:var(--radio);\n  padding:20px;margin-bottom:18px}\n.tarjeta h2{margin:0 0 4px;font-size:17px;font-weight:800;letter-spacing:-.01em}\n.tarjeta .pista{color:var(--tenue);font-size:13.5px;margin:0 0 16px}\n\n.campo{margin-bottom:16px}\n.campo label{display:block;font-size:13.5px;font-weight:600;margin-bottom:6px}\n.campo .ayuda{color:var(--tenue);font-size:12.5px;margin:4px 0 0}\n.campo .req{color:var(--amarillo);margin-left:3px}\ninput[type=text],input[type=email],input[type=tel],input[type=date],input[type=url],\ninput[type=number],input[type=password],select,textarea{\n  width:100%;background:var(--negro);border:1px solid var(--linea);border-radius:10px;\n  color:var(--texto);padding:12px 13px;font-size:16px;font-family:inherit;transition:border-color .15s}\ninput:focus,select:focus,textarea:focus{outline:none;border-color:var(--amarillo);\n  box-shadow:0 0 0 3px rgba(255,212,0,.13)}\ntextarea{min-height:92px;resize:vertical}\nselect{appearance:none;background-image:url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8'><path d='M1 1l5 5 5-5' stroke='%2398a2b3' stroke-width='2' fill='none'/></svg>\");\n  background-repeat:no-repeat;background-position:right 14px center;padding-right:38px}\n.campo.malo input,.campo.malo select,.campo.malo textarea{border-color:var(--error)}\n.campo .error{color:var(--error);font-size:12.5px;margin-top:5px;display:none}\n.campo.malo .error{display:block}\n\n.check{display:flex;gap:11px;align-items:flex-start;background:var(--acero);\n  border:1px solid var(--linea);border-radius:10px;padding:13px;margin-bottom:10px;cursor:pointer}\n.check input{margin:2px 0 0;width:19px;height:19px;accent-color:var(--amarillo);flex-shrink:0;cursor:pointer}\n.check span{font-size:13.5px;line-height:1.45}\n.check a{color:var(--amarillo)}\n.check.malo{border-color:var(--error)}\n\n.boton{display:inline-flex;align-items:center;justify-content:center;gap:8px;\n  background:var(--amarillo);color:#000;border:none;border-radius:11px;padding:14px 22px;\n  font-size:15.5px;font-weight:800;cursor:pointer;font-family:inherit;width:100%;\n  transition:transform .08s,background .15s}\n.boton:hover:not(:disabled){background:var(--amarillo-oscuro)}\n.boton:active:not(:disabled){transform:translateY(1px)}\n.boton:disabled{opacity:.5;cursor:not-allowed}\n.boton.fantasma{background:transparent;color:var(--texto);border:1px solid var(--linea)}\n.boton.fantasma:hover:not(:disabled){background:var(--acero)}\n.boton.peligro{background:var(--error);color:#fff}\n.boton.chico{width:auto;padding:8px 14px;font-size:13px;border-radius:9px}\n\n.aviso{border-radius:11px;padding:14px 16px;margin-bottom:16px;font-size:14px;border:1px solid}\n.aviso.ok{background:rgba(34,197,94,.1);border-color:rgba(34,197,94,.4)}\n.aviso.error{background:rgba(239,68,68,.1);border-color:rgba(239,68,68,.4)}\n.aviso.alerta{background:rgba(245,158,11,.1);border-color:rgba(245,158,11,.4)}\n.aviso.info{background:rgba(56,189,248,.1);border-color:rgba(56,189,248,.4)}\n.aviso b{display:block;margin-bottom:3px}\n\n.tabla-envoltura{overflow-x:auto;-webkit-overflow-scrolling:touch;border:1px solid var(--linea);border-radius:11px}\ntable{width:100%;border-collapse:collapse;font-size:13px;white-space:nowrap}\nth{background:var(--acero);text-align:left;padding:10px 12px;font-weight:700;\n  font-size:11.5px;text-transform:uppercase;letter-spacing:.07em;color:var(--tenue);\n  position:sticky;top:0;z-index:1}\ntd{padding:9px 12px;border-top:1px solid var(--linea)}\ntr:hover td{background:rgba(255,255,255,.025)}\n\n.etiqueta{display:inline-block;padding:2.5px 9px;border-radius:999px;font-size:11px;\n  font-weight:700;letter-spacing:.03em}\n.e-APTO,.e-REALIZADA,.e-APROBADO{background:rgba(34,197,94,.17);color:#4ade80}\n.e-INCOMPLETO,.e-REVISION,.e-PENDIENTE,.e-CONTINGENCIA{background:rgba(245,158,11,.17);color:#fbbf24}\n.e-NO_CUMPLE,.e-DUPLICADO,.e-RECHAZADO,.e-NOSHOW,.e-NOAUDICIONADO{background:rgba(239,68,68,.17);color:#f87171}\n.e-CONFIRMADO,.e-SIN_SOLICITUD{background:rgba(152,162,179,.17);color:var(--tenue)}\n.e-CHECKIN{background:rgba(56,189,248,.17);color:#38bdf8}\n\n.rejilla{display:grid;gap:12px}\n.rejilla.dos{grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}\n.rejilla.metricas{grid-template-columns:repeat(auto-fit,minmax(142px,1fr))}\n.metrica{background:var(--carbon);border:1px solid var(--linea);border-radius:12px;padding:15px}\n.metrica .n{font-size:30px;font-weight:900;line-height:1;letter-spacing:-.02em}\n.metrica .t{color:var(--tenue);font-size:11.5px;text-transform:uppercase;\n  letter-spacing:.07em;margin-top:7px}\n.metrica.destacada{border-color:var(--amarillo)}\n.metrica.destacada .n{color:var(--amarillo)}\n\n.barra{height:8px;background:var(--acero);border-radius:999px;overflow:hidden;margin-top:9px}\n.barra i{display:block;height:100%;background:var(--amarillo);border-radius:999px;transition:width .4s}\n\n.pestanas{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:18px;border-bottom:1px solid var(--linea);padding-bottom:12px}\n.pestana{background:transparent;border:1px solid var(--linea);color:var(--tenue);\n  border-radius:9px;padding:8px 15px;font-size:13.5px;font-weight:600;cursor:pointer;font-family:inherit}\n.pestana.activa{background:var(--amarillo);border-color:var(--amarillo);color:#000}\n\n.panel{display:none}\n.panel.activo{display:block}\n\n.cargando{display:inline-block;width:15px;height:15px;border:2px solid rgba(0,0,0,.25);\n  border-top-color:#000;border-radius:50%;animation:girar .7s linear infinite}\n@keyframes girar{to{transform:rotate(360deg)}}\n\n.conexion{position:fixed;bottom:0;left:0;right:0;padding:9px 16px;text-align:center;\n  font-size:13px;font-weight:700;z-index:50;display:none}\n.conexion.sin{display:block;background:var(--error);color:#fff}\n.conexion.pendiente{display:block;background:var(--alerta);color:#000}\n\n.pie{margin-top:34px;padding-top:18px;border-top:1px solid var(--linea);\n  color:var(--tenue);font-size:12.5px;text-align:center}\n.pie a{color:var(--tenue)}\n\n.pendiente-dato{color:var(--alerta);font-weight:700}\n.oculto{display:none !important}\n/* Banner de entorno de pruebas: alto contraste y pegado arriba, para que sea\n   imposible confundir una pantalla de ensayo con la real. */\n.banner-pruebas{position:sticky;top:0;z-index:100;background:repeating-linear-gradient(\n  45deg,#f59e0b,#f59e0b 14px,#0b0d10 14px,#0b0d10 28px);\n  color:#fff;padding:0;margin:0 0 14px;border-radius:0 0 10px 10px;overflow:hidden}\n.banner-pruebas span{display:block;background:rgba(11,13,16,.87);margin:4px;\n  padding:8px 14px;border-radius:7px;font-size:13px;font-weight:800;\n  letter-spacing:.06em;text-align:center}\n.banner-pruebas b{color:var(--alerta)}\n\n@media(max-width:640px){ .envoltura{padding:16px 13px 72px} .tarjeta{padding:16px} }\n</style>\n",
  "ui_gracias": "<!DOCTYPE html>\n<html lang=\"es\">\n<head><base target=\"_top\"><meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n<?!= incluir('ui_estilos') ?></head>\n<body>\n<div class=\"envoltura\">\n  <header class=\"cabecera\">\n    <div class=\"marca\"><h1>EL <span>BÚNKER</span></h1><div class=\"sub\">by Arte es la Solución</div></div>\n  </header>\n  <div class=\"aviso ok\"><b>Listo</b>Recibimos tu información.</div>\n  <div class=\"tarjeta\"><h2>Consulta tu estado</h2>\n    <p class=\"pista\">Ingresa tu código y tu documento para ver tu horario.</p>\n    <div class=\"campo\"><label for=\"code\">Código</label><input type=\"text\" id=\"code\" placeholder=\"B-001\"></div>\n    <div class=\"campo\"><label for=\"id_number\">Documento</label><input type=\"text\" id=\"id_number\" inputmode=\"numeric\"></div>\n    <button class=\"boton\" id=\"btn\">Consultar</button>\n    <div id=\"salida\" style=\"margin-top:16px\"></div>\n  </div>\n</div>\n<?!= incluir('ui_scripts') ?>\n<script>window.ENTORNO = '<?= ENTORNO ?>';</script>\n<script>\n$('#btn').addEventListener('click', function () {\n  var b = $('#btn'); ocupado(b, true, 'Consultando...');\n  llamar('consultar_estado', { code: $('#code').value.trim(), id_number: $('#id_number').value.trim() })\n    .then(function (r) {\n      ocupado(b, false);\n      $('#salida').innerHTML = '<div class=\"aviso info\"><b>' + escaparHtml(r.code || 'Sin código aún') + '</b>' +\n        'Elegibilidad: ' + escaparHtml(r.eligibility_status) +\n        (r.hora_audicion ? '<br>Llegada: <b>' + escaparHtml(r.hora_llegada) + '</b> · Audición: <b>' +\n          escaparHtml(r.hora_audicion) + '</b> (bloque ' + escaparHtml(r.bloque) + ')' : '') + '</div>';\n    })\n    .catch(function (e) { ocupado(b, false); mostrarAviso('#salida', 'error', 'No encontrado', e.message); });\n});\n</script>\n</body>\n</html>\n",
  "ui_inscripcion": "<!DOCTYPE html>\n<html lang=\"es\">\n<head>\n<base target=\"_top\">\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n<?!= incluir('ui_estilos') ?>\n</head>\n<body>\n<div class=\"envoltura\">\n\n  <header class=\"cabecera\">\n    <div class=\"marca\">\n      <h1>EL <span>BÚNKER</span></h1>\n      <div class=\"sub\">by Arte es la Solución</div>\n    </div>\n    <div class=\"datos-evento\" id=\"datosEvento\"></div>\n  </header>\n\n  <div id=\"avisoGlobal\"></div>\n\n  <div id=\"formulario\">\n    <div class=\"tarjeta\">\n      <h2>Inscripción a la convocatoria</h2>\n      <p class=\"pista\">Todos los campos marcados con <span class=\"req\">*</span> son obligatorios.\n        Diligénciala una sola vez: si te inscribes dos veces con el mismo documento conservamos la primera.</p>\n\n      <div class=\"campo\">\n        <label for=\"full_name\">Nombre completo <span class=\"req\">*</span></label>\n        <input type=\"text\" id=\"full_name\" autocomplete=\"name\" placeholder=\"Nombres y apellidos como aparecen en tu documento\">\n        <div class=\"error\"></div>\n      </div>\n\n      <div class=\"rejilla dos\">\n        <div class=\"campo\">\n          <label for=\"id_number\">Número de documento <span class=\"req\">*</span></label>\n          <input type=\"text\" id=\"id_number\" inputmode=\"numeric\" autocomplete=\"off\" placeholder=\"Sin puntos ni comas\">\n          <p class=\"ayuda\">Lo verificaremos con tu documento físico el día de la audición.</p>\n          <div class=\"error\"></div>\n        </div>\n        <div class=\"campo\">\n          <label for=\"birth_date\">Fecha de nacimiento <span class=\"req\">*</span></label>\n          <input type=\"date\" id=\"birth_date\">\n          <p class=\"ayuda\" id=\"ayudaEdad\">La convocatoria es para personas de 18 a 28 años.</p>\n          <div class=\"error\"></div>\n        </div>\n      </div>\n\n      <div class=\"campo\">\n        <label for=\"neighborhood_sector\">Barrio, sector o vereda <span class=\"req\">*</span></label>\n        <input type=\"text\" id=\"neighborhood_sector\" placeholder=\"Ej.: La Doctora, Betania, San Joaquín...\">\n        <div class=\"error\"></div>\n      </div>\n\n      <div class=\"campo\" id=\"campoResidencia\">\n        <label class=\"check\">\n          <input type=\"checkbox\" id=\"resides_in_sabaneta\">\n          <span>Declaro que <b>resido en Sabaneta, Antioquia</b>. <span class=\"req\">*</span></span>\n        </label>\n        <div class=\"error\"></div>\n      </div>\n\n      <div class=\"rejilla dos\">\n        <div class=\"campo\">\n          <label for=\"email\">Correo electrónico <span class=\"req\">*</span></label>\n          <input type=\"email\" id=\"email\" autocomplete=\"email\" placeholder=\"tucorreo@ejemplo.com\">\n          <div class=\"error\"></div>\n        </div>\n        <div class=\"campo\">\n          <label for=\"whatsapp\">WhatsApp <span class=\"req\">*</span></label>\n          <input type=\"tel\" id=\"whatsapp\" inputmode=\"numeric\" autocomplete=\"tel\" placeholder=\"3001234567\">\n          <p class=\"ayuda\">10 dígitos, empieza por 3. Por aquí enviaremos tu código y tu horario.</p>\n          <div class=\"error\"></div>\n        </div>\n      </div>\n    </div>\n\n    <div class=\"tarjeta\">\n      <h2>Tu propuesta artística</h2>\n      <p class=\"pista\">Esto es lo que verá el jurado antes de tu audición.</p>\n\n      <div class=\"rejilla dos\">\n        <div class=\"campo\">\n          <label for=\"artistic_name\">Nombre artístico</label>\n          <input type=\"text\" id=\"artistic_name\" placeholder=\"Si no tienes, déjalo vacío\">\n        </div>\n        <div class=\"campo\">\n          <label for=\"discipline\">Disciplina <span class=\"req\">*</span></label>\n          <select id=\"discipline\">\n            <option value=\"\">Selecciona...</option>\n            <option>Canto</option><option>Rap / Hip hop</option>\n            <option>Música instrumental</option><option>DJ / producción</option>\n            <option>Danza urbana</option><option>Danza contemporánea</option>\n            <option>Danza folclórica</option><option>Teatro</option>\n            <option>Poesía / spoken word</option><option>Circo</option>\n            <option>Artes visuales en vivo</option><option>Otra</option>\n          </select>\n          <div class=\"error\"></div>\n        </div>\n      </div>\n\n      <div class=\"campo\">\n        <label for=\"genre_or_proposal\">Género o propuesta</label>\n        <input type=\"text\" id=\"genre_or_proposal\" placeholder=\"Ej.: R&B, trap, salsa choke, teatro físico...\">\n      </div>\n\n      <div class=\"campo\">\n        <label for=\"artist_description\">Cuéntanos de ti</label>\n        <textarea id=\"artist_description\" maxlength=\"600\" placeholder=\"Tu trayectoria, dónde te has presentado, qué te mueve.\"></textarea>\n      </div>\n\n      <div class=\"campo\">\n        <label for=\"audition_description\">¿Qué vas a presentar en 3 minutos? <span class=\"req\">*</span></label>\n        <textarea id=\"audition_description\" maxlength=\"600\" placeholder=\"Describe exactamente lo que vas a hacer en tarima.\"></textarea>\n        <p class=\"ayuda\">La audición dura máximo 3 minutos. Se cronometra.</p>\n        <div class=\"error\"></div>\n      </div>\n\n      <div class=\"campo\">\n        <label for=\"video_url\">Enlace a un video tuyo</label>\n        <input type=\"url\" id=\"video_url\" placeholder=\"https://... (YouTube, Instagram, TikTok, Drive)\">\n        <p class=\"ayuda\">Opcional pero recomendado. Verifica que el enlace sea público antes de enviarlo.</p>\n        <div class=\"error\"></div>\n      </div>\n\n      <div class=\"campo\">\n        <label for=\"technical_needs\">Necesidades técnicas</label>\n        <input type=\"text\" id=\"technical_needs\" placeholder=\"Ej.: micrófono, pista en USB, espacio para 4 personas\">\n      </div>\n    </div>\n\n    <div class=\"tarjeta\">\n      <h2>Disponibilidad</h2>\n      <p class=\"pista\">No hay forma de elegir horario. La organización lo asigna y te lo comunica.</p>\n      <label class=\"check\" id=\"campoDisponibilidad\">\n        <input type=\"checkbox\" id=\"availability_statement\">\n        <span id=\"textoDisponibilidad\">Declaro que tengo disponibilidad para asistir dentro de la jornada de\n          audiciones y acepto el horario que posteriormente sea asignado por la organización.\n          <span class=\"req\">*</span></span>\n      </label>\n      <div class=\"error\"></div>\n    </div>\n\n    <div class=\"tarjeta\">\n      <h2>Autorizaciones</h2>\n      <p class=\"pista\">Lee los documentos antes de marcar. Guardamos la versión exacta del texto que aceptaste.</p>\n\n      <div id=\"enlacesLegales\" class=\"aviso info\" style=\"font-size:13px\">\n        <b>Antes de aceptar, revisa:</b>\n        <span id=\"linkTerminos\"></span> · <span id=\"linkPolitica\"></span>\n      </div>\n\n      <label class=\"check\" id=\"campoTerminos\">\n        <input type=\"checkbox\" id=\"accept_terms\">\n        <span>He leído y acepto los <b>términos y condiciones</b> de EL BÚNKER. <span class=\"req\">*</span></span>\n      </label>\n      <label class=\"check\" id=\"campoDatos\">\n        <input type=\"checkbox\" id=\"accept_data_processing\">\n        <span>Autorizo el <b>tratamiento de mis datos personales</b> para las finalidades informadas\n          en la política de tratamiento de datos. <span class=\"req\">*</span></span>\n      </label>\n      <label class=\"check\">\n        <input type=\"checkbox\" id=\"accept_whatsapp_operational\">\n        <span>Autorizo recibir <b>comunicaciones operativas por WhatsApp</b> sobre mi inscripción,\n          horario, cambios y novedades.</span>\n      </label>\n      <label class=\"check\">\n        <input type=\"checkbox\" id=\"accept_image_voice\">\n        <span>Autorizo la captación y uso de mi <b>imagen, voz y registros audiovisuales</b>\n          para las finalidades informadas.</span>\n      </label>\n\n      <div class=\"aviso alerta\" style=\"margin-top:14px;font-size:13px\">\n        Inscribirte <b>no garantiza</b> selección, contratación ni presentación.\n      </div>\n\n      <button class=\"boton\" id=\"btnEnviar\" style=\"margin-top:6px\">Enviar mi inscripción</button>\n    </div>\n  </div>\n\n  <div id=\"resultado\" class=\"oculto\"></div>\n\n  <div class=\"pie\">\n    <div id=\"pieLegal\"></div>\n  </div>\n</div>\n\n<?!= incluir('ui_scripts') ?>\n<script>window.ENTORNO = '<?= ENTORNO ?>';</script>\n<script>\nvar CONFIG = null;\n\ndocument.addEventListener('DOMContentLoaded', function () {\n  llamar('config_publica').then(pintarConfig).catch(function (e) {\n    mostrarAviso('#avisoGlobal', 'error', 'No pudimos cargar la convocatoria', e.message);\n  });\n  $('#btnEnviar').addEventListener('click', enviar);\n});\n\nfunction pintarConfig(c) {\n  CONFIG = c;\n  var e = c.evento;\n\n  $('#datosEvento').innerHTML =\n    chip('Fecha', e.fecha) + chip('Jornada', e.hora_inicio + ' - ' + e.hora_fin) +\n    chip('Edad', e.edad_minima + ' a ' + e.edad_maxima + ' años') +\n    chip('Residencia', e.municipio) + chip('Audición', 'máx. ' + e.duracion_audicion + ' min') +\n    chip('Cupos', String(e.cupo)) + chip('Se seleccionan', String(e.top) + ' artistas');\n\n  $('#ayudaEdad').textContent = 'Debes tener entre ' + e.edad_minima + ' y ' + e.edad_maxima +\n    ' años cumplidos el ' + e.fecha + '.';\n  $('#textoDisponibilidad').innerHTML =\n    'Declaro que tengo disponibilidad para asistir el <b>' + escaparHtml(e.fecha) +\n    '</b> dentro de la jornada de audiciones de <b>' + escaparHtml(e.hora_inicio) + ' a ' +\n    escaparHtml(e.hora_fin) + '</b> y acepto el horario que posteriormente sea asignado por la organización. ' +\n    '<span class=\"req\">*</span>';\n\n  $('#linkTerminos').innerHTML = enlaceLegal(c.legal.terms_url, 'Términos y condiciones');\n  $('#linkPolitica').innerHTML = enlaceLegal(c.legal.privacy_policy_url, 'Política de tratamiento de datos');\n\n  $('#pieLegal').innerHTML =\n    'Responsable del tratamiento: ' + dato(c.legal.legal_name) + '<br>' +\n    'Ejercicio de derechos del titular: ' + dato(c.legal.data_protection_email) +\n    ' · ' + dato(c.legal.institutional_phone) +\n    '<br><span style=\"opacity:.6\">Versión de textos aceptada: ' + escaparHtml(c.legal.consent_version) + '</span>';\n\n  if (!c.abierto) {\n    $('#formulario').classList.add('oculto');\n    mostrarAviso('#avisoGlobal', 'alerta', 'Inscripciones cerradas',\n      'La convocatoria ya no está recibiendo inscripciones.');\n  }\n}\n\nfunction chip(t, v) { return '<span class=\"chip\">' + t + ' <b>' + escaparHtml(v) + '</b></span>'; }\n\nfunction dato(v) {\n  return String(v).indexOf('PENDIENTE') === 0\n    ? '<span class=\"pendiente-dato\">' + escaparHtml(v) + '</span>'\n    : escaparHtml(v);\n}\n\nfunction enlaceLegal(url, texto) {\n  if (!url || String(url).indexOf('PENDIENTE') === 0) {\n    return '<span class=\"pendiente-dato\">' + texto + ' (PENDIENTE DE PUBLICAR)</span>';\n  }\n  return '<a href=\"' + escaparHtml(url) + '\" target=\"_blank\" rel=\"noopener\">' + texto + '</a>';\n}\n\nvar CAMPOS = ['full_name','id_number','birth_date','neighborhood_sector','email','whatsapp',\n              'artistic_name','discipline','genre_or_proposal','artist_description',\n              'audition_description','video_url','technical_needs'];\nvar CASILLAS = ['resides_in_sabaneta','availability_statement','accept_terms',\n                'accept_data_processing','accept_whatsapp_operational','accept_image_voice'];\n\nfunction recolectar() {\n  var datos = {};\n  CAMPOS.forEach(function (id) { datos[id] = ($('#' + id).value || '').trim(); });\n  CASILLAS.forEach(function (id) { datos[id] = $('#' + id).checked; });\n  datos.client_submission_id = idEnvio('inscripcion');\n  datos.source = 'web';\n  return datos;\n}\n\nfunction limpiarErrores() {\n  $$('.campo').forEach(function (c) { c.classList.remove('malo'); });\n  $$('.check').forEach(function (c) { c.classList.remove('malo'); });\n}\n\n/** Client-side check only to fail fast; the server always validates again. */\nfunction validacionRapida(d) {\n  var faltan = [];\n  [['full_name','Nombre completo'],['id_number','Documento'],['birth_date','Fecha de nacimiento'],\n   ['neighborhood_sector','Barrio o sector'],['email','Correo'],['whatsapp','WhatsApp'],\n   ['discipline','Disciplina'],['audition_description','Qué vas a presentar']]\n    .forEach(function (p) { if (!d[p[0]]) faltan.push(p); });\n\n  if (!d.resides_in_sabaneta) faltan.push(['campoResidencia', 'Declaración de residencia']);\n  if (!d.availability_statement) faltan.push(['campoDisponibilidad', 'Declaración de disponibilidad']);\n  if (!d.accept_terms) faltan.push(['campoTerminos', 'Aceptación de términos']);\n  if (!d.accept_data_processing) faltan.push(['campoDatos', 'Autorización de datos']);\n\n  faltan.forEach(function (p) {\n    var el = $('#' + p[0]);\n    if (!el) return;\n    var cont = el.closest('.campo') || el.closest('.check') || el;\n    cont.classList.add('malo');\n    var err = cont.querySelector('.error');\n    if (err) err.textContent = p[1] + ' es obligatorio.';\n  });\n  return faltan;\n}\n\nfunction enviar() {\n  limpiarErrores();\n  var datos = recolectar();\n  var faltan = validacionRapida(datos);\n\n  if (faltan.length) {\n    mostrarAviso('#avisoGlobal', 'error', 'Faltan datos obligatorios',\n      'Revisa los campos marcados en rojo (' + faltan.length + ').');\n    return;\n  }\n\n  var boton = $('#btnEnviar');\n  ocupado(boton, true, 'Enviando...');\n  $('#avisoGlobal').innerHTML = '';\n\n  llamar('inscribir', datos)\n    .then(function (r) { mostrarResultado(r); })\n    .catch(function (e) {\n      ocupado(boton, false);\n      mostrarAviso('#avisoGlobal', 'error', 'No pudimos enviar tu inscripción',\n        e.message + ' — revisa tu conexión y vuelve a intentar. No se creó un registro duplicado.');\n    });\n}\n\nfunction mostrarResultado(r) {\n  var tipo = { APTO: 'ok', DUPLICADO: 'alerta', REVISION: 'alerta',\n               INCOMPLETO: 'error', NO_CUMPLE: 'error' }[r.eligibility_status] || 'info';\n\n  // INCOMPLETO is the only verdict the participant can fix by resubmitting.\n  if (r.eligibility_status === 'INCOMPLETO') {\n    ocupado($('#btnEnviar'), false);\n    nuevoIdEnvio('inscripcion');\n    var lista = (r.errores || []).map(function (e) { return '• ' + e.mensaje; }).join('<br>');\n    $('#avisoGlobal').innerHTML = '<div class=\"aviso error\"><b>Faltan datos</b>' + lista + '</div>';\n    (r.errores || []).forEach(function (e) {\n      var el = $('#' + e.campo);\n      if (el) { var c = el.closest('.campo') || el.closest('.check'); if (c) c.classList.add('malo'); }\n    });\n    window.scrollTo({ top: 0, behavior: 'smooth' });\n    return;\n  }\n\n  $('#formulario').classList.add('oculto');\n  var caja = $('#resultado');\n  caja.classList.remove('oculto');\n\n  var extra = '';\n  if (r.eligibility_status === 'APTO') {\n    extra = '<div class=\"tarjeta\"><h2>¿Y ahora qué?</h2>' +\n      '<p class=\"pista\" style=\"margin:0\">1. Validamos todas las inscripciones.<br>' +\n      '2. Si quedas dentro de los cupos recibes tu <b>código</b> y tu <b>horario</b> por WhatsApp y/o correo.<br>' +\n      '3. Solo si tienes un impedimento real podrás pedir <b>un</b> cambio de horario.<br>' +\n      '4. Llega 15 minutos antes con tu <b>documento físico</b>.</p></div>';\n  }\n\n  caja.innerHTML =\n    '<div class=\"aviso ' + tipo + '\"><b>' + escaparHtml(r.eligibility_status) + '</b>' +\n    escaparHtml(r.mensaje) + '</div>' +\n    '<div class=\"tarjeta\"><h2>Comprobante</h2>' +\n    '<p class=\"pista\" style=\"margin:0\">Guarda este número por si necesitas escribirnos:<br>' +\n    '<b style=\"font-size:19px;letter-spacing:.06em\">' + escaparHtml(r.submission_id) + '</b></p></div>' +\n    extra;\n  window.scrollTo({ top: 0, behavior: 'smooth' });\n}\n</script>\n</body>\n</html>\n",
  "ui_jurado": "<!DOCTYPE html>\n<html lang=\"es\">\n<head><base target=\"_top\"><meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n<?!= incluir('ui_estilos') ?>\n<style>\n.factor{background:var(--acero);border:1px solid var(--linea);border-radius:11px;padding:13px;margin-bottom:10px}\n.factor .enc{display:flex;justify-content:space-between;align-items:baseline;gap:10px;margin-bottom:9px}\n.factor .nom{font-weight:700;font-size:14px}\n.factor .peso{color:var(--tenue);font-size:11.5px;text-transform:uppercase;letter-spacing:.07em}\n.notas{display:grid;grid-template-columns:repeat(10,1fr);gap:5px}\n.notas button{background:var(--negro);border:1px solid var(--linea);color:var(--texto);\n  border-radius:8px;padding:11px 0;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit}\n.notas button:hover{border-color:var(--amarillo)}\n.notas button.sel{background:var(--amarillo);border-color:var(--amarillo);color:#000}\n.total{position:sticky;bottom:0;background:var(--carbon);border-top:2px solid var(--amarillo);\n  padding:14px 16px;margin:0 -16px -16px;display:flex;justify-content:space-between;align-items:center;gap:12px}\n.total .n{font-size:27px;font-weight:900;color:var(--amarillo);line-height:1}\n</style></head>\n<body>\n<div class=\"envoltura\">\n  <header class=\"cabecera\">\n    <div class=\"marca\"><h1>JU<span>RADO</span></h1><div class=\"sub\">EL BÚNKER · <?= alias ?></div></div>\n    <div class=\"datos-evento\" id=\"cabeceraInfo\"></div>\n  </header>\n\n  <div id=\"avisoGlobal\"></div>\n\n  <div class=\"aviso info\" style=\"font-size:13px\">\n    <b>Califica de forma independiente</b>\n    Cada factor va de 1 a 10. No veas ni comentes las notas de los otros jurados antes de deliberar.\n    Puedes corregir una calificación: la corrección queda registrada.\n  </div>\n\n  <div class=\"tarjeta\">\n    <h2>Escala común</h2>\n    <div id=\"escala\" class=\"rejilla dos\" style=\"gap:8px\"></div>\n  </div>\n\n  <div class=\"tarjeta\">\n    <h2>Participantes</h2>\n    <p class=\"pista\">Solo aparecen quienes ya pasaron por check-in. Selecciona uno para calificarlo.</p>\n    <div class=\"campo\" style=\"margin-bottom:10px\">\n      <input type=\"text\" id=\"buscar\" placeholder=\"Filtrar por código o nombre artístico\">\n    </div>\n    <div class=\"tabla-envoltura\" style=\"max-height:340px;overflow-y:auto\"><table>\n      <thead><tr><th>Código</th><th>Artista</th><th>Disciplina</th><th>Estado</th><th>Mi nota</th><th></th></tr></thead>\n      <tbody id=\"cuerpoLista\"></tbody>\n    </table></div>\n  </div>\n\n  <div id=\"tarjetaEvaluacion\"></div>\n</div>\n\n<?!= incluir('ui_scripts') ?>\n<script>\nwindow.ENTORNO = '<?= ENTORNO ?>';\nwindow.TOKEN = '<?= token ?>';\nvar DATOS = null, ACTUAL = null, PUNTAJES = {};\n\ndocument.addEventListener('DOMContentLoaded', function () {\n  cargar();\n  $('#buscar').addEventListener('input', pintarLista);\n});\n\nfunction cargar() {\n  llamar('lista_evaluacion').then(function (r) {\n    DATOS = r;\n    $('#cabeceraInfo').innerHTML = '<span class=\"chip\">Hoja <b>' + escaparHtml(r.hoja) + '</b></span>' +\n      '<span class=\"chip\">Evaluados <b id=\"nEval\">0</b></span>';\n    $('#escala').innerHTML = r.escala.map(function (e) {\n      return '<div class=\"chip\" style=\"white-space:normal\"><b>' + e.desde + '-' + e.hasta + '</b> ' +\n             escaparHtml(e.etiqueta) + '</div>';\n    }).join('');\n    pintarLista();\n  }).catch(function (e) { mostrarAviso('#avisoGlobal', 'error', 'No se pudo cargar', e.message); });\n}\n\nfunction pintarLista() {\n  if (!DATOS) return;\n  var q = ($('#buscar').value || '').toUpperCase();\n  var filas = DATOS.participantes.filter(function (p) {\n    return !q || p.code.toUpperCase().indexOf(q) !== -1 ||\n           String(p.artistic_name).toUpperCase().indexOf(q) !== -1;\n  });\n\n  var n = DATOS.participantes.filter(function (p) { return p.evaluado; }).length;\n  var cont = $('#nEval'); if (cont) cont.textContent = n + ' / ' + DATOS.participantes.length;\n\n  $('#cuerpoLista').innerHTML = filas.map(function (p) {\n    return '<tr><td><b>' + escaparHtml(p.code) + '</b></td>' +\n      '<td>' + escaparHtml(p.artistic_name) + '</td>' +\n      '<td>' + escaparHtml(p.discipline) + '</td>' +\n      '<td>' + etiquetaEstado(p.audition_status || p.attendance_status) + '</td>' +\n      '<td>' + (p.evaluado ? '<b style=\"color:var(--amarillo)\">' + p.total + '</b>' : '—') + '</td>' +\n      '<td><button class=\"boton chico ' + (p.evaluado ? 'fantasma' : '') + '\" data-code=\"' +\n        escaparHtml(p.code) + '\">' + (p.evaluado ? 'Corregir' : 'Calificar') + '</button></td></tr>';\n  }).join('') || '<tr><td colspan=\"6\" style=\"color:var(--tenue)\">Sin participantes todavía.</td></tr>';\n\n  $$('#cuerpoLista [data-code]').forEach(function (b) {\n    b.addEventListener('click', function () { abrir(b.dataset.code); });\n  });\n}\n\nfunction abrir(code) {\n  ACTUAL = DATOS.participantes.filter(function (p) { return p.code === code; })[0];\n  if (!ACTUAL) return;\n\n  PUNTAJES = {};\n  if (ACTUAL.puntajes) {\n    DATOS.rubrica.forEach(function (f) {\n      var v = Number(ACTUAL.puntajes[f.id]);\n      if (isFinite(v) && v >= 1 && v <= 10) PUNTAJES[f.id] = v;\n    });\n  }\n\n  $('#tarjetaEvaluacion').innerHTML =\n    '<div class=\"tarjeta\" style=\"border-color:var(--amarillo)\">' +\n      '<h2>' + escaparHtml(ACTUAL.code) + ' · ' + escaparHtml(ACTUAL.artistic_name) + '</h2>' +\n      '<p class=\"pista\">' + escaparHtml(ACTUAL.discipline) +\n        (ACTUAL.evaluado ? ' · <b style=\"color:var(--alerta)\">Ya calificaste a este participante. Guardar sobrescribe y deja registro.</b>' : '') +\n      '</p>' +\n      DATOS.rubrica.map(function (f) {\n        return '<div class=\"factor\" data-factor=\"' + f.id + '\">' +\n          '<div class=\"enc\"><span class=\"nom\">' + escaparHtml(f.etiqueta) + '</span>' +\n          '<span class=\"peso\">peso ' + f.peso + '%</span></div>' +\n          '<div class=\"notas\">' + [1,2,3,4,5,6,7,8,9,10].map(function (n) {\n            return '<button data-f=\"' + f.id + '\" data-n=\"' + n + '\"' +\n                   (PUNTAJES[f.id] === n ? ' class=\"sel\"' : '') + '>' + n + '</button>';\n          }).join('') + '</div></div>';\n      }).join('') +\n      '<div class=\"campo\" style=\"margin-top:14px\"><label for=\"obs\">Observaciones</label>' +\n      '<textarea id=\"obs\" maxlength=\"900\" placeholder=\"Notas para la deliberación.\">' +\n        escaparHtml(ACTUAL.observaciones || '') + '</textarea></div>' +\n      '<div class=\"total\"><div><div class=\"peso\" style=\"color:var(--tenue);font-size:11.5px\">TOTAL SOBRE 100</div>' +\n      '<div class=\"n\" id=\"totalVivo\">—</div></div>' +\n      '<button class=\"boton\" id=\"btnGuardar\" style=\"width:auto\">Guardar calificación</button></div>' +\n    '</div>';\n\n  $$('#tarjetaEvaluacion .notas button').forEach(function (b) {\n    b.addEventListener('click', function () {\n      PUNTAJES[b.dataset.f] = Number(b.dataset.n);\n      $$('.notas button[data-f=\"' + b.dataset.f + '\"]').forEach(function (x) { x.classList.remove('sel'); });\n      b.classList.add('sel');\n      recalcular();\n    });\n  });\n  $('#btnGuardar').addEventListener('click', guardar);\n  recalcular();\n  $('#tarjetaEvaluacion').scrollIntoView({ behavior: 'smooth', block: 'start' });\n}\n\n/** Mirrors the server formula exactly: (nota / 10) * peso. */\nfunction recalcular() {\n  var faltan = DATOS.rubrica.filter(function (f) { return !PUNTAJES[f.id]; });\n  if (faltan.length) {\n    $('#totalVivo').textContent = '— (faltan ' + faltan.length + ')';\n    $('#btnGuardar').disabled = true;\n    return;\n  }\n  var total = DATOS.rubrica.reduce(function (s, f) { return s + (PUNTAJES[f.id] / 10) * f.peso; }, 0);\n  $('#totalVivo').textContent = Math.round(total * 100) / 100;\n  $('#btnGuardar').disabled = false;\n}\n\nfunction guardar() {\n  var b = $('#btnGuardar');\n  ocupado(b, true, 'Guardando...');\n  var datos = { code: ACTUAL.code, observaciones: $('#obs').value };\n  DATOS.rubrica.forEach(function (f) { datos[f.id] = PUNTAJES[f.id]; });\n\n  llamar('guardar_evaluacion', datos).then(function (r) {\n    ocupado(b, false);\n    mostrarAviso('#avisoGlobal', 'ok',\n      r.corregida ? 'Calificación corregida' : 'Calificación guardada',\n      ACTUAL.code + ' — total ' + r.total + '/100.');\n    $('#tarjetaEvaluacion').innerHTML = '';\n    cargar();\n  }).catch(function (e) {\n    ocupado(b, false);\n    mostrarAviso('#avisoGlobal', 'error', 'No se pudo guardar', e.message);\n  });\n}\n</script>\n</body>\n</html>\n",
  "ui_scripts": "<script>\n/* EL BUNKER - shared client helpers. */\n\n/** Calls a server action. Same origin, so no CORS and no API key in the page. */\nfunction llamar(accion, datos) {\n  return new Promise(function (resolve, reject) {\n    var carga = Object.assign({ accion: accion, t: window.TOKEN || '' }, datos || {});\n    google.script.run\n      .withSuccessHandler(function (r) {\n        if (r && r.ok === false) reject(new Error(r.error || 'Error desconocido'));\n        else resolve(r);\n      })\n      .withFailureHandler(function (e) { reject(new Error(e.message || 'Fallo de conexion')); })\n      .api(carga);\n  });\n}\n\nfunction $(sel, raiz) { return (raiz || document).querySelector(sel); }\nfunction $$(sel, raiz) { return Array.prototype.slice.call((raiz || document).querySelectorAll(sel)); }\n\nfunction escaparHtml(v) {\n  return String(v === null || v === undefined ? '' : v)\n    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')\n    .replace(/\"/g, '&quot;').replace(/'/g, '&#39;');\n}\n\nfunction mostrarAviso(contenedor, tipo, titulo, texto) {\n  var el = typeof contenedor === 'string' ? $(contenedor) : contenedor;\n  if (!el) return;\n  el.innerHTML = '<div class=\"aviso ' + tipo + '\"><b>' + escaparHtml(titulo) + '</b>' +\n                 escaparHtml(texto || '') + '</div>';\n  el.scrollIntoView({ behavior: 'smooth', block: 'center' });\n}\n\nfunction ocupado(boton, activo, textoOcupado) {\n  if (!boton) return;\n  if (activo) {\n    boton.dataset.textoPrevio = boton.innerHTML;\n    boton.disabled = true;\n    boton.innerHTML = '<span class=\"cargando\"></span> ' + (textoOcupado || 'Procesando...');\n  } else {\n    boton.disabled = false;\n    if (boton.dataset.textoPrevio) boton.innerHTML = boton.dataset.textoPrevio;\n  }\n}\n\n/** Stable id per browser tab so a retry is recognised as the same submission. */\nfunction idEnvio(clave) {\n  var k = 'bunker_' + clave;\n  var v = null;\n  try { v = sessionStorage.getItem(k); } catch (e) { /* private mode */ }\n  if (!v) {\n    v = 'C' + Date.now().toString(36) + Math.random().toString(36).slice(2, 9);\n    try { sessionStorage.setItem(k, v); } catch (e) { /* ignore */ }\n  }\n  return v;\n}\n\nfunction nuevoIdEnvio(clave) {\n  try { sessionStorage.removeItem('bunker_' + clave); } catch (e) { /* ignore */ }\n  return idEnvio(clave);\n}\n\nfunction claseEstado(valor) {\n  return 'e-' + String(valor || '').toUpperCase().replace(/[\\s-]+/g, '');\n}\n\nfunction etiquetaEstado(valor) {\n  if (!valor) return '';\n  return '<span class=\"etiqueta ' + claseEstado(valor) + '\">' + escaparHtml(valor) + '</span>';\n}\n\n/**\n * Paints the test-environment banner.\n *\n * Production and staging are two different Apps Script projects with two\n * different spreadsheets, and their URLs look almost identical - so the only\n * reliable way to tell them apart at a glance is on screen.\n */\nfunction marcarEntorno() {\n  if (window.ENTORNO !== 'PRUEBAS') return;\n  var b = document.createElement('div');\n  b.className = 'banner-pruebas';\n  b.innerHTML = '<span>⚠ ENTORNO DE <b>PRUEBAS</b> — los datos son ficticios ' +\n                'y se pueden borrar. Esto NO es la convocatoria real.</span>';\n  document.body.insertBefore(b, document.body.firstChild);\n  document.title = '[PRUEBAS] ' + document.title;\n}\ndocument.addEventListener('DOMContentLoaded', marcarEntorno);\n\n/** Online/offline banner, shared by every panel. */\nfunction vigilarConexion(alRecuperar) {\n  var barra = document.createElement('div');\n  barra.className = 'conexion';\n  document.body.appendChild(barra);\n\n  function pintar() {\n    if (navigator.onLine) {\n      barra.className = 'conexion';\n      if (alRecuperar) alRecuperar();\n    } else {\n      barra.className = 'conexion sin';\n      barra.textContent = 'SIN CONEXION - se guarda en este dispositivo y se sincroniza al volver';\n    }\n  }\n  window.addEventListener('online', pintar);\n  window.addEventListener('offline', pintar);\n  pintar();\n  return barra;\n}\n</script>\n"
};


// ========================================================================
// 000_instalar.gs
// ========================================================================

/**
 * EL BUNKER - punto de entrada de instalacion.
 *
 * Deliberadamente es la PRIMERA funcion del archivo: el editor de Apps Script
 * preselecciona la primera funcion del proyecto, asi que quien instala solo
 * tiene que pulsar "Ejecutar" sin buscar nada en el desplegable.
 *
 * Es idempotente: se puede correr las veces que haga falta.
 */
function INSTALAR() {
  var resumen = setupInicial();
  var accesos = crearAccesosOperativos();

  var lineas = [
    '',
    '========================================================',
    '  EL BUNKER - INSTALACION COMPLETA',
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
  lineas.push('DESPUES: abre la hoja CONFIG y reemplaza cada');
  lineas.push('PENDIENTE DE COMPLETAR con el dato real aprobado.');
  lineas.push('========================================================');

  console.log(lineas.join('\n'));
  return { base: resumen.spreadsheet_url, accesos: accesos };
}

/**
 * Ensayo completo con datos ficticios: carga 130 inscripciones, emite los 100
 * codigos, simula la jornada, califica con tres jurados y produce el Top 7.
 * Para el "ensayo integral" del cronograma. Limpiar despues con
 * borrarDatosDePrueba("SI-BORRAR").
 */
function ENSAYO() {
  exigirEntornoPruebas('ENSAYO');
  return ensayoIntegral();
}

/**
 * Convierte ESTE proyecto en el entorno de PRUEBAS y lo instala.
 *
 * Se ejecuta una sola vez, en un proyecto de Apps Script NUEVO y vacio: crea su
 * propia hoja de calculo, separada de la de produccion. A partir de ahi ENSAYO y
 * LIMPIAR funcionan aqui y siguen bloqueados en produccion.
 */
function INSTALAR_PRUEBAS() {
  PropertiesService.getScriptProperties().setProperty(PROP.ENTORNO, 'PRUEBAS');
  var r = INSTALAR();
  console.log('\n*** ESTE PROYECTO ES EL ENTORNO DE PRUEBAS ***');
  console.log('Sus datos son ficticios y desechables. Produccion no se ve afectada.');
  return r;
}

/**
 * Borra los datos operativos (inscripciones, evaluaciones, incidentes, cambios,
 * bitacora) y deja CONFIG y los usuarios intactos.
 *
 * Existe como funcion sin argumentos porque el boton "Ejecutar" del editor no
 * permite pasar parametros, y es justo lo que hace falta despues del ensayo
 * integral y antes de abrir inscripciones reales.
 */
function LIMPIAR() {
  exigirEntornoPruebas('LIMPIAR');
  var r = borrarDatosDePrueba('SI-BORRAR');
  console.log('Datos operativos borrados. CONFIG y usuarios intactos.');
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

var VERSION_SISTEMA = '1.0.0';

/** Script Properties keys (the Apps Script equivalent of environment vars). */
var PROP = {
  SPREADSHEET_ID: 'SPREADSHEET_ID',
  SECRETO_HMAC: 'SECRETO_HMAC',
  CARPETA_BACKUPS: 'CARPETA_BACKUPS',
  SITIO_PUBLICO: 'SITIO_PUBLICO',
  ENTORNO: 'ENTORNO'
};

/**
 * PRUEBAS o PRODUCCION. Cada entorno es un proyecto de Apps Script distinto,
 * con su propia hoja de calculo: no comparten ni una fila.
 *
 * Por defecto PRODUCCION. Un entorno solo es de pruebas si alguien lo declaro
 * explicitamente, de modo que olvidarse nunca convierte produccion en un
 * sitio donde se pueden borrar datos.
 */
function entorno() {
  var v = PropertiesService.getScriptProperties().getProperty(PROP.ENTORNO);
  return normalizarComparable(v) === 'PRUEBAS' ? 'PRUEBAS' : 'PRODUCCION';
}

function esPruebas() {
  return entorno() === 'PRUEBAS';
}

/**
 * Corta cualquier operacion destructiva fuera del entorno de pruebas.
 * Es un gate ejecutable, no una advertencia en la documentacion: cargar datos
 * ficticios o vaciar las hojas en produccion arruinaria la convocatoria, y una
 * nota en un manual no lo impide.
 */
function exigirEntornoPruebas(operacion) {
  if (esPruebas()) return true;
  throw new Error(
    'BLOQUEADO: "' + operacion + '" solo puede correr en el entorno de PRUEBAS.\n' +
    'Este proyecto es PRODUCCION y contiene (o contendra) inscripciones reales.\n\n' +
    'Si de verdad quieres hacerlo aqui, cambia ENTORNO a PRUEBAS en\n' +
    'Configuracion del proyecto > Propiedades del script. Piensalo dos veces.');
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
 *  3. A row that ALREADY has a code keeps it forever - a code is never reused,
 *     never renumbered and never freed, even if the row is later disqualified.
 *  4. At most `cupo` codes exist. Overflow rows get LISTA_ESPERA, never a code.
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

  // --- 2. Candidates, in submission order. ----------------------------------
  var candidatos = registros.filter(function (r) {
    if (normalizarTexto(r.code)) return false;                       // already has one
    if (r.duplicate_flag === true || normalizarComparable(r.duplicate_flag) === 'TRUE') return false;
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

// ========================================================================
// 03_core_agenda.gs
// ========================================================================

/**
 * EL BUNKER - Core: blocks, times and schedule-change rules.
 * PURE FUNCTIONS ONLY.
 */

/** Auditions run 16:00-21:00 in ten 30-minute blocks of ten codes. */
var AGENDA_DEFECTO = {
  inicio_minutos: 16 * 60,        // 16:00
  duracion_bloque: 30,            // minutes
  bloques: 10,
  cupo_por_bloque: 10,
  antelacion_llegada: 15,         // minutes before the block starts
  contingencia_inicio: 21 * 60,   // 21:00
  contingencia_fin: 21 * 60 + 30, // 21:30 - hard close
  tolerancia_minutos: 5
};

function minutosAHora(minutos) {
  var h = Math.floor(minutos / 60);
  var m = minutos % 60;
  return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
}

function horaAMinutos(hora) {
  var m = String(hora || '').match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
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

/** The ten blocks, ready to render in the AGENDA sheet or the public page. */
function construirAgenda(cfg) {
  var c = cfg || AGENDA_DEFECTO;
  var filas = [];
  for (var b = 1; b <= c.bloques; b++) filas.push(horarioDeBloque(b, c));
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
             mensaje: 'No encontramos ese codigo. Verifica el mensaje que recibiste.' };
  }
  if (!normalizarTexto(registro.code)) {
    return { permitido: false, motivo: 'SIN_CODIGO',
             mensaje: 'Este registro aun no tiene codigo asignado.' };
  }
  if (esVerdadero(solicitud.can_attend_original)) {
    return { permitido: false, motivo: 'SI_PUEDE_ASISTIR',
             mensaje: 'El formulario de cambio es solo para quien NO puede asistir en su horario.' };
  }
  var estadoActual = normalizarComparable(registro.change_status || ESTADO_CAMBIO.SIN_SOLICITUD);
  if (estadoActual !== ESTADO_CAMBIO.SIN_SOLICITUD && estadoActual !== '') {
    return { permitido: false, motivo: 'YA_SOLICITO',
             mensaje: 'Ya registramos una solicitud de cambio para este codigo. Solo se permite una.' };
  }
  if (cierre && ahora.getTime() > cierre.getTime()) {
    return { permitido: false, motivo: 'FUERA_DE_PLAZO',
             mensaje: 'El plazo para solicitar cambios ya cerro. El dia del evento no hay cambios ordinarios.' };
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
  for (var b = 1; b <= c.bloques; b++) conteo[b] = 0;

  for (var i = 0; i < registros.length; i++) {
    var r = registros[i];
    if (!normalizarTexto(r.code)) continue;
    var bloque = parseInt(r.final_block || r.original_block || bloqueDeNumero(numeroDeCodigo(r.code), c), 10);
    if (conteo[bloque] !== undefined) conteo[bloque]++;
  }

  var libres = [];
  for (var k = 1; k <= c.bloques; k++) {
    var h = horarioDeBloque(k, c);
    libres.push({
      block_id: k,
      ventana: h.ventana,
      ocupados: conteo[k],
      cupo: c.cupo_por_bloque,
      disponibles: Math.max(0, c.cupo_por_bloque - conteo[k])
    });
  }
  return libres;
}

/** Applies an approved change: the code never moves, only the block/time does. */
function aplicarCambio(registro, nuevoBloque, opciones) {
  opciones = opciones || {};
  var cfg = opciones.agenda || AGENDA_DEFECTO;
  var h = horarioDeBloque(parseInt(nuevoBloque, 10), cfg);
  if (!h) return { ok: false, mensaje: 'Bloque destino invalido.' };

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

// ========================================================================
// 04_core_rubrica.gs
// ========================================================================

/**
 * EL BUNKER - Core: scoring rubric, consolidation and final selection.
 * PURE FUNCTIONS ONLY.
 */

/** Weights sum to 100. Order matters: it is the tie-break order's source. */
var RUBRICA = [
  { id: 'talento',       etiqueta: 'Talento / ejecucion',        peso: 20 },
  { id: 'performance',   etiqueta: 'Performance',                peso: 20 },
  { id: 'identidad',     etiqueta: 'Identidad artistica',        peso: 15 },
  { id: 'repertorio',    etiqueta: 'Repertorio / originalidad',  peso: 10 },
  { id: 'profesionalismo', etiqueta: 'Profesionalismo',          peso: 10 },
  { id: 'presencia',     etiqueta: 'Presencia escenica',         peso: 10 },
  { id: 'digital',       etiqueta: 'Presencia digital / comunidad', peso: 5 },
  { id: 'proyecto',      etiqueta: 'Proyecto / compromiso',      peso: 10 }
];

/** Documented tie-break ladder: Performance > Talento > Identidad > committee. */
var ORDEN_DESEMPATE = ['performance', 'talento', 'identidad'];

var ESCALA = [
  { desde: 1, hasta: 3,  etiqueta: 'Deficiente / evidencia insuficiente' },
  { desde: 4, hasta: 6,  etiqueta: 'Base con limitaciones' },
  { desde: 7, hasta: 8,  etiqueta: 'Buen nivel consistente' },
  { desde: 9, hasta: 10, etiqueta: 'Sobresaliente / diferenciado' }
];

function pesoTotalRubrica(rubrica) {
  return (rubrica || RUBRICA).reduce(function (s, f) { return s + f.peso; }, 0);
}

function esPuntajeValido(valor) {
  var n = Number(valor);
  return isFinite(n) && n >= 1 && n <= 10;
}

/**
 * One juror's score for one artist.
 * factor_points = (score / 10) * weight  ->  juror_total is on a 0-100 scale.
 * Returns { valido, total, detalle, faltantes } - an incomplete card is INVALID
 * and must not silently count as a low score.
 */
function calcularPuntajeJurado(puntajes, rubrica) {
  var r = rubrica || RUBRICA;
  var detalle = [];
  var faltantes = [];
  var total = 0;

  for (var i = 0; i < r.length; i++) {
    var factor = r[i];
    var bruto = puntajes ? puntajes[factor.id] : undefined;

    if (!esPuntajeValido(bruto)) {
      faltantes.push(factor.id);
      detalle.push({ id: factor.id, score: null, peso: factor.peso, puntos: 0 });
      continue;
    }
    var puntos = (Number(bruto) / 10) * factor.peso;
    total += puntos;
    detalle.push({ id: factor.id, score: Number(bruto), peso: factor.peso, puntos: redondear(puntos, 4) });
  }

  return {
    valido: faltantes.length === 0,
    total: faltantes.length === 0 ? redondear(total, 4) : null,
    detalle: detalle,
    faltantes: faltantes
  };
}

function redondear(n, decimales) {
  var f = Math.pow(10, decimales === undefined ? 2 : decimales);
  return Math.round(n * f) / f;
}

/**
 * Consolidates the three jurors for one artist.
 * artist_final = mean of the VALID juror totals. Invalid/absent cards are
 * excluded from the denominator, never counted as zero.
 */
function consolidarArtista(tarjetas, rubrica) {
  var validas = [];
  var porFactor = {};
  var r = rubrica || RUBRICA;
  for (var f = 0; f < r.length; f++) porFactor[r[f].id] = [];

  for (var i = 0; i < tarjetas.length; i++) {
    var calculo = calcularPuntajeJurado(tarjetas[i].puntajes, r);
    if (!calculo.valido) continue;
    validas.push({ jurado: tarjetas[i].jurado, total: calculo.total });
    for (var d = 0; d < calculo.detalle.length; d++) {
      var det = calculo.detalle[d];
      porFactor[det.id].push(det.score);
    }
  }

  var promedioFactor = {};
  for (var key in porFactor) {
    if (!porFactor.hasOwnProperty(key)) continue;
    promedioFactor[key] = porFactor[key].length
      ? redondear(porFactor[key].reduce(function (s, v) { return s + v; }, 0) / porFactor[key].length, 4)
      : null;
  }

  var suma = validas.reduce(function (s, v) { return s + v.total; }, 0);

  return {
    jurados_validos: validas.length,
    totales_jurado: validas,
    artist_final: validas.length ? redondear(suma / validas.length, 2) : null,
    promedio_por_factor: promedioFactor
  };
}

/**
 * Ranks artists and returns the top N.
 *
 * Only auditions marked REALIZADA with at least `minimo_jurados` valid cards
 * enter the ranking - the spec is explicit that a participant who did not
 * audition cannot be selected.
 *
 * Ties are broken by the documented ladder; anything still tied afterwards is
 * surfaced in `empates_sin_resolver` for a minuted committee decision. The
 * function never invents a winner.
 */
function seleccionarTop(artistas, opciones) {
  opciones = opciones || {};
  var n = opciones.top || 7;
  var minimoJurados = opciones.minimo_jurados === undefined ? 2 : opciones.minimo_jurados;
  var rubrica = opciones.rubrica || RUBRICA;

  var elegibles = [];
  var excluidos = [];

  for (var i = 0; i < artistas.length; i++) {
    var a = artistas[i];
    var estado = normalizarComparable(a.audition_status);
    if (estado !== 'REALIZADA') {
      excluidos.push({ code: a.code, motivo: 'AUDICION_NO_REALIZADA', estado: a.audition_status || '' });
      continue;
    }
    var c = consolidarArtista(a.tarjetas || [], rubrica);
    if (c.jurados_validos < minimoJurados) {
      excluidos.push({ code: a.code, motivo: 'JURADOS_INSUFICIENTES', jurados_validos: c.jurados_validos });
      continue;
    }
    elegibles.push({
      code: a.code,
      artistic_name: a.artistic_name || '',
      full_name: a.full_name || '',
      discipline: a.discipline || '',
      artist_final: c.artist_final,
      jurados_validos: c.jurados_validos,
      promedio_por_factor: c.promedio_por_factor,
      totales_jurado: c.totales_jurado
    });
  }

  elegibles.sort(function (a, b) { return compararArtistas(a, b); });

  for (var p = 0; p < elegibles.length; p++) elegibles[p].posicion = p + 1;

  var top = elegibles.slice(0, n);
  var empatesSinResolver = detectarEmpateEnCorte(elegibles, n);

  return {
    top: top,
    ranking: elegibles,
    excluidos: excluidos,
    empates_sin_resolver: empatesSinResolver,
    requiere_comite: empatesSinResolver.length > 0
  };
}

/** Descending by final score, then down the documented tie-break ladder. */
function compararArtistas(a, b) {
  if (b.artist_final !== a.artist_final) return b.artist_final - a.artist_final;

  for (var i = 0; i < ORDEN_DESEMPATE.length; i++) {
    var id = ORDEN_DESEMPATE[i];
    var va = a.promedio_por_factor[id];
    var vb = b.promedio_por_factor[id];
    if (va === null || vb === null || va === undefined || vb === undefined) continue;
    if (vb !== va) return vb - va;
  }
  return 0;                                   // genuinely tied -> committee
}

/**
 * Detects a tie straddling the cut line (position n / n+1) that the ladder
 * could not break. That is the only tie that actually changes the outcome.
 */
function detectarEmpateEnCorte(ranking, n) {
  if (ranking.length <= n) return [];
  var dentro = ranking[n - 1];
  var fuera = ranking[n];
  if (compararArtistas(dentro, fuera) !== 0) return [];

  var empatados = ranking.filter(function (a) { return compararArtistas(a, dentro) === 0; });
  return empatados.map(function (a) {
    return { code: a.code, artistic_name: a.artistic_name, artist_final: a.artist_final, posicion: a.posicion };
  });
}

/** Buckets for the distribution chart on the dashboard. */
function distribucionPuntajes(ranking, rangos) {
  var bandas = rangos || [
    { etiqueta: '0-39', desde: 0,  hasta: 39.999 },
    { etiqueta: '40-59', desde: 40, hasta: 59.999 },
    { etiqueta: '60-69', desde: 60, hasta: 69.999 },
    { etiqueta: '70-79', desde: 70, hasta: 79.999 },
    { etiqueta: '80-89', desde: 80, hasta: 89.999 },
    { etiqueta: '90-100', desde: 90, hasta: 100 }
  ];
  return bandas.map(function (b) {
    return {
      etiqueta: b.etiqueta,
      conteo: ranking.filter(function (a) {
        return a.artist_final >= b.desde && a.artist_final <= b.hasta;
      }).length
    };
  });
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
  'CHECK-IN':        ['REALIZADA', 'CONTINGENCIA', 'NO SHOW', 'INCIDENTE'],
  'CONTINGENCIA':    ['CHECK-IN', 'REALIZADA', 'NO AUDICIONADO', 'INCIDENTE'],
  'NO SHOW':         ['CONTINGENCIA', 'NO AUDICIONADO', 'INCIDENTE'],
  'REALIZADA':       ['INCIDENTE'],
  'NO AUDICIONADO':  ['INCIDENTE'],
  'INCIDENTE':       ['CHECK-IN', 'CONTINGENCIA', 'REALIZADA', 'NO AUDICIONADO', 'NO SHOW']
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
           mensaje: 'Llego ' + retraso + ' min tarde (mas de ' + c.tolerancia_minutos +
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
 * Hard close at 21:30: nobody starts a new audition after this.
 * Everyone still pending becomes NO AUDICIONADO, which excludes them from the
 * selection - exactly as the spec requires.
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
    if (estado === ESTADO.REALIZADA || estado === ESTADO.NO_AUDICIONADO) continue;

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
// 10_db.gs
// ========================================================================

/**
 * EL BUNKER - Data access layer over Google Sheets.
 *
 * Everything that writes goes through conBloqueo() so two simultaneous
 * submissions can never interleave an append and corrupt the code sequence.
 */

function libro() {
  var id = PropertiesService.getScriptProperties().getProperty(PROP.SPREADSHEET_ID);
  if (!id) throw new Error('SPREADSHEET_ID no configurado. Corre setupInicial() una vez.');
  return SpreadsheetApp.openById(id);
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

/** Header row of a sheet, as an array of column names. */
function encabezados(nombreHoja) {
  var h = hoja(nombreHoja);
  var ultima = h.getLastColumn();
  if (ultima === 0) return [];
  return h.getRange(1, 1, 1, ultima).getValues()[0].map(function (c) { return String(c).trim(); });
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

function zonaHoraria() {
  try { return libro().getSpreadsheetTimeZone() || 'America/Bogota'; }
  catch (e) { return 'America/Bogota'; }
}

/** Appends one object as a row, respecting the sheet's header order. */
function agregarFila(nombreHoja, objeto) {
  var h = hoja(nombreHoja);
  var cols = encabezados(nombreHoja);
  var fila = cols.map(function (c) {
    var v = objeto[c];
    if (v === undefined || v === null) return '';
    if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
    return v;
  });
  h.appendRow(fila);
  return h.getLastRow();
}

/** Appends many rows in ONE write - the only way to stay inside the time limit. */
function agregarFilas(nombreHoja, objetos) {
  if (!objetos.length) return 0;
  var h = hoja(nombreHoja);
  var cols = encabezados(nombreHoja);
  var matriz = objetos.map(function (o) {
    return cols.map(function (c) {
      var v = o[c];
      if (v === undefined || v === null) return '';
      if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
      return v;
    });
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
    var v = cambios[clave];
    if (typeof v === 'boolean') v = v ? 'TRUE' : 'FALSE';
    h.getRange(numeroFila, idx + 1).setValue(v === undefined || v === null ? '' : v);
  }
  return numeroFila;
}

/** Batched version: one setValues call per contiguous column, for 100 rows. */
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
      if (!porColumna[idx]) porColumna[idx] = [];
      var v = u.cambios[clave];
      if (typeof v === 'boolean') v = v ? 'TRUE' : 'FALSE';
      porColumna[idx].push({ fila: u.fila, valor: v === undefined || v === null ? '' : v });
    }
  });

  var escrituras = 0;
  for (var idx in porColumna) {
    if (!porColumna.hasOwnProperty(idx)) continue;
    porColumna[idx].forEach(function (e) {
      h.getRange(e.fila, Number(idx) + 1).setValue(e.valor);
      escrituras++;
    });
  }
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

  // A revoked user keeps a valid signature, so the sheet is the final word.
  if (!usuarioActivo(datos.a)) return { ok: false, motivo: 'USUARIO_INACTIVO' };

  return { ok: true, rol: datos.r, alias: datos.a, expira: datos.e };
}

function usuarioActivo(alias) {
  var usuarios = leerHoja(HOJA.USUARIOS);
  if (!usuarios.length) return true;                       // not provisioned yet
  for (var i = 0; i < usuarios.length; i++) {
    if (normalizarComparable(usuarios[i].email_o_alias) === normalizarComparable(alias)) {
      return normalizarComparable(usuarios[i].activo) !== 'NO' &&
             normalizarComparable(usuarios[i].activo) !== 'FALSE';
    }
  }
  return false;
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

var PAGINAS_PUBLICAS = ['inscripcion', 'cambio-horario', 'gracias', 'estado'];

/**
 * Which roles may OPEN each internal page.
 *
 * A valid token is not enough: without this table any signed token opened any
 * panel. The actions were still refused by exigir(), so no data leaked, but a
 * juror could load the admin shell - confusing, and one missing check away from
 * being a real hole.
 */
var ROLES_POR_PAGINA = {
  'admin':     [ROL.ADMIN, ROL.LOGISTICA],
  'checkin':   [ROL.ADMIN, ROL.LOGISTICA, ROL.CHECKIN],
  'jurado':    [ROL.ADMIN, ROL.JURADO],
  'dashboard': [ROL.ADMIN, ROL.DIRECCION, ROL.LOGISTICA]
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
      'admin':          'ui_admin',
      'checkin':        'ui_checkin',
      'jurado':         'ui_jurado',
      'dashboard':      'ui_dashboard'
    }[pagina];

    if (!plantilla) return renderizar('ui_403', { motivo: 'PAGINA_DESCONOCIDA' });

    return renderizar(plantilla, {
      token: params.t || '',
      rol: sesion.ok ? sesion.rol : '',
      alias: sesion.ok ? sesion.alias : '',
      codigo: params.code || ''
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

/** Actions that do not require a token. Everything else does. */
var ACCIONES_PUBLICAS = {
  'inscribir': true,
  'solicitar_cambio': true,
  'consultar_estado': true,
  'agenda_publica': true,
  'config_publica': true
};

/** accion -> { capacidad, fn }. capacidad null means public. */
function tablaAcciones() {
  return {
    // ---- public -----------------------------------------------------------
    'inscribir':          { capacidad: null, fn: accionInscribir },
    'solicitar_cambio':   { capacidad: null, fn: accionSolicitarCambio },
    'consultar_estado':   { capacidad: null, fn: accionConsultarEstado },
    'agenda_publica':     { capacidad: null, fn: accionAgendaPublica },
    'config_publica':     { capacidad: null, fn: accionConfigPublica },

    // ---- logistics / admin ------------------------------------------------
    'listar_registro':    { capacidad: 'registro_lectura',   fn: accionListarRegistro },
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

    // ---- check-in desk ----------------------------------------------------
    'buscar_participante':{ capacidad: 'checkin',   fn: accionBuscarParticipante },
    'registrar_estado':   { capacidad: 'checkin',   fn: accionRegistrarEstado },
    'roster_checkin':     { capacidad: 'checkin',   fn: accionRosterCheckin },
    'sincronizar_cola':   { capacidad: 'checkin',   fn: accionSincronizarCola },
    'plan_contingencia':  { capacidad: 'checkin',   fn: accionPlanContingencia },
    'cerrar_jornada':     { capacidad: 'registro_escritura', fn: accionCerrarJornada },
    'nuevo_incidente':    { capacidad: 'incidentes', fn: accionNuevoIncidente },

    // ---- jury -------------------------------------------------------------
    'lista_evaluacion':   { capacidad: 'evaluar',   fn: accionListaEvaluacion },
    'guardar_evaluacion': { capacidad: 'evaluar',   fn: accionGuardarEvaluacion },

    // ---- results / dashboard ---------------------------------------------
    'dashboard':          { capacidad: 'dashboard', fn: accionDashboard },
    'resultados':         { capacidad: 'resultados', fn: accionResultados }
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
  t.BASE_URL = ScriptApp.getService().getUrl();
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

// ========================================================================
// 21_api_publico.gs
// ========================================================================

/**
 * EL BUNKER - Public actions: registration, schedule-change request, status.
 */

/**
 * Form 1. Validates server-side, stores ALWAYS (never silently rejects), and
 * returns a verdict the participant can understand.
 *
 * The code is NOT issued here: the spec assigns codes after validation, in a
 * deliberate operator-run batch, so a wave of submissions cannot burn the 100
 * seats on rows that later turn out to be duplicates.
 */
function accionInscribir(datos) {
  if (!cfgBool('inscripciones_abiertas', true)) {
    return { ok: false, error: 'Las inscripciones estan cerradas.', cerrado: true };
  }

  // The client sends a UUID it keeps across retries; a double tap is one row.
  var claveIdem = 'inscripcion:' + (datos.client_submission_id || Utilities.getUuid());

  return unaSolaVez(claveIdem, function () {
    return conBloqueo(function () {
      var opciones = opcionesValidacion();
      var veredicto = validarInscripcion(datos, opciones);

      var candidato = {
        submission_id: nuevoId('S'),
        normalized_id_number: normalizarCedula(datos.id_number),
        normalized_email: normalizarEmail(datos.email),
        normalized_phone: normalizarTelefono(datos.whatsapp)
      };

      var existentes = leerHoja(HOJA.REGISTRO);
      var dup = detectarDuplicado(candidato, existentes);

      var estado = veredicto.eligibility_status;
      if (dup.duplicate_flag) estado = ESTADO_ELEGIBILIDAD.DUPLICADO;
      else if (dup.alerta && estado === ESTADO_ELEGIBILIDAD.APTO) estado = ESTADO_ELEGIBILIDAD.REVISION;

      var notas = []
        .concat(veredicto.errores.map(function (x) { return x.campo + ':' + x.codigo; }))
        .concat(veredicto.avisos.map(function (x) { return x.campo + ':' + x.codigo; }));
      if (dup.duplicate_reason) notas.push(dup.duplicate_reason);

      agregarFila(HOJA.REGISTRO, {
        submission_id: candidato.submission_id,
        code: '',
        created_at: ahoraISO(),
        source: datos.source || 'web',
        full_name: normalizarTexto(datos.full_name),
        id_number: normalizarTexto(datos.id_number),
        birth_date: normalizarTexto(datos.birth_date),
        age: veredicto.edad === null ? '' : veredicto.edad,
        neighborhood_sector: normalizarTexto(datos.neighborhood_sector),
        residence: esVerdadero(datos.resides_in_sabaneta) ? cfg('municipio', 'Sabaneta') : 'FUERA',
        email: normalizarTexto(datos.email),
        whatsapp: normalizarTexto(datos.whatsapp),
        artistic_name: normalizarTexto(datos.artistic_name),
        discipline: normalizarTexto(datos.discipline),
        genre_or_proposal: normalizarTexto(datos.genre_or_proposal),
        artist_description: normalizarTexto(datos.artist_description),
        audition_description: normalizarTexto(datos.audition_description),
        video_url: normalizarTexto(datos.video_url),
        technical_needs: normalizarTexto(datos.technical_needs),
        normalized_id_number: candidato.normalized_id_number,
        normalized_email: candidato.normalized_email,
        normalized_phone: candidato.normalized_phone,
        eligibility_status: estado,
        duplicate_flag: dup.duplicate_flag,
        duplicate_reason: dup.duplicate_reason,
        registro_principal: dup.registro_principal,
        validation_notes: notas.join(' | '),
        consent_terms: esVerdadero(datos.accept_terms),
        consent_data: esVerdadero(datos.accept_data_processing),
        consent_whatsapp: esVerdadero(datos.accept_whatsapp_operational),
        consent_image: esVerdadero(datos.accept_image_voice),
        consent_version: cfg('consent_version', 'v1-PENDIENTE'),
        availability_statement: esVerdadero(datos.availability_statement),
        attendance_status: '',
        audition_status: '',
        change_status: ESTADO_CAMBIO.SIN_SOLICITUD,
        notes: ''
      });

      registrar('participante', '', 'INSCRIPCION', candidato.submission_id, 'estado=' + estado);

      return {
        submission_id: candidato.submission_id,
        eligibility_status: estado,
        edad: veredicto.edad,
        errores: veredicto.errores,
        avisos: veredicto.avisos,
        duplicado: dup.duplicate_flag,
        mensaje: mensajeVeredicto(estado, veredicto, dup)
      };
    });
  });
}

function mensajeVeredicto(estado, veredicto, dup) {
  if (estado === ESTADO_ELEGIBILIDAD.APTO) {
    return 'Recibimos tu inscripcion. Si quedas dentro de los 100 cupos te enviaremos tu codigo y tu horario.';
  }
  if (estado === ESTADO_ELEGIBILIDAD.DUPLICADO) {
    return 'Ya tenemos una inscripcion registrada con este documento. Conservamos la primera; no necesitas volver a inscribirte.';
  }
  if (estado === ESTADO_ELEGIBILIDAD.NO_CUMPLE) {
    var reglas = veredicto.errores.filter(function (e) { return e.codigo === 'EDAD' || e.codigo === 'RESIDENCIA'; });
    return reglas.length ? reglas[0].mensaje : 'Tu inscripcion no cumple los requisitos de la convocatoria.';
  }
  if (estado === ESTADO_ELEGIBILIDAD.INCOMPLETO) {
    return 'Faltan datos obligatorios. Revisa los campos marcados y vuelve a enviar.';
  }
  return 'Recibimos tu inscripcion y quedo en revision. Te contactaremos si necesitamos verificar algo.';
}

/**
 * Form 2. Records the request only; the new slot is decided by production,
 * never chosen by the participant.
 */
function accionSolicitarCambio(datos) {
  if (!cfgBool('cambios_abiertos', true)) {
    return { ok: false, error: 'El plazo para solicitar cambios de horario ya cerro.', cerrado: true };
  }

  var claveIdem = 'cambio:' + normalizarComparable(datos.participant_code) + ':' + (datos.client_submission_id || '');

  return unaSolaVez(claveIdem, function () {
    return conBloqueo(function () {
      var registro = buscarPorCodigo(datos.participant_code);
      var permiso = puedeSolicitarCambio(registro, datos, {
        ahora: ahoraISO(),
        cierre_cambios: cfg('cierre_cambios', '')
      });

      if (!permiso.permitido) {
        return { ok: false, error: permiso.mensaje, motivo: permiso.motivo };
      }

      // Guard against someone else guessing a code: the name must match.
      if (normalizarComparable(datos.full_name) !== normalizarComparable(registro.full_name)) {
        registrar('participante', '', 'CAMBIO_NOMBRE_NO_COINCIDE', datos.participant_code, '');
        return { ok: false, error: 'El nombre no coincide con el registrado para ese codigo.', motivo: 'NOMBRE_NO_COINCIDE' };
      }

      var solicitudId = nuevoId('CB');
      var horario = horarioDeCodigo(registro.code, agendaConfigurada());

      agregarFila(HOJA.CAMBIOS, {
        solicitud_id: solicitudId,
        at: ahoraISO(),
        code: registro.code,
        full_name: registro.full_name,
        original_block: registro.original_block || (horario ? horario.block_id : ''),
        original_time: registro.original_time || (horario ? horario.audition_time : ''),
        can_attend_original: 'FALSE',
        reason_short: String(datos.reason_short || '').slice(0, 400),
        contact: normalizarTexto(datos.contact),
        acceptance: esVerdadero(datos.acceptance) ? 'TRUE' : 'FALSE',
        estado: ESTADO_CAMBIO.PENDIENTE,
        nuevo_bloque: '', nueva_hora: '', resuelto_at: '', resuelto_by: '', observacion: ''
      });

      actualizarFila(HOJA.REGISTRO, registro._fila, {
        change_requested: 'TRUE',
        change_status: ESTADO_CAMBIO.PENDIENTE
      });

      registrar('participante', '', 'SOLICITUD_CAMBIO', registro.code, solicitudId);

      return {
        solicitud_id: solicitudId,
        estado: ESTADO_CAMBIO.PENDIENTE,
        mensaje: 'Registramos tu solicitud. Produccion te confirmara por WhatsApp o correo si es APROBADA o NO APROBADA. ' +
                 'Mientras tanto tu horario original sigue vigente.'
      };
    });
  });
}

/** Lets a participant check their own code/slot without exposing anybody else. */
function accionConsultarEstado(datos) {
  var registro = null;
  if (datos.code) registro = buscarPorCodigo(datos.code);
  else if (datos.id_number) registro = buscarPorCedula(datos.id_number);

  if (!registro) return { ok: false, error: 'No encontramos un registro con esos datos.' };

  // Identity check: knowing a code is not enough to read someone's data.
  if (normalizarCedula(datos.id_number) !== normalizarCedula(registro.id_number)) {
    return { ok: false, error: 'Los datos no coinciden. Verifica tu documento y tu codigo.' };
  }

  return {
    code: registro.code || '',
    eligibility_status: registro.eligibility_status,
    bloque: registro.final_block || registro.original_block || '',
    hora_llegada: registro.arrival_time || '',
    hora_audicion: registro.final_time || registro.original_time || '',
    change_status: registro.change_status || ESTADO_CAMBIO.SIN_SOLICITUD,
    attendance_status: registro.attendance_status || ''
  };
}

function accionAgendaPublica() {
  return { agenda: construirAgenda(agendaConfigurada()) };
}

/** Only the values meant to be public; the CONFIG sheet also holds internals. */
function accionConfigPublica() {
  return {
    evento: {
      nombre: cfg('evento_nombre', 'EL BUNKER'),
      fecha: cfg('evento_fecha', ''),
      hora_inicio: cfg('evento_hora_inicio', ''),
      hora_fin: cfg('evento_hora_fin', ''),
      sede: cfg('evento_sede', 'PENDIENTE DE COMPLETAR'),
      municipio: cfg('municipio', 'Sabaneta'),
      edad_minima: cfgNumero('edad_minima', 18),
      edad_maxima: cfgNumero('edad_maxima', 28),
      duracion_audicion: cfgNumero('duracion_audicion_min', 3),
      cupo: cfgNumero('cupo_total', 100),
      top: cfgNumero('top_seleccionados', 7)
    },
    legal: {
      legal_name: cfg('legal_name', 'PENDIENTE DE COMPLETAR'),
      data_protection_email: cfg('data_protection_email', 'PENDIENTE DE COMPLETAR'),
      institutional_phone: cfg('institutional_phone', 'PENDIENTE DE COMPLETAR'),
      terms_url: cfg('terms_url', ''),
      privacy_policy_url: cfg('privacy_policy_url', ''),
      consent_version: cfg('consent_version', 'v1-PENDIENTE')
    },
    entorno: entorno(),
    abierto: cfgBool('inscripciones_abiertas', true),
    cambios_abiertos: cfgBool('cambios_abiertos', true)
  };
}

// ========================================================================
// 22_api_admin.gs
// ========================================================================

/**
 * EL BUNKER - Logistics and admin actions.
 * Everything a non-technical coordinator needs, with no SQL and no code edits.
 */

function accionListarRegistro(datos, sesion) {
  var filas = leerHoja(HOJA.REGISTRO);
  var filtro = normalizarComparable(datos.filtro || '');
  var busqueda = normalizarComparable(datos.q || '');

  var vista = filas.filter(function (r) {
    if (filtro && filtro !== 'TODOS' && normalizarComparable(r.eligibility_status) !== filtro) return false;
    if (!busqueda) return true;
    return normalizarComparable(r.full_name).indexOf(busqueda) !== -1 ||
           normalizarComparable(r.code).indexOf(busqueda) !== -1 ||
           normalizarCedula(r.id_number).indexOf(normalizarCedula(datos.q)) !== -1 ||
           normalizarComparable(r.artistic_name).indexOf(busqueda) !== -1;
  });

  return {
    total: filas.length,
    mostrados: vista.length,
    resumen: resumenElegibilidad(filas),
    filas: vista.map(function (r) {
      return {
        fila: r._fila, submission_id: r.submission_id, code: r.code,
        created_at: r.created_at, full_name: r.full_name, id_number: r.id_number,
        age: r.age, neighborhood_sector: r.neighborhood_sector, email: r.email,
        whatsapp: r.whatsapp, artistic_name: r.artistic_name, discipline: r.discipline,
        video_url: r.video_url, eligibility_status: r.eligibility_status,
        duplicate_flag: r.duplicate_flag, duplicate_reason: r.duplicate_reason,
        validation_notes: r.validation_notes,
        original_block: r.original_block, original_time: r.original_time,
        final_block: r.final_block, final_time: r.final_time,
        change_status: r.change_status, attendance_status: r.attendance_status
      };
    })
  };
}

function resumenElegibilidad(filas) {
  var r = { total: filas.length, apto: 0, incompleto: 0, no_cumple: 0, revision: 0,
            duplicado: 0, con_codigo: 0, unicos: 0 };
  var cedulas = {};
  filas.forEach(function (f) {
    var e = normalizarComparable(f.eligibility_status);
    if (e === 'APTO') r.apto++;
    else if (e === 'INCOMPLETO') r.incompleto++;
    else if (e === 'NO_CUMPLE') r.no_cumple++;
    else if (e === 'REVISION') r.revision++;
    else if (e === 'DUPLICADO') r.duplicado++;
    if (normalizarTexto(f.code)) r.con_codigo++;
    var c = normalizarCedula(f.id_number);
    if (c) cedulas[c] = true;
  });
  r.unicos = Object.keys(cedulas).length;
  return r;
}

/** Re-runs validation over every row, e.g. after changing the age range in CONFIG. */
function accionRevalidarTodo(datos, sesion) {
  return conBloqueo(function () {
    invalidarCacheConfig();
    var opciones = opcionesValidacion();
    var filas = leerHoja(HOJA.REGISTRO);
    var vistos = [];
    var actualizaciones = [];

    filas.forEach(function (r) {
      var veredicto = validarInscripcion({
        full_name: r.full_name, id_number: r.id_number, birth_date: r.birth_date,
        neighborhood_sector: r.neighborhood_sector,
        resides_in_sabaneta: normalizarComparable(r.residence) !== 'FUERA' && normalizarTexto(r.residence) !== '',
        email: r.email, whatsapp: r.whatsapp, discipline: r.discipline,
        audition_description: r.audition_description, video_url: r.video_url,
        availability_statement: r.availability_statement,
        accept_terms: r.consent_terms, accept_data_processing: r.consent_data
      }, opciones);

      var candidato = {
        submission_id: r.submission_id,
        normalized_id_number: normalizarCedula(r.id_number),
        normalized_email: normalizarEmail(r.email),
        normalized_phone: normalizarTelefono(r.whatsapp)
      };
      var dup = detectarDuplicado(candidato, vistos);
      vistos.push(candidato);

      var estado = veredicto.eligibility_status;
      if (dup.duplicate_flag) estado = ESTADO_ELEGIBILIDAD.DUPLICADO;
      else if (dup.alerta && estado === ESTADO_ELEGIBILIDAD.APTO) estado = ESTADO_ELEGIBILIDAD.REVISION;

      // A row that already holds a code keeps its seat: re-validation informs,
      // it does not retroactively strip an issued code.
      if (normalizarTexto(r.code) && estado === ESTADO_ELEGIBILIDAD.DUPLICADO) {
        estado = ESTADO_ELEGIBILIDAD.REVISION;
      }

      actualizaciones.push({
        fila: r._fila,
        cambios: {
          age: veredicto.edad === null ? '' : veredicto.edad,
          eligibility_status: estado,
          duplicate_flag: dup.duplicate_flag,
          duplicate_reason: dup.duplicate_reason,
          registro_principal: dup.registro_principal,
          normalized_id_number: candidato.normalized_id_number,
          normalized_email: candidato.normalized_email,
          normalized_phone: candidato.normalized_phone,
          validation_notes: veredicto.errores.map(function (x) { return x.campo + ':' + x.codigo; }).join(' | ')
        }
      });
    });

    actualizarFilasEnLote(HOJA.REGISTRO, actualizaciones);
    registrar(sesion.alias, sesion.rol, 'REVALIDAR_TODO', '', filas.length + ' filas');
    return { revalidados: filas.length, resumen: resumenElegibilidad(leerHoja(HOJA.REGISTRO)) };
  });
}

/** Manual override by logistics, always logged with who and why. */
function accionMarcarElegibilidad(datos, sesion) {
  return conBloqueo(function () {
    var registro = datos.submission_id
      ? leerHoja(HOJA.REGISTRO).filter(function (r) { return r.submission_id === datos.submission_id; })[0]
      : buscarPorCodigo(datos.code);
    if (!registro) return { ok: false, error: 'Registro no encontrado.' };

    var nuevo = normalizarComparable(datos.eligibility_status);
    if (!ESTADO_ELEGIBILIDAD[nuevo]) return { ok: false, error: 'Estado de elegibilidad invalido: ' + datos.eligibility_status };

    actualizarFila(HOJA.REGISTRO, registro._fila, {
      eligibility_status: nuevo,
      notes: [registro.notes, datos.motivo ? '[' + ahoraISO() + ' ' + sesion.alias + '] ' + datos.motivo : '']
        .filter(Boolean).join(' || ')
    });
    registrar(sesion.alias, sesion.rol, 'MARCAR_ELEGIBILIDAD', registro.submission_id,
              registro.eligibility_status + '->' + nuevo + ' motivo=' + (datos.motivo || ''));
    return { submission_id: registro.submission_id, eligibility_status: nuevo };
  });
}

/**
 * "Cerrar los 100": issues B-001..B-100 and writes each participant's block,
 * arrival time and audition time in one pass.
 */
function accionAsignarCodigos(datos, sesion) {
  return conBloqueo(function () {
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
    refrescarVistas();

    registrar(sesion.alias, sesion.rol, 'ASIGNAR_CODIGOS', '',
              'nuevos=' + resultado.asignados.length + ' sin_cupo=' + resultado.sin_cupo.length);

    return {
      asignados: resultado.asignados.length,
      ya_tenian: resultado.ya_tenian,
      total_con_codigo: resultado.total_con_codigo,
      sin_cupo: resultado.sin_cupo.length,
      cupo: resultado.cupo,
      detalle: resultado.asignados.slice(0, 200)
    };
  });
}

function accionListarCambios(datos) {
  var cambios = leerHoja(HOJA.CAMBIOS);
  var estado = normalizarComparable(datos.estado || '');
  return {
    cambios: cambios.filter(function (c) {
      return !estado || estado === 'TODOS' || normalizarComparable(c.estado) === estado;
    }),
    pendientes: cambios.filter(function (c) { return normalizarComparable(c.estado) === 'PENDIENTE'; }).length
  };
}

function accionBloquesDisponibles() {
  return { bloques: bloquesConCupo(leerHoja(HOJA.REGISTRO), agendaConfigurada()) };
}

/** Production approves (with a destination block) or rejects. */
function accionResolverCambio(datos, sesion) {
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
      refrescarVistas();
      return { estado: ESTADO_CAMBIO.RECHAZADO, code: solicitud.code,
               mensaje: 'Solicitud rechazada. El participante mantiene su horario original.' };
    }

    // Capacity is verified at approval time, not at request time.
    var libres = bloquesConCupo(leerHoja(HOJA.REGISTRO), agendaConfigurada());
    var destino = libres.filter(function (b) { return String(b.block_id) === String(datos.nuevo_bloque); })[0];
    if (!destino) return { ok: false, error: 'Bloque destino invalido.' };
    if (destino.disponibles <= 0) {
      return { ok: false, error: 'El bloque ' + destino.block_id + ' ya esta lleno (' + destino.ocupados + '/' + destino.cupo + ').' };
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
    refrescarVistas();

    return {
      estado: ESTADO_CAMBIO.APROBADO, code: solicitud.code,
      nuevo_bloque: aplicado.horario.block_id,
      nueva_hora: aplicado.horario.audition_time,
      hora_llegada: aplicado.horario.arrival_time,
      mensaje: 'Cambio aprobado. El codigo ' + solicitud.code + ' NO cambia; solo su horario.'
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

// ========================================================================
// 23_api_checkin.gs
// ========================================================================

/**
 * EL BUNKER - Check-in desk actions (event day).
 *
 * This is the only module that has to keep working on a bad connection, so it
 * exposes a full roster download and a batch sync of queued operations.
 */

/** The whole roster, trimmed to what the desk legitimately needs to see. */
function accionRosterCheckin() {
  var filas = leerHoja(HOJA.REGISTRO).filter(function (r) { return normalizarTexto(r.code); });
  return {
    generado_at: ahoraISO(),
    total: filas.length,
    roster: filas.map(function (r) {
      return {
        code: r.code,
        full_name: r.full_name,
        id_number: String(r.id_number || ''),
        artistic_name: r.artistic_name,
        discipline: r.discipline,
        final_block: r.final_block || r.original_block,
        arrival_time: r.arrival_time,
        final_time: r.final_time || r.original_time,
        attendance_status: r.attendance_status || ESTADO.CONFIRMADO,
        audition_status: r.audition_status || '',
        check_in_time: r.check_in_time || '',
        technical_needs: r.technical_needs || ''
      };
    })
  };
}

function accionBuscarParticipante(datos) {
  var registro = null;
  if (datos.code) registro = buscarPorCodigo(datos.code);
  if (!registro && datos.id_number) registro = buscarPorCedula(datos.id_number);
  if (!registro) return { ok: false, error: 'No encontramos ese codigo ni ese documento.' };

  var horaAudicion = registro.final_time || registro.original_time || '';
  var puntualidad = horaAudicion
    ? evaluarPuntualidad(horaAudicion, datos.hora_llegada || horaActual(), agendaConfigurada())
    : null;

  return {
    participante: {
      code: registro.code, full_name: registro.full_name,
      id_number: String(registro.id_number || ''),
      artistic_name: registro.artistic_name, discipline: registro.discipline,
      final_block: registro.final_block || registro.original_block,
      arrival_time: registro.arrival_time, final_time: horaAudicion,
      attendance_status: registro.attendance_status || ESTADO.CONFIRMADO,
      audition_status: registro.audition_status || '',
      check_in_time: registro.check_in_time || '',
      technical_needs: registro.technical_needs || '',
      change_status: registro.change_status || ''
    },
    puntualidad: puntualidad,
    // The desk must always confirm against the physical document.
    recordatorio: 'Valida la identidad con el documento fisico antes de confirmar.'
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

  return unaSolaVez(clave, function () {
    return conBloqueo(function () {
      var registro = buscarPorCodigo(datos.code);
      if (!registro) return { ok: false, error: 'Codigo no encontrado: ' + datos.code };

      var transicion = aplicarTransicion(
        registro.attendance_status || ESTADO.CONFIRMADO,
        datos.estado,
        { forzar: esVerdadero(datos.forzar) }
      );
      if (!transicion.ok) return { ok: false, error: transicion.mensaje, transicion: transicion };

      var cambios = {
        attendance_status: transicion.hacia,
        operador_check_in: sesion.alias || 'checkin'
      };
      if (transicion.hacia === ESTADO.CHECK_IN && !registro.check_in_time) {
        cambios.check_in_time = datos.check_in_time || ahoraISO();
      }
      if (transicion.hacia === ESTADO.CONTINGENCIA && !registro.contingencia_desde) {
        cambios.contingencia_desde = ahoraISO();
      }
      if (transicion.hacia === ESTADO.REALIZADA) {
        cambios.audition_status = ESTADO.REALIZADA;
      }
      if (transicion.hacia === ESTADO.NO_AUDICIONADO || transicion.hacia === ESTADO.NO_SHOW) {
        cambios.audition_status = transicion.hacia;
      }
      if (datos.notes) {
        cambios.notes = [registro.notes, '[' + ahoraISO() + '] ' + datos.notes].filter(Boolean).join(' || ');
      }

      actualizarFila(HOJA.REGISTRO, registro._fila, cambios);

      if (transicion.forzado) {
        registrarIncidente(datos.code, 'TRANSICION_FORZADA',
          'Cambio manual ' + transicion.desde + ' -> ' + transicion.hacia,
          datos.notes || '', sesion.alias || 'checkin');
      }
      registrar(sesion.alias, sesion.rol, 'ESTADO', datos.code,
                transicion.desde + '->' + transicion.hacia);

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

/** Ranks the contingency queue against the time actually left before 21:30. */
function accionPlanContingencia(datos) {
  var filas = leerHoja(HOJA.REGISTRO);
  var cola = filas.filter(function (r) {
    return normalizarEstado(r.attendance_status) === ESTADO.CONTINGENCIA ||
           normalizarEstado(r.attendance_status) === ESTADO.NO_SHOW;
  });

  var cfgAgenda = agendaConfigurada();
  var ahoraMin = datos.ahora ? horaAMinutos(datos.ahora) : horaAMinutos(horaActual());

  var plan = planificarContingencia(cola, {
    agenda: cfgAgenda,
    ahora_minutos: ahoraMin === null ? cfgAgenda.contingencia_inicio : ahoraMin,
    cierre_minutos: cfgAgenda.contingencia_fin,
    minutos_por_audicion: cfgNumero('duracion_audicion_min', 3)
  });

  var nombres = {};
  filas.forEach(function (r) { nombres[r.code] = r.artistic_name || r.full_name; });
  plan.entran.forEach(function (x) { x.nombre = nombres[x.code] || ''; });
  plan.fuera.forEach(function (x) { x.nombre = nombres[x.code] || ''; });

  return plan;
}

/** 21:30 hard close: everybody pending becomes NO AUDICIONADO. */
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

// ========================================================================
// 24_api_jurado.gs
// ========================================================================

/**
 * EL BUNKER - Jury actions.
 *
 * A juror sees only what they need to score: code, artistic name and discipline.
 * No document number, no contact details, no other juror's marks - the spec is
 * explicit that jurors score independently before deliberating.
 */

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

function accionListaEvaluacion(datos, sesion) {
  var miHoja = hojaDeJurado(sesion.alias);
  var yaEvaluados = {};
  leerHoja(miHoja).forEach(function (f) {
    if (f.code) yaEvaluados[normalizarComparable(f.code)] = f;
  });

  var filas = leerHoja(HOJA.REGISTRO).filter(function (r) {
    return normalizarTexto(r.code) && normalizarEstado(r.attendance_status) !== ESTADO.CONFIRMADO;
  });

  return {
    hoja: miHoja,
    rubrica: RUBRICA,
    escala: ESCALA,
    participantes: filas.map(function (r) {
      var previo = yaEvaluados[normalizarComparable(r.code)];
      return {
        code: r.code,
        artistic_name: r.artistic_name || '(sin nombre artistico)',
        discipline: r.discipline,
        attendance_status: r.attendance_status,
        audition_status: r.audition_status || '',
        evaluado: !!previo,
        total: previo ? previo.total : null,
        puntajes: previo ? {
          talento: previo.talento, performance: previo.performance,
          identidad: previo.identidad, repertorio: previo.repertorio,
          profesionalismo: previo.profesionalismo, presencia: previo.presencia,
          digital: previo.digital, proyecto: previo.proyecto
        } : null,
        observaciones: previo ? previo.observaciones : ''
      };
    })
  };
}

function accionGuardarEvaluacion(datos, sesion) {
  return conBloqueo(function () {
    var miHoja = hojaDeJurado(sesion.alias);
    var registro = buscarPorCodigo(datos.code);
    if (!registro) return { ok: false, error: 'Codigo no encontrado.' };

    // Only a performed audition can be scored.
    if (normalizarEstado(registro.audition_status) !== ESTADO.REALIZADA &&
        normalizarEstado(registro.attendance_status) !== ESTADO.REALIZADA &&
        !esVerdadero(datos.forzar)) {
      return { ok: false, error: 'Este participante aun no tiene la audicion marcada como REALIZADA.' };
    }

    var puntajes = {};
    RUBRICA.forEach(function (f) { puntajes[f.id] = datos[f.id]; });

    var calculo = calcularPuntajeJurado(puntajes);
    if (!calculo.valido) {
      return { ok: false, error: 'Faltan o son invalidos: ' + calculo.faltantes.join(', ') + '. Cada factor va de 1 a 10.',
               faltantes: calculo.faltantes };
    }

    var existentes = leerHoja(miHoja);
    var previo = existentes.filter(function (f) {
      return normalizarComparable(f.code) === normalizarComparable(datos.code);
    })[0];

    var fila = {
      code: registro.code,
      artistic_name: registro.artistic_name,
      discipline: registro.discipline,
      total: calculo.total,
      valido: 'TRUE',
      observaciones: String(datos.observaciones || '').slice(0, 900),
      evaluado_at: ahoraISO(),
      evaluado_by: sesion.alias
    };
    RUBRICA.forEach(function (f) { fila[f.id] = Number(puntajes[f.id]); });

    if (previo) {
      actualizarFila(miHoja, previo._fila, fila);
      // A correction must leave a trace: the spec demands it explicitly.
      registrar(sesion.alias, sesion.rol, 'EVALUACION_CORREGIDA', registro.code,
                'antes=' + previo.total + ' despues=' + calculo.total);
    } else {
      agregarFila(miHoja, fila);
      registrar(sesion.alias, sesion.rol, 'EVALUACION', registro.code, 'total=' + calculo.total);
    }

    return { code: registro.code, total: calculo.total, hoja: miHoja, corregida: !!previo };
  });
}

// ========================================================================
// 30_vistas.gs
// ========================================================================

/**
 * EL BUNKER - Materialised views.
 *
 * REGISTRO is the single source of truth. AGENDA, CHECK-IN, RESULTADOS and
 * DASHBOARD are rebuilt from it, which is precisely why a participant can never
 * show one schedule on one tab and a different one on another.
 */

function refrescarVistas() {
  var filas = leerHoja(HOJA.REGISTRO);
  return {
    agenda: reconstruirAgenda(filas),
    check_in: reconstruirCheckIn(filas),
    resultados: reconstruirResultados(filas),
    dashboard: reconstruirDashboard(filas)
  };
}

function limpiarDatos(nombreHoja) {
  var h = hoja(nombreHoja);
  if (h.getLastRow() > 1) {
    h.getRange(2, 1, h.getLastRow() - 1, Math.max(1, h.getLastColumn())).clearContent();
  }
  return h;
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
  var conCodigo = filas.filter(function (r) { return normalizarTexto(r.code); });

  conCodigo.sort(function (a, b) {
    var ba = Number(a.final_block || a.original_block || 99);
    var bb = Number(b.final_block || b.original_block || 99);
    if (ba !== bb) return ba - bb;
    return String(a.code) < String(b.code) ? -1 : 1;
  });

  var datos = conCodigo.map(function (r) {
    return {
      code: r.code, full_name: r.full_name, artistic_name: r.artistic_name,
      discipline: r.discipline,
      final_block: r.final_block || r.original_block,
      arrival_time: r.arrival_time,
      final_time: r.final_time || r.original_time,
      check_in_time: r.check_in_time || '',
      attendance_status: r.attendance_status || ESTADO.CONFIRMADO,
      audition_status: r.audition_status || '',
      operador_check_in: r.operador_check_in || '',
      notes: r.notes || ''
    };
  });
  agregarFilas(HOJA.CHECK_IN, datos);
  return datos.length;
}

/** Joins the three jury sheets onto REGISTRO and writes the ranking. */
function reconstruirResultados(filas) {
  limpiarDatos(HOJA.RESULTADOS);

  var tarjetasPorCodigo = {};
  [HOJA.JURADO_1, HOJA.JURADO_2, HOJA.JURADO_3].forEach(function (nombre, idx) {
    leerHoja(nombre).forEach(function (f) {
      var code = normalizarComparable(f.code);
      if (!code) return;
      if (!tarjetasPorCodigo[code]) tarjetasPorCodigo[code] = [];
      var puntajes = {};
      RUBRICA.forEach(function (factor) { puntajes[factor.id] = f[factor.id]; });
      tarjetasPorCodigo[code].push({ jurado: idx + 1, puntajes: puntajes });
    });
  });

  var artistas = filas.filter(function (r) { return normalizarTexto(r.code); }).map(function (r) {
    return {
      code: r.code, artistic_name: r.artistic_name, full_name: r.full_name,
      discipline: r.discipline,
      audition_status: r.audition_status || r.attendance_status,
      tarjetas: tarjetasPorCodigo[normalizarComparable(r.code)] || []
    };
  });

  var seleccion = seleccionarTop(artistas, {
    top: cfgNumero('top_seleccionados', 7),
    minimo_jurados: cfgNumero('minimo_jurados', 2)
  });

  var enTop = {};
  seleccion.top.forEach(function (a) { enTop[a.code] = true; });
  var enEmpate = {};
  seleccion.empates_sin_resolver.forEach(function (a) { enEmpate[a.code] = true; });

  var datos = seleccion.ranking.map(function (a) {
    var porJurado = { 1: '', 2: '', 3: '' };
    a.totales_jurado.forEach(function (t) { porJurado[t.jurado] = t.total; });
    return {
      posicion: a.posicion, code: a.code, artistic_name: a.artistic_name,
      full_name: a.full_name, discipline: a.discipline,
      jurado_1: porJurado[1], jurado_2: porJurado[2], jurado_3: porJurado[3],
      jurados_validos: a.jurados_validos, artist_final: a.artist_final,
      seleccionado: enTop[a.code] ? 'SI' : 'NO',
      requiere_comite: enEmpate[a.code] ? 'SI' : '',
      observacion: ''
    };
  });

  seleccion.excluidos.forEach(function (e) {
    datos.push({
      posicion: '', code: e.code, artistic_name: '', full_name: '', discipline: '',
      jurado_1: '', jurado_2: '', jurado_3: '', jurados_validos: e.jurados_validos || 0,
      artist_final: '', seleccionado: 'NO', requiere_comite: '', observacion: e.motivo
    });
  });

  agregarFilas(HOJA.RESULTADOS, datos);
  return datos.length;
}

/** Every indicator the brief asks for, written as label/value rows plus charts data. */
function reconstruirDashboard(filas) {
  var m = calcularMetricas(filas);
  var h = limpiarDatos(HOJA.DASHBOARD);

  var bloque = [
    ['INDICADOR', 'VALOR'],
    ['Inscritos (total de filas)', m.inscritos],
    ['Participantes unicos (por documento)', m.unicos],
    ['Duplicados marcados', m.duplicados],
    ['Aptos', m.aptos],
    ['Incompletos', m.incompletos],
    ['No cumplen requisitos', m.no_cumplen],
    ['En revision', m.revision],
    ['Con codigo definitivo', m.con_codigo],
    ['Cupos libres', m.cupos_libres],
    ['', ''],
    ['Confirmados (con turno, sin llegar)', m.confirmados],
    ['Reasignados (cambio aprobado)', m.reasignados],
    ['Cambios pendientes', m.cambios_pendientes],
    ['Check-ins realizados', m.check_ins],
    ['Audiciones realizadas', m.realizadas],
    ['No show', m.no_show],
    ['En contingencia', m.contingencia],
    ['No audicionados', m.no_audicionados],
    ['', ''],
    ['Avance de audiciones', m.avance_texto],
    ['Promedio global (audiciones validas)', m.promedio_global === null ? 'sin datos' : m.promedio_global],
    ['Requiere deliberacion del comite', m.requiere_comite ? 'SI' : 'NO'],
    ['Actualizado', ahoraISO()]
  ];

  h.getRange(1, 1, bloque.length, 2).setValues(bloque);

  // Chart 1: score distribution by range.
  var filaDist = bloque.length + 2;
  h.getRange(filaDist, 1).setValue('DISTRIBUCION DE PUNTAJES');
  var dist = [['Rango', 'Artistas']].concat(m.distribucion.map(function (d) { return [d.etiqueta, d.conteo]; }));
  h.getRange(filaDist + 1, 1, dist.length, 2).setValues(dist);

  // Chart 2: Top 7.
  var filaTop = filaDist + dist.length + 2;
  h.getRange(filaTop, 1).setValue('TOP ' + cfgNumero('top_seleccionados', 7));
  var top = [['Artista', 'Puntaje']].concat(m.top.map(function (t) {
    return [(t.artistic_name || t.code), t.artist_final];
  }));
  if (top.length === 1) top.push(['(sin resultados aun)', 0]);
  h.getRange(filaTop + 1, 1, top.length, 2).setValues(top);

  // Chart 3: participant states.
  var filaEstados = filaTop + top.length + 2;
  h.getRange(filaEstados, 1).setValue('ESTADO DE PARTICIPANTES');
  var estados = [['Estado', 'Cantidad'],
    ['Confirmados', m.confirmados], ['Check-in', m.check_ins],
    ['Realizadas', m.realizadas], ['No show', m.no_show],
    ['Contingencia', m.contingencia], ['No audicionados', m.no_audicionados]];
  h.getRange(filaEstados + 1, 1, estados.length, 2).setValues(estados);

  // Chart 4: progress per block.
  var filaBloques = filaEstados + estados.length + 2;
  h.getRange(filaBloques, 1).setValue('AVANCE POR BLOQUE');
  var bloques = [['Bloque', 'Realizadas', 'Asignados']].concat(m.por_bloque.map(function (b) {
    return ['Bloque ' + b.block_id + ' (' + b.ventana + ')', b.realizadas, b.asignados];
  }));
  h.getRange(filaBloques + 1, 1, bloques.length, 3).setValues(bloques);

  h.getRange(1, 1, 1, 2).setFontWeight('bold');
  return bloque.length;
}

/** All dashboard numbers in one place, reused by the web dashboard. */
function calcularMetricas(filas) {
  filas = filas || leerHoja(HOJA.REGISTRO);
  var resumen = resumenElegibilidad(filas);
  var cupo = cfgNumero('cupo_total', 100);

  var conteo = { confirmados: 0, check_ins: 0, realizadas: 0, no_show: 0,
                 contingencia: 0, no_audicionados: 0, incidentes: 0, reasignados: 0 };

  var cfgAgenda = agendaConfigurada();
  var porBloque = {};
  for (var b = 1; b <= cfgAgenda.bloques; b++) {
    porBloque[b] = { block_id: b, ventana: horarioDeBloque(b, cfgAgenda).ventana, asignados: 0, realizadas: 0 };
  }

  filas.forEach(function (r) {
    if (!normalizarTexto(r.code)) return;
    var e = normalizarEstado(r.attendance_status || ESTADO.CONFIRMADO);
    if (e === ESTADO.CONFIRMADO) conteo.confirmados++;
    else if (e === ESTADO.CHECK_IN) conteo.check_ins++;
    else if (e === ESTADO.REALIZADA) conteo.realizadas++;
    else if (e === ESTADO.NO_SHOW) conteo.no_show++;
    else if (e === ESTADO.CONTINGENCIA) conteo.contingencia++;
    else if (e === ESTADO.NO_AUDICIONADO) conteo.no_audicionados++;
    else if (e === ESTADO.INCIDENTE) conteo.incidentes++;

    if (normalizarComparable(r.change_status) === 'APROBADO') conteo.reasignados++;

    var bloque = Number(r.final_block || r.original_block || 0);
    if (porBloque[bloque]) {
      porBloque[bloque].asignados++;
      if (e === ESTADO.REALIZADA) porBloque[bloque].realizadas++;
    }
  });

  var cambios = leerHoja(HOJA.CAMBIOS);
  var pendientes = cambios.filter(function (c) { return normalizarComparable(c.estado) === 'PENDIENTE'; }).length;

  var resultados = leerHoja(HOJA.RESULTADOS).filter(function (r) { return r.artist_final !== '' && r.artist_final !== undefined; });
  var notas = resultados.map(function (r) { return Number(r.artist_final); }).filter(isFinite);
  var promedio = notas.length ? redondear(notas.reduce(function (s, v) { return s + v; }, 0) / notas.length, 2) : null;

  var ranking = resultados
    .filter(function (r) { return r.posicion !== '' && r.posicion !== undefined; })
    .map(function (r) { return { code: r.code, artistic_name: r.artistic_name, artist_final: Number(r.artist_final) }; })
    .sort(function (a, b) { return b.artist_final - a.artist_final; });

  var objetivo = resumen.con_codigo || cupo;

  return {
    inscritos: resumen.total, unicos: resumen.unicos, duplicados: resumen.duplicado,
    aptos: resumen.apto, incompletos: resumen.incompleto, no_cumplen: resumen.no_cumple,
    revision: resumen.revision, con_codigo: resumen.con_codigo,
    cupos_libres: Math.max(0, cupo - resumen.con_codigo),
    confirmados: conteo.confirmados, check_ins: conteo.check_ins,
    realizadas: conteo.realizadas, no_show: conteo.no_show,
    contingencia: conteo.contingencia, no_audicionados: conteo.no_audicionados,
    reasignados: conteo.reasignados, cambios_pendientes: pendientes,
    avance: objetivo ? redondear((conteo.realizadas / objetivo) * 100, 1) : 0,
    avance_texto: conteo.realizadas + ' de ' + objetivo + ' (' +
                  (objetivo ? redondear((conteo.realizadas / objetivo) * 100, 1) : 0) + '%)',
    promedio_global: promedio,
    distribucion: distribucionPuntajes(ranking),
    top: ranking.slice(0, cfgNumero('top_seleccionados', 7)),
    por_bloque: Object.keys(porBloque).map(function (k) { return porBloque[k]; }),
    requiere_comite: leerHoja(HOJA.RESULTADOS).some(function (r) { return normalizarComparable(r.requiere_comite) === 'SI'; })
  };
}

function accionDashboard() {
  return { metricas: calcularMetricas() };
}

function accionResultados(datos, sesion) {
  refrescarVistas();
  var filas = leerHoja(HOJA.RESULTADOS);
  return {
    top: filas.filter(function (r) { return normalizarComparable(r.seleccionado) === 'SI'; }),
    ranking: filas.filter(function (r) { return r.posicion !== '' && r.posicion !== undefined; }),
    excluidos: filas.filter(function (r) { return r.observacion; }),
    requiere_comite: filas.some(function (r) { return normalizarComparable(r.requiere_comite) === 'SI'; })
  };
}

// ========================================================================
// 31_export.gs
// ========================================================================

/**
 * EL BUNKER - XLSX export and backups.
 *
 * The backup is a real .xlsx snapshot in Drive, not a copy of the live
 * spreadsheet: a copy keeps editing with the original, a snapshot does not.
 */

function carpetaBackups() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty(PROP.CARPETA_BACKUPS);
  if (id) {
    try { return DriveApp.getFolderById(id); } catch (e) { /* recreate below */ }
  }
  var carpeta = DriveApp.createFolder('EL BUNKER - Respaldos');
  props.setProperty(PROP.CARPETA_BACKUPS, carpeta.getId());
  return carpeta;
}

/** Exports the whole spreadsheet as XLSX and returns a download link. */
function exportarXlsx(nombreArchivo) {
  var id = PropertiesService.getScriptProperties().getProperty(PROP.SPREADSHEET_ID);
  var url = 'https://docs.google.com/spreadsheets/d/' + id + '/export?format=xlsx';

  var respuesta = UrlFetchApp.fetch(url, {
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true
  });
  if (respuesta.getResponseCode() !== 200) {
    throw new Error('No se pudo exportar el XLSX (HTTP ' + respuesta.getResponseCode() + ').');
  }

  var nombre = (nombreArchivo || 'EL-BUNKER-' + Utilities.formatDate(new Date(), zonaHoraria(), 'yyyyMMdd-HHmm')) + '.xlsx';
  var archivo = carpetaBackups().createFile(respuesta.getBlob().setName(nombre));
  return { nombre: nombre, id: archivo.getId(), url: archivo.getUrl(), bytes: archivo.getSize() };
}

function accionExportar(datos, sesion) {
  refrescarVistas();
  var r = exportarXlsx(datos.nombre);
  registrar(sesion.alias, sesion.rol, 'EXPORTAR_XLSX', r.nombre, r.bytes + ' bytes');
  return r;
}

/**
 * Backup = XLSX snapshot + a JSON dump of every sheet.
 * The JSON is what makes a restore possible without Google Sheets.
 */
function accionRespaldar(datos, sesion) {
  var marca = Utilities.formatDate(new Date(), zonaHoraria(), 'yyyyMMdd-HHmmss');
  var xlsx = exportarXlsx('RESPALDO-' + marca);

  var volcado = {};
  [HOJA.REGISTRO, HOJA.AGENDA, HOJA.CHECK_IN, HOJA.JURADO_1, HOJA.JURADO_2,
   HOJA.JURADO_3, HOJA.RESULTADOS, HOJA.INCIDENTES, HOJA.CONFIG,
   HOJA.CAMBIOS, HOJA.USUARIOS, HOJA.LOG].forEach(function (nombre) {
    volcado[nombre] = leerHoja(nombre);
  });

  var json = carpetaBackups().createFile(
    Utilities.newBlob(JSON.stringify({ generado_at: ahoraISO(), version: VERSION_SISTEMA, datos: volcado },
      null, 2), 'application/json', 'RESPALDO-' + marca + '.json'));

  registrar(sesion.alias, sesion.rol, 'RESPALDO', marca, xlsx.bytes + ' bytes xlsx');
  return { xlsx: xlsx, json: { nombre: json.getName(), url: json.getUrl(), id: json.getId() },
           carpeta: carpetaBackups().getUrl() };
}

/** Restores REGISTRO from a JSON backup. Destructive: asks for the file id explicitly. */
function restaurarDesdeJson(idArchivo) {
  var contenido = DriveApp.getFileById(idArchivo).getBlob().getDataAsString();
  var respaldo = JSON.parse(contenido);
  if (!respaldo.datos || !respaldo.datos[HOJA.REGISTRO]) {
    throw new Error('El archivo no parece un respaldo valido de EL BUNKER.');
  }

  return conBloqueo(function () {
    [HOJA.REGISTRO, HOJA.JURADO_1, HOJA.JURADO_2, HOJA.JURADO_3,
     HOJA.INCIDENTES, HOJA.CAMBIOS].forEach(function (nombre) {
      if (!respaldo.datos[nombre]) return;
      limpiarDatos(nombre);
      var limpias = respaldo.datos[nombre].map(function (f) {
        var copia = {};
        for (var k in f) if (f.hasOwnProperty(k) && k !== '_fila') copia[k] = f[k];
        return copia;
      });
      agregarFilas(nombre, limpias);
    });
    refrescarVistas();
    registrar('sistema', 'admin', 'RESTAURAR', idArchivo, respaldo.generado_at);
    return { restaurado_de: respaldo.generado_at, hojas: Object.keys(respaldo.datos).length };
  });
}

/** Daily backup. Installed by setupInicial as a time-based trigger. */
function respaldoAutomatico() {
  try {
    refrescarVistas();
    var r = exportarXlsx('AUTO-' + Utilities.formatDate(new Date(), zonaHoraria(), 'yyyyMMdd-HHmm'));
    registrar('sistema', 'admin', 'RESPALDO_AUTOMATICO', r.nombre, '');
  } catch (e) {
    console.error('Respaldo automatico fallo: ' + e.message);
  }
}

// ========================================================================
// 32_comunicacion.gs
// ========================================================================

/**
 * EL BUNKER - Message templates for email and WhatsApp.
 *
 * WhatsApp is never automated from here: the spec forbids acting outside an
 * authorised API, so the system produces the exact text plus a click-to-chat
 * link, and a human presses send.
 */

function plantillas() {
  var evento = cfg('evento_nombre', 'EL BUNKER');
  var fecha = cfg('evento_fecha', '2026-10-02');
  var sede = cfg('evento_sede', 'PENDIENTE DE COMPLETAR');
  var duracion = cfgNumero('duracion_audicion_min', 3);
  var tolerancia = cfgNumero('tolerancia_min', 5);
  var correoDatos = cfg('data_protection_email', 'PENDIENTE DE COMPLETAR');

  return {
    RECEPCION: {
      id: 'RECEPCION',
      nombre: '1. Recepcion de inscripcion',
      asunto: evento + ' - recibimos tu inscripcion',
      cuerpo:
        'Hola {{full_name}},\n\n' +
        'Recibimos tu inscripcion a ' + evento + '.\n\n' +
        'Estamos validando los datos de todas las personas inscritas. Si quedas dentro de los ' +
        cfgNumero('cupo_total', 100) + ' cupos, te enviaremos tu CODIGO y tu HORARIO.\n\n' +
        'Ten presente que inscribirte no garantiza seleccion, contratacion ni presentacion.\n\n' +
        'Si tienes dudas sobre tus datos personales escribe a ' + correoDatos + '.\n\n' +
        '- Equipo ' + evento
    },

    ASIGNACION: {
      id: 'ASIGNACION',
      nombre: '2. Asignacion de codigo y horario',
      asunto: evento + ' - tu codigo {{code}} y tu horario',
      cuerpo:
        'Hola {{full_name}},\n\n' +
        'Quedaste dentro de los participantes de ' + evento + '.\n\n' +
        'CODIGO: {{code}}\n' +
        'FECHA: ' + fecha + '\n' +
        'HORA DE LLEGADA: {{arrival_time}}\n' +
        'HORA DE AUDICION: {{final_time}}\n' +
        'BLOQUE: {{final_block}}\n' +
        'LUGAR: ' + sede + '\n\n' +
        'IMPORTANTE:\n' +
        '- Llega a la hora de llegada indicada, no a la hora de audicion.\n' +
        '- Trae tu documento de identidad fisico: sin el no hay check-in.\n' +
        '- Tu audicion dura maximo ' + duracion + ' minutos.\n' +
        '- Tolerancia de ' + tolerancia + ' minutos. Si llegas mas tarde pierdes tu turno y pasas a contingencia ' +
        '(audicionas solo si queda tiempo disponible).\n\n' +
        'Tu codigo NO cambia nunca. Si tienes un impedimento real para asistir en tu horario, ' +
        'tienes UNA sola solicitud de cambio aqui: {{url_cambio}}\n' +
        'No respondas este mensaje para cambiar el horario: solo cuentan las solicitudes por ese enlace.\n\n' +
        '- Equipo ' + evento
    },

    CAMBIO_APROBADO: {
      id: 'CAMBIO_APROBADO',
      nombre: '3. Cambio aprobado',
      asunto: evento + ' - cambio APROBADO, tu nuevo horario',
      cuerpo:
        'Hola {{full_name}},\n\n' +
        'Tu solicitud de cambio fue APROBADA.\n\n' +
        'CODIGO: {{code}} (no cambia)\n' +
        'NUEVA HORA DE LLEGADA: {{arrival_time}}\n' +
        'NUEVA HORA DE AUDICION: {{final_time}}\n' +
        'NUEVO BLOQUE: {{final_block}}\n\n' +
        'Este es tu horario definitivo. El dia del evento no hay mas cambios.\n\n' +
        '- Equipo ' + evento
    },

    CAMBIO_RECHAZADO: {
      id: 'CAMBIO_RECHAZADO',
      nombre: '4. Cambio no aprobado',
      asunto: evento + ' - tu solicitud de cambio no fue aprobada',
      cuerpo:
        'Hola {{full_name}},\n\n' +
        'Revisamos tu solicitud de cambio y NO fue aprobada por disponibilidad de la agenda.\n\n' +
        'Tu horario sigue siendo:\n' +
        'CODIGO: {{code}}\n' +
        'HORA DE LLEGADA: {{arrival_time}}\n' +
        'HORA DE AUDICION: {{final_time}}\n\n' +
        'Si no puedes asistir, tu cupo quedara como no audicionado. Gracias por avisarnos.\n\n' +
        '- Equipo ' + evento
    },

    RECORDATORIO_24H: {
      id: 'RECORDATORIO_24H',
      nombre: '5. Recordatorio 24 h antes',
      asunto: evento + ' - manana es tu audicion ({{code}})',
      cuerpo:
        'Hola {{full_name}},\n\n' +
        'Manana ' + fecha + ' es tu audicion en ' + evento + '.\n\n' +
        'CODIGO: {{code}}\n' +
        'LLEGADA: {{arrival_time}} | AUDICION: {{final_time}}\n' +
        'LUGAR: ' + sede + '\n\n' +
        'Lleva tu documento fisico. Prepara ' + duracion + ' minutos exactos.\n' +
        'Recuerda la tolerancia de ' + tolerancia + ' minutos.\n\n' +
        '- Equipo ' + evento
    },

    RECORDATORIO_DIA: {
      id: 'RECORDATORIO_DIA',
      nombre: '6. Recordatorio del dia',
      asunto: evento + ' - hoy es tu audicion ({{code}})',
      cuerpo:
        '{{full_name}}, hoy es tu audicion.\n\n' +
        'CODIGO {{code}} | LLEGADA {{arrival_time}} | AUDICION {{final_time}}\n' +
        'LUGAR: ' + sede + '\n\n' +
        'Documento fisico obligatorio. Tolerancia ' + tolerancia + ' min.\n\n' +
        '- Equipo ' + evento
    },

    CONTINGENCIA: {
      id: 'CONTINGENCIA',
      nombre: '7. Contingencia / no show',
      asunto: evento + ' - tu turno paso a contingencia',
      cuerpo:
        'Hola {{full_name}},\n\n' +
        'Tu turno ({{code}}, {{final_time}}) paso a CONTINGENCIA.\n\n' +
        'La contingencia funciona entre ' + cfg('contingencia_inicio', '21:00') + ' y ' +
        cfg('cierre_audiciones', '21:30') + ', y solo alcanza para quienes quepan en el tiempo disponible, ' +
        'en orden de llegada a la lista.\n\n' +
        'Acercate al punto de check-in y espera el llamado. A las ' + cfg('cierre_audiciones', '21:30') +
        ' se cierran definitivamente las audiciones.\n\n' +
        '- Equipo ' + evento
    }
  };
}

/** Fills {{placeholders}} from a participant row. */
function renderizarPlantilla(plantilla, registro, extras) {
  var datos = Object.assign({}, registro, extras || {});
  function sustituir(texto) {
    return String(texto).replace(/\{\{(\w+)\}\}/g, function (_, clave) {
      var v = datos[clave];
      return (v === undefined || v === null || v === '') ? '{{' + clave + '}}' : String(v);
    });
  }
  return { asunto: sustituir(plantilla.asunto), cuerpo: sustituir(plantilla.cuerpo) };
}

/**
 * Builds every message for a given template without sending anything.
 * Returns WhatsApp click-to-chat links so a human sends them one by one.
 */
function accionMensajes(datos, sesion) {
  var todas = plantillas();
  var plantilla = todas[String(datos.plantilla || '').toUpperCase()];
  if (!plantilla) {
    return { ok: false, error: 'Plantilla desconocida.', disponibles: Object.keys(todas) };
  }

  var base = ScriptApp.getService().getUrl();
  var filas = leerHoja(HOJA.REGISTRO).filter(function (r) {
    if (datos.solo_con_codigo !== 'NO' && !normalizarTexto(r.code)) return false;
    if (datos.code) return normalizarComparable(r.code) === normalizarComparable(datos.code);
    if (datos.bloque) return String(r.final_block || r.original_block) === String(datos.bloque);
    return true;
  });

  var mensajes = filas.map(function (r) {
    var render = renderizarPlantilla(plantilla, r, {
      url_cambio: base + '?p=cambio-horario&code=' + encodeURIComponent(r.code || '')
    });
    var tel = normalizarTelefono(r.whatsapp);
    return {
      code: r.code, full_name: r.full_name, email: r.email, whatsapp: r.whatsapp,
      consent_whatsapp: r.consent_whatsapp, asunto: render.asunto, cuerpo: render.cuerpo,
      whatsapp_url: tel ? 'https://wa.me/57' + tel + '?text=' + encodeURIComponent(render.cuerpo) : ''
    };
  });

  registrar(sesion.alias, sesion.rol, 'GENERAR_MENSAJES', plantilla.id, mensajes.length + ' destinatarios');
  return { plantilla: plantilla.id, nombre: plantilla.nombre, total: mensajes.length, mensajes: mensajes };
}

/**
 * Sends the emails for a template.
 *
 * A consumer Gmail account can send ~100 emails per day, so this reports the
 * remaining quota and stops cleanly instead of failing halfway through.
 */
function accionEnviarCorreos(datos, sesion) {
  var preparado = accionMensajes(datos, sesion);
  if (preparado.ok === false) return preparado;

  var restantes = MailApp.getRemainingDailyQuota();
  var limite = Math.min(preparado.mensajes.length, restantes, Number(datos.max || 100));

  var enviados = [];
  var omitidos = [];

  for (var i = 0; i < preparado.mensajes.length; i++) {
    var m = preparado.mensajes[i];
    if (enviados.length >= limite) { omitidos.push({ code: m.code, motivo: 'CUOTA_O_LIMITE' }); continue; }
    if (!esEmailValido(m.email)) { omitidos.push({ code: m.code, motivo: 'SIN_CORREO_VALIDO' }); continue; }

    try {
      MailApp.sendEmail({ to: m.email, subject: m.asunto, body: m.cuerpo,
                          name: cfg('evento_nombre', 'EL BUNKER') });
      enviados.push(m.code);
    } catch (e) {
      omitidos.push({ code: m.code, motivo: e.message });
    }
  }

  registrar(sesion.alias, sesion.rol, 'ENVIAR_CORREOS', preparado.plantilla,
            'enviados=' + enviados.length + ' omitidos=' + omitidos.length);

  return {
    plantilla: preparado.plantilla, enviados: enviados.length, omitidos: omitidos,
    cuota_restante: MailApp.getRemainingDailyQuota(),
    nota: omitidos.length
      ? 'Quedaron mensajes sin enviar. Reintenta manana o envialos por WhatsApp con los enlaces generados.'
      : ''
  };
}

// ========================================================================
// 40_setup.gs
// ========================================================================

/**
 * EL BUNKER - One-time setup.
 *
 * Run setupInicial() once from the Apps Script editor. It is idempotent: it
 * creates what is missing and leaves existing data alone.
 */

function setupInicial() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty(PROP.SPREADSHEET_ID);
  var libroNuevo;

  if (id) {
    try { libroNuevo = SpreadsheetApp.openById(id); }
    catch (e) { id = null; }
  }
  if (!id) {
    libroNuevo = SpreadsheetApp.create('EL BUNKER - BASE MAESTRA');
    props.setProperty(PROP.SPREADSHEET_ID, libroNuevo.getId());
    libroNuevo.setSpreadsheetTimeZone('America/Bogota');
  }

  var definiciones = [
    [HOJA.REGISTRO, COLUMNAS_REGISTRO],
    [HOJA.AGENDA, COLUMNAS_AGENDA],
    [HOJA.CHECK_IN, COLUMNAS_CHECK_IN],
    [HOJA.JURADO_1, COLUMNAS_JURADO],
    [HOJA.JURADO_2, COLUMNAS_JURADO],
    [HOJA.JURADO_3, COLUMNAS_JURADO],
    [HOJA.RESULTADOS, COLUMNAS_RESULTADOS],
    [HOJA.DASHBOARD, ['INDICADOR', 'VALOR']],
    [HOJA.INCIDENTES, COLUMNAS_INCIDENTES],
    [HOJA.CONFIG, ['clave', 'valor', 'descripcion']],
    [HOJA.CAMBIOS, COLUMNAS_CAMBIOS],
    [HOJA.USUARIOS, COLUMNAS_USUARIOS],
    [HOJA.LOG, COLUMNAS_LOG],
    [HOJA.IDEMPOTENCIA, COLUMNAS_IDEMPOTENCIA]
  ];

  definiciones.forEach(function (d) {
    var h = libroNuevo.getSheetByName(d[0]);
    if (!h) h = libroNuevo.insertSheet(d[0]);
    if (h.getLastRow() === 0 || String(h.getRange(1, 1).getValue()).trim() === '') {
      h.getRange(1, 1, 1, d[1].length).setValues([d[1]]);
    }
    h.getRange(1, 1, 1, Math.max(1, h.getLastColumn())).setFontWeight('bold').setBackground('#1f2937').setFontColor('#ffffff');
    h.setFrozenRows(1);
  });

  // Drop the default "Hoja 1" only once every real sheet exists.
  ['Sheet1', 'Hoja 1', 'Hoja1'].forEach(function (n) {
    var s = libroNuevo.getSheetByName(n);
    if (s && libroNuevo.getSheets().length > 1) libroNuevo.deleteSheet(s);
  });

  // CONFIG defaults, only for keys that do not exist yet.
  var hojaConfig = libroNuevo.getSheetByName(HOJA.CONFIG);
  var existentes = {};
  if (hojaConfig.getLastRow() > 1) {
    hojaConfig.getRange(2, 1, hojaConfig.getLastRow() - 1, 1).getValues()
      .forEach(function (f) { existentes[String(f[0]).trim()] = true; });
  }
  var porDefecto = configuracionPorDefecto().slice(1);
  var faltantes = porDefecto.filter(function (f) { return !existentes[f[0]]; });
  if (faltantes.length) {
    hojaConfig.getRange(hojaConfig.getLastRow() + 1, 1, faltantes.length, 3).setValues(faltantes);
  }
  hojaConfig.setColumnWidth(1, 220).setColumnWidth(2, 320).setColumnWidth(3, 460);

  invalidarCacheConfig();
  secretoHmac();                                   // generate the signing key now
  instalarDisparadores();
  refrescarVistas();

  var admin = provisionarUsuario('admin', ROL.ADMIN, 'Cuenta principal de administracion');

  registrar('sistema', 'admin', 'SETUP_INICIAL', libroNuevo.getId(), VERSION_SISTEMA);

  var resumen = {
    spreadsheet_id: libroNuevo.getId(),
    spreadsheet_url: libroNuevo.getUrl(),
    web_app_url: urlSegura(),
    enlace_admin: admin.url,
    version: VERSION_SISTEMA
  };
  console.log(JSON.stringify(resumen, null, 2));
  return resumen;
}

function urlSegura() {
  try { return ScriptApp.getService().getUrl(); }
  catch (e) { return '(despliega la app como Web App para obtener la URL)'; }
}

function instalarDisparadores() {
  var existentes = ScriptApp.getProjectTriggers().map(function (t) { return t.getHandlerFunction(); });
  if (existentes.indexOf('respaldoAutomatico') === -1) {
    ScriptApp.newTrigger('respaldoAutomatico').timeBased().everyDays(1).atHour(23).create();
  }
  if (existentes.indexOf('refrescarVistas') === -1) {
    ScriptApp.newTrigger('refrescarVistas').timeBased().everyHours(6).create();
  }
}

/**
 * Creates the five operating accounts and prints their access links.
 * Run once, hand each link to its person, never share links between roles.
 */
function crearAccesosOperativos() {
  var cuentas = [
    ['admin', ROL.ADMIN, 'Cuenta principal de administracion'],
    ['coordinacion', ROL.LOGISTICA, 'Coordinador logistico'],
    ['direccion', ROL.DIRECCION, 'Direccion / gerencia'],
    ['checkin-1', ROL.CHECKIN, 'Mesa de check-in 1'],
    ['checkin-2', ROL.CHECKIN, 'Mesa de check-in 2'],
    ['jurado-1', ROL.JURADO, 'jurado 1'],
    ['jurado-2', ROL.JURADO, 'jurado 2'],
    ['jurado-3', ROL.JURADO, 'jurado 3']
  ];
  var salida = cuentas.map(function (c) { return provisionarUsuario(c[0], c[1], c[2]); });
  console.log(salida.map(function (s) { return s.alias + ' (' + s.rol + '):\n  ' + s.url; }).join('\n\n'));
  return salida;
}

/** Prints the live access links again without re-issuing tokens. */
function verAccesos() {
  var usuarios = leerHoja(HOJA.USUARIOS).filter(function (u) {
    return normalizarComparable(u.activo) !== 'NO';
  });
  var salida = usuarios.map(function (u) {
    return { alias: u.email_o_alias, rol: u.rol, url: urlPanel(u.rol, u.token) };
  });
  console.log(salida.map(function (s) { return s.alias + ' (' + s.rol + '):\n  ' + s.url; }).join('\n\n'));
  return salida;
}

/** Full reset of operational data. Keeps CONFIG and users. Asks for confirmation. */
function borrarDatosDePrueba(confirmacion) {
  if (confirmacion !== 'SI-BORRAR') {
    throw new Error('Para evitar un borrado accidental, llama borrarDatosDePrueba("SI-BORRAR").');
  }
  return conBloqueo(function () {
    [HOJA.REGISTRO, HOJA.JURADO_1, HOJA.JURADO_2, HOJA.JURADO_3,
     HOJA.INCIDENTES, HOJA.CAMBIOS, HOJA.LOG, HOJA.IDEMPOTENCIA].forEach(limpiarDatos);
    refrescarVistas();
    registrar('sistema', 'admin', 'BORRAR_DATOS_PRUEBA', '', 'confirmado');
    return { ok: true, mensaje: 'Datos operativos borrados. CONFIG y usuarios intactos.' };
  });
}

// ========================================================================
// 41_seed.gs
// ========================================================================

/**
 * EL BUNKER - Fictitious test dataset.
 *
 * Generates 130 submissions on purpose: more than the 100 seats, and salted
 * with every failure mode from the QA list, so running the real pipeline over
 * it proves that exactly 100 definitive codes are issued and everything else
 * lands in a correct, traceable state.
 *
 * Names and documents are invented. No real person's data is used.
 */

var NOMBRES_PRUEBA = ['Ana', 'Carlos', 'Daniela', 'Esteban', 'Farid', 'Gabriela', 'Hector',
  'Isabela', 'Julian', 'Karen', 'Luis', 'Manuela', 'Nicolas', 'Orlando', 'Paula',
  'Quintero', 'Rocio', 'Samuel', 'Tatiana', 'Uriel', 'Valeria', 'William', 'Ximena', 'Yeison', 'Zulma'];
var APELLIDOS_PRUEBA = ['Restrepo', 'Gomez', 'Arango', 'Zapata', 'Ospina', 'Cardona', 'Velez',
  'Mesa', 'Quintero', 'Betancur', 'Jaramillo', 'Munoz', 'Ramirez', 'Agudelo', 'Salazar'];
var SECTORES_PRUEBA = ['Aliadas del Sur', 'Betania', 'Calle del Banco', 'Holanda', 'La Doctora',
  'Los Alcazares', 'Maria Auxiliadora', 'Playa Rica', 'Restrepo Naranjo', 'San Joaquin', 'Vegas de la Doctora'];
var DISCIPLINAS_PRUEBA = ['Canto', 'Rap / Hip hop', 'Danza urbana', 'Danza contemporanea',
  'Musica instrumental', 'Teatro', 'Poesia / spoken word', 'DJ / produccion', 'Circo'];

function seudoAleatorio(semilla) {
  var s = semilla;
  return function () {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

/**
 * Builds the dataset in memory. Deterministic: the same seed always produces
 * the same 130 rows, so a failing QA run can be reproduced exactly.
 */
function construirDatasetPrueba(total) {
  total = total || 130;
  var azar = seudoAleatorio(20261002);
  var filas = [];
  var base = 1000000000;

  for (var i = 0; i < total; i++) {
    var nombre = NOMBRES_PRUEBA[Math.floor(azar() * NOMBRES_PRUEBA.length)];
    var apellido = APELLIDOS_PRUEBA[Math.floor(azar() * APELLIDOS_PRUEBA.length)];
    var apellido2 = APELLIDOS_PRUEBA[Math.floor(azar() * APELLIDOS_PRUEBA.length)];
    // Age is kept strictly inside 19..27 so that ONLY the deliberately seeded
    // rows below fall outside the 18-28 rule. Months are capped at September so
    // the birthday has already passed on 2 October and the age is exact.
    var edad = 19 + Math.floor(azar() * 9);                    // 19..27
    var anio = 2026 - edad;
    var mes = 1 + Math.floor(azar() * 9);                      // 1..9
    var dia = 1 + Math.floor(azar() * 28);

    var fila = {
      client_submission_id: 'SEED-' + i,
      full_name: nombre + ' ' + apellido + ' ' + apellido2,
      id_number: String(base + i * 137),
      birth_date: anio + '-' + (mes < 10 ? '0' : '') + mes + '-' + (dia < 10 ? '0' : '') + dia,
      neighborhood_sector: SECTORES_PRUEBA[Math.floor(azar() * SECTORES_PRUEBA.length)],
      resides_in_sabaneta: true,
      email: 'prueba' + i + '@ejemplo-bunker.test',
      whatsapp: '3' + String(100000000 + i * 7919).slice(0, 9),
      artistic_name: 'PRUEBA-' + String(i).padStart(3, '0'),
      discipline: DISCIPLINAS_PRUEBA[Math.floor(azar() * DISCIPLINAS_PRUEBA.length)],
      genre_or_proposal: 'Propuesta de prueba ' + i,
      artist_description: 'Descripcion ficticia para pruebas del sistema.',
      audition_description: 'Presenta una pieza de 3 minutos (dato ficticio).',
      video_url: 'https://www.youtube.com/watch?v=PRUEBA' + i,
      technical_needs: i % 4 === 0 ? 'Microfono' : 'Ninguna',
      availability_statement: true,
      accept_terms: true,
      accept_data_processing: true,
      accept_whatsapp_operational: true,
      accept_image_voice: i % 5 !== 0,
      source: 'seed'
    };

    // ---- Deliberate failure modes ----------------------------------------
    if (i === 110 || i === 111) {                  // duplicate by document
      fila.id_number = String(base);               // same as record 0
      fila.email = 'otro' + i + '@ejemplo-bunker.test';
    }
    if (i === 112) {                               // duplicate by email only -> alert
      fila.email = 'prueba1@ejemplo-bunker.test';
    }
    if (i === 113) {                               // duplicate by phone only -> alert
      fila.whatsapp = '3100000000';             // same number as record 0
    }
    if (i === 114) fila.birth_date = '2012-05-10';         // too young
    if (i === 115) fila.birth_date = '1990-03-22';         // too old
    if (i === 116) fila.resides_in_sabaneta = false;       // outside Sabaneta
    if (i === 117) fila.email = '';                        // incomplete
    if (i === 118) fila.accept_data_processing = false;    // consent missing
    if (i === 119) fila.video_url = 'lo tengo en el celular'; // review
    if (i === 120) fila.whatsapp = '6044441111';           // landline -> invalid
    if (i === 121) fila.birth_date = '31/02/2003';         // impossible date
    if (i === 122) fila.full_name = '';                    // incomplete

    filas.push(fila);
  }
  // Record 123: byte-identical retry of record 5 (same client_submission_id).
  var repetido = JSON.parse(JSON.stringify(filas[5]));
  filas.push(repetido);

  return filas;
}

/**
 * Loads the dataset through the REAL public endpoint, so the test exercises
 * validation, duplicate detection and idempotency exactly as production will.
 */
function cargarDatosDePrueba() {
  var filas = construirDatasetPrueba(130);
  var resultados = { total: filas.length, por_estado: {}, repetidos: 0 };

  filas.forEach(function (f) {
    var r = accionInscribir(f);
    if (r.repetido) resultados.repetidos++;
    var e = r.eligibility_status || 'ERROR';
    resultados.por_estado[e] = (resultados.por_estado[e] || 0) + 1;
  });

  registrar('sistema', 'admin', 'CARGAR_DATOS_PRUEBA', '', JSON.stringify(resultados));
  console.log(JSON.stringify(resultados, null, 2));
  return resultados;
}

/**
 * End-to-end rehearsal: loads the dataset, issues codes, simulates the event
 * day (check-ins, one late arrival, a no-show, contingency, the 21:30 close),
 * scores with three jurors and produces the Top 7.
 *
 * This is the "ensayo integral" of the 28-sep milestone, runnable on demand.
 */
function ensayoIntegral() {
  var informe = { pasos: [] };
  function paso(nombre, valor) {
    informe.pasos.push({ paso: nombre, resultado: valor });
    console.log(nombre + ': ' + JSON.stringify(valor));
  }

  var sesionAdmin = { ok: true, rol: ROL.ADMIN, alias: 'ensayo' };

  paso('1. Cargar dataset', cargarDatosDePrueba());
  paso('2. Revalidar', accionRevalidarTodo({}, sesionAdmin).resumen);

  var codigos = accionAsignarCodigos({}, sesionAdmin);
  paso('3. Asignar codigos', { asignados: codigos.asignados, sin_cupo: codigos.sin_cupo, total: codigos.total_con_codigo });

  // --- simulate the day -----------------------------------------------------
  var conCodigo = leerHoja(HOJA.REGISTRO).filter(function (r) { return normalizarTexto(r.code); });
  var realizadas = 0, noShow = 0, contingencia = 0;

  conCodigo.forEach(function (r, idx) {
    if (idx % 17 === 0) {                                   // no show
      accionRegistrarEstado({ code: r.code, estado: ESTADO.NO_SHOW }, sesionAdmin);
      noShow++;
    } else if (idx % 23 === 0) {                            // late -> contingency
      accionRegistrarEstado({ code: r.code, estado: ESTADO.CONTINGENCIA }, sesionAdmin);
      contingencia++;
    } else {
      accionRegistrarEstado({ code: r.code, estado: ESTADO.CHECK_IN }, sesionAdmin);
      accionRegistrarEstado({ code: r.code, estado: ESTADO.REALIZADA }, sesionAdmin);
      realizadas++;
    }
  });
  paso('4. Jornada simulada', { realizadas: realizadas, no_show: noShow, contingencia: contingencia });

  // --- three jurors ---------------------------------------------------------
  var azar = seudoAleatorio(777);
  [1, 2, 3].forEach(function (n) {
    var sesionJurado = { ok: true, rol: ROL.JURADO, alias: 'jurado-' + n };
    var hojaJ = 'JURADO_' + n;
    var filasJ = [];
    leerHoja(HOJA.REGISTRO).forEach(function (r) {
      if (normalizarEstado(r.audition_status) !== ESTADO.REALIZADA) return;
      var puntajes = {};
      RUBRICA.forEach(function (f) { puntajes[f.id] = 4 + Math.floor(azar() * 7); });   // 4..10
      var calculo = calcularPuntajeJurado(puntajes);
      var fila = { code: r.code, artistic_name: r.artistic_name, discipline: r.discipline,
                   total: calculo.total, valido: 'TRUE', observaciones: 'Ensayo integral',
                   evaluado_at: ahoraISO(), evaluado_by: 'jurado-' + n };
      RUBRICA.forEach(function (f) { fila[f.id] = puntajes[f.id]; });
      filasJ.push(fila);
    });
    limpiarDatos(hojaJ);
    agregarFilas(hojaJ, filasJ);
  });
  paso('5. Evaluaciones cargadas', { jurados: 3 });

  paso('6. Cerrar jornada', accionCerrarJornada({}, sesionAdmin));

  refrescarVistas();
  var resultados = accionResultados({}, sesionAdmin);
  paso('7. Top', resultados.top.map(function (t) {
    return { posicion: t.posicion, code: t.code, artista: t.artistic_name, puntaje: t.artist_final };
  }));
  paso('8. Requiere comite', resultados.requiere_comite);
  paso('9. Respaldo', accionRespaldar({}, sesionAdmin).xlsx.nombre);

  console.log('\n=== ENSAYO INTEGRAL COMPLETO ===');
  return informe;
}
