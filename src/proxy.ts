import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Signed-out visitors never see a flash of the dashboard, and signed-in ones
// skip the login page, except demo visitors, who must be able to create a real account.
// API routes answer 401 themselves (the app reads that).
export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (pathname.startsWith('/dashboard') && !token) {
    const url = new URL('/login', req.url);
    url.searchParams.set('callbackUrl', pathname + search);
    return NextResponse.redirect(url);
  }
  if ((pathname === '/login' || pathname === '/register') && token && !token.isDemo) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};
