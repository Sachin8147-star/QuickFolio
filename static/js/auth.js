/* ════════ AUTH.JS ════════ */

const Auth = {
  user: null,

  async init() {
    const res = await API.get('/api/auth/me');
    if (res.ok) {
      this.user = res.data;
      this.updateNavUI(true);
    } else {
      this.user = null;
      this.updateNavUI(false);
    }
    return this.user;
  },

  updateNavUI(loggedIn) {
    const navActions = document.getElementById('nav-actions');
    const mobAuth = document.getElementById('mob-auth-links');
    if (!navActions) return;

    if (loggedIn && this.user) {
      const adminLink = this.user?.is_admin ? '<a href="/admin" class="btn btn-ghost btn-sm">🛡 Admin</a>' : '';
      navActions.innerHTML = `
        <a href="/dashboard" class="btn btn-ghost btn-sm">⚡ Dashboard</a>
        <a href="/resume-editor" class="btn btn-ghost btn-sm">📄 Resume</a>
        <a href="/billing" class="btn btn-ghost btn-sm">💳 Billing</a>
        ${adminLink}
        <a href="/builder" class="btn btn-primary btn-sm">🚀 Builder</a>
        <div class="nav-user-menu" onclick="Auth.toggleUserMenu()">
          <div style="width:32px;height:32px;border-radius:50%;background:var(--grad);display:flex;align-items:center;justify-content:center;font-size:.85rem;font-weight:800;color:#000;cursor:pointer;flex-shrink:0">${(this.user.name||'?')[0].toUpperCase()}</div>
        </div>`;
      if (mobAuth) mobAuth.innerHTML = `
        <a class="mob-link" href="/dashboard">⚡ Dashboard</a>
        <a class="mob-link" href="/resume-editor">📄 Resume Editor</a>
        <a class="mob-link" href="/billing">💳 Billing</a>
        ${this.user?.is_admin ? '<a class="mob-link" href="/admin">🛡 Admin</a>' : ''}
        <a class="mob-link" href="/builder">🔧 Builder</a>
        <button class="mob-link" onclick="Auth.logout()">🚪 Logout</button>`;
    } else {
      navActions.innerHTML = `
        <a href="/login" class="btn btn-ghost btn-sm">Login</a>
        <a href="/signup" class="btn btn-primary btn-sm">🚀 Start Free</a>`;
      if (mobAuth) mobAuth.innerHTML = `
        <a class="mob-link" href="/login">🔑 Login</a>
        <a class="mob-link" href="/signup">🚀 Sign Up Free</a>`;
    }
  },

  async logout() {
    await API.post('/api/auth/logout');
    this.user = null;
    this.updateNavUI(false);
    Toast.success('Logged out successfully!');
    window.location.href = '/';
  },

  toggleUserMenu() {
    // Simple dropdown toggle
    let dropdown = document.getElementById('user-dropdown');
    if (dropdown) { dropdown.remove(); return; }
    dropdown = document.createElement('div');
    dropdown.id = 'user-dropdown';
    dropdown.style.cssText = `position:fixed;top:${64+8}px;right:16px;background:var(--card);border:1px solid var(--border);border-radius:12px;padding:8px;min-width:180px;z-index:2000;box-shadow:0 10px 40px rgba(0,0,0,.5);animation:fadeUp .2s ease`;
    dropdown.innerHTML = `
      <div style="padding:8px 12px;border-bottom:1px solid var(--border);margin-bottom:6px">
        <div style="font-weight:700;font-size:.88rem">${Auth.user.name}</div>
        <div style="color:var(--muted);font-size:.73rem">${Auth.user.email||''}</div>
      </div>
      <a href="/dashboard" style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:8px;color:var(--muted);font-size:.83rem;transition:.2s" onmouseover="this.style.background='rgba(0,229,255,.06)'" onmouseout="this.style.background=''">⚡ Dashboard</a>
      <a href="/resume-editor" style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:8px;color:var(--muted);font-size:.83rem;transition:.2s" onmouseover="this.style.background='rgba(0,229,255,.06)'" onmouseout="this.style.background=''">📄 Resume Editor</a>
      <a href="/billing" style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:8px;color:var(--muted);font-size:.83rem;transition:.2s" onmouseover="this.style.background='rgba(0,229,255,.06)'" onmouseout="this.style.background=''">💳 Billing</a>
      ${Auth.user?.is_admin ? `<a href="/admin" style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:8px;color:var(--muted);font-size:.83rem;transition:.2s" onmouseover="this.style.background='rgba(0,229,255,.06)'" onmouseout="this.style.background=''">🛡 Admin</a>` : ''}
      <a href="/builder" style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:8px;color:var(--muted);font-size:.83rem;transition:.2s" onmouseover="this.style.background='rgba(0,229,255,.06)'" onmouseout="this.style.background=''">🔧 Builder</a>
      <a href="/p/${Auth.user.portfolios?.[0]?.slug||''}" target="_blank" style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:8px;color:var(--muted);font-size:.83rem;transition:.2s" onmouseover="this.style.background='rgba(0,229,255,.06)'" onmouseout="this.style.background=''">👁 My Portfolio</a>
      <div style="border-top:1px solid var(--border);margin:6px 0"></div>
      <button onclick="Auth.logout()" style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:8px;color:#ef4444;font-size:.83rem;width:100%;text-align:left;background:none;border:none;transition:.2s" onmouseover="this.style.background='rgba(239,68,68,.06)'" onmouseout="this.style.background=''">🚪 Logout</button>`;
    document.body.appendChild(dropdown);
    setTimeout(() => document.addEventListener('click', function handler(e) {
      if (!dropdown.contains(e.target)) { dropdown.remove(); document.removeEventListener('click', handler); }
    }), 100);
  }
};

