// Checks WCAG contrast for every text and surface pair the UI uses.
// Run: npm run contrast. Exits non-zero if any pair fails its target.

const c = {
  white: '#FFFFFF',
  offWhite: '#EEEBE6',
  mint: '#B6DFB2',
  sage: '#7AAB88',
  deepGreen: '#125747',
  charcoal: '#1E1E1E',
  muted: '#5A5A55',
  mutedOnDark: '#B9B5AE',
  enough: '#2FB36B',
  tight: '#E8A33D',
  short: '#C8553D',
  enoughText: '#17703F',
  tightText: '#8A5300',
  shortText: '#A33A25',
  enoughSoft: '#DDF3E4',
  tightSoft: '#FBEBD2',
  shortSoft: '#F6DDD7',
  // Dark theme
  darkBg: '#161616',
  darkSurface: '#1E1E1E',
  darkSurface2: '#262624',
  darkInk: '#EEEBE6',
  darkMuted: '#B9B5AE',
  darkBrandInk: '#B6DFB2',
  darkEnoughText: '#6FD59B',
  darkTightText: '#F2C27A',
  darkShortText: '#EF9A87',
  darkEnoughSoft: '#1D3A29',
  darkTightSoft: '#3D2F18',
  darkShortSoft: '#43231C',
  waChat: '#E7DFD4',
};

// [label, foreground, background, minimum ratio]
const pairs = [
  ['Body text on off-white', 'charcoal', 'offWhite', 4.5],
  ['Body text on white', 'charcoal', 'white', 4.5],
  ['Off-white text on charcoal', 'offWhite', 'charcoal', 4.5],
  ['Muted text on off-white', 'muted', 'offWhite', 4.5],
  ['Muted text on white', 'muted', 'white', 4.5],
  ['Muted text on charcoal', 'mutedOnDark', 'charcoal', 4.5],
  ['Deep green text on off-white', 'deepGreen', 'offWhite', 4.5],
  ['Deep green text on white', 'deepGreen', 'white', 4.5],
  ['White text on deep green (buttons)', 'white', 'deepGreen', 4.5],
  ['Mint text on charcoal', 'mint', 'charcoal', 4.5],
  ['Charcoal text on mint', 'charcoal', 'mint', 4.5],
  ['Charcoal text on sage (large/UI only)', 'charcoal', 'sage', 3],
  ['Enough text on off-white', 'enoughText', 'offWhite', 4.5],
  ['Enough text on white', 'enoughText', 'white', 4.5],
  ['Enough text on soft enough', 'enoughText', 'enoughSoft', 4.5],
  ['Tight text on off-white', 'tightText', 'offWhite', 4.5],
  ['Tight text on white', 'tightText', 'white', 4.5],
  ['Tight text on soft tight', 'tightText', 'tightSoft', 4.5],
  ['Short text on off-white', 'shortText', 'offWhite', 4.5],
  ['Short text on white', 'shortText', 'white', 4.5],
  ['Short text on soft short', 'shortText', 'shortSoft', 4.5],
  ['Charcoal text on Enough fill', 'charcoal', 'enough', 4.5],
  ['Charcoal text on Tight fill', 'charcoal', 'tight', 4.5],
  ['Charcoal large text on Short fill', 'charcoal', 'short', 3],
  ['Enough icon (text variant) on white', 'enoughText', 'white', 3],
  ['Tight icon (text variant) on white', 'tightText', 'white', 3],
  ['Gauge outline (enough) on off-white', 'enoughText', 'offWhite', 3],
  ['Enough fill as UI icon on charcoal', 'enough', 'charcoal', 3],
  ['Tight fill as UI icon on charcoal', 'tight', 'charcoal', 3],
  ['Short fill as UI icon on off-white', 'short', 'offWhite', 3],
  ['Short fill as UI icon on white', 'short', 'white', 3],
  ['Short fill as UI icon on charcoal', 'short', 'charcoal', 3],
  ['Enough vs deep green (distinct hue check)', 'enough', 'deepGreen', 1.5],
  ['Avatar: mint initials on deep green', 'mint', 'deepGreen', 3],
  ['Avatar: charcoal initials on sage', 'charcoal', 'sage', 3],
  ['WhatsApp bubble text on white', 'charcoal', 'white', 4.5],
  ['WhatsApp date pill text on chat bg', 'muted', 'waChat', 4.5],
  ['Dark: body text on background', 'darkInk', 'darkBg', 4.5],
  ['Dark: body text on surface', 'darkInk', 'darkSurface', 4.5],
  ['Dark: muted text on surface', 'darkMuted', 'darkSurface', 4.5],
  ['Dark: muted text on surface 2', 'darkMuted', 'darkSurface2', 4.5],
  ['Dark: brand text on surface', 'darkBrandInk', 'darkSurface', 4.5],
  ['Dark: charcoal on sage (active nav, buttons)', 'charcoal', 'sage', 4.5],
  ['Dark: Enough text on surface', 'darkEnoughText', 'darkSurface', 4.5],
  ['Dark: Tight text on surface', 'darkTightText', 'darkSurface', 4.5],
  ['Dark: Short text on surface', 'darkShortText', 'darkSurface', 4.5],
  ['Dark: Enough text on soft enough', 'darkEnoughText', 'darkEnoughSoft', 4.5],
  ['Dark: Tight text on soft tight', 'darkTightText', 'darkTightSoft', 4.5],
  ['Dark: Short text on soft short', 'darkShortText', 'darkShortSoft', 4.5],
];

function lum(hex) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

export function ratio(a, b) {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

let failed = 0;
const rows = pairs.map(([label, fg, bg, min]) => {
  const r = ratio(c[fg], c[bg]);
  const ok = r >= min;
  if (!ok) failed++;
  return { label, fg: c[fg], bg: c[bg], ratio: r.toFixed(2), min, result: ok ? 'pass' : 'FAIL' };
});

console.table(rows);
if (process.argv.includes('--md')) {
  console.log('| Pair | Foreground | Background | Ratio | Target |');
  console.log('| --- | --- | --- | --- | --- |');
  rows.forEach((r) => console.log(`| ${r.label} | ${r.fg} | ${r.bg} | ${r.ratio}:1 | ${r.min}:1 |`));
}
if (failed) {
  console.error(`${failed} pair(s) failed.`);
  process.exit(1);
}
