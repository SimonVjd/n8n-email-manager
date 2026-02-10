import { type ReactNode } from 'react';
import {
  AlertTriangle,
  Clock,
  HelpCircle,
  Mail,
  ShieldX,
} from 'lucide-react';

type BadgeVariant = 'urgent' | 'time_sensitive' | 'faq' | 'normal' | 'spam' | 'success' | 'warning' | 'info';

interface BadgeProps {
  variant: BadgeVariant;
  children: ReactNode;
  icon?: boolean;
  className?: string;
}

const config: Record<BadgeVariant, { bg: string; text: string; icon?: ReactNode }> = {
  urgent: {
    bg: 'bg-[var(--danger-50)]',
    text: 'text-[var(--danger-600)]',
    icon: <AlertTriangle size={12} />,
  },
  time_sensitive: {
    bg: 'bg-[var(--warning-50)]',
    text: 'text-[var(--warning-600)]',
    icon: <Clock size={12} />,
  },
  faq: {
    bg: 'bg-[var(--info-50)]',
    text: 'text-[var(--info-600)]',
    icon: <HelpCircle size={12} />,
  },
  normal: {
    bg: 'bg-[var(--bg-tertiary)]',
    text: 'text-[var(--text-secondary)]',
    icon: <Mail size={12} />,
  },
  spam: {
    bg: 'bg-[var(--bg-tertiary)]',
    text: 'text-[var(--text-tertiary)]',
    icon: <ShieldX size={12} />,
  },
  success: {
    bg: 'bg-[var(--success-50)]',
    text: 'text-[var(--success-600)]',
  },
  warning: {
    bg: 'bg-[var(--warning-50)]',
    text: 'text-[var(--warning-600)]',
  },
  info: {
    bg: 'bg-[var(--info-50)]',
    text: 'text-[var(--info-600)]',
  },
};

const CATEGORY_MAP: Record<string, BadgeVariant> = {
  URGENT: 'urgent',
  TIME_SENSITIVE: 'time_sensitive',
  FAQ: 'faq',
  NORMAL: 'normal',
  SPAM: 'spam',
};

const CATEGORY_LABEL: Record<string, string> = {
  URGENT: 'Naliehavé',
  TIME_SENSITIVE: 'Časovo citlivé',
  FAQ: 'FAQ',
  NORMAL: 'Bežný',
  SPAM: 'Spam',
};

export default function Badge({ variant, children, icon = true, className = '' }: BadgeProps) {
  const c = config[variant] ?? config.normal;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text} ${className}`}>
      {icon && c.icon}
      {children}
    </span>
  );
}

/** Drop-in replacement for old CategoryBadge */
export function CategoryBadge({ category, className }: { category: string; className?: string }) {
  const variant = CATEGORY_MAP[category] ?? 'normal';
  const label = CATEGORY_LABEL[category] ?? category;
  return <Badge variant={variant} className={className}>{label}</Badge>;
}
