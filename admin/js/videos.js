/**
 * Videos manager (replaces the blog).
 * The admin pastes a YouTube link; only the 11-character video id is stored.
 */

(function () {
'use strict';

let videos = [];
const $ = id => document.getElementById(id);
const esc = s => admin.escapeHtml(s);

// Accepts watch?v=, youtu.be/, /shorts/, /embed/, /live/, /v/ links (with extra parameters) or a bare video id.
function parseYouTubeId(input) {
  const text = String(input || '').trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(text)) return text;
  let url;
  try { url = new URL(/^https?:\/\//i.test(text) ? text : 'https://' + text); } catch (e) { return null; }
  const host = url.hostname.replace(/^(www|m|music)\./, '');
  let id = null;
  if (host === 'youtu.be') id = url.pathname.split('/')[1];
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (url.pathname === '/watch') id = url.searchParams.get('v');
    else {
      const m = url.pathname.match(/^\/(?:shorts|embed|live|v)\/([^/?#]+)/);
      if (m) id = m[1];
    }
  }
  return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
}

const thumbUrl = (id, size = 'mqdefault') => `https://i.ytimg.com/vi/${encodeURIComponent(id)}/${size}.jpg`;

document.addEventListener('DOMContentLoaded', async () => {
  await admin.initLayout('videos', 'Videos');
  $('addVideoBtn').addEventListener('click', () => openForm());
  $('videosBody').addEventListener('click', onRowAction);
  $('videoForm').addEventListener('submit', saveVideo);
  $('videoUrl').addEventListener('input', updatePreview);
  await loadVideos();
});

async function loadVideos() {
  const { data, error } = await supabaseClient
    .from('videos')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    // 42P01 / PGRST205: table not created yet
    if (/does not exist|schema cache|could not find the table/i.test(error.message || '') || ['42P01', 'PGRST205'].includes(error.code)) {
      $('setupNotice').classList.add('show');
      $('videosBody').innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 40px; color: #64748b;">Run the one-time setup above, then refresh.</td></tr>';
      return;
    }
    admin.toast('Could not load videos: ' + error.message, 'error');
    return;
  }
  videos = data || [];
  render();
}

function render() {
  const body = $('videosBody');
  $('videosCount').textContent = videos.length ? `${videos.length} video${videos.length === 1 ? '' : 's'}` : ' ';
  if (!videos.length) {
    body.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 48px 20px; color: #64748b;">
      <i data-lucide="play-circle" style="width: 34px; height: 34px; display: block; margin: 0 auto 10px; color: var(--primary);"></i>
      No videos yet. Click <strong>Add Video</strong> and paste a YouTube link.</td></tr>`;
    admin.renderIcons();
    return;
  }
  body.innerHTML = videos.map((v, i) => `
    <tr data-id="${esc(v.id)}">
      <td><img class="vid-thumb" src="${thumbUrl(v.youtube_id)}" alt="" loading="lazy"></td>
      <td>
        <div class="vid-title">${esc(v.title)}</div>
        ${v.description ? `<div class="vid-desc">${esc(v.description)}</div>` : ''}
      </td>
      <td>${v.is_published
        ? '<span class="badge badge--success">Visible</span>'
        : '<span class="badge badge--neutral">Hidden</span>'}</td>
      <td>
        <div class="vid-actions">
          <button type="button" class="btn btn--icon btn--xs" data-action="up" title="Move up" aria-label="Move up" ${i === 0 ? 'disabled' : ''}><i data-lucide="arrow-up"></i></button>
          <button type="button" class="btn btn--icon btn--xs" data-action="down" title="Move down" aria-label="Move down" ${i === videos.length - 1 ? 'disabled' : ''}><i data-lucide="arrow-down"></i></button>
          <a class="btn btn--icon btn--xs" href="https://www.youtube.com/watch?v=${encodeURIComponent(v.youtube_id)}" target="_blank" rel="noopener" title="Open on YouTube" aria-label="Open on YouTube"><i data-lucide="external-link"></i></a>
          <button type="button" class="btn btn--icon btn--xs" data-action="toggle" title="${v.is_published ? 'Hide from website' : 'Show on website'}" aria-label="${v.is_published ? 'Hide' : 'Show'}"><i data-lucide="${v.is_published ? 'eye-off' : 'eye'}"></i></button>
          <button type="button" class="btn btn--icon btn--xs" data-action="edit" title="Edit" aria-label="Edit"><i data-lucide="pencil"></i></button>
          <button type="button" class="btn btn--icon btn--xs" data-action="delete" title="Delete" aria-label="Delete" style="color: #ef4444;"><i data-lucide="trash-2"></i></button>
        </div>
      </td>
    </tr>`).join('');
  admin.renderIcons();
}

async function onRowAction(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const id = btn.closest('tr').dataset.id;
  const i = videos.findIndex(v => v.id === id);
  if (i < 0) return;
  const v = videos[i];

  switch (btn.dataset.action) {
    case 'edit': return openForm(v);
    case 'toggle': return update(v.id, { is_published: !v.is_published }, v.is_published ? 'Hidden from website' : 'Now visible on website');
    case 'up': return move(i, -1);
    case 'down': return move(i, 1);
    case 'delete': {
      if (!(await admin.confirm('Delete video', `Delete "${v.title}"? This cannot be undone.`))) return;
      const { error } = await supabaseClient.from('videos').delete().eq('id', v.id);
      if (error) return admin.toast('Could not delete: ' + error.message, 'error');
      admin.toast('Video deleted');
      return loadVideos();
    }
  }
}

async function update(id, fields, okMessage) {
  const { error } = await supabaseClient.from('videos').update(fields).eq('id', id);
  if (error) return admin.toast('Could not save: ' + error.message, 'error');
  if (okMessage) admin.toast(okMessage);
  return loadVideos();
}

// Give every video its position in the list, then swap the two neighbours.
async function move(i, dir) {
  const j = i + dir;
  if (j < 0 || j >= videos.length) return;
  const order = videos.map(v => v.id);
  [order[i], order[j]] = [order[j], order[i]];
  const results = await Promise.all(order.map((id, pos) => {
    const current = videos.find(v => v.id === id);
    return current.sort_order === pos ? null : supabaseClient.from('videos').update({ sort_order: pos }).eq('id', id);
  }));
  const failed = results.find(r => r && r.error);
  if (failed) admin.toast('Could not reorder: ' + failed.error.message, 'error');
  return loadVideos();
}

function openForm(v) {
  $('videoModalTitle').textContent = v ? 'Edit Video' : 'Add Video';
  $('videoId').value = v ? v.id : '';
  $('videoUrl').value = v ? `https://www.youtube.com/watch?v=${v.youtube_id}` : '';
  $('videoTitle').value = v ? v.title : '';
  $('videoDesc').value = v ? (v.description || '') : '';
  $('videoPublished').checked = v ? !!v.is_published : true;
  $('urlError').classList.remove('show');
  updatePreview();
  admin.modal.open('videoModal');
  $('videoUrl').focus();
}

function updatePreview() {
  const raw = $('videoUrl').value.trim();
  const id = parseYouTubeId(raw);
  $('urlPreview').classList.toggle('show', !!id);
  $('urlError').classList.toggle('show', !!raw && !id);
  if (id) {
    $('previewImg').src = thumbUrl(id);
    $('previewText').textContent = 'Video found. Check that this is the right thumbnail.';
  }
}

async function saveVideo(e) {
  e.preventDefault();
  const youtube_id = parseYouTubeId($('videoUrl').value);
  const title = $('videoTitle').value.trim();
  if (!youtube_id) { $('urlError').classList.add('show'); $('videoUrl').focus(); return; }
  if (!title) { admin.toast('Please enter a title', 'error'); $('videoTitle').focus(); return; }

  const id = $('videoId').value;
  const dup = videos.find(v => v.youtube_id === youtube_id && v.id !== id);
  if (dup && !(await admin.confirm('Same video again?', `"${dup.title}" already uses this YouTube video. Add it anyway?`, 'Add anyway'))) return;

  const fields = {
    youtube_id,
    title,
    description: $('videoDesc').value.trim() || null,
    is_published: $('videoPublished').checked,
  };
  // new videos go to the top of the list
  if (!id) fields.sort_order = videos.length ? Math.min(...videos.map(v => v.sort_order || 0)) - 1 : 0;

  const btn = $('saveVideoBtn');
  btn.disabled = true;
  const { error } = id
    ? await supabaseClient.from('videos').update(fields).eq('id', id)
    : await supabaseClient.from('videos').insert(fields);
  btn.disabled = false;

  if (error) return admin.toast('Could not save: ' + error.message, 'error');
  admin.modal.close('videoModal');
  admin.toast(id ? 'Video updated' : 'Video added');
  await loadVideos();
}

})();
