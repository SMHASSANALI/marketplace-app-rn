import { FlatList, RefreshControl, Text, View } from 'react-native';
import { Ionicons }        from '@expo/vector-icons';

import { Screen }             from '@/components/ui/Screen';
import { LoadingSpinner }     from '@/components/ui/LoadingSpinner';
import { EmptyState }         from '@/components/ui/EmptyState';
import { useAuthContext }     from '@/context/AuthContext';
import { useAgentCommission } from '@/hooks/useAgentCommission';
import { AgentOrderCommission, CommissionStatus } from '@/types';
import { formatCurrency }     from '@/lib/utils';
import {
  COLORS, FONT_SIZES, RADIUS, SHADOW, SPACING,
} from '@/lib/theme';

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<CommissionStatus, { label: string; color: string; icon: string }> = {
  in_hold:                { label: 'In Hold',          color: COLORS.muted,    icon: 'time-outline' },
  awaiting_reconciliation:{ label: 'Pending Payment',  color: COLORS.warning,  icon: 'hourglass-outline' },
  eligible:               { label: 'Eligible',         color: COLORS.info,     icon: 'checkmark-circle-outline' },
  in_settlement:          { label: 'In Settlement',    color: COLORS.brand,    icon: 'sync-outline' },
  paid:                   { label: 'Paid',             color: COLORS.teal,     icon: 'checkmark-circle' },
};

// ---------------------------------------------------------------------------
// Commission row
// ---------------------------------------------------------------------------

function CommissionRow({ item }: { item: AgentOrderCommission }) {
  const cfg   = STATUS_CONFIG[item.commission_status];
  const inHold = item.commission_status === 'in_hold';

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
      {/* Order code + status badge */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.text }}>
          {item.order_code}
        </Text>
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 3,
          backgroundColor: cfg.color + '18',
          borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 2,
        }}>
          <Ionicons name={cfg.icon as any} size={10} color={cfg.color} />
          <Text style={{ fontSize: FONT_SIZES.xs, fontWeight: '700', color: cfg.color }}>
            {cfg.label}
          </Text>
        </View>
      </View>

      {/* Commission amount */}
      <Text style={{
        fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.text, marginTop: 4,
      }}>
        {formatCurrency(item.commission_total)}
      </Text>

      {/* Hold countdown */}
      {inHold && item.hold_info && (
        <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginTop: 4 }}>
          {item.hold_info.remaining_days} day{item.hold_info.remaining_days !== 1 ? 's' : ''} remaining in hold
          {' · '}hold ends {item.hold_info.hold_ends_at}
        </Text>
      )}

      {/* Settlement reference */}
      {(item.commission_status === 'in_settlement' || item.commission_status === 'paid') && item.settlement_id && (
        <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginTop: 4 }}>
          Settlement #{item.settlement_id} · {item.settlement_status}
        </Text>
      )}

      {/* Delivered date */}
      {item.delivered_at && (
        <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginTop: 2 }}>
          Delivered {new Date(item.delivered_at).toLocaleDateString('en-PK', {
            day: 'numeric', month: 'short', year: 'numeric',
          })}
        </Text>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function AgentCommissionScreen() {
  const { user } = useAuthContext();
  const { data: items = [], isLoading, isRefetching, refetch } = useAgentCommission(user?.id ?? 0);

  if (isLoading) return <LoadingSpinner fullScreen message="Loading commission…" />;

  const eligible   = items.filter(i => i.commission_status === 'eligible');
  const inHold     = items.filter(i => i.commission_status === 'in_hold');
  const settling   = items.filter(i => i.commission_status === 'in_settlement');
  const paid       = items.filter(i => i.commission_status === 'paid');

  const totalEligible   = eligible.reduce((s, i) => s + i.commission_total, 0);
  const totalInHold     = inHold.reduce((s, i) => s + i.commission_total, 0);
  const totalSettling   = settling.reduce((s, i) => s + i.commission_total, 0);

  return (
    <Screen scrollable={false} padded={false}>
      <FlatList
        data={items}
        keyExtractor={i => String(i.order_id)}
        contentContainerStyle={{
          paddingHorizontal: SPACING.base,
          paddingTop:        SPACING.base,
          paddingBottom:     SPACING['2xl'],
        }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.brand} />
        }
        ListHeaderComponent={
          <View style={{ marginBottom: SPACING.md, gap: SPACING.sm }}>
            {/* Summary cards row */}
            <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
              {/* Eligible */}
              <View style={{
                flex: 1, backgroundColor: COLORS.info + '18',
                borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.info + '40',
                padding: SPACING.sm, alignItems: 'center',
              }}>
                <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted }}>Eligible</Text>
                <Text style={{ fontSize: FONT_SIZES.lg, fontWeight: '800', color: COLORS.info }}>
                  {formatCurrency(totalEligible)}
                </Text>
                <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted }}>
                  {eligible.length} order{eligible.length !== 1 ? 's' : ''}
                </Text>
              </View>
              {/* In Hold */}
              <View style={{
                flex: 1, backgroundColor: COLORS.surfaceAlt,
                borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border,
                padding: SPACING.sm, alignItems: 'center',
              }}>
                <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted }}>In Hold</Text>
                <Text style={{ fontSize: FONT_SIZES.lg, fontWeight: '800', color: COLORS.muted }}>
                  {formatCurrency(totalInHold)}
                </Text>
                <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted }}>
                  {inHold.length} order{inHold.length !== 1 ? 's' : ''}
                </Text>
              </View>
              {/* Settling */}
              {totalSettling > 0 && (
                <View style={{
                  flex: 1, backgroundColor: COLORS.brand + '12',
                  borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.brand + '40',
                  padding: SPACING.sm, alignItems: 'center',
                }}>
                  <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted }}>Settling</Text>
                  <Text style={{ fontSize: FONT_SIZES.lg, fontWeight: '800', color: COLORS.brand }}>
                    {formatCurrency(totalSettling)}
                  </Text>
                  <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted }}>
                    {settling.length} order{settling.length !== 1 ? 's' : ''}
                  </Text>
                </View>
              )}
            </View>

            {paid.length > 0 && (
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 6,
              }}>
                <Ionicons name="checkmark-circle" size={14} color={COLORS.teal} />
                <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted }}>
                  {paid.length} order{paid.length !== 1 ? 's' : ''} paid
                </Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            emoji="💰"
            title="No commission yet"
            description="Commission from your delivered orders will appear here."
          />
        }
        renderItem={({ item }) => <CommissionRow item={item} />}
      />
    </Screen>
  );
}
