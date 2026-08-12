/**
 * app.js — Hash-based SPA router
 * Reads currentUser synchronously from localStorage (via state.js).
 * Never awaits a network call before deciding where to route.
 */
import { currentUser, setCurrentUser, clearCurrentUser } from './state.js';
import { hydrateVisualComponents } from './components/ui.js';

// ── Page modules ──────────────────────────────────────────────────────────
import * as loginPage           from './pages/auth/login.js';
import * as registerPage        from './pages/auth/register.js';

import * as adminDashboard      from './pages/admin/dashboard.js';
import * as adminUsers          from './pages/admin/users.js';
import * as adminBookings       from './pages/admin/bookings.js';
import * as adminConflicts      from './pages/admin/conflicts.js';

import * as facultyDashboard    from './pages/faculty/dashboard.js';
import * as facultyOfficeHours  from './pages/faculty/office-hours.js';
import * as facultyBlockedDates from './pages/faculty/blocked-dates.js';
import * as facultyAppointments from './pages/faculty/appointments.js';

import * as studentDashboard    from './pages/student/dashboard.js';
import * as studentFacultyList  from './pages/student/faculty-list.js';
import * as studentBook         from './pages/student/book.js';
import * as studentAppointments from './pages/student/appointments.js';

// ── Route table ───────────────────────────────────────────────────────────
const ROUTES = {
  '#/login'                : { module: loginPage,           auth: false },
  '#/register'             : { module: registerPage,        auth: false },

  '#/admin/dashboard'      : { module: adminDashboard,      role: 'admin'    },
  '#/admin/users'          : { module: adminUsers,           role: 'admin'    },
  '#/admin/bookings'       : { module: adminBookings,        role: 'admin'    },
  '#/admin/conflicts'      : { module: adminConflicts,       role: 'admin'    },

  '#/faculty/dashboard'    : { module: facultyDashboard,    role: 'faculty'  },
  '#/faculty/office-hours' : { module: facultyOfficeHours,  role: 'faculty'  },
  '#/faculty/blocked-dates': { module: facultyBlockedDates, role: 'faculty'  },
  '#/faculty/appointments' : { module: facultyAppointments, role: 'faculty'  },
  '#/faculty/requests'     : { module: facultyAppointments, role: 'faculty'  }, // alias

  '#/student/dashboard'    : { module: studentDashboard,    role: 'student'  },
  '#/student/faculty'      : { module: studentFacultyList,  role: 'student'  },
  '#/student/appointments' : { module: studentAppointments, role: 'student'  },
};

// ── Sidebar nav definitions ───────────────────────────────────────────────
const NAV = {
  admin: [
    { href: '#/admin/dashboard', icon: '📊', text: 'Dashboard'    },
    { href: '#/admin/users',     icon: '👥', text: 'Users'        },
    { href: '#/admin/bookings',  icon: '📅', text: 'All Bookings' },
    { href: '#/admin/conflicts', icon: '⚠️', text: 'Conflicts'    },
  ],
  faculty: [
    { href: '#/faculty/dashboard',    icon: '🏠', text: 'Dashboard'    },
    { href: '#/faculty/office-hours', icon: '🕒', text: 'Office Hours' },
    { href: '#/faculty/appointments', icon: '📋', text: 'Appointments' },
    { href: '#/faculty/blocked-dates',icon: '🚫', text: 'Blocked Dates'},
  ],
  student: [
    { href: '#/student/dashboard',    icon: '🏠', text: 'Dashboard'        },
    { href: '#/student/faculty',      icon: '👥', text: 'Book Appointment'  },
    { href: '#/student/appointments', icon: '📅', text: 'My Appointments'  },
  ],
};

// ── Layout renderer ───────────────────────────────────────────────────────
function renderLayout(user, contentModule, param) {
  const app  = document.getElementById('app');
  const hash = window.location.hash;
  const nav  = NAV[user.role] || [];

  const sidebarLinks = nav.map(link => `
    <a href="${link.href}" class="nav-link ${hash === link.href ? 'active' : ''}">
      <span>${link.icon}</span> ${link.text}
    </a>
  `).join('');

  app.innerHTML = `
    <div class="app-layout">
      <aside class="sidebar" aria-label="Primary navigation">
        <div class="sidebar__top">
          <div class="sidebar-brand-row">
            <a class="sidebar-brand" href="#/${user.role}/dashboard" aria-label="UniPortal dashboard">
              <span class="sidebar-brand__mark" aria-hidden="true">U</span>
              <span class="sidebar-brand__copy"><strong>UniPortal</strong><small>Academic workspace</small></span>
            </a>
            <button class="sidebar-toggle" type="button" data-sidebar-toggle aria-label="Collapse sidebar" aria-expanded="true"><span aria-hidden="true">‹</span></button>
          </div>
          <p class="sidebar-section-label">Workspace</p>
          <nav class="sidebar-nav" aria-label="Role navigation">${sidebarLinks}</nav>
        </div>

        <div class="sidebar__footer">
          <div class="sidebar-user">
            <span class="avatar-initials sidebar-user__avatar" style="--avatar-hue:250" aria-hidden="true">${user.name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase()}</span>
            <span class="sidebar-user__details"><strong>${user.name}</strong><span class="sidebar-user__role">${user.role}</span></span>
          </div>
          <button class="btn btn-ghost sidebar-logout" type="button" onclick="window.location.hash='#/logout';"><span aria-hidden="true">↙</span><span>Logout</span></button>
        </div>
      </aside>

      <main class="main-content">
        <header class="navbar">
          <div class="navbar__context">
            <span class="navbar__eyebrow">${user.role} workspace</span>
            <strong>Welcome back, ${user.name}</strong>
          </div>
          <div class="navbar__actions">
            <div id="notif-btn" class="notification-menu">
              <button class="notification-trigger" type="button" id="notif-bell-btn" aria-label="Notifications" aria-expanded="false"><span aria-hidden="true">♢</span></button>
              <span id="notif-badge" class="notification-count" style="display:none;"></span>
              <div id="notif-dropdown" class="notification-panel" style="display:none;"></div>
            </div>
          </div>
        </header>
        <div id="page-content" class="page-content page-transition"></div>
      </main>
    </div>
  
`;

  // Wire up notification bell
  setupNotifications(user);

  const container = document.getElementById('page-content');
  contentModule.render(container, param);

  // Presentation-only sidebar preference; it does not change routes or data.
  const sidebar = app.querySelector('.sidebar');
  const sidebarToggle = app.querySelector('[data-sidebar-toggle]');
  if (sidebar && sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      const collapsed = sidebar.classList.toggle('is-collapsed');
      sidebarToggle.setAttribute('aria-expanded', String(!collapsed));
    });
  }
}

