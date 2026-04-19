/* ════════ UTILS.JS ════════ */

// ── API ──
const API = {
  async call(path, options = {}) {
    try {
      const res = await fetch(path, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        credentials: 'include',
        ...options,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });
      const data = await res.json();
      return { ok: res.ok, status: res.status, data };
    } catch (e) {
      return { ok: false, status: 0, data: { error: 'Network error' } };
    }
  },
  get: (path) => API.call(path),
  post: (path, body) => API.call(path, { method: 'POST', body }),
  put: (path, body) => API.call(path, { method: 'PUT', body }),
  delete: (path) => API.call(path, { method: 'DELETE' }),
};

// ── CORE WEB VITALS (RUM) ──
const PerfVitals = {
  initialized: false,
  sent: false,
  observers: [],
  interactionDurations: new Map(),
  sessionId: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
  metrics: {
    lcp_ms: null,
    inp_ms: null,
    cls: null,
    fcp_ms: null,
    ttfb_ms: null,
  },

  toNumber(value, decimals = 2) {
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    return Number(n.toFixed(decimals));
  },

  getPageType() {
    if (window.APP_CONFIG?.page) return String(window.APP_CONFIG.page);
    if (window.PORTFOLIO_DATA?.slug) return 'public-portfolio';
    return String(document.documentElement?.dataset?.page || 'web');
  },

  getConnectionType() {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return String(conn?.effectiveType || '').toLowerCase();
  },

  observe(config, callback) {
    try {
      const observer = new PerformanceObserver((list) => callback(list.getEntries() || []));
      observer.observe(config);
      this.observers.push(observer);
    } catch (_) {
      // Ignore unsupported observer types.
    }
  },

  rate(metric, value) {
    if (value === null || value === undefined) return 'unknown';
    const v = Number(value);
    if (!Number.isFinite(v)) return 'unknown';

    if (metric === 'lcp_ms') {
      if (v <= 2500) return 'good';
      if (v <= 4000) return 'needs-improvement';
      return 'poor';
    }
    if (metric === 'inp_ms') {
      if (v <= 200) return 'good';
      if (v <= 500) return 'needs-improvement';
      return 'poor';
    }
    if (metric === 'cls') {
      if (v <= 0.1) return 'good';
      if (v <= 0.25) return 'needs-improvement';
      return 'poor';
    }
    if (metric === 'fcp_ms') {
      if (v <= 1800) return 'good';
      if (v <= 3000) return 'needs-improvement';
      return 'poor';
    }
    if (metric === 'ttfb_ms') {
      if (v <= 800) return 'good';
      if (v <= 1800) return 'needs-improvement';
      return 'poor';
    }
    return 'unknown';
  },

  getSnapshot() {
    const metrics = {
      lcp_ms: this.metrics.lcp_ms,
      inp_ms: this.metrics.inp_ms,
      cls: this.metrics.cls,
      fcp_ms: this.metrics.fcp_ms,
      ttfb_ms: this.metrics.ttfb_ms,
    };

    return {
      metrics,
      ratings: {
        lcp: this.rate('lcp_ms', metrics.lcp_ms),
        inp: this.rate('inp_ms', metrics.inp_ms),
        cls: this.rate('cls', metrics.cls),
        fcp: this.rate('fcp_ms', metrics.fcp_ms),
        ttfb: this.rate('ttfb_ms', metrics.ttfb_ms),
      },
      page_type: this.getPageType(),
      page_path: window.location.pathname,
      session_id: this.sessionId,
    };
  },

  buildPayload(reason = 'pagehide') {
    const m = this.metrics;
    if ([m.lcp_ms, m.inp_ms, m.cls, m.fcp_ms, m.ttfb_ms].every((v) => v === null || v === undefined)) {
      return null;
    }

    return {
      page_path: window.location.pathname,
      page_type: this.getPageType(),
      lcp_ms: m.lcp_ms,
      inp_ms: m.inp_ms,
      cls: m.cls,
      fcp_ms: m.fcp_ms,
      ttfb_ms: m.ttfb_ms,
      network_type: this.getConnectionType(),
      device_memory: Number(navigator.deviceMemory || 0) || null,
      viewport: `${Math.max(0, window.innerWidth)}x${Math.max(0, window.innerHeight)}`,
      session_id: this.sessionId,
      reason,
      created_at: new Date().toISOString(),
    };
  },

  send(reason = 'pagehide') {
    if (this.sent) return;
    const payload = this.buildPayload(reason);
    if (!payload) return;
    this.sent = true;

    const body = JSON.stringify(payload);
    try {
      if (navigator.sendBeacon) {
        const ok = navigator.sendBeacon('/api/perf/vitals', new Blob([body], { type: 'application/json' }));
        if (ok) return;
      }
    } catch (_) {
      // Fallback fetch below.
    }

    fetch('/api/perf/vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body,
      keepalive: true,
    }).catch(() => {
      // Ignore network failures for telemetry.
    });
  },

  init() {
    if (this.initialized) return;
    if (!('PerformanceObserver' in window)) return;
    if (navigator.webdriver) return;
    this.initialized = true;

    const navEntry = performance.getEntriesByType('navigation')[0];
    if (navEntry?.responseStart) {
      this.metrics.ttfb_ms = this.toNumber(navEntry.responseStart, 2);
    }

    this.observe({ type: 'paint', buffered: true }, (entries) => {
      entries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          this.metrics.fcp_ms = this.toNumber(entry.startTime, 2);
        }
      });
    });

    this.observe({ type: 'largest-contentful-paint', buffered: true }, (entries) => {
      const last = entries[entries.length - 1];
      if (!last) return;
      this.metrics.lcp_ms = this.toNumber(last.startTime, 2);
    });

    let clsAccumulator = 0;
    this.observe({ type: 'layout-shift', buffered: true }, (entries) => {
      entries.forEach((entry) => {
        if (entry.hadRecentInput) return;
        clsAccumulator += Number(entry.value || 0);
      });
      this.metrics.cls = this.toNumber(clsAccumulator, 4);
    });

    this.observe({ type: 'event', buffered: true, durationThreshold: 40 }, (entries) => {
      entries.forEach((entry) => {
        const duration = Number(entry.duration || 0);
        if (!Number.isFinite(duration) || duration <= 0) return;

        const interactionId = Number(entry.interactionId || 0);
        let current = duration;
        if (interactionId > 0) {
          const previous = this.interactionDurations.get(interactionId) || 0;
          if (duration > previous) this.interactionDurations.set(interactionId, duration);
          current = this.interactionDurations.get(interactionId) || duration;
        }

        const existing = Number(this.metrics.inp_ms || 0);
        if (current > existing) {
          this.metrics.inp_ms = this.toNumber(current, 2);
        }
      });
    });

    const onHidden = () => {
      if (document.visibilityState === 'hidden') this.send('hidden');
    };
    document.addEventListener('visibilitychange', onHidden, { capture: true });
    window.addEventListener('pagehide', () => this.send('pagehide'), { capture: true });

    // Fallback flush for long-lived tabs.
    setTimeout(() => this.send('idle-timeout'), 15000);
  },
};

