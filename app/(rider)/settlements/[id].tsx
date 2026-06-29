/**
 * Rider settlement detail — Rider can view and confirm payment received.
 */

import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Text, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Ionicons }           from '@expo/vector-icons';

import { Screen }             from '@/components/ui/Screen';
import { Button }             from '@/components/ui/Button';
import {
  useRiderSettlementDetail,
  useAcknowledgeRiderSettlement,
  useDisputeRiderSettlement,
} from '@/hooks/useRiderSettlement';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ApiError }           from '@/types';
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

export default function RiderSettlementDetailScreen() {
  const { id }       = useLocalSearchParams<{ id: string }>();
  const settlementId = Number(id);

  const [disputeText, setDisputeText] = useState('');
  const [showDispute, setShowDispute] = useState(false);

  const { data: settlement, isLoading, error } = useRiderSettlementDetail(settlementId);
  const { mutateAsync: doAck,     isPending: acking   } = useAcknowledgeRiderSettlement();
  const { mutateAsync: doDispute, isPending: disputing } = useDisputeRiderSettlement();

  if (isLoading) return <Screen><ActivityIndicator style={{ flex: 1 }} color={COLORS.brand} /></Screen>;
  if (error || !settlement) return <Screen padded><Text style={{ color: COLORS.danger }}>Settlement not found.</Text></Screen>;

  const statusColor = STATUS_COLOR[settlement.status] ?? COLORS.muted;
  const isPaid      = settlement.status === 'paid';
  const isConfirmed = settlement.status === 'confirmed';

  async function handleAcknowledge() {
    const msg = `Confirm you received ${formatCurrency(settlement!.total_payout)} delivery payout?`;
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
      <Stack.Screen options={{ title: `Payout #${settlementId}`, headerShown: true }} />
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

        {/* Summary */}
        <SectionLabel text="Payout Summary" />
        <InfoCard>
          <Row label="Total Payout" value={formatCurrency(settlement.total_payout)} bold color={COLORS.teal} />
          <Row label="Period start" value={formatDate(settlement.period_start)} />
          <Row label="Period end"   value={formatDate(settlement.period_end)} />
          {settlement.paid_at && (
            <Row label="Paid on"   value={formatDate(settlement.paid_at)} />
          )}
          {settlement.payment_reference && (
            <Row label="Reference" value={settlement.payment_reference} />
          )}
        </InfoCard>

        {/* Deliveries */}
        <SectionLabel text="Deliveries Included" />
        <InfoCard>
          {settlement.line_items.map((li, i) => (
            <View key={li.id}>
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4 }}>
                <Text style={{ flex: 1, fontSize: FONT_SIZES.xs, color: COLORS.text }}>
                  {li.order_code}
                </Text>
                <Text style={{ fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.teal }}>
                  +{formatCurrency(li.payout_amount)}
                </Text>
              </View>
              {i < settlement.line_items.length - 1 && <Divider />}
            </View>
          ))}
        </InfoCard>

        {/* Confirm payment received */}
        {isPaid && !settlement.acknowledged_at && (
          <>
            <SectionLabel text="Confirm Payment" />
            <View style={{
              backgroundColor: COLORS.warning + '10', borderRadius: RADIUS.md,
              borderWidth: 1, borderColor: COLORS.warning + '40', padding: SPACING.md,
              marginBottom: SPACING.sm,
            }}>
              <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.text, marginBottom: 4 }}>
                Owner marked this payout as sent
                {settlement.payment_reference ? ` (ref: "${settlement.payment_reference}")` : ''}.
              </Text>
              <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted }}>
                Confirm you received {formatCurrency(settlement.total_payout)}, or use "Dispute" to flag an issue.
              </Text>
            </View>

            {!showDispute ? (
              <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                <View style={{ flex: 1 }}>
                  <Button label="Dispute" variant="secondary" onPress={() => setShowDispute(true)} fullWidth />
                </View>
                <View style={{ flex: 2 }}>
                  <Button label="I received this payment" onPress={handleAcknowledge} loading={acking} fullWidth size="lg" />
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
                    placeholder="Describe the issue…"
                    placeholderTextColor={COLORS.muted}
                    style={{ fontSize: FONT_SIZES.sm, color: COLORS.text, minHeight: 80 }}
                    multiline
                  />
                </View>
                <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                  <View style={{ flex: 1 }}>
                    <Button label="Cancel" variant="secondary" onPress={() => setShowDispute(false)} fullWidth />
                  </View>
                  <View style={{ flex: 2 }}>
                    <Button label="Submit Dispute" onPress={handleDispute} loading={disputing} fullWidth />
                  </View>
                </View>
              </>
            )}
          </>
        )}

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
          </>
        )}

        <View style={{ height: SPACING['2xl'] }} />
      </Screen>
    </>
  );
}
