/**
 * Seed data — Orders, line items, status logs, and payment receipts.
 *
 * ORD-1001 — COD, delivered 9 days ago, commission hold elapsed → payable
 * ORD-1002 — Prepaid, delivered 3 days ago, commission still in hold
 * ORD-1003 — COD, out for delivery (no delivered_at yet)
 * ORD-1004 — Prepaid, pending, receipt rejected → agent must re-upload
 * ORD-1005 — COD, pending → owner can confirm immediately
 */
import { Order, OrderLineItem, OrderStatusLog, PaymentReceipt } from '@/types';
import { USER_IDS }    from './users';
import { CUSTOMER_IDS } from './customers';

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

const ORDER_DEFAULTS = {
  pickup_confirmed_at: null, pickup_confirmed_by: null, delivery_items_confirmed: false,
};

export const seedOrders: Order[] = [
  {
    id:                    1,
    order_code:            'ORD-1001',
    customer_id:           CUSTOMER_IDS.AYESHA,
    customer_address_id:   1,
    agent_id:              USER_IDS.AGENT_BILAL,
    delivery_band_id:      1,
    delivery_fee_snapshot: 200,
    rider_payout_snapshot: 70,
    payment_method:        'cod',
    payment_status:        'reconciled',  // deposit confirmed by owner; eligible for settlement
    status:                'delivered',
    rider_id:              USER_IDS.RIDER_IMRAN,
    delivered_at:          daysAgo(9),
    created_at:            daysAgo(10),
    pickup_confirmed_at:   daysAgo(9),
    pickup_confirmed_by:   USER_IDS.RIDER_IMRAN,
    delivery_items_confirmed: true,
  },
  {
    id:                    2,
    order_code:            'ORD-1002',
    customer_id:           CUSTOMER_IDS.HAMZA,
    customer_address_id:   2,
    agent_id:              USER_IDS.AGENT_SANA,
    delivery_band_id:      3,
    delivery_fee_snapshot: 350,
    rider_payout_snapshot: 130,
    payment_method:        'prepaid',
    payment_status:        'reconciled',
    status:                'delivered',
    rider_id:              USER_IDS.RIDER_TARIQ,
    delivered_at:          daysAgo(3),
    created_at:            daysAgo(5),
    pickup_confirmed_at:   daysAgo(3),
    pickup_confirmed_by:   USER_IDS.RIDER_TARIQ,
    delivery_items_confirmed: true,
  },
  {
    id:                    3,
    order_code:            'ORD-1003',
    customer_id:           CUSTOMER_IDS.SARA,
    customer_address_id:   3,
    agent_id:              USER_IDS.AGENT_BILAL,
    delivery_band_id:      2,
    delivery_fee_snapshot: 275,
    rider_payout_snapshot: 100,
    payment_method:        'cod',
    payment_status:        'unpaid',
    status:                'out_for_delivery',
    rider_id:              USER_IDS.RIDER_IMRAN,
    delivered_at:          null,
    created_at:            daysAgo(1),
    pickup_confirmed_at:   daysAgo(0),
    pickup_confirmed_by:   USER_IDS.RIDER_IMRAN,
    delivery_items_confirmed: false,
  },
  {
    id:                    4,
    order_code:            'ORD-1004',
    customer_id:           CUSTOMER_IDS.USMAN,
    customer_address_id:   4,
    agent_id:              USER_IDS.AGENT_BILAL,
    delivery_band_id:      2,
    delivery_fee_snapshot: 275,
    rider_payout_snapshot: null,
    payment_method:        'prepaid',
    payment_status:        'receipt_rejected',
    status:                'pending',
    rider_id:              null,
    delivered_at:          null,
    created_at:            daysAgo(2),
    ...ORDER_DEFAULTS,
  },
  {
    id:                    5,
    order_code:            'ORD-1005',
    customer_id:           CUSTOMER_IDS.AYESHA,
    customer_address_id:   1,
    agent_id:              USER_IDS.AGENT_SANA,
    delivery_band_id:      1,
    delivery_fee_snapshot: 200,
    rider_payout_snapshot: null,
    payment_method:        'cod',
    payment_status:        'unpaid',
    status:                'pending',
    rider_id:              null,
    delivered_at:          null,
    created_at:            daysAgo(0),
    ...ORDER_DEFAULTS,
  },
  {
    id:                    7,
    order_code:            'ORD-1007',
    customer_id:           CUSTOMER_IDS.HAMZA,
    customer_address_id:   2,
    agent_id:              USER_IDS.AGENT_SANA,
    delivery_band_id:      3,
    delivery_fee_snapshot: 350,
    rider_payout_snapshot: null,
    payment_method:        'cod',
    payment_status:        'unpaid',
    status:                'assigned',
    rider_id:              USER_IDS.RIDER_IMRAN,
    delivered_at:          null,
    created_at:            daysAgo(0),
    ...ORDER_DEFAULTS,
  },
  {
    id:                    6,
    order_code:            'ORD-1006',
    customer_id:           CUSTOMER_IDS.SARA,
    customer_address_id:   3,
    agent_id:              USER_IDS.AGENT_BILAL,
    delivery_band_id:      2,
    delivery_fee_snapshot: 275,
    rider_payout_snapshot: null,
    payment_method:        'prepaid',
    payment_status:        'receipt_pending',
    status:                'pending',
    rider_id:              null,
    delivered_at:          null,
    created_at:            daysAgo(0),
    ...ORDER_DEFAULTS,
  },
];

