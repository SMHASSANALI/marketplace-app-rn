import { useQuery } from '@tanstack/react-query';
import { getAgentCommission } from '@/services/settlement.service';

export const commissionKeys = {
  agent: (agentId: number) => ['commission', agentId] as const,
};

export function useAgentCommission(agentId: number) {
  return useQuery({
    queryKey: commissionKeys.agent(agentId),
    queryFn:  () => getAgentCommission(agentId),
    enabled:  !!agentId,
  });
}
