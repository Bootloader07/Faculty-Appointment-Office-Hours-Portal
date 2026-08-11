import { api } from '../../api.js';
import { renderSpinner, renderPage, renderBadge, renderEmpty } from '../../components/shared.js';

// ── Auth guard ─────────────────────────────────────────────────
function getAuthenticatedUser() {
  try {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user || user.role !== 'student') {
      window.location.hash = '#/login';
      return null;
    }
    return user;
  } catch {
    window.location.hash = '#/login';
    return null;
  }
}

export async function render(container) {
  const user = getAuthenticatedUser();
  if (!user) return;

  container.innerHTML = renderSpinner();

  // Fetch appointments from server; fall back to empty array gracefully
  const res = await api.get('/appointments');
  const appointments = (res.success ? res.data : null) || [];

  const now   = new Date();
  const total  = appointments.length;
  const confirmed = appointments.filter(a => a.status === 'confirmed');
  const pending   = appointments.filter(a => a.status === 'pending');
  const cancelled = appointments.filter(a => a.status === 'cancelled');

  const upcomingConfirmed = confirmed
    .filter(a => new Date(a.slot_datetime) > now)
    .sort((a, b) => new Date(a.slot_datetime) - new Date(b.slot_datetime))
    .slice(0, 5);

  const pendingRequests = pending
    .sort((a, b) => new Date(a.slot_datetime) - new Date(b.slot_datetime));

  const fmt = dt =>
    new Date(dt).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Kolkata',
    });

  const appointmentCard = apt => `
    <div class="card" style="margin-bottom:1rem; display:flex; justify-content:space-between; align-items:center; gap:1rem;">
      <div>
        <div style="font-weight:600; font-size:var(--text-lg); margin-bottom:0.25rem;">
          ${apt.faculty_name || 'Faculty'}
        </div>
        <div style="color:var(--text-2); font-size:var(--text-sm);">
          📅 ${fmt(apt.slot_datetime)} · ${apt.duration} min
        </div>
        ${apt.reason ? `<div style="color:var(--text-3); font-size:var(--text-xs); margin-top:0.25rem;">${apt.reason}</div>` : ''}
      </div>
      <div style="flex-shrink:0;">
        ${renderBadge(apt.status)}
      </div>
    </div>
  `;

  const content = `
    <!-- Stats row -->
    <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:1.5rem; margin-bottom:2.5rem;">
      <div class="card stat-card">
        <div class="icon" style="color:var(--status-confirmed);">✅</div>
        <div>
          <div class="value">${upcomingConfirmed.length}</div>
          <div class="label">Upcoming Appointments</div>
        </div>
      </div>
      <div class="card stat-card">
        <div class="icon" style="color:var(--status-pending);">⏳</div>
        <div>
          <div class="value">${pending.length}</div>
          <div class="label">Pending Requests</div>
        </div>
      </div>
      <div class="card stat-card">
        <div class="icon" style="color:var(--primary);">📅</div>
        <div>
          <div class="value">${total}</div>
          <div class="label">Total Bookings</div>
        </div>
      </div>
    </div>

    <!-- Upcoming appointments -->
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
      <h2 style="font-size:var(--text-xl); margin:0;">Upcoming Appointments</h2>
      <button class="btn btn-primary" onclick="window.location.hash='#/student/faculty'">
        ＋ Book Appointment
      </button>
    </div>

    <div style="margin-bottom:2.5rem;">
      ${upcomingConfirmed.length
        ? upcomingConfirmed.map(appointmentCard).join('')
        : `<div class="card" style="text-align:center; padding:2rem;">
             <div style="font-size:2rem; margin-bottom:0.75rem;">🏖️</div>
             <div style="color:var(--text-1); font-weight:500; margin-bottom:0.5rem;">No upcoming appointments</div>
             <div style="color:var(--text-2); font-size:var(--text-sm); margin-bottom:1.25rem;">
               No upcoming appointments. Book one now →
             </div>
             <button class="btn btn-primary" onclick="window.location.hash='#/student/faculty'">
               Browse Faculty &amp; Book Appointment
             </button>
           </div>`
      }
    </div>

    <!-- Pending requests -->
    <h2 style="font-size:var(--text-xl); margin-bottom:1rem;">Pending Requests</h2>
    <div>
      ${pendingRequests.length
        ? pendingRequests.map(appointmentCard).join('')
        : renderEmpty('✨', 'All caught up!', 'No pending requests at the moment.')
      }
    </div>
  `;

  const firstName = user.name.split(' ')[0];
  container.innerHTML = renderPage(
    `Welcome, ${firstName} 👋`,
    'Student / Dashboard',
    content
  );
}
