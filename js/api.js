// ============================================================
//  CineVibe – API Layer (FIXED v3)
//  LRU cache limitado, timeout em requisições, error handling
// ============================================================

const API = (() => {
  // ---- Internal LRU cache (max 100 entries) ----
  const _cache = new Map();
  const MAX_CACHE = 100;

  function _setCache(url, data) {
    if (_cache.size >= MAX_CACHE) {
      const firstKey = _cache.keys().next().value;
      _cache.delete(firstKey);
    }
    _cache.set(url, { data, ts: Date.now() });
  }

  async function _get(url, timeoutMs = 8000) {
    if (_cache.has(url)) {
      const { data, ts } = _cache.get(url);
      if (Date.now() - ts < CONFIG.CACHE_TTL) return data;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
      const data = await res.json();
      _setCache(url, data);
      return data;
    } catch (e) {
      clearTimeout(timer);
      if (e.name === 'AbortError') throw new Error('Timeout na requisição');
      throw e;
    }
  }

  function tmdb(path, params = {}) {
    const p = new URLSearchParams({
      api_key: CONFIG.TMDB_KEY,
      language: CONFIG.LANG,
      ...params,
    });
    return _get(`${CONFIG.TMDB_BASE}${path}?${p}`);
  }

  function tmdbEn(path, params = {}) {
    const p = new URLSearchParams({
      api_key: CONFIG.TMDB_KEY,
      language: 'en-US',
      ...params,
    });
    return _get(`${CONFIG.TMDB_BASE}${path}?${p}`);
  }

  function watchmode(path, params = {}) {
    const p = new URLSearchParams({
      apiKey: CONFIG.WATCHMODE_KEY,
      ...params,
    });
    return _get(`${CONFIG.WATCHMODE_BASE}${path}?${p}`);
  }

  // ---- Image helpers ----
  function img(path, size = 'w342') {
    if (!path) return null;
    return `${CONFIG.TMDB_IMG}/${size}${path}`;
  }

  // ---- TMDB endpoints ----
  const Movies = {
    trending: (timeWindow = 'week') =>
      tmdb(`/trending/movie/${timeWindow}`),

    popular: (page = 1) =>
      tmdb('/movie/popular', { page }),

    topRated: (page = 1) =>
      tmdb('/movie/top_rated', { page }),

    upcoming: () =>
      tmdb('/movie/upcoming'),

    nowPlaying: () =>
      tmdb('/movie/now_playing'),

    byGenre: (genreId, page = 1) =>
      tmdb('/discover/movie', { with_genres: genreId, page, sort_by: 'popularity.desc' }),

    detail: async (id) => {
      try {
        const data = await tmdb(`/movie/${id}`, { append_to_response: 'credits,videos,recommendations,similar,watch/providers,release_dates' });
        if (!data.overview || data.overview.trim() === '') {
          const en = await tmdbEn(`/movie/${id}`);
          data.overview = en.overview;
        }
        return data;
      } catch (e) {
        return tmdb(`/movie/${id}`, { append_to_response: 'credits,videos,recommendations,similar,watch/providers' });
      }
    },

    search: (query, page = 1) =>
      tmdb('/search/movie', { query, page }),
  };

  const Series = {
    trending: (timeWindow = 'week') =>
      tmdb(`/trending/tv/${timeWindow}`),

    popular: (page = 1) =>
      tmdb('/tv/popular', { page }),

    topRated: (page = 1) =>
      tmdb('/tv/top_rated', { page }),

    byGenre: (genreId, page = 1) =>
      tmdb('/discover/tv', { with_genres: genreId, page, sort_by: 'popularity.desc' }),

    detail: async (id) => {
      try {
        const data = await tmdb(`/tv/${id}`, { append_to_response: 'credits,videos,recommendations,similar,watch/providers' });
        if (!data.overview || data.overview.trim() === '') {
          const en = await tmdbEn(`/tv/${id}`);
          data.overview = en.overview;
        }
        return data;
      } catch (e) {
        return tmdb(`/tv/${id}`, { append_to_response: 'credits,videos,recommendations,similar,watch/providers' });
      }
    },

    search: (query, page = 1) =>
      tmdb('/search/tv', { query, page }),
  };

  const People = {
    popular: (page = 1) =>
      tmdb('/person/popular', { page }),

    detail: async (id) => {
      let data;
      try {
        data = await tmdb(`/person/${id}`, { append_to_response: 'movie_credits,tv_credits,images' });
        if (!data.biography || data.biography.trim().length < 100) {
          const en = await tmdbEn(`/person/${id}`);
          if (en.biography && en.biography.length > data.biography.length) {
            data.biography = en.biography;
          }
        }
      } catch (e) {
        data = await tmdbEn(`/person/${id}`, { append_to_response: 'movie_credits,tv_credits,images' });
      }
      return data;
    },

    search: (query) =>
      tmdb('/search/person', { query }),
  };

  const Genres = {
    movies: () => tmdb('/genre/movie/list'),
    series: () => tmdb('/genre/tv/list'),
  };

  const Search = {
    multi: (query, page = 1) =>
      tmdb('/search/multi', { query, page }),
  };

  // ---- Watchmode ----
  const Watchmode = {
    sources: async (tmdbId, type = 'movie') => {
      try {
        const search = await watchmode('/search/', {
          search_field: 'tmdb_movie_id',
          search_value: tmdbId,
        });
        if (!search.title_results || !search.title_results.length) return [];
        const wmId = search.title_results[0].id;
        const detail = await watchmode(`/title/${wmId}/details/`, { append_to_response: 'sources' });
        return detail.sources || [];
      } catch (e) {
        return [];
      }
    },

    trending: async () => {
      try {
        return await watchmode('/list-titles/', { sort_by: 'popularity_desc', limit: 20 });
      } catch (e) {
        return { titles: [] };
      }
    },
  };

  return { Movies, Series, People, Genres, Search, Watchmode, img };
})();