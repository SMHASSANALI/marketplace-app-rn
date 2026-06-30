import { useState }                                               from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams, router }                   from 'expo-router';
import { Ionicons }                                              from '@expo/vector-icons';
import { useQuery }                                              from '@tanstack/react-query';

import { Screen }              from '@/components/ui/Screen';
import { Button }              from '@/components/ui/Button';
import { ReceiptUploader }     from '@/components/order/ReceiptUploader';
import { StatusTimeline }      from '@/components/order/StatusTimeline';
import { useAuthContext }      from '@/context/AuthContext';
import { getOrderById }        from '@/services/orders.service';
import { useReuploadReceipt }  from '@/hooks/useReceiptUpload';
import { useCancelOrder }      from '@/hooks/useCancelOrder';
import { formatCurrency }      from '@/lib/utils';
import { ApiError }            from '@/types';
import {
  COLORS, FONT_SIZES, RADIUS, SHADOW, SPACING, STATUS_COLOR, STATUS_LABEL,
} from '@/lib/theme';

// ---------------------------------------------------------------------------
// Small layout helpers
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
        fontSize: FONT_SIZES.sm,
        fontWeight: bold ? '700' : '500',
        color: color ?? COLORS.text,
        maxWidth: '60%', textAlign: 'right',
      }}>
        {value}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Commission hold progress bar
// ---------------------------------------------------------------------------

