import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import LocaleSwitcher from '@/components/ui/LocaleSwitcher';
import Logo from './Logo';

const LINKS = [
  { href: '/#fonctionnalites', key: 'features' },
  { href: '/login', key: 'signIn' },
  { href: '/legal/terms', key: 'terms' },
  { href: '/legal/privacy', key: 'privacy' },
  { href: '/legal/mentions', key: 'mentions' },
];

export default function Footer() {
  const t = useTranslations('public.footer');
  return (
    <footer className="border-t border-line pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <Logo size="sm" />
          <nav aria-label={t('label')} className="flex flex-wrap items-center gap-x-5 gap-y-1">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="inline-flex items-center min-h-9 text-sm text-muted hover:text-ink transition-colors">{t(l.key)}</Link>
            ))}
            <LocaleSwitcher />
          </nav>
        </div>
        <p className="text-xs text-subtle mt-6 leading-relaxed">{t('disclaimer')}</p>
        <p className="text-xs text-subtle mt-2">{t('copyright', { year: new Date().getFullYear() })}</p>
      </div>
    </footer>
  );
}
