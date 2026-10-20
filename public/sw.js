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

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const res = await fetch('/precache-manifest.json', { cache: 'no-store' });
      const { version, urls } = await res.json();
      const cache = await caches.open(PREFIX + version);
      await cache.addAll(urls.map((u) => new Request(u, { cache: 'reload' })));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const res = await fetch('/precache-manifest.json', { cache: 'no-store' }).catch(() => null);
      const current = res ? PREFIX + (await res.json()).version : null;
      const keys = await caches.keys();
      if (current) await Promise.all(keys.filter((k) => k.startsWith(PREFIX) && k !== current).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

async function precached(request) {
  const keys = await caches.keys();
  for (const k of keys.filter((x) => x.startsWith(PREFIX))) {
    const hit = await (await caches.open(k)).match(request, { ignoreSearch: true, ignoreVary: true });
    if (hit) return hit;
  }
  return null;
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
