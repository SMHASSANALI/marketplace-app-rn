import { useState }                                            from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams, router }                 from 'expo-router';
import { Ionicons }                                           from '@expo/vector-icons';

import { Screen }            from '@/components/ui/Screen';
import { Button }            from '@/components/ui/Button';
import { StatusTimeline }   from '@/components/order/StatusTimeline';
import { useAuthContext }    from '@/context/AuthContext';
import { useOwnerOrder, useConfirmOrder } from '@/hooks/useOwnerOrders';
import { useRiders, useAssignRider }      from '@/hooks/useRiders';
import { useCancelOrder }                 from '@/hooks/useCancelOrder';
import { formatCurrency }    from '@/lib/utils';
import { ApiError, User }    from '@/types';
import {
  COLORS, FONT_SIZES, RADIUS, SHADOW, SPACING, STATUS_COLOR, STATUS_LABEL,
} from '@/lib/theme';

// ---------------------------------------------------------------------------
// Layout helpers
// ---------------------------------------------------------------------------

function SectionLabel({ text }: { text: string }) {
  return (
    <Text style={{
      fontSize:      FONT_SIZES.xs,
      fontWeight:    '700',
      color:         COLORS.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginTop:     SPACING.lg,
      marginBottom:  SPACING.sm,
    }}>
      {text}
    </Text>
  );
}

function InfoCard({ children }: { children: React.ReactNode }) {
  return (
    <View style={{
      backgroundColor: COLORS.surface,
      borderRadius:    RADIUS.md,
      borderWidth:     1,
      borderColor:     COLORS.border,
      padding:         SPACING.md,
      ...SHADOW.sm,
    }}>
      {children}
    </View>
  );
}

