"""Builds favicons and app icons from the supplied light mark.

The mark is only scaled and placed on a background; it is never redrawn.
Favicons and manifest icons are round (off-white circle, transparent corners).
The Apple touch icon stays square because iOS applies its own rounded mask.

Run: pip install pillow && python3 scripts/make-icons.py
"""
from pathlib import Path

from PIL import Image, ImageDraw

SRC = Path('assets/brand/tengo-mark-on-light.png')
OUT = Path('public/icons')
BG = (238, 235, 230, 255)  # off-white #EEEBE6
SUPERSAMPLE = 4


def place_mark(canvas: Image.Image, mark: Image.Image, width_ratio: float) -> None:
    """Scales the mark to a share of the canvas width and centres it."""
    size = canvas.width
    w = round(size * width_ratio)
    h = round(mark.height * w / mark.width)
    scaled = mark.resize((w, h), Image.LANCZOS)
    canvas.alpha_composite(scaled, ((size - w) // 2, (size - h) // 2))


def round_icon(mark: Image.Image, size: int) -> Image.Image:
    big = size * SUPERSAMPLE
    canvas = Image.new('RGBA', (big, big), (0, 0, 0, 0))
    disc = Image.new('L', (big, big), 0)
    ImageDraw.Draw(disc).ellipse((0, 0, big - 1, big - 1), fill=255)
    canvas.paste(Image.new('RGBA', (big, big), BG), (0, 0), disc)
    # A circle has less room in the corners, so the mark sits a little smaller than on a square.
    place_mark(canvas, mark, 0.6)
    return canvas.resize((size, size), Image.LANCZOS)


def square_icon(mark: Image.Image, size: int) -> Image.Image:
    big = size * SUPERSAMPLE
    canvas = Image.new('RGBA', (big, big), BG)
    place_mark(canvas, mark, 0.7)
    return canvas.resize((size, size), Image.LANCZOS).convert('RGB')


def main() -> None:
    mark = Image.open(SRC).convert('RGBA')
    OUT.mkdir(parents=True, exist_ok=True)
    for name, size in {'favicon-32.png': 32, 'favicon-64.png': 64, 'icon-192.png': 192, 'icon-512.png': 512}.items():
        round_icon(mark, size).save(OUT / name, optimize=True)
    square_icon(mark, 180).save(OUT / 'apple-touch-icon.png', optimize=True)
    print(f'Icons written to {OUT}')


if __name__ == '__main__':
    main()
