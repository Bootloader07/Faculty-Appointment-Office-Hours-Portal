import { api } from '../../api.js';
import { renderSpinner, renderPage, renderBadge, renderEmpty, showModal, showToast } from '../../components/shared.js';

// ── Auth guard ─────────────────────────────────────────────────
function getAuthenticatedUser() {
  try {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user || user.role !== 'faculty') {
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

  // Fetch data; degrade gracefully
  const [aptsRes, ohRes] = await Promise.all([
    api.get('/appointments'),
    api.get('/office-hours'),
  ]);

  const appointments = (aptsRes.success ? aptsRes.data : null) || [];
  const officeHours  = (ohRes.success  ? ohRes.data  : null) || [];

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const pending      = appointments.filter(a => a.status === 'pending');
  const todayAppts   = appointments.filter(a => {
    const d = new Date(a.slot_datetime);
    return a.status === 'confirmed' && d >= startOfDay && d < endOfDay;
  }).sort((a, b) => new Date(a.slot_datetime) - new Date(b.slot_datetime));

  const fmtTime = dt =>
    new Date(dt).toLocaleString('en-IN', { timeStyle: 'short', timeZone: 'Asia/Kolkata' });
  const fmtFull = dt =>
    new Date(dt).toLocaleString('en-IN', {
      dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata',
    });

  const todayCard = apt => `
    <div class="card" style="margin-bottom:0.75rem; display:flex; justify-content:space-between; align-items:center; gap:1rem;">
      <div>
        <div style="font-weight:600;">${apt.student_name || 'Student'}</div>
        <div style="color:var(--text-2); font-size:var(--text-sm);">🕐 ${fmtTime(apt.slot_datetime)} · ${apt.duration} min</div>
      </div>
      ${renderBadge(apt.status)}
    </div>
  `;

  const pendingCard = apt => `
    <div class="card" style="margin-bottom:0.75rem;" id="req-${apt.id}">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.5rem;">
        <div>
          <div style="font-weight:600;">${apt.student_name || 'Student'}</div>
          <div style="color:var(--text-2); font-size:var(--text-sm);">📅 ${fmtFull(apt.slot_datetime)} · ${apt.duration} min</div>
        </div>
        ${renderBadge(apt.status)}
      </div>
      <div style="background:var(--bg-base); padding:0.5rem 0.75rem; border-radius:6px; border:1px solid var(--glass-border); font-size:var(--text-sm); color:var(--text-2); margin-bottom:0.75rem;">
        ${apt.reason || '—'}
      </div>
      <div style="display:flex; gap:0.5rem; justify-content:flex-end;">
        <button class="btn btn-danger  btn-reject" data-id="${apt.id}" style="font-size:var(--text-sm);">✕ Reject</button>
        <button class="btn btn-primary btn-approve" data-id="${apt.id}" style="font-size:var(--text-sm);">✓ Approve</button>
      </div>
    </div>
  `;

  const hourStr = now.getHours() < 12 ? 'morning' : 'afternoon';
  const firstName = user.name.replace(/^Dr\.\s*/i, '').split(' ')[0];

  const content = `
    <!-- Stats row -->
    <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:1.5rem; margin-bottom:2.5rem;">
      <div class="card stat-card">
        <div class="icon" style="color:var(--status-confirmed);">📅</div>
        <div>
          <div class="value">${todayAppts.length}</div>
          <div class="label">Today's Appointments</div>
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
        <div class="icon" style="color:var(--primary);">🕒</div>
        <div>
          <div class="value">${officeHours.length}</div>
          <div class="label">Total Office Hours Set</div>
        </div>
      </div>
    </div>

    <!-- Two-column layout -->
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:2rem; margin-bottom:2rem;">

      <!-- Today's schedule -->
      <div>
        <h2 style="font-size:var(--text-xl); margin-bottom:1rem;">Today's Schedule</h2>
        <div>
          ${todayAppts.length
            ? todayAppts.map(todayCard).join('')
            : renderEmpty('☕', 'Clear schedule', 'No appointments scheduled for today.')
          }
        </div>
      </div>

      <!-- Pending requests -->
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
          <h2 style="font-size:var(--text-xl); margin:0;">Pending Requests</h2>
          <a href="#/faculty/requests" style="color:var(--primary); font-size:var(--text-sm); text-decoration:none;">
            View All →
          </a>
        </div>
        <div id="pending-list">
          ${pending.slice(0, 3).length
            ? pending.slice(0, 3).map(pendingCard).join('')
            : renderEmpty('✨', 'All caught up', 'No pending requests right now.')
          }
        </div>
      </div>
    </div>

    <!-- Quick action buttons -->
    <div style="display:flex; gap:1rem; flex-wrap:wrap;">
      <button class="btn btn-primary" onclick="window.location.hash='#/faculty/office-hours'">
        🕒 Set Office Hours
      </button>
      <button class="btn btn-outline" onclick="window.location.hash='#/faculty/requests'">
        📋 View All Requests
      </button>
    </div>
  `;

  container.innerHTML = renderPage(
    `Good ${hourStr}, Dr. ${firstName} 👋`,
    'Faculty / Dashboard',
    content
  );

  // ── Wire approve/reject buttons ─────────────────────────────
  container.querySelectorAll('.btn-approve').forEach(btn => {
    btn.addEventListener('click', async e => {
      const id = e.currentTarget.dataset.id;
      const res = await api.put(`/appointments/${id}/approve`);
      if (res.success) {
        showToast('Request approved! ✅');
        render(container);
      } else {
        showToast(res.error || 'Failed to approve', 'error');
      }
    });
  });

  container.querySelectorAll('.btn-reject').forEach(btn => {
    btn.addEventListener('click', e => {
      const id = e.currentTarget.dataset.id;
      showModal(
        'Reject Request',
        'Are you sure you want to reject this appointment request?',
        async () => {
          const res = await api.put(`/appointments/${id}/reject`);
          if (res.success) {
            showToast('Request rejected');
            render(container);
          } else {
            showToast(res.error || 'Failed to reject', 'error');
          }
        }
      );
    });
  });
}
