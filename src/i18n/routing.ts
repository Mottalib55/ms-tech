import { defineRouting } from 'next-intl/routing';

export const LOCALES = ['fr', 'en', 'ar'] as const;
export type Locale = (typeof LOCALES)[number];

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: 'en',
  localePrefix: 'always',
  // A year rather than the browser session: the app and the site must remember the language chosen.
  localeCookie: { maxAge: 60 * 60 * 24 * 365 },
});

export const isRtl = (locale: string) => locale === 'ar';
