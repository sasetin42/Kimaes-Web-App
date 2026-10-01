import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronRight, MapPin, Clock, CreditCard, Package, User, Phone, Mail, Home, AlertCircle } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { addOrder, generateOrderNumber, formatPrice } from '@/lib/store';
import { deductStockForSale, updateCustomerSpending } from '@/lib/inventoryStore';
import { PAYMENT_METHODS, DELIVERY_ZONES } from '@/constants/data';
import type { Order, OrderTimeline } from '@/types';
import { toast } from 'sonner';

const STEPS = ['Customer Info', 'Delivery Method', 'Schedule', 'Address', 'Payment', 'Review', 'Confirm'];

interface CheckoutData {
  name: string;
  mobile: string;
  email: string;
  deliveryMethod: 'delivery' | 'pickup';
  isAsap: boolean;
  scheduledDate: string;
  scheduledTime: string;
  house: string;
  street: string;
  barangay: string;
  city: string;
  province: string;
  postalCode: string;
  landmark: string;
  deliveryNotes: string;
  paymentMethod: string;
  selectedZone: string;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [placing, setPlacing] = useState(false);
  const [data, setData] = useState<CheckoutData>({
    name: user?.name || '',
    mobile: user?.mobile || '',
    email: user?.email || '',
    deliveryMethod: 'delivery',
    isAsap: true,
    scheduledDate: '',
    scheduledTime: '',
    house: '',
    street: '',
    barangay: '',
    city: 'Caloocan',
    province: 'Metro Manila',
    postalCode: '',
    landmark: '',
    deliveryNotes: '',
    paymentMethod: 'gcash',
    selectedZone: 'z-1',
  });

  const zone = DELIVERY_ZONES.find(z => z.id === data.selectedZone);
  const deliveryFee = data.deliveryMethod === 'delivery' ? (subtotal >= 2000 ? 0 : (zone?.deliveryFee || 80)) : 0;
  const total = subtotal + deliveryFee;
  const paymentMethod = PAYMENT_METHODS.find(p => p.id === data.paymentMethod);

  const setField = (key: keyof CheckoutData, value: string | boolean) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const validateStep = (): boolean => {
    if (step === 0) {
      if (!data.name || !data.mobile || !data.email) {
        toast.error('Please fill in all required fields');
        return false;
      }
    }
    if (step === 3 && data.deliveryMethod === 'delivery') {
      if (!data.house || !data.street || !data.barangay || !data.city) {
        toast.error('Please complete your delivery address');
        return false;
      }
    }
    if (step === 4 && !data.paymentMethod) {
      toast.error('Please select a payment method');
      return false;
    }
    return true;
  };

  const nextStep = () => {
    if (!validateStep()) return;
    if (data.deliveryMethod === 'pickup' && step === 2) {
      setStep(4); // Skip address for pickup
      return;
    }
    setStep(s => Math.min(s + 1, 6));
  };

  const prevStep = () => {
    if (data.deliveryMethod === 'pickup' && step === 4) {
      setStep(2);
      return;
    }
    setStep(s => Math.max(s - 1, 0));
  };

