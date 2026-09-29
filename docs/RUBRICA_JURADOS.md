# Rúbrica oficial de jurados — EL BÚNKER (iteración 3)

> Vigente desde el 29-sep-2026 (sistema 3.0.0). Fuente de verdad: el código (`apps-script/04_core_rubrica.gs`,
> `24_api_jurado.gs`, `30_vistas.gs`, `22_api_admin.gs`). Si este documento y el código difieren, manda el código.

## 1. Origen

| Dato | Valor |
|---|---|
| Documento fuente | `rubrica-jurado-daviarena.pdf` (rúbrica oficial de jurado adoptada para esta convocatoria el 29-sep-2026) |
| Qué se tomó del PDF | Categorías, factores, escala 1–5, textos de cada nivel, criterios de desempate y causales de descalificación, **literales** |
| Qué NO se tomó | El lugar que nombra el PDF (Daviarena) no es la sede de este evento. La sede es **Centro Comercial Mayorca · Etapa 1, Sabaneta** |
| Versión en el sistema | `R1-2026-09-29 (rubrica-jurado-daviarena.pdf)` (`RUBRIC_VERSION_DEFAULT`) |
| Huella (fingerprint) | `afinacionx4|presenciax4|interpretacionx3|originalidadx3|ritmox2|repertoriox2|arenax2` |
| Carácter | La rúbrica completa es **privada de jurados**. La web pública solo dice que 3 jurados califican con la rúbrica oficial (100 puntos por jurado). Las causales de descalificación sí son públicas |

## 2. Las 7 categorías

Cada jurado califica cada categoría de **1 a 5**. Puntos = nota × factor.

| # | id (columna) | Categoría | Factor | Máx. | Desempate |
|---|---|---|---|---|---|
| 1 | `afinacion` | Afinación y técnica vocal | ×4 | 20 | — |
| 2 | `presencia` | Presencia escénica y dominio del escenario | ×4 | 20 | **SÍ** |
| 3 | `interpretacion` | Interpretación y conexión emocional | ×3 | 15 | — |
| 4 | `originalidad` | Originalidad y propuesta artística | ×3 | 15 | — |
| 5 | `ritmo` | Ritmo, sincronía y trabajo con banda/pista | ×2 | 10 | — |
| 6 | `repertorio` | Repertorio: elección y dificultad | ×2 | 10 | — |
| 7 | `arena` | Factor arena: capacidad de calentar al público | ×2 | 10 | **SÍ** |
| | | **Total por jurado** | **20** | **100** | |

**Formatos sin voz.** Cuando el proyecto se inscribió con forma de presentación `INSTRUMENTAL`, `DJ_SET` u `OTRA`,
la categoría 1 se muestra al jurado como **"Dominio técnico de la voz/instrumento principal"** (mismo factor y escala)
(`categoryLabelFor`, `NON_VOCAL_FORMATS`). `FREESTYLE_PERFORMANCE`, `VOZ_PISTA` y `VOZ_INSTRUMENTO` ven el nombre vocal.

## 3. Escala y anclajes (texto literal del PDF)

Etiquetas de la escala: **1 Insuficiente · 2 Regular · 3 Bueno · 4 Muy bueno · 5 Nivel arena**.

| Categoría | 1 · Insuficiente | 2 · Regular | 3 · Bueno | 4 · Muy bueno | 5 · Nivel arena |
|---|---|---|---|---|---|
| Afinación y técnica vocal | Desafinaciones frecuentes, se queda sin aire, pierde el control en notas sostenidas. | Afina la mayor parte, pero se nota inseguridad técnica en los pasajes difíciles. | Técnica sólida y consistente, maneja bien su registro natural. | Control técnico notable, domina matices, dinámica y respiración con soltura. | Técnica impecable incluso bajo la exigencia física de un show en vivo largo. |
| Presencia escénica | Rígido, de espaldas al público, no sabe qué hacer con las manos o el cuerpo. | Presencia tímida, se mueve poco, le cuesta ocupar el espacio disponible. | Se desenvuelve con naturalidad, mantiene contacto visual y buena postura. | Carisma claro, se mueve con intención, transmite seguridad sostenida. | Magnetismo escénico real: podría sostener solo un escenario grande sin apoyo visual extra. |
| Interpretación y conexión | Interpretación plana, sin matices ni conexión con la letra. | Hay algo de intención, pero se siente mecánico o forzado. | Transmite la emoción de la canción de forma creíble. | Fraseo personal, matices claros, genera una reacción real en quien escucha. | Interpretación que eriza la piel; el jurado olvida que está calificando. |
| Originalidad y propuesta | Copia genérica de referentes, cero sello propio. | Algún intento de diferenciarse, pero poco definido. | Propuesta identificable, se nota una dirección artística clara. | Sonido o puesta en escena distintivos, se recuerda después del show. | Propuesta tan propia que podría ser su marca personal como artista. |
| Ritmo y sincronía | Se descuadra con la música, entradas y cortes desordenados. | Mantiene el tiempo casi siempre, con algunos desfases. | Sincronía sólida con banda o pista durante toda la presentación. | Groove natural, ajusta y responde a la banda en tiempo real. | Precisión de sesión profesional, cero margen de error visible. |
| Repertorio | Canción muy fácil o inadecuada para el formato del evento. | Elección correcta pero segura, no reta al artista. | Repertorio bien elegido, exige y a la vez encaja con el público. | Canción exigente que el artista domina y usa a su favor. | Elección estratégica: reta, encaja y "calienta" perfecto para lo que viene después. |
| Factor arena | No genera reacción, el público queda indiferente. | Genera algo de energía, pero se pierde o no la sostiene. | Logra enganchar a buena parte del público en pocos minutos. | Sube la energía de la sala de forma clara y sostenida. | Deja al público listo y con hambre de más — exactamente el trabajo de un telonero. |

