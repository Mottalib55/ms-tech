'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { AlertCircle, Bell, Info, Search, TriangleAlert } from 'lucide-react';
import { useAccounts, useAlerts, useHoldings } from '@/hooks/data';
import Modal from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import Logo from './Logo';
import { ALL_NAV } from './nav';

function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [text, setText] = useState('');
  const router = useRouter();
  const accounts = useAccounts();
  const holdings = useHoldings();

  const results = useMemo(() => {
    const t = text.trim().toLowerCase();
    const pages = ALL_NAV.map((n) => ({ key: n.href, title: n.label, sub: 'Page', href: n.href }));
    const acc = (accounts.data ?? []).map((a) => ({ key: a.id, title: a.name, sub: `Compte · ${a.institution}`, href: `/dashboard/accounts/${a.id}` }));
    const pos = (holdings.data ?? []).map((h) => ({ key: h.id, title: `${h.symbol} · ${h.name}`, sub: 'Position', href: `/dashboard/accounts/${h.accountId}` }));
    const all = [...acc, ...pos, ...pages];
    return (t ? all.filter((r) => `${r.title} ${r.sub}`.toLowerCase().includes(t)) : pages).slice(0, 12);
  }, [text, accounts.data, holdings.data]);

  const go = (href: string) => { onClose(); setText(''); router.push(href); };

  return (
    <Modal isOpen={open} onClose={onClose} title="Rechercher">
      <form onSubmit={(e) => { e.preventDefault(); if (results[0]) go(results[0].href); }}>
        <input
          type="search" value={text} onChange={(e) => setText(e.target.value)} aria-label="Rechercher un compte, une position, une page"
          placeholder="Compte, position, page…"
          className="w-full h-11 px-4 mb-3 bg-[#0a0a0b] border border-white/[0.12] rounded-[12px] text-base sm:text-sm text-[#f5f5f5] placeholder-[#8e8e98] focus:outline-none focus:ring-2 focus:ring-[#f4be7e]/40"
        />
      </form>
      {results.length === 0 && <p className="text-sm text-[#a0a0a6] py-6 text-center">Aucun résultat pour « {text} »</p>}
      <ul className="space-y-0.5">
        {results.map((r) => (
          <li key={r.key}>
            <button onClick={() => go(r.href)} className="w-full text-left px-3 min-h-12 py-2 rounded-[10px] hover:bg-white/[0.05]">
              <span className="block text-sm text-[#f5f5f5] truncate">{r.title}</span>
              <span className="block text-xs text-[#8e8e98]">{r.sub}</span>
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}

const LEVEL = {
  error: { icon: AlertCircle, cls: 'text-[#f87171]' },
  warning: { icon: TriangleAlert, cls: 'text-[#f4be7e]' },
  info: { icon: Info, cls: 'text-[#5682f2]' },
};

function Notifications() {
  const { data: alerts } = useAlerts();
  const [open, setOpen] = useState(false);
  const count = alerts?.length ?? 0;
  return (
    <>
      <button onClick={() => setOpen(true)} aria-label={count ? `Notifications : ${count}` : 'Notifications'} className="relative w-11 h-11 flex items-center justify-center hover:bg-white/[0.05] rounded-[12px] text-[#a0a0a6] hover:text-[#f5f5f5] transition-colors">
        <Bell size={19} />
        {count > 0 && <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 rounded-full bg-[#f4be7e] text-[#0a0a0b] text-[10px] font-bold flex items-center justify-center">{count}</span>}
      </button>
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Notifications">
        {count === 0 && <p className="text-sm text-[#a0a0a6] py-6 text-center">Rien à signaler. Vous serez prévenu ici en cas d&apos;erreur de synchronisation, de budget dépassé ou de dividende à venir.</p>}
        <ul className="space-y-1">
          {alerts?.map((a) => {
            const L = LEVEL[a.level];
            return (
              <li key={a.id}>
                <Link href={a.href} onClick={() => setOpen(false)} className="flex gap-3 p-3 rounded-[12px] hover:bg-white/[0.05]">
                  <L.icon size={18} className={cn('shrink-0 mt-0.5', L.cls)} />
                  <span className="min-w-0"><span className="block text-sm text-[#f5f5f5]">{a.title}</span><span className="block text-xs text-[#a0a0a6] mt-0.5">{a.detail}</span></span>
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
    <header className="sticky top-0 z-30 bg-[#0a0a0b]/90 backdrop-blur-xl border-b border-white/[0.05] pt-[env(safe-area-inset-top)]">
      <div className="h-14 lg:h-16 flex items-center justify-between gap-3 px-4 lg:px-6">
        <Link href="/dashboard" aria-label="MS Tech, accueil" className="lg:hidden"><Logo size="sm" /></Link>
        <button onClick={() => setSearch(true)} className="hidden lg:flex items-center gap-2 h-10 w-72 px-3 bg-white/[0.04] border border-white/[0.06] rounded-[12px] text-sm text-[#8e8e98] hover:border-white/[0.14] transition-colors">
          <Search size={15} />Rechercher…<kbd className="ml-auto text-[10px] border border-white/10 rounded px-1.5 py-0.5">⌘K</kbd>
        </button>
        <div className="flex items-center gap-1">
          <button onClick={() => setSearch(true)} aria-label="Rechercher" className="lg:hidden w-11 h-11 flex items-center justify-center rounded-[12px] text-[#a0a0a6] hover:bg-white/[0.05]"><Search size={19} /></button>
          <Notifications />
          <Link href="/dashboard/settings" aria-label="Mon profil" className="flex items-center gap-2.5 ml-1 pl-2 lg:pl-3 lg:border-l border-white/[0.06] min-h-11">
            <span className="w-8 h-8 rounded-full flex items-center justify-center ring-1 ring-[#f4be7e]/40 bg-[#f4be7e]/10 text-[#f4be7e] text-sm font-semibold">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
            <span className="text-sm font-medium text-[#f5f5f5] hidden lg:block max-w-40 truncate">{user?.name || 'Mon compte'}</span>
          </Link>
        </div>
      </div>
      {/* Mounted on demand: no page should pay for loading the search index. */}
      {search && <SearchDialog open onClose={() => setSearch(false)} />}
    </header>
  );
}
