import { useState }                                        from 'react';
import { ActivityIndicator, Alert, Image, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams, router }             from 'expo-router';
import * as ImagePicker                                    from 'expo-image-picker';
import { Ionicons }                                        from '@expo/vector-icons';

import { Screen }                from '@/components/ui/Screen';
import { Button }                from '@/components/ui/Button';
import {
  useSettlementDetail, useApproveSettlement, useMarkSettlementPaid,
} from '@/hooks/useSettlement';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ApiError }              from '@/types';
import {
  COLORS, FONT_SIZES, RADIUS, SHADOW, SPACING,
} from '@/lib/theme';

const STATUS_COLOR = { pending: COLORS.warning, approved: COLORS.info, paid: COLORS.teal, confirmed: COLORS.teal };
const STATUS_LABEL = { pending: 'Pending Approval', approved: 'Approved', paid: 'Paid — awaiting confirmation', confirmed: 'Confirmed' };

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

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function SettlementDetailScreen() {
  const { id }       = useLocalSearchParams<{ id: string }>();
  const settlementId = Number(id);

  const [receiptUri,        setReceiptUri]        = useState<string | null>(null);
  const [paymentReference,  setPaymentReference]  = useState('');

  const { data: settlement, isLoading, error } = useSettlementDetail(settlementId);
  const { mutateAsync: doApprove, isPending: approving } = useApproveSettlement();
  const { mutateAsync: doPaid,    isPending: paying    } = useMarkSettlementPaid();

  if (isLoading) return <Screen><ActivityIndicator style={{ flex: 1 }} color={COLORS.brand} /></Screen>;
  if (error || !settlement) return <Screen padded><Text style={{ color: COLORS.danger }}>Settlement not found.</Text></Screen>;

  const statusColor = STATUS_COLOR[settlement.status] ?? COLORS.muted;
  const isPending   = settlement.status === 'pending';
  const isApproved  = settlement.status === 'approved';
  const isPaid      = settlement.status === 'paid';

  async function handleApprove() {
    const msg = `Approve settlement of ${formatCurrency(settlement!.total_commission)} for ${settlement!.agent.name}?`;
    if (Platform.OS === 'web') {
      if (!window.confirm(msg)) return;
    } else {
      const ok = await new Promise<boolean>(resolve =>
        Alert.alert('Approve Settlement', msg, [
          { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
          { text: 'Approve', onPress: () => resolve(true) },
        ])
      );
      if (!ok) return;
    }
    try {
      await doApprove({ id: settlementId });
      router.back();
    } catch (err) {
      Alert.alert('Error', err instanceof ApiError ? err.message : 'Something went wrong.');
    }
  }

  async function handlePickReceipt() {
    if (Platform.OS !== 'web') {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission required', 'Allow photo library access to upload a receipt.');
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setReceiptUri(result.assets[0].uri);
    }
  }

  async function handleMarkPaid() {
    if (!paymentReference.trim()) {
      Alert.alert('Reference required', 'Enter a payment reference (e.g. bank transfer ID or note) before marking paid.');
      return;
    }
    const msg = `Mark ${formatCurrency(settlement!.total_commission)} as paid to ${settlement!.agent.name}?`;
    if (Platform.OS === 'web') {
      if (!window.confirm(msg)) return;
    } else {
      const ok = await new Promise<boolean>(resolve =>
        Alert.alert('Mark as Paid', msg, [
          { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
          { text: 'Confirm', onPress: () => resolve(true) },
        ])
      );
      if (!ok) return;
    }
    try {
      await doPaid({ id: settlementId, paymentReference: paymentReference.trim(), paymentReceiptUri: receiptUri ?? undefined });
      router.back();
    } catch (err) {
      Alert.alert('Error', err instanceof ApiError ? err.message : 'Something went wrong.');
    }
  }

  const existingReceipt = settlement.payment_receipt_uri ?? receiptUri;

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
            name={isPaid ? 'checkmark-circle' : isApproved ? 'thumbs-up-outline' : 'time-outline'}
            size={22} color={statusColor}
          />
          <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: statusColor }}>
            {STATUS_LABEL[settlement.status]}
          </Text>
        </View>

        {/* Summary */}
        <SectionLabel text="Settlement Summary" />
        <InfoCard>
          <Row label="Agent"        value={settlement.agent.name} />
          <Row label="Commission"   value={formatCurrency(settlement.total_commission)} bold />
          <Row label="Period start" value={formatDate(settlement.period_start)} />
          <Row label="Period end"   value={formatDate(settlement.period_end)} />
          <Row label="Triggered by" value={settlement.triggered_by === 'manual' ? 'Manual run' : 'Scheduled'} />
          <Row label="Created"      value={formatDate(settlement.created_at)} />
        </InfoCard>

        {/* Line items */}
        <SectionLabel text={`Line Items (${settlement.line_items.length})`} />
        <InfoCard>
          {settlement.line_items.map((li, i) => (
            <View key={li.id}>
              <View style={{ paddingVertical: SPACING.xs }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted }}>{li.order_code}</Text>
                  <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.teal }}>
                    +{formatCurrency(li.commission_amount)}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <Text style={{ fontSize: 12 }}>{li.product_emoji}</Text>
                  <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.text, flex: 1 }}>
                    {li.product_name} ×{li.quantity}
                  </Text>
                  <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted }}>
                    Agent: {formatCurrency(li.agent_price_snapshot)} · Floor: {formatCurrency(li.selling_price_snapshot)}
                  </Text>
                </View>
              </View>
              {i < settlement.line_items.length - 1 && <Divider />}
            </View>
          ))}
        </InfoCard>

        {/* Approve action */}
        {isPending && (
          <>
            <SectionLabel text="Action" />
            <Button
              label="Approve Settlement"
              onPress={handleApprove}
              loading={approving}
              fullWidth size="lg"
            />
          </>
        )}

        {/* Mark as Paid — reference + optional receipt */}
        {isApproved && (
          <>
            <SectionLabel text="Payment Reference *" />
            <View style={{
              backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
              borderWidth: 1, borderColor: COLORS.border, padding: SPACING.sm,
              marginBottom: SPACING.sm,
            }}>
              <TextInput
                value={paymentReference}
                onChangeText={setPaymentReference}
                placeholder="e.g. Bank transfer ID, 'Cash handed over in person', etc."
                placeholderTextColor={COLORS.muted}
                style={{ fontSize: FONT_SIZES.sm, color: COLORS.text, minHeight: 36 }}
                multiline
              />
            </View>

            <SectionLabel text="Payment Receipt (optional)" />
            {receiptUri ? (
              <View style={{ gap: SPACING.sm }}>
                <Image
                  source={{ uri: receiptUri }}
                  style={{
                    width: '100%', height: 200, borderRadius: RADIUS.md,
                    borderWidth: 1, borderColor: COLORS.border,
                  }}
                  resizeMode="cover"
                />
                <Button
                  label="Remove Receipt"
                  variant="secondary"
                  onPress={() => setReceiptUri(null)}
                  fullWidth
                />
              </View>
            ) : (
              <Pressable
                onPress={handlePickReceipt}
                style={({ pressed }) => ({
                  borderWidth: 1.5, borderStyle: 'dashed', borderColor: COLORS.brand,
                  borderRadius: RADIUS.md, padding: SPACING.lg,
                  alignItems: 'center', gap: SPACING.xs,
                  backgroundColor: pressed ? COLORS.brand + '10' : COLORS.bg,
                })}
              >
                <Ionicons name="image-outline" size={28} color={COLORS.brand} />
                <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.brand, fontWeight: '600' }}>
                  Upload Payment Receipt
                </Text>
                <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted }}>
                  Take a photo or choose from library
                </Text>
              </Pressable>
            )}

            <SectionLabel text="Action" />
            <Button
              label="Mark as Paid"
              onPress={handleMarkPaid}
              loading={paying}
              fullWidth size="lg"
            />
          </>
        )}

        {/* Paid / Confirmed — show reference and receipt */}
        {(isPaid || settlement.status === 'confirmed') && (
          <>
            <SectionLabel text="Payment Record" />
            <View style={{
              backgroundColor: COLORS.teal + '18', borderRadius: RADIUS.md,
              borderWidth: 1, borderColor: COLORS.teal + '40',
              padding: SPACING.md, gap: SPACING.xs,
              marginBottom: existingReceipt ? SPACING.md : 0,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                <Ionicons name="checkmark-circle" size={22} color={COLORS.teal} />
                <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.teal }}>
                  Commission paid to {settlement.agent.name}
                </Text>
              </View>
              {settlement.payment_reference ? (
                <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, paddingLeft: 30 }}>
                  Ref: {settlement.payment_reference}
                </Text>
              ) : null}
              {settlement.acknowledged_at ? (
                <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.teal, paddingLeft: 30 }}>
                  Confirmed by agent on {formatDate(settlement.acknowledged_at)}
                </Text>
              ) : (
                <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, paddingLeft: 30 }}>
                  Awaiting confirmation from agent
                </Text>
              )}
            </View>
            {existingReceipt && (
              <>
                <Text style={{
                  fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.muted,
                  textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SPACING.xs,
                }}>
                  Payment Receipt
                </Text>
                <Image
                  source={{ uri: existingReceipt }}
                  style={{
                    width: '100%', height: 220, borderRadius: RADIUS.md,
                    borderWidth: 1, borderColor: COLORS.border,
                  }}
                  resizeMode="cover"
                />
              </>
            )}
          </>
        )}

        <View style={{ height: SPACING['2xl'] }} />
      </Screen>
    </>
  );
}
