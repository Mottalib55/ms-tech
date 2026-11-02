'use client';

import { FormEvent, use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { ConfirmDialog, FormError, Loader, Select } from '@/components/ui/kit';
import AccountForm from '@/components/forms/AccountForm';
import HoldingForm from '@/components/forms/HoldingForm';
import { useAccount, useAction } from '@/hooks/data';
import { api } from '@/lib/api';
import { ACCOUNT_TYPES, ASSET_CLASSES } from '@/lib/finance';
import { cn, formatCurrency, formatCurrencyDetailed, formatDate, formatPercent, formatRelativeTime, parseAmount } from '@/lib/utils';
import type { AccountDetail, Holding, Transaction } from '@/types';

const TX_LABELS: Record<string, string> = { deposit: 'Entrée', withdrawal: 'Sortie', buy: 'Achat', sell: 'Vente', dividend: 'Dividende', fee: 'Frais', transfer: 'Virement' };

function TransactionForm({ account, onDone }: { account: AccountDetail; onDone: () => void }) {
  const [kind, setKind] = useState('deposit');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const save = useAction((body: object) => api('/api/transactions', { method: 'POST', body }), { success: 'Opération ajoutée', onSuccess: onDone, onError: (e) => setError(e.message) });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const value = parseAmount(amount);
    if (Number.isNaN(value) || value === 0) return setError('Indiquez un montant.');
    const signed = ['withdrawal', 'buy', 'fee'].includes(kind) ? -Math.abs(value) : Math.abs(value);
    save.mutate({ accountId: account.id, type: kind, amount: signed, date, description });
  };
  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <FormError message={error} />
      <Select label="Type" value={kind} onChange={(e) => setKind(e.target.value)}>{Object.entries(TX_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select>
      <Input id="tx-amount" label={`Montant (${account.currency})`} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} autoComplete="off" />
      <Input id="tx-date" label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <Input id="tx-desc" label="Libellé (facultatif)" value={description} onChange={(e) => setDescription(e.target.value)} autoComplete="off" />
      <p className="text-xs text-[#a0a0a6]">Le solde du compte sera mis à jour.</p>
      <Button type="submit" loading={save.isPending} className="w-full">Ajouter l&apos;opération</Button>
    </form>
  );
}

