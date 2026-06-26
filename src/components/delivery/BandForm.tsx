/**
 * BandForm — shared create / edit form for delivery bands.
 *
 * Used in:
 *  - /modals/band-new  (create mode)
 *  - /modals/band-edit (edit mode, with deactivate button)
 *
 * max_distance_km is optional: an empty field is stored as null (open-ended).
 * This should only be the case for the last (highest distance) band.
 */

import React, { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';

import { TextInput } from '@/components/ui/TextInput';
import { Button }    from '@/components/ui/Button';
import { ApiError }  from '@/types';
import {
  COLORS, FONT_SIZES, RADIUS, SPACING,
} from '@/lib/theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BandFormValues {
  name:                 string;
  min_distance_km:      string;
  max_distance_km:      string; // empty string = open-ended (null)
  delivery_fee:         string;
  default_rider_payout: string;
}

export interface ValidatedBandValues {
  name:                 string;
  min_distance_km:      number;
  max_distance_km:      number | null;
  delivery_fee:         number;
  default_rider_payout: number;
}

interface Props {
  initialValues?:   Partial<BandFormValues>;
  onSubmit:         (values: ValidatedBandValues) => Promise<void>;
  onDeactivate?:    () => Promise<void>;
  submitLabel?:     string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function defaults(init?: Partial<BandFormValues>): BandFormValues {
  return {
    name:                 init?.name                 ?? '',
    min_distance_km:      init?.min_distance_km      ?? '0',
    max_distance_km:      init?.max_distance_km      ?? '',
    delivery_fee:         init?.delivery_fee         ?? '',
    default_rider_payout: init?.default_rider_payout ?? '',
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BandForm({
  initialValues,
  onSubmit,
  onDeactivate,
  submitLabel = 'Save Band',
}: Props) {
  const [values,      setValues]      = useState<BandFormValues>(defaults(initialValues));
  const [errors,      setErrors]      = useState<Partial<Record<keyof BandFormValues, string>>>({});
  const [submitting,  setSubmitting]  = useState(false);
  const [deactivating,setDeactivating]= useState(false);

  function set<K extends keyof BandFormValues>(key: K, val: string) {
    setValues(prev => ({ ...prev, [key]: val }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  }

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  function validate(): ValidatedBandValues | null {
    const errs: Partial<Record<keyof BandFormValues, string>> = {};

    if (!values.name.trim()) errs.name = 'Band name is required.';

    const minKm = parseFloat(values.min_distance_km);
    if (values.min_distance_km.trim() === '' || isNaN(minKm) || minKm < 0) {
      errs.min_distance_km = 'Enter a valid minimum distance (0 or more).';
    }

    let maxKm: number | null = null;
    if (values.max_distance_km.trim() !== '') {
      maxKm = parseFloat(values.max_distance_km);
      if (isNaN(maxKm) || maxKm <= 0) {
        errs.max_distance_km = 'Enter a valid max distance, or leave empty for open-ended.';
      } else if (!isNaN(minKm) && maxKm <= minKm) {
        errs.max_distance_km = `Max must be greater than min (${minKm} km).`;
      }
    }

    const fee = parseInt(values.delivery_fee, 10);
    if (!values.delivery_fee.trim() || isNaN(fee) || fee <= 0) {
      errs.delivery_fee = 'Enter a valid delivery fee greater than 0.';
    }

    const payout = parseInt(values.default_rider_payout, 10);
    if (!values.default_rider_payout.trim() || isNaN(payout) || payout <= 0) {
      errs.default_rider_payout = 'Enter a valid rider payout greater than 0.';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return null;
    }

    return {
      name:                 values.name.trim(),
      min_distance_km:      minKm,
      max_distance_km:      maxKm,
      delivery_fee:         fee,
      default_rider_payout: payout,
    };
  }

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  async function handleSubmit() {
    const validated = validate();
    if (!validated) return;
    setSubmitting(true);
    try {
      await onSubmit(validated);
    } catch (err) {
      Alert.alert('Error', err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleDeactivatePress() {
    Alert.alert(
      'Remove Band',
      'This band will be deactivated. Orders already assigned to this band are not affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setDeactivating(true);
            try {
              await onDeactivate?.();
            } catch (err) {
              Alert.alert('Error', err instanceof ApiError ? err.message : 'Failed to remove band.');
            } finally {
              setDeactivating(false);
            }
          },
        },
      ],
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      contentContainerStyle={{ padding: SPACING.base, paddingBottom: SPACING['2xl'] }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* ── Identity ─────────────────────────────────────────── */}
      <Label text="Band Details" />

      <TextInput
        label="Band Name *"
        placeholder="e.g. Band 1, Inner City, Far Zone"
        value={values.name}
        onChangeText={v => set('name', v)}
        error={errors.name}
        returnKeyType="next"
      />

      {/* ── Distance range ───────────────────────────────────── */}
      <Label text="Distance Range" style={{ marginTop: SPACING.xl }} />

      <View style={{ flexDirection: 'row', gap: SPACING.md }}>
        <View style={{ flex: 1 }}>
          <TextInput
            label="Min Distance (km) *"
            placeholder="e.g. 0"
            value={values.min_distance_km}
            onChangeText={v => set('min_distance_km', v.replace(/[^0-9.]/g, ''))}
            error={errors.min_distance_km}
            keyboardType="decimal-pad"
            returnKeyType="next"
          />
        </View>
        <View style={{ flex: 1 }}>
          <TextInput
            label="Max Distance (km)"
            placeholder="Empty = open-ended"
            value={values.max_distance_km}
            onChangeText={v => set('max_distance_km', v.replace(/[^0-9.]/g, ''))}
            error={errors.max_distance_km}
            keyboardType="decimal-pad"
            returnKeyType="next"
            helper="Leave empty for the last band (no upper limit)"
          />
        </View>
      </View>

      {/* ── Fees ─────────────────────────────────────────────── */}
      <Label text="Fees (Rs)" style={{ marginTop: SPACING.xl }} />

      <View style={{ flexDirection: 'row', gap: SPACING.md }}>
        <View style={{ flex: 1 }}>
          <TextInput
            label="Delivery Fee *"
            placeholder="e.g. 200"
            value={values.delivery_fee}
            onChangeText={v => set('delivery_fee', v.replace(/[^0-9]/g, ''))}
            error={errors.delivery_fee}
            keyboardType="numeric"
            returnKeyType="next"
            helper="Charged to customer"
          />
        </View>
        <View style={{ flex: 1 }}>
          <TextInput
            label="Rider Payout *"
            placeholder="e.g. 70"
            value={values.default_rider_payout}
            onChangeText={v => set('default_rider_payout', v.replace(/[^0-9]/g, ''))}
            error={errors.default_rider_payout}
            keyboardType="numeric"
            returnKeyType="done"
            helper="Paid to rider"
          />
        </View>
      </View>

      {/* ── Info box ─────────────────────────────────────────── */}
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
          Distance is calculated as a straight line (Haversine) from the delivery origin (Model Colony, Malir) to the customer's address.
        </Text>
      </View>

      {/* ── Actions ─────────────────────────────────────────── */}
      <View style={{ marginTop: SPACING.xl, gap: SPACING.sm }}>
        <Button
          label={submitLabel}
          onPress={handleSubmit}
          loading={submitting}
          fullWidth
          size="lg"
        />

        {onDeactivate && (
          <Button
            label="Remove Band"
            onPress={handleDeactivatePress}
            loading={deactivating}
            variant="danger"
            fullWidth
          />
        )}
      </View>
    </ScrollView>
  );
}

function Label({ text, style }: { text: string; style?: object }) {
  return (
    <Text
      style={[{
        fontSize:      FONT_SIZES.xs,
        fontWeight:    '700',
        color:         COLORS.muted,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginBottom:  SPACING.sm,
      }, style]}
    >
      {text}
    </Text>
  );
}