Descripción de cada categoría (lo que el jurado lee arriba de los niveles): ver `RUBRIC_DEFAULT` en
`04_core_rubrica.gs` o la hoja `PARAMETROS_RUBRICA`, columna `descripcion`.

## 4. Cómo se calcula el puntaje

### 4.1 Tarjeta de un jurado (`calcularPuntajeJurado`)

- Puntos de cada categoría = nota (entero 1–5) × factor.
- **Total del jurado** = suma de las 7 categorías → entre **20** (todo 1) y **100** (todo 5).
- **Puntos de desempate del jurado** = puntos de Presencia (×4) + puntos de Factor arena (×2) → entre 6 y 30.
- Una tarjeta con alguna categoría vacía es **inválida**: no tiene total. Nunca se trata como nota baja. No se puede enviar
  incompleta (el botón de enviar se desactiva y el servidor la rechaza con "Para enviar faltan: …").
- Las **observaciones** son cualitativas: no cambian el puntaje.

### 4.2 Puntaje final del proyecto (`consolidarArtista`, `computeResults`)

- Solo cuentan las tarjetas **ENVIADAS** (los borradores no cuentan).
- **Puntaje final** = promedio aritmético de los totales de las tarjetas enviadas y válidas, **con precisión completa**.
  Solo se redondea para mostrar (2 decimales: `scoreText`). El ranking compara el valor sin redondear.
- **Desempate del proyecto** = promedio de los puntos de desempate de esas mismas tarjetas.
- Para entrar al ranking el proyecto necesita: audición `REALIZADA`, al menos `minimo_jurados` tarjetas enviadas y no
  estar descalificado. En CONFIG, `minimo_jurados = 3` (valor oficial desde el 29-sep-2026; su descripción dice
  "promedio de los 3 jurados"). Si alguien cambiara ese valor, el promedio se haría con menos jurados: no se toca.
- Motivos de exclusión que muestra RESULTADOS: `AUDICION_NO_REALIZADA`, `DESCALIFICADO`, `JURADOS_INSUFICIENTES`
  (estado `SIN_RANKING`).

### 4.3 Orden y cortes (`seleccionarTop`, `compararArtistas`)

1. Mayor **puntaje final**.
2. Si el puntaje final es idéntico: mayor **puntos de desempate** (Presencia escénica + Factor arena **combinados**, tal
   como dice el PDF: "Mayor puntaje en Presencia escénica y Factor arena combinados"). No es "primero presencia y luego
   arena": es la suma ponderada de ambas (presencia pesa ×4, arena ×2), promediada entre jurados.
3. Si sigue idéntico: empate real. El orden en pantalla entre empatados es por código (solo visual, no decide nada).

Estados que produce (`RANKING_STATUS`):

| Posición | Estado | Visibilidad |
|---|---|---|
| 1–10 | `TOP10_SELECCIONADO` | Los 10 seleccionados (lo único público) |
| 11–20 | `TOP20` | Privado: nunca se publica ni va en correos a participantes |
| 21+ | `RANKED` (antes del cierre) / `NO_SELECCIONADO` (después del cierre) | Privado |
| Empate que cruza el puesto 10 o el 20 | `TIE_REVIEW_REQUIRED` | Privado, exige acta |
| Excluido | `SIN_RANKING` | Privado |

Los cortes vienen de CONFIG: `top_seleccionados = 10`, `top_privado = 20`.

