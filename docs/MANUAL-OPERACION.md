# Manual de operación — EL BÚNKER

Para la coordinación y el equipo. **No hace falta saber programar ni tocar código.**
Todo se hace desde dos sitios: el **panel** (un enlace personal que te dieron) y la
**base maestra** (una hoja de cálculo de Google, que es tu "Excel").

**Audiciones: viernes 23 de octubre de 2026, de 3:00 p. m. a 9:00 p. m., en el
Centro Comercial Mayorca (Sabaneta, Antioquia).**

> **Cómo trabaja el sistema:** valida, ordena, calcula y **deja listo** el
> trabajo (mensajes redactados, listas, planes). **Las personas envían** los
> WhatsApp y **toman las decisiones que no se deshacen**: emitir códigos, aprobar
> o rechazar cambios, cerrar la jornada, resolver un empate. Nada de eso pasa
> solo.

---

## 0. Tus herramientas

| | Qué es | Para qué |
|---|---|---|
| **Panel** | Un enlace personal que abre en el navegador | Hacer cosas: emitir códigos, aprobar cambios, check-in, calificar |
| **Base maestra** | Una hoja de cálculo de Google | Ver y corregir datos a mano, exportar |

### Las cuentas del equipo

| Cuenta | Pantalla | Qué puede hacer |
|---|---|---|
| `admin` | Panel completo | Todo, incluidos *Estado del sistema* y *Accesos del equipo* |
| `coordinacion` | Panel de logística | Inscritos, agrupaciones, códigos, cambios, pistas, mensajes, videos, respaldos, cerrar jornada. También puede abrir el check-in y el dashboard |
| `direccion` | Dashboard | Indicadores, *Calcular resultados*, decisión del comité. Ve los inscritos con cédula, correo y teléfono enmascarados |
| `checkin-1`, `checkin-2` | Check-in | Buscar, validar documento y cambiar el estado de asistencia |
| `stage-manager` | Check-in | Lo mismo; usa sobre todo la pestaña *Escena* |
| `tecnico-audio` | Check-in | Lo mismo; usa sobre todo la pestaña *Pistas* |
| `jurado-1`, `jurado-2`, `jurado-3` | Jurado | Calificar, cada uno en su hoja (JURADO_1, 2 o 3) |

> Tu enlace es **personal**. No lo compartas: cada rol ve cosas distintas y todo
> queda registrado con tu nombre. Los enlaces **vencen a los 45 días** de
> emitidos. Si se pierde o se filtra uno, mira
> [MANUAL-RECUPERACION.md](MANUAL-RECUPERACION.md).

**Regla de oro:** la hoja **REGISTRO** es la verdad. Las hojas AGENDA, CHECK-IN,
AGRUPACIONES, PISTAS, RESULTADOS y DASHBOARD se **regeneran solas** desde ella —
si editas ahí, tu cambio se pierde en la siguiente actualización. Corrige siempre
en REGISTRO y después pulsa **Refrescar vistas** (panel → *Respaldo y sistema*).

---

## 1. ANTES de publicar la convocatoria (obligatorio)

Lo hace la persona con la cuenta `admin`.

### 1.1 La dirección de la aplicación (`web_app_url`)
Base maestra → pestaña **CONFIG** → clave **`web_app_url`**. Debe tener la URL de
la aplicación que termina en **`/exec`** (la de *Implementar → Gestionar
implementaciones*). Con ella se construyen **todos** los enlaces: paneles del
equipo, enlace de integrantes, Mi inscripción, cambio de horario y los que van en
los mensajes.

> Si está vacía o mal escrita, los enlaces pueden salir terminados en `/dev`
> (pasa siempre con los que se generan desde el editor, como los del equipo), y
> esos solo los abre el dueño de la cuenta. Para el público no funcionan.

