/**
 * Central type definitions for the Reseller Marketplace platform.
 *
 * These types mirror the database schema defined in the SRS v1.3 and serve as
 * the contract between the frontend and any backend implementation.
 *
 * Money convention: all monetary amounts are stored and computed as whole
 * integer rupees (e.g. 90 = Rs 90). Use formatCurrency() from lib/utils.ts
 * to display them.
 *
 * When the real backend is integrated, only the service layer (src/services/)
 * changes — these types remain the source of truth.
 */

// ---------------------------------------------------------------------------
// USERS & AUTH
// ---------------------------------------------------------------------------

/** The four authenticated roles in the platform. Customers have no account. */
export type UserRole = 'owner' | 'manager' | 'agent' | 'rider';

export interface User {
  id: number;
  name: string;
  phone: string;
  role: UserRole;
  status: 'active' | 'suspended';
  created_at: string; // ISO 8601
}

/** Individual permission key that can be granted to a Manager by the Owner. */
export type ManagerPermissionKey =
  | 'confirm_orders'
  | 'assign_riders'
  | 'verify_receipts'
  | 'confirm_deposits'
  | 'approve_settlements'
  | 'view_customer_history';

export interface ManagerPermission {
  id: number;
  user_id: number;
  permission_key: ManagerPermissionKey;
  granted_by: number; // Owner user id
  granted_at: string;
}

/** Returned by the auth service on successful login. */
export interface AuthSession {
  user: User;
  /** Opaque token — mock uses a simple string; real backend uses JWT. */
  token: string;
}

// ---------------------------------------------------------------------------
// PRODUCTS & INVENTORY
// ---------------------------------------------------------------------------

export interface Category {
  id: number;
  name: string;
  is_active: boolean;
  created_by: number;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  /** Emoji used as a product icon (e.g. "📱"). */
  image_emoji: string;
  category: string | null;
  category_id: number | null;
  /** Owner's cost in whole rupees — never shown to Agents. */
  buying_price: number;
  /** Owner's listed price — shown to Agents, this is their price floor. */
  selling_price: number;
  qty_available: number;
  /** Alert the Owner when stock falls at or below this threshold. */
  low_stock_threshold: number;
  is_active: boolean;
  owner_id: number;
  created_at: string;
  /** Local URIs or data-URIs of uploaded product images. Empty array if none. */
  images: string[];
}

// ---------------------------------------------------------------------------
// CUSTOMERS & ADDRESSES
// ---------------------------------------------------------------------------

export interface Customer {
  id: number;
  /** Normalised E.164-style phone number (e.g. "923001234567"). Primary search key. */
  phone_number: string;
  name: string;
  created_at: string;
}

