interface KbdProps {
  children: string;
  className?: string;
}

export default function Kbd({ children, className = '' }: KbdProps) {
  return (
    <kbd
      className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5
        text-[10px] font-medium font-mono
        text-[var(--text-tertiary)] bg-[var(--bg-tertiary)] border border-[var(--border-primary)]
        rounded-[4px] leading-none ${className}`}
    >
      {children}
    </kbd>
  );
}
