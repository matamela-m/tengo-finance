// Prints an HTML file to PDF with the Playwright Chromium. Usage: node docs/tools/print-pdf.mjs in.html out.pdf
import { chromium } from '@playwright/test';
import { resolve } from 'node:path';

const [input, output] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('file://' + resolve(input));
await page.pdf({ path: output, format: 'A4', printBackground: true, preferCSSPageSize: true });
await browser.close();
console.log('printed', output);
