// Blog list page logic: category filtering, pagination, card rendering
document.addEventListener('DOMContentLoaded', async () => {
  const filtersEl = document.getElementById('blogFilters');
  const gridEl = document.getElementById('blogGrid');
  const paginationEl = document.getElementById('blogPagination');

  const params = new URLSearchParams(window.location.search);
  let currentCategory = params.get('category') || 'All';
  let currentPage = parseInt(params.get('page'), 10) || 1;
  const POSTS_PER_PAGE = 6;

  async function loadAndRender() {
    gridEl.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #777;">
        <i class="fa-solid fa-spinner fa-spin" style="font-size: 32px; color: var(--primary); margin-bottom: 12px; display: block;"></i>
        Loading cricket articles...
      </div>
    `;

    const { posts, total, page, totalPages, categories } = await api.getPosts({
      page: currentPage,
      limit: POSTS_PER_PAGE,
      category: currentCategory === 'All' ? null : currentCategory
    });

    renderFilters(categories);
    renderGrid(posts);
    renderPagination(page, totalPages);
  }

  function renderFilters(categories) {
    if (!filtersEl) return;
    filtersEl.innerHTML = categories.map(cat => {
      const isActive = cat.toLowerCase() === currentCategory.toLowerCase();
      return `
        <button type="button" 
                class="blog-filter-btn ${isActive ? 'active' : ''}" 
                data-cat="${cat}">
          ${cat}
        </button>
      `;
    }).join('');

    filtersEl.querySelectorAll('.blog-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const selected = btn.dataset.cat;
        if (selected.toLowerCase() === currentCategory.toLowerCase()) return;
        currentCategory = selected;
        currentPage = 1;
        updateUrl();
        loadAndRender();
      });
    });
  }

  function renderGrid(posts) {
    if (!gridEl) return;
    if (!posts || posts.length === 0) {
      gridEl.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 70px 20px; color: #666;">
          <i class="fa-solid fa-newspaper" style="font-size: 48px; color: #ccc; margin-bottom: 16px; display: block;"></i>
          <h3>No articles found in this category</h3>
          <p>Please select another category or check back soon for new guides.</p>
          <button type="button" class="btn btn--primary" style="margin-top: 16px;" id="resetCategoryBtn">
            View All Guides
          </button>
        </div>
      `;
      const resetBtn = document.getElementById('resetCategoryBtn');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          currentCategory = 'All';
          currentPage = 1;
          updateUrl();
          loadAndRender();
        });
      }
      return;
    }

    gridEl.innerHTML = posts.map(p => `
      <article class="news__card">
        <div class="news__img">
          <a href="post.html?slug=${encodeURIComponent(p.slug)}">
            <img src="${img(p.cover)}" alt="${esc(p.title)}" loading="lazy">
          </a>
          <span class="news__date"><b>${p.day || '15'}</b>${p.month || 'Oct'}</span>
        </div>
        <div class="news__content">
          <span class="news__tag">${esc(p.category)}</span>
          <div class="news__meta">
            <span><i class="fa-regular fa-user"></i> ${esc(p.author)}</span>
            <span><i class="fa-regular fa-clock"></i> ${esc(p.readTime)}</span>
          </div>
          <h4><a href="post.html?slug=${encodeURIComponent(p.slug)}">${esc(p.title)}</a></h4>
          <p class="news__excerpt">${esc(p.excerpt)}</p>
          <a href="post.html?slug=${encodeURIComponent(p.slug)}" class="news__readmore">
            Read Full Guide <i class="fa-solid fa-arrow-right"></i>
          </a>
        </div>
      </article>
    `).join('');
  }

  function renderPagination(page, totalPages) {
    if (!paginationEl) return;
    if (totalPages <= 1) {
      paginationEl.innerHTML = '';
      return;
    }

    let html = `
      <button type="button" class="blog-page-btn" ${page <= 1 ? 'disabled' : ''} id="prevPageBtn" aria-label="Previous page">
        <i class="fa-solid fa-chevron-left"></i>
      </button>
    `;

    for (let i = 1; i <= totalPages; i++) {
      html += `
        <button type="button" class="blog-page-btn ${i === page ? 'active' : ''}" data-page="${i}">
          ${i}
        </button>
      `;
    }

    html += `
      <button type="button" class="blog-page-btn" ${page >= totalPages ? 'disabled' : ''} id="nextPageBtn" aria-label="Next page">
        <i class="fa-solid fa-chevron-right"></i>
      </button>
    `;

    paginationEl.innerHTML = html;

    const prevBtn = document.getElementById('prevPageBtn');
    if (prevBtn && page > 1) {
      prevBtn.addEventListener('click', () => {
        currentPage = page - 1;
        updateUrl();
        loadAndRender();
        scrollToTop();
      });
    }

    const nextBtn = document.getElementById('nextPageBtn');
    if (nextBtn && page < totalPages) {
      nextBtn.addEventListener('click', () => {
        currentPage = page + 1;
        updateUrl();
        loadAndRender();
        scrollToTop();
      });
    }

    paginationEl.querySelectorAll('.blog-page-btn[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = parseInt(btn.dataset.page, 10);
        if (target !== currentPage) {
          currentPage = target;
          updateUrl();
          loadAndRender();
          scrollToTop();
        }
      });
    });
  }

  function updateUrl() {
    const url = new URL(window.location);
    if (currentCategory && currentCategory !== 'All') {
      url.searchParams.set('category', currentCategory);
    } else {
      url.searchParams.delete('category');
    }
    if (currentPage > 1) {
      url.searchParams.set('page', currentPage);
    } else {
      url.searchParams.delete('page');
    }
    window.history.pushState({}, '', url);
  }

  function scrollToTop() {
    window.scrollTo({
      top: gridEl.getBoundingClientRect().top + window.scrollY - 100,
      behavior: 'smooth'
    });
  }

  window.addEventListener('popstate', () => {
    const sp = new URLSearchParams(window.location.search);
    currentCategory = sp.get('category') || 'All';
    currentPage = parseInt(sp.get('page'), 10) || 1;
    loadAndRender();
  });

  loadAndRender();
});
