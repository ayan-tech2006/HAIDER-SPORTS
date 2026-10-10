// Shop page: nested collections. The URL hash is the path, e.g. shop.html#/cricket/bats/english-willow
// Needs data.js (api, countProducts) and common.js (productCard, img, esc).
const $ = id => document.getElementById(id);
const content = $('shopContent');
const sortSelect = $('sortSelect');

const parsePath = () => location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
const hrefFor = trail => '#/' + trail.map(c => c.slug).join('/');

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const collectionMeta = c => {
  const prodCount = c.products ? c.products.length : (typeof c.productCount === 'number' ? c.productCount : countProducts(c));
  if (!c.children || c.children.length === 0) {
    return plural(prodCount, 'Product');
  }
  return `${plural(c.children.length, 'Collection')} · ${plural(countProducts(c), 'Product')}`;
};

const collectionCard = (c, href) => `
  <a class="collection" href="${href}">
    <img src="${img(c.img || c.image_url)}" alt="${esc(c.name)}" loading="lazy">
    <div class="collection__body">
      <h3>${esc(c.name)}</h3>
      <span>${collectionMeta(c)}</span>
    </div>
    <span class="collection__arrow"><i class="fa-solid fa-arrow-right"></i></span>
  </a>`;

const sorters = {
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  name: (a, b) => a.name.localeCompare(b.name),
};

// Sidebar tree: collections on the current path are open, current one is highlighted
const renderTree = (list, path, parents = []) => `
  ${list.map(c => {
    const trail = [...parents, c];
    const onPath = c.slug === path[parents.length] && parents.every((p, i) => p.slug === path[i]);
    const current = onPath && trail.length === path.length;
    const kids = c.children || [];
    const count = c.products ? c.products.length : (typeof c.productCount === 'number' ? c.productCount : (kids.length ? countProducts(c) : 0));
    return `<li class="${onPath ? 'open' : ''}">
      <div class="tree__row ${current ? 'current' : ''}">
        <a href="${hrefFor(trail)}">${esc(c.name)}</a>
        ${kids.length
          ? '<button class="tree__toggle" aria-label="Show sub-collections"><i class="fa-solid fa-chevron-down"></i></button>'
          : `<small>${count}</small>`}
      </div>
      ${kids.length ? `<ul>${renderTree(kids, path, trail)}</ul>` : ''}
    </li>`;
  }).join('')}`;

let currentProducts = [];
let currentExtraHtml = '';

