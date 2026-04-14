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

// ── SIGNUP PAGE ──
function renderSignupPage() {
  return `
  <div class="auth-page" style="padding-top:var(--nav-h)">
    <div class="auth-bg"></div>
    <div class="auth-card">
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
            <input class="inp" type="password" id="su-pass" placeholder="Min 6 characters" required>
          </div>
        </div>
        <div id="su-error" style="display:none;color:#ef4444;font-size:.8rem;margin-bottom:10px;padding:8px 12px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.25);border-radius:8px"></div>
        <button type="submit" class="btn btn-primary w100" id="su-btn" style="width:100%;padding:13px">🚀 Create Free Account</button>
      </form>

      <div class="auth-footer">Already have an account? <a href="/login">Sign in →</a></div>
      <div style="margin-top:14px;color:var(--muted2);font-size:.72rem;text-align:center">By signing up you agree to our <a href="/terms" style="color:var(--accent)">Terms</a> and <a href="/privacy" style="color:var(--accent)">Privacy Policy</a></div>
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
    errEl.textContent = 'Password must be at least 6 characters'; errEl.style.display = 'block'; return;
  }

  btn.classList.add('btn-loading'); btn.textContent = 'Creating account...';
  const res = await API.post('/api/auth/signup', { name, username, email, password });
  btn.classList.remove('btn-loading'); btn.textContent = '🚀 Create Free Account';

  if (res.ok) {
    Auth.user = res.data.user;
    Toast.success('Account created! Welcome to QuickFolio! 🎉');
    setTimeout(() => window.location.href = '/dashboard', 1000);
  } else {
    errEl.textContent = res.data.error || 'Something went wrong. Please try again.';
    errEl.style.display = 'block';
  }
}

// ── LOGIN PAGE ──
function renderLoginPage() {
  return `
  <div class="auth-page" style="padding-top:var(--nav-h)">
    <div class="auth-bg"></div>
    <div class="auth-card">
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

      <!-- Demo account -->
      <div style="margin-top:14px;padding:11px;background:rgba(0,229,255,.04);border:1px solid rgba(0,229,255,.15);border-radius:10px;font-size:.77rem;color:var(--muted);text-align:center">
        🎯 <strong style="color:var(--accent)">Try demo:</strong> demo@quickfolio.app / demo123
        <button onclick="fillDemo()" style="margin-left:6px;color:var(--accent);background:none;border:none;font-size:.77rem;font-weight:700;cursor:pointer">Fill →</button>
      </div>

      <div class="auth-footer">Don't have an account? <a href="/signup">Sign up free →</a></div>
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

function fillDemo() {
  const e = document.getElementById('li-email');
  const p = document.getElementById('li-pass');
  if (e) e.value = 'demo@quickfolio.app';
  if (p) p.value = 'demo123';
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

  btn.classList.add('btn-loading'); btn.textContent = 'Signing in...';
  const res = await API.post('/api/auth/login', { email, password });
  btn.classList.remove('btn-loading'); btn.textContent = '🔑 Sign In';

  if (res.ok) {
    Auth.user = res.data.user;
    Toast.success(`Welcome back, ${res.data.user.name}! 👋`);
    setTimeout(() => window.location.href = '/dashboard', 800);
  } else {
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

  Toast.info(`Redirecting to ${label}...`, 1400);
  window.location.href = `/api/auth/social/${provider}`;
}
