'use client';

import { useState, type ReactNode } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useTranslations } from 'next-intl';
import { Segmented } from '@/components/ui/kit';
import { useFinanceLabels } from '@/hooks/useFinanceLabels';
import { formatCurrency, formatPct } from '@/lib/utils';
import type { AllocationSlice } from '@/types';

export const axisTick = { fill: 'var(--muted)', fontSize: 11 };
export const gridStroke = 'var(--line)';
export const GOLD = 'var(--accent)';
export const tooltipProps = {
  contentStyle: { backgroundColor: 'var(--raised)', border: '1px solid var(--line)', borderRadius: 10, fontSize: 13 },
  labelStyle: { color: 'var(--muted)', marginBottom: 2 },
  itemStyle: { color: 'var(--ink)' },
  cursor: { stroke: 'var(--line)', fill: 'var(--hover)' },
};
export const CHART_ANIM = { isAnimationActive: false } as const;

/** Every chart can also be read as a table: no figure is available by colour or hover alone. */
export function ChartOrTable({ chart, table, label }: { chart: ReactNode; table: ReactNode; label: string }) {
  const t = useTranslations('charts');
  const [view, setView] = useState<'chart' | 'table'>('chart');
  return (
    <div>
      <div className="flex justify-end mb-2">
        <Segmented label={t('view', { label })} value={view} onChange={setView} options={[{ value: 'chart', label: t('chart') }, { value: 'table', label: t('table') }]} />
      </div>
      {view === 'chart' ? chart : table}
    </div>
  );
}

export function Legend({ items }: { items: { name: string; color: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
      {items.map((i) => (
        <li key={i.name} className="flex items-center gap-1.5 text-xs text-muted">
          <span className="w-2.5 h-2.5 rounded-[3px]" style={{ backgroundColor: i.color }} />{i.name}
        </li>
      ))}
    </ul>
  );
}

/** Donut + the labelled list that is its legend. Percentages always total 100. */
export function AllocationDonut({ slices: raw, currency, height = 200 }: { slices: AllocationSlice[]; currency: string; height?: number }) {
  const t = useTranslations('charts');
  const labels = useFinanceLabels();
  const slices = raw.map((s) => ({ ...s, name: labels.assetClass(s.key, s.name) }));
  return (
    <div>
      <div role="img" aria-label={t('allocationAria', { list: slices.map((s) => `${s.name} ${formatPct(s.percent)}`).join(', ') })}>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie data={slices} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="92%" paddingAngle={2} stroke="var(--surface)" strokeWidth={2} {...CHART_ANIM}>
              {slices.map((s) => <Cell key={s.key} fill={s.color} />)}
            </Pie>
            <Tooltip {...tooltipProps} formatter={(v, n) => [formatCurrency(Number(v), currency), String(n)]} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="space-y-2 mt-3">
        {slices.map((s) => (
          <li key={s.key} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 min-w-0"><span className="w-2.5 h-2.5 rounded-[3px] shrink-0" style={{ backgroundColor: s.color }} /><span className="text-muted truncate">{s.name}</span></span>
            <span className="tabular-nums text-ink whitespace-nowrap">{formatPct(s.percent)}<span className="text-subtle ms-2 hidden sm:inline">{formatCurrency(s.value, currency)}</span></span>
          </li>
        ))}
      </ul>
    </div>
  );
}
