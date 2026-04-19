/* ══════════════════════════════════════
   DATA.JS — themes, sections, defaults
══════════════════════════════════════ */

const THEMES = {
  cyberpunk:{
    id:'cyberpunk',name:'Cyberpunk',emoji:'⚡',
    bg:'#0a0a0f',surface:'#11111c',card:'#18182a',border:'#28284a',border2:'#3a3a60',
    accent:'#00ffcc',accent2:'#ff00aa',text:'#dde0ff',muted:'#6060a0',
    grad:'linear-gradient(135deg,#00ffcc,#ff00aa)',
    font:"'Orbitron',monospace",body:"'DM Mono',monospace",
    label:'Orbitron'
  },
  aurora:{
    id:'aurora',name:'Aurora',emoji:'🌌',
    bg:'#050510',surface:'#0c0c20',card:'#12123a',border:'#1e1e50',border2:'#2a2a66',
    accent:'#7c3aed',accent2:'#06b6d4',text:'#e2e8f0',muted:'#64748b',
    grad:'linear-gradient(135deg,#7c3aed,#06b6d4)',
    font:"'Syne',sans-serif",body:"'Outfit',sans-serif",
    label:'Syne'
  },
  obsidian:{
    id:'obsidian',name:'Obsidian',emoji:'🖤',
    bg:'#09090b',surface:'#111113',card:'#1c1c1f',border:'#28282c',border2:'#3a3a40',
    accent:'#f59e0b',accent2:'#ef4444',text:'#fafafa',muted:'#71717a',
    grad:'linear-gradient(135deg,#f59e0b,#ef4444)',
    font:"'Syne',sans-serif",body:"'Outfit',sans-serif",
    label:'Syne'
  },
  forest:{
    id:'forest',name:'Forest',emoji:'🌲',
    bg:'#050f08',surface:'#091610',card:'#0e2016',border:'#18361e',border2:'#224a28',
    accent:'#22c55e',accent2:'#84cc16',text:'#f0fdf4',muted:'#4d7c5a',
    grad:'linear-gradient(135deg,#22c55e,#84cc16)',
    font:"'Syne',sans-serif",body:"'Outfit',sans-serif",
    label:'Syne'
  },
  ocean:{
    id:'ocean',name:'Ocean',emoji:'🌊',
    bg:'#020b18',surface:'#041525',card:'#071e35',border:'#0c3050',border2:'#144070',
    accent:'#38bdf8',accent2:'#818cf8',text:'#f0f9ff',muted:'#4a7a9b',
    grad:'linear-gradient(135deg,#38bdf8,#818cf8)',
    font:"'Orbitron',monospace",body:"'Outfit',sans-serif",
    label:'Orbitron'
  },
  sunset:{
    id:'sunset',name:'Sunset Ember',emoji:'🌅',
    bg:'#120a08',surface:'#1f110d',card:'#2b1711',border:'#4a2518',border2:'#6a3220',
    accent:'#fb7185',accent2:'#f59e0b',text:'#fff5ef',muted:'#d8a18b',
    grad:'linear-gradient(135deg,#fb7185,#f59e0b)',
    font:"'Syne',sans-serif",body:"'Outfit',sans-serif",
    label:'Syne'
  },
  graphite:{
    id:'graphite',name:'Graphite',emoji:'🪨',
    bg:'#0b0c10',surface:'#12141b',card:'#1c1f2b',border:'#2b3142',border2:'#3a435b',
    accent:'#93c5fd',accent2:'#e2e8f0',text:'#f8fafc',muted:'#94a3b8',
    grad:'linear-gradient(135deg,#93c5fd,#e2e8f0)',
    font:"'Outfit',sans-serif",body:"'Outfit',sans-serif",
    label:'Outfit'
  },
  citrus:{
    id:'citrus',name:'Citrus Spark',emoji:'🍋',
    bg:'#0c1208',surface:'#141f10',card:'#1b2a15',border:'#2b4520',border2:'#3f602c',
    accent:'#a3e635',accent2:'#facc15',text:'#f7fee7',muted:'#a3b585',
    grad:'linear-gradient(135deg,#a3e635,#facc15)',
    font:"'Syne',sans-serif",body:"'Outfit',sans-serif",
    label:'Syne'
  },
  lavender:{
    id:'lavender',name:'Lavender Drift',emoji:'💜',
    bg:'#0b0816',surface:'#161128',card:'#211a38',border:'#372a56',border2:'#4d3a76',
    accent:'#a78bfa',accent2:'#f472b6',text:'#f5f3ff',muted:'#b3a4d9',
    grad:'linear-gradient(135deg,#a78bfa,#f472b6)',
    font:"'Syne',sans-serif",body:"'Outfit',sans-serif",
    label:'Syne'
  },
  steel:{
    id:'steel',name:'Steel Grid',emoji:'🔩',
    bg:'#06090f',surface:'#0e1522',card:'#152033',border:'#22334f',border2:'#2e466c',
    accent:'#60a5fa',accent2:'#22d3ee',text:'#e0ecff',muted:'#7f95b7',
    grad:'linear-gradient(135deg,#60a5fa,#22d3ee)',
    font:"'Orbitron',monospace",body:"'DM Mono',monospace",
    label:'Orbitron'
  },
  mint:{
    id:'mint',name:'Mint Glass',emoji:'🌿',
    bg:'#07120f',surface:'#0c1c18',card:'#112824',border:'#1d3f37',border2:'#2a5a4f',
    accent:'#34d399',accent2:'#22d3ee',text:'#ecfdf5',muted:'#87b7a6',
    grad:'linear-gradient(135deg,#34d399,#22d3ee)',
    font:"'Outfit',sans-serif",body:"'Outfit',sans-serif",
    label:'Outfit'
  },
  ruby:{
    id:'ruby',name:'Ruby Night',emoji:'❤️',
    bg:'#14070a',surface:'#210d13',card:'#2e141e',border:'#4a1f2e',border2:'#65293f',
    accent:'#f43f5e',accent2:'#fb7185',text:'#fff1f2',muted:'#d59aa6',
    grad:'linear-gradient(135deg,#f43f5e,#fb7185)',
    font:"'Syne',sans-serif",body:"'Outfit',sans-serif",
    label:'Syne'
  },
  glacier:{
    id:'glacier',name:'Glacier',emoji:'🧊',
    bg:'#06131a',surface:'#0b202b',card:'#123040',border:'#1e4a61',border2:'#2b6581',
    accent:'#67e8f9',accent2:'#38bdf8',text:'#ecfeff',muted:'#93b7c8',
    grad:'linear-gradient(135deg,#67e8f9,#38bdf8)',
    font:"'Orbitron',monospace",body:"'Outfit',sans-serif",
    label:'Orbitron'
  },
  bronze:{
    id:'bronze',name:'Bronze Studio',emoji:'🥉',
    bg:'#140f08',surface:'#21170d',card:'#2f2012',border:'#49311b',border2:'#654625',
    accent:'#f59e0b',accent2:'#fb7185',text:'#fff7ed',muted:'#d4ac7b',
    grad:'linear-gradient(135deg,#f59e0b,#fb7185)',
    font:"'Syne',sans-serif",body:"'Outfit',sans-serif",
    label:'Syne'
  },
  ivory:{
    id:'ivory',name:'Ivory Modern',emoji:'🤍',
    bg:'#f8fafc',surface:'#ffffff',card:'#f1f5f9',border:'#dbe3ee',border2:'#c5d1e2',
    accent:'#2563eb',accent2:'#0ea5e9',text:'#0f172a',muted:'#475569',
    grad:'linear-gradient(135deg,#2563eb,#0ea5e9)',
    font:"'Syne',sans-serif",body:"'Outfit',sans-serif",
    label:'Syne'
  },
  neon:{
    id:'neon',name:'Neon Flux',emoji:'✨',
    bg:'#050507',surface:'#0a0a12',card:'#121226',border:'#222244',border2:'#313163',
    accent:'#22d3ee',accent2:'#a3e635',text:'#ecfeff',muted:'#8aa5c2',
    grad:'linear-gradient(135deg,#22d3ee,#a3e635)',
    font:"'Orbitron',monospace",body:"'DM Mono',monospace",
    label:'Orbitron'
  },
  plum:{
    id:'plum',name:'Plum Noir',emoji:'🍇',
    bg:'#120816',surface:'#1c1022',card:'#281733',border:'#3b2550',border2:'#52356d',
    accent:'#c084fc',accent2:'#f472b6',text:'#faf5ff',muted:'#b9a2d6',
    grad:'linear-gradient(135deg,#c084fc,#f472b6)',
    font:"'Syne',sans-serif",body:"'Outfit',sans-serif",
    label:'Syne'
  },
  sand:{
    id:'sand',name:'Sandstone',emoji:'🏜️',
    bg:'#161208',surface:'#221a0f',card:'#2e2314',border:'#45331c',border2:'#604824',
    accent:'#fbbf24',accent2:'#fb7185',text:'#fff7db',muted:'#d2b98a',
    grad:'linear-gradient(135deg,#fbbf24,#fb7185)',
    font:"'Outfit',sans-serif",body:"'Outfit',sans-serif",
    label:'Outfit'
  },
  nature:{
    id:'nature',name:'Nature Distilled',emoji:'🍃',
    bg:'#f5f1e7',surface:'#efe7d8',card:'#fff9ef',border:'#d8c9b0',border2:'#bda17c',
    accent:'#7b6a52',accent2:'#c38e56',text:'#2f2a24',muted:'#746757',
    grad:'linear-gradient(135deg,#7b6a52,#c38e56)',
    font:"'Fraunces',serif",body:"'Manrope',sans-serif",
    label:'Fraunces'
  },
  editorial:{
    id:'editorial',name:'Editorial Edge',emoji:'📰',
    bg:'#f3f4f6',surface:'#ffffff',card:'#f8fafc',border:'#d7dbe3',border2:'#b6c0cf',
    accent:'#111827',accent2:'#ef4444',text:'#0f172a',muted:'#4b5563',
    grad:'linear-gradient(135deg,#111827,#ef4444)',
    font:"'Fraunces',serif",body:"'Sora',sans-serif",
    label:'Fraunces'
  },
  dopamine:{
    id:'dopamine',name:'Dopamine Pop',emoji:'🎉',
    bg:'#13061e',surface:'#1f0830',card:'#2a0f3f',border:'#5a2d7b',border2:'#7d3aac',
    accent:'#ff5f1f',accent2:'#00f5d4',text:'#fff7fb',muted:'#d7b9dd',
    grad:'linear-gradient(135deg,#ff5f1f,#00f5d4)',
    font:"'Space Grotesk',sans-serif",body:"'Sora',sans-serif",
    label:'Space Grotesk'
  },
  brutalist:{
    id:'brutalist',name:'Elevated Brutalism',emoji:'🧱',
    bg:'#f8f8f8',surface:'#f1f1f1',card:'#ffffff',border:'#161616',border2:'#2d2d2d',
    accent:'#111111',accent2:'#ff3b30',text:'#101010',muted:'#525252',
    grad:'linear-gradient(135deg,#111111,#ff3b30)',
    font:"'Space Grotesk',sans-serif",body:"'Manrope',sans-serif",
    label:'Space Grotesk'
  },
  custom:{
    id:'custom',name:'Custom Lab',emoji:'🎨',
    bg:'#0a0a0f',surface:'#11111c',card:'#18182a',border:'#28284a',border2:'#3a3a60',
    accent:'#00ffcc',accent2:'#ff00aa',text:'#dde0ff',muted:'#6060a0',
    grad:'linear-gradient(135deg,#00ffcc,#ff00aa)',
    font:"'Orbitron',monospace",body:"'DM Mono',monospace",
    label:'Custom'
  },
};

