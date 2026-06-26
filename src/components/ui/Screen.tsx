/**
 * Screen — base layout wrapper for every screen in the app.
 *
 * Applies the app's background colour, handles safe area insets, and
 * optionally makes the content scrollable.
 *
 * Props:
 *  children      — screen content
 *  scrollable    — if true, wraps content in a ScrollView (default: false)
 *  padded        — if true, adds standard horizontal + vertical padding (default: true)
 *  style         — additional style overrides on the inner content container
 *  edges         — SafeAreaView edges to apply (default: ['top','bottom'])
 */

import React            from 'react';
import {
  ScrollView, StyleProp, View, ViewStyle,
} from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { COLORS, SPACING }    from '@/lib/theme';

interface ScreenProps {
  children:    React.ReactNode;
  scrollable?: boolean;
  padded?:     boolean;
  style?:      StyleProp<ViewStyle>;
  edges?:      Edge[];
}

export function Screen({
  children,
  scrollable = false,
  padded     = true,
  style,
  edges      = ['top', 'bottom'],
}: ScreenProps) {
  const contentStyle: ViewStyle = {
    flex:    scrollable ? undefined : 1,
    padding: padded ? SPACING.base : 0,
  };

  return (
    <SafeAreaView
      edges={edges}
      style={{ flex: 1, backgroundColor: COLORS.bg }}
    >
      {scrollable ? (
        <ScrollView
          contentContainerStyle={[contentStyle, style]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[contentStyle, style]}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}
