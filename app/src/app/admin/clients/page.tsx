'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ClientWithStats } from '@/lib/types';

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<ClientDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/clients');
      const data = await res.json();
      if (data.success) setClients(data.data);
      else setError(data.error);
    } catch {
      setError('Nepodarilo sa načítať klientov');
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
    try {
      const res = await fetch(`/api/admin/clients/${id}`);
      const data = await res.json();
      if (data.success) setDetail(data.data);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
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
      <div className="p-8">
        <div className="h-8 w-32 bg-[var(--border)] rounded-lg animate-pulse mb-6" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-[var(--card)] border border-[var(--border)] rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Správa klientov</h1>
        <div className="text-sm text-[var(--danger)] bg-red-50 px-4 py-3 rounded-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Client List */}
      <div className="w-[480px] border-r border-[var(--border)] flex flex-col shrink-0">
        <div className="px-5 py-4 border-b border-[var(--border)]">
          <h1 className="font-semibold text-lg">Správa klientov</h1>
          <p className="text-xs text-[var(--muted)] mt-0.5">{clients.length} registrovaných klientov</p>
        </div>

        <div className="flex-1 overflow-auto">
          {clients.length === 0 ? (
            <div className="p-8 text-center text-sm text-[var(--muted)]">Žiadni klienti</div>
          ) : (
            clients.map((client) => (
              <button
                key={client.id}
                onClick={() => loadDetail(client.id)}
                className={`w-full text-left px-5 py-3 border-b border-[var(--border)] hover:bg-stone-50 transition-colors
                  ${selected === client.id ? 'bg-[var(--accent-light)] border-l-2 border-l-[var(--accent)]' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{client.name}</p>
                      {!client.active && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-red-50 text-[var(--danger)] rounded-full font-medium">
                          neaktívny
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--muted)] truncate">{client.email}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-medium">{client.email_count}</p>
                    <p className="text-[10px] text-[var(--muted)]">emailov</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[10px] text-[var(--muted)]">
                    {client.gmail_connected ? '🟢 Gmail' : '⚪ Gmail'}
                  </span>
                  <span className="text-[10px] text-[var(--muted)]">
                    {client.faq_count} FAQ
                  </span>
                  <span className="text-[10px] text-[var(--muted)]">
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
                <h2 className="text-xl font-semibold">{detail.name}</h2>
                <p className="text-sm text-[var(--muted)]">{detail.email}</p>
                {detail.gmail_email && (
                  <p className="text-xs text-[var(--muted)] mt-0.5">Gmail: {detail.gmail_email}</p>
                )}
              </div>
              <button
                onClick={() => toggleActive(detail.id, detail.active)}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                  detail.active
                    ? 'border-[var(--danger)] text-[var(--danger)] hover:bg-red-50'
                    : 'border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent-light)]'
                }`}
              >
                {detail.active ? 'Deaktivovať' : 'Aktivovať'}
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              <StatCard label="Emaily celkom" value={detail.email_total} />
              <StatCard label="Emaily dnes" value={detail.email_today} />
              <StatCard label="FAQ zhody" value={detail.faq_matched} />
              <StatCard label="FAQ šablóny" value={detail.faq_count} />
            </div>

            {/* Status badges */}
            <div className="flex items-center gap-2 mb-6">
              <span className={`text-xs px-2.5 py-1 rounded-full ${
                detail.active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-[var(--danger)]'
              }`}>
                {detail.active ? 'Aktívny' : 'Neaktívny'}
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-full ${
                detail.gmail_connected ? 'bg-blue-50 text-blue-700' : 'bg-stone-100 text-[var(--muted)]'
              }`}>
                {detail.gmail_connected ? 'Gmail pripojený' : 'Gmail nepripojený'}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-stone-100 text-[var(--muted)]">
                Od {new Date(detail.created_at).toLocaleDateString('sk-SK')}
              </span>
            </div>

            {/* Category Breakdown */}
            {detail.categories.length > 0 && (
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
                <h3 className="text-sm font-medium mb-3">Kategórie emailov</h3>
                <div className="space-y-2">
                  {detail.categories.map((cat) => {
                    const maxCat = Math.max(...detail.categories.map((c) => c.count), 1);
                    const pct = (cat.count / maxCat) * 100;
                    const colors: Record<string, string> = {
                      URGENT: '#dc2626', TIME_SENSITIVE: '#ea580c', FAQ: '#2563eb', NORMAL: '#78716c', SPAM: '#a8a29e',
                    };
                    const labels: Record<string, string> = {
                      URGENT: 'Urgentné', TIME_SENSITIVE: 'Časovo citlivé', FAQ: 'FAQ', NORMAL: 'Bežné', SPAM: 'Spam',
                    };
                    return (
                      <div key={cat.category}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs">{labels[cat.category] || cat.category}</span>
                          <span className="text-xs font-medium">{cat.count}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[var(--border)]">
                          <div
                            className="h-1.5 rounded-full"
                            style={{ width: `${pct}%`, backgroundColor: colors[cat.category] || '#78716c' }}
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
          <div className="p-8">
            <div className="h-6 w-40 bg-[var(--border)] rounded animate-pulse mb-4" />
            <div className="grid grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-[var(--card)] border border-[var(--border)] rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-3 opacity-30">👥</div>
              <p className="text-sm text-[var(--muted)]">Vyberte klienta na zobrazenie</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-3 text-center">
      <p className="text-xl font-bold">{value}</p>
      <p className="text-[10px] text-[var(--muted)] mt-0.5">{label}</p>
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
