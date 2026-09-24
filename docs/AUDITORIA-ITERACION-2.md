# EL BÚNKER — Auditoría y plan de la iteración 2

Fecha de la auditoría: **2026-09-24**. Fuente de la iteración: `PROMPT_MAESTRO_EL_BUNKER primario.docx` (Drive de la
organización) más los anexos de identidad (logo AES, wordmark BUNKER, paleta y tipografías).

Método: cada punto se verificó contra el sistema real (código del repositorio, producción vía API de solo lectura,
Drive de la cuenta, proyecto de pruebas). Durante la auditoría **no se modificó producción**.

---

## 1. Diagnóstico

### ✅ Ya resuelto (verificado)

| # | Punto | Evidencia |
|---|---|---|
| R1 | Producción existe y responde | Formulario `?p=inscripcion` HTTP 200; sitio público HTTP 200; API `dashboard` responde (2 inscritos, 2 APTO, 0 códigos) |
| R2 | Base maestra automatizada (14 hojas), CONFIG, emisión B-001…B-100, check-in offline, evaluación, dashboard, INICIO-RAPIDO | Código + 97 pruebas; dataset de 130 → exactamente 100 códigos |
| R3 | Respaldo diario automático | 7 archivos `AUTO-2026091x-2321.xlsx` en `EL BUNKER - Respaldos` (17–23 sep) |
| R4 | Rúbrica idéntica a la pedida (8 factores, pesos 20/20/15/10/10/10/5/10, `(nota/10)*peso`, desempate Performance → Talento → Identidad → comité) | `04_core_rubrica.gs` + pruebas |
| R5 | Anti-duplicados: cédula = duplicado; correo/teléfono = alerta | `detectarDuplicado` + pruebas |
| R6 | Idempotencia (doble clic, reintento, webhook repetido) | Probada en producción: 2 POST idénticos → 1 fila |
| R7 | RBAC 5 roles con permiso por página | 13/13 rutas verificadas en producción |
| R8 | Formulario 2 (cambio de horario): una solicitud, producción asigna, el código no cambia, registra hora original/nueva/estado/fecha/responsable | `accionSolicitarCambio` / `accionResolverCambio` |
| R9 | Contingencia: >5 min → contingencia, no show libera turno, no se desplaza al puntual, cierre → NO AUDICIONADO fuera de selección | `05_core_estados.gs` + pruebas |
| R10 | ENSAYO y LIMPIAR bloqueados en producción | `exigirEntornoPruebas` en `ENSAYO()` y `LIMPIAR()` |
| R11 | Proyecto de pruebas separado y **autorizado** | Proyecto `EL BUNKER - PRUEBAS`: OAuth completado hoy sin 2FA (ejecución `AUTORIZAR` 17:21, completada) |

### 🔁 Cambiar

