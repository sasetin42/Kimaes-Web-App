import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Star, ChevronRight, Users, Clock, Truck, ShieldCheck,
  Phone, MapPin, Quote, ArrowRight, Sparkles, PartyPopper
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';
import ProductCard from '@/components/features/ProductCard';
import TodaysSpecials from '@/components/features/TodaysSpecials';
import { PRODUCTS as FALLBACK_PRODUCTS, CATEGORIES, SAMPLE_REVIEWS } from '@/constants/data';
import { useCart } from '@/hooks/useCart';
import { formatPrice } from '@/lib/store';
import { getCentralProducts, subscribeToProductUpdates, areProductsEqual } from '@/lib/inventoryStore';
import { subscribeToCustomerFeedback } from '@/services/feedbackService';
import type { Product, CustomerFeedback } from '@/types';
import heroImg from '@/assets/hero-bilao.jpg';
import bilaoSpread from '@/assets/bilao-spread.jpg';
import aboutBanner from '@/assets/about-banner.jpg';
import { useNavigate as useNav } from 'react-router-dom';
import { useEffect, useMemo, useCallback } from 'react';

export default function Index() {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [allProducts, setAllProducts] = useState(getCentralProducts());
  const [liveFeedbacks, setLiveFeedbacks] = useState<CustomerFeedback[]>([]);

  useEffect(() => {
    const unsub = subscribeToProductUpdates(() => {
      setAllProducts((prev) => {
        const next = getCentralProducts();
        return areProductsEqual(prev, next) ? prev : next;
      });
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsubFeedback = subscribeToCustomerFeedback((list) => {
      setLiveFeedbacks(list);
    });
    return unsubFeedback;
  }, []);

  const featured = useMemo(() => allProducts.filter(p => p.featured), [allProducts]);
  const bestSellers = useMemo(() => allProducts.filter(p => p.bestSeller), [allProducts]);

  const handleAddToCart = useCallback((product: Product) => {
    navigate(`/product/${product.id}`);
  }, [navigate]);

  const howToOrder = [
    { step: 1, icon: '🍽️', title: 'Choose Your Food', desc: 'Browse our menu and pick your favorite bilao, food trays, or packages.' },
    { step: 2, icon: '✏️', title: 'Customize', desc: 'Choose your bilao size, food selections, and add-ons to make it perfect.' },
    { step: 3, icon: '🚚', title: 'Delivery or Pickup', desc: 'Choose home delivery or convenient store pickup.' },
    { step: 4, icon: '💳', title: 'Pay Securely', desc: 'Pay via GCash, Maya, bank transfer, or cash on delivery.' },
    { step: 5, icon: '📍', title: 'Track Your Order', desc: 'Follow your order in real-time from kitchen to your doorstep.' },
    { step: 6, icon: '🎉', title: 'Enjoy!', desc: 'Dig in and enjoy the feast with family and friends!' },
  ];

  const whyUs = [
    { icon: <ShieldCheck size={28} className="text-primary" />, title: 'Fresh Ingredients', desc: 'We use only the freshest, quality ingredients in every bilao.' },
    { icon: <Clock size={28} className="text-primary" />, title: 'On-Time Delivery', desc: 'We respect your event time. Punctual delivery, always.' },
    { icon: <Users size={28} className="text-primary" />, title: 'Perfect for Any Crowd', desc: 'From intimate family dinners to large barangay fiestas.' },
    { icon: <Truck size={28} className="text-primary" />, title: 'Wide Delivery Area', desc: 'Dasmariñas, Cavite and coordinated delivery & pickup locations.' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero */}
      <section className="relative hero-gradient overflow-hidden">
        <div className="absolute inset-0 woven-bg opacity-30" />
        <img src={heroImg} alt="Party Bilao" className="absolute inset-0 w-full h-full object-cover opacity-20" />

        <div className="relative container mx-auto px-4 py-16 md:py-24 lg:py-28">
          <div className="max-w-2xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 text-primary rounded-full px-4 py-2 text-sm font-semibold mb-6">
              <Sparkles size={14} />
              Order Online — Delivery & Pickup Available
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-4"
              style={{ fontFamily: 'Nunito' }}>
              Kimae's<br />
              <span className="text-primary">Party Bilao</span>
            </h1>

            <p className="text-lg text-white/80 mb-3 leading-relaxed">
              Authentic Filipino party food for every celebration — birthdays, reunions, fiestas, and more!
            </p>

            <div className="flex items-center gap-4 text-white/60 text-sm mb-8">
              <span className="flex items-center gap-1.5">
                <Star size={14} className="fill-primary text-primary" />
                <span className="text-white font-semibold">4.9</span> rating
              </span>
              <span>•</span>
              <span>2,000+ happy customers</span>
              <span>•</span>
              <span>Free delivery over ₱2,000</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/menu" className="btn-primary text-center text-lg px-8 py-4 flex items-center justify-center gap-2">
                <PartyPopper size={20} />
                Order Now
              </Link>
              <Link to="/menu" className="btn-outline border-white text-white hover:bg-white hover:text-secondary text-center text-lg px-8 py-4 flex items-center justify-center gap-2">
                View Menu
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>

        {/* Hero bottom wave */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-background" style={{ clipPath: 'ellipse(60% 100% at 50% 100%)' }} />
      </section>

      {/* Category pills */}
      <section className="py-6 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.filter(c => c.active).map(cat => (
              <Link
                key={cat.id}
                to={`/menu?cat=${cat.slug}`}
                className="flex-shrink-0 px-5 py-2.5 rounded-full border-2 border-border hover:border-primary hover:bg-primary hover:text-primary-foreground font-semibold text-sm text-secondary transition-all whitespace-nowrap"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Rotating Daily Discounts & Featured Deals */}
      <TodaysSpecials />

      {/* Featured Products */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-primary font-bold text-sm uppercase tracking-wide">Handpicked For You</span>
              <h2 className="section-title mt-1">Featured Products</h2>
            </div>
            <Link to="/menu" className="flex items-center gap-1 text-primary font-semibold text-sm hover:underline">
              View All <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {featured.slice(0, 4).map(product => (
              <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
            ))}
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      <section className="py-12 bg-muted/40">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-primary font-bold text-sm uppercase tracking-wide">Customer Favorites</span>
              <h2 className="section-title mt-1">⭐ Best Sellers</h2>
            </div>
            <Link to="/menu?cat=best-sellers" className="flex items-center gap-1 text-primary font-semibold text-sm hover:underline">
              See All <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {bestSellers.slice(0, 4).map(product => (
              <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} compact />
            ))}
          </div>
        </div>
      </section>

      {/* Party Package Banner */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="relative rounded-3xl overflow-hidden">
            <img src={bilaoSpread} alt="Party Package" className="w-full h-64 md:h-80 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-secondary/90 to-secondary/40 flex items-center px-8 md:px-16">
              <div className="max-w-md">
                <span className="badge-status bg-primary text-primary-foreground mb-3">🎉 Limited Offer</span>
                <h2 className="text-3xl md:text-4xl font-black text-white mb-3" style={{ fontFamily: 'Nunito' }}>
                  Complete Party<br />Packages
                </h2>
                <p className="text-white/80 mb-6">Everything you need for 20–25 persons. Bilao + Trays + Rice + Drinks — all in one!</p>
                <Link to="/menu?cat=party-packages" className="btn-primary inline-flex items-center gap-2">
                  Explore Packages <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-muted/40">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-primary font-bold text-sm uppercase tracking-wide">Simple Process</span>
            <h2 className="section-title mt-1">How to Order</h2>
            <p className="section-subtitle mt-3">Order your favorite party food in just a few easy steps</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {howToOrder.map(({ step, icon, title, desc }) => (
              <div key={step} className="text-center group">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-warm flex items-center justify-center text-3xl mx-auto mb-4 group-hover:shadow-brand transition-shadow">
                  {icon}
                </div>
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-black flex items-center justify-center mx-auto mb-2">
                  {step}
                </div>
                <h3 className="font-bold text-sm text-secondary mb-1" style={{ fontFamily: 'Nunito' }}>{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-primary" style={{ fontFamily: 'Nunito' }}>
              Why Choose Kimae's?
            </h2>
            <p className="text-secondary-foreground/70 mt-3 max-w-xl mx-auto">
              We take pride in delivering not just food, but unforgettable party experiences.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyUs.map(({ icon, title, desc }) => (
              <div key={title} className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition-colors">
                <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  {icon}
                </div>
                <h3 className="font-bold text-white mb-2" style={{ fontFamily: 'Nunito' }}>{title}</h3>
                <p className="text-secondary-foreground/60 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-primary font-bold text-sm uppercase tracking-wide">What Customers Say</span>
            <h2 className="section-title mt-1">Happy Customers 😍</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(liveFeedbacks.length > 0
              ? [
                  ...liveFeedbacks.map((f) => ({
                    id: f.id,
                    rating: f.rating,
                    comment: f.reviewText,
                    customerName: f.customerName,
                    createdAt: f.createdAt,
                    tags: f.tags,
                    orderItems: f.orderItems,
                    verified: true,
                  })),
                  ...SAMPLE_REVIEWS.filter(
                    (s) => !liveFeedbacks.some((lf) => lf.customerName === s.customerName)
                  ),
                ]
              : SAMPLE_REVIEWS
            )
              .slice(0, 6)
              .map((review: any) => (
                <div
                  key={review.id}
                  className="bg-card rounded-2xl p-6 border border-border shadow-sm hover:shadow-warm transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            className={i < review.rating ? 'fill-primary text-primary' : 'text-muted'}
                          />
                        ))}
                      </div>
                      {review.verified && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold border border-emerald-500/20">
                          ✓ Verified Feast
                        </span>
                      )}
                    </div>
                    <Quote size={18} className="text-primary/30 mb-2" />
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      "{review.comment}"
                    </p>
                    {review.tags && review.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {review.tags.slice(0, 3).map((tag: string, tIdx: number) => (
                          <span
                            key={tIdx}
                            className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-primary/10 text-primary"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 pt-3 border-t border-border/60">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm shadow-inner">
                      {review.customerName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-foreground">{review.customerName}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString('en-PH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* About / Social */}
      <section className="py-16 bg-muted/40">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-primary font-bold text-sm uppercase tracking-wide">Our Story</span>
              <h2 className="section-title mt-1 mb-4">Made with Love &amp; Passion</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Kimae's Party Bilao started as a humble home-based business with one mission: to bring authentic, delicious Filipino party food to every Filipino celebration. From intimate family dinners to grand fiestas — we've got you covered!
              </p>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Every bilao is prepared with fresh ingredients, traditional recipes, and a whole lot of love. That's the Kimae's promise.
              </p>
              <div className="flex gap-4">
                <Link to="/about" className="btn-secondary inline-flex items-center gap-2">
                  Our Story <ArrowRight size={16} />
                </Link>
                <a href="https://www.facebook.com/kimaespartybilao/" target="_blank" rel="noopener noreferrer"
                  className="btn-outline inline-flex items-center gap-2">
                  Facebook Page
                </a>
              </div>
            </div>
            <div className="relative">
              <img src={aboutBanner} alt="About Kimae's" className="rounded-3xl shadow-warm w-full h-72 object-cover" />
              <div className="absolute -bottom-4 -left-4 bg-primary rounded-2xl px-6 py-4 shadow-brand-lg">
                <p className="text-3xl font-black text-secondary" style={{ fontFamily: 'Nunito' }}>2,000+</p>
                <p className="text-sm font-semibold text-secondary/80">Happy Customers</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-12 yellow-gradient">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-secondary mb-4" style={{ fontFamily: 'Nunito' }}>
            Ready to Order? Let's Party! 🎉
          </h2>
          <p className="text-secondary/70 mb-8 max-w-xl mx-auto">
            Place your order now for your next celebration. Call us or order online!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/menu" className="btn-secondary inline-flex items-center justify-center gap-2 text-lg px-8 py-4">
              <PartyPopper size={20} /> Order Online
            </Link>
            <a href="tel:+639171234567" className="inline-flex items-center justify-center gap-2 text-lg px-8 py-4 border-2 border-secondary rounded-xl font-bold text-secondary hover:bg-secondary hover:text-secondary-foreground transition-all">
              <Phone size={20} /> Call Us Now
            </a>
          </div>
        </div>
      </section>

      <Footer />
      <MobileNav />
    </div>
  );
}
