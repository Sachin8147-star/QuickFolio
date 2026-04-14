/* ════════ APP.JS — main controller ════════ */

const PAGE = window.APP_CONFIG?.page || 'landing';
const ASSET_VERSION = '20260414quickfolio3';
const PREFETCHED_PATHS = new Set();
const LOADED_STYLE_IDS = new Set();
let _commandActions = [];
let _commandCenterOpen = false;
let _perfModeEnabled = false;

function runWhenIdle(task, timeout = 1200) {
  if (typeof task !== 'function') return;
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => task(), { timeout });
  } else {
    setTimeout(task, Math.min(timeout, 350));
  }
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', async () => {
  initPerformanceMode();
  initNavDynamics();
  initScrollProgressBar();
  initCommandCenter();
  initSmartLinkPrefetch();
  registerServiceWorker();

  await ensurePageStyles();

  // Init auth (updates nav)
  await Auth.init();
  refreshCommandCenterActions();

  // Render page content
  await renderCurrentPage();

  // Init global chatbot (not on auth pages or builder)
  if (!['login','signup','builder','resume-editor'].includes(PAGE)) {
    runWhenIdle(() => {
      if (typeof Chatbot !== 'undefined' && Chatbot?.init) Chatbot.init('global-chatbot');
    }, 1400);
  }

  // Update live stats from API
  runWhenIdle(updateLiveStats, 900);

  schedulePageMotionInit();

  // Ensure top nav/mobile links always navigate reliably.
  bindPrimaryNavLinks();

  // Warm likely next routes for snappier navigation from the first screen.
  if (PAGE === 'landing') {
    runWhenIdle(() => {
      ['/signup', '/templates', '/pricing', '/about', '/privacy', '/terms'].forEach((path) => prefetchPath(path));
    }, 1300);
  }
});

function bindPrimaryNavLinks() {
  document.querySelectorAll('#nav a[href], #mob-menu a[href]').forEach(a => {
    if (a.dataset.navBound === '1') return;
    a.dataset.navBound = '1';

    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href') || '';
      if (!href.startsWith('/')) return;
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      window.location.assign(href);
    });
  });
}

function initNavDynamics() {
  const nav = document.getElementById('nav');
  if (!nav) return;

  let frame = null;
  const updateNavState = () => {
    nav.classList.toggle('nav-scrolled', window.scrollY > 14);
    frame = null;
  };

  const onScroll = () => {
    if (frame !== null) return;
    frame = requestAnimationFrame(updateNavState);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  updateNavState();
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') return;

  runWhenIdle(() => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Ignore registration failures in unsupported/strict environments.
    });
  }, 1800);
}

function ensureStylesheet(id, href) {
  if (!id || !href) return Promise.resolve();
  if (LOADED_STYLE_IDS.has(id) || document.getElementById(id)) {
    LOADED_STYLE_IDS.add(id);
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = `${href}${href.includes('?') ? '&' : '?'}v=${encodeURIComponent(ASSET_VERSION)}`;
    link.onload = () => {
      LOADED_STYLE_IDS.add(id);
      resolve();
    };
    link.onerror = () => resolve();
    document.head.appendChild(link);
  });
}

async function ensurePageStyles() {
  const needsBuilderStyles = ['builder', 'resume-editor'].includes(PAGE);
  const needsChatStyles = !['login', 'signup', 'builder', 'resume-editor'].includes(PAGE);

  const tasks = [];
  if (needsBuilderStyles) tasks.push(ensureStylesheet('builder-page-styles', '/static/css/builder.css'));
  if (needsChatStyles) tasks.push(ensureStylesheet('chatbot-page-styles', '/static/css/chatbot.css'));
  await Promise.all(tasks);
}

function prefetchPath(path) {
  const href = String(path || '').trim();
  if (!href || PREFETCHED_PATHS.has(href)) return;
  if (!href.startsWith('/')) return;
  if (href.startsWith('/api/')) return;

  PREFETCHED_PATHS.add(href);
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  link.as = 'document';
  document.head.appendChild(link);
}

function initSmartLinkPrefetch() {
  const handler = (event) => {
    const anchor = event.target?.closest?.('a[href]');
    if (!anchor) return;
    const href = anchor.getAttribute('href') || '';
    if (!href.startsWith('/')) return;
    prefetchPath(href);
  };

  document.addEventListener('mouseover', handler, { passive: true });
  document.addEventListener('focusin', handler);
}

function optimizeImagesForPerformance() {
  const images = [...document.querySelectorAll('img')];
  if (!images.length) return;

  images.forEach((img, idx) => {
    if (img.dataset.perfOptimized === '1') return;
    img.dataset.perfOptimized = '1';

    const nearViewport = img.getBoundingClientRect().top < (window.innerHeight * 1.15);
    const shouldEager = idx < 2 && nearViewport;

    img.decoding = 'async';
    if (!shouldEager) {
      img.loading = 'lazy';
      img.fetchPriority = 'low';
    } else {
      img.loading = 'eager';
      img.fetchPriority = 'high';
    }
  });
}

function initPerformanceMode() {
  const stored = localStorage.getItem('quickfolio.performance.mode') || localStorage.getItem('QuickFolio.performance.mode') || '';
  if (stored === '1' || stored === '0') {
    _perfModeEnabled = stored === '1';
  } else {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const effectiveType = String(connection?.effectiveType || '').toLowerCase();
    const saveData = Boolean(connection?.saveData);
    _perfModeEnabled = saveData || effectiveType.includes('2g') || effectiveType === 'slow-2g';
  }
  document.body.classList.toggle('perf-mode', _perfModeEnabled);
}

function togglePerformanceMode(forceValue) {
  _perfModeEnabled = typeof forceValue === 'boolean' ? forceValue : !_perfModeEnabled;
  localStorage.setItem('quickfolio.performance.mode', _perfModeEnabled ? '1' : '0');
  document.body.classList.toggle('perf-mode', _perfModeEnabled);
  refreshCommandCenterActions();
  schedulePageMotionInit();
  Toast.info(_perfModeEnabled ? 'Performance mode enabled' : 'Performance mode disabled');
}

function initScrollProgressBar() {
  if (document.getElementById('scroll-progress')) return;
  const bar = document.createElement('div');
  bar.id = 'scroll-progress';
  document.body.appendChild(bar);

  let frame = null;
  const update = () => {
    const doc = document.documentElement;
    const max = Math.max((doc.scrollHeight - doc.clientHeight), 1);
    const pct = Math.min(100, Math.max(0, (window.scrollY / max) * 100));
    bar.style.width = `${pct}%`;
    frame = null;
  };

  const requestUpdate = () => {
    if (frame !== null) return;
    frame = requestAnimationFrame(update);
  };

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  update();
}

