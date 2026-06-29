/**
 * ProductPickerRow — single product row in the order items step.
 *
 * Shows emoji, name, available stock, and base price.
 * The [+] button adds the item to the cart.
 * When qtyInCart > 0, shows a teal badge instead of the [+] button
 * (quantity editing is done in the cart section, not here).
 */

import { Pressable, Text, View } from 'react-native';
import { Ionicons }              from '@expo/vector-icons';

import { Product }       from '@/types';
import { formatCurrency } from '@/lib/utils';
import { COLORS, FONT_SIZES, RADIUS, SPACING } from '@/lib/theme';

interface Props {
  product:   Product;
  qtyInCart: number;
  onAdd:     () => void;
}

export function ProductPickerRow({ product, qtyInCart, onAdd }: Props) {
  const inCart     = qtyInCart > 0;
  const noStock    = product.qty_available === 0;

  return (
    <View
      style={{
        flexDirection:   'row',
        alignItems:      'center',
        paddingHorizontal: SPACING.base,
        paddingVertical:   SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        opacity: noStock ? 0.45 : 1,
      }}
    >
      {/* Emoji icon */}
      <View
        style={{
          width:           40,
          height:          40,
          borderRadius:    RADIUS.md,
          backgroundColor: inCart ? COLORS.teal + '20' : COLORS.surfaceAlt,
          alignItems:      'center',
          justifyContent:  'center',
          marginRight:     SPACING.md,
        }}
      >
        <Text style={{ fontSize: 20 }}>{product.image_emoji}</Text>
      </View>

      {/* Name + stock */}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.text }}>
          {product.name}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted }}>
            Floor: {formatCurrency(product.selling_price)}
          </Text>
          <Text style={{ fontSize: FONT_SIZES.xs, color: noStock ? COLORS.danger : COLORS.muted }}>
            · {product.qty_available === 0 ? 'Out of stock' : `${product.qty_available} left`}
          </Text>
        </View>
      </View>

      {/* Action */}
      {inCart ? (
        <View
          style={{
            backgroundColor: COLORS.teal + '20',
            borderRadius:    RADIUS.full,
            paddingHorizontal: 10,
            paddingVertical:   4,
          }}
        >
          <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.teal, fontWeight: '700' }}>
            ×{qtyInCart} in cart
          </Text>
        </View>
      ) : (
        <Pressable
          onPress={noStock ? undefined : onAdd}
          disabled={noStock}
          style={({ pressed }) => ({
            width:           34,
            height:          34,
            borderRadius:    17,
            backgroundColor: COLORS.brand,
            alignItems:      'center',
            justifyContent:  'center',
            opacity: pressed ? 0.75 : 1,
          })}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </Pressable>
      )}
    </View>
  );
}
