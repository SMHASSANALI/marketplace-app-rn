/**
 * Rider service — delivery flow and cash logging.
 */

import { ApiError, CashCollection, CashDeposit, OrderFull } from '@/types';
import { db, nextId, now }                from '@/mock/db';
import { simulateDelay }                  from '@/mock/delay';
import { updateOrderStatus, getOrders }   from './orders.service';

// ---------------------------------------------------------------------------
// Deliveries
// ---------------------------------------------------------------------------

/** Returns all orders assigned to the rider (active + recently delivered). */
export async function getRiderDeliveries(riderId: number): Promise<OrderFull[]> {
  return getOrders({ riderId });
}

/**
 * Advances an order from 'assigned' → 'out_for_delivery'.
 * Called when the Rider picks up the package and starts the trip.
 */
export async function startDelivery(orderId: number, actorId: number): Promise<OrderFull> {
  return updateOrderStatus(orderId, 'out_for_delivery', actorId, 'Picked up — en route');
}

/**
 * Marks an order as delivered, records delivered_at, and creates a
 * CashCollection record for COD orders.
 *
 * @param amountCollected - Required for COD. Omit for prepaid.
 */
export async function markDelivered(
  orderId:          number,
  riderId:          number,
  actorId:          number,
  amountCollected?: number,
): Promise<OrderFull> {
  await simulateDelay();

  const orderIdx = db.orders.findIndex(o => o.id === orderId);
  if (orderIdx === -1) throw new ApiError(`Order #${orderId} not found.`, 'ORDER_NOT_FOUND', 404);

  const order = db.orders[orderIdx];
  const isCOD = order.payment_method === 'cod';

  if (isCOD && amountCollected == null) {
    throw new ApiError('Cash amount collected is required for COD orders.', 'CASH_AMOUNT_REQUIRED');
  }

  // Transition status (sets delivered_at)
  const updated = await updateOrderStatus(orderId, 'delivered', actorId, 'Delivered by rider');

  // Record cash collection for COD
  if (isCOD && amountCollected != null) {
    const expectedTotal = updated.subtotal + updated.delivery_fee_snapshot;
    const mismatch      = amountCollected !== expectedTotal;

    db.cash_collections.push({
      id:               nextId(db.cash_collections),
      order_id:         orderId,
      rider_id:         riderId,
      deposit_id:       null,
      amount_collected: amountCollected,
      mismatch_flag:    mismatch,
      reconciled:       false,
      reconciled_at:    null,
    });

    // Payment status: collected (will become 'deposited' after deposit log)
    const idx = db.orders.findIndex(o => o.id === orderId);
    db.orders[idx] = { ...db.orders[idx], payment_status: 'collected' };
  }

  return updated;
}

// ---------------------------------------------------------------------------
// Cash collections & deposits
// ---------------------------------------------------------------------------

/** Returns all undeposited cash collections for a rider (COD only). */
export async function getUndepositedCollections(riderId: number): Promise<CashCollection[]> {
  await simulateDelay(50, 150);
  return db.cash_collections.filter(
    c => c.rider_id === riderId && !c.reconciled,
  );
}

/** Returns all cash deposit records for a rider, newest first. */
export async function getRiderDeposits(riderId: number): Promise<CashDeposit[]> {
  await simulateDelay(50, 150);
  return db.cash_deposits
    .filter(d => d.rider_id === riderId)
    .sort((a, b) => new Date(b.deposited_at).getTime() - new Date(a.deposited_at).getTime());
}

/**
 * Logs a cash deposit for all currently undeposited collections.
 * Updates the matching orders' payment_status → 'deposited'.
 *
 * @throws ApiError if there is no collected cash to deposit.
 */
export async function logDeposit(
  riderId:          number,
  depositAmount:    number,
  depositReference: string,
): Promise<CashDeposit> {
  await simulateDelay();

  if (!depositReference.trim()) {
    throw new ApiError('Deposit reference is required.', 'DEPOSIT_REFERENCE_REQUIRED');
  }
  if (depositAmount <= 0) {
    throw new ApiError('Deposit amount must be greater than zero.', 'DEPOSIT_AMOUNT_INVALID');
  }

  const undeposited = db.cash_collections.filter(
    c => c.rider_id === riderId && !c.reconciled,
  );
  if (undeposited.length === 0) {
    throw new ApiError('No collected cash to deposit.', 'DEPOSIT_NOTHING_TO_DEPOSIT');
  }

  const deposit: CashDeposit = {
    id:                nextId(db.cash_deposits),
    rider_id:          riderId,
    deposit_amount:    depositAmount,
    deposit_reference: depositReference.trim(),
    deposited_at:      now(),
    owner_confirmed:   false,
    owner_confirmed_at:null,
  };
  db.cash_deposits.push(deposit);

  // Mark all collections as reconciled (deposited) and update order statuses
  for (const col of undeposited) {
    const idx = db.cash_collections.findIndex(c => c.id === col.id);
    db.cash_collections[idx] = { ...col, reconciled: true, reconciled_at: now(), deposit_id: deposit.id };

    const orderIdx = db.orders.findIndex(o => o.id === col.order_id);
    if (orderIdx >= 0) {
      db.orders[orderIdx] = { ...db.orders[orderIdx], payment_status: 'deposited' };
    }
  }

  return deposit;
}
