/**
 * New Product modal — Owner only.
 *
 * Accessible from the Products tab via the "New" button.
 * On success, navigates back and the products list refetches via TanStack Query
 * invalidation triggered by useCreateProduct.
 */

import { Alert }                 from 'react-native';
import { router }                from 'expo-router';
import { Screen }                from '@/components/ui/Screen';
import { ProductForm }           from '@/components/products/ProductForm';
import type { ValidatedProductValues } from '@/components/products/ProductForm';
import { useCreateProduct }      from '@/hooks/useProducts';
import { useAuthContext }        from '@/context/AuthContext';

export default function ProductNewModal() {
  const { user }                  = useAuthContext();
  const { mutateAsync: create }   = useCreateProduct();

  // Guard — this modal should only be reachable by the Owner but double-check
  if (user?.role !== 'owner') {
    router.back();
    return null;
  }

  async function handleSubmit(values: ValidatedProductValues) {
    await create({ ...values, owner_id: user!.id, images: [] });
    router.back();
  }

  return (
    <Screen scrollable={false} padded={false}>
      <ProductForm
        submitLabel="Create Product"
        onSubmit={handleSubmit}
      />
    </Screen>
  );
}