### 1.2 Revisar el sistema
Panel `admin` → **Respaldo y sistema → Estado del sistema → Revisar**.
Debe salir en verde **"Sistema consistente"**. Eso comprueba, entre otras cosas:

| Qué mira | Debe decir |
|---|---|
| Entorno y marca de la hoja | Los dos iguales (en la convocatoria real: producción) |
| Esquema | completo |
| `web_app_url_ok` | sí (si no, sale "Falta web_app_url en CONFIG") |
| Datos de prueba | 0 |
| Legal verificado | SI · pendientes: ninguno |

### 1.3 Lo que ya está listo en CONFIG
Los datos legales (razón social, NIT, representante legal, dirección, correo,
teléfono), las versiones de términos (`v1-2026-09-24`) y política
(`v2-2026-09-24`), la fecha, las horas, las edades (18 a 30) y los cupos **ya
están cargados y verificados**. No se tocan salvo que la organización lo pida.

### 1.4 Lo que depende de la organización
| clave | qué es | si está vacía |
|---|---|---|
| `evento_direccion` | Punto exacto dentro del C.C. Mayorca (plazoleta, piso, entrada) | No se muestra; los mensajes dicen solo "Centro Comercial Mayorca, Sabaneta, Antioquia" |
| `whatsapp_grupo_enlace` | Enlace de invitación al grupo de WhatsApp (empieza por `https://`) | La plantilla de invitación al grupo **no aparece** en ninguna pantalla |

### 1.5 Interruptores (SI / NO)
| clave | qué abre o cierra |
|---|---|
| `inscripciones_abiertas` | Formulario 1 (inscripción) |
| `integrantes_abierto` | Formulario de integrantes de agrupación |
| `pistas_abiertas` | Subida de pistas en Mi inscripción |
| `cambios_abiertos` | Formulario 2 (cambio de horario) |
| `correo_confirmacion_automatico` | Correo automático al recibir cada inscripción |

---

## 2. Mientras llegan inscripciones

Panel → pestaña **Inscritos**.

- Arriba ves los contadores: inscritos, únicos, aptos, duplicados, revisión.
- El buscador acepta **nombre, código, GRP o documento**.
- El filtro te deja ver un estado, solo dúos y agrupaciones, o solo quienes
  tienen código.
- Cada fila muestra modalidad, edad, género, estado, video, pista y motivo.

Cada persona que se inscribe recibe en pantalla un **comprobante S-XXXXXXXX**.
Si queda APTO o en REVISIÓN, también le llega un correo automático de recepción
(CONFIG `correo_confirmacion_automatico` = `SI`).

### Qué significa cada estado

| Estado | Qué pasó | Qué haces |
|---|---|---|
| **APTO** | Cumple todo | Nada. Recibirá código al emitir. |
| **REVISIÓN** | Algo hay que mirar: correo o teléfono repetido, posible agrupación repetida o enlace de video con formato dudoso | Revisa la columna *Motivo* y decide |
| **INCOMPLETO** | Faltan datos o tienen mal formato | Contacta a la persona o corrige en REGISTRO |
| **NO CUMPLE** | Fuera de edad (18 a 30 años cumplidos el 23 de octubre) o no reside en Sabaneta | Nada. No recibe cupo. |
| **DUPLICADO** | Ya existe otra inscripción con **el mismo documento** (o se confirmó que es la misma agrupación) | Nada. Se conserva la primera. |

> Correo o teléfono repetidos **no** son duplicado: hermanos y parejas comparten
> número. Por eso quedan en REVISIÓN, para que lo mires tú.

### Cambiar un estado a mano
En la columna *Decisión* de la tabla hay un desplegable. Te pedirá un **motivo**,
que queda registrado con tu nombre. La revalidación respeta esa decisión.

### Corregir un dato de alguien
Base maestra → **REGISTRO** → busca la fila → corrige la celda. Después, en el
panel: **Cerrar los 100 → Revalidar inscripciones**. Detalle en
[MANUAL-RECUPERACION.md](MANUAL-RECUPERACION.md).

