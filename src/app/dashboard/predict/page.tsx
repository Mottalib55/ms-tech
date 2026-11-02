'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw, Target, TrendingUp, Waves } from 'lucide-react';
import { Area, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { PageHeader, StatCard } from '@/components/ui/kit';
import { CHART_ANIM, ChartOrTable, GOLD, Legend, axisTick, gridStroke, tooltipProps } from '@/components/charts/kit';
import { toField, toNumber } from '@/components/forms/numbers';
import { useSummary } from '@/hooks/data';
import { runMonteCarlo } from '@/lib/simulation';
import { formatCompact, formatCurrency } from '@/lib/utils';
import type { MonteCarloParams } from '@/types';

const BAND = '#5b86f0';
const SCENARIOS = 2000;

const FIELDS: { key: keyof MonteCarloParams; label: (c: string) => string; max: number }[] = [
  { key: 'currentAge', label: () => 'Âge actuel', max: 120 },
  { key: 'retirementAge', label: () => 'Âge cible', max: 120 },
  { key: 'currentCapital', label: (c) => `Capital actuel (${c})`, max: 1e12 },
  { key: 'monthlyContribution', label: (c) => `Épargne mensuelle (${c})`, max: 1e9 },
  { key: 'expectedReturn', label: () => 'Rendement annuel espéré (%)', max: 50 },
  { key: 'volatility', label: () => 'Volatilité annuelle (%)', max: 100 },
  { key: 'inflation', label: () => 'Inflation (%)', max: 50 },
  { key: 'targetAmount', label: (c) => `Objectif (${c})`, max: 1e12 },
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

export default function PredictPage() {
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
  const unit = currency === 'EUR' ? 'euros' : currency;

  return (
    <div className="space-y-5">
      <PageHeader title="Projections" subtitle={`${SCENARIOS.toLocaleString('fr-FR')} scénarios de marché simulés à partir de vos hypothèses`} />

      {valid && last ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <StatCard label="Objectif atteint à" value={<span data-testid="target-age">{reachedAt !== undefined ? `${reachedAt} ans` : 'Non atteint'}</span>} icon={<Target size={17} className="text-[#f4be7e]" />} hint={reachedAt !== undefined ? 'Dans le scénario médian' : `Pas avant ${params.retirementAge} ans dans le scénario médian`} />
          <StatCard label={`Capital médian à ${params.retirementAge} ans`} value={<span data-testid="median-final">{formatCurrency(last.median, currency)}</span>} icon={<TrendingUp size={17} className="text-[#5b86f0]" />} />
          <StatCard label="Fourchette probable" value={`${formatCompact(last.p10, currency)} – ${formatCompact(last.p90, currency)}`} icon={<Waves size={17} className="text-[#a78bfa]" />} hint="8 scénarios sur 10 tombent dans cet intervalle" />
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="min-w-0 lg:order-2">
          <CardHeader><CardTitle>Vos hypothèses</CardTitle></CardHeader>
          <div className="space-y-4">
            {FIELDS.map((f) => (
              <Input
                key={f.key}
                id={`predict-${f.key}`}
                label={f.label(currency)}
                inputMode="decimal"
                value={form[f.key]}
                onChange={(e) => { touched.current = true; const value = e.target.value.replace(/-/g, ''); setForm((x) => ({ ...x, [f.key]: value })); }}
                autoComplete="off"
              />
            ))}
            <Button variant="outline" className="w-full" onClick={() => { touched.current = false; const d = defaults(netWorth); setForm(d); setParams(parse(d)); }}><RotateCcw size={14} className="mr-2" />Réinitialiser</Button>
          </div>
        </Card>

        <Card className="lg:col-span-3 min-w-0 lg:order-1">
          <CardHeader><CardTitle>Évolution projetée</CardTitle></CardHeader>
          {!valid || !last ? (
            <p role="alert" className="text-sm text-[#f4be7e] py-16 text-center">L&apos;âge cible doit être supérieur à votre âge actuel.</p>
          ) : (
            <ChartOrTable
              label="évolution projetée"
              chart={
                <div>
                  <div role="img" aria-label={`Capital médian de ${formatCurrency(last.median, currency)} à ${params.retirementAge} ans`}>
                    <div className="h-[340px] lg:h-[560px]"><ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chart} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
                        <CartesianGrid vertical={false} stroke={gridStroke} />
                        <XAxis dataKey="age" tick={axisTick} axisLine={false} tickLine={false} minTickGap={24} tickFormatter={(a) => `${a} ans`} />
                        <YAxis tick={axisTick} axisLine={false} tickLine={false} width={56} tickFormatter={(v) => formatCompact(v, currency)} />
                        <Tooltip
                          {...tooltipProps}
                          labelFormatter={(a) => `À ${a} ans`}
                          formatter={(v, n) => [Array.isArray(v) ? `${formatCurrency(Number(v[0]), currency)} – ${formatCurrency(Number(v[1]), currency)}` : formatCurrency(Number(v), currency), String(n)]}
                        />
                        <Area type="monotone" dataKey="band" name="Fourchette probable" stroke="none" fill={BAND} fillOpacity={0.18} {...CHART_ANIM} />
                        <Line type="monotone" dataKey="median" name="Scénario médian" stroke={GOLD} strokeWidth={2} dot={false} {...CHART_ANIM} />
                        {params.targetAmount > 0 && <ReferenceLine y={params.targetAmount} stroke="#a0a0a6" strokeDasharray="4 4" label={{ value: 'Objectif', fill: '#a0a0a6', fontSize: 11, position: 'insideTopLeft' }} />}
                      </ComposedChart>
                    </ResponsiveContainer></div>
                  </div>
                  <Legend items={[{ name: 'Scénario médian', color: GOLD }, { name: 'Fourchette probable (8 scénarios sur 10)', color: BAND }]} />
                </div>
              }
              table={
                <div className="max-h-[340px] lg:max-h-[560px] overflow-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-xs text-[#8e8e98]"><th className="pb-2 font-medium text-left">Âge</th><th className="pb-2 font-medium text-right">Bas</th><th className="pb-2 font-medium text-right">Médian</th><th className="pb-2 font-medium text-right">Haut</th></tr></thead>
                    <tbody>{results.map((r) => <tr key={r.age} className="border-t border-white/[0.05] tabular-nums text-[#f5f5f5]"><td className="py-2 text-[#a0a0a6]">{r.age}</td><td className="py-2 text-right whitespace-nowrap pl-3">{formatCurrency(r.p10, currency)}</td><td className="py-2 text-right whitespace-nowrap pl-3">{formatCurrency(r.median, currency)}</td><td className="py-2 text-right whitespace-nowrap pl-3">{formatCurrency(r.p90, currency)}</td></tr>)}</tbody>
                  </table>
                </div>
              }
            />
          )}
          <p className="text-xs text-[#8e8e98] mt-4">Projection statistique, et non un conseil en investissement ni une garantie de résultat. Montants en {unit} constants, c&apos;est-à-dire corrigés de l&apos;inflation.</p>
        </Card>
      </div>
    </div>
  );
}
