import { ManagerPermissionKey } from '@/types';
import { db }                    from '@/mock/db';
import { simulateDelay }         from '@/mock/delay';

// ---------------------------------------------------------------------------
// Owner summary
// ---------------------------------------------------------------------------

export interface OwnerSummary {
  orders: {
    pending:          number;
    confirmed:        number;
    out_for_delivery: number;
    delivered:        number;
    total:            number;
  };
  revenue: {
    total_gmv:        number;
    total_commission: number;
  };
  pending_receipts:    number;
  pending_deposits:    number;
  pending_settlements: number;
  low_stock_products:  number;
}

export async function getOwnerSummary(): Promise<OwnerSummary> {
  await simulateDelay();

  const orders = db.orders;

  const deliveredOrders = orders.filter(o => o.status === 'delivered');
  let total_gmv        = 0;
  let total_commission = 0;
  for (const o of deliveredOrders) {
    const items = db.order_line_items.filter(li => li.order_id === o.id && li.fulfilled);
    total_gmv        += items.reduce((s, li) => s + li.selling_price_snapshot * li.quantity, 0)
                       + o.delivery_fee_snapshot;
    total_commission += items.reduce((s, li) => s + li.commission_amount, 0);
  }

  return {
    orders: {
      pending:          orders.filter(o => o.status === 'pending').length,
      confirmed:        orders.filter(o => o.status === 'confirmed').length,
      out_for_delivery: orders.filter(o => o.status === 'out_for_delivery').length,
      delivered:        deliveredOrders.length,
      total:            orders.length,
    },
    revenue: { total_gmv, total_commission },
    pending_receipts:    orders.filter(o => o.payment_status === 'receipt_pending').length,
    pending_deposits:    db.cash_deposits.filter(d => !d.owner_confirmed).length,
    pending_settlements: db.settlements.filter(s => s.status === 'pending').length,
    low_stock_products:  db.products.filter(p => p.is_active && p.qty_available <= p.low_stock_threshold).length,
  };
}

// ---------------------------------------------------------------------------
// Manager summary
// ---------------------------------------------------------------------------

export interface ManagerSummary {
  pending_orders?:      number;
  pending_receipts?:    number;
  pending_deposits?:    number;
  pending_settlements?: number;
}

export async function getManagerSummary(
  permissions: ManagerPermissionKey[],
): Promise<ManagerSummary> {
  await simulateDelay();
  const result: ManagerSummary = {};
  if (permissions.includes('confirm_orders'))
    result.pending_orders      = db.orders.filter(o => o.status === 'pending').length;
  if (permissions.includes('verify_receipts'))
    result.pending_receipts    = db.orders.filter(o => o.payment_status === 'receipt_pending').length;
  if (permissions.includes('confirm_deposits'))
    result.pending_deposits    = db.cash_deposits.filter(d => !d.owner_confirmed).length;
  if (permissions.includes('approve_settlements'))
    result.pending_settlements = db.settlements.filter(s => s.status === 'pending').length;
  return result;
}
