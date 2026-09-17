# Checklist de lanzamiento — EL BÚNKER

Estado al **17 de septiembre de 2026**. El brief pide que *cada variable, enlace,
consentimiento y automatización tenga estado READY / PENDING*.

**Resumen: la máquina está READY. Lo PENDING son decisiones de la organización
que ningún sistema puede tomar por ella.**

---

## 🔴 BLOQUEANTES — no abrir inscripciones sin esto

| # | Qué | Estado | Quién | Dónde se cambia |
|---|---|---|---|---|
| 1 | Razón social del responsable | 🔴 PENDING | Gerencia | CONFIG `legal_name` + `site/config.json` |
| 2 | NIT | 🔴 PENDING | Gerencia | CONFIG `nit` |
| 3 | Domicilio legal | 🔴 PENDING | Gerencia | CONFIG `legal_address` |
| 4 | Correo para derechos de datos | 🔴 PENDING | Gerencia | CONFIG `data_protection_email` |
| 5 | Teléfono institucional | 🔴 PENDING | Gerencia | CONFIG `institutional_phone` |
| 6 | Términos: cláusulas jurídicas | 🔴 PENDING | Legal | `site/terminos.html` §10-12 |
| 7 | Política: finalidades y retención | 🔴 PENDING | Legal | `site/politica-datos.html` §3, §5, §6 |
| 8 | `consent_version` definitiva | 🔴 PENDING | Legal | CONFIG `consent_version` (`v1-PENDIENTE` → `v1`) |
| 9 | Publicar términos y política y poner sus URL | 🔴 PENDING | Gerencia | CONFIG `terms_url`, `privacy_policy_url` |
| 10 | Borrar los avisos amarillos de las páginas legales | 🔴 PENDING | Quien publique | `site/terminos.html`, `site/politica-datos.html` |

> **Por qué está así:** el brief lo exige — *"No inventes nombres legales, NIT,
> correos, permisos ni textos jurídicos específicos que no hayan sido aprobados"*.
> El sistema pinta estos valores en amarillo hasta que existan, para que nadie
> publique un placeholder por error.

---

## 🟡 ANTES DEL EVENTO

| # | Qué | Estado | Quién | Cuándo |
|---|---|---|---|---|
| 11 | Confirmar sede, aforo, energía, sonido, evacuación | 🟡 PENDING | Producción | Antes de anunciar dirección |
| 12 | Sede y dirección en CONFIG | 🟡 PENDING | Producción | Al confirmar |
| 13 | Revisar permisos/requisitos del municipio | 🟡 PENDING | Producción | Antes de publicar |
| 14 | Fecha/hora de cierre de cambios | 🟡 PENDING | Producción | CONFIG `cierre_cambios` |
| 15 | Entregar su enlace a cada persona del equipo | 🟡 PENDING | Coordinación | Antes del 28-sep |
| 16 | Poner en `_USUARIOS` la nota `jurado 1/2/3` | 🟡 PENDING | Coordinación | Antes del ensayo |
| 17 | Ensayo integral (función `ENSAYO`) | 🟡 PENDING | Coordinación | 28-sep |
| 18 | Limpiar los datos del ensayo | 🟡 PENDING | Coordinación | Tras el ensayo |
| 19 | Probar el check-in **sin señal** en la sede real | 🟡 PENDING | Coordinación | Antes del 2-oct |
| 20 | Respaldo + copia offline | 🟡 PENDING | Coordinación | 1-oct |
| 21 | Hotspot y power banks | 🟡 PENDING | Producción | 1-oct |
| 22 | Cerrar cambios (`cambios_abiertos=NO`) | 🟡 PENDING | Coordinación | 1-oct |

---

## ✅ READY — construido, desplegado y verificado

