'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Coins, Plus, RefreshCw } from 'lucide-react';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { EmptyState, Loader, PageHeader, StatCard } from '@/components/ui/kit';
import { AllocationDonut } from '@/components/charts/kit';
import HoldingForm from '@/components/forms/HoldingForm';
import { useAccounts, useAction, useHoldings, useSummary } from '@/hooks/data';
import { api } from '@/lib/api';
import { ASSET_CLASSES } from '@/lib/finance';
import { cn, formatCurrency, formatCurrencyDetailed, formatPercent } from '@/lib/utils';
import type { Holding } from '@/types';

// Providers report these in English; the page speaks French.
const LABELS: Record<string, string> = {
  Other: 'Autre', Global: 'Monde', World: 'Monde', USA: 'États-Unis', 'United States': 'États-Unis', 'North America': 'Amérique du Nord',
  'Real Estate': 'Immobilier', Diversified: 'Diversifié', 'Fixed Income': 'Obligataire', Technology: 'Technologie', Energy: 'Énergie',
  Healthcare: 'Santé', Financials: 'Finance', Industrials: 'Industrie', Asia: 'Asie', France: 'France', Europe: 'Europe',
};
const label = (s: string) => LABELS[s] ?? s;

const valueOf = (h: Holding) => h.quantity * h.currentPrice;
const costOf = (h: Holding) => h.quantity * h.avgPrice;
const gainPct = (h: Holding) => (h.avgPrice > 0 ? ((h.currentPrice - h.avgPrice) / h.avgPrice) * 100 : null);

function Gain({ h }: { h: Holding }) {
  const pct = gainPct(h);
  if (pct === null) return <span className="text-[#8e8e98]">—</span>;
  return <span className={cn('tabular-nums', pct >= 0 ? 'text-[#34d399]' : 'text-[#f87171]')}>{formatPercent(pct)}</span>;
}

