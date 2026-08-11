import { currentUser, setCurrentUser, clearCurrentUser } from './state.js';
import { api } from './api.js';
import { renderSidebar, renderNavbar, showToast } from './components/shared.js';

// ─── Page imports ──────────────────────────────────────────────
import * as loginPage         from './pages/auth/login.js';
import * as registerPage      from './pages/auth/register.js';
import * as studentDashboard  from './pages/student/dashboard.js';
import * as studentFacultyList from './pages/student/faculty-list.js';
import * as studentBook       from './pages/student/book.js';
import * as studentAppointments from './pages/student/appointments.js';
import * as facultyDashboard  from './pages/faculty/dashboard.js';
import * as facultyOfficeHours from './pages/faculty/office-hours.js';
import * as facultyBlockedDates from './pages/faculty/blocked-dates.js';
import * as facultyRequests   from './pages/faculty/requests.js';
import * as adminDashboard    from './pages/admin/dashboard.js';
import * as adminUsers        from './pages/admin/users.js';
import * as adminBookings     from './pages/admin/bookings.js';
import * as adminConflicts    from './pages/admin/conflicts.js';

// ─── Route table ───────────────────────────────────────────────
const routes = {
  '#/login':               loginPage,
  '#/register':            registerPage,
  '#/student/dashboard':   studentDashboard,
  '#/student/faculty':     studentFacultyList,
  '#/student/appointments': studentAppointments,
  '#/faculty/dashboard':   facultyDashboard,
  '#/faculty/office-hours': facultyOfficeHours,
  '#/faculty/blocked-dates': facultyBlockedDates,
  '#/faculty/requests':    facultyRequests,
  '#/admin/dashboard':     adminDashboard,
  '#/admin/users':         adminUsers,
  '#/admin/bookings':      adminBookings,
  '#/admin/conflicts':     adminConflicts,
};

// ─── Silently sync session with server in the background ───────
// This does NOT block routing — we read from localStorage first.
async function syncAuthWithServer() {
  const res = await api.get('/auth/me');
  if (res.success && res.data) {
    setCurrentUser(res.data);
  } else {
    // Server session expired — clear local state too
    clearCurrentUser();
  }
}

// ─── Layout renderer ───────────────────────────────────────────
function renderLayout(user, contentModule, param) {
  const app = document.getElementById('app');
  const hash = window.location.hash;

  app.innerHTML = `
    <div class="app-layout">
      ${renderSidebar(user.role, hash)}
      <main class="main-content">
        ${renderNavbar(user)}
        <div id="page-content"></div>
      </main>
    </div>
  `;

  const container = document.getElementById('page-content');
  contentModule.render(container, param);
}

// ─── Main router ───────────────────────────────────────────────
async function router() {
  let hash = window.location.hash || '';

  // ── Logout ─────────────────────────────────────────────────
  if (hash === '#/logout') {
    api.post('/auth/logout').catch(() => {}); // best-effort server logout
    clearCurrentUser();
    window.location.hash = '#/login';
    return;
  }

  // ── Read user synchronously from localStorage (via state.js) ─
  // This is set immediately by setCurrentUser() after login,
  // so it's always populated on the very next hash-change.
  // We also kick off a background server sync, but don't await it here.
  const user = currentUser; // synchronous read from module-level variable

  // Kick off background sync (do NOT await — avoids the race condition)
  syncAuthWithServer().catch(() => {});

  const isAuthRoute = (hash === '#/login' || hash === '#/register' || hash === '');

  // ── Unauthenticated → force login ───────────────────────────
  if (!user && !isAuthRoute) {
    window.location.hash = '#/login';
    return;
  }

  // ── Already authenticated → redirect away from login screen ─
  if (user && isAuthRoute) {
    window.location.hash = `#/${user.role}/dashboard`;
    return;
  }

  // ── Role guards ─────────────────────────────────────────────
  if (user) {
    if (hash.startsWith('#/student') && user.role !== 'student' && user.role !== 'admin') {
      window.location.hash = `#/${user.role}/dashboard`;
      return;
    }
    if (hash.startsWith('#/faculty') && user.role !== 'faculty' && user.role !== 'admin') {
      window.location.hash = `#/${user.role}/dashboard`;
      return;
    }
    if (hash.startsWith('#/admin') && user.role !== 'admin') {
      window.location.hash = `#/${user.role}/dashboard`;
      return;
    }
  }

  // ── Match route ─────────────────────────────────────────────
  let routeModule = routes[hash];
  let param = null;

  if (!routeModule) {
    // Parameterised: #/student/faculty/:id
    if (hash.startsWith('#/student/faculty/')) {
      routeModule = studentBook;
      param = hash.split('/').pop();
    }
  }

  if (!routeModule) {
    console.warn('Route not found:', hash);
    window.location.hash = user ? `#/${user.role}/dashboard` : '#/login';
    return;
  }

  // ── Render ──────────────────────────────────────────────────
  const app = document.getElementById('app');

  if (hash === '#/login' || hash === '#/register') {
    // Auth pages: full-screen, no sidebar/navbar
    app.innerHTML = '';
    routeModule.render(app);
  } else {
    renderLayout(user, routeModule, param);
  }
}

window.addEventListener('hashchange', router);
document.addEventListener('DOMContentLoaded', router);
