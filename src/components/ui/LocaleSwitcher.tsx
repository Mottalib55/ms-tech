'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { useTransition } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { LOCALES, type Locale } from '@/i18n/routing';
import { cn } from '@/lib/utils';

/** Each language is written in its own script, so anyone can find theirs. */
const NAMES: Record<Locale, string> = { fr: 'Français', en: 'English', ar: 'العربية' };

export default function LocaleSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const t = useTranslations('common');
  const pathname = usePathname();
  const router = useRouter();
  const { status } = useSession();
  const [pending, start] = useTransition();

  const change = (next: string) => {
    // Read at click time: useSearchParams would force every page using this into client rendering.
    const query = window.location.search;
    start(() => router.replace(`${pathname}${query}`, { locale: next as Locale }));
    // Remembered on the account: e-mails follow it, and so does the app on another device.
    if (status === 'authenticated') {
      fetch('/api/user/language', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ language: next }) }).catch(() => {});
    }
  };

  return (
    <select
      aria-label={t('language')}
      value={locale}
      disabled={pending}
      onChange={(e) => change(e.target.value)}
      className={cn('h-9 px-2 bg-transparent border border-line rounded-[10px] text-sm text-muted hover:text-ink focus:outline-none focus:ring-2 focus:ring-accent/40', className)}
    >
      {LOCALES.map((l) => <option key={l} value={l} lang={l}>{NAMES[l]}</option>)}
    </select>
  );
}
