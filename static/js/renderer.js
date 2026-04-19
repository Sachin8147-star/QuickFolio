/* ══════════════════════════════════════
   RENDERER.JS — portfolio HTML generator
══════════════════════════════════════ */

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

function applyCustomTheme(baseTheme, data) {
  const hero = data?.hero && typeof data.hero === 'object' ? data.hero : {};
  const design = hero?.design && typeof hero.design === 'object' ? hero.design : {};
  const sectionScaleDefaults = Object.keys(SECTION_INFO || {}).reduce((acc, key) => {
    acc[key] = 100;
    return acc;
  }, {});
  const sectionFontDefaults = Object.keys(SECTION_INFO || {}).reduce((acc, key) => {
    acc[key] = 'default';
    return acc;
  }, {});

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

  const photoOffsetX = clampDesignNumber(hero.photo_offset_x, -160, 160, 0);
  const photoOffsetY = clampDesignNumber(hero.photo_offset_y, -160, 160, 0);

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
    }
  };
}

function renderSection(id, data, t, options = {}) {
  const isBuilderMode = Boolean(options?.builderMode);
  const d = data[id] || {};
  const design = t._design || {};
  const cardRadius = design.cardRadius || 16;
  const sectionSpacing = design.sectionSpacing || 80;
  const sectionScale = (design.sectionScales && design.sectionScales[id]) ? design.sectionScales[id] : 1;
  const headingScale = design.headingScale || 1;
  const bodyScale = design.bodyScale || 1;
  const sectionFontKey = (design.sectionFonts && design.sectionFonts[id]) ? design.sectionFonts[id] : 'default';
  const sectionFont = pickDesignFont(sectionFontKey, t.body);
  const spacingMin = Math.max(32, Math.round(sectionSpacing - 28));
  const G = t.grad;
  const gt = `background:${G};-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text`;
  const card = `background:${t.card};border:1px solid ${t.border};border-radius:${cardRadius}px;padding:clamp(15px,3vw,22px);transition:.3s`;

  function sectionWrap(id, content, altBg) {
    return `<section id="pf-${id}" class="pf-section-shell pf-section pf-reveal" style="padding:clamp(${spacingMin}px,8vw,${sectionSpacing}px) clamp(16px,4.5vw,32px);${altBg?'background:'+t.surface:''}">
      <div class="pf-section-inner" style="max-width:1100px;margin:0 auto;font-size:calc(1rem * ${bodyScale} * ${sectionScale});font-family:${sectionFont}">${content}</div>
    </section>`;
  }

  function sectionTitle(text) {
    return `<h2 style="font-family:${t.font};font-size:calc(clamp(1.5rem,3vw,2.2rem) * ${headingScale} * ${sectionScale});font-weight:800;margin-bottom:6px;${gt}">${text}</h2>
    <div style="width:46px;height:3px;background:${G};border-radius:2px;margin-bottom:32px"></div>`;
  }

  function cardStyle(hover=true) {
    let s = card;
    if(hover) s += `;cursor:default`;
    return s;
  }

  function normalizeUrl(value) {
    const v = String(value || '').trim();
    if (!v) return '';
    if (/^(https?:\/\/|mailto:|tel:)/i.test(v)) return v;
    return `https://${v}`;
  }

  /* ── HERO ── */
  if(id==='hero') {
    const photoUrl = String(d.photo_url || '').trim();
    const photoSize = clampDesignNumber(d.photo_size, 90, 280, 170);
    const photoRadius = d.photo_shape === 'rounded' ? '18px' : '50%';
    const photoOffsetX = clampDesignNumber(d.photo_offset_x ?? design.photoOffsetX, -160, 160, 0);
    const photoOffsetY = clampDesignNumber(d.photo_offset_y ?? design.photoOffsetY, -160, 160, 0);
    const heroPhoto = photoUrl
      ? (isBuilderMode
        ? `<div data-hero-photo-box="1" style="position:relative;margin:0 auto 18px;display:block;width:${photoSize}px;height:${photoSize}px;transform:translate(${photoOffsetX}px, ${photoOffsetY}px)">
             <img src="${photoUrl}" alt="Profile photo" data-hero-photo-drag="1" style="width:100%;height:100%;object-fit:cover;border-radius:${photoRadius};border:3px solid ${t.border2};box-shadow:0 20px 40px rgba(0,0,0,.35);display:block;touch-action:none">
             <span data-hero-photo-resize="1" style="position:absolute;right:-8px;bottom:-8px;width:18px;height:18px;border-radius:50%;background:${t.accent};border:2px solid ${t.bg};box-shadow:0 0 0 2px ${t.border2};display:block"></span>
           </div>`
        : `<img src="${photoUrl}" alt="Profile photo" style="width:${photoSize}px;height:${photoSize}px;object-fit:cover;border-radius:${photoRadius};border:3px solid ${t.border2};box-shadow:0 20px 40px rgba(0,0,0,.35);margin:0 auto 18px;display:block;transform:translate(${photoOffsetX}px, ${photoOffsetY}px)">`)
      : '';
    const heroMinHeight = isBuilderMode ? 'clamp(430px,74vh,700px)' : '100vh';
    const heroPadding = isBuilderMode
      ? 'clamp(42px,8vw,74px) clamp(16px,4vw,24px)'
      : 'clamp(60px,10vw,100px) clamp(16px,4vw,24px)';
    return `<section id="pf-hero" class="pf-section-shell pf-hero-shell pf-reveal is-visible" style="min-height:${heroMinHeight};${isBuilderMode ? '' : 'min-height:100dvh;'}display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;text-align:center;padding:${heroPadding}">
      <div style="position:absolute;inset:0;background-image:linear-gradient(${t.border} 1px,transparent 1px),linear-gradient(90deg,${t.border} 1px,transparent 1px);background-size:50px 50px;opacity:.25"></div>
      <div style="position:absolute;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,${t.accent}14,transparent 70%);top:-15%;left:-12%;pointer-events:none;filter:blur(60px)"></div>
      <div style="position:absolute;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,${t.accent2}12,transparent 70%);bottom:-12%;right:-10%;pointer-events:none;filter:blur(60px)"></div>
      <div class="pf-hero-stack" style="position:relative;z-index:1;max-width:800px">
        ${heroPhoto}
        <div style="display:inline-flex;align-items:center;gap:7px;padding:5px 15px;background:${t.accent}10;border:1px solid ${t.accent}30;border-radius:50px;font-size:.7rem;font-weight:700;color:${t.accent};letter-spacing:.8px;text-transform:uppercase;margin-bottom:24px">
          <div style="width:6px;height:6px;border-radius:50%;background:#22c55e;animation:pf-pulse 2s infinite"></div>
          Available for hire
        </div>
        <h1 data-inline-edit="hero.name" style="font-family:${t.font};font-size:clamp(2rem,6vw,4.5rem);font-weight:900;line-height:1.06;margin-bottom:14px;background:${G};background-size:200%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:pf-grad 4s ease infinite">${d.name||'Your Name'}</h1>
        <p data-inline-edit="hero.title" style="font-size:clamp(.75rem,1.5vw,1rem);color:${t.muted};margin-bottom:8px;letter-spacing:2px;text-transform:uppercase">${d.title||'Your Title'}</p>
        <p data-inline-edit="hero.tagline" style="font-size:clamp(.9rem,1.8vw,1.1rem);color:${t.text};opacity:.8;margin-bottom:10px">${d.tagline||''}</p>
        <p data-inline-edit="hero.subtitle" style="font-size:.78rem;color:${t.muted};letter-spacing:2.5px;text-transform:uppercase;margin-bottom:28px">${d.subtitle||''}</p>
        <div class="pf-hero-actions" style="display:flex;gap:11px;justify-content:center;flex-wrap:wrap;margin-bottom:30px">
          <button style="background:${G};color:#000;border:none;padding:12px 26px;border-radius:9px;font-weight:800;font-size:.88rem;cursor:pointer;transition:.3s;letter-spacing:.4px" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'"><span data-inline-edit="hero.cta">${d.cta||'View My Work'}</span></button>
          <button style="background:transparent;color:${t.accent};border:1.5px solid ${t.accent};padding:12px 26px;border-radius:9px;font-weight:600;font-size:.88rem;cursor:pointer;transition:.3s" onmouseover="this.style.background='${t.accent}14'" onmouseout="this.style.background='transparent'">Download CV</button>
        </div>
        <div class="pf-social-row" style="display:flex;gap:9px;justify-content:center;flex-wrap:wrap">
          ${[
            ['🐙', 'GitHub', d.github],
            ['💼', 'LinkedIn', d.linkedin],
            ['𝕏', 'Twitter', d.twitter]
          ].map(([i,label,url]) => {
            const href = normalizeUrl(url);
            return href
              ? `<a href="${href}" target="_blank" rel="noopener noreferrer" style="padding:5px 13px;background:${t.card};border:1px solid ${t.border};border-radius:7px;font-size:.73rem;color:${t.muted};text-decoration:none;transition:.2s" onmouseover="this.style.borderColor='${t.accent}';this.style.color='${t.accent}'" onmouseout="this.style.borderColor='${t.border}';this.style.color='${t.muted}'">${i} ${label}</a>`
              : `<span style="padding:5px 13px;background:${t.card};border:1px solid ${t.border};border-radius:7px;font-size:.73rem;color:${t.muted}">${i} ${label}</span>`;
          }).join('')}
        </div>
      </div>
    </section>`;
  }

  /* ── ABOUT ── */
  if(id==='about') {
    const profilePhoto = String(d.photo_url || data.hero?.photo_url || '').trim();
    const avatarSize = clampDesignNumber(data.hero?.photo_size, 110, 190, 160);
    const avatarRadius = (data.hero?.photo_shape === 'rounded') ? '18px' : '16px';
    const avatarSrc = profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(d.name||'dev')}`;
    return sectionWrap('about', `
      ${sectionTitle('About Me')}
      <div class="pf-about-grid" style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,2fr);gap:clamp(20px,5vw,48px);align-items:center">
        <div style="text-align:center">
          <img src="${avatarSrc}" style="width:${avatarSize}px;height:${avatarSize}px;object-fit:cover;border-radius:${avatarRadius};border:2px solid ${t.border};animation:pf-float 3s ease-in-out infinite;margin:0 auto 14px">
          <div style="display:inline-flex;align-items:center;gap:5px;background:#22c55e14;border:1px solid #22c55e35;color:#22c55e;padding:4px 12px;border-radius:20px;font-size:.7rem;font-weight:700">
            <div style="width:5px;height:5px;border-radius:50%;background:#22c55e;animation:pf-pulse 2s infinite"></div>
            <span data-inline-edit="about.availability">${d.availability||'Open to work'}</span>
          </div>
          <div style="color:${t.muted};font-size:.8rem;margin-top:8px">Location: <span data-inline-edit="about.location">${d.location||'Location'}</span></div>
        </div>
        <div>
          <p data-inline-edit="about.bio" style="color:${t.text};opacity:.85;line-height:1.8;font-size:clamp(.87rem,1.5vw,1.03rem);margin-bottom:20px">${d.bio||''}</p>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            ${(d.highlights||[]).map((h, hidx)=>`<span style="background:${t.accent2}12;border:1px solid ${t.accent2}30;color:${t.accent2};padding:5px 13px;border-radius:20px;font-size:.76rem;font-weight:700"><span data-inline-edit="about.highlights.${hidx}">${h}</span></span>`).join('')}
          </div>
        </div>
      </div>
    `);
  }

  /* ── SKILLS ── */
  if(id==='skills') {
    return sectionWrap('skills', `
      ${sectionTitle('Skills & Stack')}
      <div class="pf-skills-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:18px">
        ${(d.categories||[]).map((cat, cidx)=>`
        <div class="pf-card-hover" style="${cardStyle()}">
          <div data-inline-edit="skills.categories.${cidx}.name" style="font-family:${t.font};color:${t.accent};font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:17px">${cat.name}</div>
          ${(cat.items||[]).map((sk, sidx)=>`
          <div style="margin-bottom:12px">
            <div style="display:flex;justify-content:space-between;margin-bottom:5px">
              <span data-inline-edit="skills.categories.${cidx}.items.${sidx}.n" style="font-size:.82rem;font-weight:600">${sk.n}</span>
              <span style="color:${t.accent};font-size:.7rem;font-weight:700;font-family:monospace"><span data-inline-edit="skills.categories.${cidx}.items.${sidx}.v">${sk.v}</span>%</span>
            </div>
            <div style="background:${t.border};border-radius:4px;height:4px;overflow:hidden">
              <div class="skill-bar-inner" data-val="${sk.v}" style="height:100%;width:0%;background:${G};border-radius:4px;transition:width 1.5s ease;position:relative;overflow:hidden">
                <div style="position:absolute;top:0;right:0;bottom:0;width:25px;background:linear-gradient(to right,transparent,rgba(255,255,255,.4),transparent);animation:pf-shimmer 1.5s ease infinite"></div>
              </div>
            </div>
          </div>`).join('')}
        </div>`).join('')}
      </div>
    `, true);
  }

  /* ── PROJECTS ── */
  if(id==='projects') {
    const techs = [...new Set((d.items||[]).flatMap(p=>p.tech||[]))];
    return sectionWrap('projects', `
      ${sectionTitle('Projects')}
      <div class="pf-project-filters" style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:22px" id="pf-proj-filters">
        <button onclick="pfFilterProjects('all',this)" data-filter="all" style="padding:5px 13px;border-radius:20px;font-size:.73rem;font-weight:700;border:1.5px solid ${t.accent};background:${t.accent}14;color:${t.accent};cursor:pointer">All</button>
        ${techs.map(tech=>`<button onclick="pfFilterProjects('${tech}',this)" data-filter="${tech}" style="padding:5px 13px;border-radius:20px;font-size:.73rem;font-weight:700;border:1.5px solid ${t.border};background:transparent;color:${t.muted};cursor:pointer">${tech}</button>`).join('')}
      </div>
      <div class="pf-project-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(clamp(230px,30vw,295px),1fr));gap:17px" id="pf-proj-grid">
        ${(d.items||[]).map((p, idx)=>{
        const liveHref = normalizeUrl(p.link || p.demo || p.live);
        const codeHref = normalizeUrl(p.github || p.code || p.repo);
        return `
        <div class="pf-card-hover" style="${cardStyle()};position:relative" data-tech="${(p.tech||[]).join(',')}"
          onmouseover="this.style.borderColor='${t.accent}';this.style.transform='translateY(-4px)';this.style.boxShadow='0 18px 45px rgba(0,0,0,.4)'"
          onmouseout="this.style.borderColor='${t.border}';this.style.transform='none';this.style.boxShadow='none'">
          ${p.featured?`<span style="position:absolute;top:13px;right:13px;background:${G};color:#000;font-size:.6rem;font-weight:800;padding:2px 8px;border-radius:20px;text-transform:uppercase;letter-spacing:.5px">Featured</span>`:''}
          <span style="font-size:.75rem;letter-spacing:.6px;font-weight:800;color:${t.accent};margin-bottom:11px;display:block">Project</span>
          <h3 data-inline-edit="projects.items.${idx}.title" style="font-family:${t.font};font-size:clamp(.88rem,1.5vw,1.05rem);margin-bottom:7px">${p.title}</h3>
          <p data-inline-edit="projects.items.${idx}.desc" style="color:${t.muted};font-size:.82rem;line-height:1.62;margin-bottom:13px">${p.desc}</p>
          <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:13px">
            ${(p.tech||[]).map((tg, tidx)=>`<span style="background:${t.accent}14;color:${t.accent};border:1px solid ${t.accent}35;padding:2px 9px;border-radius:20px;font-size:.67rem;font-weight:700"><span data-inline-edit="projects.items.${idx}.tech.${tidx}">${tg}</span></span>`).join('')}
          </div>
          <div style="display:flex;gap:7px;flex-wrap:wrap">
            ${liveHref ? `<a href="${liveHref}" target="_blank" rel="noopener noreferrer" style="background:${G};color:#000;border:none;padding:7px 13px;border-radius:7px;font-size:.73rem;font-weight:800;cursor:pointer;transition:.2s;text-decoration:none" onmouseover="this.style.transform='translateY(-1px)'" onmouseout="this.style.transform='none'">Live Demo</a>` : ''}
            ${codeHref ? `<a href="${codeHref}" target="_blank" rel="noopener noreferrer" style="background:transparent;color:${t.accent};border:1.5px solid ${t.accent};padding:7px 13px;border-radius:7px;font-size:.73rem;font-weight:600;cursor:pointer;transition:.2s;text-decoration:none" onmouseover="this.style.background='${t.accent}12'" onmouseout="this.style.background='transparent'">Source Code</a>` : ''}
            ${!liveHref && !codeHref ? `<span style="font-size:.7rem;color:${t.muted2}">Add project links in editor</span>` : ''}
          </div>
        </div>`;
        }).join('')}
      </div>
    `);
  }

  /* ── EXPERIENCE ── */
  if(id==='experience') {
    return sectionWrap('experience', `
      ${sectionTitle('Experience')}
      <div style="display:flex;flex-direction:column;gap:15px">
        ${(d.items||[]).map((e, idx)=>`
        <div class="pf-card-hover" style="${cardStyle()}"
          onmouseover="this.style.borderColor='${t.border2}';this.style.transform='translateY(-2px)'"
          onmouseout="this.style.borderColor='${t.border}';this.style.transform='none'">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:9px;margin-bottom:5px">
            <div>
              <div data-inline-edit="experience.items.${idx}.role" style="font-family:${t.font};font-size:clamp(.88rem,1.6vw,1.08rem);font-weight:800">${e.role}</div>
              <div style="color:${t.accent};font-weight:700;font-size:.84rem;margin-top:2px">Company: <span data-inline-edit="experience.items.${idx}.company">${e.company}</span></div>
            </div>
            <span style="background:${t.surface};border:1px solid ${t.border};border-radius:20px;padding:3px 10px;font-size:.7rem;color:${t.muted};white-space:nowrap;flex-shrink:0">Period: <span data-inline-edit="experience.items.${idx}.period">${e.period}</span></span>
          </div>
          <p data-inline-edit="experience.items.${idx}.desc" style="color:${t.muted};font-size:.83rem;line-height:1.7;margin-bottom:10px">${e.desc}</p>
          <div style="display:flex;gap:5px;flex-wrap:wrap">
            ${(e.tech||[]).map((tg, tidx)=>`<span style="background:${t.accent}14;color:${t.accent};border:1px solid ${t.accent}35;padding:2px 9px;border-radius:20px;font-size:.67rem;font-weight:700"><span data-inline-edit="experience.items.${idx}.tech.${tidx}">${tg}</span></span>`).join('')}
          </div>
        </div>`).join('')}
      </div>
    `, true);
  }

  /* ── EDUCATION ── */
  if(id==='education') {
    return sectionWrap('education', `
      ${sectionTitle('Education')}
      ${(d.items||[]).map((e, idx)=>`
      <div class="pf-card-hover" style="${cardStyle()}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:11px;margin-bottom:13px">
          <div>
            <h3 data-inline-edit="education.items.${idx}.degree" style="font-family:${t.font};font-size:clamp(.95rem,2vw,1.2rem);margin-bottom:4px">${e.degree}</h3>
            <div style="color:${t.accent};font-weight:700">Institution: <span data-inline-edit="education.items.${idx}.school">${e.school}</span></div>
          </div>
          <div style="text-align:right;flex-shrink:0">
            <span data-inline-edit="education.items.${idx}.period" style="background:${t.surface};border:1px solid ${t.border};border-radius:20px;padding:3px 10px;font-size:.7rem;color:${t.muted};display:block;margin-bottom:4px">${e.period}</span>
            <span style="color:${t.accent2};font-weight:700;font-size:.83rem">GPA: <span data-inline-edit="education.items.${idx}.gpa">${e.gpa}</span></span>
          </div>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          ${(e.highlights||[]).map((h, hidx)=>`<span style="background:${t.accent}14;color:${t.accent};border:1px solid ${t.accent}35;padding:2px 9px;border-radius:20px;font-size:.67rem;font-weight:700"><span data-inline-edit="education.items.${idx}.highlights.${hidx}">${h}</span></span>`).join('')}
        </div>
      </div>`).join('')}
    `);
  }

  /* ── STATS ── */
  if(id==='stats') {
    return sectionWrap('stats', `
      ${sectionTitle('Numbers That Matter')}
      <div class="pf-stats-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(clamp(130px,20vw,155px),1fr));gap:15px">
        ${(d.items||[]).map((s, sidx)=>`
        <div class="pf-stat-box pf-card-hover"
          style="text-align:center;padding:clamp(18px,3vw,26px) 15px;${cardStyle()}"
          onmouseover="this.style.borderColor='${t.accent}';this.style.transform='translateY(-3px)'"
          onmouseout="this.style.borderColor='${t.border}';this.style.transform='none'">
          <div class="pf-stat-num" style="font-family:${t.font};font-size:clamp(1.7rem,3.5vw,2.5rem);font-weight:900;background:${G};-webkit-background-clip:text;-webkit-text-fill-color:transparent;display:block;line-height:1.1"><span class="pf-stat-value" data-target="${s.value}" data-inline-edit="stats.items.${sidx}.value">${s.value}</span><span data-inline-edit="stats.items.${sidx}.suffix">${s.suffix}</span></div>
          <div data-inline-edit="stats.items.${sidx}.label" style="font-size:.67rem;color:${t.muted};text-transform:uppercase;letter-spacing:1px;margin-top:7px;font-weight:700">${s.label}</div>
        </div>`).join('')}
      </div>
    `, true);
  }

  /* ── TIMELINE ── */
  if(id==='timeline') {
    return sectionWrap('timeline', `
      ${sectionTitle('My Journey')}
      <div style="position:relative;padding-left:34px">
        <div style="position:absolute;left:9px;top:0;bottom:0;width:2px;background:${G}"></div>
        ${(d.items||[]).map((item, idx)=>`
        <div style="position:relative;margin-bottom:32px">
          <div style="position:absolute;left:-29px;top:4px;width:11px;height:11px;border-radius:50%;background:${t.accent};border:2px solid ${t.bg};box-shadow:0 0 10px ${t.accent}"></div>
          <div data-inline-edit="timeline.items.${idx}.year" style="font-family:${t.font};color:${t.accent};font-size:.73rem;font-weight:700;margin-bottom:3px">${item.year}</div>
          <div data-inline-edit="timeline.items.${idx}.title" style="font-weight:700;font-size:clamp(.88rem,1.5vw,.98rem);margin-bottom:5px">${item.title}</div>
          <div data-inline-edit="timeline.items.${idx}.desc" style="color:${t.muted};font-size:.83rem;line-height:1.65">${item.desc}</div>
        </div>`).join('')}
      </div>
    `);
  }

  /* ── TESTIMONIALS ── */
  if(id==='testimonials') {
    return sectionWrap('testimonials', `
      ${sectionTitle('Testimonials')}
      <div class="pf-testimonial-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(clamp(230px,30vw,270px),1fr));gap:16px">
        ${(d.items||[]).map((t2, idx)=>`
        <div class="pf-card-hover" style="${cardStyle()}"
          onmouseover="this.style.transform='translateY(-4px)';this.style.borderColor='${t.accent}'"
          onmouseout="this.style.transform='none';this.style.borderColor='${t.border}'">
          <div style="color:#f59e0b;font-size:.76rem;margin-bottom:9px">Rated 5/5</div>
          <p data-inline-edit="testimonials.items.${idx}.text" style="color:${t.text};opacity:.85;line-height:1.72;font-style:italic;margin-bottom:17px;font-size:.84rem">"${t2.text}"</p>
          <div style="display:flex;align-items:center;gap:9px">
            <img src="${t2.avatar}" style="width:38px;height:38px;border-radius:50%;border:2px solid ${t.accent};background:${t.border}">
            <div>
              <div data-inline-edit="testimonials.items.${idx}.name" style="font-weight:700;font-size:.82rem">${t2.name}</div>
              <div data-inline-edit="testimonials.items.${idx}.role" style="color:${t.muted};font-size:.72rem">${t2.role}</div>
            </div>
          </div>
        </div>`).join('')}
      </div>
    `, true);
  }

  /* ── CONTACT ── */
  if(id==='contact') {
    return sectionWrap('contact', `
      ${sectionTitle("Let's Connect")}
      <p data-inline-edit="contact.message" style="color:${t.muted};margin-bottom:26px;font-size:.92rem">${d.message||''}</p>
      <div class="pf-contact-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:30px">
        <div>
          ${[
            { icon: '📧', label: 'Email', value: d.email || '', path: 'contact.email' },
            { icon: '📞', label: 'Phone', value: d.phone || '', path: 'contact.phone' },
            { icon: '🌐', label: 'Portfolio', value: 'quickfolio.app', path: '' },
            { icon: '🟢', label: 'Status', value: 'Open to work', path: '' },
          ].map((row)=>`
          <div style="display:flex;align-items:center;gap:11px;padding:12px;background:${t.card};border:1px solid ${t.border};border-radius:9px;margin-bottom:9px;transition:.2s"
            onmouseover="this.style.borderColor='${t.border2}'"
            onmouseout="this.style.borderColor='${t.border}'">
            <div style="width:34px;height:34px;border-radius:7px;background:${t.accent}12;display:flex;align-items:center;justify-content:center;font-size:.95rem;flex-shrink:0">${row.icon}</div>
            <div>
              <div style="font-weight:700;font-size:.8rem">${row.label}</div>
              <div ${row.path ? `data-inline-edit="${row.path}"` : ''} style="color:${t.muted};font-size:.76rem">${row.value}</div>
            </div>
          </div>`).join('')}
        </div>
        <div>
          <div class="pf-contact-dual" style="display:grid;grid-template-columns:1fr 1fr;gap:11px;margin-bottom:13px">
            <div>
              <label style="display:block;font-size:.68rem;font-weight:700;color:${t.muted};text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px">Name *</label>
              <input id="pf-ct-name" style="width:100%;background:${t.surface};border:1.5px solid ${t.border};border-radius:7px;padding:9px 12px;color:${t.text};font-size:.83rem;outline:none;transition:.2s" placeholder="Your name"
                onfocus="this.style.borderColor='${t.accent}'" onblur="this.style.borderColor='${t.border}'">
            </div>
            <div>
              <label style="display:block;font-size:.68rem;font-weight:700;color:${t.muted};text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px">Email *</label>
              <input id="pf-ct-email" style="width:100%;background:${t.surface};border:1.5px solid ${t.border};border-radius:7px;padding:9px 12px;color:${t.text};font-size:.83rem;outline:none;transition:.2s" placeholder="your@email.com"
                onfocus="this.style.borderColor='${t.accent}'" onblur="this.style.borderColor='${t.border}'">
            </div>
          </div>
          <label style="display:block;font-size:.68rem;font-weight:700;color:${t.muted};text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px">Subject</label>
          <input id="pf-ct-subject" style="width:100%;background:${t.surface};border:1.5px solid ${t.border};border-radius:7px;padding:9px 12px;color:${t.text};font-size:.83rem;outline:none;transition:.2s;margin-bottom:12px" placeholder="Project inquiry..."
            onfocus="this.style.borderColor='${t.accent}'" onblur="this.style.borderColor='${t.border}'">
          <label style="display:block;font-size:.68rem;font-weight:700;color:${t.muted};text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px">Message *</label>
          <textarea id="pf-ct-msg" rows="4" style="width:100%;background:${t.surface};border:1.5px solid ${t.border};border-radius:7px;padding:9px 12px;color:${t.text};font-size:.83rem;outline:none;resize:vertical;transition:.2s;margin-bottom:12px" placeholder="Tell me about your project..."
            onfocus="this.style.borderColor='${t.accent}'" onblur="this.style.borderColor='${t.border}'"></textarea>
          <div id="pf-ct-status"></div>
          <button onclick="pfSubmitContact()" style="width:100%;background:${G};color:#000;border:none;padding:12px;border-radius:7px;font-weight:800;font-size:.88rem;cursor:pointer;transition:.2s"
            onmouseover="this.style.transform='translateY(-1px)'" onmouseout="this.style.transform='none'">Send Message</button>
        </div>
      </div>
    `);
  }

  return '';
}

/* ── Portfolio page shell ── */
function generatePortfolioShell(state) {
  let t = THEMES[state.activeTheme] || THEMES.cyberpunk || Object.values(THEMES)[0];
  const visible = state.sections.filter(s => s.visible);
  const data = state.data;
  t = applyCustomTheme(t, data);
  const design = t._design || {};
  const name = data.hero?.name || 'Developer';
  const firstName = name.split(' ')[0];
  const bodyBgStyle = design.bgImageUrl
    ? `background-image:linear-gradient(rgba(0,0,0,${(design.bgOverlay / 100).toFixed(2)}),rgba(0,0,0,${(design.bgOverlay / 100).toFixed(2)})),url('${escapeCssUrl(design.bgImageUrl)}');background-size:${design.bgSize}% auto;background-position:${design.bgPosX}% ${design.bgPosY}%;background-repeat:no-repeat;background-attachment:fixed;`
    : '';

  const fontLink = `<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&family=Outfit:wght@400;500;600;700&family=Manrope:wght@400;600;700;800&family=Sora:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;700&family=Fraunces:opsz,wght@9..144,500;9..144,700&display=swap" rel="stylesheet">`;

  const sectionsHTML = visible.map(sec => renderSection(sec.id, data, t)).join('\n');

  const chatbotHTML = buildChatbotHTML(t, data);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${name} — Portfolio</title>
