import React, { useMemo, useState } from 'react';
import {
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router }         from 'expo-router';
import { Ionicons }       from '@expo/vector-icons';
import { SafeAreaView }   from 'react-native-safe-area-context';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState }     from '@/components/ui/EmptyState';
import { useProducts }    from '@/hooks/useProducts';
import { Product }        from '@/types';
import { formatCurrency } from '@/lib/utils';

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  bg:        '#F8FAFC',
  surface:   '#FFFFFF',
  border:    '#E2E8F0',
  brand:     '#4F46E5',
  brandDark: '#4338CA',
  brandLight:'#EEF2FF',
  text:      '#0F172A',
  textSub:   '#475569',
  textMeta:  '#94A3B8',
  amber:     '#B45309', amberBg:  '#FEF3C7',
  rose:      '#BE123C', roseBg:   '#FFE4E6',
  emerald:   '#047857', emeraldBg:'#D1FAE5',
  slate400:  '#94A3B8',
} as const;

const SH = {
  shadowColor:   '#64748B',
  shadowOffset:  { width: 0, height: 4 },
  shadowOpacity: 0.04,
  shadowRadius:  12,
  elevation:     2,
};

// ─── Section helper ───────────────────────────────────────────────────────────

interface CategorySection { title: string; data: Product[] }

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

// ─── Product row ─────────────────────────────────────────────────────────────

function ProductRow({ product, onPress }: { product: Product; onPress: () => void }) {
  const isLowStock   = product.qty_available <= product.low_stock_threshold;
  const isOutOfStock = product.qty_available === 0;
  const inactive     = !product.is_active;

  const stockColor = isOutOfStock
    ? C.rose
    : isLowStock
    ? C.amber
    : C.emerald;

  const stockBg = isOutOfStock
    ? C.roseBg
    : isLowStock
    ? C.amberBg
    : C.emeraldBg;

  const stockLabel = isOutOfStock
    ? 'Out of stock'
    : isLowStock
    ? `${product.qty_available} — low stock`
    : `${product.qty_available} in stock`;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.productRow, SH, pressed && { opacity: 0.76 }]}
    >
      {/* Emoji image frame */}
      <View style={[
        s.emojiFrame,
        {
          backgroundColor: inactive ? '#F1F5F9' : C.brandLight,
          borderColor:     isLowStock && !inactive ? C.amber + '60' : C.border,
        },
      ]}>
        <Text style={[s.emoji, inactive && { opacity: 0.4 }]}>{product.image_emoji}</Text>
      </View>

      {/* Content */}
      <View style={s.productContent}>
        {/* Name + inactive pill */}
        <View style={s.productNameRow}>
          <Text
            style={[s.productName, inactive && { color: C.textMeta }]}
            numberOfLines={1}
          >
            {product.name}
          </Text>
          {inactive && (
            <View style={s.inactivePill}>
              <Text style={s.inactivePillText}>Inactive</Text>
            </View>
          )}
        </View>

        {/* Category */}
        {product.category ? (
          <Text style={s.productCategory}>{product.category}</Text>
        ) : null}

        {/* Stock pill + price */}
        <View style={s.productMeta}>
          <View style={[s.stockPill, { backgroundColor: inactive ? '#F1F5F9' : stockBg }]}>
            {!inactive && (
              <View style={[s.stockDot, { backgroundColor: stockColor }]} />
            )}
            <Text style={[s.stockText, { color: inactive ? C.textMeta : stockColor }]}>
              {inactive ? `${product.qty_available} in stock` : stockLabel}
            </Text>
          </View>
          <Text style={s.priceText}>{formatCurrency(product.selling_price)}</Text>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={16} color={C.border} />
    </Pressable>
  );
}

// ─── Low-stock header section ─────────────────────────────────────────────────