const isSearchHash = () => {
  const h = location.hash.replace(/^#\/?/, '');
  return h.startsWith('search');
};

const getSearchParam = () => {
  const match = location.hash.match(/[?&]q=([^&]*)/);
  return match ? decodeURIComponent(match[1].replace(/\+/g, ' ')) : '';
};

const renderProducts = () => {
  const list = sorters[sortSelect.value] ? [...currentProducts].sort(sorters[sortSelect.value]) : currentProducts;
  if (!list || list.length === 0) {
    content.innerHTML = `${currentExtraHtml}
      <div class="empty">
        <i class="fa-solid fa-box-open" style="font-size: 40px; color: #94a3b8; margin-bottom: 12px; display: block;"></i>
        <h3 style="margin-bottom: 6px;">No Products Found</h3>
        <p style="color: #64748b; margin-bottom: 16px;">There are no active products in this collection yet.</p>
        <a href="#/" class="btn btn--primary">Browse All Collections</a>
      </div>`;
    return;
  }
  content.innerHTML = `${currentExtraHtml}<div class="product-grid product-grid--3">${list.map(productCard).join('')}</div>`;
};

async function render() {
  if (isSearchHash()) {
    const q = getSearchParam();
    const [tree, searchRes] = await Promise.all([
      api.getTree(),
      typeof api.search === 'function' ? api.search(q) : { products: [], collections: [] },
    ]);

    $('tree').innerHTML = renderTree(tree, []);
    document.title = q ? `Search: "${q}" - Haider Sports` : 'Search - Haider Sports';
    $('pageTitle').textContent = 'Search';
    $('breadcrumb').innerHTML = `<a href="index.html">Home</a><i class="fa-solid fa-chevron-right"></i><a href="#/">Shop</a><i class="fa-solid fa-chevron-right"></i><span aria-current="page">${q ? `Search: &ldquo;${esc(q)}&rdquo;` : 'Search'}</span>`;

    $('backLink').hidden = false;
    $('backLink').href = '#/';
    $('backLink').querySelector('span').textContent = 'Back to All Collections';

    const { products = [], collections = [] } = searchRes || {};
    currentExtraHtml = '';

    if (!q) {
      $('sectionTitle').textContent = 'Search Products';
      $('sectionCount').textContent = 'Type a keyword to search our catalog';
      $('sortWrap').hidden = true;
      content.innerHTML = `
        <div class="empty search-empty">
          <i class="fa-solid fa-magnifying-glass"></i>
          <h3>Search Our Store</h3>
          <p>Looking for a specific bat, ball, kit, or footwear?</p>
          <div class="search-empty__pills">
            <span>Try:</span>
            <a href="#/search?q=bat" class="search-pill">Bat</a>
            <a href="#/search?q=ball" class="search-pill">Ball</a>
            <a href="#/search?q=helmet" class="search-pill">Helmet</a>
            <a href="#/search?q=willow" class="search-pill">Willow</a>
            <a href="#/search?q=shoes" class="search-pill">Shoes</a>
          </div>
        </div>
      `;
      content.classList.remove('fade'); void content.offsetWidth; content.classList.add('fade');
      return;
    }

    if (products.length === 0) {
      $('sectionTitle').textContent = `No results for "${esc(q)}"`;
      $('sectionCount').textContent = '0 products';
      $('sortWrap').hidden = true;
      content.innerHTML = `
        <div class="empty search-empty">
          <i class="fa-regular fa-face-frown"></i>
          <h3>No products found</h3>
          <p>We couldn't find any products matching "<strong>${esc(q)}</strong>".</p>
          <div class="search-empty__pills">
            <span>Try:</span>
            <a href="#/search?q=bat" class="search-pill">Bat</a>
            <a href="#/search?q=ball" class="search-pill">Ball</a>
            <a href="#/search?q=helmet" class="search-pill">Helmet</a>
            <a href="#/search?q=willow" class="search-pill">Willow</a>
            <a href="#/search?q=shoes" class="search-pill">Shoes</a>
            <a href="#/search?q=gloves" class="search-pill">Gloves</a>
          </div>
          <a href="#/" class="btn btn--primary" style="margin-top: 15px;">Browse All Collections</a>
        </div>
      `;
      content.classList.remove('fade'); void content.offsetWidth; content.classList.add('fade');
      return;
    }

    // Products found
    $('sectionTitle').textContent = `Search: "${q}"`;
    $('sectionCount').textContent = `Showing ${plural(products.length, 'product')}`;
    $('sortWrap').hidden = false;
    currentProducts = products;

    if (collections.length) {
      currentExtraHtml = `
        <div style="margin-bottom: 24px; padding: 14px 18px; background: #fafafa; border-radius: 12px; border: 1px solid var(--border);">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; color: #888; margin-bottom: 8px;">Matching Collections</div>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            ${collections.map(c => `
              <a href="#/${c.path}" class="search-col-pill" style="text-decoration:none;">
                <i class="fa-solid fa-folder-tree"></i> ${esc(c.trailStr || c.name)}
              </a>
            `).join('')}
          </div>
        </div>
      `;
    }

    renderProducts();
    content.classList.remove('fade'); void content.offsetWidth; content.classList.add('fade');
    return;
  }

  currentExtraHtml = '';
  const path = parsePath();
  const [res, tree] = await Promise.all([api.getCollection(path), api.getTree()]);

  $('tree').innerHTML = renderTree(tree, res ? path : []);

  if (!res) {
    document.title = 'Not Found - Haider Sports';
    $('pageTitle').textContent = 'Not Found';
    $('breadcrumb').innerHTML = `<a href="index.html">Home</a><i class="fa-solid fa-chevron-right"></i><a href="#/">Shop</a>`;
    $('sectionTitle').textContent = 'Collection not found';
    $('sectionCount').textContent = '';
    $('backLink').hidden = true;
    $('sortWrap').hidden = true;
    content.innerHTML = `<div class="empty"><i class="fa-regular fa-folder-open"></i><p>This collection doesn't exist.</p><a href="#/" class="btn btn--primary">Browse All Collections</a></div>`;
    return;
  }

  const { node, trail } = res;
  const title = node ? node.name : 'Shop';
  document.title = `${title} - Haider Sports`;
  $('pageTitle').textContent = title;

  // Breadcrumbs: Home > Shop > Cricket > Bats > English Willow (last one is not a link)
  const crumbs = [`<a href="index.html">Home</a>`, node ? `<a href="#/">Shop</a>` : `<span aria-current="page">Shop</span>`];
  trail.forEach((c, i) => crumbs.push(i === trail.length - 1
    ? `<span aria-current="page">${esc(c.name)}</span>`
    : `<a href="${hrefFor(trail.slice(0, i + 1))}">${esc(c.name)}</a>`));
  $('breadcrumb').innerHTML = crumbs.join('<i class="fa-solid fa-chevron-right"></i>');

  $('backLink').hidden = !node;
  $('backLink').href = hrefFor(trail.slice(0, -1));
  $('backLink').querySelector('span').textContent = trail.length > 1 ? `Back to ${trail[trail.length - 2].name}` : 'Back to All Collections';

  if (node && node.products) {
    // Last level: products
    $('sectionTitle').textContent = node.name;
    $('sectionCount').textContent = `Showing ${plural(node.products.length, 'product')}`;
    $('sortWrap').hidden = false;
    currentProducts = node.products;
    renderProducts();
  } else {
    // Collection level: sub-collections
    const list = node ? node.children : tree;
    $('sectionTitle').textContent = node ? `Shop ${node.name}` : 'All Collections';
    $('sectionCount').textContent = plural(list.length, 'collection');
    $('sortWrap').hidden = true;
    if (!list || list.length === 0) {
      content.innerHTML = `
        <div class="empty">
          <i class="fa-regular fa-folder-open" style="font-size: 40px; color: #94a3b8; margin-bottom: 12px; display: block;"></i>
          <h3 style="margin-bottom: 6px;">No Collections Available</h3>
          <p style="color: #64748b; margin-bottom: 16px;">There are no active sub-collections in this section.</p>
          <a href="#/" class="btn btn--primary">Browse All Collections</a>
        </div>`;
    } else {
      content.innerHTML = `<div class="collection-grid">${list.map(c => collectionCard(c, hrefFor([...trail, c]))).join('')}</div>`;
    }
  }

  content.classList.remove('fade'); void content.offsetWidth; content.classList.add('fade');
}

sortSelect.addEventListener('change', renderProducts);

addEventListener('hashchange', () => {
  sortSelect.value = 'default';
  $('sidebarBox').classList.remove('open');
  render().then(() => {
    const top = $('shopTop').offsetTop - 80;
    if (scrollY > top) scrollTo({ top, behavior: 'smooth' });
  });
});

// Expand/collapse a tree branch without navigating
$('tree').addEventListener('click', e => {
  const t = e.target.closest('.tree__toggle');
  if (t) t.closest('li').classList.toggle('open');
});

// Mobile: collapse the sidebar into a button
$('sidebarToggle').addEventListener('click', () => {
  const open = $('sidebarBox').classList.toggle('open');
  $('sidebarToggle').setAttribute('aria-expanded', open);
});

render();
