/**
 * Seed data — Users.
 *
 * Six users covering all four roles. IDs are stable so other seed files can
 * reference them by constant (e.g. USER_IDS.AGENT_BILAL).
 *
 * Test login credentials (mock — any string is accepted as the password):
 *   Owner:   03001112222
 *   Manager: 03002223333
 *   Agent:   03211234567 (Bilal) or 03331234567 (Sana)
 *   Rider:   03451234567 (Imran) or 03461234567 (Tariq)
 */
import { User } from '@/types';

/** Stable user ID constants used across seed files. */
export const USER_IDS = {
  OWNER:        1,
  MANAGER:      2,
  AGENT_BILAL:  3,
  AGENT_SANA:   4,
  RIDER_IMRAN:  5,
  RIDER_TARIQ:  6,
} as const;

export const seedUsers: User[] = [
  {
    id:         USER_IDS.OWNER,
    name:       'Mr. Asif (Owner)',
    phone:      '923001112222',
    role:       'owner',
    status:     'active',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id:         USER_IDS.MANAGER,
    name:       'Sana Manager',
    phone:      '923002223333',
    role:       'manager',
    status:     'active',
    created_at: '2026-01-02T00:00:00Z',
  },
  {
    id:         USER_IDS.AGENT_BILAL,
    name:       'Bilal Raza',
    phone:      '923211234567',
    role:       'agent',
    status:     'active',
    created_at: '2026-01-03T00:00:00Z',
  },
  {
    id:         USER_IDS.AGENT_SANA,
    name:       'Sana Malik',
    phone:      '923331234567',
    role:       'agent',
    status:     'active',
    created_at: '2026-01-04T00:00:00Z',
  },
  {
    id:         USER_IDS.RIDER_IMRAN,
    name:       'Imran Khan',
    phone:      '923451234567',
    role:       'rider',
    status:     'active',
    created_at: '2026-01-05T00:00:00Z',
  },
  {
    id:         USER_IDS.RIDER_TARIQ,
    name:       'Tariq Ahmed',
    phone:      '923461234567',
    role:       'rider',
    status:     'active',
    created_at: '2026-01-06T00:00:00Z',
  },
];