function initCommandCenter() {
  const root = document.getElementById('command-center-root');
  if (!root || root.dataset.ready === '1') return;

  root.dataset.ready = '1';
  root.innerHTML = `
    <button id="command-fab" class="command-fab" type="button" aria-haspopup="dialog" aria-controls="command-center-modal" aria-label="Open quick actions">⚡ Quick Actions</button>
    <div id="command-center-modal" class="command-modal" aria-hidden="true">
      <div class="command-overlay" id="command-overlay"></div>
      <div class="command-panel" role="dialog" aria-modal="true" aria-labelledby="command-title">
        <div class="command-head">
          <div>
            <div id="command-title" class="command-title">QuickFolio Command Center</div>
            <div class="command-sub">Shortcut: Ctrl + Shift + J</div>
          </div>
          <button type="button" class="command-close" id="command-close" aria-label="Close quick actions">✕</button>
        </div>
        <label class="command-search-wrap" for="command-search">
          <input id="command-search" class="command-search" type="search" placeholder="Search actions: builder, resume, billing, performance" autocomplete="off" />
        </label>
        <div class="command-list" id="command-list"></div>
      </div>
    </div>
  `;

  const search = document.getElementById('command-search');
  const fab = document.getElementById('command-fab');
  const closeBtn = document.getElementById('command-close');
  const overlay = document.getElementById('command-overlay');

  if (fab) fab.addEventListener('click', openCommandCenter);
  if (closeBtn) closeBtn.addEventListener('click', closeCommandCenter);
  if (overlay) overlay.addEventListener('click', closeCommandCenter);
  if (search) {
    search.addEventListener('input', () => applyCommandCenterFilter(search.value));
  }

  document.addEventListener('keydown', (event) => {
    const isShortcut = (event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'j';
    if (isShortcut) {
      event.preventDefault();
      if (_commandCenterOpen) closeCommandCenter();
      else openCommandCenter();
      return;
    }

    if (event.key === 'Escape' && _commandCenterOpen) {
      closeCommandCenter();
    }
  });

  refreshCommandCenterActions();
}

function refreshCommandCenterActions() {
  _commandActions = [
    { label: 'Go to Home', hint: 'Landing and product overview', run: () => window.location.assign('/') },
    { label: 'Open Templates', hint: 'Browse marketplace templates', run: () => window.location.assign('/templates') },
    { label: 'Open Pricing', hint: 'Compare membership plans', run: () => window.location.assign('/pricing') },
    { label: 'Open Manual', hint: 'Feature docs and troubleshooting', run: () => window.location.assign('/manual') },
    { label: 'Open About', hint: 'Story, team, and stack', run: () => window.location.assign('/about') },
    { label: 'Open Privacy Policy', hint: 'Data and tracking policy', run: () => window.location.assign('/privacy') },
    { label: 'Open Terms of Service', hint: 'Platform terms and usage rules', run: () => window.location.assign('/terms') },
    { label: 'Email QuickFolio', hint: 'Contact support directly', run: () => window.location.assign('mailto:Ks6911843@gmail.com?subject=QuickFolio%20Website%20Inquiry') },
    {
      label: _perfModeEnabled ? 'Disable Performance Mode' : 'Enable Performance Mode',
      hint: 'Reduce visual noise and motion for speed',
      run: () => togglePerformanceMode(),
    },
  ];

  if (Auth?.user) {
    _commandActions.unshift(
      { label: 'Open Dashboard', hint: 'Workspace overview', run: () => window.location.assign('/dashboard') },
      { label: 'Open Builder', hint: 'Edit portfolio sections', run: () => window.location.assign('/builder') },
      { label: 'Open Resume Editor', hint: 'Edit and export resume PDF', run: () => window.location.assign('/resume-editor') },
      { label: 'Open Billing', hint: 'Plan and invoices', run: () => window.location.assign('/billing') }
    );
  }

  if (!['builder', 'resume-editor'].includes(PAGE) && typeof Chatbot !== 'undefined') {
    _commandActions.push({
      label: 'Toggle AI Chatbot',
      hint: 'Open or close assistant panel',
      run: () => {
        closeCommandCenter();
        if (Chatbot?.toggle) Chatbot.toggle();
      },
    });
  }

  if (window.PerfVitals?.getSnapshot) {
    _commandActions.push({
      label: 'Show Web Vitals Snapshot',
      hint: 'View current page LCP, INP, CLS and quality status',
      run: () => showWebVitalsSnapshot(),
    });
  }

  if (PAGE === 'landing') {
    _commandActions.push({
      label: 'Jump to Pricing Section',
      hint: 'Scroll directly to pricing',
      run: () => {
        closeCommandCenter();
        document.querySelector('.pricing-sec')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      },
    });
  }

  renderCommandCenterList(_commandActions);
}

function renderCommandCenterList(list) {
  const host = document.getElementById('command-list');
  if (!host) return;

  if (!Array.isArray(list) || !list.length) {
    host.innerHTML = '<div class="command-empty">No matching actions.</div>';
    return;
  }

  host.innerHTML = list.map((item, idx) => `
    <button type="button" class="command-item" data-command-idx="${idx}">
      <span class="command-item-title">${item.label}</span>
      <span class="command-item-hint">${item.hint}</span>
    </button>
  `).join('');

  host.querySelectorAll('.command-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.getAttribute('data-command-idx'));
      const action = list[idx];
      if (!action || typeof action.run !== 'function') return;
      action.run();
    });
  });
}

function applyCommandCenterFilter(query) {
  const needle = String(query || '').trim().toLowerCase();
  if (!needle) {
    renderCommandCenterList(_commandActions);
    return;
  }

  const filtered = _commandActions.filter((item) => {
    const haystack = `${item.label} ${item.hint}`.toLowerCase();
    return haystack.includes(needle);
  });

  renderCommandCenterList(filtered);
}

function openCommandCenter() {
  const modal = document.getElementById('command-center-modal');
  const search = document.getElementById('command-search');
  if (!modal) return;
  _commandCenterOpen = true;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('command-open');
  if (search) {
    search.value = '';
    applyCommandCenterFilter('');
    setTimeout(() => search.focus(), 0);
  }
}

function closeCommandCenter() {
  const modal = document.getElementById('command-center-modal');
  if (!modal) return;
  _commandCenterOpen = false;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('command-open');
}

function showWebVitalsSnapshot() {
  if (!window.PerfVitals?.getSnapshot) {
    Toast.error('Web vitals are not available on this page.');
    return;
  }

  const snapshot = window.PerfVitals.getSnapshot();
  const metrics = snapshot?.metrics || {};
  const ratings = snapshot?.ratings || {};

  const fmtMs = (value) => (value === null || value === undefined ? '--' : `${Math.round(Number(value))}ms`);
  const fmtCls = (value) => (value === null || value === undefined ? '--' : Number(value).toFixed(3));

  const summary = `LCP ${fmtMs(metrics.lcp_ms)} (${ratings.lcp || 'unknown'}) | INP ${fmtMs(metrics.inp_ms)} (${ratings.inp || 'unknown'}) | CLS ${fmtCls(metrics.cls)} (${ratings.cls || 'unknown'})`;
  Toast.info(summary, 9000);
  if (console && typeof console.table === 'function') {
    console.table({
      page: snapshot.page_path,
      page_type: snapshot.page_type,
      lcp_ms: metrics.lcp_ms,
      inp_ms: metrics.inp_ms,
      cls: metrics.cls,
      fcp_ms: metrics.fcp_ms,
      ttfb_ms: metrics.ttfb_ms,
      lcp_status: ratings.lcp,
      inp_status: ratings.inp,
      cls_status: ratings.cls,
    });
  }
}

let _pageMotionTimer = null;
let _pageMotionObserver = null;

function schedulePageMotionInit() {
  if (_pageMotionTimer) clearTimeout(_pageMotionTimer);
  _pageMotionTimer = setTimeout(initPageMotion, 50);
}

