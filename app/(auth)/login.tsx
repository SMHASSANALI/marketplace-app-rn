/**
 * Login screen — entry point for all roles.
 *
 * Phone + password form. On success, the route guard in _layout.tsx
 * automatically redirects the user to their role-specific home.
 *
 * Dev shortcuts: tap any role chip to pre-fill that test account's number.
 * These chips are only rendered when __DEV__ === true.
 *
 * Test accounts (any password accepted in mock):
 *   Owner:   0300 1112222
 *   Manager: 0300 2223333
 *   Agent:   0321 1234567
 *   Rider:   0345 1234567
 */

import React, { useRef, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform,
  Pressable, Text, View,
} from 'react-native';
import { TextInput as RNTextInput } from 'react-native';

import { useAuthContext }  from '@/context/AuthContext';
import { Screen }          from '@/components/ui/Screen';
import { TextInput }       from '@/components/ui/TextInput';
import { Button }          from '@/components/ui/Button';
import { COLORS, FONT_SIZES, SPACING } from '@/lib/theme';
import { ApiError }        from '@/types';

// ---------------------------------------------------------------------------
// Dev shortcut accounts
// ---------------------------------------------------------------------------

const DEV_ACCOUNTS = [
  { role: 'Owner',   phone: '03001112222' },
  { role: 'Manager', phone: '03002223333' },
  { role: 'Agent',   phone: '03211234567' },
  { role: 'Rider',   phone: '03451234567' },
] as const;

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function LoginScreen() {
  const { login }          = useAuthContext();
  const [phone, setPhone]  = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const passwordRef = useRef<RNTextInput>(null);

  async function handleLogin() {
    setPhoneError('');
    if (!phone.trim()) {
      setPhoneError('Phone number is required.');
      return;
    }
    setLoading(true);
    try {
      await login(phone.trim(), password);
      // Route guard in _layout.tsx handles navigation on success
    } catch (err) {
      if (err instanceof ApiError) {
        Alert.alert('Login failed', err.message);
      } else {
        Alert.alert('Login failed', 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen scrollable padded={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View
          style={{
            paddingTop:    64,
            paddingBottom: 40,
            paddingHorizontal: SPACING.base,
            backgroundColor: COLORS.brand,
          }}
        >
          <Text style={{ fontSize: 28, fontWeight: '800', color: '#fff' }}>
            Marketplace
          </Text>
          <Text style={{ fontSize: FONT_SIZES.base, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>
            Sign in to your account
          </Text>
        </View>

        {/* Form */}
        <View style={{ padding: SPACING.base, gap: SPACING.md }}>
          <TextInput
            label="Phone Number"
            placeholder="e.g. 0321 1234567"
            keyboardType="phone-pad"
            returnKeyType="next"
            value={phone}
            onChangeText={setPhone}
            error={phoneError}
            onSubmitEditing={() => passwordRef.current?.focus()}
          />

          <TextInput
            ref={passwordRef}
            label="Password"
            placeholder="Enter your password"
            secureTextEntry
            returnKeyType="done"
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={handleLogin}
          />

          <Button
            label="Sign In"
            onPress={handleLogin}
            loading={loading}
            fullWidth
            size="lg"
          />
        </View>

        {/* Dev shortcuts — only in development builds */}
        {__DEV__ && (
          <View style={{ padding: SPACING.base }}>
            <Text
              style={{
                fontSize: FONT_SIZES.xs,
                color: COLORS.muted,
                marginBottom: 8,
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              Dev — Quick Login
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {DEV_ACCOUNTS.map(account => (
                <Pressable
                  key={account.role}
                  onPress={() => { setPhone(account.phone); setPassword('test'); }}
                  style={({ pressed }) => ({
                    paddingHorizontal: 12,
                    paddingVertical:   6,
                    borderRadius:      20,
                    backgroundColor:   pressed ? COLORS.brandLight : COLORS.surfaceAlt,
                    borderWidth:       1,
                    borderColor:       COLORS.border,
                  })}
                >
                  <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.brand, fontWeight: '600' }}>
                    {account.role}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}
