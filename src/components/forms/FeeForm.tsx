'use client';

import { FormEvent, useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { FormError, Select } from '@/components/ui/kit';
import { useAction } from '@/hooks/data';
import { api } from '@/lib/api';
import { parseAmount } from '@/lib/utils';
import type { Account } from '@/types';

export const FEE_TYPES: Record<string, string> = {
  management: 'Gestion', transaction: 'Courtage', custody: 'Droits de garde', exchange: 'Change', performance: 'Performance',
};

export default function FeeForm({ accounts, onDone }: { accounts: Account[]; onDone: () => void }) {
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');
  const [type, setType] = useState('management');
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [percentage, setPercentage] = useState('');
  const [frequency, setFrequency] = useState('annual');
  const [alternative, setAlternative] = useState('');
  const [error, setError] = useState<string | null>(null);

  const save = useAction((body: object) => api('/api/fees', { method: 'POST', body }), {
    success: 'Frais ajoutés', onSuccess: onDone, onError: (e) => setError(e.message),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const value = parseAmount(amount);
    const pct = percentage.trim() === '' ? 0 : parseAmount(percentage);
    const alt = alternative.trim() === '' ? null : parseAmount(alternative);
    if (Number.isNaN(value) || value < 0) return setError('Indiquez le montant des frais.');
    if (Number.isNaN(pct) || pct < 0 || pct > 100) return setError('Le pourcentage doit être compris entre 0 et 100.');
    if (alt !== null && (Number.isNaN(alt) || alt < 0 || alt > 100)) return setError('Le taux alternatif doit être compris entre 0 et 100.');
    save.mutate({ accountId, type, label, amount: value, percentage: pct, frequency, alternativeFee: alt });
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <FormError message={error} />
      <Select label="Compte" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
        {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
      </Select>
      <div className="grid grid-cols-2 gap-3">
        <Select label="Type" value={type} onChange={(e) => setType(e.target.value)}>
          {Object.entries(FEE_TYPES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </Select>
        <Select label="Fréquence" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
          <option value="annual">Annuelle</option><option value="quarterly">Trimestrielle</option><option value="monthly">Mensuelle</option><option value="per-transaction">Par opération</option>
        </Select>
      </div>
      <Input id="fee-label" label="Libellé" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Droits de garde…" autoComplete="off" />
      <Input id="fee-amount" label={frequency === 'per-transaction' ? 'Montant annuel estimé' : 'Montant par échéance'} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} autoComplete="off" />
      <div className="grid grid-cols-2 gap-3">
        <Input id="fee-percentage" label="Taux actuel (%)" inputMode="decimal" value={percentage} onChange={(e) => setPercentage(e.target.value)} autoComplete="off" />
        <Input id="fee-alternative" label="Taux alternatif (%)" inputMode="decimal" value={alternative} onChange={(e) => setAlternative(e.target.value)} placeholder="Facultatif" autoComplete="off" />
      </div>
      <Button type="submit" loading={save.isPending} className="w-full">Ajouter les frais</Button>
    </form>
  );
}
