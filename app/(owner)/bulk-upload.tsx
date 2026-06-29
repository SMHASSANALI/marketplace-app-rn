/**
 * Bulk Product Upload — Owner only.
 *
 * Flow:
 *  1. Pick an xlsx file from device
 *  2. Parse & validate (shows preview: row count, new vs updates, errors)
 *  3. Owner reviews → taps Commit or cancels
 */

import React, { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { router }          from 'expo-router';
import { Ionicons }        from '@expo/vector-icons';

import { Screen }       from '@/components/ui/Screen';
import { Button }       from '@/components/ui/Button';
import { ApiError }     from '@/types';
import {
  pickXlsxFile,
  parseAndValidate,
  commitUpload,
  type BulkUploadPreview,
  type BulkUploadRowError,
} from '@/services/bulk-upload.service';
import {
  COLORS, FONT_SIZES, RADIUS, SHADOW, SPACING,
} from '@/lib/theme';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function SectionLabel({ text }: { text: string }) {
  return (
    <Text style={{
      fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.muted,
      textTransform: 'uppercase', letterSpacing: 0.6,
      marginTop: SPACING.lg, marginBottom: SPACING.sm,
    }}>
      {text}
    </Text>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View style={{
      backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
      borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, ...SHADOW.sm,
    }}>
      {children}
    </View>
  );
}

function ErrorRow({ err }: { err: BulkUploadRowError }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 4 }}>
      <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.danger, fontWeight: '700', minWidth: 50 }}>
        Row {err.row}
      </Text>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.danger, fontWeight: '600' }}>
          {err.field}
        </Text>
        <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted }}>
          {err.message}
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

type Stage = 'idle' | 'parsing' | 'preview' | 'committing' | 'done';

