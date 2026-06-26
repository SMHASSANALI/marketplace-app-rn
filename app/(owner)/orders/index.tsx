import { useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router }             from 'expo-router';
import { Ionicons }           from '@expo/vector-icons';
import { SafeAreaView }       from 'react-native-safe-area-context';
import { EmptyState }         from '@/components/ui/EmptyState';
import { LoadingSpinner }     from '@/components/ui/LoadingSpinner';
import { OwnerOrderCard }     from '@/components/order/OwnerOrderCard';
import { useOwnerOrders }     from '@/hooks/useOwnerOrders';
import { OrderStatus, PaymentMethod } from '@/types';

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  bg:        '#F8FAFC',
  surface:   '#FFFFFF',
  border:    '#E2E8F0',
  brand:     '#4F46E5',
  brandDark: '#4338CA',
  brandLight:'#EEF2FF',
  text:      '#0F172A',
  textSub:   '#475569',
  textMeta:  '#94A3B8',
  amber:     '#B45309', amberBg: '#FEF3C7',
} as const;

// ─── Filter pill ─────────────────────────────────────────────────────────────

function Pill<T extends string | null>({
  label, value, active, onPress,
}: { label: string; value: T; active: T; onPress: (v: T) => void }) {
  const isActive = value === active;
  return (
    <Pressable
      onPress={() => onPress(value)}
      style={[s.pill, isActive && s.pillActive]}
    >
      <Text style={[s.pillText, isActive && s.pillTextActive]}>{label}</Text>
    </Pressable>
  );
}

// ─── Filter options ───────────────────────────────────────────────────────────

const STATUS_OPTS: { label: string; value: OrderStatus | null }[] = [
  { label: 'All',              value: null },
  { label: 'Pending',          value: 'pending' },
  { label: 'Confirmed',        value: 'confirmed' },
  { label: 'Out for Delivery', value: 'out_for_delivery' },
  { label: 'Delivered',        value: 'delivered' },
  { label: 'Cancelled',        value: 'cancelled' },
];

const PAYMENT_OPTS: { label: string; value: PaymentMethod | null }[] = [
  { label: 'All',     value: null },
  { label: 'COD',     value: 'cod' },
  { label: 'Prepaid', value: 'prepaid' },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function OwnerOrdersScreen() {
  const [statusFilter,  setStatusFilter]  = useState<OrderStatus | null>(null);
  const [paymentFilter, setPaymentFilter] = useState<PaymentMethod | null>(null);

  const {
    data: orders = [],
    isLoading,
    refetch,
    isRefetching,
  } = useOwnerOrders({
    status:        statusFilter  ?? undefined,
    paymentMethod: paymentFilter ?? undefined,
  });

  const pendingCount = orders.filter(o => o.status === 'pending').length;

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>

      {/* ── Page header ── */}
      <View style={s.pageHeader}>
        <Text style={s.pageTitle}>Orders</Text>
        {pendingCount > 0 && (
          <View style={s.pendingBadge}>
            <Ionicons name="time-outline" size={11} color={C.amber} />
            <Text style={s.pendingBadgeText}>{pendingCount} pending</Text>
          </View>
        )}
      </View>

      {/* ── Filter section ── */}
      <View style={s.filtersWrap}>
        {/* Status row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filterRow}
        >
          {STATUS_OPTS.map(o => (
            <Pill
              key={o.label}
              label={o.label}
              value={o.value}
              active={statusFilter}
              onPress={setStatusFilter}
            />
          ))}
        </ScrollView>

        {/* Payment row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[s.filterRow, { paddingTop: 0, paddingBottom: 6 }]}
        >
          {PAYMENT_OPTS.map(o => (
            <Pill
              key={o.label}
              label={o.label}
              value={o.value}
              active={paymentFilter}
              onPress={setPaymentFilter}
            />
          ))}
          {/* Clear-all chip — only when a filter is active */}
          {(statusFilter || paymentFilter) && (
            <Pressable
              onPress={() => { setStatusFilter(null); setPaymentFilter(null); }}
              style={s.clearChip}
            >
              <Ionicons name="close-circle" size={12} color={C.textMeta} />
              <Text style={s.clearChipText}>Clear</Text>
            </Pressable>
          )}
        </ScrollView>
      </View>

      {/* ── Pending confirmation banner ── */}
      {pendingCount > 0 && !statusFilter && !paymentFilter && (
        <Pressable
          onPress={() => setStatusFilter('pending')}
          style={s.pendingBanner}
        >
          <View style={[s.bannerIcon, { backgroundColor: C.amberBg }]}>
            <Ionicons name="alert-circle" size={15} color={C.amber} />
          </View>
          <Text style={s.bannerText}>
            {pendingCount} order{pendingCount !== 1 ? 's' : ''} awaiting your confirmation
          </Text>
          <Ionicons name="chevron-forward" size={14} color={C.amber} />
        </Pressable>
      )}

      {/* ── Order list ── */}
      {isLoading ? (
        <LoadingSpinner message="Loading orders…" />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={o => String(o.id)}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={C.brand}
              colors={[C.brand]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              emoji="📋"
              title="No orders found"
              description={
                statusFilter || paymentFilter
                  ? 'Try removing a filter.'
                  : 'Orders placed by agents will appear here.'
              }
            />
          }
          renderItem={({ item }) => (
            <OwnerOrderCard
              order={item}
              onPress={() => router.push(`/(owner)/orders/${item.id}` as any)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  // Page header
  pageHeader: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop:     16,
    paddingBottom:  10,
    backgroundColor: C.bg,
  },
  pageTitle: {
    fontSize:   22,
    fontWeight: '800',
    color:      C.text,
    letterSpacing: -0.4,
  },
  pendingBadge: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               4,
    backgroundColor:   C.amberBg,
    borderRadius:      999,
    paddingHorizontal: 10,
    paddingVertical:   4,
  },
  pendingBadgeText: {
    fontSize:   11,
    fontWeight: '700',
    color:      C.amber,
  },

  // Filters
  filtersWrap: {
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  filterRow: {
    paddingHorizontal: 12,
    paddingVertical:   8,
    gap:               6,
  },
  pill: {
    paddingHorizontal: 13,
    paddingVertical:   6,
    borderRadius:      999,
    borderWidth:       1,
    borderColor:       C.border,
    backgroundColor:   C.surface,
  },
  pillActive: {
    backgroundColor: C.brand,
    borderColor:     C.brand,
  },
  pillText: {
    fontSize:   12,
    fontWeight: '600',
    color:      C.textSub,
  },
  pillTextActive: {
    color: '#ffffff',
  },
  clearChip: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               4,
    paddingHorizontal: 11,
    paddingVertical:   6,
    borderRadius:      999,
    borderWidth:       1,
    borderColor:       C.border,
    backgroundColor:   '#F1F5F9',
  },
  clearChipText: {
    fontSize:   12,
    fontWeight: '600',
    color:      C.textMeta,
  },

  // Pending banner
  pendingBanner: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               10,
    backgroundColor:   C.amberBg,
    paddingHorizontal: 16,
    paddingVertical:   10,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  bannerIcon: {
    width:           28,
    height:          28,
    borderRadius:    8,
    alignItems:      'center',
    justifyContent:  'center',
  },
  bannerText: {
    flex:       1,
    fontSize:   12,
    fontWeight: '700',
    color:      C.amber,
  },

  // List
  list: {
    padding:       12,
    paddingBottom: 40,
  },
});
