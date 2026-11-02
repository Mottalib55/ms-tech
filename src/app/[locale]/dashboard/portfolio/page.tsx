'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { Coins, Plus, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { EmptyState, Loader, PageHeader, StatCard } from '@/components/ui/kit';
import { AllocationDonut } from '@/components/charts/kit';
import HoldingForm from '@/components/forms/HoldingForm';
import { useAccounts, useAction, useHoldings, useSummary } from '@/hooks/data';
import { api } from '@/lib/api';
import { useFinanceLabels } from '@/hooks/useFinanceLabels';
import { cn, formatCurrency, formatCurrencyDetailed, formatCurrencySigned, formatNumber, formatPct, formatPercent } from '@/lib/utils';
import type { Holding } from '@/types';

// Providers and older records name these in English or French; the page shows them in its own language.
const LABELS: Record<string, string> = {
  Other: 'other', Autre: 'other', Autres: 'other', Global: 'world', World: 'world', Monde: 'world',
  USA: 'usa', 'United States': 'usa', 'États-Unis': 'usa', 'North America': 'northAmerica', 'Amérique du Nord': 'northAmerica',
  'Real Estate': 'realEstate', Immobilier: 'realEstate', Diversified: 'diversified', 'Diversifié': 'diversified',
  'Fixed Income': 'fixedIncome', Obligataire: 'fixedIncome', Technology: 'technology', Technologie: 'technology',
  Energy: 'energy', 'Énergie': 'energy', Healthcare: 'healthcare', 'Santé': 'healthcare', Financials: 'financials', Finance: 'financials',
  Industrials: 'industrials', Industrie: 'industrials', Asia: 'asia', Asie: 'asia', France: 'france', Europe: 'europe', Crypto: 'crypto',
};

const valueOf = (h: Holding) => h.quantity * h.currentPrice;
const costOf = (h: Holding) => h.quantity * h.avgPrice;
const gainPct = (h: Holding) => (h.avgPrice > 0 ? ((h.currentPrice - h.avgPrice) / h.avgPrice) * 100 : null);

function Gain({ h }: { h: Holding }) {
  const pct = gainPct(h);
  if (pct === null) return <span className="text-subtle">—</span>;
  return <span className={cn('tabular-nums', pct >= 0 ? 'text-pos' : 'text-neg')}>{formatPercent(pct)}</span>;
}

/** Sums are only ever made inside one currency: the API gives no converted value per position. */
function Breakdown({ title, holdings, keyOf, currency, excluded }: {
  title: string; holdings: Holding[]; keyOf: (h: Holding) => string; currency: string; excluded: number;
}) {
  const t = useTranslations('portfolio');
  const names = useFinanceLabels();
  // Our own stored keys first, then what providers and older records wrote, then the text as typed.
  const label = (s: string) => {
    for (const known of [names.sector(s), names.region(s)]) if (known !== s) return known;
    return LABELS[s] ? t(`label.${LABELS[s]}`) : s;
  };
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
                <span className="text-muted truncate min-w-0">{name}</span>
                <span className="text-ink tabular-nums whitespace-nowrap">{formatPct(pct)}<span className="text-subtle ms-2">{formatCurrency(value, currency)}</span></span>
              </div>
              <div className="w-full bg-hover rounded-full h-1.5"><div className="bg-primary h-1.5 rounded-full" style={{ width: `${pct}%` }} /></div>
            </li>
          );
        })}
      </ul>
      {excluded > 0 && <p className="text-xs text-subtle mt-3">{t('excluded', { currency, count: excluded })}</p>}
    </Card>
  );
}

function ByCurrency({ holdings }: { holdings: Holding[] }) {
  const t = useTranslations('portfolio');
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
        <StatCard label={t('positionsValue')} value={formatCurrency(g.value, currency)} hint={t('count', { count: g.n })} />
        <StatCard
          label={t('unrealized')}
          value={<span className={gain >= 0 ? 'text-pos' : 'text-neg'}>{formatCurrencySigned(gain, currency)}</span>}
          hint={g.cost > 0 ? t('onCost', { percent: formatPercent((gain / g.cost) * 100) }) : undefined}
        />
        {best && <StatCard label={t('best')} value={best.symbol} hint={`${formatPercent(pct(best)!)} · ${best.name}`} />}
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
            label={t('positionsIn', { currency })}
            value={formatCurrency(g.value, currency)}
            hint={<span className={cn('tabular-nums', gain >= 0 ? 'text-pos' : 'text-neg')}>{formatCurrencySigned(gain, currency)}{g.cost > 0 ? ` (${formatPercent((gain / g.cost) * 100)})` : ''}</span>}
          />
        );
      })}
    </div>
  );
}

