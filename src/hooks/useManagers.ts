import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getManagers, updatePermissions }        from '@/services/manager.service';
import { ManagerPermissionKey }                  from '@/types';

export const managerKeys = {
  all: () => ['managers'] as const,
};

export function useManagers() {
  return useQuery({ queryKey: managerKeys.all(), queryFn: getManagers });
}

export function useUpdateManagerPermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ managerId, keys, grantedBy }: {
      managerId: number;
      keys:      ManagerPermissionKey[];
      grantedBy: number;
    }) => updatePermissions(managerId, keys, grantedBy),
    onSuccess: () => qc.invalidateQueries({ queryKey: managerKeys.all() }),
  });
}
