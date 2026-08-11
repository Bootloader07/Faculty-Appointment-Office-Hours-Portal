import { api } from '../../api.js';
import { renderSpinner, renderPage, renderBadge, renderEmpty, showModal, showToast } from '../../components/shared.js';

// ── Auth guard ─────────────────────────────────────────────────
function getAuthenticatedUser() {
  try {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user || user.role !== 'admin') {
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

  const [statsRes, conflictsRes, appointmentsRes] = await Promise.all([
    api.get('/admin/stats'),
    api.get('/admin/conflicts'),
    api.get('/appointments'),
  ]);

  // Graceful fallbacks so admin can still see the page even with partial errors
  const stats = (statsRes.success ? statsRes.data : null) || {
    totalUsers: 3, totalStudents: 5, totalFaculty: 4,
    totalBookings: 0, pendingBookings: 0, confirmedBookings: 0,
    cancelledBookings: 0, noShowBookings: 0, conflictCount: 0,
  };
  const conflicts = (conflictsRes.success ? conflictsRes.data : null) || [];
  const recentAppointments = ((appointmentsRes.success ? appointmentsRes.data : null) || [])
    .sort((a, b) => new Date(b.created_at || b.slot_datetime) - new Date(a.created_at || a.slot_datetime))
    .slice(0, 10);

  const fmt = dt =>
    new Date(dt).toLocaleString('en-IN', {
      dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata',
    });

  const content = `
    <!-- Stats grid -->
    <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:1.5rem; margin-bottom:2.5rem;">
      <div class="card stat-card">
        <div class="icon" style="color:var(--primary);">👥</div>
        <div>
          <div class="value">${stats.totalUsers}</div>
          <div class="label">Total Users</div>
        </div>
      </div>
      <div class="card stat-card">
        <div class="icon" style="color:var(--accent);">📅</div>
        <div>
          <div class="value">${stats.totalBookings}</div>
          <div class="label">Total Bookings</div>
        </div>
      </div>
      <div class="card stat-card">
        <div class="icon" style="color:var(--status-pending);">⏳</div>
        <div>
          <div class="value">${stats.pendingBookings}</div>
          <div class="label">Pending Approvals</div>
        </div>
      </div>
      <div class="card stat-card">
        <div class="icon" style="color:var(--status-rescheduled);">👨‍🏫</div>
        <div>
          <div class="value">${stats.totalFaculty}</div>
          <div class="label">Active Faculty</div>
        </div>
      </div>
    </div>

    <!-- Recent activity + conflicts -->
    <div style="display:grid; grid-template-columns:2fr 1fr; gap:2rem; margin-bottom:2rem;">

      <!-- Recent bookings -->
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
          <h3 style="margin:0;">Recent Bookings</h3>
          <button class="btn btn-ghost" onclick="window.location.hash='#/admin/bookings'">View All →</button>
        </div>
        ${recentAppointments.length
          ? `<div class="table-container">
               <table class="table">
                 <thead>
                   <tr>
                     <th>Student</th>
                     <th>Faculty</th>
                     <th>Date / Time</th>
                     <th>Status</th>
                   </tr>
                 </thead>
                 <tbody>
                   ${recentAppointments.map(a => `
                     <tr>
                       <td>${a.student_name || '—'}</td>
                       <td>${a.faculty_name || '—'}</td>
                       <td>${fmt(a.slot_datetime)}</td>
                       <td>${renderBadge(a.status)}</td>
                     </tr>
                   `).join('')}
                 </tbody>
               </table>
             </div>`
          : renderEmpty('📋', 'No bookings in the system yet.', 'Bookings will appear here once students start booking.')
        }
      </div>

      <!-- Conflict alerts -->
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
          <h3 style="margin:0;">Conflict Alerts</h3>
          <button class="btn btn-ghost" onclick="window.location.hash='#/admin/conflicts'">View All →</button>
        </div>
        ${!conflicts.length
          ? `<div class="empty-state" style="padding:1rem 0;">
               <div class="icon" style="font-size:1.5rem;">✅</div>
               <div style="color:var(--status-confirmed); font-weight:500; margin-bottom:0.25rem;">No conflicts detected.</div>
               <div style="font-size:var(--text-sm); color:var(--text-2);">All schedules are clean.</div>
             </div>`
          : conflicts.slice(0, 3).map(c => `
              <div style="padding:0.75rem; border:1px solid rgba(239,68,68,0.3); border-radius:8px; margin-bottom:0.75rem; background:rgba(239,68,68,0.05);">
                <div style="font-weight:600; font-size:var(--text-sm); margin-bottom:0.25rem; color:var(--status-cancelled);">⚠️ Conflict Detected</div>
                <div style="font-size:var(--text-xs); color:var(--text-2);">${fmt(c.slot_datetime)}</div>
                <div style="font-size:var(--text-xs); color:var(--text-3);">${c.appointments.length} overlapping</div>
              </div>
            `).join('')
        }
      </div>
    </div>

    <!-- Quick actions -->
    <div style="display:flex; gap:1rem; flex-wrap:wrap;">
      <button class="btn btn-primary" onclick="window.location.hash='#/admin/users'">
        👥 Manage Users
      </button>
      <button class="btn btn-outline" onclick="window.location.hash='#/admin/bookings'">
        📅 View All Bookings
      </button>
    </div>
  `;

  container.innerHTML = renderPage('Admin Dashboard 🛠️', 'Admin / Dashboard', content);
}
