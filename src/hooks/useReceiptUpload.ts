import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reuploadReceipt }             from '@/services/orders.service';

export function useReuploadReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      fileName,
      agentId,
    }: {
      orderId:  number;
      fileName: string;
      agentId:  number;
    }) => reuploadReceipt(orderId, fileName, agentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
