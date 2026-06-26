/**
 * Product query and mutation hooks (TanStack Query v5).
 *
 * All data access goes through the service layer — swap the service
 * implementation for real API calls without touching these hooks.
 *
 * Query key factory keeps invalidation targeted:
 *   productKeys.all()      → invalidates every product query
 *   productKeys.list(f)    → invalidates a specific filtered list
 *   productKeys.detail(id) → invalidates a single product cache
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as productsService from '@/services/products.service';
import type {
  CreateProductInput,
  GetProductsFilter,
  UpdateProductInput,
} from '@/services/products.service';

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const productKeys = {
  all:      ()           => ['products']                      as const,
  lists:    ()           => ['products', 'list']              as const,
  list:     (f?: GetProductsFilter) => ['products', 'list', f ?? {}] as const,
  detail:   (id: number) => ['products', 'detail', id]        as const,
  lowStock: ()           => ['products', 'low-stock']         as const,
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** Fetches the product catalog; respects the activeOnly / search / category filter. */
export function useProducts(filter?: GetProductsFilter) {
  return useQuery({
    queryKey: productKeys.list(filter),
    queryFn:  () => productsService.getProducts(filter),
  });
}

/** Fetches a single product by ID. Disabled when id is 0 or negative. */
export function useProduct(id: number) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn:  () => productsService.getProductById(id),
    enabled:  id > 0,
  });
}

/** Fetches all active products where qty_available <= low_stock_threshold. */
export function useLowStockProducts() {
  return useQuery({
    queryKey: productKeys.lowStock(),
    queryFn:  productsService.getLowStockProducts,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/** Creates a new product; invalidates all product queries on success. */
export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProductInput) => productsService.createProduct(input),
    onSuccess:  () => qc.invalidateQueries({ queryKey: productKeys.all() }),
  });
}

/** Updates an existing product; invalidates all product queries on success. */
export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateProductInput }) =>
      productsService.updateProduct(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all() }),
  });
}

/** Soft-deletes (deactivates) a product; invalidates all product queries on success. */
export function useDeactivateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => productsService.deactivateProduct(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: productKeys.all() }),
  });
}
