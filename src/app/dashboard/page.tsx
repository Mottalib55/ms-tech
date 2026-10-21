'use client';

import { TrendingUp, TrendingDown, Wallet, BarChart3, DollarSign, Target } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import AnimatedNumber from '@/components/ui/AnimatedNumber';
import ProgressRing from '@/components/ui/ProgressRing';
import Sparkline from '@/components/ui/Sparkline';
import {
  mockPerformanceData,
  mockAllocation,
  mockHoldings,
  mockAccounts,
  totalPatrimoine,
} from '@/data/mock';
import { formatCurrency, formatPercent } from '@/lib/utils';

const patrimonyChange = 8.45;
const passiveIncome = 4850;

const topHoldings = [...mockHoldings]
  .sort((a, b) => b.quantity * b.currentPrice - a.quantity * a.currentPrice)
  .slice(0, 5);

const diversificationScore = 72;

const tooltipStyle = {
  backgroundColor: 'rgba(20,20,22,0.92)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
};

const sparkData = mockPerformanceData.slice(-12).map((p) => p.value);

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="animate-in">
        <h1 className="text-2xl font-bold text-[#f5f5f5]">Dashboard</h1>
        <p className="text-[#a0a0a6] text-sm mt-1">Vue d&apos;ensemble de votre patrimoine</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="highlighted" className="animate-in animate-in-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#a0a0a6]">Patrimoine net</span>
            <Wallet size={18} className="text-[#f4be7e]" />
          </div>
          <div className="text-2xl font-bold text-[#f5f5f5]">
            <AnimatedNumber value={totalPatrimoine} format={(n) => formatCurrency(n)} />
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1">
              <TrendingUp size={14} className="text-[#34d399]" />
              <span className="text-sm text-[#34d399]">{formatPercent(patrimonyChange)}</span>
              <span className="text-xs text-[#6b6b73]">ce mois</span>
            </div>
            <Sparkline data={sparkData} width={64} height={24} positive />
          </div>
        </Card>

        <Card className="animate-in animate-in-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#a0a0a6]">Comptes connectés</span>
            <BarChart3 size={18} className="text-[#5682f2]" />
          </div>
          <div className="text-2xl font-bold text-[#f5f5f5]">{mockAccounts.length}</div>
          <div className="text-sm text-[#6b6b73] mt-1">Tous synchronisés</div>
        </Card>

        <Card className="animate-in animate-in-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#a0a0a6]">Revenus passifs / an</span>
            <DollarSign size={18} className="text-[#f4be7e]" />
          </div>
          <div className="text-2xl font-bold text-[#f5f5f5]">
            <AnimatedNumber value={passiveIncome} format={(n) => formatCurrency(n)} delay={200} />
          </div>
          <div className="flex items-center gap-1 mt-1">
            <TrendingUp size={14} className="text-[#34d399]" />
            <span className="text-sm text-[#34d399]">+12.3%</span>
            <span className="text-xs text-[#6b6b73]">vs N-1</span>
          </div>
        </Card>

        <Card className="animate-in animate-in-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#a0a0a6]">Score diversification</span>
            <Target size={18} className="text-[#a78bfa]" />
          </div>
          <div className="flex items-center gap-4">
            <ProgressRing value={diversificationScore} size={64} strokeWidth={5} />
            <div>
              <div className="text-sm text-[#a0a0a6]">Bon</div>
              <div className="text-xs text-[#6b6b73]">Objectif : 85</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <Card className="lg:col-span-2 animate-in animate-in-5">
          <CardHeader>
            <CardTitle>Performance du patrimoine</CardTitle>
            <div className="flex items-center gap-2">
              {['1M', '3M', '6M', '1A', '5A'].map((period) => (
                <button
                  key={period}
                  className={`px-2.5 py-1 text-xs rounded-[8px] transition-all duration-200 ${
                    period === '5A'
                      ? 'bg-[#f4be7e]/15 text-[#f4be7e]'
                      : 'text-[#6b6b73] hover:text-[#a0a0a6]'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </CardHeader>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={mockPerformanceData}>
              <XAxis
                dataKey="date"
                tick={{ fill: '#6b6b73', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval={11}
              />
              <YAxis
                tick={{ fill: '#6b6b73', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                width={45}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ color: '#a0a0a6' }}
                itemStyle={{ color: '#f5f5f5' }}
                formatter={(value) => [formatCurrency(Number(value)), 'Patrimoine']}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#f4be7e"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Allocation Pie */}
        <Card className="animate-in animate-in-6">
          <CardHeader>
            <CardTitle>Répartition d&apos;actifs</CardTitle>
          </CardHeader>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={mockAllocation}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {mockAllocation.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value, name) => [`${Number(value)}%`, String(name)]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {mockAllocation.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[#a0a0a6]">{item.name}</span>
                </div>
                <span className="text-[#6b6b73]">{item.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Top Holdings */}
      <Card className="animate-in animate-in-7">
        <CardHeader>
          <CardTitle>Top Holdings</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[#6b6b73] text-left">
                <th className="pb-3 font-medium text-[10px] uppercase tracking-wider">Actif</th>
                <th className="pb-3 font-medium text-[10px] uppercase tracking-wider text-right">Prix</th>
                <th className="pb-3 font-medium text-[10px] uppercase tracking-wider text-right">Valeur</th>
                <th className="pb-3 font-medium text-[10px] uppercase tracking-wider text-right">P&L</th>
                <th className="pb-3 font-medium text-[10px] uppercase tracking-wider text-right">Jour</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
              {topHoldings.map((h) => {
                const value = h.quantity * h.currentPrice;
                const cost = h.quantity * h.avgPrice;
                const pl = value - cost;
                const plPercent = ((value - cost) / cost) * 100;
                return (
                  <tr key={h.id} className="text-[#a0a0a6] hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                    <td className="py-3">
                      <div className="font-medium text-[#f5f5f5]">{h.symbol}</div>
                      <div className="text-xs text-[#6b6b73]">{h.name}</div>
                    </td>
                    <td className="py-3 text-right">
                      {formatCurrency(h.currentPrice, h.currency)}
                    </td>
                    <td className="py-3 text-right font-medium text-[#f5f5f5]">
                      {formatCurrency(value, h.currency)}
                    </td>
                    <td className={`py-3 text-right ${pl >= 0 ? 'text-[#34d399]' : 'text-[#f87171]'}`}>
                      <div>{formatCurrency(pl, h.currency)}</div>
                      <div className="text-xs">{formatPercent(plPercent)}</div>
                    </td>
                    <td className="py-3 text-right">
                      <span className={`inline-flex items-center gap-1 ${h.dailyChange >= 0 ? 'text-[#34d399]' : 'text-[#f87171]'}`}>
                        {h.dailyChange >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {formatPercent(h.dailyChange)}
                      </span>
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
