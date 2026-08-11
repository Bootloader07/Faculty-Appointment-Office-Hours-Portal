import { getUsers, getAppointments, getUserById, fmtDateTime } from '../../data/store.js';
import { renderBadge, renderEmpty, renderPage } from '../../components/shared.js';

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
  const appointments = getAppointments();

  const totalUsers = users.length;
  const totalFaculty = users.filter(u => u.role === 'faculty').length;
  const totalStudents = users.filter(u => u.role === 'student').length;
  const totalBookings = appointments.length;

  const recentBookings = [...appointments]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const activeAppts = appointments.filter(a => a.status === 'pending' || a.status === 'confirmed');
  const grouped = activeAppts.reduce((acc, a) => {
    const key = `${a.facultyId}_${a.slotDatetime}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(a);
    return acc;
  }, {});

  const conflicts = Object.values(grouped).filter(group => group.length > 1);

  const content = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
      <div class="stat-card card">
        <div class="label">Total Users</div>
        <div class="value">${totalUsers}</div>
      </div>
      <div class="stat-card card">
        <div class="label">Total Faculty</div>
        <div class="value">${totalFaculty}</div>
      </div>
      <div class="stat-card card">
        <div class="label">Total Students</div>
        <div class="value">${totalStudents}</div>
      </div>
      <div class="stat-card card">
        <div class="label">Total Bookings</div>
        <div class="value">${totalBookings}</div>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; margin-bottom: 2rem;">
      <div class="card">
        <h3 style="margin-top: 0;">Recent Bookings</h3>
        ${recentBookings.length > 0 ? `
          <div class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Faculty</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${recentBookings.map(a => {
                  const student = getUserById(a.studentId);
                  const faculty = getUserById(a.facultyId);
                  return `
                    <tr>
                      <td>${student ? student.name : 'Unknown'}</td>
                      <td>${faculty ? faculty.name : 'Unknown'}</td>
                      <td>${fmtDateTime(a.slotDatetime)}</td>
                      <td>${renderBadge(a.status)}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        ` : renderEmpty('📋', 'No bookings yet', 'Bookings will appear here.')}
      </div>

      <div class="card">
        <h3 style="margin-top: 0;">Conflict Alerts</h3>
        ${conflicts.length > 0 ? `
          <div style="display: flex; flex-direction: column; gap: 1rem;">
            ${conflicts.map(group => {
              const faculty = getUserById(group[0].facultyId);
              return `
                <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid var(--status-cancelled); padding: 1rem; border-radius: 8px;">
                  <h4 style="margin: 0 0 0.5rem 0; color: var(--status-cancelled);">Conflict Detected</h4>
                  <div style="font-size: var(--text-sm);">
                    <strong>${faculty ? faculty.name : 'Unknown'}</strong><br>
                    ${fmtDateTime(group[0].slotDatetime)}<br>
                    ${group.length} overlapping bookings
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        ` : `
          <div style="text-align: center; padding: 2rem; color: var(--status-confirmed);">
            <div style="font-size: 2rem; margin-bottom: 1rem;">✅</div>
            No scheduling conflicts detected
          </div>
        `}
      </div>
    </div>

    <div style="display: flex; gap: 1rem;">
      <button id="btnManageUsers" class="btn btn-primary">Manage Users</button>
      <button id="btnViewBookings" class="btn btn-outline">View All Bookings</button>
    </div>
  `;

  container.innerHTML = renderPage('Admin Dashboard 🛠️', 'Admin / Dashboard', content);

  container.querySelector('#btnManageUsers').addEventListener('click', () => {
    window.location.hash = '#/admin/users';
  });
  container.querySelector('#btnViewBookings').addEventListener('click', () => {
    window.location.hash = '#/admin/bookings';
  });
}
