/**
 * COD Reconciliation service.
 *
 * Owner-facing operations for confirming that Rider cash deposits match
 * the amounts collected. Confirmation transitions affected orders'
 * payment_status → 'reconciled'.
 */

import { ApiError, CashDeposit, DepositFull } from '@/types';
import { db, now }                             from '@/mock/db';
import { simulateDelay }                       from '@/mock/delay';

// ---------------------------------------------------------------------------
// Internal builder
// ---------------------------------------------------------------------------

function buildDeposit(deposit: CashDeposit): DepositFull {
  const rider = db.users.find(u => u.id === deposit.rider_id);
  if (!rider) throw new ApiError('Rider not found.', 'RIDER_NOT_FOUND', 404);

  const collections = db.cash_collections
    .filter(c => c.deposit_id === deposit.id)
    .map(c => {
      const order   = db.orders.find(o => o.id === c.order_id);
      const items   = db.order_line_items.filter(li => li.order_id === c.order_id && li.fulfilled);
      const subtotal = items.reduce((s, li) => s + li.agent_price_snapshot * li.quantity, 0);
      return {
        ...c,
        order_code:     order?.order_code ?? `ORD-${c.order_id}`,
        expected_total: subtotal + (order?.delivery_fee_snapshot ?? 0),
      };
    });

  return { ...deposit, rider, collections };
}

// ---------------------------------------------------------------------------
// Query functions
// ---------------------------------------------------------------------------

/** All deposits, newest first (pending deposits surface first within same day). */
export async function getAllDeposits(): Promise<DepositFull[]> {
  await simulateDelay();
  return [...db.cash_deposits]
    .sort((a, b) => {
      // Pending before confirmed; then newest first
      if (a.owner_confirmed !== b.owner_confirmed) return a.owner_confirmed ? 1 : -1;
      return new Date(b.deposited_at).getTime() - new Date(a.deposited_at).getTime();
    })
    .map(buildDeposit);
}

/** Single deposit with all enriched collection rows. */
export async function getDepositDetail(depositId: number): Promise<DepositFull> {
  await simulateDelay();
  const deposit = db.cash_deposits.find(d => d.id === depositId);
  if (!deposit) throw new ApiError(`Deposit #${depositId} not found.`, 'DEPOSIT_NOT_FOUND', 404);
  return buildDeposit(deposit);
}

// ---------------------------------------------------------------------------
// Mutation
// ---------------------------------------------------------------------------

/**
 * Owner confirms a Rider's cash deposit.
 * Sets owner_confirmed = true and transitions affected orders → 'reconciled'.
 */
export async function confirmDeposit(depositId: number, actorId: number): Promise<DepositFull> {
  await simulateDelay();

  const idx = db.cash_deposits.findIndex(d => d.id === depositId);
  if (idx === -1) throw new ApiError(`Deposit #${depositId} not found.`, 'DEPOSIT_NOT_FOUND', 404);

  if (db.cash_deposits[idx].owner_confirmed) {
    throw new ApiError('This deposit has already been confirmed.', 'DEPOSIT_ALREADY_CONFIRMED');
  }

  db.cash_deposits[idx] = { ...db.cash_deposits[idx], owner_confirmed: true, owner_confirmed_at: now() };

  // Transition all orders in this deposit batch → payment_status 'reconciled'
  const collections = db.cash_collections.filter(c => c.deposit_id === depositId);
  for (const col of collections) {
    const orderIdx = db.orders.findIndex(o => o.id === col.order_id);
    if (orderIdx >= 0) {
      db.orders[orderIdx] = { ...db.orders[orderIdx], payment_status: 'reconciled' };
    }
  }

  return buildDeposit(db.cash_deposits[idx]);
}
