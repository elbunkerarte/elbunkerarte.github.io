# EL BÚNKER — Mapa del ecosistema, enlaces, roles, flujo y contingencias

Para el equipo de la **Corporación Socio cultural El Arte es la Solución** (Sabaneta).
No hace falta saber programar. Todo lo que dice este documento sale del código del sistema
(`apps-script/` y `site/`); los nombres de pestañas y botones están escritos **exactamente**
como aparecen en pantalla, para que los encuentres.

Documentos relacionados: [MANUAL_OPERATIVO_1_PAGINA.md](MANUAL_OPERATIVO_1_PAGINA.md) (resumen de una
página) · [EXPORT_EXCEL.md](EXPORT_EXCEL.md) (Excel y póliza) · [MANUAL-RECUPERACION.md](MANUAL-RECUPERACION.md)
(restaurar un respaldo) · FLUJO_ESTADOS.md · FLUJO_CORREOS.md · RUBRICA_JURADOS.md ·
MODELO_DATOS_Y_RELACIONES.md · OPERACION_HUMANA.md · RESET_PRODUCCION.md · QA_FINAL.md.

---

## 1. Qué existe y cómo se conecta

```
 Sitio público (GitHub Pages)                    Aplicación web (Google Apps Script)
 https://elbunkerarte.github.io/                 formularios públicos + paneles privados
 ├─ Inicio, Reglas, Términos, Política,   ──►    ├─ Formulario 1: inscripción
 │  Derechos y reclamos                          ├─ Mi inscripción (estado oficial)
 └─ atajos /inscripcion/ /mi-inscripcion/        ├─ Cambio de horario
    /cambio-horario/ /integrantes/               ├─ Equipo y firmas (integrantes)
    (reenvían a la aplicación web)               └─ Paneles: admin · check-in · jurado · dashboard
                                                          │
                                                          ▼
                                   BASE MAESTRA (Google Sheets, privada)
                                   REGISTRO = fuente única de verdad
                                   + hojas internas y vistas reconstruidas
                                                          │
                     ┌────────────────────────────────────┼─────────────────────────────┐
                     ▼                                    ▼                             ▼
      Correos automáticos y de panel        Google Drive (privado):          WhatsApp oficial
      (Gmail de la cuenta dueña del         respaldos, Excel, pistas         SOLO canal humano:
      sistema, remitente «EL BÚNKER —       Audio/B-XXX, firmas              una persona envía el texto
      Arte es la Solución»)                                                  que prepara el panel
```

- **Sitio público** (`site/`, publicado en `https://elbunkerarte.github.io/`): informa y lleva a los
  formularios. No guarda datos. Sus páginas `/inscripcion/`, `/mi-inscripcion/`, `/cambio-horario/`
  e `/integrantes/` solo **reenvían** a la aplicación web y conservan lo que venga después del `?`
  (por eso un enlace de equipo sigue funcionando si pasa por el sitio).
- **Aplicación web** (Google Apps Script). Dirección base de producción (en este documento, `BASE`):
  `https://script.google.com/macros/s/AKfycbzKtLSLUeXi5QnTjNa1yVZawOBSCRzMFwCwTw9hoal7K8fWMgnfli9Mk6RU76YkcNkW/exec`
  Sirve los formularios públicos y los paneles internos. Los paneles solo abren con un **enlace
  personal** (firmado, caduca a los 45 días de emitido y deja de servir si coordinación genera uno
  nuevo para la misma persona).
- **Base maestra** (Google Sheets, privada): la hoja `REGISTRO` es la fuente única de verdad (una fila
  por proyecto: solista, dúo o agrupación). `AGENDA`, `CHECK-IN`, `AGRUPACIONES`, `PISTAS`, `RESULTADOS`,
  `DASHBOARD`, `BOLSA` y `SEGURO_MAYORCA` **se reconstruyen** desde ella (automáticamente cada 6 horas y
  con el botón **Refrescar vistas**). Las hojas que empiezan por `_` son internas.
- **Correo**: sale de la cuenta de Gmail dueña del sistema, con el nombre «EL BÚNKER — Arte es la
  Solución». Cuota aproximada: **100 correos al día**; lo que no alcanza queda en cola y el sistema la
  revisa **cada 15 minutos**. Nadie recibe dos veces el mismo correo.
- **WhatsApp**: nunca es automático. El panel prepara el texto exacto y un botón **Abrir chat**; una
  persona lo envía desde el número oficial. WhatsApp es un canal, **no** una base de datos.
- **Tareas automáticas** instaladas: respaldo diario (11 p. m.), refresco de vistas (cada 6 h), revisión
  de enlaces de video (cada hora), vencimiento de ofertas a suplentes (cada hora) y cola de correos
  (cada 15 min).

---

## 2. Todos los enlaces del sistema

Reglas de esta tabla: solo aparecen rutas que existen en el código. Donde hace falta un enlace
personal (`t=`) o una clave de equipo (`k=`) se muestra la **forma** de la ruta, nunca un enlace real.
Cualquier otra ruta `?p=…` abre la página «No tienes acceso a esta sección» (motivo `PAGINA_DESCONOCIDA`).

### 2.1 Sitio público (GitHub Pages)

