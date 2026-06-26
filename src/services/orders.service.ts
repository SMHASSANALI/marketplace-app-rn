/**
 * Orders service.
 *
 * Central service for the entire order lifecycle — creation, status
 * transitions, and queries (with full joins, matching real API responses).
 *
 * ─────────────────────────────────────────────────────────────────────────
 * BACKEND INTEGRATION: replace mock implementations with real API calls.
 * ─────────────────────────────────────────────────────────────────────────
 */

import { ApiError, Customer, Order, OrderFull, OrderStatus, PaymentMethod, PaymentStatus } from '@/types';
import { db, nextId, now }                                        from '@/mock/db';
import { simulateDelay }                                          from '@/mock/delay';
import { getHoldInfo, generateOrderCode }                         from '@/lib/utils';
import { calculateBandForCoords }                                 from './delivery.service';

// ---------------------------------------------------------------------------
// Internal helper — builds a fully-joined OrderFull from raw order ID
// ---------------------------------------------------------------------------

function buildOrderFull(order: Order): OrderFull {
  const customer = db.customers.find(c => c.id === order.customer_id)!;
  const address  = order.customer_address_id
    ? db.customer_addresses.find(a => a.id === order.customer_address_id) ?? null
    : null;
  const agent    = db.users.find(u => u.id === order.agent_id)!;
  const rider    = order.rider_id ? db.users.find(u => u.id === order.rider_id) ?? null : null;

  const rawItems = db.order_line_items.filter(i => i.order_id === order.id);
  const line_items = rawItems.map(item => {
    const product = db.products.find(p => p.id === item.product_id);
    return {
      ...item,
      product_name:  product?.name  ?? 'Unknown',
      product_emoji: product?.image_emoji ?? '📦',
    };
  });

  const fulfilledItems = line_items.filter(i => i.fulfilled);
  const subtotal        = fulfilledItems.reduce((s, i) => s + i.selling_price_snapshot * i.quantity, 0);
  const total           = subtotal + order.delivery_fee_snapshot;
  const commission_total= fulfilledItems.reduce((s, i) => s + i.commission_amount, 0);

  const payment_receipt = db.payment_receipts.find(r => r.order_id === order.id) ?? null;
  const hold_info       = order.status === 'delivered' && order.delivered_at
    ? getHoldInfo(order.delivered_at)
    : null;

  return {
    ...order,
    customer, address, agent, rider,
    line_items, subtotal, total, commission_total,
    payment_receipt, hold_info,
  };
}

// ---------------------------------------------------------------------------
// Query functions
// ---------------------------------------------------------------------------

/** Filters accepted by getOrders(). */
export interface GetOrdersFilter {
  agentId?:        number;
  riderId?:        number;
  status?:         OrderStatus;
  paymentMethod?:  PaymentMethod;
  paymentStatus?:  PaymentStatus;
}

/**
 * Returns a list of fully-joined orders, optionally filtered.
 * Results are sorted by creation date descending (newest first).
 */
export async function getOrders(filter: GetOrdersFilter = {}): Promise<OrderFull[]> {
  await simulateDelay();

  // ── MOCK ─────────────────────────────────────────────────────────────────
  let results = [...db.orders];
  if (filter.agentId)       results = results.filter(o => o.agent_id        === filter.agentId);
  if (filter.riderId)       results = results.filter(o => o.rider_id        === filter.riderId);
  if (filter.status)        results = results.filter(o => o.status          === filter.status);
  if (filter.paymentMethod) results = results.filter(o => o.payment_method  === filter.paymentMethod);
  if (filter.paymentStatus) results = results.filter(o => o.payment_status  === filter.paymentStatus);

  return results
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map(buildOrderFull);
  // ── END MOCK ─────────────────────────────────────────────────────────────
}

/**
 * Returns a single fully-joined order by ID.
 * @throws ApiError(404) if the order does not exist.
 */
export async function getOrderById(id: number): Promise<OrderFull> {
  await simulateDelay(80, 200);

  // ── MOCK ─────────────────────────────────────────────────────────────────
  const order = db.orders.find(o => o.id === id);
  if (!order) throw new ApiError(`Order #${id} not found.`, 'ORDER_NOT_FOUND', 404);
  return buildOrderFull(order);
  // ── END MOCK ─────────────────────────────────────────────────────────────
}

// ---------------------------------------------------------------------------
// Create order
// ---------------------------------------------------------------------------

