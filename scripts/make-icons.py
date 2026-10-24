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

from PIL import Image

SRC = Path('tengo-brand')
BRAND = Path('public/brand')
ICONS = Path('public/icons')


def scaled(src: Path, width: int) -> Image.Image:
    im = Image.open(src)
    if im.width <= width:
        return im.copy()
    return im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)


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
    for size, name in ((32, 'favicon-32.png'), (180, 'apple-touch-icon.png'), (192, 'icon-192.png'), (512, 'icon-512.png')):
        shutil.copyfile(SRC / f'icons/icon-dark-{size}.png', ICONS / name)
    scaled(SRC / 'icons/icon-dark-1024.png', 64).save(ICONS / 'favicon-64.png', optimize=True)
    shutil.copyfile(SRC / 'icons/icon-maskable-512.png', ICONS / 'icon-maskable-512.png')
    shutil.copyfile(SRC / 'icons/favicon.ico', Path('public/favicon.ico'))
    print(f'Logo files written to {BRAND}, icons to {ICONS}')


if __name__ == '__main__':
    main()
