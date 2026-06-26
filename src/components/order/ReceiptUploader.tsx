import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Ionicons }          from '@expo/vector-icons';
import * as ImagePicker      from 'expo-image-picker';
import { COLORS, FONT_SIZES, RADIUS, SPACING } from '@/lib/theme';

interface Props {
  /** Currently attached file name, or null if nothing picked yet. */
  fileName: string | null;
  /** Called with the picked file name. */
  onPicked: (fileName: string) => void;
  /** Shows a spinner overlay while the order is being submitted. */
  uploading?: boolean;
  disabled?: boolean;
}

export function ReceiptUploader({ fileName, onPicked, uploading, disabled }: Props) {
  async function handlePick() {
    if (disabled || uploading) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: false,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const name  = asset.fileName ?? `receipt_${Date.now()}.jpg`;
    onPicked(name);
  }

  // ── Uploading state ─────────────────────────────────────────────────────────
  if (uploading) {
    return (
      <View style={{
        flexDirection:   'row',
        alignItems:      'center',
        gap:             SPACING.sm,
        padding:         SPACING.md,
        borderRadius:    RADIUS.md,
        backgroundColor: COLORS.infoLight,
        borderWidth:     1,
        borderColor:     COLORS.info,
      }}>
        <ActivityIndicator size="small" color={COLORS.info} />
        <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.info, fontWeight: '600' }}>
          Attaching receipt to order…
        </Text>
      </View>
    );
  }

  // ── File attached ───────────────────────────────────────────────────────────
  if (fileName) {
    return (
      <View style={{
        flexDirection:   'row',
        alignItems:      'center',
        gap:             SPACING.sm,
        padding:         SPACING.md,
        borderRadius:    RADIUS.md,
        backgroundColor: COLORS.successLight,
        borderWidth:     1,
        borderColor:     COLORS.success,
      }}>
        <Ionicons name="document-attach" size={20} color={COLORS.success} />
        <Text
          numberOfLines={1}
          style={{ flex: 1, fontSize: FONT_SIZES.sm, color: COLORS.success, fontWeight: '600' }}
        >
          {fileName}
        </Text>
        {!disabled && (
          <Pressable onPress={handlePick} hitSlop={8}>
            <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.brand, fontWeight: '700' }}>
              Change
            </Text>
          </Pressable>
        )}
      </View>
    );
  }

  // ── Empty / pick prompt ─────────────────────────────────────────────────────
  return (
    <Pressable
      onPress={handlePick}
      disabled={disabled}
      style={({ pressed }) => ({
        flexDirection:   'row',
        alignItems:      'center',
        justifyContent:  'center',
        gap:             SPACING.sm,
        padding:         SPACING.lg,
        borderRadius:    RADIUS.md,
        borderWidth:     1,
        borderColor:     COLORS.borderStrong,
        backgroundColor: COLORS.surfaceAlt,
        opacity:         pressed || disabled ? 0.6 : 1,
      })}
    >
      <Ionicons name="cloud-upload-outline" size={22} color={COLORS.muted} />
      <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.muted, fontWeight: '600' }}>
        Attach Receipt (image)
      </Text>
    </Pressable>
  );
}
