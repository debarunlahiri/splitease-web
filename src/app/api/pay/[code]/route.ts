import { NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/backend';

export const dynamic = 'force-dynamic';

/** Looks up a short pay link on the SplitEase backend (the browser never talks to it directly). */
export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!/^[A-Za-z0-9]{8,16}$/.test(code)) return NextResponse.json({ ok: false }, { status: 404 });
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/public/pay/${code}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
    if (response.status === 404) return NextResponse.json({ ok: false, reason: 'missing' }, { status: 404 });
    if (!response.ok) return NextResponse.json({ ok: false, reason: 'unavailable' }, { status: 502 });
    return NextResponse.json({ ok: true, payload: await response.json() });
  } catch {
    return NextResponse.json({ ok: false, reason: 'unavailable' }, { status: 502 });
  }
}
