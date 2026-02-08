'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

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

  useEffect(() => {
    fetchGmailStatus();

    // Check URL params for OAuth result
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
      const res = await fetch('/api/auth/gmail/status');
      const data = await res.json();
      if (data.success) setGmail(data.data);
    } catch {
      console.error('Failed to fetch Gmail status');
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect() {
    setConnecting(true);
    try {
      const res = await fetch('/api/auth/gmail');
      const data = await res.json();
      if (data.success && data.url) {
        window.location.href = data.url;
      }
    } catch {
      setMessage({ type: 'error', text: 'Chyba pri pripájaní Gmail' });
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      const res = await fetch('/api/auth/gmail/disconnect', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setGmail({ connected: false, email: null });
        setMessage({ type: 'success', text: 'Gmail bol odpojený.' });
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch {
      setMessage({ type: 'error', text: 'Chyba pri odpájaní Gmail' });
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-semibold mb-6">Nastavenia</h1>

      {/* Message banner */}
      {message && (
        <div
          className={`mb-6 px-4 py-3 rounded-xl text-sm ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
          <button
            onClick={() => setMessage(null)}
            className="float-right font-medium hover:opacity-70"
          >
            &times;
          </button>
        </div>
      )}

      {/* Gmail Integration Card */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
        <div className="flex items-start gap-4">
          {/* Gmail icon */}
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
              <path d="M22 6C22 4.9 21.1 4 20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6ZM20 6L12 11L4 6H20ZM20 18H4V8L12 13L20 8V18Z" fill="#EA4335"/>
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="font-semibold mb-1">Gmail</h2>
            <p className="text-sm text-[var(--muted)] mb-4">
              Pripojte Gmail účet na automatické sťahovanie a AI analýzu emailov.
            </p>

            {loading ? (
              <div className="text-sm text-[var(--muted)]">Načítavanie...</div>
            ) : gmail?.connected ? (
              <div>
                {/* Connected state */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-sm font-medium text-emerald-700">Pripojené</span>
                  {gmail.email && (
                    <span className="text-sm text-[var(--muted)]">— {gmail.email}</span>
                  )}
                </div>
                <button
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="px-4 py-2 text-sm border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {disconnecting ? 'Odpájanie...' : 'Odpojiť Gmail'}
                </button>
              </div>
            ) : (
              <div>
                {/* Disconnected state */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-stone-300"></div>
                  <span className="text-sm text-[var(--muted)]">Nepripojené</span>
                </div>
                <button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="px-4 py-2 text-sm bg-[var(--accent)] text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {connecting ? 'Presmerovanie...' : 'Pripojiť Gmail'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-4 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl">
        <p className="text-xs text-blue-700">
          <strong>Povolenia:</strong> Aplikácia má prístup iba na čítanie vašich emailov (gmail.readonly).
          Nemôže odosielať ani mazať emaily.
        </p>
      </div>
    </div>
  );
}
