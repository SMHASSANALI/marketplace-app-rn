import { ApiError, AgentOrderCommission, CommissionStatus, SettlementFull, SettlementStatus } from '@/types';
import { db }            from '@/mock/db';
import { simulateDelay } from '@/mock/delay';
import { getHoldInfo }   from '@/lib/utils';

// ---------------------------------------------------------------------------
// Internal builder
// ---------------------------------------------------------------------------

function buildSettlement(s: (typeof db.settlements)[0]): SettlementFull {
  const agent = db.users.find(u => u.id === s.agent_id)!;
  const line_items = db.settlement_line_items
    .filter(sli => sli.settlement_id === s.id)
    .map(sli => {
      const li      = db.order_line_items.find(l => l.id === sli.order_line_item_id)!;
      const order   = db.orders.find(o => o.id === li.order_id)!;
      const product = db.products.find(p => p.id === li.product_id);
      return {
        ...sli,
        order_code:             order.order_code,
        product_name:           product?.name        ?? 'Unknown',
        product_emoji:          product?.image_emoji ?? '📦',
        quantity:               li.quantity,
        selling_price_snapshot: li.selling_price_snapshot,
        base_price_snapshot:    li.base_price_snapshot,
      };
    });
  return { ...s, agent, line_items };
}

const STATUS_ORDER: Record<SettlementStatus, number> = { pending: 0, approved: 1, paid: 2 };

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getAllSettlements(): Promise<SettlementFull[]> {
  await simulateDelay();
  return [...db.settlements]
    .sort((a, b) => {
      const d = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      return d !== 0 ? d : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })
    .map(buildSettlement);
}

export async function getSettlementDetail(id: number): Promise<SettlementFull> {
  await simulateDelay();
  const s = db.settlements.find(s => s.id === id);
  if (!s) throw new ApiError(`Settlement #${id} not found.`, 'SETTLEMENT_NOT_FOUND', 404);
  return buildSettlement(s);
}

export async function getAgentCommission(agentId: number): Promise<AgentOrderCommission[]> {
  await simulateDelay();

  const orders = db.orders.filter(o =>
    o.agent_id === agentId && o.status === 'delivered' && !!o.delivered_at,
  );

  return orders.map(order => {
    const items          = db.order_line_items.filter(li => li.order_id === order.id && li.fulfilled);
    const commissionTotal = items.reduce((s, li) => s + li.commission_amount, 0);
    const holdInfo       = getHoldInfo(order.delivered_at!);

    // Is any line item already in a settlement?
    const settledLineItem = items.find(li =>
      db.settlement_line_items.some(sli => sli.order_line_item_id === li.id),
    );

    let commissionStatus: CommissionStatus;
    let settlementId: number | undefined;
    let settlementStatus: SettlementStatus | undefined;

    if (settledLineItem) {
      const sli        = db.settlement_line_items.find(s => s.order_line_item_id === settledLineItem.id)!;
      const settlement = db.settlements.find(s => s.id === sli.settlement_id)!;
      settlementId     = settlement.id;
      settlementStatus = settlement.status;
      commissionStatus = settlement.status === 'paid' ? 'paid' : 'in_settlement';
    } else if (!holdInfo.eligible) {
      commissionStatus = 'in_hold';
    } else if (order.payment_status !== 'reconciled') {
      commissionStatus = 'awaiting_reconciliation';
    } else {
      commissionStatus = 'eligible';
    }

    return {
      order_id: order.id, order_code: order.order_code,
      delivered_at: order.delivered_at, commission_total: commissionTotal,
      commission_status: commissionStatus, hold_info: holdInfo,
      settlement_id: settlementId, settlement_status: settlementStatus,
    };
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function approveSettlement(id: number): Promise<SettlementFull> {
  await simulateDelay();
  const idx = db.settlements.findIndex(s => s.id === id);
  if (idx === -1) throw new ApiError(`Settlement #${id} not found.`, 'SETTLEMENT_NOT_FOUND', 404);
  if (db.settlements[idx].status !== 'pending')
    throw new ApiError('Only pending settlements can be approved.', 'SETTLEMENT_INVALID_STATE');
  db.settlements[idx] = { ...db.settlements[idx], status: 'approved' };
  return buildSettlement(db.settlements[idx]);
}

export async function markSettlementPaid(
  id: number,
  paymentReceiptUri?: string,
): Promise<SettlementFull> {
  await simulateDelay();
  const idx = db.settlements.findIndex(s => s.id === id);
  if (idx === -1) throw new ApiError(`Settlement #${id} not found.`, 'SETTLEMENT_NOT_FOUND', 404);
  if (db.settlements[idx].status !== 'approved')
    throw new ApiError('Only approved settlements can be marked paid.', 'SETTLEMENT_INVALID_STATE');
  db.settlements[idx] = {
    ...db.settlements[idx],
    status: 'paid',
    payment_receipt_uri: paymentReceiptUri ?? null,
  };
  return buildSettlement(db.settlements[idx]);
}
