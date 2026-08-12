/**
 * public/js/data/store.js
 * ─────────────────────────────────────────────────────────────────────────
 * Single-source-of-truth data layer backed by localStorage.
 * All pages import from here — ZERO network calls needed.
 */

const STORE_KEY = 'uniportal_v2';

// ── Seed data ─────────────────────────────────────────────────────────────
const INITIAL_DATA = {
  users: [
    { id: 'u1', name: 'Admin',      email: 'admin@uni.edu',     password: 'Admin@123',   role: 'admin',   department: 'Administration' },
    { id: 'u2', name: 'Dr. Sharma', email: 'dr.sharma@uni.edu', password: 'Faculty@123', role: 'faculty', department: 'Computer Science' },
    { id: 'u3', name: 'Dr. Mehta',  email: 'dr.mehta@uni.edu',  password: 'Faculty@123', role: 'faculty', department: 'Mathematics' },
    { id: 'u4', name: 'Alice',      email: 'alice@uni.edu',     password: 'Student@123', role: 'student', department: 'Computer Science' },
    { id: 'u5', name: 'Bob',        email: 'bob@uni.edu',       password: 'Student@123', role: 'student', department: 'Mathematics' },
  ],
  officeHours: [
    // Seed office hours for Dr. Sharma — Mon/Wed/Fri 10:00–12:00
    { id: 'oh1', facultyId: 'u2', dayOfWeek: 'Mon', startTime: '10:00', endTime: '12:00', slotDuration: 30, isRecurring: true },
    { id: 'oh2', facultyId: 'u2', dayOfWeek: 'Wed', startTime: '10:00', endTime: '12:00', slotDuration: 30, isRecurring: true },
    { id: 'oh3', facultyId: 'u2', dayOfWeek: 'Fri', startTime: '10:00', endTime: '12:00', slotDuration: 30, isRecurring: true },
    // Dr. Mehta — Tue/Thu 14:00–16:00
    { id: 'oh4', facultyId: 'u3', dayOfWeek: 'Tue', startTime: '14:00', endTime: '16:00', slotDuration: 30, isRecurring: true },
    { id: 'oh5', facultyId: 'u3', dayOfWeek: 'Thu', startTime: '14:00', endTime: '16:00', slotDuration: 30, isRecurring: true },
  ],
  blockedDates: [],
  appointments: [],
  notifications: [],
  pendingUsers: [],
};

// ── Internal read/write ───────────────────────────────────────────────────
function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) {
      const fresh = JSON.parse(JSON.stringify(INITIAL_DATA));
      localStorage.setItem(STORE_KEY, JSON.stringify(fresh));
      return fresh;
    }
    const parsed = JSON.parse(raw);
    // Safety: migrate stores that pre-date pendingUsers
    if (!parsed.pendingUsers) parsed.pendingUsers = [];
    return parsed;
  } catch {
    return JSON.parse(JSON.stringify(INITIAL_DATA));
  }
}

function save(data) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Store save failed:', e);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ══════════════════════════════════════════════════════════════════════════
// USERS
// ══════════════════════════════════════════════════════════════════════════

export function getUsers() {
  return load().users;
}

export function getUserById(id) {
  return load().users.find(u => u.id === id) || null;
}

export function getUserByEmail(email) {
  const e = (email || '').toLowerCase().trim();
  return load().users.find(u => u.email.toLowerCase() === e) || null;
}

export function addUser(userObj) {
  const data = load();
  const newUser = { id: genId(), ...userObj };
  data.users.push(newUser);
  save(data);
  return newUser;
}

export function removeUser(id) {
  const data = load();
  data.users = data.users.filter(u => u.id !== id);
  save(data);
}

// ══════════════════════════════════════════════════════════════════════════
// PENDING REGISTRATIONS
// ══════════════════════════════════════════════════════════════════════════

export function getPendingUsers() {
  return load().pendingUsers || [];
}