let _authMascotController = null;

function renderAuthMascotMarkup() {
  return `
  <div class="auth-mascot-wrap" aria-hidden="true">
    <div class="auth-mascot" data-auth-mascot="1" data-mood="neutral" data-blink="0" data-cover-eyes="0" data-wave="0">
      <div class="auth-mascot-antenna"></div>
      <div class="auth-mascot-head">
        <div class="auth-mascot-eye auth-mascot-eye-left"><span class="auth-mascot-pupil"></span></div>
        <div class="auth-mascot-eye auth-mascot-eye-right"><span class="auth-mascot-pupil"></span></div>
        <div class="auth-mascot-mouth"></div>
        <div class="auth-mascot-cheek auth-mascot-cheek-left"></div>
        <div class="auth-mascot-cheek auth-mascot-cheek-right"></div>
      </div>
      <div class="auth-mascot-body">
        <div class="auth-mascot-core"></div>
      </div>
      <div class="auth-mascot-arm auth-mascot-arm-left"><span class="auth-mascot-hand"></span></div>
      <div class="auth-mascot-arm auth-mascot-arm-right"><span class="auth-mascot-hand"></span></div>
      <div class="auth-mascot-status"><span class="auth-mascot-status-dot"></span><span class="auth-mascot-status-text">Ready</span></div>
    </div>
  </div>`;
}

function renderAuthMascotPanel(mode = 'login') {
  const helperText = mode === 'signup'
    ? 'Your robo buddy checks each field so signup feels smooth.'
    : 'Your robo buddy stays alert while you sign in safely.';

  return `
  <aside class="auth-mascot-panel" aria-hidden="true">
    <div class="auth-mascot-panel-badge">AI Buddy</div>
    ${renderAuthMascotMarkup()}
    <p class="auth-mascot-panel-copy">${helperText}</p>
  </aside>`;
}

function queueAuthMascotInit(mode) {
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(() => initAuthMascot(mode));
    return;
  }
  setTimeout(() => initAuthMascot(mode), 0);
}

function authMascotReact(mood, message, holdMs = 1200) {
  if (!_authMascotController || typeof _authMascotController.setMood !== 'function') return;
  _authMascotController.setMood(mood, message, holdMs);
}

function authMascotCelebrate(message, holdMs = 1400) {
  if (!_authMascotController || typeof _authMascotController.celebrate !== 'function') return;
  _authMascotController.celebrate(message, holdMs);
}

