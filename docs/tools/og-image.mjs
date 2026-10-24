// Builds public/og-image.png, the picture chat apps and social sites show when the Tengo link is shared:
// the full lockup and the tagline on the dark background, 1200 x 630.
// Usage: node docs/tools/og-image.mjs
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';

const logo = readFileSync('tengo-brand/png/tengo-horizontal-on-dark.png').toString('base64');
const font = readFileSync('node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2').toString('base64');
const html = `<!doctype html><html><head><style>
@font-face { font-family: Inter; src: url(data:font/woff2;base64,${font}) format('woff2'); font-weight: 100 900; }
html, body { margin: 0; width: 1200px; height: 630px; background: #0B0B0C; }
body { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 44px; font-family: Inter;
  background: radial-gradient(ellipse 70% 60% at 50% 42%, rgba(59,130,246,0.22), transparent 70%), #0B0B0C; }
img { width: 720px; height: auto; }
p { margin: 0; color: #B0B0B0; font-size: 44px; font-weight: 420; letter-spacing: -0.01em; }
</style></head><body><img src="data:image/png;base64,${logo}" alt=""><p>Money you can plan around.</p></body></html>`;

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.setContent(html);
await p.evaluate(() => document.fonts.ready);
await p.screenshot({ path: 'public/og-image.png' });
await b.close();
console.log('public/og-image.png written');
