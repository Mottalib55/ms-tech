'use client';

import { useMemo, useState } from 'react';
import { Pencil, PiggyBank, Plus, Trash2, TrendingDown, Wallet, Wallet2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { ConfirmDialog, EmptyState, Loader, PageHeader, Segmented, Select, StatCard } from '@/components/ui/kit';
import { CHART_ANIM, ChartOrTable, Legend, axisTick, gridStroke, tooltipProps } from '@/components/charts/kit';
import BudgetForm from '@/components/forms/BudgetForm';
import { useAction, useBudget, useSummary } from '@/hooks/data';
import { api } from '@/lib/api';
import { cn, formatCompact, formatCurrency, formatCurrencySigned, formatMonth, formatPct } from '@/lib/utils';
import type { MonthlyBudget } from '@/types';

type Period = 'month' | 'quarter' | 'year';
const INCOME = 'var(--c2)';
const EXPENSES = 'var(--c1)';

function bucketKey(month: string, period: Period) {
  const [y, m] = month.split('-').map(Number);
  if (period === 'year') return String(y);
  if (period === 'quarter') return `${y}-T${Math.ceil(m / 3)}`;
  return month;
}

function bucketLabel(key: string, period: Period, quarterLabel: (quarter: string, year: string) => string) {
  if (period === 'month') return formatMonth(key);
  if (period === 'quarter') { const [y, q] = key.split('-T'); return quarterLabel(q, y); }
  return key;
}

interface Bucket { key: string; label: string; income: number; expenses: number; savings: number; months: MonthlyBudget[] }

function aggregate(budgets: MonthlyBudget[], period: Period, quarterLabel: (quarter: string, year: string) => string): Bucket[] {
  const map = new Map<string, Bucket>();
  for (const b of budgets) {
    const key = bucketKey(b.month, period);
    const e = map.get(key) ?? { key, label: bucketLabel(key, period, quarterLabel), income: 0, expenses: 0, savings: 0, months: [] };
    e.income += b.income;
    e.expenses += b.expenses;
    e.savings += b.savings;
    e.months.push(b);
    map.set(key, e);
  }
  return [...map.values()].sort((a, b) => b.key.localeCompare(a.key));
}

const rate = (savings: number, income: number) => (income > 0 ? (savings / income) * 100 : null);
const rateText = (r: number | null) => (r === null ? '—' : formatPct(r));

function Categories({ bucket, currency }: { bucket: Bucket; currency: string }) {
  const t = useTranslations('budget');
  const totals = new Map<string, { color: string; budgeted: number; spent: number }>();
  for (const c of bucket.months.flatMap((m) => m.categories)) {
    const e = totals.get(c.name) ?? { color: c.color, budgeted: 0, spent: 0 };
    totals.set(c.name, { ...e, budgeted: e.budgeted + c.budgeted, spent: e.spent + c.spent });
  }
  if (!totals.size) return <p className="text-sm text-muted py-10 text-center">{t('noCategory')}</p>;
  return (
    <ul className="space-y-4">
      {[...totals.entries()].map(([name, c]) => {
        const pct = c.budgeted > 0 ? Math.min((c.spent / c.budgeted) * 100, 100) : c.spent > 0 ? 100 : 0;
        const over = c.spent > c.budgeted;
        return (
          <li key={name}>
            <div className="flex justify-between gap-3 text-sm mb-1">
              <span className="text-muted truncate min-w-0">{name}</span>
              <span className={cn('tabular-nums whitespace-nowrap', over ? 'text-neg' : 'text-ink')}><bdi>{formatCurrency(c.spent, currency)}</bdi><span className="text-subtle"> / <bdi>{formatCurrency(c.budgeted, currency)}</bdi></span></span>
            </div>
            <div className="w-full bg-hover rounded-full h-1.5"><div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: over ? 'var(--neg)' : 'var(--ink)' }} /></div>
            {over && <p className="text-xs text-neg mt-1">{t('over', { amount: formatCurrency(c.spent - c.budgeted, currency) })}</p>}
          </li>
        );
      })}
    </ul>
  );
}

