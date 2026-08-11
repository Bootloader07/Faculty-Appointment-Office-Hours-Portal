/**
 * app.js — Hash-based SPA router
 * Reads currentUser synchronously from localStorage (via state.js).
 * Never awaits a network call before deciding where to route.
 */
import { currentUser, setCurrentUser, clearCurrentUser } from './state.js';

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
      <aside class="sidebar">
        <div style="font-size:1.25rem; font-weight:700; margin-bottom:2rem; color:var(--primary);">🎓 UniPortal</div>
        <div class="sidebar-nav">${sidebarLinks}</div>
        <div style="margin-top:auto; padding-top:2rem;">
          <button class="btn btn-outline" style="width:100%;"
            onclick="window.location.hash='#/logout';">
            ⬅ Logout
          </button>
        </div>
      </aside>
      <main class="main-content">
        <nav class="navbar">
          <div style="display:flex; align-items:center; gap:0.75rem;">
            <span style="font-weight:600; font-size:var(--text-lg);">${user.name}</span>
            <span class="badge badge-confirmed" style="text-transform:capitalize;">${user.role}</span>
          </div>
          <div id="notif-btn" style="position:relative; cursor:pointer;">
            <button class="btn btn-ghost" style="font-size:1.2rem;" id="notif-bell-btn">🔔</button>
            <span id="notif-badge" style="
              display:none;
              position:absolute; top:0; right:0;
              background:var(--status-cancelled); color:#fff;
              border-radius:9999px; font-size:0.6rem; font-weight:700;
              min-width:16px; height:16px; line-height:16px; text-align:center;
              padding:0 4px;
            "></span>
            <div id="notif-dropdown" style="
              display:none; position:absolute; right:0; top:calc(100% + 8px);
              background:var(--bg-surface); border:1px solid var(--glass-border);
              border-radius:12px; min-width:280px; max-height:360px;
              overflow-y:auto; z-index:100; padding:0.5rem;
              box-shadow: 0 8px 24px rgba(0,0,0,0.4);
            " id="notif-list"></div>
          </div>
        </nav>
        <div id="page-content"></div>
      </main>
    </div>
  `;

  // Wire up notification bell
  setupNotifications(user);

  const container = document.getElementById('page-content');
  contentModule.render(container, param);
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
}

window.addEventListener('hashchange', router);
document.addEventListener('DOMContentLoaded', router);
