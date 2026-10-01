import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, Package, Heart, MapPin, Bell, Settings, LogOut,
  ChevronRight, Star, RotateCcw, Eye, Edit3, Plus
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';
import OrderStatusBadge from '@/components/features/OrderStatusBadge';
import { useAuth } from '@/hooks/useAuth';
import { getOrders, formatPrice, getNotifications, markNotificationRead } from '@/lib/store';

export default function AccountPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  if (!user) {
    navigate('/login');
    return null;
  }

  const orders = getOrders().filter(o => o.customer.email === user.email || o.customer.id === user.id);
  const notifications = getNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'notifications', label: `Notifications${unreadCount > 0 ? ` (${unreadCount})` : ''}`, icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="flex-1 bg-background py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="md:col-span-1">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-black text-primary mx-auto mb-3">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <h2 className="font-black text-lg" style={{ fontFamily: 'Nunito' }}>{user.name}</h2>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <span className="badge-status bg-primary/10 text-primary text-xs mt-2 capitalize">{user.role}</span>
                </div>

                <nav className="space-y-1">
                  {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                      className={`sidebar-nav-item w-full ${activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'}`}>
                      <tab.icon size={18} />
                      {tab.label}
                    </button>
                  ))}
                  <button onClick={handleLogout}
                    className="sidebar-nav-item w-full text-destructive hover:bg-destructive/5">
                    <LogOut size={18} /> Logout
                  </button>
                </nav>
              </div>
            </div>

            {/* Main content */}
            <div className="md:col-span-3">
              {/* Overview */}
              {activeTab === 'overview' && (
                <div>
                  <h1 className="text-2xl font-black mb-6" style={{ fontFamily: 'Nunito' }}>
                    Welcome back, {user.name.split(' ')[0]}! 👋
                  </h1>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                    {[
                      { label: 'Total Orders', value: orders.length, icon: Package, color: 'text-primary' },
                      { label: 'Completed', value: orders.filter(o => o.status === 'completed').length, icon: Star, color: 'text-green-600' },
                      { label: 'Pending', value: orders.filter(o => ['pending', 'confirmed', 'preparing'].includes(o.status)).length, icon: RotateCcw, color: 'text-amber-600' },
                    ].map(stat => (
                      <div key={stat.label} className="admin-stat-card text-center">
                        <stat.icon size={28} className={`mx-auto mb-2 ${stat.color}`} />
                        <p className="text-2xl font-black text-foreground" style={{ fontFamily: 'Nunito' }}>{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Recent orders */}
                  <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-bold text-lg" style={{ fontFamily: 'Nunito' }}>Recent Orders</h2>
                      <button onClick={() => setActiveTab('orders')} className="text-primary text-sm font-semibold hover:underline">View All</button>
                    </div>

                    {orders.length === 0 ? (
                      <div className="text-center py-10">
                        <Package size={40} className="text-muted mx-auto mb-3" />
                        <p className="text-muted-foreground">No orders yet. Let's change that!</p>
                        <Link to="/menu" className="btn-primary mt-4 inline-flex">Order Now 🎉</Link>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {orders.slice(0, 3).map(order => (
                          <div key={order.id} className="flex items-center gap-4 p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors">
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm">{order.orderNumber}</p>
                              <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString('en-PH')}</p>
                            </div>
                            <OrderStatusBadge status={order.status} size="sm" />
                            <p className="font-black text-primary text-sm" style={{ fontFamily: 'Nunito' }}>{formatPrice(order.total)}</p>
                            <Link to={`/track/${order.id}`} className="text-primary hover:text-brand-yellow-dark">
                              <Eye size={16} />
                            </Link>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Orders tab */}
              {activeTab === 'orders' && (
                <div>
                  <h2 className="text-2xl font-black mb-6" style={{ fontFamily: 'Nunito' }}>My Orders</h2>
                  {orders.length === 0 ? (
                    <div className="bg-card rounded-2xl border border-border p-12 text-center">
                      <Package size={60} className="text-muted mx-auto mb-4" />
                      <p className="text-lg font-bold mb-2">No orders yet</p>
                      <Link to="/menu" className="btn-primary mt-2 inline-flex">Order Now</Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map(order => (
                        <div key={order.id} className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                          <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div>
                              <p className="font-black text-lg" style={{ fontFamily: 'Nunito' }}>{order.orderNumber}</p>
                              <p className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                              <div className="mt-2">
                                <OrderStatusBadge status={order.status} />
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-black text-primary" style={{ fontFamily: 'Nunito' }}>{formatPrice(order.total)}</p>
                              <p className="text-sm text-muted-foreground">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <Link to={`/track/${order.id}`} className="btn-primary py-2 px-4 text-sm">
                              Track Order
                            </Link>
                            <button className="btn-outline py-2 px-4 text-sm flex items-center gap-1">
                              <RotateCcw size={14} /> Reorder
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Notifications tab */}
              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-2xl font-black mb-6" style={{ fontFamily: 'Nunito' }}>Notifications</h2>
                  <div className="space-y-3">
                    {notifications.length === 0 ? (
                      <div className="bg-card rounded-2xl border border-border p-12 text-center">
                        <Bell size={60} className="text-muted mx-auto mb-4" />
                        <p className="text-muted-foreground">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div key={notif.id}
                          onClick={() => markNotificationRead(notif.id)}
                          className={`bg-card rounded-xl border border-border p-4 cursor-pointer hover:bg-muted/50 transition-colors ${!notif.read ? 'border-primary/30 bg-primary/2' : ''}`}>
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!notif.read ? 'bg-primary' : 'bg-transparent'}`} />
                            <div className="flex-1">
                              <p className="font-semibold text-sm">{notif.title}</p>
                              <p className="text-sm text-muted-foreground mt-0.5">{notif.message}</p>
                              <p className="text-xs text-muted-foreground mt-1">{new Date(notif.createdAt).toLocaleString('en-PH')}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Settings tab */}
              {activeTab === 'settings' && (
                <div>
                  <h2 className="text-2xl font-black mb-6" style={{ fontFamily: 'Nunito' }}>Account Settings</h2>
                  <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                    <h3 className="font-bold mb-4">Profile Information</h3>
                    <div className="space-y-4">
                      {[
                        { label: 'Full Name', value: user.name },
                        { label: 'Email', value: user.email },
                        { label: 'Mobile', value: user.mobile },
                      ].map(field => (
                        <div key={field.label} className="flex items-center justify-between p-4 rounded-xl border border-border">
                          <div>
                            <p className="text-xs text-muted-foreground">{field.label}</p>
                            <p className="font-semibold">{field.value}</p>
                          </div>
                          <button className="text-primary hover:text-brand-yellow-dark">
                            <Edit3 size={16} />
                          </button>
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

      <Footer />
      <MobileNav />
    </div>
  );
}
