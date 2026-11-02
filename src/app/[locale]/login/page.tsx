'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { FormError } from '@/components/ui/kit';
import DemoButton from '@/components/DemoButton';
import { AuthShell, LegalNotice } from '@/components/auth/AuthShell';
import PasswordInput from '@/components/auth/PasswordInput';
import { publicApi } from '@/lib/publicApi';

/** Only a path on this site: `//evil.com` and absolute URLs are refused. */
function safeCallback(raw: string | null) {
  return raw && raw.startsWith('/') && !raw.startsWith('//') && !raw.startsWith('/\\') ? raw : '/dashboard';
}

type Mode = 'password' | 'code' | 'codeSent';

function LoginForm() {
  const t = useTranslations('auth.login');
  const params = useSearchParams();
  const [mode, setMode] = useState<Mode>('password');
  const [codeEnabled, setCodeEnabled] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const justReset = params.get('reset') === '1';

  useEffect(() => {
    publicApi<{ enabled: boolean }>('/api/auth/code').then((r) => setCodeEnabled(r.enabled)).catch(() => {});
  }, []);

  const finish = async (provider: string, fields: Record<string, string>, wrong: string) => {
    setError(null);
    setLoading(true);
    try {
      const result = await signIn(provider, { ...fields, redirect: false });
      if (!result) throw new Error();
      if (result.error === 'RATE_LIMITED') setError(t('rateLimited'));
      else if (result.error) setError(wrong);
      else {
        window.location.href = safeCallback(params.get('callbackUrl'));
        return;
      }
    } catch {
      setError(t('network'));
    }
    setLoading(false);
  };

  const sendCode = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const r = await publicApi<{ devCode?: string }>('/api/auth/code', { email });
      if (r.devCode) document.documentElement.dataset.devCode = r.devCode;
      setMode('codeSent');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('network'));
    }
    setLoading(false);
  };

  const emailField = (
    <Input id="email" label={t('email')} type="email" dir="ltr" placeholder={t('emailPlaceholder')} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" autoCapitalize="none" required />
  );

  return (
    <>
      {mode === 'password' && (
        <form onSubmit={(e) => { e.preventDefault(); finish('credentials', { email, password }, t('wrongPassword')); }} className="space-y-4">
          {justReset && <p role="status" className="bg-pos/10 rounded-[10px] p-3 text-sm text-pos">{t('passwordChanged')}</p>}
          <FormError message={error} />
          {emailField}
          <PasswordInput id="password" label={t('password')} value={password} onChange={setPassword} autoComplete="current-password" />
          <div className="text-end -mt-1"><Link href="/forgot" className="inline-flex items-center min-h-9 text-sm text-muted hover:text-ink">{t('forgot')}</Link></div>
          <Button type="submit" loading={loading} className="w-full">{t('submit')}</Button>
          {codeEnabled && <Button variant="secondary" className="w-full" onClick={() => { setError(null); setMode('code'); }}>{t('useCode')}</Button>}
        </form>
      )}
      {mode === 'code' && (
        <form onSubmit={sendCode} className="space-y-4">
          <FormError message={error} />
          {emailField}
          <Button type="submit" loading={loading} className="w-full">{t('sendCode')}</Button>
          <Button variant="ghost" className="w-full" onClick={() => { setError(null); setMode('password'); }}>{t('usePassword')}</Button>
        </form>
      )}
      {mode === 'codeSent' && (
        <form onSubmit={(e) => { e.preventDefault(); finish('email-code', { email, code }, t('wrongCode')); }} className="space-y-4">
          <p role="status" className="text-sm text-muted">{t('codeSent', { email })}</p>
          <FormError message={error} />
          <Input id="code" label={t('code')} dir="ltr" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} className="text-center tracking-[0.4em] tabular-nums" required />
          <Button type="submit" loading={loading} className="w-full">{t('submit')}</Button>
          <Button variant="ghost" className="w-full" onClick={() => { setError(null); setCode(''); setMode('code'); }}>{t('resend')}</Button>
        </form>
      )}
      <div className="flex items-center gap-3 my-4 text-xs text-subtle"><span className="h-px flex-1 bg-line" />{t('or')}<span className="h-px flex-1 bg-line" /></div>
      <DemoButton variant="secondary" className="block" label={t('demo')} />
      <p className="mt-5 text-center text-sm text-muted">{t('noAccount')} <Link href="/register" className="text-ink font-medium hover:underline">{t('createAccount')}</Link></p>
    </>
  );
}

export default function LoginPage() {
  const t = useTranslations('auth.login');
  return (
    <AuthShell title={t('title')} subtitle={t('subtitle')} footer={<LegalNotice />}>
      <Suspense><LoginForm /></Suspense>
    </AuthShell>
  );
}
