/**
 * Owner — Rider management screen.
 *
 * Create, suspend, reactivate, and delete rider accounts.
 */

import React, { useState }                                    from 'react';
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
// Reusable field helpers (same pattern as agents.tsx)
// ---------------------------------------------------------------------------

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View>
      <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginBottom: 4 }}>{label}</Text>
      {children}
    </View>
  );
}

function Field({ value, onChangeText, placeholder, error, keyboardType = 'default' }: {
  value: string; onChangeText: (t: string) => void; placeholder?: string;
  error?: string; keyboardType?: any;
}) {
  return (
    <>
      <TextInput
        value={value} onChangeText={onChangeText} placeholder={placeholder}
        placeholderTextColor={COLORS.muted} keyboardType={keyboardType}
        style={{
          borderWidth: 1, borderRadius: RADIUS.sm, padding: SPACING.sm,
          fontSize: FONT_SIZES.sm, color: COLORS.text, backgroundColor: COLORS.bg,
          borderColor: error ? COLORS.danger : COLORS.border,
        }}
      />
      {error ? <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.danger, marginTop: 2 }}>{error}</Text> : null}
    </>
  );
}

// ---------------------------------------------------------------------------
// Create rider form
// ---------------------------------------------------------------------------

function CreateRiderForm({ onClose }: { onClose: () => void }) {
  const [name,          setName]          = useState('');
  const [phone,         setPhone]         = useState('');
  const [address,       setAddress]       = useState('');
  const [cnic,          setCnic]          = useState('');
  const [secondContact, setSecondContact] = useState('');
  const [startDate,     setStartDate]     = useState('');
  const [endDate,       setEndDate]       = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { mutateAsync: create, isPending } = useCreateUser();

  async function handleSubmit() {
    const e: Record<string, string> = {};
    if (!name.trim())  e.name  = 'Name is required.';
    if (!phone.trim()) e.phone = 'Mobile number is required.';
    if (cnic.trim() && !/^\d{13}$/.test(cnic.trim())) e.cnic = 'CNIC must be 13 digits.';
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    try {
      await create({
        name: name.trim(), phone: phone.trim(), role: 'rider',
        address: address.trim() || undefined,
        cnic: cnic.trim() || undefined,
        second_contact: secondContact.trim() || undefined,
        start_date: startDate.trim() || undefined,
        end_date: endDate.trim() || undefined,
      });
      if (Platform.OS !== 'web') Alert.alert('Rider Added', `${name.trim()} has been registered as a rider.`);
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

      <FieldRow label="Full Name *">
        <Field value={name} onChangeText={t => { setName(t); setErrors(e => ({ ...e, name: '' })); }}
          placeholder="e.g. Ali Hassan" error={errors.name} />
      </FieldRow>
      <FieldRow label="Mobile Number *">
        <Field value={phone} onChangeText={t => { setPhone(t); setErrors(e => ({ ...e, phone: '' })); }}
          placeholder="03XXXXXXXXX" error={errors.phone} keyboardType="phone-pad" />
      </FieldRow>
      <FieldRow label="Address">
        <Field value={address} onChangeText={setAddress} placeholder="Street / Area" />
      </FieldRow>
      <FieldRow label="CNIC (13 digits)">
        <Field value={cnic} onChangeText={t => { setCnic(t); setErrors(e => ({ ...e, cnic: '' })); }}
          placeholder="4220112345671" error={errors.cnic} keyboardType="numeric" />
      </FieldRow>
      <FieldRow label="Second Contact">
        <Field value={secondContact} onChangeText={setSecondContact}
          placeholder="03XXXXXXXXX (optional)" keyboardType="phone-pad" />
      </FieldRow>
      <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
        <View style={{ flex: 1 }}>
          <FieldRow label="Start Date">
            <Field value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" />
          </FieldRow>
        </View>
        <View style={{ flex: 1 }}>
          <FieldRow label="End Date (validity)">
            <Field value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DD or blank" />
          </FieldRow>
        </View>
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
