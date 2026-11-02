'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Landmark } from 'lucide-react';
import Button from '@/components/ui/Button';

function Consent() {
  const params = useSearchParams();
  const state = params.get('state') ?? '';
  const go = (query: string) => { window.location.href = `/api/connections/callback?state=${encodeURIComponent(state)}&${query}`; };
  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/[0.03] border border-white/[0.08] rounded-[20px] p-6 text-center">
        <span className="inline-flex w-14 h-14 rounded-[16px] bg-[#5682f2]/15 text-[#5682f2] items-center justify-center mb-4"><Landmark size={26} /></span>
        <h1 className="text-xl font-bold text-[#f5f5f5] mb-2">Banque de démonstration</h1>
        <p className="text-sm text-[#a0a0a6] mb-6">Cet écran simule la page de votre banque. MS Tech demande un accès en lecture seule à vos comptes, positions et opérations.</p>
        <div className="flex flex-col gap-3">
          <Button onClick={() => go('code=sandbox-consent')}>Autoriser l&apos;accès</Button>
          <Button variant="ghost" onClick={() => go('denied=1')}>Refuser</Button>
        </div>
      </div>
    </div>
  );
}

export default function SandboxConsentPage() {
  return <Suspense><Consent /></Suspense>;
}
