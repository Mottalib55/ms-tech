'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Button from '@/components/ui/Button';
import { FormError } from '@/components/ui/kit';
import { api } from '@/lib/api';
import { AuthShell } from '../_auth/AuthShell';
import PasswordInput from '../_auth/PasswordInput';

function ResetForm() {
  const token = useSearchParams().get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <>
        <FormError message="Ce lien est incomplet." />
        <p className="mt-4 text-center text-sm"><Link href="/forgot" className="text-[#f4be7e] font-medium">Demander un nouveau lien</Link></p>
      </>
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError('Le mot de passe doit contenir au moins 8 caractères.');
    if (password !== confirm) return setError('Les deux mots de passe ne correspondent pas.');
    setLoading(true);
    try {
      await api('/api/auth/reset', { method: 'POST', body: { token, password } });
      window.location.href = '/login?reset=1';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Modification impossible. Réessayez.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <FormError message={error} />
      <PasswordInput id="password" label="Nouveau mot de passe" placeholder="8 caractères minimum" value={password} onChange={setPassword} autoComplete="new-password" />
      <PasswordInput id="confirm" label="Confirmez-le" value={confirm} onChange={setConfirm} autoComplete="new-password" />
      <Button type="submit" loading={loading} className="w-full">Changer le mot de passe</Button>
    </form>
  );
}

export default function ResetPage() {
  return (
    <AuthShell title="Nouveau mot de passe">
      <Suspense><ResetForm /></Suspense>
    </AuthShell>
  );
}
