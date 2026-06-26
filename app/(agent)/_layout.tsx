import { Tabs }                    from 'expo-router';
import { Ionicons }                from '@expo/vector-icons';
import type { ColorValue }         from 'react-native';
import { useSafeAreaInsets }       from 'react-native-safe-area-context';
import { COLORS }                  from '@/lib/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];
const tabIcon = (name: IoniconName) =>
  ({ color, size }: { focused: boolean; color: ColorValue; size: number }) =>
    <Ionicons name={name} size={size} color={color as string} />;

export default function AgentLayout() {
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
      <Tabs.Screen name="index"      options={{ title: 'Home',       tabBarIcon: tabIcon('home-outline') }} />
      <Tabs.Screen name="orders"     options={{ title: 'Orders',     tabBarIcon: tabIcon('list-outline') }} />
      <Tabs.Screen name="products"   options={{ title: 'Products',   tabBarIcon: tabIcon('cube-outline') }} />
      <Tabs.Screen name="new-order"  options={{ title: 'New Order',  tabBarIcon: tabIcon('add-circle-outline') }} />
      <Tabs.Screen name="commission" options={{ title: 'Commission', tabBarIcon: tabIcon('wallet-outline') }} />
    </Tabs>
  );
}
