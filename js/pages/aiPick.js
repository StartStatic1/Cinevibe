// ============================================================
//  CineVibe – IA Indica Page
//  Mood-based recommendations using Claude AI + TMDB
// ============================================================

Pages.AiPick = async function(container) {
  container.innerHTML = `<div class="page fade-in" id="aiPage"></div>`;
  const page = document.getElementById('aiPage');

  const MOODS = [
    { id: 'happy',    emoji: '😄', label: 'Feliz',       desc: 'Comédia, alegre',        genres: [35, 10751] },
    { id: 'sad',      emoji: '😢', label: 'Melancólico', desc: 'Drama, emocional',        genres: [18, 10749] },
    { id: 'thrill',   emoji: '😱', label: 'Adrenalina',  desc: 'Ação, suspense',          genres: [28, 53] },
    { id: 'scary',    emoji: '👻', label: 'Assustar',    desc: 'Terror, sobrenatural',    genres: [27, 9648] },
    { id: 'think',    emoji: '🤔', label: 'Pensar',      desc: 'Ficção, filosofia',       genres: [878, 99] },
    { id: 'romantic', emoji: '💕', label: 'Romântico',   desc: 'Romance, comédia rom.',  genres: [10749, 35] },
    { id: 'family',   emoji: '👨‍👩‍👧',label: 'Família',    desc: 'Animação, aventura',     genres: [16, 12] },
    { id: 'crime',    emoji: '🕵️', label: 'Policial',   desc: 'Crime, thriller',         genres: [80, 53] },
  ];

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

  // Mood grid
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

  // AI prompt input (optional)
  const promptWrap = document.createElement('div');
  promptWrap.style.cssText = 'margin:16px 0;';
  promptWrap.innerHTML = `
    <p style="color:var(--text-2);font-size:13px;margin-bottom:8px;">Ou descreva o que quer (opcional)</p>
    <div style="display:flex;gap:10px;">
      <input type="text" id="aiPrompt" placeholder="Ex: filme de viagem no tempo anos 80..."
        style="flex:1;background:var(--surface);border:1px solid var(--border-2);border-radius:12px;
               color:var(--text);padding:12px 16px;font-size:14px;outline:none;" />
    </div>`;
  page.appendChild(promptWrap);

  // Go button
  const goBtn = document.createElement('button');
  goBtn.className = 'btn btn-ai';
  goBtn.style.cssText = 'width:100%;justify-content:center;font-size:16px;padding:14px;';
  goBtn.textContent = '🤖 Indicar agora!';
  page.appendChild(goBtn);

  // Results section
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

    goBtn.textContent = '🤖 Pensando...';
    goBtn.disabled = true;
    resultsSection.innerHTML = '<div class="spinner"></div>';

    try {
      // Step 1: AI suggests genre/keywords
      const aiResponse = await callClaudeAI(selectedMood, selectedType, prompt);

      // Step 2: Use AI keywords to search TMDB
      const genreIds  = selectedMood ? selectedMood.genres : [];
      const [primary, secondary] = await Promise.all([
        selectedType === 'movie'
          ? API.Movies.byGenre(genreIds[0] || 18)
          : API.Series.byGenre(genreIds[0] || 18),
        prompt
          ? (selectedType === 'movie' ? API.Movies.search(prompt) : API.Series.search(prompt))
          : null,
      ]);

      // Merge & deduplicate
      const combined = [...(primary.results || [])];
      if (secondary) {
        secondary.results?.forEach(r => {
          if (!combined.find(c => c.id === r.id)) combined.push(r);
        });
      }
      const picks = combined.slice(0, 12);

      resultsSection.innerHTML = '';

      // AI explanation
      const aiBox = document.createElement('div');
      aiBox.style.cssText = `
        background: var(--ai-dim); border: 1px solid rgba(168,85,247,0.3);
        border-radius: var(--radius-lg); padding: 16px; margin-bottom: 20px;`;
      aiBox.innerHTML = `
        <p style="font-size:13px;font-family:var(--font-mono);color:var(--ai);margin-bottom:6px;">🤖 IA diz:</p>
        <p style="font-size:14px;color:var(--text-2);line-height:1.6;">${aiResponse}</p>`;
      resultsSection.appendChild(aiBox);

      const secTitle = document.createElement('div');
      secTitle.innerHTML = `<h3 class="section-title" style="margin-bottom:16px">Suas Indicações</h3>`;
      resultsSection.appendChild(secTitle);

      const grid = document.createElement('div');
      grid.className = 'card-grid';
      picks.forEach(item => grid.appendChild(UI.movieCard(item, selectedType === 'tv' ? 'tv' : 'movie')));
      resultsSection.appendChild(grid);

    } catch (e) {
      resultsSection.innerHTML = `<div class="empty-state">
        <div class="icon">😕</div>
        <p>Erro ao buscar indicações. Tente novamente!</p>
      </div>`;
    }

    goBtn.textContent = '🤖 Indicar novamente!';
    goBtn.disabled = false;
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
};

// ---- Call Claude AI ----
async function callClaudeAI(mood, type, customPrompt) {
  const moodDesc = mood
    ? `O usuário está com humor "${mood.label}" (${mood.desc}).`
    : '';
  const typeDesc = type === 'tv' ? 'série de TV' : 'filme';
  const extra    = customPrompt ? `Descrição do usuário: "${customPrompt}".` : '';

  const systemPrompt = `Você é um crítico de cinema brasileiro especialista em streaming. 
Responda em português, de forma amigável e informal, com no máximo 2-3 frases. 
Explique por que determinado tipo de conteúdo combina com o humor do usuário.`;

  const userMsg = `${moodDesc} ${extra} Que tipo de ${typeDesc} seria perfeito agora? Justifique brevemente.`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMsg }],
      }),
    });
    const data = await res.json();
    return data.content?.[0]?.text || 'Aqui estão as melhores indicações para você!';
  } catch {
    return mood
      ? `Para um humor ${mood.label.toLowerCase()}, separei os melhores títulos!`
      : 'Aqui estão as melhores indicações baseadas na sua busca!';
  }
}
