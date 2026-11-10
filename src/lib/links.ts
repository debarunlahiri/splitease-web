import { ANDROID_PACKAGE } from './config';

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
 * Android "intent" link. Pass a fallback for an explicit tap that can offer installation.
 * An automatic attempt leaves the visitor on the landing page if the browser blocks it.
 */
export function androidIntentLink(host: AppHost, fallbackUrl?: string, token?: string): string {
  const fallback = fallbackUrl ? `S.browser_fallback_url=${encodeURIComponent(fallbackUrl)};` : '';
  return (
    `intent://${host}${query(token)}#Intent;scheme=splitease;package=${ANDROID_PACKAGE};` +
    `${fallback}end`
  );
}
