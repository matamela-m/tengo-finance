// Builds favicon and app icons from the supplied mark by scaling and padding only.
// Uses macOS sips. The logo itself is never redrawn.
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync } from 'node:fs';

const src = 'assets/brand/tengo-mark-on-light.png';
mkdirSync('public/icons', { recursive: true });

// Pad the 810x668 mark to a square with breathing room, then scale down.
const padded = 'public/icons/_square.png';
copyFileSync(src, padded);
execFileSync('sips', ['--padToHeightWidth', '1010', '1010', '--padColor', 'EEEBE6', padded, '--out', padded], { stdio: 'ignore' });

const sizes = { 'favicon-32.png': 32, 'favicon-64.png': 64, 'apple-touch-icon.png': 180, 'icon-192.png': 192, 'icon-512.png': 512 };
for (const [name, size] of Object.entries(sizes)) {
  execFileSync('sips', ['-z', String(size), String(size), padded, '--out', `public/icons/${name}`], { stdio: 'ignore' });
}
execFileSync('rm', [padded]);
console.log('Icons written to public/icons');
