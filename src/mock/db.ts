/**
 * In-memory database for the mock API layer.
 *
 * This module is a singleton that holds all app data in RAM, seeded with
 * realistic data on module load. All service functions read from and write
 * to this object — making the mock behave exactly like a stateful backend.
 *
 * Lifecycle:
 *  - Data persists as long as the app process runs.
 *  - Data resets to the seed state on every full app reload.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * BACKEND INTEGRATION NOTE
 * When the real backend is ready, delete this file entirely. The service
 * functions (src/services/*.ts) will be updated to call the real API instead
 * of importing from here.
 * ─────────────────────────────────────────────────────────────────────────
 */

import { seedUsers }               from './seed/users';
import { seedProducts }            from './seed/products';
import { seedCategories }          from './seed/categories';
import { seedCustomers, seedCustomerAddresses } from './seed/customers';
import { seedDeliveryOrigin, seedDeliveryBands } from './seed/delivery';
import {
  seedOrders,
  seedOrderLineItems,
  seedStatusLogs,
  seedPaymentReceipts,
} from './seed/orders';
import { seedCashCollections, seedCashDeposits } from './seed/cash';
import { seedManagerPermissions }               from './seed/managers';

import type {
  User, Product, Category, Customer, CustomerAddress,
  DeliveryOrigin, DeliveryBand,
  Order, OrderLineItem, OrderStatusLog, PaymentReceipt,
  CashCollection, CashDeposit,
  Settlement, SettlementLineItem,
  RiderSettlement, RiderSettlementLineItem,
  ManagerPermission,
} from '@/types';

/**
 * The in-memory store. Each table is a mutable array.
 * Deep-clone the seed arrays so the originals remain untouched on hot-reload.
 */
export const db = {
  users:                  JSON.parse(JSON.stringify(seedUsers))              as User[],
  products:               JSON.parse(JSON.stringify(seedProducts))           as Product[],
  categories:             JSON.parse(JSON.stringify(seedCategories))         as Category[],
  customers:              JSON.parse(JSON.stringify(seedCustomers))          as Customer[],
  customer_addresses:     JSON.parse(JSON.stringify(seedCustomerAddresses))  as CustomerAddress[],
  delivery_origin:        JSON.parse(JSON.stringify([seedDeliveryOrigin]))   as DeliveryOrigin[],
  delivery_bands:         JSON.parse(JSON.stringify(seedDeliveryBands))      as DeliveryBand[],
  orders:                 JSON.parse(JSON.stringify(seedOrders))             as Order[],
  order_line_items:       JSON.parse(JSON.stringify(seedOrderLineItems))     as OrderLineItem[],
  order_status_logs:      JSON.parse(JSON.stringify(seedStatusLogs))         as OrderStatusLog[],
  payment_receipts:       JSON.parse(JSON.stringify(seedPaymentReceipts))    as PaymentReceipt[],
  cash_collections:       JSON.parse(JSON.stringify(seedCashCollections))    as CashCollection[],
  cash_deposits:          JSON.parse(JSON.stringify(seedCashDeposits))       as CashDeposit[],
  settlements:            [] as Settlement[],
  settlement_line_items:  [] as SettlementLineItem[],
  rider_settlements:      [] as RiderSettlement[],
  rider_settlement_items: [] as RiderSettlementLineItem[],
  manager_permissions:    JSON.parse(JSON.stringify(seedManagerPermissions)) as ManagerPermission[],
};

// ---------------------------------------------------------------------------
// Auto-increment helpers (simulate database sequences)
// ---------------------------------------------------------------------------

/** Returns the next ID for a table by finding the current max and adding 1. */
export function nextId(table: { id: number }[]): number {
  return table.length === 0 ? 1 : Math.max(...table.map(r => r.id)) + 1;
}

/** Returns the current UTC timestamp as an ISO 8601 string. */
export function now(): string {
  return new Date().toISOString();
}
