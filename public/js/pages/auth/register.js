import { api } from '../../api.js';
import { setCurrentUser } from '../../state.js';

export function render(container) {
  container.innerHTML = `
    <div class="auth-container">
      <div class="card auth-card">
        <h2 style="text-align:center; margin-bottom:2rem; color:var(--primary)">🎓 Create Account</h2>
        <form id="register-form">
          <div class="form-group">
            <label class="form-label" for="name">Full Name</label>
            <input type="text" id="name" class="form-control" required placeholder="John Doe">
          </div>
          <div class="form-group">
            <label class="form-label" for="email">Email</label>
            <input type="email" id="email" class="form-control" required placeholder="name@uni.edu">
          </div>
          <div class="form-group">
            <label class="form-label" for="password">Password</label>
            <input type="password" id="password" class="form-control" required placeholder="••••••••">
          </div>
          <div class="form-group">
            <label class="form-label" for="role">Role</label>
            <select id="role" class="form-control" required>
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="department">Department</label>
            <input type="text" id="department" class="form-control" required placeholder="Computer Science">
          </div>
          <div id="register-error" style="color:var(--status-cancelled); margin-bottom:1rem; font-size:var(--text-sm);"></div>
          <button type="submit" id="register-btn" class="btn btn-primary" style="width:100%">Register</button>
        </form>
        <div style="text-align:center; margin-top:1.5rem; font-size:var(--text-sm);">
          Already have an account? <a href="#/login" style="color:var(--primary); text-decoration:none;">Sign In</a>
        </div>
      </div>
    </div>
  `;

  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fullName = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;
    const department = document.getElementById('department').value.trim();
    
    const errorDiv = document.getElementById('register-error');
    const btn = document.getElementById('register-btn');

    errorDiv.textContent = '';
    btn.innerHTML = 'Registering...';
    btn.disabled = true;

    try {
      // 1. Client-side input validation
      if (!fullName) {
        errorDiv.textContent = 'Please enter your full name.';
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        errorDiv.textContent = 'Please enter a valid email address.';
        return;
      }

      if (!password || password.length < 6) {
        errorDiv.textContent = 'Password must be at least 6 characters.';
        return;
      }

      if (!['student', 'faculty', 'admin'].includes(role)) {
        errorDiv.textContent = 'Please select a valid role.';
        return;
      }

      if (!department) {
        errorDiv.textContent = 'Please enter your department.';
        return;
      }

      // 2. Call API
      const res = await api.post('/auth/register', {
        fullName,
        name: fullName,
        email,
        password,
        role,
        department
      });

      // 3. Check response.ok / success
      if (!res.ok && !res.success) {
        const errorMsg = res.error || (res.data && res.data.error) || 'Registration failed. Please try again.';
        errorDiv.textContent = errorMsg;
        return;
      }

      // 4. Read role from server response ONLY
      const serverUser = res.data?.user || res.data?.data;
      const confirmedRole = serverUser?.role;

      if (!confirmedRole) {
        errorDiv.textContent = 'Registration failed: Server response missing confirmed role.';
        return;
      }

      // 5. Store session state locally
      setCurrentUser(serverUser);

      // 6. Redirect using confirmed role from server
      window.location.hash = `#/${confirmedRole}/dashboard`;
    } catch (err) {
      errorDiv.textContent = err.message || 'An unexpected error occurred. Please try again.';
    } finally {
      // 7. Reset button state in finally block so it never stays stuck
      btn.innerHTML = 'Register';
      btn.disabled = false;
    }
  });
}
