/**
 * Blog Posts Manager Script for Haider Sports Admin
 * Handles posts listing, filters by category/status, search, and delete actions.
 */

let allPosts = [];
let searchQuery = '';
let selectedCategory = 'all';
let selectedStatus = 'all';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Initialize layout & auth guard
  await admin.initLayout('blog', 'Blog & Articles');

  // 2. Initialize Event Listeners
  initEventListeners();

  // 3. Load Posts
  await loadPosts();
});

/* ==========================================================================
   Load Posts & Categories
   ========================================================================== */
async function loadPosts() {
  const tbody = document.getElementById('blogTableBody');
  tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 40px; color: #64748b;"><i data-lucide="loader-2" class="spin" style="width: 18px; height: 18px; display: inline-block; vertical-align: middle; margin-right: 6px;"></i> Loading articles...</td></tr>`;
  if (window.lucide) lucide.createIcons();

  try {
    const { data, error } = await supabaseClient
      .from('blog_posts')
      .select('*')
      .order('published_at', { ascending: false });

    if (error) throw error;

    allPosts = data || [];

    populateCategoryFilter();
    renderPostsTable();

  } catch (err) {
    console.error('Error loading blog posts:', err);
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 40px; color: #ef4444;"><i data-lucide="alert-circle" style="width: 18px; height: 18px; display: inline-block; vertical-align: middle; margin-right: 6px;"></i> Error loading articles: ${err.message}</td></tr>`;
    if (window.lucide) lucide.createIcons();
  }
}

function populateCategoryFilter() {
  const select = document.getElementById('blogCategoryFilter');
  const currentVal = select.value;

  const categories = new Set();
  allPosts.forEach(p => {
    if (p.category) categories.add(p.category.trim());
  });

  select.innerHTML = '<option value="all">All Categories</option>';
  Array.from(categories).sort().forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });

  if (categories.has(currentVal)) {
    select.value = currentVal;
  }
}

/* ==========================================================================
   Filter, Search & Render
   ========================================================================== */
function getFilteredPosts() {
  const q = searchQuery.toLowerCase().trim();

  return allPosts.filter(p => {
    // Search
    if (q) {
      const matchTitle = (p.title || '').toLowerCase().includes(q);
      const matchAuthor = (p.author || '').toLowerCase().includes(q);
      const matchExcerpt = (p.excerpt || '').toLowerCase().includes(q);
      if (!matchTitle && !matchAuthor && !matchExcerpt) return false;
    }

    // Category
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;

    // Status
    if (selectedStatus === 'published' && !p.is_published) return false;
    if (selectedStatus === 'draft' && p.is_published) return false;

    return true;
  });
}

function renderPostsTable() {
  const filtered = getFilteredPosts();
  const tbody = document.getElementById('blogTableBody');

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 48px 16px; color: #64748b;">
          <div style="font-size: 36px; margin-bottom: 8px;">📝</div>
          <div style="font-size: 15px; font-weight: 600; color: var(--heading);">No articles found</div>
          <div style="font-size: 13px; color: #94a3b8; margin-top: 4px;">Click "Write New Article" to post cricket guides and tips.</div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(p => {
    const pubDate = p.published_at ? new Date(p.published_at).toLocaleDateString('en-PK', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }) : 'Unpublished';

    return `
      <tr>
        <td>
          <img src="${p.cover_url || 'https://placehold.co/80x50?text=No+Cover'}" 
               alt="${admin.escapeHtml(p.title)}" 
               style="width: 70px; height: 44px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border);"
               onerror="this.src='https://placehold.co/80x50?text=Error'">
        </td>
        <td>
          <div style="font-weight: 700; color: var(--heading); font-size: 14px;">
            ${admin.escapeHtml(p.title)}
          </div>
          <div style="font-size: 11px; color: #64748b;">
            <code>post.html?slug=${p.slug}</code>
          </div>
        </td>
        <td>
          <span class="badge badge--info" style="font-size: 11px;">${admin.escapeHtml(p.category || 'General')}</span>
        </td>
        <td>
          <span style="font-size: 13px; color: #334155;">${admin.escapeHtml(p.author || 'Haider Sports Team')}</span>
        </td>
        <td>
          <span style="font-size: 12.5px; color: #64748b;">${pubDate}</span>
        </td>
        <td>
          <span class="status-badge ${p.is_published ? 'status-badge--delivered' : 'status-badge--cancelled'}">
            ${p.is_published ? 'Published' : 'Draft'}
          </span>
        </td>
        <td style="text-align: right;">
          <div style="display: inline-flex; gap: 4px;">
            <a href="../post.html?slug=${p.slug}" target="_blank" class="btn btn--outline btn--xs" title="View Article on Store">
              <i data-lucide="external-link" style="width: 13px; height: 13px;"></i>
            </a>
            <a href="blog-edit.html?id=${p.id}" class="btn btn--outline btn--xs" title="Edit Article">
              <i data-lucide="pencil" style="width: 13px; height: 13px;"></i>
            </a>
            <button type="button" class="btn btn--outline btn--xs" style="color: #ef4444; border-color: #fca5a5;" onclick="deletePost('${p.id}')" title="Delete Article">
              <i data-lucide="trash-2" style="width: 13px; height: 13px;"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

window.deletePost = async function(id) {
  const confirmed = await admin.confirm('Are you sure you want to permanently delete this article?');
  if (!confirmed) return;

  try {
    const { error } = await supabaseClient.from('blog_posts').delete().eq('id', id);
    if (error) throw error;
    admin.toast('Article deleted', 'success');
    await loadPosts();
  } catch (err) {
    admin.toast('Failed to delete post: ' + err.message, 'error');
  }
};

/* ==========================================================================
   Event Listeners
   ========================================================================== */
function initEventListeners() {
  document.getElementById('blogSearchInput').addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderPostsTable();
  });

  document.getElementById('blogCategoryFilter').addEventListener('change', (e) => {
    selectedCategory = e.target.value;
    renderPostsTable();
  });

  document.getElementById('blogStatusFilter').addEventListener('change', (e) => {
    selectedStatus = e.target.value;
    renderPostsTable();
  });
}
