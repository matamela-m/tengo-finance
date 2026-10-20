"""Merges every reviewer's Findings table into docs/review/findings.csv. Read only on the role files."""
import csv
import re
from pathlib import Path

ROLES = [
    ('product-lead.md', 'Retail banking product lead'),
    ('technology.md', 'Head of technology'),
    ('security-privacy.md', 'Security and privacy lead'),
    ('legal.md', 'Legal and regulatory advisor'),
    ('credit-risk.md', 'Credit and finance risk analyst'),
    ('data-scientist.md', 'Data scientist'),
    ('ux.md', 'UI and UX designer'),
    ('accessibility.md', 'Accessibility specialist'),
    ('behavioural.md', 'Behavioural economist'),
    ('localisation.md', 'Localisation reviewer'),
    ('commercial.md', 'Product strategist and commercial lead'),
    ('investor.md', 'Investor and sceptic'),
    ('judges.md', 'Hackathon judge panel'),
]
BASE = Path('docs/review')


def rows_from(path: Path):
    text = path.read_text()
    if '## Findings table' not in text:
        return []
    block = text.split('## Findings table', 1)[1]
    lines = [l for l in block.splitlines() if l.strip().startswith('|')]
    out = []
    header = None
    for l in lines:
        cells = [c.strip() for c in l.strip().strip('|').split('|')]
        if all(re.fullmatch(r':?-{2,}:?', c) for c in cells if c):
            continue
        if header is None:
            header = [c.lower() for c in cells]
            continue
        row = dict(zip(header, cells))
        out.append(row)
    return out


def main():
    all_rows = []
    for fname, role in ROLES:
        p = BASE / fname
        if not p.exists():
            print(f'missing {fname}')
            continue
        for r in rows_from(p):
            all_rows.append({
                'id': r.get('id', ''),
                'role': role,
                'severity': r.get('severity', ''),
                'title': r.get('title', ''),
                'evidence': r.get('evidence', ''),
                'recommendation': r.get('recommendation', ''),
                'effort': r.get('effort', ''),
                'status': 'Open',
            })
    with open(BASE / 'findings.csv', 'w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=['id', 'role', 'severity', 'title', 'evidence', 'recommendation', 'effort', 'status'])
        w.writeheader()
        w.writerows(all_rows)
    by = {}
    for r in all_rows:
        by[r['severity']] = by.get(r['severity'], 0) + 1
    print(len(all_rows), 'findings', by)
    bad = [r['id'] for r in all_rows if r['severity'] not in ('High', 'Medium', 'Low') or r['effort'] not in ('S', 'M', 'L')]
    print('rows needing attention:', bad)


if __name__ == '__main__':
    main()
