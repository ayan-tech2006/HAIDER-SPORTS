// Shared by every page: helpers, product card, cart/wishlist, header, footer.
const WHATSAPP_NUMBER = '923001234567';
const CONTACT_INFO = {
  phone: '+92 300 1234567',
  phoneRaw: '03001234567',
  whatsapp: '+92 300 1234567',
  whatsappRaw: '923001234567',
  email: 'support@haidersports.pk',
  address: 'Shop #14, Ground Floor, Sports Complex Market, Sialkot Cantt, Pakistan',
  hours: 'Monday – Saturday: 10:00 AM – 09:00 PM (Sunday Closed)'
};
const img = (src, w = 600) => {
  if (!src) return 'https://images.unsplash.com/photo-1593341646647-75b32930e4a1?w=600&q=80';
  const str = String(src).trim();
  if (str.startsWith('http://') || str.startsWith('https://') || str.startsWith('/') || str.startsWith('./') || str.startsWith('data:')) {
    return str;
  }
  if (str.startsWith('images/') || str.includes('storage/v1/object')) {
    const base = (typeof SUPABASE_URL !== 'undefined') ? SUPABASE_URL : 'https://wqsgotvsxjlagztyoawp.supabase.co';
    return `${base}/storage/v1/object/public/${str}`;
  }
  return `https://images.unsplash.com/photo-${str}?w=${w}&q=80`;
};
const rs = n => 'Rs. ' + Number(n || 0).toLocaleString('en-PK');
// Escape text before putting it in HTML (product names will come from the backend later)
const esc = s => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

const productCard = p => {
  const isLiked = typeof wishlist !== 'undefined' && wishlist.has(p.id);
  return `
  <div class="product" data-id="${p.id || ''}">
    <div class="product__img">
      ${p.tag ? `<span class="product__tag">${esc(p.tag)}</span>` : ''}
      <div class="product__actions">
        <button aria-label="Wishlist" data-like data-id="${p.id || ''}" class="${isLiked ? 'liked' : ''}"><i class="fa-${isLiked ? 'solid' : 'regular'} fa-heart"></i></button>
        <button aria-label="Quick view" onclick="location.href='product.html?slug=${encodeURIComponent(p.slug || '')}'"><i class="fa-regular fa-eye"></i></button>
      </div>
      <a href="product.html?slug=${encodeURIComponent(p.slug || '')}"><img src="${img(p.img)}" alt="${esc(p.name)}" loading="lazy"></a>
    </div>
    <div class="product__stars"><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star-half-stroke"></i></div>
    <h4><a href="product.html?slug=${encodeURIComponent(p.slug || '')}">${esc(p.name)}</a></h4>
    <div class="product__price">${p.old ? `<del>${rs(p.old)}</del>` : ''}${rs(p.price)}</div>
    <button class="btn btn--dark" data-add>Add To Cart <i class="fa-solid fa-cart-shopping"></i></button>
  </div>`;
};

// Toast notification
const toast = Object.assign(document.createElement('div'), { className: 'toast' });
document.body.appendChild(toast);
let toastTimer;
const showToast = msg => {
  toast.innerHTML = `<i class="fa-solid fa-circle-check"></i>${msg}`;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
};

