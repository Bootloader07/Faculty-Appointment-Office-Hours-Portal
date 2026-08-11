export function renderNavbar(user) {
  return `
    <nav class="navbar">
      <div class="user-info">
        <span style="font-weight:600; font-size:var(--text-lg)">${user.name}</span>
        <span class="badge badge-confirmed" style="margin-left: 0.5rem; text-transform:capitalize;">${user.role}</span>
      </div>
      <div style="display:flex; gap:1rem; align-items:center;">
        <button class="btn btn-ghost" id="notif-bell" title="Notifications">🔔</button>
        <button
          class="btn btn-outline"
          onclick="localStorage.removeItem('currentUser'); window.location.hash='#/logout';"
          title="Sign out"
        >Logout</button>
      </div>
    </nav>
  `;
}

export function renderSidebar(role, activePage) {
  let links = [];
  if (role === 'student') {
    links = [
      { href: '#/student/dashboard', icon: '🏠', text: 'Dashboard' },
      { href: '#/student/faculty', icon: '👥', text: 'Browse Faculty' },
      { href: '#/student/appointments', icon: '📅', text: 'My Appointments' }
    ];
  } else if (role === 'faculty') {
    links = [
      { href: '#/faculty/dashboard', icon: '🏠', text: 'Dashboard' },
      { href: '#/faculty/office-hours', icon: '🕒', text: 'Office Hours' },
      { href: '#/faculty/blocked-dates', icon: '🚫', text: 'Blocked Dates' },
      { href: '#/faculty/requests', icon: '📋', text: 'Requests' }
    ];
  } else if (role === 'admin') {
    links = [
      { href: '#/admin/dashboard', icon: '📊', text: 'Dashboard' },
      { href: '#/admin/users', icon: '👥', text: 'Users' },
      { href: '#/admin/bookings', icon: '📅', text: 'All Bookings' },
      { href: '#/admin/conflicts', icon: '⚠️', text: 'Conflicts' }
    ];
  }

  const navHtml = links.map(link => `
    <a href="${link.href}" class="nav-link ${activePage === link.href ? 'active' : ''}">
      <span>${link.icon}</span> ${link.text}
    </a>
  `).join('');

  return `
    <aside class="sidebar">
      <div style="font-size: 1.25rem; font-weight: 700; margin-bottom: 2rem; color: var(--primary);">🎓 UniPortal</div>
      <div class="sidebar-nav">
        ${navHtml}
      </div>
    </aside>
  `;
}

export function renderBadge(status) {
  let badgeClass = 'badge-no-show';
  if (status === 'pending') badgeClass = 'badge-pending';
  if (status === 'confirmed') badgeClass = 'badge-confirmed';
  if (status === 'cancelled') badgeClass = 'badge-cancelled';
  if (status === 'rescheduled') badgeClass = 'badge-rescheduled';
  return `<span class="badge ${badgeClass}">${status}</span>`;
}

export function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast`;
  if (type === 'error') toast.style.borderLeftColor = 'var(--status-cancelled)';
  if (type === 'warning') toast.style.borderLeftColor = 'var(--status-pending)';
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

export function showModal(title, message, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <h3>${title}</h3>
      <p>${message}</p>
      <div class="modal-actions">
        <button class="btn btn-ghost" id="modal-cancel">Cancel</button>
        <button class="btn btn-primary" id="modal-confirm">Confirm</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  
  // trigger animation
  requestAnimationFrame(() => overlay.classList.add('show'));

  const close = () => {
    overlay.classList.remove('show');
    setTimeout(() => overlay.remove(), 200);
  };

  overlay.querySelector('#modal-cancel').onclick = close;
  overlay.querySelector('#modal-confirm').onclick = () => {
    onConfirm();
    close();
  };
}

export function renderEmpty(icon, title, subtitle) {
  return `
    <div class="empty-state">
      <div class="icon">${icon}</div>
      <h3 style="margin-bottom:0.5rem; color:var(--text-1)">${title}</h3>
      <p>${subtitle}</p>
    </div>
  `;
}

export function renderSpinner() {
  return `<div class="spinner"></div>`;
}

export function renderPage(title, breadcrumb, content) {
  return `
    <div class="page-header">
      <div style="color:var(--text-2); font-size:var(--text-sm); margin-bottom:0.5rem;">${breadcrumb}</div>
      <h1>${title}</h1>
    </div>
    ${content}
  `;
}