| # | Punto | Estado actual | Cambio |
|---|---|---|---|
| C1 | Datos del evento | 2-oct, 16:00–22:00, sede pendiente, 18–28 años | **23-oct-2026, 3:00–9:00 p. m., Centro Comercial Mayorca, 18–30 años** |
| C2 | Agenda | Bloques desde 16:00, contingencia 21:00–21:30 | Bloques desde **15:00** (B-001…B-100 hasta 20:00), margen 20:00–20:30, contingencia 20:30–21:00, cierre **21:00** |
| C3 | 🐞 **CONFIG ignora cambios de hora** | Sheets convierte `16:00` y `2026-10-02` en fechas; la API devuelve `1899-12-30T16:00:00` y el cálculo de agenda cae al valor por defecto | CONFIG en texto plano + lectura robusta de fecha/hora + prueba |
| C4 | Variable de entorno | `ENTORNO=PRUEBAS/PRODUCCION` (una sola llave) | `ENVIRONMENT=production/test` (por defecto production) **+ marca en la propia hoja de cálculo** (dos llaves: sin las dos no se borra nada) |
| C5 | Datos legales | `PENDIENTE DE COMPLETAR` | Datos informados por la organización (razón social, NIT, representante, correo, teléfono, dirección) con bandera **"verificar contra documento vigente"** |
| C6 | Página pública | Estética de panel (gris/amarillo, chips técnicos, emojis, tabla de bloques en términos) | Rediseño editorial con la identidad entregada: negro #1D1D1B, blanco, ámbar #F7A705; Bebas (subtítulos), Futura→Jost (texto) |
| C7 | Formulario 1 | Campo genérico "Disciplina" | Modalidad (Solista/Dúo/Agrupación) + Género/propuesta principal y secundario; presentación, necesidades, equipo propio, canción, pista, video verificado, disponibilidad con el texto exacto, 4 autorizaciones con versión y fecha |
| C8 | Rol **dirección** ve cédulas, teléfonos y correos en el listado | Expone datos personales a un rol que solo necesita indicadores | Vista enmascarada para dirección |
| C9 | Check-in | CONFIRMADO → CHECK-IN → REALIZADA | Acceso → CHECK-IN → **PRECOLA** → **AUDICIÓN** → SALIDA, con hora y operador en cada paso |
| C10 | Mensajes | Fechas y lugar viejos; sin número oficial | Número oficial **323 983 6182** ("guárdalo como EL BÚNKER — Arte es la Solución"), pista con código B-XXX, integrantes |
| C11 | `ensayoIntegral`, `cargarDatosDePrueba` y `borrarDatosDePrueba` se pueden ejecutar **directamente** desde el editor sin pasar por el bloqueo | Solo las funciones envoltorio están bloqueadas | El bloqueo va dentro de cada función destructiva, no solo en la envoltura |
| C12 | Respaldo diario solo en XLSX | `restaurarDesdeJson` necesita JSON ⇒ los respaldos automáticos no se pueden restaurar | Respaldo diario XLSX + JSON; restauración cubre las hojas nuevas |

### ➕ Falta

| # | Punto |
|---|---|
| F1 | **Agrupaciones**: código interno GRP-XXX, fila maestra + filas hijas, vista colapsable, exportación XLSX con filas agrupadas, una agrupación = un cupo |
| F2 | **Formulario de miembros** con autorización individual (el líder no autoriza por otros), firma dibujada (evidencia, no firma electrónica calificada) y constancia imprimible |
| F3 | **Detección de agrupaciones repetidas** (`group_match_key` sin tocar el nombre visible; el operador decide y queda registrado) |
| F4 | **Pistas**: estados PENDIENTE/RECIBIDA/VALIDADA/CON PROBLEMA, subida del archivo antes del evento, carpetas `Audio/B-XXX/`, nombre `B-XXX_NOMBREARTISTICO_NOMBRECANCION.ext`, copia para el técnico y respaldo |
| F5 | **Verificación de accesibilidad del video** (YouTube no listado, Drive con acceso, Vimeo, otros) |
| F6 | **Anti-abuso**: campo trampa, tiempo mínimo de diligenciamiento, límites de envíos por minuto y por documento |
| F7 | **Deliberación documentada** del comité cuando el empate en el corte no se resuelve con la escalera |
| F8 | Dashboard: válidos, horarios, cambios, agrupaciones/integrantes, pistas, videos e **indicador operativo del bloque actual** |
| F9 | Respaldos etiquetados (pre-evento, agenda, audios, post-evento, resultados) + **manual de recuperación** |
| F10 | Identidad: logo, favicon, imagen social (OG), carpeta `assets/brand/`, `docs/BRAND_GUIDE.md` |
| F11 | Dominio propio: una sola fuente de configuración + guía de migración (sin registrar nada) |
| F12 | Pruebas automatizadas de aislamiento: ENSAYO bloqueado en producción, LIMPIAR bloqueado, ningún dato de prueba en producción, limpiar pruebas no toca producción |
| F13 | Lista de contactos (VCF) para la lista de difusión del número oficial; página "Mi inscripción" (estado, horario, enlace de integrantes, subida de pista) |
| F14 | Documentación del día del evento: personal (9 base) y materiales |

### ⚠️ Riesgo

