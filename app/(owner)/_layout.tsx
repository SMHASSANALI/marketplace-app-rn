/**
 * Owner tab navigator.
 *
 * Tabs (v0.1 placeholders — screens filled in subsequent versions):
 *  Dashboard  — revenue, stock alerts, pending actions
 *  Orders     — full order queue with filters
 *  Products   — catalog management
 *  Settings   — delivery bands, riders, manager accounts
 */

import { Tabs }           from 'expo-router';
import { Ionicons }       from '@expo/vector-icons';
import { COLORS }         from '@/lib/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function tabIcon(name: IoniconName) {
  return ({ color, size }: { color: string; size: number }) => (
    <Ionicons name={name} size={size} color={color} />
  );
}

const TAB_BAR_STYLE = {
  backgroundColor: COLORS.surface,
  borderTopColor:  COLORS.border,
  height:          60,
  paddingBottom:   8,
};

const SCREEN_OPTIONS = {
  tabBarActiveTintColor:   COLORS.brand,
  tabBarInactiveTintColor: COLORS.muted,
  tabBarStyle:             TAB_BAR_STYLE,
  headerStyle:    { backgroundColor: COLORS.bg },
  headerTintColor:COLORS.text,
  headerTitleStyle:{ fontWeight: '700' as const },
};

export default function OwnerLayout() {
  return (
    <Tabs screenOptions={SCREEN_OPTIONS}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Dashboard', tabBarIcon: tabIcon('home-outline') }}
      />
      <Tabs.Screen
        name="orders"
        options={{ title: 'Orders', tabBarIcon: tabIcon('list-outline') }}
      />
      <Tabs.Screen
        name="products"
        options={{ title: 'Products', tabBarIcon: tabIcon('cube-outline') }}
      />
      <Tabs.Screen
        name="receipts"
        options={{ title: 'Receipts', tabBarIcon: tabIcon('receipt-outline') }}
      />
      <Tabs.Screen
        name="reconciliation"
        options={{ title: 'Cash', tabBarIcon: tabIcon('cash-outline') }}
      />
      <Tabs.Screen
        name="settlements"
        options={{ title: 'Settle', tabBarIcon: tabIcon('people-outline') }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Settings', tabBarIcon: tabIcon('settings-outline') }}
      />

      {/* Sub-screens — hidden from tab bar, reached via stack navigation */}
      <Tabs.Screen name="orders/[id]"               options={{ href: null }} />
      <Tabs.Screen name="orders/customer/[id]"      options={{ href: null }} />
      <Tabs.Screen name="receipts/[orderId]"         options={{ href: null }} />
      <Tabs.Screen name="reconciliation/[depositId]" options={{ href: null }} />
      <Tabs.Screen name="settlements/[id]"           options={{ href: null }} />
      <Tabs.Screen name="settings/riders"            options={{ href: null }} />
      <Tabs.Screen name="settings/managers"          options={{ href: null }} />
      <Tabs.Screen name="settings/agents"            options={{ href: null }} />
    </Tabs>
  );
}
