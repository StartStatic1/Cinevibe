// ============================================================
//  CineVibe – Router
//  Hash-based SPA routing
// ============================================================

const Router = (() => {
  const routes = {};
  let current = null;

  function register(name, handler) {
    routes[name] = handler;
  }

  async function navigate(page, params = {}) {
    if (!routes[page]) {
      console.warn('Unknown route:', page);
      return;
    }
    current = page;

    // Highlight bottom nav
    document.querySelectorAll('.bnav-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.page === page);
    });

    // Highlight sidebar
    document.querySelectorAll('.nav-link').forEach(a => {
      a.classList.toggle('active', a.dataset.page === page);
    });

    const container = document.getElementById('pageContainer');
    container.innerHTML = `<div class="page"><div class="spinner"></div></div>`;

    try {
      await routes[page](container, params);
    } catch (e) {
      console.error('Page error:', e);
      container.innerHTML = `<div class="page empty-state">
        <div class="icon">😕</div>
        <h3>Algo deu errado</h3>
        <p>${e.message}</p>
        <button class="btn btn-secondary btn-sm" onclick="Router.navigate('home')">Voltar ao início</button>
      </div>`;
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'instant' });
    // Update hash for back-button support
    window.location.hash = page;
  }

  function init() {
    // Handle hash changes
    window.addEventListener('hashchange', () => {
      const page = window.location.hash.replace('#', '') || 'home';
      if (page !== current && routes[page]) {
        navigate(page);
      }
    });
  }

  return { register, navigate, init, getCurrent: () => current };
})();
