import {
  getOfficeHoursByFaculty,
  getAppointmentsByFaculty,
  updateAppointmentStatus,
  addNotification,
  fmtDateTime,
  fmtTime,
  getUserById
} from '../../data/store.js';
import {
  renderEmpty,
  renderPage,
  showToast,
  showModal
} from '../../components/shared.js';

function getUser() {
  try {
    const u = JSON.parse(localStorage.getItem('currentUser'));
    if (!u || u.role !== 'faculty') {
      window.location.hash = '#/login';
      return null;
    }
    return u;
  } catch {
    window.location.hash = '#/login';
    return null;
  }
}

export function render(container) {
  const user = getUser();
  if (!user) return;

  const apts = getAppointmentsByFaculty(user.id);
  const oh = getOfficeHoursByFaculty(user.id);

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const todayApts = apts.filter(a => {
    if (a.status !== 'confirmed') return false;
    const dt = new Date(a.slotDatetime);
    return dt >= startOfDay && dt <= endOfDay;
  });

  const pendingApts = apts.filter(a => a.status === 'pending');

  const greeting = `Good ${now.getHours() < 12 ? 'morning' : 'afternoon'}, ${user.name.split(' ')[0]} 👋`;

  let pendingHTML = '';
  if (pendingApts.length === 0) {
    pendingHTML = renderEmpty('Inbox', 'No pending requests', 'You are all caught up!');
  } else {
    pendingHTML = pendingApts.map(a => {
      const student = getUserById(a.studentId);
      return `
        <div class="card" style="margin-bottom: 1rem;">
          <div style="margin-bottom: 0.5rem;">
            <strong>${student ? student.name : 'Unknown Student'}</strong>
            <div style="font-size: 0.875rem; color: #a1a1aa;">${fmtDateTime(a.slotDatetime)}</div>
            <div style="margin-top: 0.25rem;">Reason: ${a.reason || 'None'}</div>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-primary btn-approve" data-id="${a.id}" data-student="${a.studentId}" data-dt="${a.slotDatetime}">✅ Approve</button>
            <button class="btn btn-danger btn-reject" data-id="${a.id}" data-student="${a.studentId}">❌ Reject</button>
          </div>
        </div>
      `;
    }).join('');
  }

  let todayHTML = '';
  if (todayApts.length === 0) {
    todayHTML = renderEmpty('Calendar', 'No appointments today', 'Enjoy your free time!');
  } else {
    todayHTML = todayApts.map(a => {
      const student = getUserById(a.studentId);
      const dt = new Date(a.slotDatetime);
      const isPast = dt < now;
      return `
        <div class="card" style="margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong>${student ? student.name : 'Unknown Student'}</strong>
            <div style="font-size: 0.875rem; color: #a1a1aa;">${fmtTime(a.slotDatetime)}</div>
            <div style="font-size: 0.875rem;">Reason: ${a.reason || 'None'}</div>
          </div>
          ${isPast ? `<button class="btn btn-outline btn-noshow" data-id="${a.id}">Mark No-Show</button>` : '<div>—</div>'}
        </div>
      `;
    }).join('');
  }

  const content = `
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem;">
      <div class="card stat-card">
        <div class="label">Today's Appointments</div>
        <div class="value">${todayApts.length}</div>
      </div>
      <div class="card stat-card">
        <div class="label">Pending Requests</div>
        <div class="value">${pendingApts.length}</div>
      </div>
      <div class="card stat-card">
        <div class="label">My Office Hours</div>
        <div class="value">${oh.length}</div>
      </div>
    </div>

    <div style="margin-bottom: 2rem; display: flex; gap: 1rem;">
      <a href="#/faculty/office-hours" class="btn btn-outline">Set Office Hours</a>
      <a href="#/faculty/appointments" class="btn btn-outline">View All Appointments</a>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
      <div>
        <h3>Pending Requests</h3>
        ${pendingHTML}
      </div>
      <div>
        <h3>Today's Schedule</h3>
        ${todayHTML}
      </div>
    </div>
  `;

  container.innerHTML = renderPage(greeting, 'Faculty / Dashboard', content);

  container.querySelectorAll('.btn-approve').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.getAttribute('data-id');
      const studentId = e.target.getAttribute('data-student');
      const dt = e.target.getAttribute('data-dt');
      updateAppointmentStatus(id, 'confirmed');
      addNotification(studentId, 'booking_confirmed', 'Your appointment with ' + user.name + ' on ' + fmtDateTime(dt) + ' has been confirmed.');
      render(container);
    });
  });

  container.querySelectorAll('.btn-reject').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.getAttribute('data-id');
      const studentId = e.target.getAttribute('data-student');
      showModal('Reject', 'Reject this request?', () => {
        updateAppointmentStatus(id, 'cancelled');
        addNotification(studentId, 'booking_cancelled', 'Your appointment request with ' + user.name + ' was declined.');
        render(container);
      });
    });
  });

  container.querySelectorAll('.btn-noshow').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.getAttribute('data-id');
      updateAppointmentStatus(id, 'no_show');
      render(container);
    });
  });
}
