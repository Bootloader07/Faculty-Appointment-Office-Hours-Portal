/**
 * UniPortal visual component library.
 * This module is presentation-only: it reads no application data and changes no
 * routes, localStorage records, or business decisions.
 */

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const attributes = (values = {}) => Object.entries(values)
  .filter(([, value]) => value !== undefined && value !== null && value !== false)
  .map(([key, value]) => value === true ? key : `${key}="${escapeHtml(value)}"`)
  .join(' ');

/** 1. GlowCard — premium card surface with opt-in 3D pointer tilt. */
export function createGlowCard({ content = '', className = '', label = '', tilt = true, attributes: extra = {} } = {}) {
  return `
    <article class="glow-card card ${tilt ? 'tilt-card' : ''} ${escapeHtml(className)}"
      ${tilt ? 'data-tilt' : ''}
      ${label ? `aria-label="${escapeHtml(label)}"` : ''}
      ${attributes(extra)}>
      ${content}
    </article>`;
}

/** 2. StatCard — metric display prepared for viewport count-up animation. */
export function createStatCard({ icon = '✦', value = 0, label = '', trend = '', trendTone = 'neutral', className = '' } = {}) {
  return createGlowCard({
    className: `stat-card ${className}`,
    label,
    content: `
      <div class="stat-card__top">
        <span class="stat-icon" aria-hidden="true">${icon}</span>
        ${trend ? `<span class="stat-trend stat-trend--${escapeHtml(trendTone)}">${escapeHtml(trend)}</span>` : ''}
      </div>
      <strong class="stat-value" data-count="${escapeHtml(value)}">0</strong>
      <span class="stat-label">${escapeHtml(label)}</span>`
  });
}

/** 3. StatusBadge — consistent status colors and motion across all roles. */
export function createStatusBadge(status = 'pending') {
  const normalized = String(status).toLowerCase().replace(/\s+/g, '_');
  const labels = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
    rescheduled: 'Rescheduled',
    no_show: 'No show'
  };
  return `<span class="badge status-badge badge-${escapeHtml(normalized)}">${labels[normalized] || escapeHtml(status)}</span>`;
}

/** 4. AvatarInitials — deterministic, accessible initials avatar. */
export function createAvatarInitials(name = '', { size = 'md', className = '' } = {}) {
  const words = String(name).trim().split(/\s+/).filter(Boolean);
  const initials = (words[0]?.[0] || '?') + (words.length > 1 ? words.at(-1)[0] : '');
  const hue = [...String(name)].reduce((total, char) => total + char.charCodeAt(0), 0) % 360;
  return `<span class="avatar-initials avatar-initials--${escapeHtml(size)} ${escapeHtml(className)}" style="--avatar-hue:${hue}" role="img" aria-label="${escapeHtml(name || 'User')}">${escapeHtml(initials.toUpperCase())}</span>`;
}

/** 5. SkeletonLoader — shape-based loading placeholders with shimmer. */
export function createSkeleton({ width = '100%', height = '1rem', radius = '8px', className = '' } = {}) {
  return `<span class="skeleton-loader ${escapeHtml(className)}" style="width:${escapeHtml(width)};height:${escapeHtml(height)};border-radius:${escapeHtml(radius)}" aria-hidden="true"></span>`;
}

/** 6. AnimatedButton — visual variants that keep existing click handlers intact. */
export function createAnimatedButton({ text, variant = 'primary', icon = '', type = 'button', className = '', attributes: extra = {} } = {}) {
  return `<button type="${escapeHtml(type)}" class="btn animated-button btn-${escapeHtml(variant)} ${escapeHtml(className)}" ${attributes(extra)}>${icon ? `<span class="button-icon" aria-hidden="true">${icon}</span>` : ''}<span>${escapeHtml(text || '')}</span></button>`;
}

/** 7. FloatingInput — labeled field markup, with native input semantics unchanged. */
export function createFloatingInput({ id, name, label, type = 'text', value = '', placeholder = ' ', required = false, className = '', attributes: extra = {} } = {}) {
  const inputId = id || name || `field-${Math.random().toString(36).slice(2, 8)}`;
  return `
    <div class="floating-input ${escapeHtml(className)}">
      <input class="form-control" id="${escapeHtml(inputId)}" name="${escapeHtml(name || inputId)}" type="${escapeHtml(type)}" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}" ${required ? 'required' : ''} ${attributes(extra)}>
      <label for="${escapeHtml(inputId)}">${escapeHtml(label || '')}</label>
    </div>`;
}