/** Sums are only ever made inside one currency: the API gives no converted value per position. */
function Breakdown({ title, holdings, keyOf, currency, excluded }: {
  title: string; holdings: Holding[]; keyOf: (h: Holding) => string; currency: string; excluded: number;
}) {
  const totals = new Map<string, number>();
  for (const h of holdings) totals.set(label(keyOf(h)), (totals.get(label(keyOf(h))) ?? 0) + valueOf(h));
  const sum = [...totals.values()].reduce((a, b) => a + b, 0);
  const rows = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  return (
    <Card className="min-w-0">
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <ul className="space-y-3">
        {rows.map(([name, value]) => {
          const pct = sum > 0 ? (value / sum) * 100 : 0;
          return (
            <li key={name}>
              <div className="flex justify-between gap-3 text-sm mb-1">
                <span className="text-[#a0a0a6] truncate min-w-0">{name}</span>
                <span className="text-[#f5f5f5] tabular-nums whitespace-nowrap">{pct.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %<span className="text-[#8e8e98] ml-2">{formatCurrency(value, currency)}</span></span>
              </div>
              <div className="w-full bg-white/[0.05] rounded-full h-1.5"><div className="bg-[#f4be7e] h-1.5 rounded-full" style={{ width: `${pct}%` }} /></div>
            </li>
          );
        })}
      </ul>
      {excluded > 0 && <p className="text-xs text-[#8e8e98] mt-3">Calculé sur les positions en {currency} ; {excluded} position{excluded > 1 ? 's' : ''} dans une autre devise non incluse{excluded > 1 ? 's' : ''}.</p>}
    </Card>
  );
}

function ByCurrency({ holdings }: { holdings: Holding[] }) {
  const groups = new Map<string, { value: number; cost: number; n: number }>();
  for (const h of holdings) {
    const g = groups.get(h.currency) ?? { value: 0, cost: 0, n: 0 };
    groups.set(h.currency, { value: g.value + valueOf(h), cost: g.cost + costOf(h), n: g.n + 1 });
  }
  if (groups.size === 1) {
    const [[currency, g]] = [...groups.entries()];
    const gain = g.value - g.cost;
    const pct = (h: Holding) => (costOf(h) > 0 ? ((valueOf(h) - costOf(h)) / costOf(h)) * 100 : null);
    const best = holdings.filter((h) => pct(h) !== null).sort((a, b) => pct(b)! - pct(a)!)[0];
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <StatCard label="Valeur des positions" value={formatCurrency(g.value, currency)} hint={`${g.n} position${g.n > 1 ? 's' : ''}`} />
        <StatCard
          label="Plus-value latente"
          value={<span className={gain >= 0 ? 'text-[#34d399]' : 'text-[#f87171]'}>{gain >= 0 ? '+' : ''}{formatCurrency(gain, currency)}</span>}
          hint={g.cost > 0 ? `${formatPercent((gain / g.cost) * 100)} sur le prix de revient` : undefined}
        />
        {best && <StatCard label="Meilleure position" value={best.symbol} hint={`${formatPercent(pct(best)!)} · ${best.name}`} />}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {[...groups.entries()].map(([currency, g]) => {
        const gain = g.value - g.cost;
        return (
          <StatCard
            key={currency}
            label={`Positions en ${currency}`}
            value={formatCurrency(g.value, currency)}
            hint={<span className={cn('tabular-nums', gain >= 0 ? 'text-[#34d399]' : 'text-[#f87171]')}>{gain >= 0 ? '+' : ''}{formatCurrency(gain, currency)}{g.cost > 0 ? ` (${formatPercent((gain / g.cost) * 100)})` : ''}</span>}
          />
        );
      })}
    </div>
  );
}

function Positions({ holdings }: { holdings: Holding[] }) {
  const sorted = [...holdings].sort((a, b) => valueOf(b) - valueOf(a));
  return (
    <Card>
      <CardHeader><CardTitle>Détail des positions</CardTitle></CardHeader>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[#8e8e98] text-left text-[10px] uppercase tracking-wider">
              <th className="pb-3 font-medium">Actif</th><th className="pb-3 font-medium">Classe</th><th className="pb-3 font-medium">Compte</th>
              <th className="pb-3 font-medium text-right">Quantité</th><th className="pb-3 font-medium text-right">Prix de revient</th><th className="pb-3 font-medium text-right">Cours</th>
              <th className="pb-3 font-medium text-right">Valeur</th><th className="pb-3 font-medium text-right">Plus-value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {sorted.map((h) => (
              <tr key={h.id} className="text-[#a0a0a6] hover:bg-white/[0.02]">
                <td className="py-3 pr-3"><Link href={`/dashboard/accounts/${h.accountId}`} className="block hover:text-[#f4be7e]"><span className="block font-medium text-[#f5f5f5]">{h.symbol}</span><span className="block text-xs text-[#8e8e98] max-w-56 truncate">{h.name}</span></Link></td>
                <td className="py-3 pr-3">{ASSET_CLASSES[h.assetClass]?.name ?? h.assetClass}</td>
                <td className="py-3 pr-3 max-w-40 truncate">{h.account?.name}</td>
                <td className="py-3 text-right tabular-nums">{h.quantity.toLocaleString('fr-FR')}</td>
                <td className="py-3 text-right tabular-nums">{formatCurrencyDetailed(h.avgPrice, h.currency)}</td>
                <td className="py-3 text-right tabular-nums">{formatCurrencyDetailed(h.currentPrice, h.currency)}</td>
                <td className="py-3 text-right tabular-nums font-medium text-[#f5f5f5]">{formatCurrency(valueOf(h), h.currency)}</td>
                <td className="py-3 text-right"><Gain h={h} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="md:hidden divide-y divide-white/[0.05]">
        {sorted.map((h) => (
          <li key={h.id}>
            <Link href={`/dashboard/accounts/${h.accountId}`} className="flex items-center justify-between gap-3 py-3 min-h-14">
              <span className="min-w-0">
                <span className="block text-sm font-medium text-[#f5f5f5] truncate">{h.symbol} <span className="font-normal text-[#a0a0a6]">· {h.name}</span></span>
                <span className="block text-xs text-[#8e8e98] truncate">{h.quantity.toLocaleString('fr-FR')} × {formatCurrencyDetailed(h.currentPrice, h.currency)} · {h.account?.name}</span>
              </span>
              <span className="text-right shrink-0">
                <span className="block text-sm font-semibold tabular-nums text-[#f5f5f5]">{formatCurrency(valueOf(h), h.currency)}</span>
                <span className="block text-xs"><Gain h={h} /></span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default function PortfolioPage() {
  const holdings = useHoldings();
  const summary = useSummary();
  const accounts = useAccounts();
  const [adding, setAdding] = useState(false);
  const hasAccount = (accounts.data ?? []).some((a) => a.type !== 'loan');
  const currency = summary.data?.currency ?? 'EUR';

  const refresh = useAction(() => api<{ updated: number }>('/api/crypto/prices', { method: 'POST' }), {
    success: (r) => (r.updated > 0 ? `${r.updated} cours actualisé${r.updated > 1 ? 's' : ''}` : 'Aucun cours à actualiser : ces symboles ne sont pas reconnus.'),
  });

  const list = holdings.data ?? [];
  const hasCrypto = list.some((h) => h.assetClass === 'crypto');
  const add = <Button onClick={() => setAdding(true)}><Plus size={16} className="mr-1.5" />Ajouter une position</Button>;

  // Region and sector need one currency: the user's when they hold any, otherwise their first.
  const refCurrency = list.some((h) => h.currency === currency) ? currency : list[0]?.currency ?? currency;
  const comparable = list.filter((h) => h.currency === refCurrency);
  const excluded = list.length - comparable.length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Portefeuille"
        subtitle={`${list.length} position${list.length > 1 ? 's' : ''}`}
        action={
          <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto [&>button]:w-full sm:[&>button]:w-auto">
            {hasCrypto && <Button variant="secondary" loading={refresh.isPending} onClick={() => refresh.mutate()}><RefreshCw size={15} className="mr-1.5" />Actualiser les cours crypto</Button>}
            {add}
          </div>
        }
      />
      <Loader query={holdings}>
        {(rows) => rows.length === 0 ? (
          <Card><EmptyState icon={<Coins size={26} />} title="Aucune position" text="Ajoutez vos actions, ETF ou cryptos pour suivre leur valeur, leur plus-value et leur répartition." action={add} /></Card>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            <ByCurrency holdings={rows} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              <Card className="min-w-0">
                <CardHeader><CardTitle>Par classe d&apos;actifs</CardTitle></CardHeader>
                {summary.data?.allocation.length ? <AllocationDonut slices={summary.data.allocation} currency={currency} /> : <p className="text-sm text-[#a0a0a6] py-10 text-center">Répartition indisponible.</p>}
              </Card>
              <Breakdown title="Par région" holdings={comparable} keyOf={(h) => h.region} currency={refCurrency} excluded={excluded} />
              <Breakdown title="Par secteur" holdings={comparable} keyOf={(h) => h.sector} currency={refCurrency} excluded={excluded} />
            </div>
            <Positions holdings={rows} />
          </div>
        )}
      </Loader>
      <Modal isOpen={adding} onClose={() => setAdding(false)} title="Ajouter une position">
        {hasAccount || accounts.isPending ? <HoldingForm onDone={() => setAdding(false)} /> : (
          <div className="text-center py-4">
            <p className="text-sm text-[#a0a0a6] mb-4">Une position appartient à un compte. Créez d&apos;abord le compte qui la détient.</p>
            <Link href="/dashboard/accounts?add=1"><Button>Créer un compte</Button></Link>
          </div>
        )}
      </Modal>
    </div>
  );
}
