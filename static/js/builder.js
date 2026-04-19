/* ══════════════════════════════════════
   BUILDER.JS — editor logic
══════════════════════════════════════ */

let _dragSrc = null;

function renderBuilder() {
  renderSectionList();
  renderThemeGrid();
  renderContentTabs();
  renderSettings();
  renderCanvas();
  setBuilderPreviewOnlyMode(Boolean(APP.state.previewOnlyMode));
}

function setBuilderPreviewOnlyMode(enabled) {
  const next = Boolean(enabled);
  APP.state.previewOnlyMode = next;

  const wrap = document.getElementById('builder-wrap');
  const side = document.getElementById('b-sidebar');
  const btn = document.getElementById('preview-only-btn');

  if (wrap) wrap.classList.toggle('preview-only', next);
  if (side && !next) side.classList.remove('collapsed');

  if (btn) {
    btn.classList.toggle('active', next);
    btn.setAttribute('aria-pressed', next ? 'true' : 'false');
    btn.innerHTML = next
      ? '<span>Show Forms</span>'
      : '<span>Inline Only</span>';
  }
}

function toggleBuilderPreviewOnlyMode() {
  setBuilderPreviewOnlyMode(!Boolean(APP.state.previewOnlyMode));
}

/* ── Section list ── */
function renderSectionList() {
  const list = document.getElementById('sec-list');
  if(!list) return;

  list.innerHTML = APP.state.sections.map((s, i) => `
    <div class="sec-item ${APP.state.selectedSection===s.id?'selected':''}"
      draggable="true"
      data-idx="${i}" data-id="${s.id}"
      onclick="selectSection('${s.id}')"
      ondragstart="onDragStart(${i})"
      ondragover="onDragOver(event,${i})"
      ondrop="onDrop(${i})"
      ondragend="onDragEnd()">
      <span class="si-drag">⠿</span>
      <span class="si-ico">${SECTION_INFO[s.id].icon}</span>
      <span class="si-lbl">${SECTION_INFO[s.id].label}</span>
      <button class="si-toggle ${s.visible?'on':'off'}" onclick="event.stopPropagation();toggleSec('${s.id}')">${s.visible?'ON':'OFF'}</button>
      ${(s.id!=='hero'&&s.id!=='contact')?`<button class="si-del" onclick="event.stopPropagation();removeSec('${s.id}')" title="Remove section">X</button>`:''}
    </div>
  `).join('');

  // Add section buttons
  const addList = document.getElementById('sec-add-list');
  if(!addList) return;
  const existing = new Set(APP.state.sections.map(s => s.id));
  const missing = Object.keys(SECTION_INFO).filter(id => !existing.has(id));
  addList.innerHTML = missing.length === 0
    ? `<div style="color:var(--muted2);font-size:.75rem;padding:5px 2px">All sections added</div>`
    : missing.map(id => `
      <button class="add-sec-btn" onclick="addSec('${id}')">
        <span>${SECTION_INFO[id].icon}</span>
        + ${SECTION_INFO[id].label}
      </button>`).join('');
}

/* ── Theme grid ── */
function renderThemeGrid() {
  const grid = document.getElementById('theme-grid');
  if(!grid) return;
  const design = ensureHeroDesign();
  const customThemeName = design.custom_theme_name || 'Custom Lab';
  grid.innerHTML = Object.values(THEMES).map(t => {
    const labelName = t.id === 'custom' ? customThemeName : t.name;
    return `
    <div class="b-th-card ${APP.state.activeTheme===t.id?'active':''}" onclick="setTheme('${t.id}')">
      <div class="b-th-prev" style="background:linear-gradient(135deg,${t.bg},${t.card})">
        <span style="color:${t.accent};font-family:${t.font}">${labelName.toUpperCase()}</span>
      </div>
      <div class="b-th-name">${labelName}</div>
      <div class="b-th-sw">
        ${[t.bg,t.accent,t.accent2,t.text].map(c=>`<div class="b-th-swatch" style="background:${c}"></div>`).join('')}
      </div>
    </div>
  `;
  }).join('');
}

const CUSTOM_THEME_COLOR_KEYS = [
  'bg_color',
  'surface_color',
  'card_color',
  'border_color',
  'border2_color',
  'accent_color',
  'accent2_color',
  'text_color',
  'muted_color',
];

function getFallbackTheme(themeId) {
  return THEMES[themeId] || THEMES.cyberpunk || Object.values(THEMES)[0];
}

function hasCustomPaletteValues(design) {
  if (!design || typeof design !== 'object') return false;
  return CUSTOM_THEME_COLOR_KEYS.some((key) => String(design[key] || '').trim());
}

function seedCustomThemeFromTheme(sourceThemeId) {
  const source = getFallbackTheme(sourceThemeId);
  if (!source) return;

  const design = ensureHeroDesign();
  if (hasCustomPaletteValues(design)) return;

  design.bg_color = source.bg;
  design.surface_color = source.surface;
  design.card_color = source.card;
  design.border_color = source.border;
  design.border2_color = source.border2;
  design.accent_color = source.accent;
  design.accent2_color = source.accent2;
  design.text_color = source.text;
  design.muted_color = source.muted;
  design.custom_theme_name = String(design.custom_theme_name || 'My Custom Theme').trim() || 'My Custom Theme';
}

/* ── Content tabs ── */
function renderContentTabs() {
  const tabs = document.getElementById('content-sec-tabs');
  if(!tabs) return;
  tabs.innerHTML = APP.state.sections.map(s => `
    <button class="cst-btn ${APP.state.selectedSection===s.id?'active':''}" onclick="selectSection('${s.id}')">
      ${SECTION_INFO[s.id].icon} ${SECTION_INFO[s.id].label.split(' ')[0]}
    </button>
  `).join('');
  renderEditor();
}

/* ── Editor ── */
function renderEditor() {
  const panel = document.getElementById('editor-panel');
  if(!panel) return;
  const id = APP.state.selectedSection;
  const info = SECTION_INFO[id];
  const d = APP.state.data[id] || {};

  let html = `<div class="ep"><div class="ep-title">${info.icon} ${info.label}</div>`;

  if(id === 'hero') {
    const photoSize = Number(d.photo_size) || 170;
    html += makeFields('hero', [
      ['name','Full Name', d.name],
      ['title','Job Title', d.title],
      ['tagline','Tagline', d.tagline],
      ['subtitle','Tech Stack Line', d.subtitle],
      ['cta','CTA Button Text', d.cta],
      ['github','GitHub', d.github],
      ['linkedin','LinkedIn', d.linkedin],
      ['twitter','Twitter', d.twitter],
      ['photo_url','Profile Photo URL', d.photo_url],
    ]);
    html += `<div class="fg"><label class="inp-label">Upload Profile Photo</label><input class="inp" type="file" accept="image/*" onchange="handleProfilePhotoUpload(this)"></div>`;
    html += `<div class="fg"><label class="inp-label">Photo Size: <span id="hero-photo-size-val">${photoSize}</span>px</label><input class="inp" type="range" min="90" max="280" step="1" value="${photoSize}" oninput="updateHeroPhotoSize(this.value)"></div>`;
    html += `<div class="fg"><label class="inp-label">Photo Shape</label><select class="inp" onchange="updateField('hero','photo_shape',this.value)"><option value="circle" ${d.photo_shape==='circle'?'selected':''}>Circle</option><option value="rounded" ${d.photo_shape==='rounded'?'selected':''}>Rounded</option></select></div>`;
  } else if(id === 'about') {
    html += `<div class="fg"><label class="inp-label">Bio</label><textarea class="inp" rows="5" oninput="updateField('about','bio',this.value)">${d.bio||''}</textarea></div>`;
    html += makeFields('about',[['location','Location',d.location],['availability','Availability',d.availability]]);
    html += `<div class="fg"><label class="inp-label">Highlights (comma-separated)</label><input class="inp" value="${(d.highlights||[]).join(', ')}" oninput="updateField('about','highlights',this.value.split(',').map(x=>x.trim()))"></div>`;
  } else if(id === 'projects') {
    html += renderProjectsEditor(d.items || []);
  } else if(id === 'contact') {
    html += makeFields('contact',[['email','Display Email',d.email],['phone','Phone',d.phone],['message','Section Message',d.message]]);
    html += `<div class="fg">
      <label class="inp-label">Your Email (receives contact notifications)</label>
      <input class="inp" value="${APP.state.ownerEmail}" oninput="APP.state.ownerEmail=this.value" placeholder="youremail@gmail.com">
      <div style="color:var(--muted2);font-size:.68rem;margin-top:4px">AI auto-replies sent to visitors from your portfolio</div>
    </div>`;
  } else {
    const allowsLooseText = ['skills','experience','education','stats','timeline','testimonials'].includes(id);
    html += `<div style="color:var(--muted);font-size:.74rem;margin-bottom:7px">Edit as JSON — changes apply live:</div>
    <textarea class="inp" rows="13" style="font-family:var(--font-m);font-size:.7rem" oninput="updateJSON('${id}',this.value)">${JSON.stringify(d,null,2)}</textarea>
    <div style="color:var(--muted2);font-size:.67rem;margin-top:4px">${allowsLooseText ? 'Plain text is supported here and auto-converts to section items.' : 'Valid JSON only'}</div>`;
  }

  html += '</div>';
  panel.innerHTML = html;
}