/** 8. PageTransition — wrapper consumed by pages without changing route resolution. */
export function createPageTransition(content = '', className = '') {
  return `<section class="page-transition ${escapeHtml(className)}" data-page-transition>${content}</section>`;
}

/** 9. EmptyState — reusable semantic blank-slate panel. */
export function createEmptyState({ icon = '✦', title = 'Nothing to show yet', subtitle = '', action = '' } = {}) {
  return `
    <section class="empty-state" role="status">
      <div class="empty-icon" aria-hidden="true">${icon}</div>
      <h3>${escapeHtml(title)}</h3>
      ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}
      ${action ? `<div class="empty-state__action">${action}</div>` : ''}
    </section>`;
}

/** 10. NotificationDropdown — presentational notification menu with current data passed in. */
export function createNotificationDropdown({ notifications = [], id = 'notification-dropdown' } = {}) {
  const unread = notifications.filter(notification => !notification.is_read && !notification.isRead).length;
  const items = notifications.length
    ? notifications.map(notification => `
      <article class="notification-item ${notification.is_read || notification.isRead ? '' : 'is-unread'}">
        <span class="notification-item__dot" aria-hidden="true"></span>
        <div><p>${escapeHtml(notification.message || '')}</p><time>${escapeHtml(notification.time || notification.created_at || '')}</time></div>
      </article>`).join('')
    : `<div class="notification-empty">You're all caught up.</div>`;
  return `
    <div class="notification-menu" id="${escapeHtml(id)}">
      <button class="notification-trigger" type="button" aria-label="Notifications" aria-expanded="false" aria-controls="${escapeHtml(id)}-panel">
        <span aria-hidden="true">♢</span>${unread ? `<span class="notification-count">${unread}</span>` : ''}
      </button>
      <div class="notification-panel" id="${escapeHtml(id)}-panel" role="region" aria-label="Notifications">${items}</div>
    </div>`;
}

function setTilt(card, event) {
  const rect = card.getBoundingClientRect();
  const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
  const rotateY = (x - 0.5) * 16;
  const rotateX = (0.5 - y) * 16;
  card.style.setProperty('--pointer-x', `${(x * 100).toFixed(2)}%`);
  card.style.setProperty('--pointer-y', `${(y * 100).toFixed(2)}%`);
  card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale(1.018)`;
}

function initialiseTilt(root) {
  root.querySelectorAll('[data-tilt]').forEach(card => {
    if (card.dataset.tiltReady) return;
    card.dataset.tiltReady = 'true';
    let pendingEvent = null;
    let frame = null;
    card.addEventListener('pointermove', event => {
      pendingEvent = event;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        setTilt(card, pendingEvent);
        frame = null;
      });
    });
    card.addEventListener('pointerleave', () => {
      pendingEvent = null;
      if (frame) cancelAnimationFrame(frame);
      frame = null;
      card.style.transform = '';
      card.style.removeProperty('--pointer-x');
      card.style.removeProperty('--pointer-y');
    });
  });
}

function animateMetric(element) {
  if (element.dataset.counted) return;
  const target = Number(element.dataset.count);
  if (!Number.isFinite(target)) return;
  element.dataset.counted = 'true';
  const duration = 650;
  const initial = performance.now();
  const formatter = new Intl.NumberFormat();
  const tick = now => {
    const progress = Math.min((now - initial) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = formatter.format(Math.round(target * eased));
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function initialiseViewportEffects(root) {
  if (!('IntersectionObserver' in window)) {
    root.querySelectorAll('[data-reveal], .reveal').forEach(element => element.classList.add('is-visible'));
    root.querySelectorAll('[data-count]').forEach(animateMetric);
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.14 });
  root.querySelectorAll('[data-reveal], .reveal').forEach(element => observer.observe(element));

  const metricObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      animateMetric(entry.target);
      metricObserver.unobserve(entry.target);
    });
  }, { threshold: 0.4 });
  root.querySelectorAll('[data-count]').forEach(element => metricObserver.observe(element));
}

/** Hydrates purely visual effects after a page writes its current markup. */
export function hydrateVisualComponents(root = document) {
  initialiseTilt(root);
  initialiseViewportEffects(root);
}

export function leavePage(container) {
  if (!container) return Promise.resolve();
  container.classList.add('page-leave');
  return new Promise(resolve => window.setTimeout(resolve, 150));
}

export default {
  createGlowCard,
  createStatCard,
  createStatusBadge,
  createAvatarInitials,
  createSkeleton,
  createAnimatedButton,
  createFloatingInput,
  createPageTransition,
  createEmptyState,
  createNotificationDropdown,
  hydrateVisualComponents,
  leavePage
};
