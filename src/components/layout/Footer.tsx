import { Link } from 'react-router-dom';
import { Facebook, Instagram, Phone, Mail, MapPin, Clock, Heart } from 'lucide-react';
import logoBadge from '@/assets/logo-badge.png';

export default function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      {/* Main footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img src={logoBadge} alt="Kimae's Party Bilao" className="h-14 w-14 rounded-full" />
              <div>
                <h3 className="font-black text-xl text-primary" style={{ fontFamily: 'Nunito' }}>Kimae's</h3>
                <p className="text-xs text-primary/80 font-semibold">Party Bilao</p>
              </div>
            </div>
            <p className="text-sm text-secondary-foreground/70 leading-relaxed mb-4">
              Your go-to party food destination! We bring authentic Filipino flavors to every celebration — birthdays, reunions, fiestas, and more.
            </p>
            <div className="flex items-center gap-3">
              <a href="https://www.facebook.com/kimaespartybilao/" target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-white/10 hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-all">
                <Facebook size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-xl bg-white/10 hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-all">
                <Instagram size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-primary mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/70">
              {[
                { label: 'Home', path: '/' },
                { label: 'Menu', path: '/menu' },
                { label: 'Party Bilao', path: '/menu?cat=party-bilao' },
                { label: 'Food Trays', path: '/menu?cat=food-trays' },
                { label: 'Promos', path: '/menu?cat=special-offers' },
                { label: 'Track My Order', path: '/track' },
              ].map(link => (
                <li key={link.path}>
                  <Link to={link.path} className="hover:text-primary transition-colors flex items-center gap-1">
                    <span className="text-primary text-xs">›</span> {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer */}
          <div>
            <h4 className="font-bold text-primary mb-4">Customer</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/70">
              {[
                { label: 'My Account', path: '/account' },
                { label: 'My Orders', path: '/account/orders' },
                { label: 'How to Order', path: '/how-to-order' },
                { label: 'About Us', path: '/about' },
                { label: 'Contact Us', path: '/contact' },
                { label: 'FAQ', path: '/faq' },
              ].map(link => (
                <li key={link.path}>
                  <Link to={link.path} className="hover:text-primary transition-colors flex items-center gap-1">
                    <span className="text-primary text-xs">›</span> {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-primary mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm text-secondary-foreground/70">
              <li className="flex items-start gap-2">
                <MapPin size={15} className="text-primary mt-0.5 flex-shrink-0" />
                <span>Caloocan City, Metro Manila, Philippines</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={15} className="text-primary flex-shrink-0" />
                <a href="tel:+639171234567" className="hover:text-primary">0917-123-4567</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={15} className="text-primary flex-shrink-0" />
                <a href="mailto:kimae@partybilao.ph" className="hover:text-primary">kimae@partybilao.ph</a>
              </li>
              <li className="flex items-start gap-2">
                <Clock size={15} className="text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p>Mon–Thu: 8:00 AM – 8:00 PM</p>
                  <p>Fri–Sat: 7:00 AM – 9:00 PM</p>
                  <p>Sunday: 7:00 AM – 8:00 PM</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-secondary-foreground/50">
          <p>© {new Date().getFullYear()} Kimae's Party Bilao. All rights reserved.</p>
          <p className="flex items-center gap-1">Made with <Heart size={12} className="text-red-400" /> in the Philippines</p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
