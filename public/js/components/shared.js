/**
 * shared.js — Reusable UI components
 * The sidebar/navbar are now rendered inline in app.js (renderLayout).
 * This file provides: renderPage, renderBadge, renderEmpty, renderSpinner,
 *                     showToast, showModal
 */

// ── Page wrapper ──────────────────────────────────────────────────────────
export function renderPage(title, breadcrumb, content) {
  return `
    <div class="page-header">
      <div style="color:var(--text-2);font-size:var(--text-sm);margin-bottom:0.5rem;">${breadcrumb}</div>
      <h1 style="font-size:var(--text-3xl);font-weight:700;margin-bottom:2rem;">${title}</h1>
    </div>
    ${content}
  `;
}

// ── Status badges ─────────────────────────────────────────────────────────
export function renderBadge(status) {
  const map = {
    pending    : 'badge-pending',
    confirmed  : 'badge-confirmed',
    cancelled  : 'badge-cancelled',
    rescheduled: 'badge-rescheduled',
    no_show    : 'badge-no-show',
    admin      : 'badge-no-show',
    faculty    : 'badge-rescheduled',
    student    : 'badge-confirmed',
  };
  const cls = map[status] || 'badge-no-show';
  return `<span class="badge ${cls}" style="text-transform:capitalize;">${status.replace('_',' ')}</span>`;
}

// ── Empty state ───────────────────────────────────────────────────────────
export function renderEmpty(icon, title, subtitle = '') {
  return `
    <div class="empty-state">
      <div class="icon" style="font-size:2.5rem;margin-bottom:1rem;">${icon}</div>
      <h3 style="margin-bottom:0.5rem;color:var(--text-1);">${title}</h3>
      ${subtitle ? `<p style="color:var(--text-2);font-size:var(--text-sm);">${subtitle}</p>` : ''}
    </div>
  `;
}

// ── Spinner ───────────────────────────────────────────────────────────────
export function renderSpinner() {
  return `<div style="display:flex;align-items:center;justify-content:center;min-height:200px;">
    <div class="spinner"></div>
  </div>`;
}

// ── Toast notifications ───────────────────────────────────────────────────
export function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
      position:fixed; bottom:1.5rem; right:1.5rem; z-index:9999;
      display:flex; flex-direction:column; gap:0.5rem;
    `;
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.style.cssText = `
    background: var(--bg-surface);
    border: 1px solid var(--glass-border);
    border-left: 4px solid ${type === 'error' ? 'var(--status-cancelled)' : type === 'warning' ? 'var(--status-pending)' : 'var(--status-confirmed)'};
    border-radius: 8px;
    padding: 0.75rem 1rem;
    color: var(--text-1);
    font-size: var(--text-sm);
    max-width: 320px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    animation: slideInRight 0.3s ease;
    transition: opacity 0.3s ease;
  `;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ── Confirmation modal ────────────────────────────────────────────────────
export function showModal(title, message, onConfirm) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position:fixed; inset:0; background:rgba(0,0,0,0.6);
    display:flex; align-items:center; justify-content:center; z-index:9998;
    backdrop-filter:blur(4px);
    animation:fadeInUp 0.2s ease;
  `;
  overlay.innerHTML = `
    <div style="
      background:var(--bg-surface); border:1px solid var(--glass-border);
      border-radius:16px; padding:2rem; min-width:320px; max-width:480px;
      box-shadow:0 16px 40px rgba(0,0,0,0.5);
    ">
      <h3 style="margin-bottom:0.75rem;font-size:var(--text-xl);">${title}</h3>
      <p style="color:var(--text-2);margin-bottom:1.5rem;font-size:var(--text-sm);">${message}</p>
      <div style="display:flex;gap:0.75rem;justify-content:flex-end;">
        <button class="btn btn-ghost" id="modal-cancel">Cancel</button>
        <button class="btn btn-danger" id="modal-confirm">Confirm</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector('#modal-cancel').onclick = () => overlay.remove();
  overlay.querySelector('#modal-confirm').onclick = () => { onConfirm(); overlay.remove(); };
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}
