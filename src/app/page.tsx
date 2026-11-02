import Link from 'next/link';
import { ArrowRight, Calculator, CalendarDays, Download, Link2, Lock, PieChart, Receipt, ShieldCheck, TrendingUp, Trash2, Wallet2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import DemoButton from '@/components/DemoButton';
import Footer from '@/components/layout/Footer';
import Logo from '@/components/layout/Logo';

const FEATURES = [
  { icon: Link2, title: 'Tout au même endroit', text: 'Banques, courtiers, assurance-vie, crypto, immobilier et crédits : connectés automatiquement ou saisis à la main.' },
  { icon: PieChart, title: 'Votre vraie répartition', text: 'Par classe d\'actifs, région et secteur, converti dans votre devise. Dettes déduites.' },
  { icon: Receipt, title: 'Vos frais, en clair', text: 'Listez ce que vous payez et voyez ce que cela coûte sur vingt ans.' },
  { icon: CalendarDays, title: 'Dividendes', text: 'Versés, confirmés, à venir : le calendrier de vos revenus passifs.' },
  { icon: Wallet2, title: 'Budget', text: 'Revenus, dépenses, catégories et taux d\'épargne, mois après mois.' },
  { icon: TrendingUp, title: 'Projections', text: 'Une fourchette de scénarios pour votre patrimoine, plutôt qu\'un seul chiffre rassurant.' },
  { icon: Calculator, title: 'Simulateurs', text: 'Intérêts composés, prêt immobilier, projection de patrimoine.' },
  { icon: ShieldCheck, title: 'Vos données restent à vous', text: 'Clés d\'accès chiffrées AES, connexions en lecture seule, export et suppression en un geste.' },
];

const FACTS = [
  { value: '5', label: 'connecteurs : Europe, Émirats, monde, crypto, courtier' },
  { value: '2 000', label: 'scénarios par projection Monte Carlo' },
  { value: '9', label: 'devises d\'affichage, dont EUR, USD, CHF et AED' },
  { value: '1 geste', label: 'pour exporter ou supprimer vos données' },
];

/** Decorative: every figure is invented, and labelled as such on screen. */
function AppPreview() {
  const slices = [
    { name: 'Immobilier', pct: 62, color: '#149b72' },
    { name: 'ETF', pct: 16, color: '#5b86f0' },
    { name: 'Actions', pct: 12, color: '#bd8a45' },
    { name: 'Liquidités', pct: 10, color: '#1692ad' },
  ];
  return (
    <figure className="relative mx-auto w-full max-w-[340px]" aria-label="Illustration de l'application avec des chiffres fictifs">
      <div className="absolute -inset-10 bg-[radial-gradient(ellipse_at_center,rgba(244,190,126,0.14),transparent_70%)] pointer-events-none" />
      <div aria-hidden className="relative rounded-[32px] border border-white/[0.1] bg-[#0f0f11] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
        <p className="text-xs text-[#a0a0a6]">Patrimoine net</p>
        <p className="text-3xl font-bold tracking-tight text-[#f5f5f5] tabular-nums mt-1">312 450 €</p>
        <p className="text-xs font-medium text-[#34d399] mt-1 tabular-nums">+1,84 % sur 30 jours</p>
        <svg viewBox="0 0 300 90" className="w-full mt-4" role="presentation">
          <defs><linearGradient id="prev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f4be7e" stopOpacity="0.28" /><stop offset="100%" stopColor="#f4be7e" stopOpacity="0" /></linearGradient></defs>
          <path d="M0 78 C30 72 45 74 70 62 S115 58 140 50 S190 52 215 34 S265 22 300 10 V90 H0Z" fill="url(#prev)" />
          <path d="M0 78 C30 72 45 74 70 62 S115 58 140 50 S190 52 215 34 S265 22 300 10" fill="none" stroke="#f4be7e" strokeWidth="2" />
        </svg>
        <div className="flex gap-[2px] h-2.5 mt-4 rounded-full overflow-hidden">
          {slices.map((s) => <span key={s.name} style={{ width: `${s.pct}%`, backgroundColor: s.color }} />)}
        </div>
        <ul className="mt-3 space-y-1.5">
          {slices.map((s) => (
            <li key={s.name} className="flex justify-between text-xs">
              <span className="flex items-center gap-2 text-[#a0a0a6]"><span className="w-2 h-2 rounded-[2px]" style={{ backgroundColor: s.color }} />{s.name}</span>
              <span className="text-[#f5f5f5] tabular-nums">{s.pct} %</span>
            </li>
          ))}
        </ul>
      </div>
      <figcaption className="relative text-center text-xs text-[#8e8e98] mt-3">Illustration, chiffres fictifs</figcaption>
    </figure>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-dvh overflow-x-hidden">
      <header className="sticky top-0 z-40 bg-[#0a0a0b]/85 backdrop-blur-xl border-b border-white/[0.05] pt-[env(safe-area-inset-top)]">
        <div className="max-w-6xl mx-auto h-16 px-4 sm:px-6 flex items-center justify-between gap-3">
          <Link href="/" aria-label="MS Tech, accueil"><Logo size="sm" /></Link>
          <nav aria-label="Compte" className="flex items-center gap-1 sm:gap-2">
            <Link href="/login"><Button variant="ghost" size="sm">Connexion</Button></Link>
            <Link href="/register"><Button size="sm">Commencer</Button></Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-14 sm:pb-20 grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <p className="inline-block text-sm text-[#a0a0a6] bg-white/[0.04] border border-white/[0.08] rounded-full px-3.5 py-1 mb-5">par Market Securities</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#f5f5f5] leading-[1.08]">
              Tout votre patrimoine,<br /><span className="text-gold-gradient">sur un seul écran</span>
            </h1>
            <p className="text-lg text-[#a0a0a6] mt-5 max-w-xl mx-auto lg:mx-0">
              Reliez vos comptes ou saisissez-les à la main. Patrimoine net, répartition, frais, dividendes et projections se calculent tout seuls.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mt-8">
              <Link href="/register"><Button size="lg" className="w-full">Créer mon compte<ArrowRight size={18} className="ml-2" /></Button></Link>
              <DemoButton size="lg" />
            </div>
            <p className="text-xs text-[#8e8e98] mt-4 flex items-center gap-1.5 justify-center lg:justify-start"><Lock size={12} />La démo utilise des données fictives, sans inscription.</p>
          </div>
          <AppPreview />
        </section>

        <section aria-label="En bref" className="border-y border-white/[0.05]">
          <dl className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
            {FACTS.map((f) => (
              <div key={f.label}>
                <dt className="sr-only">{f.label}</dt>
                <dd className="text-2xl sm:text-3xl font-bold text-[#f5f5f5] tabular-nums">{f.value}</dd>
                <dd className="text-sm text-[#a0a0a6] mt-1 leading-snug">{f.label}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="fonctionnalites" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 scroll-mt-20">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#f5f5f5] text-center mb-10">Tout pour piloter votre patrimoine</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((f) => (
              <article key={f.title} className="bg-white/[0.03] border border-white/[0.06] rounded-[16px] p-5">
                <span className="w-10 h-10 bg-[#f4be7e]/10 rounded-[12px] flex items-center justify-center mb-4"><f.icon size={20} className="text-[#f4be7e]" /></span>
                <h3 className="font-semibold text-[#f5f5f5] mb-1.5">{f.title}</h3>
                <p className="text-sm text-[#a0a0a6] leading-relaxed">{f.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            {[
              { icon: Lock, title: 'Lecture seule', text: 'MS Tech lit vos soldes et positions. Il ne peut ni déplacer d\'argent ni passer d\'ordre.' },
              { icon: Download, title: 'Export à tout moment', text: 'Téléchargez l\'ensemble de vos données depuis les paramètres.' },
              { icon: Trash2, title: 'Suppression réelle', text: 'Supprimez votre compte dans l\'application : vos données et connexions partent avec lui.' },
            ].map((b) => (
              <div key={b.title} className="flex gap-3 p-4 rounded-[14px] border border-white/[0.06]">
                <b.icon size={18} className="text-[#f4be7e] shrink-0 mt-0.5" />
                <div><p className="font-semibold text-[#f5f5f5]">{b.title}</p><p className="text-[#a0a0a6] mt-1 leading-relaxed">{b.text}</p></div>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-20 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[#f5f5f5] mb-3">Prenez le contrôle de votre patrimoine</h2>
          <p className="text-[#a0a0a6] mb-7">Connectez votre banque ou saisissez un premier compte à la main.</p>
          <Link href="/register"><Button size="lg">Commencer<ArrowRight size={18} className="ml-2" /></Button></Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}
