/**
 * App entry point — immediately redirects to the auth group.
 * The route guard in _layout.tsx then decides the final destination
 * based on the stored session.
 */

import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/(auth)/login" />;
}
