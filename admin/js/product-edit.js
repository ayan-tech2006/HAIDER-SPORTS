/**
 * Product Add / Edit Logic for Haider Sports Admin
 * Handles product metadata, leaf category validation, rich-text description,
 * multi-image upload & reordering, and variant generation.
 */

let currentImages = []; // Array of strings (image URLs)
let hasManuallyEditedSlug = false;

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Initialize layout & auth guard
  await admin.initLayout('products', 'Product Editor');

  const urlParams = new URLSearchParams(window.location.search);
  const prodId = urlParams.get('id');

  // 2. Setup Rich Text Toolbar
  initRichTextEditor();

  // 3. Setup Slug Auto-generator & Pricing Calculator
  initFormHelpers();

  // 4. Setup Image Management (Upload, Reorder, Remove)
  initImageManager();

  // 5. Setup Variant Management
  initVariantManager();

  // 6. Load Categories (only leaf categories can hold products)
  await loadCategoriesDropdown();

  // 7. Load Product Data if in Edit Mode
  if (prodId) {
    document.getElementById('editProdId').value = prodId;
    document.getElementById('editPageHeading').textContent = 'Edit Product';
    document.title = 'Edit Product - Haider Sports Admin';
    hasManuallyEditedSlug = true;
    await loadProductData(prodId);
  }

  // 8. Handle Form Submission
  document.getElementById('productEditForm').addEventListener('submit', handleFormSubmit);
});

/* ==========================================================================
   Categories Loader & Leaf Node Enforcement
   ========================================================================== */
async function loadCategoriesDropdown(selectedId = null) {
  const select = document.getElementById('prodCollection');
  select.innerHTML = '<option value="">-- Loading categories... --</option>';

  const { data: collections, error } = await supabaseClient
    .from('collections')
    .select('id, name, slug, parent_id, sort_order')
    .order('sort_order', { ascending: true });

  if (error || !collections) {
    select.innerHTML = '<option value="">Failed to load categories</option>';
    return;
  }

  // Identify non-leaf IDs (categories that are parents of other categories)
  const parentIdSet = new Set();
  collections.forEach(c => {
    if (c.parent_id) parentIdSet.add(c.parent_id);
  });

  // Build tree hierarchy map for display breadcrumbs
  const colMap = new Map();
  collections.forEach(c => colMap.set(c.id, c));

  function getBreadcrumb(c) {
    const parts = [c.name];
    let curr = c;
    while (curr.parent_id && colMap.has(curr.parent_id)) {
      curr = colMap.get(curr.parent_id);
      parts.unshift(curr.name);
    }
    return parts.join(' > ');
  }

  // Sort display alphabetically or by hierarchy
  const items = collections.map(c => ({
    id: c.id,
    name: c.name,
    breadcrumb: getBreadcrumb(c),
    isLeaf: !parentIdSet.has(c.id)
  }));

  items.sort((a, b) => a.breadcrumb.localeCompare(b.breadcrumb));

  select.innerHTML = '<option value="">-- Select Leaf Category --</option>';

  items.forEach(item => {
    const opt = document.createElement('option');
    opt.value = item.id;
    if (item.isLeaf) {
      opt.textContent = `📁 ${item.breadcrumb}`;
    } else {
      opt.textContent = `📂 ${item.breadcrumb} (Parent - cannot assign)`;
      opt.disabled = true;
    }

    if (selectedId && selectedId === item.id) {
      opt.selected = true;
    }
    select.appendChild(opt);
  });
}

/* ==========================================================================
   Rich Text Editor
   ========================================================================== */
function initRichTextEditor() {
  const toolbar = document.querySelector('.rich-editor-toolbar');
  const editor = document.getElementById('prodDescEditor');

  if (!toolbar || !editor) return;

  toolbar.addEventListener('click', (e) => {
    const btn = e.target.closest('.rich-btn');
    if (!btn) return;
    e.preventDefault();

    const cmd = btn.dataset.cmd;
    if (cmd === 'createLink') {
      const url = prompt('Enter URL (e.g. https://example.com):');
      if (url) document.execCommand('createLink', false, url);
    } else {
      document.execCommand(cmd, false, null);
    }
    editor.focus();
  });
}

/* ==========================================================================
   Form Helpers: Slug, Pricing Discount Hints
   ========================================================================== */
