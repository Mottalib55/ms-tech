'use client';

import ClientOnly from '@/components/ui/ClientOnly';
import { PageSkeleton } from '@/components/ui/kit';
import { useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw, Target, TrendingUp, Waves } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Area, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { PageHeader, StatCard } from '@/components/ui/kit';
import { CHART_ANIM, ChartOrTable, GOLD, Legend, axisTick, gridStroke, tooltipProps } from '@/components/charts/kit';
import { toField, toNumber } from '@/components/forms/numbers';
import { useSummary } from '@/hooks/data';
import { runMonteCarlo } from '@/lib/simulation';
import { formatCompact, formatCurrency, formatNumber } from '@/lib/utils';
import type { MonteCarloParams } from '@/types';

const BAND = 'var(--c2)';
const SCENARIOS = 2000;

const FIELDS: { key: keyof MonteCarloParams; max: number }[] = [
  { key: 'currentAge', max: 120 },
  { key: 'retirementAge', max: 120 },
  { key: 'currentCapital', max: 1e12 },
  { key: 'monthlyContribution', max: 1e9 },
  { key: 'expectedReturn', max: 50 },
  { key: 'volatility', max: 100 },
  { key: 'inflation', max: 50 },
  { key: 'targetAmount', max: 1e12 },
];

type Form = Record<keyof MonteCarloParams, string>;

