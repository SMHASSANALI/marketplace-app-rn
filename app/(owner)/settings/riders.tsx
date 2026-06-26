/**
 * Owner — Rider management screen.
 *
 * Create, suspend, reactivate, and delete rider accounts.
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
// Rider row
// ---------------------------------------------------------------------------

function RiderRow({ rider, onSuspend, onReactivate, onDelete }: {
  rider:        User;
  onSuspend:    (u: User) => void;
  onReactivate: (u: User) => void;
  onDelete:     (u: User) => void;
}) {
  const isSuspended = rider.status === 'suspended';

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
          backgroundColor: isSuspended ? COLORS.surfaceAlt : COLORS.infoLight,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons
            name="bicycle-outline"
            size={20}
            color={isSuspended ? COLORS.muted : COLORS.info}
          />
        </View>

        {/* Info */}
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: FONT_SIZES.sm, fontWeight: '700',
            color: isSuspended ? COLORS.muted : COLORS.text,
          }}>
            {rider.name}
          </Text>
          <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginTop: 2 }}>
            {rider.phone}
          </Text>
        </View>

        {/* Status */}
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
            <Button label="Reactivate" variant="secondary" size="sm" onPress={() => onReactivate(rider)} fullWidth />
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <Button label="Suspend" variant="secondary" size="sm" onPress={() => onSuspend(rider)} fullWidth />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Button label="Delete" variant="danger" size="sm" onPress={() => onDelete(rider)} fullWidth />
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Create rider form
// ---------------------------------------------------------------------------

function CreateRiderForm({ onClose }: { onClose: () => void }) {
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
      await create({ name: name.trim(), phone: phone.trim(), role: 'rider' });
      if (Platform.OS !== 'web') {
        Alert.alert('Rider Added', `${name.trim()} has been registered as a rider.`);
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
      <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.text }}>New Rider</Text>

      <View>
        <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginBottom: 4 }}>Full Name</Text>
        <TextInput
          value={name}
          onChangeText={t => { setName(t); setErrors(e => ({ ...e, name: undefined })); }}
          placeholder="e.g. Ali Hassan"
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

      <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
        <View style={{ flex: 1 }}>
          <Button label="Cancel" onPress={onClose} variant="secondary" disabled={isPending} fullWidth size="md" />
        </View>
        <View style={{ flex: 1 }}>
          <Button label="Add Rider" onPress={handleSubmit} loading={isPending} fullWidth size="md" />
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function RidersScreen() {
  const [showForm, setShowForm] = useState(false);
  const { data: riders = [], isLoading } = useUsersByRole('rider');
  const { mutateAsync: doSuspend }    = useSuspendUser();
  const { mutateAsync: doReactivate } = useReactivateUser();
  const { mutateAsync: doDelete }     = useDeleteUser();

  async function handleSuspend(rider: User) {
    const msg = `Suspend ${rider.name}? They cannot be assigned new deliveries until reactivated.`;
    if (Platform.OS === 'web') {
      if (!window.confirm(msg)) return;
    } else {
      const ok = await new Promise<boolean>(resolve =>
        Alert.alert('Suspend Rider', msg, [
          { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
          { text: 'Suspend', onPress: () => resolve(true), style: 'destructive' },
        ])
      );
      if (!ok) return;
    }
    try { await doSuspend(rider.id); } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Something went wrong.');
    }
  }

  async function handleReactivate(rider: User) {
    try { await doReactivate(rider.id); } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Something went wrong.');
    }
  }

  async function handleDelete(rider: User) {
    const msg = `Delete ${rider.name}'s account permanently?`;
    if (Platform.OS === 'web') {
      if (!window.confirm(msg)) return;
    } else {
      const ok = await new Promise<boolean>(resolve =>
        Alert.alert('Delete Rider', msg, [
          { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
          { text: 'Delete', onPress: () => resolve(true), style: 'destructive' },
        ])
      );
      if (!ok) return;
    }
    try { await doDelete(rider.id); } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Something went wrong.');
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Riders', headerShown: true }} />
      <Screen padded={false}>
        {isLoading ? (
          <LoadingSpinner fullScreen />
        ) : (
          <FlatList
            data={riders}
            keyExtractor={r => String(r.id)}
            contentContainerStyle={{
              paddingHorizontal: SPACING.base,
              paddingVertical:   SPACING.base,
              paddingBottom:     SPACING['2xl'],
            }}
            ListHeaderComponent={
              <View style={{ marginBottom: SPACING.sm }}>
                {showForm ? (
                  <CreateRiderForm onClose={() => setShowForm(false)} />
                ) : (
                  <Button
                    label="+ Add Rider"
                    onPress={() => setShowForm(true)}
                    fullWidth
                  />
                )}
              </View>
            }
            ListEmptyComponent={
              !showForm ? (
                <EmptyState
                  emoji="🏍️"
                  title="No riders yet"
                  description="Tap 'Add Rider' to create the first rider account."
                />
              ) : null
            }
            renderItem={({ item }) => (
              <RiderRow
                rider={item}
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
