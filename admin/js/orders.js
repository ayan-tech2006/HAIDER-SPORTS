/**
 * Orders Manager Script for Haider Sports Admin
 * Handles orders listing, status tabs, date/city filters, search, CSV export,
 * and Supabase realtime new order alerts with audio notifications.
 */

let allOrders = [];
let activeStatus = 'all';
let searchQuery = '';
let selectedCity = 'all';
let selectedDateRange = 'all';
let currentPage = 1;
const pageSize = 20;

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Initialize layout & auth guard
  await admin.initLayout('orders', 'Customer Orders');

  // 2. Initialize Event Listeners
  initFilters();

  // 3. Load initial orders data
  await loadOrders();

  // 4. Setup Realtime Listener & Polling for New Orders
  initRealtimeSync();
});

/* ==========================================================================
   Load Orders & Status Counts
   ========================================================================== */
async function loadOrders(silent = false) {
  const tbody = document.getElementById('ordersTableBody');
  if (!silent) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 40px; color: #64748b;"><i data-lucide="loader-2" class="spin" style="width: 18px; height: 18px; display: inline-block; vertical-align: middle; margin-right: 6px;"></i> Loading customer orders...</td></tr>`;
    if (window.lucide) lucide.createIcons();
  }

  try {
    const { data, error } = await supabaseClient
      .from('orders')
      .select(`
        id,
        order_number,
        customer_name,
        phone,
        city,
        address,
        landmark,
        payment_method,
        subtotal,
        delivery_charge,
        discount,
        total,
        coupon_code,
        status,
        courier,
        tracking_number,
        created_at,
        order_items ( id, product_name, qty, price, line_total )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    allOrders = data || [];

    // Update Counts on Status Tabs
    updateStatusCounts();

    // Populate City Filter Dropdown
    updateCityFilter();

    // Render Table
    renderOrdersTable();

  } catch (err) {
    console.error('Failed to load orders:', err);
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 40px; color: #ef4444;"><i data-lucide="alert-circle" style="width: 18px; height: 18px; display: inline-block; vertical-align: middle; margin-right: 6px;"></i> Error loading orders: ${err.message}</td></tr>`;
    if (window.lucide) lucide.createIcons();
  }
}

function updateStatusCounts() {
  const counts = {
    all: allOrders.length,
    pending: 0,
    confirmed: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    returned: 0
  };

  allOrders.forEach(o => {
    const st = (o.status || '').toLowerCase();
    if (counts[st] !== undefined) counts[st]++;
  });

  document.getElementById('countAll').textContent = counts.all;
  document.getElementById('countPending').textContent = counts.pending;
  document.getElementById('countConfirmed').textContent = counts.confirmed;
  document.getElementById('countShipped').textContent = counts.shipped;
  document.getElementById('countDelivered').textContent = counts.delivered;
  document.getElementById('countCancelled').textContent = counts.cancelled;
  document.getElementById('countReturned').textContent = counts.returned;

  // Also update sidebar badge if present
  const pendingBadge = document.getElementById('badgeOrders');
  if (pendingBadge) {
    pendingBadge.textContent = counts.pending;
    pendingBadge.style.display = counts.pending > 0 ? 'inline-block' : 'none';
  }
}

function updateCityFilter() {
  const citySelect = document.getElementById('cityFilter');
  const currentVal = citySelect.value;

  const cities = new Set();
  allOrders.forEach(o => {
    if (o.city) cities.add(o.city.trim());
  });

  const sortedCities = Array.from(cities).sort();
  citySelect.innerHTML = '<option value="all">All Cities</option>';
  sortedCities.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    citySelect.appendChild(opt);
  });

  if (cities.has(currentVal)) {
    citySelect.value = currentVal;
  }
}

/* ==========================================================================
   Filter, Search & Pagination
   ========================================================================== */
function getFilteredOrders() {
  const query = searchQuery.toLowerCase().trim();
  const now = new Date();

  return allOrders.filter(o => {
    // 1. Status Tab filter
    if (activeStatus !== 'all' && (o.status || '').toLowerCase() !== activeStatus) {
      return false;
    }

    // 2. City filter
    if (selectedCity !== 'all' && o.city !== selectedCity) {
      return false;
    }

    // 3. Search query filter
    if (query) {
      const matchNum = (o.order_number || '').toLowerCase().includes(query);
      const matchName = (o.customer_name || '').toLowerCase().includes(query);
      const matchPhone = (o.phone || '').toLowerCase().includes(query);
      if (!matchNum && !matchName && !matchPhone) return false;
    }

    // 4. Date range filter
    if (selectedDateRange !== 'all') {
      const orderDate = new Date(o.created_at);
      if (selectedDateRange === 'today') {
        const isToday = orderDate.toDateString() === now.toDateString();
        if (!isToday) return false;
      } else if (selectedDateRange === '7d') {
        const diffDays = (now - orderDate) / (1000 * 60 * 60 * 24);
        if (diffDays > 7) return false;
      } else if (selectedDateRange === '30d') {
        const diffDays = (now - orderDate) / (1000 * 60 * 60 * 24);
        if (diffDays > 30) return false;
      } else if (selectedDateRange === 'month') {
        if (orderDate.getMonth() !== now.getMonth() || orderDate.getFullYear() !== now.getFullYear()) {
          return false;
        }
      }
    }

    return true;
  });
}

