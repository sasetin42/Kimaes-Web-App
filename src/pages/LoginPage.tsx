import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import logoBadge from '@/assets/logo-badge.png';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', mobile: '', password: '' });
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const setField = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

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
        if (form.email.toLowerCase() === 'admin@gmail.com' || form.email.includes('admin') || form.email.includes('manager')) {
          navigate('/admin');
        } else if (form.email.includes('kitchen')) {
          navigate('/kitchen');
        } else if (form.email.includes('rider')) {
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

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/">
            <img src={logoBadge} alt="Kimae's Party Bilao" className="h-20 w-20 rounded-full mx-auto mb-3 shadow-brand" />
            <h1 className="text-2xl font-black text-secondary" style={{ fontFamily: 'Nunito' }}>Kimae's Party Bilao</h1>
            <p className="text-sm text-muted-foreground">Authentic Filipino Party Food & Realtime Cloud</p>
          </Link>
        </div>

        <div className="bg-card rounded-3xl border border-border shadow-warm p-8">
          {/* Tabs */}
          <div className="flex bg-muted rounded-xl p-1 mb-6">
            <button onClick={() => setIsRegister(false)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${!isRegister ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground'}`}>
              Login
            </button>
            <button onClick={() => setIsRegister(true)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${isRegister ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground'}`}>
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-sm font-semibold mb-2">Full Name</label>
                <input value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Juan dela Cruz" className="input-field" required />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold mb-2">Email Address</label>
              <input value={form.email} onChange={e => setField('email', e.target.value)} type="email" placeholder="you@email.com" className="input-field" required />
            </div>

            {isRegister && (
              <div>
                <label className="block text-sm font-semibold mb-2">Mobile Number</label>
                <input value={form.mobile} onChange={e => setField('mobile', e.target.value)} type="tel" placeholder="09XX-XXX-XXXX" className="input-field" required />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold mb-2">Password</label>
              <div className="relative">
                <input value={form.password} onChange={e => setField('password', e.target.value)}
                  type={showPass ? 'text' : 'password'} placeholder={isRegister ? 'Min. 6 characters' : 'Your password'} className="input-field pr-12" required />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full py-4 text-base mt-2">
              {loading ? '⏳ Connecting to Firebase...' : isRegister ? '🎉 Create Account' : '🚀 Secure Login'}
            </button>
          </form>

          {/* Super Admin Quick Access Panel */}
          <div className="mt-6 p-4 bg-muted/70 rounded-2xl border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-primary" /> Firebase Super Administrator
              </span>
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
                  className="text-[11px] font-bold text-amber-600 hover:text-amber-700 hover:underline"
                >
                  Instant Login →
                </button>
              </div>
            </div>
            <div className="space-y-1 text-xs text-muted-foreground font-mono bg-background p-2.5 rounded-lg border border-border/60">
              <p>Email: <span className="text-foreground select-all">admin@gmail.com</span></p>
              <p>Password: <span className="text-foreground select-all">123456#</span></p>
              <p>Role: <span className="text-amber-600 font-sans font-bold">super_admin</span></p>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-4">
            <Link to="/" className="text-primary hover:underline">← Back to Home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
