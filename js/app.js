// ============================================================
//  CineVibe – App Bootstrap
// ============================================================

// Init Pages namespace
window.Pages = window.Pages || {};

(async function init() {
  // ---- Register routes ----
  Router.register('home',       Pages.Home);
  Router.register('movies',     Pages.Movies);
  Router.register('series',     Pages.Series);
  Router.register('trending',   Pages.Trending);
  Router.register('aiPick',     Pages.AiPick);
  Router.register('streamings', Pages.Streamings);
  Router.register('favorites',  Pages.Favorites);
  Router.register('watchlist',  Pages.Watchlist);

  Router.init();

  // ---- Splash → App ----
  setTimeout(() => {
    document.getElementById('splash').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');

    // Determine initial page from hash
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

  // ---- Search ----
  const searchToggle  = document.getElementById('searchToggle');
  const searchOverlay = document.getElementById('searchOverlay');
  const searchInput   = document.getElementById('searchInput');
  const searchClose   = document.getElementById('searchClose');
  const searchResults = document.getElementById('searchResults');

  let searchTimer;

  searchToggle.addEventListener('click', () => {
    searchOverlay.classList.remove('hidden');
    setTimeout(() => searchInput.focus(), 100);
  });

  searchClose.addEventListener('click', () => {
    searchOverlay.classList.add('hidden');
    searchInput.value = '';
    searchResults.innerHTML = '';
  });

  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    const q = searchInput.value.trim();
    if (!q) { searchResults.innerHTML = ''; return; }
    searchResults.innerHTML = '<div class="spinner" style="margin:20px auto;"></div>';
    searchTimer = setTimeout(() => doSearch(q), 400);
  });

  async function doSearch(query) {
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
          Pages.Detail.openPerson(item.id);
        });
        searchResults.appendChild(card);
      } else {
        const card = UI.movieCard(item, type);
        card.querySelector('.card').addEventListener('click', () => {
          searchOverlay.classList.add('hidden');
        }, { once: true });
        searchResults.appendChild(card);
      }
    });
  }

  // ---- Modal close ----
  document.getElementById('modalClose').addEventListener('click', Pages.Detail.close);
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
