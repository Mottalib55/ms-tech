import { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import Logo from '@/components/layout/Logo';
import LocaleSwitcher from '@/components/ui/LocaleSwitcher';

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  const tn = useTranslations('nav');
  return (
    <main className="relative min-h-dvh flex items-center justify-center px-4 py-8 pt-[calc(4.5rem+env(safe-area-inset-top))]">
      <div className="absolute top-[calc(1rem+env(safe-area-inset-top))] end-4"><LocaleSwitcher /></div>
      <div className="w-full max-w-md">
        <div className="text-center mb-7">
          <Link href="/" aria-label={tn('homeLink')} className="inline-block mb-5"><Logo /></Link>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
          {subtitle && <p className="text-muted mt-2 text-sm">{subtitle}</p>}
        </div>
        <div className="bg-surface rounded-[16px] p-5 sm:p-6">{children}</div>
        {footer && <div className="text-center text-xs text-subtle mt-5 leading-relaxed">{footer}</div>}
      </div>
    </main>
  );
}

export function LegalNotice() {
  const t = useTranslations('auth');
  return (
    <>
      {t.rich('legalNotice', {
        terms: (c) => <Link href="/legal/terms" className="underline hover:text-ink">{c}</Link>,
        privacy: (c) => <Link href="/legal/privacy" className="underline hover:text-ink">{c}</Link>,
      })}
    </>
  );
}
