import { FlatList, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { router }              from 'expo-router';
import { Ionicons }            from '@expo/vector-icons';

import { Screen }              from '@/components/ui/Screen';
import { EmptyState }          from '@/components/ui/EmptyState';
import { LoadingSpinner }      from '@/components/ui/LoadingSpinner';
import { OwnerOrderCard }      from '@/components/order/OwnerOrderCard';
import { useOwnerOrders }      from '@/hooks/useOwnerOrders';
import { useAuthContext }      from '@/context/AuthContext';
import { OrderStatus, PaymentMethod } from '@/types';
import {
  COLORS, FONT_SIZES, RADIUS, SHADOW, SPACING,
} from '@/lib/theme';
import { useState } from 'react';

function FilterChip<T extends string | null>({
  options, active, onChange,
}: {
  options:  { label: string; value: T }[];
  active:   T;
  onChange: (v: T) => void;
}) {
  return (
    <ScrollView
      horizontal showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: SPACING.base, paddingVertical: SPACING.xs, gap: SPACING.xs }}
      style={{ flexGrow: 0 }}
    >
      {options.map(o => {
        const on = o.value === active;
        return (
          <Pressable
            key={o.label}
            onPress={() => onChange(o.value)}
            style={{
              paddingHorizontal: SPACING.sm, paddingVertical: 5,
              borderRadius: RADIUS.full,
              backgroundColor: on ? COLORS.brand : COLORS.surface,
              borderWidth: 1, borderColor: on ? COLORS.brand : COLORS.border,
              ...SHADOW.sm,
            }}
          >
            <Text style={{
              fontSize: FONT_SIZES.xs, fontWeight: '600',
              color: on ? '#fff' : COLORS.textSecondary,
            }}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const STATUS_OPTIONS: { label: string; value: OrderStatus | null }[] = [
  { label: 'All',              value: null },
  { label: 'Pending',          value: 'pending' },
  { label: 'Confirmed',        value: 'confirmed' },
  { label: 'Out for Delivery', value: 'out_for_delivery' },
  { label: 'Delivered',        value: 'delivered' },
];
const PAYMENT_OPTIONS: { label: string; value: PaymentMethod | null }[] = [
  { label: 'All',     value: null },
  { label: 'COD',     value: 'cod' },
  { label: 'Prepaid', value: 'prepaid' },
];

export default function ManagerOrdersScreen() {
  const [statusFilter,  setStatusFilter]  = useState<OrderStatus | null>(null);
  const [paymentFilter, setPaymentFilter] = useState<PaymentMethod | null>(null);
  const { hasPermission } = useAuthContext();

  const { data: orders = [], isLoading, refetch, isRefetching } = useOwnerOrders({
    status:        statusFilter  ?? undefined,
    paymentMethod: paymentFilter ?? undefined,
  });

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const canConfirm   = hasPermission('confirm_orders');

  return (
    <Screen scrollable={false} padded={false}>
      {pendingCount > 0 && canConfirm && (
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 6,
          backgroundColor: COLORS.warning + '18',
          borderBottomWidth: 1, borderBottomColor: COLORS.warning + '50',
          paddingHorizontal: SPACING.base, paddingVertical: SPACING.sm,
        }}>
          <Ionicons name="time-outline" size={14} color={COLORS.warning} />
          <Text style={{ flex: 1, color: COLORS.warning, fontSize: FONT_SIZES.sm, fontWeight: '700' }}>
            {pendingCount} order{pendingCount !== 1 ? 's' : ''} awaiting confirmation
          </Text>
        </View>
      )}

      <FilterChip options={STATUS_OPTIONS}  active={statusFilter}  onChange={setStatusFilter} />
      <FilterChip options={PAYMENT_OPTIONS} active={paymentFilter} onChange={setPaymentFilter} />

      {isLoading
        ? <LoadingSpinner message="Loading orders…" />
        : (
          <FlatList
            data={orders}
            keyExtractor={o => String(o.id)}
            contentContainerStyle={{ padding: SPACING.base, paddingBottom: SPACING['2xl'] }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.brand} />
            }
            ListEmptyComponent={
              <EmptyState emoji="📋" title="No orders found" description="Try removing a filter." />
            }
            renderItem={({ item }) => (
              <OwnerOrderCard
                order={item}
                onPress={() => router.push(`/(manager)/orders/${item.id}` as any)}
              />
            )}
          />
        )
      }
    </Screen>
  );
}
