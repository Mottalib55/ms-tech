'use client';

import { FormEvent, useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { FormError, Select } from '@/components/ui/kit';
import { useAction } from '@/hooks/data';
import { api } from '@/lib/api';
import { parseAmount } from '@/lib/utils';
import type { Holding } from '@/types';
import { CURRENCIES } from './AccountForm';

export default function DividendForm({ holdings, onDone }: { holdings: Holding[]; onDone: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [holdingId, setHoldingId] = useState(holdings[0]?.id ?? '');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(holdings[0]?.currency ?? 'EUR');
  const [exDate, setExDate] = useState(today);
  const [payDate, setPayDate] = useState(today);
  const [status, setStatus] = useState('paid');
  const [frequency, setFrequency] = useState('quarterly');
  const [error, setError] = useState<string | null>(null);

  const save = useAction((body: object) => api('/api/dividends', { method: 'POST', body }), {
    success: 'Dividende ajouté', onSuccess: onDone, onError: (e) => setError(e.message),
  });

  const pick = (id: string) => {
    setHoldingId(id);
    const h = holdings.find((x) => x.id === id);
    if (h) setCurrency(h.currency);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const value = parseAmount(amount);
    if (Number.isNaN(value) || value <= 0) return setError('Indiquez le montant du dividende.');
    if (exDate > payDate) return setError('La date de détachement doit précéder la date de paiement.');
    save.mutate({ holdingId, amount: value, currency, exDate, payDate, status, frequency });
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <FormError message={error} />
      <Select label="Position" value={holdingId} onChange={(e) => pick(e.target.value)}>
        {holdings.map((h) => <option key={h.id} value={h.id}>{h.symbol} · {h.name}</option>)}
      </Select>
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2"><Input id="dividend-amount" label="Montant total" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} autoComplete="off" /></div>
        <Select label="Devise" value={currency} onChange={(e) => setCurrency(e.target.value)}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input id="dividend-ex" label="Détachement" type="date" value={exDate} onChange={(e) => setExDate(e.target.value)} />
        <Input id="dividend-pay" label="Paiement" type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
        <Select label="Statut" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="paid">Versé</option><option value="confirmed">Confirmé</option><option value="projected">Prévu</option>
        </Select>
        <Select label="Fréquence" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
          <option value="monthly">Mensuelle</option><option value="quarterly">Trimestrielle</option><option value="semi-annual">Semestrielle</option><option value="annual">Annuelle</option>
        </Select>
      </div>
      <Button type="submit" loading={save.isPending} className="w-full">Ajouter le dividende</Button>
    </form>
  );
}