function initPageMotion() {
  const prefersReduced = _perfModeEnabled || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const selectors = [
    '.card', '.price-card', '.tpl-card', '.testi-card', '.manual-card', '.team-card',
    '.stat-card', '.chart-wrap', '.my-template-row', '.billing-plan-card', '.resume-row-card',
    '.th-card', '.home-proof-item', '.feat-card', '.manual-flow', '.auth-card', '.toast'
  ];

  const nodes = [];
  selectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((node) => {
      if (!nodes.includes(node)) nodes.push(node);
    });
  });

  if (_pageMotionObserver) {
    _pageMotionObserver.disconnect();
    _pageMotionObserver = null;
  }

  nodes.forEach((node, idx) => {
    node.style.setProperty('--motion-delay', `${Math.min((idx % 10) * 55, 420)}ms`);
    if (!node.classList.contains('motion-reveal')) node.classList.add('motion-reveal');
    if (prefersReduced) node.classList.add('motion-in');
    else node.classList.remove('motion-in');
  });

  if (prefersReduced || !nodes.length) return;

  _pageMotionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('motion-in');
      _pageMotionObserver.unobserve(entry.target);
    });
  }, { threshold: 0.16 });

  nodes.forEach((node) => _pageMotionObserver.observe(node));
}

async function renderCurrentPage() {
  const main = document.getElementById('main-content');
  if (!main) return;

  switch (PAGE) {
    case 'landing':
      main.innerHTML = renderLanding();
      renderThemeShowcase();
      setTimeout(animateHeroCounters, 400);
      if (typeof initPricingWidgets === 'function') initPricingWidgets('landing');
      break;
    case 'login':
      main.innerHTML = renderLoginPage();
      if (typeof handleAuthQueryState === 'function') handleAuthQueryState();
      break;
    case 'signup':
      main.innerHTML = renderSignupPage();
      break;
    case 'dashboard':
      if (!Auth.user) { window.location.href = '/login'; return; }
      main.innerHTML = await renderDashboard(Auth.user);
      loadDashboard();
      break;
    case 'builder':
      if (!Auth.user) { window.location.href = '/login'; return; }
      main.innerHTML = renderBuilderShell();
      await initBuilder();
      break;
    case 'resume-editor':
      if (!Auth.user) { window.location.href = '/login'; return; }
      main.innerHTML = renderResumeEditorPage();
      if (typeof initResumeEditorPage === 'function') await initResumeEditorPage();
      break;
    case 'templates':
      main.innerHTML = await renderTemplates();
      if (typeof initTemplateFilters === 'function') initTemplateFilters();
      break;
    case 'pricing':
      main.innerHTML = renderPricing();
      if (typeof initPricingWidgets === 'function') initPricingWidgets('pricing');
      break;
    case 'billing':
      if (!Auth.user) { window.location.href = '/login'; return; }
      main.innerHTML = renderBillingPage();
      if (typeof loadBillingPage === 'function') loadBillingPage();
      break;
    case 'admin':
      if (!Auth.user) { window.location.href = '/login'; return; }
      if (!Auth.user.is_admin) { window.location.href = '/dashboard'; return; }
      main.innerHTML = renderAdminPage();
      if (typeof loadAdminPage === 'function') loadAdminPage();
      break;
    case 'docs':
    case 'manual':
      main.innerHTML = renderManual();
      if (typeof initManualPage === 'function') initManualPage();
      break;
    case 'about':
      main.innerHTML = renderAbout();
      break;
    case 'privacy':
      main.innerHTML = renderPrivacyPolicy();
      break;
    case 'terms':
      main.innerHTML = renderTermsOfService();
      break;
    default:
      main.innerHTML = `<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding-top:var(--nav-h)"><div class="tc"><h1 class="grad-text font-d" style="font-size:4rem">404</h1><p style="color:var(--muted)">Page not found</p><a href="/" class="btn btn-primary mt16">← Home</a></div></div>`;
  }

  schedulePageMotionInit();
  optimizeImagesForPerformance();
  if (PAGE === 'landing') initLandingGrowthLab();
  refreshCommandCenterActions();
}

