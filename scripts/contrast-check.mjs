// WCAG contrast check for every text and UI pair the interface uses, in both themes.
// Translucent fills (soft state tints and the destructive notice) are blended over the surface they sit on first.
// Run: npm run contrast (also runs as part of npm run test). Add --md for a README table.
// Keep the values in step with src/styles/index.css.

const THEMES = {
  dark: {
    bg: '#171717',
    'surface-1': '#262626',
    'surface-2': '#1F1F1F',
    'surface-3': '#2E2E2E',
    text: '#FAFAFA',
    'text-muted': '#B0B0B0',
    'text-subtle': '#ADADAD',
    accent: '#3B82F6',
    'on-accent': '#171717',
    link: '#60A5FA',
    'accent-fill': '#1E3A8A',
    danger: '#EF4444',
    'on-danger': '#171717',
    'danger-text': '#F87878',
    enough: '#34D399',
    tight: '#FBBF24',
    short: '#FF8A5B',
    'field-border': '#737373',
    stateSoftA: 0.14,
  },
  light: {
    bg: '#FAFAFA',
    'surface-1': '#FFFFFF',
    'surface-2': '#F5F5F5',
    'surface-3': '#EBEBEB',
    text: '#171717',
    'text-muted': '#525252',
    'text-subtle': '#5C5C5C',
    accent: '#2563EB',
    'on-accent': '#FFFFFF',
    link: '#1D4ED8',
    'accent-fill': '#DBEAFE',
    danger: '#DC2626',
    'on-danger': '#FFFFFF',
    'danger-text': '#B91C1C',
    enough: '#065F46',
    tight: '#735400',
    short: '#A93A0B',
    'field-border': '#858585',
    stateSoftA: 0.1,
  },
};

const SURFACES = ['bg', 'surface-1', 'surface-2', 'surface-3'];
const STATES = ['enough', 'tight', 'short'];

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const hex = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
/** Colour `fg` at alpha `a` laid over `bg`. */
const blend = (fg, bg, a) => hex(rgb(fg).map((v, i) => v * a + rgb(bg)[i] * (1 - a)));

function lum(h) {
  return rgb(h)
    .map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    })
    .reduce((acc, v, i) => acc + v * [0.2126, 0.7152, 0.0722][i], 0);
}

