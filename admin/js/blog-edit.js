/**
 * Blog Article Add / Edit Logic for Haider Sports Admin
 * Handles slug generation, rich text formatting, cover uploads,
 * SEO character counting, and live preview links.
 */

let hasManuallyEditedSlug = false;

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Initialize layout & auth guard
  await admin.initLayout('blog', 'Article Editor');

  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get('id');

  // 2. Setup Form & Rich Text
  initRichText();
  initFormHelpers();
  initCoverUpload();

  // 3. Load Post if Edit Mode
  if (postId) {
    document.getElementById('editPostId').value = postId;
    document.getElementById('blogPageHeading').textContent = 'Edit Article';
    document.title = 'Edit Article - Haider Sports Admin';
    hasManuallyEditedSlug = true;
    await loadPostData(postId);
  } else {
    // Default today's date
    document.getElementById('postPubDate').value = new Date().toISOString().slice(0, 10);
  }

  // 4. Form Submit
  document.getElementById('blogEditForm').addEventListener('submit', handleFormSubmit);
});

/* ==========================================================================
   Rich Text Editor
   ========================================================================== */
function initRichText() {
  const toolbar = document.querySelector('.rich-editor-toolbar');
  const editor = document.getElementById('postBodyEditor');

  if (!toolbar || !editor) return;

  toolbar.addEventListener('click', (e) => {
    const btn = e.target.closest('.rich-btn');
    if (!btn) return;
    e.preventDefault();

    const cmd = btn.dataset.cmd;
    const val = btn.dataset.val || null;

    if (cmd === 'createLink') {
      const url = prompt('Enter link URL (e.g. https://...):');
      if (url) document.execCommand('createLink', false, url);
    } else if (cmd === 'insertImage') {
      const url = prompt('Enter image URL:');
      if (url) document.execCommand('insertImage', false, url);
    } else {
      document.execCommand(cmd, false, val);
    }

    editor.focus();
  });
}

/* ==========================================================================
   Form Helpers & SEO Counters
   ========================================================================== */
function initFormHelpers() {
  const titleInput = document.getElementById('postTitle');
  const slugInput = document.getElementById('postSlug');
  const seoTitleInput = document.getElementById('postSeoTitle');
  const seoDescInput = document.getElementById('postSeoDesc');

  // Slug auto-generation
  titleInput.addEventListener('input', () => {
    if (!hasManuallyEditedSlug) {
      slugInput.value = admin.slugify(titleInput.value);
    }
  });

  slugInput.addEventListener('input', () => {
    hasManuallyEditedSlug = true;
  });

  // SEO Counters
  const titleCounter = document.getElementById('seoTitleCounter');
  const descCounter = document.getElementById('seoDescCounter');

  seoTitleInput.addEventListener('input', () => {
    const len = seoTitleInput.value.length;
    titleCounter.textContent = `${len} / 60`;
    titleCounter.style.color = len > 60 ? '#ef4444' : '#64748b';
  });

  seoDescInput.addEventListener('input', () => {
    const len = seoDescInput.value.length;
    descCounter.textContent = `${len} / 160`;
    descCounter.style.color = len > 160 ? '#ef4444' : '#64748b';
  });
}

/* ==========================================================================
   Cover Image Upload
   ========================================================================== */
function initCoverUpload() {
  const fileInput = document.getElementById('postCoverFileInput');
  const urlInput = document.getElementById('postCoverUrl');
  const previewBox = document.getElementById('postCoverPreviewBox');

  function updatePreview(url) {
    if (!url) {
      previewBox.innerHTML = '<span style="font-size: 12px; color: #94a3b8;">No cover image selected</span>';
      return;
    }
    previewBox.innerHTML = `<img src="${url}" style="width: 100%; height: 160px; object-fit: cover;" onerror="this.src='https://placehold.co/400x200?text=Invalid+Image'">`;
  }

  urlInput.addEventListener('input', () => {
    updatePreview(urlInput.value.trim());
  });

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    admin.toast('Uploading cover image...', 'info');
    const url = await admin.uploadImage(file, 'images');
    if (url) {
      urlInput.value = url;
      updatePreview(url);
      admin.toast('Cover image uploaded', 'success');
    }
  });
}

