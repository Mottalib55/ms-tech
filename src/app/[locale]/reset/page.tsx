'use client';

import { FormEvent, Suspense, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import Button from '@/components/ui/Button';
import { FormError } from '@/components/ui/kit';
import { api } from '@/lib/api';
import { AuthShell } from '@/components/auth/AuthShell';
import PasswordInput from '@/components/auth/PasswordInput';

function ResetForm() {
  const t = useTranslations('auth.reset');
  const token = useSearchParams().get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <>
        <FormError message={t('incomplete')} />
        <p className="mt-4 text-center text-sm"><Link href="/forgot" className="text-ink font-medium hover:underline">{t('requestNew')}</Link></p>
      </>
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError(t('tooShort'));
    if (password !== confirm) return setError(t('mismatch'));
    setLoading(true);
    try {
      await api('/api/auth/reset', { method: 'POST', body: { token, password } });
      window.location.href = '/login?reset=1';
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failed'));
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <FormError message={error} />
      <PasswordInput id="password" label={t('password')} placeholder={t('passwordHint')} value={password} onChange={setPassword} autoComplete="new-password" />
      <PasswordInput id="confirm" label={t('confirm')} value={confirm} onChange={setConfirm} autoComplete="new-password" />
      <Button type="submit" loading={loading} className="w-full">{t('submit')}</Button>
    </form>
  );
}

export default function ResetPage() {
  const t = useTranslations('auth.reset');
  return (
    <AuthShell title={t('title')}>
      <Suspense><ResetForm /></Suspense>
    </AuthShell>
  );
}
