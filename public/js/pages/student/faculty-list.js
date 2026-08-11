import { renderPage, showToast } from '../../components/shared.js';

// ── Auth guard ────────────────────────────────────────────────────────────
function getUser() {
  try {
    const u = JSON.parse(localStorage.getItem('currentUser'));
    if (!u || u.role !== 'student') { window.location.hash = '#/login'; return null; }
    return u;
  } catch { window.location.hash = '#/login'; return null; }
}

// ── Read store directly from localStorage ─────────────────────────────────
function readStore() {
  try {
    const raw = localStorage.getItem('uniportal_data');
    return raw ? JSON.parse(raw) : { users: [], officeHours: [], blockedDates: [], appointments: [], notifications: [] };
  } catch { return { users: [], officeHours: [], blockedDates: [], appointments: [], notifications: [] }; }
}

function writeStore(store) {
  localStorage.setItem('uniportal_data', JSON.stringify(store));
}

// ── Slot generator (exactly as spec) ─────────────────────────────────────
function generateSlots(facultyId) {
  const store = readStore();
  const officeHours  = store.officeHours.filter(oh => oh.facultyId === facultyId);
  const blockedDates = store.blockedDates.filter(bd => bd.facultyId === facultyId);
  const bookedSlots  = store.appointments
    .filter(a => a.facultyId === facultyId && (a.status === 'pending' || a.status === 'confirmed'))
    .map(a => a.slotDatetime);

  const slots = [];
  const now   = new Date();
  const days  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  for (let i = 0; i < 14; i++) {
    const date    = new Date();
    date.setDate(now.getDate() + i);
    const dayName = days[date.getDay()];

    const dayHours = officeHours.filter(oh => oh.dayOfWeek === dayName);
    if (dayHours.length === 0) continue;

    const dateStr   = date.toISOString().split('T')[0];
    const isBlocked = blockedDates.some(bd => bd.date === dateStr);
    if (isBlocked) continue;

    dayHours.forEach(oh => {
      const [startH, startM] = oh.startTime.split(':').map(Number);
      const [endH,   endM  ] = oh.endTime.split(':').map(Number);
      const duration = parseInt(oh.slotDuration, 10) || 30;
      let current = startH * 60 + startM;
      const end   = endH * 60 + endM;

      while (current < end) {
        const slotDate = new Date(date);
        slotDate.setHours(Math.floor(current / 60), current % 60, 0, 0);

        const cutoff = new Date(now.getTime() + 60 * 60 * 1000);
        if (slotDate > cutoff) {
          const iso     = slotDate.toISOString();
          const isTaken = bookedSlots.includes(iso);
          slots.push({
            datetime: iso,
            label   : slotDate.toLocaleString('en-IN', {
              weekday: 'short', month: 'short', day: 'numeric',
              hour: '2-digit', minute: '2-digit',
            }),
            taken  : isTaken,
            dateStr,
          });
        }
        current += duration;
      }
    });
  }
  return slots;
}

// ── Format date header ────────────────────────────────────────────────────
function fmtDateHeader(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'short', year: 'numeric',
  });
}

