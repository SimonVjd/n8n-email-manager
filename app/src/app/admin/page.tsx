'use client';

import { useState, useEffect, useCallback } from 'react';
import type { DashboardMetrics } from '@/lib/types';
import Skeleton from '@/components/ui/Skeleton';
import { Users, Mail, Inbox, Target, AlertTriangle } from 'lucide-react';

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  URGENT: { label: 'Urgentné', color: 'var(--danger-600)' },
  TIME_SENSITIVE: { label: 'Časovo citlivé', color: 'var(--warning-600)' },
  FAQ: { label: 'FAQ', color: 'var(--info-600)' },
  NORMAL: { label: 'Bežné', color: 'var(--text-tertiary)' },
  SPAM: { label: 'Spam', color: 'var(--border-secondary)' },
};

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMetrics = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/metrics');
      const d = await r.json();
      if (d.success) setMetrics(d.data);
      else setError(d.error);
    } catch {
      setError('Nepodarilo sa načítať metriky');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  if (loading) {
    return (
      <div className="p-8 max-w-6xl">
        <Skeleton width={240} height={28} className="mb-2" />
        <Skeleton width={180} height={14} className="mb-8" />
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[var(--radius-xl)] p-5 space-y-3">
              <Skeleton width={100} height={12} />
              <Skeleton width={60} height={32} />
              <Skeleton width={80} height={12} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Administrátorský panel</h1>
        <div className="mt-4 text-sm text-[var(--danger-600)] bg-[var(--danger-50)] px-4 py-3 rounded-[var(--radius-lg)] flex items-center gap-2">
          <AlertTriangle size={16} />
          {error || 'Nepodarilo sa načítať dáta'}
        </div>
      </div>
    );
  }

  const maxCategory = Math.max(...metrics.categories.map((c) => c.count), 1);

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Administrátorský panel</h1>
        <p className="text-sm text-[var(--text-tertiary)] mt-1">Prehľad celého systému</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <MetricCard label="Aktívni klienti" value={metrics.active_clients} sub={`z ${metrics.total_clients} celkovo`} icon={<Users size={18} />} index={0} />
        <MetricCard label="Emaily celkom" value={metrics.total_emails} sub="všetci klienti" icon={<Mail size={18} />} index={1} />
        <MetricCard label="Emaily dnes" value={metrics.today_emails} sub="nové dnes" icon={<Inbox size={18} />} index={2} />
        <MetricCard label="FAQ zhody" value={metrics.faq_matches} sub="automatické odpovede" icon={<Target size={18} />} index={3} />
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[var(--radius-xl)] p-5 fade-in-up" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
          <h2 className="font-semibold text-[var(--text-primary)] mb-4">Kategórie emailov</h2>
          {metrics.categories.length === 0 ? (
            <p className="text-sm text-[var(--text-tertiary)]">Žiadne emaily</p>
          ) : (
            <div className="space-y-3">
              {metrics.categories.map((cat) => {
                const config = CATEGORY_CONFIG[cat.category] || CATEGORY_CONFIG.NORMAL;
                const pct = (cat.count / maxCategory) * 100;
                return (
                  <div key={cat.category}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-[var(--text-primary)]">{config.label}</span>
                      <span className="text-sm font-medium text-[var(--text-primary)] tabular-nums">{cat.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--bg-tertiary)]">
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
        <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[var(--radius-xl)] p-5 fade-in-up" style={{ animationDelay: '275ms', animationFillMode: 'both' }}>
          <h2 className="font-semibold text-[var(--text-primary)] mb-4">Posledná aktivita</h2>
          {metrics.recent_emails.length === 0 ? (
            <p className="text-sm text-[var(--text-tertiary)]">Žiadna aktivita</p>
          ) : (
            <div className="space-y-1">
              {metrics.recent_emails.map((email) => {
                const config = CATEGORY_CONFIG[email.category] || CATEGORY_CONFIG.NORMAL;
                return (
                  <div
                    key={email.id}
                    className="flex items-center gap-3 py-2 border-b border-[var(--border-primary)] last:border-0"
                  >
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: config.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-[var(--text-primary)] truncate" title={email.subject || '(bez predmetu)'}>{email.subject || '(bez predmetu)'}</p>
                      <p className="text-xs text-[var(--text-tertiary)] truncate" title={`${email.from_address} · ${email.client_name}`}>
                        {email.from_address} &middot; {email.client_name}
                      </p>
                    </div>
                    <span className="text-xs text-[var(--text-tertiary)] shrink-0 tabular-nums">
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

function MetricCard({ label, value, sub, icon, index = 0 }: { label: string; value: number; sub: string; icon: React.ReactNode; index?: number }) {
  return (
    <div
      className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[var(--radius-xl)] p-5 fade-in-up"
      style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide">{label}</p>
        <span className="text-[var(--text-tertiary)]">{icon}</span>
      </div>
      <p className="text-3xl font-bold text-[var(--text-primary)] tabular-nums count-up">{value}</p>
      <p className="text-xs text-[var(--text-tertiary)] mt-1">{sub}</p>
    </div>
  );
}
