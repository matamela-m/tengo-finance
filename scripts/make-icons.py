"""Builds the app's logo and icon files from the founder's brand folder (tengo-brand/).

The artwork is never redrawn or recoloured here: files are only scaled down (never up) and
re-saved, so the app ships small images instead of the full-size masters.

  public/brand/  lockups and marks for the Brand component, one per theme
  public/icons/  favicons, the Apple touch icon and the web app manifest icons
  public/favicon.ico

Run: pip install pillow && python3 scripts/make-icons.py
"""
import shutil
from pathlib import Path

from PIL import Image, ImageDraw

SRC = Path('tengo-brand')
BRAND = Path('public/brand')
ICONS = Path('public/icons')


def scaled(src: Path, width: int) -> Image.Image:
    im = Image.open(src)
    if im.width <= width:
        return im.copy()
    return im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)


def favicon(size: int) -> Image.Image:
    """The mark, large, on a dark square with rounded corners. Built at 8x, then scaled down."""
    big = size * 8
    tile = Image.new('RGBA', (big, big), (0, 0, 0, 0))
    ImageDraw.Draw(tile).rounded_rectangle((0, 0, big - 1, big - 1), radius=round(big * 0.24), fill=(23, 23, 23, 255))
    mark = scaled(SRC / 'png/tengo-mark-on-dark.png', round(big * 0.8))
    tile.alpha_composite(mark, ((big - mark.width) // 2, (big - mark.height) // 2))
    return tile.resize((size, size), Image.LANCZOS)


def main() -> None:
    BRAND.mkdir(parents=True, exist_ok=True)
    ICONS.mkdir(parents=True, exist_ok=True)
    # Shown at up to about 160 px wide, so 480 px covers 3x screens.
    for theme in ('light', 'dark'):
        scaled(SRC / f'png/tengo-horizontal-on-{theme}.png', 480).save(BRAND / f'tengo-horizontal-on-{theme}.png', optimize=True)
        scaled(SRC / f'png/tengo-mark-on-{theme}.png', 270).save(BRAND / f'tengo-mark-on-{theme}.png', optimize=True)
        # Square tile, used where the mark stands in for an avatar.
        scaled(SRC / f'icons/icon-{theme}-192.png', 96).save(BRAND / f'tengo-tile-{theme}.png', optimize=True)
    # The app opens in the dark theme, so its icons are the mark on dark.
    for size, name in ((180, 'apple-touch-icon.png'), (192, 'icon-192.png'), (512, 'icon-512.png')):
        shutil.copyfile(SRC / f'icons/icon-dark-{size}.png', ICONS / name)
    shutil.copyfile(SRC / 'icons/icon-maskable-512.png', ICONS / 'icon-maskable-512.png')
    # Browser tab icons: the mark fills most of the tile so it stays readable at 16 and 32 px.
    favicon(32).save(ICONS / 'favicon-32.png', optimize=True)
    favicon(64).save(ICONS / 'favicon-64.png', optimize=True)
    favicon(48).save(Path('public/favicon.ico'), sizes=[(16, 16), (32, 32), (48, 48)])
    print(f'Logo files written to {BRAND}, icons to {ICONS}')


if __name__ == '__main__':
    main()
