'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { Mail, Eye, EyeOff, User, Sparkles, Zap, MessageSquare, BarChart3, Shield } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const body = isRegister ? { name, email, password } : { email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error);
        return;
      }

      if (data.data.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError('Pripojenie zlyhalo');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-[var(--bg-secondary)]">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[560px] relative overflow-hidden flex-col justify-between p-12 bg-gradient-to-br from-[var(--primary-700)] via-[var(--primary-600)] to-indigo-500 gradient-bg">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16 fade-in-up">
            <div className="w-10 h-10 rounded-[var(--radius-lg)] bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <Mail size={20} className="text-white" />
            </div>
            <span className="text-lg font-semibold text-white tracking-tight">Email Manager</span>
          </div>

          <h2 className="text-3xl xl:text-4xl font-bold text-white leading-tight mb-4 fade-in-up stagger-1" style={{ animationFillMode: 'both' }}>
            Inteligentná správa<br />emailov s AI
          </h2>
          <p className="text-indigo-200 text-sm leading-relaxed max-w-sm fade-in-up stagger-2" style={{ animationFillMode: 'both' }}>
            Automatická kategorizácia, sumarizácia, návrhy odpovedí
            a sledovanie metrík. Všetko na jednom mieste.
          </p>
        </div>

        <div className="relative z-10 space-y-3">
          <Feature icon={<Sparkles size={16} />} text="AI kategorizácia a sumarizácia" delay={3} />
          <Feature icon={<MessageSquare size={16} />} text="Automatické návrhy odpovedí z FAQ" delay={4} />
          <Feature icon={<Mail size={16} />} text="Gmail integrácia bez migrácie" delay={5} />
          <Feature icon={<BarChart3 size={16} />} text="Štatistiky a sledovanie odozvy" delay={6} />
        </div>

        {/* Decorative */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/[0.04] rounded-full -translate-y-1/2 translate-x-1/2 blur-xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/[0.04] rounded-full translate-y-1/3 -translate-x-1/3 blur-xl" />
        <div className="absolute top-1/2 right-10 w-32 h-32 bg-white/[0.03] rounded-full inbox-zero-float" />
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile branding */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-[var(--radius-lg)] bg-[var(--primary-600)] mb-3">
              <Mail size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">Email Manager</h1>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">Inteligentná správa emailov s AI</p>
          </div>

          {/* Form card */}
          <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[var(--radius-xl)] p-8 shadow-[var(--shadow-md)] fade-in-up">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1 tracking-tight">
              {isRegister ? 'Vytvoriť účet' : 'Vitajte späť'}
            </h2>
            <p className="text-sm text-[var(--text-tertiary)] mb-6">
              {isRegister
                ? 'Vyplňte údaje pre vytvorenie nového účtu'
                : 'Prihláste sa do svojho účtu'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                    Meno
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 border border-[var(--border-primary)] rounded-[var(--radius-md)] text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-shadow"
                      placeholder="Vaše meno"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border border-[var(--border-primary)] rounded-[var(--radius-md)] text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-shadow"
                    placeholder="vas@email.sk"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                  Heslo
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[var(--border-primary)] rounded-[var(--radius-md)] text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-shadow pr-10"
                    placeholder="Vaše heslo"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                    aria-label={showPassword ? 'Skryť heslo' : 'Zobraziť heslo'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-sm text-[var(--danger-600)] bg-[var(--danger-50)] px-3.5 py-2.5 rounded-[var(--radius-md)] border border-[var(--danger-500)]/20 flex items-center gap-2">
                  <Shield size={14} className="shrink-0" />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                loading={loading}
                className="w-full"
                size="lg"
              >
                {loading
                  ? (isRegister ? 'Registrujem...' : 'Prihlasujem...')
                  : (isRegister ? 'Registrovať sa' : 'Prihlásiť sa')}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError('');
                }}
                className="text-sm text-[var(--primary-600)] hover:text-[var(--primary-700)] transition-colors"
              >
                {isRegister
                  ? 'Už máte účet? Prihláste sa'
                  : 'Nemáte účet? Zaregistrujte sa'}
              </button>
            </div>
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-4 mt-6 fade-in stagger-3" style={{ animationFillMode: 'both' }}>
            <TrustBadge icon={<Zap size={12} />} text="AI analýza" />
            <TrustBadge icon={<Shield size={12} />} text="Bezpečné" />
            <TrustBadge icon={<Mail size={12} />} text="Gmail sync" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, text, delay }: { icon: React.ReactNode; text: string; delay: number }) {
  return (
    <div
      className={`flex items-center gap-3 fade-in-up stagger-${delay}`}
      style={{ animationFillMode: 'both' }}
    >
      <div className="w-8 h-8 rounded-[var(--radius-md)] bg-white/10 backdrop-blur-sm border border-white/15 flex items-center justify-center shrink-0 text-indigo-200">
        {icon}
      </div>
      <span className="text-sm text-indigo-100">{text}</span>
    </div>
  );
}

function TrustBadge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[var(--text-tertiary)]">
      {icon}
      <span className="text-[10px] font-medium">{text}</span>
    </div>
  );
}
