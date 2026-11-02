import Link from 'next/link';
import Logo from './Logo';

const LINKS = [
  { href: '/#fonctionnalites', label: 'Fonctionnalités' },
  { href: '/login', label: 'Connexion' },
  { href: '/legal/terms', label: 'CGU' },
  { href: '/legal/privacy', label: 'Confidentialité' },
  { href: '/legal/mentions', label: 'Mentions légales' },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.05] pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <Logo size="sm" />
          <nav aria-label="Pied de page" className="flex flex-wrap gap-x-5 gap-y-1">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="inline-flex items-center min-h-9 text-sm text-[#a0a0a6] hover:text-[#f4be7e] transition-colors">{l.label}</Link>
            ))}
          </nav>
        </div>
        <p className="text-xs text-[#8e8e98] mt-6 leading-relaxed">
          MS Tech est un service d&apos;information sur votre patrimoine. Il ne constitue pas un conseil en investissement. Les performances passées ne préjugent pas des performances futures.
        </p>
        <p className="text-xs text-[#8e8e98] mt-2">&copy; {new Date().getFullYear()} MS Tech — par Market Securities.</p>
      </div>
    </footer>
  );
}
