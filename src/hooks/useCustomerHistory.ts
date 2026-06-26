import { useQuery } from '@tanstack/react-query';
import { getCustomerHistory } from '@/services/orders.service';

export const customerHistoryKeys = {
  detail: (customerId: number) => ['customer-history', customerId] as const,
};

export function useCustomerHistory(customerId: number) {
  return useQuery({
    queryKey: customerHistoryKeys.detail(customerId),
    queryFn:  () => getCustomerHistory(customerId),
    enabled:  customerId > 0,
    staleTime: 0,
  });
}