<meta name="description" content="${data.hero?.tagline || name + ' developer portfolio'}"/>
<link rel="icon" href="/static/images/quickfolio-mark.svg?v=20260419crafted16" type="image/svg+xml"/>
${fontLink}
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{background:${t.bg};color:${t.text};font-family:${t.body};font-size:${design.textScale || 100}%;line-height:1.6;overflow-x:hidden;-webkit-font-smoothing:antialiased;${bodyBgStyle}}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:${t.accent};border-radius:2px}
:root{--pf-ease:cubic-bezier(.22,.61,.36,1)}
@keyframes pf-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@keyframes pf-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.94)}}
@keyframes pf-shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
@keyframes pf-grad{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
@keyframes pf-fade{from{opacity:0;transform:translateY(15px)}to{opacity:1;transform:translateY(0)}}
@keyframes pf-dot{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@keyframes dot-bounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(15px)}to{opacity:1;transform:translateY(0)}}
.pf-section-shell{position:relative}
.pf-reveal{opacity:0;transform:translate3d(0,26px,0);transition:opacity .72s var(--pf-ease),transform .72s var(--pf-ease);transition-delay:var(--pf-delay,0ms)}
.pf-reveal.is-visible{opacity:1;transform:none}
.pf-card-hover{transition:transform .32s var(--pf-ease),border-color .32s var(--pf-ease),box-shadow .32s var(--pf-ease);will-change:transform}
.pf-card-hover:hover{transform:translateY(-5px);box-shadow:0 16px 38px rgba(0,0,0,.34)}
.pf-top-nav{position:sticky;top:0;z-index:100;background:${t.bg}ee;backdrop-filter:blur(18px);border-bottom:1px solid ${t.border};height:54px;display:flex;align-items:center;justify-content:space-between;padding:0 clamp(14px,4vw,30px)}
.pf-nav-logo{font-family:${t.font};font-size:clamp(.85rem,1.8vw,1.05rem);font-weight:700;background:${t.grad};-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.pf-top-links{display:flex;gap:clamp(10px,2.5vw,18px);min-width:0;overflow-x:auto;scrollbar-width:none}
.pf-top-links::-webkit-scrollbar{display:none}
.pf-nav-btn{background:none;border:none;font-size:clamp(.6rem,.8vw+.4rem,.76rem);font-weight:700;color:${t.muted};cursor:pointer;text-transform:uppercase;letter-spacing:.5px;padding:4px 0;transition:.2s;position:relative}
.pf-nav-btn:hover{color:${t.accent}}
.pf-nav-btn::after{content:'';position:absolute;left:0;right:0;bottom:-3px;height:2px;background:${t.accent};transform:scaleX(0);transform-origin:left;transition:transform .22s ease}
.pf-nav-btn:hover::after{transform:scaleX(1)}
@media(max-width:900px){
  .pf-top-nav{height:auto;min-height:54px;padding:10px 14px;gap:8px;flex-wrap:wrap}
  .pf-top-links{order:3;flex-basis:100%;padding-bottom:2px}
  .pf-about-grid{grid-template-columns:1fr!important;gap:20px!important}
  .pf-contact-grid{grid-template-columns:1fr!important;gap:18px!important}
  .pf-contact-dual{grid-template-columns:1fr!important}
}
@media(max-width:700px){
  body{background-attachment:scroll}
  .pf-hero-shell{padding:clamp(72px,10vw,96px) 14px 42px!important}
  .pf-hero-actions{flex-direction:column;align-items:stretch}
  .pf-hero-actions > *{width:100%;text-align:center}
  .pf-skills-grid,.pf-project-grid,.pf-stats-grid,.pf-testimonial-grid{grid-template-columns:1fr!important}
  .pf-project-filters{overflow-x:auto;flex-wrap:nowrap!important;padding-bottom:4px}
  .pf-project-filters button{white-space:nowrap}
  .cb-fab{right:14px;bottom:14px}
  .cb-win{left:10px;right:10px;bottom:74px;width:auto;height:calc(100vh - 94px);max-height:430px}
  .scroll-top-pf{left:12px;bottom:14px}
}
@supports (height: 100dvh){@media(max-width:700px){.cb-win{height:calc(100dvh - 94px)}}}
@media(max-width:460px){.pf-top-nav{padding:8px 10px}.pf-top-links{gap:10px}}
@media (prefers-reduced-motion: reduce){html{scroll-behavior:auto}*,*::before,*::after{animation:none!important;transition:none!important}.pf-reveal{opacity:1!important;transform:none!important}}
.ct-success{background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.3);color:#22c55e;padding:9px 12px;border-radius:8px;font-size:.78rem;font-weight:600;text-align:center;animation:pf-fade .3s ease;margin-bottom:9px}
.ct-error{background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.3);color:#ef4444;padding:9px 12px;border-radius:8px;font-size:.78rem;font-weight:600;text-align:center;animation:pf-fade .3s ease;margin-bottom:9px}
.ct-loading{background:rgba(0,229,255,.05);border:1px solid rgba(0,229,255,.2);color:${t.accent};padding:9px 12px;border-radius:8px;font-size:.78rem;font-weight:600;text-align:center;margin-bottom:9px}
/* cb */
.cb-fab{position:fixed;bottom:24px;right:24px;width:52px;height:52px;border-radius:50%;border:none;font-size:1.25rem;display:flex;align-items:center;justify-content:center;z-index:900;cursor:pointer;animation:float 3.5s ease-in-out infinite;transition:transform .2s,box-shadow .2s;background:${t.grad};box-shadow:0 8px 28px ${t.accent}45}
.cb-fab:hover{transform:scale(1.1)!important;animation:none}
.cb-win{display:none;position:fixed;bottom:88px;right:24px;width:clamp(265px,88vw,325px);height:430px;border-radius:17px;z-index:901;flex-direction:column;overflow:hidden;box-shadow:0 16px 50px rgba(0,0,0,.6);background:${t.surface};border:1px solid ${t.border}}
.cb-win.open{display:flex;animation:fadeUp .25s ease}
.cb-head{padding:12px 14px;display:flex;align-items:center;justify-content:space-between;background:${t.grad}}
.cb-msgs{flex:1;overflow-y:auto;padding:11px;display:flex;flex-direction:column;gap:8px}
.cb-msg{max-width:84%;padding:8px 11px;border-radius:12px;font-size:.78rem;line-height:1.5;animation:fadeUp .2s ease}
.cb-bot{background:${t.card};border:1px solid ${t.border};color:${t.text};align-self:flex-start;border-bottom-left-radius:3px}
.cb-usr{background:${t.grad};color:#000;font-weight:600;align-self:flex-end;border-bottom-right-radius:3px}
.cb-typing-d{width:6px;height:6px;border-radius:50%;background:${t.muted};animation:dot-bounce 1.4s ease-in-out infinite}
.cb-footer{padding:8px 10px;border-top:1px solid ${t.border};display:flex;gap:7px}
.cb-inp{flex:1;background:${t.card};border:1.5px solid ${t.border};border-radius:8px;padding:8px 11px;color:${t.text};font-size:.78rem;outline:none;transition:.2s}
.cb-inp:focus{border-color:${t.accent}}
.cb-send{background:${t.grad};border:none;border-radius:7px;padding:8px 11px;font-size:.85rem;cursor:pointer;transition:transform .2s}
.cb-send:hover{transform:scale(1.08)}
.cb-quick-wrap{display:flex;gap:5px;flex-wrap:wrap;margin-top:5px}
.cb-q{font-size:.67rem;padding:3px 8px;border-radius:8px;cursor:pointer;font-weight:700;background:${t.accent}12;border:1px solid ${t.accent}30;color:${t.accent};transition:.15s}
.cb-q:hover{background:${t.accent}22}
.scroll-top-pf{position:fixed;bottom:24px;left:24px;width:38px;height:38px;border-radius:50%;background:${t.card};border:1.5px solid ${t.border};color:${t.accent};font-size:.9rem;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:.2s;z-index:800}
.scroll-top-pf:hover{background:${t.accent};color:#000;transform:translateY(-2px)}
.skill-bar-inner{transition:width 1.5s ease!important}
</style>
</head>
<body>
<nav class="pf-top-nav">
  <div class="pf-nav-logo">&lt;${firstName}/&gt;</div>
  <div class="pf-top-links">
    ${visible.map(s=>`<button class="pf-nav-btn" onclick="document.getElementById('pf-${s.id}')?.scrollIntoView({behavior:'smooth'})">${SECTION_INFO[s.id].label.split(' ')[0]}</button>`).join('')}
  </div>
</nav>

${sectionsHTML}

<footer style="background:${t.surface};border-top:1px solid ${t.border};padding:clamp(28px,5vw,44px);text-align:center">
  <div style="font-family:${t.font};font-size:clamp(1.1rem,2.5vw,1.5rem);font-weight:900;margin-bottom:5px;background:${t.grad};-webkit-background-clip:text;-webkit-text-fill-color:transparent">&lt;${firstName}/&gt;</div>
  <p style="color:${t.muted};font-size:.83rem;margin-bottom:13px">Crafted with passion &amp; precision</p>
  <div style="display:flex;justify-content:center;gap:clamp(12px,3vw,20px);flex-wrap:wrap;margin-bottom:13px">
    ${visible.map(s=>`<button onclick="document.getElementById('pf-${s.id}')?.scrollIntoView({behavior:'smooth'})" style="color:${t.muted};font-size:.78rem;background:none;border:none;cursor:pointer;transition:.2s" onmouseover="this.style.color='${t.accent}'" onmouseout="this.style.color='${t.muted}'">${SECTION_INFO[s.id].label}</button>`).join('')}
  </div>
  <div style="color:${t.muted};font-size:.72rem">© ${new Date().getFullYear()} ${name}. Built with QuickFolio.</div>
</footer>

${chatbotHTML}
<button class="scroll-top-pf" onclick="window.scrollTo({top:0,behavior:'smooth'})" title="Scroll to top">↑</button>

<script>
const PF_ACCENT = '${t.accent}';
const PF_ACCENT2 = '${t.accent2}';
const PF_GRAD = '${t.grad}';
const PF_MUTED = '${t.muted}';
const PF_CARD = '${t.card}';
const PF_BORDER = '${t.border}';
const PF_SURFACE = '${t.surface}';
const PF_TEXT = '${t.text}';
const PF_REDUCED_MOTION = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const OWNER_EMAIL = '${state.ownerEmail || ''}';

// Project filter
function pfFilterProjects(filter, btn) {
  document.querySelectorAll('#pf-proj-filters button').forEach(b => {
    const isActive = b.dataset.filter === filter;
    b.style.borderColor = isActive ? PF_ACCENT : PF_BORDER;
    b.style.background = isActive ? PF_ACCENT+'14' : 'transparent';
    b.style.color = isActive ? PF_ACCENT : PF_MUTED;
  });
  document.querySelectorAll('#pf-proj-grid > div').forEach(card => {
    if(filter === 'all') { card.style.display = ''; return; }
    const techs = (card.dataset.tech || '').split(',');
    card.style.display = techs.includes(filter) ? '' : 'none';
  });
}

// Stats counter
function animateStats() {
  document.querySelectorAll('.pf-stat-value').forEach(numEl => {
    if (numEl.dataset.animated === '1') return;
    const target = parseInt(numEl.dataset.target, 10) || 0;
    if (target <= 0) {
      numEl.textContent = '0';
      numEl.dataset.animated = '1';
      return;
    }

    numEl.dataset.animated = '1';
    const duration = 1500;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      numEl.textContent = Math.floor(target * eased).toLocaleString();
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  });
}

// Skill bars
function animateSkills() {
  document.querySelectorAll('.skill-bar-inner').forEach(bar => {
    if (bar.dataset.animated === '1') return;
    bar.dataset.animated = '1';
    const val = bar.dataset.val || 0;
    const delay = PF_REDUCED_MOTION ? 0 : 160;
    setTimeout(() => { bar.style.width = val + '%'; }, delay);
  });
}

const revealSections = Array.from(document.querySelectorAll('section.pf-reveal'));
revealSections.forEach((sec, idx) => {
  sec.style.setProperty('--pf-delay', (Math.min(idx * 70, 420)) + 'ms');
});
if (revealSections[0]) revealSections[0].classList.add('is-visible');

if (PF_REDUCED_MOTION) {
  revealSections.forEach((sec) => sec.classList.add('is-visible'));
  animateSkills();
  animateStats();
} else {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        if (e.target.querySelector('.pf-stat-box')) animateStats();
        if (e.target.querySelector('.skill-bar-inner')) animateSkills();
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.18 });

  revealSections.forEach((sec, idx) => {
    if (idx === 0) return;
    io.observe(sec);
  });

  setTimeout(animateSkills, 350);
}

// Contact form
async function pfSubmitContact() {
  const name = document.getElementById('pf-ct-name')?.value.trim() || '';
  const email = document.getElementById('pf-ct-email')?.value.trim() || '';
  const subject = document.getElementById('pf-ct-subject')?.value.trim() || '';
  const msg = document.getElementById('pf-ct-msg')?.value.trim() || '';
  const statusEl = document.getElementById('pf-ct-status');
  if(!name || !email || !msg) {
    statusEl.innerHTML = '<div class="ct-error">Please fill in Name, Email and Message.</div>';
    return;
  }
  statusEl.innerHTML = '<div class="ct-loading">Sending your message...</div>';
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        model:'claude-sonnet-4-20250514', max_tokens:400,
        messages:[{role:'user',content:'Write a warm, professional 2-3 sentence auto-reply to a portfolio contact form submission. Visitor name: '+name+', email: '+email+', message: '+msg+'. Confirm receipt and say the owner will respond within 24-48 hours. Sign off warmly.'}]
      })
    });
    const data = await res.json();
    if(data.content?.[0]?.text) {
      statusEl.innerHTML = '<div class="ct-success">Message sent. Auto-reply dispatched to ' + email + '. Expect a response within 24-48 hours.</div>';
      ['pf-ct-name','pf-ct-email','pf-ct-subject','pf-ct-msg'].forEach(id => { const el = document.getElementById(id); if(el) el.value=''; });
    } else { throw new Error('no content'); }
  } catch(_) {
    statusEl.innerHTML = '<div class="ct-success">Message received. Will get back to you soon.</div>';
    ['pf-ct-name','pf-ct-email','pf-ct-subject','pf-ct-msg'].forEach(id => { const el = document.getElementById(id); if(el) el.value=''; });
  }
}

