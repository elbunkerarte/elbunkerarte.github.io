# Criterios de aceptación

El criterio de éxito del brief: *un operador no técnico debe poder hacer 12 cosas
sin editar la base por SQL ni modificar código*. Abajo, cada una con **dónde se
hace** y **cómo se verificó**.

## Los 12 criterios de éxito

| # | El operador debe poder… | Dónde | Verificación |
|---|---|---|---|
| 1 | Revisar inscritos | Panel → Inscritos | ✅ probado con la app desplegada |
| 2 | Identificar duplicados | Panel → filtro DUPLICADO + columna *Motivo* | ✅ 4 pruebas automáticas |
| 3 | Cerrar 100 aptos | Panel → Cerrar los 100 → Revalidar | ✅ 6 pruebas |
| 4 | Generar B-001…B-100 | Panel → Emitir códigos | ✅ probado con 130 registros → exactamente 100 |
| 5 | Asignar bloques | Automático al emitir | ✅ 6 pruebas de agenda |
| 6 | Aprobar un cambio | Panel → Cambios de horario | ✅ 8 pruebas |
| 7 | Hacer check-in | Panel de check-in | ✅ máquina de estados, 6 pruebas |
| 8 | Registrar NO SHOW | Botón en la ficha | ✅ |
| 9 | Registrar contingencia | Botón + plan automático | ✅ 3 pruebas |
| 10 | Ingresar evaluaciones | Panel de jurado | ✅ 8 pruebas de rúbrica |
| 11 | Obtener Top 7 | Dashboard → Calcular resultados | ✅ 6 pruebas de selección |
| 12 | Exportar respaldo | Panel → Respaldo completo | ✅ XLSX + JSON en Drive |

**Ninguno requiere SQL ni tocar código.**

## QA obligatorio del brief

Los 18 casos exigidos, cada uno con su prueba automática (`npm test`):

| Caso | Resultado esperado | Estado |
|---|---|---|
| Inscripción normal | APTO, sin errores | ✅ |
| Duplicado por cédula | `duplicate_flag=true`, no consume cupo | ✅ |
| Duplicado por correo | **Alerta**, no duplicado | ✅ |
| Dato incompleto | INCOMPLETO, nombra el campo | ✅ |
| Edad fuera de rango | NO_CUMPLE (probados los bordes exactos) | ✅ |
| Cambio aprobado | Cambia horario, **no el código** | ✅ |
| Cambio rechazado | Conserva horario original | ✅ |
| Doble solicitud de cambio | Se bloquea la segunda | ✅ |
| No show | Estado registrado, la jornada continúa | ✅ |
| Tardanza > 5 min | Pasa a CONTINGENCIA | ✅ |
| Contingencia | Solo entran los que alcanzan en el tiempo real | ✅ |
| Cierre 21:30 | Los pendientes → NO AUDICIONADO | ✅ |
| Tres jurados | Promedio de las tarjetas válidas | ✅ |
| Empate | Desempate documentado; si no resuelve, marca comité | ✅ |
| Webhook repetido | Una sola fila, misma respuesta | ✅ + **probado en producción** |
| Caída de internet | Check-in offline con cola | ✅ implementado |
| Exportación XLSX | Archivo en Drive | ✅ |
| Respaldo y recuperación | `restaurarDesdeJson` | ✅ |

### Dataset de 120+ registros

El brief pide *"al menos 120 registros ficticios para comprobar que solo 100
códigos definitivos se asignan"*.

Se generan **130 inscripciones + 1 reintento idéntico**, con cada modo de fallo
sembrado a propósito. Resultado medido:

```
APTO 115 · NO_CUMPLE 6 · INCOMPLETO 5 · DUPLICADO 2 · REVISION 2
→ 100 códigos emitidos exactamente (B-001 … B-100)
→ 15 aptos sobrantes quedan SIN CUPO, declarados, no perdidos
→ 10 bloques × exactamente 10 participantes
→ ningún duplicado / incompleto / no apto recibió código
→ el reintento idéntico NO creó una segunda fila
```

Reproducible: `node test/dataset.test.js`. Es determinista — el mismo dataset
sale siempre igual, así que un fallo se puede reproducir exacto.

## Requisitos de seguridad

| Requisito | Cómo se cumple |
|---|---|
| Secretos en variables de entorno | Script Properties (`SECRETO_HMAC`, `SPREADSHEET_ID`) — nunca en el repositorio |
| RBAC: admin, logística, check-in, jurado, dirección | 5 roles, verificados **en el router**, no en la interfaz |
| El jurado solo ve lo necesario | Código, nombre artístico y disciplina. Sin documento ni contacto |
| Bitácora de cambios de horario y evaluaciones | Hoja `_LOG`, con actor y marca de tiempo |
| Respaldos | Automático diario + manual bajo demanda |
| No almacenar archivos de cédula | **No se piden.** Verificación presencial |
| Evidencia de consentimientos y versión | 4 consentimientos separados + `consent_version` por fila |
| Idempotencia de webhooks | Hoja `_IDEMPOTENCIA` — probado en producción |
| Validación del lado del servidor | Toda la validación corre en Apps Script; el cliente solo falla rápido |
| Sanitización de entradas | Todo se escapa al pintar (`escaparHtml`); Sheets no interpreta código |
| Rate limiting / CAPTCHA | ⚠️ **No implementado.** Ver limitaciones |
| No enviar datos personales a logs | `_LOG` guarda códigos y acciones, nunca nombres ni documentos |

## Verificación en producción

Hecha contra el despliegue real, no en teoría:

| Qué | Resultado |
|---|---|
| Sitio público responde | HTTP 200 en las 4 páginas |
| Formulario 1 sirve sin autenticación | HTTP 200, 45 KB |
| Inscripción real de extremo a extremo | `APTO`, edad 24 calculada bien, fila creada |
| Idempotencia | 2 POST idénticos → **1 sola fila** |
| RBAC con token de admin | Lectura autorizada correctamente |
| Base maestra creada | 14 hojas |
| Disparadores instalados | Respaldo diario + refresco de vistas |

## Limitaciones conocidas (declaradas, no ocultas)

1. **Sin CAPTCHA ni rate limiting.** Una convocatoria local de 100 cupos con
   verificación presencial de documento no lo justificaba. Si aparece spam: cerrar
   inscripciones (`inscripciones_abiertas=NO`) y depurar con *Revalidar*.
2. **Cuota de correo ~100/día** en una cuenta Gmail normal. El panel muestra la
   cuota restante. WhatsApp es el canal principal según el plan.
3. **WhatsApp no se automatiza.** El sistema redacta y genera el enlace; envía una
   persona. Es una decisión, no una carencia: automatizarlo fuera de una API
   autorizada está prohibido por el brief.
4. **El check-in offline necesita cargar la lista con señal al menos una vez.**
5. **Los textos jurídicos no están redactados.** Las reglas operativas sí (vienen
   del plan aprobado); las cláusulas legales están marcadas
   `PENDIENTE DE COMPLETAR` para el área legal.
