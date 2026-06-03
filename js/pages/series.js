// ============================================================
//  CineVibe – Series Page
// ============================================================

Pages.Series = async function(container) {
  container.innerHTML = `<div class="page fade-in" id="seriesPage"></div>`;
  const page = document.getElementById('seriesPage');

  let activeGenre = null;
  let currentPage = 1;

  const genresData = await API.Genres.series();
  const genreList  = [{ id: null, name: 'Todas' }, ...(genresData.genres || [])];

  page.innerHTML = '';
  const header = document.createElement('div');
  header.innerHTML = `<h1 class="section-title" style="margin-bottom:16px">📺 <span class="accent">Séries</span></h1>`;
  page.appendChild(header);

  const chipsEl = UI.chips(genreList, null, (genre) => {
    activeGenre = genre.id;
    currentPage = 1;
    loadSeries();
  });
  page.appendChild(chipsEl);

  const grid = document.createElement('div');
  grid.className = 'card-grid';
  page.appendChild(grid);

  const loadMoreBtn = document.createElement('button');
  loadMoreBtn.className = 'btn btn-secondary';
  loadMoreBtn.style.cssText = 'width:100%;margin-top:20px;';
  loadMoreBtn.textContent = 'Carregar mais';
  loadMoreBtn.onclick = () => { currentPage++; loadSeries(true); };
  page.appendChild(loadMoreBtn);

  async function loadSeries(append = false) {
    if (!append) grid.innerHTML = '';
    const data = activeGenre
      ? await API.Series.byGenre(activeGenre, currentPage)
      : await API.Series.popular(currentPage);
    data.results?.forEach(s => grid.appendChild(UI.movieCard(s, 'tv')));
    loadMoreBtn.style.display = data.total_pages > currentPage ? 'block' : 'none';
  }

  loadSeries();
};