function initFormHelpers() {
  const nameInput = document.getElementById('prodName');
  const slugInput = document.getElementById('prodSlug');
  const priceInput = document.getElementById('prodPrice');
  const compareInput = document.getElementById('prodComparePrice');
  const hintEl = document.getElementById('calcDiscountHint');

  // Slug auto-generation
  nameInput.addEventListener('input', () => {
    if (!hasManuallyEditedSlug) {
      slugInput.value = admin.slugify(nameInput.value);
    }
  });

  slugInput.addEventListener('input', () => {
    hasManuallyEditedSlug = true;
  });

  // Calculate discount tag hint
  function updateDiscountHint() {
    const regular = parseFloat(priceInput.value) || 0;
    const compare = parseFloat(compareInput.value) || 0;

    if (compare > regular && regular > 0) {
      const diff = compare - regular;
      const pct = Math.round((diff / compare) * 100);
      hintEl.textContent = `Calculated discount: ${pct}% OFF (Rs. ${diff.toLocaleString()} saved)`;
      hintEl.style.display = 'block';

      // Auto-suggest tag if empty
      const tagInput = document.getElementById('prodTag');
      if (!tagInput.value.trim()) {
        tagInput.placeholder = `-${pct}%`;
      }
    } else {
      hintEl.style.display = 'none';
    }
  }

  priceInput.addEventListener('input', updateDiscountHint);
  compareInput.addEventListener('input', updateDiscountHint);
}

/* ==========================================================================
   Image Manager (Upload, Reorder, Delete)
   ========================================================================== */
function initImageManager() {
  const dropZone = document.getElementById('dropZoneUploader');
  const directDropInput = document.getElementById('directDropInput');
  const multiFileInput = document.getElementById('multiImageFileInput');
  const manualUrlInput = document.getElementById('manualImgUrlInput');
  const addManualBtn = document.getElementById('addManualImgBtn');

  // Handle files
  async function handleFiles(fileList) {
    const files = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    if (!files.length) return;

    admin.toast(`Uploading ${files.length} image(s)...`, 'info');

    for (const file of files) {
      const url = await admin.uploadImage(file, 'products');
      if (url) {
        currentImages.push(url);
      }
    }

    renderImagesGrid();
    admin.toast('Images added successfully!', 'success');
  }

  if (directDropInput) {
    directDropInput.addEventListener('change', (e) => {
      handleFiles(e.target.files);
      directDropInput.value = '';
    });
  }

  if (multiFileInput) {
    multiFileInput.addEventListener('change', (e) => {
      handleFiles(e.target.files);
      multiFileInput.value = '';
    });
  }

  // Drag and drop events
  if (dropZone) {
    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--primary)';
        dropZone.style.background = 'rgba(241, 90, 36, 0.04)';
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '';
        dropZone.style.background = '';
      });
    });

    dropZone.addEventListener('drop', (e) => {
      if (e.dataTransfer && e.dataTransfer.files) {
        handleFiles(e.dataTransfer.files);
      }
    });
  }

  // Add Manual URL
  if (addManualBtn && manualUrlInput) {
    addManualBtn.addEventListener('click', () => {
      const url = manualUrlInput.value.trim();
      if (!url) return;
      currentImages.push(url);
      manualUrlInput.value = '';
      renderImagesGrid();
      admin.toast('Image URL added', 'success');
    });
  }
}

function renderImagesGrid() {
  const grid = document.getElementById('imagesGrid');
  if (!grid) return;

  if (currentImages.length === 0) {
    grid.innerHTML = '<div style="grid-column: 1/-1; font-size: 13px; color: #9ca3af; text-align: center; padding: 12px;">No images added yet.</div>';
    return;
  }

  grid.innerHTML = currentImages.map((url, idx) => {
    const isMain = idx === 0;
    return `
      <div class="img-card-item ${isMain ? 'is-main' : ''}" data-index="${idx}">
        ${isMain ? '<div class="img-main-badge">Cover</div>' : ''}
        <img src="${url}" alt="Product Image ${idx + 1}" onerror="this.src='https://placehold.co/300x300/1e293b/fff?text=No+Preview'">
        <div class="img-actions-overlay">
          ${idx > 0 ? `<button type="button" class="img-action-btn" onclick="moveImage(${idx}, -1)" title="Move Left"><i data-lucide="arrow-left" style="width: 12px; height: 12px;"></i></button>` : ''}
          ${!isMain ? `<button type="button" class="img-action-btn" onclick="setPrimaryImage(${idx})" title="Set as Cover"><i data-lucide="star" style="width: 12px; height: 12px;"></i></button>` : ''}
          ${idx < currentImages.length - 1 ? `<button type="button" class="img-action-btn" onclick="moveImage(${idx}, 1)" title="Move Right"><i data-lucide="arrow-right" style="width: 12px; height: 12px;"></i></button>` : ''}
          <button type="button" class="img-action-btn" onclick="removeImage(${idx})" title="Remove"><i data-lucide="trash-2" style="width: 12px; height: 12px;"></i></button>
        </div>
      </div>
    `;
  }).join('');
  if (window.lucide) lucide.createIcons();
}

