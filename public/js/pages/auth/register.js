import { api } from '../../api.js';
import { setCurrentUser } from '../../state.js';

export function render(container) {
  container.innerHTML = `
    <div class="auth-container">
      <div class="card auth-card">
        <h2 style="text-align:center; margin-bottom:2rem; color:var(--primary)">🎓 Create Account</h2>
        <form id="register-form">
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input type="text" id="name" class="form-control" required placeholder="John Doe">
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" id="email" class="form-control" required placeholder="name@uni.edu">
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" id="password" class="form-control" required placeholder="••••••••">
          </div>
          <div class="form-group">
            <label class="form-label">Role</label>
            <select id="role" class="form-control" required>
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Department</label>
            <input type="text" id="department" class="form-control" required placeholder="Computer Science">
          </div>
          <div id="register-error" style="color:var(--status-cancelled); margin-bottom:1rem; font-size:var(--text-sm);"></div>
          <button type="submit" class="btn btn-primary" style="width:100%">Register</button>
        </form>
        <div style="text-align:center; margin-top:1.5rem; font-size:var(--text-sm);">
          Already have an account? <a href="#/login" style="color:var(--primary); text-decoration:none;">Sign In</a>
        </div>
      </div>
    </div>
  `;

  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;
    const department = document.getElementById('department').value;
    
    const errorDiv = document.getElementById('register-error');
    const btn = e.target.querySelector('button');
    
    btn.innerHTML = 'Registering...';
    btn.disabled = true;
    errorDiv.textContent = '';

    const res = await api.post('/auth/register', { name, email, password, role, department });
    
    if (res.success) {
      // Typically register logs in automatically, but if it doesn't, redirect to login
      const loginRes = await api.post('/auth/login', { email, password });
      if (loginRes.success) {
        setCurrentUser(loginRes.data);
        window.location.hash = `#/${loginRes.data.role}/dashboard`;
      } else {
        window.location.hash = '#/login';
      }
    } else {
      errorDiv.textContent = res.error;
      btn.innerHTML = 'Register';
      btn.disabled = false;
    }
  });
}