// ---------------------------------------------------------------------------
// Order line items
// ---------------------------------------------------------------------------

const LI_DEFAULTS = {
  quantity_picked_up: null, quantity_delivered: null,
  pickup_mismatch_flag: false, delivery_mismatch_flag: false,
};

export const seedOrderLineItems: OrderLineItem[] = [
  // ORD-1001: 1× Phone Case. buying=50, selling=90, agent charged=100 → commission=10, owner_profit=40
  { id: 1, order_id: 1, product_id: 1, quantity: 1,
    buying_price_snapshot: 50,   selling_price_snapshot: 90,   agent_price_snapshot: 100,
    commission_amount: 10,  owner_profit_amount: 40,  fulfilled: true, exclusion_reason: null, ...LI_DEFAULTS },
  // ORD-1002: 1× Earbuds. buying=1500, selling=1800, agent=2100 → commission=300, owner_profit=300
  { id: 2, order_id: 2, product_id: 2, quantity: 1,
    buying_price_snapshot: 1500, selling_price_snapshot: 1800, agent_price_snapshot: 2100,
    commission_amount: 300, owner_profit_amount: 300, fulfilled: true, exclusion_reason: null, ...LI_DEFAULTS },
  // ORD-1002: 2× Watch Strap. buying=350, selling=450, agent=500 → commission=100, owner_profit=200
  { id: 3, order_id: 2, product_id: 3, quantity: 2,
    buying_price_snapshot: 350,  selling_price_snapshot: 450,  agent_price_snapshot: 500,
    commission_amount: 100, owner_profit_amount: 200, fulfilled: true, exclusion_reason: null, ...LI_DEFAULTS },
  // ORD-1003: 1× Power Bank. buying=1000, selling=1200, agent=1350 → commission=150, owner_profit=200
  { id: 4, order_id: 3, product_id: 4, quantity: 1,
    buying_price_snapshot: 1000, selling_price_snapshot: 1200, agent_price_snapshot: 1350,
    commission_amount: 150, owner_profit_amount: 200, fulfilled: true, exclusion_reason: null, ...LI_DEFAULTS },
  // ORD-1004: 1× Bluetooth Speaker. buying=1200, selling=1500, agent=1800 → commission=300, owner_profit=300
  { id: 5, order_id: 4, product_id: 5, quantity: 1,
    buying_price_snapshot: 1200, selling_price_snapshot: 1500, agent_price_snapshot: 1800,
    commission_amount: 300, owner_profit_amount: 300, fulfilled: true, exclusion_reason: null, ...LI_DEFAULTS },
  // ORD-1005: 2× Phone Case. buying=50, selling=90, agent=110 → commission=40, owner_profit=80
  { id: 6, order_id: 5, product_id: 1, quantity: 2,
    buying_price_snapshot: 50,   selling_price_snapshot: 90,   agent_price_snapshot: 110,
    commission_amount: 40,  owner_profit_amount: 80,  fulfilled: true, exclusion_reason: null, ...LI_DEFAULTS },
  // ORD-1006: 1× Bluetooth Speaker. buying=1200, selling=1500, agent=1900 → commission=400, owner_profit=300
  { id: 7, order_id: 6, product_id: 5, quantity: 1,
    buying_price_snapshot: 1200, selling_price_snapshot: 1500, agent_price_snapshot: 1900,
    commission_amount: 400, owner_profit_amount: 300, fulfilled: true, exclusion_reason: null, ...LI_DEFAULTS },
  // ORD-1007: 1× Power Bank. buying=1000, selling=1200, agent=1350 → commission=150, owner_profit=200
  { id: 8, order_id: 7, product_id: 4, quantity: 1,
    buying_price_snapshot: 1000, selling_price_snapshot: 1200, agent_price_snapshot: 1350,
    commission_amount: 150, owner_profit_amount: 200, fulfilled: true, exclusion_reason: null, ...LI_DEFAULTS },
];

// ---------------------------------------------------------------------------
// Status logs
// ---------------------------------------------------------------------------

