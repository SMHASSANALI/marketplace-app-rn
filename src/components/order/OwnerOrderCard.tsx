import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons }    from '@expo/vector-icons';
import { OrderFull }   from '@/types';
import { formatCurrency } from '@/lib/utils';

// ─── Design tokens (new palette) ─────────────────────────────────────────────

const C = {
  surface:   '#FFFFFF',
  border:    '#E2E8F0',
  text:      '#0F172A',
  textSub:   '#475569',
  textMeta:  '#94A3B8',
  brand:     '#4F46E5',
  brandLight:'#EEF2FF',
  amber:     '#B45309', amberBg:  '#FEF3C7',
  sky:       '#0369A1', skyBg:    '#E0F2FE',
  emerald:   '#047857', emeraldBg:'#D1FAE5',
  rose:      '#BE123C', roseBg:   '#FFE4E6',
  orange:    '#C2410C', orangeBg: '#FFF7ED',
} as const;

const SH = {
  shadowColor:   '#64748B',
  shadowOffset:  { width: 0, height: 4 },
  shadowOpacity: 0.04,
  shadowRadius:  12,
  elevation:     2,
};

// ─── Status badge config ──────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:          { label: 'Pending',          color: C.amber,   bg: C.amberBg   },
  confirmed:        { label: 'Confirmed',         color: C.sky,     bg: C.skyBg     },
  assigned:         { label: 'Assigned',          color: C.brand,   bg: C.brandLight},
  out_for_delivery: { label: 'Out for Delivery',  color: C.orange,  bg: C.orangeBg  },
  delivered:        { label: 'Delivered',         color: C.emerald, bg: C.emeraldBg },
  returned:         { label: 'Returned',          color: C.rose,    bg: C.roseBg    },
  cancelled:        { label: 'Cancelled',         color: C.rose,    bg: C.roseBg    },
};

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  order:   OrderFull;
  onPress: () => void;
}

