/* ════════ APP.JS — main controller ════════ */

const PAGE = window.APP_CONFIG?.page || 'landing';
const ASSET_VERSION = '20260419crafted19';
const PREFETCHED_PATHS = new Set();
const LOADED_STYLE_IDS = new Set();
const LOADED_SCRIPT_IDS = new Set();
const CHATBOT_DISABLED_PAGES = new Set(['login', 'signup', 'builder', 'resume-editor']);
const PREFETCH_DISABLED_PAGES = new Set(['login', 'signup', 'builder', 'resume-editor']);
const COMMAND_CENTER_DISABLED_PAGES = new Set(['login', 'signup']);
const CINEMATIC_PROFILE_KEY = 'quickfolio.cinematic.profile';
const CINEMATIC_PROFILE_KEY_LEGACY = 'QuickFolio.cinematic.profile';
const CINEMATIC_PROFILES = {
  subtle: {
    id: 'subtle',
    density: 0.72,
    speed: 0.84,
    glow: 0.74,
    ambient: 0.68,
    parallax: 0.7,
    magnet: 0.72,
    transitionMs: 320,
  },
  balanced: {
    id: 'balanced',
    density: 1,
    speed: 1,
    glow: 1,
    ambient: 1,
    parallax: 1,
    magnet: 1,
    transitionMs: 420,
  },
  extreme: {
    id: 'extreme',
    density: 1.45,
    speed: 1.24,
    glow: 1.28,
    ambient: 1.2,
    parallax: 1.22,
    magnet: 1.3,
    transitionMs: 540,
  },
};
let _commandActions = [];
let _commandCenterOpen = false;
let _perfModeEnabled = false;
let _landingCinematicCleanup = null;
let _siteCinematicCleanup = null;
let _routeTransitionLocked = false;
let _activeCinematicProfileId = 'balanced';
let _cinematicsBooted = false;
let _cinematicBootTeardown = null;

function runWhenIdle(task, timeout = 1200) {
  if (typeof task !== 'function') return;
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => task(), { timeout });
  } else {
    setTimeout(task, Math.min(timeout, 350));
  }
}

function prefersReducedMotionNow() {
  return Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}

function resolveCinematicProfileId() {
  let stored = '';
  try {
    stored = localStorage.getItem(CINEMATIC_PROFILE_KEY) || localStorage.getItem(CINEMATIC_PROFILE_KEY_LEGACY) || '';
  } catch (_) {
    stored = '';
  }
  const normalized = String(stored || '').trim().toLowerCase();
  if (normalized && CINEMATIC_PROFILES[normalized]) return normalized;
  return 'balanced';
}

function getCinematicProfileConfig() {
  const key = CINEMATIC_PROFILES[_activeCinematicProfileId] ? _activeCinematicProfileId : resolveCinematicProfileId();
  return CINEMATIC_PROFILES[key] || CINEMATIC_PROFILES.balanced;
}

function applyCinematicProfileToBody() {
  _activeCinematicProfileId = resolveCinematicProfileId();
  const profile = getCinematicProfileConfig();
  document.body.dataset.cinematicProfile = profile.id;
  document.body.style.setProperty('--cine-glow-scale', profile.glow.toFixed(3));
  document.body.style.setProperty('--cine-density-scale', profile.density.toFixed(3));
  document.body.style.setProperty('--cine-spotlight-scale', profile.glow.toFixed(3));
  document.body.style.setProperty('--cine-heading-duration', `${(7.2 / Math.max(profile.speed, 0.5)).toFixed(2)}s`);
  document.body.style.setProperty('--route-transition-duration', `${Math.round(profile.transitionMs)}ms`);
}

function setCinematicProfile(profileId, options = {}) {
  const nextProfile = String(profileId || '').trim().toLowerCase();
  if (!CINEMATIC_PROFILES[nextProfile]) return;

  _activeCinematicProfileId = nextProfile;
  try {
    localStorage.setItem(CINEMATIC_PROFILE_KEY, nextProfile);
  } catch (_) {
    // Ignore storage failures and keep current session state.
  }
  applyCinematicProfileToBody();

  if (PAGE === 'landing') initLandingCinematic();
  initSiteCinematic();
  _cinematicsBooted = true;
  refreshCommandCenterActions();

  if (!options.silent && typeof Toast?.info === 'function') {
    const title = nextProfile.charAt(0).toUpperCase() + nextProfile.slice(1);
    Toast.info(`Cinematic profile: ${title}`);
  }
}

function getRouteTransitionDuration() {
  return Math.max(220, Number(getCinematicProfileConfig().transitionMs || 420));
}

function ensureRouteTransitionLayer() {
  let layer = document.getElementById('route-transition-layer');
  if (!layer) {
    layer = document.createElement('div');
    layer.id = 'route-transition-layer';
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);
  }
  return layer;
}

function isRouteTransitionDisabled() {
  return _perfModeEnabled || prefersReducedMotionNow();
}

function teardownCinematicBootListeners() {
  if (typeof _cinematicBootTeardown === 'function') {
    _cinematicBootTeardown();
  }
  _cinematicBootTeardown = null;
}

