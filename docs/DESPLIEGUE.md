# Despliegue

Cómo publicar una versión nueva del código, publicar el sitio, pasar la
iteración 2 a producción, instalar desde cero o migrar a otra cuenta.

> **Producción no se toca sin el GO del responsable técnico.** Todo cambio se prueba antes en el
> entorno de PRUEBAS ([ENTORNOS.md](ENTORNOS.md)).

## Estado actual (25 de septiembre de 2026)

| Pieza | Dónde |
|---|---|
| Cuenta Google | `miguelgamer77721@gmail.com` |
| Cuenta GitHub | `miguelgamer77721-ui` |
| Repositorio | `miguelgamer77721-ui/el-bunker` (público) |
| Sitio público | https://miguelgamer77721-ui.github.io/el-bunker/ (se publica desde la rama `feat/sistema-bunker`) |
| Proyecto Apps Script (producción) | `1dFhW2Q7ah6I2-25P-oa6E1mmrIBQVgkuZ5iWp_yrl1hxKQM2iNkpAPrn` |
| Implementación de producción | `AKfycbzKtLSLUeXi5QnTjNa1yVZawOBSCRzMFwCwTw9hoal7K8fWMgnfli9Mk6RU76YkcNkW` — hoy en su versión 4, que es la iteración 1 |
| Base maestra (producción) | `1beDG22ANdqRTQIMvjw9KMA7Dc_UyNyD-304_Fz29sLg` |
| Iteración 2 | Rama `feat/iteracion-2`, probada en el entorno de PRUEBAS; **pendiente de publicar en producción** |
| Enlaces de acceso del equipo | Nunca en el repositorio. Se consultan en el editor con `verAccesos` |

---

## A. Publicar un cambio de código (sin clasp)

1. Edita lo que toque en `apps-script/`.
2. `npm test` — si falla, no se despliega.
3. `node tools/empaquetar.js` → genera **`build/Codigo.gs`**: un solo archivo con
   todo el código y todas las pantallas.
4. Abre el editor de Apps Script del entorno → selecciona **todo** el contenido
   de `Código.gs` → reemplázalo por el de `build/Codigo.gs` → **Guardar**.
5. **Implementar → Gestionar implementaciones → lápiz (Editar) → Versión:
   "Versión nueva" → escribe una descripción → Implementar.**

> El paso 5 es obligatorio: sin una versión nueva, la URL pública sigue sirviendo
> el código viejo aunque lo hayas guardado. Y se hace **editando la
> implementación existente**, no creando una nueva: así la URL `/exec` **no
> cambia** y los enlaces ya repartidos siguen sirviendo.

> El empaquetador también genera `build/appsscript.json` (el manifiesto con los
> permisos). Solo hace falta tocarlo en el editor si cambian los permisos.

Orden: primero en **PRUEBAS**; en **PRODUCCIÓN** solo con el GO del responsable técnico.

## B. Publicar un cambio del sitio público

Los datos públicos (fecha, lugar, datos legales, enlaces) están en
**`site/config.json`**. Al publicar, `tools/construir-sitio.js` los pone en las
páginas; un dato vacío no se publica.

Se publica al hacer push de `site/` a la rama `feat/sistema-bunker` (o `main`).
El workflow de GitHub Actions corre `npm test` y solo publica si pasan.

---

## C. Publicar la iteración 2 en PRODUCCIÓN

**Lo decide el responsable técnico. Nada de esto se ejecuta sin su GO.** Orden exacto:

1. **Respaldo completo de producción** (panel → etiqueta *Pre-evento* o *Manual*)
   y **descargar el XLSX** a un computador.
2. **Pegar el código nuevo** (`build/Codigo.gs`) en el proyecto de producción y
   guardar (sección A, pasos 3 y 4).
3. Ejecutar **`QUITAR_PRUEBAS_PRELANZAMIENTO`** → quita exactamente las
   inscripciones S-07BE9C53 y S-E780AA04 (pruebas confirmadas por la
   organización), con respaldo previo y registro en `_LOG`. Se puede repetir sin
   riesgo.
4. Ejecutar **`MIGRAR`** (sección D). Revisa su informe: "Datos intactos: SI".
5. CONFIG → **`web_app_url`** = la URL `/exec` de producción.
6. **Versión nueva** de la implementación existente (sección A, paso 5).
7. **`VERIFICAR`** en el editor, o panel `admin` → *Estado del sistema →
   Revisar*: todo en verde ("Sistema consistente").
8. **`verAccesos`** → enlaces de las cuentas nuevas (`stage-manager`,
   `tecnico-audio`); entregarlos por un canal privado.
