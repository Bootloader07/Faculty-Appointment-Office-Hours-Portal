import { getUsers, addUser, removeUser } from '../../data/store.js';
import { renderBadge, renderPage, showToast, showModal } from '../../components/shared.js';

function getUser(role) {
  try {
    const u = JSON.parse(localStorage.getItem('currentUser'));
    if (!u || u.role !== role) { window.location.hash = '#/login'; return null; }
    return u;
  } catch { window.location.hash = '#/login'; return null; }
}

export function render(container) {
  if (!getUser('admin')) return;

  const users = getUsers();

  const content = `
    <div class="card" style="margin-bottom: 2rem;">
      <h3 style="margin-top: 0;">Add New User</h3>
      <div id="addUserError" style="color: var(--status-cancelled); margin-bottom: 1rem; display: none;"></div>
      <form id="addUserForm" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; align-items: end;">
        <div class="form-group">
          <label class="form-label">Name</label>
          <input type="text" class="form-control" id="addName" placeholder="Full Name" required>
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input type="email" class="form-control" id="addEmail" placeholder="Email Address" required>
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <input type="text" class="form-control" id="addPassword" placeholder="Temporary Password" required>
        </div>
        <div class="form-group">
          <label class="form-label">Role</label>
          <select class="form-control" id="addRole" required>
            <option value="student">Student</option>
            <option value="faculty">Faculty</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Department</label>
          <input type="text" class="form-control" id="addDepartment" placeholder="E.g. Computer Science" required>
        </div>
        <button type="submit" class="btn btn-primary" style="margin-bottom: 1rem;">Add User</button>
      </form>
    </div>

    <div class="card">
      <h3 style="margin-top: 0;">All Users</h3>
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Department</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(u => {
              let badgeClass = 'badge-no-show';
              if (u.role === 'faculty') badgeClass = 'badge-rescheduled';
              if (u.role === 'student') badgeClass = 'badge-confirmed';
              return `
                <tr>
                  <td>${u.name}</td>
                  <td>${u.email}</td>
                  <td><span class="badge ${badgeClass}">${u.role}</span></td>
                  <td>${u.department || '-'}</td>
                  <td>
                    ${u.role === 'admin' 
                      ? '<span style="color: var(--text-2); font-size: var(--text-sm);">Protected</span>' 
                      : `<button class="btn btn-danger btn-remove" data-id="${u.id}" style="padding: 0.25rem 0.5rem; font-size: var(--text-xs);">Remove</button>`}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  container.innerHTML = renderPage('Manage Users 👥', 'Admin / Users', content);

  const form = container.querySelector('#addUserForm');
  const errorDiv = container.querySelector('#addUserError');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    errorDiv.style.display = 'none';

    const name = container.querySelector('#addName').value.trim();
    const email = container.querySelector('#addEmail').value.trim();
    const password = container.querySelector('#addPassword').value;
    const role = container.querySelector('#addRole').value;
    const department = container.querySelector('#addDepartment').value.trim();

    if (!name || !email || !password || !role || !department) {
      errorDiv.textContent = 'All fields are required.';
      errorDiv.style.display = 'block';
      return;
    }
    
    if (!email.includes('@')) {
      errorDiv.textContent = 'Invalid email format.';
      errorDiv.style.display = 'block';
      return;
    }

    addUser({ name, email, password, role, department });
    showToast('User added successfully', 'success');
    render(container);
  });

  const removeBtns = container.querySelectorAll('.btn-remove');
  removeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.getAttribute('data-id');
      showModal('Remove User', 'Are you sure you want to remove this user? This action cannot be undone.', () => {
        removeUser(id);
        showToast('User removed', 'success');
        render(container);
      });
    });
  });
}
