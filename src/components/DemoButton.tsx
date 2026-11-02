'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Play } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';
import { api } from '@/lib/api';

type Props = { variant?: 'outline' | 'ghost' | 'secondary'; size?: 'sm' | 'md' | 'lg'; className?: string; label?: string };

/** Creates a private throwaway account with invented data, then opens it. */
export default function DemoButton({ variant = 'secondary', size = 'md', className, label }: Props) {
  const t = useTranslations('public.demo');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setError(null);
    setLoading(true);
    try {
      const creds = await api<{ email: string; password: string }>('/api/auth/demo', { method: 'POST' });
      const result = await signIn('credentials', { ...creds, redirect: false });
      if (!result || result.error) throw new Error(t('failed'));
      window.location.href = '/dashboard';
    } catch (e) {
      setError(e instanceof Error ? e.message : t('failed'));
      setLoading(false);
    }
  };

  return (
    <span className={className}>
      <Button variant={variant} size={size} loading={loading} onClick={start} className="w-full">
        {!loading && <Play size={15} className="me-2" />}{loading ? t('preparing') : label ?? t('see')}
      </Button>
      {error && <span role="alert" className="block text-xs text-neg mt-2 text-center">{error}</span>}
    </span>
  );
}
