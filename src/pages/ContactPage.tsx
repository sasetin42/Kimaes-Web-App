import { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  Facebook,
  Instagram,
  User,
  Building2,
  Briefcase,
  Store,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    mobile: '',
    subject: '',
    message: '',
  });
  const [sending, setSending] = useState(false);

  const setField = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    await new Promise((r) => setTimeout(r, 800));
    setSending(false);
    toast.success("Thank you! Your message has been sent to Kimae's team. We'll get back to you shortly. 😊");
    setForm({ name: '', email: '', mobile: '', subject: '', message: '' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1">
        <div className="hero-gradient py-14 text-center relative overflow-hidden">
          <div className="absolute inset-0 woven-bg opacity-20" />
          <div className="relative container mx-auto px-4 max-w-3xl">
            <span className="text-primary font-bold text-xs uppercase tracking-wider block mb-2">
              Dasmariñas, Cavite • Since 2020
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-2" style={{ fontFamily: 'Nunito' }}>
              Contact Kimae's Party Bilao
            </h1>
            <p className="text-white/80 text-sm md:text-base">
              Orders, corporate events, bulk deliveries, branch opportunities & franchise partnerships.
            </p>
          </div>
        </div>

        <section className="py-16">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact info */}
              <div className="space-y-8">
                <div>
                  <h2 className="section-title mb-2">Get in Touch</h2>
                  <p className="text-sm text-muted-foreground">
                    Connect directly with our team in Dasmariñas, Cavite. We are here to make your gatherings effortless and memorable.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-card border border-border flex items-start gap-4 shadow-sm">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                      <MapPin size={22} />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-muted-foreground uppercase tracking-wide">
                        Physical Store / Business Location
                      </p>
                      <p className="font-bold text-foreground text-sm mt-0.5">
                        BLK 31 LOT 14 PUROK 3, Victoria Reyes, Dasmariñas, Cavite
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Coordinated pickup and delivery across operating locations
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-card border border-border flex items-start gap-4 shadow-sm">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                      <Phone size={22} />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-xs text-muted-foreground uppercase tracking-wide">
                        Direct Lines & Mobile
                      </p>
                      <div>
                        <a
                          href="tel:09915984112"
                          className="font-bold text-sm text-foreground hover:text-primary transition-colors block"
                        >
                          0991 598 4112 — Marvin Kim & Hannah Mae Morales (CEO/VP)
                        </a>
                        <a
                          href="tel:09617722601"
                          className="font-bold text-sm text-foreground hover:text-primary transition-colors block mt-0.5"
                        >
                          0961 772 2601 — Vic De Guzman (Business Consultant)
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-card border border-border flex items-start gap-4 shadow-sm">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                      <Mail size={22} />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-xs text-muted-foreground uppercase tracking-wide">
                        Official Email Addresses
                      </p>
                      <a
                        href="mailto:kimaespartybilao@gmail.com"
                        className="font-semibold text-sm text-foreground hover:text-primary transition-colors block"
                      >
                        kimaespartybilao@gmail.com (Main / Inquiries)
                      </a>
                      <a
                        href="mailto:deverahannamae@gmail.com"
                        className="font-semibold text-sm text-foreground hover:text-primary transition-colors block"
                      >
                        deverahannamae@gmail.com (Hannah Mae Morales)
                      </a>
                      <a
                        href="mailto:deguzmanvic@yahoo.com"
                        className="font-semibold text-sm text-foreground hover:text-primary transition-colors block"
                      >
                        deguzmanvic@yahoo.com (Vic De Guzman - Consultant)
                      </a>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-card border border-border flex items-start gap-4 shadow-sm">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                      <Clock size={22} />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-muted-foreground uppercase tracking-wide">
                        Store & Delivery Hours
                      </p>
                      <p className="font-bold text-foreground text-sm mt-0.5">
                        Monday – Sunday: 7:00 AM – 9:00 PM
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Advance orders recommended for party bilaos and peak weekend celebrations.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="font-bold text-xs text-muted-foreground uppercase tracking-wider mb-3">
                    Connect On Social Media
                  </p>
                  <div className="flex gap-3">
                    <a
                      href="https://www.facebook.com/kimaespartybilao/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-[#1877F2] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity shadow-sm"
                    >
                      <Facebook size={16} /> Facebook Page
                    </a>
                    <a
                      href="#"
                      className="flex items-center gap-2 bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCB045] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity shadow-sm"
                    >
                      <Instagram size={16} /> Instagram
                    </a>
                  </div>
                </div>
              </div>

              {/* Contact form */}
              <div className="bg-card rounded-3xl border border-border p-6 md:p-8 shadow-md">
                <div className="mb-6">
                  <h3 className="font-black text-2xl text-secondary" style={{ fontFamily: 'Nunito' }}>
                    Send Us an Inquiry
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Fill out the form below and our representative will respond within 24 hours.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-foreground mb-1.5">
                        Your Full Name *
                      </label>
                      <input
                        value={form.name}
                        onChange={(e) => setField('name', e.target.value)}
                        placeholder="Juan Dela Cruz"
                        className="input-field text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-foreground mb-1.5">
                        Mobile Number *
                      </label>
                      <input
                        value={form.mobile}
                        onChange={(e) => setField('mobile', e.target.value)}
                        placeholder="0991-598-4112"
                        className="input-field text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Email Address *
                    </label>
                    <input
                      value={form.email}
                      onChange={(e) => setField('email', e.target.value)}
                      type="email"
                      placeholder="you@email.com"
                      className="input-field text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Inquiry Type *
                    </label>
                    <select
                      value={form.subject}
                      onChange={(e) => setField('subject', e.target.value)}
                      className="input-field text-sm"
                      required
                    >
                      <option value="">Select an inquiry category...</option>
                      <option value="party_bilao">Party Bilao / Tray Order Inquiry</option>
                      <option value="event_package">Birthday / Reunion / Celebration Package</option>
                      <option value="corporate">Corporate Lunch / Office Catering</option>
                      <option value="franchise">Branch Opportunities & Franchise Development</option>
                      <option value="investor">Investor Partnership Inquiries</option>
                      <option value="feedback">Customer Feedback / Suggestion</option>
                      <option value="other">Other Inquiry</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Your Message or Event Details *
                    </label>
                    <textarea
                      value={form.message}
                      onChange={(e) => setField('message', e.target.value)}
                      placeholder="Please let us know your event date, expected number of persons, preferred dishes, or business inquiry details..."
                      rows={5}
                      className="input-field text-sm resize-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sending}
                    className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm shadow-md"
                  >
                    <Send size={16} /> {sending ? 'Sending message...' : 'Submit Inquiry'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
      <MobileNav />
    </div>
  );
}
