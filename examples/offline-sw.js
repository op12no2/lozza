//
// Service worker for offline.html. It's registered with its scope limited to
// offline.html, so the other examples are not affected.
//
// On install it caches the page and lozza.js. Requests are then answered from
// the cache straight away, while a fresh copy is fetched in the background to
// update the cache for next time (stale-while-revalidate). So it works with
// no connection, and a new lozza.js is picked up on the visit after it's
// published.
//

const CACHE = 'lozza-offline';
const FILES = ['offline.html', 'lozza.js'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(self.clients.claim()); // take control of the page that registered us without a reload
});

self.addEventListener('fetch', function (e) {

  if (e.request.method !== 'GET')
    return;

  e.respondWith(caches.open(CACHE).then(async function (cache) {

    const cached = await cache.match(e.request);

    const fresh = fetch(e.request).then(function (r) {
      if (r.ok)
        cache.put(e.request, r.clone());
      return r;
    });

    if (cached) {
      e.waitUntil(fresh.catch(() => {})); // offline: keep the cached copy
      return cached;
    }

    return fresh;

  }));

});
