# EL BÚNKER — QA final (iteración 3 · 29-sep-2026)

Dos niveles de prueba, a propósito:
1. **Batería automática** sobre un emulador de Apps Script (`test/gas/`): hojas, Drive, correo, candados, disparadores,
   cuotas y reloj simulados; cada prueba entra por las funciones reales del servidor. `npm test` — **425 pruebas, 0 fallos**.
2. **En vivo** sobre el proyecto real de PRUEBAS (misma cuenta, hoja y URL separadas de producción, franja naranja):
   formularios en navegador móvil y de escritorio, correo real, ensayo integral de 17 fases, paneles privados.

Regla de cierre del prompt: si falla un flujo crítico no se publica; se corrige y se repite la prueba afectada.

## 1. Batería QA-01…QA-14

| ID | Criterio | Evidencia automática (`test/iteration3.qa.test.js`) | Evidencia en vivo (PRUEBAS) | Resultado |
|---|---|---|---|---|
| QA-01 | >100 inscritos, bolsa de 200 | 100 códigos exactos; 1–100 PRINCIPAL, 101–200 SUPLENTE, resto FUERA_DE_BOLSA por orden de envío; el formulario sigue abierto | Ensayo: 134 envíos, 100 códigos | ✅ |
| QA-02 | Solista/dúo/agrupación, intérpretes y equipo | 1 proyecto = 1 cupo; `EQ-`/`GRP-` con clave de 10; el equipo no cuenta; una persona con dos roles = un `person_id` | Formulario de 7 pasos: solista (móvil), dúo y agrupación (escritorio). Equipo y firmas en móvil: intérprete suma (2 de 3), equipo de trabajo no ocupa cupo, menor como equipo → NO CUMPLE | ✅ |
| QA-03 | Recibo, aptitud, bitácora | RECIBIDO + comprobante; sin firma → INCOMPLETO sin recibo; aptitud a todos los decididos; bitácora con quién | Correo de recepción real en **Recibidos** (no spam), HTML y texto correctos | ✅ |
| QA-04 | Cambio de turno | La solicitud no mueve el turno; la aprobación mueve sólo la hora, el código queda | — | ✅ |
| QA-05 | Retiro la semana previa | Doble confirmación; sólo ese cupo; el suplente hereda B-037 y su horario; B-036/B-038 no se mueven | Por pantalla (Mi inscripción, móvil): el titular de B-001 libera con doble confirmación; el suplente acepta y hereda B-001 y su hora; B-002 intacto (sección 3) | ✅ |
| QA-06 | Rechazo / sin respuesta del suplente | Pasa al siguiente; nunca dos ofertas abiertas; vence a las 24 h | Sólo automática (el rechazo usa la misma ruta de oferta que se probó en vivo con la aceptación) | ✅ |
| QA-07 | Confirmación final + vacante | SÍ no cambia horario; NO tras el límite → RETIRO_FINAL + VACANTE_SIN_REEMPLAZO | Por pantalla: «SÍ CONFIRMO» → «¡Confirmado!»; «NO PODRÉ ASISTIR» dentro del plazo → el cupo pasa al suplente | ✅ |
| QA-08 | Consolidación | `ROSTER_FINAL_2026-10-22` + JSON + bloqueo; después se rechazan retiros, cambios, vacantes y quitar cupos; se rechaza consolidar con cambios pendientes sin tocar nada | Consolidación en vivo (sección 3): `ROSTER_FINAL_2026-10-22` con sus filas y bloqueo; después se rechazan una segunda consolidación, retiros y cambios. El ensayo también rechazó consolidar con un cambio pendiente | ✅ |
| QA-09 | 3 jurados, extremos | 5 en todo = 100, 1 en todo = 20; tarjeta enviada bloqueada; reapertura por dirección con motivo; promedio a precisión completa | Ensayo fase 13 | ✅ |
| QA-10 | Top 20/Top 10, empate, DQ | Empate en el corte 10 → TIE_REVIEW_REQUIRED y no se puede cerrar; acta lo resuelve; DQ sólo excluye tras validación | Ensayo fases 14 y 16 | ✅ |
| QA-11 | Correos | Sin duplicados (también reenvío manual); registro completo; 3 reintentos → FALLIDO; en producción nunca sale un enlace de prueba; OMITIDO reencolable al corregir | Correo real; cola cada 15 min activa | ✅ |
| QA-12 | Acceso privado | Jurado A sólo su hoja; dirección enmascarada; check-in sin DQ ni consolidar; clave de equipo con bloqueo por intentos y vencimiento; configuración pública sin datos personales; consulta de estado exige documento **y** código; ranking sólo para dirección | Consulta sin datos → «No encontramos…» | ✅ |
| QA-13 | Excel y seguro | SEGURO_MAYORCA = personas de proyectos con código; sólo roles autorizados (33 pruebas del Excel en `iteration3.export.test.js`) | Los dos libros generados en el Drive real: corporativo de 15 hojas y póliza (sección 3) | ✅ |
| QA-14 | Móvil + escritorio + sesión limpia | — | Navegador limpio (sin sesión) 390×844 y 1366×900: pasos bloquean datos incompletos y firma vacía; sin errores de JavaScript | ✅ |

