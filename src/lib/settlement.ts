/**
 * Settlement computation — creates Settlement and SettlementLineItem records
 * for all eligible agent commissions, and RiderSettlement records for rider payouts.
 *
 * Agent commission eligibility (all must be true):
 *   1. order.status === 'delivered'
 *   2. 7-day commission hold has elapsed (getHoldInfo.eligible)
 *   3. order.payment_status === 'reconciled'
 *   4. Line items not already included in a prior settlement
 *
 * Rider payout eligibility:
 *   1. order.status === 'delivered'
 *   2. order.delivery_items_confirmed === true
 *   3. rider_payout_snapshot is not null
 *   4. Order not already included in a prior rider settlement
 */

import { ApiError, Settlement, RiderSettlement } from '@/types';
import { db, nextId, now }                        from '@/mock/db';
import { getHoldInfo }                            from './utils';

const PAYMENT_DEFAULTS = {
  paid_at: null, paid_by: null, payment_reference: null,
  acknowledged_at: null, dispute_comment: null,
};

export async function runSettlement(params: {
  agentId?:    number;
  triggeredBy: 'scheduled' | 'manual';
}): Promise<{ agentSettlements: Settlement[]; riderSettlements: RiderSettlement[] }> {
  const { agentId, triggeredBy } = params;

  // ── Agent settlements ────────────────────────────────────────────────────
  const eligibleOrders = db.orders.filter(o => {
    if (o.status !== 'delivered' || !o.delivered_at)     return false;
    if (!getHoldInfo(o.delivered_at).eligible)           return false;
    if (o.payment_status !== 'reconciled')               return false;
    if (agentId !== undefined && o.agent_id !== agentId) return false;
    return true;
  });

  const settledItemIds = new Set(db.settlement_line_items.map(s => s.order_line_item_id));
  const eligibleItems  = db.order_line_items.filter(li =>
    li.fulfilled &&
    !settledItemIds.has(li.id) &&
    eligibleOrders.some(o => o.id === li.order_id),
  );

  const agentSettlements: Settlement[] = [];
  const timestamp = now();

  if (eligibleItems.length > 0) {
    const byAgent = new Map<number, typeof eligibleItems>();
    for (const li of eligibleItems) {
      const aid = db.orders.find(o => o.id === li.order_id)!.agent_id;
      if (!byAgent.has(aid)) byAgent.set(aid, []);
      byAgent.get(aid)!.push(li);
    }

    for (const [aid, items] of byAgent.entries()) {
      const orderDates = items
        .map(li => db.orders.find(o => o.id === li.order_id)?.delivered_at)
        .filter(Boolean) as string[];
      const periodStart = [...orderDates].sort()[0] ?? timestamp;
      const total       = items.reduce((s, li) => s + li.commission_amount, 0);

      const settlement: Settlement = {
        id:                  nextId(db.settlements),
        agent_id:            aid,
        period_start:        periodStart,
        period_end:          timestamp,
        total_commission:    total,
        status:              'pending',
        triggered_by:        triggeredBy,
        created_at:          timestamp,
        payment_receipt_uri: null,
        ...PAYMENT_DEFAULTS,
      };
      db.settlements.push(settlement);

      for (const li of items) {
        db.settlement_line_items.push({
          id:                 nextId(db.settlement_line_items),
          settlement_id:      settlement.id,
          order_line_item_id: li.id,
          commission_amount:  li.commission_amount,
        });
      }
      agentSettlements.push(settlement);
    }
  }

  // ── Rider settlements ────────────────────────────────────────────────────
  const settledOrderIds = new Set(db.rider_settlement_items.map(r => r.order_id));
  const eligibleRiderOrders = db.orders.filter(o => {
    if (o.status !== 'delivered')            return false;
    if (!o.delivery_items_confirmed)         return false;
    if (o.rider_id == null)                  return false;
    if (o.rider_payout_snapshot == null)     return false;
    if (settledOrderIds.has(o.id))           return false;
    if (agentId !== undefined)               return false; // skip rider pass on agent-specific runs
    return true;
  });

  const riderSettlements: RiderSettlement[] = [];

  if (eligibleRiderOrders.length > 0) {
    const byRider = new Map<number, typeof eligibleRiderOrders>();
    for (const o of eligibleRiderOrders) {
      const rid = o.rider_id!;
      if (!byRider.has(rid)) byRider.set(rid, []);
      byRider.get(rid)!.push(o);
    }

    for (const [rid, orders] of byRider.entries()) {
      const dates  = orders.map(o => o.delivered_at!).sort();
      const total  = orders.reduce((s, o) => s + (o.rider_payout_snapshot ?? 0), 0);

      const rs: RiderSettlement = {
        id:            nextId(db.rider_settlements),
        rider_id:      rid,
        period_start:  dates[0],
        period_end:    timestamp,
        total_payout:  total,
        status:        'pending',
        triggered_by:  triggeredBy,
        created_at:    timestamp,
        ...PAYMENT_DEFAULTS,
      };
      db.rider_settlements.push(rs);

      for (const o of orders) {
        db.rider_settlement_items.push({
          id:                  nextId(db.rider_settlement_items),
          rider_settlement_id: rs.id,
          order_id:            o.id,
          payout_amount:       o.rider_payout_snapshot!,
        });
      }
      riderSettlements.push(rs);
    }
  }

  if (agentSettlements.length === 0 && riderSettlements.length === 0) {
    throw new ApiError('No eligible commission or payouts to settle.', 'SETTLEMENT_NOTHING_TO_SETTLE');
  }

  return { agentSettlements, riderSettlements };
}
