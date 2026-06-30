/**
 * Owner — Refund / Exchange detail screen.
 *
 * Actions:
 *  - pending  → Approve | Reject (with reason)
 *  - approved → Mark Completed | Reject
 *  - completed / rejected → read-only
 */

import { useState }                      from 'react';
import { Alert, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons }                      from '@expo/vector-icons';

import { Screen }         from '@/components/ui/Screen';
import { Button }         from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState }     from '@/components/ui/EmptyState';
import { useAuthContext } from '@/context/AuthContext';
import {
  useRefundExchangeDetail,
  useApproveRefundExchange,
  useCompleteRefundExchange,
  useRejectRefundExchange,
} from '@/hooks/useRefundExchange';
import {
  COLORS, FONT_SIZES, RADIUS, SHADOW, SPACING,
} from '@/lib/theme';

// ---------------------------------------------------------------------------
// Helpers
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
// Screen
// ---------------------------------------------------------------------------

export default function RefundDetailScreen() {
  const { user }                       = useAuthContext();
  const { id }                         = useLocalSearchParams<{ id: string }>();
  const reId                           = parseInt(id ?? '0', 10);
  const { data: re, isLoading, error } = useRefundExchangeDetail(reId);

  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const { mutateAsync: approve,  isPending: approving  } = useApproveRefundExchange();
  const { mutateAsync: complete, isPending: completing } = useCompleteRefundExchange();
  const { mutateAsync: reject,   isPending: rejecting  } = useRejectRefundExchange();

  // All hooks must precede early returns

  if (isLoading) return <LoadingSpinner fullScreen />;

  if (error || !re) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Refund / Exchange', headerShown: true, headerLeft: () => (
          <Pressable onPress={() => router.back()} hitSlop={8} style={{ marginLeft: -8 }}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </Pressable>
        ) }} />
        <EmptyState emoji="❓" title="Not found" description="This request could not be loaded." />
      </Screen>
    );
  }

  const statusColor = STATUS_COLOR[re.status] ?? COLORS.muted;
  const canApprove  = re.status === 'pending';
  const canComplete = re.status === 'approved';
  const canReject   = re.status === 'pending' || re.status === 'approved';

  async function handleApprove() {
    try {
      await approve({ id: re!.id, actorId: user!.id });
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Something went wrong.');
    }
  }

  async function handleComplete() {
    try {
      await complete({ id: re!.id, actorId: user!.id });
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Something went wrong.');
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) {
      Alert.alert('Reason required', 'Enter a rejection reason.');
      return;
    }
    try {
      await reject({ id: re!.id, actorId: user!.id, reason: rejectReason.trim() });
      setShowReject(false);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Something went wrong.');
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: `${re.type === 'refund' ? '↩ Refund' : '🔄 Exchange'} #${re.id}`,
          headerShown: true,
          headerRight: () => (
            <Pressable onPress={() => router.back()} hitSlop={8} style={{ marginRight: 4 }}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </Pressable>
          ),
        }}
      />
      <Screen scrollable padded>
        {/* Status banner */}
        <View style={{
          backgroundColor: statusColor + '18',
          borderRadius: RADIUS.md, borderWidth: 1, borderColor: statusColor + '40',
          padding: SPACING.md, marginBottom: SPACING.base,
          flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
        }}>
          <View style={{
            width: 10, height: 10, borderRadius: 5, backgroundColor: statusColor,
          }} />
          <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: statusColor }}>
            {STATUS_LABEL[re.status]}
          </Text>
          <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginLeft: 'auto' }}>
            {new Date(re.created_at).toLocaleDateString()}
          </Text>
        </View>

        {/* Summary card */}
        <View style={{
          backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
          borderWidth: 1, borderColor: COLORS.border,
          padding: SPACING.md, marginBottom: SPACING.base, gap: SPACING.xs, ...SHADOW.sm,
        }}>
          <Row label="Order" value={re.order_code} />
          <Row label="Customer" value={re.customer_name} />
          <Row label="Type" value={re.type === 'refund' ? '↩ Refund' : '🔄 Exchange'} />
          {re.type === 'refund' && (
            <Row label="Refund Amount" value={`Rs ${re.refund_amount.toLocaleString()}`} valueColor={COLORS.teal} />
          )}
          <Row label="Reason" value={re.reason} />
          {re.processed_by_name && (
            <Row label="Processed by" value={re.processed_by_name} />
          )}
          {re.rejection_reason && (
            <Row label="Rejection Reason" value={re.rejection_reason} valueColor={COLORS.danger} />
          )}
        </View>

        {/* Line items */}
        <Text style={{
          fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.muted,
          textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SPACING.sm,
        }}>
          Items
        </Text>
        {re.line_items.map(li => (
          <View key={li.id} style={{
            backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
            borderWidth: 1, borderColor: COLORS.border,
            padding: SPACING.md, marginBottom: SPACING.sm, ...SHADOW.sm,
          }}>
            <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.text }}>
              {li.product_emoji} {li.product_name}
            </Text>
            <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginTop: 4 }}>
              Return qty: {li.return_quantity} · Rs {li.unit_price.toLocaleString()} ea
            </Text>
            {li.exchange_product_name && (
              <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.info, marginTop: 2 }}>
                Exchange for: {li.exchange_product_name} × {li.exchange_quantity}
              </Text>
            )}
          </View>
        ))}

        {/* Actions */}
        {canApprove && (
          <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md }}>
            <View style={{ flex: 1 }}>
              <Button label="Approve" onPress={handleApprove} loading={approving} fullWidth />
            </View>
            <View style={{ flex: 1 }}>
              <Button label="Reject" variant="danger" onPress={() => setShowReject(true)} fullWidth />
            </View>
          </View>
        )}

        {canComplete && !canApprove && (
          <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md }}>
            <View style={{ flex: 1 }}>
              <Button label="Mark Completed" onPress={handleComplete} loading={completing} fullWidth />
            </View>
            <View style={{ flex: 1 }}>
              <Button label="Reject" variant="danger" onPress={() => setShowReject(true)} fullWidth />
            </View>
          </View>
        )}

        {/* Reject modal */}
        {showReject && (
          <View style={{
            backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
            borderWidth: 1.5, borderColor: COLORS.danger,
            padding: SPACING.md, marginTop: SPACING.md, gap: SPACING.sm, ...SHADOW.sm,
          }}>
            <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.danger }}>
              Reject Request
            </Text>
            <TextInput
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="Enter rejection reason…"
              placeholderTextColor={COLORS.muted}
              multiline
              numberOfLines={3}
              style={{
                borderWidth: 1, borderRadius: RADIUS.sm, padding: SPACING.sm,
                fontSize: FONT_SIZES.sm, color: COLORS.text, backgroundColor: COLORS.bg,
                borderColor: COLORS.border, minHeight: 70, textAlignVertical: 'top',
              }}
            />
            <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
              <View style={{ flex: 1 }}>
                <Button label="Cancel" variant="secondary" onPress={() => { setShowReject(false); setRejectReason(''); }} fullWidth size="md" />
              </View>
              <View style={{ flex: 1 }}>
                <Button label="Confirm Reject" variant="danger" onPress={handleReject} loading={rejecting} fullWidth size="md" />
              </View>
            </View>
          </View>
        )}
      </Screen>
    </>
  );
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
      <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, width: 110 }}>{label}</Text>
      <Text style={{ fontSize: FONT_SIZES.sm, color: valueColor ?? COLORS.text, flex: 1, fontWeight: '500' }}>
        {value}
      </Text>
    </View>
  );
}
