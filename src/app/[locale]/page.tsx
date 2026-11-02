import type { LucideIcon } from 'lucide-react';
import { ArrowRight, Calculator, CalendarDays, Download, Link2, Lock, PieChart, Receipt, ShieldCheck, TrendingUp, Trash2, Wallet2 } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { intlLocale } from '@/i18n/format';
import Button from '@/components/ui/Button';
import LocaleSwitcher from '@/components/ui/LocaleSwitcher';
import DemoButton from '@/components/DemoButton';
import Footer from '@/components/layout/Footer';
import Logo from '@/components/layout/Logo';

const FEATURES: { key: string; icon: LucideIcon }[] = [
  { key: 'together', icon: Link2 },
  { key: 'allocation', icon: PieChart },
  { key: 'fees', icon: Receipt },
  { key: 'dividends', icon: CalendarDays },
  { key: 'budget', icon: Wallet2 },
  { key: 'projections', icon: TrendingUp },
  { key: 'simulators', icon: Calculator },
  { key: 'privacy', icon: ShieldCheck },
];
const FACTS = ['connectors', 'scenarios', 'currencies', 'gesture'];
const TRUST: { key: string; icon: LucideIcon }[] = [
  { key: 'readOnly', icon: Lock },
  { key: 'export', icon: Download },
  { key: 'delete', icon: Trash2 },
];

/** Decorative: every figure is invented, and labelled as such on screen. */
async function AppPreview({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'landing.preview' });
  const tf = await getTranslations({ locale, namespace: 'finance.assetClass' });
  const fmt = intlLocale(locale);
  const money = new Intl.NumberFormat(fmt, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(312450);
  const change = new Intl.NumberFormat(fmt, { minimumFractionDigits: 2 }).format(1.84);
  const slices = [
    { key: 'real-estate', pct: 62, color: 'var(--c3)' },
    { key: 'etf', pct: 16, color: 'var(--c2)' },
    { key: 'stocks', pct: 12, color: 'var(--c1)' },
    { key: 'cash', pct: 10, color: 'var(--c6)' },
  ];
  return (
    <figure className="max-w-4xl mx-auto" aria-label={t('aria')}>
      <div aria-hidden className="rounded-[14px] bg-surface p-6 sm:p-10 grid md:grid-cols-2 gap-8 md:gap-12 items-center">
        <div className="min-w-0">
          <p className="text-sm text-muted">{t('netWorth')}</p>
          <p className="text-4xl sm:text-5xl font-semibold tracking-tight text-ink tabular-nums mt-2"><bdi>{money}</bdi></p>
          <p className="text-sm text-pos mt-2 tabular-nums">{t('change', { value: change })}</p>
          <svg viewBox="0 0 300 90" className="w-full mt-6" role="presentation">
            <path d="M0 78 C30 72 45 74 70 62 S115 58 140 50 S190 52 215 34 S265 22 300 10" fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
        <div className="min-w-0">
          <div className="flex gap-[2px] h-2 rounded-full overflow-hidden">
            {slices.map((s) => <span key={s.key} style={{ width: `${s.pct}%`, backgroundColor: s.color }} />)}
          </div>
          <ul className="mt-5 space-y-3">
            {slices.map((s) => (
              <li key={s.key} className="flex justify-between gap-3 text-sm">
                <span className="flex items-center gap-2.5 text-muted"><span className="w-2 h-2 rounded-[2px]" style={{ backgroundColor: s.color }} />{tf(s.key)}</span>
                <span className="text-ink tabular-nums"><bdi>{new Intl.NumberFormat(intlLocale(locale), { style: 'percent' }).format(s.pct / 100)}</bdi></span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <figcaption className="text-center text-xs text-subtle mt-3">{t('caption')}</figcaption>
    </figure>
  );
}

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'landing' });
  const tn = await getTranslations({ locale, namespace: 'nav' });

  return (
    <div className="min-h-dvh overflow-x-hidden">
      <header className="sticky top-0 z-40 bg-bg pt-[env(safe-area-inset-top)]">
        <div className="max-w-6xl mx-auto h-16 px-4 sm:px-6 flex items-center justify-between gap-2">
          <Link href="/" aria-label={tn('homeLink')}><Logo size="sm" /></Link>
          <nav aria-label={t('accountNav')} className="flex items-center gap-1 sm:gap-2">
            <LocaleSwitcher className="w-[5.5rem] sm:w-auto" />
            <Link href="/login"><Button variant="ghost" size="sm" className="px-2.5 sm:px-3.5">{t('signIn')}</Button></Link>
            <Link href="/register" className="hidden sm:block"><Button size="sm">{t('start')}</Button></Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 sm:pt-28 pb-16 sm:pb-20 text-center">
          <h1 className="text-[2.6rem] sm:text-6xl lg:text-7xl font-semibold tracking-tight text-ink leading-[1.08]">{t('hero.title')}</h1>
          <p className="text-lg text-muted mt-6 max-w-2xl mx-auto leading-relaxed">{t('hero.text')}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-9">
            <Link href="/register"><Button size="lg" className="w-full">{t('hero.cta')}<ArrowRight size={18} className="ms-2 rtl:-scale-x-100" /></Button></Link>
            <DemoButton size="lg" variant="secondary" />
          </div>
          <p className="text-xs text-subtle mt-5">{t('hero.demoNote')}</p>
          <p className="text-xs text-subtle mt-1">{t('hero.by')}</p>
        </section>

        <section className="px-4 sm:px-6 pb-20 sm:pb-28"><AppPreview locale={locale} /></section>

        <section id="fonctionnalites" className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 sm:pb-28 scroll-mt-20">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink mb-12">{t('features.title')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
            {FEATURES.map((f) => (
              <article key={f.key}>
                <f.icon size={20} className="text-ink mb-3" />
                <h3 className="font-medium text-ink mb-1.5">{t(`features.${f.key}.title`)}</h3>
                <p className="text-sm text-muted leading-relaxed">{t(`features.${f.key}.text`)}</p>
              </article>
            ))}
          </div>
        </section>

        <section aria-label={t('facts.label')} className="border-y border-line">
          <dl className="max-w-6xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-2 lg:grid-cols-4 gap-8">
            {FACTS.map((f) => (
              <div key={f} className="flex flex-col-reverse justify-end">
                <dt className="text-sm text-muted mt-1 leading-snug">{t(`facts.${f}.label`)}</dt>
                <dd className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink tabular-nums">{t(`facts.${f}.value`)}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink mb-12">{t('trust.title')}</h2>
          <div className="grid md:grid-cols-3 gap-x-8 gap-y-10">
            {TRUST.map((b) => (
              <div key={b.key}>
                <b.icon size={20} className="text-ink mb-3" />
                <p className="font-medium text-ink">{t(`trust.${b.key}.title`)}</p>
                <p className="text-sm text-muted mt-1.5 leading-relaxed">{t(`trust.${b.key}.text`)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-24 sm:pb-32 text-center">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink mb-3">{t('closing.title')}</h2>
          <p className="text-muted mb-8">{t('closing.text')}</p>
          <Link href="/register"><Button size="lg">{t('start')}<ArrowRight size={18} className="ms-2 rtl:-scale-x-100" /></Button></Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}