| URL | Público / privado | Rol que lo usa | A dónde lleva | Función principal | Cuándo se usa | Qué datos permite ver / modificar |
|---|---|---|---|---|---|---|
| `https://elbunkerarte.github.io/` | Público | Cualquier persona | Página de inicio | Presenta la convocatoria: Requisitos, Cómo participar, ¿Qué pasa después de inscribirme?, Cómo será la audición, Qué debes preparar; botón **Inscríbete** | Toda la convocatoria | Solo información pública (fecha, lugar, cupos, edades). No guarda nada |
| `https://elbunkerarte.github.io/inscripcion/` | Público | Participante | Reenvía a `BASE?p=inscripcion` | Atajo al Formulario 1 | Mientras las inscripciones estén abiertas | Ninguno (solo reenvía) |
| `https://elbunkerarte.github.io/mi-inscripcion/` | Público | Participante / representante | Reenvía a `BASE?p=mi-inscripcion` | Atajo a «Mi inscripción» | Siempre | Ninguno (solo reenvía) |
| `https://elbunkerarte.github.io/cambio-horario/` | Público | Participante con código | Reenvía a `BASE?p=cambio-horario` | Atajo al formulario de cambio | Hasta el cierre de cambios | Ninguno (solo reenvía) |
| `https://elbunkerarte.github.io/integrantes/` | Público (con clave para usarlo) | Integrantes y equipo de trabajo | Reenvía a `BASE?p=integrantes` conservando `?g=…&k=…` | Atajo a «Equipo y firmas» | Hasta que venzan los enlaces de equipo | Ninguno (solo reenvía) |
| `https://elbunkerarte.github.io/reglas.html` | Público | Cualquier persona | Reglas de la convocatoria | 11 secciones: inscripción, turnos, cambio de horario, reemplazo por suplente, confirmación final, puntualidad, evaluación, pistas, video, conducta | Consulta | Solo lectura |
| `https://elbunkerarte.github.io/terminos.html` | Público | Cualquier persona | Términos y condiciones | Texto legal que se acepta en los formularios | Consulta / aceptación | Solo lectura |
| `https://elbunkerarte.github.io/politica-datos.html` | Público | Cualquier persona | Política de tratamiento de datos | Qué datos se recogen, para qué, quién los ve, derechos | Consulta / aceptación | Solo lectura |
| `https://elbunkerarte.github.io/contacto.html` | Público | Cualquier persona | Derechos y reclamos | Canal oficial para datos y reclamos, dudas operativas, preguntas frecuentes | Consulta | Solo lectura |

### 2.2 Aplicación web — páginas públicas (`BASE` = la dirección `/exec` de producción)

| URL | Público / privado | Rol que lo usa | A dónde lleva | Función principal | Cuándo se usa | Qué datos permite ver / modificar |
|---|---|---|---|---|---|---|
| `BASE` o `BASE?p=inscripcion` | Público | Participante (solista, líder de dúo o agrupación) | **Formulario 1** (pasos 1 Tus datos … 7 Revisa y envía, botón **Enviar mi inscripción**) | Inscribir un proyecto. Al final muestra **Tu comprobante** (S-XXXX), el código y la clave de «Equipo y firmas» y envía el correo de recepción | Mientras CONFIG `inscripciones_abiertas` = SI | Crea la fila en `REGISTRO` en estado RECIBIDA (o INCOMPLETA si faltan datos) y la persona que inscribe en `_INTEGRANTES` |
| `BASE?p=mi-inscripcion` (opcional `&code=B-XXX` para precargar) | Público; se identifica con **documento + código B-XXX o comprobante S-XXXX** | Participante / representante | **Mi inscripción** | Estado oficial; código y horario; enlace a cambio de horario; **Confirmación final de asistencia**; **¿Ya no puedes asistir?**; oferta de cupo a suplente; **Equipo y firmas**; **Tu pista**; **Tu video** | Siempre | Ve solo su propio proyecto. Puede: confirmar asistencia, liberar su cupo, aceptar o rechazar una oferta, subir su pista |
| `BASE?p=cambio-horario` (opcional `&code=B-XXX`) | Público; exige código + nombre completo idéntico al registrado + WhatsApp | Participante con código | **Solicitud de cambio de horario** (botón **Enviar solicitud**) | Pedir **una sola vez** un cambio; no elige la hora | Hasta CONFIG `cierre_cambios` (jueves 22-oct, 6:00 p. m.) y mientras la lista oficial no esté consolidada | Crea la solicitud en `_CAMBIOS` en estado PENDIENTE; el horario original sigue vigente |
| `BASE?p=integrantes&g=<código de equipo>&k=<clave>` | Acceso con clave de equipo — enlace del proyecto entregado por separado (se ve al terminar la inscripción y en «Mi inscripción»). Sin `g` y `k` la página pide código y clave | Cada integrante (intérprete) y cada persona del equipo de trabajo | **Equipo y firmas** (1 Tu proyecto → 2 Tus datos → 3 Tu autorización individual → **Registrar mi autorización**) | Cada persona da **su propia** autorización y firma; elige **Intérprete (subo a tarima)** o **Equipo de trabajo** | Hasta CONFIG `enlaces_equipo_vencen` (24-oct) y mientras `integrantes_abierto` = SI | Agrega o actualiza a esa persona en `_INTEGRANTES`. No muestra datos de las demás personas |
| `BASE?p=gracias` | Público | — | Página «Listo · Consulta tu estado» (heredada de la versión 1) | Consulta rápida con documento **y** código o comprobante (igual que «Mi inscripción») | **Ningún botón del sistema enlaza a esta página**; existe por compatibilidad | Muestra código, estado, bloque y horas. Con el documento solo no responde nada |

