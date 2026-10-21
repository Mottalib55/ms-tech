'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
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
    'inline-flex items-center justify-center font-medium transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary:
      'bg-gradient-to-r from-[#d4a06a] via-[#f4be7e] to-[#f9d09f] text-[#0a0a0b] font-semibold rounded-full shadow-[0_0_24px_rgba(244,190,126,0.25)] hover:shadow-[0_0_32px_rgba(244,190,126,0.4)] hover:-translate-y-[1px]',
    secondary:
      'bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.1)] text-[#f5f5f5] rounded-[10px] border border-[rgba(255,255,255,0.06)]',
    ghost:
      'hover:bg-[rgba(255,255,255,0.05)] text-[#a0a0a6] hover:text-[#f5f5f5] rounded-[10px]',
    outline:
      'border border-[#f4be7e]/40 hover:border-[#f4be7e]/70 text-[#f4be7e] rounded-full hover:bg-[#f4be7e]/5',
  };

  const sizes = {
    sm: 'px-4 py-1.5 text-sm h-8',
    md: 'px-5 py-2.5 text-sm h-10',
    lg: 'px-8 py-3 text-base h-12',
  };

  const easing = 'duration-[250ms] ease-[cubic-bezier(0.22,1,0.36,1)]';

  return (
    <button
      className={cn(base, variants[variant], sizes[size], easing, className)}
      disabled={disabled || loading}
      {...props}
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
