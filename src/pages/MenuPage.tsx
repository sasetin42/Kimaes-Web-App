import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Search, SlidersHorizontal, X, ChevronDown, ChefHat } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';
import ProductCard from '@/components/features/ProductCard';
import TodaysSpecials from '@/components/features/TodaysSpecials';
import { PRODUCTS as FALLBACK_PRODUCTS, CATEGORIES } from '@/constants/data';
import { getCentralProducts, subscribeToProductUpdates, areProductsEqual } from '@/lib/inventoryStore';
import { useEffect } from 'react';
import type { Product } from '@/types';

export default function MenuPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [allProducts, setAllProducts] = useState<Product[]>(getCentralProducts());
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('featured');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);

  useEffect(() => {
    const unsub = subscribeToProductUpdates(() => {
      setAllProducts((prev) => {
        const next = getCentralProducts();
        return areProductsEqual(prev, next) ? prev : next;
      });
    });
    return unsub;
  }, []);

  const activeCat = searchParams.get('cat') || 'all';
  const searchQuery = searchParams.get('search') || '';

  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    if (activeCat && activeCat !== 'all') {
      const cat = CATEGORIES.find(c => c.slug === activeCat);
      if (cat) result = result.filter(p => p.category === cat.id);
      if (activeCat === 'best-sellers') result = allProducts.filter(p => p.bestSeller);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some(t => t.includes(q))
      );
    }

    result = result.filter(p => {
      const price = p.promoPrice || p.price;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    switch (sortBy) {
      case 'price-asc': return result.sort((a, b) => (a.promoPrice || a.price) - (b.promoPrice || b.price));
      case 'price-desc': return result.sort((a, b) => (b.promoPrice || b.price) - (a.promoPrice || a.price));
      case 'name': return result.sort((a, b) => a.name.localeCompare(b.name));
      case 'bestseller': return result.sort((a, b) => (b.bestSeller ? 1 : 0) - (a.bestSeller ? 1 : 0));
      default: return result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }
  }, [allProducts, activeCat, searchQuery, sortBy, priceRange]);

  const handleCategoryChange = (slug: string) => {
    if (slug === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ cat: slug });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero */}
      <div className="hero-gradient py-10 relative overflow-hidden">
        <div className="absolute inset-0 woven-bg opacity-20" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-4xl font-black text-white mb-2" style={{ fontFamily: 'Nunito' }}>
              🍽️ Our Menu
            </h1>
            <p className="text-white/70 mb-6">Authentic Filipino party food for every occasion</p>

            {/* Search */}
            <form onSubmit={e => { e.preventDefault(); const inp = (e.currentTarget.querySelector('input') as HTMLInputElement).value; setSearchParams(inp ? { search: inp } : {}); }}
              className="flex gap-2">
              <input
                defaultValue={searchQuery}
                placeholder="Search bilao, pancit, lumpia..."
                className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button type="submit" className="btn-primary px-5 py-3">
                <Search size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-background py-8">
        <div className="container mx-auto px-4">
          {/* Rotating Daily Discounts & Featured Deals */}
          {!searchQuery && activeCat === 'all' && (
            <div className="mb-6 rounded-3xl border border-primary/20 overflow-hidden shadow-sm">
              <TodaysSpecials maxItems={3} showCountdown={true} />
            </div>
          )}

          {/* Category tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
            <button
              onClick={() => handleCategoryChange('all')}
              className={`flex-shrink-0 px-5 py-2.5 rounded-full border-2 font-semibold text-sm transition-all ${activeCat === 'all' ? 'bg-primary border-primary text-primary-foreground' : 'border-border text-secondary hover:border-primary'}`}
            >
              All Items
            </button>
            {CATEGORIES.filter(c => c.active).map(cat => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.slug)}
                className={`flex-shrink-0 px-5 py-2.5 rounded-full border-2 font-semibold text-sm transition-all whitespace-nowrap ${activeCat === cat.slug ? 'bg-primary border-primary text-primary-foreground' : 'border-border text-secondary hover:border-primary'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted-foreground">
              {filteredProducts.length} item{filteredProducts.length !== 1 ? 's' : ''} found
              {searchQuery && <span className="text-primary font-semibold"> for "{searchQuery}"</span>}
            </p>

            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="input-field py-2 text-sm w-auto pr-8"
              >
                <option value="featured">Featured</option>
                <option value="bestseller">Best Sellers</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name">Name A-Z</option>
              </select>
            </div>
          </div>

          {/* Products grid */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={() => navigate(`/product/${product.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <ChefHat size={64} className="text-muted mx-auto mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">No items found</h3>
              <p className="text-muted-foreground mb-6">Try adjusting your search or browse all categories</p>
              <button onClick={() => setSearchParams({})} className="btn-primary">
                View All Menu
              </button>
            </div>
          )}
        </div>
      </div>

      <Footer />
      <MobileNav />
    </div>
  );
}
