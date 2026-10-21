// WCAG contrast check for every text and UI pair the interface uses, in both themes.
// Translucent fills (soft state and accent tints) are blended over the surface they sit on first.
// Run: npm run contrast (also runs as part of npm run test). Add --md for a README table.
// Keep the values in step with src/styles/index.css.

const THEMES = {
  dark: {
    bg: '#0B0B0C',
    'surface-1': '#121214',
    'surface-2': '#18181B',
    'surface-3': '#1F1F23',
    text: '#F4F4F5',
    'text-muted': '#A1A1AA',
    'text-subtle': '#8B8B94',
    accent: '#7291FF',
    'on-accent': '#0B0B0C',
    enough: '#34D399',
    tight: '#FBBF24',
    short: '#F97362',
    'field-border': '#6E6E78',
    accentSoftA: 0.14,
    stateSoftA: 0.13,
  },
  light: {
    bg: '#FBFBFA',
    'surface-1': '#FFFFFF',
    'surface-2': '#F4F3F1',
    'surface-3': '#ECEAE6',
    text: '#1C1B19',
    'text-muted': '#66635D',
    'text-subtle': '#6C6963',
    accent: '#3755CC',
    'on-accent': '#FFFFFF',
    enough: '#046E50',
    tight: '#855700',
    short: '#B42318',
    'field-border': '#86837B',
    accentSoftA: 0.1,
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
  for (const s of SURFACES) {
    add(`Text on ${s}`, t.text, t[s], 4.5);
    add(`Muted text on ${s}`, t['text-muted'], t[s], 4.5);
    add(`Subtle text on ${s}`, t['text-subtle'], t[s], 4.5);
    for (const st of STATES) add(`${st} text on ${s}`, t[st], t[s], 4.5);
  }
  for (const s of ['bg', 'surface-1', 'surface-2']) add(`Accent link on ${s}`, t.accent, t[s], 4.5);
  for (const s of SURFACES) {
    const soft = blend(t.accent, t[s], t.accentSoftA);
    add(`Accent text on accent-soft over ${s}`, t.accent, soft, 4.5);
    add(`Text on accent-soft over ${s}`, t.text, soft, 4.5);
    for (const st of STATES) add(`${st} text on ${st}-soft over ${s}`, t[st], blend(t[st], t[s], t.stateSoftA), 4.5);
  }
  add('Primary pill: background-colour label on text-colour fill', t.bg, t.text, 4.5);
  add('On-accent on accent (mark, selected)', t['on-accent'], t.accent, 4.5);
  add('On-accent on short (destructive button)', t['on-accent'], t.short, 4.5);
  add('Dimmed headline half (display size) on bg', t['text-muted'], t.bg, 3);
  for (const s of ['bg', 'surface-1', 'surface-2']) add(`Form field border on ${s}`, t['field-border'], t[s], 3);
  for (const s of ['bg', 'surface-1', 'surface-2']) add(`Focus ring and handle (accent) on ${s}`, t.accent, t[s], 3);
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
for (const [name, t] of Object.entries(THEMES)) {
  const diff = Math.abs(hue(t.tight) - hue(t.short));
  const apart = Math.min(diff, 360 - diff);
  const ok = apart >= 25;
  if (!ok) failed++;
  tables.push({ theme: name, pair: 'Tight and Short hue difference (degrees)', fg: t.tight, bg: t.short, ratio: apart.toFixed(0), min: 25, result: ok ? 'pass' : 'FAIL' });
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
