import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import {
  Check,
  ChevronRight,
  MapPin,
  Clock,
  CreditCard,
  Package,
  User,
  Phone,
  Mail,
  Home,
  AlertCircle,
  Award,
  Sparkles,
  Gift,
  Tag,
  CheckCircle2,
  X,
  Crown,
  QrCode,
  Download,
  Copy,
  ShieldCheck,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { addOrder, generateOrderNumber, formatPrice } from '@/lib/store';
import { deductStockForSale, updateCustomerSpending } from '@/lib/inventoryStore';
import { getSukiProfileByIdentifier, redeemPointsAtCheckout } from '@/lib/loyaltyStore';
import {
  applyPointsTowardsDiscount,
  trackOrderAndAwardLoyaltyPoints,
} from '@/services/firebaseLoyaltyService';
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
    city: 'Dasmariñas',
    province: 'Cavite',
    postalCode: '',
    landmark: '',
    deliveryNotes: '',
    paymentMethod: 'gcash',
    selectedZone: 'z-1',
  });

  // Loyalty Program / Suki Profile Integration
  const sukiProfile = useMemo(() => {
    return (
      getSukiProfileByIdentifier(user?.id) ||
      getSukiProfileByIdentifier(user?.email) ||
      getSukiProfileByIdentifier(user?.mobile) ||
      getSukiProfileByIdentifier(data.mobile) ||
      getSukiProfileByIdentifier(data.email)
    );
  }, [user, data.mobile, data.email]);

  const [pointsToRedeem, setPointsToRedeem] = useState<number>(0);
  const [appliedPointsDiscount, setAppliedPointsDiscount] = useState<number>(0);
  const [pointsApplied, setPointsApplied] = useState<boolean>(false);
  const [pointsInput, setPointsInput] = useState<string>('');

  // E-Wallet QR Code Generator State
  const [selectedWallet, setSelectedWallet] = useState<'gcash' | 'maya' | 'qrph'>('gcash');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  const zone = DELIVERY_ZONES.find((z) => z.id === data.selectedZone);
  const deliveryFee =
    data.deliveryMethod === 'delivery'
      ? subtotal >= 2000
        ? 0
        : zone?.deliveryFee || 80
      : 0;

  const grossTotal = subtotal + deliveryFee;
  const total = Math.max(0, grossTotal - appliedPointsDiscount);
  const paymentMethod = PAYMENT_METHODS.find((p) => p.id === data.paymentMethod);

  // Generate dynamic QR Code for payment
  useEffect(() => {
    const merchantId = 'KPB-CAVITE-01';
    const amountStr = total.toFixed(2);
    const qrPayload = `https://qr.kimaes.ph/pay?wallet=${selectedWallet}&amt=${amountStr}&ref=${merchantId}&merchant=Kimaes+Party+Bilao`;

    QRCode.toDataURL(qrPayload, {
      width: 260,
      margin: 2,
      color: {
        dark: selectedWallet === 'gcash' ? '#0055ff' : selectedWallet === 'maya' ? '#00b03e' : '#613319',
        light: '#ffffff',
      },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.warn('QR generation error:', err));
  }, [total, selectedWallet, data.paymentMethod]);

  // Maximum points redeemable: cannot exceed profile points or gross total (1 pt = ₱2)
  const maxRedeemablePoints = sukiProfile
    ? Math.min(sukiProfile.pointsBalance, Math.floor(grossTotal / 2))
    : 0;

  const handleApplyPoints = (pts: number) => {
    if (!sukiProfile) {
      toast.error('No Salo-Salo loyalty account found.');
      return;
    }
    if (pts < 5) {
      toast.error('Minimum redemption is 5 points (₱10 discount).');
      return;
    }
    if (pts > sukiProfile.pointsBalance) {
      toast.error(`Insufficient points. You have ${sukiProfile.pointsBalance} points.`);
      return;
    }
    const discount = Math.min(grossTotal, pts * 2);
    setPointsToRedeem(pts);
    setAppliedPointsDiscount(discount);
    setPointsApplied(true);
    toast.success(`🎉 Applied ${pts} Salo-Salo points for ₱${discount} discount!`);
  };

  const handleRemovePoints = () => {
    setPointsToRedeem(0);
    setAppliedPointsDiscount(0);
    setPointsApplied(false);
    setPointsInput('');
    toast.info('Loyalty points discount removed.');
  };

  const setField = (key: keyof CheckoutData, value: string | boolean) => {
    setData((prev) => ({ ...prev, [key]: value }));
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
    setStep((s) => Math.min(s + 1, 6));
  };

  const prevStep = () => {
    if (data.deliveryMethod === 'pickup' && step === 4) {
      setStep(2);
      return;
    }
    setStep((s) => Math.max(s - 1, 0));
  };

  const placeOrder = async () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty!');
      return;
    }
    setPlacing(true);
    await new Promise((r) => setTimeout(r, 1200));

    const orderNumber = generateOrderNumber();
    const now = new Date().toISOString();
    const timeline: OrderTimeline[] = [
      { status: 'pending', timestamp: now, note: 'Order placed successfully' },
    ];

    // 1. Redeem points from customer's loyalty ledger if applied
    if (pointsApplied && pointsToRedeem > 0 && sukiProfile) {
      const redemptionResult = redeemPointsAtCheckout(
        sukiProfile.customerId,
        pointsToRedeem,
        orderNumber
      );
      if (!redemptionResult.success) {
        setPlacing(false);
        toast.error(redemptionResult.error || 'Failed to redeem loyalty points.');
        return;
      }
      // Also apply directly to user profile in Firebase
      applyPointsTowardsDiscount(user?.id || data.email, pointsToRedeem, orderNumber).catch(() => {});
    }

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
      discount: appliedPointsDiscount,
      deliveryFee,
      serviceFee: 0,
      tax: 0,
      total,
      paymentMethod: data.paymentMethod,
      paymentStatus: ['cod', 'cop'].includes(data.paymentMethod) ? 'cod' : 'pending',
      deliveryMethod: data.deliveryMethod,
      deliveryAddress:
        data.deliveryMethod === 'delivery'
          ? {
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
            }
          : undefined,
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
    const deductionItems = cart.map((item) => ({
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

    // Record customer spending & loyalty in Firebase user profile
    if (user?.id || data.email) {
      const customerIdent = user?.id || data.email;
      const points = Math.floor(total / 50);
      if (user?.id) {
        updateCustomerSpending(user.id, total, points);
      }
      trackOrderAndAwardLoyaltyPoints(customerIdent, {
        orderId: order.id,
        orderNumber,
        totalAmount: total,
        pointsRedeemed: pointsApplied ? pointsToRedeem : 0,
        discountApplied: appliedPointsDiscount,
      }).catch(() => {});
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <div className="flex-1 py-8">
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
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      isCurrent
                        ? 'bg-primary text-secondary font-black shadow-sm'
                        : isDone
                        ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
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
                        <input
                          value={data.name}
                          onChange={(e) => setField('name', e.target.value)}
                          placeholder="Juan dela Cruz"
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">Mobile Number *</label>
                        <input
                          value={data.mobile}
                          onChange={(e) => setField('mobile', e.target.value)}
                          placeholder="09XX-XXX-XXXX"
                          className="input-field"
                          type="tel"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">Email Address *</label>
                        <input
                          value={data.email}
                          onChange={(e) => setField('email', e.target.value)}
                          placeholder="you@email.com"
                          className="input-field"
                          type="email"
                        />
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
                        { value: 'delivery', icon: '🚚', label: 'Delivery', desc: 'Delivered hot to your door in Cavite' },
                        { value: 'pickup', icon: '🏪', label: 'Pickup', desc: 'Pickup at Victoria Reyes, Dasmariñas' },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setField('deliveryMethod', opt.value as 'delivery' | 'pickup')}
                          className={`p-5 rounded-2xl border-2 text-left transition-all ${
                            data.deliveryMethod === opt.value
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
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
                          {DELIVERY_ZONES.filter((z) => z.active).map((zone) => (
                            <button
                              key={zone.id}
                              onClick={() => setField('selectedZone', zone.id)}
                              className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                                data.selectedZone === zone.id
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border hover:border-primary/50'
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-semibold text-sm">{zone.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {zone.city} • ~{zone.estimatedTime} min delivery
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-primary">
                                    {subtotal >= 2000 ? 'FREE' : formatPrice(zone.deliveryFee)}
                                  </p>
                                  {zone.freeDeliveryThreshold && (
                                    <p className="text-[10px] text-muted-foreground">
                                      Free over {formatPrice(zone.freeDeliveryThreshold)}
                                    </p>
                                  )}
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
                        { value: false, icon: '📅', label: 'Schedule for Later', desc: 'Pick a specific party date & time' },
                      ].map((opt) => (
                        <button
                          key={String(opt.value)}
                          onClick={() => setField('isAsap', opt.value)}
                          className={`p-5 rounded-2xl border-2 text-left transition-all ${
                            data.isAsap === opt.value
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
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
                          <input
                            type="date"
                            value={data.scheduledDate}
                            onChange={(e) => setField('scheduledDate', e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="input-field"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-2">Time</label>
                          <select
                            value={data.scheduledTime}
                            onChange={(e) => setField('scheduledTime', e.target.value)}
                            className="input-field"
                          >
                            <option value="">Select time...</option>
                            {[
                              '08:00',
                              '09:00',
                              '10:00',
                              '11:00',
                              '12:00',
                              '13:00',
                              '14:00',
                              '15:00',
                              '16:00',
                              '17:00',
                              '18:00',
                              '19:00',
                            ].map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
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
                        <input
                          value={data.house}
                          onChange={(e) => setField('house', e.target.value)}
                          placeholder="123"
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">Street *</label>
                        <input
                          value={data.street}
                          onChange={(e) => setField('street', e.target.value)}
                          placeholder="Rizal Ave"
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">Barangay *</label>
                        <input
                          value={data.barangay}
                          onChange={(e) => setField('barangay', e.target.value)}
                          placeholder="Victoria Reyes"
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">City *</label>
                        <input
                          value={data.city}
                          onChange={(e) => setField('city', e.target.value)}
                          placeholder="Dasmariñas"
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">Province</label>
                        <input
                          value={data.province}
                          onChange={(e) => setField('province', e.target.value)}
                          placeholder="Cavite"
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">Postal Code</label>
                        <input
                          value={data.postalCode}
                          onChange={(e) => setField('postalCode', e.target.value)}
                          placeholder="4114"
                          className="input-field"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-semibold mb-2">Landmark</label>
                        <input
                          value={data.landmark}
                          onChange={(e) => setField('landmark', e.target.value)}
                          placeholder="Near chapel, green gate"
                          className="input-field"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-semibold mb-2">Delivery Notes</label>
                        <textarea
                          value={data.deliveryNotes}
                          onChange={(e) => setField('deliveryNotes', e.target.value)}
                          placeholder="Any special handling or delivery instructions..."
                          rows={2}
                          className="input-field resize-none"
                        />
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
                      {PAYMENT_METHODS.filter((pm) => {
                        if (data.deliveryMethod === 'pickup' && pm.type === 'cod') return false;
                        if (data.deliveryMethod === 'delivery' && pm.type === 'cop') return false;
                        return pm.enabled;
                      }).map((pm) => (
                        <button
                          key={pm.id}
                          onClick={() => setField('paymentMethod', pm.id)}
                          className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                            data.paymentMethod === pm.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${
                                data.paymentMethod === pm.id ? 'border-primary' : 'border-muted-foreground'
                              }`}
                            >
                              {data.paymentMethod === pm.id && (
                                <div className="w-full h-full rounded-full bg-primary scale-[0.6]" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-sm text-foreground">{pm.name}</p>
                              {pm.instructions && data.paymentMethod === pm.id && (
                                <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line">
                                  {pm.instructions}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Interactive E-Wallet QR Code Generator */}
                    {['gcash', 'maya', 'qr_code', 'bpi'].includes(data.paymentMethod) && (
                      <div className="mt-5 p-5 rounded-2xl bg-card border-2 border-primary/40 shadow-sm space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                              <QrCode size={18} />
                            </div>
                            <div>
                              <h3 className="font-black text-sm text-foreground" style={{ fontFamily: 'Nunito' }}>
                                E-Wallet Payment QR Code
                              </h3>
                              <p className="text-[11px] text-muted-foreground">
                                Scan using GCash, Maya, or any QR Ph banking app to pay instantly
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-600 flex items-center gap-1">
                            <ShieldCheck size={11} /> Verified Merchant (Cavite)
                          </span>
                        </div>

                        {/* E-Wallet Tab Switcher */}
                        <div className="flex rounded-xl bg-muted p-1 gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedWallet('gcash')}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              selectedWallet === 'gcash'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            🔵 GCash QR
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedWallet('maya')}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              selectedWallet === 'maya'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            🟢 Maya QR
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedWallet('qrph')}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              selectedWallet === 'qrph'
                                ? 'bg-primary text-secondary font-black shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            🇵🇭 QR Ph (National QR)
                          </button>
                        </div>

                        {/* Generated QR Code Card */}
                        <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-muted/40 border border-border/80">
                          <div className="p-3 bg-white rounded-2xl shadow-md border border-border flex flex-col items-center flex-shrink-0">
                            {qrCodeDataUrl ? (
                              <img
                                src={qrCodeDataUrl}
                                alt="Kimae's Payment QR Code"
                                className="w-40 h-40 object-contain rounded-lg"
                              />
                            ) : (
                              <div className="w-40 h-40 flex items-center justify-center text-xs text-muted-foreground">
                                Generating QR...
                              </div>
                            )}
                            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest mt-1">
                              {selectedWallet === 'gcash'
                                ? 'GCash Merchant'
                                : selectedWallet === 'maya'
                                ? 'Maya Official'
                                : 'QR Ph Standard'}
                            </span>
                          </div>

                          <div className="space-y-2 flex-1 w-full text-xs">
                            <div>
                              <span className="text-muted-foreground text-[10px] uppercase font-semibold">
                                Exact Amount to Pay
                              </span>
                              <p className="text-2xl font-black text-primary" style={{ fontFamily: 'Nunito' }}>
                                {formatPrice(total)}
                              </p>
                            </div>

                            <div className="p-2.5 rounded-xl bg-card border border-border/80 space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Account Name:</span>
                                <strong className="text-foreground">Kimae's Party Bilao</strong>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Mobile / QR ID:</span>
                                <span className="font-mono font-bold text-foreground">0917-123-4567</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Branch / City:</span>
                                <span className="text-foreground">Dasmariñas, Cavite</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 pt-1 flex-wrap">
                              {qrCodeDataUrl && (
                                <a
                                  href={qrCodeDataUrl}
                                  download={`kimaes_payment_qr_${selectedWallet}.png`}
                                  className="px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                                >
                                  <Download size={13} /> Save QR Image
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard?.writeText('09171234567');
                                  toast.success('Mobile number 0917-123-4567 copied to clipboard!');
                                }}
                                className="px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                              >
                                <Copy size={13} /> Copy Number
                              </button>
                            </div>

                            <p className="text-[11px] text-muted-foreground italic leading-relaxed pt-1">
                              Tip: Save the QR image to scan from your photo gallery in GCash or Maya app.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 5: Review */}
                {step === 5 && (
                  <div className="space-y-6">
                    <h2 className="font-black text-xl" style={{ fontFamily: 'Nunito' }}>
                      📋 Order Review & Confirmation
                    </h2>

                    <div className="space-y-4">
                      <div className="bg-muted/40 rounded-xl p-4 border border-border">
                        <h3 className="font-semibold text-sm mb-2 text-foreground">
                          📦 Bilao Items ({cart.length})
                        </h3>
                        {cart.map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between items-start text-sm py-2 border-b border-border/60 last:border-0"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-foreground">
                                {item.product.name} x{item.quantity}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {Object.values(item.selectedOptions).flat().join(', ')}
                              </p>
                            </div>
                            <span className="font-bold text-foreground">
                              {formatPrice(
                                ((item.product.promoPrice || item.product.price) + item.optionPriceAdd) *
                                  item.quantity
                              )}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-muted/40 rounded-xl p-4 text-sm border border-border">
                          <h3 className="font-semibold mb-2 text-foreground">👤 Customer</h3>
                          <p className="font-bold">{data.name}</p>
                          <p className="text-muted-foreground text-xs">{data.mobile}</p>
                          <p className="text-muted-foreground text-xs">{data.email}</p>
                        </div>
                        <div className="bg-muted/40 rounded-xl p-4 text-sm border border-border">
                          <h3 className="font-semibold mb-2 text-foreground">🚚 Delivery Details</h3>
                          <p className="font-medium capitalize">{data.deliveryMethod}</p>
                          {data.deliveryMethod === 'delivery' && (
                            <p className="text-muted-foreground text-xs">
                              {data.house} {data.street}, {data.barangay}, {data.city}
                            </p>
                          )}
                          <p className="text-muted-foreground text-xs">
                            {data.isAsap ? '⚡ ASAP (60-90 min)' : `📅 ${data.scheduledDate} at ${data.scheduledTime}`}
                          </p>
                        </div>
                        <div className="bg-muted/40 rounded-xl p-4 text-sm sm:col-span-2 border border-border">
                          <h3 className="font-semibold mb-1 text-foreground">
                            💳 Payment: {paymentMethod?.name}
                          </h3>
                          {paymentMethod?.instructions && (
                            <p className="text-muted-foreground text-xs whitespace-pre-line">
                              {paymentMethod.instructions}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Loyalty Discount Review in Step 5 */}
                      {appliedPointsDiscount > 0 && (
                        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <Award className="text-emerald-600" size={18} />
                            <div>
                              <p className="font-bold text-emerald-800 dark:text-emerald-300">
                                Salo-Salo Points Discount Applied!
                              </p>
                              <p className="text-muted-foreground text-[11px]">
                                Redeemed {pointsToRedeem} points for a direct discount of {formatPrice(appliedPointsDiscount)}.
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={handleRemovePoints}
                            className="text-destructive font-bold hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Navigation buttons */}
                <div className="flex gap-3 mt-8">
                  {step > 0 && (
                    <button onClick={prevStep} className="btn-outline flex-1 py-3 font-bold text-xs">
                      ← Back
                    </button>
                  )}
                  {step < 5 ? (
                    <button onClick={nextStep} className="btn-primary flex-1 py-3 font-bold text-xs">
                      Continue →
                    </button>
                  ) : (
                    <button
                      onClick={placeOrder}
                      disabled={placing}
                      className="btn-primary flex-1 text-base py-3.5 font-black shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all"
                    >
                      {placing ? '⏳ Placing Bilao Feast Order...' : `🎉 Place Order (${formatPrice(total)})`}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Order Summary & Loyalty Redemption sidebar */}
            <div className="space-y-4">
              {/* Salo-Salo Loyalty Points Redemption Card */}
              <div className="bg-card rounded-2xl border border-primary/30 p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Award size={18} className="text-primary" />
                    <h3 className="font-black text-sm text-foreground" style={{ fontFamily: 'Nunito' }}>
                      Salo-Salo Rewards
                    </h3>
                  </div>
                  {sukiProfile && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-black uppercase flex items-center gap-1">
                      <Crown size={10} />
                      {sukiProfile.currentTier}
                    </span>
                  )}
                </div>

                {sukiProfile ? (
                  <div className="space-y-2.5">
                    <div className="p-3 rounded-xl bg-muted/50 border border-border text-xs flex justify-between items-center">
                      <div>
                        <p className="text-muted-foreground text-[11px]">Your Points Balance</p>
                        <p className="font-black text-base text-foreground mt-0.5" style={{ fontFamily: 'Nunito' }}>
                          {sukiProfile.pointsBalance}{' '}
                          <span className="text-xs font-normal text-muted-foreground">
                            (₱{sukiProfile.monetaryValue} value)
                          </span>
                        </p>
                      </div>
                      <span className="text-[10px] text-primary font-bold">1 pt = ₱2 off</span>
                    </div>

                    {pointsApplied ? (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                          <CheckCircle2 size={16} />
                          <div>
                            <p className="font-bold">Points Applied: -{formatPrice(appliedPointsDiscount)}</p>
                            <p className="text-[10px] text-muted-foreground">Using {pointsToRedeem} points</p>
                          </div>
                        </div>
                        <button
                          onClick={handleRemovePoints}
                          className="px-2 py-1 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive text-[11px] font-bold"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {maxRedeemablePoints >= 5 ? (
                          <>
                            <div className="flex gap-1.5 flex-wrap">
                              {sukiProfile.pointsBalance >= 10 && (
                                <button
                                  type="button"
                                  onClick={() => handleApplyPoints(10)}
                                  className="px-2 py-1 rounded-lg bg-muted hover:bg-primary/20 text-[11px] font-bold border border-border"
                                >
                                  10 pts (₱20)
                                </button>
                              )}
                              {sukiProfile.pointsBalance >= 25 && (
                                <button
                                  type="button"
                                  onClick={() => handleApplyPoints(25)}
                                  className="px-2 py-1 rounded-lg bg-muted hover:bg-primary/20 text-[11px] font-bold border border-border"
                                >
                                  25 pts (₱50)
                                </button>
                              )}
                              {sukiProfile.pointsBalance >= 50 && (
                                <button
                                  type="button"
                                  onClick={() => handleApplyPoints(50)}
                                  className="px-2 py-1 rounded-lg bg-muted hover:bg-primary/20 text-[11px] font-bold border border-border"
                                >
                                  50 pts (₱100)
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleApplyPoints(maxRedeemablePoints)}
                                className="px-2 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-black border border-primary/20"
                              >
                                Max ({maxRedeemablePoints} pts)
                              </button>
                            </div>

                            <div className="flex gap-2">
                              <input
                                type="number"
                                min={5}
                                max={maxRedeemablePoints}
                                placeholder="Custom points (min 5)"
                                value={pointsInput}
                                onChange={(e) => setPointsInput(e.target.value)}
                                className="flex-1 input-field py-1.5 text-xs"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const parsed = parseInt(pointsInput, 10);
                                  if (isNaN(parsed)) {
                                    toast.error('Please enter valid points amount');
                                    return;
                                  }
                                  handleApplyPoints(parsed);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-primary text-secondary text-xs font-black shadow-sm"
                              >
                                Apply
                              </button>
                            </div>
                          </>
                        ) : (
                          <p className="text-[11px] text-muted-foreground">
                            Minimum 5 points needed to redeem discounts. Keep ordering to build your points!
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>
                      Join Kimae's Salo-Salo Rewards to earn 2 points for every ₱200 spent on bilao orders.
                    </p>
                    <p className="text-[11px] text-primary font-semibold">
                      Points can be used as direct cash discounts at checkout!
                    </p>
                  </div>
                )}
              </div>

              {/* Order Summary sidebar */}
              <div className="bg-card rounded-2xl border border-border p-5 shadow-sm sticky top-24">
                <h3 className="font-black text-base mb-4 text-foreground" style={{ fontFamily: 'Nunito' }}>
                  Order Summary
                </h3>
                <div className="space-y-3 mb-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex gap-3 items-start">
                      <img
                        src={item.product.images[0]}
                        alt=""
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold leading-tight truncate text-foreground">
                          {item.product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                      </div>
                      <span className="text-xs font-bold text-primary flex-shrink-0">
                        {formatPrice(
                          ((item.product.promoPrice || item.product.price) + item.optionPriceAdd) *
                            item.quantity
                        )}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-3 space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="text-foreground">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Delivery</span>
                    <span>
                      {deliveryFee === 0 ? (
                        <span className="text-green-600 font-bold">FREE</span>
                      ) : (
                        <span className="text-foreground">{formatPrice(deliveryFee)}</span>
                      )}
                    </span>
                  </div>

                  {appliedPointsDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span className="flex items-center gap-1">
                        <Award size={13} />
                        Loyalty Points ({pointsToRedeem} pts)
                      </span>
                      <span>-{formatPrice(appliedPointsDiscount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between font-black text-lg pt-2 border-t border-border">
                    <span className="text-foreground">Total</span>
                    <span className="text-primary">{formatPrice(total)}</span>
                  </div>

                  {/* Future Points to Earn Preview */}
                  <div className="pt-2 text-[11px] text-muted-foreground bg-primary/5 rounded-xl p-2.5 border border-primary/10">
                    <p className="flex items-center gap-1 font-bold text-foreground">
                      <Sparkles size={12} className="text-primary" />
                      Salo-Salo Rewards Earning
                    </p>
                    <p className="mt-0.5">
                      You will earn approx. <strong className="text-primary">{Math.floor(total / 100)} points</strong> on this bilao order!
                    </p>
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