## 5. Empates en el corte (TIE_REVIEW_REQUIRED) y acta de deliberación

**Cuándo hay empate que importa** (`detectarEmpateEnCorte`): solo si el proyecto en la posición 10 y el de la 11 (o el 20
y el 21) tienen el mismo puntaje final **y** los mismos puntos de desempate. Todos los proyectos empatados con el de la
posición del corte quedan `TIE_REVIEW_REQUIRED`. Un empate dentro del Top 10 (por ejemplo 3 y 4) no se marca porque no
cambia quién es seleccionado.

**El sistema nunca decide un empate persistente.** Se resuelve con un acta (`accionRegistrarDeliberacion`), en el panel
de dirección ("Resultado consolidado" → "Acta de desempate"):

| Campo | Regla del código |
|---|---|
| Corte | Solo 10 o 20 (`top_seleccionados` / `top_privado`) y debe existir un empate sin resolver en ese corte |
| Método | `REPETIR_CANCION` ("Se repite una canción corta a criterio del jurado") o `VOTO_CALIDAD` ("Voto de calidad del jurado musical") — los dos métodos del PDF |
| Orden decidido | Códigos de mejor a peor. Debe contener **exactamente** a los empatados actuales, ni uno más ni uno menos |
| Participantes | Obligatorio (mín. 3 caracteres). Ej.: "Jurados 1, 2 y 3; dirección" |
| Resultado y motivo | Obligatorio (mín. 3 caracteres). Qué pasó y por qué |
| Quién | Rol `direccion` o `admin` (permiso `deliberar`) |
| Cuándo no | Con resultados cerrados |

Qué hace: guarda la fila en `_DELIBERACIONES` con estado `VIGENTE` (la anterior del mismo corte pasa a `REEMPLAZADA`),
registra en `_LOG` y recalcula RESULTADOS. El acta se aplica colocando a los empatados en el orden decidido a partir de la
primera posición empatada (`applyDeliberation`).

**Si los puntajes cambian después del acta** (por ejemplo, se reabre y corrige una tarjeta) y el grupo de empatados ya no
es el mismo, el acta deja de aplicarse sola: queda en `_LOG` como `DELIBERACION_NO_APLICA` y el corte vuelve a
`TIE_REVIEW_REQUIRED` hasta registrar un acta nueva.

## 6. Descalificación

Causales (literales del PDF, `DQ_CAUSES`):

| id | Causal |
|---|---|
| `PLAYBACK` | Uso de playback sin avisarlo, en formato que exige voz en vivo. |
| `SOUNDCHECK` | Incumplimiento grave de tiempos de soundcheck o ensayo sin justificación. |
| `CONTENIDO` | Contenido discriminatorio u ofensivo en repertorio o comportamiento en tarima. |

Flujo:

1. **El jurado reporta** en su tarjeta: casilla "Reportar una posible causal de descalificación" + causal + "Qué
   observaste". Se guarda con el borrador o el envío. Crea una fila `PENDIENTE` en `_DESCALIFICACIONES` (una abierta por
   proyecto y jurado) y pone `dq_status = PENDIENTE` en REGISTRO.
2. Mientras está `PENDIENTE` el proyecto **sigue en el ranking** marcado "Reporte de descalificación PENDIENTE de validar"
   y su `evaluation_status` es `DQ_PENDIENTE`. **Impide cerrar resultados.**
3. **Dirección (o admin) decide** en "Descalificaciones, correcciones y cierre" → "Ver reportes": **Validar** o
   **Descartar**, siempre con motivo (mín. 5 caracteres; queda en `_LOG`).
   - `VALIDADA`: `dq_status = VALIDADA`, el proyecto sale del ranking (Top 10 y Top 20) como `DESCALIFICADO`.
   - `DESCARTADA`: se limpia `dq_status` salvo que quede otro reporte pendiente o ya validado.
4. El jurado nunca descalifica por sí solo; su tarjeta sigue contando mientras el reporte no se valide.

## 7. Borrador y envío de la tarjeta

| Estado de la tarjeta | Cómo se llega | Qué puede hacer el jurado |
|---|---|---|
| (sin tarjeta) | — | Calificar cuando la audición está `REALIZADA` |
| `BORRADOR` | "Guardar borrador" (puede estar incompleta) | Seguir editando |
| `ENVIADA` | "ENVIAR Y BLOQUEAR EVALUACIÓN" (exige las 7 notas + confirmación en pantalla) | Nada: queda bloqueada |
| `BORRADOR` reabierta | Dirección o admin pulsa "Reabrir evaluación" con motivo | Corregir y volver a enviar |

