import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Package, MapPin, Clock, ArrowRight, Home, Share2 } from 'lucide-react';
import { getOrderById, formatPrice } from '@/lib/store';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';

export default function OrderSuccessPage() {
  const { id } = useParams();
  const order = id ? getOrderById(id) : null;

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-4">Order not found</h2>
            <Link to="/" className="btn-primary">Go Home</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="flex-1 bg-background py-12">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          {/* Success icon */}
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle size={56} className="text-green-500" />
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-foreground mb-3" style={{ fontFamily: 'Nunito' }}>
            Order Placed! 🎉
          </h1>
          <p className="text-muted-foreground mb-2">Thank you for your order, {order.customer.name}!</p>
          <p className="text-lg font-bold text-primary mb-8">Order #{order.orderNumber}</p>

          {/* Order summary card */}
          <div className="bg-card rounded-2xl border border-border p-6 text-left mb-6 shadow-sm">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-start gap-3">
                <Package size={20} className="text-primary mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Delivery Method</p>
                  <p className="font-semibold text-sm capitalize">{order.deliveryMethod}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock size={20} className="text-primary mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Est. Prep Time</p>
                  <p className="font-semibold text-sm">{order.estimatedPrepTime} minutes</p>
                </div>
              </div>
              {order.deliveryAddress && (
                <div className="col-span-2 flex items-start gap-3">
                  <MapPin size={20} className="text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Delivery Address</p>
                    <p className="font-semibold text-sm">{order.deliveryAddress.fullAddress}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Payment: {order.paymentMethod.toUpperCase()}</p>
                  <p className="font-bold text-xl text-primary mt-1" style={{ fontFamily: 'Nunito' }}>
                    Total: {formatPrice(order.total)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <span className="badge-status bg-amber-100 text-amber-700 text-sm">⏳ Pending</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment instructions */}
          {!['cod', 'cop'].includes(order.paymentMethod) && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left mb-6">
              <h3 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
                💳 Payment Instructions
              </h3>
              <p className="text-sm text-amber-700">
                Please complete your payment to confirm your order. Once we verify your payment, we'll start preparing your food right away!
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to={`/track/${order.id}`} className="btn-primary flex-1 flex items-center justify-center gap-2 py-4">
              <MapPin size={18} /> Track My Order <ArrowRight size={16} />
            </Link>
            <Link to="/" className="btn-outline flex-1 flex items-center justify-center gap-2">
              <Home size={18} /> Back to Home
            </Link>
          </div>

          <div className="mt-6">
            <p className="text-sm text-muted-foreground">
              Questions? Call us: <a href="tel:09915984112" className="text-primary font-semibold">0991 598 4112</a> / <a href="tel:09617722601" className="text-primary font-semibold">0961 772 2601</a>
            </p>
          </div>
        </div>
      </div>

      <Footer />
      <MobileNav />
    </div>
  );
}
