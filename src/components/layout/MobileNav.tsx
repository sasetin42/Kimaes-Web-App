import { Link, useLocation } from 'react-router-dom';
import { Home, UtensilsCrossed, ShoppingCart, User, MapPin } from 'lucide-react';
import { useCart } from '@/hooks/useCart';

export default function MobileNav() {
  const location = useLocation();
  const { cartCount } = useCart();

  const tabs = [
    { path: '/', label: 'Home', Icon: Home },
    { path: '/menu', label: 'Menu', Icon: UtensilsCrossed },
    { path: '/cart', label: 'Cart', Icon: ShoppingCart, badge: cartCount },
    { path: '/track', label: 'Track', Icon: MapPin },
    { path: '/account', label: 'Account', Icon: User },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="sticky-bottom-nav bg-white border-t border-border shadow-warm md:hidden">
      <div className="flex items-center justify-around py-2 px-2">
        {tabs.map(({ path, label, Icon, badge }) => (
          <Link key={path} to={path}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
              isActive(path) ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <div className="relative">
              <Icon size={22} strokeWidth={isActive(path) ? 2.5 : 1.8} />
              {badge && badge > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </div>
            <span className="text-[10px] font-semibold">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
