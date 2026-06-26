import { ManagerPermission } from '@/types';
import { USER_IDS }          from './users';

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

/**
 * Seed manager permissions: the seeded Manager has 3 of 6 permissions.
 * Missing: confirm_deposits, approve_settlements, view_customer_history
 * — so both allowed and blocked states are testable from the start.
 */
export const seedManagerPermissions: ManagerPermission[] = [
  {
    id:             1,
    user_id:        USER_IDS.MANAGER,
    permission_key: 'confirm_orders',
    granted_by:     USER_IDS.OWNER,
    granted_at:     daysAgo(14),
  },
  {
    id:             2,
    user_id:        USER_IDS.MANAGER,
    permission_key: 'assign_riders',
    granted_by:     USER_IDS.OWNER,
    granted_at:     daysAgo(14),
  },
  {
    id:             3,
    user_id:        USER_IDS.MANAGER,
    permission_key: 'verify_receipts',
    granted_by:     USER_IDS.OWNER,
    granted_at:     daysAgo(14),
  },
];
