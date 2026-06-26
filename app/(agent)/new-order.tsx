/**
 * Agent — New Order Wizard (v0.6, COD + Prepaid).
 *
 * Three-step flow managed entirely within this screen:
 *   Step 1 — Customer & Address (find / create customer, pick address)
 *   Step 2 — Products         (build cart, set selling price, preview commission)
 *   Step 3 — Review & Submit  (summary, delivery fee, payment method, place order)
 *
 * Prepaid orders require a receipt image to be attached before submission.
 * After successful submission, shows a success banner with the order code
 * then resets so the agent can immediately start the next order.
 *
 * Wizard state resets automatically whenever this tab receives focus.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Pressable,
  ScrollView, Text, TextInput, View,
} from 'react-native';
import { useFocusEffect }    from 'expo-router';
import { Ionicons }          from '@expo/vector-icons';

import { Screen }                    from '@/components/ui/Screen';
import { Button }                    from '@/components/ui/Button';
import { PhoneSearchBar }            from '@/components/customer/PhoneSearchBar';
import { CustomerCard }              from '@/components/customer/CustomerCard';
import { AddressSelector }           from '@/components/customer/AddressSelector';
import { ProductPickerRow }          from '@/components/order/ProductPickerRow';
import { CartItemRow }               from '@/components/order/CartItemRow';
import type { CartItem }             from '@/components/order/CartItemRow';
import {
  PartialFulfillmentModal,
  type ExcludedItemPreview,
}                                    from '@/components/order/PartialFulfillmentModal';
import { PaymentMethodSelector }     from '@/components/order/PaymentMethodSelector';
import { ReceiptUploader }           from '@/components/order/ReceiptUploader';
import { useProducts }       from '@/hooks/useProducts';
import { useCreateCustomer, useAddCustomerAddress } from '@/hooks/useCustomer';
import { useCreateOrder }    from '@/hooks/useCreateOrder';
import { useAuthContext }    from '@/context/AuthContext';
import { calculateBandForCoords } from '@/services/delivery.service';
import * as customerService  from '@/services/customers.service';
import { formatCurrency }    from '@/lib/utils';
import { isValidPhone }      from '@/lib/phone';
import { ApiError, Customer, CustomerAddress, DeliveryBand, OrderFull, PaymentMethod } from '@/types';
import { COLORS, FONT_SIZES, RADIUS, SHADOW, SPACING } from '@/lib/theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type WizardStep   = 'customer' | 'items' | 'review';
type SearchStatus = 'idle' | 'searching' | 'found' | 'not_found';

interface OrderDraft {
  phone:           string;
  customer:        Customer | null;
  isNewCustomer:   boolean;
  newCustomerName: string;
  address:         CustomerAddress | null;
  addressMode:     'existing' | 'new';
  newAddressText:  string;
  cart:            CartItem[];
  paymentMethod:   PaymentMethod;
  receiptFileName: string | null;
}

const EMPTY_DRAFT: OrderDraft = {
  phone: '', customer: null, isNewCustomer: false, newCustomerName: '',
  address: null, addressMode: 'existing', newAddressText: '', cart: [],
  paymentMethod: 'cod', receiptFileName: null,
};

// ---------------------------------------------------------------------------
// Shared local sub-components
// ---------------------------------------------------------------------------

function StepBar({ current, total }: { current: number; total: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: SPACING.lg }}>
      {Array.from({ length: total }, (_, i) => {
        const n    = i + 1;
        const done = n < current;
        const act  = n === current;
        return (
          <React.Fragment key={n}>
            <View style={{
              width: 28, height: 28, borderRadius: 14,
              backgroundColor: act ? COLORS.brand : done ? COLORS.teal : COLORS.surfaceAlt,
              alignItems: 'center', justifyContent: 'center',
            }}>
              {done
                ? <Ionicons name="checkmark" size={14} color="#fff" />
                : <Text style={{ color: act ? '#fff' : COLORS.muted, fontSize: FONT_SIZES.xs, fontWeight: '700' }}>{n}</Text>
              }
            </View>
            {i < total - 1 && (
              <View style={{ flex: 1, height: 2, backgroundColor: done ? COLORS.teal : COLORS.border, borderRadius: 1 }} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

function BackRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingVertical: SPACING.sm, opacity: pressed ? 0.7 : 1,
      })}
    >
      <Ionicons name="chevron-back" size={18} color={COLORS.brand} />
      <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.brand, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

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

// ---------------------------------------------------------------------------
// Step 1 — Customer & Address
// ---------------------------------------------------------------------------

interface CustomerStepProps {
  draft:       OrderDraft;
  updateDraft: (patch: Partial<OrderDraft>) => void;
  onNext:      () => void;
}

function CustomerStep({ draft, updateDraft, onNext }: CustomerStepProps) {
  const [searchStatus, setSearchStatus] = useState<SearchStatus>('idle');
  const [phoneError,   setPhoneError]   = useState<string | undefined>();
  const [nameError,    setNameError]    = useState<string | undefined>();
  const [addrError,    setAddrError]    = useState<string | undefined>();
  const [nextLoading,  setNextLoading]  = useState(false);

  const { mutateAsync: createCustomer } = useCreateCustomer();
  const { mutateAsync: addAddress }     = useAddCustomerAddress();

  async function handleSearch() {
    setPhoneError(undefined);
    if (!isValidPhone(draft.phone)) {
      setPhoneError('Enter a valid Pakistani mobile number (03XX XXXXXXX).');
      return;
    }
    setSearchStatus('searching');
    try {
      const found = await customerService.searchCustomerByPhone(draft.phone);
      if (found) {
        updateDraft({ customer: found, isNewCustomer: false, address: null, addressMode: 'existing' });
        setSearchStatus('found');
      } else {
        updateDraft({ customer: null, isNewCustomer: true, address: null });
        setSearchStatus('not_found');
      }
    } catch {
      setPhoneError('Search failed. Please try again.');
      setSearchStatus('idle');
    }
  }

  async function handleNext() {
    setNameError(undefined);
    setAddrError(undefined);

    if (searchStatus === 'idle') { setPhoneError('Search for a customer first.'); return; }

    if (draft.isNewCustomer && !draft.newCustomerName.trim()) {
      setNameError('Customer name is required.'); return;
    }
    if ((draft.addressMode === 'new' || draft.isNewCustomer) && !draft.newAddressText.trim()) {
      setAddrError('Delivery address is required.'); return;
    }
    if (!draft.isNewCustomer && draft.addressMode === 'existing' && !draft.address) {
      setAddrError('Select a delivery address.'); return;
    }

    setNextLoading(true);
    try {
      let customer = draft.customer;
      let address  = draft.address;

      if (draft.isNewCustomer) {
        customer = await createCustomer({ phone_number: draft.phone, name: draft.newCustomerName.trim() });
      }
      if (draft.addressMode === 'new' || draft.isNewCustomer) {
        address = await addAddress({ customer_id: customer!.id, address_text: draft.newAddressText.trim() });
      }

      updateDraft({ customer, address });
      onNext();
    } catch (err) {
      Alert.alert('Error', err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setNextLoading(false);
    }
  }

  const showActions = searchStatus === 'found' || searchStatus === 'not_found';

  return (
    <Screen scrollable padded>
      <StepBar current={1} total={3} />
      <Text style={{ fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.text, marginBottom: SPACING.lg }}>
        Customer & Address
      </Text>

      <PhoneSearchBar
        value={draft.phone}
        onChangeText={v => { updateDraft({ phone: v }); setPhoneError(undefined); setSearchStatus('idle'); }}
        onSearch={handleSearch}
        loading={searchStatus === 'searching'}
        error={phoneError}
        disabled={nextLoading}
      />

      {searchStatus === 'found' && draft.customer && (
        <>
          <CustomerCard customer={draft.customer} />
          <AddressSelector
            customerId={draft.customer.id}
            selectedAddressId={draft.address?.id ?? null}
            showNew={draft.addressMode === 'new'}
            onSelectAddress={addr => updateDraft({ address: addr, addressMode: 'existing', newAddressText: '' })}
            onShowNew={() => updateDraft({ addressMode: 'new', address: null })}
            newAddressText={draft.newAddressText}
            onNewAddressChange={v => { updateDraft({ newAddressText: v }); setAddrError(undefined); }}
            newAddressError={addrError}
          />
          {addrError && draft.addressMode === 'existing' && (
            <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.danger, marginTop: 4 }}>{addrError}</Text>
          )}
        </>
      )}

      {searchStatus === 'not_found' && (
        <>
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 8,
            backgroundColor: COLORS.warningLight, borderRadius: RADIUS.md,
            padding: SPACING.md, marginTop: SPACING.md,
          }}>
            <Ionicons name="person-add-outline" size={18} color={COLORS.warning} />
            <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.warning, fontWeight: '600' }}>
              No customer found — fill in details to create new
            </Text>
          </View>

          <SectionLabel text="Customer Name" />
          <TextInput
            value={draft.newCustomerName}
            onChangeText={v => { updateDraft({ newCustomerName: v }); setNameError(undefined); }}
            placeholder="Full name"
            placeholderTextColor={COLORS.muted}
            returnKeyType="next"
            style={{
              borderWidth: 1, borderColor: nameError ? COLORS.danger : COLORS.border,
              borderRadius: RADIUS.md, backgroundColor: COLORS.surface,
              paddingHorizontal: SPACING.md, height: 44,
              fontSize: FONT_SIZES.sm, color: COLORS.text,
            }}
          />
          {nameError && <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.danger, marginTop: 4 }}>{nameError}</Text>}

          <SectionLabel text="Delivery Address" />
          <TextInput
            value={draft.newAddressText}
            onChangeText={v => { updateDraft({ newAddressText: v }); setAddrError(undefined); }}
            placeholder="e.g. House 12, Block B, DHA Phase 2, Karachi"
            placeholderTextColor={COLORS.muted}
            multiline
            style={{
              borderWidth: 1, borderColor: addrError ? COLORS.danger : COLORS.border,
              borderRadius: RADIUS.md, backgroundColor: COLORS.surface,
              padding: SPACING.md, minHeight: 70,
              fontSize: FONT_SIZES.sm, color: COLORS.text, textAlignVertical: 'top',
            }}
          />
          {addrError && <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.danger, marginTop: 4 }}>{addrError}</Text>}
        </>
      )}

      {showActions && (
        <View style={{ marginTop: SPACING.xl }}>
          <Button label="Next: Add Products" onPress={handleNext} loading={nextLoading} fullWidth size="lg" />
        </View>
      )}
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Products / Cart
// ---------------------------------------------------------------------------

interface ItemsStepProps {
  draft:       OrderDraft;
  updateDraft: (patch: Partial<OrderDraft>) => void;
  onBack:      () => void;
  onNext:      () => void;
}

function ItemsStep({ draft, updateDraft, onBack, onNext }: ItemsStepProps) {
  const { data: products = [], isLoading } = useProducts({ activeOnly: true });
  const [showPartial, setShowPartial]       = useState(false);
  const [excluded,    setExcluded]          = useState<ExcludedItemPreview[]>([]);

  function addToCart(product: (typeof products)[0]) {
    const existing = draft.cart.find(i => i.product.id === product.id);
    if (existing) {
      const next = Math.min(existing.quantity + 1, product.qty_available);
      updateDraft({ cart: draft.cart.map(i => i.product.id === product.id ? { ...i, quantity: next } : i) });
    } else {
      updateDraft({ cart: [...draft.cart, { product, quantity: 1, selling_price: product.base_price }] });
    }
  }

  function updateCartItem(productId: number, quantity: number, selling_price: number) {
    updateDraft({ cart: draft.cart.map(i => i.product.id === productId ? { ...i, quantity, selling_price } : i) });
  }

  function removeFromCart(productId: number) {
    updateDraft({ cart: draft.cart.filter(i => i.product.id !== productId) });
  }

  function handleNext() {
    if (draft.cart.length === 0) {
      Alert.alert('Empty Cart', 'Add at least one product before continuing.'); return;
    }
    const lowStock: ExcludedItemPreview[] = draft.cart
      .filter(i => i.product.qty_available < i.quantity)
      .map(i => ({
        productName:  i.product.name,
        productEmoji: i.product.image_emoji,
        reason: `Only ${i.product.qty_available} in stock, ${i.quantity} requested.`,
      }));
    if (lowStock.length) { setExcluded(lowStock); setShowPartial(true); }
    else onNext();
  }

  const totalCommission = draft.cart.reduce(
    (s, i) => s + (i.selling_price - i.product.base_price) * i.quantity, 0,
  );

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <FlatList
        data={products}
        keyExtractor={p => String(p.id)}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ paddingHorizontal: SPACING.base, paddingTop: SPACING.base }}>
            <BackRow label="Customer" onPress={onBack} />
            <StepBar current={2} total={3} />
            <Text style={{ fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.text, marginBottom: SPACING.sm }}>
              Add Products
            </Text>

            {draft.cart.length > 0 && (
              <View style={{ marginBottom: SPACING.sm }}>
                <SectionLabel text={`Cart — ${draft.cart.length} item${draft.cart.length !== 1 ? 's' : ''}`} />
                {draft.cart.map(item => (
                  <CartItemRow
                    key={item.product.id}
                    item={item}
                    onUpdate={updateCartItem}
                    onRemove={removeFromCart}
                  />
                ))}
                <View style={{
                  flexDirection: 'row', justifyContent: 'space-between',
                  padding: SPACING.sm, backgroundColor: COLORS.surfaceAlt,
                  borderRadius: RADIUS.md, marginBottom: SPACING.md,
                }}>
                  <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.muted }}>Est. commission</Text>
                  <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.teal }}>
                    +{formatCurrency(totalCommission)}
                  </Text>
                </View>
              </View>
            )}

            <SectionLabel text="All Products" />
          </View>
        }
        renderItem={({ item: product }) => (
          <ProductPickerRow
            product={product}
            qtyInCart={draft.cart.find(c => c.product.id === product.id)?.quantity ?? 0}
            onAdd={() => addToCart(product)}
          />
        )}
        ListEmptyComponent={
          isLoading
            ? <ActivityIndicator style={{ padding: 40 }} color={COLORS.brand} />
            : <Text style={{ textAlign: 'center', padding: 40, color: COLORS.muted }}>No active products.</Text>
        }
        ListFooterComponent={<View style={{ height: 100 }} />}
      />

      {/* Sticky CTA */}
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: SPACING.base, backgroundColor: COLORS.bg,
        borderTopWidth: 1, borderTopColor: COLORS.border,
      }}>
        <Button
          label={draft.cart.length > 0
            ? `Review Order (${draft.cart.length} item${draft.cart.length !== 1 ? 's' : ''})`
            : 'Add Items to Continue'}
          onPress={handleNext}
          fullWidth
          size="lg"
        />
      </View>

      <PartialFulfillmentModal
        visible={showPartial}
        items={excluded}
        onConfirm={() => { setShowPartial(false); onNext(); }}
        onCancel={() => setShowPartial(false)}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Review & Submit
