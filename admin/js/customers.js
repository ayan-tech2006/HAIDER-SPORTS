/**
 * Customer Directory Script for Haider Sports Admin
 * Groups orders by normalized phone number to generate customer profiles,
 * lifetime value metrics, repeat/VIP buyer flags, COD risk flags, and order history drawers.
 */

let rawOrders = [];
let customerList = [];
let filteredCustomers = [];
let currentPage = 1;
const pageSize = 20;

let searchQuery = '';
let currentSort = 'spent_desc';
let currentTypeFilter = 'all';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Initialize layout & auth guard
  await admin.initLayout('customers', 'Customer Directory');

  // 2. Initialize Event Listeners
  initEventListeners();

  // 3. Load Customers Data
  await loadCustomers();
});

/* ==========================================================================
   Load Orders & Aggregate Customer Profiles
   ========================================================================== */
async function loadCustomers() {
  const tbody = document.getElementById('customersTableBody');
  tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 40px; color: #64748b;"><i data-lucide="loader-2" class="spin-slow" style="width: 22px; height: 22px; margin: 0 auto 8px; display: block;"></i> Aggregating customer profiles...</td></tr>`;
  if (window.lucide) lucide.createIcons();

  try {
    const { data: orders, error } = await supabaseClient
      .from('orders')
      .select('id, order_number, customer_name, phone, city, address, landmark, total, status, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    rawOrders = orders || [];

    // Group orders by normalized phone
    const groupMap = new Map();

    rawOrders.forEach(o => {
      const normPhone = normalizePhone(o.phone);
      if (!normPhone) return;

      if (!groupMap.has(normPhone)) {
        groupMap.set(normPhone, {
          normalizedPhone: normPhone,
          phone: o.phone || '',
          name: o.customer_name || 'Anonymous',
          city: o.city || 'N/A',
          address: o.address ? `${o.address}, ${o.city}` : o.city,
          landmark: o.landmark || '',
          totalOrders: 0,
          cancelledOrReturned: 0,
          totalSpent: 0,
          lastOrderDate: o.created_at,
          orders: []
        });
      }

      const c = groupMap.get(normPhone);
      c.totalOrders++;
      c.orders.push(o);

      const st = (o.status || '').toLowerCase();
      if (st === 'cancelled' || st === 'returned') {
        c.cancelledOrReturned++;
      } else {
        c.totalSpent += Number(o.total || 0);
      }
    });

    customerList = Array.from(groupMap.values()).map(c => {
      c.isVip = c.totalOrders >= 3;
      c.isRisky = c.cancelledOrReturned >= 2;
      return c;
    });

    // Update Top Stat Cards
    updateStats();

    // Render Table
    applyFiltersAndRender();

  } catch (err) {
    console.error('Error aggregating customers:', err);
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 40px; color: #ef4444;"><i data-lucide="alert-triangle" style="width: 22px; height: 22px; margin: 0 auto 8px; display: block;"></i> Error loading customers: ${err.message}</td></tr>`;
    if (window.lucide) lucide.createIcons();
  }
}

function normalizePhone(phone) {
  if (!phone) return '';
  let digits = phone.replace(/[^0-9]/g, '');
  if (digits.startsWith('92')) digits = digits.slice(2);
  else if (digits.startsWith('0')) digits = digits.slice(1);
  return digits;
}

function updateStats() {
  const total = customerList.length;
  const vip = customerList.filter(c => c.isVip).length;
  const risky = customerList.filter(c => c.isRisky).length;

  document.getElementById('statTotalCust').textContent = total;
  document.getElementById('statRepeatCust').textContent = vip;
  document.getElementById('statRiskyCust').textContent = risky;
}

/* ==========================================================================
   Filter, Sort & Render
   ========================================================================== */
function applyFiltersAndRender() {
  const query = searchQuery.toLowerCase().trim();

  filteredCustomers = customerList.filter(c => {
    // 1. Search filter
    if (query) {
      const matchName = c.name.toLowerCase().includes(query);
      const matchPhone = c.phone.toLowerCase().includes(query);
      const matchCity = c.city.toLowerCase().includes(query);
      if (!matchName && !matchPhone && !matchCity) return false;
    }

    // 2. Type filter
    if (currentTypeFilter === 'vip' && !c.isVip) return false;
    if (currentTypeFilter === 'risky' && !c.isRisky) return false;

    return true;
  });

  // Sort
  filteredCustomers.sort((a, b) => {
    if (currentSort === 'spent_desc') {
      return b.totalSpent - a.totalSpent;
    } else if (currentSort === 'orders_desc') {
      return b.totalOrders - a.totalOrders;
    } else if (currentSort === 'latest_order') {
      return new Date(b.lastOrderDate) - new Date(a.lastOrderDate);
    } else if (currentSort === 'name_asc') {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  renderTable();
}

function renderTable() {
  const tbody = document.getElementById('customersTableBody');
  const paginationInfo = document.getElementById('custPaginationInfo');
  const paginationBtns = document.getElementById('custPaginationBtns');

  const total = filteredCustomers.length;

  if (total === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 48px 16px; color: #64748b;">
          <i data-lucide="users" style="width: 36px; height: 36px; margin: 0 auto 8px; display: block; opacity: 0.5;"></i>
          <div style="font-size: 15px; font-weight: 600; color: var(--heading);">No customers found</div>
          <div style="font-size: 13px; color: #94a3b8; margin-top: 4px;">Try adjusting your search query or customer type filter.</div>
        </td>
      </tr>
    `;
    paginationInfo.textContent = 'Showing 0 customers';
    paginationBtns.innerHTML = '';
    if (window.lucide) lucide.createIcons();
    return;
  }

  const totalPages = Math.ceil(total / pageSize);
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, total);
  const pagedList = filteredCustomers.slice(startIdx, endIdx);

  tbody.innerHTML = pagedList.map((c, index) => {
    const lastDate = new Date(c.lastOrderDate).toLocaleDateString('en-PK', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    let tagHtml = '';
    if (c.isRisky) {
      tagHtml = `<span class="status-badge status-badge--cancelled">Risky (${c.cancelledOrReturned} ret)</span>`;
    } else if (c.isVip) {
      tagHtml = `<span class="status-badge status-badge--delivered">Loyal Buyer</span>`;
    } else {
      tagHtml = `<span class="status-badge status-badge--pending">Standard</span>`;
    }

    return `
      <tr>
        <td>
          <div style="font-weight: 700; color: var(--heading);">${admin.escapeHtml(c.name)}</div>
        </td>
        <td>
          <a href="tel:${c.phone}" style="font-size: 13px; color: #475569; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
            <i data-lucide="phone" style="width: 12px; height: 12px; color: #94a3b8;"></i> ${c.phone}
          </a>
        </td>
        <td>
          <span style="font-size: 13px; font-weight: 500;">${admin.escapeHtml(c.city)}</span>
        </td>
        <td style="text-align: center;">
          <span class="badge badge--primary" style="font-size: 12px; font-weight: 700; border-radius: 99px; padding: 2px 8px;">
            ${c.totalOrders}
          </span>
        </td>
        <td>
          ${tagHtml}
        </td>
        <td style="text-align: right; font-weight: 700; color: var(--heading);">
          Rs. ${c.totalSpent.toLocaleString()}
        </td>
        <td>
          <span style="font-size: 12.5px; color: #64748b;">${lastDate}</span>
        </td>
        <td style="text-align: right;">
          <button type="button" class="btn btn--outline btn--xs" onclick="openCustomerDrawer('${c.normalizedPhone}')" style="display: inline-flex; align-items: center; gap: 5px;">
            <i data-lucide="history" style="width: 12px; height: 12px;"></i> History
          </button>
        </td>
      </tr>
    `;
  }).join('');

  paginationInfo.textContent = `Showing ${startIdx + 1} to ${endIdx} of ${total} customers`;
  renderPagination(totalPages);
  if (window.lucide) lucide.createIcons();
}

function renderPagination(totalPages) {
  const container = document.getElementById('custPaginationBtns');
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = `
    <button class="btn btn--outline btn--xs" ${currentPage === 1 ? 'disabled' : ''} onclick="changeCustPage(${currentPage - 1})">
      <i data-lucide="chevron-left" style="width: 12px; height: 12px;"></i>
    </button>
  `;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
      html += `
        <button class="btn ${i === currentPage ? 'btn--primary' : 'btn--outline'} btn--xs" onclick="changeCustPage(${i})">
          ${i}
        </button>
      `;
    } else if (i === currentPage - 3 || i === currentPage + 3) {
      html += `<span style="padding: 0 4px; color: #94a3b8;">...</span>`;
    }
  }

  html += `
    <button class="btn btn--outline btn--xs" ${currentPage === totalPages ? 'disabled' : ''} onclick="changeCustPage(${currentPage + 1})">
      <i data-lucide="chevron-right" style="width: 12px; height: 12px;"></i>
    </button>
  `;

  container.innerHTML = html;
  if (window.lucide) lucide.createIcons();
}

window.changeCustPage = function(p) {
  currentPage = p;
  renderTable();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

/* ==========================================================================
   Side Drawer Details
   ========================================================================== */
window.openCustomerDrawer = function(normPhone) {
  const cust = customerList.find(c => c.normalizedPhone === normPhone);
  if (!cust) return;

  document.getElementById('drawerCustName').textContent = cust.name;
  document.getElementById('drawerCustPhone').textContent = cust.phone;
  document.getElementById('drawerCallBtn').href = `tel:${cust.phone}`;

  let waPhone = cust.phone.replace(/[^0-9]/g, '');
  if (waPhone.startsWith('0')) waPhone = '92' + waPhone.slice(1);
  document.getElementById('drawerWhatsAppBtn').href = `https://wa.me/${waPhone}`;

  // Alert Banner
  const alertEl = document.getElementById('drawerAlertBanner');
  if (cust.isRisky) {
    alertEl.innerHTML = `
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 12px; color: #991b1b; font-size: 13px; display: flex; align-items: center; gap: 8px;">
        <i data-lucide="shield-alert" style="width: 18px; height: 18px; flex-shrink: 0;"></i>
        <div><strong>High Return Risk:</strong> This phone number has <strong>${cust.cancelledOrReturned} cancelled/returned orders</strong>. Verify before dispatching COD.</div>
      </div>
    `;
    alertEl.style.display = 'block';
  } else if (cust.isVip) {
    alertEl.innerHTML = `
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 12px; color: #166534; font-size: 13px; display: flex; align-items: center; gap: 8px;">
        <i data-lucide="award" style="width: 18px; height: 18px; flex-shrink: 0;"></i>
        <div><strong>Loyal Customer:</strong> Placed ${cust.totalOrders} successful orders with 100% reliability!</div>
      </div>
    `;
    alertEl.style.display = 'block';
  } else {
    alertEl.style.display = 'none';
  }

  // Lifetime Stats
  document.getElementById('drawerTotalSpent').textContent = `Rs. ${cust.totalSpent.toLocaleString()}`;
  document.getElementById('drawerTotalOrders').textContent = cust.totalOrders;

  // Address
  document.getElementById('drawerAddress').textContent = `${cust.address}${cust.landmark ? ` (Landmark: ${cust.landmark})` : ''}`;

  // Orders List
  const ordersContainer = document.getElementById('drawerOrdersList');
  ordersContainer.innerHTML = cust.orders.map(o => {
    const d = new Date(o.created_at).toLocaleDateString('en-PK', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    const st = (o.status || 'pending').toLowerCase();

    return `
      <div style="border: 1px solid var(--border); border-radius: 12px; padding: 12px 14px; background: #fff; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <a href="order-detail.html?id=${o.id}" style="font-weight: 700; color: var(--primary); text-decoration: none; font-size: 13.5px;">
            #${o.order_number}
          </a>
          <div style="font-size: 11.5px; color: #64748b; margin-top: 2px;">${d}</div>
        </div>

        <div style="text-align: right;">
          <div style="font-weight: 700; font-size: 13.5px; color: var(--heading);">Rs. ${Number(o.total || 0).toLocaleString()}</div>
          <span class="status-badge status-badge--${st}" style="margin-top: 4px; display: inline-block;">
            ${st.charAt(0).toUpperCase() + st.slice(1)}
          </span>
        </div>
      </div>
    `;
  }).join('');

  // Show Drawer
  document.getElementById('custDrawerBackdrop').classList.add('active');
  document.getElementById('custDrawerPanel').classList.add('active');
  if (window.lucide) lucide.createIcons();
};

function getStatusBadgeClass(status) {
  const st = (status || '').toLowerCase();
  switch (st) {
    case 'pending': return 'badge--warning';
    case 'confirmed': return 'badge--info';
    case 'shipped': return 'badge--primary';
    case 'delivered': return 'badge--success';
    case 'cancelled': return 'badge--danger';
    default: return 'badge--neutral';
  }
}

function closeCustomerDrawer() {
  document.getElementById('custDrawerBackdrop').classList.remove('active');
  document.getElementById('custDrawerPanel').classList.remove('active');
}

/* ==========================================================================
   Event Listeners & CSV Export
   ========================================================================== */
function initEventListeners() {
  // Search
  document.getElementById('custSearchInput').addEventListener('input', (e) => {
    searchQuery = e.target.value;
    currentPage = 1;
    applyFiltersAndRender();
  });

  // Sort
  document.getElementById('custSortSelect').addEventListener('change', (e) => {
    currentSort = e.target.value;
    applyFiltersAndRender();
  });

  // Type filter
  document.getElementById('custTypeFilter').addEventListener('change', (e) => {
    currentTypeFilter = e.target.value;
    currentPage = 1;
    applyFiltersAndRender();
  });

  // Refresh
  document.getElementById('refreshCustBtn').addEventListener('click', async () => {
    await loadCustomers();
    admin.toast('Customer list refreshed', 'info');
  });

  // Drawer Close
  document.getElementById('closeCustDrawerBtn').addEventListener('click', closeCustomerDrawer);
  document.getElementById('custDrawerBackdrop').addEventListener('click', closeCustomerDrawer);

  // CSV Export
  document.getElementById('exportCustCsvBtn').addEventListener('click', exportCustomersToCsv);
}

function exportCustomersToCsv() {
  if (filteredCustomers.length === 0) {
    admin.toast('No customer records to export', 'warning');
    return;
  }

  const headers = [
    'Customer Name',
    'Phone',
    'City',
    'Full Address',
    'Total Orders',
    'Returns or Cancelled',
    'Total Spent (Rs)',
    'Last Order Date',
    'Customer Type'
  ];

  const rows = filteredCustomers.map(c => [
    `"${c.name.replace(/"/g, '""')}"`,
    `"${c.phone}"`,
    `"${c.city.replace(/"/g, '""')}"`,
    `"${c.address.replace(/"/g, '""')}"`,
    c.totalOrders,
    c.cancelledOrReturned,
    c.totalSpent,
    `"${new Date(c.lastOrderDate).toLocaleDateString('en-PK')}"`,
    c.isRisky ? 'Risky COD' : (c.isVip ? 'Loyal VIP' : 'Standard')
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `haider_customers_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  admin.toast(`Exported ${filteredCustomers.length} customer profiles to CSV`, 'success');
}
