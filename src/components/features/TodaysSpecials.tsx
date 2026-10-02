import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Flame,
  Clock,
  Sparkles,
  ShoppingBag,
  Zap,
  ArrowRight,
  Star,
  Users,
  CheckCircle2,
  Calendar,
  Tag,
} from 'lucide-react';
import { getCentralProducts, subscribeToProductUpdates } from '@/lib/inventoryStore';
import { useCart } from '@/hooks/useCart';
import { formatPrice } from '@/lib/store';
import type { Product } from '@/types';
import { toast } from 'sonner';

interface TodaysSpecialsProps {
  title?: string;
  subtitle?: string;
  maxItems?: number;
  showCountdown?: boolean;
}

const DAYS_THEMES = [
  { day: 0, name: 'Sunday', theme: 'Grand Family Salo-Salo Deals', highlightTag: 'Family Sunday Special' },
  { day: 1, name: 'Monday', theme: 'Monday Week-Kickoff Cravings', highlightTag: 'Office & Feast Special' },
  { day: 2, name: 'Tuesday', theme: 'Fiesta Palabok & Merienda Specials', highlightTag: 'Fiesta Tuesday Deal' },
  { day: 3, name: 'Wednesday', theme: 'Midweek Traditional Kakanin & Bilao Treats', highlightTag: 'Midweek Special' },
  { day: 4, name: 'Thursday', theme: 'Sizzling Sisig & Golden Shanghai Platter Day', highlightTag: 'Thursday Sizzle' },
  { day: 5, name: 'Friday', theme: 'Weekend Welcome Bilao Celebration', highlightTag: 'Friday Weekend Deal' },
  { day: 6, name: 'Saturday', theme: 'Grand Cavite Bilao Fiesta Showcase', highlightTag: 'Saturday Fiesta Pick' },
];

