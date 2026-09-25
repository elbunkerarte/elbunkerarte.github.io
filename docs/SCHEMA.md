# Esquema de datos

La base es una hoja de cálculo de Google con **18 pestañas** (versión 2.0.0 del
sistema). **REGISTRO es la única fuente de verdad** de los proyectos inscritos;
seis hojas son vistas que se regeneran desde ella.

Fuente de esta lista: `sheetDefinitions()` y los arreglos `COLUMNAS_*` de
`apps-script/00_config.gs`. Si el código cambia, este documento se regenera desde
ahí.

| Hoja | Tipo | Quién escribe |
|---|---|---|
| `REGISTRO` | **fuente de verdad** | Formulario 1, "Mi inscripción" (pista), el panel y el check-in |
| `AGRUPACIONES` | vista (se regenera) | el sistema, desde REGISTRO y `_INTEGRANTES` |
| `AGENDA` | vista (se regenera) | el sistema |
| `CHECK-IN` | vista (se regenera) | el sistema |
| `PISTAS` | vista (se regenera) | el sistema |
| `JURADO_1` / `JURADO_2` / `JURADO_3` | fuente | cada jurado, desde su panel |
| `RESULTADOS` | vista (se regenera) | el sistema |
| `DASHBOARD` | vista (se regenera) | el sistema |
| `INCIDENTES` | fuente | operadores y el sistema (cambios forzados) |
| `CONFIG` | fuente | **la coordinación, a mano** |
| `_INTEGRANTES` | fuente | Formulario 1 (líder) y formulario de integrantes |
| `_DELIBERACIONES` | fuente | dirección, "Registrar decisión del comité" |
| `_CAMBIOS` | fuente | Formulario 2 (cambio de horario) y el panel |
| `_USUARIOS` | fuente | el sistema (instalación, migración, "Crear acceso") |
| `_LOG` | bitácora | el sistema |
| `_IDEMPOTENCIA` | control | el sistema |

> Editar a mano una hoja marcada *vista* no sirve: se sobrescribe en la siguiente
> actualización (panel → *Refrescar vistas*, o el refresco automático cada 6 h).
> Corrige en REGISTRO (o en `_INTEGRANTES` si el dato es de un integrante).

> Las hojas que empiezan por `_` son internas: no se editan a mano salvo que el
> manual lo indique.

## Columnas en texto plano (y por qué)

Google Sheets "interpreta" lo que se escribe: convierte `15:00` en una hora,
`2001-04-12` en una fecha y `0012345` en el número 12345 (se pierden los ceros
de la cédula). Para que el dato quede **exactamente como se escribió**, estas
columnas tienen formato de **texto plano** (`PLAIN_TEXT_COLUMNS` en
`apps-script/10_db.gs`). La instalación y la migración aplican el formato, y
convierten lo que ya estaba guardado sin perder fechas.

| Hoja | Columnas en texto plano |
|---|---|
| `REGISTRO` | `id_number`, `normalized_id_number`, `whatsapp`, `normalized_phone`, `birth_date`, `group_code`, `code`, `original_time`, `arrival_time`, `final_time`, `artistic_name`, `song_name` |
| `_INTEGRANTES` | `id_number`, `normalized_id_number`, `birth_date`, `group_code` |
| `_CAMBIOS` | `code`, `contact`, `original_time`, `nueva_hora` |
| `AGENDA` | `arrival_time`, `audition_time`, `limite_tolerancia` |
| `CHECK-IN` | `arrival_time`, `final_time`, `check_in_time` |
| `PISTAS` | `final_time` |
| `CONFIG` | `valor` |

En las tablas de abajo, las columnas en texto plano van marcadas con **(T)**.

> Si al corregir a mano una de estas celdas Sheets la convierte en fecha, hora o
> número, esa celda perdió el formato: selecciónala y pon *Formato → Número →
> Texto sin formato*, y vuelve a escribir el valor. También sirve escribirlo con
> un apóstrofo delante (`'15:00`), que Sheets no muestra.

---

## REGISTRO

Una fila por **proyecto** (solista, dúo o agrupación) — **incluidos los
duplicados y los no aptos**, que se conservan marcados para mantener
trazabilidad. Una agrupación ocupa una sola fila y un solo cupo; sus integrantes
viven en `_INTEGRANTES`.

Las columnas se leen por su nombre: las de la iteración 2 se añadieron **al
final** para no mover ningún dato existente.

