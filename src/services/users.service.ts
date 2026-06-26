/**
 * User management service — Owner only.
 *
 * Handles creating, suspending, reactivating, and deleting agent/manager/rider
 * accounts. All functions enforce phone-number uniqueness across the system.
 */

import { ApiError, User, UserRole } from '@/types';
import { db, nextId, now }          from '@/mock/db';
import { simulateDelay }            from '@/mock/delay';

export interface CreateUserInput {
  name:  string;
  phone: string;
  role:  Exclude<UserRole, 'owner'>;
}

/** Returns all users of a given role (active + suspended). */
export async function getUsersByRole(role: UserRole): Promise<User[]> {
  await simulateDelay();
  return db.users
    .filter(u => u.role === role)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Creates a new user account (agent, manager, or rider). */
export async function createUser(input: CreateUserInput): Promise<User> {
  await simulateDelay();

  if (!input.name.trim())  throw new ApiError('Name is required.',  'USER_NAME_REQUIRED');
  if (!input.phone.trim()) throw new ApiError('Phone is required.', 'USER_PHONE_REQUIRED');

  const dup = db.users.find(u => u.phone === input.phone.trim());
  if (dup) throw new ApiError(
    'A user with this phone number already exists.',
    'USER_PHONE_DUPLICATE',
  );

  const user: User = {
    id:         nextId(db.users),
    name:       input.name.trim(),
    phone:      input.phone.trim(),
    role:       input.role,
    status:     'active',
    created_at: now(),
  };
  db.users.push(user);
  return user;
}

/** Suspends a user account — they can no longer log in. */
export async function suspendUser(id: number): Promise<User> {
  await simulateDelay();
  const idx = db.users.findIndex(u => u.id === id);
  if (idx === -1) throw new ApiError(`User #${id} not found.`, 'USER_NOT_FOUND', 404);
  if (db.users[idx].role === 'owner') throw new ApiError('Cannot suspend the owner.', 'USER_INVALID_ROLE');
  db.users[idx] = { ...db.users[idx], status: 'suspended' };
  return db.users[idx];
}

/** Reactivates a previously suspended user. */
export async function reactivateUser(id: number): Promise<User> {
  await simulateDelay();
  const idx = db.users.findIndex(u => u.id === id);
  if (idx === -1) throw new ApiError(`User #${id} not found.`, 'USER_NOT_FOUND', 404);
  db.users[idx] = { ...db.users[idx], status: 'active' };
  return db.users[idx];
}

/** Permanently removes a user account from the system. */
export async function deleteUser(id: number): Promise<void> {
  await simulateDelay();
  const idx = db.users.findIndex(u => u.id === id);
  if (idx === -1) throw new ApiError(`User #${id} not found.`, 'USER_NOT_FOUND', 404);
  if (db.users[idx].role === 'owner') throw new ApiError('Cannot delete the owner.', 'USER_INVALID_ROLE');
  db.users.splice(idx, 1);
}