/** A single line item in the order creation request. */
export interface CreateOrderLineItemInput {
  product_id:    number;
  quantity:      number;
  selling_price: number; // must be >= product.base_price
}

/** Input required to create a new order. */
export interface CreateOrderInput {
  customer_id:         number;
  customer_address_id: number;
  agent_id:            number;
  items:               CreateOrderLineItemInput[];
  payment_method:      PaymentMethod;
  /** File name of uploaded receipt — required for prepaid orders. */
  receipt_file_name?:  string;
}

/** Result returned after order creation. */
export interface CreateOrderResult {
  order:          OrderFull;
  excluded_items: Array<{ product_id: number; reason: string }>;
}

/**
 * Creates a new order with stock validation and partial fulfillment support.
 *
 * Process:
 *  1. Check stock for every line item.
 *  2. Exclude items with insufficient stock (partial fulfillment, FR-4.4).
 *  3. Validate selling prices are >= base price (FR-2.3).
 *  4. Calculate delivery band from the customer's address coordinates.
 *  5. Insert order, line items (both fulfilled and excluded), and status log.
 *  6. Decrement stock for fulfilled items.
 *  7. Insert payment receipt record for prepaid orders.
 *
 * @throws ApiError if no items can be fulfilled, or receipt missing for prepaid.
 */
export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  await simulateDelay(300, 600); // slightly longer — simulates a DB transaction

  // ── MOCK ─────────────────────────────────────────────────────────────────

  // 1 & 2 — Stock check and partial fulfillment partition
  const fulfilled:  typeof input.items = [];
  const excluded:   Array<{ product_id: number; reason: string }> = [];

  for (const item of input.items) {
    const product = db.products.find(p => p.id === item.product_id && p.is_active);
    if (!product) {
      excluded.push({ product_id: item.product_id, reason: 'Product not found or inactive.' });
      continue;
    }
    if (item.selling_price < product.base_price) {
      excluded.push({
        product_id: item.product_id,
        reason: `Selling price (Rs ${item.selling_price}) is below base price (Rs ${product.base_price}).`,
      });
      continue;
    }
    if (product.qty_available < item.quantity) {
      excluded.push({
        product_id: item.product_id,
        reason: `Only ${product.qty_available} in stock, ${item.quantity} requested.`,
      });
      continue;
    }
    fulfilled.push(item);
  }

  if (fulfilled.length === 0) {
    throw new ApiError(
      'No items could be fulfilled. Check stock levels and selling prices.',
      'ORDER_NO_FULFILLABLE_ITEMS',
    );
  }

  if (input.payment_method === 'prepaid' && !input.receipt_file_name) {
    throw new ApiError(
      'A payment receipt is required for prepaid orders.',
      'ORDER_RECEIPT_REQUIRED',
    );
  }

  // 3 — Delivery band calculation
  const address = db.customer_addresses.find(a => a.id === input.customer_address_id);
  const { band } = await calculateBandForCoords(
    address?.latitude  ?? null,
    address?.longitude ?? null,
  );

  // 4 — Insert order
  const orderId    = nextId(db.orders);
  const orderCode  = generateOrderCode(orderId);
  const order: Order = {
    id:                    orderId,
    order_code:            orderCode,
    customer_id:           input.customer_id,
    customer_address_id:   input.customer_address_id,
    agent_id:              input.agent_id,
    delivery_band_id:      band?.id ?? null,
    delivery_fee_snapshot: band?.delivery_fee ?? 0,
    rider_payout_snapshot: null, // set when Rider is assigned
    payment_method:        input.payment_method,
    payment_status:        input.payment_method === 'prepaid' ? 'receipt_pending' : 'unpaid',
    status:                'pending',
    rider_id:              null,
    delivered_at:          null,
    created_at:            now(),
  };
  db.orders.push(order);

  // 5 — Insert line items
  for (const item of fulfilled) {
    const product = db.products.find(p => p.id === item.product_id)!;
    const commission = (item.selling_price - product.base_price) * item.quantity;
    db.order_line_items.push({
      id:                    nextId(db.order_line_items),
      order_id:              orderId,
      product_id:            item.product_id,
      quantity:              item.quantity,
      base_price_snapshot:   product.base_price,
      selling_price_snapshot:item.selling_price,
      commission_amount:     commission,
      fulfilled:             true,
      exclusion_reason:      null,
    });
    // 6 — Decrement stock
    const pIdx = db.products.findIndex(p => p.id === item.product_id);
    db.products[pIdx].qty_available -= item.quantity;
  }

  // Record excluded items for audit trail
  for (const ex of excluded) {
    const product = db.products.find(p => p.id === ex.product_id);
    db.order_line_items.push({
      id:                    nextId(db.order_line_items),
      order_id:              orderId,
      product_id:            ex.product_id,
      quantity:              input.items.find(i => i.product_id === ex.product_id)?.quantity ?? 0,
      base_price_snapshot:   product?.base_price ?? 0,
      selling_price_snapshot:input.items.find(i => i.product_id === ex.product_id)?.selling_price ?? 0,
      commission_amount:     0,
      fulfilled:             false,
      exclusion_reason:      ex.reason,
    });
  }

  // Status log entry
  db.order_status_logs.push({
    id:          nextId(db.order_status_logs),
    order_id:    orderId,
    from_status: null,
    to_status:   'pending',
    actor_id:    input.agent_id,
    reason:      'Order created by agent',
    timestamp:   now(),
  });

  // 7 — Payment receipt for prepaid
  if (input.payment_method === 'prepaid' && input.receipt_file_name) {
    db.payment_receipts.push({
      id:                  nextId(db.payment_receipts),
      order_id:            orderId,
      file_name:           input.receipt_file_name,
      storage_path:        null,
      uploaded_by:         input.agent_id,
      uploaded_at:         now(),
      verification_status: 'pending',
      verified_by:         null,
      verified_at:         null,
      rejection_comment:   null,
    });
  }

  return { order: buildOrderFull(order), excluded_items: excluded };
  // ── END MOCK ─────────────────────────────────────────────────────────────
}

