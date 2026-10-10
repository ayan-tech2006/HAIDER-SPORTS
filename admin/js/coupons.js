/**
 * Discount Coupons Manager Script for Haider Sports Admin
 * Handles coupon creation, percentage/fixed discounts, expiration dates,
 * real-time status calculation, and safe deletion protections.
 */

let allCoupons = [];
let searchQuery = '';
let selectedType = 'all';
let selectedStatus = 'all';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Initialize layout & auth guard
  await admin.initLayout('coupons', 'Discount Coupons');

  // 2. Initialize Event Listeners
  initEventListeners();

  // 3. Load Coupons Data
  await loadCoupons();
});

/* ==========================================================================
   Load Coupons & Compute Statuses
   ========================================================================== */
async function loadCoupons() {
  const tbody = document.getElementById('couponsTableBody');
  tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 40px; color: #64748b;"><i data-lucide="loader-2" class="spin-slow" style="width: 22px; height: 22px; margin: 0 auto 8px; display: block;"></i> Loading coupons...</td></tr>`;
  if (window.lucide) lucide.createIcons();

  try {
    const { data, error } = await supabaseClient
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    allCoupons = (data || []).map(c => {
      c.computedStatus = getComputedCouponStatus(c);
      return c;
    });

    renderCouponsTable();

  } catch (err) {
    console.error('Error loading coupons:', err);
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 40px; color: #ef4444;"><i data-lucide="alert-triangle" style="width: 22px; height: 22px; margin: 0 auto 8px; display: block;"></i> Error loading coupons: ${err.message}</td></tr>`;
    if (window.lucide) lucide.createIcons();
  }
}

function getComputedCouponStatus(coupon) {
  if (!coupon.is_active) return 'disabled';

  const now = new Date();

  if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
    return 'exhausted';
  }

  if (coupon.starts_at) {
    const start = new Date(coupon.starts_at);
    if (start > now) return 'scheduled';
  }

  if (coupon.ends_at) {
    const end = new Date(coupon.ends_at);
    if (end < now) return 'expired';
  }

  return 'active';
}

/* ==========================================================================
   Render Table & Filtering
   ========================================================================== */
function getFilteredCoupons() {
  const q = searchQuery.toLowerCase().trim();

  return allCoupons.filter(c => {
    // Search
    if (q && !c.code.toLowerCase().includes(q)) return false;

    // Type
    if (selectedType !== 'all' && c.type !== selectedType) return false;

    // Status
    if (selectedStatus !== 'all' && c.computedStatus !== selectedStatus) return false;

    return true;
  });
}

