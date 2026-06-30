/**
 * Bulk product upload service.
 *
 * Parses an xlsx file using the Products sheet layout from
 * Bulk_Product_Upload_Template.xlsx, validates all rows first (all-or-nothing),
 * and then writes to the mock DB.
 *
 * Column layout (1-indexed, rows 1=header, 2=description, 3+=data):
 *   A (0) — Product ID / SKU (blank = new)
 *   B (1) — Category
 *   C (2) — Item Name
 *   D (3) — Details / Description
 *   E (4) — Quantity
 *   F (5) — Buying Price
 *   G (6) — Selling Price
 *   H (7) — (blank — ignore)
 *   I (8) — Profit (auto-calc — ignore)
 */

import * as DocumentPicker from 'expo-document-picker';
import * as XLSX            from 'xlsx';
import * as FileSystem      from 'expo-file-system';

import { ApiError, Product }  from '@/types';
import { db, nextId, now }    from '@/mock/db';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface BulkUploadRowError {
  row:     number;
  field:   string;
  message: string;
}

export interface BulkUploadPreview {
  totalRows:   number;
  newProducts: number;
  updates:     number;
  errors:      BulkUploadRowError[];
  rows:        ParsedRow[];     // only populated when errors.length === 0
}

export interface BulkUploadResult {
  created: Product[];
  updated: Product[];
}

interface ParsedRow {
  rowNumber:    number;
  skuRaw:       string;
  isUpdate:     boolean;
  existingId?:  number;
  category:     string;
  categoryId:   number;
  name:         string;
  description:  string;
  qty:          number;
  buyingPrice:  number;
  sellingPrice: number;
}

// ---------------------------------------------------------------------------
// File picking
// ---------------------------------------------------------------------------

export async function pickXlsxFile(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets?.[0]?.uri) return null;
  return result.assets[0].uri;
}

// ---------------------------------------------------------------------------
// Parse + validate (does NOT write to DB)
// ---------------------------------------------------------------------------

