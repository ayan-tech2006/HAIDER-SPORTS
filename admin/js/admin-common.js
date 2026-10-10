/**
 * HAIDERSPORTS - ADMIN PANEL COMMON MODULE
 * File: admin/js/admin-common.js
 * Provides: Auth Guard, Shared Sidebar/Topbar Layout, UI Helpers (Modals, Toasts, Tables, Uploader)
 */

// Global admin namespace
window.admin = window.admin || {};

(function () {
  'use strict';

  // Ensure Supabase client is available
  function getClient() {
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
      return supabaseClient;
    }
    if (typeof supabase !== 'undefined' && typeof SUPABASE_URL !== 'undefined' && typeof SUPABASE_ANON_KEY !== 'undefined') {
      window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true }
      });
      return window.supabaseClient;
    }
    return null;
  }

  admin.client = getClient();

  // The last verified admin is remembered for this tab, so the next page can draw the
  // sidebar immediately and verify the session in the background.
  const USER_CACHE_KEY = 'haider_admin_user';
  function readCachedUser() {
    try { return JSON.parse(sessionStorage.getItem(USER_CACHE_KEY)); } catch (e) { return null; }
  }
  function cacheUser(user) {
    try { sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify({ email: user.email || '' })); } catch (e) { /* storage blocked: just slower */ }
  }
  function clearCachedUser() {
    try { sessionStorage.removeItem(USER_CACHE_KEY); } catch (e) { /* ignore */ }
  }

  // =========================================================================
  // 1. AUTH GUARD
  // =========================================================================
  admin.requireAuth = async function () {
    const sb = getClient();
    const isLoginPage = window.location.pathname.endsWith('/admin/index.html') || window.location.pathname.endsWith('/admin/') || window.location.pathname.endsWith('/admin');

    if (!sb) {
      if (!isLoginPage) window.location.href = 'index.html';
      return null;
    }

    try {
      const { data: { session }, error: sessError } = await sb.auth.getSession();
      if (sessError || !session) {
        if (!isLoginPage) {
          window.location.href = 'index.html';
        }
        return null;
      }

      // Verify is_admin() RPC
      const { data: isAdmin, error: rpcErr } = await sb.rpc('is_admin');
      if (rpcErr || !isAdmin) {
        // Not an authorized admin
        await sb.auth.signOut();
        if (!isLoginPage) {
          alert('Access Denied: Your account does not have administrator privileges.');
          window.location.href = 'index.html';
        }
        return null;
      }

      // If already on login page and confirmed admin, forward to dashboard
      if (isLoginPage) {
        window.location.href = 'dashboard.html';
        return session.user;
      }

      admin.currentUser = session.user;
      return session.user;
    } catch (err) {
      console.error('Admin auth check failure:', err);
      if (!isLoginPage) window.location.href = 'index.html';
      return null;
    }
  };

  admin.logout = async function () {
    clearCachedUser();
    const sb = getClient();
    if (sb) {
      await sb.auth.signOut();
    }
    window.location.href = 'index.html';
  };

  // =========================================================================
  // 1.5. LUCIDE ICON MAP & AUTOMATIC RENDERER
  // =========================================================================
  const ICON_MAP = {
    'fa-gauge-high': 'layout-dashboard',
    'fa-gauge': 'layout-dashboard',
    'fa-dashboard': 'layout-dashboard',
    'fa-bag-shopping': 'shopping-bag',
    'fa-shopping-bag': 'shopping-bag',
    'fa-cart-shopping': 'shopping-cart',
    'fa-baseball-bat-ball': 'package',
    'fa-boxes-stacked': 'boxes',
    'fa-box-archive': 'archive',
    'fa-box': 'package',
    'fa-folder-tree': 'folder-tree',
    'fa-folder': 'folder',
    'fa-folder-open': 'folder-open',
    'fa-users': 'users',
    'fa-user': 'user',
    'fa-user-plus': 'user-plus',
    'fa-user-pen': 'user-check',
    'fa-layer-group': 'layers',
    'fa-tags': 'tag',
    'fa-tag': 'tag',
    'fa-star': 'star',
    'fa-newspaper': 'newspaper',
    'fa-envelope': 'mail',
    'fa-envelope-open': 'mail-open',
    'fa-paper-plane': 'send',
    'fa-gear': 'settings',
    'fa-gears': 'settings-2',
    'fa-sliders': 'sliders',
    'fa-arrow-up-right-from-square': 'external-link',
    'fa-right-from-bracket': 'log-out',
    'fa-bars': 'menu',
    'fa-xmark': 'x',
    'fa-plus': 'plus',
    'fa-trash': 'trash-2',
    'fa-trash-can': 'trash-2',
    'fa-pen': 'edit-3',
    'fa-pen-to-square': 'edit-3',
    'fa-edit': 'edit-3',
    'fa-copy': 'copy',
    'fa-clone': 'copy',
    'fa-eye': 'eye',
    'fa-eye-slash': 'eye-off',
    'fa-check': 'check',
    'fa-circle-check': 'check-circle-2',
    'fa-clock': 'clock',
    'fa-triangle-exclamation': 'alert-triangle',
    'fa-circle-exclamation': 'alert-circle',
    'fa-circle-info': 'info',
    'fa-circle-question': 'help-circle',
    'fa-money-bill-wave': 'dollar-sign',
    'fa-wallet': 'wallet',
    'fa-receipt': 'receipt',
    'fa-chart-line': 'trending-up',
    'fa-chart-column': 'bar-chart-3',
    'fa-chart-pie': 'pie-chart',
    'fa-magnifying-glass': 'search',
    'fa-search': 'search',
    'fa-filter': 'filter',
    'fa-download': 'download',
    'fa-upload': 'upload',
    'fa-rotate-right': 'rotate-cw',
    'fa-rotate': 'rotate-cw',
    'fa-refresh': 'rotate-cw',
    'fa-spinner': 'loader-2',
    'fa-cloud-arrow-up': 'upload-cloud',
    'fa-image': 'image',
    'fa-images': 'images',
    'fa-shield-halved': 'shield-check',
    'fa-shield': 'shield',
    'fa-lock': 'lock',
    'fa-unlock': 'unlock',
    'fa-bell': 'bell',
    'fa-info': 'info',
    'fa-sun': 'sun',
    'fa-moon': 'moon',
    'fa-chevron-down': 'chevron-down',
    'fa-chevron-up': 'chevron-up',
    'fa-chevron-right': 'chevron-right',
    'fa-chevron-left': 'chevron-left',
    'fa-arrow-left': 'arrow-left',
    'fa-arrow-right': 'arrow-right',
    'fa-ellipsis': 'more-horizontal',
    'fa-ellipsis-vertical': 'more-vertical',
    'fa-bolt': 'zap',
    'fa-fire': 'flame',
    'fa-trophy': 'trophy',
    'fa-truck': 'truck',
    'fa-truck-fast': 'truck',
    'fa-phone': 'phone',
    'fa-location-dot': 'map-pin',
    'fa-globe': 'globe',
    'fa-link': 'link',
    'fa-hashtag': 'hash',
    'fa-percent': 'percent',
    'fa-ticket': 'ticket',
    'fa-calendar': 'calendar',
    'fa-file-csv': 'file-spreadsheet',
    'fa-file-lines': 'file-text',
    'fa-print': 'printer',
    'fa-key': 'key',
    'fa-database': 'database',
    'fa-server': 'server'
  };

  let lucideLoadingPromise = null;
  function ensureLucideLoaded() {
    if (typeof window.lucide !== 'undefined' && window.lucide.createIcons) {
      return Promise.resolve(window.lucide);
    }
    if (lucideLoadingPromise) return lucideLoadingPromise;

    lucideLoadingPromise = new Promise(resolve => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/lucide@0.469.0/dist/umd/lucide.min.js';
      script.onload = () => resolve(window.lucide);
      script.onerror = () => {
        console.warn('Failed to load Lucide from CDN');
        resolve(null);
      };
      document.head.appendChild(script);
    });
    return lucideLoadingPromise;
  }

  // Rendered Lucide SVGs are kept in localStorage so icons appear in the same frame as the sidebar.
  const ICON_CACHE_KEY = 'haider_admin_icons_v1';
  let iconCache = null;
  function getIconCache() {
    if (!iconCache) {
      try { iconCache = JSON.parse(localStorage.getItem(ICON_CACHE_KEY)) || {}; } catch (e) { iconCache = {}; }
    }
    return iconCache;
  }
  function inlineCachedIcons(root) {
    const cache = getIconCache();
    root.querySelectorAll('i[data-lucide]').forEach(el => {
      const html = cache[el.getAttribute('data-lucide')];
      if (!html) return;
      const tpl = document.createElement('template');
      tpl.innerHTML = html;
      const svg = tpl.content.firstElementChild;
      el.classList.forEach(c => svg.classList.add(c));
      el.replaceWith(svg);
    });
  }
  function saveRenderedIcons(root) {
    const cache = getIconCache();
    let changed = false;
    root.querySelectorAll('svg.lucide').forEach(svg => {
      const cls = [...svg.classList].find(c => c.startsWith('lucide-'));
      if (!cls || cache[cls.slice(7)]) return;
      const clean = svg.cloneNode(true);
      clean.removeAttribute('class');
      clean.setAttribute('class', `lucide ${cls}`);
      cache[cls.slice(7)] = clean.outerHTML;
      changed = true;
    });
    if (changed) {
      try { localStorage.setItem(ICON_CACHE_KEY, JSON.stringify(cache)); } catch (e) { /* ignore */ }
    }
  }

  admin.renderIcons = async function (root = document) {
    // 1. Convert any legacy FontAwesome classes to data-lucide attributes
    const legacyIcons = root.querySelectorAll ? root.querySelectorAll('i[class*="fa-"]') : [];
    legacyIcons.forEach(el => {
      const classList = Array.from(el.classList);
      for (const cls of classList) {
        if (ICON_MAP[cls]) {
          el.setAttribute('data-lucide', ICON_MAP[cls]);
          el.removeAttribute('class');
          break;
        }
      }
    });

    // 2. Use cached SVGs right away (synchronous), then let Lucide draw anything still missing
    inlineCachedIcons(root);
    if (!root.querySelector('i[data-lucide]')) return;
    await ensureLucideLoaded();
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
      saveRenderedIcons(root);
    }
  };

  // Automatic observer to catch dynamic UI insertions and re-render Lucide icons
  let renderIconsTimeout = null;
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(mutations => {
      let needsRender = false;
      for (const m of mutations) {
        if (m.addedNodes && m.addedNodes.length > 0) {
          needsRender = true;
          break;
        }
      }
      if (needsRender) {
        clearTimeout(renderIconsTimeout);
        renderIconsTimeout = setTimeout(() => {
          admin.renderIcons();
        }, 60);
      }
    });
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }

  // =========================================================================
  // 2. SHARED LAYOUT GENERATOR (Finexy Reference Style)
  // =========================================================================
  admin.initLayout = async function (activeKey, pageTitle) {
    let user = readCachedUser();
    if (user) {
      // Known admin in this tab: draw now, confirm the session in the background
      // (requireAuth redirects to the login page itself if it fails).
      admin.currentUser = user;
      admin.requireAuth().then(u => (u ? cacheUser(u) : clearCachedUser()));
    } else {
      user = await admin.requireAuth();
      if (!user) return;
      cacheUser(user);
    }

    const layoutContainer = document.getElementById('adminLayout');
    if (!layoutContainer) return;

    const email = user.email || 'admin@haidersports.pk';
    const initial = (email.charAt(0) || 'A').toUpperCase();

    const navItems = [
      { key: 'dashboard', label: 'Overview', icon: 'layout-dashboard', href: 'dashboard.html' },
      { key: 'orders', label: 'Orders', icon: 'shopping-bag', href: 'orders.html', badgeId: 'badgeOrders' },
      { key: 'products', label: 'Products', icon: 'package', href: 'products.html' },
      { key: 'collections', label: 'Collections', icon: 'folder-tree', href: 'collections.html' },
      { key: 'customers', label: 'Customers', icon: 'users', href: 'customers.html' },
      { key: 'home-content', label: 'Content', icon: 'layers', href: 'home-content.html' },
      { key: 'coupons', label: 'Coupons', icon: 'tag', href: 'coupons.html' },
      { key: 'reviews', label: 'Reviews', icon: 'star', href: 'reviews.html', badgeId: 'badgeReviews' },
      { key: 'blog', label: 'Blog', icon: 'newspaper', href: 'blog.html' },
      { key: 'messages', label: 'Messages', icon: 'mail', href: 'messages.html', badgeId: 'badgeMessages' },
      { key: 'settings', label: 'Settings', icon: 'settings', href: 'settings.html' }
    ];

    // 1. Slim Left Icon Rail
    const railNavHtml = navItems.map(item => `
      <a href="${item.href}" class="admin-nav__link ${item.key === activeKey ? 'active' : ''}" data-tip="${item.label}"${item.key === activeKey ? ' aria-current="page"' : ''}>
        <i data-lucide="${item.icon}"></i>
        <span class="admin-nav__label-text">${item.label}</span>
        ${item.badgeId ? `<span class="admin-nav__badge" id="${item.badgeId}" style="display:none;">0</span>` : ''}
      </a>
    `).join('');

    // 2. Horizontal Floating Pill Navigation (Matching Reference Image)
    const topPillTabsHtml = navItems.map(item => `
      <a href="${item.href}" class="admin-topbar-pill ${item.key === activeKey ? 'active' : ''}">
        <i data-lucide="${item.icon}"></i>
        <span>${item.label}</span>
        ${item.badgeId ? `<span class="admin-topbar-pill__badge" id="top_${item.badgeId}" style="display:none;">0</span>` : ''}
      </a>
    `).join('');

    const layoutHtml = `
      <div class="admin-wrapper">
        <!-- Left sidebar: expanded by default, icon-only when collapsed -->
        <aside class="admin-sidebar" id="adminSidebar" aria-label="Main navigation">
          <div class="admin-sidebar__header">
            <a href="dashboard.html" class="admin-sidebar__logo" aria-label="Haider Sports Admin home">
              <span class="admin-sidebar__mark"><i data-lucide="flame"></i></span>
              <span class="admin-sidebar__brand">HAIDERSPORTS</span>
              <span class="admin-sidebar__badge">ADMIN</span>
            </a>
            <button type="button" class="admin-sidebar__collapse" id="adminSidebarCollapse" aria-label="Collapse sidebar" aria-pressed="false">
              <i data-lucide="chevrons-left"></i>
            </button>
            <button class="admin-sidebar__close" id="adminSidebarClose" aria-label="Close sidebar">
              <i data-lucide="x"></i>
            </button>
          </div>

          <nav class="admin-nav">
            ${railNavHtml}
          </nav>

          <div class="admin-sidebar__footer">
            <a href="guide.html" class="admin-sidebar__btn" data-tip="Help">
              <i data-lucide="help-circle"></i>
              <span class="admin-nav__label-text">Help</span>
            </a>
            <a href="../index.html" target="_blank" rel="noopener" class="admin-sidebar__store-btn" data-tip="View Store">
              <i data-lucide="external-link"></i>
              <span class="admin-nav__label-text">View Store</span>
            </a>
            <button type="button" class="admin-sidebar__logout" id="adminLogoutBtn" data-tip="Sign Out">
              <i data-lucide="log-out"></i>
              <span class="admin-nav__label-text">Sign Out</span>
            </button>
          </div>
        </aside>
        <div class="admin-sidebar-backdrop" id="adminSidebarBackdrop"></div>

        <!-- Main Body -->
        <div class="admin-main">
          <!-- Topbar with Floating Pill Navigation -->
          <header class="admin-topbar">
            <div class="admin-topbar__left">
              <button class="admin-topbar__toggle" id="adminSidebarToggle" aria-label="Toggle navigation">
                <i data-lucide="menu"></i>
              </button>
              <a href="dashboard.html" class="admin-topbar__brand">
                <div class="admin-topbar__brand-icon">
                  <i data-lucide="flame"></i>
                </div>
                <span class="admin-topbar__brand-title">Haider Sports</span>
                <span class="admin-topbar__brand-badge">ADMIN</span>
              </a>
            </div>

            <!-- Horizontal Floating Pill Group (Reference Image Style) -->
            <nav class="admin-topbar-tabs" id="adminTopTabs">
              ${topPillTabsHtml}
            </nav>

            <div class="admin-topbar__right">
              <a href="../index.html" target="_blank" class="admin-topbar__icon-btn" title="View Storefront">
                <i data-lucide="external-link"></i>
              </a>
              <a href="messages.html" class="admin-topbar__icon-btn" title="Messages" id="topbarBellBtn">
                <i data-lucide="bell"></i>
                <span class="admin-topbar__notif-dot" id="topNotifDot" style="display:none;"></span>
              </a>

              <!-- User Profile Pill -->
              <div class="admin-user-pill" id="adminUserPill">
                <div class="admin-user-avatar">${initial}</div>
                <div class="admin-user-meta">
                  <span class="admin-user-name">Admin</span>
                  <span class="admin-user-email" title="${email}">${email}</span>
                </div>
                <i data-lucide="chevron-down" class="admin-user-chevron"></i>

                <!-- Dropdown Menu -->
                <div class="admin-user-dropdown" id="adminUserDropdown">
                  <div class="admin-user-dropdown__header">
                    <strong>${email}</strong>
                    <span>Store Administrator</span>
                  </div>
                  <div class="admin-user-dropdown__divider"></div>
                  <a href="settings.html" class="admin-user-dropdown__item">
                    <i data-lucide="settings"></i>
                    <span>Store Settings</span>
                  </a>
                  <a href="guide.html" class="admin-user-dropdown__item">
                    <i data-lucide="help-circle"></i>
                    <span>Operations Guide</span>
                  </a>
                  <a href="../index.html" target="_blank" class="admin-user-dropdown__item">
                    <i data-lucide="external-link"></i>
                    <span>View Online Store</span>
                  </a>
                  <div class="admin-user-dropdown__divider"></div>
                  <button type="button" class="admin-user-dropdown__item admin-user-dropdown__item--danger" id="dropdownLogoutBtn">
                    <i data-lucide="log-out"></i>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          </header>

          <!-- Dynamic Content Root -->
          <main class="admin-content" id="adminPageContent">
            ${layoutContainer.innerHTML}
          </main>
        </div>
      </div>

      <!-- Toast Notifications Container -->
      <div id="adminToastContainer"></div>

      <!-- Global Confirm Dialog Modal -->
      <div class="admin-modal-backdrop" id="adminConfirmModal">
        <div class="admin-modal" style="max-width: 440px;">
          <div class="admin-modal__header">
            <h3 class="admin-modal__title" id="confirmTitle">Confirm Action</h3>
            <button type="button" class="admin-modal__close" onclick="admin.closeConfirm(false)">
              <i data-lucide="x"></i>
            </button>
          </div>
          <div class="admin-modal__body">
            <p id="confirmMessage" style="color:#52525b; font-size:14px;">Are you sure you want to proceed?</p>
          </div>
          <div class="admin-modal__footer">
            <button type="button" class="btn btn--outline btn--sm" onclick="admin.closeConfirm(false)">Cancel</button>
            <button type="button" class="btn btn--danger btn--sm" id="confirmOkBtn" onclick="admin.closeConfirm(true)">Confirm</button>
          </div>
        </div>
      </div>
    `;

    layoutContainer.innerHTML = layoutHtml;
    layoutContainer.classList.add('admin-ready');

    // Mobile sidebar toggle handlers
    const sidebar = document.getElementById('adminSidebar');
    const toggleBtn = document.getElementById('adminSidebarToggle');
    const closeBtn = document.getElementById('adminSidebarClose');

    const backdrop = document.getElementById('adminSidebarBackdrop');
    const setDrawer = open => sidebar && sidebar.classList.toggle('open', open);

    if (toggleBtn && sidebar) toggleBtn.addEventListener('click', () => setDrawer(true));
    if (closeBtn && sidebar) closeBtn.addEventListener('click', () => setDrawer(false));
    if (backdrop) backdrop.addEventListener('click', () => setDrawer(false));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setDrawer(false); });

    // Desktop: collapse to an icon-only rail; remembered across pages
    const collapseBtn = document.getElementById('adminSidebarCollapse');
    const setCompact = compact => {
      document.body.classList.toggle('sidebar-compact', compact);
      if (collapseBtn) {
        collapseBtn.setAttribute('aria-pressed', String(compact));
        collapseBtn.setAttribute('aria-label', compact ? 'Expand sidebar' : 'Collapse sidebar');
      }
    };
    try { setCompact(localStorage.getItem('haider_sidebar_compact') === '1'); } catch (e) { /* storage blocked: stay expanded */ }
    if (collapseBtn) {
      collapseBtn.addEventListener('click', () => {
        const next = !document.body.classList.contains('sidebar-compact');
        setCompact(next);
        try { localStorage.setItem('haider_sidebar_compact', next ? '1' : '0'); } catch (e) { /* ignore */ }
      });
    }

    // User profile dropdown toggle
    const userPill = document.getElementById('adminUserPill');
    const userDropdown = document.getElementById('adminUserDropdown');
    if (userPill && userDropdown) {
      userPill.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('open');
      });
      document.addEventListener('click', () => {
        userDropdown.classList.remove('open');
      });
    }

    // Sign out handlers
    const logoutBtn = document.getElementById('adminLogoutBtn');
    const dropLogoutBtn = document.getElementById('dropdownLogoutBtn');
    const handleLogout = () => {
      if (confirm('Are you sure you want to log out of Haider Sports Admin?')) {
        admin.logout();
      }
    };
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (dropLogoutBtn) dropLogoutBtn.addEventListener('click', handleLogout);

    // Initial render of Lucide icons
    await admin.renderIcons();

    // Fetch live sidebar badge counts
    admin.refreshBadges();
  };

  // Live sidebar badges
  admin.refreshBadges = async function () {
    const sb = getClient();
    if (!sb) return;

    try {
      // Pending orders
      const { count: pendingOrders } = await sb
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const bOrders = document.getElementById('badgeOrders');
      if (bOrders) {
        if (pendingOrders && pendingOrders > 0) {
          bOrders.textContent = pendingOrders;
          bOrders.style.display = 'inline-block';
        } else {
          bOrders.style.display = 'none';
        }
      }

      // Pending reviews
      const { count: pendingReviews } = await sb
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('is_approved', false);

      const bReviews = document.getElementById('badgeReviews');
      if (bReviews) {
        if (pendingReviews && pendingReviews > 0) {
          bReviews.textContent = pendingReviews;
          bReviews.style.display = 'inline-block';
        } else {
          bReviews.style.display = 'none';
        }
      }

      // Unread messages
      const { count: unreadMsgs } = await sb
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);

      const bMessages = document.getElementById('badgeMessages');
      if (bMessages) {
        if (unreadMsgs && unreadMsgs > 0) {
          bMessages.textContent = unreadMsgs;
          bMessages.style.display = 'inline-block';
        } else {
          bMessages.style.display = 'none';
        }
      }
    } catch (e) {
      // ignore
    }
  };

  // =========================================================================
  // 3. UI HELPERS: TOAST, CONFIRM, MODAL, SLUG
  // =========================================================================
  admin.toast = function (msg, type = 'success') {
    let container = document.getElementById('adminToastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'adminToastContainer';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `admin-toast admin-toast--${type}`;
    const icon = type === 'success' ? 'check-circle-2' : (type === 'error' ? 'alert-circle' : 'info');
    toast.innerHTML = `<i data-lucide="${icon}"></i> <span>${msg}</span>`;

    container.appendChild(toast);
    admin.renderIcons(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  };

  let confirmResolve = null;
  admin.confirm = function (title, message, confirmBtnText = 'Delete') {
    return new Promise(resolve => {
      confirmResolve = resolve;
      const modal = document.getElementById('adminConfirmModal');
      const titleEl = document.getElementById('confirmTitle');
      const msgEl = document.getElementById('confirmMessage');
      const okBtn = document.getElementById('confirmOkBtn');

      if (titleEl) titleEl.textContent = title;
      if (msgEl) msgEl.textContent = message;
      if (okBtn) okBtn.textContent = confirmBtnText;

      if (modal) modal.classList.add('open');
    });
  };

  admin.closeConfirm = function (result) {
    const modal = document.getElementById('adminConfirmModal');
    if (modal) modal.classList.remove('open');
    if (confirmResolve) {
      confirmResolve(result);
      confirmResolve = null;
    }
  };

  admin.modal = function (modalId) {
    const el = document.getElementById(modalId);
    return {
      open: () => el && el.classList.add('open'),
      close: () => el && el.classList.remove('open')
    };
  };
  // Pages call both admin.modal('id').open() and admin.modal.open('id')
  admin.modal.open = id => admin.modal(id).open();
  admin.modal.close = id => admin.modal(id).close();

  admin.escapeHtml = function (s) {
    return String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
  };

  // Catalog images are stored as Unsplash photo ids or full URLs; pages use this to show thumbnails.
  if (typeof window.img !== 'function') {
    window.img = (src, w = 600) => {
      const s = String(src || '').trim();
      if (!s) return `https://images.unsplash.com/photo-1593341646647-75b32930e4a1?w=${w}&q=80`;
      if (/^(https?:|\/|data:)/.test(s)) return s;
      if (s.startsWith('images/') || s.includes('storage/v1/object')) return `${SUPABASE_URL}/storage/v1/object/public/${s}`;
      return `https://images.unsplash.com/photo-${s}?w=${w}&q=80`;
    };
  }

  admin.slugify = function (text) {
    return (text || '')
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  admin.formatRs = function (num) {
    return 'Rs. ' + Number(num || 0).toLocaleString('en-PK');
  };

  admin.formatDate = function (isoString) {
    if (!isoString) return '-';
    const d = new Date(isoString);
    return d.toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Image Upload helper -> Supabase Storage 'images' bucket
  admin.uploadImage = async function (file, folder = 'catalog') {
    const sb = getClient();
    if (!sb) throw new Error('Supabase client not initialized');

    if (!file) throw new Error('No file selected');
    if (file.size > 5 * 1024 * 1024) throw new Error('File exceeds maximum size of 5MB');

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Only JPG, PNG, WEBP, or SVG images are permitted.');
    }

    const ext = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;

    const { data, error } = await sb.storage
      .from('images')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (error) {
      throw error;
    }

    const { data: pubUrlData } = sb.storage.from('images').getPublicUrl(data.path);
    return pubUrlData.publicUrl;
  };

  // Data table with search, sorting, and pagination
  admin.createDataTable = function (config) {
    const {
      data = [],
      pageSize = 20,
      searchFields = [],
      renderRow,
      containerId,
      paginationId,
      searchInputId
    } = config;

    let currentPage = 1;
    let searchQuery = '';
    let sortColumn = null;
    let sortAsc = true;

    function getFilteredData() {
      let filtered = [...data];
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        filtered = filtered.filter(item => {
          return searchFields.some(field => {
            const val = item[field];
            return val && String(val).toLowerCase().includes(q);
          });
        });
      }

      if (sortColumn) {
        filtered.sort((a, b) => {
          const valA = a[sortColumn];
          const valB = b[sortColumn];
          if (valA < valB) return sortAsc ? -1 : 1;
          if (valA > valB) return sortAsc ? 1 : -1;
          return 0;
        });
      }

      return filtered;
    }

    function render() {
      const filtered = getFilteredData();
      const totalPages = Math.ceil(filtered.length / pageSize) || 1;
      if (currentPage > totalPages) currentPage = totalPages;

      const start = (currentPage - 1) * pageSize;
      const pageData = filtered.slice(start, start + pageSize);

      const tbody = document.getElementById(containerId);
      if (tbody) {
        if (pageData.length === 0) {
          tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding:36px; color:#9ca3af;">No records found.</td></tr>`;
        } else {
          tbody.innerHTML = pageData.map((row, idx) => renderRow(row, start + idx)).join('');
        }
      }

      const pagEl = document.getElementById(paginationId);
      if (pagEl) {
        pagEl.innerHTML = `
          <span>Showing ${filtered.length === 0 ? 0 : start + 1} to ${Math.min(start + pageSize, filtered.length)} of ${filtered.length} entries</span>
          <div class="admin-pagination__pages">
            <button class="admin-pagination__btn" ${currentPage === 1 ? 'disabled' : ''} data-p="${currentPage - 1}">
              <i data-lucide="chevron-left"></i>
            </button>
            ${Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .map(p => `
                <button class="admin-pagination__btn ${p === currentPage ? 'active' : ''}" data-p="${p}">${p}</button>
              `).join('')}
            <button class="admin-pagination__btn" ${currentPage === totalPages ? 'disabled' : ''} data-p="${currentPage + 1}">
              <i data-lucide="chevron-right"></i>
            </button>
          </div>
        `;

        pagEl.querySelectorAll('[data-p]').forEach(btn => {
          btn.addEventListener('click', () => {
            const p = parseInt(btn.dataset.p, 10);
            if (p >= 1 && p <= totalPages) {
              currentPage = p;
              render();
            }
          });
        });
      }
      admin.renderIcons(tbody);
    }

    if (searchInputId) {
      const searchInput = document.getElementById(searchInputId);
      if (searchInput) {
        searchInput.addEventListener('input', e => {
          searchQuery = e.target.value;
          currentPage = 1;
          render();
        });
      }
    }

    render();

    return {
      setData: (newData) => {
        data.length = 0;
        data.push(...newData);
        render();
      },
      refresh: render
    };
  };

  admin.emptyState = function (title, subtitle, actionHtml = '') {
    return `
      <div class="admin-empty-state">
        <i data-lucide="folder-open"></i>
        <h4>${title}</h4>
        <p>${subtitle}</p>
        ${actionHtml}
      </div>
    `;
  };

})();
