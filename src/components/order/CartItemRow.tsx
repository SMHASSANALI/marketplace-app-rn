/**
 * CartItemRow — editable cart item for the order items step.
 *
 * Features:
 * - Quantity stepper (1 → stock limit)
 * - Selling price input: must be ≥ base_price; commission updates live
 * - Remove button (×)
 * - Shows commission = (selling_price − base_price) × qty; negative = error
 */

import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons }         from '@expo/vector-icons';

import { Product }          from '@/types';
import { formatCurrency }   from '@/lib/utils';
import { COLORS, FONT_SIZES, RADIUS, SPACING } from '@/lib/theme';

export interface CartItem {
  product:       Product;
  quantity:      number;
  selling_price: number; // agent-set; must be >= product.base_price
}

interface Props {
  item:     CartItem;
  onUpdate: (productId: number, quantity: number, selling_price: number) => void;
  onRemove: (productId: number) => void;
}

export function CartItemRow({ item, onUpdate, onRemove }: Props) {
  const [priceText, setPriceText] = useState(String(item.selling_price));

  const parsedPrice  = parseInt(priceText, 10);
  const validPrice   = !isNaN(parsedPrice) && parsedPrice > 0 ? parsedPrice : 0;
  const belowBase    = validPrice < item.product.base_price && priceText !== '';
  const commission   = (validPrice - item.product.base_price) * item.quantity;

  function handlePriceChange(text: string) {
    const clean = text.replace(/[^0-9]/g, '');
    setPriceText(clean);
    const price = parseInt(clean, 10);
    if (!isNaN(price) && price >= item.product.base_price) {
      onUpdate(item.product.id, item.quantity, price);
    }
  }

  function changeQty(delta: number) {
    const next = Math.max(1, Math.min(item.product.qty_available, item.quantity + delta));
    onUpdate(item.product.id, next, validPrice || item.product.base_price);
  }

  return (
    <View
      style={{
        backgroundColor: COLORS.surface,
        borderRadius:    RADIUS.md,
        borderWidth:     1,
        borderColor:     COLORS.border,
        padding:         SPACING.md,
        marginBottom:    SPACING.sm,
      }}
    >
      {/* Top row: emoji + name + remove */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm }}>
        <Text style={{ fontSize: 18, marginRight: 8 }}>{item.product.image_emoji}</Text>
        <Text style={{ flex: 1, fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.text }}>
          {item.product.name}
        </Text>
        <Pressable
          onPress={() => onRemove(item.product.id)}
          hitSlop={8}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Ionicons name="close-circle" size={20} color={COLORS.muted} />
        </Pressable>
      </View>

      {/* Bottom row: qty stepper | price input | commission */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>

        {/* Qty stepper */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Pressable
            onPress={() => changeQty(-1)}
            disabled={item.quantity <= 1}
            style={({ pressed }) => ({
              width: 28, height: 28, borderRadius: 14,
              backgroundColor: COLORS.surfaceAlt,
              alignItems: 'center', justifyContent: 'center',
              opacity: pressed || item.quantity <= 1 ? 0.5 : 1,
            })}
          >
            <Ionicons name="remove" size={14} color={COLORS.text} />
          </Pressable>
          <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.text, minWidth: 20, textAlign: 'center' }}>
            {item.quantity}
          </Text>
          <Pressable
            onPress={() => changeQty(1)}
            disabled={item.quantity >= item.product.qty_available}
            style={({ pressed }) => ({
              width: 28, height: 28, borderRadius: 14,
              backgroundColor: COLORS.surfaceAlt,
              alignItems: 'center', justifyContent: 'center',
              opacity: pressed || item.quantity >= item.product.qty_available ? 0.5 : 1,
            })}
          >
            <Ionicons name="add" size={14} color={COLORS.text} />
          </Pressable>
        </View>

        {/* Selling price */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginBottom: 2 }}>
            Sell price (Base: {formatCurrency(item.product.base_price)})
          </Text>
          <View
            style={{
              flexDirection:   'row',
              alignItems:      'center',
              borderWidth:     1,
              borderColor:     belowBase ? COLORS.danger : COLORS.border,
              borderRadius:    RADIUS.sm,
              backgroundColor: COLORS.bg,
              paddingHorizontal: 8,
              height:          36,
            }}
          >
            <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginRight: 4 }}>Rs</Text>
            <TextInput
              value={priceText}
              onChangeText={handlePriceChange}
              keyboardType="numeric"
              placeholder={String(item.product.base_price)}
              placeholderTextColor={COLORS.muted}
              style={{ flex: 1, fontSize: FONT_SIZES.sm, color: COLORS.text }}
            />
          </View>
          {belowBase && (
            <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.danger, marginTop: 2 }}>
              Must be ≥ {formatCurrency(item.product.base_price)}
            </Text>
          )}
        </View>

        {/* Commission */}
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginBottom: 2 }}>
            Commission
          </Text>
          <Text
            style={{
              fontSize:   FONT_SIZES.sm,
              fontWeight: '700',
              color:      commission < 0 ? COLORS.danger : commission > 0 ? COLORS.teal : COLORS.muted,
            }}
          >
            {commission >= 0 ? '+' : ''}{formatCurrency(commission)}
          </Text>
        </View>

      </View>
    </View>
  );
}