### Identificación y origen
`submission_id` (comprobante S-XXXXXXXX) · `code` **(T)** (B-001…B-100) ·
`created_at` · `source`

### Datos de la persona (titular o líder)
`full_name` · `id_number` **(T)** · `birth_date` **(T)** · `age` ·
`neighborhood_sector` · `residence` · `email` · `whatsapp` **(T)**

### Propuesta artística
`artistic_name` **(T)** · `discipline` · `genre_or_proposal` ·
`artist_description` · `audition_description` · `video_url` · `technical_needs`

### Normalizados (para comparar, nunca para mostrar)
`normalized_id_number` **(T)** · `normalized_email` · `normalized_phone` **(T)**

> El documento se normaliza quitando puntos y ceros a la izquierda; el teléfono
> se queda con los últimos 10 dígitos (así `+57 300…` y `300…` coinciden).

### Validación
`eligibility_status` (`APTO` · `INCOMPLETO` · `NO_CUMPLE` · `REVISION` ·
`DUPLICADO`) · `duplicate_flag` · `duplicate_reason` · `registro_principal` ·
`validation_notes`

### Consentimientos (iteración 1)
`consent_terms` · `consent_data` · `consent_whatsapp` · `consent_image` ·
`consent_version` · `availability_statement`

### Agenda
`original_block` · `original_time` **(T)** · `arrival_time` **(T)** ·
`final_block` · `final_time` **(T)** · `change_requested` · `change_status` ·
`changed_at` · `changed_by` · `issued_at` · `issued_by`

### Jornada
`check_in_time` · `attendance_status` · `audition_status` ·
`contingencia_desde` · `operador_check_in` · `notes`

### Iteración 2 — modalidad y agrupación
| Columna | Qué guarda |
|---|---|
| `participation_mode` | `SOLISTA`, `DUO` o `AGRUPACION` |
| `group_code` **(T)** | Código de agrupación GRP-XXX (vacío en solistas) |
| `group_display_name` | Nombre de la agrupación tal como se escribió |
| `group_match_key` | Nombre normalizado para detectar agrupaciones repetidas |
| `group_match_status` | `POSIBLE_REPETIDA` (falta decidir) · `CONFIRMADA_MISMA` · `CONFIRMADA_DISTINTA` |
| `group_match_ref` | Comprobante de la otra inscripción con nombre equivalente |
| `members_declared` | Integrantes en escena declarados por el líder |
| `adult_confirmation` | Confirmación de mayoría de edad |

### Iteración 2 — presentación, equipo y pista
| Columna | Qué guarda |
|---|---|
| `genre_primary` / `genre_secondary` | Género principal y secundario |
| `presentation_format` / `presentation_other` | Formato de presentación (voz sobre pista, voz + instrumento, instrumental, DJ, freestyle, otra) y el detalle de "otra" |
| `needs` / `needs_other` | Necesidades técnicas marcadas y el detalle |
| `own_equipment` / `own_equipment_detail` | Si trae equipo propio y cuál |
| `song_name` **(T)** | Nombre de la canción |
| `track_uses` | Si usará pista |
| `track_method` / `track_method_other` | Cómo la enviará (`ARCHIVO`, `USB`, `WHATSAPP`, `OTRO`) |
| `track_status` | `NO APLICA` · `PISTA PENDIENTE` · `PISTA RECIBIDA` · `PISTA VALIDADA` · `PISTA CON PROBLEMA` |
| `track_file_id` / `track_file_name` | Archivo en Drive (`B-XXX_ARTISTA_CANCION.ext`) |
| `track_updated_at` / `track_notes` | Última subida y notas del técnico |

### Iteración 2 — video
| Columna | Qué guarda |
|---|---|
| `video_check_status` | `SIN VIDEO` · `PENDIENTE` · `ACCESIBLE` · `NO ACCESIBLE` · `NO VERIFICABLE` |
| `video_checked_at` / `video_check_detail` | Cuándo se comprobó y el motivo |

### Iteración 2 — evidencia del consentimiento
| Columna | Qué guarda |
|---|---|
| `consent_at` | Momento de la aceptación |
| `terms_version` / `policy_version` | Versión exacta de términos y política aceptadas |
| `data_controller` | Responsable del tratamiento sellado en ese momento (razón social · NIT) |
| `capture_source` | Por dónde entró (p. ej. `web:formulario-1:v2`) |

> Estas columnas son las que permiten demostrar después **qué texto estaba
> publicado** cuando la persona aceptó.

