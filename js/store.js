// ============================================================
//  CineVibe – Store
//  Local state: favorites, watchlist, seen, preferences
// ============================================================

const Store = (() => {
  const KEYS = {
    FAVORITES: 'cv_favorites',
    WATCHLIST:  'cv_watchlist',
    SEEN:       'cv_seen',
    PREFS:      'cv_prefs',
  };

  function _read(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch { return []; }
  }

  function _write(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.warn('Storage write failed:', e);
    }
  }

  // ---- Favorites ----
  function getFavorites()         { return _read(KEYS.FAVORITES); }
  function isFavorite(id, type)   { return getFavorites().some(i => i.id === id && i.type === type); }
  function toggleFavorite(item) {
    const favs = getFavorites();
    const idx  = favs.findIndex(i => i.id === item.id && i.type === item.type);
    if (idx >= 0) {
      favs.splice(idx, 1);
      _write(KEYS.FAVORITES, favs);
      return false;
    } else {
      favs.unshift(item);
      _write(KEYS.FAVORITES, favs);
      return true;
    }
  }

  // ---- Watchlist ----
  function getWatchlist()          { return _read(KEYS.WATCHLIST); }
  function inWatchlist(id, type)   { return getWatchlist().some(i => i.id === id && i.type === type); }
  function toggleWatchlist(item) {
    const list = getWatchlist();
    const idx  = list.findIndex(i => i.id === item.id && i.type === item.type);
    if (idx >= 0) {
      list.splice(idx, 1);
      _write(KEYS.WATCHLIST, list);
      return false;
    } else {
      list.unshift(item);
      _write(KEYS.WATCHLIST, list);
      return true;
    }
  }

  // ---- Seen ----
  function getSeen()             { return _read(KEYS.SEEN); }
  function hasSeen(id, type)     { return getSeen().some(i => i.id === id && i.type === type); }
  function toggleSeen(item) {
    const seen = getSeen();
    const idx  = seen.findIndex(i => i.id === item.id && i.type === item.type);
    if (idx >= 0) { seen.splice(idx, 1); } else { seen.unshift(item); }
    _write(KEYS.SEEN, seen);
    return !hasSeen(item.id, item.type);
  }

  // ---- Preferences ----
  function getPrefs() {
    try { return JSON.parse(localStorage.getItem(KEYS.PREFS)) || {}; }
    catch { return {}; }
  }
  function setPrefs(obj) {
    _write(KEYS.PREFS, { ...getPrefs(), ...obj });
  }

  // ---- Serialize item (minimal) ----
  function serializeMedia(tmdbObj, type) {
    return {
      id:       tmdbObj.id,
      type,
      title:    tmdbObj.title || tmdbObj.name,
      poster:   tmdbObj.poster_path,
      rating:   tmdbObj.vote_average,
      year:     (tmdbObj.release_date || tmdbObj.first_air_date || '').slice(0,4),
      addedAt:  Date.now(),
    };
  }

  return {
    getFavorites, isFavorite, toggleFavorite,
    getWatchlist, inWatchlist, toggleWatchlist,
    getSeen, hasSeen, toggleSeen,
    getPrefs, setPrefs,
    serialize: serializeMedia,
  };
})();
