"""Crops selected screenshots to report-sized images in docs/review/report/img."""
from pathlib import Path
from PIL import Image

SRC = Path('docs/review/screens')
OUT = Path('docs/review/report/img')
OUT.mkdir(parents=True, exist_ok=True)
# name, max height in source pixels (crop from top), target width
picks = [
    ('landing-dark-1280', 1100, 1100), ('landing-light-390', 1500, 420), ('picker-light-1280', 760, 1100),
    ('thabo-consent-dark-390', 1700, 420), ('thabo-home-dark-1280', 1400, 1100), ('lerato-home-light-1280', 1400, 1100),
    ('ayanda-home-dark-1280', 1400, 1100), ('ayanda-home-light-390', 1700, 420), ('thabo-home-light-390', 1700, 420),
    ('thabo-why-drawer-dark-1280', 900, 1100), ('thabo-plan-dark-1280', 1000, 1100), ('lerato-money-light-1280', 1000, 1100),
    ('ayanda-import-sample-light-1280', 1300, 1100), ('lerato-inbox-dark-1280', 800, 1100), ('thabo-privacy-light-1280', 1400, 1100),
    ('thabo-privacy-review-dark-1280', 900, 1100), ('ayanda-me-dark-1280', 1000, 1100), ('thabo-privacy-delete-light-390', 1200, 420),
    ('ayanda-plan-light-390', 1700, 420), ('lerato-home-dark-768', 1500, 700),
]
for name, max_h, width in picks:
    p = SRC / f'{name}.png'
    if not p.exists():
        print('missing', name)
        continue
    im = Image.open(p).convert('RGB')
    im = im.crop((0, 0, im.width, min(im.height, max_h)))
    if im.width > width:
        im = im.resize((width, int(im.height * width / im.width)), Image.LANCZOS)
    im.save(OUT / f'{name}.jpg', quality=82, optimize=True)
print('done', len(list(OUT.glob('*.jpg'))))
