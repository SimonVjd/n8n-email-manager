'use client';

import { useRouter, usePathname } from 'next/navigation';

interface SidebarProps {
  userName: string;
  userRole: string;
}

const clientLinks = [
  { href: '/dashboard', label: 'Doručené', icon: '📥' },
  { href: '/dashboard/faq', label: 'FAQ', icon: '❓' },
  { href: '/dashboard/settings', label: 'Nastavenia', icon: '⚙️' },
];

const adminLinks = [
  { href: '/admin', label: 'Prehľad', icon: '📊' },
  { href: '/admin/clients', label: 'Klienti', icon: '👥' },
];

export default function Sidebar({ userName, userRole }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const links = userRole === 'admin' ? adminLinks : clientLinks;

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  }

  return (
    <aside className="w-56 h-screen bg-[var(--sidebar)] text-[var(--sidebar-text)] flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="font-semibold text-white text-sm">Email Manager</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <button
              key={link.href}
              onClick={() => router.push(link.href)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors
                ${isActive ? 'bg-white/10 text-white' : 'hover:bg-white/5'}`}
            >
              <span className="text-base">{link.icon}</span>
              {link.label}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center justify-between px-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{userName}</p>
            <p className="text-xs text-white/50">{userRole === 'admin' ? 'Administrátor' : 'Klient'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-white/50 hover:text-white transition-colors text-xs"
            title="Odhlásiť sa"
          >
            ↪
          </button>
        </div>
      </div>
    </aside>
  );
}
