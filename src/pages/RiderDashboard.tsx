import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bike, MapPin, CheckCircle, Clock, Package, Phone,
  MessageCircle, Navigation, DollarSign, ToggleLeft, ToggleRight,
  Star, AlertCircle, ChevronRight, LogOut
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getOrders, updateOrderStatus, formatPrice } from '@/lib/store';
import OrderStatusBadge from '@/components/features/OrderStatusBadge';
import type { OrderStatus } from '@/types';
import { MOCK_RIDERS } from '@/constants/data';
import logoBadge from '@/assets/logo-badge.png';

export default function RiderDashboard() {
  const { user, logout } = useNavigate as any;
  const { user: authUser, logout: authLogout } = useAuth();
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(true);
  const [activeTab, setActiveTab] = useState<'current' | 'history' | 'earnings'>('current');

  const rider = MOCK_RIDERS[0];
  const orders = getOrders();
  const myOrder = orders.find(o => o.status === 'out_for_delivery' || o.status === 'rider_assigned' || o.status === 'picked_up');
  const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'delivered');

  const handleLogout = () => {
    authLogout();
    navigate('/login');
  };

  const advanceDelivery = (orderId: string, status: OrderStatus) => {
    updateOrderStatus(orderId, status);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <header className="bg-secondary text-secondary-foreground px-4 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <img src={logoBadge} alt="" className="w-10 h-10 rounded-full" />
          <div>
            <p className="font-black text-sm" style={{ fontFamily: 'Nunito' }}>{authUser?.name || rider.user.name}</p>
            <p className="text-xs text-secondary-foreground/60">Rider Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setIsOnline(!isOnline)} className="flex items-center gap-2">
            <span className="text-xs font-semibold">{isOnline ? 'Online' : 'Offline'}</span>
            {isOnline
              ? <ToggleRight size={24} className="text-green-400" />
              : <ToggleLeft size={24} className="text-gray-400" />
            }
          </button>
          <button onClick={handleLogout} className="p-2 text-secondary-foreground/60 hover:text-secondary-foreground">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Status bar */}
      <div className={`px-4 py-2 text-center text-xs font-bold ${isOnline ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}`}>
        {isOnline ? '🟢 You are ONLINE — Available for deliveries' : '🔴 You are OFFLINE'}
      </div>

      <div className="container mx-auto px-4 py-6 max-w-lg">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-card rounded-2xl p-4 text-center border border-border shadow-sm">
            <p className="text-2xl font-black text-primary" style={{ fontFamily: 'Nunito' }}>{rider.todayDeliveries}</p>
            <p className="text-xs text-muted-foreground">Today</p>
          </div>
          <div className="bg-card rounded-2xl p-4 text-center border border-border shadow-sm">
            <p className="text-2xl font-black text-foreground" style={{ fontFamily: 'Nunito' }}>{formatPrice(rider.earnings)}</p>
            <p className="text-xs text-muted-foreground">Earnings</p>
          </div>
          <div className="bg-card rounded-2xl p-4 text-center border border-border shadow-sm">
            <div className="flex items-center justify-center gap-1">
              <Star size={14} className="fill-primary text-primary" />
              <p className="text-2xl font-black text-foreground" style={{ fontFamily: 'Nunito' }}>{rider.rating}</p>
            </div>
            <p className="text-xs text-muted-foreground">Rating</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-card rounded-xl border border-border p-1 mb-6">
          {(['current', 'history', 'earnings'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all ${activeTab === tab ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
              {tab === 'current' ? 'Active' : tab}
            </button>
          ))}
        </div>

        {/* Current delivery */}
        {activeTab === 'current' && (
          <div>
            {myOrder ? (
              <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-black text-lg" style={{ fontFamily: 'Nunito' }}>Active Delivery</h2>
                  <OrderStatusBadge status={myOrder.status} size="sm" />
                </div>

                <div className="bg-muted rounded-xl p-4 mb-4">
                  <p className="font-bold text-lg text-primary" style={{ fontFamily: 'Nunito' }}>{myOrder.orderNumber}</p>
                  <p className="text-sm text-foreground">{myOrder.customer.name}</p>
                  <p className="text-xs text-muted-foreground">{myOrder.customer.mobile}</p>
                </div>

                {myOrder.deliveryAddress && (
                  <div className="flex items-start gap-3 mb-4">
                    <MapPin size={18} className="text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Deliver to</p>
                      <p className="font-semibold text-sm">{myOrder.deliveryAddress.fullAddress}</p>
                      {myOrder.deliveryAddress.landmark && (
                        <p className="text-xs text-primary">Landmark: {myOrder.deliveryAddress.landmark}</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <DollarSign size={16} className="text-primary" />
                    COD: {formatPrice(myOrder.total)}
                  </div>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-sm text-muted-foreground capitalize">{myOrder.paymentMethod}</span>
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <a href={`tel:${myOrder.customer.mobile}`}
                    className="flex items-center justify-center gap-2 bg-green-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-green-600 transition-colors">
                    <Phone size={16} /> Call Customer
                  </a>
                  <button className="flex items-center justify-center gap-2 btn-outline py-3 text-sm">
                    <Navigation size={16} /> Navigate
                  </button>
                </div>

                {/* Status advancement */}
                {myOrder.status === 'rider_assigned' && (
                  <button onClick={() => advanceDelivery(myOrder.id, 'picked_up')} className="btn-primary w-full py-3">
                    ✅ Confirm Pickup
                  </button>
                )}
                {myOrder.status === 'picked_up' && (
                  <button onClick={() => advanceDelivery(myOrder.id, 'out_for_delivery')} className="btn-primary w-full py-3">
                    🚚 Start Delivery
                  </button>
                )}
                {myOrder.status === 'out_for_delivery' && (
                  <div className="space-y-2">
                    <button onClick={() => advanceDelivery(myOrder.id, 'arriving')} className="btn-primary w-full py-3">
                      📍 Arriving at Customer
                    </button>
                    <button onClick={() => advanceDelivery(myOrder.id, 'delivered')} className="w-full py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-colors">
                      🎉 Mark as Delivered
                    </button>
                  </div>
                )}
                {myOrder.status === 'arriving' && (
                  <button onClick={() => advanceDelivery(myOrder.id, 'delivered')} className="w-full py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-colors">
                    🎉 Confirm Delivery
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-card rounded-2xl border border-border p-10 text-center shadow-sm">
                <Bike size={50} className="text-muted mx-auto mb-4" />
                <h3 className="font-bold text-lg mb-2">No Active Delivery</h3>
                <p className="text-muted-foreground text-sm">
                  {isOnline ? "You're online and ready. Waiting for assignment..." : 'Go online to receive deliveries'}
                </p>
                {!isOnline && (
                  <button onClick={() => setIsOnline(true)} className="btn-primary mt-4">
                    Go Online
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* History */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            {completedOrders.length === 0 ? (
              <div className="bg-card rounded-2xl border border-border p-10 text-center">
                <p className="text-muted-foreground">No completed deliveries yet</p>
              </div>
            ) : (
              completedOrders.map(order => (
                <div key={order.id} className="bg-card rounded-2xl border border-border p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm">{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">{order.customer.name}</p>
                      <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString('en-PH')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-primary">{formatPrice(order.total)}</p>
                      <OrderStatusBadge status={order.status} size="sm" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Earnings */}
        {activeTab === 'earnings' && (
          <div>
            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm mb-4">
              <h3 className="font-black text-lg mb-4" style={{ fontFamily: 'Nunito' }}>Earnings Summary</h3>
              <div className="space-y-4">
                {[
                  { label: "Today's Earnings", value: formatPrice(rider.earnings) },
                  { label: 'Deliveries Today', value: rider.todayDeliveries },
                  { label: 'Total Deliveries', value: rider.totalDeliveries },
                  { label: 'Rating', value: `${rider.rating} ⭐` },
                ].map(item => (
                  <div key={item.label} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="font-black text-foreground" style={{ fontFamily: 'Nunito' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
