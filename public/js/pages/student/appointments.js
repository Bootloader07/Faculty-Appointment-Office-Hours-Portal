import { api } from '../../api.js';
import { renderSpinner, renderPage, renderBadge, renderEmpty, showModal, showToast } from '../../components/shared.js';

export async function render(container) {
  container.innerHTML = renderSpinner();

  const res = await api.get('/appointments');
  if (!res.success) {
    container.innerHTML = renderPage('My Appointments', 'Student', `<div class="card"><p>Error loading appointments.</p></div>`);
    return;
  }

  const appointments = res.data || [];
  const now = new Date();
  
  const upcoming = appointments.filter(a => new Date(a.slot_datetime) > now && a.status !== 'cancelled').sort((a,b) => new Date(a.slot_datetime) - new Date(b.slot_datetime));
  const past = appointments.filter(a => new Date(a.slot_datetime) <= now || a.status === 'cancelled').sort((a,b) => new Date(b.slot_datetime) - new Date(a.slot_datetime));

  let currentTab = 'upcoming';

  const formatDateTime = (dt) => new Date(dt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' });

  const renderList = (list) => {
    if (!list.length) return renderEmpty('📝', 'No appointments found', 'You have no appointments in this category.');
    return list.map(apt => `
      <div class="card" style="margin-bottom:1rem; display:flex; flex-direction:column; gap:1rem;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <div style="font-weight:600; font-size:var(--text-lg)">${apt.faculty_name}</div>
            <div style="color:var(--text-2); font-size:var(--text-sm)">${formatDateTime(apt.slot_datetime)} · ${apt.duration} min</div>
          </div>
          ${renderBadge(apt.status)}
        </div>
        <div style="background:var(--bg-base); padding:0.75rem; border-radius:6px; border:1px solid var(--glass-border); font-size:var(--text-sm); color:var(--text-2);">
          ${apt.reason}
        </div>
        <div style="display:flex; gap:0.75rem; justify-content:flex-end">
          ${(apt.status === 'pending' || apt.status === 'confirmed') && new Date(apt.slot_datetime) > now ? 
            `<button class="btn btn-danger btn-cancel" data-id="${apt.id}">Cancel</button>` : ''}
          ${apt.status === 'confirmed' && new Date(apt.slot_datetime) > now ? 
            `<button class="btn btn-outline btn-reschedule" data-id="${apt.id}" data-faculty="${apt.faculty_id}">Reschedule</button>` : ''}
        </div>
      </div>
    `).join('');
  };

  const renderContent = () => `
    <div style="display:flex; gap:1rem; margin-bottom:2rem; border-bottom:1px solid var(--glass-border); padding-bottom:1rem;">
      <button class="btn ${currentTab === 'upcoming' ? 'btn-primary' : 'btn-ghost'}" id="tab-upcoming">Upcoming</button>
      <button class="btn ${currentTab === 'past' ? 'btn-primary' : 'btn-ghost'}" id="tab-past">Past</button>
      <button class="btn ${currentTab === 'all' ? 'btn-primary' : 'btn-ghost'}" id="tab-all">All</button>
    </div>
    <div id="appointments-list">
      ${renderList(currentTab === 'upcoming' ? upcoming : currentTab === 'past' ? past : appointments.sort((a,b)=>new Date(b.slot_datetime) - new Date(a.slot_datetime)))}
    </div>
  `;

  container.innerHTML = renderPage('My Appointments', 'Student', renderContent());

  const setupEvents = () => {
    ['upcoming', 'past', 'all'].forEach(tab => {
      document.getElementById(`tab-${tab}`).addEventListener('click', () => {
        currentTab = tab;
        container.innerHTML = renderPage('My Appointments', 'Student', renderContent());
        setupEvents();
      });
    });

    document.querySelectorAll('.btn-cancel').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        showModal('Cancel Appointment', 'Are you sure you want to cancel this appointment?', async () => {
          const res = await api.put(`/appointments/${id}/cancel`);
          if (res.success) {
            showToast('Appointment cancelled');
            render(container); // reload
          } else {
            showToast(res.error, 'error');
          }
        });
      });
    });

    // Simple reschedule flow: just redirect to book page for now to keep it simple, 
    // or we could show a modal with slots. The spec says "shows slot picker modal", 
    // but building a full modal here requires fetching slots. Let's do a redirect to book page to save code, 
    // Wait, spec says "calls GET /api/availability/:facultyId, shows slot picker, calls PUT /:id/reschedule".
    document.querySelectorAll('.btn-reschedule').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        const facultyId = e.target.dataset.faculty;
        
        showToast('Fetching availability...', 'info');
        const availRes = await api.get(`/availability/${facultyId}`);
        if (!availRes.success) {
          showToast('Failed to fetch availability', 'error');
          return;
        }

        const slots = availRes.data || [];
        if (!slots.length) {
          showToast('No slots available to reschedule', 'warning');
          return;
        }

        const selectHtml = `
          <select id="reschedule-slot" class="form-control" style="margin-bottom:1rem;">
            ${slots.map(s => {
              const dt = new Date(s.datetime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
              return `<option value="${s.datetime}">${dt} (${s.duration} min)</option>`;
            }).join('')}
          </select>
        `;

        showModal('Reschedule Appointment', `Select a new time slot:\n${selectHtml}`, async () => {
          const newDt = document.getElementById('reschedule-slot').value;
          const res = await api.put(`/appointments/${id}/reschedule`, { new_slot_datetime: newDt });
          if (res.success) {
            showToast('Appointment rescheduled');
            render(container);
          } else {
            showToast(res.error, 'error');
          }
        });
      });
    });
  };

  setupEvents();
}
