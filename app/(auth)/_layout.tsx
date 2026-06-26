/**
 * Auth group layout — stack navigator for public screens.
 * Currently contains only the login screen; registration flows
 * are handled by the Owner (users are invite-only per SRS).
 */

import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
    </Stack>
  );
}
