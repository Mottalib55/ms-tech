'use client';

import { AlertTriangle, TrendingDown, Lightbulb } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import AnimatedNumber from '@/components/ui/AnimatedNumber';
import { useFees } from '@/hooks/useFees';
import { formatCurrency, formatCurrencyDetailed } from '@/lib/utils';

const feeTypeLabels: Record<string, string> = {
  management: 'Gestion',
  transaction: 'Transaction',
  custody: 'Garde',
  exchange: 'Change',
  performance: 'Performance',
};

const tooltipStyle = {
  backgroundColor: 'rgba(20,20,22,0.92)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
};

function generateImpactData(fees: { amount: number; percentage: number; alternativeFee?: number }[]) {
  const totalAnnualFees = fees.reduce((s, f) => s + f.amount, 0);
  const capital = 396271;
  const rate = 0.07;
  const data = [];
  let withFees = capital;
  let withoutFees = capital;
  let optimized = capital;
  const optimizedFees = fees.reduce((s, f) => s + (f.alternativeFee !== undefined ? (f.amount * (f.alternativeFee / f.percentage)) : f.amount), 0);

  for (let year = 0; year <= 30; year++) {
    data.push({
      year: `${year} ans`,
      'Avec frais actuels': Math.round(withFees),
      'Sans frais': Math.round(withoutFees),
      'Frais optimisés': Math.round(optimized),
    });
    withFees = withFees * (1 + rate) - totalAnnualFees;
    withoutFees = withoutFees * (1 + rate);
    optimized = optimized * (1 + rate) - optimizedFees;
  }
  return data;
}

export default function FeesPage() {
  const { data: fees } = useFees();
  const feesList = fees ?? [];

  const impactData = generateImpactData(feesList);
  const totalAnnualFees = feesList.reduce((s, f) => s + f.amount, 0);
  const potentialSavings = feesList
    .filter((f) => f.alternativeFee !== undefined)
    .reduce((s, f) => s + (f.amount - (f.amount * (f.alternativeFee! / f.percentage))), 0);

  return (
    <div className="space-y-6">
      <div className="animate-in">
        <h1 className="text-2xl font-bold text-[#f5f5f5]">Scanner de frais</h1>
        <p className="text-[#a0a0a6] text-sm mt-1">Détectez et optimisez vos frais bancaires et de courtage</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="animate-in animate-in-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#f87171]/10 rounded-[12px] flex items-center justify-center">
              <AlertTriangle size={20} className="text-[#f87171]" />
            </div>
            <div>
              <p className="text-sm text-[#a0a0a6]">Frais annuels totaux</p>
              <p className="text-xl font-bold text-[#f5f5f5]">
                <AnimatedNumber value={totalAnnualFees} format={(n) => formatCurrencyDetailed(n)} />
              </p>
            </div>
          </div>
        </Card>
        <Card className="animate-in animate-in-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#f4be7e]/10 rounded-[12px] flex items-center justify-center">
              <Lightbulb size={20} className="text-[#f4be7e]" />
            </div>
            <div>
              <p className="text-sm text-[#a0a0a6]">Économies possibles</p>
              <p className="text-xl font-bold text-[#34d399]">
                <AnimatedNumber value={potentialSavings} format={(n) => `${formatCurrencyDetailed(n)}/an`} delay={200} />
              </p>
            </div>
          </div>
        </Card>
        <Card className="animate-in animate-in-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#a78bfa]/10 rounded-[12px] flex items-center justify-center">
              <TrendingDown size={20} className="text-[#a78bfa]" />
            </div>
            <div>
              <p className="text-sm text-[#a0a0a6]">Impact sur 20 ans</p>
              <p className="text-xl font-bold text-[#f87171]">
                -{formatCurrency(impactData[20] ? impactData[20]['Sans frais'] - impactData[20]['Avec frais actuels'] : 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="animate-in animate-in-4">
        <CardHeader>
          <CardTitle>Impact des frais sur le long terme</CardTitle>
        </CardHeader>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={impactData}>
            <XAxis dataKey="year" tick={{ fill: '#6b6b73', fontSize: 11 }} axisLine={false} tickLine={false} interval={4} />
            <YAxis tick={{ fill: '#6b6b73', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} width={50} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value) => [formatCurrency(Number(value)), '']}
            />
            <Legend />
            <Area type="monotone" dataKey="Sans frais" fill="#f4be7e" fillOpacity={0.1} stroke="#f4be7e" strokeWidth={2} />
            <Area type="monotone" dataKey="Frais optimisés" fill="#5682f2" fillOpacity={0.1} stroke="#5682f2" strokeWidth={2} />
            <Area type="monotone" dataKey="Avec frais actuels" fill="#f87171" fillOpacity={0.1} stroke="#f87171" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <Card className="animate-in animate-in-5">
        <CardHeader>
          <CardTitle>Détail des frais</CardTitle>
        </CardHeader>
        <div className="space-y-4">
          {feesList.map((fee) => (
            <div key={fee.id} className="p-4 bg-[rgba(255,255,255,0.03)] rounded-[12px] border border-[rgba(255,255,255,0.04)]">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-[#f5f5f5] text-sm">{fee.label}</h3>
                    <Badge>{feeTypeLabels[fee.type]}</Badge>
                  </div>
                  <p className="text-xs text-[#6b6b73] mt-0.5">{fee.accountName}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#f5f5f5]">{formatCurrencyDetailed(fee.amount)}</p>
                  <p className="text-xs text-[#6b6b73]">{fee.percentage}% &middot; {fee.frequency === 'annual' ? 'Annuel' : fee.frequency === 'monthly' ? 'Mensuel' : 'Par transaction'}</p>
                </div>
              </div>
              {fee.suggestion && (
                <div className="mt-2 flex items-start gap-2 bg-[#f4be7e]/8 border border-[#f4be7e]/15 rounded-[10px] p-3">
                  <Lightbulb size={16} className="text-[#f4be7e] mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="text-[#f4be7e]">{fee.suggestion}</p>
                    {fee.alternativeFee !== undefined && (
                      <p className="text-[#a0a0a6] mt-1">
                        Frais alternatif : <span className="text-[#34d399]">{fee.alternativeFee}%</span> (vs {fee.percentage}% actuel)
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
