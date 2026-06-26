import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { router }           from 'expo-router';
import { Ionicons }         from '@expo/vector-icons';

import { Screen }           from '@/components/ui/Screen';
import { LoadingSpinner }   from '@/components/ui/LoadingSpinner';
import { useAuthContext }   from '@/context/AuthContext';
import { useManagerSummary } from '@/hooks/useDashboard';
import {
  COLORS, FONT_SIZES, RADIUS, SHADOW, SPACING,
} from '@/lib/theme';

// ---------------------------------------------------------------------------
// Action card
// ---------------------------------------------------------------------------

function ActionCard({
  icon, title, description, count, color, onPress,
}: {
  icon:        string;
  title:       string;
  description: string;
  count:       number;
  color:       string;
  onPress:     () => void;
}) {
  const urgent = count > 0;
  return (
    <Pressable
      onPress={urgent ? onPress : undefined}
      style={({ pressed }) => ({
        backgroundColor: COLORS.surface,
        borderRadius:    RADIUS.md,
        borderWidth:     1,
        borderColor:     urgent ? color + '50' : COLORS.border,
        padding:         SPACING.md,
        marginBottom:    SPACING.sm,
        flexDirection:   'row',
        alignItems:      'center',
        gap:             SPACING.md,
        opacity:         pressed ? 0.8 : 1,
        ...SHADOW.sm,
      })}
    >
      <View style={{
        width:           44, height: 44,
        borderRadius:    RADIUS.md,
        backgroundColor: urgent ? color + '18' : COLORS.surfaceAlt,
        alignItems:      'center',
        justifyContent:  'center',
      }}>
        <Ionicons name={icon as any} size={22} color={urgent ? color : COLORS.muted} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{
          fontSize:   FONT_SIZES.base,
          fontWeight: '700',
          color:      urgent ? COLORS.text : COLORS.muted,
          marginBottom: 2,
        }}>
          {title}
        </Text>
        <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted }}>{description}</Text>
      </View>
      <View style={{
        alignItems:        'center',
        justifyContent:    'center',
        minWidth:          36,
        height:            36,
        paddingHorizontal: 6,
        borderRadius:      RADIUS.full,
        backgroundColor:   urgent ? color + '18' : COLORS.surfaceAlt,
      }}>
        <Text style={{
          fontSize:   FONT_SIZES.lg,
          fontWeight: '800',
          color:      urgent ? color : COLORS.muted,
        }}>
          {count}
        </Text>
      </View>
      {urgent && <Ionicons name="chevron-forward" size={14} color={color} />}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// No-permission placeholder
// ---------------------------------------------------------------------------

