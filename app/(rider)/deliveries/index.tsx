import { useState }                                          from 'react';
import { FlatList, Pressable, RefreshControl, Text, View }   from 'react-native';
import { router }                                            from 'expo-router';
import { Ionicons }                                          from '@expo/vector-icons';

import { Screen }               from '@/components/ui/Screen';
import { Button }               from '@/components/ui/Button';
import { LoadingSpinner }        from '@/components/ui/LoadingSpinner';
import { EmptyState }            from '@/components/ui/EmptyState';
import { DeliveryCard }          from '@/components/rider/DeliveryCard';
import { useAuthContext }        from '@/context/AuthContext';
import { useRiderDeliveries }    from '@/hooks/useRiderDeliveries';
import { OrderFull, OrderStatus } from '@/types';
import { COLORS, FONT_SIZES, RADIUS, SPACING } from '@/lib/theme';

// ---------------------------------------------------------------------------
// Filter chips
// ---------------------------------------------------------------------------

type FilterKey = 'all' | 'assigned' | 'out_for_delivery' | 'delivered';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',              label: 'All' },
  { key: 'assigned',         label: 'Assigned' },
  { key: 'out_for_delivery', label: 'En Route' },
  { key: 'delivered',        label: 'Delivered' },
];

function FilterChip({
  label, active, onPress,
}: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: SPACING.md,
        paddingVertical:   SPACING.xs,
        borderRadius:      RADIUS.full,
        borderWidth:       1,
        borderColor:       active ? COLORS.info : COLORS.border,
        backgroundColor:   active ? COLORS.info + '18' : COLORS.surface,
        marginRight:       SPACING.xs,
      }}
    >
      <Text style={{
        fontSize:   FONT_SIZES.xs,
        fontWeight: '700',
        color:      active ? COLORS.info : COLORS.muted,
      }}>
        {label}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function RiderDeliveriesScreen() {
  const { user, logout }  = useAuthContext();
  const [filter, setFilter] = useState<FilterKey>('all');

  const { data: orders = [], isLoading, isRefetching, refetch } =
    useRiderDeliveries(user?.id ?? 0);

  const filtered: OrderFull[] = filter === 'all'
    ? orders
    : orders.filter(o => o.status === filter);

  const activeCount = orders.filter(
    o => o.status === 'assigned' || o.status === 'out_for_delivery',
  ).length;

  if (isLoading) return <LoadingSpinner fullScreen message="Loading deliveries…" />;

  return (
    <Screen scrollable={false} padded={false}>
      {/* Header */}
      <View style={{
        backgroundColor:   COLORS.info,
        paddingHorizontal: SPACING.base,
        paddingTop:        SPACING.base,
        paddingBottom:     SPACING.md,
      }}>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: FONT_SIZES.xs }}>
          Welcome back
        </Text>
        <Text style={{ color: '#fff', fontSize: FONT_SIZES.xl, fontWeight: '800', marginTop: 2 }}>
          {user?.name?.split(' ')[0]}
        </Text>
        {activeCount > 0 && (
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: FONT_SIZES.xs, marginTop: 4 }}>
            {activeCount} active deliver{activeCount === 1 ? 'y' : 'ies'}
          </Text>
        )}
      </View>

      {/* Filter row */}
      <FlatList
        data={FILTERS}
        horizontal
        keyExtractor={f => f.key}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: SPACING.base,
          paddingVertical:   SPACING.sm,
        }}
        renderItem={({ item }) => (
          <FilterChip
            label={item.label}
            active={filter === item.key}
            onPress={() => setFilter(item.key)}
          />
        )}
        style={{ flexGrow: 0 }}
        listKey="filters"
      />

      {/* Delivery list */}
      <FlatList
        data={filtered}
        keyExtractor={o => String(o.id)}
        contentContainerStyle={{
          paddingHorizontal: SPACING.base,
          paddingBottom:     SPACING['2xl'],
        }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.info} />
        }
        ListEmptyComponent={
          <EmptyState
            emoji="📦"
            title={filter === 'all' ? 'No deliveries yet' : `No ${filter.replace('_', ' ')} deliveries`}
            description={filter === 'all'
              ? 'Orders assigned to you will appear here.'
              : 'Try a different filter.'}
          />
        }
        renderItem={({ item }) => (
          <DeliveryCard
            order={item}
            onPress={() => router.push(`/(rider)/deliveries/${item.id}` as any)}
          />
        )}
      />

      {/* Footer */}
      <View style={{ paddingHorizontal: SPACING.base, paddingBottom: SPACING.sm }}>
        <Button label="Sign Out" onPress={logout} variant="ghost" fullWidth />
        <Text style={{ textAlign: 'center', fontSize: FONT_SIZES.xs, color: COLORS.muted, marginTop: 4 }}>
          {user?.name} · Rider
        </Text>
      </View>
    </Screen>
  );
}
