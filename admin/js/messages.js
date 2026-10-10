/**
 * Customer Inquiries & Newsletter Subscribers Script for Haider Sports Admin
 * Handles contact message moderation, quick replies (Call, WhatsApp, Email mailto),
 * unread badges, email exports, and newsletter list management.
 */

let allMessages = [];
let allSubscribers = [];
let activeMsg = null;

let msgSearchQuery = '';
let msgStatusFilter = 'all';
let subsSearchQuery = '';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Initialize layout & auth guard
  await admin.initLayout('messages', 'Customer Messages');

  // 2. Initialize Tab Switching
  initTabs();

  // 3. Initialize Listeners
  initListeners();

  // 4. Load Data
  await loadMessages();
  await loadSubscribers();
});

/* ==========================================================================
   Tab Navigation
   ========================================================================== */
function initTabs() {
  const tabBtns = document.querySelectorAll('.msg-nav-btn');
  const panes = document.querySelectorAll('.tab-pane');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      panes.forEach(p => p.style.display = 'none');

      btn.classList.add('active');
      const target = document.getElementById(btn.dataset.tab);
      if (target) target.style.display = 'block';
    });
  });

  document.getElementById('refreshCommsBtn').addEventListener('click', async () => {
    await loadMessages();
    await loadSubscribers();
    admin.toast('Messages & subscribers refreshed', 'info');
  });
}

/* ==========================================================================
   Load Messages
   ========================================================================== */
async function loadMessages() {
  const tbody = document.getElementById('messagesTableBody');
  tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 40px; color: #64748b;"><i data-lucide="loader-2" class="spin" style="width: 18px; height: 18px; display: inline-block; vertical-align: middle; margin-right: 6px;"></i> Loading inquiries...</td></tr>`;
  if (window.lucide) lucide.createIcons();

  try {
    const { data, error } = await supabaseClient
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    allMessages = data || [];
    updateUnreadBadges();
    renderMessagesTable();

  } catch (err) {
    console.error('Error loading messages:', err);
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 40px; color: #ef4444;"><i data-lucide="alert-circle" style="width: 18px; height: 18px; display: inline-block; vertical-align: middle; margin-right: 6px;"></i> Error loading messages: ${err.message}</td></tr>`;
    if (window.lucide) lucide.createIcons();
  }
}

function updateUnreadBadges() {
  const unreadCount = allMessages.filter(m => !m.is_read).length;

  const pillBadge = document.getElementById('unreadPillBadge');
  if (pillBadge) {
    pillBadge.textContent = unreadCount;
    pillBadge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
  }

  const sidebarBadge = document.getElementById('badgeMessages');
  if (sidebarBadge) {
    sidebarBadge.textContent = unreadCount;
    sidebarBadge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
  }
}

/* ==========================================================================
   Render Messages Table
   ========================================================================== */
function getFilteredMessages() {
  const q = msgSearchQuery.toLowerCase().trim();

  return allMessages.filter(m => {
    if (msgStatusFilter === 'unread' && m.is_read) return false;
    if (msgStatusFilter === 'read' && !m.is_read) return false;

    if (q) {
      const matchName = (m.name || '').toLowerCase().includes(q);
      const matchPhone = (m.phone || '').toLowerCase().includes(q);
      const matchEmail = (m.email || '').toLowerCase().includes(q);
      const matchSub = (m.subject || '').toLowerCase().includes(q);
      const matchMsg = (m.message || '').toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchEmail && !matchSub && !matchMsg) return false;
    }

    return true;
  });
}

