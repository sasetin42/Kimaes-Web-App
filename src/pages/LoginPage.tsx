import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck, User, Award, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import logoBadge from '@/assets/logo-badge.png';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', mobile: '', password: '' });
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const setField = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isRegister) {
      const ok = await register(form.name, form.email, form.mobile, form.password);
      if (ok) navigate('/account');
    } else {
      const ok = await login(form.email, form.password);
      if (ok) {
        // Redirection based on credentials or admin target
        const emailLower = form.email.toLowerCase();
        if (
          emailLower === 'admin@gmail.com' ||
          emailLower.includes('admin') ||
          emailLower.includes('manager')
        ) {
          navigate('/admin');
        } else if (emailLower.includes('kitchen')) {
          navigate('/kitchen');
        } else if (emailLower.includes('rider')) {
          navigate('/rider');
        } else {
          navigate('/account');
        }
      }
    }
    setLoading(false);
  };

  const autofillSuperAdmin = () => {
    setForm({
      name: 'System Administrator',
      email: 'admin@gmail.com',
      mobile: '0917-000-0000',
      password: '123456#',
    });
    setIsRegister(false);
  };

  const handleQuickAdminLogin = async () => {
    setLoading(true);
    setIsRegister(false);
    setForm({
      name: 'System Administrator',
      email: 'admin@gmail.com',
      mobile: '0917-000-0000',
      password: '123456#',
    });
    const ok = await login('admin@gmail.com', '123456#');
    if (ok) {
      navigate('/admin');
    }
    setLoading(false);
  };

  const autofillCustomer = () => {
    setForm({
      name: 'Maria Santos',
      email: 'customer@gmail.com',
      mobile: '0917-123-4567',
      password: '123456#',
    });
    setIsRegister(false);
  };

  const handleQuickCustomerLogin = async () => {
    setLoading(true);
    setIsRegister(false);
    setForm({
      name: 'Maria Santos',
      email: 'customer@gmail.com',
      mobile: '0917-123-4567',
      password: '123456#',
    });
    const ok = await login('customer@gmail.com', '123456#');
    if (ok) {
      navigate('/account');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-muted/60 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/">
            <img
              src={logoBadge}
              alt="Kimae's Party Bilao"
              className="h-20 w-20 rounded-full mx-auto mb-3 shadow-brand object-cover"
            />
            <h1 className="text-2xl font-black text-secondary" style={{ fontFamily: 'Nunito' }}>
              Kimae's Party Bilao
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Dasmariñas, Cavite • Your Partner for Every Occasion
            </p>
          </Link>
        </div>

        <div className="bg-card rounded-3xl border border-border shadow-warm p-6 sm:p-8">
          {/* Tabs */}
          <div className="flex bg-muted rounded-xl p-1 mb-6">
            <button
              type="button"
              onClick={() => setIsRegister(false)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                !isRegister ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setIsRegister(true)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                isRegister ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-bold mb-1.5 text-foreground">Full Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  placeholder="Juan dela Cruz"
                  className="input-field text-xs py-2.5"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold mb-1.5 text-foreground">Email Address</label>
              <input
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                type="email"
                placeholder="you@email.com"
                className="input-field text-xs py-2.5"
                required
              />
            </div>

            {isRegister && (
              <div>
                <label className="block text-xs font-bold mb-1.5 text-foreground">Mobile Number</label>
                <input
                  value={form.mobile}
                  onChange={(e) => setField('mobile', e.target.value)}
                  type="tel"
                  placeholder="09XX-XXX-XXXX"
                  className="input-field text-xs py-2.5"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold mb-1.5 text-foreground">Password</label>
              <div className="relative">
                <input
                  value={form.password}
                  onChange={(e) => setField('password', e.target.value)}
                  type={showPass ? 'text' : 'password'}
                  placeholder={isRegister ? 'Min. 6 characters' : 'Your password'}
                  className="input-field pr-12 text-xs py-2.5"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 text-sm font-black mt-2 shadow-sm"
            >
              {loading ? '⏳ Authenticating...' : isRegister ? '🎉 Create Account' : '🚀 Secure Login'}
            </button>
          </form>

          {/* Enhanced Demo Accounts Section */}
          <div className="mt-6 space-y-3">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-center">
              Quick Demo Accounts
            </p>

            {/* 1. Super Administrator Demo Card */}
            <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent rounded-2xl border border-amber-500/30 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-amber-600" />
                  <span className="text-xs font-black text-amber-900 dark:text-amber-200">
                    Super Administrator
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={autofillSuperAdmin}
                    className="text-[11px] font-bold text-primary hover:underline"
                  >
                    Auto-fill
                  </button>
                  <span className="text-muted-foreground text-[10px]">•</span>
                  <button
                    type="button"
                    onClick={handleQuickAdminLogin}
                    disabled={loading}
                    className="text-[11px] font-black text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-0.5"
                  >
                    Instant Login →
                  </button>
                </div>
              </div>
              <div className="text-[11px] text-muted-foreground font-mono bg-card/80 p-2 rounded-xl border border-border/60 flex items-center justify-between">
                <div>
                  <span className="text-foreground font-semibold">admin@gmail.com</span>
                  <span className="mx-1.5 opacity-40">|</span>
                  <span className="text-foreground">123456#</span>
                </div>
                <span className="text-[10px] font-sans font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300">
                  Full Control
                </span>
              </div>
            </div>

            {/* 2. Customer Account Demo Card */}
            <div className="p-3.5 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent rounded-2xl border border-emerald-500/30 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <User size={16} className="text-emerald-600" />
                  <span className="text-xs font-black text-emerald-900 dark:text-emerald-200">
                    Customer Account
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={autofillCustomer}
                    className="text-[11px] font-bold text-primary hover:underline"
                  >
                    Auto-fill
                  </button>
                  <span className="text-muted-foreground text-[10px]">•</span>
                  <button
                    type="button"
                    onClick={handleQuickCustomerLogin}
                    disabled={loading}
                    className="text-[11px] font-black text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-0.5"
                  >
                    Instant Login →
                  </button>
                </div>
              </div>
              <div className="text-[11px] text-muted-foreground font-mono bg-card/80 p-2 rounded-xl border border-border/60 flex items-center justify-between">
                <div>
                  <span className="text-foreground font-semibold">customer@gmail.com</span>
                  <span className="mx-1.5 opacity-40">|</span>
                  <span className="text-foreground">123456#</span>
                </div>
                <span className="text-[10px] font-sans font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 flex items-center gap-0.5">
                  <Award size={10} /> Suki Loyalty
                </span>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-5">
            <Link to="/" className="text-primary hover:underline font-bold">
              ← Back to Kimae's Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
