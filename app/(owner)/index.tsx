import React from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router }          from 'expo-router';
import { Ionicons }        from '@expo/vector-icons';
import { SafeAreaView }    from 'react-native-safe-area-context';
import { LoadingSpinner }  from '@/components/ui/LoadingSpinner';
import { useAuthContext }  from '@/context/AuthContext';
import { useOwnerSummary } from '@/hooks/useDashboard';
import { formatCurrency }  from '@/lib/utils';

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  bg:           '#F8FAFC',
  surface:      '#FFFFFF',
  border:       '#E2E8F0',
  brand:        '#4F46E5',
  brandDark:    '#4338CA',
  brandLight:   '#EEF2FF',
  text:         '#0F172A',
  textSub:      '#475569',
  textMeta:     '#94A3B8',
  amber:        '#B45309', amberBg:  '#FEF3C7',
  sky:          '#0369A1', skyBg:    '#E0F2FE',
  emerald:      '#047857', emeraldBg:'#D1FAE5',
  rose:         '#BE123C', roseBg:   '#FFE4E6',
} as const;

const SH = {
  shadowColor:   '#64748B',
  shadowOffset:  { width: 0, height: 4 },
  shadowOpacity: 0.04,
  shadowRadius:  12,
  elevation:     2,
};

// ─── Pipeline card ────────────────────────────────────────────────────────────

