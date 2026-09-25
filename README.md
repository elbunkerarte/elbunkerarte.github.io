# EL BÚNKER by Arte es la Solución — sistema de convocatoria

Sistema completo para la convocatoria de audiciones del **viernes 23 de octubre
de 2026, de 3:00 p. m. a 9:00 p. m., en el Centro Comercial Mayorca (Sabaneta,
Antioquia)**: 100 cupos, 10 bloques de 30 minutos, 3 minutos por audición,
3 jurados, 7 seleccionados. Solistas, dúos y agrupaciones (una agrupación = un
proyecto = un cupo).

| | |
|---|---|
| **Sitio público** | https://miguelgamer77721-ui.github.io/el-bunker/ |
| **Aplicación** | Google Apps Script Web App (URL `/exec` en `site/config.json` y en CONFIG `web_app_url`) |
| **Base de datos** | Google Sheets — 18 hojas ([esquema](docs/SCHEMA.md)) |
| **Costo** | $0 |
| **Pruebas** | `npm test` — 322 pruebas |
| **Versión** | 2.0.0 (iteración 2) |

## Qué hace

Inscripción con validación real (edad 18–30 al día del evento, residencia en
Sabaneta) → **agrupaciones**: el líder inscribe el proyecto y recibe un código
GRP-XXX con un enlace para que **cada integrante autorice por sí mismo con firma
dibujada** → aviso de agrupaciones con nombre equivalente (decide una persona) →
detección de duplicados → emisión de los 100 códigos → agenda por bloques →
**"Mi inscripción"**, donde cada participante consulta su estado, código y
horario y **sube su pista** → **comprobación de videos** (YouTube, Vimeo, Drive)
→ solicitudes de cambio de horario → check-in con soporte sin internet, precola,
escena y lista de pistas para el técnico de audio → constancia imprimible de
aceptación por agrupación → evaluación de tres jurados → Top 7 con desempate
documentado y acta del comité → dashboard, exportación XLSX y respaldos
restaurables.

**Lo que es automático y lo que no:** el sistema valida, ordena, calcula y
**redacta** los mensajes. Los mensajes de WhatsApp los **envía una persona**
desde el número oficial, y las decisiones que no se deshacen (emitir códigos,
aprobar cambios, cerrar la jornada, decidir un empate) las toma una persona. El
único envío automático es el correo de recepción de la inscripción.

## Arquitectura en una línea

```
GitHub Pages (público, estático)  →  Apps Script Web App (servidor)  →  Google Sheets (datos)
     página · reglas · términos          formularios · Mi inscripción      REGISTRO es la
     política · contacto                 admin · check-in · jurado          única fuente de
     URL corta para el QR                dashboard · respaldos              verdad
                                                   ↓
                                         Google Drive: pistas, firmas, respaldos
```

Por qué esta y no otra: **[docs/DECISION-ARQUITECTURA.md](docs/DECISION-ARQUITECTURA.md)**
(compara GitHub Pages solo, Drive como base de datos, Google Forms y backends
gratuitos, y dice qué requisito descarta cada uno).

## Documentación

| Documento | Para quién |
|---|---|
| **[Inicio rápido](INICIO-RAPIDO.md)** | Todo el equipo. Una página. |
| **[Manual de operación](docs/MANUAL-OPERACION.md)** | Coordinación y equipo. Sin tecnicismos. |
| **[Manual de recuperación](docs/MANUAL-RECUPERACION.md)** | Qué hacer cuando algo falla: restaurar, enlaces perdidos, datos mal escritos |
| **[Checklist de lanzamiento](CHECKLIST-LANZAMIENTO.md)** | READY / PENDING / BLOCKED y orden de publicación en producción |
| [Entornos](docs/ENTORNOS.md) | PRUEBAS y PRODUCCIÓN: cómo se distinguen y qué se bloquea |
| [Despliegue](docs/DESPLIEGUE.md) | Publicar una versión nueva, migrar, instalar desde cero |
| [Esquema de datos](docs/SCHEMA.md) | Las 18 hojas y sus columnas |
| [Mensajes de comunicación](docs/MENSAJES-COMUNICACION.md) | Textos para participantes |
| [Textos de formularios](docs/TEXTOS-FORMULARIOS.md) | Textos de las pantallas públicas |
| [Criterios de aceptación](docs/CRITERIOS-ACEPTACION.md) | Qué debe cumplir y cómo se verifica |
| [Decisión de arquitectura](docs/DECISION-ARQUITECTURA.md) | Quien quiera saber por qué está hecho así |
| [Auditoría de la iteración 2](docs/AUDITORIA-ITERACION-2.md) | Diagnóstico con el que empezó la iteración 2 |
| [Guía de marca](docs/BRAND_GUIDE.md) | Colores, tipografía y piezas |
| [Dominio propio](docs/DOMINIO-PROPIO.md) | Opcional: cómo poner un dominio propio |
| [Documentos legales](legal/README.md) | Origen y versiones de términos y política |