/* ==========================================================================
   Load Existing Post Data
   ========================================================================== */
async function loadPostData(postId) {
  try {
    const { data: post, error } = await supabaseClient
      .from('blog_posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (error || !post) {
      admin.toast('Article not found', 'error');
      return;
    }

    document.getElementById('postTitle').value = post.title || '';
    document.getElementById('postSlug').value = post.slug || '';
    document.getElementById('postExcerpt').value = post.excerpt || '';
    document.getElementById('postBodyEditor').innerHTML = post.content || '';
    document.getElementById('postCategory').value = post.category || '';
    document.getElementById('postAuthor').value = post.author || 'Haider Sports Team';
    document.getElementById('postCoverUrl').value = post.cover_url || '';
    document.getElementById('postIsPublished').checked = !!post.is_published;

    if (post.published_at) {
      document.getElementById('postPubDate').value = new Date(post.published_at).toISOString().slice(0, 10);
    }

    // Trigger cover preview
    document.getElementById('postCoverUrl').dispatchEvent(new Event('input'));

    // Setup preview button
    const previewBtn = document.getElementById('previewArticleBtn');
    previewBtn.href = `../post.html?slug=${post.slug}`;
    previewBtn.style.display = 'inline-flex';

  } catch (err) {
    console.error('Error loading post:', err);
    admin.toast('Failed to load article: ' + err.message, 'error');
  }
}

/* ==========================================================================
   Form Submission
   ========================================================================== */
async function handleFormSubmit(e) {
  e.preventDefault();

  const postId = document.getElementById('editPostId').value;
  const isEdit = !!postId;

  const title = document.getElementById('postTitle').value.trim();
  const slug = document.getElementById('postSlug').value.trim();
  const excerpt = document.getElementById('postExcerpt').value.trim();
  const content = document.getElementById('postBodyEditor').innerHTML.trim();
  const category = document.getElementById('postCategory').value.trim();
  const author = document.getElementById('postAuthor').value.trim();
  const coverUrl = document.getElementById('postCoverUrl').value.trim();
  const isPublished = document.getElementById('postIsPublished').checked;
  const pubDateStr = document.getElementById('postPubDate').value;

  if (!title || !slug) {
    admin.toast('Please provide an article title and slug', 'warning');
    return;
  }
  if (!coverUrl) {
    admin.toast('Please provide a cover image URL', 'warning');
    return;
  }

  const saveBtn = document.getElementById('savePostBtn');
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<i data-lucide="loader-2" class="spin" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle; margin-right: 4px;"></i> Saving...';
  if (window.lucide) lucide.createIcons();

  const payload = {
    title,
    slug,
    excerpt,
    content,
    category,
    author: author || 'Haider Sports Team',
    cover_url: coverUrl,
    is_published: isPublished,
    published_at: pubDateStr ? new Date(pubDateStr).toISOString() : new Date().toISOString()
  };

  try {
    if (isEdit) {
      const { error } = await supabaseClient
        .from('blog_posts')
        .update(payload)
        .eq('id', postId);

      if (error) throw error;
      admin.toast('Article updated successfully!', 'success');
    } else {
      const { error } = await supabaseClient
        .from('blog_posts')
        .insert(payload);

      if (error) throw error;
      admin.toast('Article published successfully!', 'success');
    }

    setTimeout(() => {
      window.location.href = 'blog.html';
    }, 1000);

  } catch (err) {
    console.error('Save blog error:', err);
    admin.toast('Error saving article: ' + (err.message || 'Check for duplicate slug'), 'error');
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<i data-lucide="check" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle; margin-right: 4px;"></i> Save Article';
    if (window.lucide) lucide.createIcons();
  }
}
