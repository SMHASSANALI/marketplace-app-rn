/**
 * Card — white elevated surface for content grouping.
 *
 * Used throughout the app for order cards, product cards, stat blocks, etc.
 * Accepts optional press handler for tappable cards.
 *
 * Props:
 *  children   — card content
 *  onPress    — if provided, the card becomes a tappable Pressable
 *  style      — additional container overrides
 *  padding    — inner padding (defaults to 14)
 */

import React                    from 'react';
import { Pressable, StyleProp, View, ViewStyle } from 'react-native';
import { COLORS, RADIUS, SHADOW } from '@/lib/theme';

interface CardProps {
  children:  React.ReactNode;
  onPress?:  () => void;
  style?:    StyleProp<ViewStyle>;
  /** Inner padding in dp. Defaults to 14. */
  padding?:  number;
}

export function Card({ children, onPress, style, padding = 14 }: CardProps) {
  const baseStyle: ViewStyle = {
    backgroundColor: COLORS.surface,
    borderRadius:    RADIUS.md,
    padding,
    borderWidth:     1,
    borderColor:     COLORS.border,
    ...SHADOW.sm,
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          baseStyle,
          { opacity: pressed ? 0.85 : 1 },
          style,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={[baseStyle, style]}>
      {children}
    </View>
  );
}
