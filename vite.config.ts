/// <reference types="vitest/config" />
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Writes dist/precache-manifest.json: every file the built app needs, so the service worker can cache the
 * whole app at install and work offline after the first visit. The version is a hash of every file's name and
 * contents, and it is written into dist/sw.js, so any change to the app changes the worker's bytes. Browsers only
 * install a new service worker when sw.js changes, so this is what stops a redeploy from serving a stale build.
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
      const hash = createHash('sha256');
      for (const u of urls) hash.update(u).update(readFileSync(join(dist, u === '/' ? 'index.html' : u.slice(1))));
      const version = hash.digest('hex').slice(0, 12);
      writeFileSync(join(dist, 'precache-manifest.json'), JSON.stringify({ version, urls }, null, 1));
      const sw = readFileSync(join(dist, 'sw.js'), 'utf8');
      if (!sw.includes("'__TENGO_VERSION__'")) throw new Error('sw.js has no version placeholder');
      writeFileSync(join(dist, 'sw.js'), sw.replace("'__TENGO_VERSION__'", JSON.stringify(version)));
    },
  };
}

/** Warns at build time while the responsible party or Information Officer are still placeholders. */
function operatorWarning(mode: string): Plugin {
  return {
    name: 'tengo-operator-warning',
    apply: 'build',
    buildStart() {
      const env = loadEnv(mode, process.cwd(), 'VITE_');
      const missing = ['VITE_RESPONSIBLE_PARTY', 'VITE_RESPONSIBLE_PARTY_ADDRESS', 'VITE_INFORMATION_OFFICER', 'VITE_PRIVACY_EMAIL'].filter((k) => !env[k]?.trim());
      if (missing.length) this.warn(`Privacy notice placeholders still in use: ${missing.join(', ')}. Fill them before any real launch (docs/SETUP-SUPABASE.md).`);
    },
  };
}

/**
 * Fills %SITE_URL% in index.html, for the link preview tags. Chat apps such as WhatsApp only show the preview image
 * from a full address. VITE_SITE_URL wins; on Vercel the production domain is used; otherwise the path stays relative.
 */
function siteUrl(mode: string): Plugin {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const url = (env.VITE_SITE_URL?.trim() || (vercel ? `https://${vercel}` : '')).replace(/\/$/, '');
  return { name: 'tengo-site-url', transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', url) };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), precacheManifest(), operatorWarning(mode), siteUrl(mode)],
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
}));
