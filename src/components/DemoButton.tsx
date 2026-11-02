'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Play } from 'lucide-react';
import Button from '@/components/ui/Button';
import { api } from '@/lib/api';

type Props = { variant?: 'outline' | 'ghost' | 'secondary'; size?: 'sm' | 'md' | 'lg'; className?: string; label?: string };

/** Creates a private throwaway account with invented data, then opens it. */
export default function DemoButton({ variant = 'outline', size = 'md', className, label = 'Voir la démo' }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setError(null);
    setLoading(true);
    try {
      const creds = await api<{ email: string; password: string }>('/api/auth/demo', { method: 'POST' });
      const result = await signIn('credentials', { ...creds, redirect: false });
      if (!result || result.error) throw new Error('La démo n\'a pas pu s\'ouvrir. Réessayez.');
      window.location.href = '/dashboard';
    } catch (e) {
      setError(e instanceof Error ? e.message : 'La démo n\'a pas pu s\'ouvrir. Réessayez.');
      setLoading(false);
    }
  };

  return (
    <span className={className}>
      <Button variant={variant} size={size} loading={loading} onClick={start} className="w-full">
        {!loading && <Play size={15} className="mr-2" />}{loading ? 'Préparation…' : label}
      </Button>
      {error && <span role="alert" className="block text-xs text-[#f87171] mt-2 text-center">{error}</span>}
    </span>
  );
}
