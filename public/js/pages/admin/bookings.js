import { api } from '../../api.js';
import { renderSpinner, renderPage, renderBadge, renderEmpty, showModal, showToast } from '../../components/shared.js';

export async function render(container) {
  container.innerHTML = renderSpinner();

  const res = await api.get('/appointments');
  if (!res.success) {
    container.innerHTML = renderPage('All Bookings', 'Admin', `<div class="card"><p>Error loading bookings.</p></div>`);
    return;
  }

  const appointments = res.data || [];
  let filtered = [...appointments].sort((a,b)=>new Date(b.slot_datetime)-new Date(a.slot_datetime));

  const formatDateTime = (dt) => new Date(dt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' });

  const renderTable = (list) => {
    if (!list.length) return renderEmpty('📅', 'No bookings found', '');
    return `
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Date / Time</th>
              <th>Student</th>
              <th>Faculty</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${list.map(a => `
              <tr>
                <td>
                  <div style="font-weight:500">${formatDateTime(a.slot_datetime)}</div>
                  <div style="font-size:var(--text-xs); color:var(--text-2)">${a.duration} min</div>
                </td>
                <td>${a.student_name}</td>
                <td>${a.faculty_name}</td>
                <td>${renderBadge(a.status)}</td>
                <td>
                  ${(a.status === 'pending' || a.status === 'confirmed') ? 
                    `<button class="btn btn-ghost btn-cancel" data-id="${a.id}" style="color:var(--status-cancelled); padding:0.25rem 0.5rem; font-size:var(--text-xs);">Force Cancel</button>` 
                  : '-'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  };

  const content = `
    <div class="card" style="margin-bottom:2rem; display:flex; gap:1rem; align-items:center; justify-content:space-between; flex-wrap:wrap;">
      <div style="display:flex; gap:0.5rem; overflow-x:auto;">
        <button class="btn btn-primary filter-btn" data-status="all">All</button>
        <button class="btn btn-ghost filter-btn" data-status="pending">Pending</button>
        <button class="btn btn-ghost filter-btn" data-status="confirmed">Confirmed</button>
        <button class="btn btn-ghost filter-btn" data-status="cancelled">Cancelled</button>
        <button class="btn btn-ghost filter-btn" data-status="no-show">No-Show</button>
      </div>
      <input type="text" id="booking-search" class="input-search" placeholder="Search by name..." style="max-width:300px;">
    </div>
    <div class="card">
      <div id="bookings-table">
        ${renderTable(filtered)}
      </div>
    </div>
  `;

  container.innerHTML = renderPage('All Bookings', 'Admin / Bookings', content);

  const updateView = () => {
    document.getElementById('bookings-table').innerHTML = renderTable(filtered);
    
    document.querySelectorAll('.btn-cancel').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        showModal('Admin Override: Cancel', 'Are you sure you want to forcibly cancel this booking?', async () => {
          const cancelRes = await api.put(`/appointments/${id}/cancel`);
          if (cancelRes.success) {
            showToast('Booking cancelled via admin override');
            render(container); // reload
          } else {
            showToast(cancelRes.error, 'error');
          }
        });
      });
    });
  };

  let currentStatus = 'all';
  let currentSearch = '';

  const applyFilters = () => {
    filtered = appointments.filter(a => {
      const matchStatus = currentStatus === 'all' || a.status === currentStatus;
      const matchSearch = a.student_name.toLowerCase().includes(currentSearch) || a.faculty_name.toLowerCase().includes(currentSearch);
      return matchStatus && matchSearch;
    }).sort((a,b)=>new Date(b.slot_datetime)-new Date(a.slot_datetime));
    updateView();
  };

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.remove('btn-primary');
        b.classList.add('btn-ghost');
      });
      e.target.classList.remove('btn-ghost');
      e.target.classList.add('btn-primary');
      currentStatus = e.target.dataset.status;
      applyFilters();
    });
  });

  document.getElementById('booking-search').addEventListener('input', (e) => {
    currentSearch = e.target.value.toLowerCase();
    applyFilters();
  });

  updateView();
}
