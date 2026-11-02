'use client';

import { setFormatLocale } from '@/lib/utils';

/** Keeps the number and date formatters on the page's language. Rendered before anything that formats. */
export default function LocaleSync({ locale }: { locale: string }) {
  setFormatLocale(locale);
  return null;
}