// ==========================================
// WISHLIST MODULE (localStorage 'rashy_wishlist')
// ==========================================
const wishlist = {
  get() {
    try {
      const raw = localStorage.getItem('haider_wishlist') || localStorage.getItem('rashy_wishlist');
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (err) {
      console.warn('Wishlist read error:', err);
      return [];
    }
  },

  save(ids) {
    try {
      localStorage.setItem('haider_wishlist', JSON.stringify(ids));
    } catch (err) {
      console.warn('Wishlist write error:', err);
    }
    this.updateUI();
  },

  has(id) {
    if (!id) return false;
    return this.get().includes(String(id));
  },

  add(id) {
    if (!id) return;
    const strId = String(id);
    const list = this.get();
    if (!list.includes(strId)) {
      list.push(strId);
      this.save(list);
    }
  },

  remove(id) {
    if (!id) return;
    const strId = String(id);
    const list = this.get().filter(x => x !== strId);
    this.save(list);
  },

  toggle(id) {
    if (!id) return false;
    const strId = String(id);
    const list = this.get();
    const idx = list.indexOf(strId);
    let added = false;
    if (idx >= 0) {
      list.splice(idx, 1);
    } else {
      list.push(strId);
      added = true;
    }
    this.save(list);
    return added;
  },

  clear() {
    this.save([]);
  },

  count() {
    return this.get().length;
  },

  updateUI() {
    const list = this.get();
    const count = list.length;
    const badge = document.getElementById('wishCount');
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'grid' : 'none';
    }

    document.querySelectorAll('[data-like]').forEach(btn => {
      const pid = btn.dataset.id || btn.closest('.product')?.dataset.id;
      if (pid) {
        const isLiked = list.includes(String(pid));
        btn.classList.toggle('liked', isLiked);
        const icon = btn.querySelector('i');
        if (icon) {
          icon.className = `fa-${isLiked ? 'solid' : 'regular'} fa-heart`;
        }
      }
    });
  }
};

window.addEventListener('storage', e => {
  if (e.key === 'haider_wishlist' || e.key === 'rashy_wishlist') {
    wishlist.updateUI();
    if (typeof renderWishlistPage === 'function') {
      renderWishlistPage();
    }
  }
});

// ==========================================
// CART MODULE (localStorage under 'haider_cart')
// ==========================================
const lineKeyOf = (id, variant) => `${id}::${variant || ''}`;

const cart = {
  get() {
    try {
      const raw = localStorage.getItem('haider_cart') || localStorage.getItem('rashy_cart');
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      console.warn('localStorage read error:', err);
      return [];
    }
  },

  save(items) {
    try {
      localStorage.setItem('haider_cart', JSON.stringify(items));
    } catch (err) {
      console.warn('localStorage write error:', err);
    }
    this.updateUI();
  },

  add(product, variant = null, qty = 1) {
    const items = this.get();
    const v = variant ? String(variant).trim() : null;
    const addQty = Math.max(1, parseInt(qty, 10) || 1);

    const existing = items.find(i => String(i.id) === String(product.id) && (i.variant || null) === v);
    if (existing) {
      existing.qty += addQty;
    } else {
      items.push({
        id: product.id,
        slug: product.slug,
        name: product.name,
        img: product.img,
        price: Number(product.price) || 0,
        variant: v,
        qty: addQty,
      });
    }
    this.save(items);
    return items;
  },

  setQty(lineKey, qty) {
    let items = this.get();
    const newQty = parseInt(qty, 10) || 0;
    if (newQty <= 0) {
      items = items.filter(i => lineKeyOf(i.id, i.variant) !== lineKey);
    } else {
      const item = items.find(i => lineKeyOf(i.id, i.variant) === lineKey);
      if (item) item.qty = newQty;
    }
    this.save(items);
  },

  remove(lineKey) {
    this.setQty(lineKey, 0);
  },

  clear() {
    this.save([]);
  },

  count() {
    return this.get().reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  },

  subtotal() {
    return this.get().reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.qty) || 0)), 0);
  },

  updateUI() {
    const totalCount = this.count();
    const badges = document.querySelectorAll('#cartCount');
    badges.forEach(b => { b.textContent = totalCount; });

    renderCartDrawer();
    window.dispatchEvent(new CustomEvent('cartUpdated', {
      detail: { items: this.get(), count: totalCount, subtotal: this.subtotal() }
    }));
  }
};

// Sync across tabs
window.addEventListener('storage', e => {
  if (e.key === 'haider_cart' || e.key === 'rashy_cart') cart.updateUI();
});

// ==========================================
// CART DRAWER (Slide-in Panel from Right)
// ==========================================
let drawerOverlay, drawerPanel;