// ---------------------------------------------------------------------------

interface ReviewStepProps {
  draft:       OrderDraft;
  updateDraft: (patch: Partial<OrderDraft>) => void;
  onBack:      () => void;
  onSuccess:   () => void;
}

function ReviewStep({ draft, updateDraft, onBack, onSuccess }: ReviewStepProps) {
  const { user }                     = useAuthContext();
  const { mutateAsync: createOrder } = useCreateOrder();
  const [bandInfo,  setBandInfo]     = useState<{ band: DeliveryBand | null; distance_km: number | null } | null>(null);
  const [submitting, setSubmitting]  = useState(false);
  const [createdOrder, setCreatedOrder] = useState<OrderFull | null>(null);
  const [receiptError, setReceiptError] = useState<string | undefined>();

  useEffect(() => {
    if (!draft.address) return;
    calculateBandForCoords(draft.address.latitude, draft.address.longitude)
      .then(info => setBandInfo(info))
      .catch(() => setBandInfo({ band: null, distance_km: null }));
  }, [draft.address]);

  const deliveryFee  = bandInfo?.band?.delivery_fee ?? 0;
  const subtotal     = draft.cart.reduce((s, i) => s + i.selling_price * i.quantity, 0);
  const commission   = draft.cart.reduce((s, i) => s + (i.selling_price - i.product.base_price) * i.quantity, 0);
  const total        = subtotal + deliveryFee;
  const isPrepaid    = draft.paymentMethod === 'prepaid';

  async function handleSubmit() {
    if (!draft.customer || !draft.address || !user) return;
    if (isPrepaid && !draft.receiptFileName) {
      setReceiptError('Please attach a payment receipt before submitting a prepaid order.');
      return;
    }
    setReceiptError(undefined);
    setSubmitting(true);
    try {
      const result = await createOrder({
        customer_id:         draft.customer.id,
        customer_address_id: draft.address.id,
        agent_id:            user.id,
        payment_method:      draft.paymentMethod,
        receipt_file_name:   draft.receiptFileName ?? undefined,
        items: draft.cart.map(i => ({
          product_id:    i.product.id,
          quantity:      i.quantity,
          selling_price: i.selling_price,
        })),
      });
      setCreatedOrder(result.order);
    } catch (err) {
      Alert.alert('Order Failed', err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Success view ─────────────────────────────────────────────────────────

  if (createdOrder) {
    const successSubline = isPrepaid
      ? `Prepaid · Receipt submitted · Commission: +${formatCurrency(commission)}`
      : `COD · Status: Pending · Commission: +${formatCurrency(commission)}`;

    return (
      <Screen scrollable padded>
        <View style={{ alignItems: 'center', paddingVertical: SPACING['2xl'] }}>
          <View style={{
            width: 72, height: 72, borderRadius: 36,
            backgroundColor: COLORS.teal + '20',
            alignItems: 'center', justifyContent: 'center',
            marginBottom: SPACING.lg,
          }}>
            <Ionicons name="checkmark-circle" size={44} color={COLORS.teal} />
          </View>
          <Text style={{ fontSize: FONT_SIZES['2xl'], fontWeight: '800', color: COLORS.text, marginBottom: 8 }}>
            Order Placed!
          </Text>
          <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.muted, marginBottom: 4 }}>
            {draft.customer?.name}
          </Text>
          <View style={{
            backgroundColor: COLORS.surfaceAlt, borderRadius: RADIUS.md,
            paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, marginTop: SPACING.sm,
          }}>
            <Text style={{ fontSize: FONT_SIZES.lg, fontWeight: '800', color: COLORS.brand, letterSpacing: 2 }}>
              {createdOrder.order_code}
            </Text>
          </View>
          <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.muted, marginTop: 8, textAlign: 'center' }}>
            {successSubline}
          </Text>
          {isPrepaid && (
            <View style={{
              flexDirection:   'row',
              alignItems:      'center',
              gap:             6,
              marginTop:       SPACING.sm,
              backgroundColor: COLORS.warningLight,
              borderRadius:    RADIUS.sm,
              paddingHorizontal: SPACING.sm,
              paddingVertical: 4,
            }}>
              <Ionicons name="time-outline" size={14} color={COLORS.warning} />
              <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.warning, fontWeight: '600' }}>
                Awaiting owner receipt verification
              </Text>
            </View>
          )}
          <View style={{ marginTop: SPACING['2xl'], width: '100%' }}>
            <Button label="Place Another Order" onPress={onSuccess} fullWidth size="lg" />
          </View>
        </View>
      </Screen>
    );
  }

  // ── Review view ───────────────────────────────────────────────────────────

  return (
    <Screen scrollable padded>
      <BackRow label="Edit Items" onPress={onBack} />
      <StepBar current={3} total={3} />
      <Text style={{ fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.text, marginBottom: SPACING.lg }}>
        Review Order
      </Text>

      <SectionLabel text="Payment Method" />
      <PaymentMethodSelector
        value={draft.paymentMethod}
        onChange={v => { updateDraft({ paymentMethod: v, receiptFileName: null }); setReceiptError(undefined); }}
        disabled={submitting}
      />

      {isPrepaid && (
        <>
          <SectionLabel text="Payment Receipt" />
          <ReceiptUploader
            fileName={draft.receiptFileName}
            onPicked={name => { updateDraft({ receiptFileName: name }); setReceiptError(undefined); }}
            uploading={submitting}
            disabled={submitting}
          />
          {receiptError && (
            <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.danger, marginTop: 4 }}>
              {receiptError}
            </Text>
          )}
        </>
      )}

      <SectionLabel text="Customer" />
      <InfoCard>
        <InfoRow label="Name"    value={draft.customer?.name ?? ''} />
        <InfoRow label="Address" value={draft.address?.address_text ?? ''} />
        {bandInfo?.distance_km != null && (
          <InfoRow label="Distance" value={`${bandInfo.distance_km.toFixed(1)} km`} />
        )}
        <InfoRow
          label="Delivery"
          value={bandInfo?.band
            ? `${bandInfo.band.name} · ${formatCurrency(deliveryFee)}`
            : 'Unzoned — Rs 0 (manager will confirm)'}
        />
        <InfoRow
          label="Payment"
          value={isPrepaid ? 'Prepaid' : 'Cash on Delivery'}
        />
      </InfoCard>

      <SectionLabel text={`Items (${draft.cart.length})`} />
      <InfoCard>
        {draft.cart.map((item, i) => (
          <View key={item.product.id}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.xs }}>
              <Text style={{ marginRight: 6, fontSize: 16 }}>{item.product.image_emoji}</Text>
              <Text style={{ flex: 1, fontSize: FONT_SIZES.sm, color: COLORS.text }}>
                {item.product.name} ×{item.quantity}
              </Text>
              <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.text }}>
                {formatCurrency(item.selling_price * item.quantity)}
              </Text>
            </View>
            {i < draft.cart.length - 1 && <View style={{ height: 1, backgroundColor: COLORS.border }} />}
          </View>
        ))}
      </InfoCard>

      <SectionLabel text="Totals" />
      <InfoCard>
        <InfoRow label="Subtotal"       value={formatCurrency(subtotal)} />
        <InfoRow label="Delivery Fee"   value={formatCurrency(deliveryFee)} />
        <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.xs }} />
        <InfoRow
          label={isPrepaid ? 'Total (Prepaid)' : 'Total (COD)'}
          value={formatCurrency(total)}
          bold
        />
        <InfoRow label="Est. Commission" value={`+${formatCurrency(commission)}`} color={COLORS.teal} />
      </InfoCard>

      <View style={{ marginTop: SPACING.xl, marginBottom: SPACING.lg }}>
        <Button
          label={isPrepaid ? 'Place Order — Prepaid' : 'Place Order — Cash on Delivery'}
          onPress={handleSubmit}
          loading={submitting}
          fullWidth
          size="lg"
        />
      </View>
    </Screen>
  );
}

