import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: boolean;
  variant?: 'default' | 'elevated' | 'highlighted';
  interactive?: boolean;
}

export default function Card({
  children,
  className,
  padding = true,
  variant = 'default',
  interactive = false,
}: CardProps) {
  const variants = {
    default:
      'bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] backdrop-blur-[12px]',
    elevated:
      'bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] backdrop-blur-[16px] shadow-[0_0_40px_rgba(244,190,126,0.06)]',
    highlighted:
      'bg-[rgba(255,255,255,0.04)] border border-[rgba(244,190,126,0.15)] backdrop-blur-[16px] shadow-[0_0_60px_rgba(244,190,126,0.08)]',
  };

  return (
    <div
      className={cn(
        'rounded-[16px] transition-all duration-[350ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
        variants[variant],
        padding && 'p-6',
        interactive &&
          'hover:scale-[1.01] hover:shadow-[0_0_60px_rgba(244,190,126,0.12)] hover:border-[rgba(244,190,126,0.2)] cursor-pointer',
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
    <h3 className={cn('text-sm font-medium text-[#a0a0a6]', className)}>
      {children}
    </h3>
  );
}
