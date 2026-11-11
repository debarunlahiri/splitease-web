import { NextResponse } from 'next/server';
import { ADMIN_API, ADMIN_COOKIE, ADMIN_HEADER } from '@/lib/admin-server';

export const dynamic = 'force-dynamic';

/** Signs an admin in. The access token is kept in an httpOnly cookie, never exposed to scripts. */
export async function POST(request: Request) {
  if (request.headers.get(ADMIN_HEADER) !== '1') {
    return NextResponse.json({ message: 'Bad request' }, { status: 400 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Bad request' }, { status: 400 });
  }

  let response: Response;
  try {
    response = await fetch(`${ADMIN_API}/auth/login`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': request.headers.get('x-forwarded-for') ?? '',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    return NextResponse.json({ message: 'The server is unreachable.' }, { status: 502 });
  }

  if (!response.ok) {
    const message =
      response.status === 401
        ? 'Invalid email or password.'
        : response.status === 429
          ? 'Too many attempts. Try again in a few minutes.'
          : response.status === 503
            ? 'The admin API is not configured on the server.'
            : 'Could not sign in.';
    return NextResponse.json({ message }, { status: response.status === 401 ? 401 : response.status });
  }

  const data = (await response.json()) as {
    accessToken: string;
    expiresAt: string;
    admin: { email: string; displayName: string };
  };
  const maxAge = Math.max(60, Math.floor((new Date(data.expiresAt).getTime() - Date.now()) / 1000));
  const result = NextResponse.json({ admin: data.admin });
  result.cookies.set(ADMIN_COOKIE, data.accessToken, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  });
  return result;
}
