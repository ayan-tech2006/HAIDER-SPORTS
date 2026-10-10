/**
 * HAIDERSPORTS - ADMIN PRODUCTS LIST SCRIPT
 * File: admin/js/products.js
 * Implements: Search, Collection & Stock Filters, Sorting, Pagination (20/page),
 *             Bulk Status/Delete Actions, Quick Inline Price/Stock Editing,
 *             Product Duplication, Live Featured Star Toggle
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize layout & auth guard
  await admin.initLayout('products', 'Products Catalog');

  const sb = window.supabaseClient || (typeof supabase !== 'undefined' && supabase.createClient ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null);

  let rawProducts = [];
  let rawCollections = [];
  let selectedIds = new Set();

  let currentPage = 1;
  const pageSize = 20;
  let sortCol = 'created_at';
  let sortAsc = false;

  // DOM Elements
  const tbody = document.getElementById('productsTbody');
  const paginationEl = document.getElementById('productsPagination');
  const searchInput = document.getElementById('prodSearchInput');
  const colFilter = document.getElementById('prodColFilter');
  const stockFilter = document.getElementById('prodStockFilter');
  const statusFilter = document.getElementById('prodStatusFilter');
  const resetFiltersBtn = document.getElementById('resetFiltersBtn');
  const selectAllCheckbox = document.getElementById('selectAllCheckbox');
  const bulkToolbar = document.getElementById('bulkToolbar');
  const selectedCountEl = document.getElementById('selectedCount');
  const bulkShowBtn = document.getElementById('bulkShowBtn');
  const bulkHideBtn = document.getElementById('bulkHideBtn');
  const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');

  // Load Collections & Products
  async function loadData() {
    if (!sb) return;

    try {
      const [colRes, prodRes] = await Promise.all([
        sb.from('collections').select('id, name, parent_id').order('sort_order', { ascending: true }),
        sb.from('products').select('*, product_images(url), collections(id, name, parent_id)').order('created_at', { ascending: false })
      ]);

      if (colRes.error) throw colRes.error;
      if (prodRes.error) throw prodRes.error;

      rawCollections = colRes.data || [];
      rawProducts = prodRes.data || [];

      populateCollectionFilter();
      render();

    } catch (err) {
      console.error('Error fetching products:', err);
      tbody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align: center; padding: 48px; color: #dc2626;">
            <i data-lucide="alert-triangle" style="width: 28px; height: 28px; margin: 0 auto 8px; display: block;"></i>
            Failed to load products: ${err.message}
          </td>
        </tr>
      `;
      if (window.lucide) lucide.createIcons();
    }
  }

  // Build collection path string (e.g. Cricket > Bats > Tape Ball)
  function getCategoryPath(catId) {
    if (!catId) return 'Uncategorized';
    const path = [];
    let curr = rawCollections.find(c => c.id === catId);
    while (curr) {
      path.unshift(curr.name);
      curr = rawCollections.find(c => c.id === curr.parent_id);
    }
    return path.join(' > ') || 'Uncategorized';
  }

  // Populate Collections Dropdown
  function populateCollectionFilter() {
    colFilter.innerHTML = '<option value="">All Collections</option>';
    rawCollections.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = getCategoryPath(c.id);
      colFilter.appendChild(opt);
    });
  }

  // Filter & Sort Logic
  function getFilteredProducts() {
    let list = [...rawProducts];

    // Search query
    const q = searchInput.value.toLowerCase().trim();
    if (q) {
      list = list.filter(p => {
        return (p.name && p.name.toLowerCase().includes(q)) ||
               (p.slug && p.slug.toLowerCase().includes(q));
      });
    }

    // Collection filter
    const colId = colFilter.value;
    if (colId) {
      list = list.filter(p => p.collection_id === colId);
    }

    // Stock level filter
    const stockVal = stockFilter.value;
    if (stockVal === 'in') {
      list = list.filter(p => (p.stock || 0) > 5);
    } else if (stockVal === 'low') {
      list = list.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 5);
    } else if (stockVal === 'out') {
      list = list.filter(p => (p.stock || 0) <= 0);
    }

    // Status filter
    const statusVal = statusFilter.value;
    if (statusVal === 'active') {
      list = list.filter(p => p.is_active === true);
    } else if (statusVal === 'hidden') {
      list = list.filter(p => p.is_active === false);
    } else if (statusVal === 'featured') {
      list = list.filter(p => p.is_featured === true);
    }

    // Sort
    list.sort((a, b) => {
      let valA = a[sortCol];
      let valB = b[sortCol];

      if (sortCol === 'price' || sortCol === 'stock') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      } else {
        valA = (valA || '').toString().toLowerCase();
        valB = (valB || '').toString().toLowerCase();
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

    return list;
  }

  // Render Table & Pagination
  function render() {
    const filtered = getFilteredProducts();
    const totalPages = Math.ceil(filtered.length / pageSize) || 1;
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * pageSize;
    const pageItems = filtered.slice(start, start + pageSize);

    if (pageItems.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align: center; padding: 48px; color: #9ca3af;">
            <i data-lucide="package-search" style="width: 32px; height: 32px; margin: 0 auto 8px; display: block; opacity: 0.6;"></i>
            No products match the selected criteria.
          </td>
        </tr>
      `;
      paginationEl.innerHTML = '';
      if (window.lucide) lucide.createIcons();
      return;
    }

    tbody.innerHTML = pageItems.map(p => {
      const isSelected = selectedIds.has(p.id);
      const imgVal = (p.product_images && p.product_images[0]) ? p.product_images[0].url : '1593766788306-28561086694e';
      const thumbSrc = (typeof img === 'function') ? img(imgVal, 80) : (imgVal.startsWith('http') ? imgVal : `https://images.unsplash.com/photo-${imgVal}?w=80&q=80`);

      const colPath = getCategoryPath(p.collection_id);

      const stock = Number(p.stock) || 0;
      let stockPill = '';
      if (stock === 0) {
        stockPill = `<span style="font-size:11px; font-weight:700; color:#dc2626; background:#fee2e2; padding:2px 8px; border-radius:12px;">Out of Stock</span>`;
      } else if (stock <= 5) {
        stockPill = `<span style="font-size:11px; font-weight:700; color:#dc2626; background:#fef2f2; padding:2px 8px; border-radius:12px;">${stock} (Low)</span>`;
      }

      return `
        <tr data-id="${p.id}" class="${isSelected ? 'selected' : ''}">
          <td>
            <input type="checkbox" class="row-checkbox" data-id="${p.id}" ${isSelected ? 'checked' : ''} style="cursor: pointer;">
          </td>
          <td>
            <img src="${thumbSrc}" alt="${p.name}" style="width: 44px; height: 44px; border-radius: 8px; object-fit: cover; border: 1px solid var(--border);">
          </td>
          <td>
            <a href="product-edit.html?id=${p.id}" style="font-weight: 600; color: var(--heading); display: block;" title="Edit product">
              ${p.name}
            </a>
            <span style="font-size: 11px; color: #9ca3af; font-family: monospace;">${p.slug}</span>
            ${p.tag ? `<span style="font-size: 10.5px; background: #fff3ee; color: var(--primary); padding: 1px 6px; border-radius: 10px; margin-left: 6px; font-weight: 600;">${p.tag}</span>` : ''}
          </td>
          <td style="font-size: 12.5px; color: #4b5563;">
            ${colPath}
          </td>
          <td style="text-align: right; white-space: nowrap;">
            <div style="display: flex; align-items: center; justify-content: flex-end; gap: 4px;">
              <span style="font-size: 12px; color: #9ca3af;">Rs.</span>
              <input type="number" class="inline-edit-input inline-price" data-id="${p.id}" value="${p.price}" min="0" step="50" title="Click to edit price directly">
            </div>
            ${p.compare_at_price ? `<div style="font-size: 11px; color: #9ca3af; text-decoration: line-through;">Rs. ${Number(p.compare_at_price).toLocaleString()}</div>` : ''}
          </td>
          <td style="text-align: center; white-space: nowrap;">
            <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
              <input type="number" class="inline-edit-input inline-stock" data-id="${p.id}" value="${stock}" min="0" style="width: 60px; text-align: center;" title="Click to edit stock count directly">
            </div>
            <div style="margin-top: 2px;">${stockPill}</div>
          </td>
          <td style="text-align: center;">
            <span class="status-badge ${p.is_active ? 'status-badge--delivered' : 'status-badge--cancelled'}" style="cursor: pointer;" onclick="toggleStatus('${p.id}', ${!p.is_active})" title="Click to toggle visibility">
              ${p.is_active ? 'Active' : 'Hidden'}
            </span>
          </td>
          <td style="text-align: center;">
            <button type="button" class="star-btn ${p.is_featured ? 'active' : ''}" onclick="toggleFeatured('${p.id}', ${!p.is_featured})" title="${p.is_featured ? 'Remove from Featured' : 'Mark as Featured'}">
              <i data-lucide="star" style="width: 16px; height: 16px; ${p.is_featured ? 'fill: #f59e0b; color: #f59e0b;' : 'color: #cbd5e1;'}"></i>
            </button>
          </td>
          <td style="text-align: right; white-space: nowrap;">
            <div style="display: flex; align-items: center; justify-content: flex-end; gap: 4px;">
              <a href="product-edit.html?id=${p.id}" class="btn btn--icon btn--xs" title="Edit Product">
                <i data-lucide="edit-3" style="width: 14px; height: 14px;"></i>
              </a>
              <button type="button" class="btn btn--icon btn--xs" onclick="duplicateProduct('${p.id}')" title="Duplicate Product">
                <i data-lucide="copy" style="width: 14px; height: 14px;"></i>
              </button>
              <button type="button" class="btn btn--icon btn--xs" style="color: #ef4444;" onclick="deleteProduct('${p.id}')" title="Delete Product">
                <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Pagination Controls
    paginationEl.innerHTML = `
      <span>Showing ${filtered.length === 0 ? 0 : start + 1} to ${Math.min(start + pageSize, filtered.length)} of ${filtered.length} products</span>
      <div class="admin-pagination__pages">
        <button class="admin-pagination__btn" ${currentPage === 1 ? 'disabled' : ''} data-p="${currentPage - 1}">
          <i data-lucide="chevron-left" style="width: 14px; height: 14px;"></i>
        </button>
        ${Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
          .map(p => `
            <button class="admin-pagination__btn ${p === currentPage ? 'active' : ''}" data-p="${p}">${p}</button>
          `).join('')}
        <button class="admin-pagination__btn" ${currentPage === totalPages ? 'disabled' : ''} data-p="${currentPage + 1}">
          <i data-lucide="chevron-right" style="width: 14px; height: 14px;"></i>
        </button>
      </div>
    `;

    // Bind page buttons
    paginationEl.querySelectorAll('[data-p]').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = parseInt(btn.dataset.p, 10);
        if (p >= 1 && p <= totalPages) {
          currentPage = p;
          render();
        }
      });
    });

    bindRowEvents();
    updateBulkToolbar();
    if (window.lucide) lucide.createIcons();
  }

  // Row events: Checkbox & Inline editing
  function bindRowEvents() {
    // Individual checkbox
    tbody.querySelectorAll('.row-checkbox').forEach(cb => {
      cb.addEventListener('change', () => {
        const id = cb.dataset.id;
        if (cb.checked) {
          selectedIds.add(id);
        } else {
          selectedIds.delete(id);
        }
        updateBulkToolbar();
      });
    });

    // Inline Price Edit
    tbody.querySelectorAll('.inline-price').forEach(input => {
      input.addEventListener('change', async () => {
        const id = input.dataset.id;
        const newPrice = Math.max(0, parseInt(input.value, 10) || 0);
        try {
          const { error } = await sb.from('products').update({ price: newPrice }).eq('id', id);
          if (error) throw error;
          const prod = rawProducts.find(p => p.id === id);
          if (prod) prod.price = newPrice;
          admin.toast(`Price updated to Rs. ${newPrice.toLocaleString()}`);
        } catch (err) {
          admin.toast('Failed to update price.', 'error');
        }
      });
    });

    // Inline Stock Edit
    tbody.querySelectorAll('.inline-stock').forEach(input => {
      input.addEventListener('change', async () => {
        const id = input.dataset.id;
        const newStock = Math.max(0, parseInt(input.value, 10) || 0);
        try {
          const { error } = await sb.from('products').update({ stock: newStock }).eq('id', id);
          if (error) throw error;
          const prod = rawProducts.find(p => p.id === id);
          if (prod) prod.stock = newStock;
          render();
          admin.toast(`Stock updated to ${newStock} units`);
        } catch (err) {
          admin.toast('Failed to update stock.', 'error');
        }
      });
    });
  }

  // Select All Checkbox
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('change', () => {
      const filtered = getFilteredProducts();
      const start = (currentPage - 1) * pageSize;
      const pageItems = filtered.slice(start, start + pageSize);

      if (selectAllCheckbox.checked) {
        pageItems.forEach(p => selectedIds.add(p.id));
      } else {
        pageItems.forEach(p => selectedIds.delete(p.id));
      }
      render();
    });
  }

  // Update Bulk Toolbar visibility
  function updateBulkToolbar() {
    if (selectedIds.size > 0) {
      bulkToolbar.classList.add('active');
      selectedCountEl.textContent = selectedIds.size;
    } else {
      bulkToolbar.classList.remove('active');
      if (selectAllCheckbox) selectAllCheckbox.checked = false;
    }
  }

  // Bulk Actions
  if (bulkShowBtn) {
    bulkShowBtn.addEventListener('click', async () => {
      if (selectedIds.size === 0) return;
      const ids = Array.from(selectedIds);
      try {
        const { error } = await sb.from('products').update({ is_active: true }).in('id', ids);
        if (error) throw error;
        rawProducts.forEach(p => { if (selectedIds.has(p.id)) p.is_active = true; });
        admin.toast(`${ids.length} products set to Visible.`);
        selectedIds.clear();
        render();
      } catch (e) {
        admin.toast('Bulk update failed.', 'error');
      }
    });
  }

  if (bulkHideBtn) {
    bulkHideBtn.addEventListener('click', async () => {
      if (selectedIds.size === 0) return;
      const ids = Array.from(selectedIds);
      try {
        const { error } = await sb.from('products').update({ is_active: false }).in('id', ids);
        if (error) throw error;
        rawProducts.forEach(p => { if (selectedIds.has(p.id)) p.is_active = false; });
        admin.toast(`${ids.length} products hidden.`);
        selectedIds.clear();
        render();
      } catch (e) {
        admin.toast('Bulk update failed.', 'error');
      }
    });
  }

  if (bulkDeleteBtn) {
    bulkDeleteBtn.addEventListener('click', async () => {
      if (selectedIds.size === 0) return;
      const ids = Array.from(selectedIds);
      const confirmed = await admin.confirm(
        'Delete Selected Products',
        `Are you sure you want to delete ${ids.length} products? This will also remove their images and variants.`,
        'Delete All Selected'
      );
      if (!confirmed) return;

      try {
        const { error } = await sb.from('products').delete().in('id', ids);
        if (error) throw error;
        rawProducts = rawProducts.filter(p => !selectedIds.has(p.id));
        selectedIds.clear();
        admin.toast('Products deleted.');
        render();
      } catch (e) {
        admin.toast('Bulk delete failed: ' + e.message, 'error');
      }
    });
  }

  // Toggle Single Product Visibility
  window.toggleStatus = async function (id, newActive) {
    try {
      const { error } = await sb.from('products').update({ is_active: newActive }).eq('id', id);
      if (error) throw error;
      const prod = rawProducts.find(p => p.id === id);
      if (prod) prod.is_active = newActive;
      render();
      admin.toast(`Product is now ${newActive ? 'Active' : 'Hidden'}.`);
    } catch (e) {
      admin.toast('Failed to change status.', 'error');
    }
  };

  // Toggle Featured Star
  window.toggleFeatured = async function (id, newFeatured) {
    try {
      const { error } = await sb.from('products').update({ is_featured: newFeatured }).eq('id', id);
      if (error) throw error;
      const prod = rawProducts.find(p => p.id === id);
      if (prod) prod.is_featured = newFeatured;
      render();
      admin.toast(`Product ${newFeatured ? 'marked as Featured' : 'removed from Featured'}.`);
    } catch (e) {
      admin.toast('Failed to update featured status.', 'error');
    }
  };

  // Delete Single Product
  window.deleteProduct = async function (id) {
    const prod = rawProducts.find(p => p.id === id);
    if (!prod) return;

    const confirmed = await admin.confirm(
      'Delete Product',
      `Are you sure you want to delete "${prod.name}"? This action cannot be undone.`,
      'Delete Product'
    );
    if (!confirmed) return;

    try {
      const { error } = await sb.from('products').delete().eq('id', id);
      if (error) throw error;
      rawProducts = rawProducts.filter(p => p.id !== id);
      selectedIds.delete(id);
      admin.toast(`"${prod.name}" deleted successfully.`);
      render();
    } catch (e) {
      admin.toast('Could not delete product: ' + e.message, 'error');
    }
  };

  // Duplicate Product
  window.duplicateProduct = async function (id) {
    try {
      // 1. Fetch full product with images and variants
      const { data: orig, error: origErr } = await sb
        .from('products')
        .select('*, product_images(*), product_variants(*)')
        .eq('id', id)
        .single();

      if (origErr || !orig) throw origErr || new Error('Product not found');

      const newName = `Copy of ${orig.name}`;
      const newSlug = `${orig.slug}-copy-${Date.now().toString().slice(-4)}`;

      // 2. Insert copy
      const { data: newProd, error: insertErr } = await sb
        .from('products')
        .insert({
          collection_id: orig.collection_id,
          name: newName,
          slug: newSlug,
          description: orig.description,
          price: orig.price,
          compare_at_price: orig.compare_at_price,
          tag: orig.tag,
          stock: orig.stock,
          is_active: false, // create as hidden draft
          is_featured: false
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      // 3. Copy Images
      if (orig.product_images && orig.product_images.length) {
        const imgCopies = orig.product_images.map(img => ({
          product_id: newProd.id,
          url: img.url,
          sort_order: img.sort_order
        }));
        await sb.from('product_images').insert(imgCopies);
      }

      // 4. Copy Variants
      if (orig.product_variants && orig.product_variants.length) {
        const varCopies = orig.product_variants.map(v => ({
          product_id: newProd.id,
          label: v.label,
          value: v.value,
          price_override: v.price_override,
          stock: v.stock
        }));
        await sb.from('product_variants').insert(varCopies);
      }

      admin.toast(`Duplicated as "${newName}".`);
      await loadData();

    } catch (err) {
      console.error('Duplicate error:', err);
      admin.toast('Failed to duplicate: ' + err.message, 'error');
    }
  };

  // Sorting columns click
  document.querySelectorAll('th.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.sort;
      if (sortCol === col) {
        sortAsc = !sortAsc;
      } else {
        sortCol = col;
        sortAsc = true;
      }
      render();
    });
  });

  // Filters Event Listeners
  searchInput.addEventListener('input', () => { currentPage = 1; render(); });
  colFilter.addEventListener('change', () => { currentPage = 1; render(); });
  stockFilter.addEventListener('change', () => { currentPage = 1; render(); });
  statusFilter.addEventListener('change', () => { currentPage = 1; render(); });

  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
      searchInput.value = '';
      colFilter.value = '';
      stockFilter.value = '';
      statusFilter.value = '';
      currentPage = 1;
      render();
    });
  }

  // Load initial data
  loadData();
});