### Ayudar a alguien a consultar su inscripción
Cada participante tiene la página **Mi inscripción** (enlace en la página
pública). Escribe su **cédula** y su **código B-XXX o su comprobante S-XXXX**, y
ve su estado, código, horario (llegada y audición), pista, video y agrupación.
Si los datos no coinciden, la página dice que no encontró la inscripción.

---

## 3. Agrupaciones y autorización de integrantes

Modalidades: **Solista**, **Dúo** (exactamente 2 personas) y **Agrupación** (de 3
a 15 en escena). **Una agrupación = un proyecto = un cupo = un código.**

### Cómo funciona
1. El líder inscribe el proyecto con el Formulario 1. Recibe un **código de
   agrupación GRP-XXX**, una **clave de 6 caracteres** (letras y números) y un **enlace para los
   integrantes**.
2. **Cada integrante autoriza por sí mismo** en ese enlace: nombre, documento,
   fecha de nacimiento, rol artístico, aceptaciones y **firma dibujada** con el
   dedo o el mouse. El líder **no puede** autorizar por otra persona.
3. Cada integrante debe ser **mayor de edad**.

### Panel → pestaña Agrupaciones
Cada agrupación muestra su líder, cuántos integrantes declaró, cuántos se
registraron y cuántos autorizaron. Botones:

| Botón | Para qué |
|---|---|
| **Copiar enlace de integrantes** | Reenviarle al líder el enlace de su grupo |
| **Cambiar integrantes declarados** | Si el grupo cambió de tamaño (un dúo siempre es 2; una agrupación, de 3 a 15) |
| **Constancia imprimible** | Ver e imprimir la constancia de aceptación (sección 4) |

Si faltan autorizaciones: **Comunicación → plantilla 8. Agrupación: faltan
autorizaciones** (le llega al líder con el enlace de su grupo).

### Agrupaciones con nombre parecido
Si dos inscripciones tienen un nombre de agrupación equivalente, aparece
**"Posible agrupación repetida"** y la inscripción queda en REVISIÓN. **Decides
tú**; el sistema nunca fusiona nada:

| Decisión | Qué pasa |
|---|---|
| **Es el mismo proyecto** | Se conserva un solo cupo: la inscripción posterior queda DUPLICADO (o en REVISIÓN si ya tenía código) |
| **Son proyectos distintos** | Las dos siguen su curso y la decisión queda anotada |

Resuelve estas coincidencias **antes** de emitir códigos.

---

## 4. Constancia de aceptación imprimible

Una hoja por agrupación con: el proyecto, el líder, la versión de términos y de
política, el responsable del tratamiento y la lista de integrantes con su estado
y su **firma digital**. Quien no autorizó en línea aparece con una **línea en
blanco para firmar en papel**.

**Dónde se abre:**
- Panel → **Agrupaciones** → *Constancia imprimible*.
- Check-in → ficha de la agrupación → *Abrir constancia imprimible (firmas en
  papel)*.

Botón **Imprimir** arriba. El día del evento, quien no haya autorizado en línea
firma en esa hoja **delante del equipo de check-in, después de mostrar su
documento original**.

> La firma dibujada es evidencia de aceptación. No equivale a una firma
> electrónica certificada.

---

## 5. Cerrar los 100 y emitir códigos

Panel → pestaña **Cerrar los 100**.

1. **Revalidar inscripciones** — vuelve a aplicar edad, residencia, formato,
   duplicados y agrupaciones repetidas. Respeta tus decisiones manuales y nunca
   quita códigos ya emitidos. Hazlo siempre antes del paso 2.
2. Revisa los contadores y resuelve lo que esté en REVISIÓN y las agrupaciones
   repetidas.
3. **Emitir códigos y asignar bloques** — pide confirmación y reparte B-001…B-100
   en orden de inscripción, con su bloque, hora de llegada y hora de audición.

