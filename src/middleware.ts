import { NextResponse, type NextRequest } from 'next/server';

// Sends visitors without a sign-in cookie to the admin login page. The backend still checks the
// token on every request, so this only avoids showing an empty dashboard.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === '/admin/login') return NextResponse.next();
  if (!request.cookies.get('se_admin')) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ['/admin/:path*'] };