function initAuthMascot(mode = 'login') {
  const mascot = document.querySelector('.auth-mascot[data-auth-mascot="1"]');
  if (!mascot) return;

  if (_authMascotController && _authMascotController.root === mascot) return;
  if (_authMascotController && typeof _authMascotController.destroy === 'function') {
    _authMascotController.destroy();
  }

  const card = mascot.closest('.auth-card');
  const formId = mode === 'signup' ? 'signup-form' : 'login-form';
  const form = document.getElementById(formId);
  if (!card || !form) return;

  const head = mascot.querySelector('.auth-mascot-head');
  const pupils = [...mascot.querySelectorAll('.auth-mascot-pupil')];
  const statusText = mascot.querySelector('.auth-mascot-status-text');
  const fields = [...form.querySelectorAll('input:not([type="hidden"]), textarea, select')]
    .filter((el) => !el.disabled);
  const passwordFields = fields.filter((field) => String(field.type || '').toLowerCase() === 'password');

  const defaultStatus = mode === 'signup'
    ? 'Let us build your profile'
    : 'Good to see you again';
  let holdTimer = 0;
  let blinkTimer = 0;
  let blinkEndTimer = 0;
  let waveTimer = 0;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function setStatus(value) {
    if (statusText) statusText.textContent = value || defaultStatus;
  }

  function setCoverEyes(enabled) {
    mascot.dataset.coverEyes = enabled ? '1' : '0';
    if (enabled) mascot.dataset.blink = '0';
  }

  function triggerWave(durationMs = 1200) {
    clearTimeout(waveTimer);
    mascot.dataset.wave = '1';
    waveTimer = setTimeout(() => {
      mascot.dataset.wave = '0';
    }, durationMs);
  }

  function triggerBlink(durationMs = 120) {
    if (mascot.dataset.coverEyes === '1') return;
    clearTimeout(blinkEndTimer);
    mascot.dataset.blink = '1';
    blinkEndTimer = setTimeout(() => {
      mascot.dataset.blink = '0';
    }, durationMs);
  }

  function scheduleBlink() {
    clearTimeout(blinkTimer);
    const delay = 2200 + Math.floor(Math.random() * 1800);
    blinkTimer = setTimeout(() => {
      triggerBlink(95 + Math.floor(Math.random() * 90));
      scheduleBlink();
    }, delay);
  }

  function hasAnyInput() {
    return fields.some((field) => String(field.value || '').trim().length > 0);
  }

  function allFilled() {
    return fields.length > 0 && fields.every((field) => String(field.value || '').trim().length > 0);
  }

  function hasInvalidField() {
    return fields.some((field) => {
      const value = String(field.value || '').trim();
      if (!value) return false;
      return typeof field.checkValidity === 'function' && !field.checkValidity();
    });
  }

  function syncMoodFromInputs() {
    if (hasInvalidField()) {
      mascot.dataset.mood = 'sad';
      setStatus('Tiny fix needed');
      return;
    }
    if (allFilled() && hasAnyInput()) {
      mascot.dataset.mood = 'happy';
      setStatus(mode === 'signup' ? 'Looks great! Ready to launch' : 'All set to sign in');
      return;
    }
    mascot.dataset.mood = 'neutral';
    setStatus(defaultStatus);
  }

  function setMood(nextMood, message, holdMs = 0) {
    clearTimeout(holdTimer);
    mascot.dataset.mood = nextMood || 'neutral';

    const moodLabel = {
      neutral: defaultStatus,
      focus: 'I am watching closely',
      happy: 'Great! That looks perfect',
      sad: 'Oops, something is off',
      weird: 'Hmm... that seems incorrect',
    };

    setStatus(message || moodLabel[nextMood] || defaultStatus);

    if (nextMood === 'happy' && !message) {
      triggerWave(980);
    }

    if (holdMs > 0) {
      holdTimer = setTimeout(() => {
        syncMoodFromInputs();
      }, holdMs);
    }
  }

  function updateEyeTracking(clientX, clientY) {
    if (!head || !pupils.length) return;
    if (mascot.dataset.coverEyes === '1') {
      if (head) head.style.transform = 'translateZ(0) rotate(0deg)';
      return;
    }

    const rect = head.getBoundingClientRect();
    const dx = clamp((clientX - (rect.left + (rect.width / 2))) / 28, -1, 1);
    const dy = clamp((clientY - (rect.top + (rect.height / 2))) / 24, -1, 1);
    const mood = mascot.dataset.mood || 'neutral';
    const wobble = mood === 'weird' ? Math.sin(Date.now() / 95) * 1.2 : 0;

    pupils.forEach((pupil, idx) => {
      const shiftX = (dx * 4.8) + wobble + (mood === 'weird' && idx === 1 ? 2.3 : 0);
      const shiftY = (dy * 3.8) + (mood === 'sad' ? 1.9 : 0) + (mood === 'weird' && idx === 0 ? -1.2 : 0);
      pupil.style.transform = `translate(${shiftX.toFixed(2)}px, ${shiftY.toFixed(2)}px)`;
    });

    const tilt = (dx * 6) + (mood === 'weird' ? Math.sin(Date.now() / 140) * 2 : 0);
    head.style.transform = `translateZ(0) rotate(${tilt.toFixed(2)}deg)`;
  }

  function resetEyeTracking() {
    pupils.forEach((pupil) => {
      pupil.style.transform = 'translate(0px, 0px)';
    });
    if (head) head.style.transform = 'translateZ(0) rotate(0deg)';
  }

  const fieldListeners = [];
  fields.forEach((field) => {
    const onFocus = () => setMood('focus', 'I am watching closely');
    const onInput = () => {
      const value = String(field.value || '').trim();
      if (value && typeof field.checkValidity === 'function' && !field.checkValidity()) {
        setMood('sad', 'Oops, check this field', 1100);
        return;
      }
      syncMoodFromInputs();
    };
    const onBlur = () => {
      const value = String(field.value || '').trim();
      if (value && typeof field.checkValidity === 'function' && !field.checkValidity()) {
        setMood('sad', 'That does not look right', 1200);
        return;
      }
      syncMoodFromInputs();
    };

    field.addEventListener('focus', onFocus);
    field.addEventListener('input', onInput);
    field.addEventListener('blur', onBlur);

    fieldListeners.push([field, 'focus', onFocus]);
    fieldListeners.push([field, 'input', onInput]);
    fieldListeners.push([field, 'blur', onBlur]);
  });

  passwordFields.forEach((field) => {
    const onPwdFocus = () => {
      setCoverEyes(true);
      setMood('focus', 'Password mode: eyes covered');
    };
    const onPwdBlur = () => {
      setCoverEyes(false);
      triggerBlink(140);
      syncMoodFromInputs();
    };

    field.addEventListener('focus', onPwdFocus);
    field.addEventListener('blur', onPwdBlur);
    fieldListeners.push([field, 'focus', onPwdFocus]);
    fieldListeners.push([field, 'blur', onPwdBlur]);
  });

  const onSubmit = () => {
    setMood('focus', mode === 'signup' ? 'Checking your details...' : 'Checking credentials...');
  };
  const onPointerMove = (event) => updateEyeTracking(event.clientX, event.clientY);
  const onPointerLeave = () => resetEyeTracking();

  form.addEventListener('submit', onSubmit);
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerleave', onPointerLeave);

  scheduleBlink();
  syncMoodFromInputs();

  _authMascotController = {
    root: mascot,
    mode,
    setMood,
    celebrate(message, holdMs = 1400) {
      setMood('happy', message || 'Amazing! Success confirmed', holdMs);
      triggerWave(Math.min(holdMs, 1600));
    },
    syncMoodFromInputs,
    destroy() {
      clearTimeout(holdTimer);
      clearTimeout(blinkTimer);
      clearTimeout(blinkEndTimer);
      clearTimeout(waveTimer);
      fieldListeners.forEach(([node, event, handler]) => {
        node.removeEventListener(event, handler);
      });
      form.removeEventListener('submit', onSubmit);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', onPointerLeave);
      resetEyeTracking();
      mascot.dataset.wave = '0';
      mascot.dataset.blink = '0';
      mascot.dataset.coverEyes = '0';
    }
  };
}

