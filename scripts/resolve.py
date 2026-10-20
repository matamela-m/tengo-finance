"""Merge finding resolutions into docs/review/after/resolutions.json. Usage: python3 scripts/resolve.py file.json
The input maps finding ids to [status, resolution]. Then run: node scripts/findings-status.mjs"""
import json
import sys

P = 'docs/review/after/resolutions.json'
data = json.load(open(P))
for k, (status, text) in json.load(open(sys.argv[1])).items():
    if '—' in text or '–' in text:
        raise SystemExit(f'dash in {k}')
    data[k] = {'status': status, 'resolution': text}
json.dump(dict(sorted(data.items())), open(P, 'w'), indent=1, ensure_ascii=False)
open(P, 'a').write('\n')
print(len(data), 'resolutions')
