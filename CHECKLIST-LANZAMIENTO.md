# Checklist de lanzamiento — EL BÚNKER (iteración 2)

Estado al **25 de septiembre de 2026**. Evento: **viernes 23 de octubre de 2026,
3:00 p. m. – 9:00 p. m., Centro Comercial Mayorca, Sabaneta, Antioquia.**

Cada punto tiene uno de tres estados:

| Estado | Significa |
|---|---|
| ✅ **READY** | Construido y verificado |
| 🟡 **PENDING** | Falta algo, pero no impide publicar (o es de la organización) |
| 🔴 **BLOCKED** | No se puede hacer hasta que se cumpla una condición |

**Resumen:** la iteración 2 está **publicada en PRODUCCIÓN** desde el
**25 de septiembre de 2026** (implementación en su versión 5, sitio público
actualizado), después de probarla en PRUEBAS (322 pruebas automáticas y prueba de
punta a punta en vivo). Antes de publicar se hizo una copia completa de la hoja de
producción y se quitaron las 2 inscripciones de prueba.

---

## ✅ Publicación en producción (hecha el 25-sep)

| # | Qué | Estado |
|---|---|---|
| 1 | Publicar la iteración 2 en producción (código, migración, sitio) | ✅ READY |

### Orden de publicación (así se hizo; sirve para la próxima versión)

Detalle de cada paso en [docs/DESPLIEGUE.md](docs/DESPLIEGUE.md), sección C.

| Paso | Qué | Hecho |
|---|---|---|
| 1 | Respaldo completo de producción (*Pre-evento* o *Manual*) y descargar el XLSX | ✅ |
| 2 | Pegar `build/Codigo.gs` en el proyecto de producción y guardar | ✅ |
| 3 | `MIGRAR` → informe con "Datos intactos: SI" | ✅ |
| 4 | `QUITAR_PRUEBAS_PRELANZAMIENTO` → quita S-07BE9C53 y S-E780AA04 (con respaldo previo y registro en `_LOG`) | ✅ |
| 5 | CONFIG `web_app_url` = URL `/exec` de producción | ✅ |
| 6 | Versión nueva de la implementación existente (la URL `/exec` no cambia) | ✅ |
| 7 | `VERIFICAR` o panel → *Revisar*: "Sistema consistente" | ✅ |
| 8 | `verAccesos` → entregar los enlaces de `stage-manager` y `tecnico-audio` | ✅ |
| 9 | Fusionar `feat/iteracion-2` en `feat/sistema-bunker` (publica el sitio) | ✅ |
| 10 | Prueba de humo **sin crear datos**: página y Formulario 1 desde un celular (fecha y hora correctas, sin avisos de pendiente), "Mi inscripción" con un documento inexistente ("No encontramos tu inscripción"), panel admin y *Revisar* | ✅ |

---

## 🟡 PENDING — de la organización

| # | Qué | Estado | Dónde se pone | Si no está |
|---|---|---|---|---|
| 2 | Enlace del grupo de WhatsApp | 🟡 PENDING | CONFIG `whatsapp_grupo_enlace` (un enlace `https://…`) | La plantilla 10 de invitación al grupo no aparece. Todo lo demás funciona |
| 3 | Punto exacto dentro del C.C. Mayorca (plazoleta, piso, entrada) — **opcional** | 🟡 PENDING | CONFIG `evento_direccion` | Los mensajes dicen "Centro Comercial Mayorca, Sabaneta, Antioquia" |
| 4 | Dominio propio — **opcional** | 🟡 PENDING | Ver [docs/DOMINIO-PROPIO.md](docs/DOMINIO-PROPIO.md) | Se usa la dirección de GitHub Pages |
| 5 | Revisión jurídica de los Términos y Condiciones v1 — **recomendada** | 🟡 PENDING | [legal/README.md](legal/README.md) | Los términos v1 los redactó el equipo técnico (24-sep), porque no venían entre los documentos entregados; no se tratan como documento contractual revisado |
| 6 | Logística de la sede: aforo, energía, sonido, evacuación, permisos | 🟡 PENDING | Pendiente de la organización | — |
| 7 | Piezas gráficas y publicaciones con la fecha y el lugar nuevos | 🟡 PENDING | Pendiente de la organización | — |

