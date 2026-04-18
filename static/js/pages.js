/* ════════ PAGES.JS — full-stack edition ════════ */

const QUICKFOLIO_CONTACT_EMAIL = 'Ks6911843@gmail.com';

function getQuickFolioMailHref(subject = 'QuickFolio Inquiry') {
  return `mailto:${QUICKFOLIO_CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}

const SACHIN_PORTFOLIO_PROFILE = {
  intro: "Hi all 👋 I'm SACHIN.",
  headline: 'Turning logic into digital poetry.',
  role: 'Future Data Scientist 📊',
  resume: 'https://sachin8147-star.github.io/Portfolio-website/resume.pdf',
  location: 'Remote / Earth',
  availability: 'Available for new opportunities',
  about: [
    'I am a Computer Science student preparing for internships and building a strong foundation in programming and software development.',
    'Currently working as a Python Development Intern at Cyber Defence Zone, building automation scripts and practical tools.',
    'I stay focused on hands-on projects, clean implementation quality, and continuous growth through real-world problem solving.'
  ],
  stats: ['03+ Months Experience', '1k+ Lines of Code', 'Internship Ready'],
  skills: [
    {
      group: 'Programming',
      note: 'Building efficient logic in C++ and versatile scripts in Python.',
      items: ['C++', 'Python', 'HTML', 'CSS']
    },
    {
      group: 'Visual Design',
      note: 'Comfortable with vector illustration, visual polish, and UI composition.',
      items: ['Photoshop', 'CorelDRAW', 'UI/UX']
    },
    {
      group: 'Workflow',
      note: 'Version control and document automation for smoother collaboration.',
      items: ['Git', 'GitHub', 'MS-Office']
    },
    {
      group: 'Frontend',
      note: 'Building responsive interfaces and practical interaction flows.',
      items: ['React', 'JavaScript', 'Tailwind', 'HTML/CSS']
    }
  ],
  projects: [
    {
      title: 'SMS Spam Detector',
      desc: 'ML pipeline using Scikit-Learn from preprocessing to model training and evaluation.',
      cover: 'https://opengraph.githubassets.com/1/Sachin8147-star/SMS-Spam-Detecter',
      tech: ['Python', 'Pandas', 'Seaborn', 'Scikit-Learn'],
      links: [
        { label: 'GitHub', type: 'github', href: 'https://github.com/Sachin8147-star/SMS-Spam-Detecter.git' }
      ]
    },
    {
      title: 'Python Chatbot',
      desc: 'NLP chatbot using NLTK to process and respond to user input intelligently.',
      cover: 'https://opengraph.githubassets.com/1/Sachin8147-star/chatbot',
      tech: ['Python', 'NLTK', 'NLP'],
      links: [
        { label: 'GitHub', type: 'github', href: 'https://github.com/Sachin8147-star/chatbot.git' }
      ]
    },
    {
      title: 'Weather Forecast',
      desc: 'Python program using OpenWeather API with clear weather data visualizations.',
      cover: 'https://opengraph.githubassets.com/1/Sachin8147-star/weather-forecast',
      tech: ['Python', 'OpenWeather API', 'Data Visualization'],
      links: [
        { label: 'GitHub', type: 'github', href: 'https://github.com/Sachin8147-star/weather-forecast.git' }
      ]
    },
    {
      title: 'Calculator',
      desc: 'Clean and responsive calculator with smooth UI built using vanilla JavaScript.',
      cover: 'https://opengraph.githubassets.com/1/Sachin8147-star/calculator',
      tech: ['HTML', 'CSS', 'JavaScript'],
      links: [
        { label: 'GitHub', type: 'github', href: 'https://github.com/Sachin8147-star/calculator.git' },
        { label: 'Live', type: 'demo', href: 'https://sachin8147-star.github.io/calculator/' }
      ]
    },
    {
      title: 'Sales Report Project',
      desc: 'Reads CSV sales data, performs analysis, and auto-generates a formatted PDF report.',
      cover: 'https://opengraph.githubassets.com/1/Sachin8147-star/sales-report-project-python',
      tech: ['Python', 'CSV', 'PDF Automation'],
      links: [
        { label: 'GitHub', type: 'github', href: 'https://github.com/Sachin8147-star/sales-report-project-python.git' }
      ]
    },
    {
      title: 'Stone Paper Scissors',
      desc: 'Classic interactive game with score tracking and polished gameplay flow.',
      cover: 'https://opengraph.githubassets.com/1/Sachin8147-star/stone-paper-scissors-game',
      tech: ['HTML', 'CSS', 'JavaScript'],
      links: [
        { label: 'GitHub', type: 'github', href: 'https://github.com/Sachin8147-star/stone-paper-scissors-game.git' },
        { label: 'Live', type: 'demo', href: 'https://sachin8147-star.github.io/stone-paper-scissors-game/' }
      ]
    },
    {
      title: 'Portfolio Website',
      desc: 'Personal portfolio built with HTML, CSS, JavaScript, and Tailwind with responsive layout.',
      cover: 'https://opengraph.githubassets.com/1/Sachin8147-star/Portfolio-website',
      tech: ['HTML', 'CSS', 'JavaScript', 'Tailwind'],
      links: [
        { label: 'Live', type: 'demo', href: 'https://sachin8147-star.github.io/Portfolio-website/' }
      ]
    }
  ],
  experience: [
    {
      role: 'Python Development Intern',
      company: 'Cyber Defence Zone — Remote, IN',
      period: 'Dec 2025 — Present',
      bullets: [
        'Developed Python scripts for automation and problem-solving tasks.',
        'Worked with core Python concepts: functions, loops, and data structures.',
        'Built utilities related to cybersecurity workflows and debugging quality.'
      ]
    },
    {
      role: 'Frontend Developer',
      company: 'Learning Online — Delhi, IN',
      period: 'Jan 2026 — Present',
      bullets: [
        'Built Stone Paper Scissors game projects and a clean calculator UI.',
        'Developed portfolio-focused frontend flows with HTML, CSS, and JavaScript.'
      ]
    }
  ],
  education: ['Bachelor of Computer Science — Currently Pursuing'],
  links: {
    github: 'https://github.com/Sachin8147-star',
    linkedin: 'https://linkedin.com/in/sachin-98573a332',
    email: 'mailto:ks6911843@gmail.com',
    instagram: 'https://www.instagram.com/_sachin.sachin_0000',
    x: 'https://www.x.com/TechGam54440224',
    portfolio: 'https://sachin8147-star.github.io/Portfolio-website/',
    projects: 'https://sachin8147-star.github.io/Portfolio-website/projects.html'
  }
};

let _sachinShowcaseCleanup = null;

function getBrandIconSvg(brand) {
  const icons = {
    github: '<svg class="brand-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 .5A11.5 11.5 0 0 0 .5 12.18c0 5.12 3.29 9.46 7.86 11 .58.11.79-.25.79-.56 0-.27-.01-1-.02-1.96-3.2.7-3.88-1.55-3.88-1.55-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.35.95.1-.74.4-1.25.73-1.54-2.56-.29-5.25-1.28-5.25-5.69 0-1.25.45-2.29 1.18-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18A11 11 0 0 1 12 5.76c.98.01 1.97.13 2.89.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.18 1.84 1.18 3.09 0 4.42-2.69 5.39-5.26 5.68.41.36.78 1.06.78 2.13 0 1.54-.01 2.78-.01 3.15 0 .31.21.67.8.56a11.5 11.5 0 0 0 7.84-11A11.5 11.5 0 0 0 12 .5Z"/></svg>',
    linkedin: '<svg class="brand-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M22.23 0H1.77A1.77 1.77 0 0 0 0 1.77v20.46C0 23.2.79 24 1.77 24h20.46A1.77 1.77 0 0 0 24 22.23V1.77A1.77 1.77 0 0 0 22.23 0Zm-14.2 20.45H4.48V9h3.55v11.46ZM6.26 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12Zm14.2 13.02h-3.55v-5.57c0-1.33-.03-3.05-1.86-3.05-1.86 0-2.14 1.45-2.14 2.95v5.67H9.35V9h3.41v1.56h.05c.47-.9 1.64-1.86 3.37-1.86 3.61 0 4.28 2.38 4.28 5.46v6.29Z"/></svg>',
    mail: '<svg class="brand-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M3 5h18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm0 2v.2l9 5.4 9-5.4V7H3Zm18 10V9.53l-8.49 5.09a1 1 0 0 1-1.02 0L3 9.53V17h18Z"/></svg>',
    external: '<svg class="brand-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M14 3h7v7h-2V6.41l-8.29 8.3-1.42-1.42 8.3-8.29H14V3ZM5 5h6v2H7v10h10v-4h2v6H5V5Z"/></svg>'
  };
  return icons[brand] || icons.external;
}

function getProjectCardMediaBackground(project) {
  const titleSeed = String(project?.title || 'Project');
  const baseHue = [...titleSeed].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360;
  const accentHue = (baseHue + 80) % 360;
  const toneLayer = `linear-gradient(138deg, hsla(${baseHue}, 88%, 48%, .46), hsla(${accentHue}, 88%, 44%, .46))`;
  const fallbackSeed = titleSeed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'project';
  const fallbackCover = `https://picsum.photos/seed/${encodeURIComponent(fallbackSeed)}/1200/675`;
  const cover = typeof project?.cover === 'string' ? project.cover.trim() : '';

  if (!cover) {
    return `linear-gradient(180deg, rgba(7,11,24,.22), rgba(7,11,24,.74)), ${toneLayer}, url('${fallbackCover}')`;
  }

  const safeCover = cover.replace(/'/g, '%27');
  return `linear-gradient(180deg, rgba(7,11,24,.22), rgba(7,11,24,.74)), ${toneLayer}, url('${safeCover}'), url('${fallbackCover}')`;
}

function getProjectPrimaryHref(project) {
  if (!project || !Array.isArray(project.links) || !project.links.length) {
    return SACHIN_PORTFOLIO_PROFILE.links.projects;
  }

  const preferred = project.links.find((link) => link.type === 'demo') || project.links[0];
  return preferred?.href || SACHIN_PORTFOLIO_PROFILE.links.projects;
}

function renderSachinSpotlightSection(context = 'landing') {
  const profile = SACHIN_PORTFOLIO_PROFILE;
  const embedded = context === 'about-embedded';
  const eyeLabel = embedded ? 'About Developer' : 'Developer Spotlight';

  const block = `
    <div class="sachin-spotlight-head">
      <div class="sec-eye">${eyeLabel}</div>
      <h2 class="sec-h2 font-h">${profile.intro}<br><span class="grad-text">${profile.headline}</span></h2>
      <p class="sec-sub tm" style="max-width:760px">${profile.about[0]} ${profile.about[1]}</p>
    </div>

    <div class="sachin-spotlight-grid">
      <article class="card card-h card-line sachin-prism-card">
        <div class="sachin-profile-top">
          <div class="sachin-role-tag">${profile.role}</div>
          <p class="sachin-bio-line">${profile.about[2]}</p>
          <div class="sachin-mini-meta">📍 ${profile.location} · 🟢 ${profile.availability}</div>
        </div>
        <div class="sachin-stat-row">
          ${profile.stats.map((item) => `<span class="sachin-stat-pill">${item}</span>`).join('')}
        </div>
        <div class="sachin-contact-row">
          <a class="sachin-contact-link" href="${profile.links.github}" target="_blank" rel="noopener" aria-label="Sachin GitHub">${getBrandIconSvg('github')}<span>GitHub</span></a>
          <a class="sachin-contact-link" href="${profile.links.linkedin}" target="_blank" rel="noopener" aria-label="Sachin LinkedIn">${getBrandIconSvg('linkedin')}<span>LinkedIn</span></a>
          <a class="sachin-contact-link" href="${profile.links.email}" aria-label="Sachin Email">${getBrandIconSvg('mail')}<span>Email</span></a>
          <a class="sachin-contact-link" href="${profile.resume}" target="_blank" rel="noopener" aria-label="Sachin Resume">${getBrandIconSvg('external')}<span>Resume</span></a>
        </div>
      </article>

      <article class="card card-h card-line sachin-prism-card">
        <div class="sachin-skill-grid">
          ${profile.skills.map((group) => `
            <div class="sachin-skill-group">
              <h3 class="sachin-skill-title">${group.group}</h3>
              <div class="sachin-skill-chips">${group.items.map((item) => `<span class="sachin-skill-chip">${item}</span>`).join('')}</div>
              <p class="sachin-skill-note">${group.note}</p>
            </div>
          `).join('')}
        </div>
      </article>
    </div>

    <div class="sachin-project-grid">
      ${profile.projects.map((project) => `
        <article class="card card-h card-line sachin-project-card">
          <a class="sachin-project-media" href="${getProjectPrimaryHref(project)}" target="_blank" rel="noopener" aria-label="${project.title} project preview" style="background-image:${getProjectCardMediaBackground(project)}">
            <span class="sachin-project-media-badge">Preview</span>
          </a>
          <h3 class="sachin-project-title font-h">${project.title}</h3>
          <p class="sachin-project-desc">${project.desc}</p>
          <div class="sachin-project-tech">${project.tech.map((tech) => `<span class="tag tag-c">${tech}</span>`).join('')}</div>
          <div class="sachin-project-links">
            ${project.links.map((link) => `<a class="btn btn-ghost btn-sm" href="${link.href}" target="_blank" rel="noopener">${link.type === 'github' ? getBrandIconSvg('github') : getBrandIconSvg('external')}<span>${link.label}</span></a>`).join('')}
          </div>
        </article>
      `).join('')}

      <article class="card card-h card-line sachin-project-card">
        <h3 class="sachin-project-title font-h">Experience + Education</h3>
        <div class="sachin-exp-list">
          ${profile.experience.map((exp) => `
            <div class="sachin-exp-item">
              <div class="sachin-exp-role">${exp.role}</div>
              <div class="sachin-exp-meta">${exp.company} · ${exp.period}</div>
              <ul class="sachin-exp-bullets">${exp.bullets.map((item) => `<li>${item}</li>`).join('')}</ul>
            </div>
          `).join('')}
          <div class="sachin-edu-wrap">${profile.education.map((edu) => `<div class="sachin-edu-item">🎓 ${edu}</div>`).join('')}</div>
        </div>
        <div class="sachin-project-links" style="margin-top:10px">
          <a class="btn btn-outline btn-sm" href="${profile.links.projects}" target="_blank" rel="noopener">${getBrandIconSvg('external')}<span>View All Projects</span></a>
          <a class="btn btn-primary btn-sm" href="${profile.links.portfolio}" target="_blank" rel="noopener">${getBrandIconSvg('external')}<span>Open Live Portfolio</span></a>
        </div>
      </article>
    </div>
  `;

  if (embedded) {
    return `<div class="sachin-spotlight-embed">${block}</div>`;
  }

  return `
  <section class="sachin-spotlight-sec">
    <div class="wrap">${block}</div>
  </section>`;
}

function initSachinShowcaseMotion() {
  if (typeof _sachinShowcaseCleanup === 'function') {
    _sachinShowcaseCleanup();
  }
  _sachinShowcaseCleanup = null;

  const cards = [...document.querySelectorAll('.sachin-prism-card')];
  if (!cards.length) return;

  const prefersReduced = document.body.classList.contains('perf-mode')
    || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  if (prefersReduced) {
    cards.forEach((card) => {
      card.classList.remove('is-motion');
      card.style.removeProperty('--tilt-x');
      card.style.removeProperty('--tilt-y');
      card.style.removeProperty('--glow-x');
      card.style.removeProperty('--glow-y');
    });
    return;
  }

  const cleanupList = [];

  cards.forEach((card) => {
    card.classList.add('is-motion');

    const onMove = (event) => {
      const rect = card.getBoundingClientRect();
      const nx = ((event.clientX - rect.left) / Math.max(rect.width, 1)) - 0.5;
      const ny = ((event.clientY - rect.top) / Math.max(rect.height, 1)) - 0.5;

      card.style.setProperty('--tilt-x', `${(nx * 9).toFixed(2)}deg`);
      card.style.setProperty('--tilt-y', `${(ny * -9).toFixed(2)}deg`);
      card.style.setProperty('--glow-x', `${((nx + 0.5) * 100).toFixed(2)}%`);
      card.style.setProperty('--glow-y', `${((ny + 0.5) * 100).toFixed(2)}%`);
    };

    const onLeave = () => {
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
      card.style.setProperty('--glow-x', '50%');
      card.style.setProperty('--glow-y', '50%');
    };

    card.addEventListener('pointermove', onMove, { passive: true });
    card.addEventListener('pointerleave', onLeave);
    card.addEventListener('pointerup', onLeave);
    onLeave();

    cleanupList.push(() => {
      card.removeEventListener('pointermove', onMove);
      card.removeEventListener('pointerleave', onLeave);
      card.removeEventListener('pointerup', onLeave);
      card.classList.remove('is-motion');
      card.style.removeProperty('--tilt-x');
      card.style.removeProperty('--tilt-y');
      card.style.removeProperty('--glow-x');
      card.style.removeProperty('--glow-y');
    });
  });

  _sachinShowcaseCleanup = () => {
    cleanupList.forEach((fn) => fn());
  };
}

function renderDirectMailSection(options = {}) {
  const eyebrow = options.eyebrow || 'Direct Mail';
  const title = options.title || 'Prefer email? Reach us directly.';
  const description = options.description || 'Send your question or collaboration request directly to our inbox.';
  const subject = options.subject || 'QuickFolio Inquiry';

  return `
  <section class="mail-direct-sec" style="padding:clamp(44px,7vw,68px) 0">
    <div class="wrap-sm">
      <div class="card card-h card-line tc" style="padding:clamp(22px,5vw,34px);border-color:rgba(0,229,255,.26);background:linear-gradient(135deg,rgba(0,229,255,.08),rgba(180,79,255,.06))">
        <div class="sec-eye" style="justify-content:center">${eyebrow}</div>
        <h2 class="sec-h2 font-h" style="font-size:clamp(1.45rem,3.5vw,2.2rem);margin-bottom:10px">${title}</h2>
        <p class="sec-sub tm" style="margin:0 auto 22px">${description}</p>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
          <a href="${getQuickFolioMailHref(subject)}" class="btn btn-primary btn-lg">✉ Mail QuickFolio</a>
          <a href="mailto:${QUICKFOLIO_CONTACT_EMAIL}" class="btn btn-ghost btn-lg">${QUICKFOLIO_CONTACT_EMAIL}</a>
        </div>
      </div>
    </div>
  </section>`;
}

// ── LANDING ──
function renderLanding() {
  const pricingSection = renderPricingSection('landing');
  return `
  <section class="hero home-hero-2026 cinematic-hero" style="padding-top:var(--nav-h)">
    <div class="hero-cinematic-layer" aria-hidden="true">
      <canvas id="hero-canvas" class="hero-canvas"></canvas>
      <div class="hero-vignette"></div>
      <div class="hero-noise"></div>
      <div class="hero-light hero-light-a hero-parallax-layer" data-depth="-12"></div>
      <div class="hero-light hero-light-b hero-parallax-layer" data-depth="9"></div>
    </div>
    <div class="hero-grid hero-parallax-layer" data-depth="-4"></div>
    <div class="blob hero-parallax-layer" data-depth="-18" style="top:7%;left:4%"></div>
    <div class="blob hero-parallax-layer" data-depth="16" style="bottom:4%;right:3%;animation-delay:-4s"></div>
    <div class="hero-orb hero-orb-1 hero-parallax-layer" data-depth="-24"></div>
    <div class="hero-orb hero-orb-2 hero-parallax-layer" data-depth="24"></div>
    <div class="hero-content-wrap hero-parallax-layer" data-depth="10">
    <div class="hero-content">
      <div class="hero-eye">
        <div style="width:7px;height:7px;border-radius:50%;background:#22c55e;animation:pulse-dot 2s infinite"></div>
        2026 Creator Stack
      </div>
      <h1 class="hero-h1 font-h hero-title-split">
        <span class="hero-line">
          <span class="hero-word">Your</span>
          <span class="hero-word">Portfolio,</span>
          <span class="hero-word">but</span>
        </span>
        <span class="hero-line hero-line-accent">
          <span class="hero-word grad-text">Productized</span>
          <span class="hero-word grad-text">for</span>
          <span class="hero-word grad-text">Hiring</span>
        </span>
      </h1>
      <p class="hero-sub">QuickFolio helps developers ship portfolio sites that convert viewers into interviews, leads, and paid work. Build once, adapt for every role, and track what actually gets attention.</p>
      <div class="hero-actions">
        <span class="hero-btn-wrap"><a href="/signup" class="btn btn-primary btn-xl anim-glow">⚡ Start Free</a></span>
        <span class="hero-btn-wrap"><a href="/templates" class="btn btn-ghost btn-xl">🧩 Explore Templates</a></span>
      </div>
      <div class="hero-stats">
        <div class="hs"><span class="hs-n" data-count="12400">0</span><span class="hs-l">Portfolios Published</span></div>
        <div class="hs"><span class="hs-n" data-count="460">0</span><span class="hs-l">Avg Weekly Leads</span></div>
        <div class="hs"><span class="hs-n" data-count="87">0</span><span class="hs-l">Recruiter Revisit Rate</span></div>
        <div class="hs"><span class="hs-n" data-count="12">0</span><span class="hs-l">Role-fit Signals</span></div>
      </div>
      <div class="home-signal-row">
        ${['Resume Tailoring', 'Recruiter Mode', 'Live Analytics', 'One-click Publish', 'AI Chatbot'].map((chip) => `<span class="home-signal-chip">${chip}</span>`).join('')}
      </div>
      <p style="margin-top:12px;color:var(--muted2);font-size:.72rem;letter-spacing:.2px;text-align:center">Illustrative demo metrics are shown in this preview. Live values depend on real account activity.</p>
    </div>
    </div>
  </section>

  <section class="home-proof-strip">
    <div class="wrap home-proof-grid">
      <div class="home-proof-item"><span>Trusted by</span><strong>12k+ developers</strong></div>
      <div class="home-proof-item"><span>Used in</span><strong>45+ countries</strong></div>
      <div class="home-proof-item"><span>Built with</span><strong>Flask + SQLite + Vanilla JS</strong></div>
      <div class="home-proof-item"><span>Fast publish</span><strong>under 5 minutes</strong></div>
    </div>
  </section>

  <section class="features-sec home-feature-stack">
    <div class="wrap">
      <div style="max-width:620px;margin-bottom:0">
        <div class="sec-eye">Why Teams Choose QuickFolio</div>
        <h2 class="sec-h2 font-h">Designed for <span class="grad-text">conversion, not decoration</span></h2>
        <p class="sec-sub tm">Modern 2026 portfolio standards are about proof, positioning, and clarity. Every feature below is optimized for that.</p>
      </div>
      <div class="grid-auto mt32">
        ${[
          ['🎯','Role-fit Tailoring','Generate JD-aligned summaries and skill-gap insights before interviews.'],
          ['🧲','Recruiter Mode','Condensed scan layout for fast hiring review flows.'],
          ['📊','Performance Analytics','Track views, message intent, and content hotspots.'],
          ['⚙️','Full-stack Persistence','Your data is stored in real backend tables, not just browser memory.'],
          ['🧩','Template Intelligence','Start from proven layouts by style and audience.'],
          ['🚀','Deployment Flexibility','Use hosted publishing or export to your own stack.']
        ].map(([ico,title,desc]) => `
          <div class="card card-h card-line home-feature-card">
            <div class="feat-icon" style="background:rgba(0,229,255,.08)">${ico}</div>
            <div class="feat-title font-h">${title}</div>
            <div class="feat-desc">${desc}</div>
          </div>
        `).join('')}
      </div>
    </div>
  </section>

  <section class="workflow-sec">
    <div class="wrap">
      <div class="workflow-head">
        <div class="sec-eye">Execution Flow</div>
        <h2 class="sec-h2 font-h">A faster system for <span class="grad-text">real hiring outcomes</span></h2>
        <p class="sec-sub tm">Each stage is designed to cut friction, tighten positioning, and increase qualified replies.</p>
      </div>
      <div class="workflow-grid">
        ${[
          ['01', 'Build Positioning', 'Shape hero, proof blocks, and project narratives with conversion-first templates.'],
          ['02', 'Tune For Roles', 'Generate role-fit resume variants and close skill-gap signals before applying.'],
          ['03', 'Publish + Share', 'Launch with trackable links and social copy designed for higher click-through.'],
          ['04', 'Optimize Weekly', 'Use analytics and contact trends to iterate content where attention drops.']
        ].map(([step, title, desc]) => `
          <article class="workflow-card card card-h card-line">
            <div class="workflow-step">${step}</div>
            <h3 class="workflow-title font-h">${title}</h3>
            <p class="workflow-desc">${desc}</p>
          </article>
        `).join('')}
      </div>
    </div>
  </section>

  <section class="growth-lab-sec">
    <div class="wrap growth-lab-grid">
      <div>
        <div class="sec-eye">Growth Lab</div>
        <h2 class="sec-h2 font-h">Estimate the upside of <span class="grad-text">better portfolio conversion</span></h2>
        <p class="sec-sub tm">Inspired by performance optimization benchmarks, this simulator helps you model how stronger clarity and faster UX can lift inbound leads.</p>
        <div class="growth-lab-kpis">
          <div class="growth-kpi"><span id="growth-extra-monthly">+0</span><small>extra leads / month</small></div>
          <div class="growth-kpi"><span id="growth-extra-annual">+0</span><small>extra leads / year</small></div>
        </div>
      </div>
      <div class="growth-lab-card card">
        <div class="growth-lab-row">
          <label class="inp-label" for="growth-visitors">Monthly Portfolio Visitors</label>
          <div class="growth-lab-val" id="growth-visitors-val">8,000</div>
        </div>
        <input id="growth-visitors" class="inp growth-range" type="range" min="500" max="60000" step="250" value="8000" oninput="updateGrowthLab()">

        <div class="growth-lab-row" style="margin-top:18px">
          <label class="inp-label" for="growth-uplift">Conversion Uplift from UX + Speed</label>
          <div class="growth-lab-val" id="growth-uplift-val">8%</div>
        </div>
        <input id="growth-uplift" class="inp growth-range" type="range" min="2" max="35" step="1" value="8" oninput="updateGrowthLab()">

        <p class="growth-lab-foot">Model assumptions use a baseline lead conversion and estimate the incremental gain from better hierarchy, performance, and recruiter-focused content.</p>
      </div>
    </div>
  </section>

  <section class="themes-sec">
    <div class="wrap">
      <div class="tc">
        <div class="sec-eye" style="justify-content:center">Templates + Themes</div>
        <h2 class="sec-h2 font-h">Start with a style,<br><span class="grad-text">finish with your own system</span></h2>
        <p class="sec-sub tm" style="margin:0 auto">Use curated looks as a baseline, then tune typography, spacing, and conversion blocks.</p>
      </div>
      <div class="theme-grid-show mt32" id="theme-showcase-grid"></div>
    </div>
  </section>

  ${pricingSection}

  <section class="testi-sec">
    <div class="wrap">
      <div class="tc">
        <div class="sec-eye" style="justify-content:center">Results</div>
        <h2 class="sec-h2 font-h">Built for <span class="grad-text">career outcomes</span></h2>
      </div>
      <div class="testi-grid">
        ${[
          {s:'Rahul',n:'Rahul Sharma',r:'SDE @ Google',t:'Recruiters mentioned my project storytelling format directly in interviews. That never happened with my old static site.'},
          {s:'Priya',n:'Priya Patel',r:'Frontend Dev @ Razorpay',t:'The Pro analytics and recruiter mode made my portfolio feel like a product, not just a page.'},
          {s:'Arjun',n:'Arjun Mehta',r:'Freelance Full-Stack Dev',t:'Switching to role-tailored resume + portfolio flow increased warm inbound messages in a week.'},
        ].map(t=>`
        <div class="card card-h testi-card">
          <div class="testi-stars">⭐⭐⭐⭐⭐</div>
          <p class="testi-text">"${t.t}"</p>
          <div class="testi-author">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${t.s}" class="testi-av" alt="${t.n}">
            <div><div class="testi-name">${t.n}</div><div class="testi-role">${t.r}</div></div>
          </div>
        </div>`).join('')}
      </div>
    </div>
  </section>

  <section class="cta-sec">
    <div class="cta-bg"></div>
    <div class="wrap-sm" style="position:relative;z-index:1">
      <div class="hero-eye" style="justify-content:center;margin-bottom:20px">No card required to start</div>
      <h2 class="sec-h2 font-h tc" style="font-size:clamp(1.9rem,4vw,3rem)">Turn your work into<br><span class="grad-text">clear hiring signals</span></h2>
      <p class="sec-sub tm tc" style="margin:14px auto 32px">Launch free, then upgrade only when your inbound starts growing.</p>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
        <a href="/signup" class="btn btn-primary btn-xl anim-glow">⚡ Build My Portfolio</a>
        <a href="/pricing" class="btn btn-ghost btn-xl">💎 See Full Pricing</a>
      </div>
    </div>
  </section>

  ${renderDirectMailSection({
    title: 'Need help from QuickFolio?',
    description: 'Email us directly and get support, collaboration details, or product guidance quickly.',
    subject: 'QuickFolio Website Inquiry'
  })}

  ${renderFooter()}`;
}

// ── DASHBOARD ──
async function renderDashboard(user) {
  const firstName = (user?.name || 'Developer').split(' ')[0];
  const planLabel = String(user?.plan || 'free').toUpperCase();
  return `
  <div class="dash-layout" style="padding-top:var(--nav-h)">
    <aside class="dash-side">
      <div style="padding:16px 8px 20px">
        <div style="width:48px;height:48px;border-radius:50%;background:var(--grad);display:flex;align-items:center;justify-content:center;font-size:1.2rem;font-weight:800;color:#000;margin-bottom:10px">${(user.name||'?')[0].toUpperCase()}</div>
        <div style="font-weight:700;font-size:.9rem">${user.name}</div>
        <div style="color:var(--muted);font-size:.73rem">${user.email}</div>
        <div style="margin-top:6px;display:flex;align-items:center;gap:6px;flex-wrap:wrap">
          <span class="tag tag-c">${planLabel}</span>
          <span class="pill-live">● ${firstName} Workspace</span>
        </div>
      </div>
      <div class="dash-nav-h">Workspace</div>
      <button class="dash-nav-a active" onclick="showDashTab('overview',this)"><span class="dash-nav-ico">📊</span> Overview</button>
      <button class="dash-nav-a" onclick="showDashTab('analytics',this)"><span class="dash-nav-ico">📈</span> Analytics</button>
      <button class="dash-nav-a" onclick="showDashTab('contacts',this)"><span class="dash-nav-ico">📬</span> Contacts <span id="unread-badge" style="display:none;background:var(--accent);color:#000;border-radius:10px;padding:1px 6px;font-size:.65rem;font-weight:800;margin-left:auto">${user.unread_contacts||0}</span></button>
      <div class="dash-nav-h">Portfolio</div>
      <button class="dash-nav-a" onclick="window.location.href='/builder'"><span class="dash-nav-ico">⚡</span> Builder</button>
      <button class="dash-nav-a" onclick="window.location.href='/resume-editor'"><span class="dash-nav-ico">📄</span> Resume Editor</button>
      <button class="dash-nav-a" onclick="openPublicPortfolio()"><span class="dash-nav-ico">👁</span> View Live</button>
      <button class="dash-nav-a" onclick="window.location.href='/templates'"><span class="dash-nav-ico">🧩</span> Templates</button>
      <div class="dash-nav-h">Account</div>
      <button class="dash-nav-a" onclick="window.location.href='/billing'"><span class="dash-nav-ico">💳</span> Billing</button>
      <button class="dash-nav-a" onclick="window.location.href='/pricing'"><span class="dash-nav-ico">💎</span> Plans</button>
      <button class="dash-nav-a" onclick="showDashTab('settings',this)"><span class="dash-nav-ico">⚙️</span> Settings</button>
      <button class="dash-nav-a" onclick="Auth.logout()" style="color:#ef4444"><span class="dash-nav-ico">🚪</span> Logout</button>
    </aside>
    <div class="dash-content">
      <div id="dash-tab-content"></div>
    </div>
  </div>`;
}

function renderDashOverview(user, analytics, billing) {
  const a = analytics || {};
  const subscription = billing?.subscription || null;
  const plan = subscription?.plan || null;
  const planName = plan?.name || String(user?.plan || 'free').toUpperCase();
  const renewalLabel = subscription?.current_period_end ? formatDate(subscription.current_period_end) : 'No renewal date';
  const renewalState = subscription?.cancel_at_period_end
    ? '<span style="color:#fb923c">Auto-renew off</span>'
    : '<span style="color:var(--a3)">Auto-renew on</span>';
  const topSignals = (plan?.features || []).slice(0, 3);

  return `
  <div class="dash-overview-2026">
    <div class="dash-hello font-h">Good ${getGreeting()}, ${(user.name||'Developer').split(' ')[0]}! 👋</div>
    <div class="dash-sub">Your portfolio is ${a.is_published ? `<span style="color:var(--a3)">✅ live at</span> <a href="${a.portfolio_url}" target="_blank" style="color:var(--accent)">${window.location.origin}${a.portfolio_url}</a>` : '<span style="color:#fb923c">📝 draft — publish to go live</span>'}</div>

    <div class="stat-cards dash-kpi-grid">
      ${[
        ['👁','Total Views', a.total_views||0, 'People viewed your portfolio'],
        ['📬','Messages', a.total_contacts||0, 'Received via contact form'],
        ['💎','Membership', planName, `Renewal: ${renewalLabel}`],
        ['⚡','Portfolio Status', a.is_published?'Published':'Draft', a.is_published?'Visible to the world':'Not yet visible'],
      ].map(([ico,lbl,val,hint])=>`
      <div class="stat-card">
        <div class="stat-ico">${ico}</div>
        <span class="stat-num">${val}</span>
        <div class="stat-lbl">${lbl}</div>
        <div style="color:var(--muted2);font-size:.7rem;margin-top:4px">${hint}</div>
      </div>`).join('')}
      <div class="stat-card" style="border-color:rgba(0,229,255,.2);background:linear-gradient(135deg,rgba(0,229,255,.04),rgba(180,79,255,.04));cursor:pointer" onclick="window.location.href='/builder'">
        <div class="stat-ico">🔧</div>
        <span class="stat-num" style="font-size:1.2rem">Edit</span>
        <div class="stat-lbl">Open Builder</div>
        <div style="color:var(--accent);font-size:.7rem;margin-top:4px">Customize your portfolio →</div>
      </div>
    </div>

    <div class="chart-wrap" style="border-color:rgba(0,229,255,.22);background:linear-gradient(135deg,rgba(0,229,255,.06),rgba(180,79,255,.05));margin-bottom:20px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap">
        <div>
          <div style="font-size:.76rem;color:var(--muted);text-transform:uppercase;letter-spacing:1px;font-weight:800">Membership Health</div>
          <div style="font-family:var(--fh);font-size:1.15rem;font-weight:700;margin:3px 0 4px">${planName} • ${subscription?.billing_cycle || 'monthly'}</div>
          <div style="font-size:.8rem;color:var(--muted)">Next renewal: ${renewalLabel} • ${renewalState}</div>
        </div>
        <a href="/billing" class="btn btn-primary btn-sm">💳 Open Billing</a>
      </div>
      <div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:12px">
        ${topSignals.length ? topSignals.map((f) => `<span class="tag tag-c" style="font-size:.67rem">${f}</span>`).join('') : '<span class="tag tag-c" style="font-size:.67rem">Upgrade to unlock premium features</span>'}
      </div>
    </div>

    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:24px">
      <button class="btn btn-primary" onclick="window.location.href='/builder'">⚡ Edit Portfolio</button>
      <button class="btn btn-outline" id="pub-btn" onclick="togglePublish()">
        ${a.is_published ? '📤 Unpublish' : '🌐 Publish Portfolio'}
      </button>
      ${a.portfolio_url ? `<a href="${a.portfolio_url}" target="_blank" class="btn btn-ghost">👁 View Live</a>` : ''}
      <a href="/pricing" class="btn btn-ghost">💎 Compare Plans</a>
    </div>

    <div class="chart-wrap">
      <div class="chart-title">
        <span>📈 Portfolio Views (Last 7 days)</span>
        <span style="color:var(--muted);font-size:.75rem">${a.total_views||0} total</span>
      </div>
      <div class="chart-bars" id="views-chart">
        ${(a.views_chart||[]).map(d => {
          const maxViews = Math.max(...(a.views_chart||[]).map(x=>x.views), 1);
          const pct = Math.max((d.views/maxViews)*100, 2);
          return `<div class="chart-bar-wrap">
            <div class="chart-bar" data-val="${d.views}" style="height:${pct}%;background:var(--grad)" title="${d.views} views"></div>
            <div class="chart-lbl">${d.date.slice(5)}</div>
          </div>`;
        }).join('')}
      </div>
    </div>

    <div class="chart-wrap">
      <div class="chart-title"><span>📬 Recent Messages</span></div>
      ${(a.contacts||[]).length === 0 ?
        `<div style="text-align:center;padding:20px;color:var(--muted);font-size:.85rem">No messages yet. Publish your portfolio to start receiving inquiries!</div>` :
        `<div style="overflow-x:auto"><table class="contacts-table">
          <tr><th>From</th><th>Subject</th><th>Date</th><th>Status</th></tr>
          ${(a.contacts||[]).slice(0,5).map(c=>`
          <tr>
            <td><div style="font-weight:600;font-size:.82rem">${c.sender_name}</div><div style="color:var(--muted2);font-size:.7rem">${c.sender_email}</div></td>
            <td>${c.subject||c.message.slice(0,50)+'...'}</td>
            <td>${formatDate(c.created_at)}</td>
            <td>${c.is_read?'<span class="tag tag-g">Read</span>':'<span><span class="unread-dot"></span><span class="tag tag-c">New</span></span>'}</td>
          </tr>`).join('')}
        </table></div>`}
    </div>
  </div>`;
}

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
}