function Evolution({ buckets, currency }: { buckets: Bucket[]; currency: string }) {
  const t = useTranslations('budget');
  const data = [...buckets].slice(0, 12).reverse();
  return (
    <ChartOrTable
      label={t('evolutionLabel')}
      chart={
        <div>
          <div role="img" aria-label={t('evolutionAria')}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data} barGap={2} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} stroke={gridStroke} />
                <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} minTickGap={16} />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} width={52} tickFormatter={(v) => formatCompact(v, currency)} />
                <Tooltip {...tooltipProps} formatter={(v, n) => [formatCurrency(Number(v), currency), String(n)]} />
                <Bar dataKey="income" name={t('income')} fill={INCOME} radius={[4, 4, 0, 0]} maxBarSize={18} {...CHART_ANIM} />
                <Bar dataKey="expenses" name={t('expenses')} fill={EXPENSES} radius={[4, 4, 0, 0]} maxBarSize={18} {...CHART_ANIM} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <Legend items={[{ name: t('income'), color: INCOME }, { name: t('expenses'), color: EXPENSES }]} />
        </div>
      }
      table={
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-start text-xs text-subtle"><th className="pb-2 font-medium">{t('period')}</th><th className="pb-2 font-medium text-end">{t('income')}</th><th className="pb-2 font-medium text-end">{t('expenses')}</th><th className="pb-2 font-medium text-end">{t('savings')}</th></tr></thead>
            <tbody>{[...data].reverse().map((b) => <tr key={b.key} className="border-t border-line text-ink tabular-nums"><td className="py-2 text-muted">{b.label}</td><td className="py-2 text-end">{formatCurrency(b.income, currency)}</td><td className="py-2 text-end">{formatCurrency(b.expenses, currency)}</td><td className="py-2 text-end">{formatCurrency(b.savings, currency)}</td></tr>)}</tbody>
          </table>
        </div>
      }
    />
  );
}

