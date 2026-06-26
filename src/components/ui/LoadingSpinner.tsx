/**
 * LoadingSpinner — full-screen or inline activity indicator.
 *
 * Use `fullScreen` for initial data loads where the screen would otherwise
 * be empty. Use inline (default) inside cards or partial screen areas.
 */

import React                    from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { COLORS, FONT_SIZES }   from '@/lib/theme';

interface LoadingSpinnerProps {
  /** If true, the spinner fills the available screen space and centres itself. */
  fullScreen?: boolean;
  /** Optional message displayed below the spinner. */
  message?:    string;
  /** Spinner colour (defaults to brand). */
  color?:      string;
}

export function LoadingSpinner({
  fullScreen = false,
  message,
  color = COLORS.brand,
}: LoadingSpinnerProps) {
  return (
    <View
      style={{
        flex:            fullScreen ? 1 : undefined,
        justifyContent:  'center',
        alignItems:      'center',
        padding:         24,
        backgroundColor: fullScreen ? COLORS.bg : 'transparent',
      }}
    >
      <ActivityIndicator size="large" color={color} />
      {message && (
        <Text
          style={{
            marginTop: 12,
            fontSize:  FONT_SIZES.sm,
            color:     COLORS.muted,
          }}
        >
          {message}
        </Text>
      )}
    </View>
  );
}
