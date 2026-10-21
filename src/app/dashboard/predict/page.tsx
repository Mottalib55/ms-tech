'use client';

import { useState, useMemo } from 'react';
import { Target, TrendingUp, Calendar } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import AnimatedNumber from '@/components/ui/AnimatedNumber';
import ProgressRing from '@/components/ui/ProgressRing';
import { runMonteCarlo } from '@/lib/simulation';
import { formatCurrency } from '@/lib/utils';
import { MonteCarloParams } from '@/types';

const defaultParams: MonteCarloParams = {
  currentAge: 32,
  retirementAge: 55,
  currentCapital: 396271,
  monthlyContribution: 1500,
  expectedReturn: 7,
  volatility: 15,
  inflation: 2,
  targetAmount: 1000000,
};

const tooltipStyle = {
  backgroundColor: 'rgba(20,20,22,0.92)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
};

export default function PredictPage() {
  const [params, setParams] = useState(defaultParams);

  const results = useMemo(() => runMonteCarlo(params, 5000), [params]);

  const fireAge = results.find((r) => r.median >= params.targetAmount)?.age;

  const medianFinal = results[results.length - 1]?.median || 0;
  const p10Final = results[results.length - 1]?.p10 || 0;
  const p90Final = results[results.length - 1]?.p90 || 0;

  const fireProgress = fireAge ? Math.min(((fireAge - params.currentAge) / (params.retirementAge - params.currentAge)) * 100, 100) : 0;

  const handleChange = (field: keyof MonteCarloParams, value: string) => {
    setParams((prev) => ({ ...prev, [field]: Number(value) }));
  };

  return (
    <div className="space-y-6">
      <div className="animate-in">
        <h1 className="text-2xl font-bold text-[#f5f5f5]">Predict</h1>
        <p className="text-[#a0a0a6] text-sm mt-1">Simulation Monte Carlo — 5 000 scénarios</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="highlighted" className="animate-in animate-in-1">
          <div className="flex items-center gap-4">
            <ProgressRing value={fireProgress} size={72} strokeWidth={6} label="FIRE" />
            <div>
              <p className="text-sm text-[#a0a0a6]">Indépendance financière</p>
              <p className="text-xl font-bold text-[#f5f5f5]">{fireAge ? `${fireAge} ans` : 'Non atteint'}</p>
            </div>
          </div>
        </Card>
        <Card className="animate-in animate-in-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#5682f2]/10 rounded-[12px] flex items-center justify-center">
              <TrendingUp size={20} className="text-[#5682f2]" />
            </div>
            <div>
              <p className="text-sm text-[#a0a0a6]">Capital médian à {params.retirementAge} ans</p>
              <p className="text-xl font-bold text-[#f5f5f5]">
                <AnimatedNumber value={medianFinal} format={(n) => formatCurrency(n)} />
              </p>
            </div>
          </div>
        </Card>
        <Card className="animate-in animate-in-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#f4be7e]/10 rounded-[12px] flex items-center justify-center">
              <Calendar size={20} className="text-[#f4be7e]" />
            </div>
            <div>
              <p className="text-sm text-[#a0a0a6]">Fourchette (P10-P90)</p>
              <p className="text-lg font-bold text-[#f5f5f5]">
                {formatCurrency(p10Final)} — {formatCurrency(p90Final)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-3 animate-in animate-in-4">
          <CardHeader>
            <CardTitle>Projection patrimoniale</CardTitle>
          </CardHeader>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={results}>
              <XAxis dataKey="age" tick={{ fill: '#6b6b73', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b6b73', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} width={50} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value, name) => [formatCurrency(Math.round(Number(value))), String(name)]}
              />
              <ReferenceLine y={params.targetAmount} stroke="#f4be7e" strokeDasharray="5 5" label={{ value: 'Objectif', fill: '#f4be7e', fontSize: 12 }} />
              <Area type="monotone" dataKey="optimistic" fill="#34d399" fillOpacity={0.05} stroke="transparent" name="Optimiste (P95)" />
              <Area type="monotone" dataKey="p90" fill="#34d399" fillOpacity={0.1} stroke="transparent" name="P90" />
              <Area type="monotone" dataKey="median" fill="#f4be7e" fillOpacity={0.1} stroke="#f4be7e" strokeWidth={2.5} name="Médian" />
              <Area type="monotone" dataKey="p10" fill="#f4be7e" fillOpacity={0.05} stroke="transparent" name="P10" />
              <Area type="monotone" dataKey="pessimistic" fill="#f87171" fillOpacity={0.02} stroke="#6b6b73" strokeWidth={1} strokeDasharray="3 3" name="Pessimiste (P5)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="animate-in animate-in-5">
          <CardHeader>
            <CardTitle>Paramètres</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <Input id="currentAge" label="Âge actuel" type="number" value={params.currentAge} onChange={(e) => handleChange('currentAge', e.target.value)} />
            <Input id="retirementAge" label="Âge cible" type="number" value={params.retirementAge} onChange={(e) => handleChange('retirementAge', e.target.value)} />
            <Input id="currentCapital" label="Capital actuel (€)" type="number" value={params.currentCapital} onChange={(e) => handleChange('currentCapital', e.target.value)} />
            <Input id="monthlyContribution" label="Épargne mensuelle (€)" type="number" value={params.monthlyContribution} onChange={(e) => handleChange('monthlyContribution', e.target.value)} />
            <Input id="expectedReturn" label="Rendement espéré (%)" type="number" step="0.1" value={params.expectedReturn} onChange={(e) => handleChange('expectedReturn', e.target.value)} />
            <Input id="volatility" label="Volatilité (%)" type="number" step="0.1" value={params.volatility} onChange={(e) => handleChange('volatility', e.target.value)} />
            <Input id="inflation" label="Inflation (%)" type="number" step="0.1" value={params.inflation} onChange={(e) => handleChange('inflation', e.target.value)} />
            <Input id="targetAmount" label="Objectif (€)" type="number" value={params.targetAmount} onChange={(e) => handleChange('targetAmount', e.target.value)} />
            <Button variant="outline" className="w-full" onClick={() => setParams(defaultParams)}>
              Réinitialiser
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
