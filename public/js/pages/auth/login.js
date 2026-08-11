import { setCurrentUser } from '../../state.js';
import { getUserByEmail } from '../../data/store.js';

export function render(container) {
  container.innerHTML = `
    <div class="auth-wrapper">
      <div class="auth-container">

        <div class="auth-brand">
          <div class="auth-logo">🎓</div>
          <h1 class="auth-title">UniPortal</h1>
          <p class="auth-subtitle">Faculty Appointment &amp; Office Hours Portal</p>
        </div>

        <div class="card auth-card">
          <h2 class="auth-card-title">Welcome back</h2>
          <p style="color:var(--text-2);font-size:var(--text-sm);margin-bottom:1.5rem;text-align:center;">
            Sign in to manage your appointments
          </p>

          <div class="form-group">
            <label class="form-label" for="login-email">Email address</label>
            <input type="email" id="login-email" class="form-control"
              placeholder="name@university.edu" autocomplete="email">
          </div>

          <div class="form-group">
            <label class="form-label" for="login-password">Password</label>
            <input type="password" id="login-password" class="form-control"
              placeholder="••••••••" autocomplete="current-password">
          </div>

          <div id="login-error" role="alert" style="
            display:none;
            color:var(--status-cancelled);
            background:rgba(239,68,68,0.08);
            border:1px solid rgba(239,68,68,0.25);
            border-radius:8px;
            padding:0.6rem 1rem;
            font-size:var(--text-sm);
            margin-bottom:1rem;
          "></div>

          <button id="login-btn" class="btn btn-primary"
            style="width:100%;font-size:var(--text-base);padding:0.8rem;">
            Sign In
          </button>

          <div style="text-align:center;margin-top:1.25rem;font-size:var(--text-sm);color:var(--text-2);">
            Don't have an account?
            <a href="#/register" style="color:var(--primary);text-decoration:none;font-weight:500;">
              Register
            </a>
          </div>
        </div>

        <div class="auth-demo">
          <div class="auth-demo-title">🔐 Demo Credentials — click to fill</div>
          <div class="auth-demo-grid">
            <div class="auth-demo-item" data-email="admin@uni.edu" data-password="Admin@123">
              <span class="badge badge-no-show" style="font-size:0.6rem;margin-bottom:4px;">admin</span>
              <div>admin@uni.edu</div>
              <div style="color:var(--text-3);">Admin@123</div>
            </div>
            <div class="auth-demo-item" data-email="dr.sharma@uni.edu" data-password="Faculty@123">
              <span class="badge badge-rescheduled" style="font-size:0.6rem;margin-bottom:4px;">faculty</span>
              <div>dr.sharma@uni.edu</div>
              <div style="color:var(--text-3);">Faculty@123</div>
            </div>
            <div class="auth-demo-item" data-email="alice@uni.edu" data-password="Student@123">
              <span class="badge badge-confirmed" style="font-size:0.6rem;margin-bottom:4px;">student</span>
              <div>alice@uni.edu</div>
              <div style="color:var(--text-3);">Student@123</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;

  // Click-to-fill demo tiles
  container.querySelectorAll('.auth-demo-item').forEach(item => {
    item.addEventListener('click', () => {
      document.getElementById('login-email').value    = item.dataset.email;
      document.getElementById('login-password').value = item.dataset.password;
      document.getElementById('login-error').style.display = 'none';
    });
  });

  const btn      = document.getElementById('login-btn');
  const errorDiv = document.getElementById('login-error');

  function showError(msg) {
    errorDiv.textContent   = msg;
    errorDiv.style.display = 'block';
    btn.disabled           = false;
    btn.innerHTML          = 'Sign In';
  }

  async function handleLogin() {
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) { showError('Please enter your email and password.'); return; }

    btn.disabled  = true;
    btn.innerHTML = `<span style="display:inline-flex;align-items:center;gap:0.5rem;">
      <span class="spinner" style="width:16px;height:16px;border-width:2px;"></span>
      Signing in…
    </span>`;
    errorDiv.style.display = 'none';

    // Simulate 800ms async auth
    await new Promise(r => setTimeout(r, 800));

    // Authenticate against localStorage store (no server needed)
    const user = getUserByEmail(email);
    if (user && user.password === password) {
      const { password: _pw, ...safeUser } = user;
      console.log('✅ Logged in:', safeUser);
      setCurrentUser(safeUser);
      window.location.hash = `#/${safeUser.role}/dashboard`;
      return;
    }

    showError('Invalid email or password. Please try again.');
    document.getElementById('login-password').value = '';
    document.getElementById('login-password').focus();
  }

  btn.addEventListener('click', handleLogin);
  container.querySelectorAll('#login-email,#login-password').forEach(el => {
    el.addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });
  });
}