// ── SIGNUP PAGE ──
function renderSignupPage() {
  queueAuthMascotInit('signup');
  return `
  <div class="auth-page" style="padding-top:var(--nav-h)">
    <div class="auth-bg"></div>
    <div class="auth-card auth-card-mascot">
      <div class="auth-layout">
        ${renderAuthMascotPanel('signup')}
        <div class="auth-main">
          <div class="auth-logo">
            <div style="display:inline-flex;align-items:center;gap:8px;font-family:var(--fd);font-size:1.1rem;font-weight:700">
              <div style="width:32px;height:32px;background:var(--grad);border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:.9rem;color:#000">⚡</div>
              <span class="grad-text">QuickFolio</span>
            </div>
          </div>
          <h2 class="auth-title">Create your account</h2>
          <p class="auth-sub">Build a portfolio that gets you hired in minutes</p>

          <!-- Social Auth -->
          <div style="display:flex;flex-direction:column;gap:0">
            <button class="social-btn" onclick="socialAuth('github')">
              <div class="social-btn-icon">⚡</div>
              <span>Continue with GitHub</span>
            </button>
            <button class="social-btn" onclick="socialAuth('google')">
              <div class="social-btn-icon">🔵</div>
              <span>Continue with Google</span>
            </button>
            <button class="social-btn" onclick="socialAuth('linkedin')">
              <div class="social-btn-icon">💼</div>
              <span>Continue with LinkedIn</span>
            </button>
          </div>

          <div class="auth-divider">or sign up with email</div>

          <form id="signup-form" onsubmit="submitSignup(event)">
            <div class="inp-2col">
              <div class="inp-group">
                <label class="inp-label">Full Name *</label>
                <input class="inp" id="su-name" placeholder="Sachin Kumar" required>
              </div>
              <div class="inp-group">
                <label class="inp-label">Username *</label>
                <input class="inp" id="su-username" placeholder="sachin_dev" required>
              </div>
            </div>
            <div class="inp-group">
              <label class="inp-label">Email Address *</label>
              <input class="inp" type="email" id="su-email" placeholder="you@email.com" required>
            </div>
            <div class="inp-group">
              <label class="inp-label">Password *</label>
              <div class="inp-icon-wrap">
                <span class="inp-ico">🔒</span>
                <input class="inp" type="password" id="su-pass" placeholder="Min 6 characters" minlength="6" required>
              </div>
            </div>
            <div id="su-error" style="display:none;color:#ef4444;font-size:.8rem;margin-bottom:10px;padding:8px 12px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.25);border-radius:8px"></div>
            <button type="submit" class="btn btn-primary w100" id="su-btn" style="width:100%;padding:13px">🚀 Create Free Account</button>
          </form>

          <div class="auth-footer">Already have an account? <a href="/login">Sign in →</a></div>
          <div style="margin-top:14px;color:var(--muted2);font-size:.72rem;text-align:center">By signing up you agree to our <a href="/terms" style="color:var(--accent)">Terms</a> and <a href="/privacy" style="color:var(--accent)">Privacy Policy</a></div>
        </div>
      </div>
    </div>
  </div>`;
}

