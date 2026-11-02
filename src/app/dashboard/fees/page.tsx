'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Lightbulb, Plus, Receipt, Trash2, TrendingDown } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { ConfirmDialog, EmptyState, Loader, PageHeader, StatCard } from '@/components/ui/kit';
import { CHART_ANIM, ChartOrTable, Legend, axisTick, gridStroke, tooltipProps } from '@/components/charts/kit';
import FeeForm, { FEE_TYPES } from '@/components/forms/FeeForm';
import { toNumber } from '@/components/forms/numbers';
import { useAccounts, useAction, useFees, useSummary } from '@/hooks/data';
import { api } from '@/lib/api';
import { annualizedFee, feeSavings } from '@/lib/finance';
import { formatCompact, formatCurrency, formatCurrencyDetailed } from '@/lib/utils';
import type { Fee } from '@/types';

const FREQUENCY: Record<string, string> = { annual: 'par an', monthly: 'par mois', quarterly: 'par trimestre', 'per-transaction': 'estimation annuelle' };
const SERIES = [
  { key: 'none', name: 'Sans frais', color: '#149b72' },
  { key: 'optimized', name: 'Frais optimisés', color: '#5b86f0' },
  { key: 'current', name: 'Frais actuels', color: '#d95f20' },
] as const;

const annual = (f: Fee) => annualizedFee(f.amount, f.frequency);
const percent = (n: number) => `${n.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %`;

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
  const [rateText, setRateText] = useState('7');
  const rate = toNumber(rateText, 30);
  const total = fees.reduce((s, f) => s + annual(f), 0);
  const savings = fees.reduce((s, f) => s + feeSavings(annual(f), f.percentage, f.alternativeFee), 0);
  const data = useMemo(() => project(capital, total, total - savings, rate), [capital, total, savings, rate]);
  const y20 = data[20];
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <StatCard label="Frais annuels" value={<span data-testid="fees-total">{formatCurrencyDetailed(total, currency)}</span>} icon={<AlertTriangle size={17} className="text-[#f87171]" />} />
        <StatCard label="Économies possibles" value={`${formatCurrencyDetailed(savings, currency)}/an`} tone={savings > 0 ? 'positive' : undefined} icon={<Lightbulb size={17} className="text-[#f4be7e]" />} />
        <StatCard label="Coût sur 20 ans" value={formatCurrency(y20.none - y20.current, currency)} tone="negative" icon={<TrendingDown size={17} className="text-[#a78bfa]" />} hint={`Rendement supposé : ${percent(rate)}`} />
      </div>
      <Card className="min-w-0">
        <CardHeader className="flex-wrap gap-3 items-end">
          <div className="min-w-0"><CardTitle>Impact sur 30 ans</CardTitle><p className="text-xs text-[#8e8e98] mt-0.5">Depuis vos {formatCurrency(capital, currency)} d&apos;actifs, frais supposés constants, sans nouveau versement.</p></div>
          <div className="w-36"><Input id="fees-rate" label="Rendement annuel (%)" inputMode="decimal" value={rateText} onChange={(e) => setRateText(e.target.value)} autoComplete="off" /></div>
        </CardHeader>
        <ChartOrTable
          label="impact des frais"
          chart={
            <div>
              <div role="img" aria-label={`Sur 30 ans : ${SERIES.map((s) => `${s.name} ${formatCurrency(data[30][s.key], currency)}`).join(', ')}`}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
                    <CartesianGrid vertical={false} stroke={gridStroke} />
                    <XAxis dataKey="year" tick={axisTick} axisLine={false} tickLine={false} minTickGap={32} tickFormatter={(y) => `${y} ans`} />
                    <YAxis tick={axisTick} axisLine={false} tickLine={false} width={56} tickFormatter={(v) => formatCompact(v, currency)} />
                    <Tooltip {...tooltipProps} labelFormatter={(y) => `Dans ${y} ans`} formatter={(v, n) => [formatCurrency(Number(v), currency), String(n)]} />
                    {SERIES.map((s) => <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2} dot={false} {...CHART_ANIM} />)}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <Legend items={SERIES.map((s) => ({ name: s.name, color: s.color }))} />
            </div>
          }
          table={
            <div className="overflow-x-auto">
              <table className="w-full text-sm"><thead><tr className="text-left text-xs text-[#8e8e98]"><th className="pb-2 font-medium">Horizon</th>{SERIES.map((s) => <th key={s.key} className="pb-2 font-medium text-right">{s.name}</th>)}</tr></thead>
                <tbody>{data.filter((d) => d.year % 5 === 0).map((d) => <tr key={d.year} className="border-t border-white/[0.05] tabular-nums text-[#f5f5f5]"><td className="py-2 text-[#a0a0a6]">{d.year} ans</td>{SERIES.map((s) => <td key={s.key} className="py-2 text-right">{formatCurrency(d[s.key], currency)}</td>)}</tr>)}</tbody>
              </table>
            </div>
          }
        />
      </Card>
    </>
  );
}

