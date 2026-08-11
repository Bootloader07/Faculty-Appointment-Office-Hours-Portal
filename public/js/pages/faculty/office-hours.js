import {
  getOfficeHoursByFaculty,
  saveOfficeHours,
  deleteOfficeHours
} from '../../data/store.js';
import {
  renderEmpty,
  renderPage,
  showToast
} from '../../components/shared.js';

function getUser() {
  try {
    const u = JSON.parse(localStorage.getItem('currentUser'));
    if (!u || u.role !== 'faculty') {
      window.location.hash = '#/login';
      return null;
    }
    return u;
  } catch {
    window.location.hash = '#/login';
    return null;
  }
}

function fmtHHMM(t) {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return h12 + ':' + String(m).padStart(2, '0') + ' ' + ampm;
}

const DAY_ORDER = {Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6};

export function render(container) {
  const user = getUser();
  if (!user) return;

  const oh = getOfficeHoursByFaculty(user.id);
  oh.sort((a, b) => DAY_ORDER[a.dayOfWeek] - DAY_ORDER[b.dayOfWeek]);

  let ohHTML = '';
  if (oh.length === 0) {
    ohHTML = renderEmpty('Calendar', 'No office hours set', 'Add your availability above.');
  } else {
    ohHTML = oh.map(o => `
      <div class="card" style="margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong>${o.dayOfWeek}</strong> · ${fmtHHMM(o.startTime)} – ${fmtHHMM(o.endTime)} · ${o.slotDuration} min slots
        </div>
        <button class="btn btn-danger btn-delete" data-id="${o.id}">🗑️ Delete</button>
      </div>
    `).join('');
  }

  const content = `
    <div class="card" style="margin-bottom: 2rem;">
      <h3>Add Office Hours</h3>
      <div id="oh-error" style="color: #ef4444; margin-bottom: 1rem; display: none;"></div>
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; align-items: end;">
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">Day of Week</label>
          <select id="oh-day" class="form-control">
            <option value="Mon">Monday</option>
            <option value="Tue">Tuesday</option>
            <option value="Wed">Wednesday</option>
            <option value="Thu">Thursday</option>
            <option value="Fri">Friday</option>
            <option value="Sat">Saturday</option>
          </select>
        </div>
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">Start Time</label>
          <input type="time" id="oh-start" class="form-control">
        </div>
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">End Time</label>
          <input type="time" id="oh-end" class="form-control">
        </div>
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">Slot Duration</label>
          <select id="oh-duration" class="form-control">
            <option value="30">30 minutes</option>
            <option value="60">60 minutes</option>
          </select>
        </div>
      </div>
      <button id="btn-add-oh" class="btn btn-primary" style="margin-top: 1rem;">Add Office Hours</button>
    </div>

    <div>
      <h3>Your Office Hours</h3>
      ${ohHTML}
    </div>
  `;

  container.innerHTML = renderPage('Office Hours', 'Faculty / Office Hours', content);

  container.querySelector('#btn-add-oh').addEventListener('click', () => {
    const day = container.querySelector('#oh-day').value;
    const start = container.querySelector('#oh-start').value;
    const end = container.querySelector('#oh-end').value;
    const duration = container.querySelector('#oh-duration').value;
    const errDiv = container.querySelector('#oh-error');

    errDiv.style.display = 'none';

    if (!day || !start || !end || !duration) {
      errDiv.textContent = 'All fields are required.';
      errDiv.style.display = 'block';
      return;
    }

    if (start >= end) {
      errDiv.textContent = 'End time must be after start time.';
      errDiv.style.display = 'block';
      return;
    }

    const existing = oh.find(o => o.dayOfWeek === day);
    if (existing) {
      errDiv.textContent = 'You already have office hours set for this day.';
      errDiv.style.display = 'block';
      return;
    }

    saveOfficeHours({
      facultyId: user.id,
      dayOfWeek: day,
      startTime: start,
      endTime: end,
      slotDuration: parseInt(duration, 10),
      isRecurring: true
    });

    showToast('Office hours added!', 'success');
    render(container);
  });

  container.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.getAttribute('data-id');
      deleteOfficeHours(id);
      showToast('Deleted', 'success');
      render(container);
    });
  });
}
