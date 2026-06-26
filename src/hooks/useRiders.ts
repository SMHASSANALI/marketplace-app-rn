import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRiders, createRider, CreateRiderInput } from '@/services/riders.service';
import { assignRider }                              from '@/services/orders.service';

export const riderKeys = {
  all: () => ['riders'] as const,
};

export function useRiders() {
  return useQuery({
    queryKey: riderKeys.all(),
    queryFn:  getRiders,
  });
}

export function useCreateRider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRiderInput) => createRider(input),
    onSuccess:  () => qc.invalidateQueries({ queryKey: riderKeys.all() }),
  });
}

export function useAssignRider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId, riderId, actorId,
    }: { orderId: number; riderId: number; actorId: number }) =>
      assignRider(orderId, riderId, actorId),
    onSuccess: (_data, { orderId }) => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['order', orderId] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