function escAttr(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escText(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escJsString(v) {
  return String(v ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'");
}

function makeFields(section, fields) {
  return fields.map(([k,l,v]) =>
    `<div class="fg"><label class="inp-label">${l}</label><input class="inp" value="${escAttr(v||'')}" oninput="updateField('${section}','${k}',this.value)"></div>`
  ).join('');
}

function cloneSectionValue(value) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (_) {
    return value;
  }
}

function getSectionDefaultContent(section) {
  const defaults = (typeof PORTFOLIO_DATA !== 'undefined' && PORTFOLIO_DATA && typeof PORTFOLIO_DATA === 'object')
    ? PORTFOLIO_DATA[section]
    : null;

  if (defaults && typeof defaults === 'object') {
    return cloneSectionValue(defaults);
  }

  if (section === 'skills') return { categories: [] };
  if (section === 'experience') return { items: [] };
  if (section === 'education') return { items: [] };
  if (section === 'stats') return { items: [] };
  if (section === 'timeline') return { items: [] };
  if (section === 'testimonials') return { items: [] };
  return {};
}

function splitLooseLines(rawText) {
  return String(rawText || '')
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function toIntSafe(value, fallback = 0) {
  const parsed = Number.parseInt(String(value ?? '').replace(/[^0-9-]/g, ''), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeStringList(value) {
  if (Array.isArray(value)) return value.map((v) => String(v || '').trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((v) => v.trim()).filter(Boolean);
  return [];
}

function buildSectionFromLooseText(section, rawText) {
  const text = String(rawText || '').trim();
  if (!text) return null;
  const lines = splitLooseLines(text);
  const firstLine = lines[0] || text;

  if (section === 'experience') {
    return {
      items: lines.map((line) => ({
        role: line,
        company: 'Company',
        period: 'Recent',
        desc: line,
        tech: [],
      })),
    };
  }

  if (section === 'education') {
    return {
      items: lines.map((line) => ({
        degree: line,
        school: 'School / University',
        period: 'Year',
        gpa: '',
        highlights: [],
      })),
    };
  }

  if (section === 'stats') {
    return {
      items: lines.map((line) => {
        const numeric = toIntSafe(line, 0);
        const label = line.replace(/[0-9+\-\s]+/g, '').trim() || firstLine;
        return {
          label,
          value: Math.max(0, numeric || 100),
          suffix: '+',
        };
      }),
    };
  }

  if (section === 'timeline') {
    return {
      items: lines.map((line) => ({
        year: String(new Date().getFullYear()),
        title: line,
        desc: line,
      })),
    };
  }

  if (section === 'testimonials') {
    return {
      items: lines.map((line, idx) => ({
        name: `Client ${idx + 1}`,
        role: 'Client',
        text: line,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(line.slice(0, 24) || `Client${idx + 1}`)}`,
      })),
    };
  }

  if (section === 'skills') {
    const skillItems = lines.map((line) => ({ n: line, v: 80 }));
    return {
      categories: [{
        name: 'Skills',
        items: skillItems,
      }],
    };
  }

  return null;
}

function normalizeBuilderSectionContent(section, value, rawTextHint = '') {
  const rawText = String(rawTextHint || '').trim();

  if (!['skills', 'experience', 'education', 'stats', 'timeline', 'testimonials'].includes(section)) {
    return value;
  }

  let source = value;
  if (typeof source === 'string') {
    const loose = buildSectionFromLooseText(section, source);
    source = loose || source;
  }

  if (!source || typeof source !== 'object') {
    return buildSectionFromLooseText(section, rawText) || getSectionDefaultContent(section);
  }

  if (section === 'skills') {
    const categoryInput = Array.isArray(source.categories)
      ? source.categories
      : (Array.isArray(source.items) ? [{ name: 'Skills', items: source.items }] : []);

    const categories = categoryInput.map((cat, catIdx) => {
      const name = String(cat?.name || cat?.title || `Category ${catIdx + 1}`).trim();
      const itemInput = Array.isArray(cat?.items) ? cat.items : [];
      const items = itemInput.map((item, itemIdx) => {
        const label = typeof item === 'string'
          ? item
          : String(item?.n || item?.name || item?.skill || `Skill ${itemIdx + 1}`);
        const valRaw = typeof item === 'object' ? item?.v : 80;
        const val = Math.max(0, Math.min(100, toIntSafe(valRaw, 80)));
        return { n: label.trim(), v: val };
      }).filter((item) => item.n);
      return { name, items };
    }).filter((cat) => cat.items.length > 0);

    if (categories.length) return { categories };
    return buildSectionFromLooseText(section, rawText) || getSectionDefaultContent(section);
  }

  const itemInput = Array.isArray(source.items) ? source.items : [];

  if (section === 'experience') {
    const items = itemInput.map((item) => ({
      role: String(item?.role || item?.title || '').trim(),
      company: String(item?.company || '').trim(),
      period: String(item?.period || '').trim(),
      desc: String(item?.desc || item?.description || '').trim(),
      tech: normalizeStringList(item?.tech),
    })).filter((item) => item.role || item.company || item.desc);
    if (items.length) return { items };
    return buildSectionFromLooseText(section, rawText) || getSectionDefaultContent(section);
  }

  if (section === 'education') {
    const items = itemInput.map((item) => ({
      degree: String(item?.degree || item?.title || '').trim(),
      school: String(item?.school || item?.institution || '').trim(),
      period: String(item?.period || '').trim(),
      gpa: String(item?.gpa || '').trim(),
      highlights: normalizeStringList(item?.highlights),
    })).filter((item) => item.degree || item.school);
    if (items.length) return { items };
    return buildSectionFromLooseText(section, rawText) || getSectionDefaultContent(section);
  }

  if (section === 'stats') {
    const items = itemInput.map((item, idx) => ({
      label: String(item?.label || item?.name || `Metric ${idx + 1}`).trim(),
      value: Math.max(0, toIntSafe(item?.value, 0)),
      suffix: String(item?.suffix || '').trim().slice(0, 4),
    })).filter((item) => item.label);
    if (items.length) return { items };
    return buildSectionFromLooseText(section, rawText) || getSectionDefaultContent(section);
  }

  if (section === 'timeline') {
    const items = itemInput.map((item) => ({
      year: String(item?.year || '').trim(),
      title: String(item?.title || '').trim(),
      desc: String(item?.desc || item?.description || '').trim(),
    })).filter((item) => item.year || item.title || item.desc);
    if (items.length) return { items };
    return buildSectionFromLooseText(section, rawText) || getSectionDefaultContent(section);
  }

  if (section === 'testimonials') {
    const items = itemInput.map((item, idx) => {
      const text = String(item?.text || item?.quote || '').trim();
      const name = String(item?.name || `Client ${idx + 1}`).trim() || `Client ${idx + 1}`;
      const role = String(item?.role || item?.title || 'Client').trim() || 'Client';
      const avatar = String(item?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`).trim();
      return { name, role, text, avatar };
    }).filter((item) => item.text || item.name);
    if (items.length) return { items };
    return buildSectionFromLooseText(section, rawText) || getSectionDefaultContent(section);
  }

  return source;
}

function looksLikeJsonDraft(rawText) {
  const text = String(rawText || '').trim();
  if (!text) return false;
  if (/[{}\[\]":,]/.test(text)) return true;
  return /^(true|false|null|-?\d+(\.\d+)?)$/i.test(text);
}

function renderProjectsEditor(items) {
  const projects = Array.isArray(items) ? items : [];
  if (!projects.length) {
    return `
      <div style="color:var(--muted);font-size:.75rem;margin-bottom:10px">No projects added yet.</div>
      <button class="btn btn-primary btn-sm" onclick="addProjectItem()">Add First Project</button>
    `;
  }

  return `
    <div style="display:flex;flex-direction:column;gap:10px">
      ${projects.map((p, idx) => `
      <div class="ep" style="padding:11px">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:9px">
          <div style="font-size:.73rem;font-weight:800;color:var(--accent)">Project ${idx + 1}</div>
          <button class="btn btn-danger btn-sm" onclick="removeProjectItem(${idx})" style="padding:5px 9px;font-size:.66rem">Remove</button>
        </div>
        <div class="fg"><label class="inp-label">Title</label><input class="inp" value="${escAttr(p.title || '')}" oninput="updateProjectField(${idx},'title',this.value)"></div>
        <div class="fg"><label class="inp-label">Description</label><textarea class="inp" rows="3" oninput="updateProjectField(${idx},'desc',this.value)">${escText(p.desc || '')}</textarea></div>
        <div class="fg"><label class="inp-label">Tech Stack (comma-separated)</label><input class="inp" value="${escAttr((p.tech || []).join(', '))}" oninput="updateProjectTech(${idx},this.value)"></div>
        <div class="fg"><label class="inp-label">Demo Link (Live URL)</label><input class="inp" value="${escAttr(p.link || p.demo || p.live || '')}" placeholder="https://demo.example.com" oninput="updateProjectField(${idx},'link',this.value)"></div>
        <div class="fg"><label class="inp-label">GitHub/Code Link</label><input class="inp" value="${escAttr(p.github || p.code || p.repo || '')}" placeholder="https://github.com/username/repo" oninput="updateProjectField(${idx},'github',this.value)"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div class="fg"><label class="inp-label">Project Badge</label><input class="inp" value="${escAttr(p.emoji || 'PR')}" oninput="updateProjectField(${idx},'emoji',this.value)"></div>
          <div class="fg" style="display:flex;align-items:flex-end;justify-content:flex-start;padding-bottom:4px">
            <label style="display:flex;align-items:center;gap:7px;color:var(--muted);font-size:.75rem;font-weight:700">
              <input type="checkbox" ${p.featured ? 'checked' : ''} onchange="updateProjectField(${idx},'featured',this.checked)"> Featured Project
            </label>
          </div>
        </div>
      </div>`).join('')}
      <button class="btn btn-primary btn-sm" onclick="addProjectItem()">Add Project</button>
    </div>
  `;
}

function ensureProjectsArray() {
  if (!APP.state.data.projects || typeof APP.state.data.projects !== 'object') {
    APP.state.data.projects = { items: [] };
  }
  if (!Array.isArray(APP.state.data.projects.items)) {
    APP.state.data.projects.items = [];
  }
  return APP.state.data.projects.items;
}

function addProjectItem() {
  const items = ensureProjectsArray();
  items.push({
    title: 'New Project',
    desc: 'Project description',
    tech: ['React'],
    emoji: 'PR',
    featured: false,
    link: '',
    github: ''
  });
  renderEditor();
  renderCanvas();
}

function removeProjectItem(index) {
  const items = ensureProjectsArray();
  if (index < 0 || index >= items.length) return;
  items.splice(index, 1);
  renderEditor();
  renderCanvas();
}

function updateProjectField(index, key, value) {
  const items = ensureProjectsArray();
  if (index < 0 || index >= items.length) return;
  items[index][key] = value;
  renderCanvas();
}

function updateProjectTech(index, value) {
  const items = ensureProjectsArray();
  if (index < 0 || index >= items.length) return;
  items[index].tech = value.split(',').map(v => v.trim()).filter(Boolean);
  renderCanvas();
}

function updateField(section, key, value) {
  if(!APP.state.data[section]) APP.state.data[section] = {};
  APP.state.data[section][key] = value;
  renderCanvas();
}

function updateHeroPhotoSize(value) {
  settingChanged('photo_size', value);
}

function updateJSON(section, val) {
  const rawValue = String(val ?? '');
  const trimmed = rawValue.trim();

  if (!trimmed) {
    APP.state.data[section] = normalizeBuilderSectionContent(section, APP.state.data[section] || getSectionDefaultContent(section), '');
    renderCanvas();
    return;
  }

  try {
    const parsed = JSON.parse(rawValue);
    APP.state.data[section] = normalizeBuilderSectionContent(section, parsed, rawValue);
    renderCanvas();
  } catch(_) {
    if (looksLikeJsonDraft(trimmed)) return;
    const converted = buildSectionFromLooseText(section, trimmed);
    if (!converted) return;
    APP.state.data[section] = normalizeBuilderSectionContent(section, converted, trimmed);
    renderCanvas();
  }
}

function toNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clampNumber(value, min, max, fallback) {
  const n = toNumber(value, fallback);
  return Math.min(max, Math.max(min, n));
}

function getSectionScaleDefaults() {
  return Object.keys(SECTION_INFO || {}).reduce((acc, key) => {
    acc[key] = 100;
    return acc;
  }, {});
}

function getSectionFontDefaults() {
  return Object.keys(SECTION_INFO || {}).reduce((acc, key) => {
    acc[key] = 'default';
    return acc;
  }, {});
}

function ensureHeroDesign() {
  if (!APP.state.data.hero || typeof APP.state.data.hero !== 'object') {
    APP.state.data.hero = {};
  }
  if (!APP.state.data.hero.design || typeof APP.state.data.hero.design !== 'object' || Array.isArray(APP.state.data.hero.design)) {
    APP.state.data.hero.design = {};
  }

  const d = APP.state.data.hero.design;
  d.bg_image_url = String(d.bg_image_url || '').trim();
  d.bg_size = clampNumber(d.bg_size, 60, 220, 100);
  d.bg_overlay = clampNumber(d.bg_overlay, 0, 90, 45);
  d.bg_pos_x = clampNumber(d.bg_pos_x, 0, 100, 50);
  d.bg_pos_y = clampNumber(d.bg_pos_y, 0, 100, 50);
  d.text_scale = clampNumber(d.text_scale, 85, 140, 100);
  d.heading_scale = clampNumber(d.heading_scale, 80, 145, 100);
  d.body_scale = clampNumber(d.body_scale, 80, 145, 100);
  d.section_spacing = clampNumber(d.section_spacing, 45, 130, 80);
  d.card_radius = clampNumber(d.card_radius, 8, 32, 16);
  d.text_color = String(d.text_color || '').trim();
  d.accent_color = String(d.accent_color || '').trim();
  d.bg_color = String(d.bg_color || '').trim();
  d.surface_color = String(d.surface_color || '').trim();
  d.card_color = String(d.card_color || '').trim();
  d.border_color = String(d.border_color || '').trim();
  d.border2_color = String(d.border2_color || '').trim();
  d.accent2_color = String(d.accent2_color || '').trim();
  d.muted_color = String(d.muted_color || '').trim();
  d.custom_theme_name = String(d.custom_theme_name || 'My Custom Theme').trim().slice(0, 48) || 'My Custom Theme';
  d.heading_font = String(d.heading_font || 'default').trim() || 'default';
  d.body_font = String(d.body_font || 'default').trim() || 'default';

  const sectionScaleDefaults = getSectionScaleDefaults();
  const sectionScaleInput = (d.section_scales && typeof d.section_scales === 'object' && !Array.isArray(d.section_scales)) ? d.section_scales : {};
  d.section_scales = {};
  Object.keys(sectionScaleDefaults).forEach((key) => {
    d.section_scales[key] = clampNumber(sectionScaleInput[key], 80, 150, 100);
  });

  const allowedFonts = ['default', 'Orbitron', 'Syne', 'Outfit', 'DM Mono', 'Manrope', 'Sora', 'Space Grotesk', 'Fraunces'];
  const sectionFontDefaults = getSectionFontDefaults();
  const sectionFontInput = (d.section_fonts && typeof d.section_fonts === 'object' && !Array.isArray(d.section_fonts)) ? d.section_fonts : {};
  d.section_fonts = {};
  Object.keys(sectionFontDefaults).forEach((key) => {
    const candidate = String(sectionFontInput[key] || 'default').trim();
    d.section_fonts[key] = allowedFonts.includes(candidate) ? candidate : 'default';
  });

  APP.state.data.hero.photo_size = clampNumber(APP.state.data.hero.photo_size, 90, 280, 170);
  APP.state.data.hero.photo_shape = (APP.state.data.hero.photo_shape === 'rounded') ? 'rounded' : 'circle';
  APP.state.data.hero.photo_url = String(APP.state.data.hero.photo_url || '').trim();
  APP.state.data.hero.photo_offset_x = clampNumber(APP.state.data.hero.photo_offset_x, -160, 160, 0);
  APP.state.data.hero.photo_offset_y = clampNumber(APP.state.data.hero.photo_offset_y, -160, 160, 0);
  APP.state.data.hero.recruiter_mode_enabled = Boolean(APP.state.data.hero.recruiter_mode_enabled);

  return d;
}

/* ── Settings tab ── */
function renderSettings() {
  const hero = APP.state.data.hero || {};
  const design = ensureHeroDesign();

  const nm = document.getElementById('set-name');
  const ti = document.getElementById('set-title');
  const lo = document.getElementById('set-loc');
  const em = document.getElementById('set-email');
  if(nm) nm.value = hero.name || '';
  if(ti) ti.value = hero.title || '';
  if(lo) lo.value = APP.state.data.about?.location || '';
  if(em) em.value = APP.state.ownerEmail || '';

  const photoUrl = document.getElementById('set-photo-url');
  const photoSize = document.getElementById('set-photo-size');
  const photoSizeLabel = document.getElementById('set-photo-size-val');
  const photoPosX = document.getElementById('set-photo-posx');
  const photoPosY = document.getElementById('set-photo-posy');
  const photoPosXLabel = document.getElementById('set-photo-posx-val');
  const photoPosYLabel = document.getElementById('set-photo-posy-val');
  const bgUrl = document.getElementById('set-bg-url');
  const bgSize = document.getElementById('set-bg-size');
  const bgOverlay = document.getElementById('set-bg-overlay');
  const bgPosX = document.getElementById('set-bg-posx');
  const bgPosY = document.getElementById('set-bg-posy');
  const bgSizeLabel = document.getElementById('set-bg-size-val');
  const bgOverlayLabel = document.getElementById('set-bg-overlay-val');
  const bgPosXLabel = document.getElementById('set-bg-posx-val');
  const bgPosYLabel = document.getElementById('set-bg-posy-val');
  const textScale = document.getElementById('set-text-scale');
  const textScaleLabel = document.getElementById('set-text-scale-val');
  const headingScale = document.getElementById('set-heading-scale');
  const headingScaleLabel = document.getElementById('set-heading-scale-val');
  const bodyScale = document.getElementById('set-body-scale');
  const bodyScaleLabel = document.getElementById('set-body-scale-val');
  const sectionSpacing = document.getElementById('set-section-spacing');
  const sectionSpacingLabel = document.getElementById('set-section-spacing-val');
  const cardRadius = document.getElementById('set-card-radius');
  const cardRadiusLabel = document.getElementById('set-card-radius-val');
  const customThemeName = document.getElementById('set-custom-theme-name');
  const textColor = document.getElementById('set-text-color');
  const accentColor = document.getElementById('set-accent-color');
  const accent2Color = document.getElementById('set-accent2-color');
  const bgColor = document.getElementById('set-bg-color');
  const surfaceColor = document.getElementById('set-surface-color');
  const cardColor = document.getElementById('set-card-color');
  const borderColor = document.getElementById('set-border-color');
  const border2Color = document.getElementById('set-border2-color');
  const mutedColor = document.getElementById('set-muted-color');
  const headingFont = document.getElementById('set-heading-font');
  const bodyFont = document.getElementById('set-body-font');
  const recruiterDefault = document.getElementById('set-recruiter-default');

  if (photoUrl) photoUrl.value = hero.photo_url || '';
  if (photoSize) photoSize.value = hero.photo_size || 170;
  if (photoSizeLabel) photoSizeLabel.textContent = String(hero.photo_size || 170);
  if (photoPosX) photoPosX.value = hero.photo_offset_x || 0;
  if (photoPosY) photoPosY.value = hero.photo_offset_y || 0;
  if (photoPosXLabel) photoPosXLabel.textContent = String(hero.photo_offset_x || 0);
  if (photoPosYLabel) photoPosYLabel.textContent = String(hero.photo_offset_y || 0);
  if (document.getElementById('hero-photo-size-val')) document.getElementById('hero-photo-size-val').textContent = String(hero.photo_size || 170);

  if (bgUrl) bgUrl.value = design.bg_image_url || '';
  if (bgSize) bgSize.value = design.bg_size;
  if (bgOverlay) bgOverlay.value = design.bg_overlay;
  if (bgPosX) bgPosX.value = design.bg_pos_x;
  if (bgPosY) bgPosY.value = design.bg_pos_y;
  if (bgSizeLabel) bgSizeLabel.textContent = String(design.bg_size);
  if (bgOverlayLabel) bgOverlayLabel.textContent = String(design.bg_overlay);
  if (bgPosXLabel) bgPosXLabel.textContent = String(design.bg_pos_x);
  if (bgPosYLabel) bgPosYLabel.textContent = String(design.bg_pos_y);

  if (textScale) textScale.value = design.text_scale;
  if (textScaleLabel) textScaleLabel.textContent = String(design.text_scale);
  if (headingScale) headingScale.value = design.heading_scale;
  if (headingScaleLabel) headingScaleLabel.textContent = String(design.heading_scale);
  if (bodyScale) bodyScale.value = design.body_scale;
  if (bodyScaleLabel) bodyScaleLabel.textContent = String(design.body_scale);
  if (sectionSpacing) sectionSpacing.value = design.section_spacing;
  if (sectionSpacingLabel) sectionSpacingLabel.textContent = String(design.section_spacing);
  if (cardRadius) cardRadius.value = design.card_radius;
  if (cardRadiusLabel) cardRadiusLabel.textContent = String(design.card_radius);

  const fallbackTheme = getFallbackTheme(APP.state.activeTheme);
  const pickColor = (value, fallback) => {
    const raw = String(value || '').trim();
    return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw) ? raw : fallback;
  };

  if (customThemeName) customThemeName.value = design.custom_theme_name || 'My Custom Theme';
  if (textColor) textColor.value = pickColor(design.text_color, fallbackTheme?.text || '#dde0ff');
  if (accentColor) accentColor.value = pickColor(design.accent_color, fallbackTheme?.accent || '#00ffcc');
  if (accent2Color) accent2Color.value = pickColor(design.accent2_color, fallbackTheme?.accent2 || '#ff00aa');
  if (bgColor) bgColor.value = pickColor(design.bg_color, fallbackTheme?.bg || '#0a0a0f');
  if (surfaceColor) surfaceColor.value = pickColor(design.surface_color, fallbackTheme?.surface || '#11111c');
  if (cardColor) cardColor.value = pickColor(design.card_color, fallbackTheme?.card || '#18182a');
  if (borderColor) borderColor.value = pickColor(design.border_color, fallbackTheme?.border || '#28284a');
  if (border2Color) border2Color.value = pickColor(design.border2_color, fallbackTheme?.border2 || '#3a3a60');
  if (mutedColor) mutedColor.value = pickColor(design.muted_color, fallbackTheme?.muted || '#6060a0');
  if (headingFont) headingFont.value = design.heading_font || 'default';
  if (bodyFont) bodyFont.value = design.body_font || 'default';
  if (recruiterDefault) recruiterDefault.checked = Boolean(hero.recruiter_mode_enabled);

  const scaleGrid = document.getElementById('set-section-scale-grid');
  if (scaleGrid) {
    scaleGrid.innerHTML = Object.keys(SECTION_INFO).map((id) => {
      const val = clampNumber(design.section_scales?.[id], 80, 150, 100);
      return `<div style="margin-bottom:8px">
        <label class="inp-label" style="display:flex;justify-content:space-between;align-items:center">${SECTION_INFO[id].icon} ${SECTION_INFO[id].label}<span id="sec-scale-val-${id}" style="font-size:.64rem;color:var(--muted2)">${val}%</span></label>
        <input class="inp" type="range" min="80" max="150" step="1" value="${val}" oninput="settingSectionScale('${id}',this.value)">
      </div>`;
    }).join('');
  }

  const fontOptions = (selected) => ['default', 'Orbitron', 'Syne', 'Outfit', 'DM Mono', 'Manrope', 'Sora', 'Space Grotesk', 'Fraunces']
    .map((name) => `<option value="${name}" ${selected === name ? 'selected' : ''}>${name === 'default' ? 'Theme Default' : name}</option>`)
    .join('');

  const fontGrid = document.getElementById('set-section-font-grid');
  if (fontGrid) {
    fontGrid.innerHTML = Object.keys(SECTION_INFO).map((id) => {
      const selected = String(design.section_fonts?.[id] || 'default');
      return `<div style="margin-bottom:8px">
        <label class="inp-label">${SECTION_INFO[id].icon} ${SECTION_INFO[id].label}</label>
        <select class="inp" onchange="settingSectionFont('${id}',this.value)">
          ${fontOptions(selected)}
        </select>
      </div>`;
    }).join('');
  }

  renderDesignPresetList();
  if (!designPresetsLoaded && !designPresetLoadPromise) {
    loadDesignPresets();
  }
  renderResumeTailoringResult(APP.state.resumeTailoring || null, null);

  const fl = document.getElementById('feat-list');
  if(fl) fl.innerHTML = [
    'AI Chatbot Widget','Contact Form + AI Auto-reply',
    'Project Filter by Tech','Animated Stats Counter',
    'Scroll Animations','Sticky Navigation',
    'Responsive (Mobile + Desktop)','GitHub Pages Export',
    '20+ Premium Themes','Drag & Drop Reorder',
  ].map(f => `<div>${f}</div>`).join('');
}

function settingChanged(key, val) {
  if(key==='name')  { if(!APP.state.data.hero)APP.state.data.hero={}; APP.state.data.hero.name=val; }
  if(key==='title') { if(!APP.state.data.hero)APP.state.data.hero={}; APP.state.data.hero.title=val; }
  if(key==='loc')   { if(!APP.state.data.about)APP.state.data.about={}; APP.state.data.about.location=val; }
  if(key==='email') APP.state.ownerEmail = val;

  if (key === 'photo_url') {
    if (!APP.state.data.hero) APP.state.data.hero = {};
    APP.state.data.hero.photo_url = String(val || '').trim();
  }
  if (key === 'photo_size') {
    if (!APP.state.data.hero) APP.state.data.hero = {};
    APP.state.data.hero.photo_size = clampNumber(val, 90, 280, 170);
    const label = document.getElementById('set-photo-size-val');
    if (label) label.textContent = String(APP.state.data.hero.photo_size);
    const heroLabel = document.getElementById('hero-photo-size-val');
    if (heroLabel) heroLabel.textContent = String(APP.state.data.hero.photo_size);
  }
  if (key === 'photo_shape') {
    if (!APP.state.data.hero) APP.state.data.hero = {};
    APP.state.data.hero.photo_shape = val === 'rounded' ? 'rounded' : 'circle';
  }
  if (key === 'photo_offset_x') {
    if (!APP.state.data.hero) APP.state.data.hero = {};
    APP.state.data.hero.photo_offset_x = clampNumber(val, -160, 160, 0);
    const el = document.getElementById('set-photo-posx-val');
    if (el) el.textContent = String(APP.state.data.hero.photo_offset_x);
    const input = document.getElementById('set-photo-posx');
    if (input) input.value = APP.state.data.hero.photo_offset_x;
  }
  if (key === 'photo_offset_y') {
    if (!APP.state.data.hero) APP.state.data.hero = {};
    APP.state.data.hero.photo_offset_y = clampNumber(val, -160, 160, 0);
    const el = document.getElementById('set-photo-posy-val');
    if (el) el.textContent = String(APP.state.data.hero.photo_offset_y);
    const input = document.getElementById('set-photo-posy');
    if (input) input.value = APP.state.data.hero.photo_offset_y;
  }
  if (key === 'recruiter_mode_enabled') {
    if (!APP.state.data.hero) APP.state.data.hero = {};
    APP.state.data.hero.recruiter_mode_enabled = String(val || '').trim() === '1' || val === true;
  }

  const design = ensureHeroDesign();
  if (key === 'bg_image_url') design.bg_image_url = String(val || '').trim();
  if (key === 'bg_size') {
    design.bg_size = clampNumber(val, 60, 220, 100);
    const el = document.getElementById('set-bg-size-val');
    if (el) el.textContent = String(design.bg_size);
  }
  if (key === 'bg_overlay') {
    design.bg_overlay = clampNumber(val, 0, 90, 45);
    const el = document.getElementById('set-bg-overlay-val');
    if (el) el.textContent = String(design.bg_overlay);
  }
  if (key === 'bg_pos_x') {
    design.bg_pos_x = clampNumber(val, 0, 100, 50);
    const el = document.getElementById('set-bg-posx-val');
    if (el) el.textContent = String(design.bg_pos_x);
  }
  if (key === 'bg_pos_y') {
    design.bg_pos_y = clampNumber(val, 0, 100, 50);
    const el = document.getElementById('set-bg-posy-val');
    if (el) el.textContent = String(design.bg_pos_y);
  }
  if (key === 'text_scale') {
    design.text_scale = clampNumber(val, 85, 140, 100);
    const el = document.getElementById('set-text-scale-val');
    if (el) el.textContent = String(design.text_scale);
  }
  if (key === 'heading_scale') {
    design.heading_scale = clampNumber(val, 80, 145, 100);
    const el = document.getElementById('set-heading-scale-val');
    if (el) el.textContent = String(design.heading_scale);
  }
  if (key === 'body_scale') {
    design.body_scale = clampNumber(val, 80, 145, 100);
    const el = document.getElementById('set-body-scale-val');
    if (el) el.textContent = String(design.body_scale);
  }
  if (key === 'section_spacing') {
    design.section_spacing = clampNumber(val, 45, 130, 80);
    const el = document.getElementById('set-section-spacing-val');
    if (el) el.textContent = String(design.section_spacing);
  }
  if (key === 'card_radius') {
    design.card_radius = clampNumber(val, 8, 32, 16);
    const el = document.getElementById('set-card-radius-val');
    if (el) el.textContent = String(design.card_radius);
  }

  if (key === 'custom_theme_name') {
    design.custom_theme_name = String(val || '').trim().slice(0, 48) || 'My Custom Theme';
    renderThemeGrid();
  }

  if (key === 'text_color') design.text_color = String(val || '').trim();
  if (key === 'accent_color') design.accent_color = String(val || '').trim();
  if (key === 'accent2_color') {
    design.accent2_color = String(val || '').trim();
    APP.state.activeTheme = 'custom';
    renderThemeGrid();
  }
  if (key === 'bg_color') {
    design.bg_color = String(val || '').trim();
    APP.state.activeTheme = 'custom';
    renderThemeGrid();
  }
  if (key === 'surface_color') {
    design.surface_color = String(val || '').trim();
    APP.state.activeTheme = 'custom';
    renderThemeGrid();
  }
  if (key === 'card_color') {
    design.card_color = String(val || '').trim();
    APP.state.activeTheme = 'custom';
    renderThemeGrid();
  }
  if (key === 'border_color') {
    design.border_color = String(val || '').trim();
    APP.state.activeTheme = 'custom';
    renderThemeGrid();
  }
  if (key === 'border2_color') {
    design.border2_color = String(val || '').trim();
    APP.state.activeTheme = 'custom';
    renderThemeGrid();
  }
  if (key === 'muted_color') {
    design.muted_color = String(val || '').trim();
    APP.state.activeTheme = 'custom';
    renderThemeGrid();
  }
  if (key === 'heading_font') design.heading_font = String(val || 'default');
  if (key === 'body_font') design.body_font = String(val || 'default');

  renderCanvas();
}

function settingSectionScale(sectionId, value) {
  const design = ensureHeroDesign();
  design.section_scales[sectionId] = clampNumber(value, 80, 150, 100);
  const label = document.getElementById(`sec-scale-val-${sectionId}`);
  if (label) label.textContent = `${design.section_scales[sectionId]}%`;
  renderCanvas();
}

function settingSectionFont(sectionId, value) {
  const allowedFonts = ['default', 'Orbitron', 'Syne', 'Outfit', 'DM Mono', 'Manrope', 'Sora', 'Space Grotesk', 'Fraunces'];
  const design = ensureHeroDesign();
  design.section_fonts[sectionId] = allowedFonts.includes(value) ? value : 'default';
  renderCanvas();
}

function renderResumeTailoringResult(result, errorMessage) {
  const output = document.getElementById('resume-tailor-output');
  if (!output) return;

  if (errorMessage) {
    output.innerHTML = `<div style="color:#ef4444;font-size:.72rem">${escText(errorMessage)}</div>`;
    return;
  }

  if (!result || typeof result !== 'object') {
    output.innerHTML = 'Run analysis to get job-specific headline, summary, and skill-gap guidance.';
    return;
  }

  const matched = Array.isArray(result.matched_skills) ? result.matched_skills : [];
  const missing = Array.isArray(result.missing_skills) ? result.missing_skills : [];
  const bullets = Array.isArray(result.resume_bullets) ? result.resume_bullets : [];
  const fitScore = Number(result.fit_score) || 0;

  output.innerHTML = `
    <div style="display:grid;gap:7px;font-size:.72rem;color:var(--muted)">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
        <span style="font-weight:700;color:var(--text)">${escText(result.job_title || 'Target role')}</span>
        <span style="padding:3px 8px;border-radius:999px;border:1px solid var(--border2);color:var(--accent);font-weight:700">Fit ${fitScore}%</span>
      </div>
      <div><strong style="color:var(--text)">Headline:</strong> ${escText(result.tailored_headline || '')}</div>
      <div><strong style="color:var(--text)">Summary:</strong> ${escText(result.tailored_summary || '')}</div>
      <div><strong style="color:var(--text)">Matched:</strong> ${escText(matched.slice(0, 6).join(' | ') || 'No strong overlaps detected yet')}</div>
      <div><strong style="color:var(--text)">Gaps:</strong> ${escText(missing.slice(0, 5).join(' | ') || 'No major gaps found')}</div>
      ${bullets.length ? `<div><strong style="color:var(--text)">Resume bullets:</strong><ul style="margin:6px 0 0 16px;display:grid;gap:4px">${bullets.slice(0, 3).map((b) => `<li>${escText(b)}</li>`).join('')}</ul></div>` : ''}
    </div>`;
}

async function analyzeResumeTailoring() {
  const jobUrl = String(document.getElementById('set-tailor-job-url')?.value || '').trim();
  const jobDescription = String(document.getElementById('set-tailor-job-text')?.value || '').trim();

  if (!jobUrl && !jobDescription) {
    renderResumeTailoringResult(null, 'Add job description text or URL first.');
    Toast.error('Add job description text or URL first');
    return;
  }

  renderResumeTailoringResult(null, 'Analyzing role fit...');
  const res = await API.post('/api/resume/tailor', {
    job_url: jobUrl,
    job_description: jobDescription,
  });

  if (!res.ok || !res.data?.tailoring) {
    renderResumeTailoringResult(null, res?.data?.error || 'Unable to analyze this role right now.');
    Toast.error(res?.data?.error || 'Unable to analyze role');
    return;
  }

  APP.state.resumeTailoring = res.data.tailoring;
  renderResumeTailoringResult(APP.state.resumeTailoring, null);
  Toast.success('Resume tailored for target role');
}

function applyTailoringToProfile() {
  const result = APP.state.resumeTailoring;
  if (!result || typeof result !== 'object') {
    Toast.error('Run Analyze Role Fit first');
    return;
  }

  if (!APP.state.data.hero || typeof APP.state.data.hero !== 'object') APP.state.data.hero = {};
  if (!APP.state.data.about || typeof APP.state.data.about !== 'object') APP.state.data.about = {};

  if (result.job_title) APP.state.data.hero.title = String(result.job_title);
  if (result.tailored_headline) APP.state.data.hero.tagline = String(result.tailored_headline);
  if (result.tailored_summary) APP.state.data.about.bio = String(result.tailored_summary);

  const projectItems = APP.state.data.projects?.items;
  const orderedTitles = Array.isArray(result.recommended_project_titles) ? result.recommended_project_titles : [];
  if (Array.isArray(projectItems) && orderedTitles.length) {
    const orderLookup = {};
    orderedTitles.forEach((title, idx) => {
      const key = String(title || '').trim().toLowerCase();
      if (!key) return;
      orderLookup[key] = idx;
    });

    APP.state.data.projects.items = [...projectItems].sort((a, b) => {
      const aKey = String(a?.title || '').trim().toLowerCase();
      const bKey = String(b?.title || '').trim().toLowerCase();
      const aRank = Object.prototype.hasOwnProperty.call(orderLookup, aKey) ? orderLookup[aKey] : 999;
      const bRank = Object.prototype.hasOwnProperty.call(orderLookup, bKey) ? orderLookup[bKey] : 999;
      if (aRank !== bRank) return aRank - bRank;
      const aFeatured = a?.featured ? 0 : 1;
      const bFeatured = b?.featured ? 0 : 1;
      if (aFeatured !== bFeatured) return aFeatured - bFeatured;
      return aKey.localeCompare(bKey);
    });
  }

  renderEditor();
  renderSettings();
  renderCanvas();
  Toast.success('Tailoring suggestions applied to profile');
}

async function downloadTailoredResumePdf() {
  const jobUrl = String(document.getElementById('set-tailor-job-url')?.value || '').trim();
  const jobDescription = String(document.getElementById('set-tailor-job-text')?.value || '').trim();

  if (!jobUrl && !jobDescription) {
    renderResumeTailoringResult(null, 'Add job description text or URL first.');
    Toast.error('Add job description text or URL first');
    return;
  }

  renderResumeTailoringResult(null, 'Generating tailored PDF...');

  const res = await fetch('/api/resume/tailored-pdf', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      job_url: jobUrl,
      job_description: jobDescription,
    }),
  });

  if (!res.ok) {
    let errorPayload = {};
    try {
      errorPayload = await res.json();
    } catch (_) {
      errorPayload = {};
    }
    const message = errorPayload?.error || 'Unable to generate tailored PDF';
    renderResumeTailoringResult(APP.state.resumeTailoring || null, message);
    Toast.error(message);
    return;
  }

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const disposition = String(res.headers.get('Content-Disposition') || '');
  const match = disposition.match(/filename="?([^";]+)"?/i);
  const filename = (match && match[1]) ? match[1] : 'tailored-resume.pdf';

  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(objectUrl);

  renderResumeTailoringResult(APP.state.resumeTailoring || null, null);
  Toast.success('Tailored resume PDF downloaded');
}

let designPresetsCache = [];
let designPresetsLoaded = false;
let designPresetLoadPromise = null;
const LEGACY_DESIGN_PRESET_STORAGE_KEY = 'QuickFolio.design.presets.v1';
const LEGACY_DESIGN_PRESET_MIGRATION_PREFIX = 'QuickFolio.design.presets.migrated.user.';

function getLegacyPresetMigrationKey() {
  const uid = String(globalThis.Auth?.user?.id || '').trim();
  if (!uid) return '';
  return `${LEGACY_DESIGN_PRESET_MIGRATION_PREFIX}${uid}`;
}

function isLegacyPresetMigrationDone() {
  const key = getLegacyPresetMigrationKey();
  if (!key) return true;
  try {
    return localStorage.getItem(key) === '1';
  } catch (_) {
    return true;
  }
}

function markLegacyPresetMigrationDone() {
  const key = getLegacyPresetMigrationKey();
  if (!key) return;
  try {
    localStorage.setItem(key, '1');
  } catch (_) {
    // Ignore storage write failures.
  }
}

function readLegacyDesignPresets() {
  try {
    const raw = localStorage.getItem(LEGACY_DESIGN_PRESET_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return [];

    const seen = new Set();
    const rows = [];
    Object.keys(parsed).forEach((rawName) => {
      const normalizedName = String(rawName || '').trim().slice(0, 64);
      if (!normalizedName) return;
      const nameKey = normalizedName.toLowerCase();
      if (seen.has(nameKey)) return;

      const snapshot = parsed[rawName];
      if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return;

      seen.add(nameKey);
      rows.push({
        name: normalizedName,
        snapshot,
      });
    });

    return rows;
  } catch (_) {
    return [];
  }
}

async function migrateLegacyDesignPresetsToAccount() {
  if (isLegacyPresetMigrationDone()) return 0;

  const legacyRows = readLegacyDesignPresets();
  if (!legacyRows.length) {
    markLegacyPresetMigrationDone();
    return 0;
  }

  let migratedCount = 0;
  let failures = 0;

  for (const row of legacyRows) {
    const res = await API.post('/api/design-presets', {
      name: row.name,
      snapshot: row.snapshot,
    });

    if (res.ok && res.data?.preset) {
      upsertPresetInCache(res.data.preset);
      migratedCount += 1;
    } else {
      failures += 1;
    }
  }

  if (failures === 0) {
    markLegacyPresetMigrationDone();
  }

  return migratedCount;
}

function normalizeDesignPresetRows(rows) {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((row) => row && typeof row === 'object')
    .map((row) => ({
      id: String(row.id || ''),
      name: String(row.name || '').trim(),
      snapshot: (row.snapshot && typeof row.snapshot === 'object') ? row.snapshot : {},
      created_at: row.created_at || '',
      updated_at: row.updated_at || '',
    }))
    .filter((row) => row.id && row.name);
}

async function loadDesignPresets(force = false) {
  if (designPresetLoadPromise && !force) return designPresetLoadPromise;
  if (designPresetsLoaded && !force) {
    renderDesignPresetList();
    return designPresetsCache;
  }

  designPresetLoadPromise = (async () => {
    const res = await API.get('/api/design-presets');
    if (res.ok && Array.isArray(res.data?.presets)) {
      designPresetsCache = normalizeDesignPresetRows(res.data.presets);
      const migratedCount = await migrateLegacyDesignPresetsToAccount();
      if (migratedCount > 0) {
        Toast.success(`Imported ${migratedCount} legacy preset${migratedCount === 1 ? '' : 's'} into your account`);
      }
    } else {
      designPresetsCache = [];
      const message = res?.data?.error || 'Unable to load design presets';
      if (res.status && res.status !== 401) {
        Toast.error(message);
      }
    }
    designPresetsLoaded = true;
    renderDesignPresetList();
    return designPresetsCache;
  })();

  try {
    return await designPresetLoadPromise;
  } finally {
    designPresetLoadPromise = null;
  }
}

function upsertPresetInCache(preset) {
  if (!preset || typeof preset !== 'object') return;
  const normalized = normalizeDesignPresetRows([preset])[0];
  if (!normalized) return;

  const byId = designPresetsCache.findIndex((p) => p.id === normalized.id);
  if (byId >= 0) {
    designPresetsCache[byId] = normalized;
    return;
  }

  const byName = designPresetsCache.findIndex((p) => p.name.toLowerCase() === normalized.name.toLowerCase());
  if (byName >= 0) {
    designPresetsCache[byName] = normalized;
    return;
  }

  designPresetsCache.push(normalized);
}

function getDesignPresetByName(name) {
  const needle = String(name || '').trim().toLowerCase();
  if (!needle) return null;
  return designPresetsCache.find((preset) => preset.name.toLowerCase() === needle) || null;
}

function getDesignPresetById(id) {
  const needle = String(id || '').trim();
  if (!needle) return null;
  return designPresetsCache.find((preset) => preset.id === needle) || null;
}

function cloneJson(value) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (_) {
    return {};
  }
}

function currentDesignPresetSnapshot() {
  const design = ensureHeroDesign();
  const hero = APP.state.data.hero || {};
  return {
    theme: APP.state.activeTheme,
    hero: {
      photo_url: String(hero.photo_url || ''),
      photo_size: clampNumber(hero.photo_size, 90, 280, 170),
      photo_shape: hero.photo_shape === 'rounded' ? 'rounded' : 'circle',
      photo_offset_x: clampNumber(hero.photo_offset_x, -160, 160, 0),
      photo_offset_y: clampNumber(hero.photo_offset_y, -160, 160, 0),
      recruiter_mode_enabled: Boolean(hero.recruiter_mode_enabled),
      design: cloneJson(design),
    }
  };
}

function applyDesignPresetSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') return false;
  if (!APP.state.data.hero || typeof APP.state.data.hero !== 'object') APP.state.data.hero = {};

  if (snapshot.theme && THEMES[snapshot.theme]) {
    APP.state.activeTheme = snapshot.theme;
    renderThemeGrid();
  }

  const heroSnap = snapshot.hero && typeof snapshot.hero === 'object' ? snapshot.hero : {};
  APP.state.data.hero.photo_url = String(heroSnap.photo_url || '').trim();
  APP.state.data.hero.photo_size = clampNumber(heroSnap.photo_size, 90, 280, 170);
  APP.state.data.hero.photo_shape = heroSnap.photo_shape === 'rounded' ? 'rounded' : 'circle';
  APP.state.data.hero.photo_offset_x = clampNumber(heroSnap.photo_offset_x, -160, 160, 0);
  APP.state.data.hero.photo_offset_y = clampNumber(heroSnap.photo_offset_y, -160, 160, 0);
  APP.state.data.hero.recruiter_mode_enabled = Boolean(heroSnap.recruiter_mode_enabled);
  APP.state.data.hero.design = {
    ...(APP.state.data.hero.design || {}),
    ...(heroSnap.design && typeof heroSnap.design === 'object' ? cloneJson(heroSnap.design) : {}),
  };

  ensureHeroDesign();
  renderSettings();
  renderCanvas();
  return true;
}

function renderDesignPresetList() {
  const listEl = document.getElementById('set-preset-list');
  if (!listEl) return;

  if (!designPresetsLoaded && designPresetLoadPromise) {
    listEl.innerHTML = `<div style="color:var(--muted2);font-size:.7rem;padding:4px 0">Loading presets...</div>`;
    return;
  }

  const presets = [...designPresetsCache].sort((a, b) => a.name.localeCompare(b.name));

  if (!presets.length) {
    listEl.innerHTML = `<div style="color:var(--muted2);font-size:.7rem;padding:4px 0">No presets saved yet.</div>`;
    return;
  }

  listEl.innerHTML = presets.map((preset) => {
    const safeName = escJsString(preset.name);
    const safeId = escJsString(preset.id);
    return `<div style="display:flex;align-items:center;justify-content:space-between;gap:6px;padding:6px 0;border-top:1px dashed var(--border)">
      <span style="font-size:.72rem;color:var(--text);font-weight:600">${escText(preset.name)}</span>
      <div style="display:flex;gap:5px;flex-shrink:0">
        <button class="btn btn-ghost btn-sm" style="padding:3px 8px;font-size:.63rem" onclick="applyDesignPreset('${safeName}')">Apply</button>
        <button class="btn btn-danger btn-sm" style="padding:3px 8px;font-size:.63rem" onclick="deleteDesignPreset('${safeId}')">Delete</button>
      </div>
    </div>`;
  }).join('');
}

async function saveCurrentDesignPreset() {
  const input = document.getElementById('set-preset-name');
  const name = String(input?.value || '').trim();
  if (!name) {
    Toast.error('Enter preset name first');
    return;
  }

  const res = await API.post('/api/design-presets', {
    name,
    snapshot: currentDesignPresetSnapshot(),
  });

  if (!res.ok || !res.data?.preset) {
    Toast.error(res?.data?.error || 'Unable to save preset');
    return;
  }

  upsertPresetInCache(res.data.preset);
  designPresetsLoaded = true;
  renderDesignPresetList();
  if (input) input.value = String(res.data.preset.name || name);
  Toast.success(`Preset saved: ${String(res.data.preset.name || name)}`);
}

async function applyDesignPreset(name) {
  if (!designPresetsLoaded) {
    await loadDesignPresets();
  }

  const preset = getDesignPresetByName(name);
  if (!preset || !preset.snapshot) {
    Toast.error('Preset not found');
    return;
  }

  if (applyDesignPresetSnapshot(preset.snapshot)) {
    const input = document.getElementById('set-preset-name');
    if (input) input.value = preset.name;
    Toast.success(`Preset applied: ${preset.name}`);
  }
}

async function deleteDesignPreset(presetId) {
  const preset = getDesignPresetById(presetId);
  if (!preset) return;

  const res = await API.delete(`/api/design-presets/${encodeURIComponent(preset.id)}`);
  if (!res.ok) {
    Toast.error(res?.data?.error || 'Unable to delete preset');
    return;
  }

  designPresetsCache = designPresetsCache.filter((item) => item.id !== preset.id);
  designPresetsLoaded = true;
  renderDesignPresetList();
  Toast.info(`Preset deleted: ${preset.name}`);
}

async function uploadImageFile(file) {
  const form = new FormData();
  form.append('file', file);

  const res = await fetch('/api/upload/image', {
    method: 'POST',
    credentials: 'include',
    body: form,
  });

  let payload = {};
  try {
    payload = await res.json();
  } catch (_) {
    payload = {};
  }

  if (!res.ok || !payload?.url) {
    throw new Error(payload?.error || 'Upload failed');
  }
  return payload.url;
}

async function handleProfilePhotoUpload(input) {
  const file = input?.files?.[0];
  if (!file) return;
  Toast.info('Uploading profile photo...');
  try {
    const uploadedUrl = await uploadImageFile(file);
    settingChanged('photo_url', uploadedUrl);
    const photoUrlInput = document.getElementById('set-photo-url');
    if (photoUrlInput) photoUrlInput.value = uploadedUrl;
    Toast.success('Profile photo uploaded');
  } catch (err) {
    Toast.error(err?.message || 'Photo upload failed');
  } finally {
    if (input) input.value = '';
  }
}

async function handleBackgroundUpload(input) {
  const file = input?.files?.[0];
  if (!file) return;
  Toast.info('Uploading background image...');
  try {
    const uploadedUrl = await uploadImageFile(file);
    settingChanged('bg_image_url', uploadedUrl);
    const bgUrlInput = document.getElementById('set-bg-url');
    if (bgUrlInput) bgUrlInput.value = uploadedUrl;
    Toast.success('Background image uploaded');
  } catch (err) {
    Toast.error(err?.message || 'Background upload failed');
  } finally {
    if (input) input.value = '';
  }
}

function resetDesignControls() {
  const design = ensureHeroDesign();
  design.bg_image_url = '';
  design.bg_size = 100;
  design.bg_overlay = 45;
  design.bg_pos_x = 50;
  design.bg_pos_y = 50;
  design.text_scale = 100;
  design.heading_scale = 100;
  design.body_scale = 100;
  design.section_spacing = 80;
  design.card_radius = 16;
  design.text_color = '';
  design.accent_color = '';
  design.bg_color = '';
  design.surface_color = '';
  design.card_color = '';
  design.border_color = '';
  design.border2_color = '';
  design.accent2_color = '';
  design.muted_color = '';
  design.custom_theme_name = 'My Custom Theme';
  design.heading_font = 'default';
  design.body_font = 'default';
  design.section_scales = getSectionScaleDefaults();
  design.section_fonts = getSectionFontDefaults();
  APP.state.data.hero.photo_offset_x = 0;
  APP.state.data.hero.photo_offset_y = 0;
  renderSettings();
  renderCanvas();
  Toast.success('Design customization reset');
}

/* ── Canvas ── */
function renderCanvas() {
  const canvas = document.getElementById('portfolio-canvas');
  if(!canvas) return;
  const t = getFallbackTheme(APP.state.activeTheme);
  const visible = APP.state.sections.filter(s => s.visible);

  visible.forEach((s) => {
    if (typeof normalizeBuilderSectionContent !== 'function') return;
    APP.state.data[s.id] = normalizeBuilderSectionContent(s.id, APP.state.data[s.id]);
  });

  canvas.innerHTML = buildCanvasHTML(t, visible);
  attachHeroPhotoDrag(canvas);
  attachInlineSectionEditing(canvas);
  animateCanvasMotion(canvas);
  // Trigger skill animations after short delay
  setTimeout(() => {
    canvas.querySelectorAll('.skill-bar-inner').forEach(bar => {
      const val = bar.dataset.val || 0;
      bar.style.width = val + '%';
    });
    animateStatsInCanvas(canvas);
  }, 150);
}

function animateCanvasMotion(canvas) {
  if (!canvas) return;
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sections = Array.from(canvas.querySelectorAll('section.pf-reveal'));
  sections.forEach((sec, idx) => {
    sec.style.setProperty('--pf-delay', (Math.min(idx * 70, 420)) + 'ms');
  });

  if (!sections.length) return;
  sections[0].classList.add('is-visible');

  if (prefersReduced) {
    sections.forEach((sec) => sec.classList.add('is-visible'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      io.unobserve(entry.target);
    });
  }, { root: canvas, threshold: 0.15 });

  sections.slice(1).forEach((sec) => io.observe(sec));
}

function attachHeroPhotoDrag(canvas) {
  const box = canvas.querySelector('[data-hero-photo-box]');
  const handle = canvas.querySelector('[data-hero-photo-resize]');
  if (!box || box.dataset.dragBound === '1') return;
  box.dataset.dragBound = '1';
  box.style.cursor = 'grab';
  if (handle) handle.style.cursor = 'nwse-resize';

  const syncPositionUI = (x, y) => {
    const posXLabel = document.getElementById('set-photo-posx-val');
    const posYLabel = document.getElementById('set-photo-posy-val');
    const posXInput = document.getElementById('set-photo-posx');
    const posYInput = document.getElementById('set-photo-posy');
    if (posXLabel) posXLabel.textContent = String(x);
    if (posYLabel) posYLabel.textContent = String(y);
    if (posXInput) posXInput.value = String(x);
    if (posYInput) posYInput.value = String(y);
  };

  const syncSizeUI = (size) => {
    const sizeInput = document.getElementById('set-photo-size');
    const sizeLabel = document.getElementById('set-photo-size-val');
    const heroSizeLabel = document.getElementById('hero-photo-size-val');
    if (sizeInput) sizeInput.value = String(size);
    if (sizeLabel) sizeLabel.textContent = String(size);
    if (heroSizeLabel) heroSizeLabel.textContent = String(size);
  };

  box.addEventListener('pointerdown', (event) => {
    if (event.target && event.target.closest('[data-hero-photo-resize]')) return;
    event.preventDefault();
    box.setPointerCapture?.(event.pointerId);

    const startX = event.clientX;
    const startY = event.clientY;
    const baseX = clampNumber(APP.state.data.hero?.photo_offset_x, -160, 160, 0);
    const baseY = clampNumber(APP.state.data.hero?.photo_offset_y, -160, 160, 0);

    box.style.cursor = 'grabbing';

    const onMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      const nextX = clampNumber(baseX + dx, -160, 160, 0);
      const nextY = clampNumber(baseY + dy, -160, 160, 0);

      if (!APP.state.data.hero) APP.state.data.hero = {};
      APP.state.data.hero.photo_offset_x = nextX;
      APP.state.data.hero.photo_offset_y = nextY;

      box.style.transform = `translate(${nextX}px, ${nextY}px)`;
      syncPositionUI(nextX, nextY);
    };

    const onUp = () => {
      box.style.cursor = 'grab';
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  });

  if (handle) {
    handle.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      event.stopPropagation();
      handle.setPointerCapture?.(event.pointerId);

      const startX = event.clientX;
      const startY = event.clientY;
      const baseSize = clampNumber(APP.state.data.hero?.photo_size, 90, 280, 170);

      const onMove = (moveEvent) => {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        const delta = Math.max(dx, dy);
        const nextSize = clampNumber(baseSize + delta, 90, 280, 170);

        if (!APP.state.data.hero) APP.state.data.hero = {};
        APP.state.data.hero.photo_size = nextSize;

        box.style.width = `${nextSize}px`;
        box.style.height = `${nextSize}px`;
        syncSizeUI(nextSize);
      };

      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    });
  }
}

