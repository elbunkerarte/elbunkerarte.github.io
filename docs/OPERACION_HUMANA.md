# Operación humana — EL BÚNKER (iteración 3)

> Vigente desde el 29-sep-2026 (sistema 3.0.0). Qué hace cada persona del equipo **sin tocar código**. Fuente:
> `apps-script/00_config.gs` (roles, permisos, CONFIG), `11_auth.gs`, `20_web.gs`, `40_setup.gs` (cuentas),
> `ui_admin.html`, `ui_dashboard.html`, `ui_checkin.html`, `ui_jurado.html`, `ui_mi_inscripcion.html`. Si algo difiere,
> manda el código.

Evento: **viernes 23 de octubre de 2026, 3:00 p. m. – 9:00 p. m., Centro Comercial Mayorca · Etapa 1, Sabaneta.**
100 turnos · 3 jurados · 10 seleccionados públicos · Top 20 privado. Sitio público: https://elbunkerarte.github.io/

## 1. Cuentas, roles y pantallas

Cada persona recibe **su propio enlace** (acceso autenticado). No se comparte entre personas ni entre roles. Los enlaces
vencen **45 días** después de emitidos. Emitir un enlace nuevo para el mismo alias invalida el anterior.

| Cuenta (alias) | Rol | Pantalla que abre | Para quién |
|---|---|---|---|
| `admin` | admin | Panel (todas las pestañas) + dashboard + check-in | Administración del sistema |
| `coordinacion` | logistica | Panel + dashboard (sin resultados) + check-in | Coordinación logística |
| `direccion` | direccion | Dashboard de dirección | Dirección / gerencia |
| `checkin-1`, `checkin-2` | checkin | Mesa de check-in | Mesas de entrada |
| `stage-manager` | checkin | Mesa de check-in (pestaña Escena) | Stage manager y cronómetro |
| `tecnico-audio` | checkin | Mesa de check-in (pestaña Pistas) | Técnico de audio |
| `jurado-1`, `jurado-2`, `jurado-3` | jurado | Pantalla de jurado | Jurados (cada uno escribe en su hoja JURADO_1/2/3) |

Permisos reales (`PERMISOS`): el servidor los aplica en cada acción, no solo la pantalla.

| Rol | Puede |
|---|---|
| admin | Todo |
| direccion | Dashboard, resultados privados, inscritos **enmascarados** (sin documento, correo ni teléfono completos), actas de desempate, validar descalificaciones, reabrir evaluaciones, cerrar resultados |
| logistica | Dashboard (sin la sección de resultados), inscritos con datos completos, aptitud, códigos, bolsa y reemplazos, consolidar lista, cambios, agrupaciones, pistas, videos, comunicación, respaldos y Excel, check-in, cerrar jornada |
| checkin | Buscar y cambiar estado del día, lista mínima, pistas (solo lectura), plan de contingencia |
| jurado | Su lista de audiciones y sus tarjetas |

## 2. Qué hace cada rol

### 2.1 Coordinación / logística (panel, `?p=admin`)

