'use client';

import { Brain } from 'lucide-react';

interface AIDisclaimerProps {
  /** Compact inline badge (for cards) */
  variant?: 'badge' | 'banner';
  text?: string;
}

export default function AIDisclaimer({ variant = 'badge', text }: AIDisclaimerProps) {
  if (variant === 'banner') {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary-50)] border border-[var(--primary-200)] rounded-[var(--radius-md)] text-[10px] text-[var(--primary-600)]">
        <Brain size={12} className="shrink-0" />
        <span>{text || 'Generované AI — vždy skontrolujte pred odoslaním'}</span>
      </div>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[var(--primary-50)] rounded text-[9px] font-medium text-[var(--primary-600)]">
      <Brain size={10} />
      {text || 'AI'}
    </span>
  );
}