### Iteración 2 — jornada y decisiones manuales
| Columna | Qué guarda |
|---|---|
| `precola_at` / `stage_at` / `done_at` | Hora de PRECOLA, de subir a escena y de salida (REALIZADA) |
| `eligibility_override` / `override_by` / `override_at` | Estado puesto a mano desde el panel, quién y cuándo. La revalidación lo respeta |

## Estados de asistencia

Camino normal: `CONFIRMADO → CHECK-IN → PRECOLA → EN AUDICIÓN → REALIZADA`.

| Desde | Puede pasar a |
|---|---|
| `CONFIRMADO` | CHECK-IN · NO SHOW · CONTINGENCIA · INCIDENTE |
| `CHECK-IN` | PRECOLA · EN AUDICIÓN · REALIZADA · CONTINGENCIA · NO SHOW · INCIDENTE |
| `PRECOLA` | EN AUDICIÓN · REALIZADA · CONTINGENCIA · NO SHOW · INCIDENTE |
| `EN AUDICIÓN` | REALIZADA · INCIDENTE |
| `CONTINGENCIA` | CHECK-IN · PRECOLA · EN AUDICIÓN · REALIZADA · NO AUDICIONADO · INCIDENTE |
| `NO SHOW` | CONTINGENCIA · NO AUDICIONADO · INCIDENTE |
| `REALIZADA` | INCIDENTE |
| `NO AUDICIONADO` | INCIDENTE |
| `INCIDENTE` | cualquiera menos CONFIRMADO |

Las transiciones que no están en la tabla se **rechazan**. En la pantalla de
check-in, REALIZADA y NO AUDICIONADO son finales (no hay botón para salir de
ellos). Un cambio forzado deja una fila automática en `INCIDENTES`. Esto es lo
que impide, por ejemplo, calificar a alguien cuya audición no está marcada como
REALIZADA.

---

## _INTEGRANTES

Una fila por persona de un dúo o agrupación (el líder incluido, marcado con
`is_leader`). El proyecto vive en REGISTRO y se une por `group_code`.

`member_id` · `group_code` **(T)** · `project_submission_id` · `created_at` ·
`updated_at` · `source` · `is_leader` · `full_name` · `id_number` **(T)** ·
`normalized_id_number` **(T)** · `birth_date` **(T)** · `age` ·
`adult_confirmation` · `artistic_role` · `consent_terms` · `consent_data` ·
`consent_image` · `consent_at` · `terms_version` · `policy_version` ·
`data_controller` · `capture_source` · `signature_file_id` · `signature_sha256`
· `signature_at` · `member_status` (`AUTORIZADO` · `INCOMPLETO` · `NO CUMPLE`)
· `member_alert` · `notes`

> La firma dibujada se guarda como imagen en Drive (carpeta *EL BUNKER - Firmas*,
> una subcarpeta por agrupación) con su huella SHA-256. Es evidencia de
> aceptación, no una firma electrónica certificada.

## AGRUPACIONES (vista)

Una fila maestra por agrupación (`row_type = PROYECTO`) y debajo sus integrantes
(`row_type = INTEGRANTE`), agrupados para poder plegarlos. El XLSX de respaldo
conserva ese agrupamiento.

`row_type` · `group_code` · `project_code` · `submission_id` ·
`group_display_name` · `group_match_key` · `match_status` · `leader_name` ·
`leader_id_number` · `leader_whatsapp` · `leader_email` · `members_declared` ·
`members_registered` · `members_authorized` · `genre` · `eligibility_status` ·
`member_id` · `member_name` · `member_id_number` · `member_age` · `member_role`
· `member_consents` · `member_signature` · `member_status` · `member_alert`

## AGENDA (vista)

Los 10 bloques de 30 minutos, más una fila de MARGEN y una de CONTINGENCIA.

`block_id` · `ventana` · `arrival_time` **(T)** · `audition_time` **(T)** ·
`limite_tolerancia` **(T)** · `codigo_desde` · `codigo_hasta` · `asignados` ·
`cupo` · `disponibles`

## CHECK-IN (vista)

`code` · `full_name` · `artistic_name` · `discipline` · `final_block` ·
`arrival_time` **(T)** · `final_time` **(T)** · `check_in_time` **(T)** ·
`attendance_status` · `audition_status` · `operador_check_in` · `notes` ·
`participation_mode` · `members_declared` · `members_authorized` ·
`track_status` · `precola_at` · `stage_at` · `done_at`

