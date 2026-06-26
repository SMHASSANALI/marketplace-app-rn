/**
 * Owner — Agent management screen.
 *
 * Create, suspend, reactivate, and delete agent accounts.
 * Only the owner can reach this screen.
 */

import { useState }                                           from 'react';
import { Alert, FlatList, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { Stack }                                              from 'expo-router';
import { Ionicons }                                          from '@expo/vector-icons';

import { Screen }         from '@/components/ui/Screen';
import { Button }         from '@/components/ui/Button';
import { EmptyState }     from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useUsersByRole, useCreateUser, useSuspendUser, useReactivateUser, useDeleteUser } from '@/hooks/useUsers';
import { User }           from '@/types';
import {
  COLORS, FONT_SIZES, RADIUS, SHADOW, SPACING,
} from '@/lib/theme';

// ---------------------------------------------------------------------------
// Agent row
// ---------------------------------------------------------------------------

function AgentRow({ agent, onSuspend, onReactivate, onDelete }: {
  agent:        User;
  onSuspend:    (u: User) => void;
  onReactivate: (u: User) => void;
  onDelete:     (u: User) => void;
}) {
  const isSuspended = agent.status === 'suspended';

  return (
    <View style={{
      backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
      borderWidth: 1, borderColor: COLORS.border,
      padding: SPACING.md, marginBottom: SPACING.sm,
      ...SHADOW.sm,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
        {/* Avatar */}
        <View style={{
          width: 40, height: 40, borderRadius: 20,
          backgroundColor: isSuspended ? COLORS.surfaceAlt : COLORS.brandLight,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons
            name="person-outline"
            size={20}
            color={isSuspended ? COLORS.muted : COLORS.brand}
          />
        </View>

        {/* Info */}
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: FONT_SIZES.sm, fontWeight: '700',
            color: isSuspended ? COLORS.muted : COLORS.text,
          }}>
            {agent.name}
          </Text>
          <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginTop: 2 }}>
            {agent.phone}
          </Text>
        </View>

        {/* Status badge */}
        <View style={{
          backgroundColor: isSuspended ? COLORS.surfaceAlt : COLORS.infoLight,
          borderRadius: RADIUS.sm, paddingHorizontal: 8, paddingVertical: 3,
        }}>
          <Text style={{
            fontSize: FONT_SIZES.xs, fontWeight: '600',
            color: isSuspended ? COLORS.muted : COLORS.info,
          }}>
            {isSuspended ? 'Suspended' : 'Active'}
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={{ flexDirection: 'row', gap: SPACING.xs, marginTop: SPACING.sm }}>
        {isSuspended ? (
          <View style={{ flex: 1 }}>
            <Button
              label="Reactivate"
              variant="secondary"
              size="sm"
              onPress={() => onReactivate(agent)}
              fullWidth
            />
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <Button
              label="Suspend"
              variant="secondary"
              size="sm"
              onPress={() => onSuspend(agent)}
              fullWidth
            />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Button
            label="Delete"
            variant="danger"
            size="sm"
            onPress={() => onDelete(agent)}
            fullWidth
          />
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Create agent form
// ---------------------------------------------------------------------------

function CreateAgentForm({ onClose }: { onClose: () => void }) {
  const [name,  setName]   = useState('');
  const [phone, setPhone]  = useState('');
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const { mutateAsync: create, isPending } = useCreateUser();

  async function handleSubmit() {
    const e: typeof errors = {};
    if (!name.trim())  e.name  = 'Name is required.';
    if (!phone.trim()) e.phone = 'Phone is required.';
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    try {
      await create({ name: name.trim(), phone: phone.trim(), role: 'agent' });
      if (Platform.OS !== 'web') {
        Alert.alert('Agent Added', `${name.trim()} can now log in as an agent.`);
      }
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Something went wrong.');
    }
  }

  return (
    <View style={{
      backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
      borderWidth: 1, borderColor: COLORS.brand,
      padding: SPACING.md, marginBottom: SPACING.md, gap: SPACING.sm, ...SHADOW.sm,
    }}>
      <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.text }}>
        New Agent
      </Text>

      {/* Name */}
      <View>
        <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginBottom: 4 }}>Full Name</Text>
        <TextInput
          value={name}
          onChangeText={t => { setName(t); setErrors(e => ({ ...e, name: undefined })); }}
          placeholder="e.g. Bilal Raza"
          placeholderTextColor={COLORS.muted}
          style={{
            borderWidth: 1, borderRadius: RADIUS.sm, padding: SPACING.sm,
            fontSize: FONT_SIZES.sm, color: COLORS.text, backgroundColor: COLORS.bg,
            borderColor: errors.name ? COLORS.danger : COLORS.border,
          }}
        />
        {errors.name && (
          <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.danger, marginTop: 2 }}>{errors.name}</Text>
        )}
      </View>

      {/* Phone */}
      <View>
        <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginBottom: 4 }}>Phone Number</Text>
        <TextInput
          value={phone}
          onChangeText={t => { setPhone(t); setErrors(e => ({ ...e, phone: undefined })); }}
          placeholder="03XXXXXXXXX"
          placeholderTextColor={COLORS.muted}
          keyboardType="phone-pad"
          style={{
            borderWidth: 1, borderRadius: RADIUS.sm, padding: SPACING.sm,
            fontSize: FONT_SIZES.sm, color: COLORS.text, backgroundColor: COLORS.bg,
            borderColor: errors.phone ? COLORS.danger : COLORS.border,
          }}
        />
        {errors.phone && (
          <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.danger, marginTop: 2 }}>{errors.phone}</Text>
        )}
      </View>

      <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted }}>
        The agent can log in using this phone number. Any non-empty password will be accepted in the current build.
      </Text>

      <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
        <View style={{ flex: 1 }}>
          <Button label="Cancel" onPress={onClose} variant="secondary" disabled={isPending} fullWidth size="md" />
        </View>
        <View style={{ flex: 1 }}>
          <Button label="Add Agent" onPress={handleSubmit} loading={isPending} fullWidth size="md" />
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function AgentsScreen() {
  const [showForm, setShowForm] = useState(false);
  const { data: agents = [], isLoading } = useUsersByRole('agent');
  const { mutateAsync: doSuspend }     = useSuspendUser();
  const { mutateAsync: doReactivate }  = useReactivateUser();
  const { mutateAsync: doDelete }      = useDeleteUser();

  async function handleSuspend(agent: User) {
    const msg = `Suspend ${agent.name}? They will not be able to log in until reactivated.`;
    if (Platform.OS === 'web') {
      if (!window.confirm(msg)) return;
    } else {
      const ok = await new Promise<boolean>(resolve =>
        Alert.alert('Suspend Agent', msg, [
          { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
          { text: 'Suspend', onPress: () => resolve(true), style: 'destructive' },
        ])
      );
      if (!ok) return;
    }
    try { await doSuspend(agent.id); } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Something went wrong.');
    }
  }

  async function handleReactivate(agent: User) {
    try { await doReactivate(agent.id); } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Something went wrong.');
    }
  }

  async function handleDelete(agent: User) {
    const msg = `Delete ${agent.name}'s account permanently? This cannot be undone.`;
    if (Platform.OS === 'web') {
      if (!window.confirm(msg)) return;
    } else {
      const ok = await new Promise<boolean>(resolve =>
        Alert.alert('Delete Agent', msg, [
          { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
          { text: 'Delete', onPress: () => resolve(true), style: 'destructive' },
        ])
      );
      if (!ok) return;
    }
    try { await doDelete(agent.id); } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Something went wrong.');
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Agents', headerShown: true }} />
      <Screen padded={false}>
        {isLoading ? (
          <LoadingSpinner fullScreen />
        ) : (
          <FlatList
            data={agents}
            keyExtractor={a => String(a.id)}
            contentContainerStyle={{
              paddingHorizontal: SPACING.base,
              paddingVertical:   SPACING.base,
              paddingBottom:     SPACING['2xl'],
            }}
            ListHeaderComponent={
              <View style={{ marginBottom: SPACING.sm }}>
                {showForm ? (
                  <CreateAgentForm onClose={() => setShowForm(false)} />
                ) : (
                  <Button
                    label="+ Add Agent"
                    onPress={() => setShowForm(true)}
                    fullWidth
                  />
                )}
              </View>
            }
            ListEmptyComponent={
              !showForm ? (
                <EmptyState
                  emoji="🧑‍💼"
                  title="No agents yet"
                  description="Tap 'Add Agent' to create the first agent account."
                />
              ) : null
            }
            renderItem={({ item }) => (
              <AgentRow
                agent={item}
                onSuspend={handleSuspend}
                onReactivate={handleReactivate}
                onDelete={handleDelete}
              />
            )}
          />
        )}
      </Screen>
    </>
  );
}
