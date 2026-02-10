'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import {
  Mail,
  AlertTriangle,
  Clock,
  Timer,
  ChevronDown,
  Bell,
} from 'lucide-react';

interface StatsData {
  new_today: number;
  urgent_pending: number;
  waiting_reply: number;
  avg_response_time: string;
  avg_response_minutes: number | null;
  follow_ups: {
    id: string;
    from_address: string;
    subject: string;
    reply_sent_at: string;
    days_waiting: string;
  }[];
}

interface InboxStatsProps {
  onSelectEmail?: (id: string) => void;
}

export default function InboxStats({ onSelectEmail }: InboxStatsProps) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [collapsed, setCollapsed] = useLocalStorage('inbox-stats-collapsed', false);
  const [showFollowUps, setShowFollowUps] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetchWithTimeout('/api/stats', { timeout: 10000 });
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (!stats) return null;

  if (collapsed) {
    return (
      <div className="border-b border-[var(--border-primary)]">
        <button
          onClick={() => setCollapsed(false)}
          className="w-full flex items-center justify-center px-4 py-1 hover:bg-[var(--bg-hover)] transition-colors"
          title="Zobraziť štatistiky"
        >
          <ChevronDown size={12} className="text-[var(--text-tertiary)]" />
        </button>
      </div>
    );
  }

  return (
    <div className="border-b border-[var(--border-primary)]">
      <div className="flex items-center">
        <div className="flex-1 flex items-center gap-3 text-[10px] px-4 py-2 overflow-hidden flex-wrap">
          <span className="flex items-center gap-1 text-[var(--text-secondary)]">
            <Mail size={11} /> <strong>{stats.new_today}</strong> dnes
          </span>
          {stats.urgent_pending > 0 && (
            <span className="flex items-center gap-1 text-[var(--danger-600)]">
              <AlertTriangle size={11} /> <strong>{stats.urgent_pending}</strong> naliehavé
            </span>
          )}
          <span className="flex items-center gap-1 text-[var(--text-secondary)]">
            <Clock size={11} /> <strong>{stats.waiting_reply}</strong> čaká
          </span>
          <span className="flex items-center gap-1 text-[var(--text-secondary)]">
            <Timer size={11} /> Priem. <strong>{stats.avg_response_time}</strong>
          </span>
          {stats.follow_ups.length > 0 && (
            <span className="flex items-center gap-1 text-[var(--warning-600)]">
              <Bell size={11} /> <strong>{stats.follow_ups.length}</strong> follow-up
            </span>
          )}
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="px-3 py-2 hover:bg-[var(--bg-hover)] transition-colors"
          title="Skryť štatistiky"
        >
          <ChevronDown size={12} className="text-[var(--text-tertiary)] rotate-180" />
        </button>
      </div>

      {stats.follow_ups.length > 0 && (
        <div className="px-4 pb-2">
          <button
            onClick={() => setShowFollowUps(v => !v)}
            className="text-[10px] text-[var(--warning-600)] hover:text-[var(--warning-700)] flex items-center gap-1"
          >
            <Bell size={10} />
            {stats.follow_ups.length} emailov bez odpovede 3+ dní
            <ChevronDown size={10} className={`transition-transform ${showFollowUps ? 'rotate-180' : ''}`} />
          </button>

          {showFollowUps && (
            <div className="mt-1.5 space-y-1">
              {stats.follow_ups.map(fu => (
                <button
                  key={fu.id}
                  onClick={() => onSelectEmail?.(fu.id)}
                  className="w-full text-left text-[10px] px-2 py-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <span className="text-[var(--text-secondary)]">{fu.from_address}</span>
                  <span className="text-[var(--text-tertiary)] mx-1">·</span>
                  <span className="text-[var(--text-primary)]">{fu.subject}</span>
                  <span className="text-[var(--warning-600)] ml-1">({fu.days_waiting}d)</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
