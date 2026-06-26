import { useQuery } from '@tanstack/react-query';
import { getOrderStatusLogs } from '@/services/orders.service';

export const statusLogKeys = {
  order: (orderId: number) => ['order-status-logs', orderId] as const,
};

export function useOrderStatusLogs(orderId: number) {
  return useQuery({
    queryKey: statusLogKeys.order(orderId),
    queryFn:  () => getOrderStatusLogs(orderId),
    enabled:  orderId > 0,
    staleTime: 0,
  });
}
