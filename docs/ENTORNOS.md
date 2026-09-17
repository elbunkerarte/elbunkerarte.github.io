# Entornos: PRUEBAS y PRODUCCIÓN

Son **dos proyectos de Apps Script distintos, con dos hojas de cálculo distintas.
No comparten ni una fila.** Puedes romper lo que quieras en pruebas sin que
producción se entere.

| | PRODUCCIÓN | PRUEBAS |
|---|---|---|
| Para qué | La convocatoria real | Ensayar, enseñar al equipo, romper cosas |
| Datos | Inscripciones reales | 130 personas ficticias, desechables |
| Hoja de cálculo | La suya | Otra, independiente |
| `ENTORNO` | `PRODUCCION` | `PRUEBAS` |
| Aviso en pantalla | ninguno | banner naranja en **todas** las pantallas |
| `ENSAYO` (cargar 130 falsos) | 🚫 **bloqueado** | ✅ permitido |
| `LIMPIAR` (vaciar todo) | 🚫 **bloqueado** | ✅ permitido |

## Por qué el bloqueo es código y no una advertencia

`ENSAYO` mete 130 personas inventadas y `LIMPIAR` vacía las hojas. Si alguien
ejecuta cualquiera de las dos sobre la convocatoria real un día antes del evento,
el daño es total y no hay "deshacer".

Una nota en un manual no lo impide: la gente no lee el manual cuando tiene prisa.
Por eso las dos funciones llaman a `exigirEntornoPruebas()`, que **corta la
ejecución** con un error explícito si el proyecto no está marcado como PRUEBAS:

```
BLOQUEADO: "ENSAYO" solo puede correr en el entorno de PRUEBAS.
Este proyecto es PRODUCCION y contiene (o contendra) inscripciones reales.
```

Y el valor por defecto es `PRODUCCION`: **olvidarse de configurar algo nunca
convierte producción en un sitio donde se pueden borrar datos.** Un entorno solo
es de pruebas si alguien lo declaró a propósito.

## Cómo distinguirlos de un vistazo

Las dos URL se parecen muchísimo (`script.google.com/macros/s/AKfycb…`), así que
la única defensa práctica es visual: en PRUEBAS, **todas** las pantallas pintan
arriba una franja naranja a rayas:

> ⚠ ENTORNO DE **PRUEBAS** — los datos son ficticios y se pueden borrar.
> Esto NO es la convocatoria real.

Y el título de la pestaña del navegador empieza por `[PRUEBAS]`.

## Flujo de trabajo recomendado

```
1. Cambias algo en el código
        ↓
2. npm test                          ← si falla, no sigue
        ↓
3. node tools/empaquetar.js
        ↓
4. Lo pegas en PRUEBAS y lo pruebas de verdad
        ↓
5. Solo cuando funciona, lo pegas en PRODUCCIÓN
```

Para ensayar la jornada completa sin tocar nada real:
en PRUEBAS, ejecuta **`ENSAYO`** — carga 130 inscripciones, emite los 100
códigos, simula check-ins, tardanzas, no-shows y contingencia, califica con tres
jurados y produce el Top 7. Después, **`LIMPIAR`** lo deja vacío otra vez.

## Cómo crear el entorno de pruebas

1. https://script.google.com/home/projects/create
2. Nómbralo **EL BUNKER - PRUEBAS** (que se note en el título).
3. Pega `build/Codigo.gs` en `Código.gs` → Ctrl+S.
4. En el desplegable de funciones elige **`INSTALAR_PRUEBAS`** — ⚠️ **no
   `INSTALAR`**, que lo dejaría marcado como producción — y pulsa Ejecutar.
5. Autoriza (es un proyecto nuevo, pide permisos otra vez).
6. Implementar → Nueva implementación → Aplicación web → *Ejecutar como: Yo* ·
   *Quién tiene acceso: Cualquier usuario*.

Te queda una URL distinta, una hoja de cálculo distinta, y el banner naranja en
todas las pantallas.

## Convertir un entorno de uno a otro

Apps Script → **Configuración del proyecto → Propiedades del script** →
propiedad `ENTORNO`:

- `PRUEBAS` → permite ENSAYO y LIMPIAR, muestra el banner
- cualquier otro valor (o ausente) → PRODUCCIÓN

> Nunca pongas `PRUEBAS` en el proyecto real. Es justo lo que desactiva las
> protecciones que impiden borrar la convocatoria.
