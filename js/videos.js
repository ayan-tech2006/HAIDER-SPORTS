// Video cards and the player pop-up.
// Home page: shows the latest few (data-limit on #videoGrid); videos.html: shows all.
// Needs common.js (esc) and data.js (api.getVideos).
(function () {
  const grid = document.getElementById('videoGrid');
  if (!grid || typeof api === 'undefined' || !api.getVideos) return;

  const limit = Number(grid.dataset.limit) || 0;
  const thumb = id => `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`;

  // ---- Player pop-up (created once, on first click) ----
  let modal, frameBox, titleEl, lastTrigger;
  function buildModal() {
    modal = document.createElement('div');
    modal.className = 'video-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Video player');
    modal.innerHTML = `
      <div class="video-modal__box">
        <button type="button" class="video-modal__close" aria-label="Close video"><i class="fa-solid fa-xmark"></i></button>
        <div class="video-modal__frame"></div>
        <div class="video-modal__title"></div>
      </div>`;
    document.body.appendChild(modal);
    frameBox = modal.querySelector('.video-modal__frame');
    titleEl = modal.querySelector('.video-modal__title');
    modal.addEventListener('click', e => { if (e.target === modal || e.target.closest('.video-modal__close')) closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal.classList.contains('open')) closeModal(); });
  }
  function openModal(id, title, trigger) {
    if (!modal) buildModal();
    lastTrigger = trigger;
    // youtube-nocookie: no tracking cookies until the visitor plays the video
    frameBox.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0" title="${esc(title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
    titleEl.textContent = title;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    modal.querySelector('.video-modal__close').focus();
  }
  function closeModal() {
    modal.classList.remove('open');
    frameBox.innerHTML = ''; // stops the video
    document.body.style.overflow = '';
    if (lastTrigger) lastTrigger.focus();
  }

  // ---- Cards ----
  const card = v => `
    <button type="button" class="video-card" data-id="${esc(v.youtube_id)}" data-title="${esc(v.title)}">
      <span class="video-card__thumb">
        <img src="${thumb(v.youtube_id)}" alt="" loading="lazy">
        <span class="video-card__play"><span><i class="fa-solid fa-play"></i></span></span>
      </span>
      <h3>${esc(v.title)}</h3>
      ${v.description ? `<p>${esc(v.description)}</p>` : ''}
    </button>`;

  grid.addEventListener('click', e => {
    const c = e.target.closest('.video-card');
    if (c) openModal(c.dataset.id, c.dataset.title, c);
  });

  api.getVideos({ limit }).then(videos => {
    const section = grid.closest('[data-videos-section]');
    const empty = document.getElementById('videosEmpty');
    if (!videos.length) {
      grid.hidden = true;
      if (empty) empty.hidden = false;          // videos page: friendly message
      else if (section) section.hidden = true;  // home page: no empty section
      return;
    }
    grid.innerHTML = videos.map(card).join('');
  });
})();
