import { api } from '../../api.js';
import { setCurrentUser } from '../../state.js';

// ── Hardcoded demo users (client-side fallback if server is down) ──
const DEMO_USERS = [
  { email: 'admin@uni.edu',       password: 'Admin@123',   role: 'admin',   name: 'System Admin' },
  { email: 'dr.sharma@uni.edu',   password: 'Faculty@123', role: 'faculty', name: 'Dr. Rajesh Sharma' },
  { email: 'dr.mehta@uni.edu',    password: 'Faculty@123', role: 'faculty', name: 'Dr. Priya Mehta' },
  { email: 'dr.patel@uni.edu',    password: 'Faculty@123', role: 'faculty', name: 'Dr. Anish Patel' },
  { email: 'dr.gupta@uni.edu',    password: 'Faculty@123', role: 'faculty', name: 'Dr. Sunita Gupta' },
  { email: 'alice@uni.edu',       password: 'Student@123', role: 'student', name: 'Alice Johnson' },
  { email: 'bob@uni.edu',         password: 'Student@123', role: 'student', name: 'Bob Williams' },
  { email: 'charlie@uni.edu',     password: 'Student@123', role: 'student', name: 'Charlie Brown' },
  { email: 'diana@uni.edu',       password: 'Student@123', role: 'student', name: 'Diana Prince' },
  { email: 'eve@uni.edu',         password: 'Student@123', role: 'student', name: 'Eve Davis' },
];

export function render(container) {
  container.innerHTML = `
    <div class="auth-wrapper">
      <div class="auth-container">

        <!-- Brand -->
        <div class="auth-brand">
          <div class="auth-logo">🎓</div>
          <h1 class="auth-title">UniPortal</h1>
          <p class="auth-subtitle">Faculty Appointment & Office Hours Portal</p>
        </div>

        <!-- Card -->
        <div class="card auth-card">
          <h2 class="auth-card-title">Welcome back</h2>
          <p style="color:var(--text-2); font-size:var(--text-sm); margin-bottom:1.5rem; text-align:center;">
            Sign in to manage your appointments
          </p>

          <!-- Email -->
          <div class="form-group">
            <label class="form-label" for="login-email">Email address</label>
            <input
              type="email"
              id="login-email"
              class="form-control"
              placeholder="name@university.edu"
              autocomplete="email"
            >
          </div>

          <!-- Password -->
          <div class="form-group">
            <label class="form-label" for="login-password">Password</label>
            <input
              type="password"
              id="login-password"
              class="form-control"
              placeholder="••••••••"
              autocomplete="current-password"
            >
          </div>

          <!-- Inline error -->
          <div
            id="login-error"
            role="alert"
            style="
              display:none;
              color:var(--status-cancelled);
              background:rgba(239,68,68,0.08);
              border:1px solid rgba(239,68,68,0.25);
              border-radius:8px;
              padding:0.6rem 1rem;
              font-size:var(--text-sm);
              margin-bottom:1rem;
            "
          ></div>

          <!-- Submit -->
          <button
            id="login-btn"
            class="btn btn-primary"
            style="width:100%; font-size:var(--text-base); padding:0.8rem;"
          >
            Sign In
          </button>

          <div style="text-align:center; margin-top:1.25rem; font-size:var(--text-sm); color:var(--text-2);">
            Don't have an account?
            <a href="#/register" style="color:var(--primary); text-decoration:none; font-weight:500;">
              Register
            </a>
          </div>
        </div>

        <!-- Demo credentials -->
        <div class="auth-demo">
          <div class="auth-demo-title">🔐 Demo Credentials</div>
          <div class="auth-demo-grid">
            <div class="auth-demo-item" data-email="admin@uni.edu" data-password="Admin@123">
              <span class="badge badge-no-show" style="font-size:0.65rem; margin-bottom:4px;">admin</span>
              <div>admin@uni.edu</div>
              <div style="color:var(--text-3);">Admin@123</div>
            </div>
            <div class="auth-demo-item" data-email="dr.sharma@uni.edu" data-password="Faculty@123">
              <span class="badge badge-rescheduled" style="font-size:0.65rem; margin-bottom:4px;">faculty</span>
              <div>dr.sharma@uni.edu</div>
              <div style="color:var(--text-3);">Faculty@123</div>
            </div>
            <div class="auth-demo-item" data-email="alice@uni.edu" data-password="Student@123">
              <span class="badge badge-confirmed" style="font-size:0.65rem; margin-bottom:4px;">student</span>
              <div>alice@uni.edu</div>
              <div style="color:var(--text-3);">Student@123</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;

  // ── Wire up demo-credential click-to-fill ──────────────────────
  container.querySelectorAll('.auth-demo-item').forEach(item => {
    item.addEventListener('click', () => {
      document.getElementById('login-email').value    = item.dataset.email;
      document.getElementById('login-password').value = item.dataset.password;
      document.getElementById('login-error').style.display = 'none';
    });
  });

  // ── Wire up the Sign In button ────────────────────────────────
  const btn       = document.getElementById('login-btn');
  const errorDiv  = document.getElementById('login-error');

  btn.addEventListener('click', handleLogin);

  // Also allow Enter key from any field
  container.querySelectorAll('#login-email, #login-password').forEach(input => {
    input.addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });
  });

  async function handleLogin() {
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    // ── Basic client-side validation ──────────────────────────
    if (!email || !password) {
      showError('Please enter your email and password.');
      return;
    }

    // ── Loading state ─────────────────────────────────────────
    btn.disabled = true;
    btn.innerHTML = `
      <span style="display:inline-flex; align-items:center; gap:0.5rem;">
        <span class="spinner" style="width:16px; height:16px; border-width:2px;"></span>
        Signing in…
      </span>`;
    errorDiv.style.display = 'none';

    // ── Simulate 1-second async auth (per spec) ───────────────
    await new Promise(r => setTimeout(r, 1000));

    // ── Try the real Express session API first ─────────────────
    const res = await api.post('/auth/login', { email, password });

    if (res.success && res.data) {
      const user = res.data;
      console.log('✅ Logged in via API:', user);
      setCurrentUser(user);
      redirectToDashboard(user.role);
      return;
    }

    // ── Fallback: match against DEMO_USERS list ────────────────
    // (handles the case where the server isn't running or session expired)
    const matched = DEMO_USERS.find(
      u => u.email === email && u.password === password
    );

    if (matched) {
      const { password: _pw, ...safeUser } = matched; // never store plain password
      console.log('✅ Logged in via demo fallback:', safeUser);
      setCurrentUser(safeUser);
      redirectToDashboard(safeUser.role);
      return;
    }

    // ── Auth failed ────────────────────────────────────────────
    showError('Invalid email or password. Please try again.');
    document.getElementById('login-password').value = ''; // clear only password
    document.getElementById('login-password').focus();
    btn.disabled = false;
    btn.innerHTML = 'Sign In';
  }

  function showError(msg) {
    errorDiv.textContent    = msg;
    errorDiv.style.display  = 'block';
    btn.disabled            = false;
    btn.innerHTML           = 'Sign In';
  }

  function redirectToDashboard(role) {
    const destinations = {
      admin:   '#/admin/dashboard',
      faculty: '#/faculty/dashboard',
      student: '#/student/dashboard',
    };
    window.location.hash = destinations[role] || '#/student/dashboard';
  }
}
