/**
 * Design-system constants — Indigo / Slate palette (v2).
 *
 * Updating these tokens here propagates to every screen that imports from
 * this file. The three owner screens (dashboard, orders, products) and
 * OwnerOrderCard define their own local `C` const and are not affected.
 */

export const COLORS = {
  // ── Brand ──────────────────────────────────────────────────────────────────
  brand:        '#4F46E5', // Indigo 600
  brandLight:   '#EEF2FF', // Indigo 50
  brandDark:    '#4338CA', // Indigo 700

  // ── Status accent (kept for backward-compat; semantic use only) ─────────────
  teal:         '#047857', // Emerald 700 (delivered, verified)

  // ── Backgrounds ────────────────────────────────────────────────────────────
  bg:           '#F8FAFC', // Slate 50
  surface:      '#FFFFFF',
  surfaceAlt:   '#F1F5F9', // Slate 100

  // ── Text ───────────────────────────────────────────────────────────────────
  text:         '#0F172A', // Slate 900
  textSecondary:'#475569', // Slate 600
  muted:        '#94A3B8', // Slate 400

  // ── Borders ────────────────────────────────────────────────────────────────
  border:       '#E2E8F0', // Slate 200
  borderStrong: '#94A3B8', // Slate 400

  // ── Semantic ────────────────────────────────────────────────────────────────
  success:      '#047857', // Emerald 700
  successLight: '#D1FAE5', // Emerald 100
  warning:      '#B45309', // Amber 700
  warningLight: '#FEF3C7', // Amber 100
  danger:       '#BE123C', // Rose 700
  dangerLight:  '#FFE4E6', // Rose 100
  info:         '#0369A1', // Sky 700
  infoLight:    '#E0F2FE', // Sky 100

  // ── Status badge colours ────────────────────────────────────────────────────
  statusPending:         '#B45309', // amber
  statusConfirmed:       '#0369A1', // sky
  statusAssigned:        '#4F46E5', // indigo
  statusOutForDelivery:  '#C2410C', // orange
  statusDelivered:       '#047857', // emerald
  statusReturned:        '#BE123C', // rose
  statusCancelled:       '#BE123C', // rose
} as const;

export const FONT_SIZES = {
  xs:    11,
  sm:    13,
  base:  15,
  md:    16,
  lg:    18,
  xl:    20,
  '2xl': 24,
  '3xl': 28,
} as const;

export const FONT_WEIGHTS = {
  regular:  '400' as const,
  medium:   '500' as const,
  semibold: '600' as const,
  bold:     '700' as const,
};

export const RADIUS = {
  sm:   6,
  md:   10,
  lg:   14,
  xl:   20,
  full: 999,
  pill: 999,
} as const;

export const SPACING = {
  xs:    4,
  sm:    8,
  md:    12,
  base:  16,
  lg:    20,
  xl:    24,
  '2xl': 32,
} as const;

export const SHADOW = {
  sm: {
    shadowColor:   '#64748B',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius:  12,
    elevation:     2,
  },
  md: {
    shadowColor:   '#64748B',
    shadowOffset:  { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius:  16,
    elevation:     4,
  },
} as const;

/** Maps an OrderStatus to its display colour. */
export const STATUS_COLOR: Record<string, string> = {
  pending:          COLORS.statusPending,
  confirmed:        COLORS.statusConfirmed,
  assigned:         COLORS.statusAssigned,
  out_for_delivery: COLORS.statusOutForDelivery,
  delivered:        COLORS.statusDelivered,
  returned:         COLORS.statusReturned,
  cancelled:        COLORS.statusCancelled,
};

/** Maps an OrderStatus to its human-readable label. */
export const STATUS_LABEL: Record<string, string> = {
  pending:          'Pending',
  confirmed:        'Confirmed',
  assigned:         'Assigned',
  out_for_delivery: 'Out for Delivery',
  delivered:        'Delivered',
  returned:         'Returned',
  cancelled:        'Cancelled',
};
