import { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';
import { Phone, Mail, MapPin, Clock, Send, Facebook, Instagram } from 'lucide-react';
import { toast } from 'sonner';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', mobile: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);

  const setField = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    await new Promise(r => setTimeout(r, 1000));
    setSending(false);
    toast.success("Message sent! We'll get back to you within 24 hours. 😊");
    setForm({ name: '', email: '', mobile: '', subject: '', message: '' });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1">
        <div className="hero-gradient py-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 woven-bg opacity-20" />
          <div className="relative container mx-auto px-4">
            <h1 className="text-4xl font-black text-white mb-2" style={{ fontFamily: 'Nunito' }}>Contact Us</h1>
            <p className="text-white/70">We'd love to hear from you!</p>
          </div>
        </div>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact info */}
              <div>
                <h2 className="section-title mb-6">Get in Touch</h2>
                <div className="space-y-5">
                  {[
                    { icon: Phone, label: 'Phone / Viber', value: '0917-123-4567', href: 'tel:+639171234567' },
                    { icon: Mail, label: 'Email', value: 'kimae@partybilao.ph', href: 'mailto:kimae@partybilao.ph' },
                    { icon: MapPin, label: 'Address', value: 'Caloocan City, Metro Manila, Philippines' },
                    { icon: Clock, label: 'Business Hours', value: 'Mon–Thu: 8AM–8PM\nFri–Sat: 7AM–9PM\nSunday: 7AM–8PM' },
                  ].map(({ icon: Icon, label, value, href }) => (
                    <div key={label} className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon size={20} className="text-primary" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-muted-foreground">{label}</p>
                        {href ? (
                          <a href={href} className="font-semibold text-foreground hover:text-primary transition-colors">{value}</a>
                        ) : (
                          <p className="font-semibold text-foreground whitespace-pre-line">{value}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8">
                  <p className="font-bold mb-3">Follow Us</p>
                  <div className="flex gap-3">
                    <a href="https://www.facebook.com/kimaespartybilao/" target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors">
                      <Facebook size={16} /> Facebook
                    </a>
                    <a href="#" className="flex items-center gap-2 bg-pink-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-pink-600 transition-colors">
                      <Instagram size={16} /> Instagram
                    </a>
                  </div>
                </div>
              </div>

              {/* Contact form */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                <h2 className="font-black text-xl mb-6" style={{ fontFamily: 'Nunito' }}>Send a Message</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Name *</label>
                      <input value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Your name" className="input-field" required />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Mobile</label>
                      <input value={form.mobile} onChange={e => setField('mobile', e.target.value)} placeholder="09XX-XXX-XXXX" className="input-field" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Email *</label>
                    <input value={form.email} onChange={e => setField('email', e.target.value)} type="email" placeholder="you@email.com" className="input-field" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Subject</label>
                    <select value={form.subject} onChange={e => setField('subject', e.target.value)} className="input-field">
                      <option value="">Select subject...</option>
                      <option value="order">Order Inquiry</option>
                      <option value="custom">Custom Order / Bulk</option>
                      <option value="feedback">Feedback</option>
                      <option value="complaint">Complaint</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Message *</label>
                    <textarea value={form.message} onChange={e => setField('message', e.target.value)} placeholder="Type your message..." rows={5} className="input-field resize-none" required />
                  </div>
                  <button type="submit" disabled={sending} className="btn-primary w-full flex items-center justify-center gap-2">
                    <Send size={16} /> {sending ? 'Sending...' : 'Send Message'}
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
