#!/usr/bin/env python3
"""
Builds the web derivatives of the brand assets delivered by the organization.

Sources (originals, never modified):
    assets/brand/logo-arte-es-la-solucion.png   Corporation logo, 5000x5000 RGBA
    assets/brand/wordmark-bunker.png            hand-drawn BUNKER wordmark, black on white
    assets/brand/fonts/*.ttf                    SIL OFL fonts used to render text
    site/config.json                            event data printed on the social image

Outputs (site/assets/brand/):
    logo-badge-{128,256,512}.png      logo in its ORIGINAL colours on a white disc
    wordmark-{white,black}.png        BUNKER mark only (no handle), transparent
    wordmark-full-{white,black}.png   mark + "@aesproducciones_", transparent
    favicon.ico (16/32/48), favicon-32.png, apple-touch-icon.png,
    icon-192.png, icon-512.png        all derived from the logo on white
    og-image.png                      1200x630 social card

Rules this script enforces (see docs/BRAND_GUIDE.md):
    * the logo is never recoloured: it is only scaled and placed on white;
    * the wordmark is converted to a one-colour mark by turning its luminance
      into alpha, so the drawn strokes keep their exact shape;
    * only the three palette colours are used.

Run with the Pillow environment:
    ~/asistente-autonomo/.venv-cv/bin/python assets/build_brand_assets.py
Re-run it whenever the date, time or venue change in site/config.json, because
the social image has that text burned in.
"""
import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets', 'brand')
FONTS = os.path.join(SRC, 'fonts')
OUT = os.path.join(ROOT, 'site', 'assets', 'brand')

BLACK = (0x1D, 0x1D, 0x1B)
WHITE = (0xFF, 0xFF, 0xFF)
AMBER = (0xF7, 0xA7, 0x05)

# Rows at or below this line, between these columns, belong to the handle
# "@aesproducciones_" and not to the BUNKER mark (measured on the original).
HANDLE_TOP_Y = 393
HANDLE_X0, HANDLE_X1 = 240, 900


def load_logo():
    logo = Image.open(os.path.join(SRC, 'logo-arte-es-la-solucion.png')).convert('RGBA')
    # Trim the transparent margin so "size" means the visible ring.
    return logo.crop(logo.getbbox())


def badge(logo, size, pad_ratio=0.045):
    """Logo on a white disc. The disc keeps the outer black ring visible on dark UI."""
    scale = 4  # supersample the disc edge
    big = size * scale
    canvas = Image.new('RGBA', (big, big), (0, 0, 0, 0))
    ImageDraw.Draw(canvas).ellipse((0, 0, big - 1, big - 1), fill=WHITE + (255,))
    inner = int(round(big * (1 - 2 * pad_ratio)))
    lg = logo.resize((inner, inner), Image.LANCZOS)
    off = (big - inner) // 2
    canvas.alpha_composite(lg, (off, off))
    return canvas.resize((size, size), Image.LANCZOS)


def on_white_square(logo, size, logo_ratio):
    canvas = Image.new('RGBA', (size, size), WHITE + (255,))
    inner = int(round(size * logo_ratio))
    lg = logo.resize((inner, inner), Image.LANCZOS)
    off = (size - inner) // 2
    canvas.alpha_composite(lg, (off, off))
    return canvas.convert('RGB')


def wordmark_alpha(include_handle):
    """Luminance -> alpha. Returns the alpha channel cropped to the drawn strokes."""
    grey = np.array(Image.open(os.path.join(SRC, 'wordmark-bunker.png')).convert('L')).astype(np.float32)
    alpha = 255.0 - grey
    if not include_handle:
        alpha[HANDLE_TOP_Y:, HANDLE_X0:HANDLE_X1] = 0
    alpha[alpha < 6] = 0  # drop scanner-level noise so the bbox is tight
    img = Image.fromarray(alpha.clip(0, 255).astype(np.uint8), 'L')
    box = img.getbbox()
    pad = 6
    box = (max(box[0] - pad, 0), max(box[1] - pad, 0),
           min(box[2] + pad, img.width), min(box[3] + pad, img.height))
    return img.crop(box)


def one_colour(alpha, rgb):
    out = Image.new('RGBA', alpha.size, rgb + (0,))
    out.putalpha(alpha)
    return out


def save_png(img, name, colors=None):
    path = os.path.join(OUT, name)
    if colors:
        img = img.quantize(colors=colors, method=Image.FASTOCTREE, dither=Image.NONE)
    img.save(path, optimize=True)
    return path


def font(name, size, weight=None):
    f = ImageFont.truetype(os.path.join(FONTS, name), size)
    if weight is not None:
        f.set_variation_by_axes([weight])
    return f