function renderMessagesTable() {
  const filtered = getFilteredMessages();
  const tbody = document.getElementById('messagesTableBody');

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 48px 16px; color: #64748b;">
          <div style="font-size: 36px; margin-bottom: 8px;">📬</div>
          <div style="font-size: 15px; font-weight: 600; color: var(--heading);">No inquiries found</div>
          <div style="font-size: 13px; color: #94a3b8; margin-top: 4px;">Inquiries submitted through your store's contact form will appear here.</div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(m => {
    const isUnread = !m.is_read;
    const dateFormatted = new Date(m.created_at).toLocaleDateString('en-PK', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    return `
      <tr class="${isUnread ? 'is-unread' : ''}">
        <td style="text-align: center;">
          <i data-lucide="${isUnread ? 'mail' : 'mail-open'}" 
             style="color: ${isUnread ? 'var(--primary)' : '#94a3b8'}; width: 16px; height: 16px; display: inline-block; vertical-align: middle;" 
             title="${isUnread ? 'Unread message' : 'Read message'}"></i>
        </td>
        <td>
          <div style="font-weight: 700; color: var(--heading);">${admin.escapeHtml(m.name || 'Anonymous')}</div>
          <a href="tel:${m.phone}" style="font-size: 12px; color: #64748b; text-decoration: none;">
            ${m.phone}
          </a>
        </td>
        <td>
          <div style="font-weight: ${isUnread ? '800' : '600'}; color: var(--heading); font-size: 13.5px;">
            ${admin.escapeHtml(m.subject || 'General Inquiry')}
          </div>
          <div style="font-size: 12px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 460px;">
            ${admin.escapeHtml(m.message || '')}
          </div>
        </td>
        <td>
          <span style="font-size: 12px; color: #64748b;">${dateFormatted}</span>
        </td>
        <td style="text-align: right;">
          <div style="display: inline-flex; gap: 4px;">
            <button type="button" class="btn btn--outline btn--xs" onclick="openMessageDrawer('${m.id}')" title="View Inquiry">
              <i data-lucide="eye" style="width: 13px; height: 13px;"></i> View
            </button>
            <button type="button" class="btn btn--outline btn--xs" style="color: #ef4444; border-color: #fca5a5;" onclick="deleteMessage('${m.id}')" title="Delete Inquiry">
              <i data-lucide="trash-2" style="width: 13px; height: 13px;"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

/* ==========================================================================
   Side Drawer Details & Actions
   ========================================================================== */
window.openMessageDrawer = async function(id) {
  const msg = allMessages.find(m => m.id === id);
  if (!msg) return;
  activeMsg = msg;

  // Mark as read automatically when opened
  if (!msg.is_read) {
    await setMessageReadState(msg.id, true);
  }

  // Populate drawer
  document.getElementById('drawerSenderName').textContent = msg.name || 'Anonymous';
  document.getElementById('drawerTimestamp').textContent = new Date(msg.created_at).toLocaleString('en-PK');
  document.getElementById('drawerSenderPhone').textContent = msg.phone || '-';
  document.getElementById('drawerSenderEmail').textContent = msg.email || 'None';
  document.getElementById('drawerSubject').textContent = msg.subject || 'General Inquiry';
  document.getElementById('drawerFullMessage').textContent = msg.message || '';

  // Reply Buttons
  document.getElementById('drawerCallBtn').href = `tel:${msg.phone}`;

  let cleanPhone = (msg.phone || '').replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('0')) cleanPhone = '92' + cleanPhone.slice(1);
  const waReply = `Salam ${msg.name}!\nThank you for reaching out to Haider Sports regarding: "${msg.subject || 'your inquiry'}".\nHow can we assist you today?`;
  document.getElementById('drawerWhatsAppBtn').href = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waReply)}`;

  if (msg.email) {
    document.getElementById('drawerEmailBtn').href = `mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject || 'Haider Sports Inquiry')}&body=Salam ${encodeURIComponent(msg.name)},\n\nThank you for reaching out to Haider Sports.\n\n`;
    document.getElementById('drawerEmailBtn').style.display = 'inline-flex';
  } else {
    document.getElementById('drawerEmailBtn').style.display = 'none';
  }

  // Read toggle button label
  const toggleBtn = document.getElementById('drawerToggleReadBtn');
  toggleBtn.textContent = msg.is_read ? 'Mark as Unread' : 'Mark as Read';
  toggleBtn.onclick = async () => {
    await setMessageReadState(msg.id, !msg.is_read);
    toggleBtn.textContent = msg.is_read ? 'Mark as Unread' : 'Mark as Read';
  };

  // Delete from drawer
  document.getElementById('drawerDeleteBtn').onclick = async () => {
    await deleteMessage(msg.id);
    closeMessageDrawer();
  };

  // Show Drawer
  document.getElementById('msgDrawerBackdrop').classList.add('active');
  document.getElementById('msgDrawerPanel').classList.add('active');
};

function closeMessageDrawer() {
  document.getElementById('msgDrawerBackdrop').classList.remove('active');
  document.getElementById('msgDrawerPanel').classList.remove('active');
  activeMsg = null;
}

async function setMessageReadState(id, isRead) {
  try {
    const { error } = await supabaseClient
      .from('messages')
      .update({ is_read: isRead })
      .eq('id', id);

    if (error) throw error;

    const target = allMessages.find(m => m.id === id);
    if (target) target.is_read = isRead;

    updateUnreadBadges();
    renderMessagesTable();
  } catch (err) {
    console.warn('Failed to update read state:', err);
  }
}

window.deleteMessage = async function(id) {
  const confirmed = await admin.confirm('Permanently delete this inquiry?');
  if (!confirmed) return;

  try {
    const { error } = await supabaseClient
      .from('messages')
      .delete()
      .eq('id', id);

    if (error) throw error;
    admin.toast('Inquiry deleted', 'success');
    await loadMessages();
  } catch (err) {
    admin.toast('Failed to delete inquiry: ' + err.message, 'error');
  }
};

/* ==========================================================================
   Newsletter Subscribers Management
   ========================================================================== */
async function loadSubscribers() {
  const tbody = document.getElementById('subscribersTableBody');
  tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; padding: 40px; color: #64748b;"><i data-lucide="loader-2" class="spin" style="width: 18px; height: 18px; display: inline-block; vertical-align: middle; margin-right: 6px;"></i> Loading subscribers...</td></tr>`;
  if (window.lucide) lucide.createIcons();

  try {
    const { data, error } = await supabaseClient
      .from('subscribers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    allSubscribers = data || [];
    document.getElementById('subsTotalBadge').textContent = allSubscribers.length;
    renderSubscribersTable();

  } catch (err) {
    console.error('Error loading subscribers:', err);
    tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; padding: 40px; color: #ef4444;"><i data-lucide="alert-circle" style="width: 18px; height: 18px; display: inline-block; vertical-align: middle; margin-right: 6px;"></i> Error loading subscribers: ${err.message}</td></tr>`;
    if (window.lucide) lucide.createIcons();
  }
}

function renderSubscribersTable() {
  const q = subsSearchQuery.toLowerCase().trim();
  const filtered = allSubscribers.filter(s => !q || s.email.toLowerCase().includes(q));
  const tbody = document.getElementById('subscribersTableBody');

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="3" style="text-align: center; padding: 40px; color: #64748b;">
          No subscribers found.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(s => {
    const dateFormatted = new Date(s.created_at).toLocaleDateString('en-PK', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    return `
      <tr>
        <td>
          <a href="mailto:${s.email}" style="font-weight: 600; color: var(--heading); text-decoration: none;">
            <i data-lucide="mail" style="color: #94a3b8; width: 14px; height: 14px; margin-right: 6px; display: inline-block; vertical-align: middle;"></i> ${admin.escapeHtml(s.email)}
          </a>
        </td>
        <td>
          <span style="font-size: 12.5px; color: #64748b;">${dateFormatted}</span>
        </td>
        <td style="text-align: right;">
          <button type="button" class="btn btn--outline btn--xs" style="color: #ef4444; border-color: #fca5a5;" onclick="deleteSubscriber('${s.id}')" title="Remove subscriber">
            <i data-lucide="trash-2" style="width: 13px; height: 13px;"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

window.deleteSubscriber = async function(id) {
  const confirmed = await admin.confirm('Remove this email from the subscriber list?');
  if (!confirmed) return;

  try {
    const { error } = await supabaseClient.from('subscribers').delete().eq('id', id);
    if (error) throw error;
    admin.toast('Subscriber removed', 'success');
    await loadSubscribers();
  } catch (err) {
    admin.toast('Failed to delete subscriber: ' + err.message, 'error');
  }
};

/* ==========================================================================
   Event Listeners & Exports
   ========================================================================== */
function initListeners() {
  // Messages Search & Filter
  document.getElementById('msgSearchInput').addEventListener('input', (e) => {
    msgSearchQuery = e.target.value;
    renderMessagesTable();
  });

  document.getElementById('msgStatusFilter').addEventListener('change', (e) => {
    msgStatusFilter = e.target.value;
    renderMessagesTable();
  });

  // Drawer Close
  document.getElementById('closeMsgDrawerBtn').addEventListener('click', closeMessageDrawer);
  document.getElementById('msgDrawerBackdrop').addEventListener('click', closeMessageDrawer);

  // Subscribers Search
  document.getElementById('subsSearchInput').addEventListener('input', (e) => {
    subsSearchQuery = e.target.value;
    renderSubscribersTable();
  });

  // Copy All Emails
  document.getElementById('copyAllEmailsBtn').addEventListener('click', () => {
    if (allSubscribers.length === 0) {
      admin.toast('No subscriber emails to copy', 'warning');
      return;
    }
    const emailList = allSubscribers.map(s => s.email).join(', ');
    navigator.clipboard.writeText(emailList).then(() => {
      admin.toast(`Copied ${allSubscribers.length} emails to clipboard!`, 'success');
    });
  });

  // Export Subscribers to CSV
  document.getElementById('exportSubsCsvBtn').addEventListener('click', () => {
    if (allSubscribers.length === 0) {
      admin.toast('No subscribers to export', 'warning');
      return;
    }
    const csvContent = ['Email,Date Subscribed', ...allSubscribers.map(s => `"${s.email}","${new Date(s.created_at).toLocaleDateString('en-PK')}"`)].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `haider_subscribers_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    admin.toast(`Exported ${allSubscribers.length} subscribers to CSV`, 'success');
  });
}