function initCartDrawer() {
  if (document.getElementById('cartDrawer')) return;

  drawerOverlay = document.createElement('div');
  drawerOverlay.className = 'cart-drawer-overlay';
  drawerOverlay.id = 'cartOverlay';

  drawerPanel = document.createElement('aside');
  drawerPanel.className = 'cart-drawer';
  drawerPanel.id = 'cartDrawer';
  drawerPanel.innerHTML = `
    <div class="cart-drawer__header">
      <h3>Shopping Cart <span id="drawerCount">(0)</span></h3>
      <button class="cart-drawer__close" id="drawerClose" aria-label="Close cart">&times;</button>
    </div>
    <div class="cart-drawer__body" id="drawerBody"></div>
    <div class="cart-drawer__footer" id="drawerFooter">
      <div class="cart-drawer__subtotal">
        <span>Subtotal:</span>
        <strong id="drawerSubtotal">Rs. 0</strong>
      </div>
      <p class="cart-drawer__note">Taxes and shipping calculated at checkout</p>
      <div class="cart-drawer__actions">
        <a href="cart.html" class="btn btn--dark">View Cart</a>
        <a href="cart.html" class="btn btn--primary" id="drawerCheckoutBtn">Checkout</a>
      </div>
    </div>
  `;

  document.body.appendChild(drawerOverlay);
  document.body.appendChild(drawerPanel);

  // Close handlers
  drawerOverlay.addEventListener('click', closeCartDrawer);
  drawerPanel.querySelector('#drawerClose').addEventListener('click', closeCartDrawer);
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && drawerPanel.classList.contains('open')) {
      closeCartDrawer();
    }
  });

  // Delegated stepper and remove buttons in drawer
  drawerPanel.querySelector('#drawerBody').addEventListener('click', e => {
    const stepBtn = e.target.closest('[data-drawer-step]');
    if (stepBtn) {
      const key = stepBtn.dataset.key;
      const delta = parseInt(stepBtn.dataset.drawerStep, 10);
      const items = cart.get();
      const item = items.find(i => lineKeyOf(i.id, i.variant) === key);
      if (item) {
        cart.setQty(key, item.qty + delta);
      }
      return;
    }

    const removeBtn = e.target.closest('[data-drawer-remove]');
    if (removeBtn) {
      const key = removeBtn.dataset.drawerRemove;
      cart.remove(key);
      showToast('Item removed from cart');
      return;
    }

    const contBtn = e.target.closest('#drawerContinueBtn');
    if (contBtn) {
      closeCartDrawer();
      if (!window.location.pathname.includes('shop.html')) {
        window.location.href = 'shop.html';
      }
    }
  });

  renderCartDrawer();
}

