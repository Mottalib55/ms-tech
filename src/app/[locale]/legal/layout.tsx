import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import Footer from '@/components/layout/Footer';
import Logo from '@/components/layout/Logo';

export default async function LegalLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'legal' });
  const tn = await getTranslations({ locale, namespace: 'nav' });
  return (
    <div className="min-h-dvh flex flex-col">
      <header className="pt-[env(safe-area-inset-top)]">
        <div className="max-w-3xl mx-auto h-16 px-4 flex items-center justify-between">
          <Link href="/" aria-label={tn('homeLink')}><Logo size="sm" /></Link>
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 min-h-9 text-sm text-muted hover:text-ink"><ArrowLeft size={15} className="rtl:-scale-x-100" />{t('back')}</Link>
        </div>
      </header>
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 text-muted text-[15px] leading-relaxed space-y-4 [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-ink [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-ink [&_h2]:pt-4 [&_ul]:list-disc [&_ul]:ps-5 [&_ul]:space-y-1.5 [&_a]:text-accent [&_a]:underline [&_strong]:text-ink [&_strong]:font-medium">
        {children}
      </main>
      <Footer />
    </div>
  );
}
