import { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { Stack }              from 'expo-router';
import { Ionicons }           from '@expo/vector-icons';

import { Screen }          from '@/components/ui/Screen';
import { Button }          from '@/components/ui/Button';
import { LoadingSpinner }  from '@/components/ui/LoadingSpinner';
import { EmptyState }      from '@/components/ui/EmptyState';
import { useAuthContext }  from '@/context/AuthContext';
import { useManagers, useUpdateManagerPermissions } from '@/hooks/useManagers';
import { useCreateUser, useSuspendUser, useReactivateUser, useDeleteUser } from '@/hooks/useUsers';
import { ManagerPermissionKey, User } from '@/types';
import {
  COLORS, FONT_SIZES, RADIUS, SHADOW, SPACING,
} from '@/lib/theme';

// ---------------------------------------------------------------------------
// Permission metadata
// ---------------------------------------------------------------------------

const ALL_PERMISSIONS: { key: ManagerPermissionKey; label: string; description: string }[] = [
  { key: 'confirm_orders',       label: 'Confirm Orders',        description: 'Approve pending orders and move them to Confirmed' },
  { key: 'assign_riders',        label: 'Assign Riders',         description: 'Assign delivery riders to confirmed orders' },
  { key: 'verify_receipts',      label: 'Verify Receipts',       description: 'Verify or reject prepaid payment receipts' },
  { key: 'confirm_deposits',     label: 'Confirm Deposits',      description: 'Confirm that rider cash deposits have been received' },
  { key: 'approve_settlements',  label: 'Approve Settlements',   description: 'Approve agent commission settlements before payment' },
  { key: 'view_customer_history',label: 'View Customer History', description: 'Access customer order history across all agents' },
];

// ---------------------------------------------------------------------------
// Permission toggle row
// ---------------------------------------------------------------------------

function PermRow({
  label, description, value, onChange,
}: {
  label:       string;
  description: string;
  value:       boolean;
  onChange:    (v: boolean) => void;
}) {
  return (
    <View style={{
      flexDirection:  'row',
      alignItems:     'center',
      paddingVertical: SPACING.sm,
      gap:             SPACING.md,
    }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.text }}>
          {label}
        </Text>
        <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginTop: 2 }}>
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: COLORS.border, true: COLORS.brand + '80' }}
        thumbColor={value ? COLORS.brand : COLORS.muted}
      />
    </View>
  );
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: COLORS.border }} />;
}

// ---------------------------------------------------------------------------
// Per-manager card
// ---------------------------------------------------------------------------