async function submitSignup(e) {
  e.preventDefault();
  const btn = document.getElementById('su-btn');
  const errEl = document.getElementById('su-error');
  errEl.style.display = 'none';

  const name = document.getElementById('su-name').value.trim();
  const username = document.getElementById('su-username').value.trim().toLowerCase();
  const email = document.getElementById('su-email').value.trim();
  const password = document.getElementById('su-pass').value;

  if (!Validate.minLen(password, 6)) {
    authMascotReact('sad', 'Password needs at least 6 characters', 1800);
    errEl.textContent = 'Password must be at least 6 characters'; errEl.style.display = 'block'; return;
  }

  authMascotReact('focus', 'Checking your details...');
  btn.classList.add('btn-loading'); btn.textContent = 'Creating account...';
  const res = await API.post('/api/auth/signup', { name, username, email, password });
  btn.classList.remove('btn-loading'); btn.textContent = '🚀 Create Free Account';

  if (res.ok) {
    authMascotCelebrate('Yay! Account created successfully', 1600);
    Auth.user = res.data.user;
    Toast.success('Account created! Welcome to QuickFolio! 🎉');
    setTimeout(() => window.location.href = '/dashboard', 1000);
  } else {
    authMascotReact('weird', 'Hmm... those details did not work', 1900);
    errEl.textContent = res.data.error || 'Something went wrong. Please try again.';
    errEl.style.display = 'block';
  }
}

