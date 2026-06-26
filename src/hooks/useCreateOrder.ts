/**
 * Order creation mutation hook (TanStack Query v5).
 *
 * Wraps `createOrder()` from the orders service.
 * On success, invalidates the orders query so lists refresh automatically.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createOrder }                 from '@/services/orders.service';

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createOrder,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
}
