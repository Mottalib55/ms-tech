'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-[10px] flex items-center justify-center bg-gradient-to-br from-[#d4a06a] via-[#f4be7e] to-[#f9d09f] animate-[breathe_2s_ease-in-out_infinite]">
            <span className="text-[#0a0a0b] font-bold text-sm">MS</span>
          </div>
          <div className="w-48 h-1 bg-[rgba(255,255,255,0.04)] rounded-full overflow-hidden">
            <div className="h-full w-1/3 bg-gradient-to-r from-[#5682f2] to-[#f4be7e] rounded-full animate-[shimmer_1.5s_ease-in-out_infinite]" />
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />
      <div className="flex-1 flex flex-col min-h-screen lg:min-w-0">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
