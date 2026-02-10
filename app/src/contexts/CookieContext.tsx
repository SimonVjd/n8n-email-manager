'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface CookieContextValue {
  bannerOpen: boolean;
  openBanner: () => void;
  closeBanner: () => void;
}

const CookieContext = createContext<CookieContextValue>({
  bannerOpen: false,
  openBanner: () => {},
  closeBanner: () => {},
});

export function CookieProvider({ children }: { children: ReactNode }) {
  const [bannerOpen, setBannerOpen] = useState(false);

  const openBanner = useCallback(() => setBannerOpen(true), []);
  const closeBanner = useCallback(() => setBannerOpen(false), []);

  return (
    <CookieContext.Provider value={{ bannerOpen, openBanner, closeBanner }}>
      {children}
    </CookieContext.Provider>
  );
}

export function useCookieBanner() {
  return useContext(CookieContext);
}
