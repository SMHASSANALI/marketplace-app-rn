import { Tabs }     from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS }   from '@/lib/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];
const tabIcon = (name: IoniconName) =>
  ({ color, size }: { color: string; size: number }) =>
    <Ionicons name={name} size={size} color={color} />;

export default function AgentLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor:   COLORS.brand,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarStyle: { backgroundColor: COLORS.surface, borderTopColor: COLORS.border, height: 60, paddingBottom: 8 },
        headerStyle:     { backgroundColor: COLORS.bg },
        headerTintColor: COLORS.text,
        headerTitleStyle:{ fontWeight: '700' as const },
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