function LowStockSection({
  items, onPress,
}: { items: Product[]; onPress: (p: Product) => void }) {
  return (
    <View style={s.lowStockWrap}>
      {/* Header */}
      <View style={s.lowStockHeader}>
        <View style={s.lowStockIconBox}>
          <Ionicons name="warning" size={13} color={C.rose} />
        </View>
        <Text style={s.lowStockTitle}>Low Stock Alert</Text>
        <View style={s.lowStockCount}>
          <Text style={s.lowStockCountText}>{items.length}</Text>
        </View>
      </View>

      {/* Items */}
      {items.map(p => (
        <ProductRow key={p.id} product={p} onPress={() => onPress(p)} />
      ))}

      {/* Divider */}
      <View style={s.lowStockDivider} />
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function OwnerProductsScreen() {
  const [search,       setSearch]       = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const {
    data: allProducts = [],
    isLoading,
    isRefetching,
    refetch,
  } = useProducts({ activeOnly: false });

  const filtered = useMemo(() => {
    let list = showInactive ? allProducts : allProducts.filter(p => p.is_active);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          (p.category?.toLowerCase().includes(q) ?? false) ||
          (p.description?.toLowerCase().includes(q) ?? false),
      );
    }
    return list;
  }, [allProducts, search, showInactive]);

  const lowStock = useMemo(
    () => filtered.filter(p => p.is_active && p.qty_available <= p.low_stock_threshold),
    [filtered],
  );

  const sections    = useMemo(() => buildSections(filtered), [filtered]);
  const activeCount = allProducts.filter(p => p.is_active).length;

  function openEdit(p: Product) {
    router.push({ pathname: '/modals/product-edit', params: { id: String(p.id) } });
  }

  if (isLoading) return <LoadingSpinner fullScreen />;

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>

      {/* ── Top bar ── */}
      <View style={s.topBar}>
        <View>
          <Text style={s.screenTitle}>Products</Text>
          <Text style={s.screenSub}>
            {activeCount} active · {allProducts.length} total
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable
            onPress={() => router.push('/(owner)/bulk-upload')}
            style={({ pressed }) => [s.newBtn, { backgroundColor: C.brandDark }, pressed && { opacity: 0.82 }]}
          >
            <Ionicons name="cloud-upload-outline" size={15} color="#fff" />
            <Text style={s.newBtnText}>Bulk</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/modals/product-new')}
            style={({ pressed }) => [s.newBtn, pressed && { opacity: 0.82 }]}
          >
            <Ionicons name="add" size={17} color="#fff" />
            <Text style={s.newBtnText}>New</Text>
          </Pressable>
        </View>
      </View>

      {/* ── Search ── */}
      <View style={s.searchWrap}>
        <View style={s.searchBar}>
          <Ionicons name="search-outline" size={15} color={C.textMeta} />
          <TextInput
            placeholder="Search products, categories…"
            placeholderTextColor={C.textMeta}
            value={search}
            onChangeText={setSearch}
            style={s.searchInput}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={10}>
              <Ionicons name="close-circle" size={16} color={C.slate400} />
            </Pressable>
          )}
        </View>
      </View>

      {/* ── Filters ── */}
      <View style={s.filterBar}>
        <Pressable
          onPress={() => setShowInactive(v => !v)}
          style={[s.filterChip, showInactive && s.filterChipActive]}
        >
          <Ionicons
            name={showInactive ? 'eye-outline' : 'eye-off-outline'}
            size={12}
            color={showInactive ? C.brand : C.textMeta}
          />
          <Text style={[s.filterChipText, showInactive && { color: C.brand }]}>
            {showInactive ? 'Showing inactive' : 'Active only'}
          </Text>
        </Pressable>
      </View>

      {/* ── Content ── */}
      {filtered.length === 0 ? (
        <View style={s.emptyWrap}>
          <EmptyState
            emoji="📦"
            title={search ? 'No results' : 'No products yet'}
            description={
              search
                ? 'Try a different search term or clear the filter.'
                : 'Tap "New" to add your first product to the catalog.'
            }
            action={
              !search
                ? { label: 'Add Product', onPress: () => router.push('/modals/product-new') }
                : undefined
            }
          />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={p => String(p.id)}
          contentContainerStyle={s.listContent}
          refreshing={isRefetching}
          onRefresh={refetch}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            lowStock.length > 0 ? (
              <LowStockSection items={lowStock} onPress={openEdit} />
            ) : null
          }
          renderSectionHeader={({ section }) => (
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>{section.title}</Text>
              <View style={s.sectionCount}>
                <Text style={s.sectionCountText}>{section.data.length}</Text>
              </View>
            </View>
          )}
          renderItem={({ item }) => (
            <ProductRow product={item} onPress={() => openEdit(item)} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  emptyWrap: { flex: 1, paddingHorizontal: 16 },

  // Top bar
  topBar: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 16,
    paddingTop:        16,
    paddingBottom:     12,
    backgroundColor:   C.bg,
  },
  screenTitle: {
    fontSize:      22,
    fontWeight:    '800',
    color:         C.text,
    letterSpacing: -0.4,
  },
  screenSub: {
    fontSize:   12,
    color:      C.textMeta,
    fontWeight: '500',
    marginTop:  2,
  },
  newBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               5,
    backgroundColor:   C.brand,
    paddingHorizontal: 16,
    paddingVertical:   9,
    borderRadius:      999,
  },
  newBtnText: {
    color:      '#fff',
    fontWeight: '700',
    fontSize:   13,
  },

  // Search
  searchWrap: {
    paddingHorizontal: 16,
    paddingBottom:     8,
  },
  searchBar: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               8,
    backgroundColor:   C.surface,
    borderRadius:      12,
    borderWidth:       1,
    borderColor:       C.border,
    paddingHorizontal: 12,
    paddingVertical:   10,
  },
  searchInput: {
    flex:     1,
    fontSize: 14,
    color:    C.text,
  },

  // Filter bar
  filterBar: {
    flexDirection:     'row',
    paddingHorizontal: 16,
    paddingBottom:     10,
    gap:               8,
  },
  filterChip: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               5,
    borderWidth:       1,
    borderColor:       C.border,
    borderRadius:      999,
    paddingHorizontal: 12,
    paddingVertical:   6,
    backgroundColor:   C.surface,
  },
  filterChipActive: {
    backgroundColor: C.brandLight,
    borderColor:     C.brand + '40',
  },
  filterChipText: {
    fontSize:   12,
    fontWeight: '600',
    color:      C.textMeta,
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingBottom:     40,
  },

  // Low stock section
  lowStockWrap: {
    backgroundColor: C.roseBg,
    borderRadius:    12,
    borderWidth:     1,
    borderColor:     '#FECDD3',
    padding:         12,
    marginBottom:    4,
    gap:             8,
  },
  lowStockHeader: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            8,
    marginBottom:   4,
  },
  lowStockIconBox: {
    width:           28,
    height:          28,
    borderRadius:    8,
    backgroundColor: '#FFE4E6',
    alignItems:      'center',
    justifyContent:  'center',
  },
  lowStockTitle: {
    flex:       1,
    fontSize:   12,
    fontWeight: '700',
    color:      C.rose,
    textTransform: 'uppercase',
    letterSpacing:  0.6,
  },
  lowStockCount: {
    backgroundColor:   '#FECDD3',
    borderRadius:      999,
    paddingHorizontal: 9,
    paddingVertical:   2,
  },
  lowStockCountText: {
    fontSize:   11,
    fontWeight: '800',
    color:      C.rose,
  },
  lowStockDivider: {
    height:          1,
    backgroundColor: '#FECDD3',
    marginTop:       4,
  },

  // Section headers
  sectionHeader: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingTop:     20,
    paddingBottom:  8,
  },
  sectionTitle: {
    fontSize:      11,
    fontWeight:    '700',
    color:         C.textMeta,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionCount: {
    backgroundColor:   C.border,
    borderRadius:      999,
    paddingHorizontal: 9,
    paddingVertical:   2,
  },
  sectionCountText: {
    fontSize:   10,
    fontWeight: '700',
    color:      C.textSub,
  },

  // Product row
  productRow: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: C.surface,
    borderRadius:    12,
    borderWidth:     1,
    borderColor:     C.border,
    padding:         12,
    marginBottom:    8,
    gap:             12,
  },
  emojiFrame: {
    width:        48,
    height:       48,
    borderRadius: 10,
    borderWidth:  1,
    alignItems:   'center',
    justifyContent: 'center',
    flexShrink:   0,
  },
  emoji: {
    fontSize: 22,
  },
  productContent: {
    flex: 1,
    gap:  4,
  },
  productNameRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
  },
  productName: {
    fontSize:   14,
    fontWeight: '700',
    color:      C.text,
    flex:       1,
  },
  inactivePill: {
    backgroundColor:   '#F1F5F9',
    borderRadius:      999,
    paddingHorizontal: 7,
    paddingVertical:   2,
  },
  inactivePillText: {
    fontSize:   9,
    fontWeight: '700',
    color:      C.textMeta,
    textTransform: 'uppercase',
    letterSpacing:  0.4,
  },
  productCategory: {
    fontSize:   11,
    color:      C.textMeta,
    fontWeight: '500',
  },
  productMeta: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginTop:      2,
  },
  stockPill: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               5,
    borderRadius:      999,
    paddingHorizontal: 9,
    paddingVertical:   3,
  },
  stockDot: {
    width:        6,
    height:       6,
    borderRadius: 3,
  },
  stockText: {
    fontSize:   10,
    fontWeight: '700',
  },
  priceText: {
    fontSize:   13,
    fontWeight: '800',
    color:      C.brand,
    letterSpacing: -0.2,
  },
});
