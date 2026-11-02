import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'gold';
  className?: string;
}

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    default: 'bg-hover text-muted',
    success: 'bg-pos/10 text-pos',
    warning: 'bg-accent/10 text-accent',
    danger: 'bg-neg/10 text-neg',
    gold: 'bg-accent/10 text-accent',
  };

  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-[6px] text-[11px] font-medium',
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
}
