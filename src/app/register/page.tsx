'use client';

import { FormEvent, useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { FormError } from '@/components/ui/kit';
import DemoButton from '@/components/DemoButton';
import { api } from '@/lib/api';
import { AuthShell, LegalNotice } from '../_auth/AuthShell';
import PasswordInput from '../_auth/PasswordInput';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError('Le mot de passe doit contenir au moins 8 caractères.');
    setLoading(true);
    try {
      await api('/api/auth/register', { method: 'POST', body: { name, email, password } });
      const result = await signIn('credentials', { email, password, redirect: false });
      if (!result || result.error) {
        setError('Votre compte est créé, mais la connexion a échoué. Connectez-vous depuis la page de connexion.');
        setLoading(false);
        return;
      }
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Inscription impossible. Réessayez.');
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Créer un compte" subtitle="Commencez à piloter votre patrimoine" footer={<LegalNotice action="créant un compte" />}>
      <form onSubmit={submit} className="space-y-4">
        <FormError message={error} />
        <Input id="name" label="Nom" placeholder="Votre nom" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
        <Input id="email" label="Email" type="email" placeholder="vous@exemple.fr" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" autoCapitalize="none" required />
        <PasswordInput id="password" label="Mot de passe" placeholder="8 caractères minimum" value={password} onChange={setPassword} autoComplete="new-password" />
        <Button type="submit" loading={loading} className="w-full">Créer mon compte</Button>
      </form>
      <div className="flex items-center gap-3 my-4 text-xs text-[#8e8e98]"><span className="h-px flex-1 bg-white/[0.08]" />ou<span className="h-px flex-1 bg-white/[0.08]" /></div>
      <DemoButton variant="secondary" className="block" label="Essayer la démo" />
      <p className="mt-5 text-center text-sm text-[#a0a0a6]">Déjà un compte ? <Link href="/login" className="text-[#f4be7e] hover:text-[#f9d09f] font-medium">Se connecter</Link></p>
    </AuthShell>
  );
}
