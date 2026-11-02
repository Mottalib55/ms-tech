'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center text-center px-4">
      <AlertCircle size={36} className="text-[#f87171] mb-4" />
      <h1 className="text-2xl font-bold text-[#f5f5f5] mb-2">Un problème est survenu</h1>
      <p className="text-[#a0a0a6] mb-6 max-w-sm">La page n&apos;a pas pu s&apos;afficher. Vos données ne sont pas touchées.</p>
      <div className="flex gap-3"><Button onClick={reset}>Réessayer</Button><Link href="/"><Button variant="secondary">Accueil</Button></Link></div>
    </main>
  );
}
