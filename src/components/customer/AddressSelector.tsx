/**
 * AddressSelector — shows an existing customer's saved delivery addresses
 * as a radio list, plus an "Enter new address" option with a text field.
 *
 * Used in the New Order wizard (Step 1) for existing customers.
 */

import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons }              from '@expo/vector-icons';

import { CustomerAddress }        from '@/types';
import { useCustomerAddresses }   from '@/hooks/useCustomer';
import { COLORS, FONT_SIZES, RADIUS, SPACING } from '@/lib/theme';

interface Props {
  customerId:          number;
  selectedAddressId:   number | null;
  showNew:             boolean;
  onSelectAddress:     (addr: CustomerAddress) => void;
  onShowNew:           () => void;
  newAddressText:      string;
  onNewAddressChange:  (v: string) => void;
  newAddressError?:    string;
}

export function AddressSelector({
  customerId, selectedAddressId, showNew,
  onSelectAddress, onShowNew,
  newAddressText, onNewAddressChange, newAddressError,
}: Props) {
  const { data: addresses = [], isLoading } = useCustomerAddresses(customerId);

  return (
    <View style={{ marginTop: SPACING.lg }}>
      <Text style={{ fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.muted, marginBottom: SPACING.sm }}>
        DELIVERY ADDRESS
      </Text>

      {isLoading ? (
        <ActivityIndicator size="small" color={COLORS.brand} />
      ) : (
        <>
          {/* Existing addresses */}
          {addresses.map(addr => {
            const selected = !showNew && selectedAddressId === addr.id;
            return (
              <AddressRow
                key={addr.id}
                label={addr.label ?? addr.address_text}
                sublabel={addr.label ? addr.address_text : undefined}
                selected={selected}
                onPress={() => onSelectAddress(addr)}
              />
            );
          })}

          {/* "Enter new address" option */}
          <AddressRow
            label="Enter new address"
            selected={showNew}
            onPress={onShowNew}
            icon="add-circle-outline"
          />

          {showNew && (
            <View style={{ marginTop: SPACING.sm }}>
              <TextInput
                value={newAddressText}
                onChangeText={onNewAddressChange}
                placeholder="e.g. House 12, Block B, DHA Phase 2, Karachi"
                placeholderTextColor={COLORS.muted}
                multiline
                style={{
                  borderWidth:       1,
                  borderColor:       newAddressError ? COLORS.danger : COLORS.border,
                  borderRadius:      RADIUS.md,
                  backgroundColor:   COLORS.surface,
                  padding:           SPACING.md,
                  fontSize:          FONT_SIZES.sm,
                  color:             COLORS.text,
                  minHeight:         80,
                  textAlignVertical: 'top',
                }}
              />
              {newAddressError && (
                <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.danger, marginTop: 4 }}>
                  {newAddressError}
                </Text>
              )}
              <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginTop: 4 }}>
                No coordinates — delivery fee will be confirmed by the manager.
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Local helper
// ---------------------------------------------------------------------------

function AddressRow({
  label, sublabel, selected, onPress, icon = 'location-outline',
}: {
  label:     string;
  sublabel?: string;
  selected:  boolean;
  onPress:   () => void;
  icon?:     React.ComponentProps<typeof Ionicons>['name'];
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection:   'row',
        alignItems:      'center',
        padding:         SPACING.md,
        borderRadius:    RADIUS.md,
        borderWidth:     1,
        borderColor:     selected ? COLORS.brand : COLORS.border,
        backgroundColor: selected ? COLORS.brandLight : COLORS.surface,
        marginBottom:    SPACING.xs,
        gap:             SPACING.md,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Ionicons
        name={selected ? 'radio-button-on' : 'radio-button-off'}
        size={20}
        color={selected ? COLORS.brand : COLORS.muted}
      />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: selected ? '700' : '400', color: selected ? COLORS.brand : COLORS.text }}>
          {label}
        </Text>
        {sublabel && (
          <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginTop: 2 }}>
            {sublabel}
          </Text>
        )}
      </View>
    </Pressable>
  );
}
