import { useState } from 'react';
import AdminLayout from './AdminLayout';
import OrderStatusBadge from '@/components/features/OrderStatusBadge';
import { getOrders, updateOrderStatus, formatPrice } from '@/lib/store';
import {
  getCentralProducts,
  saveCentralProducts,
  recordInventoryMovement,
} from '@/lib/inventoryStore';
import { Search, Eye, ChevronDown, Filter } from 'lucide-react';
import type { OrderStatus } from '@/types';
import { ORDER_STATUS_CONFIG } from '@/constants/data';

export default function AdminOrders() {
  const [orders, setOrders] = useState(getOrders());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = orders.filter(o => {
    const matchSearch = o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const advance = (orderId: string, newStatus: OrderStatus) => {
    const currentOrder = orders.find(o => o.id === orderId);

    // If cancelling an order, restore deducted stock back to central inventory
    if (newStatus === 'cancelled' && currentOrder && currentOrder.status !== 'cancelled') {
      const products = getCentralProducts();
      let modified = false;

      currentOrder.items.forEach(item => {
        const prodIdx = products.findIndex(p => p.id === item.product.id);
        if (prodIdx >= 0) {
          const prod = products[prodIdx];
          const before = prod.stock;
          const after = before + item.quantity;

          products[prodIdx] = {
            ...prod,
            stock: after,
            status: after > 0 ? 'active' : prod.status,
            available: after > 0,
            updatedAt: new Date().toISOString(),
          };
          modified = true;

          recordInventoryMovement({
            productId: prod.id,
            productName: prod.name,
            sku: prod.sku,
            type: 'online_refund',
            quantityChange: item.quantity,
            quantityBefore: before,
            quantityAfter: after,
            unitCost: prod.cost,
            totalValue: item.quantity * prod.cost,
            reason: `Cancelled Online Order #${currentOrder.orderNumber}`,
            referenceId: currentOrder.orderNumber,
            recordedBy: 'Admin Staff',
          });
        }
      });

      if (modified) {
        saveCentralProducts(products);
      }
    }

    updateOrderStatus(orderId, newStatus);
    setOrders(getOrders());
  };

  const getNextStatus = (current: OrderStatus): OrderStatus | null => {
    const flow: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'rider_assigned', 'out_for_delivery', 'delivered', 'completed'];
    const idx = flow.indexOf(current);
    return idx >= 0 && idx < flow.length - 1 ? flow[idx + 1] : null;
  };

  const selectedOrder = selected ? orders.find(o => o.id === selected) : null;

  return (
    <AdminLayout title="Orders">
      <div className="flex flex-col lg:flex-row gap-6 h-full">
        {/* Order list */}
        <div className="flex-1 min-w-0">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search order number, customer..." className="input-field pl-9 py-2" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field py-2 w-full sm:w-48">
              <option value="all">All Status</option>
              {Object.entries(ORDER_STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>

          {/* Table */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="table-header text-left">Order #</th>
                    <th className="table-header text-left">Customer</th>
                    <th className="table-header text-left hidden md:table-cell">Method</th>
                    <th className="table-header text-left">Status</th>
                    <th className="table-header text-right">Total</th>
                    <th className="table-header text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(order => (
                    <tr key={order.id} className={`table-row cursor-pointer ${selected === order.id ? 'bg-primary/5' : ''}`}
                      onClick={() => setSelected(order.id === selected ? null : order.id)}>
                      <td className="px-4 py-3 font-bold text-xs">{order.orderNumber}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold">{order.customer.name}</p>
                        <p className="text-xs text-muted-foreground">{order.customer.mobile}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell capitalize">{order.deliveryMethod}</td>
                      <td className="px-4 py-3"><OrderStatusBadge status={order.status} size="sm" /></td>
                      <td className="px-4 py-3 text-right font-bold text-primary">{formatPrice(order.total)}</td>
                      <td className="px-4 py-3 text-center">
                        {getNextStatus(order.status) && (
                          <button
                            onClick={e => { e.stopPropagation(); advance(order.id, getNextStatus(order.status)!); }}
                            className="bg-primary text-primary-foreground text-xs px-3 py-1.5 rounded-lg font-semibold hover:bg-brand-yellow-dark transition-colors whitespace-nowrap"
                          >
                            → {ORDER_STATUS_CONFIG[getNextStatus(order.status)!]?.label}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No orders found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order detail panel */}
        {selectedOrder && (
          <div className="w-full lg:w-80 bg-card rounded-2xl border border-border p-5 shadow-sm flex-shrink-0 lg:sticky lg:top-4 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto">
            <h3 className="font-black text-lg mb-4" style={{ fontFamily: 'Nunito' }}>Order Detail</h3>
            <p className="font-bold text-primary mb-1">{selectedOrder.orderNumber}</p>
            <OrderStatusBadge status={selectedOrder.status} />

            <div className="mt-4 space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Customer</p>
                <p className="font-semibold">{selectedOrder.customer.name}</p>
                <p className="text-muted-foreground">{selectedOrder.customer.mobile}</p>
              </div>
              {selectedOrder.deliveryAddress && (
                <div>
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="font-semibold text-xs">{selectedOrder.deliveryAddress.fullAddress}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Items</p>
                {selectedOrder.items.map(item => (
                  <p key={item.id} className="font-medium">{item.product.name} x{item.quantity}</p>
                ))}
              </div>
              <div className="border-t border-border pt-3">
                <div className="flex justify-between font-black text-base">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(selectedOrder.total)}</span>
                </div>
                <p className="text-xs text-muted-foreground">Payment: {selectedOrder.paymentMethod}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2">Timeline</p>
                {selectedOrder.timeline.slice().reverse().map((t, i) => (
                  <div key={i} className="flex gap-2 text-xs mb-2">
                    <span className="text-muted-foreground whitespace-nowrap">{new Date(t.timestamp).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="font-semibold">{ORDER_STATUS_CONFIG[t.status]?.label || t.status}</span>
                  </div>
                ))}
              </div>

              {getNextStatus(selectedOrder.status) && (
                <button
                  onClick={() => advance(selectedOrder.id, getNextStatus(selectedOrder.status)!)}
                  className="btn-primary w-full mt-2 text-sm"
                >
                  Advance: → {ORDER_STATUS_CONFIG[getNextStatus(selectedOrder.status)!]?.label}
                </button>
              )}
              <button
                onClick={() => advance(selectedOrder.id, 'cancelled')}
                className="w-full py-2 rounded-xl border-2 border-destructive text-destructive text-sm font-bold hover:bg-destructive hover:text-white transition-colors"
              >
                Cancel Order
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
