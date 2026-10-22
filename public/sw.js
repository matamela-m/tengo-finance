// Tengo service worker.
//
// Strategy (documented in the README):
// - Install: fetch /precache-manifest.json, written at build time, and cache every file of the app, so it
//   works offline after the first visit, with no reload needed.
// - Pages (navigations): network first, falling back to the cached app shell, then to /offline.html.
// - Files in the precache list: cache first.
// - Everything else, including any API or database request: never cached. Cross-origin requests (the
//   optional account database) are not touched at all, so personal data responses are never stored here.
// - Activate: delete every older Tengo cache. The caches only ever hold the app's own files, so there is
//   no personal data in them to clear when someone deletes their data.
const PREFIX = 'tengo-';
// Replaced at build time with a hash of the whole build (vite.config.ts), so every deploy that changes any file
// ships a byte-different sw.js, which is what makes browsers install the new worker and drop the old cache.
const VERSION = '__TENGO_VERSION__';

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const res = await fetch('/precache-manifest.json', { cache: 'no-store' });
      const { urls } = await res.json();
      const cache = await caches.open(PREFIX + VERSION);
      await cache.addAll(urls.map((u) => new Request(u, { cache: 'reload' })));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const current = PREFIX + VERSION;
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith(PREFIX) && k !== current).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

// Only the current build's cache is read, so an older build's copy of a file is never served.
async function precached(request) {
  return (await (await caches.open(PREFIX + VERSION)).match(request, { ignoreSearch: true, ignoreVary: true })) || null;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => (await precached(new Request('/'))) || (await precached(new Request('/offline.html'))) || Response.error()),
    );
    return;
  }

  event.respondWith(
    (async () => {
      const hit = await precached(request);
      if (hit) return hit;
      // Not part of the app: straight to the network, never stored.
      return fetch(request);
    })(),
  );
});
