// ============================================================
//  CineVibe – Streamings Page (FIXED v4)
//  Crunchyroll = anime JP real (filtra original_language === 'ja')
// ============================================================

Pages.Streamings = async function(container) {
  container.innerHTML = `<div class="page fade-in" id="streamingsPage"></div>`;
  const page = document.getElementById('streamingsPage');
  page.innerHTML = `<h1 class="section-title" style="margin-bottom:20px">📡 <span class="accent">Streamings</span></h1>`;

  const PLATFORMS = [
    { id: 8,   name: 'Netflix',      color: '#e50914', emoji: '🔴' },
    { id: 337, name: 'Disney+',      color: '#1134b0', emoji: '🔵' },
    { id: 119, name: 'Amazon Prime', color: '#00a8e0', emoji: '🟦' },
    { id: 384, name: 'HBO Max',      color: '#6E2DCD', emoji: '🟣' },
    { id: 531, name: 'Paramount+',   color: '#0064ff', emoji: '🔷' },
    { id: 619, name: 'Star+',        color: '#2D5F8A', emoji: '⭐' },
    { id: 2,   name: 'Apple TV+',    color: '#888',    emoji: '⬜' },
    { id: 'cr', name: 'Crunchyroll', color: '#ff6a00', emoji: '🟠', isAnime: true },
  ];

  const platGrid = document.createElement('div');
  platGrid.className = 'streaming-grid';
  platGrid.style.marginBottom = '20px';

  PLATFORMS.forEach(plat => {
    const card = document.createElement('div');
    card.className = 'streaming-card';
    card.dataset.id = plat.id;
    card.innerHTML = `
      <div style="font-size:26px;margin-bottom:6px;">${plat.emoji}</div>
      <div class="name" style="color:${plat.color}">${plat.name}</div>
      <div class="plan">Ver catálogo →</div>`;
    card.addEventListener('click', () => {
      platGrid.querySelectorAll('.streaming-card').forEach(c => { c.style.background=''; c.style.borderColor=''; });
      card.style.background  = plat.color + '22';
      card.style.borderColor = plat.color + '88';
      loadPlatform(plat);
    });
    platGrid.appendChild(card);
  });
  page.appendChild(platGrid);

  const contentArea = document.createElement('div');
  contentArea.id = 'streamContent';
  page.appendChild(contentArea);

  platGrid.querySelector('.streaming-card').style.background   = PLATFORMS[0].color + '22';
  platGrid.querySelector('.streaming-card').style.borderColor  = PLATFORMS[0].color + '88';
  loadPlatform(PLATFORMS[0]);

  async function loadPlatform(plat) {
    contentArea.innerHTML = '<div class="spinner"></div>';
    try {
      let movies, series;

      if (plat.isAnime) {
        // Crunchyroll: anime japonês REAL (filtra idioma original)
        const mRes = await fetch(`${CONFIG.TMDB_BASE}/discover/movie?api_key=${CONFIG.TMDB_KEY}&language=${CONFIG.LANG}&with_genres=16&with_origin_country=JP&sort_by=vote_average.desc&vote_count.gte=200&page=1`);
        const mData = await mRes.json();
        movies = { results: (mData.results || []).filter(r => r.original_language === 'ja') };

        const sRes = await fetch(`${CONFIG.TMDB_BASE}/discover/tv?api_key=${CONFIG.TMDB_KEY}&language=${CONFIG.LANG}&with_genres=16&with_origin_country=JP&sort_by=vote_average.desc&vote_count.gte=200&page=1`);
        const sData = await sRes.json();
        series = { results: (sData.results || []).filter(r => r.original_language === 'ja') };
      } else {
        const mRes = await fetch(`${CONFIG.TMDB_BASE}/discover/movie?api_key=${CONFIG.TMDB_KEY}&language=${CONFIG.LANG}&with_watch_providers=${plat.id}&watch_region=BR&sort_by=popularity.desc&vote_count.gte=30&page=1`);
        movies = await mRes.json();
        const sRes = await fetch(`${CONFIG.TMDB_BASE}/discover/tv?api_key=${CONFIG.TMDB_KEY}&language=${CONFIG.LANG}&with_watch_providers=${plat.id}&watch_region=BR&sort_by=popularity.desc&vote_count.gte=30&page=1`);
        series = await sRes.json();
      }

      contentArea.innerHTML = '';

      const movieResults  = (movies?.results || []).slice(0, 14);
      const seriesResults = (series?.results || []).slice(0, 14);

      const s1 = document.createElement('div'); s1.className = 'section';
      s1.innerHTML = `<div class="section-header"><h2 class="section-title" style="color:${plat.color}">🎬 Filmes no ${plat.name}</h2></div>`;
      const scroll1 = document.createElement('div'); scroll1.className = 'card-scroll';
      if (movieResults.length) movieResults.forEach(m => scroll1.appendChild(UI.movieCard(m,'movie')));
      else scroll1.innerHTML = `<p style="color:var(--text-3);padding:10px;">Nenhum resultado</p>`;
      s1.appendChild(scroll1); contentArea.appendChild(s1);

      const s2 = document.createElement('div'); s2.className = 'section';
      s2.innerHTML = `<div class="section-header"><h2 class="section-title" style="color:${plat.color}">📺 Séries no ${plat.name}</h2></div>`;
      const scroll2 = document.createElement('div'); scroll2.className = 'card-scroll';
      if (seriesResults.length) seriesResults.forEach(s => scroll2.appendChild(UI.movieCard(s,'tv')));
      else scroll2.innerHTML = `<p style="color:var(--text-3);padding:10px;">Nenhum resultado</p>`;
      s2.appendChild(scroll2); contentArea.appendChild(s2);

    } catch(e) {
      console.error(e);
      contentArea.innerHTML = `<div class="empty-state"><p>Erro ao carregar. Tente novamente.</p></div>`;
    }
  }
};