export default function BulkUploadScreen() {
  const [stage,   setStage]   = useState<Stage>('idle');
  const [preview, setPreview] = useState<BulkUploadPreview | null>(null);
  const [result,  setResult]  = useState<{ created: number; updated: number } | null>(null);
  const [error,   setError]   = useState<string | null>(null);

  async function handlePickFile() {
    setError(null);
    try {
      const uri = await pickXlsxFile();
      if (!uri) return; // user cancelled

      setStage('parsing');
      const p = await parseAndValidate(uri);
      setPreview(p);
      setStage('preview');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to read file. Make sure it is a valid .xlsx file.');
      setStage('idle');
    }
  }

  async function handleCommit() {
    if (!preview || preview.errors.length > 0) return;
    setStage('committing');
    try {
      const r = await commitUpload(preview);
      setResult({ created: r.created.length, updated: r.updated.length });
      setStage('done');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Commit failed. Please try again.');
      setStage('preview');
    }
  }

  function handleReset() {
    setStage('idle');
    setPreview(null);
    setResult(null);
    setError(null);
  }

  const hasErrors = (preview?.errors.length ?? 0) > 0;

  return (
    <Screen scrollable padded>
      <Text style={{ fontSize: FONT_SIZES['2xl'], fontWeight: '800', color: COLORS.text, marginBottom: 4 }}>
        Bulk Product Upload
      </Text>
      <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.muted, marginBottom: SPACING.lg }}>
        Upload an .xlsx file using the provided template to create or update products.
      </Text>

      {/* ── Template hint ── */}
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
          <Ionicons name="information-circle-outline" size={18} color={COLORS.info} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.text, marginBottom: 2 }}>
              Required column order (Products sheet)
            </Text>
            <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, lineHeight: 18 }}>
              A: Product ID / SKU (blank = new){'\n'}
              B: Category  ·  C: Item Name  ·  D: Description{'\n'}
              E: Quantity  ·  F: Buying Price  ·  G: Selling Price
            </Text>
            <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginTop: 4 }}>
              Row 1 = header, Row 2 = descriptions. Data starts at Row 3.
            </Text>
          </View>
        </View>
      </Card>

      {/* ── Error message ── */}
      {error && (
        <>
          <SectionLabel text="Error" />
          <Card>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Ionicons name="alert-circle" size={18} color={COLORS.danger} />
              <Text style={{ flex: 1, fontSize: FONT_SIZES.sm, color: COLORS.danger }}>
                {error}
              </Text>
            </View>
          </Card>
        </>
      )}

      {/* ── Pick file ── */}
      {(stage === 'idle' || stage === 'parsing') && (
        <>
          <SectionLabel text="Upload File" />
          <Button
            label={stage === 'parsing' ? 'Parsing file…' : 'Choose .xlsx File'}
            onPress={handlePickFile}
            loading={stage === 'parsing'}
            fullWidth size="lg"
          />
        </>
      )}

      {/* ── Preview ── */}
      {stage === 'preview' && preview && (
        <>
          <SectionLabel text="Validation Result" />
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: hasErrors ? SPACING.md : 0 }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.text }}>
                  {preview.newProducts}
                </Text>
                <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted }}>New</Text>
              </View>
              <View style={{ width: 1, backgroundColor: COLORS.border }} />
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.info }}>
                  {preview.updates}
                </Text>
                <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted }}>Updates</Text>
              </View>
              <View style={{ width: 1, backgroundColor: COLORS.border }} />
              <View style={{ alignItems: 'center' }}>
                <Text style={{
                  fontSize: 22, fontWeight: '800',
                  color: preview.errors.length > 0 ? COLORS.danger : COLORS.teal,
                }}>
                  {preview.errors.length}
                </Text>
                <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted }}>Errors</Text>
              </View>
            </View>

            {hasErrors && (
              <>
                <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.sm }} />
                <Text style={{ fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.danger, marginBottom: 4 }}>
                  Fix these errors before uploading:
                </Text>
                {preview.errors.map((err, i) => (
                  <View key={i}>
                    <ErrorRow err={err} />
                    {i < preview.errors.length - 1 && (
                      <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: 2 }} />
                    )}
                  </View>
                ))}
              </>
            )}
          </Card>

          {!hasErrors && (
            <>
              <SectionLabel text="Preview" />
              <Card>
                {preview.rows.slice(0, 8).map((row, i) => (
                  <View key={i}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 }}>
                      <View style={{
                        backgroundColor: row.isUpdate ? COLORS.info + '20' : COLORS.teal + '20',
                        borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
                      }}>
                        <Text style={{
                          fontSize: 10, fontWeight: '700',
                          color: row.isUpdate ? COLORS.info : COLORS.teal,
                        }}>
                          {row.isUpdate ? 'UPDATE' : 'NEW'}
                        </Text>
                      </View>
                      <Text style={{ flex: 1, fontSize: FONT_SIZES.sm, color: COLORS.text }} numberOfLines={1}>
                        {row.name}
                      </Text>
                      <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted }}>
                        Rs {row.buyingPrice}/{row.sellingPrice}
                      </Text>
                    </View>
                    {i < Math.min(preview.rows.length - 1, 7) && (
                      <View style={{ height: 1, backgroundColor: COLORS.border }} />
                    )}
                  </View>
                ))}
                {preview.rows.length > 8 && (
                  <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginTop: 4 }}>
                    + {preview.rows.length - 8} more rows…
                  </Text>
                )}
              </Card>
            </>
          )}

          <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.lg }}>
            <View style={{ flex: 1 }}>
              <Button label="Cancel" variant="secondary" onPress={handleReset} fullWidth />
            </View>
            {!hasErrors && (
              <View style={{ flex: 2 }}>
                <Button
                  label={`Commit ${preview.newProducts + preview.updates} Products`}
                  onPress={handleCommit}
                  loading={stage as string === 'committing'}
                  fullWidth size="lg"
                />
              </View>
            )}
          </View>

          {hasErrors && (
            <View style={{ marginTop: SPACING.md }}>
              <Button
                label="Re-upload Fixed File"
                onPress={handlePickFile}
                fullWidth
              />
            </View>
          )}
        </>
      )}

      {/* ── Done ── */}
      {stage === 'done' && result && (
        <>
          <SectionLabel text="Upload Complete" />
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: SPACING.sm }}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.teal} />
              <Text style={{ fontSize: FONT_SIZES.base, fontWeight: '700', color: COLORS.teal }}>
                Upload successful!
              </Text>
            </View>
            <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.muted }}>
              {result.created > 0 && `${result.created} new product${result.created > 1 ? 's' : ''} created.  `}
              {result.updated > 0 && `${result.updated} product${result.updated > 1 ? 's' : ''} updated.`}
            </Text>
          </Card>

          <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.lg }}>
            <View style={{ flex: 1 }}>
              <Button label="Upload Another" variant="secondary" onPress={handleReset} fullWidth />
            </View>
            <View style={{ flex: 1 }}>
              <Button label="Go to Products" onPress={() => router.back()} fullWidth />
            </View>
          </View>
        </>
      )}

      <View style={{ height: SPACING['2xl'] }} />
    </Screen>
  );
}
