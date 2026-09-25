# Manual de recuperación — EL BÚNKER

Qué hacer cuando algo falla. Está escrito para la coordinación y para quien
tiene la cuenta `admin`. Algunos pasos se hacen en el **editor de Apps Script**,
que solo abre la cuenta de Google dueña del proyecto; cuando es así, se dice.

> **Tres reglas antes de arreglar cualquier cosa**
> 1. **Primero un respaldo.** Panel → *Respaldo y sistema* → etiqueta *Manual* →
>    **Respaldo completo**. Así, si el arreglo sale mal, puedes volver.
> 2. **Nada se borra en silencio.** No borres filas a mano. Si algo hay que
>    quitar, se hace con las funciones de este manual, que dejan respaldo y
>    registro.
> 3. **Anota lo que pasó** en la hoja **INCIDENTES**: qué, cuándo, quién y qué
>    se hizo.

---

## 1. Dónde mirar

| Dónde | Qué encuentras |
|---|---|
| Hoja **`_LOG`** | Todo lo que pasó: fecha y hora, quién (`actor`), con qué rol, qué acción y sobre qué. No guarda datos personales. |
| Hoja **`INCIDENTES`** | Los cambios forzados (automáticos) y lo que anote el equipo. |
| Carpeta de Drive **EL BUNKER - Respaldos** | Los respaldos: `RESPALDO-<ETIQUETA>-<fecha>.xlsx` y `.json`. También los automáticos (`DIARIO`), el que se hace antes de migrar (`PRE-MIGRACION`) y el que se hace antes de quitar inscripciones (`ANTES-DE-QUITAR`). |
| Panel `admin` → **Estado del sistema → Revisar** | Si el entorno, la hoja, el esquema, la `web_app_url` y los datos de prueba están bien. |
| Editor de Apps Script → función **`VERIFICAR`** | El mismo informe, en el registro de ejecución. |

> En el entorno de PRUEBAS las carpetas llevan delante `[PRUEBAS]`.

> Los respaldos tienen **datos personales y los enlaces de acceso del equipo**.
> La carpeta no se comparte.

---

## 2. Restaurar desde un respaldo

**Cuándo:** se dañaron o se borraron datos y hay que volver a como estaban en un
momento anterior.

### Qué hace y qué no hace
- **Reemplaza** el contenido de estas hojas por el del respaldo: `REGISTRO`,
  `_INTEGRANTES`, `JURADO_1`, `JURADO_2`, `JURADO_3`, `INCIDENTES`, `_CAMBIOS` y
  `_DELIBERACIONES`. Después reconstruye todas las vistas.
- **No toca** `CONFIG`, `_USUARIOS` (los enlaces del equipo siguen sirviendo),
  `_LOG` ni los archivos de Drive (pistas y firmas quedan como están).
- **Todo lo que se hizo después del respaldo se pierde** en esas hojas. Probado
  en vivo: una inscripción hecha después del respaldo desapareció al restaurar;
  los estados, las pistas y los tipos de dato quedaron intactos.
- **No deja mezclar entornos:** un respaldo de PRUEBAS no se puede restaurar en
  PRODUCCIÓN, ni al revés.

### Paso a paso
1. **Respaldo del estado actual** (etiqueta *Manual*), aunque esté dañado. Es tu
   camino de vuelta.
2. En Drive, carpeta **EL BUNKER - Respaldos**, elige el respaldo **`.json`**
   (no el `.xlsx`) más reciente de **antes** del problema.
3. Ábrelo y copia su **ID**: es la parte de la dirección que va entre `/d/` y
   `/view` (por ejemplo, en `https://drive.google.com/file/d/ABC123…/view` el ID
   es `ABC123…`).
4. Base maestra → **CONFIG**:
   - `restaurar_desde` = el ID del archivo `.json`
   - `restaurar_confirmacion` = `SI-RESTAURAR` (exacto, en mayúsculas)
