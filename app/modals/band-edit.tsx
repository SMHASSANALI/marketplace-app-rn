/**
 * Edit Delivery Band modal — Owner only.
 *
 * Receives band ID as route param (?id=2).
 * Pre-fills the form with existing values; allows editing all fields
 * and deactivating (removing) the band.
 */

import { router, useLocalSearchParams } from 'expo-router';

import { Screen }          from '@/components/ui/Screen';
import { LoadingSpinner }  from '@/components/ui/LoadingSpinner';
import { EmptyState }      from '@/components/ui/EmptyState';
import { BandForm }        from '@/components/delivery/BandForm';
import type { ValidatedBandValues } from '@/components/delivery/BandForm';
import {
  useDeliveryBands,
  useUpdateBand,
} from '@/hooks/useDeliveryBands';
import { useAuthContext }  from '@/context/AuthContext';

export default function BandEditModal() {
  const { user }                     = useAuthContext();
  const { id }                       = useLocalSearchParams<{ id: string }>();
  const bandId                       = parseInt(id ?? '0', 10);
  const { data: bands = [], isLoading } = useDeliveryBands();
  const { mutateAsync: update }      = useUpdateBand();

  if (user?.role !== 'owner') { router.back(); return null; }
  if (isLoading) return <LoadingSpinner fullScreen />;

  const band = bands.find(b => b.id === bandId);
  if (!band) {
    return (
      <Screen>
        <EmptyState emoji="❓" title="Band not found" />
      </Screen>
    );
  }

  async function handleSubmit(values: ValidatedBandValues) {
    await update({ id: bandId, input: values });
    router.back();
  }

  async function handleDeactivate() {
    await update({ id: bandId, input: { is_active: false } });
    router.back();
  }

  return (
    <Screen scrollable={false} padded={false}>
      <BandForm
        initialValues={{
          name:                 band.name,
          min_distance_km:      String(band.min_distance_km),
          max_distance_km:      band.max_distance_km != null ? String(band.max_distance_km) : '',
          delivery_fee:         String(band.delivery_fee),
          default_rider_payout: String(band.default_rider_payout),
        }}
        submitLabel="Save Changes"
        onSubmit={handleSubmit}
        onDeactivate={handleDeactivate}
      />
    </Screen>
  );
}
