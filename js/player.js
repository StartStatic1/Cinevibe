// ============================================================
//  CineVibe – Player (FIXED v4)
//  - NÃO rotaciona ao trocar servidor (só na primeira abertura)
//  - Iframe ocupa 100% da tela, sem scroll
//  - Botão fechar 44x44px
// ============================================================

const Player = (() => {

  const SERVERS = [
    {
      // RedeCanais — servidor principal (substitui SuperFlix que bloqueou com.cinevibe.app)
      key: 'redecanais',
      label: 'RedeCanais',
      movie: (id) => `https://redecanais.nexus/player3/server.php?server=RCFServer2&subfolder=ondemand&vid=${id}`,
      tv:    (id, s, e) => `https://redecanais.nexus/player3/server.php?server=RCFServer2&subfolder=ondemand&vid=${id}&season=${s}&episode=${e}`,
    },
    {
      key: 'embedmovies',
      label: 'EmbedMovies',
      movie: (id) => `https://myembed.biz/filme/${id}`,
      tv:    (id, s, e) => `https://myembed.biz/serie/${id}/${s}/${e}`,
    },
    {
      key: 'betterflix',
      label: 'BetterFlix',
      movie: (id) => `https://betterflix.click/api/player?id=${id}&type=movie`,
      tv:    (id, s, e) => `https://betterflix.click/api/player?id=${id}&type=tv&season=${s}&episode=${e}`,
    },
    {
      key: 'embedplay',
      label: 'EmbedPlay',
      movie: (id) => `https://embedplayapi.top/embed/${id}`,
      tv:    (id, s, e) => `https://embedplayapi.top/embed/${id}/${s}/${e}`,
    },
  ];

  let _state = {
    id: null, type: null, title: null,
    season: 1, episode: 1,
    server: 'redecanais',
    seasons: [],
    overview: '',
    backdrop: null,
  };
  let _firstOpen = true;  // controla se é primeira abertura

  async function open(tmdbId, type, title, backdrop, overview) {
    _state.id       = tmdbId;
    _state.type     = type;
    _state.title    = title || 'Sem título';   // garante nunca undefined
    _state.backdrop = backdrop;
    _state.overview = overview || '';

    const saved = _loadProgress(tmdbId, type);
    _state.season  = saved?.season  || 1;
    _state.episode = saved?.episode || 1;
    _state.server  = saved?.server  || 'redecanais';

    if (type === 'tv') {
      _state.seasons = [];
      try {
        const detail = await API.Series.detail(tmdbId);
        _state.seasons = (detail.seasons || [])
          .filter(s => s.season_number > 0)
          .map(s => ({ number: s.season_number, count: s.episode_count, name: s.name }));
      } catch(e) {
        _state.seasons = [{ number: 1, count: 20, name: 'Temporada 1' }];
      }
    }

    _render();

    // Fullscreen + orientation lock APENAS na primeira abertura
    if (_firstOpen) {
      _firstOpen = false;
      try {
        const overlay = document.getElementById('playerOverlay');
        if (overlay?.requestFullscreen) await overlay.requestFullscreen();
        if (screen.orientation?.lock) await screen.orientation.lock('landscape');
      } catch(e) { /* ignore */ }
    }

    window.CineVibeBackBtn?.push('player');
  }

  function _render() {
    document.getElementById('playerOverlay')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'playerOverlay';
    overlay.className = 'player-overlay';

    const src = _buildSrc();

    overlay.innerHTML = `
      <div class="player-topbar">
        <button class="player-close-btn" id="playerClose" aria-label="Fechar">✕</button>
        <div class="player-title">${_state.title || 'Assistindo'}</div>
        <div style="font-size:11px;font-family:var(--font-mono);color:var(--text-3);">
          ${_state.type === 'tv' ? `T${_state.season} E${_state.episode}` : ''}
        </div>
      </div>

      <div class="player-iframe-wrap" id="playerIframeWrap">
        <iframe
          id="playerIframe"
          src="${src}"
          frameborder="0"
          allowfullscreen
          allow="autoplay *; encrypted-media *; picture-in-picture *; fullscreen *; clipboard-write *; accelerometer *; gyroscope *"
          loading="eager"
          scrolling="no"
        ></iframe>
      </div>

      <div class="player-bottom" id="playerBottom">
        ${_buildBottomHTML()}
      </div>`;

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    document.getElementById('playerClose').addEventListener('click', close);
    _bindBottomEvents();
  }

  function _buildSrc() {
    const srv = SERVERS.find(s => s.key === _state.server) || SERVERS[0];
    if (_state.type === 'movie') return srv.movie(_state.id);
    return srv.tv(_state.id, _state.season, _state.episode);
  }

  function _buildBottomHTML() {
    let html = '';

    if (_state.overview) {
      html += `<p class="player-info">${_state.overview.slice(0, 220)}${_state.overview.length > 220 ? '...' : ''}</p>`;
    }

    html += `<div style="margin-bottom:8px;font-size:11px;color:var(--text-3);font-family:var(--font-mono);">SERVIDOR</div>
      <div class="server-chips">
        ${SERVERS.map(s => `
          <button class="server-chip ${s.key === _state.server ? 'active' : ''}"
            data-server="${s.key}">${s.label}</button>`).join('')}
      </div>`;

    if (_state.type === 'tv' && _state.seasons.length) {
      html += `<div style="margin-bottom:8px;font-size:11px;color:var(--text-3);font-family:var(--font-mono);">TEMPORADA</div>
        <div class="season-chips">
          ${_state.seasons.map(s => `
            <button class="season-chip ${s.number === _state.season ? 'active' : ''}"
              data-season="${s.number}">T${s.number}</button>`).join('')}
        </div>`;

      const curSeason = _state.seasons.find(s => s.number === _state.season);
      const epCount   = curSeason?.count || 12;
      html += `<div style="margin-bottom:8px;font-size:11px;color:var(--text-3);font-family:var(--font-mono);">EPISÓDIO</div>
        <div class="episodes-grid" id="episodesGrid">
          ${Array.from({length: epCount}, (_,i) => i+1).map(ep => `
            <button class="ep-btn ${ep === _state.episode ? 'active' : ''}"
              data-ep="${ep}">Ep ${ep}</button>`).join('')}
        </div>`;
    }

    return html;
  }

  function _bindBottomEvents() {
    const bottom = document.getElementById('playerBottom');
    if (!bottom) return;

    bottom.querySelectorAll('.server-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        _state.server = btn.dataset.server;
        _saveProgress();
        _updateIframe();
        bottom.querySelectorAll('.server-chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        // NÃO chama fullscreen/orientation aqui!
      });
    });

    bottom.querySelectorAll('.season-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        _state.season  = parseInt(btn.dataset.season);
        _state.episode = 1;
        _saveProgress();
        _refreshBottom();
        _updateIframe();
      });
    });

    bottom.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-ep]');
      if (!btn) return;
      _state.episode = parseInt(btn.dataset.ep);
      _saveProgress();
      _updateIframe();
      bottom.querySelectorAll('.ep-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const topInfo = document.querySelector('.player-title + div');
      if (topInfo) topInfo.textContent = `T${_state.season} E${_state.episode}`;
    });
  }

  function _updateIframe() {
    const iframe = document.getElementById('playerIframe');
    if (iframe) iframe.src = _buildSrc();
  }

  function _refreshBottom() {
    const bottom = document.getElementById('playerBottom');
    if (!bottom) return;
    bottom.innerHTML = _buildBottomHTML();
    _bindBottomEvents();
  }

  async function close() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      if (screen.orientation?.unlock) screen.orientation.unlock();
    } catch(e) { /* ignore */ }

    _firstOpen = true;  // reseta para próxima abertura
    document.getElementById('playerOverlay')?.remove();
    document.body.style.overflow = '';
    window.CineVibeBackBtn?.clear('player');
  }

  function _saveProgress() {
    const key  = `cv_progress_${_state.type}_${_state.id}`;
    const data = {
      id: _state.id, type: _state.type,
      title: _state.title || 'Sem título',   // nunca salva undefined
      season: _state.season, episode: _state.episode,
      server: _state.server, backdrop: _state.backdrop,
      updatedAt: Date.now(),
    };
    try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
    _broadcastContinue();
  }

  function _loadProgress(id, type) {
    try { return JSON.parse(localStorage.getItem(`cv_progress_${type}_${id}`)); } catch { return null; }
  }

  function _broadcastContinue() {
    window.dispatchEvent(new CustomEvent('cv:progress', { detail: _state }));
  }

  function getContinueWatching() {
    const items = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k?.startsWith('cv_progress_')) continue;
      try {
        const d = JSON.parse(localStorage.getItem(k));
        if (d) items.push(d);
      } catch {}
    }
    return items.sort((a,b) => b.updatedAt - a.updatedAt).slice(0, 10);
  }

  return { open, close, getContinueWatching };
})();