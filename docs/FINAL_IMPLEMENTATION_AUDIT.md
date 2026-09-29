# EL BÚNKER — Auditoría final de implementación (iteración 3, release QA)

Fecha: 29 de septiembre de 2026 · Versión del sistema: 3.0.x · Rama: `feat/iteracion-2`
Fuentes que mandan: `EL_BUNKER_PROMPT_MAESTRO_QA_DEFINITIVO_CLAUDE_CODE_28SEP2026.docx` (en adelante, «el prompt») y
`rubrica-jurado-daviarena.pdf` (rúbrica oficial; Daviarena es el venue del documento fuente, no el de este evento).
Trabajo hecho por el asistente de Juan con sus puntos de control: el paso a producción lo autorizó Juan («GO y máximo rigor»).

Documentos hermanos: `QA_FINAL.md` (qué se probó y con qué resultado) · `CHANGELOG_FINAL.md` (qué existía, qué cambió,
qué se preservó) · `RESET_PRODUCCION.md` · `RUBRICA_JURADOS.md` · `MODELO_DATOS_Y_RELACIONES.md` · `FLUJO_ESTADOS.md` ·
`FLUJO_CORREOS.md` · `OPERACION_HUMANA.md` · `EXPORT_EXCEL.md` · `OPERACION_ECOSISTEMA_FINAL.md` · `MANUAL_OPERATIVO_1_PAGINA.md`.

---

## 1. Mapa del sistema (lo que existe)

| Pieza | Dónde vive | Qué hace |
|---|---|---|
| Sitio público | GitHub Pages, `https://elbunkerarte.github.io/` (carpeta `site/`) | Información, reglas, términos, política de datos, botón a la inscripción. No guarda datos. |
| Aplicación web | Google Apps Script (proyecto de PRODUCCIÓN y proyecto de PRUEBAS separados), `.../exec` | Formularios (inscripción, equipo y firmas, Mi inscripción, cambio de horario, pistas) y paneles privados (administración, check-in, jurado, dirección). Toda validación y permiso ocurre en el servidor. |
| Base maestra | Hoja de cálculo de Google de cada entorno | Fuente de verdad. Hojas de datos + vistas reconstruidas por disparadores. |
| Archivos | Google Drive (carpetas de firmas, audios, respaldos) | Firmas PNG (hash SHA-256 en la base), pistas, respaldos XLSX/JSON. |
| Correo | Gmail de la convocatoria vía `MailApp`, cola `_EMAIL_LOG` | Correos transaccionales idempotentes con reintentos. |
| WhatsApp | Número oficial, operado por personas | Canal humano. No es base de datos ni se automatiza. |

Separación de entornos: la propiedad de script `ENVIRONMENT` marca `production` o `test`; `ENSAYO`, `LIMPIAR` y la carga de
datos de prueba lanzan `BLOQUEADO` en producción; PRUEBAS muestra una franja naranja en todas sus páginas; producción rechaza
datos con marcadores de prueba. Cada entorno tiene su propia hoja, carpetas y URL.

## 2. Trazabilidad: requisito del prompt → implementación

