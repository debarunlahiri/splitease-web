import { NextResponse } from 'next/server';
import { ADMIN_COOKIE } from '@/lib/admin-server';

export async function POST() {
  const result = NextResponse.json({ ok: true });
  result.cookies.set(ADMIN_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  return result;
}
