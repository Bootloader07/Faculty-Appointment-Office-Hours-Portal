import { setCurrentUser } from '../../state.js';
import { getUserByEmail, addUser } from '../../data/store.js';

export function render(container) {
  container.innerHTML = `
    <div class="auth-wrapper">
      <div class="auth-container">

        <div class="auth-brand">
          <div class="auth-logo">🎓</div>
          <h1 class="auth-title">UniPortal</h1>
          <p class="auth-subtitle">Create your account</p>
        </div>

        <div class="card auth-card">
          <h2 class="auth-card-title">Create Account</h2>
          <p style="color:var(--text-2);font-size:var(--text-sm);margin-bottom:1.5rem;text-align:center;">
            Join the Faculty Appointment Portal
          </p>

          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input type="text" id="reg-name" class="form-control" placeholder="John Doe">
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" id="reg-email" class="form-control" placeholder="name@uni.edu">
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" id="reg-password" class="form-control" placeholder="Min 6 characters">
          </div>
          <div class="form-group">
            <label class="form-label">Role</label>
            <select id="reg-role" class="form-control">
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Department</label>
            <input type="text" id="reg-department" class="form-control" placeholder="e.g. Computer Science">
          </div>

          <div id="reg-error" style="
            display:none;
            color:var(--status-cancelled);
            background:rgba(239,68,68,0.08);
            border:1px solid rgba(239,68,68,0.25);
            border-radius:8px;
            padding:0.6rem 1rem;
            font-size:var(--text-sm);
            margin-bottom:1rem;
          "></div>

          <button id="reg-btn" class="btn btn-primary"
            style="width:100%;font-size:var(--text-base);padding:0.8rem;">
            Create Account
          </button>

          <div style="text-align:center;margin-top:1.25rem;font-size:var(--text-sm);color:var(--text-2);">
            Already have an account?
            <a href="#/login" style="color:var(--primary);text-decoration:none;font-weight:500;">Sign In</a>
          </div>
        </div>

      </div>
    </div>
  `;

  const btn      = document.getElementById('reg-btn');
  const errorDiv = document.getElementById('reg-error');

  function showError(msg) {
    errorDiv.textContent   = msg;
    errorDiv.style.display = 'block';
    btn.disabled           = false;
    btn.innerHTML          = 'Create Account';
  }

  btn.addEventListener('click', async () => {
    const name       = document.getElementById('reg-name').value.trim();
    const email      = document.getElementById('reg-email').value.trim();
    const password   = document.getElementById('reg-password').value;
    const role       = document.getElementById('reg-role').value;
    const department = document.getElementById('reg-department').value.trim();

    // Validate
    if (!name)                                 return showError('Please enter your full name.');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showError('Please enter a valid email address.');
    if (!password || password.length < 6)      return showError('Password must be at least 6 characters.');
    if (!department)                           return showError('Please enter your department.');
    if (getUserByEmail(email))                 return showError('An account with this email already exists.');

    btn.disabled  = true;
    btn.innerHTML = 'Creating account…';
    errorDiv.style.display = 'none';

    await new Promise(r => setTimeout(r, 600));

    const newUser = addUser({ name, email, password, role, department });
    const { password: _pw, ...safeUser } = newUser;
    setCurrentUser(safeUser);
    window.location.hash = `#/${role}/dashboard`;
  });
}
