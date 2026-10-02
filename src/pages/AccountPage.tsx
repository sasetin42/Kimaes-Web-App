import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Package,
  Heart,
  MapPin,
  Bell,
  Settings,
  LogOut,
  ChevronRight,
  Star,
  RotateCcw,
  Eye,
  Edit3,
  Plus,
  Award,
  Sparkles,
  Gift,
  Crown,
  TrendingUp,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  MessageSquare,
  ThumbsUp,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';
import OrderStatusBadge from '@/components/features/OrderStatusBadge';
import CustomerFeedbackModal from '@/components/features/CustomerFeedbackModal';
import CustomerLoyaltyRewardsModule from '@/components/features/CustomerLoyaltyRewardsModule';
import { useAuth } from '@/hooks/useAuth';
import { getOrders, formatPrice, getNotifications, markNotificationRead } from '@/lib/store';
import {
  getSukiProfiles,
  getSukiProfileByIdentifier,
  getLoyaltyTransactions,
  getLoyaltyVouchers,
  registerSukiProfile,
} from '@/lib/loyaltyStore';
import {
  subscribeToCustomerFeedback,
  getFeedbackForOrder,
} from '@/services/feedbackService';
import {
  getNotificationPermission,
  requestNotificationPermission,
} from '@/lib/pushNotifications';
import type { SukiProfile, LoyaltyTransaction, LoyaltyVoucher, CustomerFeedback, Order } from '@/types';
import { toast } from 'sonner';

