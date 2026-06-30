import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getRefundExchanges,
  getRefundExchange,
  findOrderForRefund,
  createRefundExchange,
  approveRefundExchange,
  completeRefundExchange,
  rejectRefundExchange,
  CreateRefundExchangeInput,
} from '@/services/refund-exchange.service';

export const reKeys = {
  all:    ()        => ['refund-exchanges']              as const,
  detail: (id: number) => ['refund-exchanges', 'detail', id] as const,
};

export function useRefundExchanges() {
  return useQuery({ queryKey: reKeys.all(), queryFn: getRefundExchanges });
}

export function useRefundExchangeDetail(id: number) {
  return useQuery({
    queryKey: reKeys.detail(id),
    queryFn:  () => getRefundExchange(id),
    enabled:  id > 0,
  });
}

export function useFindOrderForRefund() {
  return useMutation({
    mutationFn: (orderCode: string) => findOrderForRefund(orderCode),
  });
}

export function useCreateRefundExchange() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ input, actorId }: { input: CreateRefundExchangeInput; actorId: number }) =>
      createRefundExchange(input, actorId),
    onSuccess: () => qc.invalidateQueries({ queryKey: reKeys.all() }),
  });
}

export function useApproveRefundExchange() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, actorId }: { id: number; actorId: number }) =>
      approveRefundExchange(id, actorId),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: reKeys.all() });
      qc.invalidateQueries({ queryKey: reKeys.detail(id) });
    },
  });
}

export function useCompleteRefundExchange() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, actorId }: { id: number; actorId: number }) =>
      completeRefundExchange(id, actorId),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: reKeys.all() });
      qc.invalidateQueries({ queryKey: reKeys.detail(id) });
    },
  });
}

export function useRejectRefundExchange() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, actorId, reason }: { id: number; actorId: number; reason: string }) =>
      rejectRefundExchange(id, actorId, reason),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: reKeys.all() });
      qc.invalidateQueries({ queryKey: reKeys.detail(id) });
    },
  });
}
