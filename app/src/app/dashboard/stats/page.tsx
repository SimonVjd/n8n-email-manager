'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';
import { SkeletonLine } from '@/components/ui/Skeleton';
import {
  Mail,
  Send,
  Timer,
  Percent,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';

interface StatsData {
  scorecards: {
    received: number;
    replied: number;
    avg_response_time: string;
    reply_rate: string;
  };
  categories: { category: string; count: number }[];
  topSenders: { from_address: string; count: number }[];
  dailyTrend: { day: string; count: number }[];
  autoReply: { auto_sent: number; edited_sent: number; rejected: number };
}

const PERIODS = [
  { key: 'today', label: 'Dnes' },
  { key: 'week', label: 'Tento týždeň' },
  { key: 'month', label: 'Tento mesiac' },
];

const CATEGORY_COLORS: Record<string, string> = {
  URGENT: 'var(--danger-500)',
  TIME_SENSITIVE: 'var(--warning-500)',
  FAQ: 'var(--info-500)',
  NORMAL: 'var(--primary-500)',
  SPAM: 'var(--text-tertiary)',
};

const CATEGORY_LABELS: Record<string, string> = {
  URGENT: 'Naliehavé',
  TIME_SENSITIVE: 'Časovo citlivé',
  FAQ: 'FAQ',
  NORMAL: 'Bežné',
  SPAM: 'Spam',
};

export default function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [period, setPeriod] = useState('week');
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchWithTimeout(`/api/stats/detailed?period=${period}`);
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [period]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const maxTrend = stats ? Math.max(...stats.dailyTrend.map(d => d.count), 1) : 1;
  const maxCategory = stats ? Math.max(...stats.categories.map(c => c.count), 1) : 1;
  const autoTotal = stats
    ? stats.autoReply.auto_sent + stats.autoReply.edited_sent + stats.autoReply.rejected
    : 0;

  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">Štatistiky</h1>
        <div className="flex items-center gap-1 bg-[var(--bg-secondary)] rounded-[var(--radius-md)] p-0.5">
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`text-xs px-3 py-1.5 rounded-[var(--radius-sm)] transition-colors ${
                period === p.key
                  ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-[var(--shadow-xs)] font-medium'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[var(--radius-lg)] p-4">
                <SkeletonLine width="60%" />
                <div className="mt-3"><SkeletonLine width="40%" /></div>
              </div>
            ))}
          </div>
        </div>
      ) : stats ? (
        <>
          {/* Scorecards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <ScoreCard icon={<Mail size={18} />} label="Prijaté" value={stats.scorecards.received} color="var(--primary-500)" index={0} />
            <ScoreCard icon={<Send size={18} />} label="Zodpovedané" value={stats.scorecards.replied} color="var(--success-500)" index={1} />
            <ScoreCard icon={<Timer size={18} />} label="Priem. odpoveď" value={stats.scorecards.avg_response_time} color="var(--warning-500)" index={2} />
            <ScoreCard icon={<Percent size={18} />} label="Miera odpovede" value={stats.scorecards.reply_rate} color="var(--info-500)" index={3} />
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Daily trend */}
            <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[var(--radius-lg)] p-4 fade-in-up" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={16} className="text-[var(--primary-500)]" />
                <h3 className="text-sm font-medium text-[var(--text-primary)]">7-dňový trend</h3>
              </div>
              <div className="flex items-end gap-1 h-32">
                {stats.dailyTrend.map((d, i) => {
                  const height = Math.max((d.count / maxTrend) * 100, 4);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[9px] text-[var(--text-tertiary)] tabular-nums">{d.count}</span>
                      <div
                        className="w-full bg-[var(--primary-500)] rounded-t-[var(--radius-sm)] transition-all duration-300"
                        style={{ height: `${height}%`, minHeight: '4px' }}
                      />
                      <span className="text-[8px] text-[var(--text-tertiary)]">
                        {new Date(d.day).toLocaleDateString('sk-SK', { weekday: 'short' })}
                      </span>
                    </div>
                  );
                })}
                {stats.dailyTrend.length === 0 && (
                  <p className="text-xs text-[var(--text-tertiary)] w-full text-center py-8">Žiadne dáta</p>
                )}
              </div>
            </div>

            {/* Category breakdown */}
            <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[var(--radius-lg)] p-4 fade-in-up" style={{ animationDelay: '275ms', animationFillMode: 'both' }}>
              <h3 className="text-sm font-medium text-[var(--text-primary)] mb-4">Kategórie</h3>
              <div className="space-y-3">
                {stats.categories.map(cat => (
                  <div key={cat.category}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-[var(--text-secondary)]">{CATEGORY_LABELS[cat.category] || cat.category}</span>
                      <span className="text-xs font-medium text-[var(--text-primary)] tabular-nums">{cat.count}</span>
                    </div>
                    <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${(cat.count / maxCategory) * 100}%`,
                          backgroundColor: CATEGORY_COLORS[cat.category] || 'var(--primary-500)',
                        }}
                      />
                    </div>
                  </div>
                ))}
                {stats.categories.length === 0 && (
                  <p className="text-xs text-[var(--text-tertiary)] text-center py-4">Žiadne dáta</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Top senders */}
            <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[var(--radius-lg)] p-4 fade-in-up" style={{ animationDelay: '350ms', animationFillMode: 'both' }}>
              <div className="flex items-center gap-2 mb-4">
                <Users size={16} className="text-[var(--primary-500)]" />
                <h3 className="text-sm font-medium text-[var(--text-primary)]">Top odosielatelia</h3>
              </div>
              <div className="space-y-2">
                {stats.topSenders.map((s, i) => (
                  <div key={s.from_address} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] text-[var(--text-tertiary)] w-4 text-right tabular-nums">{i + 1}.</span>
                      <span className="text-xs text-[var(--text-primary)] truncate">{s.from_address}</span>
                    </div>
                    <span className="text-xs font-medium text-[var(--text-secondary)] tabular-nums shrink-0">{s.count}</span>
                  </div>
                ))}
                {stats.topSenders.length === 0 && (
                  <p className="text-xs text-[var(--text-tertiary)] text-center py-4">Žiadne dáta</p>
                )}
              </div>
            </div>

            {/* Auto-reply effectiveness */}
            <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[var(--radius-lg)] p-4 fade-in-up" style={{ animationDelay: '425ms', animationFillMode: 'both' }}>
              <div className="flex items-center gap-2 mb-4">
                <Zap size={16} className="text-[var(--warning-500)]" />
                <h3 className="text-sm font-medium text-[var(--text-primary)]">Auto-odpovede</h3>
              </div>
              {autoTotal > 0 ? (
                <div className="space-y-3">
                  <AutoReplyBar label="Automaticky odoslané" count={stats.autoReply.auto_sent} total={autoTotal} color="var(--success-500)" />
                  <AutoReplyBar label="Upravené a odoslané" count={stats.autoReply.edited_sent} total={autoTotal} color="var(--warning-500)" />
                  <AutoReplyBar label="Zamietnuté" count={stats.autoReply.rejected} total={autoTotal} color="var(--danger-500)" />
                </div>
              ) : (
                <p className="text-xs text-[var(--text-tertiary)] text-center py-4">Žiadne auto-odpovede v tomto období</p>
              )}
            </div>
          </div>
        </>
      ) : (
        <p className="text-sm text-[var(--text-tertiary)]">Nepodarilo sa načítať štatistiky</p>
      )}
    </div>
  );
}

function ScoreCard({ icon, label, value, color, index = 0 }: { icon: React.ReactNode; label: string; value: string | number; color: string; index?: number }) {
  return (
    <div
      className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[var(--radius-lg)] p-4 fade-in-up"
      style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span style={{ color }}>{icon}</span>
        <span className="text-xs text-[var(--text-tertiary)]">{label}</span>
      </div>
      <p className="text-2xl font-semibold text-[var(--text-primary)] tabular-nums">{value}</p>
    </div>
  );
}

function AutoReplyBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-[var(--text-secondary)]">{label}</span>
        <span className="text-xs font-medium text-[var(--text-primary)] tabular-nums">{count} ({pct}%)</span>
      </div>
      <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
