import { api } from '../../api.js';
import { renderSpinner, renderPage, renderEmpty, showModal, showToast } from '../../components/shared.js';

export async function render(container) {
  container.innerHTML = renderSpinner();

  const res = await api.get('/users');
  if (!res.success) {
    container.innerHTML = renderPage('Users', 'Admin', `<div class="card"><p>Error loading users.</p></div>`);
    return;
  }

  const users = res.data || [];
  let filtered = [...users];

  const renderTable = (list) => {
    if (!list.length) return renderEmpty('👥', 'No users found', '');
    return `
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Department</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${list.map(u => {
              const initials = u.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
              return `
              <tr>
                <td>
                  <div style="display:flex; align-items:center; gap:0.75rem;">
                    <div style="width:32px; height:32px; border-radius:50%; background:var(--primary-glow); display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:bold; color:var(--primary);">
                      ${initials}
                    </div>
                    <span style="font-weight:500;">${u.name}</span>
                  </div>
                </td>
                <td>${u.email}</td>
                <td><span class="badge ${u.role==='admin'?'badge-rescheduled':u.role==='faculty'?'badge-pending':'badge-confirmed'}">${u.role}</span></td>
                <td>${u.department || '-'}</td>
                <td>
                  <button class="btn btn-ghost btn-delete" data-id="${u.id}" style="color:var(--status-cancelled)">Delete</button>
                </td>
              </tr>
            `}).join('')}
          </tbody>
        </table>
      </div>
    `;
  };

  const content = `
    <div class="card" style="margin-bottom:2rem; display:flex; gap:1rem; align-items:center; justify-content:space-between; flex-wrap:wrap;">
      <div style="display:flex; gap:0.5rem;">
        <button class="btn btn-primary filter-btn" data-role="all">All</button>
        <button class="btn btn-ghost filter-btn" data-role="student">Students</button>
        <button class="btn btn-ghost filter-btn" data-role="faculty">Faculty</button>
        <button class="btn btn-ghost filter-btn" data-role="admin">Admins</button>
      </div>
      <input type="text" id="user-search" class="input-search" placeholder="Search users..." style="max-width:300px;">
    </div>
    <div class="card">
      <div id="users-table">
        ${renderTable(filtered)}
      </div>
    </div>
  `;

  container.innerHTML = renderPage('Manage Users', 'Admin / Users', content);

  const updateView = () => {
    document.getElementById('users-table').innerHTML = renderTable(filtered);
    
    // reattach delete events
    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        showModal('Delete User', 'Are you sure? This is irreversible.', async () => {
          const delRes = await api.delete(`/users/${id}`);
          if (delRes.success) {
            showToast('User deleted');
            render(container); // full reload to get fresh data
          } else {
            showToast(delRes.error, 'error');
          }
        });
      });
    });
  };

  let currentRole = 'all';
  let currentSearch = '';

  const applyFilters = () => {
    filtered = users.filter(u => {
      const matchRole = currentRole === 'all' || u.role === currentRole;
      const matchSearch = u.name.toLowerCase().includes(currentSearch) || u.email.toLowerCase().includes(currentSearch);
      return matchRole && matchSearch;
    });
    updateView();
  };

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.remove('btn-primary');
        b.classList.add('btn-ghost');
      });
      e.target.classList.remove('btn-ghost');
      e.target.classList.add('btn-primary');
      currentRole = e.target.dataset.role;
      applyFilters();
    });
  });

  document.getElementById('user-search').addEventListener('input', (e) => {
    currentSearch = e.target.value.toLowerCase();
    applyFilters();
  });

  updateView();
}
