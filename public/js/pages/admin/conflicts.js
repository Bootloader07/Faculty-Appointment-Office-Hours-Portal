import { api } from '../../api.js';
import { renderSpinner, renderPage, renderBadge, renderEmpty, showModal, showToast } from '../../components/shared.js';

export async function render(container) {
  container.innerHTML = renderSpinner();

  const res = await api.get('/admin/conflicts');
  if (!res.success) {
    container.innerHTML = renderPage('Conflicts', 'Admin', `<div class="card"><p>Error loading conflicts.</p></div>`);
    return;
  }

  const conflicts = res.data || [];
  const formatDateTime = (dt) => new Date(dt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' });

  const content = `
    <div style="background:rgba(239, 68, 68, 0.1); border-left:4px solid var(--status-cancelled); padding:1rem; border-radius:6px; margin-bottom:2rem; color:var(--text-1);">
      ⚠️ Conflicts occur when multiple overlapping appointments are confirmed for the same faculty member at the same time. This view highlights these scheduling anomalies.
    </div>

    ${!conflicts.length ? 
      `<div class="card" style="text-align:center; padding:4rem 2rem;">
        <div style="font-size:3rem; margin-bottom:1rem; color:var(--status-confirmed);">✅</div>
        <h3 style="color:var(--text-1); margin-bottom:0.5rem;">No conflicts detected</h3>
        <p style="color:var(--text-2);">All bookings are clean and valid.</p>
      </div>` 
    : `
      <div>
        ${conflicts.map(c => `
          <div class="card" style="margin-bottom:1.5rem; border-color:rgba(239, 68, 68, 0.3);">
            <div style="margin-bottom:1rem; border-bottom:1px solid var(--glass-border); padding-bottom:1rem;">
              <h3 style="color:var(--status-cancelled); margin-bottom:0.25rem;">Conflict at ${formatDateTime(c.slot_datetime)}</h3>
              <div style="color:var(--text-2);">Faculty ID: ${c.faculty_id}</div>
            </div>
            
            <div class="table-container">
              <table class="table" style="background:rgba(0,0,0,0.2); border-radius:6px;">
                <thead>
                  <tr>
                    <th>Appointment ID</th>
                    <th>Student Name</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${c.appointments.map(a => `
                    <tr>
                      <td>#${a.id}</td>
                      <td>${a.student_name}</td>
                      <td>${renderBadge(a.status)}</td>
                      <td>
                        <button class="btn btn-danger btn-cancel" data-id="${a.id}" style="padding:0.25rem 0.75rem; font-size:var(--text-xs);">Cancel</button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `).join('')}
      </div>
    `}
  `;

  container.innerHTML = renderPage('Schedule Conflicts', 'Admin / Conflicts', content);

  document.querySelectorAll('.btn-cancel').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      showModal('Resolve Conflict', 'Cancel this specific appointment to resolve the conflict?', async () => {
        const cancelRes = await api.put(`/appointments/${id}/cancel`);
        if (cancelRes.success) {
          showToast('Appointment cancelled');
          render(container); // reload
        } else {
          showToast(cancelRes.error, 'error');
        }
      });
    });
  });
}
