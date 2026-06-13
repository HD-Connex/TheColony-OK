// The Colony OK - PWA Service Worker (Phase 4 complete)
// Per MOBILE_TWA_PWA strategy + audit gaps + Phase 8 TWA polish.
// - App shell + static cache (enhanced with /watch /clips /briefing /topics /stories for offline nav)
// - Clip metadata/API responses: stale-while-revalidate (supports offline "your clips" list view)
// - Video/audio clip media: network-first with cache fallback (large files + range seek for <video> are passed through; cache small clips where practical)
// - Push notifications: breaking news handler (dispatches "Breaking from The Colony" for live alerts; subscribe via client pushManager)
// - Install: skipWaiting + claim for immediate activation. Offline shell graceful.
// - TWA friendly: standalone already in manifest; offline UI graceful. Rural low-bandwidth: shell + clips prioritized (future agentic packs per strategy).
// - No background sync in MVP. (TWA parity: live queue, clips player, comments, personal agent, vs-blaze all work in standalone shell.)

const CACHE_NAME = 'thecolony-v6-pwa-phase4';  // Bumped for Phase 4: new routes + push + offline polish (pure CSS no style break).
const APP_SHELL = [
  '/',
  '/live',
  '/podcasts',
  '/watch',
  '/clips',
  '/briefing',
  '/topics',
  '/stories',
  '/news',
  '/shows',
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

// ─── Push for breaking news (Phase 4 PWA)
// Client subscribes (via navigator.serviceWorker.ready.pushManager); server /api can POST to push endpoint later.
// Shows native notification even if app closed (if permission granted). Title + body from payload.
self.addEventListener('push', (event) => {
  let payload = { title: 'BREAKING — The Colony OK', body: 'New dispatch filed. Open app for details.', url: '/' };
  if (event.data) {
    try { payload = { ...payload, ...event.data.json() }; } catch {}
  }
  const options = {
    body: payload.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'colony-breaking',
    data: { url: payload.url || '/' },
    vibrate: [100, 50, 100],
    actions: [
      { action: 'open', title: 'Read Now' },
    ],
  };
  event.waitUntil(
    self.registration.showNotification(payload.title, options)
  );
});

// Notification click: focus or open the breaking URL (rich result link)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      const hadClient = clientsArr.some((c) => {
        if (c.url === url && 'focus' in c) { c.focus(); return true; }
        return false;
      });
      if (!hadClient && self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});

// Optional: message listener for future client-driven cache bust or breaking push trigger
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
