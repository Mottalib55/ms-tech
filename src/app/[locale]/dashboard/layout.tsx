'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import TabBar from '@/components/layout/TabBar';
import NativeShell from '@/components/NativeShell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('common');
  const [collapsed, setCollapsed] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    // Read after hydration: the server cannot know this preference.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCollapsed(localStorage.getItem('ms-sidebar') === '1');
  }, []);
  const toggle = () => setCollapsed((c) => { localStorage.setItem('ms-sidebar', c ? '0' : '1'); return !c; });

  return (
    <div className="min-h-dvh flex">
      <NativeShell />
      <Sidebar collapsed={collapsed} onToggleCollapse={toggle} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar />
        {session?.user?.isDemo && (
          <div className="bg-surface border-b border-line px-4 py-2 text-xs text-muted text-center">
            {t('demoBanner')} <Link href="/register" className="underline font-medium text-ink">{t('createAccount')}</Link>
          </div>
        )}
        <main className="flex-1 p-4 lg:p-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-8 w-full max-w-[1400px] mx-auto">{children}</main>
      </div>
      <TabBar />
    </div>
  );
}
