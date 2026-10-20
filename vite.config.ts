/// <reference types="vitest/config" />
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Writes dist/precache-manifest.json: every file the built app needs, so the service worker can cache the
 * whole app at install and work offline after the first visit. The version is a hash of the file names,
 * which change with every build because Vite hashes them.
 */
function precacheManifest(): Plugin {
  const SKIP = new Set(['sw.js', 'precache-manifest.json', 'sample-statement.csv']);
  return {
    name: 'tengo-precache-manifest',
    apply: 'build',
    closeBundle() {
      const dist = 'dist';
      const files: string[] = [];
      const walk = (dir: string) => {
        for (const f of readdirSync(dir)) {
          const p = join(dir, f);
          if (statSync(p).isDirectory()) {
            if (f !== '.vite') walk(p);
          } else if (!SKIP.has(f)) files.push('/' + relative(dist, p).split('\\').join('/'));
        }
      };
      walk(dist);
      const urls = ['/', ...files.filter((f) => f !== '/index.html')].sort();
      const version = createHash('sha256').update(urls.join('\n')).update(readFileSync(join(dist, 'index.html'))).digest('hex').slice(0, 12);
      writeFileSync(join(dist, 'precache-manifest.json'), JSON.stringify({ version, urls }, null, 1));
    },
  };
}

export default defineConfig({
  plugins: [react(), precacheManifest()],
  // Shown in the diagnostics panel on Me.
  define: { __BUILD_ID__: JSON.stringify(`${process.env.npm_package_version ?? '0'}-${new Date().toISOString().slice(0, 16)}`) },
  build: { manifest: true },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    // `npm run coverage`: unit coverage across all of src, with a floor so it cannot quietly fall back.
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      exclude: ['src/**/*.test.ts', 'src/engine/testing/**'],
      reporter: ['text-summary'],
      thresholds: { statements: 40, lines: 40 },
    },
  },
});
