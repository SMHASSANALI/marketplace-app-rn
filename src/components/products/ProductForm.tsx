/**
 * ProductForm — shared create / edit form for the product catalog.
 *
 * Used in:
 *  - /modals/product-new  (create mode)
 *  - /modals/product-edit (edit mode, with deactivate button)
 */

import React, { useState } from 'react';
import {
  Alert, ScrollView, Switch, Text, View,
} from 'react-native';

import { TextInput } from '@/components/ui/TextInput';
import { Button }    from '@/components/ui/Button';
import { ApiError }  from '@/types';
import {
  COLORS, FONT_SIZES, RADIUS, SPACING,
} from '@/lib/theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProductFormValues {
  name:                string;
  description:         string;
  image_emoji:         string;
  category:            string;
  buying_price:        string;
  selling_price:       string;
  qty_available:       string;
  low_stock_threshold: string;
  is_active:           boolean;
}

export interface ValidatedProductValues {
  name:                string;
  description:         string | null;
  image_emoji:         string;
  category:            string | null;
  buying_price:        number;
  selling_price:       number;
  qty_available:       number;
  low_stock_threshold: number;
  is_active:           boolean;
}

interface Props {
  initialValues?:    Partial<ProductFormValues>;
  sku?:              string | null;
  onSubmit:          (values: ValidatedProductValues) => Promise<void>;
  submitLabel?:      string;
  showActiveToggle?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function defaults(initial?: Partial<ProductFormValues>): ProductFormValues {
  return {
    name:                initial?.name                ?? '',
    description:         initial?.description         ?? '',
    image_emoji:         initial?.image_emoji         ?? '📦',
    category:            initial?.category            ?? '',
    buying_price:        initial?.buying_price        ?? '',
    selling_price:       initial?.selling_price       ?? '',
    qty_available:       initial?.qty_available       ?? '',
    low_stock_threshold: initial?.low_stock_threshold ?? '5',
    is_active:           initial?.is_active           ?? true,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProductForm({
  initialValues,
  sku,
  onSubmit,
  submitLabel      = 'Save Product',
  showActiveToggle = false,
}: Props) {
  const [values,     setValues]     = useState<ProductFormValues>(defaults(initialValues));
  const [errors,     setErrors]     = useState<Partial<Record<keyof ProductFormValues, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  }

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  function validate(): ValidatedProductValues | null {
    const errs: Partial<Record<keyof ProductFormValues, string>> = {};

    if (!values.name.trim())        errs.name        = 'Product name is required.';
    if (!values.image_emoji.trim()) errs.image_emoji = 'Emoji icon is required.';

    const buying = parseInt(values.buying_price, 10);
    if (!values.buying_price.trim() || isNaN(buying) || buying <= 0) {
      errs.buying_price = 'Enter a valid buying price greater than 0.';
    }

    const selling = parseInt(values.selling_price, 10);
    if (!values.selling_price.trim() || isNaN(selling) || selling <= 0) {
      errs.selling_price = 'Enter a valid selling price greater than 0.';
    } else if (!isNaN(buying) && selling < buying) {
      errs.selling_price = `Selling price must be ≥ buying price (Rs ${buying}).`;
    }

    const qty = parseInt(values.qty_available, 10);
    if (!values.qty_available.trim() || isNaN(qty) || qty < 0) {
      errs.qty_available = 'Enter a valid quantity (0 or more).';
    }

    const threshold = parseInt(values.low_stock_threshold, 10);
    if (!values.low_stock_threshold.trim() || isNaN(threshold) || threshold < 1) {
      errs.low_stock_threshold = 'Enter a valid threshold (1 or more).';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return null;
    }

    return {
      name:                values.name.trim(),
      description:         values.description.trim() || null,
      image_emoji:         values.image_emoji.trim(),
      category:            values.category.trim() || null,
      buying_price:        buying,
      selling_price:       selling,
      qty_available:       qty,
      low_stock_threshold: threshold,
      is_active:           values.is_active,
    };
  }

  async function handleSubmit() {
    const validated = validate();
    if (!validated) return;
    setSubmitting(true);
    try {
      await onSubmit(validated);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Something went wrong. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
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
      <SectionHeader title="Product Details" />

      {/* SKU — read-only, auto-generated */}
      <View style={{
        backgroundColor: COLORS.surfaceAlt,
        borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border,
        paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
        marginBottom: SPACING.md,
        flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
      }}>
        <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, flex: 1 }}>SKU</Text>
        <Text style={{
          fontSize: FONT_SIZES.sm, fontWeight: '700',
          color: sku ? COLORS.text : COLORS.muted,
          fontFamily: 'monospace',
        }}>
          {sku ?? 'Auto-generated on save'}
        </Text>
      </View>

      <TextInput
        label="Product Name *"
        placeholder="e.g. Wireless Earbuds"
        value={values.name}
        onChangeText={v => set('name', v)}
        error={errors.name}
        returnKeyType="next"
      />

      <View style={{ marginTop: SPACING.md }}>
        <TextInput
          label="Emoji Icon *"
          placeholder="📦"
          value={values.image_emoji}
          onChangeText={v => set('image_emoji', v)}
          error={errors.image_emoji}
          helper="Tap to open emoji keyboard on mobile"
          returnKeyType="next"
        />
      </View>

      <View style={{ marginTop: SPACING.md }}>
        <TextInput
          label="Category"
          placeholder="e.g. Electronics, Accessories"
          value={values.category}
          onChangeText={v => set('category', v)}
          returnKeyType="next"
        />
      </View>

      <View style={{ marginTop: SPACING.md }}>
        <TextInput
          label="Description"
          placeholder="Short product description (optional)"
          value={values.description}
          onChangeText={v => set('description', v)}
          multiline
          numberOfLines={3}
          returnKeyType="next"
        />
      </View>

      <SectionHeader title="Pricing & Inventory" style={{ marginTop: SPACING.xl }} />

      <View style={{ flexDirection: 'row', gap: SPACING.md }}>
        <View style={{ flex: 1 }}>
          <TextInput
            label="Buying Price (Rs) *"
            placeholder="e.g. 800"
            value={values.buying_price}
            onChangeText={v => set('buying_price', v.replace(/[^0-9]/g, ''))}
            error={errors.buying_price}
            keyboardType="numeric"
            returnKeyType="next"
            helper="Your cost — private"
          />
        </View>
        <View style={{ flex: 1 }}>
          <TextInput
            label="Selling Price (Rs) *"
            placeholder="e.g. 1200"
            value={values.selling_price}
            onChangeText={v => set('selling_price', v.replace(/[^0-9]/g, ''))}
            error={errors.selling_price}
            keyboardType="numeric"
            returnKeyType="next"
            helper="Agent's price floor"
          />
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.md }}>
        <View style={{ flex: 1 }}>
          <TextInput
            label="Qty in Stock *"
            placeholder="e.g. 50"
            value={values.qty_available}
            onChangeText={v => set('qty_available', v.replace(/[^0-9]/g, ''))}
            error={errors.qty_available}
            keyboardType="numeric"
            returnKeyType="next"
          />
        </View>
        <View style={{ flex: 1 }}>
          <TextInput
            label="Low Stock Alert *"
            placeholder="e.g. 5"
            value={values.low_stock_threshold}
            onChangeText={v => set('low_stock_threshold', v.replace(/[^0-9]/g, ''))}
            error={errors.low_stock_threshold}
            keyboardType="numeric"
            returnKeyType="done"
            helper="Warn below this qty"
          />
        </View>
      </View>

