// ============================================================
//  CineVibe – Favorites Page
// ============================================================

Pages.Favorites = function(container) {
  container.innerHTML = `<div class="page fade-in" id="favPage"></div>`;
  const page = document.getElementById('favPage');

  page.innerHTML = `<h1 class="section-title" style="margin-bottom:20px">❤️ <span class="accent">Favoritos</span></h1>`;

  const favs = Store.getFavorites();
  if (!favs.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = `
      <div class="icon">🎬</div>
      <h3>Nenhum favorito ainda</h3>
      <p>Explore filmes e séries e marque seus favoritos com ❤️</p>
      <button class="btn btn-primary btn-sm" onclick="Router.navigate('home')">Explorar</button>`;
    page.appendChild(empty);
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'card-grid';
  favs.forEach(item => {
    const card = UI.movieCard(item, item.type);
    grid.appendChild(card);
  });
  page.appendChild(grid);
};

// ============================================================
//  CineVibe – Watchlist Page
// ============================================================

Pages.Watchlist = function(container) {
  container.innerHTML = `<div class="page fade-in" id="watchPage"></div>`;
  const page = document.getElementById('watchPage');

  page.innerHTML = `<h1 class="section-title" style="margin-bottom:20px">📌 <span class="accent">Quero Ver</span></h1>`;

  const list = Store.getWatchlist();
  if (!list.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = `
      <div class="icon">📌</div>
      <h3>Lista vazia</h3>
      <p>Adicione títulos para assistir depois clicando em "Quero Ver"</p>
      <button class="btn btn-primary btn-sm" onclick="Router.navigate('home')">Explorar</button>`;
    page.appendChild(empty);
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'card-grid';
  list.forEach(item => {
    const card = UI.movieCard(item, item.type);

    // Add "Marcar como visto" overlay
    const poster = card.querySelector('.card-poster');
    const seenBtn = document.createElement('button');
    seenBtn.style.cssText = `
      position:absolute;bottom:6px;left:6px;right:6px;
      background:rgba(0,229,200,0.9);color:#000;
      font-size:10px;font-weight:700;padding:4px 8px;
      border-radius:6px;display:none;`;
    seenBtn.textContent = '✓ Visto';
    seenBtn.onclick = (e) => {
      e.stopPropagation();
      Store.toggleWatchlist(item);
      Store.toggleSeen(item);
      card.remove();
      UI.toast('Marcado como visto! ✅', 'success');
    };
    poster.appendChild(seenBtn);
    card.addEventListener('mouseenter', () => seenBtn.style.display = 'block');
    card.addEventListener('mouseleave', () => seenBtn.style.display = 'none');

    grid.appendChild(card);
  });
  page.appendChild(grid);
};