## 🟡 PENDING — operación antes del evento

| # | Qué | Estado | Quién | Cuándo |
|---|---|---|---|---|
| 8 | Entregar su enlace a cada una de las 10 cuentas, por un canal privado | 🟡 PENDING | `admin` | Tras el paso 8 del orden de publicación |
| 9 | Comprobar con `verAccesos` que ningún enlace vence antes de terminar la calificación | 🟡 PENDING | `admin` | Antes del evento |
| 10 | Ensayo con el equipo real en PRUEBAS (cada persona con su enlace de PRUEBAS) | 🟡 PENDING | Coordinación | Antes del evento |
| 11 | Probar el check-in **sin señal** en la sede real | 🟡 PENDING | Coordinación | Antes del 23-oct |
| 12 | Resolver agrupaciones repetidas y REVISIÓN antes de emitir códigos | 🟡 PENDING | Coordinación | Al cerrar los 100 |
| 13 | Revisar correos con dominio mal escrito (el formulario sugiere la corrección, pero no la impone) | 🟡 PENDING | Coordinación | Al cerrar los 100 |
| 14 | Descargar la carpeta de audio al computador del técnico y *Respaldar audios* | 🟡 PENDING | Coordinación + técnico | 22-oct |
| 15 | Respaldo *Pre-evento* + copia offline del XLSX | 🟡 PENDING | Coordinación | 22-oct |
| 16 | Hotspot y power banks | 🟡 PENDING | Producción | 22-oct |

> El cierre de cambios de horario **no** requiere acción: el Formulario 2 se
> cierra solo el **22 de octubre a las 6:00 p. m.** (CONFIG `cierre_cambios`).

---

## ✅ READY — construido y verificado

### Entornos e infraestructura
| Qué | Estado | Evidencia |
|---|---|---|
| Entorno de PRUEBAS separado (proyecto, hoja y carpetas propios, franja visible) | ✅ READY | En uso para la prueba en vivo del 25-sep |
| `ENSAYO` y `LIMPIAR` bloqueados fuera de PRUEBAS (doble llave: propiedad + marca de la hoja) | ✅ READY | Bloqueo en código |
| Producción rechaza correos `.test` | ✅ READY | Bloqueo en código |
| Sitio público | ✅ READY | https://miguelgamer77721-ui.github.io/el-bunker/ (se actualiza en el paso 9) |
| Publicación del sitio con pruebas previas | ✅ READY | GitHub Actions corre `npm test` antes de publicar |
| Despliegue sin clasp que conserva la URL `/exec` | ✅ READY | [docs/DESPLIEGUE.md](docs/DESPLIEGUE.md) |
| Migración que solo añade, con respaldo previo y control de filas | ✅ READY | `MIGRAR` |
| `web_app_url` en CONFIG y aviso en *Revisar* | ✅ READY | `web_app_url_ok` |
| Disparadores: respaldo diario 23:00, vistas cada 6 h, videos cada hora | ✅ READY | Instalados por `INSTALAR`/`MIGRAR` |

### Datos legales
| Qué | Estado |
|---|---|
| Responsable: Corporación Socio cultural El Arte es la Solución · NIT 901292696 · representante legal Jeison Duval Mazo Castañeda | ✅ READY — confirmado por la organización el 24-sep |
| Dirección y canal físico de reclamos: Corredor Juvenil, Casa de la Cultura La Barquereña, Calle 68 Sur #42-40, Sabaneta, Antioquia | ✅ READY |
| Correo El.arterslasolucion@gmail.com · teléfono 304 232 8502 | ✅ READY |
| Política de tratamiento de datos v2-2026-09-24 (Ley 1581 de 2012) | ✅ READY |
| Términos y Condiciones v1-2026-09-24 | ✅ READY (revisión jurídica recomendada, punto 5) |
| Versión de términos, política y responsable sellada en cada aceptación | ✅ READY |