      {showActiveToggle && (
        <>
          <SectionHeader title="Status" style={{ marginTop: SPACING.xl }} />
          <View
            style={{
              flexDirection:   'row',
              alignItems:      'center',
              justifyContent:  'space-between',
              backgroundColor: COLORS.surface,
              borderRadius:    RADIUS.md,
              padding:         SPACING.base,
              borderWidth:     1,
              borderColor:     COLORS.border,
            }}
          >
            <View style={{ flex: 1, marginRight: SPACING.md }}>
              <Text style={{ fontSize: FONT_SIZES.base, fontWeight: '600', color: COLORS.text }}>
                {values.is_active ? 'Active' : 'Inactive'}
              </Text>
              <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginTop: 2 }}>
                {values.is_active
                  ? 'Visible to agents when placing orders'
                  : 'Hidden from agents — existing orders unaffected'}
              </Text>
            </View>
            <Switch
              value={values.is_active}
              onValueChange={v => set('is_active', v)}
              trackColor={{ true: COLORS.teal, false: COLORS.border }}
              thumbColor={COLORS.surface}
            />
          </View>
        </>
      )}

      <View style={{ marginTop: SPACING.xl }}>
        <Button
          label={submitLabel}
          onPress={handleSubmit}
          loading={submitting}
          fullWidth
          size="lg"
        />
      </View>
    </ScrollView>
  );
}

function SectionHeader({ title, style }: { title: string; style?: object }) {
  return (
    <Text
      style={[
        {
          fontSize:      FONT_SIZES.xs,
          fontWeight:    '700',
          color:         COLORS.muted,
          textTransform: 'uppercase',
          letterSpacing: 0.6,
          marginBottom:  SPACING.sm,
        },
        style,
      ]}
    >
      {title}
    </Text>
  );
}
