'use client';

import { useState } from 'react';
import { Wallet, TrendingUp, PiggyBank } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import AnimatedNumber from '@/components/ui/AnimatedNumber';
import { useBudget } from '@/hooks/useBudget';
import { mockExpenseHistory } from '@/data/mock';
import { formatCurrency } from '@/lib/utils';

const periods = ['Mensuel', 'Trimestriel', 'Annuel'] as const;

const tooltipStyle = {
  backgroundColor: 'rgba(20,20,22,0.92)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
};

export default function BudgetPage() {
  const [periodIndex, setPeriodIndex] = useState(0);
  const { data: budgetData } = useBudget();
  const currentBudget = budgetData?.[0];
  const savingsRate = currentBudget ? ((currentBudget.savings / currentBudget.income) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-in">
        <div>
          <h1 className="text-2xl font-bold text-[#f5f5f5]">Budget</h1>
          <p className="text-[#a0a0a6] text-sm mt-1">Suivi de vos dépenses et taux d&apos;épargne</p>
        </div>
        <div className="flex gap-1 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] rounded-[12px] p-1">
          {periods.map((p, i) => (
            <button
              key={p}
              onClick={() => setPeriodIndex(i)}
              className={`px-3 py-1.5 text-xs rounded-[8px] transition-all duration-200 ${
                i === periodIndex ? 'bg-[#f4be7e]/15 text-[#f4be7e]' : 'text-[#6b6b73] hover:text-[#a0a0a6]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="animate-in animate-in-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#f4be7e]/10 rounded-[12px] flex items-center justify-center">
              <Wallet size={20} className="text-[#f4be7e]" />
            </div>
            <div>
              <p className="text-sm text-[#a0a0a6]">Revenus</p>
              <p className="text-xl font-bold text-[#f5f5f5]">
                <AnimatedNumber value={currentBudget?.income ?? 0} format={(n) => formatCurrency(n)} />
              </p>
            </div>
          </div>
        </Card>
        <Card className="animate-in animate-in-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#5682f2]/10 rounded-[12px] flex items-center justify-center">
              <TrendingUp size={20} className="text-[#5682f2]" />
            </div>
            <div>
              <p className="text-sm text-[#a0a0a6]">Dépenses</p>
              <p className="text-xl font-bold text-[#f5f5f5]">
                <AnimatedNumber value={currentBudget?.expenses ?? 0} format={(n) => formatCurrency(n)} delay={100} />
              </p>
            </div>
          </div>
        </Card>
        <Card className="animate-in animate-in-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#34d399]/10 rounded-[12px] flex items-center justify-center">
              <PiggyBank size={20} className="text-[#34d399]" />
            </div>
            <div>
              <p className="text-sm text-[#a0a0a6]">Taux d&apos;épargne</p>
              <p className="text-xl font-bold text-[#34d399]">{savingsRate}%</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="animate-in animate-in-4">
          <CardHeader>
            <CardTitle>Évolution revenus / dépenses</CardTitle>
          </CardHeader>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockExpenseHistory}>
              <XAxis dataKey="month" tick={{ fill: '#6b6b73', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b6b73', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} width={40} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value) => [formatCurrency(Number(value)), '']}
              />
              <Legend />
              <Bar dataKey="income" name="Revenus" fill="#f4be7e" radius={[4, 4, 0, 0]} barSize={20} />
              <Bar dataKey="expenses" name="Dépenses" fill="#5682f2" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="animate-in animate-in-5">
          <CardHeader>
            <CardTitle>Budget par catégorie</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            {(currentBudget?.categories ?? []).map((cat) => {
              const pct = (cat.spent / cat.budgeted) * 100;
              const overBudget = cat.spent > cat.budgeted;
              return (
                <div key={cat.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[#a0a0a6]">{cat.name}</span>
                    <span className={overBudget ? 'text-[#f87171]' : 'text-[#6b6b73]'}>
                      {formatCurrency(cat.spent)} / {formatCurrency(cat.budgeted)}
                    </span>
                  </div>
                  <div className="w-full bg-[rgba(255,255,255,0.04)] rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(pct, 100)}%`,
                        backgroundColor: overBudget ? '#f87171' : cat.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card className="animate-in animate-in-6">
        <CardHeader>
          <CardTitle>Historique mensuel</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[#6b6b73] text-left">
                <th className="pb-3 font-medium text-[10px] uppercase tracking-wider">Mois</th>
                <th className="pb-3 font-medium text-[10px] uppercase tracking-wider text-right">Revenus</th>
                <th className="pb-3 font-medium text-[10px] uppercase tracking-wider text-right">Dépenses</th>
                <th className="pb-3 font-medium text-[10px] uppercase tracking-wider text-right">Épargne</th>
                <th className="pb-3 font-medium text-[10px] uppercase tracking-wider text-right">Taux d&apos;épargne</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
              {(budgetData ?? []).map((m) => (
                <tr key={m.month} className="text-[#a0a0a6] hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                  <td className="py-3 font-medium text-[#f5f5f5]">{m.month}</td>
                  <td className="py-3 text-right">{formatCurrency(m.income)}</td>
                  <td className="py-3 text-right">{formatCurrency(m.expenses)}</td>
                  <td className="py-3 text-right text-[#34d399]">{formatCurrency(m.savings)}</td>
                  <td className="py-3 text-right text-[#34d399]">
                    {((m.savings / m.income) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
