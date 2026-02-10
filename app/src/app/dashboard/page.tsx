'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Email } from '@/lib/types';
import { fetchWithTimeout, FetchTimeoutError } from '@/lib/fetch-with-timeout';
import EmailCard, { type DensityMode } from '@/components/EmailCard';
import { CategoryBadge } from '@/components/ui/Badge';
import ReplyPanel from '@/components/ReplyPanel';
import { SkeletonEmailCard } from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';
import Kbd from '@/components/ui/Kbd';
import CommandPalette from '@/components/CommandPalette';
import InboxStats from '@/components/InboxStats';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import {
  AlertTriangle,
  ArrowLeft,
  Clock,
  HelpCircle,
  Inbox,

  Trash2,
  RefreshCw,
  ChevronDown,
  Filter,
  ArrowDownWideNarrow,
  ArrowDownNarrowWide,
  CheckCircle2,
  Sparkles,
  Keyboard,
  Rows3,
  Rows4,
  X,
  Eye,
  MessageSquare,
} from 'lucide-react';

/* ── Category filter config ─────────────────────────── */
const CATEGORIES = [
  { key: 'ALL', label: 'Všetky', icon: null },
  { key: 'URGENT', label: 'Naliehavé', icon: <AlertTriangle size={13} /> },
  { key: 'TIME_SENSITIVE', label: 'Časovo citlivé', icon: <Clock size={13} /> },
  { key: 'FAQ', label: 'FAQ', icon: <HelpCircle size={13} /> },
  { key: 'NORMAL', label: 'Bežný', icon: <Inbox size={13} /> },
];

/* ── Priority sort weights ──────────────────────────── */
const PRIORITY_ORDER: Record<string, number> = {
  URGENT: 0,
  TIME_SENSITIVE: 1,
  FAQ: 2,
  NORMAL: 3,
  SPAM: 4,
};

type SortMode = 'priority' | 'newest';

/* ═══════════════════════════════════════════════════════ */

