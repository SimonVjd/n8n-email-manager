'use client';

import Link from 'next/link';

const LEGAL_LINKS = [
  { href: '/privacy-policy', label: 'Ochrana údajov' },
  { href: '/terms', label: 'VOP' },
  { href: '/cookies', label: 'Cookies' },
  { href: '/reklamacia', label: 'Reklamácie' },
];

export default function Footer({ onOpenCookieSettings }: { onOpenCookieSettings?: () => void }) {
  return (
    <footer className="border-t border-[var(--border-primary)] bg-[var(--bg-primary)] px-4 py-3 shrink-0 z-10">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[var(--text-tertiary)]">
        {LEGAL_LINKS.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className="hover:text-[var(--primary-600)] transition-colors"
          >
            {link.label}
          </Link>
        ))}
        <span className="hidden sm:inline">|</span>
        <span>
          <span className="text-[var(--danger-600)] font-semibold">[DOPLNIŤ — Obchodné meno]</span> |
          IČO: <span className="text-[var(--danger-600)] font-semibold">[DOPLNIŤ]</span>
        </span>
        <span className="hidden sm:inline">|</span>
        <span>
          ODR:{' '}
          <a
            href="https://ec.europa.eu/consumers/odr/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-[var(--primary-600)]"
          >
            ec.europa.eu/consumers/odr
          </a>
        </span>
        {onOpenCookieSettings && (
          <>
            <span className="hidden sm:inline">|</span>
            <button
              onClick={onOpenCookieSettings}
              className="hover:text-[var(--primary-600)] transition-colors cursor-pointer"
            >
              Nastavenia cookies
            </button>
          </>
        )}
      </div>
    </footer>
  );
}
