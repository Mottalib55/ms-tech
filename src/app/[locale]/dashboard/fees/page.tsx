'use client';

import { useMemo, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { AlertTriangle, Lightbulb, Plus, Receipt, Trash2, TrendingDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { ConfirmDialog, EmptyState, Loader, PageHeader, StatCard } from '@/components/ui/kit';
import { CHART_ANIM, ChartOrTable, Legend, axisTick, gridStroke, tooltipProps } from '@/components/charts/kit';
import FeeForm from '@/components/forms/FeeForm';
import { toNumber } from '@/components/forms/numbers';
import { useAccounts, useAction, useFees, useSummary } from '@/hooks/data';
import { api } from '@/lib/api';
import { annualizedFee, feeSavings } from '@/lib/finance';
import { formatCompact, formatCurrency, formatCurrencyDetailed, formatPct } from '@/lib/utils';
import type { Fee } from '@/types';

const COST_SERIES = [
  { key: 'optimized', color: 'var(--c2)' },
  { key: 'current', color: 'var(--c5)' },
] as const;

const annual = (f: Fee) => annualizedFee(f.amount, f.frequency);
const percent = (n: number) => formatPct(n, 2);

function project(capital: number, annualFees: number, optimizedFees: number, ratePct: number) {
  const r = ratePct / 100;
  let current = capital; let optimized = capital; let none = capital;
  const rows = [];
  for (let year = 0; year <= 30; year++) {
    rows.push({ year, current: Math.round(current), optimized: Math.round(optimized), none: Math.round(none) });
    current = Math.max(0, current * (1 + r) - annualFees);
    optimized = Math.max(0, optimized * (1 + r) - optimizedFees);
    none *= 1 + r;
  }
  return rows;
}

function Impact({ fees, capital, currency }: { fees: Fee[]; capital: number; currency: string }) {
  const t = useTranslations('fees');
  const tc = useTranslations('charts');
  const nameOf = (key: 'optimized' | 'current') => t(`series.${key}`);
  const [rateText, setRateText] = useState('7');
  const rate = toNumber(rateText, 30);
  const total = fees.reduce((s, f) => s + annual(f), 0);
  const savings = fees.reduce((s, f) => s + feeSavings(annual(f), f.percentage, f.alternativeFee), 0);
  const data = useMemo(() => project(capital, total, total - savings, rate), [capital, total, savings, rate]);
  const y20 = data[20];
  // Capital lost against the same savings without fees: in absolute values the curves are
  // millions apart from zero and thousands apart from each other, so they would overlap.
  const costs = useMemo(() => data.map((d) => ({ year: d.year, current: d.none - d.current, optimized: d.none - d.optimized })), [data]);
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <StatCard label={t('annualFees')} value={<span data-testid="fees-total">{formatCurrencyDetailed(total, currency)}</span>} icon={<AlertTriangle size={17} className="text-muted" />} />
        <StatCard label={t('savings')} value={t('perYear', { amount: formatCurrencyDetailed(savings, currency) })} tone={savings > 0 ? 'positive' : undefined} icon={<Lightbulb size={17} className="text-muted" />} />
        <StatCard label={t('cost20')} value={formatCurrency(y20.none - y20.current, currency)} tone="negative" icon={<TrendingDown size={17} className="text-muted" />} hint={t('assumedReturn', { rate: percent(rate) })} />
      </div>
      <Card className="min-w-0">
        <CardHeader className="flex-wrap gap-3 items-end">
          <div className="min-w-0"><CardTitle>{t('cost30')}</CardTitle><p className="text-xs text-subtle mt-0.5">{t('basis', { capital: formatCurrency(capital, currency) })}</p></div>
          <div className="w-36"><Input id="fees-rate" label={t('annualReturn')} inputMode="decimal" value={rateText} onChange={(e) => setRateText(e.target.value)} autoComplete="off" /></div>
        </CardHeader>
        <ChartOrTable
          label={t('chartLabel')}
          chart={
            <div>
              <div role="img" aria-label={t('chartAria', { list: COST_SERIES.map((s) => `${nameOf(s.key)} ${formatCurrency(costs[30][s.key], currency)}`).join(', ') })}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={costs} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
                    <CartesianGrid vertical={false} stroke={gridStroke} />
                    <XAxis dataKey="year" tick={axisTick} axisLine={false} tickLine={false} minTickGap={32} tickFormatter={(y) => tc('years', { count: Number(y) })} />
                    <YAxis tick={axisTick} axisLine={false} tickLine={false} width={56} tickFormatter={(v) => formatCompact(v, currency)} />
                    <Tooltip {...tooltipProps} labelFormatter={(y) => tc('inYears', { count: Number(y) })} formatter={(v, n) => [formatCurrency(Number(v), currency), String(n)]} />
                    {COST_SERIES.map((s) => <Line key={s.key} type="monotone" dataKey={s.key} name={nameOf(s.key)} stroke={s.color} strokeWidth={2} dot={false} {...CHART_ANIM} />)}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <Legend items={COST_SERIES.map((s) => ({ name: nameOf(s.key), color: s.color }))} />
            </div>
          }
          table={
            <div className="overflow-x-auto">
              <table className="w-full text-sm"><thead><tr className="text-start text-xs text-subtle"><th className="pb-2 font-medium">{t('horizon')}</th>{COST_SERIES.map((s) => <th key={s.key} className="pb-2 font-medium text-end">{nameOf(s.key)}</th>)}</tr></thead>
                <tbody>{costs.filter((d) => d.year % 5 === 0).map((d) => <tr key={d.year} className="border-t border-line tabular-nums text-ink"><td className="py-2 text-muted">{tc('years', { count: d.year })}</td>{COST_SERIES.map((s) => <td key={s.key} className="py-2 text-end">{formatCurrency(d[s.key], currency)}</td>)}</tr>)}</tbody>
              </table>
            </div>
          }
        />
      </Card>
    </>
  );
}

export default function FeesPage() {
  const t = useTranslations('fees');
  const typeOf = (type: string) => (t.has(`type.${type}`) ? t(`type.${type}`) : type);
  const frequencyOf = (f: string) => (t.has(`frequency.${f}`) ? t(`frequency.${f}`) : f);
  const fees = useFees();
  const summary = useSummary();
  const accounts = useAccounts();
  const currency = summary.data?.currency ?? 'EUR';
  const eligible = (accounts.data ?? []).filter((a) => a.type !== 'loan');
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<Fee | null>(null);
  const remove = useAction((id: string) => api(`/api/fees/${id}`, { method: 'DELETE' }), { success: t('deleted'), onSuccess: () => setDeleting(null) });
  const add = <Button onClick={() => setAdding(true)}><Plus size={16} className="me-1.5" />{t('add')}</Button>;

  return (
    <div className="space-y-5">
      <PageHeader title={t('title')} subtitle={t('subtitle')} action={add} />
      <Loader query={fees}>
        {(list) => list.length === 0 ? (
          <Card><EmptyState icon={<Receipt size={26} />} title={t('emptyTitle')} text={t('emptyText')} action={add} /></Card>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            <Impact fees={list} capital={summary.data?.assets ?? 0} currency={currency} />
            <Card>
              <CardHeader><CardTitle>{t('detail')}</CardTitle></CardHeader>
              <ul className="divide-y divide-line">
                {list.map((fee) => (
                  <li key={fee.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2"><h3 className="font-medium text-ink text-sm">{fee.label}</h3>{typeOf(fee.type) !== fee.label && <Badge>{typeOf(fee.type)}</Badge>}</div>
                        <p className="text-xs text-subtle mt-0.5 truncate">{fee.accountName}</p>
                      </div>
                      <div className="flex items-start gap-1 shrink-0">
                        <div className="text-end">
                          <p className="font-semibold tabular-nums text-ink text-sm">{formatCurrencyDetailed(fee.amount, currency)}</p>
                          <p className="text-xs text-subtle">{percent(fee.percentage)} · {frequencyOf(fee.frequency)}</p>
                        </div>
                        {fee.isManual && <button onClick={() => setDeleting(fee)} aria-label={t('deleteAria', { label: fee.label })} className="w-11 h-11 -mt-2 -me-2 flex items-center justify-center text-muted hover:text-neg rounded-[10px] hover:bg-hover"><Trash2 size={15} /></button>}
                      </div>
                    </div>
                    {(fee.suggestion || (fee.alternativeFee !== null && fee.alternativeFee !== undefined)) && (
                      <div className="mt-3 flex items-start gap-2 bg-bg rounded-[10px] p-3 text-sm">
                        <Lightbulb size={16} className="text-muted mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          {fee.suggestion && <p className="text-ink">{fee.suggestion}</p>}
                          {fee.alternativeFee !== null && fee.alternativeFee !== undefined && <p className="text-muted mt-0.5">{t('alternative', { alternative: percent(fee.alternativeFee), current: percent(fee.percentage) })}</p>}
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        )}
      </Loader>
      <Modal isOpen={adding} onClose={() => setAdding(false)} title={t('addTitle')}>
        {eligible.length ? <FeeForm accounts={eligible} onDone={() => setAdding(false)} /> : (
          <div className="text-center py-4">
            <p className="text-sm text-muted mb-4">{t('needAccount')}</p>
            <Link href="/dashboard/accounts?add=1"><Button>{t('createAccount')}</Button></Link>
          </div>
        )}
      </Modal>
      <ConfirmDialog isOpen={!!deleting} onClose={() => setDeleting(null)} title={t('confirmTitle')} text={deleting ? `${deleting.label} (${deleting.accountName}).` : ''} confirmLabel={t('delete')} loading={remove.isPending} onConfirm={() => deleting && remove.mutate(deleting.id)} />
    </div>
  );
}