function setNestedValueByPath(root, path, nextValue) {
  if (!root || typeof root !== 'object') return false;
  const parts = String(path || '').split('.').filter(Boolean);
  if (!parts.length) return false;

  let cursor = root;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const part = parts[i];
    const nextPart = parts[i + 1];
    const isIndex = /^\d+$/.test(part);
    const nextIsIndex = /^\d+$/.test(nextPart);

    if (isIndex) {
      const idx = Number(part);
      if (!Array.isArray(cursor)) return false;
      if (cursor[idx] === undefined || cursor[idx] === null || typeof cursor[idx] !== 'object') {
        cursor[idx] = nextIsIndex ? [] : {};
      }
      cursor = cursor[idx];
      continue;
    }

    if (cursor[part] === undefined || cursor[part] === null || typeof cursor[part] !== 'object') {
      cursor[part] = nextIsIndex ? [] : {};
    }
    cursor = cursor[part];
  }

  const finalKey = parts[parts.length - 1];
  if (/^\d+$/.test(finalKey)) {
    const idx = Number(finalKey);
    if (!Array.isArray(cursor)) return false;
    cursor[idx] = nextValue;
    return true;
  }

  cursor[finalKey] = nextValue;
  return true;
}

function applyBuilderInlineEdit(path, value) {
  const cleanPath = String(path || '').trim();
  if (!cleanPath) return;

  const rawText = String(value ?? '').replace(/\s+/g, ' ').trim();
  let normalizedValue = rawText;

  if (/^skills\.categories\.\d+\.items\.\d+\.v$/.test(cleanPath)) {
    normalizedValue = clampNumber(parseInt(rawText, 10), 0, 100, 0);
  } else if (/^stats\.items\.\d+\.value$/.test(cleanPath)) {
    const parsed = parseInt(rawText.replace(/[^0-9-]/g, ''), 10);
    normalizedValue = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  } else if (/^stats\.items\.\d+\.suffix$/.test(cleanPath)) {
    normalizedValue = rawText.slice(0, 4);
  } else if (cleanPath === 'hero.cta') {
    normalizedValue = rawText.replace(/\s*>\s*$/, '');
  }

  const ok = setNestedValueByPath(APP.state.data, cleanPath, normalizedValue);
  if (!ok) return;

  renderEditor();
  renderSettings();
  renderCanvas();
}

