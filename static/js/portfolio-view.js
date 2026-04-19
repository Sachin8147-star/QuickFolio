/* ════════ PORTFOLIO-VIEW.JS
   Runs on /p/<slug> public portfolio pages
   Data comes from window.PORTFOLIO_DATA (server-injected)
════════ */

(function () {
  'use strict';

  const PD = window.PORTFOLIO_DATA || {};
  const portfolio = PD.portfolio || {};
  const sections  = PD.sections  || [];
  const owner     = PD.owner     || {};
  const slug      = PD.slug      || '';
  const ASSET_VERSION = '20260419crafted17';
  const LOADED_SCRIPT_IDS = new Set();
  const CINEMATIC_PROFILE_KEY = 'quickfolio.cinematic.profile';
  const CINEMATIC_PROFILE_KEY_LEGACY = 'QuickFolio.cinematic.profile';
  const CINEMATIC_PROFILES = {
    subtle: {
      id: 'subtle',
      density: 0.72,
      speed: 0.84,
      glow: 0.74,
      ambient: 0.68,
      routeMs: 320,
    },
    balanced: {
      id: 'balanced',
      density: 1,
      speed: 1,
      glow: 1,
      ambient: 1,
      routeMs: 420,
    },
    extreme: {
      id: 'extreme',
      density: 1.45,
      speed: 1.24,
      glow: 1.28,
      ambient: 1.2,
      routeMs: 540,
    },
  };

  function resolveCinematicProfileId() {
    let stored = '';
    try {
      stored = localStorage.getItem(CINEMATIC_PROFILE_KEY) || localStorage.getItem(CINEMATIC_PROFILE_KEY_LEGACY) || '';
    } catch (_) {
      stored = '';
    }

    const normalized = String(stored || '').trim().toLowerCase();
    return CINEMATIC_PROFILES[normalized] ? normalized : 'balanced';
  }

  const cinematicProfileId = resolveCinematicProfileId();
  const cinematicProfile = CINEMATIC_PROFILES[cinematicProfileId] || CINEMATIC_PROFILES.balanced;
  let routeTransitionLocked = false;

  function runWhenIdle(task, timeout = 1200) {
    if (typeof task !== 'function') return;
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => task(), { timeout });
    } else {
      setTimeout(task, Math.min(timeout, 350));
    }
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

  async function initPortfolioChatbotWhenReady(containerId, themeConfig) {
    if (typeof PortfolioChatbot === 'undefined') {
      await ensureScript('portfolio-chatbot-runtime', '/static/js/chatbot.js');
    }
    if (typeof PortfolioChatbot !== 'undefined') {
      PortfolioChatbot.init(containerId, slug, themeConfig);
    }
  }

  function applyPortfolioCinematicVariables() {
    document.body.dataset.cinematicProfile = cinematicProfile.id;
    document.body.style.setProperty('--pf-cine-glow-scale', cinematicProfile.glow.toFixed(3));
    document.body.style.setProperty('--pf-cine-spotlight-scale', cinematicProfile.glow.toFixed(3));
    document.body.style.setProperty('--pf-cine-heading-duration', `${(7 / Math.max(cinematicProfile.speed, 0.5)).toFixed(2)}s`);
    document.body.style.setProperty('--pf-route-transition-duration', `${Math.round(cinematicProfile.routeMs)}ms`);
  }

  function getPortfolioRouteTransitionDuration() {
    return Math.max(220, Number(cinematicProfile.routeMs || 420));
  }

  function ensurePortfolioRouteTransitionLayer() {
    let layer = document.getElementById('pf-route-transition-layer');
    if (!layer) {
      layer = document.createElement('div');
      layer.id = 'pf-route-transition-layer';
      layer.setAttribute('aria-hidden', 'true');
      document.body.appendChild(layer);
    }
    return layer;
  }

  function initPortfolioRouteTransitions(disabled) {
    const runEnter = () => {
      if (disabled) return;
      const layer = ensurePortfolioRouteTransitionLayer();
      layer.classList.remove('pf-route-leave', 'pf-route-enter', 'is-active');
      layer.classList.add('pf-route-enter');
      requestAnimationFrame(() => {
        layer.classList.add('is-active');
      });
      window.setTimeout(() => {
        layer.classList.remove('pf-route-enter', 'is-active');
      }, getPortfolioRouteTransitionDuration() + 90);
    };

    const onClick = (event) => {
      const anchor = event.target?.closest?.('a[href]');
      if (!anchor || event.defaultPrevented) return;
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (anchor.dataset.noTransition === '1') return;
      if (anchor.hasAttribute('download')) return;
      if (anchor.target && anchor.target !== '_self') return;

      const rawHref = anchor.getAttribute('href') || '';
      if (!rawHref || rawHref.startsWith('#')) return;
      if (/^(mailto:|tel:|javascript:)/i.test(rawHref)) return;

      const url = new URL(rawHref, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname.toLowerCase().endsWith('.pdf')) return;

      const samePath = url.pathname === window.location.pathname && url.search === window.location.search;
      if (samePath && url.hash) return;

      const destination = `${url.pathname}${url.search}${url.hash}`;
      const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (destination === current) return;

      event.preventDefault();

      if (disabled || routeTransitionLocked) {
        window.location.assign(destination);
        return;
      }

      routeTransitionLocked = true;
      const layer = ensurePortfolioRouteTransitionLayer();
      layer.classList.remove('pf-route-enter', 'pf-route-leave', 'is-active');
      layer.classList.add('pf-route-leave');
      requestAnimationFrame(() => {
        layer.classList.add('is-active');
      });

      window.setTimeout(() => {
        window.location.assign(destination);
      }, getPortfolioRouteTransitionDuration() + 30);
    };

    document.addEventListener('click', onClick, true);
    runEnter();

    return () => {
      document.removeEventListener('click', onClick, true);
    };
  }

  /* ── resolve theme ── */
  const themeBank = (window.QUICKFOLIO_THEME_BANK && typeof window.QUICKFOLIO_THEME_BANK === 'object')
    ? window.QUICKFOLIO_THEME_BANK
    : ((window.QuickFolio_THEME_BANK && typeof window.QuickFolio_THEME_BANK === 'object') ? window.QuickFolio_THEME_BANK : null);
  const THEMES = themeBank
    ? themeBank
    : {
      cyberpunk: { id:'cyberpunk', bg:'#0a0a0f', surface:'#11111c', card:'#18182a', border:'#28284a', border2:'#3a3a60', accent:'#00ffcc', accent2:'#ff00aa', text:'#dde0ff', muted:'#6060a0', grad:'linear-gradient(135deg,#00ffcc,#ff00aa)', font:"'Orbitron',monospace", body:"'Outfit',sans-serif", label:'Orbitron' },
      aurora: { id:'aurora', bg:'#050510', surface:'#0c0c20', card:'#12123a', border:'#1e1e50', border2:'#2a2a66', accent:'#7c3aed', accent2:'#06b6d4', text:'#e2e8f0', muted:'#64748b', grad:'linear-gradient(135deg,#7c3aed,#06b6d4)', font:"'Syne',sans-serif", body:"'Outfit',sans-serif", label:'Syne' },
      obsidian: { id:'obsidian', bg:'#09090b', surface:'#111113', card:'#1c1c1f', border:'#28282c', border2:'#3a3a40', accent:'#f59e0b', accent2:'#ef4444', text:'#fafafa', muted:'#71717a', grad:'linear-gradient(135deg,#f59e0b,#ef4444)', font:"'Syne',sans-serif", body:"'Outfit',sans-serif", label:'Syne' },
      forest: { id:'forest', bg:'#050f08', surface:'#091610', card:'#0e2016', border:'#18361e', border2:'#224a28', accent:'#22c55e', accent2:'#84cc16', text:'#f0fdf4', muted:'#4d7c5a', grad:'linear-gradient(135deg,#22c55e,#84cc16)', font:"'Syne',sans-serif", body:"'Outfit',sans-serif", label:'Syne' },
      ocean: { id:'ocean', bg:'#020b18', surface:'#041525', card:'#071e35', border:'#0c3050', border2:'#144070', accent:'#38bdf8', accent2:'#818cf8', text:'#f0f9ff', muted:'#4a7a9b', grad:'linear-gradient(135deg,#38bdf8,#818cf8)', font:"'Orbitron',monospace", body:"'Outfit',sans-serif", label:'Orbitron' },
    };

  const DESIGN_FONT_MAP = {
    'Orbitron': "'Orbitron',monospace",
    'Syne': "'Syne',sans-serif",
    'Outfit': "'Outfit',sans-serif",
    'DM Mono': "'DM Mono',monospace",
    'Manrope': "'Manrope',sans-serif",
    'Sora': "'Sora',sans-serif",
    'Space Grotesk': "'Space Grotesk',sans-serif",
    'Fraunces': "'Fraunces',serif",
  };

  function parseSectionContent(raw) {
    if (raw && typeof raw === 'object') return raw;
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : {};
      } catch (_) {
        return {};
      }
    }
    return {};
  }

  function clampDesignNumber(value, min, max, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, n));
  }

  function pickDesignFont(value, fallback) {
    const key = String(value || '').trim();
    if (!key || key === 'default') return fallback;
    return DESIGN_FONT_MAP[key] || fallback;
  }

  function escapeCssUrl(value) {
    return String(value || '').replace(/"/g, '%22').replace(/'/g, '%27');
  }

  function applyCustomTheme(baseTheme, heroSection) {
    const design = heroSection?.design && typeof heroSection.design === 'object' ? heroSection.design : {};
    const sectionScaleDefaults = {
      hero: 100, about: 100, skills: 100, projects: 100, experience: 100,
      education: 100, stats: 100, timeline: 100, testimonials: 100, contact: 100,
    };
    const sectionFontDefaults = {
      hero: 'default', about: 'default', skills: 'default', projects: 'default', experience: 'default',
      education: 'default', stats: 'default', timeline: 'default', testimonials: 'default', contact: 'default',
    };

    const bgImageUrl = String(design.bg_image_url || '').trim();
    const bgSize = clampDesignNumber(design.bg_size, 60, 220, 100);
    const bgOverlay = clampDesignNumber(design.bg_overlay, 0, 90, 45);
    const bgPosX = clampDesignNumber(design.bg_pos_x, 0, 100, 50);
    const bgPosY = clampDesignNumber(design.bg_pos_y, 0, 100, 50);
    const textScale = clampDesignNumber(design.text_scale, 85, 140, 100);
    const headingScale = clampDesignNumber(design.heading_scale, 80, 145, 100) / 100;
    const bodyScale = clampDesignNumber(design.body_scale, 80, 145, 100) / 100;
    const sectionSpacing = clampDesignNumber(design.section_spacing, 45, 130, 80);
    const cardRadius = clampDesignNumber(design.card_radius, 8, 32, 16);

    const sectionScalesRaw = (design.section_scales && typeof design.section_scales === 'object' && !Array.isArray(design.section_scales))
      ? design.section_scales
      : {};
    const sectionScales = {};
    Object.keys(sectionScaleDefaults).forEach((key) => {
      sectionScales[key] = clampDesignNumber(sectionScalesRaw[key], 80, 150, 100) / 100;
    });

    const sectionFontsRaw = (design.section_fonts && typeof design.section_fonts === 'object' && !Array.isArray(design.section_fonts))
      ? design.section_fonts
      : {};
    const sectionFonts = {};
    Object.keys(sectionFontDefaults).forEach((key) => {
      const candidate = String(sectionFontsRaw[key] || 'default').trim();
      sectionFonts[key] = ['default', 'Orbitron', 'Syne', 'Outfit', 'DM Mono', 'Manrope', 'Sora', 'Space Grotesk', 'Fraunces'].includes(candidate) ? candidate : 'default';
    });

    const photoOffsetX = clampDesignNumber(heroSection?.photo_offset_x, -160, 160, 0);
    const photoOffsetY = clampDesignNumber(heroSection?.photo_offset_y, -160, 160, 0);

    const bg = String(design.bg_color || '').trim() || baseTheme.bg;
    const surface = String(design.surface_color || '').trim() || baseTheme.surface;
    const card = String(design.card_color || '').trim() || baseTheme.card;
    const border = String(design.border_color || '').trim() || baseTheme.border;
    const border2 = String(design.border2_color || '').trim() || baseTheme.border2;
    const accent = String(design.accent_color || '').trim() || baseTheme.accent;
    const accent2 = String(design.accent2_color || '').trim() || baseTheme.accent2;
    const text = String(design.text_color || '').trim() || baseTheme.text;
    const muted = String(design.muted_color || '').trim() || baseTheme.muted;
    const font = pickDesignFont(design.heading_font, baseTheme.font);
    const body = pickDesignFont(design.body_font, baseTheme.body);
    const customThemeName = String(design.custom_theme_name || '').trim();

    return {
      ...baseTheme,
      name: baseTheme.id === 'custom' && customThemeName ? customThemeName : baseTheme.name,
      bg,
      surface,
      card,
      border,
      border2,
      accent,
      accent2,
      muted,
      text,
      font,
      body,
      grad: `linear-gradient(135deg,${accent},${accent2})`,
      _design: {
        bgImageUrl,
        bgSize,
        bgOverlay,
        bgPosX,
        bgPosY,
        textScale,
        headingScale,
        bodyScale,
        sectionSpacing,
        cardRadius,
        sectionScales,
        sectionFonts,
        photoOffsetX,
        photoOffsetY,
      },
    };
  }

  /* ── section data keyed by type ── */
  const sdata = {};
  sections.forEach(s => { sdata[s.section_type] = parseSectionContent(s.content); });

  function getRecruiterStorageKey() {
    return slug ? `quickfolio.recruiter-mode.${slug}` : 'quickfolio.recruiter-mode.default';
  }

  function getLegacyRecruiterStorageKey() {
    return slug ? `QuickFolio.recruiter-mode.${slug}` : 'QuickFolio.recruiter-mode.default';
  }

  function readRecruiterModePreference(fallback) {
    try {
      const raw = localStorage.getItem(getRecruiterStorageKey()) || localStorage.getItem(getLegacyRecruiterStorageKey());
      if (raw === '1') return true;
      if (raw === '0') return false;
    } catch (_) {
      // Ignore storage read errors.
    }
    return Boolean(fallback);
  }

  function writeRecruiterModePreference(enabled) {
    try {
      localStorage.setItem(getRecruiterStorageKey(), enabled ? '1' : '0');
    } catch (_) {
      // Ignore storage write errors.
    }
  }

  let recruiterMode = readRecruiterModePreference(Boolean(sdata.hero?.recruiter_mode_enabled));

  const baseTheme = THEMES[portfolio.theme] || THEMES.cyberpunk || Object.values(THEMES)[0];
  const t = applyCustomTheme(baseTheme, sdata.hero || {});
  const design = t._design || {};
  const bgStyle = design.bgImageUrl
    ? `background-image:linear-gradient(rgba(0,0,0,${(design.bgOverlay / 100).toFixed(2)}),rgba(0,0,0,${(design.bgOverlay / 100).toFixed(2)})),url('${escapeCssUrl(design.bgImageUrl)}');background-size:${design.bgSize}% auto;background-position:${design.bgPosX}% ${design.bgPosY}%;background-repeat:no-repeat;background-attachment:fixed;`
    : '';

  /* ── inject CSS variables ── */
  const root = document.getElementById('portfolio-root') || document.body;
  root.style.cssText = `
    --bg:${t.bg};--surface:${t.surface};--card:${t.card};
    --border:${t.border};--border2:${t.border2};
    --accent:${t.accent};--a2:${t.accent2};--text:${t.text};--muted:${t.muted};
    --grad:${t.grad};--fn:${t.font};--fb:${t.body};
    background:${t.bg};color:${t.text};font-family:${t.body};font-size:${design.textScale || 100}%;
    ${bgStyle}
    min-height:100vh;
    min-height:100dvh;
  `;
  applyPortfolioCinematicVariables();

  const firstName = (sdata.hero?.name || owner.name || 'Developer').split(' ')[0];
  const resumeHref = slug ? `/p/${encodeURIComponent(slug)}/resume.pdf` : '';
  const G = t.grad;
  const GT = `background:${G};-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text`;

  function normalizeUrl(value) {
    const v = String(value || '').trim();
    if (!v) return '';
    if (/^(https?:\/\/|mailto:|tel:)/i.test(v)) return v;
    return `https://${v}`;
  }

  function sanitizeTrackingToken(value, fallback = 'direct') {
    const normalized = String(value || '').trim().toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/-{2,}/g, '-')
      .replace(/^-+|-+$/g, '');
    return (normalized || fallback).slice(0, 40);
  }

  function buildTrackedPortfolioUrl(source, campaign) {
    const safeSource = sanitizeTrackingToken(source, 'direct');
    const safeCampaign = sanitizeTrackingToken(campaign, 'portfolio_share');
    const tracked = new URL(window.location.href);
    tracked.search = '';
    tracked.searchParams.set('utm_source', safeSource);
    tracked.searchParams.set('utm_medium', 'social');
    tracked.searchParams.set('utm_campaign', safeCampaign);
    return tracked.toString();
  }

  function buildSocialCopyBundle(sourceKey) {
    const hero = sdata.hero || {};
    const role = hero.title || 'Developer';
    const skills = (sdata.skills?.categories || [])
      .flatMap((cat) => (cat.items || []).map((item) => item.n))
      .filter(Boolean)
      .slice(0, 4)
      .join(', ');
    const projectTitles = (sdata.projects?.items || [])
      .map((item) => item.title)
      .filter(Boolean)
      .slice(0, 2)
      .join(' + ');
    const trackedLink = buildTrackedPortfolioUrl(sourceKey, 'portfolio_launch');

    const shortHook = `Updated my ${role} portfolio with real case studies and measurable outcomes. Feedback welcome.`;
    const linkedInPost = [
      `I just rebuilt my portfolio for 2026 hiring signals.`,
      projectTitles ? `\nFocus projects: ${projectTitles}.` : '',
      skills ? `\nCore stack: ${skills}.` : '',
      `\n\nTake a look: ${trackedLink}`,
      `\n\n#Portfolio #OpenToWork #SoftwareEngineer #QuickFolio`
    ].join('');

    return { shortHook, linkedInPost, trackedLink };
  }

  async function copyTextWithFallback(text) {
    const value = String(text || '');
    if (!value) return false;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        return true;
      }
    } catch (_) {
      // Try legacy fallback below.
    }

    try {
      const ta = document.createElement('textarea');
      ta.value = value;
      ta.setAttribute('readonly', 'readonly');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const copied = document.execCommand('copy');
      document.body.removeChild(ta);
      return Boolean(copied);
    } catch (_) {
      return false;
    }
  }

  function showShareFeedback(message, isError) {
    const feedback = document.getElementById('pf-share-feedback');
    if (!feedback) return;
    feedback.textContent = String(message || '');
    feedback.style.color = isError ? '#fb7185' : t.accent;
  }

  function openShareWindow(url) {
    window.open(url, '_blank', 'noopener,noreferrer,width=980,height=760');
  }

  function buildShareDock() {
    return `<div class="pf-share-dock" id="pf-share-dock">
      <button class="pf-share-main" onclick="pfToggleShareDock()">Share Growth Kit</button>
      <div class="pf-share-panel" id="pf-share-panel">
        <div class="pf-share-title">Distribution Actions</div>
        <div class="pf-share-grid">
          <button class="pf-share-btn" onclick="pfShareNative()">Native Share</button>
          <button class="pf-share-btn" onclick="pfCopyTrackedLink('direct')">Copy Link</button>
          <button class="pf-share-btn" onclick="pfShareNetwork('linkedin')">LinkedIn</button>
          <button class="pf-share-btn" onclick="pfShareNetwork('x')">X</button>
          <button class="pf-share-btn" onclick="pfShareNetwork('whatsapp')">WhatsApp</button>
          <button class="pf-share-btn" onclick="pfShareNetwork('reddit')">Reddit</button>
        </div>
        <div class="pf-share-title" style="margin-top:10px">Content Copy</div>
        <div class="pf-share-grid">
          <button class="pf-share-btn" onclick="pfCopyLinkedInPost()">Copy LinkedIn Post</button>
          <button class="pf-share-btn" onclick="pfCopyShortHook()">Copy Short Hook</button>
        </div>
        <div id="pf-share-feedback" class="pf-share-feedback">Each share link is auto-tagged for analytics tracking.</div>
      </div>
    </div>`;
  }

  /* ─────────────────────────────────────────
     SECTION RENDERERS
  ───────────────────────────────────────── */

  function cardStyle() {
    return `background:${t.card};border:1px solid ${t.border};border-radius:${design.cardRadius || 16}px;padding:clamp(14px,3vw,22px);transition:.3s`;
  }

  function sectionWrap(id, inner, altBg) {
    const sectionSpacing = design.sectionSpacing || 80;
    const spacingMin = Math.max(30, Math.round(sectionSpacing - 28));
    const sectionScale = (design.sectionScales && design.sectionScales[id]) ? design.sectionScales[id] : 1;
    const bodyScale = design.bodyScale || 1;
    const sectionFontKey = (design.sectionFonts && design.sectionFonts[id]) ? design.sectionFonts[id] : 'default';
    const sectionFont = pickDesignFont(sectionFontKey, t.body);
    return `<section id="pf-${id}" class="pf-section-shell pf-section pf-reveal" data-section="${id}" style="padding:clamp(${spacingMin}px,8vw,${sectionSpacing}px) clamp(16px,4.5vw,32px);${altBg ? 'background:' + t.surface : ''}">
      <div class="pf-section-inner" style="max-width:1100px;margin:0 auto;font-size:calc(1rem * ${bodyScale} * ${sectionScale});font-family:${sectionFont}">${inner}</div>
    </section>`;
  }

  function sectionTitle(text) {
    const headingScale = design.headingScale || 1;
    return `<h2 style="font-family:${t.font};font-size:calc(clamp(1.5rem,3vw,2.2rem) * ${headingScale});font-weight:800;margin-bottom:6px;${GT}">${text}</h2>
    <div style="width:46px;height:3px;background:${G};border-radius:2px;margin-bottom:32px"></div>`;
  }

  function renderHero(d) {
    d = d || {};
    const photoUrl = String(d.photo_url || '').trim();
    const photoSize = clampDesignNumber(d.photo_size, 90, 280, 170);
    const photoRadius = d.photo_shape === 'rounded' ? '18px' : '50%';
    const photoOffsetX = clampDesignNumber(d.photo_offset_x ?? design.photoOffsetX, -160, 160, 0);
    const photoOffsetY = clampDesignNumber(d.photo_offset_y ?? design.photoOffsetY, -160, 160, 0);
    return `<section id="pf-hero" class="pf-section-shell pf-hero-shell pf-reveal is-visible" style="min-height:100vh;min-height:100dvh;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;text-align:center;padding:clamp(60px,10vw,100px) clamp(16px,4vw,24px)">
      <div style="position:absolute;inset:0;background-image:linear-gradient(${t.border} 1px,transparent 1px),linear-gradient(90deg,${t.border} 1px,transparent 1px);background-size:50px 50px;opacity:.22"></div>
      <div style="position:absolute;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,${t.accent}14,transparent 70%);top:-15%;left:-12%;pointer-events:none;filter:blur(60px)"></div>
      <div style="position:absolute;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,${t.accent2}12,transparent 70%);bottom:-12%;right:-10%;pointer-events:none;filter:blur(60px)"></div>
      <div class="pf-hero-inner" style="position:relative;z-index:1;max-width:800px;animation:pf-fade .8s ease">
        ${photoUrl ? `<img src="${photoUrl}" alt="Profile photo" style="width:${photoSize}px;height:${photoSize}px;object-fit:cover;border-radius:${photoRadius};border:3px solid ${t.border2};box-shadow:0 20px 40px rgba(0,0,0,.35);margin:0 auto 18px;display:block;transform:translate(${photoOffsetX}px, ${photoOffsetY}px)">` : ''}
        <div style="display:inline-flex;align-items:center;gap:7px;padding:5px 15px;background:${t.accent}10;border:1px solid ${t.accent}30;border-radius:50px;font-size:.7rem;font-weight:700;color:${t.accent};letter-spacing:.8px;text-transform:uppercase;margin-bottom:24px">
          <div style="width:6px;height:6px;border-radius:50%;background:#22c55e;animation:pf-pulse 2s infinite"></div>
          Available for hire
        </div>
        <h1 style="font-family:${t.font};font-size:clamp(2rem,6vw,4.5rem);font-weight:900;line-height:1.06;margin-bottom:14px;${GT};background-size:200%;animation:pf-grad 4s ease infinite">${d.name || 'Your Name'}</h1>
        <p style="font-size:clamp(.75rem,1.5vw,1rem);color:${t.muted};margin-bottom:8px;letter-spacing:2px;text-transform:uppercase">${d.title || 'Full-Stack Developer'}</p>
        <p class="pf-hero-tagline" style="font-size:clamp(.9rem,1.8vw,1.1rem);color:${t.text};opacity:.82;margin-bottom:10px">${d.tagline || ''}</p>
        <p class="pf-hero-subtitle" style="font-size:.77rem;color:${t.muted};letter-spacing:2.5px;text-transform:uppercase;margin-bottom:28px">${d.subtitle || ''}</p>
        <div class="pf-hero-actions" style="display:flex;gap:11px;justify-content:center;flex-wrap:wrap;margin-bottom:30px">
          <button onclick="document.getElementById('pf-contact')?.scrollIntoView({behavior:'smooth'})" style="background:${G};color:#000;border:none;padding:12px 26px;border-radius:9px;font-weight:800;font-size:.88rem;cursor:pointer;transition:.3s" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">${d.cta || 'View My Work'}</button>
          ${resumeHref
            ? `<a href="${resumeHref}" style="background:transparent;color:${t.accent};border:1.5px solid ${t.accent};padding:12px 26px;border-radius:9px;font-weight:600;font-size:.88rem;cursor:pointer;transition:.3s;display:inline-block" onmouseover="this.style.background='${t.accent}14'" onmouseout="this.style.background='transparent'">Download Resume PDF</a>`
            : `<span style="background:transparent;color:${t.muted};border:1.5px solid ${t.border};padding:12px 26px;border-radius:9px;font-weight:600;font-size:.88rem;display:inline-block">Resume unavailable</span>`}
        </div>
        <div class="pf-social-row" style="display:flex;gap:9px;justify-content:center;flex-wrap:wrap">
          ${[
            ['🐙', 'GitHub', d.github],
            ['💼', 'LinkedIn', d.linkedin],
            ['𝕏', 'Twitter', d.twitter]
          ].map(([i, label, raw]) => {
            const href = normalizeUrl(raw);
            return href
              ? `<a href="${href}" target="_blank" rel="noopener noreferrer" style="padding:5px 13px;background:${t.card};border:1px solid ${t.border};border-radius:7px;font-size:.73rem;color:${t.muted};text-decoration:none;transition:.2s" onmouseover="this.style.borderColor='${t.accent}';this.style.color='${t.accent}'" onmouseout="this.style.borderColor='${t.border}';this.style.color='${t.muted}'">${i} ${label}</a>`
              : `<span style="padding:5px 13px;background:${t.card};border:1px solid ${t.border};border-radius:7px;font-size:.73rem;color:${t.muted}">${i} ${label}</span>`;
          }).join('')}
        </div>
      </div>
    </section>`;
  }

  function renderAbout(d) {
    d = d || {};
    const profilePhoto = String(d.photo_url || sdata.hero?.photo_url || '').trim();
    const avatarSize = clampDesignNumber(sdata.hero?.photo_size, 110, 190, 160);
    const avatarRadius = (sdata.hero?.photo_shape === 'rounded') ? '18px' : '16px';
    const avatarSrc = profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(d.name || firstName)}`;
    return sectionWrap('about', `
      ${sectionTitle('About Me')}
      <div class="pf-about-grid" style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,2fr);gap:clamp(20px,5vw,48px);align-items:center">
        <div style="text-align:center">
          <img src="${avatarSrc}" style="width:${avatarSize}px;height:${avatarSize}px;object-fit:cover;border-radius:${avatarRadius};border:2px solid ${t.border};animation:pf-float 3s ease-in-out infinite;margin:0 auto 14px;display:block" alt="avatar">
          <div style="display:inline-flex;align-items:center;gap:5px;background:#22c55e14;border:1px solid #22c55e35;color:#22c55e;padding:4px 12px;border-radius:20px;font-size:.7rem;font-weight:700">
            <div style="width:5px;height:5px;border-radius:50%;background:#22c55e;animation:pf-pulse 2s infinite"></div>
            ${d.availability || 'Open to work'}
          </div>
          <div style="color:${t.muted};font-size:.8rem;margin-top:8px">Location: ${d.location || 'India'}</div>
        </div>
        <div>
          <p style="color:${t.text};opacity:.85;line-height:1.8;font-size:clamp(.87rem,1.5vw,1.03rem);margin-bottom:20px">${d.bio || ''}</p>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            ${(d.highlights || []).map(h => `<span style="background:${t.accent2}12;border:1px solid ${t.accent2}30;color:${t.accent2};padding:5px 13px;border-radius:20px;font-size:.76rem;font-weight:700">${h}</span>`).join('')}
          </div>
        </div>
      </div>`);
  }

  function renderSkills(d) {
    d = d || { categories: [] };
    return sectionWrap('skills', `
      ${sectionTitle('Skills & Stack')}
      <div class="pf-skills-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:18px">
        ${(d.categories || []).map(cat => `
        <div class="pf-card-hover" style="${cardStyle()}">
          <div style="font-family:${t.font};color:${t.accent};font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:17px">${cat.name}</div>
          ${(cat.items || []).map(sk => `
          <div style="margin-bottom:13px">
            <div style="display:flex;justify-content:space-between;margin-bottom:5px">
              <span style="font-size:.82rem;font-weight:600">${sk.n}</span>
              <span style="color:${t.accent};font-size:.7rem;font-weight:700;font-family:monospace">${sk.v}%</span>
            </div>
            <div style="background:${t.border};border-radius:4px;height:5px;overflow:hidden">
              <div class="skill-anim" data-val="${sk.v}" style="height:100%;width:0%;background:${G};border-radius:4px;position:relative;overflow:hidden">
                <div style="position:absolute;top:0;right:0;bottom:0;width:25px;background:linear-gradient(to right,transparent,rgba(255,255,255,.4),transparent);animation:pf-shimmer 1.5s ease infinite"></div>
              </div>
            </div>
          </div>`).join('')}
        </div>`).join('')}
      </div>`, true);
  }

  function renderProjects(d) {
    d = d || { items: [] };
    const techs = [...new Set((d.items || []).flatMap(p => p.tech || []))];
    return sectionWrap('projects', `
      ${sectionTitle('Projects')}
      <div class="pf-project-filters" style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:22px" id="pf-proj-filters">
        <button onclick="pfFilter('all',this)" data-f="all" style="padding:5px 13px;border-radius:20px;font-size:.73rem;font-weight:700;border:1.5px solid ${t.accent};background:${t.accent}14;color:${t.accent};cursor:pointer">All</button>
        ${techs.map(tech => `<button onclick="pfFilter('${tech}',this)" data-f="${tech}" style="padding:5px 13px;border-radius:20px;font-size:.73rem;font-weight:700;border:1.5px solid ${t.border};background:transparent;color:${t.muted};cursor:pointer">${tech}</button>`).join('')}
      </div>
      <div class="pf-project-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(clamp(230px,30vw,295px),1fr));gap:17px" id="pf-proj-grid">
        ${(d.items || []).map(p => {
        const liveHref = normalizeUrl(p.link || p.demo || p.live);
        const codeHref = normalizeUrl(p.github || p.code || p.repo);
        return `
        <div class="pf-card-hover" style="${cardStyle()};position:relative" data-tech="${(p.tech || []).join(',')}"
          onmouseover="this.style.borderColor='${t.accent}';this.style.transform='translateY(-4px)'"
          onmouseout="this.style.borderColor='${t.border}';this.style.transform='none'">
                ${p.featured ? `<span style="position:absolute;top:13px;right:13px;background:${G};color:#000;font-size:.6rem;font-weight:800;padding:2px 8px;border-radius:20px;text-transform:uppercase">Featured</span>` : ''}
                <span style="font-size:.75rem;letter-spacing:.6px;font-weight:800;color:${t.accent};margin-bottom:11px;display:block">Project</span>
          <h3 style="font-family:${t.font};font-size:clamp(.88rem,1.5vw,1.05rem);margin-bottom:7px">${p.title}</h3>
          <p style="color:${t.muted};font-size:.82rem;line-height:1.62;margin-bottom:13px">${p.desc}</p>
          <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:13px">
            ${(p.tech || []).map(tg => `<span style="background:${t.accent}14;color:${t.accent};border:1px solid ${t.accent}35;padding:2px 9px;border-radius:20px;font-size:.67rem;font-weight:700">${tg}</span>`).join('')}
          </div>
          <div style="display:flex;gap:7px;flex-wrap:wrap">
                  ${liveHref ? `<a href="${liveHref}" target="_blank" rel="noopener noreferrer" style="background:${G};color:#000;border:none;padding:7px 13px;border-radius:7px;font-size:.73rem;font-weight:800;cursor:pointer;text-decoration:none">Live Demo</a>` : ''}
                  ${codeHref ? `<a href="${codeHref}" target="_blank" rel="noopener noreferrer" style="background:transparent;color:${t.accent};border:1.5px solid ${t.accent};padding:7px 13px;border-radius:7px;font-size:.73rem;font-weight:600;cursor:pointer;text-decoration:none">Source Code</a>` : ''}
            ${!liveHref && !codeHref ? `<span style="font-size:.7rem;color:${t.muted}">No links added</span>` : ''}
          </div>
        </div>`;
        }).join('')}
      </div>`);
  }

  function renderExperience(d) {
    d = d || { items: [] };
    return sectionWrap('experience', `
      ${sectionTitle('Experience')}
      <div style="display:flex;flex-direction:column;gap:15px">
        ${(d.items || []).map(e => `
        <div class="pf-card-hover" style="${cardStyle()}"
          onmouseover="this.style.borderColor='${t.border2}';this.style.transform='translateY(-2px)'"
          onmouseout="this.style.borderColor='${t.border}';this.style.transform='none'">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:9px;margin-bottom:5px">
            <div>
              <div style="font-family:${t.font};font-size:clamp(.88rem,1.6vw,1.08rem);font-weight:800">${e.role}</div>
              <div style="color:${t.accent};font-weight:700;font-size:.84rem;margin-top:2px">Company: ${e.company}</div>
            </div>
            <span style="background:${t.surface};border:1px solid ${t.border};border-radius:20px;padding:3px 10px;font-size:.7rem;color:${t.muted};white-space:nowrap;flex-shrink:0">Period: ${e.period}</span>
          </div>
          <p style="color:${t.muted};font-size:.83rem;line-height:1.7;margin-bottom:10px">${e.desc}</p>
          <div style="display:flex;gap:5px;flex-wrap:wrap">
            ${(e.tech || []).map(tg => `<span style="background:${t.accent}14;color:${t.accent};border:1px solid ${t.accent}35;padding:2px 9px;border-radius:20px;font-size:.67rem;font-weight:700">${tg}</span>`).join('')}
          </div>
        </div>`).join('')}
      </div>`, true);
  }

  function renderEducation(d) {
    d = d || { items: [] };
    return sectionWrap('education', `
      ${sectionTitle('Education')}
      ${(d.items || []).map(e => `
      <div class="pf-card-hover" style="${cardStyle()}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:11px;margin-bottom:13px">
          <div>
            <h3 style="font-family:${t.font};font-size:clamp(.95rem,2vw,1.2rem);margin-bottom:4px">${e.degree}</h3>
            <div style="color:${t.accent};font-weight:700">Institution: ${e.school}</div>
          </div>
          <div style="text-align:right;flex-shrink:0">
            <span style="background:${t.surface};border:1px solid ${t.border};border-radius:20px;padding:3px 10px;font-size:.7rem;color:${t.muted};display:block;margin-bottom:4px">${e.period}</span>
            <span style="color:${t.accent2};font-weight:700;font-size:.83rem">GPA: ${e.gpa}</span>
          </div>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          ${(e.highlights || []).map(h => `<span style="background:${t.accent}14;color:${t.accent};border:1px solid ${t.accent}35;padding:2px 9px;border-radius:20px;font-size:.67rem;font-weight:700">${h}</span>`).join('')}
        </div>
      </div>`).join('')}`);
  }

  function renderStats(d) {
    d = d || { items: [] };
    return sectionWrap('stats', `
      ${sectionTitle('Numbers That Matter')}
      <div class="pf-stats-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(clamp(130px,20vw,155px),1fr));gap:15px">
        ${(d.items || []).map(s => `
        <div class="pf-stat-box pf-card-hover" data-target="${s.value}" data-suffix="${s.suffix || '+'}"
          style="text-align:center;padding:clamp(18px,3vw,26px) 15px;${cardStyle()}"
          onmouseover="this.style.borderColor='${t.accent}';this.style.transform='translateY(-3px)'"
          onmouseout="this.style.borderColor='${t.border}';this.style.transform='none'">
          <div class="pf-stat-num" style="font-family:${t.font};font-size:clamp(1.7rem,3.5vw,2.5rem);font-weight:900;${GT};display:block;line-height:1.1">0${s.suffix || '+'}</div>
          <div style="font-size:.67rem;color:${t.muted};text-transform:uppercase;letter-spacing:1px;margin-top:7px;font-weight:700">${s.label}</div>
        </div>`).join('')}
      </div>`, true);
  }

  function renderTimeline(d) {
    d = d || { items: [] };
    return sectionWrap('timeline', `
      ${sectionTitle('My Journey')}
      <div style="position:relative;padding-left:34px">
        <div style="position:absolute;left:9px;top:0;bottom:0;width:2px;background:${G}"></div>
        ${(d.items || []).map(item => `
        <div style="position:relative;margin-bottom:32px">
          <div style="position:absolute;left:-29px;top:4px;width:11px;height:11px;border-radius:50%;background:${t.accent};border:2px solid ${t.bg};box-shadow:0 0 10px ${t.accent}"></div>
          <div style="font-family:${t.font};color:${t.accent};font-size:.73rem;font-weight:700;margin-bottom:3px">${item.year}</div>
          <div style="font-weight:700;font-size:clamp(.88rem,1.5vw,.98rem);margin-bottom:5px">${item.title}</div>
          <div style="color:${t.muted};font-size:.83rem;line-height:1.65">${item.desc}</div>
        </div>`).join('')}
      </div>`);
  }

  function renderTestimonials(d) {
    d = d || { items: [] };
    return sectionWrap('testimonials', `
      ${sectionTitle('Testimonials')}
      <div class="pf-testimonial-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(clamp(230px,30vw,270px),1fr));gap:16px">
        ${(d.items || []).map(ti => `
        <div class="pf-card-hover" style="${cardStyle()}"
          onmouseover="this.style.transform='translateY(-4px)';this.style.borderColor='${t.accent}'"
          onmouseout="this.style.transform='none';this.style.borderColor='${t.border}'">
          <div style="color:#f59e0b;font-size:.76rem;margin-bottom:9px">Rated 5/5</div>
          <p style="color:${t.text};opacity:.85;line-height:1.72;font-style:italic;margin-bottom:17px;font-size:.84rem">"${ti.text}"</p>
          <div style="display:flex;align-items:center;gap:9px">
            <img src="${ti.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + ti.name}" style="width:38px;height:38px;border-radius:50%;border:2px solid ${t.accent};background:${t.border}">
            <div>
              <div style="font-weight:700;font-size:.82rem">${ti.name}</div>
              <div style="color:${t.muted};font-size:.72rem">${ti.role}</div>
            </div>
          </div>
        </div>`).join('')}
      </div>`, true);
  }

  function renderContact(d) {
    d = d || {};
    return sectionWrap('contact', `
      ${sectionTitle("Let's Connect")}
      <p style="color:${t.muted};margin-bottom:26px;font-size:.92rem">${d.message || "Got a project in mind? Let's build something amazing together!"}</p>
      <div class="pf-contact-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:30px">
        <div>
          ${[['📧', 'Email', d.email || ''], ['📞', 'Phone', d.phone || ''], ['🌐', 'Portfolio', window.location.href], ['🟢', 'Status', 'Open to work']].map(([ic, lbl, val]) => `
          <div style="display:flex;align-items:center;gap:11px;padding:12px;background:${t.card};border:1px solid ${t.border};border-radius:9px;margin-bottom:9px;transition:.2s"
            onmouseover="this.style.borderColor='${t.border2}'"
            onmouseout="this.style.borderColor='${t.border}'">
            <div style="width:34px;height:34px;border-radius:7px;background:${t.accent}12;display:flex;align-items:center;justify-content:center;font-size:.95rem;flex-shrink:0">${ic}</div>
            <div>
              <div style="font-weight:700;font-size:.8rem">${lbl}</div>
              <div style="color:${t.muted};font-size:.76rem;word-break:break-all">${val}</div>
            </div>
          </div>`).join('')}
        </div>
        <div>
          <div class="pf-contact-dual" style="display:grid;grid-template-columns:1fr 1fr;gap:11px;margin-bottom:13px">
            <div>
              <label style="display:block;font-size:.68rem;font-weight:700;color:${t.muted};text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px">Name *</label>
              <input id="pf-ct-name" style="width:100%;background:${t.surface};border:1.5px solid ${t.border};border-radius:7px;padding:9px 12px;color:${t.text};font-size:.83rem;outline:none;transition:.2s;font-family:inherit" placeholder="Your name"
                onfocus="this.style.borderColor='${t.accent}'" onblur="this.style.borderColor='${t.border}'">
            </div>
            <div>
              <label style="display:block;font-size:.68rem;font-weight:700;color:${t.muted};text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px">Email *</label>
              <input id="pf-ct-email" style="width:100%;background:${t.surface};border:1.5px solid ${t.border};border-radius:7px;padding:9px 12px;color:${t.text};font-size:.83rem;outline:none;transition:.2s;font-family:inherit" placeholder="your@email.com"
                onfocus="this.style.borderColor='${t.accent}'" onblur="this.style.borderColor='${t.border}'">
            </div>
          </div>
          <label style="display:block;font-size:.68rem;font-weight:700;color:${t.muted};text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px">Subject</label>
          <input id="pf-ct-subject" style="width:100%;background:${t.surface};border:1.5px solid ${t.border};border-radius:7px;padding:9px 12px;color:${t.text};font-size:.83rem;outline:none;transition:.2s;margin-bottom:12px;font-family:inherit" placeholder="Project inquiry..."
            onfocus="this.style.borderColor='${t.accent}'" onblur="this.style.borderColor='${t.border}'">
          <label style="display:block;font-size:.68rem;font-weight:700;color:${t.muted};text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px">Message *</label>
          <textarea id="pf-ct-msg" rows="4" style="width:100%;background:${t.surface};border:1.5px solid ${t.border};border-radius:7px;padding:9px 12px;color:${t.text};font-size:.83rem;outline:none;resize:vertical;transition:.2s;margin-bottom:12px;font-family:inherit" placeholder="Tell me about your project..."
            onfocus="this.style.borderColor='${t.accent}'" onblur="this.style.borderColor='${t.border}'"></textarea>
          <div id="pf-ct-status"></div>
          <button onclick="pfSubmitContact()" style="width:100%;background:${G};color:#000;border:none;padding:12px;border-radius:7px;font-weight:800;font-size:.88rem;cursor:pointer;transition:.2s;font-family:inherit"
            onmouseover="this.style.transform='translateY(-1px)'" onmouseout="this.style.transform='none'">Send Message</button>
        </div>
      </div>`);
  }

  /* ─────────────────────────────────────────
     SECTION MAP
  ───────────────────────────────────────── */
  const RENDERERS = {
    hero:         renderHero,
    about:        renderAbout,
    skills:       renderSkills,
    projects:     renderProjects,
    experience:   renderExperience,
    education:    renderEducation,
    stats:        renderStats,
    timeline:     renderTimeline,
    testimonials: renderTestimonials,
    contact:      renderContact,
  };

  /* ─────────────────────────────────────────
     BUILD PAGE
  ───────────────────────────────────────── */
  function buildNav() {
    const recruiterLabel = recruiterMode ? 'Recruiter Mode: ON' : 'Recruiter Mode: OFF';
    return `<nav class="pf-top-nav" style="position:sticky;top:0;z-index:100;background:${t.bg}ee;backdrop-filter:blur(18px);border-bottom:1px solid ${t.border};height:54px;display:flex;align-items:center;justify-content:space-between;padding:0 clamp(14px,4vw,30px)">
      <div style="font-family:${t.font};font-size:clamp(.8rem,1.8vw,1.05rem);font-weight:700;${GT}">&lt;${firstName}/&gt;</div>
      <div class="pf-top-links" style="display:flex;gap:clamp(8px,2vw,16px)">
        ${sections.filter(s => s.is_visible).map(s =>
          `<button onclick="document.getElementById('pf-${s.section_type}')?.scrollIntoView({behavior:'smooth'})"
            style="background:none;border:none;font-size:clamp(.55rem,.7vw+.4rem,.76rem);font-weight:700;color:${t.muted};cursor:pointer;text-transform:uppercase;letter-spacing:.4px;padding:4px 0;transition:.2s"
            onmouseover="this.style.color='${t.accent}'" onmouseout="this.style.color='${t.muted}'">
            ${{ hero: 'Home', about: 'About', skills: 'Skills', projects: 'Projects', experience: 'Experience', education: 'Education', stats: 'Stats', timeline: 'Journey', testimonials: 'Reviews', contact: 'Contact' }[s.section_type] || s.section_type}
          </button>`
        ).join('')}
      </div>
      <button id="pf-recruiter-toggle" onclick="pfToggleRecruiterMode()" style="border:1px solid ${t.border2};background:${recruiterMode ? t.accent + '18' : 'transparent'};color:${recruiterMode ? t.accent : t.muted};padding:5px 10px;border-radius:999px;font-size:.68rem;font-weight:700;letter-spacing:.4px;white-space:nowrap">${recruiterLabel}</button>
    </nav>`;
  }

  function buildFooter() {
    return `<footer style="background:${t.surface};border-top:1px solid ${t.border};padding:clamp(24px,5vw,44px);text-align:center">
      <div style="font-family:${t.font};font-size:clamp(1rem,2.5vw,1.5rem);font-weight:900;${GT};margin-bottom:5px">&lt;${firstName}/&gt;</div>
      <p style="color:${t.muted};font-size:.82rem;margin-bottom:12px">Built with QuickFolio — <a href="/" style="color:${t.accent}">quickfolio.app</a></p>
      <div style="display:flex;justify-content:center;gap:clamp(10px,3vw,18px);flex-wrap:wrap;margin-bottom:12px">
        ${sections.filter(s => s.is_visible).map(s =>
          `<button onclick="document.getElementById('pf-${s.section_type}')?.scrollIntoView({behavior:'smooth'})" style="color:${t.muted};font-size:.76rem;background:none;border:none;cursor:pointer;transition:.2s" onmouseover="this.style.color='${t.accent}'" onmouseout="this.style.color='${t.muted}'">${s.section_type}</button>`
        ).join('')}
      </div>
      <div style="color:${t.muted};font-size:.72rem">© ${new Date().getFullYear()} ${firstName}. All rights reserved.</div>
    </footer>`;
  }

  /* ── Assemble ── */
  const sectionsHTML = sections
    .filter(s => s.is_visible)
    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
    .map(s => {
      const renderer = RENDERERS[s.section_type];
      return renderer ? renderer(s.content) : '';
    }).join('\n');

  root.innerHTML = buildNav() + buildShareDock() + sectionsHTML + buildFooter();

  function applyRecruiterModeState(enabled) {
    recruiterMode = Boolean(enabled);
    root.classList.toggle('pf-recruiter-mode', recruiterMode);
    const toggleBtn = document.getElementById('pf-recruiter-toggle');
    if (!toggleBtn) return;
    toggleBtn.textContent = recruiterMode ? 'Recruiter Mode: ON' : 'Recruiter Mode: OFF';
    toggleBtn.style.background = recruiterMode ? `${t.accent}18` : 'transparent';
    toggleBtn.style.color = recruiterMode ? t.accent : t.muted;
  }

  window.pfToggleRecruiterMode = function () {
    const next = !recruiterMode;
    writeRecruiterModePreference(next);
    applyRecruiterModeState(next);
  };

  applyRecruiterModeState(recruiterMode);

  /* ── Chatbot ── */
  const cbContainer = document.createElement('div');
  cbContainer.id = 'pf-cb-container';
  root.appendChild(cbContainer);
  runWhenIdle(() => {
    initPortfolioChatbotWhenReady('pf-cb-container', { ...t, ownerName: firstName });
  }, 1300);

  /* ── Scroll-to-top ── */
  const stb = document.createElement('button');
  stb.className = 'scroll-top-pf';
  stb.style.cssText = `position:fixed;bottom:24px;left:24px;width:38px;height:38px;border-radius:50%;background:${t.card};border:1.5px solid ${t.border};color:${t.accent};font-size:.88rem;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:.22s;z-index:800`;
  stb.textContent = '↑';
  stb.addEventListener('mouseover', () => { stb.style.background = t.accent; stb.style.color = '#000'; });
  stb.addEventListener('mouseout',  () => { stb.style.background = t.card;   stb.style.color = t.accent; });
  stb.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  document.body.appendChild(stb);

  /* ─────────────────────────────────────────
     INTERACTIVE FUNCTIONS (global scope)
  ───────────────────────────────────────── */

  /* Project filter */
  window.pfFilter = function (filter, btn) {
    document.querySelectorAll('#pf-proj-filters button').forEach(b => {
      const isActive = b.dataset.f === filter;
      b.style.borderColor = isActive ? t.accent : t.border;
      b.style.background  = isActive ? t.accent + '14' : 'transparent';
      b.style.color       = isActive ? t.accent : t.muted;
    });
    document.querySelectorAll('#pf-proj-grid > div').forEach(card => {
      if (filter === 'all') { card.style.display = ''; return; }
      const techs = (card.dataset.tech || '').split(',');
      card.style.display = techs.includes(filter) ? '' : 'none';
    });
  };

  window.pfToggleShareDock = function () {
    const panel = document.getElementById('pf-share-panel');
    if (!panel) return;
    panel.classList.toggle('open');
  };

  window.pfCopyTrackedLink = async function (source) {
    const src = sanitizeTrackingToken(source, 'direct');
    const link = buildTrackedPortfolioUrl(src, 'portfolio_share');
    const ok = await copyTextWithFallback(link);
    showShareFeedback(ok ? 'Tracked link copied. Paste it in your post.' : 'Could not copy link automatically.', !ok);
  };

  window.pfShareNative = async function () {
    const copy = buildSocialCopyBundle('native');
    if (navigator.share) {
      try {
        await navigator.share({
          title: portfolio.title || `${firstName} Portfolio`,
          text: copy.shortHook,
          url: copy.trackedLink,
        });
        showShareFeedback('Shared successfully with tracking tags.', false);
        return;
      } catch (_) {
        // Fallback to copy.
      }
    }
    const ok = await copyTextWithFallback(copy.trackedLink);
    showShareFeedback(ok ? 'Native share unavailable. Link copied instead.' : 'Unable to share right now.', !ok);
  };

  window.pfShareNetwork = function (network) {
    const key = sanitizeTrackingToken(network, 'social');
    const copy = buildSocialCopyBundle(key);
    const url = encodeURIComponent(copy.trackedLink);
    const text = encodeURIComponent(copy.shortHook);
    const title = encodeURIComponent(portfolio.title || `${firstName} Portfolio`);

    const shareTargets = {
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      x: `https://x.com/intent/tweet?url=${url}&text=${text}`,
      whatsapp: `https://api.whatsapp.com/send?text=${text}%20${url}`,
      reddit: `https://www.reddit.com/submit?url=${url}&title=${title}`,
    };

    if (!shareTargets[key]) {
      showShareFeedback('Unsupported network.', true);
      return;
    }

    openShareWindow(shareTargets[key]);
    showShareFeedback(`Opened ${key} share with tracking tag: utm_source=${key}.`, false);
  };

  window.pfCopyLinkedInPost = async function () {
    const copy = buildSocialCopyBundle('linkedin');
    const ok = await copyTextWithFallback(copy.linkedInPost);
    showShareFeedback(ok ? 'LinkedIn-ready post copied.' : 'Could not copy LinkedIn post.', !ok);
  };

  window.pfCopyShortHook = async function () {
    const copy = buildSocialCopyBundle('reel');
    const ok = await copyTextWithFallback(copy.shortHook);
    showShareFeedback(ok ? 'Short hook copied.' : 'Could not copy hook.', !ok);
  };

  document.addEventListener('click', (event) => {
    const dock = document.getElementById('pf-share-dock');
    const panel = document.getElementById('pf-share-panel');
    if (!dock || !panel || !panel.classList.contains('open')) return;
    if (!dock.contains(event.target)) panel.classList.remove('open');
  });

  /* Contact form */
  window.pfSubmitContact = async function () {
    const name    = document.getElementById('pf-ct-name')?.value.trim() || '';
    const email   = document.getElementById('pf-ct-email')?.value.trim() || '';
    const subject = document.getElementById('pf-ct-subject')?.value.trim() || '';
    const message = document.getElementById('pf-ct-msg')?.value.trim() || '';
    const statusEl = document.getElementById('pf-ct-status');

    if (!name || !email || !message) {
      if (statusEl) statusEl.innerHTML = `<div class="pf-ct-error">Please fill in Name, Email and Message.</div>`;
      return;
    }
    if (statusEl) statusEl.innerHTML = `<div class="pf-ct-loading">Sending your message...</div>`;

    try {
      const res = await fetch(`/api/contact/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message })
      });
      const data = await res.json();
      if (res.ok) {
        if (statusEl) statusEl.innerHTML = `<div class="pf-ct-success">Message sent. Auto-reply sent to ${email}. Expect a response within 24-48 hours.</div>`;
        ['pf-ct-name', 'pf-ct-email', 'pf-ct-subject', 'pf-ct-msg'].forEach(id => {
          const el = document.getElementById(id); if (el) el.value = '';
        });
      } else {
        if (statusEl) statusEl.innerHTML = `<div class="pf-ct-error">${data.error || 'Something went wrong. Please try again.'}</div>`;
      }
    } catch (_) {
      if (statusEl) statusEl.innerHTML = `<div class="pf-ct-success">Message received. Will get back to you soon.</div>`;
    }
  };

  const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const disposePortfolioRouteTransitions = initPortfolioRouteTransitions(prefersReducedMotion);
  const revealSections = Array.from(document.querySelectorAll('section.pf-reveal'));
  revealSections.forEach((sec, idx) => {
    sec.style.setProperty('--pf-delay', (Math.min(idx * 70, 420)) + 'ms');
  });
  if (revealSections[0]) revealSections[0].classList.add('is-visible');

  if (prefersReducedMotion) {
    revealSections.forEach((sec) => sec.classList.add('is-visible'));
  } else {
    const revealIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealIO.unobserve(entry.target);
      });
    }, { threshold: 0.18 });

    revealSections.slice(1).forEach((sec) => revealIO.observe(sec));
  }

  /* ── Animate skill bars on scroll ── */
  const revealSkills = (section) => {
    section.querySelectorAll('.skill-anim').forEach((bar) => {
      if (bar.dataset.animated === '1') return;
      bar.dataset.animated = '1';
      bar.style.width = (bar.dataset.val || 0) + '%';
    });
  };

  if (prefersReducedMotion) {
    document.querySelectorAll('section').forEach((sec) => {
      if (sec.querySelector('.skill-anim')) revealSkills(sec);
    });
  } else {
    const skillIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        revealSkills(entry.target);
        skillIO.unobserve(entry.target);
      });
    }, { threshold: 0.2 });

    document.querySelectorAll('section').forEach((sec) => {
      if (sec.querySelector('.skill-anim')) skillIO.observe(sec);
    });
  }

  /* ── Animate stats counter on scroll ── */
  const animateStatsInSection = (section) => {
    section.querySelectorAll('.pf-stat-box').forEach((box) => {
      if (box.dataset.animated === '1') return;
      box.dataset.animated = '1';

      const numEl = box.querySelector('.pf-stat-num');
      const target = parseInt(box.dataset.target, 10) || 0;
      const suffix = box.dataset.suffix || '+';
      if (!numEl) return;

      if (target <= 0 || prefersReducedMotion) {
        numEl.textContent = `${target.toLocaleString()}${suffix}`;
        return;
      }

      const duration = 1500;
      const start = performance.now();
      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        numEl.textContent = `${Math.floor(target * eased).toLocaleString()}${suffix}`;
        if (progress < 1) requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
    });
  };

  if (prefersReducedMotion) {
    document.querySelectorAll('section').forEach((sec) => {
      if (sec.querySelector('.pf-stat-box')) animateStatsInSection(sec);
    });
  } else {
    const statsIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateStatsInSection(entry.target);
        statsIO.unobserve(entry.target);
      });
    }, { threshold: 0.2 });

    document.querySelectorAll('section').forEach((sec) => {
      if (sec.querySelector('.pf-stat-box')) statsIO.observe(sec);
    });
  }

  const initPortfolioCinematicExperience = () => {
    if (prefersReducedMotion) return () => {};

    const densityMultiplier = cinematicProfile.density;
    const speedMultiplier = cinematicProfile.speed;
    const glowMultiplier = cinematicProfile.glow;
    const ambientMultiplier = cinematicProfile.ambient;

    document.body.classList.add('pf-cinematic-active');

    const cleanups = [];

    const existingRoot = document.getElementById('pf-cinematic-root');
    if (existingRoot) existingRoot.remove();

    const cineRoot = document.createElement('div');
    cineRoot.id = 'pf-cinematic-root';
    cineRoot.innerHTML = `
      <canvas id="pf-cinematic-canvas"></canvas>
      <div class="pf-cine-glow" aria-hidden="true"></div>
      <div class="pf-cine-noise" aria-hidden="true"></div>
    `;
    document.body.appendChild(cineRoot);

    const canvas = cineRoot.querySelector('#pf-cinematic-canvas');
    const ctx = canvas && typeof canvas.getContext === 'function'
      ? canvas.getContext('2d', { alpha: true })
      : null;

    if (ctx) {
      let width = 0;
      let height = 0;
      let dpr = 1;
      let rafId = 0;
      let running = true;
      let last = 0;
      let dots = [];

      const makeDot = () => {
        const angle = Math.random() * Math.PI * 2;
        const speed = (0.03 + Math.random() * 0.12) * speedMultiplier;
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          r: (0.6 + Math.random() * 1.8) * (0.88 + (densityMultiplier * 0.12)),
          a: Math.min(0.84, (0.12 + Math.random() * 0.34) * (0.78 + (glowMultiplier * 0.24))),
          c: Math.random() > 0.5 ? 'cyan' : 'violet',
        };
      };

      const resize = () => {
        width = Math.max(window.innerWidth || 0, 320);
        height = Math.max(window.innerHeight || 0, 320);
        dpr = Math.min(window.devicePixelRatio || 1, 1.8);

        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const count = Math.max(16, Math.min(110, Math.round(((width * height) / 36000) * densityMultiplier)));
        dots = Array.from({ length: count }, makeDot);
      };

      const wrap = (dot) => {
        if (dot.x < -18) dot.x = width + 18;
        if (dot.x > width + 18) dot.x = -18;
        if (dot.y < -18) dot.y = height + 18;
        if (dot.y > height + 18) dot.y = -18;
      };

      const draw = (now) => {
        if (!running) return;

        const dt = Math.min(1.8, last ? (now - last) / 16.67 : 1);
        last = now;

        ctx.clearRect(0, 0, width, height);

        const sweepY = ((now * 0.05) % (height + 280)) - 140;
        const sweep = ctx.createLinearGradient(0, sweepY - 120, width, sweepY + 120);
        sweep.addColorStop(0, 'rgba(0,0,0,0)');
        sweep.addColorStop(0.5, `rgba(0,229,255,${(0.045 * glowMultiplier).toFixed(4)})`);
        sweep.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = sweep;
        ctx.fillRect(0, sweepY - 120, width, 240);

        const limit = Math.max(96, Math.round(130 * (0.84 + (densityMultiplier * 0.2))));
        const limitSq = limit * limit;

        for (let i = 0; i < dots.length; i += 1) {
          const dot = dots[i];
          dot.x += dot.vx * dt;
          dot.y += dot.vy * dt;
          dot.x += Math.sin((now * 0.00023) + i) * 0.05;
          dot.y += Math.cos((now * 0.00021) + i) * 0.05;
          wrap(dot);

          ctx.beginPath();
          ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
          ctx.fillStyle = dot.c === 'cyan'
            ? `rgba(0,229,255,${dot.a.toFixed(4)})`
            : `rgba(180,79,255,${dot.a.toFixed(4)})`;
          ctx.fill();
        }

        ctx.lineWidth = 0.5;
        for (let i = 0; i < dots.length; i += 1) {
          const a = dots[i];
          for (let j = i + 1; j < dots.length; j += 1) {
            const b = dots[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const d2 = (dx * dx) + (dy * dy);
            if (d2 > limitSq) continue;

            const d = Math.sqrt(d2);
            const alpha = Math.pow(1 - (d / limit), 1.7) * 0.12 * glowMultiplier;
            ctx.strokeStyle = `rgba(124,177,255,${alpha.toFixed(4)})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }

        rafId = requestAnimationFrame(draw);
      };

      const onVisibility = () => {
        running = !document.hidden;
        if (!running && rafId) {
          cancelAnimationFrame(rafId);
          rafId = 0;
        } else if (running && !rafId) {
          rafId = requestAnimationFrame(draw);
        }
      };

      resize();
      rafId = requestAnimationFrame(draw);

      window.addEventListener('resize', resize, { passive: true });
      document.addEventListener('visibilitychange', onVisibility);

      cleanups.push(() => {
        if (rafId) cancelAnimationFrame(rafId);
        window.removeEventListener('resize', resize);
        document.removeEventListener('visibilitychange', onVisibility);
      });
    }

    let targetX = 50;
    let targetY = 40;
    let currentX = 50;
    let currentY = 40;
    let targetScroll = 0;
    let currentScroll = 0;
    let ambientRaf = 0;

    const onPointerMove = (event) => {
      const vw = Math.max(window.innerWidth || 1, 1);
      const vh = Math.max(window.innerHeight || 1, 1);
      const nextX = 50 + ((((event.clientX / vw) * 100) - 50) * ambientMultiplier);
      const nextY = 50 + ((((event.clientY / vh) * 100) - 50) * ambientMultiplier);
      targetX = Math.min(96, Math.max(4, nextX));
      targetY = Math.min(96, Math.max(4, nextY));
    };

    const onScroll = () => {
      const doc = document.documentElement;
      const max = Math.max(doc.scrollHeight - doc.clientHeight, 1);
      targetScroll = Math.min(1, Math.max(0, window.scrollY / max));
    };

    const animateAmbient = () => {
      const followStrength = Math.min(0.18, 0.045 + (speedMultiplier * 0.015));
      currentX += (targetX - currentX) * followStrength;
      currentY += (targetY - currentY) * followStrength;
      currentScroll += (targetScroll - currentScroll) * Math.min(0.16, followStrength * 1.3);

      document.body.style.setProperty('--pf-pointer-x', `${currentX.toFixed(3)}%`);
      document.body.style.setProperty('--pf-pointer-y', `${currentY.toFixed(3)}%`);
      document.body.style.setProperty('--pf-scroll-progress', currentScroll.toFixed(5));

      ambientRaf = requestAnimationFrame(animateAmbient);
    };

    onScroll();
    animateAmbient();

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    cleanups.push(() => {
      if (ambientRaf) cancelAnimationFrame(ambientRaf);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      document.body.style.removeProperty('--pf-pointer-x');
      document.body.style.removeProperty('--pf-pointer-y');
      document.body.style.removeProperty('--pf-scroll-progress');
    });

    if (!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches)) {
      const spotlightNodes = [
        ...document.querySelectorAll('.pf-card-hover, .pf-share-main, .pf-share-btn, #pf-recruiter-toggle'),
      ];

      spotlightNodes.forEach((node) => {
        node.classList.add('pf-cine-card');
        node.style.setProperty('--pf-spot-strength', (0.72 + (glowMultiplier * 0.24)).toFixed(3));

        const onMove = (event) => {
          const rect = node.getBoundingClientRect();
          const x = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 100;
          const y = ((event.clientY - rect.top) / Math.max(rect.height, 1)) * 100;
          node.style.setProperty('--pf-spot-x', `${x.toFixed(2)}%`);
          node.style.setProperty('--pf-spot-y', `${y.toFixed(2)}%`);
          node.style.setProperty('--pf-spot-o', '1');
        };

        const onLeave = () => {
          node.style.setProperty('--pf-spot-o', '0');
        };

        node.addEventListener('pointermove', onMove, { passive: true });
        node.addEventListener('pointerenter', onMove, { passive: true });
        node.addEventListener('pointerleave', onLeave);

        cleanups.push(() => {
          node.removeEventListener('pointermove', onMove);
          node.removeEventListener('pointerenter', onMove);
          node.removeEventListener('pointerleave', onLeave);
          node.classList.remove('pf-cine-card');
          node.style.removeProperty('--pf-spot-x');
          node.style.removeProperty('--pf-spot-y');
          node.style.removeProperty('--pf-spot-o');
          node.style.removeProperty('--pf-spot-strength');
        });
      });
    }

    document.querySelectorAll('#portfolio-root h1, #portfolio-root h2').forEach((heading) => {
      heading.classList.add('pf-cine-heading');
      heading.style.setProperty('--pf-cine-heading-duration', `${(7 / Math.max(speedMultiplier, 0.55)).toFixed(2)}s`);
      cleanups.push(() => {
        heading.classList.remove('pf-cine-heading');
        heading.style.removeProperty('--pf-cine-heading-duration');
      });
    });

    return () => {
      cleanups.forEach((cleanup) => {
        try {
          cleanup();
        } catch (_) {
          // Ignore cleanup failures.
        }
      });
      cineRoot.remove();
      document.body.classList.remove('pf-cinematic-active');
    };
  };

  const optimizePortfolioMedia = () => {
    const images = [...document.querySelectorAll('img')];
    images.forEach((img, idx) => {
      if (img.dataset.perfOptimized === '1') return;
      img.dataset.perfOptimized = '1';

      const nearViewport = img.getBoundingClientRect().top < (window.innerHeight * 1.1);
      const shouldEager = idx < 1 && nearViewport;
      img.decoding = 'async';
      img.loading = shouldEager ? 'eager' : 'lazy';
      img.fetchPriority = shouldEager ? 'high' : 'low';
    });
  };

  optimizePortfolioMedia();

  const disposePortfolioCinematic = initPortfolioCinematicExperience();
  if (typeof disposePortfolioCinematic === 'function') {
    window.addEventListener('beforeunload', disposePortfolioCinematic, { once: true });
  }
  if (typeof disposePortfolioRouteTransitions === 'function') {
    window.addEventListener('beforeunload', disposePortfolioRouteTransitions, { once: true });
  }

  if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    setTimeout(() => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Ignore registration failures.
      });
    }, 1200);
  }

})(); // IIFE end
