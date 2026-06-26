import { useState }                                            from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams, router }                from 'expo-router';
import { Ionicons }                                          from '@expo/vector-icons';

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
// Helpers
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
      borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, ...SHADOW.sm,
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

function PermissionLocked({ message }: { message: string }) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
      backgroundColor: COLORS.surfaceAlt, borderRadius: RADIUS.md,
      borderWidth: 1, borderColor: COLORS.border,
      padding: SPACING.md,
    }}>
      <Ionicons name="lock-closed-outline" size={16} color={COLORS.muted} />
      <Text style={{ flex: 1, fontSize: FONT_SIZES.sm, color: COLORS.muted }}>{message}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ManagerOrderDetailScreen() {
  const { id }   = useLocalSearchParams<{ id: string }>();
  const orderId  = Number(id);
  const { user, hasPermission } = useAuthContext();

  const [selectedRider, setSelectedRider] = useState<number | null>(null);
  const [confirming,    setConfirming]    = useState(false);
  const [assigning,     setAssigning]     = useState(false);
  const [showCancel,    setShowCancel]    = useState(false);
  const [cancelReason,  setCancelReason]  = useState('');
  const [cancelling,    setCancelling]    = useState(false);

  const { data: order,  isLoading, error } = useOwnerOrder(orderId);
  const { data: riders = [] }              = useRiders();
  const { mutateAsync: doConfirm }         = useConfirmOrder();
  const { mutateAsync: doAssign }          = useAssignRider();
  const { mutateAsync: doCancel }          = useCancelOrder();

  const canConfirm     = hasPermission('confirm_orders');
  const canAssignRider = hasPermission('assign_riders');

  async function handleConfirm() {
    if (!order || !user) return;
    const msg = `Confirm ${order.order_code}? This will move the order to Confirmed.`;
    if (Platform.OS === 'web') {
      if (!window.confirm(msg)) return;
    } else {
      const ok = await new Promise<boolean>(resolve =>
        Alert.alert('Confirm Order', msg, [
          { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
          { text: 'Confirm', onPress: () => resolve(true) },
        ])
      );
      if (!ok) return;
    }
    setConfirming(true);
    try {
      await doConfirm({ orderId: order.id, actorId: user.id });
      router.back();
    } catch (err) {
      Alert.alert('Error', err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setConfirming(false);
    }
  }

  async function handleAssign() {
    if (!selectedRider || !user || !order) return;
    setAssigning(true);
    try {
      await doAssign({ orderId: order.id, riderId: selectedRider, actorId: user.id });
      setSelectedRider(null);
      router.back();
    } catch (err) {
      Alert.alert('Error', err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setAssigning(false);
    }
  }

  if (isLoading) return <Screen><ActivityIndicator style={{ flex: 1 }} color={COLORS.teal} /></Screen>;
  if (error || !order) return <Screen padded><Text style={{ color: COLORS.danger }}>Order not found.</Text></Screen>;

  const isPending      = order.status === 'pending';
  const isConfirmed    = order.status === 'confirmed';
  const isCancellable  = ['pending', 'confirmed', 'assigned'].includes(order.status);
  const isPrepaid      = order.payment_method === 'prepaid';
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

  return (
    <>
      <Stack.Screen options={{ title: order.order_code, headerShown: true }} />
      <Screen scrollable padded>

        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: FONT_SIZES['2xl'], fontWeight: '800', color: COLORS.text, letterSpacing: 1 }}>
              {order.order_code}
            </Text>
            <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginTop: 2 }}>
              {new Date(order.created_at).toLocaleString('en-PK', {
                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
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

        {/* Confirm action */}
        {isPending && (
          <>
            <SectionLabel text="Action" />
            {order.payment_status === 'receipt_rejected' ? (
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
                backgroundColor: COLORS.danger + '10', borderRadius: RADIUS.md,
                borderWidth: 1, borderColor: COLORS.danger + '40', padding: SPACING.md,
              }}>
                <Ionicons name="warning" size={16} color={COLORS.danger} />
                <Text style={{ flex: 1, fontSize: FONT_SIZES.sm, color: COLORS.danger }}>
                  Receipt rejected — agent must re-upload before this order can be confirmed.
                </Text>
              </View>
            ) : canConfirm
              ? <Button label="Confirm Order" onPress={handleConfirm} loading={confirming} fullWidth size="lg" />
              : <PermissionLocked message="You do not have permission to confirm orders. Contact the owner." />
            }
          </>
        )}

        {/* Agent */}
        <SectionLabel text="Agent" />
        <InfoCard>
          <InfoRow label="Name"  value={order.agent.name} />
          <InfoRow label="Phone" value={order.agent.phone} />
        </InfoCard>

        {/* Customer */}
        <SectionLabel text="Customer" />
        <InfoCard>
          <InfoRow label="Name"    value={order.customer.name} />
          <InfoRow label="Address" value={order.address?.address_text ?? 'No address'} />
          <InfoRow label="Payment" value={order.payment_method === 'prepaid' ? 'Prepaid' : 'Cash on Delivery'} />
        </InfoCard>

        {/* Items */}
        <SectionLabel text={`Items (${fulfilledItems.length})`} />
        <InfoCard>
          {fulfilledItems.map((item, i) => (
            <View key={item.id}>
              <View style={{ paddingVertical: SPACING.xs }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Text style={{ fontSize: 14 }}>{item.product_emoji}</Text>
                  <Text style={{ flex: 1, fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.text }}>
                    {item.product_name} ×{item.quantity}
                  </Text>
                  <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.text }}>
                    {formatCurrency(item.selling_price_snapshot * item.quantity)}
                  </Text>
                </View>
              </View>
              {i < fulfilledItems.length - 1 && <Divider />}
            </View>
          ))}
        </InfoCard>

        {/* Totals */}
        <SectionLabel text="Totals" />
        <InfoCard>
          <InfoRow label="Subtotal"     value={formatCurrency(order.subtotal)} />
          <InfoRow label="Delivery Fee" value={formatCurrency(order.delivery_fee_snapshot)} />
          <Divider />
          <InfoRow label="Total" value={formatCurrency(order.total)} bold />
        </InfoCard>

        {/* Prepaid receipt */}
        {isPrepaid && order.payment_receipt && (
          <>
            <SectionLabel text="Payment Receipt" />
            <InfoCard>
              <InfoRow label="File"   value={order.payment_receipt.file_name ?? 'Uploaded'} />
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
        {isPrepaid && !order.payment_receipt && (
          <>
            <SectionLabel text="Payment Receipt" />
            <View style={{
              backgroundColor: COLORS.surfaceAlt, borderRadius: RADIUS.md,
              borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md,
            }}>
              <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.muted, textAlign: 'center' }}>
                No receipt uploaded yet.
              </Text>
            </View>
          </>
        )}

        {/* Rider (already assigned) */}
        {order.rider && (
          <>
            <SectionLabel text="Rider" />
            <InfoCard>
              <InfoRow label="Name"   value={order.rider.name} />
              <InfoRow label="Payout" value={formatCurrency(order.rider_payout_snapshot ?? 0)} />
            </InfoCard>
          </>
        )}

        {/* Rider assignment */}
        {isConfirmed && !order.rider && (
          <>
            <SectionLabel text="Assign Rider" />
            {!canAssignRider
              ? <PermissionLocked message="You do not have permission to assign riders. Contact the owner." />
              : riders.length === 0
                ? (
                  <View style={{
                    backgroundColor: COLORS.surfaceAlt, borderRadius: RADIUS.md, padding: SPACING.md,
                  }}>
                    <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.muted, textAlign: 'center' }}>
                      No active riders. Ask the owner to add riders in Settings.
                    </Text>
                  </View>
                )
                : (
                  <View style={{ gap: SPACING.sm }}>
                    <ScrollView
                      horizontal showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: SPACING.xs, paddingBottom: SPACING.xs }}
                    >
                      {riders.map((r: User) => {
                        const sel = selectedRider === r.id;
                        return (
                          <Pressable
                            key={r.id}
                            onPress={() => setSelectedRider(sel ? null : r.id)}
                            style={{
                              flexDirection: 'row', alignItems: 'center', gap: 6,
                              paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs,
                              borderRadius: RADIUS.full, borderWidth: 1.5,
                              borderColor: sel ? COLORS.teal : COLORS.border,
                              backgroundColor: sel ? COLORS.teal + '18' : COLORS.surface,
                            }}
                          >
                            {sel && <Ionicons name="checkmark-circle" size={14} color={COLORS.teal} />}
                            <Text style={{
                              fontSize: FONT_SIZES.sm, fontWeight: '600',
                              color: sel ? COLORS.teal : COLORS.text,
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
                        fullWidth size="lg"
                      />
                    )}
                  </View>
                )
            }
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
