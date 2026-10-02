import React, { useState, useEffect } from 'react';
import {
  Star,
  X,
  Sparkles,
  CheckCircle2,
  Heart,
  MessageSquare,
  ThumbsUp,
  Package,
  Award,
  Edit3,
} from 'lucide-react';
import type { Order } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { submitCustomerFeedback, getFeedbackForOrder } from '@/services/feedbackService';
import { toast } from 'sonner';

interface CustomerFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onSuccess?: () => void;
}

const PRESET_TAGS = [
  'Sobrang Sarap',
  'Hot on Arrival',
  'Generous Serving',
  'Fresh Ingredients',
  'Fast Delivery',
  'Neat Packaging',
  'Friendly Rider',
  'Party Favorite',
  'Good Value',
];

const RATING_LABELS: Record<number, { text: string; color: string }> = {
  5: { text: 'Sobrang Sarap! Bilao Perfection 🎉', color: 'text-amber-500' },
  4: { text: 'Very Good & Delicious 👍', color: 'text-emerald-500' },
  3: { text: 'Good & Satisfactory 😊', color: 'text-blue-500' },
  2: { text: 'Needs Some Improvement ⚠️', color: 'text-orange-500' },
  1: { text: 'Disappointed / Needs Attention ❌', color: 'text-destructive' },
};

export default function CustomerFeedbackModal({
  isOpen,
  onClose,
  order,
  onSuccess,
}: CustomerFeedbackModalProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([PRESET_TAGS[0], PRESET_TAGS[1]]);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [isExisting, setIsExisting] = useState<boolean>(false);

  useEffect(() => {
    if (order && isOpen) {
      const existing = getFeedbackForOrder(order.id) || getFeedbackForOrder(order.orderNumber);
      if (existing) {
        setRating(existing.rating);
        setReviewText(existing.reviewText);
        setSelectedTags(existing.tags && existing.tags.length > 0 ? existing.tags : [PRESET_TAGS[0]]);
        setIsExisting(true);
      } else {
        setRating(5);
        setReviewText('');
        setSelectedTags([PRESET_TAGS[0], PRESET_TAGS[1]]);
        setIsExisting(false);
      }
      setSubmitted(false);
    }
  }, [order, isOpen]);

  if (!isOpen || !order) return null;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim()) {
      toast.error('Please share a few words about your bilao feast experience.');
      return;
    }

    setSubmitting(true);
    try {
      const orderItems = order.items.map((i) => i.product.name);
      await submitCustomerFeedback({
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerId: user?.id || order.customer?.id || 'guest',
        customerName: user?.name || order.customer?.name || 'Suki Customer',
        customerEmail: user?.email || order.customer?.email,
        customerMobile: user?.mobile || order.customer?.mobile,
        rating,
        reviewText: reviewText.trim(),
        tags: selectedTags,
        orderItems,
      });

      setSubmitted(true);
      toast.success('Maraming salamat! Your feedback was saved to Firebase ⭐');
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-secondary via-secondary to-[#42220f] text-secondary-foreground flex items-center justify-between border-b border-primary/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-inner">
              <MessageSquare size={20} />
            </div>
            <div>
              <h3 className="font-black text-base text-primary" style={{ fontFamily: 'Nunito' }}>
                {isExisting ? 'Update Your Review' : 'Rate Your Bilao Feast'}
              </h3>
              <p className="text-xs text-secondary-foreground/75">
                Order #{order.orderNumber} • {order.items.length} item(s) {isExisting && '• Previously Reviewed'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {submitted ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={36} />
              </div>
              <h4 className="font-black text-xl text-foreground" style={{ fontFamily: 'Nunito' }}>
                Review Published! Maraming Salamat!
              </h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Your rating and comments have been stored in Firebase and linked directly to your account.
              </p>
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 font-semibold inline-flex items-center gap-2">
                <Award size={16} /> +15 Salo-Salo Loyalty Bonus Points have been added to your profile!
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-primary px-6 py-2.5 text-xs font-black shadow-sm"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Order items snapshot */}
              <div className="p-3 rounded-2xl bg-muted/40 border border-border text-xs flex items-center gap-2.5">
                <Package size={16} className="text-primary flex-shrink-0" />
                <div className="truncate">
                  <span className="text-muted-foreground">Items: </span>
                  <strong className="text-foreground">
                    {order.items.map((i) => `${i.quantity}x ${i.product.name}`).join(', ')}
                  </strong>
                </div>
              </div>

              {/* Star Rating Interactive */}
              <div className="text-center space-y-2 py-1">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Overall Rating
                </label>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = (hoverRating || rating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 hover:scale-125 transition-transform"
                      >
                        <Star
                          size={32}
                          className={`${
                            active
                              ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                              : 'text-muted-foreground/30'
                          } transition-colors`}
                        />
                      </button>
                    );
                  })}
                </div>
                <p className={`text-xs font-black ${RATING_LABELS[rating]?.color || 'text-primary'}`}>
                  {RATING_LABELS[rating]?.text}
                </p>
              </div>

              {/* Tag Pills */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-foreground">
                  What did you love most? (Tap to select)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-primary text-secondary font-black shadow-sm'
                            : 'bg-muted/70 text-foreground hover:bg-muted border border-border/80'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Text Review */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-foreground">Your Honest Review & Comments</label>
                  <span className="text-[10px] text-muted-foreground">Linked to your account</span>
                </div>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Tell us about the flavor, portion size, packaging, or delivery experience..."
                  rows={4}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none leading-relaxed"
                  required
                />
              </div>

              {/* Loyalty Reward Banner */}
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-900 dark:text-amber-200 flex items-center gap-2">
                <Sparkles size={15} className="text-amber-600 flex-shrink-0" />
                <span>
                  Earn <strong>+15 Salo-Salo Loyalty Points</strong> credited instantly to your account when you submit this review!
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary px-6 py-2.5 text-xs font-black shadow-md flex items-center gap-1.5"
                >
                  {submitting ? 'Saving...' : isExisting ? 'Update Review ⭐' : 'Submit Review ⭐'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
