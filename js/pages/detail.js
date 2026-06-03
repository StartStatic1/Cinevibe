// ============================================================
//  CineVibe – Detail Modal  (FIXED v2)
//  - backdrop com altura fixa, não vaza mais
//  - chips de gênero em scroll horizontal
//  - "Onde Assistir" sempre visível (mesmo sem flatrate)
//  - seção de streaming sempre mostra via TMDB providers
// ============================================================

Pages = window.Pages || {};
Pages.Detail = (() => {

  function open(id, type) {
    const overlay = document.getElementById('modalOverlay');
    const content = document.getElementById('modalContent');
    content.innerHTML = '<div class="spinner" style="margin:60px auto;"></div>';
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    _loadDetail(id, type, content);
  }

  function openPerson(id) {
    const overlay = document.getElementById('modalOverlay');
    const content = document.getElementById('modalContent');
    content.innerHTML = '<div class="spinner" style="margin:60px auto;"></div>';
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    _loadPerson(id, content);
  }

  function close() {
    document.getElementById('modalOverlay').classList.add('hidden');
    document.body.style.overflow = '';
  }

  async function _loadDetail(id, type, content) {
    try {
      const data = type === 'tv'
        ? await API.Series.detail(id)
        : await API.Movies.detail(id);

      const title    = data.title || data.name || 'Sem título';
      const overview = data.overview || 'Sinopse não disponível.';
      const rating   = data.vote_average?.toFixed(1) || '–';
      const year     = (data.release_date || data.first_air_date || '').slice(0, 4);
      const runtime  = data.runtime
        ? `${Math.floor(data.runtime / 60)}h ${data.runtime % 60}m`
        : data.episode_run_time?.[0] ? `${data.episode_run_time[0]}min/ep` : '';

      // Prefer backdrop; fall back to poster
      const backdrop = API.img(data.backdrop_path, CONFIG.IMG.BACKDROP);
      const poster   = API.img(data.poster_path, CONFIG.IMG.POSTER_MD);
      const heroImg  = backdrop || poster;

      const genres  = (data.genres || []).map(g => g.name);
      const isFav   = Store.isFavorite(id, type);
      const inWL    = Store.inWatchlist(id, type);

      const cast  = (data.credits?.cast || []).slice(0, 15);
      const trailer = (data.videos?.results || []).find(
        v => v.type === 'Trailer' && v.site === 'YouTube'
      ) || (data.videos?.results || []).find(v => v.site === 'YouTube');

      // Watch providers Brazil
      const providers = data['watch/providers']?.results?.BR;
      const flatrate  = providers?.flatrate || [];
      const rent      = providers?.rent     || [];
      const buy       = providers?.buy      || [];
      // Deduplicate all providers
      const allProviders = [];
      const seen = new Set();
      [...flatrate, ...rent, ...buy].forEach(p => {
        if (!seen.has(p.provider_id)) {
          seen.add(p.provider_id);
          allProviders.push({ ...p, mode: flatrate.find(f => f.provider_id === p.provider_id) ? 'stream' : 'rent' });
        }
      });

      const recs = (data.recommendations?.results || data.similar?.results || []).slice(0, 10);

      content.innerHTML = `
        <div class="detail-backdrop-wrap">
          ${heroImg
            ? `<img class="detail-backdrop-img" src="${heroImg}" alt="${title}" />`
            : `<div class="detail-backdrop-placeholder">🎬</div>`}
          <div class="detail-backdrop-grad"></div>
        </div>

        <div class="detail-body">
          <h2 class="detail-title">${title}</h2>

          <div class="detail-meta">
            ${year    ? `<div class="detail-meta-item">📅 ${year}</div>` : ''}
            ${runtime ? `<div class="detail-meta-item">⏱ ${runtime}</div>` : ''}
            <div class="detail-meta-item">⭐ ${rating}</div>
            ${data.number_of_seasons  ? `<div class="detail-meta-item">📺 ${data.number_of_seasons} temp.</div>` : ''}
            ${data.number_of_episodes ? `<div class="detail-meta-item">${data.number_of_episodes} eps</div>` : ''}
          </div>

          ${genres.length ? `
            <div class="chips-scroll">
              ${genres.map(g => `<span class="chip chip-static">${g}</span>`).join('')}
            </div>` : ''}

          <p class="detail-overview">${overview}</p>

          <div class="detail-actions">
            <button class="btn btn-play btn-sm" id="btnPlay">▶ Assistir</button>
            <button class="btn btn-primary btn-sm" id="btnFav">
              ${isFav ? '❤️ Favorito' : '🤍 Favoritar'}
            </button>
            <button class="btn btn-secondary btn-sm" id="btnWL">
              ${inWL ? '📌 Na lista' : '+ Quero Ver'}
            </button>
            ${trailer ? `<a href="https://youtube.com/watch?v=${trailer.key}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">▶ Trailer</a>` : ''}
          </div>

          <div style="margin-bottom:24px;">
            <div class="detail-section-title">Onde Assistir</div>
            <div class="streaming-list" id="streamingList">
              ${allProviders.length === 0 ? `<p style="color:var(--text-3);font-size:13px;">Não disponível no Brasil no momento</p>` : ''}
            </div>
          </div>

          ${cast.length ? `
            <div style="margin-bottom:24px;">
              <div class="detail-section-title">Elenco</div>
              <div class="actor-list" id="castList"></div>
            </div>` : ''}

          ${recs.length ? `
            <div style="margin-bottom:24px;">
              <div class="detail-section-title">Você também pode gostar</div>
              <div class="card-scroll" id="recsList"></div>
            </div>` : ''}
        </div>`;

      // ---- Play ----
      content.querySelector('#btnPlay')?.addEventListener('click', () => {
        Pages.Detail.close();
        Player.open(data.id, type, data.title || data.name, data.backdrop_path, data.overview);
      });

      // ---- Fav ----
      content.querySelector('#btnFav')?.addEventListener('click', (e) => {
        const added = Store.toggleFavorite(Store.serialize(data, type));
        e.currentTarget.innerHTML = added ? '❤️ Favorito' : '🤍 Favoritar';
        UI.toast(added ? 'Adicionado aos favoritos!' : 'Removido dos favoritos', added ? 'success' : '');
      });

      // ---- Watchlist ----
      content.querySelector('#btnWL')?.addEventListener('click', (e) => {
        const added = Store.toggleWatchlist(Store.serialize(data, type));
        e.currentTarget.innerHTML = added ? '📌 Na lista' : '+ Quero Ver';
        UI.toast(added ? '📌 Adicionado!' : 'Removido da lista');
      });

      // ---- Streaming badges ----
      const streamingList = content.querySelector('#streamingList');
      if (streamingList && allProviders.length) {
        allProviders.forEach(p => {
          const known = CONFIG.STREAMING_IDS[p.provider_id];
          const el = document.createElement('div');
          el.className = 'streaming-badge';
          if (known) {
            el.style.borderColor = known.color + '66';
            el.innerHTML = `<span class="dot" style="background:${known.color}"></span>${known.emoji} ${known.name}`;
          } else {
            el.innerHTML = `<span>🎬</span> ${p.provider_name}`;
          }
          // Show mode tag
          if (p.mode === 'rent') {
            const tag = document.createElement('span');
            tag.style.cssText = 'font-size:9px;color:var(--text-3);margin-left:4px;';
            tag.textContent = '(aluguel)';
            el.appendChild(tag);
          }
          streamingList.appendChild(el);
        });
      }

      // ---- Cast ----
      const castList = content.querySelector('#castList');
      cast.forEach(p => castList?.appendChild(UI.actorCard(p)));

      // ---- Recs ----
      const recsList = content.querySelector('#recsList');
      recs.forEach(r => recsList?.appendChild(UI.movieCard(r, r.title ? 'movie' : 'tv')));

    } catch (e) {
      console.error(e);
      content.innerHTML = `<div class="empty-state" style="padding:60px 20px;">
        <div class="icon">😕</div>
        <h3>Erro ao carregar</h3>
        <p>${e.message}</p>
      </div>`;
    }
  }

  async function _loadPerson(id, content) {
    try {
      const data  = await API.People.detail(id);
      const photo = API.img(data.profile_path, CONFIG.IMG.POSTER_MD);
      const bio   = data.biography || 'Biografia não disponível.';
      const knownFor = [...(data.movie_credits?.cast || []), ...(data.tv_credits?.cast || [])]
        .sort((a, b) => b.popularity - a.popularity)
        .filter((v, i, a) => a.findIndex(x => x.id === v.id) === i)
        .slice(0, 15);

      content.innerHTML = `
        <div style="padding:24px 20px 32px;">
          <div style="display:flex;gap:16px;align-items:flex-start;margin-bottom:20px;">
            <div style="flex:0 0 90px;">
              <div style="width:90px;height:90px;border-radius:50%;overflow:hidden;
                background:var(--surface);border:3px solid var(--accent);">
                ${photo ? `<img src="${photo}" alt="${data.name}" style="width:100%;height:100%;object-fit:cover;">` : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:36px;">👤</div>'}
              </div>
            </div>
            <div style="flex:1;min-width:0;">
              <h2 class="detail-title" style="font-size:22px;margin-top:0;line-height:1.2;">${data.name}</h2>
              ${data.birthday ? `<div style="font-size:12px;color:var(--text-3);margin-top:4px;">📅 ${data.birthday}</div>` : ''}
              ${data.place_of_birth ? `<div style="font-size:12px;color:var(--text-3);margin-top:2px;">📍 ${data.place_of_birth}</div>` : ''}
              ${data.known_for_department ? `<div style="font-size:12px;color:var(--accent);margin-top:6px;">${data.known_for_department}</div>` : ''}
            </div>
          </div>

          <div class="detail-section-title">Biografia</div>
          <div style="position:relative;margin-bottom:24px;">
            <p id="bioText" style="font-size:14px;color:var(--text-2);line-height:1.75;
              max-height:160px;overflow:hidden;transition:max-height 0.4s ease;">${bio}</p>
            <button id="bioToggle" style="color:var(--accent);font-size:13px;margin-top:6px;
              background:none;border:none;cursor:pointer;padding:0;">Ler mais ↓</button>
          </div>

          ${knownFor.length ? `
            <div class="detail-section-title">Filmografia</div>
            <div class="card-scroll" id="personFilmography"></div>` : ''}
        </div>`;

      // Bio toggle
      const bioText   = content.querySelector('#bioText');
      const bioToggle = content.querySelector('#bioToggle');
      let expanded    = false;
      bioToggle?.addEventListener('click', () => {
        expanded = !expanded;
        bioText.style.maxHeight = expanded ? 'none' : '160px';
        bioToggle.textContent   = expanded ? 'Recolher ↑' : 'Ler mais ↓';
      });
      // Hide toggle if text fits
      if (bioText && bioText.scrollHeight <= 160) bioToggle?.remove();

      const filmList = content.querySelector('#personFilmography');
      knownFor.forEach(m => {
        const type = m.title ? 'movie' : 'tv';
        filmList?.appendChild(UI.movieCard(m, type));
      });

    } catch (e) {
      content.innerHTML = `<div class="empty-state"><p>Erro ao carregar perfil</p></div>`;
    }
  }

  return { open, openPerson, close };
})();

// ---- Patch: ensure btnPlay works ----
// This is handled via DOMContentLoaded event binding below
