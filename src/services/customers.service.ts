/**
 * Customers service.
 *
 * Handles customer record lookup, creation, and address management.
 * The primary search key is the normalised phone number.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * BACKEND INTEGRATION: replace mock implementations with real API calls.
 * ─────────────────────────────────────────────────────────────────────────
 */

import { ApiError, Customer, CustomerAddress } from '@/types';
import { db, nextId, now }                     from '@/mock/db';
import { simulateDelay }                       from '@/mock/delay';
import { normalisePhone }                      from '@/lib/phone';

/**
 * Searches for a customer by phone number (exact normalised match).
 *
 * @returns The Customer record, or null if not found.
 */
export async function searchCustomerByPhone(rawPhone: string): Promise<Customer | null> {
  await simulateDelay();

  // ── MOCK ─────────────────────────────────────────────────────────────────
  const phone = normalisePhone(rawPhone);
  return db.customers.find(c => c.phone_number === phone) ?? null;
  // ── END MOCK ─────────────────────────────────────────────────────────────
}

/**
 * Returns a customer by ID, or throws if not found.
 */
export async function getCustomerById(id: number): Promise<Customer> {
  await simulateDelay(80, 200);

  // ── MOCK ─────────────────────────────────────────────────────────────────
  const customer = db.customers.find(c => c.id === id);
  if (!customer) throw new ApiError(`Customer #${id} not found.`, 'CUSTOMER_NOT_FOUND', 404);
  return customer;
  // ── END MOCK ─────────────────────────────────────────────────────────────
}

/** Fields required to create a new customer record. */
export interface CreateCustomerInput {
  phone_number: string;
  name:         string;
}

/**
 * Creates a new customer record. Throws if the normalised phone already exists.
 */
export async function createCustomer(input: CreateCustomerInput): Promise<Customer> {
  await simulateDelay();

  // ── MOCK ─────────────────────────────────────────────────────────────────
  const phone = normalisePhone(input.phone_number);
  if (db.customers.some(c => c.phone_number === phone)) {
    throw new ApiError(
      'A customer with this phone number already exists.',
      'CUSTOMER_DUPLICATE_PHONE',
    );
  }
  const customer: Customer = {
    id:           nextId(db.customers),
    phone_number: phone,
    name:         input.name.trim(),
    created_at:   now(),
  };
  db.customers.push(customer);
  return customer;
  // ── END MOCK ─────────────────────────────────────────────────────────────
}

/**
 * Returns all saved delivery addresses for a customer.
 */
export async function getCustomerAddresses(customerId: number): Promise<CustomerAddress[]> {
  await simulateDelay(80, 200);

  // ── MOCK ─────────────────────────────────────────────────────────────────
  return db.customer_addresses.filter(a => a.customer_id === customerId);
  // ── END MOCK ─────────────────────────────────────────────────────────────
}

/** Fields required to add a new delivery address. */
export interface CreateAddressInput {
  customer_id:  number;
  address_text: string;
  label?:       string;
  latitude?:    number;
  longitude?:   number;
  distance_km?: number;
}

/**
 * Adds a new delivery address to a customer's profile and returns the record.
 */
export async function addCustomerAddress(input: CreateAddressInput): Promise<CustomerAddress> {
  await simulateDelay();

  // ── MOCK ─────────────────────────────────────────────────────────────────
  const address: CustomerAddress = {
    id:           nextId(db.customer_addresses),
    customer_id:  input.customer_id,
    address_text: input.address_text.trim(),
    label:        input.label?.trim() ?? null,
    latitude:     input.latitude  ?? null,
    longitude:    input.longitude ?? null,
    distance_km:  input.distance_km ?? null,
    created_at:   now(),
  };
  db.customer_addresses.push(address);
  return address;
  // ── END MOCK ─────────────────────────────────────────────────────────────
}