// ── BUILDER SHELL ──
function renderBuilderShell() {
  return `
  <div class="builder-wrap" id="builder-wrap">
    <aside class="b-side" id="b-sidebar">
      <div class="b-side-head">
        <div class="b-side-title grad-text">Portfolio Editor</div>
        <div style="display:flex;gap:6px;align-items:center">
          <div id="save-indicator" style="display:none;font-size:.68rem;color:var(--a3);font-weight:700">✓ Saved</div>
          <button class="btn btn-primary btn-sm" onclick="openExportModal()" style="padding:5px 10px;font-size:.66rem">🚀 Export</button>
        </div>
      </div>
      <div class="b-tabs">
        <button class="b-tab active" data-tab="sections" onclick="switchBTab('sections',this)"><span class="b-tab-ico">⚡</span><span>Sections</span></button>
        <button class="b-tab" data-tab="themes" onclick="switchBTab('themes',this)"><span class="b-tab-ico">🎨</span><span>Themes</span></button>
        <button class="b-tab" data-tab="content" onclick="switchBTab('content',this)"><span class="b-tab-ico">✏️</span><span>Edit</span></button>
        <button class="b-tab" data-tab="settings" onclick="switchBTab('settings',this)"><span class="b-tab-ico">⚙️</span><span>Config</span></button>
      </div>
      <div class="b-panel" id="panel-sections">
        <div style="font-size:.62rem;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.8px;margin-bottom:9px">Drag to reorder · Click to edit</div>
        <div id="sec-list"></div>
        <div class="sec-add-hint">➕ Add Section</div>
        <div id="sec-add-list"></div>
      </div>
      <div class="b-panel hidden" id="panel-themes"><div style="font-size:.62rem;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px">Choose your aesthetic</div><div class="b-theme-g" id="theme-grid"></div></div>
      <div class="b-panel hidden" id="panel-content">
        <div class="content-sec-tabs" id="content-sec-tabs" style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:11px"></div>
        <div id="editor-panel"></div>
      </div>
      <div class="b-panel hidden" id="panel-settings">
        <div class="inp-group"><label class="inp-label">Your Full Name</label><input class="inp" id="set-name" oninput="settingChanged('name',this.value)"></div>
        <div class="inp-group"><label class="inp-label">Job Title</label><input class="inp" id="set-title" oninput="settingChanged('title',this.value)"></div>
        <div class="inp-group"><label class="inp-label">Location</label><input class="inp" id="set-loc" oninput="settingChanged('loc',this.value)"></div>
        <div class="inp-group"><label class="inp-label">Your Email (for notifications)</label><input class="inp" id="set-email" oninput="settingChanged('email',this.value)"></div>
        <div class="ep mt16">
          <div class="ep-title">🖼 Profile & Design Controls</div>
          <div class="inp-group"><label class="inp-label">Profile Photo URL</label><input class="inp" id="set-photo-url" placeholder="/static/uploads/your-photo.jpg" oninput="settingChanged('photo_url',this.value)"></div>
          <div class="inp-group"><label class="inp-label">Upload Profile Photo</label><input class="inp" id="set-photo-file" type="file" accept="image/*" onchange="handleProfilePhotoUpload(this)"></div>
          <div class="inp-group"><label class="inp-label">Photo Size: <span id="set-photo-size-val">170</span>px</label><input class="inp" id="set-photo-size" type="range" min="90" max="280" step="1" oninput="settingChanged('photo_size',this.value)"></div>
          <div class="inp-group"><label class="inp-label">Photo X Position: <span id="set-photo-posx-val">0</span>px</label><input class="inp" id="set-photo-posx" type="range" min="-160" max="160" step="1" oninput="settingChanged('photo_offset_x',this.value)"></div>
          <div class="inp-group"><label class="inp-label">Photo Y Position: <span id="set-photo-posy-val">0</span>px</label><input class="inp" id="set-photo-posy" type="range" min="-160" max="160" step="1" oninput="settingChanged('photo_offset_y',this.value)"></div>
          <div style="color:var(--muted2);font-size:.68rem;margin:-4px 0 8px">Tip: You can also drag the hero photo directly in live preview.</div>
          <label style="display:flex;align-items:center;gap:8px;background:var(--card);border:1px solid var(--border);padding:8px 10px;border-radius:10px;margin-bottom:9px;color:var(--muted);font-size:.74rem;font-weight:700">
            <input type="checkbox" id="set-recruiter-default" onchange="settingChanged('recruiter_mode_enabled',this.checked ? '1' : '0')">
            Enable Recruiter Mode by default on public portfolio
          </label>

          <div class="inp-group"><label class="inp-label">Background Image URL</label><input class="inp" id="set-bg-url" placeholder="https://... or /static/uploads/..." oninput="settingChanged('bg_image_url',this.value)"></div>
          <div class="inp-group"><label class="inp-label">Upload Background Image</label><input class="inp" id="set-bg-file" type="file" accept="image/*" onchange="handleBackgroundUpload(this)"></div>
          <div class="inp-group"><label class="inp-label">Background Zoom: <span id="set-bg-size-val">100</span>%</label><input class="inp" id="set-bg-size" type="range" min="60" max="220" step="1" oninput="settingChanged('bg_size',this.value)"></div>
          <div class="inp-group"><label class="inp-label">Background Dark Overlay: <span id="set-bg-overlay-val">45</span>%</label><input class="inp" id="set-bg-overlay" type="range" min="0" max="90" step="1" oninput="settingChanged('bg_overlay',this.value)"></div>
          <div class="inp-group"><label class="inp-label">Background X Position: <span id="set-bg-posx-val">50</span>%</label><input class="inp" id="set-bg-posx" type="range" min="0" max="100" step="1" oninput="settingChanged('bg_pos_x',this.value)"></div>
          <div class="inp-group"><label class="inp-label">Background Y Position: <span id="set-bg-posy-val">50</span>%</label><input class="inp" id="set-bg-posy" type="range" min="0" max="100" step="1" oninput="settingChanged('bg_pos_y',this.value)"></div>

          <div class="inp-group"><label class="inp-label">Text Scale: <span id="set-text-scale-val">100</span>%</label><input class="inp" id="set-text-scale" type="range" min="85" max="140" step="1" oninput="settingChanged('text_scale',this.value)"></div>
          <div class="inp-group"><label class="inp-label">Heading Scale: <span id="set-heading-scale-val">100</span>%</label><input class="inp" id="set-heading-scale" type="range" min="80" max="145" step="1" oninput="settingChanged('heading_scale',this.value)"></div>
          <div class="inp-group"><label class="inp-label">Body Scale: <span id="set-body-scale-val">100</span>%</label><input class="inp" id="set-body-scale" type="range" min="80" max="145" step="1" oninput="settingChanged('body_scale',this.value)"></div>
          <div class="inp-group"><label class="inp-label">Section Spacing: <span id="set-section-spacing-val">80</span>px</label><input class="inp" id="set-section-spacing" type="range" min="45" max="130" step="1" oninput="settingChanged('section_spacing',this.value)"></div>
          <div class="inp-group"><label class="inp-label">Card Corner Radius: <span id="set-card-radius-val">16</span>px</label><input class="inp" id="set-card-radius" type="range" min="8" max="32" step="1" oninput="settingChanged('card_radius',this.value)"></div>
          <div class="inp-group"><label class="inp-label">Custom Theme Name</label><input class="inp" id="set-custom-theme-name" placeholder="My Custom Theme" oninput="settingChanged('custom_theme_name',this.value)"></div>
          <div class="inp-group"><label class="inp-label">Text Color</label><input class="inp" id="set-text-color" type="color" oninput="settingChanged('text_color',this.value)"></div>
          <div class="inp-group"><label class="inp-label">Accent Color</label><input class="inp" id="set-accent-color" type="color" oninput="settingChanged('accent_color',this.value)"></div>
          <div class="inp-group"><label class="inp-label">Accent 2 Color</label><input class="inp" id="set-accent2-color" type="color" oninput="settingChanged('accent2_color',this.value)"></div>
          <div class="inp-group"><label class="inp-label">Background Color</label><input class="inp" id="set-bg-color" type="color" oninput="settingChanged('bg_color',this.value)"></div>
          <div class="inp-group"><label class="inp-label">Surface Color</label><input class="inp" id="set-surface-color" type="color" oninput="settingChanged('surface_color',this.value)"></div>
          <div class="inp-group"><label class="inp-label">Card Color</label><input class="inp" id="set-card-color" type="color" oninput="settingChanged('card_color',this.value)"></div>
          <div class="inp-group"><label class="inp-label">Border Color</label><input class="inp" id="set-border-color" type="color" oninput="settingChanged('border_color',this.value)"></div>
          <div class="inp-group"><label class="inp-label">Border 2 Color</label><input class="inp" id="set-border2-color" type="color" oninput="settingChanged('border2_color',this.value)"></div>
          <div class="inp-group"><label class="inp-label">Muted Text Color</label><input class="inp" id="set-muted-color" type="color" oninput="settingChanged('muted_color',this.value)"></div>

          <div class="inp-group"><label class="inp-label">Heading Font</label>
            <select class="inp" id="set-heading-font" onchange="settingChanged('heading_font',this.value)">
              <option value="default">Theme Default</option>
              <option value="Orbitron">Orbitron</option>
              <option value="Syne">Syne</option>
              <option value="Outfit">Outfit</option>
              <option value="DM Mono">DM Mono</option>
              <option value="Manrope">Manrope</option>
              <option value="Sora">Sora</option>
              <option value="Space Grotesk">Space Grotesk</option>
              <option value="Fraunces">Fraunces</option>
            </select>
          </div>
          <div class="inp-group"><label class="inp-label">Body Font</label>
            <select class="inp" id="set-body-font" onchange="settingChanged('body_font',this.value)">
              <option value="default">Theme Default</option>
              <option value="Outfit">Outfit</option>
              <option value="Syne">Syne</option>
              <option value="DM Mono">DM Mono</option>
              <option value="Orbitron">Orbitron</option>
              <option value="Manrope">Manrope</option>
              <option value="Sora">Sora</option>
              <option value="Space Grotesk">Space Grotesk</option>
              <option value="Fraunces">Fraunces</option>
            </select>
          </div>

          <div class="ep" style="margin:10px 0 6px;padding:10px;border-style:dashed">
            <div style="font-size:.66rem;color:var(--muted);font-weight:700;letter-spacing:.6px;text-transform:uppercase;margin-bottom:8px">Per-Section Text Scale</div>
            <div id="set-section-scale-grid"></div>
            <div style="font-size:.66rem;color:var(--muted);font-weight:700;letter-spacing:.6px;text-transform:uppercase;margin:10px 0 8px">Per-Section Font Family</div>
            <div id="set-section-font-grid"></div>
          </div>

          <div class="ep" style="margin:10px 0 6px;padding:10px;border-style:dashed">
            <div style="font-size:.66rem;color:var(--muted);font-weight:700;letter-spacing:.6px;text-transform:uppercase;margin-bottom:8px">Design Presets</div>
            <div class="inp-group" style="margin-bottom:8px">
              <label class="inp-label">Preset Name</label>
              <input class="inp" id="set-preset-name" placeholder="e.g. Recruiter Clean">
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
              <button class="btn btn-primary btn-sm" onclick="saveCurrentDesignPreset()">💾 Save Preset</button>
            </div>
            <div id="set-preset-list"></div>
          </div>

          <div class="ep" style="margin:10px 0 6px;padding:10px;border-style:dashed">
            <div style="font-size:.66rem;color:var(--muted);font-weight:700;letter-spacing:.6px;text-transform:uppercase;margin-bottom:8px">AI Resume Tailoring (2026)</div>
            <div class="inp-group" style="margin-bottom:8px">
              <label class="inp-label">Job Description URL (optional)</label>
              <input class="inp" id="set-tailor-job-url" placeholder="https://company.com/careers/job-post">
            </div>
            <div class="inp-group" style="margin-bottom:8px">
              <label class="inp-label">Job Description Text</label>
              <textarea class="inp" id="set-tailor-job-text" rows="4" placeholder="Paste role requirements here for more accurate tailoring..."></textarea>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
              <button class="btn btn-primary btn-sm" onclick="analyzeResumeTailoring()">🎯 Analyze Role Fit</button>
              <button class="btn btn-outline btn-sm" onclick="downloadTailoredResumePdf()">📄 Download Tailored PDF</button>
              <button class="btn btn-ghost btn-sm" onclick="applyTailoringToProfile()">⚡ Apply Suggestions</button>
            </div>
            <div id="resume-tailor-output" style="color:var(--muted2);font-size:.71rem">Run analysis to get job-specific headline, summary, and skill-gap guidance.</div>
          </div>

          <button class="btn btn-outline btn-sm" onclick="resetDesignControls()" style="margin-top:4px">↺ Reset Design Customization</button>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
          <button class="btn btn-success btn-sm" onclick="savePortfolioToServer()">💾 Save to Server</button>
          <button class="btn btn-outline btn-sm" onclick="togglePublish()">🌐 Publish</button>
        </div>
        <div class="ep mt16">
          <div class="ep-title">✅ Active Features</div>
          <div class="settings-feat" id="feat-list"></div>
        </div>
      </div>
    </aside>
    <main class="b-canvas">
      <div class="canvas-bar">
        <button onclick="document.getElementById('b-sidebar').classList.toggle('collapsed')" class="dev-btn">☰</button>
        <span class="canvas-lbl">Live Preview</span>
        <button class="dev-btn" id="preview-only-btn" onclick="toggleBuilderPreviewOnlyMode()" aria-pressed="false">✍️ <span>Inline Only</span></button>
        <button class="dev-btn active" onclick="setDevice('desktop',this)">🖥 <span>Desktop</span></button>
        <button class="dev-btn" onclick="setDevice('tablet',this)">📱 <span>Tablet</span></button>
        <button class="dev-btn" onclick="setDevice('mobile',this)">📱 <span>Mobile</span></button>
        <div id="pub-status" style="margin-left:4px"></div>
        <button class="btn btn-primary btn-sm" onclick="openExportModal()" style="margin-left:auto;flex-shrink:0">🚀 Export</button>
      </div>
      <div class="canvas-frame">
        <div class="canvas-wrap desktop" id="canvas-wrap">
          <div id="portfolio-canvas"></div>
        </div>
      </div>
    </main>
  </div>

  <!-- Export Modal -->
  <div class="modal-ov" id="export-modal">
    <div class="modal">
      <div class="modal-head"><h3 class="modal-title grad-text">🚀 Export Portfolio</h3><button class="modal-close" onclick="document.getElementById('export-modal').classList.remove('open')">✕</button></div>
      <div class="modal-body">
        <div style="display:flex;gap:7px;margin-bottom:16px;flex-wrap:wrap">
          <button class="btn btn-primary btn-sm" id="em-gh" onclick="setExportMode('github',this)">⚡ GitHub Pages</button>
          <button class="btn btn-ghost btn-sm" id="em-code" onclick="setExportMode('code',this)">📋 Copy Code</button>
          <button class="btn btn-ghost btn-sm" id="em-dl" onclick="setExportMode('download',this)">📦 Download</button>
        </div>
        <div id="export-github">
          <div class="export-step"><div class="exp-num">1</div><div class="exp-txt">Create repo: <span class="exp-code">yourusername.github.io</span></div></div>
          <div class="export-step"><div class="exp-num">2</div><div class="exp-txt">Download and save as <span class="exp-code">index.html</span></div></div>
          <div class="export-step"><div class="exp-num">3</div><div class="exp-txt"><span class="exp-code">git add . && git commit -m "Launch" && git push</span></div></div>
          <div class="export-step"><div class="exp-num">4</div><div class="exp-txt"><span class="exp-code">Settings → Pages → main branch → Save</span></div></div>
          <div class="export-step"><div class="exp-num">5</div><div class="exp-txt">🎉 Live at <span class="exp-code">https://yourusername.github.io</span></div></div>
          <button class="btn btn-primary w100 mt16" onclick="downloadPortfolio()">⬇️ Download portfolio.html</button>
        </div>
        <div id="export-code" style="display:none">
          <div class="code-prev" id="code-prev-content"></div>
          <button class="btn btn-primary w100" id="copy-btn" onclick="copyPortfolioCode()">📋 Copy to Clipboard</button>
        </div>
        <div id="export-download" style="display:none">
          <div class="tc" style="padding:20px 0"><div style="font-size:3rem;margin-bottom:10px">📦</div><p style="color:var(--muted);font-size:.88rem;margin-bottom:18px">Single HTML file. Host anywhere.</p><button class="btn btn-primary btn-lg w100" onclick="downloadPortfolio()">⬇️ Download portfolio.html</button></div>
        </div>
      </div>
    </div>
  </div>`;
}

