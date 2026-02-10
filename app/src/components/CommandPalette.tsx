'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Email } from '@/lib/types';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';
import { CategoryBadge } from '@/components/ui/Badge';
import Kbd from '@/components/ui/Kbd';
import { useTheme, type Theme } from '@/hooks/useTheme';
import {
  Search,
  Mail,
  Clock,
  AlertTriangle,
  HelpCircle,
  Inbox,
  ShieldX,
  ArrowRight,
  Loader2,
  Moon,
  Sun,
  Monitor,
} from 'lucide-react';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onSelectEmail: (emailId: string) => void;
}

const FILTER_ACTIONS = [
  { key: 'urgent', label: 'Zobraziť naliehavé', icon: <AlertTriangle size={14} />, filter: 'URGENT', hint: 'naliehavé' },
  { key: 'time', label: 'Zobraziť časovo citlivé', icon: <Clock size={14} />, filter: 'TIME_SENSITIVE', hint: 'časové' },
  { key: 'faq', label: 'Zobraziť FAQ', icon: <HelpCircle size={14} />, filter: 'FAQ', hint: 'faq' },
  { key: 'normal', label: 'Zobraziť bežné', icon: <Inbox size={14} />, filter: 'NORMAL', hint: 'bežné' },
  { key: 'spam', label: 'Zobraziť spam', icon: <ShieldX size={14} />, filter: 'SPAM', hint: 'spam' },
];

const THEME_LABELS: Record<Theme, { label: string; icon: typeof Sun }> = {
  light: { label: 'Svetlý režim', icon: Sun },
  dark: { label: 'Tmavý režim', icon: Moon },
  system: { label: 'Systémový režim', icon: Monitor },
};