function renderCouponsTable() {
  const filtered = getFilteredCoupons();
  const tbody = document.getElementById('couponsTableBody');

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 48px 16px; color: #64748b;">
          <i data-lucide="ticket-percent" style="width: 36px; height: 36px; margin: 0 auto 8px; display: block; opacity: 0.5;"></i>
          <div style="font-size: 15px; font-weight: 600; color: var(--heading);">No coupons found</div>
          <div style="font-size: 13px; color: #94a3b8; margin-top: 4px;">Click "Create Coupon" to launch your first promotional discount.</div>
        </td>
      </tr>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  tbody.innerHTML = filtered.map(c => {
    // Discount label
    const discountText = c.type === 'percent' ? `${c.value}% OFF` : `Rs. ${c.value.toLocaleString()} OFF`;

    // Validity range
    let validityHtml = 'No expiration';
    if (c.starts_at || c.ends_at) {
      const s = c.starts_at ? new Date(c.starts_at).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' }) : 'Anytime';
      const e = c.ends_at ? new Date(c.ends_at).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No end date';
      validityHtml = `${s} &rarr; ${e}`;
    }

    // Status Badge
    let statusBadge = '';
    switch (c.computedStatus) {
      case 'active':
        statusBadge = `<span class="status-badge status-badge--delivered">Active</span>`;
        break;
      case 'scheduled':
        statusBadge = `<span class="status-badge status-badge--pending">Scheduled</span>`;
        break;
      case 'expired':
        statusBadge = `<span class="status-badge status-badge--cancelled">Expired</span>`;
        break;
      case 'exhausted':
        statusBadge = `<span class="status-badge status-badge--cancelled">Max Uses Reached</span>`;
        break;
      case 'disabled':
        statusBadge = `<span class="status-badge status-badge--cancelled">Disabled</span>`;
        break;
    }

    return `
      <tr>
        <td>
          <div class="coupon-code-badge">
            <i data-lucide="tag" style="width: 13px; height: 13px;"></i> ${c.code}
          </div>
        </td>
        <td>
          <strong style="color: var(--heading); font-size: 14px;">${discountText}</strong>
          <div style="font-size: 11px; color: #64748b;">${c.type === 'percent' ? 'Percentage discount' : 'Flat PKR reduction'}</div>
        </td>
        <td>
          <span style="font-size: 13px;">${c.min_order > 0 ? `Rs. ${c.min_order.toLocaleString()}` : '<em style="color:#94a3b8;">None</em>'}</span>
        </td>
        <td>
          <span style="font-weight: 700; color: var(--heading); font-size: 13.5px;">${c.used_count}</span>
          <span style="color: #64748b; font-size: 12px;"> / ${c.max_uses ? c.max_uses : '&infin;'}</span>
        </td>
        <td>
          <span style="font-size: 12.5px; color: #475569;">${validityHtml}</span>
        </td>
        <td>
          ${statusBadge}
        </td>
        <td style="text-align: right;">
          <div style="display: inline-flex; gap: 4px;">
            <button type="button" class="btn btn--outline btn--xs" onclick="toggleCouponActive('${c.id}', ${!c.is_active})" title="${c.is_active ? 'Disable Coupon' : 'Enable Coupon'}">
              <i data-lucide="${c.is_active ? 'pause' : 'play'}" style="width: 12px; height: 12px;"></i>
            </button>
            <button type="button" class="btn btn--outline btn--xs" onclick="editCoupon('${c.id}')" title="Edit Coupon">
              <i data-lucide="edit-3" style="width: 12px; height: 12px;"></i>
            </button>
            <button type="button" class="btn btn--outline btn--xs" style="color: #ef4444; border-color: #fca5a5;" onclick="deleteCoupon('${c.id}', ${c.used_count})" title="Delete Coupon">
              <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
  if (window.lucide) lucide.createIcons();
}

/* ==========================================================================
   Coupon Actions (Add / Edit / Toggle / Delete)
   ========================================================================== */
function initEventListeners() {
  // Search
  document.getElementById('couponSearchInput').addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderCouponsTable();
  });

  // Type filter
  document.getElementById('couponTypeFilter').addEventListener('change', (e) => {
    selectedType = e.target.value;
    renderCouponsTable();
  });

  // Status filter
  document.getElementById('couponStatusFilter').addEventListener('change', (e) => {
    selectedStatus = e.target.value;
    renderCouponsTable();
  });

  // Refresh
  document.getElementById('refreshCouponsBtn').addEventListener('click', async () => {
    await loadCoupons();
    admin.toast('Coupons refreshed', 'info');
  });

  // Open Create Modal
  document.getElementById('openAddCouponBtn').addEventListener('click', () => {
    document.getElementById('couponModalTitle').textContent = 'Create Discount Coupon';
    document.getElementById('couponId').value = '';
    document.getElementById('couponForm').reset();
    document.getElementById('couponMinOrder').value = '0';
    document.getElementById('couponIsActive').checked = true;
    updateValHint();
    admin.modal.open('couponModal');
  });

  // Type change helper
  const typeSelect = document.getElementById('couponType');
  typeSelect.addEventListener('change', updateValHint);

  function updateValHint() {
    const t = typeSelect.value;
    const hint = document.getElementById('valHint');
    const valInput = document.getElementById('couponValue');
    if (t === 'percent') {
      hint.textContent = 'Enter percentage (1 - 100)%';
      valInput.placeholder = '15';
      valInput.max = '100';
    } else {
      hint.textContent = 'Enter flat discount in PKR';
      valInput.placeholder = '500';
      valInput.removeAttribute('max');
    }
  }

  // Generate Code Button
  document.getElementById('generateCodeBtn').addEventListener('click', () => {
    const prefixes = ['HAIDER', 'CRICKET', 'CHAMP', 'POWER', 'WINNER', 'SUPER'];
    const randPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randNum = Math.floor(Math.random() * 80) + 10;
    document.getElementById('couponCode').value = `${randPrefix}${randNum}`;
  });

  // Form Submit
  document.getElementById('couponForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const couponId = document.getElementById('couponId').value;
    const code = document.getElementById('couponCode').value.trim().toUpperCase().replace(/\s+/g, '');
    const type = document.getElementById('couponType').value;
    const value = parseInt(document.getElementById('couponValue').value, 10);
    const minOrderStr = document.getElementById('couponMinOrder').value.trim();
    const minOrder = minOrderStr ? parseInt(minOrderStr, 10) : 0;
    const maxUsesStr = document.getElementById('couponMaxUses').value.trim();
    const maxUses = maxUsesStr ? parseInt(maxUsesStr, 10) : null;
    const startsAt = document.getElementById('couponStartsAt').value || null;
    const endsAt = document.getElementById('couponEndsAt').value || null;
    const isActive = document.getElementById('couponIsActive').checked;

    // Validation
    if (!code) {
      admin.toast('Please provide a coupon code', 'warning');
      return;
    }
    if (type === 'percent' && (value <= 0 || value > 100)) {
      admin.toast('Percentage discount must be between 1 and 100', 'warning');
      return;
    }
    if (type === 'fixed' && value <= 0) {
      admin.toast('Fixed discount amount must be greater than 0', 'warning');
      return;
    }
    if (startsAt && endsAt && new Date(endsAt) < new Date(startsAt)) {
      admin.toast('Expiry date cannot be earlier than start date', 'warning');
      return;
    }

    const saveBtn = document.getElementById('saveCouponBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    const payload = {
      code,
      type,
      value,
      min_order: minOrder,
      max_uses: maxUses,
      starts_at: startsAt ? new Date(startsAt).toISOString() : null,
      ends_at: endsAt ? new Date(endsAt).toISOString() : null,
      is_active: isActive
    };

    try {
      if (couponId) {
        const { error } = await supabaseClient.from('coupons').update(payload).eq('id', couponId);
        if (error) throw error;
        admin.toast('Coupon updated successfully!', 'success');
      } else {
        const { error } = await supabaseClient.from('coupons').insert(payload);
        if (error) throw error;
        admin.toast(`Coupon ${code} created successfully!`, 'success');
      }

      admin.modal.close('couponModal');
      await loadCoupons();

    } catch (err) {
      console.error('Error saving coupon:', err);
      admin.toast('Error saving coupon: ' + (err.message || 'Check for duplicate code'), 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Coupon';
    }
  });
}

window.editCoupon = function(id) {
  const coupon = allCoupons.find(c => c.id === id);
  if (!coupon) return;

  document.getElementById('couponModalTitle').textContent = 'Edit Coupon';
  document.getElementById('couponId').value = coupon.id;
  document.getElementById('couponCode').value = coupon.code;
  document.getElementById('couponType').value = coupon.type;
  document.getElementById('couponValue').value = coupon.value;
  document.getElementById('couponMinOrder').value = coupon.min_order || 0;
  document.getElementById('couponMaxUses').value = coupon.max_uses || '';
  document.getElementById('couponStartsAt').value = coupon.starts_at ? coupon.starts_at.slice(0, 10) : '';
  document.getElementById('couponEndsAt').value = coupon.ends_at ? coupon.ends_at.slice(0, 10) : '';
  document.getElementById('couponIsActive').checked = !!coupon.is_active;

  const typeSelect = document.getElementById('couponType');
  typeSelect.dispatchEvent(new Event('change'));

  admin.modal.open('couponModal');
};

window.toggleCouponActive = async function(id, newStatus) {
  try {
    const { error } = await supabaseClient
      .from('coupons')
      .update({ is_active: newStatus })
      .eq('id', id);

    if (error) throw error;
    admin.toast(newStatus ? 'Coupon activated' : 'Coupon disabled', 'info');
    await loadCoupons();
  } catch (err) {
    admin.toast('Failed to toggle coupon: ' + err.message, 'error');
  }
};

window.deleteCoupon = async function(id, usedCount) {
  // If the coupon has been used in previous customer orders, enforce prompt rule:
  // "delete (only if never used; otherwise just disable)"
  if (usedCount > 0) {
    const shouldDisable = await admin.confirm(
      `This coupon has already been redeemed in ${usedCount} customer orders.\nTo preserve historical sales records, used coupons cannot be deleted.\n\nWould you like to DISABLE it instead?`
    );
    if (shouldDisable) {
      await toggleCouponActive(id, false);
    }
    return;
  }

  const confirmed = await admin.confirm('Are you sure you want to delete this coupon?');
  if (!confirmed) return;

  try {
    const { error } = await supabaseClient.from('coupons').delete().eq('id', id);
    if (error) throw error;
    admin.toast('Coupon deleted', 'success');
    await loadCoupons();
  } catch (err) {
    admin.toast('Failed to delete coupon: ' + err.message, 'error');
  }
};