9. **Publicar el sitio:** fusionar `feat/iteracion-2` en `feat/sistema-bunker`
   (GitHub Pages publica desde esa rama: página, términos, política).
10. **Prueba de humo sin crear datos**, desde un celular:
    - La página pública y el Formulario 1 cargan, con la fecha y la hora
      correctas y sin avisos de dato pendiente.
    - "Mi inscripción" con un documento que no existe → debe decir *"No
      encontramos tu inscripción"*.
    - El panel `admin` abre y *Revisar* sale en verde.

    Producción rechaza correos `.test`: **no se hacen inscripciones de prueba en
    producción**.

---

## D. Qué hace `MIGRAR`

Actualiza una base que ya existe (producción) a esta versión. **Solo añade**:

- Hace primero un **respaldo crudo** (`RESPALDO-PRE-MIGRACION-…`, XLSX + JSON).
- Marca la hoja con su entorno (si no lo estaba).
- Crea las hojas nuevas y añade las columnas nuevas **al final** de las
  existentes; ningún dato se mueve.
- Pone en **texto plano** las columnas que lo necesitan (documentos, teléfonos,
  fechas de nacimiento, horas, códigos; ver [SCHEMA.md](SCHEMA.md)),
  convirtiendo lo que ya estaba sin perder fechas.
- Actualiza CONFIG a los valores vigentes (23 de octubre, 15:00, edad máxima 30,
  cierres, datos legales, versiones) **solo** en las claves que aún tienen el
  valor por defecto de la iteración 1, vacío o "PENDIENTE". Lo que alguien
  escribió a propósito se conserva y sale en el informe como *conflicto*.
- Añade las claves nuevas de CONFIG (entre ellas `web_app_url`,
  `whatsapp_grupo_enlace`, `restaurar_desde`, `restaurar_confirmacion`).
- Instala los disparadores: respaldo diario (23:00), refresco de vistas cada 6 h
  y verificación de videos cada hora.
- Crea las cuentas que falten (`stage-manager`, `tecnico-audio`). **Los enlaces
  que ya existen no cambian.**
- Compara el número de filas antes y después. Si cambió, **se detiene con un
  error** que nombra el respaldo previo.

El informe sale en el registro de ejecución: entorno, filas, respaldo previo,
hojas y columnas agregadas, CONFIG actualizada, agregada y en conflicto, y cuentas
nuevas.

---

## E. Funciones del editor

Se eligen en el desplegable de funciones del editor de Apps Script y se ejecutan
con **Ejecutar**. Ninguna recibe datos por pantalla: lo que necesitan lo leen de
CONFIG.

| Función | Qué hace | Dónde |
|---|---|---|
| `INSTALAR` | Instalación nueva de producción. Se puede repetir; no reemite enlaces existentes | Proyecto nuevo |
| `INSTALAR_PRUEBAS` | Convierte ESTE proyecto en entorno de pruebas y lo instala | Proyecto nuevo y vacío |
| `MIGRAR` | Actualiza una base existente a esta versión (sección D) | Producción |
| `VERIFICAR` | Informe de salud (lo mismo que *Revisar* en el panel) | Cualquiera |
| `verAccesos` | Muestra los enlaces vigentes y su vencimiento, sin cambiarlos | Cualquiera |
| `crearAccesosOperativos` | ⚠️ **Revoca** los 10 enlaces y emite nuevos. Solo si se filtraron | Cualquiera |
| `RESTAURAR` | Restaura un respaldo JSON ([MANUAL-RECUPERACION.md](MANUAL-RECUPERACION.md)) | Cualquiera |
| `QUITAR_PRUEBAS_PRELANZAMIENTO` | Quita las dos inscripciones de prueba conocidas de producción | Producción |
| `ENSAYO` | Ensayo completo con datos ficticios | **Solo PRUEBAS** |
| `LIMPIAR` | Vacía los datos operativos | **Solo PRUEBAS** |

---

## F. Instalación desde cero

### 1. Preparar la cuenta de Google
- https://script.google.com/home/usersettings → **API de Google Apps Script →
  Activado**.

### 2. Crear el proyecto
- https://script.google.com/home/projects/create
- Nombre: *EL BÚNKER - Sistema de convocatoria*.

### 3. Cargar el código
- `node tools/empaquetar.js`
- Copia **todo** `build/Codigo.gs` en `Código.gs` (reemplaza el contenido) →
  **Guardar**.

### 4. Instalar
- En el desplegable de funciones aparece **`INSTALAR`** (es la primera del
  archivo). Pulsa **Ejecutar**.
