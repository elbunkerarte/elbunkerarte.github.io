# EL BÚNKER by Arte es la Solución — sistema de convocatoria

Sistema completo para la convocatoria de audiciones del **viernes 2 de octubre de
2026** en Sabaneta, Antioquia: 100 participantes, 10 bloques, 3 minutos por
audición, 3 jurados, 7 seleccionados.

| | |
|---|---|
| **Sitio público** | https://miguelgamer77721-ui.github.io/el-bunker/ |
| **Aplicación** | Google Apps Script Web App (URL en `site/config.json`) |
| **Base de datos** | Google Sheets — 14 hojas |
| **Costo** | $0 |
| **Pruebas** | `npm test` — 97 pruebas |

## Qué hace

Inscripción con validación real → detección de duplicados → emisión de los 100
códigos → agenda por bloques → solicitudes de cambio de horario → check-in con
soporte sin internet → evaluación de tres jurados → Top 7 con desempate
documentado → dashboard, exportación XLSX y respaldos.

## Arquitectura en una línea

```
GitHub Pages (público, estático)  →  Apps Script Web App (servidor)  →  Google Sheets (datos)
     mini-página · términos              formularios · admin              REGISTRO es la
     política · contacto                 check-in · jurado                única fuente de
     URL corta para el QR                dashboard · respaldos            verdad
```

Por qué esta y no otra: **[docs/DECISION-ARQUITECTURA.md](docs/DECISION-ARQUITECTURA.md)**
(compara GitHub Pages solo, Drive como base de datos, Google Forms y backends
gratuitos, y dice qué requisito descarta cada uno).

## Documentación

| Documento | Para quién |
|---|---|
| **[Manual de operación](docs/MANUAL-OPERACION.md)** | El coordinador y el equipo. Sin tecnicismos. |
| [Decisión de arquitectura](docs/DECISION-ARQUITECTURA.md) | Quien quiera saber por qué está hecho así |
| [Despliegue](docs/DESPLIEGUE.md) | Instalar o migrar el sistema |
| [Esquema de datos](docs/SCHEMA.md) | Las 14 hojas y sus columnas |
| [Criterios de aceptación](docs/CRITERIOS-ACEPTACION.md) | Qué debe cumplir y cómo se verifica |
| **[Checklist de lanzamiento](CHECKLIST-LANZAMIENTO.md)** | READY / PENDING antes de abrir inscripciones |

## Estructura

```
apps-script/           código de la aplicación
  000_instalar.gs      punto de entrada de instalación
  0*_core_*.gs         lógica pura: validación, códigos, agenda, rúbrica, estados
  1*_*.gs              acceso a datos, tokens y permisos, bitácora
  2*_*.gs              router HTTP y endpoints por rol
  3*_*.gs              vistas, exportación, respaldos, mensajes
  4*_*.gs              instalación y dataset de prueba
  ui_*.html            pantallas
site/                  sitio público (GitHub Pages)
config/                plantillas de configuración (legal.json, env)
test/                  banco de pruebas
tools/                 empaquetador y utilidades
build/                 artefacto de despliegue (generado)
docs/                  documentación
```

## Desarrollo

```bash
npm test                      # 97 pruebas sobre la lógica de dominio
node tools/empaquetar.js      # genera build/Codigo.gs para desplegar
```

Los archivos `0*_core_*.gs` son **funciones puras**: no tocan Google, y el banco
de pruebas ejecuta **exactamente ese texto** dentro de Node. No hay una segunda
implementación que pueda divergir de la desplegada.

## Decisiones que conviene conocer antes de tocar el código

- **REGISTRO es la única fuente de verdad.** AGENDA, CHECK-IN, RESULTADOS y
  DASHBOARD se reconstruyen desde ella.
- **Un código emitido no se reasigna, no se reutiliza y no cambia nunca** — ni
  siquiera cuando el participante cambia de horario.
- **Duplicado por documento** es duplicado duro; **por correo o teléfono** es solo
  una alerta (la gente comparte número).
- **Nada se borra en silencio.** Todo se marca y se conserva.
- **Ningún dato legal se inventa**: razón social, NIT, domicilio, correos y
  cláusulas jurídicas son `PENDIENTE DE COMPLETAR` hasta que alguien los apruebe.
- **Nunca se automatiza WhatsApp.** El sistema redacta; una persona envía.

## Licencia

Uso interno de la organización responsable de la convocatoria.