**Lo que tienes que saber:**
- Solo reciben código los **APTO**. Los que están en REVISIÓN no reciben código
  hasta que decidas.
- Una agrupación recibe **un solo** código, tenga los integrantes que tenga.
- Puedes pulsarlo **varias veces sin miedo**: nunca reasigna ni repite un código.
- Si alguien queda descalificado después, **su código no se reutiliza**. Ese cupo
  se pierde a propósito, para que el código B-047 signifique siempre lo mismo.
- Si hay más de 100 aptos, los que sobran quedan **sin cupo** y te lo dice.

Luego revisa **Ocupación por bloque → Ver ocupación**.

### La agenda
| Qué | Hora |
|---|---|
| 10 bloques de 30 min, 10 personas cada uno | 3:00 p. m. a 8:00 p. m. |
| Llegada al check-in | 15 min antes de su bloque |
| Tolerancia | 5 min |
| Margen operativo | 8:00 a 8:30 p. m. |
| Contingencia | 8:30 a 9:00 p. m. |
| **Cierre definitivo** | **9:00 p. m.** |

Cada audición dura máximo 3 minutos.

---

## 6. Comunicación con los participantes

Panel → pestaña **Comunicación**.

### Cómo se envía un mensaje
1. Elige la **plantilla**. Opcional: filtra por bloque.
2. **Generar textos** → sale una tabla con el mensaje exacto de cada persona.
3. **WhatsApp:** botón **Abrir chat** en cada fila. Se abre WhatsApp con el texto
   ya escrito; **una persona lo revisa y pulsa enviar desde el número oficial
   (323 983 6182)**. Solo sale ese botón para quien autorizó WhatsApp; a los
   demás les aparece "No autorizó WhatsApp: usar correo".
4. **Correo:** **Enviar por correo** manda correos reales a todos los de la lista
   (pide confirmación).

> **El sistema nunca envía WhatsApp solo.** Enviar automáticamente exigiría la
> API paga de WhatsApp Business. El único envío automático es el correo de
> recepción de la inscripción.

> **Cuota de correo:** una cuenta de Gmail normal envía ~100 correos al día. Con
> 100 participantes vas justo. Si se acaba, continúa al día siguiente o usa
> WhatsApp, que es el canal principal.

> Si en un mensaje ves algo entre llaves, como `{{code}}`, **no lo envíes**: le
> falta un dato a esa persona. Corrígelo en REGISTRO y genera de nuevo.

### Las plantillas

| # | Plantilla | A quién va |
|---|---|---|
| 1 | Recepción de inscripción | APTO y REVISIÓN |
| 2 | **Asignación de código y horario** | Todos los que tienen código — **la importante** |
| 3 | Cambio aprobado | Solicitudes aprobadas |
| 4 | Cambio no aprobado | Solicitudes rechazadas |
| 5 | Recordatorio 24 h antes | Todos los que tienen código |
| 6 | Recordatorio del día | Todos los que tienen código |
| 7 | Contingencia / no show | Quienes están en CONTINGENCIA o NO SHOW |
| 8 | Agrupación: faltan autorizaciones | Líderes de grupos con integrantes sin autorizar |
| 9 | Pista pendiente | Quienes dijeron que usan pista y no la han enviado |
| 10 | Invitación al grupo de WhatsApp | Aptos o con código que autorizaron WhatsApp |

> La plantilla **10** solo aparece cuando la organización crea el grupo y se
> pega su enlace (`https://…`) en CONFIG → `whatsapp_grupo_enlace`. Mientras esa
> clave esté vacía, **no se ofrece ni se menciona** en ninguna pantalla.

Todos los mensajes piden **guardar el número 323 983 6182 como "EL BÚNKER —
Arte es la Solución"**: las listas de difusión de WhatsApp solo le llegan a quien
guardó el número.

