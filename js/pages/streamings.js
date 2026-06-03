// ============================================================
//  CineVibe – Streamings Page
// ============================================================

Pages.Streamings = async function(container) {
  container.innerHTML = `<div class="page fade-in" id="streamingsPage"></div>`;
  const page = document.getElementById('streamingsPage');

  page.innerHTML = `<h1 class="section-title" style="margin-bottom:20px">📡 <span class="accent">Streamings</span></h1>`;

  const PLATFORMS = [
    { id: 8,   name: 'Netflix',         color: '#e50914', emoji: '🔴', genres: [28, 18, 80] },
    { id: 337, name: 'Disney+',         color: '#1134b0', emoji: '🔵', genres: [16, 12, 10751] },
    { id: 119, name: 'Amazon Prime',    color: '#00a8e0', emoji: '🟦', genres: [28, 53, 878] },
    { id: 384, name: 'HBO Max',         color: '#6E2DCD', emoji: '🟣', genres: [18, 80, 53] },
    { id: 531, name: 'Paramount+',      color: '#0064ff', emoji: '🔷', genres: [28, 35, 878] },
    { id: 619, name: 'Star+',           color: '#2D5F8A', emoji: '⭐', genres: [28, 18, 35] },
    { id: 2,   name: 'Apple TV+',       color: '#888', emoji: '⬜', genres: [18, 878, 53] },
    { id: 283, name: 'Crunchyroll',     color: '#ff6a00', emoji: '🟠', genres: [16] },
  ];

  // Platform grid
  const platGrid = document.createElement('div');
  platGrid.className = 'streaming-grid';
  platGrid.style.marginBottom = '28px';

  PLATFORMS.forEach(plat => {
    const card = document.createElement('div');
    card.className = 'streaming-card';
    card.style.borderColor = plat.color + '44';
    card.innerHTML = `
      <div style="font-size:28px;margin-bottom:8px;">${plat.emoji}</div>
      <div class="name" style="color:${plat.color}">${plat.name}</div>
      <div class="plan">Ver catálogo →</div>`;
    card.addEventListener('click', () => loadPlatformContent(plat));
    platGrid.appendChild(card);
  });
  page.appendChild(platGrid);

  // Content area
  const contentArea = document.createElement('div');
  contentArea.id = 'streamContent';
  page.appendChild(contentArea);

  // Load first platform by default
  loadPlatformContent(PLATFORMS[0]);

  async function loadPlatformContent(plat) {
    // Highlight card
    platGrid.querySelectorAll('.streaming-card').forEach(c => c.style.background = '');
    const cards = platGrid.querySelectorAll('.streaming-card');
    PLATFORMS.forEach((p, i) => {
      if (p.id === plat.id) cards[i].style.background = plat.color + '22';
    });

    contentArea.innerHTML = '<div class="spinner"></div>';

    try {
      // Fetch popular movies from this platform's top genres
      const genreId = plat.genres[0];
      const [movies, series] = await Promise.all([
        API.Movies.byGenre(genreId),
        API.Series.byGenre(genreId),
      ]);

      contentArea.innerHTML = '';

      // Movies section
      const s1 = UI.section(`Filmes no ${plat.name}`);
      s1.querySelector('.section-title').style.color = plat.color;
      const scroll1 = document.createElement('div');
      scroll1.className = 'card-scroll';
      movies.results?.slice(0, 10).forEach(m => scroll1.appendChild(UI.movieCard(m, 'movie')));
      s1.appendChild(scroll1);
      contentArea.appendChild(s1);

      // Series section
      const s2 = UI.section(`Séries no ${plat.name}`);
      s2.querySelector('.section-title').style.color = plat.color;
      const scroll2 = document.createElement('div');
      scroll2.className = 'card-scroll';
      series.results?.slice(0, 10).forEach(s => scroll2.appendChild(UI.movieCard(s, 'tv')));
      s2.appendChild(scroll2);
      contentArea.appendChild(s2);

    } catch (e) {
      contentArea.innerHTML = `<div class="empty-state"><p>Erro ao carregar conteúdo</p></div>`;
    }
  }
};