### 2.3 Aplicación web — páginas privadas (enlace personal)

| URL | Público / privado | Rol que lo usa | A dónde lleva | Función principal | Cuándo se usa | Qué datos permite ver / modificar |
|---|---|---|---|---|---|---|
| `BASE?p=admin&t=…` — acceso autenticado — enlace personal entregado por separado | Privado | admin, logística/coordinación | **PANEL BÚNKER** con pestañas **Inscritos · Agrupaciones · Aptitud y códigos · Bolsa y reemplazos · Cambios de horario · Pistas · Comunicación · Respaldo y sistema** | Operación completa de la convocatoria | Todos los días desde que abren inscripciones | Datos personales completos. Decide aptitud, emite códigos, retira y reemplaza, resuelve cambios, sube pistas, envía correos, genera Excel, respalda, consolida la lista, cierra la jornada |
| `BASE?p=checkin&t=…` — acceso autenticado — enlace personal entregado por separado | Privado | check-in (mesas, stage manager, técnico de audio), logística, admin | **CHECK-IN**: **Buscar participante** y pestañas **Lista por bloque · Escena · Pistas · Contingencia · Pendientes de sincronizar** | Registrar llegada y flujo de escena; funciona con mala conexión (guarda en el dispositivo y sincroniza) | Día del evento (23-oct) | Ve a quienes tienen código: nombre, documento del líder y de cada integrante, bloque, horas, formato, necesidades técnicas, pista, autorización de imagen. Cambia solo el estado de asistencia |
| `BASE?p=jurado&t=…` — acceso autenticado — enlace personal entregado por separado | Privado | jurado 1, 2 y 3 (admin puede abrirla, pero solo un jurado califica) | **JURADO**: **Cómo calificar (rúbrica oficial)**, lista **Participantes**, tarjeta de evaluación | Calificar cada audición REALIZADA; **Guardar borrador** / **ENVIAR Y BLOQUEAR EVALUACIÓN**; reportar causal de descalificación | Día del evento, después de cada audición | Ve código, nombre artístico, modalidad, estado de audición y **solo sus propias** evaluaciones. Sin documentos, contactos, notas de otros jurados ni ranking |
| `BASE?p=dashboard&t=…` — acceso autenticado — enlace personal entregado por separado | Privado | dirección, admin, logística | **DASHBOARD**: **INDICADOR OPERATIVO**, **Avance de la jornada**, gráficos, **Agrupaciones**, **Pistas y videos**; solo dirección/admin ven además **Resultado consolidado (privado)**, **Descalificaciones, correcciones y cierre** e **Inscritos (datos protegidos)** | Seguimiento y, para dirección, resultados y cierre | Todo el proceso; resultados después del evento | Indicadores operativos. Los puntajes, la gráfica **Top 10 · seleccionados** y el promedio global solo los ve dirección (logística ve el mismo dashboard sin puntajes ni ranking). Dirección: Top 20 privado, actas de desempate, validar descalificaciones, reabrir una evaluación, cerrar y reabrir resultados, generar el Excel corporativo y el de la póliza; inscritos con documento, correo y teléfono **enmascarados** |
| `BASE?p=constancia&g=<GRP-xxx o EQ-xxx>&t=…` — acceso autenticado — enlace personal entregado por separado | Privado | admin, logística, check-in | **Constancia de aceptación · EL BÚNKER** (botón **Imprimir**) | Hoja imprimible con integrantes, documentos, autorizaciones, firmas y renglones en blanco para firmar en papel | Antes del evento y en la mesa de check-in | Solo lectura (datos personales del proyecto) |
| Cualquier página privada sin enlace válido | — | — | «No tienes acceso a esta sección» con el motivo (enlace caducado, reemplazado, rol sin acceso…) | Protección | — | Ninguno |

> Nota técnica: la misma dirección `BASE` acepta llamadas `?api=1&accion=…` que usan las propias
> pantallas. No es una página para personas; cada acción revisa los permisos del rol.

### 2.4 Enlaces auxiliares reales

| Enlace | Público / privado | Quién | Qué es |
|---|---|---|---|
| Base maestra (Google Sheets) | Privado | admin (y quien él autorice en Google) | La hoja de cálculo que imprime la instalación como «BASE MAESTRA». No se comparte |
| Carpeta de Drive **EL BUNKER - Respaldos** | Privado | admin, logística | Respaldos diarios y manuales, Excel corporativo, Excel de la póliza, JSON de la lista oficial. El panel da el enlace (**Abrir carpeta de respaldos**, **Copia en Drive**) |
| Carpeta **Audio/B-XXX** en Drive | Privado | logística, técnico de audio | Pistas renombradas `B-XXX_ARTISTA_CANCION`. Botón **Abrir carpeta Audio** |
| `wa.me/…` (botones **Abrir chat** y **Enviar por WhatsApp**) | Abre WhatsApp | logística; el participante (para compartir su enlace de equipo) | Abre el chat con el texto listo; no envía nada solo |
| Invitación al grupo de WhatsApp (CONFIG `whatsapp_grupo_enlace`) | La crea la organización | logística | Hoy está **vacía**: mientras lo esté, la plantilla «Invitación al grupo de WhatsApp» no aparece |
| `https://www.instagram.com/elarteeslasolucion_/` y `https://www.instagram.com/aesproducciones_/` | Público | Cualquiera | Redes que enlaza el pie del sitio |

