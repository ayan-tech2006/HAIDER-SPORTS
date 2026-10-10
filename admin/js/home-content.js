/**
 * Home Page Content Manager Script for Haider Sports Admin
 * Handles dynamic Hero Carousels, Category Slider cards, Flash Deal Countdown timers,
 * and Catalog Featured Products curation.
 */

let heroSlides = [];
let catCards = [];
let offerData = null;
let offerRecordId = null;
let allCatalogProducts = [];

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Initialize layout & auth guard
  await admin.initLayout('home-content', 'Home Page Content');

  // 2. Initialize Tab Switching
  initTabs();

  // 3. Initialize File Upload Listeners
  initUploaders();

  // 4. Load all sections
  await loadAllHomeContent();

  // 5. Initialize Modals and Forms
  initModalsAndForms();
});

/* ==========================================================================
   Tab Navigation
   ========================================================================== */
function initTabs() {
  const tabBtns = document.querySelectorAll('.content-nav-btn');
  const panes = document.querySelectorAll('.tab-pane');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      panes.forEach(p => p.style.display = 'none');

      btn.classList.add('active');
      const targetPane = document.getElementById(btn.dataset.tab);
      if (targetPane) targetPane.style.display = 'block';
    });
  });

  document.getElementById('refreshContentBtn').addEventListener('click', async () => {
    await loadAllHomeContent();
    admin.toast('Home content refreshed', 'info');
  });
}

/* ==========================================================================
   Load All Content from Supabase
   ========================================================================== */
async function loadAllHomeContent() {
  try {
    // 1. Fetch home_content rows
    const { data: rows, error: hcErr } = await supabaseClient
      .from('home_content')
      .select('*')
      .order('sort_order', { ascending: true });

    if (hcErr) throw hcErr;

    heroSlides = (rows || []).filter(r => r.section === 'hero');
    catCards = (rows || []).filter(r => r.section === 'category_slider');
    const offerRow = (rows || []).find(r => r.section === 'offer');

    if (offerRow) {
      offerRecordId = offerRow.id;
      offerData = offerRow.data || {};
      offerData.is_active = offerRow.is_active;
    } else {
      offerRecordId = null;
      offerData = null;
    }

    // 2. Fetch catalog products for Featured manager
    const { data: prods } = await supabaseClient
      .from('products')
      .select('id, name, slug, price, stock, is_featured, is_active, product_images(url)')
      .order('is_featured', { ascending: false });

    allCatalogProducts = prods || [];

    // Render components
    renderHeroTable();
    renderCatCardsTable();
    populateOfferForm();
    renderFeaturedProducts();

  } catch (err) {
    console.error('Error loading home content:', err);
    admin.toast('Error loading home content: ' + err.message, 'error');
  }
}

/* ==========================================================================
   Hero Slides Management
   ========================================================================== */
