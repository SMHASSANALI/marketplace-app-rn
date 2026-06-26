/**
 * Delivery origin and band query / mutation hooks (TanStack Query v5).
 *
 * Query key hierarchy:
 *   ['delivery']              → invalidates everything delivery-related
 *   ['delivery', 'origin']   → the single active origin point
 *   ['delivery', 'bands']    → all active bands (sorted by sort_order)
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as deliveryService from '@/services/delivery.service';
import type { CreateBandInput } from '@/services/delivery.service';
import { DeliveryBand, DeliveryOrigin } from '@/types';

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const deliveryKeys = {
  all:    () => ['delivery']              as const,
  origin: () => ['delivery', 'origin']   as const,
  bands:  () => ['delivery', 'bands']    as const,
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** Fetches the single active delivery origin point. */
export function useDeliveryOrigin() {
  return useQuery({
    queryKey: deliveryKeys.origin(),
    queryFn:  deliveryService.getDeliveryOrigin,
  });
}

/** Fetches all active delivery bands sorted by sort_order. */
export function useDeliveryBands() {
  return useQuery({
    queryKey: deliveryKeys.bands(),
    queryFn:  deliveryService.getDeliveryBands,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/** Updates the delivery origin label and/or coordinates. */
export function useUpdateOrigin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<Pick<DeliveryOrigin, 'label' | 'latitude' | 'longitude'>>) =>
      deliveryService.updateDeliveryOrigin(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: deliveryKeys.all() }),
  });
}

/** Creates a new delivery band. */
export function useCreateBand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBandInput) => deliveryService.createDeliveryBand(input),
    onSuccess:  () => qc.invalidateQueries({ queryKey: deliveryKeys.all() }),
  });
}

/** Updates an existing delivery band (all fields or a subset). */
export function useUpdateBand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id:    number;
      input: Partial<Omit<DeliveryBand, 'id'>>;
    }) => deliveryService.updateDeliveryBand(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: deliveryKeys.all() }),
  });
}
