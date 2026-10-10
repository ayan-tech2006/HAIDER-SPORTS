/**
 * Customer Reviews Moderation Script for Haider Sports Admin
 * Handles moderation workflows: approving, unapproving, deleting, bulk actions,
 * star rating filtering, and product associations.
 */

let allReviews = [];
let activeTab = 'pending';
let searchQuery = '';
let selectedProduct = 'all';
let selectedRating = 'all';
let selectedIds = new Set();
let currentPage = 1;
const pageSize = 20;

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Initialize layout & auth guard
  await admin.initLayout('reviews', 'Customer Reviews');

  // 2. Initialize Event Listeners
  initEventListeners();

  // 3. Load Reviews
  await loadReviews();
});

/* ==========================================================================
   Load Reviews & Counts
   ========================================================================== */
async function loadReviews() {
  const tbody = document.getElementById('reviewsTableBody');
  tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 40px; color: #64748b;"><i data-lucide="loader-2" class="spin-slow" style="width: 22px; height: 22px; margin: 0 auto 8px; display: block;"></i> Loading customer reviews...</td></tr>`;
  if (window.lucide) lucide.createIcons();

  try {
    const { data, error } = await supabaseClient
      .from('reviews')
      .select(`
        id,
        product_id,
        name,
        rating,
        comment,
        is_approved,
        created_at,
        products ( id, name, slug, product_images ( url ) )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    allReviews = data || [];
    selectedIds.clear();
    updateBulkButtons();

    // Update Counts & Badges
    updateReviewCounts();

    // Populate Product Filter Dropdown
    populateProductFilter();

    // Render Table
    renderReviewsTable();

  } catch (err) {
    console.error('Error loading reviews:', err);
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 40px; color: #ef4444;"><i data-lucide="alert-triangle" style="width: 22px; height: 22px; margin: 0 auto 8px; display: block;"></i> Error loading reviews: ${err.message}</td></tr>`;
    if (window.lucide) lucide.createIcons();
  }
}

function updateReviewCounts() {
  const pendingCount = allReviews.filter(r => !r.is_approved).length;
  const approvedCount = allReviews.filter(r => r.is_approved).length;
  const totalCount = allReviews.length;

  document.getElementById('countPendingReviews').textContent = pendingCount;
  document.getElementById('countApprovedReviews').textContent = approvedCount;
  document.getElementById('countAllReviews').textContent = totalCount;

  // Update sidebar badge if present
  const sidebarBadge = document.getElementById('badgeReviews');
  if (sidebarBadge) {
    sidebarBadge.textContent = pendingCount;
    sidebarBadge.style.display = pendingCount > 0 ? 'inline-block' : 'none';
  }
}

function populateProductFilter() {
  const select = document.getElementById('reviewProductFilter');
  const currentVal = select.value;

  const productMap = new Map();
  allReviews.forEach(r => {
    if (r.products && r.products.id) {
      productMap.set(r.products.id, r.products.name);
    }
  });

  select.innerHTML = '<option value="all">All Products</option>';
  productMap.forEach((name, id) => {
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = name;
    select.appendChild(opt);
  });

  if (productMap.has(currentVal)) {
    select.value = currentVal;
  }
}

/* ==========================================================================
   Filter, Search & Render
   ========================================================================== */
function getFilteredReviews() {
  const q = searchQuery.toLowerCase().trim();

  return allReviews.filter(r => {
    // 1. Tab filter
    if (activeTab === 'pending' && r.is_approved) return false;
    if (activeTab === 'approved' && !r.is_approved) return false;

    // 2. Product filter
    if (selectedProduct !== 'all' && r.product_id !== selectedProduct) return false;

    // 3. Rating filter
    if (selectedRating !== 'all' && Number(r.rating) !== Number(selectedRating)) return false;

    // 4. Search query filter
    if (q) {
      const matchName = (r.name || '').toLowerCase().includes(q);
      const matchComment = (r.comment || '').toLowerCase().includes(q);
      const matchProd = r.products ? r.products.name.toLowerCase().includes(q) : false;
      if (!matchName && !matchComment && !matchProd) return false;
    }

    return true;
  });
}

function renderReviewsTable() {
  const filtered = getFilteredReviews();
  const tbody = document.getElementById('reviewsTableBody');
  const infoEl = document.getElementById('reviewPaginationInfo');
  const btnsEl = document.getElementById('reviewPaginationBtns');

  const total = filtered.length;

  if (total === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 48px 16px; color: #64748b;">
          <i data-lucide="message-square" style="width: 36px; height: 36px; margin: 0 auto 8px; display: block; opacity: 0.5;"></i>
          <div style="font-size: 15px; font-weight: 600; color: var(--heading);">No reviews found</div>
          <div style="font-size: 13px; color: #94a3b8; margin-top: 4px;">There are no reviews matching the selected filter criteria.</div>
        </td>
      </tr>
    `;
    infoEl.textContent = 'Showing 0 reviews';
    btnsEl.innerHTML = '';
    if (window.lucide) lucide.createIcons();
    return;
  }

  const totalPages = Math.ceil(total / pageSize);
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, total);
  const pagedList = filtered.slice(startIdx, endIdx);

  tbody.innerHTML = pagedList.map(r => {
    const isChecked = selectedIds.has(r.id);
    const prod = r.products || { name: 'Unknown Product', image_url: '', slug: '' };
    const dateFormatted = new Date(r.created_at).toLocaleDateString('en-PK', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    // Stars
    let starsHtml = '';
    for (let i = 1; i <= 5; i++) {
      starsHtml += `<i data-lucide="star" style="width: 13px; height: 13px; display: inline-block; vertical-align: middle; ${i <= r.rating ? 'fill: #f59e0b; color: #f59e0b;' : 'color: #cbd5e1;'}"></i>`;
    }

    return `
      <tr>
        <td style="text-align: center;">
          <input type="checkbox" class="review-checkbox" data-id="${r.id}" ${isChecked ? 'checked' : ''} onchange="toggleSelectReview('${r.id}', this.checked)">
        </td>
        <td>
          <div style="display: flex; align-items: center; gap: 10px;">
            <img src="${img(prod.product_images?.[0]?.url, 80)}" 
                 alt="${admin.escapeHtml(prod.name)}" 
                 style="width: 38px; height: 38px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border);"
                 onerror="this.src='https://placehold.co/40x40?text=Error'">
            <div>
              <div style="font-weight: 700; color: var(--heading); font-size: 13px; line-height: 1.3;">
                ${admin.escapeHtml(prod.name)}
              </div>
              ${prod.slug ? `<a href="../product.html?slug=${prod.slug}" target="_blank" style="font-size: 11px; color: var(--primary); text-decoration: none;">View on site &rarr;</a>` : ''}
            </div>
          </div>
        </td>
        <td>
          <div style="font-weight: 600; color: var(--heading); font-size: 13.5px;">${admin.escapeHtml(r.name || 'Anonymous')}</div>
        </td>
        <td>
          <div style="display: flex; gap: 2px; align-items: center;">${starsHtml}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${r.rating} / 5 Stars</div>
        </td>
        <td>
          <div style="font-size: 13px; color: #334155; line-height: 1.4; max-width: 380px;">
            "${admin.escapeHtml(r.comment || '')}"
          </div>
        </td>
        <td>
          <span style="font-size: 12px; color: #64748b;">${dateFormatted}</span>
        </td>
        <td>
          <span class="status-badge ${r.is_approved ? 'status-badge--delivered' : 'status-badge--pending'}" style="font-size: 11px;">
            ${r.is_approved ? 'Approved' : 'Pending'}
          </span>
        </td>
        <td style="text-align: right;">
          <div style="display: inline-flex; gap: 4px;">
            ${!r.is_approved ? `
              <button type="button" class="btn btn--outline btn--xs" style="color: #059669; border-color: #a7f3d0; display: inline-flex; align-items: center; gap: 4px;" onclick="setReviewApproved('${r.id}', true)" title="Approve Review">
                <i data-lucide="check" style="width: 12px; height: 12px;"></i> Approve
              </button>
            ` : `
              <button type="button" class="btn btn--outline btn--xs" style="color: #d97706; border-color: #fde68a; display: inline-flex; align-items: center; gap: 4px;" onclick="setReviewApproved('${r.id}', false)" title="Unapprove Review">
                <i data-lucide="rotate-ccw" style="width: 12px; height: 12px;"></i> Unapprove
              </button>
            `}
            <button type="button" class="btn btn--outline btn--xs" style="color: #ef4444; border-color: #fca5a5;" onclick="deleteReview('${r.id}')" title="Delete Review">
              <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  infoEl.textContent = `Showing ${startIdx + 1} to ${endIdx} of ${total} reviews`;
  renderPagination(totalPages);
  if (window.lucide) lucide.createIcons();
}

function renderPagination(totalPages) {
  const container = document.getElementById('reviewPaginationBtns');
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = `
    <button class="btn btn--outline btn--xs" ${currentPage === 1 ? 'disabled' : ''} onclick="changeReviewPage(${currentPage - 1})">
      <i data-lucide="chevron-left" style="width: 12px; height: 12px;"></i>
    </button>
  `;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
      html += `
        <button class="btn ${i === currentPage ? 'btn--primary' : 'btn--outline'} btn--xs" onclick="changeReviewPage(${i})">
          ${i}
        </button>
      `;
    } else if (i === currentPage - 3 || i === currentPage + 3) {
      html += `<span style="padding: 0 4px; color: #94a3b8;">...</span>`;
    }
  }

  html += `
    <button class="btn btn--outline btn--xs" ${currentPage === totalPages ? 'disabled' : ''} onclick="changeReviewPage(${currentPage + 1})">
      <i data-lucide="chevron-right" style="width: 12px; height: 12px;"></i>
    </button>
  `;

  container.innerHTML = html;
  if (window.lucide) lucide.createIcons();
}

