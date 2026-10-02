import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Search, Check, MapPin, Phone, MessageCircle, Star, Truck,
  Clock, Package, ChefHat, AlertCircle, User, RefreshCw, MessageSquare, Sparkles
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';
import OrderStatusBadge from '@/components/features/OrderStatusBadge';
import CustomerFeedbackModal from '@/components/features/CustomerFeedbackModal';
import { getFeedbackForOrder } from '@/services/feedbackService';
import { getOrderById, getOrders, formatPrice } from '@/lib/store';
import type { Order, OrderStatus } from '@/types';

const STATUS_FLOW: { status: OrderStatus; label: string; icon: string }[] = [
  { status: 'pending', label: 'Order Received', icon: '📥' },
  { status: 'payment_verification', label: 'Payment Verification', icon: '💳' },
  { status: 'confirmed', label: 'Confirmed', icon: '✅' },
  { status: 'preparing', label: 'Preparing', icon: '👨‍🍳' },
  { status: 'ready', label: 'Ready', icon: '📦' },
  { status: 'rider_assigned', label: 'Rider Assigned', icon: '🏍️' },
  { status: 'picked_up', label: 'Picked Up', icon: '📍' },
  { status: 'out_for_delivery', label: 'Out for Delivery', icon: '🚚' },
  { status: 'arriving', label: 'Arriving', icon: '🏠' },
  { status: 'delivered', label: 'Delivered', icon: '🎉' },
  { status: 'completed', label: 'Completed', icon: '⭐' },
];

const STATUS_INDEX: Record<string, number> = {};
STATUS_FLOW.forEach((s, i) => { STATUS_INDEX[s.status] = i; });

