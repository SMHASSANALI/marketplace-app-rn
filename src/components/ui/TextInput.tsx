/**
 * TextInput — styled form input with label, helper text, and error state.
 *
 * Wraps the native TextInput with consistent styling matching the app's
 * design system. Supports all standard TextInput props via spread.
 *
 * Props:
 *  label       — field label rendered above the input
 *  error       — error message shown below (also colours the border red)
 *  helper      — helper/hint text shown below (hidden when error is set)
 *  leftIcon    — optional node rendered inside the input on the left
 *  rightIcon   — optional node rendered inside the input on the right
 *  containerStyle — override for the outer wrapper
 */

import React, { forwardRef, useState } from 'react';
import {
  StyleProp, Text, TextInput as RNTextInput,
  TextInputProps, View, ViewStyle,
} from 'react-native';
import { COLORS, FONT_SIZES, RADIUS } from '@/lib/theme';

interface Props extends TextInputProps {
  label?:          string;
  error?:          string;
  helper?:         string;
  leftIcon?:       React.ReactNode;
  rightIcon?:      React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * Forwarding ref so parent components can call .focus() / .blur() if needed.
 */
export const TextInput = forwardRef<RNTextInput, Props>(function TextInput(
  { label, error, helper, leftIcon, rightIcon, containerStyle, style, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? COLORS.danger
    : focused
      ? COLORS.brand
      : COLORS.border;

  return (
    <View style={[{ gap: 4 }, containerStyle]}>

      {/* Label */}
      {label && (
        <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.text }}>
          {label}
        </Text>
      )}

      {/* Input row */}
      <View
        style={{
          flexDirection:    'row',
          alignItems:       'center',
          backgroundColor:  COLORS.surface,
          borderWidth:      1.5,
          borderColor,
          borderRadius:     RADIUS.md,
          paddingHorizontal:12,
          paddingVertical:  0,
          gap:              8,
        }}
      >
        {leftIcon}

        <RNTextInput
          ref={ref}
          onFocus={e => { setFocused(true);  rest.onFocus?.(e); }}
          onBlur={e  => { setFocused(false); rest.onBlur?.(e);  }}
          placeholderTextColor={COLORS.muted}
          style={[
            {
              flex:            1,
              fontSize:        FONT_SIZES.base,
              color:           COLORS.text,
              paddingVertical: 12,
              fontWeight:      '400',
            },
            style,
          ]}
          {...rest}
        />

        {rightIcon}
      </View>

      {/* Error / Helper */}
      {error ? (
        <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.danger }}>{error}</Text>
      ) : helper ? (
        <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted }}>{helper}</Text>
      ) : null}

    </View>
  );
});
