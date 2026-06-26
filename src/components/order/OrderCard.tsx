import { Pressable, Text, View } from 'react-native';
import { Ionicons }              from '@expo/vector-icons';
import { OrderFull }             from '@/types';
import { formatCurrency }        from '@/lib/utils';
import {
  COLORS, FONT_SIZES, RADIUS, SHADOW, SPACING, STATUS_COLOR, STATUS_LABEL,
} from '@/lib/theme';

interface Props {
  order:   OrderFull;
  onPress: () => void;
}

export function OrderCard({ order, onPress }: Props) {
  const isRejected  = order.payment_status === 'receipt_rejected';
  const isPending   = order.payment_status === 'receipt_pending';
  const isPrepaid   = order.payment_method === 'prepaid';
  const statusColor = STATUS_COLOR[order.status] ?? COLORS.muted;
  const hold        = order.hold_info;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: COLORS.surface,
        borderRadius:    RADIUS.md,
        borderWidth:     isRejected ? 2 : 1,
        borderColor:     isRejected ? COLORS.danger : COLORS.border,
        padding:         SPACING.md,
        marginBottom:    SPACING.sm,
        opacity:         pressed ? 0.85 : 1,
        ...SHADOW.sm,
      })}
    >
      {/* ── Header: code + badges ── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xs }}>
        <Text style={{
          flex: 1, fontSize: FONT_SIZES.sm, fontWeight: '700',
          color: COLORS.text, letterSpacing: 0.5,
        }}>
          {order.order_code}
        </Text>

        {isPrepaid && (
          <View style={{
            backgroundColor:  COLORS.infoLight,
            borderRadius:     RADIUS.sm,
            paddingHorizontal: 8,
            paddingVertical:   2,
            marginRight:       SPACING.xs,
          }}>
            <Text style={{ fontSize: FONT_SIZES.xs, fontWeight: '600', color: COLORS.info }}>
              Prepaid
            </Text>
          </View>
        )}

        <View style={{
          backgroundColor:  statusColor + '20',
          borderRadius:     RADIUS.sm,
          paddingHorizontal: 8,
          paddingVertical:   2,
        }}>
          <Text style={{ fontSize: FONT_SIZES.xs, fontWeight: '600', color: statusColor }}>
            {STATUS_LABEL[order.status] ?? order.status}
          </Text>
        </View>
      </View>

      {/* ── Customer row + totals ── */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.textSecondary }}>
            {order.customer.name}
          </Text>
          <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginTop: 2 }}>
            {order.line_items.filter(i => i.fulfilled).length} item(s) ·{' '}
            {new Date(order.created_at).toLocaleDateString('en-PK', {
              day: 'numeric', month: 'short',
            })}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.text }}>
            {formatCurrency(order.total)}
          </Text>
          {order.commission_total > 0 && (
            <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.teal, fontWeight: '600', marginTop: 2 }}>
              +{formatCurrency(order.commission_total)}
            </Text>
          )}
        </View>
      </View>

      {/* ── Commission hold indicator (delivered orders only) ── */}
      {hold && (
        <View style={{
          flexDirection:  'row',
          alignItems:     'center',
          gap:            SPACING.xs,
          marginTop:      SPACING.sm,
          paddingTop:     SPACING.sm,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
        }}>
          {hold.eligible ? (
            <>
              <Ionicons name="checkmark-circle" size={14} color={COLORS.teal} />
              <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.teal, fontWeight: '600' }}>
                Commission eligible for settlement
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="time-outline" size={14} color={COLORS.warning} />
              <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.warning, fontWeight: '600' }}>
                {hold.remaining_days} day{hold.remaining_days !== 1 ? 's' : ''} remaining in hold
              </Text>
            </>
          )}
        </View>
      )}

      {/* ── Receipt rejected warning ── */}
      {isRejected && (
        <View style={{
          flexDirection:  'row',
          alignItems:     'center',
          gap:            SPACING.xs,
          marginTop:      SPACING.sm,
          paddingTop:     SPACING.sm,
          borderTopWidth: 1,
          borderTopColor: COLORS.dangerLight,
        }}>
          <Ionicons name="warning" size={14} color={COLORS.danger} />
          <Text style={{ flex: 1, fontSize: FONT_SIZES.xs, color: COLORS.danger, fontWeight: '600' }}>
            Receipt rejected — tap to re-upload
          </Text>
          <Ionicons name="chevron-forward" size={14} color={COLORS.danger} />
        </View>
      )}

      {/* ── Receipt pending indicator ── */}
      {isPending && !isRejected && (
        <View style={{
          flexDirection:  'row',
          alignItems:     'center',
          gap:            SPACING.xs,
          marginTop:      SPACING.sm,
          paddingTop:     SPACING.sm,
          borderTopWidth: 1,
          borderTopColor: COLORS.warningLight,
        }}>
          <Ionicons name="hourglass-outline" size={14} color={COLORS.warning} />
          <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.warning, fontWeight: '600' }}>
            Receipt awaiting owner verification
          </Text>
        </View>
      )}
    </Pressable>
  );
}
