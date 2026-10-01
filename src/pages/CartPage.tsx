import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingCart, Tag, ArrowRight, ChefHat, RotateCcw } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';
import { useCart } from '@/hooks/useCart';
import { formatPrice } from '@/lib/store';
import { PROMO_CODES } from '@/constants/data';
import { toast } from 'sonner';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, subtotal } = useCart();
  const navigate = useNavigate();
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<typeof PROMO_CODES[0] | null>(null);

  const deliveryFee = subtotal >= 2000 ? 0 : 80;
  const discount = appliedPromo
    ? appliedPromo.type === 'percentage'
      ? Math.min(subtotal * appliedPromo.value / 100, appliedPromo.maxDiscount || 9999)
      : appliedPromo.type === 'fixed'
      ? appliedPromo.value
      : deliveryFee
    : 0;
  const effectiveDeliveryFee = appliedPromo?.type === 'free_delivery' ? 0 : deliveryFee;
  const total = subtotal - (appliedPromo?.type !== 'free_delivery' ? discount : 0) + effectiveDeliveryFee;

  const applyPromo = () => {
    const code = PROMO_CODES.find(p => p.code === promoInput.toUpperCase() && p.active);
    if (!code) {
      toast.error('Invalid or expired promo code');
      return;
    }
    if (subtotal < code.minSpend) {
      toast.error(`Minimum spend of ${formatPrice(code.minSpend)} required for this promo`);
      return;
    }
    setAppliedPromo(code);
    toast.success(`Promo code "${code.code}" applied! 🎉`);
  };

  const getOptionLabel = (item: typeof cart[0]): string => {
    const parts: string[] = [];
    Object.entries(item.selectedOptions).forEach(([optId, val]) => {
      const opt = item.product.options.find(o => o.id === optId);
      if (!opt) return;
      if (Array.isArray(val)) {
        const labels = val.map(vId => opt.values.find(v => v.id === vId)?.label).filter(Boolean);
        if (labels.length) parts.push(`${opt.name}: ${labels.join(', ')}`);
      } else {
        const v = opt.values.find(ov => ov.id === val);
        if (v) parts.push(`${opt.name}: ${v.label}`);
      }
    });
    return parts.join(' • ');
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="text-center">
            <ShoppingCart size={80} className="text-muted mx-auto mb-6" />
            <h2 className="text-2xl font-black text-foreground mb-3" style={{ fontFamily: 'Nunito' }}>Your cart is empty</h2>
            <p className="text-muted-foreground mb-8">Looks like you haven't added anything yet. Let's fix that!</p>
            <Link to="/menu" className="btn-primary inline-flex items-center gap-2">
              <ChefHat size={18} /> Browse Menu
            </Link>
          </div>
        </div>
        <Footer />
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="flex-1 bg-background py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-black text-foreground mb-8" style={{ fontFamily: 'Nunito' }}>
            🛒 Your Cart ({cart.reduce((s, i) => s + i.quantity, 0)} items)
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.map(item => {
                const unitPrice = (item.product.promoPrice || item.product.price) + item.optionPriceAdd;
                return (
                  <div key={item.id} className="bg-card rounded-2xl p-4 border border-border shadow-sm flex gap-4">
                    <Link to={`/product/${item.product.id}`}>
                      <img src={item.product.images[0]} alt={item.product.name} className="w-24 h-24 rounded-xl object-cover flex-shrink-0" />
                    </Link>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <Link to={`/product/${item.product.id}`}>
                          <h3 className="font-bold text-foreground hover:text-primary transition-colors leading-tight" style={{ fontFamily: 'Nunito' }}>
                            {item.product.name}
                          </h3>
                        </Link>
                        <button onClick={() => removeFromCart(item.id)} className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0 p-1">
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {getOptionLabel(item) && (
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{getOptionLabel(item)}</p>
                      )}
                      {item.specialInstructions && (
                        <p className="text-xs text-primary mt-1">📝 {item.specialInstructions}</p>
                      )}

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2 bg-muted rounded-lg p-0.5">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-7 rounded-md bg-white flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors shadow-sm">
                            <Minus size={12} />
                          </button>
                          <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 rounded-md bg-white flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors shadow-sm">
                            <Plus size={12} />
                          </button>
                        </div>
                        <span className="font-black text-lg text-primary" style={{ fontFamily: 'Nunito' }}>
                          {formatPrice(unitPrice * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              <Link to="/menu" className="flex items-center gap-2 text-primary font-semibold text-sm hover:underline">
                <RotateCcw size={15} /> Continue Shopping
              </Link>
            </div>

            {/* Order summary */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm sticky top-24">
                <h2 className="font-black text-lg text-foreground mb-6" style={{ fontFamily: 'Nunito' }}>Order Summary</h2>

                {/* Promo code */}
                {!appliedPromo ? (
                  <div className="flex gap-2 mb-6">
                    <input
                      value={promoInput}
                      onChange={e => setPromoInput(e.target.value.toUpperCase())}
                      placeholder="Promo code"
                      className="input-field py-2 text-sm flex-1"
                    />
                    <button onClick={applyPromo} className="btn-outline py-2 px-4 text-sm">Apply</button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-6">
                    <div className="flex items-center gap-2">
                      <Tag size={14} className="text-green-600" />
                      <span className="text-sm font-bold text-green-700">{appliedPromo.code}</span>
                    </div>
                    <button onClick={() => setAppliedPromo(null)} className="text-xs text-green-600 hover:text-destructive">Remove</button>
                  </div>
                )}

                <div className="space-y-3 text-sm mb-6">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold">{formatPrice(subtotal)}</span>
                  </div>
                  {discount > 0 && appliedPromo?.type !== 'free_delivery' && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({appliedPromo?.code})</span>
                      <span className="font-semibold">-{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery Fee</span>
                    <span className="font-semibold">
                      {effectiveDeliveryFee === 0 ? (
                        <span className="text-green-600">FREE</span>
                      ) : formatPrice(effectiveDeliveryFee)}
                    </span>
                  </div>
                  {subtotal < 2000 && !appliedPromo?.type.includes('free') && (
                    <p className="text-xs text-primary">
                      Add {formatPrice(2000 - subtotal)} more for FREE delivery!
                    </p>
                  )}
                </div>

                <div className="border-t border-border pt-4 mb-6">
                  <div className="flex justify-between">
                    <span className="font-black text-lg">Total</span>
                    <span className="font-black text-2xl text-primary" style={{ fontFamily: 'Nunito' }}>
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/checkout')}
                  className="btn-primary w-full flex items-center justify-center gap-2 text-lg py-4"
                >
                  Proceed to Checkout <ArrowRight size={18} />
                </button>

                <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <span>🔒 Secure checkout</span>
                  <span>•</span>
                  <span>💯 Quality guaranteed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
      <MobileNav />
    </div>
  );
}
