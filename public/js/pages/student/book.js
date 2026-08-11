import { api } from '../../api.js';
import { renderSpinner, renderPage, renderEmpty, showToast } from '../../components/shared.js';

export async function render(container, facultyId) {
  container.innerHTML = renderSpinner();

  const [facRes, availRes] = await Promise.all([
    api.get(`/faculty/${facultyId}`),
    api.get(`/availability/${facultyId}`)
  ]);

  if (!facRes.success || !availRes.success) {
    container.innerHTML = renderPage('Book Appointment', 'Student / Faculty', `<div class="card"><p>Error loading data.</p></div>`);
    return;
  }

  const faculty = facRes.data;
  const slots = availRes.data || [];

  // Group slots by date
  const grouped = {};
  slots.forEach(slot => {
    const d = new Date(slot.datetime);
    const dateKey = d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(slot);
  });

  const initials = faculty.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();

  let selectedSlot = null;

  const content = `
    <div class="card" style="margin-bottom:2rem; display:flex; align-items:center; gap:1.5rem;">
      <div style="width:64px; height:64px; border-radius:50%; background:var(--primary-glow); border:1px solid var(--primary); display:flex; align-items:center; justify-content:center; font-size:1.5rem; font-weight:bold; color:var(--primary);">
        ${initials}
      </div>
      <div>
        <h2 style="font-size:var(--text-2xl)">${faculty.name}</h2>
        <div style="color:var(--text-2)">${faculty.department}</div>
      </div>
    </div>

    <h3 style="margin-bottom:1rem;">Available Slots</h3>
    ${slots.length === 0 ? renderEmpty('📅', 'No slots available', 'There are no available slots in the next 14 days.') : ''}
    
    <div id="slot-selection-area">
      ${Object.keys(grouped).map(dateKey => `
        <div style="margin-bottom:1.5rem;">
          <h4 style="color:var(--text-2); margin-bottom:0.5rem;">${dateKey}</h4>
          <div class="slot-grid">
            ${grouped[dateKey].map((slot, idx) => {
              const timeStr = new Date(slot.datetime).toLocaleTimeString('en-IN', { hour: '2-digit', minute:'2-digit' });
              return `<div class="slot-pill" data-datetime="${slot.datetime}" data-duration="${slot.duration}">${timeStr}</div>`;
            }).join('')}
          </div>
        </div>
      `).join('')}
    </div>

    <div id="booking-form-area" class="card" style="display:none; margin-top:2rem;">
      <h3 style="margin-bottom:1rem;">Confirm Booking</h3>
      <div style="margin-bottom:1rem; color:var(--primary); font-weight:600;" id="selected-slot-display"></div>
      <div class="form-group">
        <label class="form-label">Reason for meeting</label>
        <textarea id="booking-reason" class="form-control" required placeholder="Briefly describe what you'd like to discuss..."></textarea>
      </div>
      <div style="display:flex; gap:1rem; justify-content:flex-end">
        <button class="btn btn-ghost" id="cancel-booking">Cancel</button>
        <button class="btn btn-primary" id="confirm-booking">Book Appointment</button>
      </div>
    </div>
  `;

  container.innerHTML = renderPage('Book Appointment', `Student / Faculty / ${faculty.name}`, content);

  if (slots.length > 0) {
    const pills = document.querySelectorAll('.slot-pill');
    pills.forEach(pill => {
      pill.addEventListener('click', (e) => {
        pills.forEach(p => p.classList.remove('selected'));
        pill.classList.add('selected');
        
        selectedSlot = {
          datetime: pill.dataset.datetime,
          duration: parseInt(pill.dataset.duration, 10)
        };

        const formArea = document.getElementById('booking-form-area');
        formArea.style.display = 'block';
        
        const dt = new Date(selectedSlot.datetime);
        document.getElementById('selected-slot-display').textContent = dt.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }) + ` (${selectedSlot.duration} min)`;
        
        // Scroll to form
        formArea.scrollIntoView({ behavior: 'smooth' });
      });
    });

    document.getElementById('cancel-booking').addEventListener('click', () => {
      document.getElementById('booking-form-area').style.display = 'none';
      pills.forEach(p => p.classList.remove('selected'));
      selectedSlot = null;
    });

    document.getElementById('confirm-booking').addEventListener('click', async () => {
      const reason = document.getElementById('booking-reason').value.trim();
      if (!reason) {
        showToast('Please provide a reason', 'error');
        return;
      }
      
      const btn = document.getElementById('confirm-booking');
      btn.textContent = 'Booking...';
      btn.disabled = true;

      const res = await api.post('/appointments', {
        faculty_id: parseInt(facultyId, 10),
        slot_datetime: selectedSlot.datetime,
        duration: selectedSlot.duration,
        reason: reason
      });

      if (res.success) {
        showToast('Appointment requested successfully!');
        window.location.hash = '#/student/appointments';
      } else {
        showToast(res.error, 'error');
        btn.textContent = 'Book Appointment';
        btn.disabled = false;
      }
    });
  }
}
