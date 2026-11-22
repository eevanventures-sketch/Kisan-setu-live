// KISAN_SETU_SW_V11 — Self-contained, zero-dependency PWA Service Worker
// Works identically on root Cloud Run URLs and subpath hosting (e.g. GitHub Pages /Kisan-setu/)
const CACHE_NAME = 'kisan-setu-cache-v11';

const scopeUrl = (rel) => new URL(rel, self.registration.scope).href;

const CORE_ASSETS = [
  './',
  './index.html',
  './index.js',
  './index.css',
  './manifest.webmanifest',
  './pwa-192x192.png',
  './pwa-512x512.png',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(
        CORE_ASSETS.map((asset) =>
          fetch(scopeUrl(asset), { cache: 'no-store' })
            .then((res) => {
              if (res && res.ok) {
                return cache.put(scopeUrl(asset), res);
              }
            })
            .catch(() => {})
        )
      )
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/dl')) return;

  // Navigation requests: network-first (bypass HTTP cache), fallback cleanly to scoped index.html
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req, { cache: 'no-cache' })
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(scopeUrl('./index.html'), copy));
          }
          return res;
        })
        .catch(() =>
          caches
            .match(scopeUrl('./index.html'))
            .then((cached) => cached || caches.match(scopeUrl('./')))
        )
    );
    return;
  }

  // App shell assets: network-first (bypass stale CDN HTTP cache) with cache fallback
  event.respondWith(
    fetch(req, { cache: 'no-cache' })
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req))
  );
});
