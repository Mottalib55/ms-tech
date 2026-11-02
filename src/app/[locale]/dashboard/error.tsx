'use client';

import { useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations('home');
  const tc = useTranslations('common');
  const tn = useTranslations('nav');
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div role="alert" className="flex flex-col items-center text-center py-20 px-4">
      <AlertCircle size={32} className="text-neg mb-3" />
      <h1 className="text-lg font-semibold text-ink mb-1">{t('errorTitle')}</h1>
      <p className="text-sm text-muted mb-5">{t('errorText')}</p>
      <div className="flex gap-3"><Button onClick={reset}>{tc('retry')}</Button><Link href="/dashboard"><Button variant="secondary">{tn('overview')}</Button></Link></div>
    </div>
  );
}