| Pestaña | Botones y acciones |
|---|---|
| **Inscritos** | Buscar por nombre, código, GRP o documento; filtros (Por revisar, RECIBIDA, EN REVISIÓN, APTO…, Suplentes, Retirados, Agrupaciones). Columna **Decisión**: "Decidir…" → APTO / EN REVISIÓN / INCOMPLETO / NO APTO / DUPLICADO, siempre con motivo |
| **Agrupaciones** | Ver cada dúo/agrupación con sus integrantes, firmas y alertas. "Es el mismo proyecto" / "Son proyectos distintos" cuando hay nombre repetido. "Copiar enlace de integrantes", "Constancia imprimible", "Cambiar integrantes declarados" |
| **Aptitud y códigos** | Paso 1 "Aplicar verificación y enviar resultados" y "Reenviar resultados pendientes de aviso". Paso 2 "Revalidar inscripciones" (solo si cambió CONFIG). Paso 3 "Emitir códigos y asignar bloques". "Ver ocupación" por bloque |
| **Bolsa y reemplazos** | Métricas de bolsa. "Retirar y ofrecer el cupo" (código + motivo; casilla "retiro de la confirmación final"). Tabla de cupos con "Ofrecer al siguiente" y "Cerrar sin reemplazo". "Recalcular bolsa y vencer ofertas". Bolsa de aptos por prioridad. Historial de ofertas. "Vista previa y conteos" y **"CONSOLIDAR LISTA OFICIAL DEL EVENTO"** |
| **Cambios de horario** | Cada solicitud con su motivo: elegir bloque destino (solo los que tienen cupo) y "Aprobar", o "Rechazar" con motivo que se comunica |
| **Pistas** | Lista en orden de agenda; marcar PENDIENTE / RECIBIDA / VALIDADA / CON PROBLEMA / NO APLICA; "Crear carpetas Audio/B-XXX"; "Subir una pista recibida por WhatsApp" (código + canción + archivo) |
| **Comunicación** | "Generar textos" (con botón "Abrir chat" de WhatsApp), "Enviar por correo", "Registro de correos", "Reintentar fallidos", contactos `.vcf` para la lista de difusión, verificación de videos |
| **Respaldo y sistema** | "Respaldo completo" con etiqueta (Manual, Pre-evento, Agenda, Post-evento, Resultados), "Solo exportar XLSX", "Respaldar audios", "Generar Excel corporativo", "Generar Excel de la póliza" (SEGURO_MAYORCA), "Refrescar vistas", **"Cerrar jornada"** |

Solo admin ve además: "Estado del sistema", "Accesos del equipo" (crear o renovar enlaces; para jurados la nota debe decir
"jurado 1", "jurado 2" o "jurado 3") y "Desbloquear (solo admin, emergencia)".

### 2.2 Dirección (dashboard, `?p=dashboard`)

- Indicador operativo del bloque en curso (esperados, check-in, realizadas, no show, contingencia) con "Simular hora
  (ensayo)"; métricas, avance por bloque, distribución de puntajes y Top 10. Se actualiza solo cada 60 segundos.
- **Resultado consolidado (privado)**: "Calcular resultados" muestra el ranking completo (J1, J2, J3, final, desempate,
  estado), empates `TIE_REVIEW_REQUIRED`, actas vigentes y quiénes siguen fuera del ranking.
- **Acta de desempate** (aparece solo si hay un empate en el corte 10 o 20): corte, método, orden decidido,
  participantes, resultado → "Registrar acta".
- **Descalificaciones, correcciones y cierre**: "Ver reportes" → Validar / Descartar con motivo; "Reabrir evaluación"
  (código + jurado + motivo); **"Cerrar resultados"** (escribir CERRAR).
- **Inscritos (datos protegidos)**: consulta enmascarada.
- Dirección **no** abre el panel de logística: el correo `RESULTADO_FINAL`, los Excel y los respaldos los ejecuta
  logística o admin.

### 2.3 Mesa de check-in (`?p=checkin`)

- Buscar por código (B-001), por documento del titular o por documento de cualquier integrante de un dúo o agrupación.
  **Siempre validar con el documento físico** (de cada integrante en grupos).
- La ficha muestra horario, retraso contra la tolerancia de 5 minutos, avisos (autorizaciones incompletas → firmar la
  constancia física; no autoriza imagen/voz → no grabar; pista pendiente o con problema → pedir la USB; cambio de horario
  sin resolver) y solo los botones permitidos: Confirmar CHECK-IN, Pasar a PRECOLA, Sube a escena (EN AUDICIÓN), Audición
  REALIZADA (salida), Pasar a CONTINGENCIA, Marcar NO SHOW.
- Pestañas: Lista por bloque, Escena, Pistas, Contingencia ("Calcular plan ahora"), Pendientes de sincronizar.
- Funciona sin conexión: las operaciones quedan en el dispositivo y se sincronizan solas o con "Sincronizar ahora".

### 2.4 Stage manager y técnico de audio

