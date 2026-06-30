/**
 * Edit Product modal — Owner only.
 *
 * Includes:
 *  - Multi-image uploader (stored as local URIs)
 *  - Full product field editing with active/inactive toggle
 */

import { useState }                          from 'react';
import { Alert, Image, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import * as ImagePicker                      from 'expo-image-picker';
import { Ionicons }                          from '@expo/vector-icons';

import { Screen }          from '@/components/ui/Screen';
import { LoadingSpinner }  from '@/components/ui/LoadingSpinner';
import { EmptyState }      from '@/components/ui/EmptyState';
import { ProductForm }     from '@/components/products/ProductForm';
import type { ValidatedProductValues } from '@/components/products/ProductForm';
import {
  useProduct,
  useUpdateProduct,
} from '@/hooks/useProducts';
import { useAuthContext }  from '@/context/AuthContext';
import {
  COLORS, FONT_SIZES, RADIUS, SHADOW, SPACING,
} from '@/lib/theme';

// ---------------------------------------------------------------------------
// Image uploader strip
// ---------------------------------------------------------------------------

function ImageStrip({
  images,
  onAdd,
  onRemove,
}: {
  images:   string[];
  onAdd:    () => void;
  onRemove: (idx: number) => void;
}) {
  const SIZE = 80;

  return (
    <View style={{
      borderBottomWidth: 1, borderColor: COLORS.border,
      backgroundColor: COLORS.surface,
      paddingVertical: SPACING.sm, paddingHorizontal: SPACING.base,
    }}>
      <Text style={{
        fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.muted,
        textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SPACING.xs,
      }}>
        Product Images ({images.length})
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: SPACING.xs, alignItems: 'center' }}>

        {/* Existing images */}
        {images.map((uri, idx) => (
          <View key={uri + idx} style={{ position: 'relative' }}>
            <Image
              source={{ uri }}
              style={{
                width: SIZE, height: SIZE, borderRadius: RADIUS.md,
                borderWidth: 1, borderColor: COLORS.border,
              }}
              resizeMode="cover"
            />
            <Pressable
              onPress={() => onRemove(idx)}
              hitSlop={6}
              style={{
                position: 'absolute', top: -6, right: -6,
                backgroundColor: COLORS.danger,
                borderRadius: 999, width: 20, height: 20,
                alignItems: 'center', justifyContent: 'center',
                ...SHADOW.sm,
              }}
            >
              <Ionicons name="close" size={12} color="#fff" />
            </Pressable>
          </View>
        ))}

        {/* Add button */}
        <Pressable
          onPress={onAdd}
          style={({ pressed }) => ({
            width: SIZE, height: SIZE, borderRadius: RADIUS.md,
            borderWidth: 1.5, borderColor: COLORS.brand, borderStyle: 'dashed',
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: pressed ? COLORS.brand + '10' : COLORS.bg,
            gap: 4,
          })}
        >
          <Ionicons name="add" size={22} color={COLORS.brand} />
          <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.brand, fontWeight: '600' }}>
            Add
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ProductEditModal() {
  const { user }                       = useAuthContext();
  const { id }                         = useLocalSearchParams<{ id: string }>();
  const productId                      = parseInt(id ?? '0', 10);

  const { data: product, isLoading }   = useProduct(productId);
  const { mutateAsync: update }        = useUpdateProduct();

  const [images, setImages]            = useState<string[] | null>(null);

  const currentImages = images ?? product?.images ?? [];

  // Guard
  if (user?.role !== 'owner') {
    router.back();
    return null;
  }

  if (isLoading) return <LoadingSpinner fullScreen />;

  if (!product) {
    return (
      <Screen>
        <EmptyState emoji="❓" title="Product not found" description="This product may have been removed." />
      </Screen>
    );
  }

  async function handleAddImage() {
    if (Platform.OS !== 'web') {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission required', 'Allow photo library access to upload product images.');
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.75,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newUris = result.assets.map(a => a.uri);
      setImages(prev => [...(prev ?? product!.images), ...newUris]);
    }
  }

  function handleRemoveImage(idx: number) {
    setImages(prev => {
      const arr = prev ?? product!.images;
      return arr.filter((_, i) => i !== idx);
    });
  }

  async function handleSubmit(values: ValidatedProductValues) {
    await update({ id: productId, input: { ...values, images: currentImages } });
    router.back();
  }

  return (
    <>
      <Stack.Screen options={{
        title: 'Edit Product', headerShown: true,
        headerRight: () => (
          <Pressable onPress={() => router.back()} hitSlop={8} style={{ marginRight: 4 }}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </Pressable>
        ),
      }} />
      <Screen scrollable={false} padded={false}>
      <ImageStrip
        images={currentImages}
        onAdd={handleAddImage}
        onRemove={handleRemoveImage}
      />
      <ProductForm
        initialValues={{
          name:                product.name,
          description:         product.description        ?? '',
          image_emoji:         product.image_emoji,
          category:            product.category           ?? '',
          buying_price:        String(product.buying_price),
          selling_price:       String(product.selling_price),
          qty_available:       String(product.qty_available),
          low_stock_threshold: String(product.low_stock_threshold),
          is_active:           product.is_active,
        }}
        sku={product.sku}
        submitLabel="Save Changes"
        showActiveToggle
        onSubmit={handleSubmit}
      />
    </Screen>
    </>
  );
}
