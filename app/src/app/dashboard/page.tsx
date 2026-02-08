'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Email } from '@/lib/types';
import EmailCard from '@/components/EmailCard';
import CategoryBadge from '@/components/CategoryBadge';

export default function InboxPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selected, setSelected] = useState<Email | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const fetchEmails = useCallback(async () => {
    try {
      const res = await fetch('/api/emails');
      const data = await res.json();
      if (data.success) setEmails(data.data);
    } catch (err) {
      console.error('Failed to fetch emails:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmails();
    // Check Gmail connection status
    fetch('/api/auth/gmail/status')
      .then(r => r.json())
      .then(d => { if (d.success) setGmailConnected(d.data.connected); })
      .catch(() => {});
  }, [fetchEmails]);

  async function handleSync() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/emails/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        const { synced, already_exists } = data.data;
        setSyncResult(
          synced > 0
            ? `Synchronizovaných ${synced} nových emailov`
            : `Žiadne nové emaily (${already_exists} už existuje)`
        );
        fetchEmails();
      } else {
        setSyncResult(data.error);
      }
    } catch {
      setSyncResult('Chyba pri synchronizácii');
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="flex h-full">
      {/* Email List */}
      <div className="w-96 border-r border-[var(--border)] flex flex-col shrink-0">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
          <h1 className="font-semibold">Doručené</h1>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--muted)]">{emails.length} emailov</span>
            {gmailConnected && (
              <button
                onClick={handleSync}
                disabled={syncing}
                className="text-xs px-2.5 py-1 border border-[var(--border)] rounded-lg hover:bg-stone-50 transition-colors disabled:opacity-50"
                title="Synchronizovať z Gmail"
              >
                {syncing ? '⏳ Sync...' : '🔄 Sync'}
              </button>
            )}
            <button
              onClick={() => setShowAddForm(true)}
              className="text-xs px-2.5 py-1 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              + Pridať
            </button>
          </div>
        </div>

        {/* Sync result */}
        {syncResult && (
          <div className="px-4 py-2 bg-[var(--accent-light)] text-xs text-[var(--accent)] flex items-center justify-between">
            <span>{syncResult}</span>
            <button onClick={() => setSyncResult(null)} className="font-medium hover:opacity-70">&times;</button>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="p-8 text-center text-sm text-[var(--muted)]">Načítavanie...</div>
          ) : emails.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-[var(--muted)] mb-2">Žiadne emaily</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="text-sm text-[var(--accent)] hover:underline"
              >
                Pridajte testovací email
              </button>
            </div>
          ) : (
            emails.map((email) => (
              <EmailCard
                key={email.id}
                email={email}
                selected={selected?.id === email.id}
                onClick={() => setSelected(email)}
              />
            ))
          )}
        </div>
      </div>

      {/* Email Detail */}
      <div className="flex-1 overflow-auto">
        {selected ? (
          <div className="p-6 max-w-3xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold mb-1">{selected.subject}</h2>
                <p className="text-sm text-[var(--muted)]">Od: {selected.from_address}</p>
                <p className="text-xs text-[var(--muted)]">
                  {new Date(selected.received_at).toLocaleString('sk-SK')}
                </p>
              </div>
              <CategoryBadge category={selected.category} />
            </div>

            {selected.summary_sk && (
              <div className="bg-[var(--accent-light)] rounded-xl p-4 mb-6">
                <p className="text-xs font-medium text-[var(--accent)] mb-1">AI Zhrnutie</p>
                <p className="text-sm">{selected.summary_sk}</p>
              </div>
            )}

            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {selected.body}
              </div>
            </div>

            {/* Auto-reply suggestion */}
            {selected.auto_reply_sk && (
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-[var(--info)]">Navrhovaná odpoveď (FAQ)</p>
                  <button
                    onClick={() => navigator.clipboard.writeText(selected.auto_reply_sk!)}
                    className="text-xs px-2 py-1 text-[var(--info)] border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    Kopírovať
                  </button>
                </div>
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-blue-900">
                  {selected.auto_reply_sk}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-3 opacity-30">📧</div>
              <p className="text-sm text-[var(--muted)]">Vyberte email na zobrazenie</p>
            </div>
          </div>
        )}
      </div>

      {/* Add Email Modal */}
      {showAddForm && (
        <AddEmailModal
          onClose={() => setShowAddForm(false)}
          onAdded={() => {
            setShowAddForm(false);
            fetchEmails();
          }}
        />
      )}
    </div>
  );
}

function AddEmailModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [fromAddress, setFromAddress] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from_address: fromAddress, subject, body }),
      });
      const data = await res.json();
      if (data.success) {
        onAdded();
      } else {
        setError(data.error);
      }
    } catch {
      setError('Chyba pri ukladaní');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-[var(--card)] rounded-2xl p-6 w-full max-w-lg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-4">Pridať testovací email</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">Od (email)</label>
            <input
              type="email"
              value={fromAddress}
              onChange={(e) => setFromAddress(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-xl text-sm bg-[var(--background)]"
              placeholder="odosielatel@priklad.sk"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">Predmet</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-xl text-sm bg-[var(--background)]"
              placeholder="Predmet emailu"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">Telo správy</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-xl text-sm bg-[var(--background)] resize-none"
              placeholder="Text emailu..."
              required
            />
          </div>
          {error && (
            <div className="text-sm text-[var(--danger)] bg-red-50 px-3 py-2 rounded-xl">{error}</div>
          )}
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-xl border border-[var(--border)] hover:bg-stone-50"
            >
              Zrušiť
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm bg-[var(--accent)] text-white rounded-xl hover:opacity-90 disabled:opacity-50"
            >
              {saving ? 'AI spracovanie...' : 'Pridať email'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
