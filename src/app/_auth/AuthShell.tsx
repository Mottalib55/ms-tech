import { ReactNode } from 'react';
import Link from 'next/link';
import Logo from '@/components/layout/Logo';

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <main className="min-h-dvh flex items-center justify-center px-4 py-8 pt-[calc(2rem+env(safe-area-inset-top))]">
      <div className="w-full max-w-md">
        <div className="text-center mb-7">
          <Link href="/" aria-label="MS Tech, accueil" className="inline-block mb-5"><Logo /></Link>
          <h1 className="text-2xl font-bold tracking-tight text-[#f5f5f5]">{title}</h1>
          {subtitle && <p className="text-[#a0a0a6] mt-2 text-sm">{subtitle}</p>}
        </div>
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-[20px] p-5 sm:p-6">{children}</div>
        {footer && <div className="text-center text-xs text-[#8e8e98] mt-5 leading-relaxed">{footer}</div>}
      </div>
    </main>
  );
}

export function LegalNotice({ action }: { action: string }) {
  return (
    <>
      En {action}, vous acceptez les <Link href="/legal/terms" className="underline hover:text-[#f4be7e]">CGU</Link> et la <Link href="/legal/privacy" className="underline hover:text-[#f4be7e]">politique de confidentialité</Link>.
    </>
  );
}
