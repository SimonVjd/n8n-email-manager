'use client';

import { useState } from 'react';
import Link from 'next/link';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { Brain, Shield, Eye, Database } from 'lucide-react';

interface ConsentScreenProps {
  open: boolean;
  onConsent: () => void;
  onDecline: () => void;
}

const DATA_POINTS = [
  { icon: Eye, label: 'Čítanie emailov', desc: 'Prístup na čítanie prichádzajúcich emailov z Gmail' },
  { icon: Brain, label: 'AI analýza obsahu', desc: 'Kategorizácia, sumarizácia a návrhy odpovedí pomocou OpenAI' },
  { icon: Database, label: 'Uloženie v databáze', desc: 'Emaily sa uložia do zabezpečenej databázy pre správu' },
];

export default function ConsentScreen({ open, onConsent, onDecline }: ConsentScreenProps) {
  const [aiConsent, setAiConsent] = useState(false);
  const [dataConsent, setDataConsent] = useState(false);
  const [saving, setSaving] = useState(false);

  const canProceed = aiConsent && dataConsent;

  async function handleConsent() {
    setSaving(true);
    try {
      // Save both consents
      await Promise.all([
        fetch('/api/consents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ consent_type: 'ai_processing' }),
        }),
        fetch('/api/consents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ consent_type: 'gmail_data_access' }),
        }),
      ]);
      onConsent();
    } catch {
      // Silently fail — user can retry
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onDecline}
      title="Súhlas so spracovaním údajov"
      width="max-w-lg"
    >
      <div className="space-y-5">
        {/* Explanation */}
        <div className="bg-[var(--info-50)] border border-[var(--info-500)]/20 rounded-[var(--radius-lg)] p-4">
          <div className="flex items-start gap-2.5">
            <Shield size={16} className="text-[var(--info-600)] shrink-0 mt-0.5" />
            <div className="text-xs text-[var(--info-600)] space-y-1">
              <p className="font-medium">Pred synchronizáciou emailov potrebujeme váš súhlas.</p>
              <p>Vaše emaily budú spracované AI systémom (OpenAI) na kategorizáciu a sumarizáciu. Toto spracovanie je nepovinné — ak nesúhlasíte, emaily sa uložia bez AI analýzy.</p>
            </div>
          </div>
        </div>

        {/* What we access */}
        <div>
          <h3 className="text-xs font-semibold text-[var(--text-primary)] mb-3 uppercase tracking-wider">Čo spracovávame</h3>
          <div className="space-y-3">
            {DATA_POINTS.map(dp => (
              <div key={dp.label} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] flex items-center justify-center shrink-0">
                  <dp.icon size={14} className="text-[var(--text-secondary)]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{dp.label}</p>
                  <p className="text-xs text-[var(--text-tertiary)]">{dp.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Consent checkboxes */}
        <div className="space-y-3 pt-1">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={dataConsent}
              onChange={e => setDataConsent(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-[var(--border-primary)] accent-[var(--primary-600)]"
            />
            <span className="text-sm text-[var(--text-secondary)]">
              Súhlasím s prístupom do mojich Gmail emailov a ich uložením v aplikácii
            </span>
          </label>
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={aiConsent}
              onChange={e => setAiConsent(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-[var(--border-primary)] accent-[var(--primary-600)]"
            />
            <span className="text-sm text-[var(--text-secondary)]">
              Súhlasím so spracovaním emailov pomocou AI (OpenAI) na kategorizáciu, sumarizáciu a návrhy odpovedí
            </span>
          </label>
        </div>

        <p className="text-xs text-[var(--text-tertiary)]">
          Tento súhlas môžete kedykoľvek odvolať v{' '}
          <Link href="/dashboard/settings" className="text-[var(--primary-600)] hover:underline">Nastaveniach</Link>.
          Viac informácií v{' '}
          <Link href="/privacy-policy" target="_blank" className="text-[var(--primary-600)] hover:underline">Zásadách ochrany osobných údajov</Link>.
        </p>

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-1">
          <Button variant="secondary" size="sm" onClick={onDecline}>
            Pokračovať bez AI
          </Button>
          <Button
            size="sm"
            disabled={!canProceed}
            loading={saving}
            onClick={handleConsent}
          >
            Súhlasím a pokračovať
          </Button>
        </div>
      </div>
    </Modal>
  );
}