// Review helper sub-components (file-local)

function InfoCard({ children }: { children: React.ReactNode }) {
  return (
    <View style={{
      backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
      borderWidth: 1, borderColor: COLORS.border,
      padding: SPACING.md, marginBottom: SPACING.sm, ...SHADOW.sm,
    }}>
      {children}
    </View>
  );
}

function InfoRow({ label, value, bold = false, color }: {
  label: string; value: string; bold?: boolean; color?: string;
}) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
      <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.muted }}>{label}</Text>
      <Text style={{
        fontSize: FONT_SIZES.sm, fontWeight: bold ? '700' : '500',
        color: color ?? COLORS.text, maxWidth: '60%', textAlign: 'right',
      }}>
        {value}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen (orchestrates steps)
// ---------------------------------------------------------------------------

export default function NewOrderScreen() {
  const [step,  setStep]  = useState<WizardStep>('customer');
  const [draft, setDraft] = useState<OrderDraft>(EMPTY_DRAFT);

  const updateDraft = useCallback((patch: Partial<OrderDraft>) => {
    setDraft(prev => ({ ...prev, ...patch }));
  }, []);

  // Reset wizard whenever this tab comes into focus
  useFocusEffect(useCallback(() => {
    setStep('customer');
    setDraft(EMPTY_DRAFT);
  }, []));

  if (step === 'items') {
    return (
      <ItemsStep
        draft={draft} updateDraft={updateDraft}
        onBack={() => setStep('customer')} onNext={() => setStep('review')}
      />
    );
  }
  if (step === 'review') {
    return (
      <ReviewStep
        draft={draft}
        updateDraft={updateDraft}
        onBack={() => setStep('items')}
        onSuccess={() => { setStep('customer'); setDraft(EMPTY_DRAFT); }}
      />
    );
  }
  return (
    <CustomerStep draft={draft} updateDraft={updateDraft} onNext={() => setStep('items')} />
  );
}