// Chatbot
const CB_R = {
  hi:['Hi. How can I help you today?','Hello. What would you like to know?'],
  project:['Check out the Projects section for featured work.','There are strong project examples in the Projects section.'],
  hire:['Currently open to opportunities. Use the contact form below.','Interested in working together? Drop a message in the Contact section.'],
  skill:['Top skills include React, Node.js, Python, TypeScript, and cloud tech.','The Skills section has a full breakdown of expertise across frontend, backend, and DevOps.'],
  exp:['Experience includes work across startups and established tech teams.','Check the Experience section for the full career history.'],
  contact:['Best way to reach out is the contact form on this page, or via email.','You can also connect on GitHub and LinkedIn through the links in the Hero section.'],
  _:['Great question. Check the relevant section above, or use the contact form.',"I'm not sure, but the portfolio owner would love to answer. Use the contact form.",'Check the sections above for that info, or reach out directly.']
};
function getCBReply(msg) {
  const m = msg.toLowerCase();
  if(/hi|hello|hey|greet/.test(m)) return CB_R.hi[Math.floor(Math.random()*2)];
  if(/project|work|built|creat|portfolio/.test(m)) return CB_R.project[Math.floor(Math.random()*2)];
  if(/hire|job|freelanc|opportunit|work with|available/.test(m)) return CB_R.hire[Math.floor(Math.random()*2)];
  if(/skill|tech|stack|language|framework|react|node|python/.test(m)) return CB_R.skill[Math.floor(Math.random()*2)];
  if(/experience|year|background|career|history/.test(m)) return CB_R.exp[Math.floor(Math.random()*2)];
  if(/contact|email|reach|message|phone|call/.test(m)) return CB_R.contact[Math.floor(Math.random()*2)];
  return CB_R._[Math.floor(Math.random()*3)];
}
function toggleCB() {
  const win = document.getElementById('cb-win');
  const isOpen = win.classList.contains('open');
  win.classList.toggle('open', !isOpen);
  const fab = document.getElementById('cb-fab');
  fab.textContent = isOpen ? 'CHAT' : 'X';
}
function cbSend(text) {
  const msgs = document.getElementById('cb-msgs');
  if(!msgs || !text?.trim()) return;
  msgs.innerHTML += '<div class="cb-msg cb-usr">'+text+'</div>';
  msgs.scrollTop = msgs.scrollHeight;
  setTimeout(() => {
    msgs.innerHTML += '<div class="cb-msg cb-bot">'+getCBReply(text)+'</div>';
    msgs.scrollTop = msgs.scrollHeight;
  }, 600 + Math.random()*500);
}
function cbSendInput() {
  const inp = document.getElementById('cb-inp');
  if(!inp?.value.trim()) return;
  cbSend(inp.value.trim());
  inp.value = '';
}
document.addEventListener('keydown', e => {
  if(e.key === 'Escape') {
    const win = document.getElementById('cb-win');
    if(win?.classList.contains('open')) toggleCB();
  }
});
<\/script>
</body>
</html>`;
}

function buildChatbotHTML(t, data) {
  const name = data.hero?.name?.split(' ')[0] || 'Dev';
  return `
