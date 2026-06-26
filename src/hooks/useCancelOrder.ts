import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cancelOrder }                  from '@/services/orders.service';

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId, reason, actorId,
    }: { orderId: number; reason: string; actorId: number }) =>
      cancelOrder(orderId, reason, actorId),
    onSuccess: (_data, { orderId }) => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['order', orderId] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
