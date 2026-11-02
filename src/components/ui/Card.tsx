import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: boolean;
  /** Kept for callers; every card now looks the same. */
  variant?: 'default' | 'elevated' | 'highlighted';
  interactive?: boolean;
}

export default function Card({
  children,
  className,
  padding = true,
  interactive = false,
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[14px] bg-surface',
        padding && 'p-6',
        interactive &&
          'transition-colors duration-100 hover:bg-hover cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={cn('text-sm font-medium text-muted', className)}>
      {children}
    </h3>
  );
}