- **Stage manager** (`stage-manager`, rol checkin): pestaña **Escena** — quién está en precola y quién en escena. Marca
  PRECOLA → EN AUDICIÓN → REALIZADA. Marcar REALIZADA es lo que habilita a los jurados para calificar.
- **Técnico de audio** (`tecnico-audio`, rol checkin): pestaña **Pistas** — lista en orden de agenda con el archivo de
  cada código. Es de solo lectura: marcar el estado de una pista se hace en el panel de logística. Si falta la pista o
  tiene problema, se usa la USB de respaldo del participante. Antes del evento, logística descarga la carpeta Audio
  completa para tener copia sin conexión.

### 2.5 Jurados (`?p=jurado`)

- Leer "Cómo calificar (rúbrica oficial)". Calificar solo proyectos con audición REALIZADA, de forma independiente.
- Por proyecto: una categoría a la vez (1–5), observaciones, reporte de causal de descalificación si aplica.
- "Guardar borrador" o **"ENVIAR Y BLOQUEAR EVALUACIÓN"**. Después solo dirección reabre. Detalle: `RUBRICA_JURADOS.md`.

### 2.6 Participantes (sin cuenta: documento + código o comprobante en "Mi inscripción")

Consultar estado, subir la pista (solo con código), enlace "equipo y firmas", responder una oferta de cupo (ACEPTAR EL
CUPO / No puedo), liberar el cupo desde el 16-oct (NO PUEDO ASISTIR, escribiendo **LIBERAR MI CUPO**), confirmación final
del 22-oct (SÍ CONFIRMO / NO PODRÉ ASISTIR), una solicitud de cambio de horario.

## 3. Calendario (valores de CONFIG)

CONFIG no tiene fechas para cerrar inscripciones, aplicar la aptitud ni emitir códigos: son decisiones de la organización
y se ejecutan con interruptores o botones.

| Fecha | Qué pasa | Quién |
|---|---|---|
| Desde el 29-sep (hoy) mientras `inscripciones_abiertas = SI` | Llegan inscripciones como RECIBIDA. Las inscripciones siguen abiertas aunque haya más de 100 | Participantes |
| Periódicamente | "Aplicar verificación" (envía resultados de aptitud); decidir las EN REVISIÓN; resolver agrupaciones repetidas | Logística |
| Cuando la organización decida | Cerrar inscripciones: CONFIG `inscripciones_abiertas = NO` | Admin/logística |
| Cuando la organización decida (con las EN REVISIÓN resueltas) | "Emitir códigos y asignar bloques": B-001… en orden de inscripción, correos ASIGNACION y SIN_CUPO. Se puede volver a pulsar: solo da números no emitidos a nuevos APTO | Logística |
| Después de emitir | "Crear carpetas Audio/B-XXX"; seguimiento de pistas y firmas (FIRMAS_PENDIENTES, PISTA_PENDIENTE); contactos `.vcf` | Logística |
| Antes del vie 16-oct | Un retiro solo lo puede registrar logística ("Retirar y ofrecer el cupo") | Logística |
| **Vie 16-oct 00:00** (`reemplazos_desde`) | Se habilita "NO PUEDO ASISTIR — SOLICITAR REEMPLAZO" en "Mi inscripción" | Participantes |
| 16 → 22-oct | Ofertas a suplentes con 24 h para aceptar; vencidas pasan solas cada hora | Sistema; logística vigila "Historial de ofertas" |
| **Jue 22-oct 00:00** (`confirmacion_final_desde`) | Abre la CONFIRMACIÓN FINAL DE ASISTENCIA. Enviar la plantilla `CONFIRMACION_FINAL` y `RECORDATORIO_24H` | Logística |
| **Jue 22-oct 12:00** (`reemplazo_limite`) | Ya no se ofrecen cupos: todo cupo liberado queda VACANTE SIN REEMPLAZO | Sistema |
| **Jue 22-oct 18:00** (`cierre_cambios`) | Cierra el Formulario 2 (cambio de horario) | Sistema |
| **Jue 22-oct 20:00** (`confirmacion_final_hasta`) | Cierra la confirmación final | Sistema |
| Jue 22-oct, después de las 20:00 | Resolver cambios pendientes → "Vista previa y conteos" → **CONSOLIDAR** (crea `ROSTER_FINAL_2026-10-22`). Respaldo PRE-EVENTO. Excel de la póliza para el C.C. Mayorca. Descargar la carpeta Audio | Logística |
| **Vie 23-oct** | Evento (ver tabla de bloques). Respaldo AGENDA/POST-EVENTO | Todos |
| Vie 23-oct 9:00 p. m. | Cierre de audiciones → "Cerrar jornada" | Logística |
| Vie 23-oct, después del cierre | Jurados envían todo; dirección resuelve descalificaciones y actas; "Cerrar resultados"; logística recarga el panel y envía `RESULTADO_FINAL`; respaldo RESULTADOS | Jurados, dirección, logística |
| Sáb 24-oct (último día, `enlaces_equipo_vencen`) | Último día en que abren los enlaces "equipo y firmas" | — |
| Todos los días 23:00 | Respaldo automático (XLSX + JSON) | Sistema |