function NoPermissions() {
  return (
    <View style={{
      backgroundColor: COLORS.surfaceAlt,
      borderRadius:    RADIUS.md,
      borderWidth:     1,
      borderColor:     COLORS.border,
      padding:         SPACING.lg,
      alignItems:      'center',
      gap:             SPACING.sm,
    }}>
      <Ionicons name="lock-closed-outline" size={32} color={COLORS.muted} />
      <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.muted, textAlign: 'center' }}>
        No permissions granted yet
      </Text>
      <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, textAlign: 'center', lineHeight: 18 }}>
        Ask the owner to grant you permissions in Settings → Managers.
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ManagerDashboard() {
  const { user, logout, managerPermissions } = useAuthContext();
  const { data: summary, isLoading, refetch, isRefetching } = useManagerSummary(managerPermissions);

  if (isLoading) return <LoadingSpinner fullScreen message="Loading dashboard…" />;

  const s = summary ?? {};
  const hasAnyPermission = managerPermissions.length > 0;
  const totalActions = (s.pending_orders ?? 0) + (s.pending_receipts ?? 0)
    + (s.pending_deposits ?? 0) + (s.pending_settlements ?? 0);

  return (
    <Screen scrollable={false} padded={false}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: SPACING.base,
          paddingBottom:     SPACING['2xl'],
        }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.brand} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={{
          backgroundColor: COLORS.brand,
          borderRadius:    RADIUS.lg,
          padding:         SPACING.lg,
          marginTop:       SPACING.base,
          marginBottom:    SPACING.base,
        }}>
          <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: FONT_SIZES.xs, fontWeight: '600', letterSpacing: 0.3 }}>Manager Dashboard</Text>
          <Text style={{ color: '#fff', fontSize: FONT_SIZES['2xl'], fontWeight: '800', marginTop: 2 }}>
            {user?.name}
          </Text>
          <View style={{
            marginTop:       SPACING.sm,
            paddingTop:      SPACING.sm,
            borderTopWidth:  1,
            borderTopColor:  'rgba(255,255,255,0.2)',
            flexDirection:   'row',
            alignItems:      'center',
            gap:             6,
          }}>
            <Ionicons name="shield-checkmark-outline" size={12} color="rgba(255,255,255,0.7)" />
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: FONT_SIZES.xs }}>
              {managerPermissions.length} permission{managerPermissions.length !== 1 ? 's' : ''} granted
            </Text>
          </View>
        </View>

        {/* ── Action items ── */}
        {!hasAnyPermission ? (
          <NoPermissions />
        ) : (
          <>
            {totalActions === 0 ? (
              <View style={{
                backgroundColor: COLORS.success + '12',
                borderRadius:    RADIUS.md,
                borderWidth:     1,
                borderColor:     COLORS.success + '40',
                padding:         SPACING.md,
                flexDirection:   'row',
                alignItems:      'center',
                gap:             SPACING.sm,
              }}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.success }}>
                  All caught up — no pending actions
                </Text>
              </View>
            ) : (
              <Text style={{
                fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.muted,
                textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: SPACING.sm,
              }}>
                Action Required
              </Text>
            )}

            {s.pending_orders !== undefined && (
              <ActionCard
                icon="list-outline"
                title="Pending Orders"
                description={s.pending_orders > 0
                  ? `${s.pending_orders} order${s.pending_orders !== 1 ? 's' : ''} awaiting confirmation`
                  : 'No orders awaiting confirmation'}
                count={s.pending_orders}
                color={COLORS.warning}
                onPress={() => router.push('/(manager)/orders' as any)}
              />
            )}

            {s.pending_receipts !== undefined && (
              <ActionCard
                icon="receipt-outline"
                title="Prepaid Receipts"
                description={s.pending_receipts > 0
                  ? `${s.pending_receipts} receipt${s.pending_receipts !== 1 ? 's' : ''} awaiting verification`
                  : 'No receipts awaiting verification'}
                count={s.pending_receipts}
                color={COLORS.warning}
                onPress={() => router.push('/(manager)/receipts' as any)}
              />
            )}

            {s.pending_deposits !== undefined && (
              <ActionCard
                icon="cash-outline"
                title="Cash Deposits"
                description={s.pending_deposits > 0
                  ? `${s.pending_deposits} deposit${s.pending_deposits !== 1 ? 's' : ''} to confirm — see owner`
                  : 'No deposits pending'}
                count={s.pending_deposits}
                color={COLORS.warning}
                onPress={() => {}}
              />
            )}

            {s.pending_settlements !== undefined && (
              <ActionCard
                icon="people-outline"
                title="Settlements"
                description={s.pending_settlements > 0
                  ? `${s.pending_settlements} settlement${s.pending_settlements !== 1 ? 's' : ''} to approve — see owner`
                  : 'No settlements pending'}
                count={s.pending_settlements}
                color={COLORS.brand}
                onPress={() => {}}
              />
            )}

            {/* ── Permissions summary ── */}
            <Text style={{
              fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.muted,
              textTransform: 'uppercase', letterSpacing: 0.6,
              marginTop: SPACING.lg, marginBottom: SPACING.sm,
            }}>
              Your Permissions
            </Text>
            <View style={{
              backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
              borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, ...SHADOW.sm,
            }}>
              {managerPermissions.map((perm, i) => (
                <View key={perm} style={{
                  flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
                  paddingVertical: 6,
                  borderBottomWidth: i < managerPermissions.length - 1 ? 1 : 0,
                  borderBottomColor: COLORS.border,
                }}>
                  <Ionicons name="checkmark-circle" size={14} color={COLORS.brand} />
                  <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.text, textTransform: 'capitalize' }}>
                    {perm.replace(/_/g, ' ')}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── Sign out ── */}
        <Pressable
          onPress={logout}
          style={({ pressed }) => ({
            marginTop:       SPACING.xl,
            paddingVertical: SPACING.sm,
            alignItems:      'center',
            opacity:         pressed ? 0.6 : 1,
          })}
        >
          <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted }}>
            Sign out · {user?.name}
          </Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