function openCartDrawer() {
  initCartDrawer();
  drawerOverlay?.classList.add('open');
  drawerPanel?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCartDrawer() {
  drawerOverlay?.classList.remove('open');
  drawerPanel?.classList.remove('open');
  document.body.style.overflow = '';
}

function renderCartDrawer() {
  const body = document.getElementById('drawerBody');
  const countEl = document.getElementById('drawerCount');
  const subtotalEl = document.getElementById('drawerSubtotal');
  const checkoutBtn = document.getElementById('drawerCheckoutBtn');
  if (!body) return;

  const items = cart.get();
  const count = cart.count();
  const subtotal = cart.subtotal();

  if (countEl) countEl.textContent = `(${count})`;
  if (subtotalEl) subtotalEl.textContent = rs(subtotal);

  if (items.length === 0) {
    body.innerHTML = `
      <div class="cart-drawer__empty">
        <i class="fa-solid fa-basket-shopping"></i>
        <p>Your cart is empty.</p>
        <button type="button" class="btn btn--primary btn--sm" id="drawerContinueBtn">Continue Shopping</button>
      </div>
    `;
    if (checkoutBtn) {
      checkoutBtn.classList.add('disabled');
      checkoutBtn.setAttribute('aria-disabled', 'true');
      checkoutBtn.style.pointerEvents = 'none';
      checkoutBtn.style.opacity = '0.5';
    }
    return;
  }

  if (checkoutBtn) {
    checkoutBtn.classList.remove('disabled');
    checkoutBtn.removeAttribute('aria-disabled');
    checkoutBtn.style.pointerEvents = 'auto';
    checkoutBtn.style.opacity = '1';
  }

  body.innerHTML = items.map(item => {
    const key = lineKeyOf(item.id, item.variant);
    return `
      <div class="cart-drawer__item" data-key="${esc(key)}">
        <a href="product.html?slug=${esc(item.slug)}" class="cart-drawer__thumb">
          <img src="${img(item.img, 150)}" alt="${esc(item.name)}">
        </a>
        <div class="cart-drawer__info">
          <a href="product.html?slug=${esc(item.slug)}" class="cart-drawer__title">${esc(item.name)}</a>
          ${item.variant ? `<span class="cart-drawer__variant">${esc(item.variant)}</span>` : ''}
          <div class="cart-drawer__price-row">
            <span class="cart-drawer__price">${rs(item.price)}</span>
            <div class="cart-drawer__stepper">
              <button type="button" data-drawer-step="-1" data-key="${esc(key)}" aria-label="Decrease">&minus;</button>
              <span>${item.qty}</span>
              <button type="button" data-drawer-step="1" data-key="${esc(key)}" aria-label="Increase">&plus;</button>
            </div>
            <button type="button" class="cart-drawer__remove" data-drawer-remove="${esc(key)}" aria-label="Remove item">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ==========================================
// GLOBAL EVENT HANDLERS
// ==========================================
let wish = 0;
document.addEventListener('click', async e => {
  // Catch placeholder links
  if (e.target.closest('a[href="#"]') && !e.target.closest('.badge-wrap[aria-label="Cart"]') && !e.target.closest('a[aria-label="Cart"]')) {
    e.preventDefault();
  }

  // Open cart drawer from header cart icon
  const cartTrigger = e.target.closest('a[aria-label="Cart"], .badge-wrap[aria-label="Cart"]');
  if (cartTrigger) {
    e.preventDefault();
    openCartDrawer();
    return;
  }

  // Add to cart from productCard
  const addBtn = e.target.closest('[data-add]');
  if (addBtn) {
    e.preventDefault();
    const productEl = addBtn.closest('.product');
    const pid = productEl?.dataset.id;
    let product = null;

    if (typeof api !== 'undefined' && api.getProductById && pid) {
      const res = await api.getProductById(pid);
      if (res && res.product) product = res.product;
    }

    if (!product && productEl) {
      const name = productEl.querySelector('h4 a')?.textContent?.trim() || 'Cricket Gear';
      const priceText = productEl.querySelector('.product__price')?.textContent || '0';
      const priceNum = parseInt(priceText.replace(/\D/g, ''), 10) || 0;
      const imgEl = productEl.querySelector('img');
      const imgSrc = imgEl?.src || '';
      const match = imgSrc.match(/photo-([^?]+)/);
      const imgId = match ? match[1] : '';
      const slug = productEl.querySelector('h4 a')?.getAttribute('href')?.replace(/.*slug=/, '') || '';
      product = { id: pid || `prod_${Date.now()}`, name, price: priceNum, img: imgId, slug };
    }

    if (product) {
      const defaultVariant = product.variants?.options?.[0] || null;
      cart.add(product, defaultVariant, 1);
      const vMsg = defaultVariant ? ` (${defaultVariant})` : '';
      showToast(`${product.name}${vMsg} added to cart!`);
      openCartDrawer();
    }
    return;
  }

  // Wishlist toggle
  const like = e.target.closest('[data-like]');
  if (like) {
    e.preventDefault();
    const pid = like.dataset.id || like.closest('.product')?.dataset.id;
    if (pid) {
      const added = wishlist.toggle(pid);
      const prodName = like.closest('.product')?.querySelector('h4 a')?.textContent?.trim() ||
                       document.getElementById('pageTitle')?.textContent?.trim() ||
                       document.querySelector('.pd-info h1')?.textContent?.trim() ||
                       'Item';
      if (added) {
        showToast(`${prodName} added to wishlist!`);
      } else {
        showToast(`${prodName} removed from wishlist.`);
      }
    }
    return;
  }
});

// DOM Ready initialization
document.addEventListener('DOMContentLoaded', () => {
  // Never inject customer cart drawer, search overlay, or store widgets on admin pages
  if (window.location.pathname.includes('/admin/') || window.location.pathname.endsWith('/admin')) {
    return;
  }

  initCartDrawer();
  initSearchOverlay();
  cart.updateUI();
  wishlist.updateUI();

  // Sticky header + mobile menu
  const header = document.getElementById('header');
  if (header) {
    window.addEventListener('scroll', () => header.classList.toggle('sticky', window.scrollY > 120));
  }
  const nav = document.getElementById('nav');
  const menuBtn = document.getElementById('menuBtn');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', () => nav.classList.toggle('open'));
    nav.addEventListener('click', e => e.target.closest('a') && nav.classList.remove('open'));
  }

  // Footer newsletter & year
  const newsletter = document.getElementById('newsletter');
  if (newsletter) {
    newsletter.addEventListener('submit', ev => {
      ev.preventDefault();
      ev.target.reset();
      showToast('Thanks for subscribing!');
    });
  }
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});

/* ============================================================
   SEARCH OVERLAY MODULE
   ============================================================ */
function initSearchOverlay() {
  if (document.getElementById('searchOverlay')) return;

  const overlayHtml = `
    <div id="searchOverlay" class="search-overlay" aria-hidden="true" role="dialog" aria-modal="true">
      <div class="search-overlay__backdrop"></div>
      <div class="search-overlay__panel">
        <div class="search-overlay__top">
          <form id="searchForm" class="search-overlay__form" action="shop.html#/search" method="get">
            <i class="fa-solid fa-magnifying-glass search-overlay__icon"></i>
            <input type="text" id="searchInput" class="search-overlay__input" placeholder="Search cricket bats, balls, kits, shoes..." autocomplete="off" spellcheck="false" aria-label="Search products">
            <button type="button" id="searchClear" class="search-overlay__clear" aria-label="Clear search" style="display:none;">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </form>
          <button type="button" id="searchClose" class="search-overlay__close" aria-label="Close search">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div id="searchResultsDropdown" class="search-overlay__body"></div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', overlayHtml);

  const overlay = document.getElementById('searchOverlay');
  const input = document.getElementById('searchInput');
  const clearBtn = document.getElementById('searchClear');
  const closeBtn = document.getElementById('searchClose');
  const form = document.getElementById('searchForm');
  const body = document.getElementById('searchResultsDropdown');

  let activeIndex = -1;
  let debounceTimer = null;

  function renderDefaultState() {
    body.innerHTML = `
      <div class="search-suggest-sec">
        <div class="search-suggest-sec__title">Popular Searches</div>
        <div class="search-col-pills">
          <a href="shop.html#/search?q=willow" class="search-col-pill search-suggest-item"><i class="fa-solid fa-magnifying-glass"></i> English Willow</a>
          <a href="shop.html#/search?q=ball" class="search-col-pill search-suggest-item"><i class="fa-solid fa-magnifying-glass"></i> Hard Ball</a>
          <a href="shop.html#/search?q=helmet" class="search-col-pill search-suggest-item"><i class="fa-solid fa-magnifying-glass"></i> Helmets</a>
          <a href="shop.html#/search?q=kit" class="search-col-pill search-suggest-item"><i class="fa-solid fa-magnifying-glass"></i> Cricket Kits</a>
          <a href="shop.html#/search?q=shoes" class="search-col-pill search-suggest-item"><i class="fa-solid fa-magnifying-glass"></i> Spikes Shoes</a>
          <a href="shop.html#/search?q=gloves" class="search-col-pill search-suggest-item"><i class="fa-solid fa-magnifying-glass"></i> Batting Gloves</a>
        </div>
      </div>
      <div class="search-suggest-sec">
        <div class="search-suggest-sec__title">Featured Collections</div>
        <div class="search-col-pills">
          <a href="shop.html#/cricket/bats/english-willow" class="search-col-pill search-suggest-item"><i class="fa-solid fa-folder-tree"></i> Bats &gt; English Willow</a>
          <a href="shop.html#/cricket/protection/helmets" class="search-col-pill search-suggest-item"><i class="fa-solid fa-folder-tree"></i> Protection &gt; Helmets</a>
          <a href="shop.html#/cricket/balls/leather" class="search-col-pill search-suggest-item"><i class="fa-solid fa-folder-tree"></i> Balls &gt; Leather Balls</a>
          <a href="shop.html#/footwear/cricket-shoes" class="search-col-pill search-suggest-item"><i class="fa-solid fa-folder-tree"></i> Footwear &gt; Cricket Shoes</a>
        </div>
      </div>
    `;
    activeIndex = -1;
  }

  function openSearch() {
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (!input.value.trim()) {
      renderDefaultState();
    }
    setTimeout(() => input.focus(), 50);
  }

  function closeSearch() {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    activeIndex = -1;
  }

  // Header icon trigger
  document.addEventListener('click', e => {
    const trigger = e.target.closest('a[aria-label="Search"], [data-search-btn]');
    if (trigger) {
      e.preventDefault();
      openSearch();
    }
  });

  closeBtn.addEventListener('click', closeSearch);
  overlay.querySelector('.search-overlay__backdrop').addEventListener('click', closeSearch);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) {
      closeSearch();
    }
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    clearBtn.style.display = 'none';
    renderDefaultState();
    input.focus();
  });

  function getSuggestItems() {
    return Array.from(body.querySelectorAll('.search-suggest-item'));
  }

  function updateActiveItem(items) {
    items.forEach((item, idx) => {
      if (idx === activeIndex) {
        item.classList.add('active');
        item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } else {
        item.classList.remove('active');
      }
    });
  }

  input.addEventListener('keydown', e => {
    const items = getSuggestItems();
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!items.length) return;
      activeIndex = (activeIndex + 1) % items.length;
      updateActiveItem(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!items.length) return;
      activeIndex = (activeIndex - 1 + items.length) % items.length;
      updateActiveItem(items);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && items[activeIndex]) {
        const targetHref = items[activeIndex].getAttribute('href');
        closeSearch();
        if (targetHref) {
          window.location.href = targetHref;
        }
      } else {
        submitSearch(input.value.trim());
      }
    }
  });

  function submitSearch(q) {
    if (!q) return;
    closeSearch();
    const target = `shop.html#/search?q=${encodeURIComponent(q)}`;
    if (window.location.pathname.endsWith('shop.html')) {
      window.location.hash = `#/search?q=${encodeURIComponent(q)}`;
    } else {
      window.location.href = target;
    }
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const items = getSuggestItems();
    if (activeIndex >= 0 && items[activeIndex]) {
      const targetHref = items[activeIndex].getAttribute('href');
      closeSearch();
      if (targetHref) window.location.href = targetHref;
    } else {
      submitSearch(input.value.trim());
    }
  });

  input.addEventListener('input', () => {
    const query = input.value.trim();
    clearBtn.style.display = input.value ? 'grid' : 'none';
    clearTimeout(debounceTimer);

    if (query.length < 2) {
      if (!query) renderDefaultState();
      else {
        body.innerHTML = `
          <div class="search-empty-msg">
            <i class="fa-solid fa-keyboard"></i>
            <h4>Keep typing...</h4>
            <p>Type at least 2 characters to search products.</p>
          </div>
        `;
      }
      return;
    }

    debounceTimer = setTimeout(async () => {
      if (typeof api === 'undefined' || !api.search) return;
      const res = await api.search(query);
      renderSuggestions(query, res);
    }, 250);
  });

  function renderSuggestions(query, res) {
    activeIndex = -1;
    const { products = [], collections = [] } = res || {};
    const topProducts = products.slice(0, 6);

    if (!topProducts.length && !collections.length) {
      body.innerHTML = `
        <div class="search-empty-msg">
          <i class="fa-regular fa-face-frown"></i>
          <h4>No results for "${esc(query)}"</h4>
          <p>Check spelling or try a different keyword.</p>
          <div class="search-pill-list">
            <a href="shop.html#/search?q=bat" class="search-pill">Bat</a>
            <a href="shop.html#/search?q=ball" class="search-pill">Ball</a>
            <a href="shop.html#/search?q=helmet" class="search-pill">Helmet</a>
            <a href="shop.html#/search?q=willow" class="search-pill">Willow</a>
            <a href="shop.html#/search?q=shoes" class="search-pill">Shoes</a>
          </div>
        </div>
      `;
      return;
    }

    let html = '';

    // Collections
    if (collections.length) {
      html += `
        <div class="search-suggest-sec">
          <div class="search-suggest-sec__title">Matching Collections (${collections.length})</div>
          <div class="search-col-pills">
            ${collections.map(c => `
              <a href="shop.html#/${c.path}" class="search-col-pill search-suggest-item" onclick="document.getElementById('searchOverlay').classList.remove('open'); document.body.style.overflow='';">
                <i class="fa-solid fa-folder-tree"></i>
                <span>${esc(c.trailStr || c.name)}</span>
              </a>
            `).join('')}
          </div>
        </div>
      `;
    }

    // Top Products
    if (topProducts.length) {
      html += `
        <div class="search-suggest-sec">
          <div class="search-suggest-sec__title">Matching Products (${products.length})</div>
          <div class="search-prod-list">
            ${topProducts.map(p => `
              <a href="product.html?slug=${esc(p.slug)}" class="search-prod-item search-suggest-item" onclick="document.getElementById('searchOverlay').classList.remove('open'); document.body.style.overflow='';">
                <img src="${img(p.img, 80)}" alt="${esc(p.name)}" class="search-prod-thumb" loading="lazy">
                <div class="search-prod-info">
                  <div class="search-prod-name">${esc(p.name)}</div>
                  <div class="search-prod-price">${rs(p.price)}</div>
                </div>
                <i class="fa-solid fa-chevron-right search-prod-arrow"></i>
              </a>
            `).join('')}
          </div>
        </div>
      `;
    }

    // See all results link
    html += `
      <a href="shop.html#/search?q=${encodeURIComponent(query)}" class="search-see-all search-suggest-item" onclick="document.getElementById('searchOverlay').classList.remove('open'); document.body.style.overflow='';">
        <span>See all ${products.length} results for "${esc(query)}"</span>
        <i class="fa-solid fa-arrow-right"></i>
      </a>
    `;

    body.innerHTML = html;
  }
}

