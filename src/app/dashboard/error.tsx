'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div role="alert" className="flex flex-col items-center text-center py-20 px-4">
      <AlertCircle size={32} className="text-[#f87171] mb-3" />
      <h1 className="text-lg font-semibold text-[#f5f5f5] mb-1">Cet écran n&apos;a pas pu s&apos;afficher</h1>
      <p className="text-sm text-[#a0a0a6] mb-5">Vos données ne sont pas touchées.</p>
      <div className="flex gap-3"><Button onClick={reset}>Réessayer</Button><Link href="/dashboard"><Button variant="secondary">Vue d&apos;ensemble</Button></Link></div>
    </div>
  );
}
