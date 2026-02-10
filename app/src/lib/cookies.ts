export interface CookieConsent {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
  version: string;
}

const COOKIE_NAME = 'cookie_consent';
const COOKIE_VERSION = '1.0';
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 12 months in seconds

export function getCookieConsent(): CookieConsent | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1]));
  } catch {
    return null;
  }
}

export function setCookieConsent(consent: Omit<CookieConsent, 'timestamp' | 'version' | 'necessary'>) {
  const value: CookieConsent = {
    necessary: true,
    analytics: consent.analytics,
    marketing: consent.marketing,
    timestamp: new Date().toISOString(),
    version: COOKIE_VERSION,
  };
  const encoded = encodeURIComponent(JSON.stringify(value));
  document.cookie = `${COOKIE_NAME}=${encoded}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  return value;
}

export function hasCookieConsent(): boolean {
  return getCookieConsent() !== null;
}
