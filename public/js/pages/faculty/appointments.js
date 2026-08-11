import {
  getAppointmentsByFaculty,
  updateAppointmentStatus,
  addNotification,
  fmtDateTime,
  getUserById
} from '../../data/store.js';
import {
  renderBadge,
  renderEmpty,
  renderPage,
  showToast,
  showModal
} from '../../components/shared.js';

function getUser() {
  try {
    const u = JSON.parse(localStorage.getItem('currentUser'));
    if (!u || u.role !== 'faculty') { window.location.hash = '#/login'; return null; }
    return u;
  } catch { window.location.hash = '#/login'; return null; }
}

let currentFilter = 'all';

export function render(container) {
  const user = getUser();
  if (!user) return;

  const allApts = getAppointmentsByFaculty(user.id);
  const now = new Date();

  allApts.sort((a, b) => new Date(b.slotDatetime) - new Date(a.slotDatetime));

  const filteredApts = allApts.filter(a => {
    if (currentFilter === 'all') return true;
    if (currentFilter === 'no_show') return a.status === 'no_show';
    return a.status === currentFilter;
  });

  let tableHTML = '';
  if (filteredApts.length === 0) {
    tableHTML = renderEmpty('📅', 'No appointments found', 'No appointments match the selected filter.');
  } else {
    const rows = filteredApts.map(a => {
      const student = getUserById(a.studentId);
      const studentName = student ? student.name : 'Unknown';
      const isPast = new Date(a.slotDatetime) < now;

      let actions = '—';
      if (a.status === 'pending') {
        actions = '<div style="display:flex;gap:0.5rem;">'
          + '<button class="btn btn-primary btn-approve" data-id="' + a.id + '" data-student="' + a.studentId + '" data-dt="' + a.slotDatetime + '">✅ Approve</button>'
          + '<button class="btn btn-danger btn-reject" data-id="' + a.id + '" data-student="' + a.studentId + '">❌ Reject</button>'
          + '</div>';
      } else if (a.status === 'confirmed' && isPast) {
        actions = '<button class="btn btn-outline btn-noshow" data-id="' + a.id + '">Mark No-Show</button>';
      }

      return '<tr>'
        + '<td style="padding:0.75rem 1rem;">' + studentName + '</td>'
        + '<td style="padding:0.75rem 1rem;">' + fmtDateTime(a.slotDatetime) + '</td>'
        + '<td style="padding:0.75rem 1rem;">' + (a.reason || '—') + '</td>'
        + '<td style="padding:0.75rem 1rem;">' + renderBadge(a.status) + '</td>'
        + '<td style="padding:0.75rem 1rem;">' + actions + '</td>'
        + '</tr>';
    }).join('');

    tableHTML = '<div class="table-container"><table class="table">'
      + '<thead><tr><th>Student</th><th>Date &amp; Time</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead>'
      + '<tbody>' + rows + '</tbody>'
      + '</table></div>';
  }

  const filterBtns = ['all', 'pending', 'confirmed', 'cancelled', 'no_show'].map(f =>
    '<button class="btn ' + (currentFilter === f ? 'btn-primary' : 'btn-outline') + ' btn-filter" data-filter="' + f + '">'
    + (f === 'no_show' ? 'No Show' : f.charAt(0).toUpperCase() + f.slice(1))
    + '</button>'
  ).join('');

  const content = '<div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:1.5rem;">' + filterBtns + '</div>'
    + '<div class="card">' + tableHTML + '</div>';

  container.innerHTML = renderPage('All Appointments', 'Faculty / Appointments', content);

  container.querySelectorAll('.btn-filter').forEach(btn => {
    btn.addEventListener('click', e => {
      currentFilter = e.currentTarget.getAttribute('data-filter');
      render(container);
    });
  });

  container.querySelectorAll('.btn-approve').forEach(btn => {
    btn.addEventListener('click', e => {
      const b = e.currentTarget;
      const id = b.getAttribute('data-id');
      const studentId = b.getAttribute('data-student');
      const dt = b.getAttribute('data-dt');
      updateAppointmentStatus(id, 'confirmed');
      addNotification(studentId, 'booking_confirmed', 'Your appointment with ' + user.name + ' on ' + fmtDateTime(dt) + ' has been confirmed.');
      showToast('Appointment approved');
      render(container);
    });
  });

  container.querySelectorAll('.btn-reject').forEach(btn => {
    btn.addEventListener('click', e => {
      const b = e.currentTarget;
      const id = b.getAttribute('data-id');
      const studentId = b.getAttribute('data-student');
      showModal('Reject Appointment', 'Are you sure you want to reject this request?', () => {
        updateAppointmentStatus(id, 'cancelled');
        addNotification(studentId, 'booking_cancelled', 'Your appointment request with ' + user.name + ' was declined.');
        render(container);
      });
    });
  });

  container.querySelectorAll('.btn-noshow').forEach(btn => {
    btn.addEventListener('click', e => {
      const id = e.currentTarget.getAttribute('data-id');
      updateAppointmentStatus(id, 'no_show');
      showToast('Marked as no-show');
      render(container);
    });
  });
}
