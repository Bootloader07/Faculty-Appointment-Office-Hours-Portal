import { getAppointments, getUserById, updateAppointmentStatus, fmtDateTime } from '../../data/store.js';
import { renderPage, showToast } from '../../components/shared.js';

function getUser(role) {
  try {
    const u = JSON.parse(localStorage.getItem('currentUser'));
    if (!u || u.role !== role) { window.location.hash = '#/login'; return null; }
    return u;
  } catch { window.location.hash = '#/login'; return null; }
}

export function render(container) {
  if (!getUser('admin')) return;

  const appointments = getAppointments();
  const activeAppts = appointments.filter(a => a.status === 'pending' || a.status === 'confirmed');
  
  const grouped = activeAppts.reduce((acc, a) => {
    const key = `${a.facultyId}_${a.slotDatetime}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(a);
    return acc;
  }, {});

  const conflicts = Object.values(grouped).filter(group => group.length > 1);

  const content = `
    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem;">
      <h2 style="margin: 0;">Conflict Detection</h2>
      <span class="badge ${conflicts.length > 0 ? 'badge-cancelled' : 'badge-confirmed'}">
        ${conflicts.length} Conflicts
      </span>
    </div>

    <div class="card" style="margin-bottom: 2rem;">
      <p style="margin: 0; color: var(--text-2);">
        Conflicts occur when a faculty member has two or more pending or confirmed appointments at the exact same time.
      </p>
    </div>

    <div style="display: flex; flex-direction: column; gap: 1rem;">
      ${conflicts.length > 0 ? conflicts.map((group, index) => {
        const faculty = getUserById(group[0].facultyId);
        return `
          <div class="card" style="border-left: 4px solid var(--status-cancelled);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <h3 style="margin-top: 0; margin-bottom: 0.5rem;">${faculty ? faculty.name : 'Unknown Faculty'}</h3>
                <div style="color: var(--text-2); margin-bottom: 1rem;">${fmtDateTime(group[0].slotDatetime)}</div>
                
                <h4 style="margin: 0 0 0.5rem 0; font-size: var(--text-sm);">Involved Students:</h4>
                <ul style="margin: 0; padding-left: 1.5rem; color: var(--text-2);">
                  ${group.map(a => {
                    const student = getUserById(a.studentId);
                    return `<li>${student ? student.name : 'Unknown'}</li>`;
                  }).join('')}
                </ul>
              </div>
              
              <button class="btn btn-danger btn-resolve" data-index="${index}">Resolve: Cancel All</button>
            </div>
          </div>
        `;
      }).join('') : `
        <div class="card" style="text-align: center; padding: 4rem 2rem;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">✅</div>
          <h3 style="color: var(--status-confirmed); margin: 0;">No scheduling conflicts detected. All schedules are clean.</h3>
        </div>
      `}
    </div>
  `;

  container.innerHTML = renderPage('Conflict Detection ⚠️', 'Admin / Conflicts', content);

  const resolveBtns = container.querySelectorAll('.btn-resolve');
  resolveBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = e.target.getAttribute('data-index');
      const conflictGroup = conflicts[idx];
      
      conflictGroup.forEach(a => {
        updateAppointmentStatus(a.id, 'cancelled');
      });
      
      showToast('All conflicting appointments have been cancelled', 'success');
      render(container);
    });
  });
}