function History({ budgets, currency, onEdit, onDelete }: { budgets: MonthlyBudget[]; currency: string; onEdit: (b: MonthlyBudget) => void; onDelete: (b: MonthlyBudget) => void }) {
  const t = useTranslations('budget');
  return (
    <Card>
      <CardHeader><CardTitle>{t('history')}</CardTitle></CardHeader>
      <ul className="divide-y divide-line">
        {budgets.map((m) => (
          <li key={m.month} className="flex items-center gap-2 py-2.5">
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-ink capitalize">{formatMonth(m.month)}</span>
              <span className="block text-xs text-subtle tabular-nums truncate">{t('historyLine', { income: formatCurrency(m.income, currency), expenses: formatCurrency(m.expenses, currency) })}</span>
            </span>
            <span className="text-end shrink-0">
              <span className={cn('block text-sm font-semibold tabular-nums', m.savings >= 0 ? 'text-pos' : 'text-neg')}>{formatCurrencySigned(m.savings, currency)}</span>
              <span className="block text-xs text-subtle tabular-nums">{rateText(rate(m.savings, m.income))}</span>
            </span>
            <button onClick={() => onEdit(m)} aria-label={t('editMonth', { month: formatMonth(m.month) })} className="w-11 h-11 shrink-0 flex items-center justify-center text-muted hover:text-ink rounded-[10px] hover:bg-hover"><Pencil size={15} /></button>
            <button onClick={() => onDelete(m)} aria-label={t('deleteMonth', { month: formatMonth(m.month) })} className="w-11 h-11 shrink-0 flex items-center justify-center text-muted hover:text-neg rounded-[10px] hover:bg-hover"><Trash2 size={15} /></button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default function BudgetPage() {
  const t = useTranslations('budget');
  const budget = useBudget();
  const summary = useSummary();
  const currency = summary.data?.currency ?? 'EUR';
  const [period, setPeriod] = useState<Period>('month');
  const [selected, setSelected] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<MonthlyBudget | null>(null);
  const [deleting, setDeleting] = useState<MonthlyBudget | null>(null);

  const budgets = useMemo(() => budget.data ?? [], [budget.data]);
  const buckets = useMemo(() => aggregate(budgets, period, (quarter, year) => t('quarterLabel', { quarter, year })), [budgets, period, t]);
  const current = buckets.find((b) => b.key === selected) ?? buckets[0];

  const remove = useAction((month: string) => api(`/api/budget/${month}`, { method: 'DELETE' }), { success: t('deleted'), onSuccess: () => setDeleting(null) });
  const add = <Button onClick={() => setAdding(true)}><Plus size={16} className="me-1.5" />{t('enterMonth')}</Button>;

  return (
    <div className="space-y-5">
      <PageHeader title={t('title')} subtitle={t('subtitle')} action={add} />
      <Loader query={budget}>
        {(rows) => rows.length === 0 ? (
          <Card><EmptyState icon={<Wallet2 size={26} />} title={t('emptyTitle')} text={t('emptyText')} action={add} /></Card>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <Segmented label={t('period')} value={period} onChange={(p: Period) => { setPeriod(p); setSelected(null); }} options={(['month', 'quarter', 'year'] as const).map((value) => ({ value, label: t(`periods.${value}`) }))} />
              <div className="w-full sm:w-52">
                <Select label={t(period)} value={current?.key ?? ''} onChange={(e) => setSelected(e.target.value)}>
                  {buckets.map((b) => <option key={b.key} value={b.key}>{b.label}</option>)}
                </Select>
              </div>
            </div>
            {current && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard label={t('income')} value={<span data-testid="budget-income-total">{formatCurrency(current.income, currency)}</span>} icon={<Wallet size={17} className="text-muted" />} />
                <StatCard label={t('expenses')} value={<span data-testid="budget-expenses-total">{formatCurrency(current.expenses, currency)}</span>} icon={<TrendingDown size={17} className="text-muted" />} />
                <StatCard label={t('savings')} value={formatCurrency(current.savings, currency)} tone={current.savings >= 0 ? 'positive' : 'negative'} icon={<PiggyBank size={17} className="text-muted" />} />
                <StatCard label={t('savingsRate')} value={rateText(rate(current.savings, current.income))} hint={current.income > 0 ? undefined : t('noIncome')} />
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <Card className="min-w-0"><CardHeader><CardTitle>{t('evolutionTitle')}</CardTitle></CardHeader><Evolution buckets={buckets} currency={currency} /></Card>
              <Card className="min-w-0"><CardHeader><CardTitle>{t('byCategory', { period: current?.label ?? '' })}</CardTitle></CardHeader>{current && <Categories bucket={current} currency={currency} />}</Card>
            </div>
            <History budgets={rows} currency={currency} onEdit={setEditing} onDelete={setDeleting} />
          </div>
        )}
      </Loader>
      <Modal isOpen={adding} onClose={() => setAdding(false)} title={t('enterMonth')}>
        <BudgetForm existing={budgets.map((b) => b.month)} currency={currency} onDone={() => setAdding(false)} />
      </Modal>
      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title={t('editMonth', { month: editing ? formatMonth(editing.month) : '' })}>
        {editing && <BudgetForm key={editing.month} initial={editing} existing={budgets.map((b) => b.month)} currency={currency} onDone={() => setEditing(null)} />}
      </Modal>
      <ConfirmDialog isOpen={!!deleting} onClose={() => setDeleting(null)} title={t('confirmTitle')} text={deleting ? t('confirmText', { month: formatMonth(deleting.month) }) : ''} confirmLabel={t('delete')} loading={remove.isPending} onConfirm={() => deleting && remove.mutate(deleting.month)} />
    </div>
  );
}
