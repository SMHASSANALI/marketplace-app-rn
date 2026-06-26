import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { router }        from 'expo-router';
import { Ionicons }      from '@expo/vector-icons';

import { Screen }            from '@/components/ui/Screen';
import { LoadingSpinner }    from '@/components/ui/LoadingSpinner';
import { EmptyState }        from '@/components/ui/EmptyState';
import { useAllDeposits }    from '@/hooks/useCODReconciliation';
import { DepositFull }       from '@/types';
import { formatCurrency }    from '@/lib/utils';
import {
  COLORS, FONT_SIZES, RADIUS, SHADOW, SPACING,
} from '@/lib/theme';

// ---------------------------------------------------------------------------
// Deposit row card
// ---------------------------------------------------------------------------

function DepositCard({ deposit }: { deposit: DepositFull }) {
  const pending    = !deposit.owner_confirmed;
  const hasMismatch = deposit.collections.some(c => c.mismatch_flag);

  return (
    <Pressable
      onPress={() => router.push(`/(owner)/reconciliation/${deposit.id}` as any)}
      style={{
        backgroundColor: COLORS.surface,
        borderRadius:    RADIUS.md,
        borderWidth:     1,
        borderColor:     pending ? COLORS.warning + '60' : COLORS.border,
        padding:         SPACING.md,
        marginBottom:    SPACING.sm,
        ...SHADOW.sm,
      }}
    >
      {/* Top row: rider + status badge */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          <Ionicons
            name={pending ? 'cash-outline' : 'checkmark-circle-outline'}
            size={20}
            color={pending ? COLORS.warning : COLORS.teal}
          />
          <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.text, flex: 1 }}>
            {deposit.rider.name}
          </Text>
        </View>
        <View style={{
          backgroundColor: pending ? COLORS.warning + '20' : COLORS.teal + '20',
          borderRadius:    RADIUS.full,
          paddingHorizontal: 8, paddingVertical: 2,
        }}>
          <Text style={{
            fontSize: FONT_SIZES.xs, fontWeight: '700',
            color: pending ? COLORS.warning : COLORS.teal,
          }}>
            {pending ? 'Pending' : 'Confirmed'}
          </Text>
        </View>
      </View>

      {/* Amount + ref row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.xs }}>
        <Text style={{ fontSize: FONT_SIZES['2xl'], fontWeight: '800', color: COLORS.text }}>
          {formatCurrency(deposit.deposit_amount)}
        </Text>
        <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, alignSelf: 'flex-end' }}>
          {deposit.collections.length} order{deposit.collections.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Reference + date */}
      <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginTop: 4 }}>
        Ref: {deposit.deposit_reference ?? '—'}
      </Text>
      <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginTop: 2 }}>
        {new Date(deposit.deposited_at).toLocaleDateString('en-PK', {
          day: 'numeric', month: 'short', year: 'numeric',
        })}
      </Text>

      {/* Mismatch warning */}
      {hasMismatch && (
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 4,
          marginTop: SPACING.xs,
          backgroundColor: COLORS.danger + '12',
          borderRadius: RADIUS.sm, padding: SPACING.xs,
        }}>
          <Ionicons name="alert-circle-outline" size={12} color={COLORS.danger} />
          <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.danger }}>
            Amount mismatch detected
          </Text>
        </View>
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ReconciliationListScreen() {
  const { data: deposits = [], isLoading, isRefetching, refetch } = useAllDeposits();

  if (isLoading) return <LoadingSpinner fullScreen message="Loading deposits…" />;

  const pending   = deposits.filter(d => !d.owner_confirmed);
  const confirmed = deposits.filter(d =>  d.owner_confirmed);

  return (
    <Screen scrollable={false} padded={false}>
      <FlatList
        data={deposits}
        keyExtractor={d => String(d.id)}
        contentContainerStyle={{
          paddingHorizontal: SPACING.base,
          paddingTop:        SPACING.base,
          paddingBottom:     SPACING['2xl'],
        }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.brand} />
        }
        ListHeaderComponent={
          pending.length > 0 ? (
            <View style={{
              backgroundColor: COLORS.warning + '18',
              borderRadius:    RADIUS.md,
              borderWidth:     1,
              borderColor:     COLORS.warning + '50',
              padding:         SPACING.md,
              marginBottom:    SPACING.md,
              flexDirection:   'row',
              alignItems:      'center',
              gap:             SPACING.sm,
            }}>
              <Ionicons name="time-outline" size={20} color={COLORS.warning} />
              <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.text, flex: 1 }}>
                <Text style={{ fontWeight: '700' }}>{pending.length}</Text>
                {' '}deposit{pending.length !== 1 ? 's' : ''} awaiting confirmation
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            emoji="💵"
            title="No deposits yet"
            description="Rider cash deposits will appear here once they log them."
          />
        }
        ListFooterComponent={
          confirmed.length > 0 ? (
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              marginTop: SPACING.md, marginBottom: SPACING.sm,
            }}>
              <Ionicons name="checkmark-circle" size={14} color={COLORS.teal} />
              <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted }}>
                {confirmed.length} confirmed deposit{confirmed.length !== 1 ? 's' : ''}
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => <DepositCard deposit={item} />}
      />
    </Screen>
  );
}
