import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';

export default function HowToOrderPage() {
  const steps = [
    { step: 1, icon: '🍽️', title: 'Browse the Menu', desc: 'Visit our Menu page and explore our Party Bilao, Food Trays, and Packages. Use filters to find what you need quickly.', tip: 'Try the "Party Bilao" category for our signature dishes!' },
    { step: 2, icon: '✏️', title: 'Customize Your Order', desc: 'Select your bilao size, choose your food selections, and add extras like sauces, drinks, or desserts.', tip: 'Add special instructions for any dietary needs or preferences.' },
    { step: 3, icon: '🛒', title: 'Review Your Cart', desc: 'Check your items, apply a promo code, and review your order summary before proceeding.', tip: 'Use code WELCOME50 for ₱50 off your first order!' },
    { step: 4, icon: '📝', title: 'Fill in Your Details', desc: 'Enter your name, mobile number, email, and complete delivery address at checkout.', tip: 'Create an account to save your address for future orders.' },
    { step: 5, icon: '🚚', title: 'Choose Delivery or Pickup', desc: 'Select delivery to your address or pick up from our store. Choose ASAP or schedule for a specific time.', tip: 'Free delivery on orders ₱2,000 and above!' },
    { step: 6, icon: '💳', title: 'Select Payment Method', desc: 'Pay via GCash, Maya, bank transfer, or cash on delivery/pickup. E-wallet payments are instant.', tip: 'GCash and Maya payments get priority processing!' },
    { step: 7, icon: '📥', title: 'Place Your Order', desc: 'Review everything and click "Place Order". You\'ll receive your order number immediately.', tip: 'Screenshot your order number for easy tracking!' },
    { step: 8, icon: '📍', title: 'Track in Real-Time', desc: 'Use your order number to track your order status from preparation to delivery on our Track Order page.', tip: 'You\'ll be notified at each stage of your order.' },
    { step: 9, icon: '🎉', title: 'Enjoy!', desc: 'Your food arrives fresh and ready. Enjoy with family and friends! Don\'t forget to rate your experience.', tip: 'Share your photos and tag us on Facebook!' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1">
        <div className="hero-gradient py-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 woven-bg opacity-20" />
          <div className="relative container mx-auto px-4">
            <h1 className="text-4xl font-black text-white mb-2" style={{ fontFamily: 'Nunito' }}>How to Order</h1>
            <p className="text-white/70">Simple steps to get your party food</p>
          </div>
        </div>

        <section className="py-16">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="space-y-6">
              {steps.map(({ step, icon, title, desc, tip }) => (
                <div key={step} className="flex gap-5">
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 rounded-2xl bg-secondary text-white flex items-center justify-center text-2xl flex-shrink-0 shadow-warm">
                      {icon}
                    </div>
                    {step < steps.length && <div className="w-0.5 flex-1 bg-border mt-3" />}
                  </div>
                  <div className="pb-6 flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-black flex items-center justify-center">
                        {step}
                      </span>
                      <h3 className="font-black text-xl text-foreground" style={{ fontFamily: 'Nunito' }}>{title}</h3>
                    </div>
                    <p className="text-muted-foreground leading-relaxed mb-3">{desc}</p>
                    <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-2 text-sm text-primary font-medium">
                      💡 {tip}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 yellow-gradient rounded-3xl p-8 text-center">
              <h2 className="text-2xl font-black text-secondary mb-4" style={{ fontFamily: 'Nunito' }}>Ready? Let's Go! 🎉</h2>
              <p className="text-secondary/70 mb-6">Start your order now and get fresh, authentic Filipino party food at your door.</p>
              <a href="/menu" className="btn-secondary inline-flex items-center gap-2 text-lg px-8 py-4">
                Order Now 🍽️
              </a>
            </div>
          </div>
        </section>
      </div>
      <Footer />
      <MobileNav />
    </div>
  );
}
