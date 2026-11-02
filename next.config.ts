import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { version } from './package.json';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join('; ');

// The Lean bank-link page is the only one that runs a provider's SDK in the browser.
const LEAN = 'https://*.leantech.me';
const LEAN_CSP = CSP
  .replace("script-src 'self' 'unsafe-inline'", `script-src 'self' 'unsafe-inline' ${LEAN}`)
  .replace("style-src 'self' 'unsafe-inline'", `style-src 'self' 'unsafe-inline' ${LEAN}`)
  .replace("img-src 'self' data:", `img-src 'self' data: ${LEAN}`)
  .replace("font-src 'self' data:", `font-src 'self' data: ${LEAN}`)
  .replace("connect-src 'self'", `connect-src 'self' ${LEAN}; frame-src ${LEAN}`);

const SECURITY_HEADERS = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Content-Security-Policy', value: CSP },
];

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_APP_VERSION: version },
  poweredByHeader: false,
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
  async headers() {
    return [
      { source: '/:path*', headers: SECURITY_HEADERS },
      // Financial answers must never sit in a shared or browser cache.
      { source: '/api/:path*', headers: [{ key: 'Cache-Control', value: 'no-store' }] },
      // Listed last: for the same header, the last matching rule wins.
      { source: '/api/webhooks/lean/link', headers: [{ key: 'Content-Security-Policy', value: LEAN_CSP }] },
    ];
  },
};

export default withNextIntl(nextConfig);