5. **Editor de Apps Script** (cuenta dueña) → en el desplegable de funciones
   elige **`RESTAURAR`** → **Ejecutar**.
6. En el registro de ejecución debe salir `Restaurado:` con la fecha del
   respaldo y cuántas filas se restauraron por hoja.
7. **Vuelve a dejar vacías** `restaurar_desde` y `restaurar_confirmacion` en
   CONFIG.
8. Panel `admin` → **Estado del sistema → Revisar**, y revisa en el panel que los
   datos son los esperados.
9. Mira en **`_LOG`** qué se hizo entre la hora del respaldo y el problema: eso
   es lo que hay que rehacer a mano (por ejemplo, un cambio de horario aprobado
   o un check-in). Si alguien se inscribió en ese tiempo, su inscripción ya no
   está: coordinación decide cómo contactarle.
10. Anota la restauración en **INCIDENTES**.

### Si sale un error
| Mensaje | Qué pasa |
|---|---|
| *Escribe en CONFIG > restaurar_desde el ID…* | Falta el ID en CONFIG |
| *Para restaurar llama restaurarDesdeJson(…, "SI-RESTAURAR")…* | Falta o está mal escrita la palabra `SI-RESTAURAR` |
| *El archivo no parece un respaldo válido de EL BUNKER* | Ese ID no es un `.json` de respaldo (¿copiaste el del `.xlsx`?) |
| *BLOQUEADO: el respaldo es del entorno…* | El respaldo es del otro entorno. Busca uno de este |

---

## 3. Un enlace del equipo se perdió, venció o se filtró

Cada enlace es personal, vence a los **45 días** de emitido y deja de servir en
cuanto se emite uno nuevo para la misma cuenta. Cuando un enlace no abre, la
pantalla dice por qué:

| Dice | Qué pasó |
|---|---|
| *Tu enlace caducó* | Pasaron los 45 días |
| *Coordinación te generó un enlace nuevo; este ya no sirve* | Se emitió otro para esa cuenta |
| *Tu acceso fue desactivado* | En `_USUARIOS` la cuenta tiene `activo` = `NO` |
| *El enlace está incompleto* / *está dañado* | Se copió mal: cópialo completo |
| *El enlace no es válido para este sistema* | Es de otro entorno (por ejemplo, un enlace de PRUEBAS abierto en producción) |
| *Tu rol no tiene acceso a esta página* | Esa cuenta no puede abrir esa pantalla |

### Se perdió (nadie más lo tiene)
- **Editor de Apps Script** (cuenta dueña) → función **`verAccesos`** →
  Ejecutar. Muestra los enlaces **vigentes** de todas las cuentas y su fecha de
  vencimiento, **sin cambiar nada**. Entrega a la persona solo el suyo, por un
  canal privado.

### Se filtró o venció uno
- Panel `admin` → **Respaldo y sistema → Accesos del equipo** → escribe el
  **mismo alias** (por ejemplo `checkin-2`) y elige el **mismo rol** → **Crear
  acceso**. Sale el enlace nuevo; el viejo deja de funcionar en ese momento.
- Usa exactamente el mismo alias y el mismo rol: con otro rol, la cuenta cambia
  de permisos. Para un alias nuevo de jurado, escribe en la nota `jurado 1`,
  `jurado 2` o `jurado 3`.
- Para bloquear una cuenta sin darle enlace nuevo: hoja `_USUARIOS` → columna
  `activo` = `NO`.

### Se filtraron varios, o no sabes cuáles
- **Editor de Apps Script** → función **`crearAccesosOperativos`**. ⚠️ **Revoca
  los 10 enlaces a la vez** y emite unos nuevos para todas las cuentas. Después
  hay que entregar su enlace nuevo a **cada** persona. No la uses para un solo
  enlace.

> `INSTALAR` y `MIGRAR` **no** cambian los enlaces que ya existen: solo crean los
> de las cuentas que falten.

