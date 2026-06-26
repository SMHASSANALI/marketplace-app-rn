/**
 * Rider tab navigator.
 *
 * Tabs:
 *  Deliveries — assigned and active deliveries
 *  Deposits   — cash deposit batch logging
 */

import { Tabs }        from 'expo-router';
import { Ionicons }    from '@expo/vector-icons';
import type { ColorValue } from 'react-native';
import { COLORS }      from '@/lib/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];
const tabIcon = (name: IoniconName) =>
  ({ color, size }: { focused: boolean; color: ColorValue; size: number }) =>
    <Ionicons name={name} size={size} color={color as string} />;

export default function RiderLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor:   COLORS.info,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarStyle: { backgroundColor: COLORS.surface, borderTopColor: COLORS.border, height: 60, paddingBottom: 8 },
        headerStyle:     { backgroundColor: COLORS.bg },
        headerTintColor: COLORS.text,
        headerTitleStyle:{ fontWeight: '700' as const },
      }}
    >
      <Tabs.Screen name="index"      options={{ title: 'Home',      tabBarIcon: tabIcon('home-outline')    }} />
      <Tabs.Screen name="deliveries" options={{ title: 'Deliveries', tabBarIcon: tabIcon('bicycle-outline')  }} />
      <Tabs.Screen name="deposits"  options={{ title: 'Deposits',   tabBarIcon: tabIcon('wallet-outline')   }} />
    </Tabs>
  );
}
