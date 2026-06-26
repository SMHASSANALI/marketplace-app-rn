import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrders, getOrderById, verifyReceipt, rejectReceipt } from '@/services/orders.service';

export const receiptKeys = {
  pending: () => ['receipts', 'pending'] as const,
  order:   (id: number) => ['order', id] as const,
};

/** Returns all orders with payment_status = 'receipt_pending'. */
export function usePendingReceipts() {
  return useQuery({
    queryKey: receiptKeys.pending(),
    queryFn:  () => getOrders({ paymentStatus: 'receipt_pending' }),
  });
}

export function useReceiptOrder(orderId: number) {
  return useQuery({
    queryKey: receiptKeys.order(orderId),
    queryFn:  () => getOrderById(orderId),
    enabled:  orderId > 0,
  });
}

export function useVerifyReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, actorId }: { orderId: number; actorId: number }) =>
      verifyReceipt(orderId, actorId),
    onSuccess: (_data, { orderId }) => {
      qc.invalidateQueries({ queryKey: receiptKeys.pending() });
      qc.invalidateQueries({ queryKey: receiptKeys.order(orderId) });
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useRejectReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, actorId, comment }: {
      orderId: number; actorId: number; comment: string;
    }) => rejectReceipt(orderId, actorId, comment),
    onSuccess: (_data, { orderId }) => {
      qc.invalidateQueries({ queryKey: receiptKeys.pending() });
      qc.invalidateQueries({ queryKey: receiptKeys.order(orderId) });
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
