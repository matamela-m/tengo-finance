"""Finds the page each chapter heading landed on in REPORT.pdf and writes toc-pages.json."""
import json
import fitz

items = json.load(open('docs/review/tools/synthesis/toc-items.json'))
doc = fitz.open('docs/review/REPORT.pdf')
texts = [p.get_text() for p in doc]
pages = {}
start = 2  # skip cover and contents
for anchor, label in items:
    title = label.split(' ', 1)[1] if label[0].isdigit() else label
    probe = title[:40]
    for i in range(start, len(texts)):
        if probe in texts[i]:
            pages[anchor] = i + 1
            start = i
            break
json.dump(pages, open('docs/review/tools/synthesis/toc-pages.json', 'w'), indent=1)
print(len(doc), 'pages;', len(pages), 'of', len(items), 'headings located')