// ── BUILDER INIT ──
async function initBuilder() {
  let requestedTheme = null;
  let requestedTemplateId = null;
  try {
    const params = new URLSearchParams(window.location.search);
    requestedTheme = params.get('theme');
    requestedTemplateId = params.get('template');
  } catch (_) {
    requestedTheme = null;
    requestedTemplateId = null;
  }

  // Load portfolio from server
  const res = await API.get('/api/portfolio');
  if (res.ok) {
    const portfolio = res.data;
    // Merge server data into APP state
    if (typeof APP === 'undefined') window.APP = { state: { sections: [], data: {}, activeTheme: 'cyberpunk', selectedSection: 'hero', device: 'desktop', previewOnlyMode: false } };
    APP.state.activeTheme = portfolio.theme || 'cyberpunk';
    if (requestedTheme && typeof THEMES !== 'undefined' && THEMES[requestedTheme]) {
      APP.state.activeTheme = requestedTheme;
      APP.state._themeFromQuery = requestedTheme;
    }
    APP.state.sections = portfolio.sections.map(s => ({ id: s.section_type, sid: s.id, visible: Boolean(s.is_visible) }));
    portfolio.sections.forEach(s => {
      APP.state.data[s.section_type] = (typeof normalizeBuilderSectionContent === 'function')
        ? normalizeBuilderSectionContent(s.section_type, s.content)
        : s.content;
    });
    APP.state.portfolioId = portfolio.id;
    APP.state.slug = portfolio.slug;
    APP.state.isPublished = Boolean(portfolio.is_published);

    // Update publish status indicator
    const pubEl = document.getElementById('pub-status');
    if (pubEl) pubEl.innerHTML = APP.state.isPublished ?
      '<span class="pub-badge published">🟢 Published</span>' :
      '<span class="pub-badge draft">📝 Draft</span>';

    // Update settings inputs
    if (document.getElementById('set-name')) document.getElementById('set-name').value = APP.state.data.hero?.name || '';
    if (document.getElementById('set-title')) document.getElementById('set-title').value = APP.state.data.hero?.title || '';
    if (document.getElementById('set-email')) document.getElementById('set-email').value = Auth.user?.email || '';

    if (requestedTemplateId) {
      const templateRes = await API.get(`/api/templates/${encodeURIComponent(requestedTemplateId)}?mode=apply`);
      if (templateRes.ok && templateRes.data?.template) {
        applyTemplateToBuilderState(templateRes.data.template);
        APP.state._templateFromQuery = templateRes.data.template.name || requestedTemplateId;
      } else {
        Toast.error(templateRes.data?.error || 'Could not apply selected template.');
      }
    }
  }
  // Render builder UI
  renderBuilder();

  if (typeof loadDesignPresets === 'function') {
    await loadDesignPresets();
  }

  if (APP?.state?._themeFromQuery || APP?.state?._templateFromQuery) {
    savePortfolioToServer();
    if (APP?.state?._templateFromQuery) Toast.success(`Template applied: ${APP.state._templateFromQuery}`);
    else Toast.success(`Theme applied: ${APP.state._themeFromQuery}`);
    window.history.replaceState({}, '', window.location.pathname);
    delete APP.state._themeFromQuery;
    delete APP.state._templateFromQuery;
  }

  // Auto-save every 30s
  setInterval(autoSave, 30000);
}

