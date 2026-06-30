import { useState }         from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons }             from '@expo/vector-icons';

import { Screen }               from '@/components/ui/Screen';
import { Button }               from '@/components/ui/Button';
import { ReceiptUploader }      from '@/components/order/ReceiptUploader';
import { useAuthContext }       from '@/context/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getOrderById }         from '@/services/orders.service';
import { useReuploadReceipt }   from '@/hooks/useReceiptUpload';
import { formatCurrency }       from '@/lib/utils';
import { ApiError }             from '@/types';
import {
  COLORS, FONT_SIZES, RADIUS, SHADOW, SPACING, STATUS_COLOR, STATUS_LABEL,
} from '@/lib/theme';

// ---------------------------------------------------------------------------
// Helpers
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

function InfoRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
      <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.muted }}>{label}</Text>
      <Text style={{
        fontSize: FONT_SIZES.sm, fontWeight: '500',
        color: color ?? COLORS.text, maxWidth: '60%', textAlign: 'right',
      }}>
        {value}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function AgentOrderDetailModal() {
  const { id }     = useLocalSearchParams<{ id: string }>();
  const orderId    = Number(id);
  const { user }   = useAuthContext();

  const [pendingFileName, setPendingFileName] = useState<string | null>(null);
  const [showUploader,    setShowUploader]    = useState(false);

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', orderId],
    queryFn:  () => getOrderById(orderId),
    enabled:  !!orderId,
  });

  const { mutateAsync: reupload, isPending: reuploading } = useReuploadReceipt();

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

  // ── Loading / error ────────────────────────────────────────────────────────
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

  const isPrepaid    = order.payment_method === 'prepaid';
  const isRejected   = order.payment_status === 'receipt_rejected';
  const statusColor  = STATUS_COLOR[order.status] ?? COLORS.muted;
  const fulfilledItems = order.line_items.filter(i => i.fulfilled);

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
      {/* ── Order code + status ── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: FONT_SIZES['2xl'], fontWeight: '800', color: COLORS.text, letterSpacing: 1 }}>
            {order.order_code}
          </Text>
          <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginTop: 2 }}>
            {new Date(order.created_at).toLocaleString('en-PK', {
              day: 'numeric', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </Text>
        </View>
        <View style={{ backgroundColor: statusColor + '20', borderRadius: RADIUS.md, paddingHorizontal: 12, paddingVertical: 6 }}>
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
      {order.payment_status === 'receipt_pending' && (
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

      {/* ── Customer ── */}
      <SectionLabel text="Customer" />
      <InfoCard>
        <InfoRow label="Name"    value={order.customer.name} />
        <InfoRow label="Address" value={order.address?.address_text ?? 'No address'} />
        {order.address?.distance_km != null && (
          <InfoRow label="Distance" value={`${order.address.distance_km.toFixed(1)} km`} />
        )}
        <InfoRow label="Payment" value={isPrepaid ? 'Prepaid' : 'Cash on Delivery'} />
      </InfoCard>

      {/* ── Items ── */}
      <SectionLabel text={`Items (${fulfilledItems.length})`} />
      <InfoCard>
        {fulfilledItems.map((item, i) => (
          <View key={item.id}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.xs }}>
              <Text style={{ marginRight: 6, fontSize: 16 }}>{item.product_emoji}</Text>
              <Text style={{ flex: 1, fontSize: FONT_SIZES.sm, color: COLORS.text }}>
                {item.product_name} ×{item.quantity}
              </Text>
              <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.text }}>
                {formatCurrency(item.selling_price_snapshot * item.quantity)}
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
        <InfoRow label="Subtotal"        value={formatCurrency(order.subtotal)} />
        <InfoRow label="Delivery Fee"    value={formatCurrency(order.delivery_fee_snapshot)} />
        <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.xs }} />
        <InfoRow
          label={isPrepaid ? 'Total (Prepaid)' : 'Total (COD)'}
          value={formatCurrency(order.total)}
        />
        <InfoRow label="Your Commission" value={`+${formatCurrency(order.commission_total)}`} color={COLORS.teal} />
      </InfoCard>

      {/* ── Receipt info for non-rejected prepaid ── */}
      {isPrepaid && !isRejected && order.payment_receipt && (
        <>
          <SectionLabel text="Receipt" />
          <InfoCard>
            <InfoRow label="File"     value={order.payment_receipt.file_name ?? 'Unknown'} />
            <InfoRow label="Uploaded" value={new Date(order.payment_receipt.uploaded_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })} />
            <InfoRow label="Status"   value={
              order.payment_receipt.verification_status === 'verified' ? 'Verified ✓' :
              order.payment_receipt.verification_status === 'pending'  ? 'Pending review' :
              'Rejected'
            } color={
              order.payment_receipt.verification_status === 'verified' ? COLORS.success :
              order.payment_receipt.verification_status === 'pending'  ? COLORS.warning :
              COLORS.danger
            } />
          </InfoCard>
        </>
      )}

      {/* ── Re-upload section (only when rejected) ── */}
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
                <Text style={{ textAlign: 'center', fontSize: FONT_SIZES.xs, color: COLORS.muted }}>
                  Pick an image to continue
                </Text>
              )}
            </View>
          )}
        </>
      )}

      <View style={{ height: SPACING['2xl'] }} />
    </Screen>
    </>
  );
}