function renderOrdersTable() {
  const filtered = getFilteredOrders();
  const totalItems = filtered.length;
  const tbody = document.getElementById('ordersTableBody');
  const paginationInfo = document.getElementById('paginationInfo');
  const paginationBtns = document.getElementById('paginationButtons');

  if (totalItems === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 56px 16px; color: #71717a;">
          <i data-lucide="package-search" style="width: 40px; height: 40px; color: #a1a1aa; margin-bottom: 8px; display: inline-block;"></i>
          <div style="font-size: 15px; font-weight: 700; color: #18181b;">No orders found</div>
          <div style="font-size: 13px; color: #a1a1aa; margin-top: 4px;">Try adjusting your search criteria, city, or status filter.</div>
        </td>
      </tr>
    `;
    admin.renderIcons(tbody);
    paginationInfo.textContent = 'Showing 0 orders';
    paginationBtns.innerHTML = '';
    return;
  }

  // Calculate pages
  const totalPages = Math.ceil(totalItems / pageSize);
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, totalItems);
  const pagedOrders = filtered.slice(startIdx, endIdx);

  tbody.innerHTML = pagedOrders.map(o => {
    const itemsCount = (o.order_items && o.order_items.length) || 0;
    const totalQty = (o.order_items || []).reduce((acc, it) => acc + (it.qty || 1), 0);
    const dateObj = new Date(o.created_at);
    const formattedDate = dateObj.toLocaleDateString('en-PK', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    const formattedTime = dateObj.toLocaleTimeString('en-PK', {
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
      <tr>
        <td>
          <a href="order-detail.html?id=${o.id}" style="font-weight: 700; color: var(--primary); text-decoration: none;">
            #${o.order_number}
          </a>
        </td>
        <td>
          <div style="font-size: 13px; font-weight: 600; color: #18181b;">${formattedDate}</div>
          <div style="font-size: 11.5px; color: #71717a;">${formattedTime}</div>
        </td>
        <td>
          <div style="font-weight: 600; color: #18181b;">${admin.escapeHtml(o.customer_name)}</div>
          <a href="tel:${o.phone}" style="font-size: 12px; color: #71717a; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
            <i data-lucide="phone" style="width: 12px; height: 12px;"></i> ${o.phone}
          </a>
        </td>
        <td>
          <span style="font-weight: 500; font-size: 13px;">${admin.escapeHtml(o.city || 'N/A')}</span>
        </td>
        <td>
          <span style="font-size: 13px; font-weight: 600;">${itemsCount} item${itemsCount !== 1 ? 's' : ''}</span>
          <div style="font-size: 11px; color: #71717a;">(${totalQty} units)</div>
        </td>
        <td>
          <strong style="color: #18181b; font-size: 14px;">Rs. ${Number(o.total || 0).toLocaleString()}</strong>
        </td>
        <td>
          <span class="badge ${o.payment_method === 'cod' ? 'badge--info' : 'badge--warning'}" style="font-size: 11px; text-transform: uppercase;">
            ${o.payment_method === 'cod' ? 'Cash on Delivery' : 'Bank Transfer'}
          </span>
        </td>
        <td>
          ${getStatusBadge(o.status)}
        </td>
        <td style="text-align: right;">
          <a href="order-detail.html?id=${o.id}" class="btn btn--outline btn--xs" title="View Order Details">
            <i data-lucide="eye"></i> Details
          </a>
        </td>
      </tr>
    `;
  }).join('');

  admin.renderIcons(tbody);

  // Update pagination UI
  paginationInfo.textContent = `Showing ${startIdx + 1} to ${endIdx} of ${totalItems} orders`;
  renderPaginationButtons(totalPages);
}

function getStatusBadge(status) {
  const st = (status || 'pending').toLowerCase();
  const label = st.charAt(0).toUpperCase() + st.slice(1);
  return `<span class="status-badge status-badge--${st}">${label}</span>`;
}

