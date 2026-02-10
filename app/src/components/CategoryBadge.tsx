import type { ReactNode } from 'react';

const CATEGORY_ICONS: Record<string, ReactNode> = {
  URGENT: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1L11 10H1L6 1Z" fill="currentColor"/><rect x="5.25" y="4" width="1.5" height="3" rx=".75" fill="white"/><circle cx="6" cy="8.25" r=".75" fill="white"/></svg>
  ),
  TIME_SENSITIVE: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5"/><path d="M6 3.5V6L7.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  FAQ: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5"/><path d="M4.5 4.5a1.5 1.5 0 0 1 2.83.7c0 1-1.33 1-1.33 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><circle cx="6" cy="9" r=".6" fill="currentColor"/></svg>
  ),
  SPAM: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5"/><path d="M4 4L8 8M8 4L4 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
  ),
};

const CATEGORY_CONFIG = {
  URGENT: { label: 'Naliehavé', color: 'bg-red-100 text-red-700' },
  TIME_SENSITIVE: { label: 'Časovo citlivé', color: 'bg-orange-100 text-orange-700' },
  FAQ: { label: 'FAQ', color: 'bg-blue-100 text-blue-700' },
  NORMAL: { label: 'Bežný', color: 'bg-stone-100 text-stone-600' },
  SPAM: { label: 'Spam', color: 'bg-gray-100 text-gray-500' },
} as const;

export default function CategoryBadge({ category }: { category: string }) {
  const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG] ?? CATEGORY_CONFIG.NORMAL;
  const icon = CATEGORY_ICONS[category] || null;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {icon}
      {config.label}
    </span>
  );
}
