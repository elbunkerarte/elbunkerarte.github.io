# Textos de los formularios — para aprobación

Lo que ve el participante, palabra por palabra, para que gerencia y legal lo
aprueben antes de abrir. Si se cambia algo aquí, hay que cambiarlo también en
`apps-script/ui_inscripcion.html` / `ui_cambio.html` **y subir `consent_version`**.

---

## FORMULARIO 1 — Inscripción

**Encabezado:** EL BÚNKER · by Arte es la Solución
**Chips de contexto:** fecha · jornada · edad · residencia · duración · cupos · seleccionados
**Nota inicial:** *Todos los campos marcados con \* son obligatorios. Diligénciala una
sola vez: si te inscribes dos veces con el mismo documento conservamos la primera.*

### Bloque 1 · Identidad y contacto

| Campo | Etiqueta | Ayuda | Obligatorio |
|---|---|---|---|
| `full_name` | Nombre completo | *Nombres y apellidos como aparecen en tu documento* | Sí |
| `id_number` | Número de documento | *Lo verificaremos con tu documento físico el día de la audición.* | Sí |
| `birth_date` | Fecha de nacimiento | *Debes tener entre 18 y 28 años cumplidos el 2026-10-02.* | Sí |
| `neighborhood_sector` | Barrio, sector o vereda | *Ej.: La Doctora, Betania, San Joaquín…* | Sí |
| `resides_in_sabaneta` | ☐ Declaro que **resido en Sabaneta, Antioquia**. | — | Sí |
| `email` | Correo electrónico | — | Sí |
| `whatsapp` | WhatsApp | *10 dígitos, empieza por 3. Por aquí enviaremos tu código y tu horario.* | Sí |

### Bloque 2 · Tu propuesta artística
*Esto es lo que verá el jurado antes de tu audición.*

| Campo | Etiqueta | Ayuda | Obligatorio |
|---|---|---|---|
| `artistic_name` | Nombre artístico | *Si no tienes, déjalo vacío* | No |
| `discipline` | Disciplina | lista de 12 opciones + *Otra* | Sí |
| `genre_or_proposal` | Género o propuesta | *Ej.: R&B, trap, salsa choke, teatro físico…* | No |
| `artist_description` | Cuéntanos de ti | *Tu trayectoria, dónde te has presentado, qué te mueve.* | No |
| `audition_description` | ¿Qué vas a presentar en 3 minutos? | *La audición dura máximo 3 minutos. Se cronometra.* | Sí |
| `video_url` | Enlace a un video tuyo | *Opcional pero recomendado. Verifica que el enlace sea público antes de enviarlo.* | No |
| `technical_needs` | Necesidades técnicas | *Ej.: micrófono, pista en USB, espacio para 4 personas* | No |

> **Disciplinas:** Canto · Rap/Hip hop · Música instrumental · DJ/producción ·
> Danza urbana · Danza contemporánea · Danza folclórica · Teatro ·
> Poesía/spoken word · Circo · Artes visuales en vivo · Otra

### Bloque 3 · Disponibilidad
*No hay forma de elegir horario. La organización lo asigna y te lo comunica.*

> ☐ **Declaro que tengo disponibilidad para asistir el viernes 2 de octubre de 2026
> dentro de la jornada de audiciones de 4:00 p. m. a 10:00 p. m. y acepto el horario
> que posteriormente sea asignado por la organización.** \*

*(Texto recomendado en el plan maestro, reproducido literalmente.)*

### Bloque 4 · Autorizaciones
*Lee los documentos antes de marcar. Guardamos la versión exacta del texto que aceptaste.*

**Antes de las casillas se muestran los enlaces a Términos y a Política de datos.**
Si aún no están publicados, sale *(PENDIENTE DE PUBLICAR)* en amarillo.

| | Texto | Obligatoria |
|---|---|---|
| ☐ | He leído y acepto los **términos y condiciones** de EL BÚNKER. | **Sí** |
| ☐ | Autorizo el **tratamiento de mis datos personales** para las finalidades informadas en la política de tratamiento de datos. | **Sí** |
| ☐ | Autorizo recibir **comunicaciones operativas por WhatsApp** sobre mi inscripción, horario, cambios y novedades. | No |
| ☐ | Autorizo la captación y uso de mi **imagen, voz y registros audiovisuales** para las finalidades informadas. | No |

> ⚠️ *Inscribirte **no garantiza** selección, contratación ni presentación.*

**Botón:** `Enviar mi inscripción`

### Respuestas al enviar

| Veredicto | Mensaje |
|---|---|
| APTO | *Recibimos tu inscripción. Si quedas dentro de los 100 cupos te enviaremos tu código y tu horario.* |
| DUPLICADO | *Ya tenemos una inscripción registrada con este documento. Conservamos la primera; no necesitas volver a inscribirte.* |
| NO CUMPLE (edad) | *La convocatoria es para personas de 18 a 28 años cumplidos al 2026-10-02. Edad calculada: N.* |
| NO CUMPLE (residencia) | *La convocatoria es exclusiva para residentes en Sabaneta, Antioquia.* |
| INCOMPLETO | *Faltan datos obligatorios. Revisa los campos marcados y vuelve a enviar.* (único caso que permite reenviar) |
| REVISIÓN | *Recibimos tu inscripción y quedó en revisión. Te contactaremos si necesitamos verificar algo.* |

Siempre se entrega un **número de comprobante** (`submission_id`).

---

## FORMULARIO 2 — Cambio de horario

**Aviso, antes de todo lo demás:**

> **Antes de continuar, lee esto.** Este formulario es **solo** para quien tiene un
> impedimento real y **no puede asistir** en su horario. Tienes **una sola**
> solicitud. **No eliges la nueva hora**: la asigna producción según disponibilidad.
> Mientras no te confirmen, tu horario original sigue vigente.

| Campo | Etiqueta | Ayuda |
|---|---|---|
| `participant_code` | Tu código \* | *Es el código que recibiste por WhatsApp o correo. Nunca cambia.* |
| `full_name` | Nombre completo \* | *Debe coincidir exactamente con el nombre registrado para ese código.* |
| `contact` | WhatsApp de contacto \* | — |
| `can_attend_original` | ☐ Confirmo que **NO puedo asistir** en el horario que me fue asignado. \* | — |
| `reason_short` | Motivo (breve) \* | *Ej.: trabajo hasta las 8:00 p. m., cita médica, clase…* |
| `acceptance` | ☐ Entiendo que producción asigna la nueva hora **según disponibilidad**, que la solicitud puede ser **no aprobada**, y que el día del evento **no hay cambios**. \* | — |

**Al enviar:** *Registramos tu solicitud. Producción te confirmará por WhatsApp o
correo si es APROBADA o NO APROBADA. Mientras tanto tu horario original sigue vigente.*
Se entrega un número de solicitud.

**Rechazos posibles:** código no encontrado · el nombre no coincide · ya solicitó
antes · declaró que sí puede asistir · fuera de plazo.
