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

import { Tabs }                    from 'expo-router';
import { Ionicons }                from '@expo/vector-icons';
import type { ColorValue }         from 'react-native';
import { useSafeAreaInsets }       from 'react-native-safe-area-context';
import { COLORS }                  from '@/lib/theme';
import { useAuthContext }          from '@/context/AuthContext';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];
const tabIcon = (name: IoniconName) =>
  ({ color, size }: { focused: boolean; color: ColorValue; size: number }) =>
    <Ionicons name={name} size={size} color={color as string} />;

export default function ManagerLayout() {
  const { bottom }       = useSafeAreaInsets();
  const { hasPermission } = useAuthContext();
  const canRefunds       = hasPermission('refunds_exchanges');

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor:   COLORS.brand,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor:  COLORS.border,
          borderTopWidth:  1,
          height:          56 + bottom,
          paddingBottom:   bottom > 0 ? bottom : 8,
          paddingTop:      6,
          elevation:       8,
        },
        tabBarLabelStyle:    { fontSize: 11, fontWeight: '600' as const },
        headerStyle:         { backgroundColor: COLORS.surface },
        headerShadowVisible: true,
        headerTintColor:     COLORS.text,
        headerTitleStyle:    { fontWeight: '700' as const, fontSize: 17 },
      }}
    >
      <Tabs.Screen name="index"    options={{ title: 'Dashboard', tabBarIcon: tabIcon('home-outline')    }} />
      <Tabs.Screen name="orders"   options={{ title: 'Orders',    tabBarIcon: tabIcon('list-outline')    }} />
      <Tabs.Screen name="receipts" options={{ title: 'Receipts',  tabBarIcon: tabIcon('receipt-outline') }} />
      <Tabs.Screen
        name="refunds"
        options={canRefunds ? {
          title: 'Refunds', headerShown: false, tabBarIcon: tabIcon('return-up-back-outline'),
        } : { href: null }}
      />

      {/* Sub-screens — hidden from tab bar */}
      <Tabs.Screen name="orders/[id]"        options={{ href: null }} />
      <Tabs.Screen name="receipts/[orderId]"  options={{ href: null }} />
      <Tabs.Screen name="refunds/[id]"        options={{ href: null }} />
    </Tabs>
  );
}