export default function FeesPage() {
  const fees = useFees();
  const summary = useSummary();
  const accounts = useAccounts();
  const currency = summary.data?.currency ?? 'EUR';
  const eligible = (accounts.data ?? []).filter((a) => a.type !== 'loan');
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<Fee | null>(null);
  const remove = useAction((id: string) => api(`/api/fees/${id}`, { method: 'DELETE' }), { success: 'Frais supprimés', onSuccess: () => setDeleting(null) });
  const add = <Button onClick={() => setAdding(true)}><Plus size={16} className="mr-1.5" />Ajouter</Button>;

  return (
    <div className="space-y-5">
      <PageHeader title="Frais" subtitle="Ce que vos comptes vous coûtent, et ce que vous pourriez économiser" action={add} />
      <Loader query={fees}>
        {(list) => list.length === 0 ? (
          <Card><EmptyState icon={<Receipt size={26} />} title="Aucun frais enregistré" text="Saisissez les frais de vos comptes pour mesurer leur poids sur le long terme." action={add} /></Card>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            <Impact fees={list} capital={summary.data?.assets ?? 0} currency={currency} />
            <Card>
              <CardHeader><CardTitle>Détail des frais</CardTitle></CardHeader>
              <ul className="space-y-3">
                {list.map((fee) => (
                  <li key={fee.id} className="p-4 bg-white/[0.03] rounded-[12px] border border-white/[0.05]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2"><h3 className="font-medium text-[#f5f5f5] text-sm">{fee.label}</h3><Badge>{FEE_TYPES[fee.type] ?? fee.type}</Badge></div>
                        <p className="text-xs text-[#8e8e98] mt-0.5 truncate">{fee.accountName}</p>
                      </div>
                      <div className="flex items-start gap-1 shrink-0">
                        <div className="text-right">
                          <p className="font-bold tabular-nums text-[#f5f5f5] text-sm">{formatCurrencyDetailed(fee.amount, currency)}</p>
                          <p className="text-xs text-[#8e8e98]">{percent(fee.percentage)} · {FREQUENCY[fee.frequency] ?? fee.frequency}</p>
                        </div>
                        {fee.isManual && <button onClick={() => setDeleting(fee)} aria-label={`Supprimer ${fee.label}`} className="w-11 h-11 -mt-2 -mr-2 flex items-center justify-center text-[#a0a0a6] hover:text-[#f87171] rounded-[10px] hover:bg-white/[0.05]"><Trash2 size={15} /></button>}
                      </div>
                    </div>
                    {(fee.suggestion || (fee.alternativeFee !== null && fee.alternativeFee !== undefined)) && (
                      <div className="mt-3 flex items-start gap-2 bg-[#f4be7e]/[0.08] border border-[#f4be7e]/15 rounded-[10px] p-3 text-sm">
                        <Lightbulb size={16} className="text-[#f4be7e] mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          {fee.suggestion && <p className="text-[#f4be7e]">{fee.suggestion}</p>}
                          {fee.alternativeFee !== null && fee.alternativeFee !== undefined && <p className="text-[#a0a0a6] mt-0.5">Taux alternatif : <span className="text-[#34d399]">{percent(fee.alternativeFee)}</span> contre {percent(fee.percentage)} aujourd&apos;hui.</p>}
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
      <Modal isOpen={adding} onClose={() => setAdding(false)} title="Ajouter des frais">
        {eligible.length ? <FeeForm accounts={eligible} onDone={() => setAdding(false)} /> : (
          <div className="text-center py-4">
            <p className="text-sm text-[#a0a0a6] mb-4">Des frais se rattachent à un compte. Créez d&apos;abord ce compte.</p>
            <Link href="/dashboard/accounts?add=1"><Button>Créer un compte</Button></Link>
          </div>
        )}
      </Modal>
      <ConfirmDialog isOpen={!!deleting} onClose={() => setDeleting(null)} title="Supprimer ces frais ?" text={deleting ? `${deleting.label} (${deleting.accountName}).` : ''} confirmLabel="Supprimer" loading={remove.isPending} onConfirm={() => deleting && remove.mutate(deleting.id)} />
    </div>
  );
}
