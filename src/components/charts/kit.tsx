'use client';

import { useState, type ReactNode } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Segmented } from '@/components/ui/kit';
import { formatCurrency } from '@/lib/utils';
import type { AllocationSlice } from '@/types';

export const axisTick = { fill: '#a0a0a6', fontSize: 11 };
export const gridStroke = 'rgba(255,255,255,0.06)';
export const GOLD = '#f4be7e';
export const tooltipProps = {
  contentStyle: { backgroundColor: '#1a1a1d', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, fontSize: 13 },
  labelStyle: { color: '#a0a0a6', marginBottom: 2 },
  itemStyle: { color: '#f5f5f5' },
  cursor: { stroke: 'rgba(255,255,255,0.2)', fill: 'rgba(255,255,255,0.03)' },
};
export const CHART_ANIM = { isAnimationActive: false } as const;

/** Every chart can also be read as a table: no figure is available by colour or hover alone. */
export function ChartOrTable({ chart, table, label }: { chart: ReactNode; table: ReactNode; label: string }) {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  return (
    <div>
      <div className="flex justify-end mb-2">
        <Segmented label={`Affichage : ${label}`} value={view} onChange={setView} options={[{ value: 'chart', label: 'Graphique' }, { value: 'table', label: 'Tableau' }]} />
      </div>
      {view === 'chart' ? chart : table}
    </div>
  );
}

export function Legend({ items }: { items: { name: string; color: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
      {items.map((i) => (
        <li key={i.name} className="flex items-center gap-1.5 text-xs text-[#a0a0a6]">
          <span className="w-2.5 h-2.5 rounded-[3px]" style={{ backgroundColor: i.color }} />{i.name}
        </li>
      ))}
    </ul>
  );
}

/** Donut + the labelled list that is its legend. Percentages always total 100. */
export function AllocationDonut({ slices, currency, height = 200 }: { slices: AllocationSlice[]; currency: string; height?: number }) {
  return (
    <div>
      <div role="img" aria-label={`Répartition : ${slices.map((s) => `${s.name} ${s.percent} %`).join(', ')}`}>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie data={slices} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="92%" paddingAngle={2} stroke="#131315" strokeWidth={2} {...CHART_ANIM}>
              {slices.map((s) => <Cell key={s.key} fill={s.color} />)}
            </Pie>
            <Tooltip {...tooltipProps} formatter={(v, n) => [formatCurrency(Number(v), currency), String(n)]} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="space-y-2 mt-3">
        {slices.map((s) => (
          <li key={s.key} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 min-w-0"><span className="w-2.5 h-2.5 rounded-[3px] shrink-0" style={{ backgroundColor: s.color }} /><span className="text-[#a0a0a6] truncate">{s.name}</span></span>
            <span className="tabular-nums text-[#f5f5f5] whitespace-nowrap">{s.percent.toLocaleString('fr-FR')} %<span className="text-[#8e8e98] ml-2 hidden sm:inline">{formatCurrency(s.value, currency)}</span></span>
          </li>
        ))}
      </ul>
    </div>
  );
}
