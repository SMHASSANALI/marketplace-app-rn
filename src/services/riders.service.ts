import { ApiError, User } from '@/types';
import { db, nextId, now } from '@/mock/db';
import { simulateDelay }   from '@/mock/delay';

/** Returns all active riders, sorted by name. */
export async function getRiders(): Promise<User[]> {
  await simulateDelay();
  return db.users
    .filter(u => u.role === 'rider' && u.status === 'active')
    .sort((a, b) => a.name.localeCompare(b.name));
}

export interface CreateRiderInput {
  name:  string;
  phone: string;
}

/**
 * Creates a new Rider account.
 * @throws ApiError on validation failure or duplicate phone.
 */
export async function createRider(input: CreateRiderInput): Promise<User> {
  await simulateDelay();

  if (!input.name.trim())  throw new ApiError('Name is required.',  'RIDER_NAME_REQUIRED');
  if (!input.phone.trim()) throw new ApiError('Phone is required.', 'RIDER_PHONE_REQUIRED');

  const dup = db.users.find(u => u.phone === input.phone.trim());
  if (dup) throw new ApiError('A user with this phone number already exists.', 'RIDER_PHONE_DUPLICATE');

  const rider: User = {
    id:         nextId(db.users),
    name:       input.name.trim(),
    phone:      input.phone.trim(),
    role:       'rider',
    status:     'active',
    created_at: now(),
  };
  db.users.push(rider);
  return rider;
}
