/**
 * Seed data — Products.
 *
 * Five active products owned by the Owner (user ID 1).
 * base_price is in whole rupees — the floor for Agent-set selling price.
 */
import { Product } from '@/types';
import { USER_IDS } from './users';

export const seedProducts: Product[] = [
  {
    id:                  1,
    name:                'Phone Case',
    description:         'Shockproof silicone case, universal fit',
    image_emoji:         '📱',
    category:            'Accessories',
    base_price:          90,
    qty_available:       49,
    low_stock_threshold: 10,
    is_active:           true,
    owner_id:            USER_IDS.OWNER,
    created_at:          '2026-01-10T00:00:00Z',
    images:              [],
  },
  {
    id:                  2,
    name:                'Wireless Earbuds',
    description:         'Bluetooth 5.0, 20h playtime',
    image_emoji:         '🎧',
    category:            'Electronics',
    base_price:          1800,
    qty_available:       4,
    low_stock_threshold: 5,
    is_active:           true,
    owner_id:            USER_IDS.OWNER,
    created_at:          '2026-01-10T00:00:00Z',
    images:              [],
  },
  {
    id:                  3,
    name:                'Watch Strap',
    description:         'Universal silicone strap, 22 mm',
    image_emoji:         '⌚',
    category:            'Accessories',
    base_price:          450,
    qty_available:       22,
    low_stock_threshold: 8,
    is_active:           true,
    owner_id:            USER_IDS.OWNER,
    created_at:          '2026-01-10T00:00:00Z',
    images:              [],
  },
  {
    id:                  4,
    name:                'Power Bank',
    description:         '10 000 mAh fast-charging power bank',
    image_emoji:         '🔋',
    category:            'Electronics',
    base_price:          1200,
    qty_available:       14,
    low_stock_threshold: 5,
    is_active:           true,
    owner_id:            USER_IDS.OWNER,
    created_at:          '2026-01-10T00:00:00Z',
    images:              [],
  },
  {
    id:                  5,
    name:                'Bluetooth Speaker',
    description:         'Portable mini speaker, IPX5 water-resistant',
    image_emoji:         '🔊',
    category:            'Electronics',
    base_price:          1500,
    qty_available:       9,
    low_stock_threshold: 5,
    is_active:           true,
    owner_id:            USER_IDS.OWNER,
    created_at:          '2026-01-10T00:00:00Z',
    images:              [],
  },
];