export const seedStatusLogs: OrderStatusLog[] = [
  { id: 1,  order_id: 1, from_status: null,              to_status: 'pending',          actor_id: USER_IDS.AGENT_BILAL, reason: 'Order created', timestamp: daysAgo(10) },
  { id: 2,  order_id: 1, from_status: 'pending',         to_status: 'confirmed',        actor_id: USER_IDS.OWNER,       reason: null,            timestamp: daysAgo(10) },
  { id: 3,  order_id: 1, from_status: 'confirmed',       to_status: 'assigned',         actor_id: USER_IDS.OWNER,       reason: null,            timestamp: daysAgo(10) },
  { id: 4,  order_id: 1, from_status: 'assigned',        to_status: 'out_for_delivery', actor_id: USER_IDS.RIDER_IMRAN, reason: null,            timestamp: daysAgo(9) },
  { id: 5,  order_id: 1, from_status: 'out_for_delivery',to_status: 'delivered',        actor_id: USER_IDS.RIDER_IMRAN, reason: null,            timestamp: daysAgo(9) },

  { id: 6,  order_id: 2, from_status: null,              to_status: 'pending',          actor_id: USER_IDS.AGENT_SANA,  reason: 'Order created', timestamp: daysAgo(5) },
  { id: 7,  order_id: 2, from_status: 'pending',         to_status: 'confirmed',        actor_id: USER_IDS.OWNER,       reason: null,            timestamp: daysAgo(5) },
  { id: 8,  order_id: 2, from_status: 'confirmed',       to_status: 'assigned',         actor_id: USER_IDS.OWNER,       reason: null,            timestamp: daysAgo(4) },
  { id: 9,  order_id: 2, from_status: 'assigned',        to_status: 'out_for_delivery', actor_id: USER_IDS.RIDER_TARIQ, reason: null,            timestamp: daysAgo(3) },
  { id: 10, order_id: 2, from_status: 'out_for_delivery',to_status: 'delivered',        actor_id: USER_IDS.RIDER_TARIQ, reason: null,            timestamp: daysAgo(3) },

  { id: 11, order_id: 3, from_status: null,              to_status: 'pending',          actor_id: USER_IDS.AGENT_BILAL, reason: 'Order created', timestamp: daysAgo(1) },
  { id: 12, order_id: 3, from_status: 'pending',         to_status: 'confirmed',        actor_id: USER_IDS.OWNER,       reason: null,            timestamp: daysAgo(1) },
  { id: 13, order_id: 3, from_status: 'confirmed',       to_status: 'assigned',         actor_id: USER_IDS.OWNER,       reason: null,            timestamp: daysAgo(1) },
  { id: 14, order_id: 3, from_status: 'assigned',        to_status: 'out_for_delivery', actor_id: USER_IDS.RIDER_IMRAN, reason: null,            timestamp: daysAgo(0) },

  { id: 15, order_id: 4, from_status: null,              to_status: 'pending',          actor_id: USER_IDS.AGENT_BILAL, reason: 'Order created', timestamp: daysAgo(2) },
  { id: 16, order_id: 5, from_status: null,              to_status: 'pending',          actor_id: USER_IDS.AGENT_SANA,  reason: 'Order created', timestamp: daysAgo(0) },
  { id: 17, order_id: 6, from_status: null,              to_status: 'pending',          actor_id: USER_IDS.AGENT_BILAL, reason: 'Order created', timestamp: daysAgo(0) },
  { id: 18, order_id: 7, from_status: null,              to_status: 'pending',          actor_id: USER_IDS.AGENT_SANA,  reason: 'Order created', timestamp: daysAgo(0) },
  { id: 19, order_id: 7, from_status: 'pending',         to_status: 'confirmed',        actor_id: USER_IDS.OWNER,       reason: null,            timestamp: daysAgo(0) },
];

// ---------------------------------------------------------------------------
// Payment receipts (only for prepaid orders)
// ---------------------------------------------------------------------------

export const seedPaymentReceipts: PaymentReceipt[] = [
  {
    id:                  1,
    order_id:            2,
    file_name:           'receipt_ord1002.jpg',
    storage_path:        null,
    uploaded_by:         USER_IDS.AGENT_SANA,
    uploaded_at:         daysAgo(5),
    verification_status: 'verified',
    verified_by:         USER_IDS.OWNER,
    verified_at:         daysAgo(5),
    rejection_comment:   null,
  },
  {
    id:                  2,
    order_id:            4,
    file_name:           'receipt_ord1004_attempt1.jpg',
    storage_path:        null,
    uploaded_by:         USER_IDS.AGENT_BILAL,
    uploaded_at:         daysAgo(2),
    verification_status: 'rejected',
    verified_by:         USER_IDS.OWNER,
    verified_at:         daysAgo(1),
    rejection_comment:   'Receipt is blurry and the amount is not readable. Please re-upload a clear image showing the full transaction details.',
  },
  {
    id:                  3,
    order_id:            6,
    file_name:           'receipt_ord1006.jpg',
    storage_path:        null,
    uploaded_by:         USER_IDS.AGENT_BILAL,
    uploaded_at:         daysAgo(0),
    verification_status: 'pending',
    verified_by:         null,
    verified_at:         null,
    rejection_comment:   null,
  },
];
