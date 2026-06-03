// ============================================================
//  CineVibe – Service Worker
//  Cache-first para assets, network-first para API
//  CACHE_NAME com data para forçar update a cada deploy
// ============================================================

const CACHE_NAME = 'cinevibe-v2-' + new Date().toISOString().slice(0, 10);

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

// ── Install: cache assets ──
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting(); // Ativa imediatamente sem esperar fechar abas
});

// ── Activate: limpa caches antigos ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => {
          console.log('[CineVibe SW] Deletando cache antigo:', k);
          return caches.delete(k);
        })
      )
    )
  );
  self.clients.claim(); // Toma controle de todas as abas abertas
});

// ── Fetch: estratégia por tipo ──
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignora não-GET
  if (event.request.method !== 'GET') return;

  // APIs externas → Network-first (sempre dados frescos)
  if (
    url.hostname.includes('themoviedb.org') ||
    url.hostname.includes('watchmode.com') ||
    url.hostname.includes('anthropic.com') ||
    url.hostname.includes('tmdb.org') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  ) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // Assets locais → Cache-first
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
    // Offline fallback: tenta retornar index.html para navegação
    const fallback = await caches.match('/index.html');
    return fallback || new Response('Offline', { status: 503 });
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
