'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  loading?: boolean;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  loading,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center font-medium whitespace-nowrap transition-all cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary:
      'bg-gradient-to-r from-[#d4a06a] via-[#f4be7e] to-[#f9d09f] text-[#0a0a0b] font-semibold rounded-full shadow-[0_0_24px_rgba(244,190,126,0.25)] hover:shadow-[0_0_32px_rgba(244,190,126,0.4)] hover:shadow-[0_0_36px_rgba(244,190,126,0.4)] active:scale-[0.98]',
    secondary:
      'bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.1)] text-[#f5f5f5] rounded-[10px] border border-[rgba(255,255,255,0.06)]',
    ghost:
      'hover:bg-[rgba(255,255,255,0.05)] text-[#a0a0a6] hover:text-[#f5f5f5] rounded-[10px]',
    danger:
      'bg-[#f87171]/15 hover:bg-[#f87171]/25 text-[#f87171] rounded-full border border-[#f87171]/25',
    outline:
      'border border-[#f4be7e]/40 hover:border-[#f4be7e]/70 text-[#f4be7e] rounded-full hover:bg-[#f4be7e]/5',
  };

  const sizes = {
    sm: 'px-4 text-sm h-9',
    md: 'px-5 text-sm h-11',
    lg: 'px-8 text-base h-12',
  };

  const easing = 'duration-[250ms] ease-[cubic-bezier(0.22,1,0.36,1)]';

  return (
    <button
      className={cn(base, variants[variant], sizes[size], easing, className)}
      disabled={disabled || loading}
      type={props.type ?? 'button'}
      {...props}
      aria-busy={loading || undefined}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
