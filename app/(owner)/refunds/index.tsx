/**
 * Owner — Refunds & Exchanges list.
 *
 * Shows all refund/exchange requests. Tap one to view detail + take action.
 * The "New" button opens the create flow (find order by code → select items).
 */

import { useState }                      from 'react';
import { Alert, FlatList, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { router, Stack }                 from 'expo-router';
import { Ionicons }                      from '@expo/vector-icons';

import { Screen }         from '@/components/ui/Screen';
import { Button }         from '@/components/ui/Button';
import { EmptyState }     from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuthContext } from '@/context/AuthContext';
import {
  useRefundExchanges,
  useFindOrderForRefund,
  useCreateRefundExchange,
} from '@/hooks/useRefundExchange';
import type { RefundExchangeFull, RefundExchangeType } from '@/types';
import {
  COLORS, FONT_SIZES, RADIUS, SHADOW, SPACING,
} from '@/lib/theme';

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

const STATUS_COLOR: Record<string, string> = {
  pending:   COLORS.warning,
  approved:  COLORS.info,
  completed: COLORS.teal,
  rejected:  COLORS.danger,
};

const STATUS_LABEL: Record<string, string> = {
  pending:   'Pending',
  approved:  'Approved',
  completed: 'Completed',
  rejected:  'Rejected',
};

// ---------------------------------------------------------------------------
// RE list row
// ---------------------------------------------------------------------------

function RERow({ item }: { item: RefundExchangeFull }) {
  const color = STATUS_COLOR[item.status] ?? COLORS.muted;
  return (
    <Pressable
      onPress={() => router.push(`/(owner)/refunds/${item.id}`)}
      style={({ pressed }) => ({
        backgroundColor: pressed ? COLORS.surfaceAlt : COLORS.surface,
        borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border,
        padding: SPACING.md, marginBottom: SPACING.sm, ...SHADOW.sm,
      })}
    >
      {/* Header row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xs }}>
        <Text style={{ fontSize: FONT_SIZES.base, fontWeight: '700', color: COLORS.text, flex: 1 }}>
          {item.order_code}
        </Text>
        <View style={{ backgroundColor: color + '20', borderRadius: RADIUS.sm, paddingHorizontal: 8, paddingVertical: 2 }}>
          <Text style={{ fontSize: FONT_SIZES.xs, fontWeight: '700', color }}>{STATUS_LABEL[item.status]}</Text>
        </View>
      </View>

      {/* Type + customer */}
      <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.text }}>
        {item.type === 'refund' ? '↩ Refund' : '🔄 Exchange'} · {item.customer_name}
      </Text>
      {item.type === 'refund' && item.refund_amount > 0 && (
        <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.teal, marginTop: 2 }}>
          Rs {item.refund_amount.toLocaleString()}
        </Text>
      )}
      <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginTop: 4 }}>
        {new Date(item.created_at).toLocaleDateString()} · {item.line_items.length} item(s)
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Create RE form — Step 1: find order
// ---------------------------------------------------------------------------

