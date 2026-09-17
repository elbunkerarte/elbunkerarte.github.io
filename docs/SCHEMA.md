# Esquema de datos

La base es una hoja de cálculo de Google con 14 pestañas. **REGISTRO es la única
fuente de verdad**; cuatro hojas son vistas que se regeneran desde ella.

| Hoja | Tipo | Quién escribe |
|---|---|---|
| `REGISTRO` | **fuente de verdad** | el formulario y el panel |
| `AGENDA` | vista (se regenera) | el sistema |
| `CHECK-IN` | vista (se regenera) | el sistema |
| `JURADO_1/2/3` | fuente | cada jurado, desde su panel |
| `RESULTADOS` | vista (se regenera) | el sistema |
| `DASHBOARD` | vista (se regenera) | el sistema |
| `INCIDENTES` | fuente | operadores |
| `CONFIG` | fuente | **el coordinador, a mano** |
| `_CAMBIOS` | fuente | Formulario 2 y el panel |
| `_USUARIOS` | fuente | el sistema (`crearAccesosOperativos`) |
| `_LOG` | bitácora | el sistema |
| `_IDEMPOTENCIA` | control | el sistema |

> Editar a mano una hoja marcada *vista* no sirve: se sobrescribe. Corrige en
> REGISTRO.

## REGISTRO

Una fila por inscripción — **incluidos los duplicados y los no aptos**, que se
conservan marcados para mantener trazabilidad.

### Identificación y origen
`submission_id` · `code` · `created_at` · `source`

### Datos de la persona
`full_name` · `id_number` · `birth_date` · `age` · `neighborhood_sector` ·
`residence` · `email` · `whatsapp`

### Propuesta artística
`artistic_name` · `discipline` · `genre_or_proposal` · `artist_description` ·
`audition_description` · `video_url` · `technical_needs`

### Normalizados (para comparar, nunca para mostrar)
`normalized_id_number` · `normalized_email` · `normalized_phone`

> El documento se normaliza quitando puntos y ceros a la izquierda; el teléfono
> se queda con los últimos 10 dígitos (así `+57 300…` y `300…` colisionan).

### Validación
`eligibility_status` (`APTO` · `INCOMPLETO` · `NO_CUMPLE` · `REVISION` ·
`DUPLICADO`) · `duplicate_flag` · `duplicate_reason` · `registro_principal` ·
`validation_notes`

### Consentimientos
`consent_terms` · `consent_data` · `consent_whatsapp` · `consent_image` ·
`consent_version` · `availability_statement`

> `consent_version` guarda **qué texto exacto** aceptó la persona. Es lo que
> permite demostrar después qué estaba publicado cuando aceptó.

### Agenda
`original_block` · `original_time` · `arrival_time` · `final_block` ·
`final_time` · `change_requested` · `change_status` · `changed_at` ·
`changed_by` · `issued_at` · `issued_by`

### Jornada
`check_in_time` · `attendance_status` · `audition_status` ·
`contingencia_desde` · `operador_check_in` · `notes`

## Estados de asistencia

```
CONFIRMADO ──► CHECK-IN ──► REALIZADA
     │             │
     ├──► NO SHOW ─┴──► CONTINGENCIA ──► NO AUDICIONADO
     │
     └──► INCIDENTE (desde y hacia cualquiera, siempre registrado)
```

Las transiciones no listadas se **rechazan**. Un supervisor puede forzarlas, y
entonces se escribe sola una fila en `INCIDENTES`. Esto es lo que impide, por
ejemplo, calificar a alguien que nunca hizo check-in.

## JURADO_1 / JURADO_2 / JURADO_3

`code` · `artistic_name` · `discipline` · los 8 factores (`talento`,
`performance`, `identidad`, `repertorio`, `profesionalismo`, `presencia`,
`digital`, `proyecto`) · `total` · `valido` · `observaciones` · `evaluado_at` ·
`evaluado_by`

Cada factor va de 1 a 10. `total = Σ (nota / 10) × peso`, sobre 100.
Una tarjeta incompleta es **inválida**, no un puntaje bajo: se excluye del
promedio en vez de contar como cero.

## CONFIG

Pares `clave` / `valor` / `descripcion`. Es el único sitio donde se cambian
fechas, cupos, edades, plazos y **todos los datos legales**, sin tocar código.

Interruptores útiles: `inscripciones_abiertas`, `cambios_abiertos` (`SI`/`NO`).

## Idempotencia

`_IDEMPOTENCIA` guarda la clave de cada operación ya procesada y su resultado.
Un reenvío del formulario, un doble toque o un webhook repetido devuelven la
**misma respuesta** sin escribir una segunda fila.
