'use client';

import { FormEvent, useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { FormError, Select } from '@/components/ui/kit';
import { useAccounts, useAction } from '@/hooks/data';
import { api } from '@/lib/api';
import { ASSET_CLASSES } from '@/lib/finance';
import { parseAmount } from '@/lib/utils';
import { CURRENCIES } from './AccountForm';
import type { Holding } from '@/types';

const CLASSES = ['stocks', 'etf', 'bonds', 'crypto', 'real-estate', 'commodities', 'cash', 'other'];
const fr = (n: number) => String(n).replace('.', ',');

export default function HoldingForm({ initial, accountId, onDone }: { initial?: Holding; accountId?: string; onDone: () => void }) {
  const accounts = useAccounts();
  const eligible = (accounts.data ?? []).filter((a) => a.type !== 'loan');
  const [account, setAccount] = useState(accountId ?? initial?.accountId ?? '');
  const [symbol, setSymbol] = useState(initial?.symbol ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [assetClass, setAssetClass] = useState(initial?.assetClass ?? 'stocks');
  const [quantity, setQuantity] = useState(initial ? fr(initial.quantity) : '');
  const [avgPrice, setAvgPrice] = useState(initial ? fr(initial.avgPrice) : '');
  const [currentPrice, setCurrentPrice] = useState(initial ? fr(initial.currentPrice) : '');
  const [currency, setCurrency] = useState(initial?.currency ?? 'EUR');
  const [sector, setSector] = useState(initial?.sector ?? '');
  const [region, setRegion] = useState(initial?.region ?? '');
  const [error, setError] = useState<string | null>(null);

  const save = useAction(
    (body: object) => (initial ? api(`/api/holdings/${initial.id}`, { method: 'PATCH', body }) : api('/api/holdings', { method: 'POST', body })),
    { success: initial ? 'Position mise à jour' : 'Position ajoutée', onSuccess: onDone, onError: (e) => setError(e.message) },
  );

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const qty = parseAmount(quantity);
    const avg = parseAmount(avgPrice);
    const cur = parseAmount(currentPrice);
    const target = accountId ?? account ?? eligible[0]?.id;
    if (!initial && !target) return setError('Choisissez le compte qui détient cette position.');
    if ([qty, avg, cur].some(Number.isNaN)) return setError('Quantité, prix de revient et cours doivent être des nombres.');
    save.mutate({
      ...(initial ? {} : { accountId: target }),
      symbol, name, assetClass, quantity: qty, avgPrice: avg, currentPrice: cur, currency,
      sector: sector || 'Autre', region: region || 'Monde',
    });
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <FormError message={error} />
      {!initial && !accountId && (
        <Select label="Compte" value={account} onChange={(e) => setAccount(e.target.value)}>
          <option value="">Choisir…</option>
          {eligible.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </Select>
      )}
      <div className="grid grid-cols-3 gap-3">
        <Input id="holding-symbol" label="Symbole" value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="CW8" autoCapitalize="characters" autoComplete="off" />
        <div className="col-span-2"><Input id="holding-name" label="Nom" value={name} onChange={(e) => setName(e.target.value)} placeholder="Amundi MSCI World" autoComplete="off" /></div>
      </div>
      <Select label="Classe d'actif" value={assetClass} onChange={(e) => setAssetClass(e.target.value)}>
        {CLASSES.map((c) => <option key={c} value={c}>{ASSET_CLASSES[c].name}</option>)}
      </Select>
      <div className="grid grid-cols-2 gap-3">
        <Input id="holding-qty" label="Quantité" inputMode="decimal" value={quantity} onChange={(e) => setQuantity(e.target.value)} autoComplete="off" />
        <Select label="Devise" value={currency} onChange={(e) => setCurrency(e.target.value)}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</Select>
        <Input id="holding-avg" label="Prix de revient unitaire" inputMode="decimal" value={avgPrice} onChange={(e) => setAvgPrice(e.target.value)} autoComplete="off" />
        <Input id="holding-cur" label="Cours actuel" inputMode="decimal" value={currentPrice} onChange={(e) => setCurrentPrice(e.target.value)} autoComplete="off" />
        <Input id="holding-sector" label="Secteur (facultatif)" value={sector} onChange={(e) => setSector(e.target.value)} autoComplete="off" />
        <Input id="holding-region" label="Région (facultatif)" value={region} onChange={(e) => setRegion(e.target.value)} autoComplete="off" />
      </div>
      <Button type="submit" loading={save.isPending} className="w-full">{initial ? 'Enregistrer' : 'Ajouter la position'}</Button>
    </form>
  );
}