function CreateREFlow({ onClose }: { onClose: () => void }) {
  const { user }                  = useAuthContext();
  const [step, setStep]           = useState<'lookup' | 'select'>('lookup');
  const [orderCode, setOrderCode] = useState('');
  const [reType, setReType]       = useState<RefundExchangeType>('refund');
  const [reason, setReason]       = useState('');
  const [selected, setSelected]   = useState<Record<number, { qty: number }>>({});

  const { mutateAsync: findOrder, isPending: finding, data: foundOrder, error: findError, reset } = useFindOrderForRefund();
  const { mutateAsync: createRE, isPending: creating } = useCreateRefundExchange();

  const orderInfo = foundOrder as {
    order_id: number; order_code: string; customer_name: string; status: string;
    line_items: { id: number; product_id: number; product_name: string; product_emoji: string; quantity: number; agent_price_snapshot: number }[];
  } | undefined;

  async function handleLookup() {
    if (!orderCode.trim()) return;
    reset();
    await findOrder(orderCode.trim());
    setStep('select');
  }

  function toggleItem(liId: number, maxQty: number) {
    setSelected(prev => {
      if (prev[liId]) {
        const n = { ...prev };
        delete n[liId];
        return n;
      }
      return { ...prev, [liId]: { qty: maxQty } };
    });
  }

  async function handleSubmit() {
    if (!orderInfo) return;
    if (!reason.trim()) { Alert.alert('Reason required', 'Please enter a reason.'); return; }
    const items = Object.entries(selected).map(([liId, { qty }]) => {
      const li = orderInfo.line_items.find(i => i.id === Number(liId))!;
      return {
        order_line_item_id: li.id,
        product_id:         li.product_id,
        return_quantity:    qty,
      };
    });
    if (!items.length) { Alert.alert('No items selected', 'Select at least one item.'); return; }
    try {
      await createRE({ input: { order_id: orderInfo.order_id, type: reType, reason, items }, actorId: user!.id });
      Alert.alert('Created', `${reType === 'refund' ? 'Refund' : 'Exchange'} request created.`);
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Something went wrong.');
    }
  }

  const inputStyle = {
    borderWidth: 1, borderRadius: RADIUS.sm, padding: SPACING.sm,
    fontSize: FONT_SIZES.sm, color: COLORS.text, backgroundColor: COLORS.bg,
    borderColor: COLORS.border,
  };

  return (
    <View style={{
      backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
      borderWidth: 1, borderColor: COLORS.brand,
      padding: SPACING.md, marginBottom: SPACING.md, gap: SPACING.sm, ...SHADOW.sm,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.text, flex: 1 }}>
          New Refund / Exchange
        </Text>
        <Pressable onPress={onClose} hitSlop={8}>
          <Ionicons name="close" size={20} color={COLORS.muted} />
        </Pressable>
      </View>

      {/* Type toggle */}
      <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
        {(['refund', 'exchange'] as RefundExchangeType[]).map(t => (
          <Pressable
            key={t}
            onPress={() => setReType(t)}
            style={{
              flex: 1, paddingVertical: SPACING.sm, borderRadius: RADIUS.sm,
              borderWidth: 1.5,
              borderColor: reType === t ? COLORS.brand : COLORS.border,
              backgroundColor: reType === t ? COLORS.brand + '10' : COLORS.bg,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: reType === t ? COLORS.brand : COLORS.muted }}>
              {t === 'refund' ? '↩ Refund' : '🔄 Exchange'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Order lookup */}
      <View>
        <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginBottom: 4 }}>Order Code *</Text>
        <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
          <TextInput
            value={orderCode}
            onChangeText={t => { setOrderCode(t); reset(); setStep('lookup'); }}
            placeholder="e.g. ORD-20260001"
            placeholderTextColor={COLORS.muted}
            autoCapitalize="characters"
            style={[inputStyle, { flex: 1 }]}
          />
          <Pressable
            onPress={handleLookup}
            style={{
              backgroundColor: COLORS.brand, borderRadius: RADIUS.sm,
              paddingHorizontal: SPACING.md, alignItems: 'center', justifyContent: 'center',
            }}
          >
            {finding
              ? <Text style={{ color: '#fff', fontSize: FONT_SIZES.sm }}>…</Text>
              : <Ionicons name="search" size={18} color="#fff" />
            }
          </Pressable>
        </View>
        {findError && (
          <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.danger, marginTop: 4 }}>
            {(findError as any)?.message ?? 'Order not found.'}
          </Text>
        )}
      </View>

      {/* Order found — item selection */}
      {orderInfo && step === 'select' && (
        <>
          <View style={{ backgroundColor: COLORS.surfaceAlt, borderRadius: RADIUS.sm, padding: SPACING.sm }}>
            <Text style={{ fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.text }}>
              {orderInfo.order_code} · {orderInfo.customer_name}
            </Text>
          </View>

          <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted }}>Select items to return:</Text>
          {orderInfo.line_items.map(li => {
            const isSelected = !!selected[li.id];
            return (
              <Pressable
                key={li.id}
                onPress={() => toggleItem(li.id, li.quantity)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
                  padding: SPACING.sm, borderRadius: RADIUS.sm,
                  borderWidth: 1, borderColor: isSelected ? COLORS.brand : COLORS.border,
                  backgroundColor: isSelected ? COLORS.brand + '08' : COLORS.bg,
                }}
              >
                <Ionicons
                  name={isSelected ? 'checkbox' : 'square-outline'}
                  size={20} color={isSelected ? COLORS.brand : COLORS.muted}
                />
                <Text style={{ flex: 1, fontSize: FONT_SIZES.sm, color: COLORS.text }}>
                  {li.product_emoji} {li.product_name}
                </Text>
                <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted }}>
                  Qty: {li.quantity}
                </Text>
              </Pressable>
            );
          })}
        </>
      )}

      {/* Reason */}
      <View>
        <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginBottom: 4 }}>Reason *</Text>
        <TextInput
          value={reason}
          onChangeText={setReason}
          placeholder="e.g. Customer received damaged goods"
          placeholderTextColor={COLORS.muted}
          multiline
          numberOfLines={2}
          style={[inputStyle, { minHeight: 60, textAlignVertical: 'top' }]}
        />
      </View>

      <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
        <View style={{ flex: 1 }}>
          <Button label="Cancel" onPress={onClose} variant="secondary" fullWidth size="md" />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            label="Submit"
            onPress={handleSubmit}
            loading={creating}
            disabled={!orderInfo || !reason.trim() || Object.keys(selected).length === 0}
            fullWidth size="md"
          />
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function RefundsScreen() {
  const [showForm, setShowForm] = useState(false);
  const { data: items = [], isLoading } = useRefundExchanges();

  return (
    <>
      <Stack.Screen options={{ title: 'Refunds & Exchanges', headerShown: true }} />
      <Screen padded={false}>
        {isLoading ? (
          <LoadingSpinner fullScreen />
        ) : (
          <FlatList
            data={items}
            keyExtractor={i => String(i.id)}
            contentContainerStyle={{
              paddingHorizontal: SPACING.base, paddingVertical: SPACING.base,
              paddingBottom: SPACING['2xl'],
            }}
            ListHeaderComponent={
              <View style={{ marginBottom: SPACING.sm }}>
                {showForm ? (
                  <CreateREFlow onClose={() => setShowForm(false)} />
                ) : (
                  <Button label="+ New Refund / Exchange" onPress={() => setShowForm(true)} fullWidth />
                )}
              </View>
            }
            ListEmptyComponent={
              !showForm ? (
                <EmptyState
                  emoji="↩"
                  title="No refunds or exchanges"
                  description="Create one by tapping the button above. Only delivered orders are eligible."
                />
              ) : null
            }
            renderItem={({ item }) => <RERow item={item} />}
          />
        )}
      </Screen>
    </>
  );
}
