'use client';

import { FormEvent, Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { FormError } from '@/components/ui/kit';
import DemoButton from '@/components/DemoButton';
import { AuthShell, LegalNotice } from '../_auth/AuthShell';
import PasswordInput from '../_auth/PasswordInput';

/** Only a path on this site: `//evil.com` and absolute URLs are refused. */
function safeCallback(raw: string | null) {
  return raw && raw.startsWith('/') && !raw.startsWith('//') && !raw.startsWith('/\\') ? raw : '/dashboard';
}

function LoginForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const justReset = params.get('reset') === '1';

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await signIn('credentials', { email, password, redirect: false });
      if (!result) throw new Error();
      if (result.error === 'RATE_LIMITED') setError('Trop de tentatives. Patientez quelques minutes puis réessayez.');
      else if (result.error) setError('Email ou mot de passe incorrect.');
      else {
        window.location.href = safeCallback(params.get('callbackUrl'));
        return;
      }
    } catch {
      setError('Connexion impossible. Vérifiez votre réseau et réessayez.');
    }
    setLoading(false);
  };

  return (
    <>
      <form onSubmit={submit} className="space-y-4">
        {justReset && <p role="status" className="bg-[#34d399]/10 border border-[#34d399]/20 rounded-[12px] p-3 text-sm text-[#34d399]">Mot de passe modifié. Vous pouvez vous connecter.</p>}
        <FormError message={error} />
        <Input id="email" label="Email" type="email" placeholder="vous@exemple.fr" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" autoCapitalize="none" required />
        <PasswordInput id="password" label="Mot de passe" value={password} onChange={setPassword} autoComplete="current-password" />
        <div className="text-right -mt-1"><Link href="/forgot" className="inline-flex items-center min-h-9 text-sm text-[#f4be7e] hover:text-[#f9d09f]">Mot de passe oublié ?</Link></div>
        <Button type="submit" loading={loading} className="w-full">Se connecter</Button>
      </form>
      <div className="flex items-center gap-3 my-4 text-xs text-[#8e8e98]"><span className="h-px flex-1 bg-white/[0.08]" />ou<span className="h-px flex-1 bg-white/[0.08]" /></div>
      <DemoButton variant="secondary" className="block" label="Essayer la démo" />
      <p className="mt-5 text-center text-sm text-[#a0a0a6]">Pas encore de compte ? <Link href="/register" className="text-[#f4be7e] hover:text-[#f9d09f] font-medium">Créer un compte</Link></p>
    </>
  );
}

export default function LoginPage() {
  return (
    <AuthShell title="Connexion" subtitle="Accédez à votre espace patrimonial" footer={<LegalNotice action="vous connectant" />}>
      <Suspense><LoginForm /></Suspense>
    </AuthShell>
  );
}
