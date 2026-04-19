/* ════════ CHATBOT.JS ════════ */

const Chatbot = {
  sessionId: generateId ? generateId() : Math.random().toString(36).slice(2),
  isOpen: false,
  messageCount: 0,

  async init(containerId = 'global-chatbot') {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = this.buildHTML();
    this.bindEvents();
    // Show welcome after 3s
    setTimeout(() => this.showNotification(), 3000);
  },

  buildHTML() {
    return `
    <button class="cb-fab" id="cb-fab" onclick="Chatbot.toggle()" title="Chat with AI Assistant">
      CHAT
      <span class="cb-notif" id="cb-notif" style="display:none">1</span>
    </button>
    <div class="cb-win" id="cb-win">
      <div class="cb-head">
        <div class="cb-head-l">
          <div class="cb-avatar-wrap">
            <div class="cb-av">AI</div>
            <div class="cb-online"></div>
          </div>
          <div class="cb-head-info">
            <div class="cb-name">QuickFolio Assistant</div>
            <div class="cb-status"><span style="width:5px;height:5px;border-radius:50%;background:#22c55e;display:inline-block"></span> Always online</div>
          </div>
        </div>
        <button class="cb-close" onclick="Chatbot.toggle()">X</button>
      </div>
      <div class="cb-messages" id="cb-messages">
        <div class="cb-msg cb-bot-msg">
          Hi. I am <strong>QuickFolio Assistant</strong>.<br><br>
          Ask me about <strong>latest features</strong>, <strong>resume PDF modes</strong>, <strong>performance</strong>, <strong>pricing</strong>, or <strong>deployment</strong>.
        </div>
        <div class="cb-quick-wrap">
          <button class="cb-q" onclick="Chatbot.send('How do resume PDF layout modes work?')">Resume PDF</button>
          <button class="cb-q" onclick="Chatbot.send('What are the latest platform features?')">Latest features</button>
          <button class="cb-q" onclick="Chatbot.send('How do I improve portfolio speed?')">Performance</button>
          <button class="cb-q" onclick="Chatbot.send('How do I publish and deploy fast?')">Publish</button>
        </div>
      </div>
      <div class="cb-suggestions" id="cb-suggestions">
        <button class="cb-sug" onclick="Chatbot.send('Explain ATS-Strict resume mode')">ATS-Strict</button>
        <button class="cb-sug" onclick="Chatbot.send('Show live pricing plans')">Live pricing</button>
        <button class="cb-sug" onclick="Chatbot.send('What can Command Center do?')">Command Center</button>
      </div>
      <div class="cb-foot">
        <textarea class="cb-inp" id="cb-inp" placeholder="Ask anything..." rows="1" 
          onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();Chatbot.send()}"
          oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,80)+'px'"></textarea>
        <button class="cb-send" onclick="Chatbot.send()">Send</button>
      </div>
    </div>`;
  },

  bindEvents() {
    // Keyboard shortcut
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault(); this.toggle();
      }
    });
  },

  toggle() {
    this.isOpen = !this.isOpen;
    const win = document.getElementById('cb-win');
    const fab = document.getElementById('cb-fab');
    const notif = document.getElementById('cb-notif');
    if (!win) return;
    win.classList.toggle('open', this.isOpen);
    if (fab) fab.innerHTML = this.isOpen ? 'X' : 'CHAT<span class="cb-notif" id="cb-notif" style="display:none">1</span>';
    if (this.isOpen) {
      if (notif) notif.style.display = 'none';
      const inp = document.getElementById('cb-inp');
      if (inp) setTimeout(() => inp.focus(), 100);
    }
  },

  showNotification() {
    if (!this.isOpen) {
      const notif = document.getElementById('cb-notif');
      if (notif) notif.style.display = 'flex';
    }
  },

  async send(text) {
    const inp = document.getElementById('cb-inp');
    const message = text || (inp ? inp.value.trim() : '');
    if (!message) return;
    if (inp) { inp.value = ''; inp.style.height = 'auto'; }

    this.addMessage(message, 'user');
    this.showTyping();
    this.messageCount++;

    try {
      const res = await API.post('/api/chatbot', {
        message,
        session_id: this.sessionId,
        portfolio_id: ''
      });

      this.hideTyping();
      if (res.ok) {
        // Parse markdown-like formatting
        const reply = res.data.reply.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
        this.addMessage(reply, 'bot', true);
        if (Array.isArray(res.data.suggestions) && res.data.suggestions.length) {
          this.addSuggestions(res.data.suggestions);
        }
      } else {
        this.addMessage("Sorry, I am having trouble connecting. Please try again.", 'bot');
      }
    } catch (_) {
      this.hideTyping();
      this.addMessage("Network error. Please check your connection.", 'bot');
    }
  },

  addMessage(text, type, isHTML = false) {
    const msgs = document.getElementById('cb-messages');
    if (!msgs) return;
    const div = document.createElement('div');
    div.className = `cb-msg ${type === 'user' ? 'cb-user-msg' : 'cb-bot-msg'}`;
    if (isHTML) div.innerHTML = text;
    else div.textContent = text;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  },

  addSuggestions(suggestions) {
    const msgs = document.getElementById('cb-messages');
    if (!msgs || !Array.isArray(suggestions) || !suggestions.length) return;

    const unique = [...new Set(
      suggestions
        .map((item) => String(item || '').trim())
        .filter(Boolean)
    )].slice(0, 4);

    if (!unique.length) return;

    const wrap = document.createElement('div');
    wrap.className = 'cb-quick-wrap';

    unique.forEach((question) => {
      const btn = document.createElement('button');
      btn.className = 'cb-q';
      btn.type = 'button';
      btn.textContent = question;
      btn.addEventListener('click', () => this.send(question));
      wrap.appendChild(btn);
    });

    msgs.appendChild(wrap);
    msgs.scrollTop = msgs.scrollHeight;
  },

  showTyping() {
    const msgs = document.getElementById('cb-messages');
    if (!msgs) return;
    const div = document.createElement('div');
    div.className = 'cb-msg cb-bot-msg'; div.id = 'cb-typing';
    div.innerHTML = '<div class="cb-typing-wrap"><div class="cb-typing-dot"></div><div class="cb-typing-dot"></div><div class="cb-typing-dot"></div></div>';
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  },

  hideTyping() {
    const t = document.getElementById('cb-typing');
    if (t) t.remove();
  }
};

