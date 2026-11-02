import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function NotFound() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center text-center px-4">
      <p className="text-5xl font-bold text-gold-gradient mb-3">404</p>
      <h1 className="text-2xl font-bold text-[#f5f5f5] mb-2">Page introuvable</h1>
      <p className="text-[#a0a0a6] mb-6">Cette adresse n&apos;existe pas ou plus.</p>
      <div className="flex gap-3"><Link href="/dashboard"><Button>Mon patrimoine</Button></Link><Link href="/"><Button variant="secondary">Accueil</Button></Link></div>
    </main>
  );
}