function renderHeroTable() {
  const tbody = document.getElementById('heroTableBody');

  if (heroSlides.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 30px; color: #64748b;">
          No hero slides added yet. Click "Add New Slide" to create the first banner.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = heroSlides.map((slide, idx) => {
    const d = slide.data || {};
    return `
      <tr>
        <td style="font-weight: 700; color: #94a3b8; text-align: center;">
          ${idx + 1}
        </td>
        <td>
          <img src="${d.image_url || 'https://placehold.co/120x60?text=No+Image'}" 
               alt="${admin.escapeHtml(d.title || '')}" 
               style="width: 100px; height: 50px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border);"
               onerror="this.src='https://placehold.co/120x60?text=Error'">
        </td>
        <td>
          <div style="font-weight: 700; color: var(--heading); font-size: 14px;">${admin.escapeHtml(d.title || 'Untitled')}</div>
          <div style="font-size: 12px; color: #64748b;">${admin.escapeHtml(d.subtitle || '')}</div>
        </td>
        <td>
          <div style="font-size: 13px; font-weight: 600;">${admin.escapeHtml(d.button_text || 'Shop Now')}</div>
          <div style="font-size: 11px; color: #64748b;"><code>${admin.escapeHtml(d.button_link || '#')}</code></div>
        </td>
        <td>
          <span class="status-badge ${slide.is_active ? 'status-badge--delivered' : 'status-badge--cancelled'}">
            ${slide.is_active ? 'Active' : 'Hidden'}
          </span>
        </td>
        <td style="text-align: right;">
          <div style="display: inline-flex; gap: 4px;">
            <button type="button" class="btn btn--outline btn--xs" onclick="reorderHeroSlide(${idx}, -1)" ${idx === 0 ? 'disabled' : ''} title="Move Up">
              <i data-lucide="arrow-up" style="width: 12px; height: 12px;"></i>
            </button>
            <button type="button" class="btn btn--outline btn--xs" onclick="reorderHeroSlide(${idx}, 1)" ${idx === heroSlides.length - 1 ? 'disabled' : ''} title="Move Down">
              <i data-lucide="arrow-down" style="width: 12px; height: 12px;"></i>
            </button>
            <button type="button" class="btn btn--outline btn--xs" onclick="editHeroSlide('${slide.id}')" title="Edit">
              <i data-lucide="edit-3" style="width: 12px; height: 12px;"></i>
            </button>
            <button type="button" class="btn btn--outline btn--xs" style="color: #ef4444; border-color: #fca5a5;" onclick="deleteHeroSlide('${slide.id}')" title="Delete">
              <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
  if (window.lucide) lucide.createIcons();
}

window.reorderHeroSlide = async function(idx, dir) {
  const targetIdx = idx + dir;
  if (targetIdx < 0 || targetIdx >= heroSlides.length) return;

  const current = heroSlides[idx];
  const target = heroSlides[targetIdx];

  const tempOrder = current.sort_order;
  current.sort_order = target.sort_order;
  target.sort_order = tempOrder;

  await Promise.all([
    supabaseClient.from('home_content').update({ sort_order: current.sort_order }).eq('id', current.id),
    supabaseClient.from('home_content').update({ sort_order: target.sort_order }).eq('id', target.id)
  ]);

  await loadAllHomeContent();
};

window.editHeroSlide = function(id) {
  const slide = heroSlides.find(s => s.id === id);
  if (!slide) return;

  const d = slide.data || {};
  document.getElementById('heroModalTitle').textContent = 'Edit Hero Slide';
  document.getElementById('heroSlideId').value = slide.id;
  document.getElementById('heroTitle').value = d.title || '';
  document.getElementById('heroSubtitle').value = d.subtitle || '';
  document.getElementById('heroImage').value = d.image_url || '';
  document.getElementById('heroBtnText').value = d.button_text || 'Shop Now';
  document.getElementById('heroBtnLink').value = d.button_link || 'shop.html';
  document.getElementById('heroIsActive').checked = !!slide.is_active;

  updateHeroPreviewBox(d.image_url);
  admin.modal.open('heroModal');
};

window.deleteHeroSlide = async function(id) {
  const confirmed = await admin.confirm('Are you sure you want to delete this hero slide banner?');
  if (!confirmed) return;

  const { error } = await supabaseClient.from('home_content').delete().eq('id', id);
  if (error) {
    admin.toast('Failed to delete slide: ' + error.message, 'error');
  } else {
    admin.toast('Slide deleted', 'success');
    await loadAllHomeContent();
  }
};

/* ==========================================================================
   Category Slider Cards Management
   ========================================================================== */
function renderCatCardsTable() {
  const tbody = document.getElementById('catCardTableBody');

  if (catCards.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 30px; color: #64748b;">
          No category slider cards configured yet. Click "Add Category Card" to add one.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = catCards.map((card, idx) => {
    const d = card.data || {};
    const color = d.bg_color || 'orange';

    return `
      <tr>
        <td style="font-weight: 700; color: #94a3b8; text-align: center;">
          ${idx + 1}
        </td>
        <td style="width: 220px;">
          <div class="promo-card-preview promo-card-preview--${color}">
            <div>
              <div style="font-size: 10px; opacity: 0.9; text-transform: uppercase;">${admin.escapeHtml(d.subtitle || 'Shop')}</div>
              <div style="font-size: 13px; font-weight: 800; line-height: 1.2;">${admin.escapeHtml(d.title || 'Category')}</div>
            </div>
            <img src="${d.image_url || 'https://placehold.co/50x50?text=Card'}" onerror="this.src='https://placehold.co/50x50?text=Card'">
          </div>
        </td>
        <td>
          <div style="font-weight: 700; color: var(--heading);">${admin.escapeHtml(d.title || '')}</div>
          <div style="font-size: 12px; color: #64748b;">${admin.escapeHtml(d.subtitle || '')}</div>
        </td>
        <td>
          <span style="font-size: 12px; font-family: monospace; color: #475569;">${admin.escapeHtml(d.link || '#')}</span>
        </td>
        <td>
          <span class="color-pill color-pill--${color}"></span>
          <span style="font-size: 12.5px; text-transform: capitalize; font-weight: 600;">${color}</span>
        </td>
        <td>
          <span class="status-badge ${card.is_active ? 'status-badge--delivered' : 'status-badge--cancelled'}">
            ${card.is_active ? 'Active' : 'Hidden'}
          </span>
        </td>
        <td style="text-align: right;">
          <div style="display: inline-flex; gap: 4px;">
            <button type="button" class="btn btn--outline btn--xs" onclick="reorderCatCard(${idx}, -1)" ${idx === 0 ? 'disabled' : ''} title="Move Up">
              <i data-lucide="arrow-up" style="width: 12px; height: 12px;"></i>
            </button>
            <button type="button" class="btn btn--outline btn--xs" onclick="reorderCatCard(${idx}, 1)" ${idx === catCards.length - 1 ? 'disabled' : ''} title="Move Down">
              <i data-lucide="arrow-down" style="width: 12px; height: 12px;"></i>
            </button>
            <button type="button" class="btn btn--outline btn--xs" onclick="editCatCard('${card.id}')" title="Edit">
              <i data-lucide="edit-3" style="width: 12px; height: 12px;"></i>
            </button>
            <button type="button" class="btn btn--outline btn--xs" style="color: #ef4444; border-color: #fca5a5;" onclick="deleteCatCard('${card.id}')" title="Delete">
              <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
  if (window.lucide) lucide.createIcons();
}

window.reorderCatCard = async function(idx, dir) {
  const targetIdx = idx + dir;
  if (targetIdx < 0 || targetIdx >= catCards.length) return;

  const current = catCards[idx];
  const target = catCards[targetIdx];

  const tempOrder = current.sort_order;
  current.sort_order = target.sort_order;
  target.sort_order = tempOrder;

  await Promise.all([
    supabaseClient.from('home_content').update({ sort_order: current.sort_order }).eq('id', current.id),
    supabaseClient.from('home_content').update({ sort_order: target.sort_order }).eq('id', target.id)
  ]);

  await loadAllHomeContent();
};

window.editCatCard = function(id) {
  const card = catCards.find(c => c.id === id);
  if (!card) return;

  const d = card.data || {};
  document.getElementById('catCardModalTitle').textContent = 'Edit Category Card';
  document.getElementById('catCardId').value = card.id;
  document.getElementById('catCardTitle').value = d.title || '';
  document.getElementById('catCardSubtitle').value = d.subtitle || '';
  document.getElementById('catCardColor').value = d.bg_color || 'orange';
  document.getElementById('catCardImage').value = d.image_url || '';
  document.getElementById('catCardLink').value = d.link || '';
  document.getElementById('catCardIsActive').checked = !!card.is_active;

  updateCatCardPreviewBox(d.image_url);
  admin.modal.open('catCardModal');
};

window.deleteCatCard = async function(id) {
  const confirmed = await admin.confirm('Are you sure you want to delete this category card?');
  if (!confirmed) return;

  const { error } = await supabaseClient.from('home_content').delete().eq('id', id);
  if (error) {
    admin.toast('Failed to delete card: ' + error.message, 'error');
  } else {
    admin.toast('Category card deleted', 'success');
    await loadAllHomeContent();
  }
};

/* ==========================================================================
   Flash Offer Form
   ========================================================================== */
function populateOfferForm() {
  if (!offerData) {
    // Default placeholders
    document.getElementById('offerTitle').value = 'End of Season Cricket Clearance';
    document.getElementById('offerSubtitle').value = 'Flat 30% Off on Selected Kashmir & English Willow Bats';
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    document.getElementById('offerEndTime').value = nextWeek.toISOString().slice(0, 16);
    document.getElementById('offerBtnLink').value = 'shop.html#/cricket/bats';
    document.getElementById('offerImageUrl').value = 'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?w=800';
    document.getElementById('offerIsActive').checked = true;
    updateOfferPreviewBox(document.getElementById('offerImageUrl').value);
    return;
  }

  document.getElementById('offerTitle').value = offerData.title || '';
  document.getElementById('offerSubtitle').value = offerData.subtitle || '';
  if (offerData.end_time) {
    const d = new Date(offerData.end_time);
    document.getElementById('offerEndTime').value = d.toISOString().slice(0, 16);
  }
  document.getElementById('offerBtnLink').value = offerData.button_link || '';
  document.getElementById('offerImageUrl').value = offerData.image_url || '';
  document.getElementById('offerIsActive').checked = offerData.is_active !== false;

  updateOfferPreviewBox(offerData.image_url);
}

/* ==========================================================================
   Featured Products Manager
   ========================================================================== */
function renderFeaturedProducts(filterQuery = '') {
  const tbody = document.getElementById('featuredTableBody');
  const q = filterQuery.toLowerCase().trim();

  const prods = allCatalogProducts.filter(p => {
    if (!q) return true;
    return p.name.toLowerCase().includes(q) || (p.slug || '').toLowerCase().includes(q);
  });

  if (prods.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 24px; color: #64748b;">No products matching "${filterQuery}"</td></tr>`;
    return;
  }

  tbody.innerHTML = prods.map(p => `
    <tr>
      <td>
        <img src="${img(p.product_images?.[0]?.url, 80)}" 
             alt="${admin.escapeHtml(p.name)}" 
             style="width: 44px; height: 44px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border);"
             onerror="this.src='https://placehold.co/60x60?text=Error'">
      </td>
      <td>
        <div style="font-weight: 700; color: var(--heading);">${admin.escapeHtml(p.name)}</div>
        <div style="font-size: 11px; color: #64748b;"><code>${p.slug}</code></div>
      </td>
      <td style="font-weight: 600;">Rs. ${Number(p.price || 0).toLocaleString()}</td>
      <td>
        <span class="badge ${p.stock <= 5 ? 'badge--danger' : 'badge--neutral'}">${p.stock} units</span>
      </td>
      <td style="text-align: center;">
        <label class="form-check" style="display: inline-flex; align-items: center; margin: 0; cursor: pointer;">
          <input type="checkbox" ${p.is_featured ? 'checked' : ''} onchange="toggleFeaturedProduct('${p.id}', this.checked)">
          <span style="font-size: 12px; font-weight: 700; color: ${p.is_featured ? '#d97706' : '#64748b'}; display: inline-flex; align-items: center; gap: 4px; margin-left: 6px;">
            ${p.is_featured ? '<i data-lucide="star" style="width: 13px; height: 13px; fill: #f59e0b; color: #f59e0b;"></i> Featured' : 'Standard'}
          </span>
        </label>
      </td>
      <td style="text-align: right;">
        <a href="product-edit.html?id=${p.id}" class="btn btn--outline btn--xs" style="display: inline-flex; align-items: center; gap: 4px;">
          <i data-lucide="edit-3" style="width: 12px; height: 12px;"></i> Edit
        </a>
      </td>
    </tr>
  `).join('');
  if (window.lucide) lucide.createIcons();
}

window.toggleFeaturedProduct = async function(id, isFeatured) {
  try {
    const { error } = await supabaseClient
      .from('products')
      .update({ is_featured: isFeatured })
      .eq('id', id);

    if (error) throw error;

    const target = allCatalogProducts.find(p => p.id === id);
    if (target) target.is_featured = isFeatured;

    admin.toast(isFeatured ? 'Product added to Home Featured Showcase' : 'Product removed from Featured', 'success');
  } catch (err) {
    admin.toast('Failed to update featured flag: ' + err.message, 'error');
  }
};

/* ==========================================================================
   Modals, Forms & Uploads
   ========================================================================== */
function initModalsAndForms() {
  // Hero Add Button
  document.getElementById('addHeroSlideBtn').addEventListener('click', () => {
    document.getElementById('heroModalTitle').textContent = 'Add Hero Slide';
    document.getElementById('heroSlideId').value = '';
    document.getElementById('heroSlideForm').reset();
    document.getElementById('heroPreviewBox').innerHTML = '';
    document.getElementById('heroBtnText').value = 'Shop Now';
    document.getElementById('heroBtnLink').value = 'shop.html';
    document.getElementById('heroIsActive').checked = true;
    admin.modal.open('heroModal');
  });

  // Hero Form Submit
  document.getElementById('heroSlideForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const slideId = document.getElementById('heroSlideId').value;
    const title = document.getElementById('heroTitle').value.trim();
    const subtitle = document.getElementById('heroSubtitle').value.trim();
    const imageUrl = document.getElementById('heroImage').value.trim();
    const btnText = document.getElementById('heroBtnText').value.trim() || 'Shop Now';
    const btnLink = document.getElementById('heroBtnLink').value.trim() || 'shop.html';
    const isActive = document.getElementById('heroIsActive').checked;

    const payload = {
      section: 'hero',
      data: {
        title,
        subtitle,
        image_url: imageUrl,
        button_text: btnText,
        button_link: btnLink
      },
      is_active: isActive
    };

    const saveBtn = document.getElementById('saveHeroBtn');
    saveBtn.disabled = true;

    try {
      if (slideId) {
        await supabaseClient.from('home_content').update(payload).eq('id', slideId);
      } else {
        payload.sort_order = heroSlides.length + 1;
        await supabaseClient.from('home_content').insert(payload);
      }

      admin.modal.close('heroModal');
      admin.toast('Hero slide saved successfully', 'success');
      await loadAllHomeContent();
    } catch (err) {
      admin.toast('Error saving slide: ' + err.message, 'error');
    } finally {
      saveBtn.disabled = false;
    }
  });

  // Cat Card Add Button
  document.getElementById('addCatCardBtn').addEventListener('click', () => {
    document.getElementById('catCardModalTitle').textContent = 'Add Category Card';
    document.getElementById('catCardId').value = '';
    document.getElementById('catCardForm').reset();
    document.getElementById('catCardPreviewBox').innerHTML = '';
    document.getElementById('catCardColor').value = 'orange';
    document.getElementById('catCardIsActive').checked = true;
    admin.modal.open('catCardModal');
  });

  // Cat Card Form Submit
  document.getElementById('catCardForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const cardId = document.getElementById('catCardId').value;
    const title = document.getElementById('catCardTitle').value.trim();
    const subtitle = document.getElementById('catCardSubtitle').value.trim();
    const color = document.getElementById('catCardColor').value;
    const imageUrl = document.getElementById('catCardImage').value.trim();
    const link = document.getElementById('catCardLink').value.trim() || 'shop.html';
    const isActive = document.getElementById('catCardIsActive').checked;

    const payload = {
      section: 'category_slider',
      data: {
        title,
        subtitle,
        bg_color: color,
        image_url: imageUrl,
        link
      },
      is_active: isActive
    };

    const saveBtn = document.getElementById('saveCatCardBtn');
    saveBtn.disabled = true;

    try {
      if (cardId) {
        await supabaseClient.from('home_content').update(payload).eq('id', cardId);
      } else {
        payload.sort_order = catCards.length + 1;
        await supabaseClient.from('home_content').insert(payload);
      }

      admin.modal.close('catCardModal');
      admin.toast('Category card saved successfully', 'success');
      await loadAllHomeContent();
    } catch (err) {
      admin.toast('Error saving card: ' + err.message, 'error');
    } finally {
      saveBtn.disabled = false;
    }
  });

  // Offer Form Submit
  document.getElementById('offerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('offerTitle').value.trim();
    const subtitle = document.getElementById('offerSubtitle').value.trim();
    const endTime = document.getElementById('offerEndTime').value;
    const btnLink = document.getElementById('offerBtnLink').value.trim();
    const imageUrl = document.getElementById('offerImageUrl').value.trim();
    const isActive = document.getElementById('offerIsActive').checked;

    const payload = {
      section: 'offer',
      data: {
        title,
        subtitle,
        end_time: endTime ? new Date(endTime).toISOString() : null,
        button_link: btnLink,
        image_url: imageUrl
      },
      is_active: isActive
    };

    const btn = document.getElementById('saveOfferBtn');
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader-2" class="spin" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle; margin-right: 4px;"></i> Saving...';
    if (window.lucide) lucide.createIcons();

    try {
      if (offerRecordId) {
        await supabaseClient.from('home_content').update(payload).eq('id', offerRecordId);
      } else {
        await supabaseClient.from('home_content').insert(payload);
      }

      admin.toast('Offer settings updated successfully!', 'success');
      await loadAllHomeContent();
    } catch (err) {
      admin.toast('Failed to save offer: ' + err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="save" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle; margin-right: 4px;"></i> Save Offer Settings';
      if (window.lucide) lucide.createIcons();
    }
  });

  // Search catalog in Featured Tab
  document.getElementById('searchCatalogInput').addEventListener('input', (e) => {
    renderFeaturedProducts(e.target.value);
  });
}

function initUploaders() {
  // Hero Image
  const heroFile = document.getElementById('heroFileInput');
  if (heroFile) {
    heroFile.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      admin.toast('Uploading hero image...', 'info');
      const url = await admin.uploadImage(file, 'images');
      if (url) {
        document.getElementById('heroImage').value = url;
        updateHeroPreviewBox(url);
        admin.toast('Hero image uploaded', 'success');
      }
    });
  }

  // Cat Card Image
  const catFile = document.getElementById('catCardFileInput');
  if (catFile) {
    catFile.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      admin.toast('Uploading category image...', 'info');
      const url = await admin.uploadImage(file, 'images');
      if (url) {
        document.getElementById('catCardImage').value = url;
        updateCatCardPreviewBox(url);
        admin.toast('Category image uploaded', 'success');
      }
    });
  }

  // Offer Image
  const offerFile = document.getElementById('offerFileInput');
  if (offerFile) {
    offerFile.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      admin.toast('Uploading offer image...', 'info');
      const url = await admin.uploadImage(file, 'images');
      if (url) {
        document.getElementById('offerImageUrl').value = url;
        updateOfferPreviewBox(url);
        admin.toast('Offer image uploaded', 'success');
      }
    });
  }
}

function updateHeroPreviewBox(url) {
  const box = document.getElementById('heroPreviewBox');
  if (!url) { box.innerHTML = ''; return; }
  box.innerHTML = `<img src="${url}" style="width: 100%; height: 90px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border);" onerror="this.style.display='none'">`;
}

function updateCatCardPreviewBox(url) {
  const box = document.getElementById('catCardPreviewBox');
  if (!url) { box.innerHTML = ''; return; }
  box.innerHTML = `<img src="${url}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border);" onerror="this.style.display='none'">`;
}

function updateOfferPreviewBox(url) {
  const box = document.getElementById('offerImgPreview');
  if (!url) { box.innerHTML = ''; return; }
  box.innerHTML = `<img src="${url}" style="max-height: 120px; border-radius: 6px; border: 1px solid var(--border);" onerror="this.style.display='none'">`;
}
