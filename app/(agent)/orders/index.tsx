import { useState }                                       from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { router }                                         from 'expo-router';
import { Ionicons }                                       from '@expo/vector-icons';

import { Screen }          from '@/components/ui/Screen';
import { EmptyState }      from '@/components/ui/EmptyState';
import { LoadingSpinner }  from '@/components/ui/LoadingSpinner';
import { OrderCard }       from '@/components/order/OrderCard';
import { useAuthContext }  from '@/context/AuthContext';
import { useAgentOrders }  from '@/hooks/useAgentOrders';
import { OrderStatus }     from '@/types';
import {
  COLORS, FONT_SIZES, RADIUS, SHADOW, SPACING,
} from '@/lib/theme';

// ---------------------------------------------------------------------------
// Status filter chips
// ---------------------------------------------------------------------------

const STATUS_FILTERS: { label: string; value: OrderStatus | null }[] = [
  { label: 'All',              value: null },
  { label: 'Pending',          value: 'pending' },
  { label: 'Confirmed',        value: 'confirmed' },
  { label: 'Out for Delivery', value: 'out_for_delivery' },
  { label: 'Delivered',        value: 'delivered' },
];

function FilterChips({
  active,
  onChange,
}: {
  active:   OrderStatus | null;
  onChange: (v: OrderStatus | null) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: SPACING.base, paddingVertical: SPACING.sm, gap: SPACING.xs }}
      style={{ flexGrow: 0 }}
    >
      {STATUS_FILTERS.map(f => {
        const isActive = f.value === active;
        return (
          <Pressable
            key={f.label}
            onPress={() => onChange(f.value)}
            style={{
              paddingHorizontal: SPACING.sm,
              paddingVertical:   6,
              borderRadius:      RADIUS.full,
              backgroundColor:   isActive ? COLORS.brand : COLORS.surface,
              borderWidth:       1,
              borderColor:       isActive ? COLORS.brand : COLORS.border,
              ...SHADOW.sm,
            }}
          >
            <Text style={{
              fontSize:   FONT_SIZES.xs,
              fontWeight: '600',
              color:      isActive ? '#fff' : COLORS.textSecondary,
            }}>
              {f.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function AgentOrdersScreen() {
  const { user, logout }  = useAuthContext();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | null>(null);

  const {
    data: orders = [],
    isLoading,
    refetch,
    isRefetching,
  } = useAgentOrders(user?.id ?? 0);

  const rejected = orders.filter(o => o.payment_status === 'receipt_rejected');

  const displayed = statusFilter
    ? orders.filter(o => o.status === statusFilter)
    : orders;

  return (
    <Screen>
      {/* ── Header greeting ── */}
      <View style={{
        backgroundColor: COLORS.brand,
        borderRadius:    RADIUS.lg,
        padding:         SPACING.lg,
        margin:          SPACING.base,
        marginBottom:    0,
      }}>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: FONT_SIZES.xs }}>Hello</Text>
        <Text style={{ color: '#fff', fontSize: FONT_SIZES.xl, fontWeight: '700', marginTop: 2 }}>
          {user?.name?.split(' ')[0]}
        </Text>
        {rejected.length > 0 && (
          <View style={{
            flexDirection:     'row',
            alignItems:        'center',
            gap:               6,
            marginTop:         SPACING.sm,
            backgroundColor:   COLORS.danger,
            borderRadius:      RADIUS.sm,
            paddingHorizontal: SPACING.sm,
            paddingVertical:   4,
            alignSelf:         'flex-start',
          }}>
            <Ionicons name="warning" size={12} color="#fff" />
            <Text style={{ color: '#fff', fontSize: FONT_SIZES.xs, fontWeight: '700' }}>
              {rejected.length} receipt{rejected.length !== 1 ? 's' : ''} need re-upload
            </Text>
          </View>
        )}
      </View>

      {/* ── Status filter chips ── */}
      <FilterChips active={statusFilter} onChange={setStatusFilter} />

      {isLoading
        ? <LoadingSpinner message="Loading orders…" />
        : (
          <FlatList
            data={displayed}
            keyExtractor={o => String(o.id)}
            contentContainerStyle={{ padding: SPACING.base, paddingBottom: SPACING['2xl'] }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor={COLORS.brand}
                colors={[COLORS.brand]}
              />
            }
            ListEmptyComponent={
              <EmptyState
                emoji="📋"
                title={statusFilter ? 'No matching orders' : 'No orders yet'}
                description={
                  statusFilter
                    ? 'Try a different status filter.'
                    : 'Orders you create will appear here.'
                }
              />
            }
            renderItem={({ item }) => (
              <OrderCard
                order={item}
                onPress={() => router.push(`/(agent)/orders/${item.id}` as any)}
              />
            )}
            ListFooterComponent={
              <View style={{ marginTop: SPACING.lg }}>
                <Pressable
                  onPress={logout}
                  style={({ pressed }) => ({
                    opacity:       pressed ? 0.6 : 1,
                    alignItems:    'center',
                    paddingVertical: SPACING.sm,
                  })}
                >
                  <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted }}>
                    Sign out · {user?.name}
                  </Text>
                </Pressable>
              </View>
            }
          />
        )
      }
    </Screen>
  );
}