window.QUICKFOLIO_THEME_BANK = THEMES;
window.QuickFolio_THEME_BANK = THEMES;

const SECTION_INFO = {
  hero:     {label:'Hero / Banner',    icon:'👋'},
  about:    {label:'About Me',         icon:'🙋'},
  skills:   {label:'Skills & Stack',   icon:'🛠️'},
  projects: {label:'Projects',         icon:'📁'},
  experience:{label:'Experience',      icon:'💼'},
  education:{label:'Education',        icon:'🎓'},
  stats:    {label:'Stats Counter',    icon:'📈'},
  timeline: {label:'Timeline',         icon:'⏳'},
  testimonials:{label:'Testimonials',  icon:'💬'},
  contact:  {label:'Contact',          icon:'📧'},
};

const DEFAULT_DATA = {
  hero:{
    name:'Alex Chen',
    title:'Full-Stack Developer & UI Architect',
    tagline:'Building digital experiences that matter',
    subtitle:'React · Node.js · Python · Cloud',
    cta:'View My Work',
    github:'github.com/alexchen',
    linkedin:'linkedin.com/in/alexchen',
    twitter:'@alexchen_dev',
    photo_url:'',
    photo_size:170,
    photo_shape:'circle',
    photo_offset_x:0,
    photo_offset_y:0,
    recruiter_mode_enabled:false,
    design:{
      bg_image_url:'',
      bg_size:100,
      bg_overlay:45,
      bg_pos_x:50,
      bg_pos_y:50,
      text_scale:100,
      heading_scale:100,
      body_scale:100,
      section_spacing:80,
      card_radius:16,
      text_color:'',
      accent_color:'',
      bg_color:'',
      surface_color:'',
      card_color:'',
      border_color:'',
      border2_color:'',
      accent2_color:'',
      muted_color:'',
      custom_theme_name:'My Custom Theme',
      heading_font:'default',
      body_font:'default',
      section_scales:{
        hero:100,
        about:100,
        skills:100,
        projects:100,
        experience:100,
        education:100,
        stats:100,
        timeline:100,
        testimonials:100,
        contact:100,
      },
      section_fonts:{
        hero:'default',
        about:'default',
        skills:'default',
        projects:'default',
        experience:'default',
        education:'default',
        stats:'default',
        timeline:'default',
        testimonials:'default',
        contact:'default',
      }
    }
  },
  about:{
    bio:"I'm a passionate full-stack developer with 5+ years of experience crafting scalable web applications. I turn complex problems into elegant solutions and thrive in collaborative environments where creativity meets technical precision.",
    location:'Delhi , IN',
    availability:'Open to opportunities',
    highlights:['5+ Years Experience','50+ Projects Delivered','Open Source Contributor'],
  },
  skills:{
    categories:[
      {name:'Frontend', items:[{n:'React',v:95},{n:'TypeScript',v:90},{n:'CSS/Tailwind',v:88},{n:'Next.js',v:85}]},
      {name:'Backend',  items:[{n:'Node.js',v:92},{n:'Python',v:85},{n:'PostgreSQL',v:80},{n:'MongoDB',v:78}]},
      {name:'DevOps',   items:[{n:'Docker',v:75},{n:'AWS',v:70},{n:'CI/CD',v:72},{n:'Kubernetes',v:60}]},
    ]
  },
  projects:{
    items:[
      {title:'NeuroTask AI', desc:'AI-powered project management with smart task prioritization', tech:['React','Python','OpenAI'], emoji:'🤖', featured:true,  link:'https://example.com/neurotask', github:'https://github.com/alexchen/neurotask-ai'},
      {title:'CryptoWatch',  desc:'Real-time crypto portfolio tracker with advanced analytics',  tech:['Vue','Node.js','WebSocket'], emoji:'📈', featured:true,  link:'https://example.com/cryptowatch', github:'https://github.com/alexchen/cryptowatch'},
      {title:'EcoCommute',   desc:'Sustainable commute planner reducing carbon footprint 40%',  tech:['React Native','Firebase','Maps API'], emoji:'🌱', featured:false, link:'https://example.com/ecocommute', github:'https://github.com/alexchen/ecocommute'},
      {title:'DevCollab',    desc:'Real-time code collaboration for distributed teams',          tech:['React','WebRTC','Node'], emoji:'👥', featured:false, link:'https://example.com/devcollab', github:'https://github.com/alexchen/devcollab'},
    ]
  },
  experience:{
    items:[
      {role:'Senior Frontend Engineer', company:'TechCorp Inc.',  period:'2022 – Present', desc:'Led frontend architecture for 3 major product lines, mentored 5 junior devs, reduced bundle size by 45%.',         tech:['React','TypeScript','GraphQL']},
      {role:'Full-Stack Developer',     company:'StartupXYZ',     period:'2020 – 2022',    desc:'Built MVP from scratch to 50K users, implemented real-time features, and set up CI/CD pipelines from day one.',  tech:['Vue','Node.js','MongoDB']},
      {role:'Junior Developer',         company:'Digital Agency',  period:'2018 – 2020',    desc:'Developed client websites and e-commerce solutions, improved site performance by 60% across 12 projects.',      tech:['JavaScript','PHP','MySQL']},
    ]
  },
  education:{
    items:[
      {degree:'B.S. Computer Science', school:'UC Berkeley', period:'2014 – 2018', gpa:'3.8/4.0', highlights:["Dean's List","Hackathon Winner","Teaching Assistant"]},
    ]
  },
  stats:{
    items:[
      {label:'Projects Completed', value:50,   suffix:'+'},
      {label:'Happy Clients',      value:30,   suffix:'+'},
      {label:'GitHub Stars',       value:1200, suffix:'+'},
      {label:'Cups of Coffee',     value:999,  suffix:'∞'},
    ]
  },
  timeline:{
    items:[
      {year:'2024', title:'Tech Lead Promotion',    desc:'Promoted to Tech Lead, managing a team of 8 engineers across 3 time zones.'},
      {year:'2022', title:'Joined TechCorp',        desc:'Joined as Senior Frontend Engineer, scaling products to millions of daily active users.'},
      {year:'2020', title:'First Full-Time Role',   desc:'Landed first full-time developer position at a Y-Combinator backed startup.'},
      {year:'2019', title:'Freelance Journey',      desc:'Started freelancing, built 15+ projects for international clients worldwide.'},
      {year:'2018', title:'Graduated University',   desc:'Graduated with honors in Computer Science from UC Berkeley.'},
    ]
  },
  testimonials:{
    items:[
      {name:'Sarah Johnson', role:'CTO @ StartupCo',       text:'Alex delivered exceptional work that exceeded our expectations. Their technical expertise and communication skills are outstanding.',              avatar:'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'},
      {name:'Mike Peters',   role:'Product Manager @ Tech', text:'One of the best developers I\'ve worked with. An amazing ability to translate business requirements into elegant, working solutions.',               avatar:'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike'},
      {name:'Priya Sharma',  role:'Lead Designer @ Hub',    text:"Alex's attention to detail and pixel-perfect implementation made our designs come to life exactly as we envisioned.", avatar:'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya'},
    ]
  },
  contact:{
    email:'alex@example.com',
    phone:'+1 (555) 123-4567',
    message:"Got a project in mind? Let's build something amazing together!",
  },
};

