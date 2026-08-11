import { renderPage } from '../../components/shared.js';

// ── Auth guard ────────────────────────────────────────────────────────────
function getUser() {
  try {
    const u = JSON.parse(localStorage.getItem('currentUser'));
    if (!u || u.role !== 'student') { window.location.hash = '#/login'; return null; }
    return u;
  } catch { window.location.hash = '#/login'; return null; }
}

// ── localStorage helpers ──────────────────────────────────────────────────
function readStore() {
  try {
    const raw = localStorage.getItem('uniportal_data');
    return raw ? JSON.parse(raw) : { users: [], appointments: [], notifications: [] };
  } catch { return { users: [], appointments: [], notifications: [] }; }
}

function writeStore(store) {
  localStorage.setItem('uniportal_data', JSON.stringify(store));
}

function fmtDT(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    + ' · '
    + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// ── Status badge HTML ─────────────────────────────────────────────────────
function statusBadge(status) {
  const cfg = {
    pending  : { bg: '#f59e0b22', color: '#f59e0b', border: '#f59e0b', label: '⏳ Pending'   },
    confirmed: { bg: '#22c55e22', color: '#22c55e', border: '#22c55e', label: '✅ Confirmed'  },
    cancelled: { bg: '#ef444422', color: '#ef4444', border: '#ef4444', label: '❌ Cancelled'  },
    no_show  : { bg: '#6b728022', color: '#6b7280', border: '#6b7280', label: '👻 No Show'   },
    rescheduled: { bg: '#3b82f622', color: '#3b82f6', border: '#3b82f6', label: '🔄 Rescheduled' },
  };
  const c = cfg[status] || cfg.cancelled;
  return `<span style="background:${c.bg}; color:${c.color}; border:1px solid ${c.border};
    padding:0.25rem 0.75rem; border-radius:9999px; font-size:0.78rem; font-weight:600;
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

  const store   = readStore();
  const now     = new Date();
  const oneHour = 3600000;

  // All this student's appointments, newest first
  const allApts = (store.appointments || [])
    .filter(a => a.studentId === user.id)
    .sort((a, b) => new Date(b.slotDatetime) - new Date(a.slotDatetime));

  // Apply filter
  const displayApts = currentFilter === 'all'
    ? allApts
    : allApts.filter(a => a.status === currentFilter);

  // ── Filter bar ────────────────────────────────────────────────────────
  const filters = ['all', 'pending', 'confirmed', 'cancelled'];
  const filterBarHTML = filters.map(f => {
    const active = currentFilter === f;
    const label  = f.charAt(0).toUpperCase() + f.slice(1);
    return `<button class="filter-btn" data-filter="${f}" style="
      padding:0.5rem 1.1rem; border-radius:8px; cursor:pointer; font-weight:500;
      font-size:0.875rem; border:1px solid ${active ? '#6c63ff' : '#2a2a4a'};
      background:${active ? '#6c63ff' : '#1a1a2e'}; color:${active ? '#fff' : '#a0a0c0'};
      transition:all 0.15s;">${label}</button>`;
  }).join('');

  // ── Appointment cards ─────────────────────────────────────────────────
  let cardsHTML = '';

  if (allApts.length === 0) {
    // No appointments at all → empty state
    cardsHTML = `
      <div style="background:#1a1a2e; border:1px solid #2a2a4a; border-radius:12px;
        padding:3rem 2rem; text-align:center; margin-top:1rem;">
        <div style="font-size:3rem; margin-bottom:1rem;">📅</div>
        <div style="font-size:1.1rem; font-weight:600; color:#fff; margin-bottom:0.5rem;">
          No Appointments Yet
        </div>
        <div style="color:#a0a0c0; font-size:0.9rem; margin-bottom:1.5rem;">
          You haven't booked any appointments yet. Browse faculty to get started.
        </div>
        <button id="book-first-btn" style="padding:0.7rem 1.5rem; background:#6c63ff;
          color:#fff; border:none; border-radius:8px; cursor:pointer;
          font-weight:600; font-size:0.9rem;">
          Book Your First Appointment
        </button>
      </div>
    `;
  } else if (displayApts.length === 0) {
    // Filter active but no results
    cardsHTML = `
      <div style="background:#1a1a2e; border:1px solid #2a2a4a; border-radius:12px;
        padding:2rem; text-align:center; color:#a0a0c0; margin-top:1rem;">
        No <strong>${currentFilter}</strong> appointments found.
      </div>
    `;
  } else {
    cardsHTML = displayApts.map(a => {
      const faculty    = (store.users || []).find(u => u.id === a.facultyId);
      const slotDate   = new Date(a.slotDatetime);
      const isFuture1h = slotDate > new Date(Date.now() + oneHour);

      const canCancel    = isFuture1h && (a.status === 'pending' || a.status === 'confirmed');
      const canReschedule = isFuture1h && a.status === 'confirmed';

      const cancelBtn = canCancel ? `
        <button class="cancel-btn" data-id="${a.id}" data-fid="${a.facultyId}" data-dt="${a.slotDatetime}"
          style="padding:0.4rem 0.9rem; background:transparent;
            border:1px solid #ef4444; color:#ef4444; border-radius:6px;
            cursor:pointer; font-size:0.85rem; transition:background 0.15s;">
          Cancel
        </button>` : '';

      const reschedBtn = canReschedule ? `
        <button class="resched-btn" data-fid="${a.facultyId}"
          style="padding:0.4rem 0.9rem; background:transparent;
            border:1px solid #6c63ff; color:#6c63ff; border-radius:6px;
            cursor:pointer; font-size:0.85rem; transition:background 0.15s;">
          Reschedule
        </button>` : '';

      const actionRow = (cancelBtn || reschedBtn)
        ? `<div style="display:flex; gap:0.6rem; flex-wrap:wrap;">${reschedBtn}${cancelBtn}</div>`
        : '';

      return `
        <div style="background:#1a1a2e; border:1px solid #2a2a4a; border-radius:12px;
          padding:1.25rem 1.5rem; margin-bottom:1rem;
          display:flex; flex-direction:column; gap:0.75rem;">

          <!-- Top row: faculty info + status badge -->
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem;">
            <div>
              <div style="font-weight:600; color:#fff; font-size:1rem;">
                ${faculty ? faculty.name : 'Unknown Faculty'}
              </div>
              <div style="font-size:0.8rem; color:#a0a0c0; margin-top:0.15rem;">
                ${faculty ? (faculty.department || '') : ''}
              </div>
            </div>
            ${statusBadge(a.status)}
          </div>

          <!-- Middle row: date/time + reason -->
          <div style="display:flex; flex-direction:column; gap:0.35rem;">
            <div style="font-size:0.875rem; color:#a0a0c0;">
              📅 <span style="color:#e0e0e0;">${fmtDT(a.slotDatetime)}</span>
            </div>
            <div style="font-size:0.875rem; color:#a0a0c0;">
              📝 <span style="color:#e0e0e0;">${a.reason || '—'}</span>
            </div>
          </div>

          <!-- Bottom row: action buttons -->
          ${actionRow}
        </div>
      `;
    }).join('');
  }

  // ── Full page HTML ────────────────────────────────────────────────────
  const pageContent = `
    <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:1.5rem;">
      ${filterBarHTML}
    </div>
    <div id="apt-list">${cardsHTML}</div>
  `;

  // ── Write to DOM (renderPage returns a string — use innerHTML) ─────────
  container.innerHTML = renderPage('My Appointments', 'Student / My Appointments', pageContent);

  // ── Wire: filter buttons ──────────────────────────────────────────────
  container.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentFilter = btn.getAttribute('data-filter');
      render(container);
    });
  });

  // ── Wire: book first button (empty state) ─────────────────────────────
  const bookFirstBtn = container.querySelector('#book-first-btn');
  if (bookFirstBtn) {
    bookFirstBtn.addEventListener('click', () => { window.location.hash = '#/student/faculty'; });
  }

  // ── Wire: cancel buttons ──────────────────────────────────────────────
  container.querySelectorAll('.cancel-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const fid = btn.getAttribute('data-fid');
      const dt  = btn.getAttribute('data-dt');

      const confirmed = window.confirm('Are you sure you want to cancel this appointment?');
      if (!confirmed) return;

      const store = readStore();
      const apt = store.appointments.find(a => a.id === id);
      if (apt) {
        apt.status    = 'cancelled';
        apt.updatedAt = new Date().toISOString();
      }

      // Notify faculty
      store.notifications = store.notifications || [];
      store.notifications.push({
        id       : Date.now().toString(),
        userId   : fid,
        type     : 'booking_cancelled',
        message  : user.name + ' cancelled their appointment on ' + fmtDT(dt) + '.',
        read     : false,
        createdAt: new Date().toISOString(),
      });

      writeStore(store);
      render(container); // Refresh without full page reload
    });
  });

  // ── Wire: reschedule buttons ──────────────────────────────────────────
  container.querySelectorAll('.resched-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      window.location.hash = '#/student/faculty';
    });
  });
}
