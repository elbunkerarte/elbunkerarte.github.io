# EL BÚNKER — Changelog final (iteración 3 · release QA · 29-sep-2026)

Punto de partida: producción versión 7 (commit `79fd9c7`, iteración 2) con el sitio en `https://elbunkerarte.github.io/`.
Llegada: versión 3.0.x (rama `feat/iteracion-2`). Qué se probó y cómo: `QA_FINAL.md`. Por qué se decidió cada cosa:
`FINAL_IMPLEMENTATION_AUDIT.md`.

## 1. Qué existía (iteración 2)

- Inscripción en una sola página con validación en servidor, duplicados, agrupaciones con enlace de integrantes (firma por integrante).
- Emisión de códigos B-001…B-100 en orden de inscripción, agenda por bloques con margen de las 8:00 p. m., cambios de horario
  aprobados por logística, pistas por código, verificación de videos.
- Check-in, jurado con rúbrica anterior (Top 7), panel de dirección, constancia imprimible, respaldos y restauración,
  entornos PRODUCCIÓN / PRUEBAS separados con ensayo y limpieza bloqueados en producción.
- Correo automático de recepción (envío directo), mensajes para WhatsApp uno a uno.

## 2. Qué se cambió

| Área | Antes | Ahora |
|---|---|---|
| Selección | Top 7 público | **10 seleccionados** públicos; **Top 20 privado** (nunca en el sitio ni en correos a participantes) |
| Lugar | Centro Comercial Mayorca | **Centro Comercial Mayorca · Etapa 1** |
| Rúbrica | Rúbrica propia de la iteración 2 | **Rúbrica oficial del PDF**: 7 categorías, 1–5 × factor (4,4,3,3,2,2,2) = 20–100 por jurado; parámetros en la hoja `PARAMETROS_RUBRICA` con versión y huella |
| Jurado | Guardar notas | «Cómo calificar» privado, una categoría a la vez, borrador, **ENVIAR Y BLOQUEAR**, reapertura sólo por dirección con motivo, reporte de descalificación |
| Resultados | Promedio y orden | Promedio a precisión completa, desempate Presencia + Arena, **TIE_REVIEW_REQUIRED** en los cortes 10 y 20 con acta, DQ validada por dirección, cierre de resultados con confirmación |
| Estado al enviar | Veredicto automático visible | **RECIBIDO** para todos + comprobante; aptitud la decide el staff («Aplicar verificación») y se comunica por correo |
| Captación | Hasta los 100 | Abierta más allá de 100; **bolsa de 200 aptos** (1–100 principales, 101–200 suplentes) con orden estable |
| Contingencias | Cambios de horario | + retiro desde 16-oct con doble confirmación, **oferta al siguiente suplente** (24 h, una a la vez), herencia de código y horario, confirmación final del 22-oct, vacante sin reemplazo, **CONSOLIDAR LISTA OFICIAL** → `ROSTER_FINAL_2026-10-22` y bloqueo |
| Personas | Integrantes de agrupación | **Equipo y firmas para todo proyecto** (`GRP-` / `EQ-`): intérpretes y equipo de trabajo; el equipo no ocupa cupo ni entra al ranking; `person_id` común entre roles |
| Formulario | Una página | **7 pasos** con validación por paso, firma obligatoria y revisión final; «¿Qué pasa después de inscribirme?»; reintento automático si el servidor está ocupado |
| Correos | Envío directo | **Cola `_EMAIL_LOG`** idempotente: HTML + texto, aviso de Spam/Promociones, 3 reintentos, registro por plantilla/versión/destinatario/disparador, recepción inmediata por vía rápida, bloqueo de enlaces no productivos; 17 plantillas |
| Excel | Export simple | **Libro corporativo de 15 hojas** + export privado **SEGURO_MAYORCA** (ver `EXPORT_EXCEL.md`) |
| Accesos de equipo | Clave de 6 caracteres | Clave de **10 caracteres**, vencimiento y límite de intentos |
| Textos legales | Términos v1 · Política v2 | **Términos v2-2026-09-29 · Política v3-2026-09-29** (redactados por el asistente con los datos legales informados por la organización) |
| Rendimiento | — | Inscripción: tiempo bajo candado 6,8 s → 5,4 s medido en vivo |

Módulos nuevos: `25_api_bolsa.gs` (bolsa, reemplazos, lista oficial). Módulos reescritos o ampliados: `00_config`, `01_core_validacion`,
`02_core_codigos`, `04_core_rubrica`, `10_db`, `11_auth`, `20_web`, `21_api_publico`, `22_api_admin`, `23_api_checkin`,
`24_api_jurado`, `30_vistas`, `31_export`, `32_comunicacion`, `33_media`, `40_setup`, `41_seed` y las pantallas de inscripción,
Mi inscripción, equipo y firmas, jurado, administración y dirección.

## 3. Qué se preservó sin cambios

- Motor de agenda (`03_core_agenda.gs`): bloques, 3 minutos por audición, margen de las 8:00 p. m.
- Estados del día del evento y check-in (`05_core_estados.gs`), subida y validación de pistas (`06_core_media.gs`), bitácora (`12_log.gs`).
- Formulario de cambio de horario, constancia imprimible, página de acceso restringido, página de consulta rápida (`ui_cambio`,
  `ui_constancia`, `ui_403`, `ui_gracias`) y utilidades de cliente (`ui_scripts`).
- Datos existentes: la migración sólo agrega hojas, columnas y claves de CONFIG; nunca borra ni reescribe filas (verificado:
  «datos intactos» antes = después). Las claves de CONFIG que la organización ya había cambiado se conservan y se reportan como conflicto.
- Datos legales (responsable, NIT, correo y teléfono de datos personales) tal como los informó la organización.

## 4. Qué se verificó

Resumen (detalle en `QA_FINAL.md`): 412 pruebas automáticas verdes sobre el emulador de Apps Script (incluye QA-01…QA-13 y la
vía rápida de inscripción); en el proyecto real de PRUEBAS: migración v3, ensayo integral de 17 fases, formulario de 7 pasos en
móvil y escritorio (solista, dúo, agrupación), equipo y firmas, Mi inscripción, correo real recibido en bandeja de entrada y
paneles privados. Producción: ver `RESET_PRODUCCION.md` (respaldo, limpieza de pruebas, migración, verificación y humo).
