/**
 * New Delivery Band modal — Owner only.
 *
 * Auto-assigns sort_order as (current max + 1) so the new band
 * lands at the end of the list by default.
 */

import { router }         from 'expo-router';
import { Screen }         from '@/components/ui/Screen';
import { BandForm }       from '@/components/delivery/BandForm';
import type { ValidatedBandValues } from '@/components/delivery/BandForm';
import { useCreateBand, useDeliveryBands } from '@/hooks/useDeliveryBands';
import { useAuthContext } from '@/context/AuthContext';

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
    <Screen scrollable={false} padded={false}>
      <BandForm submitLabel="Create Band" onSubmit={handleSubmit} />
    </Screen>
  );
}