export function OwnerOrderCard({ order, onPress }: Props) {
  const isPrepaid     = order.payment_method === 'prepaid';
  const isPending     = order.status === 'pending';
  const isRejected    = order.payment_status === 'receipt_rejected';
  const isPendingRcpt = order.payment_status === 'receipt_pending';
  const fulfilled     = order.line_items.filter(i => i.fulfilled).length;

  const st = STATUS_CONFIG[order.status] ?? { label: order.status, color: C.textMeta, bg: '#F1F5F9' };

  const dateLabel = new Date(order.created_at).toLocaleDateString('en-PK', {
    day: 'numeric', month: 'short',
  });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.card, SH, pressed && { opacity: 0.78 }]}
    >
      {/* ── Header: order code + badges ── */}
      <View style={s.headerRow}>
        <Text style={s.orderCode}>{order.order_code}</Text>
        <View style={s.badgeRow}>
          {isPrepaid && (
            <View style={[s.pill, { backgroundColor: C.skyBg }]}>
              <Text style={[s.pillText, { color: C.sky }]}>Prepaid</Text>
            </View>
          )}
          <View style={[s.pill, { backgroundColor: st.bg }]}>
            <Text style={[s.pillText, { color: st.color }]}>{st.label}</Text>
          </View>
        </View>
      </View>

      {/* ── Meta: agent · customer · items · date ── */}
      <View style={s.metaRow}>
        <View style={s.metaGroup}>
          <Ionicons name="person-outline" size={11} color={C.textMeta} />
          <Text style={s.metaText} numberOfLines={1}>{order.agent.name}</Text>
        </View>
        <Text style={s.metaDot}>·</Text>
        <View style={s.metaGroup}>
          <Ionicons name="bag-outline" size={11} color={C.textMeta} />
          <Text style={s.metaText} numberOfLines={1}>
            {order.customer.name} · {fulfilled} item{fulfilled !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* ── Financial footer ── */}
      <View style={s.footer}>
        <View style={s.footerDate}>
          <Ionicons name="calendar-outline" size={11} color={C.textMeta} />
          <Text style={s.dateText}>{dateLabel}</Text>
        </View>
        <View style={s.financials}>
          <Text style={s.totalText}>{formatCurrency(order.total)}</Text>
          {order.commission_total > 0 && (
            <Text style={s.commText}>
              Commission: {formatCurrency(order.commission_total)}
            </Text>
          )}
        </View>
      </View>

      {/* ── Confirm hint (pending) ── */}
      {isPending && (
        <View style={s.strip}>
          <View style={[s.stripLine, { backgroundColor: C.amberBg }]} />
          <View style={s.stripContent}>
            <Ionicons name="checkmark-circle-outline" size={13} color={C.amber} />
            <Text style={[s.stripText, { color: C.amber }]}>
              Awaiting confirmation — tap to review
            </Text>
            <Ionicons name="chevron-forward" size={13} color={C.amber} />
          </View>
        </View>
      )}

      {/* ── Receipt rejected ── */}
      {isRejected && (
        <View style={s.strip}>
          <View style={[s.stripLine, { backgroundColor: C.roseBg }]} />
          <View style={s.stripContent}>
            <Ionicons name="warning" size={13} color={C.rose} />
            <Text style={[s.stripText, { color: C.rose }]}>Receipt rejected by owner</Text>
          </View>
        </View>
      )}

      {/* ── Receipt pending verification ── */}
      {isPendingRcpt && (
        <View style={s.strip}>
          <View style={[s.stripLine, { backgroundColor: C.skyBg }]} />
          <View style={s.stripContent}>
            <Ionicons name="time-outline" size={13} color={C.sky} />
            <Text style={[s.stripText, { color: C.sky }]}>Receipt pending verification</Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  card: {
    backgroundColor: C.surface,
    borderRadius:    12,
    borderWidth:     1,
    borderColor:     C.border,
    marginBottom:    10,
    overflow:        'hidden',
  },

  // Header
  headerRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop:        14,
    paddingBottom:     10,
  },
  orderCode: {
    fontSize:   13,
    fontWeight: '700',
    color:      C.text,
    letterSpacing: 0.6,
  },
  badgeRow: {
    flexDirection: 'row',
    gap:           5,
    alignItems:    'center',
  },
  pill: {
    borderRadius:      999,
    paddingHorizontal: 9,
    paddingVertical:   3,
  },
  pillText: {
    fontSize:   10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Meta
  metaRow: {
    flexDirection:     'row',
    alignItems:        'center',
    flexWrap:          'wrap',
    gap:               5,
    paddingHorizontal: 14,
    paddingBottom:     10,
  },
  metaGroup: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
    flexShrink:    1,
  },
  metaText: {
    fontSize: 11,
    color:    C.textSub,
    fontWeight: '500',
    flexShrink: 1,
  },
  metaDot: {
    fontSize: 11,
    color:    C.textMeta,
  },

  // Footer
  footer: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 14,
    paddingBottom:     12,
    paddingTop:        4,
    borderTopWidth:    1,
    borderTopColor:    C.border,
    marginTop:         2,
  },
  footerDate: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
  },
  dateText: {
    fontSize: 11,
    color:    C.textMeta,
    fontWeight: '500',
  },
  financials: {
    alignItems: 'flex-end',
  },
  totalText: {
    fontSize:   14,
    fontWeight: '800',
    color:      C.text,
    letterSpacing: -0.2,
  },
  commText: {
    fontSize:  10,
    color:     C.textMeta,
    fontWeight:'500',
    marginTop:  1,
  },

  // Footer strip (pending / receipts)
  strip: {
    overflow: 'hidden',
  },
  stripLine: {
    height: 1,
  },
  stripContent: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            6,
    paddingHorizontal: 14,
    paddingVertical:   9,
  },
  stripText: {
    flex:       1,
    fontSize:   11,
    fontWeight: '600',
  },
});
