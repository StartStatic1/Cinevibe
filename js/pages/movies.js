// ============================================================
//  CineVibe – Movies Page
// ============================================================

Pages.Movies = async function(container) {
  container.innerHTML = `<div class="page fade-in" id="moviesPage"></div>`;
  const page = document.getElementById('moviesPage');

  // Genre filter state
  let activeGenre = null;
  let currentPage = 1;

  // Load genres
  const genresData = await API.Genres.movies();
  const genreList  = [{ id: null, name: 'Todos' }, ...(genresData.genres || [])];

  // Header
  const header = document.createElement('div');
  header.innerHTML = `<h1 class="section-title" style="margin-bottom:16px">🎬 <span class="accent">Filmes</span></h1>`;
  page.appendChild(header);

  // Genre chips
  const chipsEl = UI.chips(genreList, null, (genre) => {
    activeGenre = genre.id;
    currentPage = 1;
    loadMovies();
  });
  page.appendChild(chipsEl);

  // Cards container
  const grid = document.createElement('div');
  grid.className = 'card-grid';
  page.appendChild(grid);

  // Load more
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
    const data = activeGenre
      ? await API.Movies.byGenre(activeGenre, currentPage)
      : await API.Movies.popular(currentPage);

    if (!append) grid.innerHTML = '';
    data.results?.forEach(m => grid.appendChild(UI.movieCard(m, 'movie')));
    loadMoreBtn.style.display = data.total_pages > currentPage ? 'block' : 'none';
  }

  loadMovies();
};
