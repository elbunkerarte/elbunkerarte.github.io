# Manual de operación — EL BÚNKER

Para el coordinador y el equipo. **No hace falta saber programar ni tocar código.**
Todo se hace desde dos sitios: el **panel** (un enlace que te dieron) y la **base
maestra** (una hoja de cálculo de Google, que es tu "Excel").

---

## 0. Tus dos herramientas

| | Qué es | Para qué |
|---|---|---|
| **Panel** | Un enlace personal que abre en el navegador | Hacer cosas: emitir códigos, aprobar cambios, check-in, calificar |
| **Base maestra** | Una hoja de cálculo de Google | Ver y corregir datos a mano, exportar |

> Tu enlace es **personal**. No lo compartas: cada rol ve cosas distintas y todo
> queda registrado con tu nombre.

**Regla de oro:** la hoja **REGISTRO** es la verdad. Las hojas AGENDA, CHECK-IN,
RESULTADOS y DASHBOARD se **regeneran solas** desde ella — si editas ahí, tu
cambio se pierde en la siguiente actualización. Corrige siempre en REGISTRO.

---

## 1. ANTES de publicar la convocatoria (obligatorio)

Abre la base maestra → pestaña **CONFIG**. Cambia cada valor que diga
`PENDIENTE DE COMPLETAR` por el dato real aprobado:

| clave | qué poner |
|---|---|
| `legal_name` | Razón social del responsable |
| `nit` | NIT |
| `legal_address` | Domicilio |
| `data_protection_email` | Correo para derechos de datos |
| `institutional_phone` | Teléfono institucional |
| `evento_sede` / `evento_direccion` | Sede, **solo cuando esté confirmada** |
| `terms_url` / `privacy_policy_url` | Enlaces a los textos publicados |
| `consent_version` | Cambiar a `v1` cuando los textos sean definitivos |

Haz lo mismo en el archivo `site/config.json` del sitio público (o pídeselo a
quien administre el repositorio). Mientras estén pendientes, el sitio los muestra
**en amarillo** para que nadie los publique por error.

> ⚠️ El sistema **nunca inventa** un dato legal. Si no lo llenas, sale el aviso.

---

## 2. Mientras llegan inscripciones

Panel → pestaña **Inscritos**.

- Arriba ves los contadores: inscritos, únicos, aptos, duplicados, revisión.
- El buscador acepta **nombre, código o documento**.
- El filtro te deja ver solo un estado.

### Qué significa cada estado

| Estado | Qué pasó | Qué haces |
|---|---|---|
| **APTO** | Cumple todo | Nada. Recibirá código. |
| **REVISIÓN** | Algo hay que mirar (video raro, correo o teléfono repetido) | Revisa la columna *Motivo* y decide |
| **INCOMPLETO** | Faltan datos | Contacta a la persona o corrige en REGISTRO |
| **NO CUMPLE** | Fuera de edad o fuera de Sabaneta | Nada. No recibe cupo. |
| **DUPLICADO** | Ya existe otra inscripción con **el mismo documento** | Nada. Se conserva la primera. |

> Correo o teléfono repetidos **no** son duplicado: hermanos y parejas comparten
> número. Por eso quedan en REVISIÓN, para que lo mires tú.

### Corregir un dato de alguien
Ve a la base maestra → **REGISTRO** → busca la fila → corrige la celda.
Después, en el panel, **Cerrar los 100 → Revalidar inscripciones**.

### Cambiar un estado a mano
En la última columna de la tabla hay un desplegable *Cambiar a…*.
Te pedirá un motivo, que **queda registrado con tu nombre**.

---

## 3. Cerrar los 100 y emitir códigos

Panel → pestaña **Cerrar los 100**.

1. **Revalidar inscripciones** — vuelve a aplicar todas las reglas. Hazlo siempre
   antes del paso 2.
2. Revisa los contadores: ¿los aptos son los que esperas?
3. **Emitir códigos y asignar bloques** — reparte B-001…B-100 en orden de
   inscripción y le pone a cada quien su bloque, hora de llegada y hora de audición.

**Lo que tienes que saber:**
- Solo reciben código los **APTO** no duplicados.
- Puedes pulsarlo **varias veces sin miedo**: nunca reasigna ni repite un código.
- Si alguien queda descalificado después, **su código no se reutiliza**. Ese cupo
  se pierde a propósito, para que el código B-047 signifique siempre la misma
  persona.
- Si hay más de 100 aptos, los que sobran quedan **sin cupo** y te lo dice.

Luego revisa **Ocupación por bloque** para ver cómo quedó repartido.

---

## 4. Avisar a la gente

Panel → pestaña **Comunicación**.

1. Elige la plantilla (la 2, *Asignación de código y horario*, es la importante).
2. **Generar textos** → sale una tabla con el mensaje exacto de cada persona.
3. Para WhatsApp: botón **Abrir chat** en cada fila. Se abre el chat con el texto
   ya escrito; tú pulsas enviar.
4. Para correo: **Enviar por correo** los manda automáticamente.

> **Cuota de correo:** una cuenta de Gmail normal envía ~100 correos al día. Con
> 100 participantes vas justo. El panel te dice cuánta cuota queda. Si se acaba,
> continúa al día siguiente o usa WhatsApp, que es el canal principal del plan.

> El sistema **nunca envía WhatsApp solo**. Prepara el texto; el envío lo hace
> una persona.

---

## 5. Cambios de horario

