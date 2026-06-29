/**
 * Products service.
 *
 * Handles all product catalog and inventory operations.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * BACKEND INTEGRATION
 * Replace mock implementations with real API calls. Signatures must not change.
 * ─────────────────────────────────────────────────────────────────────────
 */

import { ApiError, Product }  from '@/types';
import { db, nextId, now }    from '@/mock/db';
import { simulateDelay }      from '@/mock/delay';

/** Filters accepted by getProducts(). */
export interface GetProductsFilter {
  activeOnly?: boolean;
  category?:  string;
  search?:    string;
}

/**
 * Returns the product catalog, optionally filtered.
 *
 * Agents see only active products; the Owner sees all (pass activeOnly: false).
 */
export async function getProducts(filter: GetProductsFilter = {}): Promise<Product[]> {
  await simulateDelay();

  // ── MOCK ─────────────────────────────────────────────────────────────────
  let results = [...db.products];
  if (filter.activeOnly !== false) results = results.filter(p => p.is_active);
  if (filter.category)            results = results.filter(p => p.category === filter.category);
  if (filter.search) {
    const q = filter.search.toLowerCase();
    results = results.filter(p => p.name.toLowerCase().includes(q));
  }
  return results;
  // ── END MOCK ─────────────────────────────────────────────────────────────
}

/**
 * Returns a single product by ID, or throws if not found.
 */
export async function getProductById(id: number): Promise<Product> {
  await simulateDelay(80, 200);

  // ── MOCK ─────────────────────────────────────────────────────────────────
  const product = db.products.find(p => p.id === id);
  if (!product) throw new ApiError(`Product #${id} not found.`, 'PRODUCT_NOT_FOUND', 404);
  return product;
  // ── END MOCK ─────────────────────────────────────────────────────────────
}

/** Fields required to create a new product. */
export type CreateProductInput = Omit<Product, 'id' | 'created_at' | 'is_active'>;

/**
 * Creates a new product and returns the created record.
 * Only the Owner can call this — enforce RBAC at the UI/API layer.
 */
export async function createProduct(input: CreateProductInput): Promise<Product> {
  await simulateDelay();

  // ── MOCK ─────────────────────────────────────────────────────────────────
  if (input.buying_price <= 0) {
    throw new ApiError('Buying price must be greater than zero.', 'INVALID_BUYING_PRICE');
  }
  if (input.selling_price < input.buying_price) {
    throw new ApiError('Selling price must be at or above buying price.', 'INVALID_SELLING_PRICE');
  }
  const product: Product = {
    ...input,
    id:         nextId(db.products),
    is_active:  true,
    created_at: now(),
  };
  db.products.push(product);
  return product;
  // ── END MOCK ─────────────────────────────────────────────────────────────
}

/** Fields that can be updated on an existing product. */
export type UpdateProductInput = Partial<Omit<Product, 'id' | 'created_at'>>;

/**
 * Updates a product's fields and returns the updated record.
 * Partial — only provided fields are changed.
 */
export async function updateProduct(id: number, input: UpdateProductInput): Promise<Product> {
  await simulateDelay();

  // ── MOCK ─────────────────────────────────────────────────────────────────
  const idx = db.products.findIndex(p => p.id === id);
  if (idx === -1) throw new ApiError(`Product #${id} not found.`, 'PRODUCT_NOT_FOUND', 404);
  db.products[idx] = { ...db.products[idx], ...input };
  return db.products[idx];
  // ── END MOCK ─────────────────────────────────────────────────────────────
}

/**
 * Soft-deletes a product (sets is_active = false).
 * Active orders referencing this product are not affected.
 */
export async function deactivateProduct(id: number): Promise<Product> {
  return updateProduct(id, { is_active: false });
}

/**
 * Returns all products where qty_available <= low_stock_threshold.
 * Used for the Owner's low-stock alert list.
 */
export async function getLowStockProducts(): Promise<Product[]> {
  await simulateDelay();

  // ── MOCK ─────────────────────────────────────────────────────────────────
  return db.products.filter(
    p => p.is_active && p.qty_available <= p.low_stock_threshold,
  );
  // ── END MOCK ─────────────────────────────────────────────────────────────
}
