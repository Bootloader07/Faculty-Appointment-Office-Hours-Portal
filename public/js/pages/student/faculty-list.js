import { api } from '../../api.js';
import { renderSpinner, renderPage, renderEmpty } from '../../components/shared.js';

export async function render(container) {
  container.innerHTML = renderSpinner();

  const res = await api.get('/faculty');
  if (!res.success) {
    container.innerHTML = renderPage('Browse Faculty', 'Student', `<div class="card"><p>Error loading faculty list.</p></div>`);
    return;
  }

  let faculty = res.data || [];
  
  const renderFaculty = (list) => {
    if (!list.length) return renderEmpty('🔍', 'No faculty found', 'Try adjusting your search criteria.');
    return `
      <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap:1.5rem;">
        ${list.map(f => {
          const initials = f.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
          return `
            <div class="card" style="display:flex; flex-direction:column; gap:1rem;">
              <div style="display:flex; align-items:center; gap:1rem;">
                <div style="width:48px; height:48px; border-radius:50%; background:var(--primary-glow); border:1px solid var(--primary); display:flex; align-items:center; justify-content:center; font-weight:bold; color:var(--primary);">
                  ${initials}
                </div>
                <div>
                  <div style="font-weight:600; font-size:var(--text-lg)">${f.name}</div>
                  <div style="color:var(--text-2); font-size:var(--text-sm)">${f.department}</div>
                </div>
              </div>
              <button class="btn btn-outline" style="width:100%" onclick="window.location.hash='#/student/faculty/${f.id}'">View Available Slots</button>
            </div>
          `;
        }).join('')}
      </div>
    `;
  };

  const content = `
    <div style="margin-bottom:2rem;">
      <input type="text" id="faculty-search" class="input-search" placeholder="Search by name or department...">
    </div>
    <div id="faculty-grid">
      ${renderFaculty(faculty)}
    </div>
  `;

  container.innerHTML = renderPage('Browse Faculty', 'Student / Faculty', content);

  document.getElementById('faculty-search').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = faculty.filter(f => f.name.toLowerCase().includes(q) || f.department.toLowerCase().includes(q));
    document.getElementById('faculty-grid').innerHTML = renderFaculty(filtered);
  });
}
