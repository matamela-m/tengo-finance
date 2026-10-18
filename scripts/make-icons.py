"""Builds placeholder favicons and app icons: the "T" mark from the Brand component.

A rounded square in the accent colour with a bold T. Placeholders until the new logo lands;
replace the files in public/icons (and the Brand component) when it does.

Run: pip install pillow && python3 scripts/make-icons.py
"""
from pathlib import Path

from PIL import Image, ImageDraw

OUT = Path('public/icons')
ACCENT = (114, 145, 255, 255)  # dark theme --accent
ON_ACCENT = (11, 11, 12, 255)  # dark theme --on-accent
SS = 4  # supersample for smooth edges


def t_glyph(draw: ImageDraw.ImageDraw, size: int, scale: float) -> None:
    """A geometric bold T, centred. scale is the T height as a share of the canvas."""
    h = size * scale
    w = h * 0.86
    bar = h * 0.24
    stem = h * 0.27
    x0 = (size - w) / 2
    y0 = (size - h) / 2
    r = bar * 0.22
    draw.rounded_rectangle((x0, y0, x0 + w, y0 + bar), radius=r, fill=ON_ACCENT)
    sx = (size - stem) / 2
    draw.rounded_rectangle((sx, y0, sx + stem, y0 + h), radius=r, fill=ON_ACCENT)


def icon(size: int, rounded: bool, scale: float) -> Image.Image:
    big = size * SS
    img = Image.new('RGBA', (big, big), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if rounded:
        d.rounded_rectangle((0, 0, big - 1, big - 1), radius=big * 0.28, fill=ACCENT)
    else:
        d.rectangle((0, 0, big, big), fill=ACCENT)
    t_glyph(d, big, scale)
    return img.resize((size, size), Image.LANCZOS)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name, size in {'favicon-32.png': 32, 'favicon-64.png': 64, 'icon-192.png': 192, 'icon-512.png': 512}.items():
        icon(size, rounded=True, scale=0.52).save(OUT / name, optimize=True)
    # Full bleed: iOS and Android apply their own mask. Keep the T inside the safe zone.
    icon(180, rounded=False, scale=0.5).convert('RGB').save(OUT / 'apple-touch-icon.png', optimize=True)
    icon(512, rounded=False, scale=0.42).convert('RGB').save(OUT / 'icon-maskable-512.png', optimize=True)
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">'
        '<rect width="64" height="64" rx="18" fill="#7291FF"/>'
        '<rect x="17.7" y="15.4" width="28.6" height="8" rx="1.8" fill="#0B0B0C"/>'
        '<rect x="27.5" y="15.4" width="9" height="33.3" rx="1.8" fill="#0B0B0C"/>'
        '</svg>\n'
    )
    (OUT / 'favicon.svg').write_text(svg)
    print(f'Placeholder icons written to {OUT}')


if __name__ == '__main__':
    main()