  const placeOrder = async () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty!');
      return;
    }
    setPlacing(true);
    await new Promise(r => setTimeout(r, 1500));

    const orderNumber = generateOrderNumber();
    const now = new Date().toISOString();
    const timeline: OrderTimeline[] = [
      { status: 'pending', timestamp: now, note: 'Order placed successfully' },
    ];

    const order: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      customer: user || {
        id: `guest-${Date.now()}`,
        name: data.name,
        email: data.email,
        mobile: data.mobile,
        role: 'customer',
        createdAt: now,
      },
      items: cart,
      subtotal,
      discount: 0,
      deliveryFee,
      serviceFee: 0,
      tax: 0,
      total,
      paymentMethod: data.paymentMethod,
      paymentStatus: ['cod', 'cop'].includes(data.paymentMethod) ? 'cod' : 'pending',
      deliveryMethod: data.deliveryMethod,
      deliveryAddress: data.deliveryMethod === 'delivery' ? {
        id: `addr-${Date.now()}`,
        label: 'Delivery Address',
        fullAddress: `${data.house} ${data.street}, ${data.barangay}, ${data.city}, ${data.province} ${data.postalCode}`,
        house: data.house,
        street: data.street,
        barangay: data.barangay,
        city: data.city,
        province: data.province,
        postalCode: data.postalCode,
        landmark: data.landmark,
        notes: data.deliveryNotes,
        isDefault: false,
      } : undefined,
      isAsap: data.isAsap,
      scheduledAt: !data.isAsap ? `${data.scheduledDate}T${data.scheduledTime}` : undefined,
      estimatedPrepTime: 60,
      estimatedDeliveryTime: 45,
      status: 'pending',
      timeline,
      createdAt: now,
      updatedAt: now,
    };

    // Centralized stock deduction & audit trail verification
    const deductionItems = cart.map(item => ({
      productId: item.product.id,
      quantity: item.quantity,
    }));

    const deduction = deductStockForSale(
      deductionItems,
      'online_sale',
      orderNumber,
      user?.name || data.name
    );

    if (!deduction.success) {
      setPlacing(false);
      toast.error(deduction.error || 'Unable to place order due to insufficient inventory');
      return;
    }

    // Record customer spending & loyalty
    if (user?.id) {
      const points = Math.floor(total / 50);
      updateCustomerSpending(user.id, total, points);
    }

    addOrder(order);
    clearCart();
    setPlacing(false);
    toast.success(`Order placed! Order #${orderNumber} 🎉`);
    navigate(`/order-success/${order.id}`);
  };

  if (cart.length === 0 && step < 6) {
    navigate('/cart');
    return null;
  }

  const stepLabels = ['Info', 'Delivery', 'Schedule', 'Address', 'Payment', 'Review', 'Place Order'];
  const visibleSteps = data.deliveryMethod === 'pickup'
    ? [0, 1, 2, 4, 5]
    : [0, 1, 2, 3, 4, 5];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="flex-1 bg-background py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-2xl font-black text-foreground mb-8" style={{ fontFamily: 'Nunito' }}>
            Checkout
          </h1>

          {/* Step indicators */}
          <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
            {stepLabels.map((label, i) => {
              const isVisible = data.deliveryMethod === 'pickup' ? [0, 1, 2, 4, 5, 6].includes(i) : true;
              if (!isVisible && i === 3) return null;
              const isDone = i < step;
              const isCurrent = i === step;
              return (
                <div key={i} className="flex items-center flex-shrink-0">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    isCurrent ? 'bg-primary text-primary-foreground'
                    : isDone ? 'bg-green-100 text-green-700'
                    : 'bg-muted text-muted-foreground'
                  }`}>
                    {isDone ? <Check size={10} /> : <span>{i + 1}</span>}
                    <span className="hidden sm:inline">{label}</span>
                  </div>
                  {i < stepLabels.length - 1 && (
                    <ChevronRight size={14} className="text-muted-foreground mx-1 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main form */}
            <div className="lg:col-span-2">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">

                {/* Step 0: Customer Info */}
                {step === 0 && (
                  <div>
                    <h2 className="font-black text-xl mb-6 flex items-center gap-2" style={{ fontFamily: 'Nunito' }}>
                      <User size={22} className="text-primary" /> Customer Information
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2">Full Name *</label>
                        <input value={data.name} onChange={e => setField('name', e.target.value)} placeholder="Juan dela Cruz" className="input-field" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">Mobile Number *</label>
                        <input value={data.mobile} onChange={e => setField('mobile', e.target.value)} placeholder="09XX-XXX-XXXX" className="input-field" type="tel" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">Email Address *</label>
                        <input value={data.email} onChange={e => setField('email', e.target.value)} placeholder="you@email.com" className="input-field" type="email" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 1: Delivery Method */}
                {step === 1 && (
                  <div>
                    <h2 className="font-black text-xl mb-6 flex items-center gap-2" style={{ fontFamily: 'Nunito' }}>
                      <Package size={22} className="text-primary" /> Delivery Method
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { value: 'delivery', icon: '🚚', label: 'Delivery', desc: 'Delivered to your door' },
                        { value: 'pickup', icon: '🏪', label: 'Pickup', desc: 'Pick up at our store' },
                      ].map(opt => (
                        <button key={opt.value} onClick={() => setField('deliveryMethod', opt.value as 'delivery' | 'pickup')}
                          className={`p-5 rounded-2xl border-2 text-left transition-all ${data.deliveryMethod === opt.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                          <span className="text-3xl block mb-2">{opt.icon}</span>
                          <p className="font-bold text-foreground">{opt.label}</p>
                          <p className="text-sm text-muted-foreground">{opt.desc}</p>
                        </button>
                      ))}
                    </div>

                    {data.deliveryMethod === 'delivery' && (
                      <div className="mt-6">
                        <label className="block text-sm font-semibold mb-3">Delivery Zone</label>
                        <div className="space-y-2">
                          {DELIVERY_ZONES.filter(z => z.active).map(zone => (
                            <button key={zone.id} onClick={() => setField('selectedZone', zone.id)}
                              className={`w-full p-4 rounded-xl border-2 text-left transition-all ${data.selectedZone === zone.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-semibold text-sm">{zone.name}</p>
                                  <p className="text-xs text-muted-foreground">{zone.city} • ~{zone.estimatedTime} min delivery</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-primary">{subtotal >= 2000 ? 'FREE' : formatPrice(zone.deliveryFee)}</p>
                                  {zone.freeDeliveryThreshold && <p className="text-[10px] text-muted-foreground">Free over {formatPrice(zone.freeDeliveryThreshold)}</p>}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: Schedule */}
                {step === 2 && (
                  <div>
                    <h2 className="font-black text-xl mb-6 flex items-center gap-2" style={{ fontFamily: 'Nunito' }}>
                      <Clock size={22} className="text-primary" /> Order Schedule
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      {[
                        { value: true, icon: '⚡', label: 'ASAP', desc: 'As soon as possible (60-90 min)' },
                        { value: false, icon: '📅', label: 'Schedule for Later', desc: 'Pick a specific date & time' },
                      ].map(opt => (
                        <button key={String(opt.value)} onClick={() => setField('isAsap', opt.value)}
                          className={`p-5 rounded-2xl border-2 text-left transition-all ${data.isAsap === opt.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                          <span className="text-3xl block mb-2">{opt.icon}</span>
                          <p className="font-bold text-foreground">{opt.label}</p>
                          <p className="text-sm text-muted-foreground">{opt.desc}</p>
                        </button>
                      ))}
                    </div>

                    {!data.isAsap && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold mb-2">Date</label>
                          <input type="date" value={data.scheduledDate} onChange={e => setField('scheduledDate', e.target.value)}
                            min={new Date().toISOString().split('T')[0]} className="input-field" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-2">Time</label>
                          <select value={data.scheduledTime} onChange={e => setField('scheduledTime', e.target.value)} className="input-field">
                            <option value="">Select time...</option>
                            {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'].map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Address */}
                {step === 3 && data.deliveryMethod === 'delivery' && (
                  <div>
                    <h2 className="font-black text-xl mb-6 flex items-center gap-2" style={{ fontFamily: 'Nunito' }}>
                      <MapPin size={22} className="text-primary" /> Delivery Address
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2">House/Unit No. *</label>
                        <input value={data.house} onChange={e => setField('house', e.target.value)} placeholder="123" className="input-field" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">Street *</label>
                        <input value={data.street} onChange={e => setField('street', e.target.value)} placeholder="Rizal Ave" className="input-field" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">Barangay *</label>
                        <input value={data.barangay} onChange={e => setField('barangay', e.target.value)} placeholder="Barangay 10" className="input-field" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">City *</label>
                        <input value={data.city} onChange={e => setField('city', e.target.value)} placeholder="Caloocan" className="input-field" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">Province</label>
                        <input value={data.province} onChange={e => setField('province', e.target.value)} placeholder="Metro Manila" className="input-field" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">Postal Code</label>
                        <input value={data.postalCode} onChange={e => setField('postalCode', e.target.value)} placeholder="1400" className="input-field" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-semibold mb-2">Landmark</label>
                        <input value={data.landmark} onChange={e => setField('landmark', e.target.value)} placeholder="Near Jollibee, Blue gate" className="input-field" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-semibold mb-2">Delivery Notes</label>
                        <textarea value={data.deliveryNotes} onChange={e => setField('deliveryNotes', e.target.value)}
                          placeholder="Any special delivery instructions..." rows={2} className="input-field resize-none" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Payment */}
                {step === 4 && (
                  <div>
                    <h2 className="font-black text-xl mb-6 flex items-center gap-2" style={{ fontFamily: 'Nunito' }}>
                      <CreditCard size={22} className="text-primary" /> Payment Method
                    </h2>
                    <div className="space-y-3">
                      {PAYMENT_METHODS.filter(pm => {
                        if (data.deliveryMethod === 'pickup' && pm.type === 'cod') return false;
                        if (data.deliveryMethod === 'delivery' && pm.type === 'cop') return false;
                        return pm.enabled;
                      }).map(pm => (
                        <button key={pm.id} onClick={() => setField('paymentMethod', pm.id)}
                          className={`w-full p-4 rounded-xl border-2 text-left transition-all ${data.paymentMethod === pm.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${data.paymentMethod === pm.id ? 'border-primary' : 'border-muted-foreground'}`}>
                              {data.paymentMethod === pm.id && <div className="w-full h-full rounded-full bg-primary scale-[0.6]" />}
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-sm">{pm.name}</p>
                              {pm.instructions && data.paymentMethod === pm.id && (
                                <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line">{pm.instructions}</p>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 5: Review */}
                {step === 5 && (
                  <div>
                    <h2 className="font-black text-xl mb-6" style={{ fontFamily: 'Nunito' }}>📋 Order Review</h2>

                    <div className="space-y-4">
                      <div className="bg-muted rounded-xl p-4">
                        <h3 className="font-semibold text-sm mb-2">📦 Items ({cart.length})</h3>
                        {cart.map(item => (
                          <div key={item.id} className="flex justify-between items-start text-sm py-2 border-b border-border last:border-0">
                            <div className="flex-1">
                              <p className="font-medium">{item.product.name} x{item.quantity}</p>
                              <p className="text-xs text-muted-foreground">{Object.values(item.selectedOptions).flat().join(', ')}</p>
                            </div>
                            <span className="font-bold">{formatPrice(((item.product.promoPrice || item.product.price) + item.optionPriceAdd) * item.quantity)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-muted rounded-xl p-4 text-sm">
                          <h3 className="font-semibold mb-2">👤 Customer</h3>
                          <p>{data.name}</p>
                          <p className="text-muted-foreground">{data.mobile}</p>
                          <p className="text-muted-foreground">{data.email}</p>
                        </div>
                        <div className="bg-muted rounded-xl p-4 text-sm">
                          <h3 className="font-semibold mb-2">🚚 Delivery</h3>
                          <p className="font-medium capitalize">{data.deliveryMethod}</p>
                          {data.deliveryMethod === 'delivery' && (
                            <p className="text-muted-foreground">{data.house} {data.street}, {data.barangay}, {data.city}</p>
                          )}
                          <p className="text-muted-foreground">{data.isAsap ? 'ASAP' : `${data.scheduledDate} ${data.scheduledTime}`}</p>
                        </div>
                        <div className="bg-muted rounded-xl p-4 text-sm sm:col-span-2">
                          <h3 className="font-semibold mb-2">💳 Payment: {paymentMethod?.name}</h3>
                          {paymentMethod?.instructions && (
                            <p className="text-muted-foreground text-xs whitespace-pre-line">{paymentMethod.instructions}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation buttons */}
                <div className="flex gap-3 mt-8">
                  {step > 0 && (
                    <button onClick={prevStep} className="btn-outline flex-1">
                      ← Back
                    </button>
                  )}
                  {step < 5 ? (
                    <button onClick={nextStep} className="btn-primary flex-1">
                      Continue →
                    </button>
                  ) : (
                    <button
                      onClick={placeOrder}
                      disabled={placing}
                      className="btn-primary flex-1 text-lg py-4"
                    >
                      {placing ? '⏳ Placing Order...' : '🎉 Place Order'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Order Summary sidebar */}
            <div>
              <div className="bg-card rounded-2xl border border-border p-5 shadow-sm sticky top-24">
                <h3 className="font-black text-base mb-4" style={{ fontFamily: 'Nunito' }}>Order Summary</h3>
                <div className="space-y-3 mb-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex gap-3 items-start">
                      <img src={item.product.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold leading-tight truncate">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                      </div>
                      <span className="text-xs font-bold text-primary flex-shrink-0">
                        {formatPrice(((item.product.promoPrice || item.product.price) + item.optionPriceAdd) * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border pt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery</span>
                    <span>{deliveryFee === 0 ? <span className="text-green-600">FREE</span> : formatPrice(deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between font-black text-lg pt-2 border-t border-border">
                    <span>Total</span>
                    <span className="text-primary">{formatPrice(total)}</span>
                  </div>
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
