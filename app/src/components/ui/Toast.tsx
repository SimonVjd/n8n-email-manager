'use client';

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import { X, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type?: ToastType;
  undoAction?: () => void;
  duration?: number;
}

interface ToastContextType {
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  toast: {
    success: (message: string, opts?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) => void;
    error: (message: string, opts?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) => void;
    warning: (message: string, opts?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) => void;
    info: (message: string, opts?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) => void;
  };
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const MAX_VISIBLE = 3;

function calcDuration(message: string): number {
  const words = message.split(/\s+/).length;
  return Math.max(3000, words * 500 + 1000);
}

const typeConfig: Record<ToastType, { icon: typeof CheckCircle2; border: string; iconColor: string }> = {
  success: { icon: CheckCircle2, border: 'border-l-[var(--success-500)]', iconColor: 'text-[var(--success-500)]' },
  error: { icon: XCircle, border: 'border-l-[var(--danger-500)]', iconColor: 'text-[var(--danger-500)]' },
  warning: { icon: AlertTriangle, border: 'border-l-[var(--warning-500)]', iconColor: 'text-[var(--warning-500)]' },
  info: { icon: Info, border: 'border-l-[var(--primary-500)]', iconColor: 'text-[var(--primary-500)]' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<(Toast & { exiting?: boolean })[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 200);
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => {
      const next = [...prev, { ...toast, id }];
      // Remove oldest if exceeding max
      if (next.length > MAX_VISIBLE) {
        return next.slice(next.length - MAX_VISIBLE);
      }
      return next;
    });
    const duration = toast.duration ?? calcDuration(toast.message);
    setTimeout(() => removeToast(id), duration);
  }, [removeToast]);

  const toast = useMemo(() => ({
    success: (message: string, opts?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) =>
      addToast({ message, type: 'success', ...opts }),
    error: (message: string, opts?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) =>
      addToast({ message, type: 'error', ...opts }),
    warning: (message: string, opts?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) =>
      addToast({ message, type: 'warning', ...opts }),
    info: (message: string, opts?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) =>
      addToast({ message, type: 'info', ...opts }),
  }), [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, toast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed top-4 right-4 z-[100] flex flex-col gap-2 items-end pointer-events-none"
      >
        {toasts.map((t) => {
          const cfg = typeConfig[t.type ?? 'info'];
          const Icon = cfg.icon;
          return (
            <div
              key={t.id}
              role="alert"
              className={`pointer-events-auto flex items-center gap-2.5 pl-0 pr-3 py-2.5
                bg-[var(--bg-primary)] border-l-[3px] ${cfg.border}
                rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)]
                text-sm text-[var(--text-primary)] max-w-sm
                ${t.exiting ? 'toast-exit' : 'toast-enter'}`}
            >
              <div className={`pl-3 ${cfg.iconColor} flex-shrink-0`}>
                <Icon size={16} />
              </div>
              <span className="flex-1 leading-snug">{t.message}</span>
              {t.undoAction && (
                <button
                  onClick={() => { t.undoAction!(); removeToast(t.id); }}
                  className="text-[var(--primary-600)] font-medium hover:text-[var(--primary-700)] text-xs whitespace-nowrap"
                >
                  Vrátiť
                </button>
              )}
              <button
                onClick={() => removeToast(t.id)}
                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors flex-shrink-0"
                aria-label="Zavrieť"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
