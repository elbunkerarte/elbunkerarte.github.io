# Decisión de arquitectura

**Fecha:** 17 de septiembre de 2026 · **Estado:** decidido e implementado

## La pregunta

¿GitHub Pages? ¿Google Drive como base de datos? ¿Google Forms + scripts?
¿Otra cosa? Restricción dura: **todo gratis**, y el evento es el **2 de octubre**
(quedan 15 días; según el cronograma del plan, los formularios deben existir
entre el 19 y el 21 de septiembre).

## Los requisitos que realmente deciden

No todos los requisitos discriminan. Estos cinco sí, y descartan opciones solos:

1. **Validación del lado del servidor** (edad, residencia, duplicados), secretos
   fuera del navegador, permisos por rol y bitácora de cambios.
2. **"Un operador no técnico debe poder [hacerlo todo] sin editar la base por SQL
   ni modificar código."** La base necesita una interfaz humana nativa.
3. **Exportación XLSX con 10 hojas** exactas.
4. **Asignación atómica de códigos + webhooks idempotentes.** Se necesita un
   candado real: si dos personas envían el formulario en el mismo segundo, no
   puede haber dos B-047.
5. **Debe funcionar el día del evento con internet malo.** El plan mismo pide
   "hotspot + copia offline".

## Las opciones, contra esos requisitos

| Opción | Validación servidor | Base = UI del operador | Gratis de verdad | Veredicto |
|---|---|---|---|---|
| **GitHub Pages solo** | ❌ imposible (es estático) | ❌ | ✅ | **Descartada.** No puede escribir nada ni guardar un secreto. |
| **GitHub Pages + Drive como BD** | ❌ exigiría credenciales de Drive en el navegador | ❌ Drive es almacén de archivos: sin consultas, sin escritura concurrente segura | ✅ | **Descartada.** Publicar credenciales en el cliente es inaceptable. |
| **GitHub Pages + backend gratuito** (Supabase / Vercel / Render) | ✅ | ❌ el operador acabaría en una consola técnica | ⚠️ capas gratuitas que caducan, duermen o piden tarjeta | **Descartada.** Más piezas, más riesgo, y no resuelve el requisito 2. |
| **Google Forms + Sheets + Apps Script** | ⚠️ solo *después* de enviar | ✅ | ✅ | **Parcial.** Forms no calcula edad desde la fecha de nacimiento, no detecta duplicados al enviar y no puede sellar la versión del texto legal aceptado. Además no da UI de check-in, jurado ni dashboard: habría que escribirlas igual. |
| **✅ Apps Script Web App + Google Sheets + GitHub Pages** | ✅ | ✅ | ✅ | **ELEGIDA.** |

## Lo elegido

```
   PÚBLICO                        APLICACIÓN                    DATOS
┌──────────────┐          ┌──────────────────────┐      ┌──────────────────┐
│ GitHub Pages │  enlace  │ Apps Script Web App  │      │  Google Sheets   │
│  (estático)  ├─────────>│  Formularios 1 y 2   ├─────>│  BASE MAESTRA    │
│              │          │  Admin · Check-in    │      │  14 hojas        │
│ · mini-página│          │  Jurado · Dashboard  │      │                  │
│ · términos   │          │                      │      └────────┬─────────┘
│ · política   │          │ Validación servidor  │               │
│ · contacto   │          │ LockService (atómico)│      ┌────────▼─────────┐
└──────────────┘          │ Tokens HMAC + roles  │      │ Drive: respaldos │
   URL corta              └──────────────────────┘      │ XLSX + JSON      │
   para QR/afiches                                      └──────────────────┘
```

### Por qué cada pieza

**Google Sheets como base de datos.** Es la única opción que satisface el
requisito 2 *por construcción*: la base **es** la interfaz del operador. No hay
que construir un CRUD para que coordinación corrija un dato — abre la hoja. Y la
exportación XLSX de 10 hojas no es una funcionalidad a programar: es lo que el
archivo ya es.

> Frente a "Drive como base de datos" (archivos JSON en una carpeta): Sheets *es*
> Drive, pero con motor de tablas e interfaz humana. Guardar JSON suelto no da
> consultas, ni escritura concurrente segura, ni una pantalla donde el
> coordinador trabaje. Estrictamente peor, sin ninguna ventaja.

**Apps Script como servidor.** Corre con la autoridad del dueño, así que la
validación es real y las credenciales nunca tocan el navegador. Trae de fábrica
lo que este problema necesita y que un sitio estático no puede tener:
`LockService` (asignación atómica de los 100 códigos), Script Properties
(equivalente a variables de entorno), `MailApp`, y disparadores programados para
los respaldos. Cero servidores, cero costo, cero tarjeta de crédito.

**GitHub Pages como fachada pública.** No es imprescindible, y por eso conviene
justificarlo: la URL de una Web App de Apps Script es
`script.google.com/macros/s/AKfycb…/exec` — imposible de poner en un afiche o
leer en voz alta. Pages da
`elbunkerarte.github.io`, carga instantánea, y permite cambiar
los textos legales sin tocar la aplicación. Además, las visitas casuales desde
redes sociales no consumen cuota de Apps Script.

### Decisiones internas que valen la pena nombrar

- **REGISTRO es la única fuente de verdad.** AGENDA, CHECK-IN, RESULTADOS y
  DASHBOARD se *reconstruyen* desde ella. Por eso es imposible que un
  participante aparezca con un horario en una pestaña y otro en otra — un error
  clásico y difícil de detectar cuando cada hoja se mantiene a mano.
- **Los códigos se emiten en lote, no al enviar el formulario.** Si cada
  inscripción tomara su código, una avalancha inicial quemaría los 100 cupos en
  filas que después resultan duplicadas o incompletas. El plan ya lo dice:
  primero se valida, después se cierran los 100.
- **Duplicado por cédula ≠ duplicado por correo.** La cédula es duplicado duro
  (gana la primera). Correo y teléfono son **solo alerta**: hermanos y parejas
  comparten número, y fusionar a dos personas distintas es peor que dejar pasar
  un aviso.
- **El check-in guarda primero en el dispositivo.** Cada operación se encola
  local y se sincroniza con un id propio, así que reenviar la cola entera es
  seguro. La mesa nunca espera a la red.
- **Nada legal se inventa.** Razón social, NIT, domicilio, correos y cláusulas
  jurídicas son `PENDIENTE DE COMPLETAR` y se ven en amarillo en el sitio hasta
  que alguien los llene.

## Lo que esta decisión cuesta (dicho de frente)

| Límite | Impacto real | Mitigación implementada |
|---|---|---|
| Gmail personal envía ~100 correos/día | Justo al filo con 100 participantes | El panel muestra la cuota restante, envía por bloques y genera enlaces de WhatsApp — que es el canal principal del plan, no el correo |
| Apps Script tarda 1-3 s por operación | Perceptible, no problemático en un formulario | El check-in es local: 0 ms en la mesa |
| La URL `/exec` es fea | Afecta sólo al enlace interno | La cara pública es GitHub Pages |
| Sheets se degrada con decenas de miles de filas | Irrelevante a 100-200 filas | Si la convocatoria creciera, la capa de datos (`10_db.gs`) está aislada y se cambia sin tocar la lógica |

## Cómo se verificó

No por opinión: **97 pruebas automáticas** sobre la misma lógica que se despliega
(`npm test`), incluidos los 18 casos del "QA OBLIGATORIO" del brief y un dataset
de 130 inscripciones ficticias que demuestra que se emiten **exactamente 100**
códigos y que duplicados, incompletos y fuera de rango no consumen cupo.