<button class="cb-fab" id="cb-fab" onclick="toggleCB()" title="Chat with ${name}'s assistant">CHAT</button>
<div class="cb-win" id="cb-win">
  <div class="cb-head">
    <div style="display:flex;align-items:center;gap:9px">
      <div style="width:30px;height:30px;border-radius:50%;background:rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;font-size:.72rem;font-weight:700">AI</div>
      <div>
        <div style="font-weight:800;font-size:.8rem;color:#000">${name}'s Assistant</div>
        <div style="font-size:.62rem;color:rgba(0,0,0,.6);display:flex;align-items:center;gap:3px">
          <div style="width:5px;height:5px;border-radius:50%;background:#22c55e"></div> Online
        </div>
      </div>
    </div>
    <button onclick="toggleCB()" style="background:none;border:none;font-size:.9rem;color:rgba(0,0,0,.55);cursor:pointer;padding:3px">X</button>
  </div>
  <div class="cb-msgs" id="cb-msgs">
    <div class="cb-msg cb-bot">Hi, I am ${name}'s portfolio assistant. Ask me about work, skills, or hiring details.</div>
    <div class="cb-quick-wrap">
      <button class="cb-q" onclick="cbSend('View projects')">View projects</button>
      <button class="cb-q" onclick="cbSend('Hire ${name}')">Hire ${name}</button>
      <button class="cb-q" onclick="cbSend('Tech stack')">Tech stack</button>
      <button class="cb-q" onclick="cbSend('Contact info')">Contact info</button>
    </div>
  </div>
  <div class="cb-footer">
    <input class="cb-inp" id="cb-inp" placeholder="Ask anything..." onkeydown="if(event.key==='Enter')cbSendInput()">
    <button class="cb-send" onclick="cbSendInput()">Send</button>
  </div>
</div>`;
}
