import { Pressable, ScrollView, Text, View } from 'react-native';
import { router, Stack }   from 'expo-router';
import { Ionicons }        from '@expo/vector-icons';

import { Screen }          from '@/components/ui/Screen';
import { LoadingSpinner }  from '@/components/ui/LoadingSpinner';
import { EmptyState }      from '@/components/ui/EmptyState';
import { BandRow }         from '@/components/delivery/BandRow';
import { useDeliveryOrigin, useDeliveryBands } from '@/hooks/useDeliveryBands';
import { useRiders }       from '@/hooks/useRiders';
import {
  COLORS, FONT_SIZES, RADIUS, SHADOW, SPACING,
} from '@/lib/theme';

function SectionHeader({ title, style }: { title: string; style?: object }) {
  return (
    <Text style={[{
      fontSize:      FONT_SIZES.xs,
      fontWeight:    '700',
      color:         COLORS.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom:  SPACING.sm,
    }, style]}>
      {title}
    </Text>
  );
}

function NavCard({
  icon, title, subtitle, onPress,
}: { icon: string; title: string; subtitle: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection:   'row',
        alignItems:      'center',
        backgroundColor: COLORS.surface,
        borderRadius:    RADIUS.md,
        borderWidth:     1,
        borderColor:     COLORS.border,
        padding:         SPACING.base,
        marginBottom:    SPACING.sm,
        opacity:         pressed ? 0.85 : 1,
        ...SHADOW.sm,
      })}
    >
      <View style={{
        width:           40, height: 40,
        borderRadius:    RADIUS.md,
        backgroundColor: COLORS.brandLight,
        alignItems:      'center',
        justifyContent:  'center',
        marginRight:     SPACING.md,
      }}>
        <Ionicons name={icon as any} size={20} color={COLORS.brand} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: FONT_SIZES.base, fontWeight: '700', color: COLORS.text }}>
          {title}
        </Text>
        <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.muted, marginTop: 2 }}>
          {subtitle}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={COLORS.border} />
    </Pressable>
  );
}

export default function OwnerSettingsScreen() {
  const { data: origin, isLoading: loadingOrigin } = useDeliveryOrigin();
  const { data: bands  = [], isLoading: loadingBands  } = useDeliveryBands();
  const { data: riders = [], isLoading: loadingRiders } = useRiders();

  if (loadingOrigin || loadingBands || loadingRiders) return <LoadingSpinner fullScreen />;

  return (
    <>
    <Stack.Screen options={{ title: 'Settings', headerShown: true }} />
    <Screen scrollable={false} padded={false}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: SPACING.base,
          paddingBottom:     SPACING['2xl'],
          paddingTop:        SPACING.base,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Team ── */}
        <SectionHeader title="Team" />
        <NavCard
          icon="people-circle-outline"
          title="Managers"
          subtitle="Create, suspend, delete managers and configure their permissions"
          onPress={() => router.push('/(owner)/settings/managers' as any)}
        />
        <NavCard
          icon="person-outline"
          title="Agents"
          subtitle="Create, suspend, and delete agent accounts"
          onPress={() => router.push('/(owner)/settings/agents' as any)}
        />
        <NavCard
          icon="bicycle-outline"
          title="Riders"
          subtitle={`${riders.length} active rider${riders.length !== 1 ? 's' : ''} · manage accounts`}
          onPress={() => router.push('/(owner)/settings/riders' as any)}
        />

        {/* ── Delivery Origin ── */}
        <SectionHeader title="Delivery" style={{ marginTop: SPACING.md }} />
        {origin ? (
          <Pressable
            onPress={() => router.push('/modals/origin-edit')}
            style={({ pressed }) => ({
              backgroundColor: COLORS.surface,
              borderRadius:    RADIUS.md,
              borderWidth:     1,
              borderColor:     COLORS.border,
              padding:         SPACING.base,
              marginBottom:    SPACING.xl,
              opacity:         pressed ? 0.85 : 1,
              ...SHADOW.sm,
            })}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <View style={{
                width: 40, height: 40,
                borderRadius:    RADIUS.md,
                backgroundColor: COLORS.brandLight,
                alignItems:      'center',
                justifyContent:  'center',
                marginRight:     SPACING.md,
              }}>
                <Ionicons name="location-outline" size={20} color={COLORS.brand} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: FONT_SIZES.base, fontWeight: '700', color: COLORS.text }}>
                  {origin.label}
                </Text>
                <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.muted, marginTop: 3 }}>
                  {origin.latitude.toFixed(4)}°N · {origin.longitude.toFixed(4)}°E
                </Text>
                <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.brand, marginTop: 6, fontWeight: '600' }}>
                  Tap to edit
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.border} />
            </View>
          </Pressable>
        ) : (
          <EmptyState emoji="📍" title="No origin configured" description="Contact support." />
        )}

        {/* ── Delivery Bands ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm }}>
          <SectionHeader title="Delivery Bands" style={{ marginBottom: 0 }} />
          <Pressable
            onPress={() => router.push('/modals/band-new')}
            style={({ pressed }) => ({
              flexDirection:     'row',
              alignItems:        'center',
              gap:               4,
              backgroundColor:   COLORS.brand,
              paddingHorizontal: 12,
              paddingVertical:   6,
              borderRadius:      RADIUS.full,
              opacity:           pressed ? 0.85 : 1,
            })}
          >
            <Ionicons name="add" size={15} color="#fff" />
            <Text style={{ color: '#fff', fontSize: FONT_SIZES.xs, fontWeight: '700' }}>New Band</Text>
          </Pressable>
        </View>

        {bands.length === 0 ? (
          <EmptyState
            emoji="🗺️"
            title="No delivery bands yet"
            description="Add at least one band to define the delivery coverage and fees."
            action={{ label: 'Add Band', onPress: () => router.push('/modals/band-new') }}
          />
        ) : (
          <View style={{ marginTop: SPACING.sm }}>
            {bands.map(band => (
              <BandRow
                key={band.id}
                band={band}
                onPress={() =>
                  router.push({ pathname: '/modals/band-edit', params: { id: String(band.id) } })
                }
              />
            ))}
            <View style={{
              marginTop:       SPACING.sm,
              padding:         SPACING.md,
              backgroundColor: COLORS.surfaceAlt,
              borderRadius:    RADIUS.md,
            }}>
              <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, textAlign: 'center' }}>
                {bands.length} band{bands.length !== 1 ? 's' : ''} · distances measured from the delivery origin
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </Screen>
    </>
  );
}