function applyTemplateToBuilderState(template) {
  if (!template || typeof template !== 'object') return;

  const snapshot = template.sections_config || {};
  const sections = Array.isArray(snapshot.sections) ? snapshot.sections : [];
  const data = snapshot && typeof snapshot.data === 'object' ? snapshot.data : {};

  const existingByType = new Map((APP.state.sections || []).map((s) => [s.id, s]));
  const nextSections = [];
  const seen = new Set();

  sections.forEach((item) => {
    const sid = String(item?.id || '').trim();
    if (!sid || seen.has(sid)) return;
    seen.add(sid);
    const existing = existingByType.get(sid);
    nextSections.push({
      id: sid,
      sid: existing?.sid || '',
      visible: item?.visible !== false,
    });
  });

  (APP.state.sections || []).forEach((s) => {
    if (seen.has(s.id)) return;
    nextSections.push({ ...s });
  });

  if (nextSections.length) APP.state.sections = nextSections;

  Object.entries(data).forEach(([key, value]) => {
    if (!key) return;
    let nextValue = value;
    try {
      nextValue = JSON.parse(JSON.stringify(value));
    } catch (_) {
      nextValue = value;
    }
    APP.state.data[key] = (typeof normalizeBuilderSectionContent === 'function')
      ? normalizeBuilderSectionContent(key, nextValue)
      : nextValue;
  });

  if (template.theme && typeof THEMES !== 'undefined' && THEMES[template.theme]) {
    APP.state.activeTheme = template.theme;
  }

  if (!APP.state.selectedSection || !APP.state.sections.find((s) => s.id === APP.state.selectedSection)) {
    APP.state.selectedSection = APP.state.sections[0]?.id || 'hero';
  }
}

const _origRenderBuilder = typeof renderBuilder !== 'undefined' ? renderBuilder : null;

let _saveTimeout = null;
function autoSave() {
  clearTimeout(_saveTimeout);
  _saveTimeout = setTimeout(savePortfolioToServer, 500);
}

async function savePortfolioToServer() {
  if (!APP?.state?.portfolioId) return;
  const sections = APP.state.sections.map((s, i) => ({
    id: s.sid || '',
    section_type: s.id,
    content: (typeof normalizeBuilderSectionContent === 'function')
      ? normalizeBuilderSectionContent(s.id, APP.state.data[s.id] || {})
      : (APP.state.data[s.id] || {}),
    is_visible: s.visible,
    order_index: i
  }));
  const res = await API.put('/api/portfolio', {
    theme: APP.state.activeTheme,
    sections
  });
  if (res.ok) {
    const ind = document.getElementById('save-indicator');
    if (ind) { ind.style.display = 'block'; setTimeout(() => ind.style.display = 'none', 2000); }
  }
}

function switchBTab(id, btn) {
  document.querySelectorAll('.b-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.b-panel').forEach(p => p.classList.add('hidden'));
  if (btn) btn.classList.add('active');
  const panel = document.getElementById('panel-' + id);
  if (panel) panel.classList.remove('hidden');
  if (id === 'content') renderContentTabs();
}

function setExportMode(mode, btn) {
  ['github','code','download'].forEach(m => {
    const el = document.getElementById('export-' + m);
    if (el) el.style.display = 'none';
    const b = document.getElementById('em-' + m.slice(0,2) + (m === 'github' ? 'gh' : m === 'code' ? 'code' : 'dl'));
    if (b) b.className = 'btn btn-ghost btn-sm';
  });
  const el = document.getElementById('export-' + mode);
  if (el) el.style.display = '';
  if (btn) btn.className = 'btn btn-primary btn-sm';
  if (mode === 'code') {
    const cp = document.getElementById('code-prev-content');
    if (cp && typeof generatePortfolioShell === 'function') cp.textContent = generatePortfolioShell(APP.state).slice(0, 1800) + '...[full via Download]';
  }
}