## 2. Pruebas agregadas por hallazgos de esta iteración

| Hallazgo | Cómo se encontró | Prueba |
|---|---|---|
| Inscripción de 12 s, 6,8 s bajo candado | Perfil en vivo | 5 pruebas «Registration fast path» |
| Firma huérfana si el candado rechaza | Revisión del perfil | idem |
| Consulta de estado con sólo la cédula | Lectura del código al documentar | «Findings of the operator-documentation read-through» |
| Ranking visible para logística | idem | idem |
| Consolidar cancelaba ofertas antes de validar | idem | idem |
| Reabrir resultados sin botón; Excel sin botón en dirección | idem | idem |
| Check-in no encontraba al equipo de un solista | idem | idem |
| Solicitud de cambio huérfana al liberar el cupo | Lectura de flujos (reproducido en emulador) | «Findings of the state-flow read-through» |
| Acciones permitidas con la lista consolidada | idem | idem |
| OMITIDO nunca reencolable; reenvío manual con otra clave | idem | idem |
| Encolado masivo cuadrático (127 aptitudes = 3,6 min) | Ensayo en vivo | batch + pruebas de idempotencia |
| Cupo ofrecido no ocupaba su bloque | Lectura de flujos | idem |
| La nota de DQ se borraba al guardar borrador | idem | idem |
| Reset de producción dejaba respuestas guardadas y firmas | Preparación del reset | «Production reset» |

## 3. Resultados en vivo (PRUEBAS)

Proyecto de PRUEBAS, versión publicada 11 (commit `f094f0f`), 29-sep-2026. Datos sintéticos; al terminar, PRUEBAS quedó en
0 filas y con la configuración por defecto.

**Ensayo integral (17 fases, desde el editor):** 134 envíos (126 RECIBIDO, 8 INCOMPLETO) · 67 integrantes · 127 resultados de
aptitud · 100 códigos · retiro de B-037 con suplente y vecinos intactos · 89 audiciones REALIZADA · Top 10 calculado ·
**ENSAYO INTEGRAL COMPLETO**. Hallazgos que cambió el código: inscripción con 6,8 s bajo candado (→ 5,4 s), «Cerrar jornada»
agotaba los 6 min de Apps Script (las vistas ahora se rehacen fuera del candado de datos: ~36 s), encolado de 127 correos de
aptitud en 3,6 min (→ por lotes, abajo). La fase 9 pidió mover un cambio a un bloque lleno: el sistema lo rechazó bien
(un NO SHOW no libera agenda) y la consolidación de la fase 11 también se negó por ese cambio pendiente. Se corrigió el guion del
ensayo, no el sistema.

| Prueba | Resultado medido |
|---|---|
| Encolado por lotes | 135 filas contra 383 correos registrados: **1,5 s** (antes 3,6 min), sin duplicar ningún correo |
| Escenario de reemplazo (2 cupos, 2 suplentes, ventanas abiertas) | 4 inscripciones → 2 códigos + 2 suplentes; correos reales de recepción, aptitud, asignación y «sin cupo» ENVIADOS a las cuentas de prueba; las direcciones de dominio de prueba quedan OMITIDO |
| Mi inscripción · «NO PODRÉ ASISTIR» (móvil) | Pide escribir LIBERAR MI CUPO; vacío → «Escribe exactamente…»; con la frase → «liberamos el cupo B-001… se ofreció a la siguiente persona». La consulta posterior dice «Liberaste tu cupo (B-001)» |
| Mi inscripción · aceptar oferta | El suplente queda con **B-001, audición 3:00 p. m.**: hereda código y horario; B-002 no se mueve |
| Mi inscripción · «SÍ CONFIRMO» | «¡Confirmado! Te esperamos. Tu código y tu horario no cambian.» |
| Paneles con enlace personal | Admin: 4 aptos · 2 con código · 1 suplente, la persona retirada marcada «antes B-001» · Dirección: 1 retirado · 1 reemplazo · 1 confirmó · 0 vacantes · Check-in: B-001 con el artista del suplente · Jurado 1: «Cómo calificar (rúbrica oficial)» y su lista. Salud: «Sistema consistente», versión 3.0.0 |
| Formulario público | Paso 1 de 7, Etapa 1, NIT, términos v2-2026-09-29, política v3-2026-09-29, sin «Top 20» ni textos residuales |
| CONSOLIDAR LISTA OFICIAL | Sin la palabra → rechazado · con CONSOLIDAR → hoja `ROSTER_FINAL_2026-10-22` (2 filas) y lista bloqueada · segunda consolidación, retiro del participante, retiro por staff y solicitud de cambio → rechazados |
| Excel | Corporativo: 15 hojas, 45,8 KB, 64 s (incluye refrescar las vistas) · Póliza: README_OPERACION + SEGURO_MAYORCA, 11 s. La hoja temporal va a la papelera |
| Errores de JavaScript en pantalla | 0 en todas las pasadas |

Qué **no** se probó en vivo y por qué: el rechazo de una oferta y su vencimiento a las 24 h (misma ruta que la aceptación, cubiertos
por la batería automática) y la cola de correos a volumen real de producción (cuota diaria de Gmail; cubierta en el emulador).
