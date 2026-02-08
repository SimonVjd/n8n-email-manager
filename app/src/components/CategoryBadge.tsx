const CATEGORY_CONFIG = {
  URGENT: { label: 'Naliehavé', color: 'bg-red-100 text-red-700', icon: '🔴' },
  TIME_SENSITIVE: { label: 'Časovo citlivé', color: 'bg-orange-100 text-orange-700', icon: '🟠' },
  FAQ: { label: 'FAQ', color: 'bg-blue-100 text-blue-700', icon: '🔵' },
  NORMAL: { label: 'Bežný', color: 'bg-stone-100 text-stone-600', icon: '' },
  SPAM: { label: 'Spam', color: 'bg-gray-100 text-gray-500', icon: '⛔' },
} as const;

export default function CategoryBadge({ category }: { category: string }) {
  const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG] ?? CATEGORY_CONFIG.NORMAL;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.icon && <span className="text-[10px]">{config.icon}</span>}
      {config.label}
    </span>
  );
}