// ---------------------------------------------------------------------------
// Status transitions
// ---------------------------------------------------------------------------

/**
 * Advances an order's status and appends a row to the status log.
 * Enforces the allowed status transition graph.
 *
 * @throws ApiError if the transition is invalid.
 */
export async function updateOrderStatus(
  orderId:   number,
  toStatus:  OrderStatus,
  actorId:   number,
  reason?:   string,
): Promise<OrderFull> {
  await simulateDelay();

  // ── MOCK ─────────────────────────────────────────────────────────────────
  const idx = db.orders.findIndex(o => o.id === orderId);
  if (idx === -1) throw new ApiError(`Order #${orderId} not found.`, 'ORDER_NOT_FOUND', 404);

  const order       = db.orders[idx];
  const fromStatus  = order.status;

  // Allowed transitions
  const allowed: Partial<Record<OrderStatus, OrderStatus[]>> = {
    pending:          ['confirmed', 'cancelled'],
    confirmed:        ['assigned', 'cancelled'],
    assigned:         ['out_for_delivery', 'cancelled'],
    out_for_delivery: ['delivered', 'returned'],
    delivered:        ['returned'],
  };
  if (!allowed[fromStatus]?.includes(toStatus)) {
    throw new ApiError(
      `Cannot transition from '${fromStatus}' to '${toStatus}'.`,
      'ORDER_INVALID_TRANSITION',
    );
  }

  // Set delivered_at when order is delivered — starts the commission hold
  const deliveredAt = toStatus === 'delivered' ? now() : order.delivered_at;

  db.orders[idx] = { ...order, status: toStatus, delivered_at: deliveredAt };
  db.order_status_logs.push({
    id:          nextId(db.order_status_logs),
    order_id:    orderId,
    from_status: fromStatus,
    to_status:   toStatus,
    actor_id:    actorId,
    reason:      reason ?? null,
    timestamp:   now(),
  });

  return buildOrderFull(db.orders[idx]);
  // ── END MOCK ─────────────────────────────────────────────────────────────
}

/**
 * Re-uploads a receipt for a prepaid order that had its receipt rejected.
 * Replaces the previous receipt record and resets payment_status to 'receipt_pending'.
 *
 * @throws ApiError if order not found or is not a prepaid order.
 */
