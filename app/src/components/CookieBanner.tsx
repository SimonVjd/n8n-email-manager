'use client';

import { useState, useEffect } from 'react';
import { hasCookieConsent, setCookieConsent, getCookieConsent } from '@/lib/cookies';
import { useCookieBanner } from '@/contexts/CookieContext';
import Link from 'next/link';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const { bannerOpen, closeBanner } = useCookieBanner();

  // Show on first visit (no cookie) OR when explicitly reopened
  useEffect(() => {
    if (!hasCookieConsent()) {
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    if (bannerOpen) {
      // Load existing prefs when reopening
      const existing = getCookieConsent();
      if (existing) {
        setAnalytics(existing.analytics);
        setMarketing(existing.marketing);
      }
      setVisible(true);
      setShowSettings(true);
    }
  }, [bannerOpen]);

  function handleAcceptAll() {
    setCookieConsent({ analytics: true, marketing: true });
    setVisible(false);
    setShowSettings(false);
    closeBanner();
  }

  function handleRejectNonEssential() {
    setCookieConsent({ analytics: false, marketing: false });
    setVisible(false);
    setShowSettings(false);
    closeBanner();
  }

  function handleSaveSettings() {
    setCookieConsent({ analytics, marketing });
    setVisible(false);
    setShowSettings(false);
    closeBanner();
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[60] p-4 animate-[slideUp_0.3s_ease-out]">
      <div className="max-w-2xl mx-auto bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] p-5">
        {!showSettings ? (
          /* Initial banner */
          <div>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Táto stránka používa cookies na zabezpečenie funkčnosti a zlepšenie vášho zážitku.
              Podrobnosti nájdete v našej{' '}
              <Link href="/cookies" className="text-[var(--primary-600)] hover:underline">Cookie Policy</Link>.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleAcceptAll}
                className="flex-1 px-4 py-2.5 text-sm font-medium rounded-[var(--radius-md)] bg-[var(--primary-600)] text-white hover:bg-[var(--primary-700)] transition-colors"
              >
                Prijať všetky
              </button>
              <button
                onClick={handleRejectNonEssential}
                className="flex-1 px-4 py-2.5 text-sm font-medium rounded-[var(--radius-md)] bg-[var(--primary-600)] text-white hover:bg-[var(--primary-700)] transition-colors"
              >
                Odmietnuť nepotrebné
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="px-4 py-2.5 text-sm font-medium rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors border border-[var(--border-primary)]"
              >
                Nastavenia
              </button>
            </div>
          </div>
        ) : (
          /* Settings panel */
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Nastavenia cookies</h3>
            <div className="space-y-4 mb-5">
              {/* Necessary — always on */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Nevyhnutné cookies</p>
                  <p className="text-xs text-[var(--text-tertiary)]">Potrebné na fungovanie stránky. Vždy aktívne.</p>
                </div>
                <div className="relative w-10 h-[22px] rounded-full bg-[var(--primary-500)] opacity-60 cursor-not-allowed">
                  <div className="absolute top-[3px] left-[20px] w-4 h-4 rounded-full bg-[#ffffff] shadow-sm" />
                </div>
              </div>

              {/* Analytics */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Analytické cookies</p>
                  <p className="text-xs text-[var(--text-tertiary)]">Pomáhajú nám pochopiť, ako stránku používate.</p>
                </div>
                <button
                  onClick={() => setAnalytics(v => !v)}
                  className="relative w-10 h-[22px] rounded-full transition-colors"
                  style={{ backgroundColor: analytics ? 'var(--primary-500)' : 'var(--bg-tertiary)' }}
                  role="switch"
                  aria-checked={analytics}
                  aria-label="Analytické cookies"
                >
                  <div
                    className="absolute top-[3px] w-4 h-4 rounded-full bg-[#ffffff] shadow-sm transition-transform"
                    style={{ left: analytics ? '20px' : '3px' }}
                  />
                </button>
              </div>

              {/* Marketing */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Marketingové cookies</p>
                  <p className="text-xs text-[var(--text-tertiary)]">Používajú sa na zobrazovanie relevantnej reklamy.</p>
                </div>
                <button
                  onClick={() => setMarketing(v => !v)}
                  className="relative w-10 h-[22px] rounded-full transition-colors"
                  style={{ backgroundColor: marketing ? 'var(--primary-500)' : 'var(--bg-tertiary)' }}
                  role="switch"
                  aria-checked={marketing}
                  aria-label="Marketingové cookies"
                >
                  <div
                    className="absolute top-[3px] w-4 h-4 rounded-full bg-[#ffffff] shadow-sm transition-transform"
                    style={{ left: marketing ? '20px' : '3px' }}
                  />
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleSaveSettings}
                className="flex-1 px-4 py-2.5 text-sm font-medium rounded-[var(--radius-md)] bg-[var(--primary-600)] text-white hover:bg-[var(--primary-700)] transition-colors"
              >
                Uložiť nastavenia
              </button>
              <button
                onClick={handleAcceptAll}
                className="flex-1 px-4 py-2.5 text-sm font-medium rounded-[var(--radius-md)] bg-[var(--primary-600)] text-white hover:bg-[var(--primary-700)] transition-colors"
              >
                Prijať všetky
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
