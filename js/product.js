// Product Detail Page Logic
document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');

  const productDetail = document.getElementById('productDetail');
  const relatedSection = document.getElementById('relatedSection');
  const relatedGrid = document.getElementById('relatedGrid');
  const breadcrumb = document.getElementById('breadcrumb');
  const pageTitle = document.getElementById('pageTitle');

  if (!slug) {
    renderNotFound('No product selected.');
    return;
  }

  const data = await api.getProduct(slug);
  if (!data || !data.product) {
    renderNotFound('Product not found.');
    return;
  }

  const { product, trail } = data;

  // Update SEO Meta & Title
  document.title = `${product.name} - Haider Sports`;
  pageTitle.textContent = product.name;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.content = `Buy ${product.name} online at best price in Pakistan. ${product.description.slice(0, 150)}... Cash on delivery available.`;
  }

  // Render Breadcrumbs
  renderBreadcrumbs(product, trail);

  // Render Product Details
  renderProduct(product, trail);

  // Render Related Products
  renderRelated(product.slug);

  function renderNotFound(msg) {
    document.title = 'Product Not Found - Haider Sports';
    pageTitle.textContent = 'Product Not Found';
    breadcrumb.innerHTML = `
      <a href="index.html">Home</a>
      <i class="fa-solid fa-chevron-right"></i>
      <a href="shop.html">Shop</a>
      <i class="fa-solid fa-chevron-right"></i>
      <span>Not Found</span>
    `;
    productDetail.innerHTML = `
      <div class="empty">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <p>${esc(msg)} We could not find the gear you are looking for.</p>
        <a href="shop.html" class="btn btn--primary">Browse Shop <i class="fa-solid fa-arrow-right"></i></a>
      </div>
    `;
    relatedSection.style.display = 'none';
  }

  function renderBreadcrumbs(prod, trailList) {
    let html = `<a href="index.html">Home</a><i class="fa-solid fa-chevron-right"></i><a href="shop.html">Shop</a>`;
    let pathAcc = [];
    for (const c of trailList) {
      pathAcc.push(c.slug);
      html += `<i class="fa-solid fa-chevron-right"></i><a href="shop.html#/${pathAcc.join('/')}">${esc(c.name)}</a>`;
    }
    html += `<i class="fa-solid fa-chevron-right"></i><span>${esc(prod.name)}</span>`;
    breadcrumb.innerHTML = html;
  }

  function starsHtml(rating) {
    return `
    <span class="stars" style="--rating:${rating}" aria-label="${rating} out of 5">
      <span class="stars__base">${'<i class="fa-solid fa-star"></i>'.repeat(5)}</span>
      <span class="stars__fill">${'<i class="fa-solid fa-star"></i>'.repeat(5)}</span>
    </span>`;
  }

  // Estimated arrival: 2 to 4 days from today, e.g. "12 - 14 October"
  function arrivalRange() {
    const d = n => { const x = new Date(); x.setDate(x.getDate() + n); return x; };
    const a = d(2), b = d(4);
    const month = x => x.toLocaleDateString('en-GB', { month: 'long' });
    return a.getMonth() === b.getMonth()
      ? `${a.getDate()} - ${b.getDate()} ${month(b)}`
      : `${a.getDate()} ${month(a)} - ${b.getDate()} ${month(b)}`;
  }

  function renderProduct(p, trailList) {
    const isOutOfStock = p.stock <= 0;
    const isLowStock = p.stock > 0 && p.stock <= 3;
    const images = (p.images && p.images.length) ? p.images : (p.gallery && p.gallery.length) ? p.gallery : [p.img];
    const hasVariants = p.variants && p.variants.options && p.variants.options.length;
    const liked = typeof wishlist !== 'undefined' && wishlist.has(p.id);
    const lastCat = trailList[trailList.length - 1];
    const catHref = `shop.html#/${trailList.map(c => c.slug).join('/')}`;
    const offPct = p.old && p.old > p.price ? Math.round((p.old - p.price) / p.old * 100) : 0;

    const stockBadge = isOutOfStock
      ? `<span class="pdp-stock pdp-stock--out"><i class="fa-solid fa-circle-xmark"></i> Out of Stock</span>`
      : isLowStock
        ? `<span class="pdp-stock pdp-stock--low"><i class="fa-solid fa-fire"></i> Only ${p.stock} left</span>`
        : `<span class="pdp-stock pdp-stock--in"><i class="fa-solid fa-circle-check"></i> In Stock</span>`;

    const variantsHtml = hasVariants ? `
      <div class="pdp-variants">
        <div class="pdp-variants__title">Select ${esc(p.variants.label)}: <b id="selectedVariantText">none</b></div>
        <div class="pdp-variants__options" id="variantOptions">
          ${p.variants.options.map(opt => `<button type="button" class="pdp-variant" data-variant="${esc(opt)}">${esc(opt)}</button>`).join('')}
        </div>
        <div class="pd-variant-error" id="variantError">Please choose a ${esc(p.variants.label.toLowerCase())} before adding to cart.</div>
      </div>` : '';

    const galleryHtml = `
      <div class="pdp-gallery">
        <div class="pdp-gallery__main" id="galleryMain">
          ${p.tag ? `<span class="pdp-gallery__tag">${esc(p.tag)}</span>` : ''}
          ${images.length > 1 ? `<div class="pdp-gallery__bars" id="galleryBars">${images.map((_, i) => `<button type="button" class="${i === 0 ? 'active' : ''}" data-idx="${i}" aria-label="Show image ${i + 1}"></button>`).join('')}</div>` : ''}
          <img src="${img(images[0], 1000)}" alt="${esc(p.name)}" id="mainImg">
          ${images.length > 1 ? `<div class="pdp-gallery__thumbs">${images.slice(0, 4).map((id, i) => `
            <button type="button" class="pdp-thumb ${i === 0 ? 'active' : ''}" data-idx="${i}" aria-label="Show image ${i + 1}">
              <img src="${img(id, 240)}" alt="" loading="lazy">
            </button>`).join('')}</div>` : ''}
        </div>
      </div>`;

    productDetail.innerHTML = `
      <div class="pdp">
        ${galleryHtml}

        <div class="pd-info">
          <a class="pdp-cat" href="${catHref}">${esc(lastCat ? lastCat.name : 'Shop')}</a>
          <h1>${esc(p.name)}</h1>

          <div class="pdp-price">
            <span class="pdp-price__now">${rs(p.price)}</span>
            ${p.old ? `<del class="pdp-price__old">${rs(p.old)}</del>` : ''}
            ${offPct ? `<span class="pdp-price__off">-${offPct}%</span>` : ''}
            ${stockBadge}
          </div>

          ${isOutOfStock ? '' : `<div class="pdp-deliver"><i class="fa-regular fa-clock"></i><span id="deliverText"></span></div>`}

          ${variantsHtml}

          <div class="pdp-actions">
            <div class="pdp-actions__row">
              <div class="pd-stepper">
                <button type="button" id="qtyMinus" aria-label="Decrease quantity" ${isOutOfStock ? 'disabled' : ''}><i class="fa-solid fa-minus"></i></button>
                <input type="number" id="qtyInput" value="1" min="1" max="${Math.max(1, p.stock)}" readonly aria-label="Quantity">
                <button type="button" id="qtyPlus" aria-label="Increase quantity" ${isOutOfStock ? 'disabled' : ''}><i class="fa-solid fa-plus"></i></button>
              </div>
              <button type="button" class="btn pdp-add" id="addToCartBtn" ${isOutOfStock ? 'disabled' : ''}>Add to Cart</button>
              <button type="button" class="pdp-heart ${liked ? 'liked' : ''}" id="pdWishlistBtn" data-like data-id="${p.id}" aria-label="Save to wishlist">
                <i class="fa-${liked ? 'solid' : 'regular'} fa-heart"></i>
              </button>
            </div>
            <div class="pdp-actions__sub">
              <button type="button" class="btn pdp-buy" id="buyNowBtn" ${isOutOfStock ? 'disabled' : ''}>Buy Now <i class="fa-solid fa-bolt"></i></button>
              <a href="#" class="btn pdp-wa" id="whatsappBtn" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp"></i> Order on WhatsApp</a>
            </div>
          </div>

          <div>
            <details class="pdp-acc" open>
              <summary>Description &amp; Details <i class="fa-solid fa-chevron-down"></i></summary>
              <div class="pdp-acc__body">
                <p>${esc(p.description)}</p>
                <ul class="pdp-spec">
                  <li><span>Category</span><b>${trailList.map(t => esc(t.name)).join(' &rsaquo; ')}</b></li>
                  <li><span>Availability</span><b>${isOutOfStock ? 'Out of stock' : isLowStock ? 'Low stock' : 'In stock'}</b></li>
                  <li><span>Origin</span><b>Sialkot, Pakistan / licensed imports</b></li>
                  <li><span>Inspection</span><b>Multi-point quality check before dispatch</b></li>
                </ul>
              </div>
            </details>
            <details class="pdp-acc" open>
              <summary>Shipping <i class="fa-solid fa-chevron-down"></i></summary>
              <div class="pdp-acc__body">
                <div class="pdp-ship">
                  <div class="pdp-ship__item"><span class="pdp-ship__ico"><i class="fa-solid fa-money-bill-wave"></i></span><div><small>Payment</small><b>Cash on Delivery</b></div></div>
                  <div class="pdp-ship__item"><span class="pdp-ship__ico"><i class="fa-solid fa-rotate-left"></i></span><div><small>Returns</small><b>7 Days Exchange</b></div></div>
                  <div class="pdp-ship__item"><span class="pdp-ship__ico"><i class="fa-solid fa-truck-fast"></i></span><div><small>Delivery Time</small><b>2 - 4 Working Days</b></div></div>
                  <div class="pdp-ship__item"><span class="pdp-ship__ico"><i class="fa-regular fa-calendar"></i></span><div><small>Estimated Arrival</small><b>${arrivalRange()}</b></div></div>
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>

      <section class="pdp-reviews" id="reviews">
        <h2>Rating &amp; Reviews</h2>
        <div id="pdpReviewsBody"><div class="pdp-reviews__empty"><i class="fa-solid fa-spinner fa-spin"></i> Loading reviews...</div></div>

        <div class="pdp-reviews__cta">
          <button type="button" class="btn btn--outline btn--sm" id="openReviewFormBtn"><i class="fa-solid fa-pen"></i> Write a Review</button>
          <span><i class="fa-solid fa-shield-halved"></i> All reviews are checked before they appear.</span>
        </div>

        <form id="writeReviewForm" class="pdp-review-form">
          <h4>Write Your Review</h4>
          <div class="pdp-review-form__row">
            <div>
              <label for="reviewAuthor">Your name *</label>
              <input type="text" id="reviewAuthor" class="form-control" required placeholder="e.g. Babar Azam">
            </div>
            <div>
              <label for="reviewRating">Rating *</label>
              <select id="reviewRating" class="form-control">
                <option value="5">5 - Exceptional</option>
                <option value="4">4 - Very good</option>
                <option value="3">3 - Average</option>
                <option value="2">2 - Below average</option>
                <option value="1">1 - Poor</option>
              </select>
            </div>
          </div>
          <label for="reviewComment">Your review *</label>
          <textarea id="reviewComment" class="form-control" rows="3" required placeholder="Tell others about the quality, fit and delivery..."></textarea>
          <div class="pdp-review-form__btns">
            <button type="submit" class="btn btn--primary btn--sm" id="submitReviewBtn">Submit Review</button>
            <button type="button" class="btn btn--outline btn--sm" id="cancelReviewBtn">Cancel</button>
          </div>
        </form>
      </section>
    `;

    setupInteractions(p);
  }

  function setupInteractions(p) {
    const galleryMain = document.getElementById('galleryMain');
    const mainImg = document.getElementById('mainImg');
    const images = (p.images && p.images.length) ? p.images : [p.img];
    let selectedVariant = null;

    // Gallery: thumbnails and top bars both switch the picture; mouse position moves the zoom
    const thumbs = document.querySelectorAll('.pdp-thumb');
    const bars = document.querySelectorAll('#galleryBars button');
    const showImage = idx => {
      if (mainImg) mainImg.src = img(images[idx], 1000);
      thumbs.forEach((t, i) => t.classList.toggle('active', i === idx));
      bars.forEach((b, i) => b.classList.toggle('active', i === idx));
    };
    thumbs.forEach(t => t.addEventListener('click', e => { e.stopPropagation(); showImage(+t.dataset.idx); }));
    bars.forEach(b => b.addEventListener('click', e => { e.stopPropagation(); showImage(+b.dataset.idx); }));
    if (galleryMain && mainImg) {
      galleryMain.addEventListener('mousemove', e => {
        const r = galleryMain.getBoundingClientRect();
        mainImg.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
      });
      galleryMain.addEventListener('mouseleave', () => { mainImg.style.transformOrigin = 'center center'; });
    }

    // "Order within hh:mm:ss" until the 6 PM dispatch cut-off; after that, orders go out tomorrow
    const deliverText = document.getElementById('deliverText');
    if (deliverText) {
      const tick = () => {
        const now = new Date();
        const cut = new Date(now); cut.setHours(18, 0, 0, 0);
        if (now >= cut) { deliverText.textContent = 'Order now and we dispatch it tomorrow morning'; return; }
        const s = Math.floor((cut - now) / 1000);
        const t = [Math.floor(s / 3600), Math.floor(s % 3600 / 60), s % 60].map(n => String(n).padStart(2, '0')).join(':');
        deliverText.innerHTML = `Order within <b>${t}</b> to get it dispatched today`;
      };
      tick();
      setInterval(tick, 1000);
    }

    // Variants
    const variantBtns = document.querySelectorAll('.pdp-variant');
    const variantText = document.getElementById('selectedVariantText');
    const variantError = document.getElementById('variantError');
    variantBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        variantBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedVariant = btn.dataset.variant;
        if (variantText) variantText.textContent = selectedVariant;
        if (variantError) variantError.classList.remove('show');
        updateWhatsAppLink();
      });
    });

    // Quantity stepper
    const qtyInput = document.getElementById('qtyInput');
    const qtyMinus = document.getElementById('qtyMinus');
    const qtyPlus = document.getElementById('qtyPlus');
    const maxStock = Math.max(1, p.stock || 1);
    if (qtyMinus && qtyPlus && qtyInput) {
      qtyMinus.addEventListener('click', () => {
        const v = parseInt(qtyInput.value, 10) || 1;
        if (v > 1) { qtyInput.value = v - 1; updateWhatsAppLink(); }
      });
      qtyPlus.addEventListener('click', () => {
        const v = parseInt(qtyInput.value, 10) || 1;
        if (v < maxStock) { qtyInput.value = v + 1; updateWhatsAppLink(); }
        else showToast(`Maximum ${maxStock} items available in stock.`);
      });
    }

    // WhatsApp order link
    const whatsappBtn = document.getElementById('whatsappBtn');
    function updateWhatsAppLink() {
      if (!whatsappBtn) return;
      const qty = qtyInput ? qtyInput.value : 1;
      const vText = selectedVariant ? ` [${p.variants?.label || 'Option'}: ${selectedVariant}]` : '';
      const text = encodeURIComponent(
        `Assalam o Alaikum Haider Sports!\nI want to order: ${p.name}${vText}\nQuantity: ${qty}\nPrice: ${rs(p.price)}\nPlease confirm my order.`
      );
      whatsappBtn.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
    }
    updateWhatsAppLink();

    function validateVariant() {
      if (p.variants && p.variants.options && p.variants.options.length && !selectedVariant) {
        if (variantError) variantError.classList.add('show');
        showToast(`Please choose a ${p.variants.label.toLowerCase()}`);
        return false;
      }
      return true;
    }

    const addBtn = document.getElementById('addToCartBtn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        if (!validateVariant()) return;
        const qty = parseInt(qtyInput?.value, 10) || 1;
        cart.add(p, selectedVariant, qty);
        showToast(`${p.name}${selectedVariant ? ` (${selectedVariant})` : ''} × ${qty} added to cart`);
        openCartDrawer();
      });
    }

    const buyBtn = document.getElementById('buyNowBtn');
    if (buyBtn) {
      buyBtn.addEventListener('click', () => {
        if (!validateVariant()) return;
        cart.add(p, selectedVariant, parseInt(qtyInput?.value, 10) || 1);
        window.location.href = 'cart.html';
      });
    }

    if (whatsappBtn) {
      whatsappBtn.addEventListener('click', e => { if (!validateVariant()) e.preventDefault(); });
    }

    // Reviews: summary (average + bars) and a one-at-a-time carousel
    const reviewsBody = document.getElementById('pdpReviewsBody');
    const form = document.getElementById('writeReviewForm');
    const reviewAuthor = document.getElementById('reviewAuthor');
    const reviewRating = document.getElementById('reviewRating');
    const reviewComment = document.getElementById('reviewComment');
    const submitReviewBtn = document.getElementById('submitReviewBtn');

    document.getElementById('openReviewFormBtn')?.addEventListener('click', () => {
      form.classList.toggle('open');
      if (form.classList.contains('open')) reviewAuthor?.focus();
    });
    document.getElementById('cancelReviewBtn')?.addEventListener('click', () => form.classList.remove('open'));

    function renderReviews(reviews) {
      if (!reviews.length) {
        reviewsBody.innerHTML = `<div class="pdp-reviews__empty">No reviews yet. Be the first to share your experience!</div>`;
        return;
      }
      const total = reviews.length;
      const avg = reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / total;
      const counts = [5, 4, 3, 2, 1].map(n => reviews.filter(r => Math.round(r.rating) === n).length);
      let idx = 0;

      reviewsBody.innerHTML = `
        <div class="pdp-reviews__grid">
          <div class="pdp-score">
            <div>
              <div class="pdp-score__big">${avg.toFixed(1).replace('.', ',')}<small>/ 5</small></div>
              <div class="pdp-score__count">(${total} ${total === 1 ? 'Review' : 'Reviews'})</div>
            </div>
            <div class="pdp-bars">
              ${counts.map((c, i) => `<div><i class="fa-solid fa-star"></i>${5 - i}<em><span style="--w:${total ? c / total * 100 : 0}%"></span></em></div>`).join('')}
            </div>
          </div>
          <div class="pdp-carousel" id="pdpCarousel" aria-live="polite">
            <div id="pdpReviewSlot"></div>
            ${total > 1 ? `
              <button type="button" class="pdp-carousel__nav pdp-carousel__nav--prev" id="revPrev" aria-label="Previous review"><i class="fa-solid fa-chevron-left"></i></button>
              <button type="button" class="pdp-carousel__nav" id="revNext" aria-label="Next review"><i class="fa-solid fa-chevron-right"></i></button>
              <div class="pdp-carousel__dots" id="revDots">${reviews.map(() => '<span></span>').join('')}</div>` : ''}
          </div>
        </div>`;

      const slot = document.getElementById('pdpReviewSlot');
      const dots = document.querySelectorAll('#revDots span');
      const show = i => {
        idx = (i + total) % total;
        const r = reviews[idx];
        slot.innerHTML = `
          <div class="pdp-review">
            <div class="pdp-review__top">
              <span class="pdp-review__name">${esc(r.name)} <span class="pdp-review__ok"><i class="fa-solid fa-circle-check"></i> Verified Buyer</span></span>
              <span class="pdp-review__date">${esc(r.date || 'Recent')}</span>
            </div>
            ${starsHtml(Number(r.rating) || 0)}
            <p>${esc(r.comment)}</p>
            <div class="pdp-review__who"><span class="pdp-avatar">${esc((r.name || '?').trim().charAt(0).toUpperCase())}</span>${r.city ? esc(r.city) : ''}</div>
          </div>`;
        dots.forEach((d, n) => d.classList.toggle('active', n === idx));
      };
      show(0);
      document.getElementById('revPrev')?.addEventListener('click', () => show(idx - 1));
      document.getElementById('revNext')?.addEventListener('click', () => show(idx + 1));
    }

    api.getReviews(p.id)
      .then(r => renderReviews(r || []))
      .catch(() => { reviewsBody.innerHTML = '<div class="pdp-reviews__empty">Reviews are temporarily unavailable.</div>'; });

    form?.addEventListener('submit', async e => {
      e.preventDefault();
      const author = reviewAuthor.value.trim();
      const comment = reviewComment.value.trim();
      if (!author || !comment) { showToast('Please complete all review fields'); return; }

      submitReviewBtn.disabled = true;
      submitReviewBtn.textContent = 'Submitting...';
      try {
        const res = await api.addReview({ productId: p.id, name: author, rating: parseInt(reviewRating.value, 10) || 5, comment });
        showToast(res.message || 'Thank you! Your review will appear after approval.');
        form.reset();
        form.classList.remove('open');
      } catch (err) {
        showToast(err.message || 'Could not submit review');
      } finally {
        submitReviewBtn.disabled = false;
        submitReviewBtn.textContent = 'Submit Review';
      }
    });
  }

  async function renderRelated(currentSlug) {
    const related = await api.getRelated(currentSlug, 4);
    if (!related || !related.length) { relatedSection.style.display = 'none'; return; }
    relatedGrid.innerHTML = related.map(r => {
      const off = r.old && r.old > r.price ? Math.round((r.old - r.price) / r.old * 100) : 0;
      return `
        <a class="pdp-rel" href="product.html?slug=${encodeURIComponent(r.slug || '')}">
          <div class="pdp-rel__img"><img src="${img(r.img, 600)}" alt="${esc(r.name)}" loading="lazy"></div>
          <h3>${esc(r.name)}</h3>
          <div class="pdp-rel__price">${rs(r.price)}${r.old ? `<del>${rs(r.old)}</del>` : ''}${off ? `<span>-${off}%</span>` : ''}</div>
        </a>`;
    }).join('');
    relatedSection.style.display = 'block';
  }
});