window.moveImage = function(index, dir) {
  const targetIndex = index + dir;
  if (targetIndex < 0 || targetIndex >= currentImages.length) return;
  const temp = currentImages[index];
  currentImages[index] = currentImages[targetIndex];
  currentImages[targetIndex] = temp;
  renderImagesGrid();
};

window.setPrimaryImage = function(index) {
  if (index <= 0 || index >= currentImages.length) return;
  const [selected] = currentImages.splice(index, 1);
  currentImages.unshift(selected);
  renderImagesGrid();
};

window.removeImage = function(index) {
  currentImages.splice(index, 1);
  renderImagesGrid();
};

/* ==========================================================================
   Variant Manager (Bat Weights, Shoe Sizes, Clothing, Packs)
   ========================================================================== */
function initVariantManager() {
  const container = document.getElementById('variantsContainer');
  const addBtn = document.getElementById('addVariantRowBtn');
  const batWeightsBtn = document.getElementById('presetWeightBtn');
  const shoeSizesBtn = document.getElementById('presetSizeBtn');

  if (addBtn) {
    addBtn.addEventListener('click', () => {
      addVariantRow();
    });
  }

  if (batWeightsBtn) {
    batWeightsBtn.addEventListener('click', () => {
      const weights = ['1050g', '1100g', '1150g', '1200g'];
      weights.forEach(w => addVariantRow('Weight', w));
    });
  }

  if (shoeSizesBtn) {
    shoeSizesBtn.addEventListener('click', () => {
      const sizes = ['UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11'];
      sizes.forEach(s => addVariantRow('Size', s));
    });
  }
}

function addVariantRow(label = 'Weight', value = '', priceOverride = '', stock = '10') {
  const container = document.getElementById('variantsContainer');
  if (!container) return;

  const row = document.createElement('div');
  row.className = 'variant-row';
  row.innerHTML = `
    <input type="text" class="form-control form-control--sm var-label" placeholder="Attribute (e.g. Weight)" value="${label}" required>
    <input type="text" class="form-control form-control--sm var-value" placeholder="Option (e.g. 1150g)" value="${value}" required>
    <input type="number" class="form-control form-control--sm var-price" placeholder="Price (optional)" value="${priceOverride}" min="0" step="50">
    <input type="number" class="form-control form-control--sm var-stock" placeholder="Stock" value="${stock}" min="0">
    <button type="button" class="btn btn--outline btn--xs" style="color: #ef4444; border-color: #fca5a5; display: inline-flex; align-items: center; justify-content: center; height: 32px;" onclick="this.closest('.variant-row').remove()" title="Delete variant">
      <i data-lucide="trash-2" style="width: 13px; height: 13px;"></i>
    </button>
  `;
  container.appendChild(row);
  if (window.lucide) lucide.createIcons();
}

function getVariantsData() {
  const rows = document.querySelectorAll('#variantsContainer .variant-row');
  const list = [];
  rows.forEach(r => {
    const label = r.querySelector('.var-label').value.trim();
    const value = r.querySelector('.var-value').value.trim();
    const priceStr = r.querySelector('.var-price').value.trim();
    const stockStr = r.querySelector('.var-stock').value.trim();

    if (label && value) {
      list.push({
        label,
        value,
        price_override: priceStr ? parseInt(priceStr, 10) : null,
        stock: stockStr ? parseInt(stockStr, 10) : 0
      });
    }
  });
  return list;
}

/* ==========================================================================
   Load Existing Product (Edit Mode)
   ========================================================================== */
async function loadProductData(prodId) {
  try {
    // 1. Fetch Product
    const { data: prod, error } = await supabaseClient
      .from('products')
      .select('*')
      .eq('id', prodId)
      .single();

    if (error || !prod) {
      admin.toast('Product not found or failed to load', 'error');
      return;
    }

    // Populate Fields
    document.getElementById('prodName').value = prod.name || '';
    document.getElementById('prodSlug').value = prod.slug || '';
    document.getElementById('prodDescEditor').innerHTML = prod.description || '';
    document.getElementById('prodPrice').value = prod.price || '';
    document.getElementById('prodComparePrice').value = prod.compare_at_price || '';
    document.getElementById('prodTag').value = prod.tag || '';
    document.getElementById('prodStock').value = prod.stock ?? 15;
    document.getElementById('prodIsActive').checked = !!prod.is_active;
    document.getElementById('prodIsFeatured').checked = !!prod.is_featured;

    // Trigger discount calculation
    const compareInput = document.getElementById('prodComparePrice');
    compareInput.dispatchEvent(new Event('input'));

    // Select category
    if (prod.collection_id) {
      await loadCategoriesDropdown(prod.collection_id);
    }

    // 2. Fetch Images
    const { data: images } = await supabaseClient
      .from('product_images')
      .select('url, sort_order')
      .eq('product_id', prodId)
      .order('sort_order', { ascending: true });

    currentImages = [];
    if (images && images.length > 0) {
      currentImages = images.map(img => img.url);
    } else if (prod.image_url) {
      currentImages = [prod.image_url];
    }
    renderImagesGrid();

    // 3. Fetch Variants
    const { data: variants } = await supabaseClient
      .from('product_variants')
      .select('label, value, price_override, stock')
      .eq('product_id', prodId)
      .order('created_at', { ascending: true });

    const container = document.getElementById('variantsContainer');
    container.innerHTML = '';
    if (variants && variants.length > 0) {
      variants.forEach(v => {
        addVariantRow(v.label, v.value, v.price_override || '', v.stock ?? 10);
      });
    }

  } catch (err) {
    console.error('Error loading product data:', err);
    admin.toast('Error loading product: ' + err.message, 'error');
  }
}