function Positions({ account }: { account: AccountDetail }) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Holding | null>(null);
  const [deleting, setDeleting] = useState<Holding | null>(null);
  const remove = useAction((id: string) => api(`/api/holdings/${id}`, { method: 'DELETE' }), { success: 'Position supprimée', onSuccess: () => setDeleting(null) });
  return (
    <Card>
      <CardHeader>
        <CardTitle>Positions</CardTitle>
        <Button size="sm" variant="secondary" onClick={() => setAdding(true)}><Plus size={14} className="mr-1" />Ajouter</Button>
      </CardHeader>
      {account.holdings.length === 0 ? <p className="text-sm text-[#a0a0a6] py-4 text-center">Aucune position sur ce compte.</p> : (
        <ul className="divide-y divide-white/[0.05]">
          {account.holdings.map((h) => {
            const value = h.quantity * h.currentPrice;
            const pct = h.avgPrice > 0 ? ((h.currentPrice - h.avgPrice) / h.avgPrice) * 100 : 0;
            return (
              <li key={h.id} className="flex items-center gap-2 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-[#f5f5f5] truncate">{h.symbol} <span className="font-normal text-[#a0a0a6]">· {h.name}</span></span>
                  <span className="block text-xs text-[#8e8e98]">{h.quantity.toLocaleString('fr-FR')} × {formatCurrencyDetailed(h.currentPrice, h.currency)} · {ASSET_CLASSES[h.assetClass]?.name ?? h.assetClass}</span>
                </span>
                <span className="text-right shrink-0">
                  <span className="block text-sm font-semibold tabular-nums text-[#f5f5f5]">{formatCurrency(value, h.currency)}</span>
                  <span className={cn('block text-xs tabular-nums', pct >= 0 ? 'text-[#34d399]' : 'text-[#f87171]')}>{formatPercent(pct)}</span>
                </span>
                {(!h.externalId) && (
                  <span className="flex shrink-0">
                    <button onClick={() => setEditing(h)} aria-label={`Modifier ${h.symbol}`} className="w-10 h-10 flex items-center justify-center text-[#a0a0a6] hover:text-[#f5f5f5] rounded-[10px] hover:bg-white/[0.05]"><Pencil size={15} /></button>
                    <button onClick={() => setDeleting(h)} aria-label={`Supprimer ${h.symbol}`} className="w-10 h-10 flex items-center justify-center text-[#a0a0a6] hover:text-[#f87171] rounded-[10px] hover:bg-white/[0.05]"><Trash2 size={15} /></button>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <Modal isOpen={adding} onClose={() => setAdding(false)} title="Ajouter une position"><HoldingForm accountId={account.id} onDone={() => setAdding(false)} /></Modal>
      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title={`Modifier ${editing?.symbol ?? ''}`}>{editing && <HoldingForm initial={editing} onDone={() => setEditing(null)} />}</Modal>
      <ConfirmDialog isOpen={!!deleting} onClose={() => setDeleting(null)} title="Supprimer cette position ?" text={`${deleting?.name ?? ''} sera retirée du compte${account.manual ? ' et son solde ajusté' : ''}.`} confirmLabel="Supprimer" loading={remove.isPending} onConfirm={() => deleting && remove.mutate(deleting.id)} />
    </Card>
  );
}

function Operations({ account }: { account: AccountDetail }) {
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const remove = useAction((id: string) => api(`/api/transactions/${id}`, { method: 'DELETE' }), { success: 'Opération supprimée', onSuccess: () => setDeleting(null) });
  return (
    <Card>
      <CardHeader>
        <CardTitle>Opérations</CardTitle>
        {account.manual && <Button size="sm" variant="secondary" onClick={() => setAdding(true)}><Plus size={14} className="mr-1" />Ajouter</Button>}
      </CardHeader>
      {account.transactions.length === 0 ? <p className="text-sm text-[#a0a0a6] py-4 text-center">Aucune opération.</p> : (
        <ul className="divide-y divide-white/[0.05]">
          {account.transactions.map((t) => (
            <li key={t.id} className="flex items-center gap-2 py-3">
              <span className="min-w-0 flex-1"><span className="block text-sm text-[#f5f5f5] truncate">{t.description || t.name || TX_LABELS[t.type] || t.type}</span><span className="block text-xs text-[#8e8e98]">{formatDate(t.date)} · {TX_LABELS[t.type] ?? t.type}</span></span>
              <span className={cn('text-sm font-medium tabular-nums shrink-0', t.amount >= 0 ? 'text-[#34d399]' : 'text-[#f5f5f5]')}>{t.amount > 0 ? '+' : ''}{formatCurrencyDetailed(t.amount, t.currency)}</span>
              {account.manual && <button onClick={() => setDeleting(t)} aria-label="Supprimer l'opération" className="w-10 h-10 flex shrink-0 items-center justify-center text-[#a0a0a6] hover:text-[#f87171] rounded-[10px] hover:bg-white/[0.05]"><Trash2 size={15} /></button>}
            </li>
          ))}
        </ul>
      )}
      <Modal isOpen={adding} onClose={() => setAdding(false)} title="Ajouter une opération"><TransactionForm account={account} onDone={() => setAdding(false)} /></Modal>
      <ConfirmDialog isOpen={!!deleting} onClose={() => setDeleting(null)} title="Supprimer cette opération ?" text="Le solde du compte sera corrigé." confirmLabel="Supprimer" loading={remove.isPending} onConfirm={() => deleting && remove.mutate(deleting.id)} />
    </Card>
  );
}

function Detail({ account }: { account: AccountDetail }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const remove = useAction(() => api(`/api/accounts/${account.id}`, { method: 'DELETE' }), { success: 'Compte supprimé', onSuccess: () => router.push('/dashboard/accounts') });
  const sync = useAction(() => api(`/api/connections/${account.connection!.id}/sync`, { method: 'POST' }), { success: 'Compte synchronisé' });
  const debt = ACCOUNT_TYPES[account.type]?.debt;
  return (
    <div className="space-y-4">
      <Link href="/dashboard/accounts" className="inline-flex items-center gap-1.5 min-h-9 text-sm text-[#a0a0a6] hover:text-[#f5f5f5]"><ArrowLeft size={15} />Comptes</Link>
      <div>
        <h1 className="text-2xl font-bold text-[#f5f5f5] tracking-tight">{account.name}</h1>
        <p className="text-sm text-[#a0a0a6] mt-0.5">{account.institution} · {ACCOUNT_TYPES[account.type]?.name ?? account.type}</p>
        <p data-testid="account-balance" className={cn('text-3xl sm:text-4xl font-bold tabular-nums mt-3', debt ? 'text-[#f87171]' : 'text-[#f5f5f5]')}>{debt ? '−' : ''}{formatCurrencyDetailed(account.balance, account.currency)}</p>
        <p className="text-xs text-[#8e8e98] mt-1">{account.manual ? 'Saisie manuelle' : 'Synchronisé'} · mis à jour {formatRelativeTime(account.lastSync).toLowerCase()}</p>
        {account.connection?.lastSyncError && <FormError message={account.connection.lastSyncError} />}
        <div className="flex flex-wrap gap-2 mt-4">
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)}><Pencil size={14} className="mr-1.5" />{account.manual ? 'Modifier' : 'Renommer'}</Button>
          {account.connection
            ? <Button variant="secondary" size="sm" loading={sync.isPending} onClick={() => sync.mutate()}><RefreshCw size={14} className="mr-1.5" />Synchroniser</Button>
            : <Button variant="ghost" size="sm" onClick={() => setDeleting(true)} className="text-[#f87171] hover:text-[#f87171]"><Trash2 size={14} className="mr-1.5" />Supprimer</Button>}
        </div>
      </div>
      {!debt && <Positions account={account} />}
      <Operations account={account} />
      <Modal isOpen={editing} onClose={() => setEditing(false)} title={account.manual ? 'Modifier le compte' : 'Renommer le compte'}><AccountForm initial={account} onDone={() => setEditing(false)} /></Modal>
      <ConfirmDialog isOpen={deleting} onClose={() => setDeleting(false)} title="Supprimer ce compte ?" text={`${account.name}, ses positions et ses opérations seront définitivement supprimés.`} confirmLabel="Supprimer" loading={remove.isPending} onConfirm={() => remove.mutate()} />
    </div>
  );
}

export default function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const query = useAccount(id);
  return <Loader query={query}>{(a) => <Detail account={a} />}</Loader>;
}
