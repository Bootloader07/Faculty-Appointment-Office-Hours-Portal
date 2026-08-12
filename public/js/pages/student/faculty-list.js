import {
  getUsers,
  getUserById,
  getAvailableSlots,
  fmtDateTime
} from '../../data/store.js';
import { renderEmpty, renderPage, showToast } from '../../components/shared.js';

// ── Auth guard ────────────────────────────────────────────────────────────
function getUser() {
  try {
    const u = JSON.parse(localStorage.getItem('currentUser'));
    if (!u || u.role !== 'student') { window.location.hash = '#/login'; return null; }
    return u;
  } catch { window.location.hash = '#/login'; return null; }
}

// ── Page-level state ──────────────────────────────────────────────────────
let selectedFacultyId = null;

// ══════════════════════════════════════════════════════════════════════════
// MAIN RENDER
// ══════════════════════════════════════════════════════════════════════════
export function render(container) {
  const user = getUser();
  if (!user) return;

  const allFaculty = getUsers().filter(u => u.role === 'faculty');

  // Build faculty cards with available slot counts
  const facultyCardsHTML = allFaculty.length === 0
    ? renderEmpty('👥', 'No faculty available', 'Check back later.')
    : allFaculty.map(f => {
        const slots     = getAvailableSlots(f.id, 14);
        const slotCount = slots.length;
        const initial   = (f.name || '?').charAt(0).toUpperCase();
        const isSelected = selectedFacultyId === f.id;

        return `
          <div class="card faculty-card" data-fid="${f.id}" style="
            padding:1.5rem; display:flex; flex-direction:column;
            align-items:center; text-align:center; gap:1rem;
            border:1px solid ${isSelected ? 'var(--primary)' : 'var(--glass-border)'};
            cursor:default; transition:border-color 0.2s;">
            <div style="width:56px;height:56px;border-radius:50%;
              background:var(--primary);color:white;font-size:1.4rem;
              font-weight:700;display:flex;align-items:center;justify-content:center;">
              ${initial}
            </div>
            <div>
              <div style="font-weight:600;font-size:1rem;margin-bottom:0.25rem;">${f.name}</div>
              <div style="font-size:0.875rem;color:var(--text-2);">${f.department || 'Department'}</div>
            </div>
            <div style="font-size:0.8rem;color:${slotCount > 0 ? 'var(--status-confirmed)' : 'var(--text-3)'};">
              ${slotCount} slot${slotCount !== 1 ? 's' : ''} available
            </div>
            <button class="btn ${slotCount > 0 ? 'btn-primary' : 'btn-outline'} book-btn"
              data-fid="${f.id}" ${slotCount === 0 ? 'disabled' : ''}
              style="width:100%;margin-top:auto;">
              ${slotCount > 0 ? 'Book Appointment' : 'No Slots Available'}
            </button>
          </div>
        `;
      }).join('');

  const pageContent = `
    <div style="margin-bottom:1.5rem;">
      <input type="text" id="faculty-search"
        placeholder="Search faculty by name or department..."
        style="width:100%;max-width:480px;padding:0.75rem 1rem;
          background:var(--bg-surface);border:1px solid var(--glass-border);
          border-radius:8px;color:var(--text-1);font-size:0.9rem;outline:none;
          box-sizing:border-box;">
    </div>
    <div id="faculty-grid" style="display:grid;
      grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1.25rem;
      margin-bottom:2rem;">
      ${facultyCardsHTML}
    </div>
  `;

  container.innerHTML = renderPage('Browse Faculty', 'Student / Book Appointment', pageContent);

  // ── Wire: "Book Appointment" buttons → navigate to book/:facultyId ───
  container.querySelectorAll('.book-btn:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => {
      const fid = btn.getAttribute('data-fid');
      window.location.hash = '#/student/book/' + fid;
    });
  });

  // ── Wire: search filter ───────────────────────────────────────────────
  const searchInput = container.querySelector('#faculty-search');
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      const term = e.target.value.toLowerCase();
      container.querySelectorAll('.faculty-card').forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(term) ? '' : 'none';
      });
    });
  }
}
