/**
 * PhoneSearchBar — phone number input with a search button.
 *
 * Accepts Pakistani format (03XX or 92XX). Displays a helper hint
 * and forwards the current value + a "Search" action to the parent.
 */

import React from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import { COLORS, FONT_SIZES, RADIUS, SPACING } from '@/lib/theme';

interface Props {
  value:          string;
  onChangeText:   (v: string) => void;
  onSearch:       () => void;
  loading?:       boolean;
  error?:         string;
  disabled?:      boolean;
}

export function PhoneSearchBar({
  value, onChangeText, onSearch, loading = false, error, disabled = false,
}: Props) {
  return (
    <View>
      <Text style={{ fontSize: FONT_SIZES.xs, fontWeight: '600', color: COLORS.muted, marginBottom: 6 }}>
        Customer Phone *
      </Text>

      <View
        style={{
          flexDirection:  'row',
          alignItems:     'center',
          borderWidth:    1,
          borderColor:    error ? COLORS.danger : COLORS.border,
          borderRadius:   RADIUS.md,
          backgroundColor: COLORS.surface,
          overflow:       'hidden',
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSearch}
          placeholder="03XX XXXXXXX"
          placeholderTextColor={COLORS.muted}
          keyboardType="phone-pad"
          returnKeyType="search"
          editable={!disabled && !loading}
          style={{
            flex:              1,
            paddingHorizontal: SPACING.md,
            paddingVertical:   12,
            fontSize:          FONT_SIZES.base,
            color:             COLORS.text,
          }}
        />

        <Pressable
          onPress={onSearch}
          disabled={disabled || loading || !value.trim()}
          style={({ pressed }) => ({
            paddingHorizontal: SPACING.md,
            paddingVertical:   12,
            backgroundColor:   COLORS.brand,
            opacity: (pressed || !value.trim()) ? 0.6 : 1,
          })}
        >
          {loading ? (
            <ActivityIndicator size={16} color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: FONT_SIZES.sm }}>
              Search
            </Text>
          )}
        </Pressable>
      </View>

      {error && (
        <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.danger, marginTop: 4 }}>
          {error}
        </Text>
      )}

      <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginTop: 4 }}>
        Enter mobile number (e.g. 0300 1112222)
      </Text>
    </View>
  );
}