// Global Newsletter Subscription Handler
document.addEventListener('DOMContentLoaded', () => {
  const newsletterForms = document.querySelectorAll('.newsletter, #newsletter');
  newsletterForms.forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      const email = input ? input.value.trim() : '';
      if (!email) return;

      const btn = form.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;

      try {
        if (typeof api !== 'undefined' && api.subscribe) {
          await api.subscribe(email);
        }
        showToast('Thank you for subscribing to Haider Sports!');
        form.reset();
      } catch (err) {
        showToast('Thank you for subscribing to Haider Sports!');
      } finally {
        if (btn) btn.disabled = false;
      }
    });
  });

  // Dynamic Header Navigation Sync
  syncHeaderNavigation();
});

window.addEventListener('hashchange', () => {
  if (typeof syncHeaderNavigation === 'function') {
    syncHeaderNavigation();
  }
});

async function syncHeaderNavigation() {
  const nav = document.getElementById('nav');
  if (!nav || typeof api === 'undefined' || !api.getTree) return;
  try {
    const tree = await api.getTree();
    if (!tree || tree.length === 0) return;

    const currentPath = window.location.pathname;
    const currentHash = window.location.hash;
    const isHome = currentPath.endsWith('index.html') || currentPath.endsWith('/') || currentPath === '';
    const isShop = currentPath.endsWith('shop.html');
    const isAbout = currentPath.endsWith('about.html');
    const isContact = currentPath.endsWith('contact.html');

    let html = `
      <a href="index.html" class="nav__link ${isHome && !currentHash ? 'active' : ''}">Home</a>
      <a href="shop.html" class="nav__link ${isShop && (!currentHash || currentHash === '#/') ? 'active' : ''}">Shop</a>
    `;

    tree.slice(0, 4).forEach(root => {
      const isActive = isShop && currentHash.startsWith(`#/${root.slug}`);
      html += `<a href="shop.html#/${root.slug}" class="nav__link ${isActive ? 'active' : ''}">${esc(root.name)}</a>`;
    });

    html += `
      <a href="about.html" class="nav__link ${isAbout ? 'active' : ''}">About</a>
      <a href="contact.html" class="nav__link ${isContact ? 'active' : ''}">Contact</a>
    `;

    nav.innerHTML = html;
  } catch (err) {
    // Keep fallback static nav
  }
}