export default function InboxPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [deleting, setDeleting] = useState(false);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortMode, setSortMode] = useLocalStorage<SortMode>('inbox-sort', 'priority');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [density, setDensity] = useLocalStorage<DensityMode>('inbox-density', 'comfortable');
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const initialSyncDone = useRef(false);
  const syncingRef = useRef(false);
  const syncFailCount = useRef(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  /* ── Data fetching ──────────────────────────────────── */
  const fetchEmails = useCallback(async () => {
    try {
      setError(null);
      const res = await fetchWithTimeout('/api/emails');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) {
        setEmails(data.data.filter((e: Email) => e.category !== 'SPAM'));
      } else {
        setError(data.error || 'Nepodarilo sa načítať emaily');
      }
    } catch (err) {
      if (err instanceof FetchTimeoutError) {
        setError('Server neodpovedá. Skúste obnoviť stránku.');
      } else {
        setError('Nepodarilo sa načítať emaily. Skúste znova.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const doSync = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setSyncing(true);
    setError(null);
    try {
      const res = await fetchWithTimeout('/api/emails/sync', { method: 'POST', timeout: 180000 });
      const data = await res.json().catch(() => ({ success: false }));
      if (!res.ok) {
        if (res.status === 401 || data.code === 'GMAIL_TOKEN_EXPIRED') {
          setGmailConnected(false);
          setError('Gmail token vypršal. Pripojte Gmail znova v nastaveniach.');
          syncFailCount.current = 999;
        } else if (res.status === 400) {
          setError(data.error || 'Gmail nie je pripojený. Pripojte ho v nastaveniach.');
        } else {
          setError(data.error || 'Chyba pri synchronizácii emailov.');
          syncFailCount.current++;
        }
        return;
      }
      // Always refresh email list after successful sync
      await fetchEmails();
      syncFailCount.current = 0;
    } catch (err) {
      syncFailCount.current++;
      if (err instanceof FetchTimeoutError) {
        setError('Synchronizácia trvá príliš dlho. Skúste znova.');
      } else {
        setError('Nepodarilo sa synchronizovať emaily.');
        console.error('Sync failed:', err);
      }
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }, [fetchEmails]);

  useEffect(() => {
    fetchEmails();
    fetchWithTimeout('/api/auth/gmail/status', { timeout: 10000 })
      .then(r => r.json())
      .then(d => { if (d.success) setGmailConnected(d.data.connected); })
      .catch(() => {});
  }, [fetchEmails]);

  // Close dropdown on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setCatDropdownOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Auto-sync — only start once when gmail connects, with periodic retry
  useEffect(() => {
    if (!gmailConnected) return;
    if (initialSyncDone.current) return;
    initialSyncDone.current = true;
    doSync();
    const interval = setInterval(() => {
      if (syncFailCount.current < 3) doSync();
    }, 30000);
    return () => clearInterval(interval);
  }, [gmailConnected, doSync]);

  /* ── Clear selection when filter changes ──────────────── */
  useEffect(() => {
    setCheckedIds(new Set());
  }, [categoryFilter]);

  /* ── Filtering + Sorting ────────────────────────────── */
  const filteredEmails = useMemo(() => {
    let list = categoryFilter === 'ALL' ? emails : emails.filter(e => e.category === categoryFilter);

    if (sortMode === 'priority') {
      list = [...list].sort((a, b) => {
        const pa = PRIORITY_ORDER[a.category] ?? 3;
        const pb = PRIORITY_ORDER[b.category] ?? 3;
        if (pa !== pb) return pa - pb;
        if (a.is_read !== b.is_read) return a.is_read ? 1 : -1;
        return new Date(b.received_at).getTime() - new Date(a.received_at).getTime();
      });
    } else {
      list = [...list].sort((a, b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime());
    }
    return list;
  }, [emails, categoryFilter, sortMode]);

  const selected = useMemo(() => emails.find(e => e.id === selectedId) ?? null, [emails, selectedId]);
  const selectedIndex = useMemo(() => filteredEmails.findIndex(e => e.id === selectedId), [filteredEmails, selectedId]);

  /* ── Actions ────────────────────────────────────────── */
  async function handleDelete(emailId: string) {
    if (deleting) return;
    setDeleting(true);
    try {
      const res = await fetchWithTimeout('/api/emails', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [emailId] }),
      });
      const data = await res.json();
      if (data.success) {
        setEmails(prev => prev.filter(e => e.id !== emailId));
        if (selectedId === emailId) setSelectedId(null);
      }
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeleting(false);
    }
  }

  /* ── Keyboard Shortcuts ─────────────────────────────── */
  useKeyboardShortcuts([
    {
      key: 'j',
      action: () => {
        const next = selectedIndex + 1;
        if (next < filteredEmails.length) setSelectedId(filteredEmails[next].id);
        else if (filteredEmails.length > 0 && selectedIndex === -1) setSelectedId(filteredEmails[0].id);
      },
    },
    {
      key: 'k',
      action: () => {
        const prev = selectedIndex - 1;
        if (prev >= 0) setSelectedId(filteredEmails[prev].id);
      },
    },
    {
      key: 'Enter',
      action: () => {
        if (!selectedId && filteredEmails.length > 0) setSelectedId(filteredEmails[0].id);
      },
    },
    {
      key: 'Escape',
      action: () => {
        if (showCommandPalette) setShowCommandPalette(false);
        else if (showShortcuts) setShowShortcuts(false);
        else setSelectedId(null);
      },
      ignoreInput: false,
    },
    {
      key: 'r',
      action: () => {
        if (selected) {
          const textarea = document.querySelector<HTMLTextAreaElement>('.reply-textarea');
          textarea?.focus();
        }
      },
    },
    {
      key: '#',
      action: () => { if (selectedId) handleDelete(selectedId); },
    },
    {
      key: '?',
      action: () => setShowShortcuts(v => !v),
    },
    {
      key: 'k',
      ctrl: true,
      action: () => setShowCommandPalette(true),
      ignoreInput: true,
    },
  ], !showCommandPalette);

  /* ── Auto-mark as read on select ──────────────────────── */
  const markedReadRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!selectedId) return;
    // Only mark once per email per session
    if (markedReadRef.current.has(selectedId)) return;
    const email = emails.find(e => e.id === selectedId);
    if (!email || email.is_read) return;
    markedReadRef.current.add(selectedId);
    setEmails(prev => prev.map(e => e.id === selectedId ? { ...e, is_read: true } : e));
    fetch(`/api/emails/${selectedId}`, { method: 'PATCH' }).catch(() => {});
    window.dispatchEvent(new Event('email-read'));
  }, [selectedId, emails]);

  /* ── Scroll selected into view ──────────────────────── */
  useEffect(() => {
    if (!selectedId || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-email-id="${selectedId}"]`);
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedId]);

  /* ═══════════════════════════════════════════════════════ */
  return (
    <div className="h-full flex flex-col overflow-hidden bg-[var(--bg-primary)]">
      {selected ? (
        /* ── EMAIL DETAIL VIEW (full width) ──────────────── */
        <div className="flex-1 overflow-y-auto">
          {/* Back bar */}
          <div className="sticky top-0 z-10 bg-[var(--bg-primary)] border-b border-[var(--border-primary)] px-4 py-2 flex items-center gap-3">
            <button
              onClick={() => setSelectedId(null)}
              className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <ArrowLeft size={16} />
              Späť
            </button>
            <div className="flex-1" />
            <CategoryBadge category={selected.category} />
            <Button
              variant="ghost"
              size="sm"
              icon={<Trash2 size={14} />}
              onClick={() => handleDelete(selected.id)}
              disabled={deleting}
              className="text-[var(--danger-600)] hover:bg-[var(--danger-50)]"
            >
              {deleting ? '...' : 'Vymazať'}
            </Button>
          </div>

          <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-1 text-[var(--text-primary)]">{selected.subject}</h2>
              <p className="text-sm text-[var(--text-secondary)]">Od: {selected.from_address}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-[var(--text-tertiary)]">
                  {new Date(selected.received_at).toLocaleString('sk-SK')}
                </p>
                <ResponseTimeBadge email={selected} />
              </div>
            </div>

            {selected.summary_sk && (
              <div className="bg-[var(--primary-50)] rounded-[var(--radius-lg)] p-4 mb-6 border border-[var(--primary-100)]">
                <p className="text-xs font-medium text-[var(--primary-600)] mb-1">AI Zhrnutie</p>
                <p className="text-sm text-[var(--text-primary)]">{selected.summary_sk}</p>
              </div>
            )}

            {selected.html_body ? (
              <HtmlEmailRenderer html={selected.html_body} key={selected.id} />
            ) : (
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-primary)]">
                {selected.body}
              </div>
            )}

            {/* Thread view */}
            {selected.gmail_thread_id && (selected.thread_count ?? 0) > 1 && (
              <ThreadView threadId={selected.gmail_thread_id} currentEmailId={selected.id} />
            )}

            {/* AI Reply */}
            {selected.auto_reply_sk && (
              <ReplyPanel
                email={selected}
                onReplySent={(status: Email['reply_status']) => {
                  const updated = { ...selected, reply_status: status };
                  setEmails(prev => prev.map(e => e.id === selected.id ? updated : e));
                }}
                gmailConnected={gmailConnected}
              />
            )}

            {/* Sent confirmation */}
            {(['sent', 'edited_sent', 'auto_sent'] as const).includes(selected.reply_status as 'sent') && (
              <div className="mt-6 bg-[var(--success-50)] border border-green-200 rounded-[var(--radius-lg)] p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[var(--success-600)]" />
                  <p className="text-sm font-medium text-[var(--success-700)]">
                    Odpoveď odoslaná {selected.reply_sent_at ? new Date(selected.reply_sent_at).toLocaleString('sk-SK') : ''}
                    {selected.reply_status === 'auto_sent' && ' (automaticky)'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── EMAIL LIST VIEW (full width) ────────────────── */
        <>
          {/* Header */}
          <div className="px-4 py-3 border-b border-[var(--border-primary)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-[var(--text-primary)]">Doručené</h1>
              </div>
              <div className="flex items-center gap-1">
                {/* Sort toggle */}
                <button
                  onClick={() => setSortMode(s => s === 'priority' ? 'newest' : 'priority')}
                  className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
                  title={sortMode === 'priority' ? 'Prioritné radenie' : 'Najnovšie prvé'}
                  aria-label={sortMode === 'priority' ? 'Prioritné radenie' : 'Najnovšie prvé'}
                >
                  {sortMode === 'priority' ? <ArrowDownWideNarrow size={16} /> : <ArrowDownNarrowWide size={16} />}
                </button>

                {/* Category filter */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setCatDropdownOpen(v => !v)}
                    className={`p-1.5 rounded-[var(--radius-sm)] transition-colors flex items-center gap-1 ${
                      categoryFilter !== 'ALL'
                        ? 'text-[var(--primary-600)] bg-[var(--primary-50)]'
                        : 'text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                    }`}
                    title="Filtrovať podľa kategórie"
                    aria-label="Filtrovať podľa kategórie"
                  >
                    <Filter size={16} />
                    {categoryFilter !== 'ALL' && <ChevronDown size={12} />}
                  </button>
                  {catDropdownOpen && (
                    <div className="absolute top-full right-0 mt-1 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] py-1 z-50 min-w-[160px] scale-in">
                      {CATEGORIES.map(cat => (
                        <button
                          key={cat.key}
                          onClick={() => { setCategoryFilter(cat.key); setCatDropdownOpen(false); }}
                          className={`w-full text-left text-xs px-3 py-2 flex items-center gap-2 transition-colors ${
                            categoryFilter === cat.key
                              ? 'bg-[var(--primary-50)] text-[var(--primary-600)] font-medium'
                              : 'text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                          }`}
                        >
                          <span className="w-4 flex items-center justify-center text-[var(--text-tertiary)]">{cat.icon}</span>
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Density toggle */}
                <button
                  onClick={() => setDensity((d: DensityMode) => d === 'comfortable' ? 'compact' : 'comfortable')}
                  className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
                  title={density === 'comfortable' ? 'Kompaktné zobrazenie' : 'Komfortné zobrazenie'}
                  aria-label={density === 'comfortable' ? 'Kompaktné zobrazenie' : 'Komfortné zobrazenie'}
                >
                  {density === 'comfortable' ? <Rows3 size={16} /> : <Rows4 size={16} />}
                </button>

                {/* Sync */}
                <button
                  onClick={doSync}
                  disabled={syncing}
                  className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
                  title="Synchronizovať emaily"
                  aria-label="Synchronizovať emaily"
                >
                  <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* Sort indicator */}
            <p className="text-[10px] text-[var(--text-tertiary)] mt-1">
              {sortMode === 'priority' ? 'Prioritné radenie' : 'Najnovšie prvé'}
              {categoryFilter !== 'ALL' && ` · ${CATEGORIES.find(c => c.key === categoryFilter)?.label}`}
            </p>
          </div>

          {/* Bulk actions toolbar */}
          {checkedIds.size > 0 && (
            <div className="px-3 py-2 border-b border-[var(--border-primary)] bg-[var(--primary-50)] flex items-center gap-2">
              <span className="text-xs font-medium text-[var(--primary-700)]">{checkedIds.size} vybraných</span>
              <div className="flex-1" />
              <Button
                variant="ghost"
                size="sm"
                icon={<Eye size={13} />}
                onClick={() => {
                  setEmails(prev => prev.map(e => checkedIds.has(e.id) ? { ...e, is_read: true } : e));
                  setCheckedIds(new Set());
                }}
              >
                Prečítané
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={<Trash2 size={13} />}
                className="text-[var(--danger-600)] hover:bg-[var(--danger-50)]"
                onClick={async () => {
                  const ids = Array.from(checkedIds);
                  try {
                    const res = await fetchWithTimeout('/api/emails', {
                      method: 'DELETE',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ ids }),
                    });
                    const data = await res.json();
                    if (data.success) {
                      setEmails(prev => prev.filter(e => !checkedIds.has(e.id)));
                      if (selectedId && checkedIds.has(selectedId)) setSelectedId(null);
                      setCheckedIds(new Set());
                    }
                  } catch { /* silent */ }
                }}
              >
                Vymazať
              </Button>
              <button
                onClick={() => setCheckedIds(new Set())}
                className="p-1 rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Inline stats */}
          <InboxStats onSelectEmail={(id) => setSelectedId(id)} />

          {/* List */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden" ref={listRef}>
            {loading ? (
              <div>
                {[...Array(6)].map((_, i) => <SkeletonEmailCard key={i} index={i} />)}
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <AlertTriangle size={32} className="mx-auto mb-3 text-[var(--text-tertiary)]" />
                <p className="text-sm text-[var(--danger-600)] mb-3">{error}</p>
                <Button variant="ghost" size="sm" onClick={() => { setLoading(true); setError(null); fetchEmails(); }}>
                  Skúsiť znova
                </Button>
              </div>
            ) : filteredEmails.length === 0 ? (
              categoryFilter === 'ALL' && emails.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="inbox-zero-float mb-4">
                    <div className="w-16 h-16 rounded-full bg-[var(--success-50)] flex items-center justify-center mx-auto">
                      <Sparkles size={28} className="text-[var(--success-600)]" />
                    </div>
                  </div>
                  <p className="font-semibold text-[var(--text-primary)] mb-1">Všetko vybavené!</p>
                  <p className="text-sm text-[var(--text-tertiary)]">Žiadne nové emaily. Užite si ten pokoj.</p>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-sm text-[var(--text-tertiary)] mb-2">
                    {categoryFilter !== 'ALL' ? 'Žiadne emaily v tejto kategórii' : 'Žiadne emaily'}
                  </p>
                  {categoryFilter !== 'ALL' && (
                    <button
                      onClick={() => setCategoryFilter('ALL')}
                      className="text-sm text-[var(--primary-600)] hover:underline"
                    >
                      Zobraziť všetky
                    </button>
                  )}
                </div>
              )
            ) : (
              filteredEmails.map((email) => (
                <div key={email.id} data-email-id={email.id}>
                  <EmailCard
                    email={email}
                    selected={selectedId === email.id}
                    onClick={() => setSelectedId(email.id)}
                    density={density}
                    checked={checkedIds.has(email.id)}
                    onCheck={(checked) => {
                      setCheckedIds(prev => {
                        const next = new Set(prev);
                        if (checked) next.add(email.id);
                        else next.delete(email.id);
                        return next;
                      });
                    }}
                    selectionMode={checkedIds.size > 0}
                  />
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* ── Add Email Modal ────────────────────────────── */}
      {showAddForm && (
        <AddEmailModal
          onClose={() => setShowAddForm(false)}
          onAdded={() => { setShowAddForm(false); fetchEmails(); }}
        />
      )}

      {/* ── Keyboard Shortcuts Overlay ─────────────────── */}
      {showShortcuts && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-overlay)] backdrop-blur-[2px] overlay-enter"
          onClick={() => setShowShortcuts(false)}
        >
          <div
            className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)] p-6 w-full max-w-sm modal-enter"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-4">
              <Keyboard size={18} className="text-[var(--primary-500)]" />
              <h3 className="font-semibold text-[var(--text-primary)]">Klávesové skratky</h3>
            </div>
            <div className="space-y-2 text-sm">
              {[
                ['j / k', 'Navigácia dole / hore'],
                ['Enter', 'Otvoriť email'],
                ['Escape', 'Späť na zoznam'],
                ['r', 'Odpovedať'],
                ['Ctrl+Enter', 'Odoslať odpoveď'],
                ['#', 'Vymazať email'],
                ['Ctrl+K', 'Vyhľadávanie'],
                ['?', 'Zobraziť skratky'],
              ].map(([key, desc]) => (
                <div key={key} className="flex items-center justify-between py-1">
                  <span className="text-[var(--text-secondary)]">{desc}</span>
                  <div className="flex gap-1">
                    {key!.split(' / ').map(k => <Kbd key={k}>{k}</Kbd>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Command Palette ──────────────────────────────── */}
      <CommandPalette
        open={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onSelectEmail={(id) => setSelectedId(id)}
      />
    </div>
  );
}

/* ── HTML Email Renderer ──────────────────────────────── */
function HtmlEmailRenderer({ html }: { html: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const resize = () => {
      try {
        const doc = iframe.contentDocument;
        if (doc) { const h = doc.documentElement.scrollHeight; if (h > 0) setHeight(h); }
      } catch { /* cross-origin */ }
    };
    iframe.addEventListener('load', resize);
    const t1 = setTimeout(resize, 200);
    const t2 = setTimeout(resize, 1000);
    return () => { iframe.removeEventListener('load', resize); clearTimeout(t1); clearTimeout(t2); };
  }, [html]);

  const wrappedHtml = `<style>html,body{margin:0;padding:0;max-width:100%!important;overflow-x:hidden!important;word-break:break-word}img,table{max-width:100%!important;height:auto!important}pre{white-space:pre-wrap!important;overflow-x:hidden!important}</style>${html}`;

  return (
    <iframe
      ref={iframeRef}
      srcDoc={wrappedHtml}
      sandbox="allow-same-origin"
      className="w-full border-0"
      style={{ height: height > 0 ? `${height}px` : 'auto', minHeight: '2rem', overflow: 'hidden' }}
    />
  );
}

/* ── Add Email Modal ──────────────────────────────────── */
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
      const res = await fetchWithTimeout('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from_address: fromAddress, subject, body }),
        timeout: 30000,
      });
      const data = await res.json();
      if (data.success) onAdded();
      else setError(data.error);
    } catch {
      setError('Chyba pri ukladaní');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-[var(--bg-overlay)] backdrop-blur-[2px] flex items-center justify-center z-50 overlay-enter" onClick={onClose}>
      <div
        className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[var(--radius-xl)] p-6 w-full max-w-lg shadow-[var(--shadow-xl)] modal-enter"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">Pridať testovací email</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">Od (email)</label>
            <input
              type="email"
              value={fromAddress}
              onChange={(e) => setFromAddress(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-[var(--radius-md)] text-sm bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
              placeholder="odosielatel@priklad.sk"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">Predmet</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-[var(--radius-md)] text-sm bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
              placeholder="Predmet emailu"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">Telo správy</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-[var(--radius-md)] text-sm bg-[var(--bg-primary)] text-[var(--text-primary)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
              placeholder="Text emailu..."
              required
            />
          </div>
          {error && (
            <div className="text-sm text-[var(--danger-600)] bg-[var(--danger-50)] px-3 py-2 rounded-[var(--radius-md)]">{error}</div>
          )}
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="secondary" type="button" onClick={onClose}>Zrušiť</Button>
            <Button type="submit" loading={saving}>{saving ? 'AI spracovanie...' : 'Pridať email'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Response Time Badge ─────────────────────────────── */
function ResponseTimeBadge({ email }: { email: Email }) {
  const RESOLVED_STATUSES = ['sent', 'edited_sent', 'auto_sent'];

  if (RESOLVED_STATUSES.includes(email.reply_status) && email.reply_sent_at) {
    const minutes = Math.round(
      (new Date(email.reply_sent_at).getTime() - new Date(email.received_at).getTime()) / 60000
    );
    const display = minutes < 60
      ? `${minutes}min`
      : minutes < 1440
        ? `${Math.round(minutes / 60)}h`
        : `${Math.round(minutes / 1440)}d`;

    const color = minutes <= 60
      ? 'text-[var(--success-700)] bg-[var(--success-50)]'
      : minutes <= 240
        ? 'text-[var(--warning-700)] bg-[var(--warning-50)]'
        : minutes <= 1440
          ? 'text-amber-700 bg-amber-50'
          : 'text-[var(--danger-700)] bg-[var(--danger-50)]';

    return (
      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${color}`}>
        Odpoveď za {display}
      </span>
    );
  }

  if (email.reply_status === 'pending' && email.category !== 'SPAM') {
    const minutes = Math.round(
      (Date.now() - new Date(email.received_at).getTime()) / 60000
    );
    if (minutes < 30) return null;

    const display = minutes < 60
      ? `${minutes}min`
      : minutes < 1440
        ? `${Math.round(minutes / 60)}h`
        : `${Math.round(minutes / 1440)}d`;

    const color = minutes <= 60
      ? 'text-[var(--success-700)] bg-[var(--success-50)]'
      : minutes <= 240
        ? 'text-[var(--warning-700)] bg-[var(--warning-50)]'
        : 'text-[var(--danger-700)] bg-[var(--danger-50)]';

    return (
      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${color}`}>
        Čaká {display}
      </span>
    );
  }

  return null;
}

/* ── Thread View ─────────────────────────────────────── */
function ThreadView({ threadId, currentEmailId }: { threadId: string; currentEmailId: string }) {
  const [threadEmails, setThreadEmails] = useState<Email[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setThreadEmails([]);
    setExpanded(false);
  }, [threadId]);

  async function loadThread() {
    if (threadEmails.length > 0) {
      setExpanded(v => !v);
      return;
    }
    setLoading(true);
    try {
      const res = await fetchWithTimeout(`/api/emails/search?q=${encodeURIComponent(threadId)}&limit=20`);
      const data = await res.json();
      if (data.success) {
        const sorted = (data.data as Email[])
          .filter((e: Email) => e.gmail_thread_id === threadId && e.id !== currentEmailId)
          .sort((a: Email, b: Email) => new Date(a.received_at).getTime() - new Date(b.received_at).getTime());
        setThreadEmails(sorted);
        setExpanded(true);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  return (
    <div className="mt-6 mb-2">
      <button
        onClick={loadThread}
        className="flex items-center gap-2 text-xs text-[var(--primary-600)] hover:text-[var(--primary-700)] transition-colors"
      >
        <MessageSquare size={14} />
        {expanded ? 'Skryť vlákno' : 'Zobraziť vlákno'}
        {loading && <span className="text-[var(--text-tertiary)]">...</span>}
      </button>

      {expanded && threadEmails.length > 0 && (
        <div className="mt-3 space-y-3 border-l-2 border-[var(--border-primary)] pl-4">
          {threadEmails.map(email => (
            <div key={email.id} className="bg-[var(--bg-secondary)] rounded-[var(--radius-md)] p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-[var(--text-secondary)]">{email.from_address}</span>
                <span className="text-[10px] text-[var(--text-tertiary)] tabular-nums">
                  {new Date(email.received_at).toLocaleString('sk-SK')}
                </span>
              </div>
              <p className="text-xs text-[var(--text-primary)] whitespace-pre-wrap line-clamp-4">
                {email.body}
              </p>
            </div>
          ))}
        </div>
      )}

      {expanded && threadEmails.length === 0 && !loading && (
        <p className="mt-2 text-xs text-[var(--text-tertiary)]">Žiadne ďalšie správy vo vlákne</p>
      )}
    </div>
  );
}