function Positions({ holdings }: { holdings: Holding[] }) {
  const t = useTranslations('portfolio');
  const labels = useFinanceLabels();
  const sorted = [...holdings].sort((a, b) => valueOf(b) - valueOf(a));
  return (
    <Card>
      <CardHeader><CardTitle>{t('detail')}</CardTitle></CardHeader>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-subtle text-start text-xs">
              <th className="pb-3 font-medium">{t('col.asset')}</th><th className="pb-3 font-medium">{t('col.class')}</th><th className="pb-3 font-medium">{t('col.account')}</th>
              <th className="pb-3 font-medium text-end">{t('col.quantity')}</th><th className="pb-3 font-medium text-end">{t('col.cost')}</th><th className="pb-3 font-medium text-end">{t('col.price')}</th>
              <th className="pb-3 font-medium text-end">{t('col.value')}</th><th className="pb-3 font-medium text-end">{t('col.gain')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {sorted.map((h) => (
              <tr key={h.id} className="text-muted hover:bg-surface">
                <td className="py-3 pe-3"><Link href={`/dashboard/accounts/${h.accountId}`} className="block hover:underline"><span className="block font-medium text-ink">{h.symbol}</span><span className="block text-xs text-subtle max-w-56 truncate">{h.name}</span></Link></td>
                <td className="py-3 pe-3">{labels.assetClass(h.assetClass)}</td>
                <td className="py-3 pe-3 max-w-40 truncate">{h.account?.name}</td>
                <td className="py-3 text-end tabular-nums">{formatNumber(h.quantity)}</td>
                <td className="py-3 text-end tabular-nums">{formatCurrencyDetailed(h.avgPrice, h.currency)}</td>
                <td className="py-3 text-end tabular-nums">{formatCurrencyDetailed(h.currentPrice, h.currency)}</td>
                <td className="py-3 text-end tabular-nums font-medium text-ink">{formatCurrency(valueOf(h), h.currency)}</td>
                <td className="py-3 text-end"><Gain h={h} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="md:hidden divide-y divide-line">
        {sorted.map((h) => (
          <li key={h.id}>
            <Link href={`/dashboard/accounts/${h.accountId}`} className="flex items-center justify-between gap-3 py-3 min-h-14">
              <span className="min-w-0">
                <span className="block text-sm font-medium text-ink truncate">{h.symbol} <span className="font-normal text-muted">· {h.name}</span></span>
                <span className="block text-xs text-subtle truncate"><bdi>{formatNumber(h.quantity)} × {formatCurrencyDetailed(h.currentPrice, h.currency)}</bdi> · {h.account?.name}</span>
              </span>
              <span className="text-end shrink-0">
                <span className="block text-sm font-semibold tabular-nums text-ink">{formatCurrency(valueOf(h), h.currency)}</span>
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
  const t = useTranslations('portfolio');
  const holdings = useHoldings();
  const summary = useSummary();
  const accounts = useAccounts();
  const [adding, setAdding] = useState(false);
  const hasAccount = (accounts.data ?? []).some((a) => a.type !== 'loan');
  const currency = summary.data?.currency ?? 'EUR';

  const refresh = useAction(() => api<{ updated: number }>('/api/crypto/prices', { method: 'POST' }), {
    success: (r) => (r.updated > 0 ? t('refreshed', { count: r.updated }) : t('nothingRefreshed')),
  });

  const list = holdings.data ?? [];
  const hasCrypto = list.some((h) => h.assetClass === 'crypto');
  const add = <Button onClick={() => setAdding(true)}><Plus size={16} className="me-1.5" />{t('add')}</Button>;

  // Region and sector need one currency: the user's when they hold any, otherwise their first.
  const refCurrency = list.some((h) => h.currency === currency) ? currency : list[0]?.currency ?? currency;
  const comparable = list.filter((h) => h.currency === refCurrency);
  const excluded = list.length - comparable.length;

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('title')}
        subtitle={t('count', { count: list.length })}
        action={
          <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto [&>button]:w-full sm:[&>button]:w-auto">
            {hasCrypto && <Button variant="secondary" loading={refresh.isPending} onClick={() => refresh.mutate()}><RefreshCw size={15} className="me-1.5" />{t('refreshCrypto')}</Button>}
            {add}
          </div>
        }
      />
      <Loader query={holdings}>
        {(rows) => rows.length === 0 ? (
          <Card><EmptyState icon={<Coins size={26} />} title={t('emptyTitle')} text={t('emptyText')} action={add} /></Card>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            <ByCurrency holdings={rows} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              <Card className="min-w-0">
                <CardHeader><CardTitle>{t('byClass')}</CardTitle></CardHeader>
                {summary.data?.allocation.length ? <AllocationDonut slices={summary.data.allocation} currency={currency} /> : <p className="text-sm text-muted py-10 text-center">{t('unavailable')}</p>}
              </Card>
              <Breakdown title={t('byRegion')} holdings={comparable} keyOf={(h) => h.region} currency={refCurrency} excluded={excluded} />
              <Breakdown title={t('bySector')} holdings={comparable} keyOf={(h) => h.sector} currency={refCurrency} excluded={excluded} />
            </div>
            <Positions holdings={rows} />
          </div>
        )}
      </Loader>
      <Modal isOpen={adding} onClose={() => setAdding(false)} title={t('add')}>
        {hasAccount || accounts.isPending ? <HoldingForm onDone={() => setAdding(false)} /> : (
          <div className="text-center py-4">
            <p className="text-sm text-muted mb-4">{t('needAccount')}</p>
            <Link href="/dashboard/accounts?add=1"><Button>{t('createAccount')}</Button></Link>
          </div>
        )}
      </Modal>
    </div>
  );
}
