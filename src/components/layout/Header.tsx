import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingCart, Menu, X, User, Search, Bell, MapPin,
  ChevronDown, LogOut, Settings, Package, Heart, Award
} from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import logoBadge from '@/assets/logo-badge.png';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { cartCount } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Menu', path: '/menu' },
    { label: 'Party Bilao', path: '/menu?cat=party-bilao' },
    { label: 'Food Trays', path: '/menu?cat=food-trays' },
    { label: 'Promos', path: '/menu?cat=special-offers' },
    { label: 'How to Order', path: '/how-to-order' },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path.split('?')[0]);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/menu?search=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'kitchen') return '/kitchen';
    if (user.role === 'rider') return '/rider';
    return '/account';
  };

  return (
    <>
      {/* Top bar */}
      <div className="bg-secondary text-secondary-foreground py-2 px-4 text-xs hidden md:block">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <MapPin size={12} className="text-primary" />
              BLK 31 LOT 14 PUROK 3, Victoria Reyes, Dasmariñas, Cavite
            </span>
            <span>📞 0991 598 4112 / 0961 772 2601</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Mon–Sun: 7:00 AM – 9:00 PM</span>
            <span className="text-primary font-semibold">🎉 Good Food. Happy Family. Your Partner for Every Occasion!</span>
          </div>
        </div>
      </div>

      {/* Main header */}
      <header className="sticky top-0 z-50 bg-white border-b border-border shadow-warm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 flex-shrink-0">
              <img src={logoBadge} alt="Kimae's Party Bilao" className="h-11 w-11 rounded-full object-cover" />
              <div className="hidden sm:block">
                <span className="font-black text-xl text-secondary leading-tight block" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  Kimae's
                </span>
                <span className="text-xs text-primary font-bold leading-none block -mt-0.5">Party Bilao</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.slice(0, 6).map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors duration-200 ${
                    isActive(link.path)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-secondary hover:text-primary hover:bg-muted'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 rounded-xl text-secondary hover:text-primary hover:bg-muted transition-colors"
                aria-label="Search"
              >
                <Search size={20} />
              </button>

              {/* Track Order */}
              <Link
                to="/track"
                className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-secondary hover:text-primary hover:bg-muted transition-colors"
              >
                <MapPin size={16} />
                <span>Track</span>
              </Link>

              {/* Cart */}
              <Link to="/cart" className="relative p-2 rounded-xl text-secondary hover:text-primary hover:bg-muted transition-colors">
                <ShoppingCart size={22} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-black w-5 h-5 rounded-full flex items-center justify-center pulse-yellow">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>

              {/* User */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-secondary hover:text-primary hover:bg-muted transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-black">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden md:block max-w-[100px] truncate">{user.name.split(' ')[0]}</span>
                    <ChevronDown size={14} />
                  </button>

                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-border rounded-2xl shadow-warm z-50 py-2">
                        <div className="px-4 py-3 border-b border-border">
                          <p className="font-bold text-sm text-foreground">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                          <span className="badge-status bg-primary/10 text-primary text-xs mt-1 capitalize">
                            {user.role}
                          </span>
                        </div>
                        <Link to={getDashboardLink()} onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted transition-colors">
                          <User size={16} className="text-primary" />
                          <span>Dashboard</span>
                        </Link>
                        {user.role === 'customer' && (
                          <>
                            <Link to="/account" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted transition-colors">
                              <Award size={16} className="text-amber-500" />
                              <span className="font-semibold text-foreground">Suki Loyalty Rewards</span>
                            </Link>
                            <Link to="/account/orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted transition-colors">
                              <Package size={16} className="text-primary" />
                              <span>My Orders</span>
                            </Link>
                            <Link to="/account/favorites" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted transition-colors">
                              <Heart size={16} className="text-primary" />
                              <span>Favorites</span>
                            </Link>
                          </>
                        )}
                        <Link to="/account/settings" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted transition-colors">
                          <Settings size={16} className="text-muted-foreground" />
                          <span>Settings</span>
                        </Link>
                        <div className="border-t border-border mt-1 pt-1">
                          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-sm text-destructive hover:bg-destructive/5 transition-colors w-full">
                            <LogOut size={16} />
                            <span>Logout</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Link to="/login" className="hidden md:flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-bold hover:bg-brand-yellow-dark transition-colors shadow-brand">
                  <User size={16} />
                  Login
                </Link>
              )}

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2 rounded-xl text-secondary hover:bg-muted transition-colors"
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>

          {/* Search bar */}
          {searchOpen && (
            <div className="pb-3">
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search bilao, pancit, lumpia..."
                  className="input-field flex-1"
                />
                <button type="submit" className="btn-primary py-3 px-4">
                  <Search size={18} />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="lg:hidden bg-white border-t border-border">
            <div className="container mx-auto px-4 py-3 flex flex-col gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileOpen(false)}
                  className={`px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                    isActive(link.path)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-secondary hover:bg-muted'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link to="/track" onClick={() => setMobileOpen(false)} className="px-4 py-3 rounded-xl text-sm font-semibold text-secondary hover:bg-muted flex items-center gap-2">
                <MapPin size={16} /> Track My Order
              </Link>
              {!user && (
                <div className="pt-2 border-t border-border mt-1">
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-primary w-full justify-center flex">
                    Login / Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