function setupNotifications(user) {
  // Lazy-load store to avoid circular import at module evaluation time
  import('./data/store.js').then(({ getNotifications, markAllNotificationsRead, getUnreadCount }) => {
    const badge    = document.getElementById('notif-badge');
    const dropdown = document.getElementById('notif-dropdown');
    const bell     = document.getElementById('notif-bell-btn');
    if (!badge || !dropdown || !bell) return;

    function refreshBell() {
      const count = getUnreadCount(user.id);
      badge.textContent    = count;
      badge.style.display  = count > 0 ? 'block' : 'none';
    }
    refreshBell();

    bell.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdown.style.display === 'block';
      if (isOpen) {
        dropdown.style.display = 'none';
        return;
      }
      // Mark all read
      markAllNotificationsRead(user.id);
      badge.style.display = 'none';

      const notifs = getNotifications(user.id);
      dropdown.innerHTML = notifs.length
        ? notifs.map(n => `
            <div style="padding:0.75rem; border-bottom:1px solid var(--glass-border); font-size:var(--text-sm);">
              <div style="color:var(--text-1); margin-bottom:0.25rem;">${n.message}</div>
              <div style="color:var(--text-3); font-size:var(--text-xs);">${new Date(n.createdAt).toLocaleString('en-IN', {dateStyle:'short', timeStyle:'short'})}</div>
            </div>`).join('')
        : '<div style="padding:1rem; text-align:center; color:var(--text-2); font-size:var(--text-sm);">No notifications</div>';

      dropdown.style.display = 'block';
    });

    document.addEventListener('click', () => { dropdown.style.display = 'none'; });
  });
}

// ── Main router ───────────────────────────────────────────────────────────
function router() {
  let hash = window.location.hash || '';

  // Empty hash → redirect to login or dashboard
  if (hash === '' || hash === '#' || hash === '#/') {
    const user = currentUser;
    window.location.hash = user ? `#/${user.role}/dashboard` : '#/login';
    return;
  }

  // Logout
  if (hash === '#/logout') {
    clearCurrentUser();
    window.location.hash = '#/login';
    return;
  }

  const user = currentUser; // synchronous — always populated from localStorage

  // ── Auth gate ─────────────────────────────────────────────
  const isPublic = hash === '#/login' || hash === '#/register';

  if (!user && !isPublic) {
    window.location.hash = '#/login';
    return;
  }
  if (user && isPublic) {
    window.location.hash = `#/${user.role}/dashboard`;
    return;
  }

  // ── Role gate ─────────────────────────────────────────────
  if (user) {
    if (hash.startsWith('#/admin')   && user.role !== 'admin') {
      window.location.hash = `#/${user.role}/dashboard`; return;
    }
    if (hash.startsWith('#/faculty') && user.role !== 'faculty' && user.role !== 'admin') {
      window.location.hash = `#/${user.role}/dashboard`; return;
    }
    if (hash.startsWith('#/student') && user.role !== 'student' && user.role !== 'admin') {
      window.location.hash = `#/${user.role}/dashboard`; return;
    }
  }

  // ── Parameterised routes ──────────────────────────────────
  let route = ROUTES[hash];
  let param = null;

  if (!route) {
    // #/student/book/:facultyId  or  #/student/faculty/:facultyId
    if (hash.startsWith('#/student/book/') || hash.startsWith('#/student/faculty/')) {
      route = { module: studentBook, role: 'student' };
      param = hash.split('/').pop();
    }
  }

  if (!route) {
    console.warn('Unknown route:', hash);
    window.location.hash = user ? `#/${user.role}/dashboard` : '#/login';
    return;
  }

  // ── Render ────────────────────────────────────────────────
  const app = document.getElementById('app');
  if (isPublic) {
    app.innerHTML = '';
    route.module.render(app);
  } else {
    renderLayout(user, route.module, param);
  }
  // Presentation-only hydration: adds optional visual effects after existing markup renders.
  hydrateVisualComponents(app);
}

window.addEventListener('hashchange', router);
document.addEventListener('DOMContentLoaded', router);
