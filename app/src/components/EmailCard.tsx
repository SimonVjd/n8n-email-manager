'use client';

import type { Email } from '@/lib/types';
import { CategoryBadge } from '@/components/ui/Badge';
import { Check, CheckCircle2 } from 'lucide-react';

export type DensityMode = 'comfortable' | 'compact';

interface EmailCardProps {
  email: Email;
  onClick: () => void;
  selected: boolean;
  density?: DensityMode;
  checked?: boolean;
  onCheck?: (checked: boolean) => void;
  selectionMode?: boolean;
}

const RESOLVED = ['sent', 'edited_sent', 'auto_sent'];

const CATEGORY_DOT: Record<string, string> = {
  URGENT: 'bg-[var(--danger-500)]',
  TIME_SENSITIVE: 'bg-[var(--warning-500)]',
  FAQ: 'bg-[var(--info-500)]',
  NORMAL: 'bg-[var(--text-tertiary)]',
  SPAM: 'bg-[var(--text-tertiary)]',
};

export default function EmailCard({
  email,
  onClick,
  selected,
  density = 'comfortable',
  checked = false,
  onCheck,
  selectionMode = false,
}: EmailCardProps) {
  const date = new Date(email.received_at);
  const timeStr = date.toLocaleString('sk-SK', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  const isResolved = RESOLVED.includes(email.reply_status);

  if (density === 'compact') {
    return (
      <div className="flex items-center group relative">
        {/* Checkbox area */}
        {(selectionMode || checked) && (
          <div className="pl-2 pr-1 shrink-0">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onCheck?.(!checked); }}
              className={`w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center transition-all duration-150 cursor-pointer ${
                checked
                  ? 'bg-[var(--primary-500)] border-[var(--primary-500)] scale-105'
                  : 'border-[var(--text-tertiary)] hover:border-[var(--primary-400)] hover:bg-[var(--primary-50)]'
              }`}
            >
              {checked && <Check size={10} strokeWidth={3} className="text-white" />}
            </button>
          </div>
        )}

        <button
          onClick={onClick}
          className={`flex-1 flex items-center gap-3 px-3 py-2 text-left border-b border-[var(--border-primary)] transition-all duration-150 hover:bg-[var(--bg-hover)] min-w-0 ${
            selected ? 'bg-[var(--primary-50)] border-l-2 border-l-[var(--primary-500)]' : ''
          } ${!email.is_read ? 'font-medium border-l-2 border-l-[var(--primary-400)]' : ''}`}
        >
          {/* Category dot */}
          <span className={`w-2 h-2 rounded-full shrink-0 ${CATEGORY_DOT[email.category] || CATEGORY_DOT.NORMAL}`} />

          {/* Sender */}
          <span className="text-xs text-[var(--text-secondary)] truncate w-32 shrink-0">
            {email.from_address.split('@')[0]}
          </span>

          {/* Subject */}
          <span className="text-xs text-[var(--text-primary)] truncate flex-1">{email.subject}</span>

          {/* Meta */}
          <div className="flex items-center gap-1.5 shrink-0">
            {(email.thread_count ?? 0) > 1 && (
              <span className="text-[9px] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] px-1 rounded tabular-nums">
                {email.thread_count}
              </span>
            )}
            {isResolved && <CheckCircle2 size={12} className="text-[var(--success-600)]" />}
            <span className="text-[10px] text-[var(--text-tertiary)] tabular-nums whitespace-nowrap">{timeStr}</span>
          </div>
        </button>
      </div>
    );
  }

  // Comfortable (default)
  return (
    <div className="flex items-start group relative">
      {/* Checkbox on hover or in selection mode */}
      <div className={`pl-2 pr-1 pt-4 shrink-0 ${selectionMode || checked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-150`}>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onCheck?.(!checked); }}
          className={`w-[18px] h-[18px] rounded-full border-[1.5px] flex items-center justify-center transition-all duration-150 cursor-pointer ${
            checked
              ? 'bg-[var(--primary-500)] border-[var(--primary-500)] scale-110'
              : 'border-[var(--text-tertiary)] hover:border-[var(--primary-400)] hover:bg-[var(--primary-50)]'
          }`}
        >
          {checked && <Check size={11} strokeWidth={3} className="text-white" />}
        </button>
      </div>

      <button
        onClick={onClick}
        className={`flex-1 text-left p-4 border-b border-[var(--border-primary)] transition-all duration-150 hover:bg-[var(--bg-hover)] ${
          selected ? 'bg-[var(--primary-50)] border-l-2 border-l-[var(--primary-500)]' : ''
        } ${!email.is_read ? 'font-medium border-l-2 border-l-[var(--primary-400)]' : ''}`}
      >
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-sm text-[var(--text-primary)] break-all">{email.from_address}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {(email.thread_count ?? 0) > 1 && (
              <span className="text-[10px] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] px-1.5 py-0.5 rounded tabular-nums">
                {email.thread_count}
              </span>
            )}
            {isResolved && <CheckCircle2 size={14} className="text-[var(--success-600)]" />}
            <span className="text-xs text-[var(--text-tertiary)] whitespace-nowrap tabular-nums">{timeStr}</span>
          </div>
        </div>
        <div className="text-sm font-medium mb-1 text-[var(--text-primary)]">{email.subject}</div>
        {email.summary_sk && (
          <p className="text-xs text-[var(--text-tertiary)] mb-2">{email.summary_sk}</p>
        )}
        <CategoryBadge category={email.category} />
      </button>
    </div>
  );
}