function bootDeferredCinematics() {
  if (_cinematicsBooted || isRouteTransitionDisabled()) return;
  _cinematicsBooted = true;
  if (PAGE === 'landing') initLandingCinematic();
  initSiteCinematic();
  teardownCinematicBootListeners();
}

function scheduleDeferredCinematics() {
  _cinematicsBooted = false;
  teardownCinematicBootListeners();

  if (isRouteTransitionDisabled()) {
    destroyLandingCinematic();
    destroySiteCinematic();
    return;
  }

  const listeners = [
    ['pointerdown', { once: true, passive: true }],
    ['touchstart', { once: true, passive: true }],
    ['wheel', { once: true, passive: true }],
    ['keydown', { once: true }],
  ];
  const onFirstInteraction = () => bootDeferredCinematics();

  listeners.forEach(([eventName, options]) => {
    window.addEventListener(eventName, onFirstInteraction, options);
  });

  _cinematicBootTeardown = () => {
    listeners.forEach(([eventName]) => {
      window.removeEventListener(eventName, onFirstInteraction);
    });
  };

  runWhenIdle(bootDeferredCinematics, 2200);
}

function runRouteEnterTransition() {
  if (isRouteTransitionDisabled()) return;
  const layer = ensureRouteTransitionLayer();
  layer.classList.remove('route-leave', 'route-enter', 'is-active');
  layer.classList.add('route-enter');

  requestAnimationFrame(() => {
    layer.classList.add('is-active');
  });

  window.setTimeout(() => {
    layer.classList.remove('route-enter', 'is-active');
  }, getRouteTransitionDuration() + 90);
}

function navigateWithTransition(targetHref) {
  if (!targetHref) return;

  const url = new URL(targetHref, window.location.href);
  const destination = `${url.pathname}${url.search}${url.hash}`;
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;

  if (destination === current) return;

  if (isRouteTransitionDisabled() || _routeTransitionLocked) {
    window.location.assign(destination);
    return;
  }

  _routeTransitionLocked = true;
  closeCommandCenter();

  const layer = ensureRouteTransitionLayer();
  layer.classList.remove('route-enter', 'route-leave', 'is-active');
  layer.classList.add('route-leave');

  requestAnimationFrame(() => {
    layer.classList.add('is-active');
  });

  window.setTimeout(() => {
    window.location.assign(destination);
  }, getRouteTransitionDuration() + 30);
}

function shouldHandleInternalAnchorNavigation(event, anchor) {
  if (!anchor || event.defaultPrevented) return false;
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  if (anchor.dataset.noTransition === '1') return false;
  if (anchor.hasAttribute('download')) return false;
  if (anchor.target && anchor.target !== '_self') return false;

  const rawHref = anchor.getAttribute('href') || '';
  if (!rawHref || rawHref.startsWith('#')) return false;
  if (/^(mailto:|tel:|javascript:)/i.test(rawHref)) return false;

  const url = new URL(rawHref, window.location.href);
  if (url.origin !== window.location.origin) return false;
  if (url.pathname.toLowerCase().endsWith('.pdf')) return false;

  const isSamePath = url.pathname === window.location.pathname && url.search === window.location.search;
  if (isSamePath && url.hash) return false;

  return true;
}

function initGlobalRouteTransitionInterceptors() {
  document.addEventListener('click', (event) => {
    const anchor = event.target?.closest?.('a[href]');
    if (!shouldHandleInternalAnchorNavigation(event, anchor)) return;
    event.preventDefault();
    navigateWithTransition(anchor.getAttribute('href'));
  }, true);
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', async () => {
  initPerformanceMode();
  applyCinematicProfileToBody();
  initNavDynamics();
  initScrollProgressBar();
  registerServiceWorker();

  await Promise.all([
    ensurePageStyles(),
    ensurePageScripts(),
    Auth.init(),
  ]);

  refreshCommandCenterActions();

  // Render page content
  await renderCurrentPage();

  runWhenIdle(() => {
    if (!PREFETCH_DISABLED_PAGES.has(PAGE)) initSmartLinkPrefetch();
    if (!COMMAND_CENTER_DISABLED_PAGES.has(PAGE)) {
      initCommandCenter();
      refreshCommandCenterActions();
    }
  }, 900);

  // Load chatbot assets only when the current page can actually show chatbot.
  if (!CHATBOT_DISABLED_PAGES.has(PAGE)) {
    runWhenIdle(async () => {
      await ensureChatbotAssets();
      if (typeof Chatbot !== 'undefined' && Chatbot?.init) {
        Chatbot.init('global-chatbot');
        refreshCommandCenterActions();
      }
    }, 1400);
  }

  // Update live stats from API only where the widget exists.
  if (PAGE === 'landing') runWhenIdle(updateLiveStats, 900);

  // Ensure top nav/mobile links always navigate reliably.
  bindPrimaryNavLinks();
  initGlobalRouteTransitionInterceptors();
  runRouteEnterTransition();

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
      navigateWithTransition(href);
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

function ensureScript(id, src) {
  if (!id || !src) return Promise.resolve();
  if (LOADED_SCRIPT_IDS.has(id) || document.getElementById(id)) {
    LOADED_SCRIPT_IDS.add(id);
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.id = id;
    script.defer = true;
    script.async = false;
    script.src = `${src}${src.includes('?') ? '&' : '?'}v=${encodeURIComponent(ASSET_VERSION)}`;
    script.onload = () => {
      LOADED_SCRIPT_IDS.add(id);
      resolve();
    };
    script.onerror = () => resolve();
    document.head.appendChild(script);
  });
}

