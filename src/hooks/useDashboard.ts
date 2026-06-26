import { useQuery }           from '@tanstack/react-query';
import { ManagerPermissionKey } from '@/types';
import { getOwnerSummary, getManagerSummary } from '@/services/dashboard.service';

export const dashboardKeys = {
  owner:   ()                            => ['dashboard', 'owner']          as const,
  manager: (perms: ManagerPermissionKey[]) => ['dashboard', 'manager', perms] as const,
};

export function useOwnerSummary() {
  return useQuery({
    queryKey:            dashboardKeys.owner(),
    queryFn:             getOwnerSummary,
    refetchOnWindowFocus: true,
    staleTime:            0,
  });
}

export function useManagerSummary(permissions: ManagerPermissionKey[]) {
  return useQuery({
    queryKey:            dashboardKeys.manager(permissions),
    queryFn:             () => getManagerSummary(permissions),
    refetchOnWindowFocus: true,
    staleTime:            0,
  });
}
