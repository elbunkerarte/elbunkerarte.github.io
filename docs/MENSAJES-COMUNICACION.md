# Mensajes de comunicación — para aprobación

Las 7 plantillas que genera el sistema. Se envían por **correo** (automático) o
por **WhatsApp** (el sistema abre el chat con el texto escrito; **envía una
persona**).

Viven en `apps-script/32_comunicacion.gs`. Los `{{campos}}` se rellenan solos con
los datos de cada participante, y los valores entre ⟨⟩ salen de la hoja CONFIG.

> **Nunca se automatiza WhatsApp.** El brief lo prohíbe fuera de una API
> autorizada, y el plan recomienda **lista de difusión**, no un grupo general.
> Recuerda que para que una lista de difusión llegue, el contacto debe tener
> guardado el número emisor.

---

## 1. RECEPCIÓN DE INSCRIPCIÓN
**Asunto:** EL BÚNKER - recibimos tu inscripción

```
Hola {{full_name}},

Recibimos tu inscripción a EL BÚNKER.

Estamos validando los datos de todas las personas inscritas. Si quedas dentro
de los 100 cupos, te enviaremos tu CODIGO y tu HORARIO.

Ten presente que inscribirte no garantiza selección, contratación ni presentación.

Si tienes dudas sobre tus datos personales escribe a ⟨data_protection_email⟩.

- Equipo EL BÚNKER
```

## 2. ASIGNACIÓN DE CÓDIGO Y HORARIO ← *la importante*
**Asunto:** EL BÚNKER - tu código {{code}} y tu horario

```
Hola {{full_name}},

Quedaste dentro de los participantes de EL BÚNKER.

CODIGO: {{code}}
FECHA: 2026-10-02
HORA DE LLEGADA: {{arrival_time}}
HORA DE AUDICION: {{final_time}}
BLOQUE: {{final_block}}
LUGAR: ⟨evento_sede⟩

IMPORTANTE:
- Llega a la hora de llegada indicada, no a la hora de audición.
- Trae tu documento de identidad físico: sin él no hay check-in.
- Tu audición dura máximo 3 minutos.
- Tolerancia de 5 minutos. Si llegas más tarde pierdes tu turno y pasas a
  contingencia (audicionas solo si queda tiempo disponible).

Tu código NO cambia nunca. Si tienes un impedimento real para asistir en tu
horario, tienes UNA sola solicitud de cambio aquí: {{url_cambio}}
No respondas este mensaje para cambiar el horario: solo cuentan las solicitudes
por ese enlace.

- Equipo EL BÚNKER
```

> La última frase existe a propósito: el plan advierte que *"WhatsApp comunica; no
> debe convertirse en una agenda paralela"*.

## 3. CAMBIO APROBADO
**Asunto:** EL BÚNKER - cambio APROBADO, tu nuevo horario

```
Hola {{full_name}},

Tu solicitud de cambio fue APROBADA.

CODIGO: {{code}} (no cambia)
NUEVA HORA DE LLEGADA: {{arrival_time}}
NUEVA HORA DE AUDICION: {{final_time}}
NUEVO BLOQUE: {{final_block}}

Este es tu horario definitivo. El día del evento no hay más cambios.

- Equipo EL BÚNKER
```

## 4. CAMBIO NO APROBADO
**Asunto:** EL BÚNKER - tu solicitud de cambio no fue aprobada

```
Hola {{full_name}},

Revisamos tu solicitud de cambio y NO fue aprobada por disponibilidad de la agenda.

Tu horario sigue siendo:
CODIGO: {{code}}
HORA DE LLEGADA: {{arrival_time}}
HORA DE AUDICION: {{final_time}}

Si no puedes asistir, tu cupo quedará como no audicionado. Gracias por avisarnos.

- Equipo EL BÚNKER
```

## 5. RECORDATORIO 24 H ANTES
**Asunto:** EL BÚNKER - mañana es tu audición ({{code}})

```
Hola {{full_name}},

Mañana 2026-10-02 es tu audición en EL BÚNKER.

CODIGO: {{code}}
LLEGADA: {{arrival_time}} | AUDICION: {{final_time}}
LUGAR: ⟨evento_sede⟩

Lleva tu documento físico. Prepara 3 minutos exactos.
Recuerda la tolerancia de 5 minutos.

- Equipo EL BÚNKER
```

## 6. RECORDATORIO DEL DÍA
**Asunto:** EL BÚNKER - hoy es tu audición ({{code}})

```
{{full_name}}, hoy es tu audición.

CODIGO {{code}} | LLEGADA {{arrival_time}} | AUDICION {{final_time}}
LUGAR: ⟨evento_sede⟩

Documento físico obligatorio. Tolerancia 5 min.

- Equipo EL BÚNKER
```

## 7. CONTINGENCIA / NO SHOW
**Asunto:** EL BÚNKER - tu turno pasó a contingencia

```
Hola {{full_name}},

Tu turno ({{code}}, {{final_time}}) pasó a CONTINGENCIA.

La contingencia funciona entre 21:00 y 21:30, y solo alcanza para quienes quepan
en el tiempo disponible, en orden de llegada a la lista.

Acércate al punto de check-in y espera el llamado. A las 21:30 se cierran
definitivamente las audiciones.

- Equipo EL BÚNKER
```

---

## Cuándo se envía cada una

| Momento | Plantilla | Canal sugerido |
|---|---|---|
| Al recibir la inscripción | 1 | correo |
| Tras emitir los códigos (25-27 sep) | **2** | **WhatsApp** + correo |
| Al resolver un cambio | 3 o 4 | WhatsApp |
| 1 de octubre | 5 | WhatsApp |
| 2 de octubre, mañana | 6 | WhatsApp |
| Durante el evento, si pierde el turno | 7 | WhatsApp |

## Límite que hay que tener presente

Una cuenta Gmail normal envía **~100 correos al día**. Con 100 participantes, la
plantilla 2 agota la cuota de una sola tanda. El panel muestra la cuota restante
y se detiene limpiamente en vez de fallar a medias.

**Recomendación:** WhatsApp como canal principal (es lo que dice el plan), correo
como respaldo, repartido en dos días si hace falta.
