'use client';

import { useMemo, useState } from 'react';
import { Pencil, PiggyBank, Plus, Trash2, TrendingDown, Wallet, Wallet2 } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { ConfirmDialog, EmptyState, Loader, PageHeader, Segmented, Select, StatCard } from '@/components/ui/kit';
import { CHART_ANIM, ChartOrTable, Legend, axisTick, gridStroke, tooltipProps } from '@/components/charts/kit';
import BudgetForm from '@/components/forms/BudgetForm';
import { useAction, useBudget, useSummary } from '@/hooks/data';
import { api } from '@/lib/api';
import { cn, formatCompact, formatCurrency, formatMonth } from '@/lib/utils';
import type { MonthlyBudget } from '@/types';

type Period = 'month' | 'quarter' | 'year';
const PERIODS = [
  { value: 'month', label: 'Mensuel' }, { value: 'quarter', label: 'Trimestriel' }, { value: 'year', label: 'Annuel' },
] as const;
const INCOME = '#5b86f0';
const EXPENSES = '#bd8a45';

function bucketKey(month: string, period: Period) {
  const [y, m] = month.split('-').map(Number);
  if (period === 'year') return String(y);
  if (period === 'quarter') return `${y}-T${Math.ceil(m / 3)}`;
  return month;
}

function bucketLabel(key: string, period: Period) {
  if (period === 'month') return formatMonth(key);
  if (period === 'quarter') { const [y, q] = key.split('-'); return `${q} ${y}`; }
  return key;
}

interface Bucket { key: string; label: string; income: number; expenses: number; savings: number; months: MonthlyBudget[] }

function aggregate(budgets: MonthlyBudget[], period: Period): Bucket[] {
  const map = new Map<string, Bucket>();
  for (const b of budgets) {
    const key = bucketKey(b.month, period);
    const e = map.get(key) ?? { key, label: bucketLabel(key, period), income: 0, expenses: 0, savings: 0, months: [] };
    e.income += b.income;
    e.expenses += b.expenses;
    e.savings += b.savings;
    e.months.push(b);
    map.set(key, e);
  }
  return [...map.values()].sort((a, b) => b.key.localeCompare(a.key));
}

const rate = (savings: number, income: number) => (income > 0 ? (savings / income) * 100 : null);
const rateText = (r: number | null) => (r === null ? '—' : `${r.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`);

function Categories({ bucket, currency }: { bucket: Bucket; currency: string }) {
  const totals = new Map<string, { color: string; budgeted: number; spent: number }>();
  for (const c of bucket.months.flatMap((m) => m.categories)) {
    const e = totals.get(c.name) ?? { color: c.color, budgeted: 0, spent: 0 };
    totals.set(c.name, { ...e, budgeted: e.budgeted + c.budgeted, spent: e.spent + c.spent });
  }
  if (!totals.size) return <p className="text-sm text-[#a0a0a6] py-10 text-center">Aucune catégorie sur cette période.</p>;
  return (
    <ul className="space-y-4">
      {[...totals.entries()].map(([name, c]) => {
        const pct = c.budgeted > 0 ? Math.min((c.spent / c.budgeted) * 100, 100) : c.spent > 0 ? 100 : 0;
        const over = c.spent > c.budgeted;
        return (
          <li key={name}>
            <div className="flex justify-between gap-3 text-sm mb-1">
              <span className="text-[#a0a0a6] truncate min-w-0">{name}</span>
              <span className={cn('tabular-nums whitespace-nowrap', over ? 'text-[#f87171]' : 'text-[#f5f5f5]')}>{formatCurrency(c.spent, currency)}<span className="text-[#8e8e98]"> / {formatCurrency(c.budgeted, currency)}</span></span>
            </div>
            <div className="w-full bg-white/[0.05] rounded-full h-1.5"><div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: over ? '#f87171' : c.color }} /></div>
            {over && <p className="text-xs text-[#f87171] mt-1">Dépassé de {formatCurrency(c.spent - c.budgeted, currency)}</p>}
          </li>
        );
      })}
    </ul>
  );
}

