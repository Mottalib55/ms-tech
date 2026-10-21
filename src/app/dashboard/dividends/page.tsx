'use client';

import { CalendarDays, DollarSign, TrendingUp } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import AnimatedNumber from '@/components/ui/AnimatedNumber';
import { mockDividends } from '@/data/mock';
import { formatCurrency, formatCurrencyDetailed, formatDate } from '@/lib/utils';

const statusLabels: Record<string, { label: string; variant: 'success' | 'warning' | 'default' }> = {
  paid: { label: 'Versé', variant: 'success' },
  confirmed: { label: 'Confirmé', variant: 'warning' },
  projected: { label: 'Projeté', variant: 'default' },
};

const tooltipStyle = {
  backgroundColor: 'rgba(20,20,22,0.92)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
};

function getMonthlyDividends() {
  const months: Record<string, number> = {};
  mockDividends.forEach((d) => {
    const month = d.payDate.slice(0, 7);
    months[month] = (months[month] || 0) + d.amount;
  });
  return Object.entries(months)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({ month, amount: Math.round(amount) }));
}

const monthlyData = getMonthlyDividends();
const totalAnnual = mockDividends.reduce((s, d) => s + d.amount, 0);
const paidTotal = mockDividends.filter((d) => d.status === 'paid').reduce((s, d) => s + d.amount, 0);
const upcomingTotal = mockDividends.filter((d) => d.status !== 'paid').reduce((s, d) => s + d.amount, 0);

const topPayers = Object.entries(
  mockDividends.reduce((acc, d) => {
    acc[d.symbol] = (acc[d.symbol] || 0) + d.amount;
    return acc;
  }, {} as Record<string, number>)
)
  .sort(([, a], [, b]) => b - a)
  .slice(0, 5);

const medals = ['🥇', '🥈', '🥉', '4.', '5.'];

export default function DividendsPage() {
  return (
    <div className="space-y-6">
      <div className="animate-in">
        <h1 className="text-2xl font-bold text-[#f5f5f5]">Dividendes</h1>
        <p className="text-[#a0a0a6] text-sm mt-1">Calendrier, historique et projections de vos revenus passifs</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="animate-in animate-in-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#34d399]/10 rounded-[12px] flex items-center justify-center">
              <DollarSign size={20} className="text-[#34d399]" />
            </div>
            <div>
              <p className="text-sm text-[#a0a0a6]">Total annuel</p>
              <p className="text-xl font-bold text-[#f5f5f5]">
                <AnimatedNumber value={totalAnnual} format={(n) => formatCurrency(n)} />
              </p>
            </div>
          </div>
        </Card>
        <Card className="animate-in animate-in-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#5682f2]/10 rounded-[12px] flex items-center justify-center">
              <CalendarDays size={20} className="text-[#5682f2]" />
            </div>
            <div>
              <p className="text-sm text-[#a0a0a6]">Déjà versés</p>
              <p className="text-xl font-bold text-[#34d399]">
                <AnimatedNumber value={paidTotal} format={(n) => formatCurrency(n)} delay={100} />
              </p>
            </div>
          </div>
        </Card>
        <Card className="animate-in animate-in-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#f4be7e]/10 rounded-[12px] flex items-center justify-center">
              <TrendingUp size={20} className="text-[#f4be7e]" />
            </div>
            <div>
              <p className="text-sm text-[#a0a0a6]">À venir</p>
              <p className="text-xl font-bold text-[#f5f5f5]">
                <AnimatedNumber value={upcomingTotal} format={(n) => formatCurrency(n)} delay={200} />
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 animate-in animate-in-4">
          <CardHeader>
            <CardTitle>Dividendes mensuels</CardTitle>
          </CardHeader>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <XAxis dataKey="month" tick={{ fill: '#6b6b73', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b6b73', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value) => [formatCurrency(Number(value)), 'Dividendes']}
              />
              <Bar dataKey="amount" fill="#f4be7e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="animate-in animate-in-5">
          <CardHeader>
            <CardTitle>Top payeurs</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {topPayers.map(([symbol, amount], i) => (
              <div key={symbol} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm w-6">{medals[i]}</span>
                  <span className="font-medium text-[#f5f5f5] text-sm">{symbol}</span>
                </div>
                <span className="text-[#34d399] font-medium text-sm">{formatCurrency(amount)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="animate-in animate-in-6">
        <CardHeader>
          <CardTitle>Calendrier des dividendes</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[#6b6b73] text-left">
                <th className="pb-3 font-medium text-[10px] uppercase tracking-wider">Actif</th>
                <th className="pb-3 font-medium text-[10px] uppercase tracking-wider">Statut</th>
                <th className="pb-3 font-medium text-[10px] uppercase tracking-wider">Fréquence</th>
                <th className="pb-3 font-medium text-[10px] uppercase tracking-wider text-right">Date ex-div</th>
                <th className="pb-3 font-medium text-[10px] uppercase tracking-wider text-right">Date paiement</th>
                <th className="pb-3 font-medium text-[10px] uppercase tracking-wider text-right">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
              {mockDividends.sort((a, b) => a.payDate.localeCompare(b.payDate)).map((d) => {
                const status = statusLabels[d.status];
                return (
                  <tr key={d.id} className="text-[#a0a0a6] hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                    <td className="py-3">
                      <div className="font-medium text-[#f5f5f5]">{d.symbol}</div>
                      <div className="text-xs text-[#6b6b73]">{d.name}</div>
                    </td>
                    <td className="py-3">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </td>
                    <td className="py-3 text-[#6b6b73] capitalize">{d.frequency}</td>
                    <td className="py-3 text-right text-[#6b6b73]">{formatDate(d.exDate)}</td>
                    <td className="py-3 text-right text-[#6b6b73]">{formatDate(d.payDate)}</td>
                    <td className="py-3 text-right font-medium text-[#34d399]">
                      {formatCurrencyDetailed(d.amount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
