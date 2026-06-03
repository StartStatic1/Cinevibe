// ============================================================
//  CineVibe – Trending Page
// ============================================================

Pages.Trending = async function(container) {
  container.innerHTML = `<div class="page fade-in" id="trendingPage"></div>`;
  const page = document.getElementById('trendingPage');

  let timeWindow = 'week';
  let mediaType  = 'movie';

  page.innerHTML = `
    <h1 class="section-title" style="margin-bottom:16px">🔥 <span class="accent">Em Alta</span></h1>`;

  // Time filter
  const timeChips = UI.chips(
    [{ id: 'day', name: 'Hoje' }, { id: 'week', name: 'Esta semana' }],
    'week',
    (c) => { timeWindow = c.id; load(); }
  );
  page.appendChild(timeChips);

  // Type filter
  const typeChips = UI.chips(
    [{ id: 'movie', name: 'Filmes' }, { id: 'tv', name: 'Séries' }],
    'movie',
    (c) => { mediaType = c.id; load(); }
  );
  page.appendChild(typeChips);

  const grid = document.createElement('div');
  grid.className = 'card-grid';
  page.appendChild(grid);

  async function load() {
    grid.innerHTML = '<div class="spinner"></div>';
    const data = mediaType === 'movie'
      ? await API.Movies.trending(timeWindow)
      : await API.Series.trending(timeWindow);
    grid.innerHTML = '';
    data.results?.forEach((item, i) => {
      const card = UI.movieCard(item, mediaType === 'tv' ? 'tv' : 'movie');
      // Add rank badge overlay
      const badge = card.querySelector('.card-badge');
      if (badge && i < 10) badge.textContent = `#${i+1}`;
      grid.appendChild(card);
    });
  }

  load();
};