export default function CommandPalette({ open, onClose, onSelectEmail }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Email[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mode, setMode] = useState<'actions' | 'search'>('actions');
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const { theme, setTheme } = useTheme();

  // Build quick actions with theme toggle
  const themeActions = (['light', 'dark', 'system'] as Theme[])
    .filter(t => t !== theme)
    .map(t => {
      const cfg = THEME_LABELS[t];
      const Icon = cfg.icon;
      return {
        key: `theme-${t}`,
        label: cfg.label,
        icon: <Icon size={14} />,
        action: () => setTheme(t),
      };
    });

  const allActions = [
    ...FILTER_ACTIONS.map(a => ({ ...a, action: undefined as (() => void) | undefined })),
    ...themeActions.map(a => ({ ...a, filter: undefined as string | undefined })),
  ];

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setActiveIndex(0);
      setMode('actions');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Debounced search
  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setMode('actions');
      setLoading(false);
      return;
    }

    setLoading(true);
    setMode('search');
    setActiveIndex(0);
    try {
      const res = await fetchWithTimeout(`/api/emails/search?q=${encodeURIComponent(q)}&limit=10`);
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json();
      if (data.success) {
        setResults(data.data);
        setActiveIndex(0);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  // Handle input change
  function handleInputChange(value: string) {
    setQuery(value);
    clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setResults([]);
      setMode('actions');
      setActiveIndex(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => doSearch(value.trim()), 250);
  }

  // Total items count for keyboard navigation
  const totalItems = mode === 'actions' ? allActions.length : results.length;

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(i => (i + 1) % Math.max(totalItems, 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(i => (i - 1 + Math.max(totalItems, 1)) % Math.max(totalItems, 1));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (mode === 'actions' && allActions[activeIndex]) {
          const act = allActions[activeIndex];
          if (act.action) {
            act.action();
            onClose();
          } else if (act.filter) {
            handleInputChange(act.filter);
            doSearch(act.filter);
          }
        } else if (mode === 'search' && results[activeIndex]) {
          onSelectEmail(results[activeIndex].id);
          onClose();
        }
        return;
      }
    }

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose, onSelectEmail, mode, results, activeIndex, totalItems, allActions, doSearch]);

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const active = listRef.current.querySelector('[data-active="true"]');
    active?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[120px] overlay-enter"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Palette */}
      <div
        className="relative w-full max-w-[560px] bg-[var(--bg-primary)] rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)] border border-[var(--border-primary)] overflow-hidden modal-enter"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-primary)]">
          <Search size={18} className="text-[var(--text-tertiary)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => handleInputChange(e.target.value)}
            placeholder="Hľadať emaily, akcie..."
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none"
            autoComplete="off"
          />
          {loading && <Loader2 size={16} className="text-[var(--primary-500)] animate-spin shrink-0" />}
          <Kbd>Esc</Kbd>
        </div>

        {/* Results / Actions */}
        <div ref={listRef} className="max-h-[400px] overflow-auto">
          {mode === 'actions' ? (
            <div className="px-3 py-2">
              {/* Filter actions */}
              <p className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider px-1 mb-1">
                Filtrovať
              </p>
              {FILTER_ACTIONS.map((action, i) => (
                <button
                  key={action.key}
                  data-active={activeIndex === i}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-sm transition-colors ${
                    activeIndex === i
                      ? 'bg-[var(--primary-50)] text-[var(--primary-700)]'
                      : 'text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                  }`}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => {
                    handleInputChange(action.filter);
                    doSearch(action.filter);
                  }}
                >
                  <span className="text-[var(--text-tertiary)]">{action.icon}</span>
                  <span className="flex-1 text-left">{action.label}</span>
                  <ArrowRight size={12} className="text-[var(--text-tertiary)]" />
                </button>
              ))}

              {/* Theme actions */}
              <p className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider px-1 mb-1 mt-3">
                Vzhľad
              </p>
              {themeActions.map((action, i) => {
                const idx = FILTER_ACTIONS.length + i;
                return (
                  <button
                    key={action.key}
                    data-active={activeIndex === idx}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-sm transition-colors ${
                      activeIndex === idx
                        ? 'bg-[var(--primary-50)] text-[var(--primary-700)]'
                        : 'text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                    }`}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => { action.action(); onClose(); }}
                  >
                    <span className="text-[var(--text-tertiary)]">{action.icon}</span>
                    <span className="flex-1 text-left">{action.label}</span>
                  </button>
                );
              })}
            </div>
          ) : results.length === 0 && !loading ? (
            <div className="py-12 text-center">
              <Mail size={28} className="mx-auto mb-2 text-[var(--text-tertiary)] opacity-40" />
              <p className="text-sm text-[var(--text-tertiary)]">Žiadne výsledky pre &ldquo;{query}&rdquo;</p>
            </div>
          ) : (
            <div className="py-1 px-2">
              <p className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider px-2 py-1.5">
                Emaily ({results.length})
              </p>
              {results.map((email, i) => (
                <button
                  key={email.id}
                  data-active={activeIndex === i}
                  className={`w-full text-left px-3 py-2.5 rounded-[var(--radius-md)] transition-colors ${
                    activeIndex === i
                      ? 'bg-[var(--primary-50)]'
                      : 'hover:bg-[var(--bg-hover)]'
                  }`}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => { onSelectEmail(email.id); onClose(); }}
                >
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-xs text-[var(--text-secondary)] truncate">{email.from_address}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <CategoryBadge category={email.category} />
                      <span className="text-[10px] text-[var(--text-tertiary)] tabular-nums">
                        {new Date(email.received_at).toLocaleDateString('sk-SK')}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">{email.subject}</p>
                  {email.summary_sk && (
                    <p className="text-xs text-[var(--text-tertiary)] truncate mt-0.5">{email.summary_sk}</p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer hints */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-[var(--border-secondary)] bg-[var(--bg-secondary)]">
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-tertiary)]">
            <Kbd>↑</Kbd><Kbd>↓</Kbd> navigácia
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-tertiary)]">
            <Kbd>Enter</Kbd> otvoriť
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-tertiary)]">
            <Kbd>Esc</Kbd> zavrieť
          </div>
        </div>
      </div>
    </div>
  );
}