Horario del 23-oct (`agendaConfigurada`, tolerancia 5 min, llegada 15 min antes):

| Bloque | Códigos | Llegada | Audición |
|---|---|---|---|
| 1 | B-001 – B-010 | 2:45 p. m. | 3:00 p. m. |
| 2 | B-011 – B-020 | 3:15 p. m. | 3:30 p. m. |
| 3 | B-021 – B-030 | 3:45 p. m. | 4:00 p. m. |
| 4 | B-031 – B-040 | 4:15 p. m. | 4:30 p. m. |
| 5 | B-041 – B-050 | 4:45 p. m. | 5:00 p. m. |
| 6 | B-051 – B-060 | 5:15 p. m. | 5:30 p. m. |
| 7 | B-061 – B-070 | 5:45 p. m. | 6:00 p. m. |
| 8 | B-071 – B-080 | 6:15 p. m. | 6:30 p. m. |
| 9 | B-081 – B-090 | 6:45 p. m. | 7:00 p. m. |
| 10 | B-091 – B-100 | 7:15 p. m. | 7:30 p. m. |
| Margen operativo | Solo cambios aprobados (hasta 10) | 7:45 p. m. | 8:00 – 8:30 p. m. |
| Contingencia | Quienes perdieron su turno, si cabe | — | 8:30 – 9:00 p. m. |

## 4. Botones peligrosos

