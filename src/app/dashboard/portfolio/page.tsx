'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { mockHoldings } from '@/data/mock';
import { formatCurrency, formatPercent } from '@/lib/utils';

const assetClassColors: Record<string, string> = {
  stocks: '#f4be7e',
  etf: '#5682f2',
  crypto: '#f97316',
  'real-estate': '#34d399',
  bonds: '#a78bfa',
  cash: '#ec4899',
  commodities: '#f97316',
};

const tooltipStyle = {
  backgroundColor: 'rgba(20,20,22,0.92)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
};

function groupBy<T>(items: T[], key: (item: T) => string) {
  return items.reduce((groups, item) => {
    const k = key(item);
    if (!groups[k]) groups[k] = [];
    groups[k].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

export default function PortfolioPage() {
  const holdingsWithValue = mockHoldings.map((h) => ({
    ...h,
    value: h.quantity * h.currentPrice,
    cost: h.quantity * h.avgPrice,
    pl: h.quantity * h.currentPrice - h.quantity * h.avgPrice,
    plPercent: ((h.currentPrice - h.avgPrice) / h.avgPrice) * 100,
  }));

  const totalValue = holdingsWithValue.reduce((s, h) => s + h.value, 0);

  const byClass = groupBy(holdingsWithValue, (h) => h.assetClass);
  const classData = Object.entries(byClass).map(([cls, items]) => ({
    name: cls === 'stocks' ? 'Actions' : cls === 'etf' ? 'ETF' : cls === 'crypto' ? 'Crypto' : cls === 'real-estate' ? 'Immobilier' : cls === 'bonds' ? 'Obligations' : cls,
    value: Math.round(items.reduce((s, i) => s + i.value, 0)),
    color: assetClassColors[cls] || '#6b6b73',
  }));

  const byRegion = groupBy(holdingsWithValue, (h) => h.region);
  const regionData = Object.entries(byRegion).map(([region, items]) => ({
    name: region,
    value: Math.round(items.reduce((s, i) => s + i.value, 0)),
  }));

  const bySector = groupBy(holdingsWithValue, (h) => h.sector);
  const sectorData = Object.entries(bySector)
    .map(([sector, items]) => ({
      name: sector,
      value: Math.round(items.reduce((s, i) => s + i.value, 0)),
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-6">
      <div className="animate-in">
        <h1 className="text-2xl font-bold text-[#f5f5f5]">Portefeuille</h1>
        <p className="text-[#a0a0a6] text-sm mt-1">
          {holdingsWithValue.length} positions &middot; Valeur totale : {formatCurrency(totalValue)}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="animate-in animate-in-1">
          <CardHeader>
            <CardTitle>Par classe d&apos;actifs</CardTitle>
          </CardHeader>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={classData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                {classData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value) => [formatCurrency(Number(value)), '']}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {classData.map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[#a0a0a6]">{item.name}</span>
                <span className="text-[#6b6b73] ml-auto">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="animate-in animate-in-2">
          <CardHeader>
            <CardTitle>Répartition géographique</CardTitle>
          </CardHeader>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={regionData} layout="vertical">
              <XAxis
                type="number"
                tick={{ fill: '#6b6b73', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: '#a0a0a6', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={100}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value) => [formatCurrency(Number(value)), 'Valeur']}
              />
              <Bar dataKey="value" fill="#f4be7e" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="animate-in animate-in-3">
        <CardHeader>
          <CardTitle>Répartition sectorielle</CardTitle>
        </CardHeader>
        <div className="space-y-3">
          {sectorData.map((sector) => {
            const pct = (sector.value / totalValue) * 100;
            return (
              <div key={sector.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#a0a0a6]">{sector.name}</span>
                  <span className="text-[#6b6b73]">{formatCurrency(sector.value)} ({pct.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-[rgba(255,255,255,0.04)] rounded-full h-2">
                  <div className="bg-gradient-to-r from-[#d4a06a] to-[#f4be7e] h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="animate-in animate-in-4">
        <CardHeader>
          <CardTitle>Détail des positions</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[#6b6b73] text-left">
                <th className="pb-3 font-medium text-[10px] uppercase tracking-wider">Actif</th>
                <th className="pb-3 font-medium text-[10px] uppercase tracking-wider">Classe</th>
                <th className="pb-3 font-medium text-[10px] uppercase tracking-wider text-right">Qté</th>
                <th className="pb-3 font-medium text-[10px] uppercase tracking-wider text-right">PRU</th>
                <th className="pb-3 font-medium text-[10px] uppercase tracking-wider text-right">Prix</th>
                <th className="pb-3 font-medium text-[10px] uppercase tracking-wider text-right">Valeur</th>
                <th className="pb-3 font-medium text-[10px] uppercase tracking-wider text-right">P&L</th>
                <th className="pb-3 font-medium text-[10px] uppercase tracking-wider text-right">Poids</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
              {holdingsWithValue.sort((a, b) => b.value - a.value).map((h) => (
                <tr key={h.id} className="text-[#a0a0a6] hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                  <td className="py-3">
                    <div className="font-medium text-[#f5f5f5]">{h.symbol}</div>
                    <div className="text-xs text-[#6b6b73]">{h.name}</div>
                  </td>
                  <td className="py-3">
                    <Badge>{h.assetClass}</Badge>
                  </td>
                  <td className="py-3 text-right">{h.quantity}</td>
                  <td className="py-3 text-right">{formatCurrency(h.avgPrice, h.currency)}</td>
                  <td className="py-3 text-right">{formatCurrency(h.currentPrice, h.currency)}</td>
                  <td className="py-3 text-right font-medium text-[#f5f5f5]">{formatCurrency(h.value, h.currency)}</td>
                  <td className={`py-3 text-right ${h.pl >= 0 ? 'text-[#34d399]' : 'text-[#f87171]'}`}>
                    <div className="flex items-center justify-end gap-1">
                      {h.pl >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {formatPercent(h.plPercent)}
                    </div>
                  </td>
                  <td className="py-3 text-right text-[#6b6b73]">
                    {((h.value / totalValue) * 100).toFixed(1)}%
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
