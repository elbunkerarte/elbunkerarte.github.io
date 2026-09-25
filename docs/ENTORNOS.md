# Entornos: PRUEBAS y PRODUCCIÓN

Son **dos proyectos de Apps Script distintos, con dos hojas de cálculo distintas
y sus propias carpetas de Drive. No comparten ni una fila.** Puedes romper lo que
quieras en pruebas sin que producción se entere.

| | PRODUCCIÓN | PRUEBAS |
|---|---|---|
| Para qué | La convocatoria real | Ensayar, enseñar al equipo, probar una versión nueva antes de publicarla |
| Datos | Inscripciones reales | Personas ficticias, desechables |
| Hoja de cálculo | *EL BUNKER - BASE MAESTRA* | *[PRUEBAS] EL BUNKER - BASE MAESTRA* |
| Carpetas de Drive (respaldos, audio, firmas) | *EL BUNKER - …* | *[PRUEBAS] EL BUNKER - …* |
| Propiedad del script `ENVIRONMENT` | `production` (o ausente) | `test` |
| Marca interna de la hoja | producción | test |
| Aviso en pantalla | ninguno | franja a rayas amarillas y negras en **todas** las pantallas |
| Correos `.test` (datos de prueba) | 🚫 **rechazados** | ✅ aceptados |
| `ENSAYO` (cargar datos ficticios) | 🚫 **bloqueado** | ✅ permitido |
| `LIMPIAR` (vaciar los datos) | 🚫 **bloqueado** | ✅ permitido |
| Enlaces del equipo | Los suyos | Otros, distintos: un enlace de un entorno no abre en el otro |

La URL `/exec` de cada entorno está en su propia hoja CONFIG → `web_app_url`, y en
*Implementar → Gestionar implementaciones* de cada proyecto. La de producción es
la que usa el sitio público (`site/config.json`).

## Por qué el bloqueo es código y no una advertencia

`ENSAYO` mete 130 personas inventadas y `LIMPIAR` vacía las hojas y manda a la
papelera las pistas y firmas. Si alguien ejecuta cualquiera de las dos sobre la
convocatoria real un día antes del evento, el daño es total.

Una nota en un manual no lo impide: la gente no lee el manual cuando tiene prisa.
Por eso las dos funciones **cortan la ejecución** con un error si el entorno no
es PRUEBAS:

```
BLOQUEADO: "ENSAYO" solo puede correr en el entorno de PRUEBAS.
Proyecto: ENVIRONMENT=production · hoja de calculo: production.
Produccion contiene (o contendra) inscripciones reales y nunca recibe datos de prueba.
```

El candado tiene **dos llaves**, y las dos tienen que decir "test":

1. La propiedad del script **`ENVIRONMENT`** (*Configuración del proyecto →
   Propiedades del script*).
2. Una **marca guardada dentro de la hoja de cálculo**, invisible para los
   operadores. Se pone una sola vez al instalar y **nunca se cambia**: una base
   de producción no se puede convertir en base de pruebas corriendo el instalador
   equivocado, ni al revés.

El valor por defecto es producción: **olvidarse de configurar algo nunca
convierte producción en un sitio donde se pueden borrar datos.** Un entorno solo
es de pruebas si alguien lo declaró a propósito.

> Los proyectos instalados en la iteración 1 usaban la propiedad `ENTORNO` =
> `PRUEBAS`. El sistema la sigue respetando.

Otras protecciones entre entornos:
- **Restaurar** un respaldo de un entorno en el otro está bloqueado.
- Producción **rechaza inscripciones con correo `.test`** (el dominio reservado
  que usan los datos de prueba), así que ahí no se hacen inscripciones de prueba.
- *Estado del sistema → Revisar* dice en qué entorno estás, qué marca tiene la
  hoja y cuántos datos de prueba hay (en producción deben ser 0).

## Cómo distinguirlos de un vistazo

Las dos URL se parecen muchísimo (`script.google.com/macros/s/AKfycb…/exec`), así
que la defensa práctica es visual: en PRUEBAS, **todas** las pantallas pintan
arriba una franja a rayas amarillas y negras:

> [PRUEBAS] · ENTORNO DE **PRUEBAS** — los datos son ficticios y se pueden
> borrar. Esto NO es la convocatoria real.

Y el título de la pestaña del navegador empieza por `[PRUEBAS]`.

## Flujo de trabajo recomendado

```
1. Cambias algo en el código
        ↓
2. npm test                            ← si falla, no sigue
        ↓
3. node tools/empaquetar.js            → build/Codigo.gs
        ↓
4. Lo pegas en PRUEBAS, "Versión nueva" de la implementación, y lo pruebas de verdad
        ↓
5. Solo con el GO del responsable técnico, se publica en PRODUCCIÓN
   (orden exacto en DESPLIEGUE.md, sección C)
```

## Ensayar en PRUEBAS

- **`ENSAYO`** (en el editor del proyecto de PRUEBAS): ensayo completo en 13
  fases — 130 inscripciones, integrantes, una agrupación repetida, revalidación,
  códigos, pistas, videos, cambios de horario, la jornada, tres jurados, cierre,
  resultados y respaldo. Si Apps Script corta por tiempo, **se reanuda solo**.
- **`LIMPIAR`**: borra los datos operativos (inscripciones, integrantes,
  calificaciones, incidentes, cambios, bitácora) y manda a la papelera las
  carpetas de pistas y firmas de prueba. **Conserva CONFIG, los usuarios y los
  respaldos.**

Las dos funciones fallan a propósito en producción.

## Cómo crear un entorno de pruebas nuevo

1. https://script.google.com/home/projects/create — un proyecto **nuevo y vacío**.
2. Nómbralo **EL BUNKER - PRUEBAS** (que se note en el título).
3. `node tools/empaquetar.js` → pega `build/Codigo.gs` en `Código.gs` → Guardar.
4. En el desplegable de funciones elige **`INSTALAR_PRUEBAS`** — ⚠️ **no
   `INSTALAR`**, que lo dejaría como producción — y pulsa Ejecutar.
5. Autoriza (es un proyecto nuevo, pide permisos otra vez).
6. **Implementar → Nueva implementación → Aplicación web** → *Ejecutar como: Yo*
   · *Quién tiene acceso: Cualquier usuario*.
7. Copia la URL `/exec` en su CONFIG → `web_app_url`.
8. Ejecuta **`verAccesos`** para ver los enlaces del equipo de PRUEBAS.

Te queda una URL distinta, una hoja distinta, sus propias carpetas y la franja de
PRUEBAS en todas las pantallas.

> Nunca pongas `ENVIRONMENT` = `test` en el proyecto real. Aunque la marca de la
> hoja lo sigue protegiendo, es desactivar a propósito una de las dos llaves.