### Infraestructura
| Qué | Estado | Evidencia |
|---|---|---|
| Sitio público | ✅ READY | https://miguelgamer77721-ui.github.io/el-bunker/ — HTTP 200 |
| Aplicación web desplegada | ✅ READY | Versión 1, acceso *Cualquier usuario* |
| Base maestra, 14 hojas | ✅ READY | Creada por `INSTALAR` |
| Secretos fuera del repositorio | ✅ READY | Script Properties |
| Respaldo automático diario | ✅ READY | Disparador 23:00 |
| Refresco de vistas cada 6 h | ✅ READY | Disparador instalado |
| Publicación automática del sitio | ✅ READY | GitHub Actions, corre las pruebas antes |

### Formularios y flujo
| Qué | Estado |
|---|---|
| Mini-página con los 4 botones exigidos | ✅ READY |
| Formulario 1 con los 20 campos | ✅ READY |
| 4 consentimientos separados y registrables | ✅ READY |
| Versión del texto legal sellada por inscripción | ✅ READY |
| Validación de edad 18-28 al día del evento | ✅ READY |
| Validación de residencia | ✅ READY |
| Duplicados: documento duro, correo/teléfono alerta | ✅ READY |
| Idempotencia | ✅ READY — probada en producción |
| Formulario 2 con sus 4 reglas | ✅ READY |
| Códigos B-001…B-100 estables e irrepetibles | ✅ READY |
| Agenda de 10 bloques + contingencia | ✅ READY |

### Operación
| Qué | Estado |
|---|---|
| Panel de inscritos con filtros y búsqueda | ✅ READY |
| Emisión de códigos idempotente | ✅ READY |
| Aprobación/rechazo de cambios con control de cupo | ✅ READY |
| Check-in por código o documento | ✅ READY |
| **Check-in sin internet, con cola de sincronización** | ✅ READY |
| Regla de los 5 minutos | ✅ READY |
| Plan de contingencia según tiempo real restante | ✅ READY |
| Cierre 21:30 | ✅ READY |
| 7 estados de asistencia con transiciones validadas | ✅ READY |
| Incidentes | ✅ READY |

### Evaluación
| Qué | Estado |
|---|---|
| 3 paneles de jurado independientes y ciegos | ✅ READY |
| Rúbrica de 8 factores, pesos = 100 | ✅ READY |
| Tarjeta incompleta = inválida (no cero) | ✅ READY |
| Top 7 sobre audiciones realizadas | ✅ READY |
| Desempate Performance → Talento → Identidad | ✅ READY |
| Empate irresoluble → marca comité, no inventa | ✅ READY |
| Ranking completo no público | ✅ READY |

### Datos y reportes
| Qué | Estado |
|---|---|
| Dashboard con los 15 indicadores + 4 gráficos | ✅ READY |
| Exportación XLSX | ✅ READY |
| Respaldo XLSX + JSON con restauración | ✅ READY |
| Bitácora sin datos personales | ✅ READY |
| 7 plantillas de comunicación | ✅ READY |
| Enlaces de WhatsApp (envío humano) | ✅ READY |

### Seguridad
| Qué | Estado |
|---|---|
| 5 roles verificados en el router | ✅ READY |
| Enlaces firmados, con caducidad y revocables | ✅ READY |
| Jurado sin acceso a documento ni contacto | ✅ READY |
| Escritura serializada (candado) | ✅ READY |
| Escapado de salida | ✅ READY |
| No se piden fotos de cédula | ✅ READY |
| Rate limiting / CAPTCHA | ⚪ NO IMPLEMENTADO — decisión declarada |

### Pruebas
| Qué | Estado |
|---|---|
| 97 pruebas automáticas | ✅ READY — `npm test` |
| 18 casos del QA obligatorio | ✅ READY |
| Dataset de 130 → exactamente 100 códigos | ✅ READY |
| Inscripción real de extremo a extremo | ✅ VERIFICADO en producción |

---

## Orden sugerido

1. **Hoy:** gerencia entrega los 5 datos legales (#1-5).
2. **Hoy:** legal redacta las cláusulas (#6-8) y se publican (#9-10).
3. **Al confirmar sede:** #11-13.
4. **Con eso, se abre la convocatoria.**
5. **28-sep:** ensayo integral (#17) y limpieza (#18).
6. **1-oct:** respaldo, cerrar cambios, recordatorios (#20-22).
