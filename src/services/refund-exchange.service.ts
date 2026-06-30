/**
 * Refund & Exchange service — Owner only.
 *
 * Allows the Owner to initiate a refund or product exchange against a delivered
 * order. The order code is the primary lookup key.
 */

import {
  ApiError,
  RefundExchange,
  RefundExchangeFull,
  RefundExchangeLineItem,
  RefundExchangeStatus,
  RefundExchangeType,
} from '@/types';
import { db, nextId, now } from '@/mock/db';
import { simulateDelay }   from '@/mock/delay';

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface CreateRefundExchangeInput {
  order_id:   number;
  type:       RefundExchangeType;
  reason:     string;
  items: {
    order_line_item_id:    number;
    product_id:            number;
    return_quantity:       number;
    exchange_product_id?:  number;
    exchange_quantity?:    number;
  }[];
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

function buildFull(re: RefundExchange): RefundExchangeFull {
  const order = db.orders.find(o => o.id === re.order_id);
  const lineItems = db.refund_exchange_items.filter(i => i.refund_exchange_id === re.id);
  const processor = re.processed_by ? db.users.find(u => u.id === re.processed_by) : null;

  return {
    ...re,
    order_code:        order?.order_code  ?? `#${re.order_id}`,
    customer_name:     (() => {
      if (!order) return 'Unknown';
      const cust = db.customers.find(c => c.id === order.customer_id);
      return cust?.name ?? 'Unknown';
    })(),
    processed_by_name: processor?.name ?? null,
    line_items: lineItems.map(li => {
      const prod     = db.products.find(p => p.id === li.product_id);
      const exchProd = li.exchange_product_id
        ? db.products.find(p => p.id === li.exchange_product_id)
        : null;
      const oli = db.order_line_items.find(i => i.id === li.order_line_item_id);
      return {
        ...li,
        product_name:          prod?.name        ?? `Product #${li.product_id}`,
        product_emoji:         prod?.image_emoji  ?? '📦',
        unit_price:            oli?.agent_price_snapshot ?? 0,
        exchange_product_name: exchProd?.name ?? null,
      };
    }),
  };
}

// ---------------------------------------------------------------------------
// Public functions
// ---------------------------------------------------------------------------

export async function getRefundExchanges(): Promise<RefundExchangeFull[]> {
  await simulateDelay();
  return db.refund_exchanges
    .slice()
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map(buildFull);
}

export async function getRefundExchange(id: number): Promise<RefundExchangeFull> {
  await simulateDelay();
  const re = db.refund_exchanges.find(r => r.id === id);
  if (!re) throw new ApiError(`Refund/Exchange #${id} not found.`, 'RE_NOT_FOUND', 404);
  return buildFull(re);
}

/** Looks up an order by order_code and returns it if eligible (delivered). */
export async function findOrderForRefund(orderCode: string): Promise<{
  order_id: number;
  order_code: string;
  customer_name: string;
  status: string;
  line_items: { id: number; product_id: number; product_name: string; product_emoji: string; quantity: number; agent_price_snapshot: number }[];
}> {
  await simulateDelay(100, 250);
  const order = db.orders.find(o => o.order_code.toUpperCase() === orderCode.toUpperCase());
  if (!order) throw new ApiError(`Order "${orderCode}" not found.`, 'ORDER_NOT_FOUND', 404);
  if (order.status !== 'delivered') {
    throw new ApiError(
      `Only delivered orders can be refunded or exchanged. Order is currently "${order.status}".`,
      'ORDER_NOT_DELIVERED', 400,
    );
  }

  const cust = db.customers.find(c => c.id === order.customer_id);
  const lineItems = db.order_line_items
    .filter(li => li.order_id === order.id && li.fulfilled)
    .map(li => {
      const prod = db.products.find(p => p.id === li.product_id);
      return {
        id:                    li.id,
        product_id:            li.product_id,
        product_name:          prod?.name       ?? `Product #${li.product_id}`,
        product_emoji:         prod?.image_emoji ?? '📦',
        quantity:              li.quantity_delivered ?? li.quantity_picked_up ?? li.quantity,
        agent_price_snapshot:  li.agent_price_snapshot,
      };
    });

  return {
    order_id:      order.id,
    order_code:    order.order_code,
    customer_name: cust?.name ?? 'Unknown',
    status:        order.status,
    line_items:    lineItems,
  };
}

export async function createRefundExchange(
  input: CreateRefundExchangeInput,
  actorId: number,
): Promise<RefundExchangeFull> {
  await simulateDelay();

  if (!input.reason.trim()) throw new ApiError('Reason is required.', 'RE_REASON_REQUIRED');
  if (!input.items.length)  throw new ApiError('Select at least one item.', 'RE_NO_ITEMS');

  // Calculate refund amount for type='refund'
  let refundAmount = 0;
  if (input.type === 'refund') {
    refundAmount = input.items.reduce((sum, item) => {
      const oli = db.order_line_items.find(li => li.id === item.order_line_item_id);
      return sum + (oli?.agent_price_snapshot ?? 0) * item.return_quantity;
    }, 0);
  }

  const re: RefundExchange = {
    id:               nextId(db.refund_exchanges),
    order_id:         input.order_id,
    type:             input.type,
    status:           'pending',
    reason:           input.reason.trim(),
    refund_amount:    refundAmount,
    processed_by:     null,
    processed_at:     null,
    rejection_reason: null,
    created_at:       now(),
  };
  db.refund_exchanges.push(re);

  const items: RefundExchangeLineItem[] = input.items.map(item => ({
    id:                    nextId(db.refund_exchange_items),
    refund_exchange_id:    re.id,
    order_line_item_id:    item.order_line_item_id,
    product_id:            item.product_id,
    return_quantity:       item.return_quantity,
    exchange_product_id:   item.exchange_product_id ?? null,
    exchange_quantity:     item.exchange_quantity ?? null,
  }));
  db.refund_exchange_items.push(...items);

  return buildFull(re);
}

export async function approveRefundExchange(id: number, actorId: number): Promise<RefundExchangeFull> {
  await simulateDelay();
  const idx = db.refund_exchanges.findIndex(r => r.id === id);
  if (idx === -1) throw new ApiError('Not found.', 'RE_NOT_FOUND', 404);
  if (db.refund_exchanges[idx].status !== 'pending') {
    throw new ApiError('Only pending requests can be approved.', 'RE_INVALID_STATUS');
  }
  db.refund_exchanges[idx] = {
    ...db.refund_exchanges[idx],
    status:       'approved',
    processed_by: actorId,
    processed_at: now(),
  };
  return buildFull(db.refund_exchanges[idx]);
}

export async function completeRefundExchange(id: number, actorId: number): Promise<RefundExchangeFull> {
  await simulateDelay();
  const idx = db.refund_exchanges.findIndex(r => r.id === id);
  if (idx === -1) throw new ApiError('Not found.', 'RE_NOT_FOUND', 404);
  if (db.refund_exchanges[idx].status !== 'approved') {
    throw new ApiError('Only approved requests can be completed.', 'RE_INVALID_STATUS');
  }
  db.refund_exchanges[idx] = {
    ...db.refund_exchanges[idx],
    status:       'completed',
    processed_by: actorId,
    processed_at: now(),
  };
  return buildFull(db.refund_exchanges[idx]);
}

export async function rejectRefundExchange(
  id: number,
  actorId: number,
  rejectionReason: string,
): Promise<RefundExchangeFull> {
  await simulateDelay();
  if (!rejectionReason.trim()) throw new ApiError('Rejection reason is required.', 'RE_REASON_REQUIRED');
  const idx = db.refund_exchanges.findIndex(r => r.id === id);
  if (idx === -1) throw new ApiError('Not found.', 'RE_NOT_FOUND', 404);
  if (!['pending', 'approved'].includes(db.refund_exchanges[idx].status)) {
    throw new ApiError('Cannot reject a completed or already rejected request.', 'RE_INVALID_STATUS');
  }
  db.refund_exchanges[idx] = {
    ...db.refund_exchanges[idx],
    status:           'rejected',
    rejection_reason: rejectionReason.trim(),
    processed_by:     actorId,
    processed_at:     now(),
  };
  return buildFull(db.refund_exchanges[idx]);
}
