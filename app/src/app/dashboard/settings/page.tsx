'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';
import { useTheme, type Theme } from '@/hooks/useTheme';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import {
  Mail,
  Sun,
  Moon,
  Monitor,
  Link2,
  Unlink,
  X,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface GmailStatus {
  connected: boolean;
  email: string | null;
}

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const [gmail, setGmail] = useState<GmailStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    fetchGmailStatus();

    const gmailParam = searchParams.get('gmail');
    if (gmailParam === 'connected') {
      setMessage({ type: 'success', text: 'Gmail bol úspešne pripojený!' });
    } else if (gmailParam === 'error') {
      const reason = searchParams.get('reason') || 'unknown';
      const messages: Record<string, string> = {
        no_refresh_token: 'Google neposkytol refresh token. Skúste znova.',
        token_exchange: 'Chyba pri výmene tokenu. Skúste znova.',
        missing_params: 'Chýbajúce parametre z Google.',
        access_denied: 'Prístup bol zamietnutý.',
      };
      setMessage({ type: 'error', text: messages[reason] || 'Chyba pri pripájaní Gmail.' });
    }
  }, [searchParams]);

  async function fetchGmailStatus() {
    try {
      const res = await fetchWithTimeout('/api/auth/gmail/status', { timeout: 10000 });
      const data = await res.json();
      if (data.success) setGmail(data.data);
    } catch {
      setMessage({ type: 'error', text: 'Nepodarilo sa načítať stav Gmail' });
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect() {
    setConnecting(true);
    try {
      const res = await fetchWithTimeout('/api/auth/gmail', { timeout: 10000 });
      const data = await res.json();
      if (data.success && data.url) {
        window.location.href = data.url;
      }
    } catch {
      setMessage({ type: 'error', text: 'Chyba pri pripájaní Gmail. Server neodpovedá.' });
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      const res = await fetchWithTimeout('/api/auth/gmail/disconnect', { method: 'POST', timeout: 10000 });
      const data = await res.json();
      if (data.success) {
        setGmail({ connected: false, email: null });
        setMessage({ type: 'success', text: 'Gmail bol odpojený.' });
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch {
      setMessage({ type: 'error', text: 'Chyba pri odpájaní Gmail. Server neodpovedá.' });
    } finally {
      setDisconnecting(false);
    }
  }

  const themeOptions: { value: Theme; label: string; icon: typeof Sun; desc: string }[] = [
    { value: 'light', label: 'Svetlý', icon: Sun, desc: 'Vždy svetlý režim' },
    { value: 'dark', label: 'Tmavý', icon: Moon, desc: 'Vždy tmavý režim' },
    { value: 'system', label: 'Systém', icon: Monitor, desc: 'Podľa nastavení OS' },
  ];

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-1">Nastavenia</h1>
      <p className="text-sm text-[var(--text-tertiary)] mb-6">Správa účtu a preferencií</p>

      {/* Message banner */}
      {message && (
        <div
          className={`mb-6 px-4 py-3 rounded-[var(--radius-lg)] text-sm flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-[var(--success-50)] text-[var(--success-700)] border border-[var(--success-500)]/20'
              : 'bg-[var(--danger-50)] text-[var(--danger-600)] border border-[var(--danger-500)]/20'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            {message.text}
          </div>
          <button
            onClick={() => setMessage(null)}
            className="hover:opacity-70 transition-opacity"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Theme Settings */}
      <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[var(--radius-xl)] p-6 mb-4 fade-in-up" style={{ animationFillMode: 'both' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-[var(--radius-lg)] bg-[var(--primary-50)] flex items-center justify-center">
            {theme === 'dark' ? (
              <Moon size={18} className="text-[var(--primary-600)]" />
            ) : theme === 'light' ? (
              <Sun size={18} className="text-[var(--primary-600)]" />
            ) : (
              <Monitor size={18} className="text-[var(--primary-600)]" />
            )}
          </div>
          <div>
            <h2 className="font-semibold text-[var(--text-primary)]">Vzhľad</h2>
            <p className="text-xs text-[var(--text-tertiary)]">Vyberte farebnú schému rozhrania</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {themeOptions.map(opt => {
            const Icon = opt.icon;
            const active = theme === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-[var(--radius-lg)] border-2 transition-all ${
                  active
                    ? 'border-[var(--primary-500)] bg-[var(--primary-50)]'
                    : 'border-[var(--border-primary)] hover:border-[var(--border-secondary)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                <Icon size={20} className={active ? 'text-[var(--primary-600)]' : 'text-[var(--text-tertiary)]'} />
                <span className={`text-sm font-medium ${active ? 'text-[var(--primary-700)]' : 'text-[var(--text-primary)]'}`}>
                  {opt.label}
                </span>
                <span className="text-[10px] text-[var(--text-tertiary)]">{opt.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Gmail Integration Card */}
      <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[var(--radius-xl)] p-6 fade-in-up" style={{ animationDelay: '75ms', animationFillMode: 'both' }}>
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-[var(--radius-lg)] bg-[var(--danger-50)] flex items-center justify-center shrink-0">
            <Mail size={18} className="text-[var(--danger-600)]" />
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-[var(--text-primary)] mb-1">Gmail</h2>
            <p className="text-sm text-[var(--text-tertiary)] mb-4">
              Pripojte Gmail účet na automatické sťahovanie a AI analýzu emailov.
            </p>

            {loading ? (
              <div className="space-y-2">
                <Skeleton width={120} height={14} />
                <Skeleton width={200} height={36} rounded="lg" />
              </div>
            ) : gmail?.connected ? (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-[var(--success-500)]" />
                  <span className="text-sm font-medium text-[var(--success-600)]">Pripojené</span>
                  {gmail.email && (
                    <span className="text-sm text-[var(--text-tertiary)]">— {gmail.email}</span>
                  )}
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  icon={<Unlink size={14} />}
                  onClick={handleDisconnect}
                  loading={disconnecting}
                >
                  {disconnecting ? 'Odpájanie...' : 'Odpojiť Gmail'}
                </Button>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-[var(--text-tertiary)]" />
                  <span className="text-sm text-[var(--text-tertiary)]">Nepripojené</span>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Link2 size={14} />}
                  onClick={handleConnect}
                  loading={connecting}
                >
                  {connecting ? 'Presmerovanie...' : 'Pripojiť Gmail'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-4 px-4 py-3 bg-[var(--info-50)] border border-[var(--info-500)]/20 rounded-[var(--radius-lg)] flex items-start gap-2 fade-in-up" style={{ animationDelay: '150ms', animationFillMode: 'both' }}>
        <Info size={14} className="text-[var(--info-600)] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-xs text-[var(--info-600)]">
            <strong>Povolenia:</strong> Aplikácia má prístup na čítanie a odosielanie emailov
            (gmail.readonly + gmail.send). Nemôže mazať emaily.
          </p>
          {gmail?.connected && (
            <p className="text-xs text-[var(--info-600)]">
              Ak ste Gmail pripájali pred aktiváciou odosielania, odpojte a znova pripojte účet
              pre udelenie nových povolení.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
