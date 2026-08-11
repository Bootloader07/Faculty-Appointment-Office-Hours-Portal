// Global app state — persisted in localStorage so it survives hash-change re-renders
// and is available synchronously before the async /api/auth/me call resolves.

const LS_KEY = 'currentUser';

const VALID_ROLES = ['admin', 'faculty', 'student'];

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw);
    // Discard stale/corrupt entries that have no valid role
    if (!user || !VALID_ROLES.includes(user.role)) {
      localStorage.removeItem(LS_KEY);
      return null;
    }
    return user;
  } catch { return null; }
}

export let currentUser = loadFromStorage();

export function setCurrentUser(user) {
  currentUser = user;
  if (user) {
    localStorage.setItem(LS_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(LS_KEY);
  }
}

export function clearCurrentUser() {
  currentUser = null;
  localStorage.removeItem(LS_KEY);
}