// ── LOGIN PAGE ──
function renderLoginPage() {
  queueAuthMascotInit('login');
  return `
  <div class="auth-page" style="padding-top:var(--nav-h)">
    <div class="auth-bg"></div>
    <div class="auth-card auth-card-mascot">
      <div class="auth-layout">
        ${renderAuthMascotPanel('login')}
        <div class="auth-main">
          <div class="auth-logo">
            <div style="display:inline-flex;align-items:center;gap:8px;font-family:var(--fd);font-size:1.1rem;font-weight:700">
              <div style="width:32px;height:32px;background:var(--grad);border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:.9rem;color:#000">⚡</div>
              <span class="grad-text">QuickFolio</span>
            </div>
          </div>
          <h2 class="auth-title">Welcome back</h2>
          <p class="auth-sub">Sign in to continue building your portfolio</p>

          <div style="display:flex;flex-direction:column;gap:0">
            <button class="social-btn" onclick="socialAuth('github')"><div class="social-btn-icon">⚡</div><span>Continue with GitHub</span></button>
            <button class="social-btn" onclick="socialAuth('google')"><div class="social-btn-icon">🔵</div><span>Continue with Google</span></button>
            <button class="social-btn" onclick="socialAuth('linkedin')"><div class="social-btn-icon">💼</div><span>Continue with LinkedIn</span></button>
          </div>

          <div class="auth-divider">or sign in with email</div>

          <form id="login-form" onsubmit="submitLogin(event)">
            <div class="inp-group">
              <label class="inp-label">Email Address</label>
              <div class="inp-icon-wrap"><span class="inp-ico">📧</span><input class="inp" type="email" id="li-email" placeholder="you@email.com" required></div>
            </div>
            <div class="inp-group">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
                <label class="inp-label" style="margin:0">Password</label>
                <button type="button" onclick="openForgotPasswordModal(event)" style="font-size:.72rem;color:var(--accent);background:none;border:none;padding:0;cursor:pointer">Forgot password?</button>
              </div>
              <div class="inp-icon-wrap"><span class="inp-ico">🔒</span><input class="inp" type="password" id="li-pass" placeholder="Your password" required></div>
            </div>
            <div id="li-error" style="display:none;color:#ef4444;font-size:.8rem;margin-bottom:10px;padding:8px 12px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.25);border-radius:8px"></div>
            <button type="submit" class="btn btn-primary" id="li-btn" style="width:100%;padding:13px">🔑 Sign In</button>
          </form>

          <div class="auth-footer">Don't have an account? <a href="/signup">Sign up free →</a></div>
        </div>
      </div>
    </div>

    <div class="modal-ov" id="forgot-password-modal">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="forgot-password-title">
        <div class="modal-head">
          <div class="modal-title" id="forgot-password-title">Reset your password</div>
          <button class="modal-close" type="button" onclick="closeForgotPasswordModal()">✕</button>
        </div>
        <div class="modal-body">
          <p class="tm" style="font-size:.84rem;margin-bottom:14px">Request a one-time code, then set a new password for your account.</p>

          <form onsubmit="requestPasswordReset(event)">
            <div class="inp-group">
              <label class="inp-label">Account Email</label>
              <input class="inp" id="fr-email" type="email" placeholder="you@email.com" required>
            </div>
            <button type="submit" class="btn btn-outline" id="fr-request-btn" style="width:100%">Send Reset Code</button>
          </form>

          <div id="fr-request-result" style="display:none;margin-top:10px;padding:10px 12px;border-radius:10px;font-size:.78rem"></div>

          <div style="height:1px;background:var(--border);margin:16px 0"></div>

          <form onsubmit="confirmPasswordReset(event)">
            <div class="inp-group">
              <label class="inp-label">Email</label>
              <input class="inp" id="fr-confirm-email" type="email" placeholder="you@email.com" required>
            </div>
            <div class="inp-group">
              <label class="inp-label">Reset Code</label>
              <input class="inp" id="fr-code" placeholder="Enter code" required>
            </div>
            <div class="inp-group">
              <label class="inp-label">New Password</label>
              <input class="inp" id="fr-new-password" type="password" placeholder="Min 6 characters" required>
            </div>
            <button type="submit" class="btn btn-primary" id="fr-confirm-btn" style="width:100%">Update Password</button>
          </form>

          <div id="fr-confirm-result" style="display:none;margin-top:10px;padding:10px 12px;border-radius:10px;font-size:.78rem"></div>
        </div>
      </div>
    </div>
  </div>`;
}

