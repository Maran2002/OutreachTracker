import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS class names safely.
 * @param {...import('clsx').ClassValue} inputs
 * @returns {string}
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Normalize an email address.
 * @param {string} email
 * @returns {string}
 */
export function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

/**
 * Format a date string for display.
 * @param {string|null|undefined} dateStr
 * @param {Intl.DateTimeFormatOptions} [opts]
 * @returns {string}
 */
export function formatDate(dateStr, opts) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...opts,
    });
  } catch {
    return '—';
  }
}

/**
 * Format a relative time string (e.g. "3 days ago").
 * @param {string|null|undefined} dateStr
 * @returns {string}
 */
export function formatRelativeTime(dateStr) {
  if (!dateStr) return '—';
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return formatDate(dateStr);
  } catch {
    return '—';
  }
}

/**
 * Safely parse an integer with a fallback.
 * @param {unknown} value
 * @param {number} defaultVal
 * @returns {number}
 */
export function parseIntSafe(value, defaultVal) {
  const n = parseInt(String(value), 10);
  return isNaN(n) ? defaultVal : n;
}

/**
 * Clamp a number between min and max.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Build a consistent API error Response.
 * @param {string} code
 * @param {string} message
 * @param {number} status
 * @returns {Response}
 */
export function apiError(code, message, status) {
  return new Response(
    JSON.stringify({ success: false, error: { code, message } }),
    { status, headers: { 'Content-Type': 'application/json' } }
  );
}

/**
 * Build a consistent API success Response.
 * @param {unknown} data
 * @param {string} [message]
 * @param {number} [status=200]
 * @returns {Response}
 */
export function apiSuccess(data, message, status = 200) {
  return new Response(
    JSON.stringify({ success: true, data, ...(message ? { message } : {}) }),
    { status, headers: { 'Content-Type': 'application/json' } }
  );
}

/**
 * Build a paginated API success Response.
 * @param {unknown[]} data
 * @param {{ page: number, limit: number, total: number, totalPages: number }} pagination
 * @returns {Response}
 */
export function apiPaginated(data, pagination) {
  return new Response(
    JSON.stringify({ success: true, data, pagination }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
