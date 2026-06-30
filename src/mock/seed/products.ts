import { Product } from '@/types';
import { USER_IDS } from './users';

export const seedProducts: Product[] = [
  {
    id: 1, sku: 'ACC-PC-001', name: 'Phone Case',
    description: 'Shockproof silicone case, universal fit',
    image_emoji: '📱', category: 'Accessories', category_id: 2,
    buying_price: 50, selling_price: 90,
    qty_available: 49, low_stock_threshold: 10,
    is_active: true, owner_id: USER_IDS.OWNER,
    created_at: '2026-01-10T00:00:00Z', images: [],
  },
  {
    id: 2, sku: 'ELE-WE-002', name: 'Wireless Earbuds',
    description: 'Bluetooth 5.0, 20h playtime',
    image_emoji: '🎧', category: 'Electronics', category_id: 1,
    buying_price: 1500, selling_price: 1800,
    qty_available: 4, low_stock_threshold: 5,
    is_active: true, owner_id: USER_IDS.OWNER,
    created_at: '2026-01-10T00:00:00Z', images: [],
  },
  {
    id: 3, sku: 'ACC-WS-003', name: 'Watch Strap',
    description: 'Universal silicone strap, 22 mm',
    image_emoji: '⌚', category: 'Accessories', category_id: 2,
    buying_price: 350, selling_price: 450,
    qty_available: 22, low_stock_threshold: 8,
    is_active: true, owner_id: USER_IDS.OWNER,
    created_at: '2026-01-10T00:00:00Z', images: [],
  },
  {
    id: 4, sku: 'ELE-PB-004', name: 'Power Bank',
    description: '10 000 mAh fast-charging power bank',
    image_emoji: '🔋', category: 'Electronics', category_id: 1,
    buying_price: 1000, selling_price: 1200,
    qty_available: 14, low_stock_threshold: 5,
    is_active: true, owner_id: USER_IDS.OWNER,
    created_at: '2026-01-10T00:00:00Z', images: [],
  },
  {
    id: 5, sku: 'ELE-BS-005', name: 'Bluetooth Speaker',
    description: 'Portable mini speaker, IPX5 water-resistant',
    image_emoji: '🔊', category: 'Electronics', category_id: 1,
    buying_price: 1200, selling_price: 1500,
    qty_available: 9, low_stock_threshold: 5,
    is_active: true, owner_id: USER_IDS.OWNER,
    created_at: '2026-01-10T00:00:00Z', images: [],
  },
];
