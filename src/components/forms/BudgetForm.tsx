'use client';

import { FormEvent, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { FormError } from '@/components/ui/kit';
import { useAction } from '@/hooks/data';
import { api } from '@/lib/api';
import { ASSET_CLASSES } from '@/lib/finance';
import { formatCurrency, formatMonth, parseAmount } from '@/lib/utils';
import type { MonthlyBudget } from '@/types';
import { toField } from './numbers';

// Fixed order from the validated palette; past its end, categories share the neutral last step.
const PALETTE = Object.values(ASSET_CLASSES).map((c) => c.color);
const colorAt = (i: number) => PALETTE[Math.min(i, PALETTE.length - 1)];

interface Row { key: number; name: string; budgeted: string; spent: string; color?: string; icon?: string }

const currentMonth = () => new Date().toISOString().slice(0, 7);

export default function BudgetForm({ initial, existing, currency, onDone }: {
  initial?: MonthlyBudget; existing: string[]; currency: string; onDone: () => void;
}) {
  const t = useTranslations('budget.form');
  const [month, setMonth] = useState(initial?.month ?? currentMonth());
  const [income, setIncome] = useState(initial ? toField(initial.income) : '');
  const [rows, setRows] = useState<Row[]>(
    initial?.categories.length
      ? initial.categories.map((c, i) => ({ key: i, name: c.name, budgeted: toField(c.budgeted), spent: toField(c.spent), color: c.color, icon: c.icon }))
      : [{ key: 0, name: '', budgeted: '', spent: '' }],
  );
  const [nextKey, setNextKey] = useState(initial?.categories.length ?? 1);
  const [error, setError] = useState<string | null>(null);

  const save = useAction((body: object) => api('/api/budget', { method: 'POST', body }), {
    success: initial ? t('updated') : t('saved'), onSuccess: onDone, onError: (e) => setError(e.message),
  });

  const update = (key: number, patch: Partial<Row>) => setRows((r) => r.map((x) => (x.key === key ? { ...x, ...patch } : x)));
  const addRow = () => { setRows((r) => [...r, { key: nextKey, name: '', budgeted: '', spent: '' }]); setNextKey((k) => k + 1); };
  const removeRow = (key: number) => setRows((r) => r.filter((x) => x.key !== key));

  const amount = (t: string) => (t.trim() === '' ? 0 : parseAmount(t));
  const totalSpent = rows.reduce((s, r) => s + (amount(r.spent) || 0), 0);
  const incomeValue = amount(income) || 0;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^\d{4}-\d{2}$/.test(month)) return setError(t('pickMonth'));
    if (!initial && existing.includes(month)) return setError(t('exists', { month: formatMonth(month) }));
    const inc = amount(income);
    if (Number.isNaN(inc) || inc < 0) return setError(t('incomePositive'));
    const filled = rows.filter((r) => r.name.trim() || r.budgeted.trim() || r.spent.trim());
    if (filled.some((r) => !r.name.trim())) return setError(t('nameEach'));
    const parsed = filled.map((r) => ({ ...r, b: amount(r.budgeted), s: amount(r.spent) }));
    if (parsed.some((r) => Number.isNaN(r.b) || Number.isNaN(r.s) || r.b < 0 || r.s < 0)) return setError(t('amountsPositive'));
    save.mutate({
      month,
      income: inc,
      categories: parsed.map((r, i) => ({ name: r.name.trim(), icon: r.icon ?? 'tag', color: r.color ?? colorAt(i), budgeted: r.b, spent: r.s })),
    });
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <FormError message={error} />
      <div className="grid grid-cols-2 gap-3">
        <Input id="budget-month" label={t('month')} dir="ltr" type="month" value={month} disabled={!!initial} onChange={(e) => setMonth(e.target.value)} />
        <Input id="budget-income" label={t('income', { currency })} inputMode="decimal" value={income} onChange={(e) => setIncome(e.target.value)} autoComplete="off" />
      </div>
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-muted mb-2">{t('categories')}</legend>
        {rows.map((r, i) => (
          <div key={r.key} className="p-3 bg-surface rounded-[10px] space-y-2">
            <div className="flex items-end gap-2">
              <div className="flex-1 min-w-0">
                <Input id={`cat-name-${r.key}`} label={t('category', { n: i + 1 })} value={r.name} onChange={(e) => update(r.key, { name: e.target.value })} placeholder={t('placeholder')} autoComplete="off" />
              </div>
              <button type="button" onClick={() => removeRow(r.key)} aria-label={t('remove', { n: i + 1 })} className="w-11 h-11 shrink-0 flex items-center justify-center text-muted hover:text-neg rounded-[10px] hover:bg-hover"><Trash2 size={16} /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input id={`cat-budgeted-${r.key}`} label={t('budgeted')} inputMode="decimal" value={r.budgeted} onChange={(e) => update(r.key, { budgeted: e.target.value })} autoComplete="off" />
              <Input id={`cat-spent-${r.key}`} label={t('spent')} inputMode="decimal" value={r.spent} onChange={(e) => update(r.key, { spent: e.target.value })} autoComplete="off" />
            </div>
          </div>
        ))}
        <Button variant="secondary" size="sm" onClick={addRow}><Plus size={14} className="me-1" />{t('addCategory')}</Button>
      </fieldset>
      <p data-testid="budget-preview" className="text-sm text-muted tabular-nums">
        {t('preview', { expenses: formatCurrency(totalSpent, currency), savings: formatCurrency(incomeValue - totalSpent, currency) })}
      </p>
      <Button type="submit" loading={save.isPending} className="w-full">{initial ? t('save') : t('saveMonth')}</Button>
    </form>
  );
}
