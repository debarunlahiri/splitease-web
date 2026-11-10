import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const API_URL = (process.env.API_URL ?? 'http://localhost:9890').replace(/\/+$/, '');

/**
 * Passes an email-verification token to the SplitEase backend. The browser calls this route
 * instead of the backend, so the backend needs no cross-origin settings.
 */
export async function POST(request: Request) {
  let token: unknown;
  try {
    token = ((await request.json()) as { token?: unknown }).token;
  } catch {
    return NextResponse.json({ ok: false, reason: 'invalid' }, { status: 400 });
  }
  if (typeof token !== 'string' || token.length < 10 || token.length > 200) {
    return NextResponse.json({ ok: false, reason: 'invalid' }, { status: 400 });
  }

  try {
    const response = await fetch(`${API_URL}/api/v1/auth/verify-email`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
    if (response.ok) return NextResponse.json({ ok: true });
    // 400 and 401 both mean the token cannot be used (wrong, expired or already used).
    if (response.status === 400 || response.status === 401) {
      return NextResponse.json({ ok: false, reason: 'invalid' }, { status: 200 });
    }
    return NextResponse.json({ ok: false, reason: 'unavailable' }, { status: 502 });
  } catch {
    return NextResponse.json({ ok: false, reason: 'unavailable' }, { status: 502 });
  }
}
