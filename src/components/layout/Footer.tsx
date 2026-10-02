import { Link } from 'react-router-dom';
import { Facebook, Instagram, Phone, Mail, MapPin, Clock, Heart, Award } from 'lucide-react';
import logoBadge from '@/assets/logo-badge.png';

export default function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground border-t border-secondary-foreground/10">
      {/* Main footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center gap-3">
              <img src={logoBadge} alt="Kimae's Party Bilao" className="h-14 w-14 rounded-full object-cover shadow-md" />
              <div>
                <h3 className="font-black text-xl text-primary leading-tight" style={{ fontFamily: 'Nunito' }}>
                  Kimae's
                </h3>
                <p className="text-xs text-primary/90 font-bold uppercase tracking-wider">Party Bilao</p>
                <p className="text-[10px] text-secondary-foreground/60">Since 2020</p>
              </div>
            </div>
            <p className="text-sm text-secondary-foreground/80 leading-relaxed">
              Your Partner for Every Occasion! Affordable solo dishes and convenient food packages for families, friends, workplaces, and celebrations.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <a
                href="https://www.facebook.com/kimaespartybilao/"
                target="_blank"
                rel="noopener noreferrer"
                title="Follow us on Facebook"
                className="w-10 h-10 rounded-xl bg-white/10 hover:bg-primary hover:text-secondary flex items-center justify-center transition-all shadow-sm"
              >
                <Facebook size={18} />
              </a>
              <a
                href="#"
                title="Follow us on Instagram"
                className="w-10 h-10 rounded-xl bg-white/10 hover:bg-primary hover:text-secondary flex items-center justify-center transition-all shadow-sm"
              >
                <Instagram size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-black text-primary text-sm uppercase tracking-wider mb-4">
              Explore Menu
            </h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/75">
              {[
                { label: 'Party Bilao Trays', path: '/menu?cat=party-bilao' },
                { label: 'Individual Food Trays', path: '/menu?cat=food-trays' },
                { label: 'Best Sellers', path: '/menu?cat=best-sellers' },
                { label: 'Solo Dishes & Meals', path: '/menu?cat=family-meals' },
                { label: 'Party Packages', path: '/menu?cat=party-packages' },
                { label: 'Track Order', path: '/track' },
              ].map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="hover:text-primary transition-colors flex items-center gap-1.5">
                    <span className="text-primary text-xs">›</span> {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer & Company */}
          <div>
            <h4 className="font-black text-primary text-sm uppercase tracking-wider mb-4">
              Company & Info
            </h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/75">
              {[
                { label: 'About Kimae’s Story', path: '/about' },
                { label: 'Our Mission & Vision', path: '/about' },
                { label: '6 Core Values', path: '/about' },
                { label: 'Contact Us & Location', path: '/contact' },
                { label: 'How to Order Guide', path: '/how-to-order' },
                { label: 'Customer Account', path: '/account' },
              ].map((link) => (
                <li key={link.label}>
                  <Link to={link.path} className="hover:text-primary transition-colors flex items-center gap-1.5">
                    <span className="text-primary text-xs">›</span> {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Location & Contact Details */}
          <div>
            <h4 className="font-black text-primary text-sm uppercase tracking-wider mb-4">
              Visit & Contact
            </h4>
            <ul className="space-y-3 text-xs text-secondary-foreground/80">
              <li className="flex items-start gap-2.5">
                <MapPin size={16} className="text-primary mt-0.5 flex-shrink-0" />
                <span className="leading-relaxed">
                  BLK 31 LOT 14 PUROK 3, Victoria Reyes, Dasmariñas, Cavite
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone size={16} className="text-primary mt-0.5 flex-shrink-0" />
                <div className="space-y-0.5">
                  <a href="tel:09915984112" className="hover:text-primary transition-colors block font-semibold">
                    0991 598 4112 (Orders & Operations)
                  </a>
                  <a href="tel:09617722601" className="hover:text-primary transition-colors block text-secondary-foreground/70">
                    0961 772 2601 (Business Consultant)
                  </a>
                </div>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail size={16} className="text-primary flex-shrink-0" />
                <a href="mailto:kimaespartybilao@gmail.com" className="hover:text-primary transition-colors truncate">
                  kimaespartybilao@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock size={16} className="text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Monday – Sunday: 7:00 AM – 9:00 PM</p>
                  <p className="text-[11px] text-secondary-foreground/60">Pickup & Coordinated Delivery</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 bg-secondary/80">
        <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-secondary-foreground/60">
          <p>© {new Date().getFullYear()} Kimae's Party Bilao. All rights reserved. Registered Food & Drinks Business.</p>
          <p className="flex items-center gap-1 font-medium">
            Good Food. Happy Family. Made with <Heart size={12} className="text-red-400 fill-red-400 inline" /> in Dasmariñas, Cavite
          </p>
          <div className="flex items-center gap-4">
            <Link to="/about" className="hover:text-primary transition-colors">About Us</Link>
            <Link to="/contact" className="hover:text-primary transition-colors">Contact</Link>
            <Link to="/how-to-order" className="hover:text-primary transition-colors">How to Order</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
