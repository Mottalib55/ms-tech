'use client';

import { FormEvent, use, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
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
import { useFinanceLabels } from '@/hooks/useFinanceLabels';
import { ACCOUNT_TYPES } from '@/lib/finance';
import { cn, formatCurrency, formatCurrencyDetailed, formatDate, formatNumber, formatPercent, formatRelativeTime, parseAmount } from '@/lib/utils';
import type { AccountDetail, Holding, Transaction } from '@/types';

const TX_TYPES = ['deposit', 'withdrawal', 'buy', 'sell', 'dividend', 'fee', 'transfer'];

function TransactionForm({ account, onDone }: { account: AccountDetail; onDone: () => void }) {
  const t = useTranslations('accounts');
  const [kind, setKind] = useState('deposit');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const save = useAction((body: object) => api('/api/transactions', { method: 'POST', body }), { success: t('opForm.added'), onSuccess: onDone, onError: (e) => setError(e.message) });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const value = parseAmount(amount);
    if (Number.isNaN(value) || value === 0) return setError(t('opForm.amountRequired'));
    const signed = ['withdrawal', 'buy', 'fee'].includes(kind) ? -Math.abs(value) : Math.abs(value);
    save.mutate({ accountId: account.id, type: kind, amount: signed, date, description });
  };
  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <FormError message={error} />
      <Select label={t('opForm.type')} value={kind} onChange={(e) => setKind(e.target.value)}>{TX_TYPES.map((k) => <option key={k} value={k}>{t(`tx.${k}`)}</option>)}</Select>
      <Input id="tx-amount" label={t('opForm.amount', { currency: account.currency })} inputMode="decimal" dir="ltr" value={amount} onChange={(e) => setAmount(e.target.value)} autoComplete="off" />
      <Input id="tx-date" label={t('opForm.date')} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <Input id="tx-desc" label={t('opForm.label')} value={description} onChange={(e) => setDescription(e.target.value)} autoComplete="off" />
      <p className="text-xs text-muted">{t('opForm.balanceNote')}</p>
      <Button type="submit" loading={save.isPending} className="w-full">{t('opForm.submit')}</Button>
    </form>
  );
}

