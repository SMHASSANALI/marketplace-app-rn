import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { Stack, useLocalSearchParams }             from 'expo-router';
import { Ionicons }                               from '@expo/vector-icons';

import { Screen }             from '@/components/ui/Screen';
import { EmptyState }         from '@/components/ui/EmptyState';
import { useCustomerHistory } from '@/hooks/useCustomerHistory';
import { OrderFull }          from '@/types';
import { formatCurrency }     from '@/lib/utils';
import {
  COLORS, FONT_SIZES, RADIUS, SHADOW, SPACING, STATUS_COLOR, STATUS_LABEL,
} from '@/lib/theme';

// ---------------------------------------------------------------------------
// Order card
// ---------------------------------------------------------------------------

function OrderCard({ order }: { order: OrderFull }) {
  const statusColor = STATUS_COLOR[order.status] ?? COLORS.muted;
  const date = new Date(order.created_at).toLocaleDateString('en-PK', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <View style={{
      backgroundColor: COLORS.surface,
      borderRadius:    RADIUS.md,
      borderWidth:     1,
      borderColor:     COLORS.border,
      padding:         SPACING.md,
      marginBottom:    SPACING.sm,
      ...SHADOW.sm,
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: FONT_SIZES.base, fontWeight: '800', color: COLORS.text, letterSpacing: 0.5 }}>
          {order.order_code}
        </Text>
        <View style={{
          backgroundColor:   statusColor + '18',
          borderRadius:      RADIUS.sm,
          paddingHorizontal: 8,
          paddingVertical:   3,
        }}>
          <Text style={{ fontSize: FONT_SIZES.xs, fontWeight: '700', color: statusColor }}>
            {STATUS_LABEL[order.status] ?? order.status}
          </Text>
        </View>
      </View>

      <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginTop: 4 }}>
        {date} · Agent: {order.agent.name.split(' ')[0]}
      </Text>

      <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginTop: 2 }}>
        {order.line_items.filter(i => i.fulfilled).map(i =>
          `${i.product_emoji} ${i.product_name} ×${i.quantity}`
        ).join(', ')}
      </Text>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.xs }}>
        <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted }}>
          {order.payment_method === 'cod' ? 'COD' : 'Prepaid'}
        </Text>
        <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.text }}>
          {formatCurrency(order.total)}
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function CustomerHistoryScreen() {
  const { id }       = useLocalSearchParams<{ id: string }>();
  const customerId   = Number(id);
  const { data, isLoading, error } = useCustomerHistory(customerId);

  if (isLoading) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Customer History', headerShown: true }} />
        <ActivityIndicator style={{ flex: 1 }} color={COLORS.brand} />
      </Screen>
    );
  }

  if (error || !data) {
    return (
      <Screen padded>
        <Stack.Screen options={{ title: 'Customer', headerShown: true }} />
        <Text style={{ color: COLORS.danger }}>Customer not found.</Text>
      </Screen>
    );
  }

  const { customer, orders } = data;
  const delivered = orders.filter(o => o.status === 'delivered').length;
  const totalSpend = orders
    .filter(o => o.status === 'delivered')
    .reduce((s, o) => s + o.total, 0);

  return (
    <>
      <Stack.Screen options={{ title: customer.name, headerShown: true }} />
      <Screen scrollable={false} padded={false}>
        <FlatList
          data={orders}
          keyExtractor={o => String(o.id)}
          contentContainerStyle={{
            paddingHorizontal: SPACING.base,
            paddingBottom:     SPACING['2xl'],
          }}
          ListHeaderComponent={
            <View>
              {/* Customer card */}
              <View style={{
                backgroundColor: COLORS.brand,
                borderRadius:    RADIUS.lg,
                padding:         SPACING.lg,
                marginTop:       SPACING.base,
                marginBottom:    SPACING.lg,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                  <View style={{
                    width: 40, height: 40,
                    borderRadius: RADIUS.full,
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Ionicons name="person" size={22} color="#fff" />
                  </View>
                  <View>
                    <Text style={{ color: '#fff', fontSize: FONT_SIZES.lg, fontWeight: '800' }}>
                      {customer.name}
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: FONT_SIZES.xs }}>
                      {customer.phone_number.replace(/^92/, '+92 ')}
                    </Text>
                  </View>
                </View>

                <View style={{
                  flexDirection: 'row', gap: SPACING.lg,
                  marginTop: SPACING.md, paddingTop: SPACING.md,
                  borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)',
                }}>
                  <View>
                    <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: FONT_SIZES.xs }}>Total Orders</Text>
                    <Text style={{ color: '#fff', fontSize: FONT_SIZES.base, fontWeight: '700', marginTop: 2 }}>
                      {orders.length}
                    </Text>
                  </View>
                  <View>
                    <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: FONT_SIZES.xs }}>Delivered</Text>
                    <Text style={{ color: '#fff', fontSize: FONT_SIZES.base, fontWeight: '700', marginTop: 2 }}>
                      {delivered}
                    </Text>
                  </View>
                  <View>
                    <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: FONT_SIZES.xs }}>Total Spend</Text>
                    <Text style={{ color: '#fff', fontSize: FONT_SIZES.base, fontWeight: '700', marginTop: 2 }}>
                      {formatCurrency(totalSpend)}
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={{
                fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.muted,
                textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: SPACING.sm,
              }}>
                All Orders ({orders.length})
              </Text>
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              emoji="📦"
              title="No orders yet"
              description="This customer hasn't placed any orders."
            />
          }
          renderItem={({ item }) => <OrderCard order={item} />}
        />
      </Screen>
    </>
  );
}