export interface CustomerAddress {
  id: number;
  customer_id: number;
  /** Free-text / landmark-style address as entered by the Agent. */
  address_text: string;
  /** Optional label (e.g. "Home", "Office"). */
  label: string | null;
  latitude: number | null;
  longitude: number | null;
  /** Pre-calculated straight-line km from the delivery origin. */
  distance_km: number | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// DELIVERY BANDS
// ---------------------------------------------------------------------------

export interface DeliveryOrigin {
  id: number;
  label: string;
  latitude: number;
  longitude: number;
  is_active: boolean;
}

export interface DeliveryBand {
  id: number;
  name: string;
  min_distance_km: number;
  /** null means "and above" (open-ended upper bound). */
  max_distance_km: number | null;
  /** Customer-facing delivery fee in whole rupees. */
  delivery_fee: number;
  /** Default payout to the Rider for this band, in whole rupees. */
  default_rider_payout: number;
  is_active: boolean;
  sort_order: number;
}

// ---------------------------------------------------------------------------
// ORDERS
// ---------------------------------------------------------------------------

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'assigned'
  | 'out_for_delivery'
  | 'delivered'
  | 'returned'
  | 'cancelled';

export type PaymentMethod = 'cod' | 'prepaid';

export type PaymentStatus =
  | 'unpaid'
  | 'receipt_pending'   // Prepaid: receipt uploaded, awaiting Owner review
  | 'receipt_verified'  // Prepaid: receipt approved by Owner
  | 'receipt_rejected'  // Prepaid: receipt rejected — order returned to Agent queue
  | 'collected'         // COD: cash collected by Rider
  | 'deposited'         // COD: Rider has deposited cash to Owner
  | 'reconciled';       // Both paths: Owner confirmed payment complete

export interface Order {
  id: number;
  order_code: string;
  customer_id: number;
  customer_address_id: number | null;
  agent_id: number;
  delivery_band_id: number | null;
  /** Delivery fee snapshotted at order creation; never recalculated retroactively. */
  delivery_fee_snapshot: number;
  /** Rider payout snapshotted when Rider is assigned. */
  rider_payout_snapshot: number | null;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  status: OrderStatus;
  rider_id: number | null;
  /** Timestamp when status changed to 'delivered'. Starts the 7-day commission hold. */
  delivered_at: string | null;
  created_at: string;
  /** Feature 1: set when Rider confirms pickup, before moving to out_for_delivery. */
  pickup_confirmed_at: string | null;
  pickup_confirmed_by: number | null;
  /** Feature 1: true once Rider completes the delivery item confirmation step. */
  delivery_items_confirmed: boolean;
}

export interface OrderLineItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  /** Owner's cost at order time — for Owner profit calculation only, never shown to Agents. */
  buying_price_snapshot: number;
  /** Owner's listed price at order time — Agent's price floor. */
  selling_price_snapshot: number;
  /** What the Agent actually charged the Customer. Must be >= selling_price_snapshot. */
  agent_price_snapshot: number;
  /** (agent_price_snapshot - selling_price_snapshot) × effective_quantity. */
  commission_amount: number;
  /** (selling_price_snapshot - buying_price_snapshot) × effective_quantity. Owner-only. */
  owner_profit_amount: number;
  /** false if item was excluded due to insufficient stock (partial fulfillment). */
  fulfilled: boolean;
  exclusion_reason: string | null;
  /** Feature 1: quantity Rider confirmed picking up from Owner. */
  quantity_picked_up: number | null;
  /** Feature 1: quantity Rider confirmed delivering to Customer. */
  quantity_delivered: number | null;
  /** Feature 1: true if quantity_picked_up < quantity. */
  pickup_mismatch_flag: boolean;
  /** Feature 1: true if quantity_delivered < quantity_picked_up (or quantity if pickup not confirmed). */
  delivery_mismatch_flag: boolean;
}

