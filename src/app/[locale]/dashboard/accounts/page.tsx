'use client';

import { Suspense, useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useRouter } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AlertCircle, Bitcoin, Building2, ChevronRight, CreditCard, Home, Landmark, Link2, Plus, Shield, Wallet } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { EmptyState, Loader, PageHeader } from '@/components/ui/kit';
import AccountForm from '@/components/forms/AccountForm';
import { useAccounts, useSummary } from '@/hooks/data';
import { useFinanceLabels } from '@/hooks/useFinanceLabels';
import { ACCOUNT_TYPES } from '@/lib/finance';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import type { Account } from '@/types';

const ACCOUNT_ICONS: Record<string, typeof Building2> = {
  brokerage: Building2, bank: Landmark, crypto: Bitcoin, 'real-estate': Home, insurance: Shield, loan: CreditCard, other: Wallet,
};

function AccountRow({ account }: { account: Account }) {
  const t = useTranslations('accounts');
  const Icon = ACCOUNT_ICONS[account.type] ?? Wallet;
  const debt = ACCOUNT_TYPES[account.type]?.debt;
  return (
    <li>
      <Link href={`/dashboard/accounts/${account.id}`} className="flex items-center gap-3 p-3 sm:p-4 hover:bg-hover active:bg-hover transition-colors">
        <span className="w-10 h-10 shrink-0 rounded-[10px] bg-hover text-muted flex items-center justify-center"><Icon size={19} /></span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-sm text-ink truncate">{account.name}</span>
          <span className="flex items-center gap-1 text-xs text-subtle truncate">
            {account.status === 'error' ? <span className="text-neg inline-flex items-center gap-1"><AlertCircle size={12} />{t('syncError')}</span> : <>{account.institution}{account.manual ? '' : ` · ${t('syncedAgo', { when: formatRelativeTime(account.lastSync).toLowerCase() })}`}</>}
          </span>
        </span>
        <span className="text-end shrink-0">
          <bdi className={`block font-semibold text-sm tabular-nums ${debt ? 'text-neg' : 'text-ink'}`}>{debt ? '−' : ''}{formatCurrency(account.balance, account.currency)}</bdi>
          {account.positionCount > 0 && <span className="block text-xs text-subtle">{t('positionCount', { count: account.positionCount })}</span>}
        </span>
        <ChevronRight size={16} className="text-subtle shrink-0 rtl:-scale-x-100" />
      </Link>
    </li>
  );
}

const GROUP_ORDER = ['bank', 'brokerage', 'insurance', 'crypto', 'real-estate', 'other', 'loan'];

function AddOnOpen({ onOpen }: { onOpen: () => void }) {
  const params = useSearchParams();
  const router = useRouter();
  useEffect(() => {
    if (params.get('add') === '1') { onOpen(); router.replace('/dashboard/accounts'); }
  }, [params, onOpen, router]);
  return null;
}

export default function AccountsPage() {
  const t = useTranslations('accounts');
  const tn = useTranslations('nav');
  const labels = useFinanceLabels();
  const [adding, setAdding] = useState(false);
  const accounts = useAccounts();
  const summary = useSummary();
  const addButton = <Button onClick={() => setAdding(true)}><Plus size={16} className="me-1.5" />{t('add')}</Button>;

  return (
    <div className="space-y-5">
      <Suspense><AddOnOpen onOpen={() => setAdding(true)} /></Suspense>
      <PageHeader
        title={tn('accounts')}
        subtitle={summary.data ? t('subtitle', { accounts: t('accountCount', { count: summary.data.accountCount }), net: formatCurrency(summary.data.netWorth, summary.data.currency) }) : undefined}
        action={addButton}
      />
      <Loader query={accounts}>
        {(list) => list.length === 0 ? (
          <div className="bg-surface rounded-[14px]">
            <EmptyState icon={<Wallet size={26} />} title={t('emptyTitle')} text={t('emptyText')}
              action={<div className="flex flex-col sm:flex-row gap-3">{addButton}<Link href="/dashboard/connections"><Button variant="outline" className="w-full"><Link2 size={16} className="me-2" />{t('connectBank')}</Button></Link></div>} />
          </div>
        ) : (
          <div className="space-y-5">
            {GROUP_ORDER.filter((t) => list.some((a) => a.type === t)).map((type) => {
              const group = list.filter((a) => a.type === type);
              return (
                <section key={type} aria-label={labels.accountType(type, ACCOUNT_TYPES[type].name)}>
                  <h2 className="text-xs font-medium text-subtle mb-2 px-1">{labels.accountType(type, ACCOUNT_TYPES[type].name)}</h2>
                  <ul className="bg-surface rounded-[14px] divide-y divide-line overflow-hidden">
                    {group.map((a) => <AccountRow key={a.id} account={a} />)}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </Loader>
      <Modal isOpen={adding} onClose={() => setAdding(false)} title={t('addTitle')}>
        <AccountForm onDone={() => setAdding(false)} />
        <p className="text-xs text-muted mt-4 text-center">{t('autoHint')} <Link href="/dashboard/connections" className="text-accent underline">{tn('connections')}</Link></p>
      </Modal>
    </div>
  );
}
