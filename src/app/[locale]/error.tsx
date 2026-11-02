'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations('public.error');
  useEffect(() => { console.error(error); }, [error]);
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center text-center px-4">
      <AlertCircle size={32} className="text-neg mb-4" />
      <h1 className="text-2xl font-semibold text-ink mb-2">{t('title')}</h1>
      <p className="text-muted mb-6 max-w-sm">{t('text')}</p>
      <div className="flex gap-3"><Button onClick={reset}>{t('retry')}</Button><Link href="/"><Button variant="secondary">{t('home')}</Button></Link></div>
    </main>
  );
}
