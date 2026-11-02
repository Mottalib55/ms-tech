'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CalendarDays, CircleDollarSign, Clock, Plus, Trash2 } from 'lucide-react';
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

const STATUS: Record<string, { label: string; variant: 'success' | 'warning' | 'default' }> = {
  paid: { label: 'Versé', variant: 'success' },
  confirmed: { label: 'Confirmé', variant: 'warning' },
  projected: { label: 'Prévu', variant: 'default' },
};
const statusOf = (s: string) => STATUS[s] ?? { label: s, variant: 'default' as const };
const FREQUENCY: Record<string, string> = { monthly: 'Mensuel', quarterly: 'Trimestriel', 'semi-annual': 'Semestriel', annual: 'Annuel' };

/** Amounts in different currencies are listed side by side, never added together. */
function byCurrency(list: Dividend[], fallback: string) {
  const totals = new Map<string, number>();
  for (const d of list) totals.set(d.currency, (totals.get(d.currency) ?? 0) + d.amount);
  if (!totals.size) return formatCurrency(0, fallback);
  return [...totals.entries()].map(([c, v]) => formatCurrency(v, c)).join(' + ');
}

function MonthlyChart({ list, currency }: { list: Dividend[]; currency: string }) {
  const months = new Map<string, number>();
  for (const d of list) months.set(d.payDate.slice(0, 7), (months.get(d.payDate.slice(0, 7)) ?? 0) + d.amount);
  const data = [...months.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-18).map(([month, amount]) => ({ month, label: formatMonth(month), amount: Math.round(amount * 100) / 100 }));
  return (
    <ChartOrTable
      label="dividendes par mois"
      chart={
        <div role="img" aria-label={`Dividendes par mois sur ${data.length} mois`}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke={gridStroke} />
              <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} minTickGap={16} />
              <YAxis tick={axisTick} axisLine={false} tickLine={false} width={52} tickFormatter={(v) => formatCurrency(v, currency)} />
              <Tooltip {...tooltipProps} formatter={(v) => [formatCurrencyDetailed(Number(v), currency), 'Dividendes']} />
              <Bar dataKey="amount" fill={GOLD} radius={[4, 4, 0, 0]} maxBarSize={22} {...CHART_ANIM} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      }
      table={
        <div className="max-h-[260px] overflow-y-auto">
          <table className="w-full text-sm"><thead><tr className="text-left text-xs text-[#8e8e98]"><th className="pb-2 font-medium">Mois</th><th className="pb-2 font-medium text-right">Montant</th></tr></thead>
            <tbody>{[...data].reverse().map((d) => <tr key={d.month} className="border-t border-white/[0.05]"><td className="py-2 text-[#a0a0a6]">{d.label}</td><td className="py-2 text-right tabular-nums text-[#f5f5f5]">{formatCurrencyDetailed(d.amount, currency)}</td></tr>)}</tbody>
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
          <span className="flex items-center gap-3 min-w-0"><span className="text-[#8e8e98] w-4 tabular-nums">{i + 1}.</span><span className="font-medium text-[#f5f5f5] truncate">{p.symbol}</span></span>
          <span className="tabular-nums font-medium text-[#34d399] whitespace-nowrap">{formatCurrency(p.amount, p.currency)}</span>
        </li>
      ))}
    </ol>
  );
}

