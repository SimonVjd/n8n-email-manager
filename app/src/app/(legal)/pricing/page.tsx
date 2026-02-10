'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { Check, Sparkles, Zap, Crown } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

interface Plan {
  name: string;
  icon: ReactNode;
  price: string;
  priceNote: string;
  features: string[];
  popular?: boolean;
}

const PLANS: Plan[] = [
  {
    name: 'Starter',
    icon: <Zap size={20} />,
    price: '[DOPLNIŤ]',
    priceNote: '/ mesiac vrátane DPH (23 %)',
    features: [
      'Gmail synchronizácia',
      'AI kategorizácia emailov',
      'AI sumarizácia',
      'Až 500 emailov / mesiac',
      '5 FAQ šablón',
      'Email podpora',
    ],
  },
  {
    name: 'Professional',
    icon: <Sparkles size={20} />,
    price: '[DOPLNIŤ]',
    priceNote: '/ mesiac vrátane DPH (23 %)',
    popular: true,
    features: [
      'Všetko v Starter +',
      'AI návrhy odpovedí',
      'Auto-reply na FAQ',
      'Až 2 000 emailov / mesiac',
      'Neobmedzené FAQ šablóny',
      'Reply patterns (učenie sa)',
      'Štatistiky a metriky',
      'Prioritná podpora',
    ],
  },
  {
    name: 'Enterprise',
    icon: <Crown size={20} />,
    price: '[DOPLNIŤ]',
    priceNote: '/ mesiac vrátane DPH (23 %)',
    features: [
      'Všetko v Professional +',
      'Neobmedzené emaily',
      'Viac Gmail účtov',
      'Tímový prístup',
      'API prístup',
      'Vlastný AI model',
      'SLA garantácia',
      'Dedikovaná podpora',
    ],
  },
];

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [autoRenew, setAutoRenew] = useState(false);

  const canOrder = termsAccepted && privacyAccepted;

  return (
    <div>
      <div className="text-center mb-10">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Cenník</h1>
        <p className="text-sm text-[var(--text-tertiary)]">Vyberte si plán, ktorý vyhovuje vašim potrebám</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {PLANS.map(plan => (
          <div
            key={plan.name}
            className={`bg-[var(--bg-primary)] border rounded-[var(--radius-xl)] p-6 flex flex-col ${
              plan.popular
                ? 'border-[var(--primary-500)] ring-1 ring-[var(--primary-500)] shadow-[var(--shadow-lg)]'
                : 'border-[var(--border-primary)]'
            }`}
          >
            {plan.popular && (
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--primary-600)] mb-3">
                Najobľúbenejší
              </div>
            )}
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center ${
                plan.popular ? 'bg-[var(--primary-50)] text-[var(--primary-600)]' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
              }`}>
                {plan.icon}
              </div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">{plan.name}</h2>
            </div>

            <div className="mb-6">
              <span className="text-2xl font-bold text-[var(--danger-600)]">{plan.price}</span>
              <span className="text-xs text-[var(--text-tertiary)] ml-1">{plan.priceNote}</span>
            </div>

            <ul className="space-y-2.5 flex-1 mb-6">
              {plan.features.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                  <Check size={14} className="text-[var(--success-600)] shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>

            <Button
              variant={plan.popular ? 'primary' : 'secondary'}
              className="w-full"
              onClick={() => setSelectedPlan(plan)}
            >
              Vybrať {plan.name}
            </Button>
          </div>
        ))}
      </div>

      <p className="text-xs text-[var(--text-tertiary)] text-center">
        Všetky ceny sú uvedené vrátane DPH (23 %). Fakturácia mesačne vopred.
      </p>

      {/* Order Summary Modal */}
      <Modal
        open={!!selectedPlan}
        onClose={() => {
          setSelectedPlan(null);
          setTermsAccepted(false);
          setPrivacyAccepted(false);
          setAutoRenew(false);
        }}
        title="Zhrnutie objednávky"
        width="max-w-md"
      >
        {selectedPlan && (
          <div className="space-y-5">
            {/* Summary */}
            <div className="bg-[var(--bg-secondary)] rounded-[var(--radius-lg)] p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Plán</span>
                <span className="font-medium text-[var(--text-primary)]">{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Cena</span>
                <span className="font-medium text-[var(--danger-600)]">{selectedPlan.price} / mesiac</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">DPH (23 %)</span>
                <span className="text-[var(--text-tertiary)]">zahrnutá v cene</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Fakturačné obdobie</span>
                <span className="text-[var(--text-primary)]">Mesačne</span>
              </div>
            </div>

            <p className="text-xs text-[var(--text-tertiary)]">
              Pred potvrdením objednávky skontrolujte údaje. Údaje môžete zmeniť zatvorením tohto okna.
            </p>

            {/* Consent checkboxes */}
            <div className="space-y-3">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={e => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-[var(--border-primary)] accent-[var(--primary-600)]"
                />
                <span className="text-sm text-[var(--text-secondary)]">
                  Súhlasím s{' '}
                  <Link href="/terms" target="_blank" className="text-[var(--primary-600)] hover:underline">
                    Všeobecnými obchodnými podmienkami
                  </Link>
                </span>
              </label>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacyAccepted}
                  onChange={e => setPrivacyAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-[var(--border-primary)] accent-[var(--primary-600)]"
                />
                <span className="text-sm text-[var(--text-secondary)]">
                  Oboznámil som sa so{' '}
                  <Link href="/privacy-policy" target="_blank" className="text-[var(--primary-600)] hover:underline">
                    Zásadami ochrany osobných údajov
                  </Link>
                </span>
              </label>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRenew}
                  onChange={e => setAutoRenew(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-[var(--border-primary)] accent-[var(--primary-600)]"
                />
                <span className="text-sm text-[var(--text-secondary)]">
                  Súhlasím s automatickým predĺžením predplatného na ďalšie obdobie
                </span>
              </label>
            </div>

            <p className="text-xs text-[var(--text-tertiary)]">
              Kliknutím na tlačidlo sa zaväzujete k platbe.
              {!autoRenew && ' Bez súhlasu s automatickým predĺžením sa predplatné nepredlžuje.'}
            </p>

            <div className="flex gap-2 justify-end pt-1">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSelectedPlan(null);
                  setTermsAccepted(false);
                  setPrivacyAccepted(false);
                  setAutoRenew(false);
                }}
              >
                Zrušiť
              </Button>
              <Button
                size="sm"
                disabled={!canOrder}
                onClick={() => {
                  // Stripe integration placeholder
                  alert('Stripe integrácia bude implementovaná v ďalšej fáze.');
                }}
              >
                Objednávka s povinnosťou platby
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
