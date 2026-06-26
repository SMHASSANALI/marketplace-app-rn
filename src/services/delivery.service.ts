/**
 * Delivery service.
 *
 * Handles delivery origin and distance-band management, plus the automatic
 * band calculation for a given delivery address.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * BACKEND INTEGRATION: replace mock implementations with real API calls.
 * ─────────────────────────────────────────────────────────────────────────
 */

import { ApiError, DeliveryBand, DeliveryOrigin } from '@/types';
import { db, nextId, now as timestamp }           from '@/mock/db';
import { simulateDelay }                          from '@/mock/delay';

// ---------------------------------------------------------------------------
// Haversine distance
// ---------------------------------------------------------------------------

/**
 * Calculates the straight-line distance between two lat/lon points in km.
 * Used to determine which delivery band applies to a customer's address.
 */
export function haversineKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R    = 6371.0;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dPhi = ((lat2 - lat1) * Math.PI) / 180;
  const dLam = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLam / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// ---------------------------------------------------------------------------
// Origin
// ---------------------------------------------------------------------------

/**
 * Returns the active delivery origin (Model Colony, Malir).
 * There is exactly one active origin in v1.x.
 */
export async function getDeliveryOrigin(): Promise<DeliveryOrigin> {
  await simulateDelay(80, 180);

  // ── MOCK ─────────────────────────────────────────────────────────────────
  const origin = db.delivery_origin.find(o => o.is_active);
  if (!origin) throw new ApiError('No active delivery origin configured.', 'ORIGIN_MISSING', 500);
  return origin;
  // ── END MOCK ─────────────────────────────────────────────────────────────
}

/**
 * Updates the active delivery origin (Owner only).
 */
export async function updateDeliveryOrigin(
  input: Partial<Pick<DeliveryOrigin, 'label' | 'latitude' | 'longitude'>>,
): Promise<DeliveryOrigin> {
  await simulateDelay();

  // ── MOCK ─────────────────────────────────────────────────────────────────
  const idx = db.delivery_origin.findIndex(o => o.is_active);
  if (idx === -1) throw new ApiError('No active delivery origin found.', 'ORIGIN_MISSING', 500);
  db.delivery_origin[idx] = { ...db.delivery_origin[idx], ...input };
  return db.delivery_origin[idx];
  // ── END MOCK ─────────────────────────────────────────────────────────────
}

// ---------------------------------------------------------------------------
// Bands
// ---------------------------------------------------------------------------

/**
 * Returns all active delivery bands, sorted by sort_order (ascending).
 */
export async function getDeliveryBands(): Promise<DeliveryBand[]> {
  await simulateDelay(80, 180);

  // ── MOCK ─────────────────────────────────────────────────────────────────
  return db.delivery_bands
    .filter(b => b.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);
  // ── END MOCK ─────────────────────────────────────────────────────────────
}

/**
 * Finds the delivery band that covers a given distance from the origin.
 *
 * @param distanceKm - Distance in km from the delivery origin.
 * @returns The matching DeliveryBand, or null if no band covers the distance.
 */
export function findBandForDistance(
  distanceKm: number,
  bands: DeliveryBand[],
): DeliveryBand | null {
  const sorted = [...bands].sort((a, b) => a.sort_order - b.sort_order);
  for (const band of sorted) {
    if (band.max_distance_km === null) {
      if (distanceKm >= band.min_distance_km) return band;
    } else if (distanceKm >= band.min_distance_km && distanceKm < band.max_distance_km) {
      return band;
    }
  }
  // If nothing matched, fall back to the last band (open-ended)
  return sorted[sorted.length - 1] ?? null;
}

/** Result of a delivery band calculation for a specific address. */
export interface BandCalculationResult {
  band:        DeliveryBand | null;
  distance_km: number | null;
}

/**
 * Calculates the delivery band for a customer's lat/lon coordinates.
 * Returns null band if coordinates are unavailable.
 *
 * @param latitude  - Customer address latitude
 * @param longitude - Customer address longitude
 */
export async function calculateBandForCoords(
  latitude:  number | null,
  longitude: number | null,
): Promise<BandCalculationResult> {
  if (latitude == null || longitude == null) {
    return { band: null, distance_km: null };
  }

  const origin    = await getDeliveryOrigin();
  const bands     = await getDeliveryBands();
  const distRaw   = haversineKm(origin.latitude, origin.longitude, latitude, longitude);
  const distance  = Math.round(distRaw * 100) / 100; // round to 2 dp
  const band      = findBandForDistance(distance, bands);
  return { band, distance_km: distance };
}

/** Input for creating a new delivery band. */
export type CreateBandInput = Omit<DeliveryBand, 'id'>;

/**
 * Creates a new delivery band (Owner only).
 */
export async function createDeliveryBand(input: CreateBandInput): Promise<DeliveryBand> {
  await simulateDelay();

  // ── MOCK ─────────────────────────────────────────────────────────────────
  const band: DeliveryBand = { ...input, id: nextId(db.delivery_bands) };
  db.delivery_bands.push(band);
  return band;
  // ── END MOCK ─────────────────────────────────────────────────────────────
}

/**
 * Updates an existing delivery band (Owner only).
 */
export async function updateDeliveryBand(
  id:    number,
  input: Partial<Omit<DeliveryBand, 'id'>>,
): Promise<DeliveryBand> {
  await simulateDelay();

  // ── MOCK ─────────────────────────────────────────────────────────────────
  const idx = db.delivery_bands.findIndex(b => b.id === id);
  if (idx === -1) throw new ApiError(`Band #${id} not found.`, 'BAND_NOT_FOUND', 404);
  db.delivery_bands[idx] = { ...db.delivery_bands[idx], ...input };
  return db.delivery_bands[idx];
  // ── END MOCK ─────────────────────────────────────────────────────────────
}
