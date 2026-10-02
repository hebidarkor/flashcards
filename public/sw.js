// Service Worker for Greek Flashcards PWA
// Caches all app assets so it works fully offline after first load.

const CACHE = 'greek-flashcards-v4';

// On install: cache everything in the build
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll([
        '.',
        './index.html',
        './greek_anki.csv',
      ])
    )
  );
  self.skipWaiting();
});

// On activate: remove old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// On fetch: cache-first for static assets, network-first for CSV
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Always try network first for the CSV so updates propagate
  if (url.pathname.endsWith('.csv')) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache-first for everything else
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
        }
        return res;
      });
    })
  );
});