export function ratio(a, b) {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

function pairsFor(t) {
  const out = [];
  const add = (label, fg, bg, min) => out.push({ label, fg, bg, min });
  // Every surface text can sit on, the navy accent fill included.
  const TEXT_SURFACES = [...SURFACES, 'accent-fill'];
  for (const s of TEXT_SURFACES) {
    add(`Text on ${s}`, t.text, t[s], 4.5);
    add(`Muted text on ${s}`, t['text-muted'], t[s], 4.5);
    add(`Subtle text on ${s}`, t['text-subtle'], t[s], 4.5);
  }
  for (const s of SURFACES) {
    for (const st of STATES) add(`${st} text on ${s}`, t[st], t[s], 4.5);
    add(`Link and small blue text on ${s}`, t.link, t[s], 4.5);
    add(`Destructive text on ${s}`, t['danger-text'], t[s], 4.5);
    const dangerSoft = blend(t.danger, t[s], 0.1);
    add(`Destructive text on destructive notice over ${s}`, t['danger-text'], dangerSoft, 4.5);
    add(`Text on destructive notice over ${s}`, t.text, dangerSoft, 4.5);
    for (const st of STATES) add(`${st} text on ${st}-soft over ${s}`, t[st], blend(t[st], t[s], t.stateSoftA), 4.5);
  }
  add('On-accent text on primary button', t['on-accent'], t.accent, 4.5);
  add('On-danger text on destructive button', t['on-danger'], t.danger, 4.5);
  add('Primary pill: background-colour label on text-colour fill', t.bg, t.text, 4.5);
  add('Dimmed headline half (display size) on bg', t['text-muted'], t.bg, 3);
  for (const s of ['bg', 'surface-1', 'surface-2']) add(`Form field border on ${s}`, t['field-border'], t[s], 3);
  for (const s of SURFACES) add(`Focus ring and handle (accent) on ${s}`, t.accent, t[s], 3);
  add('Selected segment outline (accent) on its track (surface-2)', t.accent, t['surface-2'], 3);
  for (const st of STATES) add(`${st} gauge segment on surface-1`, t[st], t['surface-1'], 3);
  add('Gauge empty segment (surface-3) vs lit is decorative: state word always shown', t['surface-3'], t['surface-1'], 1);
  return out;
}

let failed = 0;
const tables = [];
for (const [name, t] of Object.entries(THEMES)) {
  const rows = pairsFor(t).map((p) => {
    const r = ratio(p.fg, p.bg);
    const ok = r >= p.min;
    if (!ok) failed++;
    return { theme: name, pair: p.label, fg: p.fg, bg: p.bg, ratio: r.toFixed(2), min: p.min, result: ok ? 'pass' : 'FAIL' };
  });
  tables.push(...rows);
}

// Tight and Short must look different, not only read differently: their hues sit at least 25 degrees apart.
function hue(h) {
  const [r, g, b] = rgb(h).map((v) => v / 255);
  const mx = Math.max(r, g, b);
  const d = mx - Math.min(r, g, b);
  if (!d) return 0;
  const raw = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (raw * 60 + 360) % 360;
}
// Short is coral-orange and must not read as the destructive red: at least 15 degrees from both its reds.
const apart = (a, b) => {
  const diff = Math.abs(hue(a) - hue(b));
  return Math.min(diff, 360 - diff);
};
for (const [name, t] of Object.entries(THEMES)) {
  for (const [label, a, b, min] of [
    ['Tight and Short hue difference (degrees)', t.tight, t.short, 25],
    ['Short and destructive fill hue difference (degrees)', t.short, t.danger, 15],
    ['Short and destructive text hue difference (degrees)', t.short, t['danger-text'], 15],
  ]) {
    const d = apart(a, b);
    const ok = d >= min;
    if (!ok) failed++;
    tables.push({ theme: name, pair: label, fg: a, bg: b, ratio: d.toFixed(0), min, result: ok ? 'pass' : 'FAIL' });
  }
}

// The navy accent fill is only ever a background, and the primary blue is too dark for small text on dark
// surfaces: both are banned as text colours in the source. Links and small blue text use text-link.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
const walk = (dir) => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));
for (const file of walk('src').filter((f) => /\.(tsx?|css)$/.test(f))) {
  const src = readFileSync(file, 'utf8');
  for (const bad of [/\btext-accent(-soft)?\b/g, /color:\s*var\(--color-accent-soft\)/g, /fill="var\(--color-accent-soft\)"/g]) {
    for (const m of src.matchAll(bad)) {
      failed++;
      tables.push({ theme: 'both', pair: `Forbidden text colour ${m[0]} in ${file}`, fg: '', bg: '', ratio: '0', min: 0, result: 'FAIL' });
    }
  }
}

const fails = tables.filter((r) => r.result === 'FAIL');
if (process.argv.includes('--md')) {
  console.log('| Theme | Pair | Foreground | Background | Ratio | Target |');
  console.log('| --- | --- | --- | --- | --- | --- |');
  tables.forEach((r) => console.log(`| ${r.theme} | ${r.pair} | ${r.fg} | ${r.bg} | ${r.ratio}:1 | ${r.min}:1 |`));
} else if (process.argv.includes('--all')) {
  console.table(tables);
} else {
  console.log(`Contrast: ${tables.length - fails.length} of ${tables.length} pairs pass across dark and light.`);
}
if (failed) {
  console.table(fails);
  console.error(`${failed} pair(s) failed.`);
  process.exit(1);
}
