import { NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/backend';

export const dynamic = 'force-dynamic';

/** A visitor tapped "I've paid" on a pay link: tell the backend so the payer can check and confirm. */
export async function POST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!/^[A-Za-z0-9]{8,16}$/.test(code)) return NextResponse.json({ ok: false }, { status: 404 });
  let body: { index?: unknown; amount?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const index = Number(body.index);
  if (!Number.isInteger(index) || index < 0 || index > 49) return NextResponse.json({ ok: false }, { status: 400 });
  const amount = typeof body.amount === 'string' && /^\d{1,12}(\.\d{1,2})?$/.test(body.amount) ? body.amount : null;
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/public/pay/${code}/claims`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ index, amount }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
    return NextResponse.json({ ok: response.ok }, { status: response.ok ? 200 : response.status === 400 ? 400 : 502 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}