function ManagerCard({
  name, userId, status, initialPerms, grantedBy, onSuspend, onReactivate, onDelete,
}: {
  name:          string;
  userId:        number;
  status:        'active' | 'suspended';
  initialPerms:  ManagerPermissionKey[];
  grantedBy:     number;
  onSuspend:     (id: number, name: string) => void;
  onReactivate:  (id: number) => void;
  onDelete:      (id: number, name: string) => void;
}) {
  const [perms,   setPerms]   = useState<Set<ManagerPermissionKey>>(new Set(initialPerms));
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [dirty,   setDirty]   = useState(false);

  const { mutateAsync: doUpdate } = useUpdateManagerPermissions();

  useEffect(() => {
    setPerms(new Set(initialPerms));
    setDirty(false);
  }, [initialPerms.join(',')]);

  function toggle(key: ManagerPermissionKey) {
    setPerms(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
    setDirty(true);
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    try {
      await doUpdate({ managerId: userId, keys: [...perms], grantedBy });
      setDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  const grantedCount = perms.size;

  return (
    <View style={{
      backgroundColor: COLORS.surface,
      borderRadius:    RADIUS.md,
      borderWidth:     1,
      borderColor:     COLORS.border,
      overflow:        'hidden',
      ...SHADOW.sm,
    }}>
      {/* Header */}
      <View style={{
        flexDirection:  'row',
        alignItems:     'center',
        gap:            SPACING.md,
        padding:        SPACING.md,
        backgroundColor: COLORS.surfaceAlt,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
      }}>
        <View style={{
          width:           40, height: 40,
          borderRadius:    20,
          backgroundColor: status === 'suspended' ? COLORS.surfaceAlt : COLORS.teal + '20',
          alignItems:      'center',
          justifyContent:  'center',
        }}>
          <Ionicons name="person-circle-outline" size={24} color={status === 'suspended' ? COLORS.muted : COLORS.teal} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: FONT_SIZES.base, fontWeight: '700', color: status === 'suspended' ? COLORS.muted : COLORS.text }}>
            {name}
          </Text>
          <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted }}>
            {status === 'suspended' ? 'Suspended' : `${grantedCount} of ${ALL_PERMISSIONS.length} permissions`}
          </Text>
        </View>
        <View style={{
          backgroundColor: status === 'suspended' ? COLORS.surfaceAlt : COLORS.teal + '20',
          borderRadius: RADIUS.sm, paddingHorizontal: 8, paddingVertical: 3,
        }}>
          <Text style={{ fontSize: FONT_SIZES.xs, fontWeight: '600', color: status === 'suspended' ? COLORS.muted : COLORS.teal }}>
            {status === 'suspended' ? 'Suspended' : 'Active'}
          </Text>
        </View>
      </View>

      {/* Permission toggles */}
      <View style={{ paddingHorizontal: SPACING.md }}>
        {ALL_PERMISSIONS.map((p, i) => (
          <View key={p.key}>
            <PermRow
              label={p.label}
              description={p.description}
              value={perms.has(p.key)}
              onChange={() => toggle(p.key)}
            />
            {i < ALL_PERMISSIONS.length - 1 && <Divider />}
          </View>
        ))}
      </View>

      {/* Save strip */}
      {status === 'active' && (
        <View style={{
          padding:         SPACING.md,
          borderTopWidth:  1,
          borderTopColor:  COLORS.border,
          gap:             SPACING.xs,
        }}>
          {saved && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="checkmark-circle" size={14} color={COLORS.teal} />
              <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.teal }}>Permissions saved</Text>
            </View>
          )}
          <Button
            label="Save Permissions"
            onPress={save}
            loading={saving}
            disabled={!dirty}
            fullWidth
            size="md"
          />
        </View>
      )}

      {/* Account controls */}
      <View style={{
        flexDirection: 'row', gap: SPACING.xs,
        padding: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border,
      }}>
        {status === 'suspended' ? (
          <View style={{ flex: 1 }}>
            <Button label="Reactivate" variant="secondary" size="sm" onPress={() => onReactivate(userId)} fullWidth />
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <Button label="Suspend" variant="secondary" size="sm" onPress={() => onSuspend(userId, name)} fullWidth />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Button label="Delete" variant="danger" size="sm" onPress={() => onDelete(userId, name)} fullWidth />
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Create manager form
// ---------------------------------------------------------------------------

function CreateManagerForm({ onClose }: { onClose: () => void }) {
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
      await create({ name: name.trim(), phone: phone.trim(), role: 'manager' });
      if (Platform.OS !== 'web') {
        Alert.alert('Manager Added', `${name.trim()} can now log in as a manager.`);
      }
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Something went wrong.');
    }
  }

  return (
    <View style={{
      backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
      borderWidth: 1, borderColor: COLORS.teal,
      padding: SPACING.md, marginBottom: SPACING.md, gap: SPACING.sm, ...SHADOW.sm,
    }}>
      <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.text }}>New Manager</Text>

      <View>
        <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginBottom: 4 }}>Full Name</Text>
        <TextInput
          value={name}
          onChangeText={t => { setName(t); setErrors(e => ({ ...e, name: undefined })); }}
          placeholder="e.g. Sara Khan"
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
          <Button label="Add Manager" onPress={handleSubmit} loading={isPending} fullWidth size="md" />
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ManagersScreen() {
  const { user }                      = useAuthContext();
  const { data: managers = [], isLoading } = useManagers();
  const [showForm, setShowForm]       = useState(false);
  const { mutateAsync: doSuspend }    = useSuspendUser();
  const { mutateAsync: doReactivate } = useReactivateUser();
  const { mutateAsync: doDelete }     = useDeleteUser();

  async function handleSuspend(id: number, name: string) {
    const msg = `Suspend ${name}? They will not be able to log in until reactivated.`;
    if (Platform.OS === 'web') {
      if (!window.confirm(msg)) return;
    } else {
      const ok = await new Promise<boolean>(resolve =>
        Alert.alert('Suspend Manager', msg, [
          { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
          { text: 'Suspend', onPress: () => resolve(true), style: 'destructive' },
        ])
      );
      if (!ok) return;
    }
    try { await doSuspend(id); } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Something went wrong.');
    }
  }

  async function handleReactivate(id: number) {
    try { await doReactivate(id); } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Something went wrong.');
    }
  }

  async function handleDelete(id: number, name: string) {
    const msg = `Delete ${name}'s account permanently? This cannot be undone.`;
    if (Platform.OS === 'web') {
      if (!window.confirm(msg)) return;
    } else {
      const ok = await new Promise<boolean>(resolve =>
        Alert.alert('Delete Manager', msg, [
          { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
          { text: 'Delete', onPress: () => resolve(true), style: 'destructive' },
        ])
      );
      if (!ok) return;
    }
    try { await doDelete(id); } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Something went wrong.');
    }
  }

  if (isLoading) return <LoadingSpinner fullScreen message="Loading managers…" />;

  return (
    <>
      <Stack.Screen options={{ title: 'Managers', headerShown: true }} />
      <Screen scrollable={false} padded={false}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: SPACING.base,
          paddingVertical:   SPACING.base,
          paddingBottom:     SPACING['2xl'],
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Create form or button */}
        <View style={{ marginBottom: SPACING.md }}>
          {showForm ? (
            <CreateManagerForm onClose={() => setShowForm(false)} />
          ) : (
            <Button label="+ Add Manager" onPress={() => setShowForm(true)} fullWidth />
          )}
        </View>

        {managers.length === 0 && !showForm ? (
          <EmptyState emoji="👤" title="No managers" description="Tap 'Add Manager' to create the first manager account." />
        ) : (
          managers.map(m => (
            <View key={m.user.id} style={{ marginBottom: SPACING.md }}>
              <ManagerCard
                name={m.user.name}
                userId={m.user.id}
                status={m.user.status}
                initialPerms={m.permissions}
                grantedBy={user?.id ?? 0}
                onSuspend={handleSuspend}
                onReactivate={handleReactivate}
                onDelete={handleDelete}
              />
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
    </>
  );
}
