import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { getOrders, updateOrderStatus } from '@/lib/store';
import type { Order, OrderStatus } from '@/types';
import { ChefHat, Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { formatPrice } from '@/lib/store';

const COLUMNS: { status: OrderStatus; label: string; color: string; bg: string }[] = [
  { status: 'confirmed', label: 'New / Confirmed', color: 'text-blue-700', bg: 'bg-blue-50' },
  { status: 'preparing', label: 'Preparing', color: 'text-orange-700', bg: 'bg-orange-50' },
  { status: 'ready', label: 'Ready', color: 'text-teal-700', bg: 'bg-teal-50' },
  { status: 'completed', label: 'Completed', color: 'text-green-700', bg: 'bg-green-50' },
];

function KitchenCard({ order, onAdvance }: { order: Order; onAdvance: (status: OrderStatus) => void }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = new Date(order.updatedAt).getTime();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 60000));
    }, 10000);
    return () => clearInterval(interval);
  }, [order.updatedAt]);

  const isOverdue = elapsed > order.estimatedPrepTime;
  const nextMap: Partial<Record<OrderStatus, OrderStatus>> = {
    confirmed: 'preparing',
    preparing: 'ready',
    ready: 'completed',
  };
  const next = nextMap[order.status];

  return (
    <div className={`bg-white rounded-2xl border-2 ${isOverdue ? 'border-destructive' : 'border-border'} p-4 shadow-sm`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-black text-sm" style={{ fontFamily: 'Nunito' }}>{order.orderNumber}</p>
          <p className="text-xs text-muted-foreground">{order.customer.name}</p>
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${isOverdue ? 'bg-red-100 text-red-700' : 'bg-primary/10 text-primary'}`}>
          <Clock size={11} />
          {elapsed}m
        </div>
      </div>

      {/* Items */}
      <div className="space-y-1.5 mb-3">
        {order.items.map(item => (
          <div key={item.id} className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
              {item.quantity}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{item.product.name}</p>
              {item.specialInstructions && (
                <p className="text-[10px] text-primary">📝 {item.specialInstructions}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
        <span className="capitalize">{order.deliveryMethod}</span>
        <span className="font-bold text-primary">{formatPrice(order.total)}</span>
      </div>

      {isOverdue && (
        <div className="flex items-center gap-1 text-xs text-destructive bg-red-50 rounded-lg p-2 mb-3">
          <AlertCircle size={12} /> Overdue by {elapsed - order.estimatedPrepTime}m
        </div>
      )}

      {next && (
        <button onClick={() => onAdvance(next)}
          className="btn-primary w-full py-2 text-xs flex items-center justify-center gap-1">
          <CheckCircle size={13} />
          Mark as {next === 'preparing' ? 'Preparing' : next === 'ready' ? 'Ready' : 'Complete'}
        </button>
      )}
    </div>
  );
}

export default function KitchenDisplay() {
  const [orders, setOrders] = useState(getOrders());

  const refresh = () => setOrders(getOrders());

  const handleAdvance = (orderId: string, status: OrderStatus) => {
    updateOrderStatus(orderId, status);
    setOrders(getOrders());
  };

  const getColumnOrders = (status: OrderStatus) =>
    orders.filter(o => o.status === status);

  return (
    <AdminLayout title="Kitchen Display System">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">
          Live kitchen queue — updates in real time
        </p>
        <button onClick={refresh} className="flex items-center gap-2 text-sm text-primary font-semibold hover:underline">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map(col => {
          const colOrders = getColumnOrders(col.status);
          return (
            <div key={col.status} className="flex flex-col">
              {/* Column header */}
              <div className={`rounded-t-2xl ${col.bg} px-4 py-3 flex items-center justify-between`}>
                <span className={`font-black text-sm ${col.color}`} style={{ fontFamily: 'Nunito' }}>{col.label}</span>
                <span className={`w-6 h-6 rounded-full ${col.bg} border-2 flex items-center justify-center text-xs font-black ${col.color}`}>
                  {colOrders.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 bg-muted/40 rounded-b-2xl border border-t-0 border-border p-3 space-y-3 min-h-[200px]">
                {colOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-24 text-muted-foreground/50">
                    <ChefHat size={24} />
                    <p className="text-xs mt-1">Empty</p>
                  </div>
                ) : (
                  colOrders.map(order => (
                    <KitchenCard
                      key={order.id}
                      order={order}
                      onAdvance={(status) => handleAdvance(order.id, status)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </AdminLayout>
  );
}