### Contactos para la lista de difusión
**Contactos para la lista de difusión** → *Con código* o *Aptos y con código*.
Descarga un archivo de contactos (.vcf) con quienes autorizaron WhatsApp, para
importarlo en el teléfono del número oficial y armar la lista de difusión o el
grupo.

---

## 7. Videos

Panel → **Comunicación → Videos**.

El formulario comprueba el enlace del video al inscribirse, y el sistema lo
vuelve a revisar solo **cada hora**. *Verificar pendientes* o *Verificar todos
otra vez* lo fuerzan.

| Estado | Qué significa | Qué haces |
|---|---|---|
| **ACCESIBLE** | Se abre sin iniciar sesión | Nada |
| **NO ACCESIBLE** | Es privado o no existe | Pedirle a la persona que lo abra. En Drive: *Compartir → Cualquier persona con el enlace* |
| **NO VERIFICABLE** | Instagram, TikTok u otro sitio que no se puede comprobar solo | Abrirlo a mano |
| **PENDIENTE** | Aún no se revisó | Esperar o forzar la verificación |
| **SIN VIDEO** | No puso enlace | Nada (el video no es obligatorio) |

El estado del video **no** cambia la elegibilidad: es información para
organizar la revisión.

---

## 8. Pistas y técnico de audio

### Cómo llegan
- El participante la sube desde **Mi inscripción**, **solo cuando ya tiene
  código**. Formatos: mp3, wav, m4a, aac, ogg, flac. **Máximo 15 MB** (el
  navegador rechaza archivos más grandes).
- Se guarda en Drive como `Audio/B-XXX/B-XXX_ARTISTA_CANCION.ext`. Si la vuelve a
  enviar, la anterior **no se borra**: queda renombrada como `…_REEMPLAZADA_<fecha>`.
- Una subida tarda del orden de medio minuto (medido: 5 MB ≈ 25 s, 14 MB ≈ 48 s).

### Panel → pestaña Pistas
| Qué | Para qué |
|---|---|
| **Actualizar lista** | Ver todas las pistas en orden de agenda, con su estado y su archivo |
| **Crear carpetas Audio/B-XXX** | Una carpeta por código (se puede repetir sin problema) |
| **Marcar → Cambiar…** | Poner el estado de la pista, con una nota opcional |
| **Subir una pista recibida por WhatsApp** | Código + canción + archivo → *Subir y renombrar*. Queda igual que si la hubiera subido la persona |

Estados: **PISTA PENDIENTE → PISTA RECIBIDA → PISTA VALIDADA** (o **PISTA CON
PROBLEMA**). *NO APLICA* es para quien no usa pista. Al subirse, una pista queda
RECIBIDA sola; **validarla o marcar un problema lo hace coordinación** desde este
panel, con lo que le diga el técnico.

A quien le falte: **Comunicación → plantilla 9. Pista pendiente**.

### Antes del evento
1. Panel → **Respaldo y sistema → Respaldar audios** (copia todas las pistas a la
   carpeta de respaldos). Si responde que no terminó, púlsalo otra vez: sigue
   donde quedó.
2. **Descarga la carpeta de audio completa** al computador del técnico. El sistema
   no comparte los archivos: los enlaces a Drive solo abren para quien tenga
   acceso a esa carpeta.
3. Recuérdale a todo el mundo: **copia en USB obligatoria**.

### El día del evento (cuenta `tecnico-audio`)
Check-in → pestaña **Pistas → Cargar pistas**: la lista en orden de agenda, con
hora, artista, canción, estado, archivo y necesidades técnicas. Si la pista no
llegó o tiene problema: **se usa la USB**.

---

## 9. Cambios de horario

La persona lo pide con el **Formulario 2** (enlace en la página pública y en su
mensaje de asignación).

