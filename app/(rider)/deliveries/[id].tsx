import React, { useState, useMemo }                                from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams, router }                     from 'expo-router';
import { Ionicons }                                               from '@expo/vector-icons';

import { Screen }            from '@/components/ui/Screen';
import { Button }            from '@/components/ui/Button';
import { useAuthContext }    from '@/context/AuthContext';
import {
  useDeliveryOrder,
  useStartDelivery,
  useConfirmPickup,
  useConfirmDeliveryItems,
} from '@/hooks/useRiderDeliveries';
import { formatCurrency }    from '@/lib/utils';
import { ApiError }          from '@/types';
import {
  COLORS, FONT_SIZES, RADIUS, SHADOW, SPACING, STATUS_COLOR, STATUS_LABEL,
} from '@/lib/theme';

// ---------------------------------------------------------------------------
// Layout helpers
// ---------------------------------------------------------------------------

function SectionLabel({ text }: { text: string }) {
  return (
    <Text style={{
      fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.muted,
      textTransform: 'uppercase', letterSpacing: 0.6,
      marginTop: SPACING.lg, marginBottom: SPACING.sm,
    }}>
      {text}
    </Text>
  );
}

function InfoCard({ children }: { children: React.ReactNode }) {
  return (
    <View style={{
      backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
      borderWidth: 1, borderColor: COLORS.border,
      padding: SPACING.md, ...SHADOW.sm,
    }}>
      {children}
    </View>
  );
}

function InfoRow({ label, value, color, bold }: {
  label: string; value: string; color?: string; bold?: boolean;
}) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
      <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.muted }}>{label}</Text>
      <Text style={{
        fontSize: FONT_SIZES.sm, fontWeight: bold ? '700' : '500',
        color: color ?? COLORS.text, maxWidth: '60%', textAlign: 'right',
      }}>
        {value}
      </Text>
    </View>
  );
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.xs }} />;
}

// ---------------------------------------------------------------------------
// Item quantity row used in both pickup and delivery confirmation
// ---------------------------------------------------------------------------

interface ConfirmItemState {
  lineItemId:  number;
  productName: string;
  productEmoji: string;
  orderedQty:  number;
  referenceQty: number; // ordered for pickup; picked_up for delivery
  confirmedQty: number;
  reason:      string;
}