Panel → pestaña **Cambios de horario**.

Cada solicitud muestra el código, el motivo y el horario actual.

- **Aprobar**: elige el bloque destino (solo salen los que tienen cupo libre) y
  pulsa Aprobar. El sistema cambia hora y bloque — **el código NO cambia**.
- **Rechazar**: pide el motivo. La persona conserva su horario original.

Reglas que el sistema ya aplica solo:
- Una sola solicitud por participante.
- Solo de quien declaró que **no puede** asistir.
- Solo antes del cierre (`cierre_cambios` en CONFIG).
- No deja meter a nadie en un bloque lleno.

Cuando resuelvas, avísale a la persona con la plantilla 3 o 4 de Comunicación.

**El día del evento se cierra esto:** CONFIG → `cambios_abiertos` = `NO`.

---

## 6. El día del evento — mesa de check-in

Abre tu enlace de **check-in** en la tablet o el celular.

> **Lo primero, al llegar y con buena señal: abre la página.** Descarga la lista
> completa al dispositivo. A partir de ahí **funciona sin internet**.

### Atender a alguien
1. Escribe su **código** (B-014) o su **documento** y pulsa Buscar.
2. **Compara la foto del documento físico con la persona.** El sistema te muestra
   el documento registrado — pero la verificación la haces tú.
3. Pulsa el botón que corresponda:

| Botón | Cuándo |
|---|---|
| **Confirmar CHECK-IN** | Llegó y está verificado |
| **Audición REALIZADA** | Ya se presentó (esto es lo que lo habilita para el jurado) |
| **Pasar a CONTINGENCIA** | Llegó con más de 5 minutos de retraso |
| **Marcar NO SHOW** | No apareció en su turno |

### La regla de los 5 minutos
El sistema calcula solo el retraso y te avisa:
- **Hasta 5 min:** aviso naranja. Conserva el turno **solo si no altera el flujo** —
  esa decisión es del coordinador, no del sistema.
- **Más de 5 min:** aviso rojo. Pierde el turno y pasa a contingencia.
  **Nunca se desplaza a quien llegó puntual.**

### Si se cae el internet
Aparece una barra roja abajo. **Sigue trabajando normal.** Todo se guarda en el
dispositivo y se sincroniza solo cuando vuelva la señal. La pestaña *Pendientes de
sincronizar* te dice cuántas operaciones faltan. **No cierres el navegador** con
operaciones pendientes.

### Contingencia (9:00–9:30 p. m.)
Pestaña **Contingencia** → *Calcular plan ahora*. Te dice, con el tiempo que
queda de verdad, **cuántos alcanzan** y en qué orden. Los que no alcancen quedan
NO AUDICIONADOS — no es una decisión arbitraria, es el tiempo disponible.

### 9:30 p. m. — cierre
Panel de administración → **Respaldo y herramientas** → **Cerrar jornada**.
Todo el que no audicionó queda NO AUDICIONADO y **fuera de la selección**.
Pide confirmación porque no se deshace.

---

## 7. El jurado

Cada jurado abre **su propio enlace**. Ve solo código, nombre artístico y
disciplina: ni documento, ni contacto, ni las notas de los otros.

1. Pulsa **Calificar** en un participante.
2. Pon de 1 a 10 en los 8 factores. El total sobre 100 se calcula solo.
3. Escribe observaciones si quieres.
4. **Guardar calificación**.

- No se puede guardar incompleto: faltan factores → botón bloqueado.
- Solo aparecen quienes ya hicieron check-in.
- Corregir una nota se puede, y **queda registrado**.

---

## 8. Resultados

Panel de dirección → **Dashboard** → *Calcular resultados*.

- Ranking con las tres notas y el promedio.
- Los **7 seleccionados** resaltados.
- Si aparece **"Empate en el corte"**, el desempate automático (Performance →
  Talento → Identidad) no resolvió y hace falta **deliberación documentada del
  comité**. El sistema no inventa un ganador.

Quien no audicionó **no aparece** en el ranking. Es correcto: el plan dice que no
entra a la selección.

---

## 9. Respaldos

Panel → **Respaldo y herramientas** → **Respaldo completo**.
Genera un `.xlsx` y un `.json` en una carpeta de Drive.

**Hazlo:**
- El día antes del evento.
- Al terminar la jornada.

Además se genera uno automático cada noche.

Para llevar la copia offline que pide el plan: **Exportar XLSX** y descarga el
archivo a un computador o USB.

---

## 10. Si algo sale mal

| Problema | Qué hacer |
|---|---|
| "El sistema está ocupado" | Dos personas guardaron a la vez. Espera 5 s y repite. |
| Un enlace de acceso no abre | Caducó (45 días) o el usuario está inactivo. Admin → *Accesos del equipo* → crear de nuevo. |
| El check-in no encuentra a alguien | ¿Tiene código emitido? Si no, no está en la lista. Búscalo en el panel por documento. |
| Los números no cuadran | **Refrescar vistas**, en Respaldo y herramientas. |
| Alguien audicionó pero no le aparece al jurado | Falta marcarlo **REALIZADA** en el check-in. |
| Se perdieron datos | Base maestra → hoja `_LOG`: ahí está todo lo que pasó, con quién y cuándo. Y están los respaldos en Drive. |

**Incidentes:** cualquier cosa rara se anota en la hoja **INCIDENTES**. Los
cambios forzados se registran ahí automáticamente.