Reglas que el sistema ya aplica solo:
- **Una sola solicitud por código.**
- Solo si tiene código y declaró que **no puede** asistir en su horario.
- El nombre debe coincidir con el registrado para ese código.
- Solo **hasta el jueves 22 de octubre de 2026 a las 6:00 p. m.** (CONFIG
  `cierre_cambios`). Después, el formulario dice que el plazo cerró.

Panel → pestaña **Cambios de horario → Actualizar**. Cada solicitud muestra el
código, el motivo, el contacto y el horario actual.

- **Aprobar:** elige el bloque destino (solo salen los que tienen cupo libre). El
  sistema cambia hora y bloque — **el código NO cambia**.
- **Rechazar:** escribe el motivo. La persona conserva su horario.

El participante nunca elige la hora: la decides tú. Cuando resuelvas, avísale con
la plantilla **3** o **4**. Para cerrar antes de tiempo: CONFIG →
`cambios_abiertos` = `NO`.

---

## 10. El día del evento — mesa de check-in

Abre tu enlace de **check-in** en la tablet o el celular.

> **Lo primero, al llegar y con buena señal: abre la página.** Descarga la lista
> completa al dispositivo. A partir de ahí **funciona sin internet**.

### Atender a alguien
1. Escribe su **código** (B-014), su **documento** o **el documento de cualquier
   integrante** de su agrupación, y pulsa **Buscar**.
2. **Compara el documento físico con la persona** (en agrupaciones, el de cada
   integrante). El sistema te muestra el documento registrado, pero la
   verificación la haces tú.
3. Lee los avisos amarillos de la ficha:
   - *Autorizaciones: X de Y* → quien falte firma la **constancia física** antes
     de subir (sección 4).
   - *NO autoriza uso de imagen/voz* → no grabar ni publicar su presentación.
   - *La pista no ha llegado* → pedir la USB.
   - *Solicitud de cambio sin resolver* → avisar a coordinación.
4. Pulsa el botón que corresponda. Solo aparecen los botones permitidos para su
   estado actual.

| Botón | Cuándo |
|---|---|
| **Confirmar CHECK-IN** | Llegó y está verificado |
| **Pasar a PRECOLA** | Va a la fila junto al escenario |
| **Sube a escena (EN AUDICIÓN)** | Está en escena |
| **Audición REALIZADA (salida)** | Terminó. **Sin esto el jurado no puede calificarla** |
| **Pasar a CONTINGENCIA** | Llegó con más de 5 min de retraso |
| **Marcar NO SHOW** | No apareció en su turno |

### Los estados

| Estado | Qué significa |
|---|---|
| CONFIRMADO | Tiene código y horario; aún no llega |
| CHECK-IN | Llegó y se verificó su documento |
| PRECOLA | Esperando junto al escenario |
| EN AUDICIÓN | En escena ahora |
| REALIZADA | La audición se hizo — puede calificarse |
| CONTINGENCIA | Perdió su turno; espera un espacio de 8:30 a 9:00 p. m. |
| NO SHOW | No se presentó en su turno |
| NO AUDICIONADO | Se cerró la jornada sin que audicionara — fuera de la selección |
| INCIDENTE | Algo requiere una decisión documentada |

### La regla de los 5 minutos
El sistema calcula el retraso y te avisa:
- **Hasta 5 min:** aviso amarillo. Conserva el turno **solo si no altera el
  flujo** — esa decisión es del coordinador, no del sistema.
- **Más de 5 min:** aviso rojo. Pierde el turno y pasa a contingencia.
  **Nunca se desplaza a quien llegó puntual.**

### Si se cae el internet
**Sigue trabajando normal.** Cada botón se guarda en el dispositivo y queda en la
pestaña **Pendientes de sincronizar (N)**. Cuando vuelve la señal se envía solo
(también lo reintenta cada 30 segundos); **Sincronizar ahora** lo fuerza.

- **No borres los datos del navegador ni uses modo incógnito**: ahí vive la cola.
  Si cierras la pestaña, la cola sigue guardada en ese dispositivo y se envía al
  abrirla de nuevo con señal.