function PipelineCard({
  label, count, icon, color, bg,
}: { label: string; count: number; icon: string; color: string; bg: string }) {
  return (
    <View style={[s.pipeCard, SH]}>
      <View style={[s.pipeIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon as any} size={15} color={color} />
      </View>
      <Text style={[s.pipeCount, { color }]}>{count}</Text>
      <Text style={s.pipeLabel}>{label}</Text>
    </View>
  );
}

// ─── Action card ─────────────────────────────────────────────────────────────

function ActionCard({
  icon, label, count, color, bg, onPress,
}: { icon: string; label: string; count: number; color: string; bg: string; onPress: () => void }) {
  const active = count > 0;
  return (
    <Pressable
      onPress={active ? onPress : undefined}
      style={({ pressed }) => [
        s.actionCard,
        SH,
        active && { borderColor: color + '35' },
        pressed && { opacity: 0.75 },
      ]}
    >
      <View style={[s.actionIcon, { backgroundColor: active ? bg : '#F1F5F9' }]}>
        <Ionicons name={icon as any} size={17} color={active ? color : C.textMeta} />
      </View>
      <Text
        style={[s.actionLabel, { color: active ? C.text : C.textMeta }]}
        numberOfLines={2}
      >
        {label}
      </Text>
      <View style={[s.countBadge, { backgroundColor: active ? bg : '#F1F5F9' }]}>
        <Text style={[s.countText, { color: active ? color : C.textMeta }]}>{count}</Text>
      </View>
      {active && (
        <Ionicons name="chevron-forward" size={14} color={color} />
      )}
    </Pressable>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function OwnerDashboard() {
  const { user, logout }      = useAuthContext();
  const { data: summary, isLoading, refetch, isRefetching } = useOwnerSummary();

  if (isLoading) return <LoadingSpinner fullScreen message="Loading dashboard…" />;

  const sm           = summary!;
  const displayName  = user?.name?.replace(/\s*\(.*\)/, '').trim() ?? 'User';
  const initials     = displayName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
  const totalActions = sm.pending_receipts + sm.pending_deposits
    + sm.pending_settlements + sm.orders.pending + sm.low_stock_products;

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={C.brand} />}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Hero ── */}
        <View style={s.hero}>

          {/* Top row — avatar + greeting */}
          <View style={s.heroTop}>
            <View style={s.avatarWrap}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{initials}</Text>
              </View>
              <View style={s.onlineDot} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.greet}>Welcome back</Text>
              <Text style={s.heroName} numberOfLines={1}>{displayName}</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={s.heroDivider} />

          {/* Metrics — 3 columns */}
          <View style={s.metricsRow}>
            <View style={s.metricCell}>
              <Text style={s.metricValue}>{formatCurrency(sm.revenue.total_gmv)}</Text>
              <Text style={s.metricLabel}>Total GMV</Text>
            </View>
            <View style={s.metricSep} />
            <View style={s.metricCell}>
              <Text style={s.metricValue}>{formatCurrency(sm.revenue.total_commission)}</Text>
              <Text style={s.metricLabel}>Commission Paid</Text>
            </View>
            <View style={s.metricSep} />
            <View style={s.metricCell}>
              <Text style={s.metricValue}>{sm.orders.total}</Text>
              <Text style={s.metricLabel}>All Orders</Text>
            </View>
          </View>
        </View>

        {/* ── Order Pipeline ── */}
        <Text style={s.sectionHead}>Order Pipeline</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.pipeRow}
        >
          <PipelineCard label="Pending"    count={sm.orders.pending}          icon="time-outline"              color={C.amber}   bg={C.amberBg}   />
          <PipelineCard label="Confirmed"  count={sm.orders.confirmed}        icon="checkmark-circle-outline"  color={C.sky}     bg={C.skyBg}     />
          <PipelineCard label="In Transit" count={sm.orders.out_for_delivery} icon="bicycle-outline"           color={C.brand}   bg={C.brandLight}/>
          <PipelineCard label="Delivered"  count={sm.orders.delivered}        icon="bag-check-outline"         color={C.emerald} bg={C.emeraldBg} />
        </ScrollView>

        {/* ── Action Required ── */}
        <Text style={s.sectionHead}>Action Required</Text>

        {totalActions === 0 ? (
          <View style={[s.clearCard, SH]}>
            <View style={[s.actionIcon, { backgroundColor: C.emeraldBg }]}>
              <Ionicons name="checkmark-circle" size={18} color={C.emerald} />
            </View>
            <Text style={[s.actionLabel, { color: C.emerald }]}>
              All caught up — no pending actions
            </Text>
          </View>
        ) : (
          <View style={s.actionsWrap}>
            <ActionCard
              icon="document-text-outline"
              label={`${sm.orders.pending} order${sm.orders.pending !== 1 ? 's' : ''} awaiting confirmation`}
              count={sm.orders.pending}
              color={C.amber} bg={C.amberBg}
              onPress={() => router.push('/(owner)/orders' as any)}
            />
            <ActionCard
              icon="receipt-outline"
              label={`${sm.pending_receipts} prepaid receipt${sm.pending_receipts !== 1 ? 's' : ''} to verify`}
              count={sm.pending_receipts}
              color={C.sky} bg={C.skyBg}
              onPress={() => router.push('/(owner)/receipts' as any)}
            />
            <ActionCard
              icon="cash-outline"
              label={`${sm.pending_deposits} cash deposit${sm.pending_deposits !== 1 ? 's' : ''} to confirm`}
              count={sm.pending_deposits}
              color={C.brand} bg={C.brandLight}
              onPress={() => router.push('/(owner)/reconciliation' as any)}
            />
            <ActionCard
              icon="people-outline"
              label={`${sm.pending_settlements} settlement${sm.pending_settlements !== 1 ? 's' : ''} to approve`}
              count={sm.pending_settlements}
              color={C.brand} bg={C.brandLight}
              onPress={() => router.push('/(owner)/settlements' as any)}
            />
            <ActionCard
              icon="alert-circle-outline"
              label={`${sm.low_stock_products} product${sm.low_stock_products !== 1 ? 's' : ''} low on stock`}
              count={sm.low_stock_products}
              color={C.rose} bg={C.roseBg}
              onPress={() => router.push('/(owner)/products' as any)}
            />
          </View>
        )}

        {/* Sign out */}
        <Pressable
          onPress={logout}
          style={({ pressed }) => [s.signOut, pressed && { opacity: 0.45 }]}
        >
          <Ionicons name="log-out-outline" size={13} color={C.textMeta} />
          <Text style={s.signOutText}>Sign out · {displayName}</Text>
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: C.bg },
  scroll:{ paddingHorizontal: 16, paddingBottom: 44, paddingTop: 12 },

  // Hero
  hero:      { backgroundColor: C.brand, borderRadius: 16, padding: 20, marginBottom: 24 },
  heroTop:   { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  avatarWrap:{ position: 'relative' },
  avatar:    { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  avatarText:{ color: '#fff', fontSize: 15, fontWeight: '700' },
  onlineDot: { position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, borderRadius: 6, backgroundColor: '#34D399', borderWidth: 2, borderColor: C.brand },
  greet:     { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '500', letterSpacing: 0.2 },
  heroName:  { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 2, letterSpacing: -0.3 },
  heroDivider:{ height: 1, backgroundColor: 'rgba(255,255,255,0.18)', marginBottom: 16 },
  metricsRow:{ flexDirection: 'row', alignItems: 'center' },
  metricCell:{ flex: 1, alignItems: 'center', gap: 3 },
  metricValue:{ color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  metricLabel:{ color: 'rgba(255,255,255,0.58)', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, textAlign: 'center' },
  metricSep: { width: 1, height: 34, backgroundColor: 'rgba(255,255,255,0.18)' },

  // Section
  sectionHead:{ fontSize: 11, fontWeight: '700', color: C.textMeta, textTransform: 'uppercase', letterSpacing: 0.9, marginBottom: 10 },

  // Pipeline
  pipeRow:  { gap: 10, paddingBottom: 24, paddingRight: 4 },
  pipeCard: { backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, paddingVertical: 14, paddingHorizontal: 14, alignItems: 'center', minWidth: 84, gap: 5 },
  pipeIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  pipeCount:{ fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  pipeLabel:{ fontSize: 9, fontWeight: '700', color: C.textMeta, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' },

  // Actions
  actionsWrap: { gap: 8, marginBottom: 8 },
  actionCard:  { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, paddingVertical: 13, paddingHorizontal: 14, gap: 12 },
  clearCard:   { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: '#A7F3D0', paddingVertical: 13, paddingHorizontal: 14, gap: 12, marginBottom: 8 },
  actionIcon:  { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  actionLabel: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  countBadge:  { minWidth: 32, height: 32, borderRadius: 999, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  countText:   { fontSize: 14, fontWeight: '800' },

  // Sign out
  signOut:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 28, paddingVertical: 8 },
  signOutText: { fontSize: 12, color: C.textMeta, fontWeight: '500' },
});
