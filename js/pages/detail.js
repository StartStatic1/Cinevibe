// ============================================================
//  CineVibe – Detail Modal
//  Full details for movies, series, and people
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

      const title      = data.title || data.name || 'Sem título';
      const overview   = data.overview || 'Sinopse não disponível.';
      const rating     = data.vote_average?.toFixed(1) || '–';
      const year       = (data.release_date || data.first_air_date || '').slice(0, 4);
      const runtime    = data.runtime
        ? `${Math.floor(data.runtime / 60)}h ${data.runtime % 60}m`
        : data.episode_run_time?.[0] ? `${data.episode_run_time[0]}min/ep` : '';
      const backdrop   = API.img(data.backdrop_path, CONFIG.IMG.BACKDROP);
      const poster     = API.img(data.poster_path, CONFIG.IMG.POSTER_MD);
      const genres     = (data.genres || []).map(g => g.name).join(' · ');
      const isFav      = Store.isFavorite(id, type);
      const inWL       = Store.inWatchlist(id, type);

      // Cast
      const cast = (data.credits?.cast || []).slice(0, 15);

      // Trailer
      const trailer = (data.videos?.results || []).find(
        v => v.type === 'Trailer' && v.site === 'YouTube'
      );

      // Watch providers (Brazil)
      const providers = data['watch/providers']?.results?.BR;
      const flatrate  = providers?.flatrate || [];
      const rent      = providers?.rent || [];

      // Recommendations
      const recs = (data.recommendations?.results || data.similar?.results || []).slice(0, 10);

      content.innerHTML = `
        <div class="detail-backdrop">
          ${backdrop
            ? `<img src="${backdrop}" alt="${title}" />`
            : poster ? `<img src="${poster}" alt="${title}" style="object-position:top;"/>` : ''}
          <div class="detail-backdrop-grad"></div>
        </div>
        <div class="detail-body">
          <h2 class="detail-title">${title}</h2>

          <div class="detail-meta">
            ${year ? `<div class="detail-meta-item">📅 ${year}</div>` : ''}
            ${runtime ? `<div class="detail-meta-item">⏱ ${runtime}</div>` : ''}
            <div class="detail-meta-item">⭐ ${rating}</div>
            ${data.number_of_seasons ? `<div class="detail-meta-item">📺 ${data.number_of_seasons} temp.</div>` : ''}
            ${data.number_of_episodes ? `<div class="detail-meta-item">${data.number_of_episodes} eps</div>` : ''}
          </div>

          ${genres ? `<div class="chips" style="margin-bottom:14px;">${genres.split(' · ').map(g => `<span class="chip" style="cursor:default">${g}</span>`).join('')}</div>` : ''}

          <p class="detail-overview">${overview}</p>

          <div class="detail-actions">
            <button class="btn btn-primary btn-sm" id="btnFav">
              ${isFav ? '❤️ Favorito' : '🤍 Favoritar'}
            </button>
            <button class="btn btn-secondary btn-sm" id="btnWL">
              ${inWL ? '📌 Na lista' : '+ Quero Ver'}
            </button>
            ${trailer ? `<a href="https://youtube.com/watch?v=${trailer.key}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">▶ Trailer</a>` : ''}
          </div>

          ${flatrate.length || rent.length ? `
            <div style="margin-bottom:24px;">
              <div class="detail-section-title">Onde Assistir</div>
              <div class="streaming-list" id="streamingList"></div>
            </div>` : ''}

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

      // ---- Fav button ----
      content.querySelector('#btnFav')?.addEventListener('click', (e) => {
        const added = Store.toggleFavorite(Store.serialize(data, type));
        e.currentTarget.innerHTML = added ? '❤️ Favorito' : '🤍 Favoritar';
        UI.toast(added ? 'Adicionado aos favoritos!' : 'Removido dos favoritos', added ? 'success' : '');
      });

      // ---- Watchlist button ----
      content.querySelector('#btnWL')?.addEventListener('click', (e) => {
        const added = Store.toggleWatchlist(Store.serialize(data, type));
        e.currentTarget.innerHTML = added ? '📌 Na lista' : '+ Quero Ver';
        UI.toast(added ? '📌 Adicionado!' : 'Removido da lista');
      });

      // ---- Streaming badges ----
      const streamingList = content.querySelector('#streamingList');
      if (streamingList) {
        [...flatrate, ...rent].forEach(p => {
          const badge = UI.streamingBadge(p.provider_id);
          if (badge) streamingList.appendChild(badge);
          else {
            // Fallback: show provider name from TMDB
            const fb = document.createElement('div');
            fb.className = 'streaming-badge';
            fb.innerHTML = `<span>🎬</span> ${p.provider_name}`;
            streamingList.appendChild(fb);
          }
        });

        // Enrich with Watchmode (async, non-blocking)
        API.Watchmode.sources(id, type).then(sources => {
          if (!sources.length) return;
          sources.slice(0, 6).forEach(src => {
            const already = streamingList.querySelectorAll('.streaming-badge');
            const names   = Array.from(already).map(b => b.textContent.trim().toLowerCase());
            if (!names.some(n => n.includes(src.name.toLowerCase()))) {
              const fb = document.createElement('div');
              fb.className = 'streaming-badge';
              fb.innerHTML = `<span>📺</span> ${src.name}`;
              streamingList.appendChild(fb);
            }
          });
        }).catch(() => {});
      }

      // ---- Cast ----
      const castList = content.querySelector('#castList');
      cast.forEach(p => castList?.appendChild(UI.actorCard(p)));

      // ---- Recs ----
      const recsList = content.querySelector('#recsList');
      recs.forEach(r => recsList?.appendChild(UI.movieCard(r, r.title ? 'movie' : 'tv')));

    } catch (e) {
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
      const knownFor = (data.movie_credits?.cast || [])
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 10);

      content.innerHTML = `
        <div style="padding:24px 20px 32px;">
          <div style="display:flex;gap:16px;align-items:flex-start;margin-bottom:20px;">
            <div style="flex:0 0 100px;">
              <div style="width:100px;height:100px;border-radius:50%;overflow:hidden;
                background:var(--surface);border:3px solid var(--border);">
                ${photo ? `<img src="${photo}" alt="${data.name}" style="width:100%;height:100%;object-fit:cover;">` : '👤'}
              </div>
            </div>
            <div style="flex:1;">
              <h2 class="detail-title" style="font-size:24px;margin-top:0;">${data.name}</h2>
              ${data.birthday ? `<div class="detail-meta-item" style="display:inline-flex;margin-bottom:8px;">📅 ${data.birthday}</div>` : ''}
              ${data.place_of_birth ? `<div style="font-size:12px;color:var(--text-3);">📍 ${data.place_of_birth}</div>` : ''}
            </div>
          </div>

          <div class="detail-section-title">Biografia</div>
          <p style="font-size:14px;color:var(--text-2);line-height:1.7;margin-bottom:24px;
            max-height:200px;overflow-y:auto;">${bio}</p>

          ${knownFor.length ? `
            <div class="detail-section-title">Filmografia</div>
            <div class="card-scroll" id="personFilmography"></div>` : ''}
        </div>`;

      const filmList = content.querySelector('#personFilmography');
      knownFor.forEach(m => filmList?.appendChild(UI.movieCard(m, 'movie')));

    } catch (e) {
      content.innerHTML = `<div class="empty-state"><p>Erro ao carregar perfil</p></div>`;
    }
  }

  return { open, openPerson, close };
})();
