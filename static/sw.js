const CACHE_VERSION = 'quickfolio-static-v11';
const STATIC_CACHE = `${CACHE_VERSION}-assets`;

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => ((key.startsWith('quickfolio-static-') || key.startsWith('QuickFolio-static-')) && key !== STATIC_CACHE))
        .map((key) => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Only cache static files. Keep HTML/API traffic dynamic.
  if (!url.pathname.startsWith('/static/')) return;

  event.respondWith((async () => {
    const cache = await caches.open(STATIC_CACHE);
    const isCodeAsset = /\.(?:css|js)$/i.test(url.pathname);

    if (isCodeAsset) {
      // Network-first for code assets so style/script updates are picked up quickly.
      try {
        const fresh = await fetch(req);
        if (fresh && fresh.ok) {
          cache.put(req, fresh.clone());
        }
        return fresh;
      } catch (_) {
        const fallback = await cache.match(req);
        if (fallback) return fallback;
        throw _;
      }
    }

    // Stale-while-revalidate for other static assets like images/fonts.
    const cached = await cache.match(req);
    const networkFetch = fetch(req)
      .then((res) => {
        if (res && res.ok) {
          cache.put(req, res.clone());
        }
        return res;
      })
      .catch(() => null);

    if (cached) {
      event.waitUntil(networkFetch);
      return cached;
    }

    return (await networkFetch) || Response.error();
  })());
});
