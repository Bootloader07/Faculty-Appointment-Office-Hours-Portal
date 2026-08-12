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
    <section class="student-dashboard page-transition">
      <header class="student-hero">
        <div class="student-hero__copy">
          <span class="section-kicker">Student workspace</span>
          <h1>Plan your next <span>conversation.</span></h1>
          <p>Keep appointment requests, confirmed office hours, and your academic schedule in one focused view.</p>
        </div>
        <button class="btn btn-primary animated-button student-hero__cta" id="btn-browse-faculty" type="button"><span>Browse faculty</span><span class="button-icon" aria-hidden="true">→</span></button>
      </header>

      <div class="student-stats-grid reveal-stagger" aria-label="Appointment summary">
        <article class="student-stat card tilt-card" data-tilt style="--stagger-index:0">
          <div class="student-stat__head"><span class="stat-icon" aria-hidden="true">◷</span><span class="student-stat__caption">Scheduled</span></div>
          <strong class="stat-value" data-count="${upcomingConfirmed.length}">0</strong>
          <span class="stat-label">Upcoming appointments</span>
        </article>
        <article class="student-stat card tilt-card" data-tilt style="--stagger-index:1">
          <div class="student-stat__head"><span class="stat-icon" aria-hidden="true">◌</span><span class="student-stat__caption">Awaiting review</span></div>
          <strong class="stat-value" data-count="${pendingApts.length}">0</strong>
          <span class="stat-label">Pending requests</span>
        </article>
        <article class="student-stat card tilt-card" data-tilt style="--stagger-index:2">
          <div class="student-stat__head"><span class="stat-icon" aria-hidden="true">✓</span><span class="student-stat__caption">Archive</span></div>
          <strong class="stat-value" data-count="${pastApts.length}">0</strong>
          <span class="stat-label">Past appointments</span>
        </article>
      </div>

      <div class="student-dashboard__sections">
        <section class="dashboard-panel card">
          <div class="dashboard-panel__heading">
            <div><span class="section-kicker">Calendar</span><h2>Upcoming appointments</h2></div>
            <span class="panel-status panel-status--live">Confirmed</span>
          </div>
          <div id="upcoming-list" class="appointment-stack"></div>
        </section>

        <section class="dashboard-panel card">
          <div class="dashboard-panel__heading">
            <div><span class="section-kicker">Requests</span><h2>Pending approval</h2></div>
            <span class="panel-status panel-status--pending">In review</span>
          </div>
          <div id="pending-list" class="appointment-stack"></div>
        </section>
      </div>
    </section>
  
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
