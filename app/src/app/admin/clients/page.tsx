'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ClientWithStats } from '@/lib/types';
import Skeleton from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';
import {
  Users,
  Mail,
  HelpCircle,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Wifi,
  WifiOff,
} from 'lucide-react';

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  URGENT: { label: 'Urgentne', color: 'var(--danger-600)' },
  TIME_SENSITIVE: { label: 'Casovo citlive', color: 'var(--warning-600)' },
  FAQ: { label: 'FAQ', color: 'var(--info-600)' },
  NORMAL: { label: 'Bezne', color: 'var(--text-tertiary)' },
  SPAM: { label: 'Spam', color: 'var(--border-secondary)' },
};

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<ClientDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const detailRequestId = useRef(0);

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/clients');
      const data = await res.json();
      if (data.success) setClients(data.data);
      else setError(data.error);
    } catch {
      setError('Nepodarilo sa nacitat klientov');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  async function loadDetail(id: string) {
    setSelected(id);
    setDetailLoading(true);
    const requestId = ++detailRequestId.current;
    try {
      const res = await fetch(`/api/admin/clients/${id}`);
      const data = await res.json();
      // Only apply if this is still the latest request
      if (requestId !== detailRequestId.current) return;
      if (data.success) setDetail(data.data);
    } catch {
      if (requestId === detailRequestId.current) setDetail(null);
    } finally {
      if (requestId === detailRequestId.current) setDetailLoading(false);
    }
  }

  async function toggleActive(id: string, currentActive: boolean) {
    try {
      const res = await fetch(`/api/admin/clients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive }),
      });
      const data = await res.json();
      if (data.success) {
        setClients((prev) =>
          prev.map((c) => (c.id === id ? { ...c, active: !currentActive } : c))
        );
        if (detail && selected === id) {
          setDetail({ ...detail, active: !currentActive });
        }
      }
    } catch {
      // silently fail
    }
  }

  if (loading) {
    return (
      <div className="p-8 max-w-6xl">
        <Skeleton width={200} height={24} className="mb-2" />
        <Skeleton width={160} height={14} className="mb-6" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[var(--radius-xl)] p-4 flex items-center gap-4">
              <Skeleton width={40} height={40} rounded="full" />
              <div className="flex-1 space-y-2">
                <Skeleton width={140} height={14} />
                <Skeleton width={200} height={12} />
              </div>
              <Skeleton width={60} height={28} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Sprava klientov</h1>
        <div className="text-sm text-[var(--danger-600)] bg-[var(--danger-50)] px-4 py-3 rounded-[var(--radius-lg)] flex items-center gap-2">
          <AlertTriangle size={16} />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Client List */}
      <div className="w-[480px] border-r border-[var(--border-primary)] flex flex-col shrink-0">
        <div className="px-5 py-4 border-b border-[var(--border-primary)]">
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-lg text-[var(--text-primary)]">Sprava klientov</h1>
            <span className="text-xs text-[var(--text-tertiary)]">{clients.length}</span>
          </div>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Registrovani klienti</p>
        </div>

        <div className="flex-1 overflow-auto">
          {clients.length === 0 ? (
            <div className="p-8 text-center">
              <Users size={28} className="mx-auto mb-3 text-[var(--text-tertiary)] opacity-30" />
              <p className="text-sm text-[var(--text-tertiary)]">Ziadni klienti</p>
            </div>
          ) : (
            clients.map((client) => (
              <button
                key={client.id}
                onClick={() => loadDetail(client.id)}
                className={`w-full text-left px-5 py-3 border-b border-[var(--border-primary)] hover:bg-[var(--bg-hover)] transition-colors
                  ${selected === client.id ? 'bg-[var(--primary-50)] border-l-2 border-l-[var(--primary-500)]' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate" title={client.name}>{client.name}</p>
                      {!client.active && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-[var(--danger-50)] text-[var(--danger-600)] rounded-full font-medium">
                          neaktivny
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-tertiary)] truncate" title={client.email}>{client.email}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-medium text-[var(--text-primary)] tabular-nums">{client.email_count}</p>
                    <p className="text-[10px] text-[var(--text-tertiary)]">emailov</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-1">
                    {client.gmail_connected
                      ? <><Wifi size={10} className="text-[var(--success-600)]" /> Gmail</>
                      : <><WifiOff size={10} /> Gmail</>}
                  </span>
                  <span className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-1">
                    <HelpCircle size={10} />
                    {client.faq_count} FAQ
                  </span>
                  <span className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-1">
                    <Calendar size={10} />
                    {new Date(client.created_at).toLocaleDateString('sk-SK')}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Client Detail */}
      <div className="flex-1 overflow-auto">
        {selected && detail && !detailLoading ? (
          <div className="p-6 max-w-2xl">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-[var(--text-primary)]">{detail.name}</h2>
                <p className="text-sm text-[var(--text-tertiary)]">{detail.email}</p>
                {detail.gmail_email && (
                  <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Gmail: {detail.gmail_email}</p>
                )}
              </div>
              <Button
                variant={detail.active ? 'danger' : 'primary'}
                size="sm"
                onClick={() => toggleActive(detail.id, detail.active)}
              >
                {detail.active ? 'Deaktivovat' : 'Aktivovat'}
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              <StatCard label="Emaily celkom" value={detail.email_total} icon={<Mail size={14} />} />
              <StatCard label="Emaily dnes" value={detail.email_today} icon={<Mail size={14} />} />
              <StatCard label="FAQ zhody" value={detail.faq_matched} icon={<HelpCircle size={14} />} />
              <StatCard label="FAQ sablony" value={detail.faq_count} icon={<HelpCircle size={14} />} />
            </div>

            {/* Status badges */}
            <div className="flex items-center gap-2 mb-6">
              <span className={`text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                detail.active
                  ? 'bg-[var(--success-50)] text-[var(--success-600)]'
                  : 'bg-[var(--danger-50)] text-[var(--danger-600)]'
              }`}>
                {detail.active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                {detail.active ? 'Aktivny' : 'Neaktivny'}
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                detail.gmail_connected
                  ? 'bg-[var(--info-50)] text-[var(--info-600)]'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'
              }`}>
                {detail.gmail_connected ? <Wifi size={12} /> : <WifiOff size={12} />}
                {detail.gmail_connected ? 'Gmail pripojeny' : 'Gmail nepripojeny'}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] flex items-center gap-1.5">
                <Calendar size={12} />
                Od {new Date(detail.created_at).toLocaleDateString('sk-SK')}
              </span>
            </div>

            {/* Category Breakdown */}
            {detail.categories.length > 0 && (
              <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[var(--radius-xl)] p-5">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Kategorie emailov</h3>
                <div className="space-y-3">
                  {detail.categories.map((cat) => {
                    const maxCat = Math.max(...detail.categories.map((c) => c.count), 1);
                    const pct = (cat.count / maxCat) * 100;
                    const config = CATEGORY_CONFIG[cat.category] || CATEGORY_CONFIG.NORMAL;
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
              </div>
            )}
          </div>
        ) : detailLoading ? (
          <div className="p-6 max-w-2xl">
            <div className="flex items-start justify-between mb-6">
              <div className="space-y-2">
                <Skeleton width={180} height={20} />
                <Skeleton width={220} height={14} />
              </div>
              <Skeleton width={100} height={32} />
            </div>
            <div className="grid grid-cols-4 gap-3 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[var(--radius-xl)] p-3 space-y-2">
                  <Skeleton width={40} height={24} />
                  <Skeleton width={80} height={10} />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mb-6">
              <Skeleton width={80} height={24} rounded="full" />
              <Skeleton width={120} height={24} rounded="full" />
              <Skeleton width={100} height={24} rounded="full" />
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Users size={36} className="mx-auto mb-3 text-[var(--text-tertiary)] opacity-20" />
              <p className="text-sm text-[var(--text-tertiary)]">Vyberte klienta na zobrazenie</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[var(--radius-xl)] p-3 text-center">
      <div className="flex justify-center mb-1">
        <span className="text-[var(--text-tertiary)]">{icon}</span>
      </div>
      <p className="text-xl font-bold text-[var(--text-primary)] tabular-nums">{value}</p>
      <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{label}</p>
    </div>
  );
}

interface ClientDetail {
  id: string;
  name: string;
  email: string;
  gmail_connected: boolean;
  gmail_email: string | null;
  active: boolean;
  created_at: string;
  email_total: number;
  email_today: number;
  faq_matched: number;
  faq_count: number;
  categories: { category: string; count: number }[];
}
