'use client';

import { FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { FormError, Select } from '@/components/ui/kit';
import { useAction } from '@/hooks/data';
import { api } from '@/lib/api';
import { parseAmount } from '@/lib/utils';
import type { Account } from '@/types';

export const FEE_TYPES = ['management', 'transaction', 'custody', 'exchange', 'performance'] as const;

export default function FeeForm({ accounts, onDone }: { accounts: Account[]; onDone: () => void }) {
  const t = useTranslations('fees.form');
  const tt = useTranslations('fees.type');
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');
  const [type, setType] = useState('management');
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [percentage, setPercentage] = useState('');
  const [frequency, setFrequency] = useState('annual');
  const [alternative, setAlternative] = useState('');
  const [error, setError] = useState<string | null>(null);

  const save = useAction((body: object) => api('/api/fees', { method: 'POST', body }), {
    success: t('added'), onSuccess: onDone, onError: (e) => setError(e.message),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const value = parseAmount(amount);
    const pct = percentage.trim() === '' ? 0 : parseAmount(percentage);
    const alt = alternative.trim() === '' ? null : parseAmount(alternative);
    if (Number.isNaN(value) || value < 0) return setError(t('needAmount'));
    if (Number.isNaN(pct) || pct < 0 || pct > 100) return setError(t('percentRange'));
    if (alt !== null && (Number.isNaN(alt) || alt < 0 || alt > 100)) return setError(t('altRange'));
    save.mutate({ accountId, type, label, amount: value, percentage: pct, frequency, alternativeFee: alt });
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <FormError message={error} />
      <Select label={t('account')} value={accountId} onChange={(e) => setAccountId(e.target.value)}>
        {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
      </Select>
      <div className="grid grid-cols-2 gap-3">
        <Select label={t('type')} value={type} onChange={(e) => setType(e.target.value)}>
          {FEE_TYPES.map((k) => <option key={k} value={k}>{tt(k)}</option>)}
        </Select>
        <Select label={t('frequency')} value={frequency} onChange={(e) => setFrequency(e.target.value)}>
          <option value="annual">{t('freq.annual')}</option><option value="quarterly">{t('freq.quarterly')}</option><option value="monthly">{t('freq.monthly')}</option><option value="per-transaction">{t('freq.per-transaction')}</option>
        </Select>
      </div>
      <Input id="fee-label" label={t('label')} value={label} onChange={(e) => setLabel(e.target.value)} placeholder={t('labelPlaceholder')} autoComplete="off" />
      <Input id="fee-amount" label={frequency === 'per-transaction' ? t('amountEstimated') : t('amountPerDue')} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} autoComplete="off" />
      <div className="grid grid-cols-2 gap-3">
        <Input id="fee-percentage" label={t('currentRate')} inputMode="decimal" value={percentage} onChange={(e) => setPercentage(e.target.value)} autoComplete="off" />
        <Input id="fee-alternative" label={t('altRate')} inputMode="decimal" value={alternative} onChange={(e) => setAlternative(e.target.value)} placeholder={t('optional')} autoComplete="off" />
      </div>
      <Button type="submit" loading={save.isPending} className="w-full">{t('submit')}</Button>
    </form>
  );
}