| # | Riesgo | Nivel | Acción |
|---|---|---|---|
| K1 | **El documento fuente de términos (`Términos y Condiciones Audiciones Artistas.pages`) no está en el paquete** (ni en la carpeta compartida ni en el Drive de la cuenta) | 🔴 bloquea publicación | La organización debe cargarlo. Sin él la página de términos queda marcada como pendiente y el release no procede (regla §35) |
| K2 | **Producción está abierta al público con los datos viejos** (2-oct, 18–28 años) | 🔴 | Recomendación: cerrar inscripciones (`inscripciones_abiertas=NO`) hasta el release. No se tocó por la regla "no modificar producción durante la auditoría" |
| K3 | Las 2 inscripciones de producción (17-sep) aceptaron textos `v1-PENDIENTE` y no tienen los campos nuevos | 🟠 | Si son pruebas: borrarlas. Si son reales: pedirles que se inscriban de nuevo con el formulario nuevo (queda el rastro) |
| K4 | Datos legales "informados", no verificados; el correo **`El.arterslasolucion@gmail.com`** podría tener una errata ("arters" ≠ "artes"); NIT sin dígito de verificación (no se infiere) | 🟠 | Se publican tal cual con bandera `datos_legales_verificados=NO` hasta que la organización confirme |
| K5 | Contradicción: el cuerpo dice **Top 7**; la nota "IMPORTANTÍSIMO" (datos confirmados recientemente) dice **"Pasan 8 artistas"** | 🟠 | Se toma **8** (dato más reciente y marcado como confirmado) y queda en CONFIG `top_seleccionados` para cambiarlo sin código. Confirmar |
| K6 | El token de GitHub de la cuenta caduca el **17-oct**, antes del evento | 🟠 | Renovarlo antes del 15-oct o no habrá despliegues de emergencia |
| K7 | Transferencia/transmisión internacional: los datos viven en Google (infraestructura fuera de Colombia) y el sitio en GitHub | 🟡 | La política lo declara tal cual; el análisis jurídico (transmisión vs transferencia) queda para revisión legal |
| K8 | La firma dibujada no equivale a firma electrónica calificada | 🟡 | Se rotula como evidencia de aceptación y firma manuscrita digitalizada |
| K9 | Cuota de correo Gmail (~100/día) | 🟡 | El correo automático se detiene limpio al agotar cuota; WhatsApp sigue siendo el canal principal |
| K10 | Apps Script no expone la IP del visitante | 🟡 | El límite de envíos es por documento y global; no hay CAPTCHA externo (requiere cuenta y llaves) |

---

## 2. Plan (pequeño, reversible, verificable)

Rama de trabajo: `feat/iteracion-2`. **Producción no se toca** hasta el reporte Ready / Pending / Blocked.
Todo se prueba primero en el proyecto de PRUEBAS, con su propia hoja de cálculo.

| Fase | Contenido | Verificación |
|---|---|---|
| 1 | Auditoría (este documento) | — |
| 2 | Seguridad producción/pruebas: `ENVIRONMENT` + marca en la hoja, bloqueo dentro de cada función destructiva, guardia anti-datos-de-prueba en producción, CONFIG en texto | Pruebas automatizadas con dos entornos simulados + ensayo real en PRUEBAS |
| 3 | Frontend / identidad / logo / fecha / lugar / dominio listo | Capturas móvil y escritorio, contraste AA, enlaces |
| 4 | Formulario principal nuevo | Pruebas de validación + envío real en PRUEBAS |
| 5 | Agrupaciones + miembros + firma + constancia | Pruebas: una agrupación = un cupo; integrantes no descuentan; misma `group_match_key` → revisión |
| 6 | Pistas y necesidades técnicas | Subida real de un archivo en PRUEBAS; nombre y carpeta correctos |
| 7 | Cambio de horario (ajustes) | Pruebas existentes + nuevas |
| 8 | Agenda / check-in / contingencia (PRECOLA, AUDICIÓN, SALIDA) | Pruebas de transiciones + recorrido en PRUEBAS |
| 9 | Jurados / resultados / deliberación / dashboard | Pruebas de empate y acta |
| 10 | Respaldos / QA completo (130 registros + agrupaciones) | ENSAYO real en PRUEBAS; restauración probada |
| 11 | Release | Reporte Ready / Pending / Blocked antes de tocar producción; migración ensayada sobre una base con el esquema viejo |
