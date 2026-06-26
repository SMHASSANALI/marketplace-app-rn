/**
 * Authentication service.
 *
 * Provides login and session-resolution functions consumed by AuthContext.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * BACKEND INTEGRATION
 * Replace the mock implementations below with your real auth API calls.
 * The function signatures (params and return types) must not change —
 * AuthContext and all callers depend on them.
 *
 * Example real implementation using Supabase:
 *   const { data, error } = await supabase.auth.signInWithPassword({ ... });
 * ─────────────────────────────────────────────────────────────────────────
 */

import { ApiError, AuthSession, User } from '@/types';
import { db, now }                     from '@/mock/db';
import { simulateDelay }               from '@/mock/delay';
import { normalisePhone }              from '@/lib/phone';

/**
 * Authenticates a user by phone number.
 *
 * Mock behaviour: accepts any non-empty password. In production, the backend
 * validates the hashed password.
 *
 * @param phone    - Raw phone input (any format; normalised internally)
 * @param password - User password (not validated in mock)
 * @returns AuthSession containing the matched User and an opaque token.
 * @throws ApiError(401) if no user is found for the given phone number.
 */
export async function login(phone: string, password: string): Promise<AuthSession> {
  await simulateDelay();

  // ── MOCK IMPLEMENTATION ──────────────────────────────────────────────────
  const normalised = normalisePhone(phone);
  const user = db.users.find(
    u => u.phone === normalised && u.status === 'active',
  );

  if (!user) {
    throw new ApiError(
      'No active account found for this phone number.',
      'AUTH_INVALID_CREDENTIALS',
      401,
    );
  }

  // Mock token: base64-encoded user ID + timestamp (not secure — real backend
  // should return a signed JWT). btoa() is used instead of Buffer (web-safe).
  const token = btoa(`${user.id}:${Date.now()}`);
  return { user, token };
  // ── END MOCK ─────────────────────────────────────────────────────────────

  // REAL (Supabase example):
  // const { data, error } = await supabase.auth.signInWithPassword({ phone, password });
  // if (error) throw new ApiError(error.message, 'AUTH_ERROR', 401);
  // const user = await getUserById(data.user.id);
  // return { user, token: data.session.access_token };
}

/**
 * Resolves a stored auth token back to the matching User.
 *
 * Called on app startup to restore a persisted session from AsyncStorage.
 *
 * @param token - The opaque token returned by login().
 * @returns The User object for the token owner.
 * @throws ApiError(401) if the token is invalid or the user no longer exists.
 */
export async function resolveToken(token: string): Promise<User> {
  await simulateDelay(50, 150); // fast — just a local lookup

  // ── MOCK IMPLEMENTATION ──────────────────────────────────────────────────
  try {
    const decoded = atob(token);
    const userId  = parseInt(decoded.split(':')[0], 10);
    const user    = db.users.find(u => u.id === userId && u.status === 'active');
    if (!user) throw new Error();
    return user;
  } catch {
    throw new ApiError('Session expired. Please log in again.', 'AUTH_TOKEN_INVALID', 401);
  }
  // ── END MOCK ─────────────────────────────────────────────────────────────

  // REAL (Supabase example):
  // const { data, error } = await supabase.auth.getUser(token);
  // if (error) throw new ApiError('Session expired.', 'AUTH_TOKEN_INVALID', 401);
  // return getUserById(data.user.id);
}

/**
 * Invalidates the current session on the backend.
 *
 * Mock behaviour: no-op (the token lives only in memory / AsyncStorage).
 */
export async function logout(): Promise<void> {
  await simulateDelay(80, 200);
  // ── MOCK IMPLEMENTATION ── (nothing to do)
  // REAL: await supabase.auth.signOut();
}
