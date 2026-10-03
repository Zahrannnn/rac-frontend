/* RAC-DAMP service worker — hand-rolled, no build step, no dependencies.
 *
 * Strategy (M&E data must always be fresh; auth headers must never be cached):
 *  - /api/**            → NEVER intercepted (network only, no cache)
 *  - /_next/static/**   → cache-first (immutable, content-hashed), fill on miss
 *  - navigations (HTML) → network-first, offline falls back to /offline.html
 *  - everything else    → network, no cache
 *
 * Only the offline page + PWA icons are precached. Route HTML is never cached.
 * Bump CACHE_VERSION to invalidate every cached asset on deploy.
 */

const CACHE_VERSION = "rac-damp-v1";
const OFFLINE_URL = "/offline.html";
const PRECACHE_URLS = [
  OFFLINE_URL,
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-192.png",
  "/icons/icon-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);
      await cache.addAll(PRECACHE_URLS);
    })()
  );
  // Activation waits for an explicit SKIP_WAITING message from the app
  // (see src/shared/components/pwa-registration.tsx) so updates are seamless.
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.filter((name) => name !== CACHE_VERSION).map((name) => caches.delete(name))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only ever mediate GETs; never touch cross-origin traffic.
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // M&E data and auth flows: always the network, never served from cache.
  if (url.pathname === "/api" || url.pathname.startsWith("/api/")) return;

  // Immutable, content-hashed build assets: cache-first, fill on miss.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Documents: network-first so HTML is fresh; offline gets the fallback page.
  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  // Everything else: plain network, no caching.
});

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    await cache.put(request, response.clone());
  }
  return response;
}

async function networkFirstNavigation(request) {
  try {
    return await fetch(request);
  } catch (error) {
    const cache = await caches.open(CACHE_VERSION);
    const offline = await cache.match(OFFLINE_URL);
    if (offline) return offline;
    throw error;
  }
}
