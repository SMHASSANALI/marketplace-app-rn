import { Tabs }                    from 'expo-router';
import { Ionicons }                from '@expo/vector-icons';
import type { ColorValue }         from 'react-native';
import { useSafeAreaInsets }       from 'react-native-safe-area-context';
import { COLORS }                  from '@/lib/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function tabIcon(name: IoniconName) {
  return ({ color, size }: { focused: boolean; color: ColorValue; size: number }) => (
    <Ionicons name={name} size={size} color={color as string} />
  );
}

export default function OwnerLayout() {
  const { bottom } = useSafeAreaInsets();

  return (
    <Tabs screenOptions={{
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
      tabBarLabelStyle: { fontSize: 10, fontWeight: '600' as const },
      headerStyle:         { backgroundColor: COLORS.surface },
      headerShadowVisible: true,
      headerTintColor:     COLORS.text,
      headerTitleStyle:    { fontWeight: '700' as const, fontSize: 17 },
    }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Dashboard', headerShown: false, tabBarIcon: tabIcon('home-outline') }}
      />
      <Tabs.Screen
        name="orders"
        options={{ title: 'Orders', headerShown: false, tabBarIcon: tabIcon('list-outline') }}
      />
      <Tabs.Screen
        name="products"
        options={{ title: 'Products', headerShown: false, tabBarIcon: tabIcon('cube-outline') }}
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
