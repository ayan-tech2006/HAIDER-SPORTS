// Wishlist page logic: renders saved products from localStorage 'rashy_wishlist'
// Requires: data.js (api) and common.js (wishlist, cart, rs, img, esc, showToast, openCartDrawer)

document.addEventListener('DOMContentLoaded', () => {
  renderWishlistPage();
});

async function renderWishlistPage() {
  const grid = document.getElementById('wishlistGrid');
  const empty = document.getElementById('wishlistEmpty');
  const headerBar = document.getElementById('wishlistHeaderBar');
  const countText = document.getElementById('wishlistCountText');
  const addAllBtn = document.getElementById('addAllToCartBtn');
  const clearBtn = document.getElementById('clearWishlistBtn');

  if (!grid || !empty) return;

  const ids = wishlist.get();

  if (!ids.length) {
    grid.innerHTML = '';
    headerBar.style.display = 'none';
    empty.style.display = 'block';
    return;
  }

  // Fetch full product models
  let products = [];
  if (typeof api !== 'undefined' && api.getProductsByIds) {
    products = await api.getProductsByIds(ids);
  } else if (typeof api !== 'undefined' && api.getProductById) {
    const list = await Promise.all(ids.map(id => api.getProductById(id)));
    products = list.filter(Boolean).map(item => item.product || item);
  }

  if (!products.length) {
    grid.innerHTML = '';
    headerBar.style.display = 'none';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  headerBar.style.display = 'flex';
  countText.textContent = `${products.length} ${products.length === 1 ? 'item' : 'items'} saved`;

  // Render cards
  grid.innerHTML = products.map(p => {
    const hasVariants = Boolean(p.variants && p.variants.options && p.variants.options.length);
    const actionBtn = hasVariants
      ? `<a href="product.html?slug=${encodeURIComponent(p.slug)}" class="btn btn--dark btn--sm wishlist-card__btn"><i class="fa-solid fa-sliders"></i> Select Options</a>`
      : `<button type="button" class="btn btn--primary btn--sm wishlist-card__btn" data-add-wish="${esc(p.id)}"><i class="fa-solid fa-cart-shopping"></i> Add To Cart</button>`;

    return `
      <div class="wishlist-card" data-id="${esc(p.id)}">
        <button type="button" class="wishlist-card__remove" data-remove-wish="${esc(p.id)}" aria-label="Remove ${esc(p.name)} from wishlist" title="Remove from wishlist">
          <i class="fa-solid fa-xmark"></i>
        </button>
        <a href="product.html?slug=${encodeURIComponent(p.slug)}" class="wishlist-card__img">
          <img src="${img(p.img, 450)}" alt="${esc(p.name)}" loading="lazy">
        </a>
        <div class="wishlist-card__body">
          ${p.tag ? `<span class="wishlist-card__tag">${esc(p.tag)}</span>` : ''}
          <h4 class="wishlist-card__title">
            <a href="product.html?slug=${encodeURIComponent(p.slug)}">${esc(p.name)}</a>
          </h4>
          <div class="wishlist-card__price">
            ${p.old ? `<del>${rs(p.old)}</del>` : ''}
            <span>${rs(p.price)}</span>
          </div>
          ${actionBtn}
        </div>
      </div>
    `;
  }).join('');

  // Event listener for Remove button
  grid.querySelectorAll('[data-remove-wish]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const pid = btn.dataset.removeWish;
      const card = btn.closest('.wishlist-card');
      const name = card?.querySelector('.wishlist-card__title a')?.textContent?.trim() || 'Item';
      wishlist.remove(pid);
      showToast(`${name} removed from wishlist.`);
      renderWishlistPage();
    });
  });

  // Event listener for individual Add to Cart
  grid.querySelectorAll('[data-add-wish]').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.preventDefault();
      const pid = btn.dataset.addWish;
      const card = btn.closest('.wishlist-card');
      const prod = products.find(p => String(p.id) === String(pid));
      if (prod) {
        cart.add(prod, null, 1);
        showToast(`${prod.name} added to cart!`);
        openCartDrawer();
      }
    });
  });

  // Add all to cart button
  if (addAllBtn) {
    addAllBtn.onclick = () => {
      let addedCount = 0;
      products.forEach(p => {
        const defaultVariant = p.variants?.options?.[0] || null;
        cart.add(p, defaultVariant, 1);
        addedCount++;
      });
      if (addedCount > 0) {
        showToast(`Added ${addedCount} ${addedCount === 1 ? 'item' : 'items'} to cart!`);
        openCartDrawer();
      }
    };
  }

  // Clear wishlist button
  if (clearBtn) {
    clearBtn.onclick = () => {
      if (confirm('Are you sure you want to clear your entire wishlist?')) {
        wishlist.clear();
        showToast('Wishlist cleared.');
        renderWishlistPage();
      }
    };
  }
}

window.renderWishlistPage = renderWishlistPage;
