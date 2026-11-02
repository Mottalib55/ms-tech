'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, DollarSign, Link2, Plus, Target, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { EmptyState, ErrorState, Loader, PageHeader, PageSkeleton, Segmented, StatCard } from '@/components/ui/kit';
import { AllocationDonut, CHART_ANIM, ChartOrTable, GOLD, axisTick, gridStroke, tooltipProps } from '@/components/charts/kit';
import { useHoldings, usePerformance, useSummary } from '@/hooks/data';
import { PERIOD_KEYS, filterPeriod } from '@/lib/finance';
import { formatCompact, formatCurrency, formatDate, formatPercent, formatRelativeTime, cn } from '@/lib/utils';
import type { Holding, Summary } from '@/types';

function diversificationLabel(score: number) {
  if (score >= 70) return 'Bonne répartition';
  if (score >= 40) return 'Répartition correcte';
  return 'Patrimoine concentré';
}

function NetWorthChart({ currency }: { currency: string }) {
  const perf = usePerformance();
  const [period, setPeriod] = useState('1A');
  const points = useMemo(() => filterPeriod(perf.data ?? [], period), [perf.data, period]);
  const first = points[0]?.value;
  const last = points[points.length - 1]?.value;
  const gain = first !== undefined && last !== undefined ? last - first : null;

  if (perf.isError) return <ErrorState error={perf.error} onRetry={() => perf.refetch()} />;
  return (
    <>
      <CardHeader className="flex-wrap gap-2">
        <div>
          <CardTitle>Évolution du patrimoine</CardTitle>
          {gain !== null && points.length > 1 && (
            <p data-testid="period-gain" className={cn('text-sm font-medium tabular-nums mt-0.5', gain >= 0 ? 'text-[#34d399]' : 'text-[#f87171]')}>
              {gain >= 0 ? '+' : ''}{formatCurrency(gain, currency)} sur la période
            </p>
          )}
        </div>
        <Segmented label="Période" value={period} onChange={setPeriod} options={PERIOD_KEYS.map((p) => ({ value: p, label: p }))} />
      </CardHeader>
      {points.length < 2 ? (
        <p className="text-sm text-[#a0a0a6] py-16 text-center">La courbe se construit jour après jour : revenez demain pour voir vos premiers points.</p>
      ) : (
        <ChartOrTable
          label="évolution du patrimoine"
          chart={
            <div role="img" aria-label={`Patrimoine de ${formatCurrency(first!, currency)} à ${formatCurrency(last!, currency)}`}>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={points} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="nw" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={GOLD} stopOpacity={0.22} /><stop offset="100%" stopColor={GOLD} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke={gridStroke} />
                  <XAxis dataKey="date" tick={axisTick} axisLine={false} tickLine={false} minTickGap={48} tickFormatter={(d) => new Date(d).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })} />
                  <YAxis tick={axisTick} axisLine={false} tickLine={false} width={56} domain={['auto', 'auto']} tickFormatter={(v) => formatCompact(v, currency)} />
                  <Tooltip {...tooltipProps} labelFormatter={(d) => formatDate(String(d))} formatter={(v) => [formatCurrency(Number(v), currency), 'Patrimoine net']} />
                  <Area type="monotone" dataKey="value" stroke={GOLD} strokeWidth={2} fill="url(#nw)" {...CHART_ANIM} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          }
          table={
            <div className="max-h-[260px] overflow-y-auto">
              <table className="w-full text-sm"><thead><tr className="text-left text-[#8e8e98] text-xs"><th className="pb-2 font-medium">Date</th><th className="pb-2 font-medium text-right">Patrimoine net</th></tr></thead>
                <tbody>{[...points].reverse().map((p) => <tr key={p.date} className="border-t border-white/[0.04]"><td className="py-2 text-[#a0a0a6]">{formatDate(p.date)}</td><td className="py-2 text-right tabular-nums text-[#f5f5f5]">{formatCurrency(p.value, currency)}</td></tr>)}</tbody>
              </table>
            </div>
          }
        />
      )}
    </>
  );
}

