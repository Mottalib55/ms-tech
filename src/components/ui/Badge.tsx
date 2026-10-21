import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'gold';
  className?: string;
}

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    default: 'bg-[rgba(255,255,255,0.06)] text-[#a0a0a6] border-[rgba(255,255,255,0.06)]',
    success: 'bg-[#34d399]/10 text-[#34d399] border-[#34d399]/15',
    warning: 'bg-[#f4be7e]/10 text-[#f4be7e] border-[#f4be7e]/15',
    danger: 'bg-[#f87171]/10 text-[#f87171] border-[#f87171]/15',
    gold: 'bg-[#f4be7e]/10 text-[#f4be7e] border-[#f4be7e]/20',
  };

  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-[8px] text-[11px] font-medium border',
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
}