function renderPaginationButtons(totalPages) {
  const container = document.getElementById('paginationButtons');
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = `
    <button class="btn btn--outline btn--xs" ${currentPage === 1 ? 'disabled' : ''} onclick="goToPage(${currentPage - 1})">
      <i data-lucide="chevron-left" style="width: 13px; height: 13px;"></i>
    </button>
  `;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
      html += `
        <button class="btn ${i === currentPage ? 'btn--primary' : 'btn--outline'} btn--xs" onclick="goToPage(${i})">
          ${i}
        </button>
      `;
    } else if (i === currentPage - 3 || i === currentPage + 3) {
      html += `<span style="padding: 0 4px; color: #94a3b8;">...</span>`;
    }
  }

  html += `
    <button class="btn btn--outline btn--xs" ${currentPage === totalPages ? 'disabled' : ''} onclick="goToPage(${currentPage + 1})">
      <i data-lucide="chevron-right" style="width: 13px; height: 13px;"></i>
    </button>
  `;

  container.innerHTML = html;
  if (window.lucide) lucide.createIcons();
}

window.goToPage = function(p) {
  currentPage = p;
  renderOrdersTable();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

/* ==========================================================================
   Filter Event Listeners
   ========================================================================== */
function initFilters() {
  // 1. Status Tabs
  const tabBtns = document.querySelectorAll('#statusTabsNav .status-tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeStatus = btn.dataset.status;
      currentPage = 1;
      renderOrdersTable();
    });
  });

  // 2. Search Input
  const searchInput = document.getElementById('orderSearchInput');
  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value;
    currentPage = 1;
    renderOrdersTable();
  });

  // 3. City Filter
  const citySelect = document.getElementById('cityFilter');
  citySelect.addEventListener('change', () => {
    selectedCity = citySelect.value;
    currentPage = 1;
    renderOrdersTable();
  });

  // 4. Date Filter
  const dateSelect = document.getElementById('dateFilter');
  dateSelect.addEventListener('change', () => {
    selectedDateRange = dateSelect.value;
    currentPage = 1;
    renderOrdersTable();
  });

  // 5. Refresh Button
  document.getElementById('refreshOrdersBtn').addEventListener('click', async () => {
    await loadOrders();
    admin.toast('Orders list refreshed', 'info');
  });

  // 6. CSV Export Button
  document.getElementById('exportCsvBtn').addEventListener('click', exportToCsv);
}

/* ==========================================================================
   CSV Export
   ========================================================================== */
function exportToCsv() {
  const filtered = getFilteredOrders();
  if (filtered.length === 0) {
    admin.toast('No orders to export in current filter', 'warning');
    return;
  }

  const headers = [
    'Order Number',
    'Date',
    'Customer Name',
    'Phone',
    'City',
    'Address',
    'Landmark',
    'Payment Method',
    'Items Count',
    'Subtotal (Rs)',
    'Delivery Charge (Rs)',
    'Discount (Rs)',
    'Coupon Code',
    'Total (Rs)',
    'Status',
    'Courier',
    'Tracking Number'
  ];

  const rows = filtered.map(o => [
    `"${o.order_number || ''}"`,
    `"${new Date(o.created_at).toLocaleString('en-PK')}"`,
    `"${(o.customer_name || '').replace(/"/g, '""')}"`,
    `"${o.phone || ''}"`,
    `"${(o.city || '').replace(/"/g, '""')}"`,
    `"${(o.address || '').replace(/"/g, '""')}"`,
    `"${(o.landmark || '').replace(/"/g, '""')}"`,
    `"${o.payment_method || ''}"`,
    (o.order_items && o.order_items.length) || 0,
    o.subtotal || 0,
    o.delivery_charge || 0,
    o.discount || 0,
    `"${o.coupon_code || ''}"`,
    o.total || 0,
    `"${o.status || ''}"`,
    `"${o.courier || ''}"`,
    `"${o.tracking_number || ''}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `haider_orders_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  admin.toast(`Exported ${filtered.length} orders to CSV`, 'success');
}

/* ==========================================================================
   Realtime Subscription & New Order Alert
   ========================================================================== */
function initRealtimeSync() {
  try {
    // Supabase Realtime channel
    const channel = supabaseClient
      .channel('admin-orders-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        handleNewOrderAlert(payload.new);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, () => {
        // Silently reload on external updates
        loadOrders(true);
      })
      .subscribe();

    // 60-second fallback polling
    setInterval(() => {
      loadOrders(true);
    }, 60000);

  } catch (err) {
    console.warn('Realtime subscription not supported, fallback to polling:', err);
    setInterval(() => {
      loadOrders(true);
    }, 30000);
  }
}

function handleNewOrderAlert(newOrder) {
  // Play chime sound
  const chime = document.getElementById('orderChime');
  if (chime) {
    chime.play().catch(() => {
      // Audio autoplay restrictions might block before user interaction
    });
  }

  // Show Toast
  admin.toast(`🔔 New Order! #${newOrder.order_number} from ${newOrder.customer_name} (Rs. ${Number(newOrder.total).toLocaleString()})`, 'success');

  // Reload orders silently
  loadOrders(true);
}
