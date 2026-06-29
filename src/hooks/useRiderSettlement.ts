import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getRiderSettlements,
  getRiderSettlement,
  approveRiderSettlement,
  markRiderSettlementPaid,
  acknowledgeRiderSettlement,
  disputeRiderSettlement,
} from '@/services/rider-settlement.service';

export const riderSettlementKeys = {
  all:    ()         => ['rider-settlements']               as const,
  rider:  (id: number) => ['rider-settlements', 'rider', id] as const,
  detail: (id: number) => ['rider-settlements', 'detail', id] as const,
};

export function useAllRiderSettlements() {
  return useQuery({ queryKey: riderSettlementKeys.all(), queryFn: () => getRiderSettlements() });
}

export function useRiderOwnSettlements(riderId: number) {
  return useQuery({
    queryKey: riderSettlementKeys.rider(riderId),
    queryFn:  () => getRiderSettlements(riderId),
    enabled:  riderId > 0,
  });
}

export function useRiderSettlementDetail(id: number) {
  return useQuery({
    queryKey: riderSettlementKeys.detail(id),
    queryFn:  () => getRiderSettlement(id),
    enabled:  id > 0,
  });
}

export function useApproveRiderSettlement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number }) => approveRiderSettlement(id),
    onSuccess:  (_, { id }) => {
      qc.invalidateQueries({ queryKey: riderSettlementKeys.all() });
      qc.invalidateQueries({ queryKey: riderSettlementKeys.detail(id) });
    },
  });
}

export function useMarkRiderSettlementPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, paymentReference, paidBy }: { id: number; paymentReference: string; paidBy?: number }) =>
      markRiderSettlementPaid(id, paymentReference, paidBy),
    onSuccess:  (_, { id }) => {
      qc.invalidateQueries({ queryKey: riderSettlementKeys.all() });
      qc.invalidateQueries({ queryKey: riderSettlementKeys.detail(id) });
    },
  });
}

export function useAcknowledgeRiderSettlement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: number; comment?: string }) =>
      acknowledgeRiderSettlement(id, comment),
    onSuccess:  (_, { id }) => {
      qc.invalidateQueries({ queryKey: riderSettlementKeys.all() });
      qc.invalidateQueries({ queryKey: riderSettlementKeys.detail(id) });
    },
  });
}

export function useDisputeRiderSettlement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: number; comment: string }) =>
      disputeRiderSettlement(id, comment),
    onSuccess:  (_, { id }) => {
      qc.invalidateQueries({ queryKey: riderSettlementKeys.all() });
      qc.invalidateQueries({ queryKey: riderSettlementKeys.detail(id) });
    },
  });
}
