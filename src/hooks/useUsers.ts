import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getUsersByRole,
  createUser, suspendUser, reactivateUser, deleteUser,
  CreateUserInput,
} from '@/services/users.service';
import { UserRole } from '@/types';

export const userKeys = {
  byRole: (role: UserRole) => ['users', role] as const,
};

export function useUsersByRole(role: UserRole) {
  return useQuery({
    queryKey: userKeys.byRole(role),
    queryFn:  () => getUsersByRole(role),
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUserInput) => createUser(input),
    onSuccess:  (_, { role }) => {
      qc.invalidateQueries({ queryKey: userKeys.byRole(role) });
      qc.invalidateQueries({ queryKey: ['riders'] });
      qc.invalidateQueries({ queryKey: ['managers'] });
    },
  });
}

export function useSuspendUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => suspendUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['riders'] });
      qc.invalidateQueries({ queryKey: ['managers'] });
    },
  });
}

export function useReactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => reactivateUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['riders'] });
      qc.invalidateQueries({ queryKey: ['managers'] });
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['riders'] });
      qc.invalidateQueries({ queryKey: ['managers'] });
    },
  });
}
