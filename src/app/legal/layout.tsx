import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Footer from '@/components/layout/Footer';
import Logo from '@/components/layout/Logo';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col">
      <header className="border-b border-white/[0.05] pt-[env(safe-area-inset-top)]">
        <div className="max-w-3xl mx-auto h-16 px-4 flex items-center justify-between">
          <Link href="/" aria-label="MS Tech, accueil"><Logo size="sm" /></Link>
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 min-h-9 text-sm text-[#a0a0a6] hover:text-[#f5f5f5]"><ArrowLeft size={15} />Retour</Link>
        </div>
      </header>
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 text-[#c9c9ce] text-[15px] leading-relaxed space-y-4 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h1]:text-[#f5f5f5] [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-[#f5f5f5] [&_h2]:pt-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_a]:text-[#f4be7e] [&_a]:underline [&_strong]:text-[#f5f5f5]">
        {children}
      </main>
      <Footer />
    </div>
  );
}
