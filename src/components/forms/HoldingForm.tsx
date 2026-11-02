'use client';

import { FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { FormError, Select } from '@/components/ui/kit';
import { useAccounts, useAction } from '@/hooks/data';
import { api } from '@/lib/api';
import { useFinanceLabels } from '@/hooks/useFinanceLabels';
import { parseAmount, toInputNumber } from '@/lib/utils';
import { CURRENCIES } from './AccountForm';
import type { Holding } from '@/types';

const CLASSES = ['stocks', 'etf', 'bonds', 'crypto', 'real-estate', 'commodities', 'cash', 'other'];

export default function HoldingForm({ initial, accountId, onDone }: { initial?: Holding; accountId?: string; onDone: () => void }) {
  const t = useTranslations('accounts');
  const labels = useFinanceLabels();
  const accounts = useAccounts();
  const eligible = (accounts.data ?? []).filter((a) => a.type !== 'loan');
  const [account, setAccount] = useState(accountId ?? initial?.accountId ?? '');
  const [symbol, setSymbol] = useState(initial?.symbol ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [assetClass, setAssetClass] = useState(initial?.assetClass ?? 'stocks');
  const [quantity, setQuantity] = useState(initial ? toInputNumber(initial.quantity) : '');
  const [avgPrice, setAvgPrice] = useState(initial ? toInputNumber(initial.avgPrice) : '');
  const [currentPrice, setCurrentPrice] = useState(initial ? toInputNumber(initial.currentPrice) : '');
  const [currency, setCurrency] = useState(initial?.currency ?? 'EUR');
  // Neutral keys show in the reader's language and go back unchanged if left alone.
  const initialSector = initial && initial.sector !== 'other' ? labels.sector(initial.sector) : '';
  const initialRegion = initial && initial.region !== 'world' ? labels.region(initial.region) : '';
  const [sector, setSector] = useState(initialSector);
  const [region, setRegion] = useState(initialRegion);
  const [error, setError] = useState<string | null>(null);

  const save = useAction(
    (body: object) => (initial ? api(`/api/holdings/${initial.id}`, { method: 'PATCH', body }) : api('/api/holdings', { method: 'POST', body })),
    { success: initial ? t('holdingForm.updated') : t('holdingForm.added'), onSuccess: onDone, onError: (e) => setError(e.message) },
  );

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const qty = parseAmount(quantity);
    const avg = parseAmount(avgPrice);
    const cur = parseAmount(currentPrice);
    const target = accountId ?? account ?? eligible[0]?.id;
    if (!initial && !target) return setError(t('holdingForm.accountRequired'));
    if ([qty, avg, cur].some(Number.isNaN)) return setError(t('holdingForm.numbersRequired'));
    save.mutate({
      ...(initial ? {} : { accountId: target }),
      symbol, name, assetClass, quantity: qty, avgPrice: avg, currentPrice: cur, currency,
      sector: sector === initialSector && initial ? initial.sector : sector || 'other',
      region: region === initialRegion && initial ? initial.region : region || 'world',
    });
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <FormError message={error} />
      {!initial && !accountId && (
        <Select label={t('holdingForm.account')} value={account} onChange={(e) => setAccount(e.target.value)}>
          <option value="">{t('holdingForm.choose')}</option>
          {eligible.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </Select>
      )}
      <div className="grid grid-cols-3 gap-3">
        <Input id="holding-symbol" label={t('holdingForm.symbol')} value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="CW8" dir="ltr" autoCapitalize="characters" autoComplete="off" />
        <div className="col-span-2"><Input id="holding-name" label={t('holdingForm.name')} value={name} onChange={(e) => setName(e.target.value)} placeholder="Amundi MSCI World" autoComplete="off" /></div>
      </div>
      <Select label={t('holdingForm.assetClass')} value={assetClass} onChange={(e) => setAssetClass(e.target.value)}>
        {CLASSES.map((c) => <option key={c} value={c}>{labels.assetClass(c)}</option>)}
      </Select>
      <div className="grid grid-cols-2 gap-3">
        <Input id="holding-qty" label={t('holdingForm.quantity')} inputMode="decimal" dir="ltr" value={quantity} onChange={(e) => setQuantity(e.target.value)} autoComplete="off" />
        <Select label={t('form.currency')} value={currency} onChange={(e) => setCurrency(e.target.value)}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</Select>
        <Input id="holding-avg" label={t('holdingForm.avgPrice')} inputMode="decimal" dir="ltr" value={avgPrice} onChange={(e) => setAvgPrice(e.target.value)} autoComplete="off" />
        <Input id="holding-cur" label={t('holdingForm.currentPrice')} inputMode="decimal" dir="ltr" value={currentPrice} onChange={(e) => setCurrentPrice(e.target.value)} autoComplete="off" />
        <Input id="holding-sector" label={t('holdingForm.sector')} value={sector} onChange={(e) => setSector(e.target.value)} autoComplete="off" />
        <Input id="holding-region" label={t('holdingForm.region')} value={region} onChange={(e) => setRegion(e.target.value)} autoComplete="off" />
      </div>
      <Button type="submit" loading={save.isPending} className="w-full">{initial ? t('save') : t('holdingForm.submit')}</Button>
    </form>
  );
}