const TEMPLATES = [
  {name:'Neon Night',       theme:'cyberpunk', cat:'bold',         emoji:'🌃', desc:'High-energy cyberpunk aesthetic with glowing neon accents. Perfect for frontend and game developers.',        tags:['Bold','Dark','Neon']},
  {name:'Aurora Borealis',  theme:'aurora',    cat:'creative',     emoji:'🌌', desc:'Cosmic purple-cyan gradient theme. Makes a dramatic first impression for creative full-stack developers.',    tags:['Creative','Space','Gradient']},
  {name:'Dark Executive',   theme:'obsidian',  cat:'professional', emoji:'🖤', desc:'Sleek obsidian with gold accents. The go-to choice for senior engineers and system architects.',            tags:['Professional','Minimal','Corporate']},
  {name:'Green Machine',    theme:'forest',    cat:'minimal',      emoji:'🌿', desc:'Clean forest green palette. Calm, focused, and memorable. Great for backend and data engineers.',           tags:['Minimal','Nature','Calm']},
  {name:'Deep Ocean',       theme:'ocean',     cat:'creative',     emoji:'🌊', desc:'Cool ocean blues with indigo undertones. Perfect for full-stack and cloud infrastructure engineers.',        tags:['Creative','Cool','Fluid']},
  {name:'Classic Dark Pro', theme:'obsidian',  cat:'professional', emoji:'⚫', desc:'Traditional dark theme done with exceptional taste. Timeless, clean, and recruiter-approved.',             tags:['Professional','Clean','Timeless']},
  {name:'Nature Distilled', theme:'nature',    cat:'minimal',      emoji:'🍃', desc:'Earthy palette with editorial serif heading style. Great for designers, product engineers, and sustainability portfolios.', tags:['Minimal','Warm','Editorial']},
  {name:'Editorial Edge',   theme:'editorial', cat:'professional', emoji:'📰', desc:'High-contrast, type-led layout inspired by modern editorial landing pages. Ideal for senior profiles and case studies.', tags:['Professional','Light','Bold Type']},
  {name:'Dopamine Pop',     theme:'dopamine',  cat:'bold',         emoji:'🎉', desc:'Vibrant, high-energy gradient mood with playful emphasis and motion-ready contrasts.', tags:['Bold','Vibrant','Gen Z']},
  {name:'Brutalist Signal', theme:'brutalist', cat:'bold',         emoji:'🧱', desc:'Crisp anti-design inspired contrast with red accent punches for standout personal brands.', tags:['Bold','Light','Statement']},
];
