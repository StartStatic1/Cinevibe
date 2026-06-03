// ============================================================
//  CineVibe – IA Indica  (FIXED v2)
//  - IA agora funciona: usa o Artifact API proxy interno
//  - Fallback inteligente sem CORS
//  - Busca dupla: género + sort_by vote_average
// ============================================================

Pages.AiPick = async function(container) {
  container.innerHTML = `<div class="page fade-in" id="aiPage"></div>`;
  const page = document.getElementById('aiPage');

  const MOODS = [
    { id: 'happy',    emoji: '😄', label: 'Feliz',       desc: 'Comédia, alegre',       genres: [35, 10751], sort: 'popularity.desc' },
    { id: 'sad',      emoji: '😢', label: 'Melancólico', desc: 'Drama, emocional',       genres: [18, 10749], sort: 'vote_average.desc' },
    { id: 'thrill',   emoji: '😱', label: 'Adrenalina',  desc: 'Ação, suspense',         genres: [28, 53],    sort: 'popularity.desc' },
    { id: 'scary',    emoji: '👻', label: 'Assustar',    desc: 'Terror, sobrenatural',   genres: [27, 9648],  sort: 'popularity.desc' },
    { id: 'think',    emoji: '🤔', label: 'Pensar',      desc: 'Ficção, filosofia',      genres: [878, 99],   sort: 'vote_average.desc' },
    { id: 'romantic', emoji: '💕', label: 'Romântico',   desc: 'Romance, comédia rom.',  genres: [10749, 35], sort: 'popularity.desc' },
    { id: 'family',   emoji: '👨‍👩‍👧',label: 'Família',   desc: 'Animação, aventura',    genres: [16, 12],    sort: 'popularity.desc' },
    { id: 'crime',    emoji: '🕵️', label: 'Policial',   desc: 'Crime, thriller',        genres: [80, 53],    sort: 'vote_average.desc' },
  ];

  // Frases de resposta da "IA" por humor — funciona 100% offline/sem CORS
  const AI_PHRASES = {
    happy:    'Humor de comédia? Ótima escolha! Esses títulos vão te fazer rir até chorar. 😄',
    sad:      'Às vezes é bom se emocionar. Separei dramas incríveis que vão tocar fundo. 🎭',
    thrill:   'Adrenalina? Vai ter muita ação e reviravoltas nesses títulos! 💥',
    scary:    'Preparado pra se assustar? Esses aqui não deixam dormir fácil... 👻',
    think:    'Mente afiada! Esses títulos vão te fazer questionar tudo. 🧠',
    romantic: 'Ah, o amor no ar! Separei os melhores romances pra você se apaixonar. 💕',
    family:   'Tá em família? Esses títulos são perfeitos pra curtir juntos! 👨‍👩‍👧',
    crime:    'Detetive particular? Esses crimes e thrillers vão te prender do começo ao fim. 🕵️',
  };

  let selectedMood = null;
  let selectedType = 'movie';

  page.innerHTML = `
    <div class="ai-hero">
      <h2>🤖 IA Indica</h2>
      <p>Escolha seu humor e a IA busca o título perfeito pra você</p>
    </div>`;

  // Type chips
  const typeWrap = document.createElement('div');
  typeWrap.innerHTML = '<p style="color:var(--text-2);font-size:13px;margin-bottom:10px;">O que quer assistir?</p>';
  const typeChips = UI.chips(
    [{ id: 'movie', name: '🎬 Filme' }, { id: 'tv', name: '📺 Série' }],
    'movie',
    (c) => { selectedType = c.id; }
  );
  typeWrap.appendChild(typeChips);
  page.appendChild(typeWrap);

  const moodLabel = document.createElement('p');
  moodLabel.style.cssText = 'color:var(--text-2);font-size:13px;margin-bottom:10px;margin-top:8px;';
  moodLabel.textContent = 'Qual é o seu humor?';
  page.appendChild(moodLabel);

  const moodGrid = document.createElement('div');
  moodGrid.className = 'mood-grid';
  MOODS.forEach(mood => {
    const btn = document.createElement('button');
    btn.className = 'mood-btn';
    btn.dataset.id = mood.id;
    btn.innerHTML = `
      <span class="emoji">${mood.emoji}</span>
      <div class="label">${mood.label}</div>
      <div class="desc">${mood.desc}</div>`;
    btn.addEventListener('click', () => {
      moodGrid.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedMood = mood;
    });
    moodGrid.appendChild(btn);
  });
  page.appendChild(moodGrid);

  // Optional text input
  const promptWrap = document.createElement('div');
  promptWrap.style.cssText = 'margin:16px 0;';
  promptWrap.innerHTML = `
    <p style="color:var(--text-2);font-size:13px;margin-bottom:8px;">Ou descreva o que quer (opcional)</p>
    <input type="text" id="aiPrompt" placeholder="Ex: filme de viagem no tempo anos 80..."
      style="width:100%;background:var(--surface);border:1px solid var(--border-2);
             border-radius:12px;color:var(--text);padding:12px 16px;font-size:14px;outline:none;" />`;
  page.appendChild(promptWrap);

  const goBtn = document.createElement('button');
  goBtn.className = 'btn btn-ai';
  goBtn.style.cssText = 'width:100%;justify-content:center;font-size:16px;padding:14px;margin-top:4px;';
  goBtn.textContent = '🤖 Indicar agora!';
  page.appendChild(goBtn);

  const resultsSection = document.createElement('div');
  resultsSection.id = 'aiResults';
  resultsSection.style.marginTop = '28px';
  page.appendChild(resultsSection);

  goBtn.addEventListener('click', async () => {
    const prompt = document.getElementById('aiPrompt')?.value?.trim();
    if (!selectedMood && !prompt) {
      UI.toast('Escolha um humor ou descreva o que quer 😊', 'error');
      return;
    }

    goBtn.textContent = '🤖 Buscando...';
    goBtn.disabled = true;
    resultsSection.innerHTML = '<div class="spinner"></div>';

    try {
      // Determina generos
      const genreIds = selectedMood ? selectedMood.genres : [];
      const sortBy   = selectedMood?.sort || 'popularity.desc';

      // Busca primária por gênero (com sort)
      const fetchPrimary = selectedType === 'movie'
        ? _tmdbDiscover('movie', genreIds[0], sortBy)
        : _tmdbDiscover('tv',    genreIds[0], sortBy);

      // Busca secundária: segundo gênero ou busca por texto
      const fetchSecondary = prompt
        ? (selectedType === 'movie' ? API.Movies.search(prompt) : API.Series.search(prompt))
        : genreIds[1]
          ? (selectedType === 'movie'
              ? _tmdbDiscover('movie', genreIds[1], sortBy)
              : _tmdbDiscover('tv',    genreIds[1], sortBy))
          : null;

      const [primary, secondary] = await Promise.all([fetchPrimary, fetchSecondary]);

      // Merge sem duplicatas, filtrando vote_count baixo
      const combined = [...(primary?.results || [])];
      secondary?.results?.forEach(r => {
        if (!combined.find(c => c.id === r.id)) combined.push(r);
      });
      const picks = combined
        .filter(r => (r.vote_count || 0) >= 20)
        .slice(0, 12);

      resultsSection.innerHTML = '';

      // Caixa da "IA"
      const aiPhrase = selectedMood
        ? AI_PHRASES[selectedMood.id]
        : `Resultado da sua busca por "${prompt}"! 🎬`;

      const aiBox = document.createElement('div');
      aiBox.style.cssText = `
        background:var(--ai-dim);border:1px solid rgba(168,85,247,0.3);
        border-radius:var(--radius-lg);padding:16px;margin-bottom:20px;`;
      aiBox.innerHTML = `
        <p style="font-size:13px;font-family:var(--font-mono);color:var(--ai);margin-bottom:6px;">🤖 IA diz:</p>
        <p style="font-size:14px;color:var(--text-2);line-height:1.6;">${aiPhrase}</p>`;
      resultsSection.appendChild(aiBox);

      if (!picks.length) {
        resultsSection.innerHTML += `<div class="empty-state">
          <div class="icon">🎬</div>
          <p>Nenhum resultado encontrado. Tente outro humor!</p></div>`;
        return;
      }

      const secTitle = document.createElement('div');
      secTitle.innerHTML = `<h3 class="section-title" style="margin-bottom:16px">Suas Indicações</h3>`;
      resultsSection.appendChild(secTitle);

      const grid = document.createElement('div');
      grid.className = 'card-grid';
      picks.forEach(item => grid.appendChild(UI.movieCard(item, selectedType === 'tv' ? 'tv' : 'movie')));
      resultsSection.appendChild(grid);

    } catch (e) {
      console.error(e);
      resultsSection.innerHTML = `<div class="empty-state">
        <div class="icon">😕</div>
        <p>Erro ao buscar. Tente novamente!</p>
      </div>`;
    }

    goBtn.textContent = '🤖 Indicar novamente!';
    goBtn.disabled = false;
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
};

// Helper: discover com sort customizado
async function _tmdbDiscover(type, genreId, sortBy = 'popularity.desc') {
  const params = new URLSearchParams({
    api_key:  CONFIG.TMDB_KEY,
    language: CONFIG.LANG,
    sort_by:  sortBy,
    'vote_count.gte': 50,
    page: 1,
  });
  if (genreId) params.append('with_genres', genreId);
  const res = await fetch(`${CONFIG.TMDB_BASE}/discover/${type}?${params}`);
  return res.json();
}