### 2.5 Dónde vive cada función (algunas no son una URL propia)

| Lo que buscas | Dónde está |
|---|---|
| Página pública | `https://elbunkerarte.github.io/` |
| Formulario de inscripción | `BASE?p=inscripcion` (o el atajo `/inscripcion/` del sitio) |
| Comprobante | Aparece al terminar el Formulario 1 (**Tu comprobante**, S-XXXX) y en el correo de recepción. No es una URL |
| Estado de la inscripción | `BASE?p=mi-inscripcion` — es el **estado oficial** |
| Cambio de turno | Participante: `BASE?p=cambio-horario` (también el enlace «solicitar cambio de horario» dentro de Mi inscripción). Equipo: pestaña **Cambios de horario** del panel |
| Retiro / reemplazo | Participante: sección **¿Ya no puedes asistir?** (botón **NO PUEDO ASISTIR — SOLICITAR REEMPLAZO**) y sección **Se liberó un cupo para ti** (botones **ACEPTAR EL CUPO** / **No puedo**) dentro de Mi inscripción. Equipo: pestaña **Bolsa y reemplazos** |
| Confirmación final | Sección **Confirmación final de asistencia** (botones **SÍ CONFIRMO** / **NO PODRÉ ASISTIR**) dentro de Mi inscripción, solo el 22-oct. No es una URL propia |
| Área administrativa | `BASE?p=admin&t=…` |
| Logística / check-in | Logística trabaja en `BASE?p=admin&t=…`; el día del evento, `BASE?p=checkin&t=…` |
| Espacio de jurados | `BASE?p=jurado&t=…` |
| Gestión de firmas | Participantes: `BASE?p=integrantes&g=…&k=…`. Equipo: pestaña **Agrupaciones** (botones **Copiar enlace de integrantes**, **Constancia imprimible**, **Cambiar integrantes declarados**), la página de constancia y la ficha de check-in |
| Equipo de trabajo | Misma página «Equipo y firmas», opción **Equipo de trabajo** (no ocupa cupo ni se califica). No tiene URL propia |
| Exports / Excel | Panel → **Respaldo y sistema** → tarjeta **Excel corporativo y póliza** (**Generar Excel corporativo**, **Generar Excel de la póliza**) y tarjeta **Respaldos** (**Respaldo completo**, **Solo exportar XLSX**, **Respaldar audios**). Detalle en [EXPORT_EXCEL.md](EXPORT_EXCEL.md) |
| Vista de seguro | Hoja `SEGURO_MAYORCA` de la base maestra (privada) y el botón **Generar Excel de la póliza** |
| Resultados | Dashboard → **Resultado consolidado (privado)** → **Calcular resultados** (solo dirección y admin) |

---

## 3. Quién hace qué

La instalación crea estas cuentas (cada una recibe **su propio** enlace; no se comparten):

| Cuenta (alias) | Rol | Pantallas que abre |
|---|---|---|
| `admin` | admin | Todas |
| `coordinacion` | logística | Panel (`admin`), check-in, dashboard, constancia |
| `direccion` | dirección | Dashboard |
| `checkin-1`, `checkin-2` | check-in | Check-in, constancia |
| `stage-manager` | check-in | Check-in (pestaña **Escena**) |
| `tecnico-audio` | check-in | Check-in (pestaña **Pistas**) |
| `jurado-1`, `jurado-2`, `jurado-3` | jurado | Jurado |

Admin puede crear más en **Respaldo y sistema → Accesos del equipo** (Alias, Rol, Nota → **Crear acceso**).
Para un jurado, la nota debe decir «jurado 1», «jurado 2» o «jurado 3»: así el sistema sabe en qué hoja
(`JURADO_1`, `JURADO_2`, `JURADO_3`) guarda sus notas. **Generar un enlace nuevo para un alias existente
anula el anterior.**