export interface OrderStatusLog {
  id: number;
  order_id: number;
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  actor_id: number;
  reason: string | null;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// PAYMENTS & RECEIPTS
// ---------------------------------------------------------------------------

export interface PaymentReceipt {
  id: number;
  order_id: number;
  file_name: string | null;
  /** Path in cloud storage (Supabase Storage bucket). Null until backend integrated. */
  storage_path: string | null;
  uploaded_by: number;
  uploaded_at: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  verified_by: number | null;
  verified_at: string | null;
  /** Required when verification_status = 'rejected'. Shown to Agent in their queue. */
  rejection_comment: string | null;
}

export interface CashCollection {
  id: number;
  order_id: number;
  rider_id: number;
  /** Set when the rider logs a deposit batch. Null until deposited. */
  deposit_id: number | null;
  amount_collected: number;
  /** true if amount_collected !== (order subtotal + delivery fee). */
  mismatch_flag: boolean;
  reconciled: boolean;
  reconciled_at: string | null;
}

export interface CashDeposit {
  id: number;
  rider_id: number;
  deposit_amount: number;
  deposit_reference: string | null;
  deposited_at: string;
  owner_confirmed: boolean;
  owner_confirmed_at: string | null;
}

/** Settlement enriched with agent info and resolved line-item details. */
export interface SettlementFull extends Settlement {
  agent: User;
  line_items: (SettlementLineItem & {
    order_code:             string;
    product_name:           string;
    product_emoji:          string;
    quantity:               number;
    agent_price_snapshot:   number;
    selling_price_snapshot: number;
    buying_price_snapshot:  number;
  })[];
}

/** Per-order commission status as seen by an Agent. */
export type CommissionStatus =
  | 'in_hold'                  // 7-day hold not yet elapsed
  | 'awaiting_reconciliation'  // hold elapsed but payment not reconciled
  | 'eligible'                 // hold elapsed + reconciled + not yet settled
  | 'in_settlement'            // included in a pending/approved settlement
  | 'paid';                    // settlement marked paid

export interface AgentOrderCommission {
  order_id:          number;
  order_code:        string;
  delivered_at:      string | null;
  commission_total:  number;
  commission_status: CommissionStatus;
  hold_info:         CommissionHoldInfo | null;
  settlement_id?:    number;
  settlement_status?: SettlementStatus;
}

/** CashDeposit enriched with rider info and matched collection rows. */
export interface DepositFull extends CashDeposit {
  rider: User;
  collections: (CashCollection & {
    order_code: string;
    /** subtotal + delivery_fee_snapshot for the order. */
    expected_total: number;
  })[];
}

// ---------------------------------------------------------------------------
// SETTLEMENTS & LEDGER
// ---------------------------------------------------------------------------

export type SettlementStatus = 'pending' | 'approved' | 'paid' | 'confirmed';

export interface Settlement {
  id: number;
  agent_id: number;
  period_start: string;
  period_end: string;
  total_commission: number;
  status: SettlementStatus;
  /** 'scheduled' = weekly cron; 'manual' = Owner-triggered on-demand run. */
  triggered_by: 'scheduled' | 'manual';
  created_at: string;
  /** Local URI or data-URI of the payment proof screenshot uploaded by the Owner. */
  payment_receipt_uri: string | null;
  /** Feature 3: two-sided payment record. */
  paid_at: string | null;
  paid_by: number | null;
  payment_reference: string | null;
  acknowledged_at: string | null;
  dispute_comment: string | null;
}

export interface SettlementLineItem {
  id: number;
  settlement_id: number;
  order_line_item_id: number;
  commission_amount: number;
}

/** Feature 3: Rider payout settlement. */
export interface RiderSettlement {
  id: number;
  rider_id: number;
  period_start: string;
  period_end: string;
  total_payout: number;
  status: SettlementStatus;
  triggered_by: 'scheduled' | 'manual';
  created_at: string;
  paid_at: string | null;
  paid_by: number | null;
  payment_reference: string | null;
  acknowledged_at: string | null;
  dispute_comment: string | null;
}

export interface RiderSettlementLineItem {
  id: number;
  rider_settlement_id: number;
  order_id: number;
  payout_amount: number;
}

export interface RiderSettlementFull extends RiderSettlement {
  rider: User;
  line_items: (RiderSettlementLineItem & { order_code: string })[];
}

export interface LedgerEntry {
  id: number;
  entity_type: 'agent' | 'rider' | 'owner';
  entity_id: number;
  amount: number;
  direction: 'credit' | 'debit';
  reference_order_id: number | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// RICH / JOINED TYPES (returned by API — avoid N+1 fetches on client)
// ---------------------------------------------------------------------------

/**
 * A fully-joined order as returned by the API.
 * Includes customer, agent, rider, line items with product info, and
 * computed financial totals so the UI never has to recalculate them.
 */
export interface OrderFull extends Order {
  customer: Customer;
  address: CustomerAddress | null;
  agent: User;
  rider: User | null;
  /** Line items enriched with the product name and emoji. */
  line_items: (OrderLineItem & {
    product_name: string;
    product_emoji: string;
  })[];
  payment_receipt: PaymentReceipt | null;
  /** Sum of agent_price_snapshot × effective_quantity for fulfilled items only. */
  subtotal: number;
  /** subtotal + delivery_fee_snapshot. */
  total: number;
  /** Sum of commission_amount for fulfilled items only. */
  commission_total: number;
  /** Sum of owner_profit_amount for fulfilled items only. Owner-only. */
  owner_profit_total: number;
  /** Non-null only when status === 'delivered'. Describes hold period state. */
  hold_info: CommissionHoldInfo | null;
}

/** Describes where an order's commission sits in the 7-day hold period. */
export interface CommissionHoldInfo {
  /** Calendar days elapsed since delivery. */
  elapsed_days: number;
  /** Calendar days remaining in hold (0 means hold has elapsed). */
  remaining_days: number;
  /** true when remaining_days === 0 and commission is eligible for settlement. */
  eligible: boolean;
  /** ISO date string when the hold ends / ended. */
  hold_ends_at: string;
}

// ---------------------------------------------------------------------------
// API LAYER
// ---------------------------------------------------------------------------

/** Standard error shape thrown by all service functions. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Pagination parameters accepted by list endpoints. */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/** Generic paginated response wrapper. */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
