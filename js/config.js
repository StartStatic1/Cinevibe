// ============================================================
//  CineVibe – Configuration
//  Centralize all keys and constants here
// ============================================================

const CONFIG = {
  TMDB_KEY:      '072730d77b46330bda51e5fcaac85d75',
  WATCHMODE_KEY: 'gwOmzXcaSHNcNTFVo6pDCEogdkkwgSyumajryJV8',

  TMDB_BASE:      'https://api.themoviedb.org/3',
  TMDB_IMG:       'https://image.tmdb.org/t/p',
  WATCHMODE_BASE: 'https://api.watchmode.com/v1',

  // Image sizes
  IMG: {
    POSTER_SM:  'w185',
    POSTER_MD:  'w342',
    POSTER_LG:  'w500',
    BACKDROP:   'w780',
    BACKDROP_LG:'original',
    FACE:       'w185',
  },

  // TMDB language preference
  LANG: 'pt-BR',

  // Streamings to highlight (TMDB provider IDs)
  STREAMING_IDS: {
    8:    { name: 'Netflix',         color: '#e50914', emoji: '🔴' },
    337:  { name: 'Disney+',         color: '#1134b0', emoji: '🔵' },
    119:  { name: 'Amazon Prime',    color: '#00a8e0', emoji: '🟦' },
    384:  { name: 'HBO Max',         color: '#6E2DCD', emoji: '🟣' },
    531:  { name: 'Paramount+',      color: '#0064ff', emoji: '🔷' },
    619:  { name: 'Star+',           color: '#0a2463', emoji: '⭐' },
    2:    { name: 'Apple TV+',       color: '#999999', emoji: '⬜' },
    283:  { name: 'Crunchyroll',     color: '#ff6a00', emoji: '🟠' },
  },

  // App version & cache
  VERSION: '1.0.0',
  CACHE_TTL: 30 * 60 * 1000, // 30 min
};

// Prevent mutation
Object.freeze(CONFIG);