export async function reuploadReceipt(
  orderId:  number,
  fileName: string,
  agentId:  number,
): Promise<OrderFull> {
  await simulateDelay();

  // ── MOCK ─────────────────────────────────────────────────────────────────
  const idx = db.orders.findIndex(o => o.id === orderId);
  if (idx === -1) throw new ApiError(`Order #${orderId} not found.`, 'ORDER_NOT_FOUND', 404);

  const order = db.orders[idx];
  if (order.payment_method !== 'prepaid') {
    throw new ApiError(
      'Receipt upload only applies to prepaid orders.',
      'ORDER_RECEIPT_NOT_APPLICABLE',
    );
  }

  // Remove previous receipt
  const oldIdx = db.payment_receipts.findIndex(r => r.order_id === orderId);
  if (oldIdx >= 0) db.payment_receipts.splice(oldIdx, 1);

  // Insert fresh receipt
  db.payment_receipts.push({
    id:                  nextId(db.payment_receipts),
    order_id:            orderId,
    file_name:           fileName,
    storage_path:        null,
    uploaded_by:         agentId,
    uploaded_at:         now(),
    verification_status: 'pending',
    verified_by:         null,
    verified_at:         null,
    rejection_comment:   null,
  });

  // Reset payment status
  db.orders[idx] = { ...order, payment_status: 'receipt_pending' };
  return buildOrderFull(db.orders[idx]);
  // ── END MOCK ─────────────────────────────────────────────────────────────
}

/**
 * Verifies a prepaid receipt — marks it as verified and sets
 * order payment_status to 'receipt_verified'.
 *
 * @throws ApiError if the order or receipt is not found.
 */
export async function verifyReceipt(orderId: number, actorId: number): Promise<OrderFull> {
  await simulateDelay();

  // ── MOCK ─────────────────────────────────────────────────────────────────
  const orderIdx = db.orders.findIndex(o => o.id === orderId);
  if (orderIdx === -1) throw new ApiError(`Order #${orderId} not found.`, 'ORDER_NOT_FOUND', 404);

  const receiptIdx = db.payment_receipts.findIndex(r => r.order_id === orderId);
  if (receiptIdx === -1) throw new ApiError('No receipt found for this order.', 'RECEIPT_NOT_FOUND', 404);

  db.payment_receipts[receiptIdx] = {
    ...db.payment_receipts[receiptIdx],
    verification_status: 'verified',
    verified_by:         actorId,
    verified_at:         now(),
    rejection_comment:   null,
  };
  db.orders[orderIdx] = { ...db.orders[orderIdx], payment_status: 'receipt_verified' };
  return buildOrderFull(db.orders[orderIdx]);
  // ── END MOCK ─────────────────────────────────────────────────────────────
}

/**
 * Rejects a prepaid receipt with a mandatory comment.
 * Sets order payment_status to 'receipt_rejected' so the Agent sees it in their queue.
 *
 * @throws ApiError if the order or receipt is not found, or comment is empty.
 */
export async function rejectReceipt(
  orderId:  number,
  actorId:  number,
  comment:  string,
): Promise<OrderFull> {
  await simulateDelay();

  // ── MOCK ─────────────────────────────────────────────────────────────────
  if (!comment.trim()) {
    throw new ApiError('A rejection comment is required.', 'RECEIPT_COMMENT_REQUIRED');
  }

  const orderIdx = db.orders.findIndex(o => o.id === orderId);
  if (orderIdx === -1) throw new ApiError(`Order #${orderId} not found.`, 'ORDER_NOT_FOUND', 404);

  const receiptIdx = db.payment_receipts.findIndex(r => r.order_id === orderId);
  if (receiptIdx === -1) throw new ApiError('No receipt found for this order.', 'RECEIPT_NOT_FOUND', 404);

  db.payment_receipts[receiptIdx] = {
    ...db.payment_receipts[receiptIdx],
    verification_status: 'rejected',
    verified_by:         actorId,
    verified_at:         now(),
    rejection_comment:   comment.trim(),
  };
  db.orders[orderIdx] = { ...db.orders[orderIdx], payment_status: 'receipt_rejected' };
  return buildOrderFull(db.orders[orderIdx]);
  // ── END MOCK ─────────────────────────────────────────────────────────────
}

/**
 * Cancels an order and restores stock for all fulfilled line items.
 * Allowed from: pending, confirmed, assigned.
 *
 * @throws ApiError if the transition is not allowed or reason is empty.
 */
