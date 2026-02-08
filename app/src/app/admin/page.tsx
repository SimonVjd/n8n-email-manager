'use client';

import { useState, useEffect } from 'react';
import type { DashboardMetrics } from '@/lib/types';

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  URGENT: { label: 'Urgentné', color: '#dc2626' },
  TIME_SENSITIVE: { label: 'Časovo citlivé', color: '#ea580c' },
  FAQ: { label: 'FAQ', color: '#2563eb' },
  NORMAL: { label: 'Bežné', color: '#78716c' },
  SPAM: { label: 'Spam', color: '#a8a29e' },
};

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/metrics')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setMetrics(d.data);
        else setError(d.error);
      })
      .catch(() => setError('Nepodarilo sa načítať metriky'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-8 w-48 bg-[var(--border)] rounded-lg animate-pulse mb-8" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-[var(--card)] border border-[var(--border)] rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-2">Administrátorský panel</h1>
        <div className="mt-4 text-sm text-[var(--danger)] bg-red-50 px-4 py-3 rounded-xl">
          {error || 'Nepodarilo sa načítať dáta'}
        </div>
      </div>
    );
  }

  const maxCategory = Math.max(...metrics.categories.map((c) => c.count), 1);

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Administrátorský panel</h1>
        <p className="text-sm text-[var(--muted)] mt-1">Prehľad celého systému</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <MetricCard label="Aktívni klienti" value={metrics.active_clients} sub={`z ${metrics.total_clients} celkovo`} icon="👥" />
        <MetricCard label="Emaily celkom" value={metrics.total_emails} sub="všetci klienti" icon="📧" />
        <MetricCard label="Emaily dnes" value={metrics.today_emails} sub="nové dnes" icon="📥" />
        <MetricCard label="FAQ zhody" value={metrics.faq_matches} sub="automatické odpovede" icon="🎯" />
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
          <h2 className="font-semibold mb-4">Kategórie emailov</h2>
          {metrics.categories.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">Žiadne emaily</p>
          ) : (
            <div className="space-y-3">
              {metrics.categories.map((cat) => {
                const config = CATEGORY_CONFIG[cat.category] || CATEGORY_CONFIG.NORMAL;
                const pct = (cat.count / maxCategory) * 100;
                return (
                  <div key={cat.category}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">{config.label}</span>
                      <span className="text-sm font-medium">{cat.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--border)]">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: config.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
          <h2 className="font-semibold mb-4">Posledná aktivita</h2>
          {metrics.recent_emails.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">Žiadna aktivita</p>
          ) : (
            <div className="space-y-1">
              {metrics.recent_emails.map((email) => {
                const config = CATEGORY_CONFIG[email.category] || CATEGORY_CONFIG.NORMAL;
                return (
                  <div
                    key={email.id}
                    className="flex items-center gap-3 py-2 border-b border-[var(--border)] last:border-0"
                  >
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: config.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm truncate">{email.subject || '(bez predmetu)'}</p>
                      <p className="text-xs text-[var(--muted)] truncate">
                        {email.from_address} &middot; {email.client_name}
                      </p>
                    </div>
                    <span className="text-xs text-[var(--muted)] shrink-0">
                      {new Date(email.received_at).toLocaleString('sk-SK', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub, icon }: { label: string; value: number; sub: string; icon: string }) {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">{label}</p>
        <span className="text-lg">{icon}</span>
      </div>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-xs text-[var(--muted)] mt-1">{sub}</p>
    </div>
  );
}
