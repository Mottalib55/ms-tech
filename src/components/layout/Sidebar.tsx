'use client';

import { Link } from '@/i18n/navigation';
import { usePathname } from '@/i18n/navigation';
import { signOut } from 'next-auth/react';
import { ChevronLeft, LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import Logo from './Logo';
import { NAV_GROUPS, SETTINGS_ITEM, isActive, type NavItem } from './nav';

function Item({ item, pathname, collapsed }: { item: NavItem; pathname: string; collapsed: boolean }) {
  const t = useTranslations('nav');
  const label = t(item.label);
  const active = isActive(pathname, item.href);
  return (
    <Link
      href={item.href}
      prefetch
      title={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative flex items-center gap-3 h-10 px-3 rounded-[10px] text-sm font-medium transition-colors',
        active ? 'bg-surface text-ink' : 'text-muted hover:text-ink hover:bg-surface',
        collapsed && 'justify-center px-0',
      )}
    >
      <item.icon size={19} className="shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

/** Desktop only: on a phone the tab bar and the "Plus" sheet do this job. */
export default function Sidebar({ collapsed, onToggleCollapse }: { collapsed: boolean; onToggleCollapse: () => void }) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  return (
    <aside className={cn('hidden lg:flex sticky top-0 h-dvh shrink-0 flex-col border-e border-line bg-bg transition-[width] duration-200', collapsed ? 'w-[72px]' : 'w-60')}>
      <div className={cn('h-16 flex items-center px-4', collapsed && 'justify-center px-0')}>
        <Link href="/dashboard" aria-label={t('homeLink')}><Logo withName={!collapsed} /></Link>
      </div>
      <nav aria-label={t('main')} className="flex-1 overflow-y-auto px-3 py-2 space-y-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            {!collapsed && <p className="px-3 mb-1.5 text-[11px] font-medium text-subtle">{t(group.title)}</p>}
            <div className="space-y-0.5">{group.items.map((item) => <Item key={item.href} item={item} pathname={pathname} collapsed={collapsed} />)}</div>
          </div>
        ))}
      </nav>
      <div className="p-3 border-t border-line space-y-0.5">
        <Item item={SETTINGS_ITEM} pathname={pathname} collapsed={collapsed} />
        <button onClick={() => signOut({ callbackUrl: '/login' })} aria-label={t('signOut')} className={cn('flex items-center gap-3 h-10 px-3 rounded-[10px] text-sm font-medium text-muted hover:text-ink hover:bg-surface w-full transition-colors', collapsed && 'justify-center px-0')}>
          <LogOut size={19} className="shrink-0" />{!collapsed && <span>{t('signOut')}</span>}
        </button>
        <button onClick={onToggleCollapse} aria-label={collapsed ? t('expand') : t('collapse')} aria-expanded={!collapsed} className={cn('flex items-center gap-3 h-10 px-3 rounded-[10px] text-sm text-muted hover:text-ink hover:bg-surface w-full transition-colors', collapsed && 'justify-center px-0')}>
          <ChevronLeft size={19} className={cn('shrink-0 transition-transform rtl:-scale-x-100', collapsed && 'rotate-180')} />{!collapsed && <span>{t('collapseShort')}</span>}
        </button>
      </div>
    </aside>
  );
}
