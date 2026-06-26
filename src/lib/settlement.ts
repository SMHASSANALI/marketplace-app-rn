/**
 * Settlement computation — creates Settlement and SettlementLineItem records
 * for all eligible agent commissions.
 *
 * Eligibility criteria (all must be true):
 *   1. order.status === 'delivered'
 *   2. 7-day commission hold has elapsed (getHoldInfo.eligible)
 *   3. order.payment_status === 'reconciled'
 *   4. Line items not already included in a prior settlement
 */

import { ApiError, Settlement } from '@/types';
import { db, nextId, now }      from '@/mock/db';
import { getHoldInfo }          from './utils';

export async function runSettlement(params: {
  agentId?:    number;
  triggeredBy: 'scheduled' | 'manual';
}): Promise<Settlement[]> {
  const { agentId, triggeredBy } = params;

  // Eligible orders
  const eligibleOrders = db.orders.filter(o => {
    if (o.status !== 'delivered' || !o.delivered_at)     return false;
    if (!getHoldInfo(o.delivered_at).eligible)           return false;
    if (o.payment_status !== 'reconciled')               return false;
    if (agentId !== undefined && o.agent_id !== agentId) return false;
    return true;
  });

  // Line items not yet included in any settlement
  const settledItemIds = new Set(db.settlement_line_items.map(s => s.order_line_item_id));
  const eligibleItems  = db.order_line_items.filter(li =>
    li.fulfilled &&
    !settledItemIds.has(li.id) &&
    eligibleOrders.some(o => o.id === li.order_id),
  );

  if (eligibleItems.length === 0) {
    throw new ApiError('No eligible commission to settle.', 'SETTLEMENT_NOTHING_TO_SETTLE');
  }

  // Group by agent
  const byAgent = new Map<number, typeof eligibleItems>();
  for (const li of eligibleItems) {
    const aid = db.orders.find(o => o.id === li.order_id)!.agent_id;
    if (!byAgent.has(aid)) byAgent.set(aid, []);
    byAgent.get(aid)!.push(li);
  }

  const created: Settlement[] = [];
  const timestamp = now();

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

    created.push(settlement);
  }

  return created;
}
