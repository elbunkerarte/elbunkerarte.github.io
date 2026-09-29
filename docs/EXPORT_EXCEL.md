# Excel corporativo y exportación para la póliza — EL BÚNKER

Para la coordinación, dirección y logística. **No hace falta tocar código.**

> **Regla de oro:** el Excel es una **foto de la base maestra** en el momento en que se
> genera. **No es una segunda base de datos.** Lo que se escriba, borre u ordene en el
> archivo **no vuelve al sistema**. Si un dato está mal, se corrige en el panel o en la
> base maestra y se genera un Excel nuevo.

---

## 1. Qué archivos existen

| Archivo | Qué trae | Para qué sirve |
|---|---|---|
| **Excel corporativo** (`EL-BUNKER-EXCEL-AAAAMMDD-HHMM.xlsx`) | 15 hojas con todo el estado de la convocatoria | Revisar, filtrar, reportar y archivar |
| **Excel de la póliza** (`EL-BUNKER-SEGURO-MAYORCA-AAAAMMDD-HHMM.xlsx`) | 2 hojas: `README_OPERACION` y `SEGURO_MAYORCA` | Enviar al C.C. Mayorca / aseguradora la lista de personas |

En el entorno de pruebas el nombre empieza por `PRUEBAS-`, para que nunca se confunda con
producción.

## 2. Dónde queda el archivo

En **Google Drive**, en la **carpeta de respaldos** del sistema:
`EL BUNKER - Respaldos` (en pruebas: `[PRUEBAS] EL BUNKER - Respaldos`). Es la misma
carpeta donde caen los respaldos diarios. El panel devuelve el enlace directo al archivo.

Para armar el archivo, el sistema crea una hoja de cálculo **temporal**, la descarga como
Excel y la **manda a la papelera** enseguida (también si algo falla a mitad de camino),
porque contiene datos personales. Si alguna vez ves en tu Drive un archivo que empieza por
`TEMP-EXPORT`, es un residuo de un fallo: bórralo.

## 3. Quién puede generarlo

| Rol | Excel corporativo | Excel de la póliza |
|---|---|---|
| `admin` | Sí, con datos completos | Sí |
| `coordinacion` (logística) | Sí, con datos completos | Sí |
| `direccion` | Sí, con **documento, correo y teléfono enmascarados** (`******8960`, `m***@gmail.com`, `*** *** 5678`) | Sí, con documentos completos (la póliza los exige) |
| `checkin`, `jurado` | No | No |

Cada exportación queda registrada en la bitácora (`_LOG`) con quién la hizo:
`EXPORTAR_EXCEL` o `EXPORTAR_SEGURO`.

Antes de armar el Excel corporativo, el sistema **actualiza las vistas** (agenda,
resultados, dashboard) para que la foto salga al día. Si esa actualización falla, el
Excel **no se genera** (mejor un error visible que un archivo con resultados viejos).

## 4. Las 15 hojas del Excel corporativo

