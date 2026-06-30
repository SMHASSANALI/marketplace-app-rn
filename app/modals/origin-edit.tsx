/**
 * Edit Delivery Origin modal — Owner only.
 *
 * Allows updating the dispatch warehouse label and coordinates.
 * Tip shown in-form: use Google Maps pin to get coordinates.
 *
 * Changing the origin updates haversine distances for NEW orders only —
 * existing customer address distances are snapshots.
 */

import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { router, Stack }   from 'expo-router';
import { Ionicons }        from '@expo/vector-icons';

import { Screen }           from '@/components/ui/Screen';
import { LoadingSpinner }   from '@/components/ui/LoadingSpinner';
import { TextInput }        from '@/components/ui/TextInput';
import { Button }           from '@/components/ui/Button';
import { useDeliveryOrigin, useUpdateOrigin } from '@/hooks/useDeliveryBands';
import { useAuthContext }   from '@/context/AuthContext';
import { ApiError }         from '@/types';
import {
  COLORS, FONT_SIZES, RADIUS, SPACING,
} from '@/lib/theme';

export default function OriginEditModal() {
  const { user }                         = useAuthContext();
  const { data: origin, isLoading }      = useDeliveryOrigin();
  const { mutateAsync: updateOrigin }    = useUpdateOrigin();

  const [label,     setLabel]     = useState('');
  const [latitude,  setLatitude]  = useState('');
  const [longitude, setLongitude] = useState('');
  const [errors,    setErrors]    = useState<{ label?: string; latitude?: string; longitude?: string }>({});
  const [saving,    setSaving]    = useState(false);
  const [initialised, setInitialised] = useState(false);

  if (user?.role !== 'owner') { router.back(); return null; }
  if (isLoading || !origin) return <LoadingSpinner fullScreen />;

  // Pre-fill once origin loads
  if (!initialised) {
    setLabel(origin.label);
    setLatitude(String(origin.latitude));
    setLongitude(String(origin.longitude));
    setInitialised(true);
  }

  function validate(): { label: string; latitude: number; longitude: number } | null {
    const errs: typeof errors = {};
    if (!label.trim()) errs.label = 'Location label is required.';
    const lat = parseFloat(latitude);
    if (isNaN(lat) || lat < -90 || lat > 90) errs.latitude = 'Enter a valid latitude (-90 to 90).';
    const lon = parseFloat(longitude);
    if (isNaN(lon) || lon < -180 || lon > 180) errs.longitude = 'Enter a valid longitude (-180 to 180).';
    if (Object.keys(errs).length) { setErrors(errs); return null; }
    return { label: label.trim(), latitude: lat, longitude: lon };
  }

  async function handleSave() {
    const validated = validate();
    if (!validated) return;
    setSaving(true);
    try {
      await updateOrigin(validated);
      router.back();
    } catch (err) {
      Alert.alert('Error', err instanceof ApiError ? err.message : 'Failed to save origin.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{
        title: 'Edit Dispatch Origin', headerShown: true,
        headerRight: () => (
          <Pressable onPress={() => router.back()} hitSlop={8} style={{ marginRight: 4 }}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </Pressable>
        ),
      }} />
      <Screen scrollable={false} padded={false}>
      <ScrollView
        style={{ flex: 1, backgroundColor: COLORS.bg }}
        contentContainerStyle={{ padding: SPACING.base, paddingBottom: SPACING['2xl'] }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TextInput
          label="Location Label *"
          placeholder="e.g. Model Colony, Malir, Karachi"
          value={label}
          onChangeText={v => { setLabel(v); setErrors(e => ({ ...e, label: undefined })); }}
          error={errors.label}
          returnKeyType="next"
        />

        <View style={{ flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.md }}>
          <View style={{ flex: 1 }}>
            <TextInput
              label="Latitude *"
              placeholder="e.g. 24.887"
              value={latitude}
              onChangeText={v => { setLatitude(v.replace(/[^0-9.\-]/g, '')); setErrors(e => ({ ...e, latitude: undefined })); }}
              error={errors.latitude}
              keyboardType="decimal-pad"
              returnKeyType="next"
            />
          </View>
          <View style={{ flex: 1 }}>
            <TextInput
              label="Longitude *"
              placeholder="e.g. 67.208"
              value={longitude}
              onChangeText={v => { setLongitude(v.replace(/[^0-9.\-]/g, '')); setErrors(e => ({ ...e, longitude: undefined })); }}
              error={errors.longitude}
              keyboardType="decimal-pad"
              returnKeyType="done"
            />
          </View>
        </View>

        {/* Tip */}
        <View
          style={{
            marginTop:       SPACING.lg,
            backgroundColor: COLORS.infoLight,
            borderRadius:    RADIUS.md,
            padding:         SPACING.md,
            borderWidth:     1,
            borderColor:     COLORS.info + '40',
          }}
        >
          <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.info, lineHeight: 18 }}>
            Tip: open Google Maps, drop a pin on the warehouse location, then long-press to copy coordinates.
          </Text>
        </View>

        <View style={{ marginTop: SPACING.xl }}>
          <Button label="Save Origin" onPress={handleSave} loading={saving} fullWidth size="lg" />
        </View>
      </ScrollView>
      </Screen>
    </>
  );
}
