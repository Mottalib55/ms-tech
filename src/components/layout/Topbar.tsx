'use client';

import { Menu, Bell, Search } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface TopbarProps {
  onMenuClick: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <header className="sticky top-2 z-30 mx-3 lg:mx-4 mt-2 mb-2">
      <div className="h-14 bg-[rgba(20,20,22,0.7)] border border-[rgba(255,255,255,0.06)] backdrop-blur-[20px] backdrop-saturate-[160%] rounded-[16px] flex items-center justify-between px-4 shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-[rgba(255,255,255,0.05)] rounded-[10px] text-[#6b6b73] hover:text-[#f5f5f5] transition-colors duration-200"
          >
            <Menu size={20} />
          </button>
          <div className="hidden sm:flex items-center gap-2 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] rounded-[12px] px-3 py-2 w-56 focus-within:w-72 focus-within:border-[#f4be7e]/30 transition-all duration-[350ms] ease-[cubic-bezier(0.22,1,0.36,1)]">
            <Search size={15} className="text-[#6b6b73] shrink-0" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="bg-transparent text-sm text-[#f5f5f5] placeholder-[#6b6b73] focus:outline-none flex-1"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-[rgba(255,255,255,0.05)] rounded-[10px] text-[#6b6b73] hover:text-[#f5f5f5] transition-colors duration-200 relative">
            <Bell size={19} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#f4be7e] rounded-full animate-[pulseGlow_2s_ease-in-out_infinite]" />
          </button>
          <div className="flex items-center gap-3 pl-3 border-l border-[rgba(255,255,255,0.06)]">
            <div className="w-8 h-8 rounded-full flex items-center justify-center ring-2 ring-[#f4be7e]/30 bg-[rgba(244,190,126,0.1)]">
              <span className="text-[#f4be7e] text-sm font-medium">
                {user?.name?.charAt(0) || 'U'}
              </span>
            </div>
            <span className="text-sm font-medium text-[#f5f5f5] hidden sm:block">
              {user?.name || 'Utilisateur'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