window.changeReviewPage = function(p) {
  currentPage = p;
  renderReviewsTable();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

/* ==========================================================================
   Selection & Bulk Actions
   ========================================================================== */
window.toggleSelectReview = function(id, isChecked) {
  if (isChecked) selectedIds.add(id);
  else selectedIds.delete(id);
  updateBulkButtons();
};

function updateBulkButtons() {
  const approveBtn = document.getElementById('bulkApproveBtn');
  const deleteBtn = document.getElementById('bulkDeleteBtn');
  const count = selectedIds.size;

  approveBtn.disabled = count === 0;
  deleteBtn.disabled = count === 0;

  approveBtn.innerHTML = `<i data-lucide="check-check" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle; margin-right: 4px;"></i> Bulk Approve ${count > 0 ? `(${count})` : ''}`;
  deleteBtn.innerHTML = `<i data-lucide="trash-2" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle; margin-right: 4px;"></i> Bulk Delete ${count > 0 ? `(${count})` : ''}`;
  if (window.lucide) lucide.createIcons();
}

/* ==========================================================================
   Single & Bulk Operations
   ========================================================================== */
window.setReviewApproved = async function(id, approved) {
  try {
    const { error } = await supabaseClient
      .from('reviews')
      .update({ is_approved: approved })
      .eq('id', id);

    if (error) throw error;
    admin.toast(approved ? 'Review approved for public display!' : 'Review unapproved', 'success');
    await loadReviews();
  } catch (err) {
    admin.toast('Failed to update review: ' + err.message, 'error');
  }
};

window.deleteReview = async function(id) {
  const confirmed = await admin.confirm('Are you sure you want to permanently delete this customer review?');
  if (!confirmed) return;

  try {
    const { error } = await supabaseClient
      .from('reviews')
      .delete()
      .eq('id', id);

    if (error) throw error;
    admin.toast('Review deleted', 'success');
    await loadReviews();
  } catch (err) {
    admin.toast('Failed to delete review: ' + err.message, 'error');
  }
};

/* ==========================================================================
   Event Listeners
   ========================================================================== */
function initEventListeners() {
  // Tabs
  const tabBtns = document.querySelectorAll('#reviewTabsNav .review-tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeTab = btn.dataset.tab;
      currentPage = 1;
      renderReviewsTable();
    });
  });

  // Search
  document.getElementById('reviewSearchInput').addEventListener('input', (e) => {
    searchQuery = e.target.value;
    currentPage = 1;
    renderReviewsTable();
  });

  // Product Filter
  document.getElementById('reviewProductFilter').addEventListener('change', (e) => {
    selectedProduct = e.target.value;
    currentPage = 1;
    renderReviewsTable();
  });

  // Rating Filter
  document.getElementById('reviewRatingFilter').addEventListener('change', (e) => {
    selectedRating = e.target.value;
    currentPage = 1;
    renderReviewsTable();
  });

  // Refresh
  document.getElementById('refreshReviewsBtn').addEventListener('click', async () => {
    await loadReviews();
    admin.toast('Reviews refreshed', 'info');
  });

  // Select All Checkbox
  document.getElementById('selectAllReviews').addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    const filtered = getFilteredReviews();
    filtered.forEach(r => {
      if (isChecked) selectedIds.add(r.id);
      else selectedIds.delete(r.id);
    });
    renderReviewsTable();
    updateBulkButtons();
  });

  // Bulk Approve
  document.getElementById('bulkApproveBtn').addEventListener('click', async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    try {
      const { error } = await supabaseClient
        .from('reviews')
        .update({ is_approved: true })
        .in('id', ids);

      if (error) throw error;
      admin.toast(`Successfully approved ${ids.length} reviews!`, 'success');
      await loadReviews();
    } catch (err) {
      admin.toast('Bulk approval failed: ' + err.message, 'error');
    }
  });

  // Bulk Delete
  document.getElementById('bulkDeleteBtn').addEventListener('click', async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    const confirmed = await admin.confirm(`Permanently delete ${ids.length} selected review(s)?`);
    if (!confirmed) return;

    try {
      const { error } = await supabaseClient
        .from('reviews')
        .delete()
        .in('id', ids);

      if (error) throw error;
      admin.toast(`Deleted ${ids.length} reviews`, 'success');
      await loadReviews();
    } catch (err) {
      admin.toast('Bulk delete failed: ' + err.message, 'error');
    }
  });
}