export function submitRegistrationRequest(userData) {
  const data = load();

  // Email already in active users?
  if (data.users.some(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
    return { success: false, error: 'This email is already registered. Please sign in.' };
  }

  // Email already pending?
  if ((data.pendingUsers || []).some(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
    return { success: false, error: 'A registration request for this email is already pending admin approval.' };
  }

  if (!data.pendingUsers) data.pendingUsers = [];

  const pendingUser = {
    id          : 'pending_' + Date.now(),
    name        : userData.name,
    email       : userData.email,
    password    : userData.password,
    role        : userData.role,
    department  : userData.department,
    requestedAt : new Date().toISOString(),
    status      : 'pending',
  };
  data.pendingUsers.push(pendingUser);

  // Notify admin (id 'u1')
  if (!data.notifications) data.notifications = [];
  data.notifications.push({
    id        : 'notif' + Date.now(),
    userId    : 'u1',
    type      : 'registration_request',
    message   : '🆕 New registration request from ' + userData.name +
                ' (' + userData.role + ' — ' + userData.department + '). Email: ' + userData.email,
    read      : false,
    createdAt : new Date().toISOString(),
  });

  save(data);
  return { success: true };
}

export function approveRegistration(pendingId) {
  const data = load();
  if (!data.pendingUsers) data.pendingUsers = [];

  const pending = data.pendingUsers.find(u => u.id === pendingId);
  if (!pending) return { success: false, error: 'Request not found.' };

  const newUser = {
    id         : 'u' + Date.now(),
    name       : pending.name,
    email      : pending.email,
    password   : pending.password,
    role       : pending.role,
    department : pending.department,
    createdAt  : new Date().toISOString(),
  };
  data.users.push(newUser);
  data.pendingUsers = data.pendingUsers.filter(u => u.id !== pendingId);
  save(data);
  return { success: true, user: newUser };
}

export function rejectRegistration(pendingId) {
  const data = load();
  if (!data.pendingUsers) data.pendingUsers = [];

  const pending = data.pendingUsers.find(u => u.id === pendingId);
  if (!pending) return { success: false, error: 'Request not found.' };

  data.pendingUsers = data.pendingUsers.filter(u => u.id !== pendingId);
  save(data);
  return { success: true };
}

// ══════════════════════════════════════════════════════════════════════════
// OFFICE HOURS
// ══════════════════════════════════════════════════════════════════════════

export function getOfficeHours() {
  return load().officeHours;
}

export function getOfficeHoursByFaculty(facultyId) {
  return load().officeHours.filter(oh => oh.facultyId === facultyId);
}

export function saveOfficeHours(hoursObj) {
  const data = load();
  const full = { id: genId(), ...hoursObj };
  const idx = data.officeHours.findIndex(oh => oh.id === full.id);
  if (idx >= 0) {
    data.officeHours[idx] = full;
  } else {
    data.officeHours.push(full);
  }
  save(data);
  return full;
}

export function deleteOfficeHours(id) {
  const data = load();
  data.officeHours = data.officeHours.filter(oh => oh.id !== id);
  save(data);
}

// ══════════════════════════════════════════════════════════════════════════
// BLOCKED DATES
// ══════════════════════════════════════════════════════════════════════════

export function getBlockedDates(facultyId) {
  const data = load();
  return facultyId
    ? data.blockedDates.filter(bd => bd.facultyId === facultyId)
    : data.blockedDates;
}

export function saveBlockedDate(dateObj) {
  const data = load();
  const full = { id: genId(), ...dateObj };
  data.blockedDates.push(full);
  save(data);
  return full;
}

export function deleteBlockedDate(id) {
  const data = load();
  data.blockedDates = data.blockedDates.filter(bd => bd.id !== id);
  save(data);
}

// ══════════════════════════════════════════════════════════════════════════
// APPOINTMENTS
// ══════════════════════════════════════════════════════════════════════════

export function getAppointments() {
  return load().appointments;
}

export function getAppointmentsByStudent(studentId) {
  return load().appointments.filter(a => a.studentId === studentId);
}

export function getAppointmentsByFaculty(facultyId) {
  return load().appointments.filter(a => a.facultyId === facultyId);
}

export function saveAppointment(appointmentObj) {
  const data = load();
  const full = {
    id: genId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...appointmentObj,
  };
  data.appointments.push(full);
  save(data);
  return full;
}

export function updateAppointmentStatus(id, status) {
  const data = load();
  const idx = data.appointments.findIndex(a => a.id === id);
  if (idx < 0) return null;
  data.appointments[idx].status    = status;
  data.appointments[idx].updatedAt = new Date().toISOString();
  save(data);
  return data.appointments[idx];
}

// ══════════════════════════════════════════════════════════════════════════
// AVAILABLE SLOTS
// ══════════════════════════════════════════════════════════════════════════

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function getAvailableSlots(facultyId, daysAhead = 14) {
  const officeHours  = getOfficeHoursByFaculty(facultyId);
  const blockedDates = getBlockedDates(facultyId);
  const takenSlots   = getAppointmentsByFaculty(facultyId).filter(
    a => a.status === 'pending' || a.status === 'confirmed'
  );

  const slots  = [];
  const now    = new Date();
  const cutoff = new Date(now.getTime() + 60 * 60 * 1000); // now + 1 hour

  for (let dayOffset = 0; dayOffset < daysAhead; dayOffset++) {
    const date = new Date(now);
    date.setDate(date.getDate() + dayOffset);
    date.setHours(0, 0, 0, 0);

    const dayName = DAY_NAMES[date.getDay()];
    const dateStr = date.toISOString().slice(0, 10); // YYYY-MM-DD

    // Skip blocked dates
    if (blockedDates.some(bd => bd.date === dateStr)) continue;

    // Find matching office-hours for this weekday
    const matchingHours = officeHours.filter(oh => oh.dayOfWeek === dayName);

    for (const oh of matchingHours) {
      const [startH, startM] = oh.startTime.split(':').map(Number);
      const [endH,   endM  ] = oh.endTime.split(':').map(Number);
      const duration = parseInt(oh.slotDuration, 10) || 30;

      let slotStart = new Date(date);
      slotStart.setHours(startH, startM, 0, 0);

      const slotEnd = new Date(date);
      slotEnd.setHours(endH, endM, 0, 0);

      while (slotStart < slotEnd) {
        const slotFinish = new Date(slotStart.getTime() + duration * 60000);
        if (slotFinish > slotEnd) break;

        // Must be more than 1 hour in the future
        if (slotStart > cutoff) {
          // Not already taken
          const isTaken = takenSlots.some(a => {
            const aptTime = new Date(a.slotDatetime);
            return Math.abs(aptTime.getTime() - slotStart.getTime()) < 60000;
          });

          if (!isTaken) {
            slots.push({
              slotId   : `${facultyId}::${slotStart.toISOString()}`,
              facultyId,
              datetime : slotStart.toISOString(),
              label    : fmtSlot(slotStart),
              dateLabel: fmtDate(slotStart),
              timeLabel: fmtTime(slotStart),
              dateKey  : dateStr,
              duration,
            });
          }
        }

        slotStart = new Date(slotStart.getTime() + duration * 60000);
      }
    }
  }

  return slots.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
}

// ══════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ══════════════════════════════════════════════════════════════════════════

export function getNotifications(userId) {
  return load().notifications
    .filter(n => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function addNotification(userId, type, message) {
  const data = load();
  data.notifications.push({
    id       : genId(),
    userId,
    type,
    message,
    read     : false,
    createdAt: new Date().toISOString(),
  });
  save(data);
}

export function markNotificationRead(id) {
  const data = load();
  const n = data.notifications.find(n => n.id === id);
  if (n) { n.read = true; save(data); }
}

export function markAllNotificationsRead(userId) {
  const data = load();
  data.notifications.forEach(n => { if (n.userId === userId) n.read = true; });
  save(data);
}

export function getUnreadCount(userId) {
  return load().notifications.filter(n => n.userId === userId && !n.read).length;
}

// ══════════════════════════════════════════════════════════════════════════
// DATE / TIME FORMATTING  (used across all pages)
// ══════════════════════════════════════════════════════════════════════════

/** "Mon, 18 Aug 2026 · 9:00 AM" */
export function fmtDateTime(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    + ' · '
    + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

/** "Mon, 18 Aug" */
export function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

/** "9:00 AM" */
export function fmtTime(d) {
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

/** "Mon, 18 Aug 2026 · 9:00 AM" (alias used by slot generator) */
function fmtSlot(d) { return fmtDateTime(d.toISOString()); }
