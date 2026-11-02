'use client';

import { useMemo, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { ArrowRight, DollarSign, Link2, Plus, Target, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { EmptyState, ErrorState, Loader, PageHeader, PageSkeleton, Segmented, StatCard } from '@/components/ui/kit';
import { AllocationDonut, CHART_ANIM, ChartOrTable, GOLD, axisTick, gridStroke, tooltipProps } from '@/components/charts/kit';
import { useHoldings, usePerformance, useSummary } from '@/hooks/data';
import { PERIOD_KEYS, filterPeriod } from '@/lib/finance';
import { useFinanceLabels } from '@/hooks/useFinanceLabels';
import { formatAxisMonth, formatCompact, formatCurrency, formatDate, formatPercent, formatRelativeTime, cn } from '@/lib/utils';
import type { Holding, Summary } from '@/types';

const diversificationKey = (score: number) => (score >= 70 ? 'good' : score >= 40 ? 'ok' : 'concentrated');

function NetWorthChart({ currency }: { currency: string }) {
  const t = useTranslations('home');
  const labels = useFinanceLabels();
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
          <CardTitle>{t('chartTitle')}</CardTitle>
          {gain !== null && points.length > 1 && (
            <p data-testid="period-gain" className={cn('text-sm font-medium tabular-nums mt-0.5', gain >= 0 ? 'text-pos' : 'text-neg')}>
              {t.rich('periodGain', { amount: () => <bdi>{gain >= 0 ? '+' : ''}{formatCurrency(gain, currency)}</bdi> })}
            </p>
          )}
        </div>
        <Segmented label={t('period')} value={period} onChange={setPeriod} options={PERIOD_KEYS.map((p) => ({ value: p, label: labels.period(p) }))} />
      </CardHeader>
      {points.length < 2 ? (
        <p className="text-sm text-muted py-16 text-center">{t('building')}</p>
      ) : (
        <ChartOrTable
          label={t('chartLabel')}
          chart={
            <div role="img" aria-label={t('chartAria', { from: formatCurrency(first!, currency), to: formatCurrency(last!, currency) })}>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={points} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid vertical={false} stroke={gridStroke} />
                  <XAxis dataKey="date" tick={axisTick} axisLine={false} tickLine={false} minTickGap={48} tickFormatter={formatAxisMonth} />
                  <YAxis tick={axisTick} axisLine={false} tickLine={false} width={56} domain={['auto', 'auto']} tickFormatter={(v) => formatCompact(v, currency)} />
                  <Tooltip {...tooltipProps} labelFormatter={(d) => formatDate(String(d))} formatter={(v) => [formatCurrency(Number(v), currency), t('netWorth')]} />
                  <Area type="monotone" dataKey="value" stroke={GOLD} strokeWidth={2} fill={GOLD} fillOpacity={0.06} {...CHART_ANIM} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          }
          table={
            <div className="max-h-[260px] overflow-y-auto">
              <table className="w-full text-sm"><thead><tr className="text-start text-subtle text-xs"><th className="pb-2 font-medium">{t('date')}</th><th className="pb-2 font-medium text-end">{t('netWorth')}</th></tr></thead>
                <tbody>{[...points].reverse().map((p) => <tr key={p.date} className="border-t border-line"><td className="py-2 text-muted">{formatDate(p.date)}</td><td className="py-2 text-end tabular-nums text-ink">{formatCurrency(p.value, currency)}</td></tr>)}</tbody>
              </table>
            </div>
          }
        />
      )}
    </>
  );
}

function TopPositions({ holdings, currency }: { holdings: Holding[]; currency: string }) {
  const t = useTranslations('home');
  const top = [...holdings].sort((a, b) => b.quantity * b.currentPrice - a.quantity * a.currentPrice).slice(0, 5);
  if (!top.length) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('topPositions')}</CardTitle>
        <Link href="/dashboard/portfolio" className="text-xs font-medium text-accent flex items-center gap-1 min-h-9">{t('seeAll')} <ArrowRight size={13} className="rtl:-scale-x-100" /></Link>
      </CardHeader>
      <ul className="divide-y divide-line">
        {top.map((h) => {
          const value = h.quantity * h.currentPrice;
          const cost = h.quantity * h.avgPrice;
          const pct = cost > 0 ? ((value - cost) / cost) * 100 : 0;
          return (
            <li key={h.id}>
              <Link href={`/dashboard/accounts/${h.accountId}`} className="flex items-center justify-between gap-3 py-3 hover:bg-hover -mx-2 px-2 rounded-[10px]">
                <span className="min-w-0"><span className="block font-medium text-ink text-sm">{h.symbol}</span><span className="block text-xs text-subtle truncate">{h.name}</span></span>
                <span className="text-end shrink-0"><span className="block font-medium tabular-nums text-sm text-ink">{formatCurrency(value, h.currency)}</span><bdi className={cn('block text-xs tabular-nums', pct >= 0 ? 'text-pos' : 'text-neg')}>{formatPercent(pct)}</bdi></span>
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="sr-only">{t('amountsIn', { currency })}</p>
    </Card>
  );
}

function Welcome() {
  const t = useTranslations('home');
  return (
    <Card>
      <EmptyState
        icon={<Wallet size={26} />}
        title={t('welcomeTitle')}
        text={t('welcomeText')}
        action={
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/dashboard/connections"><Button className="w-full"><Link2 size={16} className="me-2" />{t('connect')}</Button></Link>
            <Link href="/dashboard/accounts?add=1"><Button variant="outline" className="w-full"><Plus size={16} className="me-2" />{t('manual')}</Button></Link>
          </div>
        }
      />
    </Card>
  );
}

function Overview({ s }: { s: Summary }) {
  const t = useTranslations('home');
  const labels = useFinanceLabels();
  const allocation = s.allocation.map((a) => ({ ...a, name: labels.assetClass(a.key, a.name) }));
  const holdings = useHoldings();
  const change = s.change30d;
  return (
    <div className="space-y-4 sm:space-y-6">
      <section aria-label={t('netWorth')} className="pt-1">
        <p className="text-sm text-muted">{t('netWorth')}</p>
        <p data-testid="net-worth" className="text-4xl sm:text-5xl font-semibold tracking-tight tabular-nums text-ink mt-1"><bdi>{formatCurrency(s.netWorth, s.currency)}</bdi></p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm">
          {change !== null && (
            <span className={cn('inline-flex items-center gap-1 font-medium tabular-nums', change >= 0 ? 'text-pos' : 'text-neg')}>
              {change >= 0 ? <TrendingUp size={15} /> : <TrendingDown size={15} />}{t.rich('change30d', { value: () => <bdi>{formatPercent(change)}</bdi> })}
            </span>
          )}
          <span className="text-subtle">{t('updated', { when: formatRelativeTime(s.lastSync).toLowerCase() })}</span>
        </div>
      </section>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label={t('assets')} value={formatCurrency(s.assets, s.currency)} icon={<Wallet size={17} className="text-subtle" />} hint={`${t('accountCount', { count: s.accountCount })}${s.errorCount ? ` · ${t('errorCount', { count: s.errorCount })}` : ''}`} />
        <StatCard label={t('debts')} value={formatCurrency(s.debts, s.currency)} icon={<TrendingDown size={17} className="text-subtle" />} hint={s.debts > 0 && s.assets > 0 ? t('debtShare', { percent: Math.round((s.debts / s.assets) * 100) }) : t('noDebt')} />
        <StatCard label={t('passive')} value={formatCurrency(s.passiveIncome, s.currency)} icon={<DollarSign size={17} className="text-subtle" />} hint={t('passiveHint')} />
        <StatCard label={t('diversificationTitle')} value={<bdi>{s.diversification}/100</bdi>} icon={<Target size={17} className="text-subtle" />} hint={t(`diversification.${diversificationKey(s.diversification)}`)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="lg:col-span-2 min-w-0"><NetWorthChart currency={s.currency} /></Card>
        <Card className="min-w-0">
          <CardHeader><CardTitle>{t('allocation')}</CardTitle></CardHeader>
          {allocation.length ? <AllocationDonut slices={allocation} currency={s.currency} /> : <p className="text-sm text-muted py-10 text-center">{t('noAssets')}</p>}
        </Card>
      </div>
      <TopPositions holdings={holdings.data ?? []} currency={s.currency} />
    </div>
  );
}

export default function DashboardPage() {
  const tn = useTranslations('nav');
  const summary = useSummary();
  return (
    <div className="space-y-4">
      <PageHeader title={tn('overview')} />
      <Loader query={summary} skeleton={<PageSkeleton />}>
        {(s) => (s.accountCount === 0 ? <Welcome /> : <Overview s={s} />)}
      </Loader>
    </div>
  );
}
