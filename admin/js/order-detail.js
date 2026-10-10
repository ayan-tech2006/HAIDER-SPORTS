/**
 * Order Detail & Fulfillment Logic for Haider Sports Admin
 * Handles line items snapshot, status transition audit trail, restock on cancellation,
 * courier tracking assignment, customer WhatsApp/Call triggers, and invoice printing.
 */

let currentOrder = null;
let currentItems = [];
let currentHistory = [];

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Initialize layout & auth guard
  await admin.initLayout('orders', 'Order Details');

  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('id');

  if (!orderId) {
    admin.toast('No order ID provided', 'error');
    setTimeout(() => { window.location.href = 'orders.html'; }, 1200);
    return;
  }

  // 2. Initialize Event Listeners
  initDetailEvents(orderId);

  // 3. Load Order Data
  await loadOrderDetail(orderId);
});

/* ==========================================================================
   Load Order Data (Orders, Items, Status History)
   ========================================================================== */
async function loadOrderDetail(orderId) {
  try {
    // 1. Fetch Order
    const { data: order, error: orderErr } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      throw new Error(orderErr ? orderErr.message : 'Order not found');
    }
    currentOrder = order;

    // 2. Fetch Order Items
    const { data: items, error: itemsErr } = await supabaseClient
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (itemsErr) console.warn('Items error:', itemsErr);
    currentItems = items || [];

    // 3. Fetch Status History
    const { data: history, error: histErr } = await supabaseClient
      .from('order_status_history')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (histErr) console.warn('History error:', histErr);
    currentHistory = history || [];

    // 4. Render UI Sections
    renderHeader(currentOrder);
    renderCustomerCard(currentOrder, currentItems);
    renderItemsTable(currentOrder, currentItems);
    renderTimeline(currentHistory);
    populateFulfillmentForm(currentOrder);
    populatePrintInvoice(currentOrder, currentItems);

  } catch (err) {
    console.error('Error loading order details:', err);
    admin.toast('Failed to load order: ' + err.message, 'error');
  }
}

/* ==========================================================================
   Render Header & Summary
   ========================================================================== */
function renderHeader(order) {
  document.getElementById('orderHeading').textContent = `Order #${order.order_number}`;
  document.title = `Order #${order.order_number} - Haider Sports Admin`;

  // Status Badge
  const badgeContainer = document.getElementById('orderHeaderBadge');
  badgeContainer.innerHTML = getStatusBadge(order.status);

  // Placed Date
  const dateObj = new Date(order.created_at);
  const formatted = dateObj.toLocaleString('en-PK', {
    dateStyle: 'full',
    timeStyle: 'short'
  });
  document.getElementById('orderPlacedDate').textContent = `Placed on ${formatted}`;
}

function getStatusBadge(status) {
  const st = (status || 'pending').toLowerCase();
  const label = st.charAt(0).toUpperCase() + st.slice(1);
  return `<span class="status-badge status-badge--${st}">${label}</span>`;
}

/* ==========================================================================
   Customer Information Card
   ========================================================================== */
