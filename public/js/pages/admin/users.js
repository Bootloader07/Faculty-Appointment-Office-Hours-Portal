import { getUsers, addUser, removeUser, getPendingUsers, approveRegistration, rejectRegistration } from '../../data/store.js';
import { renderBadge, renderPage, showToast, showModal } from '../../components/shared.js';

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h ago';
  return Math.floor(h / 24) + 'd ago';
}

function getUser(role) {
  try {
    const u = JSON.parse(localStorage.getItem('currentUser'));
    if (!u || u.role !== role) { window.location.hash = '#/login'; return null; }
    return u;
  } catch { window.location.hash = '#/login'; return null; }
}

export function render(container) {
  if (!getUser('admin')) return;

  const pending = getPendingUsers();
  const users   = getUsers();

  // ── Pending registration requests section ──────────────────────────────
  let pendingHTML = '';
  if (pending.length === 0) {
    pendingHTML = `<p style="color:#7070a0;font-size:14px;padding:1rem 0;margin:0;">
      ✅ No pending registration requests.
    </p>`;
  } else {
    pendingHTML = pending.map(p => {
      let roleBadgeClass = 'badge-confirmed';
      if (p.role === 'faculty') roleBadgeClass = 'badge-rescheduled';
      if (p.role === 'admin')   roleBadgeClass = 'badge-no-show';
      return `
        <div style="background:var(--bg-surface);border:1px solid #1e1e3a;border-radius:10px;
          padding:1rem 1.25rem;display:flex;justify-content:space-between;align-items:center;
          flex-wrap:wrap;gap:0.75rem;margin-bottom:0.75rem;">
          <div>
            <div style="font-weight:600;color:#f0f0ff;margin-bottom:0.2rem;">${p.name}</div>
            <div style="font-size:0.82rem;color:var(--text-2);margin-bottom:0.3rem;">${p.email}</div>
            <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">
              <span class="badge ${roleBadgeClass}" style="text-transform:capitalize;">${p.role}</span>
              <span style="font-size:0.8rem;color:var(--text-2);">${p.department || ''}</span>
            </div>
            <div style="font-size:0.75rem;color:var(--text-3);margin-top:0.35rem;">
              Requested: ${timeAgo(p.requestedAt)}
            </div>
          </div>
          <div style="display:flex;gap:0.5rem;flex-shrink:0;">
            <button class="btn-approve-pending" data-id="${p.id}" style="
              background:#22c55e22;border:1px solid #22c55e;color:#22c55e;
              border-radius:8px;padding:8px 16px;font-size:13px;font-weight:600;
              cursor:pointer;transition:background .15s,color .15s;">
              ✅ Approve
            </button>
            <button class="btn-reject-pending" data-id="${p.id}" style="
              background:#ef444422;border:1px solid #ef4444;color:#ef4444;
              border-radius:8px;padding:8px 16px;font-size:13px;font-weight:600;
              cursor:pointer;transition:background .15s,color .15s;">
              ❌ Reject
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  const content = `
    <div class="card" style="margin-bottom:2rem;">
      <h3 style="margin-top:0;font-size:1rem;font-weight:600;color:#f0f0ff;margin-bottom:1rem;">
        Pending Registration Requests
        ${pending.length > 0 ? `<span style="display:inline-block;margin-left:0.5rem;
          background:#f59e0b22;border:1px solid #f59e0b;color:#f59e0b;
          border-radius:9999px;font-size:12px;padding:1px 8px;font-weight:700;">${pending.length}</span>` : ''}
      </h3>
      ${pendingHTML}
    </div>

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

  // ── Approve pending registration ────────────────────────────────────────
  container.querySelectorAll('.btn-approve-pending').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const result = approveRegistration(id);
      if (result.success) {
        showToast('User approved and added successfully!', 'success');
      } else {
        showToast(result.error || 'Approval failed.', 'error');
      }
      render(container);
    });
    // Hover effect
    btn.addEventListener('mouseenter', () => { btn.style.background = '#22c55e'; btn.style.color = 'white'; });
    btn.addEventListener('mouseleave', () => { btn.style.background = '#22c55e22'; btn.style.color = '#22c55e'; });
  });

  // ── Reject pending registration ─────────────────────────────────────────
  container.querySelectorAll('.btn-reject-pending').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      showModal('Reject Registration', 'Are you sure you want to reject this registration request?', () => {
        rejectRegistration(id);
        showToast('Registration request rejected.', 'success');
        render(container);
      });
    });
    // Hover effect
    btn.addEventListener('mouseenter', () => { btn.style.background = '#ef4444'; btn.style.color = 'white'; });
    btn.addEventListener('mouseleave', () => { btn.style.background = '#ef444422'; btn.style.color = '#ef4444'; });
  });
}
