import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getRiderDeliveries,
  startDelivery,
  markDelivered,
  getUndepositedCollections,
  getRiderDeposits,
  logDeposit,
} from '@/services/rider.service';
import {
  getOrderById,
  confirmPickup,
  confirmDeliveryItems,
  type PickupConfirmationItem,
  type DeliveryConfirmationItem,
} from '@/services/orders.service';

export const riderDeliveryKeys = {
  deliveries: (riderId: number) => ['rider', 'deliveries', riderId] as const,
  order:      (id: number)      => ['order', id]                    as const,
  collections:(riderId: number) => ['rider', 'collections', riderId] as const,
  deposits:   (riderId: number) => ['rider', 'deposits', riderId]    as const,
};

export function useRiderDeliveries(riderId: number) {
  return useQuery({
    queryKey: riderDeliveryKeys.deliveries(riderId),
    queryFn:  () => getRiderDeliveries(riderId),
    enabled:  riderId > 0,
  });
}

export function useDeliveryOrder(id: number) {
  return useQuery({
    queryKey: riderDeliveryKeys.order(id),
    queryFn:  () => getOrderById(id),
    enabled:  id > 0,
  });
}

export function useStartDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, actorId }: { orderId: number; actorId: number }) =>
      startDelivery(orderId, actorId),
    onSuccess: (_data, { orderId }) => {
      qc.invalidateQueries({ queryKey: ['rider'] });
      qc.invalidateQueries({ queryKey: riderDeliveryKeys.order(orderId) });
    },
  });
}

export function useMarkDelivered() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId, riderId, actorId, amountCollected,
    }: { orderId: number; riderId: number; actorId: number; amountCollected?: number }) =>
      markDelivered(orderId, riderId, actorId, amountCollected),
    onSuccess: (_data, { orderId, riderId }) => {
      qc.invalidateQueries({ queryKey: ['rider'] });
      qc.invalidateQueries({ queryKey: riderDeliveryKeys.order(orderId) });
      qc.invalidateQueries({ queryKey: riderDeliveryKeys.collections(riderId) });
    },
  });
}

export function useConfirmPickup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, actorId, items }: {
      orderId: number; actorId: number; items: PickupConfirmationItem[];
    }) => confirmPickup(orderId, actorId, items),
    onSuccess: (_data, { orderId }) => {
      qc.invalidateQueries({ queryKey: ['rider'] });
      qc.invalidateQueries({ queryKey: riderDeliveryKeys.order(orderId) });
    },
  });
}

export function useConfirmDeliveryItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, riderId, actorId, items, amountCollected }: {
      orderId: number; riderId: number; actorId: number;
      items: DeliveryConfirmationItem[]; amountCollected?: number;
    }) => confirmDeliveryItems(orderId, riderId, actorId, items, amountCollected),
    onSuccess: (_data, { orderId, riderId }) => {
      qc.invalidateQueries({ queryKey: ['rider'] });
      qc.invalidateQueries({ queryKey: riderDeliveryKeys.order(orderId) });
      qc.invalidateQueries({ queryKey: riderDeliveryKeys.collections(riderId) });
    },
  });
}

export function useUndepositedCollections(riderId: number) {
  return useQuery({
    queryKey: riderDeliveryKeys.collections(riderId),
    queryFn:  () => getUndepositedCollections(riderId),
    enabled:  riderId > 0,
  });
}

export function useRiderDeposits(riderId: number) {
  return useQuery({
    queryKey: riderDeliveryKeys.deposits(riderId),
    queryFn:  () => getRiderDeposits(riderId),
    enabled:  riderId > 0,
  });
}

export function useLogDeposit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      riderId, depositAmount, depositReference,
    }: { riderId: number; depositAmount: number; depositReference: string }) =>
      logDeposit(riderId, depositAmount, depositReference),
    onSuccess: (_data, { riderId }) => {
      qc.invalidateQueries({ queryKey: riderDeliveryKeys.collections(riderId) });
      qc.invalidateQueries({ queryKey: riderDeliveryKeys.deposits(riderId) });
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
