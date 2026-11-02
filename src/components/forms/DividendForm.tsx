'use client';

import { FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { FormError, Select } from '@/components/ui/kit';
import { useAction } from '@/hooks/data';
import { api } from '@/lib/api';
import { parseAmount } from '@/lib/utils';
import type { Holding } from '@/types';
import { CURRENCIES } from './AccountForm';

export default function DividendForm({ holdings, onDone }: { holdings: Holding[]; onDone: () => void }) {
  const t = useTranslations('dividends.form');
  const ts = useTranslations('dividends.status');
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
    success: t('added'), onSuccess: onDone, onError: (e) => setError(e.message),
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
    if (Number.isNaN(value) || value <= 0) return setError(t('needAmount'));
    if (exDate > payDate) return setError(t('dates'));
    save.mutate({ holdingId, amount: value, currency, exDate, payDate, status, frequency });
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <FormError message={error} />
      <Select label={t('position')} value={holdingId} onChange={(e) => pick(e.target.value)}>
        {holdings.map((h) => <option key={h.id} value={h.id}>{h.symbol} · {h.name}</option>)}
      </Select>
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2"><Input id="dividend-amount" label={t('amount')} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} autoComplete="off" /></div>
        <Select label={t('currency')} value={currency} onChange={(e) => setCurrency(e.target.value)}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input id="dividend-ex" label={t('ex')} dir="ltr" type="date" value={exDate} onChange={(e) => setExDate(e.target.value)} />
        <Input id="dividend-pay" label={t('pay')} dir="ltr" type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
        <Select label={t('status')} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="paid">{ts('paid')}</option><option value="confirmed">{ts('confirmed')}</option><option value="projected">{ts('projected')}</option>
        </Select>
        <Select label={t('frequency')} value={frequency} onChange={(e) => setFrequency(e.target.value)}>
          <option value="monthly">{t('freq.monthly')}</option><option value="quarterly">{t('freq.quarterly')}</option><option value="semi-annual">{t('freq.semi-annual')}</option><option value="annual">{t('freq.annual')}</option>
        </Select>
      </div>
      <Button type="submit" loading={save.isPending} className="w-full">{t('submit')}</Button>
    </form>
  );
}