// ── Format datetime ───────────────────────────────────────────────────────
function fmtDT(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    + ' · '
    + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// ── Page-level state ──────────────────────────────────────────────────────
let selectedFacultyId = null;
let selectedSlot      = null;

// ══════════════════════════════════════════════════════════════════════════
// MAIN RENDER
// ══════════════════════════════════════════════════════════════════════════
export function render(container) {
  const user = getUser();
  if (!user) return;

  const store   = readStore();
  const faculty = store.users.filter(u => u.role === 'faculty');

  // ── Faculty grid HTML ─────────────────────────────────────────────────
  const facultyCardsHTML = faculty.length === 0
    ? '<p style="color:#a0a0c0; text-align:center; padding:2rem;">No faculty available at this time.</p>'
    : faculty.map(f => {
        const initial = (f.name || '?').charAt(0).toUpperCase();
        const isSelected = selectedFacultyId === f.id;
        return `
          <div class="faculty-card" style="
            background:#1a1a2e; border:1px solid ${isSelected ? '#6c63ff' : '#2a2a4a'};
            border-radius:12px; padding:1.5rem;
            display:flex; flex-direction:column; align-items:center;
            text-align:center; gap:1rem; transition:border-color 0.2s;
          ">
            <div style="width:56px; height:56px; border-radius:50%;
              background:#6c63ff22; border:2px solid #6c63ff;
              display:flex; align-items:center; justify-content:center;
              font-size:1.4rem; font-weight:700; color:#6c63ff;">
              ${initial}
            </div>
            <div>
              <div style="font-weight:600; font-size:1rem; color:#fff; margin-bottom:0.25rem;">${f.name}</div>
              <div style="font-size:0.875rem; color:#a0a0c0;">${f.department || 'Department'}</div>
            </div>
            <button data-fid="${f.id}"
              style="width:100%; padding:0.6rem 1rem; background:#6c63ff;
                color:#fff; border:none; border-radius:8px; cursor:pointer;
                font-weight:500; font-size:0.9rem; transition:opacity 0.2s;">
              Book Appointment
            </button>
          </div>
        `;
      }).join('');

  // ── Booking panel HTML ────────────────────────────────────────────────
  let bookingPanelHTML = '';
  if (selectedFacultyId) {
    const fac   = store.users.find(u => u.id === selectedFacultyId);
    const slots = generateSlots(selectedFacultyId);

    if (slots.length === 0) {
      bookingPanelHTML = `
        <div style="background:#1a1a2e; border:1px solid #2a2a4a; border-radius:12px;
          padding:2rem; margin-top:2rem; text-align:center; color:#a0a0c0;">
          <div style="font-size:2rem; margin-bottom:1rem;">🕒</div>
          <div style="font-size:1rem; color:#fff; margin-bottom:0.5rem;">
            ${fac ? fac.name : 'This faculty'} has not set office hours yet.
          </div>
          <div>Check back later.</div>
        </div>
      `;
    } else {
      // Group slots by dateStr
      const grouped = {};
      slots.forEach(s => {
        if (!grouped[s.dateStr]) grouped[s.dateStr] = [];
        grouped[s.dateStr].push(s);
      });

      const slotGroupsHTML = Object.keys(grouped).sort().map(dateStr => {
        const daySlotsHTML = grouped[dateStr].map(s => {
          const isSelected = selectedSlot && selectedSlot.datetime === s.datetime;
          if (s.taken) {
            return `<button disabled style="
              padding:0.4rem 0.9rem; background:#2a2a4a; color:#6b7280;
              border:1px solid #3a3a5a; border-radius:6px; cursor:not-allowed;
              font-size:0.8rem;">
              ${new Date(s.datetime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
              <br><span style="font-size:0.7rem;">Taken</span>
            </button>`;
          }
          return `<button class="slot-btn" data-iso="${s.datetime}" data-label="${s.label}" style="
            padding:0.4rem 0.9rem; background:${isSelected ? '#4f46e5' : '#6c63ff'};
            color:#fff; border:${isSelected ? '2px solid #fff' : '1px solid transparent'};
            border-radius:6px; cursor:pointer; font-size:0.8rem; transition:all 0.15s;">
            ${new Date(s.datetime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
          </button>`;
        }).join('');

        return `
          <div style="margin-bottom:1.25rem;">
            <div style="font-size:0.85rem; font-weight:600; color:#a0a0c0;
              margin-bottom:0.6rem; text-transform:uppercase; letter-spacing:0.05em;">
              ${fmtDateHeader(dateStr)}
            </div>
            <div style="display:flex; flex-wrap:wrap; gap:0.5rem;">${daySlotsHTML}</div>
          </div>
        `;
      }).join('');

      const selectedInfo = selectedSlot
        ? `<div style="margin-bottom:1rem; padding:0.75rem 1rem; background:#6c63ff22;
            border:1px solid #6c63ff44; border-radius:8px; color:#a0a0c0; font-size:0.9rem;">
            ✅ Selected: <strong style="color:#fff;">${selectedSlot.label}</strong>
          </div>`
        : '';

      bookingPanelHTML = `
        <div id="booking-panel" style="background:#1a1a2e; border:1px solid #2a2a4a;
          border-radius:12px; padding:1.75rem; margin-top:2rem;">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:1.5rem;">
            <h3 style="margin:0; color:#fff; font-size:1.1rem;">
              Book with ${fac ? fac.name : 'Faculty'}
            </h3>
            <button id="close-panel-btn" style="background:transparent; border:none;
              color:#a0a0c0; cursor:pointer; font-size:1.2rem; padding:0.25rem;">✕</button>
          </div>

          <div style="margin-bottom:1.5rem;">
            <div style="font-size:0.85rem; font-weight:600; color:#a0a0c0;
              margin-bottom:1rem; text-transform:uppercase; letter-spacing:0.05em;">
              Select a Time Slot
            </div>
            ${slotGroupsHTML}
          </div>

          ${selectedInfo}

          <div style="margin-bottom:1rem;">
            <label style="display:block; font-size:0.85rem; color:#a0a0c0;
              margin-bottom:0.5rem; font-weight:500;">
              Reason for Appointment (required)
            </label>
            <textarea id="booking-reason" placeholder="Briefly describe why you need this appointment..."
              rows="3" style="width:100%; padding:0.75rem; background:#0f0f1a;
                border:1px solid #2a2a4a; border-radius:8px; color:#fff;
                font-family:inherit; font-size:0.9rem; resize:vertical; box-sizing:border-box;
                outline:none;"></textarea>
          </div>

          <div id="booking-error" style="display:none; color:#ef4444; background:#ef444415;
            border:1px solid #ef444430; border-radius:6px; padding:0.6rem 0.9rem;
            font-size:0.875rem; margin-bottom:1rem;"></div>

          <div id="booking-success" style="display:none; color:#22c55e; background:#22c55e15;
            border:1px solid #22c55e30; border-radius:6px; padding:0.6rem 0.9rem;
            font-size:0.9rem; margin-bottom:1rem;"></div>

          <button id="submit-booking-btn" style="width:100%; padding:0.75rem; background:#6c63ff;
            color:#fff; border:none; border-radius:8px; cursor:pointer;
            font-weight:600; font-size:0.95rem;">
            Submit Booking Request
          </button>
        </div>
      `;
    }
  }

  // ── Search bar ────────────────────────────────────────────────────────
  const pageContent = `
    <div style="margin-bottom:1.5rem;">
      <input type="text" id="faculty-search"
        placeholder="Search faculty by name or department..."
        style="width:100%; max-width:480px; padding:0.75rem 1rem;
          background:#1a1a2e; border:1px solid #2a2a4a; border-radius:8px;
          color:#fff; font-size:0.9rem; outline:none; box-sizing:border-box;">
    </div>

    <div id="faculty-grid" style="display:grid;
      grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:1.25rem;">
      ${facultyCardsHTML}
    </div>

    ${bookingPanelHTML}
  `;

  // ── Write to DOM ──────────────────────────────────────────────────────
  container.innerHTML = renderPage('Browse Faculty', 'Student / Book Appointment', pageContent);

  // ── Wire: faculty "Book Appointment" buttons ──────────────────────────
  container.querySelectorAll('[data-fid]').forEach(btn => {
    btn.addEventListener('click', () => {
      const fid = btn.getAttribute('data-fid');
      selectedFacultyId = fid;
      selectedSlot = null;
      render(container);
      // Scroll to panel
      setTimeout(() => {
        const panel = document.getElementById('booking-panel');
        if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    });
  });

  // ── Wire: close panel ─────────────────────────────────────────────────
  const closeBtn = container.querySelector('#close-panel-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      selectedFacultyId = null;
      selectedSlot = null;
      render(container);
    });
  }

  // ── Wire: slot buttons ────────────────────────────────────────────────
  container.querySelectorAll('.slot-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedSlot = {
        datetime: btn.getAttribute('data-iso'),
        label   : btn.getAttribute('data-label'),
      };
      render(container);
      // Keep scroll position on panel
      setTimeout(() => {
        const panel = document.getElementById('booking-panel');
        if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    });
  });

  // ── Wire: submit booking ──────────────────────────────────────────────
  const submitBtn = container.querySelector('#submit-booking-btn');
  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      const errorDiv   = container.querySelector('#booking-error');
      const successDiv = container.querySelector('#booking-success');
      const reasonEl   = container.querySelector('#booking-reason');
      const reason     = reasonEl ? reasonEl.value.trim() : '';

      errorDiv.style.display   = 'none';
      successDiv.style.display = 'none';

      if (!selectedSlot) {
        errorDiv.textContent   = 'Please select a time slot first.';
        errorDiv.style.display = 'block';
        return;
      }
      if (reason.length < 10) {
        errorDiv.textContent   = 'Reason must be at least 10 characters.';
        errorDiv.style.display = 'block';
        return;
      }

      // Save appointment
      const store = readStore();
      const newApt = {
        id          : Date.now().toString(),
        studentId   : user.id,
        facultyId   : selectedFacultyId,
        slotDatetime: selectedSlot.datetime,
        duration    : 30,
        reason,
        status      : 'pending',
        createdAt   : new Date().toISOString(),
      };
      store.appointments.push(newApt);

      // Notify faculty
      store.notifications.push({
        id       : (Date.now() + 1).toString(),
        userId   : selectedFacultyId,
        type     : 'booking_request',
        message  : 'New appointment request from ' + user.name + ' on ' + selectedSlot.label + '. Reason: ' + reason,
        read     : false,
        createdAt: new Date().toISOString(),
      });

      writeStore(store);

      // Show success
      successDiv.textContent   = '✅ Booking request submitted! Awaiting faculty approval.';
      successDiv.style.display = 'block';
      submitBtn.disabled       = true;

      // Reset state and navigate after 2 seconds
      selectedSlot      = null;
      selectedFacultyId = null;
      setTimeout(() => { window.location.hash = '#/student/appointments'; }, 2000);
    });
  }

  // ── Wire: search filter ───────────────────────────────────────────────
  const searchInput = container.querySelector('#faculty-search');
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      const term = e.target.value.toLowerCase();
      container.querySelectorAll('.faculty-card').forEach(card => {
        const name = (card.querySelector('[style*="font-weight:600"]') || {}).textContent || '';
        const dept = (card.querySelectorAll('div')[2] || {}).textContent || '';
        card.style.display = (name.toLowerCase().includes(term) || dept.toLowerCase().includes(term))
          ? '' : 'none';
      });
    });
  }
}