export default function TrackOrderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(id ? getOrderById(id) || null : null);
  const [searchInput, setSearchInput] = useState(id || '');
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      setOrder(getOrderById(id) || null);
    }
  }, [id]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      const found = getOrderById(searchInput.trim());
      if (found) {
        setOrder(found);
        navigate(`/track/${found.id}`, { replace: true });
      } else {
        setOrder(null);
        alert('Order not found. Please check your order number.');
      }
    }
  };

  const refresh = () => {
    if (order) {
      setOrder(getOrderById(order.id) || null);
      setLastRefresh(new Date());
    }
  };

  const currentStatusIdx = order ? (STATUS_INDEX[order.status] ?? -1) : -1;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="hero-gradient py-10 relative overflow-hidden">
        <div className="absolute inset-0 woven-bg opacity-20" />
        <div className="container mx-auto px-4 relative">
          <h1 className="text-3xl font-black text-white mb-2" style={{ fontFamily: 'Nunito' }}>
            📍 Track Your Order
          </h1>
          <p className="text-white/70 mb-6">Enter your order number to see real-time status</p>
          <form onSubmit={handleSearch} className="flex gap-2 max-w-lg">
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="e.g. KPB-2026-000123"
              className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button type="submit" className="btn-primary px-5 py-3">
              <Search size={18} />
            </button>
          </form>
        </div>
      </div>

      <div className="flex-1 bg-background py-8">
        <div className="container mx-auto px-4 max-w-3xl">

          {!order && (
            <div className="text-center py-20">
              <Package size={64} className="text-muted mx-auto mb-4" />
              <h2 className="text-xl font-bold text-foreground mb-2">No order found</h2>
              <p className="text-muted-foreground">Enter your order number above to track your order</p>
              <p className="text-sm text-primary mt-4">Demo: Try order ID "ord-001"</p>
            </div>
          )}

          {order && (
            <div>
              {/* Order header */}
              <div className="bg-card rounded-2xl border border-border p-6 mb-6 shadow-sm">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <h2 className="text-xl font-black text-foreground" style={{ fontFamily: 'Nunito' }}>
                      Order #{order.orderNumber}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Placed: {new Date(order.createdAt).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                    <div className="mt-2">
                      <OrderStatusBadge status={order.status} size="lg" />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-primary" style={{ fontFamily: 'Nunito' }}>{formatPrice(order.total)}</p>
                    <p className="text-sm text-muted-foreground capitalize">{order.deliveryMethod}</p>
                    <button onClick={refresh} className="flex items-center gap-1 text-xs text-primary mt-2 hover:underline">
                      <RefreshCw size={12} /> Refresh
                    </button>
                    <p className="text-xs text-muted-foreground">Last: {lastRefresh.toLocaleTimeString('en-PH')}</p>
                  </div>
                </div>
              </div>

              {/* Progress tracker */}
              <div className="bg-card rounded-2xl border border-border p-6 mb-6 shadow-sm">
                <h3 className="font-bold text-lg mb-6" style={{ fontFamily: 'Nunito' }}>Order Progress</h3>

                {['cancelled', 'delivery_failed', 'refunded', 'payment_failed'].includes(order.status) ? (
                  <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <AlertCircle size={24} className="text-red-500 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-red-700">Order {order.status.replace('_', ' ')}</p>
                      <p className="text-sm text-red-600">Please contact us for assistance: 0991 598 4112 / 0961 772 2601</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    {STATUS_FLOW.map((step, i) => {
                      const isDone = i < currentStatusIdx;
                      const isCurrent = i === currentStatusIdx;
                      const isPending = i > currentStatusIdx;

                      return (
                        <div key={step.status} className="flex items-start gap-4 mb-4 last:mb-0">
                          <div className="flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 transition-all ${
                              isDone ? 'bg-green-500' : isCurrent ? 'bg-primary pulse-yellow' : 'bg-muted'
                            }`}>
                              {isDone ? <Check size={18} className="text-white" strokeWidth={3} /> : step.icon}
                            </div>
                            {i < STATUS_FLOW.length - 1 && (
                              <div className={`w-0.5 h-8 mt-1 ${isDone ? 'bg-green-400' : 'bg-muted'}`} />
                            )}
                          </div>

                          <div className={`pt-2 flex-1 ${isPending ? 'opacity-40' : ''}`}>
                            <p className={`font-semibold text-sm ${isCurrent ? 'text-primary' : isDone ? 'text-green-700' : 'text-muted-foreground'}`}>
                              {step.label}
                            </p>
                            {(isDone || isCurrent) && (() => {
                              const timeline = order.timeline.find(t => t.status === step.status);
                              if (!timeline) return null;
                              return (
                                <div>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(timeline.timestamp).toLocaleString('en-PH', { dateStyle: 'short', timeStyle: 'short' })}
                                  </p>
                                  {timeline.note && <p className="text-xs text-muted-foreground mt-0.5">{timeline.note}</p>}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Rider info */}
              {order.rider && ['rider_assigned', 'picked_up', 'out_for_delivery', 'arriving'].includes(order.status) && (
                <div className="bg-card rounded-2xl border border-border p-6 mb-6 shadow-sm">
                  <h3 className="font-bold text-lg mb-4" style={{ fontFamily: 'Nunito' }}>🏍️ Your Rider</h3>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-black text-primary flex-shrink-0">
                      {order.rider.user.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-lg">{order.rider.user.name}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={12} className={i < Math.floor(order.rider!.rating) ? 'fill-primary text-primary' : 'text-muted'} />
                        ))}
                        <span className="text-xs font-semibold ml-1">{order.rider.rating}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {order.rider.vehicleType === 'motorcycle' ? '🏍️' : '🚲'} {order.rider.plateNumber}
                      </p>
                      <p className="text-xs text-muted-foreground">{order.rider.totalDeliveries} deliveries completed</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <a href={`tel:${order.rider.user.mobile}`}
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-bold hover:bg-brand-yellow-dark transition-colors">
                        <Phone size={14} /> Call
                      </a>
                      <button className="flex items-center gap-2 btn-outline py-2 px-4 text-sm">
                        <MessageCircle size={14} /> Chat
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-muted rounded-xl">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin size={12} className="text-primary" />
                      Rider location updates are live. Estimated arrival in ~15 min.
                    </p>
                  </div>
                </div>
              )}

              {/* Order items */}
              <div className="bg-card rounded-2xl border border-border p-6 mb-6 shadow-sm">
                <h3 className="font-bold text-lg mb-4" style={{ fontFamily: 'Nunito' }}>📦 Order Items</h3>
                <div className="space-y-3">
                  {order.items.map(item => (
                    <div key={item.id} className="flex gap-3 items-center">
                      <img src={item.product.images[0]} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                      </div>
                      <span className="font-bold text-sm text-primary">
                        {formatPrice(((item.product.promoPrice || item.product.price) + item.optionPriceAdd) * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border mt-4 pt-4 flex justify-between font-black">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(order.total)}</span>
                </div>
              </div>

              {/* Delivery address */}
              {order.deliveryAddress && (
                <div className="bg-card rounded-2xl border border-border p-5 mb-6 shadow-sm">
                  <h3 className="font-bold mb-2 flex items-center gap-2">
                    <MapPin size={16} className="text-primary" /> Delivery Address
                  </h3>
                  <p className="text-sm text-muted-foreground">{order.deliveryAddress.fullAddress}</p>
                  {order.deliveryAddress.landmark && (
                    <p className="text-xs text-primary mt-1">📍 Landmark: {order.deliveryAddress.landmark}</p>
                  )}
                </div>
              )}

              {/* Customer Feedback & Rating Banner (Stored in Firebase Firestore) */}
              <div className="bg-gradient-to-r from-amber-500/10 via-primary/10 to-transparent border border-amber-500/30 rounded-2xl p-5 mb-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500 text-secondary flex items-center justify-center flex-shrink-0 font-black shadow-sm">
                    <Star size={24} className="fill-secondary text-secondary" />
                  </div>
                  <div>
                    <h4 className="font-black text-base text-foreground" style={{ fontFamily: 'Nunito' }}>
                      How was your Bilao Feast?
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Share your experience to help us improve and earn <strong>+15 Salo-Salo Loyalty Points</strong> credited to your account!
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setFeedbackModalOpen(true)}
                  className="btn-primary text-xs px-5 py-2.5 font-black flex items-center gap-1.5 shadow-md flex-shrink-0 self-stretch sm:self-auto justify-center"
                >
                  <Star size={14} className="fill-current" />
                  {getFeedbackForOrder(order.id) || getFeedbackForOrder(order.orderNumber)
                    ? 'View / Edit Feedback'
                    : 'Rate Feast & Review'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Customer Feedback Modal */}
      <CustomerFeedbackModal
        isOpen={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        order={order}
      />

      <Footer />
      <MobileNav />
    </div>
  );
}
