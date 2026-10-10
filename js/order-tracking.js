// Order Tracking page script
// Requires: data.js (api) and common.js (WHATSAPP_NUMBER, rs, img, esc)

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('trackForm');
  const orderInput = document.getElementById('orderNumberInput');
  const phoneInput = document.getElementById('phoneInput');
  const submitBtn = document.getElementById('trackSubmitBtn');
  const errorAlert = document.getElementById('trackErrorAlert');
  const resultCard = document.getElementById('trackResultCard');

  // Pre-fill from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const paramOrder = urlParams.get('order');
  if (paramOrder && orderInput) {
    orderInput.value = paramOrder.trim();
  }

  // Pre-fill phone from remembered customer or last order
  try {
    const custRaw = (localStorage.getItem('haider_customer') || localStorage.getItem('rashy_customer'));
    if (custRaw) {
      const cust = JSON.parse(custRaw);
      if (cust.phone && phoneInput && !phoneInput.value) {
        phoneInput.value = cust.phone;
      }
    }
    const lastOrderRaw = (sessionStorage.getItem('haider_last_order') || sessionStorage.getItem('rashy_last_order'));
    if (lastOrderRaw) {
      const last = JSON.parse(lastOrderRaw);
      if (last.orderNumber && !orderInput.value) {
        orderInput.value = last.orderNumber;
      }
      if (last.customer?.phone && !phoneInput.value) {
        phoneInput.value = last.customer.phone;
      }
    }
  } catch (e) {
    // ignore
  }

  // If both are filled on load, automatically track
  if (orderInput.value.trim() && phoneInput.value.trim()) {
    doTrack(orderInput.value.trim(), phoneInput.value.trim());
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const orderNum = orderInput.value.trim();
    const phone = phoneInput.value.trim();

    if (!orderNum || !phone) return;
    await doTrack(orderNum, phone);
  });

  async function doTrack(orderNum, phone) {
    errorAlert.style.display = 'none';
    resultCard.style.display = 'none';
    submitBtn.disabled = true;
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Checking order...`;

    try {
      const res = await api.trackOrder(orderNum, phone);

      if (!res) {
        errorAlert.style.display = 'flex';
        errorAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
      }

      renderOrderResult(res);
      resultCard.style.display = 'block';
      resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      console.error('Tracking error:', err);
      errorAlert.style.display = 'flex';
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  }

  function renderOrderResult(order) {
    const resOrderNum = document.getElementById('resOrderNum');
    const resStatusBadge = document.getElementById('resStatusBadge');
    const cancelBanner = document.getElementById('cancelBanner');
    const cancelReasonText = document.getElementById('cancelReasonText');
    const timelineSection = document.getElementById('timelineSection');
    const timelineSteps = document.getElementById('timelineSteps');
    const courierBox = document.getElementById('courierBox');
    const courierName = document.getElementById('courierName');
    const courierTrackId = document.getElementById('courierTrackId');
    const resCustomerName = document.getElementById('resCustomerName');
    const resCustomerAddress = document.getElementById('resCustomerAddress');
    const resCustomerPhone = document.getElementById('resCustomerPhone');
    const resOrderDate = document.getElementById('resOrderDate');
    const resPaymentMethod = document.getElementById('resPaymentMethod');
    const resDeliveryFee = document.getElementById('resDeliveryFee');
    const trackItemsList = document.getElementById('trackItemsList');
    const resGrandTotal = document.getElementById('resGrandTotal');
    const trackWhatsappBtn = document.getElementById('trackWhatsappBtn');

    // 1. Order Number & Status Pill
    resOrderNum.textContent = order.orderNumber;
    let statusClass = 'confirmed';
    let statusIcon = 'fa-clock';
    const st = (order.status || '').toLowerCase();
    if (st.includes('ship')) {
      statusClass = 'shipped';
      statusIcon = 'fa-truck-fast';
    } else if (st.includes('deliver')) {
      statusClass = 'delivered';
      statusIcon = 'fa-circle-check';
    } else if (st.includes('cancel')) {
      statusClass = 'cancelled';
      statusIcon = 'fa-ban';
    }

    resStatusBadge.innerHTML = `
      <span class="status-pill status-pill--${statusClass}">
        <i class="fa-solid ${statusIcon}"></i> ${esc(order.status)}
      </span>
    `;

    // 2. Cancelled Banner vs Timeline
    if (st.includes('cancel')) {
      cancelBanner.style.display = 'flex';
      cancelReasonText.textContent = order.cancelReason || 'Order was cancelled per customer or verification request.';
      timelineSection.style.display = 'none';
    } else {
      cancelBanner.style.display = 'none';
      timelineSection.style.display = 'block';

      // 4-Step Standard Timeline
      const standardSteps = [
        { key: 'Pending', label: 'Order Placed', icon: 'fa-clipboard-check', desc: 'Received' },
        { key: 'Confirmed', label: 'Confirmed', icon: 'fa-thumbs-up', desc: 'Verified' },
        { key: 'Shipped', label: 'Shipped', icon: 'fa-truck-fast', desc: 'Dispatched' },
        { key: 'Delivered', label: 'Delivered', icon: 'fa-house-chimney', desc: 'Completed' },
      ];

      const statusOrder = ['Pending', 'Confirmed', 'Shipped', 'Delivered'];
      let currentIdx = statusOrder.indexOf(order.status);
      if (currentIdx === -1) currentIdx = 1; // Default to Confirmed

      timelineSteps.innerHTML = standardSteps.map((step, idx) => {
        const isDone = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        let stepClass = 'pending';
        let iconHtml = `<i class="fa-solid ${step.icon}"></i>`;

        if (isDone) {
          stepClass = 'done';
          iconHtml = `<i class="fa-solid fa-check"></i>`;
        } else if (isCurrent) {
          stepClass = 'done current';
        }

        const hist = (order.statusHistory || []).find(h => h.status === step.key);
        const timeText = hist ? (hist.time || hist.at || '') : (isDone ? 'Completed' : (isCurrent ? 'In Progress' : 'Upcoming'));

        return `
          <div class="timeline-step ${stepClass}">
            <div class="timeline-icon">${iconHtml}</div>
            <div class="timeline-label">${step.label}</div>
            <div class="timeline-time">${esc(timeText)}</div>
          </div>
        `;
      }).join('');
    }

    // 3. Courier Box
    if (order.courier && order.trackingNumber && !st.includes('cancel')) {
      courierBox.style.display = 'flex';
      courierName.textContent = order.courier;
      courierTrackId.textContent = order.trackingNumber;
    } else {
      courierBox.style.display = 'none';
    }

    // 4. Customer Info
    const c = order.customer || {};
    resCustomerName.innerHTML = `<strong>${esc(c.name || 'Valued Customer')}</strong>`;
    resCustomerAddress.textContent = `${c.address || 'Standard Delivery Address'}, ${c.city || ''}`;
    resCustomerPhone.textContent = `Phone: ${c.phone || order.phone || ''}`;

    // 5. Booking Info
    const dateFormatted = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent';
    resOrderDate.textContent = `Order Placed: ${dateFormatted}`;
    resPaymentMethod.textContent = `Payment: ${esc(c.paymentMethod || 'Cash on Delivery')}`;
    resDeliveryFee.textContent = `Delivery: ${order.deliveryCharge ? rs(order.deliveryCharge) : 'Free Delivery'}`;

    // 6. Items List
    const items = order.items || [];
    if (items.length) {
      trackItemsList.innerHTML = items.map(item => `
        <div class="track-item-row">
          <img src="${img(item.img || '1531415074868-8369cdd257c6', 100)}" alt="${esc(item.name)}" class="track-item-thumb">
          <div class="track-item-details">
            <strong>${esc(item.name)}</strong>
            <span>${item.variant ? `Variant: ${esc(item.variant)} · ` : ''}Qty: ${item.qty || 1}</span>
          </div>
          <div class="track-item-price">${rs(item.price * (item.qty || 1))}</div>
        </div>
      `).join('');
    } else {
      trackItemsList.innerHTML = `<p style="color:#777; font-size:13px; padding:10px 0;">Cricket equipment parcel</p>`;
    }

    resGrandTotal.textContent = rs(order.total || 0);

    // 7. WhatsApp Help Button
    const waMsg = encodeURIComponent(
      `Assalam o Alaikum Haider Sports!\nI need an update on my order: ${order.orderNumber}\nCustomer: ${c.name || ''}\nPlease assist me.`
    );
    trackWhatsappBtn.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${waMsg}`;
  }
});
