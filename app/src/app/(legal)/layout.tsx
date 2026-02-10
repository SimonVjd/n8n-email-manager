import type { Metadata } from 'next';
import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  robots: 'index, follow',
};

const LEGAL_LINKS = [
  { href: '/privacy-policy', label: 'Ochrana údajov' },
  { href: '/terms', label: 'VOP' },
  { href: '/cookies', label: 'Cookies' },
  { href: '/reklamacia', label: 'Reklamácie' },
  { href: '/pricing', label: 'Cenník' },
];

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-secondary)]">
      {/* Header */}
      <header className="border-b border-[var(--border-primary)] bg-[var(--bg-primary)]">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 text-[var(--text-primary)] hover:text-[var(--primary-600)] transition-colors">
            <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--primary-600)] flex items-center justify-center">
              <Mail size={16} className="text-white" />
            </div>
            <span className="font-semibold tracking-tight">Email Manager</span>
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft size={14} />
            Späť do aplikácie
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-6 py-10">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border-primary)] bg-[var(--bg-primary)]">
        <div className="max-w-4xl mx-auto px-6 py-6 space-y-3">
          <nav className="flex flex-wrap gap-x-4 gap-y-1">
            {LEGAL_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs text-[var(--text-tertiary)] hover:text-[var(--primary-600)] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="text-[10px] text-[var(--text-tertiary)] space-y-0.5">
            <p>
              <span className="text-[var(--danger-600)] font-semibold">[DOPLNIŤ — Obchodné meno]</span> |
              IČO: <span className="text-[var(--danger-600)] font-semibold">[DOPLNIŤ]</span> |
              DIČ: <span className="text-[var(--danger-600)] font-semibold">[DOPLNIŤ]</span> |
              Sídlo: <span className="text-[var(--danger-600)] font-semibold">[DOPLNIŤ]</span>
            </p>
            <p>
              Dozorný orgán: Slovenská obchodná inšpekcia |{' '}
              ODR: <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="underline hover:text-[var(--primary-600)]">ec.europa.eu/consumers/odr</a>
            </p>
            <p>© {new Date().getFullYear()} <span className="text-[var(--danger-600)] font-semibold">[DOPLNIŤ]</span></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
