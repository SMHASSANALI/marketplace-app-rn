/**
 * Seed data — Customers and their saved delivery addresses.
 *
 * phone_number is in normalised storage format (no + prefix).
 * Coordinates are real Karachi locations used to calculate delivery band
 * distances from the origin (Model Colony, Malir: 24.887, 67.208).
 */
import { Customer, CustomerAddress } from '@/types';

export const CUSTOMER_IDS = {
  AYESHA: 1,
  HAMZA:  2,
  SARA:   3,
  USMAN:  4,
} as const;

export const seedCustomers: Customer[] = [
  { id: CUSTOMER_IDS.AYESHA, phone_number: '923001234567', name: 'Ayesha Khan',    created_at: '2026-03-01T00:00:00Z' },
  { id: CUSTOMER_IDS.HAMZA,  phone_number: '923211987654', name: 'Hamza Tariq',   created_at: '2026-03-05T00:00:00Z' },
  { id: CUSTOMER_IDS.SARA,   phone_number: '923331122334', name: 'Sara Iqbal',    created_at: '2026-03-10T00:00:00Z' },
  { id: CUSTOMER_IDS.USMAN,  phone_number: '923451239876', name: 'Usman Farooq',  created_at: '2026-03-12T00:00:00Z' },
];

export const seedCustomerAddresses: CustomerAddress[] = [
  {
    id:           1,
    customer_id:  CUSTOMER_IDS.AYESHA,
    address_text: 'House 12, near Malir Cantt gate',
    label:        'Home',
    latitude:     24.895,
    longitude:    67.195,
    distance_km:  1.8,  // ~1.8 km from origin → Band 1
    created_at:   '2026-03-01T00:00:00Z',
  },
  {
    id:           2,
    customer_id:  CUSTOMER_IDS.HAMZA,
    address_text: 'Flat 4B, Block 3, Nazimabad',
    label:        'Home',
    latitude:     24.928,
    longitude:    67.037,
    distance_km:  17.1, // ~17 km from origin → Band 3
    created_at:   '2026-03-05T00:00:00Z',
  },
  {
    id:           3,
    customer_id:  CUSTOMER_IDS.SARA,
    address_text: 'Near Gulshan Chowrangi, House 7',
    label:        'Home',
    latitude:     24.918,
    longitude:    67.093,
    distance_km:  8.4,  // ~8 km from origin → Band 2
    created_at:   '2026-03-10T00:00:00Z',
  },
  {
    id:           4,
    customer_id:  CUSTOMER_IDS.USMAN,
    address_text: 'DHA Phase 5, Street 12, House 45',
    label:        'Home',
    latitude:     24.803,
    longitude:    67.064,
    distance_km:  13.2, // ~13 km from origin → Band 2
    created_at:   '2026-03-12T00:00:00Z',
  },
];
