// ============================================================
//  CineVibe – Streamings Page  (FIXED v2)
//  - Cada plataforma mostra conteúdo mais relevante
//  - Crunchyroll → anime correto (sort vote_average)
//  - Chips de scroll horizontal, não quebra linha
//  - Card-scroll (horizontal) em vez de card-grid
// ============================================================

Pages.Streamings = async function(container) {
  container.innerHTML = `<div class="page fade-in" id="streamingsPage"></div>`;
  const page = document.getElementById('streamingsPage');

  page.innerHTML = `<h1 class="section-title" style="margin-bottom:20px">📡 <span class="accent">Streamings</span></h1>`;

  // Cada plataforma com seus provider_ids reais do TMDB para filtrar
  const PLATFORMS = [
    {
      id: 8,   name: 'Netflix',      color: '#e50914', emoji: '🔴',
      movieGenres: [28, 18, 80, 53],  seriesGenres: [18, 80, 53],
      sortMovie: 'popularity.desc',   sortSeries: 'popularity.desc',
    },
    {
      id: 337, name: 'Disney+',      color: '#1134b0', emoji: '🔵',
      movieGenres: [16, 12, 10751],  seriesGenres: [16, 10751, 12],
      sortMovie: 'popularity.desc',   sortSeries: 'popularity.desc',
    },
    {
      id: 119, name: 'Amazon Prime', color: '#00a8e0', emoji: '🟦',
      movieGenres: [878, 28, 53],    seriesGenres: [878, 28, 18],
      sortMovie: 'popularity.desc',   sortSeries: 'popularity.desc',
    },
    {
      id: 384, name: 'HBO Max',      color: '#6E2DCD', emoji: '🟣',
      movieGenres: [18, 80, 53],     seriesGenres: [18, 80, 53],
      sortMovie: 'vote_average.desc', sortSeries: 'vote_average.desc',
    },
    {
      id: 531, name: 'Paramount+',   color: '#0064ff', emoji: '🔷',
      movieGenres: [28, 35, 878],    seriesGenres: [28, 18, 35],
      sortMovie: 'popularity.desc',   sortSeries: 'popularity.desc',
    },
    {
      id: 619, name: 'Star+',        color: '#2D5F8A', emoji: '⭐',
      movieGenres: [28, 18, 35],     seriesGenres: [18, 28, 35],
      sortMovie: 'popularity.desc',   sortSeries: 'popularity.desc',
    },
    {
      id: 2,   name: 'Apple TV+',    color: '#888',    emoji: '⬜',
      movieGenres: [18, 878, 53],    seriesGenres: [18, 878, 53],
      sortMovie: 'vote_average.desc', sortSeries: 'vote_average.desc',
    },
    {
      id: 283, name: 'Crunchyroll',  color: '#ff6a00', emoji: '🟠',
      // Crunchyroll = anime: genre 16 (Animação) + origin_country JP
      movieGenres: [16],             seriesGenres: [16],
      sortMovie: 'vote_average.desc', sortSeries: 'vote_average.desc',
      animeOnly: true,
    },
  ];

  // Platform selection grid
  const platGrid = document.createElement('div');
  platGrid.className = 'streaming-grid';
  platGrid.style.marginBottom = '20px';

  PLATFORMS.forEach(plat => {
    const card = document.createElement('div');
    card.className = 'streaming-card';
    card.dataset.id = plat.id;
    card.innerHTML = `
      <div style="font-size:28px;margin-bottom:8px;">${plat.emoji}</div>
      <div class="name" style="color:${plat.color}">${plat.name}</div>
      <div class="plan">Ver catálogo →</div>`;
    card.addEventListener('click', () => {
      platGrid.querySelectorAll('.streaming-card').forEach(c => {
        c.style.background = '';
        c.style.borderColor = '';
      });
      card.style.background   = plat.color + '22';
      card.style.borderColor  = plat.color + '88';
      loadPlatform(plat);
    });
    platGrid.appendChild(card);
  });
  page.appendChild(platGrid);

  // Content area
  const contentArea = document.createElement('div');
  contentArea.id = 'streamContent';
  page.appendChild(contentArea);

  // Auto-seleciona Netflix
  const firstCard = platGrid.querySelector('.streaming-card');
  if (firstCard) {
    firstCard.style.background  = PLATFORMS[0].color + '22';
    firstCard.style.borderColor = PLATFORMS[0].color + '88';
  }
  loadPlatform(PLATFORMS[0]);

  async function loadPlatform(plat) {
    contentArea.innerHTML = '<div class="spinner"></div>';

    try {
      const extraParams = plat.animeOnly
        ? { with_origin_country: 'JP', 'vote_count.gte': 100 }
        : { 'vote_count.gte': 50, with_watch_providers: plat.id, watch_region: 'BR' };

      // Busca filmes e séries em paralelo
      const [movies, series] = await Promise.all([
        _discoverFor('movie', plat.movieGenres[0], plat.sortMovie, extraParams),
        _discoverFor('tv',    plat.seriesGenres[0], plat.sortSeries, extraParams),
      ]);

      contentArea.innerHTML = '';

      // Filmes
      const s1 = document.createElement('div');
      s1.className = 'section';
      s1.innerHTML = `<div class="section-header">
        <h2 class="section-title" style="color:${plat.color}">🎬 Filmes no ${plat.name}</h2>
      </div>`;
      const scroll1 = document.createElement('div');
      scroll1.className = 'card-scroll';
      const movieResults = (movies?.results || []).filter(r => (r.vote_count||0) >= 20).slice(0, 14);
      if (movieResults.length) {
        movieResults.forEach(m => scroll1.appendChild(UI.movieCard(m, 'movie')));
      } else {
        scroll1.innerHTML = `<p style="color:var(--text-3);padding:20px;">Sem resultados no momento</p>`;
      }
      s1.appendChild(scroll1);
      contentArea.appendChild(s1);

      // Séries
      const s2 = document.createElement('div');
      s2.className = 'section';
      s2.innerHTML = `<div class="section-header">
        <h2 class="section-title" style="color:${plat.color}">📺 Séries no ${plat.name}</h2>
      </div>`;
      const scroll2 = document.createElement('div');
      scroll2.className = 'card-scroll';
      const seriesResults = (series?.results || []).filter(r => (r.vote_count||0) >= 20).slice(0, 14);
      if (seriesResults.length) {
        seriesResults.forEach(s => scroll2.appendChild(UI.movieCard(s, 'tv')));
      } else {
        scroll2.innerHTML = `<p style="color:var(--text-3);padding:20px;">Sem resultados no momento</p>`;
      }
      s2.appendChild(scroll2);
      contentArea.appendChild(s2);

    } catch (e) {
      console.error(e);
      contentArea.innerHTML = `<div class="empty-state"><p>Erro ao carregar. Tente novamente.</p></div>`;
    }
  }

  async function _discoverFor(type, genreId, sortBy, extra = {}) {
    const params = new URLSearchParams({
      api_key:  CONFIG.TMDB_KEY,
      language: CONFIG.LANG,
      sort_by:  sortBy || 'popularity.desc',
      page: 1,
      ...extra,
    });
    if (genreId) params.append('with_genres', genreId);
    const res = await fetch(`${CONFIG.TMDB_BASE}/discover/${type}?${params}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
};
