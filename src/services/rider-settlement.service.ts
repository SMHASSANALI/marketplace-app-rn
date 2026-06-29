/**
 * Rider settlement service.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * BACKEND INTEGRATION
 * Replace mock implementations with real API calls. Signatures must not change.
 * ─────────────────────────────────────────────────────────────────────────
 */

import { ApiError, RiderSettlement, RiderSettlementFull } from '@/types';
import { db }            from '@/mock/db';
import { simulateDelay } from '@/mock/delay';

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

function buildFull(rs: RiderSettlement): RiderSettlementFull {
  const rider     = db.users.find(u => u.id === rs.rider_id)!;
  const line_items = db.rider_settlement_items
    .filter(i => i.rider_settlement_id === rs.id)
    .map(i => {
      const order = db.orders.find(o => o.id === i.order_id)!;
      return { ...i, order_code: order.order_code };
    });
  return { ...rs, rider, line_items };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getRiderSettlements(riderId?: number): Promise<RiderSettlementFull[]> {
  await simulateDelay();
  const list = riderId != null
    ? db.rider_settlements.filter(rs => rs.rider_id === riderId)
    : [...db.rider_settlements];
  return list.map(buildFull);
}

export async function getRiderSettlement(id: number): Promise<RiderSettlementFull> {
  await simulateDelay();
  const rs = db.rider_settlements.find(r => r.id === id);
  if (!rs) throw new ApiError(`Rider settlement #${id} not found.`, 'RIDER_SETTLEMENT_NOT_FOUND', 404);
  return buildFull(rs);
}

// ---------------------------------------------------------------------------
// Owner mutations
// ---------------------------------------------------------------------------

export async function approveRiderSettlement(id: number): Promise<RiderSettlementFull> {
  await simulateDelay();
  const idx = db.rider_settlements.findIndex(r => r.id === id);
  if (idx === -1) throw new ApiError(`Rider settlement #${id} not found.`, 'RIDER_SETTLEMENT_NOT_FOUND', 404);
  if (db.rider_settlements[idx].status !== 'pending')
    throw new ApiError('Only pending settlements can be approved.', 'RIDER_SETTLEMENT_INVALID_STATE');
  db.rider_settlements[idx] = { ...db.rider_settlements[idx], status: 'approved' };
  return buildFull(db.rider_settlements[idx]);
}

export async function markRiderSettlementPaid(
  id:               number,
  paymentReference: string,
  paidBy?:          number,
): Promise<RiderSettlementFull> {
  await simulateDelay();
  const idx = db.rider_settlements.findIndex(r => r.id === id);
  if (idx === -1) throw new ApiError(`Rider settlement #${id} not found.`, 'RIDER_SETTLEMENT_NOT_FOUND', 404);
  if (db.rider_settlements[idx].status !== 'approved')
    throw new ApiError('Only approved settlements can be marked paid.', 'RIDER_SETTLEMENT_INVALID_STATE');
  if (!paymentReference.trim())
    throw new ApiError('Payment reference is required.', 'RIDER_SETTLEMENT_REFERENCE_REQUIRED');
  db.rider_settlements[idx] = {
    ...db.rider_settlements[idx],
    status:            'paid',
    paid_at:           new Date().toISOString(),
    paid_by:           paidBy ?? null,
    payment_reference: paymentReference.trim(),
  };
  return buildFull(db.rider_settlements[idx]);
}

// ---------------------------------------------------------------------------
// Rider mutations (acknowledgement / dispute)
// ---------------------------------------------------------------------------

export async function acknowledgeRiderSettlement(id: number, comment?: string): Promise<RiderSettlementFull> {
  await simulateDelay();
  const idx = db.rider_settlements.findIndex(r => r.id === id);
  if (idx === -1) throw new ApiError(`Rider settlement #${id} not found.`, 'RIDER_SETTLEMENT_NOT_FOUND', 404);
  if (db.rider_settlements[idx].status !== 'paid')
    throw new ApiError('Only paid settlements can be acknowledged.', 'RIDER_SETTLEMENT_INVALID_STATE');
  db.rider_settlements[idx] = {
    ...db.rider_settlements[idx],
    status:          'confirmed',
    acknowledged_at: new Date().toISOString(),
    dispute_comment: comment ?? null,
  };
  return buildFull(db.rider_settlements[idx]);
}

export async function disputeRiderSettlement(id: number, comment: string): Promise<RiderSettlementFull> {
  await simulateDelay();
  if (!comment.trim()) throw new ApiError('Dispute comment is required.', 'DISPUTE_COMMENT_REQUIRED');
  const idx = db.rider_settlements.findIndex(r => r.id === id);
  if (idx === -1) throw new ApiError(`Rider settlement #${id} not found.`, 'RIDER_SETTLEMENT_NOT_FOUND', 404);
  if (db.rider_settlements[idx].status !== 'paid')
    throw new ApiError('Only paid settlements can be disputed.', 'RIDER_SETTLEMENT_INVALID_STATE');
  db.rider_settlements[idx] = { ...db.rider_settlements[idx], dispute_comment: comment.trim() };
  return buildFull(db.rider_settlements[idx]);
}
