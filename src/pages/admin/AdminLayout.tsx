import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingBag, Users, Bike, Percent,
  Settings, ChevronLeft, Menu, X, ChefHat, BarChart2, Bell,
  MapPin, Warehouse, LogOut, ExternalLink, Store, Truck, ShoppingCart, UserCheck, Calculator
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import logoBadge from '@/assets/logo-badge.png';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/pos', label: 'POS Terminal', icon: Calculator, isPos: true },
  { path: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { path: '/admin/products', label: 'Products', icon: Package },
  { path: '/admin/inventory', label: 'Inventory Central', icon: Warehouse },
  { path: '/admin/purchasing', label: 'Purchasing & POs', icon: ShoppingCart },
  { path: '/admin/suppliers', label: 'Suppliers Directory', icon: Truck },
  { path: '/admin/customers', label: 'CRM & Loyalty', icon: Users },
  { path: '/admin/staff', label: 'Employees & PINs', icon: UserCheck },
  { path: '/admin/reports', label: 'Sales & Analytics', icon: BarChart2 },
  { path: '/admin/kitchen', label: 'Kitchen Display', icon: ChefHat },
  { path: '/admin/riders', label: 'Riders Fleet', icon: Bike },
  { path: '/admin/delivery-zones', label: 'Delivery Zones', icon: MapPin },
  { path: '/admin/promos', label: 'Promos & Vouchers', icon: Percent },
  { path: '/admin/settings', label: 'Store Settings', icon: Settings },
];

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isActive = (path: string, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-muted overflow-hidden">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300
        ${collapsed ? 'w-16' : 'w-64'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:relative lg:inset-auto
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-sidebar-border">
          <img src={logoBadge} alt="" className="h-9 w-9 rounded-full flex-shrink-0" />
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="font-black text-sm text-sidebar-primary" style={{ fontFamily: 'Nunito' }}>Kimae's</p>
              <p className="text-[10px] text-sidebar-foreground/60">Party Bilao Admin</p>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:flex ml-auto text-sidebar-foreground/60 hover:text-sidebar-foreground">
            <ChevronLeft size={18} className={`transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`sidebar-nav-item mb-1 ${
                isActive(item.path, item.exact)
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground font-bold'
                  : item.isPos
                  ? 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 font-bold border border-amber-500/30'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              } ${collapsed ? 'justify-center px-2' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon size={18} className={`flex-shrink-0 ${item.isPos ? 'text-amber-600' : ''}`} />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && item.isPos && (
                <span className="ml-auto text-[10px] bg-amber-500 text-white font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                  Live
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-sidebar-border space-y-1">
          <Link to="/" className={`sidebar-nav-item text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent ${collapsed ? 'justify-center px-2' : ''}`}>
            <ExternalLink size={16} className="flex-shrink-0" />
            {!collapsed && <span className="text-xs">View Store</span>}
          </Link>
          <button onClick={handleLogout} className={`sidebar-nav-item w-full text-destructive hover:bg-destructive/10 ${collapsed ? 'justify-center px-2' : ''}`}>
            <LogOut size={16} className="flex-shrink-0" />
            {!collapsed && <span className="text-xs">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-border px-4 py-3 flex items-center gap-4 flex-shrink-0">
          <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 rounded-lg hover:bg-muted">
            <Menu size={20} />
          </button>
          <h1 className="font-black text-lg text-secondary truncate" style={{ fontFamily: 'Nunito' }}>
            {title || 'Admin Dashboard'}
          </h1>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs font-bold text-amber-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Cloud Firestore Live
            </div>
            <button className="relative p-2 rounded-lg hover:bg-muted text-muted-foreground">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-black text-primary-foreground">
                {user?.name.charAt(0) || 'A'}
              </div>
              <span className="hidden md:block text-sm font-semibold text-foreground">{user?.name}</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
