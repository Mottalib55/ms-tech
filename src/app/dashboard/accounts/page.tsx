'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, Bitcoin, Building2, ChevronRight, CreditCard, Home, Landmark, Link2, Plus, Shield, Wallet } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { EmptyState, Loader, PageHeader } from '@/components/ui/kit';
import AccountForm from '@/components/forms/AccountForm';
import { useAccounts, useSummary } from '@/hooks/data';
import { ACCOUNT_TYPES } from '@/lib/finance';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import type { Account } from '@/types';

const ACCOUNT_ICONS: Record<string, typeof Building2> = {
  brokerage: Building2, bank: Landmark, crypto: Bitcoin, 'real-estate': Home, insurance: Shield, loan: CreditCard, other: Wallet,
};

function AccountRow({ account }: { account: Account }) {
  const Icon = ACCOUNT_ICONS[account.type] ?? Wallet;
  const debt = ACCOUNT_TYPES[account.type]?.debt;
  return (
    <li>
      <Link href={`/dashboard/accounts/${account.id}`} className="flex items-center gap-3 p-3 sm:p-4 hover:bg-white/[0.03] active:bg-white/[0.05] transition-colors">
        <span className="w-10 h-10 shrink-0 rounded-[12px] flex items-center justify-center" style={{ backgroundColor: `${account.color}1f`, color: account.color }}><Icon size={19} /></span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-sm text-[#f5f5f5] truncate">{account.name}</span>
          <span className="flex items-center gap-1 text-xs text-[#8e8e98] truncate">
            {account.status === 'error' ? <span className="text-[#f87171] inline-flex items-center gap-1"><AlertCircle size={12} />Erreur de synchronisation</span> : <>{account.institution}{account.manual ? '' : ` · synchronisé ${formatRelativeTime(account.lastSync).toLowerCase()}`}</>}
          </span>
        </span>
        <span className="text-right shrink-0">
          <span className={`block font-semibold text-sm tabular-nums ${debt ? 'text-[#f87171]' : 'text-[#f5f5f5]'}`}>{debt ? '−' : ''}{formatCurrency(account.balance, account.currency)}</span>
          {account.positionCount > 0 && <span className="block text-xs text-[#8e8e98]">{account.positionCount} position{account.positionCount > 1 ? 's' : ''}</span>}
        </span>
        <ChevronRight size={16} className="text-[#8e8e98] shrink-0" />
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
  const [adding, setAdding] = useState(false);
  const accounts = useAccounts();
  const summary = useSummary();
  const addButton = <Button onClick={() => setAdding(true)}><Plus size={16} className="mr-1.5" />Ajouter</Button>;

  return (
    <div className="space-y-5">
      <Suspense><AddOnOpen onOpen={() => setAdding(true)} /></Suspense>
      <PageHeader
        title="Comptes"
        subtitle={summary.data ? `${summary.data.accountCount} compte${summary.data.accountCount > 1 ? 's' : ''} · ${formatCurrency(summary.data.netWorth, summary.data.currency)} net` : undefined}
        action={addButton}
      />
      <Loader query={accounts}>
        {(list) => list.length === 0 ? (
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-[16px]">
            <EmptyState icon={<Wallet size={26} />} title="Aucun compte pour l'instant" text="Saisissez un compte, un bien immobilier ou un crédit, ou connectez votre banque pour tout récupérer automatiquement."
              action={<div className="flex flex-col sm:flex-row gap-3">{addButton}<Link href="/dashboard/connections"><Button variant="outline" className="w-full"><Link2 size={16} className="mr-2" />Connecter une banque</Button></Link></div>} />
          </div>
        ) : (
          <div className="space-y-5">
            {GROUP_ORDER.filter((t) => list.some((a) => a.type === t)).map((type) => {
              const group = list.filter((a) => a.type === type);
              return (
                <section key={type} aria-label={ACCOUNT_TYPES[type].name}>
                  <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-[#8e8e98] mb-2 px-1">{ACCOUNT_TYPES[type].name}</h2>
                  <ul className="bg-white/[0.03] border border-white/[0.06] rounded-[16px] divide-y divide-white/[0.05] overflow-hidden">
                    {group.map((a) => <AccountRow key={a.id} account={a} />)}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </Loader>
      <Modal isOpen={adding} onClose={() => setAdding(false)} title="Ajouter un compte">
        <AccountForm onDone={() => setAdding(false)} />
        <p className="text-xs text-[#a0a0a6] mt-4 text-center">Pour récupérer vos comptes automatiquement : <Link href="/dashboard/connections" className="text-[#f4be7e] underline">Connexions</Link></p>
      </Modal>
    </div>
  );
}
