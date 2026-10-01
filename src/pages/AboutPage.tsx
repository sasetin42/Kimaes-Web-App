import { Link } from 'react-router-dom';
import { ArrowRight, Phone, MapPin, Star } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';
import aboutBanner from '@/assets/about-banner.jpg';
import logoBadge from '@/assets/logo-badge.png';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1">
        {/* Hero */}
        <div className="hero-gradient py-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 woven-bg opacity-20" />
          <div className="relative container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4" style={{ fontFamily: 'Nunito' }}>
              About Kimae's
            </h1>
            <p className="text-white/70 max-w-xl mx-auto">Our story, our passion, our promise to you</p>
          </div>
        </div>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
              <div>
                <img src={logoBadge} alt="Kimae's Logo" className="w-32 h-32 rounded-full shadow-brand mx-auto lg:mx-0 mb-6" />
                <h2 className="section-title mb-4">Our Story</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Kimae's Party Bilao was born out of a deep love for Filipino food and a desire to make every Filipino celebration more special. What started as a small home-based catering service has grown into a trusted party food brand serving thousands of happy customers.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Our founder, Kimae, grew up cooking traditional Filipino dishes passed down through generations. Every bilao we prepare carries that same love, care, and authentic flavor that makes Filipino food truly special.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Today, we serve families across Caloocan, Malabon, Navotas, Valenzuela and beyond — bringing authentic party flavors right to your doorstep.
                </p>
              </div>
              <div>
                <img src={aboutBanner} alt="About Kimae's" className="rounded-3xl shadow-warm w-full h-80 object-cover" />
              </div>
            </div>

            {/* Values */}
            <div className="text-center mb-12">
              <h2 className="section-title mb-3">Our Values</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              {[
                { icon: '🌾', title: 'Fresh Ingredients', desc: 'We source only the freshest ingredients for every order.' },
                { icon: '❤️', title: 'Made with Love', desc: 'Every dish is prepared with passion and genuine care.' },
                { icon: '🎉', title: 'Party Ready', desc: 'We understand celebrations — every detail matters.' },
              ].map(v => (
                <div key={v.title} className="bg-card rounded-2xl border border-border p-6 text-center shadow-sm">
                  <span className="text-5xl block mb-4">{v.icon}</span>
                  <h3 className="font-black text-lg mb-2 text-secondary" style={{ fontFamily: 'Nunito' }}>{v.title}</h3>
                  <p className="text-muted-foreground text-sm">{v.desc}</p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="yellow-gradient rounded-3xl p-10 text-center">
              <h2 className="text-3xl font-black text-secondary mb-4" style={{ fontFamily: 'Nunito' }}>Ready to Order?</h2>
              <p className="text-secondary/70 mb-6">Experience authentic Filipino party food delivered to your door.</p>
              <Link to="/menu" className="btn-secondary inline-flex items-center gap-2 text-lg px-8 py-4">
                Order Now <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>
      </div>
      <Footer />
      <MobileNav />
    </div>
  );
}
