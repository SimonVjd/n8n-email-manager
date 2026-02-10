'use client';

import { useEffect, useRef } from 'react';

interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  action: () => void;
  /** Disable when focus is inside an input/textarea */
  ignoreInput?: boolean;
}

export function useKeyboardShortcuts(shortcuts: Shortcut[], enabled = true) {
  const shortcutsRef = useRef(shortcuts);
  const enabledRef = useRef(enabled);
  shortcutsRef.current = shortcuts;
  enabledRef.current = enabled;

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (!enabledRef.current) return;

      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      for (const s of shortcutsRef.current) {
        if (s.ignoreInput !== false && isInput) continue;
        if (e.key.toLowerCase() !== s.key.toLowerCase()) continue;
        if (!!s.ctrl !== (e.ctrlKey || e.metaKey)) continue;
        if (!!s.shift !== e.shiftKey) continue;

        e.preventDefault();
        s.action();
        return;
      }
    }

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []); // stable — reads from refs
}
