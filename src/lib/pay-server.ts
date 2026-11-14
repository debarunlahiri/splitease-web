import { BACKEND_URL } from '@/lib/backend';
import { decodePayload, encodeBase64Url, type PayPayload } from '@/lib/pay';

/** Loads a short pay link on the server (for link previews). Returns null when it is missing or the backend is down. */
export async function loadPayment(code: string): Promise<PayPayload | null> {
  if (!/^[A-Za-z0-9]{8,16}$/.test(code)) return null;
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/public/pay/${code}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(6_000),
    });
    if (!response.ok) return null;
    return decodePayload(encodeBase64Url(await response.json()));
  } catch {
    return null;
  }
}
