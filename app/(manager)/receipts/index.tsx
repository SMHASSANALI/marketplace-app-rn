import { FlatList, RefreshControl, Text, View } from 'react-native';
import { Pressable }       from 'react-native';
import { router }          from 'expo-router';
import { Ionicons }        from '@expo/vector-icons';

import { Screen }          from '@/components/ui/Screen';
import { EmptyState }      from '@/components/ui/EmptyState';
import { LoadingSpinner }  from '@/components/ui/LoadingSpinner';
import { useAuthContext }  from '@/context/AuthContext';
import { usePendingReceipts } from '@/hooks/useReceiptVerification';
import { OrderFull }       from '@/types';
import { formatCurrency }  from '@/lib/utils';
import {
  COLORS, FONT_SIZES, RADIUS, SHADOW, SPACING,
} from '@/lib/theme';

function ReceiptCard({ order, canVerify, onPress }: {
  order:     OrderFull;
  canVerify: boolean;
  onPress:   () => void;
}) {
  const receipt = order.payment_receipt;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.md, borderWidth: 1.5,
        borderColor: canVerify ? COLORS.warning : COLORS.border,
        padding: SPACING.md, marginBottom: SPACING.sm,
        opacity: pressed ? 0.85 : 1, ...SHADOW.sm,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xs }}>
        <Text style={{ flex: 1, fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.text }}>
          {order.order_code}
        </Text>
        <View style={{
          backgroundColor: canVerify ? COLORS.warningLight : COLORS.surfaceAlt,
          borderRadius: RADIUS.sm, paddingHorizontal: 8, paddingVertical: 2,
        }}>
          <Text style={{
            fontSize: FONT_SIZES.xs, fontWeight: '600',
            color: canVerify ? COLORS.warning : COLORS.muted,
          }}>
            {canVerify ? 'Awaiting Verification' : 'View Only'}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.xs }}>
        <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted }}>{order.agent.name}</Text>
        <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.textSecondary }}>{order.customer.name}</Text>
      </View>

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
    </Pressable>
  );
}

export default function ManagerReceiptsScreen() {
  const { hasPermission } = useAuthContext();
  const { data: receipts = [], isLoading, refetch, isRefetching } = usePendingReceipts();
  const canVerify = hasPermission('verify_receipts');

  return (
    <Screen scrollable={false} padded={false}>
      {receipts.length > 0 && (
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          backgroundColor: canVerify ? COLORS.warningLight : COLORS.surfaceAlt,
          borderBottomWidth: 1,
          borderBottomColor: canVerify ? COLORS.warning : COLORS.border,
          paddingHorizontal: SPACING.base, paddingVertical: SPACING.sm,
        }}>
          <Ionicons
            name={canVerify ? 'time-outline' : 'eye-outline'}
            size={16}
            color={canVerify ? COLORS.warning : COLORS.muted}
          />
          <Text style={{
            flex: 1, marginLeft: SPACING.xs, fontSize: FONT_SIZES.sm, fontWeight: '700',
            color: canVerify ? COLORS.warning : COLORS.muted,
          }}>
            {receipts.length} receipt{receipts.length !== 1 ? 's' : ''} pending
            {!canVerify && ' — view only (no verify permission)'}
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
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.teal} />
            }
            ListEmptyComponent={
              <EmptyState emoji="✅" title="No pending receipts" description="All prepaid receipts have been verified." />
            }
            renderItem={({ item }) => (
              <ReceiptCard
                order={item}
                canVerify={canVerify}
                onPress={() => router.push(`/(manager)/receipts/${item.id}` as any)}
              />
            )}
          />
        )
      }
    </Screen>
  );
}