- Solo **dirección o admin** reabren (`accionReabrirEvaluacion`), con motivo (mín. 5 caracteres) y solo si los resultados
  no están cerrados. Se anotan `reabierta_at`, `reabierta_by`, `reabierta_motivo` en la tarjeta y el total previo en `_LOG`.
- Mientras una tarjeta reabierta está en borrador **no cuenta**: el proyecto puede quedar temporalmente
  `JURADOS_INSUFICIENTES` hasta que el jurado la reenvíe.
- Con `resultados_cerrados = SI` no se guarda, no se envía y no se reabre ninguna tarjeta: primero dirección pulsa
  "Reabrir resultados" (§11).
- La pantalla de jurado es solo de las cuentas con rol `jurado` (`notAJuror`): cualquier otro rol, también admin, recibe
  un aviso y no puede guardar. El jurado solo califica proyectos con audición `REALIZADA`.

## 8. Dónde vive la rúbrica y qué pasa si alguien la edita

- La rúbrica es un **parámetro**, no código: hoja **`PARAMETROS_RUBRICA`**, una fila por categoría, columnas
  `version, orden, id, categoria, categoria_corta, categoria_no_vocal, descripcion, factor, puntos_max, nivel_1..nivel_5, desempate`.
- Se siembra con la rúbrica oficial solo cuando la hoja está vacía (instalación o migración). Tiene protección de
  **solo advertencia**: Sheets pide confirmación antes de editarla.
- Cada tarjeta guarda `rubric_version` y `rubric_fingerprint` del momento en que se guardó.
- `activeRubric()` lee la hoja en cada ejecución y la valida (`validateRubric`):

| Qué se edita | Resultado |
|---|---|
| Nada (hoja intacta) | Rúbrica oficial, `origen = PARAMETROS_RUBRICA`, válida |
| La hoja queda vacía | Se usa la rúbrica oficial por defecto (`origen = DEFECTO`) |
| Error estructural: id inválido o repetido, factor no entero o ≤ 0, falta nombre, falta alguno de los 5 textos, factores que no suman 100 puntos máximos, ninguna categoría con desempate | **Rúbrica inválida**: los jurados no pueden guardar ni enviar ("La rúbrica configurada no es válida (…). Avisa a dirección.") y ven un aviso rojo. Las hojas de jurado y el ranking se calculan con la rúbrica oficial por defecto. `VERIFICAR` / "Estado del sistema" muestran los errores |
| Cambio válido de factores (siguen sumando 100) | Se acepta. **Todas** las tarjetas, también las ya enviadas, se recalculan en RESULTADOS con los factores nuevos; el `total` guardado en cada hoja JURADO_n queda con el cálculo viejo. "Estado del sistema" lista esas tarjetas en `tarjetas_con_otra_rubrica` |
| Cambio de un `id` | Las notas guardadas bajo el id viejo dejan de leerse: las tarjetas quedan incompletas y los proyectos salen del ranking como `JURADOS_INSUFICIENTES`. **No se hace** |

Regla operativa: la rúbrica no se toca desde que empieza el evento.

## 9. Guía "Cómo calificar" que ve el jurado

En la pantalla del jurado (`ui_jurado.html`, datos de `rubricGuide`):

- Aviso fijo: califica de forma independiente; no ves ni comentas notas de otros jurados; solo ves tus evaluaciones; el
  ranking lo consolida el sistema. Borrador hasta "ENVIAR Y BLOQUEAR EVALUACIÓN"; después solo dirección reabre.
- Desplegable **"Cómo calificar (rúbrica oficial)"**: escala 1–5 con sus etiquetas, total por jurado de 20 a 100,
  resultado final = promedio de los 3 jurados, ejemplo de cálculo (notas 4, 5, 3, 4, 5, 3, 4 → 4×4 + 5×4 + 3×3 + 4×3 +
  5×2 + 3×2 + 4×2 = **81**), cada categoría con factor, máximo, marca de desempate, nombre para formatos sin voz,
  descripción y los 5 niveles; reglas de empate; causales de descalificación ("tú reportas, valida dirección"); las
  observaciones no cambian el puntaje.
- Lista de participantes: aparecen quienes ya llegaron al evento (estado distinto de CONFIRMADO); solo se califica con
  audición REALIZADA. El jurado ve código, nombre artístico, modalidad, género, forma de presentación y canción. No ve
  documento, contacto, notas de otros jurados ni ranking.
- Tarjeta: una categoría a la vez, botones con el texto de cada nivel, total en vivo, observaciones, reporte de
  descalificación, "Guardar borrador" y "ENVIAR Y BLOQUEAR EVALUACIÓN" (con confirmación).