async function togglePublish() {
  const btn = document.getElementById('pub-btn');
  if (btn) btn.classList.add('btn-loading');
  const res = await API.post('/api/portfolio/publish');
  if (btn) btn.classList.remove('btn-loading');
  if (res.ok) {
    Toast.success(res.data.message);
    loadDashboard();
  } else {
    Toast.error(res.data.error || 'Failed to update');
  }
}

function openPublicPortfolio() {
  const portfolio = Auth.user?.portfolios?.[0];
  if (portfolio) window.open(`/p/${portfolio.slug}`, '_blank');
  else Toast.info('Publish your portfolio first!');
}

const QUICKFOLIO_PLANS = [
  {
    id: 'free',
    name: 'Free',
    description: 'Launch fast and validate your positioning.',
    monthly_inr: 0,
    yearly_inr: 0,
    badge: null,
    popular: false,
    features: ['Core builder', '3 themes', '5 sections', 'Public portfolio URL', 'Export HTML']
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Best for active job seekers and freelance devs.',
    monthly_inr: 299,
    yearly_inr: 2990,
    badge: 'Most Popular',
    popular: true,
    features: ['Everything in Free', 'All premium themes', 'Advanced analytics', 'Custom domain', 'Priority support']
  },
  {
    id: 'team',
    name: 'Team',
    description: 'For agencies, bootcamps, and hiring cohorts.',
    monthly_inr: 899,
    yearly_inr: 8990,
    badge: 'Scale',
    popular: false,
    features: ['Everything in Pro', 'Up to 10 members', 'Team templates', 'White-label support', 'SLA support']
  }
];

function getPricingCycle() {
  const raw = localStorage.getItem('quickfolio.pricing.cycle') || localStorage.getItem('QuickFolio.pricing.cycle');
  return raw === 'yearly' ? 'yearly' : 'monthly';
}

function setPricingCycle(cycle) {
  const normalized = cycle === 'yearly' ? 'yearly' : 'monthly';
  localStorage.setItem('quickfolio.pricing.cycle', normalized);
  refreshPricingWidgets();
}

function formatInr(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value || 0));
}

function getPlanAmount(plan, cycle) {
  if (!plan) return 0;
  return cycle === 'yearly' ? Number(plan.yearly_inr || 0) : Number(plan.monthly_inr || 0);
}

function getCurrentPlanId() {
  return String(Auth?.user?.plan || 'free').toLowerCase();
}

function getPlanCta(planId, currentPlanId) {
  if (!Auth?.user) {
    if (planId === 'free') return { label: 'Start Free', cls: 'btn-outline', disabled: false };
    return { label: `Choose ${planId.toUpperCase()}`, cls: planId === 'pro' ? 'btn-primary' : 'btn-ghost', disabled: false };
  }

  if (planId === currentPlanId && planId === 'free') {
    return { label: 'Current Plan', cls: 'btn-ghost', disabled: true };
  }
  if (planId === currentPlanId) {
    return { label: 'Manage in Billing', cls: 'btn-primary', disabled: false };
  }
  if (planId === 'free') {
    return { label: 'Downgrade to Free', cls: 'btn-outline', disabled: false };
  }
  return { label: `Upgrade to ${planId.toUpperCase()}`, cls: planId === 'pro' ? 'btn-primary' : 'btn-ghost', disabled: false };
}

