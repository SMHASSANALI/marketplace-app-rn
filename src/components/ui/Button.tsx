/**
 * Button — primary interactive element.
 *
 * Variants:
 *  'primary'   — brand-coloured fill (default CTAs)
 *  'secondary' — outlined border, no fill (secondary actions)
 *  'ghost'     — no border or fill (inline/tertiary actions)
 *  'danger'    — red fill (destructive actions)
 *
 * Sizes:
 *  'sm'  — compact (icon buttons, chips)
 *  'md'  — default
 *  'lg'  — prominent CTAs (full-width submit buttons)
 *
 * The button is automatically disabled and shows a spinner while `loading`.
 */

import React                              from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { COLORS, RADIUS, FONT_SIZES, FONT_WEIGHTS } from '@/lib/theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size    = 'sm' | 'md' | 'lg';

interface ButtonProps {
  /** Button label text. */
  label:       string;
  onPress:     () => void;
  variant?:    Variant;
  size?:       Size;
  /** Shows a spinner and disables the button while true. */
  loading?:    boolean;
  disabled?:   boolean;
  /** Optional icon rendered before the label. */
  icon?:       React.ReactNode;
  /** If true, the button stretches to fill its container's width. */
  fullWidth?:  boolean;
}

// ---------------------------------------------------------------------------
// Style maps
// ---------------------------------------------------------------------------

const BG: Record<Variant, string> = {
  primary:   COLORS.brand,
  secondary: 'transparent',
  ghost:     'transparent',
  danger:    COLORS.danger,
};

const BORDER: Record<Variant, string | undefined> = {
  primary:   undefined,
  secondary: COLORS.brand,
  ghost:     undefined,
  danger:    undefined,
};

const LABEL_COLOR: Record<Variant, string> = {
  primary:   '#ffffff',
  secondary: COLORS.brand,
  ghost:     COLORS.text,
  danger:    '#ffffff',
};

const PADDING_V: Record<Size, number> = { sm: 8,  md: 12, lg: 16 };
const PADDING_H: Record<Size, number> = { sm: 12, md: 16, lg: 20 };
const FONT_SIZE: Record<Size, number> = {
  sm: FONT_SIZES.sm,
  md: FONT_SIZES.base,
  lg: FONT_SIZES.md,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Button({
  label,
  onPress,
  variant   = 'primary',
  size      = 'md',
  loading   = false,
  disabled  = false,
  icon,
  fullWidth = false,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      style={({ pressed }) => ({
        flexDirection:   'row',
        alignItems:      'center',
        justifyContent:  'center',
        gap:             8,
        backgroundColor: isDisabled ? '#d6d3d1' : BG[variant],
        borderWidth:     BORDER[variant] ? 1.5 : 0,
        borderColor:     isDisabled ? '#d6d3d1' : BORDER[variant],
        borderRadius:    RADIUS.md,
        paddingVertical: PADDING_V[size],
        paddingHorizontal: PADDING_H[size],
        opacity:         pressed && !isDisabled ? 0.82 : 1,
        alignSelf:       fullWidth ? 'stretch' : 'flex-start',
      })}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'secondary' || variant === 'ghost' ? COLORS.brand : '#ffffff'}
        />
      ) : (
        <>
          {icon && <View>{icon}</View>}
          <Text
            style={{
              fontSize:   FONT_SIZE[size],
              fontWeight: FONT_WEIGHTS.semibold,
              color:      isDisabled ? '#a8a29e' : LABEL_COLOR[variant],
            }}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}