function resolvePageScriptQueue() {
  const queue = [];

  if (!['builder', 'login', 'signup'].includes(PAGE)) {
    queue.push({ id: 'pages-runtime-script', src: '/static/js/pages.js' });
  }

  if (PAGE === 'builder') {
    queue.push({ id: 'renderer-runtime-script', src: '/static/js/renderer.js' });
    queue.push({ id: 'builder-runtime-script', src: '/static/js/builder.js' });
  }

  if (PAGE === 'builder' || PAGE === 'dashboard') {
    queue.push({ id: 'app-builder-dashboard-runtime-script', src: '/static/js/app-builder-dashboard.js' });
  }

  return queue;
}

async function ensurePageScripts() {
  const queue = resolvePageScriptQueue();
  for (const item of queue) {
    await ensureScript(item.id, item.src);
  }
}

async function ensurePageStyles() {
  const needsBuilderStyles = ['builder', 'resume-editor'].includes(PAGE);

  const tasks = [];
  if (needsBuilderStyles) tasks.push(ensureStylesheet('builder-page-styles', '/static/css/builder.css'));
  await Promise.all(tasks);
}

async function ensureChatbotAssets() {
  await ensureStylesheet('chatbot-page-styles', '/static/css/chatbot.css');
  await ensureScript('chatbot-runtime-script', '/static/js/chatbot.js');
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
  teardownCinematicBootListeners();

  if (isRouteTransitionDisabled()) {
    _cinematicsBooted = false;
    destroyLandingCinematic();
    destroySiteCinematic();
  } else {
    _cinematicsBooted = true;
    if (PAGE === 'landing') initLandingCinematic();
    initSiteCinematic();
  }

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
    <button id="command-fab" class="command-fab" type="button" aria-haspopup="dialog" aria-controls="command-center-modal" aria-label="Open quick actions">Quick Actions</button>
    <div id="command-center-modal" class="command-modal" aria-hidden="true">
      <div class="command-overlay" id="command-overlay"></div>
      <div class="command-panel" role="dialog" aria-modal="true" aria-labelledby="command-title">
        <div class="command-head">
          <div>
            <div id="command-title" class="command-title">QuickFolio Command Center</div>
            <div class="command-sub">Shortcut: Ctrl + Shift + J</div>
          </div>
          <button type="button" class="command-close" id="command-close" aria-label="Close quick actions">X</button>
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
  const nav = (path) => navigateWithTransition(path);
  const activeProfile = getCinematicProfileConfig().id;

  _commandActions = [
    { label: 'Go to Home', hint: 'Landing and product overview', run: () => nav('/') },
    { label: 'Open Templates', hint: 'Browse marketplace templates', run: () => nav('/templates') },
    { label: 'Open Pricing', hint: 'Compare membership plans', run: () => nav('/pricing') },
    { label: 'Open Manual', hint: 'Feature docs and troubleshooting', run: () => nav('/manual') },
    { label: 'Open About', hint: 'Story, team, and stack', run: () => nav('/about') },
    { label: 'Open Privacy Policy', hint: 'Data and tracking policy', run: () => nav('/privacy') },
    { label: 'Open Terms of Service', hint: 'Platform terms and usage rules', run: () => nav('/terms') },
    { label: 'Email QuickFolio', hint: 'Contact support directly', run: () => window.location.assign('mailto:Ks6911843@gmail.com?subject=QuickFolio%20Website%20Inquiry') },
    {
      label: _perfModeEnabled ? 'Disable Performance Mode' : 'Enable Performance Mode',
      hint: 'Reduce visual noise and motion for speed',
      run: () => togglePerformanceMode(),
    },
    {
      label: `Cinematic Profile: Subtle${activeProfile === 'subtle' ? ' (Active)' : ''}`,
      hint: 'Cleaner and lighter motion intensity',
      run: () => setCinematicProfile('subtle'),
    },
    {
      label: `Cinematic Profile: Balanced${activeProfile === 'balanced' ? ' (Active)' : ''}`,
      hint: 'Default premium motion profile',
      run: () => setCinematicProfile('balanced'),
    },
    {
      label: `Cinematic Profile: Extreme${activeProfile === 'extreme' ? ' (Active)' : ''}`,
      hint: 'Maximum cinematic density and energy',
      run: () => setCinematicProfile('extreme'),
    },
  ];

  if (Auth?.user) {
    _commandActions.unshift(
      { label: 'Open Dashboard', hint: 'Workspace overview', run: () => nav('/dashboard') },
      { label: 'Open Builder', hint: 'Edit portfolio sections', run: () => nav('/builder') },
      { label: 'Open Resume Editor', hint: 'Edit and export resume PDF', run: () => nav('/resume-editor') },
      { label: 'Open Billing', hint: 'Plan and invoices', run: () => nav('/billing') }
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
let _pageMotionPrimed = false;
let _pageMotionScheduleToken = 0;

function schedulePageMotionInit() {
  _pageMotionScheduleToken += 1;
  const token = _pageMotionScheduleToken;
  if (_pageMotionTimer) clearTimeout(_pageMotionTimer);

  const runMotionInit = () => {
    if (token !== _pageMotionScheduleToken) return;
    initPageMotion();
    _pageMotionPrimed = true;
  };

  if (!_pageMotionPrimed) {
    _pageMotionTimer = setTimeout(() => {
      runWhenIdle(runMotionInit, 1500);
    }, 120);
    return;
  }

  _pageMotionTimer = setTimeout(runMotionInit, 50);
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
  teardownCinematicBootListeners();
  _cinematicsBooted = false;
  destroyLandingCinematic();
  destroySiteCinematic();

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
        main.innerHTML = `<div style="min-height:100vh;min-height:100dvh;display:flex;align-items:center;justify-content:center;padding-top:var(--nav-h)"><div class="tc"><h1 class="grad-text font-d" style="font-size:4rem">404</h1><p style="color:var(--muted)">Page not found</p><a href="/" class="btn btn-primary mt16">Home</a></div></div>`;
  }

  schedulePageMotionInit();
  optimizeImagesForPerformance();
  if (PAGE === 'landing') runWhenIdle(initLandingGrowthLab, 900);
  scheduleDeferredCinematics();
  if (typeof initSachinShowcaseMotion === 'function') initSachinShowcaseMotion();
  refreshCommandCenterActions();
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

function destroyLandingCinematic() {
  if (typeof _landingCinematicCleanup === 'function') {
    _landingCinematicCleanup();
  }
  _landingCinematicCleanup = null;
}

function initLandingCinematic() {
  const hero = document.querySelector('.cinematic-hero');
  if (!hero) return;

  destroyLandingCinematic();

  const words = [...hero.querySelectorAll('.hero-word')];
  words.forEach((word, idx) => word.style.setProperty('--word-index', String(idx)));

  hero.classList.remove('is-ready');
  requestAnimationFrame(() => hero.classList.add('is-ready'));

  const prefersReduced = _perfModeEnabled || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  if (prefersReduced) {
    _landingCinematicCleanup = () => {
      hero.querySelectorAll('.hero-btn-wrap').forEach((node) => {
        node.style.transform = '';
      });
    };
    return;
  }

  const cleanups = [
    initLandingHeroCanvas(hero),
    initLandingHeroParallax(hero),
    initLandingHeroMagnet(hero),
  ].filter((fn) => typeof fn === 'function');

  _landingCinematicCleanup = () => {
    cleanups.forEach((cleanup) => {
      try {
        cleanup();
      } catch (_) {
        // Keep teardown resilient.
      }
    });

    hero.querySelectorAll('.hero-parallax-layer').forEach((node) => {
      node.style.transform = '';
    });
    hero.querySelectorAll('.hero-btn-wrap').forEach((node) => {
      node.style.transform = '';
    });
  };
}

function initLandingHeroCanvas(hero) {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas || typeof canvas.getContext !== 'function') return () => {};

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return () => {};

  const profile = getCinematicProfileConfig();
  const densityMultiplier = profile.density;
  const speedMultiplier = profile.speed;
  const glowMultiplier = profile.glow;
  const ambientMultiplier = profile.ambient;

  const pointer = { x: 0, y: 0, active: false };
  let width = 0;
  let height = 0;
  let dpr = 1;
  let particles = [];
  let rafId = 0;
  let running = true;
  let lastFrame = 0;

  function createParticle() {
    const angle = Math.random() * Math.PI * 2;
    const speed = (0.08 + Math.random() * 0.24) * speedMultiplier;
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: (0.8 + Math.random() * 1.9) * (0.88 + (densityMultiplier * 0.12)),
      alpha: Math.min(0.88, (0.15 + Math.random() * 0.45) * (0.78 + (glowMultiplier * 0.22))),
      tint: Math.random() > 0.5 ? 'cyan' : 'violet',
    };
  }

  function rebuildParticles() {
    const area = Math.max(width * height, 1);
    const count = Math.max(24, Math.min(158, Math.round((area / 18500) * densityMultiplier)));
    particles = Array.from({ length: count }, createParticle);
  }

  function resize() {
    const rect = hero.getBoundingClientRect();
    width = Math.max(320, Math.round(rect.width));
    height = Math.max(280, Math.round(rect.height));
    dpr = Math.min(window.devicePixelRatio || 1, 1.8);

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    rebuildParticles();
  }

  function wrapParticle(particle) {
    if (particle.x < -20) particle.x = width + 20;
    if (particle.x > width + 20) particle.x = -20;
    if (particle.y < -20) particle.y = height + 20;
    if (particle.y > height + 20) particle.y = -20;
  }

  function draw(timestamp) {
    if (!running) return;

    const dt = Math.min(2, lastFrame ? (timestamp - lastFrame) / 16.67 : 1);
    lastFrame = timestamp;

    ctx.clearRect(0, 0, width, height);

    const px = pointer.active ? pointer.x : width * 0.5;
    const py = pointer.active ? pointer.y : height * 0.42;

    const cyanAura = ctx.createRadialGradient(px, py, 0, px, py, Math.max(width, height) * 0.62);
    cyanAura.addColorStop(0, `rgba(0,229,255,${(0.19 * glowMultiplier).toFixed(4)})`);
    cyanAura.addColorStop(1, 'rgba(0,229,255,0)');
    ctx.fillStyle = cyanAura;
    ctx.fillRect(0, 0, width, height);

    const violetAura = ctx.createRadialGradient(width * 0.84, height * 0.26, 0, width * 0.84, height * 0.26, Math.max(width, height) * 0.72);
    violetAura.addColorStop(0, `rgba(180,79,255,${(0.16 * glowMultiplier).toFixed(4)})`);
    violetAura.addColorStop(1, 'rgba(180,79,255,0)');
    ctx.fillStyle = violetAura;
    ctx.fillRect(0, 0, width, height);

    const sweepY = ((timestamp * 0.085) % (height + 260)) - 130;
    const sweep = ctx.createLinearGradient(0, sweepY - 90, 0, sweepY + 90);
    sweep.addColorStop(0, 'rgba(0,0,0,0)');
    sweep.addColorStop(0.5, `rgba(0,229,255,${(0.07 * glowMultiplier).toFixed(4)})`);
    sweep.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sweep;
    ctx.fillRect(0, sweepY - 90, width, 180);

    const linkDistance = Math.max(98, Math.round(128 * (0.84 + (densityMultiplier * 0.2))));
    const linkDistanceSq = linkDistance * linkDistance;

    for (let i = 0; i < particles.length; i += 1) {
      const particle = particles[i];

      if (pointer.active) {
        const dx = pointer.x - particle.x;
        const dy = pointer.y - particle.y;
        const distSq = (dx * dx) + (dy * dy) + 180;
        const pull = (4800 * ambientMultiplier) / distSq;
        particle.vx += dx * pull * 0.0009;
        particle.vy += dy * pull * 0.0009;
      }

      particle.vx *= 0.992;
      particle.vy *= 0.992;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;

      particle.x += Math.sin((timestamp * 0.00035) + i) * 0.05;
      particle.y += Math.cos((timestamp * 0.00028) + i) * 0.04;
      wrapParticle(particle);

      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
      ctx.fillStyle = particle.tint === 'cyan'
        ? `rgba(0,229,255,${particle.alpha})`
        : `rgba(180,79,255,${particle.alpha})`;
      ctx.fill();
    }

    ctx.lineWidth = 0.7;
    for (let i = 0; i < particles.length; i += 1) {
      const a = particles[i];
      for (let j = i + 1; j < particles.length; j += 1) {
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distSq = (dx * dx) + (dy * dy);
        if (distSq > linkDistanceSq) continue;

        const dist = Math.sqrt(distSq);
        const alpha = Math.pow(1 - (dist / linkDistance), 1.6) * 0.22 * glowMultiplier;
        ctx.strokeStyle = `rgba(124,177,255,${alpha.toFixed(4)})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    rafId = window.requestAnimationFrame(draw);
  }

  function onPointerMove(event) {
    const rect = hero.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.active = true;
  }

  function onPointerLeave() {
    pointer.active = false;
  }

  function stopLoop() {
    if (!rafId) return;
    window.cancelAnimationFrame(rafId);
    rafId = 0;
  }

  function startLoop() {
    if (rafId || !running) return;
    rafId = window.requestAnimationFrame(draw);
  }

  function onVisibility() {
    running = !document.hidden;
    if (!running) stopLoop();
    else startLoop();
  }

  const observer = new IntersectionObserver((entries) => {
    const entry = entries[0];
    running = Boolean(entry && entry.isIntersecting && !document.hidden);
    if (!running) stopLoop();
    else startLoop();
  }, { threshold: 0.08 });

  resize();
  startLoop();

  hero.addEventListener('pointermove', onPointerMove, { passive: true });
  hero.addEventListener('pointerleave', onPointerLeave, { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);
  observer.observe(hero);

  return () => {
    stopLoop();
    observer.disconnect();
    hero.removeEventListener('pointermove', onPointerMove);
    hero.removeEventListener('pointerleave', onPointerLeave);
    window.removeEventListener('resize', resize);
    document.removeEventListener('visibilitychange', onVisibility);
    ctx.clearRect(0, 0, width, height);
  };
}

function initLandingHeroParallax(hero) {
  const layers = [...hero.querySelectorAll('.hero-parallax-layer')];
  if (!layers.length) return () => {};

  const profile = getCinematicProfileConfig();
  const coarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  const pointerFactor = (coarsePointer ? 0.34 : 1) * profile.parallax;
  const followStrength = Math.min(0.2, 0.065 + (profile.parallax * 0.02));
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let targetScroll = 0;
  let currentScroll = 0;
  let rafId = 0;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function onPointerMove(event) {
    const rect = hero.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
    const y = ((event.clientY - rect.top) / Math.max(rect.height, 1)) * 2 - 1;
    targetX = clamp(x, -1, 1);
    targetY = clamp(y, -1, 1);
  }

  function onPointerLeave() {
    targetX = 0;
    targetY = 0;
  }

  function onScroll() {
    const rect = hero.getBoundingClientRect();
    const viewport = Math.max(window.innerHeight || 1, 1);
    const centerOffset = (rect.top + (rect.height * 0.5)) - (viewport * 0.5);
    targetScroll = clamp(centerOffset / viewport, -1, 1);
  }

  function tick() {
    currentX += (targetX - currentX) * followStrength;
    currentY += (targetY - currentY) * followStrength;
    currentScroll += (targetScroll - currentScroll) * (followStrength * 0.9);

    layers.forEach((layer) => {
      const depth = Number(layer.dataset.depth || 0);
      const tx = currentX * depth * 0.55 * pointerFactor;
      const ty = (currentY * depth * 0.42 * pointerFactor) + (currentScroll * depth * -0.32);
      layer.style.transform = `translate3d(${tx.toFixed(2)}px,${ty.toFixed(2)}px,0)`;
    });

    hero.style.setProperty('--hero-shift-x', currentX.toFixed(4));
    hero.style.setProperty('--hero-shift-y', currentY.toFixed(4));
    rafId = window.requestAnimationFrame(tick);
  }

  onScroll();
  tick();

  hero.addEventListener('pointermove', onPointerMove, { passive: true });
  hero.addEventListener('pointerleave', onPointerLeave, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  return () => {
    if (rafId) window.cancelAnimationFrame(rafId);
    hero.removeEventListener('pointermove', onPointerMove);
    hero.removeEventListener('pointerleave', onPointerLeave);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
  };
}

function initLandingHeroMagnet(hero) {
  if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return () => {};

  const profile = getCinematicProfileConfig();
  const wraps = [...hero.querySelectorAll('.hero-btn-wrap')];
  if (!wraps.length) return () => {};

  const detach = [];
  wraps.forEach((wrap) => {
    function onMove(event) {
      const rect = wrap.getBoundingClientRect();
      const nx = (((event.clientX - rect.left) / Math.max(rect.width, 1)) - 0.5) * 2;
      const ny = (((event.clientY - rect.top) / Math.max(rect.height, 1)) - 0.5) * 2;
      const tx = Math.max(-1, Math.min(1, nx)) * (9 * profile.magnet);
      const ty = Math.max(-1, Math.min(1, ny)) * (7 * profile.magnet);
      wrap.style.transform = `translate3d(${tx.toFixed(2)}px,${ty.toFixed(2)}px,0)`;
    }

    function reset() {
      wrap.style.transform = 'translate3d(0,0,0)';
    }

    wrap.addEventListener('pointermove', onMove, { passive: true });
    wrap.addEventListener('pointerleave', reset);
    wrap.addEventListener('pointerup', reset);
    wrap.addEventListener('blur', reset, true);

    detach.push(() => {
      wrap.removeEventListener('pointermove', onMove);
      wrap.removeEventListener('pointerleave', reset);
      wrap.removeEventListener('pointerup', reset);
      wrap.removeEventListener('blur', reset, true);
      reset();
    });
  });

  return () => {
    detach.forEach((fn) => fn());
  };
}

function destroySiteCinematic() {
  if (typeof _siteCinematicCleanup === 'function') {
    _siteCinematicCleanup();
  }
  _siteCinematicCleanup = null;
}

function initSiteCinematic() {
  const main = document.getElementById('main-content');
  if (!main) return;

  destroySiteCinematic();

  const profile = getCinematicProfileConfig();
  const prefersReduced = _perfModeEnabled || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  document.body.classList.toggle('cinematic-site-active', !prefersReduced);

  if (prefersReduced || !main.children.length) return;

  const cleanups = [
    initSiteCinematicBackdrop(profile),
    initSiteCinematicAmbient(profile),
    initSiteCinematicCardSpotlights(main, profile),
    initSiteCinematicHeadingShimmer(main, profile),
  ].filter((fn) => typeof fn === 'function');

  _siteCinematicCleanup = () => {
    cleanups.forEach((cleanup) => {
      try {
        cleanup();
      } catch (_) {
        // Keep cleanup safe if one effect fails.
      }
    });
    document.body.classList.remove('cinematic-site-active');
  };
}

function initSiteCinematicBackdrop(profile = getCinematicProfileConfig()) {
  const existing = document.getElementById('site-cinematic-root');
  if (existing) existing.remove();

  const root = document.createElement('div');
  root.id = 'site-cinematic-root';
  root.innerHTML = `
    <canvas id="site-cinematic-canvas"></canvas>
    <div class="site-cinematic-glow" aria-hidden="true"></div>
    <div class="site-cinematic-noise" aria-hidden="true"></div>
  `;
  document.body.appendChild(root);

  const canvas = root.querySelector('#site-cinematic-canvas');
  if (!canvas || typeof canvas.getContext !== 'function') {
    return () => root.remove();
  }

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) {
    return () => root.remove();
  }

  const densityMultiplier = profile.density;
  const speedMultiplier = profile.speed;
  const glowMultiplier = profile.glow;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let rafId = 0;
  let running = true;
  let lastFrame = 0;
  let stars = [];

  function createStar() {
    const angle = Math.random() * Math.PI * 2;
    const speed = (0.03 + Math.random() * 0.11) * speedMultiplier;
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: (0.7 + Math.random() * 1.7) * (0.88 + (densityMultiplier * 0.12)),
      a: Math.min(0.85, (0.1 + Math.random() * 0.35) * (0.78 + (glowMultiplier * 0.24))),
      tint: Math.random() > 0.5 ? 'cyan' : 'violet',
    };
  }

  function resize() {
    width = Math.max(window.innerWidth || 0, 320);
    height = Math.max(window.innerHeight || 0, 320);
    dpr = Math.min(window.devicePixelRatio || 1, 1.8);

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const area = width * height;
    const count = Math.max(20, Math.min(118, Math.round((area / 32000) * densityMultiplier)));
    stars = Array.from({ length: count }, createStar);
  }

  function wrap(star) {
    if (star.x < -18) star.x = width + 18;
    if (star.x > width + 18) star.x = -18;
    if (star.y < -18) star.y = height + 18;
    if (star.y > height + 18) star.y = -18;
  }

  function draw(now) {
    if (!running) return;

    const dt = Math.min(1.8, lastFrame ? (now - lastFrame) / 16.67 : 1);
    lastFrame = now;

    ctx.clearRect(0, 0, width, height);

    const sweepY = ((now * 0.05) % (height + 320)) - 160;
    const sweep = ctx.createLinearGradient(0, sweepY - 130, width, sweepY + 130);
    sweep.addColorStop(0, 'rgba(0,0,0,0)');
    sweep.addColorStop(0.5, `rgba(0,229,255,${(0.045 * glowMultiplier).toFixed(4)})`);
    sweep.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sweep;
    ctx.fillRect(0, sweepY - 130, width, 260);

    const linkLimit = Math.max(108, Math.round(145 * (0.84 + (densityMultiplier * 0.2))));
    const linkLimitSq = linkLimit * linkLimit;

    for (let i = 0; i < stars.length; i += 1) {
      const star = stars[i];
      star.x += star.vx * dt;
      star.y += star.vy * dt;
      star.x += Math.sin((now * 0.00026) + i) * 0.05;
      star.y += Math.cos((now * 0.00022) + i) * 0.05;
      wrap(star);

      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fillStyle = star.tint === 'cyan'
        ? `rgba(0,229,255,${star.a.toFixed(4)})`
        : `rgba(180,79,255,${star.a.toFixed(4)})`;
      ctx.fill();
    }

    ctx.lineWidth = 0.55;
    for (let i = 0; i < stars.length; i += 1) {
      const a = stars[i];
      for (let j = i + 1; j < stars.length; j += 1) {
        const b = stars[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = (dx * dx) + (dy * dy);
        if (d2 > linkLimitSq) continue;

        const d = Math.sqrt(d2);
        const alpha = Math.pow(1 - (d / linkLimit), 1.8) * 0.13 * glowMultiplier;
        ctx.strokeStyle = `rgba(124,177,255,${alpha.toFixed(4)})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    rafId = window.requestAnimationFrame(draw);
  }

  function stop() {
    if (!rafId) return;
    window.cancelAnimationFrame(rafId);
    rafId = 0;
  }

  function start() {
    if (rafId || !running) return;
    rafId = window.requestAnimationFrame(draw);
  }

  function onVisibility() {
    running = !document.hidden;
    if (!running) stop();
    else start();
  }

  resize();
  start();

  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);

  return () => {
    stop();
    window.removeEventListener('resize', resize);
    document.removeEventListener('visibilitychange', onVisibility);
    root.remove();
  };
}

function initSiteCinematicAmbient(profile = getCinematicProfileConfig()) {
  const influence = profile.ambient;
  const followStrength = Math.min(0.18, 0.045 + (profile.speed * 0.015));
  let targetX = 50;
  let targetY = 42;
  let currentX = 50;
  let currentY = 42;
  let targetScroll = 0;
  let currentScroll = 0;
  let rafId = 0;

  function onPointerMove(event) {
    const vw = Math.max(window.innerWidth || 1, 1);
    const vh = Math.max(window.innerHeight || 1, 1);
    const nextX = 50 + ((((event.clientX / vw) * 100) - 50) * influence);
    const nextY = 50 + ((((event.clientY / vh) * 100) - 50) * influence);
    targetX = Math.min(96, Math.max(4, nextX));
    targetY = Math.min(96, Math.max(4, nextY));
  }

  function onScroll() {
    const doc = document.documentElement;
    const max = Math.max(doc.scrollHeight - doc.clientHeight, 1);
    targetScroll = Math.min(1, Math.max(0, window.scrollY / max));
  }

  function tick() {
    currentX += (targetX - currentX) * followStrength;
    currentY += (targetY - currentY) * followStrength;
    currentScroll += (targetScroll - currentScroll) * Math.min(0.16, followStrength * 1.3);

    document.body.style.setProperty('--site-pointer-x', `${currentX.toFixed(3)}%`);
    document.body.style.setProperty('--site-pointer-y', `${currentY.toFixed(3)}%`);
    document.body.style.setProperty('--site-scroll-progress', currentScroll.toFixed(5));

    rafId = window.requestAnimationFrame(tick);
  }

  onScroll();
  tick();

  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  return () => {
    if (rafId) window.cancelAnimationFrame(rafId);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    document.body.style.removeProperty('--site-pointer-x');
    document.body.style.removeProperty('--site-pointer-y');
    document.body.style.removeProperty('--site-scroll-progress');
  };
}

function initSiteCinematicCardSpotlights(main, profile = getCinematicProfileConfig()) {
  if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return () => {};

  const selectors = [
    '.card', '.price-card', '.tpl-card', '.manual-card', '.team-card', '.stat-card',
    '.chart-wrap', '.workflow-card', '.testi-card', '.th-card', '.my-template-row',
    '.billing-plan-card', '.resume-row-card', '.auth-card', '.modal', '.command-panel'
  ];

  const nodes = [];
  selectors.forEach((selector) => {
    main.querySelectorAll(selector).forEach((node) => {
      if (!nodes.includes(node)) nodes.push(node);
    });
  });

  const unbind = [];
  nodes.forEach((node) => {
    node.classList.add('cine-spotlight-card');
    node.style.setProperty('--spot-strength', (0.72 + (profile.glow * 0.24)).toFixed(3));

    function onMove(event) {
      const rect = node.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 100;
      const y = ((event.clientY - rect.top) / Math.max(rect.height, 1)) * 100;
      node.style.setProperty('--spot-x', `${x.toFixed(2)}%`);
      node.style.setProperty('--spot-y', `${y.toFixed(2)}%`);
      node.style.setProperty('--spot-o', '1');
    }

    function onLeave() {
      node.style.setProperty('--spot-o', '0');
    }

    node.addEventListener('pointermove', onMove, { passive: true });
    node.addEventListener('pointerenter', onMove, { passive: true });
    node.addEventListener('pointerleave', onLeave);

    unbind.push(() => {
      node.removeEventListener('pointermove', onMove);
      node.removeEventListener('pointerenter', onMove);
      node.removeEventListener('pointerleave', onLeave);
      node.classList.remove('cine-spotlight-card');
      node.style.removeProperty('--spot-x');
      node.style.removeProperty('--spot-y');
      node.style.removeProperty('--spot-o');
      node.style.removeProperty('--spot-strength');
    });
  });

  return () => {
    unbind.forEach((fn) => fn());
  };
}

function initSiteCinematicHeadingShimmer(main, profile = getCinematicProfileConfig()) {
  const headings = [
    ...main.querySelectorAll('.sec-h2, .dash-hello, .docs-h1, .docs-h2, .auth-title, .price-name, .workflow-title, .feat-title'),
  ];

  const duration = `${(7.2 / Math.max(profile.speed, 0.55)).toFixed(2)}s`;
  headings.forEach((node) => {
    node.classList.add('cine-heading-glow');
    node.style.setProperty('--cine-heading-duration', duration);
  });

  return () => {
    headings.forEach((node) => {
      node.classList.remove('cine-heading-glow');
      node.style.removeProperty('--cine-heading-duration');
    });
  };
}

// ── THEME SHOWCASE ──
function renderThemeShowcase() {
  const grid = document.getElementById('theme-showcase-grid');
  if (!grid || typeof THEMES === 'undefined') return;
  grid.innerHTML = Object.values(THEMES).map(t => `
    <div class="th-card" onclick="navigateWithTransition('/builder?theme=${encodeURIComponent(t.id)}')">
      <div class="th-preview" style="background:linear-gradient(135deg,${t.bg},${t.card})">
        <div class="th-preview-name" style="color:${t.accent};font-family:${t.font}">${t.name.toUpperCase()}</div>
        <div class="th-dots"><div class="th-dot" style="background:${t.bg}"></div><div class="th-dot" style="background:${t.accent}"></div><div class="th-dot" style="background:${t.accent2}"></div></div>
      </div>
      <div class="th-foot"><span>${t.name}</span><span class="tag tag-c" style="font-size:.62rem">${t.label}</span></div>
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