## Estructura

```
apps-script/           código de la aplicación
  000_instalar.gs      puntos de entrada del editor (INSTALAR, MIGRAR, VERIFICAR,
                       RESTAURAR, ENSAYO, LIMPIAR, QUITAR_PRUEBAS_PRELANZAMIENTO)
  0*_core_*.gs         lógica pura: validación, códigos, agenda, rúbrica, estados, medios
  1*_*.gs              acceso a datos, tokens y permisos, bitácora
  2*_*.gs              router HTTP y endpoints por rol
  3*_*.gs              vistas, exportación, respaldos, mensajes, pistas/firmas/videos
  4*_*.gs              instalación, migración y dataset de prueba
  ui_*.html            pantallas
site/                  sitio público (GitHub Pages; datos en site/config.json)
legal/                 texto canónico de los términos y su historial
config/                plantillas de configuración
test/                  banco de pruebas (con un emulador de Apps Script)
tools/                 empaquetador y constructor del sitio
build/                 artefacto de despliegue (generado)
docs/                  documentación
```

## Desarrollo

```bash
npm test                      # 322 pruebas (74 core + 32 dataset + 47 iteración 2
                              #   + 108 integración + 61 integración iteración 2)
node tools/empaquetar.js      # genera build/Codigo.gs para desplegar
```

Los archivos `0*_core_*.gs` son **funciones puras**: no tocan Google, y el banco
de pruebas ejecuta **exactamente ese texto** dentro de Node. Las pruebas de
integración corren el resto del código sobre un emulador de Apps Script
calibrado contra la hoja real. No hay una segunda implementación que pueda
divergir de la desplegada.

Además de las pruebas automáticas, la iteración 2 se probó de punta a punta en
el entorno de PRUEBAS desde un navegador anónimo (inscripción solista y
agrupación, integrante con firma, Mi inscripción, pistas de 5, 14 y 16 MB,
cambio de horario, check-in completo, jurados, dashboard, constancia, respaldo y
restauración, LIMPIAR y ENSAYO).

## Decisiones que conviene conocer antes de tocar el código

- **REGISTRO es la única fuente de verdad.** AGENDA, CHECK-IN, AGRUPACIONES,
  PISTAS, RESULTADOS y DASHBOARD se reconstruyen desde ella.
- **Un código emitido no se reasigna, no se reutiliza y no cambia nunca** — ni
  siquiera cuando el participante cambia de horario.
- **Una agrupación es un proyecto y ocupa un cupo.** Cada integrante autoriza por
  sí mismo; el líder no puede autorizar por otro. Si dos agrupaciones tienen un
  nombre equivalente, el sistema avisa y **una persona decide**: nunca fusiona
  solo.
- **Duplicado por documento** es duplicado duro; **por correo o teléfono** es solo
  una alerta (la gente comparte número).
- **Nada se borra en silencio.** Todo se marca y se conserva. Las funciones que
  borran o reemplazan datos (`LIMPIAR`, solo en PRUEBAS; `RESTAURAR`;
  `QUITAR_PRUEBAS_PRELANZAMIENTO`) exigen una confirmación explícita y dejan
  registro en `_LOG`.
- **Los datos legales son reales y están verificados:** razón social, NIT,
  representante legal, dirección, correo y teléfono los informó la organización y
  los confirmó el 24 de septiembre de 2026 (CONFIG `datos_legales_verificados` =
  `SI`). Nada legal se inventa.
- **Los Términos y Condiciones v1 los redactó el equipo técnico** porque la
  organización no entregó un documento fuente; ver [legal/README.md](legal/README.md).
  Se recomienda una revisión jurídica antes de tratarlos como documento
  contractual. La política de tratamiento de datos va en su versión
  v2-2026-09-24 (Ley 1581 de 2012).
- **Nunca se automatiza WhatsApp.** El sistema redacta y da un botón *Abrir chat*;
  una persona envía desde el número oficial.
- **Los entornos no se mezclan.** PRUEBAS y PRODUCCIÓN son proyectos y hojas
  distintos; las funciones que cargan datos falsos o borran solo corren en
  PRUEBAS, y producción rechaza inscripciones con correo `.test`.

## Licencia

Uso interno de la organización responsable de la convocatoria.
