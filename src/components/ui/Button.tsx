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
    'inline-flex items-center justify-center font-medium whitespace-nowrap rounded-[10px] transition-colors duration-100 cursor-pointer select-none active:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-primary text-on-primary hover:opacity-90',
    secondary: 'bg-surface hover:bg-hover text-ink border border-line',
    ghost: 'hover:bg-hover text-muted hover:text-ink',
    danger: 'bg-neg/10 hover:bg-neg/15 text-neg',
    outline: 'border border-line hover:bg-surface text-ink',
  };

  const sizes = {
    sm: 'px-3.5 text-sm h-9',
    md: 'px-4 text-sm h-11',
    lg: 'px-6 text-base h-12',
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      type={props.type ?? 'button'}
      {...props}
      aria-busy={loading || undefined}
    >
      {loading && (
        <svg className="animate-spin -ms-1 me-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
