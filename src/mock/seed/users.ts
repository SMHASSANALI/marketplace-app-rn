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

const COMMON = { address: null, cnic: null, second_contact: null, start_date: null, end_date: null };

export const seedUsers: User[] = [
  {
    id: USER_IDS.OWNER, name: 'Mr. Asif (Owner)', phone: '923001112222',
    role: 'owner', status: 'active', created_at: '2026-01-01T00:00:00Z', ...COMMON,
  },
  {
    id: USER_IDS.MANAGER, name: 'Sana Manager', phone: '923002223333',
    role: 'manager', status: 'active', created_at: '2026-01-02T00:00:00Z', ...COMMON,
  },
  {
    id: USER_IDS.AGENT_BILAL, name: 'Bilal Raza', phone: '923211234567',
    role: 'agent', status: 'active', created_at: '2026-01-03T00:00:00Z',
    address: 'Block 5, Gulshan-e-Iqbal, Karachi', cnic: '4220112345671',
    second_contact: '923001112223', start_date: '2026-01-03', end_date: null,
  },
  {
    id: USER_IDS.AGENT_SANA, name: 'Sana Malik', phone: '923331234567',
    role: 'agent', status: 'active', created_at: '2026-01-04T00:00:00Z',
    address: 'House 12, Model Colony, Karachi', cnic: '4220198765432',
    second_contact: null, start_date: '2026-01-04', end_date: null,
  },
  {
    id: USER_IDS.RIDER_IMRAN, name: 'Imran Khan', phone: '923451234567',
    role: 'rider', status: 'active', created_at: '2026-01-05T00:00:00Z',
    address: 'Malir Colony, Karachi', cnic: '4220111111111',
    second_contact: '923451234568', start_date: '2026-01-05', end_date: null,
  },
  {
    id: USER_IDS.RIDER_TARIQ, name: 'Tariq Ahmed', phone: '923461234567',
    role: 'rider', status: 'active', created_at: '2026-01-06T00:00:00Z',
    address: 'Landhi Industrial Area, Karachi', cnic: '4220122222222',
    second_contact: null, start_date: '2026-01-06', end_date: '2027-01-06',
  },
];
