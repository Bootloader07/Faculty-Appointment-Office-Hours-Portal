import {
  getUserById,
  getAvailableSlots,
  saveAppointment,
  addNotification,
  fmtDateTime,
  fmtDate,
  fmtTime,
  getUsers
} from '../../data/store.js';
import { renderEmpty, renderPage, showToast } from '../../components/shared.js';

function getUser() {
  try {
    const u = JSON.parse(localStorage.getItem('currentUser'));
    if (!u || u.role !== 'student') { window.location.hash = '#/login'; return null; }
    return u;
  } catch { window.location.hash = '#/login'; return null; }
}

let selectedDate = null;
let selectedSlot = null;

export function render(container, facultyId) {
  const user = getUser();
  if (!user) return;

  // Reset state on new page render
  selectedDate = null;
  selectedSlot = null;

  if (!facultyId) {
    container.innerHTML = renderPage('Book Appointment', 'Student / Book Appointment', `
      <div class="card" style="padding:2rem;text-align:center;">
        <h3 style="color:var(--status-cancelled);">No faculty selected</h3>
        <button class="btn btn-primary" id="go-back-btn" style="margin-top:1rem;">Go Back</button>
      </div>
    `);
    container.querySelector('#go-back-btn').onclick = () => window.location.hash = '#/student/faculty';
    return;
  }

  const faculty = getUserById(facultyId);
  if (!faculty) {
    container.innerHTML = renderPage('Book Appointment', 'Student / Book Appointment', `
      <div class="card" style="padding:2rem;text-align:center;">
        <h3 style="color:var(--status-cancelled);">Faculty not found</h3>
        <button class="btn btn-primary" id="go-back-btn" style="margin-top:1rem;">Go Back</button>
      </div>
    `);
    container.querySelector('#go-back-btn').onclick = () => window.location.hash = '#/student/faculty';
    return;
  }

  const slots = getAvailableSlots(facultyId, 14);

  if (slots.length === 0) {
    container.innerHTML = renderPage('Book Appointment', 'Student / Book Appointment', `
      <div class="card" style="padding:2rem;display:flex;align-items:center;gap:1.5rem;margin-bottom:2rem;">
        <div style="width:64px;height:64px;border-radius:50%;background:var(--primary);color:white;
          display:flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:bold;">
          ${faculty.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 style="margin:0 0 0.25rem 0;">${faculty.name}</h2>
          <div class="text-2">${faculty.department || 'General Department'}</div>
        </div>
      </div>
      <div class="card" style="padding:3rem 1rem;">
        ${renderEmpty('🕒', 'No slots available', faculty.name + ' has no available slots in the next 14 days.')}
        <div style="text-align:center;margin-top:1.5rem;">
          <button class="btn btn-outline" id="browse-btn">Browse Other Faculty</button>
        </div>
      </div>
    `);
    container.querySelector('#browse-btn').onclick = () => window.location.hash = '#/student/faculty';
    return;
  }

  const slotsByDate = {};
  slots.forEach(s => {
    if (!slotsByDate[s.dateKey]) slotsByDate[s.dateKey] = [];
    slotsByDate[s.dateKey].push(s);
  });

  const availableDates = Object.keys(slotsByDate).sort();

  // ── Render the booking UI ─────────────────────────────────────────────
  container.innerHTML = renderPage('Book Appointment', 'Student / Book Appointment', `
    <div class="card" style="padding:2rem;display:flex;align-items:center;gap:1.5rem;margin-bottom:2rem;">
      <div style="width:64px;height:64px;border-radius:50%;background:var(--primary);color:white;
        display:flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:bold;">
        ${faculty.name.charAt(0).toUpperCase()}
      </div>
      <div>
        <h2 style="margin:0 0 0.25rem 0;">${faculty.name}</h2>
        <div class="text-2">${faculty.department || 'General Department'}</div>
      </div>
    </div>

    <div class="card" style="padding:2rem;">
      <h3 style="margin-top:0;">1. Select Date</h3>
      <div id="date-picker" style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-bottom:2rem;"></div>

      <div id="time-section" style="display:none;margin-bottom:2rem;">
        <h3>2. Select Time</h3>
        <div id="time-picker" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:0.5rem;"></div>
      </div>

      <div id="form-section" style="display:none;">
        <h3>3. Reason for Appointment</h3>
        <textarea id="reason-input" class="input" rows="4"
          placeholder="Briefly describe what you'd like to discuss (min 10 characters)..."
          style="width:100%;margin-bottom:1rem;border-radius:4px;padding:0.75rem;
                 border:1px solid var(--border);box-sizing:border-box;"></textarea>
        <div id="form-error" style="color:var(--status-cancelled);margin-bottom:1rem;display:none;"></div>
        <div id="form-success" style="color:var(--status-confirmed);margin-bottom:1rem;display:none;font-weight:bold;"></div>
        <button id="btn-submit" class="btn btn-primary" style="width:100%;padding:1rem;font-size:1.1rem;">
          Submit Booking Request
        </button>
      </div>
    </div>
  `);

  // ── Wire up the interactive parts ──────────────────────────────────────
  const datePicker  = container.querySelector('#date-picker');
  const timeSection = container.querySelector('#time-section');
  const timePicker  = container.querySelector('#time-picker');
  const formSection = container.querySelector('#form-section');
  const reasonInput = container.querySelector('#reason-input');
  const formError   = container.querySelector('#form-error');
  const formSuccess = container.querySelector('#form-success');
  const btnSubmit   = container.querySelector('#btn-submit');

  function renderDateSelector() {
    datePicker.innerHTML = '';
    availableDates.forEach(dateKey => {
      const btn = document.createElement('button');
      btn.className = 'btn ' + (selectedDate === dateKey ? 'btn-primary' : 'btn-outline');
      btn.textContent = fmtDate(dateKey + 'T00:00:00');
      btn.onclick = () => {
        selectedDate = dateKey;
        selectedSlot = null;
        renderDateSelector();
        renderSlotPicker();
      };
      datePicker.appendChild(btn);
    });
  }

  function renderSlotPicker() {
    if (!selectedDate) {
      timeSection.style.display = 'none';
      formSection.style.display = 'none';
      return;
    }
    timeSection.style.display = 'block';
    timePicker.innerHTML = '';
    (slotsByDate[selectedDate] || []).forEach(slot => {
      const btn = document.createElement('button');
      btn.className = 'btn ' + (selectedSlot && selectedSlot.slotId === slot.slotId ? 'btn-primary' : 'btn-outline');
      btn.textContent = slot.timeLabel;
      btn.onclick = () => {
        selectedSlot = slot;
        renderSlotPicker();
        formSection.style.display = 'block';
      };
      timePicker.appendChild(btn);
    });
  }

  btnSubmit.onclick = () => {
    formError.style.display = 'none';
    formSuccess.style.display = 'none';
    const reason = reasonInput.value.trim();

    if (!selectedSlot) {
      formError.textContent = 'Please select a time slot.';
      formError.style.display = 'block';
      return;
    }
    if (reason.length < 10) {
      formError.textContent = 'Please provide a reason of at least 10 characters.';
      formError.style.display = 'block';
      return;
    }

    btnSubmit.disabled = true;

    saveAppointment({
      studentId   : user.id,
      facultyId,
      slotDatetime: selectedSlot.datetime,
      duration    : selectedSlot.duration,
      reason,
      status      : 'pending',
    });

    addNotification(
      facultyId,
      'booking_request',
      'New appointment request from ' + user.name + ' on ' + fmtDateTime(selectedSlot.datetime) + '. Reason: ' + reason
    );

    formSuccess.textContent = '✅ Booking request submitted! Awaiting faculty approval.';
    formSuccess.style.display = 'block';
    timeSection.style.display = 'none';
    datePicker.style.display = 'none';

    setTimeout(() => { window.location.hash = '#/student/appointments'; }, 2000);
  };

  renderDateSelector();
}
