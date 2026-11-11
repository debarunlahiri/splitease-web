import { NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/backend';
import { TOKEN_PATTERN } from '@/lib/links';

const API_URL = BACKEND_URL;

export async function POST(request: Request) {
  let body: { email?: unknown; token?: unknown } | null;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { email, token } = body ?? {};
  const confirming = typeof token === 'string' && TOKEN_PATTERN.test(token);
  const subscribing = typeof email === 'string' && email.length <= 320 && token === undefined;
  if (!confirming && !subscribing) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    const response = await fetch(
      `${API_URL}/api/v1/ios-updates/${confirming ? 'confirm' : 'subscribe'}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(confirming ? { token } : { email }),
        cache: 'no-store',
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (response.ok) return new NextResponse(null, { status: 204 });
    const status = [400, 429].includes(response.status) ? response.status : 502;
    return NextResponse.json({ ok: false }, { status });
  } catch {
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}
