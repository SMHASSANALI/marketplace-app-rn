/**
 * EmptyState — shown when a list or screen has no content to display.
 *
 * Provides consistent empty-state UX across the app: large emoji icon,
 * a headline, a description, and an optional action button.
 *
 * Props:
 *  emoji       — large icon (e.g. "📦")
 *  title       — short headline ("No orders yet")
 *  description — optional supporting copy
 *  action      — optional label + callback for a CTA button
 */

import React        from 'react';
import { Text, View } from 'react-native';
import { COLORS, FONT_SIZES } from '@/lib/theme';
import { Button }   from './Button';

interface EmptyStateProps {
  emoji:        string;
  title:        string;
  description?: string;
  action?:      { label: string; onPress: () => void };
}

export function EmptyState({ emoji, title, description, action }: EmptyStateProps) {
  return (
    <View
      style={{
        flex:           1,
        alignItems:     'center',
        justifyContent: 'center',
        padding:        32,
        gap:            12,
      }}
    >
      <Text style={{ fontSize: 56 }}>{emoji}</Text>

      <Text
        style={{
          fontSize:   FONT_SIZES.lg,
          fontWeight: '700',
          color:      COLORS.text,
          textAlign:  'center',
        }}
      >
        {title}
      </Text>

      {description && (
        <Text
          style={{
            fontSize:  FONT_SIZES.base,
            color:     COLORS.muted,
            textAlign: 'center',
            lineHeight:22,
          }}
        >
          {description}
        </Text>
      )}

      {action && (
        <View style={{ marginTop: 8 }}>
          <Button label={action.label} onPress={action.onPress} />
        </View>
      )}
    </View>
  );
}