| Botón | Dónde | Quién | Qué hace | Protección | ¿Se deshace? |
|---|---|---|---|---|---|
| Emitir códigos y asignar bloques | Panel → Aptitud y códigos | Logística, admin | Da B-XXX y horario a todos los APTO sin código y envía correos | Confirmación | **No**: un código emitido no se reasigna |
| Aplicar verificación y enviar resultados | Panel → Aptitud y códigos | Logística, admin | Convierte todas las RECIBIDAS en su estado y envía el correo de aptitud | Confirmación | No (los correos ya salieron) |
| Enviar por correo | Panel → Comunicación | Logística, admin | Correos reales a toda la audiencia de la plantilla | Confirmación | No |
| Decidir… NO APTO / DUPLICADO / INCOMPLETO sobre un titular | Panel → Inscritos | Logística, admin | Exige **liberar el cupo** y lo ofrece al siguiente suplente | Motivo + confirmación | No |
| Retirar y ofrecer el cupo ("liberar cupo") | Panel → Bolsa y reemplazos | Logística, admin | Quita el código al titular y lo ofrece | Motivo + confirmación | **No** |
| Cerrar sin reemplazo | Panel → Bolsa, tabla de cupos | Logística, admin | Cancela la oferta abierta y deja el cupo vacante | Motivo | Parcial ("Ofrecer al siguiente" antes del límite) |
| CONSOLIDAR LISTA OFICIAL DEL EVENTO | Panel → Bolsa y reemplazos | Logística, admin | Cancela ofertas abiertas, crea la foto oficial y bloquea cambios ordinarios | Escribir CONSOLIDAR | Solo admin con "Desbloquear" (motivo); la foto queda y la siguiente es una versión nueva |
| Desbloquear | Panel → Bolsa | Solo admin | Reabre cambios ordinarios | Motivo (10+ caracteres) | Sí, volviendo a consolidar |
| Cerrar jornada | Panel → Respaldo y sistema | Logística, admin | Todo el que no audicionó (salvo quien está en escena) queda NO AUDICIONADO, fuera de la selección. **No verifica la hora** | Confirmación | No desde los paneles |
| Cerrar resultados | Dashboard | Dirección, admin | Bloquea evaluaciones y deja el Top 10 definitivo | Escribir CERRAR; exige 3 tarjetas por audición, sin empates sin acta, sin DQ pendientes | Solo admin, por la acción `reabrir_resultados` (no tiene botón) |
| Reabrir evaluación | Dashboard | Dirección, admin | La tarjeta vuelve a borrador; deja de contar hasta que el jurado la reenvíe | Motivo | Sí, el jurado reenvía |
| Validar descalificación | Dashboard | Dirección, admin | Saca al proyecto del ranking | Motivo | No desde los paneles |
| Registrar acta | Dashboard | Dirección, admin | Decide el orden de un empate en el corte 10 o 20 (reemplaza el acta anterior del mismo corte) | Confirmación + campos obligatorios | Se reemplaza con otra acta |
| Crear acceso | Panel → Accesos del equipo | Solo admin | Emite un enlace; si el alias ya existía, **el enlace anterior deja de funcionar** | — | Emitiendo otro |
| Quitar inscripciones | No está en los paneles: solo desde el editor de Apps Script (`QUITAR_PRUEBAS_PRELANZAMIENTO`, lista fija de pruebas; `quitarInscripciones` exige "SI-QUITAR") | Admin/desarrollo | Borra filas y todo lo asociado, con respaldo previo | Confirmación escrita | Por restauración desde el respaldo |
| LIMPIAR, ENSAYO | Editor | Desarrollo | Solo funcionan en PRUEBAS; en producción están bloqueados | Doble llave de entorno | — |

## 5. Contingencias (con ejemplos)

### 5.1 Una cancelación una semana antes

*Ejemplo:* el viernes 16-oct la titular de **B-037** (Bloque 4, llegada 4:15 p. m., audición 4:30 p. m.) avisa que viaja.

1. Ella misma entra a "Mi inscripción" con su documento y su código → "NO PUEDO ASISTIR — SOLICITAR REEMPLAZO" → escribe
   LIBERAR MI CUPO. O, si llama, logística usa "Retirar y ofrecer el cupo" con código B-037 y motivo.
