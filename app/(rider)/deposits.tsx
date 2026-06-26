import { useState }                                          from 'react';
import { Alert, ScrollView, Text, TextInput, View }          from 'react-native';
import { Ionicons }                                          from '@expo/vector-icons';

import { Screen }            from '@/components/ui/Screen';
import { Button }            from '@/components/ui/Button';
import { LoadingSpinner }    from '@/components/ui/LoadingSpinner';
import { EmptyState }        from '@/components/ui/EmptyState';
import { useAuthContext }    from '@/context/AuthContext';
import {
  useUndepositedCollections, useRiderDeposits, useLogDeposit,
} from '@/hooks/useRiderDeliveries';
import { CashDeposit }       from '@/types';
import { formatCurrency }    from '@/lib/utils';
import {
  COLORS, FONT_SIZES, RADIUS, SHADOW, SPACING,
} from '@/lib/theme';

// ---------------------------------------------------------------------------
// Deposit history card
// ---------------------------------------------------------------------------

function DepositRow({ deposit }: { deposit: CashDeposit }) {
  return (
    <View style={{
      backgroundColor: COLORS.surface,
      borderRadius:    RADIUS.md,
      borderWidth:     1,
      borderColor:     COLORS.border,
      padding:         SPACING.md,
      marginBottom:    SPACING.sm,
      ...SHADOW.sm,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.text }}>
          {formatCurrency(deposit.deposit_amount)}
        </Text>
        <View style={{
          backgroundColor: deposit.owner_confirmed ? COLORS.teal + '20' : COLORS.warning + '20',
          borderRadius:    RADIUS.full,
          paddingHorizontal: 8, paddingVertical: 2,
        }}>
          <Text style={{
            fontSize: FONT_SIZES.xs, fontWeight: '700',
            color: deposit.owner_confirmed ? COLORS.teal : COLORS.warning,
          }}>
            {deposit.owner_confirmed ? 'Confirmed' : 'Pending'}
          </Text>
        </View>
      </View>
      <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginTop: 4 }}>
        Ref: {deposit.deposit_reference ?? '—'}
      </Text>
      <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginTop: 2 }}>
        {new Date(deposit.deposited_at).toLocaleDateString('en-PK', {
          day: 'numeric', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
        })}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Deposit form
// ---------------------------------------------------------------------------

