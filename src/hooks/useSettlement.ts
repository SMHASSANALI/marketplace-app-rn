import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getAllSettlements, getSettlementDetail,
  approveSettlement, markSettlementPaid,
  acknowledgeSettlement, disputeSettlement,
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
    mutationFn: ({ id, paymentReference, paymentReceiptUri, paidBy }: {
      id: number; paymentReference: string; paymentReceiptUri?: string; paidBy?: number;
    }) => markSettlementPaid(id, paymentReference, paymentReceiptUri, paidBy),
    onSuccess:  (_, { id }) => {
      qc.invalidateQueries({ queryKey: settlementKeys.all() });
      qc.invalidateQueries({ queryKey: settlementKeys.detail(id) });
    },
  });
}

export function useAcknowledgeSettlement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: number; comment?: string }) =>
      acknowledgeSettlement(id, comment),
    onSuccess:  (_, { id }) => {
      qc.invalidateQueries({ queryKey: settlementKeys.all() });
      qc.invalidateQueries({ queryKey: settlementKeys.detail(id) });
    },
  });
}

export function useDisputeSettlement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: number; comment: string }) =>
      disputeSettlement(id, comment),
    onSuccess:  (_, { id }) => {
      qc.invalidateQueries({ queryKey: settlementKeys.all() });
      qc.invalidateQueries({ queryKey: settlementKeys.detail(id) });
    },
  });
}
