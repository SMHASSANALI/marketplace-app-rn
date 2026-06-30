/**
 * New Delivery Band modal — Owner only.
 *
 * Auto-assigns sort_order as (current max + 1) so the new band
 * lands at the end of the list by default.
 */

import { Pressable }      from 'react-native';
import { router, Stack }  from 'expo-router';
import { Ionicons }       from '@expo/vector-icons';
import { Screen }         from '@/components/ui/Screen';
import { BandForm }       from '@/components/delivery/BandForm';
import type { ValidatedBandValues } from '@/components/delivery/BandForm';
import { useCreateBand, useDeliveryBands } from '@/hooks/useDeliveryBands';
import { useAuthContext } from '@/context/AuthContext';
import { COLORS }         from '@/lib/theme';

export default function BandNewModal() {
  const { user }                 = useAuthContext();
  const { data: bands = [] }     = useDeliveryBands();
  const { mutateAsync: create }  = useCreateBand();

  if (user?.role !== 'owner') { router.back(); return null; }

  async function handleSubmit(values: ValidatedBandValues) {
    const nextOrder =
      bands.length > 0 ? Math.max(...bands.map(b => b.sort_order)) + 1 : 1;

    await create({
      ...values,
      is_active:  true,
      sort_order: nextOrder,
    });
    router.back();
  }

  return (
    <>
      <Stack.Screen options={{
        title: 'New Delivery Band', headerShown: true,
        headerRight: () => (
          <Pressable onPress={() => router.back()} hitSlop={8} style={{ marginRight: 4 }}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </Pressable>
        ),
      }} />
      <Screen scrollable={false} padded={false}>
        <BandForm submitLabel="Create Band" onSubmit={handleSubmit} />
      </Screen>
    </>
  );
}
