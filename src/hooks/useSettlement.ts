import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getAllSettlements, getSettlementDetail,
  approveSettlement, markSettlementPaid,
} from '@/services/settlement.service';
import { runSettlement } from '@/lib/settlement';

export const settlementKeys = {
  all:    ()         => ['settlements']               as const,
  detail: (id: number) => ['settlements', 'detail', id] as const,
};

export function useAllSettlements() {
  return useQuery({ queryKey: settlementKeys.all(), queryFn: getAllSettlements });
}

export function useSettlementDetail(id: number) {
  return useQuery({
    queryKey: settlementKeys.detail(id),
    queryFn:  () => getSettlementDetail(id),
    enabled:  !!id,
  });
}

export function useRunSettlement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { agentId?: number; triggeredBy: 'scheduled' | 'manual' }) =>
      runSettlement(params),
    onSuccess: () => qc.invalidateQueries({ queryKey: settlementKeys.all() }),
  });
}

export function useApproveSettlement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number }) => approveSettlement(id),
    onSuccess:  (_, { id }) => {
      qc.invalidateQueries({ queryKey: settlementKeys.all() });
      qc.invalidateQueries({ queryKey: settlementKeys.detail(id) });
    },
  });
}

export function useMarkSettlementPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, paymentReceiptUri }: { id: number; paymentReceiptUri?: string }) =>
      markSettlementPaid(id, paymentReceiptUri),
    onSuccess:  (_, { id }) => {
      qc.invalidateQueries({ queryKey: settlementKeys.all() });
      qc.invalidateQueries({ queryKey: settlementKeys.detail(id) });
    },
  });
}
