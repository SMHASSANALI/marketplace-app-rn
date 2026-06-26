import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getOrders, getOrderById, confirmOrder,
  GetOrdersFilter,
} from '@/services/orders.service';
import { PaymentMethod, OrderStatus } from '@/types';

export interface OwnerOrdersFilter {
  status?:        OrderStatus;
  paymentMethod?: PaymentMethod;
  agentId?:       number;
}

export const ownerOrderKeys = {
  all:    ()                       => ['orders', 'owner'] as const,
  list:   (f: OwnerOrdersFilter)  => [...ownerOrderKeys.all(), f] as const,
  detail: (id: number)             => ['order', id] as const,
};

export function useOwnerOrders(filter: OwnerOrdersFilter = {}) {
  const svcFilter: GetOrdersFilter = {
    status:        filter.status,
    paymentMethod: filter.paymentMethod,
    agentId:       filter.agentId,
  };
  return useQuery({
    queryKey: ownerOrderKeys.list(filter),
    queryFn:  () => getOrders(svcFilter),
  });
}

export function useOwnerOrder(id: number) {
  return useQuery({
    queryKey: ownerOrderKeys.detail(id),
    queryFn:  () => getOrderById(id),
    enabled:  id > 0,
  });
}

export function useConfirmOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, actorId }: { orderId: number; actorId: number }) =>
      confirmOrder(orderId, actorId),
    onSuccess: (_data, { orderId }) => {
      qc.invalidateQueries({ queryKey: ownerOrderKeys.all() });
      qc.invalidateQueries({ queryKey: ownerOrderKeys.detail(orderId) });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