export async function cancelOrder(
  orderId:  number,
  reason:   string,
  actorId:  number,
): Promise<OrderFull> {
  if (!reason.trim()) {
    throw new ApiError('A cancellation reason is required.', 'CANCEL_REASON_REQUIRED');
  }

  // ── MOCK ─────────────────────────────────────────────────────────────────
  const idx = db.orders.findIndex(o => o.id === orderId);
  if (idx === -1) throw new ApiError(`Order #${orderId} not found.`, 'ORDER_NOT_FOUND', 404);

  const CANCELLABLE: OrderStatus[] = ['pending', 'confirmed', 'assigned'];
  if (!CANCELLABLE.includes(db.orders[idx].status)) {
    throw new ApiError(
      `Cannot cancel an order in '${db.orders[idx].status}' status.`,
      'ORDER_INVALID_TRANSITION',
    );
  }

  // Restore stock for all fulfilled items
  const lineItems = db.order_line_items.filter(i => i.order_id === orderId && i.fulfilled);
  for (const item of lineItems) {
    const pIdx = db.products.findIndex(p => p.id === item.product_id);
    if (pIdx !== -1) db.products[pIdx].qty_available += item.quantity;
  }

  return updateOrderStatus(orderId, 'cancelled', actorId, reason.trim());
  // ── END MOCK ─────────────────────────────────────────────────────────────
}

/**
 * Confirms a pending order (Pending → Confirmed).
 * Blocked when a prepaid order's receipt has been rejected — the agent must
 * re-upload a clean receipt before the order can be confirmed.
 *
 * @throws ApiError if the order is not in 'pending' status, or if the receipt is rejected.
 */
export async function confirmOrder(orderId: number, actorId: number): Promise<OrderFull> {
  // ── MOCK ─────────────────────────────────────────────────────────────────
  const order = db.orders.find(o => o.id === orderId);
  if (!order) throw new ApiError(`Order #${orderId} not found.`, 'ORDER_NOT_FOUND', 404);

  if (order.payment_status === 'receipt_rejected') {
    throw new ApiError(
      'This order has a rejected receipt. The agent must re-upload a valid receipt before it can be confirmed.',
      'ORDER_RECEIPT_REJECTED',
    );
  }
  // ── END MOCK ─────────────────────────────────────────────────────────────
  return updateOrderStatus(orderId, 'confirmed', actorId, 'Confirmed by owner');
}

/**
 * Assigns a Rider to an order and snapshots their payout.
 * Sets order status to 'assigned'.
 *
 * @throws ApiError if the order is not in 'confirmed' status.
 */
export async function assignRider(
  orderId: number,
  riderId: number,
  actorId: number,
): Promise<OrderFull> {
  await simulateDelay();

  // ── MOCK ─────────────────────────────────────────────────────────────────
  const idx = db.orders.findIndex(o => o.id === orderId);
  if (idx === -1) throw new ApiError(`Order #${orderId} not found.`, 'ORDER_NOT_FOUND', 404);

  const order = db.orders[idx];
  if (order.status !== 'confirmed') {
    throw new ApiError('Rider can only be assigned to a confirmed order.', 'ORDER_INVALID_TRANSITION');
  }

  // Snapshot rider payout from the relevant delivery band
  const band = order.delivery_band_id
    ? db.delivery_bands.find(b => b.id === order.delivery_band_id)
    : null;
  const riderPayout = band?.default_rider_payout ?? 0;

  db.orders[idx] = { ...order, rider_id: riderId, rider_payout_snapshot: riderPayout };
  return updateOrderStatus(orderId, 'assigned', actorId);
  // ── END MOCK ─────────────────────────────────────────────────────────────
}

// ---------------------------------------------------------------------------
// Status log
// ---------------------------------------------------------------------------

export interface OrderStatusLogFull {
  id:          number;
  order_id:    number;
  from_status: OrderStatus | null;
  to_status:   OrderStatus;
  actor_name:  string;
  reason:      string | null;
  timestamp:   string;
}

export async function getOrderStatusLogs(orderId: number): Promise<OrderStatusLogFull[]> {
  await simulateDelay(50, 150);
  return db.order_status_logs
    .filter(l => l.order_id === orderId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map(l => ({
      ...l,
      actor_name: db.users.find(u => u.id === l.actor_id)?.name ?? `User #${l.actor_id}`,
    }));
}

// ---------------------------------------------------------------------------
// Customer order history
// ---------------------------------------------------------------------------

export interface CustomerHistory {
  customer: Customer;
  orders:   OrderFull[];
}

export async function getCustomerHistory(customerId: number): Promise<CustomerHistory> {
  await simulateDelay();
  const customer = db.customers.find(c => c.id === customerId);
  if (!customer) throw new ApiError(`Customer #${customerId} not found.`, 'CUSTOMER_NOT_FOUND', 404);
  const orders = db.orders
    .filter(o => o.customer_id === customerId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map(buildOrderFull);
  return { customer, orders };
}