function placeCaretAtEnd(el) {
  if (!el) return;
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const selection = window.getSelection();
  if (!selection) return;
  selection.removeAllRanges();
  selection.addRange(range);
}

function attachInlineSectionEditing(canvas) {
  const nodes = canvas.querySelectorAll('[data-inline-edit]');
  if (!nodes.length) return;

  nodes.forEach((node) => {
    if (node.dataset.inlineBound === '1') return;
    node.dataset.inlineBound = '1';
    node.classList.add('inline-editable');
    node.setAttribute('title', 'Click to edit');

    node.addEventListener('click', (event) => {
      if (node.getAttribute('contenteditable') === 'true') return;
      event.preventDefault();
      event.stopPropagation();

      node.dataset.inlineBefore = String(node.textContent || '').trim();
      node.setAttribute('contenteditable', 'true');
      node.classList.add('is-inline-editing');
      node.focus();
      placeCaretAtEnd(node);
    });

    node.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        node.dataset.inlineCancelled = '1';
        node.textContent = node.dataset.inlineBefore || node.textContent;
        node.blur();
        return;
      }

      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        node.blur();
      }
    });

    node.addEventListener('blur', () => {
      if (node.getAttribute('contenteditable') !== 'true') return;
      const path = node.dataset.inlineEdit || '';
      const before = String(node.dataset.inlineBefore || '').trim();
      const cancelled = node.dataset.inlineCancelled === '1';
      const after = String(node.textContent || '').replace(/\s+/g, ' ').trim();

      node.removeAttribute('contenteditable');
      node.classList.remove('is-inline-editing');
      delete node.dataset.inlineCancelled;

      if (!path || cancelled) return;
      if (after === before) return;
      applyBuilderInlineEdit(path, after);
    });
  });
}

