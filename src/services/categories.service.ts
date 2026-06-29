/**
 * Categories service — manages the product category catalog.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * BACKEND INTEGRATION
 * Replace mock implementations with real API calls. Signatures must not change.
 * ─────────────────────────────────────────────────────────────────────────
 */

import { ApiError, Category } from '@/types';
import { db, nextId, now }    from '@/mock/db';
import { simulateDelay }      from '@/mock/delay';

export async function getCategories(activeOnly = true): Promise<Category[]> {
  await simulateDelay();
  return activeOnly
    ? db.categories.filter(c => c.is_active)
    : [...db.categories];
}

export async function createCategory(name: string, createdBy: number): Promise<Category> {
  await simulateDelay();
  const trimmed = name.trim();
  if (!trimmed) throw new ApiError('Category name is required.', 'CATEGORY_NAME_REQUIRED');
  if (db.categories.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
    throw new ApiError(`Category "${trimmed}" already exists.`, 'CATEGORY_DUPLICATE');
  }
  const cat: Category = {
    id:         nextId(db.categories),
    name:       trimmed,
    is_active:  true,
    created_by: createdBy,
    created_at: now(),
  };
  db.categories.push(cat);
  return cat;
}

export async function toggleCategory(id: number, isActive: boolean): Promise<Category> {
  await simulateDelay();
  const idx = db.categories.findIndex(c => c.id === id);
  if (idx === -1) throw new ApiError(`Category #${id} not found.`, 'CATEGORY_NOT_FOUND', 404);
  db.categories[idx] = { ...db.categories[idx], is_active: isActive };
  return db.categories[idx];
}