| Rol | Qué hace | Qué datos ve | Qué NO puede hacer |
|---|---|---|---|
| **Dirección** | Sigue los indicadores; ve el **Top 20 privado**; registra el **Acta de desempate**; valida o descarta descalificaciones (**Ver reportes → Validar / Descartar**); **Reabrir evaluación**; **Cerrar resultados** y **Reabrir resultados** (con motivo); **Generar Excel corporativo** (enmascarado) y **Excel de la póliza** desde su dashboard | Indicadores y resultados. Inscritos con documento, correo y teléfono **enmascarados** («Inscritos (datos protegidos)») | No entra al panel de logística; no decide aptitud, no emite códigos, no retira ni consolida la lista. Tiene permiso de exportar, pero **ninguna pantalla de dirección tiene el botón**: el Excel lo genera coordinación o admin |
| **Administración / coordinación (logística)** | Todo el día a día: aptitud, agrupaciones, códigos, bolsa, retiros, reemplazos, cambios, pistas, correos, videos, Excel, respaldos, **CONSOLIDAR LISTA OFICIAL DEL EVENTO**, **Cerrar jornada** | Datos personales completos (los necesita para operar) | Crear accesos, ver **Estado del sistema**, **Desbloquear** la lista, cerrar o reabrir resultados, validar descalificaciones, reabrir evaluaciones, registrar actas |
| **Admin** (además de lo anterior) | **Accesos del equipo**, **Estado del sistema**, **Desbloquear (solo admin, emergencia)**, instalación y migración desde el editor | Todo | — |
| **Check-in** (mesas, stage manager, técnico de audio) | Busca por código o documento (del líder o de cualquier integrante), valida con el **documento físico** y marca **Confirmar CHECK-IN · Pasar a PRECOLA · Sube a escena (EN AUDICIÓN) · Audición REALIZADA (salida) · Pasar a CONTINGENCIA · Marcar NO SHOW** y **Registrar incidente**; calcula el plan de contingencia; da pistas al técnico | Solo a quienes tienen código: nombre, documento, integrantes, horario, formato, pista, autorización de imagen. **Sin correo ni teléfono** | Cambiar aptitud, horarios o códigos; ver resultados. Solo ve los botones de los cambios de estado permitidos |
| **Jurado** | Califica cada audición REALIZADA con la rúbrica (7 categorías de 1 a 5 × factor, total 20–100); reporta una posible causal de descalificación | Código, nombre artístico, modalidad, estado de audición y **solo sus propias** evaluaciones | Ver documentos, contactos, notas de otros jurados o el ranking. Una evaluación enviada solo la reabre dirección |
| **Participante / representante** | Se inscribe, consulta su estado, pide un cambio, confirma asistencia, libera su cupo, acepta o rechaza una oferta, sube su pista, comparte el enlace de equipo | Solo su propio proyecto (identificado con documento + código o comprobante). En la sección «Equipo y firmas» de Mi inscripción ve nombres abreviados de su equipo, nunca documentos ajenos | Elegir hora; ver datos de otros |

---

## 4. El ciclo completo (con las fechas de CONFIG)

Todas las horas son de Colombia. Los valores salen de la hoja `CONFIG` (los que instala el sistema por
defecto); si la organización cambia CONFIG, manda CONFIG.

| # | Etapa | Cuándo | Quién y dónde | Qué pasa |
|---|---|---|---|---|
| 1 | **Inscripción** | Mientras `inscripciones_abiertas` = SI (no hay fecha fija: es un interruptor) | Participante en `BASE?p=inscripcion` | El sistema **guarda siempre**. Estado **RECIBIDA** (no es «apto»). Comprobante S-XXXX, código de equipo (GRP-xxx o EQ-xxx) con su clave, correo de recepción |
| 2 | **Revisión** | Cada día mientras llegan inscripciones | Logística: **Aptitud y códigos → Paso 1 · Aplicar la verificación de aptitud → Aplicar verificación y enviar resultados** | Revisa edad (18 a 30 años cumplidos el día del evento), residencia (Sabaneta), datos y duplicados. Las dudosas quedan **EN REVISIÓN** |
| 3 | **Aptitud** | Igual | Logística: pestaña **Inscritos**, filtro «Por revisar», columna **Decisión** (pide motivo). En **Agrupaciones**: **Es el mismo proyecto** / **Son proyectos distintos** | Resultado APTO / NO APTO / INCOMPLETO / DUPLICADO; cada persona recibe su correo. La decisión manual queda registrada y la revalidación la respeta |
| 4 | **Principales y suplentes** | Cuando la organización decida (botón manual) | Logística: **Paso 3 · Emitir B-001 … B-100 → Emitir códigos y asignar bloques** | Los APTO reciben **B-001 a B-100** en **orden de inscripción** (una agrupación = un código). Los siguientes quedan en la **bolsa de suplentes** (puestos 101–200); los demás, fuera de bolsa. Correos de código y de «sin turno». Un código emitido **no se reasigna nunca** |
| 5 | **Turno** | Fijo desde la emisión | — | 10 bloques de 30 min con 10 cupos cada uno, desde las 3:00 p. m.; llegada 15 min antes; **máximo 3 minutos** por audición; tolerancia de 5 min |
| 6 | **Cambio de turno** | Hasta el **jueves 22-oct, 6:00 p. m.** | Participante en `?p=cambio-horario`; logística en **Cambios de horario** → **Nuevo bloque** → **Aprobar** o **Rechazar** | Una sola solicitud por código. La hora la decide producción, solo en un bloque con cupo o en el **margen operativo de 8:00 a 8:30 p. m.** (10 cupos). El código no cambia |
| 7 | **Retiro** | El participante: desde el **viernes 16-oct, 12:00 a. m.** (`reemplazos_desde`). Logística: en cualquier momento antes de consolidar | Participante: **NO PUEDO ASISTIR — SOLICITAR REEMPLAZO** + escribir **LIBERAR MI CUPO**. Logística: **Retirar a un participante (libera solo su cupo)** | Libera **solo ese cupo**; nadie más cambia de horario; nada se borra. No se puede deshacer |
| 8 | **Reemplazo** | Hasta el **jueves 22-oct, 12:00 m.** (`reemplazo_limite`) | Automático; el suplente responde en Mi inscripción | El cupo se ofrece a **un suplente a la vez**, en orden de prioridad, con **24 horas** para aceptar (nunca más allá del límite). Si rechaza o no responde, pasa al siguiente. El suplente hereda el código y el horario del cupo |
| 9 | **Confirmación final** | **Jueves 22-oct, de 12:00 a. m. a 8:00 p. m.** | Participante: **SÍ CONFIRMO** / **NO PODRÉ ASISTIR**. Logística envía el correo «Confirmación final de asistencia (22-oct)» desde **Comunicación** (no sale solo) | SÍ: nada cambia. NO: retiro final (RETIRO_FINAL) y el cupo se ofrece o queda vacante según la hora |
| 10 | **Lista oficial** | **22-oct, después de la confirmación final** (texto del panel) | Logística: **Bolsa y reemplazos → Vista previa y conteos → CONSOLIDAR LISTA OFICIAL DEL EVENTO** (escribir **CONSOLIDAR**) | Cancela ofertas abiertas (esos cupos quedan vacantes), guarda la foto `ROSTER_FINAL_2026-10-22` (hoja + JSON en Drive) y **bloquea los cambios ordinarios**. No borra nada |
| 11 | **Audición** | **Viernes 23-oct, 3:00 a 9:00 p. m., Centro Comercial Mayorca · Etapa 1, Sabaneta** | Check-in, stage manager y técnico de audio en `?p=checkin` | CHECK-IN → PRECOLA → EN AUDICIÓN → REALIZADA. Más de 5 min tarde → CONTINGENCIA. Contingencia de 8:30 a 9:00 p. m. A las 9:00 p. m. logística pulsa **Cerrar jornada**: quien no audicionó queda NO AUDICIONADO |
| 12 | **Jurados** | Tras cada audición REALIZADA | 3 jurados en `?p=jurado` | Cada uno califica **por su cuenta**; su tarjeta es borrador hasta **ENVIAR Y BLOQUEAR EVALUACIÓN** |
| 13 | **Top 20** | Cuando hay evaluaciones | Dirección: **Resultado consolidado (privado) → Calcular resultados** | Puntaje final = **promedio de los 3 jurados** (solo cuentan tarjetas enviadas; hacen falta las 3). **Ranking privado: nunca se publica ni se comunica a participantes** |
| 14 | **Top 10** | Igual | — | Los 10 primeros son los **seleccionados públicos** |
| 15 | **Cierre** | Cuando todo está evaluado | Dirección: **Cerrar resultados** (escribir **CERRAR**). Después, logística envía el correo «Resultado final (tras cerrar resultados)» desde **Comunicación** | Exige las 3 evaluaciones enviadas de cada audición, ningún empate sin acta y ninguna descalificación pendiente. Bloquea las evaluaciones; el Top 10 queda definitivo. El correo dice solo SELECCIONADO / NO SELECCIONADO |