function Evolution({ buckets, currency }: { buckets: Bucket[]; currency: string }) {
  const data = [...buckets].slice(0, 12).reverse();
  return (
    <ChartOrTable
      label="revenus et dépenses"
      chart={
        <div>
          <div role="img" aria-label="Revenus et dépenses par période">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data} barGap={2} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} stroke={gridStroke} />
                <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} minTickGap={16} />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} width={52} tickFormatter={(v) => formatCompact(v, currency)} />
                <Tooltip {...tooltipProps} formatter={(v, n) => [formatCurrency(Number(v), currency), String(n)]} />
                <Bar dataKey="income" name="Revenus" fill={INCOME} radius={[4, 4, 0, 0]} maxBarSize={18} {...CHART_ANIM} />
                <Bar dataKey="expenses" name="Dépenses" fill={EXPENSES} radius={[4, 4, 0, 0]} maxBarSize={18} {...CHART_ANIM} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <Legend items={[{ name: 'Revenus', color: INCOME }, { name: 'Dépenses', color: EXPENSES }]} />
        </div>
      }
      table={
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-[#8e8e98]"><th className="pb-2 font-medium">Période</th><th className="pb-2 font-medium text-right">Revenus</th><th className="pb-2 font-medium text-right">Dépenses</th><th className="pb-2 font-medium text-right">Épargne</th></tr></thead>
            <tbody>{[...data].reverse().map((b) => <tr key={b.key} className="border-t border-white/[0.05] text-[#f5f5f5] tabular-nums"><td className="py-2 text-[#a0a0a6]">{b.label}</td><td className="py-2 text-right">{formatCurrency(b.income, currency)}</td><td className="py-2 text-right">{formatCurrency(b.expenses, currency)}</td><td className="py-2 text-right">{formatCurrency(b.savings, currency)}</td></tr>)}</tbody>
          </table>
        </div>
      }
    />
  );
}

