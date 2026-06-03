// ============================================================
//  CineVibe – Service Worker (FIXED v4)
//  - CACHE_NAME com timestamp para forçar update
//  - JS/CSS: network-first (sempre pega versão nova)
//  - Imagens/icons: cache-first
//  - API: network-only
// ============================================================

const CACHE_NAME = 'cinevibe-v1.0.1-' + new Date().toISOString().slice(0,10);
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/reset.css',
  '/css/variables.css',
  '/css/app.css',
  '/css/components.css',
  '/css/animations.css',
  '/css/extra-fixes.css',
  '/js/config.js',
  '/js/api.js',
  '/js/store.js',
  '/js/router.js',
  '/js/ui.js',
  '/js/player.js',
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

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

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

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET') return;

  // API → network-only (nunca cache)
  if (
    url.hostname.includes('themoviedb.org') ||
    url.hostname.includes('watchmode.com') ||
    url.hostname.includes('anthropic.com') ||
    url.hostname.includes('tmdb.org')
  ) {
    event.respondWith(fetch(event.request).catch(() =>
      caches.match(event.request).then(c => c || new Response('{"error":"offline"}', { headers: { 'Content-Type': 'application/json' } }))
    ));
    return;
  }

  // JS e CSS → network-first (sempre pega versão nova!)
  if (url.pathname.startsWith('/js/') || url.pathname.startsWith('/css/')) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // HTML, manifest, root → network-first
  if (
    url.pathname === '/' ||
    url.pathname === '/index.html' ||
    url.pathname === '/manifest.json' ||
    url.pathname === '/sw.js'
  ) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // Imagens e icons → cache-first
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
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}