- Trabaja siempre en el mismo dispositivo: la cola de una tablet no la ve otra.
- Si al sincronizar aparece *"operaciones rechazadas por el servidor"* (por
  ejemplo, otra mesa ya había cambiado a esa persona), avisa a coordinación.

### Corregir un estado marcado por error
No hay botón para deshacer. Coordinación lo corrige en **REGISTRO**
(`attendance_status` y `audition_status`), anota lo ocurrido en la hoja
**INCIDENTES** y pulsa **Refrescar vistas**.

---

## 11. Stage manager

Cuenta `stage-manager`, en la misma pantalla de check-in → pestaña **Escena**.
Muestra tres listas: **En escena**, **En precola** y **Con check-in,
esperando**, cada una con código, artista, hora y canción.

Flujo: **CHECK-IN → PRECOLA → EN AUDICIÓN → REALIZADA (salida)**.
- Llama a los siguientes a precola → *Pasar a PRECOLA*.
- Cuando uno sube → *Sube a escena (EN AUDICIÓN)*.
- Cuando baja → *Audición REALIZADA (salida)*.

El sistema guarda la hora de cada paso. **El cronómetro de los 3 minutos lo lleva
la persona**: el sistema no corta la audición.

---

## 12. Contingencia (8:30 – 9:00 p. m.)

Check-in → pestaña **Contingencia → Calcular plan ahora**. Con el tiempo que queda
de verdad hasta el cierre, te dice **cuántos alcanzan**, en qué orden y a qué
hora estimada. El orden es el de llegada a la lista de contingencia. Los que no
alcancen quedarán NO AUDICIONADOS al cerrar — no es una decisión arbitraria, es
el tiempo disponible.

Para avisarles: **Comunicación → plantilla 7. Contingencia / no show**.

---

## 13. 9:00 p. m. — cierre

1. **Antes de cerrar**, marca **REALIZADA** a quien esté en escena o ya se haya
   presentado. Quien quede en EN AUDICIÓN no se cierra solo, y sin REALIZADA el
   jurado no puede calificarlo.
2. Panel (`admin` o `coordinacion`) → **Respaldo y sistema → Cerrar jornada**.
   Todo el que no audicionó queda **NO AUDICIONADO** y **fuera de la selección**.
   Pide confirmación porque **no se deshace**.
3. Haz un respaldo con etiqueta **Post-evento** (sección 17).

---

## 14. El jurado

Cada jurado abre **su propio enlace**. Ve código, nombre artístico, modalidad,
género, formato y canción: **ni documento, ni contacto, ni las notas de los
otros jurados**.

1. En la lista aparecen quienes ya pasaron por check-in, con su estado. **Solo se
   puede guardar la calificación de quien está en REALIZADA**; para los demás el
   sistema responde que la audición aún no está marcada como REALIZADA.
2. Pulsa **Calificar** en un participante.
3. Pon de 1 a 10 en los 8 factores. El total sobre 100 se calcula solo.
4. Escribe observaciones si quieres (sirven para deliberar).
5. **Guardar calificación**.

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

- No se puede guardar incompleto: si falta un factor, el botón queda bloqueado.
- Corregir una nota se puede (*Corregir*), y **queda registrado**.
- Cada jurado califica **de forma independiente**, sin ver ni comentar las notas
  de los otros antes de deliberar.

---

## 15. El dashboard (dirección)

Enlace de `direccion` → **Dashboard**.

- **Indicador operativo:** qué bloque está corriendo (o si es margen,
  contingencia o audiciones cerradas) y cuántos esperados, con check-in,
  realizadas y no show lleva.
- **Simular hora (ensayo):** escribe una hora (por ejemplo `15:10` o `20:40`) y
  pulsa **Ver** para ver cómo se vería el indicador a esa hora. **Ahora** vuelve
  a la hora real. Sirve para ensayar; no cambia ningún dato.
