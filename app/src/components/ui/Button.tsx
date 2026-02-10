'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  loading?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-[var(--primary-600)] text-white hover:bg-[var(--primary-700)] active:scale-[0.97] shadow-[var(--shadow-xs)] hover:shadow-[var(--shadow-sm)]',
  secondary:
    'border border-[var(--border-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] hover:border-[var(--border-secondary)] active:scale-[0.97]',
  ghost:
    'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] active:scale-[0.97]',
  danger:
    'bg-[var(--danger-600)] text-white hover:bg-[var(--danger-500)] active:scale-[0.97] shadow-[var(--shadow-xs)]',
};

const sizeStyles: Record<Size, string> = {
  sm: 'text-xs px-2.5 py-1.5 gap-1.5 rounded-[var(--radius-sm)]',
  md: 'text-sm px-3.5 py-2 gap-2 rounded-[var(--radius-md)]',
  lg: 'text-sm px-5 py-2.5 gap-2 rounded-[var(--radius-md)]',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', icon, loading, children, className = '', disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center font-medium transition-all duration-150
          disabled:opacity-50 disabled:pointer-events-none cursor-pointer
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-500)] focus-visible:ring-offset-2
          ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        style={{ transitionTimingFunction: 'var(--ease-out)' }}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-label="Načítava sa">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        ) : icon ? (
          <span className="shrink-0 flex items-center">{icon}</span>
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
