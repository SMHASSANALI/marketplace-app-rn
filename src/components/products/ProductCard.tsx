/**
 * ProductCard — single product row for the Owner catalog list.
 *
 * Props:
 *  product        — the Product record
 *  showBasePrice  — true for Owner (base price is private; not shown to agents)
 *  onPress        — tap handler (navigate to edit screen)
 *
 * Visual states:
 *  Normal          — white card, standard border
 *  Low stock       — orange border, warning stock text
 *  Out of stock    — red stock text
 *  Inactive        — muted emoji background, greyed name, Inactive badge
 */

import { Pressable, Text, View } from 'react-native';
import { Ionicons }              from '@expo/vector-icons';

import { Badge }          from '@/components/ui/Badge';
import { Product }        from '@/types';
import { formatCurrency } from '@/lib/utils';
import {
  COLORS, FONT_SIZES, RADIUS, SHADOW, SPACING,
} from '@/lib/theme';

interface Props {
  product:       Product;
  showBasePrice?: boolean;
  onPress:       () => void;
}

export function ProductCard({ product, showBasePrice = false, onPress }: Props) {
  const isLowStock   = product.qty_available <= product.low_stock_threshold;
  const isOutOfStock = product.qty_available === 0;

  const borderColor = !product.is_active
    ? COLORS.border
    : isLowStock
    ? COLORS.warning
    : COLORS.border;

  const stockColor = isOutOfStock
    ? COLORS.danger
    : isLowStock
    ? COLORS.warning
    : COLORS.muted;

  const stockText = isOutOfStock
    ? 'Out of stock'
    : `${product.qty_available} in stock${isLowStock ? ' ⚠' : ''}`;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection:  'row',
        alignItems:     'center',
        backgroundColor: COLORS.surface,
        borderRadius:   RADIUS.md,
        padding:        SPACING.base,
        marginBottom:   SPACING.sm,
        borderWidth:    1,
        borderColor,
        opacity: pressed ? 0.82 : 1,
        ...SHADOW.sm,
      })}
    >
      {/* Emoji icon */}
      <View
        style={{
          width:           48,
          height:          48,
          borderRadius:    RADIUS.md,
          backgroundColor: product.is_active ? COLORS.brandLight : COLORS.surfaceAlt,
          alignItems:      'center',
          justifyContent:  'center',
          marginRight:     SPACING.md,
        }}
      >
        <Text style={{ fontSize: 24 }}>{product.image_emoji}</Text>
      </View>

      {/* Main content */}
      <View style={{ flex: 1 }}>
        {/* Name + inactive badge */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <Text
            numberOfLines={1}
            style={{
              fontSize:   FONT_SIZES.base,
              fontWeight: '600',
              color:      product.is_active ? COLORS.text : COLORS.muted,
              flexShrink: 1,
            }}
          >
            {product.name}
          </Text>
          {!product.is_active && (
            <Badge label="Inactive" color={COLORS.muted} size="sm" />
          )}
        </View>

        {/* Category · Stock */}
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
          {product.category ? (
            <>
              <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted }}>
                {product.category}
              </Text>
              <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.border }}>·</Text>
            </>
          ) : null}
          <Text
            style={{
              fontSize:   FONT_SIZES.xs,
              color:      stockColor,
              fontWeight: isLowStock ? '600' : '400',
            }}
          >
            {stockText}
          </Text>
        </View>

        {/* Prices — Owner only */}
        {showBasePrice && (
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 3 }}>
            <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted }}>
              Cost: {formatCurrency(product.buying_price)}
            </Text>
            <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted }}>·</Text>
            <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.brand, fontWeight: '600' }}>
              Floor: {formatCurrency(product.selling_price)}
            </Text>
          </View>
        )}
      </View>

      <Ionicons name="chevron-forward" size={18} color={COLORS.border} />
    </Pressable>
  );
}
