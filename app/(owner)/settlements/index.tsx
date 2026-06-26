import { useState }                                          from 'react';
import { FlatList, Pressable, RefreshControl, Text, View }   from 'react-native';
import { router }        from 'expo-router';
import { Ionicons }      from '@expo/vector-icons';

import { Screen }                           from '@/components/ui/Screen';
import { Button }                           from '@/components/ui/Button';
import { LoadingSpinner }                   from '@/components/ui/LoadingSpinner';
import { EmptyState }                       from '@/components/ui/EmptyState';
import { useAllSettlements, useRunSettlement } from '@/hooks/useSettlement';
import { SettlementFull }                   from '@/types';
import { formatCurrency, formatDate }       from '@/lib/utils';
import { ApiError }                         from '@/types';
import {
  COLORS, FONT_SIZES, RADIUS, SHADOW, SPACING,
} from '@/lib/theme';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_COLOR: Record<string, string> = {
  pending:  COLORS.warning,
  approved: COLORS.info,
  paid:     COLORS.teal,
};
const STATUS_LABEL: Record<string, string> = {
  pending:  'Pending',
  approved: 'Approved',
  paid:     'Paid',
};

// ---------------------------------------------------------------------------
// Settlement card
// ---------------------------------------------------------------------------

function SettlementCard({ settlement }: { settlement: SettlementFull }) {
  const color = STATUS_COLOR[settlement.status] ?? COLORS.muted;
  return (
    <Pressable
      onPress={() => router.push(`/(owner)/settlements/${settlement.id}` as any)}
      style={{
        backgroundColor: COLORS.surface,
        borderRadius:    RADIUS.md,
        borderWidth:     1,
        borderColor:     settlement.status === 'pending' ? COLORS.warning + '60' : COLORS.border,
        padding:         SPACING.md,
        marginBottom:    SPACING.sm,
        ...SHADOW.sm,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.text, flex: 1 }}>
          {settlement.agent.name}
        </Text>
        <View style={{
          backgroundColor: color + '20', borderRadius: RADIUS.full,
          paddingHorizontal: 8, paddingVertical: 2,
        }}>
          <Text style={{ fontSize: FONT_SIZES.xs, fontWeight: '700', color }}>
            {STATUS_LABEL[settlement.status]}
          </Text>
        </View>
      </View>

      <Text style={{ fontSize: FONT_SIZES['2xl'], fontWeight: '800', color: COLORS.text, marginTop: SPACING.xs }}>
        {formatCurrency(settlement.total_commission)}
      </Text>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
        <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted }}>
          {settlement.line_items.length} item{settlement.line_items.length !== 1 ? 's' : ''}
          {' · '}{settlement.triggered_by === 'manual' ? 'Manual' : 'Scheduled'}
        </Text>
        <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted }}>
          {formatDate(settlement.created_at)}
        </Text>
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function SettlementsListScreen() {
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState('');

  const { data: settlements = [], isLoading, isRefetching, refetch } = useAllSettlements();
  const { mutateAsync: doRun } = useRunSettlement();

  async function handleRun() {
    setRunning(true);
    setRunError('');
    try {
      await doRun({ triggeredBy: 'manual' });
    } catch (err) {
      setRunError(err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setRunning(false);
    }
  }

  if (isLoading) return <LoadingSpinner fullScreen message="Loading settlements…" />;

  const pending = settlements.filter(s => s.status === 'pending').length;

  return (
    <Screen scrollable={false} padded={false}>
      <FlatList
        data={settlements}
        keyExtractor={s => String(s.id)}
        contentContainerStyle={{
          paddingHorizontal: SPACING.base,
          paddingTop:        SPACING.base,
          paddingBottom:     SPACING['2xl'],
        }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.brand} />
        }
        ListHeaderComponent={
          <View style={{ marginBottom: SPACING.md }}>
            <Button
              label="Run Settlement"
              onPress={handleRun}
              loading={running}
              fullWidth
              size="md"
            />
            {!!runError && (
              <Text style={{
                fontSize: FONT_SIZES.xs, color: COLORS.danger,
                textAlign: 'center', marginTop: SPACING.xs,
              }}>
                {runError}
              </Text>
            )}
            {pending > 0 && (
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 6,
                marginTop: SPACING.sm,
              }}>
                <Ionicons name="time-outline" size={14} color={COLORS.warning} />
                <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted }}>
                  {pending} settlement{pending !== 1 ? 's' : ''} awaiting approval
                </Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            emoji="🤝"
            title="No settlements yet"
            description="Tap 'Run Settlement' to compute commissions for eligible delivered orders."
          />
        }
        renderItem={({ item }) => <SettlementCard settlement={item} />}
      />
    </Screen>
  );
}
