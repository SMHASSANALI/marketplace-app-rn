/**
 * BandRow — single delivery band display row for the Settings screen.
 *
 * Shows: band name, distance range, customer-facing fee, and rider payout.
 * Open-ended upper bound (max_distance_km = null) is displayed as "15+ km".
 * Tapping the row navigates to the edit modal.
 */

import { Pressable, Text, View } from 'react-native';
import { Ionicons }              from '@expo/vector-icons';

import { DeliveryBand }  from '@/types';
import { formatCurrency } from '@/lib/utils';
import {
  COLORS, FONT_SIZES, RADIUS, SHADOW, SPACING,
} from '@/lib/theme';

interface Props {
  band:    DeliveryBand;
  onPress: () => void;
}

/** Formats the distance range label, e.g. "0 – 5 km" or "15+ km". */
function formatRange(min: number, max: number | null): string {
  if (max === null) return `${min}+ km`;
  return `${min} – ${max} km`;
}

export function BandRow({ band, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: COLORS.surface,
        borderRadius:    RADIUS.md,
        borderWidth:     1,
        borderColor:     COLORS.border,
        marginBottom:    SPACING.sm,
        opacity: pressed ? 0.82 : 1,
        ...SHADOW.sm,
      })}
    >
      {/* Top row: name + sort order chip + chevron */}
      <View
        style={{
          flexDirection:   'row',
          alignItems:      'center',
          justifyContent:  'space-between',
          paddingHorizontal: SPACING.base,
          paddingTop:      SPACING.base,
          paddingBottom:   SPACING.xs,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: FONT_SIZES.base, fontWeight: '700', color: COLORS.text }}>
            {band.name}
          </Text>
          {/* Sort order pill */}
          <View
            style={{
              backgroundColor: COLORS.surfaceAlt,
              borderRadius:    RADIUS.full,
              paddingHorizontal: 7,
              paddingVertical:   2,
            }}
          >
            <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, fontWeight: '600' }}>
              #{band.sort_order}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color={COLORS.border} />
      </View>

      {/* Bottom row: distance | fee | rider payout */}
      <View
        style={{
          flexDirection:     'row',
          paddingHorizontal: SPACING.base,
          paddingBottom:     SPACING.base,
          gap:               SPACING.md,
        }}
      >
        {/* Distance range */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginBottom: 2 }}>
            Distance
          </Text>
          <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.text }}>
            {formatRange(band.min_distance_km, band.max_distance_km)}
          </Text>
        </View>

        {/* Delivery fee */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginBottom: 2 }}>
            Delivery Fee
          </Text>
          <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.brand }}>
            {formatCurrency(band.delivery_fee)}
          </Text>
        </View>

        {/* Rider payout */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginBottom: 2 }}>
            Rider Payout
          </Text>
          <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.teal }}>
            {formatCurrency(band.default_rider_payout)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
