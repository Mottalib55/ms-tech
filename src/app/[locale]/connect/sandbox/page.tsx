'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Landmark } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';

function Consent() {
  const t = useTranslations('public.sandbox');
  const params = useSearchParams();
  const state = params.get('state') ?? '';
  const go = (query: string) => { window.location.href = `/api/connections/callback?state=${encodeURIComponent(state)}&${query}`; };
  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface rounded-[16px] p-6 text-center">
        <span className="inline-flex w-12 h-12 rounded-[12px] bg-hover text-ink items-center justify-center mb-4"><Landmark size={22} /></span>
        <h1 className="text-xl font-semibold text-ink mb-2">{t('title')}</h1>
        <p className="text-sm text-muted mb-6">{t('text')}</p>
        <div className="flex flex-col gap-3">
          <Button onClick={() => go('code=sandbox-consent')}>{t('allow')}</Button>
          <Button variant="ghost" onClick={() => go('denied=1')}>{t('deny')}</Button>
        </div>
      </div>
    </div>
  );
}

export default function SandboxConsentPage() {
  return <Suspense><Consent /></Suspense>;
}
