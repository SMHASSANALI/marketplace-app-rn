/**
 * PartialFulfillmentModal — confirmation dialog shown when one or more
 * cart items have insufficient stock to fulfil the requested quantity.
 *
 * The agent must confirm before the order proceeds with the remaining items.
 * Items with zero fulfillable quantity will be excluded; items with partial
 * stock are still flagged here since the service may exclude them too.
 */

import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons }  from '@expo/vector-icons';
import { COLORS, FONT_SIZES, RADIUS, SPACING } from '@/lib/theme';

export interface ExcludedItemPreview {
  productName:  string;
  productEmoji: string;
  reason:       string;
}

interface Props {
  visible:    boolean;
  items:      ExcludedItemPreview[];
  onConfirm:  () => void;
  onCancel:   () => void;
}

export function PartialFulfillmentModal({ visible, items, onConfirm, onCancel }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
        onPress={onCancel}
      >
        {/* Panel — prevent backdrop press closing via inner press */}
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: COLORS.bg,
            borderTopLeftRadius:  RADIUS.xl,
            borderTopRightRadius: RADIUS.xl,
            padding:              SPACING.lg,
            maxHeight:            '70%',
          }}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md }}>
            <Ionicons name="warning" size={22} color={COLORS.warning} />
            <Text style={{ fontSize: FONT_SIZES.lg, fontWeight: '800', color: COLORS.text, flex: 1 }}>
              Some Items Have Low Stock
            </Text>
          </View>

          <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.muted, marginBottom: SPACING.md, lineHeight: 20 }}>
            The following items may be excluded or partially fulfilled. The order will proceed with whatever is available.
          </Text>

          {/* Excluded list */}
          <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
            {items.map((item, i) => (
              <View
                key={i}
                style={{
                  flexDirection:   'row',
                  alignItems:      'flex-start',
                  gap:             SPACING.sm,
                  paddingVertical: SPACING.sm,
                  borderBottomWidth: i < items.length - 1 ? 1 : 0,
                  borderBottomColor: COLORS.border,
                }}
              >
                <Text style={{ fontSize: 18 }}>{item.productEmoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.text }}>
                    {item.productName}
                  </Text>
                  <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.warning, marginTop: 2 }}>
                    {item.reason}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Actions */}
          <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.lg }}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => ({
                flex:            1,
                paddingVertical: 12,
                borderRadius:    RADIUS.md,
                borderWidth:     1,
                borderColor:     COLORS.border,
                alignItems:      'center',
                opacity: pressed ? 0.75 : 1,
              })}
            >
              <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.text }}>
                Go Back
              </Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => ({
                flex:            1,
                paddingVertical: 12,
                borderRadius:    RADIUS.md,
                backgroundColor: COLORS.warning,
                alignItems:      'center',
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: '#fff' }}>
                Continue Anyway
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
