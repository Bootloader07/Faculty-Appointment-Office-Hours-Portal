import { api } from '../../api.js';
import { renderSpinner, renderPage, renderEmpty, showModal, showToast } from '../../components/shared.js';

export async function render(container) {
  container.innerHTML = renderSpinner();

  const res = await api.get('/office-hours');
  if (!res.success) {
    container.innerHTML = renderPage('Office Hours', 'Faculty', `<div class="card"><p>Error loading office hours.</p></div>`);
    return;
  }

  const officeHours = res.data || [];

  const daysMap = {
    0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday'
  };

  const content = `
    <div class="card" style="margin-bottom:2rem;">
      <h3 style="margin-bottom:1rem;">Add Office Hours</h3>
      <form id="oh-form" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap:1rem; align-items:end;">
        <div class="form-group" style="margin:0;">
          <label class="form-label">Day of Week</label>
          <select id="day_of_week" class="form-control" required>
            <option value="1">Monday</option>
            <option value="2">Tuesday</option>
            <option value="3">Wednesday</option>
            <option value="4">Thursday</option>
            <option value="5">Friday</option>
            <option value="6">Saturday</option>
            <option value="0">Sunday</option>
          </select>
        </div>
        <div class="form-group" style="margin:0;">
          <label class="form-label">Start Time</label>
          <input type="time" id="start_time" class="form-control" required>
        </div>
        <div class="form-group" style="margin:0;">
          <label class="form-label">End Time</label>
          <input type="time" id="end_time" class="form-control" required>
        </div>
        <div class="form-group" style="margin:0;">
          <label class="form-label">Slot Duration</label>
          <select id="slot_duration" class="form-control" required>
            <option value="15">15 min</option>
            <option value="30" selected>30 min</option>
            <option value="45">45 min</option>
            <option value="60">60 min</option>
          </select>
        </div>
        <button type="submit" class="btn btn-primary" style="height:42px;">Add</button>
      </form>
    </div>

    <div class="card">
      <h3 style="margin-bottom:1rem;">Current Office Hours</h3>
      ${!officeHours.length ? renderEmpty('🕒', 'No office hours set', 'Add your availability above.') : `
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Day</th>
                <th>Time</th>
                <th>Duration</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${officeHours.sort((a,b)=>a.day_of_week - b.day_of_week).map(oh => `
                <tr>
                  <td>${daysMap[oh.day_of_week]}</td>
                  <td>${oh.start_time} - ${oh.end_time}</td>
                  <td>${oh.slot_duration} min</td>
                  <td>
                    <button class="btn btn-ghost btn-delete" data-id="${oh.id}" style="color:var(--status-cancelled)">🗑️</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>
  `;

  container.innerHTML = renderPage('Office Hours', 'Faculty', content);

  document.getElementById('oh-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      day_of_week: parseInt(document.getElementById('day_of_week').value, 10),
      start_time: document.getElementById('start_time').value,
      end_time: document.getElementById('end_time').value,
      slot_duration: parseInt(document.getElementById('slot_duration').value, 10)
    };

    if (payload.start_time >= payload.end_time) {
      showToast('Start time must be before end time', 'error');
      return;
    }

    const btn = e.target.querySelector('button');
    btn.disabled = true;
    
    const ohRes = await api.post('/office-hours', payload);
    if (ohRes.success) {
      showToast('Office hours added');
      render(container);
    } else {
      showToast(ohRes.error, 'error');
      btn.disabled = false;
    }
  });

  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      showModal('Delete Office Hours', 'Are you sure you want to remove this slot block?', async () => {
        const delRes = await api.delete(`/office-hours/${id}`);
        if (delRes.success) {
          showToast('Deleted');
          render(container);
        } else {
          showToast(delRes.error, 'error');
        }
      });
    });
  });
}