> Antes del evento, revisa con `verAccesos` que ningún enlace venza antes del 23
> de octubre ni antes de terminar la calificación. Si alguno vence antes, crea
> uno nuevo para esa cuenta.

---

## 4. Los enlaces salen mal (`web_app_url`)

**Síntomas:** los enlaces que genera el sistema (paneles, enlace de integrantes,
Mi inscripción, cambio de horario, mensajes) terminan en **`/dev`**, solo los
abre el dueño de la cuenta, o llevan a otro entorno.

**Causa:** CONFIG → `web_app_url` está vacía, mal escrita o es la de otra
implementación. El sistema solo la usa si tiene exactamente la forma
`https://script.google.com/macros/s/…/exec`; si no, usa la dirección que le da
Google en ese momento, y los enlaces generados desde el editor (como los de
`verAccesos`) salen con `/dev`.

**Arreglo:**
1. Editor de Apps Script → **Implementar → Gestionar implementaciones** → copia
   la URL de la aplicación web, la que termina en `/exec`.
2. CONFIG → `web_app_url` = esa URL, sin espacios.
3. Panel `admin` → **Estado del sistema → Revisar**: `web_app_url_ok` debe salir
   bien.
4. Los enlaces del equipo **no hace falta revocarlos**: `verAccesos` los vuelve a
   mostrar ya con la dirección correcta.
5. Los mensajes que ya se enviaron con un enlace malo hay que **generarlos y
   enviarlos otra vez** desde *Comunicación*.

> En producción, `web_app_url` debe ser la URL de producción. Nunca la de
> PRUEBAS.

---

## 5. Check-in sin internet

El check-in está hecho para esto: cada acción queda guardada en el dispositivo y
se envía sola cuando vuelve la señal (pestaña **Pendientes de sincronizar**).

| Situación | Qué hacer |
|---|---|
| Se cayó la señal a mitad de jornada | Seguir trabajando. Al volver, se sincroniza solo; *Sincronizar ahora* lo fuerza |
| El dispositivo nunca abrió la página con señal | No tiene la lista: sale vacía o dice "Sin datos locales". Conéctalo un momento (hotspot) para que la descargue |
| Hay operaciones pendientes y hay que cambiar de dispositivo | No cambies hasta que sincronice: la cola vive **solo en ese dispositivo** |
| Sale *"operaciones rechazadas por el servidor"* | Otra mesa cambió antes a esa persona, o el cambio no es válido. Coordinación revisa y corrige (sección 7) |
| El dispositivo se apagó o se dañó con operaciones pendientes | Si vuelve a encender, abre la página con señal y se envían. Si no, esas operaciones se perdieron: rehazlas desde otro dispositivo y anótalo en INCIDENTES |

No borres los datos del navegador ni uses modo incógnito en el check-in.

---

## 6. Una pista no llegó o no suena

1. **La USB del participante** es el respaldo. Siempre.
2. Si la mandó por WhatsApp: panel → **Pistas → Subir una pista recibida por
   WhatsApp** (código, canción, archivo → *Subir y renombrar*).
3. Si el archivo está pero falla: panel → **Pistas** → *Cambiar…* → **PISTA CON
   PROBLEMA**, con una nota.
4. Si el técnico no puede abrir el archivo de Drive: los archivos no se
   comparten automáticamente. Por eso la carpeta de audio se **descarga antes del
   evento** a su computador.
5. Una pista reemplazada nunca se borra: queda en la carpeta del código como
   `…_REEMPLAZADA_<fecha>`.

---

## 7. Un dato de una inscripción está mal

**Siempre se corrige en REGISTRO** (o en `_INTEGRANTES` si el dato es de un
integrante). Nunca en AGENDA, CHECK-IN, AGRUPACIONES, PISTAS, RESULTADOS ni
DASHBOARD: esas se regeneran y tu cambio se pierde.

