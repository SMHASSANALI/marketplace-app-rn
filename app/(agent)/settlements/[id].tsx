/**
 * Agent settlement detail — Agent can see their settlement and confirm payment received.
 */

import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Ionicons }           from '@expo/vector-icons';

import { Screen }                        from '@/components/ui/Screen';
import { Button }                        from '@/components/ui/Button';
import {
  useSettlementDetail,
  useAcknowledgeSettlement,
  useDisputeSettlement,
} from '@/hooks/useSettlement';
import { formatCurrency, formatDate }    from '@/lib/utils';
import { ApiError }                      from '@/types';
import {
  COLORS, FONT_SIZES, RADIUS, SHADOW, SPACING,
} from '@/lib/theme';

const STATUS_COLOR = {
  pending:   COLORS.muted,
  approved:  COLORS.info,
  paid:      COLORS.warning,
  confirmed: COLORS.teal,
};
const STATUS_LABEL = {
  pending:   'Pending Approval',
  approved:  'Approved',
  paid:      'Paid — confirm receipt',
  confirmed: 'Confirmed',
};

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

function Row({ label, value, bold, color }: {
  label: string; value: string; bold?: boolean; color?: string;
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

export default function AgentSettlementDetailScreen() {
  const { id }       = useLocalSearchParams<{ id: string }>();
  const settlementId = Number(id);

  const [disputeText,  setDisputeText]  = useState('');
  const [showDispute,  setShowDispute]  = useState(false);

  const { data: settlement, isLoading, error } = useSettlementDetail(settlementId);
  const { mutateAsync: doAck,     isPending: acking   } = useAcknowledgeSettlement();
  const { mutateAsync: doDispute, isPending: disputing } = useDisputeSettlement();

  if (isLoading) return <Screen><ActivityIndicator style={{ flex: 1 }} color={COLORS.brand} /></Screen>;
  if (error || !settlement) return <Screen padded><Text style={{ color: COLORS.danger }}>Settlement not found.</Text></Screen>;

  const statusColor = STATUS_COLOR[settlement.status] ?? COLORS.muted;
  const isPaid      = settlement.status === 'paid';
  const isConfirmed = settlement.status === 'confirmed';

  async function handleAcknowledge() {
    const msg = `Confirm you received ${formatCurrency(settlement!.total_commission)}?`;
    if (Platform.OS === 'web') {
      if (!window.confirm(msg)) return;
    } else {
      const ok = await new Promise<boolean>(resolve =>
        Alert.alert('Confirm Payment', msg, [
          { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
          { text: 'Confirm', onPress: () => resolve(true) },
        ])
      );
      if (!ok) return;
    }
    try {
      await doAck({ id: settlementId });
      router.back();
    } catch (err) {
      Alert.alert('Error', err instanceof ApiError ? err.message : 'Something went wrong.');
    }
  }

  async function handleDispute() {
    if (!disputeText.trim()) {
      Alert.alert('Comment required', 'Please describe the issue before submitting.');
      return;
    }
    try {
      await doDispute({ id: settlementId, comment: disputeText.trim() });
      setShowDispute(false);
      Alert.alert('Dispute submitted', 'Your comment has been sent to the Owner.');
    } catch (err) {
      Alert.alert('Error', err instanceof ApiError ? err.message : 'Something went wrong.');
    }
  }

  return (
    <>
      <Stack.Screen options={{
        title: `Settlement #${settlementId}`, headerShown: true,
        headerRight: () => (
          <Pressable onPress={() => router.back()} hitSlop={8} style={{ marginRight: 4 }}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </Pressable>
        ),
      }} />
      <Screen scrollable padded>

        {/* Status banner */}
        <View style={{
          backgroundColor: statusColor + '18',
          borderRadius: RADIUS.md, borderWidth: 1, borderColor: statusColor + '40',
          padding: SPACING.md, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
          marginBottom: SPACING.sm,
        }}>
          <Ionicons
            name={isConfirmed ? 'checkmark-circle' : isPaid ? 'cash-outline' : 'time-outline'}
            size={22} color={statusColor}
          />
          <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: statusColor }}>
            {STATUS_LABEL[settlement.status] ?? settlement.status}
          </Text>
        </View>

        {/* Settlement summary */}
        <SectionLabel text="Summary" />
        <InfoCard>
          <Row label="Commission"   value={formatCurrency(settlement.total_commission)} bold color={COLORS.teal} />
          <Row label="Period start" value={formatDate(settlement.period_start)} />
          <Row label="Period end"   value={formatDate(settlement.period_end)} />
          {settlement.paid_at && (
            <Row label="Paid on"   value={formatDate(settlement.paid_at)} />
          )}
          {settlement.payment_reference && (
            <Row label="Reference" value={settlement.payment_reference} />
          )}
        </InfoCard>

        {/* Line items */}
        <SectionLabel text="Orders Included" />
        <InfoCard>
          {settlement.line_items.map((li, i) => (
            <View key={li.id}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 }}>
                <Text style={{ fontSize: 12 }}>{li.product_emoji}</Text>
                <Text style={{ flex: 1, fontSize: FONT_SIZES.xs, color: COLORS.text }}>
                  {li.order_code} — {li.product_name} ×{li.quantity}
                </Text>
                <Text style={{ fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.teal }}>
                  +{formatCurrency(li.commission_amount)}
                </Text>
              </View>
              {i < settlement.line_items.length - 1 && <Divider />}
            </View>
          ))}
        </InfoCard>

        {/* Confirm payment received (paid status only) */}
        {isPaid && !settlement.acknowledged_at && (
          <>
            <SectionLabel text="Confirm Payment" />
            <View style={{
              backgroundColor: COLORS.warning + '10', borderRadius: RADIUS.md,
              borderWidth: 1, borderColor: COLORS.warning + '40', padding: SPACING.md,
              marginBottom: SPACING.sm,
            }}>
              <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.text, marginBottom: 4 }}>
                The Owner has marked this settlement as paid
                {settlement.payment_reference ? ` with reference: "${settlement.payment_reference}"` : ''}.
              </Text>
              <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted }}>
                Tap below to confirm you received {formatCurrency(settlement.total_commission)}.
                If there's an issue, use "Dispute" instead.
              </Text>
            </View>

            {!showDispute ? (
              <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                <View style={{ flex: 1 }}>
                  <Button
                    label="Dispute"
                    variant="secondary"
                    onPress={() => setShowDispute(true)}
                    fullWidth
                  />
                </View>
                <View style={{ flex: 2 }}>
                  <Button
                    label="I received this payment"
                    onPress={handleAcknowledge}
                    loading={acking}
                    fullWidth size="lg"
                  />
                </View>
              </View>
            ) : (
              <>
                <View style={{
                  backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
                  borderWidth: 1, borderColor: COLORS.border, padding: SPACING.sm,
                  marginBottom: SPACING.sm,
                }}>
                  <TextInput
                    value={disputeText}
                    onChangeText={setDisputeText}
                    placeholder="Describe the issue (wrong amount, payment not received, etc.)"
                    placeholderTextColor={COLORS.muted}
                    style={{ fontSize: FONT_SIZES.sm, color: COLORS.text, minHeight: 80 }}
                    multiline
                  />
                </View>
                <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                  <View style={{ flex: 1 }}>
                    <Button
                      label="Cancel"
                      variant="secondary"
                      onPress={() => setShowDispute(false)}
                      fullWidth
                    />
                  </View>
                  <View style={{ flex: 2 }}>
                    <Button
                      label="Submit Dispute"
                      onPress={handleDispute}
                      loading={disputing}
                      fullWidth
                    />
                  </View>
                </View>
              </>
            )}
          </>
        )}

        {/* Confirmed */}
        {isConfirmed && (
          <>
            <SectionLabel text="Payment Confirmed" />
            <View style={{
              backgroundColor: COLORS.teal + '18', borderRadius: RADIUS.md,
              borderWidth: 1, borderColor: COLORS.teal + '40', padding: SPACING.md,
              flexDirection: 'row', alignItems: 'center', gap: 8,
            }}>
              <Ionicons name="checkmark-circle" size={22} color={COLORS.teal} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.teal }}>
                  Payment confirmed
                </Text>
                {settlement.acknowledged_at && (
                  <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginTop: 2 }}>
                    {formatDate(settlement.acknowledged_at)}
                  </Text>
                )}
              </View>
            </View>
            {settlement.dispute_comment && (
              <View style={{ marginTop: SPACING.sm, padding: SPACING.sm, backgroundColor: COLORS.surfaceAlt, borderRadius: RADIUS.sm }}>
                <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, fontStyle: 'italic' }}>
                  "{settlement.dispute_comment}"
                </Text>
              </View>
            )}
          </>
        )}

        {/* Dispute comment visible if submitted but not yet confirmed */}
        {settlement.dispute_comment && !isConfirmed && (
          <>
            <SectionLabel text="Your Dispute Comment" />
            <View style={{
              backgroundColor: COLORS.danger + '10', borderRadius: RADIUS.md,
              borderWidth: 1, borderColor: COLORS.danger + '30', padding: SPACING.md,
            }}>
              <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.danger, fontStyle: 'italic' }}>
                "{settlement.dispute_comment}"
              </Text>
              <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginTop: 4 }}>
                Comment submitted — Owner has been notified.
              </Text>
            </View>
          </>
        )}

        <View style={{ height: SPACING['2xl'] }} />
      </Screen>
    </>
  );
}
