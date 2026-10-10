/**
 * HAIDERSPORTS - ADMIN DASHBOARD SCRIPT
 * File: admin/js/dashboard.js
 * Implements: Stat Cards, Chart.js Revenue Trend, Recent Orders, Low Stock Alerts, Top Sellers, Date Filters
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Initialize admin layout and auth guard
  await admin.initLayout('dashboard', 'Dashboard');

  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const who = ((admin.currentUser && admin.currentUser.email) || 'Admin').split('@')[0];
  const h = document.querySelector('.admin-header-row h2');
  if (h) h.textContent = `${greet}, ${who.charAt(0).toUpperCase() + who.slice(1)}`;

  const sb = window.supabaseClient || (typeof supabase !== 'undefined' && supabase.createClient ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null);

  let currentRange = '30d';
  let chartInstance = null;

  // Cache elements
  const valRevenue = document.getElementById('valRevenue');
  const valOrders = document.getElementById('valOrders');
  const valPending = document.getElementById('valPending');
  const valMonthSales = document.getElementById('valMonthSales');
  const valProducts = document.getElementById('valProducts');
  const valLowStock = document.getElementById('valLowStock');
  const recentOrdersTbody = document.getElementById('recentOrdersTbody');
  const lowStockContainer = document.getElementById('lowStockContainer');
  const topProductsContainer = document.getElementById('topProductsContainer');
  const dateFilterGroup = document.getElementById('dateFilterGroup');

  // Date range buttons
  if (dateFilterGroup) {
    dateFilterGroup.querySelectorAll('.filter-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        dateFilterGroup.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentRange = btn.dataset.range;
        loadDashboardData();
      });
    });
  }

  // Calculate start date based on range
  function getRangeStartDate(range) {
    const now = new Date();
    if (range === 'today') {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    }
    if (range === '7d') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return d.toISOString();
    }
    if (range === 'month') {
      return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    }
    // Default 30d
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString();
  }

  function timeAgo(dateString) {
    if (!dateString) return '-';
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateString).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' });
  }

  // Fetch and calculate all dashboard metrics
  async function loadDashboardData() {
    if (!sb) return;

    const startDate = getRangeStartDate(currentRange);
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    try {
      // 1. Fetch Orders in current range (excluding cancelled and returned for revenue)
      const [
        ordersRes,
        pendingRes,
        monthSalesRes,
        productsRes,
        lowStockRes,
        recentOrdersRes
      ] = await Promise.all([
        // Orders in selected range
        sb.from('orders').select('id, total, status, created_at').gte('created_at', startDate),
        // All pending orders
        sb.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        // Month revenue
        sb.from('orders').select('total').gte('created_at', monthStart).neq('status', 'cancelled').neq('status', 'returned'),
        // Total products count
        sb.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
        // Low stock products (stock <= 5)
        sb.from('products').select('id, name, slug, stock, price, product_images(url)').lte('stock', 5).eq('is_active', true).order('stock', { ascending: true }).limit(5),
        // Recent 10 orders
        sb.from('orders').select('*').order('created_at', { ascending: false }).limit(10)
      ]);

      const rangeOrders = ordersRes.data || [];
      const validOrders = rangeOrders.filter(o => o.status !== 'cancelled' && o.status !== 'returned');

      // Metric 1: Revenue
      const revenue = validOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
      valRevenue.textContent = admin.formatRs(revenue);

      // Metric 2: Total Orders count in range
      valOrders.textContent = rangeOrders.length;

      // Metric 3: Pending Orders
      valPending.textContent = pendingRes.count || 0;

      // Metric 4: This Month Sales
      const monthRevenue = (monthSalesRes.data || []).reduce((sum, o) => sum + (Number(o.total) || 0), 0);
      valMonthSales.textContent = admin.formatRs(monthRevenue);

      // Metric 5: Total Products
      valProducts.textContent = productsRes.count || 0;

      // Metric 6: Low Stock Count
      const lowStockItems = lowStockRes.data || [];
      valLowStock.textContent = lowStockItems.length;

      // Render Sales Chart
      renderSalesChart(rangeOrders, currentRange);

      // Render Recent Orders
      renderRecentOrders(recentOrdersRes.data || []);

      // Render Low Stock alert list
      renderLowStock(lowStockItems);

      // Render Top Selling Products
      await loadTopSellingProducts();

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      admin.toast('Failed to load live metrics. Refreshing...', 'error');
    }
  }

  // 2. Chart.js Daily Sales Trend
  function renderSalesChart(orders, range) {
    const canvas = document.getElementById('salesChart');
    if (!canvas) return;

    // Group sales by day
    const daysMap = {};
    const daysCount = range === 'today' ? 24 : (range === '7d' ? 7 : (range === 'month' ? new Date().getDate() : 30));

    // Initialize map
    if (range === 'today') {
      for (let i = 0; i < 24; i++) {
        const label = `${String(i).padStart(2, '0')}:00`;
        daysMap[label] = 0;
      }
    } else {
      const now = new Date();
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        daysMap[label] = 0;
      }
    }

    // Populate revenue
    orders.forEach(o => {
      if (o.status === 'cancelled' || o.status === 'returned') return;
      const d = new Date(o.created_at);
      let key;
      if (range === 'today') {
        key = `${String(d.getHours()).padStart(2, '0')}:00`;
      } else {
        key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      if (key in daysMap) {
        daysMap[key] += (Number(o.total) || 0);
      }
    });

    const labels = Object.keys(daysMap);
    const dataPoints = Object.values(daysMap);

    if (chartInstance) {
      chartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(241, 90, 36, 0.28)');
    gradient.addColorStop(1, 'rgba(241, 90, 36, 0.0)');

    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Revenue (Rs.)',
          data: dataPoints,
          backgroundColor: '#f15a24',
          hoverBackgroundColor: '#111111',
          borderRadius: 8,
          borderSkipped: false,
          maxBarThickness: 26
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#111827',
            padding: 10,
            titleFont: { family: 'Plus Jakarta Sans', size: 12 },
            bodyFont: { family: 'Plus Jakarta Sans', size: 13, weight: 'bold' },
            callbacks: {
              label: function (context) {
                return ' ' + admin.formatRs(context.parsed.y);
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { family: 'Plus Jakarta Sans', size: 11 }, color: '#9ca3af' }
          },
          y: {
            beginAtZero: true,
            suggestedMax: 1000,
            border: { dash: [4, 4] },
            grid: { color: '#f3f4f6' },
            ticks: {
              font: { family: 'Plus Jakarta Sans', size: 11 },
              color: '#9ca3af',
              callback: function (val) {
                if (val >= 1000) return 'Rs. ' + (val / 1000) + 'k';
                return 'Rs. ' + val;
              }
            }
          }
        }
      }
    });
  }

  // 3. Render Recent Orders (Last 10)
  function renderRecentOrders(orders) {
    if (!recentOrdersTbody) return;

    if (orders.length === 0) {
      recentOrdersTbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 40px; color: #9ca3af;">
            <i data-lucide="folder-open" style="width: 28px; height: 28px; margin-bottom: 8px; display: inline-block;"></i>
            <div>No customer orders recorded yet.</div>
          </td>
        </tr>
      `;
      admin.renderIcons(recentOrdersTbody);
      return;
    }

    recentOrdersTbody.innerHTML = orders.map(o => `
      <tr>
        <td>
          <a href="#" onclick="openQuickOrder('${o.id}'); return false;" style="font-weight: 700; color: var(--primary);">
            ${o.order_number}
          </a>
        </td>
        <td>
          <div style="font-weight: 600; color: var(--heading);">${o.customer_name}</div>
          <div style="font-size: 11.5px; color: #6b7280;">${o.phone}</div>
        </td>
        <td>${o.city || '-'}</td>
        <td style="font-weight: 600;">${admin.formatRs(o.total)}</td>
        <td>
          <span class="status-badge status-badge--${o.status || 'pending'}">
            ${o.status || 'pending'}
          </span>
        </td>
        <td style="font-size: 12px; color: #9ca3af;">${timeAgo(o.created_at)}</td>
        <td>
          <button type="button" class="btn btn--icon btn--xs" onclick="openQuickOrder('${o.id}')" title="View details">
            <i data-lucide="eye"></i>
          </button>
        </td>
      </tr>
    `).join('');
    admin.renderIcons(recentOrdersTbody);
  }

  // 4. Render Low Stock Items
  function renderLowStock(items) {
    if (!lowStockContainer) return;

    if (items.length === 0) {
      lowStockContainer.innerHTML = `
        <div style="text-align: center; padding: 24px 10px; color: #10b981;">
          <i data-lucide="check-circle-2" style="width: 26px; height: 26px; margin-bottom: 6px; display: inline-block;"></i>
          <div style="font-size: 13px; font-weight: 600;">Inventory Healthy</div>
          <p style="font-size: 11.5px; color: #6b7280; margin-top: 2px;">No products are critically low in stock.</p>
        </div>
      `;
      admin.renderIcons(lowStockContainer);
      return;
    }

    lowStockContainer.innerHTML = items.map(p => {
      const imgUrl = (p.product_images && p.product_images[0]) ? p.product_images[0].url : 'https://images.unsplash.com/photo-1593766788306-28561086694e?w=80&q=80';
      const fullImg = (typeof img === 'function') ? img(imgUrl, 80) : imgUrl;
      return `
        <div class="top-product-item">
          <img src="${fullImg}" class="top-product-thumb" alt="${p.name}">
          <div class="top-product-info">
            <div class="top-product-name" title="${p.name}">${p.name}</div>
            <div class="top-product-meta">${admin.formatRs(p.price)}</div>
          </div>
          <div style="text-align: right;">
            <span style="display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 700; background: #fee2e2; color: #dc2626;">
              ${p.stock} left
            </span>
          </div>
        </div>
      `;
    }).join('');
  }

  // 5. Load Top Selling Products (from order_items)
  async function loadTopSellingProducts() {
    if (!topProductsContainer) return;

    try {
      const { data: orderItems, error } = await sb
        .from('order_items')
        .select('product_id, product_name, price, qty, line_total')
        .limit(100);

      if (error || !orderItems || orderItems.length === 0) {
        // Fallback gracefully to catalog showcase if no order items placed yet
        const { data: prods } = await sb.from('products').select('name, price, product_images(url)').limit(5);
        if (prods && prods.length) {
          topProductsContainer.innerHTML = prods.map((p, idx) => {
            const imgUrl = (p.product_images && p.product_images[0]) ? p.product_images[0].url : 'https://images.unsplash.com/photo-1593766788306-28561086694e?w=80&q=80';
            const fullImg = (typeof img === 'function') ? img(imgUrl, 80) : imgUrl;
            return `
              <div class="top-product-item">
                <div class="top-product-rank top-product-rank--${idx + 1}">${idx + 1}</div>
                <img src="${fullImg}" class="top-product-thumb" alt="${p.name}">
                <div class="top-product-info">
                  <div class="top-product-name">${p.name}</div>
                  <div class="top-product-meta">Featured catalog item</div>
                </div>
                <div class="top-product-price">${admin.formatRs(p.price)}</div>
              </div>
            `;
          }).join('');
          return;
        }

        topProductsContainer.innerHTML = '<p style="text-align:center; padding:20px; color:#9ca3af;">No sales recorded yet.</p>';
        return;
      }

      // Aggregate by product_name
      const agg = {};
      orderItems.forEach(i => {
        if (!agg[i.product_name]) {
          agg[i.product_name] = { name: i.product_name, qty: 0, revenue: 0, price: i.price };
        }
        agg[i.product_name].qty += (Number(i.qty) || 1);
        agg[i.product_name].revenue += (Number(i.line_total) || Number(i.price) || 0);
      });

      const topList = Object.values(agg).sort((a, b) => b.qty - a.qty).slice(0, 5);

      topProductsContainer.innerHTML = topList.map((item, idx) => `
        <div class="top-product-item">
          <div class="top-product-rank top-product-rank--${idx + 1}">${idx + 1}</div>
          <div class="top-product-info">
            <div class="top-product-name">${item.name}</div>
            <div class="top-product-meta">${item.qty} units sold</div>
          </div>
          <div class="top-product-price">${admin.formatRs(item.revenue)}</div>
        </div>
      `).join('');

    } catch (e) {
      topProductsContainer.innerHTML = '<p style="text-align:center; padding:20px; color:#9ca3af;">Top products calculation unavailable.</p>';
    }
  }

  // Quick Order Modal Viewer
  window.openQuickOrder = async function (orderId) {
    const modal = admin.modal('orderQuickModal');
    const titleEl = document.getElementById('orderModalTitle');
    const bodyEl = document.getElementById('orderModalBody');

    modal.open();
    bodyEl.innerHTML = '<p style="text-align:center; padding:30px; color:#64748b;"><i data-lucide="loader-2" class="spin" style="width: 18px; height: 18px; display: inline-block; vertical-align: middle; margin-right: 6px;"></i> Loading order details...</p>';
    if (window.lucide) lucide.createIcons();

    try {
      const { data: order, error } = await sb
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', orderId)
        .single();

      if (error || !order) throw error || new Error('Order not found');

      titleEl.textContent = `Order ${order.order_number}`;

      const itemsHtml = (order.order_items || []).map(i => `
        <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #f3f4f6; font-size:13px;">
          <div>
            <strong>${i.product_name}</strong> ${i.variant ? `<span style="color:#6b7280;">(${i.variant})</span>` : ''}
            <div style="color:#9ca3af; font-size:11.5px;">Qty: ${i.qty} × ${admin.formatRs(i.price)}</div>
          </div>
          <div style="font-weight:600;">${admin.formatRs(i.line_total)}</div>
        </div>
      `).join('');

      bodyEl.innerHTML = `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:18px;">
          <div>
            <div style="font-size:11px; text-transform:uppercase; color:#9ca3af; font-weight:700;">Customer</div>
            <div style="font-weight:600; font-size:14px; margin-top:2px;">${order.customer_name}</div>
            <div style="font-size:12.5px; color:#4b5563;">${order.phone}</div>
            ${order.email ? `<div style="font-size:12px; color:#6b7280;">${order.email}</div>` : ''}
          </div>
          <div>
            <div style="font-size:11px; text-transform:uppercase; color:#9ca3af; font-weight:700;">Delivery Address</div>
            <div style="font-size:13px; color:#374151; margin-top:2px;">${order.address}, ${order.city}</div>
            ${order.landmark ? `<div style="font-size:12px; color:#6b7280;">Landmark: ${order.landmark}</div>` : ''}
          </div>
        </div>

        <div style="margin-bottom:16px;">
          <div style="font-size:11px; text-transform:uppercase; color:#9ca3af; font-weight:700; margin-bottom:6px;">Order Items</div>
          ${itemsHtml || '<p style="color:#9ca3af;">No item details available.</p>'}
        </div>

        <div style="background:#f9fafb; padding:12px 16px; border-radius:8px; font-size:13px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <span>Subtotal:</span><strong>${admin.formatRs(order.subtotal)}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <span>Delivery:</span><strong>${admin.formatRs(order.delivery_charge)}</strong>
          </div>
          ${order.discount ? `
            <div style="display:flex; justify-content:space-between; color:#059669; margin-bottom:4px;">
              <span>Discount (${order.coupon_code || 'Promo'}):</span><strong>-${admin.formatRs(order.discount)}</strong>
            </div>
          ` : ''}
          <div style="display:flex; justify-content:space-between; font-size:15px; font-weight:800; border-top:1px solid #e5e7eb; padding-top:6px; margin-top:4px; color:var(--heading);">
            <span>Total:</span><strong>${admin.formatRs(order.total)}</strong>
          </div>
        </div>
      `;
    } catch (err) {
      bodyEl.innerHTML = '<p style="text-align:center; padding:30px; color:#dc2626;">Failed to load order details.</p>';
    }
  };

  // Kick off initial load
  loadDashboardData();
});
