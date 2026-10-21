"""Builds docs/business-case.pdf (one A4 page) from docs/business-case.md.
Run: <python with markdown> docs/tools/business-case-pdf.py && node docs/tools/print-pdf.mjs docs/tools/business-case.html docs/business-case.pdf"""
import markdown

md = open('docs/business-case.md').read()
body = markdown.markdown(md, extensions=['tables'])
css = """
@page { size: A4; margin: 10mm 11mm; }
body { font-family: Arial, sans-serif; font-size: 7.2pt; line-height: 1.32; color: #1C1B19; columns: 2; column-gap: 8mm; }
h1 { column-span: all; font-size: 15pt; margin: 0 0 2mm; }
h1 + p { column-span: all; color: #66635D; margin: 0 0 3mm; }
h2 { font-size: 9pt; margin: 3mm 0 1mm; color: #3755CC; break-after: avoid; }
p { margin: 0 0 1.6mm; }
table { width: 100%; border-collapse: collapse; margin: 0 0 2mm; break-inside: avoid; }
th, td { text-align: left; vertical-align: top; padding: 0.6mm 1mm; border-bottom: 0.2mm solid #E7E5E1; }
th { background: #F4F3F1; }
code { font-size: 6.6pt; }
"""
open('docs/tools/business-case.html', 'w').write(f'<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Tengo business case</title><style>{css}</style></head><body>{body}</body></html>')
print('wrote docs/tools/business-case.html')
