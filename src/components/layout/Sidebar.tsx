'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { ChevronLeft, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import Logo from './Logo';
import { NAV_GROUPS, SETTINGS_ITEM, isActive, type NavItem } from './nav';

function Item({ item, pathname, collapsed }: { item: NavItem; pathname: string; collapsed: boolean }) {
  const active = isActive(pathname, item.href);
  return (
    <Link
      href={item.href}
      prefetch
      title={collapsed ? item.label : undefined}
      aria-label={collapsed ? item.label : undefined}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative flex items-center gap-3 h-10 px-3 rounded-[10px] text-sm font-medium transition-colors',
        active ? 'bg-[#f4be7e]/10 text-[#f4be7e]' : 'text-[#a0a0a6] hover:text-[#f5f5f5] hover:bg-white/[0.04]',
        collapsed && 'justify-center px-0',
      )}
    >
      {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#f4be7e] rounded-r-full" />}
      <item.icon size={19} className="shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );
}

/** Desktop only: on a phone the tab bar and the "Plus" sheet do this job. */
export default function Sidebar({ collapsed, onToggleCollapse }: { collapsed: boolean; onToggleCollapse: () => void }) {
  const pathname = usePathname();
  return (
    <aside className={cn('hidden lg:flex sticky top-0 h-dvh shrink-0 flex-col border-r border-white/[0.05] bg-[#0c0c0e] transition-[width] duration-200', collapsed ? 'w-[72px]' : 'w-60')}>
      <div className={cn('h-16 flex items-center px-4', collapsed && 'justify-center px-0')}>
        <Link href="/dashboard" aria-label="MS Tech, accueil"><Logo withName={!collapsed} /></Link>
      </div>
      <nav aria-label="Navigation principale" className="flex-1 overflow-y-auto px-3 py-2 space-y-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            {!collapsed && <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8e8e98]">{group.title}</p>}
            <div className="space-y-0.5">{group.items.map((item) => <Item key={item.href} item={item} pathname={pathname} collapsed={collapsed} />)}</div>
          </div>
        ))}
      </nav>
      <div className="p-3 border-t border-white/[0.05] space-y-0.5">
        <Item item={SETTINGS_ITEM} pathname={pathname} collapsed={collapsed} />
        <button onClick={() => signOut({ callbackUrl: '/login' })} aria-label="Se déconnecter" className={cn('flex items-center gap-3 h-10 px-3 rounded-[10px] text-sm font-medium text-[#a0a0a6] hover:text-[#f5f5f5] hover:bg-white/[0.04] w-full transition-colors', collapsed && 'justify-center px-0')}>
          <LogOut size={19} className="shrink-0" />{!collapsed && <span>Déconnexion</span>}
        </button>
        <button onClick={onToggleCollapse} aria-label={collapsed ? 'Déplier le menu' : 'Réduire le menu'} aria-expanded={!collapsed} className={cn('flex items-center gap-3 h-10 px-3 rounded-[10px] text-sm text-[#a0a0a6] hover:text-[#f5f5f5] hover:bg-white/[0.04] w-full transition-colors', collapsed && 'justify-center px-0')}>
          <ChevronLeft size={19} className={cn('shrink-0 transition-transform', collapsed && 'rotate-180')} />{!collapsed && <span>Réduire</span>}
        </button>
      </div>
    </aside>
  );
}
