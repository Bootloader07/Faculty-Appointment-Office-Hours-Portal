import { api } from '../../api.js';
import { renderSpinner, renderPage, renderBadge, renderEmpty, showModal, showToast } from '../../components/shared.js';

export async function render(container) {
  container.innerHTML = renderSpinner();

  const res = await api.get('/appointments');
  if (!res.success) {
    container.innerHTML = renderPage('Requests', 'Faculty', `<div class="card"><p>Error loading requests.</p></div>`);
    return;
  }

  const appointments = res.data || [];
  const now = new Date();
  
  const pending = appointments.filter(a => a.status === 'pending').sort((a,b) => new Date(a.slot_datetime) - new Date(b.slot_datetime));
  const confirmed = appointments.filter(a => a.status === 'confirmed').sort((a,b) => new Date(a.slot_datetime) - new Date(b.slot_datetime));
  const all = [...appointments].sort((a,b) => new Date(b.slot_datetime) - new Date(a.slot_datetime));

  let currentTab = 'pending';

  const formatDateTime = (dt) => new Date(dt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' });

  const renderList = (list, tab) => {
    if (!list.length) return renderEmpty('📋', 'No requests found', 'Nothing to see here.');
    return list.map(apt => {
      const isPast = new Date(apt.slot_datetime) < now;
      return `
      <div class="card" style="margin-bottom:1rem; display:flex; flex-direction:column; gap:1rem;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <div style="font-weight:600; font-size:var(--text-lg)">${apt.student_name}</div>
            <div style="color:var(--text-2); font-size:var(--text-sm)">${formatDateTime(apt.slot_datetime)} · ${apt.duration} min</div>
          </div>
          ${renderBadge(apt.status)}
        </div>
        <div style="background:var(--bg-base); padding:0.75rem; border-radius:6px; border:1px solid var(--glass-border); font-size:var(--text-sm); color:var(--text-2);">
          ${apt.reason}
        </div>
        <div style="display:flex; gap:0.75rem; justify-content:flex-end">
          ${apt.status === 'pending' ? `
            <button class="btn btn-danger btn-reject" data-id="${apt.id}">Reject</button>
            <button class="btn btn-primary btn-approve" data-id="${apt.id}">Approve</button>
          ` : ''}
          ${apt.status === 'confirmed' && isPast ? `
            <button class="btn btn-outline btn-noshow" data-id="${apt.id}">Mark No-Show</button>
          ` : ''}
        </div>
      </div>
    `}).join('');
  };

  const renderContent = () => `
    <div style="display:flex; gap:1rem; margin-bottom:2rem; border-bottom:1px solid var(--glass-border); padding-bottom:1rem;">
      <button class="btn ${currentTab === 'pending' ? 'btn-primary' : 'btn-ghost'}" id="tab-pending">Pending Requests <span class="badge badge-pending" style="margin-left:0.5rem">${pending.length}</span></button>
      <button class="btn ${currentTab === 'confirmed' ? 'btn-primary' : 'btn-ghost'}" id="tab-confirmed">Confirmed</button>
      <button class="btn ${currentTab === 'all' ? 'btn-primary' : 'btn-ghost'}" id="tab-all">All</button>
    </div>
    <div id="appointments-list">
      ${renderList(currentTab === 'pending' ? pending : currentTab === 'confirmed' ? confirmed : all, currentTab)}
    </div>
  `;

  container.innerHTML = renderPage('Appointment Requests', 'Faculty', renderContent());

  const setupEvents = () => {
    ['pending', 'confirmed', 'all'].forEach(tab => {
      document.getElementById(`tab-${tab}`).addEventListener('click', () => {
        currentTab = tab;
        container.innerHTML = renderPage('Appointment Requests', 'Faculty', renderContent());
        setupEvents();
      });
    });

    document.querySelectorAll('.btn-approve').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        const res = await api.put(`/appointments/${id}/approve`);
        if(res.success) { showToast('Approved!'); render(container); }
        else showToast(res.error, 'error');
      });
    });

    document.querySelectorAll('.btn-reject').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        showModal('Reject Request', 'Are you sure you want to reject this request?', async () => {
          const res = await api.put(`/appointments/${id}/reject`);
          if(res.success) { showToast('Rejected'); render(container); }
          else showToast(res.error, 'error');
        });
      });
    });

    document.querySelectorAll('.btn-noshow').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        showModal('Mark No-Show', 'Did the student miss the appointment?', async () => {
          const res = await api.put(`/appointments/${id}/no-show`);
          if(res.success) { showToast('Marked as No-Show'); render(container); }
          else showToast(res.error, 'error');
        });
      });
    });
  };

  setupEvents();
}
