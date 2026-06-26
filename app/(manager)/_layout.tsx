/**
 * Manager tab navigator.
 *
 * Tabs (scoped to whatever permissions are granted by the Owner):
 *  Dashboard — action items scoped to granted permissions
 *  Orders    — order queue (confirm, assign rider)
 *  Receipts  — prepaid receipt verification queue
 *
 * Full permission scoping implemented in v0.15.
 */

import { Tabs }     from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS }   from '@/lib/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];
const tabIcon = (name: IoniconName) =>
  ({ color, size }: { color: string; size: number }) =>
    <Ionicons name={name} size={size} color={color} />;

export default function ManagerLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor:   COLORS.teal,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarStyle: { backgroundColor: COLORS.surface, borderTopColor: COLORS.border, height: 60, paddingBottom: 8 },
        headerStyle:     { backgroundColor: COLORS.bg },
        headerTintColor: COLORS.text,
        headerTitleStyle:{ fontWeight: '700' as const },
      }}
    >
      <Tabs.Screen name="index"    options={{ title: 'Dashboard', tabBarIcon: tabIcon('home-outline')    }} />
      <Tabs.Screen name="orders"   options={{ title: 'Orders',    tabBarIcon: tabIcon('list-outline')    }} />
      <Tabs.Screen name="receipts" options={{ title: 'Receipts',  tabBarIcon: tabIcon('receipt-outline') }} />

      {/* Sub-screens — hidden from tab bar */}
      <Tabs.Screen name="orders/[id]"       options={{ href: null }} />
      <Tabs.Screen name="receipts/[orderId]" options={{ href: null }} />
    </Tabs>
  );
}