def hours_range(start, end):
    """'3:00 p. m.' + '9:00 p. m.' -> '3:00–9:00 P. M.' (shared suffix written once)."""
    s, e = start.strip(), end.strip()
    for suffix in ('p. m.', 'a. m.'):
        if s.endswith(suffix) and e.endswith(suffix):
            return (s[:-len(suffix)].strip() + '–' + e[:-len(suffix)].strip() + ' ' + suffix).upper()
    return (s + ' – ' + e).upper()


def draw_tracked(draw, xy, text, fnt, fill, tracking=0):
    """Draws text with extra letter spacing (Pillow has no native tracking)."""
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=fnt, fill=fill)
        x += draw.textlength(ch, font=fnt) + tracking
    return x


def tracked_width(draw, text, fnt, tracking=0):
    return sum(draw.textlength(ch, font=fnt) for ch in text) + tracking * (len(text) - 1)


def og_image(cfg, logo, mark_white):
    ev = cfg['evento']
    W, H = 1200, 630
    img = Image.new('RGBA', (W, H), BLACK + (255,))
    d = ImageDraw.Draw(img)

    # Left: the Corporation logo on its white badge, centred on the upper area.
    b = badge(logo, 270)
    img.alpha_composite(b, (66, 84))

    # Right: the EL BUNKER lock-up.
    x0 = 400
    el = font('BebasNeue-Regular.ttf', 56)
    d.text((x0, 44), 'EL', font=el, fill=WHITE)
    target_w = 610
    ratio = target_w / mark_white.width
    mark = mark_white.resize((target_w, int(mark_white.height * ratio)), Image.LANCZOS)
    img.alpha_composite(mark, (x0, 100))
    y = 100 + mark.height + 14
    by = font('BebasNeue-Regular.ttf', 40)
    draw_tracked(d, (x0 + 4, y), (ev['marca']).upper(), by, WHITE, tracking=3)
    y += 50
    script = font('KaushanScript-Regular.ttf', 36)
    d.text((x0 + 4, y), ev['lema'], font=script, fill=AMBER)

    # Bottom band: the call itself, in the order people read it.
    band_y = 452
    d.rectangle((0, band_y, W, band_y + 5), fill=AMBER)
    head = font('BebasNeue-Regular.ttf', 54)
    draw_tracked(d, (66, band_y + 22), 'CONVOCATORIA ABIERTA', head, AMBER, tracking=2)
    line = ' \u00b7 '.join([
        (ev['fecha_dia'] + ' ' + ev['fecha_texto']).upper(),
        hours_range(ev['hora_inicio'], ev['hora_fin']),
        (ev['lugar'] + ', ' + ev['municipio']).upper(),
    ])
    size = 44
    body = font('BebasNeue-Regular.ttf', size)
    while tracked_width(d, line, body, 1) > W - 132 and size > 30:
        size -= 1
        body = font('BebasNeue-Regular.ttf', size)
    draw_tracked(d, (66, band_y + 90), line, body, WHITE, tracking=1)
    return img.convert('RGB')


def main():
    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(ROOT, 'site', 'config.json'), encoding='utf-8') as fh:
        cfg = json.load(fh)

    logo = load_logo()
    written = []

    for size in (128, 256, 512):
        written.append(save_png(badge(logo, size), 'logo-badge-%d.png' % size))

    mark = wordmark_alpha(include_handle=False)
    full = wordmark_alpha(include_handle=True)
    mark_white = one_colour(mark, WHITE)
    written.append(save_png(mark_white, 'wordmark-white.png'))
    written.append(save_png(one_colour(mark, BLACK), 'wordmark-black.png'))
    written.append(save_png(one_colour(full, WHITE), 'wordmark-full-white.png'))
    written.append(save_png(one_colour(full, BLACK), 'wordmark-full-black.png'))

    # Favicons: the logo on a white disc (transparent corners) for tabs,
    # on a white square for platform icons that apply their own mask.
    ico_src = badge(logo, 256, pad_ratio=0.02)
    ico_path = os.path.join(OUT, 'favicon.ico')
    ico_src.save(ico_path, sizes=[(16, 16), (32, 32), (48, 48)])
    written.append(ico_path)
    written.append(save_png(badge(logo, 32, pad_ratio=0.02), 'favicon-32.png'))
    written.append(save_png(on_white_square(logo, 180, 0.86), 'apple-touch-icon.png'))
    # 0.78 keeps the whole ring inside the 80 % safe zone of maskable icons.
    written.append(save_png(on_white_square(logo, 192, 0.78), 'icon-192.png'))
    written.append(save_png(on_white_square(logo, 512, 0.78), 'icon-512.png'))

    og = og_image(cfg, logo, mark_white)
    written.append(save_png(og, 'og-image.png'))

    for p in written:
        with Image.open(p) as im:
            dims = '%dx%d' % im.size
        print('%-28s %-10s %7.1f KB' % (os.path.basename(p), dims, os.path.getsize(p) / 1024))
    return 0


if __name__ == '__main__':
    sys.exit(main())
