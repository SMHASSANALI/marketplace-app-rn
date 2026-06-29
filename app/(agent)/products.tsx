import React, { useMemo, useState } from 'react';
import {
  Pressable,
  SectionList,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons }       from '@expo/vector-icons';

import { Screen }         from '@/components/ui/Screen';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState }     from '@/components/ui/EmptyState';
import { useProducts }    from '@/hooks/useProducts';
import { Product }        from '@/types';
import { formatCurrency } from '@/lib/utils';
import {
  COLORS, FONT_SIZES, RADIUS, SHADOW, SPACING,
} from '@/lib/theme';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface CategorySection {
  title: string;
  data:  Product[];
}

function buildSections(products: Product[]): CategorySection[] {
  const map = new Map<string, Product[]>();
  for (const p of products) {
    const key = p.category?.trim() || 'Uncategorised';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(p);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([title, data]) => ({ title, data }));
}

// ---------------------------------------------------------------------------
// Product row — read-only, shows base price as minimum selling price
// ---------------------------------------------------------------------------

function AgentProductRow({ product }: { product: Product }) {
  const isLowStock   = product.qty_available <= product.low_stock_threshold;
  const isOutOfStock = product.qty_available === 0;

  const stockColor = isOutOfStock
    ? COLORS.danger
    : isLowStock
    ? COLORS.warning
    : COLORS.muted;

  const stockText = isOutOfStock
    ? 'Out of stock'
    : `${product.qty_available} in stock${isLowStock ? ' ⚠' : ''}`;

  return (
    <View style={{
      flexDirection:   'row',
      alignItems:      'center',
      backgroundColor: COLORS.surface,
      borderRadius:    RADIUS.md,
      padding:         SPACING.base,
      marginBottom:    SPACING.sm,
      borderWidth:     1,
      borderColor:     isLowStock ? COLORS.warning : COLORS.border,
      ...SHADOW.sm,
    }}>
      <View style={{
        width:           48,
        height:          48,
        borderRadius:    RADIUS.md,
        backgroundColor: COLORS.brandLight,
        alignItems:      'center',
        justifyContent:  'center',
        marginRight:     SPACING.md,
      }}>
        <Text style={{ fontSize: 24 }}>{product.image_emoji}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text
          numberOfLines={1}
          style={{
            fontSize:   FONT_SIZES.base,
            fontWeight: '600',
            color:      COLORS.text,
            marginBottom: 3,
          }}
        >
          {product.name}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
          {product.category ? (
            <>
              <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted }}>
                {product.category}
              </Text>
              <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.border }}>·</Text>
            </>
          ) : null}
          <Text style={{
            fontSize:   FONT_SIZES.xs,
            color:      stockColor,
            fontWeight: isLowStock ? '600' : '400',
          }}>
            {stockText}
          </Text>
        </View>

        <Text style={{
          fontSize:   FONT_SIZES.sm,
          color:      COLORS.brand,
          fontWeight: '600',
          marginTop:  3,
        }}>
          Floor: {formatCurrency(product.selling_price)}
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function AgentProductsScreen() {
  const [search, setSearch] = useState('');

  const {
    data: products = [],
    isLoading,
    isRefetching,
    refetch,
  } = useProducts({ activeOnly: true });

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        (p.category?.toLowerCase().includes(q) ?? false) ||
        (p.description?.toLowerCase().includes(q) ?? false),
    );
  }, [products, search]);

  const sections = useMemo(() => buildSections(filtered), [filtered]);

  if (isLoading) return <LoadingSpinner fullScreen />;

  return (
    <Screen scrollable={false} padded={false}>

      {/* ── Header ── */}
      <View style={{
        paddingHorizontal: SPACING.base,
        paddingTop:        SPACING.base,
        paddingBottom:     SPACING.sm,
        backgroundColor:   COLORS.bg,
      }}>
        <Text style={{ fontSize: FONT_SIZES['2xl'], fontWeight: '800', color: COLORS.text }}>
          Products
        </Text>
        <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.muted }}>
          {products.length} available
        </Text>
      </View>

      {/* ── Search ── */}
      <View style={{ paddingHorizontal: SPACING.base, paddingBottom: SPACING.sm }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 8,
          backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
          borderWidth: 1, borderColor: COLORS.border,
          paddingHorizontal: 12, paddingVertical: 9,
        }}>
          <Ionicons name="search-outline" size={16} color={COLORS.muted} />
          <TextInput
            placeholder="Search by name, category…"
            placeholderTextColor={COLORS.muted}
            value={search}
            onChangeText={setSearch}
            style={{ flex: 1, fontSize: FONT_SIZES.base, color: COLORS.text }}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={COLORS.muted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* ── Content ── */}
      {filtered.length === 0 ? (
        <View style={{ flex: 1, paddingHorizontal: SPACING.base }}>
          <EmptyState
            emoji="📦"
            title={search ? 'No results' : 'No products available'}
            description={
              search
                ? 'Try a different search term.'
                : 'No active products in the catalog yet.'
            }
          />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={p => String(p.id)}
          contentContainerStyle={{
            paddingHorizontal: SPACING.base,
            paddingBottom:     SPACING['2xl'],
          }}
          refreshing={isRefetching}
          onRefresh={refetch}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <View style={{
              paddingTop:    SPACING.lg,
              paddingBottom: SPACING.xs,
              flexDirection: 'row',
              alignItems:    'center',
              justifyContent: 'space-between',
            }}>
              <Text style={{
                fontSize:      FONT_SIZES.sm,
                fontWeight:    '700',
                color:         COLORS.muted,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}>
                {section.title}
              </Text>
              <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted }}>
                {section.data.length}
              </Text>
            </View>
          )}
          renderItem={({ item }) => <AgentProductRow product={item} />}
        />
      )}
    </Screen>
  );
}
