'use client';

import { Link } from '@/i18n/navigation';
import { useRouter } from '@/i18n/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { AlertCircle, Bell, Info, Search, TriangleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAccounts, useAlerts, useHoldings } from '@/hooks/data';
import Modal from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import Logo from './Logo';
import { ALL_NAV } from './nav';

function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const tn = useTranslations('nav');
  const t = useTranslations('common.search');
  const [text, setText] = useState('');
  const router = useRouter();
  const accounts = useAccounts();
  const holdings = useHoldings();

  const results = useMemo(() => {
    const q = text.trim().toLowerCase();
    const pages = ALL_NAV.map((n) => ({ key: n.href, title: tn(n.label), sub: t('page'), href: n.href }));
    const acc = (accounts.data ?? []).map((a) => ({ key: a.id, title: a.name, sub: `${t('account')} · ${a.institution}`, href: `/dashboard/accounts/${a.id}` }));
    const pos = (holdings.data ?? []).map((h) => ({ key: h.id, title: `${h.symbol} · ${h.name}`, sub: t('position'), href: `/dashboard/accounts/${h.accountId}` }));
    const all = [...acc, ...pos, ...pages];
    return (q ? all.filter((r) => `${r.title} ${r.sub}`.toLowerCase().includes(q)) : pages).slice(0, 12);
  }, [text, accounts.data, holdings.data, t, tn]);

  const go = (href: string) => { onClose(); setText(''); router.push(href); };

  return (
    <Modal isOpen={open} onClose={onClose} title={t('title')}>
      <form onSubmit={(e) => { e.preventDefault(); if (results[0]) go(results[0].href); }}>
        <input
          type="search" value={text} onChange={(e) => setText(e.target.value)} aria-label={t('aria')}
          placeholder={t('placeholder')}
          className="w-full h-11 px-4 mb-3 bg-bg border border-line rounded-[12px] text-base sm:text-sm text-ink placeholder-subtle focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
      </form>
      {results.length === 0 && <p className="text-sm text-muted py-6 text-center">{t('none', { text })}</p>}
      <ul className="space-y-0.5">
        {results.map((r) => (
          <li key={r.key}>
            <button onClick={() => go(r.href)} className="w-full text-start px-3 min-h-12 py-2 rounded-[10px] hover:bg-hover">
              <span className="block text-sm text-ink truncate">{r.title}</span>
              <span className="block text-xs text-subtle">{r.sub}</span>
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}

const LEVEL = {
  error: { icon: AlertCircle, cls: 'text-neg' },
  warning: { icon: TriangleAlert, cls: 'text-accent' },
  info: { icon: Info, cls: 'text-accent' },
};

function Notifications() {
  const t = useTranslations('common.notifications');
  const { data: alerts } = useAlerts();
  const [open, setOpen] = useState(false);
  const count = alerts?.length ?? 0;
  return (
    <>
      <button onClick={() => setOpen(true)} aria-label={count ? t('count', { count }) : t('title')} className="relative w-11 h-11 flex items-center justify-center hover:bg-hover rounded-[12px] text-muted hover:text-ink transition-colors">
        <Bell size={19} />
        {count > 0 && <span className="absolute top-1.5 end-1.5 min-w-4 h-4 px-1 rounded-full bg-primary text-on-primary text-[10px] font-semibold flex items-center justify-center">{count}</span>}
      </button>
      <Modal isOpen={open} onClose={() => setOpen(false)} title={t('title')}>
        {count === 0 && <p className="text-sm text-muted py-6 text-center">{t('empty')}</p>}
        <ul className="space-y-1">
          {alerts?.map((a) => {
            const L = LEVEL[a.level];
            return (
              <li key={a.id}>
                <Link href={a.href} onClick={() => setOpen(false)} className="flex gap-3 p-3 rounded-[12px] hover:bg-hover">
                  <L.icon size={18} className={cn('shrink-0 mt-0.5', L.cls)} />
                  <span className="min-w-0"><span className="block text-sm text-ink">{a.title}</span><span className="block text-xs text-muted mt-0.5">{a.detail}</span></span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Modal>
    </>
  );
}

export default function Topbar() {
  const tn = useTranslations('nav');
  const t = useTranslations('common.search');
  const { data: session } = useSession();
  const user = session?.user;
  const [search, setSearch] = useState(false);
  const opened = useRef(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); opened.current = true; setSearch(true); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-bg border-b border-line pt-[env(safe-area-inset-top)]">
      <div className="h-14 lg:h-16 flex items-center justify-between gap-3 px-4 lg:px-6">
        <Link href="/dashboard" aria-label={tn('homeLink')} className="lg:hidden"><Logo size="sm" /></Link>
        <button onClick={() => setSearch(true)} className="hidden lg:flex items-center gap-2 h-10 w-72 px-3 bg-surface rounded-[10px] text-sm text-subtle hover:bg-hover transition-colors">
          <Search size={15} />{t('short')}<kbd dir="ltr" className="ms-auto text-[10px] border border-line rounded px-1.5 py-0.5">⌘K</kbd>
        </button>
        <div className="flex items-center gap-1">
          <button onClick={() => setSearch(true)} aria-label={t('title')} className="lg:hidden w-11 h-11 flex items-center justify-center rounded-[12px] text-muted hover:bg-hover"><Search size={19} /></button>
          <Notifications />
          <Link href="/dashboard/settings" aria-label={tn('profile')} className="flex items-center gap-2.5 ms-1 ps-2 lg:ps-3 lg:border-s border-line min-h-11">
            <span className="w-8 h-8 rounded-full flex items-center justify-center bg-surface text-ink text-sm font-medium">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
            <span className="text-sm font-medium text-ink hidden lg:block max-w-40 truncate">{user?.name || tn('myAccount')}</span>
          </Link>
        </div>
      </div>
      {/* Mounted on demand: no page should pay for loading the search index. */}
      {search && <SearchDialog open onClose={() => setSearch(false)} />}
    </header>
  );
}
