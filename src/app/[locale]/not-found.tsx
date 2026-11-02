import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import Button from '@/components/ui/Button';

export default function NotFound() {
  const t = useTranslations('public.notFound');
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center text-center px-4">
      <p dir="ltr" className="text-5xl font-semibold tracking-tight text-subtle mb-3">404</p>
      <h1 className="text-2xl font-semibold text-ink mb-2">{t('title')}</h1>
      <p className="text-muted mb-6">{t('text')}</p>
      <div className="flex gap-3"><Link href="/dashboard"><Button>{t('dashboard')}</Button></Link><Link href="/"><Button variant="secondary">{t('home')}</Button></Link></div>
    </main>
  );
}