function openForgotPasswordModal(event) {
  if (event) event.preventDefault();
  const modal = document.getElementById('forgot-password-modal');
  if (!modal) return;

  const loginEmail = (document.getElementById('li-email')?.value || '').trim();
  const requestEmail = document.getElementById('fr-email');
  const confirmEmail = document.getElementById('fr-confirm-email');

  if (requestEmail && !requestEmail.value && loginEmail) requestEmail.value = loginEmail;
  if (confirmEmail && !confirmEmail.value && loginEmail) confirmEmail.value = loginEmail;

  const requestResult = document.getElementById('fr-request-result');
  const confirmResult = document.getElementById('fr-confirm-result');
  if (requestResult) requestResult.style.display = 'none';
  if (confirmResult) confirmResult.style.display = 'none';

  modal.classList.add('open');
}

function closeForgotPasswordModal() {
  const modal = document.getElementById('forgot-password-modal');
  if (modal) modal.classList.remove('open');
}

function setPasswordResetMessage(elementId, message, tone = 'info') {
  const el = document.getElementById(elementId);
  if (!el) return;

  const palette = {
    info: {
      color: 'var(--muted)',
      border: '1px solid var(--border)',
      bg: 'rgba(98,114,164,.12)',
    },
    success: {
      color: '#22c55e',
      border: '1px solid rgba(34,197,94,.35)',
      bg: 'rgba(34,197,94,.08)',
    },
    error: {
      color: '#ef4444',
      border: '1px solid rgba(239,68,68,.35)',
      bg: 'rgba(239,68,68,.08)',
    },
  };

  const style = palette[tone] || palette.info;
  el.style.display = '';
  el.style.color = style.color;
  el.style.border = style.border;
  el.style.background = style.bg;
  el.textContent = message;
}

async function requestPasswordReset(e) {
  e.preventDefault();

  const email = (document.getElementById('fr-email')?.value || '').trim().toLowerCase();
  const btn = document.getElementById('fr-request-btn');

  if (!Validate.email(email)) {
    setPasswordResetMessage('fr-request-result', 'Please enter a valid email address.', 'error');
    return;
  }

  if (btn) {
    btn.classList.add('btn-loading');
    btn.textContent = 'Sending...';
  }

  const res = await API.post('/api/auth/password-reset/request', { email });

  if (btn) {
    btn.classList.remove('btn-loading');
    btn.textContent = 'Send Reset Code';
  }

  if (!res.ok) {
    setPasswordResetMessage('fr-request-result', res.data?.error || 'Unable to request reset code right now.', 'error');
    return;
  }

  const confirmEmail = document.getElementById('fr-confirm-email');
  if (confirmEmail) confirmEmail.value = email;

  if (res.data?.dev_reset_code) {
    const codeInput = document.getElementById('fr-code');
    if (codeInput) codeInput.value = String(res.data.dev_reset_code);
    setPasswordResetMessage(
      'fr-request-result',
      `Reset code generated for development use. Expires in ${res.data?.dev_expires_minutes || 20} minutes.`,
      'success'
    );
    return;
  }

  setPasswordResetMessage('fr-request-result', res.data?.message || 'If the account exists, a reset code was sent.', 'success');
}