Otras fechas de CONFIG: los enlaces de «Equipo y firmas» funcionan hasta el **24-oct**.

---

## 5. Contingencias (qué hace el sistema y qué hace la persona)

### 5.1 Alguien cancela una semana antes (viernes 16-oct)

- **Sistema:** desde el 16-oct a las 12:00 a. m. la persona ve en Mi inscripción **NO PUEDO ASISTIR —
  SOLICITAR REEMPLAZO**. Al escribir **LIBERAR MI CUPO** y pulsar **Sí, liberar mi cupo**: su código pasa a
  «código anterior», recibe el correo de retiro y el cupo se **ofrece al siguiente suplente** con 24 h para
  aceptar (le llega un correo y lo ve en su Mi inscripción).
- **Persona del equipo:** no tiene que hacer nada más que mirar **Bolsa y reemplazos → Cupos B-001 … B-100**
  e **Historial de ofertas**. Si quien cancela **llama o escribe por WhatsApp** en lugar de usar el botón,
  logística lo registra en **Retirar a un participante (libera solo su cupo)**: Código + Motivo →
  **Retirar y ofrecer el cupo** (esto también sirve antes del 16-oct, cuando el participante aún no tiene
  el botón).
- Ejemplo: B-037 avisa el 17-oct. Logística escribe «B-037» y «Llamó el 17-oct: viaje de trabajo». El cupo
  B-037, con su mismo bloque y hora, se ofrece al suplente #101 (o al primero disponible).

### 5.2 El suplente rechaza (o no responde)

- **Sistema:** si pulsa **No puedo** (y confirma), la oferta queda RECHAZADA, ese suplente **ya no recibirá
  nuevas ofertas** y el cupo pasa solo al siguiente suplente. Si no responde en 24 h, la oferta **vence**
  sola (revisión cada hora) y pasa al siguiente.
- **Persona:** nada obligatorio. Si quieres forzar la revisión de vencidas ya: **Recalcular bolsa y vencer
  ofertas**. Puedes escribirle por WhatsApp para recordarle que mire su correo, pero **la respuesta solo
  cuenta si la da en Mi inscripción**.

### 5.3 Retiro un día antes (jueves 22-oct)

- **Sistema:** ese día la persona ve **Confirmación final de asistencia**. Si pulsa **NO PODRÉ ASISTIR** y
  escribe **LIBERAR MI CUPO**, queda como **retiro final**. Qué pasa con el cupo depende de la hora:
  - antes de las **11:00 a. m.**: se ofrece al siguiente suplente, pero con plazo solo hasta las
    **12:00 m.** (el límite de reemplazos);
  - entre las **11:00 a. m. y las 12:00 m.**: queda **VACANTE SIN REEMPLAZO** (el sistema exige que el
    suplente tenga al menos una hora para responder);
  - después de las **12:00 m.**: queda **VACANTE SIN REEMPLAZO**.
