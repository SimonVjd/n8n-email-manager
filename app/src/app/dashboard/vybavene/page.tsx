'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Email } from '@/lib/types';
import { fetchWithTimeout, FetchTimeoutError } from '@/lib/fetch-with-timeout';
import { CategoryBadge } from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  HelpCircle,
  Inbox,
  ShieldX,
  ChevronDown,
  RefreshCw,
  Send,
} from 'lucide-react';

interface CategoryOption {
  key: string;
  label: string;
  icon: React.ReactNode;
}

const CATEGORIES: CategoryOption[] = [
  { key: 'ALL', label: 'Všetky', icon: null },
  { key: 'URGENT', label: 'Naliehavé', icon: <AlertTriangle size={12} /> },
  { key: 'TIME_SENSITIVE', label: 'Časovo citlivé', icon: <Clock size={12} /> },
  { key: 'FAQ', label: 'FAQ', icon: <HelpCircle size={12} /> },
  { key: 'NORMAL', label: 'Bežný', icon: <Inbox size={12} /> },
  { key: 'SPAM', label: 'Spam', icon: <ShieldX size={12} /> },
];

const RESOLVED_STATUSES = ['sent', 'edited_sent', 'auto_sent'];

function ReplyStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    sent: { label: 'Odoslaná', className: 'bg-[var(--success-50)] text-[var(--success-600)]' },
    edited_sent: { label: 'Upravená', className: 'bg-[var(--info-50)] text-[var(--info-600)]' },
    auto_sent: { label: 'Automatická', className: 'bg-[var(--primary-50)] text-[var(--primary-600)]' },
  };
  const c = config[status] || { label: status, className: 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]' };
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${c.className}`}>
      {c.label}
    </span>
  );
}

export default function VybavenePage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selected, setSelected] = useState<Email | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchEmails = useCallback(async () => {
    try {
      setError(null);
      const res = await fetchWithTimeout('/api/emails');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) {
        setEmails(data.data.filter((e: Email) => RESOLVED_STATUSES.includes(e.reply_status)));
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

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCatDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filteredEmails = categoryFilter === 'ALL'
    ? emails
    : emails.filter(e => e.category === categoryFilter);

  return (
    <div className="flex h-full">
      {/* Email List */}
      <div className="w-96 border-r border-[var(--border-primary)] flex flex-col shrink-0">
        <div className="px-4 py-3 border-b border-[var(--border-primary)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-[var(--text-primary)]">Vybavené</h1>
              <span className="text-xs text-[var(--text-tertiary)]">{filteredEmails.length}</span>
            </div>
            {/* Category dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setCatDropdownOpen(v => !v)}
                className={`text-xs px-2.5 py-1.5 rounded-[var(--radius-md)] border transition-colors flex items-center gap-1.5 ${
                  categoryFilter !== 'ALL'
                    ? 'border-[var(--primary-500)] text-[var(--primary-600)] bg-[var(--primary-50)]'
                    : 'border-[var(--border-primary)] text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                {(() => {
                  const active = CATEGORIES.find(c => c.key === categoryFilter);
                  return active ? <>{active.icon && <span className="flex items-center">{active.icon}</span>}{active.label}</> : null;
                })()}
                <ChevronDown size={10} className={`transition-transform ${catDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {catDropdownOpen && (
                <div className="absolute top-full right-0 mt-1 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] py-1 z-50 min-w-[160px]">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.key}
                      onClick={() => { setCategoryFilter(cat.key); setCatDropdownOpen(false); }}
                      className={`w-full text-left text-xs px-3 py-2 flex items-center gap-2 transition-colors ${
                        categoryFilter === cat.key
                          ? 'bg-[var(--primary-50)] text-[var(--primary-700)] font-medium'
                          : 'text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                      }`}
                    >
                      <span className="w-4 flex items-center justify-center">{cat.icon || null}</span>
                      {cat.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="p-4 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="space-y-2 fade-in-up"
                  style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}
                >
                  <div className="flex justify-between">
                    <Skeleton width={140} height={14} />
                    <Skeleton width={60} height={12} />
                  </div>
                  <Skeleton width="80%" height={14} />
                  <div className="flex gap-1">
                    <Skeleton width={64} height={18} rounded="full" />
                    <Skeleton width={64} height={18} rounded="full" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <AlertTriangle size={28} className="mx-auto mb-3 text-[var(--text-tertiary)] opacity-30" />
              <p className="text-sm text-[var(--danger-600)] mb-3">{error}</p>
              <Button variant="ghost" size="sm" icon={<RefreshCw size={14} />} onClick={() => { setLoading(true); setError(null); fetchEmails(); }}>
                Skúsiť znova
              </Button>
            </div>
          ) : filteredEmails.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle2 size={28} className="mx-auto mb-3 text-[var(--text-tertiary)] opacity-30" />
              <p className="text-sm text-[var(--text-tertiary)] mb-2">
                {categoryFilter !== 'ALL' ? 'Žiadne vybavené emaily v tejto kategórii' : 'Žiadne vybavené emaily'}
              </p>
              {categoryFilter !== 'ALL' && (
                <Button variant="ghost" size="sm" onClick={() => setCategoryFilter('ALL')}>
                  Zobraziť všetky
                </Button>
              )}
            </div>
          ) : (
            filteredEmails.map((email) => (
              <button
                key={email.id}
                onClick={() => setSelected(email)}
                className={`w-full text-left p-4 border-b border-[var(--border-primary)] transition-colors hover:bg-[var(--bg-hover)]
                  ${selected?.id === email.id ? 'bg-[var(--primary-50)] border-l-2 border-l-[var(--primary-500)]' : ''}`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-sm text-[var(--text-secondary)] truncate flex-1">{email.from_address}</span>
                  <span className="text-xs text-[var(--text-tertiary)] whitespace-nowrap">
                    {new Date(email.received_at).toLocaleString('sk-SK', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="text-sm font-medium text-[var(--text-primary)] truncate mb-1">{email.subject}</div>
                {email.summary_sk && (
                  <p className="text-xs text-[var(--text-tertiary)] line-clamp-2 mb-2">{email.summary_sk}</p>
                )}
                <div className="flex items-center gap-1.5">
                  <CategoryBadge category={email.category} />
                  <ReplyStatusBadge status={email.reply_status} />
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Email Detail */}
      <div className="flex-1 overflow-auto">
        {selected ? (
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-1">{selected.subject}</h2>
                <p className="text-sm text-[var(--text-secondary)]">Od: {selected.from_address}</p>
                <p className="text-xs text-[var(--text-tertiary)]">
                  {new Date(selected.received_at).toLocaleString('sk-SK')}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4 shrink-0">
                <CategoryBadge category={selected.category} />
                <ReplyStatusBadge status={selected.reply_status} />
              </div>
            </div>

            {selected.summary_sk && (
              <div className="bg-[var(--primary-50)] rounded-[var(--radius-lg)] p-4 mb-6">
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

            {/* Sent Reply */}
            <div className="mt-6 bg-[var(--success-50)] border border-[var(--success-500)]/20 rounded-[var(--radius-lg)] p-4">
              <div className="flex items-center gap-2 mb-3">
                <Send size={14} className="text-[var(--success-600)]" />
                <p className="text-sm font-medium text-[var(--success-700)]">
                  Odpoveď odoslaná {selected.reply_sent_at ? new Date(selected.reply_sent_at).toLocaleString('sk-SK') : ''}
                  {selected.reply_status === 'auto_sent' && ' (automaticky)'}
                  {selected.reply_status === 'edited_sent' && ' (upravená)'}
                </p>
              </div>
              <div className="bg-[var(--bg-primary)] rounded-[var(--radius-md)] border border-[var(--success-500)]/20 p-3">
                <p className="text-sm leading-relaxed text-[var(--text-primary)] whitespace-pre-wrap">
                  {selected.reply_edited_text || selected.auto_reply_sk}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <CheckCircle2 size={36} className="mx-auto mb-3 text-[var(--text-tertiary)] opacity-20" />
              <p className="text-sm text-[var(--text-tertiary)]">Vyberte vybavený email na zobrazenie</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function HtmlEmailRenderer({ html }: { html: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const resize = () => {
      try {
        const doc = iframe.contentDocument;
        if (doc) {
          const h = doc.documentElement.scrollHeight;
          if (h > 0) setHeight(h);
        }
      } catch { /* cross-origin */ }
    };

    iframe.addEventListener('load', resize);
    const t1 = setTimeout(resize, 200);
    const t2 = setTimeout(resize, 1000);

    return () => {
      iframe.removeEventListener('load', resize);
      clearTimeout(t1);
      clearTimeout(t2);
    };
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