2. El sistema ofrece B-037 al SUPLENTE de menor prioridad (p. ej. #101), que recibe `OFERTA_SUPLENTE` (hasta ~15 min) y
   tiene 24 horas para aceptar en "Mi inscripción".
3. Si acepta, recibe B-037 con el mismo bloque y horario y el correo `ASIGNACION`; debe subir su pista, completar su
   enlace "equipo y firmas" y confirmar el 22-oct. Nadie más cambia de horario.
4. Si avisa **antes** del 16-oct, solo logística puede registrar el retiro.

### 5.2 El suplente no acepta

- Pulsa "No puedo": su oferta queda RECHAZADA, él pasa a DECLINO (no recibe más ofertas) y el cupo se ofrece de inmediato
  al siguiente suplente (#102).
- No responde: a las 24 horas la oferta vence; el disparador horario la pasa al siguiente (también queda DECLINO).
- Logística lo sigue en "Historial de ofertas". Si quiere avisarle por WhatsApp, lo hace una persona desde el número
  oficial: el sistema no envía WhatsApp.

### 5.3 Un retiro un día antes

*Ejemplo:* el jueves 22-oct el titular de **B-058** responde "NO PODRÉ ASISTIR" en la confirmación final.

- A las **10:30**: queda RETIRO_FINAL y el cupo se ofrece al siguiente suplente, pero la oferta vence a las **12:00**
  (límite de reemplazos).
- A las **11:15**: faltan 45 minutos para el límite (menos de 1 hora) → el cupo queda **VACANTE SIN REEMPLAZO** sin ofrecerse.
- **Después de las 12:00**: vacante directa.
- Si llama por teléfono, logística usa "Retirar y ofrecer el cupo" marcando "Es un retiro de la confirmación final".

### 5.4 Vacante sin reemplazo

- El cupo queda VACANTE SIN REEMPLAZO: su bloque tiene una audición menos. Nadie se mueve para llenarlo.
- Antes de consolidar, logística puede pulsar "Ofrecer al siguiente" si todavía hay suplentes y queda al menos 1 hora antes
  de las 12:00 del 22-oct; si no, vuelve a quedar vacante.
- En `ROSTER_FINAL_2026-10-22` aparece con estado VACANTE_SIN_REEMPLAZO.

### 5.5 Un cambio de horario pendiente

*Ejemplo:* **B-012** (Bloque 2, audición 3:30 p. m.) pidió cambio el 20-oct y sigue PENDIENTE el 22-oct por la noche.

- Mientras no se apruebe, **vale su horario original**. El Formulario 2 cierra el 22-oct a las 18:00.
- Logística debe resolverlo **antes de consolidar**: "Vista previa y conteos" muestra "Cambios de horario pendientes".
  CONSOLIDAR no lo impide, pero después ya no se puede resolver y queda el horario original.
- Si los bloques 1–10 están llenos, el destino disponible es el **Margen operativo** (8:00–8:30 p. m., hasta 10 cambios).
- El día del evento la mesa ve el aviso "Tiene una solicitud de cambio de horario sin resolver".
- **Cuidado:** si quien pidió el cambio libera su cupo, su solicitud sigue PENDIENTE con ese código. No la resuelvas: el
  sistema la aplicaría a quien herede el cupo. Avisa a admin.

### 5.6 Empate entre jurados o entre proyectos

- **Jurados que no coinciden** (p. ej. 81, 71 y 82): no hay nada que decidir; el sistema promedia con precisión completa
  (78.00). Los jurados no ven las notas de los otros.
- **Dos proyectos con el mismo puntaje**: primero decide la suma de Presencia escénica + Factor arena (promedio). Si aún
  empatan y el empate cruza el puesto 10 o el 20, el dashboard muestra "Empate en el corte … (TIE_REVIEW_REQUIRED)":
  dirección registra el acta (método: repetir una canción corta o voto de calidad del jurado musical; participantes;
  resultado; orden). Sin acta no se pueden cerrar resultados. Ejemplo completo en `RUBRICA_JURADOS.md` §10.
- **Un jurado se equivocó** en una tarjeta enviada: dirección la reabre con motivo; el jurado corrige y reenvía antes del
  cierre.

### 5.7 Otras situaciones del día

| Situación | Qué hacer |
|---|---|
| Llega hasta 5 min tarde | Conserva el turno solo si no altera el flujo (decide el coordinador) |
| Llega más de 5 min tarde | "Pasar a CONTINGENCIA"; entra en la contingencia de 8:30 p. m. si cabe |
| No llega | "Marcar NO SHOW"; puede pasar a CONTINGENCIA si aparece |
| Se cae internet en la mesa | Seguir marcando: queda en "Pendientes de sincronizar" y se envía al volver la conexión |
| Un integrante no firmó en línea | Firma la "Constancia imprimible" antes de subir al escenario |
| La pista no llegó | Pedir la USB de respaldo |
| Se agotó la cuota de correo | Lo pendiente sale solo en las siguientes pasadas (cada 15 min, al renovarse la cuota) |
| Registrar un incidente | Los paneles no tienen botón de incidentes: las transiciones forzadas los crean solas; cualquier otro se anota en la hoja INCIDENTES |