async function confirmPasswordReset(e) {
  e.preventDefault();

  const email = (document.getElementById('fr-confirm-email')?.value || '').trim().toLowerCase();
  const code = (document.getElementById('fr-code')?.value || '').trim();
  const newPassword = document.getElementById('fr-new-password')?.value || '';
  const btn = document.getElementById('fr-confirm-btn');

  if (!Validate.email(email)) {
    setPasswordResetMessage('fr-confirm-result', 'Please enter a valid email address.', 'error');
    return;
  }
  if (!code) {
    setPasswordResetMessage('fr-confirm-result', 'Reset code is required.', 'error');
    return;
  }
  if (!Validate.minLen(newPassword, 6)) {
    setPasswordResetMessage('fr-confirm-result', 'Password must be at least 6 characters.', 'error');
    return;
  }

  if (btn) {
    btn.classList.add('btn-loading');
    btn.textContent = 'Updating...';
  }

  const res = await API.post('/api/auth/password-reset/confirm', {
    email,
    code,
    new_password: newPassword,
  });

  if (btn) {
    btn.classList.remove('btn-loading');
    btn.textContent = 'Update Password';
  }

  if (!res.ok) {
    setPasswordResetMessage('fr-confirm-result', res.data?.error || 'Unable to reset password.', 'error');
    return;
  }

  setPasswordResetMessage('fr-confirm-result', res.data?.message || 'Password updated successfully.', 'success');
  Toast.success('Password updated. Please sign in.');

  const loginEmail = document.getElementById('li-email');
  const loginPass = document.getElementById('li-pass');
  if (loginEmail) loginEmail.value = email;
  if (loginPass) loginPass.value = '';

  setTimeout(() => closeForgotPasswordModal(), 1100);
}

async function submitLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('li-btn');
  const errEl = document.getElementById('li-error');
  errEl.style.display = 'none';

  const email = document.getElementById('li-email').value.trim();
  const password = document.getElementById('li-pass').value;

  authMascotReact('focus', 'Checking credentials...');
  btn.classList.add('btn-loading'); btn.textContent = 'Signing in...';
  const res = await API.post('/api/auth/login', { email, password });
  btn.classList.remove('btn-loading'); btn.textContent = '🔑 Sign In';

  if (res.ok) {
    authMascotCelebrate('Welcome back! Access granted', 1600);
    Auth.user = res.data.user;
    Toast.success(`Welcome back, ${res.data.user.name}! 👋`);
    setTimeout(() => window.location.href = '/dashboard', 800);
  } else {
    authMascotReact('weird', 'Oops... those credentials look wrong', 1900);
    errEl.textContent = res.data.error || 'Invalid credentials';
    errEl.style.display = 'block';
  }
}

function handleAuthQueryState() {
  const params = new URLSearchParams(window.location.search);
  const oauthError = params.get('oauth_error');
  if (!oauthError) return;

  const messages = {
    access_denied: 'You cancelled the social login request.',
    invalid_state: 'Security validation failed. Please try social login again.',
    provider_mismatch: 'Provider mismatch detected. Please start login again.',
    missing_code: 'OAuth provider did not return an authorization code.',
    oauth_failed: 'Social login failed at provider callback. Please try again.',
    unknown_provider: 'Selected social provider is not supported.'
  };

  authMascotReact('sad', messages[oauthError] || 'Social login failed. Please try again.', 1800);
  Toast.error(messages[oauthError] || 'Social login failed. Please try again.', 5000);
  params.delete('oauth_error');
  const cleanQuery = params.toString();
  const cleanUrl = `${window.location.pathname}${cleanQuery ? `?${cleanQuery}` : ''}${window.location.hash || ''}`;
  window.history.replaceState({}, '', cleanUrl);
}

function socialAuth(provider) {
  const providerNames = { github: 'GitHub', google: 'Google', linkedin: 'LinkedIn' };
  const label = providerNames[provider] || provider;
  if (!providerNames[provider]) {
    Toast.error('Unknown social provider');
    return;
  }

  const buttons = [...document.querySelectorAll('.social-btn')];

  buttons.forEach(btn => {
    btn.disabled = true;
    btn.style.opacity = '.75';
  });

  authMascotReact('focus', `Opening ${label}...`);
  Toast.info(`Redirecting to ${label}...`, 1400);
  window.location.href = `/api/auth/social/${provider}`;
}
