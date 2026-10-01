import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft, Star, Clock, Users, ShoppingCart, Plus, Minus,
  Heart, Share2, ChefHat, Check, AlertCircle, ArrowRight
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';
import ProductCard from '@/components/features/ProductCard';
import { PRODUCTS as FALLBACK_PRODUCTS } from '@/constants/data';
import { useCart } from '@/hooks/useCart';
import { toggleFavorite, getFavorites, formatPrice } from '@/lib/store';
import { getProductById, getCentralProducts, subscribeToProductUpdates } from '@/lib/inventoryStore';
import { toast } from 'sonner';
import { useEffect } from 'react';
import type { Product } from '@/types';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | undefined>(() => (id ? getProductById(id) : undefined));

  useEffect(() => {
    if (id) {
      setProduct(getProductById(id));
    }
    const unsub = subscribeToProductUpdates(() => {
      if (!id) return;
      const latest = getProductById(id);
      setProduct((prev) => {
        if (!prev && !latest) return prev;
        if (!prev || !latest) return latest;
        if (
          prev.id === latest.id &&
          prev.stock === latest.stock &&
          prev.price === latest.price &&
          prev.promoPrice === latest.promoPrice &&
          prev.available === latest.available &&
          prev.updatedAt === latest.updatedAt
        ) {
          return prev;
        }
        return latest;
      });
    });
    return unsub;
  }, [id]);

  const [selectedImg, setSelectedImg] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string | string[]>>({});
  const [instructions, setInstructions] = useState('');
  const [isFav, setIsFav] = useState(() => product ? getFavorites().includes(product.id) : false);

  const optionPriceAdd = useMemo(() => {
    if (!product) return 0;
    let add = 0;
    Object.entries(selectedOptions).forEach(([optId, val]) => {
      const optGroup = product.options.find(o => o.id === optId);
      if (!optGroup) return;
      if (Array.isArray(val)) {
        val.forEach(vId => {
          const v = optGroup.values.find(ov => ov.id === vId);
          if (v) add += v.additionalPrice;
        });
      } else {
        const v = optGroup.values.find(ov => ov.id === val);
        if (v) add += v.additionalPrice;
      }
    });
    return add;
  }, [selectedOptions, product]);

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <ChefHat size={64} className="text-muted mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Product not found</h2>
            <Link to="/menu" className="btn-primary">Back to Menu</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const basePrice = product.promoPrice || product.price;
  const unitPrice = basePrice + optionPriceAdd;
  const totalPrice = unitPrice * quantity;

  const handleRadioOption = (optId: string, valId: string) => {
    setSelectedOptions(prev => ({ ...prev, [optId]: valId }));
  };

  const handleCheckboxOption = (optId: string, valId: string) => {
    const opt = product.options.find(o => o.id === optId);
    if (!opt) return;
    const current = (selectedOptions[optId] as string[] | undefined) || [];
    const idx = current.indexOf(valId);
    if (idx >= 0) {
      setSelectedOptions(prev => ({ ...prev, [optId]: current.filter(v => v !== valId) }));
    } else {
      if (opt.maxSelect && current.length >= opt.maxSelect) {
        toast.warning(`Maximum ${opt.maxSelect} selection(s) allowed`);
        return;
      }
      setSelectedOptions(prev => ({ ...prev, [optId]: [...current, valId] }));
    }
  };

  const validateOptions = (): boolean => {
    for (const opt of product.options) {
      if (opt.required) {
        if (opt.type === 'radio' && !selectedOptions[opt.id]) {
          toast.error(`Please select ${opt.name}`);
          return false;
        }
        if (opt.type === 'checkbox' && opt.minSelect) {
          const selected = (selectedOptions[opt.id] as string[] | undefined) || [];
          if (selected.length < opt.minSelect) {
            toast.error(`Please select at least ${opt.minSelect} option(s) for ${opt.name}`);
            return false;
          }
        }
      }
    }
    return true;
  };

  const handleAddToCart = () => {
    if (!product.available) {
      toast.error('This item is currently out of stock');
      return;
    }
    if (!validateOptions()) return;
    addToCart(product, quantity, selectedOptions, optionPriceAdd, instructions);
  };

  const handleOrderNow = () => {
    if (!product.available) return;
    if (!validateOptions()) return;
    addToCart(product, quantity, selectedOptions, optionPriceAdd, instructions);
    navigate('/checkout');
  };

  const related = getCentralProducts().filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="flex-1 bg-background py-6">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link to="/" className="hover:text-primary">Home</Link>
            <span>›</span>
            <Link to="/menu" className="hover:text-primary">Menu</Link>
            <span>›</span>
            <span className="text-foreground font-semibold truncate">{product.name}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Images */}
            <div>
              <div className="relative rounded-3xl overflow-hidden bg-muted mb-3 aspect-square">
                <img
                  src={product.images[selectedImg]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {!product.available && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="bg-gray-700 text-white px-6 py-3 rounded-full font-bold text-lg">Out of Stock</span>
                  </div>
                )}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {product.bestSeller && <span className="badge-status bg-primary text-primary-foreground"><Star size={10} fill="currentColor" /> Best Seller</span>}
                  {product.isNew && <span className="badge-status bg-green-500 text-white">✨ New!</span>}
                  {product.promoPrice && <span className="badge-status bg-destructive text-white">🔥 On Sale!</span>}
                </div>
              </div>

              {product.images.length > 1 && (
                <div className="flex gap-2">
                  {product.images.map((img, i) => (
                    <button key={i} onClick={() => setSelectedImg(i)}
                      className={`flex-1 rounded-xl overflow-hidden border-2 transition-all ${i === selectedImg ? 'border-primary' : 'border-border'}`}>
                      <img src={img} alt="" className="w-full h-20 object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-foreground mb-3" style={{ fontFamily: 'Nunito' }}>
                {product.name}
              </h1>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1"><Users size={14} className="text-primary" /> Serves {product.personsServed} persons</span>
                <span className="flex items-center gap-1"><Clock size={14} className="text-primary" /> {product.prepTime} min prep time</span>
                <span className="flex items-center gap-1"><ChefHat size={14} className="text-primary" /> {product.servingSize}</span>
              </div>

              <p className="text-muted-foreground leading-relaxed mb-6">{product.description}</p>

              {/* Price */}
              <div className="flex items-end gap-3 mb-6">
                <span className="text-3xl font-black text-primary" style={{ fontFamily: 'Nunito' }}>
                  {formatPrice(unitPrice)}
                </span>
                {product.promoPrice && (
                  <span className="text-lg text-muted-foreground line-through">{formatPrice(product.price)}</span>
                )}
                {quantity > 1 && (
                  <span className="text-sm text-muted-foreground">= {formatPrice(totalPrice)} total</span>
                )}
              </div>

              {/* Options */}
              {product.options.map(opt => (
                <div key={opt.id} className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="font-bold text-foreground">{opt.name}</h3>
                    {opt.required && <span className="badge-status bg-destructive/10 text-destructive text-[10px]">Required</span>}
                    {opt.minSelect && <span className="text-xs text-muted-foreground">Choose {opt.minSelect}{opt.maxSelect && opt.maxSelect !== opt.minSelect ? `-${opt.maxSelect}` : ''}</span>}
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {opt.type === 'radio' ? (
                      opt.values.filter(v => v.available).map(val => (
                        <button
                          key={val.id}
                          onClick={() => handleRadioOption(opt.id, val.id)}
                          className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-sm ${
                            selectedOptions[opt.id] === val.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedOptions[opt.id] === val.id ? 'border-primary bg-primary' : 'border-muted-foreground'}`}>
                              {selectedOptions[opt.id] === val.id && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
                            </div>
                            <span className="font-medium">{val.label}</span>
                          </div>
                          {val.additionalPrice !== 0 && (
                            <span className={`font-semibold text-xs ${val.additionalPrice > 0 ? 'text-primary' : 'text-green-600'}`}>
                              {val.additionalPrice > 0 ? `+${formatPrice(val.additionalPrice)}` : formatPrice(val.additionalPrice)}
                            </span>
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {opt.values.filter(v => v.available).map(val => {
                          const selected = ((selectedOptions[opt.id] as string[]) || []).includes(val.id);
                          return (
                            <button
                              key={val.id}
                              onClick={() => handleCheckboxOption(opt.id, val.id)}
                              className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-sm ${
                                selected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 ${selected ? 'border-primary bg-primary' : 'border-muted-foreground'}`}>
                                  {selected && <Check size={10} className="text-primary-foreground" strokeWidth={3} />}
                                </div>
                                <span className="font-medium text-left">{val.label}</span>
                              </div>
                              {val.additionalPrice > 0 && (
                                <span className="font-semibold text-xs text-primary">+{formatPrice(val.additionalPrice)}</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Special Instructions */}
              <div className="mb-6">
                <label className="block font-semibold text-sm text-foreground mb-2">Special Instructions (optional)</label>
                <textarea
                  value={instructions}
                  onChange={e => setInstructions(e.target.value)}
                  placeholder="Any special requests? Allergies? Extra spicy? Let us know..."
                  rows={3}
                  className="input-field resize-none"
                />
              </div>

              {/* Quantity */}
              <div className="flex items-center gap-4 mb-6">
                <span className="font-semibold text-sm text-foreground">Quantity:</span>
                <div className="flex items-center gap-2 bg-muted rounded-xl p-1">
                  <button
                    onClick={() => setQuantity(q => Math.max(product.minOrder, q - 1))}
                    className="w-9 h-9 rounded-lg bg-white flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors shadow-sm"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-10 text-center font-bold text-lg">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => Math.min(product.maxOrder, q + 1))}
                    className="w-9 h-9 rounded-lg bg-white flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors shadow-sm"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <span className="text-sm text-muted-foreground">(min {product.minOrder}, max {product.maxOrder})</span>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={!product.available}
                  className="flex-1 btn-outline flex items-center justify-center gap-2"
                >
                  <ShoppingCart size={18} />
                  Add to Cart
                </button>
                <button
                  onClick={handleOrderNow}
                  disabled={!product.available}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  Order Now <ArrowRight size={18} />
                </button>
              </div>

              {/* Delivery info */}
              <div className="mt-4 p-4 bg-muted rounded-2xl text-sm text-muted-foreground flex items-start gap-2">
                <AlertCircle size={16} className="text-primary mt-0.5 flex-shrink-0" />
                <p>Estimated prep time: <strong className="text-foreground">{product.prepTime} minutes</strong>. Delivery within your zone typically takes an additional 30–60 minutes.</p>
              </div>
            </div>
          </div>

          {/* Related */}
          {related.length > 0 && (
            <div className="mt-16">
              <h2 className="section-title mb-6">You Might Also Like</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {related.map(p => (
                  <ProductCard key={p.id} product={p} onAddToCart={() => navigate(`/product/${p.id}`)} compact />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
      <MobileNav />
    </div>
  );
}
