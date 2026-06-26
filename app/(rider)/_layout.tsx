/**
 * Rider tab navigator.
 *
 * Tabs:
 *  Deliveries — assigned and active deliveries
 *  Deposits   — cash deposit batch logging
 */

import { Tabs }                    from 'expo-router';
import { Ionicons }                from '@expo/vector-icons';
import type { ColorValue }         from 'react-native';
import { useSafeAreaInsets }       from 'react-native-safe-area-context';
import { COLORS }                  from '@/lib/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];
const tabIcon = (name: IoniconName) =>
  ({ color, size }: { focused: boolean; color: ColorValue; size: number }) =>
    <Ionicons name={name} size={size} color={color as string} />;

export default function RiderLayout() {
  const { bottom } = useSafeAreaInsets();

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
      <Tabs.Screen name="index"      options={{ title: 'Home',      tabBarIcon: tabIcon('home-outline')    }} />
      <Tabs.Screen name="deliveries" options={{ title: 'Deliveries', tabBarIcon: tabIcon('bicycle-outline')  }} />
      <Tabs.Screen name="deposits"  options={{ title: 'Deposits',   tabBarIcon: tabIcon('wallet-outline')   }} />
    </Tabs>
  );
}
