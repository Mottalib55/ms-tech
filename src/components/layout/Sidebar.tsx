'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Wallet,
  PieChart,
  Receipt,
  TrendingUp,
  Calculator,
  CalendarDays,
  Settings,
  LineChart,
  LogOut,
  X,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/accounts', label: 'Comptes', icon: Wallet },
  { href: '/dashboard/portfolio', label: 'Portefeuille', icon: PieChart },
  { href: '/dashboard/fees', label: 'Frais', icon: Receipt },
  { href: '/dashboard/predict', label: 'Predict', icon: TrendingUp },
  { href: '/dashboard/budget', label: 'Budget', icon: LineChart },
  { href: '/dashboard/dividends', label: 'Dividendes', icon: CalendarDays },
  { href: '/dashboard/simulators', label: 'Simulateurs', icon: Calculator },
  { href: '/dashboard/settings', label: 'Paramètres', icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({ isOpen, onClose, collapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-[4px] z-40 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full bg-[#111113] border-r border-[rgba(255,255,255,0.04)] flex flex-col transition-all duration-[350ms] ease-[cubic-bezier(0.22,1,0.36,1)] lg:static lg:z-auto',
          collapsed ? 'lg:w-[72px]' : 'lg:w-64',
          isOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-4 h-16 border-b border-[rgba(255,255,255,0.04)]">
          <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 bg-gradient-to-br from-[#d4a06a] via-[#f4be7e] to-[#f9d09f] shadow-[0_0_16px_rgba(244,190,126,0.3)]">
              <span className="text-[#0a0a0b] font-bold text-sm">MS</span>
            </div>
            {!collapsed && (
              <span className="text-lg font-bold text-[#f5f5f5] whitespace-nowrap">MS Tech</span>
            )}
          </Link>
          <button onClick={onClose} className="lg:hidden p-1 hover:bg-[rgba(255,255,255,0.05)] rounded-[8px] text-[#6b6b73]">
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-medium transition-all duration-200 relative group',
                  isActive
                    ? 'bg-[rgba(244,190,126,0.1)] text-[#f4be7e]'
                    : 'text-[#6b6b73] hover:text-[#f5f5f5] hover:bg-[rgba(255,255,255,0.04)]',
                  collapsed && 'lg:justify-center lg:px-0'
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#f4be7e] rounded-r-full" />
                )}
                <item.icon size={20} className="shrink-0" />
                {!collapsed && <span>{item.label}</span>}
                {collapsed && (
                  <div className="hidden lg:group-hover:flex absolute left-full ml-2 px-2.5 py-1.5 bg-[rgba(20,20,22,0.95)] border border-[rgba(255,255,255,0.08)] rounded-[8px] text-xs text-[#f5f5f5] whitespace-nowrap shadow-lg z-50">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-[rgba(255,255,255,0.04)] space-y-1">
          {/* Collapse toggle (desktop only) */}
          <button
            onClick={onToggleCollapse}
            className={cn(
              'hidden lg:flex items-center gap-3 px-3 py-2 rounded-[10px] text-sm text-[#6b6b73] hover:text-[#f5f5f5] hover:bg-[rgba(255,255,255,0.04)] w-full transition-colors',
              collapsed && 'justify-center px-0'
            )}
          >
            <ChevronLeft
              size={18}
              className={cn(
                'transition-transform duration-300 shrink-0',
                collapsed && 'rotate-180'
              )}
            />
            {!collapsed && <span>Réduire</span>}
          </button>
          <button
            onClick={logout}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-medium text-[#6b6b73] hover:text-[#f5f5f5] hover:bg-[rgba(255,255,255,0.04)] w-full transition-colors',
              collapsed && 'lg:justify-center lg:px-0'
            )}
          >
            <LogOut size={20} className="shrink-0" />
            {!collapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