function TopPositions({ holdings, currency }: { holdings: Holding[]; currency: string }) {
  const top = [...holdings].sort((a, b) => b.quantity * b.currentPrice - a.quantity * a.currentPrice).slice(0, 5);
  if (!top.length) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Principales positions</CardTitle>
        <Link href="/dashboard/portfolio" className="text-xs font-medium text-[#f4be7e] flex items-center gap-1 min-h-9">Tout voir <ArrowRight size={13} /></Link>
      </CardHeader>
      <ul className="divide-y divide-white/[0.05]">
        {top.map((h) => {
          const value = h.quantity * h.currentPrice;
          const cost = h.quantity * h.avgPrice;
          const pct = cost > 0 ? ((value - cost) / cost) * 100 : 0;
          return (
            <li key={h.id}>
              <Link href={`/dashboard/accounts/${h.accountId}`} className="flex items-center justify-between gap-3 py-3 hover:bg-white/[0.02] -mx-2 px-2 rounded-[10px]">
                <span className="min-w-0"><span className="block font-medium text-[#f5f5f5] text-sm">{h.symbol}</span><span className="block text-xs text-[#8e8e98] truncate">{h.name}</span></span>
                <span className="text-right shrink-0"><span className="block font-medium tabular-nums text-sm text-[#f5f5f5]">{formatCurrency(value, h.currency)}</span><span className={cn('block text-xs tabular-nums', pct >= 0 ? 'text-[#34d399]' : 'text-[#f87171]')}>{formatPercent(pct)}</span></span>
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="sr-only">Montants en {currency}</p>
    </Card>
  );
}

function Welcome() {
  return (
    <Card>
      <EmptyState
        icon={<Wallet size={26} />}
        title="Commençons par votre premier compte"
        text="Connectez votre banque ou saisissez un compte à la main : votre patrimoine net s'affiche aussitôt."
        action={
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/dashboard/connections"><Button className="w-full"><Link2 size={16} className="mr-2" />Connecter un compte</Button></Link>
            <Link href="/dashboard/accounts?add=1"><Button variant="outline" className="w-full"><Plus size={16} className="mr-2" />Saisir à la main</Button></Link>
          </div>
        }
      />
    </Card>
  );
}

function Overview({ s }: { s: Summary }) {
  const holdings = useHoldings();
  const change = s.change30d;
  return (
    <div className="space-y-4 sm:space-y-6">
      <section aria-label="Patrimoine net" className="pt-1">
        <p className="text-sm text-[#a0a0a6]">Patrimoine net</p>
        <p data-testid="net-worth" className="text-4xl sm:text-5xl font-bold tracking-tight tabular-nums text-[#f5f5f5] mt-1">{formatCurrency(s.netWorth, s.currency)}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm">
          {change !== null && (
            <span className={cn('inline-flex items-center gap-1 font-medium tabular-nums', change >= 0 ? 'text-[#34d399]' : 'text-[#f87171]')}>
              {change >= 0 ? <TrendingUp size={15} /> : <TrendingDown size={15} />}{formatPercent(change)} sur 30 jours
            </span>
          )}
          <span className="text-[#8e8e98]">Mis à jour {formatRelativeTime(s.lastSync).toLowerCase()}</span>
        </div>
      </section>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Actifs" value={formatCurrency(s.assets, s.currency)} icon={<Wallet size={17} className="text-[#f4be7e]" />} hint={`${s.accountCount} compte${s.accountCount > 1 ? 's' : ''}${s.errorCount ? ` · ${s.errorCount} en erreur` : ''}`} />
        <StatCard label="Dettes" value={formatCurrency(s.debts, s.currency)} icon={<TrendingDown size={17} className="text-[#f87171]" />} hint={s.debts > 0 && s.assets > 0 ? `${Math.round((s.debts / s.assets) * 100)} % des actifs` : 'Aucune dette'} />
        <StatCard label="Revenus passifs (12 mois)" value={formatCurrency(s.passiveIncome, s.currency)} icon={<DollarSign size={17} className="text-[#34d399]" />} hint="Dividendes versés" />
        <StatCard label="Diversification" value={`${s.diversification}/100`} icon={<Target size={17} className="text-[#a78bfa]" />} hint={diversificationLabel(s.diversification)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="lg:col-span-2 min-w-0"><NetWorthChart currency={s.currency} /></Card>
        <Card className="min-w-0">
          <CardHeader><CardTitle>Répartition des actifs</CardTitle></CardHeader>
          {s.allocation.length ? <AllocationDonut slices={s.allocation} currency={s.currency} /> : <p className="text-sm text-[#a0a0a6] py-10 text-center">Aucun actif pour l&apos;instant.</p>}
        </Card>
      </div>
      <TopPositions holdings={holdings.data ?? []} currency={s.currency} />
    </div>
  );
}

export default function DashboardPage() {
  const summary = useSummary();
  return (
    <div className="space-y-4">
      <PageHeader title="Vue d'ensemble" />
      <Loader query={summary} skeleton={<PageSkeleton />}>
        {(s) => (s.accountCount === 0 ? <Welcome /> : <Overview s={s} />)}
      </Loader>
    </div>
  );
}
