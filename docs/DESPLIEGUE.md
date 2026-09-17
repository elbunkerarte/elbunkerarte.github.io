# Despliegue

El sistema **ya está desplegado y funcionando**. Este documento sirve para
reinstalarlo desde cero, migrarlo a otra cuenta o publicar un cambio de código.

## Estado actual

| Pieza | Dónde |
|---|---|
| Cuenta Google | `miguelgamer77721@gmail.com` (authuser 3) |
| Cuenta GitHub | `miguelgamer77721-ui` |
| Repositorio | `miguelgamer77721-ui/el-bunker` (público) |
| Sitio público | https://miguelgamer77721-ui.github.io/el-bunker/ |
| Proyecto Apps Script | `1dFhW2Q7ah6I2-25P-oa6E1mmrIBQVgkuZ5iWp_yrl1hxKQM2iNkpAPrn` |
| Base maestra | `1beDG22ANdqRTQIMvjw9KMA7Dc_UyNyD-304_Fz29sLg` |
| Enlaces de acceso | `~/.bunker-secrets/ACCESOS-EL-BUNKER.txt` (**fuera del repositorio**) |

---

## A. Publicar un cambio de código

1. Edita lo que toque en `apps-script/`.
2. `npm test` — si falla, no se despliega.
3. `node tools/empaquetar.js` → regenera `build/Codigo.gs`.
4. Commit y push.
5. Abre el editor de Apps Script → pega el contenido de `build/Codigo.gs` en
   `Código.gs` (reemplaza todo) → **Ctrl+S**.
6. **Implementar → Gestionar implementaciones → editar (lápiz) → Versión: Nueva
   → Implementar.**

> El paso 6 es obligatorio: sin una versión nueva, la URL pública sigue sirviendo
> el código viejo aunque lo hayas guardado.

## B. Publicar un cambio del sitio público

Edita `site/` y haz push. El workflow de GitHub Actions corre las pruebas y
publica solo si pasan. Tarda ~1 minuto.

---

## C. Instalación desde cero

### 1. Preparar la cuenta de Google
- Entra a https://script.google.com/home/usersettings
- **API de Google Apps Script → Activado**

### 2. Crear el proyecto
- https://script.google.com/home/projects/create
- Ponle nombre: *EL BÚNKER - Sistema de convocatoria*

### 3. Cargar el código
- `node tools/empaquetar.js`
- Copia **todo** `build/Codigo.gs` y pégalo en `Código.gs` (reemplaza el contenido).
- **Ctrl+S**.

### 4. Instalar
- En el desplegable de funciones aparece **`INSTALAR`** (es la primera del archivo,
  se preselecciona sola). Pulsa **Ejecutar**.
- Autoriza cuando lo pida: *Revisar permisos* → elige la cuenta → *Configuración
  avanzada* → *Ir a EL BÚNKER (no seguro)* → **desplázate hasta abajo** (los
  botones están deshabilitados hasta que lo haces) → *Seleccionar todo* →
  *Continuar*.
- El registro de ejecución imprime la URL de la base maestra y los 8 enlaces de
  acceso. **Guárdalos fuera del repositorio.**

`INSTALAR` es idempotente: se puede correr las veces que haga falta.

### 5. Desplegar la aplicación web
- **Implementar → Nueva implementación**
- Tipo: ⚙️ → **Aplicación web**
- Descripción: `v1 - convocatoria 2 de octubre`
- **Ejecutar como: Yo**
- **Quién tiene acceso: Cualquier usuario** ← si dejas *Solo yo*, nadie puede inscribirse
- **Implementar** → copia la URL `/exec`

### 6. Volver a emitir los enlaces
Los enlaces del paso 4 salen con `null` porque la aplicación aún no existía.
Ejecuta ahora la función **`verAccesos`** y usa los que imprime.

### 7. Conectar el sitio público
En `site/config.json`:
```json
"enlaces": {
  "inscripcion":    "<URL>/exec?p=inscripcion",
  "cambio_horario": "<URL>/exec?p=cambio-horario"
}
```
Push → GitHub Actions publica.

### 8. Completar lo legal
Base maestra → **CONFIG** → reemplaza cada `PENDIENTE DE COMPLETAR`.
Lo mismo en `site/config.json`.

---

## D. Permisos que concede la instalación

| Permiso | Para qué |
|---|---|
| Drive (ver, crear, modificar, eliminar) | Crear la base maestra y guardar respaldos |
| Hojas de cálculo | Leer y escribir los datos |
| Conectarse a un servicio externo | Exportar el XLSX |
| Enviar correo en tu nombre | Las plantillas de comunicación |
| Ejecutarse cuando no estás | Respaldo automático nocturno |
| Mostrar contenido web externo | Servir las pantallas |

**Revocar:** https://myaccount.google.com/permissions → *EL BÚNKER* → Quitar acceso.

---

## E. Ensayo integral

Para el ensayo del cronograma, ejecuta la función **`ENSAYO`** en el editor.
Carga 130 inscripciones ficticias, emite los 100 códigos, simula la jornada
(check-ins, tardanzas, no-shows, contingencia, cierre), califica con tres jurados
y produce el Top 7.

**Limpiar después:**
```js
borrarDatosDePrueba("SI-BORRAR")
```
Borra REGISTRO, jurados, incidentes, cambios y bitácora. **Conserva CONFIG y los
usuarios.** Pide la cadena exacta para que no ocurra por accidente.

> Hazlo en una copia o **antes** de abrir inscripciones reales.

---

## F. Restaurar un respaldo

Los respaldos están en Drive → carpeta *EL BUNKER - Respaldos*, en `.xlsx`
(legible) y `.json` (restaurable).

En el editor:
```js
restaurarDesdeJson("<id del archivo .json en Drive>")
```

---

## G. Migrar a otra cuenta de Google

1. Repite C.1 a C.6 con la cuenta nueva.
2. Exporta la base vieja (panel → *Respaldo completo*).
3. `restaurarDesdeJson("<id>")` en la nueva.
4. Actualiza `site/config.json` con la URL nueva y haz push.
5. Reemite los enlaces del equipo (`crearAccesosOperativos`).

---

## H. Problemas conocidos

| Síntoma | Causa | Solución |
|---|---|---|
| El código nuevo no se ve en la URL pública | No creaste versión nueva | Implementar → Gestionar → editar → Versión: Nueva |
| `SPREADSHEET_ID no configurado` | No corriste `INSTALAR` | Ejecútalo |
| Los enlaces salen con `null` | La app no estaba desplegada al emitirlos | Ejecuta `verAccesos` |
| "El sistema está ocupado" | Dos escrituras simultáneas (es el candado haciendo su trabajo) | Reintentar |
| Un enlace de acceso deja de funcionar | Caducó a los 45 días, o `activo=NO` en `_USUARIOS` | Reemitir |
| El jurado ve *"No se pudo determinar la hoja"* | Su `nota` en `_USUARIOS` no dice `jurado 1/2/3` | Corregir esa celda |
