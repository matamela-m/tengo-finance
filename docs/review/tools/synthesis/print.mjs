// Prints docs/review/report/report.html to docs/review/REPORT.pdf with page numbers.
import { chromium } from '@playwright/test';
import { resolve } from 'node:path';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('file://' + resolve('docs/review/report/report.html'), { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.pdf({
  path: 'docs/review/REPORT.pdf',
  format: 'A4',
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: '<div></div>',
  footerTemplate:
    '<div style="width:100%;font-family:Arial;font-size:7px;color:#66635D;padding:0 16mm;display:flex;justify-content:space-between;"><span>Tengo independent review, 2026-10-20</span><span><span class="pageNumber"></span> of <span class="totalPages"></span></span></div>',
  margin: { top: '16mm', bottom: '18mm', left: '0', right: '0' },
});
await browser.close();
console.log('printed docs/review/REPORT.pdf');
