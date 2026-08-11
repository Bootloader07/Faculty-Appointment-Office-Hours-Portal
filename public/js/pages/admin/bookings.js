import { getAppointments, getUserById, updateAppointmentStatus, fmtDateTime } from '../../data/store.js';
import { renderBadge, renderEmpty, renderPage, showToast } from '../../components/shared.js';

function getUser(role) {
  try {
    const u = JSON.parse(localStorage.getItem('currentUser'));
    if (!u || u.role !== role) { window.location.hash = '#/login'; return null; }
    return u;
  } catch { window.location.hash = '#/login'; return null; }
}

let currentFilter = 'all';

export function render(container) {
  if (!getUser('admin')) return;

  const allAppointments = getAppointments();
  
  const stats = {
    total: allAppointments.length,
    pending: allAppointments.filter(a => a.status === 'pending').length,
    confirmed: allAppointments.filter(a => a.status === 'confirmed').length,
    cancelled: allAppointments.filter(a => a.status === 'cancelled').length,
    no_show: allAppointments.filter(a => a.status === 'no_show').length,
  };

  const filteredAppts = currentFilter === 'all' 
    ? allAppointments 
    : allAppointments.filter(a => a.status === currentFilter);

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'cancelled', label: 'Cancelled' },
    { id: 'no_show', label: 'No Show' }
  ];

  const content = `
    <div style="display: flex; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap;">
      ${filters.map(f => `
        <div class="stat-card card" style="flex: 1; min-width: 120px;">
          <div class="label">${f.label}</div>
          <div class="value">${f.id === 'all' ? stats.total : stats[f.id] || 0}</div>
        </div>
      `).join('')}
    </div>

    <div class="card" style="margin-bottom: 1rem;">
      <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
        ${filters.map(f => `
          <button class="btn filter-btn ${currentFilter === f.id ? 'btn-primary' : 'btn-outline'}" data-filter="${f.id}">
            ${f.label}
          </button>
        `).join('')}
      </div>

      ${filteredAppts.length > 0 ? `
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Faculty</th>
                <th>Date & Time</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filteredAppts.map(a => {
                const student = getUserById(a.studentId);
                const faculty = getUserById(a.facultyId);
                const canCancel = a.status === 'pending' || a.status === 'confirmed';
                return `
                  <tr>
                    <td>${student ? student.name : 'Unknown'}</td>
                    <td>${faculty ? faculty.name : 'Unknown'}</td>
                    <td>${fmtDateTime(a.slotDatetime)}</td>
                    <td>${a.reason || '-'}</td>
                    <td>${renderBadge(a.status)}</td>
                    <td>
                      ${canCancel ? `<button class="btn btn-danger btn-cancel" data-id="${a.id}" style="padding: 0.25rem 0.5rem; font-size: var(--text-xs);">Cancel</button>` : '-'}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      ` : renderEmpty('📅', 'No bookings found', 'No appointments match the selected filter.')}
    </div>
  `;

  container.innerHTML = renderPage('All Bookings', 'Admin / All Bookings', content);

  const filterBtns = container.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      currentFilter = e.target.getAttribute('data-filter');
      render(container);
    });
  });

  const cancelBtns = container.querySelectorAll('.btn-cancel');
  cancelBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.getAttribute('data-id');
      updateAppointmentStatus(id, 'cancelled');
      showToast('Booking cancelled', 'success');
      render(container);
    });
  });
}
