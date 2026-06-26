import { useQuery } from '@tanstack/react-query';
import { getOrders } from '@/services/orders.service';

export const agentOrderKeys = {
  all: (agentId: number) => ['orders', 'agent', agentId] as const,
};

export function useAgentOrders(agentId: number) {
  return useQuery({
    queryKey: agentOrderKeys.all(agentId),
    queryFn:  () => getOrders({ agentId }),
    enabled:  agentId > 0,
  });
}