### Inscripción y participante
| Qué | Estado |
|---|---|
| Formulario 1: solista, dúo (2) y agrupación (3–15) | ✅ READY |
| Edad 18–30 al 23 de octubre y residencia en Sabaneta | ✅ READY |
| Duplicados: documento duro; correo y teléfono, alerta | ✅ READY |
| Agrupación = un proyecto = un cupo, con GRP y clave | ✅ READY |
| Autorización individual de cada integrante con firma dibujada | ✅ READY — probado en vivo |
| Aviso de agrupaciones con nombre equivalente (decide una persona) | ✅ READY |
| "Mi inscripción": estado, código, horario, pista, video, agrupación | ✅ READY — probado en vivo |
| Subida de pistas (máx. 15 MB, renombradas, sin borrar la anterior) | ✅ READY — probado en vivo con 5, 14 y 16 MB (esta última rechazada) |
| Comprobación de videos (YouTube, Vimeo, Drive; IG/TikTok para revisión manual) | ✅ READY |
| Formulario 2: una solicitud por código, hasta el 22-oct 18:00 | ✅ READY — probado en vivo |
| Protección contra abuso: campo trampa, tiempo mínimo, límite por minuto y por documento | ✅ READY |
| CAPTCHA | ⚪ NO IMPLEMENTADO — decisión declarada |

### Operación
| Qué | Estado |
|---|---|
| Panel con 7 pestañas (Inscritos, Agrupaciones, Cerrar los 100, Cambios, Pistas, Comunicación, Respaldo y sistema) | ✅ READY |
| Emisión de códigos B-001…B-100 idempotente | ✅ READY |
| 9 plantillas de mensajes + la del grupo de WhatsApp cuando exista el enlace | ✅ READY |
| WhatsApp con envío humano (botón *Abrir chat*) y contactos `.vcf` | ✅ READY |
| Constancia imprimible por agrupación con firmas digitales y líneas para firmar en papel | ✅ READY — probado en vivo |
| Check-in por código, documento o documento de un integrante | ✅ READY — probado en vivo |
| Estados PRECOLA / EN AUDICIÓN / REALIZADA para el stage manager | ✅ READY |
| Lista de pistas en orden de agenda para el técnico de audio | ✅ READY |
| **Check-in sin internet, con cola de sincronización** | ✅ READY |
| Plan de contingencia según el tiempo real restante | ✅ READY |
| Cierre de jornada 9:00 p. m. | ✅ READY |
| 10 cuentas personales con vencimiento y revocación | ✅ READY |

### Evaluación y resultados
| Qué | Estado |
|---|---|
| 3 jurados independientes; solo se califica lo REALIZADO | ✅ READY — probado en vivo con dos jurados |
| Rúbrica de 8 factores, pesos = 100, escala 1–10 | ✅ READY |
| Mínimo 2 tarjetas válidas para entrar al ranking | ✅ READY |
| Top 7 con desempate Performance → Talento → Identidad | ✅ READY |
| Empate en el corte → acta del comité en el dashboard | ✅ READY |
| *Calcular resultados* explica quién queda fuera del ranking y por qué | ✅ READY |
| Dashboard con hora simulada para ensayar | ✅ READY |

### Datos y respaldos
| Qué | Estado |
|---|---|
| Respaldo con etiqueta (XLSX con agrupaciones plegables + JSON) | ✅ READY |
| Restauración desde JSON con `RESTAURAR` | ✅ READY — probada en vivo el 25-sep |
| Respaldo de audios | ✅ READY |
| Columnas en texto plano (cédulas, teléfonos, horas, fechas) | ✅ READY — corregido tras encontrarlo en vivo |
| Bitácora `_LOG` sin datos personales | ✅ READY |

### Pruebas
| Qué | Estado |
|---|---|
| 322 pruebas automáticas (74 core + 32 dataset + 47 iteración 2 + 108 integración + 61 integración iteración 2) | ✅ READY — `npm test` |
| Prueba de punta a punta en PRUEBAS, navegador anónimo | ✅ READY — inscripción solista y agrupación, integrante con firma, Mi inscripción, pistas, cambio de horario, check-in, jurados, dashboard, constancia, respaldo y restauración, LIMPIAR, ENSAYO |

---

## Documentación para el equipo

- [INICIO-RAPIDO.md](INICIO-RAPIDO.md) — una página.
- [docs/MANUAL-OPERACION.md](docs/MANUAL-OPERACION.md) — manual completo.
- [docs/MANUAL-RECUPERACION.md](docs/MANUAL-RECUPERACION.md) — cuando algo falla.
