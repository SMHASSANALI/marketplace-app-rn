/**
 * Badge — small coloured label used for statuses, categories, and counts.
 *
 * The default colour tokens map directly to the STATUS_COLOR and STATUS_LABEL
 * constants in lib/theme.ts. You can also pass explicit colour props for
 * custom badges.
 *
 * Props:
 *  label      — text displayed inside the badge
 *  color      — background tint colour (defaults to brand)
 *  textColor  — label text colour (defaults to white for filled, or colour for outlined)
 *  outlined   — if true, renders as outlined rather than filled
 *  size       — 'sm' (default) or 'md'
 */

import React          from 'react';
import { Text, View } from 'react-native';
import { COLORS, FONT_SIZES, RADIUS } from '@/lib/theme';

interface BadgeProps {
  label:       string;
  color?:      string;
  textColor?:  string;
  outlined?:   boolean;
  size?:       'sm' | 'md';
}

export function Badge({
  label,
  color     = COLORS.brand,
  textColor,
  outlined  = false,
  size      = 'sm',
}: BadgeProps) {
  // For outlined badges, the text is the same colour as the border
  const resolvedTextColor = textColor ?? (outlined ? color : '#ffffff');
  const fontSize = size === 'sm' ? FONT_SIZES.xs : FONT_SIZES.sm;

  return (
    <View
      style={{
        alignSelf:        'flex-start',
        borderRadius:     RADIUS.full,
        paddingVertical:  size === 'sm' ? 2 : 4,
        paddingHorizontal:size === 'sm' ? 8 : 10,
        backgroundColor:  outlined ? 'transparent' : color + '20', // 20 = ~12% opacity
        borderWidth:      outlined ? 1.5 : 1,
        borderColor:      color,
      }}
    >
      <Text
        style={{
          fontSize,
          fontWeight: '600',
          color:      resolvedTextColor !== '#ffffff' ? resolvedTextColor : color,
          letterSpacing: 0.2,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
