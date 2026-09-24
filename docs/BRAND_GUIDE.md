# Guía de marca — EL BÚNKER by Arte es la Solución

> **Cuando llegue el manual de marca completo, prevalece sobre esta guía.** Esta guía se armó con el material
> parcial entregado el 2026-09-24 (logo, wordmark, hoja de colores y hoja de tipografías) y deja marcado como
> **provisional** todo lo que un manual oficial debería definir. Qué falta: `assets/brand/BRAND_MANUAL_PENDING.txt`.

## 1. Identidad

| | |
|---|---|
| **Marca madre** | Corporación Socio cultural El Arte es la Solución |
| **Proyecto** | EL BÚNKER by Arte es la Solución |
| **Lema** | *Creemos en tu talento.* |
| **Personalidad** | Urbana · artística · contundente · sobria · juvenil · profesional |
| **Redes** | Instagram [@aesproducciones_](https://www.instagram.com/aesproducciones_/) (tomado del wordmark entregado) |

**La interfaz debe parecer una convocatoria artística, no un panel administrativo.** Ver §7.

## 2. Logo de la Corporación

Archivo original: `assets/brand/logo-arte-es-la-solucion.png` (PNG 5000×5000, fondo transparente fuera del anillo).
Anillo exterior negro, texto "EL ARTE / LA SOLUCIÓN" y disco negro con monograma blanco.

**Reglas**

1. **Siempre en sus colores originales.** No se recolorea, no se invierte, no se pone en ámbar, no se le aplican
   sombras ni efectos. Los derivados sólo se escalan (y se verificó que no se cuantizan: la cuantización a paleta
   desplazaba hasta 8 niveles los grises planos, y eso ya sería recolorear).
2. **Sobre fondo oscuro va dentro de un disco blanco** (insignia). El disco deja ver el anillo exterior negro, que
   sobre #1D1D1B se perdería. Derivados listos: `site/assets/brand/logo-badge-{128,256,512}.png`.
3. **Sobre fondo blanco** se usa el original tal cual.
4. **Espacio de protección (provisional):** alrededor del logo, libre de texto e imágenes, al menos el **10 % de su
   diámetro**. La insignia ya incluye un margen blanco del 4,5 % por lado.
5. **Tamaño mínimo (provisional):** **64 px** en pantalla cuando el nombre del anillo debe leerse. Entre 32 y
   48 px sólo funciona como identificador (cabecera del sitio, favicon): el texto del anillo deja de leerse.
   El tamaño mínimo impreso lo debe fijar el manual.
6. No se inventa otro logo ni se recorta el monograma como logo alternativo sin aprobación de la organización.

## 3. Wordmark EL BÚNKER

Archivo original: `assets/brand/wordmark-bunker.png` — "BUNKER" dibujado a mano, subrayado, y "@aesproducciones_"
debajo, negro sobre blanco (1072×592).

**Derivados** (`site/assets/brand/`):

| Archivo | Contenido | Uso |
|---|---|---|
| `wordmark-white.png` | sólo la palabra dibujada, blanco sobre transparente | fondos oscuros (hero del sitio, imagen social) |
| `wordmark-black.png` | sólo la palabra dibujada, `#1D1D1B` sobre transparente | fondos blancos o ámbar (bloque de cierre) |
| `wordmark-full-white.png` / `wordmark-full-black.png` | palabra + "@aesproducciones_" | piezas donde deba ir el usuario de Instagram |

**Cómo se hicieron:** la luminancia del original se convirtió en transparencia, así que cada trazo conserva su forma
exacta; después se rellenó con un solo color. **Es un negativo de un color del wordmark entregado** (versión blanca) —
la organización no entregó versión en negativo. En la versión "sólo palabra" se retiró la línea
"@aesproducciones_" (zona medida en el original); no se tocó ningún trazo de la palabra.

**Reglas**

- El wordmark no incluye "EL": en el sitio y en la imagen social "EL" se compone en Bebas Neue encima de la palabra,
  y el texto accesible de la imagen es "EL BÚNKER".
- Sólo en blanco, en `#1D1D1B` o en su negro original. Nunca en ámbar, nunca con contorno ni sombra.
- No se redibuja ni se "limpia" el trazo: la textura a mano es la identidad.

## 4. Paleta

Fuente: `assets/brand/referencia-paleta.png` (valores tal como aparecen en la hoja).

| Color | HEX | RGB | CMYK (hoja) | Rol |
|---|---|---|---|---|
| Ámbar | `#F7A705` | 247 · 167 · 5 | 1 % · 40 % · 96 % · 0 % | acento: botón principal, fecha, cifras, lema |
| Negro | `#1D1D1B` | 29 · 29 · 27 | 0 % · 0 % · 0 % · 100 % | fondo principal, texto sobre claro |
| Blanco | `#FFFFFF` | 255 · 255 · 255 | 0 % · 0 % · 0 % · 0 % | texto sobre oscuro, secciones de lectura |

**No hay más colores.** Sólo se usan tintes (mezclas con transparencia) de estos tres:

| Token CSS | Valor | Qué es |
|---|---|---|
| `--on-dark-muted` | `#C6C6C6` | blanco al 75 % sobre negro |
| `--on-light-muted` | `#4F4F4D` | negro al 78 % sobre blanco |
| `--black-raised` | `#2B2B29` | blanco al 6 % sobre negro (superficie elevada) |
| `--amber-tint` | `#FEF4E1` | ámbar al 12 % sobre blanco (recuadros de nota) |
| `--row-tint` | `#F6F6F6` | negro al 4 % sobre blanco (filas alternas) |
| `--line-dark` / `--line-light` | `rgba(255,255,255,.18)` / `rgba(29,29,27,.16)` | líneas divisorias (no son texto) |

### Contraste (WCAG 2.x)

Calculado con la fórmula de luminancia relativa de WCAG para cada par texto/fondo que usa el sitio.
Mínimo AA: 4,5:1 texto normal · 3:1 texto grande y componentes de interfaz.

| Par | Primer plano | Fondo | Ratio | AA normal | AA grande / UI |
|---|---|---|---|---|---|
| Blanco sobre negro (cuerpo y títulos en oscuro, botón secundario, footer) | `#FFFFFF` | `#1D1D1B` | **16,88:1** | sí | sí |
| Negro sobre blanco (secciones claras, tarjetas, páginas legales) | `#1D1D1B` | `#FFFFFF` | **16,88:1** | sí | sí |
| Ámbar sobre negro (lema, cifras, números de pasos, "Aviso importante") | `#F7A705` | `#1D1D1B` | **8,43:1** | sí | sí |
| Negro sobre ámbar (INSCRÍBETE, tarjeta de fecha, bloque de cierre, etiqueta PENDIENTE) | `#1D1D1B` | `#F7A705` | **8,43:1** | sí | sí |
| Gris claro sobre negro (textos secundarios, navegación, footer) | `#C6C6C6` | `#1D1D1B` | **9,88:1** | sí | sí |
| Gris sobre blanco (etiquetas, notas, numeración de cláusulas) | `#4F4F4D` | `#FFFFFF` | **8,21:1** | sí | sí |
| Blanco sobre negro elevado ("Cómo será la audición") | `#FFFFFF` | `#2B2B29` | **14,19:1** | sí | sí |
| Gris claro sobre negro elevado | `#C6C6C6` | `#2B2B29` | **8,31:1** | sí | sí |
| Negro sobre ámbar claro (recuadros de nota) | `#1D1D1B` | `#FEF4E1` | **15,47:1** | sí | sí |
| Negro sobre gris de fila alterna | `#1D1D1B` | `#F6F6F6` | **15,62:1** | sí | sí |
| Gris sobre gris de fila alterna | `#4F4F4D` | `#F6F6F6` | **7,60:1** | sí | sí |
| Foco: contorno ámbar sobre negro / negro sobre blanco y ámbar | — | — | **8,43 – 16,88:1** | — | sí |
| **Prohibido:** ámbar sobre blanco | `#F7A705` | `#FFFFFF` | 2,00:1 | NO | NO |
| **Prohibido:** blanco sobre ámbar | `#FFFFFF` | `#F7A705` | 2,00:1 | NO | NO |

**Consecuencia práctica:** el ámbar nunca es texto sobre blanco ni fondo de texto blanco. Sobre superficies claras
el ámbar sólo aparece como bloque (con texto negro encima) o como decoración (viñetas, subrayados, barras).

## 5. Tipografía

| Rol (hoja oficial) | Fuente oficial | Sustituta web en uso | Por qué esa |
|---|---|---|---|
| Títulos | **Dopestyle** (script de pincel) | **Kaushan Script** — sólo como acento (lema "Creemos en tu talento.") | script de pincel libre, de trazo similar; se usa poco para no cansar la lectura |
| Subtítulos | **Bebas KAI** (condensada, mayúsculas) | **Bebas Neue** — titulares, botones, tarjetas | misma familia Bebas (Dharma Type): comparte el esqueleto condensado en mayúsculas |
| Textos | **Futura Medium BT** (+ itálica) | **Jost** 400–600 (+ itálica) | geométrica inspirada en Futura, muy legible en pantalla |

**Por qué sustitutas:** Dopestyle y Futura Medium BT son fuentes comerciales, y de ninguna de las tres fuentes
oficiales (tampoco de Bebas KAI) se entregaron los archivos ni una licencia de uso web. Publicarlas sin licencia no es
una opción.

**Procedencia y licencia** (todas **SIL Open Font License 1.1**, que permite usarlas, autoalojarlas y distribuirlas):

| Fuente | Web (woff2, subconjunto latino) | Archivo para imágenes (TTF) | Licencia |
|---|---|---|---|
| Bebas Neue (Dharma Type) | `fonts.gstatic.com/s/bebasneue/v16/JTUSjIg69CK48gW7PXoo9WlhyyTh89Y.woff2` | `github.com/google/fonts` → `ofl/bebasneue/BebasNeue-Regular.ttf` | `OFL-BebasNeue.txt` |
| Jost (Indestructible Type) | `fonts.gstatic.com/s/jost/v20/92zatBhPNqw73oTd4jQmfxI.woff2` · itálica `…/92zUtBhPNqw73oHt4D4hXRAy7g.woff2` | `ofl/jost/Jost[wght].ttf` · `Jost-Italic[wght].ttf` | `OFL-Jost.txt` |
| Kaushan Script (Pablo Impallari) | `fonts.gstatic.com/s/kaushanscript/v19/vm8vdRfvXFLG3OLnsO15WYS5DG74wNJVMJ8b.woff2` | `ofl/kaushanscript/KaushanScript-Regular.ttf` | `OFL-KaushanScript.txt` (nombre reservado "Kaushan Script") |

- Las URLs woff2 salen del CSS oficial de Google Fonts
  (`fonts.googleapis.com/css2?family=Bebas+Neue&family=Jost:ital,wght@0,400..700;1,400..700&family=Kaushan+Script`).
  El subconjunto latino cubre todo el español (á é í ó ú ñ ü ¿ ¡).
- **Autoalojadas:** `site/assets/fonts/` (con sus textos OFL al lado). El sitio no depende de ningún CDN de fuentes.
- TTF para generar imágenes (Pillow): `assets/brand/fonts/`.
- Cuando la organización entregue las fuentes oficiales **con licencia web**, se reemplazan en `@font-face`
  (`site/assets/estilos.css`) sin tocar el HTML.

**Escala en el sitio:** titulares en Bebas Neue, mayúsculas, entre 2,4 y 5,4 rem; cuerpo Jost 17 px, interlineado 1,6;
etiquetas en Jost 600 con espaciado amplio; script sólo en el lema.

## 6. Imagen social y favicons

- `og-image.png` (1200×630): fondo `#1D1D1B`, logo en su insignia blanca, "EL" + wordmark blanco,
  "BY ARTE ES LA SOLUCIÓN", lema en ámbar, y la franja "CONVOCATORIA ABIERTA · VIERNES 23 DE OCTUBRE ·
  3:00–9:00 P. M. · CENTRO COMERCIAL MAYORCA, SABANETA". **El texto sale de `site/config.json`**: si cambian fecha,
  hora o lugar, se regenera con `python3 assets/build_brand_assets.py`.
- Favicons (logo sobre blanco): `favicon.ico` (16/32/48), `favicon-32.png`, `apple-touch-icon.png` (180),
  `icon-192.png`, `icon-512.png` (el logo ocupa el 78 %, dentro de la zona segura de iconos "maskable"),
  `site.webmanifest`. A 16 px el texto del anillo no se lee; queda como disco reconocible.

## 7. Reglas de interfaz

**La interfaz debe parecer una convocatoria artística, no un panel administrativo.**

- **Jerarquía de cartel:** una idea por bloque, titulares grandes en Bebas Neue, fecha/hora/lugar en tarjetas, nunca
  como cadena técnica ("23/10/2026 15:00-21:00").
- **Cifras con palabras:** "100 cupos", "de 18 a 30 años", "3 jurados", "8 seleccionados" — nunca números sueltos
  pegados ni tableros de estadísticas.
- **Sin tablas técnicas en la home.** La tabla de bloques vive sólo en *Reglas de la convocatoria*.
- **Sin emojis como iconos.** Los acentos son bloques, barras y viñetas en ámbar.
- **Ritmo de superficies:** negro (portada y secciones de acción) · blanco (lectura) · ámbar (llamada final).
  Nada de grises "de sistema".
- **Móvil primero:** todo se diseña a 390 px; sin desplazamiento horizontal; botones principales de 54 px de alto y ningún control por debajo de 42 px.
- **Accesibilidad:** contraste AA (tabla §4), enlace "Saltar al contenido", foco visible, estructura semántica,
  respeto de "reducir movimiento".
- **Datos pendientes a la vista:** cualquier valor que empiece por `PENDIENTE` se muestra como una etiqueta ámbar
  "PENDIENTE DE COMPLETAR"; nunca se inventa el dato.

## 8. Dónde vive cada cosa

| Qué | Dónde |
|---|---|
| Originales entregados (logo, wordmark, paleta, tipografía) | `assets/brand/` |
| Qué falta del manual | `assets/brand/BRAND_MANUAL_PENDING.txt` |
| TTF para imágenes + licencias | `assets/brand/fonts/` |
| Script que genera los derivados | `assets/build_brand_assets.py` |
| Derivados web (insignias, wordmarks, favicons, OG, manifest) | `site/assets/brand/` |
| Fuentes web + licencias | `site/assets/fonts/` |
| Estilos (tokens de color y tipografía) | `site/assets/estilos.css` |
| Datos públicos (fecha, lugar, legales, enlaces, URL) | `site/config.json` — fuente única |
| Construcción del sitio | `node tools/construir-sitio.js` → `_site/` |
