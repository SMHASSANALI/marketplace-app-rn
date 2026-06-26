import { useState }                                                from 'react';
import { ActivityIndicator, Alert, Platform, Text, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams, router }                     from 'expo-router';
import { Ionicons }                                               from '@expo/vector-icons';

import { Screen }            from '@/components/ui/Screen';
import { Button }            from '@/components/ui/Button';
import { useAuthContext }    from '@/context/AuthContext';
import { useDeliveryOrder, useStartDelivery, useMarkDelivered } from '@/hooks/useRiderDeliveries';
import { formatCurrency }    from '@/lib/utils';
import { ApiError }          from '@/types';
import {
  COLORS, FONT_SIZES, RADIUS, SHADOW, SPACING, STATUS_COLOR, STATUS_LABEL,
} from '@/lib/theme';

// ---------------------------------------------------------------------------
// Layout helpers (same pattern as owner order detail)
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
  const { mutateAsync: doStart }          = useStartDelivery();
  const { mutateAsync: doDeliver }        = useMarkDelivered();

  if (isLoading) {
    return (
      <Screen>
        <ActivityIndicator style={{ flex: 1 }} color={COLORS.info} />
      </Screen>
    );
  }
  if (error || !order) {
    return (
      <Screen padded>
        <Text style={{ color: COLORS.danger }}>Order not found.</Text>
      </Screen>
    );
  }

  const isCOD            = order.payment_method === 'cod';
  const isAssigned       = order.status === 'assigned';
  const isOutForDelivery = order.status === 'out_for_delivery';
  const isDelivered      = order.status === 'delivered';
  const statusColor      = STATUS_COLOR[order.status] ?? COLORS.muted;
  const fulfilledItems   = order.line_items.filter(i => i.fulfilled);

  async function handleStartDelivery() {
    if (!user) return;
    setSubmitting(true);
    try {
      await doStart({ orderId, actorId: user.id });
      Alert.alert('Started', 'Order is now out for delivery.');
    } catch (err) {
      Alert.alert('Error', err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMarkDelivered() {
    if (!user) return;
    let amountCollected: number | undefined;

    if (isCOD) {
      const parsed = parseFloat(cashInput.trim());
      if (!cashInput.trim() || isNaN(parsed) || parsed < 0) {
        setCashError('Enter the cash amount collected.');
        return;
      }
      setCashError('');
      amountCollected = Math.round(parsed);
    }

    if (!order) return;
    const confirmMsg = isCOD
      ? `Mark ${order.order_code} as delivered and log cash collected: ${formatCurrency(amountCollected!)}`
      : `Mark ${order.order_code} as delivered?`;

    // Alert.alert is a no-op in react-native-web; use window.confirm on web
    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      if (!window.confirm(confirmMsg)) return;
    } else {
      const confirmed = await new Promise<boolean>(resolve =>
        Alert.alert('Confirm Delivery', confirmMsg, [
          { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
          { text: 'Confirm', onPress: () => resolve(true) },
        ])
      );
      if (!confirmed) return;
    }

    setSubmitting(true);
    try {
      await doDeliver({ orderId, riderId: user.id, actorId: user.id, amountCollected });
      router.back();
    } catch (err) {
      Alert.alert('Error', err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: order.order_code, headerShown: true }} />

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
                </Text>
                <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.text }}>
                  {formatCurrency(item.selling_price_snapshot * item.quantity)}
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

        {/* ── Action: Start Delivery (assigned) ── */}
        {isAssigned && (
          <>
            <SectionLabel text="Action" />
            <Button
              label="Start Delivery"
              onPress={handleStartDelivery}
              loading={submitting}
              fullWidth
              size="lg"
            />
            <Text style={{
              fontSize: FONT_SIZES.xs, color: COLORS.muted,
              textAlign: 'center', marginTop: SPACING.xs,
            }}>
              Tap when you have picked up the package.
            </Text>
          </>
        )}

        {/* ── Action: Mark Delivered (out_for_delivery) ── */}
        {isOutForDelivery && (
          <>
            <SectionLabel text="Mark Delivered" />

            {isCOD && (
              <View style={{ marginBottom: SPACING.sm }}>
                <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginBottom: 4 }}>
                  Cash collected (Rs)
                </Text>
                <TextInput
                  value={cashInput}
                  onChangeText={t => { setCashInput(t); setCashError(''); }}
                  placeholder={`Expected: ${formatCurrency(order.total)}`}
                  placeholderTextColor={COLORS.muted}
                  keyboardType="numeric"
                  style={{
                    borderWidth:     1,
                    borderColor:     cashError ? COLORS.danger : COLORS.border,
                    borderRadius:    RADIUS.sm,
                    padding:         SPACING.sm,
                    fontSize:        FONT_SIZES.sm,
                    color:           COLORS.text,
                    backgroundColor: COLORS.bg,
                  }}
                />
                {cashError ? (
                  <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.danger, marginTop: 2 }}>
                    {cashError}
                  </Text>
                ) : null}
                {!!(cashInput && Number(cashInput) !== order.total) && (
                  <View style={{
                    flexDirection: 'row', alignItems: 'center', gap: 4,
                    marginTop: SPACING.xs,
                    backgroundColor: COLORS.warning + '18',
                    borderRadius: RADIUS.sm, padding: SPACING.xs,
                  }}>
                    <Ionicons name="warning-outline" size={14} color={COLORS.warning} />
                    <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.warning, flex: 1 }}>
                      Amount differs from expected {formatCurrency(order.total)} — a mismatch flag will be recorded.
                    </Text>
                  </View>
                )}
              </View>
            )}

            <Button
              label="Mark Delivered"
              onPress={handleMarkDelivered}
              loading={submitting}
              fullWidth
              size="lg"
            />
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
