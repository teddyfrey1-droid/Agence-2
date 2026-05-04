/* eslint-disable no-restricted-globals */
// Cache version — bump on every behavioral change so old broken caches
// are purged on the next visit.
const CACHE_NAME = 'agence-v3';

// Only precache truly static, public, never-redirecting assets.
// /dashboard is intentionally excluded — it's a protected route that
// redirects to /login when the session is missing; caching it would
// freeze that redirect into the cache and break the app.
const PRECACHE_ASSETS = [
  '/icons/apple-touch-icon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/manifest.json',
];

// Install: precache static assets, take over immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(PRECACHE_ASSETS).catch(() => {
        /* offline at install — that's fine */
      })
    )
  );
  self.skipWaiting();
});

// Activate: drop every cache that isn't the current one
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

// Listen for the page asking us to take over (after a forced update)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// True only for responses we can safely cache: same-origin OK responses
// that are not redirects.
function isCacheable(response) {
  return (
    response &&
    response.ok &&
    response.status >= 200 &&
    response.status < 300 &&
    response.type === 'basic' &&
    !response.redirected
  );
}

// Routes that must NEVER be served from cache. Anything authenticated,
// anything that depends on the current session, anything that sets cookies.
function isAuthSensitivePath(pathname) {
  if (pathname.startsWith('/dashboard')) return true;
  if (pathname.startsWith('/espace-client')) return true;
  if (pathname.startsWith('/login')) return true;
  if (pathname.startsWith('/inscription')) return true;
  if (pathname.startsWith('/activation')) return true;
  if (pathname.startsWith('/mot-de-passe-oublie')) return true;
  if (pathname.startsWith('/reinitialisation-mot-de-passe')) return true;
  return false;
}

// Fetch strategy:
// - API calls → always network (never cache)
// - Auth-sensitive pages → always network (never cache)
// - Static (_next/static, /icons, etc.) → cache-first
// - Public pages → network-first with safe cache-on-success only
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return;

  // API: always network, never cache
  if (url.pathname.startsWith('/api/')) return;

  // Auth-sensitive pages: always network, never cache
  if (isAuthSensitivePath(url.pathname)) return;

  // Long-lived static assets: cache-first
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    /\.(png|jpg|jpeg|svg|webp|ico|woff|woff2|ttf|css|js)$/.test(url.pathname)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (isCacheable(response)) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => {});
          }
          return response;
        });
      })
    );
    return;
  }

  // Other (public) navigations: network-first, cache only on success.
  // On network failure, fall back to a previously cached OK response.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (isCacheable(response)) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => {});
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// ─── Push notifications ────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'Retail Avenue', body: event.data.text(), data: { link: '/dashboard' } };
  }

  const options = {
    body: data.body || '',
    icon: data.icon || '/icons/icon-192.png',
    badge: data.badge || '/icons/icon-192.png',
    data: data.data || {},
    vibrate: [100, 50, 100],
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Retail Avenue', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const link = (event.notification.data && event.notification.data.link) || '/dashboard';
  const targetUrl = new URL(link, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
