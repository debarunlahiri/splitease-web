export type Platform = 'android' | 'ios' | 'desktop';

/** Call in the browser only. */
export function detectPlatform(userAgent: string): Platform {
  if (/android/i.test(userAgent)) return 'android';
  if (/iphone|ipad|ipod/i.test(userAgent)) return 'ios';
  // iPadOS reports itself as a Mac but has a touch screen.
  if (/macintosh/i.test(userAgent) && navigator.maxTouchPoints > 1) return 'ios';
  return 'desktop';
}

/**
 * Browsers embedded in other apps (Facebook, Instagram, WhatsApp-style web views, ...) often
 * block links that open another app. The page then asks the user to open it in their browser.
 */
export function isInAppBrowser(userAgent: string): boolean {
  return /FBAN|FBAV|Instagram|Line\/|Twitter|Snapchat|MicroMessenger|; wv\)/i.test(userAgent);
}
