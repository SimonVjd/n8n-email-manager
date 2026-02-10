'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, type ReactNode } from 'react';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import Button from '@/components/ui/Button';
import {
  Inbox,
  CheckCircle2,
  HelpCircle,
  Settings,
  BarChart3,
  Users,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Mail,
  Search,
} from 'lucide-react';

interface SidebarProps {
  userName: string;
  userRole: string;
}

interface NavLink {
  href: string;
  label: string;
  icon: ReactNode;
  badge?: number;
}

export default function Sidebar({ userName, userRole }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useLocalStorage('sidebar-collapsed', false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Ctrl+\ to toggle sidebar
  useKeyboardShortcuts([
    {
      key: '\\',
      ctrl: true,
      action: () => setCollapsed((c: boolean) => !c),
      ignoreInput: true,
    },
  ]);

  // Fetch unread count (inbox only — exclude resolved emails)
  useEffect(() => {
    const RESOLVED = ['sent', 'edited_sent', 'auto_sent'];
    async function fetchUnread() {
      try {
        const res = await fetchWithTimeout('/api/emails', { timeout: 5000 });
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setUnreadCount(
            data.data.filter((e: { is_read: boolean; reply_status: string; category: string }) =>
              !e.is_read && !RESOLVED.includes(e.reply_status) && e.category !== 'SPAM'
            ).length
          );
        }
      } catch { /* silent */ }
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    // Listen for instant updates from dashboard
    const onRead = () => setUnreadCount(c => Math.max(0, c - 1));
    window.addEventListener('email-read', onRead);
    return () => { clearInterval(interval); window.removeEventListener('email-read', onRead); };
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetchWithTimeout('/api/auth/logout', { method: 'POST', timeout: 5000 });
    } catch {
      document.cookie = 'session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
    } finally {
      window.location.href = '/';
    }
  }

  const clientLinks: NavLink[] = [
    { href: '/dashboard', label: 'Doručené', icon: <Inbox size={18} />, badge: unreadCount },
    { href: '/dashboard/vybavene', label: 'Vybavené', icon: <CheckCircle2 size={18} /> },
    { href: '/dashboard/faq', label: 'FAQ', icon: <HelpCircle size={18} /> },
    { href: '/dashboard/stats', label: 'Štatistiky', icon: <BarChart3 size={18} /> },
  ];

  const adminLinks: NavLink[] = [
    { href: '/admin', label: 'Prehľad', icon: <BarChart3 size={18} /> },
    { href: '/admin/clients', label: 'Klienti', icon: <Users size={18} /> },
  ];

  const links = userRole === 'admin' ? adminLinks : clientLinks;

  return (
    <>
      {/* Logout confirm modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-[var(--bg-overlay)] backdrop-blur-[2px] flex items-center justify-center z-50 overlay-enter">
          <div className="bg-[var(--bg-primary)] rounded-[var(--radius-xl)] p-6 w-full max-w-xs shadow-[var(--shadow-xl)] modal-enter">
            <p className="font-semibold mb-1 text-[var(--text-primary)]">Odhlásiť sa?</p>
            <p className="text-sm text-[var(--text-tertiary)] mb-5">Naozaj sa chcete odhlásiť z účtu?</p>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" size="sm" onClick={() => setShowLogoutConfirm(false)}>
                Zrušiť
              </Button>
              <Button variant="danger" size="sm" onClick={handleLogout} loading={loggingOut}>
                {loggingOut ? 'Odhlasujem...' : 'Odhlásiť'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <aside
        className={`h-screen flex flex-col shrink-0 bg-[var(--bg-sidebar)] border-r border-[var(--border-sidebar)] transition-[width] duration-200 ease-in-out ${
          collapsed ? 'w-16' : 'w-56'
        }`}
      >
        {/* Logo + collapse toggle */}
        <div className={`flex items-center border-b border-[var(--border-sidebar)] h-14 ${collapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
          {!collapsed && (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--primary-500)] flex items-center justify-center shrink-0">
                <Mail size={16} className="text-white" />
              </div>
              <span className="font-semibold text-sm text-[var(--text-primary)] truncate">Email Manager</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed((c: boolean) => !c)}
            className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
            title={collapsed ? 'Rozbaliť (Ctrl+\\)' : 'Zbaliť (Ctrl+\\)'}
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        {/* Search shortcut hint */}
        {!collapsed && (
          <div className="px-3 pt-3 pb-1">
            <button
              onClick={() => {
                document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-md)] border border-[var(--border-primary)] text-[var(--text-tertiary)] text-xs hover:bg-[var(--bg-hover)] transition-colors"
            >
              <Search size={13} />
              <span className="flex-1 text-left">Hľadať...</span>
              <kbd className="text-[10px] font-mono bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] px-1.5 py-0.5 rounded">Ctrl+K</kbd>
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2.5 rounded-[var(--radius-md)] text-sm transition-all duration-150 relative ${
                  collapsed ? 'justify-center p-2.5' : 'px-3 py-2'
                } ${
                  isActive
                    ? 'bg-[var(--primary-50)] text-[var(--primary-700)] font-medium'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                }`}
                title={collapsed ? link.label : undefined}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-[var(--primary-500)]" />
                )}
                <span className="w-[18px] h-[18px] flex items-center justify-center shrink-0">{link.icon}</span>
                {!collapsed && <span className="flex-1 truncate">{link.label}</span>}
                {link.badge && link.badge > 0 ? (
                  <span className={`text-[10px] font-medium bg-[var(--primary-500)] text-white rounded-full tabular-nums ${
                    collapsed ? 'absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center text-[8px]' : 'px-1.5 py-0.5'
                  }`}>
                    {link.badge > 99 ? '99+' : link.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        {/* Settings + User */}
        <div className="border-t border-[var(--border-sidebar)] px-2 py-3 space-y-1">
          {userRole !== 'admin' && (
            <Link
              href="/dashboard/settings"
              className={`flex items-center gap-2.5 rounded-[var(--radius-md)] text-sm transition-all duration-150 relative ${
                collapsed ? 'justify-center p-2.5' : 'px-3 py-2'
              } ${
                pathname === '/dashboard/settings'
                  ? 'bg-[var(--primary-50)] text-[var(--primary-700)] font-medium'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
              }`}
              title={collapsed ? 'Nastavenia' : undefined}
            >
              {pathname === '/dashboard/settings' && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-[var(--primary-500)]" />
              )}
              <span className="w-[18px] h-[18px] flex items-center justify-center shrink-0"><Settings size={18} /></span>
              {!collapsed && <span>Nastavenia</span>}
            </Link>
          )}

          {/* User info + logout */}
          <div className={`flex items-center rounded-[var(--radius-md)] ${collapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'}`}>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">{userName}</p>
                <p className="text-[10px] text-[var(--text-tertiary)]">{userRole === 'admin' ? 'Administrátor' : 'Klient'}</p>
              </div>
            )}
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--danger-600)] transition-colors"
              title="Odhlásiť sa"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
