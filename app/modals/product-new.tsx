import { useState }                          from 'react';
import { Alert, Image, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { router, Stack }                    from 'expo-router';
import * as ImagePicker                      from 'expo-image-picker';
import { Ionicons }                          from '@expo/vector-icons';

import { Screen }          from '@/components/ui/Screen';
import { ProductForm }     from '@/components/products/ProductForm';
import type { ValidatedProductValues } from '@/components/products/ProductForm';
import { useCreateProduct }            from '@/hooks/useProducts';
import { useAuthContext }              from '@/context/AuthContext';
import {
  COLORS, FONT_SIZES, RADIUS, SHADOW, SPACING,
} from '@/lib/theme';

// ---------------------------------------------------------------------------
// Image strip (same pattern as product-edit)
// ---------------------------------------------------------------------------

function ImageStrip({
  images, onAdd, onRemove,
}: {
  images: string[]; onAdd: () => void; onRemove: (idx: number) => void;
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
        {images.map((uri, idx) => (
          <View key={uri + idx} style={{ position: 'relative' }}>
            <Image
              source={{ uri }}
              style={{ width: SIZE, height: SIZE, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border }}
              resizeMode="cover"
            />
            <Pressable
              onPress={() => onRemove(idx)}
              hitSlop={6}
              style={{
                position: 'absolute', top: -6, right: -6,
                backgroundColor: COLORS.danger, borderRadius: 999, width: 20, height: 20,
                alignItems: 'center', justifyContent: 'center', ...SHADOW.sm,
              }}
            >
              <Ionicons name="close" size={12} color="#fff" />
            </Pressable>
          </View>
        ))}
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
          <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.brand, fontWeight: '600' }}>Add</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ProductNewModal() {
  const { user }                  = useAuthContext();
  const { mutateAsync: create }   = useCreateProduct();
  const [images, setImages]       = useState<string[]>([]);

  if (user?.role !== 'owner') {
    router.back();
    return null;
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
      setImages(prev => [...prev, ...result.assets.map(a => a.uri)]);
    }
  }

  function handleRemoveImage(idx: number) {
    setImages(prev => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(values: ValidatedProductValues) {
    await create({ ...values, owner_id: user!.id, images, sku: null, category_id: null });
    router.back();
  }

  return (
    <>
      <Stack.Screen options={{
        title: 'New Product', headerShown: true,
        headerRight: () => (
          <Pressable onPress={() => router.back()} hitSlop={8} style={{ marginRight: 4 }}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </Pressable>
        ),
      }} />
      <Screen scrollable={false} padded={false}>
        <ImageStrip images={images} onAdd={handleAddImage} onRemove={handleRemoveImage} />
        <ProductForm
          submitLabel="Create Product"
          onSubmit={handleSubmit}
        />
      </Screen>
    </>
  );
}
