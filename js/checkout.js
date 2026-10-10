// Checkout Page Logic
document.addEventListener('DOMContentLoaded', () => {
  // Check empty cart
  if (cart.count() === 0) {
    window.location.href = 'cart.html';
    return;
  }

  // Elements
  const form = document.getElementById('checkoutForm');
  const itemsListEl = document.getElementById('checkoutItemsList');
  const subtotalEl = document.getElementById('summarySubtotal');
  const deliveryEl = document.getElementById('summaryDelivery');
  const freeDeliveryNote = document.getElementById('freeDeliveryNote');
  const totalEl = document.getElementById('summaryTotal');
  const placeOrderBtn = document.getElementById('placeOrderBtn');
  const btnText = document.getElementById('btnText');
  const btnIcon = document.getElementById('btnIcon');

  const custName = document.getElementById('custName');
  const custPhone = document.getElementById('custPhone');
  const custWhatsapp = document.getElementById('custWhatsapp');
  const sameWhatsapp = document.getElementById('sameWhatsapp');
  const custEmail = document.getElementById('custEmail');
  const custCity = document.getElementById('custCity');
  const custOtherCity = document.getElementById('custOtherCity');
  const groupOtherCity = document.getElementById('groupOtherCity');
  const custAddress = document.getElementById('custAddress');
  const custLandmark = document.getElementById('custLandmark');
  const custNotes = document.getElementById('custNotes');

  const rememberNotice = document.getElementById('rememberNotice');
  const rememberName = document.getElementById('rememberName');
  const clearCustomerBtn = document.getElementById('clearCustomerBtn');

  const cardCod = document.getElementById('cardCod');
  const cardBank = document.getElementById('cardBank');
  const transId = document.getElementById('transId');

  // Coupon elements on checkout
  const couponInput = document.getElementById('checkoutCouponInput');
  const couponBtn = document.getElementById('applyCheckoutCouponBtn');
  const couponMsg = document.getElementById('checkoutCouponMsg');
  const rowDiscount = document.getElementById('rowDiscount');
  const discountCodeText = document.getElementById('discountCodeText');
  const summaryDiscount = document.getElementById('summaryDiscount');

  let appliedCoupon = null;
  try {
    const saved = JSON.parse((sessionStorage.getItem('haider_coupon') || sessionStorage.getItem('rashy_coupon')) || 'null');
    if (saved && saved.code && saved.discount > 0) {
      appliedCoupon = saved;
      if (couponInput) couponInput.value = saved.code;
    }
  } catch (e) {}

  // Load remembered customer data
  loadRememberedCustomer();

  // Render Order Items & Calculate Totals
  renderSummary();

  // Dynamically load live store settings (delivery rates & bank details)
  if (typeof api !== 'undefined' && api.getSettings) {
    api.getSettings().then(st => {
      if (st) {
        renderSummary();
        const bank = st.bank_details;
        if (bank) {
          const bankBox = document.querySelector('.bank-info-box');
          if (bankBox) {
            let html = '';
            if (bank.bankName) html += `<div><strong>Bank:</strong> ${bank.bankName} ${bank.branch ? `(${bank.branch})` : ''}</div>`;
            if (bank.accountTitle) html += `<div><strong>Account Title:</strong> ${bank.accountTitle}</div>`;
            if (bank.accountNumber) html += `<div><strong>Account No:</strong> ${bank.accountNumber}</div>`;
            if (bank.iban) html += `<div><strong>IBAN:</strong> ${bank.iban}</div>`;
            const jc = bank.jazzcash || bank.jazzCash || '';
            const ep = bank.easypaisa || bank.easyPaisa || '';
            if (jc || ep) {
              html += `<div style="margin-top: 8px;"><strong>JazzCash / EasyPaisa:</strong> ${[jc, ep].filter(Boolean).join(' / ')}</div>`;
            }
            if (html) bankBox.innerHTML = html;
          }
        }
      }
    }).catch(() => {});
  }

  // Coupon handling on checkout
  if (couponBtn && couponInput) {
    couponBtn.addEventListener('click', async () => {
      const code = couponInput.value.trim().toUpperCase();
      if (!code) {
        showToast('Please enter a coupon code');
        return;
      }

      const subtotal = cart.subtotal();
      couponBtn.disabled = true;
      couponBtn.textContent = '...';

      try {
        const discount = await api.validateCoupon(code, subtotal);
        appliedCoupon = { code, discount };
        sessionStorage.setItem('haider_coupon', JSON.stringify(appliedCoupon));

        if (couponMsg) {
          couponMsg.style.display = 'block';
          couponMsg.style.color = '#168a3e';
          couponMsg.textContent = `Coupon ${code} applied! (-${rs(discount)})`;
        }
        showToast(`Coupon ${code} applied!`);
        renderSummary();
      } catch (err) {
        appliedCoupon = null;
        { sessionStorage.removeItem('haider_coupon'); sessionStorage.removeItem('rashy_coupon'); };
        if (couponMsg) {
          couponMsg.style.display = 'block';
          couponMsg.style.color = '#e02424';
          couponMsg.textContent = err.message || 'Invalid coupon code';
        }
        showToast(err.message || 'Invalid coupon code');
        renderSummary();
      } finally {
        couponBtn.disabled = false;
        couponBtn.textContent = 'Apply';
      }
    });
  }

  // Listen for storage / cart changes
  window.addEventListener('cartUpdated', () => {
    if (cart.count() === 0) {
      window.location.href = 'cart.html';
    } else {
      renderSummary();
    }
  });

  // Sync WhatsApp with Phone
  if (sameWhatsapp && custPhone && custWhatsapp) {
    sameWhatsapp.addEventListener('change', () => {
      if (sameWhatsapp.checked) {
        custWhatsapp.value = custPhone.value;
        custWhatsapp.setAttribute('readonly', 'true');
      } else {
        custWhatsapp.removeAttribute('readonly');
      }
    });

    custPhone.addEventListener('input', () => {
      if (sameWhatsapp.checked) {
        custWhatsapp.value = custPhone.value;
      }
    });
  }

  // City change -> recalculate delivery
  if (custCity) {
    custCity.addEventListener('change', () => {
      if (custCity.value === 'Other') {
        groupOtherCity.style.display = 'flex';
        custOtherCity.setAttribute('required', 'true');
      } else {
        groupOtherCity.style.display = 'none';
        custOtherCity.removeAttribute('required');
      }
      renderSummary();
    });
  }

  // Payment radio cards selection
  document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.value === 'cod') {
        cardCod.classList.add('selected');
        cardBank.classList.remove('selected');
        btnText.textContent = 'Place Order (Cash on Delivery)';
      } else {
        cardBank.classList.add('selected');
        cardCod.classList.remove('selected');
        btnText.textContent = 'Confirm Order (Bank Transfer)';
      }
    });
  });

  // Clear remembered customer link
  if (clearCustomerBtn) {
    clearCustomerBtn.addEventListener('click', e => {
      e.preventDefault();
      try {
        { localStorage.removeItem('haider_customer'); localStorage.removeItem('rashy_customer'); };
      } catch (err) {}
      form.reset();
      if (sameWhatsapp) sameWhatsapp.checked = true;
      if (rememberNotice) rememberNotice.style.display = 'none';
      renderSummary();
      showToast('Saved customer details cleared');
    });
  }

  // RENDER SUMMARY
  function renderSummary() {
    const items = cart.get();
    const subtotal = cart.subtotal();
    const city = custCity?.value || '';

    // Render items list
    itemsListEl.innerHTML = items.map(item => `
      <div class="checkout-item">
        <div class="checkout-item__thumb">
          <img src="${img(item.img, 120)}" alt="${esc(item.name)}">
        </div>
        <div class="checkout-item__info">
          <span class="checkout-item__name">${esc(item.name)}</span>
          <div class="checkout-item__meta">
            ${item.variant ? `<span style="background:var(--light); padding:1px 6px; border-radius:10px;">${esc(item.variant)}</span> · ` : ''}
            Qty: ${item.qty} × ${rs(item.price)}
          </div>
        </div>
        <div class="checkout-item__price">
          ${rs(item.price * item.qty)}
        </div>
      </div>
    `).join('');

    // Delivery calculation
    const delivery = api.getDeliveryCharge ? api.getDeliveryCharge(city, subtotal) : (subtotal >= 5000 ? 0 : 200);
    const discount = appliedCoupon ? appliedCoupon.discount : 0;
    const total = Math.max(0, subtotal - discount + delivery);

    subtotalEl.textContent = rs(subtotal);

    if (delivery === 0) {
      deliveryEl.innerHTML = '<span style="color:#168a3e; font-weight:700;">FREE</span>';
      freeDeliveryNote.style.display = 'block';
    } else {
      deliveryEl.textContent = rs(delivery);
      freeDeliveryNote.style.display = 'none';
    }

    if (rowDiscount) {
      if (discount > 0 && appliedCoupon) {
        rowDiscount.style.display = 'flex';
        if (discountCodeText) discountCodeText.textContent = appliedCoupon.code;
        if (summaryDiscount) summaryDiscount.textContent = `- ${rs(discount)}`;
      } else {
        rowDiscount.style.display = 'none';
      }
    }

    totalEl.textContent = rs(total);
  }

  // PRE-FILL CUSTOMER
  function loadRememberedCustomer() {
    try {
      const saved = (localStorage.getItem('haider_customer') || localStorage.getItem('rashy_customer'));
      if (saved) {
        const data = JSON.parse(saved);
        if (data.name) custName.value = data.name;
        if (data.phone) custPhone.value = data.phone;
        if (data.whatsapp) custWhatsapp.value = data.whatsapp;
        if (data.email) custEmail.value = data.email;
        if (data.city) {
          custCity.value = data.city;
          if (data.city === 'Other' && data.otherCity) {
            groupOtherCity.style.display = 'flex';
            custOtherCity.value = data.otherCity;
          }
        }
        if (data.address) custAddress.value = data.address;
        if (data.landmark) custLandmark.value = data.landmark;

        if (rememberNotice && rememberName) {
          rememberName.textContent = data.name || 'Customer';
          rememberNotice.style.display = 'flex';
        }
      }
    } catch (e) {
      console.warn('Customer load error:', e);
    }
  }

  // PHONE NORMALIZER & VALIDATOR (Pakistani 03XXXXXXXXX)
  function normalizePakistaniPhone(raw) {
    if (!raw) return null;
    let digits = String(raw).replace(/\D/g, '');
    // +923001234567 -> 923001234567 -> 03001234567
    if (digits.startsWith('92') && digits.length === 12) {
      digits = '0' + digits.slice(2);
    } else if (digits.startsWith('0092') && digits.length === 14) {
      digits = '0' + digits.slice(4);
    } else if (digits.length === 10 && digits.startsWith('3')) {
      digits = '0' + digits;
    }
    // Check valid 11 digits starting with 03
    if (/^03[0-9]{9}$/.test(digits)) {
      return digits;
    }
    return null;
  }

  // VALIDATION HELPER
  function setFieldError(groupEl, isError) {
    if (!groupEl) return;
    if (isError) {
      groupEl.classList.add('has-error');
    } else {
      groupEl.classList.remove('has-error');
    }
  }

  // SUBMIT HANDLER
  form.addEventListener('submit', async e => {
    e.preventDefault();

    let hasErrors = false;
    let firstErrorEl = null;

    // 1. Name validation
    const nameVal = custName.value.trim();
    if (!nameVal || nameVal.length < 3) {
      setFieldError(document.getElementById('groupName'), true);
      hasErrors = true;
      firstErrorEl = firstErrorEl || custName;
    } else {
      setFieldError(document.getElementById('groupName'), false);
    }

    // 2. Phone validation
    const phoneVal = custPhone.value.trim();
    const normalizedPhone = normalizePakistaniPhone(phoneVal);
    if (!normalizedPhone) {
      setFieldError(document.getElementById('groupPhone'), true);
      hasErrors = true;
      firstErrorEl = firstErrorEl || custPhone;
    } else {
      setFieldError(document.getElementById('groupPhone'), false);
      custPhone.value = normalizedPhone; // Normalize in field
    }

    // 3. Email validation (if provided)
    const emailVal = custEmail.value.trim();
    if (emailVal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      setFieldError(document.getElementById('groupEmail'), true);
      hasErrors = true;
      firstErrorEl = firstErrorEl || custEmail;
    } else {
      setFieldError(document.getElementById('groupEmail'), false);
    }

    // 4. City validation
    const cityVal = custCity.value;
    if (!cityVal) {
      setFieldError(document.getElementById('groupCity'), true);
      hasErrors = true;
      firstErrorEl = firstErrorEl || custCity;
    } else {
      setFieldError(document.getElementById('groupCity'), false);
    }

    let finalCity = cityVal;
    if (cityVal === 'Other') {
      const otherVal = custOtherCity.value.trim();
      if (!otherVal) {
        setFieldError(document.getElementById('groupOtherCity'), true);
        hasErrors = true;
        firstErrorEl = firstErrorEl || custOtherCity;
      } else {
        setFieldError(document.getElementById('groupOtherCity'), false);
        finalCity = otherVal;
      }
    }

    // 5. Address validation
    const addressVal = custAddress.value.trim();
    if (!addressVal || addressVal.length < 8) {
      setFieldError(document.getElementById('groupAddress'), true);
      hasErrors = true;
      firstErrorEl = firstErrorEl || custAddress;
    } else {
      setFieldError(document.getElementById('groupAddress'), false);
    }

    if (hasErrors) {
      showToast('Please correct the highlighted fields');
      firstErrorEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstErrorEl?.focus();
      return;
    }

    // Calculate Final Order Payload
    const items = cart.get();
    const subtotal = cart.subtotal();
    const delivery = api.getDeliveryCharge ? api.getDeliveryCharge(cityVal, subtotal) : (subtotal >= 5000 ? 0 : 200);
    const discount = appliedCoupon ? appliedCoupon.discount : 0;
    const total = Math.max(0, subtotal - discount + delivery);
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'cod';

    const idempotencyKey = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : 'idemp-' + Date.now() + '-' + Math.random().toString(36).slice(2);

    const orderPayload = {
      customer: {
        name: nameVal,
        phone: normalizedPhone,
        whatsapp: custWhatsapp.value.trim() || normalizedPhone,
        email: emailVal || null,
        city: finalCity,
        address: addressVal,
        landmark: custLandmark.value.trim() || null,
        notes: custNotes.value.trim() || null,
      },
      payment: {
        method: paymentMethod,
        transactionId: paymentMethod === 'bank' ? (transId.value.trim() || null) : null,
      },
      coupon: appliedCoupon ? appliedCoupon.code : null,
      idempotencyKey,
      items: items.map(i => ({
        id: i.id,
        slug: i.slug,
        name: i.name,
        variant: i.variant || null,
        img: i.img,
        price: i.price,
        qty: i.qty,
        lineTotal: i.price * i.qty,
      })),
      subtotal,
      deliveryCharge: delivery,
      discount,
      total,
    };

    // Button loading state & prevent double click
    placeOrderBtn.disabled = true;
    btnText.textContent = 'Placing your order...';
    btnIcon.className = 'fa-solid fa-spinner fa-spin';

    try {
      const res = await api.placeOrder(orderPayload);
      if (res && (res.success || res.orderNumber || res.order_number)) {
        const orderNum = res.orderNumber || res.order_number;

        // Clean up applied coupon from session
        try { { sessionStorage.removeItem('haider_coupon'); sessionStorage.removeItem('rashy_coupon'); }; } catch (e) {}

        // Save customer details in localStorage for future pre-fills
        try {
          localStorage.setItem('haider_customer', JSON.stringify({
            name: nameVal,
            phone: normalizedPhone,
            whatsapp: custWhatsapp.value.trim() || normalizedPhone,
            email: emailVal,
            city: cityVal,
            otherCity: cityVal === 'Other' ? custOtherCity.value.trim() : '',
            address: addressVal,
            landmark: custLandmark.value.trim(),
          }));
        } catch (e) {}

        // Save order snapshot in sessionStorage for Order Success page
        try {
          sessionStorage.setItem('haider_last_order', JSON.stringify(res.order));
        } catch (e) {}

        // Clear cart
        cart.clear();

        // Redirect to order success page
        window.location.href = `order-success.html?order=${encodeURIComponent(orderNum)}`;
      } else {
        throw new Error('Order could not be processed.');
      }
    } catch (err) {
      console.error('Order placement error:', err);
      const errMsg = err.message || '';

      if (errMsg.includes('OUT_OF_STOCK')) {
        const itemInfo = errMsg.replace('OUT_OF_STOCK:', '').trim();
        showToast(`Item is out of stock: ${itemInfo}`);
        alert(`Notice: "${itemInfo}" is currently out of stock or requested quantity is unavailable. Please check your cart.`);
      } else if (errMsg.includes('INVALID_COUPON')) {
        const cMsg = errMsg.replace('INVALID_COUPON:', '').trim();
        showToast('Coupon error: ' + cMsg);
        if (couponMsg) {
          couponMsg.style.display = 'block';
          couponMsg.style.color = '#e02424';
          couponMsg.textContent = cMsg;
        }
      } else if (errMsg.includes('RATE_LIMIT_EXCEEDED')) {
        showToast('Too many orders placed recently. Please wait an hour.');
        alert('Rate limit reached: Maximum 5 orders allowed per phone number per hour.');
      } else {
        showToast(errMsg || 'Could not place order. Please try again.');
      }

      placeOrderBtn.disabled = false;
      btnText.textContent = paymentMethod === 'cod' ? 'Place Order (Cash on Delivery)' : 'Confirm Order (Bank Transfer)';
      btnIcon.className = 'fa-solid fa-lock';
    }
  });
});
