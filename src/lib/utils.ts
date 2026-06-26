/**
 * Shared utility functions used across the entire app.
 *
 * These are pure functions with no side-effects — safe to import anywhere.
 */

import { CommissionHoldInfo } from '@/types';

// ---------------------------------------------------------------------------
// CURRENCY
// ---------------------------------------------------------------------------

/**
 * Formats an integer rupee amount for display.
 * @example formatCurrency(1200) → "Rs 1,200"
 */
export function formatCurrency(amount: number): string {
  return `Rs ${amount.toLocaleString('en-PK')}`;
}

// ---------------------------------------------------------------------------
// DATES
// ---------------------------------------------------------------------------

/**
 * Formats an ISO 8601 date string to a short human-readable date.
 * @example formatDate("2026-06-25T10:00:00Z") → "25 Jun 2026"
 */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PK', {
    day:   'numeric',
    month: 'short',
    year:  'numeric',
  });
}

/**
 * Formats an ISO 8601 date string to date + time.
 * @example formatDateTime("2026-06-25T10:30:00Z") → "25 Jun 2026, 3:30 PM"
 */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-PK', {
    day:    'numeric',
    month:  'short',
    year:   'numeric',
    hour:   'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Returns a relative time string (e.g. "2 hours ago", "3 days ago").
 * Falls back to the full date for older entries.
 */
export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours   = Math.floor(diff / 3_600_000);
  const days    = Math.floor(diff / 86_400_000);

  if (minutes < 1)  return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24)   return `${hours}h ago`;
  if (days < 7)     return `${days}d ago`;
  return formatDate(iso);
}

// ---------------------------------------------------------------------------
// COMMISSION HOLD
// ---------------------------------------------------------------------------

/**
 * Calculates the commission hold status for a delivered order.
 * The hold period is exactly 7 calendar days from the delivered_at timestamp.
 *
 * @param deliveredAt - ISO 8601 timestamp when the order was marked Delivered.
 * @returns CommissionHoldInfo describing days elapsed, remaining, and eligibility.
 */
export function getHoldInfo(deliveredAt: string): CommissionHoldInfo {
  const HOLD_DAYS = 7;
  const deliveredMs = new Date(deliveredAt).getTime();
  const nowMs       = Date.now();
  const elapsedDays = Math.floor((nowMs - deliveredMs) / (1000 * 60 * 60 * 24));
  const remaining   = Math.max(0, HOLD_DAYS - elapsedDays);
  const holdEndsAt  = new Date(deliveredMs + HOLD_DAYS * 86_400_000)
    .toISOString()
    .substring(0, 10);

  return {
    elapsed_days:    elapsedDays,
    remaining_days:  remaining,
    eligible:        remaining === 0,
    hold_ends_at:    holdEndsAt,
  };
}

// ---------------------------------------------------------------------------
// GENERAL
// ---------------------------------------------------------------------------

/**
 * Generates a human-readable order code from an auto-increment ID.
 * @example generateOrderCode(5) → "ORD-1005"
 */
export function generateOrderCode(id: number): string {
  return `ORD-${1000 + id}`;
}

/**
 * Returns a stable colour for a string (e.g. an Agent's name) for avatar use.
 * The same input always produces the same hex colour.
 */
export function stringToColor(str: string): string {
  const palette = [
    '#b5532e', '#0f766e', '#0369a1',
    '#7c3aed', '#b45309', '#16a34a',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
}

/**
 * Returns the initials of a full name (up to 2 characters).
 * @example getInitials("Bilal Raza") → "BR"
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');
}
