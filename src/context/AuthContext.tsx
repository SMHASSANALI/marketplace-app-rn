/**
 * Authentication context.
 *
 * Provides the current user session to the entire component tree.
 * For Manager users, also resolves and exposes their permission set so any
 * screen can call hasPermission() without an extra fetch.
 *
 * Usage:
 *   const { user, hasPermission, login, logout } = useAuthContext();
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ManagerPermissionKey, User, ApiError } from '@/types';
import * as authService                          from '@/services/auth.service';
import { getManagerPermissions }                 from '@/services/manager.service';

const SESSION_KEY = '@marketplace:auth_token';

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

interface AuthContextValue {
  user:               User | null;
  /**
   * Populated only when user.role === 'manager'. Empty array for all other roles.
   * Reflects the permissions that the Owner has granted.
   */
  managerPermissions: ManagerPermissionKey[];
  /**
   * Returns true when the current user (Manager) has the given permission key.
   * Always returns false for non-managers.
   */
  hasPermission:      (key: ManagerPermissionKey) => boolean;
  isLoading:          boolean;
  login:              (phone: string, password: string) => Promise<void>;
  logout:             () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Context + hook
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used inside <AuthProvider>.');
  return ctx;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,               setUser]               = useState<User | null>(null);
  const [managerPermissions, setManagerPermissions] = useState<ManagerPermissionKey[]>([]);
  const [isLoading,          setIsLoading]          = useState(true);

  async function applyUser(u: User) {
    setUser(u);
    if (u.role === 'manager') {
      const perms = await getManagerPermissions(u.id);
      setManagerPermissions(perms);
    } else {
      setManagerPermissions([]);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem(SESSION_KEY);
        if (token) {
          const restoredUser = await authService.resolveToken(token);
          await applyUser(restoredUser);
        }
      } catch {
        await AsyncStorage.removeItem(SESSION_KEY);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (phone: string, password: string) => {
    const session = await authService.login(phone, password);
    await AsyncStorage.setItem(SESSION_KEY, session.token);
    await applyUser(session.user);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    await AsyncStorage.removeItem(SESSION_KEY);
    setUser(null);
    setManagerPermissions([]);
  }, []);

  const hasPermission = useCallback(
    (key: ManagerPermissionKey) => managerPermissions.includes(key),
    [managerPermissions],
  );

  return (
    <AuthContext.Provider value={{
      user, managerPermissions, hasPermission, isLoading, login, logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
