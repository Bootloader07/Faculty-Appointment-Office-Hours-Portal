import { api } from '../../api.js';
import { renderSpinner, renderPage, renderEmpty, showModal, showToast } from '../../components/shared.js';

export async function render(container) {
  container.innerHTML = renderSpinner();

  const res = await api.get('/blocked-dates');
  if (!res.success) {
    container.innerHTML = renderPage('Blocked Dates', 'Faculty', `<div class="card"><p>Error loading blocked dates.</p></div>`);
    return;
  }

  const blockedDates = res.data || [];

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const content = `
    <div style="background:rgba(59, 130, 246, 0.1); border-left:4px solid var(--status-rescheduled); padding:1rem; border-radius:6px; margin-bottom:2rem; color:var(--text-1);">
      ℹ️ Blocking a date prevents students from booking slots on that day even if office hours are set. Use this for holidays, leave, or special events.
    </div>

    <div class="card" style="margin-bottom:2rem;">
      <h3 style="margin-bottom:1rem;">Block a Date</h3>
      <form id="block-form" style="display:flex; gap:1rem; align-items:end; flex-wrap:wrap;">
        <div class="form-group" style="margin:0; flex:1; min-width:200px;">
          <label class="form-label">Date</label>
          <input type="date" id="blocked_date" class="form-control" required min="${minDate}">
        </div>
        <div class="form-group" style="margin:0; flex:2; min-width:250px;">
          <label class="form-label">Reason (Optional)</label>
          <input type="text" id="reason" class="form-control" placeholder="e.g. Vacation, Conference...">
        </div>
        <button type="submit" class="btn btn-primary" style="height:42px;">Block Date</button>
      </form>
    </div>

    <div class="card">
      <h3 style="margin-bottom:1rem;">Upcoming Blocked Dates</h3>
      ${!blockedDates.length ? renderEmpty('🏖️', 'No blocked dates', 'Your schedule is fully open according to your office hours.') : `
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Reason</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${blockedDates.sort((a,b)=>new Date(a.blocked_date)-new Date(b.blocked_date)).map(bd => `
                <tr>
                  <td>${new Date(bd.blocked_date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</td>
                  <td>${bd.reason || '-'}</td>
                  <td>
                    <button class="btn btn-ghost btn-delete" data-id="${bd.id}" style="color:var(--status-cancelled)">Unblock</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>
  `;

  container.innerHTML = renderPage('Blocked Dates', 'Faculty', content);

  document.getElementById('block-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      blocked_date: document.getElementById('blocked_date').value,
      reason: document.getElementById('reason').value
    };

    const btn = e.target.querySelector('button');
    btn.disabled = true;
    
    const ohRes = await api.post('/blocked-dates', payload);
    if (ohRes.success) {
      showToast('Date blocked successfully');
      render(container);
    } else {
      showToast(ohRes.error, 'error');
      btn.disabled = false;
    }
  });

  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      showModal('Unblock Date', 'Are you sure you want to unblock this date? Students will be able to book slots again.', async () => {
        const delRes = await api.delete(`/blocked-dates/${id}`);
        if (delRes.success) {
          showToast('Date unblocked');
          render(container);
        } else {
          showToast(delRes.error, 'error');
        }
      });
    });
  });
}