function renderPricingCards(context) {
  const cycle = getPricingCycle();
  const currentPlanId = getCurrentPlanId();

  return QUICKFOLIO_PLANS.map((plan) => {
    const amount = getPlanAmount(plan, cycle);
    const cta = getPlanCta(plan.id, currentPlanId);
    const yearlyMonthlyEquivalent = cycle === 'yearly' && amount > 0 ? Math.round(amount / 12) : 0;

    return `
      <div class="price-card ${plan.popular ? 'pop' : ''}">
        <div class="price-head">
          ${plan.badge ? `<div class="price-badge">${plan.badge}</div><br>` : ''}
          <div class="price-name font-h">${plan.name}</div>
          <div class="price-amt">${formatInr(amount)} <span>${plan.id === 'free' ? '/ forever' : cycle === 'yearly' ? '/ year' : '/ month'}</span></div>
          <div style="color:var(--muted);font-size:.76rem;margin-top:2px">${plan.description}</div>
          ${cycle === 'yearly' && yearlyMonthlyEquivalent > 0 ? `<div style="margin-top:6px;font-size:.72rem;color:var(--a3)">≈ ${formatInr(yearlyMonthlyEquivalent)}/month effective</div>` : ''}
        </div>
        <div class="price-body">
          ${plan.features.map((feature) => `<div class="price-f"><span>✅</span>${feature}</div>`).join('')}
          <div class="mt24">
            <button class="btn ${cta.cls} w100" ${cta.disabled ? 'disabled' : ''} onclick="handlePlanSelection('${plan.id}', event, '${context}')">${cta.label}</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderPricingSection(context = 'pricing') {
  const cycle = getPricingCycle();
  return `
    <section class="pricing-sec pricing-sec-2026" data-pricing-context="${context}">
      <div class="wrap">
        <div class="tc">
          <div class="sec-eye" style="justify-content:center">Membership</div>
          <h2 class="sec-h2 font-h">Transparent pricing for <span class="grad-text">every growth stage</span></h2>
          <p class="sec-sub tm" style="margin:0 auto">Switch plans anytime. Yearly cycle includes automatic savings.</p>
          <p class="sec-sub tm" style="margin:8px auto 0;color:var(--a3);font-weight:700">Demo notice: prices shown in this section are for demo only.</p>
        </div>
        <div class="pricing-cycle-wrap">
          <button class="pricing-cycle-btn ${cycle === 'monthly' ? 'active' : ''}" onclick="setPricingCycle('monthly')">Monthly</button>
          <button class="pricing-cycle-btn ${cycle === 'yearly' ? 'active' : ''}" onclick="setPricingCycle('yearly')">Yearly <span>Save ~16%</span></button>
        </div>
        <div class="price-grid" data-pricing-cards="${context}">${renderPricingCards(context)}</div>
      </div>
    </section>
  `;
}

function refreshPricingWidgets() {
  const cycle = getPricingCycle();
  document.querySelectorAll('[data-pricing-context]').forEach((section) => {
    section.querySelectorAll('.pricing-cycle-btn').forEach((btn) => {
      const isYearly = btn.textContent.toLowerCase().includes('yearly');
      btn.classList.toggle('active', isYearly ? cycle === 'yearly' : cycle === 'monthly');
    });

    const context = section.getAttribute('data-pricing-context') || 'pricing';
    const cardsHost = section.querySelector(`[data-pricing-cards="${context}"]`);
    if (cardsHost) cardsHost.innerHTML = renderPricingCards(context);
  });
}

function initPricingWidgets() {
  refreshPricingWidgets();
}

async function handlePlanSelection(planId, evt, source = 'pricing') {
  const target = evt?.currentTarget || null;
  const nextPlan = String(planId || 'free').toLowerCase();
  const cycle = getPricingCycle();

  if (!Auth?.user) {
    window.location.href = `/signup?plan=${encodeURIComponent(nextPlan)}&cycle=${encodeURIComponent(cycle)}`;
    return;
  }

  const currentPlan = getCurrentPlanId();
  if (nextPlan === currentPlan && nextPlan !== 'free') {
    window.location.href = '/billing';
    return;
  }
  if (nextPlan === currentPlan && nextPlan === 'free') {
    Toast.info('You are already on Free plan.');
    return;
  }

  if (target) {
    target.classList.add('btn-loading');
    target.disabled = true;
  }

  const now = new Date();
  const payload = {
    plan_id: nextPlan,
    billing_cycle: cycle,
    payment_method: {
      brand: 'visa',
      last4: '4242',
      exp_month: 12,
      exp_year: now.getFullYear() + 4,
    },
  };
  const res = await API.post('/api/billing/checkout', payload);

  if (target) {
    target.classList.remove('btn-loading');
    target.disabled = false;
  }

  if (!res.ok) {
    Toast.error(res.data?.error || 'Unable to update plan right now.');
    return;
  }

  Auth.user = Auth.user || {};
  Auth.user.plan = res.data?.subscription?.plan_id || nextPlan;
  if (typeof Auth.updateNavUI === 'function') Auth.updateNavUI(true);

  Toast.success(res.data?.message || 'Membership updated.');
  refreshPricingWidgets();

  if (source === 'billing' && typeof loadBillingPage === 'function') {
    loadBillingPage();
  }
}

function renderBillingPage() {
  return `
  <div class="billing-page" style="padding-top:var(--nav-h)">
    <section class="billing-hero">
      <div class="wrap-sm tc">
        <div class="sec-eye" style="justify-content:center">Billing</div>
        <h1 class="sec-h2 font-h">Membership and Billing Center</h1>
        <p class="sec-sub tm" style="margin:0 auto">Manage plans, payment details, and invoices from one place.</p>
      </div>
    </section>
    <section style="padding:0 0 clamp(50px,8vw,80px)">
      <div class="wrap" id="billing-content">
        <div class="chart-wrap" style="text-align:center;color:var(--muted)">Loading billing details...</div>
      </div>
    </section>
    ${renderFooter()}
  </div>`;
}

function renderBillingPlanCards(currentPlanId) {
  const cycle = getPricingCycle();
  return `
    <div class="billing-plan-grid">
      ${QUICKFOLIO_PLANS.map((plan) => {
        const amount = getPlanAmount(plan, cycle);
        const isCurrent = plan.id === currentPlanId;
        return `
          <article class="billing-plan-card ${isCurrent ? 'active' : ''}">
            <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start">
              <div>
                <div style="font-family:var(--fh);font-size:1.02rem;font-weight:700">${plan.name}</div>
                <div style="color:var(--muted);font-size:.78rem">${plan.description}</div>
              </div>
              ${isCurrent ? '<span class="tag tag-c">Current</span>' : ''}
            </div>
            <div style="margin:12px 0 10px;font-size:1.2rem;font-weight:800">${formatInr(amount)} <span style="font-size:.78rem;color:var(--muted)">${plan.id === 'free' ? '/ forever' : cycle === 'yearly' ? '/ year' : '/ month'}</span></div>
            <button class="btn ${plan.id === 'pro' ? 'btn-primary' : 'btn-ghost'} btn-sm w100" ${isCurrent ? 'disabled' : ''} onclick="handlePlanSelection('${plan.id}', event, 'billing')">${isCurrent ? 'Selected' : 'Switch Plan'}</button>
          </article>
        `;
      }).join('')}
    </div>
  `;
}

function renderBillingInvoices(invoices) {
  if (!Array.isArray(invoices) || invoices.length === 0) {
    return '<div style="padding:14px;border:1px dashed var(--border2);border-radius:10px;color:var(--muted);font-size:.82rem">No invoices yet. Your next successful paid cycle will appear here.</div>';
  }

  return `
    <div style="overflow-x:auto">
      <table class="contacts-table">
        <tr><th>Invoice</th><th>Plan</th><th>Amount</th><th>Status</th><th>Date</th></tr>
        ${invoices.map((inv) => `
          <tr>
            <td><div style="font-weight:700">${inv.invoice_no}</div><div style="font-size:.7rem;color:var(--muted2)">${inv.description || 'Membership invoice'}</div></td>
            <td>${String(inv.plan_id || '').toUpperCase()}</td>
            <td>${formatInr(inv.amount_inr || 0)}</td>
            <td><span class="tag ${inv.status === 'paid' ? 'tag-g' : 'tag-o'}">${inv.status}</span></td>
            <td>${formatDate(inv.issued_at)}</td>
          </tr>
        `).join('')}
      </table>
    </div>
  `;
}

function renderBillingSummary(snapshot) {
  const subscription = snapshot?.subscription || {};
  const payment = snapshot?.payment_method || null;
  const planName = subscription?.plan?.name || 'Free';
  const renewalText = subscription?.current_period_end ? formatDate(subscription.current_period_end) : 'No upcoming renewal';
  const currentPlanId = String(subscription?.plan_id || 'free').toLowerCase();

  return `
    <div class="billing-grid">
      <div class="billing-main-col">
        <div class="chart-wrap">
          <div class="chart-title"><span>Current Membership</span><span class="tag tag-c">${currentPlanId}</span></div>
          <div style="font-family:var(--fh);font-size:1.4rem;font-weight:800;margin-bottom:6px">${planName}</div>
          <div style="color:var(--muted);font-size:.84rem;margin-bottom:12px">Cycle: ${subscription?.billing_cycle || 'monthly'} • Renewal: ${renewalText}</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${currentPlanId !== 'free' ? `
              <button class="btn btn-outline btn-sm" onclick="toggleBillingAutoRenew(${subscription?.cancel_at_period_end ? 'false' : 'true'}, event)">
                ${subscription?.cancel_at_period_end ? '🔄 Resume Auto-renew' : '⏸ Cancel At Period End'}
              </button>
              <button class="btn btn-ghost btn-sm" onclick="handlePlanSelection('free', event, 'billing')">⬇ Downgrade to Free</button>
            ` : '<a href="/pricing" class="btn btn-primary btn-sm">⬆ Upgrade Plan</a>'}
          </div>
        </div>

        <div class="chart-wrap">
          <div class="chart-title"><span>Switch Plan</span><span style="color:var(--muted);font-size:.74rem">Instant updates</span></div>
          <div class="pricing-cycle-wrap" style="margin-top:0;justify-content:flex-start">
            <button class="pricing-cycle-btn ${getPricingCycle() === 'monthly' ? 'active' : ''}" onclick="setPricingCycle('monthly');loadBillingPage()">Monthly</button>
            <button class="pricing-cycle-btn ${getPricingCycle() === 'yearly' ? 'active' : ''}" onclick="setPricingCycle('yearly');loadBillingPage()">Yearly <span>Save</span></button>
          </div>
          ${renderBillingPlanCards(currentPlanId)}
        </div>

        <div class="chart-wrap">
          <div class="chart-title"><span>Invoices</span></div>
          ${renderBillingInvoices(snapshot?.invoices || [])}
        </div>
      </div>

      <aside class="billing-side-col">
        <div class="chart-wrap">
          <div class="chart-title"><span>Payment Method</span></div>
          <form onsubmit="saveBillingPaymentMethod(event)">
            <div class="inp-group">
              <label class="inp-label">Card Brand</label>
              <select class="inp" id="billing-card-brand">
                <option value="visa" ${(payment?.brand || '').toLowerCase() === 'visa' ? 'selected' : ''}>Visa</option>
                <option value="mastercard" ${(payment?.brand || '').toLowerCase() === 'mastercard' ? 'selected' : ''}>Mastercard</option>
                <option value="rupay" ${(payment?.brand || '').toLowerCase() === 'rupay' ? 'selected' : ''}>RuPay</option>
                <option value="amex" ${(payment?.brand || '').toLowerCase() === 'amex' ? 'selected' : ''}>Amex</option>
              </select>
            </div>
            <div class="inp-group">
              <label class="inp-label">Last 4 Digits</label>
              <input class="inp" id="billing-card-last4" maxlength="4" inputmode="numeric" pattern="[0-9]{4}" value="${payment?.last4 || '4242'}" required>
            </div>
            <div class="inp-2col">
              <div class="inp-group">
                <label class="inp-label">Exp Month</label>
                <input class="inp" id="billing-card-exp-month" type="number" min="1" max="12" value="${payment?.exp_month || 12}" required>
              </div>
              <div class="inp-group">
                <label class="inp-label">Exp Year</label>
                <input class="inp" id="billing-card-exp-year" type="number" min="${new Date().getFullYear()}" max="${new Date().getFullYear() + 20}" value="${payment?.exp_year || new Date().getFullYear() + 4}" required>
              </div>
            </div>
            <button class="btn btn-primary w100" type="submit">💾 Save Payment Method</button>
          </form>
        </div>

        <div class="chart-wrap">
          <div class="chart-title"><span>Need Help?</span></div>
          <p style="color:var(--muted);font-size:.82rem;line-height:1.7">If you need enterprise billing, bulk member seats, or annual procurement docs, contact the team and we will help you set it up.</p>
          <a href="/about" class="btn btn-ghost btn-sm">📨 Contact Sales</a>
        </div>
      </aside>
    </div>
  `;
}

async function loadBillingPage() {
  const host = document.getElementById('billing-content');
  if (!host) return;

  host.innerHTML = '<div class="chart-wrap" style="text-align:center;color:var(--muted)">Loading billing details...</div>';
  const res = await API.get('/api/billing/summary');
  if (!res.ok) {
    host.innerHTML = `<div class="chart-wrap" style="border-color:rgba(239,68,68,.4);color:#ef4444">${res.data?.error || 'Unable to load billing details.'}</div>`;
    return;
  }

  host.innerHTML = renderBillingSummary(res.data);
  Auth.user = Auth.user || {};
  if (res.data?.subscription?.plan_id) {
    Auth.user.plan = res.data.subscription.plan_id;
    if (typeof Auth.updateNavUI === 'function') Auth.updateNavUI(true);
  }
}

async function toggleBillingAutoRenew(cancelAtPeriodEnd, evt) {
  const btn = evt?.currentTarget || null;
  if (btn) {
    btn.classList.add('btn-loading');
    btn.disabled = true;
  }
  const endpoint = cancelAtPeriodEnd ? '/api/billing/cancel' : '/api/billing/resume';
  const res = await API.post(endpoint, {});
  if (btn) {
    btn.classList.remove('btn-loading');
    btn.disabled = false;
  }
  if (!res.ok) {
    Toast.error(res.data?.error || 'Unable to update renewal setting.');
    return;
  }
  Toast.success(res.data?.message || 'Billing updated.');
  loadBillingPage();
}

async function saveBillingPaymentMethod(evt) {
  evt.preventDefault();
  const payload = {
    brand: document.getElementById('billing-card-brand')?.value || 'visa',
    last4: document.getElementById('billing-card-last4')?.value || '4242',
    exp_month: Number(document.getElementById('billing-card-exp-month')?.value || 12),
    exp_year: Number(document.getElementById('billing-card-exp-year')?.value || new Date().getFullYear() + 4),
  };

  const res = await API.put('/api/billing/payment-method', payload);
  if (!res.ok) {
    Toast.error(res.data?.error || 'Could not save payment method.');
    return;
  }
  Toast.success('Payment method updated.');
}

function renderAdminPage() {
  return `
  <div class="admin-page" style="padding-top:var(--nav-h)">
    <section class="billing-hero">
      <div class="wrap-sm tc">
        <div class="sec-eye" style="justify-content:center">Admin</div>
        <h1 class="sec-h2 font-h">Platform Control Center</h1>
        <p class="sec-sub tm" style="margin:0 auto">Review user activity, moderate templates, and manage accounts.</p>
      </div>
    </section>
    <section style="padding:0 0 clamp(50px,8vw,80px)">
      <div class="wrap" id="admin-content">
        <div class="chart-wrap" style="text-align:center;color:var(--muted)">Loading admin data...</div>
      </div>
    </section>
    ${renderFooter()}
  </div>`;
}

function renderAdminUsers(users) {
  if (!users.length) return '<div style="color:var(--muted)">No users found.</div>';
  return `
    <div style="overflow-x:auto">
      <table class="contacts-table">
        <tr><th>Name</th><th>Email</th><th>Plan</th><th>Status</th><th>Admin</th><th>Created</th><th>Actions</th></tr>
        ${users.map((user) => {
          const uid = String(user.id || '');
          const isActive = Boolean(user.is_active);
          return `
            <tr>
              <td><div style="font-weight:700">${escapeTemplateHtml(user.name || 'User')}</div><div style="font-size:.7rem;color:var(--muted2)">@${escapeTemplateHtml(user.username || '')}</div></td>
              <td>${escapeTemplateHtml(user.email || '')}</td>
              <td><span class="tag tag-c">${escapeTemplateHtml(String(user.plan || 'free'))}</span></td>
              <td>${isActive ? '<span class="tag tag-g">active</span>' : '<span class="tag tag-red">inactive</span>'}</td>
              <td>${Boolean(user.is_admin) ? '<span class="tag tag-o">admin</span>' : '<span class="tag tag-p">user</span>'}</td>
              <td>${user.created_at ? formatDate(user.created_at) : '--'}</td>
              <td>
                <div style="display:flex;gap:6px;flex-wrap:wrap">
                  ${isActive
                    ? `<button class="btn btn-ghost btn-sm" onclick="adminDeactivateUser('${escapeTemplateHtml(uid)}')">Deactivate</button>`
                    : `<button class="btn btn-outline btn-sm" onclick="adminReactivateUser('${escapeTemplateHtml(uid)}')">Reactivate</button>`}
                  <button class="btn btn-danger btn-sm" onclick="adminDeleteUser('${escapeTemplateHtml(uid)}')">Delete</button>
                </div>
              </td>
            </tr>
          `;
        }).join('')}
      </table>
    </div>
  `;
}

function renderAdminPendingTemplates(templates) {
  if (!templates.length) {
    return '<div style="padding:14px;border:1px dashed var(--border2);border-radius:10px;color:var(--muted)">No pending templates right now.</div>';
  }

  return `
    <div style="overflow-x:auto">
      <table class="contacts-table">
        <tr><th>Template</th><th>Creator</th><th>Category</th><th>Theme</th><th>Submitted</th><th>Actions</th></tr>
        ${templates.map((tpl) => {
          const tid = String(tpl.id || '');
          return `
            <tr>
              <td>
                <div style="font-weight:700">${escapeTemplateHtml(tpl.name || 'Untitled')}</div>
                <div style="font-size:.72rem;color:var(--muted)">${escapeTemplateHtml(tpl.description || '')}</div>
              </td>
              <td>${escapeTemplateHtml(tpl.creator_name || 'Unknown')}</td>
              <td><span class="tag tag-p">${escapeTemplateHtml(String(tpl.category || 'general'))}</span></td>
              <td><span class="tag tag-c">${escapeTemplateHtml(String(tpl.theme || 'cyberpunk'))}</span></td>
              <td>${tpl.created_at ? formatDate(tpl.created_at) : '--'}</td>
              <td>
                <div style="display:flex;gap:6px;flex-wrap:wrap">
                  <button class="btn btn-primary btn-sm" onclick="adminApproveTemplate('${escapeTemplateHtml(tid)}')">Approve</button>
                  <button class="btn btn-outline btn-sm" onclick="adminRejectTemplate('${escapeTemplateHtml(tid)}')">Reject</button>
                  <button class="btn btn-danger btn-sm" onclick="adminDeleteTemplate('${escapeTemplateHtml(tid)}')">Delete</button>
                </div>
              </td>
            </tr>
          `;
        }).join('')}
      </table>
    </div>
  `;
}

function renderAdminOverview(data) {
  const stats = data?.stats || {};
  const users = Array.isArray(data?.users) ? data.users : [];
  const pendingTemplates = Array.isArray(data?.pending_templates) ? data.pending_templates : [];

  return `
    <div class="admin-grid-wrap">
      <div class="stat-cards">
        <div class="stat-card"><div class="stat-ico">👥</div><span class="stat-num">${Number(stats.total_users || 0)}</span><div class="stat-lbl">Total Users</div></div>
        <div class="stat-card"><div class="stat-ico">✅</div><span class="stat-num">${Number(stats.active_users || 0)}</span><div class="stat-lbl">Active Users</div></div>
        <div class="stat-card"><div class="stat-ico">🌐</div><span class="stat-num">${Number(stats.published_portfolios || 0)}</span><div class="stat-lbl">Published Portfolios</div></div>
        <div class="stat-card"><div class="stat-ico">🧩</div><span class="stat-num">${Number(stats.total_templates || 0)}</span><div class="stat-lbl">Total Templates</div></div>
        <div class="stat-card"><div class="stat-ico">⏳</div><span class="stat-num">${Number(stats.pending_templates || 0)}</span><div class="stat-lbl">Pending Templates</div></div>
        <div class="stat-card"><div class="stat-ico">🛡</div><span class="stat-num">${Number(stats.admin_users || 0)}</span><div class="stat-lbl">Admin Accounts</div></div>
      </div>

      <div class="chart-wrap">
        <div class="chart-title"><span>Pending Template Moderation</span><button class="btn btn-ghost btn-sm" onclick="loadAdminPage()">↻ Refresh</button></div>
        ${renderAdminPendingTemplates(pendingTemplates)}
      </div>

      <div class="chart-wrap">
        <div class="chart-title"><span>User Management</span></div>
        ${renderAdminUsers(users)}
      </div>
    </div>
  `;
}

async function loadAdminPage() {
  const host = document.getElementById('admin-content');
  if (!host) return;

  host.innerHTML = '<div class="chart-wrap" style="text-align:center;color:var(--muted)">Loading admin data...</div>';
  const res = await API.get('/api/admin/overview');
  if (!res.ok) {
    host.innerHTML = `<div class="chart-wrap" style="border-color:rgba(239,68,68,.4);color:#ef4444">${res.data?.error || 'Unable to load admin data.'}</div>`;
    return;
  }

  host.innerHTML = renderAdminOverview(res.data);
}

async function adminApproveTemplate(templateId) {
  const tid = String(templateId || '').trim();
  if (!tid) return;
  const res = await API.post(`/api/admin/templates/${encodeURIComponent(tid)}/approve`, {});
  if (!res.ok) {
    Toast.error(res.data?.error || 'Unable to approve template.');
    return;
  }
  Toast.success(res.data?.message || 'Template approved.');
  loadAdminPage();
}

async function adminRejectTemplate(templateId) {
  const tid = String(templateId || '').trim();
  if (!tid) return;
  const note = window.prompt('Optional moderation note for the creator:', 'Rejected by admin policy review') || 'Rejected by admin policy review';
  const res = await API.post(`/api/admin/templates/${encodeURIComponent(tid)}/reject`, { moderation_note: note });
  if (!res.ok) {
    Toast.error(res.data?.error || 'Unable to reject template.');
    return;
  }
  Toast.success(res.data?.message || 'Template rejected.');
  loadAdminPage();
}

async function adminDeleteTemplate(templateId) {
  const tid = String(templateId || '').trim();
  if (!tid) return;
  if (!window.confirm('Delete this template permanently?')) return;
  const res = await API.delete(`/api/admin/templates/${encodeURIComponent(tid)}`);
  if (!res.ok) {
    Toast.error(res.data?.error || 'Unable to delete template.');
    return;
  }
  Toast.success(res.data?.message || 'Template removed.');
  loadAdminPage();
}

async function adminDeactivateUser(userId) {
  const uid = String(userId || '').trim();
  if (!uid) return;
  if (!window.confirm('Deactivate this user account?')) return;
  const res = await API.post(`/api/admin/users/${encodeURIComponent(uid)}/deactivate`, {});
  if (!res.ok) {
    Toast.error(res.data?.error || 'Unable to deactivate user.');
    return;
  }
  Toast.success(res.data?.message || 'User deactivated.');
  loadAdminPage();
}

async function adminReactivateUser(userId) {
  const uid = String(userId || '').trim();
  if (!uid) return;
  const res = await API.post(`/api/admin/users/${encodeURIComponent(uid)}/reactivate`, {});
  if (!res.ok) {
    Toast.error(res.data?.error || 'Unable to reactivate user.');
    return;
  }
  Toast.success(res.data?.message || 'User reactivated.');
  loadAdminPage();
}

async function adminDeleteUser(userId) {
  const uid = String(userId || '').trim();
  if (!uid) return;
  if (!window.confirm('Delete this user account and all related data permanently?')) return;
  const res = await API.delete(`/api/admin/users/${encodeURIComponent(uid)}`);
  if (!res.ok) {
    Toast.error(res.data?.error || 'Unable to delete user.');
    return;
  }
  Toast.success(res.data?.message || 'User removed.');
  loadAdminPage();
}

// ── MANUAL ──
function renderManual() {
  return `
  <div class="docs-layout manual-layout" style="padding-top:var(--nav-h)">
    <aside class="docs-side">
      <div class="docs-nav-h">Manual</div>
      <a class="docs-a active" href="#manual-overview" data-scroll="1">Overview</a>
      <a class="docs-a" href="#manual-features" data-scroll="1">Feature Guide</a>
      <a class="docs-a" href="#manual-workflows" data-scroll="1">Common Workflows</a>
      <a class="docs-a" href="#manual-faq" data-scroll="1">Tips & Troubleshooting</a>
    </aside>
    <div class="docs-content manual-content">
      <section id="manual-overview">
        <div class="sec-eye">Manual</div>
        <h1 class="docs-h1">QuickFolio Feature Manual</h1>
        <p class="docs-p">This manual explains what every major feature does, why it matters, and how to use it step by step. Use the search box below to find any feature instantly.</p>
        <div class="manual-search-wrap">
          <label class="inp-label" for="manual-search-input">Search feature details</label>
          <div class="manual-search-row">
            <input id="manual-search-input" class="inp manual-search-input" type="search" placeholder="Try: pdf, presets, publish, chatbot, analytics" autocomplete="off">
            <span class="manual-search-count" id="manual-search-count">0 features</span>
          </div>
          <div class="manual-search-hint">You can search by feature name, use-case, or action (example: "upload photo" or "custom domain").</div>
        </div>
      </section>

      <section id="manual-features">
        <h2 class="docs-h2">Feature Guide</h2>
        <div class="manual-grid">
          <article class="manual-card manual-item" data-manual-text="command center quick actions shortcut keyboard ctrl shift j">
            <h3 class="docs-h3">⚡ Command Center</h3>
            <p class="docs-p"><strong>What it does:</strong> Gives one-place quick actions for navigation, chatbot access, and workspace jumps.</p>
            <p class="docs-p"><strong>How to use:</strong> Press <span class="docs-inline">Ctrl + Shift + J</span> (or use the Quick Actions button) and search actions instantly.</p>
          </article>

          <article class="manual-card manual-item" data-manual-text="performance mode speed reduced motion low distraction">
            <h3 class="docs-h3">🚀 Performance Mode</h3>
            <p class="docs-p"><strong>What it does:</strong> Reduces heavy motion and visual effects to keep interactions snappy on slower devices.</p>
            <p class="docs-p"><strong>How to use:</strong> Open Quick Actions and toggle Performance Mode on/off anytime.</p>
          </article>

          <article class="manual-card manual-item" data-manual-text="core web vitals lcp inp cls fcp ttfb performance summary">
            <h3 class="docs-h3">📉 Core Web Vitals Monitoring</h3>
            <p class="docs-p"><strong>What it does:</strong> Collects real-user LCP/INP/CLS/FCP/TTFB metrics and shows p75 status in Dashboard analytics.</p>
            <p class="docs-p"><strong>How to use:</strong> Open Dashboard → Analytics and review the <strong>Core Web Vitals Health</strong> panel against targets.</p>
          </article>

          <article class="manual-card manual-item" data-manual-text="account signup login oauth github google linkedin password">
            <h3 class="docs-h3">🔐 Account and Login</h3>
            <p class="docs-p"><strong>What it does:</strong> Lets users register with email/password or social login.</p>
            <p class="docs-p"><strong>How to use:</strong> Open Signup or Login, choose your method, and continue to Dashboard after authentication.</p>
          </article>

          <article class="manual-card manual-item" data-manual-text="builder sections drag drop reorder visibility">
            <h3 class="docs-h3">🧱 Builder Sections</h3>
            <p class="docs-p"><strong>What it does:</strong> Controls which sections appear and their order on your portfolio.</p>
            <p class="docs-p"><strong>How to use:</strong> In Builder → Sections tab, drag items to reorder, toggle ON/OFF, and add missing sections.</p>
          </article>

          <article class="manual-card manual-item" data-manual-text="theme switch style colors template visual">
            <h3 class="docs-h3">🎨 Theme Switching</h3>
            <p class="docs-p"><strong>What it does:</strong> Applies complete visual themes (colors, typography, mood).</p>
            <p class="docs-p"><strong>How to use:</strong> In Builder → Themes tab, click any theme card to preview instantly, then save.</p>
          </article>

          <article class="manual-card manual-item" data-manual-text="photo profile upload drag resize position hero">
            <h3 class="docs-h3">🖼 Profile Photo Controls</h3>
            <p class="docs-p"><strong>What it does:</strong> Adds a profile image with size, shape, and position control.</p>
            <p class="docs-p"><strong>How to use:</strong> In Builder → Config, upload photo, adjust sliders, or drag and resize directly in live preview.</p>
          </article>

          <article class="manual-card manual-item" data-manual-text="background image overlay zoom position hero">
            <h3 class="docs-h3">🌌 Background Image Controls</h3>
            <p class="docs-p"><strong>What it does:</strong> Sets custom hero background with zoom, overlay, and alignment.</p>
            <p class="docs-p"><strong>How to use:</strong> Upload/select background URL, then tune zoom and X/Y position sliders for perfect framing.</p>
          </article>

          <article class="manual-card manual-item" data-manual-text="typography heading body font color scale spacing radius">
            <h3 class="docs-h3">🔤 Typography and Styling</h3>
            <p class="docs-p"><strong>What it does:</strong> Lets you control text scale, heading/body fonts, colors, spacing, and card radius.</p>
            <p class="docs-p"><strong>How to use:</strong> In Builder → Config, use global controls first, then per-section scale and font controls for fine-tuning.</p>
          </article>

          <article class="manual-card manual-item" data-manual-text="design preset save apply delete sync account">
            <h3 class="docs-h3">💾 Design Presets (Account-Synced)</h3>
            <p class="docs-p"><strong>What it does:</strong> Saves your favorite design setups and syncs them with your account.</p>
            <p class="docs-p"><strong>How to use:</strong> Enter preset name in Config → Design Presets, click Save Preset, then Apply anytime on any device after login.</p>
          </article>

          <article class="manual-card manual-item" data-manual-text="recruiter mode toggle compact quick scan">
            <h3 class="docs-h3">🧲 Recruiter Mode</h3>
            <p class="docs-p"><strong>What it does:</strong> Switches to a condensed view that surfaces core hiring signals quickly.</p>
            <p class="docs-p"><strong>How to use:</strong> Enable default recruiter mode in Builder config, and visitors can also toggle it from your public navbar.</p>
          </article>

          <article class="manual-card manual-item" data-manual-text="ai resume tailoring fit score missing skills tailored pdf">
            <h3 class="docs-h3">🎯 AI Resume Tailoring</h3>
            <p class="docs-p"><strong>What it does:</strong> Matches your portfolio against a target role, reports fit score, and generates a tailored resume PDF.</p>
            <p class="docs-p"><strong>How to use:</strong> In Builder config, paste job URL or JD text, run Analyze Role Fit, then download tailored PDF or apply suggestions.</p>
          </article>

          <article class="manual-card manual-item" data-manual-text="billing membership subscription invoices payment method upgrade downgrade yearly monthly">
            <h3 class="docs-h3">💳 Billing and Membership</h3>
            <p class="docs-p"><strong>What it does:</strong> Lets you manage plan upgrades, cycle selection, auto-renew, payment method, and invoice history.</p>
            <p class="docs-p"><strong>How to use:</strong> Open Billing page from nav or dashboard, switch plans, update card details, and review invoices.</p>
          </article>

          <article class="manual-card manual-item" data-manual-text="custom template marketplace submit pending review approve">
            <h3 class="docs-h3">🧩 Custom Template Marketplace</h3>
            <p class="docs-p"><strong>What it does:</strong> Converts your current portfolio into a reusable template and optionally submits it for public marketplace use.</p>
            <p class="docs-p"><strong>How to use:</strong> Open Templates page, fill template details, save template, and toggle submit-to-marketplace for admin review.</p>
          </article>

          <article class="manual-card manual-item" data-manual-text="admin moderation remove user reject template approve template">
            <h3 class="docs-h3">🛡 Admin Moderation Panel</h3>
            <p class="docs-p"><strong>What it does:</strong> Gives admin users control to approve/reject templates, deactivate/delete users, and monitor platform activity.</p>
            <p class="docs-p"><strong>How to use:</strong> Open Admin page as an admin account and use moderation actions for template quality and account governance.</p>
          </article>

          <article class="manual-card manual-item" data-manual-text="projects links demo github code tech stack featured">
            <h3 class="docs-h3">🚀 Projects Section</h3>
            <p class="docs-p"><strong>What it does:</strong> Showcases portfolio projects with tech stack, demo URL, and code repository links.</p>
            <p class="docs-p"><strong>How to use:</strong> In Builder → Edit → Projects, add project cards, fill links, and mark key work as featured.</p>
          </article>

          <article class="manual-card manual-item" data-manual-text="save autosave server draft">
            <h3 class="docs-h3">☁️ Save and Auto-Save</h3>
            <p class="docs-p"><strong>What it does:</strong> Persists your portfolio state to backend storage.</p>
            <p class="docs-p"><strong>How to use:</strong> Use Save to Server for instant persistence; auto-save also runs periodically in the builder.</p>
          </article>

          <article class="manual-card manual-item" data-manual-text="publish unpublish live url slug share portfolio">
            <h3 class="docs-h3">🌐 Publish and Share</h3>
            <p class="docs-p"><strong>What it does:</strong> Toggles your site between draft and public mode with a shareable URL.</p>
            <p class="docs-p"><strong>How to use:</strong> Click Publish from Builder or Dashboard, then share your public link <span class="docs-inline">/p/your-slug</span>.</p>
          </article>

          <article class="manual-card manual-item" data-manual-text="resume pdf download professional linkedin">
            <h3 class="docs-h3">📄 Resume PDF Download</h3>
            <p class="docs-p"><strong>What it does:</strong> Generates and downloads a professional, recruiter-friendly resume PDF from your portfolio data.</p>
            <p class="docs-p"><strong>How to use:</strong> Open your public portfolio and click <strong>Download Resume PDF</strong>.</p>
          </article>

          <article class="manual-card manual-item" data-manual-text="chatbot ai assistant nlp visitor questions">
            <h3 class="docs-h3">🤖 AI Chatbot</h3>
            <p class="docs-p"><strong>What it does:</strong> Answers visitor questions on your public portfolio automatically.</p>
            <p class="docs-p"><strong>How to use:</strong> Publish your portfolio and visitors can interact with chatbot widget in real time.</p>
          </article>

          <article class="manual-card manual-item" data-manual-text="contact form message inquiries email auto reply">
            <h3 class="docs-h3">📬 Contact Form and Auto-Reply</h3>
            <p class="docs-p"><strong>What it does:</strong> Collects visitor messages and returns instant acknowledgement responses.</p>
            <p class="docs-p"><strong>How to use:</strong> Keep contact section enabled and set your email in Builder settings for notifications.</p>
          </article>

          <article class="manual-card manual-item" data-manual-text="analytics views chart leads messages performance">
            <h3 class="docs-h3">📊 Analytics Dashboard</h3>
            <p class="docs-p"><strong>What it does:</strong> Tracks views, leads, and engagement trends.</p>
            <p class="docs-p"><strong>How to use:</strong> Open Dashboard → Analytics tab to monitor daily views and total contact messages.</p>
          </article>

          <article class="manual-card manual-item" data-manual-text="templates choose preview categories">
            <h3 class="docs-h3">🧩 Templates Library</h3>
            <p class="docs-p"><strong>What it does:</strong> Offers ready-made visual starting points by category.</p>
            <p class="docs-p"><strong>How to use:</strong> Open Templates page, preview designs, then click Use Template to jump into Builder.</p>
          </article>

          <article class="manual-card manual-item" data-manual-text="export github pages download html deploy">
            <h3 class="docs-h3">📦 Export and Deployment</h3>
            <p class="docs-p"><strong>What it does:</strong> Exports standalone HTML for hosting anywhere (including GitHub Pages).</p>
            <p class="docs-p"><strong>How to use:</strong> In Builder, click Export, choose mode, then download or copy deployment-ready code.</p>
          </article>
        </div>
        <div id="manual-search-empty" class="manual-empty" style="display:none"></div>
      </section>

      <section id="manual-workflows">
        <h2 class="docs-h2">Common Workflows</h2>
        <div class="manual-flow-grid">
          <article class="manual-flow manual-item" data-manual-text="workflow new user setup publish">
            <h3 class="docs-h3">New User Setup</h3>
            <p class="docs-p">Signup → open Builder → complete Hero/About/Projects → save → publish → share public URL.</p>
          </article>
          <article class="manual-flow manual-item" data-manual-text="workflow visual customization design">
            <h3 class="docs-h3">Visual Customization</h3>
            <p class="docs-p">Pick theme → upload profile/background image → tune typography/colors → save as preset.</p>
          </article>
          <article class="manual-flow manual-item" data-manual-text="workflow recruiter ready pdf">
            <h3 class="docs-h3">Recruiter-Ready Output</h3>
            <p class="docs-p">Ensure key projects and contact details are updated, then verify public page and resume PDF download.</p>
          </article>
        </div>
      </section>

      <section id="manual-faq">
        <h2 class="docs-h2">Tips and Troubleshooting</h2>
        <div class="docs-tip">If search returns no result, try shorter terms like <span class="docs-inline">pdf</span>, <span class="docs-inline">publish</span>, <span class="docs-inline">photo</span>, or <span class="docs-inline">preset</span>.</div>
        <div class="docs-warn">If your changes are not visible publicly, confirm you clicked <strong>Save to Server</strong> and that your portfolio is currently <strong>Published</strong>.</div>
      </section>
    </div>
  </div>`;
}

function initManualPage() {
  const input = document.getElementById('manual-search-input');
  if (input && input.dataset.bound !== '1') {
    input.dataset.bound = '1';
    input.addEventListener('input', () => {
      filterManualFeatures(input.value);
    });
  }

  document.querySelectorAll('.docs-a[data-scroll="1"]').forEach((link) => {
    if (link.dataset.bound === '1') return;
    link.dataset.bound = '1';
    link.addEventListener('click', () => {
      document.querySelectorAll('.docs-a[data-scroll="1"]').forEach((el) => el.classList.remove('active'));
      link.classList.add('active');
    });
  });

  filterManualFeatures(input?.value || '');
}

function escapeManualRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getManualSearchTerms(query) {
  const seen = new Set();
  const terms = [];
  String(query || '')
    .trim()
    .split(/\s+/)
    .forEach((term) => {
      const normalized = term.trim().toLowerCase();
      if (!normalized || seen.has(normalized)) return;
      seen.add(normalized);
      terms.push(term.trim());
    });
  return terms.slice(0, 8);
}

function applyManualHighlightsToElement(el, terms) {
  if (!el) return;

  if (!el.dataset.manualRawHtml) {
    el.dataset.manualRawHtml = el.innerHTML;
  }

  el.innerHTML = el.dataset.manualRawHtml;
  if (!terms.length) return;

  const pattern = terms.map(escapeManualRegex).filter(Boolean).join('|');
  if (!pattern) return;

  const regex = new RegExp(`(${pattern})`, 'gi');
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const textNodes = [];

  let currentNode = walker.nextNode();
  while (currentNode) {
    textNodes.push(currentNode);
    currentNode = walker.nextNode();
  }

  textNodes.forEach((node) => {
    const source = node.nodeValue || '';
    if (!source) return;

    const testRegex = new RegExp(`(${pattern})`, 'i');
    if (!testRegex.test(source)) return;

    const frag = document.createDocumentFragment();
    let lastIndex = 0;

    source.replace(regex, (match, _group, offset) => {
      if (offset > lastIndex) {
        frag.appendChild(document.createTextNode(source.slice(lastIndex, offset)));
      }
      const mark = document.createElement('mark');
      mark.className = 'manual-hit';
      mark.textContent = match;
      frag.appendChild(mark);
      lastIndex = offset + match.length;
      return match;
    });

    if (lastIndex < source.length) {
      frag.appendChild(document.createTextNode(source.slice(lastIndex)));
    }

    node.parentNode?.replaceChild(frag, node);
  });
}

function highlightManualItem(item, terms) {
  item.querySelectorAll('.docs-h3, .docs-p').forEach((el) => {
    applyManualHighlightsToElement(el, terms);
  });
}

function filterManualFeatures(rawQuery) {
  const normalizedQuery = String(rawQuery || '').trim();
  const query = normalizedQuery.toLowerCase();
  const terms = getManualSearchTerms(normalizedQuery);
  const items = [...document.querySelectorAll('.manual-item')];
  let visibleCount = 0;

  items.forEach((item) => {
    const inDataset = String(item.dataset.manualText || '').toLowerCase();
    const inText = String(item.textContent || '').toLowerCase();
    const show = !query || inDataset.includes(query) || inText.includes(query);
    item.style.display = show ? '' : 'none';
    highlightManualItem(item, show ? terms : []);
    if (show) visibleCount += 1;
  });

  const countEl = document.getElementById('manual-search-count');
  if (countEl) {
    countEl.textContent = query
      ? `${visibleCount} result${visibleCount === 1 ? '' : 's'}`
      : `${items.length} features`;
  }

  const emptyEl = document.getElementById('manual-search-empty');
  if (!emptyEl) return;
  if (visibleCount > 0) {
    emptyEl.style.display = 'none';
    emptyEl.textContent = '';
    return;
  }

  emptyEl.style.display = '';
  emptyEl.textContent = query
    ? `No feature details matched "${normalizedQuery}". Try keywords like pdf, publish, chatbot, analytics, or presets.`
    : 'No feature details available right now.';
}

// ── ABOUT ──
function renderAbout() {
  return `
  <div style="padding-top:var(--nav-h)">
  <section class="about-hero">
    <div class="wrap-sm">
      <div class="sec-eye" style="justify-content:center">Our Story</div>
      <h1 style="font-family:var(--fh);font-size:clamp(2rem,4vw,3rem);font-weight:800;letter-spacing:-.5px;margin-bottom:14px">Built by developers,<br><span class="grad-text">for developers</span></h1>
      <p class="sec-sub tm" style="margin:0 auto">QuickFolio was born from frustration. We were developers tired of spending weeks on portfolio sites when we should've been building real things. So we built the full-stack tool we always wished existed.</p>
    </div>
  </section>
  <section style="padding:0 0 clamp(50px,8vw,72px)">
    <div class="wrap">
      <div class="about-stats-g">
        ${[['🚀','12K+','grad-text','Portfolios Built'],['🌍','45+','grad-text2','Countries'],['💼','3.2K+','grad-text3','Jobs Landed'],['⭐','4.9/5','grad-text','Average Rating']].map(([ico,num,cls,lbl])=>`
        <div class="card card-h tc" style="padding:28px 20px">
          <div style="font-size:2rem;margin-bottom:7px">${ico}</div>
          <span class="font-h" style="font-size:1.9rem;font-weight:800;display:block;margin-bottom:5px" class="${cls}">${num}</span>
          <div style="color:var(--muted);font-size:.74rem;text-transform:uppercase;letter-spacing:1px;font-weight:700">${lbl}</div>
        </div>`).join('')}
      </div>
      ${renderSachinSpotlightSection('about-embedded')}
      <h2 style="font-family:var(--fh);font-size:clamp(1.5rem,3vw,2rem);font-weight:800;text-align:center;margin-bottom:28px">Meet the <span class="grad-text">team</span></h2>
      <div class="team-g">
        ${[
          {s:'Sachin',n:'Sachin',r:'Founder & Lead Dev',b:'CS student and Python Dev Intern. Built QuickFolio to help developers land better opportunities faster.'},
         
        ].map(m=>`
        <div class="card card-h team-card">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${m.s}" class="team-av" alt="${m.n}">
          <div class="team-name font-h">${m.n}</div>
          <div class="team-role">${m.r}</div>
          <div class="team-bio">${m.b}</div>
        </div>`).join('')}
      </div>
    </div>
  </section>
  <section style="background:var(--surface);padding:clamp(60px,8vw,80px) clamp(16px,4vw,32px)">
    <div class="wrap-sm tc">
      <h2 style="font-family:var(--fh);font-size:clamp(1.5rem,3vw,2rem);font-weight:800">Tech <span class="grad-text">Stack</span></h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:12px;margin-top:24px">
        ${[['🐍','Python 3.12'],['⚗️','Flask 3.x'],['🗄️','SQLite3'],['🔐','PBKDF2 Auth'],['🌐','REST API'],['⚡','Vanilla JS'],['🎨','CSS3'],['🤖','NLP Chatbot'],['📊','Analytics'],['📱','Responsive']].map(([ico,n])=>`<div class="card" style="text-align:center;padding:14px 10px"><div style="font-size:1.5rem;margin-bottom:6px">${ico}</div><div style="font-size:.75rem;font-weight:700;color:var(--muted)">${n}</div></div>`).join('')}
      </div>
      <div style="margin-top:32px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
        <a href="/signup" class="btn btn-primary btn-lg">⚡ Start Building</a>
        <a href="/manual" class="btn btn-ghost btn-lg">📖 Open Manual</a>
      </div>
    </div>
  </section>
  ${renderDirectMailSection({
    eyebrow: 'Contact',
    title: 'Have a question for QuickFolio?',
    description: 'You can email us directly and we will respond as soon as possible.',
    subject: 'QuickFolio About Page Inquiry'
  })}
  ${renderFooter()}
  </div>`;
}

// ── PRIVACY POLICY ──
function renderPrivacyPolicy() {
  return `
  <div style="padding-top:var(--nav-h)">
    <section class="about-hero" style="padding-bottom:28px">
      <div class="wrap-sm">
        <div class="sec-eye" style="justify-content:center">Legal</div>
        <h1 style="font-family:var(--fh);font-size:clamp(1.9rem,4vw,2.8rem);font-weight:800;letter-spacing:-.4px;margin-bottom:12px">Privacy Policy</h1>
        <p class="sec-sub tm" style="margin:0 auto">QuickFolio is committed to protecting account and visitor data. This policy explains what we collect and how we use it.</p>
      </div>
    </section>

    <section style="padding:0 0 clamp(52px,8vw,76px)">
      <div class="wrap-sm">
        <div class="card card-h" style="padding:clamp(20px,4vw,30px)">
          <h2 class="docs-h3">1. Data We Collect</h2>
          <p class="docs-p">We collect account profile details, portfolio content, analytics events, and contact messages required to deliver core platform features.</p>

          <h2 class="docs-h3" style="margin-top:18px">2. How We Use Data</h2>
          <p class="docs-p">Data is used to authenticate users, save portfolio edits, provide analytics summaries, power chatbot context, and improve product performance.</p>

          <h2 class="docs-h3" style="margin-top:18px">3. Visitor Analytics</h2>
          <p class="docs-p">Published portfolios can record traffic context such as referrer, campaign tags, visitor IP, and user-agent string for engagement reporting.</p>

          <h2 class="docs-h3" style="margin-top:18px">4. Security Controls</h2>
          <p class="docs-p">QuickFolio applies authentication, secure password hashing, response hardening headers, and abuse protection controls on sensitive endpoints.</p>

          <h2 class="docs-h3" style="margin-top:18px">5. Contact</h2>
          <p class="docs-p">For privacy questions, email <a href="mailto:${QUICKFOLIO_CONTACT_EMAIL}">${QUICKFOLIO_CONTACT_EMAIL}</a>.</p>
        </div>
      </div>
    </section>

    ${renderFooter()}
  </div>`;
}

// ── TERMS OF SERVICE ──
function renderTermsOfService() {
  return `
  <div style="padding-top:var(--nav-h)">
    <section class="about-hero" style="padding-bottom:28px">
      <div class="wrap-sm">
        <div class="sec-eye" style="justify-content:center">Legal</div>
        <h1 style="font-family:var(--fh);font-size:clamp(1.9rem,4vw,2.8rem);font-weight:800;letter-spacing:-.4px;margin-bottom:12px">Terms of Service</h1>
        <p class="sec-sub tm" style="margin:0 auto">These terms govern use of QuickFolio services, including account access, public publishing, and billing workflows.</p>
      </div>
    </section>

    <section style="padding:0 0 clamp(52px,8vw,76px)">
      <div class="wrap-sm">
        <div class="card card-h" style="padding:clamp(20px,4vw,30px)">
          <h2 class="docs-h3">1. Acceptable Use</h2>
          <p class="docs-p">Users must not publish unlawful, abusive, or misleading content, and must respect platform integrity and other users.</p>

          <h2 class="docs-h3" style="margin-top:18px">2. Account Responsibility</h2>
          <p class="docs-p">You are responsible for account credentials, portfolio content accuracy, and all actions performed through your account.</p>

          <h2 class="docs-h3" style="margin-top:18px">3. Plans and Billing</h2>
          <p class="docs-p">Paid plans are billed by the selected cycle. Feature access may change when plans are upgraded, downgraded, cancelled, or expire.</p>

          <h2 class="docs-h3" style="margin-top:18px">4. Availability and Changes</h2>
          <p class="docs-p">QuickFolio may update, improve, or retire features over time. We aim to preserve reliability while evolving the product roadmap.</p>

          <h2 class="docs-h3" style="margin-top:18px">5. Contact</h2>
          <p class="docs-p">For legal support, email <a href="mailto:${QUICKFOLIO_CONTACT_EMAIL}">${QUICKFOLIO_CONTACT_EMAIL}</a>.</p>
        </div>
      </div>
    </section>

    ${renderFooter()}
  </div>`;
}

// ── TEMPLATES PAGE ──
function escapeTemplateHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function templateStatusBadge(template) {
  const status = String(template?.approval_status || 'approved').toLowerCase();
  if (status === 'pending') return '<span class="tag tag-o">Pending Review</span>';
  if (status === 'rejected') return '<span class="tag tag-red">Rejected</span>';
  if (status === 'private') return '<span class="tag tag-p">Private</span>';
  return '<span class="tag tag-g">Approved</span>';
}

function templateDemoUrl(template) {
  const demo = String(template?.demo_url || '').trim();
  if (demo) return demo;
  return `/demo/${encodeURIComponent(String(template?.theme || 'cyberpunk').toLowerCase())}`;
}

function renderTemplateMarketplaceCards(templates) {
  return templates.map((tpl) => {
    const themeName = String(tpl.theme || 'cyberpunk');
    const t = (typeof THEMES !== 'undefined' && THEMES[themeName]) || {bg:'#0a0a0f',card:'#18182a',accent:'#00e5ff',grad:'linear-gradient(135deg,#00e5ff,#b44fff)',font:"'Orbitron'"};
    const category = String(tpl.category || 'general').toLowerCase();
    const templateId = tpl.is_builtin_fallback ? '' : String(tpl.id || '').trim();
    const previewHref = templateDemoUrl(tpl);
    const status = String(tpl.approval_status || 'approved').toLowerCase();
    const moderation = String(tpl.moderation_note || '').trim();

    return `
    <div class="tpl-card tpl-market-card" data-cat="${escapeTemplateHtml(category)}" data-name="${escapeTemplateHtml(String(tpl.name || '').toLowerCase())}" data-desc="${escapeTemplateHtml((String(tpl.description || '') + ' ' + moderation).toLowerCase())}" onclick="useTemplate('${escapeTemplateHtml(themeName)}','${escapeTemplateHtml(templateId)}')">
      <div class="tpl-preview-area" style="background:linear-gradient(135deg,${t.bg||'#07080f'},${t.card||'#121322'})">
        <div style="text-align:center;position:relative;z-index:1;padding:28px 16px">
          <div style="font-size:2.3rem;margin-bottom:8px">⚡</div>
          <div style="font-family:${t.font||"'Syne'"};font-size:.95rem;font-weight:700;background:${t.grad||'linear-gradient(135deg,#00e5ff,#b44fff)'};-webkit-background-clip:text;-webkit-text-fill-color:transparent">${escapeTemplateHtml(tpl.name)}</div>
          ${tpl.creator_name ? `<div style="margin-top:6px;font-size:.68rem;color:rgba(255,255,255,.8)">by ${escapeTemplateHtml(tpl.creator_name)}</div>` : ''}
        </div>
        <div class="tpl-ov">
          <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();useTemplate('${escapeTemplateHtml(themeName)}','${escapeTemplateHtml(templateId)}')">⚡ Apply Template</button>
          <button class="btn btn-sm" style="background:rgba(255,255,255,.1);color:#fff;border:1.5px solid rgba(255,255,255,.3)" onclick="event.stopPropagation();previewTemplate('${escapeTemplateHtml(themeName)}','${escapeTemplateHtml(templateId)}','${escapeTemplateHtml(previewHref)}')">👁 Preview</button>
        </div>
      </div>
      <div class="tpl-info">
        <div class="tpl-name font-h">${escapeTemplateHtml(tpl.name)}</div>
        <div class="tpl-desc">${escapeTemplateHtml(tpl.description || 'Community-built portfolio template')}</div>
        <div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:8px">
          <span class="tag tag-c">${escapeTemplateHtml(themeName)}</span>
          <span class="tag tag-p">${escapeTemplateHtml(category)}</span>
          ${tpl.is_featured ? '<span class="tag tag-o">⭐ Featured</span>' : ''}
          <span class="tag tag-g">Uses ${Number(tpl.uses || 0)}</span>
          ${tpl.is_owner ? templateStatusBadge(tpl) : ''}
        </div>
        ${tpl.is_owner && status === 'rejected' && moderation ? `<div class="tpl-note-reject">Reason: ${escapeTemplateHtml(moderation)}</div>` : ''}
      </div>
    </div>`;
  }).join('');
}

function renderMyTemplateRows(templates) {
  if (!templates.length) {
    return '<div style="color:var(--muted);font-size:.8rem">You have not created any custom templates yet.</div>';
  }

  return templates.map((tpl) => {
    const templateId = String(tpl.id || '').trim();
    const status = String(tpl.approval_status || 'approved').toLowerCase();
    const canSubmit = status === 'private' || status === 'rejected';
    const moderation = String(tpl.moderation_note || '').trim();
    return `
      <div class="my-template-row">
        <div>
          <div style="font-weight:700;font-size:.86rem">${escapeTemplateHtml(tpl.name)}</div>
          <div style="color:var(--muted);font-size:.73rem">${escapeTemplateHtml(tpl.description || 'No description')}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">
            <span class="tag tag-c">${escapeTemplateHtml(String(tpl.theme || 'cyberpunk'))}</span>
            <span class="tag tag-p">${escapeTemplateHtml(String(tpl.category || 'general'))}</span>
            ${templateStatusBadge(tpl)}
          </div>
          ${moderation && status === 'rejected' ? `<div class="tpl-note-reject">Admin note: ${escapeTemplateHtml(moderation)}</div>` : ''}
        </div>
        <div class="my-template-actions">
          <button class="btn btn-primary btn-sm" onclick="useTemplate('${escapeTemplateHtml(String(tpl.theme || 'cyberpunk'))}','${escapeTemplateHtml(templateId)}')">Apply</button>
          ${canSubmit ? `<button class="btn btn-ghost btn-sm" onclick="submitTemplateToMarketplace('${escapeTemplateHtml(templateId)}')">Submit Public</button>` : ''}
          <button class="btn btn-outline btn-sm" onclick="deleteOwnedTemplate('${escapeTemplateHtml(templateId)}')">Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

async function renderTemplates() {
  const [res, mineRes] = await Promise.all([
    API.get('/api/templates'),
    Auth?.user ? API.get('/api/templates/mine') : Promise.resolve({ ok: true, data: { templates: [] } })
  ]);

  const apiTemplates = (res.ok && Array.isArray(res.data)) ? res.data : [];
  const myTemplates = (mineRes.ok && Array.isArray(mineRes.data?.templates)) ? mineRes.data.templates : [];
  const fallbackTemplates = (typeof TEMPLATES !== 'undefined' ? TEMPLATES : []).map(t => ({
    id: t.name?.toLowerCase().replace(/\s+/g, '-') || generateId(),
    name: t.name,
    description: t.desc || '',
    theme: t.theme,
    category: t.category || t.cat || 'general',
    is_featured: 0,
    uses: 0,
    is_owner: false,
    approval_status: 'approved',
    creator_name: 'QuickFolio',
    is_builtin_fallback: true
  }));
  const templates = apiTemplates.length ? apiTemplates : fallbackTemplates;
  const categories = ['all', ...new Set(templates.map((t) => String(t.category || 'general').toLowerCase()))];

  const customCreatorPanel = Auth?.user ? `
    <section class="tpl-create-wrap">
      <div class="wrap">
        <div class="chart-wrap tpl-create-panel">
          <div class="chart-title"><span>Create Custom Template</span><span style="font-size:.72rem;color:var(--muted)">From your current portfolio</span></div>
          <div class="inp-2col">
            <div class="inp-group">
              <label class="inp-label">Template Name</label>
              <input class="inp" id="tpl-custom-name" placeholder="e.g. Recruiter Fast-Scan Layout">
            </div>
            <div class="inp-group">
              <label class="inp-label">Category</label>
              <select class="inp" id="tpl-custom-category">
                <option value="professional">professional</option>
                <option value="creative">creative</option>
                <option value="minimal">minimal</option>
                <option value="bold">bold</option>
                <option value="general">general</option>
              </select>
            </div>
          </div>
          <div class="inp-group">
            <label class="inp-label">Description</label>
            <textarea class="inp" id="tpl-custom-desc" rows="3" placeholder="What makes this template useful? Who should use it?"></textarea>
          </div>
          <label class="tpl-share-check">
            <input type="checkbox" id="tpl-custom-share" checked>
            Submit this template to marketplace (admin review required)
          </label>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
            <button class="btn btn-primary btn-sm" onclick="createCustomTemplate()">➕ Save Template</button>
            <button class="btn btn-ghost btn-sm" onclick="reloadTemplatesPage()">↻ Refresh List</button>
          </div>
        </div>

        <div class="chart-wrap" style="margin-top:14px">
          <div class="chart-title"><span>My Template Submissions</span><span style="font-size:.72rem;color:var(--muted)">${myTemplates.length} templates</span></div>
          <div class="my-template-list">${renderMyTemplateRows(myTemplates)}</div>
        </div>
      </div>
    </section>
  ` : `
    <section class="tpl-create-wrap">
      <div class="wrap">
        <div class="chart-wrap" style="text-align:center">
          <div style="font-family:var(--fh);font-size:1.2rem;font-weight:700;margin-bottom:6px">Want to publish your own template?</div>
          <p style="color:var(--muted);font-size:.86rem;margin-bottom:12px">Login, design your portfolio, then submit it as a reusable template for the community.</p>
          <a href="/login" class="btn btn-primary btn-sm">🔐 Login to Create Template</a>
        </div>
      </div>
    </section>
  `;

  return `
  <div style="padding-top:var(--nav-h)">
  <div class="templates-hero templates-hero-2026">
    <div class="wrap-sm">
      <div class="sec-eye" style="justify-content:center">Templates</div>
      <h1 style="font-family:var(--fh);font-size:clamp(1.9rem,4vw,3rem);font-weight:800;margin-bottom:12px">Find your <span class="grad-text">best-fit layout</span></h1>
      <p class="sec-sub tm" style="margin:0 auto">Search by style, audience, and mood. Start with a template, then customize deeply in Builder.</p>
      <div class="template-tool-row">
        <input id="tpl-search-input" class="inp" type="search" placeholder="Search templates by name, style, or use-case" autocomplete="off">
      </div>
      <div class="filter-bar" id="tpl-filter-bar">
        ${categories.map((cat, idx) => `<button class="flt-btn ${idx === 0 ? 'active' : ''}" data-tpl-filter="${cat}" onclick="filterTpl('${cat}',this)">${cat}</button>`).join('')}
      </div>
    </div>
  </div>

  ${customCreatorPanel}

  <div class="tpl-grid" id="tpl-grid">
    ${renderTemplateMarketplaceCards(templates)}
  </div>
  <div id="tpl-empty" class="manual-empty" style="max-width:900px;margin:0 auto 30px;display:none"></div>
  ${renderFooter()}
  </div>`;
}

let _tplActiveCategory = 'all';

function initTemplateFilters() {
  const input = document.getElementById('tpl-search-input');
  if (input && input.dataset.bound !== '1') {
    input.dataset.bound = '1';
    input.addEventListener('input', applyTemplateFilters);
  }
  applyTemplateFilters();
}

function filterTpl(cat, btn) {
  _tplActiveCategory = String(cat || 'all').toLowerCase();
  document.querySelectorAll('.flt-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  applyTemplateFilters();
}

function applyTemplateFilters() {
  const query = String(document.getElementById('tpl-search-input')?.value || '').trim().toLowerCase();
  const cards = [...document.querySelectorAll('#tpl-grid .tpl-card')];
  let visible = 0;

  cards.forEach((card) => {
    const cat = String(card.dataset.cat || '').toLowerCase();
    const searchable = `${card.dataset.name || ''} ${card.dataset.desc || ''} ${cat}`;
    const categoryOk = _tplActiveCategory === 'all' || cat === _tplActiveCategory;
    const searchOk = !query || searchable.includes(query);
    const show = categoryOk && searchOk;
    card.style.display = show ? '' : 'none';
    if (show) visible += 1;
  });

  const empty = document.getElementById('tpl-empty');
  if (!empty) return;
  if (visible > 0) {
    empty.style.display = 'none';
    empty.textContent = '';
    return;
  }

  empty.style.display = '';
  empty.textContent = query
    ? `No templates matched "${query}" in ${_tplActiveCategory === 'all' ? 'all categories' : _tplActiveCategory}.`
    : `No templates available in ${_tplActiveCategory}.`;
}

function useTemplate(theme) {
  const selectedTheme = encodeURIComponent(theme || 'cyberpunk');
  const templateId = arguments[1] ? encodeURIComponent(arguments[1]) : '';
  const qs = templateId ? `template=${templateId}&theme=${selectedTheme}` : `theme=${selectedTheme}`;
  window.location.href = `/builder?${qs}`;
}

function previewTemplate(theme) {
  const templateId = arguments[1] ? encodeURIComponent(arguments[1]) : '';
  const explicitDemo = String(arguments[2] || '').trim();
  if (explicitDemo.startsWith('/')) {
    window.open(explicitDemo, '_blank', 'noopener');
    return;
  }

  const selectedTheme = encodeURIComponent(theme || 'cyberpunk');
  const qs = templateId ? `template=${templateId}&theme=${selectedTheme}` : `theme=${selectedTheme}`;
  window.open(`/builder?${qs}`, '_blank', 'noopener');
}

async function reloadTemplatesPage() {
  const main = document.getElementById('main-content');
  if (!main) return;
  main.innerHTML = await renderTemplates();
  initTemplateFilters();
}

async function createCustomTemplate() {
  if (!Auth?.user) {
    window.location.href = '/login';
    return;
  }

  const name = String(document.getElementById('tpl-custom-name')?.value || '').trim();
  const description = String(document.getElementById('tpl-custom-desc')?.value || '').trim();
  const category = String(document.getElementById('tpl-custom-category')?.value || 'general').trim();
  const sharePublic = Boolean(document.getElementById('tpl-custom-share')?.checked);

  if (!name) {
    Toast.error('Template name is required.');
    return;
  }

  const res = await API.post('/api/templates/custom', {
    name,
    description,
    category,
    share_public: sharePublic,
  });

  if (!res.ok) {
    Toast.error(res.data?.error || 'Could not create template.');
    return;
  }

  Toast.success(res.data?.message || 'Template created.');
  await reloadTemplatesPage();
}

async function submitTemplateToMarketplace(templateId) {
  const tid = String(templateId || '').trim();
  if (!tid) return;

  const res = await API.post(`/api/templates/mine/${encodeURIComponent(tid)}/submit`, {});
  if (!res.ok) {
    Toast.error(res.data?.error || 'Unable to submit template.');
    return;
  }
  Toast.success(res.data?.message || 'Template submitted.');
  await reloadTemplatesPage();
}

async function deleteOwnedTemplate(templateId) {
  const tid = String(templateId || '').trim();
  if (!tid) return;

  if (!window.confirm('Delete this template permanently?')) return;
  const res = await API.delete(`/api/templates/mine/${encodeURIComponent(tid)}`);
  if (!res.ok) {
    Toast.error(res.data?.error || 'Unable to delete template.');
    return;
  }
  Toast.success('Template deleted.');
  await reloadTemplatesPage();
}

// ── PRICING (standalone) ──
function renderPricing() {
  return `
  <div class="pricing-page-2026" style="padding-top:var(--nav-h)">
    <section class="templates-hero" style="padding-bottom:28px">
      <div class="wrap-sm tc">
        <div class="sec-eye" style="justify-content:center">Pricing</div>
        <h1 class="sec-h2 font-h" style="margin-bottom:10px">Choose a plan that matches your <span class="grad-text">career velocity</span></h1>
        <p class="sec-sub tm" style="margin:0 auto">Start free, then scale when interviews, leads, or team workflows demand more.</p>
      </div>
    </section>

    ${renderPricingSection('pricing')}

    <section style="padding:0 0 clamp(52px,8vw,72px)">
      <div class="wrap">
        <div class="chart-wrap">
          <div class="chart-title"><span>Plan Comparison</span></div>
          <div style="overflow-x:auto">
            <table class="contacts-table">
              <tr><th>Capability</th><th>Free</th><th>Pro</th><th>Team</th></tr>
              <tr><td>Themes</td><td>3</td><td>All</td><td>All</td></tr>
              <tr><td>Section Capacity</td><td>5</td><td>50+</td><td>100+</td></tr>
              <tr><td>Analytics</td><td>Basic</td><td>Advanced</td><td>Advanced + Team</td></tr>
              <tr><td>Custom Domain</td><td>—</td><td>Included</td><td>Included</td></tr>
              <tr><td>Support</td><td>Community</td><td>Priority Email</td><td>SLA Priority</td></tr>
            </table>
          </div>
        </div>

        <div class="manual-flow-grid">
          <article class="manual-flow">
            <h3 class="docs-h3" style="margin-top:0">Can I switch anytime?</h3>
            <p class="docs-p" style="margin-bottom:0">Yes. Upgrade, downgrade, cancel, or resume auto-renew directly from Billing.</p>
          </article>
          <article class="manual-flow">
            <h3 class="docs-h3" style="margin-top:0">Yearly discount?</h3>
            <p class="docs-p" style="margin-bottom:0">Yearly cycle lowers effective monthly cost compared to month-by-month billing.</p>
          </article>
          <article class="manual-flow">
            <h3 class="docs-h3" style="margin-top:0">Need invoices?</h3>
            <p class="docs-p" style="margin-bottom:0">All successful membership charges appear in your Billing invoice history.</p>
          </article>
        </div>
      </div>
    </section>

    ${renderFooter()}
  </div>`;
}

// ── RESUME EDITOR ──
const RESUME_EDITOR_STATE = {
  profileId: '',
  activeResumeId: '',
  resumes: [],
  previewOnlyMode: false,
  title: 'Primary Resume',
  themeId: '',
  themes: [],
  content: null,
  dragSection: '',
  dragIndex: -1,
};

function normalizeResumeLayoutModeClient(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'compact' || raw === 'executive' || raw === 'ats-strict') return raw;
  return 'executive';
}

function resumeDefaultContent() {
  return {
    layout_mode: 'executive',
    basics: {
      full_name: Auth?.user?.name || 'Developer Name',
      role: 'Software Engineer',
      email: Auth?.user?.email || '',
      phone: '',
      location: '',
      website: '',
      linkedin: '',
      github: '',
      photo_url: '',
      summary: 'Outcome-focused engineer with strong product ownership and delivery discipline.',
    },
    skills: ['Python', 'JavaScript', 'React'],
    languages: [],
    experience: [
      {
        title: 'Software Engineer',
        company: 'Your Company',
        period: '2022 - Present',
        bullets: ['Delivered user-facing features with measurable quality and performance gains.'],
      },
    ],
    projects: [
      {
        title: 'Impact Project',
        description: 'Built an end-to-end product with measurable outcomes.',
        tech: ['Python', 'React'],
        link: '',
      },
    ],
    education: [
      {
        degree: 'B.Tech Computer Science',
        school: 'Your University',
        period: '2018 - 2022',
        details: '',
      },
    ],
    certifications: [],
    achievements: [],
    volunteer: [],
  };
}

function normalizeResumeContentClient(raw) {
  const base = resumeDefaultContent();
  const source = raw && typeof raw === 'object' ? raw : {};
  const basicsRaw = source.basics && typeof source.basics === 'object' ? source.basics : {};

  const normList = (value, maxItems = 12) => {
    const src = Array.isArray(value) ? value : String(value || '').split(/[\n,;]+/);
    const seen = new Set();
    const out = [];
    src.forEach((item) => {
      const txt = String(item || '').trim();
      if (!txt) return;
      const key = txt.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      out.push(txt);
    });
    return out.slice(0, maxItems);
  };

  const normBullets = (value, maxItems = 6) => {
    const src = Array.isArray(value) ? value : String(value || '').split(/\n+/);
    return src.map((item) => String(item || '').trim()).filter(Boolean).slice(0, maxItems);
  };

  const basics = {
    full_name: String(basicsRaw.full_name || base.basics.full_name).trim(),
    role: String(basicsRaw.role || base.basics.role).trim(),
    email: String(basicsRaw.email || base.basics.email).trim(),
    phone: String(basicsRaw.phone || '').trim(),
    location: String(basicsRaw.location || '').trim(),
    website: String(basicsRaw.website || '').trim(),
    linkedin: String(basicsRaw.linkedin || '').trim(),
    github: String(basicsRaw.github || '').trim(),
    photo_url: String(basicsRaw.photo_url || '').trim(),
    summary: String(basicsRaw.summary || base.basics.summary).trim(),
  };

  const experienceRaw = Array.isArray(source.experience) ? source.experience : [];
  const experience = experienceRaw.map((item) => ({
    title: String(item?.title || item?.role || '').trim(),
    company: String(item?.company || '').trim(),
    period: String(item?.period || '').trim(),
    bullets: normBullets(item?.bullets || item?.description || item?.desc),
  })).filter((item) => item.title || item.company || item.period || item.bullets.length).slice(0, 8);

  const projectsRaw = Array.isArray(source.projects) ? source.projects : [];
  const projects = projectsRaw.map((item) => ({
    title: String(item?.title || '').trim(),
    description: String(item?.description || item?.desc || '').trim(),
    tech: normList(item?.tech, 8),
    link: String(item?.link || item?.demo || item?.live || '').trim(),
  })).filter((item) => item.title || item.description || item.tech.length || item.link).slice(0, 8);

  const educationRaw = Array.isArray(source.education) ? source.education : [];
  const education = educationRaw.map((item) => ({
    degree: String(item?.degree || '').trim(),
    school: String(item?.school || '').trim(),
    period: String(item?.period || '').trim(),
    details: String(item?.details || item?.gpa || '').trim(),
  })).filter((item) => item.degree || item.school || item.period || item.details).slice(0, 5);

  const achievementsRaw = Array.isArray(source.achievements) ? source.achievements : [];
  const achievements = achievementsRaw.map((item) => ({
    title: String(item?.title || item?.name || '').trim(),
    issuer: String(item?.issuer || item?.organization || '').trim(),
    year: String(item?.year || item?.date || '').trim(),
    details: String(item?.details || item?.description || '').trim(),
  })).filter((item) => item.title || item.issuer || item.year || item.details).slice(0, 8);

  const volunteerSource = Array.isArray(source.volunteer)
    ? source.volunteer
    : (Array.isArray(source.volunteering) ? source.volunteering : []);
  const volunteer = volunteerSource.map((item) => ({
    role: String(item?.role || item?.title || '').trim(),
    organization: String(item?.organization || item?.company || '').trim(),
    period: String(item?.period || '').trim(),
    bullets: normBullets(item?.bullets || item?.details || item?.description || item?.desc, 4),
  })).filter((item) => item.role || item.organization || item.period || item.bullets.length).slice(0, 6);

  return {
    layout_mode: normalizeResumeLayoutModeClient(source.layout_mode || base.layout_mode),
    basics,
    skills: normList(source.skills, 30),
    languages: normList(source.languages, 12),
    experience: experience.length ? experience : base.experience,
    projects,
    education: education.length ? education : base.education,
    certifications: normList(source.certifications, 12),
    achievements,
    volunteer,
  };
}

function resumeEscAttr(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function resumeEscText(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function getResumeThemeById(themeId) {
  const list = Array.isArray(RESUME_EDITOR_STATE.themes) ? RESUME_EDITOR_STATE.themes : [];
  return list.find((theme) => theme.id === themeId) || list[0] || null;
}

function normalizeResumeDocumentClient(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  return {
    id: String(source.id || ''),
    title: String(source.title || 'Resume').trim() || 'Resume',
    theme_id: String(source.theme_id || ''),
    is_default: Boolean(source.is_default),
    content: normalizeResumeContentClient(source.content),
  };
}

function syncResumeEditorStateFromApi(data) {
  const payload = data && typeof data === 'object' ? data : {};
  const themes = Array.isArray(payload.themes) ? payload.themes : [];

  let docs = [];
  if (Array.isArray(payload.resumes)) docs = payload.resumes;
  else if (Array.isArray(payload.profiles)) docs = payload.profiles;
  else if (payload.profile && typeof payload.profile === 'object') docs = [payload.profile];

  const normalizedDocs = docs.map((item) => normalizeResumeDocumentClient(item)).filter((item) => item.id);

  const hintedActiveId = String(payload.active_resume_id || payload.profile?.id || '');
  let active = null;
  if (hintedActiveId) active = normalizedDocs.find((item) => item.id === hintedActiveId) || null;
  if (!active) active = normalizedDocs.find((item) => item.is_default) || null;
  if (!active && normalizedDocs.length) active = normalizedDocs[0];
  if (!active && payload.profile && typeof payload.profile === 'object') {
    active = normalizeResumeDocumentClient(payload.profile);
  }

  if (!active) {
    const fallbackTheme = themes[0]?.id || '';
    active = {
      id: '',
      title: 'Primary Resume',
      theme_id: fallbackTheme,
      is_default: true,
      content: resumeDefaultContent(),
    };
  }

  RESUME_EDITOR_STATE.themes = themes;
  RESUME_EDITOR_STATE.resumes = normalizedDocs.length ? normalizedDocs : [active];
  RESUME_EDITOR_STATE.profileId = String(active.id || '');
  RESUME_EDITOR_STATE.activeResumeId = String(active.id || '');
  RESUME_EDITOR_STATE.title = String(active.title || 'Primary Resume');
  RESUME_EDITOR_STATE.themeId = String(active.theme_id || themes[0]?.id || '');
  RESUME_EDITOR_STATE.content = normalizeResumeContentClient(active.content);
}

function getActiveResumeDocumentFromState() {
  const docs = Array.isArray(RESUME_EDITOR_STATE.resumes) ? RESUME_EDITOR_STATE.resumes : [];
  return docs.find((item) => item.id === RESUME_EDITOR_STATE.activeResumeId) || docs[0] || null;
}

function resumeStageDraftChanges() {
  const docs = Array.isArray(RESUME_EDITOR_STATE.resumes) ? RESUME_EDITOR_STATE.resumes : [];
  const idx = docs.findIndex((item) => item.id === RESUME_EDITOR_STATE.activeResumeId);
  if (idx < 0) return;
  docs[idx] = {
    ...docs[idx],
    title: String(RESUME_EDITOR_STATE.title || docs[idx].title || 'Resume').trim() || 'Resume',
    theme_id: String(RESUME_EDITOR_STATE.themeId || docs[idx].theme_id || ''),
    content: normalizeResumeContentClient(RESUME_EDITOR_STATE.content),
  };
}

function setResumeValueByPath(root, path, nextValue) {
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

function parseResumeInlineList(raw) {
  return String(raw || '')
    .split(/[|,\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function applyResumeInlineEdit(path, rawValue) {
  const cleanPath = String(path || '').trim();
  if (!cleanPath) return;

  const nextContent = normalizeResumeContentClient(RESUME_EDITOR_STATE.content);
  const raw = String(rawValue || '').trim();

  let changed = false;
  if (cleanPath === 'skills' || cleanPath === 'certifications' || cleanPath === 'languages') {
    changed = setResumeValueByPath(nextContent, cleanPath, parseResumeInlineList(raw));
  } else if (/\.tech$/.test(cleanPath)) {
    changed = setResumeValueByPath(nextContent, cleanPath, parseResumeInlineList(raw));
  } else {
    changed = setResumeValueByPath(nextContent, cleanPath, raw);
  }

  if (!changed) return;

  RESUME_EDITOR_STATE.content = nextContent;
  resumeStageDraftChanges();
  renderResumeEditorWorkspace();
}

function resumePlaceCaretAtEnd(el) {
  if (!el) return;
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const selection = window.getSelection();
  if (!selection) return;
  selection.removeAllRanges();
  selection.addRange(range);
}

function attachResumeInlineEditing() {
  const host = document.getElementById('resume-preview-panel');
  if (!host) return;
  const nodes = host.querySelectorAll('[data-resume-inline-edit]');
  if (!nodes.length) return;

  nodes.forEach((node) => {
    if (node.dataset.resumeInlineBound === '1') return;
    node.dataset.resumeInlineBound = '1';
    node.classList.add('resume-inline-edit');
    node.setAttribute('title', 'Click to edit inline');

    node.addEventListener('click', (event) => {
      if (node.getAttribute('contenteditable') === 'true') return;
      event.preventDefault();
      event.stopPropagation();

      node.dataset.resumeInlineBefore = String(node.textContent || '').trim();
      node.setAttribute('contenteditable', 'true');
      node.classList.add('is-editing');
      node.focus();
      resumePlaceCaretAtEnd(node);
    });

    node.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        node.dataset.resumeInlineCancel = '1';
        node.textContent = node.dataset.resumeInlineBefore || node.textContent;
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
      const path = node.dataset.resumeInlineEdit || '';
      const before = String(node.dataset.resumeInlineBefore || '').trim();
      const cancelled = node.dataset.resumeInlineCancel === '1';
      const after = String(node.textContent || '').trim();

      node.removeAttribute('contenteditable');
      node.classList.remove('is-editing');
      delete node.dataset.resumeInlineCancel;

      if (!path || cancelled) return;
      if (after === before) return;
      applyResumeInlineEdit(path, after);
    });
  });
}

function toggleResumePreviewOnlyMode(forceMode) {
  const next = typeof forceMode === 'boolean'
    ? forceMode
    : !Boolean(RESUME_EDITOR_STATE.previewOnlyMode);
  RESUME_EDITOR_STATE.previewOnlyMode = next;
  renderResumeEditorWorkspace();
}

function renderResumeEditorPage() {
  return `
  <div style="padding-top:var(--nav-h)">
    <section class="templates-hero" style="padding-bottom:20px">
      <div class="wrap-sm tc">
        <div class="sec-eye" style="justify-content:center">Resume Studio</div>
        <h1 class="sec-h2 font-h" style="margin-bottom:10px">Build role-ready resumes with <span class="grad-text">50 themes</span></h1>
        <p class="sec-sub tm" style="margin:0 auto">Edit your resume independently from your website portfolio. Save once, then export polished PDFs anytime.</p>
      </div>
    </section>
    <section style="padding:0 0 clamp(52px,8vw,72px)">
      <div class="wrap" id="resume-editor-root">
        <div class="chart-wrap" style="text-align:center;color:var(--muted)">Loading resume editor...</div>
      </div>
    </section>
    ${renderFooter()}
  </div>`;
}

async function initResumeEditorPage() {
  const res = await API.get('/api/resume/editor');
  const host = document.getElementById('resume-editor-root');
  if (!host) return;

  if (!res.ok || (!res.data?.profile && !Array.isArray(res.data?.resumes) && !Array.isArray(res.data?.profiles))) {
    host.innerHTML = `<div class="chart-wrap" style="color:#ef4444">${resumeEscText(res.data?.error || 'Unable to load resume profile right now.')}</div>`;
    return;
  }

  syncResumeEditorStateFromApi(res.data);

  renderResumeEditorWorkspace();
}

function renderResumeEditorWorkspace() {
  const host = document.getElementById('resume-editor-root');
  if (!host) return;

  const content = normalizeResumeContentClient(RESUME_EDITOR_STATE.content);
  RESUME_EDITOR_STATE.content = content;
  const resumeDocs = Array.isArray(RESUME_EDITOR_STATE.resumes) ? RESUME_EDITOR_STATE.resumes : [];
  const activeDoc = getActiveResumeDocumentFromState();

  host.innerHTML = `
    <div class="resume-editor-grid ${RESUME_EDITOR_STATE.previewOnlyMode ? 'preview-only' : ''}">
      <div class="resume-editor-left-pane">
        <div class="chart-wrap" style="margin-bottom:12px">
          <div class="chart-title"><span>Resume Controls</span><span class="tag tag-c">${(Array.isArray(RESUME_EDITOR_STATE.themes) ? RESUME_EDITOR_STATE.themes.length : 0)} themes</span></div>
          <div class="inp-group">
            <label class="inp-label">Resume Document</label>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <select class="inp" style="flex:1;min-width:190px" onchange="resumeSelectDocument(this.value)">
                ${resumeDocs.map((item) => `<option value="${resumeEscAttr(item.id)}" ${item.id === RESUME_EDITOR_STATE.activeResumeId ? 'selected' : ''}>${resumeEscText(item.title)}${item.is_default ? ' (default)' : ''}</option>`).join('')}
              </select>
              <button class="btn btn-ghost btn-sm" onclick="resumeCreateDocument('blank')">+ New</button>
              <button class="btn btn-ghost btn-sm" onclick="resumeCreateDocument('duplicate')">Duplicate</button>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
              <button class="btn btn-outline btn-sm" onclick="resumeImportFromPortfolio()">Import Portfolio</button>
              <button class="btn btn-outline btn-sm" onclick="resumeSetCurrentAsDefault()" ${activeDoc?.is_default ? 'disabled' : ''}>Set Default</button>
              <button class="btn btn-danger btn-sm" onclick="resumeDeleteCurrentDocument()" ${resumeDocs.length <= 1 ? 'disabled' : ''}>Delete</button>
            </div>
          </div>
          <div class="inp-group">
            <label class="inp-label">Resume Title</label>
            <input class="inp" id="resume-title-input" value="${resumeEscAttr(RESUME_EDITOR_STATE.title)}" oninput="resumeSetTitle(this.value)">
          </div>
          <div class="inp-group">
            <label class="inp-label">PDF Layout Mode</label>
            <div class="resume-layout-switch" role="group" aria-label="PDF Layout Mode">
              <button class="btn btn-sm ${content.layout_mode === 'compact' ? 'btn-primary' : 'btn-ghost'}" onclick="resumeSetLayoutMode('compact')">Compact</button>
              <button class="btn btn-sm ${content.layout_mode === 'executive' ? 'btn-primary' : 'btn-ghost'}" onclick="resumeSetLayoutMode('executive')">Executive</button>
              <button class="btn btn-sm ${content.layout_mode === 'ats-strict' ? 'btn-primary' : 'btn-ghost'}" onclick="resumeSetLayoutMode('ats-strict')">ATS-Strict</button>
            </div>
            <div class="resume-layout-help">Compact fits more content on fewer pages, Executive is balanced premium style, ATS-Strict uses minimal formatting for parser-friendly submissions.</div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn btn-primary btn-sm" onclick="saveResumeEditorProfile()">💾 Save Resume</button>
            <button class="btn btn-outline btn-sm" onclick="downloadResumeEditorPdf()">📄 Download PDF</button>
            <button class="btn btn-ghost btn-sm" onclick="toggleResumePreviewOnlyMode(true)">👁 Preview Only</button>
          </div>
          <div style="color:var(--muted2);font-size:.72rem;margin-top:8px">Themes move from Simple to Ultra. Select one to instantly update preview and PDF style.${activeDoc?.is_default ? ' This resume is currently default for public PDF.' : ''}</div>
          <div id="resume-theme-grid" class="resume-theme-grid" style="margin-top:10px"></div>
        </div>

        <div class="chart-wrap" style="margin-bottom:12px">
          <div class="chart-title"><span>Basics</span></div>
          <div class="inp-2col">
            <div class="inp-group"><label class="inp-label">Full Name</label><input class="inp" value="${resumeEscAttr(content.basics.full_name)}" oninput="resumeSetBasicField('full_name',this.value)"></div>
            <div class="inp-group"><label class="inp-label">Role</label><input class="inp" value="${resumeEscAttr(content.basics.role)}" oninput="resumeSetBasicField('role',this.value)"></div>
          </div>
          <div class="inp-2col">
            <div class="inp-group"><label class="inp-label">Email</label><input class="inp" value="${resumeEscAttr(content.basics.email)}" oninput="resumeSetBasicField('email',this.value)"></div>
            <div class="inp-group"><label class="inp-label">Phone</label><input class="inp" value="${resumeEscAttr(content.basics.phone)}" oninput="resumeSetBasicField('phone',this.value)"></div>
          </div>
          <div class="inp-2col">
            <div class="inp-group"><label class="inp-label">Location</label><input class="inp" value="${resumeEscAttr(content.basics.location)}" oninput="resumeSetBasicField('location',this.value)"></div>
            <div class="inp-group"><label class="inp-label">Website</label><input class="inp" value="${resumeEscAttr(content.basics.website)}" oninput="resumeSetBasicField('website',this.value)"></div>
          </div>
          <div class="inp-2col">
            <div class="inp-group"><label class="inp-label">LinkedIn</label><input class="inp" value="${resumeEscAttr(content.basics.linkedin)}" oninput="resumeSetBasicField('linkedin',this.value)"></div>
            <div class="inp-group"><label class="inp-label">GitHub</label><input class="inp" value="${resumeEscAttr(content.basics.github)}" oninput="resumeSetBasicField('github',this.value)"></div>
          </div>
          <div class="inp-2col">
            <div class="inp-group"><label class="inp-label">Photo URL (optional)</label><input class="inp" value="${resumeEscAttr(content.basics.photo_url || '')}" placeholder="/static/uploads/your-photo.jpg" oninput="resumeSetBasicField('photo_url',this.value)"></div>
            <div class="inp-group"><label class="inp-label">Upload Photo (optional)</label><input class="inp" type="file" accept="image/*" onchange="resumeUploadPhoto(this)"></div>
          </div>
          ${content.basics.photo_url ? `<div class="resume-photo-hint">Photo included in preview/PDF. <button class="btn btn-ghost btn-sm" style="padding:4px 8px" onclick="resumeClearPhoto()">Remove Photo</button></div>` : ''}
          <div class="inp-group"><label class="inp-label">Professional Summary</label><textarea class="inp" rows="4" oninput="resumeSetBasicField('summary',this.value)">${resumeEscText(content.basics.summary)}</textarea></div>
          <div class="inp-group"><label class="inp-label">Skills (comma-separated)</label><input class="inp" value="${resumeEscAttr((content.skills || []).join(', '))}" oninput="resumeSetSkillsInput(this.value)"></div>
          <div class="inp-group"><label class="inp-label">Languages (comma-separated)</label><input class="inp" value="${resumeEscAttr((content.languages || []).join(', '))}" oninput="resumeSetLanguagesInput(this.value)"></div>
          <div class="inp-group" style="margin-bottom:0"><label class="inp-label">Certifications (comma-separated)</label><input class="inp" value="${resumeEscAttr((content.certifications || []).join(', '))}" oninput="resumeSetCertificationsInput(this.value)"></div>
        </div>

        <div class="chart-wrap" style="margin-bottom:12px">
          <div class="chart-title"><span>Experience</span><button class="btn btn-ghost btn-sm" onclick="resumeAddExperience()">+ Add</button></div>
          <div id="resume-experience-editor"></div>
        </div>

        <div class="chart-wrap" style="margin-bottom:12px">
          <div class="chart-title"><span>Projects</span><button class="btn btn-ghost btn-sm" onclick="resumeAddProject()">+ Add</button></div>
          <div id="resume-projects-editor"></div>
        </div>

        <div class="chart-wrap">
          <div class="chart-title"><span>Education</span><button class="btn btn-ghost btn-sm" onclick="resumeAddEducation()">+ Add</button></div>
          <div id="resume-education-editor"></div>
        </div>

        <div class="chart-wrap" style="margin-top:12px">
          <div class="chart-title"><span>Volunteer Experience</span><button class="btn btn-ghost btn-sm" onclick="resumeAddVolunteer()">+ Add</button></div>
          <div id="resume-volunteer-editor"></div>
        </div>

        <div class="chart-wrap" style="margin-top:12px">
          <div class="chart-title"><span>Achievements</span><button class="btn btn-ghost btn-sm" onclick="resumeAddAchievement()">+ Add</button></div>
          <div id="resume-achievements-editor"></div>
        </div>
      </div>

      <div>
        <div class="chart-wrap" style="margin-bottom:10px">
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:space-between">
            <div style="font-size:.74rem;color:var(--muted)">Mode: ${RESUME_EDITOR_STATE.previewOnlyMode ? 'Inline Preview Only' : 'Form + Preview'} | PDF: ${content.layout_mode === 'compact' ? 'Compact' : (content.layout_mode === 'ats-strict' ? 'ATS-Strict' : 'Executive')}</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button class="btn btn-ghost btn-sm" onclick="toggleResumePreviewOnlyMode()">${RESUME_EDITOR_STATE.previewOnlyMode ? '🧰 Show Forms' : '👁 Inline Only'}</button>
              <button class="btn btn-primary btn-sm" onclick="saveResumeEditorProfile()">💾 Save</button>
              <button class="btn btn-outline btn-sm" onclick="downloadResumeEditorPdf()">📄 PDF</button>
            </div>
          </div>
        </div>
        <div class="chart-wrap resume-preview-wrap">
          <div class="chart-title"><span>Live Preview</span><span class="tag tag-g" id="resume-preview-theme-name"></span></div>
          <div id="resume-preview-panel"></div>
        </div>
      </div>
    </div>
  `;

  renderResumeThemeGrid();
  renderResumeExperienceEditor();
  renderResumeProjectsEditor();
  renderResumeEducationEditor();
  renderResumeVolunteerEditor();
  renderResumeAchievementsEditor();
  renderResumePreviewPanel();
}

function renderResumeThemeGrid() {
  const grid = document.getElementById('resume-theme-grid');
  if (!grid) return;
  const themes = Array.isArray(RESUME_EDITOR_STATE.themes) ? RESUME_EDITOR_STATE.themes : [];
  if (!themes.length) {
    grid.innerHTML = '<div style="color:var(--muted2);font-size:.76rem">Theme list unavailable.</div>';
    return;
  }

  grid.innerHTML = themes.map((theme) => `
    <button class="resume-theme-card ${RESUME_EDITOR_STATE.themeId === theme.id ? 'active' : ''}" onclick="resumeSelectTheme('${resumeEscAttr(theme.id)}')" style="--rtc-bg:${theme.bg};--rtc-accent:${theme.accent};--rtc-text:${theme.text}">
      <div class="resume-theme-head">${resumeEscText(theme.name)}</div>
      <div class="resume-theme-meta">${resumeEscText(theme.tier_label || theme.tier || '')}</div>
      <div class="resume-theme-swatch-row">
        <span style="background:${resumeEscAttr(theme.bg)}"></span>
        <span style="background:${resumeEscAttr(theme.accent)}"></span>
        <span style="background:${resumeEscAttr(theme.accent2)}"></span>
      </div>
    </button>
  `).join('');
}

function resumeMoveSectionItem(sectionKey, fromIndex, toIndex) {
  RESUME_EDITOR_STATE.content = normalizeResumeContentClient(RESUME_EDITOR_STATE.content);
  const rows = RESUME_EDITOR_STATE.content?.[sectionKey];
  if (!Array.isArray(rows)) return false;

  const from = Number(fromIndex);
  const to = Number(toIndex);
  if (!Number.isInteger(from) || !Number.isInteger(to)) return false;
  if (from < 0 || to < 0 || from >= rows.length || to >= rows.length || from === to) return false;

  const [moved] = rows.splice(from, 1);
  rows.splice(to, 0, moved);

  resumeStageDraftChanges();
  renderResumeEditorWorkspace();
  return true;
}

function resumeMoveExperience(index, delta) {
  const target = Number(index) + Number(delta || 0);
  resumeMoveSectionItem('experience', index, target);
}

function resumeMoveProject(index, delta) {
  const target = Number(index) + Number(delta || 0);
  resumeMoveSectionItem('projects', index, target);
}

function resumeMoveEducation(index, delta) {
  const target = Number(index) + Number(delta || 0);
  resumeMoveSectionItem('education', index, target);
}

function resumeMoveVolunteer(index, delta) {
  const target = Number(index) + Number(delta || 0);
  resumeMoveSectionItem('volunteer', index, target);
}

function resumeMoveAchievement(index, delta) {
  const target = Number(index) + Number(delta || 0);
  resumeMoveSectionItem('achievements', index, target);
}

function resumeStartDrag(sectionKey, index, event) {
  RESUME_EDITOR_STATE.dragSection = String(sectionKey || '');
  RESUME_EDITOR_STATE.dragIndex = Number(index);

  if (event?.currentTarget) {
    event.currentTarget.classList.add('is-dragging');
  }
  if (event?.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', `${RESUME_EDITOR_STATE.dragSection}:${RESUME_EDITOR_STATE.dragIndex}`);
  }
}

function resumeDragOver(event) {
  if (!event) return;
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
}

function resumeDragEnter(event) {
  if (!event?.currentTarget) return;
  event.preventDefault();
  event.currentTarget.classList.add('is-drop-target');
}

function resumeDragLeave(event) {
  if (!event?.currentTarget) return;
  event.currentTarget.classList.remove('is-drop-target');
}

function resumeDropOn(sectionKey, toIndex, event) {
  if (event) {
    event.preventDefault();
    if (event.currentTarget) event.currentTarget.classList.remove('is-drop-target');
  }

  const dragSection = String(RESUME_EDITOR_STATE.dragSection || '');
  const dragIndex = Number(RESUME_EDITOR_STATE.dragIndex);
  if (!dragSection || !Number.isInteger(dragIndex) || dragSection !== String(sectionKey || '')) {
    resumeDragEnd();
    return;
  }

  resumeMoveSectionItem(dragSection, dragIndex, Number(toIndex));
  resumeDragEnd();
}

function resumeDragEnd() {
  document.querySelectorAll('.resume-sortable-card.is-dragging, .resume-sortable-card.is-drop-target').forEach((node) => {
    node.classList.remove('is-dragging', 'is-drop-target');
  });
  RESUME_EDITOR_STATE.dragSection = '';
  RESUME_EDITOR_STATE.dragIndex = -1;
}

function renderResumeExperienceEditor() {
  const host = document.getElementById('resume-experience-editor');
  if (!host) return;
  const rows = RESUME_EDITOR_STATE.content?.experience || [];
  host.innerHTML = rows.map((item, idx) => `
    <div class="resume-row-card resume-sortable-card" draggable="true" ondragstart="resumeStartDrag('experience',${idx},event)" ondragover="resumeDragOver(event)" ondrop="resumeDropOn('experience',${idx},event)" ondragenter="resumeDragEnter(event)" ondragleave="resumeDragLeave(event)" ondragend="resumeDragEnd()">
      <div class="resume-row-head"><strong style="font-size:.8rem">Experience ${idx + 1}</strong><div class="resume-row-actions"><span class="resume-drag-label">Drag</span><button class="btn btn-ghost btn-sm" onclick="resumeMoveExperience(${idx},-1)" ${idx === 0 ? 'disabled' : ''}>↑</button><button class="btn btn-ghost btn-sm" onclick="resumeMoveExperience(${idx},1)" ${idx === rows.length - 1 ? 'disabled' : ''}>↓</button><button class="btn btn-danger btn-sm" onclick="resumeRemoveExperience(${idx})">Remove</button></div></div>
      <div class="inp-2col">
        <div class="inp-group"><label class="inp-label">Title</label><input class="inp" value="${resumeEscAttr(item.title || '')}" oninput="resumeSetExperienceField(${idx},'title',this.value)"></div>
        <div class="inp-group"><label class="inp-label">Company</label><input class="inp" value="${resumeEscAttr(item.company || '')}" oninput="resumeSetExperienceField(${idx},'company',this.value)"></div>
      </div>
      <div class="inp-group"><label class="inp-label">Period</label><input class="inp" value="${resumeEscAttr(item.period || '')}" oninput="resumeSetExperienceField(${idx},'period',this.value)"></div>
      <div class="inp-group" style="margin-bottom:0"><label class="inp-label">Bullets (one per line)</label><textarea class="inp" rows="4" oninput="resumeSetExperienceBullets(${idx},this.value)">${resumeEscText((item.bullets || []).join('\n'))}</textarea></div>
    </div>
  `).join('');
}

function renderResumeProjectsEditor() {
  const host = document.getElementById('resume-projects-editor');
  if (!host) return;
  const rows = RESUME_EDITOR_STATE.content?.projects || [];
  host.innerHTML = rows.map((item, idx) => `
    <div class="resume-row-card resume-sortable-card" draggable="true" ondragstart="resumeStartDrag('projects',${idx},event)" ondragover="resumeDragOver(event)" ondrop="resumeDropOn('projects',${idx},event)" ondragenter="resumeDragEnter(event)" ondragleave="resumeDragLeave(event)" ondragend="resumeDragEnd()">
      <div class="resume-row-head"><strong style="font-size:.8rem">Project ${idx + 1}</strong><div class="resume-row-actions"><span class="resume-drag-label">Drag</span><button class="btn btn-ghost btn-sm" onclick="resumeMoveProject(${idx},-1)" ${idx === 0 ? 'disabled' : ''}>↑</button><button class="btn btn-ghost btn-sm" onclick="resumeMoveProject(${idx},1)" ${idx === rows.length - 1 ? 'disabled' : ''}>↓</button><button class="btn btn-danger btn-sm" onclick="resumeRemoveProject(${idx})">Remove</button></div></div>
      <div class="inp-group"><label class="inp-label">Title</label><input class="inp" value="${resumeEscAttr(item.title || '')}" oninput="resumeSetProjectField(${idx},'title',this.value)"></div>
      <div class="inp-group"><label class="inp-label">Description</label><textarea class="inp" rows="3" oninput="resumeSetProjectField(${idx},'description',this.value)">${resumeEscText(item.description || '')}</textarea></div>
      <div class="inp-2col">
        <div class="inp-group"><label class="inp-label">Tech (comma-separated)</label><input class="inp" value="${resumeEscAttr((item.tech || []).join(', '))}" oninput="resumeSetProjectTech(${idx},this.value)"></div>
        <div class="inp-group"><label class="inp-label">Link</label><input class="inp" value="${resumeEscAttr(item.link || '')}" oninput="resumeSetProjectField(${idx},'link',this.value)"></div>
      </div>
    </div>
  `).join('');
}

function renderResumeEducationEditor() {
  const host = document.getElementById('resume-education-editor');
  if (!host) return;
  const rows = RESUME_EDITOR_STATE.content?.education || [];
  host.innerHTML = rows.map((item, idx) => `
    <div class="resume-row-card resume-sortable-card" draggable="true" ondragstart="resumeStartDrag('education',${idx},event)" ondragover="resumeDragOver(event)" ondrop="resumeDropOn('education',${idx},event)" ondragenter="resumeDragEnter(event)" ondragleave="resumeDragLeave(event)" ondragend="resumeDragEnd()">
      <div class="resume-row-head"><strong style="font-size:.8rem">Education ${idx + 1}</strong><div class="resume-row-actions"><span class="resume-drag-label">Drag</span><button class="btn btn-ghost btn-sm" onclick="resumeMoveEducation(${idx},-1)" ${idx === 0 ? 'disabled' : ''}>↑</button><button class="btn btn-ghost btn-sm" onclick="resumeMoveEducation(${idx},1)" ${idx === rows.length - 1 ? 'disabled' : ''}>↓</button><button class="btn btn-danger btn-sm" onclick="resumeRemoveEducation(${idx})">Remove</button></div></div>
      <div class="inp-2col">
        <div class="inp-group"><label class="inp-label">Degree</label><input class="inp" value="${resumeEscAttr(item.degree || '')}" oninput="resumeSetEducationField(${idx},'degree',this.value)"></div>
        <div class="inp-group"><label class="inp-label">School</label><input class="inp" value="${resumeEscAttr(item.school || '')}" oninput="resumeSetEducationField(${idx},'school',this.value)"></div>
      </div>
      <div class="inp-2col">
        <div class="inp-group"><label class="inp-label">Period</label><input class="inp" value="${resumeEscAttr(item.period || '')}" oninput="resumeSetEducationField(${idx},'period',this.value)"></div>
        <div class="inp-group"><label class="inp-label">Details</label><input class="inp" value="${resumeEscAttr(item.details || '')}" oninput="resumeSetEducationField(${idx},'details',this.value)"></div>
      </div>
    </div>
  `).join('');
}

function renderResumeVolunteerEditor() {
  const host = document.getElementById('resume-volunteer-editor');
  if (!host) return;
  const rows = RESUME_EDITOR_STATE.content?.volunteer || [];
  host.innerHTML = rows.map((item, idx) => `
    <div class="resume-row-card resume-sortable-card" draggable="true" ondragstart="resumeStartDrag('volunteer',${idx},event)" ondragover="resumeDragOver(event)" ondrop="resumeDropOn('volunteer',${idx},event)" ondragenter="resumeDragEnter(event)" ondragleave="resumeDragLeave(event)" ondragend="resumeDragEnd()">
      <div class="resume-row-head"><strong style="font-size:.8rem">Volunteer ${idx + 1}</strong><div class="resume-row-actions"><span class="resume-drag-label">Drag</span><button class="btn btn-ghost btn-sm" onclick="resumeMoveVolunteer(${idx},-1)" ${idx === 0 ? 'disabled' : ''}>↑</button><button class="btn btn-ghost btn-sm" onclick="resumeMoveVolunteer(${idx},1)" ${idx === rows.length - 1 ? 'disabled' : ''}>↓</button><button class="btn btn-danger btn-sm" onclick="resumeRemoveVolunteer(${idx})">Remove</button></div></div>
      <div class="inp-2col">
        <div class="inp-group"><label class="inp-label">Role</label><input class="inp" value="${resumeEscAttr(item.role || '')}" oninput="resumeSetVolunteerField(${idx},'role',this.value)"></div>
        <div class="inp-group"><label class="inp-label">Organization</label><input class="inp" value="${resumeEscAttr(item.organization || '')}" oninput="resumeSetVolunteerField(${idx},'organization',this.value)"></div>
      </div>
      <div class="inp-group"><label class="inp-label">Period</label><input class="inp" value="${resumeEscAttr(item.period || '')}" oninput="resumeSetVolunteerField(${idx},'period',this.value)"></div>
      <div class="inp-group" style="margin-bottom:0"><label class="inp-label">Impact Bullets (one per line)</label><textarea class="inp" rows="3" oninput="resumeSetVolunteerBullets(${idx},this.value)">${resumeEscText((item.bullets || []).join('\n'))}</textarea></div>
    </div>
  `).join('');
}

function renderResumeAchievementsEditor() {
  const host = document.getElementById('resume-achievements-editor');
  if (!host) return;
  const rows = RESUME_EDITOR_STATE.content?.achievements || [];
  host.innerHTML = rows.map((item, idx) => `
    <div class="resume-row-card resume-sortable-card" draggable="true" ondragstart="resumeStartDrag('achievements',${idx},event)" ondragover="resumeDragOver(event)" ondrop="resumeDropOn('achievements',${idx},event)" ondragenter="resumeDragEnter(event)" ondragleave="resumeDragLeave(event)" ondragend="resumeDragEnd()">
      <div class="resume-row-head"><strong style="font-size:.8rem">Achievement ${idx + 1}</strong><div class="resume-row-actions"><span class="resume-drag-label">Drag</span><button class="btn btn-ghost btn-sm" onclick="resumeMoveAchievement(${idx},-1)" ${idx === 0 ? 'disabled' : ''}>↑</button><button class="btn btn-ghost btn-sm" onclick="resumeMoveAchievement(${idx},1)" ${idx === rows.length - 1 ? 'disabled' : ''}>↓</button><button class="btn btn-danger btn-sm" onclick="resumeRemoveAchievement(${idx})">Remove</button></div></div>
      <div class="inp-2col">
        <div class="inp-group"><label class="inp-label">Title</label><input class="inp" value="${resumeEscAttr(item.title || '')}" oninput="resumeSetAchievementField(${idx},'title',this.value)"></div>
        <div class="inp-group"><label class="inp-label">Issuer</label><input class="inp" value="${resumeEscAttr(item.issuer || '')}" oninput="resumeSetAchievementField(${idx},'issuer',this.value)"></div>
      </div>
      <div class="inp-2col">
        <div class="inp-group"><label class="inp-label">Year</label><input class="inp" value="${resumeEscAttr(item.year || '')}" oninput="resumeSetAchievementField(${idx},'year',this.value)"></div>
        <div class="inp-group"><label class="inp-label">Details</label><input class="inp" value="${resumeEscAttr(item.details || '')}" oninput="resumeSetAchievementField(${idx},'details',this.value)"></div>
      </div>
    </div>
  `).join('');
}

function renderResumePreviewPanel() {
  const host = document.getElementById('resume-preview-panel');
  if (!host) return;
  const theme = getResumeThemeById(RESUME_EDITOR_STATE.themeId);
  if (!theme) {
    host.innerHTML = '<div style="color:var(--muted)">No theme selected.</div>';
    return;
  }

  const tname = document.getElementById('resume-preview-theme-name');
  if (tname) tname.textContent = theme.name;

  const c = normalizeResumeContentClient(RESUME_EDITOR_STATE.content);
  const basics = c.basics || {};
  const photoUrl = String(basics.photo_url || '').trim();
  const basicsMeta = [
    { key: 'email', value: basics.email },
    { key: 'phone', value: basics.phone },
    { key: 'location', value: basics.location },
    { key: 'website', value: basics.website },
  ].filter((item) => item.value);
  const basicsMetaHtml = basicsMeta
    .map((item, idx) => `${idx > 0 ? '<span style="opacity:.5"> | </span>' : ''}<span data-resume-inline-edit="basics.${item.key}">${resumeEscText(item.value)}</span>`)
    .join('');

  const style = [
    `background:${theme.panel}`,
    `color:${theme.text}`,
    `border:1px solid ${theme.line}`,
    `box-shadow:0 10px 30px rgba(0,0,0,.2)`,
  ].join(';');

  host.innerHTML = `
    <div style="font-size:.68rem;color:${theme.muted};margin:0 0 8px">Tip: click text in preview to edit inline.</div>
    <article class="resume-preview-sheet" style="${style}">
      <header style="border-bottom:2px solid ${theme.accent};padding-bottom:10px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
          <div style="min-width:0;flex:1">
            <div data-resume-inline-edit="basics.full_name" style="font-family:'${resumeEscAttr(theme.heading_family || 'Outfit')}',sans-serif;font-size:1.3rem;font-weight:800">${resumeEscText(basics.full_name || 'Developer')}</div>
            <div data-resume-inline-edit="basics.role" style="color:${theme.accent};font-weight:700;font-size:.9rem">${resumeEscText(basics.role || 'Software Engineer')}</div>
            <div style="color:${theme.muted};font-size:.75rem;margin-top:4px">${basicsMetaHtml || '<span data-resume-inline-edit="basics.email">your@email.com</span>'}</div>
          </div>
          ${photoUrl ? `<div class="resume-preview-photo"><img src="${resumeEscAttr(photoUrl)}" alt="Resume photo"></div>` : ''}
        </div>
      </header>

      ${basics.summary ? `<section class="resume-preview-sec"><h4 style="color:${theme.accent}">Summary</h4><p data-resume-inline-edit="basics.summary">${resumeEscText(basics.summary)}</p></section>` : ''}
      ${c.skills?.length ? `<section class="resume-preview-sec"><h4 style="color:${theme.accent}">Skills</h4><p data-resume-inline-edit="skills">${resumeEscText(c.skills.join(', '))}</p></section>` : ''}
      ${c.languages?.length ? `<section class="resume-preview-sec"><h4 style="color:${theme.accent}">Languages</h4><p data-resume-inline-edit="languages">${resumeEscText(c.languages.join(', '))}</p></section>` : ''}

      ${c.experience?.length ? `<section class="resume-preview-sec"><h4 style="color:${theme.accent}">Experience</h4>${c.experience.map((item, idx) => `
        <div style="margin-bottom:8px">
          <div style="display:flex;justify-content:space-between;gap:8px">
            <strong>
              <span data-resume-inline-edit="experience.${idx}.title">${resumeEscText(item.title || 'Role')}</span>${item.company ? ', ' : ''}<span data-resume-inline-edit="experience.${idx}.company">${resumeEscText(item.company || 'Company')}</span>
            </strong>
            <span data-resume-inline-edit="experience.${idx}.period" style="color:${theme.muted};font-size:.72rem">${resumeEscText(item.period || '')}</span>
          </div>
          ${(item.bullets || []).length ? `<ul style="margin:4px 0 0 16px">${item.bullets.map((b, bidx) => `<li data-resume-inline-edit="experience.${idx}.bullets.${bidx}">${resumeEscText(b)}</li>`).join('')}</ul>` : ''}
        </div>
      `).join('')}</section>` : ''}

      ${c.volunteer?.length ? `<section class="resume-preview-sec"><h4 style="color:${theme.accent}">Volunteer Experience</h4>${c.volunteer.map((item, idx) => `
        <div style="margin-bottom:8px">
          <div style="display:flex;justify-content:space-between;gap:8px">
            <strong>
              <span data-resume-inline-edit="volunteer.${idx}.role">${resumeEscText(item.role || 'Volunteer Role')}</span>${item.organization ? ', ' : ''}<span data-resume-inline-edit="volunteer.${idx}.organization">${resumeEscText(item.organization || 'Organization')}</span>
            </strong>
            <span data-resume-inline-edit="volunteer.${idx}.period" style="color:${theme.muted};font-size:.72rem">${resumeEscText(item.period || '')}</span>
          </div>
          ${(item.bullets || []).length ? `<ul style="margin:4px 0 0 16px">${item.bullets.map((b, bidx) => `<li data-resume-inline-edit="volunteer.${idx}.bullets.${bidx}">${resumeEscText(b)}</li>`).join('')}</ul>` : ''}
        </div>
      `).join('')}</section>` : ''}

      ${c.projects?.length ? `<section class="resume-preview-sec"><h4 style="color:${theme.accent}">Projects</h4>${c.projects.map((item, idx) => `
        <div style="margin-bottom:8px">
          <strong data-resume-inline-edit="projects.${idx}.title">${resumeEscText(item.title || 'Project')}</strong>
          ${item.description ? `<p data-resume-inline-edit="projects.${idx}.description" style="margin:3px 0">${resumeEscText(item.description)}</p>` : ''}
          ${(item.tech || []).length ? `<div data-resume-inline-edit="projects.${idx}.tech" style="color:${theme.muted};font-size:.72rem">${resumeEscText(item.tech.join(', '))}</div>` : ''}
          <div data-resume-inline-edit="projects.${idx}.link" style="color:${theme.muted};font-size:.72rem">${resumeEscText(item.link || 'add-project-link')}</div>
        </div>
      `).join('')}</section>` : ''}

      ${c.education?.length ? `<section class="resume-preview-sec"><h4 style="color:${theme.accent}">Education</h4>${c.education.map((item, idx) => `<div style="margin-bottom:6px"><strong><span data-resume-inline-edit="education.${idx}.degree">${resumeEscText(item.degree || 'Degree')}</span>${item.school ? ', ' : ''}<span data-resume-inline-edit="education.${idx}.school">${resumeEscText(item.school || 'School')}</span></strong><div style="color:${theme.muted};font-size:.72rem"><span data-resume-inline-edit="education.${idx}.period">${resumeEscText(item.period || '')}</span>${item.details ? ' | ' : ''}<span data-resume-inline-edit="education.${idx}.details">${resumeEscText(item.details || '')}</span></div></div>`).join('')}</section>` : ''}
      ${c.certifications?.length ? `<section class="resume-preview-sec"><h4 style="color:${theme.accent}">Certifications</h4><p data-resume-inline-edit="certifications">${resumeEscText(c.certifications.join(', '))}</p></section>` : ''}
      ${c.achievements?.length ? `<section class="resume-preview-sec"><h4 style="color:${theme.accent}">Achievements</h4>${c.achievements.map((item, idx) => `
        <div style="margin-bottom:6px">
          <strong data-resume-inline-edit="achievements.${idx}.title">${resumeEscText(item.title || 'Achievement')}</strong>
          <div style="color:${theme.muted};font-size:.72rem">
            <span data-resume-inline-edit="achievements.${idx}.issuer">${resumeEscText(item.issuer || '')}</span>${item.issuer && item.year ? ' | ' : ''}<span data-resume-inline-edit="achievements.${idx}.year">${resumeEscText(item.year || '')}</span>
          </div>
          ${item.details ? `<p data-resume-inline-edit="achievements.${idx}.details" style="margin:3px 0 0">${resumeEscText(item.details)}</p>` : ''}
        </div>
      `).join('')}</section>` : ''}
    </article>
  `;

  attachResumeInlineEditing();
}

function resumeSetTitle(value) {
  RESUME_EDITOR_STATE.title = String(value || '').trim();
  resumeStageDraftChanges();
}

function resumeSetLayoutMode(mode) {
  RESUME_EDITOR_STATE.content = normalizeResumeContentClient(RESUME_EDITOR_STATE.content);
  RESUME_EDITOR_STATE.content.layout_mode = normalizeResumeLayoutModeClient(mode);
  resumeStageDraftChanges();
  renderResumeEditorWorkspace();
}

function resumeSetBasicField(key, value) {
  RESUME_EDITOR_STATE.content = normalizeResumeContentClient(RESUME_EDITOR_STATE.content);
  RESUME_EDITOR_STATE.content.basics[key] = String(value || '');
  resumeStageDraftChanges();
  renderResumePreviewPanel();
}

function resumeSetSkillsInput(value) {
  RESUME_EDITOR_STATE.content = normalizeResumeContentClient(RESUME_EDITOR_STATE.content);
  RESUME_EDITOR_STATE.content.skills = String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
  resumeStageDraftChanges();
  renderResumePreviewPanel();
}

function resumeSetLanguagesInput(value) {
  RESUME_EDITOR_STATE.content = normalizeResumeContentClient(RESUME_EDITOR_STATE.content);
  RESUME_EDITOR_STATE.content.languages = String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
  resumeStageDraftChanges();
  renderResumePreviewPanel();
}

function resumeSetCertificationsInput(value) {
  RESUME_EDITOR_STATE.content = normalizeResumeContentClient(RESUME_EDITOR_STATE.content);
  RESUME_EDITOR_STATE.content.certifications = String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
  resumeStageDraftChanges();
  renderResumePreviewPanel();
}

async function resumeUploadPhoto(inputEl) {
  const file = inputEl?.files?.[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);

  let response;
  try {
    response = await fetch('/api/upload/image', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
  } catch (_) {
    Toast.error('Upload failed. Please try again.');
    if (inputEl) inputEl.value = '';
    return;
  }

  let payload = {};
  try {
    payload = await response.json();
  } catch (_) {
    payload = {};
  }

  if (!response.ok || !payload?.url) {
    Toast.error(payload?.error || 'Could not upload image');
    if (inputEl) inputEl.value = '';
    return;
  }

  RESUME_EDITOR_STATE.content = normalizeResumeContentClient(RESUME_EDITOR_STATE.content);
  RESUME_EDITOR_STATE.content.basics.photo_url = String(payload.url || '').trim();
  resumeStageDraftChanges();
  renderResumeEditorWorkspace();
  Toast.success('Photo uploaded');

  if (inputEl) inputEl.value = '';
}

function resumeClearPhoto() {
  RESUME_EDITOR_STATE.content = normalizeResumeContentClient(RESUME_EDITOR_STATE.content);
  RESUME_EDITOR_STATE.content.basics.photo_url = '';
  resumeStageDraftChanges();
  renderResumeEditorWorkspace();
}

function resumeSelectTheme(themeId) {
  RESUME_EDITOR_STATE.themeId = String(themeId || '').trim();
  resumeStageDraftChanges();
  renderResumeThemeGrid();
  renderResumePreviewPanel();
}

function resumeSelectDocument(resumeId) {
  const targetId = String(resumeId || '').trim();
  if (!targetId) return;

  resumeStageDraftChanges();

  const docs = Array.isArray(RESUME_EDITOR_STATE.resumes) ? RESUME_EDITOR_STATE.resumes : [];
  const target = docs.find((item) => item.id === targetId);
  if (!target) return;

  RESUME_EDITOR_STATE.activeResumeId = target.id;
  RESUME_EDITOR_STATE.profileId = target.id;
  RESUME_EDITOR_STATE.title = String(target.title || 'Resume');
  RESUME_EDITOR_STATE.themeId = String(target.theme_id || RESUME_EDITOR_STATE.themes[0]?.id || '');
  RESUME_EDITOR_STATE.content = normalizeResumeContentClient(target.content);

  renderResumeEditorWorkspace();
}

async function resumeCreateDocument(mode = 'blank') {
  const payload = {};
  if (mode === 'duplicate' && RESUME_EDITOR_STATE.activeResumeId) {
    payload.source_resume_id = RESUME_EDITOR_STATE.activeResumeId;
    payload.title = `${String(RESUME_EDITOR_STATE.title || 'Resume').trim() || 'Resume'} Copy`;
  } else if (mode === 'blank') {
    payload.title = 'New Resume';
  }

  const res = await API.post('/api/resume/editor/documents', payload);
  if (!res.ok || (!res.data?.profile && !Array.isArray(res.data?.resumes))) {
    Toast.error(res.data?.error || 'Unable to create resume');
    return;
  }

  syncResumeEditorStateFromApi(res.data);
  renderResumeEditorWorkspace();
  Toast.success('New resume created');
}

async function resumeImportFromPortfolio() {
  const res = await API.post('/api/resume/editor/import-portfolio', {});
  if (!res.ok || (!res.data?.profile && !Array.isArray(res.data?.resumes))) {
    Toast.error(res.data?.error || 'Unable to import from portfolio');
    return;
  }

  syncResumeEditorStateFromApi(res.data);
  renderResumeEditorWorkspace();
  Toast.success('Imported as a new resume');
}

async function resumeSetCurrentAsDefault() {
  const rid = String(RESUME_EDITOR_STATE.activeResumeId || '').trim();
  if (!rid) return;

  const res = await API.post(`/api/resume/editor/documents/${encodeURIComponent(rid)}/default`, {});
  if (!res.ok || (!res.data?.profile && !Array.isArray(res.data?.resumes))) {
    Toast.error(res.data?.error || 'Unable to set default resume');
    return;
  }

  syncResumeEditorStateFromApi(res.data);
  renderResumeEditorWorkspace();
  Toast.success('Default resume updated');
}

async function resumeDeleteCurrentDocument() {
  const rid = String(RESUME_EDITOR_STATE.activeResumeId || '').trim();
  if (!rid) return;

  const docs = Array.isArray(RESUME_EDITOR_STATE.resumes) ? RESUME_EDITOR_STATE.resumes : [];
  if (docs.length <= 1) {
    Toast.info('At least one resume is required.');
    return;
  }

  if (!window.confirm('Delete this resume document? This action cannot be undone.')) {
    return;
  }

  const res = await API.delete(`/api/resume/editor/documents/${encodeURIComponent(rid)}`);
  if (!res.ok || (!res.data?.profile && !Array.isArray(res.data?.resumes))) {
    Toast.error(res.data?.error || 'Unable to delete resume');
    return;
  }

  syncResumeEditorStateFromApi(res.data);
  renderResumeEditorWorkspace();
  Toast.success('Resume deleted');
}

function resumeAddExperience() {
  RESUME_EDITOR_STATE.content = normalizeResumeContentClient(RESUME_EDITOR_STATE.content);
  const rows = RESUME_EDITOR_STATE.content?.experience || [];
  if (rows.length >= 8) { Toast.info('Max 8 experience items.'); return; }
  rows.push({ title: '', company: '', period: '', bullets: [''] });
  resumeStageDraftChanges();
  renderResumeExperienceEditor();
  renderResumePreviewPanel();
}

function resumeRemoveExperience(index) {
  RESUME_EDITOR_STATE.content = normalizeResumeContentClient(RESUME_EDITOR_STATE.content);
  const rows = RESUME_EDITOR_STATE.content?.experience || [];
  if (index < 0 || index >= rows.length) return;
  rows.splice(index, 1);
  if (!rows.length) rows.push({ title: '', company: '', period: '', bullets: [''] });
  resumeStageDraftChanges();
  renderResumeExperienceEditor();
  renderResumePreviewPanel();
}

function resumeSetExperienceField(index, key, value) {
  RESUME_EDITOR_STATE.content = normalizeResumeContentClient(RESUME_EDITOR_STATE.content);
  const rows = RESUME_EDITOR_STATE.content?.experience || [];
  if (!rows[index]) return;
  rows[index][key] = String(value || '');
  resumeStageDraftChanges();
  renderResumePreviewPanel();
}

function resumeSetExperienceBullets(index, value) {
  RESUME_EDITOR_STATE.content = normalizeResumeContentClient(RESUME_EDITOR_STATE.content);
  const rows = RESUME_EDITOR_STATE.content?.experience || [];
  if (!rows[index]) return;
  rows[index].bullets = String(value || '').split(/\n+/).map((item) => item.trim()).filter(Boolean);
  resumeStageDraftChanges();
  renderResumePreviewPanel();
}

function resumeAddProject() {
  RESUME_EDITOR_STATE.content = normalizeResumeContentClient(RESUME_EDITOR_STATE.content);
  const rows = RESUME_EDITOR_STATE.content?.projects || [];
  if (rows.length >= 8) { Toast.info('Max 8 project items.'); return; }
  rows.push({ title: '', description: '', tech: [], link: '' });
  resumeStageDraftChanges();
  renderResumeProjectsEditor();
  renderResumePreviewPanel();
}

function resumeRemoveProject(index) {
  RESUME_EDITOR_STATE.content = normalizeResumeContentClient(RESUME_EDITOR_STATE.content);
  const rows = RESUME_EDITOR_STATE.content?.projects || [];
  if (index < 0 || index >= rows.length) return;
  rows.splice(index, 1);
  resumeStageDraftChanges();
  renderResumeProjectsEditor();
  renderResumePreviewPanel();
}

function resumeSetProjectField(index, key, value) {
  RESUME_EDITOR_STATE.content = normalizeResumeContentClient(RESUME_EDITOR_STATE.content);
  const rows = RESUME_EDITOR_STATE.content?.projects || [];
  if (!rows[index]) return;
  rows[index][key] = String(value || '');
  resumeStageDraftChanges();
  renderResumePreviewPanel();
}

function resumeSetProjectTech(index, value) {
  RESUME_EDITOR_STATE.content = normalizeResumeContentClient(RESUME_EDITOR_STATE.content);
  const rows = RESUME_EDITOR_STATE.content?.projects || [];
  if (!rows[index]) return;
  rows[index].tech = String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
  resumeStageDraftChanges();
  renderResumePreviewPanel();
}

function resumeAddEducation() {
  RESUME_EDITOR_STATE.content = normalizeResumeContentClient(RESUME_EDITOR_STATE.content);
  const rows = RESUME_EDITOR_STATE.content?.education || [];
  if (rows.length >= 5) { Toast.info('Max 5 education items.'); return; }
  rows.push({ degree: '', school: '', period: '', details: '' });
  resumeStageDraftChanges();
  renderResumeEducationEditor();
  renderResumePreviewPanel();
}

function resumeRemoveEducation(index) {
  RESUME_EDITOR_STATE.content = normalizeResumeContentClient(RESUME_EDITOR_STATE.content);
  const rows = RESUME_EDITOR_STATE.content?.education || [];
  if (index < 0 || index >= rows.length) return;
  rows.splice(index, 1);
  if (!rows.length) rows.push({ degree: '', school: '', period: '', details: '' });
  resumeStageDraftChanges();
  renderResumeEducationEditor();
  renderResumePreviewPanel();
}

function resumeSetEducationField(index, key, value) {
  RESUME_EDITOR_STATE.content = normalizeResumeContentClient(RESUME_EDITOR_STATE.content);
  const rows = RESUME_EDITOR_STATE.content?.education || [];
  if (!rows[index]) return;
  rows[index][key] = String(value || '');
  resumeStageDraftChanges();
  renderResumePreviewPanel();
}

function resumeAddVolunteer() {
  RESUME_EDITOR_STATE.content = normalizeResumeContentClient(RESUME_EDITOR_STATE.content);
  const rows = RESUME_EDITOR_STATE.content?.volunteer || [];
  if (rows.length >= 6) { Toast.info('Max 6 volunteer items.'); return; }
  rows.push({ role: '', organization: '', period: '', bullets: [] });
  resumeStageDraftChanges();
  renderResumeVolunteerEditor();
  renderResumePreviewPanel();
}

function resumeRemoveVolunteer(index) {
  RESUME_EDITOR_STATE.content = normalizeResumeContentClient(RESUME_EDITOR_STATE.content);
  const rows = RESUME_EDITOR_STATE.content?.volunteer || [];
  if (index < 0 || index >= rows.length) return;
  rows.splice(index, 1);
  resumeStageDraftChanges();
  renderResumeVolunteerEditor();
  renderResumePreviewPanel();
}

function resumeSetVolunteerField(index, key, value) {
  RESUME_EDITOR_STATE.content = normalizeResumeContentClient(RESUME_EDITOR_STATE.content);
  const rows = RESUME_EDITOR_STATE.content?.volunteer || [];
  if (!rows[index]) return;
  rows[index][key] = String(value || '');
  resumeStageDraftChanges();
  renderResumePreviewPanel();
}

function resumeSetVolunteerBullets(index, value) {
  RESUME_EDITOR_STATE.content = normalizeResumeContentClient(RESUME_EDITOR_STATE.content);
  const rows = RESUME_EDITOR_STATE.content?.volunteer || [];
  if (!rows[index]) return;
  rows[index].bullets = String(value || '').split(/\n+/).map((item) => item.trim()).filter(Boolean);
  resumeStageDraftChanges();
  renderResumePreviewPanel();
}

function resumeAddAchievement() {
  RESUME_EDITOR_STATE.content = normalizeResumeContentClient(RESUME_EDITOR_STATE.content);
  const rows = RESUME_EDITOR_STATE.content?.achievements || [];
  if (rows.length >= 8) { Toast.info('Max 8 achievement items.'); return; }
  rows.push({ title: '', issuer: '', year: '', details: '' });
  resumeStageDraftChanges();
  renderResumeAchievementsEditor();
  renderResumePreviewPanel();
}

function resumeRemoveAchievement(index) {
  RESUME_EDITOR_STATE.content = normalizeResumeContentClient(RESUME_EDITOR_STATE.content);
  const rows = RESUME_EDITOR_STATE.content?.achievements || [];
  if (index < 0 || index >= rows.length) return;
  rows.splice(index, 1);
  resumeStageDraftChanges();
  renderResumeAchievementsEditor();
  renderResumePreviewPanel();
}

function resumeSetAchievementField(index, key, value) {
  RESUME_EDITOR_STATE.content = normalizeResumeContentClient(RESUME_EDITOR_STATE.content);
  const rows = RESUME_EDITOR_STATE.content?.achievements || [];
  if (!rows[index]) return;
  rows[index][key] = String(value || '');
  resumeStageDraftChanges();
  renderResumePreviewPanel();
}

function buildResumeEditorPayload() {
  const normalizedContent = normalizeResumeContentClient(RESUME_EDITOR_STATE.content);
  return {
    resume_id: String(RESUME_EDITOR_STATE.activeResumeId || RESUME_EDITOR_STATE.profileId || '').trim(),
    title: String(RESUME_EDITOR_STATE.title || 'Primary Resume').trim() || 'Primary Resume',
    theme_id: RESUME_EDITOR_STATE.themeId,
    layout_mode: normalizeResumeLayoutModeClient(normalizedContent.layout_mode),
    content: normalizedContent,
  };
}

async function saveResumeEditorProfile() {
  const payload = buildResumeEditorPayload();
  const res = await API.put('/api/resume/editor', payload);
  if (!res.ok || (!res.data?.profile && !Array.isArray(res.data?.resumes) && !Array.isArray(res.data?.profiles))) {
    Toast.error(res.data?.error || 'Unable to save resume');
    return;
  }

  syncResumeEditorStateFromApi(res.data);
  renderResumeEditorWorkspace();
  Toast.success('Resume saved');
}

async function downloadResumeEditorPdf() {
  const payload = buildResumeEditorPayload();
  const res = await fetch('/api/resume/editor/pdf', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let errorPayload = {};
    try {
      errorPayload = await res.json();
    } catch (_) {
      errorPayload = {};
    }
    Toast.error(errorPayload?.error || 'Unable to download PDF');
    return;
  }

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const disposition = String(res.headers.get('Content-Disposition') || '');
  const match = disposition.match(/filename="?([^";]+)"?/i);
  const filename = (match && match[1]) ? match[1] : 'resume.pdf';

  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
  Toast.success('Resume PDF downloaded');
}

// ── FOOTER ──
function renderFooter() {
  return `
  <footer id="footer">
    <div class="wrap">
      <div class="foot-grid">
        <div>
          <a href="/" style="display:inline-flex;align-items:center;gap:8px;font-family:var(--fd);font-weight:700;font-size:1.05rem"><div style="width:30px;height:30px;background:var(--grad);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:.85rem;color:#000;font-weight:900">⚡</div><span class="grad-text">QuickFolio</span></a>
          <p class="foot-desc">The most powerful full-stack developer portfolio builder. Build, customize, publish, and grow your online presence.</p>
          <div class="foot-badges">
            <span class="foot-badge">Fast UX Engine</span>
            <span class="foot-badge">ATS-Ready Resume</span>
            <span class="foot-badge">Analytics-Driven</span>
          </div>
          <div class="foot-socials">
            <a class="foot-social" href="${getQuickFolioMailHref('QuickFolio Footer Inquiry')}" title="Email" aria-label="Email">${getBrandIconSvg('mail')}</a>
            <a class="foot-social" href="${SACHIN_PORTFOLIO_PROFILE.links.github}" target="_blank" rel="noopener" title="GitHub" aria-label="GitHub">${getBrandIconSvg('github')}</a>
            <a class="foot-social" href="${SACHIN_PORTFOLIO_PROFILE.links.x}" target="_blank" rel="noopener" title="Twitter / X" aria-label="Twitter / X">𝕏</a>
            <a class="foot-social" href="${SACHIN_PORTFOLIO_PROFILE.links.linkedin}" target="_blank" rel="noopener" title="LinkedIn" aria-label="LinkedIn">${getBrandIconSvg('linkedin')}</a>
            <a class="foot-social" href="${SACHIN_PORTFOLIO_PROFILE.links.instagram}" target="_blank" rel="noopener" title="Instagram" aria-label="Instagram">◎</a>
          </div>
        </div>
        <div>
          <div class="foot-col-h">Product</div>
          <a class="foot-a" href="/builder">Portfolio Builder</a>
          <a class="foot-a" href="/resume-editor">Resume Editor</a>
          <a class="foot-a" href="/templates">Templates</a>
          <a class="foot-a" href="/pricing">Pricing</a>
          <a class="foot-a" href="/billing">Billing</a>
          <a class="foot-a" href="/manual">Manual</a>
        </div>
        <div>
          <div class="foot-col-h">Company</div>
          <a class="foot-a" href="/about">About Us</a>
          <a class="foot-a" href="/about">Careers</a>
          <a class="foot-a" href="${getQuickFolioMailHref('QuickFolio Website Inquiry')}">✉ Mail Us</a>
          <a class="foot-a" href="mailto:${QUICKFOLIO_CONTACT_EMAIL}">${QUICKFOLIO_CONTACT_EMAIL}</a>
          <a class="foot-a" href="/privacy">Privacy Policy</a>
          <a class="foot-a" href="/terms">Terms of Service</a>
        </div>
        <div>
          <div class="foot-col-h">Tech Stack</div>
          <div class="foot-a">🐍 Python / Flask</div>
          <div class="foot-a">🗄️ SQLite Database</div>
          <div class="foot-a">⚡ Vanilla JS</div>
          <div class="foot-a">🤖 NLP AI Chatbot</div>
        </div>
      </div>
      <div class="foot-bottom">
        <div class="foot-copy">© ${new Date().getFullYear()} QuickFolio. Built with 💙 for developers everywhere.</div>
        <div class="foot-techs">
          <span class="foot-tech">Flask</span><span class="foot-tech">SQLite</span>
          <span class="foot-tech">Python 3.12</span><span class="foot-tech">Vanilla JS</span>
        </div>
      </div>
    </div>
  </footer>`;
}
