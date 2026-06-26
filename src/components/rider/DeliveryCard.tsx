import { Pressable, Text, View } from 'react-native';
import { Ionicons }              from '@expo/vector-icons';
import { OrderFull }             from '@/types';
import { formatCurrency }        from '@/lib/utils';
import { COLORS, FONT_SIZES, RADIUS, SHADOW, SPACING, STATUS_COLOR, STATUS_LABEL } from '@/lib/theme';

interface Props {
  order:   OrderFull;
  onPress: () => void;
}

export function DeliveryCard({ order, onPress }: Props) {
  const statusColor = STATUS_COLOR[order.status] ?? COLORS.muted;
  const isCOD       = order.payment_method === 'cod';
  const isActive    = order.status === 'assigned' || order.status === 'out_for_delivery';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: COLORS.surface,
        borderRadius:    RADIUS.md,
        borderWidth:     1,
        borderColor:     isActive ? COLORS.info + '60' : COLORS.border,
        marginBottom:    SPACING.sm,
        overflow:        'hidden',
        opacity:         pressed ? 0.88 : 1,
        ...SHADOW.sm,
      })}
    >
      {/* Header row */}
      <View style={{
        flexDirection:   'row',
        alignItems:      'center',
        padding:         SPACING.md,
        paddingBottom:   SPACING.xs,
      }}>
        <Text style={{ flex: 1, fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.text, letterSpacing: 0.5 }}>
          {order.order_code}
        </Text>
        {isCOD && (
          <View style={{
            backgroundColor:   COLORS.warning + '20',
            borderRadius:      RADIUS.full,
            paddingHorizontal: 8, paddingVertical: 2,
            marginRight:       SPACING.xs,
          }}>
            <Text style={{ fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.warning }}>
              COD
            </Text>
          </View>
        )}
        <View style={{
          backgroundColor:   statusColor + '20',
          borderRadius:      RADIUS.full,
          paddingHorizontal: 8, paddingVertical: 2,
        }}>
          <Text style={{ fontSize: FONT_SIZES.xs, fontWeight: '700', color: statusColor }}>
            {STATUS_LABEL[order.status] ?? order.status}
          </Text>
        </View>
      </View>

      {/* Customer & address */}
      <View style={{ paddingHorizontal: SPACING.md, paddingBottom: SPACING.xs }}>
        <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.text }}>
          {order.customer.name}
        </Text>
        {order.address && (
          <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginTop: 2 }} numberOfLines={2}>
            {order.address.address_text}
            {order.address.distance_km != null ? ` · ${order.address.distance_km.toFixed(1)} km` : ''}
          </Text>
        )}
      </View>

      {/* Footer */}
      <View style={{
        flexDirection:     'row',
        alignItems:        'center',
        justifyContent:    'space-between',
        paddingHorizontal: SPACING.md,
        paddingVertical:   SPACING.xs,
        backgroundColor:   COLORS.surfaceAlt,
        borderTopWidth:    1,
        borderTopColor:    COLORS.border,
      }}>
        <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted }}>
          {order.line_items.filter(i => i.fulfilled).length} item(s)
        </Text>
        {isCOD ? (
          <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.warning }}>
            Collect {formatCurrency(order.total)}
          </Text>
        ) : (
          <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.teal }}>
            Prepaid ✓
          </Text>
        )}
        <Ionicons name="chevron-forward" size={14} color={COLORS.muted} />
      </View>
    </Pressable>
  );
}