export default function TodaysSpecials({
  title,
  subtitle,
  maxItems = 4,
  showCountdown = true,
}: TodaysSpecialsProps) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>(getCentralProducts());

  // Listen to live inventory updates
  useEffect(() => {
    const unsub = subscribeToProductUpdates(() => {
      setProducts(getCentralProducts());
    });
    return unsub;
  }, []);

  // Today's Date & Theme calculation
  const today = useMemo(() => {
    const d = new Date();
    const dayIndex = d.getDay();
    const themeObj = DAYS_THEMES[dayIndex] || DAYS_THEMES[0];
    const dateFormatted = d.toLocaleDateString('en-PH', { weekday: 'long', month: 'short', day: 'numeric' });
    return {
      dayIndex,
      themeObj,
      dateFormatted,
    };
  }, []);

  // Real-time Countdown to midnight (when today's daily specials rotate)
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(23, 59, 59, 999);

      const diff = Math.max(0, midnight.getTime() - now.getTime());
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter rotating items from real product inventory
  const todaysSpecialItems = useMemo(() => {
    // 1. Items with promoPrice or explicit discount
    const discounted = products.filter((p) => p.available && p.promoPrice && p.promoPrice < p.price);
    // 2. Best sellers or featured products to rotate based on day of week
    const rotatingPool = products.filter((p) => p.available);

    // Deterministic rotation based on day of week
    const daySeed = today.dayIndex;
    const shuffled = [...rotatingPool].sort((a, b) => {
      const hashA = (a.id.charCodeAt(a.id.length - 1) + daySeed) % 10;
      const hashB = (b.id.charCodeAt(b.id.length - 1) + daySeed) % 10;
      return hashB - hashA;
    });

    const combined = [...discounted, ...shuffled];
    // Remove duplicates
    const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values());
    return unique.slice(0, maxItems);
  }, [products, today.dayIndex, maxItems]);

  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    e.preventDefault();
    if (!product.available) {
      toast.error('Item is temporarily out of stock.');
      return;
    }
    addToCart(product, 1, {}, 0, `Today's Daily Special Deal`);
    toast.success(`🎉 Added ${product.name} to cart at today's special price!`);
  };

  if (todaysSpecialItems.length === 0) return null;

  return (
    <section className="py-8 bg-gradient-to-b from-primary/5 via-background to-background relative overflow-hidden">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-primary text-secondary uppercase tracking-wider shadow-sm">
                <Flame size={13} className="fill-secondary text-secondary" />
                {today.themeObj.highlightTag}
              </span>
              <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                <Calendar size={12} className="text-primary" /> {today.dateFormatted}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-foreground" style={{ fontFamily: 'Nunito' }}>
              {title || `Today's Specials: ${today.themeObj.theme}`}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {subtitle ||
                'Rotating daily chef picks, party bilao feasts, and discounted trays. Cooked fresh in Dasmariñas!'}
            </p>
          </div>

          {/* Countdown Clock */}
          {showCountdown && (
            <div className="p-3 rounded-2xl bg-card border border-primary/30 shadow-sm flex items-center gap-3 flex-shrink-0">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Clock size={16} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Daily Deals Expire In
                </p>
                <div className="font-mono font-black text-sm text-foreground flex items-center gap-1 mt-0.5">
                  <span className="px-1.5 py-0.5 rounded bg-muted">
                    {String(timeLeft.hours).padStart(2, '0')}h
                  </span>
                  :
                  <span className="px-1.5 py-0.5 rounded bg-muted">
                    {String(timeLeft.minutes).padStart(2, '0')}m
                  </span>
                  :
                  <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                    {String(timeLeft.seconds).padStart(2, '0')}s
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Specials Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {todaysSpecialItems.map((product) => {
            const hasDiscount = product.promoPrice && product.promoPrice < product.price;
            const currentPrice = product.promoPrice || product.price;
            const discountPercent = hasDiscount
              ? Math.round(((product.price - (product.promoPrice || product.price)) / product.price) * 100)
              : 10;

            return (
              <div
                key={product.id}
                onClick={() => navigate(`/product/${product.id}`)}
                className="group relative bg-card rounded-3xl border-2 border-primary/20 hover:border-primary p-4 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer overflow-hidden"
              >
                {/* Ribbon Tag */}
                <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
                  <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-primary text-secondary uppercase tracking-wider shadow-sm flex items-center gap-1">
                    <Sparkles size={11} /> {hasDiscount ? `${discountPercent}% OFF` : "Today's Pick"}
                  </span>
                  {product.bestSeller && (
                    <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-amber-500 text-white shadow-sm flex items-center gap-0.5">
                      <Star size={9} fill="currentColor" /> Top Suki Pick
                    </span>
                  )}
                </div>

                {/* Image */}
                <div>
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted mb-3.5">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold flex items-center gap-1">
                      <Users size={11} /> {product.servingSize || `Serves ${product.personsServed}`}
                    </div>
                  </div>

                  {/* Title & Desc */}
                  <h3
                    className="font-black text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors"
                    style={{ fontFamily: 'Nunito' }}
                  >
                    {product.name}
                  </h3>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                {/* Pricing & Quick Add Button */}
                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-2">
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-black text-base text-primary" style={{ fontFamily: 'Nunito' }}>
                        {formatPrice(currentPrice)}
                      </span>
                      {hasDiscount && (
                        <span className="text-xs text-muted-foreground line-through font-mono">
                          {formatPrice(product.price)}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-emerald-600 font-bold block">
                      {product.stock > 0 ? `Stock: ${product.stock} units` : 'Made to order'}
                    </span>
                  </div>

                  <button
                    onClick={(e) => handleQuickAdd(e, product)}
                    className="p-2.5 rounded-xl bg-primary text-secondary hover:bg-primary/90 font-bold text-xs flex items-center justify-center gap-1 shadow-sm hover:scale-105 active:scale-95 transition-all"
                    title="Quick Add to Cart at today's special price"
                  >
                    <Zap size={14} className="fill-secondary text-secondary" />
                    <span className="text-[11px] font-black hidden sm:inline">Add</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
