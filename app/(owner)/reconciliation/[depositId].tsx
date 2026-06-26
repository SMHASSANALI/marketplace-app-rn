import { ActivityIndicator, Alert, Platform, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, router }            from 'expo-router';
import { Ionicons }                                       from '@expo/vector-icons';

import { Screen }                from '@/components/ui/Screen';
import { Button }                from '@/components/ui/Button';
import { useDepositDetail, useConfirmDeposit } from '@/hooks/useCODReconciliation';
import { formatCurrency }        from '@/lib/utils';
import { ApiError }              from '@/types';
import {
  COLORS, FONT_SIZES, RADIUS, SHADOW, SPACING,
} from '@/lib/theme';

// ---------------------------------------------------------------------------
// Layout helpers
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

export default function DepositDetailScreen() {
  const { depositId }  = useLocalSearchParams<{ depositId: string }>();
  const id             = Number(depositId);

  const { data: deposit, isLoading, error } = useDepositDetail(id);
  const { mutateAsync: doConfirm, isPending: confirming }  = useConfirmDeposit();

  if (isLoading) {
    return (
      <Screen>
        <ActivityIndicator style={{ flex: 1 }} color={COLORS.brand} />
      </Screen>
    );
  }
  if (error || !deposit) {
    return (
      <Screen padded>
        <Text style={{ color: COLORS.danger }}>Deposit not found.</Text>
      </Screen>
    );
  }

  const isConfirmed  = deposit.owner_confirmed;
  const hasMismatch  = deposit.collections.some(c => c.mismatch_flag);

  async function handleConfirm() {
    const msg = `Confirm deposit of ${formatCurrency(deposit!.deposit_amount)} from ${deposit!.rider.name}?\n\nRef: ${deposit!.deposit_reference}`;

    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      if (!window.confirm(msg)) return;
    } else {
      const confirmed = await new Promise<boolean>(resolve =>
        Alert.alert('Confirm Deposit', msg, [
          { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
          { text: 'Confirm', onPress: () => resolve(true) },
        ])
      );
      if (!confirmed) return;
    }

    try {
      await doConfirm({ depositId: id });
      router.back();
    } catch (err) {
      Alert.alert('Error', err instanceof ApiError ? err.message : 'Something went wrong.');
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          title:       deposit.deposit_reference ?? `Deposit #${id}`,
          headerShown: true,
        }}
      />

      <Screen scrollable padded>

        {/* ── Status banner ── */}
        {isConfirmed ? (
          <View style={{
            backgroundColor: COLORS.teal + '18',
            borderRadius:    RADIUS.md,
            borderWidth:     1,
            borderColor:     COLORS.teal + '40',
            padding:         SPACING.md,
            flexDirection:   'row',
            alignItems:      'center',
            gap:             SPACING.sm,
            marginBottom:    SPACING.sm,
          }}>
            <Ionicons name="checkmark-circle" size={22} color={COLORS.teal} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.teal }}>
                Confirmed
              </Text>
              {deposit.owner_confirmed_at && (
                <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginTop: 2 }}>
                  {new Date(deposit.owner_confirmed_at).toLocaleString('en-PK', {
                    day: 'numeric', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </Text>
              )}
            </View>
          </View>
        ) : (
          <View style={{
            backgroundColor: COLORS.warning + '18',
            borderRadius:    RADIUS.md,
            borderWidth:     1,
            borderColor:     COLORS.warning + '50',
            padding:         SPACING.md,
            flexDirection:   'row',
            alignItems:      'center',
            gap:             SPACING.sm,
            marginBottom:    SPACING.sm,
          }}>
            <Ionicons name="time-outline" size={22} color={COLORS.warning} />
            <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.warning }}>
              Awaiting confirmation
            </Text>
          </View>
        )}

        {/* ── Mismatch warning ── */}
        {hasMismatch && (
          <View style={{
            backgroundColor: COLORS.danger + '12',
            borderRadius:    RADIUS.md,
            borderWidth:     1,
            borderColor:     COLORS.danger + '40',
            padding:         SPACING.md,
            flexDirection:   'row',
            alignItems:      'flex-start',
            gap:             SPACING.sm,
            marginBottom:    SPACING.sm,
          }}>
            <Ionicons name="alert-circle-outline" size={18} color={COLORS.danger} />
            <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.danger, flex: 1 }}>
              One or more orders have a cash mismatch. Review the amounts below before confirming.
            </Text>
          </View>
        )}

        {/* ── Deposit summary ── */}
        <SectionLabel text="Deposit Details" />
        <InfoCard>
          <InfoRow label="Rider"     value={deposit.rider.name} />
          <InfoRow label="Amount"    value={formatCurrency(deposit.deposit_amount)} bold color={COLORS.text} />
          <InfoRow label="Reference" value={deposit.deposit_reference ?? '—'} />
          <InfoRow
            label="Date"
            value={new Date(deposit.deposited_at).toLocaleDateString('en-PK', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          />
          <InfoRow label="Orders"    value={String(deposit.collections.length)} />
        </InfoCard>

        {/* ── Orders in deposit ── */}
        <SectionLabel text={`Orders (${deposit.collections.length})`} />
        <InfoCard>
          {deposit.collections.map((col, i) => (
            <View key={col.id}>
              <View style={{ paddingVertical: SPACING.xs }}>
                {/* Order code + mismatch badge */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.text }}>
                    {col.order_code}
                  </Text>
                  {col.mismatch_flag && (
                    <View style={{
                      flexDirection: 'row', alignItems: 'center', gap: 3,
                      backgroundColor: COLORS.danger + '15',
                      borderRadius: RADIUS.full, paddingHorizontal: 6, paddingVertical: 2,
                    }}>
                      <Ionicons name="alert-circle" size={10} color={COLORS.danger} />
                      <Text style={{ fontSize: 10, fontWeight: '700', color: COLORS.danger }}>
                        Mismatch
                      </Text>
                    </View>
                  )}
                </View>
                {/* Collected vs expected */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                  <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted }}>
                    Collected: <Text style={{ color: COLORS.text, fontWeight: '600' }}>
                      {formatCurrency(col.amount_collected)}
                    </Text>
                  </Text>
                  <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted }}>
                    Expected: <Text style={{ color: col.mismatch_flag ? COLORS.danger : COLORS.text, fontWeight: '600' }}>
                      {formatCurrency(col.expected_total)}
                    </Text>
                  </Text>
                </View>
              </View>
              {i < deposit.collections.length - 1 && <Divider />}
            </View>
          ))}
        </InfoCard>

        {/* ── Confirm action ── */}
        {!isConfirmed && (
          <>
            <SectionLabel text="Action" />
            <Button
              label="Confirm Deposit"
              onPress={handleConfirm}
              loading={confirming}
              fullWidth
              size="lg"
            />
            <Text style={{
              fontSize: FONT_SIZES.xs, color: COLORS.muted,
              textAlign: 'center', marginTop: SPACING.xs,
            }}>
              Confirming updates affected orders to Reconciled status.
            </Text>
          </>
        )}

        <View style={{ height: SPACING['2xl'] }} />
      </Screen>
    </>
  );
}
