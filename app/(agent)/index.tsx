import { useMemo }                                         from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { router }             from 'expo-router';
import { Ionicons }           from '@expo/vector-icons';

import { Screen }             from '@/components/ui/Screen';
import { LoadingSpinner }     from '@/components/ui/LoadingSpinner';
import { useAuthContext }     from '@/context/AuthContext';
import { useAgentOrders }     from '@/hooks/useAgentOrders';
import { useAgentCommission } from '@/hooks/useAgentCommission';
import { formatCurrency }     from '@/lib/utils';
import {
  COLORS, FONT_SIZES, RADIUS, SHADOW, SPACING,
} from '@/lib/theme';

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function StatCard({
  label, value, accent,
}: { label: string; value: string | number; accent?: string }) {
  return (
    <View style={{
      flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
      borderWidth: 1, borderColor: COLORS.border, padding: SPACING.sm,
      alignItems: 'center', gap: 2, ...SHADOW.sm,
    }}>
      <Text style={{ fontSize: FONT_SIZES.xl, fontWeight: '800', color: accent ?? COLORS.text }}>
        {value}
      </Text>
      <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, textAlign: 'center' }}>
        {label}
      </Text>
    </View>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <Text style={{
      fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.muted,
      textTransform: 'uppercase', letterSpacing: 0.6,
      marginTop: SPACING.lg, marginBottom: SPACING.sm,
    }}>
      {text}
    </Text>
  );
}

