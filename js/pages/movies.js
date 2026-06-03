// ============================================================
//  CineVibe – Movies Page (FIXED v2)
//  - Error handling em requisições
// ============================================================

Pages.Movies = async function(container) {
  container.innerHTML = `<div class="page fade-in" id="moviesPage"></div>`;
  const page = document.getElementById('moviesPage');

  let activeGenre = null;
  let currentPage = 1;

  let genresData;
  try { genresData = await API.Genres.movies(); }
  catch(e) { genresData = { genres: [] }; }
  const genreList = [{ id: null, name: 'Todos' }, ...(genresData.genres || [])];

  const header = document.createElement('div');
  header.innerHTML = `<h1 class="section-title" style="margin-bottom:16px">🎬 <span class="accent">Filmes</span></h1>`;
  page.appendChild(header);

  const chipsEl = UI.chips(genreList, null, (genre) => {
    activeGenre = genre.id;
    currentPage = 1;
    loadMovies();
  });
  page.appendChild(chipsEl);

  const grid = document.createElement('div');
  grid.className = 'card-grid';
  page.appendChild(grid);

  const loadMoreBtn = document.createElement('button');
  loadMoreBtn.className = 'btn btn-secondary';
  loadMoreBtn.style.cssText = 'width:100%;margin-top:20px;';
  loadMoreBtn.textContent = 'Carregar mais';
  loadMoreBtn.onclick = () => { currentPage++; loadMovies(true); };
  page.appendChild(loadMoreBtn);

  async function loadMovies(append = false) {
    if (!append) {
      grid.innerHTML = '';
      for (let i = 0; i < 6; i++) {
        const sk = document.createElement('div');
        sk.innerHTML = `<div class="skeleton" style="aspect-ratio:2/3;border-radius:12px;"></div>
          <div class="skeleton" style="width:80%;height:12px;margin-top:8px;"></div>`;
        grid.appendChild(sk);
      }
    }
    try {
      const data = activeGenre
        ? await API.Movies.byGenre(activeGenre, currentPage)
        : await API.Movies.popular(currentPage);

      if (!append) grid.innerHTML = '';
      data.results?.forEach(m => grid.appendChild(UI.movieCard(m, 'movie')));
      loadMoreBtn.style.display = data.total_pages > currentPage ? 'block' : 'none';
    } catch(e) {
      if (!append) grid.innerHTML = `<p style="color:var(--text-3);text-align:center;padding:40px;">Erro ao carregar filmes 😕</p>`;
      loadMoreBtn.style.display = 'none';
    }
  }

  loadMovies();
};