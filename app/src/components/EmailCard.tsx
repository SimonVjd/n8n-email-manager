'use client';

import type { Email } from '@/lib/types';
import CategoryBadge from './CategoryBadge';

interface EmailCardProps {
  email: Email;
  onClick: () => void;
  selected: boolean;
}

export default function EmailCard({ email, onClick, selected }: EmailCardProps) {
  const date = new Date(email.received_at);
  const timeStr = date.toLocaleString('sk-SK', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 border-b border-[var(--border)] transition-colors hover:bg-stone-50
        ${selected ? 'bg-[var(--accent-light)] border-l-2 border-l-[var(--accent)]' : ''}
        ${!email.is_read ? 'font-medium' : ''}`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="text-sm truncate flex-1">{email.from_address}</span>
        <span className="text-xs text-[var(--muted)] whitespace-nowrap">{timeStr}</span>
      </div>
      <div className="text-sm font-medium truncate mb-1">{email.subject}</div>
      {email.summary_sk && (
        <p className="text-xs text-[var(--muted)] line-clamp-2 mb-2">{email.summary_sk}</p>
      )}
      <CategoryBadge category={email.category} />
    </button>
  );
}
