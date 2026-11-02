'use client';

import { FormEvent, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { FormError } from '@/components/ui/kit';
import DemoButton from '@/components/DemoButton';
import { api } from '@/lib/api';
import { AuthShell, LegalNotice } from '@/components/auth/AuthShell';
import PasswordInput from '@/components/auth/PasswordInput';

export default function RegisterPage() {
  const t = useTranslations('auth.register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError(t('tooShort'));
    setLoading(true);
    try {
      await api('/api/auth/register', { method: 'POST', body: { name, email, password } });
      const result = await signIn('credentials', { email, password, redirect: false });
      if (!result || result.error) {
        setError(t('createdNotSignedIn'));
        setLoading(false);
        return;
      }
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failed'));
      setLoading(false);
    }
  };

  return (
    <AuthShell title={t('title')} subtitle={t('subtitle')} footer={<LegalNotice />}>
      <form onSubmit={submit} className="space-y-4">
        <FormError message={error} />
        <Input id="name" label={t('name')} placeholder={t('namePlaceholder')} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
        <Input id="email" label={t('email')} type="email" dir="ltr" placeholder={t('emailPlaceholder')} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" autoCapitalize="none" required />
        <PasswordInput id="password" label={t('password')} placeholder={t('passwordHint')} value={password} onChange={setPassword} autoComplete="new-password" />
        <Button type="submit" loading={loading} className="w-full">{t('submit')}</Button>
      </form>
      <div className="flex items-center gap-3 my-4 text-xs text-subtle"><span className="h-px flex-1 bg-line" />{t('or')}<span className="h-px flex-1 bg-line" /></div>
      <DemoButton variant="secondary" className="block" label={t('demo')} />
      <p className="mt-5 text-center text-sm text-muted">{t('hasAccount')} <Link href="/login" className="text-ink font-medium hover:underline">{t('signIn')}</Link></p>
    </AuthShell>
  );
}
