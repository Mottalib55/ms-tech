'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { FormError } from '@/components/ui/kit';
import { api } from '@/lib/api';
import { AuthShell } from '../_auth/AuthShell';

export default function ForgotPage() {
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
      setError(err instanceof Error ? err.message : 'Envoi impossible. Réessayez.');
    }
    setLoading(false);
  };

  return (
    <AuthShell title="Mot de passe oublié" subtitle="Recevez un lien pour en choisir un nouveau">
      {sent ? (
        <p role="status" className="text-sm text-[#a0a0a6]">Si un compte existe pour cette adresse, un lien valable une heure vient d&apos;être envoyé. Pensez à vérifier vos courriers indésirables.</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <FormError message={error} />
          <Input id="email" label="Email" type="email" placeholder="vous@exemple.fr" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" autoCapitalize="none" required />
          <Button type="submit" loading={loading} className="w-full">Envoyer le lien</Button>
        </form>
      )}
      <p className="mt-5 text-center text-sm"><Link href="/login" className="text-[#f4be7e] hover:text-[#f9d09f] font-medium">Retour à la connexion</Link></p>
    </AuthShell>
  );
}