## PISTAS (vista)

Personas con código y personas que declararon usar pista, en orden de agenda.
(Las listas de pistas del panel y del técnico muestran solo a quienes tienen
código: una pista no se puede enviar sin código.)

`code` · `artistic_name` · `participation_mode` · `song_name` · `track_uses` ·
`track_method` · `track_status` · `track_file_name` · `track_file_url` ·
`track_updated_at` · `track_notes` · `final_block` · `final_time` **(T)**

## JURADO_1 / JURADO_2 / JURADO_3

`code` · `artistic_name` · `discipline` · los 8 factores (`talento`,
`performance`, `identidad`, `repertorio`, `profesionalismo`, `presencia`,
`digital`, `proyecto`) · `total` · `valido` · `observaciones` · `evaluado_at` ·
`evaluado_by`

Cada factor va de 1 a 10. `total = Σ (nota / 10) × peso`, sobre 100.

| Factor | Peso |
|---|---|
| Talento / ejecución | 20 |
| Performance | 20 |
| Identidad artística | 15 |
| Repertorio / originalidad | 10 |
| Profesionalismo | 10 |
| Presencia escénica | 10 |
| Presencia digital / comunidad | 5 |
| Proyecto / compromiso | 10 |

Una tarjeta incompleta es **inválida**, no un puntaje bajo: se excluye del
promedio en vez de contar como cero. Para entrar al ranking hacen falta al menos
**2 tarjetas válidas** (`minimo_jurados` en CONFIG).

## RESULTADOS (vista)

`posicion` · `code` · `artistic_name` · `full_name` · `discipline` · `jurado_1`
· `jurado_2` · `jurado_3` · `jurados_validos` · `artist_final` · `seleccionado`
· `requiere_comite` · `observacion`

## DASHBOARD (vista)

Dos columnas: `INDICADOR` · `VALOR`.

## INCIDENTES

`incidente_id` · `at` · `code` · `tipo` · `descripcion` · `accion` ·
`responsable` · `estado`

## _CAMBIOS

Una fila por solicitud del Formulario 2.

`solicitud_id` · `at` · `code` **(T)** · `full_name` · `original_block` ·
`original_time` **(T)** · `can_attend_original` · `reason_short` · `contact`
**(T)** · `acceptance` · `estado` · `nuevo_bloque` · `nueva_hora` **(T)** ·
`resuelto_at` · `resuelto_by` · `observacion`

## _DELIBERACIONES

Actas del comité cuando el desempate automático no resuelve el corte del Top 7.

`deliberation_id` · `at` · `by` · `codes_in_order` · `cut_position` · `minutes`
· `status` (`VIGENTE` o `REEMPLAZADA`)

## _USUARIOS

`email_o_alias` · `rol` · `token` · `activo` · `creado_at` · `nota`

> Esta hoja contiene los enlaces de acceso del equipo. No se comparte ni se
> copia fuera de la base. Para los jurados, la `nota` dice `jurado 1`, `jurado 2`
> o `jurado 3`: así el sistema sabe en qué hoja guardar sus notas.

## _LOG

`at` · `actor` · `rol` · `accion` · `entidad` · `detalle` · `origen`

Todo lo que pasó, quién y cuándo. No se restaura desde un respaldo.

## CONFIG

Tres columnas: `clave` · `valor` **(T)** · `descripcion`. Es el único sitio
donde se cambian fechas, horas, cupos, edades, plazos, datos legales, enlaces y
los interruptores (`SI`/`NO`) sin tocar código:

- Interruptores: `inscripciones_abiertas`, `cambios_abiertos`,
  `integrantes_abierto`, `pistas_abiertas`, `exigir_video`, `verificar_videos`,
  `firma_integrantes`, `correo_confirmacion_automatico`.
- Enlaces: `web_app_url` (obligatoria), `sitio_url`, `terms_url`,
  `privacy_policy_url`, `whatsapp_grupo_enlace`, `domain`.
- Recuperación: `restaurar_desde`, `restaurar_confirmacion` (ver
  [MANUAL-RECUPERACION.md](MANUAL-RECUPERACION.md)).

## _IDEMPOTENCIA

`clave` · `at` · `resultado`

Guarda la clave de cada operación ya procesada y su resultado. Un reenvío del
formulario, un doble toque o una operación de check-in que se reenvía al volver
la señal devuelven la **misma respuesta** sin escribir una segunda fila.
