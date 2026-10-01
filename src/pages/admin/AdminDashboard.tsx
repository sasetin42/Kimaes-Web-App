import { useState } from 'react';
import AdminLayout from './AdminLayout';
import {
  ShoppingBag, Users, Bike, TrendingUp, Clock, CheckCircle,
  XCircle, DollarSign, Package, AlertCircle, ChefHat, Truck
} from 'lucide-react';
import { getOrders, formatPrice } from '@/lib/store';
import { MOCK_RIDERS } from '@/constants/data';
import OrderStatusBadge from '@/components/features/OrderStatusBadge';
import { Link } from 'react-router-dom';

const StatCard = ({ icon: Icon, label, value, color, sub }: { icon: any, label: string, value: string | number, color: string, sub?: string }) => (
  <div className="admin-stat-card">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-1">{label}</p>
        <p className="text-2xl font-black text-foreground" style={{ fontFamily: 'Nunito' }}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </div>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
    </div>
  </div>
);

export default function AdminDashboard() {
  const [dateFilter, setDateFilter] = useState('today');
  const orders = getOrders();

  const stats = {
    todayOrders: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    outForDelivery: orders.filter(o => o.status === 'out_for_delivery').length,
    completed: orders.filter(o => o.status === 'completed' || o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    revenue: orders.filter(o => !['cancelled', 'refunded'].includes(o.status)).reduce((s, o) => s + o.total, 0),
    avgOrder: orders.length > 0 ? orders.reduce((s, o) => s + o.total, 0) / orders.length : 0,
    activeRiders: MOCK_RIDERS.filter(r => r.status !== 'offline').length,
    totalCustomers: 2147,
  };

  const recentOrders = orders.slice(0, 5);

  return (
    <AdminLayout title="Dashboard">
      {/* Date filter */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        {['today', 'yesterday', 'this_week', 'this_month', 'last_month'].map(f => (
          <button key={f} onClick={() => setDateFilter(f)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${dateFilter === f ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:border-primary'}`}>
            {f.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={DollarSign} label="Today's Revenue" value={formatPrice(stats.revenue)} color="bg-primary" sub="All confirmed orders" />
        <StatCard icon={ShoppingBag} label="Total Orders" value={stats.todayOrders} color="bg-blue-500" sub="All time" />
        <StatCard icon={Clock} label="Pending" value={stats.pending} color="bg-amber-500" sub="Awaiting action" />
        <StatCard icon={ChefHat} label="Preparing" value={stats.preparing} color="bg-orange-500" sub="In kitchen" />
        <StatCard icon={Package} label="Ready" value={stats.ready} color="bg-teal-500" sub="Awaiting rider" />
        <StatCard icon={Truck} label="Out for Delivery" value={stats.outForDelivery} color="bg-indigo-500" sub="On the way" />
        <StatCard icon={CheckCircle} label="Completed" value={stats.completed} color="bg-green-500" sub="Delivered/Picked up" />
        <StatCard icon={XCircle} label="Cancelled" value={stats.cancelled} color="bg-red-500" sub="Today" />
        <StatCard icon={TrendingUp} label="Avg. Order Value" value={formatPrice(Math.round(stats.avgOrder))} color="bg-purple-500" sub="Per order" />
        <StatCard icon={Bike} label="Active Riders" value={stats.activeRiders} color="bg-cyan-500" sub={`of ${MOCK_RIDERS.length} total`} />
        <StatCard icon={Users} label="Total Customers" value={stats.totalCustomers.toLocaleString()} color="bg-pink-500" sub="+12 this week" />
        <StatCard icon={AlertCircle} label="Refund Requests" value={0} color="bg-gray-500" sub="Pending review" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-lg" style={{ fontFamily: 'Nunito' }}>Recent Orders</h2>
            <Link to="/admin/orders" className="text-primary text-sm font-semibold hover:underline">View All</Link>
          </div>
          <div className="space-y-3">
            {recentOrders.map(order => (
              <div key={order.id} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{order.orderNumber}</p>
                  <p className="text-xs text-muted-foreground">{order.customer.name}</p>
                </div>
                <OrderStatusBadge status={order.status} size="sm" />
                <p className="font-black text-sm text-primary flex-shrink-0" style={{ fontFamily: 'Nunito' }}>{formatPrice(order.total)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Riders */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-lg" style={{ fontFamily: 'Nunito' }}>Riders Status</h2>
            <Link to="/admin/riders" className="text-primary text-sm font-semibold hover:underline">Manage</Link>
          </div>
          <div className="space-y-3">
            {MOCK_RIDERS.map(rider => (
              <div key={rider.id} className="flex items-center gap-3 p-3 rounded-xl border border-border">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary text-sm flex-shrink-0">
                  {rider.user.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">{rider.user.name}</p>
                  <p className="text-xs text-muted-foreground">{rider.vehicleType} • {rider.todayDeliveries} deliveries today</p>
                </div>
                <span className={`badge-status text-xs ${
                  rider.status === 'online' || rider.status === 'available' ? 'bg-green-100 text-green-700' :
                  rider.status === 'busy' ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {rider.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
