import {
  getAppointmentsByStudent,
  getUserById,
  updateAppointmentStatus,
  addNotification,
  fmtDateTime
} from '../../data/store.js';
import { renderBadge, renderEmpty, renderPage, showToast } from '../../components/shared.js';

// ── Auth guard ────────────────────────────────────────────────────────────
function getUser() {
  try {
    const u = JSON.parse(localStorage.getItem('currentUser'));
    if (!u || u.role !== 'student') { window.location.hash = '#/login'; return null; }
    return u;
  } catch { window.location.hash = '#/login'; return null; }
}

// ── Status badge ──────────────────────────────────────────────────────────
function statusBadge(status) {
  const cfg = {
    pending    : { bg: 'rgba(245,158,11,0.13)',  color: '#f59e0b', border: '#f59e0b', label: '⏳ Pending'    },
    confirmed  : { bg: 'rgba(34,197,94,0.13)',   color: '#22c55e', border: '#22c55e', label: '✅ Confirmed'   },
    cancelled  : { bg: 'rgba(239,68,68,0.13)',   color: '#ef4444', border: '#ef4444', label: '❌ Cancelled'   },
    no_show    : { bg: 'rgba(107,114,128,0.13)', color: '#6b7280', border: '#6b7280', label: '👻 No Show'     },
    rescheduled: { bg: 'rgba(59,130,246,0.13)',  color: '#3b82f6', border: '#3b82f6', label: '🔄 Rescheduled' },
  };
  const c = cfg[status] || cfg.cancelled;
  return `<span style="background:${c.bg};color:${c.color};border:1px solid ${c.border};
    padding:0.25rem 0.75rem;border-radius:9999px;font-size:0.78rem;font-weight:600;
    white-space:nowrap;">${c.label}</span>`;
}

// ── Page state ────────────────────────────────────────────────────────────
let currentFilter = 'all';

// ══════════════════════════════════════════════════════════════════════════
// MAIN RENDER
// ══════════════════════════════════════════════════════════════════════════
export function render(container) {
  const user = getUser();
  if (!user) return;

  const now     = new Date();
  const oneHour = 3600000;

  // Read via store.js (correct key 'uniportal_v2')
  const allApts = getAppointmentsByStudent(user.id)
    .sort((a, b) => new Date(b.slotDatetime) - new Date(a.slotDatetime));

  const displayApts = currentFilter === 'all'
    ? allApts
    : allApts.filter(a => a.status === currentFilter);

  // ── Filter bar ────────────────────────────────────────────────────────
  const filters   = ['all', 'pending', 'confirmed', 'cancelled'];
  const filterBar = filters.map(f => {
    const active = currentFilter === f;
    return `<button class="btn ${active ? 'btn-primary' : 'btn-outline'} filter-btn"
      data-filter="${f}">${f.charAt(0).toUpperCase() + f.slice(1)}</button>`;
  }).join('');

  // ── Appointment cards ─────────────────────────────────────────────────
  let cardsHTML = '';

  if (allApts.length === 0) {
    cardsHTML = `
      <div class="card" style="padding:3rem 2rem;text-align:center;margin-top:1rem;">
        <div style="font-size:3rem;margin-bottom:1rem;">📅</div>
        <div style="font-size:1.1rem;font-weight:600;margin-bottom:0.5rem;">No Appointments Yet</div>
        <div style="color:var(--text-2);font-size:0.9rem;margin-bottom:1.5rem;">
          You haven't booked any appointments yet. Browse faculty to get started.
        </div>
        <button id="book-first-btn" class="btn btn-primary">Book Your First Appointment</button>
      </div>
    `;
  } else if (displayApts.length === 0) {
    cardsHTML = `
      <div class="card" style="padding:2rem;text-align:center;color:var(--text-2);margin-top:1rem;">
        No <strong>${currentFilter}</strong> appointments found.
      </div>
    `;
  } else {
    cardsHTML = displayApts.map(a => {
      const faculty    = getUserById(a.facultyId);
      const isFuture1h = new Date(a.slotDatetime) > new Date(Date.now() + oneHour);
      const canCancel  = isFuture1h && (a.status === 'pending' || a.status === 'confirmed');
      const canResched = isFuture1h && a.status === 'confirmed';

      const cancelBtn = canCancel
        ? `<button class="btn btn-outline cancel-btn" data-id="${a.id}"
             data-fid="${a.facultyId}" data-dt="${a.slotDatetime}"
             style="border-color:var(--status-cancelled);color:var(--status-cancelled);">
             Cancel
           </button>`
        : '';

      const reschedBtn = canResched
        ? `<button class="btn btn-outline resched-btn"
             style="border-color:var(--primary);color:var(--primary);">
             Reschedule
           </button>`
        : '';

      const actionRow = (cancelBtn || reschedBtn)
        ? `<div style="display:flex;gap:0.6rem;flex-wrap:wrap;">${reschedBtn}${cancelBtn}</div>`
        : '';

      return `
        <div style="background:var(--bg-surface);border:1px solid var(--glass-border);
          border-radius:12px;padding:1.25rem 1.5rem;margin-bottom:1rem;
          display:flex;flex-direction:column;gap:0.75rem;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;">
            <div>
              <div style="font-weight:600;font-size:1rem;">
                ${faculty ? faculty.name : 'Unknown Faculty'}
              </div>
              <div style="font-size:0.8rem;color:var(--text-2);margin-top:0.15rem;">
                ${faculty ? (faculty.department || '') : ''}
              </div>
            </div>
            ${statusBadge(a.status)}
          </div>
          <div style="display:flex;flex-direction:column;gap:0.35rem;">
            <div style="font-size:0.875rem;color:var(--text-2);">
              📅 <span style="color:var(--text-1);">${fmtDateTime(a.slotDatetime)}</span>
            </div>
            <div style="font-size:0.875rem;color:var(--text-2);">
              📝 <span style="color:var(--text-1);">${a.reason || '—'}</span>
            </div>
          </div>
          ${actionRow}
        </div>
      `;
    }).join('');
  }

  container.innerHTML = renderPage('My Appointments', 'Student / My Appointments', `
    <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:1.5rem;">${filterBar}</div>
    <div id="apt-list">${cardsHTML}</div>
  `);

  // ── Wire: filter buttons ──────────────────────────────────────────────
  container.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentFilter = btn.getAttribute('data-filter');
      render(container);
    });
  });

  // ── Wire: book first button ───────────────────────────────────────────
  const bookFirstBtn = container.querySelector('#book-first-btn');
  if (bookFirstBtn) {
    bookFirstBtn.addEventListener('click', () => { window.location.hash = '#/student/faculty'; });
  }

  // ── Wire: cancel buttons ──────────────────────────────────────────────
  container.querySelectorAll('.cancel-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id  = btn.getAttribute('data-id');
      const fid = btn.getAttribute('data-fid');
      const dt  = btn.getAttribute('data-dt');

      if (!window.confirm('Are you sure you want to cancel this appointment?')) return;

      updateAppointmentStatus(id, 'cancelled');
      addNotification(fid, 'booking_cancelled',
        user.name + ' cancelled their appointment on ' + fmtDateTime(dt) + '.'
      );
      showToast('Appointment cancelled', 'success');
      render(container);
    });
  });

  // ── Wire: reschedule buttons ──────────────────────────────────────────
  container.querySelectorAll('.resched-btn').forEach(btn => {
    btn.addEventListener('click', () => { window.location.hash = '#/student/faculty'; });
  });
}