- Gráficos: avance de la jornada, estado de participantes, avance por bloque,
  distribución de puntajes, Top 7, agrupaciones, pistas y videos. Los gráficos
  tienen la opción *Ver como tabla*.
- **Inscritos (datos protegidos):** cédula, correo y teléfono enmascarados.

---

## 16. Resultados y decisión del comité

Dashboard → **Resultado consolidado → Calcular resultados**.

- Ranking con las notas de cada jurado y el promedio.
- Los **7 seleccionados** resaltados.
- Explica **quién queda fuera del ranking y por qué**: su audición no quedó
  REALIZADA, o tiene menos de **2 tarjetas de jurado válidas**.
- El ranking completo **no se publica**: es interno.

### Empates
El desempate automático va en este orden: **Performance → Talento → Identidad**.
Si aun así hay empate en el corte del Top 7, aparece **"Requiere comité"**. El
sistema **no inventa un ganador**.

Entonces el comité delibera y la dirección registra la decisión en el mismo
dashboard → **Acta del comité (empate en el corte)**:
1. **Orden decidido:** los códigos empatados, de mejor a peor, separados por coma
   (el sistema los precarga).
2. **Acta:** quiénes deliberaron y por qué se decidió así.
3. **Registrar decisión del comité**.

Si las notas cambian después y el empate ya es otro, esa acta **deja de
aplicarse sola** y hay que deliberar de nuevo.

---

## 17. Respaldos

Panel → **Respaldo y sistema → Respaldos**.

| Botón | Qué hace |
|---|---|
| **Respaldo completo** (con etiqueta) | Crea en Drive un `.xlsx` (legible, con las agrupaciones plegables) y un `.json` (el que sirve para restaurar) |
| **Solo exportar XLSX** | Solo la copia legible |
| **Respaldar audios** | Copia las pistas a la carpeta de respaldos |

Etiquetas: **Manual**, **Pre-evento**, **Agenda**, **Post-evento**,
**Resultados**. Además hay un respaldo **automático cada noche** (etiqueta
DIARIO).

**Hazlo:**
- Después de emitir códigos → *Agenda*.
- El día antes del evento → *Pre-evento*, y descarga el XLSX a un computador o
  USB: es la copia offline.
- Al cerrar la jornada → *Post-evento*.
- Al tener el Top 7 → *Resultados*.

> Los respaldos tienen **datos personales y los enlaces de acceso del equipo**.
> No compartas la carpeta de respaldos.

Restaurar un respaldo: [MANUAL-RECUPERACION.md](MANUAL-RECUPERACION.md).

---

## 18. Si algo sale mal

| Problema | Qué hacer |
|---|---|
| "El sistema está ocupado" | Dos personas guardaron a la vez. Espera 5 s y repite. |
| Un enlace de acceso no abre | Venció (45 días), lo reemplazaron o el usuario está inactivo. `admin` → *Accesos del equipo* → *Crear acceso* con el mismo alias y rol. |
| Los enlaces generados terminan en `/dev` | CONFIG `web_app_url` vacía o mal. Ver sección 1.1. |
| El check-in no encuentra a alguien | ¿Tiene código emitido? Si no, no está en la lista. Búscalo en el panel por documento. |
| Los números no cuadran | **Refrescar vistas**, en Respaldo y sistema. |
| El jurado no puede calificar a alguien | Falta marcarlo **REALIZADA** en el check-in. |
| La pista no está o falla | Se usa la USB del participante. |
| Se perdieron o dañaron datos | [MANUAL-RECUPERACION.md](MANUAL-RECUPERACION.md) |
| No sabes qué pasó | Base maestra → hoja `_LOG`: todo lo que pasó, con quién y cuándo. |

**Incidentes:** cualquier cosa rara se anota en la hoja **INCIDENTES**. Los
cambios forzados se registran ahí automáticamente.
