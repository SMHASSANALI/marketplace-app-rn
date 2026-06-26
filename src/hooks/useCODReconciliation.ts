import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getAllDeposits,
  getDepositDetail,
  confirmDeposit,
} from '@/services/reconciliation.service';
import { useAuthContext } from '@/context/AuthContext';

export const reconciliationKeys = {
  deposits: ()         => ['reconciliation', 'deposits']         as const,
  deposit:  (id: number) => ['reconciliation', 'deposit', id]   as const,
};

export function useAllDeposits() {
  return useQuery({
    queryKey: reconciliationKeys.deposits(),
    queryFn:  getAllDeposits,
  });
}

export function useDepositDetail(depositId: number) {
  return useQuery({
    queryKey: reconciliationKeys.deposit(depositId),
    queryFn:  () => getDepositDetail(depositId),
    enabled:  !!depositId,
  });
}

export function useConfirmDeposit() {
  const queryClient  = useQueryClient();
  const { user }     = useAuthContext();

  return useMutation({
    mutationFn: ({ depositId }: { depositId: number }) =>
      confirmDeposit(depositId, user!.id),
    onSuccess: (_, { depositId }) => {
      queryClient.invalidateQueries({ queryKey: reconciliationKeys.deposits() });
      queryClient.invalidateQueries({ queryKey: reconciliationKeys.deposit(depositId) });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