export default function AccountPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Push notification permission state
  const [pushPermission, setPushPermission] = useState<NotificationPermission>(() =>
    getNotificationPermission()
  );
  const [enablingPush, setEnablingPush] = useState(false);

  // Loyalty profile state
  const [sukiProfile, setSukiProfile] = useState<SukiProfile | undefined>(() => {
    if (!user) return undefined;
    return (
      getSukiProfileByIdentifier(user.id) ||
      getSukiProfileByIdentifier(user.email) ||
      getSukiProfileByIdentifier(user.mobile)
    );
  });

  const [loyaltyTransactions, setLoyaltyTransactions] = useState<LoyaltyTransaction[]>([]);
  const [loyaltyVouchers, setLoyaltyVouchers] = useState<LoyaltyVoucher[]>([]);

  // Feedback & Reviews state (stored in Firebase Firestore)
  const [feedbacks, setFeedbacks] = useState<CustomerFeedback[]>([]);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [selectedOrderForFeedback, setSelectedOrderForFeedback] = useState<Order | null>(null);

  useEffect(() => {
    const unsub = subscribeToCustomerFeedback((list) => {
      setFeedbacks(list);
    });
    return unsub;
  }, []);

  const userFeedbacks = useMemo(() => {
    if (!user) return [];
    const uEmail = user.email.toLowerCase();
    const uId = user.id;
    const uMob = user.mobile || '';
    return feedbacks.filter((f) => {
      if (f.customerId && f.customerId === uId) return true;
      if (f.customerEmail && f.customerEmail.toLowerCase() === uEmail) return true;
      if (uMob && f.customerMobile && f.customerMobile === uMob) return true;
      return false;
    });
  }, [feedbacks, user]);

  useEffect(() => {
    if (user) {
      const profile =
        getSukiProfileByIdentifier(user.id) ||
        getSukiProfileByIdentifier(user.email) ||
        getSukiProfileByIdentifier(user.mobile);
      setSukiProfile(profile);

      if (profile) {
        setLoyaltyTransactions(getLoyaltyTransactions(profile.customerId));
        setLoyaltyVouchers(getLoyaltyVouchers(profile.customerId));
      }
    }
  }, [user, activeTab]);

  // Handle push notification permission toggle
  const handleEnablePush = async () => {
    setEnablingPush(true);
    const granted = await requestNotificationPermission();
    setPushPermission(getNotificationPermission());
    setEnablingPush(false);
    if (granted) {
      toast.success('Push notification alerts activated for your bilao orders!');
    }
  };

  // Handle 1-click enrollment for Salo-Salo Rewards
  const handleEnrollLoyalty = () => {
    if (!user) return;
    const names = user.name.split(' ');
    const firstName = names[0] || 'Suki';
    const lastName = names.slice(1).join(' ') || 'Customer';

    const newProfile = registerSukiProfile({
      firstName,
      lastName,
      email: user.email,
      mobile: user.mobile || '0917-000-0000',
      customerType: 'individual',
      registrationSource: 'online',
      preferredChannel: 'viber',
    });

    setSukiProfile(newProfile);
    setLoyaltyTransactions(getLoyaltyTransactions(newProfile.customerId));
    setLoyaltyVouchers(getLoyaltyVouchers(newProfile.customerId));
    toast.success('🎉 Welcome to Salo-Salo Rewards! 50 bonus points have been credited to your account!');
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  const orders = getOrders().filter(
    (o) => o.customer.email === user.email || o.customer.id === user.id
  );
  const notifications = getNotifications();
  const unreadCount = notifications.filter((n) => !n.read).length;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'loyalty', label: 'Loyalty & Rewards', icon: Award, badge: sukiProfile ? `${sukiProfile.pointsBalance} pts` : 'New' },
    { id: 'orders', label: 'Orders', icon: Package, badge: orders.length > 0 ? String(orders.length) : undefined },
    { id: 'reviews', label: 'Reviews & Feedback', icon: MessageSquare, badge: userFeedbacks.length > 0 ? String(userFeedbacks.length) : undefined },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount > 0 ? String(unreadCount) : undefined },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <div className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="md:col-span-1">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm sticky top-24">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-black text-primary mx-auto mb-3 shadow-inner">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <h2 className="font-black text-lg text-foreground" style={{ fontFamily: 'Nunito' }}>
                    {user.name}
                  </h2>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  <div className="flex items-center justify-center gap-1.5 mt-2">
                    <span className="badge-status bg-primary/15 text-primary text-[11px] font-bold capitalize">
                      {user.role}
                    </span>
                    {sukiProfile && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-700 dark:text-amber-400">
                        <Crown size={10} />
                        {sukiProfile.currentTier}
                      </span>
                    )}
                  </div>
                </div>

                <nav className="space-y-1.5">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`sidebar-nav-item w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                        activeTab === tab.id
                          ? 'bg-primary text-secondary font-black shadow-sm'
                          : 'text-foreground hover:bg-muted/70'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <tab.icon size={17} className={activeTab === tab.id ? 'text-secondary' : 'text-primary'} />
                        <span>{tab.label}</span>
                      </div>
                      {tab.badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                            activeTab === tab.id
                              ? 'bg-secondary text-primary'
                              : 'bg-primary/15 text-primary'
                          }`}
                        >
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  ))}
                  <div className="pt-2 border-t border-border mt-3">
                    <button
                      onClick={handleLogout}
                      className="sidebar-nav-item w-full text-destructive hover:bg-destructive/10 px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2.5 transition-colors"
                    >
                      <LogOut size={17} /> Logout
                    </button>
                  </div>
                </nav>
              </div>
            </div>

            {/* Main content */}
            <div className="md:col-span-3">
              {/* TAB: Overview */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-black text-foreground mb-1" style={{ fontFamily: 'Nunito' }}>
                      Welcome back, {user.name.split(' ')[0]}! 👋
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      Track your party bilao orders, Salo-Salo loyalty points, and account settings.
                    </p>
                  </div>

                  {/* Summary Stat Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div
                      onClick={() => setActiveTab('loyalty')}
                      className="admin-stat-card p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-transparent border border-amber-500/30 cursor-pointer hover:border-amber-500 transition-all text-center group"
                    >
                      <Award size={26} className="mx-auto mb-1.5 text-amber-600 group-hover:scale-110 transition-transform" />
                      <p className="text-2xl font-black text-amber-700 dark:text-amber-400" style={{ fontFamily: 'Nunito' }}>
                        {sukiProfile ? sukiProfile.pointsBalance : 0}
                      </p>
                      <p className="text-[11px] font-bold text-muted-foreground">Loyalty Points</p>
                      <span className="text-[10px] text-amber-600 font-semibold block mt-0.5">
                        {sukiProfile ? `₱${sukiProfile.monetaryValue} Value` : 'Tap to Join'}
                      </span>
                    </div>

                    {[
                      {
                        label: 'Total Orders',
                        value: orders.length,
                        icon: Package,
                        color: 'text-primary',
                        tab: 'orders',
                      },
                      {
                        label: 'Completed',
                        value: orders.filter((o) => o.status === 'completed').length,
                        icon: Star,
                        color: 'text-green-600',
                        tab: 'orders',
                      },
                      {
                        label: 'In Progress',
                        value: orders.filter((o) =>
                          ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(o.status)
                        ).length,
                        icon: RotateCcw,
                        color: 'text-blue-600',
                        tab: 'orders',
                      },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        onClick={() => setActiveTab(stat.tab)}
                        className="admin-stat-card p-4 rounded-2xl bg-card border border-border text-center cursor-pointer hover:border-primary/50 transition-all"
                      >
                        <stat.icon size={26} className={`mx-auto mb-1.5 ${stat.color}`} />
                        <p className="text-2xl font-black text-foreground" style={{ fontFamily: 'Nunito' }}>
                          {stat.value}
                        </p>
                        <p className="text-[11px] font-bold text-muted-foreground">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Loyalty Quick Banner */}
                  {sukiProfile ? (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-secondary via-secondary to-[#42220f] text-secondary-foreground border border-primary/30 flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
                          <Crown size={24} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-base text-primary">Salo-Salo Rewards</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-secondary font-black uppercase">
                              {sukiProfile.currentTier}
                            </span>
                          </div>
                          <p className="text-xs text-secondary-foreground/80 mt-0.5">
                            You have <strong className="text-primary">{sukiProfile.pointsBalance} Points</strong> (worth <strong>₱{sukiProfile.monetaryValue} discount</strong>) ready to use at checkout!
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setActiveTab('loyalty')}
                          className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-secondary text-xs font-black transition-all shadow-sm flex items-center gap-1.5"
                        >
                          View Loyalty Tab <ArrowRight size={13} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-between gap-4 flex-wrap">
                      <div>
                        <h3 className="font-black text-sm text-foreground flex items-center gap-1.5">
                          <Sparkles size={16} className="text-primary" /> Join Salo-Salo Rewards
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Earn 2 points for every ₱200 spent on party bilao orders and redeem points for direct discounts!
                        </p>
                      </div>
                      <button
                        onClick={handleEnrollLoyalty}
                        className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-secondary text-xs font-black shadow-sm"
                      >
                        Enroll & Get 50 Pts
                      </button>
                    </div>
                  )}

                  {/* Recent orders */}
                  <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-bold text-base text-foreground" style={{ fontFamily: 'Nunito' }}>
                        Recent Orders
                      </h2>
                      <button
                        onClick={() => setActiveTab('orders')}
                        className="text-primary text-xs font-bold hover:underline"
                      >
                        View All ({orders.length})
                      </button>
                    </div>

                    {orders.length === 0 ? (
                      <div className="text-center py-10">
                        <Package size={40} className="text-muted-foreground/40 mx-auto mb-3" />
                        <p className="text-muted-foreground text-xs">No orders yet. Let's feast on Kimae's bilao!</p>
                        <Link to="/menu" className="btn-primary mt-4 inline-flex text-xs">
                          Order Now 🎉
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {orders.slice(0, 3).map((order) => (
                          <div
                            key={order.id}
                            className="flex items-center gap-4 p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-xs text-foreground truncate">{order.orderNumber}</p>
                              <p className="text-[11px] text-muted-foreground">
                                {new Date(order.createdAt).toLocaleDateString('en-PH')} • {order.items.length} item(s)
                              </p>
                            </div>
                            <OrderStatusBadge status={order.status} size="sm" />
                            <p className="font-black text-primary text-xs" style={{ fontFamily: 'Nunito' }}>
                              {formatPrice(order.total)}
                            </p>
                            <div className="flex items-center gap-1.5">
                              {feedbacks.some(f => f.orderId === order.id || f.orderNumber === order.orderNumber) ? (
                                <button
                                  onClick={() => {
                                    setSelectedOrderForFeedback(order);
                                    setFeedbackModalOpen(true);
                                  }}
                                  className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 flex items-center justify-center transition-colors"
                                  title="View or update your review"
                                >
                                  <Star size={14} className="fill-amber-500" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSelectedOrderForFeedback(order);
                                    setFeedbackModalOpen(true);
                                  }}
                                  className="w-8 h-8 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 flex items-center justify-center transition-colors"
                                  title="Rate feast & earn 15 pts"
                                >
                                  <Star size={14} />
                                </button>
                              )}
                              <Link
                                to={`/track/${order.id}`}
                                className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-foreground hover:text-primary transition-colors"
                                title="Track Order"
                              >
                                <Eye size={14} />
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: Loyalty & Rewards */}
              {activeTab === 'loyalty' && (
                <div className="space-y-6">
                  <CustomerLoyaltyRewardsModule />
                </div>
              )}

              {/* TAB: Orders */}
              {activeTab === 'orders' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-foreground" style={{ fontFamily: 'Nunito' }}>
                      My Orders
                    </h2>
                    <Link to="/menu" className="btn-primary px-3 py-1.5 text-xs font-bold">
                      Order More Bilao 🍱
                    </Link>
                  </div>

                  {orders.length === 0 ? (
                    <div className="bg-card rounded-2xl border border-border p-12 text-center">
                      <Package size={50} className="text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-base font-bold mb-1">No orders yet</p>
                      <p className="text-xs text-muted-foreground mb-4">
                        Explore our famous Pancit Malabon, Palabok, and Party Bilaos!
                      </p>
                      <Link to="/menu" className="btn-primary text-xs inline-flex">
                        Explore Menu
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div key={order.id} className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-3">
                          <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-black text-base text-foreground" style={{ fontFamily: 'Nunito' }}>
                                  {order.orderNumber}
                                </span>
                                <OrderStatusBadge status={order.status} />
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Placed on {new Date(order.createdAt).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-black text-primary" style={{ fontFamily: 'Nunito' }}>
                                {formatPrice(order.total)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {order.items.length} item{order.items.length !== 1 ? 's' : ''} • {order.deliveryMethod}
                              </p>
                            </div>
                          </div>

                          <div className="bg-muted/40 rounded-xl p-3 text-xs space-y-1">
                            {order.items.map((it, idx) => (
                              <div key={idx} className="flex justify-between items-center text-foreground">
                                <span>
                                  <strong>{it.quantity}x</strong> {it.product.name}
                                </span>
                                <span className="font-bold">
                                  {formatPrice(((it.product.promoPrice || it.product.price) + it.optionPriceAdd) * it.quantity)}
                                </span>
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-border flex-wrap gap-2">
                            <span className="text-[11px] text-muted-foreground">
                              Payment: <strong className="capitalize">{order.paymentMethod}</strong> ({order.paymentStatus})
                            </span>
                            <div className="flex items-center gap-2">
                              {(() => {
                                const fb = feedbacks.find(
                                  (f) => f.orderId === order.id || f.orderNumber === order.orderNumber
                                );
                                if (fb) {
                                  return (
                                    <button
                                      onClick={() => {
                                        setSelectedOrderForFeedback(order);
                                        setFeedbackModalOpen(true);
                                      }}
                                      className="px-3.5 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs font-bold hover:bg-amber-500/20 transition-all flex items-center gap-1.5 shadow-sm"
                                      title="View or update your feedback review"
                                    >
                                      <Star size={13} className="fill-amber-500 text-amber-500" />
                                      <span>⭐ {fb.rating}/5 Reviewed</span>
                                    </button>
                                  );
                                }
                                return (
                                  <button
                                    onClick={() => {
                                      setSelectedOrderForFeedback(order);
                                      setFeedbackModalOpen(true);
                                    }}
                                    className="btn-primary py-1.5 px-3.5 text-xs flex items-center gap-1.5 font-bold shadow-sm"
                                  >
                                    <Star size={13} className="fill-current" /> Rate Feast (+15 Pts)
                                  </button>
                                );
                              })()}
                              <Link
                                to={`/track/${order.id}`}
                                className="btn-outline py-1.5 px-3.5 text-xs flex items-center gap-1 font-bold shadow-sm"
                              >
                                <Eye size={13} /> Track
                              </Link>
                              <Link
                                to={`/menu`}
                                className="btn-outline py-1.5 px-3.5 text-xs flex items-center gap-1 font-bold"
                              >
                                <RotateCcw size={13} /> Reorder
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB: Reviews & Feedback */}
              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <h2 className="text-2xl font-black text-foreground" style={{ fontFamily: 'Nunito' }}>
                        Customer Feedback & Reviews
                      </h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Your honest reviews stored securely in Firebase Firestore and linked to your account
                      </p>
                    </div>
                    {orders.length > 0 && (
                      <button
                        onClick={() => {
                          const unrated = orders.find(
                            (o) => !feedbacks.some((f) => f.orderId === o.id || f.orderNumber === o.orderNumber)
                          );
                          setSelectedOrderForFeedback(unrated || orders[0]);
                          setFeedbackModalOpen(true);
                        }}
                        className="btn-primary px-4 py-2 text-xs font-black shadow-sm flex items-center gap-1.5"
                      >
                        <Star size={14} className="fill-current" /> Rate an Order (+15 Pts)
                      </button>
                    )}
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center flex-shrink-0">
                        <Star size={24} className="fill-amber-500" />
                      </div>
                      <div>
                        <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Reviews Submitted</p>
                        <p className="text-2xl font-black text-foreground" style={{ fontFamily: 'Nunito' }}>
                          {userFeedbacks.length}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                        <Award size={24} />
                      </div>
                      <div>
                        <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Bonus Points Earned</p>
                        <p className="text-2xl font-black text-primary" style={{ fontFamily: 'Nunito' }}>
                          +{userFeedbacks.length * 15} pts
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0">
                        <ShieldCheck size={24} />
                      </div>
                      <div>
                        <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Firebase Sync</p>
                        <p className="text-sm font-black text-emerald-600">Active & Linked</p>
                        <p className="text-[10px] text-muted-foreground">ID: {user.id}</p>
                      </div>
                    </div>
                  </div>

                  {/* Unrated Orders Banner */}
                  {(() => {
                    const unratedOrders = orders.filter(
                      (o) => !feedbacks.some((f) => f.orderId === o.id || f.orderNumber === o.orderNumber)
                    );
                    if (unratedOrders.length === 0) return null;
                    return (
                      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-500 text-secondary flex items-center justify-center flex-shrink-0 font-black">
                            <Sparkles size={18} />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-foreground">
                              You have {unratedOrders.length} order{unratedOrders.length > 1 ? 's' : ''} waiting for review!
                            </h4>
                            <p className="text-[11px] text-muted-foreground">
                              Leave quick feedback for Order #{unratedOrders[0].orderNumber} to earn 15 bonus loyalty points.
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedOrderForFeedback(unratedOrders[0]);
                            setFeedbackModalOpen(true);
                          }}
                          className="btn-primary text-xs px-4 py-2 font-black self-end sm:self-center"
                        >
                          Review #{unratedOrders[0].orderNumber}
                        </button>
                      </div>
                    );
                  })()}

                  {/* Review List */}
                  {userFeedbacks.length === 0 ? (
                    <div className="bg-card rounded-2xl border border-border p-12 text-center shadow-sm">
                      <MessageSquare size={48} className="text-muted-foreground/30 mx-auto mb-3" />
                      <h3 className="text-base font-bold text-foreground mb-1">No Reviews Yet</h3>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-5">
                        Share your feedback on our party bilaos, pancit trays, and sweets to earn 15 bonus loyalty points per review.
                      </p>
                      {orders.length > 0 ? (
                        <button
                          onClick={() => {
                            setSelectedOrderForFeedback(orders[0]);
                            setFeedbackModalOpen(true);
                          }}
                          className="btn-primary text-xs px-6 py-2.5 font-black inline-flex items-center gap-1.5"
                        >
                          <Star size={14} className="fill-current" /> Rate Your Recent Order
                        </button>
                      ) : (
                        <Link to="/menu" className="btn-primary text-xs inline-flex">
                          Explore Menu
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {userFeedbacks.map((fb) => {
                        const matchingOrder = orders.find((o) => o.id === fb.orderId || o.orderNumber === fb.orderNumber);
                        return (
                          <div
                            key={fb.id}
                            className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-3 hover:border-primary/40 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-3 flex-wrap">
                              <div>
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                      <Star
                                        key={s}
                                        size={15}
                                        className={s <= fb.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                                    {fb.rating}.0 / 5.0
                                  </span>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                                    Order #{fb.orderNumber}
                                  </span>
                                </div>
                                <p className="text-[11px] text-muted-foreground mt-1">
                                  Submitted on {new Date(fb.createdAt).toLocaleDateString('en-PH', { dateStyle: 'medium' })} • Stored in Firebase
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 flex items-center gap-1">
                                  <Award size={13} /> +15 Suki Points
                                </span>
                                {matchingOrder && (
                                  <button
                                    onClick={() => {
                                      setSelectedOrderForFeedback(matchingOrder);
                                      setFeedbackModalOpen(true);
                                    }}
                                    className="px-3 py-1 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-colors flex items-center gap-1"
                                  >
                                    <Edit3 size={12} /> Edit
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Tags */}
                            {fb.tags && fb.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {fb.tags.map((t, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-foreground"
                                  >
                                    ✓ {t}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Review Text */}
                            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/70 text-xs text-foreground leading-relaxed italic">
                              "{fb.reviewText}"
                            </div>

                            {/* Order Items */}
                            {fb.orderItems && fb.orderItems.length > 0 && (
                              <div className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
                                <Package size={13} className="text-primary flex-shrink-0" />
                                <span className="font-semibold">Items:</span> {fb.orderItems.join(', ')}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB: Notifications */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h2 className="text-2xl font-black text-foreground" style={{ fontFamily: 'Nunito' }}>
                      Notifications & Alerts
                    </h2>
                    <span className="text-xs text-muted-foreground">
                      Service Worker Push: <strong className={pushPermission === 'granted' ? 'text-emerald-600' : 'text-amber-600'}>{pushPermission}</strong>
                    </span>
                  </div>

                  {/* Browser Push Notification Permission Card */}
                  <div className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between gap-4 flex-wrap shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                        <Smartphone size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-foreground">
                          Live Push Notifications for Order Updates
                        </h4>
                        <p className="text-[11px] text-muted-foreground">
                          Get real-time service worker alerts on your phone or desktop when your bilao is 'Out for Delivery' or 'Ready for Pickup'!
                        </p>
                      </div>
                    </div>
                    <div>
                      {pushPermission === 'granted' ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 font-bold text-xs">
                          <CheckCircle2 size={14} /> Alerts Active
                        </span>
                      ) : (
                        <button
                          onClick={handleEnablePush}
                          disabled={enablingPush}
                          className="btn-primary px-4 py-2 text-xs font-black shadow-sm"
                        >
                          {enablingPush ? 'Activating...' : 'Enable Push Alerts 🔔'}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {notifications.length === 0 ? (
                      <div className="bg-card rounded-2xl border border-border p-12 text-center">
                        <Bell size={50} className="text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-xs text-muted-foreground">No in-app notifications yet</p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => markNotificationRead(notif.id)}
                          className={`bg-card rounded-xl border border-border p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                            !notif.read ? 'border-primary/40 bg-primary/5' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                !notif.read ? 'bg-primary' : 'bg-transparent'
                              }`}
                            />
                            <div className="flex-1">
                              <p className="font-semibold text-xs text-foreground">{notif.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                              <p className="text-[10px] text-muted-foreground mt-1">
                                {new Date(notif.createdAt).toLocaleString('en-PH')}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB: Settings */}
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-black text-foreground" style={{ fontFamily: 'Nunito' }}>
                    Account Settings
                  </h2>
                  <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                    <h3 className="font-bold text-sm mb-4 text-foreground">Profile Information</h3>
                    <div className="space-y-3">
                      {[
                        { label: 'Full Name', value: user.name },
                        { label: 'Email Address', value: user.email },
                        { label: 'Mobile Number', value: user.mobile || 'Not set' },
                        { label: 'Role / Account Type', value: user.role.toUpperCase() },
                      ].map((field) => (
                        <div
                          key={field.label}
                          className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/20"
                        >
                          <div>
                            <p className="text-[11px] text-muted-foreground">{field.label}</p>
                            <p className="font-semibold text-xs text-foreground mt-0.5">{field.value}</p>
                          </div>
                          <span className="text-[11px] text-primary font-bold">Verified</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Customer Feedback & Review Modal (Firebase synced) */}
      <CustomerFeedbackModal
        isOpen={feedbackModalOpen}
        onClose={() => {
          setFeedbackModalOpen(false);
          setSelectedOrderForFeedback(null);
        }}
        order={selectedOrderForFeedback}
        onSuccess={() => {
          // Toast is shown in modal; modal will close or stay with submitted card
        }}
      />

      <Footer />
      <MobileNav />
    </div>
  );
}
