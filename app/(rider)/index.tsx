import { useMemo }                                         from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { router }                    from 'expo-router';
import { Ionicons }                  from '@expo/vector-icons';

import { Screen }                    from '@/components/ui/Screen';
import { LoadingSpinner }            from '@/components/ui/LoadingSpinner';
import { useAuthContext }            from '@/context/AuthContext';
import { useRiderDeliveries, useUndepositedCollections } from '@/hooks/useRiderDeliveries';
import { CashCollection } from '@/types';
import { formatCurrency }            from '@/lib/utils';
import {
  COLORS, FONT_SIZES, RADIUS, SHADOW, SPACING,
} from '@/lib/theme';

// ---------------------------------------------------------------------------
// Helpers
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

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function RiderDashboard() {
  const { user, logout } = useAuthContext();

  const {
    data: deliveries = [], isLoading: delLoading, refetch, isRefetching,
  } = useRiderDeliveries(user?.id ?? 0);

  const {
    data: collections, isLoading: colLoading,
  } = useUndepositedCollections(user?.id ?? 0);

  const isLoading = delLoading || colLoading;

  const stats = useMemo(() => {
    const assigned         = deliveries.filter(o => o.status === 'assigned').length;
    const out_for_delivery = deliveries.filter(o => o.status === 'out_for_delivery').length;
    const delivered        = deliveries.filter(o => o.status === 'delivered').length;
    const totalEarnings    = deliveries
      .filter(o => o.status === 'delivered')
      .reduce((s, o) => s + (o.rider_payout_snapshot ?? 0), 0);
    return { assigned, out_for_delivery, delivered, totalEarnings };
  }, [deliveries]);

  const undepositedAmount = useMemo(
    () => (collections ?? []).reduce((s: number, c: CashCollection) => s + c.amount_collected, 0),
    [collections],
  );

  if (isLoading) return <LoadingSpinner fullScreen message="Loading…" />;

  return (
    <Screen scrollable={false} padded={false}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: SPACING.base, paddingBottom: SPACING['2xl'] }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.info} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={{
          backgroundColor: COLORS.info, borderRadius: RADIUS.lg,
          padding: SPACING.lg, marginTop: SPACING.base, marginBottom: SPACING.base,
        }}>
          <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: FONT_SIZES.xs }}>
            Rider Dashboard
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
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: FONT_SIZES.xs }}>Active</Text>
              <Text style={{ color: '#fff', fontSize: FONT_SIZES.base, fontWeight: '700', marginTop: 2 }}>
                {stats.assigned + stats.out_for_delivery}
              </Text>
            </View>
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: FONT_SIZES.xs }}>Delivered</Text>
              <Text style={{ color: '#fff', fontSize: FONT_SIZES.base, fontWeight: '700', marginTop: 2 }}>
                {stats.delivered}
              </Text>
            </View>
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: FONT_SIZES.xs }}>Earnings</Text>
              <Text style={{ color: '#fff', fontSize: FONT_SIZES.base, fontWeight: '700', marginTop: 2 }}>
                {formatCurrency(stats.totalEarnings)}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Cash deposit alert ── */}
        {undepositedAmount > 0 && (
          <>
            <SectionLabel text="Action Required" />
            <Pressable
              onPress={() => router.push('/(rider)/deposits' as any)}
              style={({ pressed }) => ({
                backgroundColor: COLORS.warning + '12', borderRadius: RADIUS.md,
                borderWidth: 1, borderColor: COLORS.warning + '50',
                padding: SPACING.md, flexDirection: 'row',
                alignItems: 'center', gap: SPACING.md,
                opacity: pressed ? 0.8 : 1, ...SHADOW.sm,
              })}
            >
              <View style={{
                width: 36, height: 36, borderRadius: RADIUS.md,
                backgroundColor: COLORS.warning + '20',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Ionicons name="cash-outline" size={18} color={COLORS.warning} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.warning }}>
                  {formatCurrency(undepositedAmount)} cash to deposit
                </Text>
                <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginTop: 2 }}>
                  Tap to log a bank deposit
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={COLORS.warning} />
            </Pressable>
          </>
        )}

        {/* ── Delivery pipeline ── */}
        <SectionLabel text="Delivery Pipeline" />
        <View style={{ flexDirection: 'row', gap: SPACING.xs }}>
          <StatCard label="Assigned"   value={stats.assigned}
            accent={stats.assigned > 0 ? COLORS.info : undefined} />
          <StatCard label="En Route"   value={stats.out_for_delivery}
            accent={stats.out_for_delivery > 0 ? COLORS.brand : undefined} />
          <StatCard label="Delivered"  value={stats.delivered} accent={COLORS.teal} />
        </View>

        {/* ── Earnings summary ── */}
        <SectionLabel text="Earnings" />
        <View style={{
          backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
          borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, ...SHADOW.sm,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
            <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.muted }}>Deliveries completed</Text>
            <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.text }}>
              {stats.delivered}
            </Text>
          </View>
          <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: 4 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
            <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.muted }}>Total Earnings</Text>
            <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '800', color: COLORS.teal }}>
              {formatCurrency(stats.totalEarnings)}
            </Text>
          </View>
        </View>

        {/* ── Quick links ── */}
        <SectionLabel text="Quick Access" />
        <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
          <Pressable
            onPress={() => router.push('/(rider)/deliveries' as any)}
            style={({ pressed }) => ({
              flex: 1, backgroundColor: COLORS.info, borderRadius: RADIUS.md,
              padding: SPACING.md, alignItems: 'center', gap: 6,
              opacity: pressed ? 0.8 : 1, ...SHADOW.sm,
            })}
          >
            <Ionicons name="bicycle-outline" size={22} color="#fff" />
            <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: '#fff' }}>
              Deliveries
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(rider)/deposits' as any)}
            style={({ pressed }) => ({
              flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
              borderWidth: 1, borderColor: COLORS.border,
              padding: SPACING.md, alignItems: 'center', gap: 6,
              opacity: pressed ? 0.8 : 1, ...SHADOW.sm,
            })}
          >
            <Ionicons name="wallet-outline" size={22} color={COLORS.muted} />
            <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.muted }}>
              Deposits
            </Text>
          </Pressable>
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