- Autoriza cuando lo pida: *Revisar permisos* → elige la cuenta → *Configuración
  avanzada* → *Ir a EL BÚNKER (no seguro)* → **desplázate hasta abajo** (los
  botones están deshabilitados hasta que lo haces) → *Seleccionar todo* →
  *Continuar*.
- Crea la base maestra, las 18 hojas, CONFIG, los disparadores y las 10 cuentas.
  El registro de ejecución imprime la URL de la base maestra.

### 5. Desplegar la aplicación web
- **Implementar → Nueva implementación** → tipo ⚙️ **Aplicación web**.
- **Ejecutar como: Yo**.
- **Quién tiene acceso: Cualquier usuario** ← si dejas *Solo yo*, nadie puede
  inscribirse.
- **Implementar** → copia la URL `/exec`.

### 6. Conectar la URL
- CONFIG → **`web_app_url`** = la URL `/exec`.
- Ejecuta **`verAccesos`** y reparte los enlaces por un canal privado (los que
  imprimió el paso 4 no sirven: la aplicación aún no existía).

### 7. Conectar el sitio público
En `site/config.json`, sección `enlaces`, pon la URL `/exec` con
`?p=inscripcion`, `?p=mi-inscripcion`, `?p=integrantes` y `?p=cambio-horario`.
Push → GitHub Actions publica.

### 8. Revisar
Panel `admin` → *Estado del sistema → Revisar*: "Sistema consistente".

---

## G. Permisos que concede la instalación

| Permiso | Para qué |
|---|---|
| Hojas de cálculo | Leer y escribir los datos |
| Drive | Crear la base maestra y guardar respaldos, pistas y firmas |
| Enviar correo en tu nombre | El correo de recepción y las plantillas de comunicación |
| Conectarse a un servicio externo | Exportar el XLSX y comprobar los enlaces de video |
| Ejecutarse cuando no estás | Respaldo diario, refresco de vistas, verificación de videos |

**Revocar:** https://myaccount.google.com/permissions → *EL BÚNKER* → Quitar
acceso.

---

## H. Migrar a otra cuenta de Google

1. En la cuenta vieja: panel → **Respaldo completo**.
2. En la cuenta nueva: sección F completa (instalar, desplegar, `web_app_url`).
3. Copia el `.json` del respaldo al Drive de la cuenta nueva → `RESTAURAR`
   ([MANUAL-RECUPERACION.md](MANUAL-RECUPERACION.md)).
4. Actualiza `site/config.json` con la URL nueva y publica el sitio.
5. Reparte los enlaces nuevos del equipo (`verAccesos`): los de la cuenta vieja
   no abren en la nueva.

> Las pistas y las firmas viven en el Drive de la cuenta vieja: el respaldo JSON
> no las mueve. Moverlas requiere al equipo técnico.

---

## I. Problemas conocidos

| Síntoma | Causa | Solución |
|---|---|---|
| El código nuevo no se ve en la URL pública | No se creó versión nueva | Implementar → Gestionar → lápiz → Versión nueva |
| La URL `/exec` cambió y los enlaces repartidos dejaron de servir | Se hizo "Nueva implementación" en vez de editar la existente | Volver a usar la implementación original; actualizar `web_app_url` y `site/config.json` si hace falta |
| Los enlaces salen con `/dev` o con `null` | CONFIG `web_app_url` vacía o mal, o la app no estaba desplegada | Poner la URL `/exec` en `web_app_url` y ejecutar `verAccesos` |
| `SPREADSHEET_ID no configurado` | No se corrió `INSTALAR` | Ejecutarlo |
| `BLOQUEADO: esta hoja de cálculo está marcada como…` | Se intentó instalar un entorno sobre la hoja del otro | Revisar `ENVIRONMENT` en las propiedades del script |
| `MIGRAR` termina con *"cambió el número de filas"* | Algo escribió filas durante la migración | No seguir; revisar el respaldo `PRE-MIGRACION` con el equipo técnico |
| "El sistema está ocupado" | Dos escrituras simultáneas (es el candado haciendo su trabajo) | Reintentar |
| Un enlace de acceso deja de funcionar | Venció a los 45 días, se reemplazó o `activo` = `NO` en `_USUARIOS` | Ver [MANUAL-RECUPERACION.md](MANUAL-RECUPERACION.md), sección 3 |
| El jurado ve *"No se pudo determinar la hoja"* | Su `nota` en `_USUARIOS` no dice `jurado 1/2/3` | Corregir esa celda |
