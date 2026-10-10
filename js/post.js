// Single blog post controller: renders post details, share buttons, gear strip, and related posts
document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('postContainer');
  const breadcrumbTitle = document.getElementById('breadcrumbPostTitle');
  const gearStripSection = document.getElementById('gearStripSection');
  const gearGrid = document.getElementById('gearGrid');
  const relatedSection = document.getElementById('relatedSection');
  const relatedGrid = document.getElementById('relatedGrid');

  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug') || 'how-to-choose-tape-ball-bat';

  const post = await api.getPost(slug);

  if (!post) {
    if (breadcrumbTitle) breadcrumbTitle.textContent = 'Post Not Found';
    container.innerHTML = `
      <div style="text-align: center; padding: 80px 20px;">
        <div style="font-size: 56px; color: #ddd; margin-bottom: 16px;">
          <i class="fa-solid fa-file-circle-question"></i>
        </div>
        <h2 style="font-size: 26px; margin-bottom: 10px;">Cricket Guide Not Found</h2>
        <p style="color: #666; margin-bottom: 24px;">The article you are looking for may have been moved or removed.</p>
        <a href="blog.html" class="btn btn--primary">
          <i class="fa-solid fa-arrow-left"></i> Back to Blog
        </a>
      </div>
    `;
    return;
  }

  // Update page title & breadcrumbs
  document.title = `${post.title} - Haider Sports`;
  if (breadcrumbTitle) breadcrumbTitle.textContent = post.title;

  const currentUrl = window.location.href;
  const shareText = encodeURIComponent(`${post.title} - Read on Haider Sports: `);
  const shareUrl = encodeURIComponent(currentUrl);

  // Render Post Content & Share Bar
  container.innerHTML = `
    <article class="post-article">
      <header class="post-header">
        <a href="blog.html?category=${encodeURIComponent(post.category)}" class="post-cat-badge">
          <i class="fa-solid fa-tag"></i> ${esc(post.category)}
        </a>
        <h1 class="post-title">${esc(post.title)}</h1>
        <div class="post-meta-row">
          <span><i class="fa-regular fa-user"></i> By <strong>${esc(post.author)}</strong></span>
          <span><i class="fa-regular fa-calendar"></i> ${esc(post.date)}</span>
          <span><i class="fa-regular fa-clock"></i> ${esc(post.readTime)}</span>
        </div>
      </header>

      <div class="post-cover-wrap">
        <img src="${img(post.cover, 1200)}" alt="${esc(post.title)}" loading="eager">
      </div>

      <div class="post-content">
        ${post.content}
      </div>

      <!-- Social Share Bar -->
      <div class="post-share-card">
        <div class="post-share-title">
          <i class="fa-solid fa-share-nodes"></i> Share This Guide:
        </div>
        <div class="post-share-buttons">
          <a href="https://api.whatsapp.com/send?text=${shareText}${shareUrl}" 
             target="_blank" 
             rel="noopener" 
             class="share-btn share-btn--whatsapp">
            <i class="fa-brands fa-whatsapp"></i> Share on WhatsApp
          </a>
          <a href="https://www.facebook.com/sharer/sharer.php?u=${shareUrl}" 
             target="_blank" 
             rel="noopener" 
             class="share-btn share-btn--facebook">
            <i class="fa-brands fa-facebook-f"></i> Facebook
          </a>
          <button type="button" class="share-btn share-btn--copy" id="copyShareBtn">
            <i class="fa-regular fa-copy"></i> Copy Link
          </button>
        </div>
      </div>
    </article>
  `;

  // Wire Copy Link Button
  const copyBtn = document.getElementById('copyShareBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(currentUrl);
        copyBtn.innerHTML = '<i class="fa-solid fa-check" style="color:var(--primary);"></i> Copied!';
        if (typeof showToast === 'function') {
          showToast('Article link copied to clipboard!');
        }
        setTimeout(() => {
          copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy Link';
        }, 2500);
      } catch (err) {
        prompt('Copy this link:', currentUrl);
      }
    });
  }

  // Render "Shop The Gear" Strip
  if (post.recommendedProducts && post.recommendedProducts.length > 0) {
    gearStripSection.style.display = 'block';
    gearGrid.innerHTML = post.recommendedProducts.map(p => productCard(p)).join('');
  }

  // Render "Related Cricket Guides" Section
  if (post.relatedPosts && post.relatedPosts.length > 0) {
    relatedSection.style.display = 'block';
    relatedGrid.innerHTML = post.relatedPosts.map(p => `
      <article class="news__card">
        <div class="news__img">
          <a href="post.html?slug=${encodeURIComponent(p.slug)}">
            <img src="${img(p.cover)}" alt="${esc(p.title)}" loading="lazy">
          </a>
          <span class="news__date"><b>${p.day || '15'}</b>${p.month || 'Oct'}</span>
        </div>
        <div class="news__content">
          <span class="news__tag">${esc(p.category)}</span>
          <div class="news__meta">
            <span><i class="fa-regular fa-user"></i> ${esc(p.author)}</span>
            <span><i class="fa-regular fa-clock"></i> ${esc(p.readTime)}</span>
          </div>
          <h4><a href="post.html?slug=${encodeURIComponent(p.slug)}">${esc(p.title)}</a></h4>
          <p class="news__excerpt">${esc(p.excerpt)}</p>
          <a href="post.html?slug=${encodeURIComponent(p.slug)}" class="news__readmore">
            Read Full Guide <i class="fa-solid fa-arrow-right"></i>
          </a>
        </div>
      </article>
    `).join('');
  }
});
