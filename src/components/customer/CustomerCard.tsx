/**
 * CustomerCard — compact display card for a found customer.
 *
 * Shows name, formatted phone number, and a "Found" badge.
 * Used in the New Order wizard after a successful phone lookup.
 */

import { Text, View } from 'react-native';
import { Ionicons }   from '@expo/vector-icons';

import { Customer }       from '@/types';
import { displayPhone }   from '@/lib/phone';
import { COLORS, FONT_SIZES, RADIUS, SPACING, SHADOW } from '@/lib/theme';

interface Props {
  customer: Customer;
}

export function CustomerCard({ customer }: Props) {
  return (
    <View
      style={{
        flexDirection:  'row',
        alignItems:     'center',
        backgroundColor: COLORS.surface,
        borderRadius:   RADIUS.md,
        borderWidth:    1,
        borderColor:    COLORS.teal + '50',
        padding:        SPACING.md,
        marginTop:      SPACING.md,
        gap:            SPACING.md,
        ...SHADOW.sm,
      }}
    >
      {/* Avatar circle */}
      <View
        style={{
          width:           44,
          height:          44,
          borderRadius:    22,
          backgroundColor: COLORS.teal + '20',
          alignItems:      'center',
          justifyContent:  'center',
        }}
      >
        <Ionicons name="person" size={22} color={COLORS.teal} />
      </View>

      {/* Text */}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: FONT_SIZES.base, fontWeight: '700', color: COLORS.text }}>
          {customer.name}
        </Text>
        <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.muted, marginTop: 2 }}>
          {displayPhone(customer.phone_number)}
        </Text>
      </View>

      {/* Badge */}
      <View
        style={{
          backgroundColor: COLORS.teal + '20',
          borderRadius:    RADIUS.full,
          paddingHorizontal: 8,
          paddingVertical:   3,
        }}
      >
        <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.teal, fontWeight: '700' }}>
          Found
        </Text>
      </View>
    </View>
  );
}
