import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { router }                                          from 'expo-router';
import { Ionicons }                                        from '@expo/vector-icons';

import { Screen }            from '@/components/ui/Screen';
import { EmptyState }        from '@/components/ui/EmptyState';
import { LoadingSpinner }    from '@/components/ui/LoadingSpinner';
import { usePendingReceipts } from '@/hooks/useReceiptVerification';
import { OrderFull }         from '@/types';
import { formatCurrency }    from '@/lib/utils';
import {
  COLORS, FONT_SIZES, RADIUS, SHADOW, SPACING,
} from '@/lib/theme';

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

function ReceiptCard({ order, onPress }: { order: OrderFull; onPress: () => void }) {
  const receipt = order.payment_receipt;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: COLORS.surface,
        borderRadius:    RADIUS.md,
        borderWidth:     1.5,
        borderColor:     COLORS.warning,
        padding:         SPACING.md,
        marginBottom:    SPACING.sm,
        opacity:         pressed ? 0.85 : 1,
        ...SHADOW.sm,
      })}
    >
      {/* ── Header ── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xs }}>
        <Text style={{
          flex: 1, fontSize: FONT_SIZES.sm, fontWeight: '700',
          color: COLORS.text, letterSpacing: 0.5,
        }}>
          {order.order_code}
        </Text>
        <View style={{
          backgroundColor:   COLORS.warningLight,
          borderRadius:      RADIUS.sm,
          paddingHorizontal: 8, paddingVertical: 2,
        }}>
          <Text style={{ fontSize: FONT_SIZES.xs, fontWeight: '600', color: COLORS.warning }}>
            Awaiting Verification
          </Text>
        </View>
      </View>

      {/* ── Agent + customer ── */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="person-outline" size={12} color={COLORS.muted} />
          <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted }}>
            {order.agent.name}
          </Text>
        </View>
        <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.textSecondary }}>
          {order.customer.name}
        </Text>
      </View>

      {/* ── Receipt info + total ── */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="document-attach-outline" size={14} color={COLORS.muted} />
          <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted }} numberOfLines={1}>
            {receipt?.file_name ?? 'No file'}
          </Text>
        </View>
        <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.text }}>
          {formatCurrency(order.total)}
        </Text>
      </View>

      {/* ── CTA ── */}
      <View style={{
        flexDirection:  'row',
        alignItems:     'center',
        gap:            SPACING.xs,
        marginTop:      SPACING.sm,
        paddingTop:     SPACING.sm,
        borderTopWidth: 1,
        borderTopColor: COLORS.warningLight,
      }}>
        <Ionicons name="eye-outline" size={14} color={COLORS.warning} />
        <Text style={{ flex: 1, fontSize: FONT_SIZES.xs, color: COLORS.warning, fontWeight: '600' }}>
          Tap to verify or reject
        </Text>
        <Ionicons name="chevron-forward" size={14} color={COLORS.warning} />
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function OwnerReceiptsScreen() {
  const { data: receipts = [], isLoading, refetch, isRefetching } = usePendingReceipts();

  return (
    <Screen>
      {/* ── Header strip ── */}
      {receipts.length > 0 && (
        <View style={{
          flexDirection:     'row',
          alignItems:        'center',
          backgroundColor:   COLORS.warningLight,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.warning,
          paddingHorizontal: SPACING.base,
          paddingVertical:   SPACING.sm,
        }}>
          <Ionicons name="time-outline" size={16} color={COLORS.warning} />
          <Text style={{
            flex:       1,
            marginLeft: SPACING.xs,
            fontSize:   FONT_SIZES.sm,
            fontWeight: '700',
            color:      COLORS.warning,
          }}>
            {receipts.length} receipt{receipts.length !== 1 ? 's' : ''} awaiting verification
          </Text>
        </View>
      )}

      {isLoading
        ? <LoadingSpinner message="Loading receipts…" />
        : (
          <FlatList
            data={receipts}
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
                emoji="✅"
                title="All receipts verified"
                description="No prepaid receipts are waiting for your review."
              />
            }
            renderItem={({ item }) => (
              <ReceiptCard
                order={item}
                onPress={() => router.push(`/(owner)/receipts/${item.id}` as any)}
              />
            )}
          />
        )
      }
    </Screen>
  );
}
