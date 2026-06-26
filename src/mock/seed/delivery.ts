/**
 * Seed data — Delivery origin and distance bands.
 *
 * Origin: Model Colony, Malir, Karachi.
 * Three bands cover the entire service area (Karachi-only for v1.x).
 *
 * Fees are in whole rupees. Rider payout is independent of customer-facing fee.
 */
import { DeliveryBand, DeliveryOrigin } from '@/types';

export const seedDeliveryOrigin: DeliveryOrigin = {
  id:        1,
  label:     'Model Colony, Malir, Karachi',
  latitude:  24.887,
  longitude: 67.208,
  is_active: true,
};

export const seedDeliveryBands: DeliveryBand[] = [
  {
    id:                   1,
    name:                 'Band 1',
    min_distance_km:      0,
    max_distance_km:      5,
    delivery_fee:         200,
    default_rider_payout: 70,
    is_active:            true,
    sort_order:           1,
  },
  {
    id:                   2,
    name:                 'Band 2',
    min_distance_km:      5,
    max_distance_km:      15,
    delivery_fee:         275,
    default_rider_payout: 100,
    is_active:            true,
    sort_order:           2,
  },
  {
    id:                   3,
    name:                 'Band 3',
    min_distance_km:      15,
    max_distance_km:      null, // open-ended: 15 km and above
    delivery_fee:         350,
    default_rider_payout: 130,
    is_active:            true,
    sort_order:           3,
  },
];
