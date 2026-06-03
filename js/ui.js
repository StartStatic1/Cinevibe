// ============================================================
//  CineVibe – UI Helpers
// ============================================================

const UI = (() => {

  // ---- Card builders ----
  function movieCard(item, type = 'movie') {
    const poster  = API.img(item.poster_path, CONFIG.IMG.POSTER_MD);
    const title   = item.title || item.name || 'Sem título';
    const year    = (item.release_date || item.first_air_date || '').slice(0,4);
    const rating  = item.vote_average ? item.vote_average.toFixed(1) : '–';
    const isFav   = Store.isFavorite(item.id, type);

    const el = document.createElement('div');
    el.className = 'card card-anim';
    el.dataset.id   = item.id;
    el.dataset.type = type;
    el.innerHTML = `
      <div class="card-poster">
        ${poster
          ? `<img src="${poster}" alt="${title}" loading="lazy" />`
          : `<div class="no-img">🎬</div>`}
        <div class="card-badge">⭐ ${rating}</div>
        <button class="card-fav-btn ${isFav ? 'active' : ''}"
                data-action="fav" data-id="${item.id}" data-type="${type}">
          ${isFav ? '❤️' : '🤍'}
        </button>
      </div>
      <div class="card-info">
        <div class="card-title">${title}</div>
        <div class="card-year">${year || '–'}</div>
      </div>`;

    // Click → detail
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-action="fav"]')) return;
      Pages.Detail.open(item.id, type);
    });

    // Fav button
    el.querySelector('[data-action="fav"]').addEventListener('click', (e) => {
      e.stopPropagation();
      const added = Store.toggleFavorite(Store.serialize(item, type));
      const btn   = e.currentTarget;
      btn.classList.toggle('active', added);
      btn.textContent = added ? '❤️' : '🤍';
      toast(added ? 'Adicionado aos favoritos!' : 'Removido dos favoritos', added ? 'success' : '');
    });

    return el;
  }

  function wideCard(item, type = 'movie') {
    const backdrop = API.img(item.backdrop_path, CONFIG.IMG.BACKDROP);
    const poster   = API.img(item.poster_path, CONFIG.IMG.POSTER_SM);
    const img      = backdrop || poster;
    const title    = item.title || item.name || 'Sem título';
    const year     = (item.release_date || item.first_air_date || '').slice(0,4);
    const rating   = item.vote_average ? item.vote_average.toFixed(1) : '–';

    const el = document.createElement('div');
    el.className = 'card-wide card-anim';
    el.innerHTML = `
      <div class="card-wide-thumb">
        ${img ? `<img src="${img}" alt="${title}" loading="lazy" />` : `<div class="no-img">🎬</div>`}
        <div class="card-badge">⭐ ${rating}</div>
      </div>
      <div class="card-wide-info">
        <div class="card-wide-title">${title}</div>
        <div class="card-wide-meta">${year} · ${type === 'movie' ? 'Filme' : 'Série'}</div>
      </div>`;
    el.addEventListener('click', () => Pages.Detail.open(item.id, type));
    return el;
  }

  function actorCard(person) {
    const face = API.img(person.profile_path, CONFIG.IMG.FACE);
    const el = document.createElement('div');
    el.className = 'actor-card';
    el.innerHTML = `
      <div class="actor-avatar">
        ${face ? `<img src="${face}" alt="${person.name}" loading="lazy" />` : '👤'}
      </div>
      <div class="actor-name">${person.name}</div>`;
    el.addEventListener('click', () => Pages.Detail.openPerson(person.id));
    return el;
  }

  // ---- Skeleton loaders ----
  function skeletonCards(n = 6) {
    const wrap = document.createElement('div');
    wrap.className = 'card-scroll';
    for (let i = 0; i < n; i++) {
      const c = document.createElement('div');
      c.style.cssText = 'flex:0 0 130px;';
      c.innerHTML = `
        <div class="skeleton" style="width:130px;aspect-ratio:2/3;border-radius:12px;"></div>
        <div class="skeleton" style="width:80%;height:12px;margin-top:8px;"></div>
        <div class="skeleton" style="width:50%;height:10px;margin-top:6px;"></div>`;
      wrap.appendChild(c);
    }
    return wrap;
  }

  // ---- Section builder ----
  function section(title, accentWord, seeAllPage) {
    const s = document.createElement('div');
    s.className = 'section';
    const [before, after] = title.split(accentWord || '|||');
    s.innerHTML = `
      <div class="section-header">
        <h2 class="section-title">${before || title}${accentWord ? `<span class="accent"> ${accentWord}</span>${after || ''}` : ''}</h2>
        ${seeAllPage ? `<a href="#" class="see-all" data-page="${seeAllPage}">Ver tudo →</a>` : ''}
      </div>`;
    if (seeAllPage) {
      s.querySelector('.see-all').addEventListener('click', (e) => {
        e.preventDefault();
        Router.navigate(seeAllPage);
      });
    }
    return s;
  }

  // ---- Toast ----
  function toast(msg, type = '') {
    const c = document.getElementById('toastContainer');
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }

  // ---- Chips builder ----
  function chips(items, activeId, onClick) {
    const wrap = document.createElement('div');
    wrap.className = 'chips';
    items.forEach(item => {
      const c = document.createElement('button');
      c.className = `chip ${item.id === activeId ? 'active' : ''}`;
      c.textContent = item.name;
      c.addEventListener('click', () => {
        wrap.querySelectorAll('.chip').forEach(x => x.classList.remove('active'));
        c.classList.add('active');
        onClick(item);
      });
      wrap.appendChild(c);
    });
    return wrap;
  }

  // ---- Stars rating ----
  function stars(rating) {
    const full = Math.round((rating / 10) * 5);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  }

  // ---- Streaming badge ----
  function streamingBadge(providerId) {
    const p = CONFIG.STREAMING_IDS[providerId];
    if (!p) return null;
    const el = document.createElement('div');
    el.className = 'streaming-badge';
    el.innerHTML = `<span class="dot" style="background:${p.color}"></span>${p.emoji} ${p.name}`;
    return el;
  }

  return { movieCard, wideCard, actorCard, skeletonCards, section, toast, chips, stars, streamingBadge };
})();
