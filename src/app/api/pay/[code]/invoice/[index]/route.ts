import { NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/backend';

export const dynamic = 'force-dynamic';

/** Fetches the invoice for one person on a pay link from the SplitEase backend. */
export async function GET(_request: Request, { params }: { params: Promise<{ code: string; index: string }> }) {
  const { code, index } = await params;
  if (!/^[A-Za-z0-9]{8,16}$/.test(code) || !/^\d{1,2}$/.test(index)) return NextResponse.json({ ok: false }, { status: 404 });
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/public/pay/${code}/invoice/${index}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
    if (response.status === 404 || response.status === 400) return NextResponse.json({ ok: false }, { status: 404 });
    if (!response.ok) return NextResponse.json({ ok: false }, { status: 502 });
    return NextResponse.json({ ok: true, invoice: await response.json() });
  } catch {
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}
