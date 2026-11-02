'use client';

import { FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { FormError } from '@/components/ui/kit';
import { api } from '@/lib/api';
import { AuthShell } from '@/components/auth/AuthShell';

export default function ForgotPage() {
  const t = useTranslations('auth.forgot');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api('/api/auth/forgot', { method: 'POST', body: { email } });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failed'));
    }
    setLoading(false);
  };

  return (
    <AuthShell title={t('title')} subtitle={t('subtitle')}>
      {sent ? (
        <p role="status" className="text-sm text-muted">{t('sent')}</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <FormError message={error} />
          <Input id="email" label={t('email')} type="email" dir="ltr" placeholder={t('emailPlaceholder')} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" autoCapitalize="none" required />
          <Button type="submit" loading={loading} className="w-full">{t('submit')}</Button>
        </form>
      )}
      <p className="mt-5 text-center text-sm"><Link href="/login" className="text-ink font-medium hover:underline">{t('back')}</Link></p>
    </AuthShell>
  );
}
