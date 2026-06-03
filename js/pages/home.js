// ============================================================
//  CineVibe – Home Page
// ============================================================

Pages = window.Pages || {};

Pages.Home = async function(container) {
  container.innerHTML = `<div class="page fade-in" id="homePage"></div>`;
  const page = document.getElementById('homePage');

  // Fetch data in parallel
  const [trending, popular, upcomingSeries] = await Promise.all([
    API.Movies.trending('week'),
    API.Movies.popular(),
    API.Series.trending('week'),
  ]);

  // Hero banner (top trending)
  const hero = trending.results?.[0];
  if (hero) {
    const backdrop = API.img(hero.backdrop_path, CONFIG.IMG.BACKDROP);
    const rating   = hero.vote_average?.toFixed(1) || '–';
    const year     = (hero.release_date || '').slice(0,4);
    const genres   = (hero.genre_ids || []).slice(0,2).map(g => Genres[g] || '').filter(Boolean).join(' · ');

    const heroEl = document.createElement('div');
    heroEl.className = 'hero';
    heroEl.innerHTML = `
      ${backdrop ? `<img class="hero-img" src="${backdrop}" alt="${hero.title}" />` : ''}
      <div class="hero-gradient"></div>
      <div class="hero-content">
        <span class="hero-badge">Em alta esta semana</span>
        <h2 class="hero-title">${hero.title}</h2>
        <div class="hero-meta">
          <span class="hero-rating">⭐ ${rating}</span>
          <span>${year}</span>
          ${genres ? `<span>${genres}</span>` : ''}
        </div>
        <div class="hero-actions">
          <button class="btn btn-primary" id="heroDetail">▶ Detalhes</button>
          <button class="btn btn-secondary" id="heroWatchlist">+ Quero Ver</button>
        </div>
      </div>`;
    heroEl.querySelector('#heroDetail').onclick = () => Pages.Detail.open(hero.id, 'movie');
    heroEl.querySelector('#heroWatchlist').onclick = () => {
      const added = Store.toggleWatchlist(Store.serialize(hero, 'movie'));
      UI.toast(added ? '📌 Adicionado à lista!' : 'Removido da lista');
    };
    page.appendChild(heroEl);
  }

  // Trending Movies
  const s1 = UI.section('Filmes em', 'Alta', 'movies');
  const scroll1 = document.createElement('div');
  scroll1.className = 'card-scroll stagger';
  trending.results?.slice(0, 12).forEach(m => scroll1.appendChild(UI.movieCard(m, 'movie')));
  s1.appendChild(scroll1);
  page.appendChild(s1);

  // Trending Series
  const s2 = UI.section('Séries em', 'Destaque', 'series');
  const scroll2 = document.createElement('div');
  scroll2.className = 'card-scroll stagger';
  upcomingSeries.results?.slice(0, 12).forEach(s => scroll2.appendChild(UI.movieCard(s, 'tv')));
  s2.appendChild(scroll2);
  page.appendChild(s2);

  // Popular wide cards
  const s3 = UI.section('Populares da', 'Semana');
  const scroll3 = document.createElement('div');
  scroll3.className = 'card-scroll stagger';
  popular.results?.slice(0, 10).forEach(m => scroll3.appendChild(UI.wideCard(m, 'movie')));
  s3.appendChild(scroll3);
  page.appendChild(s3);

  // AI Pick teaser
  const aiTeaser = document.createElement('div');
  aiTeaser.className = 'ai-hero';
  aiTeaser.innerHTML = `
    <h2>🤖 IA Indica</h2>
    <p>Deixa a inteligência artificial escolher o filme perfeito pro seu humor agora</p>
    <button class="btn btn-ai" style="margin-top:16px" id="goAI">Quero uma indicação</button>`;
  aiTeaser.querySelector('#goAI').onclick = () => Router.navigate('aiPick');
  page.appendChild(aiTeaser);
};

// Genre ID → name lookup (static, for hero)
const Genres = {
  28: 'Ação', 12: 'Aventura', 16: 'Animação', 35: 'Comédia',
  80: 'Crime', 18: 'Drama', 14: 'Fantasia', 27: 'Terror',
  9648: 'Mistério', 10749: 'Romance', 878: 'Ficção Científica',
  53: 'Thriller', 37: 'Faroeste', 10759: 'Ação & Aventura',
  10765: 'Sci-Fi & Fantasia', 10766: 'Novela',
};