| § | Requisito | Implementación (archivo · función) | Estado |
|---|---|---|---|
| 0 | Fuente de verdad en backend; operar sin editar código | Hoja maestra + paneles; CONFIG editable desde la hoja | ✅ |
| 1 | Auditoría y mapa; backup antes de lo destructivo | Este documento; `migrarBase` y `quitarInscripciones` respaldan antes de tocar | ✅ |
| 2 | PROJECT / PERSON / PROJECT_PERSON / roles | `REGISTRO` (proyecto) · `_INTEGRANTES` (persona-rol, `person_role` INTERPRETE/EQUIPO_TRABAJO) · `person_id` estable por documento (`personIdFor`) | ✅ |
| 3 | Captación >100, bolsa 200, estados separados | `computePool` (`02_core_codigos.gs`): rango estable por `created_at`; 1–100 PRINCIPAL, 101–200 SUPLENTE; estados `eligibility_status`, `participation_status`, `evaluation_status`, `ranking_status` | ✅ |
| 4 | Sitio con 10 seleccionados; formulario progresivo; firma; comprobante | `site/` (sin residuos de 7/8), `ui_inscripcion.html` en 7 pasos con firma y revisión; RECIBIDO nunca se presenta como APTO | ✅ |
| 5 | Excel corporativo de 15 hojas | `31_export.gs` `buildCorporateWorkbook` — ver `EXPORT_EXCEL.md` | ✅ |
| 6 | Rúbrica oficial, experiencia de jurado | `04_core_rubrica.gs`, hoja `PARAMETROS_RUBRICA` (versión + huella), `ui_jurado.html` (Cómo calificar, una categoría a la vez, borrador, ENVIAR Y BLOQUEAR) | ✅ |
| 7 | Modelo matemático único | `rating × factor`, suma 20–100, promedio de 3 a precisión completa, redondeo sólo al mostrar (`computeResults`) | ✅ |
| 8 | Desempates y DQ | Presencia + Arena; persiste → `TIE_REVIEW_REQUIRED` por corte 10/20 con acta (método, participantes, resultado, actor, hora); DQ marcada por jurado y validada por dirección | ✅ |
| 9 | Cambio de turno y contingencias | `_CAMBIOS` (la solicitud no mueve el turno); `25_api_bolsa.gs`: retiro con doble confirmación, oferta única por cupo 24 h, herencia de código y horario, confirmación final, `RETIRO_FINAL`, `VACANTE_SIN_REEMPLAZO`, `CONSOLIDAR LISTA OFICIAL` → `ROSTER_FINAL_2026-10-22` + bloqueo | ✅ |
| 10 | Correos | `32_comunicacion.gs`: HTML + texto, aviso de Spam, `_EMAIL_LOG` con plantilla/versión/destinatario/ids/disparador/estado/reintentos/error, idempotencia, bloqueo de enlaces no productivos | ✅ (ver límite R1) |
| 11 | Seguridad y acceso privado | Tokens HMAC por persona con expiración y revocación (`11_auth.gs`), permisos por rol validados en servidor, clave de equipo de 10 caracteres con límite de intentos | ✅ |
| 12 | Póliza Mayorca | Hoja/vista `SEGURO_MAYORCA` + export privado; alerta `PERSONA_EN_VARIOS_PROYECTOS` sin borrar | ✅ |
| 13 | Copy, redes y reset | Instagram principal `elarteeslasolucion_` (se conserva `aesproducciones_`); reset de producción según `RESET_PRODUCCION.md` | ✅ |
| 14 | Clasificación de errores | Sección 4 de este documento | ✅ |
| 15 | QA-01…QA-14 | `test/iteration3.qa.test.js` (emulador) + E2E en vivo — ver `QA_FINAL.md` | ✅ |
| 16 | Documentación | 12 documentos en `docs/` | ✅ |
| 17 | Criterios de aceptación | Ver `QA_FINAL.md`, tabla de cierre | ✅ |

## 3. Decisiones de definición (error tipo 2: el prompt no lo fija; se aplicó la regla canónica)

| # | Decisión | Por qué |
|---|---|---|
| D1 | Al enviar, todo proyecto queda **RECIBIDO**; el veredicto automático se guarda aparte (`eligibility_auto`) y el estado final lo fija el staff con «Aplicar verificación». | El prompt exige no confundir RECIBIDO con APTO y dar resultado de aptitud a todos. |
| D2 | Orden de la bolsa estable por fecha y hora de envío (`created_at`), contando también a quien se retira. | Un retiro no debe mover el puesto de nadie (§9: «no desplazar B-036/B-038»). |
| D3 | El código viaja con el cupo: el suplente hereda código y horario vigente; el titular anterior conserva su código en `previous_code` y el historial queda en `_SLOTS_HISTORIAL`. | Trazabilidad sin borrar registros. |
| D4 | Una sola oferta PENDIENTE por cupo y por persona; rechazo o vencimiento ⇒ el suplente pasa a DECLINO y se ofrece al siguiente. | §9 «nunca ofrecer el mismo cupo a dos personas». |
| D5 | Ventanas en CONFIG: reemplazos desde 16-oct, límite de reemplazo 22-oct 12:00, confirmación final 22-oct 00:00–20:00. Si quedan menos de 1 h al límite, el cupo queda VACANTE en vez de ofrecerse. | Que una oferta no venza en medio del evento. |
| D6 | Una respuesta ausente a la confirmación final **no** quita el turno. | El prompt no autoriza quitar cupos por silencio. |
| D7 | La rúbrica vive en `PARAMETROS_RUBRICA` con versión y huella; si alguien la edita mal, el sistema usa la oficial y lo reporta en salud. | «Incluir la rúbrica en su sistema de variables». |
| D8 | `minimo_jurados` = 3 para promediar. | 3 jurados canónicos, mismo peso. |
| D9 | Top 20 privado: no aparece en el sitio ni en correos a participantes. | Canónico. |
| D10 | Cada proyecto (también solista) tiene código de equipo (`GRP-xxx` o `EQ-xxx`) y enlace de «Equipo y firmas». | Equipo de trabajo y firmas individuales para todos. |
| D11 | `MailApp` no devuelve id de mensaje: `provider_message_id` queda vacío y la trazabilidad es `email_id` + clave de idempotencia. | Límite del proveedor. |
| D12 | Quien inscribe es también una persona del proyecto: su autorización y firma quedan como fila propia en `_INTEGRANTES`. | Consentimiento individual. |
| D13 | Firma obligatoria en el Formulario 1 (`firma_inscripcion` = SI). | §4. |
| D14 | Número de documento sólo dígitos; un pasaporte con letras se gestiona por WhatsApp con la organización. | Evitar duplicados por formato; excepción rara. |
| D15 | Una reinscripción de alguien que quedó INCOMPLETO no se marca duplicada; su orden cuenta desde la completa. | Corregir no debe castigar. |
| D16 | Equipo de trabajo debe ser mayor de edad; un menor queda NO_CUMPLE para revisión. | Póliza del lugar. |
| D17 | Reserva de cuota de correo = 0; la cola difiere lo que no cabe en el día. | Gmail personal ≈ 100 destinatarios/día. |
| D18 | Términos v2 y Política v3 redactados por el asistente (por orden de Juan, 24-sep) con los datos legales que dio la organización, sin inventar datos. | Juan: «si no está, créalos conforme lo normal y avísame». |

