'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { CalendarDays, CircleDollarSign, Clock, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { ConfirmDialog, EmptyState, Loader, PageHeader, StatCard } from '@/components/ui/kit';
import { CHART_ANIM, ChartOrTable, GOLD, axisTick, gridStroke, tooltipProps } from '@/components/charts/kit';
import DividendForm from '@/components/forms/DividendForm';
import { useAction, useDividends, useHoldings, useSummary } from '@/hooks/data';
import { api } from '@/lib/api';
import { formatCurrency, formatCurrencyDetailed, formatDate, formatMonth } from '@/lib/utils';
import type { Dividend } from '@/types';

const VARIANTS: Record<string, 'success' | 'warning' | 'default'> = { paid: 'success', confirmed: 'warning', projected: 'default' };

/** Status and frequency in the page's language; a value it does not know is shown as it came. */
function useDividendLabels() {
  const t = useTranslations('dividends');
  return {
    statusOf: (s: string) => ({ label: t.has(`status.${s}`) ? t(`status.${s}`) : s, variant: VARIANTS[s] ?? ('default' as const) }),
    frequencyOf: (f: string) => (t.has(`frequency.${f}`) ? t(`frequency.${f}`) : f),
  };
}

/** Amounts in different currencies are listed side by side, never added together. */
function byCurrency(list: Dividend[], fallback: string) {
  const totals = new Map<string, number>();
  for (const d of list) totals.set(d.currency, (totals.get(d.currency) ?? 0) + d.amount);
  if (!totals.size) return formatCurrency(0, fallback);
  return [...totals.entries()].map(([c, v]) => formatCurrency(v, c)).join(' + ');
}

function MonthlyChart({ list, currency }: { list: Dividend[]; currency: string }) {
  const t = useTranslations('dividends');
  const months = new Map<string, number>();
  for (const d of list) months.set(d.payDate.slice(0, 7), (months.get(d.payDate.slice(0, 7)) ?? 0) + d.amount);
  const data = [...months.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-18).map(([month, amount]) => ({ month, label: formatMonth(month), amount: Math.round(amount * 100) / 100 }));
  return (
    <ChartOrTable
      label={t('chartLabel')}
      chart={
        <div role="img" aria-label={t('chartAria', { count: data.length })}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke={gridStroke} />
              <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} minTickGap={16} />
              <YAxis tick={axisTick} axisLine={false} tickLine={false} width={52} tickFormatter={(v) => formatCurrency(v, currency)} />
              <Tooltip {...tooltipProps} formatter={(v) => [formatCurrencyDetailed(Number(v), currency), t('tooltip')]} />
              <Bar dataKey="amount" fill={GOLD} radius={[4, 4, 0, 0]} maxBarSize={22} {...CHART_ANIM} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      }
      table={
        <div className="max-h-[260px] overflow-y-auto">
          <table className="w-full text-sm"><thead><tr className="text-start text-xs text-subtle"><th className="pb-2 font-medium">{t('col.month')}</th><th className="pb-2 font-medium text-end">{t('col.amount')}</th></tr></thead>
            <tbody>{[...data].reverse().map((d) => <tr key={d.month} className="border-t border-line"><td className="py-2 text-muted">{d.label}</td><td className="py-2 text-end tabular-nums text-ink">{formatCurrencyDetailed(d.amount, currency)}</td></tr>)}</tbody>
          </table>
        </div>
      }
    />
  );
}

function Payers({ list }: { list: Dividend[] }) {
  const totals = new Map<string, { symbol: string; currency: string; amount: number }>();
  for (const d of list) {
    const key = `${d.symbol}-${d.currency}`;
    const e = totals.get(key) ?? { symbol: d.symbol, currency: d.currency, amount: 0 };
    totals.set(key, { ...e, amount: e.amount + d.amount });
  }
  const top = [...totals.values()].sort((a, b) => b.amount - a.amount).slice(0, 5);
  return (
    <ol className="space-y-3">
      {top.map((p, i) => (
        <li key={`${p.symbol}-${p.currency}`} className="flex items-center justify-between gap-3 text-sm">
          <span className="flex items-center gap-3 min-w-0"><span className="text-subtle w-4 tabular-nums">{i + 1}.</span><span className="font-medium text-ink truncate">{p.symbol}</span></span>
          <span className="tabular-nums font-medium text-ink whitespace-nowrap">{formatCurrency(p.amount, p.currency)}</span>
        </li>
      ))}
    </ol>
  );
}

