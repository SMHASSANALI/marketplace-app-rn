/**
 * Customer query and mutation hooks (TanStack Query v5).
 *
 * Used in the Agent order-creation wizard to look up / create
 * customers and manage their delivery addresses.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as customerService from '@/services/customers.service';

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const customerKeys = {
  addresses: (customerId: number) => ['customer-addresses', customerId] as const,
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** Fetches all saved delivery addresses for a given customer. */
export function useCustomerAddresses(customerId: number) {
  return useQuery({
    queryKey: customerKeys.addresses(customerId),
    queryFn:  () => customerService.getCustomerAddresses(customerId),
    enabled:  customerId > 0,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/** Creates a new customer record. Throws if the phone already exists. */
export function useCreateCustomer() {
  return useMutation({
    mutationFn: customerService.createCustomer,
  });
}

/** Adds a delivery address to an existing customer. */
export function useAddCustomerAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: customerService.addCustomerAddress,
    onSuccess:  (_, variables) =>
      qc.invalidateQueries({ queryKey: customerKeys.addresses(variables.customer_id) }),
  });
}
