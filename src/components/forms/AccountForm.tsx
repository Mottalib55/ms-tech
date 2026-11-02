'use client';

import { FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { FormError, Select } from '@/components/ui/kit';
import { useAction } from '@/hooks/data';
import { api } from '@/lib/api';
import { useFinanceLabels } from '@/hooks/useFinanceLabels';
import { ACCOUNT_TYPES } from '@/lib/finance';
import { parseAmount, toInputNumber } from '@/lib/utils';

export const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'AED', 'CAD', 'JPY', 'SAR', 'MAD'];

interface Initial { id: string; name: string; institution: string; type: string; balance: number; currency: string; manual: boolean }

export default function AccountForm({ initial, onDone }: { initial?: Initial; onDone: () => void }) {
  const t = useTranslations('accounts');
  const labels = useFinanceLabels();
  const [name, setName] = useState(initial?.name ?? '');
  const [institution, setInstitution] = useState(initial?.institution ?? '');
  const [type, setType] = useState(initial?.type ?? 'bank');
  const [balance, setBalance] = useState(initial ? toInputNumber(initial.balance) : '');
  const [currency, setCurrency] = useState(initial?.currency ?? 'EUR');
  const [error, setError] = useState<string | null>(null);
  const synced = initial && !initial.manual;
  const isDebt = ACCOUNT_TYPES[type]?.debt;

  const save = useAction(
    (body: object) => (initial ? api(`/api/accounts/${initial.id}`, { method: 'PATCH', body }) : api('/api/accounts', { method: 'POST', body })),
    { success: initial ? t('form.updated') : t('form.added'), onSuccess: onDone, onError: (e) => setError(e.message) },
  );

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (synced) return save.mutate({ name });
    const value = parseAmount(balance);
    if (Number.isNaN(value)) return setError(isDebt ? t('form.debtRequired') : t('form.balanceRequired'));
    save.mutate({ name, institution, type, balance: value, currency });
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <FormError message={error} />
      <Input id="account-name" label={t('form.name')} value={name} onChange={(e) => setName(e.target.value)} placeholder={t('form.namePlaceholder')} required autoComplete="off" />
      {!synced && (
        <>
          <Select label={t('form.type')} value={type} onChange={(e) => setType(e.target.value)}>
            {Object.keys(ACCOUNT_TYPES).map((k) => <option key={k} value={k}>{labels.accountType(k)}</option>)}
          </Select>
          <Input id="account-institution" label={t('form.institution')} value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder={t('form.institutionPlaceholder')} autoComplete="off" />
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Input id="account-balance" label={isDebt ? t('form.debtBalance') : t('form.balance')} inputMode="decimal" dir="ltr" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="0" autoComplete="off" />
            </div>
            <Select label={t('form.currency')} value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
            </Select>
          </div>
        </>
      )}
      <Button type="submit" loading={save.isPending} className="w-full">{initial ? t('save') : t('form.submit')}</Button>
    </form>
  );
}
