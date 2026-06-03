// ============================================================
//  CineVibe – App Bootstrap (FIXED v5)
//  - Search: clique em cards funciona 100%
//  - Back button: fecha search, modal, player
//  - Cards de busca usam grid 2-col corretamente
// ============================================================

window.Pages = window.Pages || {};

const BackBtn = {
  _stack: [],
  push(type) {
    this._stack.push(type);
    history.pushState({ cvOverlay: type }, '', window.location.href);
  },
  pop() {
    const type = this._stack.pop();
    if (type === 'player') { Player.close(); return true; }
    if (type === 'modal') { Pages.Detail.close(); return true; }
    if (type === 'search') {
      const so = document.getElementById('searchOverlay');
      if (so && !so.classList.contains('hidden')) {
        so.classList.add('hidden');
        document.body.style.overflow = '';
        document.getElementById('searchInput').value = '';
        document.getElementById('searchResults').innerHTML = '';
        return true;
      }
    }
    return false;
  },
  clear(type) {
    const idx = this._stack.lastIndexOf(type);
    if (idx >= 0) this._stack.splice(idx, 1);
  }
};

window.addEventListener('popstate', (e) => {
  if (e.state?.cvOverlay) BackBtn.pop();
});

window.CineVibeBackBtn = BackBtn;

(async function init() {
  Router.register('home',       Pages.Home);
  Router.register('movies',     Pages.Movies);
  Router.register('series',     Pages.Series);
  Router.register('trending',   Pages.Trending);
  Router.register('aiPick',     Pages.AiPick);
  Router.register('streamings', Pages.Streamings);
  Router.register('favorites',  Pages.Favorites);
  Router.register('watchlist',  Pages.Watchlist);

  Router.init();

  setTimeout(() => {
    document.getElementById('splash').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    const hash = window.location.hash.replace('#', '') || 'home';
    Router.navigate(hash);
  }, 1900);

  // ---- Sidebar ----
  const menuBtn       = document.getElementById('menuBtn');
  const sidebar       = document.getElementById('sidebar');
  const sidebarOverlay= document.getElementById('sidebarOverlay');

  function toggleSidebar(open) {
    sidebar.classList.toggle('open', open);
    sidebarOverlay.classList.toggle('hidden', !open);
    menuBtn.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }

  menuBtn.addEventListener('click', () => toggleSidebar(!sidebar.classList.contains('open')));
  sidebarOverlay.addEventListener('click', () => toggleSidebar(false));

  sidebar.addEventListener('click', (e) => {
    const link = e.target.closest('[data-page]');
    if (link) {
      e.preventDefault();
      Router.navigate(link.dataset.page);
      toggleSidebar(false);
    }
  });

  // ---- Bottom nav ----
  document.querySelector('.bottom-nav').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-page]');
    if (btn) Router.navigate(btn.dataset.page);
  });

  // ---- Top bar nav ----
  document.getElementById('favBtn').addEventListener('click', () => Router.navigate('favorites'));

  // ---- Search (FIXED v5) ----
  const searchToggle  = document.getElementById('searchToggle');
  const searchOverlay = document.getElementById('searchOverlay');
  const searchInput   = document.getElementById('searchInput');
  const searchClose   = document.getElementById('searchClose');
  const searchResults = document.getElementById('searchResults');

  let searchTimer;
  let searchAbort = null;

  searchToggle.addEventListener('click', () => {
    searchOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    BackBtn.push('search');
    setTimeout(() => searchInput.focus(), 100);
  });

  searchClose.addEventListener('click', () => {
    searchOverlay.classList.add('hidden');
    document.body.style.overflow = '';
    searchInput.value = '';
    searchResults.innerHTML = '';
    BackBtn.clear('search');
    if (searchAbort) { searchAbort.abort(); searchAbort = null; }
  });

  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    if (searchAbort) { searchAbort.abort(); searchAbort = null; }
    const q = searchInput.value.trim();
    if (!q) { searchResults.innerHTML = ''; return; }
    searchResults.innerHTML = '<div class="spinner" style="margin:20px auto;"></div>';
    searchTimer = setTimeout(() => doSearch(q), 400);
  });

  async function doSearch(query) {
    searchAbort = new AbortController();
    try {
      const data = await API.Search.multi(query);
      searchResults.innerHTML = '';
      const results = (data.results || []).filter(r =>
        r.media_type !== 'person' || r.profile_path
      ).slice(0, 20);

      if (!results.length) {
        searchResults.innerHTML = `<p style="color:var(--text-3);text-align:center;grid-column:1/-1;padding-top:20px;">Nenhum resultado encontrado</p>`;
        return;
      }

      results.forEach(item => {
        const type = item.media_type;
        if (type === 'person') {
          const card = UI.actorCard(item);
          card.addEventListener('click', () => {
            searchOverlay.classList.add('hidden');
            document.body.style.overflow = '';
            BackBtn.clear('search');
            Pages.Detail.openPerson(item.id);
          });
          searchResults.appendChild(card);
        } else {
          const card = UI.movieCard(item, type);
          // FIX v5: clique no card abre detalhes e fecha search
          card.addEventListener('click', () => {
            searchOverlay.classList.add('hidden');
            document.body.style.overflow = '';
            BackBtn.clear('search');
          });
          searchResults.appendChild(card);
        }
      });
    } catch (e) {
      if (e.name !== 'AbortError') {
        searchResults.innerHTML = `<p style="color:var(--text-3);text-align:center;grid-column:1/-1;padding-top:20px;">Erro na busca</p>`;
      }
    }
  }

  // ---- Modal close ----
  document.getElementById('modalClose').addEventListener('click', () => {
    Pages.Detail.close();
  });
  document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('modalOverlay')) Pages.Detail.close();
  });

  // ---- Topbar scroll shadow ----
  window.addEventListener('scroll', () => {
    const topbar = document.getElementById('topbar');
    topbar.style.boxShadow = window.scrollY > 10
      ? '0 4px 24px rgba(0,0,0,0.5)'
      : 'none';
  }, { passive: true });

})();