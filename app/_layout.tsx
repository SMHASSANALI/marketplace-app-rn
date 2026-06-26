/**
 * Root layout — entry point for Expo Router.
 *
 * Responsibilities:
 *  1. Provide global context (Auth, React Query) to the entire tree.
 *  2. Restore the persisted session on launch (handled inside AuthProvider).
 *  3. Guard routes: redirect unauthenticated users to login; redirect
 *     authenticated users away from login to their role-specific home.
 *
 * Route groups:
 *  (auth)    — public screens (login)
 *  (owner)   — Owner tab navigator
 *  (manager) — Manager tab navigator
 *  (agent)   — Agent tab navigator
 *  (rider)   — Rider tab navigator
 */

import '../global.css'; // Required by NativeWind — must be first import

import React, { useEffect }    from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar }           from 'expo-status-bar';

import { AuthProvider, useAuthContext } from '@/context/AuthContext';
import { QueryProvider }               from '@/context/QueryContext';
import { LoadingSpinner }              from '@/components/ui/LoadingSpinner';
import { UserRole }                    from '@/types';
import { COLORS }                      from '@/lib/theme';

// ---------------------------------------------------------------------------
// Route guard — must run inside AuthProvider
// ---------------------------------------------------------------------------

/** Maps each role to its root route. */
const ROLE_HOME: Record<UserRole, string> = {
  owner:   '/(owner)/',
  manager: '/(manager)/',
  agent:   '/(agent)/',
  rider:   '/(rider)/',
};

function RouteGuard() {
  const { user, isLoading } = useAuthContext();
  const segments            = useSegments();

  useEffect(() => {
    if (isLoading) return; // wait for session restore to complete

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // Not logged in — always go to login
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // Already logged in — go to role-specific home
      router.replace(ROLE_HOME[user.role] as never);
    }
  }, [user, isLoading, segments]);

  if (isLoading) {
    // Show splash-style spinner while restoring session from AsyncStorage
    return <LoadingSpinner fullScreen message="Loading…" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)"    />
      <Stack.Screen name="(owner)"   />
      <Stack.Screen name="(manager)" />
      <Stack.Screen name="(agent)"   />
      <Stack.Screen name="(rider)"   />

      {/* ── Modal screens (shown above the tab navigators) ── */}
      <Stack.Screen
        name="modals/product-new"
        options={{
          headerShown:    true,
          title:          'New Product',
          presentation:   'modal',
          headerStyle:    { backgroundColor: COLORS.bg },
          headerTintColor:COLORS.brand,
          headerTitleStyle:{ fontWeight: '700', color: COLORS.text },
        }}
      />
      <Stack.Screen
        name="modals/product-edit"
        options={{
          headerShown:    true,
          title:          'Edit Product',
          presentation:   'modal',
          headerStyle:    { backgroundColor: COLORS.bg },
          headerTintColor:COLORS.brand,
          headerTitleStyle:{ fontWeight: '700', color: COLORS.text },
        }}
      />
      <Stack.Screen
        name="modals/band-new"
        options={{
          headerShown:    true,
          title:          'New Delivery Band',
          presentation:   'modal',
          headerStyle:    { backgroundColor: COLORS.bg },
          headerTintColor:COLORS.brand,
          headerTitleStyle:{ fontWeight: '700', color: COLORS.text },
        }}
      />
      <Stack.Screen
        name="modals/band-edit"
        options={{
          headerShown:    true,
          title:          'Edit Band',
          presentation:   'modal',
          headerStyle:    { backgroundColor: COLORS.bg },
          headerTintColor:COLORS.brand,
          headerTitleStyle:{ fontWeight: '700', color: COLORS.text },
        }}
      />
      <Stack.Screen
        name="modals/origin-edit"
        options={{
          headerShown:    true,
          title:          'Edit Delivery Origin',
          presentation:   'modal',
          headerStyle:    { backgroundColor: COLORS.bg },
          headerTintColor:COLORS.brand,
          headerTitleStyle:{ fontWeight: '700', color: COLORS.text },
        }}
      />
      <Stack.Screen
        name="modals/agent-order-detail"
        options={{
          headerShown:    true,
          title:          'Order Detail',
          presentation:   'modal',
          headerStyle:    { backgroundColor: COLORS.bg },
          headerTintColor:COLORS.brand,
          headerTitleStyle:{ fontWeight: '700', color: COLORS.text },
        }}
      />
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// Root layout
// ---------------------------------------------------------------------------

export default function RootLayout() {
  return (
    <QueryProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <RouteGuard />
      </AuthProvider>
    </QueryProvider>
  );
}