export async function parseAndValidate(fileUri: string): Promise<BulkUploadPreview> {
  const base64 = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const workbook = XLSX.read(base64, { type: 'base64' });
  const sheet    = workbook.Sheets['Products'];
  if (!sheet) {
    throw new ApiError('The uploaded file does not have a "Products" sheet.', 'BULK_MISSING_SHEET');
  }

  // Convert to array-of-arrays; row 0 = header, row 1 = description, rows 2+ = data
  const aoa: (string | number | undefined)[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true });

  const dataRows = aoa.slice(2); // skip header + description rows
  if (dataRows.length === 0) {
    throw new ApiError('No data rows found in the Products sheet (rows start at row 3).', 'BULK_NO_DATA');
  }

  const errors:     BulkUploadRowError[] = [];
  const parsedRows: ParsedRow[]          = [];

  const activeCategories = db.categories.filter(c => c.is_active);

  for (let i = 0; i < dataRows.length; i++) {
    const row    = dataRows[i];
    const rowNum = i + 3; // 1-based, accounting for header + desc

    const skuRaw       = String(row[0] ?? '').trim();
    const categoryRaw  = String(row[1] ?? '').trim();
    const nameRaw      = String(row[2] ?? '').trim();
    const descriptionRaw = String(row[3] ?? '').trim();
    const qtyRaw       = row[4];
    const buyingRaw    = row[5];
    const sellingRaw   = row[6];

    // Skip fully-blank rows
    if (!categoryRaw && !nameRaw && qtyRaw == null && buyingRaw == null && sellingRaw == null) continue;

    let hasError = false;

    // Name
    if (!nameRaw) {
      errors.push({ row: rowNum, field: 'Item Name', message: 'Item Name is required.' });
      hasError = true;
    }

    // Category
    const matchedCat = activeCategories.find(c => c.name.toLowerCase() === categoryRaw.toLowerCase());
    if (!categoryRaw) {
      errors.push({ row: rowNum, field: 'Category', message: 'Category is required.' });
      hasError = true;
    } else if (!matchedCat) {
      errors.push({ row: rowNum, field: 'Category', message: `Category "${categoryRaw}" not found in the categories list.` });
      hasError = true;
    }

    // Quantity
    const qty = Number(qtyRaw);
    if (qtyRaw == null || qtyRaw === '' || isNaN(qty) || !Number.isInteger(qty) || qty < 0) {
      errors.push({ row: rowNum, field: 'Quantity', message: 'Quantity must be a whole number ≥ 0.' });
      hasError = true;
    }

    // Buying price
    const buyingPrice = Number(buyingRaw);
    if (buyingRaw == null || buyingRaw === '' || isNaN(buyingPrice) || buyingPrice <= 0) {
      errors.push({ row: rowNum, field: 'Buying Price', message: 'Buying Price must be a number greater than 0.' });
      hasError = true;
    }

    // Selling price
    const sellingPrice = Number(sellingRaw);
    if (sellingRaw == null || sellingRaw === '' || isNaN(sellingPrice) || sellingPrice <= 0) {
      errors.push({ row: rowNum, field: 'Selling Price', message: 'Selling Price must be a number greater than 0.' });
      hasError = true;
    } else if (!isNaN(buyingPrice) && sellingPrice < buyingPrice) {
      errors.push({ row: rowNum, field: 'Selling Price', message: `Selling Price (Rs ${sellingPrice}) must be ≥ Buying Price (Rs ${buyingPrice}).` });
      hasError = true;
    }

    // SKU / update matching
    let existingId: number | undefined;
    let isUpdate = false;
    if (skuRaw !== '') {
      const parsed = parseInt(skuRaw, 10);
      const existing = db.products.find(p => p.id === parsed);
      if (!existing) {
        errors.push({ row: rowNum, field: 'Product ID / SKU', message: `No existing product found with ID "${skuRaw}". Leave blank to create a new product.` });
        hasError = true;
      } else {
        existingId = existing.id;
        isUpdate   = true;
      }
    }

    if (!hasError) {
      parsedRows.push({
        rowNumber: rowNum,
        skuRaw,
        isUpdate,
        existingId,
        category:     categoryRaw,
        categoryId:   matchedCat!.id,
        name:         nameRaw,
        description:  descriptionRaw,
        qty,
        buyingPrice,
        sellingPrice,
      });
    }
  }

  return {
    totalRows:   parsedRows.length + (errors.length > 0 ? errors.length : 0),
    newProducts: parsedRows.filter(r => !r.isUpdate).length,
    updates:     parsedRows.filter(r =>  r.isUpdate).length,
    errors,
    rows:        errors.length === 0 ? parsedRows : [],
  };
}

// ---------------------------------------------------------------------------
// Commit — call only when preview.errors.length === 0
// ---------------------------------------------------------------------------

export async function commitUpload(preview: BulkUploadPreview): Promise<BulkUploadResult> {
  if (preview.errors.length > 0) {
    throw new ApiError('Cannot commit: the file contains validation errors.', 'BULK_HAS_ERRORS');
  }
  if (preview.rows.length === 0) {
    throw new ApiError('No rows to commit.', 'BULK_NO_DATA');
  }

  const created: Product[] = [];
  const updated: Product[] = [];
  const timestamp          = now();

  for (const row of preview.rows) {
    if (row.isUpdate && row.existingId != null) {
      const idx = db.products.findIndex(p => p.id === row.existingId);
      if (idx !== -1) {
        db.products[idx] = {
          ...db.products[idx],
          category_id:   row.categoryId,
          category:      row.category,
          name:          row.name,
          description:   row.description,
          qty_available: row.qty,
          buying_price:  row.buyingPrice,
          selling_price: row.sellingPrice,
        };
        updated.push(db.products[idx]);
      }
    } else {
      const product: Product = {
        id:                  nextId(db.products),
        name:                row.name,
        description:         row.description,
        image_emoji:         '📦',
        category:            row.category,
        category_id:         row.categoryId,
        buying_price:        row.buyingPrice,
        selling_price:       row.sellingPrice,
        qty_available:       row.qty,
        low_stock_threshold: 5,
        is_active:           true,
        owner_id:            db.users.find(u => u.role === 'owner')?.id ?? 1,
        created_at:          timestamp,
        images:              [],
        sku:                 null,
      };
      db.products.push(product);
      created.push(product);
    }
  }

  return { created, updated };
}