- **Persona:** si alguien que **ya confirmó SÍ** avisa que no vendrá, ya no tiene botón en su pantalla:
  logística usa **Retirar a un participante** y marca **Es un retiro de la confirmación final (22 de
  octubre)**. Después de consolidar la lista ya no hay retiros: quien no llegue el 23-oct se marca
  **Marcar NO SHOW** en check-in.

### 5.4 Vacante sin reemplazo

- **Sistema:** un cupo queda **VACANTE SIN REEMPLAZO** cuando no quedan suplentes, cuando ya pasó el límite
  del 22-oct 12:00 m., cuando no queda una hora para responder, o cuando alguien lo cierra a mano. El
  sistema **no mueve a nadie** a ese horario y el hueco no se rellena solo el día del evento.
- **Persona:** antes del límite, si aparecieron nuevos aptos, logística puede pulsar **Ofrecer al
  siguiente** en ese cupo. Para cerrar un cupo liberado u ofrecido a propósito: **Cerrar sin reemplazo**
  (pide motivo). **Nunca** se escribe un nombre a mano en la hoja para «llenar» el cupo.

### 5.5 Cambio de turno pendiente

- **Sistema:** mientras una solicitud esté PENDIENTE, el horario original sigue vigente y el participante
  lo ve así en Mi inscripción. La **Vista previa y conteos** avisa «Hay cambios pendientes — Resuélvelos
  antes de consolidar».
- **Persona:** logística abre **Cambios de horario**, elige **Nuevo bloque** (solo aparecen bloques con cupo
  y el margen de 8:00–8:30 p. m.) y pulsa **Aprobar**, o **Rechazar** con el motivo (se le comunica al
  participante). Los correos salen solos. **Importante:** el sistema **no impide** consolidar con
  solicitudes pendientes, pero después de consolidar ya no deja aprobarlas ni rechazarlas; la persona se
  quedaría con su horario original. Resuélvelas **antes** de consolidar.

### 5.6 Empate entre jurados

- Los jurados **no se desempatan entre sí**: cada uno califica por su cuenta y el puntaje final es el
  **promedio de las 3 tarjetas enviadas**. Si un proyecto no tiene las 3 tarjetas enviadas, no entra al
  ranking y **Cerrar resultados** no deja cerrar.
- Si **dos proyectos empatan** en el puntaje final, el sistema desempata solo con la suma de **Presencia
  escénica + Factor arena**. Si aún empatan justo en el puesto 10 o en el 20, `RESULTADOS` marca «requiere
  comité» y dirección llena el **Acta de desempate** (Corte · Método: «Se repite una canción corta a
  criterio del jurado» o «Voto de calidad del jurado musical» · Orden decidido · Participantes · Resultado
  y motivo) → **Registrar acta**. Sin esa acta, **Cerrar resultados** no deja cerrar.
- Si un jurado se equivocó en una tarjeta ya enviada: dirección usa **Reabrir una evaluación enviada**
  (Código, Jurado, Motivo → **Reabrir evaluación**) y el jurado la corrige y la vuelve a enviar. Solo se
  puede antes de cerrar resultados.

### 5.7 Otros imprevistos frecuentes

| Situación | Qué hacer |
|---|---|
| Un miembro del equipo perdió su enlace o se le filtró | Admin genera uno nuevo en **Accesos del equipo** con el mismo alias: el anterior deja de funcionar |
| Algo salió mal en escena o se marcó un estado por error (por ejemplo, REALIZADA) | En la ficha de check-in: **Registrar incidente** (qué pasó y qué se hizo). Queda en la hoja `INCIDENTES` y coordinación lo corrige |
| Se cae el internet en la mesa de check-in | Seguir marcando: queda en **Pendientes de sincronizar** y se envía solo al volver la conexión (o **Sincronizar ahora**) |
| Un integrante no firmó en línea | En la ficha de check-in: **Abrir constancia imprimible (firmas en papel)**; firma en papel tras verificar su documento original |
| Correo FALLIDO | **Comunicación → Registro de correos** (filtro «Fallidos»): corregir el correo de esa persona en `REGISTRO` (es lo que indica la propia pantalla) y **Reintentar fallidos** |
| Pista llegó por WhatsApp | **Pistas → Subir una pista recibida por WhatsApp** (Código, Canción, Archivo → **Subir y renombrar**) |
| Hay que corregir la lista ya consolidada | Solo admin, emergencia: **Desbloquear (solo admin, emergencia)** con motivo; al terminar, volver a consolidar (se crea una versión nueva) |

---

## 6. Rutina diaria del equipo

**Mientras hay inscripciones (logística):**
1. Abrir el panel → pestaña **Inscritos**: mirar la métrica **Por revisar**.
2. **Aptitud y códigos → Aplicar verificación y enviar resultados** (procesa todas las RECIBIDAS).
3. **Inscritos**, filtro «Por revisar (recibidas + en revisión)»: decidir cada EN REVISIÓN en **Decisión**.
4. **Agrupaciones**: resolver cada «Posible agrupación repetida».
5. **Comunicación → Registro de correos**: revisar fallidos. **Videos → Verificar pendientes** si hace falta.
6. **Respaldo y sistema**: el respaldo nocturno es automático; en cada hito, **Respaldo completo** con su
   etiqueta (Pre-evento, Agenda, Post-evento, Resultados).

**Del 16 al 21 de octubre:** además, **Bolsa y reemplazos** (cupos ofrecidos, liberados y vacantes) y
**Cambios de horario** (resolver pendientes).

