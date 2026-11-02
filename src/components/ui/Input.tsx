'use client';

import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-muted">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full h-11 px-3.5 bg-bg border border-line rounded-[10px] text-base sm:text-sm text-ink placeholder-subtle',
            'focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent',
            'transition-colors duration-100',
            error && 'border-neg focus:border-neg focus:ring-neg',
            className
          )}
          {...props}
        />
        {error && <p className="text-sm text-neg">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
