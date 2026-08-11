import { getUsers, getUserById, getAppointmentsByStudent, saveAppointment, updateAppointmentStatus, addNotification, getAvailableSlots, fmtDateTime, fmtDate, fmtTime } from '../../data/store.js';
import { renderBadge, renderEmpty, renderPage, showToast, showModal } from '../../components/shared.js';

function getUser() {
  try {
    const u = JSON.parse(localStorage.getItem('currentUser'));
    if (!u || u.role !== 'student') { window.location.hash = '#/login'; return null; }
    return u;
  } catch { window.location.hash = '#/login'; return null; }
}

export function render(container) {
  const user = getUser();
  if (!user) return;

  const apts = getAppointmentsByStudent(user.id);
  const now = new Date();

  const upcomingConfirmed = apts.filter(a => a.status === 'confirmed' && new Date(a.slotDatetime) > now).sort((a, b) => new Date(a.slotDatetime) - new Date(b.slotDatetime));
  const pendingApts = apts.filter(a => a.status === 'pending').sort((a, b) => new Date(a.slotDatetime) - new Date(b.slotDatetime));
  const pastApts = apts.filter(a => new Date(a.slotDatetime) < now && (a.status === 'confirmed' || a.status === 'no_show')).sort((a, b) => new Date(b.slotDatetime) - new Date(a.slotDatetime));

  const content = document.createElement('div');
  content.className = 'dashboard-container';

  content.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
      <div class="card" style="padding: 1.5rem; text-align: center;">
        <div style="font-size: 2rem; font-weight: bold; color: var(--primary);">${upcomingConfirmed.length}</div>
        <div class="text-2">Upcoming Appointments</div>
      </div>
      <div class="card" style="padding: 1.5rem; text-align: center;">
        <div style="font-size: 2rem; font-weight: bold; color: var(--warning, #f59e0b);">${pendingApts.length}</div>
        <div class="text-2">Pending Requests</div>
      </div>
      <div class="card" style="padding: 1.5rem; text-align: center;">
        <div style="font-size: 2rem; font-weight: bold; color: var(--success, #10b981);">${pastApts.length}</div>
        <div class="text-2">Past Appointments</div>
      </div>
    </div>

    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
      <h2>My Upcoming Appointments</h2>
      <button class="btn btn-primary" id="btn-browse-faculty">Browse Faculty & Book Appointment</button>
    </div>
    <div id="upcoming-list" style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem;"></div>

    <h2 style="margin-bottom: 1rem;">My Pending Requests</h2>
    <div id="pending-list" style="display: flex; flex-direction: column; gap: 1rem;"></div>
  `;

  // Render upcoming
  const upcomingContainer = content.querySelector('#upcoming-list');
  if (upcomingConfirmed.length === 0) {
    upcomingContainer.innerHTML = renderEmpty('calendar', 'No upcoming appointments', 'You have no confirmed appointments coming up.');
    const emptyBtn = document.createElement('button');
    emptyBtn.className = 'btn btn-primary';
    emptyBtn.style.marginTop = '1rem';
    emptyBtn.textContent = 'Browse Faculty & Book Appointment';
    emptyBtn.onclick = () => window.location.hash = '#/student/faculty';
    upcomingContainer.querySelector('.empty-state').appendChild(emptyBtn);
  } else {
    upcomingConfirmed.forEach(a => {
      const faculty = getUserById(a.facultyId);
      const card = document.createElement('div');
      card.className = 'card';
      card.style.display = 'flex';
      card.style.justifyContent = 'space-between';
      card.style.alignItems = 'center';
      card.style.padding = '1.5rem';

      const isCancelable = new Date(a.slotDatetime) > new Date(now.getTime() + 3600000);
      
      card.innerHTML = `
        <div>
          <h3 style="margin: 0 0 0.5rem 0;">${faculty ? faculty.name : 'Unknown Faculty'}</h3>
          <div class="text-2" style="margin-bottom: 0.5rem;">🗓 ${fmtDateTime(a.slotDatetime)}</div>
          <div class="text-2" style="margin-bottom: 0.5rem;">📝 ${a.reason}</div>
          ${renderBadge(a.status)}
        </div>
        <div>
          ${isCancelable ? `<button class="btn btn-outline cancel-btn" data-id="${a.id}" data-fid="${a.facultyId}" data-dt="${a.slotDatetime}">Cancel</button>` : ''}
        </div>
      `;
      upcomingContainer.appendChild(card);
    });
  }

  // Render pending
  const pendingContainer = content.querySelector('#pending-list');
  if (pendingApts.length === 0) {
    pendingContainer.innerHTML = renderEmpty('clock', '✨ No pending requests', 'You have no pending appointment requests.');
  } else {
    pendingApts.forEach(a => {
      const faculty = getUserById(a.facultyId);
      const card = document.createElement('div');
      card.className = 'card';
      card.style.display = 'flex';
      card.style.justifyContent = 'space-between';
      card.style.alignItems = 'center';
      card.style.padding = '1.5rem';

      const isCancelable = new Date(a.slotDatetime) > new Date(now.getTime() + 3600000);

      card.innerHTML = `
        <div>
          <h3 style="margin: 0 0 0.5rem 0;">${faculty ? faculty.name : 'Unknown Faculty'}</h3>
          <div class="text-2" style="margin-bottom: 0.5rem;">🗓 ${fmtDateTime(a.slotDatetime)}</div>
          <div class="text-2" style="margin-bottom: 0.5rem;">📝 ${a.reason}</div>
          ${renderBadge(a.status)}
        </div>
        <div>
          ${isCancelable ? `<button class="btn btn-outline cancel-btn" data-id="${a.id}" data-fid="${a.facultyId}" data-dt="${a.slotDatetime}">Cancel Request</button>` : ''}
        </div>
      `;
      pendingContainer.appendChild(card);
    });
  }

  // Event Listeners
  content.querySelector('#btn-browse-faculty').onclick = () => window.location.hash = '#/student/faculty';

  content.querySelectorAll('.cancel-btn').forEach(btn => {
    btn.onclick = (e) => {
      const id = e.target.getAttribute('data-id');
      const fid = e.target.getAttribute('data-fid');
      const dt = e.target.getAttribute('data-dt');
      
      updateAppointmentStatus(id, 'cancelled');
      addNotification(fid, 'booking_cancelled', `Student ${user.name} cancelled their appointment on ${fmtDateTime(dt)}.`);
      showToast('Appointment cancelled', 'success');
      render(container); // Re-render page
    };
  });

  // renderPage() returns an HTML string — use innerHTML, not appendChild
  container.innerHTML = renderPage('Welcome, ' + user.name.split(' ')[0] + ' 👋', 'Student / Dashboard', content.outerHTML);

  // Re-wire events (innerHTML discards the DOM nodes built above)
  container.querySelector('#btn-browse-faculty').onclick = () => window.location.hash = '#/student/faculty';

  container.querySelectorAll('.cancel-btn').forEach(btn => {
    btn.onclick = (e) => {
      const b = e.currentTarget;
      const id = b.getAttribute('data-id');
      const fid = b.getAttribute('data-fid');
      const dt = b.getAttribute('data-dt');
      updateAppointmentStatus(id, 'cancelled');
      addNotification(fid, 'booking_cancelled', 'Student ' + user.name + ' cancelled their appointment on ' + fmtDateTime(dt) + '.');
      showToast('Appointment cancelled', 'success');
      render(container);
    };
  });
}
