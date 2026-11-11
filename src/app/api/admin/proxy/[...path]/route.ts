import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ADMIN_API, ADMIN_COOKIE, ADMIN_HEADER } from '@/lib/admin-server';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ path: string[] }> };

async function forward(request: Request, { params }: Context): Promise<Response> {
  // Reads are harmless and the cookie is SameSite=Strict, so <img> and links can fetch files.
  // Anything that changes data must carry the custom header.
  if (request.method !== 'GET' && request.headers.get(ADMIN_HEADER) !== '1') {
    return NextResponse.json({ message: 'Bad request' }, { status: 400 });
  }
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return new NextResponse(null, { status: 401 });

  const { path } = await params;
  // Only plain path segments; no way to reach outside the admin API.
  if (!path.every((segment) => /^[A-Za-z0-9._-]+$/.test(segment) && segment !== '..')) {
    return NextResponse.json({ message: 'Bad request' }, { status: 400 });
  }

  const url = new URL(request.url);
  const target = `${ADMIN_API}/${path.join('/')}${url.search}`;
  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers: {
        authorization: `Bearer ${token}`,
        ...(hasBody ? { 'content-type': 'application/json' } : {}),
      },
      body: hasBody ? await request.text() : undefined,
      cache: 'no-store',
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    return NextResponse.json({ message: 'The server is unreachable.' }, { status: 502 });
  }

  if (upstream.status === 204 || upstream.status === 401) {
    return new NextResponse(null, { status: upstream.status });
  }
  const type = upstream.headers.get('content-type') ?? 'application/json';
  const headers: Record<string, string> = { 'content-type': type, 'cache-control': 'private, no-store' };
  for (const name of ['content-disposition', 'x-content-type-options', 'content-security-policy']) {
    const value = upstream.headers.get(name);
    if (value) headers[name] = value;
  }
  // Files (images, PDFs) pass through untouched; JSON is returned as text.
  const body = type.startsWith('application/json') ? await upstream.text() : await upstream.arrayBuffer();
  return new NextResponse(body, { status: upstream.status, headers });
}

export const GET = forward;
export const POST = forward;
export const PATCH = forward;
