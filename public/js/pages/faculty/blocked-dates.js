import {
  getBlockedDates,
  saveBlockedDate,
  deleteBlockedDate
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

export function render(container) {
  const user = getUser();
  if (!user) return;

  const bDates = getBlockedDates(user.id);
  bDates.sort((a, b) => new Date(a.date) - new Date(b.date));

  let datesHTML = '';
  if (bDates.length === 0) {
    datesHTML = renderEmpty('Calendar', 'No blocked dates', 'You have not blocked any dates.');
  } else {
    datesHTML = bDates.map(bd => {
      const fmtDate = new Date(bd.date + 'T00:00:00').toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      return `
        <div class="card" style="margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong>${fmtDate}</strong> — ${bd.reason || 'No reason provided'}
          </div>
          <button class="btn btn-danger btn-delete" data-id="${bd.id}">❌ Remove</button>
        </div>
      `;
    }).join('');
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  const content = `
    <div class="card" style="margin-bottom: 2rem;">
      <h3>Block a Date</h3>
      <div id="bd-error" style="color: #ef4444; margin-bottom: 1rem; display: none;"></div>
      <div style="display: flex; gap: 1rem; align-items: end;">
        <div class="form-group" style="margin-bottom: 0; flex: 1;">
          <label class="form-label">Date</label>
          <input type="date" id="bd-date" class="form-control" min="${todayStr}">
        </div>
        <div class="form-group" style="margin-bottom: 0; flex: 2;">
          <label class="form-label">Reason</label>
          <input type="text" id="bd-reason" class="form-control" placeholder="e.g. Faculty Development Workshop">
        </div>
        <button id="btn-block-date" class="btn btn-primary">Block Date</button>
      </div>
    </div>

    <div>
      <h3>Blocked Dates</h3>
      ${datesHTML}
    </div>
  `;

  container.innerHTML = renderPage('Blocked Dates', 'Faculty / Blocked Dates', content);

  container.querySelector('#btn-block-date').addEventListener('click', () => {
    const date = container.querySelector('#bd-date').value;
    const reason = container.querySelector('#bd-reason').value;
    const errDiv = container.querySelector('#bd-error');

    errDiv.style.display = 'none';

    if (!date) {
      errDiv.textContent = 'Date is required.';
      errDiv.style.display = 'block';
      return;
    }

    if (date < todayStr) {
      errDiv.textContent = 'Date must be today or in the future.';
      errDiv.style.display = 'block';
      return;
    }

    saveBlockedDate({
      facultyId: user.id,
      date,
      reason
    });

    showToast('Date blocked!', 'success');
    render(container);
  });

  container.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.getAttribute('data-id');
      deleteBlockedDate(id);
      showToast('Removed', 'success');
      render(container);
    });
  });
}
