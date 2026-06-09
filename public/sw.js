// The Colony OK - PWA Service Worker (Phase 3)
// Per MOBILE_TWA_PWA strategy + audit gaps.
// - App shell + static cache
// - Clip metadata/API responses: stale-while-revalidate (supports offline "your clips" list view)
// - Video/audio clip media: network-first with cache fallback (large files + range seek for <video> are passed through; cache small clips where practical)
// - No background sync in MVP (add later for upload queue)
// - TWA friendly: standalone already in manifest; offline UI graceful

const CACHE_NAME = 'thecolony-v3-clips';
const APP_SHELL = [
  '/',
  '/live',
  '/podcasts',
  '/manifest.webmanifest',
  // Next.js builds hash assets; runtime caching covers _next/static etc via origin match
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Clip APIs + clip-related responses: SWR for offline list + recent embeds
  if (url.pathname.startsWith('/api/clips') || url.pathname.includes('/clips')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.ok) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => cachedResponse); // offline: serve cached clip metadata/list
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Same-origin GET: cache-first for shell + images/css, network update
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request)
          .then((res) => {
            if (res && res.ok) {
              caches.open(CACHE_NAME).then((c) => c.put(request, res.clone()));
            }
            return res;
          })
          .catch(() => cached);
        return cached || networkFetch;
      })
    );
    return;
  }

  // External (blob video, mux, yt thumbs, etc): pass-through (video range requests work best direct)
  // Future: could add targeted small-clip cache here if duration < threshold
});