window.PerfVitals = PerfVitals;

// ── TOAST ──
const Toast = {
  show(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    const icons = { success: 'OK', error: 'ERR', info: 'INFO' };
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span style="font-size:.72rem;font-weight:800;letter-spacing:.4px">${icons[type]||'INFO'}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('toast-exit');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },
  success: (msg, d) => Toast.show(msg, 'success', d),
  error: (msg, d) => Toast.show(msg, 'error', d),
  info: (msg, d) => Toast.show(msg, 'info', d),
};

// ── DOM HELPERS ──
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function el(tag, props = {}, children = []) {
  const elem = document.createElement(tag);
  Object.entries(props).forEach(([k, v]) => {
    if (k === 'class') elem.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(elem.style, v);
    else if (k.startsWith('on')) elem.addEventListener(k.slice(2).toLowerCase(), v);
    else elem.setAttribute(k, v);
  });
  children.forEach(c => {
    if (typeof c === 'string') elem.appendChild(document.createTextNode(c));
    else if (c) elem.appendChild(c);
  });
  return elem;
}

function setHTML(selector, html) {
  const elem = typeof selector === 'string' ? $(selector) : selector;
  if (elem) elem.innerHTML = html;
}

function on(sel, event, fn, ctx = document) {
  const elem = typeof sel === 'string' ? $(sel, ctx) : sel;
  if (elem) elem.addEventListener(event, fn);
}

// ── ANIMATIONS ──
function animateCounter(el, target, duration = 1800, suffix = '') {
  let start = 0;
  const steps = Math.min(target, 80);
  const increment = target / steps;
  const timer = setInterval(() => {
    start = Math.min(start + increment, target);
    el.textContent = Math.floor(start).toLocaleString() + suffix;
    if (start >= target) clearInterval(timer);
  }, duration / steps);
}

function observeAndAnimate(selector, callback, threshold = 0.2) {
  const elements = $$(selector);
  if (!elements.length) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { callback(e.target); io.unobserve(e.target); }
    });
  }, { threshold });
  elements.forEach(el => io.observe(el));
}

// ── MISC ──
function toggleMob() {
  const menu = document.getElementById('mob-menu');
  const btn = document.getElementById('mob-btn');
  if (!menu) return;
  menu.classList.toggle('open');
  const isOpen = menu.classList.contains('open');
  menu.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
  if (btn) btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  if (!btn) return;
  const spans = btn.querySelectorAll('.ham span');
  if (isOpen) {
    spans[0].style.transform = 'rotate(45deg) translate(3.5px,3.5px)';
    spans[1].style.opacity = '0';
    spans[2].style.transform = 'rotate(-45deg) translate(3.5px,-3.5px)';
  } else {
    spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
  }
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function generateId() { return Math.random().toString(36).slice(2, 11); }

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => Toast.success('Copied to clipboard!')).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); ta.remove(); Toast.success('Copied!');
  });
}

// ── VALIDATION ──
const Validate = {
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  required: (v) => v && v.trim().length > 0,
  minLen: (v, n) => v && v.length >= n,
  username: (v) => /^[a-z0-9_]{3,20}$/.test(v),
};

// Close mobile menu on outside click
document.addEventListener('click', e => {
  const menu = document.getElementById('mob-menu');
  const btn = document.getElementById('mob-btn');
  if (menu && btn && menu.classList.contains('open') && !menu.contains(e.target) && !btn.contains(e.target)) {
    menu.classList.remove('open');
    menu.setAttribute('aria-hidden', 'true');
    btn.setAttribute('aria-expanded', 'false');
    btn.querySelectorAll('.ham span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
  }
});

// Close modal on overlay click
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-ov')) {
    e.target.classList.remove('open');
  }
});

// Escape key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-ov.open').forEach(m => m.classList.remove('open'));
    const menu = document.getElementById('mob-menu');
    const btn = document.getElementById('mob-btn');
    if (menu) {
      menu.classList.remove('open');
      menu.setAttribute('aria-hidden', 'true');
    }
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }
});

document.addEventListener('DOMContentLoaded', () => {
  if (window.PerfVitals?.init) {
    window.PerfVitals.init();
  }
});
