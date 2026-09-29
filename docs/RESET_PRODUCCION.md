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

## 3. Resultado

_Se completa al ejecutar (fecha, respaldos, filas antes/después, versión publicada, salud y humo)._