/* ==========================================================================
   Form Submission (Create / Update Product + Images + Variants)
   ========================================================================== */
async function handleFormSubmit(e) {
  e.preventDefault();

  const prodId = document.getElementById('editProdId').value;
  const isEdit = !!prodId;

  const name = document.getElementById('prodName').value.trim();
  const slug = document.getElementById('prodSlug').value.trim();
  const collectionId = document.getElementById('prodCollection').value;
  const description = document.getElementById('prodDescEditor').innerHTML.trim();
  const price = parseInt(document.getElementById('prodPrice').value, 10);
  const compareAtPriceStr = document.getElementById('prodComparePrice').value.trim();
  const compareAtPrice = compareAtPriceStr ? parseInt(compareAtPriceStr, 10) : null;
  const tag = document.getElementById('prodTag').value.trim() || null;
  const stock = parseInt(document.getElementById('prodStock').value, 10);
  const isActive = document.getElementById('prodIsActive').checked;
  const isFeatured = document.getElementById('prodIsFeatured').checked;

  if (!name || !slug) {
    admin.toast('Please provide a product title and slug', 'warning');
    return;
  }
  if (!collectionId) {
    admin.toast('Please select a leaf category', 'warning');
    return;
  }
  if (isNaN(price) || price < 0) {
    admin.toast('Please enter a valid price', 'warning');
    return;
  }
  if (isNaN(stock) || stock < 0) {
    admin.toast('Please enter a valid stock quantity', 'warning');
    return;
  }

  const saveBtn = document.getElementById('saveProductBtn');
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<i data-lucide="loader-2" class="spin-slow" style="width: 15px; height: 15px;"></i> Saving...';
  if (window.lucide) lucide.createIcons();

  try {
    const productPayload = {
      name,
      slug,
      collection_id: collectionId,
      description,
      price,
      compare_at_price: compareAtPrice,
      tag,
      stock,
      is_active: isActive,
      is_featured: isFeatured
    };

    let targetId = prodId;

    if (isEdit) {
      // Update existing product
      const { error: updateErr } = await supabaseClient
        .from('products')
        .update(productPayload)
        .eq('id', prodId);

      if (updateErr) throw updateErr;
    } else {
      // Insert new product
      const { data: newProd, error: insertErr } = await supabaseClient
        .from('products')
        .insert(productPayload)
        .select('id')
        .single();

      if (insertErr) throw insertErr;
      targetId = newProd.id;
    }

    // Sync Product Images
    await supabaseClient
      .from('product_images')
      .delete()
      .eq('product_id', targetId);

    if (currentImages.length > 0) {
      const imagesPayload = currentImages.map((url, idx) => ({
        product_id: targetId,
        url,
        sort_order: idx
      }));

      const { error: imgErr } = await supabaseClient
        .from('product_images')
        .insert(imagesPayload);

      if (imgErr) console.warn('Warning inserting images:', imgErr);
    }

    // Sync Product Variants
    await supabaseClient
      .from('product_variants')
      .delete()
      .eq('product_id', targetId);

    const variantsData = getVariantsData();
    if (variantsData.length > 0) {
      const variantsPayload = variantsData.map(v => ({
        product_id: targetId,
        label: v.label,
        value: v.value,
        price_override: v.price_override,
        stock: v.stock
      }));

      const { error: varErr } = await supabaseClient
        .from('product_variants')
        .insert(variantsPayload);

      if (varErr) console.warn('Warning inserting variants:', varErr);
    }

    admin.toast(isEdit ? 'Product updated successfully!' : 'Product created successfully!', 'success');

    // Redirect back to products list
    setTimeout(() => {
      window.location.href = 'products.html';
    }, 1000);

  } catch (err) {
    console.error('Save product error:', err);
    admin.toast('Error saving product: ' + (err.message || 'Check database constraints'), 'error');
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<i data-lucide="check" style="width: 15px; height: 15px;"></i> Save Product';
    if (window.lucide) lucide.createIcons();
  }
}