function QuickLink({
  icon, label, onPress, count,
}: { icon: string; label: string; onPress: () => void; count?: number }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
        borderWidth: 1, borderColor: COLORS.border,
        padding: SPACING.md, alignItems: 'center', gap: 6,
        opacity: pressed ? 0.8 : 1, ...SHADOW.sm,
      })}
    >
      <View style={{
        width: 36, height: 36, borderRadius: RADIUS.md,
        backgroundColor: COLORS.brandLight, alignItems: 'center', justifyContent: 'center',
      }}>
        <Ionicons name={icon as any} size={18} color={COLORS.brand} />
      </View>
      <Text style={{ fontSize: FONT_SIZES.xs, fontWeight: '600', color: COLORS.text, textAlign: 'center' }}>
        {label}
      </Text>
      {count !== undefined && count > 0 && (
        <View style={{
          position: 'absolute', top: 6, right: 6,
          backgroundColor: COLORS.danger, borderRadius: RADIUS.full,
          minWidth: 18, height: 18, paddingHorizontal: 4,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ fontSize: 10, fontWeight: '800', color: '#fff' }}>{count}</Text>
        </View>
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function AgentDashboard() {
  const { user, logout } = useAuthContext();

  const {
    data: orders = [], isLoading: ordersLoading, refetch, isRefetching,
  } = useAgentOrders(user?.id ?? 0);

  const {
    data: commission = [], isLoading: commLoading,
  } = useAgentCommission(user?.id ?? 0);

  const isLoading = ordersLoading || commLoading;

  // Counts
  const counts = useMemo(() => ({
    pending:          orders.filter(o => o.status === 'pending').length,
    confirmed:        orders.filter(o => o.status === 'confirmed').length,
    out_for_delivery: orders.filter(o => o.status === 'out_for_delivery').length,
    delivered:        orders.filter(o => o.status === 'delivered').length,
    needReupload:     orders.filter(o => o.payment_status === 'receipt_rejected').length,
    active:           orders.filter(o => !['delivered', 'cancelled', 'returned'].includes(o.status)).length,
  }), [orders]);

  // Commission totals
  const commTotals = useMemo(() => ({
    eligible:       commission.filter(c => c.commission_status === 'eligible')
                              .reduce((s, c) => s + c.commission_total, 0),
    inHold:         commission.filter(c => c.commission_status === 'in_hold')
                              .reduce((s, c) => s + c.commission_total, 0),
    inSettlement:   commission.filter(c => c.commission_status === 'in_settlement')
                              .reduce((s, c) => s + c.commission_total, 0),
    paid:           commission.filter(c => c.commission_status === 'paid')
                              .reduce((s, c) => s + c.commission_total, 0),
  }), [commission]);

  if (isLoading) return <LoadingSpinner fullScreen message="Loading…" />;

  return (
    <Screen scrollable={false} padded={false}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: SPACING.base, paddingBottom: SPACING['2xl'] }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.brand} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={{
          backgroundColor: COLORS.brand, borderRadius: RADIUS.lg,
          padding: SPACING.lg, marginTop: SPACING.base, marginBottom: SPACING.base,
        }}>
          <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: FONT_SIZES.xs }}>
            Welcome back
          </Text>
          <Text style={{ color: '#fff', fontSize: FONT_SIZES['2xl'], fontWeight: '800', marginTop: 2 }}>
            {user?.name?.split(' ')[0]}
          </Text>
          <View style={{
            marginTop: SPACING.sm, paddingTop: SPACING.sm,
            borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)',
            flexDirection: 'row', gap: SPACING.lg,
          }}>
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: FONT_SIZES.xs }}>Active Orders</Text>
              <Text style={{ color: '#fff', fontSize: FONT_SIZES.base, fontWeight: '700', marginTop: 2 }}>
                {counts.active}
              </Text>
            </View>
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: FONT_SIZES.xs }}>Total Delivered</Text>
              <Text style={{ color: '#fff', fontSize: FONT_SIZES.base, fontWeight: '700', marginTop: 2 }}>
                {counts.delivered}
              </Text>
            </View>
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: FONT_SIZES.xs }}>Eligible Commission</Text>
              <Text style={{ color: '#fff', fontSize: FONT_SIZES.base, fontWeight: '700', marginTop: 2 }}>
                {formatCurrency(commTotals.eligible)}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Action Required ── */}
        {counts.needReupload > 0 && (
          <>
            <SectionLabel text="Action Required" />
            <Pressable
              onPress={() => router.push('/(agent)/orders' as any)}
              style={({ pressed }) => ({
                backgroundColor: COLORS.danger + '10', borderRadius: RADIUS.md,
                borderWidth: 1, borderColor: COLORS.danger + '50',
                padding: SPACING.md, flexDirection: 'row',
                alignItems: 'center', gap: SPACING.md,
                opacity: pressed ? 0.8 : 1, ...SHADOW.sm,
              })}
            >
              <View style={{
                width: 36, height: 36, borderRadius: RADIUS.md,
                backgroundColor: COLORS.danger + '18', alignItems: 'center', justifyContent: 'center',
              }}>
                <Ionicons name="warning" size={18} color={COLORS.danger} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.danger }}>
                  {counts.needReupload} receipt{counts.needReupload !== 1 ? 's' : ''} need re-upload
                </Text>
                <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginTop: 2 }}>
                  Owner rejected — tap to open your orders
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={COLORS.danger} />
            </Pressable>
          </>
        )}

        {/* ── Order pipeline ── */}
        <SectionLabel text="My Orders" />
        <View style={{ flexDirection: 'row', gap: SPACING.xs }}>
          <StatCard label="Pending"   value={counts.pending}
            accent={counts.pending > 0 ? COLORS.warning : undefined} />
          <StatCard label="Confirmed" value={counts.confirmed} />
          <StatCard label="In Transit" value={counts.out_for_delivery}
            accent={counts.out_for_delivery > 0 ? COLORS.info : undefined} />
          <StatCard label="Delivered" value={counts.delivered} accent={COLORS.teal} />
        </View>

        {/* ── Commission ── */}
        <SectionLabel text="My Commission" />
        <View style={{
          backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
          borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, ...SHADOW.sm,
        }}>
          {[
            { label: 'Eligible',      amount: commTotals.eligible,     color: COLORS.teal },
            { label: 'In Hold',       amount: commTotals.inHold,       color: COLORS.muted },
            { label: 'In Settlement', amount: commTotals.inSettlement, color: COLORS.brand },
            { label: 'Paid Out',      amount: commTotals.paid,         color: COLORS.teal },
          ].map((row, i, arr) => (
            <View key={row.label} style={{
              flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
              paddingVertical: 6,
              borderBottomWidth: i < arr.length - 1 ? 1 : 0,
              borderBottomColor: COLORS.border,
            }}>
              <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.muted }}>{row.label}</Text>
              <Text style={{
                fontSize: FONT_SIZES.sm, fontWeight: '700',
                color: row.amount > 0 ? row.color : COLORS.muted,
              }}>
                {formatCurrency(row.amount)}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Quick links ── */}
        <SectionLabel text="Quick Access" />
        <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
          <QuickLink
            icon="list-outline"
            label="My Orders"
            count={counts.needReupload}
            onPress={() => router.push('/(agent)/orders' as any)}
          />
          <QuickLink
            icon="add-circle-outline"
            label="New Order"
            onPress={() => router.push('/(agent)/new-order' as any)}
          />
          <QuickLink
            icon="wallet-outline"
            label="Commission"
            onPress={() => router.push('/(agent)/commission' as any)}
          />
        </View>

        {/* ── Sign out ── */}
        <Pressable
          onPress={logout}
          style={({ pressed }) => ({
            marginTop: SPACING.xl, paddingVertical: SPACING.sm,
            alignItems: 'center', opacity: pressed ? 0.6 : 1,
          })}
        >
          <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted }}>
            Sign out · {user?.name}
          </Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
