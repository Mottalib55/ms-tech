'use client';

import Link from 'next/link';
import {
  TrendingUp,
  Shield,
  PieChart,
  Receipt,
  Calculator,
  BarChart3,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import AnimatedNumber from '@/components/ui/AnimatedNumber';
import Footer from '@/components/layout/Footer';

const features = [
  {
    icon: PieChart,
    title: 'Agrégation complète',
    description: 'Connectez tous vos comptes : PEA, CTO, assurance-vie, crypto, immobilier. Vue 360° de votre patrimoine.',
  },
  {
    icon: Receipt,
    title: 'Scanner de frais',
    description: 'Détectez les frais cachés et leur impact sur 20 ans. Économisez des milliers d\'euros.',
  },
  {
    icon: TrendingUp,
    title: 'Simulations Monte Carlo',
    description: '5000 scénarios pour projeter votre patrimoine et planifier votre indépendance financière.',
  },
  {
    icon: Calculator,
    title: 'Simulateurs avancés',
    description: 'Intérêts composés, prêt immobilier, projection patrimoniale. Prenez les bonnes décisions.',
  },
  {
    icon: BarChart3,
    title: 'Suivi budgétaire',
    description: 'Catégorisez vos dépenses, suivez votre taux d\'épargne et atteignez vos objectifs.',
  },
  {
    icon: Shield,
    title: 'Sécurité maximale',
    description: 'Chiffrement de bout en bout, connexion lecture seule. Vos données restent les vôtres.',
  },
];

const stats = [
  { value: 2500000000, label: 'Actifs suivis', format: (n: number) => `${(n / 1000000000).toFixed(1)} Mrd €` },
  { value: 15000, label: 'Utilisateurs', format: (n: number) => `${n.toLocaleString('fr-FR')}+` },
  { value: 1247, label: 'Économie moy./an', format: (n: number) => `€${n.toLocaleString('fr-FR')}` },
  { value: 99.9, label: 'Disponibilité', format: (n: number) => `${n.toFixed(1)}%` },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-5xl z-50">
        <div className="h-14 bg-[rgba(20,20,22,0.7)] border border-[rgba(255,255,255,0.06)] backdrop-blur-[20px] backdrop-saturate-[160%] rounded-[16px] flex items-center justify-between px-5 shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[10px] flex items-center justify-center bg-gradient-to-br from-[#d4a06a] via-[#f4be7e] to-[#f9d09f] shadow-[0_0_16px_rgba(244,190,126,0.3)]">
              <span className="text-[#0a0a0b] font-bold text-sm">MS</span>
            </div>
            <span className="text-lg font-bold text-[#f5f5f5]">MS Tech</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Connexion</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Commencer</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-36 pb-20 px-4 sm:px-6 lg:px-8 relative">
        {/* Radial mesh glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(86,130,242,0.12)_0%,rgba(244,190,126,0.06)_40%,transparent_70%)]" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-[rgba(244,190,126,0.08)] border border-[rgba(244,190,126,0.15)] rounded-full px-4 py-1.5 mb-6 animate-in">
            <span className="text-[#f4be7e] text-sm font-medium">Nouveau</span>
            <span className="text-[#6b6b73] text-sm">par Market Securities</span>
            <ChevronRight size={14} className="text-[#6b6b73]" />
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#f5f5f5] mb-6 leading-tight animate-in animate-in-1">
            Votre patrimoine,{' '}
            <span className="text-gold-gradient">
              simplifié
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-[#a0a0a6] mb-8 max-w-2xl mx-auto animate-in animate-in-2">
            Agrégez tous vos comptes, analysez vos frais, simulez votre avenir financier.
            La plateforme de gestion patrimoniale par Market Securities.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in animate-in-3">
            <Link href="/register">
              <Button size="lg">
                Créer mon compte gratuit
                <ArrowRight size={18} className="ml-2" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">
                Voir la démo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-[rgba(255,255,255,0.04)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat, i) => (
            <div key={stat.label} className={`animate-in animate-in-${i + 1}`}>
              <div className="text-2xl sm:text-3xl font-bold text-[#f5f5f5]">
                <AnimatedNumber value={stat.value} format={stat.format} delay={i * 100} />
              </div>
              <div className="text-sm text-[#6b6b73] mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#f5f5f5] mb-4">
              Tout pour piloter votre patrimoine
            </h2>
            <p className="text-[#a0a0a6] max-w-2xl mx-auto">
              Des outils professionnels accessibles à tous, conçus par les experts de Market Securities.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className={`bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-[16px] p-6 hover:border-[rgba(244,190,126,0.2)] hover:-translate-y-[2px] transition-all duration-[350ms] ease-[cubic-bezier(0.22,1,0.36,1)] group animate-in animate-in-${i + 1}`}
              >
                <div className="w-12 h-12 bg-[rgba(244,190,126,0.08)] rounded-[12px] flex items-center justify-center mb-4 group-hover:bg-[rgba(244,190,126,0.12)] transition-colors duration-300">
                  <feature.icon size={24} className="text-[#f4be7e]" />
                </div>
                <h3 className="text-lg font-semibold text-[#f5f5f5] mb-2">{feature.title}</h3>
                <p className="text-sm text-[#a0a0a6] leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center relative">
          {/* Radial gold glow */}
          <div className="absolute inset-0 -m-8 bg-[radial-gradient(ellipse_at_center,rgba(244,190,126,0.06)_0%,transparent_70%)] rounded-3xl pointer-events-none" />
          <div className="relative bg-[rgba(255,255,255,0.03)] border border-[rgba(244,190,126,0.12)] rounded-[20px] p-12">
            <h2 className="text-3xl font-bold text-[#f5f5f5] mb-4">
              Prenez le contrôle de votre patrimoine
            </h2>
            <p className="text-[#a0a0a6] mb-8">
              Rejoignez des milliers d&apos;investisseurs qui utilisent MS Tech pour optimiser leur patrimoine.
            </p>
            <Link href="/register">
              <Button size="lg">
                Commencer gratuitement
                <ArrowRight size={18} className="ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
