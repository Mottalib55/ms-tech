import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

const intl = createMiddleware(routing);
const PREFIXED = /^\/(fr|en|ar)(\/.*)?$/;
const APP_AGENT = 'MSTechApp';

// Addresses without a language go through next-intl first (cookie, then the device's language).
// Signed-out visitors never see a flash of the dashboard; signed-in ones skip the login page,
// except demo visitors, who must be able to create a real account. The Apple apps have no
// marketing page: they open on the login screen. API routes answer 401 themselves.
export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const match = pathname.match(PREFIXED);
  if (!match) return intl(req);

  const [, locale, rest = '/'] = match;
  const isDashboard = rest === '/dashboard' || rest.startsWith('/dashboard/');
  const isEntry = rest === '/login' || rest === '/register';
  const isAppHome = rest === '/' && (req.headers.get('user-agent') ?? '').includes(APP_AGENT);

  if (isDashboard || isEntry || isAppHome) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (isDashboard && !token) {
      const url = new URL(`/${locale}/login`, req.url);
      url.searchParams.set('callbackUrl', pathname + search);
      return NextResponse.redirect(url);
    }
    if (isEntry && token && !token.isDemo) return NextResponse.redirect(new URL(`/${locale}/dashboard`, req.url));
    if (isAppHome) return NextResponse.redirect(new URL(`/${locale}/${token ? 'dashboard' : 'login'}`, req.url));
  }
  return intl(req);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|\\.well-known|icons|.*\\..*).*)'],
};
