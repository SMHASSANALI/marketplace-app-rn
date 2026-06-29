import { Category } from '@/types';
import { USER_IDS } from './users';

export const seedCategories: Category[] = [
  { id: 1, name: 'Electronics',          is_active: true, created_by: USER_IDS.OWNER, created_at: '2026-01-10T00:00:00Z' },
  { id: 2, name: 'Accessories',          is_active: true, created_by: USER_IDS.OWNER, created_at: '2026-01-10T00:00:00Z' },
  { id: 3, name: 'Home & Kitchen',       is_active: true, created_by: USER_IDS.OWNER, created_at: '2026-01-10T00:00:00Z' },
  { id: 4, name: 'Fashion',              is_active: true, created_by: USER_IDS.OWNER, created_at: '2026-01-10T00:00:00Z' },
  { id: 5, name: 'Beauty & Personal Care', is_active: true, created_by: USER_IDS.OWNER, created_at: '2026-01-10T00:00:00Z' },
  { id: 6, name: 'Other',                is_active: true, created_by: USER_IDS.OWNER, created_at: '2026-01-10T00:00:00Z' },
];