| # | Hoja | Qué contiene |
|---|---|---|
| 1 | `README_OPERACION` | Fecha y hora de generación, versión del sistema, entorno (pruebas o producción), versión de la rúbrica, qué es cada hoja, colores, estados y el **resumen de la póliza** (proyectos, personas, intérpretes, equipo, sin firma, personas repetidas). |
| 2 | `MASTER_PROYECTOS` | **1 fila por proyecto artístico** (solista, dúo o agrupación): ID del proyecto, código B-XXX, fecha de inscripción, nombre artístico, modalidad, responsable, documento, correo, WhatsApp, integrantes declarados, intérpretes y equipo registrados, género, formato, aptitud, bolsa y prioridad, participación, bloque y horarios, confirmación final, asistencia, retiro, código anterior, evaluación, ranking, descalificación, código de equipo, versión de términos, autorizaciones y firma. Tiene tantas filas como la hoja `REGISTRO` de la base. |
| 3 | `PERSONAS` | **1 fila por persona física** (identificada por su documento). Si alguien está en dos proyectos, o en un proyecto como intérprete y en otro como equipo, es **una sola fila** con todas sus relaciones en la columna *RELACIONES*, el número de proyectos y la alerta `PERSONA_EN_VARIOS_PROYECTOS`. |
| 4 | `INTERPRETES` | Relación proyecto-persona de quienes **suben a tarima**: código, nombre artístico, ID del proyecto, modalidad, persona, documento, rol, en tarima, responsable del proyecto, autorización, firma y fecha de firma, autorizaciones y alertas. |
| 5 | `EQUIPO_TRABAJO` | Lo mismo para el **equipo de trabajo** (manager, productor(a), técnico(a), asistente, fotógrafo(a)/video, otro). El equipo **no ocupa cupo ni entra al ranking**. |
| 6 | `AGENDA` | Los cupos **B-001 a B-100**: estado del cupo (asignado, ofrecido, liberado, vacante, sin emitir), bloque, ventana, hora de llegada y de audición, titular (nombre artístico e ID), participación, confirmación final, asistencia, hora de check-in y, si el cupo está ofrecido, a qué suplente. |
| 7 | `CAMBIOS_TURNO` | Cada solicitud de cambio de horario: código, horario original, cuándo se pidió, si puede en su horario, motivo, decisión, bloque y hora nuevos, quién decidió y cuándo, y estado de la notificación. |
| 8 | `JURADOS` | Los jurados habilitados: alias, hoja asignada (`JURADO_1`, `JURADO_2`, `JURADO_3`), si está activo, cuándo se creó y cuántas tarjetas tiene en borrador y enviadas. **Nunca incluye los enlaces de acceso.** |
| 9 | `CALIFICACIONES` | **1 fila por jurado y proyecto**: jurado, código, nombre artístico, versión de la rúbrica, las **7 notas** (1 a 5, con su factor), total (20 a 100), puntos de desempate (presencia + factor arena), estado de la tarjeta (borrador o enviada), descalificación reportada y su causal, observaciones y fecha de envío. |
| 10 | `RESULTADOS` | **Copia** de la hoja `RESULTADOS` de la base: posición, puntajes por jurado, puntaje final, desempate, ranking, Top 20, Top 10 y si requiere comité. El Excel no recalcula nada. |
| 11 | `DASHBOARD` | **Copia** del `DASHBOARD` de la base (métricas operativas y de evaluación). |
| 12 | `EMAIL_LOG` | **Copia** del registro de correos: plantilla y versión, disparador, destinatario, proyecto, código, estado, reintentos, error y asunto. |
| 13 | `SEGURO_MAYORCA` | Las personas para la **póliza** (ver sección 6). |
| 14 | `PARAMETROS_RUBRICA` | **Copia** de la rúbrica vigente: categorías, factores, puntos máximos, los 5 niveles de cada categoría, criterio de desempate y versión. |
| 15 | `LISTAS` | Los catálogos: estados de aptitud, participación, evaluación, tarjeta de jurado, ranking, descalificación, bolsa, oferta de cupo, estado del cupo, modalidad, tipo de persona, autorización, roles de equipo, tipos de documento, causales de descalificación, escala de la rúbrica y alertas, cada uno con su significado. |

### Colores

| Color | Significa | Ejemplos |
|---|---|---|
| Verde | Cumplido | `APTO`, `ENVIADA`, `AUTORIZADO`, `CONFIRMADO`, `TOP10_SELECCIONADO`, `ASIGNADO` |
| Ámbar | Pendiente o por revisar | `EN_REVISION`, `PENDIENTE`, `BORRADOR`, `SUPLENTE`, `OFRECIDO`, cualquier alerta |
| Rojo | Negativo o fuera | `NO_APTO`, `DUPLICADO`, `DESCALIFICADO`, `RETIRADO`, `NO_SHOW`, `RECHAZADO`, `VENCIDA` |

El color siempre acompaña al texto del estado: quien no distingue colores lee lo mismo.
Las filas alternan blanco y gris claro para seguir la línea con la vista.

### Formato de las hojas

- Fila de títulos en negro con letra blanca, **congelada** (no se mueve al bajar).
- **Filtro** activado en todas las hojas.
- Sin celdas combinadas en los datos.
- Documentos, teléfonos, códigos, fechas y horas van como **texto**: se conservan los ceros
  a la izquierda (`00123456`) y las horas (`15:00`) tal cual.
- Cada hoja tiene una **protección de advertencia**: si alguien intenta editar, la hoja de
  cálculo pregunta antes. Recuerda que editar no cambia el sistema.

## 5. Cómo filtrar (ejemplos)

Todas las hojas tienen el botón de filtro en cada título de la fila 1.