function HoldCountdown({ remaining, holdEndsAt, eligible }: {
  remaining:   number;
  holdEndsAt:  string;
  eligible:    boolean;
}) {
  const HOLD_DAYS  = 7;
  const elapsed    = HOLD_DAYS - remaining;
  const progress   = Math.min(elapsed / HOLD_DAYS, 1);
  const barColor   = eligible ? COLORS.teal : COLORS.warning;

  return (
    <InfoCard>
      {/* Status line */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm }}>
        <Ionicons
          name={eligible ? 'checkmark-circle' : 'time-outline'}
          size={20}
          color={barColor}
        />
        <Text style={{ flex: 1, fontSize: FONT_SIZES.sm, fontWeight: '700', color: barColor }}>
          {eligible
            ? 'Commission eligible for settlement'
            : `${remaining} day${remaining !== 1 ? 's' : ''} remaining in hold`}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={{
        height:          8,
        borderRadius:    RADIUS.pill,
        backgroundColor: COLORS.border,
        overflow:        'hidden',
        marginBottom:    SPACING.sm,
      }}>
        <View style={{
          height:          '100%',
          width:           `${Math.round(progress * 100)}%`,
          borderRadius:    RADIUS.pill,
          backgroundColor: barColor,
        }} />
      </View>

      {/* Label row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted }}>
          {elapsed} / {HOLD_DAYS} days elapsed
        </Text>
        <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted }}>
          {eligible ? 'Hold complete' : `Hold ends ${holdEndsAt}`}
        </Text>
      </View>
    </InfoCard>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function AgentOrderDetailScreen() {
  const { id }   = useLocalSearchParams<{ id: string }>();
  const orderId  = Number(id);
  const { user } = useAuthContext();

  const [pendingFileName, setPendingFileName] = useState<string | null>(null);
  const [showUploader,    setShowUploader]    = useState(false);
  const [showCancel,      setShowCancel]      = useState(false);
  const [cancelReason,    setCancelReason]    = useState('');
  const [cancelling,      setCancelling]      = useState(false);

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', orderId],
    queryFn:  () => getOrderById(orderId),
    enabled:  !!orderId,
  });

  const { mutateAsync: reupload, isPending: reuploading } = useReuploadReceipt();
  const { mutateAsync: doCancel }                         = useCancelOrder();

  async function handleReupload() {
    if (!pendingFileName || !user || !order) return;
    try {
      await reupload({ orderId: order.id, fileName: pendingFileName, agentId: user.id });
      setPendingFileName(null);
      setShowUploader(false);
      Alert.alert('Receipt Submitted', 'Your receipt has been re-submitted for verification.');
    } catch (err) {
      Alert.alert('Error', err instanceof ApiError ? err.message : 'Something went wrong.');
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

  const isPrepaid        = order.payment_method === 'prepaid';
  const isRejected       = order.payment_status === 'receipt_rejected';
  const isPendingReceipt = order.payment_status === 'receipt_pending';
  const isCancellable    = order.status === 'pending';
  const statusColor      = STATUS_COLOR[order.status] ?? COLORS.muted;

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
  const hold           = order.hold_info;

  return (
    <>
      {/* ── Dynamic title in the Stack header ── */}
      <Stack.Screen options={{
        title: order.order_code, headerShown: true,
        headerRight: () => (
          <Pressable onPress={() => router.back()} hitSlop={8} style={{ marginRight: 4 }}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </Pressable>
        ),
      }} />

      <Screen scrollable padded>
        {/* ── Order code + status + date ── */}
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

        {/* ── Receipt rejected banner ── */}
        {isRejected && (
          <View style={{
            backgroundColor: COLORS.dangerLight,
            borderRadius:    RADIUS.md,
            borderWidth:     1,
            borderColor:     COLORS.danger,
            padding:         SPACING.md,
            marginBottom:    SPACING.md,
            gap:             SPACING.sm,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
              <Ionicons name="close-circle" size={20} color={COLORS.danger} />
              <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.danger }}>
                Receipt Rejected
              </Text>
            </View>
            {order.payment_receipt?.rejection_comment && (
              <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.danger, lineHeight: 20 }}>
                "{order.payment_receipt.rejection_comment}"
              </Text>
            )}
          </View>
        )}

        {/* ── Receipt pending banner ── */}
        {isPendingReceipt && (
          <View style={{
            flexDirection:   'row',
            alignItems:      'center',
            gap:             SPACING.sm,
            backgroundColor: COLORS.warningLight,
            borderRadius:    RADIUS.md,
            borderWidth:     1,
            borderColor:     COLORS.warning,
            padding:         SPACING.md,
            marginBottom:    SPACING.md,
          }}>
            <Ionicons name="time-outline" size={18} color={COLORS.warning} />
            <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.warning }}>
              Receipt submitted — awaiting owner verification
            </Text>
          </View>
        )}

        {/* ── Commission hold countdown (delivered orders) ── */}
        {hold && (
          <>
            <SectionLabel text="Commission Hold" />
            <HoldCountdown
              remaining={hold.remaining_days}
              holdEndsAt={hold.hold_ends_at}
              eligible={hold.eligible}
            />
          </>
        )}

        {/* ── Customer ── */}
        <SectionLabel text="Customer" />
        <InfoCard>
          <InfoRow label="Name"    value={order.customer.name} />
          <InfoRow label="Address" value={order.address?.address_text ?? 'No address'} />
          {order.address?.distance_km != null && (
            <InfoRow label="Distance" value={`${order.address.distance_km.toFixed(1)} km`} />
          )}
          <InfoRow label="Delivery"
            value={`Band ${order.delivery_band_id} · ${formatCurrency(order.delivery_fee_snapshot)}`}
          />
          <InfoRow label="Payment"  value={isPrepaid ? 'Prepaid' : 'Cash on Delivery'} />
        </InfoCard>

        {/* ── Items ── */}
        <SectionLabel text={`Items (${fulfilledItems.length})`} />
        <InfoCard>
          {fulfilledItems.map((item, i) => (
            <View key={item.id}>
              <View style={{
                flexDirection: 'row',
                alignItems:    'center',
                paddingVertical: SPACING.xs,
              }}>
                <Text style={{ marginRight: 6, fontSize: 16 }}>{item.product_emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.text }}>
                    {item.product_name} ×{item.quantity}
                  </Text>
                  <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginTop: 1 }}>
                    Commission: +{formatCurrency(item.commission_amount)}
                  </Text>
                </View>
                <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.text }}>
                  {formatCurrency(item.agent_price_snapshot * item.quantity)}
                </Text>
              </View>
              {i < fulfilledItems.length - 1 && (
                <View style={{ height: 1, backgroundColor: COLORS.border }} />
              )}
            </View>
          ))}
        </InfoCard>

        {/* ── Totals ── */}
        <SectionLabel text="Totals" />
        <InfoCard>
          <InfoRow label="Subtotal"     value={formatCurrency(order.subtotal)} />
          <InfoRow label="Delivery Fee" value={formatCurrency(order.delivery_fee_snapshot)} />
          <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.xs }} />
          <InfoRow
            label={isPrepaid ? 'Total (Prepaid)' : 'Total (COD)'}
            value={formatCurrency(order.total)}
            bold
          />
          <InfoRow
            label="Your Commission"
            value={`+${formatCurrency(order.commission_total)}`}
            color={hold && !hold.eligible ? COLORS.warning : COLORS.teal}
          />
          {hold && !hold.eligible && (
            <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginTop: 4 }}>
              Commission is held for {hold.remaining_days} more day{hold.remaining_days !== 1 ? 's' : ''} after delivery.
            </Text>
          )}
        </InfoCard>

        {/* ── Receipt info (non-rejected prepaid with existing receipt) ── */}
        {isPrepaid && !isRejected && order.payment_receipt && (
          <>
            <SectionLabel text="Receipt" />
            <InfoCard>
              <InfoRow label="File"     value={order.payment_receipt.file_name ?? 'Unknown'} />
              <InfoRow
                label="Uploaded"
                value={new Date(order.payment_receipt.uploaded_at).toLocaleDateString('en-PK', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              />
              <InfoRow
                label="Status"
                value={
                  order.payment_receipt.verification_status === 'verified' ? 'Verified ✓' :
                  order.payment_receipt.verification_status === 'pending'  ? 'Pending review'  :
                  'Rejected'
                }
                color={
                  order.payment_receipt.verification_status === 'verified' ? COLORS.teal :
                  order.payment_receipt.verification_status === 'pending'  ? COLORS.warning :
                  COLORS.danger
                }
              />
            </InfoCard>
          </>
        )}

        {/* ── Re-upload section (rejected receipts only) ── */}
        {isRejected && (
          <>
            <SectionLabel text="Re-upload Receipt" />

            {!showUploader ? (
              <Button
                label="Upload New Receipt"
                onPress={() => setShowUploader(true)}
                fullWidth
                size="lg"
              />
            ) : (
              <View style={{ gap: SPACING.sm }}>
                <ReceiptUploader
                  fileName={pendingFileName}
                  onPicked={name => setPendingFileName(name)}
                  uploading={reuploading}
                  disabled={reuploading}
                />
                {pendingFileName && (
                  <Button
                    label="Submit New Receipt"
                    onPress={handleReupload}
                    loading={reuploading}
                    fullWidth
                    size="lg"
                  />
                )}
                {!pendingFileName && (
                  <Text style={{
                    textAlign:  'center',
                    fontSize:   FONT_SIZES.xs,
                    color:      COLORS.muted,
                  }}>
                    Pick an image to continue
                  </Text>
                )}
                <Pressable
                  onPress={() => { setShowUploader(false); setPendingFileName(null); }}
                  style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, alignItems: 'center', paddingVertical: 4 })}
                >
                  <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted }}>Cancel</Text>
                </Pressable>
              </View>
            )}
          </>
        )}

        {/* ── Cancel order (pending only) ── */}
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
