// Cart Page Logic
document.addEventListener('DOMContentLoaded', () => {
  const cartView = document.getElementById('cartView');
  const lineKey = (id, v) => `${id}::${v || ''}`;

  render();

  // Listen for updates from drawer or other tabs
  window.addEventListener('cartUpdated', () => {
    render();
  });

  function render() {
    const items = cart.get();
    const count = cart.count();
    const subtotal = cart.subtotal();

    if (!items || items.length === 0) {
      renderEmpty();
      return;
    }

    // Render Full Cart
    const tableRows = items.map(item => {
      const key = lineKey(item.id, item.variant);
      const lineTotal = (item.price || 0) * (item.qty || 1);
      return `
        <tr data-key="${esc(key)}">
          <td>
            <div class="cart-item-info">
              <a href="product.html?slug=${esc(item.slug)}" class="cart-item-thumb">
                <img src="${img(item.img, 150)}" alt="${esc(item.name)}">
              </a>
              <div>
                <a href="product.html?slug=${esc(item.slug)}" class="cart-item-name">${esc(item.name)}</a>
                ${item.variant ? `<span class="cart-item-variant">${esc(item.variant)}</span>` : ''}
              </div>
            </div>
          </td>
          <td>
            <span class="cart-item-price">${rs(item.price)}</span>
          </td>
          <td>
            <div class="pd-stepper" style="height: 38px;">
              <button type="button" data-cart-step="-1" data-key="${esc(key)}" aria-label="Decrease">&minus;</button>
              <input type="number" value="${item.qty}" readonly style="width: 40px; height: 38px;">
              <button type="button" data-cart-step="1" data-key="${esc(key)}" aria-label="Increase">&plus;</button>
            </div>
          </td>
          <td>
            <span class="cart-item-total">${rs(lineTotal)}</span>
          </td>
          <td>
            <button type="button" class="cart-item-remove" data-cart-remove="${esc(key)}" aria-label="Remove item">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    const mobileCards = items.map(item => {
      const key = lineKey(item.id, item.variant);
      const lineTotal = (item.price || 0) * (item.qty || 1);
      return `
        <div class="cart-mobile-card" data-key="${esc(key)}">
          <a href="product.html?slug=${esc(item.slug)}" class="cart-item-thumb">
            <img src="${img(item.img, 150)}" alt="${esc(item.name)}">
          </a>
          <div class="cart-mobile-card__details">
            <div class="cart-mobile-card__top">
              <div>
                <a href="product.html?slug=${esc(item.slug)}" class="cart-item-name">${esc(item.name)}</a>
                ${item.variant ? `<span class="cart-item-variant">${esc(item.variant)}</span>` : ''}
              </div>
              <button type="button" class="cart-item-remove" data-cart-remove="${esc(key)}" aria-label="Remove item">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
            <div class="cart-mobile-card__row">
              <span class="cart-item-price">${rs(item.price)}</span>
              <div class="pd-stepper" style="height: 34px;">
                <button type="button" data-cart-step="-1" data-key="${esc(key)}">&minus;</button>
                <input type="number" value="${item.qty}" readonly style="width: 36px; height: 34px;">
                <button type="button" data-cart-step="1" data-key="${esc(key)}">&plus;</button>
              </div>
              <span class="cart-item-total">${rs(lineTotal)}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    cartView.innerHTML = `
      <div class="cart__layout">
        <!-- Main Cart Items -->
        <div>
          <!-- Desktop Table -->
          <div class="cart-table-wrap">
            <table class="cart-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
          </div>

          <!-- Mobile Cards -->
          <div class="cart-mobile-cards">
            ${mobileCards}
          </div>

          <!-- Bottom Actions -->
          <div class="cart-bottom-actions">
            <a href="shop.html" class="btn btn--dark btn--sm">
              <i class="fa-solid fa-arrow-left"></i> Continue Shopping
            </a>
            <button type="button" class="btn btn--sm" id="clearCartBtn" style="color: #e02424; border: 1.5px solid #fecaca; background: #fff;">
              <i class="fa-solid fa-trash-can"></i> Clear Cart
            </button>
          </div>
        </div>

        <!-- Sticky Order Summary -->
        <aside class="cart-summary">
          <h3>Order Summary</h3>

          <div class="cart-summary__line">
            <span>Items (${count})</span>
            <strong>${rs(subtotal)}</strong>
          </div>

          <div class="cart-summary__line">
            <span>Delivery Charges</span>
            <span style="color: #168a3e; font-weight: 500;">Calculated at checkout</span>
          </div>

          <!-- Coupon Box -->
          <div class="cart-coupon">
            <label for="couponInput">Have a coupon code?</label>
            <div class="cart-coupon__row">
              <input type="text" id="couponInput" placeholder="e.g. WELCOME10" autocomplete="off" style="text-transform: uppercase;">
              <button type="button" class="btn btn--dark btn--sm" id="applyCouponBtn">Apply</button>
            </div>
            <div class="cart-coupon__msg" id="couponMsg"></div>
          </div>

          <div class="cart-summary__line" id="cartDiscountRow" style="display: none; color: #168a3e;">
            <span>Discount (<span id="cartDiscountCode"></span>)</span>
            <strong id="cartDiscountAmount">- Rs. 0</strong>
          </div>

          <div class="cart-summary__line cart-summary__line--total">
            <span>Estimated Total:</span>
            <strong id="cartEstimatedTotal">${rs(subtotal)}</strong>
          </div>

          <a href="checkout.html" class="btn btn--primary cart-checkout-btn" id="checkoutBtn" style="margin-top: 20px;">
            Proceed to Checkout <i class="fa-solid fa-arrow-right"></i>
          </a>

          <div style="margin-top: 18px; font-size: 12px; color: #888; text-align: center;">
            <i class="fa-solid fa-shield-halved" style="color: var(--primary);"></i> 100% Safe &amp; Secure Cash on Delivery
          </div>
        </aside>
      </div>
    `;

    bindActions();
  }

  function renderEmpty() {
    cartView.innerHTML = `
      <div class="cart-empty-page">
        <i class="fa-solid fa-cart-arrow-down"></i>
        <h2>Your Shopping Cart is Empty</h2>
        <p>Looks like you haven't added any cricket bats, kits, or sportswear to your bag yet.</p>
        <a href="shop.html" class="btn btn--primary">
          Start Shopping <i class="fa-solid fa-arrow-right"></i>
        </a>
      </div>
    `;
  }

  function bindActions() {
    // Steppers
    cartView.querySelectorAll('[data-cart-step]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        const delta = parseInt(btn.dataset.cartStep, 10);
        const item = cart.get().find(i => lineKey(i.id, i.variant) === key);
        if (item) {
          cart.setQty(key, item.qty + delta);
        }
      });
    });

    // Remove buttons
    cartView.querySelectorAll('[data-cart-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.cartRemove;
        cart.remove(key);
        showToast('Item removed from cart');
      });
    });

    // Clear cart
    const clearBtn = document.getElementById('clearCartBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear your cart?')) {
          cart.clear();
          showToast('Shopping cart cleared');
        }
      });
    }

    // Coupon code
    const couponBtn = document.getElementById('applyCouponBtn');
    const couponInput = document.getElementById('couponInput');
    const couponMsg = document.getElementById('couponMsg');
    const discountRow = document.getElementById('cartDiscountRow');
    const discountCodeSpan = document.getElementById('cartDiscountCode');
    const discountAmountStrong = document.getElementById('cartDiscountAmount');
    const estimatedTotalStrong = document.getElementById('cartEstimatedTotal');

    // Pre-load existing applied coupon if any
    try {
      const savedCoupon = JSON.parse((sessionStorage.getItem('haider_coupon') || sessionStorage.getItem('rashy_coupon')) || 'null');
      if (savedCoupon && savedCoupon.code && savedCoupon.discount > 0) {
        if (couponInput) couponInput.value = savedCoupon.code;
        if (discountRow) discountRow.style.display = 'flex';
        if (discountCodeSpan) discountCodeSpan.textContent = savedCoupon.code;
        if (discountAmountStrong) discountAmountStrong.textContent = `- ${rs(savedCoupon.discount)}`;
        if (estimatedTotalStrong) estimatedTotalStrong.textContent = rs(Math.max(0, subtotal - savedCoupon.discount));
        if (couponMsg) {
          couponMsg.style.display = 'block';
          couponMsg.style.color = '#168a3e';
          couponMsg.textContent = `Coupon ${savedCoupon.code} applied!`;
        }
      }
    } catch (e) {}

    if (couponBtn && couponMsg) {
      couponBtn.addEventListener('click', async () => {
        const val = couponInput?.value?.trim().toUpperCase();
        if (!val) {
          showToast('Please enter a coupon code');
          return;
        }

        couponBtn.disabled = true;
        couponBtn.textContent = '...';

        try {
          const discount = await api.validateCoupon(val, subtotal);
          sessionStorage.setItem('haider_coupon', JSON.stringify({ code: val, discount }));
          if (discountRow) discountRow.style.display = 'flex';
          if (discountCodeSpan) discountCodeSpan.textContent = val;
          if (discountAmountStrong) discountAmountStrong.textContent = `- ${rs(discount)}`;
          if (estimatedTotalStrong) estimatedTotalStrong.textContent = rs(Math.max(0, subtotal - discount));

          couponMsg.style.display = 'block';
          couponMsg.style.color = '#168a3e';
          couponMsg.textContent = `Success! ${rs(discount)} discount applied.`;
          showToast(`Coupon ${val} applied successfully!`);
        } catch (err) {
          { sessionStorage.removeItem('haider_coupon'); sessionStorage.removeItem('rashy_coupon'); };
          if (discountRow) discountRow.style.display = 'none';
          if (estimatedTotalStrong) estimatedTotalStrong.textContent = rs(subtotal);

          couponMsg.style.display = 'block';
          couponMsg.style.color = '#e02424';
          couponMsg.textContent = err.message || 'Invalid coupon code';
          showToast(err.message || 'Invalid coupon code');
        } finally {
          couponBtn.disabled = false;
          couponBtn.textContent = 'Apply';
        }
      });
    }

    // Checkout button handler
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', e => {
        if (cart.count() === 0) {
          e.preventDefault();
          showToast('Your cart is empty');
        } else {
          // Checkout page will be built in Prompt 3
          // For now, let user know or allow navigation if file exists
        }
      });
    }
  }
});