function buildCanvasHTML(t, visible) {
  const data = APP.state.data;
  t = applyCustomTheme(t, data);
  const design = t._design || {};
  const name = data.hero?.name || 'Developer';
  const firstName = name.split(' ')[0];
  const canvasBgStyle = design.bgImageUrl
    ? `background-image:linear-gradient(rgba(0,0,0,${(design.bgOverlay / 100).toFixed(2)}),rgba(0,0,0,${(design.bgOverlay / 100).toFixed(2)})),url('${escapeCssUrl(design.bgImageUrl)}');background-size:${design.bgSize}% auto;background-position:${design.bgPosX}% ${design.bgPosY}%;background-repeat:no-repeat;background-attachment:fixed;`
    : '';

  let html = `<div style="background:${t.bg};color:${t.text};font-family:${t.body};font-size:${design.textScale || 100}%;min-height:100%;overflow:auto;${canvasBgStyle}">
  <style>
    :root{--pf-ease:cubic-bezier(.22,.61,.36,1)}
    @keyframes pf-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
    @keyframes pf-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.94)}}
    @keyframes pf-shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
    @keyframes pf-grad{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
    @keyframes pf-fade{from{opacity:0;transform:translateY(15px)}to{opacity:1;transform:translateY(0)}}
    @keyframes dot-bounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
    @keyframes fadeUp{from{opacity:0;transform:translateY(15px)}to{opacity:1;transform:translateY(0)}}
    .cb-msg{font-size:.78rem;} .ct-success,.ct-error,.ct-loading{font-size:.78rem;padding:8px 11px;border-radius:7px;margin-bottom:8px;text-align:center}
    .ct-success{background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.3);color:#22c55e}
    .ct-error{background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.3);color:#ef4444}
    .ct-loading{background:rgba(0,229,255,.05);border:1px solid rgba(0,229,255,.2);color:${t.accent}}
    .pf-section-shell{position:relative}
    .pf-reveal{opacity:0;transform:translate3d(0,24px,0);transition:opacity .68s var(--pf-ease),transform .68s var(--pf-ease);transition-delay:var(--pf-delay,0ms)}
    .pf-reveal.is-visible{opacity:1;transform:none}
    .pf-card-hover{transition:transform .3s var(--pf-ease),border-color .3s var(--pf-ease),box-shadow .3s var(--pf-ease);will-change:transform}
    .pf-card-hover:hover{transform:translateY(-4px);box-shadow:0 14px 30px rgba(0,0,0,.35)}
    .pf-preview-nav-links{display:flex;align-items:center;gap:clamp(8px,2vw,16px);max-width:72%;min-width:0;overflow-x:auto;white-space:nowrap;scrollbar-width:none}
    .pf-preview-nav-links::-webkit-scrollbar{display:none}
    .pf-preview-nav-menu{display:none;width:30px;height:30px;border-radius:8px;border:1px solid ${t.border};background:${t.card};color:${t.accent};align-items:center;justify-content:center;font-size:.95rem;line-height:1;cursor:pointer}
    .pf-preview-mobile-menu{display:none;padding:8px 12px;gap:7px;flex-wrap:wrap;background:${t.bg}f2;border-bottom:1px solid ${t.border};backdrop-filter:blur(10px)}
    .pf-preview-mobile-menu.open{display:flex;animation:fadeUp .18s ease}
    .pf-preview-mobile-link{background:${t.card};border:1px solid ${t.border};color:${t.muted};border-radius:999px;padding:6px 11px;font-size:.66rem;font-weight:700;letter-spacing:.35px;text-transform:uppercase;cursor:pointer;transition:.2s}
    .pf-preview-mobile-link:hover{color:${t.accent};border-color:${t.accent}55}
    .canvas-wrap.mobile #portfolio-canvas .pf-preview-nav-links{display:none}
    .canvas-wrap.mobile #portfolio-canvas .pf-preview-nav-menu{display:inline-flex}
    .canvas-wrap.mobile #portfolio-canvas .pf-preview-nav{padding:0 12px}
    [data-inline-edit].inline-editable{cursor:text;outline:1px dashed transparent;outline-offset:2px;transition:outline-color .18s ease,background .18s ease}
    [data-inline-edit].inline-editable:hover{outline-color:${t.accent}77;background:${t.accent}12}
    [data-inline-edit].is-inline-editing{outline-color:${t.accent};background:${t.accent}1f;border-radius:6px;padding:1px 3px}
    .cb-fab{position:fixed;bottom:22px;right:22px;width:50px;height:50px;padding:0;border-radius:50%;border:none;font-size:1.18rem;line-height:1;display:flex;align-items:center;justify-content:center;z-index:1901;cursor:pointer;background:${t.grad};color:#000;box-shadow:0 10px 28px rgba(0,0,0,.42);animation:float 3.5s ease-in-out infinite;transition:transform .2s,box-shadow .2s}
    .cb-fab:hover{transform:scale(1.08)!important;animation:none}
    .cb-win{display:none;position:fixed;bottom:86px;right:22px;width:clamp(255px,85vw,320px);height:415px;border-radius:16px;z-index:1902;flex-direction:column;overflow:hidden;box-shadow:0 15px 45px rgba(0,0,0,.6);background:${t.surface};border:1px solid ${t.border}}
    .cb-win.open{display:flex;animation:fadeUp .22s ease}
    .cb-head{padding:12px 14px;display:flex;align-items:center;justify-content:space-between;background:${t.grad}}
    .cb-msgs{flex:1;overflow-y:auto;padding:11px;display:flex;flex-direction:column;gap:8px}
    .cb-msgs::-webkit-scrollbar{width:4px}
    .cb-msgs::-webkit-scrollbar-thumb{background:${t.border};border-radius:2px}
    .cb-msg{max-width:84%;padding:7px 10px;border-radius:11px;line-height:1.5;animation:fadeUp .2s ease}
    .cb-bot{background:${t.card};border:1px solid ${t.border};color:${t.text};align-self:flex-start;border-bottom-left-radius:3px}
    .cb-usr{background:${t.grad};color:#000;font-weight:600;align-self:flex-end;border-bottom-right-radius:3px}
    .cb-footer{padding:8px 10px;border-top:1px solid ${t.border};display:flex;gap:7px;background:${t.surface}}
    .cb-inp{flex:1;background:${t.card};border:1.5px solid ${t.border};border-radius:8px;padding:8px 11px;color:${t.text};font-size:.78rem;outline:none;transition:.2s}
    .cb-inp:focus{border-color:${t.accent}}
    .cb-send{background:${t.grad};border:none;border-radius:7px;padding:8px 11px;font-size:.85rem;cursor:pointer;transition:transform .2s;color:#000;font-weight:700}
    .cb-send:hover{transform:scale(1.08)}
    .cb-quick-wrap{display:flex;gap:5px;flex-wrap:wrap;margin-top:5px}
    .cb-q{font-size:.67rem;padding:3px 8px;border-radius:8px;cursor:pointer;font-weight:700;background:${t.accent}12;border:1px solid ${t.accent}30;color:${t.accent};transition:.15s}
    .cb-q:hover{background:${t.accent}22}
    .skill-bar-inner{transition:width 1.5s ease!important}
    @media (prefers-reduced-motion: reduce){*,*::before,*::after{animation:none!important;transition:none!important}.pf-reveal{opacity:1!important;transform:none!important}}
  </style>
  <nav class="pf-preview-nav" style="position:sticky;top:0;z-index:100;background:${t.bg}ee;backdrop-filter:blur(16px);border-bottom:1px solid ${t.border};height:52px;display:flex;align-items:center;justify-content:space-between;padding:0 clamp(12px,4vw,24px)">
    <div style="font-family:${t.font};font-size:clamp(.8rem,1.6vw,1rem);font-weight:700;background:${t.grad};-webkit-background-clip:text;-webkit-text-fill-color:transparent">&lt;${firstName}/&gt;</div>
    <div class="pf-preview-nav-links">
      ${visible.map(s=>`<button onclick="document.getElementById('pf-${s.id}')?.scrollIntoView({behavior:'smooth'})" style="background:none;border:none;font-size:clamp(.55rem,.7vw+.4rem,.73rem);font-weight:700;color:${t.muted};cursor:pointer;text-transform:uppercase;letter-spacing:.4px;transition:.2s;white-space:nowrap" onmouseover="this.style.color='${t.accent}'" onmouseout="this.style.color='${t.muted}'">${SECTION_INFO[s.id].label.split(' ')[0]}</button>`).join('')}
    </div>
    <button class="pf-preview-nav-menu" type="button" aria-label="Preview navigation" aria-expanded="false" aria-controls="pf-mobile-nav-menu" onclick="const m=document.getElementById('pf-mobile-nav-menu');if(!m)return;const o=m.classList.toggle('open');this.setAttribute('aria-expanded',o?'true':'false');this.textContent=o?'Close':'Menu';">Menu</button>
  </nav>`;

  html += `<div id="pf-mobile-nav-menu" class="pf-preview-mobile-menu">${visible.map(s=>`<button class="pf-preview-mobile-link" onclick="document.getElementById('pf-${s.id}')?.scrollIntoView({behavior:'smooth'});const m=document.getElementById('pf-mobile-nav-menu');if(m)m.classList.remove('open');const b=document.querySelector('.pf-preview-nav-menu');if(b){b.textContent='Menu';b.setAttribute('aria-expanded','false');}">${SECTION_INFO[s.id].label}</button>`).join('')}</div>`;

  visible.forEach(sec => {
    html += renderSection(sec.id, data, t, { builderMode: true });
  });

  html += `
  <footer style="background:${t.surface};border-top:1px solid ${t.border};padding:clamp(24px,5vw,40px);text-align:center">
    <div style="font-family:${t.font};font-size:clamp(1rem,2.5vw,1.5rem);font-weight:900;background:${t.grad};-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:5px">&lt;${firstName}/&gt;</div>
    <div style="display:flex;justify-content:center;gap:clamp(10px,3vw,18px);flex-wrap:wrap;margin:11px 0">
      ${visible.map(s=>`<button onclick="document.getElementById('pf-${s.id}')?.scrollIntoView({behavior:'smooth'})" style="color:${t.muted};font-size:.76rem;background:none;border:none;cursor:pointer;transition:.2s" onmouseover="this.style.color='${t.accent}'" onmouseout="this.style.color='${t.muted}'">${SECTION_INFO[s.id].label}</button>`).join('')}
    </div>
    <div style="color:${t.muted};font-size:.7rem">© ${new Date().getFullYear()} ${name}. Built with QuickFolio.</div>
  </footer>
  ${buildChatbotHTML(t, data)}
  <button onclick="document.getElementById('portfolio-canvas').scrollTo({top:0,behavior:'smooth'})" style="position:fixed;bottom:22px;left:22px;width:36px;height:36px;border-radius:50%;background:${t.card};border:1.5px solid ${t.border};color:${t.accent};font-size:.85rem;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:.2s;z-index:800" onmouseover="this.style.background='${t.accent}';this.style.color='#000'" onmouseout="this.style.background='${t.card}';this.style.color='${t.accent}'">↑</button>
  </div>`;

  return html;
}

