# Mover el sitio a un dominio propio o subdominio institucional

**Estado hoy:** el sitio vive en `https://elbunkerarte.github.io/` (organización de GitHub `elbunkerarte`, desde el
25-sep-2026). Esa dirección es la oficial hasta que la organización tenga su dominio. La anterior,
`https://miguelgamer77721-ui.github.io/el-bunker/`, dejó de ser la oficial al mover el repositorio.

> **No se registra ni se compra nada automáticamente.** El dominio lo elige, lo compra (o lo presta, si es un
> subdominio institucional) y lo administra la organización. Esta guía sólo explica cómo conectarlo cuando exista.

Fuente: documentación oficial de GitHub Pages,
<https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site> (consultada el 2026-09-24).

---

## 1. Qué tipo de dirección conviene

| Opción | Ejemplo conceptual | ¿Funciona con GitHub Pages? |
|---|---|---|
| **Subdominio** (recomendado) | `elbunker.dominio.co` | Sí. Un registro DNS `CNAME`. |
| **Dominio raíz** (apex) | `dominio.co` | Sí. Registros `A` y `AAAA` de GitHub. GitHub recomienda configurar también `www`. |
| **Ruta dentro de otra web** | `dominio.co/el-bunker` | **No directamente.** GitHub Pages sirve un host completo, no una carpeta de otro sitio. Sólo es posible si el servidor web de la organización redirige o hace de proxy hacia GitHub Pages. |

Los nombres de arriba son ejemplos: **no existe ningún dominio decidido.**

## 2. Una sola fuente de configuración

La dirección pública no está escrita en las páginas: sale de `site/config.json` y el build
(`node tools/construir-sitio.js`) la pone en la URL canónica, las etiquetas Open Graph (`og:url`, `og:image`), el
manifiesto y demás URLs absolutas. **Sólo cambian dos valores:**

```json
"sitio": {
  "url_publica": "https://elbunker.dominio.co/",
  "dominio_propio": "elbunker.dominio.co"
}
```

- `url_publica`: con `https://` y terminada en `/`.
- `dominio_propio`: sólo el host, sin `https://` ni rutas. Si está vacío no se escribe `CNAME`.
- El build se niega a continuar si `url_publica` no empieza por `https://<dominio_propio>/`.
- Con dominio propio el build escribe `_site/CNAME`. **Ojo:** este repositorio publica con un flujo propio de
  GitHub Actions y, según la documentación de GitHub, en ese caso *"no CNAME file is created, and any existing CNAME
  file is ignored and is not required"*. Lo que manda es el dominio configurado en **Settings → Pages** (paso 4).
  El archivo `CNAME` queda sólo como registro del valor.

## 3. Verificar el dominio (antes de conectarlo)

GitHub recomienda verificar el dominio para evitar que otra cuenta lo tome ("domain takeover").

1. En la cuenta dueña del repositorio: foto de perfil → **Settings** → **Pages** (en una organización:
   **Organization settings → Pages**) → **Add a domain**.
2. GitHub muestra un registro `TXT` con nombre de la forma `_github-pages-challenge-USUARIO.dominio.co`
   (`_github-pages-challenge-ORGANIZACION.dominio.co` si es una organización) y un valor. Crearlo en el DNS del dominio.
3. Esperar la propagación (puede tardar hasta 24 horas) y pulsar **Verify**. **No borrar** ese `TXT` después.
4. Al verificar un dominio quedan incluidos sus subdominios inmediatos.

## 4. Conectar el dominio

1. **Settings del repositorio → Pages → Custom domain:** escribir el dominio (`elbunker.dominio.co`) y **Save**.
2. En el DNS del dominio:
   - **Subdominio:** registro `CNAME` con nombre `elbunker` apuntando a **`elbunkerarte.github.io`**.
     Si el repositorio se mueve a otra cuenta u organización, el destino es `<esa-cuenta>.github.io`.
   - **Dominio raíz:** registros `A` hacia
     `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
     y registros `AAAA` hacia
     `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`.
     Agregar además `www` como `CNAME` a `elbunkerarte.github.io`.
   - **Nunca** usar registros comodín (`*.dominio.co`): GitHub advierte que exponen a la toma del dominio.
3. Esperar a que GitHub marque el DNS como correcto.
4. Marcar **Enforce HTTPS**. Puede tardar hasta 24 horas en estar disponible, mientras se emite el certificado.

## 5. Actualizar el sitio

1. Cambiar `sitio.url_publica` y `sitio.dominio_propio` en `site/config.json` (paso 2) y hacer push a la rama que
   publica. El flujo corre las pruebas, construye `_site/` y publica.
2. Comprobar en el navegador: la portada abre con `https://`, el candado es válido y "ver código fuente" muestra la
   URL canónica y `og:url` con el dominio nuevo.
3. Comprobar la vista previa social (pegar el enlace en WhatsApp): debe salir la imagen de la convocatoria.
4. **Comprobar la dirección anterior** `https://elbunkerarte.github.io/`: no se da por hecho que
   redirige al dominio nuevo; se abre y se verifica. Si algún material impreso o QR ya circula con la dirección
   anterior, no se desactiva hasta confirmar que lleva al sitio correcto.

## 6. Regenerar el código QR

El QR debe apuntar a la **URL pública nueva** (o a `https://<dominio>/inscripcion/` si se quiere que abra directo
el formulario). Generarlo de nuevo, probarlo con dos teléfonos distintos antes de imprimir y retirar las piezas con
el QR anterior sólo cuando el nuevo esté comprobado.

## 7. Los formularios no se mueven

Los formularios y la base de datos siguen en Google Apps Script (`script.google.com`). El dominio propio sólo cambia
la dirección del sitio informativo. Para que la gente vea siempre la marca, el sitio tiene **rutas cortas** que
redirigen al formulario correspondiente (el destino sale de `enlaces.*` en `site/config.json`):

| Ruta corta | Destino (`site/config.json`) |
|---|---|
| `/inscripcion/` | `enlaces.inscripcion` |
| `/mi-inscripcion/` | `enlaces.mi_inscripcion` |
| `/integrantes/` | `enlaces.integrantes` — conserva el enlace personal, p. ej. `?g=GRP-001&k=ABC123` |
| `/cambio-horario/` | `enlaces.cambio_horario` |

Las rutas cortas conservan cualquier parámetro de la dirección (con JavaScript activo). Si cambia la URL del
despliegue de Apps Script, se actualizan los cuatro `enlaces.*` y nada más.

## 8. Lista de comprobación

- [ ] La organización tiene el dominio o el subdominio institucional (y acceso a su DNS).
- [ ] Dominio verificado en GitHub (`TXT` creado y conservado).
- [ ] Dominio escrito en Settings → Pages; DNS correcto (`CNAME` para subdominio, `A`/`AAAA` para raíz); sin comodines.
- [ ] **Enforce HTTPS** activado.
- [ ] `sitio.url_publica` y `sitio.dominio_propio` actualizados; build y despliegue correctos.
- [ ] Canónica, `og:url` e imagen social con el dominio nuevo.
- [ ] Dirección anterior comprobada.
- [ ] QR regenerado y probado.
- [ ] Las cuatro rutas cortas abren su formulario.