function Calendar({ list, onDelete }: { list: Dividend[]; onDelete: (d: Dividend) => void }) {
  const sorted = [...list].sort((a, b) => b.payDate.localeCompare(a.payDate));
  const del = (d: Dividend) => d.isManual && <button onClick={() => onDelete(d)} aria-label={`Supprimer le dividende ${d.symbol} du ${formatDate(d.payDate)}`} className="w-11 h-11 inline-flex shrink-0 items-center justify-center text-[#a0a0a6] hover:text-[#f87171] rounded-[10px] hover:bg-white/[0.05]"><Trash2 size={15} /></button>;
  return (
    <>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-[#8e8e98] text-left text-[10px] uppercase tracking-wider"><th className="pb-3 font-medium">Actif</th><th className="pb-3 font-medium">Statut</th><th className="pb-3 font-medium">Fréquence</th><th className="pb-3 font-medium text-right">Détachement</th><th className="pb-3 font-medium text-right">Paiement</th><th className="pb-3 font-medium text-right">Montant</th><th className="pb-3 w-11"><span className="sr-only">Actions</span></th></tr></thead>
          <tbody className="divide-y divide-white/[0.05]">
            {sorted.map((d) => {
              const s = statusOf(d.status);
              return (
                <tr key={d.id} className="text-[#a0a0a6]">
                  <td className="py-2 pr-3"><span className="block font-medium text-[#f5f5f5]">{d.symbol}</span><span className="block text-xs text-[#8e8e98] max-w-56 truncate">{d.name}</span></td>
                  <td className="py-2 pr-3"><Badge variant={s.variant}>{s.label}</Badge></td>
                  <td className="py-2 pr-3">{FREQUENCY[d.frequency] ?? d.frequency}</td>
                  <td className="py-2 text-right whitespace-nowrap">{formatDate(d.exDate)}</td>
                  <td className="py-2 text-right whitespace-nowrap">{formatDate(d.payDate)}</td>
                  <td className="py-2 text-right tabular-nums font-medium text-[#f5f5f5] whitespace-nowrap">{formatCurrencyDetailed(d.amount, d.currency)}</td>
                  <td className="py-2 text-right">{del(d)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ul className="md:hidden divide-y divide-white/[0.05]">
        {sorted.map((d) => {
          const s = statusOf(d.status);
          return (
            <li key={d.id} className="flex items-center gap-2 py-3">
              <span className="min-w-0 flex-1"><span className="block text-sm font-medium text-[#f5f5f5] truncate">{d.symbol} <span className="font-normal text-[#a0a0a6]">· {d.name}</span></span><span className="block text-xs text-[#8e8e98]">{formatDate(d.payDate)} · {FREQUENCY[d.frequency] ?? d.frequency}</span></span>
              <span className="text-right shrink-0"><span className="block text-sm font-semibold tabular-nums text-[#f5f5f5]">{formatCurrencyDetailed(d.amount, d.currency)}</span><Badge variant={s.variant}>{s.label}</Badge></span>
              {del(d)}
            </li>
          );
        })}
      </ul>
    </>
  );
}

export default function DividendsPage() {
  const dividends = useDividends();
  const holdings = useHoldings();
  const summary = useSummary();
  const base = summary.data?.currency ?? 'EUR';
  const [yearAgo] = useState(() => new Date(Date.now() - 365 * 86_400_000).toISOString().slice(0, 10));
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<Dividend | null>(null);
  const remove = useAction((id: string) => api(`/api/dividends/${id}`, { method: 'DELETE' }), { success: 'Dividende supprimé', onSuccess: () => setDeleting(null) });
  const add = <Button onClick={() => setAdding(true)}><Plus size={16} className="mr-1.5" />Ajouter</Button>;
  const positions = holdings.data ?? [];

  return (
    <div className="space-y-5">
      <PageHeader title="Dividendes" subtitle="Versements reçus et à venir" action={add} />
      <Loader query={dividends}>
        {(list) => {
          if (!list.length) return <Card><EmptyState icon={<CalendarDays size={26} />} title="Aucun dividende" text="Ajoutez les dividendes de vos positions pour suivre vos revenus passifs et vos prochains versements." action={add} /></Card>;
          const paid = list.filter((d) => d.status === 'paid' && d.payDate >= yearAgo);
          const upcoming = list.filter((d) => d.status !== 'paid');
          const counts = new Map<string, number>();
          for (const d of list) counts.set(d.currency, (counts.get(d.currency) ?? 0) + 1);
          const main = counts.has(base) ? base : [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
          const inMain = list.filter((d) => d.currency === main);
          return (
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <StatCard label="12 derniers mois + à venir" value={<span data-testid="dividends-total">{byCurrency([...paid, ...upcoming], base)}</span>} icon={<CircleDollarSign size={17} className="text-[#34d399]" />} />
                <StatCard label="Versés sur 12 mois" value={byCurrency(paid, base)} icon={<CalendarDays size={17} className="text-[#5b86f0]" />} />
                <StatCard label="À venir" value={byCurrency(upcoming, base)} icon={<Clock size={17} className="text-[#f4be7e]" />} />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                <Card className="lg:col-span-2 min-w-0">
                  <CardHeader><CardTitle>Dividendes par mois</CardTitle></CardHeader>
                  <MonthlyChart list={inMain} currency={main} />
                  {inMain.length < list.length && <p className="text-xs text-[#8e8e98] mt-2">Graphique limité aux dividendes en {main}.</p>}
                </Card>
                <Card className="min-w-0"><CardHeader><CardTitle>Principaux payeurs</CardTitle></CardHeader><Payers list={list} /></Card>
              </div>
              <Card><CardHeader><CardTitle>Calendrier</CardTitle></CardHeader><Calendar list={list} onDelete={setDeleting} /></Card>
            </div>
          );
        }}
      </Loader>
      <Modal isOpen={adding} onClose={() => setAdding(false)} title="Ajouter un dividende">
        {positions.length ? <DividendForm holdings={positions} onDone={() => setAdding(false)} /> : (
          <div className="text-center py-4">
            <p className="text-sm text-[#a0a0a6] mb-4">Un dividende se rattache à une position. Ajoutez d&apos;abord la position qui le verse.</p>
            <Link href="/dashboard/portfolio"><Button>Aller au portefeuille</Button></Link>
          </div>
        )}
      </Modal>
      <ConfirmDialog isOpen={!!deleting} onClose={() => setDeleting(null)} title="Supprimer ce dividende ?" text={deleting ? `${deleting.symbol} : ${formatCurrencyDetailed(deleting.amount, deleting.currency)} du ${formatDate(deleting.payDate)}.` : ''} confirmLabel="Supprimer" loading={remove.isPending} onConfirm={() => deleting && remove.mutate(deleting.id)} />
    </div>
  );
}