function animateStatsInCanvas(canvas) {
  canvas.querySelectorAll('.pf-stat-value').forEach(numEl => {
    if (numEl.dataset.animated === '1') return;
    const target = parseInt(numEl.dataset.target, 10) || 0;
    if (target <= 0) {
      numEl.textContent = '0';
      numEl.dataset.animated = '1';
      return;
    }

    numEl.dataset.animated = '1';
    const duration = 1400;
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

/* ── Section management ── */
function selectSection(id) {
  APP.state.selectedSection = id;
  switchBuilderTab('content', document.querySelector('[data-tab="content"]'));
  renderSectionList();
  renderContentTabs();
}

function toggleSec(id) {
  APP.state.sections = APP.state.sections.map(s => s.id===id ? {...s,visible:!s.visible} : s);
  renderSectionList();
  renderCanvas();
}

function removeSec(id) {
  APP.state.sections = APP.state.sections.filter(s => s.id !== id);
  renderSectionList();
  renderCanvas();
}

function addSec(id) {
  if(APP.state.sections.find(s => s.id === id)) return;
  APP.state.sections.push({id, visible:true});
  renderSectionList();
  renderCanvas();
}

/* ── Drag & drop ── */
function onDragStart(i) { _dragSrc = i; }
function onDragOver(e, i) {
  e.preventDefault();
  document.querySelectorAll('.sec-item').forEach((el, idx) => el.classList.toggle('drag-over', idx===i && idx!==_dragSrc));
}
function onDrop(i) {
  if(_dragSrc === null || _dragSrc === i) return;
  const arr = [...APP.state.sections];
  const [item] = arr.splice(_dragSrc, 1);
  arr.splice(i, 0, item);
  APP.state.sections = arr;
  _dragSrc = null;
  renderSectionList();
  renderCanvas();
}
function onDragEnd() {
  document.querySelectorAll('.sec-item').forEach(el => el.classList.remove('drag-over'));
  _dragSrc = null;
}

/* ── Theme switching ── */
function setTheme(id) {
  const nextTheme = THEMES[id] ? id : 'cyberpunk';
  if (nextTheme === 'custom') {
    const sourceTheme = APP.state.activeTheme && APP.state.activeTheme !== 'custom'
      ? APP.state.activeTheme
      : 'cyberpunk';
    seedCustomThemeFromTheme(sourceTheme);
  }
  APP.state.activeTheme = nextTheme;
  renderThemeGrid();
  renderSettings();
  renderCanvas();
}

/* ── Device switcher ── */
function setDevice(device, btn) {
  APP.state.device = device;
  document.querySelectorAll('.dev-btn').forEach(b => b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  const wrap = document.getElementById('canvas-wrap');
  if(wrap) wrap.className = `canvas-wrap ${device}`;
}

function toggleSidebar() {
  document.getElementById('b-sidebar')?.classList.toggle('collapsed');
}

/* ── Builder preview chatbot controls ── */
function getPreviewChatEls() {
  const canvas = document.getElementById('portfolio-canvas');
  return {
    canvas,
    win: canvas?.querySelector('#cb-win'),
    fab: canvas?.querySelector('#cb-fab'),
    msgs: canvas?.querySelector('#cb-msgs'),
    inp: canvas?.querySelector('#cb-inp')
  };
}

function previewChatReply(message) {
  const m = (message || '').toLowerCase();
  if (/project|demo|portfolio/.test(m)) return 'You can add demo and GitHub links in Edit -> Projects. They become clickable on your live portfolio.';
  if (/github|linkedin|social/.test(m)) return 'Update your GitHub and LinkedIn URLs in Edit -> Hero. Visitors can click them directly.';
  if (/hire|contact|mail|email/.test(m)) return 'Use the Contact section to let recruiters reach you. Keep your email and message clear.';
  return 'Looks great so far. Keep your sections concise and add real project links for better conversions.';
}

window.toggleCB = function () {
  const { win, fab } = getPreviewChatEls();
  if (!win || !fab) return;
  const isOpen = win.classList.contains('open');
  win.classList.toggle('open', !isOpen);
  fab.textContent = isOpen ? 'CHAT' : 'X';
};

window.cbSend = function (text) {
  const { msgs } = getPreviewChatEls();
  if (!msgs) return;
  const message = (text || '').trim();
  if (!message) return;

  msgs.innerHTML += `<div class="cb-msg cb-usr">${escText(message)}</div>`;
  msgs.scrollTop = msgs.scrollHeight;
  setTimeout(() => {
    msgs.innerHTML += `<div class="cb-msg cb-bot">${escText(previewChatReply(message))}</div>`;
    msgs.scrollTop = msgs.scrollHeight;
  }, 420);
};

window.cbSendInput = function () {
  const { inp } = getPreviewChatEls();
  if (!inp) return;
  const msg = inp.value.trim();
  if (!msg) return;
  inp.value = '';
  window.cbSend(msg);
};

/* ── Sidebar tab switching ── */
function switchBuilderTab(tabId, btn) {
  document.querySelectorAll('.b-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.b-panel').forEach(p => p.classList.add('hidden'));
  if(btn) { btn.classList.add('active'); }
  else {
    const found = document.querySelector(`[data-tab="${tabId}"]`);
    if(found) found.classList.add('active');
  }
  const panel = document.getElementById(`panel-${tabId}`);
  if(panel) panel.classList.remove('hidden');
  if(tabId === 'content') renderContentTabs();
}

/* ── Export ── */
function openExport() {
  document.getElementById('export-modal').classList.add('open');
  setExportMode('github', document.getElementById('em-github'));
}
function closeExport() {
  document.getElementById('export-modal').classList.remove('open');
}
function setExportMode(mode, btn) {
  ['github','code','download'].forEach(m => {
    const el = document.getElementById('export-'+m);
    if(el) el.style.display = 'none';
    const b = document.getElementById('em-'+m);
    if(b) b.className = 'btn btn-ghost btn-sm';
  });
  const el = document.getElementById('export-'+mode);
  if(el) el.style.display = '';
  if(btn) btn.className = 'btn btn-primary btn-sm';
  if(mode === 'code') {
    const cp = document.getElementById('code-preview-content');
    if(cp) {
      const full = generatePortfolioShell(APP.state);
      cp.textContent = full.substring(0, 1800) + '\n\n... [full code via Download button]';
    }
  }
}

function copyCode() {
  const code = generatePortfolioShell(APP.state);
  navigator.clipboard.writeText(code).then(() => {
    const btn = document.getElementById('copy-btn');
    if(btn) { btn.textContent = 'Copied'; setTimeout(() => btn.textContent = 'Copy to Clipboard', 2200); }
  });
}

function downloadPortfolio() {
  const code = generatePortfolioShell(APP.state);
  const name = (APP.state.data.hero?.name || 'portfolio').toLowerCase().replace(/\s+/g,'-');
  const blob = new Blob([code], {type:'text/html'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${name}.html`;
  a.click();
  closeExport();
}