- Cada cuenta de jurado escribe en su hoja: la nota de la cuenta en `_USUARIOS` ("jurado 1/2/3") decide JURADO_1/2/3.

## 10. Ejemplos numéricos (calculados con el código real)

Verificados ejecutando `calcularPuntajeJurado`, `consolidarArtista` y `seleccionarTop` de `04_core_rubrica.gs`.

### Ejemplo 1 — un proyecto, tres jurados

Orden de notas: afinación, presencia, interpretación, originalidad, ritmo, repertorio, arena.

| Jurado | Notas | Puntos por categoría | Total | Desempate (presencia + arena) |
|---|---|---|---|---|
| 1 | 4, 5, 3, 4, 5, 3, 4 | 16 + 20 + 9 + 12 + 10 + 6 + 8 | **81** | 20 + 8 = **28** |
| 2 | 3, 4, 4, 3, 4, 4, 3 | 12 + 16 + 12 + 9 + 8 + 8 + 6 | **71** | 16 + 6 = **22** |
| 3 | 5, 4, 4, 4, 3, 3, 5 | 20 + 16 + 12 + 12 + 6 + 6 + 10 | **82** | 16 + 10 = **26** |

- Puntaje final = (81 + 71 + 82) / 3 = 234 / 3 = **78** (pantalla: 78.00).
- Desempate = (28 + 22 + 26) / 3 = 76 / 3 = 25,3333… (pantalla: 25.33).
- Si al jurado 1 le faltara la nota de arena, su tarjeta sería inválida (sin total) y no podría enviarla.

### Ejemplo 2 — por qué se usa precisión completa

- Proyecto A: totales 80, 80 y 81 (la tarjeta de 81 = notas 4, 4, 5, 4, 3, 4, 4) → 241 / 3 = 80,3333… (pantalla 80.33).
- Proyecto B: totales 80, 80 y 80 → **80** (pantalla 80.00).
- A queda por encima de B por 1/3 de punto. El ranking compara 80,3333… contra 80, nunca valores redondeados.

### Ejemplo 3 — empate en el corte 10 y acta

Nueve proyectos van por delante (puestos 1–9). Luego:

| Proyecto | Tarjetas (las 3 iguales) | Final | Desempate | Estado automático |
|---|---|---|---|---|
| B-031 | 4, 4, 4, 4, 4, 4, 4 (= 80) | 80.00 | 16 + 8 = 24.00 | `TIE_REVIEW_REQUIRED` (puesto 10) |
| B-045 | 4, 4, 4, 4, 4, 4, 4 (= 80) | 80.00 | 24.00 | `TIE_REVIEW_REQUIRED` (puesto 11) |
| B-050 | 5, 3, 4, 4, 4, 4, 4 (= 20+12+12+12+8+8+8 = 80) | 80.00 | 12 + 8 = 20.00 | `TOP20` (puesto 12) |

- B-050 empata en puntaje final pero pierde automáticamente por desempate (20 < 24): no necesita acta.
- B-031 y B-045 siguen empatados en todo y el empate cruza el puesto 10: el sistema no decide. Resultados no se pueden
  cerrar mientras exista.
- Dirección registra el acta: corte 10, método `VOTO_CALIDAD`, orden `B-045, B-031`, participantes y resultado.
  Resultado: B-045 puesto 10 `TOP10_SELECCIONADO`; B-031 puesto 11 `TOP20`.

## 11. Cierre de resultados

"Cerrar resultados" (dirección o admin, escribir **CERRAR**; `accionCerrarResultados`) solo procede si:

- no hay empates sin acta en el corte 10 ni en el 20;
- no hay descalificaciones `PENDIENTE`;
- ningún proyecto con audición realizada tiene menos de las 3 tarjetas enviadas (excepción `forzar_incompletos`: solo por
  API, no hay botón).

Al cerrar: `resultados_cerrados = SI`, RESULTADOS se recalcula (las posiciones 21+ pasan a `NO_SELECCIONADO`), las
evaluaciones quedan `BLOQUEADA` y se registra el Top 10 en `_LOG`. Después se envía el correo `RESULTADO_FINAL` desde
Comunicación (panel de logística/admin): dice solo SELECCIONADO o NO SELECCIONADO, nunca el Top 20.
**Reabrir resultados**: dirección o admin (permiso `cerrar_resultados`), botón "Reabrir resultados" en el dashboard, con
motivo de 10+ caracteres que queda en `_LOG`. Pone `resultados_cerrados = NO`: el Top 10 deja de ser definitivo y se
pueden reabrir tarjetas o registrar actas hasta volver a cerrar.