function renderCustomerCard(order, items) {
  document.getElementById('custName').textContent = order.customer_name || 'Anonymous';

  // Phone Call Link
  const phone = order.phone || '';
  document.getElementById('custPhone').textContent = phone;
  document.getElementById('callCustomerBtn').href = `tel:${phone}`;

  // WhatsApp Link with pre-filled message
  let cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '92' + cleanPhone.slice(1);
  }
  const itemsText = items.map(it => `• ${it.product_name} ${it.variant ? `(${it.variant})` : ''} x${it.qty}`).join('\n');
  const waMsg = `Salam ${order.customer_name}!\nThis is Haider Sports confirming your Order #${order.order_number}.\n\nItems:\n${itemsText}\n\nTotal Payable: Rs. ${Number(order.total).toLocaleString()} (${order.payment_method === 'cod' ? 'Cash on Delivery' : 'Bank Transfer'})\nDelivery Address: ${order.address}, ${order.city}.\n\nPlease reply with *Confirm* to dispatch your package today!`;
  document.getElementById('whatsappCustomerBtn').href = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMsg)}`;

  // Address & Copy Button
  const fullAddress = `${order.address}, ${order.city}`;
  document.getElementById('custFullAddress').textContent = fullAddress;

  const landmarkEl = document.getElementById('custLandmark');
  if (order.landmark) {
    landmarkEl.textContent = `Landmark: ${order.landmark}`;
    landmarkEl.style.display = 'block';
  } else {
    landmarkEl.style.display = 'none';
  }

  document.getElementById('copyAddressBtn').onclick = () => {
    const textToCopy = `${order.customer_name}\n${phone}\n${fullAddress}${order.landmark ? ` (Near ${order.landmark})` : ''}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      admin.toast('Shipping address copied to clipboard!', 'success');
    });
  };

  // Email (if available)
  const emailContainer = document.getElementById('custEmailContainer');
  if (order.email) {
    document.getElementById('custEmail').textContent = order.email;
    emailContainer.style.display = 'block';
  } else {
    emailContainer.style.display = 'none';
  }

  // Customer Notes (if available)
  const notesContainer = document.getElementById('custNotesContainer');
  if (order.notes) {
    document.getElementById('custNotes').textContent = order.notes;
    notesContainer.style.display = 'block';
  } else {
    notesContainer.style.display = 'none';
  }

  // Private Admin Notes
  document.getElementById('adminPrivateNotes').value = order.admin_notes || '';
}

/* ==========================================================================
   Order Items Table & Totals Breakdown
   ========================================================================== */
function renderItemsTable(order, items) {
  document.getElementById('itemsTotalCount').textContent = items.length;
  const tbody = document.getElementById('orderItemsTableBody');

  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 24px; color: #64748b;">No items recorded for this order.</td></tr>`;
    return;
  }

  tbody.innerHTML = items.map(it => `
    <tr>
      <td>
        <div style="font-weight: 700; color: var(--heading);">${admin.escapeHtml(it.product_name)}</div>
        ${it.product_id ? `<a href="product-edit.html?id=${it.product_id}" target="_blank" style="font-size: 11px; color: var(--primary); text-decoration: none; display: inline-flex; align-items: center; gap: 4px;"><i data-lucide="external-link" style="width: 12px; height: 12px;"></i> View in Catalog</a>` : ''}
      </td>
      <td>
        <span style="font-size: 12.5px; color: #475569;">${admin.escapeHtml(it.variant || 'Standard')}</span>
      </td>
      <td style="text-align: right; font-size: 13.5px;">
        Rs. ${Number(it.price || 0).toLocaleString()}
      </td>
      <td style="text-align: center; font-weight: 700;">
        ${it.qty}
      </td>
      <td style="text-align: right; font-weight: 700; color: var(--heading);">
        Rs. ${Number(it.line_total || (it.price * it.qty) || 0).toLocaleString()}
      </td>
    </tr>
  `).join('');

  // Financial Breakdown
  document.getElementById('summarySubtotal').textContent = `Rs. ${Number(order.subtotal || 0).toLocaleString()}`;
  document.getElementById('summaryDelivery').textContent = `Rs. ${Number(order.delivery_charge || 0).toLocaleString()}`;

  const discountRow = document.getElementById('summaryDiscountRow');
  const discountVal = Number(order.discount || 0);
  if (discountVal > 0) {
    discountRow.style.display = 'flex';
    document.getElementById('summaryDiscount').textContent = `- Rs. ${discountVal.toLocaleString()}`;
    if (order.coupon_code) {
      document.getElementById('summaryCouponBadge').textContent = `(${order.coupon_code})`;
    }
  } else {
    discountRow.style.display = 'none';
  }

  document.getElementById('summaryGrandTotal').textContent = `Rs. ${Number(order.total || 0).toLocaleString()}`;
  document.getElementById('summaryPaymentMethod').textContent = `Payment: ${order.payment_method === 'cod' ? 'Cash on Delivery (COD)' : 'Direct Bank Transfer'}${order.payment_ref ? ` (Ref: ${order.payment_ref})` : ''}`;
}

/* ==========================================================================
   Status History & Audit Trail
   ========================================================================== */