function QtyConfirmRow({
  item,
  onChange,
}: {
  item:     ConfirmItemState;
  onChange: (id: number, qty: number, reason: string) => void;
}) {
  const mismatch = item.confirmedQty < item.referenceQty;
  return (
    <View style={{ paddingVertical: SPACING.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <Text style={{ fontSize: 16 }}>{item.productEmoji}</Text>
        <Text style={{ flex: 1, fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.text }}>
          {item.productName}
        </Text>
        <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted }}>
          of {item.referenceQty}
        </Text>
      </View>

      {/* Qty stepper */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Pressable
            onPress={() => onChange(item.lineItemId, Math.max(0, item.confirmedQty - 1), item.reason)}
            style={({ pressed }) => ({
              width: 32, height: 32, borderRadius: 16,
              backgroundColor: COLORS.surfaceAlt,
              alignItems: 'center', justifyContent: 'center',
              opacity: pressed || item.confirmedQty <= 0 ? 0.5 : 1,
            })}
          >
            <Ionicons name="remove" size={16} color={COLORS.text} />
          </Pressable>
          <Text style={{
            fontSize: FONT_SIZES.base, fontWeight: '700', color: mismatch ? COLORS.danger : COLORS.text,
            minWidth: 28, textAlign: 'center',
          }}>
            {item.confirmedQty}
          </Text>
          <Pressable
            onPress={() => onChange(item.lineItemId, Math.min(item.referenceQty, item.confirmedQty + 1), item.reason)}
            style={({ pressed }) => ({
              width: 32, height: 32, borderRadius: 16,
              backgroundColor: COLORS.surfaceAlt,
              alignItems: 'center', justifyContent: 'center',
              opacity: pressed || item.confirmedQty >= item.referenceQty ? 0.5 : 1,
            })}
          >
            <Ionicons name="add" size={16} color={COLORS.text} />
          </Pressable>
        </View>
        {mismatch && (
          <Text style={{ flex: 1, fontSize: FONT_SIZES.xs, color: COLORS.danger, fontWeight: '600' }}>
            -{item.referenceQty - item.confirmedQty} short
          </Text>
        )}
      </View>

      {/* Reason input when there's a shortfall */}
      {mismatch && (
        <TextInput
          value={item.reason}
          onChangeText={r => onChange(item.lineItemId, item.confirmedQty, r)}
          placeholder="Reason for shortfall (required)"
          placeholderTextColor={COLORS.muted}
          style={{
            marginTop: SPACING.xs,
            borderWidth: 1, borderColor: item.reason.trim() ? COLORS.border : COLORS.danger,
            borderRadius: RADIUS.sm, padding: SPACING.sm,
            fontSize: FONT_SIZES.xs, color: COLORS.text, backgroundColor: COLORS.bg,
          }}
        />
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function DeliveryDetailScreen() {
  const { id }   = useLocalSearchParams<{ id: string }>();
  const orderId  = Number(id);
  const { user } = useAuthContext();

  const [cashInput,  setCashInput]  = useState('');
  const [cashError,  setCashError]  = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: order, isLoading, error } = useDeliveryOrder(orderId);
  const { mutateAsync: doStartDelivery }  = useStartDelivery();
  const { mutateAsync: doConfirmPickup }  = useConfirmPickup();
  const { mutateAsync: doConfirmItems }   = useConfirmDeliveryItems();

  // Pickup confirmation state (one row per fulfilled item)
  const [pickupItems, setPickupItems] = useState<ConfirmItemState[] | null>(null);

  // Delivery confirmation state
  const [deliveryItems, setDeliveryItems] = useState<ConfirmItemState[] | null>(null);

  // Must be before early returns to satisfy rules of hooks
  const expectedCash = useMemo(() => {
    if (!deliveryItems || !order) return 0;
    const fulfilled = order.line_items.filter(i => i.fulfilled);
    return deliveryItems.reduce((s, di) => {
      const li = fulfilled.find(i => i.id === di.lineItemId);
      if (!li) return s;
      return s + li.agent_price_snapshot * di.confirmedQty;
    }, 0) + order.delivery_fee_snapshot;
  }, [deliveryItems, order]);

  if (isLoading) {
    return <Screen><ActivityIndicator style={{ flex: 1 }} color={COLORS.info} /></Screen>;
  }
  if (error || !order) {
    return <Screen padded><Text style={{ color: COLORS.danger }}>Order not found.</Text></Screen>;
  }

  const isCOD            = order.payment_method === 'cod';
  const isAssigned       = order.status === 'assigned';
  const isOutForDelivery = order.status === 'out_for_delivery';
  const isDelivered      = order.status === 'delivered';
  const statusColor      = STATUS_COLOR[order.status] ?? COLORS.muted;
  const fulfilledItems   = order.line_items.filter(i => i.fulfilled);

  // ── Pickup flow ────────────────────────────────────────────────────────

  function initPickupItems() {
    setPickupItems(fulfilledItems.map(li => ({
      lineItemId:   li.id,
      productName:  li.product_name,
      productEmoji: li.product_emoji,
      orderedQty:   li.quantity,
      referenceQty: li.quantity,
      confirmedQty: li.quantity, // default = full order
      reason:       '',
    })));
  }

  function updatePickupItem(id: number, qty: number, reason: string) {
    setPickupItems(prev => prev?.map(i => i.lineItemId === id ? { ...i, confirmedQty: qty, reason } : i) ?? null);
  }

  async function handleConfirmPickup() {
    if (!user || !pickupItems) return;

    // Validate: mismatched items need a reason
    const missingReason = pickupItems.find(i => i.confirmedQty < i.referenceQty && !i.reason.trim());
    if (missingReason) {
      Alert.alert('Reason required', `Please provide a reason for the shortfall on "${missingReason.productName}".`);
      return;
    }

    setSubmitting(true);
    try {
      await doConfirmPickup({
        orderId,
        actorId: user.id,
        items: pickupItems.map(i => ({
          line_item_id:      i.lineItemId,
          quantity_picked_up: i.confirmedQty,
          reason: i.confirmedQty < i.referenceQty ? i.reason : undefined,
        })),
      });
      setPickupItems(null);
    } catch (err) {
      Alert.alert('Error', err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Delivery flow ──────────────────────────────────────────────────────

  function initDeliveryItems() {
    setDeliveryItems(fulfilledItems.map(li => {
      const refQty = li.quantity_picked_up ?? li.quantity;
      return {
        lineItemId:   li.id,
        productName:  li.product_name,
        productEmoji: li.product_emoji,
        orderedQty:   li.quantity,
        referenceQty: refQty,
        confirmedQty: refQty,
        reason:       '',
      };
    }));
  }

  function updateDeliveryItem(id: number, qty: number, reason: string) {
    setDeliveryItems(prev => prev?.map(i => i.lineItemId === id ? { ...i, confirmedQty: qty, reason } : i) ?? null);
  }

  async function handleConfirmDelivery() {
    if (!user || !deliveryItems) return;

    const missingReason = deliveryItems.find(i => i.confirmedQty < i.referenceQty && !i.reason.trim());
    if (missingReason) {
      Alert.alert('Reason required', `Please provide a reason for the shortfall on "${missingReason.productName}".`);
      return;
    }

    let amountCollected: number | undefined;
    if (isCOD) {
      const parsed = parseFloat(cashInput.trim());
      if (!cashInput.trim() || isNaN(parsed) || parsed < 0) {
        setCashError('Enter the cash amount collected from the customer.');
        return;
      }
      setCashError('');
      amountCollected = Math.round(parsed);
    }

    const confirmMsg = isCOD
      ? `Confirm delivery and log Rs ${amountCollected} cash collected?`
      : `Confirm delivery of ${order?.order_code ?? orderId}?`;

    if (Platform.OS === 'web') {
      if (!window.confirm(confirmMsg)) return;
    } else {
      const ok = await new Promise<boolean>(resolve =>
        Alert.alert('Confirm Delivery', confirmMsg, [
          { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
          { text: 'Confirm', onPress: () => resolve(true) },
        ])
      );
      if (!ok) return;
    }

    setSubmitting(true);
    try {
      await doConfirmItems({
        orderId,
        riderId:  user.id,
        actorId:  user.id,
        amountCollected,
        items: deliveryItems.map(i => ({
          line_item_id:       i.lineItemId,
          quantity_delivered: i.confirmedQty,
          reason: i.confirmedQty < i.referenceQty ? i.reason : undefined,
        })),
      });
      setDeliveryItems(null);
      router.back();
    } catch (err) {
      Alert.alert('Error', err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <>
      <Stack.Screen options={{
        title: order.order_code, headerShown: true,
        headerRight: () => (
          <Pressable onPress={() => router.back()} hitSlop={8} style={{ marginRight: 4 }}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </Pressable>
        ),
      }} />

      <Screen scrollable padded>
        {/* Order header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: FONT_SIZES['2xl'], fontWeight: '800', color: COLORS.text, letterSpacing: 1 }}>
              {order.order_code}
            </Text>
            <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginTop: 2 }}>
              {new Date(order.created_at).toLocaleDateString('en-PK', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </Text>
          </View>
          <View style={{
            backgroundColor: statusColor + '20', borderRadius: RADIUS.md,
            paddingHorizontal: 12, paddingVertical: 6,
          }}>
            <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: statusColor }}>
              {STATUS_LABEL[order.status] ?? order.status}
            </Text>
          </View>
        </View>

        {/* ── Customer & address ── */}
        <SectionLabel text="Delivery Address" />
        <InfoCard>
          <InfoRow label="Customer" value={order.customer.name} />
          {order.address && (
            <>
              <InfoRow label="Address" value={order.address.address_text} />
              {order.address.distance_km != null && (
                <InfoRow label="Distance" value={`${order.address.distance_km.toFixed(1)} km`} />
              )}
            </>
          )}
          <InfoRow label="Payment" value={isCOD ? 'Cash on Delivery' : 'Prepaid'} />
        </InfoCard>

        {/* ── Items ── */}
        <SectionLabel text={`Items (${fulfilledItems.length})`} />
        <InfoCard>
          {fulfilledItems.map((item, i) => (
            <View key={item.id}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 }}>
                <Text style={{ fontSize: 14 }}>{item.product_emoji}</Text>
                <Text style={{ flex: 1, fontSize: FONT_SIZES.sm, color: COLORS.text }}>
                  {item.product_name} ×{item.quantity}
                  {item.quantity_picked_up != null && item.quantity_picked_up < item.quantity ? (
                    <Text style={{ color: COLORS.danger }}> (picked up: {item.quantity_picked_up})</Text>
                  ) : null}
                </Text>
                <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.text }}>
                  {formatCurrency(item.agent_price_snapshot * (item.quantity_picked_up ?? item.quantity))}
                </Text>
              </View>
              {i < fulfilledItems.length - 1 && <Divider />}
            </View>
          ))}
        </InfoCard>

        {/* ── Totals ── */}
        <SectionLabel text="Totals" />
        <InfoCard>
          <InfoRow label="Subtotal"     value={formatCurrency(order.subtotal)} />
          <InfoRow label="Delivery Fee" value={formatCurrency(order.delivery_fee_snapshot)} />
          <Divider />
          <InfoRow
            label={isCOD ? 'Collect from Customer' : 'Total (Prepaid)'}
            value={formatCurrency(order.total)}
            bold
            color={isCOD ? COLORS.warning : COLORS.teal}
          />
          <InfoRow
            label="Your Payout"
            value={formatCurrency(order.rider_payout_snapshot ?? 0)}
            color={COLORS.teal}
          />
        </InfoCard>

        {/* ── Action: Pickup Confirmation (assigned, no pickup yet) ── */}
        {isAssigned && !order.pickup_confirmed_at && (
          <>
            <SectionLabel text="Step 1 — Confirm Pickup" />
            {!pickupItems ? (
              <>
                <Button
                  label="Confirm Pickup Quantities"
                  onPress={initPickupItems}
                  fullWidth size="lg"
                />
                <Text style={{
                  fontSize: FONT_SIZES.xs, color: COLORS.muted,
                  textAlign: 'center', marginTop: SPACING.xs,
                }}>
                  Verify the items you're picking up before heading out.
                </Text>
              </>
            ) : (
              <>
                <InfoCard>
                  {pickupItems.map((item, i) => (
                    <View key={item.lineItemId}>
                      <QtyConfirmRow item={item} onChange={updatePickupItem} />
                      {i < pickupItems.length - 1 && <Divider />}
                    </View>
                  ))}
                </InfoCard>
                {isCOD && (
                  <View style={{
                    marginTop: SPACING.sm, backgroundColor: COLORS.warning + '15',
                    borderRadius: RADIUS.md, padding: SPACING.sm,
                    flexDirection: 'row', alignItems: 'center', gap: 6,
                  }}>
                    <Ionicons name="cash-outline" size={16} color={COLORS.warning} />
                    <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.warning, flex: 1 }}>
                      Expected collection based on picked-up qty:{' '}
                      <Text style={{ fontWeight: '700' }}>
                        {formatCurrency(
                          pickupItems.reduce((s, pi) => {
                            const li = fulfilledItems.find(i => i.id === pi.lineItemId);
                            return s + (li?.agent_price_snapshot ?? 0) * pi.confirmedQty;
                          }, 0) + order.delivery_fee_snapshot
                        )}
                      </Text>
                    </Text>
                  </View>
                )}
                <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md }}>
                  <View style={{ flex: 1 }}>
                    <Button
                      label="Cancel"
                      variant="secondary"
                      onPress={() => setPickupItems(null)}
                      fullWidth
                    />
                  </View>
                  <View style={{ flex: 2 }}>
                    <Button
                      label="Confirm & Go"
                      onPress={handleConfirmPickup}
                      loading={submitting}
                      fullWidth size="lg"
                    />
                  </View>
                </View>
              </>
            )}
          </>
        )}

        {/* Pickup confirmed — rider can now start delivery */}
        {isAssigned && order.pickup_confirmed_at && (
          <>
            <SectionLabel text="Step 2 — Start Delivery" />
            <View style={{
              backgroundColor: COLORS.teal + '15',
              borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.teal + '40',
              padding: SPACING.sm, flexDirection: 'row', alignItems: 'center', gap: 8,
              marginBottom: SPACING.sm,
            }}>
              <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.teal} />
              <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.teal }}>
                Pickup confirmed — items ready to deliver.
              </Text>
            </View>
            <Button
              label="Start Delivery (Out for Delivery)"
              onPress={async () => {
                if (!user) return;
                setSubmitting(true);
                try {
                  await doStartDelivery({ orderId, actorId: user.id });
                } catch (err) {
                  Alert.alert('Error', err instanceof ApiError ? err.message : 'Something went wrong.');
                } finally {
                  setSubmitting(false);
                }
              }}
              loading={submitting}
              fullWidth size="lg"
            />
          </>
        )}

        {/* ── Action: Delivery Confirmation (out_for_delivery) ── */}
        {isOutForDelivery && (
          <>
            <SectionLabel text="Confirm Delivery" />
            {!deliveryItems ? (
              <>
                <Button
                  label="Confirm Delivered Quantities"
                  onPress={initDeliveryItems}
                  fullWidth size="lg"
                />
                <Text style={{
                  fontSize: FONT_SIZES.xs, color: COLORS.muted,
                  textAlign: 'center', marginTop: SPACING.xs,
                }}>
                  Verify what was actually delivered before collecting cash.
                </Text>
              </>
            ) : (
              <>
                <InfoCard>
                  {deliveryItems.map((item, i) => (
                    <View key={item.lineItemId}>
                      <QtyConfirmRow item={item} onChange={updateDeliveryItem} />
                      {i < deliveryItems.length - 1 && <Divider />}
                    </View>
                  ))}
                </InfoCard>

                {isCOD && (
                  <View style={{ marginTop: SPACING.md }}>
                    <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginBottom: 4 }}>
                      Cash collected (Rs) — expected: {formatCurrency(expectedCash)}
                    </Text>
                    <TextInput
                      value={cashInput}
                      onChangeText={t => { setCashInput(t); setCashError(''); }}
                      placeholder={`Expected: ${formatCurrency(expectedCash)}`}
                      placeholderTextColor={COLORS.muted}
                      keyboardType="numeric"
                      style={{
                        borderWidth: 1,
                        borderColor: cashError ? COLORS.danger : COLORS.border,
                        borderRadius: RADIUS.sm,
                        padding: SPACING.sm,
                        fontSize: FONT_SIZES.sm,
                        color: COLORS.text,
                        backgroundColor: COLORS.bg,
                      }}
                    />
                    {cashError ? (
                      <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.danger, marginTop: 2 }}>
                        {cashError}
                      </Text>
                    ) : null}
                    {!!(cashInput && Number(cashInput) !== expectedCash) && (
                      <View style={{
                        flexDirection: 'row', alignItems: 'center', gap: 4,
                        marginTop: SPACING.xs, backgroundColor: COLORS.warning + '18',
                        borderRadius: RADIUS.sm, padding: SPACING.xs,
                      }}>
                        <Ionicons name="warning-outline" size={14} color={COLORS.warning} />
                        <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.warning, flex: 1 }}>
                          Amount differs from expected {formatCurrency(expectedCash)} — mismatch will be recorded.
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md }}>
                  <View style={{ flex: 1 }}>
                    <Button
                      label="Cancel"
                      variant="secondary"
                      onPress={() => setDeliveryItems(null)}
                      fullWidth
                    />
                  </View>
                  <View style={{ flex: 2 }}>
                    <Button
                      label="Mark Delivered"
                      onPress={handleConfirmDelivery}
                      loading={submitting}
                      fullWidth size="lg"
                    />
                  </View>
                </View>
              </>
            )}
          </>
        )}

        {/* ── Delivered summary ── */}
        {isDelivered && (
          <>
            <SectionLabel text="Delivery Complete" />
            <View style={{
              backgroundColor: COLORS.teal + '18',
              borderRadius:    RADIUS.md,
              borderWidth:     1,
              borderColor:     COLORS.teal + '40',
              padding:         SPACING.md,
              flexDirection:   'row',
              alignItems:      'center',
              gap:             SPACING.sm,
            }}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.teal} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.teal }}>
                  Delivered
                </Text>
                {order.delivered_at && (
                  <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginTop: 2 }}>
                    {new Date(order.delivered_at).toLocaleString('en-PK', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </Text>
                )}
              </View>
            </View>
          </>
        )}

        <View style={{ height: SPACING['2xl'] }} />
      </Screen>
    </>
  );
}
