import { useState }                                              from 'react';
import { ActivityIndicator, Alert, Platform, Text, TextInput, View } from 'react-native';
import { Stack, router, useLocalSearchParams }                    from 'expo-router';
import { Ionicons }                                              from '@expo/vector-icons';

import { Screen }              from '@/components/ui/Screen';
import { Button }              from '@/components/ui/Button';
import { useAuthContext }      from '@/context/AuthContext';
import { useReceiptOrder, useVerifyReceipt, useRejectReceipt } from '@/hooks/useReceiptVerification';
import { formatCurrency }      from '@/lib/utils';
import { ApiError }            from '@/types';
import {
  COLORS, FONT_SIZES, RADIUS, SHADOW, SPACING, STATUS_LABEL,
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

function InfoRow({ label, value, color, bold }: { label: string; value: string; color?: string; bold?: boolean }) {
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

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function OwnerReceiptDetailScreen() {
  const { orderId }  = useLocalSearchParams<{ orderId: string }>();
  const id           = Number(orderId);
  const { user }     = useAuthContext();

  const [showRejectForm, setShowRejectForm] = useState(false);
  const [comment,        setComment]        = useState('');
  const [commentError,   setCommentError]   = useState('');

  const { data: order, isLoading, error } = useReceiptOrder(id);
  const { mutateAsync: verify,  isPending: verifying }  = useVerifyReceipt();
  const { mutateAsync: reject,  isPending: rejecting }  = useRejectReceipt();

  const busy = verifying || rejecting;

  async function handleVerify() {
    if (!user || !order) return;
    const msg = `Mark the receipt for ${order.order_code} as verified? This cannot be undone.`;
    if (Platform.OS === 'web') {
      if (!window.confirm(msg)) return;
    } else {
      const ok = await new Promise<boolean>(resolve =>
        Alert.alert('Verify Receipt', msg, [
          { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
          { text: 'Verify',  onPress: () => resolve(true) },
        ])
      );
      if (!ok) return;
    }
    try {
      await verify({ orderId: order.id, actorId: user.id });
      router.back();
    } catch (err) {
      Alert.alert('Error', err instanceof ApiError ? err.message : 'Something went wrong.');
    }
  }

  async function handleReject() {
    if (!user || !order) return;
    if (!comment.trim()) {
      setCommentError('Please enter a rejection reason before submitting.');
      return;
    }
    setCommentError('');
    try {
      await reject({ orderId: order.id, actorId: user.id, comment: comment.trim() });
      Alert.alert(
        'Receipt Rejected',
        `The agent will be notified to re-upload a receipt for ${order.order_code}.`,
      );
      router.back();
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

  const receipt        = order.payment_receipt;
  const isPending      = order.payment_status === 'receipt_pending';
  const fulfilledItems = order.line_items.filter(i => i.fulfilled);

  return (
    <>
      <Stack.Screen options={{ title: `Receipt · ${order.order_code}`, headerShown: true }} />

      <Screen scrollable padded>
        {/* ── Receipt file card ── */}
        <SectionLabel text="Receipt" />
        <View style={{
          backgroundColor: COLORS.surface,
          borderRadius:    RADIUS.md,
          borderWidth:     1,
          borderColor:     COLORS.warning,
          padding:         SPACING.lg,
          alignItems:      'center',
          gap:             SPACING.sm,
          ...SHADOW.sm,
        }}>
          <View style={{
            width:           72, height: 72,
            borderRadius:    RADIUS.md,
            backgroundColor: COLORS.warningLight,
            alignItems:      'center',
            justifyContent:  'center',
          }}>
            <Ionicons name="document-text-outline" size={36} color={COLORS.warning} />
          </View>
          <Text style={{
            fontSize:   FONT_SIZES.sm,
            fontWeight: '600',
            color:      COLORS.text,
            textAlign:  'center',
          }}>
            {receipt?.file_name ?? 'No file name'}
          </Text>
          {receipt?.uploaded_at && (
            <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted }}>
              Uploaded {new Date(receipt.uploaded_at).toLocaleString('en-PK', {
                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
              })}
            </Text>
          )}
          <View style={{
            backgroundColor:   COLORS.warningLight,
            borderRadius:      RADIUS.sm,
            paddingHorizontal: SPACING.sm,
            paddingVertical:   3,
          }}>
            <Text style={{ fontSize: FONT_SIZES.xs, fontWeight: '600', color: COLORS.warning }}>
              Awaiting Verification
            </Text>
          </View>
        </View>

        {/* ── Order summary ── */}
        <SectionLabel text="Order" />
        <InfoCard>
          <InfoRow label="Order Code" value={order.order_code} />
          <InfoRow label="Status"     value={STATUS_LABEL[order.status] ?? order.status} />
          <InfoRow label="Agent"      value={order.agent.name} />
          <InfoRow label="Customer"   value={order.customer.name} />
          <InfoRow label="Items"      value={String(fulfilledItems.length)} />
          <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.xs }} />
          <InfoRow label="Total (Prepaid)" value={formatCurrency(order.total)} bold />
        </InfoCard>

        {/* ── Action buttons (only when still pending) ── */}
        {isPending && !showRejectForm && (
          <>
            <SectionLabel text="Verification Action" />
            <View style={{ gap: SPACING.sm }}>
              <Button
                label="Verify Receipt ✓"
                onPress={handleVerify}
                loading={verifying}
                disabled={busy}
                fullWidth
                size="lg"
              />
              <Button
                label="Reject Receipt"
                onPress={() => setShowRejectForm(true)}
                disabled={busy}
                fullWidth
                size="lg"
                variant="danger"
              />
            </View>
          </>
        )}

        {/* ── Reject form ── */}
        {isPending && showRejectForm && (
          <>
            <SectionLabel text="Rejection Reason" />
            <View style={{
              backgroundColor: COLORS.surface,
              borderRadius:    RADIUS.md,
              borderWidth:     1,
              borderColor:     commentError ? COLORS.danger : COLORS.border,
              padding:         SPACING.md,
              gap:             SPACING.sm,
              ...SHADOW.sm,
            }}>
              <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.text }}>
                Describe what's wrong with the receipt. The agent will see this comment.
              </Text>
              <TextInput
                value={comment}
                onChangeText={t => { setComment(t); setCommentError(''); }}
                placeholder="e.g. Receipt is blurry; amount not clearly visible"
                placeholderTextColor={COLORS.muted}
                multiline
                numberOfLines={4}
                style={{
                  borderWidth:     1,
                  borderColor:     commentError ? COLORS.danger : COLORS.border,
                  borderRadius:    RADIUS.sm,
                  padding:         SPACING.sm,
                  fontSize:        FONT_SIZES.sm,
                  color:           COLORS.text,
                  backgroundColor: COLORS.bg,
                  minHeight:       96,
                  textAlignVertical: 'top',
                }}
              />
              {!!commentError && (
                <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.danger }}>
                  {commentError}
                </Text>
              )}
              <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                <View style={{ flex: 1 }}>
                  <Button
                    label="Cancel"
                    onPress={() => { setShowRejectForm(false); setComment(''); setCommentError(''); }}
                    disabled={busy}
                    fullWidth
                    size="md"
                    variant="secondary"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    label="Submit Rejection"
                    onPress={handleReject}
                    loading={rejecting}
                    disabled={busy}
                    fullWidth
                    size="md"
                    variant="danger"
                  />
                </View>
              </View>
            </View>
          </>
        )}

        {/* ── Already actioned ── */}
        {!isPending && (
          <View style={{
            flexDirection:   'row',
            alignItems:      'center',
            gap:             SPACING.sm,
            backgroundColor: COLORS.surfaceAlt,
            borderRadius:    RADIUS.md,
            padding:         SPACING.md,
            marginTop:       SPACING.lg,
          }}>
            <Ionicons name="information-circle-outline" size={18} color={COLORS.muted} />
            <Text style={{ flex: 1, fontSize: FONT_SIZES.sm, color: COLORS.muted }}>
              This receipt has already been{' '}
              {order.payment_status === 'receipt_verified' ? 'verified' : 'rejected'}.
            </Text>
          </View>
        )}

        <View style={{ height: SPACING['2xl'] }} />
      </Screen>
    </>
  );
}
