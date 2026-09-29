# EL BÚNKER — Reset y publicación de producción (iteración 3)

Objetivo (§13 del prompt): dejar producción limpia —sin registros de prueba, con las secuencias en cero— y con la versión 3
publicada, sin perder nada real y con respaldo verificable antes de cada paso destructivo.

## 1. Qué había en producción antes del reset (lectura, 29-sep-2026)

| Hoja | Filas | Qué eran |
|---|---|---|
| REGISTRO | 5 | Pruebas hechas por la organización antes del lanzamiento: `S-5F23127D` (25-sep), `S-67ACAFA8`, `S-2B643606`, `S-494D927B`, `S-433834E6` (27-sep). Otras dos (`S-07BE9C53`, `S-E780AA04`) ya se habían quitado el 25-sep. |
| _INTEGRANTES | 1 | Integrante del grupo de prueba `GRP-001` (de `S-2B643606`). |
| _CAMBIOS · INCIDENTES · JURADO_1..3 | 0 | — |
| _IDEMPOTENCIA | 7 | Respuestas guardadas de esas pruebas. |

Ninguna fila real: la convocatoria todavía no se había compartido.

## 2. Procedimiento (en este orden)

1. **Copia completa de la hoja maestra** a la carpeta de respaldos (archivo de Google Sheets, restaurable abriéndolo).
2. **Código v3** en el proyecto de producción (el enlace público sigue sirviendo la versión anterior hasta el paso 5).
3. **`MIGRAR`**: respaldo XLSX + JSON previo, agrega hojas/columnas/claves de CONFIG, carga la rúbrica oficial en
   `PARAMETROS_RUBRICA`, instala disparadores; no borra ni reescribe filas y reporta «datos intactos».
   Va antes que el paso 4 porque la limpieza reconstruye las vistas con el esquema nuevo.
4. **`QUITAR_PRUEBAS_PRELANZAMIENTO`**: quita sólo los IDs de la lista fija del código (`PRELAUNCH_TEST_SUBMISSIONS`) con sus
   integrantes, cambios, ofertas, correos, tarjetas, respuestas guardadas y firmas (a la papelera de Drive, recuperables 30 días);
   respaldo `ANTES-DE-QUITAR` previo; queda en la bitácora `_LOG`. Cualquier fila que no esté en la lista se trata como real y no se toca.
   La bitácora `_LOG` conserva el rastro de las pruebas (auditoría): no se borra.
5. **Versión nueva de la implementación** (misma URL pública).
6. **`VERIFICAR`**: salud del sistema (esquema completo, disparadores, rúbrica válida, legales, «producción limpia»).
7. **Prueba de humo sin crear datos**: formulario público sin franja de pruebas, consulta de Mi inscripción que no existe,
   panel de administración y salud con el enlace personal.
8. **Sitio público**: se publica la rama del sitio (10 seleccionados, términos v2, política v3) y se revisan las páginas.

Secuencias: los códigos de equipo (`GRP-`/`EQ-`) y los códigos B-XXX se calculan desde las filas existentes, así que con la
base vacía vuelven a empezar en 001 sin tocar nada más. Los números de comprobante son aleatorios.

Protecciones permanentes: `ENSAYO`, `LIMPIAR` y la carga de datos de prueba lanzan `BLOQUEADO` en producción; producción
rechaza envíos con marcadores de prueba; las funciones de reset no tienen ruta web.

## 3. Resultado (29-sep-2026, 14:20–14:30, código `abd7726` = el mismo probado en PRUEBAS)

| Paso | Resultado |
|---|---|
| 1. Copia completa | `EL BUNKER - BASE MAESTRA - COPIA ANTES DE ITER3 20260929-1420` en la carpeta de respaldos |
| 2–3. Código v3 + `MIGRAR` | **Datos intactos: SI** (REGISTRO 5 = 5). Respaldo previo `RESPALDO-PRE-MIGRACION-20260929-142038` (.xlsx + .json). Hojas nuevas: PARAMETROS_RUBRICA, BOLSA, SEGURO_MAYORCA, _OFERTAS, _SLOTS_HISTORIAL, _EMAIL_LOG, _DESCALIFICACIONES. CONFIG: sede → «Centro Comercial Mayorca · Etapa 1», seleccionados 7 → 10, jurados mínimos 2 → 3, Instagram principal → `elarteeslasolucion_` (AES queda como secundario), términos/política nuevos. Conflicto conservado: `web_app_url` (se mantiene la URL pública existente). Rúbrica R1-2026-09-29 válida |
| 4. `QUITAR_PRUEBAS_PRELANZAMIENTO` | Quitadas exactamente `S-5F23127D`, `S-67ACAFA8`, `S-2B643606`, `S-494D927B`, `S-433834E6` + 1 integrante + 7 respuestas guardadas. Respaldo previo `RESPALDO-ANTES-DE-QUITAR-20260929-142209` (.xlsx + .json). Después: REGISTRO 0 · INTEGRANTES 0 · IDEMPOTENCIA 0 · CORREOS 0 |
| 5. Versión nueva | **Versión 8** de la misma implementación (misma URL pública). En el editor quedó sólo una función de lectura de salud, no la de limpieza |
| 6. Salud | «Sistema consistente»: versión 3.0.0, entorno y hoja `production`, esquema completo, 5 disparadores (respaldo, vencer ofertas, cola de correos, videos, vistas), rúbrica válida 20–100, legal verificado (términos v2-2026-09-29, política v3-2026-09-29), **producción limpia** |
| 7. Humo sin crear datos | Formulario sin franja de pruebas, Paso 1 de 7, Etapa 1, NIT, textos legales vigentes, sin residuos · Mi inscripción inexistente → «No encontramos…» · admin 0 inscritos · dirección 0 · jurado 1 con la rúbrica R1 y «Sin participantes todavía» · check-in abre · 0 errores de JavaScript |

Secuencias: con REGISTRO vacío, el primer código será `B-001` y el primer equipo `EQ-001`/`GRP-001`.
Para deshacer (si hiciera falta): abrir la copia del paso 1, que es la base completa anterior.