function InfoRow({
  label, value, color, bold,
}: {
  label: string; value: string; color?: string; bold?: boolean;
}) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
      <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.muted }}>{label}</Text>
      <Text style={{
        fontSize:   FONT_SIZES.sm,
        fontWeight: bold ? '700' : '500',
        color:      color ?? COLORS.text,
        maxWidth:   '60%', textAlign: 'right',
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

export default function OwnerOrderDetailScreen() {
  const { id }   = useLocalSearchParams<{ id: string }>();
  const orderId  = Number(id);
  const { user } = useAuthContext();

  const [confirming,    setConfirming]    = useState(false);
  const [selectedRider, setSelectedRider] = useState<number | null>(null);
  const [assigning,     setAssigning]     = useState(false);
  const [showCancel,    setShowCancel]    = useState(false);
  const [cancelReason,  setCancelReason]  = useState('');
  const [cancelling,    setCancelling]    = useState(false);

  const { data: order,  isLoading, error } = useOwnerOrder(orderId);
  const { data: riders = [] }              = useRiders();
  const { mutateAsync: doConfirm }         = useConfirmOrder();
  const { mutateAsync: doAssign }          = useAssignRider();
  const { mutateAsync: doCancel }          = useCancelOrder();

  async function handleConfirm() {
    if (!order || !user) return;
    const msg = `Confirm ${order.order_code}? Stock has already been reserved. This will move the order to Confirmed.`;
    if (Platform.OS === 'web') {
      if (!window.confirm(msg)) return;
      setConfirming(true);
      try {
        await doConfirm({ orderId: order.id, actorId: user.id });
        router.back();
      } catch (err) {
        Alert.alert('Error', err instanceof ApiError ? err.message : 'Something went wrong.');
      } finally {
        setConfirming(false);
      }
    } else {
      Alert.alert(
        'Confirm Order',
        msg,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm Order',
            onPress: async () => {
              setConfirming(true);
              try {
                await doConfirm({ orderId: order.id, actorId: user.id });
                Alert.alert('Done', `${order.order_code} has been confirmed.`);
                router.back();
              } catch (err) {
                Alert.alert('Error', err instanceof ApiError ? err.message : 'Something went wrong.');
              } finally {
                setConfirming(false);
              }
            },
          },
        ],
      );
    }
  }

  // ── Loading / error ──────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <Screen>
        <ActivityIndicator style={{ flex: 1 }} color={COLORS.brand} />
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

  const isPrepaid      = order.payment_method === 'prepaid';
  const isPending      = order.status === 'pending';
  const isConfirmed    = order.status === 'confirmed';
  const isCancellable  = ['pending', 'confirmed', 'assigned'].includes(order.status);
  const statusColor    = STATUS_COLOR[order.status] ?? COLORS.muted;

  async function handleCancel() {
    if (!cancelReason.trim() || !user || !order) return;
    const msg = `Cancel ${order.order_code}? Stock will be restored. This cannot be undone.`;
    if (Platform.OS === 'web') {
      if (!window.confirm(msg)) return;
    }
    setCancelling(true);
    try {
      await doCancel({ orderId: order.id, reason: cancelReason, actorId: user.id });
      router.back();
    } catch (err) {
      Alert.alert('Error', err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setCancelling(false);
    }
  }
  const fulfilledItems = order.line_items.filter(i => i.fulfilled);
  const excludedItems  = order.line_items.filter(i => !i.fulfilled);

  async function handleAssign() {
    if (!selectedRider || !user || !order) return;
    setAssigning(true);
    try {
      await doAssign({ orderId: order.id, riderId: selectedRider, actorId: user.id });
      const riderName = riders.find(r => r.id === selectedRider)?.name ?? 'Rider';
      Alert.alert('Rider Assigned', `${riderName} has been assigned to ${order.order_code}.`);
      setSelectedRider(null);
      router.back();
    } catch (err) {
      Alert.alert('Error', err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setAssigning(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: order.order_code, headerShown: true }} />

      <Screen scrollable padded>
        {/* ── Order header ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md }}>
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize:      FONT_SIZES['2xl'],
              fontWeight:    '800',
              color:         COLORS.text,
              letterSpacing: 1,
            }}>
              {order.order_code}
            </Text>
            <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginTop: 2 }}>
              {new Date(order.created_at).toLocaleString('en-PK', {
                day: 'numeric', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </Text>
          </View>
          <View style={{
            backgroundColor:   statusColor + '20',
            borderRadius:      RADIUS.md,
            paddingHorizontal: 12,
            paddingVertical:   6,
          }}>
            <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: statusColor }}>
              {STATUS_LABEL[order.status] ?? order.status}
            </Text>
          </View>
        </View>

        {/* ── Confirm button (pending only) ── */}
        {isPending && order.payment_status === 'receipt_rejected' && (
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
            backgroundColor: COLORS.danger + '10', borderRadius: RADIUS.md,
            borderWidth: 1, borderColor: COLORS.danger + '40',
            padding: SPACING.md, marginBottom: SPACING.sm,
          }}>
            <Ionicons name="warning" size={16} color={COLORS.danger} />
            <Text style={{ flex: 1, fontSize: FONT_SIZES.sm, color: COLORS.danger }}>
              Receipt rejected — agent must re-upload before this order can be confirmed.
            </Text>
          </View>
        )}
        {isPending && order.payment_status !== 'receipt_rejected' && (
          <Button
            label="Confirm Order"
            onPress={handleConfirm}
            loading={confirming}
            fullWidth
            size="lg"
          />
        )}

        {/* ── Agent ── */}
        <SectionLabel text="Agent" />
        <InfoCard>
          <InfoRow label="Name"  value={order.agent.name} />
          <InfoRow label="Phone" value={order.agent.phone} />
        </InfoCard>

        {/* ── Customer ── */}
        <SectionLabel text="Customer" />
        <InfoCard>
          <Pressable
            onPress={() => router.push({
              pathname: '/(owner)/orders/customer/[id]',
              params:   { id: String(order.customer.id) },
            } as any)}
            style={({ pressed }) => ({
              flexDirection:  'row',
              alignItems:     'center',
              justifyContent: 'space-between',
              paddingVertical: 4,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.muted }}>Name</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.brand }}>
                {order.customer.name}
              </Text>
              <Ionicons name="chevron-forward" size={12} color={COLORS.brand} />
            </View>
          </Pressable>
          <InfoRow label="Address" value={order.address?.address_text ?? 'No address'} />
          {order.address?.distance_km != null && (
            <InfoRow label="Distance" value={`${order.address.distance_km.toFixed(1)} km`} />
          )}
          <InfoRow label="Payment"  value={isPrepaid ? 'Prepaid' : 'Cash on Delivery'} />
        </InfoCard>

        {/* ── Commission breakdown ── */}
        <SectionLabel text={`Commission Breakdown (${fulfilledItems.length} items)`} />
        <InfoCard>
          {fulfilledItems.map((item, i) => (
            <View key={item.id}>
              <View style={{ paddingVertical: SPACING.xs }}>
                {/* Product name */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Text style={{ fontSize: 14 }}>{item.product_emoji}</Text>
                  <Text style={{ flex: 1, fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.text }}>
                    {item.product_name} ×{item.quantity}
                  </Text>
                  <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.text }}>
                    {formatCurrency(item.agent_price_snapshot * item.quantity)}
                  </Text>
                </View>
                {/* Price breakdown */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingLeft: 20 }}>
                  <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted }}>
                    Cost: {formatCurrency(item.buying_price_snapshot)} ea
                  </Text>
                  <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted }}>
                    Floor: {formatCurrency(item.selling_price_snapshot)} ea
                  </Text>
                  <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.teal, fontWeight: '600' }}>
                    Comm: +{formatCurrency(item.commission_amount)}
                  </Text>
                </View>
                {/* Quantity mismatch flags */}
                {(item.pickup_mismatch_flag || item.delivery_mismatch_flag) && (
                  <View style={{ paddingLeft: 20, marginTop: 2, gap: 2 }}>
                    {item.pickup_mismatch_flag && item.quantity_picked_up != null && (
                      <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.warning }}>
                        ⚠ Picked up {item.quantity_picked_up} of {item.quantity}
                        {item.exclusion_reason ? ` — ${item.exclusion_reason}` : ''}
                      </Text>
                    )}
                    {item.delivery_mismatch_flag && item.quantity_delivered != null && (
                      <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.danger }}>
                        ⚠ Delivered {item.quantity_delivered} of {item.quantity_picked_up ?? item.quantity}
                      </Text>
                    )}
                  </View>
                )}
              </View>
              {i < fulfilledItems.length - 1 && (
                <View style={{ height: 1, backgroundColor: COLORS.border }} />
              )}
            </View>
          ))}
        </InfoCard>

        {/* ── Excluded items (partial fulfillment) ── */}
        {excludedItems.length > 0 && (
          <>
            <SectionLabel text={`Excluded Items (${excludedItems.length})`} />
            <InfoCard>
              {excludedItems.map((item, i) => (
                <View key={item.id}>
                  <View style={{
                    flexDirection: 'row', alignItems: 'center',
                    gap: 6, paddingVertical: SPACING.xs,
                  }}>
                    <Text style={{ fontSize: 14, opacity: 0.5 }}>{item.product_emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.muted }}>
                        {item.product_name} ×{item.quantity}
                      </Text>
                      {item.exclusion_reason && (
                        <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.danger, marginTop: 2 }}>
                          {item.exclusion_reason}
                        </Text>
                      )}
                    </View>
                  </View>
                  {i < excludedItems.length - 1 && (
                    <View style={{ height: 1, backgroundColor: COLORS.border }} />
                  )}
                </View>
              ))}
            </InfoCard>
          </>
        )}

        {/* ── Totals ── */}
        <SectionLabel text="Totals" />
        <InfoCard>
          <InfoRow label="Subtotal"          value={formatCurrency(order.subtotal)} />
          <InfoRow label="Delivery Fee"      value={formatCurrency(order.delivery_fee_snapshot)} />
          <Divider />
          <InfoRow
            label={isPrepaid ? 'Total (Prepaid)' : 'Total (COD)'}
            value={formatCurrency(order.total)}
            bold
          />
          <InfoRow
            label="Agent Commission"
            value={`+${formatCurrency(order.commission_total)}`}
            color={COLORS.muted}
          />
        </InfoCard>

        {/* ── Prepaid receipt ── */}
        {isPrepaid && order.payment_receipt && (
          <>
            <SectionLabel text="Receipt" />
            <InfoCard>
              <InfoRow label="File"    value={order.payment_receipt.file_name ?? 'Unknown'} />
              <InfoRow
                label="Status"
                value={
                  order.payment_receipt.verification_status === 'verified' ? 'Verified ✓' :
                  order.payment_receipt.verification_status === 'pending'  ? 'Pending review' :
                  'Rejected'
                }
                color={
                  order.payment_receipt.verification_status === 'verified' ? COLORS.teal :
                  order.payment_receipt.verification_status === 'pending'  ? COLORS.warning :
                  COLORS.danger
                }
              />
              {order.payment_receipt.rejection_comment && (
                <View style={{ marginTop: SPACING.xs }}>
                  <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted }}>Rejection comment:</Text>
                  <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.danger, marginTop: 2 }}>
                    "{order.payment_receipt.rejection_comment}"
                  </Text>
                </View>
              )}
            </InfoCard>
          </>
        )}

        {/* ── Rider (already assigned) ── */}
        {order.rider && (
          <>
            <SectionLabel text="Rider" />
            <InfoCard>
              <InfoRow label="Name"   value={order.rider.name} />
              <InfoRow label="Payout" value={formatCurrency(order.rider_payout_snapshot ?? 0)} />
            </InfoCard>
          </>
        )}

        {/* ── Rider assignment (confirmed orders without a rider) ── */}
        {isConfirmed && !order.rider && (
          <>
            <SectionLabel text="Assign Rider" />
            {riders.length === 0 ? (
              <View style={{
                backgroundColor: COLORS.surfaceAlt,
                borderRadius:    RADIUS.md,
                padding:         SPACING.md,
              }}>
                <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.muted, textAlign: 'center' }}>
                  No active riders. Add riders in Settings → Riders.
                </Text>
              </View>
            ) : (
              <View style={{ gap: SPACING.sm }}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: SPACING.xs, paddingBottom: SPACING.xs }}
                >
                  {riders.map((r: User) => {
                    const sel = selectedRider === r.id;
                    return (
                      <Pressable
                        key={r.id}
                        onPress={() => setSelectedRider(sel ? null : r.id)}
                        style={{
                          flexDirection:     'row',
                          alignItems:        'center',
                          gap:               6,
                          paddingHorizontal: SPACING.sm,
                          paddingVertical:   SPACING.xs,
                          borderRadius:      RADIUS.full,
                          borderWidth:       1.5,
                          borderColor:       sel ? COLORS.brand : COLORS.border,
                          backgroundColor:   sel ? COLORS.brandLight : COLORS.surface,
                        }}
                      >
                        {sel && <Ionicons name="checkmark-circle" size={14} color={COLORS.brand} />}
                        <Text style={{
                          fontSize:   FONT_SIZES.sm,
                          fontWeight: '600',
                          color:      sel ? COLORS.brand : COLORS.text,
                        }}>
                          {r.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {selectedRider && (
                  <Button
                    label={`Assign ${riders.find((r: User) => r.id === selectedRider)?.name ?? 'Rider'}`}
                    onPress={handleAssign}
                    loading={assigning}
                    fullWidth
                    size="lg"
                  />
                )}
                {!selectedRider && (
                  <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, textAlign: 'center' }}>
                    Select a rider above to assign them to this order.
                  </Text>
                )}
              </View>
            )}
          </>
        )}

        {/* ── Cancel order ── */}
        {isCancellable && (
          <>
            <SectionLabel text="Cancel Order" />
            {!showCancel ? (
              <Button
                label="Cancel Order"
                variant="danger"
                onPress={() => setShowCancel(true)}
                fullWidth
              />
            ) : (
              <View style={{
                backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
                borderWidth: 1, borderColor: COLORS.danger + '60',
                padding: SPACING.md, gap: SPACING.sm,
              }}>
                <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.danger }}>
                  Cancellation reason (required)
                </Text>
                <TextInput
                  value={cancelReason}
                  onChangeText={setCancelReason}
                  placeholder="e.g. Customer changed their mind"
                  placeholderTextColor={COLORS.muted}
                  multiline
                  numberOfLines={3}
                  style={{
                    fontSize: FONT_SIZES.sm, color: COLORS.text,
                    backgroundColor: COLORS.bg, borderRadius: RADIUS.sm,
                    borderWidth: 1, borderColor: COLORS.border,
                    padding: SPACING.sm, minHeight: 72, textAlignVertical: 'top',
                  }}
                />
                <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                  <View style={{ flex: 1 }}>
                    <Button
                      label="Keep Order"
                      variant="secondary"
                      onPress={() => { setShowCancel(false); setCancelReason(''); }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button
                      label="Cancel Order"
                      variant="danger"
                      onPress={handleCancel}
                      loading={cancelling}
                      disabled={!cancelReason.trim()}
                    />
                  </View>
                </View>
              </View>
            )}
          </>
        )}

        {/* ── Status history ── */}
        <SectionLabel text="Order History" />
        <StatusTimeline orderId={orderId} />

        <View style={{ height: SPACING['2xl'] }} />
      </Screen>
    </>
  );
}
