import { Pressable, Text, View } from 'react-native';
import { Ionicons }              from '@expo/vector-icons';
import { PaymentMethod }         from '@/types';
import { COLORS, FONT_SIZES, RADIUS, SPACING } from '@/lib/theme';

interface Props {
  value:    PaymentMethod;
  onChange: (v: PaymentMethod) => void;
  disabled?: boolean;
}

const OPTIONS: {
  value:  PaymentMethod;
  label:  string;
  icon:   React.ComponentProps<typeof Ionicons>['name'];
  desc:   string;
}[] = [
  {
    value: 'cod',
    label: 'Cash on Delivery',
    icon:  'cash-outline',
    desc:  'Customer pays in cash when the order is delivered',
  },
  {
    value: 'prepaid',
    label: 'Prepaid',
    icon:  'receipt-outline',
    desc:  'Attach a bank transfer / EasyPaisa / JazzCash receipt',
  },
];

export function PaymentMethodSelector({ value, onChange, disabled }: Props) {
  return (
    <View style={{ gap: SPACING.sm }}>
      {OPTIONS.map(opt => {
        const active = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => !disabled && onChange(opt.value)}
            style={({ pressed }) => ({
              flexDirection:   'row',
              alignItems:      'center',
              gap:             SPACING.md,
              padding:         SPACING.md,
              borderRadius:    RADIUS.md,
              borderWidth:     2,
              borderColor:     active ? COLORS.brand : COLORS.border,
              backgroundColor: active ? COLORS.brandLight : COLORS.surface,
              opacity:         pressed || disabled ? 0.7 : 1,
            })}
          >
            <View style={{
              width:           38,
              height:          38,
              borderRadius:    19,
              backgroundColor: active ? COLORS.brand : COLORS.surfaceAlt,
              alignItems:      'center',
              justifyContent:  'center',
            }}>
              <Ionicons name={opt.icon} size={18} color={active ? '#fff' : COLORS.muted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize:   FONT_SIZES.sm,
                fontWeight: '600',
                color:      active ? COLORS.brand : COLORS.text,
              }}>
                {opt.label}
              </Text>
              <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginTop: 2 }}>
                {opt.desc}
              </Text>
            </View>
            {active && <Ionicons name="checkmark-circle" size={20} color={COLORS.brand} />}
          </Pressable>
        );
      })}
    </View>
  );
}
