import React, { useState, useEffect, useMemo } from 'react';
import {
  Award,
  Sparkles,
  Gift,
  Crown,
  TrendingUp,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Package,
  Calendar,
  AlertCircle,
  HelpCircle,
  Percent,
  Coins,
  ChevronRight,
  DollarSign,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { formatPrice } from '@/lib/store';
import {
  subscribeToCustomerLoyalty,
  applyPointsTowardsDiscount,
  FirebaseUserProfileLoyalty,
} from '@/services/firebaseLoyaltyService';
import { toast } from 'sonner';

interface CustomerLoyaltyRewardsModuleProps {
  onApplyDiscountToCart?: (discount: number) => void;
  className?: string;
}

export default function CustomerLoyaltyRewardsModule({
  onApplyDiscountToCart,
  className = '',
}: CustomerLoyaltyRewardsModuleProps) {
  const { user } = useAuth();
  const { cart, applyPromoCode } = useCart();
  const [loyalty, setLoyalty] = useState<FirebaseUserProfileLoyalty | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Redemption interactive calculator state
  const [pointsToRedeem, setPointsToRedeem] = useState<number>(25);
  const [redeeming, setRedeeming] = useState<boolean>(false);
  const [copiedVoucher, setCopiedVoucher] = useState<string | null>(null);

  // Subscribe to live loyalty rewards stored in Firebase Firestore
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const unsub = subscribeToCustomerLoyalty(user.id || user.email, (syncedLoyalty) => {
      setLoyalty(syncedLoyalty);
      setLoading(false);
      // Pre-set default redemption points to a reasonable valid amount
      if (syncedLoyalty.pointsBalance > 0) {
        setPointsToRedeem((prev) =>
          Math.min(syncedLoyalty.pointsBalance, Math.max(10, prev))
        );
      }
    });

    return unsub;
  }, [user]);

  const maxRedeemablePoints = loyalty?.pointsBalance || 0;
  const calculatedDiscount = pointsToRedeem * 2; // 1 point = ₱2

  const handleApplyDiscount = async () => {
    if (!user || !loyalty) return;
    if (pointsToRedeem <= 0) {
      toast.error('Please enter a valid amount of points to redeem.');
      return;
    }
    if (pointsToRedeem > loyalty.pointsBalance) {
      toast.error(`You only have ${loyalty.pointsBalance} points available.`);
      return;
    }

    setRedeeming(true);
    try {
      const result = await applyPointsTowardsDiscount(
        user.id || user.email,
        pointsToRedeem,
        `FEAST-${Date.now().toString().slice(-4)}`
      );

      if (result.success) {
        if (onApplyDiscountToCart) {
          onApplyDiscountToCart(result.discountAmount);
        }
        // Auto apply voucher code to cart if available
        const voucherCode = `SUKI-REDEEM-${result.discountAmount}`;
        applyPromoCode(voucherCode);
        toast.success(
          `🎉 Applied ₱${result.discountAmount} discount towards your order! Balance: ${result.newBalance} pts.`
        );
      } else {
        toast.error(result.error || 'Failed to redeem points.');
      }
    } catch {
      toast.error('Could not apply discount at this time. Please try again.');
    } finally {
      setRedeeming(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedVoucher(code);
    toast.success(`Copied discount code: ${code}`);
    setTimeout(() => setCopiedVoucher(null), 2500);
  };

  if (!user) {
    return (
      <div className="p-8 rounded-3xl bg-card border border-border text-center max-w-md mx-auto">
        <Award size={48} className="text-primary mx-auto mb-3" />
        <h3 className="font-black text-lg text-foreground" style={{ fontFamily: 'Nunito' }}>
          Salo-Salo Loyalty Rewards
        </h3>
        <p className="text-xs text-muted-foreground mt-1 mb-4">
          Log in or create a customer account to earn points on every party bilao and unlock cash discounts!
        </p>
      </div>
    );
  }

  if (loading || !loyalty) {
    return (
      <div className="p-12 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-xs text-muted-foreground">Loading your loyalty rewards profile from Firebase...</p>
      </div>
    );
  }

  const isVip = loyalty.tier === 'VIP Fiesta';
  const isCorporate = loyalty.tier === 'Brigada Corporate';
  const progressPercent = Math.min(100, (loyalty.qualifyingSpend6Months / 8000) * 100);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Top Header & Firebase Sync Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-foreground" style={{ fontFamily: 'Nunito' }}>
              Salo-Salo Loyalty Rewards Pass
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
              <Sparkles size={11} /> {loyalty.tier}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Earn 2 points for every ₱200 spent on party bilaos. Points apply directly as cash discounts.
          </p>
        </div>

        {/* Firebase Sync Indicator */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold self-start sm:self-auto shadow-sm">
          <ShieldCheck size={15} />
          <span>Synced to Firebase Profile</span>
        </div>
      </div>

      {/* Digital VIP Membership Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#3b1d0c] via-[#241207] to-[#120903] text-white p-6 sm:p-8 shadow-2xl border border-primary/40">
        {/* Background weave styling */}
        <div className="absolute inset-0 woven-bg opacity-15 pointer-events-none" />
        <div className="absolute -right-8 -bottom-8 w-48 h-48 rounded-full bg-primary/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between min-h-[220px]">
          {/* Card Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl text-primary tracking-wide" style={{ fontFamily: 'Nunito' }}>
                  Kimae's Party Bilao
                </span>
                <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">
                  Cavite Official
                </span>
              </div>
              <p className="text-xs text-amber-200/90 font-bold uppercase tracking-wider mt-0.5">
                VIP Suki Loyalty Rewards Pass
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-primary text-secondary px-3.5 py-1.2 rounded-full text-xs font-black uppercase tracking-wider shadow-md">
              <Crown size={13} />
              <span>{loyalty.tier}</span>
            </div>
          </div>

          {/* Points Balance Big Display */}
          <div className="my-5">
            <p className="text-[11px] text-white/70 font-bold uppercase tracking-wider">
              Available Rewards Balance
            </p>
            <div className="flex items-baseline gap-3 mt-1 flex-wrap">
              <span className="text-4xl sm:text-5xl font-black text-primary" style={{ fontFamily: 'Nunito' }}>
                {loyalty.pointsBalance}
              </span>
              <span className="text-base font-bold text-white/90">Points</span>
              <span className="text-xs sm:text-sm font-black text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-3 py-1 rounded-full shadow-inner flex items-center gap-1">
                <Coins size={14} className="text-amber-400" />
                = ₱{loyalty.monetaryValue}.00 Cash Discount
              </span>
            </div>
          </div>

          {/* Card Footer Details */}
          <div className="flex items-end justify-between pt-4 border-t border-white/10 flex-wrap gap-3 text-xs">
            <div>
              <p className="text-[10px] text-white/50 uppercase tracking-widest font-semibold">
                Member Details
              </p>
              <p className="font-bold text-white text-sm mt-0.5">{loyalty.customerName}</p>
              <p className="text-xs text-white/75 font-mono">{loyalty.customerMobile || user.email}</p>
            </div>

            <div className="text-right">
              <p className="text-[10px] text-white/50 uppercase tracking-widest font-semibold">
                Suki ID & Status
              </p>
              <p className="font-mono text-xs text-primary font-bold">{loyalty.customerId}</p>
              <p className="text-[10px] text-white/60">
                Lifetime: <strong>{loyalty.lifetimePointsEarned} pts earned</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Points-to-Discount Application Calculator */}
      <div className="bg-card rounded-3xl border-2 border-primary/30 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-black text-lg text-foreground flex items-center gap-2" style={{ fontFamily: 'Nunito' }}>
              <Coins size={20} className="text-primary" />
              Apply Points Towards Future Discounts
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              1 Suki Point = ₱2.00 cash discount. Redeem instantly against your order or active cart.
            </p>
          </div>

          <span className="text-xs text-muted-foreground font-semibold">
            Max Redeemable: <strong className="text-primary">{maxRedeemablePoints} pts</strong>
          </span>
        </div>

        {/* Quick Amount Preset Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-bold text-muted-foreground mr-1">Quick Select:</span>
          {[
            { pts: 10, discount: 20 },
            { pts: 25, discount: 50 },
            { pts: 50, discount: 100 },
            { pts: 100, discount: 200 },
          ].map((preset) => {
            const isSelected = pointsToRedeem === preset.pts;
            const isAvailable = maxRedeemablePoints >= preset.pts;
            return (
              <button
                key={preset.pts}
                type="button"
                disabled={!isAvailable}
                onClick={() => setPointsToRedeem(preset.pts)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-primary text-secondary font-black shadow-sm scale-105'
                    : isAvailable
                    ? 'bg-muted text-foreground hover:bg-muted/80 border border-border'
                    : 'opacity-40 cursor-not-allowed bg-muted/40 text-muted-foreground'
                }`}
              >
                {preset.pts} pts (₱{preset.discount} OFF)
              </button>
            );
          })}
          {maxRedeemablePoints > 0 && (
            <button
              type="button"
              onClick={() => setPointsToRedeem(maxRedeemablePoints)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                pointsToRedeem === maxRedeemablePoints
                  ? 'bg-primary text-secondary'
                  : 'bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20'
              }`}
            >
              Max All ({maxRedeemablePoints} pts)
            </button>
          )}
        </div>

        {/* Slider & Input */}
        <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <input
                type="range"
                min={0}
                max={Math.max(10, maxRedeemablePoints)}
                step={5}
                value={pointsToRedeem}
                onChange={(e) => setPointsToRedeem(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer"
                disabled={maxRedeemablePoints === 0}
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                  Points Selected
                </span>
                <span className="font-mono font-black text-lg text-foreground">
                  {pointsToRedeem} pts
                </span>
              </div>
              <div className="text-right pl-3 border-l border-border">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                  Discount Value
                </span>
                <span className="font-black text-xl text-primary" style={{ fontFamily: 'Nunito' }}>
                  {formatPrice(calculatedDiscount)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              {maxRedeemablePoints >= 5 ? (
                <>
                  Applying will deduct <strong>{pointsToRedeem} points</strong> from your Firebase user profile and give you <strong>₱{calculatedDiscount}.00 OFF</strong>.
                </>
              ) : (
                'You need at least 5 points to redeem discounts. Keep ordering party bilaos to earn!'
              )}
            </p>

            <button
              onClick={handleApplyDiscount}
              disabled={redeeming || maxRedeemablePoints < 5 || pointsToRedeem < 5}
              className="btn-primary px-6 py-2.5 text-xs font-black shadow-md flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
            >
              <Percent size={14} />
              {redeeming ? 'Redeeming from Firebase...' : `Redeem ₱${calculatedDiscount} Discount ⭐`}
            </button>
          </div>
        </div>
      </div>

      {/* Tier Progression Progress Bar */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-sm">
        <div className="flex items-center justify-between text-xs mb-2 flex-wrap gap-2">
          <span className="font-bold text-foreground flex items-center gap-1.5">
            <TrendingUp size={15} className="text-primary" />
            Tier Milestone Status: <strong className="text-primary">{loyalty.tier}</strong>
          </span>
          <span className="text-muted-foreground font-semibold">
            Qualifying 6-Month Spend: <strong>{formatPrice(loyalty.qualifyingSpend6Months)}</strong> / ₱8,000
          </span>
        </div>

        <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-primary rounded-full transition-all duration-500 shadow-sm"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <p className="text-[11px] text-muted-foreground mt-2">
          {isVip ? (
            '⭐ You have unlocked the VIP Fiesta Tier! Enjoy priority cooking slots and double points during Cavite holiday celebrations.'
          ) : (
            <>
              Spend <strong>{formatPrice(Math.max(0, 8000 - loyalty.qualifyingSpend6Months))}</strong> more over 6 months to level up to <strong>VIP Fiesta Tier</strong> for double rewards and fiesta perks!
            </>
          )}
        </p>
      </div>

      {/* Order Rewards History (Stored within Firebase User Profile) */}
      <div className="bg-card rounded-3xl border border-border p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-black text-base text-foreground flex items-center gap-2" style={{ fontFamily: 'Nunito' }}>
              <Clock size={18} className="text-primary" />
              Order Rewards History & Points Ledger
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live points earned and discounts redeemed across your orders, tracked in Firebase Firestore
            </p>
          </div>

          <span className="text-xs text-muted-foreground">
            Total Orders Tracked: <strong>{loyalty.orderHistory?.length || loyalty.orderCount || 0}</strong>
          </span>
        </div>

        {(!loyalty.orderHistory || loyalty.orderHistory.length === 0) ? (
          <div className="text-center py-10 text-xs text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border">
            <Package size={36} className="text-muted-foreground/30 mx-auto mb-2" />
            <p className="font-bold text-foreground">No rewards history yet</p>
            <p className="mt-0.5">Order your first party bilao to start accumulating points and unlocking cash discounts!</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {loyalty.orderHistory.map((item) => (
              <div key={item.id} className="py-3.5 flex items-center justify-between gap-4 text-xs flex-wrap">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground font-mono">
                      Order #{item.orderNumber}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-primary/10 text-primary">
                      {item.tierAtTime}
                    </span>
                    {item.discountApplied > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-600">
                        ₱{item.discountApplied} Discount
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{item.remarks}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {new Date(item.orderDate || item.createdAt).toLocaleDateString('en-PH', {
                      dateStyle: 'medium',
                    })}
                  </p>
                </div>

                <div className="text-right">
                  {item.pointsEarned > 0 && (
                    <p className="font-black text-sm text-emerald-600">
                      +{item.pointsEarned} pts
                    </p>
                  )}
                  {item.pointsRedeemed > 0 && (
                    <p className="font-black text-sm text-amber-600">
                      -{item.pointsRedeemed} pts
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    Feast Total: {formatPrice(item.orderTotal)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Salo-Salo Loyalty Perks 3-Column Info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm mb-2">
            1
          </div>
          <h4 className="font-bold text-xs text-foreground uppercase tracking-wide">
            Earn 2 Pts per ₱200
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            Points accumulate automatically on every Pancit Malabon, Palabok, food tray, and beverage feast.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black text-sm mb-2">
            2
          </div>
          <h4 className="font-bold text-xs text-foreground uppercase tracking-wide">
            1 Point = ₱2 Cash OFF
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            Redeem points on your next catering gathering. Start redeeming with as little as 5 points (₱10 OFF).
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border">
          <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-black text-sm mb-2">
            3
          </div>
          <h4 className="font-bold text-xs text-foreground uppercase tracking-wide">
            Stored in Firebase
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            Your points, vouchers, and rewards ledger are safely stored in your cloud Firebase user profile.
          </p>
        </div>
      </div>
    </div>
  );
}