| Quiero ver… | Hoja | Filtra la columna |
|---|---|---|
| Un proyecto concreto | `MASTER_PROYECTOS`, `INTERPRETES`, `EQUIPO_TRABAJO`, `SEGURO_MAYORCA` | *CÓDIGO* (B-XXX) o *ID PROYECTO* |
| Un artista o agrupación por nombre | Cualquiera | *NOMBRE ARTÍSTICO* → "Filtrar por condición" → "El texto contiene" |
| Sólo dúos o agrupaciones | `MASTER_PROYECTOS`, `INTERPRETES`, `SEGURO_MAYORCA` | *MODALIDAD* |
| Intérpretes o equipo de trabajo | `SEGURO_MAYORCA`, `PERSONAS` | *TIPO DE PERSONA* (o usa las hojas `INTERPRETES` / `EQUIPO_TRABAJO`) |
| Quién no ha firmado | `INTERPRETES`, `EQUIPO_TRABAJO`, `MASTER_PROYECTOS` | *FIRMA* = `NO` (en la póliza: *ALERTA* contiene `SIN_FIRMA`) |
| Personas repetidas entre proyectos | `PERSONAS`, `SEGURO_MAYORCA` | *ALERTA* contiene `PERSONA_EN_VARIOS_PROYECTOS` |
| Aptos, suplentes, sin turno | `MASTER_PROYECTOS` | *APTITUD*, *BOLSA*, *PARTICIPACIÓN* |
| Tarjetas que faltan por enviar | `CALIFICACIONES` | *ESTADO* = `BORRADOR` |

## 6. La exportación para la póliza (`SEGURO_MAYORCA`)

Es la lista **privada** de personas que estarán en el C.C. Mayorca por cada proyecto.
**Nunca se publica en la página.**

**Quién entra:** cada persona vinculada a un proyecto que **tiene código B-XXX vigente** y
**no se retiró**. Una fila por persona y por proyecto. Los suplentes sin cupo, los
proyectos sin código y los retirados **no** entran.

**Columnas:** código, nombre artístico exacto, modalidad, tipo de persona
(`INTERPRETE` / `EQUIPO_TRABAJO`), nombre completo, tipo y número de documento, rol
(el rol artístico del intérprete o el rol del equipo: Manager, Productor(a), Técnico(a),
Asistente, Fotógrafo(a) / video, Otro), en tarima (SI/NO), estado de la autorización,
fecha y hora de la firma, ID de persona y alerta.

**Alertas (el sistema avisa, nunca borra a nadie):**

| Alerta | Qué significa | Qué hacer |
|---|---|---|
| `SIN_FIRMA` | La persona se registró pero no tiene firma | Pedirle que firme desde el enlace de equipo y firmas del proyecto |
| `SIN_FIRMA_INDIVIDUAL` | Inscripción antigua sin fila de integrante: sólo aceptó en el Formulario 1 | Pedir la firma individual por el enlace de equipo y firmas |
| `PERSONA_EN_VARIOS_PROYECTOS: B-00X,B-00Y` | El mismo documento aparece en varios proyectos | Revisar con los responsables. Si es correcto (por ejemplo, un técnico que trabaja con dos proyectos), se deja; la organización acuerda con la aseguradora cómo contarla |

**Conciliación:** la hoja `README_OPERACION` trae el resumen (proyectos con código,
personas distintas, intérpretes, equipo, filas sin firma y personas en varios proyectos).
Antes de enviar a la aseguradora, verifica que:

1. *Proyectos con código vigente* coincide con los cupos asignados de la hoja `AGENDA`
   (estado `ASIGNADO`).
2. *Filas sin firma* es 0, o cada caso está gestionado.
3. Cada persona en varios proyectos fue revisada.

Para la aseguradora usa el **Excel de la póliza** (sólo dos hojas): no mandes el Excel
corporativo, que trae datos que la aseguradora no necesita.

## 7. Respaldos (relación con el Excel)

El Excel corporativo **no reemplaza** los respaldos. Los respaldos (`RESPALDO-*.xlsx` y
`RESPALDO-*.json`, en la misma carpeta) son los que permiten **restaurar** la base. Desde
esta versión, el respaldo JSON también guarda y restaura: la rúbrica (`PARAMETROS_RUBRICA`),
las ofertas de cupo (`_OFERTAS`), el historial de cupos (`_SLOTS_HISTORIAL`), los reportes
de descalificación (`_DESCALIFICACIONES`) y el registro de correos (`_EMAIL_LOG`). Una
restauración nunca deja la rúbrica vacía.

Ver `docs/MANUAL-RECUPERACION.md` para restaurar.
