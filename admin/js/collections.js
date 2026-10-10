/**
 * HAIDERSPORTS - ADMIN COLLECTIONS MANAGER SCRIPT
 * File: admin/js/collections.js
 * Implements: Nested Tree View, Add/Edit Modal, Leaf Product Restriction Checks,
 *             Sibling Reordering, Safe Delete Guards, Real-time Search
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize layout and auth guard
  await admin.initLayout('collections', 'Collections');

  const sb = window.supabaseClient || (typeof supabase !== 'undefined' && supabase.createClient ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null);

  let rawCollections = [];
  let productCountMap = {}; // collection_id -> count
  let treeData = [];
  let allExpanded = true;

  // Elements
  const treeContainer = document.getElementById('treeContainer');
  const searchInput = document.getElementById('categorySearchInput');
  const toggleAllBtn = document.getElementById('toggleAllTreeBtn');
  const toggleTreeText = document.getElementById('toggleTreeText');
  const newRootBtn = document.getElementById('newRootCategoryBtn');

  // Modal elements
  const collectionModal = admin.modal('collectionModal');
  const collectionForm = document.getElementById('collectionForm');
  const modalTitle = document.getElementById('collectionModalTitle');
  const colIdInput = document.getElementById('colId');
  const colNameInput = document.getElementById('colName');
  const colSlugInput = document.getElementById('colSlug');
  const colParentSelect = document.getElementById('colParent');
  const colImgUrlInput = document.getElementById('colImgUrl');
  const colImgPreview = document.getElementById('colImgPreview');
  const colImgFileInput = document.getElementById('colImgFile');
  const colUploadStatus = document.getElementById('colUploadStatus');
  const colSortOrderInput = document.getElementById('colSortOrder');
  const colIsActiveInput = document.getElementById('colIsActive');
  const saveBtn = document.getElementById('saveCollectionBtn');

  // 1. Fetch collections and product counts from Supabase
  async function loadCollections() {
    if (!sb) return;

    treeContainer.innerHTML = `
      <div style="padding: 48px; text-align: center; color: #9ca3af;">
        <i data-lucide="loader-2" class="spin-slow" style="width: 28px; height: 28px; margin: 0 auto 12px; display: block;"></i>
        Loading category hierarchy...
      </div>
    `;
    if (window.lucide) lucide.createIcons();

    try {
      const [colRes, prodRes] = await Promise.all([
        sb.from('collections').select('*').order('sort_order', { ascending: true }),
        sb.from('products').select('collection_id, id')
      ]);

      if (colRes.error) throw colRes.error;

      rawCollections = colRes.data || [];

      // Calculate product counts per collection
      productCountMap = {};
      (prodRes.data || []).forEach(p => {
        if (p.collection_id) {
          productCountMap[p.collection_id] = (productCountMap[p.collection_id] || 0) + 1;
        }
      });

      // Build hierarchical tree
      treeData = buildCollectionTree(rawCollections);
      renderTree(treeData);
      populateParentDropdown();

    } catch (err) {
      console.error('Error loading collections:', err);
      treeContainer.innerHTML = `
        <div style="padding: 36px; text-align: center; color: #dc2626;">
          <i data-lucide="alert-triangle" style="width: 28px; height: 28px; margin: 0 auto 8px; display: block;"></i>
          Failed to load collections. ${err.message}
        </div>
      `;
      if (window.lucide) lucide.createIcons();
    }
  }

  // Build tree from flat array using parent_id
  function buildCollectionTree(items) {
    const map = {};
    const roots = [];

    items.forEach(item => {
      map[item.id] = { ...item, children: [] };
    });

    items.forEach(item => {
      if (item.parent_id && map[item.parent_id]) {
        map[item.parent_id].children.push(map[item.id]);
      } else {
        roots.push(map[item.id]);
      }
    });

    return roots;
  }

  // Get full category trail path (e.g. "Cricket > Bats > English Willow")
  function getCategoryPath(catId) {
    const path = [];
    let curr = rawCollections.find(c => c.id === catId);
    while (curr) {
      path.unshift(curr.name);
      curr = rawCollections.find(c => c.id === curr.parent_id);
    }
    return path.join(' > ');
  }

  // Get all descendant IDs of a collection
  function getDescendantIds(catId) {
    const ids = [];
    const directChildren = rawCollections.filter(c => c.parent_id === catId);
    directChildren.forEach(child => {
      ids.push(child.id);
      ids.push(...getDescendantIds(child.id));
    });
    return ids;
  }

  // 2. Render Expandable Tree UI
  function renderTree(nodes, parentEl = treeContainer, level = 0) {
    if (level === 0) {
      parentEl.innerHTML = '';
      if (nodes.length === 0) {
        parentEl.innerHTML = `
          <div style="text-align: center; padding: 48px; color: #9ca3af;">
            <i data-lucide="folder-tree" style="width: 36px; height: 36px; margin: 0 auto 12px; display: block; opacity: 0.5;"></i>
            <h4 style="font-weight: 700; color: var(--heading);">No Categories Found</h4>
            <p style="font-size: 13px; margin: 6px 0 16px;">Get started by adding your first product category.</p>
            <button type="button" class="btn btn--primary btn--sm" onclick="openAddModal(null)" style="display: inline-flex; align-items: center; gap: 6px; margin: 0 auto;">
              <i data-lucide="plus" style="width: 14px; height: 14px;"></i> Add Root Category
            </button>
          </div>
        `;
        if (window.lucide) lucide.createIcons();
        return;
      }
    }

    nodes.forEach((node, idx) => {
      const hasChildren = node.children && node.children.length > 0;
      const prodCount = productCountMap[node.id] || 0;
      const hasProducts = prodCount > 0;

      const imgVal = node.image_url || '1593766788306-28561086694e';
      const thumbSrc = (typeof img === 'function') ? img(imgVal, 80) : (imgVal.startsWith('http') ? imgVal : `https://images.unsplash.com/photo-${imgVal}?w=80&q=80`);

      const nodeEl = document.createElement('div');
      nodeEl.className = 'tree-node';
      nodeEl.dataset.id = node.id;
      nodeEl.dataset.name = node.name.toLowerCase();
      nodeEl.dataset.slug = node.slug.toLowerCase();

      nodeEl.innerHTML = `
        <div class="tree-row">
          <button type="button" class="tree-toggle-btn ${hasChildren ? '' : 'empty'} ${allExpanded ? '' : 'collapsed'}" data-toggle-id="${node.id}">
            <i data-lucide="chevron-down" style="width: 14px; height: 14px;"></i>
          </button>

          <img src="${thumbSrc}" class="tree-thumb" alt="${node.name}">

          <div class="tree-info">
            <span class="tree-name">${node.name}</span>
            <span class="tree-slug">${node.slug}</span>
            ${hasProducts ? `
              <span class="tree-count-badge" title="Products assigned to this category">
                <i data-lucide="package" style="width: 12px; height: 12px;"></i> ${prodCount} products
              </span>
            ` : ''}
            <span class="status-badge ${node.is_active ? 'status-badge--delivered' : 'status-badge--cancelled'}">
              ${node.is_active ? 'Visible' : 'Hidden'}
            </span>
          </div>

          <div class="tree-actions">
            ${!hasProducts ? `
              <button type="button" class="btn btn--icon btn--xs" onclick="openAddModal('${node.id}')" title="Add Subcategory">
                <i data-lucide="plus" style="width: 13px; height: 13px;"></i>
              </button>
            ` : `
              <button type="button" class="btn btn--icon btn--xs" style="opacity: 0.4; cursor: not-allowed;" title="Leaf Category: Cannot add subcategories because products are assigned here">
                <i data-lucide="ban" style="width: 13px; height: 13px;"></i>
              </button>
            `}

            <!-- Reorder Sibling Up / Down -->
            <button type="button" class="btn btn--icon btn--xs" onclick="reorderSibling('${node.id}', 'up')" title="Move Up" ${idx === 0 ? 'disabled' : ''}>
              <i data-lucide="arrow-up" style="width: 13px; height: 13px;"></i>
            </button>
            <button type="button" class="btn btn--icon btn--xs" onclick="reorderSibling('${node.id}', 'down')" title="Move Down" ${idx === nodes.length - 1 ? 'disabled' : ''}>
              <i data-lucide="arrow-down" style="width: 13px; height: 13px;"></i>
            </button>

            <!-- Edit Button -->
            <button type="button" class="btn btn--icon btn--xs" onclick="openEditModal('${node.id}')" title="Edit Category">
              <i data-lucide="edit-3" style="width: 13px; height: 13px;"></i>
            </button>

            <!-- Delete Button -->
            <button type="button" class="btn btn--icon btn--xs" style="color: #ef4444;" onclick="handleDeleteCollection('${node.id}')" title="Delete Category">
              <i data-lucide="trash-2" style="width: 13px; height: 13px;"></i>
            </button>
          </div>
        </div>

        ${hasChildren ? `<div class="tree-children ${allExpanded ? '' : 'collapsed'}" id="children-${node.id}"></div>` : ''}
      `;

      parentEl.appendChild(nodeEl);

      // Recursive render for subcategories
      if (hasChildren) {
        const childContainer = nodeEl.querySelector(`#children-${node.id}`);
        renderTree(node.children, childContainer, level + 1);
      }
    });

    if (window.lucide) lucide.createIcons();

    // Bind chevron toggles
    parentEl.querySelectorAll('[data-toggle-id]').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const id = btn.dataset.toggleId;
        const children = document.getElementById(`children-${id}`);
        if (children) {
          const isCollapsed = children.classList.toggle('collapsed');
          btn.classList.toggle('collapsed', isCollapsed);
        }
      };
    });
  }

  // 3. Populate Parent Category dropdown
  function populateParentDropdown(excludeId = null) {
    colParentSelect.innerHTML = '<option value="">-- None (Top-Level Root Category) --</option>';

    const excludedIds = excludeId ? [excludeId, ...getDescendantIds(excludeId)] : [];

    // Sort categories alphabetically or hierarchically
    rawCollections.forEach(cat => {
      if (excludedIds.includes(cat.id)) return;

      const path = getCategoryPath(cat.id);
      const prodCount = productCountMap[cat.id] || 0;
      const opt = document.createElement('option');
      opt.value = cat.id;
      opt.textContent = path + (prodCount > 0 ? ` (${prodCount} products - Cannot have subcategories)` : '');
      if (prodCount > 0) {
        // Disabled per leaf rule constraint
        opt.disabled = true;
      }
      colParentSelect.appendChild(opt);
    });
  }

  // 4. Modal Open Handlers
  window.openAddModal = function (parentId = null) {
    colIdInput.value = '';
    colNameInput.value = '';
    colSlugInput.value = '';
    colImgUrlInput.value = '1593766788306-28561086694e';
    colImgPreview.src = 'https://images.unsplash.com/photo-1593766788306-28561086694e?w=80&q=80';
    colSortOrderInput.value = '0';
    colIsActiveInput.checked = true;

    populateParentDropdown();
    if (parentId) {
      colParentSelect.value = parentId;
      const parentName = rawCollections.find(c => c.id === parentId)?.name;
      modalTitle.textContent = `Add Subcategory under "${parentName}"`;
    } else {
      colParentSelect.value = '';
      modalTitle.textContent = 'Add Root Category';
    }

    collectionModal.open();
    colNameInput.focus();
  };

  window.openEditModal = function (catId) {
    const cat = rawCollections.find(c => c.id === catId);
    if (!cat) return;

    colIdInput.value = cat.id;
    colNameInput.value = cat.name;
    colSlugInput.value = cat.slug;
    colImgUrlInput.value = cat.image_url || '';
    updateImagePreview(cat.image_url);
    colSortOrderInput.value = cat.sort_order || 0;
    colIsActiveInput.checked = cat.is_active !== false;

    // Populate parent dropdown excluding self & descendants
    populateParentDropdown(cat.id);
    colParentSelect.value = cat.parent_id || '';

    modalTitle.textContent = `Edit Category: ${cat.name}`;
    collectionModal.open();
  };

  // Auto slug generation on name input
  colNameInput.addEventListener('input', () => {
    if (!colIdInput.value) { // only auto-slug for new additions
      colSlugInput.value = admin.slugify(colNameInput.value);
    }
  });

  // Image preview updater
  function updateImagePreview(val) {
    if (!val) {
      colImgPreview.src = 'https://images.unsplash.com/photo-1593766788306-28561086694e?w=80&q=80';
      return;
    }
    if (val.startsWith('http')) {
      colImgPreview.src = val;
    } else if (typeof img === 'function') {
      colImgPreview.src = img(val, 80);
    } else {
      colImgPreview.src = `https://images.unsplash.com/photo-${val}?w=80&q=80`;
    }
  }

  colImgUrlInput.addEventListener('input', () => updateImagePreview(colImgUrlInput.value.trim()));

  // Image Upload trigger
  colImgFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    colUploadStatus.textContent = 'Uploading image...';
    colUploadStatus.style.color = 'var(--primary)';

    try {
      const publicUrl = await admin.uploadImage(file, 'collections');
      colImgUrlInput.value = publicUrl;
      updateImagePreview(publicUrl);
      colUploadStatus.textContent = 'Upload complete!';
      colUploadStatus.style.color = '#10b981';
      admin.toast('Image uploaded successfully to Supabase Storage!');
    } catch (err) {
      console.error('Upload error:', err);
      colUploadStatus.textContent = err.message || 'Upload failed.';
      colUploadStatus.style.color = '#ef4444';
      admin.toast(err.message || 'Image upload failed.', 'error');
    }
  });

  // 5. Save Category (Insert or Update)
  collectionForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = colIdInput.value;
    const name = colNameInput.value.trim();
    const slug = admin.slugify(colSlugInput.value.trim() || name);
    const parentId = colParentSelect.value || null;
    const imgUrl = colImgUrlInput.value.trim() || null;
    const sortOrder = parseInt(colSortOrderInput.value, 10) || 0;
    const isActive = colIsActiveInput.checked;

    if (!name || !slug) {
      admin.toast('Category Name and Slug are required.', 'error');
      return;
    }

    // Leaf rule verification: Parent category must not contain products directly!
    if (parentId) {
      const parentProdCount = productCountMap[parentId] || 0;
      if (parentProdCount > 0) {
        admin.toast('Constraint Error: The selected parent category contains products directly. Products must reside in leaf categories only.', 'error');
        return;
      }
    }

    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i data-lucide="loader-2" class="spin" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle; margin-right: 4px;"></i> Saving...';
    if (window.lucide) lucide.createIcons();

    try {
      const payload = {
        name,
        slug,
        parent_id: parentId,
        image_url: imgUrl,
        sort_order: sortOrder,
        is_active: isActive
      };

      if (id) {
        // Update
        const { error } = await sb.from('collections').update(payload).eq('id', id);
        if (error) throw error;
        admin.toast(`Category "${name}" updated successfully.`);
      } else {
        // Insert
        const { error } = await sb.from('collections').insert(payload);
        if (error) throw error;
        admin.toast(`Category "${name}" created successfully.`);
      }

      collectionModal.close();
      await loadCollections();

    } catch (err) {
      console.error('Save error:', err);
      admin.toast(err.message || 'Failed to save category.', 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i data-lucide="check" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle; margin-right: 4px;"></i> Save Category';
      if (window.lucide) lucide.createIcons();
    }
  });

  // 6. Smart Delete Collection (handles empty, product-assigned, and parent categories)
  window.handleDeleteCollection = async function (catId) {
    const cat = rawCollections.find(c => c.id === catId);
    if (!cat) return;

    const delModal = admin.modal('deleteCollectionModal');
    const modalTitle = document.getElementById('delModalTitle');
    const modalBody = document.getElementById('delModalBody');
    const modalFooter = document.getElementById('delModalFooter');

    modalTitle.textContent = `Delete "${cat.name}"`;

    const hasChildren = rawCollections.some(c => c.parent_id === catId);
    const prodCount = productCountMap[catId] || 0;

    // CASE 1: Empty leaf category (No children, no products)
    if (!hasChildren && prodCount === 0) {
      modalBody.innerHTML = `
        <div style="font-size: 14px; color: #374151; margin-bottom: 12px;">
          Are you sure you want to permanently delete category <strong>"${admin.escapeHtml(cat.name)}"</strong>?
        </div>
        <p style="font-size: 13px; color: #6b7280; margin: 0;">
          This category is empty and has no products or subcategories. This action cannot be undone.
        </p>
      `;

      modalFooter.innerHTML = `
        <button type="button" class="btn btn--outline btn--sm" onclick="admin.modal('deleteCollectionModal').close()">Cancel</button>
        <button type="button" class="btn btn--danger btn--sm" id="execDelBtn">
          <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i> Delete Category
        </button>
      `;

      if (window.lucide) lucide.createIcons();
      delModal.open();

      document.getElementById('execDelBtn').onclick = async function () {
        const btn = this;
        btn.disabled = true;
        btn.textContent = 'Deleting...';
        try {
          const { error } = await sb.from('collections').delete().eq('id', catId);
          if (error) throw error;
          admin.toast(`Category "${cat.name}" deleted.`, 'success');
          delModal.close();
          await loadCollections();
        } catch (err) {
          admin.toast(err.message || 'Failed to delete category.', 'error');
          btn.disabled = false;
          btn.textContent = 'Delete Category';
        }
      };
      return;
    }

    // CASE 2: Leaf category with products
    if (!hasChildren && prodCount > 0) {
      const otherLeafCats = rawCollections.filter(c => c.id !== catId && !rawCollections.some(k => k.parent_id === c.id));

      modalBody.innerHTML = `
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px;">
          <div style="font-weight: 700; color: #b91c1c; font-size: 14px; display: flex; align-items: center; gap: 6px;">
            <i data-lucide="alert-triangle" style="width: 16px; height: 16px;"></i>
            Category contains ${prodCount} product(s)
          </div>
          <div style="font-size: 12.5px; color: #991b1b; margin-top: 4px;">
            Products must be either moved to another category or deleted before this category can be removed.
          </div>
        </div>

        <div style="margin-bottom: 16px;">
          <label style="font-size: 13px; font-weight: 700; color: var(--heading); display: block; margin-bottom: 8px;">
            Choose Action:
          </label>

          ${otherLeafCats.length > 0 ? `
            <div style="padding: 12px; border: 1.5px solid #e5e7eb; border-radius: 8px; margin-bottom: 10px; background: #f9fafb;">
              <label style="display: flex; align-items: flex-start; gap: 8px; cursor: pointer; font-size: 13px; font-weight: 600; color: #111827;">
                <input type="radio" name="delProdAction" value="move" checked style="margin-top: 2px;">
                <div>
                  <div>Move ${prodCount} product(s) to another category</div>
                  <div style="font-weight: 400; color: #6b7280; font-size: 12px;">Keep your products safe by reassigning them.</div>
                </div>
              </label>
              <div id="targetCatRow" style="margin-top: 10px; margin-left: 22px;">
                <select id="reassignSelect" class="form-control" style="font-size: 13px; height: 38px;">
                  ${otherLeafCats.map(c => `<option value="${c.id}">${admin.escapeHtml(getCategoryPath(c.id))}</option>`).join('')}
                </select>
              </div>
            </div>
          ` : ''}

          <div style="padding: 12px; border: 1.5px solid #fee2e2; border-radius: 8px; background: #fff5f5;">
            <label style="display: flex; align-items: flex-start; gap: 8px; cursor: pointer; font-size: 13px; font-weight: 600; color: #991b1b;">
              <input type="radio" name="delProdAction" value="delete" ${otherLeafCats.length === 0 ? 'checked' : ''} style="margin-top: 2px;">
              <div>
                <div>Permanently delete all ${prodCount} product(s)</div>
                <div style="font-weight: 400; color: #b91c1c; font-size: 12px;">This will remove the products, images, and variants completely.</div>
              </div>
            </label>
          </div>
        </div>
      `;

      modalFooter.innerHTML = `
        <button type="button" class="btn btn--outline btn--sm" onclick="admin.modal('deleteCollectionModal').close()">Cancel</button>
        <button type="button" class="btn btn--danger btn--sm" id="execDelBtn">
          Confirm & Delete Category
        </button>
      `;

      if (window.lucide) lucide.createIcons();
      delModal.open();

      document.getElementById('execDelBtn').onclick = async function () {
        const btn = this;
        const selectedAction = document.querySelector('input[name="delProdAction"]:checked')?.value || 'move';
        btn.disabled = true;
        btn.textContent = 'Processing...';

        try {
          if (selectedAction === 'move') {
            const newCatId = document.getElementById('reassignSelect').value;
            if (!newCatId) throw new Error('Please select a target category.');
            const { error: moveErr } = await sb.from('products').update({ collection_id: newCatId }).eq('collection_id', catId);
            if (moveErr) throw moveErr;
          } else {
            // Delete products assigned to this category
            const { error: prodDelErr } = await sb.from('products').delete().eq('collection_id', catId);
            if (prodDelErr) throw prodDelErr;
          }

          // Delete the category itself
          const { error: catDelErr } = await sb.from('collections').delete().eq('id', catId);
          if (catDelErr) throw catDelErr;

          admin.toast(`Category "${cat.name}" deleted successfully.`, 'success');
          delModal.close();
          await loadCollections();
        } catch (err) {
          console.error('Delete error:', err);
          admin.toast(err.message || 'Failed to complete deletion.', 'error');
          btn.disabled = false;
          btn.textContent = 'Confirm & Delete Category';
        }
      };
      return;
    }

    // CASE 3: Parent category with subcategories
    const descendantIds = getDescendantIds(catId);
    let totalDescendantProds = 0;
    descendantIds.forEach(id => { totalDescendantProds += (productCountMap[id] || 0); });
    const totalSubcategories = descendantIds.length;

    modalBody.innerHTML = `
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 14px; margin-bottom: 16px;">
        <div style="font-weight: 700; color: #b91c1c; font-size: 14px; display: flex; align-items: center; gap: 6px;">
          <i data-lucide="alert-triangle" style="width: 18px; height: 18px;"></i>
          Parent Category with ${totalSubcategories} Subcategory(ies)
        </div>
        <p style="font-size: 13px; color: #7f1d1d; margin-top: 6px; line-height: 1.4;">
          "<strong>${admin.escapeHtml(cat.name)}</strong>" cannot be deleted individually because it has <strong>${totalSubcategories} subcategories</strong>${totalDescendantProds > 0 ? ` and <strong>${totalDescendantProds} products</strong>` : ''}.
        </p>
      </div>

      <div style="font-size: 13px; color: #374151; margin-bottom: 14px; line-height: 1.5;">
        You can choose to delete this <strong>entire category branch</strong> (all ${totalSubcategories} subcategories and this parent category).
      </div>

      <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 10px 14px; font-size: 12.5px; color: #92400e; margin-bottom: 8px;">
        <strong>Tip:</strong> If you only want to delete one subcategory, expand this branch and click the trash icon next to that specific subcategory instead.
      </div>
    `;

    modalFooter.innerHTML = `
      <button type="button" class="btn btn--outline btn--sm" onclick="admin.modal('deleteCollectionModal').close()">Cancel</button>
      <button type="button" class="btn btn--danger btn--sm" id="execDelBtn">
        Delete Entire Branch (${totalSubcategories + 1} Categories)
      </button>
    `;

    if (window.lucide) lucide.createIcons();
    delModal.open();

    document.getElementById('execDelBtn').onclick = async function () {
      const btn = this;
      btn.disabled = true;
      btn.textContent = 'Deleting branch...';

      try {
        const allCatIds = [...descendantIds, catId];

        // 1. Delete all products in all these categories
        if (totalDescendantProds > 0) {
          const { error: pErr } = await sb.from('products').delete().in('collection_id', allCatIds);
          if (pErr) throw pErr;
        }

        // 2. Delete categories bottom-up (children before parents)
        function calcDepth(id) {
          let depth = 0;
          let curr = rawCollections.find(c => c.id === id);
          while (curr && curr.parent_id) {
            depth++;
            curr = rawCollections.find(c => c.id === curr.parent_id);
          }
          return depth;
        }

        const sortedDescendants = [...descendantIds].sort((a, b) => calcDepth(b) - calcDepth(a));

        for (const childId of sortedDescendants) {
          const { error: cErr } = await sb.from('collections').delete().eq('id', childId);
          if (cErr) throw cErr;
        }

        // Finally delete the parent
        const { error: parentErr } = await sb.from('collections').delete().eq('id', catId);
        if (parentErr) throw parentErr;

        admin.toast(`Category "${cat.name}" and subcategories deleted.`, 'success');
        delModal.close();
        await loadCollections();

      } catch (err) {
        console.error('Cascade delete error:', err);
        admin.toast(err.message || 'Failed to delete category branch.', 'error');
        btn.disabled = false;
        btn.textContent = 'Delete Entire Branch';
      }
    };
  };

  // 7. Sibling Reordering (Swap sort_order)
  window.reorderSibling = async function (catId, direction) {
    const target = rawCollections.find(c => c.id === catId);
    if (!target) return;

    // Get all siblings sharing the exact same parent_id, sorted by sort_order
    const siblings = rawCollections
      .filter(c => c.parent_id === target.parent_id)
      .sort((a, b) => a.sort_order - b.sort_order);

    const currIdx = siblings.findIndex(c => c.id === catId);
    const swapIdx = direction === 'up' ? currIdx - 1 : currIdx + 1;

    if (swapIdx < 0 || swapIdx >= siblings.length) return;

    const swapTarget = siblings[swapIdx];

    // Swap sort orders
    const targetOrder = target.sort_order;
    const swapOrder = swapTarget.sort_order;
    const newTargetOrder = (targetOrder === swapOrder) ? (direction === 'up' ? swapOrder - 1 : swapOrder + 1) : swapOrder;
    const newSwapOrder = targetOrder;

    try {
      await Promise.all([
        sb.from('collections').update({ sort_order: newTargetOrder }).eq('id', target.id),
        sb.from('collections').update({ sort_order: newSwapOrder }).eq('id', swapTarget.id)
      ]);

      admin.toast(`Updated sort order for ${target.name}.`);
      await loadCollections();
    } catch (err) {
      admin.toast('Failed to reorder categories.', 'error');
    }
  };

  // 8. Toggle Expand/Collapse All
  if (toggleAllBtn) {
    toggleAllBtn.addEventListener('click', () => {
      allExpanded = !allExpanded;
      toggleTreeText.textContent = allExpanded ? 'Collapse All' : 'Expand All';

      document.querySelectorAll('.tree-children').forEach(c => {
        c.classList.toggle('collapsed', !allExpanded);
      });
      document.querySelectorAll('.tree-toggle-btn:not(.empty)').forEach(btn => {
        btn.classList.toggle('collapsed', !allExpanded);
      });
    });
  }

  // 9. Real-time Search Filtering
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const allRows = document.querySelectorAll('.tree-node');

      if (!q) {
        allRows.forEach(node => {
          node.style.display = 'block';
        });
        return;
      }

      allRows.forEach(node => {
        const name = node.dataset.name || '';
        const slug = node.dataset.slug || '';
        const matches = name.includes(q) || slug.includes(q);

        if (matches) {
          node.style.display = 'block';
          // Auto expand ancestors
          let parent = node.parentElement;
          while (parent && parent !== treeContainer) {
            if (parent.classList.contains('tree-children')) {
              parent.classList.remove('collapsed');
              const parentNode = parent.closest('.tree-node');
              if (parentNode) {
                parentNode.style.display = 'block';
                const toggle = parentNode.querySelector('.tree-toggle-btn');
                if (toggle) toggle.classList.remove('collapsed');
              }
            }
            parent = parent.parentElement;
          }
        } else {
          // If no matching descendant, hide
          const hasMatchingChild = node.querySelector(`.tree-node[data-name*="${q}"], .tree-node[data-slug*="${q}"]`);
          node.style.display = hasMatchingChild ? 'block' : 'none';
        }
      });
    });
  }

  // Header Add Button
  if (newRootBtn) {
    newRootBtn.addEventListener('click', () => openAddModal(null));
  }

  // Initial fetch
  loadCollections();
});