## 4. Errores encontrados y corregidos

| Tipo | Hallazgo | Corrección | Prueba |
|---|---|---|---|
| 3 · bug | Tras un retiro, el `priority_rank` de todos los suplentes se corría uno. | `computePool` cuenta a los retirados en el rango. | QA-05 (100 vs 101) |
| 3 · bug | `accionResolverCoincidenciaGrupo` usaba una constante eliminada (`REVISION`). | Usa `EN_REVISION`. | Prueba de regresión dedicada |
| 3 · bug | Una variable de nivel superior dependía de un archivo empaquetado después (orden alfabético). | Cálculo diferido en función. | Suite completa |
| 3 · bug (en vivo) | Inscripción de 12 s con 6,8 s dentro del candado; una ráfaga de envíos podía devolver «sistema ocupado». | Encabezados leídos antes del candado, correo de recepción reclamado con la fila y enviado sin releer hojas, carpeta única de firmas, **reintento automático** en el formulario con la misma clave (sin duplicados), firma huérfana a la papelera. Medido después: 5,4 s bajo candado. | 5 pruebas nuevas + E2E en vivo |
| 3 · bug (en vivo) | En los avisos, toda negrita se pintaba como título en bloque y partía la frase. | Sólo la primera negrita del aviso es título. | Revisión visual E2E |
| 1 · entendimiento | Pruebas de integración asumían 3 candados por inscripción. | Ahora son 2 (fila + resultado del correo). | Actualizada |

## 5. Riesgos y límites conocidos (con su número)

| # | Riesgo | Dato | Mitigación |
|---|---|---|---|
| R1 | Cuota de Gmail personal | ≈100 destinatarios/día | La cola `_EMAIL_LOG` difiere y reintenta cada 15 min; la recepción tiene prioridad. Envíos masivos (aptitud, códigos) pueden tardar más de un día si superan la cuota. Mejora externa posible: cuenta de Google Workspace (≈1.500/día). |
| R2 | Latencia de inscripción | ≈11–12 s por envío medido en vivo; ≈5,4 s dentro del candado | Mensaje «Enviando… no cierres esta página»; espera de hasta 30 s por el candado y reintento automático hasta 3 veces con la misma clave (sin duplicados). Estimación, no medida: absorbe ráfagas de unos 15–20 envíos simultáneos. |
| R3 | Límite de 6 min por ejecución de Apps Script | El ensayo integral de 130 inscripciones necesita varios tramos | `ENSAYO` es reanudable; los procesos masivos de producción (aptitud, códigos, Excel) trabajan por lotes. |
| R4 | Pasaportes con letras | No admitidos en el campo | Gestión manual por WhatsApp (D14). |
| R5 | Enlace del grupo de WhatsApp | No existe todavía | No se muestra nada hasta que la organización lo cargue en CONFIG (`whatsapp_grupo_enlace`); pendiente de Juan. |
| R6 | Textos legales redactados por el asistente | Términos v2 y Política v3 | Revisión por la organización recomendada; los datos legales son los informados por ella. |
| R7 | Edición manual de la hoja | Encabezados o `PARAMETROS_RUBRICA` alterados a mano | `VERIFICAR` detecta esquema incompleto y rúbrica inválida; las vistas se reconstruyen solas. |

## 6. Seguridad

- Roles y permisos (`PERMISOS`, `00_config.gs`): admin (todo) · dirección (resultados, deliberación, DQ, cierre, seguro, registro enmascarado) ·
  logística (registro, códigos, agenda, cambios, reemplazos, consolidación, comunicación, seguro) · check-in (mínimo operativo) · jurado (sólo evaluar sus tarjetas).
- Enlaces personales firmados con HMAC-SHA256, expiración y revocación desde la hoja `_USUARIOS`; el servidor valida cada acción.
- Enlaces de equipo sin datos personales: código de equipo + clave de 10 caracteres, vencimiento (`enlaces_equipo_vencen`) y límite de 10 claves erradas por 15 min.
- Nada sensible en GitHub Pages ni en el repositorio público; los secretos viven en propiedades del script.
- Entradas saneadas en servidor; salidas HTML escapadas; campo trampa y tiempo mínimo de llenado contra bots.

## 7. Respaldos

Antes de migrar y antes de quitar filas se genera un respaldo XLSX + JSON en la carpeta de respaldos del entorno; además
el disparador `respaldoAutomatico` respalda cada día a las 23:00. Procedimiento de producción: `RESET_PRODUCCION.md`.