// ── PORTFOLIO CHATBOT (for public portfolio pages) ──
const PortfolioChatbot = {
  sessionId: Math.random().toString(36).slice(2),
  portfolioSlug: '',

  init(containerId, slug, theme) {
    this.portfolioSlug = slug;
    const container = document.getElementById(containerId);
    if (!container) return;
    const t = theme || {};
    container.innerHTML = this.buildHTML(t);
  },

  buildHTML(t) {
    const g = t.grad || 'linear-gradient(135deg,#00ffcc,#ff00aa)';
    const accent = t.accent || '#00ffcc';
    const bg = t.surface || '#11111c';
    const card = t.card || '#18182a';
    const border = t.border || '#28284a';
    const text = t.text || '#dde0ff';
    const muted = t.muted || '#6060a0';
    const name = t.ownerName || 'this developer';

    return `
    <button id="pf-cb-fab" onclick="PortfolioChatbot.toggle()" style="position:fixed;bottom:24px;right:24px;width:52px;height:52px;border-radius:50%;border:none;font-size:.68rem;font-weight:800;letter-spacing:.4px;display:flex;align-items:center;justify-content:center;z-index:900;cursor:pointer;background:${g};box-shadow:0 8px 28px ${accent}45;animation:float 3.5s ease-in-out infinite;transition:transform .2s">CHAT</button>
    <div id="pf-cb-win" style="display:none;position:fixed;bottom:88px;right:24px;width:clamp(265px,88vw,330px);height:430px;background:${bg};border:1px solid ${border};border-radius:18px;z-index:901;flex-direction:column;overflow:hidden;box-shadow:0 16px 50px rgba(0,0,0,.6)">
      <div style="padding:12px 14px;background:${g};display:flex;align-items:center;justify-content:space-between">
        <div style="display:flex;align-items:center;gap:9px">
          <div style="width:30px;height:30px;border-radius:50%;background:rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:800">AI</div>
          <div>
            <div style="font-weight:800;font-size:.82rem;color:#000">Portfolio Assistant</div>
            <div style="font-size:.63rem;color:rgba(0,0,0,.6);display:flex;align-items:center;gap:3px"><span style="width:5px;height:5px;border-radius:50%;background:#22c55e;display:inline-block"></span> Online now</div>
          </div>
        </div>
        <button onclick="PortfolioChatbot.toggle()" style="background:none;border:none;font-size:.9rem;color:rgba(0,0,0,.55);cursor:pointer">X</button>
      </div>
      <div id="pf-cb-msgs" style="flex:1;overflow-y:auto;padding:11px;display:flex;flex-direction:column;gap:8px">
        <div style="max-width:84%;padding:8px 11px;border-radius:12px;font-size:.78rem;line-height:1.5;background:${card};border:1px solid ${border};color:${text}">
          Hi. I am the portfolio assistant. Ask me about <strong style="color:${accent}">projects</strong>, <strong style="color:${accent}">tech stack</strong>, <strong style="color:${accent}">availability</strong>, or <strong style="color:${accent}">contact</strong>.
        </div>
        <div style="display:flex;gap:5px;flex-wrap:wrap">
          ${['Top projects','Tech stack','Availability','Contact options'].map(q=>`<button onclick="PortfolioChatbot.send('${q}')" style="font-size:.67rem;padding:3px 8px;border-radius:8px;cursor:pointer;font-weight:700;background:${accent}12;border:1px solid ${accent}30;color:${accent}">${q}</button>`).join('')}
        </div>
      </div>
      <div style="padding:8px 10px;border-top:1px solid ${border};display:flex;gap:7px;background:rgba(0,0,0,.2)">
        <input id="pf-cb-inp" style="flex:1;background:${card};border:1.5px solid ${border};border-radius:8px;padding:8px 11px;color:${text};font-size:.78rem;outline:none;transition:.2s" placeholder="Ask anything..."
          onkeydown="if(event.key==='Enter')PortfolioChatbot.send()"
          onfocus="this.style.borderColor='${accent}'" onblur="this.style.borderColor='${border}'">
        <button onclick="PortfolioChatbot.send()" style="background:${g};border:none;border-radius:7px;padding:8px 11px;font-size:.7rem;font-weight:700;cursor:pointer;transition:transform .2s" onmouseover="this.style.transform='scale(1.08)'" onmouseout="this.style.transform='scale(1)'">Send</button>
      </div>
    </div>`;
  },

  toggle() {
    const win = document.getElementById('pf-cb-win');
    const fab = document.getElementById('pf-cb-fab');
    if (!win) return;
    const isOpen = win.style.display === 'flex';
    win.style.display = isOpen ? 'none' : 'flex';
    win.style.flexDirection = 'column';
    win.style.animation = 'fadeUp .25s ease';
    if (fab) fab.textContent = isOpen ? 'CHAT' : 'X';
  },

  async send(text) {
    const inp = document.getElementById('pf-cb-inp');
    const msgs = document.getElementById('pf-cb-msgs');
    const message = text || (inp ? inp.value.trim() : '');
    if (!message || !msgs) return;
    if (inp) inp.value = '';

    const t = (window.PORTFOLIO_DATA?.portfolio) || {};
    const accent = t.accent || '#00ffcc';
    const card = t.card || '#18182a';
    const border = t.border || '#28284a';
    const textColor = t.text || '#dde0ff';
    const g = t.grad || 'linear-gradient(135deg,#00ffcc,#ff00aa)';

    msgs.innerHTML += `<div style="max-width:84%;padding:8px 11px;border-radius:12px;font-size:.78rem;line-height:1.5;background:${g};color:#000;font-weight:600;align-self:flex-end;margin-left:auto;border-bottom-right-radius:3px">${message}</div>`;
    msgs.scrollTop = msgs.scrollHeight;

    // Typing indicator
    const typingId = 'pf-typing-' + Date.now();
    msgs.innerHTML += `<div id="${typingId}" style="max-width:84%;padding:8px 11px;border-radius:12px;border-bottom-left-radius:3px;background:${card};border:1px solid ${border};color:${textColor}"><div style="display:flex;gap:4px">${[0,.16,.32].map(d=>`<div style="width:6px;height:6px;border-radius:50%;background:#888;animation:dot-bounce 1.4s ${d}s ease-in-out infinite"></div>`).join('')}</div></div>`;
    msgs.scrollTop = msgs.scrollHeight;

    try {
      const res = await fetch('/api/chatbot', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ message, session_id: this.sessionId, portfolio_id: window.PORTFOLIO_DATA?.portfolio?.id || '' })
      });
      const data = await res.json();
      document.getElementById(typingId)?.remove();
      const reply = (data.reply || "I am not sure about that. Try asking the owner directly.").replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
      msgs.innerHTML += `<div style="max-width:84%;padding:8px 11px;border-radius:12px;border-bottom-left-radius:3px;background:${card};border:1px solid ${border};color:${textColor};font-size:.78rem;line-height:1.5">${reply}</div>`;
      if (Array.isArray(data.suggestions) && data.suggestions.length) {
        this.addSuggestions(msgs, data.suggestions, accent);
      }
    } catch (_) {
      document.getElementById(typingId)?.remove();
      msgs.innerHTML += `<div style="max-width:84%;padding:8px 11px;border-radius:12px;background:${card};border:1px solid ${border};color:${textColor};font-size:.78rem">Could not reach the server. Please try again.</div>`;
    }
    msgs.scrollTop = msgs.scrollHeight;
  },

  addSuggestions(msgs, suggestions, accent) {
    if (!msgs || !Array.isArray(suggestions) || !suggestions.length) return;

    const unique = [...new Set(
      suggestions
        .map((item) => String(item || '').trim())
        .filter(Boolean)
    )].slice(0, 4);

    if (!unique.length) return;

    const wrap = document.createElement('div');
    wrap.style.display = 'flex';
    wrap.style.gap = '5px';
    wrap.style.flexWrap = 'wrap';

    unique.forEach((question) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = question;
      btn.style.fontSize = '.67rem';
      btn.style.padding = '3px 8px';
      btn.style.borderRadius = '8px';
      btn.style.cursor = 'pointer';
      btn.style.fontWeight = '700';
      btn.style.background = `${accent}12`;
      btn.style.border = `1px solid ${accent}30`;
      btn.style.color = accent;
      btn.addEventListener('click', () => this.send(question));
      wrap.appendChild(btn);
    });

    msgs.appendChild(wrap);
  }
};
