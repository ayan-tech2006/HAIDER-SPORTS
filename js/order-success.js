// Order Success Page Logic
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const orderNumFromUrl = params.get('order') || 'RS-10000';

  const displayOrderNum = document.getElementById('displayOrderNum');
  const successGreeting = document.getElementById('successGreeting');
  const copyBtn = document.getElementById('copyOrderBtn');
  const whatsappConfirmBtn = document.getElementById('whatsappConfirmBtn');
  const trackOrderBtn = document.getElementById('trackOrderBtn');

  const snapshotBox = document.getElementById('orderSnapshotBox');
  const snapName = document.getElementById('snapName');
  const snapPhone = document.getElementById('snapPhone');
  const snapAddress = document.getElementById('snapAddress');
  const snapPayment = document.getElementById('snapPayment');
  const snapItemsList = document.getElementById('snapItemsList');
  const snapTotal = document.getElementById('snapTotal');

  let orderData = null;
  try {
    const raw = (sessionStorage.getItem('haider_last_order') || sessionStorage.getItem('rashy_last_order'));
    if (raw) orderData = JSON.parse(raw);
  } catch (e) {
    console.warn('Session order read error:', e);
  }

  const effectiveOrderNum = orderData?.orderNumber || orderNumFromUrl;
  displayOrderNum.textContent = effectiveOrderNum;

  // Track button link
  if (trackOrderBtn) {
    trackOrderBtn.href = `order-tracking.html?order=${encodeURIComponent(effectiveOrderNum)}`;
  }

  // Pre-filled WhatsApp confirmation link
  if (whatsappConfirmBtn) {
    const custName = orderData?.customer?.name || 'Customer';
    const waText = encodeURIComponent(
      `Assalam o Alaikum Haider Sports!\nI have placed order: ${effectiveOrderNum}\nName: ${custName}\nPlease confirm my order details.`
    );
    whatsappConfirmBtn.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`;
  }

  // Copy order number
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(effectiveOrderNum);
        showToast(`Order #${effectiveOrderNum} copied to clipboard!`);
      } catch (err) {
        showToast(`Order #${effectiveOrderNum}`);
      }
    });
  }

  // Render snapshot details if available
  if (orderData && orderData.customer) {
    snapshotBox.style.display = 'block';
    successGreeting.textContent = `Thank You, ${orderData.customer.name}! Your Order is Placed.`;

    snapName.textContent = orderData.customer.name || '-';
    snapPhone.textContent = orderData.customer.phone || '-';
    snapAddress.textContent = `${orderData.customer.address}, ${orderData.customer.city}`;
    snapPayment.textContent = orderData.payment?.method === 'cod' ? 'Cash on Delivery (COD)' : 'Bank Transfer / JazzCash';

    if (orderData.items && orderData.items.length) {
      snapItemsList.innerHTML = orderData.items.map(item => `
        <div class="snapshot-item-row">
          <span>${esc(item.name)} ${item.variant ? `(${esc(item.variant)})` : ''} &times; ${item.qty}</span>
          <strong>${rs(item.price * item.qty)}</strong>
        </div>
      `).join('');
    }

    snapTotal.textContent = rs(orderData.total || 0);
  } else {
    successGreeting.textContent = 'Thank You! Your Order is Placed.';
  }
});