function openExportModal() { document.getElementById('export-modal').classList.add('open'); setExportMode('github', document.getElementById('em-gh')); }
function copyPortfolioCode() { if (typeof generatePortfolioShell === 'function') copyToClipboard(generatePortfolioShell(APP.state)); }
function downloadPortfolio() {
  if (typeof generatePortfolioShell !== 'function') return;
  const code = generatePortfolioShell(APP.state);
  const name = (APP.state.data?.hero?.name || 'portfolio').toLowerCase().replace(/\s+/g, '-');
  const blob = new Blob([code], { type: 'text/html' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name + '.html'; a.click();
  document.getElementById('export-modal').classList.remove('open');
}

// ── DASHBOARD ──
let _dashUser = null;
let _dashAnalytics = null;
let _dashBilling = null;
let _dashPerf = null;

async function loadDashboard() {
  const [analyticsRes, billingRes, perfRes] = await Promise.all([
    API.get('/api/portfolio/analytics'),
    API.get('/api/billing/summary'),
    API.get('/api/perf/summary')
  ]);
  _dashAnalytics = analyticsRes.ok ? analyticsRes.data : {};
  _dashBilling = billingRes.ok ? billingRes.data : null;
  _dashPerf = perfRes.ok ? perfRes.data : null;
  _dashUser = Auth.user;
  showDashTab('overview', document.querySelector('.dash-nav-a'));
  // Show unread badge
  if (_dashUser?.unread_contacts > 0) {
    const badge = document.getElementById('unread-badge');
    if (badge) badge.style.display = 'inline-block';
  }
}

function showDashTab(tab, btn) {
  document.querySelectorAll('.dash-nav-a').forEach(a => a.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const content = document.getElementById('dash-tab-content');
  if (!content) return;
  if (tab === 'overview') content.innerHTML = renderDashOverview(_dashUser, _dashAnalytics, _dashBilling);
  else if (tab === 'analytics') content.innerHTML = renderAnalyticsTab(_dashAnalytics, _dashPerf);
  else if (tab === 'contacts') content.innerHTML = renderContactsTab(_dashAnalytics);
  else if (tab === 'settings') content.innerHTML = renderSettingsTab(_dashUser, _dashBilling);
  schedulePageMotionInit();
}

function renderAnalyticsTab(a, perfSummary) {
  const sourceRows = Array.isArray(a?.top_sources) ? a.top_sources : [];
  const campaignRows = Array.isArray(a?.top_campaigns) ? a.top_campaigns : [];
  const maxSourceViews = Math.max(...sourceRows.map((r) => Number(r?.views || 0)), 1);
  const perf = perfSummary || {};
  const p75 = perf?.p75 || {};
  const vitalStatus = perf?.status || {};

  const statusMeta = {
    good: { bg: 'rgba(34,197,94,.12)', border: 'rgba(34,197,94,.35)', text: '#22c55e', label: 'Good' },
    'needs-improvement': { bg: 'rgba(251,146,60,.13)', border: 'rgba(251,146,60,.35)', text: '#fb923c', label: 'Needs Work' },
    poor: { bg: 'rgba(239,68,68,.12)', border: 'rgba(239,68,68,.35)', text: '#ef4444', label: 'Poor' },
    unknown: { bg: 'rgba(99,102,241,.12)', border: 'rgba(99,102,241,.35)', text: '#818cf8', label: 'Collecting' },
  };

  const vitalCard = (title, key, formatter) => {
    const status = statusMeta[vitalStatus[key] || 'unknown'] || statusMeta.unknown;
    const raw = p75[`${key}_ms`] ?? p75[key] ?? null;
    return `<div style="border:1px solid ${status.border};background:${status.bg};border-radius:12px;padding:10px 11px;min-width:145px">
      <div style="font-size:.67rem;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;font-weight:800">${title} (p75)</div>
      <div style="font-family:var(--fd);font-size:1.03rem;font-weight:800;color:${status.text};margin-top:4px">${formatter(raw)}</div>
      <div style="font-size:.69rem;color:${status.text};margin-top:2px">${status.label}</div>
    </div>`;
  };

  const esc = (value) => String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  return `<div>
    <h2 class="dash-hello font-h">Analytics</h2>
    <p class="dash-sub">Track your portfolio performance</p>
    <div class="stat-cards">
      <div class="stat-card"><div class="stat-ico">👁</div><span class="stat-num">${a?.total_views||0}</span><div class="stat-lbl">Total Views</div></div>
      <div class="stat-card"><div class="stat-ico">📬</div><span class="stat-num">${a?.total_contacts||0}</span><div class="stat-lbl">Total Messages</div></div>
    </div>
    <div class="chart-wrap" style="margin-bottom:16px">
      <div class="chart-title"><span>⚡ Core Web Vitals Health</span><span style="font-size:.72rem;color:var(--muted)">${Number(perf?.sample_size || 0)} samples / 14d</span></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${vitalCard('LCP', 'lcp', (v) => v === null || v === undefined ? '--' : `${Math.round(Number(v))}ms`)}
        ${vitalCard('INP', 'inp', (v) => v === null || v === undefined ? '--' : `${Math.round(Number(v))}ms`)}
        ${vitalCard('CLS', 'cls', (v) => v === null || v === undefined ? '--' : Number(v).toFixed(3))}
        ${vitalCard('FCP', 'fcp', (v) => v === null || v === undefined ? '--' : `${Math.round(Number(v))}ms`)}
        ${vitalCard('TTFB', 'ttfb', (v) => v === null || v === undefined ? '--' : `${Math.round(Number(v))}ms`)}
      </div>
      <div style="margin-top:10px;color:var(--muted2);font-size:.72rem">Targets: LCP ≤ 2500ms, INP ≤ 200ms, CLS ≤ 0.1, FCP ≤ 1800ms, TTFB ≤ 800ms.</div>
    </div>
    <div class="chart-wrap">
      <div class="chart-title"><span>📈 Daily Views — Last 7 Days</span></div>
      <div class="chart-bars">
        ${(a?.views_chart||[]).map(d=>{const m=Math.max(...(a?.views_chart||[]).map(x=>x.views),1);const p=Math.max((d.views/m)*100,2);return`<div class="chart-bar-wrap"><div class="chart-bar" data-val="${d.views}" style="height:${p}%" title="${d.views} views on ${d.date}"></div><div class="chart-lbl">${d.date?.slice(5)||''}</div></div>`}).join('')}
      </div>
    </div>
    <div class="chart-wrap" style="margin-top:16px">
      <div class="chart-title"><span>🚦 Top Traffic Sources</span><span style="font-size:.72rem;color:var(--muted)">${sourceRows.reduce((acc, row) => acc + Number(row?.views || 0), 0)} tracked views</span></div>
      ${sourceRows.length ? `
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px">
          ${sourceRows.map((row) => {
            const views = Number(row?.views || 0);
            const pct = Math.max((views / maxSourceViews) * 100, 8);
            return `<div style="background:rgba(0,229,255,.04);border:1px solid rgba(0,229,255,.16);border-radius:12px;padding:10px 11px">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;gap:8px">
                <span style="font-weight:700;font-size:.8rem;text-transform:capitalize">${esc(row?.source || 'direct')}</span>
                <span style="font-size:.74rem;color:var(--muted)">${views} view${views === 1 ? '' : 's'}</span>
              </div>
              <div style="height:6px;border-radius:99px;background:rgba(255,255,255,.06);overflow:hidden">
                <div style="height:100%;width:${pct}%;background:var(--grad)"></div>
              </div>
            </div>`;
          }).join('')}
        </div>
      ` : `<div style="padding:16px;border:1px dashed rgba(0,229,255,.2);border-radius:12px;color:var(--muted);font-size:.82rem">No source data yet. Share your live URL using the social share tools from your public portfolio page.</div>`}
    </div>
    <div class="chart-wrap" style="margin-top:16px">
      <div class="chart-title"><span>🏷 Campaign Insights</span></div>
      ${campaignRows.length ? `
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${campaignRows.map((row) => `<span class="tag tag-c" style="font-size:.7rem">${esc(row?.campaign || 'campaign')}: ${Number(row?.views || 0)}</span>`).join('')}
        </div>
      ` : `<div style="padding:14px;border:1px dashed rgba(0,229,255,.2);border-radius:12px;color:var(--muted);font-size:.82rem">No UTM campaigns tracked yet. Use links with utm_campaign to compare launch pushes and referral spikes.</div>`}
    </div>
    <div style="padding:14px 16px;background:rgba(124,58,237,.08);border:1px solid rgba(124,58,237,.25);border-radius:14px;margin-top:16px;color:#d9ccff;font-size:.82rem">
      Pro tip: run weekly launch sprints using different campaign tags (example: <strong>reel-week1</strong>, <strong>linkedin-case-study</strong>) and keep whichever source drives the highest response volume.
    </div>
  </div>`;
}

function renderContactsTab(a) {
  const contacts = a?.contacts || [];
  return `<div>
    <h2 class="dash-hello font-h">Messages</h2>
    <p class="dash-sub">${contacts.length} total message(s) received</p>
    ${contacts.length === 0 ?
      `<div style="text-align:center;padding:40px;color:var(--muted)"><div style="font-size:3rem;margin-bottom:12px">📭</div><p>No messages yet. Publish your portfolio to start receiving inquiries!</p><a href="/builder" class="btn btn-primary mt16">🔧 Go to Builder</a></div>` :
      `<div style="overflow-x:auto"><table class="contacts-table">
        <tr><th>From</th><th>Subject / Message</th><th>Date</th><th></th></tr>
        ${contacts.map(c=>`<tr>
          <td><div style="font-weight:600;font-size:.83rem">${c.sender_name}</div><div style="color:var(--muted2);font-size:.7rem">${c.sender_email}</div></td>
          <td><div style="font-size:.82rem;font-weight:600">${c.subject||'General Inquiry'}</div><div style="color:var(--muted);font-size:.75rem">${(c.message||'').slice(0,80)}...</div></td>
          <td style="white-space:nowrap;font-size:.76rem">${formatDate(c.created_at)}</td>
          <td>${c.is_read?'<span class="tag tag-g">Read</span>':'<span class="tag tag-c">New</span>'}</td>
        </tr>`).join('')}
      </table></div>`}
  </div>`;
}

function renderSettingsTab(user, billing) {
  const subscription = billing?.subscription || null;
  const planName = subscription?.plan?.name || String(user?.plan || 'free').toUpperCase();
  const renewsAt = subscription?.current_period_end
    ? formatDate(subscription.current_period_end)
    : 'No renewal date';
  const cancelState = subscription?.cancel_at_period_end
    ? '<div style="font-size:.74rem;color:#fb923c;margin-top:4px">Cancellation scheduled at period end</div>'
    : '<div style="font-size:.74rem;color:var(--muted2);margin-top:4px">Auto-renew is active</div>';

  return `<div>
    <h2 class="dash-hello font-h">Account Settings</h2>
    <p class="dash-sub">Manage your QuickFolio account</p>
    <div class="card" style="max-width:480px">
      <div class="ep-title">👤 Profile</div>
      <div class="inp-group"><label class="inp-label">Full Name</label><input class="inp" id="prof-name" value="${user?.name||''}"></div>
      <div class="inp-group"><label class="inp-label">Bio</label><textarea class="inp" id="prof-bio" rows="3">${user?.bio||''}</textarea></div>
      <div class="inp-group"><label class="inp-label">Email</label><input class="inp" value="${user?.email||''}" disabled style="opacity:.6"></div>
      <button class="btn btn-primary" onclick="saveProfile()">💾 Save Changes</button>
    </div>
    <div class="card mt16" style="max-width:480px">
      <div class="ep-title">🔑 Membership & Billing</div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
        <div><div style="font-weight:700">Current Plan</div><div style="color:var(--muted);font-size:.82rem">${planName}</div>${cancelState}</div>
        <span class="tag tag-c">${subscription?.plan_id || user?.plan || 'free'}</span>
      </div>
      <div style="font-size:.78rem;color:var(--muted);margin-bottom:10px">Next renewal: ${renewsAt}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <a href="/billing" class="btn btn-primary btn-sm">💳 Manage Billing</a>
        <a href="/pricing" class="btn btn-ghost btn-sm">📦 Compare Plans</a>
      </div>
    </div>
  </div>`;
}

async function saveProfile() {
  const name = document.getElementById('prof-name')?.value;
  const bio = document.getElementById('prof-bio')?.value;
  const res = await API.put('/api/user/profile', { name, bio });
  if (res.ok) Toast.success('Profile updated!');
  else Toast.error('Failed to update profile');
}

// ── HERO COUNTERS ──
function animateHeroCounters() {
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseInt(el.dataset.count) || 0;
    animateCounter(el, target, 1800, '');
  });
}

function initLandingGrowthLab() {
  const visitors = document.getElementById('growth-visitors');
  const uplift = document.getElementById('growth-uplift');
  if (!visitors || !uplift) return;

  if (visitors.dataset.bound !== '1') {
    visitors.dataset.bound = '1';
    visitors.addEventListener('input', updateGrowthLab);
  }

  if (uplift.dataset.bound !== '1') {
    uplift.dataset.bound = '1';
    uplift.addEventListener('input', updateGrowthLab);
  }

  updateGrowthLab();
}

function updateGrowthLab() {
  const visitorsInput = document.getElementById('growth-visitors');
  const upliftInput = document.getElementById('growth-uplift');
  if (!visitorsInput || !upliftInput) return;

  const visitors = Math.max(100, Number(visitorsInput.value || 0));
  const uplift = Math.max(1, Number(upliftInput.value || 0));

  const baseConversionRate = 0.022;
  const improvedConversionRate = baseConversionRate * (1 + (uplift / 100));
  const monthlyExtraLeads = Math.round(Math.max(0, visitors * (improvedConversionRate - baseConversionRate)));
  const annualExtraLeads = monthlyExtraLeads * 12;

  const visitorsLabel = document.getElementById('growth-visitors-val');
  const upliftLabel = document.getElementById('growth-uplift-val');
  const monthlyEl = document.getElementById('growth-extra-monthly');
  const annualEl = document.getElementById('growth-extra-annual');

  if (visitorsLabel) visitorsLabel.textContent = visitors.toLocaleString();
  if (upliftLabel) upliftLabel.textContent = `${uplift}%`;
  if (monthlyEl) monthlyEl.textContent = `+${monthlyExtraLeads.toLocaleString()}`;
  if (annualEl) annualEl.textContent = `+${annualExtraLeads.toLocaleString()}`;
}

// ── THEME SHOWCASE ──
function renderThemeShowcase() {
  const grid = document.getElementById('theme-showcase-grid');
  if (!grid || typeof THEMES === 'undefined') return;
  grid.innerHTML = Object.values(THEMES).map(t => `
    <div class="th-card" onclick="window.location.href='/builder?theme=${encodeURIComponent(t.id)}'">
      <div class="th-preview" style="background:linear-gradient(135deg,${t.bg},${t.card})">
        <div class="th-preview-name" style="color:${t.accent};font-family:${t.font}">${t.name.toUpperCase()}</div>
        <div class="th-dots"><div class="th-dot" style="background:${t.bg}"></div><div class="th-dot" style="background:${t.accent}"></div><div class="th-dot" style="background:${t.accent2}"></div></div>
      </div>
      <div class="th-foot"><span>${t.emoji} ${t.name}</span><span class="tag tag-c" style="font-size:.62rem">${t.label}</span></div>
    </div>
  `).join('');
}

// ── LIVE STATS ──
async function updateLiveStats() {
  if (PAGE !== 'landing') return;

  const res = await API.get('/api/stats');
  if (!res.ok) return;

  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const users = Number(res.data?.users || 0);
  const portfolios = Number(res.data?.portfolios || 0);
  const totalViews = Number(res.data?.total_views || 0);

  const dynamicValues = [
    portfolios > 0 ? portfolios : 12400,
    Math.max(60, Math.round(totalViews / 27)),
    Math.max(35, Math.min(97, Math.round((portfolios > 0 ? (users / portfolios) : 0.78) * 100))),
    Math.max(8, Math.min(24, Math.round((users / Math.max(portfolios, 1)) * 10))),
  ];

  counters.forEach((el, idx) => {
    const target = dynamicValues[idx];
    if (!Number.isFinite(target)) return;
    animateCounter(el, target, 1100 + (idx * 160), '');
  });
}
