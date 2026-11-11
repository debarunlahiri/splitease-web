/** The same shape the app and the backend use for invite tokens. */
export const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

/** Screens of the app that can be opened from the web. */
export type AppHost = 'join' | 'open' | 'friend';

function query(token?: string): string {
  return token ? `?token=${encodeURIComponent(token)}` : '';
}

/** Custom-scheme link, e.g. splitease://join?token=... */
export function customSchemeLink(host: AppHost, token?: string): string {
  return `splitease://${host}${query(token)}`;
}

/**
 * Android "intent" link that opens the app through its splitease:// scheme.
 *
 * It deliberately has no `package=` part. When an intent names a package that is not installed,
 * Chrome sends the visitor to the Play Store, where SplitEase is not listed. Without a package
 * there is nothing to look up, so a visitor without the app continues to `fallbackUrl`
 * (the Appverse page) instead.
 */
export function androidIntentLink(host: AppHost, fallbackUrl: string, token?: string): string {
  const fallback = `S.browser_fallback_url=${encodeURIComponent(fallbackUrl)};`;
  return `intent://${host}${query(token)}#Intent;scheme=splitease;${fallback}end`;
}