function History({ budgets, currency, onEdit, onDelete }: { budgets: MonthlyBudget[]; currency: string; onEdit: (b: MonthlyBudget) => void; onDelete: (b: MonthlyBudget) => void }) {
  return (
    <Card>
      <CardHeader><CardTitle>Historique mensuel</CardTitle></CardHeader>
      <ul className="divide-y divide-white/[0.05]">
        {budgets.map((m) => (
          <li key={m.month} className="flex items-center gap-2 py-2.5">
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-[#f5f5f5] capitalize">{formatMonth(m.month)}</span>
              <span className="block text-xs text-[#8e8e98] tabular-nums truncate">{formatCurrency(m.income, currency)} de revenus · {formatCurrency(m.expenses, currency)} de dépenses</span>
            </span>
            <span className="text-right shrink-0">
              <span className={cn('block text-sm font-semibold tabular-nums', m.savings >= 0 ? 'text-[#34d399]' : 'text-[#f87171]')}>{m.savings >= 0 ? '+' : ''}{formatCurrency(m.savings, currency)}</span>
              <span className="block text-xs text-[#8e8e98] tabular-nums">{rateText(rate(m.savings, m.income))}</span>
            </span>
            <button onClick={() => onEdit(m)} aria-label={`Modifier ${formatMonth(m.month)}`} className="w-11 h-11 shrink-0 flex items-center justify-center text-[#a0a0a6] hover:text-[#f5f5f5] rounded-[10px] hover:bg-white/[0.05]"><Pencil size={15} /></button>
            <button onClick={() => onDelete(m)} aria-label={`Supprimer ${formatMonth(m.month)}`} className="w-11 h-11 shrink-0 flex items-center justify-center text-[#a0a0a6] hover:text-[#f87171] rounded-[10px] hover:bg-white/[0.05]"><Trash2 size={15} /></button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default function BudgetPage() {
  const budget = useBudget();
  const summary = useSummary();
  const currency = summary.data?.currency ?? 'EUR';
  const [period, setPeriod] = useState<Period>('month');
  const [selected, setSelected] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<MonthlyBudget | null>(null);
  const [deleting, setDeleting] = useState<MonthlyBudget | null>(null);

  const budgets = useMemo(() => budget.data ?? [], [budget.data]);
  const buckets = useMemo(() => aggregate(budgets, period), [budgets, period]);
  const current = buckets.find((b) => b.key === selected) ?? buckets[0];

  const remove = useAction((month: string) => api(`/api/budget/${month}`, { method: 'DELETE' }), { success: 'Mois supprimé', onSuccess: () => setDeleting(null) });
  const add = <Button onClick={() => setAdding(true)}><Plus size={16} className="mr-1.5" />Saisir un mois</Button>;

  return (
    <div className="space-y-5">
      <PageHeader title="Budget" subtitle="Revenus, dépenses et taux d'épargne" action={add} />
      <Loader query={budget}>
        {(rows) => rows.length === 0 ? (
          <Card><EmptyState icon={<Wallet2 size={26} />} title="Aucun budget saisi" text="Saisissez vos revenus et vos dépenses par catégorie pour suivre votre taux d'épargne mois après mois." action={add} /></Card>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <Segmented label="Période" value={period} onChange={(p) => { setPeriod(p); setSelected(null); }} options={PERIODS} />
              <div className="w-full sm:w-52">
                <Select label={period === 'month' ? 'Mois' : period === 'quarter' ? 'Trimestre' : 'Année'} value={current?.key ?? ''} onChange={(e) => setSelected(e.target.value)}>
                  {buckets.map((b) => <option key={b.key} value={b.key}>{b.label}</option>)}
                </Select>
              </div>
            </div>
            {current && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard label="Revenus" value={<span data-testid="budget-income-total">{formatCurrency(current.income, currency)}</span>} icon={<Wallet size={17} className="text-[#5b86f0]" />} />
                <StatCard label="Dépenses" value={<span data-testid="budget-expenses-total">{formatCurrency(current.expenses, currency)}</span>} icon={<TrendingDown size={17} className="text-[#f4be7e]" />} />
                <StatCard label="Épargne" value={formatCurrency(current.savings, currency)} tone={current.savings >= 0 ? 'positive' : 'negative'} icon={<PiggyBank size={17} className="text-[#34d399]" />} />
                <StatCard label="Taux d'épargne" value={rateText(rate(current.savings, current.income))} hint={current.income > 0 ? undefined : 'Aucun revenu saisi'} />
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <Card className="min-w-0"><CardHeader><CardTitle>Évolution des revenus et dépenses</CardTitle></CardHeader><Evolution buckets={buckets} currency={currency} /></Card>
              <Card className="min-w-0"><CardHeader><CardTitle>Budget par catégorie · {current?.label}</CardTitle></CardHeader>{current && <Categories bucket={current} currency={currency} />}</Card>
            </div>
            <History budgets={rows} currency={currency} onEdit={setEditing} onDelete={setDeleting} />
          </div>
        )}
      </Loader>
      <Modal isOpen={adding} onClose={() => setAdding(false)} title="Saisir un mois">
        <BudgetForm existing={budgets.map((b) => b.month)} currency={currency} onDone={() => setAdding(false)} />
      </Modal>
      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title={`Modifier ${editing ? formatMonth(editing.month) : ''}`}>
        {editing && <BudgetForm key={editing.month} initial={editing} existing={budgets.map((b) => b.month)} currency={currency} onDone={() => setEditing(null)} />}
      </Modal>
      <ConfirmDialog isOpen={!!deleting} onClose={() => setDeleting(null)} title="Supprimer ce mois ?" text={deleting ? `Le budget de ${formatMonth(deleting.month)} et ses catégories seront supprimés.` : ''} confirmLabel="Supprimer" loading={remove.isPending} onConfirm={() => deleting && remove.mutate(deleting.month)} />
    </div>
  );
}