function DepositForm({
  totalCollected,
  riderId,
  onSuccess,
}: {
  totalCollected: number;
  riderId: number;
  onSuccess: () => void;
}) {
  const [amount,    setAmount]    = useState(String(totalCollected));
  const [reference, setReference] = useState('');
  const [errors, setErrors]       = useState<{ amount?: string; reference?: string }>({});

  const { mutateAsync: doDeposit, isPending } = useLogDeposit();

  async function handleSubmit() {
    const e: typeof errors = {};
    const parsed = parseFloat(amount.trim());
    if (!amount.trim() || isNaN(parsed) || parsed <= 0) e.amount = 'Enter a valid amount.';
    if (!reference.trim()) e.reference = 'Reference number is required.';
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});

    try {
      await doDeposit({ riderId, depositAmount: Math.round(parsed), depositReference: reference.trim() });
      Alert.alert('Deposit Logged', 'Your cash deposit has been recorded. The owner will confirm it shortly.');
      onSuccess();
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Something went wrong.');
    }
  }

  return (
    <View style={{
      backgroundColor: COLORS.surface,
      borderRadius:    RADIUS.md,
      borderWidth:     1,
      borderColor:     COLORS.info + '60',
      padding:         SPACING.md,
      marginBottom:    SPACING.md,
      gap:             SPACING.sm,
      ...SHADOW.sm,
    }}>
      <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.text }}>
        Log Cash Deposit
      </Text>

      {/* Amount */}
      <View>
        <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginBottom: 4 }}>
          Deposit Amount (Rs)
        </Text>
        <TextInput
          value={amount}
          onChangeText={t => { setAmount(t); setErrors(e => ({ ...e, amount: undefined })); }}
          placeholder="0"
          placeholderTextColor={COLORS.muted}
          keyboardType="numeric"
          style={{
            borderWidth:     1,
            borderColor:     errors.amount ? COLORS.danger : COLORS.border,
            borderRadius:    RADIUS.sm,
            padding:         SPACING.sm,
            fontSize:        FONT_SIZES.sm,
            color:           COLORS.text,
            backgroundColor: COLORS.bg,
          }}
        />
        {errors.amount && (
          <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.danger, marginTop: 2 }}>
            {errors.amount}
          </Text>
        )}
      </View>

      {/* Reference */}
      <View>
        <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginBottom: 4 }}>
          Bank / Reference Number
        </Text>
        <TextInput
          value={reference}
          onChangeText={t => { setReference(t); setErrors(e => ({ ...e, reference: undefined })); }}
          placeholder="e.g. TRX-20260626-001"
          placeholderTextColor={COLORS.muted}
          style={{
            borderWidth:     1,
            borderColor:     errors.reference ? COLORS.danger : COLORS.border,
            borderRadius:    RADIUS.sm,
            padding:         SPACING.sm,
            fontSize:        FONT_SIZES.sm,
            color:           COLORS.text,
            backgroundColor: COLORS.bg,
          }}
        />
        {errors.reference && (
          <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.danger, marginTop: 2 }}>
            {errors.reference}
          </Text>
        )}
      </View>

      <Button
        label="Submit Deposit"
        onPress={handleSubmit}
        loading={isPending}
        fullWidth
        size="md"
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function RiderDepositsScreen() {
  const { user }  = useAuthContext();
  const [showForm, setShowForm] = useState(false);

  const { data: collections = [], isLoading: loadingCols } =
    useUndepositedCollections(user?.id ?? 0);
  const { data: deposits = [], isLoading: loadingDeps, refetch: refetchDeps } =
    useRiderDeposits(user?.id ?? 0);

  if (loadingCols || loadingDeps) return <LoadingSpinner fullScreen message="Loading…" />;

  const totalCollected = collections.reduce((s, c) => s + c.amount_collected, 0);
  const hasCash        = collections.length > 0;

  return (
    <Screen scrollable={false} padded={false}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: SPACING.base,
          paddingBottom:     SPACING['2xl'],
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ paddingTop: SPACING.base, paddingBottom: SPACING.lg }}>
          <Text style={{ fontSize: FONT_SIZES['2xl'], fontWeight: '800', color: COLORS.text }}>
            Cash Deposits
          </Text>
        </View>

        {/* Undeposited summary */}
        <View style={{
          backgroundColor: hasCash ? COLORS.warning + '18' : COLORS.surfaceAlt,
          borderRadius:    RADIUS.md,
          borderWidth:     1,
          borderColor:     hasCash ? COLORS.warning + '50' : COLORS.border,
          padding:         SPACING.md,
          marginBottom:    SPACING.md,
          flexDirection:   'row',
          alignItems:      'center',
          gap:             SPACING.sm,
        }}>
          <Ionicons
            name={hasCash ? 'cash-outline' : 'checkmark-circle-outline'}
            size={28}
            color={hasCash ? COLORS.warning : COLORS.teal}
          />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.text }}>
              {hasCash
                ? `Rs ${totalCollected.toLocaleString()} undeposited`
                : 'All cash deposited'}
            </Text>
            <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginTop: 2 }}>
              {hasCash
                ? `${collections.length} order${collections.length !== 1 ? 's' : ''} collected, awaiting deposit`
                : 'No pending cash to deposit'}
            </Text>
          </View>
        </View>

        {/* Log deposit button / form */}
        {hasCash && !showForm && (
          <Button
            label="Log Cash Deposit"
            onPress={() => setShowForm(true)}
            fullWidth
            size="md"
          />
        )}
        {hasCash && showForm && (
          <DepositForm
            totalCollected={totalCollected}
            riderId={user?.id ?? 0}
            onSuccess={() => { setShowForm(false); refetchDeps(); }}
          />
        )}

        {/* Deposit history */}
        <View style={{ marginTop: SPACING.lg }}>
          <Text style={{
            fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.muted,
            textTransform: 'uppercase', letterSpacing: 0.6,
            marginBottom: SPACING.sm,
          }}>
            Deposit History
          </Text>

          {deposits.length === 0 ? (
            <EmptyState
              emoji="💵"
              title="No deposits yet"
              description="Your deposit records will appear here once you log them."
            />
          ) : (
            deposits.map(d => <DepositRow key={d.id} deposit={d} />)
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
