import { ManagerPermission, ManagerPermissionKey, User } from '@/types';
import { db, nextId, now }                               from '@/mock/db';
import { simulateDelay }                                 from '@/mock/delay';

export interface ManagerWithPermissions {
  user:        User;
  permissions: ManagerPermissionKey[];
}

export async function getManagers(): Promise<ManagerWithPermissions[]> {
  await simulateDelay();
  return db.users
    .filter(u => u.role === 'manager')
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(u => ({
      user:        u,
      permissions: db.manager_permissions
        .filter(p => p.user_id === u.id)
        .map(p => p.permission_key),
    }));
}

export async function getManagerPermissions(userId: number): Promise<ManagerPermissionKey[]> {
  await simulateDelay(50, 120);
  return db.manager_permissions
    .filter(p => p.user_id === userId)
    .map(p => p.permission_key);
}

export async function updatePermissions(
  managerId: number,
  keys:      ManagerPermissionKey[],
  grantedBy: number,
): Promise<ManagerPermissionKey[]> {
  await simulateDelay();
  const others    = db.manager_permissions.filter(p => p.user_id !== managerId);
  const timestamp = now();
  let   id        = nextId(db.manager_permissions);
  const added: ManagerPermission[] = keys.map(key => ({
    id:             id++,
    user_id:        managerId,
    permission_key: key,
    granted_by:     grantedBy,
    granted_at:     timestamp,
  }));
  db.manager_permissions.splice(0, db.manager_permissions.length, ...others, ...added);
  return keys;
}