1. Respaldo *Manual*.
2. Base maestra → **REGISTRO** → busca la fila (por comprobante, código o
   documento) → corrige la celda.
3. Añade en la columna `notes` qué cambiaste, cuándo y por qué.
4. Si cambiaste algo que afecta la elegibilidad (documento, fecha de nacimiento,
   residencia, correo, teléfono): panel → **Cerrar los 100 → Revalidar
   inscripciones**.
5. Panel → **Respaldo y sistema → Refrescar vistas**.

**Cuidado:**
- Documento, teléfono, fecha de nacimiento, horas, código y nombre artístico
  están en **texto plano** para que Sheets no los convierta (`0012` en `12`,
  `15:00` en una hora). Si al escribir se convierte, mira
  [SCHEMA.md](SCHEMA.md#columnas-en-texto-plano-y-por-qué).
- **No cambies a mano el código** (`code`): un código no se reasigna nunca.
- **No cambies a mano el bloque ni la hora**: usa el flujo de *Cambios de
  horario*, que comprueba el cupo del bloque.
- Un estado de asistencia marcado por error se corrige en `attendance_status` y
  `audition_status`, y se anota en **INCIDENTES**.

---

## 8. Hay datos de prueba en producción

Producción **rechaza** inscripciones con correo terminado en `.test`, y `ENSAYO` y
`LIMPIAR` **no corren** en producción (el sistema lo bloquea). Aun así, si hay
filas de prueba:

**Cómo saberlo:** panel `admin` → **Estado del sistema → Revisar** → *datos de
prueba*. Cuenta inscripciones con correo `.test`, origen de ensayo o nombre
artístico que empieza por `PRUEBA-`.

### Las dos inscripciones de prueba conocidas
La organización confirmó que **S-07BE9C53** y **S-E780AA04** son pruebas hechas
en producción antes del lanzamiento. Se quitan con:

- **Editor de Apps Script** → función **`QUITAR_PRUEBAS_PRELANZAMIENTO`** →
  Ejecutar.
- Quita **exactamente esas dos** inscripciones (con sus integrantes y
  solicitudes de cambio, si tuvieran), después de hacer un respaldo
  (`RESPALDO-ANTES-DE-QUITAR-…`) y deja registro en `_LOG`.
- Se puede ejecutar otra vez sin riesgo: si ya no están, no hace nada.

### Cualquier otra fila
`QUITAR_PRUEBAS_PRELANZAMIENTO` **no** sirve para otras filas. Para quitar otras
inscripciones hace falta el **equipo técnico**, con la lista exacta de
comprobantes confirmada por la organización. **No borres filas a mano**: se
pierde la trazabilidad y no queda respaldo.

---

## 9. Otros problemas

| Problema | Qué hacer |
|---|---|
| "El sistema está ocupado" | Dos personas guardaron a la vez. Espera unos segundos y repite |
| Los números del panel no cuadran con la hoja | Panel → *Refrescar vistas* |
| El jurado no puede guardar una nota | La audición no está en REALIZADA: márcala en check-in |
| Un jurado ve *"No se pudo determinar la hoja"* | En `_USUARIOS`, la `nota` de su cuenta debe decir `jurado 1`, `jurado 2` o `jurado 3` |
| El acta del comité "no corresponde al empate actual" | Las notas cambiaron y el empate es otro: el comité delibera de nuevo y se registra otra acta |
| `SPREADSHEET_ID no configurado` o *Falta la hoja…* | El proyecto no está instalado o migrado: avisar al equipo técnico |
| *BLOQUEADO: esta hoja de cálculo está marcada como…* | Se intentó mezclar PRUEBAS y PRODUCCIÓN. No insistas: avisar al equipo técnico |

Si nada de esto aplica: mira **`_LOG`** a la hora del problema, anota en
**INCIDENTES** y avisa al equipo técnico con lo que viste.