function renderTimeline(history) {
  const container = document.getElementById('statusTimeline');

  if (history.length === 0) {
    container.innerHTML = `<div style="font-size: 13px; color: #94a3b8; padding: 10px 0;">No status changes recorded yet.</div>`;
    return;
  }

  container.innerHTML = history.map(item => {
    const dateObj = new Date(item.created_at);
    const dateFormatted = dateObj.toLocaleDateString('en-PK', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    const timeFormatted = dateObj.toLocaleTimeString('en-PK', {
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
      <div class="timeline-item">
        <div class="timeline-dot"></div>
        <div class="timeline-title">
          ${getStatusBadge(item.status)}
          <span>Status set to <strong>${item.status.toUpperCase()}</strong></span>
        </div>
        <div class="timeline-time">${dateFormatted} at ${timeFormatted}</div>
        ${item.note ? `<div class="timeline-note"><i data-lucide="message-square" style="width: 13px; height: 13px; color: #94a3b8; margin-right: 4px; vertical-align: middle;"></i> ${admin.escapeHtml(item.note)}</div>` : ''}
      </div>
    `;
  }).join('');
  if (window.lucide) lucide.createIcons();
}

/* ==========================================================================
   Fulfillment Form & Status Updates
   ========================================================================== */
function populateFulfillmentForm(order) {
  const statusSelect = document.getElementById('statusSelect');
  statusSelect.value = order.status || 'pending';

  const courierSelect = document.getElementById('courierSelect');
  courierSelect.value = order.courier || '';

  const trackingInput = document.getElementById('trackingInput');
  trackingInput.value = order.tracking_number || '';

  toggleFulfillmentFields(statusSelect.value);
}

function toggleFulfillmentFields(status) {
  const restockGroup = document.getElementById('restockCheckboxGroup');
  if (status === 'cancelled' || status === 'returned') {
    restockGroup.style.display = 'block';
  } else {
    restockGroup.style.display = 'none';
  }
}

function initDetailEvents(orderId) {
  const statusSelect = document.getElementById('statusSelect');
  statusSelect.addEventListener('change', () => {
    toggleFulfillmentFields(statusSelect.value);
  });

  // Handle Status Update Submit
  document.getElementById('updateStatusForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const newStatus = statusSelect.value;
    const courier = document.getElementById('courierSelect').value.trim() || null;
    const tracking = document.getElementById('trackingInput').value.trim() || null;
    const note = document.getElementById('statusNoteInput').value.trim() || null;
    const shouldRestock = document.getElementById('restockStockCheckbox').checked;

    const btn = document.getElementById('updateStatusBtn');
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader-2" class="spin-slow" style="width: 15px; height: 15px;"></i> Updating...';
    if (window.lucide) lucide.createIcons();

    try {
      // 1. Update orders table
      const { error: updateErr } = await supabaseClient
        .from('orders')
        .update({
          status: newStatus,
          courier: courier,
          tracking_number: tracking,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (updateErr) throw updateErr;

      // 2. Insert into order_status_history
      const historyPayload = {
        order_id: orderId,
        status: newStatus,
        note: note || (tracking ? `Dispatched via ${courier || 'Courier'} (Tracking: ${tracking})` : `Order status changed to ${newStatus}`)
      };

      await supabaseClient
        .from('order_status_history')
        .insert(historyPayload);

      // 3. Optional Restock on Cancelled or Returned
      if ((newStatus === 'cancelled' || newStatus === 'returned') && shouldRestock) {
        await restockItems(currentItems);
      }

      admin.toast(`Order #${currentOrder.order_number} updated to ${newStatus.toUpperCase()}`, 'success');
      document.getElementById('statusNoteInput').value = '';

      // Reload fresh data
      await loadOrderDetail(orderId);

    } catch (err) {
      console.error('Error updating order status:', err);
      admin.toast('Failed to update status: ' + err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="save" style="width: 15px; height: 15px;"></i> Update Status';
      if (window.lucide) lucide.createIcons();
    }
  });

  // Save Admin Internal Notes
  document.getElementById('saveAdminNotesBtn').addEventListener('click', async () => {
    const notesText = document.getElementById('adminPrivateNotes').value.trim();
    const btn = document.getElementById('saveAdminNotesBtn');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    try {
      const { error } = await supabaseClient
        .from('orders')
        .update({ admin_notes: notesText })
        .eq('id', orderId);

      if (error) throw error;
      admin.toast('Private admin notes saved', 'success');
    } catch (err) {
      admin.toast('Failed to save notes: ' + err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Save Private Notes';
    }
  });

  // Refresh Button
  document.getElementById('refreshDetailBtn').addEventListener('click', async () => {
    await loadOrderDetail(orderId);
    admin.toast('Order refreshed', 'info');
  });

  // Print Invoice Button
  document.getElementById('printInvoiceBtn').addEventListener('click', () => {
    window.print();
  });
}

async function restockItems(items) {
  try {
    for (const item of items) {
      if (item.product_id && item.qty > 0) {
        // Fetch current stock
        const { data: prod } = await supabaseClient
          .from('products')
          .select('stock')
          .eq('id', item.product_id)
          .single();

        if (prod) {
          const newStock = (prod.stock || 0) + item.qty;
          await supabaseClient
            .from('products')
            .update({ stock: newStock })
            .eq('id', item.product_id);
        }
      }
    }
    admin.toast('Inventory items successfully restocked!', 'info');
  } catch (err) {
    console.warn('Failed restocking inventory:', err);
  }
}

/* ==========================================================================
   Print-Ready Invoice Population
   ========================================================================== */
function populatePrintInvoice(order, items) {
  document.getElementById('pInvOrderNum').textContent = `Order #${order.order_number}`;
  document.getElementById('pInvDate').textContent = `Date: ${new Date(order.created_at).toLocaleDateString('en-PK', { dateStyle: 'long' })}`;

  document.getElementById('pInvName').textContent = order.customer_name;
  document.getElementById('pInvPhone').textContent = `Phone: ${order.phone}`;
  document.getElementById('pInvAddress').textContent = `${order.address}, ${order.city}${order.landmark ? ` (Near ${order.landmark})` : ''}`;

  document.getElementById('pInvPayment').textContent = order.payment_method === 'cod' ? 'Cash on Delivery (COD)' : 'Direct Bank Transfer';
  document.getElementById('pInvCourier').textContent = order.courier || 'Standard Courier Dispatch';
  document.getElementById('pInvTracking').textContent = order.tracking_number || 'N/A';

  // Items
  const pBody = document.getElementById('pInvItemsBody');
  pBody.innerHTML = items.map(it => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 8px;"><strong>${admin.escapeHtml(it.product_name)}</strong></td>
      <td style="padding: 8px;">${admin.escapeHtml(it.variant || 'Standard')}</td>
      <td style="padding: 8px; text-align: right;">Rs. ${Number(it.price || 0).toLocaleString()}</td>
      <td style="padding: 8px; text-align: center;">${it.qty}</td>
      <td style="padding: 8px; text-align: right;">Rs. ${Number(it.line_total || (it.price * it.qty)).toLocaleString()}</td>
    </tr>
  `).join('');

  // Financials
  document.getElementById('pInvSubtotal').textContent = `Rs. ${Number(order.subtotal || 0).toLocaleString()}`;
  document.getElementById('pInvDelivery').textContent = `Rs. ${Number(order.delivery_charge || 0).toLocaleString()}`;

  const discRow = document.getElementById('pInvDiscountRow');
  const discountVal = Number(order.discount || 0);
  if (discountVal > 0) {
    discRow.style.display = 'flex';
    document.getElementById('pInvDiscount').textContent = `- Rs. ${discountVal.toLocaleString()}`;
  } else {
    discRow.style.display = 'none';
  }

  const grandTotal = Number(order.total || 0);
  document.getElementById('pInvTotal').textContent = `Rs. ${grandTotal.toLocaleString()}`;

  // COD Collect box
  const codBox = document.getElementById('pInvCodCollect');
  if (order.payment_method === 'cod') {
    codBox.textContent = `COLLECT RS. ${grandTotal.toLocaleString()}`;
  } else {
    codBox.textContent = `PAID VIA BANK (DO NOT COLLECT)`;
  }
}
