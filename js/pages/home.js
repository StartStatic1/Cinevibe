// ============================================================
//  CineVibe – Home Page  (v3 com Continuar Assistindo)
// ============================================================

Pages = window.Pages || {};

Pages.Home = async function(container) {
  container.innerHTML = `<div class="page fade-in" id="homePage"></div>`;
  const page = document.getElementById('homePage');

  // Fetch em paralelo
  const [trending, popular, trendingSeries] = await Promise.all([
    API.Movies.trending('week'),
    API.Movies.popular(),
    API.Series.trending('week'),
  ]);

  // ---- Continuar Assistindo ----
  _renderContinue(page);

  // ---- Hero ----
  const hero = trending.results?.[0];
  if (hero) {
    const backdrop = API.img(hero.backdrop_path, CONFIG.IMG.BACKDROP);
    const rating   = hero.vote_average?.toFixed(1) || '–';
    const year     = (hero.release_date || '').slice(0,4);

    const heroEl = document.createElement('div');
    heroEl.className = 'hero';
    heroEl.innerHTML = `
      ${backdrop ? `<img class="hero-img" src="${backdrop}" alt="${hero.title}" />` : ''}
      <div class="hero-gradient"></div>
      <div class="hero-content">
        <span class="hero-badge">🔥 Em alta esta semana</span>
        <h2 class="hero-title">${hero.title}</h2>
        <div class="hero-meta">
          <span class="hero-rating">⭐ ${rating}</span>
          <span>${year}</span>
        </div>
        <div class="hero-actions">
          <button class="btn btn-play" id="heroPlay">▶ Assistir</button>
          <button class="btn btn-secondary btn-sm" id="heroDetail">ℹ Detalhes</button>
          <button class="btn btn-secondary btn-sm" id="heroWL">+ Quero Ver</button>
        </div>
      </div>`;
    heroEl.querySelector('#heroPlay').onclick   = () => _playMovie(hero);
    heroEl.querySelector('#heroDetail').onclick = () => Pages.Detail.open(hero.id, 'movie');
    heroEl.querySelector('#heroWL').onclick     = () => {
      const added = Store.toggleWatchlist(Store.serialize(hero, 'movie'));
      UI.toast(added ? '📌 Adicionado!' : 'Removido da lista');
    };
    page.appendChild(heroEl);
  }

  // ---- Trending Filmes ----
  const s1 = UI.section('Filmes em', 'Alta', 'movies');
  const scroll1 = document.createElement('div'); scroll1.className = 'card-scroll';
  trending.results?.slice(0,14).forEach(m => scroll1.appendChild(_movieCardWithPlay(m,'movie')));
  s1.appendChild(scroll1); page.appendChild(s1);

  // ---- Trending Séries ----
  const s2 = UI.section('Séries em', 'Destaque', 'series');
  const scroll2 = document.createElement('div'); scroll2.className = 'card-scroll';
  trendingSeries.results?.slice(0,14).forEach(s => scroll2.appendChild(_movieCardWithPlay(s,'tv')));
  s2.appendChild(scroll2); page.appendChild(s2);

  // ---- Populares (wide) ----
  const s3 = UI.section('Populares da', 'Semana');
  const scroll3 = document.createElement('div'); scroll3.className = 'card-scroll';
  popular.results?.slice(0,10).forEach(m => scroll3.appendChild(UI.wideCard(m,'movie')));
  s3.appendChild(scroll3); page.appendChild(s3);

  // ---- AI teaser ----
  const aiTeaser = document.createElement('div');
  aiTeaser.className = 'ai-hero';
  aiTeaser.innerHTML = `
    <h2>🤖 IA Indica</h2>
    <p>Deixa a IA escolher o título perfeito pro seu humor agora</p>
    <button class="btn btn-ai" style="margin-top:14px" id="goAI">Quero uma indicação</button>`;
  aiTeaser.querySelector('#goAI').onclick = () => Router.navigate('aiPick');
  page.appendChild(aiTeaser);

  // Atualiza "continuar" quando player emite evento
  window.addEventListener('cv:progress', () => _renderContinue(page));
};

function _renderContinue(page) {
  const items = Player.getContinueWatching();
  // Remove seção anterior
  page.querySelector('#continueSection')?.remove();
  if (!items.length) return;

  const sec = UI.section('Continuar', 'Assistindo');
  sec.id = 'continueSection';
  const scroll = document.createElement('div'); scroll.className = 'card-scroll';

  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'continue-card';
    const thumb = item.backdrop
      ? `<img src="${API.img(item.backdrop, CONFIG.IMG.BACKDROP)}" alt="${item.title}" loading="lazy" />`
      : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:30px;background:var(--surface)">🎬</div>`;
    const sub = item.type === 'tv'
      ? `T${item.season} E${item.episode}`
      : 'Filme';

    card.innerHTML = `
      <div class="continue-thumb">
        ${thumb}
        <div class="continue-progress"><div class="continue-progress-fill" style="width:30%"></div></div>
        <div class="continue-play-icon">▶</div>
      </div>
      <div class="continue-info">
        <div class="continue-title">${item.title}</div>
        <div class="continue-sub">${sub}</div>
      </div>`;
    card.addEventListener('click', () => {
      Player.open(item.id, item.type, item.title, item.backdrop, '');
    });
    scroll.appendChild(card);
  });

  sec.appendChild(scroll);
  // Insere no topo da página, antes do hero
  page.insertBefore(sec, page.firstChild);
}

function _playMovie(item) {
  const backdrop = item.backdrop_path;
  const overview = item.overview || '';
  Player.open(item.id, 'movie', item.title || item.name, backdrop, overview);
}

function _movieCardWithPlay(item, type) {
  const card = UI.movieCard(item, type);
  // Adiciona botão play no poster
  const poster  = card.querySelector('.card-poster');
  const playBtn = document.createElement('div');
  playBtn.style.cssText = `
    position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
    background:rgba(0,0,0,0.4);opacity:0;transition:opacity 0.2s;
    font-size:26px;cursor:pointer;`;
  playBtn.textContent = '▶';
  playBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    Player.open(item.id, type, item.title || item.name, item.backdrop_path, item.overview);
  });
  poster.appendChild(playBtn);
  card.addEventListener('mouseenter', () => playBtn.style.opacity = '1');
  card.addEventListener('mouseleave', () => playBtn.style.opacity = '0');
  return card;
}
