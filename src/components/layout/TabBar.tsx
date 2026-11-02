'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { LogOut, Menu } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import { ALL_NAV, TAB_ITEMS, isActive } from './nav';

export default function TabBar() {
  const pathname = usePathname();
  const [more, setMore] = useState(false);
  const onTab = TAB_ITEMS.some((t) => isActive(pathname, t.href));
  const rest = ALL_NAV.filter((n) => !TAB_ITEMS.some((t) => t.href === n.href));

  return (
    <>
      <nav aria-label="Navigation principale" className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#101012]/95 backdrop-blur-xl border-t border-white/[0.06] pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5 h-[60px]">
          {TAB_ITEMS.map((t) => {
            const active = isActive(pathname, t.href);
            return (
              <Link key={t.href} href={t.href} aria-current={active ? 'page' : undefined} className={cn('flex flex-col items-center justify-center gap-1 text-[10px] font-medium active:opacity-60', active ? 'text-[#f4be7e]' : 'text-[#a0a0a6]')}>
                <t.icon size={21} />{t.label}
              </Link>
            );
          })}
          <button onClick={() => setMore(true)} aria-haspopup="dialog" className={cn('flex flex-col items-center justify-center gap-1 text-[10px] font-medium active:opacity-60', !onTab ? 'text-[#f4be7e]' : 'text-[#a0a0a6]')}>
            <Menu size={21} />Plus
          </button>
        </div>
      </nav>
      <Modal isOpen={more} onClose={() => setMore(false)} title="Plus">
        <div className="grid grid-cols-1 gap-1">
          {rest.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setMore(false)} className={cn('flex items-center gap-3 h-12 px-3 rounded-[12px] text-sm font-medium', isActive(pathname, n.href) ? 'bg-[#f4be7e]/10 text-[#f4be7e]' : 'text-[#f5f5f5] active:bg-white/[0.06]')}>
              <n.icon size={20} />{n.label}
            </Link>
          ))}
          <button onClick={() => signOut({ callbackUrl: '/login' })} className="flex items-center gap-3 h-12 px-3 rounded-[12px] text-sm font-medium text-[#f87171] active:bg-white/[0.06]">
            <LogOut size={20} />Déconnexion
          </button>
        </div>
      </Modal>
    </>
  );
}
