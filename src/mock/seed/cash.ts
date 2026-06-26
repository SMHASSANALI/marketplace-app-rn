/**
 * Seed data — Cash collections and deposits.
 *
 * ORD-1001: Imran collected Rs 300 (subtotal Rs 100 + delivery Rs 200).
 * Deposited 8 days ago with reference TRX-20260618-001.
 * Owner has NOT yet confirmed → payment_status stays 'deposited' until v0.12 confirm.
 */
import { CashCollection, CashDeposit } from '@/types';
import { USER_IDS } from './users';

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export const seedCashCollections: CashCollection[] = [
  {
    id:               1,
    order_id:         1,        // ORD-1001
    rider_id:         USER_IDS.RIDER_IMRAN,
    deposit_id:       1,
    amount_collected: 300,      // subtotal Rs 100 + delivery Rs 200
    mismatch_flag:    false,
    reconciled:       true,
    reconciled_at:    daysAgo(8),
  },
];

export const seedCashDeposits: CashDeposit[] = [
  {
    id:                 1,
    rider_id:           USER_IDS.RIDER_IMRAN,
    deposit_amount:     300,
    deposit_reference:  'TRX-20260618-001',
    deposited_at:       daysAgo(8),
    owner_confirmed:    true,             // confirmed by owner (v0.12 complete)
    owner_confirmed_at: daysAgo(7),
  },
];