function Positions({ account }: { account: AccountDetail }) {
  const t = useTranslations('accounts');
  const labels = useFinanceLabels();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Holding | null>(null);
  const [deleting, setDeleting] = useState<Holding | null>(null);
  const remove = useAction((id: string) => api(`/api/holdings/${id}`, { method: 'DELETE' }), { success: t('positions.deleted'), onSuccess: () => setDeleting(null) });
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('positions.title')}</CardTitle>
        <Button size="sm" variant="secondary" onClick={() => setAdding(true)}><Plus size={14} className="me-1" />{t('add')}</Button>
      </CardHeader>
      {account.holdings.length === 0 ? <p className="text-sm text-muted py-4 text-center">{t('positions.empty')}</p> : (
        <ul className="divide-y divide-line">
          {account.holdings.map((h) => {
            const value = h.quantity * h.currentPrice;
            const pct = h.avgPrice > 0 ? ((h.currentPrice - h.avgPrice) / h.avgPrice) * 100 : 0;
            return (
              <li key={h.id} className="flex items-center gap-2 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-ink truncate">{h.symbol} <span className="font-normal text-muted">· {h.name}</span></span>
                  <span className="block text-xs text-subtle"><bdi>{formatNumber(h.quantity)} × {formatCurrencyDetailed(h.currentPrice, h.currency)}</bdi> · {labels.assetClass(h.assetClass)}</span>
                </span>
                <span className="text-end shrink-0">
                  <span className="block text-sm font-semibold tabular-nums text-ink">{formatCurrency(value, h.currency)}</span>
                  <bdi className={cn('block text-xs tabular-nums', pct >= 0 ? 'text-pos' : 'text-neg')}>{formatPercent(pct)}</bdi>
                </span>
                {(!h.externalId) && (
                  <span className="flex shrink-0">
                    <button onClick={() => setEditing(h)} aria-label={t('positions.editAria', { symbol: h.symbol })} className="w-10 h-10 flex items-center justify-center text-muted hover:text-ink rounded-[10px] hover:bg-hover"><Pencil size={15} /></button>
                    <button onClick={() => setDeleting(h)} aria-label={t('positions.deleteAria', { symbol: h.symbol })} className="w-10 h-10 flex items-center justify-center text-muted hover:text-neg rounded-[10px] hover:bg-hover"><Trash2 size={15} /></button>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <Modal isOpen={adding} onClose={() => setAdding(false)} title={t('positions.addTitle')}><HoldingForm accountId={account.id} onDone={() => setAdding(false)} /></Modal>
      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title={t('positions.editTitle', { symbol: editing?.symbol ?? '' })}>{editing && <HoldingForm initial={editing} onDone={() => setEditing(null)} />}</Modal>
      <ConfirmDialog isOpen={!!deleting} onClose={() => setDeleting(null)} title={t('positions.deleteTitle')} text={t(account.manual ? 'positions.deleteTextManual' : 'positions.deleteText', { name: deleting?.name ?? '' })} confirmLabel={t('delete')} loading={remove.isPending} onConfirm={() => deleting && remove.mutate(deleting.id)} />
    </Card>
  );
}

function Operations({ account }: { account: AccountDetail }) {
  const tr = useTranslations('accounts');
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const remove = useAction((id: string) => api(`/api/transactions/${id}`, { method: 'DELETE' }), { success: tr('operations.deleted'), onSuccess: () => setDeleting(null) });
  return (
    <Card>
      <CardHeader>
        <CardTitle>{tr('operations.title')}</CardTitle>
        {account.manual && <Button size="sm" variant="secondary" onClick={() => setAdding(true)}><Plus size={14} className="me-1" />{tr('add')}</Button>}
      </CardHeader>
      {account.transactions.length === 0 ? <p className="text-sm text-muted py-4 text-center">{tr('operations.empty')}</p> : (
        <ul className="divide-y divide-line">
          {account.transactions.map((t) => (
            <li key={t.id} className="flex items-center gap-2 py-3">
              <span className="min-w-0 flex-1"><span className="block text-sm text-ink truncate">{t.description || t.name || (tr.has(`tx.${t.type}`) ? tr(`tx.${t.type}`) : t.type)}</span><span className="block text-xs text-subtle">{formatDate(t.date)} · {tr.has(`tx.${t.type}`) ? tr(`tx.${t.type}`) : t.type}</span></span>
              <bdi className={cn('text-sm font-medium tabular-nums shrink-0', t.amount >= 0 ? 'text-pos' : 'text-ink')}>{t.amount > 0 ? '+' : ''}{formatCurrencyDetailed(t.amount, t.currency)}</bdi>
              {account.manual && <button onClick={() => setDeleting(t)} aria-label={tr('operations.deleteAria')} className="w-10 h-10 flex shrink-0 items-center justify-center text-muted hover:text-neg rounded-[10px] hover:bg-hover"><Trash2 size={15} /></button>}
            </li>
          ))}
        </ul>
      )}
      <Modal isOpen={adding} onClose={() => setAdding(false)} title={tr('operations.addTitle')}><TransactionForm account={account} onDone={() => setAdding(false)} /></Modal>
      <ConfirmDialog isOpen={!!deleting} onClose={() => setDeleting(null)} title={tr('operations.deleteTitle')} text={tr('operations.deleteText')} confirmLabel={tr('delete')} loading={remove.isPending} onConfirm={() => deleting && remove.mutate(deleting.id)} />
    </Card>
  );
}

function Detail({ account }: { account: AccountDetail }) {
  const t = useTranslations('accounts');
  const tn = useTranslations('nav');
  const labels = useFinanceLabels();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const remove = useAction(() => api(`/api/accounts/${account.id}`, { method: 'DELETE' }), { success: t('detail.deleted'), onSuccess: () => router.push('/dashboard/accounts') });
  const sync = useAction(() => api(`/api/connections/${account.connection!.id}/sync`, { method: 'POST' }), { success: t('detail.synced') });
  const debt = ACCOUNT_TYPES[account.type]?.debt;
  return (
    <div className="space-y-4">
      <Link href="/dashboard/accounts" className="inline-flex items-center gap-1.5 min-h-9 text-sm text-muted hover:text-ink"><ArrowLeft size={15} className="rtl:-scale-x-100" />{tn('accounts')}</Link>
      <div>
        <h1 className="text-2xl font-semibold text-ink tracking-tight">{account.name}</h1>
        <p className="text-sm text-muted mt-0.5">{account.institution} · {labels.accountType(account.type)}</p>
        <p data-testid="account-balance" className={cn('text-3xl sm:text-4xl font-semibold tracking-tight tabular-nums mt-3', debt ? 'text-neg' : 'text-ink')}><bdi>{debt ? '−' : ''}{formatCurrencyDetailed(account.balance, account.currency)}</bdi></p>
        <p className="text-xs text-subtle mt-1">{account.manual ? t('detail.manualEntry') : t('detail.syncedLabel')} · {t('detail.updated', { when: formatRelativeTime(account.lastSync).toLowerCase() })}</p>
        {account.connection?.lastSyncError && <FormError message={account.connection.lastSyncError} />}
        <div className="flex flex-wrap gap-2 mt-4">
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)}><Pencil size={14} className="me-1.5" />{account.manual ? t('edit') : t('rename')}</Button>
          {account.connection
            ? <Button variant="secondary" size="sm" loading={sync.isPending} onClick={() => sync.mutate()}><RefreshCw size={14} className="me-1.5" />{t('sync')}</Button>
            : <Button variant="ghost" size="sm" onClick={() => setDeleting(true)} className="text-neg hover:text-neg"><Trash2 size={14} className="me-1.5" />{t('delete')}</Button>}
        </div>
      </div>
      {!debt && <Positions account={account} />}
      <Operations account={account} />
      <Modal isOpen={editing} onClose={() => setEditing(false)} title={account.manual ? t('detail.editTitle') : t('detail.renameTitle')}><AccountForm initial={account} onDone={() => setEditing(false)} /></Modal>
      <ConfirmDialog isOpen={deleting} onClose={() => setDeleting(false)} title={t('detail.deleteTitle')} text={t('detail.deleteText', { name: account.name })} confirmLabel={t('delete')} loading={remove.isPending} onConfirm={() => remove.mutate()} />
    </div>
  );
}

export default function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const query = useAccount(id);
  return <Loader query={query}>{(a) => <Detail account={a} />}</Loader>;
}
