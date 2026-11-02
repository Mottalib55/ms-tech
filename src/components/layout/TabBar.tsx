'use client';

import { Link } from '@/i18n/navigation';
import { usePathname } from '@/i18n/navigation';
import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { LogOut, Menu } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Modal from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import { ALL_NAV, TAB_ITEMS, isActive } from './nav';

export default function TabBar() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [more, setMore] = useState(false);
  const onTab = TAB_ITEMS.some((tab) => isActive(pathname, tab.href));
  const rest = ALL_NAV.filter((n) => !TAB_ITEMS.some((tab) => tab.href === n.href));

  return (
    <>
      <nav aria-label={t('main')} className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-bg border-t border-line pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5 h-[60px]">
          {TAB_ITEMS.map((tab) => {
            const active = isActive(pathname, tab.href);
            return (
              <Link key={tab.href} href={tab.href} aria-current={active ? 'page' : undefined} className={cn('flex flex-col items-center justify-center gap-1 text-[10px] font-medium active:opacity-60', active ? 'text-accent' : 'text-muted')}>
                <tab.icon size={21} />{t(tab.label)}
              </Link>
            );
          })}
          <button onClick={() => setMore(true)} aria-haspopup="dialog" className={cn('flex flex-col items-center justify-center gap-1 text-[10px] font-medium active:opacity-60', !onTab ? 'text-accent' : 'text-muted')}>
            <Menu size={21} />{t('more')}
          </button>
        </div>
      </nav>
      <Modal isOpen={more} onClose={() => setMore(false)} title={t('more')}>
        <div className="grid grid-cols-1 gap-1">
          {rest.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setMore(false)} className={cn('flex items-center gap-3 h-12 px-3 rounded-[12px] text-sm font-medium', isActive(pathname, n.href) ? 'bg-surface text-ink' : 'text-ink active:bg-hover')}>
              <n.icon size={20} />{t(n.label)}
            </Link>
          ))}
          <button onClick={() => signOut({ callbackUrl: '/login' })} className="flex items-center gap-3 h-12 px-3 rounded-[12px] text-sm font-medium text-neg active:bg-hover">
            <LogOut size={20} />{t('signOut')}
          </button>
        </div>
      </Modal>
    </>
  );
}