function Calendar({ list, onDelete }: { list: Dividend[]; onDelete: (d: Dividend) => void }) {
  const t = useTranslations('dividends');
  const { statusOf, frequencyOf } = useDividendLabels();
  const sorted = [...list].sort((a, b) => b.payDate.localeCompare(a.payDate));
  const del = (d: Dividend) => d.isManual && <button onClick={() => onDelete(d)} aria-label={t('deleteAria', { symbol: d.symbol, date: formatDate(d.payDate) })} className="w-11 h-11 inline-flex shrink-0 items-center justify-center text-muted hover:text-neg rounded-[10px] hover:bg-hover"><Trash2 size={15} /></button>;
  return (
    <>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-subtle text-start text-xs"><th className="pb-3 font-medium">{t('col.asset')}</th><th className="pb-3 font-medium">{t('col.status')}</th><th className="pb-3 font-medium">{t('col.frequency')}</th><th className="pb-3 font-medium text-end">{t('col.ex')}</th><th className="pb-3 font-medium text-end">{t('col.pay')}</th><th className="pb-3 font-medium text-end">{t('col.amount')}</th><th className="pb-3 w-11"><span className="sr-only">{t('col.actions')}</span></th></tr></thead>
          <tbody className="divide-y divide-line">
            {sorted.map((d) => {
              const s = statusOf(d.status);
              return (
                <tr key={d.id} className="text-muted">
                  <td className="py-2 pe-3"><span className="block font-medium text-ink">{d.symbol}</span><span className="block text-xs text-subtle max-w-56 truncate">{d.name}</span></td>
                  <td className="py-2 pe-3"><Badge variant={s.variant}>{s.label}</Badge></td>
                  <td className="py-2 pe-3">{frequencyOf(d.frequency)}</td>
                  <td className="py-2 text-end whitespace-nowrap">{formatDate(d.exDate)}</td>
                  <td className="py-2 text-end whitespace-nowrap">{formatDate(d.payDate)}</td>
                  <td className="py-2 text-end tabular-nums font-medium text-ink whitespace-nowrap">{formatCurrencyDetailed(d.amount, d.currency)}</td>
                  <td className="py-2 text-end">{del(d)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ul className="md:hidden divide-y divide-line">
        {sorted.map((d) => {
          const s = statusOf(d.status);
          return (
            <li key={d.id} className="flex items-center gap-2 py-3">
              <span className="min-w-0 flex-1"><span className="block text-sm font-medium text-ink truncate">{d.symbol} <span className="font-normal text-muted">· {d.name}</span></span><span className="block text-xs text-subtle">{formatDate(d.payDate)} · {frequencyOf(d.frequency)}</span></span>
              <span className="text-end shrink-0"><span className="block text-sm font-semibold tabular-nums text-ink">{formatCurrencyDetailed(d.amount, d.currency)}</span><Badge variant={s.variant}>{s.label}</Badge></span>
              {del(d)}
            </li>
          );
        })}
      </ul>
    </>
  );
}

export default function DividendsPage() {
  const t = useTranslations('dividends');
  const dividends = useDividends();
  const holdings = useHoldings();
  const summary = useSummary();
  const base = summary.data?.currency ?? 'EUR';
  const [yearAgo] = useState(() => new Date(Date.now() - 365 * 86_400_000).toISOString().slice(0, 10));
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<Dividend | null>(null);
  const remove = useAction((id: string) => api(`/api/dividends/${id}`, { method: 'DELETE' }), { success: t('deleted'), onSuccess: () => setDeleting(null) });
  const add = <Button onClick={() => setAdding(true)}><Plus size={16} className="me-1.5" />{t('add')}</Button>;
  const positions = holdings.data ?? [];

  return (
    <div className="space-y-5">
      <PageHeader title={t('title')} subtitle={t('subtitle')} action={add} />
      <Loader query={dividends}>
        {(list) => {
          if (!list.length) return <Card><EmptyState icon={<CalendarDays size={26} />} title={t('emptyTitle')} text={t('emptyText')} action={add} /></Card>;
          const paid = list.filter((d) => d.status === 'paid' && d.payDate >= yearAgo);
          const upcoming = list.filter((d) => d.status !== 'paid');
          const counts = new Map<string, number>();
          for (const d of list) counts.set(d.currency, (counts.get(d.currency) ?? 0) + 1);
          const main = counts.has(base) ? base : [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
          const inMain = list.filter((d) => d.currency === main);
          return (
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <StatCard label={t('statTotal')} value={<span data-testid="dividends-total">{byCurrency([...paid, ...upcoming], base)}</span>} icon={<CircleDollarSign size={17} className="text-muted" />} />
                <StatCard label={t('statPaid')} value={byCurrency(paid, base)} icon={<CalendarDays size={17} className="text-muted" />} />
                <StatCard label={t('statUpcoming')} value={byCurrency(upcoming, base)} icon={<Clock size={17} className="text-muted" />} />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                <Card className="lg:col-span-2 min-w-0">
                  <CardHeader><CardTitle>{t('byMonth')}</CardTitle></CardHeader>
                  <MonthlyChart list={inMain} currency={main} />
                  {inMain.length < list.length && <p className="text-xs text-subtle mt-2">{t('limited', { currency: main })}</p>}
                </Card>
                <Card className="min-w-0"><CardHeader><CardTitle>{t('payers')}</CardTitle></CardHeader><Payers list={list} /></Card>
              </div>
              <Card><CardHeader><CardTitle>{t('calendar')}</CardTitle></CardHeader><Calendar list={list} onDelete={setDeleting} /></Card>
            </div>
          );
        }}
      </Loader>
      <Modal isOpen={adding} onClose={() => setAdding(false)} title={t('addTitle')}>
        {positions.length ? <DividendForm holdings={positions} onDone={() => setAdding(false)} /> : (
          <div className="text-center py-4">
            <p className="text-sm text-muted mb-4">{t('needPosition')}</p>
            <Link href="/dashboard/portfolio"><Button>{t('goPortfolio')}</Button></Link>
          </div>
        )}
      </Modal>
      <ConfirmDialog isOpen={!!deleting} onClose={() => setDeleting(null)} title={t('confirmTitle')} text={deleting ? t('confirmText', { symbol: deleting.symbol, amount: formatCurrencyDetailed(deleting.amount, deleting.currency), date: formatDate(deleting.payDate) }) : ''} confirmLabel={t('delete')} loading={remove.isPending} onConfirm={() => deleting && remove.mutate(deleting.id)} />
    </div>
  );
}