**Jueves 22 de octubre:**
1. Temprano: **Comunicación** → plantilla «Confirmación final de asistencia (22-oct)» → **Enviar por
   correo**. Con la cuota de ~100 correos/día, la cola envía primero esta plantilla antes que el
   «Recordatorio 24 h antes».
2. Durante el día: **Bolsa y reemplazos** y **Cambios de horario** (todo resuelto antes de las 8:00 p. m.).
3. Después de las 8:00 p. m.: **Vista previa y conteos** → revisar que no haya «Códigos con dos titulares»
   ni cambios pendientes → **CONSOLIDAR LISTA OFICIAL DEL EVENTO**.

**Viernes 23 de octubre:** check-in desde el enlace de cada mesa; técnico de audio en **Pistas**; stage
manager en **Escena**; a las 8:30 p. m. **Contingencia → Calcular plan ahora**; a las 9:00 p. m. logística
pulsa **Cerrar jornada**.

**Después:** jurados terminan de enviar; dirección revisa **Calcular resultados**, actas y descalificaciones
y pulsa **Cerrar resultados**; logística envía «Resultado final (tras cerrar resultados)».

---

## 7. Botones y procesos que SOLO toca el rol autorizado

| Botón o proceso | Quién | Por qué es delicado |
|---|---|---|
| **CONSOLIDAR LISTA OFICIAL DEL EVENTO** (escribir CONSOLIDAR) | Logística/admin, una vez, el 22-oct tras la confirmación final | Bloquea retiros, reemplazos, cambios y confirmaciones; cancela ofertas abiertas |
| **Desbloquear (solo admin, emergencia)** | Solo admin | Reabre cambios sobre una lista ya oficial |
| **Cerrar resultados** (escribir CERRAR) | Dirección/admin | Bloquea evaluaciones y deja el Top 10 definitivo |
| **Reabrir resultados** (con motivo) | Dirección/admin | Deshace un cierre; el Top 10 deja de ser definitivo hasta volver a cerrar |
| **Reabrir evaluación** | Dirección/admin | Cambia una nota ya enviada por un jurado |
| **Retirar y ofrecer el cupo** (liberar un cupo a nombre de alguien) | Logística/admin, **solo con el aviso de la persona** y motivo | No se puede deshacer |
| Columna **Decisión** → NO APTO / DUPLICADO / INCOMPLETO a alguien con código | Logística/admin | Obliga a **liberar su cupo** y ofrecerlo al siguiente suplente |
| **Emitir códigos y asignar bloques** | Logística/admin | Un código emitido no se reasigna nunca |
| **Cerrar jornada** | Logística/admin, a la hora de cierre | Deja NO AUDICIONADO a todo el que no audicionó |
| **Enviar por correo** | Logística/admin | Envía correos reales a todo el filtro elegido |
| **Crear acceso** | Solo admin | Un enlace nuevo anula el anterior de ese alias |
| Quitar inscripciones | Solo el administrador técnico desde el editor (no hay botón) | Borra filas; solo para pruebas que llegaron a producción, con respaldo previo |
| Editar hojas a mano | Nadie | `REGISTRO` es la verdad; las vistas (`AGENDA`, `CHECK-IN`, `AGRUPACIONES`, `PISTAS`, `RESULTADOS`, `DASHBOARD`, `BOLSA`, `SEGURO_MAYORCA`) se **sobrescriben** al refrescar; las hojas con `_` son internas; `ROSTER_FINAL_…` dice «No se edita»; `JURADO_1..3` solo desde la pantalla de jurado. Única excepción que indica la pantalla: corregir el correo de una persona con correo FALLIDO |
| Editar `CONFIG` | Solo admin | Cambia fechas, cupos y ventanas. Si cambia edad o residencia: **Revalidar inscripciones** |
| Editar `PARAMETROS_RUBRICA` | Nadie durante la evaluación; solo dirección antes del evento | Es la rúbrica vigente: si queda inválida, los jurados ven «La rúbrica configurada no es válida» y no pueden calificar |

---

## 8. Dónde vive la información oficial (y por qué no hay segunda fuente)

- **Lo oficial está en la base maestra** (la hoja `REGISTRO` y sus hojas internas) y se ve en los
  **paneles**. El participante ve su estado oficial en **Mi inscripción** («Este es el estado oficial de tu
  inscripción»).
- **El Excel es una foto**: «Son una foto de la base: lo que edites en el archivo no vuelve al sistema».
  Si un dato está mal, se corrige en el panel y se genera un Excel nuevo ([EXPORT_EXCEL.md](EXPORT_EXCEL.md)).
- **Un correo es un aviso de un momento**: después puede cambiar (un cambio aprobado, una oferta vencida).
  Ante la duda, manda Mi inscripción o el panel.
- **WhatsApp es solo un canal**: lo que alguien dice por WhatsApp **no existe** para el sistema hasta que
  alguien lo registra en el panel (retiro con **Retirar a un participante**, pista con **Subir una pista
  recibida por WhatsApp**). Nunca se lleva una lista paralela en un chat, una libreta o un Excel aparte:
  dos listas terminan diciendo cosas distintas y el día del evento solo vale la del sistema.
- **Público vs. privado:** son públicos 100 turnos, 3 jurados, 10 seleccionados y un máximo de 3 minutos por
  audición. El **Top 20 es privado**: no se publica ni aparece en los correos a participantes.