// A fixed seed: the same inputs always draw the same curve, so a figure only
// moves when an input does, not on every keystroke.
function seeded(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const defaults = (capital: number | undefined): Form => ({
  currentAge: '35', retirementAge: '60',
  currentCapital: capital === undefined ? '0' : toField(Math.max(0, Math.round(capital))),
  monthlyContribution: '500', expectedReturn: '7', volatility: '15', inflation: '2', targetAmount: '1000000',
});

function parse(form: Form): MonteCarloParams {
  const out = {} as MonteCarloParams;
  for (const f of FIELDS) out[f.key] = toNumber(form[f.key], f.max);
  return out;
}

function PredictPageContent() {
  const t = useTranslations('predict');
  const summary = useSummary();
  const currency = summary.data?.currency ?? 'EUR';
  const netWorth = summary.data?.netWorth;
  const [form, setForm] = useState<Form>(() => defaults(netWorth));
  const [params, setParams] = useState<MonteCarloParams>(() => parse(defaults(netWorth)));
  const touched = useRef(false);

  useEffect(() => {
    if (!touched.current && netWorth !== undefined) setForm(defaults(netWorth));
  }, [netWorth]);

  // Typing stays instant: the simulation only runs once the keyboard pauses.
  useEffect(() => {
    const timer = setTimeout(() => setParams(parse(form)), 250);
    return () => clearTimeout(timer);
  }, [form]);

  const valid = params.retirementAge > params.currentAge;
  const results = useMemo(() => (valid ? runMonteCarlo(params, SCENARIOS, seeded(42)) : []), [params, valid]);
  const chart = useMemo(() => results.map((r) => ({ ...r, band: [r.p10, r.p90] as [number, number] })), [results]);
  const last = results[results.length - 1];
  const reachedAt = results.find((r) => r.median >= params.targetAmount)?.age;
  const unit = currency === 'EUR' ? t('euros') : currency;

  return (
    <div className="space-y-5">
      <PageHeader title={t('title')} subtitle={t('subtitle', { count: formatNumber(SCENARIOS) })} />

      {valid && last ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <StatCard label={t('reachedAt')} value={<span data-testid="target-age">{reachedAt !== undefined ? t('age', { age: reachedAt }) : t('notReached')}</span>} icon={<Target size={17} className="text-muted" />} hint={reachedAt !== undefined ? t('medianScenario') : t('notBefore', { age: params.retirementAge })} />
          <StatCard label={t('medianAt', { age: params.retirementAge })} value={<span data-testid="median-final">{formatCurrency(last.median, currency)}</span>} icon={<TrendingUp size={17} className="text-muted" />} />
          <StatCard label={t('range')} value={<bdi dir="ltr">{formatCompact(last.p10, currency)} – {formatCompact(last.p90, currency)}</bdi>} icon={<Waves size={17} className="text-muted" />} hint={t('rangeHint')} />
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="min-w-0 lg:order-2">
          <CardHeader><CardTitle>{t('assumptions')}</CardTitle></CardHeader>
          <div className="space-y-4">
            {FIELDS.map((f) => (
              <Input
                key={f.key}
                id={`predict-${f.key}`}
                label={t(`field.${f.key}`, { currency })}
                inputMode="decimal"
                value={form[f.key]}
                onChange={(e) => { touched.current = true; const value = e.target.value.replace(/-/g, ''); setForm((x) => ({ ...x, [f.key]: value })); }}
                autoComplete="off"
              />
            ))}
            <Button variant="outline" className="w-full" onClick={() => { touched.current = false; const d = defaults(netWorth); setForm(d); setParams(parse(d)); }}><RotateCcw size={14} className="me-2" />{t('reset')}</Button>
          </div>
        </Card>

        <Card className="lg:col-span-3 min-w-0 lg:order-1">
          <CardHeader><CardTitle>{t('evolution')}</CardTitle></CardHeader>
          {!valid || !last ? (
            <p role="alert" className="text-sm text-neg py-16 text-center">{t('invalidAge')}</p>
          ) : (
            <ChartOrTable
              label={t('chartLabel')}
              chart={
                <div>
                  <div role="img" aria-label={t('aria', { amount: formatCurrency(last.median, currency), age: params.retirementAge })}>
                    <div className="h-[340px] lg:h-[560px]"><ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chart} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
                        <CartesianGrid vertical={false} stroke={gridStroke} />
                        <XAxis dataKey="age" tick={axisTick} axisLine={false} tickLine={false} minTickGap={24} tickFormatter={(a) => t('ageTick', { age: a })} />
                        <YAxis tick={axisTick} axisLine={false} tickLine={false} width={56} tickFormatter={(v) => formatCompact(v, currency)} />
                        <Tooltip
                          {...tooltipProps}
                          labelFormatter={(a) => t('atAge', { age: String(a) })}
                          formatter={(v, n) => [Array.isArray(v) ? `${formatCurrency(Number(v[0]), currency)} – ${formatCurrency(Number(v[1]), currency)}` : formatCurrency(Number(v), currency), String(n)]}
                        />
                        <Area type="monotone" dataKey="band" name={t('range')} stroke="none" fill={BAND} fillOpacity={0.18} {...CHART_ANIM} />
                        <Line type="monotone" dataKey="median" name={t('median')} stroke={GOLD} strokeWidth={2} dot={false} {...CHART_ANIM} />
                        {params.targetAmount > 0 && <ReferenceLine y={params.targetAmount} stroke="var(--muted)" strokeDasharray="4 4" label={{ value: t('goal'), fill: 'var(--muted)', fontSize: 11, position: 'insideTopLeft' }} />}
                      </ComposedChart>
                    </ResponsiveContainer></div>
                  </div>
                  <Legend items={[{ name: t('median'), color: GOLD }, { name: t('rangeLegend'), color: BAND }]} />
                </div>
              }
              table={
                <div className="max-h-[340px] lg:max-h-[560px] overflow-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-xs text-subtle"><th className="pb-2 font-medium text-start">{t('col.age')}</th><th className="pb-2 font-medium text-end">{t('col.low')}</th><th className="pb-2 font-medium text-end">{t('col.median')}</th><th className="pb-2 font-medium text-end">{t('col.high')}</th></tr></thead>
                    <tbody>{results.map((r) => <tr key={r.age} className="border-t border-line tabular-nums text-ink"><td className="py-2 text-muted">{r.age}</td><td className="py-2 text-end whitespace-nowrap ps-3">{formatCurrency(r.p10, currency)}</td><td className="py-2 text-end whitespace-nowrap ps-3">{formatCurrency(r.median, currency)}</td><td className="py-2 text-end whitespace-nowrap ps-3">{formatCurrency(r.p90, currency)}</td></tr>)}</tbody>
                  </table>
                </div>
              }
            />
          )}
          <p className="text-xs text-subtle mt-4">{t('disclaimer', { unit })}</p>
        </Card>
      </div>
    </div>
  );
}

export default function PredictPage() {
  return <ClientOnly fallback={<PageSkeleton />}><PredictPageContent /></ClientOnly>;
}
