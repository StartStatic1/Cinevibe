// ============================================================
//  CineVibe – Service Worker
//  Cache-first for assets, network-first for API
// ============================================================

const CACHE_NAME = 'cinevibe-v1.0.0';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/reset.css',
  '/css/variables.css',
  '/css/app.css',
  '/css/components.css',
  '/css/animations.css',
  '/js/config.js',
  '/js/api.js',
  '/js/store.js',
  '/js/router.js',
  '/js/ui.js',
  '/js/app.js',
  '/js/sw-register.js',
  '/js/pages/home.js',
  '/js/pages/movies.js',
  '/js/pages/series.js',
  '/js/pages/trending.js',
  '/js/pages/aiPick.js',
  '/js/pages/streamings.js',
  '/js/pages/favorites.js',
  '/js/pages/watchlist.js',
  '/js/pages/detail.js',
];

// ---- Install: cache static assets ----
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ---- Activate: clear old caches ----
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ---- Fetch: strategy ----
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET
  if (event.request.method !== 'GET') return;

  // API requests → Network-first (TMDB, Watchmode, Anthropic)
  if (
    url.hostname.includes('themoviedb.org') ||
    url.hostname.includes('watchmode.com') ||
    url.hostname.includes('anthropic.com') ||
    url.hostname.includes('tmdb.org')
  ) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // Static assets → Cache-first
  event.respondWith(cacheFirst(event.request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    return await fetch(request);
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('{"error":"offline"}', {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
